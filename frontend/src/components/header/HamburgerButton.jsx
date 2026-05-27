const HamburgerButton = ({ open, toggle }) => {
  return (
    <button
      onClick={toggle}
      className="flex flex-col justify-between w-8 h-5 focus:outline-none cursor-pointer lg:hidden"
    >
      {}
      <span
        className={`block h-1 w-full bg-white transition-transform duration-200 ${
          open ? "rotate-45 translate-y-2" : ""
        }`}
      ></span>
      {/* Línea inferior */}
      <span
        className={`block h-1 w-full bg-white transition-transform duration-200 ${
          open ? "-rotate-45 -translate-y-2" : ""
        }`}
      ></span>
    </button>
  );
};

export default HamburgerButton;
