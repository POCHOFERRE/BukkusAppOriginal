import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { doc, updateDoc, onSnapshot, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Star, StarFill, GeoAlt, PersonPlus, ChevronRight, X } from 'react-bootstrap-icons';

export default function CardLibro({
  libro,
  esMio,
  onEditar,
  onLoginClick,
  favoritos,
  setFavoritos,
  usuarioActivo,
}) {
  const navigate = useNavigate();
  const [esFavorito, setEsFavorito] = useState(false);
  const [datosUsuario, setDatosUsuario] = useState({});
  const [indiceImagen, setIndiceImagen] = useState(0);
  const [startX, setStartX] = useState(0);
  const [mostrarModalUsuarios, setMostrarModalUsuarios] = useState(false);
  const [usuariosQuePublicaron, setUsuariosQuePublicaron] = useState([]);

  libro.valorToken = Number(libro.valorToken) || 0;

  useEffect(() => {
    setEsFavorito((favoritos || []).includes(libro.id));
  }, [favoritos, libro.id]);

  // Suscripción a datos del usuario
  useEffect(() => {
    if (!libro?.usuarioId) return;
    const userRef = doc(db, "usuarios", libro.usuarioId);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setDatosUsuario(docSnap.data());
      }
    });
    return () => unsubscribe();
  }, [libro.usuarioId]);

  const toggleFavorito = async () => {
    if (!usuarioActivo) return onLoginClick?.();
    try {
      const docRef = doc(db, "usuarios", usuarioActivo.id);
      const nuevosFavoritos = esFavorito
        ? favoritos.filter((id) => id !== libro.id)
        : [...favoritos, libro.id];

      await updateDoc(docRef, { favoritos: nuevosFavoritos });
      setFavoritos(nuevosFavoritos);
      setEsFavorito(!esFavorito);
      toast.success(esFavorito ? "Quitado de favoritos" : "Agregado a favoritos", {
        position: "bottom-center",
        autoClose: 1200,
      });
    } catch (error) {
      console.error("Error actualizando favoritos:", error);
      toast.error("Hubo un error", { position: "bottom-center", autoClose: 1200 });
    }
  };

  const handleTouchStart = (e) => setStartX(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startX;
    const total = libro.imagenes?.length || 0;
    if (Math.abs(diff) > 30) {
      if (diff < 0 && indiceImagen < total - 1) setIndiceImagen(indiceImagen + 1);
      if (diff > 0 && indiceImagen > 0) setIndiceImagen(indiceImagen - 1);
    }
  };

  const cargarUsuariosQuePublicaron = async () => {
    try {
      const q = query(collection(db, "libros"), where("nombre", "==", libro.nombre));
      const snap = await getDocs(q);
      const usuariosSet = new Set();
      const usuariosData = [];
      for (const docLibro of snap.docs) {
        const data = docLibro.data();
        if (!usuariosSet.has(data.usuarioId)) {
          usuariosSet.add(data.usuarioId);
          const usuarioSnap = await getDoc(doc(db, "usuarios", data.usuarioId));
          if (usuarioSnap.exists()) {
            usuariosData.push({ id: data.usuarioId, ...usuarioSnap.data() });
          }
        }
      }
      setUsuariosQuePublicaron(usuariosData);
      setMostrarModalUsuarios(true);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    }
  };

  if (!libro) return null;

  return (
    <div
      className="card-libro relative overflow-hidden flex flex-col"
      style={{ width: "200px", height: "340px" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Imagen */}
      <div className="w-full h-[150px] bg-gray-50 relative flex items-center justify-center">
        <img
          src={libro.imagenes?.[indiceImagen] || "https://via.placeholder.com/100x150"}
          alt={libro.nombre}
          className="max-h-full max-w-full object-contain"
        />
        {libro.imagenes?.length > 1 && (
          <div className="absolute bottom-1 right-1 flex gap-1 z-10">
            {libro.imagenes.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${
                  i === indiceImagen ? "bg-[#f7b22a]" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="flex-1 flex flex-col justify-between p-3">
        {/* Info */}
        <div>
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
              {libro.nombre}
            </h3>
            <button
              onClick={toggleFavorito}
              className={`p-1 rounded-full ${
                esFavorito ? "bg-yellow-50" : "bg-gray-50 hover:bg-gray-100"
              }`}
              aria-label="Favorito"
            >
              {esFavorito ? (
                <StarFill className="text-yellow-500 w-4 h-4" />
              ) : (
                <Star className="text-gray-400 w-4 h-4" />
              )}
            </button>
          </div>
          <p className="autor text-xs font-medium">{libro.autor}</p>
          <div className="ciudad text-[10px] flex items-center mt-1">
            <GeoAlt className="mr-1 w-3 h-3 flex-shrink-0" />
            <span>{datosUsuario.ciudad || "Ubicación no especificada"}</span>
          </div>

          {/* Cantidad de usuarios */}
          {libro.cantidad > 1 ? (
            <button
              onClick={cargarUsuariosQuePublicaron}
              className="mt-2 w-full text-[11px] text-blue-500 font-medium flex items-center justify-between border border-blue-100 px-2 py-1 rounded-full hover:bg-blue-50 transition"
            >
              <span className="flex items-center">
                <PersonPlus className="mr-1 w-3.5 h-3.5" />
                Ver {libro.cantidad} usuarios más
              </span>
              <ChevronRight className="w-3 h-3 opacity-70" />
            </button>
          ) : (
            <div className="h-6"></div>
          )}

          {/* Tokens */}
          {libro.valorToken > 0 && (
            <div className="token-badge rounded-full px-2 py-0.5 text-xs font-semibold mt-1 inline-block">
              {libro.valorToken} TK
            </div>
          )}
        </div>

        {/* Botón */}
        <div className="mt-2">
          {!esMio ? (
            <button
              onClick={() => navigate(`/propuesta/${libro.id}`)}
              className="w-full bg-[#f7b22a] text-black text-xs font-bold rounded-full py-1 hover:bg-yellow-300 transition texto-sobre-amarillo"
            >
              ¡Intercambiar!
            </button>
          ) : (
            <div className="flex justify-between items-center text-[10px] mt-1">
              <span className="text-green-400">Este libro es tuyo</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditar();
                }}
                className="text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded-full"
              >
                Editar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Usuarios */}
      {mostrarModalUsuarios && (
        <div className="modal-background flex justify-center items-center p-4">
          <div className="modal-content">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Usuarios que publicaron</h3>
              <button
                onClick={() => setMostrarModalUsuarios(false)}
                className="p-1.5 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {usuariosQuePublicaron.length === 0 ? (
                <div className="p-5 text-center text-gray-500">
                  <p>Cargando usuarios...</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {usuariosQuePublicaron.map((u) => (
                    <li key={u.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(u.nombre || 'U')}
                          alt={u.nombre || 'Usuario'}
                          className="w-10 h-10 rounded-full object-cover bg-gray-100"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">{u.nombre || 'Usuario'}</p>
                          {u.ciudad && (
                            <span className="text-sm text-gray-500 flex items-center">
                              <GeoAlt className="w-3.5 h-3.5 mr-1" />
                              {u.ciudad}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

CardLibro.propTypes = {
  libro: PropTypes.object.isRequired,
  esMio: PropTypes.bool,
  onEditar: PropTypes.func,
  onLoginClick: PropTypes.func,
  favoritos: PropTypes.array,
  setFavoritos: PropTypes.func,
  usuarioActivo: PropTypes.object,
};
