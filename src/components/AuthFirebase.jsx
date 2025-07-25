import React, { useState } from "react";
import { crearUsuario, loginUsuario, logoutUsuario } from "../utils/firebaseHelpers";

export default function AuthFirebase() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const newUser = await crearUsuario(email, password);
      setUser(newUser);
    } catch (e) {
      // Manejo de errores claros para el usuario
      if (e.code === 'auth/email-already-in-use') {
        setError('El email ya está registrado. Prueba iniciar sesión o usar otro email.');
      } else if (e.code === 'auth/invalid-email') {
        setError('El email no es válido.');
      } else if (e.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else if (e.message && e.message.includes('400')) {
        setError('Error en el registro. Verifica email y contraseña.');
      } else {
        setError(e.message || 'Error desconocido al registrar.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const loggedUser = await loginUsuario(email, password);
      setUser(loggedUser);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    setError("");
    try {
      await logoutUsuario();
      setUser(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4 text-center">Firebase Auth Test</h2>
      {user ? (
        <>
          <div className="mb-4 text-center">
            <p className="text-green-700 font-semibold">¡Sesión iniciada!</p>
            <p className="text-sm">Email: {user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white py-2 rounded mt-2"
            disabled={loading}
          >
            {loading ? "Cerrando sesión..." : "Cerrar sesión"}
          </button>
        </>
      ) : (
        <form className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
          <div className="flex gap-2">
            <button
              onClick={handleLogin}
              type="button"
              className="flex-1 bg-oliva text-white py-2 rounded"
              disabled={loading}
            >
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </button>
            <button
              onClick={handleRegister}
              type="button"
              className="flex-1 bg-blue-500 text-white py-2 rounded"
              disabled={loading}
            >
              {loading ? "Registrando..." : "Registrarse"}
            </button>
          </div>
        </form>
      )}
      {error && <p className="text-red-600 mt-4 text-center">{error}</p>}
    </div>
  );
}
