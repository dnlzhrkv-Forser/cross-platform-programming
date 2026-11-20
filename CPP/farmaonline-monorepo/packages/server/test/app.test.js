import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { PharmacyService, MemoryPharmacyRepository } from "@farmaonline/core";
import { createApp } from "../app.js";

let server, base, ready = true;

before(async () => {
  const service = new PharmacyService(new MemoryPharmacyRepository());
  const app = createApp({ service, isDbReady: () => ready });
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const call = async (path, options = {}) => {
  const res = await fetch(base + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
    body: options.body && JSON.stringify(options.body),
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data, type: res.headers.get("content-type") };
};

const med = { name: "Ібупрофен", category: "Знеболювальні", manufacturer: "Фармак", price: 62 };

test("health показує стан БД", async () => {
  assert.deepEqual((await call("/api/health")).data, { server: "ok", db: true });
  ready = false;
  assert.deepEqual((await call("/api/health")).data, { server: "ok", db: false });
  const blocked = await call("/api/medicines");
  assert.equal(blocked.status, 503);
  assert.match(blocked.data.message, /MongoDB Atlas/);
  ready = true;
});

test("CRUD препаратів", async () => {
  const created = await call("/api/medicines", { method: "POST", body: med });
  assert.equal(created.status, 201);
  const id = created.data.id;
  assert.ok(id);

  assert.equal((await call("/api/medicines")).data.length, 1);
  assert.equal((await call(`/api/medicines/${id}`)).data.name, "Ібупрофен");

  const updated = await call(`/api/medicines/${id}`, { method: "PUT", body: { ...med, price: 70, prescriptionRequired: true } });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.price, 70);

  assert.equal((await call(`/api/medicines/${id}`, { method: "DELETE" })).status, 200);
  assert.equal((await call(`/api/medicines/${id}`, { method: "DELETE" })).status, 404);
  assert.equal((await call(`/api/medicines/${id}`)).status, 404);
});

test("валідація з ядра відхиляє поганий запит", async () => {
  const r = await call("/api/medicines", { method: "POST", body: { ...med, price: -1 } });
  assert.equal(r.status, 400);
  assert.match(r.data.message, /Ціна/);
});

test("замовлення: створення та список", async () => {
  const { data: m } = await call("/api/medicines", { method: "POST", body: med });
  const order = await call("/api/orders", {
    method: "POST",
    body: { name: "Іван", phone: "0501234567", address: "Київ, Хрещатик, 1", items: [{ id: m.id, qty: 2 }] },
  });
  assert.equal(order.status, 201);
  assert.equal(order.data.total, 124);
  assert.equal((await call("/api/orders")).data.length, 1);

  const bad = await call("/api/orders", { method: "POST", body: { name: "", items: [] } });
  assert.equal(bad.status, 400);
});

test("статичні файли: ядро віддається лише з білого списку", async () => {
  const idx = await call("/core/index.js");
  assert.equal(idx.status, 200);
  assert.match(idx.type, /javascript/);
  assert.equal((await call("/core/package.json")).status, 404);
  assert.equal((await call("/core/..%2Fpackage.json")).status, 404);
  assert.equal((await call("/core/test")).status, 404);
});

test("невідомий маршрут API повертає JSON 404", async () => {
  const r = await call("/api/nothing");
  assert.equal(r.status, 404);
  assert.ok(r.data.message);
});
