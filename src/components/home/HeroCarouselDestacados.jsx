import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import PropTypes from "prop-types";

function HeroCarouselDestacados({ libros = [], onClickLibro }) {
  const destacados = libros.filter((libro) => libro.destacado);

  const settingsHero = {
    dots: true,
    infinite: true,
    speed: 500,
    autoplay: true,
    autoplaySpeed: 6000,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
  };

  if (destacados.length === 0) return null;

  return (
    <div className="w-full px-2 pt-4">
      {/* 🔥 Hero carrusel autoplay */}
      <Slider {...settingsHero} className="mb-5">
        {destacados.map((libro) => (
          <div
            key={libro.id}
            className="relative w-full h-[200px] sm:h-[240px] rounded-xl overflow-hidden group cursor-pointer transition-transform duration-300 hover:scale-[1.015]"
            onClick={() => onClickLibro && onClickLibro(libro)}
          >
            <img
              src={libro.imagenes?.[0] || "https://via.placeholder.com/400x250?text=Libro"}
              alt={libro.nombre}
              className="w-full h-full object-cover rounded-xl"
            />

            {/* Gradiente oscuro encima */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent rounded-xl" />

            {/* Título y botón */}
            <div className="absolute bottom-4 left-4 text-white z-10">
              <h2 className="text-xl sm:text-2xl font-bold drop-shadow-md">
                {libro.nombre}
              </h2>
              <button
                className="mt-2 px-4 py-[6px] bg-yellow-400 text-black text-sm font-semibold rounded-full hover:bg-yellow-300 transition-all"
                onClick={(e) => {
                  e.stopPropagation(); // para evitar conflicto con el click general
                  onClickLibro && onClickLibro(libro);
                }}
              >
                Ver más
              </button>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
}

HeroCarouselDestacados.propTypes = {
  libros: PropTypes.array.isRequired,
  onClickLibro: PropTypes.func, // Para abrir modal o redirigir
};

export default HeroCarouselDestacados;
