import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const Article = ({
  id,
  slug,
  header,
  img,
  title,
  text,
}) => {
  const safeTitle = title || "Artículo";

  const safeSlug =
    slug ||
    safeTitle
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

  const stripHtml = (html = "") => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;

    return tmp.textContent || tmp.innerText || "";
  };

  const getImageUrl = (path) => {
    if (!path) return "";

    return path.startsWith("http")
      ? path
      : `${API_URL}/${path}`;
  };

  const imageUrl = getImageUrl(img);
  const cleanText = stripHtml(text);

  return (
    <article className="mb-10 overflow-hidden border border-gray-800 bg-black group lg:flex-1">
      <Link
        to={`/articulo/${id}-${safeSlug}`}
        className="block h-full"
      >
        {header && (
          <header className="min-h-10 bg-white p-2 text-end text-sm uppercase tracking-wider text-red-500">
            {header}
          </header>
        )}

        {imageUrl ? (
          <div className="h-96 overflow-hidden bg-gray-900">
            <img
              src={imageUrl}
              alt={safeTitle}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="relative flex h-96 items-end overflow-hidden bg-neutral-900 p-6">
            <div
              aria-hidden="true"
              className="absolute -right-10 -top-16 font-serif text-[10rem] font-black leading-none text-white/5"
            >
              DS
            </div>

            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1 bg-orange-500"
            />

            <div className="relative z-10">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-orange-500">
                Dale Skate
              </p>

              <h3 className="font-serif text-4xl font-bold uppercase leading-tight tracking-wider text-white transition-colors group-hover:text-[#f07e19]">
                {safeTitle}
              </h3>
            </div>
          </div>
        )}

        <div className="px-6 pb-6 text-white">
          {imageUrl && (
            <h3 className="mt-3 font-serif text-2xl font-bold uppercase tracking-wider transition-colors group-hover:text-[#f07e19]">
              {safeTitle}
            </h3>
          )}

          {cleanText && (
            <p className="mt-2 line-clamp-2 break-words whitespace-pre-line text-gray-400">
              {cleanText}
            </p>
          )}

        </div>
      </Link>
    </article>
  );
};

export default Article;