import React, { useContext, useEffect, useState } from "react";
import {
  FaCoins,
  FaArrowUp,
  FaArrowDown,
  FaPlus,
  FaExchangeAlt,
} from "react-icons/fa";
import {
  doc,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  Timestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { UserContext } from "../context/UserContext";
import CountUp from "react-countup";
import { toast } from "react-toastify";

export default function Billetera() {
  const { usuarioActivo } = useContext(UserContext);
  const [saldo, setSaldo] = useState(0);
  const [movimientos, setMovimientos] = useState([]);
  const [aliasDestino, setAliasDestino] = useState("");
  const [monto, setMonto] = useState("");

  // Real-time balance and transactions subscription
  useEffect(() => {
    if (!usuarioActivo?.id) return;

    // Subscribe to user data for balance updates
    const userRef = doc(db, "usuarios", usuarioActivo.id);
    const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSaldo(data.saldoTokens || 0);
      }
    }, (error) => {
      console.error("Error fetching user data:", error);
    });

    // Subscribe to transactions
    const transactionsQuery = query(
      collection(db, "recargas"),
      where("id", "==", usuarioActivo.id)
    );
    
    const unsubscribeTransactions = onSnapshot(transactionsQuery, (querySnapshot) => {
      const listaMovs = querySnapshot.docs.map((d) => {
        const data = d.data();
        return {
          tipo: data.tipo,
          monto: data.monto,
          fecha: data.fecha?.toDate().toLocaleString() || "Fecha desconocida",
          destino: data.destino || null,
          origen: data.origen || null,
          nombreDestino: data.nombreDestino || null,
          nombreOrigen: data.nombreOrigen || null,
        };
      });
      setMovimientos(listaMovs);
    }, (error) => {
      console.error("Error fetching transactions:", error);
    });

    // Cleanup subscriptions on component unmount
    return () => {
      unsubscribeUser();
      unsubscribeTransactions();
    };
  }, [usuarioActivo?.id]);

  const handleTransferir = async () => {
    if (!aliasDestino || !monto || isNaN(monto)) {
      toast.error("Alias o monto inválido");
      return;
    }

    const montoNum = parseInt(monto);
    if (montoNum <= 0 || montoNum > saldo) {
      toast.error("Saldo insuficiente o monto inválido");
      return;
    }

    try {
      const refUsuarios = query(
        collection(db, "usuarios"),
        where("alias", "==", aliasDestino)
      );
      const snap = await getDocs(refUsuarios);

      if (snap.empty) {
        toast.error("Alias no encontrado");
        return;
      }

      const docDestino = snap.docs[0];
      const datosDestino = docDestino.data();

      const saldoDestino = datosDestino.saldoTokens || 0;

      await updateDoc(doc(db, "usuarios", usuarioActivo.id), {
        saldoTokens: saldo - montoNum,
      });

      await updateDoc(doc(db, "usuarios", docDestino.id), {
        saldoTokens: saldoDestino + montoNum,
      });

      await addDoc(collection(db, "recargas"), {
        id: usuarioActivo.id,
        alias: usuarioActivo.alias,
        nombreOrigen: usuarioActivo.nombre,
        tipo: "transferencia",
        destino: datosDestino.alias,
        nombreDestino: datosDestino.nombre,
        monto: montoNum,
        fecha: Timestamp.now(),
      });

      await addDoc(collection(db, "recargas"), {
        id: docDestino.id,
        alias: datosDestino.alias,
        nombreDestino: datosDestino.nombre,
        tipo: "recibido",
        origen: usuarioActivo.alias,
        nombreOrigen: usuarioActivo.nombre,
        monto: montoNum,
        fecha: Timestamp.now(),
      });

      toast.success(`Transferencia enviada a ${datosDestino.nombre}`);
      setAliasDestino("");
      setMonto("");
    } catch (err) {
      console.error("Error al transferir:", err);
      toast.error("Error al procesar la transferencia");
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto text-white">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[#f7b22a]">
        <FaCoins /> Mi billetera
      </h2>
  
      {/* SALDO */}
      <div className="bg-zinc-800 shadow-md rounded-xl p-4 flex items-center justify-between mb-6">
        <div>
          <p className="text-gray-400 text-sm">Saldo disponible</p>
          <p className="text-3xl font-bold text-[#f7b22a]">
            <CountUp end={saldo} duration={1.5} /> BUKK
          </p>
        </div>
        <button
          onClick={() => toast.info("Recarga manual desactivada")}
          className="bg-[#f7b22a] hover:bg-yellow-300 text-black px-4 py-2 rounded-full text-sm flex items-center gap-2 font-semibold transition"
        >
          <FaPlus /> Recargar
        </button>
      </div>
  
      {/* TRANSFERENCIA */}
      <div className="bg-zinc-800 p-4 rounded-xl mb-6 shadow-md">
        <h3 className="font-semibold mb-2 text-white">Transferir BUKK</h3>
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <input
            type="text"
            value={aliasDestino}
            onChange={(e) => setAliasDestino(e.target.value)}
            placeholder="Alias del receptor"
            className="flex-1 px-3 py-1.5 rounded border border-zinc-600 bg-zinc-900 text-white placeholder-gray-400"
          />
          <input
            type="number"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="Monto"
            className="w-24 px-3 py-1.5 rounded border border-zinc-600 bg-zinc-900 text-white placeholder-gray-400"
          />
          <button
            onClick={handleTransferir}
            className="bg-[#f7b22a] hover:bg-yellow-300 text-black px-4 py-1.5 rounded-full text-sm flex items-center gap-2 font-semibold transition"
          >
            <FaExchangeAlt /> Enviar
          </button>
        </div>
      </div>
  
      {/* MOVIMIENTOS */}
      <h3 className="font-semibold text-lg mb-2 text-black">Movimientos</h3>
      <ul className="space-y-2 text-sm">
        {movimientos.length === 0 && (
          <li className="text-gray-400">No hay movimientos aún.</li>
        )}
        {movimientos.map((mov, i) => (
          <li
            key={i}
            className="flex items-center justify-between bg-zinc-800 p-3 rounded-xl shadow-sm"
          >
            <div className="flex items-center gap-2">
              {mov.tipo === "recarga" && <FaArrowDown className="text-green-400" />}
              {mov.tipo === "transferencia" && <FaArrowUp className="text-red-400" />}
              {mov.tipo === "recibido" && <FaArrowDown className="text-blue-400" />}
              <span className="capitalize text-gray-200">
                {mov.tipo === "transferencia"
                  ? `Transferido a ${mov.nombreDestino || mov.destino}`
                  : mov.tipo === "recibido"
                  ? `Recibido de ${mov.nombreOrigen || mov.origen}`
                  : "Recarga manual"}
              </span>
            </div>
            <div className="text-right">
              <span className="font-bold text-white">
                {mov.tipo === "transferencia" ? "-" : "+"}
                {mov.monto} BUKK
              </span>
              <p className="text-xs text-gray-400">{mov.fecha}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
  
}
