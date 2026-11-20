import { formatDateTime, money, orderNumber } from "../utils/format.js";
function OrderItem({ order, onToggle, onDelete }) {
  return (
    <li
      className={`flex items-center justify-between gap-3 rounded-lg px-4 py-3 max-sm:flex-col max-sm:items-start ${
        order.done ? "bg-slate-200" : "bg-emerald-100"
      }`}
    >
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          className="mt-1.5 accent-emerald-600"
          checked={order.done}
          onChange={() => onToggle(order.id)}
        />
        <span className={order.done ? "text-slate-500 line-through" : "text-slate-800"}>
          <span className="font-semibold">
            №{orderNumber(order)} · {order.name}
          </span>
          <span className="block text-sm">
            {order.phone} · {order.address} · {formatDateTime(order.createdAt)}
          </span>
          <span className="block text-sm">
            {order.items.map((i) => `${i.name} × ${i.qty}`).join(", ")} — {money(order.total)}
          </span>
        </span>
      </label>
      <button
        onClick={() => onDelete(order.id)}
        className="cursor-pointer rounded-lg bg-rose-500 px-3.5 py-2 text-white hover:bg-rose-700"
      >
        Видалити
      </button>
    </li>
  );
}
export default OrderItem;
