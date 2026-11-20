import {
  countChars,
  hasLetter,
  hasOnlyAllowedNameChars,
  isPlainDecimal,
  isPlainInteger,
  normalizeSpaces,
} from "./inputChecks.js";

// Правила перевірки даних препарату. Спільні для всіх клієнтів.
export const MIN_NAME_LENGTH = 2;
export const MAX_NAME_LENGTH = 100;
export const MAX_PRICE = 100000;
export const MAX_QUANTITY = 999;

export const ERROR_EMPTY = "Будь ласка, введіть назву препарату.";
export const ERROR_TOO_SHORT = `Назва препарату має містити щонайменше ${MIN_NAME_LENGTH} символи.`;
export const ERROR_TOO_LONG = `Назва препарату не повинна перевищувати ${MAX_NAME_LENGTH} символів.`;
export const ERROR_NAME_CHARS =
  "Назва містить недопустимі символи. Дозволені літери, цифри, пробіл та . , % ( ) + / ' -";
export const ERROR_NAME_NO_LETTERS =
  "Назва препарату має містити хоча б одну літеру, а не лише цифри чи знаки.";
export const ERROR_PRICE =
  "Ціна має бути числом більшим за нуль (лише цифри, до 2 знаків після коми).";
export const ERROR_PRICE_MAX = `Ціна не може перевищувати ${MAX_PRICE} ₴.`;
export const ERROR_QUANTITY = `Кількість має бути цілим числом від 1 до ${MAX_QUANTITY} (лише цифри).`;

const ok = () => ({ isValid: true, error: null });
const fail = (error) => ({ isValid: false, error });

// Назва: не порожня, 2–100 символів (після видалення зайвих пробілів),
// дозволені символи, містить хоча б одну літеру
export function validateMedicineName(name) {
  if (typeof name !== "string" || name.trim() === "") return fail(ERROR_EMPTY);
  const text = normalizeSpaces(name);
  const length = countChars(text);
  if (length < MIN_NAME_LENGTH) return fail(ERROR_TOO_SHORT);
  if (length > MAX_NAME_LENGTH) return fail(ERROR_TOO_LONG);
  if (!hasOnlyAllowedNameChars(text)) return fail(ERROR_NAME_CHARS);
  if (!hasLetter(text)) return fail(ERROR_NAME_NO_LETTERS);
  return ok();
}

// Ціна: число або рядок із цифр (десяткова крапка чи кома, до 2 знаків), більше нуля, не більше MAX_PRICE
function checkPrice(value) {
  let number;
  if (typeof value === "number") {
    number = value;
  } else if (typeof value === "string" && isPlainDecimal(value, 2)) {
    number = Number(value.trim().replace(",", "."));
  } else {
    return { error: ERROR_PRICE };
  }
  if (!Number.isFinite(number) || number <= 0) return { error: ERROR_PRICE };
  if (number > MAX_PRICE) return { error: ERROR_PRICE_MAX };
  return { value: Math.round(number * 100) / 100 };
}

export function parsePrice(value) {
  return checkPrice(value).value ?? null;
}

export function validatePrice(value) {
  const { error } = checkPrice(value);
  return error ? fail(error) : ok();
}

// Кількість: ціле число від 1 до MAX_QUANTITY; рядок — лише цифри
function checkQuantity(value) {
  let number;
  if (typeof value === "number") {
    number = value;
  } else if (typeof value === "string" && isPlainInteger(value)) {
    number = Number(value.trim());
  } else {
    return { error: ERROR_QUANTITY };
  }
  if (!Number.isInteger(number) || number < 1 || number > MAX_QUANTITY)
    return { error: ERROR_QUANTITY };
  return { value: number };
}

export function parseQuantity(value) {
  return checkQuantity(value).value ?? null;
}

export function validateQuantity(value) {
  const { error } = checkQuantity(value);
  return error ? fail(error) : ok();
}

// Перевірка всього препарату; у разі успіху повертає нормалізовані значення
export function validateMedicine({ name, price, quantity } = {}) {
  const nameResult = validateMedicineName(name);
  if (!nameResult.isValid) return { ...nameResult, value: null };

  const priceResult = checkPrice(price);
  if (priceResult.error)
    return { isValid: false, error: priceResult.error, value: null };

  const quantityResult = checkQuantity(quantity);
  if (quantityResult.error)
    return { isValid: false, error: quantityResult.error, value: null };

  return {
    isValid: true,
    error: null,
    value: {
      name: normalizeSpaces(name),
      price: priceResult.value,
      quantity: quantityResult.value,
    },
  };
}
