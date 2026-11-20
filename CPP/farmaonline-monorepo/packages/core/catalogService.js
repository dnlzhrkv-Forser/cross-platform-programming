import { validateCatalogItem, validateCustomer, CATALOG_ERRORS, MAX_ORDER_QTY } from "./catalogValidation.js";

export const ERROR_MEDICINE_NOT_FOUND = "Препарат не знайдено.";
export const ERROR_ITEMS_NOT_FOUND = "Товари з кошика не знайдено в базі.";

// ---- Інтерфейс репозиторію. Ядро не знає, де зберігаються дані ----
// Реалізації: MemoryPharmacyRepository (тести), MongoPharmacyRepository (пакет server).
export class PharmacyRepository {
  async findAll() { throw new Error("Метод findAll() не реалізовано."); }
  async findById(id) { throw new Error("Метод findById() не реалізовано."); }
  async findByIds(ids) { throw new Error("Метод findByIds() не реалізовано."); }
  async insert(medicine) { throw new Error("Метод insert() не реалізовано."); }
  async insertMany(medicines) { throw new Error("Метод insertMany() не реалізовано."); }
  async update(id, fields) { throw new Error("Метод update() не реалізовано."); }
  async remove(id) { throw new Error("Метод remove() не реалізовано."); }
  async count() { throw new Error("Метод count() не реалізовано."); }
  async insertOrder(order) { throw new Error("Метод insertOrder() не реалізовано."); }
  async findOrders() { throw new Error("Метод findOrders() не реалізовано."); }
}

// Зберігає дані в пам'яті (для тестів і прототипів)
export class MemoryPharmacyRepository extends PharmacyRepository {
  #medicines = [];
  #orders = [];
  #seq = 0;

  #id(prefix) {
    this.#seq += 1;
    return `${prefix}${String(this.#seq).padStart(6, "0")}`;
  }

  async findAll() { return this.#medicines.map((m) => ({ ...m })); }
  async findById(id) {
    const found = this.#medicines.find((m) => m.id === id);
    return found ? { ...found } : null;
  }
  async findByIds(ids) {
    return this.#medicines.filter((m) => ids.includes(m.id)).map((m) => ({ ...m }));
  }
  async insert(medicine) {
    const saved = { ...medicine, id: this.#id("med") };
    this.#medicines.push(saved);
    return { ...saved };
  }
  async insertMany(medicines) {
    const result = [];
    for (const medicine of medicines) result.push(await this.insert(medicine));
    return result;
  }
  async update(id, fields) {
    const index = this.#medicines.findIndex((m) => m.id === id);
    if (index === -1) return null;
    this.#medicines[index] = { ...this.#medicines[index], ...fields, id };
    return { ...this.#medicines[index] };
  }
  async remove(id) {
    const before = this.#medicines.length;
    this.#medicines = this.#medicines.filter((m) => m.id !== id);
    return this.#medicines.length < before;
  }
  async count() { return this.#medicines.length; }
  async insertOrder(order) {
    const saved = { ...order, id: this.#id("ord") };
    this.#orders.push(saved);
    return { ...saved };
  }
  async findOrders() { return this.#orders.map((o) => ({ ...o })); }
}

// ---- Уся логіка аптеки. Репозиторій передається ззовні (dependency injection) ----
export class PharmacyService {
  #repo;
  #now;

  constructor(repo, { now = () => new Date() } = {}) {
    this.#repo = repo;
    this.#now = now;
  }

  // Новіші першими
  async listMedicines() {
    const items = await this.#repo.findAll();
    return items.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  async getMedicine(id) {
    const medicine = await this.#repo.findById(id);
    return medicine ? { ok: true, medicine } : { ok: false, code: "not_found", error: ERROR_MEDICINE_NOT_FOUND };
  }

  async addMedicine(input) {
    const validation = validateCatalogItem(input);
    if (!validation.isValid) return { ok: false, code: "validation", error: validation.error };
    const medicine = await this.#repo.insert({ ...validation.value, createdAt: this.#now().toISOString() });
    return { ok: true, medicine };
  }

  async updateMedicine(id, input) {
    const validation = validateCatalogItem(input);
    if (!validation.isValid) return { ok: false, code: "validation", error: validation.error };
    const medicine = await this.#repo.update(id, validation.value);
    return medicine ? { ok: true, medicine } : { ok: false, code: "not_found", error: ERROR_MEDICINE_NOT_FOUND };
  }

  async removeMedicine(id) {
    const removed = await this.#repo.remove(id);
    return removed ? { ok: true } : { ok: false, code: "not_found", error: ERROR_MEDICINE_NOT_FOUND };
  }

  // Початкові дані: додаються лише в порожню колекцію
  async seed(medicines) {
    if ((await this.#repo.count()) > 0) return { seeded: 0 };
    const now = this.#now().toISOString();
    const saved = await this.#repo.insertMany(medicines.map((m) => ({ ...m, createdAt: now })));
    return { seeded: saved.length };
  }

  // Замовлення: ціни беруться з бази, а не з клієнта
  async createOrder({ name, phone, address, items } = {}) {
    const customer = validateCustomer({ name, phone, address });
    if (!customer.isValid) return { ok: false, code: "validation", error: customer.error };
    if (!Array.isArray(items) || items.length === 0) {
      return { ok: false, code: "validation", error: CATALOG_ERRORS.emptyOrder };
    }

    const found = await this.#repo.findByIds(items.map((item) => String(item?.id)));
    const lines = items
      .map((item) => {
        const medicine = found.find((m) => m.id === String(item?.id));
        if (!medicine) return null;
        const qty = Math.min(Math.max(1, parseInt(item.qty, 10) || 1), MAX_ORDER_QTY);
        return { medicine: medicine.id, name: medicine.name, price: medicine.price, qty };
      })
      .filter(Boolean);
    if (lines.length === 0) return { ok: false, code: "validation", error: ERROR_ITEMS_NOT_FOUND };

    const total = Math.round(lines.reduce((sum, line) => sum + line.price * line.qty, 0) * 100) / 100;
    const order = await this.#repo.insertOrder({
      ...customer.value,
      items: lines,
      total,
      createdAt: this.#now().toISOString(),
    });
    return { ok: true, order };
  }

  async listOrders() {
    const orders = await this.#repo.findOrders();
    return orders.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }
}
