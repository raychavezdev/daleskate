import { useEffect, useState } from "react";
import Container from "../templates/Container";
import Article from "./Article";

const API_URL = import.meta.env.VITE_API_URL;

const RecentArticles = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const parseContent = (content) => {
    if (!content) return [];

    if (Array.isArray(content)) {
      return content;
    }

    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    } catch (parseError) {
      console.error("Error interpretando el contenido:", parseError);
      return [];
    }
  };

  const getYouTubeVideoId = (url = "") => {
    if (!url) return "";

    try {
      const parsedUrl = new URL(url);

      if (parsedUrl.hostname.includes("youtu.be")) {
        return parsedUrl.pathname.split("/").filter(Boolean)[0] || "";
      }

      if (parsedUrl.pathname.includes("/shorts/")) {
        return parsedUrl.pathname.split("/shorts/")[1]?.split("/")[0] || "";
      }

      if (parsedUrl.pathname.includes("/embed/")) {
        return parsedUrl.pathname.split("/embed/")[1]?.split("/")[0] || "";
      }

      return parsedUrl.searchParams.get("v") || "";
    } catch {
      const match = url.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      );

      return match?.[1] || "";
    }
  };

  const getYouTubeThumbnail = (content) => {
    const blocks = parseContent(content);

    const firstYouTubeVideo = blocks.find(
      (block) => block.tipo === "video" && block.valor,
    );

    if (!firstYouTubeVideo) return "";

    const videoId = getYouTubeVideoId(firstYouTubeVideo.valor);

    if (!videoId) return "";

    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  };

  const getArticleCardImage = (article) => {
    return (
      article.banner ||
      article.banner_mobile ||
      getYouTubeThumbnail(article.contenido) ||
      ""
    );
  };

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/article_list.php?exclude_banner=1`,
        );

        if (!response.ok) {
          throw new Error("Error al cargar artículos");
        }

        const data = await response.json();

        setArticles(Array.isArray(data) ? data : []);
      } catch (fetchError) {
        console.error(fetchError);
        setError("No se pudieron cargar los artículos.");
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  if (loading) {
    return (
      <p className="mt-10 text-center text-gray-400">
        Cargando artículos...
      </p>
    );
  }

  return (
    <section className="mt-20">
      <Container>
        <hr className="border-orange-400" />

        <h2 className="my-3 text-center text-2xl tracking-widest text-orange-400">
          ARTÍCULOS RECIENTES
        </h2>

        {error ? (
          <p className="py-10 text-center text-red-500">{error}</p>
        ) : articles.length > 0 ? (
          <div className="md:grid md:grid-cols-2 md:gap-6">
            {articles.map((article) => (
              <Article
                key={article.id}
                id={article.id}
                slug={article.slug}
                header={
                  article.tags
                    ? article.tags.replace(/,/g, " | ")
                    : ""
                }
                img={getArticleCardImage(article)}
                title={article.title}
                text={article.description}
              />
            ))}
          </div>
        ) : (
          <p className="py-10 text-center text-gray-500">
            No hay artículos disponibles.
          </p>
        )}
      </Container>
    </section>
  );
};

export default RecentArticles;