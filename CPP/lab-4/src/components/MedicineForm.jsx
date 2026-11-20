import { useState } from "react";
import { CATEGORIES } from "../data/seed.js";
const field = "rounded-lg border border-emerald-300 px-4 py-3 text-base";
function MedicineForm({ onAdd }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [manufacturer, setManufacturer] = useState("");
  const [price, setPrice] = useState("");
  const [rx, setRx] = useState(false);
  const [description, setDescription] = useState("");
  function handleSubmit(event) {
    event.preventDefault();
    const added = onAdd({ name, category, manufacturer, price, prescriptionRequired: rx, description });
    if (added) {
      setName("");
      setCategory(CATEGORIES[0]);
      setManufacturer("");
      setPrice("");
      setRx(false);
      setDescription("");
    }
  }
  return (
    <form onSubmit={handleSubmit} className="mb-4 grid gap-3 sm:grid-cols-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Назва препарату"
        aria-label="Назва препарату"
        className={field}
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        aria-label="Категорія препарату"
        className={`${field} bg-white`}
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <input
        value={manufacturer}
        onChange={(e) => setManufacturer(e.target.value)}
        placeholder="Виробник"
        aria-label="Виробник"
        className={field}
      />
      <input
        type="number"
        min="0"
        step="0.01"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Ціна, ₴"
        aria-label="Ціна, ₴"
        className={field}
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Опис (форма випуску, кількість)"
        aria-label="Опис"
        className={`${field} sm:col-span-2`}
      />
      <label className="flex cursor-pointer items-center gap-2 sm:col-span-2">
        <input type="checkbox" checked={rx} onChange={(e) => setRx(e.target.checked)} className="accent-emerald-600" />
        Відпускається за рецептом
      </label>
      <button
        type="submit"
        className="cursor-pointer rounded-lg bg-emerald-600 px-5 py-3 text-base text-white hover:bg-emerald-800 sm:col-span-2"
      >
        Додати препарат
      </button>
    </form>
  );
}
export default MedicineForm;
