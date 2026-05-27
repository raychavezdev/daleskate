import { useEffect, useState } from "react";
import Container from "../templates/Container";
import Article from "./Article";
const API_URL = import.meta.env.VITE_API_URL;

const RecentArticles = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/article_list.php?exclude_banner=1`,
        );
        if (!res.ok) throw new Error("Error al cargar artículos");
        const data = await res.json();
        setArticles(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  if (loading)
    return <p className="text-center mt-10">Cargando artículos...</p>;

  return (
    <div className="mt-20">
      <Container>
        <hr className="text-orange-400" />
        <h2 className="text-orange-400 text-center text-2xl my-2 tracking-widest">
          ARTÍCULOS RECIENTES
        </h2>
        <div className="md:grid md:grid-cols-2 md:gap-6">
          {articles.length > 0 ? (
            articles.map((article) => (
              <Article
                key={article.id}
                id={article.id}
                slug={article.slug}
                header={article.tags.replace(/,/g, " | ")}
                img={article.banner}
                title={article.title}
                text={article.description}
              />
            ))
          ) : (
            <p className="text-center text-gray-500">No hay artículos</p>
          )}
        </div>
      </Container>
    </div>
  );
};

export default RecentArticles;
