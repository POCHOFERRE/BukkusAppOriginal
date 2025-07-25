import React, { useEffect, useState, useContext } from "react";
import PropTypes from "prop-types";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../config/firebase";
import { motion } from "framer-motion";
import { FaBook } from "react-icons/fa";
import { UserContext } from "../../context/UserContext";

export default function MisLibrosSelector({ onSelect, libroSeleccionado }) {
  const { usuarioActivo } = useContext(UserContext);
  const [libros, setLibros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);

  const librosPorPagina = 6;
  const totalPaginas = Math.ceil(libros.length / librosPorPagina);
  const librosPagina = libros.slice(
    (paginaActual - 1) * librosPorPagina,
    paginaActual * librosPorPagina
  );

  useEffect(() => {
    if (!usuarioActivo?.id) return;

    const fetch = async () => {
      const q = query(
        collection(db, "libros"),
        where("usuarioId", "==", usuarioActivo.id)
      );
      const res = await getDocs(q);
      const data = res.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLibros(data);
      setLoading(false);
    };

    fetch();
  }, [usuarioActivo]);

  if (loading) return <p className="text-center text-sm text-gray-500">Cargando tus libros...</p>;

  if (libros.length === 0)
    return <p className="text-center text-sm text-gray-400">No tenés libros publicados aún.</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {librosPagina.map((libro) => {
          const imagenUrl = Array.isArray(libro.imagenes) ? libro.imagenes[0] : null;
          const seleccionado = libroSeleccionado?.id === libro.id;

          return (
            <motion.div
              key={libro.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => onSelect(libro)}
              className={`relative bg-zinc-900 rounded-md sm:rounded-xl shadow-none sm:shadow-sm cursor-pointer transition-all duration-200 
                p-2 sm:p-4 w-full max-w-sm mx-auto sm:mx-0 min-h-[300px] ${
      seleccionado ? "ring-2 ring-yellow-500" : "hover:shadow-sm"
    }`}
    
            >
              <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden rounded">
                {imagenUrl ? (
                  <img src={imagenUrl} alt={libro.nombre} className="h-48 w-full object-cover" />
                ) : (
                  <div className="text-center text-gray-400">
                    <FaBook className="h-10 w-10 mx-auto" />
                    <p className="text-sm">Sin imagen</p>
                  </div>
                )}
              </div>

              <div className="mt-3 space-y-1">
                <h3 className="text-white font-semibold text-sm break-words line-clamp-2">
                  {libro.nombre}
                </h3>
                <p className="text-gray-600 text-xs break-words line-clamp-1">{libro.autor}</p>
                {libro.editorial && (
                  <p className="text-xs text-gray-400 line-clamp-1">Editorial: {libro.editorial}</p>
                )}
                {libro.anio && (
                  <p className="text-xs text-gray-400 line-clamp-1">Año: {libro.anio}</p>
                )}
                {libro.estadoLibro && (
                  <p className="text-xs text-gray-500 italic line-clamp-1">
                    Estado: {libro.estadoLibro}
                  </p>
                )}
              </div>

              {seleccionado && (
                <div className="absolute top-2 right-2 bg-yellow-500 text-white rounded-full p-1">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Paginador */}
      {totalPaginas > 1 && (
        <div className="flex justify-center mt-2 gap-2 text-sm">
          {Array.from({ length: totalPaginas }, (_, i) => (
            <button
              key={i}
              onClick={() => setPaginaActual(i + 1)}
              className={`px-3 py-1 rounded-full border transition ${
                paginaActual === i + 1
                  ? "bg-yellow-400 text-black border-yellow-500"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

MisLibrosSelector.propTypes = {
  onSelect: PropTypes.func.isRequired,
  libroSeleccionado: PropTypes.shape({
    id: PropTypes.string,
    nombre: PropTypes.string,
  }),
};
