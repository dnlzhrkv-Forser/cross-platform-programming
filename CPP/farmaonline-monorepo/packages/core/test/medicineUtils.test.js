import test from "node:test";
import assert from "node:assert/strict";
import {
  calcTotal,
  createMedicine,
  filterMedicinesByQuery,
  formatMedicineDate,
  sanitizeMedicines,
  sortMedicinesByDate,
} from "../index.js";

test("createMedicine обрізає пробіли та зберігає дату створення", () => {
  const now = new Date("2026-11-06T12:00:00Z");
  const medicine = createMedicine({ name: "  Цитрамон П ", price: 38, quantity: 1 }, 7, now);
  assert.deepEqual(medicine, {
    id: 7,
    name: "Цитрамон П",
    price: 38,
    quantity: 1,
    createdAt: "2026-11-06T12:00:00.000Z",
  });
});

test("formatMedicineDate форматує дату як дд.мм.рррр", () => {
  assert.equal(formatMedicineDate("2026-11-06T12:00:00Z"), "06.11.2026");
});

test("formatMedicineDate повертає порожній рядок для некоректної дати", () => {
  assert.equal(formatMedicineDate("не дата"), "");
  assert.equal(formatMedicineDate(undefined), "");
});

test("sortMedicinesByDate ставить новіші першими й не змінює вихідний масив", () => {
  const input = [
    { id: 1, name: "А", price: 1, quantity: 1, createdAt: "2026-11-01T10:00:00Z" },
    { id: 2, name: "Б", price: 1, quantity: 1, createdAt: "2026-11-03T10:00:00Z" },
    { id: 3, name: "В", price: 1, quantity: 1, createdAt: "2026-11-02T10:00:00Z" },
  ];
  const sorted = sortMedicinesByDate(input);
  assert.deepEqual(sorted.map((m) => m.id), [2, 3, 1]);
  assert.deepEqual(input.map((m) => m.id), [1, 2, 3]);
});

test("sortMedicinesByDate підтримує старі записи без createdAt (за id)", () => {
  const sorted = sortMedicinesByDate([
    { id: 5, name: "А", price: 1, quantity: 1 },
    { id: 9, name: "Б", price: 1, quantity: 1 },
  ]);
  assert.deepEqual(sorted.map((m) => m.id), [9, 5]);
});

test("filterMedicinesByQuery шукає без урахування регістру; порожній запит повертає все", () => {
  const items = [
    { id: 1, name: "Нурофен сироп" },
    { id: 2, name: "Амоксицилін 500 мг" },
  ];
  assert.deepEqual(filterMedicinesByQuery(items, "НУРО").map((m) => m.id), [1]);
  assert.equal(filterMedicinesByQuery(items, "").length, 2);
  assert.equal(filterMedicinesByQuery(items, "   ").length, 2);
  assert.equal(filterMedicinesByQuery(items, "xyz").length, 0);
});

test("sanitizeMedicines відкидає некоректні записи", () => {
  const raw = [
    { id: 1, name: "Добре", price: 10, quantity: 2 },
    { id: "2", name: "id не число", price: 10, quantity: 2 },
    { id: 3, name: "  ", price: 10, quantity: 2 },
    { id: 4, name: "Ціна", price: -1, quantity: 2 },
    { id: 5, name: "Кількість", price: 1, quantity: 1.5 },
    null,
    "рядок",
  ];
  assert.deepEqual(sanitizeMedicines(raw).map((m) => m.id), [1]);
  assert.deepEqual(sanitizeMedicines({ не: "масив" }), []);
});

test("calcTotal обчислює суму ціна × кількість", () => {
  assert.equal(calcTotal([]), 0);
  assert.equal(
    calcTotal([
      { price: 45.5, quantity: 2 },
      { price: 118.5, quantity: 1 },
    ]),
    209.5
  );
});
