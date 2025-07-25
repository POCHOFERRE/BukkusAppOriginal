// Código actualizado con alias desde Firebase y modal estilo BuKKus
import React, { useContext, useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
  addDoc,
  getDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { UserContext } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaTrash,
  FaShareAlt,
  FaWhatsapp,
  FaPaperPlane,
  FaClone,
  FaThLarge,
  FaList,
} from "react-icons/fa";
import PropTypes from "prop-types";
import CardLibro from "../libro/CardLibro";
import EditarLibro from "../EditarLibro";
import BuoSinLibros from "../svgs/BuoSinLibros";
import Modal from "../Modal";

export default function MisLibros() {
  const { usuarioActivo } = useContext(UserContext);
  const [libros, setLibros] = useState([]);
  const [librosPorGenero, setLibrosPorGenero] = useState({});
  const [libroEditando, setLibroEditando] = useState(null);
  const [libroAEliminar, setLibroAEliminar] = useState(null);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [vistaGaleria, setVistaGaleria] = useState(() => localStorage.getItem("vistaMisLibros") === "galeria");
  const [modalAlias, setModalAlias] = useState({ abierto: false, libroId: null });
  const [aliasDestino, setAliasDestino] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!usuarioActivo?.id) return;

    const q = query(collection(db, "libros"), where("usuarioId", "==", usuarioActivo.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const datos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setLibros(datos);
      const agrupado = {};
      datos.forEach((libro) => {
        const genero = libro.genero || "Sin género";
        if (!agrupado[genero]) agrupado[genero] = [];
        agrupado[genero].push(libro);
      });
      setLibrosPorGenero(agrupado);
    });

    return () => unsubscribe();
  }, [usuarioActivo]);

  const eliminarLibro = (libro) => {
    setLibroAEliminar(libro);
    setConfirmandoEliminar(true);
  };

  const confirmarEliminar = async () => {
    try {
      await deleteDoc(doc(db, "libros", libroAEliminar.id));
      toast.success("Libro eliminado");
    } catch (e) {
      console.error(e);
      toast.error("Error al eliminar");
    } finally {
      setConfirmandoEliminar(false);
      setLibroAEliminar(null);
    }
  };

  const copiarLink = (libroId) => {
    const url = `${window.location.origin}/libro/${libroId}`;
    navigator.clipboard.writeText(url);
    toast.info("Enlace copiado 📎");
  };

  const compartirWhatsApp = (libroId) => {
    const url = `${window.location.origin}/libro/${libroId}`;
    const mensaje = `¡Mirá este libro que publiqué en BuKKus! 👉 ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, "_blank");
  };

  const enviarAUsuario = (libroId) => {
    setModalAlias({ abierto: true, libroId });
  };

  const confirmarEnvio = async () => {
    if (!aliasDestino) return;
    const usuarioRef = doc(db, "usuarios", aliasDestino);
    const usuarioSnap = await getDoc(usuarioRef);
    if (!usuarioSnap.exists()) {
      toast.error("Alias no encontrado");
      return;
    }
    const otroUsuarioId = usuarioSnap.data().id;
    const chatId = [usuarioActivo.id, otroUsuarioId, modalAlias.libroId].sort().join("_");
    const chatRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        participantes: [usuarioActivo.id, otroUsuarioId],
        libroId: modalAlias.libroId,
        creadoEn: Timestamp.now(),
        mensajes: [],
      });
    }

    setModalAlias({ abierto: false, libroId: null });
    setAliasDestino("");
    navigate(`/chat/${chatId}`);
  };

  const duplicarLibro = async (libro) => {
    try {
      const libroDuplicado = { ...libro, creadoEn: Timestamp.now(), vendido: false, bloqueado: false, usuarioId: usuarioActivo.id, creadorId: usuarioActivo.id };
      delete libroDuplicado.id;
      await addDoc(collection(db, "libros"), libroDuplicado);
      toast.success("Libro duplicado ✨");
    } catch (error) {
      console.error("Error al duplicar libro:", error);
      toast.error("No se pudo duplicar");
    }
  };

  if (libroEditando) return <EditarLibro libro={libroEditando} onClose={() => setLibroEditando(null)} />;

  if (libros.length === 0) return (<div className="text-center mt-10 text-gray-500"><BuoSinLibros size={140} /></div>);

  return (
    <div className="pt-[calc(var(--top-nav-height,3.5rem)+1rem)] pb-20">
      <div className="flex justify-between items-center px-4 mb-4">
        <h1 className="text-xl font-bold">Mis Libros</h1>
        <button onClick={() => { const nuevaVista = !vistaGaleria; setVistaGaleria(nuevaVista); localStorage.setItem("vistaMisLibros", nuevaVista ? "galeria" : "genero"); }} className="bg-[#f7b22a] text-white px-3 py-1 rounded-full flex items-center gap-2">
          {vistaGaleria ? <FaList /> : <FaThLarge />} {vistaGaleria ? "Ver por género" : "Ver como galería"}
        </button>
      </div>
      {vistaGaleria ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 px-4">
          {libros.map((libro) => (
            <div key={libro.id} className="relative">
              <CardLibro libro={libro} usuarioActivo={usuarioActivo} esMio onEditar={() => setLibroEditando(libro)} />
              <div className="absolute top-2 right-2 space-y-1 z-20 flex flex-col items-end">
                <Botones libro={libro} eliminarLibro={eliminarLibro} copiarLink={copiarLink} compartirWhatsApp={compartirWhatsApp} enviarAUsuario={enviarAUsuario} duplicarLibro={duplicarLibro} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        Object.entries(librosPorGenero).map(([genero, librosGenero]) => (
          <div key={genero} className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 px-4 mb-2">{genero}</h2>
            <div className="flex overflow-x-auto no-scrollbar space-x-4 px-4">

              {librosGenero.map((libro) => (
                <div key={libro.id} className="relative flex-shrink-0 w-[220px]">
                  <CardLibro libro={libro} usuarioActivo={usuarioActivo} esMio onEditar={() => setLibroEditando(libro)} />
                  <div className="absolute top-2 right-2 space-y-1 z-20 flex flex-col items-end">
                    <Botones libro={libro} eliminarLibro={eliminarLibro} copiarLink={copiarLink} compartirWhatsApp={compartirWhatsApp} enviarAUsuario={enviarAUsuario} duplicarLibro={duplicarLibro} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {confirmandoEliminar && libroAEliminar && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
            <h2 className="text-lg font-semibold text-center text-gray-800 mb-4">¿Eliminar este libro?</h2>
            <p className="text-sm text-center text-gray-500 mb-6">Esta acción no se puede deshacer. Se eliminará la publicación: <strong>{libroAEliminar.nombre || "Sin título"}</strong>.</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => { setConfirmandoEliminar(false); setLibroAEliminar(null); }} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm hover:bg-gray-300 transition">Cancelar</button>
              <button onClick={confirmarEliminar} className="bg-red-600 text-white px-4 py-2 rounded-full text-sm hover:bg-red-700 transition">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {modalAlias.abierto && (
        <Modal isOpen onClose={() => setModalAlias({ abierto: false, libroId: null })}>
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Enviar libro a otro usuario</h2>
            <input value={aliasDestino} onChange={(e) => setAliasDestino(e.target.value)} placeholder="Alias del usuario (sin @)" className="w-full border p-2 rounded mb-4" />
            <button onClick={confirmarEnvio} className="bg-[#f7b22a] text-white px-4 py-2 rounded-full w-full">Enviar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Botones({ libro, eliminarLibro, copiarLink, compartirWhatsApp, enviarAUsuario, duplicarLibro }) {
  return (
    <>
      <button onClick={() => eliminarLibro(libro)} className="bg-white text-red-600 p-1 rounded-full border border-red-500 hover:bg-red-100 shadow" title="Eliminar">
        <FaTrash size={16} />
      </button>
      <button onClick={() => copiarLink(libro.id)} className="bg-white text-blue-600 p-1 rounded-full border border-blue-500 hover:bg-blue-100 shadow" title="Copiar enlace">
        <FaShareAlt size={16} />
      </button>
      <button onClick={() => compartirWhatsApp(libro.id)} className="bg-white text-green-600 p-1 rounded-full border border-green-500 hover:bg-green-100 shadow" title="WhatsApp">
        <FaWhatsapp size={16} />
      </button>
      <button onClick={() => enviarAUsuario(libro.id)} className="bg-white text-purple-600 p-1 rounded-full border border-purple-500 hover:bg-purple-100 shadow" title="Enviar a otro usuario">
        <FaPaperPlane size={16} />
      </button>
      <button onClick={() => duplicarLibro(libro)} className="bg-white text-gray-600 p-1 rounded-full border border-gray-400 hover:bg-gray-100 shadow" title="Duplicar publicación">
        <FaClone size={16} />
      </button>
    </>
  );
}

Botones.propTypes = {
  libro: PropTypes.object.isRequired,
  eliminarLibro: PropTypes.func.isRequired,
  copiarLink: PropTypes.func.isRequired,
  compartirWhatsApp: PropTypes.func.isRequired,
  enviarAUsuario: PropTypes.func.isRequired,
  duplicarLibro: PropTypes.func.isRequired,
};
