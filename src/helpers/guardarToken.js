// src/helpers/guardarToken.js
import { doc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";

export const guardarToken = async (uid, token) => {
  try {
    await setDoc(doc(db, "tokens", uid), { token });
    console.log("📦 Token guardado en Firestore");
  } catch (error) {
    console.error("❌ Error al guardar token:", error);
  }
};
