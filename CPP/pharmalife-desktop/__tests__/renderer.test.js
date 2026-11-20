/**
 * Тести renderer/script.js (логіка сторінки замовлень).
 * Для кожного тесту створюється свіже «вікно» jsdom з реальним index.html,
 * замість Electron підставляється мок window.pharmacyAPI.
 */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "renderer", "index.html"), "utf-8");
const script = fs.readFileSync(path.join(__dirname, "..", "renderer", "script.js"), "utf-8");

const windows = [];
afterEach(() => {
  windows.splice(0).forEach((w) => w.close()); // зупиняє таймери тостів
});

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function setup(initialOrders = []) {
  const dom = new JSDOM(html, { runScripts: "outside-only", url: "http://localhost/" });
  const { window } = dom;
  const api = {
    loadOrders: jest.fn().mockResolvedValue(initialOrders),
    saveOrders: jest.fn().mockResolvedValue(true),
  };
  window.pharmacyAPI = api;
  window.eval(script);
  // jsdom сам стріляє DOMContentLoaded після розбору HTML — чекаємо на нього
  await flush();
  await flush();
  windows.push(window);

  const $ = (id) => window.document.getElementById(id);
  const fill = (name, phone, address, total) => {
    $("orderName").value = name;
    $("orderPhone").value = phone;
    $("orderAddress").value = address;
    $("orderTotal").value = total;
  };
  const submit = async () => {
    $("orderForm").dispatchEvent(new window.Event("submit", { cancelable: true, bubbles: true }));
    await flush();
  };
  const toast = () => window.document.querySelector(".toast");
  const rows = () => [...window.document.querySelectorAll("#ordersBox tbody tr")];
  return { window, api, $, fill, submit, toast, rows };
}

const sample = { id: 1700000123456, name: "Іван", phone: "+380501234567", address: "Київ, Хрещатик 1", total: 150.5, createdAt: "2026-11-01T10:00:00.000Z" };

describe("Початковий стан", () => {
  test("завантажує замовлення через pharmacyAPI.loadOrders", async () => {
    const { api } = await setup();
    expect(api.loadOrders).toHaveBeenCalledTimes(1);
  });

  test("порожній список показує підказку", async () => {
    const { $ } = await setup([]);
    expect($("summary").textContent).toBe("Замовлень поки немає. Додайте перше!");
    expect($("ordersBox").textContent).toContain("Замовлень поки немає");
  });

  test("збережені замовлення відображаються в таблиці з сумарним підсумком", async () => {
    const second = { ...sample, id: 1700000999999, name: "Олена", total: 49.5 };
    const { $, rows } = await setup([sample, second]);
    expect(rows()).toHaveLength(2);
    expect($("summary").textContent).toBe("Усього замовлень: 2 · На суму: 200.00 ₴");
  });

  test("номер замовлення — останні 6 цифр id, сума з двома знаками", async () => {
    const { rows } = await setup([sample]);
    const cells = [...rows()[0].querySelectorAll("td")].map((td) => td.textContent);
    expect(cells.slice(0, 5)).toEqual(["123456", "Іван", "+380501234567", "Київ, Хрещатик 1", "150.50 ₴"]);
  });
});

describe("Валідація форми", () => {
  test("порожнє ім’я", async () => {
    const { fill, submit, toast, api } = await setup();
    fill("   ", "+380501234567", "Київ", "100");
    await submit();
    expect(toast().textContent).toBe("Будь ласка, введіть ім’я клієнта.");
    expect(toast().classList.contains("toast--err")).toBe(true);
    expect(api.saveOrders).not.toHaveBeenCalled();
  });

  test.each([["123"], ["abcdefghij"], ["+38050123456789012"], ["+38 (050) 123-45-67"], [""]])("некоректний телефон «%s»", async (phone) => {
    const { fill, submit, toast, api } = await setup();
    fill("Іван", phone, "Київ", "100");
    await submit();
    expect(toast().textContent).toBe("Вкажіть коректний телефон, наприклад +380501234567.");
    expect(api.saveOrders).not.toHaveBeenCalled();
  });

  test.each([["+380501234567"], ["0501234567"], ["+38(050)1234567"]])("коректний телефон «%s» проходить", async (phone) => {
    const { fill, submit, api } = await setup();
    fill("Іван", phone, "Київ", "100");
    await submit();
    expect(api.saveOrders).toHaveBeenCalledTimes(1);
  });

  test("порожня адреса", async () => {
    const { fill, submit, toast, api } = await setup();
    fill("Іван", "+380501234567", "  ", "100");
    await submit();
    expect(toast().textContent).toBe("Вкажіть адресу доставки.");
    expect(api.saveOrders).not.toHaveBeenCalled();
  });

  test.each([["0"], ["-5"], ["abc"], [""]])("некоректна сума «%s»", async (total) => {
    const { fill, submit, toast, api } = await setup();
    fill("Іван", "+380501234567", "Київ", total);
    await submit();
    expect(toast().textContent).toBe("Сума має бути числом більшим за нуль.");
    expect(api.saveOrders).not.toHaveBeenCalled();
  });
});

describe("Додавання замовлення", () => {
  test("додає запис, зберігає у файл, очищає форму, показує успіх", async () => {
    const { fill, submit, toast, api, rows, $ } = await setup();
    fill("  Іван  ", " +380501234567 ", " Київ, Хрещатик 1 ", "199,90");
    await submit();

    expect(rows()).toHaveLength(1);
    expect(api.saveOrders).toHaveBeenCalledTimes(1);
    const saved = api.saveOrders.mock.calls[0][0];
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ name: "Іван", phone: "+380501234567", address: "Київ, Хрещатик 1", total: 199.9 });
    expect(typeof saved[0].id).toBe("number");
    expect(new Date(saved[0].createdAt).toString()).not.toBe("Invalid Date");

    expect($("orderName").value).toBe("");
    expect($("orderTotal").value).toBe("");
    expect(toast().textContent).toBe("Замовлення додано та збережено у файл.");
    expect(toast().classList.contains("toast--err")).toBe(false);
    expect($("summary").textContent).toBe("Усього замовлень: 1 · На суму: 199.90 ₴");
  });

  test("нові замовлення додаються в кінець списку", async () => {
    const { fill, submit, rows } = await setup([sample]);
    fill("Олена", "+380671112233", "Львів", "10");
    await submit();
    const names = rows().map((r) => r.querySelectorAll("td")[1].textContent);
    expect(names).toEqual(["Іван", "Олена"]);
  });

  test("HTML у полях не виконується (textContent, а не innerHTML)", async () => {
    const { fill, submit, window } = await setup();
    fill('<img src=x onerror="alert(1)">', "+380501234567", "<b>адреса</b>", "10");
    await submit();
    expect(window.document.querySelector("#ordersBox img")).toBeNull();
    expect(window.document.querySelector("#ordersBox b")).toBeNull();
  });
});

describe("Видалення замовлення", () => {
  test("видаляє тільки вибраний запис і зберігає зміни", async () => {
    const second = { ...sample, id: 1700000999999, name: "Олена" };
    const { rows, api, toast } = await setup([sample, second]);
    rows()[0].querySelector("button").click();
    await flush();

    expect(rows()).toHaveLength(1);
    expect(rows()[0].querySelectorAll("td")[1].textContent).toBe("Олена");
    expect(api.saveOrders).toHaveBeenCalledWith([second]);
    expect(toast().textContent).toBe("Замовлення видалено.");
  });

  test("після видалення останнього показується порожній стан", async () => {
    const { rows, $ } = await setup([sample]);
    rows()[0].querySelector("button").click();
    await flush();
    expect($("summary").textContent).toBe("Замовлень поки немає. Додайте перше!");
  });
});

describe("Повідомлення", () => {
  test("одночасно показується лише одне повідомлення", async () => {
    const { fill, submit, window } = await setup();
    fill("", "", "", "");
    await submit();
    await submit();
    expect(window.document.querySelectorAll(".toast")).toHaveLength(1);
  });
});
