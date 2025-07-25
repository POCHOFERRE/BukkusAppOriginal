import { collection, addDoc } from "firebase/firestore";
import { db } from "../config/firebase";

// Basic chat helper utilities
export const formatMessage = (message) => {
  return {
    ...message,
    timestamp: new Date().toISOString()
  };
};

export const sortMessages = (messages) => {
  return messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

// Function to send a message to Firestore
export const enviarMensaje = async (chatId, mensaje) => {
  try {
    const chatRef = collection(db, "chats", chatId, "mensajes");
    await addDoc(chatRef, mensaje);
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
    throw error;
  }
};
