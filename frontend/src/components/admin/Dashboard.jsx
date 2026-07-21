import { Outlet, Link, useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {}
      <aside className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold border-b border-gray-700">
          Admin Panel
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/admin/articles"
            className="block py-2 px-4 rounded hover:bg-gray-700"
          >
            Artículos
          </Link>
          <Link
            to="/admin/exclusive-articles"
            className="block py-2 px-4 rounded hover:bg-gray-700"
          >
            Artículos Exclusivos
          </Link>
          <Link
            to="/admin/ads"
            className="block py-2 px-4 rounded hover:bg-gray-700"
          >
            Publicidad
          </Link>
          <Link
            to="/admin/stats"
            className="block py-2 px-4 rounded hover:bg-gray-700"
          >
            Estadísticas
          </Link>
          <Link
            to="/admin/polls"
            className="block py-2 px-4 rounded hover:bg-gray-700"
          >
            Encuestas
          </Link>
          <Link
            to="/admin/polls/create"
            className="block py-2 px-4 rounded hover:bg-gray-700"
          >
            Crear Encuesta
          </Link>

          <Link
            to="/admin/change-password"
            className="block py-2 px-4 rounded hover:bg-gray-700"
          >
            Cambiar contraseña
          </Link>
          <button
            onClick={handleLogout}
            className="m-4 py-2 px-4 bg-red-600 rounded hover:bg-red-700"
          >
            Cerrar sesión
          </button>
        </nav>
      </aside>

      {}
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Dashboard;
