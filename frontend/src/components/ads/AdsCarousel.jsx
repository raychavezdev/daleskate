import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Container from "../templates/Container";

const API_URL = import.meta.env.VITE_API_URL;

const AdsCarousel = () => {
  const [ads, setAds] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/ads_get.php`)
      .then((res) => res.json())
      .then((data) => setAds(data))
      .catch((err) => console.error("Error cargando anuncios:", err));
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: false,
    speed: 700,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  if (ads.length === 0) return null; 

  return (
    <Container>
      <Slider {...settings}>
        {ads.map((ad) => (
          <div key={ad.id} className="relative">
            <a
              href={ad.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <img
                src={`${API_URL}/uploads/ads/${ad.image}`}
                alt="Publicidad"
                className="w-full h-24 lg:h-40 object-cover shadow-md hover:opacity-90 transition"
              />
            </a>
          </div>
        ))}
      </Slider>
    </Container>
  );
};

export default AdsCarousel;
