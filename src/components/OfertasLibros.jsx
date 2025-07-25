import React, { useState, useEffect, useContext } from "react";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";
import useModal from "../hooks/useModal";
import Modal from "./Modal";
import useTopNavHeight from "./useTopNavHeight";
import { toast } from "react-toastify";
import { UserContext } from "../context/UserContext";
import {
  obtenerPublicaciones,
  obtenerOfertasParaUsuario,
  obtenerOfertasHechasPorUsuario,
} from "../utils/firebaseHelpers";
import { doc, updateDoc, db } from "../config/firebase";

export default function OfertasLibros() {
  const { usuarioActivo } = useContext(UserContext);
  const [libros, setLibros] = useState([]);
  const [ofertasRecibidas, setOfertasRecibidas] = useState([]);
  const [ofertasEnviadas, setOfertasEnviadas] = useState([]);
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState(null);
  const [verPendientes, setVerPendientes] = useState(true);
  const [verAceptadas, setVerAceptadas] = useState(false);
  const [verRechazadas, setVerRechazadas] = useState(false);
  const { isOpen, open, close } = useModal();
  const [modalMensaje, setModalMensaje] = useState(null);
  const topNavHeight = useTopNavHeight();

  useEffect(() => {
    if (!usuarioActivo?.id) return;
    const cargarDatos = async () => {
      try {
        const publicaciones = await obtenerPublicaciones();
        setLibros(publicaciones);
        const recibidas = await obtenerOfertasParaUsuario(usuarioActivo.id);
        setOfertasRecibidas(recibidas);
        const enviadas = await obtenerOfertasHechasPorUsuario(usuarioActivo.id);
        setOfertasEnviadas(enviadas);
      } catch (e) {
        toast.error("Error cargando ofertas: " + e.message);
      }
    };
    cargarDatos();
  }, [usuarioActivo]);

  const misLibros = libros.filter((p) => p.usuarioId === usuarioActivo?.id);
  const pendientes = ofertasEnviadas.filter((o) => o.aceptado === null);
  const aceptadas = ofertasEnviadas.filter((o) => o.aceptado === true);
  const rechazadas = ofertasEnviadas.filter((o) => o.aceptado === false);

  const actualizarOferta = async (ofertaId, aceptar, libroId) => {
    try {
      await updateDoc(doc(db, `libros/${libroId}/ofertas/${ofertaId}`), {
        aceptado: aceptar,
      });
      close();
      if (aceptar) {
        const oferta = ofertasRecibidas.find((o) => o.id === ofertaId);
        if (oferta) {
          const chatId = `${oferta.de}-${oferta.para}-${libroId}`;
          localStorage.setItem("chatActivo", chatId);
          window.dispatchEvent(new Event("chatUpdate"));
          window.location.href = "/chat";
        }
      } else {
        setModalMensaje("❌ Oferta rechazada.");
      }
    } catch (e) {
      toast.error("Error al actualizar oferta: " + (e.message || e));
    }
  };

  return (
    <div className="px-4 pb-32 space-y-6 overflow-y-auto" style={{ paddingTop: `calc(${topNavHeight}px + env(safe-area-inset-top))`, height: '100vh', boxSizing: 'border-box' }}>
      <h2 className="text-2xl font-bold text-center">📨 Centro de Ofertas</h2>

      {/* Mostrar ofertas recibidas */}
      <div>
        <h3 className="text-xl font-semibold text-oliva mb-4">🎁 Tus libros y ofertas recibidas</h3>
        {misLibros.length === 0 ? (
          <p className="text-gray-600">No publicaste ningún libro aún.</p>
        ) : (
          misLibros.map((libro, i) => {
            const relacionadas = ofertasRecibidas.filter(o => o.productoId === libro.id);
            return (
              <div key={i} className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-lg font-bold">{libro.nombre}</h4>
                  {libro.valorToken && <span className="text-sm text-oliva font-semibold">💰 {libro.valorToken} TK</span>}
                </div>
                <p className="text-sm text-gray-600 mb-2">Busca: <strong>{libro.quiere}</strong></p>
                {relacionadas.length > 0 ? relacionadas.map((of, j) => (
                  <div key={j} className="border-t pt-3 mt-3 space-y-1">
                    <p className="text-sm">🛍️ Ofrece: <strong>{of.oferta}</strong></p>
                    {of.comentario && <p className="italic text-sm text-gray-600">“{of.comentario}”</p>}
                    {of.imagen && <img src={of.imagen} alt="oferta" className="max-h-40 rounded mt-2" />}
                    <div className="mt-2 space-x-2">
                      {of.aceptado === true && <span className="text-green-600 font-semibold">✅ Aceptado</span>}
                      {of.aceptado === false && <span className="text-red-600 font-semibold">❌ Rechazado</span>}
                      {of.aceptado === null && (
                        <>
                          <button className="bg-green-700 text-white px-3 py-1 rounded text-sm" onClick={() => { setOfertaSeleccionada(of); open(); }}>Aceptar</button>
                          <button className="bg-red-600 text-white px-3 py-1 rounded text-sm" onClick={() => actualizarOferta(of.id, false)}>Rechazar</button>
                        </>
                      )}
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500">Aún no recibiste ofertas para este libro.</p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Mostrar ofertas enviadas */}
      <div>
        <h3 className="text-xl font-semibold text-oliva mb-4">📤 Tus ofertas enviadas</h3>
        {[{ titulo: "⏳ Pendientes", data: pendientes, visible: verPendientes, set: setVerPendientes },
          { titulo: "✅ Aceptadas", data: aceptadas, visible: verAceptadas, set: setVerAceptadas },
          { titulo: "❌ Rechazadas", data: rechazadas, visible: verRechazadas, set: setVerRechazadas }].map((grupo, i) => (
          <div key={i} className="mb-6">
            <button onClick={() => grupo.set(!grupo.visible)} className="w-full text-left font-bold text-oliva hover:underline text-lg flex items-center justify-between">
              {grupo.titulo} ({grupo.data.length})
              <span className="text-gray-500 text-sm">{grupo.visible ? <FaChevronDown /> : <FaChevronRight />}</span>
            </button>
            {grupo.visible && (
              <div className="mt-2 space-y-4">
                {grupo.data.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay ofertas en esta categoría.</p>
                ) : grupo.data.map((of, idx) => {
                  const libro = libros.find(p => p.id === of.productoId);
                  return (
                    <div key={idx} className="bg-gray-50 p-4 rounded-lg shadow">
                      <p className="text-sm">🎯 A: <strong>{libro?.nombre || 'Libro'}</strong> — busca <em>{libro?.quiere}</em></p>
                      <p className="text-sm">💬 Ofreciste: <strong>{of.oferta}</strong></p>
                      {of.comentario && <p className="italic text-sm text-gray-600">“{of.comentario}”</p>}
                      {of.imagen && <img src={of.imagen} alt="oferta" className="max-h-40 rounded mt-2" />}
                      <div className="mt-2 flex items-center gap-3 flex-wrap">
                        {of.aceptado === true && <span className="text-green-700 font-semibold">✅ ¡Te aceptaron!</span>}
                        {of.aceptado === false && <span className="text-red-700 font-semibold">❌ Oferta rechazada</span>}
                        {of.aceptado === null && <span className="text-yellow-600 font-semibold">⏳ Pendiente</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {isOpen && (
        <Modal isOpen={isOpen} onClose={close}>
          <h3 className="font-bold text-lg mb-2">¿Aceptar esta oferta?</h3>
          <p className="text-sm mb-4">{ofertaSeleccionada?.oferta}</p>
          <div className="flex justify-end gap-3">
            <button className="bg-green-700 text-white px-4 py-1 rounded-full text-sm" onClick={() => actualizarOferta(ofertaSeleccionada.id, true)}>Confirmar</button>
            <button onClick={close} className="text-gray-600 underline text-sm">Cancelar</button>
          </div>
        </Modal>
      )}

      {modalMensaje && (
        <Modal isOpen={true} onClose={() => setModalMensaje(null)}>
          <p className="text-sm text-center py-4">{modalMensaje}</p>
          <div className="text-center">
            <button onClick={() => setModalMensaje(null)} className="bg-oliva text-white px-4 py-1 rounded-full mt-2 text-sm">OK</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
