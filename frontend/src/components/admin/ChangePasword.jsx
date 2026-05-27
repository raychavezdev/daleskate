import { useState } from "react";
import { useNavigate } from "react-router-dom";
const API_URL = import.meta.env.VITE_API_URL;

const ChangePassword = () => {
  const navigate = useNavigate();
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (newPass !== confirmPass) {
      alert("Las contraseñas nuevas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/change_password.php`, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_password: currentPass,
          new_password: newPass,
        }),
      });
      const data = await res.json();
      alert(data.message || data.error);
      if (res.ok) navigate("/admin/articles");
    } catch (err) {
      console.error(err);
      alert("Error cambiando la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Cambiar contraseña</h2>
      <input
        type="password"
        placeholder="Contraseña actual"
        className="border p-2 w-full mb-2"
        value={currentPass}
        onChange={(e) => setCurrentPass(e.target.value)}
      />
      <input
        type="password"
        placeholder="Nueva contraseña"
        className="border p-2 w-full mb-2"
        value={newPass}
        onChange={(e) => setNewPass(e.target.value)}
      />
      <input
        type="password"
        placeholder="Confirmar nueva contraseña"
        className="border p-2 w-full mb-4"
        value={confirmPass}
        onChange={(e) => setConfirmPass(e.target.value)}
      />
      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`w-full py-2 px-4 text-white rounded ${
          loading ? "bg-gray-500" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading ? "Cambiando..." : "Cambiar contraseña"}
      </button>
    </div>
  );
};

export default ChangePassword;
