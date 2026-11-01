const API_URL = import.meta.env.VITE_API_URL;

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const ArticlesAdmin = () => {
  const [articles, setArticles] = useState([]);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  const fetchArticles = async () => {
    const res = await fetch(`${API_URL}/api/article_admin_list.php`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (res.status === 401) {
      localStorage.removeItem("token");
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
    // fetchArticles reads the current session and navigation handler on mount.
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
    if (res.status === 401) {
      localStorage.removeItem("token");
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
    if (res.status === 401) {
      localStorage.removeItem("token");
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
    <div className="p-6">
      <button
        onClick={() => navigate("/admin/articles/create")}
        className="bg-green-600 text-white px-4 py-2 rounded mb-4"
      >
        Crear Artículo
      </button>

      <div className="mb-4 flex gap-2" role="group" aria-label="Filtrar artículos">
        {[["all", "Todos"], ["published", "Publicados"], ["draft", "Borradores"]].map(([value, label]) => (
          <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value}
            className={`px-3 py-1 rounded ${filter === value ? "bg-gray-800 text-white" : "bg-gray-200"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {visibleArticles.map((article) => (
          <div key={article.id} className="flex justify-between items-center border p-3 rounded">
            <div>
              <h2 className="font-bold">{article.title || "Sin título"}</h2>
              <p className="text-sm">{article.tags}</p>
              <span className={`inline-block mt-1 rounded px-2 py-0.5 text-xs ${article.status === "draft" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}>
                {article.status === "draft" ? "Borrador" : "Publicado"}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigate(`/admin/articles/edit/${article.id}`)} className="bg-blue-600 text-white px-3 py-1 rounded">
                {article.status === "draft" ? "Editar / publicar" : "Editar"}
              </button>
              {article.status === "published" && (
                <button onClick={() => returnToDraft(article)} className="bg-amber-600 text-white px-3 py-1 rounded">
                  Devolver a borrador
                </button>
              )}
              <button onClick={() => handleDelete(article.id)} className="bg-red-600 text-white px-3 py-1 rounded">
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArticlesAdmin;
