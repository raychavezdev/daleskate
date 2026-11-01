const API_URL = import.meta.env.VITE_API_URL;

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AdminEmptyState } from "./AdminSection.jsx";
import { clearSessionOnUnauthorizedStatus } from "./sessionToken.js";

const metricCards = [
  { key: "published", label: "Artículos publicados", note: "En la revista", accent: "border-red-700" },
  { key: "drafts", label: "Borradores", note: "En edición", accent: "border-amber-600" },
  { key: "exclusive", label: "Artículos exclusivos", note: "Publicados", accent: "border-stone-900" },
  { key: "polls", label: "Encuestas", note: "Registradas", accent: "border-stone-500" },
  { key: "ads", label: "Anuncios", note: "Activos", accent: "border-red-700" },
];

const quickActions = [
  { title: "Crear artículo", description: "Abre una nueva historia o empieza un borrador.", to: "/admin/articles/create", mark: "01" },
  { title: "Ver borradores", description: "Continúa editando artículos pendientes.", to: "/admin/articles?estado=draft", mark: "02" },
  { title: "Crear encuesta", description: "Prepara una pregunta para la comunidad.", to: "/admin/polls/create", mark: "03" },
  { title: "Administrar publicidad", description: "Consulta y gestiona los anuncios actuales.", to: "/admin/ads", mark: "04" },
];

const AdminHome = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadSummary = async () => {
      try {
        const token = localStorage.getItem("token");
        const [articleResponse, pollResponse, adsResponse] = await Promise.all([
          fetch(`${API_URL}/api/article_admin_list.php`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/poll_list.php`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/ads_get.php`),
        ]);

        if (clearSessionOnUnauthorizedStatus(articleResponse.status) || clearSessionOnUnauthorizedStatus(pollResponse.status)) {
          navigate("/login");
          return;
        }
        if (articleResponse.status === 403 || pollResponse.status === 403) {
          setError("No tienes permisos para consultar el resumen administrativo.");
          return;
        }

        const [articles, polls, ads] = await Promise.all([
          articleResponse.json(), pollResponse.json(), adsResponse.json(),
        ]);
        if (!articleResponse.ok || !pollResponse.ok || !adsResponse.ok) {
          throw new Error("No se pudo cargar toda la información del resumen.");
        }
        if (!active) return;
        const articleRows = Array.isArray(articles) ? articles : [];
        setMetrics({
          published: articleRows.filter((article) => article.status === "published").length,
          drafts: articleRows.filter((article) => article.status === "draft").length,
          exclusive: articleRows.filter((article) => article.status === "published" && Number(article.is_exclusive) === 1).length,
          polls: Array.isArray(polls.polls) ? polls.polls.length : 0,
          ads: Array.isArray(ads) ? ads.length : 0,
        });
      } catch {
        if (active) setError("No se pudieron cargar las métricas. Puedes entrar a cada sección para consultar sus datos.");
      }
    };
    loadSummary();
    return () => { active = false; };
  }, [navigate]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-9">
      <header className="overflow-hidden rounded-3xl bg-stone-950 px-6 py-8 text-white shadow-xl sm:px-10 sm:py-11">
        <p className="font-geistmono text-[11px] uppercase tracking-[0.24em] text-red-400">DALESKATE / CONTROL EDITORIAL</p>
        <h1 className="mt-3 font-spectral text-4xl sm:text-5xl">Panel administrativo</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-300 sm:text-base">
          Desde aquí gestionas artículos, exclusivos, publicidad y encuestas de la revista.
        </p>
        <div className="mt-7 h-1 w-20 rounded-full bg-red-700" />
      </header>

      <section aria-labelledby="summary-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="font-geistmono text-[10px] uppercase tracking-[0.2em] text-stone-500">En una mirada</p>
            <h2 id="summary-title" className="mt-1 font-spectral text-2xl text-stone-900">Resumen del sitio</h2>
          </div>
          {metrics && <span className="text-xs text-stone-500">Datos actuales</span>}
        </div>
        {error ? <AdminEmptyState title="Resumen no disponible">{error}</AdminEmptyState> : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {metricCards.map((card) => (
              <article key={card.key} className={`rounded-2xl border border-stone-200 border-t-4 ${card.accent} bg-white p-5 shadow-sm`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{card.label}</p>
                <p className="mt-4 font-geistmono text-4xl text-stone-950">{metrics ? metrics[card.key] : "—"}</p>
                <p className="mt-1 text-xs text-stone-500">{card.note}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="actions-title">
        <div className="mb-4">
          <p className="font-geistmono text-[10px] uppercase tracking-[0.2em] text-stone-500">Atajos</p>
          <h2 id="actions-title" className="mt-1 font-spectral text-2xl text-stone-900">¿Qué quieres hacer?</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {quickActions.map((action) => (
            <Link key={action.title} to={action.to} className="group flex items-start gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md">
              <span className="font-geistmono text-xs text-red-700">{action.mark}</span>
              <span>
                <span className="block font-semibold text-stone-900 group-hover:text-red-800">{action.title}</span>
                <span className="mt-1 block text-sm text-stone-500">{action.description}</span>
              </span>
              <span className="ml-auto text-stone-400 transition group-hover:translate-x-1 group-hover:text-red-700" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminHome;
