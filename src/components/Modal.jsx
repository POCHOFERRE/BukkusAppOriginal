import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";

export default function Modal({ isOpen, onClose, children }) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    const body = document.querySelector("body");
    document.addEventListener("keydown", handleKeyDown);
    body.classList.add("overflow-hidden");

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      body.classList.remove("overflow-hidden");
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const modalRoot = document.getElementById("modal-root");
  if (!modalRoot) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn px-2"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-zinc-900 rounded-2xl shadow-xl max-w-md w-full p-6 relative text-white">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-white hover:text-yellow-400 text-xl font-bold"
          aria-label="Cerrar"
        >
          ✕
        </button>
        {children}
      </div>
    </div>,
    modalRoot
  );
}

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};
