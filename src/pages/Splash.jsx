// src/pages/Splash.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logoBukkus from "../assets/icon_bukkus_yellow.png";

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/");
    }, 2500); // 2.5 segundos

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-black text-black flex-col gap-4">
      <img
        src={logoBukkus}
        alt="BuKKus"
        className="w-28 h-28 animate-bounce"
      />
      <h1 className="text-3xl font-bold tracking-wide">BuKKus</h1>
      <p className="text-sm text-gray-300">Libros que encuentran su camino 📚</p>
    </div>
  );
}
