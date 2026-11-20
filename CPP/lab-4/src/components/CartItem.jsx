import { money } from "../utils/format.js";
function CartItem({ item, onChangeQty, onRemove }) {
  const qtyButton = "h-8 w-8 cursor-pointer rounded-lg border border-emerald-300 bg-white hover:bg-emerald-100";
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-emerald-100 px-4 py-3">
      <div className="min-w-40 flex-1">
        <p className="font-semibold text-slate-800">{item.name}</p>
        <p className="text-sm text-slate-600">{money(item.price)} за шт.</p>
      </div>
      <div className="flex items-center gap-2">
        <button className={qtyButton} onClick={() => onChangeQty(item.id, -1)} aria-label="Менше">
          −
        </button>
        <span className="w-6 text-center" aria-label="Кількість">
          {item.qty}
        </span>
        <button className={qtyButton} onClick={() => onChangeQty(item.id, 1)} aria-label="Більше">
          +
        </button>
      </div>
      <strong className="w-24 text-right">{money(item.price * item.qty)}</strong>
      <button
        onClick={() => onRemove(item.id)}
        className="cursor-pointer rounded-lg bg-rose-500 px-3.5 py-2 text-white hover:bg-rose-700"
      >
        Видалити
      </button>
    </li>
  );
}
export default CartItem;
