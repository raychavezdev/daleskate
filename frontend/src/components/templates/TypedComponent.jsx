import { Typewriter } from "react-simple-typewriter";

const TypedComponent = ({ texts = ["Hola"] }) => (
  <h1 className=" font-geistmono font-bold text-5xl text-transparent bg-clip-text bg-gradient-to-r from-red-800  via-gray-800 to-gray-400">
    <Typewriter
      words={texts}
      loop
      cursor
      cursorStyle="|"
      typeSpeed={70}
      deleteSpeed={20}
    />
  </h1>
);

export default TypedComponent;