import { $, api, cardHTML } from "./api.js";

(async () => {
  try {
    const list = (await api("/medicines")).slice(0, 4);
    $("featured").innerHTML = list.map(cardHTML).join("") || '<p class="muted">Каталог поки порожній.</p>';
  } catch {
    $("featured").innerHTML = '<p class="muted">Не вдалося завантажити препарати — перевірте, чи запущено сервер.</p>';
  }
})();
