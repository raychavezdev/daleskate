import Container from "../templates/Container";

const RedMX = () => {
  return (
    <Container>
      <main className="flex   justify-center items-center text-center mb-16 md:px-20">
        <div className="w-10/12 flex flex-col gap-6">
          <h1 className="text-4xl text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-400 to-gray-800 tracking-wider my-8 font-bold">
            PRÓXIMAMENTE
          </h1>

          <h2 className="text-white tracking-widest text-2xl">
            <span className="bg-red-600 size-3 inline-block rounded-full "></span>{" "}
            RED MX
          </h2>

          <img src="/Mapa_RedMx.png" alt="" />
          <p className="text-white px-10 mt-5">
            Aquí encuentras a quienes hacen que la escena skate viva: tiendas,
            fotógrafos, filmers, diseñadores y más.
          </p>
        </div>
      </main>
    </Container>
  );
};

export default RedMX;
