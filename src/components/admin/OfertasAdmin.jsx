import React, { useEffect, useState } from "react";
import { db } from "../../config/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

export default function OfertasAdmin() {
  const [ofertas, setOfertas] = useState([]);

  const cargarOfertas = async () => {
    const snapshot = await getDocs(collection(db, "ofertas"));
    const lista = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setOfertas(lista);
  };

  useEffect(() => {
    cargarOfertas();
  }, []);

  const eliminarOferta = async (oferta) => {
    if (!window.confirm(`¿Eliminar esta oferta?`)) return;

    try {
      await deleteDoc(doc(db, "ofertas", oferta.id));
      await cargarOfertas();
      alert("✅ Oferta eliminada");
    } catch (error) {
      console.error("Error al eliminar oferta:", error);
      alert("❌ Error al eliminar oferta");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Ofertas realizadas</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead className="bg-yellow-100 text-left">
            <tr>
              <th className="px-3 py-2 border">ID</th>
              <th className="px-3 py-2 border">De</th>
              <th className="px-3 py-2 border">Para</th>
              <th className="px-3 py-2 border">Libro ID</th>
              <th className="px-3 py-2 border">Estado</th>
              <th className="px-3 py-2 border">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ofertas.map((of) => (
              <tr key={of.id} className="border-t hover:bg-yellow-50">
                <td className="px-3 py-2 border">{of.id}</td>
                <td className="px-3 py-2 border">{of.de}</td>
                <td className="px-3 py-2 border">{of.para}</td>
                <td className="px-3 py-2 border">{of.productoId}</td>
                <td className="px-3 py-2 border">{of.estado || "-"}</td>
                <td className="px-3 py-2 border">
                  <button
                    onClick={() => eliminarOferta(of)}
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
