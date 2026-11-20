// Правила перевірки каталогу та замовлень. Спільні для браузера й сервера:
// один і той самий код перевіряє форму на сайті та запит до API.
import { parsePrice } from "./medicineValidation.js";

export const CATALOG_MAX_TEXT = 100;
export const CATALOG_MAX_DESCRIPTION = 500;
export const MAX_ORDER_QTY = 99;

export const CATALOG_ERRORS = {
  name: "Вкажіть назву препарату.",
  category: "Вкажіть категорію.",
  manufacturer: "Вкажіть виробника.",
  tooLong: `Назва, категорія та виробник — не довше ${CATALOG_MAX_TEXT} символів.`,
  price: "Ціна має бути числом більшим за нуль.",
  description: `Опис — не довше ${CATALOG_MAX_DESCRIPTION} символів.`,
  customerName: "Вкажіть ім’я.",
  customerPhone: "Вкажіть коректний номер телефону (10–15 цифр).",
  customerAddress: "Вкажіть адресу доставки (мінімум 5 символів).",
  emptyOrder: "Додайте товари до кошика.",
};

const text = (value) => (typeof value === "string" ? value.trim() : "");

// Перевірка препарату; у разі успіху повертає нормалізоване значення
export function validateCatalogItem(input = {}) {
  const name = text(input.name);
  const category = text(input.category);
  const manufacturer = text(input.manufacturer);
  const description = text(input.description);

  if (!name) return fail(CATALOG_ERRORS.name);
  if (!category) return fail(CATALOG_ERRORS.category);
  if (!manufacturer) return fail(CATALOG_ERRORS.manufacturer);
  if ([name, category, manufacturer].some((v) => v.length > CATALOG_MAX_TEXT)) {
    return fail(CATALOG_ERRORS.tooLong);
  }
  const price = parsePrice(input.price);
  if (price === null) return fail(CATALOG_ERRORS.price);
  if (description.length > CATALOG_MAX_DESCRIPTION) return fail(CATALOG_ERRORS.description);

  return {
    isValid: true,
    error: null,
    value: {
      name,
      category,
      manufacturer,
      price,
      prescriptionRequired: input.prescriptionRequired === true,
      description,
    },
  };
}

// Перевірка даних покупця під час оформлення замовлення
export function validateCustomer(input = {}) {
  const name = text(input.name);
  const phone = text(input.phone);
  const address = text(input.address);
  const digits = phone.replace(/\D/g, "");

  if (!name || name.length > CATALOG_MAX_TEXT) return fail(CATALOG_ERRORS.customerName);
  if (!/^\+?[\d\s()-]+$/.test(phone) || digits.length < 10 || digits.length > 15) {
    return fail(CATALOG_ERRORS.customerPhone);
  }
  if (address.length < 5 || address.length > 200) return fail(CATALOG_ERRORS.customerAddress);

  return { isValid: true, error: null, value: { name, phone, address } };
}

function fail(error) {
  return { isValid: false, error, value: null };
}
