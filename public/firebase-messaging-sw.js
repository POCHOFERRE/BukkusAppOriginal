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

messaging.onBackgroundMessage(function (payload) {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: "/icon_bukkus_bw.png",
  });
});
