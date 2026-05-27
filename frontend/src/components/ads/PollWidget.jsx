import { useEffect, useState } from "react";
import Container from "../templates/Container";

const API_URL = import.meta.env.VITE_API_URL;

const PollWidget = () => {
  const [poll, setPoll] = useState(null);
  const [selected, setSelected] = useState("");
  const [voted, setVoted] = useState(false);
  const [message, setMessage] = useState("");

  const fetchPoll = async () => {
    try {
      const res = await fetch(`${API_URL}/api/poll_get_active.php`);
      const data = await res.json();
      if (data.success) {
        setPoll(data.poll);

        
        const votedPolls = JSON.parse(
          localStorage.getItem("votedPolls") || "[]"
        );
        if (votedPolls.includes(data.poll.id)) {
          setVoted(true);
        }
      }
    } catch (error) {
      console.error("Error cargando encuesta:", error);
    }
  };

  const handleVote = async () => {
    if (!selected) {
      setMessage("Selecciona una opción antes de votar.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/poll_vote.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poll_id: poll.id, option: selected }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage("¡Gracias por votar!");
        setVoted(true);
        fetchPoll();

        
        const votedPolls = JSON.parse(
          localStorage.getItem("votedPolls") || "[]"
        );
        if (!votedPolls.includes(poll.id)) {
          votedPolls.push(poll.id);
          localStorage.setItem("votedPolls", JSON.stringify(votedPolls));
        }
      } else {
        setMessage(data.error || "Error al votar");
      }
    } catch (error) {
      setMessage("Error de conexión con el servidor.", error);
    }
  };

  useEffect(() => {
    fetchPoll();
  }, []);

  if (!poll) return null;

  const totalVotes = Object.values(poll.votes || {}).reduce(
    (sum, v) => sum + v,
    0
  );

  return (
    <Container>
      <div className="bg-white p-5 my-8 mx-5 border font-geistmono tracking-wider max-w-lg lg:mx-auto">
        <h3 className="text-lg font-semibold mb-3 text-gray-900">
          {poll.question}
        </h3>

        {voted ? (
          <div className="space-y-2">
            {poll.options.map((opt, i) => {
              const votes = poll.votes?.[opt] || 0;
              const percent = totalVotes
                ? Math.round((votes / totalVotes) * 100)
                : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm text-gray-700 mb-1">
                    <span>{opt}</span>
                    <span>
                      {votes} votos ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-3"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-gray-500 mt-3">
              Total: {totalVotes} votos
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {poll.options.map((opt, i) => (
              <label
                key={i}
                className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100"
              >
                <input
                  type="radio"
                  name="option"
                  value={opt}
                  onChange={() => setSelected(opt)}
                  checked={selected === opt}
                  className="w-5 h-5 accent-blue-600 scale-125 cursor-pointer"
                />
                <span>{opt}</span>
              </label>
            ))}
            <button
              onClick={handleVote}
              className="inline-block px-4 py-1 font-bold transition font-serif border border-orange-700 rounded-4xl text-sm hover:bg-orange-700 hover:text-white hover:cursor-pointer"
            >
              Votar
            </button>
            {message && (
              <p className="text-sm text-center mt-2 text-gray-600">
                {message}
              </p>
            )}
          </div>
        )}
      </div>
    </Container>
  );
};

export default PollWidget;
