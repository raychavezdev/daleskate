import { Link } from "react-router-dom";
const API_URL = import.meta.env.VITE_API_URL;
const Article = ({ id, slug, header, img, title, text }) => {
  const safeSlug =
    slug ||
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

  function stripHtml(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }

  return (
    <article className="mb-10 group lg:flex-1 border ">
      <Link to={`/articulo/${id}-${safeSlug}`}>
        <header className="text-red-500 bg-white p-2 uppercase text-sm text-end tracking-wider">
          {header}
        </header>
        <img
          src={`${API_URL}/${img}`}
          alt={title}
          className="w-full h-96 object-cover"
        />

        <div className="text-white px-6">
          <h3 className="font-serif font-bold text-2xl tracking-wider mt-2 group-hover:text-[#f07e19] transition-colors">
            {title.toUpperCase()}
          </h3>
          <div className="line-clamp-2 break-words text-gray-400 whitespace-pre-line">
            {stripHtml(text)}
          </div>
        </div>
      </Link>
    </article>
  );
};

export default Article;
