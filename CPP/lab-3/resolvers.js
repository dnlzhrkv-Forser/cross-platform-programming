import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { GraphQLError } from 'graphql';
import { users, getNextUserId } from './data.js';
import { createToken } from './auth.js';
import Medicine from './models/Medicine.js';
import Order from './models/Order.js';

const fail = (message, code) => new GraphQLError(message, { extensions: { code } });

// Захищені операції: потрібен авторизований користувач (context.user)
function requireUser(context) {
  if (!context.user) throw fail('Потрібна авторизація.', 'UNAUTHENTICATED');
  return context.user;
}

// Препарати й замовлення лежать у MongoDB — без підключення виводимо зрозумілу помилку
function requireDB() {
  if (mongoose.connection.readyState !== 1) {
    throw fail(
      'Немає підключення до MongoDB. Перевірте MONGO_URI у .env та Network Access в Atlas.',
      'DB_UNAVAILABLE'
    );
  }
}

const isEmpty = (v) => typeof v !== 'string' || v.trim() === '';

// Та сама перевірка полів препарату, що й у middleware/validateMedicine.js (ЛР №2)
function validateMedicine({ name, category, manufacturer, price }) {
  if (isEmpty(name) || isEmpty(category) || isEmpty(manufacturer)) {
    throw fail(
      "Поля name, category та manufacturer обов'язкові й не можуть бути порожніми.",
      'BAD_USER_INPUT'
    );
  }
  if (!Number.isFinite(price) || price < 0) {
    throw fail("Поле price має бути невід'ємним числом.", 'BAD_USER_INPUT');
  }
}

const medicineFields = (a) => ({
  name: a.name.trim(),
  category: a.category.trim(),
  manufacturer: a.manufacturer.trim(),
  price: a.price,
  prescriptionRequired: a.prescriptionRequired,
  description: a.description.trim(),
});

export const resolvers = {
  Query: {
    users: () => users,
    me: (parent, args, context) => context.user,

    medicines: async () => {
      requireDB();
      return Medicine.find().sort({ createdAt: -1 });
    },

    medicine: async (parent, { id }) => {
      requireDB();
      if (!mongoose.isValidObjectId(id)) throw fail('Некоректний id', 'BAD_USER_INPUT');
      return Medicine.findById(id);
    },

    orders: async (parent, args, context) => {
      requireUser(context);
      requireDB();
      return Order.find().sort({ createdAt: -1 });
    },
  },

  Mutation: {
    register: async (parent, { name, email, password }) => {
      if (isEmpty(name) || isEmpty(email) || isEmpty(password)) {
        throw fail("Поля name, email та password обов'язкові.", 'BAD_USER_INPUT');
      }
      const normalizedEmail = email.trim().toLowerCase();
      if (users.some((u) => u.email === normalizedEmail)) {
        throw fail('Користувач з таким email вже існує.', 'BAD_USER_INPUT');
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const user = { id: getNextUserId(), name: name.trim(), email: normalizedEmail, passwordHash };
      users.push(user);
      return { token: createToken(user), user };
    },

    login: async (parent, { email, password }) => {
      const user = users.find((u) => u.email === email.trim().toLowerCase());
      const ok = user && (await bcrypt.compare(password, user.passwordHash));
      if (!ok) throw fail('Неправильний email або пароль.', 'UNAUTHENTICATED');
      return { token: createToken(user), user };
    },

    createMedicine: async (parent, args, context) => {
      const user = requireUser(context);
      validateMedicine(args);
      requireDB();
      // власник визначається за токеном, а не передається клієнтом
      return Medicine.create({ ...medicineFields(args), owner: user.id });
    },

    updateMedicine: async (parent, args, context) => {
      requireUser(context);
      validateMedicine(args);
      requireDB();
      if (!mongoose.isValidObjectId(args.id)) throw fail('Некоректний id', 'BAD_USER_INPUT');
      const medicine = await Medicine.findByIdAndUpdate(args.id, medicineFields(args), {
        new: true,
        runValidators: true,
      });
      if (!medicine) throw fail('Препарат не знайдено', 'NOT_FOUND');
      return medicine;
    },

    deleteMedicine: async (parent, { id }, context) => {
      requireUser(context);
      requireDB();
      if (!mongoose.isValidObjectId(id)) return false;
      return Boolean(await Medicine.findByIdAndDelete(id));
    },

    // Оформлення замовлення відкрите для всіх (як у REST-версії); ціни беруться з бази, а не з клієнта
    createOrder: async (parent, { name, phone, address, items }) => {
      if (isEmpty(name) || isEmpty(phone) || isEmpty(address) || !items.length) {
        throw fail("Вкажіть ім'я, телефон, адресу та додайте товари до кошика", 'BAD_USER_INPUT');
      }
      requireDB();
      const ids = items.map((i) => i.id).filter((id) => mongoose.isValidObjectId(id));
      const meds = await Medicine.find({ _id: { $in: ids } });
      const lines = items
        .map((i) => {
          const m = meds.find((x) => x.id === i.id);
          return m && { medicine: m._id, name: m.name, price: m.price, qty: Math.max(1, i.qty) };
        })
        .filter(Boolean);
      if (!lines.length) throw fail('Товари з кошика не знайдено в базі', 'BAD_USER_INPUT');
      const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
      return Order.create({ name: name.trim(), phone: phone.trim(), address: address.trim(), items: lines, total });
    },
  },

  Medicine: {
    // parent — документ препарату; шукаємо власника за збереженим id
    owner: (parent) => (parent.owner ? users.find((u) => u.id === parent.owner) || null : null),
    createdAt: (parent) => parent.createdAt.toISOString(),
  },

  Order: {
    createdAt: (parent) => parent.createdAt.toISOString(),
  },
};
