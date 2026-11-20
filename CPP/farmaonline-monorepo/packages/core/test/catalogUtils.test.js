import { test } from "node:test";
import assert from "node:assert/strict";
import {
  filterCatalog, uniqueCategories, iconForCategory, formatMoney, orderNumber,
  sanitizeCart, cartAdd, cartChangeQty, cartRemove, cartCount, cartTotal,
} from "../index.js";

const items = [
  { id: "1", name: "Ібупрофен", manufacturer: "Київмедпрепарат", category: "Знеболювальні", price: 62, prescriptionRequired: false },
  { id: "2", name: "Амоксицилін", manufacturer: "Здоров’я", category: "Антибіотики", price: 118, prescriptionRequired: true },
  { id: "3", name: "Цитрамон", manufacturer: "Фармак", category: "Знеболювальні", price: 38, prescriptionRequired: false },
];

test("фільтр: пошук за назвою та виробником без урахування регістру", () => {
  assert.deepEqual(filterCatalog(items, { query: "ІБУП" }).map((i) => i.id), ["1"]);
  assert.deepEqual(filterCatalog(items, { query: "фармак" }).map((i) => i.id), ["3"]);
});

test("фільтр: категорія, рецепт, сортування", () => {
  assert.equal(filterCatalog(items, { category: "Знеболювальні" }).length, 2);
  assert.deepEqual(filterCatalog(items, { prescription: "1" }).map((i) => i.id), ["2"]);
  assert.deepEqual(filterCatalog(items, { prescription: "0" }).map((i) => i.id), ["1", "3"]);
  assert.deepEqual(filterCatalog(items, { sort: "asc" }).map((i) => i.id), ["3", "1", "2"]);
  assert.deepEqual(filterCatalog(items, { sort: "desc" }).map((i) => i.id), ["2", "1", "3"]);
});

test("фільтр не змінює вихідний масив", () => {
  const copy = [...items];
  filterCatalog(items, { sort: "desc" });
  assert.deepEqual(items, copy);
});

test("категорії унікальні й відсортовані", () => {
  assert.deepEqual(uniqueCategories(items), ["Антибіотики", "Знеболювальні"]);
});

test("іконка за категорією", () => {
  assert.equal(iconForCategory("Вітаміни"), "🍊");
  assert.equal(iconForCategory("Щось інше"), "💊");
  assert.equal(iconForCategory(undefined), "💊");
});

test("форматування грошей і номера замовлення", () => {
  assert.equal(formatMoney(62), "62.00 ₴");
  assert.equal(orderNumber("6abf55d2134f84e7c0e831f4"), "E831F4");
});

test("кошик: додавання, збільшення, зміна кількості, видалення", () => {
  let cart = cartAdd([], items[0]);
  cart = cartAdd(cart, items[0]);
  cart = cartAdd(cart, items[1]);
  assert.deepEqual(cart.map((l) => [l.id, l.qty]), [["1", 2], ["2", 1]]);
  assert.equal(cartCount(cart), 3);
  assert.equal(cartTotal(cart), 62 * 2 + 118);
  cart = cartChangeQty(cart, "2", -1);
  assert.equal(cart.length, 1);
  assert.equal(cartRemove(cart, "1").length, 0);
});

test("кошик: кількість не перевищує 99", () => {
  let cart = [{ id: "1", name: "x", price: 1, qty: 99 }];
  cart = cartAdd(cart, { id: "1", name: "x", price: 1 });
  assert.equal(cart[0].qty, 99);
});

test("sanitizeCart відкидає некоректні рядки", () => {
  const raw = [{ id: "1", name: "a", price: 1, qty: 1 }, { id: 5 }, null, { id: "2", name: "b", price: 1, qty: 0 }];
  assert.equal(sanitizeCart(raw).length, 1);
  assert.deepEqual(sanitizeCart("rubbish"), []);
});
