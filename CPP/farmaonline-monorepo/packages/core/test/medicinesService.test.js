import test from "node:test";
import assert from "node:assert/strict";
import {
  ERROR_EMPTY,
  ERROR_NOT_FOUND,
  MedicineStorageAdapter,
  MedicinesService,
  MemoryStorageAdapter,
} from "../index.js";

const validInput = { name: "Парацетамол 500 мг", price: "45,50", quantity: "2" };

test("add зберігає препарат в адаптері", async () => {
  const adapter = new MemoryStorageAdapter();
  const service = new MedicinesService(adapter);
  const result = await service.add(validInput);
  assert.equal(result.ok, true);
  assert.equal(result.medicine.price, 45.5);
  assert.equal(adapter.load().length, 1);
});

test("add не зберігає некоректний препарат і повертає повідомлення про помилку", async () => {
  const adapter = new MemoryStorageAdapter();
  const service = new MedicinesService(adapter);
  const result = await service.add({ ...validInput, name: "   " });
  assert.deepEqual(result, { ok: false, error: ERROR_EMPTY });
  assert.equal(adapter.load().length, 0);
});

test("add видає унікальні id навіть за однакового часу", async () => {
  const fixed = new Date("2026-11-06T12:00:00Z");
  const service = new MedicinesService(new MemoryStorageAdapter(), { now: () => fixed });
  const ids = new Set();
  for (let i = 0; i < 5; i += 1) {
    ids.add((await service.add(validInput)).medicine.id);
  }
  assert.equal(ids.size, 5);
});

test("remove видаляє препарат за id", async () => {
  const service = new MedicinesService(new MemoryStorageAdapter());
  const { medicine } = await service.add(validInput);
  assert.deepEqual(await service.remove(medicine.id), { ok: true });
  assert.equal((await service.list()).length, 0);
});

test("remove повідомляє, якщо препарату немає", async () => {
  const service = new MedicinesService(new MemoryStorageAdapter());
  assert.deepEqual(await service.remove(12345), { ok: false, error: ERROR_NOT_FOUND });
});

test("list повертає препарати від новіших до старіших і підтримує пошук", async () => {
  let current = new Date("2026-11-01T10:00:00Z");
  const service = new MedicinesService(new MemoryStorageAdapter(), { now: () => current });
  await service.add({ name: "Аспірин", price: 20, quantity: 1 });
  current = new Date("2026-11-02T10:00:00Z");
  await service.add({ name: "Нурофен", price: 30, quantity: 1 });
  assert.deepEqual((await service.list()).map((m) => m.name), ["Нурофен", "Аспірин"]);
  assert.deepEqual((await service.list("аспі")).map((m) => m.name), ["Аспірин"]);
});

test("list ігнорує пошкоджені записи в сховищі", async () => {
  const adapter = new MemoryStorageAdapter([
    { id: 1, name: "Добре", price: 5, quantity: 1 },
    { id: 2, name: "", price: 5, quantity: 1 },
    { broken: true },
  ]);
  const service = new MedicinesService(adapter);
  assert.equal((await service.list()).length, 1);
});

test("summary повертає кількість і суму для запиту", async () => {
  const service = new MedicinesService(new MemoryStorageAdapter());
  await service.add({ name: "Аспірин", price: 20, quantity: 2 });
  await service.add({ name: "Нурофен", price: 30, quantity: 1 });
  assert.deepEqual(await service.summary(), { count: 2, total: 70 });
  assert.deepEqual(await service.summary("нуро"), { count: 1, total: 30 });
});

test("базовий адаптер викидає помилку «не реалізовано»", () => {
  const adapter = new MedicineStorageAdapter();
  assert.throws(() => adapter.load(), /не реалізовано/);
  assert.throws(() => adapter.save([]), /не реалізовано/);
});
