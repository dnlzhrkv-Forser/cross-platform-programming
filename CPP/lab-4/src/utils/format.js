export const money = (n) => `${Number(n).toFixed(2)} ₴`;
export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString("uk-UA", { dateStyle: "short", timeStyle: "short" });
// Номер замовлення — останні 6 цифр id
export const orderNumber = (order) => String(order.id).slice(-6);
const ICONS = [
  ["жарозн", "🌡️"],
  ["знеболю", "💊"],
  ["антибіот", "🧪"],
  ["вітамін", "🍊"],
  ["алерг", "🤧"],
  ["шлунк", "🫧"],
];
export const iconFor = (category) => (ICONS.find(([key]) => category.toLowerCase().includes(key)) || [0, "💊"])[1];
