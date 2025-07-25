import React, { useEffect, useState } from "react";
import { db } from "../../config/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function RecargasAdmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [uidSeleccionado, setUidSeleccionado] = useState("");
  const [monto, setMonto] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const fetchUsuarios = async () => {
      const snapshot = await getDocs(collection(db, "usuarios"));
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        alias: doc.data().alias || "Sin alias",
        email: doc.data().email || "Sin email",
      }));
      setUsuarios(lista);
    };

    fetchUsuarios();
  }, []);

  const realizarRecarga = async () => {
    if (!uidSeleccionado || !monto || isNaN(monto)) {
      alert("Seleccioná un usuario y un monto válido.");
      return;
    }

    setCargando(true);
    try {
      const refUsuario = doc(db, "usuarios", uidSeleccionado);
      const snap = await getDoc(refUsuario);

      if (!snap.exists()) {
        alert("❌ Usuario no encontrado.");
        setCargando(false);
        return;
      }

      const datos = snap.data();
      const saldoActual = datos.saldoTokens || 0;
      const nuevoSaldo = saldoActual + Number(monto);

      await updateDoc(refUsuario, { saldoTokens: nuevoSaldo });

      await addDoc(collection(db, "recargas"), {
        uid: uidSeleccionado,
        monto: Number(monto),
        fecha: serverTimestamp(),
        admin: "admin",
      });

      alert(`✅ Recarga exitosa. Nuevo saldo: ${nuevoSaldo} BUKKcoins`);
      setMonto("");
    } catch (error) {
      console.error("Error en recarga:", error);
      alert("❌ Error al realizar la recarga.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="max-w-md">
      <h2 className="text-xl font-semibold mb-4">Recargar BUKKcoins</h2>

      <label className="block text-sm text-gray-600">Seleccionar usuario</label>
      <select
        className="w-full border-b mb-4 bg-transparent outline-none"
        value={uidSeleccionado}
        onChange={(e) => setUidSeleccionado(e.target.value)}
      >
        <option value="">-- Elegí un usuario --</option>
        {usuarios.map((u) => (
          <option key={u.id} value={u.id}>
            {u.alias} ({u.email})
          </option>
        ))}
      </select>

      <label className="block text-sm text-gray-600">Monto a recargar</label>
      <input
        type="number"
        className="w-full border-b mb-4 outline-none bg-transparent"
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
        placeholder="Ej: 50"
      />

      <button
        onClick={realizarRecarga}
        className="bg-yellow-400 text-white px-6 py-2 rounded-full shadow hover:bg-yellow-500 transition-all disabled:opacity-50"
        disabled={cargando || !uidSeleccionado || !monto}
      >
        {cargando ? "Cargando..." : "Recargar"}
      </button>
    </div>
  );
}
