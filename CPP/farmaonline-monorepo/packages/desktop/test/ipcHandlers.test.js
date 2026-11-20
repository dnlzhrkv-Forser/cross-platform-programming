import test from "node:test";
import assert from "node:assert/strict";
import { MedicinesService, MemoryStorageAdapter } from "@farmaonline/core";
import { ERROR_INVALID_DATA, createHandlers } from "../ipcHandlers.js";

const newHandlers = () => createHandlers(new MedicinesService(new MemoryStorageAdapter()));
const valid = { name: "Парацетамол 500 мг", price: "45,50", quantity: "2" };

test("add і list: препарат з'являється з полем dateLabel", async () => {
  const handlers = newHandlers();
  const added = await handlers.add(valid);
  assert.equal(added.ok, true);
  assert.match(added.medicine.dateLabel, /^\d{2}\.\d{2}\.\d{4}$/);
  const list = await handlers.list("");
  assert.equal(list.length, 1);
  assert.match(list[0].dateLabel, /^\d{2}\.\d{2}\.\d{4}$/);
});

test("add повертає помилку для порожнього та нетекстового значення", async () => {
  const handlers = newHandlers();
  assert.equal((await handlers.add({ ...valid, name: "   " })).ok, false);
  assert.deepEqual(await handlers.add({ ...valid, name: 123 }), { ok: false, error: ERROR_INVALID_DATA });
  assert.deepEqual(await handlers.add(null), { ok: false, error: ERROR_INVALID_DATA });
  assert.deepEqual(await handlers.add("рядок"), { ok: false, error: ERROR_INVALID_DATA });
  assert.deepEqual(await handlers.add({ name: "А", price: {}, quantity: 1 }), { ok: false, error: ERROR_INVALID_DATA });
});

test("add повертає повідомлення ядра для некоректної ціни", async () => {
  const result = await newHandlers().add({ ...valid, price: "abc" });
  assert.equal(result.ok, false);
  assert.match(result.error, /Ціна/);
});

test("list ігнорує запит неправильного типу, а рядковий запит фільтрує", async () => {
  const handlers = newHandlers();
  await handlers.add(valid);
  await handlers.add({ name: "Нурофен", price: 30, quantity: 1 });
  assert.equal((await handlers.list({ не: "рядок" })).length, 2);
  assert.equal((await handlers.list(42)).length, 2);
  assert.deepEqual((await handlers.list("нуро")).map((m) => m.name), ["Нурофен"]);
});

test("summary повертає кількість і суму", async () => {
  const handlers = newHandlers();
  await handlers.add(valid);
  assert.deepEqual(await handlers.summary(""), { count: 1, total: 91 });
  assert.deepEqual(await handlers.summary(7), { count: 1, total: 91 });
});

test("remove приймає id як число або рядок", async () => {
  const handlers = newHandlers();
  const first = (await handlers.add(valid)).medicine;
  const second = (await handlers.add({ ...valid, name: "Інший" })).medicine;
  assert.deepEqual(await handlers.remove(first.id), { ok: true });
  assert.deepEqual(await handlers.remove(String(second.id)), { ok: true });
  assert.equal((await handlers.list("")).length, 0);
});

test("remove відхиляє некоректний id і повідомляє про відсутній препарат", async () => {
  const handlers = newHandlers();
  assert.deepEqual(await handlers.remove({}), { ok: false, error: ERROR_INVALID_DATA });
  assert.deepEqual(await handlers.remove(null), { ok: false, error: ERROR_INVALID_DATA });
  assert.deepEqual(await handlers.remove("abc"), { ok: false, error: ERROR_INVALID_DATA });
  assert.equal((await handlers.remove(999)).ok, false);
});
