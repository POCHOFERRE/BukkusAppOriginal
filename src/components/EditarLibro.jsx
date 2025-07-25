import React, { useState } from "react";
import PropTypes from "prop-types";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import {
  FiBookOpen, FiUser, FiHome, FiCalendar,
  FiRefreshCw, FiDollarSign, FiGlobe, FiTrash2, FiSave
} from "react-icons/fi";

export default function EditarLibro({ libro, onClose, recargarProductos }) {
  const [nombre, setNombre] = useState(libro.nombre || "");
  const [autor, setAutor] = useState(libro.autor || "");
  const [editorial, setEditorial] = useState(libro.editorial || "");
  const [anio, setAnio] = useState(libro.anio || "");
  const [estadoLibro, setEstadoLibro] = useState(libro.estadoLibro || "");
  const [quiere, setQuiere] = useState(libro.quiere || "");
  const [genero, setGenero] = useState(libro.genero || "Ficción");
  const [sinopsis, setSinopsis] = useState(libro.sinopsis || "");
  const [mostrarModal, setMostrarModal] = useState(null);

  const guardarCambios = async () => {
    try {
      await updateDoc(doc(db, "libros", libro.id), {
        nombre, autor, editorial, anio, estadoLibro, quiere, genero, sinopsis,
      });
      setMostrarModal("exito");
      recargarProductos?.();
      setTimeout(() => {
        setMostrarModal(null);
        onClose?.();
      }, 2000);
    } catch (e) {
      setMostrarModal("error");
    }
  };

  const eliminarPublicacion = () => setMostrarModal("confirmar");

  const confirmarEliminar = async () => {
    try {
      await deleteDoc(doc(db, "libros", libro.id));
      recargarProductos?.();
      onClose?.();
    } catch (e) {
      setMostrarModal("error");
    }
  };

  return (
    <>
      <Modal onClose={onClose}>
        <div className="space-y-5">
          <h2 className="text-center text-2xl font-bold text-[#f7b22a] mb-2">📚 Editar publicación</h2>

          {libro.imagenes?.length > 0 && (
            <div className="w-full flex justify-center">
              <img
                src={libro.imagenes[0]}
                alt="Vista previa del libro"
                className="rounded-xl max-h-52 object-contain shadow-lg mb-4"
              />
            </div>
          )}

          <Campo texto="Título del libro" val={nombre} setVal={setNombre} icon={<FiBookOpen />} placeholder="Ej. El principito" />
          <Campo texto="Autor" val={autor} setVal={setAutor} icon={<FiUser />} placeholder="Ej. Antoine de Saint-Exupéry" />
          <Campo texto="Editorial" val={editorial} setVal={setEditorial} icon={<FiHome />} placeholder="Ej. Planeta" />
          <Campo texto="Año" val={anio} setVal={setAnio} icon={<FiCalendar />} type="number" placeholder="Ej. 1943" />
          <Select texto="Estado del libro" val={estadoLibro} setVal={setEstadoLibro} opciones={["Usado", "Muy usado", "Subrayado"]} icon={<FiRefreshCw />} />
          <Campo texto="¿Qué querés a cambio?" val={quiere} setVal={setQuiere} icon={<FiDollarSign />} placeholder="Ej. Otro libro, tokens..." />
          <Select texto="Género" val={genero} setVal={setGenero} opciones={[ "Ficción", "No Ficción", "Ciencia Ficción", "Fantasía", "Romance", "Misterio", "Terror", "Aventura",
  "Drama", "Thriller", "Humor", "Realismo Mágico", "Distopía", "Utopía", "Literatura Contemporánea", "Clásicos",
  "Ensayo", "Filosofía", "Ciencia", "Matemáticas", "Historia", "Psicología", "Educación", "Política", "Sociología",
  "Autoayuda", "Espiritualidad", "Religión", "Mindfulness", "Crecimiento Personal", "Salud y Bienestar",
  "Negocios", "Empresarial", "Marketing", "Economía", "Finanzas", "Tecnología", "Programación", "Ingeniería", "Derecho", "Medicina",
  "Juvenil", "Infantil", "Cuentos", "Didácticos", "Educativos",
  "Biografía", "Autobiografía", "Memorias", "Crónica", "Viajes",
  "Arte", "Música", "Fotografía", "Cocina", "Deportes", "Jardinería", "Mascotas", "Hogar y Familia", "Erotismo"]} icon={<FiGlobe />} />

          <div>
            <label className="text-sm font-semibold mb-1 block">📖 Sinopsis</label>
            <textarea
              value={sinopsis}
              onChange={(e) => setSinopsis(e.target.value)}
              className="input-bukkus resize-none text-sm"
              rows={6}
              placeholder="Contanos brevemente de qué trata el libro..."
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t mt-4">
            <button
              onClick={eliminarPublicacion}
              className="flex items-center justify-center gap-2 bg-red-100 text-red-600 hover:bg-red-200 px-4 py-2 rounded-full text-sm transition"
            >
              <FiTrash2 /> Eliminar publicación
            </button>
            <button
              onClick={guardarCambios}
              className="flex items-center justify-center gap-2 bg-[#f7b22a] text-black px-4 py-2 rounded-full shadow hover:bg-yellow-400 text-sm transition"
            >
              <FiSave /> Guardar cambios
            </button>
          </div>
        </div>
      </Modal>

      {mostrarModal === "confirmar" && (
        <Modal onClose={() => setMostrarModal(null)}>
          <p className="text-center text-lg font-medium text-gray-800">¿Eliminar esta publicación?</p>
          <div className="flex justify-center mt-5">
            <button
              onClick={confirmarEliminar}
              className="bg-red-600 text-white px-5 py-2 rounded-full text-sm hover:bg-red-700 transition"
            >
              Confirmar eliminación
            </button>
          </div>
        </Modal>
      )}

      {mostrarModal === "exito" && (
        <Modal onClose={() => { setMostrarModal(null); onClose?.(); }}>
          <p className="text-center text-green-700 text-lg">✅ Cambios guardados correctamente</p>
        </Modal>
      )}

      {mostrarModal === "error" && (
        <Modal onClose={() => setMostrarModal(null)}>
          <p className="text-center text-red-700 text-lg">❌ Ocurrió un error al guardar o eliminar</p>
        </Modal>
      )}
    </>
  );
}

// Subcomponentes reutilizables

function Campo({ texto, val, setVal, icon, placeholder, type = "text" }) {
  return (
    <div>
      <label className="text-sm font-semibold flex items-center gap-2 mb-1">{icon} {texto}</label>
      <input
        type={type}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={placeholder}
        className="input-bukkus"
      />
    </div>
  );
}

function Select({ texto, val, setVal, opciones, icon }) {
  return (
    <div>
      <label className="text-sm font-semibold flex items-center gap-2 mb-1">{icon} {texto}</label>
      <select
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="input-bukkus"
      >
        <option value="">Seleccionar</option>
        {opciones.map((opt, i) => (
          <option key={i} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center overflow-auto p-4">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 text-xl"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

// Validaciones
Campo.propTypes = {
  texto: PropTypes.string.isRequired,
  val: PropTypes.string.isRequired,
  setVal: PropTypes.func.isRequired,
  icon: PropTypes.node,
  placeholder: PropTypes.string,
  type: PropTypes.string,
};

Select.propTypes = {
  texto: PropTypes.string.isRequired,
  val: PropTypes.string.isRequired,
  setVal: PropTypes.func.isRequired,
  opciones: PropTypes.arrayOf(PropTypes.string).isRequired,
  icon: PropTypes.node,
};

Modal.propTypes = {
  children: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
};

EditarLibro.propTypes = {
  libro: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nombre: PropTypes.string,
    autor: PropTypes.string,
    editorial: PropTypes.string,
    anio: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    estadoLibro: PropTypes.string,
    quiere: PropTypes.string,
    genero: PropTypes.string,
    sinopsis: PropTypes.string,
    imagenes: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  recargarProductos: PropTypes.func,
};
