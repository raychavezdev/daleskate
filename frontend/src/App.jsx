import "./App.css";
import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";
import Banner from "./components/banner/Banner";
import RecentArticles from "./components/main/RecentArticles";
import AdsCarousel from "./components/ads/AdsCarousel.jsx";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";

import ArticleFull from "./components/main/ArticleFull.jsx";
import RedMX from "./components/pages/RedMX.jsx";
import Explorer from "./components/pages/Explorer.jsx";
import Shop from "./components/pages/Shop.jsx";
import Videos from "./components/pages/Videos.jsx";
import Login from "./components/pages/Login.jsx";

// Admin
import Dashboard from "./components/admin/Dashboard.jsx";
import ArticlesAdmin from "./components/admin/ArticlesAdmin.jsx";
import ArticleCreator from "./components/admin/ArticleCreator.jsx";
import AdsAdmin from "./components/admin/AdsAdmin.jsx";
import ChangePassword from "./components/admin/ChangePasword.jsx";
import PollCreate from "./components/admin/PollCreate.jsx";
import PollList from "./components/admin/PollList.jsx";
import PollWidget from "./components/ads/PollWidget.jsx";
import ExclusiveArticles from "./components/admin/ExclusiveArticles.jsx";
import ArticleStats from "./components/admin/ArticleStats.jsx";

// Componente para rutas privadas
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

// Layout general
function Layout({ children }) {
  const location = useLocation();

  const hideCarousel =
    location.pathname.startsWith("/admin") || location.pathname === "/login";

  return (
    <>
      {location.pathname !== "/login" && <Header />}
      {!hideCarousel && <AdsCarousel />}
      {children}
      {!hideCarousel && <AdsCarousel />}
      {location.pathname !== "/login" && <Footer />}
    </>
  );
}

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Página principal */}
          <Route
            path="/"
            element={
              <>
                <Banner />
                <RecentArticles />
                <PollWidget />
              </>
            }
          />

          {/*  Artículos */}
          <Route path="/articulo/:id" element={<ArticleFull />} />

          {/*  Otras páginas */}
          <Route path="/redmx" element={<RedMX />} />
          <Route path="/explorar" element={<Explorer />} />
          <Route path="/tienda" element={<Shop />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/login" element={<Login />} />

          {/*  Rutas de administrador */}
          <Route
            path="/admin/*"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          >
            <Route path="articles" element={<ArticlesAdmin />} />
            <Route path="exclusive-articles" element={<ExclusiveArticles />} />
            <Route path="articles/create" element={<ArticleCreator />} />
            <Route path="articles/edit/:id" element={<ArticleCreator />} />
            <Route path="ads" element={<AdsAdmin />} />
            <Route path="polls/create" element={<PollCreate />} />
            <Route path="polls" element={<PollList />} />
            <Route path="change-password" element={<ChangePassword />} />
            <Route path="stats" element={<ArticleStats />} />
          </Route>

          {/*  Página no encontrada */}
          <Route path="*" element={<p>404 | Página no encontrada</p>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
