import MedicineForm from "./MedicineForm.jsx";
import PageTitle from "./PageTitle.jsx";
import { money } from "../utils/format.js";
function MedicineAdmin({ medicines, onAdd, onDelete, onImport, importing }) {
  return (
    <section>
      <PageTitle title="Препарати" subtitle={`Керування каталогом · Усього препаратів: ${medicines.length}`} />
      <MedicineForm onAdd={onAdd} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          onClick={onImport}
          disabled={importing}
          className="cursor-pointer rounded-lg border border-emerald-600 px-4 py-2 text-emerald-700 hover:bg-emerald-50 disabled:cursor-wait disabled:opacity-60"
        >
          {importing ? "Завантаження…" : "Імпортувати з GraphQL API (ЛР №3)"}
        </button>
        <span className="text-sm text-slate-500">Додає лише препарати, яких ще немає в каталозі</span>
      </div>
      <ul className="space-y-3">
        {medicines.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between gap-3 rounded-lg bg-emerald-100 px-4 py-3 max-sm:flex-col max-sm:items-start"
          >
            <span>
              <span className="font-semibold text-slate-800">{m.name}</span>
              <span className="block text-sm text-slate-600">
                {m.category} · {m.manufacturer} · {money(m.price)}
                {m.prescriptionRequired ? " · за рецептом" : ""}
              </span>
            </span>
            <button
              onClick={() => onDelete(m.id)}
              className="cursor-pointer rounded-lg bg-rose-500 px-3.5 py-2 text-white hover:bg-rose-700"
            >
              Видалити
            </button>
          </li>
        ))}
      </ul>
      {medicines.length === 0 && (
        <p className="text-center text-slate-500">Препаратів поки немає. Додайте перший або імпортуйте з сервера!</p>
      )}
    </section>
  );
}
export default MedicineAdmin;
