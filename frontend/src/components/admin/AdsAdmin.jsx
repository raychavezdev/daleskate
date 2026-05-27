import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL;

const AdsAdmin = () => {
  const [ads, setAds] = useState([]);
  const [link, setLink] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAds = async () => {
    const res = await fetch(`${API_URL}/api/ads_get.php`);
    const data = await res.json();
    setAds(data);
  };

  useEffect(() => {
    fetchAds();
  }, []);

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image || !link) return;

    const formData = new FormData();
    formData.append("image", image);
    formData.append("link", link);

    setLoading(true);
    const res = await fetch(`${API_URL}/api/ads_create.php`, {
      method: "POST",
      body: formData,
    });
    setLoading(false);

    if (res.ok) {
      setLink("");
      setImage(null);
      fetchAds();
      alert("✅ Anuncio subido correctamente");
    } else {
      alert("❌ Error al subir el anuncio");
    }
  };

  
  const handleDelete = async (id) => {
    if (!confirm("¿Seguro que quieres eliminar este anuncio?")) return;

    const res = await fetch(`${API_URL}/api/ads_delete.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const data = await res.json();

    if (data.success) {
      setAds((prev) => prev.filter((ad) => ad.id !== id));
      alert("🗑️ Anuncio eliminado correctamente");
    } else {
      alert("❌ No se pudo eliminar el anuncio");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Publicidad</h1>

      {}
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium mb-1">Enlace</label>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="border p-2 w-full rounded"
            placeholder="https://ejemplo.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Imagen del anuncio
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Subiendo..." : "Subir anuncio"}
        </button>
      </form>

      {}
      <h2 className="text-xl font-semibold mb-2">Anuncios actuales</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ads.map((ad) => (
          <div
            key={ad.id}
            className="border rounded-lg overflow-hidden shadow relative"
          >
            <img
              src={`${API_URL}/uploads/ads/${ad.image}`}
              alt="Anuncio"
              className="w-full h-48 object-cover"
            />
            <div className="p-2 text-sm">
              <a
                href={ad.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all"
              >
                {ad.link}
              </a>
            </div>
            <button
              onClick={() => handleDelete(ad.id)}
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full px-2 py-1 text-xs hover:bg-red-700"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdsAdmin;
