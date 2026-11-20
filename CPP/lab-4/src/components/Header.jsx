const PAGES = [
  ["catalog", "Каталог"],
  ["cart", "Кошик"],
  ["orders", "Замовлення"],
  ["medicines", "Препарати"],
];
function Header({ page, onNavigate, cartCount }) {
  return (
    <header className="sticky top-0 z-10 border-b border-emerald-100 bg-white/95">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <button
          onClick={() => onNavigate("catalog")}
          className="flex cursor-pointer items-center gap-2 text-xl font-bold text-slate-800"
          aria-label="ФармаЛайф — на головну"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 text-white">+</span>
          ФармаЛайф
        </button>
        <nav aria-label="Головне меню" className="flex flex-wrap gap-1">
          {PAGES.map(([key, label]) => (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              aria-current={page === key ? "page" : undefined}
              className={`cursor-pointer rounded-lg px-3 py-2 text-sm font-medium ${
                page === key ? "bg-emerald-600 text-white" : "text-slate-700 hover:bg-emerald-100"
              }`}
            >
              {label}
              {key === "cart" && (
                <span
                  aria-label="Товарів у кошику"
                  className="ml-1.5 rounded-full bg-rose-500 px-1.5 py-0.5 text-xs text-white"
                >
                  {cartCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
export default Header;
