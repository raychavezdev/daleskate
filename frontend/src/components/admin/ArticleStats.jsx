import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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

        if (res.status === 401) {
          localStorage.removeItem("token");
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
      }
    };

    fetchStats();
  }, [navigate]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Estadísticas de artículos</h1>
      {error && <p className="mb-4 text-red-600" role="alert">{error}</p>}

      <table className="w-full bg-white shadow rounded">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-3 text-left">Artículo</th>
            <th className="p-3 text-left">Visitas</th>
          </tr>
        </thead>

        <tbody>
          {stats.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="p-3">{item.title}</td>
              <td className="p-3 font-bold">{item.views}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ArticleStats;
