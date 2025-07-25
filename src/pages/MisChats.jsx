import React, { useContext, useEffect, useState } from "react";
import { db } from "../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { UserContext } from "../context/UserContext";
import { Link } from "react-router-dom";
import { FiMessageCircle, FiTrash } from "react-icons/fi";
import { ChatContext } from "../context/ChatContext";

export default function MisChats() {
  const { usuarioActivo } = useContext(UserContext);
  const [chats, setChats] = useState([]);
  const [pagina, setPagina] = useState(1);
  const porPagina = 10;
  const { noLeidosPorChat } = useContext(ChatContext);

  useEffect(() => {
    const obtenerChats = async () => {
      if (!usuarioActivo?.id) return;

      try {
        const q = query(
          collection(db, "chats"),
          where("participantes", "array-contains", usuarioActivo.id)
        );

        const snapshot = await getDocs(q);
        const resultados = [];

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const otroId = data.participantes.find((id) => id !== usuarioActivo.id);

          let otroUsuario = {};
          if (otroId) {
            const userSnap = await getDoc(doc(db, "usuarios", otroId));
            if (userSnap.exists()) otroUsuario = userSnap.data();
          }

          resultados.push({
            id: docSnap.id,
            nombre: otroUsuario.nombre || "Usuario",
            avatar: otroUsuario.avatar || "/default-avatar.png",
            libroId: data.libroId || "",
            creado: data.creado?.toDate() || null,
          });
        }

        resultados.sort((a, b) => b.creado - a.creado);
        setChats(resultados);
      } catch (error) {
        console.error("Error al obtener chats:", error);
      }
    };

    obtenerChats();
  }, [usuarioActivo?.id]);

  const handleEliminarChat = async (chatId) => {
    const confirmar = window.confirm("¿Eliminar esta conversación?");
    if (!confirmar) return;

    try {
      // 1. Eliminar todos los mensajes del chat
      const mensajesRef = collection(db, "chats", chatId, "mensajes");
      const mensajesSnap = await getDocs(mensajesRef);
      const deletePromises = mensajesSnap.docs.map((docSnap) =>
        deleteDoc(docSnap.ref)
      );
      await Promise.all(deletePromises);

      // 2. Eliminar el documento del chat
      await deleteDoc(doc(db, "chats", chatId));

      // 3. Actualizar estado
      setChats((prev) => prev.filter((c) => c.id !== chatId));
    } catch (err) {
      console.error("Error al eliminar chat y mensajes:", err);
    }
  };

  const totalPaginas = Math.ceil(chats.length / porPagina);
  const chatsPagina = chats.slice((pagina - 1) * porPagina, pagina * porPagina);

  return (
    <div className="max-w-3xl mx-auto p-4 bg-[#fdf6ec] min-h-screen">
      <h1 className="text-xl font-bold mb-6 text-[#111] flex items-center gap-2">
        <FiMessageCircle className="text-[#f7b22a]" />
        Mis conversaciones
      </h1>

      {chats.length === 0 ? (
        <p className="text-gray-500">No tenés chats todavía.</p>
      ) : (
        <>
          <ul className="space-y-4">
            {chatsPagina.map((chat) => (
              <li key={chat.id} className="relative group">
                <Link
                  to={`/chat/${chat.id}`}
                  className="flex items-center gap-4 bg-white border border-gray-200 hover:border-[#f7b22a] shadow-sm p-3 rounded-xl transition relative"
                >
                  <img
                    src={chat.avatar}
                    alt={chat.nombre}
                    className="w-12 h-12 rounded-full object-cover border border-gray-300"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-[#111] text-base">{chat.nombre}</p>
                    {chat.creado ? (
                      <p className="text-sm text-gray-500">
                        Último mensaje: {chat.creado.toLocaleDateString()}{" "}
                        {chat.creado.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">Sin fecha registrada</p>
                    )}
                  </div>

                  {noLeidosPorChat[chat.id] > 0 && (
                    <span className="absolute top-2 right-3 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                      {noLeidosPorChat[chat.id]}
                    </span>
                  )}
                </Link>

                <button
                  onClick={() => handleEliminarChat(chat.id)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-600 p-1"
                  title="Eliminar chat"
                >
                  <FiTrash />
                </button>
              </li>
            ))}
          </ul>

          {totalPaginas > 1 && (
            <div className="flex justify-center mt-6 gap-2">
              {Array.from({ length: totalPaginas }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPagina(i + 1)}
                  className={`px-3 py-1 rounded-full text-sm font-semibold border ${
                    pagina === i + 1
                      ? "bg-[#f7b22a] text-black border-[#f7b22a]"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
