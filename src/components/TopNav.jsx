// src/components/TopNav.jsx
import React, { useContext, useEffect, useState, useCallback, useRef } from "react";
import { UserContext } from "../context/UserContext";
import { ChatContext } from "../context/ChatContext";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  FaSearch,
  FaCoins,
  FaUserCircle,
  FaSignOutAlt,
  FaSignInAlt,
  FaBell,
  FaTimes,
} from "react-icons/fa";
import { FiMessageCircle } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { debounce } from "lodash";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import {
  doc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
} from "firebase/firestore";
import { signOut, getAuth } from "firebase/auth";
import { db } from "../config/firebase";
import PropTypes from "prop-types";
import logoBukkus from "../assets/icon_bukkus_yellow.png";
import Modal from "./Modal";

export default function TopNav({ setBusqueda }) {
  const { usuarioActivo, setUsuarioActivo } = useContext(UserContext);
  const { totalNoLeidos } = useContext(ChatContext);
  const [datos, setDatos] = useState({});
  const [busquedaLocal, setBusquedaLocal] = useState("");
  const [modalLogout, setModalLogout] = useState(false);
  const [ofertasPendientes, setOfertasPendientes] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const location = useLocation();

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const currentMenuRef = menuRef.current;
    
    function handleClickOutside(event) {
      if (currentMenuRef && !currentMenuRef.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef]);

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Restaurar búsqueda desde URL
  useEffect(() => {
    const searchQuery = searchParams.get('q');
    if (searchQuery) {
      setBusquedaLocal(searchQuery);
      if (setBusqueda) {
        setBusqueda(searchQuery);
      }
    }
  }, [searchParams, setBusqueda]);

  // Función de búsqueda con debounce
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((value) => {
      if (setBusqueda) {
        setBusqueda(value);
        // Actualizar URL sin recargar la página
        const params = new URLSearchParams(location.search);
        if (value) {
          params.set('q', value);
        } else {
          params.delete('q');
        }
        navigate(`?${params.toString()}`, { replace: true });
      }
    }, 300),
    [setBusqueda, location.search, navigate]
  );

  // Limpiar debounce al desmontar
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setBusquedaLocal(value);
    debouncedSearch(value);
  };

  const clearSearch = () => {
    setBusquedaLocal('');
    if (setBusqueda) {
      setBusqueda('');
    }
    // Actualizar URL
    const params = new URLSearchParams(location.search);
    params.delete('q');
    navigate(`?${params.toString()}`, { replace: true });
  };

  const handleConfirmLogout = async () => {
    try {
      await signOut(getAuth());
      setUsuarioActivo(null);
      localStorage.clear();
      toast.success('Sesión cerrada correctamente', {
        position: 'top-center',
        autoClose: 2000,
        hideProgressBar: true,
      });
      toast.success("Sesión cerrada correctamente");
      navigate("/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast.error("Error al cerrar sesión");
    } finally {
      setModalLogout(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const userId = usuarioActivo?.uid || usuarioActivo?.id;
    if (!userId) return;

    const unsubscribe = onSnapshot(doc(db, "usuarios", userId), (docSnap) => {
      if (docSnap.exists()) {
        setDatos(docSnap.data());
      }
    });

    return () => unsubscribe();
  }, [usuarioActivo]);

  useEffect(() => {
    if (!usuarioActivo?.id) return;

    const q = query(
      collection(db, "ofertas"),
      where("para", "==", usuarioActivo.id),
      where("estado", "==", "pendiente")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOfertasPendientes(snapshot.size);
    });

    return () => unsubscribe();
  }, [usuarioActivo]);

  useEffect(() => {
    if (datos?.ciudad || !("geolocation" in navigator)) return;

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
        );
        const data = await res.json();
        const ciudadDetectada =
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          data.address?.state;

        if (ciudadDetectada) {
          setDatos((prev) => ({ ...prev, ciudad: ciudadDetectada }));
          
          const uid = usuarioActivo?.uid || usuarioActivo?.id;
          if (uid) {
            await updateDoc(doc(db, "usuarios", uid), {
              ciudad: ciudadDetectada,
            });
          }
        }
      } catch (err) {
        console.error("Error al detectar ciudad:", err);
      }
    });
  }, [datos?.ciudad, usuarioActivo]);

  const logoSize = scrollY > 40 ? "text-[16px]" : "text-[20px]";
  const logoImgSize = scrollY > 40 ? "24px" : "32px";

  const toggleMobileMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <header className="bg-white shadow-md px-4 py-2 flex flex-wrap sm:flex-nowrap sm:justify-between sm:items-center gap-2 w-full fixed top-0 z-50 h-auto sm:h-16">
        {/* Logo - Mobile */}
        <div className="flex items-center sm:hidden">
          <Link to="/" className="tour-home flex items-center gap-2 transition-all">
            <h1 className="flex items-center font-bold text-black leading-[1] text-[18px]">
              <img
                src={logoBukkus}
                alt="BuKKus logo"
                className="h-7 w-7 object-contain"
              />
            </h1>
          </Link>
        </div>

        {/* Location - Mobile */}
        <div className="flex items-center sm:hidden">
          {datos?.ciudad && (
            <div className="flex items-center text-xs text-gray-600 bg-gray-100 rounded-full px-3 py-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {datos.ciudad}
            </div>
          )}
        </div>

        {/* Search Bar - Mobile */}
        <div className="flex-1 sm:hidden ml-2">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Buscar libros..."
              value={busquedaLocal}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-9 py-1.5 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
            />
            {busquedaLocal && (
              <button
                type="button"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={clearSearch}
                aria-label="Limpiar búsqueda"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Logo - Desktop */}
        <div className="hidden sm:flex items-center">
          <Link to="/" className="tour-home flex items-center gap-2 transition-all">
            <h1 className={`flex items-center font-bold text-black leading-[1] transition-all ${logoSize}`}>
              BU
              <img
                src={logoBukkus}
                alt="BuKKus logo"
                className="mx-1 inline-block object-contain translate-y-[1px]"
                style={{ width: logoImgSize, height: logoImgSize }}
              />
              US
            </h1>
          </Link>
        </div>

        {/* Search bar - Desktop */}
        <div className="hidden sm:flex flex-1 max-w-2xl mx-4">
          <div className="relative w-full">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Buscar libros..."
              value={busquedaLocal}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-9 py-1.5 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
            />
            {busquedaLocal && (
              <button
                type="button"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={clearSearch}
                aria-label="Limpiar búsqueda"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center gap-4">
          {usuarioActivo ? (
            <>
              <Link to="/billetera" className="tour-billetera flex items-center gap-1 text-sm text-gray-600 hover:text-yellow-500 transition">
                <FaCoins className="text-lg" />
                <span>{datos?.saldoTokens !== undefined ? `${datos.saldoTokens} BUKK` : "0 BUKK"}</span>
              </Link>

              <Link to="/perfil" className="tour-perfil flex items-center gap-1 text-sm text-gray-600 hover:text-yellow-500 transition">
                <FaUserCircle className="text-lg" />
                <span>{datos?.nombre || "Perfil"}</span>
              </Link>

              <Link to="/ofertas" className="tour-ofertas relative p-1 text-gray-600 hover:text-yellow-500">
                <FaBell className="h-5 w-5" />
                {ofertasPendientes > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {ofertasPendientes}
                  </span>
                )}
              </Link>

              <Link to="/mis-chats" className="tour-chat relative p-1 text-gray-600 hover:text-yellow-500">
                <FiMessageCircle className="h-5 w-5" />
                {totalNoLeidos > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {totalNoLeidos}
                  </span>
                )}
              </Link>
              
              {/* Botón Publicar - Solo en escritorio */}
              <Link 
                to="/publicar" 
                className="tour-publicar hidden md:flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-sm font-medium rounded-full hover:from-yellow-600 hover:to-yellow-700 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                <span>Publicar</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </Link>

              <button
                onClick={() => setModalLogout(true)}
                className="text-gray-600 hover:text-red-500 transition-colors"
                aria-label="Cerrar sesión"
              >
                <FaSignOutAlt className="h-5 w-5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => window.dispatchEvent(new Event("abrirLogin"))}
              className="text-gray-600 hover:text-yellow-500 transition-colors"
              aria-label="Iniciar sesión"
            >
              <FaSignInAlt className="h-5 w-5" />
            </button>
          )}
        </div>
      </header>

      {/* Mobile Menu - Hidden by default, shown when menu is toggled */}

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden bg-white border-t border-gray-200"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {usuarioActivo ? (
                <>
                  <Link
                    to="/publicar"
                    className="block px-3 py-2.5 rounded-md text-base font-medium text-white bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 mb-2 text-center shadow-md"
                    onClick={toggleMobileMenu}
                  >
                    Publicar Libro
                  </Link>
                  <Link
                    to="/perfil"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-yellow-500 hover:bg-gray-50"
                    onClick={toggleMobileMenu}
                  >
                    Mi perfil
                  </Link>
                  <Link
                    to="/billetera"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-yellow-500 hover:bg-gray-50"
                    onClick={toggleMobileMenu}
                  >
                    Mi billetera
                  </Link>
                  <Link
                    to="/ofertas"
                    className="relative block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-yellow-500 hover:bg-gray-50"
                    onClick={toggleMobileMenu}
                  >
                    Ofertas
                    {ofertasPendientes > 0 && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {ofertasPendientes} nuevas
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/mis-chats"
                    className="relative block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-yellow-500 hover:bg-gray-50"
                    onClick={toggleMobileMenu}
                  >
                    Chats
                    {totalNoLeidos > 0 && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {totalNoLeidos} sin leer
                      </span>
                    )}
                  </Link>
                  <button
                    onClick={() => {
                      setModalLogout(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    window.dispatchEvent(new Event("abrirLogin"));
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-yellow-500"
                >
                  Iniciar sesión
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal isOpen={modalLogout} onClose={() => setModalLogout(false)}>
        <div className="text-center p-4 b">
          <h2 className="text-lg font-bold mb-3 text-[#f7b22a]   ">¿Cerrar sesión?</h2>
          <p className="text-xl text-gray mb-4">
            Estás por cerrar tu cuenta en BuKKus. ¿Estás seguro?
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setModalLogout(false)}
              className="px-4 py-1.5 rounded-full bg-[#f7b22a] hover:bg-gray-300 text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmLogout}
              className="px-4 py-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

TopNav.propTypes = {
  setBusqueda: PropTypes.func,
};
