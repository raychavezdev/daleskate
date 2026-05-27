const API_URL = import.meta.env.VITE_API_URL;

import { useState, useEffect } from "react";
import Article from "../main/Article";
import Container from "../templates/Container";

const Videos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await fetch(`${API_URL}/api/article_videos.php`);
        if (!res.ok) throw new Error("Error al cargar los videos");
        const data = await res.json();
        console.log(data);
        setVideos(data);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar los videos");
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  if (loading) return <p className="text-center mt-10">Cargando videos...</p>;
  if (error) return <p className="text-center text-red-500 mt-10">{error}</p>;
  if (videos.length === 0)
    return <p className="text-center mt-10">No hay videos disponibles</p>;

  return (
    <Container>
      <h1 className="text-xl tracking-widest text-white mb-6 text-center">
        VIDEOS
      </h1>
      <div className="md:grid md:grid-cols-2 gap-4">
        {videos.map((article) => (
          <Article
            key={article.id}
            id={article.id}
            slug={article.slug}
            header={article.tags.replace(/,/g, " | ").toUpperCase()}
            img={article.banner}
            title={article.title}
            text={article.description}
          />
        ))}
      </div>
    </Container>
  );
};

export default Videos;
