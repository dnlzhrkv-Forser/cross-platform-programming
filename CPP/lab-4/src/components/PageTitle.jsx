function PageTitle({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-emerald-700">{title}</h1>
      <p className="text-slate-600">{subtitle}</p>
    </div>
  );
}
export default PageTitle;
