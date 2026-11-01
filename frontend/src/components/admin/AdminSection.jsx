import { Link } from "react-router-dom";

const AdminSection = ({ eyebrow = "DALESKATE / ADMIN", title, subtitle, action, children }) => (
  <section className="mx-auto w-full max-w-7xl space-y-6">
    <header className="flex flex-col gap-4 border-b border-stone-300 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-2 font-geistmono text-[11px] uppercase tracking-[0.22em] text-red-700">{eyebrow}</p>
        <h1 className="font-spectral text-3xl leading-tight text-stone-950 sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
    {children}
  </section>
);

export const AdminEmptyState = ({ title, children }) => (
  <div className="rounded-2xl border border-dashed border-stone-300 bg-white/70 px-6 py-12 text-center">
    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-stone-950 text-lg text-white">—</div>
    <h2 className="font-spectral text-xl text-stone-900">{title}</h2>
    {children && <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone-500">{children}</p>}
  </div>
);

export const AdminActionLink = ({ to, children, secondary = false }) => (
  <Link to={to} className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition ${secondary ? "border border-stone-300 bg-white text-stone-800 hover:border-stone-500" : "bg-red-700 text-white hover:bg-red-800"}`}>
    {children}
  </Link>
);

export default AdminSection;

