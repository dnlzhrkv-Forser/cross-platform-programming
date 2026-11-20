// Чисті функції каталогу та кошика: без DOM, localStorage, мережі й бази даних.
import { MAX_ORDER_QTY } from "./catalogValidation.js";

export const formatMoney = (value) => `${Number(value).toFixed(2)} ₴`;

// Останні 6 символів id великими літерами — номер замовлення
export const orderNumber = (id) => String(id ?? "").slice(-6).toUpperCase();

const ICONS = [
  ["жарозн", "🌡️"],
  ["знеболю", "💊"],
  ["антибіот", "🧪"],
  ["вітамін", "🍊"],
  ["алерг", "🤧"],
  ["шлунк", "🫧"],
  ["серц", "❤️"],
  ["застуд", "🤒"],
];

export function iconForCategory(category) {
  const lower = String(category ?? "").toLowerCase();
  const found = ICONS.find(([key]) => lower.includes(key));
  return found ? found[1] : "💊";
}

export function uniqueCategories(items) {
  return [...new Set(items.map((item) => item.category))].sort((a, b) => a.localeCompare(b, "uk"));
}

// Фільтри каталогу: пошук, категорія, рецепт ("0" / "1"), сортування за ціною
export function filterCatalog(items, { query = "", category = "", prescription = "", sort = "" } = {}) {
  const q = String(query ?? "").trim().toLowerCase();
  const result = items.filter(
    (item) =>
      (!q || `${item.name} ${item.manufacturer}`.toLowerCase().includes(q)) &&
      (!category || item.category === category) &&
      (prescription === "" || item.prescriptionRequired === (prescription === "1"))
  );
  if (sort === "asc") result.sort((a, b) => a.price - b.price);
  if (sort === "desc") result.sort((a, b) => b.price - a.price);
  return result;
}

// ---- Кошик: незмінні операції над масивом { id, name, price, qty } ----

export function sanitizeCart(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (line) =>
      line &&
      typeof line.id === "string" &&
      typeof line.name === "string" &&
      Number.isFinite(line.price) &&
      Number.isInteger(line.qty) &&
      line.qty > 0
  );
}

export function cartAdd(cart, medicine) {
  const existing = cart.find((line) => line.id === medicine.id);
  if (existing) {
    return cart.map((line) =>
      line.id === medicine.id ? { ...line, qty: Math.min(line.qty + 1, MAX_ORDER_QTY) } : line
    );
  }
  return [...cart, { id: medicine.id, name: medicine.name, price: medicine.price, qty: 1 }];
}

// delta = +1 / -1; рядок із кількістю 0 видаляється
export function cartChangeQty(cart, id, delta) {
  return cart
    .map((line) => (line.id === id ? { ...line, qty: Math.min(line.qty + delta, MAX_ORDER_QTY) } : line))
    .filter((line) => line.qty > 0);
}

export const cartRemove = (cart, id) => cart.filter((line) => line.id !== id);

export const cartCount = (cart) => cart.reduce((sum, line) => sum + line.qty, 0);

export function cartTotal(cart) {
  const total = cart.reduce((sum, line) => sum + line.price * line.qty, 0);
  return Math.round(total * 100) / 100;
}
