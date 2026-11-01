import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSection, { AdminEmptyState } from "./AdminSection.jsx";
import { clearSessionOnUnauthorizedStatus } from "./sessionToken.js";

const API_URL = import.meta.env.VITE_API_URL;

const AdsAdmin = () => {
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [link, setLink] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAds = async () => {
    const res = await fetch(`${API_URL}/api/ads_get.php`);
    const data = await res.json();
    setAds(Array.isArray(data) ? data : []);
  };

  useEffect(() => { fetchAds(); }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!image || !link) return;
    const formData = new FormData();
    formData.append("image", image);
    formData.append("link", link);
    setLoading(true);
    const res = await fetch(`${API_URL}/api/ads_create.php`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: formData,
    });
    setLoading(false);
    if (clearSessionOnUnauthorizedStatus(res.status)) {
      navigate("/login");
      return;
    }
    if (res.status === 403) {
      alert("No tienes permisos para administrar anuncios.");
      return;
    }
    if (res.ok) {
      setLink("");
      setImage(null);
      fetchAds();
      alert("Anuncio subido correctamente");
    } else alert("No se pudo subir el anuncio");
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Seguro que quieres eliminar este anuncio?")) return;
    const res = await fetch(`${API_URL}/api/ads_delete.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: JSON.stringify({ id }),
    });
    if (clearSessionOnUnauthorizedStatus(res.status)) {
      navigate("/login");
      return;
    }
    if (res.status === 403) {
      alert("No tienes permisos para administrar anuncios.");
      return;
    }
    const data = await res.json();
    if (data.success) setAds((current) => current.filter((ad) => ad.id !== id));
    else alert("No se pudo eliminar el anuncio");
  };

  return (
    <AdminSection title="Publicidad" subtitle="Administra las piezas publicitarias que aparecen en DaleSkate.">
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <p className="font-geistmono text-[10px] uppercase tracking-[0.18em] text-red-700">Nueva pieza</p>
          <h2 className="mt-1 font-spectral text-xl text-stone-900">Subir anuncio</h2>
        </div>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600">Enlace</label>
            <input type="url" value={link} onChange={(event) => setLink(event.target.value)} className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none transition focus:border-red-600 focus:bg-white" placeholder="https://ejemplo.com" required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600">Imagen del anuncio</label>
            <input type="file" accept="image/*" onChange={(event) => setImage(event.target.files[0])} className="block w-full rounded-xl border border-stone-200 bg-stone-50 p-2 text-xs text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white" required />
          </div>
          <button type="submit" disabled={loading} className="rounded-xl bg-red-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-stone-400">
            {loading ? "Subiendo…" : "Subir anuncio"}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-geistmono text-[10px] uppercase tracking-[0.18em] text-stone-500">Biblioteca</p>
            <h2 className="mt-1 font-spectral text-2xl text-stone-900">Anuncios actuales</h2>
          </div>
          <span className="rounded-full bg-stone-200 px-3 py-1 font-geistmono text-xs text-stone-700">{ads.length}</span>
        </div>
        {ads.length === 0 ? <AdminEmptyState title="Aún no hay anuncios">Cuando agregues una pieza publicitaria, aparecerá aquí.</AdminEmptyState> : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ads.map((ad) => (
              <article key={ad.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                <img src={`${API_URL}/uploads/ads/${ad.image}`} alt="Anuncio" className="h-48 w-full bg-stone-100 object-cover" />
                <div className="p-4">
                  <p className="mb-2 font-geistmono text-[9px] uppercase tracking-[0.16em] text-stone-400">Publicidad · #{ad.id}</p>
                  <a href={ad.link} target="_blank" rel="noopener noreferrer" className="block truncate text-sm text-stone-700 underline decoration-stone-300 underline-offset-4 hover:text-red-800">{ad.link}</a>
                  <button onClick={() => handleDelete(ad.id)} className="mt-4 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-600 transition hover:border-red-300 hover:text-red-700">Eliminar anuncio</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AdminSection>
  );
};

export default AdsAdmin;
