import { useState } from "react";
import OrderList from "./OrderList.jsx";
import PageTitle from "./PageTitle.jsx";
import { money, orderNumber } from "../utils/format.js";
function Orders({ orders, onToggle, onDelete }) {
  const [query, setQuery] = useState("");
  const done = orders.filter((o) => o.done).length;
  const revenue = orders.reduce((sum, o) => sum + o.total, 0);
  // Пошук за іменем, телефоном або номером замовлення — «на льоту»
  const q = query.trim().toLowerCase();
  const visible = orders.filter((o) => `${o.name} ${o.phone} ${orderNumber(o)}`.toLowerCase().includes(q));
  return (
    <section>
      <PageTitle
        title="Замовлення"
        subtitle={`Усього замовлень: ${orders.length} · Виконано: ${done} · На суму: ${money(revenue)}`}
      />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Пошук за іменем, телефоном або номером"
        aria-label="Пошук замовлення"
        className="mb-4 w-full rounded-lg border border-slate-300 px-4 py-3 text-base"
      />
      <OrderList orders={visible} isFiltered={q !== ""} onToggle={onToggle} onDelete={onDelete} />
    </section>
  );
}
export default Orders;
