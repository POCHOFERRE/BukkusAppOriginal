import React, { useContext, useEffect, useState } from "react";
import { db } from "../config/firebase";
import { UserContext } from "../context/UserContext";
import {
  collection,
  query,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {
  FiInbox,
  FiSend,
  FiClock,
  FiMessageCircle,
  FiCheck,
  FiX,
  FiTrash2,
} from "react-icons/fi";
import BuoDormido from "../components/svgs/BuoDormido";

export default function Ofertas() {
  const { usuarioActivo } = useContext(UserContext);
  const [recibidas, setRecibidas] = useState([]);
  const [enviadas, setEnviadas] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [tab, setTab] = useState("recibidas");
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!usuarioActivo?.id) return;

    const q = query(collection(db, "ofertas"));
    const unsub = onSnapshot(q, async (snap) => {
      const nuevasRecibidas = [];
      const nuevasEnviadas = [];
      const nuevoHistorial = [];

      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const id = docSnap.id;

        let libro = null;
        if (data.libroId) {
          try {
            const libroSnap = await getDoc(doc(db, "libros", data.libroId));
            if (libroSnap.exists()) libro = libroSnap.data();
          } catch (e) {
            console.error("Error cargando libro:", e);
          }
        }

        let usuario = null;
        const usuarioId = data.de === usuarioActivo.id ? data.para : data.de;
        if (usuarioId) {
          try {
            const userSnap = await getDoc(doc(db, "usuarios", usuarioId));
            if (userSnap.exists()) usuario = userSnap.data();
          } catch (e) {
            console.error("Error cargando usuario:", e);
          }
        }

        const ofertaConDatos = { ...data, id, libro, usuario };

        if (data.para === usuarioActivo.id && data.estado === "pendiente") {
          nuevasRecibidas.push(ofertaConDatos);
        } else if (data.de === usuarioActivo.id && data.estado === "pendiente") {
          nuevasEnviadas.push(ofertaConDatos);
        }

        if (
          (data.para === usuarioActivo.id || data.de === usuarioActivo.id) &&
          (data.estado === "aceptada" || data.estado === "rechazada")
        ) {
          nuevoHistorial.push(ofertaConDatos);
        }
      }

      setRecibidas(nuevasRecibidas);
      setEnviadas(nuevasEnviadas);
      setHistorial(nuevoHistorial);
    });

    return () => unsub();
  }, [usuarioActivo]);

  const aceptarOferta = async (oferta) => {
    if (!window.confirm("¿Querés aceptar esta oferta?")) return;
    setCargando(true);
    try {
      await updateDoc(doc(db, "ofertas", oferta.id), { estado: "aceptada" });

      const participantes = [...new Set([oferta.de, oferta.para])];
      await setDoc(doc(db, "chats", oferta.id), {
        participantes,
        creado: Timestamp.now(),
        libroId: oferta.libroId,
        ofertaId: oferta.id,
      });
    } catch (error) {
      console.error("Error al aceptar oferta:", error);
      alert("❌ Hubo un error al aceptar la oferta");
    } finally {
      setCargando(false);
    }
  };

  const rechazarOferta = async (oferta) => {
    if (!window.confirm("¿Querés rechazar esta oferta?")) return;
    setCargando(true);
    try {
      await updateDoc(doc(db, "ofertas", oferta.id), { estado: "rechazada" });
    } catch (error) {
      console.error("Error al rechazar oferta:", error);
      alert("❌ Hubo un error al rechazar la oferta");
    } finally {
      setCargando(false);
    }
  };

  const eliminarOferta = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar esta oferta?")) return;
    try {
      await deleteDoc(doc(db, "ofertas", id));
    } catch (e) {
      console.error("Error al eliminar oferta:", e);
      alert("❌ No se pudo eliminar la oferta");
    }
  };

  const renderOferta = (oferta, esRecibida) => (
    <div
      key={oferta.id}
      className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 space-y-3"
    >
      <div className="flex items-center gap-3">
        {oferta.libro?.imagenes?.[0] && (
          <img
            src={oferta.libro.imagenes[0]}
            alt="Libro"
            className="w-14 h-14 object-cover rounded-md"
          />
        )}
        <div className="flex-1">
          <p className="text-sm text-gray-600">
            <strong>{oferta.usuario?.nombre || "Usuario"}</strong>{" "}
            {esRecibida ? "te ofrece" : "recibió tu propuesta"}:
          </p>
          <p className="text-gray-800 font-semibold">{oferta.oferta}</p>
          {oferta.comentario && (
            <p className="text-sm italic text-gray-500">
              {oferta.comentario}
            </p>
          )}
          {oferta.libro?.nombre && (
            <p className="text-xs text-gray-500 mt-1">
              Por el libro: <strong>{oferta.libro.nombre}</strong>
            </p>
          )}
        </div>
        <button
          onClick={() => eliminarOferta(oferta.id)}
          className="text-red-500 hover:text-red-700"
        >
          <FiTrash2 />
        </button>
      </div>

      {oferta.estado === "aceptada" && (
        <button
          onClick={() => navigate(`/chat/${oferta.id}`)}
          className="mt-2 bg-yellow-400 text-black px-3 py-1 rounded text-sm flex items-center gap-1"
        >
          <FiMessageCircle /> Ir al chat
        </button>
      )}

      {esRecibida && oferta.estado === "pendiente" && (
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => aceptarOferta(oferta)}
            disabled={cargando}
            className="bg-green-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1 disabled:opacity-50"
          >
            <FiCheck /> Aceptar
          </button>
          <button
            onClick={() => rechazarOferta(oferta)}
            disabled={cargando}
            className="bg-red-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1 disabled:opacity-50"
          >
            <FiX /> Rechazar
          </button>
        </div>
      )}
    </div>
  );

  const tabs = [
    { id: "recibidas", label: "Recibidas", icon: <FiInbox /> },
    { id: "enviadas", label: "Enviadas", icon: <FiSend /> },
    { id: "historial", label: "Historial", icon: <FiClock /> },
  ];

  const ofertasMostradas =
    tab === "recibidas"
      ? recibidas
      : tab === "enviadas"
      ? enviadas
      : historial.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);

  return (
    <div className="tour-ofertas max-w-5xl mx-auto px-4 pt-6 pb-8 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Mis Ofertas</h1>
      
      <div className="sticky top-0 z-10 bg-[#fdf6ec] pt-2 pb-2 mb-6">
        <div className="flex flex-wrap justify-center gap-2 border-b border-gray-200 pb-2 text-sm font-medium text-gray-600">
          {tabs.map((p) => (
            <button
              key={p.id}
              onClick={() => setTab(p.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                tab === p.id
                  ? "bg-yellow-200 text-yellow-800 shadow-sm font-semibold"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              <span className="text-base">{p.icon}</span>
              <span className="hidden sm:inline">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {cargando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center">
            <p className="text-lg font-medium text-yellow-700">Procesando solicitud...</p>
            <div className="mt-4 w-12 h-12 border-4 border-yellow-200 border-t-yellow-500 rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {ofertasMostradas.length === 0 ? (
          <div className="flex flex-col items-center mt-10 text-center text-gray-500">
            <BuoDormido size={130} />
            <p className="italic mt-4">
              {tab === "recibidas"
                ? "Aún no recibiste ofertas de otros lectores."
                : tab === "enviadas"
                ? "Todavía no enviaste ninguna propuesta."
                : "Tu historial está vacío por ahora."}
            </p>
          </div>
        ) : (
          ofertasMostradas.map((oferta) =>
            renderOferta(oferta, tab === "recibidas")
          )
        )}
      </div>
    </div>
  );
}
