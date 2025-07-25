import React, { useEffect, useState } from "react";
import { db } from "../../config/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export default function RecargasLogAdmin() {
  const [recargas, setRecargas] = useState([]);

  const cargarHistorial = async () => {
    const q = query(collection(db, "recargas"), orderBy("fecha", "desc"));
    const snapshot = await getDocs(q);

    const lista = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setRecargas(lista);
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Historial de recargas</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead className="bg-yellow-100 text-left">
            <tr>
              <th className="px-3 py-2 border">Usuario UID</th>
              <th className="px-3 py-2 border">Monto</th>
              <th className="px-3 py-2 border">Fecha</th>
              <th className="px-3 py-2 border">Admin</th>
            </tr>
          </thead>
          <tbody>
            {recargas.map((r) => (
              <tr key={r.id} className="border-t hover:bg-yellow-50">
                <td className="px-3 py-2 border">{r.uid}</td>
                <td className="px-3 py-2 border">{r.monto} BUKK</td>
                <td className="px-3 py-2 border">
                  {r.fecha?.toDate().toLocaleString() ?? "-"}
                </td>
                <td className="px-3 py-2 border">{r.admin || "admin"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
