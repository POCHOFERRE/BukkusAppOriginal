/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.7.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.2/firebase-messaging-compat.js");

// 🔹 Configuración Firebase BuKKus
const firebaseConfig = {
  apiKey: "AIzaSyC9QoUe73KtgnSyGra7DAHC--DEshWsfUk",
  authDomain: "bukkus-88608.firebaseapp.com",
  projectId: "bukkus-88608",
  storageBucket: "bukkus-88608.appspot.com",
  messagingSenderId: "203399711426",
  appId: "1:203399711426:web:519f1264016a1271f2c95b",
};

// 🔹 Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// 🔹 Inicializar Messaging
const messaging = firebase.messaging();

// ================================
// 📌 Mensaje en segundo plano
// ================================
messaging.onBackgroundMessage((payload) => {
  console.log('[BuKKus Messaging] 📩 Mensaje en segundo plano', payload);

  const fromUser = payload.data?.from || "Nuevo usuario";
  const book = payload.data?.book || "Libro pendiente";
  const preview = `📚 ${fromUser} quiere intercambiar por "${book}"`;

  const notificationTitle = '📩 Nueva oferta en BuKKus';
  const notificationOptions = {
    body: preview,
    icon: payload.notification?.icon || '/icon_bukkus_yellow.png',
    badge: '/icon_bukkus_yellow.png',
    vibrate: [300, 100, 300],
    tag: 'bukkus-offer',
    renotify: true,
    requireInteraction: true,
    data: {
      url: '/ofertas',
      fromUser,
      book
    },
    actions: [
      { action: 'view-offers', title: '📂 Ver ofertas' },
      { action: 'dismiss', title: '❌ Cerrar' }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 📌 Click notificación
self.addEventListener('notificationclick', (event) => {
  console.log('[BuKKus SW] Notificación clickeada', event);
  event.notification.close();

  if (event.action === 'view-offers' || event.action === '') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes('/ofertas') && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/ofertas');
        }
      })
    );
  }
});
