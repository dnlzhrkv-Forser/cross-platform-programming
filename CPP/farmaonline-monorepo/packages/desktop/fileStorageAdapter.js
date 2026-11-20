import fs from "node:fs";
import path from "node:path";
import { MedicineStorageAdapter } from "@farmaonline/core";

// Десктопний адаптер: зберігає масив препаратів у JSON-файлі за переданим шляхом.
// Модуль не залежить від Electron, тому тестується звичайним node --test.
export class FileStorageAdapter extends MedicineStorageAdapter {
  #filePath;

  constructor(filePath) {
    super();
    this.#filePath = filePath;
  }

  load() {
    if (!fs.existsSync(this.#filePath)) return [];
    try {
      const data = JSON.parse(fs.readFileSync(this.#filePath, "utf-8"));
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  save(medicines) {
    fs.mkdirSync(path.dirname(this.#filePath), { recursive: true });
    fs.writeFileSync(this.#filePath, JSON.stringify(medicines, null, 2), "utf-8");
  }
}
