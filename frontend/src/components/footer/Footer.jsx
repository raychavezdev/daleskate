import Container from "../templates/Container";

const Footer = () => {
  return (
    <footer className="bg-black  text-white py-8 px-6 md:px-0">
      <Container>
        <a href="/" className="block mb-6">
          <img className="h-11" src="/logo.png" alt="DALE" />
        </a>

        <ul className="mb-6">
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
          <li>{}</li>
        </ul>

        <ul className="flex gap-6">
          <li className="font-dmsansbold">Redes Sociales:</li>
          <li>
            <a href="https://www.instagram.com/daleskate/" target="_blank">
              Instagram
            </a>
          </li>
          <li>
            <a href="https://www.facebook.com/Daleskatezine" target="_blank">
              Facebook
            </a>
          </li>
          <li>
            <a href="https://www.youtube.com/@dalesk8" target="_blank">
              Youtube
            </a>
          </li>
        </ul>
      </Container>
    </footer>
  );
};

export default Footer;
