import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { MedicinesService } from "@farmaonline/core";
import { FileStorageAdapter } from "../fileStorageAdapter.js";

async function tempFile(name = "medicines.json") {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "farmaonline-"));
  return { dir, file: path.join(dir, name) };
}

test("load повертає [], якщо файлу немає", async () => {
  const { dir, file } = await tempFile();
  try {
    assert.deepEqual(new FileStorageAdapter(file).load(), []);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test("save створює теку та файл, load читає дані назад", async () => {
  const { dir } = await tempFile();
  const file = path.join(dir, "вкладена", "тека", "medicines.json");
  try {
    const adapter = new FileStorageAdapter(file);
    const items = [{ id: 1, name: "Аспірин", price: 20, quantity: 3 }];
    adapter.save(items);
    assert.deepEqual(adapter.load(), items);
    assert.equal(JSON.parse(await fs.readFile(file, "utf-8"))[0].name, "Аспірин");
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test("load повертає [] для пошкодженого файлу", async () => {
  const { dir, file } = await tempFile();
  try {
    await fs.writeFile(file, "{ це не JSON", "utf-8");
    assert.deepEqual(new FileStorageAdapter(file).load(), []);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test("адаптер працює зі спільним MedicinesService", async () => {
  const { dir, file } = await tempFile();
  try {
    const service = new MedicinesService(new FileStorageAdapter(file));
    await service.add({ name: "Нурофен", price: "30", quantity: 2 });
    // другий сервіс над тим самим файлом бачить збережені дані (імітація перезапуску)
    const restarted = new MedicinesService(new FileStorageAdapter(file));
    assert.equal((await restarted.list()).length, 1);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
