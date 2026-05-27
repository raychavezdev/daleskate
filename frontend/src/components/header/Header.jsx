import Menu from "./Menu";
import Container from "../templates/Container";

const Header = () => {
  return (
    <header className="bg-black relative h-20 flex items-center px-6 md:px-0">
      <Container>
        <nav className="flex justify-between items-center">
          <a href="/">
            <img className="h-11" src="/logo.png" alt="DALE" />
          </a>
          <Menu />
        </nav>
      </Container>
    </header>
  );
};

export default Header;
