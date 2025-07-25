import { db } from "../config/firebase";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
} from "firebase/firestore";

/**
 * Crea un chat vacío si no existe.
 * @param {string} chatId - ID único (ej: `${de}-${para}-${libroId}`)
 * @param {Array} participantes - array de IDs (de, para)
 */
export const crearChatSiNoExiste = async (chatId, participantes) => {
  const ref = doc(db, "chats", chatId);
  const existe = await getDoc(ref);

  if (!existe.exists()) {
    await setDoc(ref, {
      participantes,
      creado: new Date().toISOString(),
    });
  }
};

/**
 * Envía un mensaje a un chat.
 * @param {string} chatId - ID del chat
 * @param {object} mensajeData - objeto con { de, texto, imagen, timestamp }
 */
export const enviarMensaje = async (chatId, mensajeData) => {
  const ref = collection(db, "chats", chatId, "mensajes");
  await addDoc(ref, {
    ...mensajeData,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Obtiene todos los mensajes de un chat ordenados por fecha
 * @param {string} chatId
 * @returns {Array} mensajes
 */
export const obtenerMensajes = async (chatId) => {
  const ref = collection(db, "chats", chatId, "mensajes");
  const q = query(ref, orderBy("timestamp", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};
