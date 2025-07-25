import React, { useEffect, useState } from "react";
import { db, storage } from "../../config/firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { FaStar, FaRegStar } from "react-icons/fa";

export default function LibrosAdmin() {
  const [libros, setLibros] = useState([]);

  const cargarLibros = async () => {
    const snapshot = await getDocs(collection(db, "libros"));
    const lista = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setLibros(lista);
  };

  useEffect(() => {
    cargarLibros();
  }, []);

  const eliminarLibro = async (libro) => {
    if (!window.confirm(`¿Eliminar el libro "${libro.nombre || "sin título"}"?`)) return;

    try {
      await deleteDoc(doc(db, "libros", libro.id));
      if (libro.imagenes && libro.imagenes.length > 0) {
        for (const [i] of libro.imagenes.entries()) {
          const imgRef = ref(storage, `libros/${libro.id}/img_${i}`);
          await deleteObject(imgRef).catch(() => {});
        }
      }
      await cargarLibros();
      alert("✅ Libro eliminado");
    } catch (error) {
      console.error("Error al eliminar libro:", error);
      alert("❌ Error al eliminar libro");
    }
  };

  const toggleDestacado = async (libro) => {
    try {
      const nuevoValor = !libro.destacado;
      await updateDoc(doc(db, "libros", libro.id), {
        destacado: nuevoValor,
      });
      setLibros((prev) =>
        prev.map((l) => (l.id === libro.id ? { ...l, destacado: nuevoValor } : l))
      );
    } catch (error) {
      console.error("Error al actualizar destacado:", error);
      alert("❌ No se pudo cambiar el estado destacado");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Libros publicados</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead className="bg-yellow-100 text-left">
            <tr>
              <th className="px-3 py-2 border">Título</th>
              <th className="px-3 py-2 border">Autor</th>
              <th className="px-3 py-2 border">Alias</th>
              <th className="px-3 py-2 border">Estado</th>
              <th className="px-3 py-2 border text-center">⭐</th>
              <th className="px-3 py-2 border">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {libros.map((libro) => (
              <tr key={libro.id} className="border-t hover:bg-yellow-50">
                <td className="px-3 py-2 border">{libro.nombre || "-"}</td>
                <td className="px-3 py-2 border">{libro.autor || "-"}</td>
                <td className="px-3 py-2 border">{libro.datosUsuario?.alias || "-"}</td>
                <td className="px-3 py-2 border">{libro.estado || "-"}</td>
                <td className="px-3 py-2 border text-center">
                  <button
                    onClick={() => toggleDestacado(libro)}
                    className={`text-xl ${
                      libro.destacado ? "text-yellow-400" : "text-gray-400"
                    } hover:scale-110 transition`}
                    title="Marcar como destacado"
                  >
                    {libro.destacado ? <FaStar /> : <FaRegStar />}
                  </button>
                </td>
                <td className="px-3 py-2 border">
                  <button
                    onClick={() => eliminarLibro(libro)}
                    className="text-red-600 text-xs hover:underline"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
