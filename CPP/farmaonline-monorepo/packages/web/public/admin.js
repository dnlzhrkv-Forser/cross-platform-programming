import { formatMoney, orderNumber, validateCatalogItem } from "@farmaonline/core";
import { $, api, esc, toast } from "./api.js";

const form = $("medForm");
let meds = [];

const table = (head, rows) =>
  `<div class="table-wrap"><table class="table"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;

async function load() {
  try {
    meds = await api("/medicines");
    $("medTable").innerHTML = meds.length
      ? table(
          ["Назва", "Категорія", "Виробник", "Ціна", "Рецепт", ""],
          meds
            .map(
              (m) => `<tr><td>${esc(m.name)}</td><td>${esc(m.category)}</td><td>${esc(m.manufacturer)}</td><td>${formatMoney(m.price)}</td><td>${m.prescriptionRequired ? "так" : "ні"}</td>
                <td class="nowrap"><button class="link" data-edit="${esc(m.id)}">Редагувати</button> <button class="link link--red" data-del="${esc(m.id)}">Видалити</button></td></tr>`
            )
            .join("")
        )
      : '<p class="muted">Препаратів ще немає.</p>';

    const orders = await api("/orders");
    $("orders").innerHTML = orders.length
      ? table(
          ["№", "Дата", "Клієнт", "Телефон", "Склад", "Сума"],
          orders
            .map(
              (o) => `<tr><td>${orderNumber(o.id)}</td><td>${new Date(o.createdAt).toLocaleString("uk-UA")}</td><td>${esc(o.name)}</td><td>${esc(o.phone)}</td>
                <td>${o.items.map((i) => `${esc(i.name)} × ${i.qty}`).join(", ")}</td><td>${formatMoney(o.total)}</td></tr>`
            )
            .join("")
        )
      : '<p class="muted">Замовлень поки немає.</p>';
  } catch (e) {
    toast(e.message, true);
  }
}

function reset() {
  form.reset();
  form.dataset.id = "";
  $("formTitle").textContent = "Додати препарат";
  $("saveBtn").textContent = "Додати";
  $("cancel").hidden = true;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const v = form.elements;
  const body = {
    name: v.name.value,
    category: v.category.value,
    manufacturer: v.manufacturer.value,
    price: v.price.value,
    prescriptionRequired: v.rx.checked,
    description: v.description.value,
  };

  // Спільна перевірка з ядра: помилка видна ще до запиту до сервера
  const check = validateCatalogItem(body);
  if (!check.isValid) return toast(check.error, true);

  const id = form.dataset.id;
  try {
    await api("/medicines" + (id ? "/" + id : ""), { method: id ? "PUT" : "POST", body: check.value });
    toast(id ? "Препарат оновлено" : "Препарат додано");
    reset();
    load();
  } catch (err) {
    toast(err.message, true);
  }
});

$("cancel").addEventListener("click", reset);

$("medTable").addEventListener("click", async (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.edit) {
    const m = meds.find((x) => x.id === b.dataset.edit);
    const v = form.elements;
    v.name.value = m.name;
    v.category.value = m.category;
    v.manufacturer.value = m.manufacturer;
    v.price.value = m.price;
    v.description.value = m.description || "";
    v.rx.checked = m.prescriptionRequired;
    form.dataset.id = m.id;
    $("formTitle").textContent = "Редагувати препарат";
    $("saveBtn").textContent = "Зберегти";
    $("cancel").hidden = false;
    form.scrollIntoView({ behavior: "smooth" });
  } else if (b.dataset.del && confirm("Видалити цей препарат?")) {
    try {
      await api("/medicines/" + b.dataset.del, { method: "DELETE" });
      toast("Препарат видалено");
      load();
    } catch (err) {
      toast(err.message, true);
    }
  }
});

load();
