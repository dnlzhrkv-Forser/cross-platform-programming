import { test } from "node:test";
import assert from "node:assert/strict";
import { PharmacyService, MemoryPharmacyRepository, PharmacyRepository, CATALOG_ERRORS } from "../index.js";

const input = { name: "Ібупрофен", category: "Знеболювальні", manufacturer: "Фармак", price: 62 };
const customer = { name: "Іван", phone: "0501234567", address: "Київ, Хрещатик, 1" };

function make() {
  let tick = 0;
  const now = () => new Date(Date.UTC(2026, 0, 1, 0, 0, tick++));
  return new PharmacyService(new MemoryPharmacyRepository(), { now });
}

test("додавання, список (новіші першими) і отримання за id", async () => {
  const s = make();
  const a = await s.addMedicine(input);
  const b = await s.addMedicine({ ...input, name: "Цитрамон" });
  assert.equal(a.ok, true);
  assert.deepEqual((await s.listMedicines()).map((m) => m.name), ["Цитрамон", "Ібупрофен"]);
  assert.equal((await s.getMedicine(b.medicine.id)).medicine.name, "Цитрамон");
});

test("додавання некоректного препарату повертає validation", async () => {
  const r = await make().addMedicine({ ...input, price: -5 });
  assert.equal(r.ok, false);
  assert.equal(r.code, "validation");
});

test("оновлення та видалення; відсутній id — not_found", async () => {
  const s = make();
  const { medicine } = await s.addMedicine(input);
  const upd = await s.updateMedicine(medicine.id, { ...input, price: 70, prescriptionRequired: true });
  assert.equal(upd.medicine.price, 70);
  assert.equal(upd.medicine.prescriptionRequired, true);
  assert.equal(upd.medicine.createdAt, medicine.createdAt);
  assert.equal((await s.updateMedicine("nope", input)).code, "not_found");
  assert.equal((await s.removeMedicine(medicine.id)).ok, true);
  assert.equal((await s.removeMedicine(medicine.id)).code, "not_found");
  assert.equal((await s.getMedicine(medicine.id)).code, "not_found");
});

test("seed додає дані лише в порожню колекцію", async () => {
  const s = make();
  assert.equal((await s.seed([input, { ...input, name: "Б" }])).seeded, 2);
  assert.equal((await s.seed([input])).seeded, 0);
  assert.equal((await s.listMedicines()).length, 2);
});

test("замовлення: ціни з бази, а не від клієнта", async () => {
  const s = make();
  const { medicine } = await s.addMedicine(input);
  const r = await s.createOrder({ ...customer, items: [{ id: medicine.id, qty: 3, price: 1 }] });
  assert.equal(r.ok, true);
  assert.equal(r.order.total, 186);
  assert.deepEqual(r.order.items[0], { medicine: medicine.id, name: "Ібупрофен", price: 62, qty: 3 });
  assert.equal((await s.listOrders()).length, 1);
});

test("замовлення: помилки", async () => {
  const s = make();
  assert.equal((await s.createOrder({ ...customer, items: [] })).error, CATALOG_ERRORS.emptyOrder);
  assert.equal((await s.createOrder({ ...customer, name: "" , items: [{ id: "x", qty: 1 }] })).code, "validation");
  assert.equal((await s.createOrder({ ...customer, items: [{ id: "unknown", qty: 1 }] })).code, "validation");
});

test("замовлення: кількість обмежується 1..99", async () => {
  const s = make();
  const { medicine } = await s.addMedicine(input);
  const r = await s.createOrder({ ...customer, items: [{ id: medicine.id, qty: 5000 }] });
  assert.equal(r.order.items[0].qty, 99);
});

test("базовий репозиторій вимагає реалізації методів", async () => {
  await assert.rejects(() => new PharmacyRepository().findAll(), /не реалізовано/);
});
