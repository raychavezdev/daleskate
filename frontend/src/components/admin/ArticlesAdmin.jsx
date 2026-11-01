const API_URL = import.meta.env.VITE_API_URL;

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AdminSection, { AdminActionLink, AdminEmptyState } from "./AdminSection.jsx";
import { clearSessionOnUnauthorizedStatus } from "./sessionToken.js";

const ArticlesAdmin = () => {
  const [articles, setArticles] = useState([]);
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get("estado") === "draft" ? "draft" : "all");
  const navigate = useNavigate();

  const fetchArticles = async () => {
    const res = await fetch(`${API_URL}/api/article_admin_list.php`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (clearSessionOnUnauthorizedStatus(res.status)) {
      navigate("/login");
      return;
    }
    if (res.status === 403) {
      alert("No tienes permisos para administrar artículos.");
      return;
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No se pudieron cargar los artículos.");
    setArticles(data);
  };

  useEffect(() => {
    fetchArticles().catch((error) => alert(error.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleArticles = useMemo(
    () => articles.filter((article) => filter === "all" || article.status === filter),
    [articles, filter],
  );

  const handleDelete = async (id) => {
    if (!confirm("¿Seguro que quieres eliminar este artículo?")) return;
    const res = await fetch(`${API_URL}/api/article_delete.php?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (clearSessionOnUnauthorizedStatus(res.status)) {
      navigate("/login");
      return;
    }
    if (res.status === 403) {
      alert("No tienes permisos para administrar artículos.");
      return;
    }
    const data = await res.json();
    alert(data.message || data.error);
    if (res.ok) setArticles((current) => current.filter((article) => article.id !== id));
  };

  const returnToDraft = async (article) => {
    if (!confirm("¿Devolver este artículo publicado a borrador? Dejará de aparecer públicamente.")) return;
    const formData = new FormData();
    formData.append("id", article.id);
    formData.append("status", "draft");
    const res = await fetch(`${API_URL}/api/article_status.php`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: formData,
    });
    if (clearSessionOnUnauthorizedStatus(res.status)) {
      navigate("/login");
      return;
    }
    if (res.status === 403) {
      alert("No tienes permisos para administrar artículos.");
      return;
    }
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "No se pudo cambiar el estado del artículo.");
      return;
    }
    setArticles((current) => current.map((item) => item.id === article.id ? { ...item, status: "draft" } : item));
  };

  return (
    <AdminSection title="Artículos" subtitle="Organiza las historias publicadas y continúa trabajando en tus borradores." action={<AdminActionLink to="/admin/articles/create">Crear artículo <span className="ml-2" aria-hidden="true">＋</span></AdminActionLink>}>
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-stone-900">Biblioteca editorial</p>
            <p className="text-xs text-stone-500">{visibleArticles.length} {filter === "draft" ? "borradores" : filter === "published" ? "publicados" : "artículos"}</p>
          </div>
          <div className="flex gap-1 rounded-xl bg-stone-100 p-1" role="group" aria-label="Filtrar artículos">
            {[["all", "Todos"], ["published", "Publicados"], ["draft", "Borradores"]].map(([value, label]) => (
              <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${filter === value ? "bg-stone-950 text-white shadow-sm" : "text-stone-600 hover:bg-white"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        {visibleArticles.length === 0 ? (
          <AdminEmptyState title={filter === "draft" ? "No hay borradores" : "Todavía no hay artículos"}>
            {filter === "draft" ? "Los artículos guardados para continuar después aparecerán aquí." : "Crea un artículo para empezar a construir la revista."}
          </AdminEmptyState>
        ) : (
          <div className="divide-y divide-stone-100">
            {visibleArticles.map((article) => (
              <article key={article.id} className="flex flex-col gap-4 py-4 first:pt-1 last:pb-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-semibold text-stone-900">{article.title || "Sin título"}</h2>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${article.status === "draft" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                      {article.status === "draft" ? "Borrador" : "Publicado"}
                    </span>
                    {Number(article.is_exclusive) === 1 && <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-600">Exclusivo</span>}
                  </div>
                  <p className="mt-1 truncate text-sm text-stone-500">{article.tags || "Sin tags"}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button onClick={() => navigate(`/admin/articles/edit/${article.id}`)} className="rounded-lg bg-stone-950 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-red-800">
                    {article.status === "draft" ? "Editar / publicar" : "Editar"}
                  </button>
                  {article.status === "published" && <button onClick={() => returnToDraft(article)} className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-50">Devolver a borrador</button>}
                  <button onClick={() => handleDelete(article.id)} className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-600 transition hover:border-red-300 hover:text-red-700">Eliminar</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AdminSection>
  );
};

export default ArticlesAdmin;
