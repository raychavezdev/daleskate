import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

const PollCreate = () => {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          options,
          expires_at: expiresAt || null,
        }),
      });

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
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Crear Encuesta</h2>
      {message && (
        <p
          className={`mb-4 p-2 rounded ${
            message.includes("correctamente")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
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
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="button"
                onClick={() => removeOption(i)}
                className="ml-2 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                X
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2 bg-green-500 text-white font-semibold rounded hover:bg-green-600"
        >
          Crear Encuesta
        </button>
      </form>
    </div>
  );
};

export default PollCreate;
