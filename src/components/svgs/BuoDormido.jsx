import React from "react";
import PropTypes from "prop-types";

export default function BuoDormido({ size = 140 }) {
  return (
    <div
      style={{
        width: size,
        height: size + 80,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <style>
        {`
          .zzz {
            animation: flotarZ 3s ease-in-out infinite;
            font-weight: bold;
            color: #f7b22a;
          }

          .zzz:nth-child(2) {
            animation-delay: 0.5s;
            font-size: 0.8em;
            opacity: 0.6;
          }

          .zzz:nth-child(3) {
            animation-delay: 1s;
            font-size: 0.6em;
            opacity: 0.4;
          }

          @keyframes flotarZ {
            0% { transform: translateY(0); opacity: 0.6; }
            50% { transform: translateY(-12px); opacity: 1; }
            100% { transform: translateY(0); opacity: 0.6; }
          }

          .ojo {
            animation: parpadeo 6s ease-in-out infinite;
            transform-origin: center;
          }

          @keyframes parpadeo {
            0%, 98%, 100% { transform: scaleY(1); }
            99% { transform: scaleY(0.1); }
          }
        `}
      </style>

      <svg
        width={size}
        height={size + 30}
        viewBox="0 0 100 130"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Fondo luna */}
        <circle cx="80" cy="30" r="18" fill="#f7b22a33" />

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

        {/* Alas */}
        <path d="M28 66 Q22 80, 34 96" fill="#111" />
        <path d="M72 66 Q78 80, 66 96" fill="#111" />

        {/* Orejas */}
        <path d="M38 48 L42 34 L44 50 Z" fill="#111" />
        <path d="M62 48 L58 34 L56 50 Z" fill="#111" />

        {/* Cejas tipo pluma */}
        <path d="M36 54 Q50 50, 64 54" stroke="#f7b22a" strokeWidth="2" strokeLinecap="round" />

        {/* Ojitos cerrados */}
        <path className="ojo" d="M42 60 Q44 58, 46 60" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <path className="ojo" d="M54 60 Q56 58, 58 60" stroke="#fff" strokeWidth="2" strokeLinecap="round" />

        {/* Pico */}
        <polygon points="48,64 52,64 50,68" fill="#f7b22a" />
      </svg>

      {/* Zzz */}
      <div style={{ position: "absolute", left: "-10px", top: "10px" }}>
        <div className="zzz" style={{ fontSize: 16 }}>Z</div>
        <div className="zzz" style={{ fontSize: 14 }}>z</div>
        <div className="zzz" style={{ fontSize: 12 }}>z</div>
      </div>
    </div>
  );
}

BuoDormido.propTypes = {
  size: PropTypes.number,
};
