const API_URL = import.meta.env.VITE_API_URL;

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactQuill from "react-quill-new";
import DOMPurify from "dompurify";
import { clearSessionOnUnauthorizedStatus } from "./sessionToken.js";

const CoverFilePicker = ({ id, label, file, preview, onChange }) => (
  <div className="mt-3">
    <label htmlFor={id} className="group flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 p-4 transition hover:border-red-500 hover:bg-red-50/40 focus-within:border-red-700 focus-within:ring-4 focus-within:ring-red-700/10 sm:p-5">
      <input id={id} type="file" accept="image/*" className="sr-only" onChange={onChange} />
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-stone-950 text-2xl text-white transition group-hover:bg-red-800" aria-hidden="true">↑</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-stone-900">{file ? "Archivo seleccionado" : "Selecciona una imagen"}</span>
        <span className="mt-1 block truncate text-xs text-stone-500" aria-live="polite">
          {file?.name || (preview ? `${label} actual guardada · selecciona para reemplazar` : "JPG, PNG o GIF · haz clic para explorar tus archivos")}
        </span>
      </span>
      <span className="shrink-0 rounded-lg bg-red-800 px-3 py-2 text-xs font-semibold text-white transition group-hover:bg-red-900">Elegir archivo</span>
    </label>
  </div>
);

const ArticleCreator = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");

  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState("");

  const [bannerMobileFile, setBannerMobileFile] = useState(null);
  const [bannerMobilePreview, setBannerMobilePreview] = useState("");

  const [description, setDescription] = useState("");
  const [contenido, setContenido] = useState([]);

  const [isBanner, setIsBanner] = useState(false);
  const [isExclusive, setIsExclusive] = useState(false);
  const [status, setStatus] = useState("draft");
  const [loading, setLoading] = useState(false);

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ color: [] }],
      [{ size: ["small", false, "large", "huge"] }],
      [{ align: [] }],
      ["link"],
      ["clean"],
    ],
  };

  const buildFileUrl = (path) => {
    if (!path) return "";

    return path.startsWith("http") ? path : `${API_URL}/${path}`;
  };

  const getRelativePath = (path) => {
    if (!path) return "";

    return path.replace(`${API_URL}/`, "").replace(`${API_URL}`, "");
  };

  useEffect(() => {
    if (!id) return;

    const fetchArticle = async () => {
      try {
        const res = await fetch(`${API_URL}/api/article_get.php?id=${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          credentials: "include",
        });

        if (clearSessionOnUnauthorizedStatus(res.status)) {
          navigate("/login");
          return;
        }
        if (res.status === 403) {
          alert("No tienes permisos para editar artículos.");
          return;
        }

        if (!res.ok) {
          throw new Error("No se pudo cargar el artículo");
        }

        const data = await res.json();

        setTitle(data.title || "");
        setTags(data.tags || "");
        setDescription(data.description || "");
        setIsBanner(Number(data.is_banner) === 1);
        setIsExclusive(Number(data.is_exclusive) === 1);
        setStatus(data.status || "published");

        if (data.banner) {
          setBannerPreview(buildFileUrl(data.banner));
        } else {
          setBannerPreview("");
        }

        if (data.banner_mobile) {
          setBannerMobilePreview(buildFileUrl(data.banner_mobile));
        } else {
          setBannerMobilePreview("");
        }

        if (!data.contenido) {
          setContenido([]);
          return;
        }

        let parsedContent = [];

        try {
          parsedContent = Array.isArray(data.contenido)
            ? data.contenido
            : JSON.parse(data.contenido);
        } catch (error) {
          console.error("Error parseando contenido:", error);
          parsedContent = [];
        }

        const reconstructedContent = parsedContent.map((block) => {
          if (block.tipo === "imagen") {
            return {
              ...block,
              file: null,
              preview: block.valor ? buildFileUrl(block.valor) : "",
              fullWidth: Boolean(block.fullWidth),
              caption: block.caption || "",
            };
          }

          if (block.tipo === "video_externo") {
            return {
              ...block,
              file: null,
              preview: block.preview ? buildFileUrl(block.preview) : "",
            };
          }

          return {
            ...block,
            file: null,
            preview: "",
          };
        });

        setContenido(reconstructedContent);
      } catch (error) {
        console.error("Error cargando artículo:", error);
        alert("No se pudo cargar el artículo.");
      }
    };

    fetchArticle();
  }, [id, navigate]);

  const youtubeEmbed = (url) => {
    if (!url) return "";

    const match = url.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/);

    return match ? `https://www.youtube.com/embed/${match[1]}` : "";
  };

  const addBlock = (tipo) => {
    if (tipo === "video_externo") {
      setContenido((currentContent) => [
        ...currentContent,
        {
          tipo,
          valor: "",
          thumbnail: "",
          file: null,
          preview: "",
        },
      ]);

      return;
    }

    if (tipo === "imagen") {
      setContenido((currentContent) => [
        ...currentContent,
        {
          tipo,
          valor: "",
          file: null,
          preview: "",
          fullWidth: false,
          caption: "",
        },
      ]);

      return;
    }

    setContenido((currentContent) => [
      ...currentContent,
      {
        tipo,
        valor: "",
        file: null,
        preview: "",
      },
    ]);
  };

  const updateBlock = (index, key, value) => {
    setContenido((currentContent) =>
      currentContent.map((block, blockIndex) =>
        blockIndex === index
          ? {
              ...block,
              [key]: value,
            }
          : block,
      ),
    );
  };

  const removeBlock = (index) => {
    setContenido((currentContent) =>
      currentContent.filter((_, blockIndex) => blockIndex !== index),
    );
  };

  const moveBlockUp = (index) => {
    if (index === 0) return;

    setContenido((currentContent) => {
      const newContent = [...currentContent];

      [newContent[index - 1], newContent[index]] = [
        newContent[index],
        newContent[index - 1],
      ];

      return newContent;
    });
  };

  const moveBlockDown = (index) => {
    if (index === contenido.length - 1) return;

    setContenido((currentContent) => {
      const newContent = [...currentContent];

      [newContent[index + 1], newContent[index]] = [
        newContent[index],
        newContent[index + 1],
      ];

      return newContent;
    });
  };

  const handleBannerChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleBannerMobileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setBannerMobileFile(file);
    setBannerMobilePreview(URL.createObjectURL(file));
  };

  const handleImageBlockChange = (index, event, field = "file") => {
    const file = event.target.files?.[0];

    if (!file) return;

    setContenido((currentContent) =>
      currentContent.map((block, blockIndex) =>
        blockIndex === index
          ? {
              ...block,
              [field]: file,
              preview: URL.createObjectURL(file),
            }
          : block,
      ),
    );
  };

  const handleSubmit = async (targetStatus) => {
    const cleanTitle = title.trim();
    const cleanTags = tags.trim();

    if (targetStatus === "published" && !cleanTitle) {
      alert("El título es obligatorio.");
      return;
    }

    if (targetStatus === "published" && !cleanTags) {
      alert("Los tags son obligatorios.");
      return;
    }

    const hasDesktopBanner = Boolean(bannerFile || bannerPreview);
    const hasMobileBanner = Boolean(bannerMobileFile || bannerMobilePreview);

    if (targetStatus === "published" && isBanner && !hasDesktopBanner && !hasMobileBanner) {
      alert(
        "Para mostrar el artículo como banner debes agregar al menos una portada.",
      );
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      if (id) {
        formData.append("id", id);
      }

      formData.append("title", cleanTitle);
      formData.append("tags", cleanTags);
      formData.append("status", targetStatus);
      formData.append("is_banner", isBanner ? "1" : "0");
      formData.append("description", description);
      formData.append("is_exclusive", isExclusive ? "1" : "0");

      if (bannerFile) {
        formData.append("banner", bannerFile);
      }

      if (bannerMobileFile) {
        formData.append("banner_mobile", bannerMobileFile);
      }

      const blocksToSend = contenido.map((block, index) => {
        if (block.tipo === "imagen") {
          if (block.file) {
            const fileKey = `image_${index}`;

            formData.append(fileKey, block.file);

            return {
              tipo: "imagen",
              valor: fileKey,
              fullWidth: Boolean(block.fullWidth),
              caption: block.caption?.trim() || "",
            };
          }

          return {
            tipo: "imagen",
            valor: block.preview
              ? getRelativePath(block.preview)
              : block.valor || "",
            fullWidth: Boolean(block.fullWidth),
            caption: block.caption?.trim() || "",
          };
        }

        if (block.tipo === "video_externo") {
          if (block.file) {
            const thumbnailKey = `thumb_${index}`;

            formData.append(thumbnailKey, block.file);

            return {
              tipo: "video_externo",
              valor: block.valor,
              preview: thumbnailKey,
            };
          }

          return {
            tipo: "video_externo",
            valor: block.valor,
            preview: block.preview ? getRelativePath(block.preview) : "",
          };
        }

        return {
          tipo: block.tipo,
          valor: block.valor,
        };
      });

      formData.append("contenido", JSON.stringify(blocksToSend));

      const url = id
        ? `${API_URL}/api/article_edit.php`
        : `${API_URL}/api/article_create.php`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (clearSessionOnUnauthorizedStatus(response.status)) {
        navigate("/login");
        return;
      }
      if (response.status === 403) {
        alert("No tienes permisos para administrar artículos.");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        const details = Array.isArray(data.details) ? ` ${data.details.join(" ")}` : "";
        throw new Error(`${data.error || data.message || "No se pudo guardar el artículo."}${details}`);
      }

      setStatus(targetStatus);
      alert(data.message || (targetStatus === "draft" ? "Borrador guardado." : "Artículo publicado."));
      if (targetStatus === "draft") {
        if (!id && data.article_id) navigate(`/admin/articles/edit/${data.article_id}`);
      } else {
        navigate("/admin/articles");
      }
    } catch (error) {
      console.error("Error guardando artículo:", error);
      alert(error.message || "Ocurrió un error al guardar el artículo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f0eb] p-4 sm:p-6 xl:flex xl:items-start xl:gap-6">
      <div className="min-w-0 flex-1 space-y-5">
        <header className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="mb-2 font-geistmono text-[10px] uppercase tracking-[0.2em] text-red-700">DaleSkate / Edición</p>
        <h1 className="font-spectral text-3xl text-stone-950 sm:text-4xl">
          {id ? "Editar Artículo" : "Creador de Artículos"}
        </h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-stone-500" aria-live="polite">
          Estado actual:
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status === "draft" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
            {status === "draft" ? "Borrador" : "Publicado"}
          </span>
        </p>
        </header>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <input
          type="text"
          placeholder="Título"
          aria-label="Título del artículo"
          className="mb-3 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-red-700 focus:bg-white focus:ring-4 focus:ring-red-700/10"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />

        <input
          type="text"
          placeholder="Tags (separados por coma)"
          aria-label="Tags del artículo"
          className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-red-700 focus:bg-white focus:ring-4 focus:ring-red-700/10"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400">
          <input
            type="checkbox"
            id="isBanner"
            className="h-4 w-4 accent-red-800"
            checked={isBanner}
            onChange={(event) => setIsBanner(event.target.checked)}
          />
          <span>Mostrar como banner en la página principal</span>
        </label>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400">
          <input
            type="checkbox"
            id="isExclusive"
            className="h-4 w-4 accent-red-800"
            checked={isExclusive}
            onChange={(event) => setIsExclusive(event.target.checked)}
          />
          <span>Artículo exclusivo</span>
        </label>
        </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="mb-5 text-sm leading-relaxed text-stone-600">
            Las portadas son opcionales. Para mostrar el artículo como banner en
            la página principal debes agregar al menos una.
          </p>

          <label className="block font-semibold text-stone-900 mb-1">
            Portada{" "}
            <span className="font-normal text-gray-500">(opcional)</span>
          </label>

          <CoverFilePicker id="cover-desktop" label="Portada" file={bannerFile} preview={bannerPreview} onChange={handleBannerChange} />

          {bannerPreview && (
            <img
              src={bannerPreview}
              alt="Vista previa de la portada"
              className="mt-3 mb-6 aspect-[16/7] w-full rounded-xl border border-stone-200 object-cover"
            />
          )}

          <label className="block font-semibold text-stone-900 mb-1">
            Portada móvil{" "}
            <span className="font-normal text-gray-500">(opcional)</span>
          </label>

          <p className="mb-2 text-sm leading-relaxed text-stone-500">
            Esta versión se utilizará en pantallas pequeñas. Si no la agregas,
            se utilizará la portada principal.
          </p>

          <CoverFilePicker id="cover-mobile" label="Portada móvil" file={bannerMobileFile} preview={bannerMobilePreview} onChange={handleBannerMobileChange} />

          {bannerMobilePreview && (
            <img
              src={bannerMobilePreview}
              alt="Vista previa de la portada móvil"
              className="mt-3 mb-2 aspect-[4/5] max-h-96 rounded-xl border border-stone-200 object-cover"
            />
          )}
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <label className="mb-3 block font-semibold text-stone-900">Descripción</label>

          <ReactQuill
            theme="snow"
            value={description}
            onChange={setDescription}
            className="rounded-xl bg-stone-50"
            modules={modules}
          />
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4">
          <p className="font-geistmono text-[10px] uppercase tracking-[0.18em] text-red-700">Contenido</p>
          <h2 className="mt-1 font-spectral text-xl text-stone-900">Construye tu historia</h2>
        </div>
        <div className="mb-5 flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => addBlock("texto")}
            className="rounded-lg border border-stone-300 bg-stone-50 px-3.5 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-500 hover:bg-white"
          >
            + Texto
          </button>

          <button
            type="button"
            onClick={() => addBlock("imagen")}
            className="rounded-lg border border-stone-300 bg-stone-50 px-3.5 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-500 hover:bg-white"
          >
            + Imagen
          </button>

          <button
            type="button"
            onClick={() => addBlock("video")}
            className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-semibold text-red-800 transition hover:border-red-400 hover:bg-red-100"
          >
            + Video (YouTube)
          </button>

          <button
            type="button"
            onClick={() => addBlock("video_externo")}
            className="rounded-lg border border-orange-200 bg-orange-50 px-3.5 py-2 text-sm font-semibold text-orange-800 transition hover:border-orange-400 hover:bg-orange-100"
          >
            + Video Externo
          </button>
        </div>

        {contenido.map((block, index) => (
          <div key={index} className="relative mb-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 pt-10 sm:p-5 sm:pt-10">
            <label className="block font-semibold mb-1">
              {(block.tipo || "bloque").toUpperCase()}
            </label>

            {block.tipo === "imagen" ? (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(block.fullWidth)}
                    onChange={(event) =>
                      updateBlock(index, "fullWidth", event.target.checked)
                    }
                  />
                  Imagen ancho completo
                </label>

                {block.preview && (
                  <img
                    src={block.preview}
                    alt={block.caption || "Vista previa"}
                    className="w-full rounded"
                  />
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleImageBlockChange(index, event)}
                />

                <div>
                  <label
                    htmlFor={`image-caption-${index}`}
                    className="block mb-1 text-sm font-medium text-gray-700"
                  >
                    Pie de foto{" "}
                    <span className="font-normal text-gray-500">
                      (opcional)
                    </span>
                  </label>

                  <input
                    id={`image-caption-${index}`}
                    type="text"
                    value={block.caption || ""}
                    onChange={(event) =>
                      updateBlock(index, "caption", event.target.value)
                    }
                    placeholder="Ej. Foto: Juan Pérez — Skatepark Guadalajara"
                    maxLength={250}
                    className="border p-2 w-full rounded"
                  />

                  <p className="mt-1 text-xs text-gray-500">
                    {block.caption?.length || 0}/250 caracteres
                  </p>
                </div>
              </div>
            ) : block.tipo === "video_externo" ? (
              <div className="space-y-2">
                <input
                  type="url"
                  placeholder="URL del video externo"
                  value={block.valor}
                  onChange={(event) =>
                    updateBlock(index, "valor", event.target.value)
                  }
                  className="border p-2 w-full"
                />

                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    handleImageBlockChange(index, event, "file")
                  }
                />

                {block.preview && (
                  <img
                    src={block.preview}
                    alt="Vista previa de la miniatura"
                    className="w-40 rounded"
                  />
                )}
              </div>
            ) : (
              <ReactQuill
                theme="snow"
                value={block.valor}
                onChange={(value) => updateBlock(index, "valor", value)}
                modules={modules}
                className="bg-white rounded"
              />
            )}

            <div className="absolute top-2 right-2 flex gap-1">
              <button
                type="button"
                onClick={() => moveBlockUp(index)}
                className="bg-gray-500 text-white px-2 py-1 rounded text-sm"
              >
                ↑
              </button>

              <button
                type="button"
                onClick={() => moveBlockDown(index)}
                className="bg-gray-500 text-white px-2 py-1 rounded text-sm"
              >
                ↓
              </button>

              <button
                type="button"
                onClick={() => removeBlock(index)}
                className="bg-red-500 text-white px-2 py-1 rounded text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        ))}

        <div className="mt-6 flex gap-3 flex-wrap border-t border-stone-200 pt-5">
          <button type="button" onClick={() => handleSubmit("draft")} disabled={loading}
            className={`rounded-xl border px-5 py-3 text-sm font-semibold transition ${loading ? "cursor-not-allowed border-stone-300 bg-stone-300 text-stone-500" : "border-amber-700 bg-white text-amber-900 hover:bg-amber-50"}`}>
            {loading ? "Guardando..." : "Guardar borrador"}
          </button>
          <button type="button" onClick={() => handleSubmit("published")} disabled={loading}
            className={`rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition ${loading ? "cursor-not-allowed bg-stone-400" : "bg-red-800 shadow-red-950/15 hover:bg-red-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-800"}`}>
            {loading ? "Guardando..." : "Publicar artículo"}
          </button>
        </div>
        </section>
      </div>

      <aside className="mt-6 min-w-0 flex-1 overflow-y-auto rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6 xl:sticky xl:top-6 xl:mt-0 xl:max-h-[calc(100vh-3rem)]">
        <div>
          <h2 className="text-4xl font-bold font-serif">
            {(title || "").toUpperCase()}
          </h2>

          {tags && (
            <div className="flex flex-wrap gap-2 my-2 text-sm">
              {tags.replace(/,/g, " | ").toUpperCase()}
            </div>
          )}

          {bannerPreview && (
            <img
              src={bannerPreview}
              alt="Vista previa de la portada"
              className="w-full max-w-full mb-4 rounded"
            />
          )}

          {bannerMobilePreview && (
            <div>
              <p className="mb-1 text-sm text-gray-500">Versión móvil</p>

              <img
                src={bannerMobilePreview}
                alt="Vista previa de la portada móvil"
                className="w-full max-w-full mb-4 rounded border border-dashed border-gray-400"
              />
            </div>
          )}

          {!bannerPreview && !bannerMobilePreview && (
            <div className="mx-5 mb-4 rounded border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
              Este artículo se publicará sin portada.
            </div>
          )}
        </div>

        <div className="space-y-6">
          {description && (
            <div
              className="article-rich-text mb-4 px-5"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(description),
              }}
            />
          )}

          {contenido.map((block, index) => (
            <div key={index}>
              {block.tipo === "texto" && (
                <div
                  className="article-rich-text px-5"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(block.valor),
                  }}
                />
              )}

              {block.tipo === "imagen" && block.preview && (
                <figure
                  className={block.fullWidth ? "w-full" : "my-2 w-full px-5"}
                >
                  <img
                    src={block.preview}
                    alt={block.caption || `Imagen del artículo ${title}`}
                    className={block.fullWidth ? "w-full max-w-full" : "w-full max-w-full rounded"}
                  />

                  {block.caption?.trim() && (
                    <figcaption className="mt-2 text-sm italic leading-relaxed text-gray-500">
                      {block.caption}
                    </figcaption>
                  )}
                </figure>
              )}

              {block.tipo === "video" && block.valor && (
                <div className="px-5">
                  <div className="w-full aspect-video">
                    <iframe
                      src={youtubeEmbed(block.valor)}
                      title={`Vista previa del video ${index + 1}`}
                      className="w-full h-full rounded"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {block.tipo === "video_externo" && (
                <div className="text-center px-5">
                  {block.preview && (
                    <img
                      src={block.preview}
                      alt="Miniatura"
                      className="w-full max-w-full mb-2"
                    />
                  )}

                  {block.valor && (
                    <a
                      href={block.valor}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-1 font-bold border border-orange-700 rounded-4xl text-sm hover:bg-orange-700 hover:text-white"
                    >
                      VER VIDEO
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
};

export default ArticleCreator;
