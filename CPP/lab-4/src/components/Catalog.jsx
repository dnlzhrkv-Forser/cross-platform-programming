import { useState } from "react";
import MedicineCard from "./MedicineCard.jsx";
import PageTitle from "./PageTitle.jsx";
const field = "rounded-lg border border-emerald-300 bg-white px-3 py-2.5 text-base";
function Catalog({ medicines, onAddToCart }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [rx, setRx] = useState("");
  const [sort, setSort] = useState("");
  const categories = [...new Set(medicines.map((m) => m.category))].sort();
  // Відфільтрований список обчислюється «на льоту» й окремо в стані не зберігається
  const q = query.trim().toLowerCase();
  const visible = medicines
    .filter(
      (m) =>
        (!q || `${m.name} ${m.manufacturer}`.toLowerCase().includes(q)) &&
        (!category || m.category === category) &&
        (!rx || m.prescriptionRequired === (rx === "1")),
    )
    .sort((a, b) => (sort === "asc" ? a.price - b.price : sort === "desc" ? b.price - a.price : 0));
  return (
    <section>
      <PageTitle title="Каталог ліків" subtitle="Шукайте, фільтруйте та додавайте ліки до кошика" />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Пошук за назвою або виробником"
          aria-label="Пошук"
          className={field}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Категорія" className={field}>
          <option value="">Усі категорії</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={rx} onChange={(e) => setRx(e.target.value)} aria-label="Рецепт" className={field}>
          <option value="">Рецепт: будь-який</option>
          <option value="0">Без рецепта</option>
          <option value="1">За рецептом</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Сортування" className={field}>
          <option value="">Без сортування</option>
          <option value="asc">Ціна ↑</option>
          <option value="desc">Ціна ↓</option>
        </select>
      </div>
      <p className="mb-4 text-slate-500" role="status">
        {visible.length ? `Знайдено: ${visible.length} з ${medicines.length}` : "Нічого не знайдено"}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((m) => (
          <MedicineCard key={m.id} medicine={m} onAddToCart={onAddToCart} />
        ))}
      </div>
    </section>
  );
}
export default Catalog;
