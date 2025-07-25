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

export default function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState([]);

  const cargarUsuarios = async () => {
    const snapshot = await getDocs(collection(db, "usuarios"));
    const lista = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setUsuarios(lista);
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const eliminarUsuario = async (uid) => {
    if (!window.confirm("¿Estás seguro que querés eliminar este usuario?")) return;

    try {
      await deleteDoc(doc(db, "usuarios", uid));

      const avatarRef = ref(storage, `avatars/${uid}`);
      await deleteObject(avatarRef).catch(() => {
        console.warn("No se encontró avatar, se continúa.");
      });

      await cargarUsuarios();
      alert("✅ Usuario eliminado correctamente.");
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      alert("❌ Ocurrió un error al eliminar el usuario.");
    }
  };

  const resetearSaldo = async (uid) => {
    if (!window.confirm("¿Resetear saldo a 0?")) return;

    try {
      await updateDoc(doc(db, "usuarios", uid), { saldoTokens: 0 });
      await cargarUsuarios();
      alert("💰 Saldo reiniciado a 0.");
    } catch (error) {
      console.error("Error al resetear saldo:", error);
      alert("❌ No se pudo resetear el saldo.");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Usuarios registrados</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead className="bg-yellow-100 text-left">
            <tr>
              <th className="px-3 py-2 border">Alias</th>
              <th className="px-3 py-2 border">Email</th>
              <th className="px-3 py-2 border">Ciudad</th>
              <th className="px-3 py-2 border">Teléfono</th>
              <th className="px-3 py-2 border">Saldo</th>
              <th className="px-3 py-2 border">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-t hover:bg-yellow-50">
                <td className="px-3 py-2 border">{u.alias || "-"}</td>
                <td className="px-3 py-2 border">{u.email || "-"}</td>
                <td className="px-3 py-2 border">{u.ciudad || "-"}</td>
                <td className="px-3 py-2 border">{u.telefono || "-"}</td>
                <td className="px-3 py-2 border">{u.saldoTokens ?? 0}</td>
                <td className="px-3 py-2 border space-x-2">
                  <button
                    onClick={() => eliminarUsuario(u.id)}
                    className="text-red-600 text-xs hover:underline"
                  >
                    Eliminar
                  </button>
                  <button
                    onClick={() => resetearSaldo(u.id)}
                    className="text-blue-600 text-xs hover:underline"
                  >
                    Reset
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
