import React, { useState, useEffect, useContext, useRef } from "react";
import { db } from "../config/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { UserContext } from "../context/UserContext";
import {
  FiMessageSquare,
  FiX,
  FiMinus,
  FiArrowLeft,
  FiSend,
  FiTrash,
  FiCheck,
} from "react-icons/fi";

export default function FloatingChat() {
  const { usuarioActivo, chatActivo, setChatActivo } = useContext(UserContext);
  const [chats, setChats] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [minimizado, setMinimizado] = useState(false);
  const chatRef = useRef(null);
  const isChatPage = window.location.pathname.includes("/chat/");
  

  useEffect(() => {
    if (!usuarioActivo?.id) return;
    const q = query(collection(db, "chats"), where("participantes", "array-contains", usuarioActivo.id));
    const unsub = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        setChats([]);
        return;
      }

      const chatsData = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const otroId = data.participantes?.find((id) => id !== usuarioActivo.id);
          let otroUsuario = { nombre: "Usuario" };
          if (otroId) {
            const userSnap = await getDoc(doc(db, "usuarios", otroId));
            if (userSnap.exists()) {
              otroUsuario = userSnap.data();
            }
          }
          return {
            id: docSnap.id,
            ...data,
            otroUsuario,
            preview: data.ultimoMensaje || "",
          };
        })
      );

      setChats(chatsData);
    });

    return () => unsub();
  }, [usuarioActivo?.id]);

  useEffect(() => {
    if (!chatActivo || isChatPage) return;
    const unsub = onSnapshot(collection(db, "chats", chatActivo, "mensajes"), (snapshot) => {
      const msjs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMensajes(msjs);
      setTimeout(() => chatRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsub();
  }, [chatActivo, isChatPage]);

  const openChat = (id) => {
    setChatActivo(id);
    setMinimizado(false);
  };

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim() || isChatPage) return;
    const mensaje = {
      de: usuarioActivo.id,
      texto: nuevoMensaje,
      timestamp: Timestamp.now(),
      tipo: "usuario",
    };
    await addDoc(collection(db, "chats", chatActivo, "mensajes"), mensaje);
    await updateDoc(doc(db, "chats", chatActivo), {
      ultimoMensaje: nuevoMensaje,
      timestampUltimo: mensaje.timestamp,
    });
    setNuevoMensaje("");
  };

  const eliminarChat = async (chatId) => {
    if (window.confirm("¿Eliminar este chat?")) {
      await deleteDoc(doc(db, "chats", chatId));
      if (chatId === chatActivo) setChatActivo(null);
    }
  };

  const toggleFloating = () => {
    if (chatActivo) {
      setChatActivo(null);
    } else {
      setMinimizado((prev) => !prev);
    }
  };

  if (isChatPage) return null;

  return (
    <>
      {/* Floating en desktop */}
      <div className="fixed bottom-4 right-4 z-50 hidden md:flex flex-col items-end gap-2">
        {/* Botón flotante */}
        <button
          onClick={toggleFloating}
          className="bg-[#f7b22a] p-3 rounded-full shadow-lg text-black z-50"
        >
          <FiMessageSquare size={22} />
        </button>
  
        {/* Lista de chats en desktop */}
        {!chatActivo && !minimizado && (
          <div className="bg-white rounded shadow-md w-72 max-h-80 overflow-y-auto z-40">
            {chats.length === 0 ? (
              <p className="text-sm text-center text-gray-500 py-4">No hay chats aún.</p>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  className="flex flex-col px-3 py-2 hover:bg-gray-100 border-b cursor-pointer"
                  onClick={() => openChat(chat.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2 items-center">
                      <FiMessageSquare className="text-gray-500" />
                      <p className="font-semibold text-sm">{chat.otroUsuario?.nombre || "Usuario"}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        eliminarChat(chat.id);
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <FiTrash size={16} />
                    </button>
                  </div>
                  {chat.preview && (
                    <p className="text-xs text-gray-500 pl-6 truncate">{chat.preview}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
  
        {/* Ventana de chat en desktop */}
        {chatActivo && !minimizado && (
          <div className="bg-white shadow-xl w-80 h-[460px] rounded-xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center bg-[#f7b22a] p-2 text-black">
              <div className="flex items-center gap-2">
                <button onClick={() => setChatActivo(null)}><FiArrowLeft /></button>
                <span className="text-sm font-semibold">Chat</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setMinimizado(true)}><FiMinus /></button>
                <button onClick={() => setChatActivo(null)}><FiX /></button>
              </div>
            </div>
  
            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto px-2 py-1 flex flex-col">
              {[...mensajes]
                .sort((a, b) => a.timestamp?.seconds - b.timestamp?.seconds)
                .map((msg, i) => (
                  <div
                    key={i}
                    className={`text-sm mb-1 p-2 rounded-lg max-w-[70%] relative ${
                      msg.de === usuarioActivo.id
                        ? "ml-auto bg-yellow-100 text-right"
                        : "mr-auto bg-gray-100 text-left"
                    }`}
                  >
                    {msg.texto}
                    <div className="text-[10px] text-gray-500 mt-1 flex items-center justify-end gap-1">
                      {msg.timestamp?.toDate().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {msg.de === usuarioActivo.id && (
                        <FiCheck className="text-xs text-green-600" />
                      )}
                    </div>
                  </div>
                ))}
              <div ref={chatRef} />
            </div>
  
            {/* Input */}
            <div className="flex items-center gap-2 p-2 border-t bg-white">
              <input
                type="text"
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
                placeholder="Escribí tu mensaje..."
                className="flex-1 border rounded-full px-4 py-1 text-sm"
                onKeyDown={(e) => e.key === "Enter" && enviarMensaje()}
              />
              <button onClick={enviarMensaje} className="bg-[#f7b22a] p-2 rounded-full text-black">
                <FiSend />
              </button>
            </div>
          </div>
        )}
      </div>
  
      {/* Pantalla completa en mobile */}
      {!isChatPage && chatActivo && (
        <div className="fixed inset-0 z-50 flex flex-col md:hidden bg-white">
          <div className="flex justify-between items-center bg-[#f7b22a] p-3 text-black">
            <div className="flex items-center gap-2">
              <button onClick={() => setChatActivo(null)}><FiArrowLeft /></button>
              <span className="text-sm font-semibold">Chat</span>
            </div>
            <button onClick={() => setChatActivo(null)}><FiX /></button>
          </div>
  
          <div className="flex-1 overflow-y-auto px-2 py-1 flex flex-col">
            {[...mensajes]
              .sort((a, b) => a.timestamp?.seconds - b.timestamp?.seconds)
              .map((msg, i) => (
                <div
                  key={i}
                  className={`text-sm mb-1 p-2 rounded-lg max-w-[80%] ${
                    msg.de === usuarioActivo.id
                      ? "ml-auto bg-yellow-100 text-right"
                      : "mr-auto bg-gray-100 text-left"
                  }`}
                >
                  {msg.texto}
                  <div className="text-[10px] text-gray-500 mt-1 flex items-center justify-end gap-1">
                    {msg.timestamp?.toDate().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {msg.de === usuarioActivo.id && (
                      <FiCheck className="text-xs text-green-600" />
                    )}
                  </div>
                </div>
              ))}
            <div ref={chatRef} />
          </div>
  
          <div className="flex items-center gap-2 p-2 border-t bg-white">
            <input
              type="text"
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              placeholder="Escribí tu mensaje..."
              className="flex-1 border rounded-full px-4 py-2 text-sm"
              onKeyDown={(e) => e.key === "Enter" && enviarMensaje()}
            />
            <button onClick={enviarMensaje} className="bg-[#f7b22a] p-2 rounded-full text-black">
              <FiSend />
            </button>
          </div>
        </div>
      )}
    </>
  );
  
  
}
