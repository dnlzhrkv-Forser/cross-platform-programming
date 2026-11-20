import { filterCatalog, uniqueCategories } from "@farmaonline/core";
import { $, api, cardHTML } from "./api.js";

let all = [];

// Фільтрація, пошук і сортування — спільна функція ядра
function render() {
  const list = filterCatalog(all, {
    query: $("q").value,
    category: $("cat").value,
    prescription: $("rx").value,
    sort: $("sort").value,
  });
  $("state").textContent = list.length ? `Знайдено: ${list.length}` : "Нічого не знайдено";
  $("grid").innerHTML = list.map(cardHTML).join("");
}

["q", "cat", "rx", "sort"].forEach((id) => $(id).addEventListener("input", render));

(async () => {
  try {
    all = await api("/medicines");
    uniqueCategories(all).forEach((c) => $("cat").add(new Option(c, c)));
    render();
  } catch (e) {
    $("state").textContent = "Не вдалося завантажити каталог: " + e.message;
  }
})();
