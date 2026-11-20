import { useState } from "react";
const field = "rounded-lg border border-emerald-300 px-4 py-3 text-base";
function OrderForm({ onPlaceOrder }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  function handleSubmit(event) {
    event.preventDefault();
    // onPlaceOrder повертає true, якщо замовлення оформлено — тоді очищаємо поля
    if (onPlaceOrder({ name, phone, address })) {
      setName("");
      setPhone("");
      setAddress("");
    }
  }
  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-3 rounded-2xl border border-emerald-100 p-4 sm:grid-cols-2">
      <h2 className="text-xl font-bold text-slate-800 sm:col-span-2">Оформлення замовлення</h2>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ім’я"
        aria-label="Ім’я"
        autoComplete="name"
        className={field}
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Телефон, +380…"
        aria-label="Телефон"
        type="tel"
        autoComplete="tel"
        className={field}
      />
      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Адреса доставки"
        aria-label="Адреса доставки"
        autoComplete="street-address"
        className={`${field} sm:col-span-2`}
      />
      <button
        type="submit"
        className="cursor-pointer rounded-lg bg-emerald-600 px-5 py-3 text-base text-white hover:bg-emerald-800 sm:col-span-2"
      >
        Підтвердити замовлення
      </button>
    </form>
  );
}
export default OrderForm;
