import React, { useEffect, useState } from "react";

export default function InstruccionInstalacionPWA() {
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    const isIos = () => /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const isInStandaloneMode = () =>
      "standalone" in window.navigator && window.navigator.standalone;

    const yaMostrado = localStorage.getItem("pwaInstruccionMostrada") === "true";

    if (isIos() && !isInStandaloneMode() && !yaMostrado) {
      setTimeout(() => {
        setMostrar(true);
        localStorage.setItem("pwaInstruccionMostrada", "true");
      }, 2500);
    }
  }, []);

  if (!mostrar) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-lg text-center">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">📲 Instalá BUKKUS en tu iPhone</h2>

        <div className="text-sm text-gray-700 space-y-3 text-left">
          <p>1️⃣ Tocá el botón <strong>“Compartir”</strong> <span className="inline-block">📤</span> en la parte inferior de Safari.</p>
          <p>2️⃣ Deslizá hacia abajo y seleccioná <strong>“Agregar a inicio”</strong> 🏠</p>
          <p>3️⃣ ¡Listo! Vas a poder usar BUKKUS como una app desde el escritorio.</p>
        </div>

        <button
          onClick={() => setMostrar(false)}
          className="mt-6 bg-oliva text-white px-6 py-2 rounded-full text-sm"
        >
          ¡Entendido!
        </button>
      </div>
    </div>
  );
}
