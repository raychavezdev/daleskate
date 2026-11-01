import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSection, { AdminEmptyState } from "./AdminSection.jsx";
import { clearSessionOnUnauthorizedStatus } from "./sessionToken.js";

const API_URL = import.meta.env.VITE_API_URL;

const ArticleStats = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/api/article_stats.php`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (clearSessionOnUnauthorizedStatus(res.status)) {
          navigate("/login");
          return;
        }
        if (res.status === 403) {
          setError("No tienes permisos para ver las estadísticas.");
          return;
        }

        if (!res.ok) throw new Error("No se pudieron cargar las estadísticas");

        const data = await res.json();
        setStats(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setError("No se pudieron cargar las estadísticas.");
      }
    };

    fetchStats();
  }, [navigate]);

  return (
    <AdminSection title="Estadísticas" subtitle="Visitas registradas en los artículos de DaleSkate.">
      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="font-geistmono text-[10px] uppercase tracking-[0.18em] text-stone-500">Audiencia</p>
            <h2 className="mt-1 font-spectral text-2xl text-stone-900">Visitas por artículo</h2>
          </div>
          <span className="rounded-full bg-stone-100 px-3 py-1 font-geistmono text-xs text-stone-700">{stats.length}</span>
        </div>
        {stats.length === 0 ? <AdminEmptyState title="Aún no hay visitas registradas">Cuando los lectores visiten artículos publicados, las cifras aparecerán en esta tabla.</AdminEmptyState> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-left">
              <thead><tr className="border-b border-stone-200 text-[10px] uppercase tracking-[0.16em] text-stone-500"><th className="px-3 py-3 font-semibold">Artículo</th><th className="px-3 py-3 text-right font-semibold">Visitas</th></tr></thead>
              <tbody>{stats.map((item) => (
                <tr key={item.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                  <td className="px-3 py-4 font-medium text-stone-800">{item.title}</td>
                  <td className="px-3 py-4 text-right font-geistmono text-sm text-red-800">{item.views}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </AdminSection>
  );
};

export default ArticleStats;
