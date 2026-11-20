import { iconFor, money } from "../utils/format.js";
function MedicineCard({ medicine, onAddToCart }) {
  return (
    <article className="flex flex-col rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
      <div className="mb-2 grid h-20 place-items-center rounded-xl bg-emerald-50 text-4xl" aria-hidden="true">
        {iconFor(medicine.category)}
      </div>
      <div className="mb-2 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800">{medicine.category}</span>
        {medicine.prescriptionRequired && (
          <span className="rounded-full bg-rose-100 px-2.5 py-1 text-rose-700">За рецептом</span>
        )}
      </div>
      <h3 className="font-semibold text-slate-800">{medicine.name}</h3>
      <p className="text-sm text-slate-500">{medicine.manufacturer}</p>
      <p className="mb-3 flex-1 text-sm text-slate-600">{medicine.description}</p>
      <div className="flex items-center justify-between">
        <strong className="text-lg">{money(medicine.price)}</strong>
        <button
          onClick={() => onAddToCart(medicine)}
          className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-800"
        >
          У кошик
        </button>
      </div>
    </article>
  );
}
export default MedicineCard;
