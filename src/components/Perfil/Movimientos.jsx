import React, { useContext, useEffect, useState, useCallback } from "react";
import { UserContext } from "../../context/UserContext"; 
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs
} from "firebase/firestore";
import { db } from "../../config/firebase";
import {
  FaArrowUp,
  FaArrowDown,
  FaCoins,
  FaSpinner
} from "react-icons/fa";
import BuoSinDinero from "../svgs/BuoSinDinero";

export default function Movimientos() {
  const { usuarioActivo } = useContext(UserContext);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [ultimoDoc, setUltimoDoc] = useState(null);
  const [hayMas, setHayMas] = useState(true);
  const MOVIMIENTOS_POR_PAGINA = 15;

  // Cargar movimientos iniciales
  useEffect(() => {
    if (!usuarioActivo?.id) return;

    setCargando(true);
    setMovimientos([]);
    setUltimoDoc(null);
    setHayMas(true);

    const q = query(
      collection(db, "movimientos"),
      where("usuarioId", "==", usuarioActivo.id),
      orderBy("fecha", "desc"),
      limit(MOVIMIENTOS_POR_PAGINA)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        if (!snapshot.empty) {
          const datos = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setMovimientos(datos);
          setUltimoDoc(snapshot.docs[snapshot.docs.length - 1]);
          setHayMas(snapshot.docs.length === MOVIMIENTOS_POR_PAGINA);
        } else {
          setMovimientos([]);
          setHayMas(false);
        }
        setCargando(false);
      },
      (error) => {
        console.error("Error al cargar movimientos:", error);
        setCargando(false);
      }
    );

    return () => unsubscribe();
  }, [usuarioActivo]);

  // Función para cargar más movimientos
  const cargarMasMovimientos = useCallback(async () => {
    if (!usuarioActivo?.id || !ultimoDoc || !hayMas) return;
    
    setCargandoMas(true);
    
    try {
      const q = query(
        collection(db, "movimientos"),
        where("usuarioId", "==", usuarioActivo.id),
        orderBy("fecha", "desc"),
        startAfter(ultimoDoc),
        limit(MOVIMIENTOS_POR_PAGINA)
      );

      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const nuevosMovimientos = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        setMovimientos(prev => [...prev, ...nuevosMovimientos]);
        setUltimoDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHayMas(snapshot.docs.length === MOVIMIENTOS_POR_PAGINA);
      } else {
        setHayMas(false);
      }
    } catch (error) {
      console.error("Error al cargar más movimientos:", error);
    } finally {
      setCargandoMas(false);
    }
  }, [usuarioActivo, ultimoDoc, hayMas]);

  // Manejar scroll para carga infinita
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop < 
        document.documentElement.offsetHeight - 300 || 
        cargandoMas || 
        !hayMas
      ) {
        return;
      }
      cargarMasMovimientos();
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [cargandoMas, hayMas, cargarMasMovimientos]);

  // Mostrar loading
  if (cargando && movimientos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <FaSpinner className="animate-spin text-2xl text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">Cargando movimientos...</p>
      </div>
    );
  }

  // Si no hay movimientos, mostrar búho
  if (movimientos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-gray-600">
        <BuoSinDinero size={140} />
        <p className="mt-4 text-sm">Todavía no hay movimientos en tu billetera.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-2">
      {movimientos.map((mov) => (
        <div
          key={mov.id}
          className={`flex items-center justify-between border rounded-xl px-4 py-2 shadow-sm bg-white/80 ${
            mov.tipo === "ingreso" ? "border-green-300" : "border-red-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`text-lg p-2 rounded-full ${
                mov.tipo === "ingreso"
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {mov.tipo === "ingreso" ? <FaArrowDown /> : <FaArrowUp />}
            </div>
            <div>
              <p className="font-medium text-gray-800">{mov.descripcion}</p>
              <p className="text-xs text-gray-500">
                {new Date(mov.fecha?.toDate?.()).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-yellow-600 font-bold text-sm">
            <FaCoins />
            {mov.monto}
          </div>
        </div>
      ))}
      
      {/* Loading indicator al final de la lista */}
      {cargandoMas && (
        <div className="flex justify-center py-4">
          <FaSpinner className="animate-spin text-gray-400" />
        </div>
      )}
      
      {/* Mensaje cuando no hay más movimientos */}
      {!hayMas && movimientos.length > 0 && (
        <div className="text-center py-4 text-sm text-gray-500">
          No hay más movimientos para mostrar
        </div>
      )}
    </div>
  );
}
