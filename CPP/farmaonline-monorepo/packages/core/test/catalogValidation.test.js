import { test } from "node:test";
import assert from "node:assert/strict";
import { validateCatalogItem, validateCustomer, CATALOG_ERRORS } from "../index.js";

const valid = { name: " Ібупрофен ", category: "Знеболювальні", manufacturer: "Фармак", price: "62,5" };

test("препарат: нормалізує значення", () => {
  const r = validateCatalogItem(valid);
  assert.equal(r.isValid, true);
  assert.deepEqual(r.value, {
    name: "Ібупрофен", category: "Знеболювальні", manufacturer: "Фармак",
    price: 62.5, prescriptionRequired: false, description: "",
  });
});

test("препарат: обов'язкові поля", () => {
  assert.equal(validateCatalogItem({ ...valid, name: "  " }).error, CATALOG_ERRORS.name);
  assert.equal(validateCatalogItem({ ...valid, category: "" }).error, CATALOG_ERRORS.category);
  assert.equal(validateCatalogItem({ ...valid, manufacturer: undefined }).error, CATALOG_ERRORS.manufacturer);
});

test("препарат: довжина та ціна", () => {
  assert.equal(validateCatalogItem({ ...valid, name: "а".repeat(101) }).error, CATALOG_ERRORS.tooLong);
  assert.equal(validateCatalogItem({ ...valid, price: 0 }).error, CATALOG_ERRORS.price);
  assert.equal(validateCatalogItem({ ...valid, price: "abc" }).error, CATALOG_ERRORS.price);
  assert.equal(validateCatalogItem({ ...valid, description: "я".repeat(501) }).error, CATALOG_ERRORS.description);
});

test("препарат: рецепт лише для true", () => {
  assert.equal(validateCatalogItem({ ...valid, prescriptionRequired: true }).value.prescriptionRequired, true);
  assert.equal(validateCatalogItem({ ...valid, prescriptionRequired: "true" }).value.prescriptionRequired, false);
});

test("покупець: коректні дані", () => {
  const r = validateCustomer({ name: " Іван ", phone: "+380 (50) 123-45-67", address: "Київ, вул. Хрещатик, 1" });
  assert.equal(r.isValid, true);
  assert.equal(r.value.name, "Іван");
});

test("покупець: помилки", () => {
  const ok = { name: "Іван", phone: "0501234567", address: "Київ, Хрещатик" };
  assert.equal(validateCustomer({ ...ok, name: "" }).error, CATALOG_ERRORS.customerName);
  assert.equal(validateCustomer({ ...ok, phone: "12345" }).error, CATALOG_ERRORS.customerPhone);
  assert.equal(validateCustomer({ ...ok, phone: "call me maybe" }).error, CATALOG_ERRORS.customerPhone);
  assert.equal(validateCustomer({ ...ok, address: "Київ" }).error, CATALOG_ERRORS.customerAddress);
});
