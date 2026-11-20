// Чисті функції для роботи з препаратами: без доступу до DOM, браузерного сховища чи файлів.

// Створення запису препарату з id та датою створення
export function createMedicine({ name, price, quantity }, id, now = new Date()) {
  return { id, name: name.trim(), price, quantity, createdAt: now.toISOString() };
}

// Дата у форматі дд.мм.рррр; для некоректної дати — порожній рядок
export function formatMedicineDate(isoString) {
  const date = new Date(isoString);
  if (typeof isoString !== "string" || Number.isNaN(date.getTime())) {
    return "";
  }
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${date.getFullYear()}`;
}

// Спочатку новіші; вихідний масив не змінюється; записи без дати — за id
export function sortMedicinesByDate(medicines) {
  const timeOf = (medicine) => {
    const time = Date.parse(medicine.createdAt);
    return Number.isNaN(time) ? medicine.id : time;
  };
  return [...medicines].sort((a, b) => timeOf(b) - timeOf(a));
}

// Пошук за назвою без урахування регістру; порожній запит повертає все
export function filterMedicinesByQuery(medicines, query) {
  const normalized = String(query ?? "").trim().toLowerCase();
  if (normalized === "") return [...medicines];
  return medicines.filter((medicine) => medicine.name.toLowerCase().includes(normalized));
}

// Відкидає некоректні записи зі сховища
export function sanitizeMedicines(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item) =>
      item !== null &&
      typeof item === "object" &&
      Number.isFinite(item.id) &&
      typeof item.name === "string" &&
      item.name.trim() !== "" &&
      Number.isFinite(item.price) &&
      item.price > 0 &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0
  );
}

// Загальна сума: ціна × кількість для всіх препаратів
export function calcTotal(medicines) {
  const total = medicines.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return Math.round(total * 100) / 100;
}
