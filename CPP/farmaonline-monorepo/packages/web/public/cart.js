import { cartChangeQty, cartRemove, cartTotal, formatMoney, orderNumber, validateCustomer } from "@farmaonline/core";
import { $, api, Cart, esc, toast } from "./api.js";

function draw() {
  const cart = Cart.get();
  $("orderForm").hidden = cart.length === 0;
  if (!cart.length) {
    $("cartBox").innerHTML = '<p class="muted">Кошик порожній. <a href="catalog.html">Перейти до каталогу</a></p>';
    return;
  }
  const rows = cart
    .map(
      (i) => `<tr><td>${esc(i.name)}</td><td>${formatMoney(i.price)}</td>
        <td class="nowrap"><button class="qty" data-d="-1" data-id="${esc(i.id)}" aria-label="Менше">−</button> ${i.qty} <button class="qty" data-d="1" data-id="${esc(i.id)}" aria-label="Більше">+</button></td>
        <td>${formatMoney(i.price * i.qty)}</td>
        <td><button class="link link--red" data-rm="${esc(i.id)}">Видалити</button></td></tr>`
    )
    .join("");
  $("cartBox").innerHTML =
    `<div class="table-wrap"><table class="table"><thead><tr><th>Препарат</th><th>Ціна</th><th>К-сть</th><th>Сума</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` +
    `<p class="total">Разом: <strong>${formatMoney(cartTotal(cart))}</strong></p>`;
}

$("cartBox").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  const cart = Cart.get();
  if (b.dataset.rm) Cart.save(cartRemove(cart, b.dataset.rm));
  else if (b.dataset.d) Cart.save(cartChangeQty(cart, b.dataset.id, Number(b.dataset.d)));
  draw();
});

$("orderForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const customer = { name: f.get("name"), phone: f.get("phone"), address: f.get("address") };

  // Та сама перевірка, що й на сервері, — із спільного ядра
  const check = validateCustomer(customer);
  if (!check.isValid) return toast(check.error, true);

  try {
    const order = await api("/orders", { method: "POST", body: { ...customer, items: Cart.get() } });
    Cart.save([]);
    e.target.reset();
    draw();
    $("cartBox").innerHTML = `<div class="notice">Замовлення №${orderNumber(order.id)} оформлено на суму ${formatMoney(order.total)}. Дякуємо!</div>`;
  } catch (err) {
    toast(err.message, true);
  }
});

draw();
