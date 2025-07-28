import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { 
  doc, 
  updateDoc, 
  onSnapshot, 
  query, 
  collection, 
  where, 
  getDocs, 
  getDoc 
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { toast } from "react-toastify";
import { FaRegStar, FaStar, FaUsers } from "react-icons/fa";
import { FiMapPin } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

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
  const [animarFavorito, setAnimarFavorito] = useState(false);
  const [datosUsuario, setDatosUsuario] = useState({});
  const [indiceImagen, setIndiceImagen] = useState(0);
  const [startX, setStartX] = useState(0);
  const [mostrarModalUsuarios, setMostrarModalUsuarios] = useState(false);
  const [usuariosQuePublicaron, setUsuariosQuePublicaron] = useState([]);

  libro.valorToken = Number(libro.valorToken) || 0;

  useEffect(() => {
    setEsFavorito((favoritos || []).includes(libro.id));
  }, [favoritos, libro.id]);

  // Real-time user data subscription
  useEffect(() => {
    if (!libro?.usuarioId) return;
    
    const userRef = doc(db, "usuarios", libro.usuarioId);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setDatosUsuario(docSnap.data());
      }
    }, (error) => {
      console.error("Error fetching user data:", error);
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
      setAnimarFavorito(true);
      toast.success(esFavorito ? "Quitado de favoritos" : "Agregado a favoritos", {
        position: "bottom-center",
        autoClose: 1200,
      });
    } catch (error) {
      console.error("Error actualizando favoritos:", error);
      toast.error("Hubo un error", {
        position: "bottom-center",
        autoClose: 1200,
      });
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
    <div className=" bg-zinc-900 text-white rounded-xl shadow-md overflow-hidden mb-4 p-3 w-[170px] min-h-[320px] flex flex-col justify-between relative">
      {/* Imagen */}
      <div
        className="w-full h-[150px] rounded-md overflow-hidden relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
 


        <img
          src={libro.imagenes?.[indiceImagen] || "https://via.placeholder.com/100x150"}
          alt={libro.nombre}
          className="w-full h-full object-cover"
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

      {/* Info */}
      <div className="mt-1 text-xs flex-1">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-[13px] text-white line-clamp-2">
            {libro.nombre || "Sin título"}
          </h3>
          {!esMio && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorito();
              }}
              className={`text-[#f7b22a] text-sm ${animarFavorito ? "scale-125" : ""}`}
            >
              {esFavorito ? <FaStar /> : <FaRegStar />}
            </button>
          )}
        </div>
        <p className="text-[11px] text-gray-400 line-clamp-1">{libro.autor}</p>
        <p className="text-[11px] text-gray-500 line-clamp-1">{libro.editorial}</p>

{libro.cantidad > 1 && (
  <button
    onClick={cargarUsuariosQuePublicaron}
    className="mt-1 text-[10px] text-yellow-300 bg-zinc-800 border border-yellow-400 rounded-full px-2 py-0.5 inline-flex items-center gap-1 hover:bg-yellow-400 hover:text-black transition"
    title="Ver usuarios que publicaron este libro"
  >
    <FaUsers className="text-[12px]" />
    {libro.cantidad} usuarios lo publicaron
  </button>
)}



        {libro.valorToken > 0 && (
          <span className="bg-[#f7b22a] text-black text-[11px] px-2 py-0.5 rounded-full inline-block mt-1">
            {libro.valorToken} TK
          </span>
        )}

        {datosUsuario?.ciudad && (
          <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
            <FiMapPin /> {datosUsuario.ciudad}
          </p>
        )}
      </div>

      {/* Acciones */}
      <div className="mt-2">
        {!esMio ? (
          <button
            onClick={() => navigate(`/propuesta/${libro.id}`)}
            className="w-full bg-[#f7b22a] text-black px-2 py-1 text-[11px] font-bold rounded-full hover:bg-yellow-300 transition"
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

      {/* Modal */}
      {mostrarModalUsuarios && (
  <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
    <div className="bg-white text-black rounded-lg p-4 max-w-sm w-full shadow-lg relative">
      <h3 className="text-lg font-bold mb-2">Usuarios que publicaron este libro</h3>
      <button
        className="absolute top-2 right-2 text-sm text-gray-500 hover:text-red-500"
        onClick={() => setMostrarModalUsuarios(false)}
      >
        ✕
      </button>
      {usuariosQuePublicaron.length === 0 ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : (
        <ul className="space-y-3 max-h-60 overflow-y-auto">
          {usuariosQuePublicaron.map((u) => (
            <li key={u.id} className="flex items-center gap-3 border-b pb-2">
              <img
                src={u.avatar || "https://via.placeholder.com/32"}
                alt="avatar"
                className="w-8 h-8 rounded-full object-cover"
              />
              <div>
                <strong>{u.nombre || "Usuario"}</strong>
                {u.ciudad && <span className="text-gray-500 text-sm"> ({u.ciudad})</span>}
                {u.id === usuarioActivo?.id && (
                  <span className="ml-2 text-xs text-green-600 font-semibold">Es tu publicación</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
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
