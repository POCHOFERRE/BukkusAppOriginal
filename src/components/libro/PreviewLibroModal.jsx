// src/components/libro/PreviewLibroModal.jsx
import React from "react";
import PropTypes from "prop-types";
import { FiX } from "react-icons/fi";

export default function PreviewLibroModal({ libro, onClose }) {
  if (!libro) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-zinc-900 rounded-xl shadow-lg max-w-md w-full text-white overflow-hidden">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white hover:text-yellow-400 text-xl"
        >
          <FiX />
        </button>

        {/* Contenido */}
        <div className="flex flex-col items-center p-5">
          <img
            src={libro.imagenes?.[0] || "https://via.placeholder.com/180x270?text=Libro"}
            alt={libro.nombre}
            className="w-[150px] h-[220px] object-cover rounded-md shadow-md mb-4"
          />
          <h2 className="text-xl font-bold text-center mb-1">{libro.nombre || "Sin título"}</h2>
          <p className="text-sm text-gray-300 mb-2">{libro.autor || "Autor desconocido"}</p>

          <div className="text-sm text-gray-400 space-y-1 text-left w-full px-2">
            {libro.editorial && <p><span className="text-yellow-400">Editorial:</span> {libro.editorial}</p>}
            {libro.anio && <p><span className="text-yellow-400">Año:</span> {libro.anio}</p>}
            {libro.estado && <p><span className="text-yellow-400">Estado:</span> {libro.estado}</p>}
            {libro.valorToken !== undefined && (
              <p><span className="text-yellow-400">Valor:</span> {libro.valorToken} BUKKcoins</p>
            )}
          </div>

          {/* Sinopsis */}
          {libro.sinopsis && (
            <div className="mt-4 text-sm text-gray-300 w-full px-2 max-h-[150px] overflow-y-auto">
              <p className="leading-snug whitespace-pre-line">{libro.sinopsis}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

PreviewLibroModal.propTypes = {
  libro: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};
