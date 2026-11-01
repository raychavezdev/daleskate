import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminSection, { AdminEmptyState } from "./AdminSection.jsx";
import { clearSessionOnUnauthorizedStatus } from "./sessionToken.js";

const API_URL = import.meta.env.VITE_API_URL;

const PollList = () => {
  const navigate = useNavigate();
  const [polls, setPolls] = useState([]);
  const [message, setMessage] = useState("");

  const fetchPolls = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/poll_list.php`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (clearSessionOnUnauthorizedStatus(res.status)) {
        navigate("/login");
        return;
      }
      if (res.status === 403) {
        setMessage("No tienes permisos para ver las encuestas.");
        return;
      }

      const data = await res.json();
      if (data.success) {
        setPolls(data.polls);
      } else {
        setMessage(data.error || "Error al cargar encuestas");
      }
    } catch {
      setMessage("Error al conectar con el servidor");
    }
  }, [navigate]);

  const deletePoll = async (id) => {
    if (!confirm("¿Seguro que deseas eliminar esta encuesta?")) return;
    try {
      const res = await fetch(`${API_URL}/api/poll_delete.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ id }),
      });

      if (clearSessionOnUnauthorizedStatus(res.status)) {
        navigate("/login");
        return;
      }
      if (res.status === 403) {
        setMessage("No tienes permisos para eliminar encuestas.");
        return;
      }

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
  }, [fetchPolls]);

  return (
    <AdminSection title="Encuestas" subtitle="Consulta la participación y administra las preguntas de la comunidad.">
      {message && <p className={`rounded-xl border p-3 text-sm ${message.includes("correctamente") ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`} role="status">{message}</p>}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="font-geistmono text-[10px] uppercase tracking-[0.18em] text-stone-500">Participación</p>
            <h2 className="mt-1 font-spectral text-2xl text-stone-900">Encuestas registradas</h2>
          </div>
          <span className="rounded-full bg-stone-100 px-3 py-1 font-geistmono text-xs text-stone-700">{polls.length}</span>
        </div>
        {polls.length === 0 ? <AdminEmptyState title="Todavía no hay encuestas">Crea una encuesta para invitar a la comunidad a participar.</AdminEmptyState> : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {polls.map((poll) => {
              const totalVotes = Object.values(poll.votes || {}).reduce((sum, votes) => sum + votes, 0);
              return (
                <article key={poll.id} className="rounded-2xl border border-stone-200 bg-stone-50/70 p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-800">{totalVotes} votos</span>
                      <h3 className="mt-3 font-spectral text-xl text-stone-900">{poll.question}</h3>
                    </div>
                    <button onClick={() => deletePoll(poll.id)} className="shrink-0 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-600 transition hover:border-red-300 hover:text-red-700">Eliminar</button>
                  </div>
                  <ul className="space-y-3">
                    {poll.options.map((option, index) => {
                      const votes = poll.votes?.[option] || 0;
                      const percent = totalVotes ? Math.round((votes / totalVotes) * 100) : 0;
                      return (
                        <li key={index}>
                          <div className="mb-1 flex justify-between gap-4 text-xs text-stone-600"><span>{option}</span><span>{votes} · {percent}%</span></div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-stone-200"><div className="h-full rounded-full bg-red-700" style={{ width: `${percent}%` }} /></div>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-4 border-t border-stone-200 pt-3 text-xs text-stone-500">
                    Creada: {new Date(poll.created_at).toLocaleDateString("es-MX")}
                    {poll.expires_at && ` · Expira: ${new Date(poll.expires_at).toLocaleDateString("es-MX")}`}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </AdminSection>
  );
};

export default PollList;
