import React, { useState, useEffect, useContext } from "react";
import useModal from "../hooks/useModal";
import Modal from "./Modal";
import ModalOferta from "./ModalOferta";
import ModalExito from "./ModalExito";
import PropTypes from "prop-types";
import { FiRepeat } from "react-icons/fi";
import { UserContext } from "../context/UserContext";
import { db } from "../config/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  addDoc,
} from "firebase/firestore";

function OfferButton({ libro }) {
  const { usuarioActivo } = useContext(UserContext);

  const [ofertaPendiente, setOfertaPendiente] = useState(false);
  const [ofertasHechas, setOfertasHechas] = useState([]);
  const { isOpen, open, close } = useModal();
  const [confirmarCompra, setConfirmarCompra] = useState(false);
  const [modalExito, setModalExito] = useState({ mostrar: false, mensaje: "" });

  const MAX_OFERTAS_POR_LIBRO = 3;

  useEffect(() => {
    const obtenerOfertas = async () => {
      if (!usuarioActivo?.id || !libro?.id) return;

      try {
        const q = query(
          collection(db, "ofertas"),
          where("de", "==", usuarioActivo.id),
          where("productoId", "==", libro.id)
        );

        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => doc.data());
        setOfertasHechas(data);

        const ultima = data[data.length - 1];
        setOfertaPendiente(!!(ultima && ultima.aceptado === null));
      } catch (error) {
        console.error("Error al obtener ofertas:", error);
      }
    };

    obtenerOfertas();
  }, [libro?.id, usuarioActivo?.id]);

  const enviarOferta = async ({ oferta, comentario, imagen }) => {
    if (!libro?.id || !usuarioActivo?.id) {
      setModalExito({
        mostrar: true,
        mensaje: "Error: Datos de usuario o libro no disponibles.",
      });
      return;
    }

    if (ofertasHechas.length >= MAX_OFERTAS_POR_LIBRO) {
      setModalExito({
        mostrar: true,
        mensaje: "Ya hiciste el máximo de 3 ofertas para este libro.",
      });
      return;
    }

    try {
      const { crearOferta } = await import("../utils/firebaseHelpers");

      await crearOferta({
        libroId: libro.id,
        libroNombre: libro.nombre || libro.titulo || "Libro sin nombre",
        para: libro.usuarioId || libro.userId,
        de: usuarioActivo.id,
        deNombre: usuarioActivo.nombre || usuarioActivo.email || "Usuario",
        oferta,
        comentario: comentario || "",
        imagen: imagen || "",
        aceptado: null,
        fecha: new Date().toISOString(),
      });

      setModalExito({ mostrar: true, mensaje: "¡Oferta enviada con éxito!" });
      close();
    } catch (e) {
      console.error("Error al enviar oferta:", e);
      setModalExito({
        mostrar: true,
        mensaje: "Error al enviar oferta: " + (e.message || e),
      });
    }
  };

  // 💰 Canjear libro con tokens
  const manejarCanje = async () => {
    if (!usuarioActivo || !usuarioActivo.id) return;

    try {
      const userRef = doc(db, "usuarios", usuarioActivo.id);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) throw new Error("Usuario no encontrado");

      const userData = userSnap.data();
      const saldoActual = userData.saldoTokens || 0;

      if (saldoActual < libro.valorToken) {
        setModalExito({
          mostrar: true,
          mensaje: "Saldo insuficiente para realizar el canje.",
        });
        setConfirmarCompra(false);
        return;
      }

      // 🔁 Descontar saldo
      await updateDoc(userRef, {
        saldoTokens: saldoActual - libro.valorToken,
      });

      // 🧾 Registrar movimiento
      await addDoc(collection(db, "usuarios", usuarioActivo.id, "movimientos"), {
        tipo: "canje",
        libroId: libro.id,
        libroNombre: libro.nombre || libro.titulo || "Libro sin nombre",
        valor: -libro.valorToken,
        fecha: new Date().toISOString(),
      });

      setConfirmarCompra(false);
      setModalExito({
        mostrar: true,
        mensaje: `¡Canje de «${libro.nombre}» confirmado!`,
      });
    } catch (e) {
      console.error("Error en el canje:", e);
      setConfirmarCompra(false);
      setModalExito({
        mostrar: true,
        mensaje: "Error al confirmar el canje.",
      });
    }
  };

  if (!libro || typeof libro !== "object") {
    return null;
  }

  return (
    <>
      <div className="relative z-10 flex justify-center items-center">
        <button
          disabled={ofertaPendiente || ofertasHechas.length >= MAX_OFERTAS_POR_LIBRO}
          onClick={open}
          className={`transition text-sm font-bold flex items-center justify-center gap-2 px-4 py-2 rounded-full shadow-md ${
            ofertaPendiente || ofertasHechas.length >= MAX_OFERTAS_POR_LIBRO
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-[#f7b22a] text-black hover:brightness-110"
          }`}
          style={{
            clipPath: "polygon(15% 0, 85% 0, 100% 100%, 0% 100%)",
          }}
        >
          <FiRepeat className="text-base" />
          {ofertaPendiente
            ? "Pendiente"
            : ofertasHechas.length >= MAX_OFERTAS_POR_LIBRO
            ? "Límite alcanzado"
            : "Ofertar"}
        </button>
      </div>

      <ModalOferta
        isOpen={isOpen}
        onClose={close}
        producto={libro}
        onEnviarOferta={enviarOferta}
        onComprarConTokens={() => setConfirmarCompra(true)}
      />

      <Modal isOpen={confirmarCompra} onClose={() => setConfirmarCompra(false)}>
        <div className="text-center text-gray-800 space-y-4 p-4 text-sm">
          <h3 className="text-lg font-bold text-[#f7b22a]">¿Confirmás esta compra?</h3>
          <p>Vas a usar <strong>{libro.valorToken} BUKKcoins</strong> para adquirir:</p>
          <p className="italic text-gray-600">«{libro.nombre}»</p>
          <div className="flex justify-center gap-4 pt-2">
            <button
              onClick={manejarCanje}
              className="bg-[#f7b22a] text-white px-4 py-2 rounded-full text-sm hover:brightness-110 transition"
            >
              Sí, confirmar
            </button>
            <button
              onClick={() => setConfirmarCompra(false)}
              className="bg-gray-200 px-4 py-2 rounded-full text-sm hover:bg-gray-300 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      <ModalExito
        isOpen={modalExito.mostrar}
        mensaje={modalExito.mensaje}
        onClose={() => setModalExito({ mostrar: false, mensaje: "" })}
      />
    </>
  );
}

OfferButton.propTypes = {
  libro: PropTypes.object.isRequired,
};

export default OfferButton;
