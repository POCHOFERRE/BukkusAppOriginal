import React, { createContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../config/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import {
  solicitarPermisoNotificaciones,
  notificacionesSoportadas,
  desactivarNotificaciones,
} from "../helpers/notificaciones";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [usuarioActivo, setUsuarioActivoState] = useState(() => {
    try {
      const raw = localStorage.getItem("usuarioActivo");
      return raw && raw !== "undefined" ? JSON.parse(raw) : null;
    } catch (err) {
      console.warn("⚠️ Error al parsear usuarioActivo desde localStorage:", err);
      return null;
    }
  });

  const [saldoTokens, setSaldoTokens] = useState(0);
  const [favoritos, setFavoritos] = useState([]);
  const [misionActual, setMisionActual] = useState("");
  const [tabActivo, setTabActivo] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [productos, setProductos] = useState([]);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [notificaciones, setNotificaciones] = useState({
    soportadas: false,
    activadas: false,
    error: null,
  });

  const [chatActivo, setChatActivo] = useState(null);

  const setUsuarioActivo = (user) => {
    setUsuarioActivoState(user);
    if (user) {
      localStorage.setItem("usuarioActivo", JSON.stringify(user));
    } else {
      localStorage.removeItem("usuarioActivo");
    }
  };

  const generarAlias = (email) => {
    const base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    const sufijo = Math.floor(100 + Math.random() * 900);
    return base + sufijo;
  };

  useEffect(() => {
    const auth = getAuth();
    let unsubscribeSnapshot = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCargandoSesion(true);
      console.log("🔐 Verificando sesión...");

      try {
        if (user) {
          console.log("✅ Usuario autenticado:", user.email);
          const docRef = doc(db, "usuarios", user.uid);
          const docSnap = await getDoc(docRef);

          if (!docSnap.exists()) {
            const nuevoUsuario = {
              id: user.uid,
              email: user.email,
              nombre: user.displayName || "",
              alias: generarAlias(user.email),
              ciudad: "",
              avatar: "",
              saldoTokens: 0,
              favoritos: [],
              mision: "",
              bio: "",
              creadoEn: new Date().toISOString(),
            };
            await setDoc(docRef, nuevoUsuario);
            console.log("🆕 Usuario nuevo creado en Firestore.");
          }

          unsubscribeSnapshot = onSnapshot(docRef, async (docSnap) => {
            try {
              if (docSnap.exists()) {
                const data = docSnap.data();
                const fullUser = {
                  id: user.uid,
                  email: user.email,
                  nombre: user.displayName || user.email,
                  ...data,
                };

                console.log("📄 Usuario desde Firestore:", fullUser);

                setUsuarioActivo(fullUser);
                setSaldoTokens(data.saldoTokens || 0);
                setFavoritos(Array.isArray(data.favoritos) ? data.favoritos : []);
                setMisionActual(data.mision || "");

                const soportadas = await notificacionesSoportadas();
                if (soportadas) {
                  const resultado = await solicitarPermisoNotificaciones(user.uid);
                  setNotificaciones({
                    soportadas: true,
                    activadas: resultado.success,
                    error: resultado.success ? null : resultado.message,
                  });
                } else {
                  setNotificaciones({
                    soportadas: false,
                    activadas: false,
                    error: "Notificaciones no soportadas en este navegador",
                  });
                }
              } else {
                console.warn("⚠️ El documento del usuario no existe en Firestore.");
              }
            } catch (err) {
              console.error("❌ Error en snapshot del usuario:", err);
            }
          });
        } else {
          console.log("🚫 Sesión cerrada.");
          unsubscribeSnapshot();
          setUsuarioActivo(null);
          setSaldoTokens(0);
          setFavoritos([]);
          setMisionActual("");
        }
      } catch (err) {
        console.error("❌ Error en onAuthStateChanged:", err);
      } finally {
        setCargandoSesion(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSnapshot();
    };
  }, []);

  const actualizarProductos = (nuevos) => {
    setProductos(nuevos);
  };

  return (
    <UserContext.Provider
      value={{
        usuarioActivo,
        setUsuarioActivo,
        saldoTokens,
        setSaldoTokens,
        favoritos,
        setFavoritos,
        misionActual,
        setMisionActual,
        tabActivo,
        setTabActivo,
        busqueda,
        setBusqueda,
        productos,
        actualizarProductos,
        cargandoSesion,
        chatActivo,
        setChatActivo,
        notificaciones,
        toggleNotificaciones: async (activar) => {
          if (activar) {
            const resultado = await solicitarPermisoNotificaciones(usuarioActivo?.id);
            setNotificaciones((prev) => ({
              ...prev,
              activadas: resultado.success,
              error: resultado.success ? null : resultado.message,
            }));
            return resultado;
          } else {
            const resultado = await desactivarNotificaciones(usuarioActivo?.id);
            setNotificaciones((prev) => ({
              ...prev,
              activadas: false,
              error: resultado.success ? null : "Error al desactivar notificaciones",
            }));
            return resultado;
          }
        },
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

UserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
