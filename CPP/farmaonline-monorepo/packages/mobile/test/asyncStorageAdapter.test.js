import test from "node:test";
import assert from "node:assert/strict";
import { MedicinesService } from "@farmaonline/core";
import { AsyncStorageAdapter, STORAGE_KEY } from "../asyncStorageAdapter.js";

// Підставний об'єкт замість AsyncStorage (його методи повертають Promise)
function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: async (key) => (key in data ? data[key] : null),
    setItem: async (key, value) => {
      data[key] = String(value);
    },
  };
}

test("load повертає порожній масив, якщо сховище порожнє", async () => {
  assert.deepEqual(await new AsyncStorageAdapter(fakeStorage()).load(), []);
});

test("save записує JSON, а load читає його назад", async () => {
  const storage = fakeStorage();
  const adapter = new AsyncStorageAdapter(storage);
  const items = [{ id: 1, name: "Аспірин", price: 20, quantity: 3 }];
  await adapter.save(items);
  assert.deepEqual(JSON.parse(storage.data[STORAGE_KEY]), items);
  assert.deepEqual(await adapter.load(), items);
});

test("load повертає [] для пошкодженого JSON та для не-масиву", async () => {
  assert.deepEqual(await new AsyncStorageAdapter(fakeStorage({ [STORAGE_KEY]: "{ не JSON" })).load(), []);
  assert.deepEqual(await new AsyncStorageAdapter(fakeStorage({ [STORAGE_KEY]: '{"a":1}' })).load(), []);
});

test("адаптер працює зі спільним MedicinesService і діють правила ядра", async () => {
  const storage = fakeStorage();
  const service = new MedicinesService(new AsyncStorageAdapter(storage));
  assert.equal((await service.add({ name: "12345", price: "10", quantity: "1" })).ok, false);
  assert.equal((await service.add({ name: "Нурофен", price: "30", quantity: "2" })).ok, true);
  // новий сервіс над тим самим сховищем бачить дані (імітація перезапуску застосунку)
  const reloaded = new MedicinesService(new AsyncStorageAdapter(storage));
  assert.equal((await reloaded.list()).length, 1);
});
