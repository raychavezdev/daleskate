import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL;

const PollList = () => {
  const [polls, setPolls] = useState([]);
  const [message, setMessage] = useState("");

  const fetchPolls = async () => {
    try {
      const res = await fetch(`${API_URL}/api/poll_list.php`);
      const data = await res.json();
      if (data.success) {
        setPolls(data.polls);
      } else {
        setMessage(data.error || "Error al cargar encuestas");
      }
    } catch {
      setMessage("Error al conectar con el servidor");
    }
  };

  const deletePoll = async (id) => {
    if (!confirm("¿Seguro que deseas eliminar esta encuesta?")) return;
    try {
      const res = await fetch(`${API_URL}/api/poll_delete.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Encuesta eliminada correctamente");
        setPolls(polls.filter((p) => p.id !== id));
      } else {
        setMessage(data.error || "Error al eliminar encuesta");
      }
    } catch {
      setMessage("Error al conectar con el servidor");
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Encuestas</h2>
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
      {polls.length === 0 ? (
        <p>No hay encuestas creadas.</p>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => (
            <div
              key={poll.id}
              className="border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">{poll.question}</h3>
                <button
                  onClick={() => deletePoll(poll.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Eliminar
                </button>
              </div>

              <ul className="space-y-1 mb-2">
                {poll.options.map((opt, i) => {
                  const votes = poll.votes?.[opt] || 0;
                  const totalVotes = Object.values(poll.votes || {}).reduce(
                    (sum, v) => sum + v,
                    0
                  );
                  const percent = totalVotes
                    ? Math.round((votes / totalVotes) * 100)
                    : 0;

                  return (
                    <li
                      key={i}
                      className="flex justify-between border-b border-gray-100 pb-1 text-sm"
                    >
                      <span>{opt}</span>
                      <span className="text-gray-600">
                        {votes} votos ({percent}%)
                      </span>
                    </li>
                  );
                })}
              </ul>

              <p className="text-xs text-gray-500">
                Creada: {new Date(poll.created_at).toLocaleDateString("es-MX")}
                {poll.expires_at && (
                  <>
                    {" "}
                    | Expira:{" "}
                    {new Date(poll.expires_at).toLocaleDateString("es-MX")}
                  </>
                )}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PollList;
