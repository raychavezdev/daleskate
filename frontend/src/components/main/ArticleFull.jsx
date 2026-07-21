import { useParams, useSearchParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import Container from "../templates/Container";
import DOMPurify from "dompurify";

const API_URL = import.meta.env.VITE_API_URL;

const ArticleFull = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [article, setArticle] = useState(null);
  const [recentArticles, setRecentArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [parsedContent, setParsedContent] = useState([]);

  const viewRegistered = useRef(false);

  const getImageUrl = (path) => {
    if (!path) return "";

    return path.startsWith("http") ? path : `${API_URL}/${path}`;
  };

  const createSlug = (item) => {
    if (item.slug) return item.slug;

    return item.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const registerView = async (articleId) => {
    try {
      await fetch(`${API_URL}/api/article_view.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `article_id=${encodeURIComponent(articleId)}`,
      });
    } catch (error) {
      console.error("Error registrando visita:", error);
    }
  };

  useEffect(() => {
    viewRegistered.current = false;
    setLoading(true);
    setError("");

    const fetchArticle = async () => {
      try {
        let url = "";

        if (token) {
          url = `${API_URL}/api/article_get.php?token=${encodeURIComponent(
            token,
          )}`;
        } else if (id) {
          url = `${API_URL}/api/article_get.php?id=${encodeURIComponent(id)}`;
        } else {
          throw new Error("Parámetros inválidos");
        }

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Error al obtener el artículo");
        }

        const data = await response.json();

        setArticle(data);

        if (data.id && !viewRegistered.current) {
          viewRegistered.current = true;
          registerView(data.id);
        }

        try {
          const parsed =
            typeof data.contenido === "string"
              ? JSON.parse(data.contenido)
              : data.contenido;

          setParsedContent(Array.isArray(parsed) ? parsed : []);
        } catch (parseError) {
          console.error(
            "Error interpretando el contenido del artículo:",
            parseError,
          );

          setParsedContent([]);
        }

        const recentResponse = await fetch(
          `${API_URL}/api/article_list.php?exclude_banner=1`,
        );

        if (recentResponse.ok) {
          const recentData = await recentResponse.json();

          const articlesArray = Array.isArray(recentData)
            ? recentData
            : [];

          const filteredArticles = articlesArray
            .filter(
              (item) => Number(item.id) !== Number(data.id),
            )
            .slice(0, 3);

          setRecentArticles(filteredArticles);
        }
      } catch (fetchError) {
        setError("No se pudo cargar el artículo");
        console.error(fetchError);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id, token]);

  if (loading) {
    return (
      <p className="text-center mt-10">
        Cargando artículo...
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-center text-red-500 mt-10">
        {error}
      </p>
    );
  }

  if (!article) {
    return (
      <p className="text-center mt-10">
        Artículo no encontrado
      </p>
    );
  }

  /*
   * Si existe la portada específica para cada dispositivo, se usa esa.
   * Si no existe, se utiliza la otra como respaldo.
   */
  const desktopBanner =
    article.banner || article.banner_mobile || "";

  const mobileBanner =
    article.banner_mobile || article.banner || "";

  return (
    <div className="bg-white">
      <Container>
        <div className="pt-5 pb-10">
          <div className="px-5">
            <h1 className="text-4xl font-bold font-serif">
              {(article.title || "").toUpperCase()}
            </h1>

            {article.tags && (
              <div className="flex flex-wrap gap-2 my-2 text-sm">
                {article.tags.replace(/,/g, " | ").toUpperCase()}
              </div>
            )}
          </div>

          {desktopBanner && (
            <img
              src={getImageUrl(desktopBanner)}
              alt={article.title}
              className="hidden md:block w-full object-cover"
            />
          )}

          {mobileBanner && (
            <img
              src={getImageUrl(mobileBanner)}
              alt={`${article.title} - móvil`}
              className="block md:hidden w-full object-cover"
            />
          )}

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
            <article className="min-w-0 flex-1">
              <div className="space-y-6">
                {article.description && (
                  <div
                    className="px-5 preview whitespace-pre-line mb-4"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        article.description,
                      ),
                    }}
                  />
                )}

                {parsedContent.map((block, index) => {
                  switch (block.tipo) {
                    case "texto":
                      return (
                        <div
                          key={index}
                          className="px-5 whitespace-pre-line"
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(
                              block.valor || "",
                            ),
                          }}
                        />
                      );

                    case "subtitle":
                      return (
                        <h2
                          key={index}
                          className="px-5 text-2xl font-semibold mt-6 mb-2"
                        >
                          {block.valor}
                        </h2>
                      );

                    case "imagen": {
                      if (!block.valor) return null;

                      const imageSrc = getImageUrl(block.valor);

                      if (block.fullWidth) {
                        return (
                          <div key={index}>
                            <img
                              src={imageSrc}
                              alt=""
                              className="w-full"
                            />
                          </div>
                        );
                      }

                      return (
                        <div key={index} className="px-5">
                          <img
                            src={imageSrc}
                            alt=""
                            className="w-full"
                          />
                        </div>
                      );
                    }

                    case "video": {
                      if (!block.valor) return null;

                      let videoId = "";

                      if (block.valor.includes("youtu.be/")) {
                        videoId = block.valor
                          .split("youtu.be/")[1]
                          .split("?")[0];
                      } else if (block.valor.includes("watch?v=")) {
                        videoId = block.valor
                          .split("watch?v=")[1]
                          .split("&")[0];
                      } else if (
                        block.valor.includes("youtube.com/embed/")
                      ) {
                        videoId = block.valor
                          .split("youtube.com/embed/")[1]
                          .split("?")[0];
                      }

                      const embedUrl = videoId
                        ? `https://www.youtube.com/embed/${videoId}`
                        : "";

                      if (!embedUrl) return null;

                      return (
                        <div key={index} className="px-5">
                          <div className="w-full aspect-video">
                            <iframe
                              src={embedUrl}
                              title={`Video ${index + 1}`}
                              className="w-full h-full rounded"
                              allowFullScreen
                            />
                          </div>
                        </div>
                      );
                    }

                    case "video_externo":
                      return (
                        <div
                          key={index}
                          className="px-5 w-full text-center"
                        >
                          {block.preview && (
                            <img
                              src={getImageUrl(block.preview)}
                              alt="Miniatura del video"
                              className="w-full mb-3"
                            />
                          )}

                          {block.valor && (
                            <a
                              href={block.valor}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block px-4 py-1 font-bold transition font-serif border border-orange-700 rounded-4xl text-sm hover:bg-orange-700 hover:text-white"
                            >
                              VER VIDEO
                            </a>
                          )}
                        </div>
                      );

                    default:
                      return null;
                  }
                })}
              </div>
            </article>

            <aside className="relative w-full lg:w-[320px] mt-14 lg:mt-0 px-5 lg:px-0 border-t lg:border-none pt-4 lg:pt-0">
              <div className="sticky top-4 max-h-[100vh] flex flex-col pb-4">
                <h3 className="text-xl font-bold mb-3 tracking-wide font-serif">
                  ARTÍCULOS RECIENTES
                </h3>

                <div className="flex flex-col justify-start gap-4">
                  {recentArticles.map((item) => {
                    const safeSlug = createSlug(item);

                    const recentArticleBanner =
                      item.banner || item.banner_mobile || "";

                    return (
                      <a
                        key={item.id}
                        href={`/articulo/${item.id}-${safeSlug}`}
                        className="block group"
                      >
                        {recentArticleBanner && (
                          <div className="overflow-hidden rounded">
                            <img
                              src={getImageUrl(
                                recentArticleBanner,
                              )}
                              alt={item.title}
                              className="w-full aspect-[18/9] object-cover transition duration-500 group-hover:scale-105"
                            />
                          </div>
                        )}

                        {item.tags && (
                          <p
                            className={`text-[10px] tracking-widest text-orange-500 uppercase line-clamp-1 ${
                              recentArticleBanner
                                ? "mt-1"
                                : ""
                            }`}
                          >
                            {item.tags.replace(/,/g, " | ")}
                          </p>
                        )}

                        <h4 className="font-bold text-sm leading-tight mt-1 group-hover:text-orange-500 transition line-clamp-2">
                          {item.title}
                        </h4>

                        {item.description && (
                          <p className="text-[11px] text-gray-600 mt-1 line-clamp-2">
                            {item.description.replace(
                              /<[^>]*>/g,
                              "",
                            )}
                          </p>
                        )}
                      </a>
                    );
                  })}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ArticleFull;