import React, { useState, useEffect, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { Geolocation } from "@capacitor/geolocation";
import { doc, updateDoc } from "firebase/firestore";
import { db, messaging } from "./config/firebase";

import useTopNavHeight from "./components/useTopNavHeight";
import ScrollToTop from "./components/ScrollToTop";

import AdminPanel from "./pages/AdminPanel";
import RegistrarAdmin from "./pages/RegistrarAdmin";
import Home from "./pages/Home";
import Publicar from "./pages/Publicar";
import Perfil from "./pages/Perfil";
import Ofertas from "./pages/Ofertas";
import OfertaPage from "./pages/OfertaPage";
import Chat from "./pages/ChatPage";
import BilleteraPage from "./pages/BilleteraPage";
import MisChats from "./pages/MisChats";

import InstruccionInstalacionPWA from "./components/InstruccionInstalacionPWA";

import BottomNav from "./components/BottomNav";
import TopNav from "./components/TopNav";
import AuthFirebase from "./components/AuthFirebase";
import Modal from "./components/Modal";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ChatProvider } from "./context/ChatContext";
import { UserContext, UserProvider } from "./context/UserContext";
import { onMessage } from "firebase/messaging";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isMobile;
}

function AppWrapper() {
  return (
    <Router>
      <UserProvider>
        <ChatProvider>
          <ScrollToTop />
          <App />
        </ChatProvider>
      </UserProvider>
    </Router>
  );
}

function App() {
  const {
    tabActivo,
    setTabActivo,
    busqueda,
    setBusqueda,
  } = useContext(UserContext);

  const location = useLocation();
  const isMobile = useIsMobile();
  const ocultarTopNav = location.pathname.startsWith("/chat/") && isMobile;
  const topNavHeight = useTopNavHeight();

  const [mostrarAuth, setMostrarAuth] = useState(false);
  const [notificaciones, setNotificaciones] = useState(0);
  const [mostrarInstrucciones, setMostrarInstrucciones] = useState(false);

  useEffect(() => {
    const handler = () => setMostrarAuth(true);
    window.addEventListener("abrirAuthFirebase", handler);
    return () => window.removeEventListener("abrirAuthFirebase", handler);
  }, []);

  useEffect(() => {
    function actualizarNotificaciones(e) {
      if (e?.detail !== undefined) {
        setNotificaciones(e.detail);
      } else {
        const usuarioId = localStorage.getItem("usuarioActivoId");
        if (usuarioId) {
          setNotificaciones(
            parseInt(localStorage.getItem(`notificaciones_${usuarioId}`)) || 0
          );
        }
      }
    }
    window.addEventListener("notificacionesUpdate", actualizarNotificaciones);
    actualizarNotificaciones();
    return () =>
      window.removeEventListener("notificacionesUpdate", actualizarNotificaciones);
  }, []);

  useEffect(() => {
    const unsubscribe = onMessage(messaging, (payload) => {
      const { title, body } = payload.notification || {};
      if (title && body) {
        toast.info(`${title}: ${body}`, { icon: "📚" });
      }
    });
    return () => unsubscribe();
  }, []);

  // 📍 Detectar ubicación y guardar ciudad solo una vez
  useEffect(() => {
    const obtenerUbicacion = async () => {
      try {
        const permiso = await Geolocation.requestPermissions();
        if (permiso.location === "granted") {
          const posicion = await Geolocation.getCurrentPosition();
          const { latitude, longitude } = posicion.coords;

          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyC9QoUe73KtgnSyGra7DAHC--DEshWsfUk`
          );
          const data = await response.json();

          if (data.results.length > 0) {
            const ciudad = data.results.find(r =>
              r.types.includes("locality") || r.types.includes("administrative_area_level_2")
            )?.address_components[0]?.long_name || "Desconocida";

            if (ciudad && !localStorage.getItem("ciudadGuardada")) {
              const usuarioId = localStorage.getItem("usuarioActivoId");
              if (usuarioId) {
                const userRef = doc(db, "usuarios", usuarioId);
                await updateDoc(userRef, { ciudad });
                localStorage.setItem("ciudadGuardada", ciudad);
                console.log("✅ Ciudad guardada:", ciudad);
                toast.success(`📍 Ciudad detectada: ${ciudad}`);
              }
            }
          }
        }
      } catch (error) {
        console.error("❌ Error al obtener ubicación:", error);
      }
    };

    obtenerUbicacion();
  }, []);

  const limpiarDatos = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div
      id="scrollableContent"
      className="min-h-screen overflow-y-auto no-scrollbar w-full bg-cream text-gray-800 safe-area"
    >
      {!ocultarTopNav && (
        <TopNav
          notificaciones={notificaciones}
          tabActivo={tabActivo}
          setTabActivo={setTabActivo}
          setBusqueda={setBusqueda}
          setMostrarInstrucciones={setMostrarInstrucciones}
          limpiarDatos={limpiarDatos}
        />
      )}

      <Modal isOpen={mostrarAuth} onClose={() => setMostrarAuth(false)}>
        <AuthFirebase />
      </Modal>

      <main
        className="w-full max-w-5xl mx-auto px-4 pb-[88px] bg-cream"
        style={{ paddingTop: topNavHeight, minHeight: "100vh" }}
      >
        <Routes>
          <Route path="/" element={<Home tabActivo={tabActivo} busqueda={busqueda} />} />
          <Route path="/publicar" element={<Publicar />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/billetera" element={<BilleteraPage />} />
          <Route path="/ofertas" element={<Ofertas />} />
          <Route path="/propuesta/:libroId" element={<OfertaPage />} />
          <Route path="/chat/:chatId" element={<Chat />} />
          <Route path="/mis-chats" element={<MisChats />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/registrar-admin" element={<RegistrarAdmin />} />
        </Routes>
      </main>

      <BottomNav notificaciones={notificaciones} />
      

      <ToastContainer
        position="top-center"
        autoClose={3000}
        theme="colored"
        toastClassName="mt-[env(safe-area-inset-top)]"
      />

      {mostrarInstrucciones && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center pt-[env(safe-area-inset-top)]">
          <div className="bg-cream rounded-xl p-6 w-[90%] max-w-md shadow-lg overflow-y-auto max-h-[90vh]">
            <h2 className="text-lg font-bold text-[#f7b22a] text-center mb-4">
              ¿Cómo funciona BuKKus?
            </h2>
            <ul className="text-sm text-gray-700 space-y-2 list-disc pl-5 text-left">
              <li>Publicá un libro que quieras intercambiar o regalar.</li>
              <li>Indicá qué tipo de libros te interesan a cambio, o si aceptás <strong>BUKKcoins</strong>.</li>
              <li>Explorá publicaciones y hacé ofertas a otros usuarios desde la sección principal.</li>
              <li>Podés enviar hasta <strong>3 ofertas activas</strong> si sos Free o <strong>10</strong> si sos Pro.</li>
              <li>Si tu oferta es aceptada, se abre un chat cifrado para coordinar el intercambio.</li>
              <li>Desde tu Billetera podés ver tu saldo en BUKKcoins, enviar o recibir monedas, y generar tu alias.</li>
              <li>Podés <strong>canjear libros directamente con BUKKcoins</strong> si el dueño lo habilitó.</li>
              <li>Tu misión personal se completa con cada intercambio o canje exitoso.</li>
              <li>Los usuarios Pro acceden a más publicaciones, posiciones destacadas y funciones exclusivas.</li>
            </ul>
            <div className="text-center pt-5">
              <button
                onClick={() => setMostrarInstrucciones(false)}
                className="mt-2 bg-[#f7b22a] hover:bg-yellow-400 text-black py-1.5 px-6 rounded-full text-sm"
              >
                ¡Entendido!
              </button>
            </div>
          </div>
        </div>
      )}

      <InstruccionInstalacionPWA />
    </div>
  );
}

export default AppWrapper;
