import { validateMedicine } from "./medicineValidation.js";
import {
  calcTotal,
  createMedicine,
  filterMedicinesByQuery,
  sanitizeMedicines,
  sortMedicinesByDate,
} from "./medicineUtils.js";

export const ERROR_NOT_FOUND = "Препарат не знайдено.";

// Уся логіка застосунку. Адаптер сховища передається ззовні (dependency injection).
export class MedicinesService {
  #adapter;
  #now;
  #lastId = 0;

  constructor(adapter, { now = () => new Date() } = {}) {
    this.#adapter = adapter;
    this.#now = now;
  }

  async #read() {
    return sanitizeMedicines(await this.#adapter.load());
  }

  // Унікальний id навіть за однакового часу створення
  #nextId(medicines) {
    const maxExisting = medicines.reduce((max, item) => Math.max(max, item.id), 0);
    this.#lastId = Math.max(this.#now().getTime(), this.#lastId + 1, maxExisting + 1);
    return this.#lastId;
  }

  // Список: відфільтрований за запитом і відсортований (новіші першими)
  async list(query = "") {
    const medicines = await this.#read();
    return sortMedicinesByDate(filterMedicinesByQuery(medicines, query));
  }

  // Кількість препаратів і загальна сума для поточного запиту
  async summary(query = "") {
    const medicines = filterMedicinesByQuery(await this.#read(), query);
    return { count: medicines.length, total: calcTotal(medicines) };
  }

  async add(input) {
    const validation = validateMedicine(input);
    if (!validation.isValid) {
      return { ok: false, error: validation.error };
    }
    const medicines = await this.#read();
    const medicine = createMedicine(validation.value, this.#nextId(medicines), this.#now());
    await this.#adapter.save([...medicines, medicine]);
    return { ok: true, medicine };
  }

  async remove(id) {
    const medicines = await this.#read();
    const remaining = medicines.filter((item) => item.id !== id);
    if (remaining.length === medicines.length) {
      return { ok: false, error: ERROR_NOT_FOUND };
    }
    await this.#adapter.save(remaining);
    return { ok: true };
  }
}
