import { PharmacyRepository } from "@farmaonline/core";

const iso = (value) => (value instanceof Date ? value.toISOString() : value);
const isObjectId = (id) => /^[a-f\d]{24}$/i.test(String(id));

// Документ Mongo -> простий об'єкт ядра (рядковий id, дати у форматі ISO)
export function toMedicine(doc) {
  const raw = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    id: String(raw._id),
    name: raw.name,
    category: raw.category,
    manufacturer: raw.manufacturer,
    price: raw.price,
    prescriptionRequired: Boolean(raw.prescriptionRequired),
    description: raw.description ?? "",
    createdAt: iso(raw.createdAt),
    updatedAt: iso(raw.updatedAt),
  };
}

export function toOrder(doc) {
  const raw = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    id: String(raw._id),
    name: raw.name,
    phone: raw.phone,
    address: raw.address,
    items: (raw.items ?? []).map((line) => ({
      medicine: line.medicine ? String(line.medicine) : null,
      name: line.name,
      price: line.price,
      qty: line.qty,
    })),
    total: raw.total,
    createdAt: iso(raw.createdAt),
  };
}

// Адаптер MongoDB для ядра: реалізує той самий інтерфейс, що й MemoryPharmacyRepository
export class MongoPharmacyRepository extends PharmacyRepository {
  #Medicine;
  #Order;

  constructor({ Medicine, Order }) {
    super();
    this.#Medicine = Medicine;
    this.#Order = Order;
  }

  async findAll() {
    return (await this.#Medicine.find().sort({ createdAt: -1 })).map(toMedicine);
  }

  async findById(id) {
    if (!isObjectId(id)) return null;
    const doc = await this.#Medicine.findById(id);
    return doc ? toMedicine(doc) : null;
  }

  async findByIds(ids) {
    const valid = ids.filter(isObjectId);
    if (valid.length === 0) return [];
    return (await this.#Medicine.find({ _id: { $in: valid } })).map(toMedicine);
  }

  async insert(medicine) {
    return toMedicine(await this.#Medicine.create(medicine));
  }

  async insertMany(medicines) {
    return (await this.#Medicine.insertMany(medicines)).map(toMedicine);
  }

  async update(id, fields) {
    if (!isObjectId(id)) return null;
    const doc = await this.#Medicine.findByIdAndUpdate(id, fields, { new: true, runValidators: true });
    return doc ? toMedicine(doc) : null;
  }

  async remove(id) {
    if (!isObjectId(id)) return false;
    return Boolean(await this.#Medicine.findByIdAndDelete(id));
  }

  async count() {
    return this.#Medicine.countDocuments();
  }

  async insertOrder(order) {
    return toOrder(await this.#Order.create(order));
  }

  async findOrders() {
    return (await this.#Order.find().sort({ createdAt: -1 })).map(toOrder);
  }
}
