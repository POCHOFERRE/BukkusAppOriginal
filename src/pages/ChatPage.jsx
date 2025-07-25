import React, { useContext, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../config/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  Timestamp,
  setDoc,
} from "firebase/firestore";
import { UserContext } from "../context/UserContext";
import { FiImage, FiSend, FiX } from "react-icons/fi";

export default function ChatPage() {
  const { chatId } = useParams();
  const { usuarioActivo } = useContext(UserContext);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [destinatario, setDestinatario] = useState(null);
  const [imagen, setImagen] = useState(null);
  const [escribiendo, setEscribiendo] = useState(false);
  const chatRef = useRef(null);

  // Traer mensajes
  useEffect(() => {
    if (!chatId || !usuarioActivo?.id) return;

    const q = query(collection(db, `chats/${chatId}/mensajes`), orderBy("timestamp", "asc"));
    const unsub = onSnapshot(q, async (snapshot) => {
      const nuevos = [];
      const actualizaciones = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        nuevos.push({ id: docSnap.id, ...data });

        if (data.de !== usuarioActivo.id && !(data.leidoPor || []).includes(usuarioActivo.id)) {
          const mensajeRef = doc(db, `chats/${chatId}/mensajes/${docSnap.id}`);
          actualizaciones.push(
            updateDoc(mensajeRef, {
              leidoPor: arrayUnion(usuarioActivo.id),
            })
          );
        }
      });

      setMensajes(nuevos);

      if (actualizaciones.length > 0) await Promise.all(actualizaciones);

      setTimeout(() => {
        chatRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    });

    return () => unsub();
  }, [chatId, usuarioActivo?.id]);

  // Verificar estado de la oferta y cargar destinatario
  useEffect(() => {
    const verificarYcargar = async () => {
      try {
        // Verificar si la oferta está aceptada
        const ofertaSnap = await getDoc(doc(db, "ofertas", chatId));
        if (ofertaSnap.exists()) {
          const ofertaData = ofertaSnap.data();
          if (ofertaData.estado !== "aceptada") {
            // Redirigir si la oferta no está aceptada
            alert("Esta oferta aún no ha sido aceptada");
            window.location.href = "/ofertas";
            return;
          }
        }

        // Cargar datos del chat y destinatario
        const chatSnap = await getDoc(doc(db, "chats", chatId));
        const data = chatSnap.data();
        if (!data?.participantes) {
          alert("Chat no encontrado");
          window.location.href = "/ofertas";
          return;
        }

        // Verificar que el usuario actual sea participante del chat
        if (!data.participantes.includes(usuarioActivo.id)) {
          alert("No tienes permiso para acceder a este chat");
          window.location.href = "/ofertas";
          return;
        }

        const otroId = data.participantes.find((id) => id !== usuarioActivo.id);
        const userSnap = await getDoc(doc(db, "usuarios", otroId));
        if (userSnap.exists()) setDestinatario(userSnap.data());
      } catch (error) {
        console.error("Error al cargar el chat:", error);
        alert("Error al cargar el chat");
        window.location.href = "/ofertas";
      }
    };

    if (chatId && usuarioActivo?.id) {
      verificarYcargar();
    }
  }, [chatId, usuarioActivo?.id]);

  // Estado "escribiendo..."
  useEffect(() => {
    const escribiendoRef = doc(db, "chats", chatId, "status", "escribiendo");
    const unsub = onSnapshot(escribiendoRef, (snap) => {
      const data = snap.data();
      if (data?.id !== usuarioActivo.id) {
        setEscribiendo(data?.activo || false);
      }
    });
    return () => unsub();
  }, [chatId, usuarioActivo?.id]);

  useEffect(() => {
    const escribiendoRef = doc(db, "chats", chatId, "status", "escribiendo");
    const delay = setTimeout(() => {
      setDoc(
        escribiendoRef,
        { id: usuarioActivo.id, activo: !!nuevoMensaje },
        { merge: true }
      );
    }, 300);
    return () => clearTimeout(delay);
  }, [nuevoMensaje, chatId, usuarioActivo.id]);

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim() && !imagen) return;
    await addDoc(collection(db, "chats", chatId, "mensajes"), {
      de: usuarioActivo.id,
      texto: nuevoMensaje,
      imagen,
      timestamp: Timestamp.now(),
      tipo: "usuario",
    });
    setNuevoMensaje("");
    setImagen(null);
  };

  const handleImagen = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImagen(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full h-screen bg-[#fdf6ec] flex justify-center overflow-hidden">
      <div className="flex flex-col w-full h-full sm:max-w-[600px] sm:h-[90vh] sm:mt-4 sm:rounded-xl sm:shadow-lg relative bg-[#fdf6ec]">

        {/* HEADER FIXED */}
        <div className="bg-black text-white px-4 py-3 flex items-center gap-3 shadow-md z-20 sticky top-0">
          {destinatario?.avatar && (
            <img
              src={destinatario.avatar}
              alt="avatar"
              className="w-9 h-9 rounded-full border border-white object-cover"
            />
          )}
          <div className="flex flex-col truncate">
            <span className="font-semibold text-base text-[#f7b22a] truncate">
              {destinatario?.nombre || "Usuario"}
            </span>
            {escribiendo && (
              <span className="text-xs text-gray-400 animate-pulse">escribiendo...</span>
            )}
          </div>
        </div>

        {/* MENSAJES SCROLLABLE */}
        <div className="flex-1 overflow-y-auto px-4 pt-3 pb-2 space-y-2 scroll-smooth">
          {mensajes.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-[80%] px-3 py-2 rounded-xl text-sm shadow-sm ${
                msg.de === usuarioActivo.id
                  ? "ml-auto bg-[#f7b22a] text-black"
                  : "mr-auto bg-white text-[#111]"
              }`}
            >
              {msg.imagen && (
                <img src={msg.imagen} alt="Imagen" className="max-h-48 rounded mb-1" />
              )}
              {msg.texto && <p>{msg.texto}</p>}
              <p className="text-[10px] text-right text-gray-500 mt-1">
                {msg.timestamp?.toDate().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))}
          <div ref={chatRef} />
        </div>

        {/* INPUT */}
        <div className="bg-white px-3 py-2 border-t border-gray-300">
          {imagen && (
            <div className="relative w-full max-w-xs mx-auto mb-2">
              <img src={imagen} alt="preview" className="rounded max-h-40" />
              <button
                onClick={() => setImagen(null)}
                className="absolute top-1 right-1 bg-white p-1 rounded-full shadow text-red-600"
              >
                <FiX />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              placeholder="Escribí un mensaje..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none"
            />
            <label className="cursor-pointer text-gray-600 hover:text-gray-800">
              <FiImage className="text-xl" />
              <input type="file" accept="image/*" onChange={handleImagen} className="hidden" />
            </label>
            <button
              onClick={enviarMensaje}
              className="bg-[#f7b22a] text-black rounded-full p-2 hover:bg-yellow-400"
            >
              <FiSend />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
