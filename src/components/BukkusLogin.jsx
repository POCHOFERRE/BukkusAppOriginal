// JSX actualizado de LoginBukKus.jsx con soporte para gustos literarios, zona y apellido visibles en el perfil

import React, { useState } from "react";
import PropTypes from "prop-types";
import Confetti from "react-confetti";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../config/firebase";
import { setDoc, doc } from "firebase/firestore";
import { db } from "../config/firebase";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaMapMarkerAlt,
  FaBookOpen,
  FaGoogle,
} from "react-icons/fa";
import useWindowSize from "../hooks/useWindowSize";
import LogoBukKus from "./LogoBukkus";

export default function LoginBukKus({ onClose, loading }) {
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [zona, setZona] = useState("");
  const [gustoLiterario, setGustoLiterario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [registro, setRegistro] = useState(false);
  const [mostrarBienvenida, setMostrarBienvenida] = useState(false);

  const windowSize = useWindowSize();

  const zonasPermitidas = [
    "Villa Carlos Paz",
    "Villa del Lago",
    "Icho Cruz",
    "San Antonio de Arredondo",
    "Mayu Sumaj",
    "Cuesta Blanca",
    "Tala Huasi",
    "Villa Independencia",
    "Parque Siquiman",
    "Bialet Massé",
    "Santa María de Punilla",
    "Cosquín",
    "Molinari",
    "Casa Grande",
    "Valle Hermoso",
    "La Falda",
    "Huerta Grande",
    "Villa Giardino",
    "Capilla del Monte",
  ];

  const gustos = [
    "Ficción",
    "No ficción",
    "Romance",
    "Terror",
    "Fantasía",
    "Historia",
    "Autoayuda",
    "Biografía",
    "Poesía",
  ];

  const handleRegistro = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: nombre });

      await setDoc(doc(db, "usuarios", cred.user.uid), {
        id: cred.user.uid,
        nombre,
        apellido,
        email: cred.user.email,
        avatar: cred.user.photoURL || "https://i.pravatar.cc/29?=default",
        telefono: "",
        ciudad: zona || "",
        gustoLiterario,
        gustos: gustoLiterario ? [gustoLiterario] : [],
        bio: "",
        genero: "",
        tipoCuenta: "free",
        favoritos: [],
        mision: "",
        saldoTokens: 0,
        ubicacion: null,
        fechaRegistro: new Date().toISOString(),
      });

      setMostrarBienvenida(true);
      setTimeout(() => {
        setMostrarBienvenida(false);
        if (onClose) onClose();
      }, 3500);
    } catch (err) {
      setError("No se pudo registrar: " + (err.message || err.code));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (onClose) onClose();
    } catch {
      setError("Email o contraseña inválidos");
    }
  };

  const handleLoginGoogle = async () => {
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await setDoc(doc(db, "usuarios", user.uid), {
        id: user.uid,
        nombre: user.displayName || "",
        apellido,
        email: user.email,
        avatar: user.photoURL || "https://i.pravatar.cc/29?=default",
        telefono: "",
        ciudad: zona || "",
        gustoLiterario,
        gustos: gustoLiterario ? [gustoLiterario] : [],
        bio: "",
        genero: "",
        tipoCuenta: "free",
        favoritos: [],
        mision: "",
        saldoTokens: 0,
        ubicacion: null,
        fechaRegistro: new Date().toISOString(),
      });

      if (onClose) onClose();
    } catch (err) {
      setError("No se pudo iniciar sesión con Google");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-6">
      <div className="w-full bg-cream/95 backdrop-blur-md rounded-3xl shadow-2xl p-4 sm:p-12 border border-gray-100">
        <div className="flex flex-col items-center mb-6">
          <LogoBukKus size={80} />
          <p className="text-gray-500 text-center text-base mt-1">
            Intercambiá libros. Conectá personas. Inspirá historias.
          </p>
        </div>

        <form className="space-y-5" onSubmit={registro ? handleRegistro : handleLogin}>
          {registro && (
            <>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <FaUser className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Tu nombre"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <FaUser className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Tu apellido"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  required
                />
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <FaMapMarkerAlt className="w-4 h-4" />
                </span>
                <select
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm"
                  value={zona}
                  onChange={(e) => setZona(e.target.value)}
                  required
                >
                  <option value="">Seleccioná tu zona</option>
                  {zonasPermitidas.map((z) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <FaBookOpen className="w-4 h-4" />
                </span>
                <select
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm"
                  value={gustoLiterario}
                  onChange={(e) => setGustoLiterario(e.target.value)}
                  required
                >
                  <option value="">Gusto literario</option>
                  {gustos.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <FaEnvelope className="w-4 h-4" />
            </span>
            <input
              type="email"
              placeholder="Email"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <FaLock className="w-4 h-4" />
            </span>
            <input
              type="password"
              placeholder="Contraseña"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className="w-full bg-[#f7b22a] text-black font-bold py-3 rounded-xl shadow hover:bg-[#f7b22a] transition-all"
            disabled={loading}
          >
            {registro ? "Registrarse" : "Ingresar"}
          </button>
        </form>

        <button
          onClick={handleLoginGoogle}
          className="w-full mt-4 bg-white border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl shadow flex items-center justify-center hover:bg-gray-100 transition-all"
        >
          <FaGoogle className="mr-2" /> Ingresar con Google
        </button>

        <div className="mt-6 text-center text-sm text-gray-600">
          {registro ? "¿Ya tenés cuenta?" : "¿No tenés cuenta?"}
          <button
            type="button"
            onClick={() => setRegistro((r) => !r)}
            className="ml-2 text-yellow-600 font-semibold hover:underline"
            disabled={loading}
          >
            {registro ? "Ingresar" : "Crear cuenta"}
          </button>
        </div>
      </div>

      {mostrarBienvenida && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-cream rounded-3xl shadow-2xl p-10 flex flex-col items-center relative min-w-[320px]">
            {windowSize.width > 0 && windowSize.height > 0 && (
              <Confetti
                width={windowSize.width}
                height={windowSize.height}
                numberOfPieces={200}
                recycle={false}
                gravity={0.25}
                style={{ position: "fixed", top: 0, left: 0, zIndex: 1000 }}
              />
            )}
            <LogoBukKus size={80} />
            <h2 className="text-2xl font-bold text-yellow-600 mb-2">¡Bienvenido/a a BUKKUS!</h2>
            <p className="text-gray-700 text-center mb-2">
              Tu cuenta fue creada con éxito.<br />
              ¡Comenzá a intercambiar libros y conectar!
            </p>
            <span className="text-4xl mt-2 animate-bounce">🎉</span>
          </div>
        </div>
      )}
    </div>
  );
}

LoginBukKus.propTypes = {
  onClose: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};
