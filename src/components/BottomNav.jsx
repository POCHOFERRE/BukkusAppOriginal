// src/components/BottomNav.jsx
import React, { useContext, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Wallet, Plus, Bell, MessageSquare, User } from "lucide-react";
import { UserContext } from "../context/UserContext";
import { ChatContext } from "../context/ChatContext";
import { db } from "../config/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

export default function BottomNav() {
  const { usuarioActivo } = useContext(UserContext);
  const { totalNoLeidos } = useContext(ChatContext);
  const location = useLocation();
  const ruta = location.pathname;
  const [pendientes, setPendientes] = useState(0);
  const [lastTap, setLastTap] = useState({ time: 0, target: null });

  const isActive = (path) => ruta === path;

  const handleDoubleTap = (e, path) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap.time;

    if (lastTap.target === path && tapLength < 300) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast.dismiss();
      toast.info("¡Volviste al inicio!", {
        position: "bottom-center",
        autoClose: 1000,
        hideProgressBar: true,
      });
    }

    setLastTap({ time: currentTime, target: path });
  };

  useEffect(() => {
    if (!usuarioActivo?.id) return;

    const q = query(
      collection(db, "ofertas"),
      where("para", "==", usuarioActivo.id),
      where("estado", "==", "pendiente")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendientes(snapshot.size);
      if (snapshot.size > 0 && document.visibilityState === "hidden") {
        document.title = `(${snapshot.size}) Nuevas ofertas - Bukkus`;
      }
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        document.title = "Bukkus - Trueque de Libros";
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [usuarioActivo?.id]);

  const navItems = [
    { icon: Home, path: "/", label: "Inicio", tourKey: "tour-inicio" },
    { icon: Wallet, path: "/billetera", label: "Billetera", tourKey: "tour-billetera" },
    { icon: Plus, path: "/publicar", label: "Publicar", tourKey: "tour-publicar" },
    {
      icon: Bell,
      path: "/ofertas",
      label: "Ofertas",
      badge: pendientes,
      badgeColor: "bg-red-500",
      tourKey: "tour-ofertas",
    },
    {
      icon: MessageSquare,
      path: "/mis-chats",
      label: "Chats",
      badge: totalNoLeidos,
      badgeColor: "bg-green-500",
      tourKey: "tour-chat",
    },
    {
      icon: User,
      path: "/perfil",
      label: "Perfil",
      tourKey: "tour-perfil",
    },
  ];

  const activeVariants = {
    active: { opacity: 1, scale: 1 },
    inactive: { opacity: 0, scale: 0.8 },
  };

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
        style={{
          width: "100%",
          transform: "translateZ(0)",
          willChange: "transform",
          // Asegurar que el BottomNav esté por encima del contenido
          zIndex: 40,
        }}
      >
        <nav className="w-full bg-zinc-900 border-t border-zinc-700 shadow-lg backdrop-blur-sm bg-opacity-95">
          <div className="flex justify-evenly items-center h-16 text-xs font-medium">
            {navItems.map((item) => {
              const isActivePath = isActive(item.path);
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={(e) => {
                    if (isActivePath) {
                      e.preventDefault();
                      handleDoubleTap(e, item.path);
                    }
                  }}
                  className={`relative flex flex-col items-center justify-center flex-1 h-full ${
                    isActivePath
                      ? "text-yellow-500"
                      : "text-gray-400 hover:text-yellow-500"
                  } transition-colors duration-200 active:bg-zinc-800 active:bg-opacity-50 rounded-t-lg`}
                  aria-label={item.label}
                >
                  <div className="relative w-full h-full flex flex-col items-center justify-center">
                    <div className="relative">
                      <Icon
                        className={`h-6 w-6 transition-transform duration-200 mx-auto ${
                          isActivePath ? "scale-110 text-yellow-500" : "scale-100 text-gray-400"
                        }`}
                        strokeWidth={isActivePath ? 2.5 : 2}
                        aria-hidden="true"
                      />
                      
                      {item.badge > 0 && (
                        <span
                          className={`absolute -top-1 -right-2 ${item.badgeColor} text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center border border-zinc-900`}
                          aria-hidden="true"
                        >
                          {item.badge > 9 ? "9+" : item.badge}
                        </span>
                      )}
                    </div>
                    
                    <AnimatePresence>
                      {isActivePath && (
                        <motion.div
                          className="absolute -bottom-1 w-1.5 h-1.5 bg-yellow-500 rounded-full"
                          initial="inactive"
                          animate="active"
                          exit="inactive"
                          variants={activeVariants}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                  <span className="sr-only">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
        {/* Safe area para notch */}
        <div
          className="w-full bg-zinc-900"
          style={{
            height: "env(safe-area-inset-bottom, 0px)",
            minHeight: "env(safe-area-inset-bottom, 0px)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        />
      </div>
      {/* Espacio adicional en el fondo para dispositivos móviles */}
      <div className="h-16 md:h-0 w-full" />
    </>
  );
}
