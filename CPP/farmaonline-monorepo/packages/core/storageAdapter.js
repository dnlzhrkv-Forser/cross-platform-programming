// Інтерфейс адаптера сховища. Ядро не знає, де саме зберігаються дані.
export class MedicineStorageAdapter {
  load() {
    throw new Error("Метод load() не реалізовано.");
  }

  save(medicines) {
    throw new Error("Метод save() не реалізовано.");
  }
}

// Зберігає дані в пам'яті (для тестів і прототипів)
export class MemoryStorageAdapter extends MedicineStorageAdapter {
  #medicines;

  constructor(initial = []) {
    super();
    this.#medicines = [...initial];
  }

  load() {
    return [...this.#medicines];
  }

  save(medicines) {
    this.#medicines = [...medicines];
  }
}
