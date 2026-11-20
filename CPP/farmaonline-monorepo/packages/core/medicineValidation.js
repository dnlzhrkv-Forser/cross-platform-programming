// Правила перевірки даних препарату. Спільні для всіх клієнтів.
export const MAX_NAME_LENGTH = 100;
export const MAX_QUANTITY = 999;

export const ERROR_EMPTY = "Будь ласка, введіть назву препарату.";
export const ERROR_TOO_LONG = `Назва препарату не повинна перевищувати ${MAX_NAME_LENGTH} символів.`;
export const ERROR_PRICE = "Ціна має бути числом більшим за нуль.";
export const ERROR_QUANTITY = `Кількість має бути цілим числом від 1 до ${MAX_QUANTITY}.`;

// Перевірка назви: порожній текст, самі пробіли й не рядок — помилка;
// довжина вимірюється після видалення зайвих пробілів.
export function validateMedicineName(name) {
  if (typeof name !== "string" || name.trim() === "") {
    return { isValid: false, error: ERROR_EMPTY };
  }
  if (name.trim().length > MAX_NAME_LENGTH) {
    return { isValid: false, error: ERROR_TOO_LONG };
  }
  return { isValid: true, error: null };
}

// Ціна: число або рядок (допускається десяткова кома), більше нуля
export function parsePrice(value) {
  const number =
    typeof value === "number" ? value : Number(String(value ?? "").trim().replace(",", "."));
  if (!Number.isFinite(number) || number <= 0) {
    return null;
  }
  return Math.round(number * 100) / 100;
}

export function validatePrice(value) {
  return parsePrice(value) === null
    ? { isValid: false, error: ERROR_PRICE }
    : { isValid: true, error: null };
}

// Кількість: ціле число від 1 до MAX_QUANTITY
export function parseQuantity(value) {
  const number = typeof value === "number" ? value : Number(String(value ?? "").trim());
  if (!Number.isInteger(number) || number < 1 || number > MAX_QUANTITY) {
    return null;
  }
  return number;
}

export function validateQuantity(value) {
  return parseQuantity(value) === null
    ? { isValid: false, error: ERROR_QUANTITY }
    : { isValid: true, error: null };
}

// Перевірка всього препарату; у разі успіху повертає нормалізовані значення
export function validateMedicine({ name, price, quantity } = {}) {
  const nameResult = validateMedicineName(name);
  if (!nameResult.isValid) return { ...nameResult, value: null };

  const parsedPrice = parsePrice(price);
  if (parsedPrice === null) return { isValid: false, error: ERROR_PRICE, value: null };

  const parsedQuantity = parseQuantity(quantity);
  if (parsedQuantity === null) return { isValid: false, error: ERROR_QUANTITY, value: null };

  return {
    isValid: true,
    error: null,
    value: { name: name.trim(), price: parsedPrice, quantity: parsedQuantity },
  };
}
