import React from "react";
import PropTypes from "prop-types";

export default function BuoSinDinero({ size = 140 }) {
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
          .monedita {
            animation: caerMoneda 1.8s ease-in-out infinite;
            transform-origin: center;
          }

          @keyframes caerMoneda {
            0% { transform: translateY(0); opacity: 0.6; }
            50% { transform: translateY(6px); opacity: 1; }
            100% { transform: translateY(0); opacity: 0.6; }
          }

          .ala-izq {
            animation: alaNoTengo 3s ease-in-out infinite;
            transform-origin: top right;
          }

          .ala-der {
            animation: alaNoTengo 3s ease-in-out infinite;
            animation-delay: 0.4s;
            transform-origin: top left;
          }

          @keyframes alaNoTengo {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(5deg); }
          }
        `}
      </style>

      <svg
        width={size}
        height={size + 40}
        viewBox="0 0 100 130"
        xmlns="http://www.w3.org/2000/svg"
      >
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

        {/* Alas animadas estilo "no tengo" */}
        <path className="ala-izq" d="M28 66 Q22 80, 34 96" fill="#111" />
        <path className="ala-der" d="M72 66 Q78 80, 66 96" fill="#111" />

        {/* Orejas */}
        <path d="M38 48 L42 34 L44 50 Z" fill="#111" />
        <path d="M62 48 L58 34 L56 50 Z" fill="#111" />

        {/* Cejas caídas */}
        <path d="M38 54 Q50 58, 62 54" stroke="#f7b22a" strokeWidth="2" strokeLinecap="round" />

        {/* Ojos tristes */}
        <path d="M42 60 Q44 62, 46 60" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <path d="M54 60 Q56 62, 58 60" stroke="#fff" strokeWidth="2" strokeLinecap="round" />

        {/* Pico triste */}
        <path d="M48 66 Q50 68, 52 66 Q50 70, 48 66" fill="#f7b22a" />

        {/* Monedita cayendo */}
        <circle className="monedita" cx="50" cy="40" r="3" fill="#f7b22a" />
        <text x="49" y="42" fontSize="4" fill="#111" fontWeight="bold">$</text>
      </svg>

      <div className="mt-4 text-sm text-gray-600 text-center">
        Sin BUKKcoins disponibles...
      </div>
    </div>
  );
}

BuoSinDinero.propTypes = {
  size: PropTypes.number,
};
