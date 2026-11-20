import test from "node:test";
import assert from "node:assert/strict";
import {
  ERROR_EMPTY,
  ERROR_PRICE,
  ERROR_QUANTITY,
  ERROR_TOO_LONG,
  MAX_NAME_LENGTH,
  MAX_QUANTITY,
  validateMedicine,
  validateMedicineName,
  validatePrice,
  validateQuantity,
} from "../index.js";

test("коректна назва проходить перевірку", () => {
  assert.deepEqual(validateMedicineName("Парацетамол 500 мг"), { isValid: true, error: null });
});

test("порожня назва і самі пробіли не проходять перевірку", () => {
  assert.equal(validateMedicineName("").error, ERROR_EMPTY);
  assert.equal(validateMedicineName("     ").error, ERROR_EMPTY);
});

test("назва, що не є рядком, не проходить перевірку", () => {
  assert.equal(validateMedicineName(42).isValid, false);
  assert.equal(validateMedicineName(null).error, ERROR_EMPTY);
  assert.equal(validateMedicineName(undefined).isValid, false);
});

test("межа довжини: рівно MAX_NAME_LENGTH символів допустимо, на один більше — ні", () => {
  assert.equal(validateMedicineName("а".repeat(MAX_NAME_LENGTH)).isValid, true);
  const tooLong = validateMedicineName("а".repeat(MAX_NAME_LENGTH + 1));
  assert.equal(tooLong.isValid, false);
  assert.equal(tooLong.error, ERROR_TOO_LONG);
});

test("довжина вимірюється після видалення зайвих пробілів", () => {
  assert.equal(validateMedicineName("  " + "а".repeat(MAX_NAME_LENGTH) + "  ").isValid, true);
});

test("ціна: число, рядок і десяткова кома допустимі", () => {
  assert.equal(validatePrice(45.5).isValid, true);
  assert.equal(validatePrice("45,50").isValid, true);
  assert.equal(validatePrice(" 118.5 ").isValid, true);
});

test("ціна: нуль, від'ємне, текст і порожнє значення не проходять", () => {
  for (const bad of [0, -5, "abc", "", null, undefined, NaN, Infinity]) {
    assert.equal(validatePrice(bad).error, ERROR_PRICE, `значення ${String(bad)}`);
  }
});

test("кількість: цілі числа від 1 до MAX_QUANTITY", () => {
  assert.equal(validateQuantity(1).isValid, true);
  assert.equal(validateQuantity("3").isValid, true);
  assert.equal(validateQuantity(MAX_QUANTITY).isValid, true);
  assert.equal(validateQuantity(MAX_QUANTITY + 1).error, ERROR_QUANTITY);
  assert.equal(validateQuantity(0).isValid, false);
  assert.equal(validateQuantity(1.5).isValid, false);
  assert.equal(validateQuantity("abc").isValid, false);
});

test("validateMedicine повертає нормалізовані значення", () => {
  const result = validateMedicine({ name: "  Нурофен  ", price: "135,555", quantity: "2" });
  assert.equal(result.isValid, true);
  assert.deepEqual(result.value, { name: "Нурофен", price: 135.56, quantity: 2 });
});

test("validateMedicine повідомляє про першу знайдену помилку", () => {
  assert.equal(validateMedicine({ name: "", price: 1, quantity: 1 }).error, ERROR_EMPTY);
  assert.equal(validateMedicine({ name: "А", price: 0, quantity: 1 }).error, ERROR_PRICE);
  assert.equal(validateMedicine({ name: "А", price: 1, quantity: 0 }).error, ERROR_QUANTITY);
  assert.equal(validateMedicine().isValid, false);
});
