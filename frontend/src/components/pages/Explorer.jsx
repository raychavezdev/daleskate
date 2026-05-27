import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Container from "../templates/Container";
import Article from "../main/Article";

const API_URL = import.meta.env.VITE_API_URL;

const Explorer = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const location = useLocation();

  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get("q") || "";
    setSearch(query);
  }, [location]);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await fetch(`${API_URL}/api/article_list.php`);
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

  const filteredArticles = articles.filter(
    (article) =>
      article.title.toLowerCase().includes(search.toLowerCase()) ||
      article.description.toLowerCase().includes(search.toLowerCase()) ||
      article.tags.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="mt-14">
      <Container>
        <h1 className="text-xl tracking-widest text-center text-white mb-6">
          EXPLORAR
        </h1>

        <div className="mb-5 w-full px-10">
          <input
            type="text"
            placeholder="Buscar artículos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white rounded-3xl py-2 pl-8 text-xl w-full border-2 border-gray-400 mb-4"
          />
        </div>

        <div className="md:grid md:grid-cols-2 gap-6">
          {filteredArticles.length > 0 ? (
            filteredArticles.map((article) => (
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
            <p className=" text-gray-500 my-10">No se encontraron artículos</p>
          )}
        </div>
      </Container>
    </div>
  );
};

export default Explorer;
