// Низькорівневі перевірки рядків, які вводить користувач.
// Це чисті функції: без констант проєкту й без текстів помилок.
// Межі (мінімум, максимум) і повідомлення задає medicineValidation.js.

// Дозволені символи в назві препарату: літери будь-якої мови, цифри, пробіл і . , % ( ) + / ' ’ -
const NAME_ALLOWED_CHARS = /^[\p{L}\p{N} .,%()+/'’-]+$/u;

// Прибирає пробіли з країв і замінює кілька пробілів (табуляцію, перенос рядка) одним пробілом
export function normalizeSpaces(text) {
  return String(text).trim().replace(/\s+/g, " ");
}

// Кількість символів із урахуванням символів поза BMP (наприклад, емодзі = 1)
export function countChars(text) {
  return [...String(text)].length;
}

// Чи є в тексті хоча б одна літера (назва з самих цифр чи знаків не проходить)
export function hasLetter(text) {
  return /\p{L}/u.test(text);
}

// Чи складається текст лише з дозволених символів (відсікає < > { } ; " \ тощо)
export function hasOnlyAllowedNameChars(text) {
  return NAME_ALLOWED_CHARS.test(text);
}

// Лише цифри 0–9 без знаку, крапки, пробілів і експоненти ("1e2", "0x10", "-1", "2.5" не проходять)
export function isPlainInteger(text) {
  return /^\d+$/.test(String(text).trim());
}

// Число з цифр і необов'язковою десятковою частиною через крапку або кому, не більше maxDecimals знаків
export function isPlainDecimal(text, maxDecimals = 2) {
  return new RegExp(`^\\d+([.,]\\d{1,${maxDecimals}})?$`).test(
    String(text).trim(),
  );
}
