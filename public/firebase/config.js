import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyC9QoUe73KtgnSyGra7DAHC--DEshWsfUk",
  authDomain: "bukkus-88608.firebaseapp.com",
  projectId: "bukkus-88608",
  storageBucket: "bukkus-88608.appspot.com",
  messagingSenderId: "203399711426",
  appId: "1:203399711426:web:519f1264016a1271f2c95b",
};

export const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);
