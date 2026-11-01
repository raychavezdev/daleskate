import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSection, { AdminEmptyState } from "./AdminSection.jsx";

const API_URL = import.meta.env.VITE_API_URL;
const FRONTEND_URL = window.location.origin;

const ExclusiveArticles = () => {
  const [articles, setArticles] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExclusive = async () => {
      const res = await fetch(`${API_URL}/api/article_exclusive_list.php`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      if (res.status === 403) {
        setError("No tienes permisos para administrar artículos exclusivos.");
        return;
      }
      if (!res.ok) {
        setError("No se pudieron cargar los artículos exclusivos.");
        return;
      }
      const data = await res.json();
      setArticles(Array.isArray(data) ? data : []);
    };
    fetchExclusive();
  }, [navigate]);

  const handleDelete = async (id) => {
    if (!confirm("¿Seguro que quieres eliminar este artículo?")) return;
    const res = await fetch(`${API_URL}/api/article_delete.php?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (res.status === 401) {
      localStorage.removeItem("token");
      navigate("/login");
      return;
    }
    if (res.status === 403) {
      setError("No tienes permisos para administrar artículos exclusivos.");
      return;
    }
    const data = await res.json();
    alert(data.message || data.error);
    if (res.ok) setArticles((current) => current.filter((article) => article.id !== id));
  };

  return (
    <AdminSection title="Artículos exclusivos" subtitle="Gestiona los enlaces compartibles de las historias exclusivas.">
      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}
      {articles.length === 0 ? <AdminEmptyState title="No hay artículos exclusivos">Los artículos exclusivos publicados aparecerán aquí con su enlace para compartir.</AdminEmptyState> : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {articles.map((article) => {
            const exclusiveUrl = `${FRONTEND_URL}/articulo/${article.id}?token=${article.exclusive_token}`;
            return (
              <article key={article.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="rounded-full bg-stone-950 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Exclusivo publicado</span>
                    <h2 className="mt-3 font-spectral text-xl text-stone-900">{article.title}</h2>
                    <p className="mt-1 text-xs text-stone-500">Creado: {article.created_at}</p>
                  </div>
                  <button onClick={() => handleDelete(article.id)} className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-600 transition hover:border-red-300 hover:text-red-700">Eliminar</button>
                </div>
                <button onClick={() => navigate(`/admin/articles/edit/${article.id}`)} className="mt-4 rounded-lg bg-stone-950 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-red-800">Editar artículo</button>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input type="text" value={exclusiveUrl} readOnly aria-label="Enlace compartible" className="min-w-0 flex-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-600" />
                  <button onClick={() => {
                    navigator.clipboard.writeText(exclusiveUrl);
                    setCopiedId(article.id);
                    setTimeout(() => setCopiedId(null), 2000);
                  }} className={`rounded-lg px-4 py-2 text-xs font-semibold text-white transition ${copiedId === article.id ? "bg-emerald-700" : "bg-red-700 hover:bg-red-800"}`}>
                    {copiedId === article.id ? "Copiado" : "Copiar enlace"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AdminSection>
  );
};

export default ExclusiveArticles;
