importScripts("https://www.gstatic.com/firebasejs/10.3.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.3.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyC9QoUe73KtgnSyGra7DAHC--DEshWsfUk",
  authDomain: "bukkus-88608.firebaseapp.com",
  projectId: "bukkus-88608",
  storageBucket: "bukkus-88608.appspot.com",
  messagingSenderId: "203399711426",
  appId: "1:203399711426:web:519f1264016a1271f2c95b",
  measurementId: "G-TE3JCS876H"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] 📥 Recibido en segundo plano:", payload);

  const notificationTitle = payload.notification?.title || "Notificación";
  const notificationOptions = {
    body: payload.notification?.body || "Tenés una nueva actividad en BuKKus",
    icon: "/icon_bukkus_yellow.png",
    badge: "/icon_bukkus_bw.png",
    vibrate: [200, 100, 200],
    // sound: "/sonidos/notificacion.mp3", // ❌ No soportado en Web Push (solo apps nativas)
    actions: [
      {
        action: "ver",
        title: "Ver ahora"
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
