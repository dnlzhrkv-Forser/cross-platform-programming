// Спільний скрипт усіх сторінок: API, кошик, повідомлення, картка препарату
const API = location.protocol === 'file:' || location.port !== '3000' ? 'http://localhost:3000/api' : '/api';
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => Number(n).toFixed(2) + ' ₴';

async function api(path, opt = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opt,
    body: opt.body && JSON.stringify(opt.body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Помилка сервера');
  return data;
}

const Cart = {
  get() { try { return JSON.parse(localStorage.getItem('cart')) || []; } catch { return []; } },
  save(c) { localStorage.setItem('cart', JSON.stringify(c)); Cart.badge(); },
  add(m) {
    const c = Cart.get();
    const i = c.find((x) => x.id === m._id);
    i ? i.qty++ : c.push({ id: m._id, name: m.name, price: m.price, qty: 1 });
    Cart.save(c);
  },
  badge() {
    const n = Cart.get().reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll('.cart-count').forEach((e) => (e.textContent = n));
  },
};

function toast(msg, isErr) {
  const t = document.createElement('div');
  t.className = 'toast' + (isErr ? ' toast--err' : '');
  t.textContent = msg;
  t.setAttribute('role', 'status');
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

const ICONS = [['жарозн', '🌡️'], ['знеболю', '💊'], ['антибіот', '🧪'], ['вітамін', '🍊'], ['алерг', '🤧'], ['шлунк', '🫧'], ['серц', '❤️'], ['застуд', '🤒']];
const iconFor = (c) => (ICONS.find(([k]) => String(c).toLowerCase().includes(k)) || [0, '💊'])[1];

// Індикатор зв'язку із сервером і базою в шапці
(async () => {
  const box = document.querySelector('.header__inner');
  if (!box) return;
  const el = document.createElement('span');
  el.className = 'status';
  box.appendChild(el);
  const set = (cls, txt, tip) => { el.className = 'status status--' + cls; el.textContent = '● ' + txt; el.title = tip; };
  try {
    const h = await (await fetch(API + '/health')).json();
    h.db ? set('ok', 'API та БД онлайн', 'Сервер і MongoDB Atlas підключені')
         : set('warn', 'БД не підключена', 'Сервер працює, але немає зв’язку з MongoDB Atlas (перевірте .env та Network Access)');
  } catch { set('err', 'Сервер вимкнено', 'Запустіть сервер: npm run dev'); }
})();

const store = {};
function cardHTML(m) {
  store[m._id] = m;
  return `<article class="card">
    <div class="card__img" aria-hidden="true">${iconFor(m.category)}</div>
    <div class="card__top"><span class="chip">${esc(m.category)}</span>${m.prescriptionRequired ? '<span class="chip chip--rx">За рецептом</span>' : ''}</div>
    <h3>${esc(m.name)}</h3><p class="muted">${esc(m.manufacturer)}</p><p class="desc">${esc(m.description)}</p>
    <div class="card__bottom"><strong>${money(m.price)}</strong><button class="btn btn--sm" type="button" data-add="${m._id}">У кошик</button></div>
  </article>`;
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-add]');
  if (b && store[b.dataset.add]) { Cart.add(store[b.dataset.add]); toast('Додано до кошика'); }
});
Cart.badge();
