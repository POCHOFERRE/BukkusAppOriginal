import React from "react";
import PropTypes from "prop-types";

const LOGO_BUKKUS = "/icon_bukkus_yellow.png"; // ✅ Ruta pública correcta

export default function LogoBukKus({ size = 40 }) {
  return (
    <div className="flex flex-col items-center justify-center">
      <img
        src={LOGO_BUKKUS}
        alt="BuKKus logo"
        style={{ width: size, height: size }}
        className="object-contain"
      />
      <h1 className="logo-bukkus text-2xl font-bold leading-none">
        BU<span className="inline-block transform -scale-x-100">K</span>KUS
      </h1>
    </div>
  );
}

LogoBukKus.propTypes = {
  size: PropTypes.number,
};
