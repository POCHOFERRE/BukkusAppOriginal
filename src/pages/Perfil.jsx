import React, { useState } from "react";
import EditarPerfil from "../components/Perfil/EditarPerfil";
import MisLibros from "../components/Perfil/MisLibros";
import Favoritos from "../components/Perfil/Favoritos";
import Movimientos from "../components/Perfil/Movimientos";


import {
  FiUser,
  FiBookOpen,
  FiStar,
  FiDollarSign,

} from "react-icons/fi";

export default function Perfil() {
  const [pestanaActiva, setPestanaActiva] = useState("perfil");

  const pestañas = [
    { id: "perfil", label: "Perfil", icon: <FiUser /> },
    { id: "libros", label: "Mis Libros", icon: <FiBookOpen /> },
    { id: "favoritos", label: "Favoritos", icon: <FiStar /> },
    { id: "movimientos", label: "Billetera", icon: <FiDollarSign /> },
    
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 pt-4">
      <div className="flex flex-wrap justify-center gap-4 border-b pb-3 text-sm font-medium text-gray-600">
        {pestañas.map((p) => (
          <button
            key={p.id}
            onClick={() => setPestanaActiva(p.id)}
            className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all ${
              pestanaActiva === p.id
                ? "bg-yellow-200 text-yellow-800 shadow-sm"
                : "hover:text-yellow-700"
            }`}
          >
            {p.icon}
            <span className="hidden sm:inline">{p.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-6">
        {pestanaActiva === "perfil" && <EditarPerfil />}
        {pestanaActiva === "libros" && <MisLibros />}
        {pestanaActiva === "favoritos" && <Favoritos />}
        {pestanaActiva === "movimientos" && <Movimientos />}
        
      </div>
    </div>
  );
}
