const API_URL = import.meta.env.VITE_API_URL;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ArticlesAdmin = () => {
  const [articles, setArticles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArticles = async () => {
      const res = await fetch(`${API_URL}/api/article_list.php`);
      const data = await res.json();
      setArticles(data);
    };
    fetchArticles();
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
    <div className="p-6">
      <button
        onClick={() => navigate("/admin/articles/create")}
        className="bg-green-600 text-white px-4 py-2 rounded mb-4"
      >
        Crear Artículo
      </button>

      <div className="space-y-3">
        {articles.map((article) => (
          <div
            key={article.id}
            className="flex justify-between items-center border p-3 rounded"
          >
            <div>
              <h2 className="font-bold">{article.title}</h2>
              <p className="text-sm">{article.tags}</p>
            </div>
            <div className="flex gap-2">
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArticlesAdmin;
