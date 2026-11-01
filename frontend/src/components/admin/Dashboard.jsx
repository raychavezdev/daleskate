import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearStoredSession } from "./sessionToken.js";

const sections = [
  { to: "/admin", label: "Inicio", end: true },
  { to: "/admin/articles", label: "Artículos" },
  { to: "/admin/exclusive-articles", label: "Artículos exclusivos" },
  { to: "/admin/ads", label: "Publicidad" },
  { to: "/admin/stats", label: "Estadísticas" },
  { to: "/admin/polls", label: "Encuestas" },
  { to: "/admin/polls/create", label: "Crear encuesta" },
];

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearStoredSession();
    navigate("/login");
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#f3f0eb] text-stone-900">
      <aside className="flex w-56 shrink-0 flex-col bg-[#171717] text-white sm:w-64">
        <NavLink to="/admin" end className="border-b border-white/10 px-6 py-6">
          <span className="block font-spectral text-2xl tracking-wide">DALESKATE</span>
          <span className="mt-1 block font-geistmono text-[9px] uppercase tracking-[0.22em] text-stone-400">Panel editorial</span>
        </NavLink>
        <div className="px-4 pt-6">
          <p className="mb-3 px-3 font-geistmono text-[9px] uppercase tracking-[0.2em] text-stone-500">Administración</p>
          <nav className="space-y-1">
            {sections.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${isActive ? "bg-white/10 text-white" : "text-stone-400 hover:bg-white/5 hover:text-white"}`
              }>
                <span className="h-1.5 w-1.5 rounded-full bg-red-600" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="mt-auto space-y-2 border-t border-white/10 p-4">
          <NavLink to="/admin/change-password" className="block rounded-xl px-3 py-2 text-sm text-stone-400 transition hover:bg-white/5 hover:text-white">
            Cambiar contraseña
          </NavLink>
          <button onClick={handleLogout} className="w-full rounded-xl border border-white/10 px-3 py-2.5 text-left text-sm text-stone-300 transition hover:border-red-700/60 hover:bg-red-950/40 hover:text-white">
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-7 sm:py-8 lg:px-10">
        <Outlet />
      </main>
    </div>
  );
};

export default Dashboard;
