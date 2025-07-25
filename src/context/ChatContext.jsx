// src/context/ChatContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { db } from "../config/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { UserContext } from "./UserContext";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { usuarioActivo } = useContext(UserContext);
  const [totalNoLeidos, setTotalNoLeidos] = useState(0);
  const [noLeidosPorChat, setNoLeidosPorChat] = useState({});

  useEffect(() => {
    if (!usuarioActivo?.id) return;

    const q = query(
      collection(db, "chats"),
      where("participantes", "array-contains", usuarioActivo.id)
    );

    const unsubscribeChats = onSnapshot(q, (chatSnapshot) => {
      const chatIds = chatSnapshot.docs.map((doc) => doc.id);

      const unsubListeners = [];

      chatIds.forEach((chatId) => {
        const mensajesRef = collection(db, `chats/${chatId}/mensajes`);

        const unsubMensajes = onSnapshot(mensajesRef, (mensajesSnapshot) => {
          setNoLeidosPorChat((prev) => {
            const noLeidos = mensajesSnapshot.docs.filter(
              (doc) =>
                doc.data().de !== usuarioActivo.id &&
                !doc.data().leidoPor?.includes(usuarioActivo.id)
            ).length;

            const actualizados = { ...prev, [chatId]: noLeidos };

            const nuevoTotal = Object.values(actualizados).reduce(
              (acc, val) => acc + val,
              0
            );

            setTotalNoLeidos(nuevoTotal);
            return actualizados;
          });
        });

        unsubListeners.push(unsubMensajes);
      });

      // Cleanup
      return () => unsubListeners.forEach((unsub) => unsub());
    });

    return () => unsubscribeChats();
  }, [usuarioActivo?.id]);

  return (
    <ChatContext.Provider value={{ totalNoLeidos, noLeidosPorChat }}>
      {children}
    </ChatContext.Provider>
  );
};

import PropTypes from "prop-types";

ChatProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
