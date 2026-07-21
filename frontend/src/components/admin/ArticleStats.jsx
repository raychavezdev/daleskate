import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

const ArticleStats = () => {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/article_stats.php`)
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(console.error);
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Estadísticas de artículos</h1>

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
