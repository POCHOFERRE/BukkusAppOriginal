import React from "react";
import ReactDOM from "react-dom/client";

// Estilos globales
import "./index.css";
import "react-toastify/dist/ReactToastify.css";

// App principal
import App from "./App";

// 🔥 Registro manual del Service Worker de Firebase
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/firebase-messaging-sw.js")
    .then((registration) => {
      console.log("✅ Service Worker de FCM registrado correctamente:", registration);
    })
    .catch((err) => {
      console.error("❌ Error registrando el Service Worker de FCM:", err);
    });
}

// Render de la app
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
