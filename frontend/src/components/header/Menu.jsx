import { useState } from "react";
import { useNavigate } from "react-router-dom";
import HamburgerButton from "./HamburgerButton";

const Menu = () => {
  const [active, setActive] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    if (e.key === "Enter" && search.trim() !== "") {
      navigate(`/explorar/?q=${encodeURIComponent(search.trim())}`);
      setActive(false); 
      setSearch(""); 
    }
  };

  return (
    <>
      <HamburgerButton open={active} toggle={() => setActive(!active)} />
      <ul
        className={` ${
          active
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        } flex flex-col items-center absolute text-[#8A8A8A] bg-[#EBEBEB] right-0 top-full w-11/12 rounded-bl-4xl py-10 text-2xl gap-3 transition-all duration-200 
  lg:flex-row lg:static lg:opacity-100 lg:bg-transparent lg:w-auto lg:p-0 lg:text-lg lg:gap-6 lg:pointer-events-auto 
  z-50 shadow-lg`}
      >
        <li>
          <a href="/explorar/">Explorar</a>
        </li>
        <li>
          <a href="/videos/">Videos</a>
        </li>
        <li>
          <a href="/redmx/">Red</a>
        </li>
        <li>
          <a href="/tienda/">Tienda</a>
        </li>
        <li>
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearch}
            className="bg-white rounded-full px-2 py-1 text-center text-gray-700 border border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition"
          />
        </li>
      </ul>
    </>
  );
};

export default Menu;
