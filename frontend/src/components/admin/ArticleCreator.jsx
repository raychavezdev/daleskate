const API_URL = import.meta.env.VITE_API_URL;

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactQuill from "react-quill-new";
import DOMPurify from "dompurify";

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
  const [loading, setLoading] = useState(false);

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }],
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
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("No se pudo cargar el artículo");
        }

        const data = await res.json();

        setTitle(data.title || "");
        setTags(data.tags || "");
        setDescription(data.description || "");
        setIsBanner(Number(data.is_banner) === 1);
        setIsExclusive(Number(data.is_exclusive) === 1);

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
            };
          }

          if (block.tipo === "video_externo") {
            return {
              ...block,
              file: null,
              preview: block.preview
                ? buildFileUrl(block.preview)
                : "",
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
  }, [id]);

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

  const handleSubmit = async () => {
    const cleanTitle = title.trim();
    const cleanTags = tags.trim();

    if (!cleanTitle) {
      alert("El título es obligatorio.");
      return;
    }

    if (!cleanTags) {
      alert("Los tags son obligatorios.");
      return;
    }

    const hasDesktopBanner = Boolean(bannerFile || bannerPreview);
    const hasMobileBanner = Boolean(
      bannerMobileFile || bannerMobilePreview,
    );

    if (isBanner && !hasDesktopBanner && !hasMobileBanner) {
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
            };
          }

          return {
            tipo: "imagen",
            valor: block.preview
              ? getRelativePath(block.preview)
              : block.valor || "",
            fullWidth: Boolean(block.fullWidth),
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
            preview: block.preview
              ? getRelativePath(block.preview)
              : "",
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "No se pudo guardar el artículo.",
        );
      }

      alert(
        data.message ||
          (id
            ? "Artículo actualizado correctamente."
            : "Artículo creado correctamente."),
      );

      navigate("/admin/articles");
    } catch (error) {
      console.error("Error guardando artículo:", error);
      alert(error.message || "Ocurrió un error al guardar el artículo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 flex gap-6">
      <div className="flex-1">
        <h1 className="text-2xl font-bold mb-4">
          {id ? "Editar Artículo" : "Creador de Artículos"}
        </h1>

        <input
          type="text"
          placeholder="Título"
          className="border p-2 w-full mb-2"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />

        <input
          type="text"
          placeholder="Tags (separados por coma)"
          className="border p-2 w-full mb-2"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
        />

        <div className="mb-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="isBanner"
            checked={isBanner}
            onChange={(event) => setIsBanner(event.target.checked)}
          />

          <label htmlFor="isBanner" className="text-sm">
            Mostrar como banner en la página principal
          </label>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <input
            type="checkbox"
            id="isExclusive"
            checked={isExclusive}
            onChange={(event) => setIsExclusive(event.target.checked)}
          />

          <label htmlFor="isExclusive">Artículo exclusivo</label>
        </div>

        <div className="mb-4 rounded border border-gray-200 bg-white p-4">
          <p className="mb-3 text-sm text-gray-600">
            Las portadas son opcionales. Para mostrar el artículo como banner
            en la página principal debes agregar al menos una.
          </p>

          <label className="block font-semibold mb-1">
            Portada{" "}
            <span className="font-normal text-gray-500">(opcional)</span>
          </label>

          <input
            type="file"
            accept="image/*"
            className="mb-4"
            onChange={handleBannerChange}
          />

          {bannerPreview && (
            <img
              src={bannerPreview}
              alt="Vista previa de la portada"
              className="w-full mb-4 rounded"
            />
          )}

          <label className="block font-semibold mb-1">
            Portada móvil{" "}
            <span className="font-normal text-gray-500">(opcional)</span>
          </label>

          <p className="mb-2 text-sm text-gray-500">
            Esta versión se utilizará en pantallas pequeñas. Si no la agregas,
            se utilizará la portada principal.
          </p>

          <input
            type="file"
            accept="image/*"
            className="mb-4"
            onChange={handleBannerMobileChange}
          />

          {bannerMobilePreview && (
            <img
              src={bannerMobilePreview}
              alt="Vista previa de la portada móvil"
              className="w-full mb-4 rounded"
            />
          )}
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-1">Descripción</label>

          <ReactQuill
            theme="snow"
            value={description}
            onChange={setDescription}
            className="bg-white rounded"
            modules={modules}
          />
        </div>

        <div className="mb-4 flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => addBlock("texto")}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            + Texto
          </button>

          <button
            type="button"
            onClick={() => addBlock("imagen")}
            className="bg-purple-500 text-white px-3 py-1 rounded"
          >
            + Imagen
          </button>

          <button
            type="button"
            onClick={() => addBlock("video")}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            + Video (YouTube)
          </button>

          <button
            type="button"
            onClick={() => addBlock("video_externo")}
            className="bg-orange-500 text-white px-3 py-1 rounded"
          >
            + Video Externo
          </button>
        </div>

        {contenido.map((block, index) => (
          <div
            key={index}
            className="mb-3 border p-2 rounded relative"
          >
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
                      updateBlock(
                        index,
                        "fullWidth",
                        event.target.checked,
                      )
                    }
                  />

                  Imagen ancho completo
                </label>

                {block.preview && (
                  <img
                    src={block.preview}
                    alt="Vista previa"
                    className="w-full rounded"
                  />
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    handleImageBlockChange(index, event)
                  }
                />
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
                onChange={(value) =>
                  updateBlock(index, "valor", value)
                }
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

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className={`flex items-center justify-center gap-2 px-4 py-2 mt-4 rounded text-white ${
            loading
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-black"
          }`}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Guardando...
            </>
          ) : id ? (
            "Actualizar Artículo"
          ) : (
            "Guardar Artículo"
          )}
        </button>
      </div>

      <div className="border rounded overflow-y-auto pt-5 flex-1">
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
              className="w-full mb-4 rounded"
            />
          )}

          {bannerMobilePreview && (
            <div>
              <p className="mb-1 text-sm text-gray-500">
                Versión móvil
              </p>

              <img
                src={bannerMobilePreview}
                alt="Vista previa de la portada móvil"
                className="w-full mb-4 rounded border border-dashed border-gray-400"
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
              className="preview whitespace-pre-line mb-4 px-5"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(description),
              }}
            />
          )}

          {contenido.map((block, index) => (
            <div key={index}>
              {block.tipo === "texto" && (
                <div
                  className="px-5"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(block.valor),
                  }}
                />
              )}

              {block.tipo === "imagen" &&
                block.preview &&
                (block.fullWidth ? (
                  <img
                    src={block.preview}
                    alt=""
                    className="w-full"
                  />
                ) : (
                  <img
                    src={block.preview}
                    alt=""
                    className="my-2 rounded w-full px-5"
                  />
                ))}

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
                      className="w-full mb-2"
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
      </div>
    </div>
  );
};

export default ArticleCreator;