// Спільний клієнтський модуль: зв'язок із API, кошик, повідомлення, картка препарату.
import { cartAdd, cartCount, sanitizeCart, formatMoney, iconForCategory } from "@farmaonline/core";

// Сайт відкрито із сервера — API на тому ж origin; інакше звертаємося до localhost:3000
export const API = location.protocol === "file:" || (location.port && location.port !== "3000")
  ? "http://localhost:3000/api"
  : "/api";

export const $ = (id) => document.getElementById(id);
export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Помилка сервера");
  return data;
}

// Кошик зберігається в localStorage браузера; уся логіка — у ядрі (cart*)
export const Cart = {
  get() {
    try { return sanitizeCart(JSON.parse(localStorage.getItem("farmaonline-cart"))); } catch { return []; }
  },
  save(cart) {
    try { localStorage.setItem("farmaonline-cart", JSON.stringify(cart)); } catch { /* сховище недоступне */ }
    Cart.badge();
  },
  add(medicine) { Cart.save(cartAdd(Cart.get(), medicine)); },
  badge() {
    const n = cartCount(Cart.get());
    document.querySelectorAll(".cart-count").forEach((el) => (el.textContent = n));
  },
};

export function toast(message, isError = false) {
  const el = document.createElement("div");
  el.className = "toast" + (isError ? " toast--err" : "");
  el.textContent = message;
  el.setAttribute("role", "status");
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

const cards = new Map();

export function cardHTML(m) {
  cards.set(m.id, m);
  return `<article class="card">
    <div class="card__img" aria-hidden="true">${iconForCategory(m.category)}</div>
    <div class="card__top"><span class="chip">${esc(m.category)}</span>${m.prescriptionRequired ? '<span class="chip chip--rx">За рецептом</span>' : ""}</div>
    <h3>${esc(m.name)}</h3><p class="muted">${esc(m.manufacturer)}</p><p class="desc">${esc(m.description)}</p>
    <div class="card__bottom"><strong>${formatMoney(m.price)}</strong><button class="btn btn--sm" type="button" data-add="${esc(m.id)}">У кошик</button></div>
  </article>`;
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add]");
  const medicine = button && cards.get(button.dataset.add);
  if (medicine) {
    Cart.add(medicine);
    toast("Додано до кошика");
  }
});

// Індикатор зв'язку із сервером і MongoDB Atlas у шапці
(async () => {
  const box = document.querySelector(".header__inner");
  if (box) {
    const el = document.createElement("span");
    el.className = "status";
    box.appendChild(el);
    const set = (cls, text, tip) => {
      el.className = "status status--" + cls;
      el.textContent = "● " + text;
      el.title = tip;
    };
    try {
      const health = await (await fetch(API + "/health")).json();
      health.db
        ? set("ok", "API та БД онлайн", "Сервер і MongoDB Atlas підключені")
        : set("warn", "БД не підключена", "Сервер працює, але немає зв’язку з MongoDB Atlas (перевірте .env та Network Access)");
    } catch {
      set("err", "Сервер вимкнено", "Запустіть сервер: npm run start:web");
    }
  }
})();

Cart.badge();
