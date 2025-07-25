import React, { useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { UserContext } from "../context/UserContext";
import { db } from "../config/firebase";
import {
  collection,
  onSnapshot,
  doc,
} from "firebase/firestore";

import PreviewLibroModal from "../components/libro/PreviewLibroModal";
import HeroCarouselDestacados from "../components/home/HeroCarouselDestacados";
import EditarLibro from "../components/EditarLibro";
import BukkusLogin from "../components/BukkusLogin";
import Modal from "../components/Modal";
import CardLibro from "../components/libro/CardLibro";
import BuoDormido from "../components/svgs/BuoDormido";
import TourOnboarding from "../components/TourOnboarding";
import { FiLock } from "react-icons/fi";

function Home({ busqueda = "" }) {
  const { usuarioActivo, cargandoSesion } = useContext(UserContext);
  const [libros, setLibros] = useState([]);
  const [favoritos, setFavoritos] = useState([]);
  const [showLogin, setShowLogin] = useState(false);
  const [libroEditando, setLibroEditando] = useState(null);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [libroSeleccionado, setLibroSeleccionado] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Traer libros
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "libros"), (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setLibros(docs);
    });
    return () => unsub();
  }, []);

  // Favoritos
  useEffect(() => {
    if (!usuarioActivo?.id) return;
    const unsub = onSnapshot(doc(db, "usuarios", usuarioActivo.id), (docSnap) => {
      const datos = docSnap.data();
      const favs = Array.isArray(datos?.favoritos) ? datos.favoritos : [];
      localStorage.setItem(`favoritos_${usuarioActivo.id}`, JSON.stringify(favs));
      setFavoritos(favs);
    });
    return () => unsub();
  }, [usuarioActivo]);

  const abrirLogin = () => setShowLogin(true);

  const librosFiltrados = libros
    .filter((l) => !l.destacado)
    .filter((l) => {
      if (!busqueda.trim()) return true;
      const q = busqueda.trim().toLowerCase();
      return (
        l.nombre?.toLowerCase().includes(q) ||
        l.descripcion?.toLowerCase().includes(q) ||
        l.ciudad?.toLowerCase().includes(q)
      );
    });

  const agrupadosPorTituloGenero = librosFiltrados.reduce((acc, libro) => {
    const clave = `${libro.titulo?.toLowerCase()}__${libro.autor?.toLowerCase()}__${libro.genero || "Otros"}`;
    const existente = acc.find((g) => g.clave === clave);
    if (existente) {
      existente.publicaciones.push(libro);
    } else {
      acc.push({
        clave,
        titulo: libro.titulo,
        autor: libro.autor,
        genero: libro.genero || "Otros",
        publicaciones: [libro],
      });
    }
    return acc;
  }, []);

  const agrupadosPorGenero = agrupadosPorTituloGenero.reduce((acc, grupo) => {
    const genero = grupo.genero || "Otros";
    if (!acc[genero]) acc[genero] = [];
    acc[genero].push(grupo);
    return acc;
  }, {});

  const handleAbrirModalUsuario = (grupo) => {
    setLibroSeleccionado(grupo);
    setModalOpen(true);
  };

  if (cargandoSesion) {
    return (
      <div className="flex flex-col items-center justify-center mt-10 text-gray-600">
        <BuoDormido size={120} />
        <p className="mt-4 text-sm">Cargando sesión...</p>
      </div>
    );
  }

  return (
    <div className="pb-32 no-scrollbar">
      {/* Tour si está logueado */}
      {usuarioActivo && <TourOnboarding usuarioActivo={usuarioActivo} />}

      {/* Login */}
      {!usuarioActivo && showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur">
          <div className="w-full max-w-md p-4 rounded-xl">
            <BukkusLogin onClose={() => setShowLogin(false)} />
          </div>
        </div>
      )}

      {!usuarioActivo && !showLogin && (
        <div className="flex flex-col items-center justify-center mt-8 text-center px-4">
          <div className="text-4xl mb-2">📚</div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">Bienvenido a BuKKus</h2>
          <p className="text-gray-600 mb-4 text-sm">
            Iniciá sesión para descubrir libros y comenzar a intercambiar.
          </p>
          <button
            onClick={abrirLogin}
            className="bg-yellow-400 text-black px-5 py-2 rounded-full shadow-md hover:bg-yellow-500 transition"
          >
            Iniciar sesión
          </button>
        </div>
      )}

      {/* Modal editar libro */}
      {mostrarModalEditar && usuarioActivo && (
        <Modal isOpen={mostrarModalEditar} onClose={() => setMostrarModalEditar(false)}>
          <EditarLibro
            libro={libroEditando}
            onClose={() => setMostrarModalEditar(false)}
            recargarLibros={() => window.dispatchEvent(new Event("librosActualizados"))}
          />
        </Modal>
      )}

      {/* Carrusel destacados */}
      <div className="text-center mt-2 tour-destacados ">
  <h2 className="mb-2 text-lg font-bold text-black">Libros destacados</h2>
</div>
      <HeroCarouselDestacados
        libros={libros.filter((l) => l.destacado)}
        onClickLibro={(libro) => setLibroSeleccionado(libro)}
      />

      {/* Listado agrupado por género */}
      {Object.entries(agrupadosPorGenero).map(([genero, grupos]) => (
        <div key={genero} className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 px-4 mb-2">{genero}</h3>
          <div className="overflow-x-auto px-2 no-scrollbar">
            <div className="flex gap-4">
            {grupos.map((grupo, idx) => {
  const libroRepresentativo = grupo.publicaciones[0];
  const isFirstCard = idx === 0;
  return (
    <div
      key={idx}
      className={`card-libro min-w-[200px] max-w-[240px] w-full relative ${isFirstCard ? "tour-card" : ""}`}
    >
                    {!usuarioActivo && (
                      <div
                        onClick={abrirLogin}
                        className="absolute inset-0 bg-black bg-opacity-60 text-white flex flex-col items-center justify-center text-xs font-semibold rounded-lg cursor-pointer z-20"
                      >
                        <FiLock className="text-2xl mb-1" />
                        Iniciá sesión para interactuar
                      </div>
                    )}
                    <CardLibro
                      libro={{
                        ...libroRepresentativo,
                        cantidad: grupo.publicaciones.length,
                      }}
                      esMio={usuarioActivo?.id === libroRepresentativo.usuarioId}
                      onEditar={() => {
                        setLibroEditando(libroRepresentativo);
                        setMostrarModalEditar(true);
                      }}
                      onLoginClick={abrirLogin}
                      favoritos={favoritos}
                      setFavoritos={setFavoritos}
                      usuarioActivo={usuarioActivo}
                      abrirModalUsuario={() => handleAbrirModalUsuario(grupo)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      {/* Modal preview libro */}
      {libroSeleccionado && (
        <PreviewLibroModal
          libro={libroSeleccionado}
          onClose={() => setLibroSeleccionado(null)}
        />
      )}

      {/* Modal usuarios que publicaron */}
      {modalOpen && libroSeleccionado && (
        <Modal onClose={() => setModalOpen(false)}>
          <h2 className="text-2xl font-bold">{libroSeleccionado.titulo}</h2>
          <p className="text-xl text-gray-700">{libroSeleccionado.autor}</p>
          <img
            src={libroSeleccionado.publicaciones[0]?.imagen}
            alt={libroSeleccionado.titulo}
            className="w-full h-64 object-cover mt-4 rounded-lg"
          />
          <h3 className="mt-4 text-xl font-semibold">Usuarios que lo publicaron:</h3>
          <ul className="mt-2">
            {libroSeleccionado.publicaciones.map((publi, idx) => (
              <li key={idx} className="flex justify-between items-center py-1">
                <span>{publi.usuario || "Anónimo"}</span>
                <span>{publi.ciudad || "Sin ciudad"}</span>
              </li>
            ))}
          </ul>
        </Modal>
      )}
    </div>
  );
}

Home.propTypes = {
  busqueda: PropTypes.string,
};

export default Home;