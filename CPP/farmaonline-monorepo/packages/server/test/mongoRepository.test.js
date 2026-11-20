import { test } from "node:test";
import assert from "node:assert/strict";
import { PharmacyService } from "@farmaonline/core";
import { MongoPharmacyRepository, toMedicine } from "../mongoRepository.js";

// Мінімальна імітація моделі Mongoose: перевіряємо, що адаптер правильно
// викликає методи моделі та перетворює документи на об'єкти ядра.
function fakeModel() {
  const rows = [];
  let n = 0;
  const oid = () => (++n).toString(16).padStart(24, "0");
  const wrap = (row) => ({ ...row, toObject: () => ({ ...row }) });
  const query = (list) => {
    const p = Promise.resolve(list.map(wrap));
    p.sort = ({ createdAt }) => Promise.resolve([...list].sort((a, b) => (a.createdAt - b.createdAt) * -createdAt).map(wrap));
    return p;
  };
  return {
    rows,
    find: (filter) => query(filter?._id ? rows.filter((r) => filter._id.$in.includes(r._id)) : rows),
    findById: async (id) => { const r = rows.find((x) => x._id === id); return r ? wrap(r) : null; },
    create: async (data) => { const r = { ...data, _id: oid(), createdAt: new Date(data.createdAt) }; rows.push(r); return wrap(r); },
    insertMany: async (list) => Promise.all(list.map((d) => { const r = { ...d, _id: oid(), createdAt: new Date(d.createdAt) }; rows.push(r); return wrap(r); })),
    findByIdAndUpdate: async (id, fields) => { const r = rows.find((x) => x._id === id); if (!r) return null; Object.assign(r, fields); return wrap(r); },
    findByIdAndDelete: async (id) => { const i = rows.findIndex((x) => x._id === id); return i === -1 ? null : wrap(rows.splice(i, 1)[0]); },
    countDocuments: async () => rows.length,
  };
}

const input = { name: "Ібупрофен", category: "Знеболювальні", manufacturer: "Фармак", price: 62 };
const customer = { name: "Іван", phone: "0501234567", address: "Київ, Хрещатик, 1" };

function make() {
  let t = 0;
  const repo = new MongoPharmacyRepository({ Medicine: fakeModel(), Order: fakeModel() });
  return new PharmacyService(repo, { now: () => new Date(Date.UTC(2026, 0, 1, 0, 0, t++)) });
}

test("сервіс ядра працює з адаптером Mongo так само, як із пам'яттю", async () => {
  const s = make();
  const { medicine } = await s.addMedicine(input);
  assert.match(medicine.id, /^[a-f\d]{24}$/);
  assert.equal(typeof medicine.createdAt, "string");

  await s.addMedicine({ ...input, name: "Цитрамон" });
  assert.deepEqual((await s.listMedicines()).map((m) => m.name), ["Цитрамон", "Ібупрофен"]);

  assert.equal((await s.updateMedicine(medicine.id, { ...input, price: 99 })).medicine.price, 99);
  const order = await s.createOrder({ ...customer, items: [{ id: medicine.id, qty: 2 }] });
  assert.equal(order.order.total, 198);
  assert.equal((await s.listOrders())[0].items[0].medicine, medicine.id);
  assert.equal((await s.removeMedicine(medicine.id)).ok, true);
});

test("некоректні ObjectId не доходять до бази", async () => {
  const s = make();
  assert.equal((await s.getMedicine("не-id")).code, "not_found");
  assert.equal((await s.removeMedicine("123")).code, "not_found");
  assert.equal((await s.updateMedicine("abc", input)).code, "not_found");
  assert.equal((await s.createOrder({ ...customer, items: [{ id: "abc", qty: 1 }] })).code, "validation");
});

test("toMedicine: _id -> id, дата -> ISO, значення за замовчуванням", () => {
  const m = toMedicine({ _id: "abc", name: "x", category: "y", manufacturer: "z", price: 1, createdAt: new Date(0) });
  assert.equal(m.id, "abc");
  assert.equal(m.createdAt, "1970-01-01T00:00:00.000Z");
  assert.equal(m.prescriptionRequired, false);
  assert.equal(m.description, "");
});
