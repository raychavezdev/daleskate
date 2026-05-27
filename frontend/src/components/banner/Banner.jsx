const API_URL = import.meta.env.VITE_API_URL;

import { useState, useEffect } from "react";
import Container from "../templates/Container";
import DOMPurify from "dompurify";

const Banner = () => {
  function stripHtml(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }

  const [article, setArticle] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/article_banner.php`)
      .then((res) => res.json())
      .then((data) => setArticle(data))
      .catch((err) => console.error("Error cargando banner:", err));
  }, []);

  if (!article) return null;

  return (
    <Container>
      <a href={`/articulo/${article.id}`}>
        {}
        {article.banner && (
          <div
            className="hidden md:flex w-full bg-center bg-no-repeat bg-cover h-[calc(100vh-168px)] items-end"
            style={{ backgroundImage: `url(${API_URL}/${article.banner})` }}
          >
            <div className="bg-black/70 text-white text-center p-2 flex flex-col gap-3 w-full">
              <span className="text-sm">
                {article.tags.replace(/,/g, " | ").toUpperCase()}
              </span>
              <h2 className="text-2xl font-serif">
                {article.title.toUpperCase()}
              </h2>
              <div className="line-clamp-2 break-words text-sm italic whitespace-pre-line px-5">
                {stripHtml(article.description)}
              </div>
            </div>
          </div>
        )}

        {}
        {article.banner_mobile && (
          <div
            className="flex md:hidden w-full bg-center bg-no-repeat bg-cover h-[calc(70vh)] items-end"
            style={{
              backgroundImage: `url(${API_URL}/${article.banner_mobile})`,
            }}
          >
            <div className="bg-black/70 text-white text-center p-2 flex flex-col gap-3 w-full">
              <span className="text-sm">
                {article.tags.replace(/,/g, " | ")}
              </span>
              <h2 className="text-xl font-serif">
                {article.title.toUpperCase()}
              </h2>
              <div className="line-clamp-2 break-words text-sm italic whitespace-pre-line px-5">
                {stripHtml(article.description)}
              </div>
            </div>
          </div>
        )}
      </a>
    </Container>
  );
};

export default Banner;
