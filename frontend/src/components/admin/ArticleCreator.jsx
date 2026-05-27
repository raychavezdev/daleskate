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
  const [description, setDescription] = useState("");
  const [contenido, setContenido] = useState([]);
  const [isBanner, setIsBanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bannerMobileFile, setBannerMobileFile] = useState(null);
  const [bannerMobilePreview, setBannerMobilePreview] = useState(null);
  const [isExclusive, setIsExclusive] = useState(false);

  
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

  
  useEffect(() => {
    if (!id) return;

    fetch(`${API_URL}/api/article_get.php?id=${id}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setTitle(data.title || "");
        setTags(data.tags || "");
        setDescription(data.description || "");
        setIsBanner(data.is_banner === 1);
        setIsExclusive(data.is_exclusive === 1);

        if (data.contenido) {
          let parsed = [];

          try {
            parsed = Array.isArray(data.contenido)
              ? data.contenido
              : JSON.parse(data.contenido);
          } catch (e) {
            console.error("Error parseando contenido:", e);
            parsed = [];
          }

          const contenidoReconstruido = parsed.map((bloque) => {
            
            if (bloque.tipo === "imagen") {
              return {
                ...bloque,
                file: null,
                preview: bloque.valor
                  ? bloque.valor.startsWith("http")
                    ? bloque.valor
                    : `${API_URL}/${bloque.valor}`
                  : "",
              };
            }

            
            if (bloque.tipo === "video_externo") {
              return {
                ...bloque,
                file: null,
                preview: bloque.preview
                  ? bloque.preview.startsWith("http")
                    ? bloque.preview
                    : `${API_URL}/${bloque.preview}`
                  : "",
              };
            }

            
            return {
              ...bloque,
              file: null,
              preview: "",
            };
          });

          setContenido(contenidoReconstruido);
        } else {
          setContenido([]);
        }

        
        if (data.banner) {
          setBannerPreview(`${API_URL}/${data.banner}`);
        }

        
        if (data.banner_mobile) {
          setBannerMobilePreview(`${API_URL}/${data.banner_mobile}`);
        }
      })
      .catch((err) => {
        console.error("Error cargando artículo:", err);
      });
  }, [id]);

  

  const youtubeEmbed = (url) => {
    if (!url) return "";
    const match = url.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : "";
  };

  const addBlock = (tipo) => {
    if (tipo === "video_externo") {
      setContenido([
        ...contenido,
        { tipo, valor: "", thumbnail: "", file: null, preview: "" },
      ]);
    } else if (tipo === "imagen") {
      setContenido([
        ...contenido,
        {
          tipo,
          valor: "",
          file: null,
          preview: "",
          fullWidth: false,
        },
      ]);
    } else {
      setContenido([
        ...contenido,
        { tipo, valor: "", file: null, preview: "" },
      ]);
    }
  };

  const updateBlock = (i, key, valor) => {
    const newContent = [...contenido];
    newContent[i][key] = valor;
    setContenido(newContent);
  };

  const removeBlock = (i) =>
    setContenido(contenido.filter((_, index) => index !== i));

  
  const moveBlockUp = (index) => {
    if (index === 0) return; 
    const newContent = [...contenido];
    [newContent[index - 1], newContent[index]] = [
      newContent[index],
      newContent[index - 1],
    ];
    setContenido(newContent);
  };

  
  const moveBlockDown = (index) => {
    if (index === contenido.length - 1) return; 
    const newContent = [...contenido];
    [newContent[index + 1], newContent[index]] = [
      newContent[index],
      newContent[index + 1],
    ];
    setContenido(newContent);
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleImageBlockChange = (i, e, field = "file") => {
    const file = e.target.files[0];
    if (file) {
      const newContent = [...contenido];
      newContent[i][field] = file;
      newContent[i].preview = URL.createObjectURL(file);
      setContenido(newContent);
    }
  };

  const handleBannerMobileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerMobileFile(file);
      setBannerMobilePreview(URL.createObjectURL(file));
    }
  };

  
  const handleSubmit = async () => {
    setLoading(true);

    const formData = new FormData();
    if (id) formData.append("id", id);

    formData.append("title", title);
    formData.append("tags", tags);
    formData.append("is_banner", isBanner ? 1 : 0);
    formData.append("description", description);
    formData.append("is_exclusive", isExclusive ? 1 : 0);

    if (bannerFile) formData.append("banner", bannerFile);
    if (bannerMobileFile) formData.append("banner_mobile", bannerMobileFile);

    const blocksToSend = contenido.map((bloque, i) => {
      if (bloque.tipo === "imagen") {
        if (bloque.file) {
          formData.append(`image_${i}`, bloque.file);
          return {
            tipo: "imagen",
            valor: `image_${i}`,
            fullWidth: bloque.fullWidth || false,
          };
        } else {
          return {
            tipo: "imagen",
            valor: bloque.preview
              ? bloque.preview.replace(`${API_URL}/`, "")
              : bloque.valor,
            fullWidth: bloque.fullWidth || false,
          };
        }
      }
      if (bloque.tipo === "video_externo") {
        if (bloque.file) {
          formData.append(`thumb_${i}`, bloque.file);
          return {
            tipo: "video_externo",
            valor: bloque.valor,
            preview: `thumb_${i}`,
          };
        } else {
          return {
            tipo: "video_externo",
            valor: bloque.valor,
            preview: bloque.preview.replace(`${API_URL}`, "") || "",
          };
        }
      }

      return { tipo: bloque.tipo, valor: bloque.valor };
    });

    formData.append("contenido", JSON.stringify(blocksToSend));

    const url = id
      ? `${API_URL}/api/article_edit.php`
      : `${API_URL}/api/article_create.php`;

    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      body: formData,
    });

    const data = await res.json();
    alert(data.message || data.error);

    if (res.ok) navigate("/admin/articles");
    setLoading(false);
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
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="Tags (separados por coma)"
          className="border p-2 w-full mb-2"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <div className="mb-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="isBanner"
            checked={isBanner}
            onChange={(e) => setIsBanner(e.target.checked)}
          />
          <label htmlFor="isBanner" className="text-sm">
            Mostrar como banner en la página principal
          </label>
        </div>
        <div className="mb-2 flex items-center gap-2">
          <input
            type="checkbox"
            checked={isExclusive}
            onChange={(e) => setIsExclusive(e.target.checked)}
          />
          <label>Artículo exclusivo </label>
        </div>

        <label className="block font-semibold mb-1">Portada</label>
        <input
          type="file"
          accept="image/*"
          className="mb-4"
          onChange={handleBannerChange}
        />
        {bannerPreview && (
          <img src={bannerPreview} alt="banner" className="w-full mb-4" />
        )}

        <label className="block font-semibold mb-1">
          Portada móvil (versión para pantallas pequeñas)
        </label>
        <input
          type="file"
          accept="image/*"
          className="mb-4"
          onChange={handleBannerMobileChange}
        />
        {bannerMobilePreview && (
          <img
            src={bannerMobilePreview}
            alt="banner móvil"
            className="w-full mb-4 rounded"
          />
        )}

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
            onClick={() => addBlock("texto")}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            + Texto
          </button>
          <button
            onClick={() => addBlock("imagen")}
            className="bg-purple-500 text-white px-3 py-1 rounded"
          >
            + Imagen
          </button>
          <button
            onClick={() => addBlock("video")}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            + Video (YouTube)
          </button>
          <button
            onClick={() => addBlock("video_externo")}
            className="bg-orange-500 text-white px-3 py-1 rounded"
          >
            + Video Externo
          </button>
        </div>

        {contenido.map((bloque, i) => (
          <div key={i} className="mb-3 border p-2 rounded relative">
            <label className="block font-semibold mb-1">
              {(bloque.tipo || "bloque").toUpperCase()}
            </label>
            {bloque.tipo === "imagen" ? (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={bloque.fullWidth || false}
                    onChange={(e) =>
                      updateBlock(i, "fullWidth", e.target.checked)
                    }
                  />
                  Imagen ancho completo
                </label>
                {bloque.preview && (
                  <img
                    src={
                      bloque.preview.startsWith("blob:")
                        ? bloque.preview
                        : `${bloque.preview}`
                    }
                    alt="Preview"
                    className="w-full rounded"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageBlockChange(i, e)}
                />
              </div>
            ) : bloque.tipo === "video_externo" ? (
              <div className="space-y-2">
                <input
                  type="url"
                  placeholder="URL del video externo"
                  value={bloque.valor}
                  onChange={(e) => updateBlock(i, "valor", e.target.value)}
                  className="border p-2 w-full"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageBlockChange(i, e, "file")}
                />
                {bloque.preview && (
                  <img
                    src={bloque.preview}
                    alt="Preview thumbnail"
                    className="w-40 rounded"
                  />
                )}
              </div>
            ) : (
              <ReactQuill
                theme="snow"
                value={bloque.valor}
                onChange={(val) => updateBlock(i, "valor", val)}
                modules={modules}
                className="bg-white rounded"
              />
            )}
            <div className="absolute top-2 right-2 flex gap-1">
              <button
                type="button"
                onClick={() => moveBlockUp(i)}
                className="bg-gray-500 text-white px-2 py-1 rounded text-sm"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveBlockDown(i)}
                className="bg-gray-500 text-white px-2 py-1 rounded text-sm"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeBlock(i)}
                className="bg-red-500 text-white px-2 py-1 rounded text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`flex items-center justify-center gap-2 px-4 py-2 mt-4 rounded text-white ${
            loading ? "bg-gray-500 cursor-not-allowed" : "bg-black"
          }`}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
              alt="Banner"
              className="w-full mb-4 rounded"
            />
          )}

          {bannerMobilePreview && (
            <div>
              <p>Version Mobile</p>
              <img
                src={bannerMobilePreview}
                alt="Banner móvil"
                className="w-full mb-4 rounded border border-dashed border-gray-400"
              />
            </div>
          )}
        </div>

        {/* CONTENIDO */}
        <div className="space-y-6">
          {description && (
            <div
              className="preview whitespace-pre-line mb-4 px-5"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(description),
              }}
            />
          )}

          {contenido.map((bloque, i) => (
            <div key={i}>
              {/* TEXTO */}
              {bloque.tipo === "texto" && (
                <div
                  className="px-5"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(bloque.valor),
                  }}
                />
              )}

              {/* IMAGEN */}
              {bloque.tipo === "imagen" &&
                bloque.preview &&
                (bloque.fullWidth ? (
                  <img
                    src={
                      bloque.preview.startsWith("blob:")
                        ? bloque.preview
                        : `${bloque.preview}`
                    }
                    alt=""
                    className="w-full"
                  />
                ) : (
                  <img
                    src={
                      bloque.preview.startsWith("blob:")
                        ? bloque.preview
                        : `${bloque.preview}`
                    }
                    alt=""
                    className="my-2 rounded w-full px-5"
                  />
                ))}

              {/* VIDEO YOUTUBE */}
              {bloque.tipo === "video" && bloque.valor && (
                <div className="px-5">
                  <div className="w-full aspect-video">
                    <iframe
                      src={youtubeEmbed(bloque.valor)}
                      className="w-full h-full rounded"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              )}

              {/* VIDEO EXTERNO */}
              {bloque.tipo === "video_externo" && (
                <div className="text-center px-5">
                  {bloque.preview && (
                    <img
                      src={bloque.preview}
                      alt="Miniatura"
                      className="w-full mb-2"
                    />
                  )}

                  {bloque.valor && (
                    <a
                      href={bloque.valor}
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
