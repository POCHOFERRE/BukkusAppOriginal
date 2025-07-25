// src/config/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyC9QoUe73KtgnSyGra7DAHC--DEshWsfUk",
  authDomain: "bukkus-88608.firebaseapp.com",
  projectId: "bukkus-88608",
  storageBucket: "bukkus-88608.appspot.com",
  messagingSenderId: "203399711426",
  appId: "1:203399711426:web:519f1264016a1271f2c95b",
  measurementId: "G-TE3JCS876H"
};

const app = initializeApp(firebaseConfig);

// Servicios
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const messaging = getMessaging(app);

// 🔔 Funciones de notificación
const pedirPermisoNotificaciones = async () => {
  try {
    const token = await getToken(messaging, {
      vapidKey: "BOv93G7NS4nbtcMuFmSKzKHhM9fMtU9ns1nYiuL2FcvumGhGcbchMcvGGrr21oA48LFGmsTXpO1XipF9jqBRFAw", // ⚠️ reemplazá por la tuya
    });
    return token;
  } catch (error) {
    console.error("❌ Error al obtener token FCM:", error);
  }
};

const escucharMensajes = (callback) => {
  onMessage(messaging, (payload) => {
    callback(payload);

    try {
      const audio = new Audio("/sonidos/notificacion.mp3");
      audio.play().catch((err) => {
        console.log("🔇 No se pudo reproducir sonido automáticamente:", err);
      });
    } catch (e) {
      console.error("🎵 Error reproduciendo sonido:", e);
    }
  });
};

export {
  db,
  auth,
  storage,
  messaging,
  pedirPermisoNotificaciones,
  escucharMensajes,
};
