import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;
const FRONTEND_URL = window.location.origin;

const ExclusiveArticles = () => {
  const [articles, setArticles] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExclusive = async () => {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/api/article_exclusive_list.php`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setArticles(data);
    };

    fetchExclusive();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("¿Seguro que quieres eliminar este artículo?")) return;
    const res = await fetch(`${API_URL}/api/article_delete.php?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    });
    const data = await res.json();
    alert(data.message || data.error);
    setArticles(articles.filter((a) => a.id !== id));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Artículos Exclusivos</h1>

      <div className="space-y-4">
        {articles.map((article) => {
          const exclusiveUrl = `${FRONTEND_URL}/articulo/${article.id}?token=${article.exclusive_token}`;

          return (
            <div
              key={article.id}
              className="bg-white shadow p-4 rounded border"
            >
              <h2 className="font-bold text-lg">{article.title}</h2>

              <p className="text-sm text-gray-500">
                Creado: {article.created_at}
              </p>

              <div className="flex gap-1">
                <button
                  onClick={() => navigate(`/admin/articles/edit/${article.id}`)}
                  className="bg-blue-600 text-white px-3 py-1 rounded"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(article.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  Eliminar
                </button>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <input
                  type="text"
                  value={exclusiveUrl}
                  readOnly
                  className="flex-1 border px-2 py-1 text-sm"
                />

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(exclusiveUrl);
                    setCopiedId(article.id);

                    setTimeout(() => {
                      setCopiedId(null);
                    }, 2000);
                  }}
                  className={`px-3 py-1 rounded transition-all duration-300 ${
                    copiedId === article.id
                      ? "bg-green-600 text-white"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {copiedId === article.id ? "✅ Copiado" : "Copiar"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExclusiveArticles;
