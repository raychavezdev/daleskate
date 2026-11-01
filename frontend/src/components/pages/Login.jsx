const API_URL = import.meta.env.VITE_API_URL;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { storeSessionToken } from "../admin/sessionToken.js";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    // El tiempo del cliente sirve como origen relativo; la API valida exp con su reloj y la firma.
    const sessionStartedAt = Date.now();

    try {
      const res = await fetch(`${API_URL}/api/auth.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.token && storeSessionToken(data.token, localStorage, sessionStartedAt)) {
        navigate("/admin");
      } else if (res.ok && data.token) {
        setError("La sesión recibida no es válida. Intenta iniciar sesión de nuevo.");
      } else {
        setError(data.error || "Credenciales inválidas");
      }
    } catch (err) {
      setError("Error de conexión con el servidor");
      console.error(err);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#111] px-4 py-10 text-stone-900 sm:px-6">
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-red-800/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-stone-500/10 blur-3xl" />
      <section className="relative grid w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl md:grid-cols-[0.95fr_1.05fr]">
        <div className="flex min-h-56 flex-col justify-between bg-stone-950 p-7 text-white sm:p-10 md:min-h-[34rem]">
          <div>
            <img
              src="/logo.svg"
              alt="DaleSkate"
              className="h-auto w-36 sm:w-44"
            />
            <div className="mt-8 h-1 w-14 rounded-full bg-red-700" />
          </div>
          <p className="mt-8 max-w-xs font-spectral text-2xl leading-snug text-stone-100 sm:text-3xl">
            Acceso al panel editorial
          </p>
        </div>

        <div className="flex flex-col justify-center p-7 sm:p-10 md:p-12">
          <p className="font-geistmono text-[10px] uppercase tracking-[0.2em] text-red-700">Acceso administrativo</p>
          <h2 className="mt-2 font-spectral text-3xl text-stone-950">Iniciar sesión</h2>
          <p className="mt-2 text-sm text-stone-500">Entra con tu cuenta para continuar.</p>

          {error && (
            <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <label className="block text-sm font-semibold text-stone-700">
              Usuario
              <input
                type="text"
                autoComplete="username"
                className="mt-2 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-red-700 focus:bg-white focus:ring-4 focus:ring-red-700/10"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </label>
            <label className="block text-sm font-semibold text-stone-700">
              Contraseña
              <input
                type="password"
                autoComplete="current-password"
                className="mt-2 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-red-700 focus:bg-white focus:ring-4 focus:ring-red-700/10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <button type="submit" className="group flex w-full items-center justify-between rounded-xl bg-red-800 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-950/15 transition hover:bg-red-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-800">
              <span>Entrar al panel</span>
              <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
            </button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default Login;
