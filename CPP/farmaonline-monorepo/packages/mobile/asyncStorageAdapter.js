import { MedicineStorageAdapter } from "@farmaonline/core";

export const STORAGE_KEY = "farmaonline-medicines";

// Мобільний адаптер: зберігає масив препаратів в AsyncStorage на пристрої у форматі JSON.
// Сховище передається в конструктор (у застосунку — AsyncStorage, у тестах — простий об'єкт),
// тому файл не залежить від React Native і перевіряється звичайним node --test.
export class AsyncStorageAdapter extends MedicineStorageAdapter {
  #storage;

  constructor(storage) {
    super();
    this.#storage = storage;
  }

  async load() {
    try {
      const data = JSON.parse((await this.#storage.getItem(STORAGE_KEY)) ?? "[]");
      return Array.isArray(data) ? data : [];
    } catch {
      return []; // пошкоджений JSON не ламає застосунок
    }
  }

  async save(medicines) {
    await this.#storage.setItem(STORAGE_KEY, JSON.stringify(medicines));
  }
}
