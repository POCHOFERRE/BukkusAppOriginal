import React, { useContext, useState } from "react";
import { UserContext } from "../context/UserContext";
import UsuariosAdmin from "../components/admin/UsuariosAdmin";
import LibrosAdmin from "../components/admin/LibrosAdmin";
import OfertasAdmin from "../components/admin/OfertasAdmin";
import RecargasAdmin from "../components/admin/RecargasAdmin";
import RecargasLogAdmin from "../components/admin/RecargasLogAdmin";

const tabs = [
  { key: "usuarios", label: "Usuarios" },
  { key: "libros", label: "Libros" },
  { key: "ofertas", label: "Ofertas" },
  { key: "recargas", label: "Recargas" },
  { key: "recargasLog", label: "Historial" },
];

export default function AdminPanel() {
  const { usuarioActivo } = useContext(UserContext);
  const [seccion, setSeccion] = useState("usuarios");

  if (!usuarioActivo) return <p className="text-center mt-20 text-gray-500">Cargando sesión de administrador...</p>;
  if (usuarioActivo.rol !== "admin") return <p className="text-center mt-20 text-red-500">Acceso no autorizado ❌</p>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">Panel BuKKus</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSeccion(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition 
              ${
                seccion === tab.key
                  ? "bg-yellow-400 text-gray-900 shadow"
                  : "bg-gray-100 text-gray-600 hover:bg-yellow-100"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-cream rounded-xl shadow-md p-4 md:p-6">
        {seccion === "usuarios" && <UsuariosAdmin />}
        {seccion === "libros" && <LibrosAdmin />}
        {seccion === "ofertas" && <OfertasAdmin />}
        {seccion === "recargas" && <RecargasAdmin />}
        {seccion === "recargasLog" && <RecargasLogAdmin />}
      </div>
    </div>
  );
}
