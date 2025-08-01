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
  FiX,
  FiTrash2,
  FiBookOpen
} from "react-icons/fi";
import BuoDormido from "../components/svgs/BuoDormido";

export default function Ofertas() {
  const { usuarioActivo } = useContext(UserContext);
  const [recibidas, setRecibidas] = useState([]);
  const [enviadas, setEnviadas] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [tab, setTab] = useState("recibidas");
  const [cargando, setCargando] = useState(false);
  const [mostrarBiblioteca, setMostrarBiblioteca] = useState(false);
  const [bibliotecaLibros, setBibliotecaLibros] = useState([]);
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState(null);
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

  const abrirBiblioteca = async (oferta) => {
    try {
      setOfertaSeleccionada(oferta);
      setCargando(true);
      const librosCargados = [];
      for (const libroId of oferta.bibliotecaVisible || []) {
        const libroSnap = await getDoc(doc(db, "libros", libroId));
        if (libroSnap.exists()) {
          librosCargados.push({ id: libroSnap.id, ...libroSnap.data() });
        }
      }
      setBibliotecaLibros(librosCargados);
      setMostrarBiblioteca(true);
    } catch (error) {
      console.error("Error cargando biblioteca:", error);
    } finally {
      setCargando(false);
    }
  };

  const aceptarOferta = async (oferta, libroElegidoId) => {
    if (!window.confirm("¿Querés aceptar esta oferta con este libro?")) return;
    setCargando(true);
    try {
      await updateDoc(doc(db, "ofertas", oferta.id), { 
        estado: "aceptada", 
        libroAceptadoId: libroElegidoId 
      });

      const participantes = [...new Set([oferta.de, oferta.para])];
      await setDoc(doc(db, "chats", oferta.id), {
        participantes,
        creado: Timestamp.now(),
        libroId: oferta.libroId,
        ofertaId: oferta.id,
      });
      setMostrarBiblioteca(false);
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
      className={`p-5 rounded-2xl border transition-all duration-200 ${
        oferta.estado === "aceptada"
          ? "border-green-100 bg-white shadow-sm hover:shadow-md"
          : oferta.estado === "rechazada"
          ? "border-gray-100 bg-gray-50 opacity-70"
          : "border-gray-100 bg-white shadow-sm hover:shadow-md"
      }`}
    >
      {oferta.libro?.imagenes?.[0] && (
        <img
          src={oferta.libro.imagenes[0]}
          alt="Libro"
          className="w-14 h-14 object-cover rounded-md"
        />
      )}
      <div className="flex-1">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-medium text-gray-900 text-base">
            {esRecibida ? "Te ofrecieron" : "Ofreciste"} &quot;{oferta.libroSolicitado?.nombre || "Libro"}&quot;
          </h3>
          <span
            className={`text-xs font-medium px-3 py-1 rounded-full ${
              oferta.estado === "aceptada"
                ? "bg-green-50 text-green-700 border border-green-100"
                : oferta.estado === "rechazada"
                ? "bg-gray-50 text-gray-500 border border-gray-100"
                : "bg-amber-50 text-amber-700 border border-amber-100"
            }`}
          >
            {oferta.estado === "aceptada"
              ? "Aceptada"
              : oferta.estado === "rechazada"
              ? "Rechazada"
              : "Pendiente"}
          </span>
        </div>
        <p className="text-gray-800 font-semibold">{oferta.oferta}</p>
        {oferta.comentario && (
          <p className="text-sm italic text-gray-500">{oferta.comentario}</p>
        )}
      </div>
      <button
        onClick={() => eliminarOferta(oferta.id)}
        className="text-red-500 hover:text-red-700"
      >
        <FiTrash2 />
      </button>

      {oferta.estado === "aceptada" && (
        <button
          onClick={() => navigate(`/chat/${oferta.id}`)}
          className="mt-3 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors border border-blue-100 w-full justify-center"
        >
          <FiMessageCircle className="w-4 h-4" />
          <span>Ir al chat</span>
        </button>
      )}

      {esRecibida && oferta.estado === "pendiente" && (
        <div className="flex flex-col sm:flex-row gap-2 mt-3">
          {oferta.tipoOferta === "biblioteca" && (
            <button
              onClick={() => abrirBiblioteca(oferta)}
              className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors border border-blue-100"
            >
              <FiBookOpen className="w-4 h-4" />
              <span>Ver biblioteca</span>
            </button>
          )}
          <button
            onClick={() => rechazarOferta(oferta)}
            disabled={cargando}
            className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiX className="w-4 h-4" />
            <span>Rechazar</span>
          </button>
        </div>
      )}
    </div>
  );

  const tabs = [
    { id: "recibidas", label: "Recibidas", icon: <FiInbox className="w-4 h-4" /> },
    { id: "enviadas", label: "Enviadas", icon: <FiSend className="w-4 h-4" /> },
    { id: "historial", label: "Historial", icon: <FiClock className="w-4 h-4" /> },
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
      
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm pt-4 pb-3 mb-6 border-b border-gray-100">
        <div className="flex justify-center">
          <div className="inline-flex bg-gray-100 p-1 rounded-xl">
            {tabs.map((p) => (
              <button
                key={p.id}
                onClick={() => setTab(p.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === p.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span>{p.icon}</span>
                <span className="hidden sm:inline">{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {cargando && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl text-center max-w-sm w-full mx-4">
            <p className="text-base font-medium text-gray-800">Procesando solicitud...</p>
            <div className="mt-4 w-10 h-10 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ofertasMostradas.length === 0 ? (
          <div className="col-span-full flex flex-col items-center py-12 px-4 text-center">
            <BuoDormido size={120} className="opacity-80" />
            <p className="mt-6 text-gray-500 max-w-md">
              {tab === "recibidas"
                ? "Aún no recibiste ofertas de otros lectores. Cuando lo hagas, aparecerán aquí."
                : tab === "enviadas"
                ? "Todavía no enviaste ninguna propuesta. ¡Encuentra un libro que te interese y haz tu primera oferta!"
                : "Tu historial de ofertas aceptadas o rechazadas aparecerá aquí."}
            </p>
          </div>
        ) : (
          ofertasMostradas.map((oferta) =>
            renderOferta(oferta, tab === "recibidas")
          )
        )}
      </div>

      {/* 📌 Modal Biblioteca */}
      {mostrarBiblioteca && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-lg w-full shadow-lg relative">
            <h3 className="text-lg font-bold mb-3">Biblioteca del oferente</h3>
            <button
              className="absolute top-2 right-2 text-sm text-gray-500 hover:text-red-500"
              onClick={() => setMostrarBiblioteca(false)}
            >
              ✕
            </button>
            {bibliotecaLibros.length === 0 ? (
              <p className="text-sm text-gray-500">No hay libros para mostrar.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                {bibliotecaLibros.map((libro) => (
                  <div
                    key={libro.id}
                    className="border rounded p-2 flex flex-col items-center"
                  >
                    <img
                      src={libro.imagenes?.[0] || "https://via.placeholder.com/60x90"}
                      alt={libro.nombre}
                      className="w-20 h-28 object-cover rounded"
                    />
                    <p className="text-xs mt-1 text-center line-clamp-2">{libro.nombre}</p>
                    <button
                      onClick={() => aceptarOferta(ofertaSeleccionada, libro.id)}
                      className="mt-2 bg-green-500 text-white px-2 py-1 rounded text-xs"
                    >
                      Aceptar con este
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
