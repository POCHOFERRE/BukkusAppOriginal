import React from "react";
import Modal from "./Modal";
import { FaCheckCircle } from "react-icons/fa";
import PropTypes from "prop-types";

export default function ModalExito({ isOpen, mensaje, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center space-y-4 p-6 bg-zinc-900 rounded-xl text-white shadow-md">

        {/* Ícono de éxito */}
        <div className="flex justify-center">
          <FaCheckCircle className="text-green-400 text-6xl animate-pulse drop-shadow" />
        </div>

        {/* Mensaje principal */}
        <h2 className="text-lg font-bold">¡Listo! 🎉</h2>
        <p className="text-sm text-gray-300">{mensaje}</p>

        {/* Botón */}
        <button
          onClick={onClose}
          className="mt-4 bg-[#f7b22a] hover:bg-yellow-300 text-black font-semibold px-6 py-2 rounded-full transition"
        >
          Seguir explorando
        </button>
      </div>
    </Modal>
  );
}

ModalExito.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  mensaje: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};
