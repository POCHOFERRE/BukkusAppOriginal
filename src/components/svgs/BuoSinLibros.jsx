import React from "react";
import PropTypes from "prop-types";

export default function BuoSinLibros({ size = 140 }) {
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
      }}
    >
      <style>
        {`
          .llanto {
            animation: lagrima 1.8s ease-in-out infinite;
            transform-origin: center;
            opacity: 0.8;
          }

          @keyframes lagrima {
            0% { transform: translateY(0); opacity: 0.6; }
            50% { transform: translateY(6px); opacity: 1; }
            100% { transform: translateY(0); opacity: 0.6; }
          }

          .alas-tristes {
            animation: alasDesilusion 3.5s ease-in-out infinite;
            transform-origin: center;
          }

          @keyframes alasDesilusion {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(2deg); }
          }
        `}
      </style>

      <svg
        width={size}
        height={size + 40}
        viewBox="0 0 100 130"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Luna suave */}
        <circle cx="80" cy="30" r="18" fill="#f7b22a22" />

        {/* Rama */}
        <rect x="20" y="105" width="60" height="6" rx="3" fill="#654321" />

        {/* Patitas */}
        <line x1="38" y1="102" x2="36" y2="108" stroke="#f7b22a" strokeWidth="2" />
        <line x1="40" y1="102" x2="40" y2="108" stroke="#f7b22a" strokeWidth="2" />
        <line x1="42" y1="102" x2="44" y2="108" stroke="#f7b22a" strokeWidth="2" />
        <line x1="56" y1="102" x2="54" y2="108" stroke="#f7b22a" strokeWidth="2" />
        <line x1="58" y1="102" x2="58" y2="108" stroke="#f7b22a" strokeWidth="2" />
        <line x1="60" y1="102" x2="62" y2="108" stroke="#f7b22a" strokeWidth="2" />

        {/* Cuerpo */}
        <ellipse cx="50" cy="70" rx="22" ry="30" fill="#111" />

        {/* Plumitas */}
        <path d="M38 88 Q50 84, 62 88" stroke="#444" strokeWidth="1" fill="none" />
        <path d="M38 92 Q50 88, 62 92" stroke="#444" strokeWidth="1" fill="none" />

        {/* Alas animadas */}
        <g className="alas-tristes">
          <path d="M28 66 Q22 85, 32 96" fill="#111" />
          <path d="M72 66 Q78 85, 68 96" fill="#111" />
        </g>

        {/* Orejas */}
        <path d="M38 48 L42 34 L44 50 Z" fill="#111" />
        <path d="M62 48 L58 34 L56 50 Z" fill="#111" />

        {/* Cejas caídas */}
        <path d="M38 54 Q50 58, 62 54" stroke="#f7b22a" strokeWidth="2" strokeLinecap="round" />

        {/* Ojos tristes */}
        <path d="M42 60 Q44 62, 46 60" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <path d="M54 60 Q56 62, 58 60" stroke="#fff" strokeWidth="2" strokeLinecap="round" />

        {/* Lagrimita animada */}
        <circle className="llanto" cx="44" cy="64" r="1.8" fill="#f7b22a" />

        {/* Pico triste */}
        <path d="M48 66 Q50 68, 52 66 Q50 70, 48 66" fill="#f7b22a" />
      </svg>

      <div style={{ marginTop: 10, fontSize: 14, color: "#777", textAlign: "center" }}>
        Sin libros todavía...
      </div>
    </div>
  );
}

BuoSinLibros.propTypes = {
  size: PropTypes.number,
};
