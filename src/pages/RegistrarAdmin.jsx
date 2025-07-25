// src/pages/RegistrarAdmin.jsx
import React, { useState, useContext } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getAuth,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

export default function RegistrarAdmin() {
  const [modoRegistro, setModoRegistro] = useState(true);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [claveAdmin, setClaveAdmin] = useState("");
  const { setUsuarioActivo } = useContext(UserContext);
  const navigate = useNavigate();

  const toggleModo = () => {
    setModoRegistro((prev) => !prev);
    setNombre("");
    setEmail("");
    setPassword("");
    setClaveAdmin("");
  };

  const handleRegistro = async () => {
    if (!nombre || !email || !password || !claveAdmin) {
      alert("Todos los campos son obligatorios.");
      return;
    }

    if (claveAdmin !== "BUKKUS2025") {
      alert("Clave secreta incorrecta ❌");
      return;
    }

    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userData = {
        id: user.uid,
        nombre,
        email,
        rol: "admin",
        creado: new Date().toISOString(),
      };

      await setDoc(doc(db, "usuarios", user.uid), userData);
      setUsuarioActivo(userData);
      localStorage.setItem("usuarioActivo", JSON.stringify(userData));

      console.log("Admin registrado:", userData);
      navigate("/admin");
    } catch (error) {
      alert("Error al registrar el admin.");
      console.error("🔥 Error:", error);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Ingresá email y contraseña.");
      return;
    }

    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const docSnap = await getDoc(doc(db, "usuarios", user.uid));
      if (!docSnap.exists()) {
        alert("No existe ese usuario.");
        return;
      }

      const data = docSnap.data();

      if (data.rol !== "admin") {
        alert("No tenés permisos de administrador ❌");
        return;
      }

      const userData = { id: user.uid, email: user.email, ...data };
      setUsuarioActivo(userData);
      localStorage.setItem("usuarioActivo", JSON.stringify(userData));

      navigate("/admin");
    } catch (error) {
      alert("Error al iniciar sesión. Verificá tus datos.");
      console.error("🧨 Error login:", error);
    }
  };

  return (
    <div className="p-6 max-w-sm mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-yellow-600">
        {modoRegistro ? "Registrar Admin" : "Iniciar Sesión Admin"}
      </h2>

      {modoRegistro && (
        <input
          type="text"
          placeholder="Nombre completo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="border p-2 w-full mb-2"
        />
      )}

      <input
        type="email"
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 w-full mb-2"
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 w-full mb-2"
      />

      {modoRegistro && (
        <input
          type="password"
          placeholder="Clave secreta de admin"
          value={claveAdmin}
          onChange={(e) => setClaveAdmin(e.target.value)}
          className="border p-2 w-full mb-4"
        />
      )}

      <button
        onClick={modoRegistro ? handleRegistro : handleLogin}
        className="bg-yellow-400 px-4 py-2 w-full rounded hover:bg-yellow-500 transition mb-2"
      >
        {modoRegistro ? "Crear administrador" : "Ingresar"}
      </button>

      <p className="text-center text-sm text-gray-500">
        {modoRegistro ? "¿Ya tenés cuenta?" : "¿No tenés cuenta?"}{" "}
        <button onClick={toggleModo} className="text-yellow-600 underline ml-1">
          {modoRegistro ? "Iniciar sesión" : "Registrarme"}
        </button>
      </p>
    </div>
  );
}
