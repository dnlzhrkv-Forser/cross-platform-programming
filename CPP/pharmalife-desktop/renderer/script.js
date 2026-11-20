const form = document.getElementById("orderForm");
const nameInput = document.getElementById("orderName");
const phoneInput = document.getElementById("orderPhone");
const addressInput = document.getElementById("orderAddress");
const totalInput = document.getElementById("orderTotal");
const summary = document.getElementById("summary");
const ordersBox = document.getElementById("ordersBox");

const PHONE_RE = /^\+?[\d\s()-]{10,15}$/;
const money = (n) => Number(n).toFixed(2) + " ₴";
const orderNumber = (order) => String(order.id).slice(-6);

let orders = [];
let toastTimer = null;

// Повідомлення (клас .toast із style.css; червоне — помилка, зелене — успіх)
function showMessage(text, isError) {
  document.querySelectorAll(".toast").forEach((t) => t.remove());
  clearTimeout(toastTimer);
  const toast = document.createElement("div");
  toast.className = "toast" + (isError ? " toast--err" : "");
  toast.setAttribute("role", "status");
  toast.textContent = text;
  document.body.appendChild(toast);
  toastTimer = setTimeout(() => toast.remove(), 3500);
}

// Збереження списку у файл через безпечний міст preload
async function saveOrders() {
  await window.pharmacyAPI.saveOrders(orders);
}

function renderOrders() {
  const totalSum = orders.reduce((sum, o) => sum + o.total, 0);
  summary.textContent = orders.length
    ? `Усього замовлень: ${orders.length} · На суму: ${money(totalSum)}`
    : "Замовлень поки немає. Додайте перше!";

  ordersBox.textContent = "";
  if (orders.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Замовлень поки немає. Додайте перше!";
    ordersBox.appendChild(empty);
    return;
  }

  const wrap = document.createElement("div");
  wrap.className = "table-wrap";
  const table = document.createElement("table");
  table.className = "table";

  const head = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["№", "Клієнт", "Телефон", "Адреса", "Сума", ""].forEach((title) => {
    const th = document.createElement("th");
    th.textContent = title;
    headRow.appendChild(th);
  });
  head.appendChild(headRow);

  const body = document.createElement("tbody");
  orders.forEach((order) => {
    const row = document.createElement("tr");
    [orderNumber(order), order.name, order.phone, order.address, money(order.total)].forEach((value, index) => {
      const td = document.createElement("td");
      if (index === 4) td.className = "nowrap"; // сума не переноситься на новий рядок
      td.textContent = value;
      row.appendChild(td);
    });

    const actions = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "link link--red";
    deleteButton.textContent = "Видалити";
    deleteButton.addEventListener("click", async () => {
      orders = orders.filter((o) => o.id !== order.id);
      renderOrders();
      await saveOrders();
      showMessage("Замовлення видалено.", true);
    });
    actions.appendChild(deleteButton);
    row.appendChild(actions);
    body.appendChild(row);
  });

  table.append(head, body);
  wrap.appendChild(table);
  ordersBox.appendChild(wrap);
}

async function addOrder() {
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const address = addressInput.value.trim();
  const total = Number(totalInput.value.trim().replace(",", "."));

  if (name === "") {
    showMessage("Будь ласка, введіть ім’я клієнта.", true);
    return;
  }
  if (!PHONE_RE.test(phone)) {
    showMessage("Вкажіть коректний телефон, наприклад +380501234567.", true);
    return;
  }
  if (address === "") {
    showMessage("Вкажіть адресу доставки.", true);
    return;
  }
  if (!Number.isFinite(total) || total <= 0) {
    showMessage("Сума має бути числом більшим за нуль.", true);
    return;
  }

  // Нові замовлення додаються в кінець списку
  orders.push({ id: Date.now(), name, phone, address, total, createdAt: new Date().toISOString() });
  form.reset();
  renderOrders();
  await saveOrders();
  showMessage("Замовлення додано та збережено у файл.", false);
}

// Додавання — кнопкою або клавішею Enter (submit форми)
form.addEventListener("submit", (event) => {
  event.preventDefault();
  addOrder();
});

// Під час завантаження вікна — отримати збережені замовлення з файлу
document.addEventListener("DOMContentLoaded", async () => {
  orders = await window.pharmacyAPI.loadOrders();
  renderOrders();
});
