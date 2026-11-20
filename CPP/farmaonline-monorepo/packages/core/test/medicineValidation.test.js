import test from "node:test";
import assert from "node:assert/strict";
import {
  ERROR_EMPTY,
  ERROR_NAME_CHARS,
  ERROR_NAME_NO_LETTERS,
  ERROR_PRICE,
  ERROR_PRICE_MAX,
  ERROR_QUANTITY,
  ERROR_TOO_LONG,
  ERROR_TOO_SHORT,
  MAX_NAME_LENGTH,
  MAX_PRICE,
  MAX_QUANTITY,
  MIN_NAME_LENGTH,
  validateMedicine,
  validateMedicineName,
  validatePrice,
  validateQuantity,
} from "../index.js";

test("коректна назва проходить перевірку", () => {
  assert.deepEqual(validateMedicineName("Парацетамол 500 мг"), {
    isValid: true,
    error: null,
  });
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
  assert.equal(
    validateMedicineName("  " + "а".repeat(MAX_NAME_LENGTH) + "  ").isValid,
    true,
  );
});

test("ціна: число, рядок і десяткова кома допустимі", () => {
  assert.equal(validatePrice(45.5).isValid, true);
  assert.equal(validatePrice("45,50").isValid, true);
  assert.equal(validatePrice(" 118.5 ").isValid, true);
});

test("ціна: нуль, від'ємне, текст і порожнє значення не проходять", () => {
  for (const bad of [0, -5, "abc", "", null, undefined, NaN, Infinity]) {
    assert.equal(
      validatePrice(bad).error,
      ERROR_PRICE,
      `значення ${String(bad)}`,
    );
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
  const result = validateMedicine({
    name: "  Нурофен  ",
    price: "135,55",
    quantity: "2",
  });
  assert.equal(result.isValid, true);
  assert.deepEqual(result.value, {
    name: "Нурофен",
    price: 135.55,
    quantity: 2,
  });
});

test("validateMedicine повідомляє про першу знайдену помилку", () => {
  assert.equal(
    validateMedicine({ name: "", price: 1, quantity: 1 }).error,
    ERROR_EMPTY,
  );
  assert.equal(
    validateMedicine({ name: "Аспірин", price: 0, quantity: 1 }).error,
    ERROR_PRICE,
  );
  assert.equal(
    validateMedicine({ name: "Аспірин", price: 1, quantity: 0 }).error,
    ERROR_QUANTITY,
  );
  assert.equal(validateMedicine().isValid, false);
});

test("назва: мінімальна довжина", () => {
  assert.equal(validateMedicineName("а".repeat(MIN_NAME_LENGTH)).isValid, true);
  assert.equal(
    validateMedicineName("а".repeat(MIN_NAME_LENGTH - 1)).error,
    ERROR_TOO_SHORT,
  );
});

test("назва з самих цифр або знаків не проходить, а з літерами й цифрами — проходить", () => {
  for (const bad of ["12345", "123 456", "+-.,%", "007"]) {
    assert.equal(validateMedicineName(bad).error, ERROR_NAME_NO_LETTERS, bad);
  }
  for (const good of [
    "Аспірин 500",
    "Но-шпа",
    "Вітамін C 1000 мг",
    "Ibuprofen (200 mg)",
    "Л-тироксин 50",
  ]) {
    assert.equal(validateMedicineName(good).isValid, true, good);
  }
});

test("назва з недопустимими символами не проходить", () => {
  for (const bad of [
    "<b>Аспірин</b>",
    "Аспірин; DROP",
    'Нурофен "forte"',
    "Аспірин\\",
    "Аспірин {x}",
    "Аспірин 😀",
  ]) {
    assert.equal(validateMedicineName(bad).error, ERROR_NAME_CHARS, bad);
  }
});

test("зайві пробіли в назві стискаються до одного", () => {
  const result = validateMedicine({
    name: "  Вітамін   C \t 1000  ",
    price: 10,
    quantity: 1,
  });
  assert.equal(result.value.name, "Вітамін C 1000");
});

test("ціна: лише цифри, не більше двох знаків після коми, є верхня межа", () => {
  for (const bad of [
    "12abc",
    "1e3",
    "0x10",
    "-5",
    "1,2,3",
    "12.345",
    "1 000",
    "+5",
    ".5",
  ]) {
    assert.equal(validatePrice(bad).error, ERROR_PRICE, bad);
  }
  assert.equal(validatePrice(String(MAX_PRICE)).isValid, true);
  assert.equal(validatePrice(MAX_PRICE + 1).error, ERROR_PRICE_MAX);
  assert.equal(validatePrice("100000,01").error, ERROR_PRICE_MAX);
});

test("кількість: рядок лише з цифр", () => {
  for (const bad of ["1e2", "0x10", "-1", "2.5", "2,5", "1 2", "", "  ", "٣"]) {
    assert.equal(
      validateQuantity(bad).error,
      ERROR_QUANTITY,
      JSON.stringify(bad),
    );
  }
  assert.equal(validateQuantity(" 7 ").isValid, true);
});
