import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSection from "./AdminSection.jsx";

const API_URL = import.meta.env.VITE_API_URL;

const PollCreate = () => {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [expiresAt, setExpiresAt] = useState("");
  const [message, setMessage] = useState("");

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => setOptions([...options, ""]);
  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!question.trim()) return setMessage("La pregunta es obligatoria");
    if (options.some((opt) => !opt.trim()))
      return setMessage("Todas las opciones deben llenarse");

    try {
      const res = await fetch(`${API_URL}/api/poll_create.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          question,
          options,
          expires_at: expiresAt || null,
        }),
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      if (res.status === 403) {
        setMessage("No tienes permisos para crear encuestas.");
        return;
      }

      const data = await res.json();

      if (data.success) {
        setMessage("Encuesta creada correctamente");
        setQuestion("");
        setOptions(["", ""]);
        setExpiresAt("");
      } else {
        setMessage(data.error || "Error al crear la encuesta");
      }
    } catch (err) {
      setMessage("Error al conectar con el servidor", err);
    }
  };

  return (
    <AdminSection title="Crear encuesta" subtitle="Formula una pregunta clara y agrega opciones para la comunidad.">
    <div className="max-w-3xl rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
      <p className="mb-5 font-geistmono text-[10px] uppercase tracking-[0.18em] text-red-700">Nueva participación</p>
      {message && (
        <p
          className={`mb-4 rounded-xl border p-3 text-sm ${
            message.includes("correctamente")
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Pregunta:</label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-red-600 focus:bg-white"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Opciones:</label>
          {options.map((opt, i) => (
            <div key={i} className="flex mb-2">
              <input
                type="text"
                value={opt}
                onChange={(e) => handleOptionChange(i, e.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-red-600 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => removeOption(i)}
                className="ml-2 rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-600 hover:border-red-300 hover:text-red-700"
              >
                X
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            className="mt-2 rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
          >
            Agregar opción
          </button>
        </div>

        <div>
          <label className="block mb-1 font-medium">Fecha de expiración:</label>
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-red-600 focus:bg-white"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-red-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-800"
        >
          Crear Encuesta
        </button>
      </form>
    </div>
    </AdminSection>
  );
};

export default PollCreate;
