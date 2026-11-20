import { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import Message from "./components/Message.jsx";
import Catalog from "./components/Catalog.jsx";
import Cart from "./components/Cart.jsx";
import Orders from "./components/Orders.jsx";
import MedicineAdmin from "./components/MedicineAdmin.jsx";
import useLocalStorage from "./hooks/useLocalStorage.js";
import { SEED_MEDICINES } from "./data/seed.js";
import { fetchMedicines } from "./api/graphql.js";
import { orderNumber } from "./utils/format.js";
const PHONE_RE = /^\+?[\d\s()-]{10,15}$/;
function App() {
  // Увесь стан піднято в кореневий компонент (lifting state up)
  const [page, setPage] = useState("catalog");
  const [medicines, setMedicines] = useLocalStorage("pharmalife-medicines", SEED_MEDICINES);
  const [cart, setCart] = useLocalStorage("pharmalife-cart", []);
  const [orders, setOrders] = useLocalStorage("pharmalife-orders", []);
  const [message, setMessage] = useState(null); // { text, type: "error" | "success" }
  const [importing, setImporting] = useState(false);
  const error = (text) => setMessage({ text, type: "error" });
  const success = (text) => setMessage({ text, type: "success" });
  // Повідомлення зникає через 4 секунди (очищення таймера — у return ефекту)
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [message]);
  function navigate(nextPage) {
    setPage(nextPage);
    setMessage(null);
  }
  // ---------- кошик ----------
  function addToCart(medicine) {
    const exists = cart.some((i) => i.id === medicine.id);
    setCart(
      exists
        ? cart.map((i) => (i.id === medicine.id ? { ...i, qty: i.qty + 1 } : i))
        : [...cart, { id: medicine.id, name: medicine.name, price: medicine.price, qty: 1 }],
    );
    success(`«${medicine.name}» додано до кошика.`);
  }
  function changeQty(id, delta) {
    setCart(cart.map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i)).filter((i) => i.qty > 0));
  }
  const removeFromCart = (id) => setCart(cart.filter((i) => i.id !== id));
  // ---------- замовлення ----------
  function placeOrder({ name, phone, address }) {
    if (name.trim() === "") {
      error("Введіть ім’я.");
      return false;
    }
    if (!PHONE_RE.test(phone.trim())) {
      error("Вкажіть коректний телефон, наприклад +380501234567.");
      return false;
    }
    if (address.trim() === "") {
      error("Вкажіть адресу доставки.");
      return false;
    }
    const order = {
      id: Date.now(),
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      items: cart,
      total: cart.reduce((sum, i) => sum + i.price * i.qty, 0),
      createdAt: new Date().toISOString(),
      done: false,
    };
    setOrders([order, ...orders]);
    setCart([]);
    success(`Замовлення №${orderNumber(order)} оформлено. Дякуємо!`);
    return true;
  }
  const toggleOrder = (id) => setOrders(orders.map((o) => (o.id === id ? { ...o, done: !o.done } : o)));
  function deleteOrder(id) {
    setOrders(orders.filter((o) => o.id !== id));
    success("Замовлення видалено.");
  }
  // ---------- препарати ----------
  function addMedicine({ name, category, manufacturer, price, prescriptionRequired, description }) {
    const priceNumber = Number(price);
    if (name.trim() === "") {
      error("Введіть назву препарату.");
      return false;
    }
    if (manufacturer.trim() === "") {
      error("Вкажіть виробника.");
      return false;
    }
    if (price === "" || Number.isNaN(priceNumber) || priceNumber < 0) {
      error("Вкажіть коректну ціну (число від 0).");
      return false;
    }
    setMedicines([
      ...medicines,
      {
        id: Date.now(),
        name: name.trim(),
        category,
        manufacturer: manufacturer.trim(),
        price: priceNumber,
        prescriptionRequired,
        description: description.trim(),
      },
    ]);
    success("Препарат додано до каталогу.");
    return true;
  }
  function deleteMedicine(id) {
    setMedicines(medicines.filter((m) => m.id !== id));
    success("Препарат видалено з каталогу.");
  }
  async function importMedicines() {
    setImporting(true);
    try {
      const server = await fetchMedicines();
      const known = new Set(medicines.map((m) => m.name.toLowerCase()));
      const fresh = server.filter((m) => !known.has(m.name.toLowerCase()));
      setMedicines([...medicines, ...fresh]);
      success(fresh.length ? `Імпортовано нових препаратів: ${fresh.length}.` : "Нових препаратів на сервері немає.");
    } catch (e) {
      // TypeError — мережева помилка fetch (сервер вимкнено), інакше — помилка від GraphQL
      const reason = e instanceof TypeError ? "сервер не відповідає" : e.message;
      error(`Не вдалося отримати дані з GraphQL API (${reason}). Запустіть сервер: npm run dev у теці lab-3.`);
    } finally {
      setImporting(false);
    }
  }
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Header page={page} onNavigate={navigate} cartCount={cartCount} />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Message message={message} />
        {page === "catalog" && <Catalog medicines={medicines} onAddToCart={addToCart} />}
        {page === "cart" && (
          <Cart
            cart={cart}
            onChangeQty={changeQty}
            onRemove={removeFromCart}
            onPlaceOrder={placeOrder}
            onGoCatalog={() => navigate("catalog")}
          />
        )}
        {page === "orders" && <Orders orders={orders} onToggle={toggleOrder} onDelete={deleteOrder} />}
        {page === "medicines" && (
          <MedicineAdmin
            medicines={medicines}
            onAdd={addMedicine}
            onDelete={deleteMedicine}
            onImport={importMedicines}
            importing={importing}
          />
        )}
      </main>
      <footer className="border-t border-emerald-100 py-4 text-center text-sm text-slate-500">
        © 2026 ФармаЛайф. Навчальний проєкт, ЛР №4 · Жарков Данило, ВЕБ-21
      </footer>
    </div>
  );
}
export default App;
