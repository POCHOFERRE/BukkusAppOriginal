import React, { useState } from "react";
import PropTypes from "prop-types";
import { agruparPorLibro, elegirMasCercano } from "../../utils/libros"; // Asegúrate de importar estas funciones
import CardLibro from "../libro/CardLibro"; // Asegúrate de importar CardLibro
import Modal from "../Modal"; // Modal para mostrar info de usuario
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase"; // ajustá la ruta si tu archivo está en otro nivel


function CarouselPorGenero({
  genero,
  libros = [],
  favoritos = [],
  usuarioActivo = null,
  abrirLogin = () => {},
  setLibroEditando = () => {},
  setMostrarModalEditar = () => {},
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [usuarioCercano, setUsuarioCercano] = useState(null);

  const librosFiltrados = libros.filter(
    (l) => l.genero?.toLowerCase() === genero.toLowerCase() && !l.vendido
  );

  // Agrupar libros por título y autor
  const agrupados = agruparPorLibro(librosFiltrados);

  // Elegir el libro más cercano para cada grupo
  const librosUnicos = elegirMasCercano(agrupados, usuarioActivo?.ciudad);

  const abrirModalUsuario = async (libro) => {
    if (!libro.usuarioId) {
      console.warn("Este libro no tiene un usuario asociado.");
      return;
    }

    try {
      // Obtener los datos del usuario desde la colección de usuarios en Firebase
      const ref = doc(db, "usuarios", libro.usuarioId);  // Buscar el usuario por su ID
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const usuario = snap.data();
        const usuarioCercano = usuario.ciudad === usuarioActivo?.ciudad ? usuario : null;
        setUsuarioCercano(usuarioCercano || usuario);
        setModalVisible(true);
      } else {
        console.warn("No se encontró el usuario.");
      }
    } catch (error) {
      console.error("Error obteniendo los datos del usuario:", error);
    }
  };

  if (librosUnicos.length === 0) return null;

  return (
    <div className="my-6 px-4">
      <h2 className="text-sm font-bold mb-2 text-black-400">{genero}</h2>
      <div className="flex gap-3 overflow-x-auto py-2 no-scrollbar scroll-smooth">
        {librosUnicos.map((libro) => (
          <div key={libro.id} className="snap-start shrink-0">
            <CardLibro
              libro={libro}
              esMio={libro.usuarioId === usuarioActivo?.id}
              usuarioActivo={usuarioActivo}
              favoritos={favoritos}
              setFavoritos={() => {}}
              onEditar={() => {
                if (!usuarioActivo) return abrirLogin();
                setLibroEditando(libro);
                setMostrarModalEditar(true);
              }}
              onLoginClick={abrirLogin}
              abrirModalUsuario={abrirModalUsuario} // Pasamos la función de abrir el modal
            />
          </div>
        ))}
      </div>

      {/* Modal con la información del usuario cercano */}
      {modalVisible && (
        <Modal isOpen={modalVisible} onClose={() => setModalVisible(false)}>
          <h2>Información del usuario</h2>
          {usuarioCercano ? (
            <div>
              <p><strong>Nombre:</strong> {usuarioCercano.nombre}</p>
              <p><strong>Ciudad:</strong> {usuarioCercano.ciudad}</p>
              <p><strong>Intercambio posible:</strong> ¡Está cerca de ti!</p>
            </div>
          ) : (
            <p>No se ha encontrado un usuario cercano o disponible para este libro.</p>
          )}
        </Modal>
      )}
    </div>
  );
}

CarouselPorGenero.propTypes = {
  genero: PropTypes.string.isRequired,
  libros: PropTypes.array.isRequired,
  favoritos: PropTypes.array,
  usuarioActivo: PropTypes.object,
  abrirLogin: PropTypes.func,
  setLibroEditando: PropTypes.func,
  setMostrarModalEditar: PropTypes.func,
};

export default CarouselPorGenero;
