import React, { useContext, useEffect, useState, useCallback } from "react";
import { UserContext } from "../../context/UserContext";
import { doc, getDocs, collection, query, where, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import {
  FaTrash,
  FaShareAlt,
  FaArrowLeft,
  FaThLarge,
  FaList,
  FaWhatsapp
} from "react-icons/fa";
import CardLibro from "../libro/CardLibro";
import { useNavigate } from "react-router-dom";
import BuoSinLibros from "../svgs/BuoSinLibros";
export default function Favoritos() {
  const { usuarioActivo } = useContext(UserContext);
  const [favoritos, setFavoritos] = useState([]);
  const [favoritosPorGenero, setFavoritosPorGenero] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [vistaGaleria, setVistaGaleria] = useState(false);
  const [, setCargando] = useState(true);
  const navigate = useNavigate();
  
  // Cache para usuarios ya cargados
  const usuariosCache = React.useRef(new Map());

  const cargarDatosUsuarios = useCallback(async (userIds) => {
    // Filtrar IDs ya en caché
    const idsNoEnCache = [...new Set(userIds)].filter(
      id => id && !usuariosCache.current.has(id)
    );

    if (idsNoEnCache.length === 0) return;

    // Obtener usuarios en lote (en grupos de 10 por limitaciones de Firestore)
    const batchSize = 10;
    for (let i = 0; i < idsNoEnCache.length; i += batchSize) {
      const batch = idsNoEnCache.slice(i, i + batchSize);
      const usersQuery = query(
        collection(db, 'usuarios'),
        where('__name__', 'in', batch)
      );

      const querySnapshot = await getDocs(usersQuery);
      querySnapshot.forEach(doc => {
        if (doc.exists()) {
          usuariosCache.current.set(doc.id, doc.data());
        }
      });
    }
  }, []);

  useEffect(() => {
    const cargarFavoritos = async () => {
      if (!usuarioActivo?.id) return;
      
      setCargando(true);
      usuariosCache.current.clear();

      try {
        // 1. Obtener IDs de libros favoritos
        const userDoc = await getDoc(doc(db, "usuarios", usuarioActivo.id));
        if (!userDoc.exists()) {
          setFavoritos([]);
          setCargando(false);
          return;
        }

        const favoritosArray = userDoc.data()?.favoritos || [];
        if (favoritosArray.length === 0) {
          setFavoritos([]);
          setCargando(false);
          return;
        }

        // 2. Obtener libros favoritos en lotes (máximo 10 por consulta)
        const batchSize = 10;
        const librosPromises = [];
        
        for (let i = 0; i < favoritosArray.length; i += batchSize) {
          const batch = favoritosArray.slice(i, i + batchSize);
          const librosQuery = query(
            collection(db, 'libros'),
            where('__name__', 'in', batch)
          );
          librosPromises.push(getDocs(librosQuery));
        }
        
        const librosSnapshots = await Promise.all(librosPromises);
        const librosData = [];
        const userIds = new Set();

        // 3. Procesar libros y recolectar IDs de usuarios
        librosSnapshots.forEach(snapshot => {
          snapshot.forEach(doc => {
            if (doc.exists()) {
              const libroData = doc.data();
              const userId = libroData.creadorId || libroData.usuarioId;
              if (userId) userIds.add(userId);
              librosData.push({ id: doc.id, ...libroData });
            }
          });
        });

        // 4. Cargar datos de usuarios en lotes
        await cargarDatosUsuarios([...userIds]);

        // 5. Combinar datos
        const favoritosCompletos = librosData.map(libro => ({
          ...libro,
          datosUsuario: {
            ...(usuariosCache.current.get(libro.creadorId || libro.usuarioId) || {}),
            id: libro.creadorId || libro.usuarioId
          }
        }));

        // Ordenar por nombre alfabéticamente
        favoritosCompletos.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));

        setFavoritos(favoritosCompletos);

        const agrupado = {};
        favoritosCompletos.forEach((libro) => {
          const genero = libro.genero || "Sin género";
          if (!agrupado[genero]) agrupado[genero] = [];
          agrupado[genero].push(libro);
        });

        setFavoritosPorGenero(agrupado);
      } catch (error) {
        console.error("Error al cargar favoritos:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarFavoritos();
  }, [usuarioActivo?.id]);

  const quitarFavorito = async (libroId) => {
    if (!usuarioActivo?.id) return;

    try {
      const docRef = doc(db, "usuarios", usuarioActivo.id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const nuevosFavoritos = (data.favoritos || []).filter((id) => id !== libroId);
        await updateDoc(docRef, { favoritos: nuevosFavoritos });
        setFavoritos((prev) => prev.filter((l) => l.id !== libroId));
        setMensaje("Libro eliminado de favoritos");
        setTimeout(() => setMensaje(""), 2000);
      }
    } catch (error) {
      console.error("Error al quitar favorito:", error);
      setMensaje("Ocurrió un error");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  const compartirLibro = (libroId) => {
    const url = `${window.location.origin}/libro/${libroId}`;
    navigator.clipboard.writeText(url);
    setMensaje("Enlace copiado 📎");
    setTimeout(() => setMensaje(""), 2000);
  };

  const compartirPorWhatsApp = (libroId) => {
    const url = `${window.location.origin}/libro/${libroId}`;
    const texto = `¡Mirá este libro que marqué como favorito en BuKKus! 👉 ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  };

  // ✅ Mostrar Búho si no hay favoritos
  if (favoritos.length === 0) {
    return (
      <div className="pt-[calc(var(--top-nav-height,3.5rem)+1rem)] pb-20 text-center text-gray-600 flex flex-col items-center">
        <BuoSinLibros size={140} />
        <p className="mt-4 text-sm">Todavía no agregaste libros a tus favoritos.</p>
      </div>
    );
    
  }

  return (
    <div className="pt-[calc(var(--top-nav-height,3.5rem)+1rem)] pb-20">
      <div className="flex justify-between items-center px-4 mb-4">
        <h1 className="text-xl font-bold">Mis Favoritos</h1>
        <button
          onClick={() => setVistaGaleria((prev) => !prev)}
          className="bg-[#f7b22a] text-white px-3 py-1 rounded-full flex items-center gap-2"
        >
          {vistaGaleria ? <FaList /> : <FaThLarge />}
          {vistaGaleria ? "Ver por género" : "Ver como galería"}
        </button>
      </div>

      {vistaGaleria ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 px-4">
          {favoritos.map((libro) => (
            <div key={libro.id} className="relative">
              <CardLibro libro={libro} usuarioActivo={usuarioActivo} />
              <div className="absolute top-2 right-2 space-y-1 z-20 flex flex-col items-end">
                <button
                  onClick={() => quitarFavorito(libro.id)}
                  className="bg-white text-red-600 p-1 rounded-full border border-red-500 hover:bg-red-100 shadow"
                  title="Quitar favorito"
                >
                  <FaTrash size={16} />
                </button>
                <button
                  onClick={() => compartirLibro(libro.id)}
                  className="bg-white text-blue-600 p-1 rounded-full border border-blue-500 hover:bg-blue-100 shadow"
                  title="Copiar enlace"
                >
                  <FaShareAlt size={16} />
                </button>
                <button
                  onClick={() => compartirPorWhatsApp(libro.id)}
                  className="bg-white text-green-600 p-1 rounded-full border border-green-500 hover:bg-green-100 shadow"
                  title="WhatsApp"
                >
                  <FaWhatsapp size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        Object.entries(favoritosPorGenero).map(([genero, librosGenero]) => (
          <div key={genero} className="mb-6">
            <div className="flex justify-between items-center px-4 mb-2">
              <h2 className="text-lg font-bold text-gray-800">{genero}</h2>
              <span className="text-sm text-gray-500">
                {librosGenero.length} favorito(s)
              </span>
            </div>

<div className="flex overflow-x-auto no-scrollbar space-x-4 px-4">
              {librosGenero.map((libro) => (
                <div key={libro.id} className="relative flex-shrink-0 w-[220px]">
                  <CardLibro libro={libro} usuarioActivo={usuarioActivo} />
                  <div className="absolute top-2 right-2 space-y-1 z-20 flex flex-col items-end">
                    <button
                      onClick={() => quitarFavorito(libro.id)}
                      className="bg-white text-red-600 p-1 rounded-full border border-red-500 hover:bg-red-100 shadow"
                      title="Quitar favorito"
                    >
                      <FaTrash size={16} />
                    </button>
                    <button
                      onClick={() => compartirLibro(libro.id)}
                      className="bg-white text-blue-600 p-1 rounded-full border border-blue-500 hover:bg-blue-100 shadow"
                      title="Copiar enlace"
                    >
                      <FaShareAlt size={16} />
                    </button>
                    <button
                      onClick={() => compartirPorWhatsApp(libro.id)}
                      className="bg-white text-green-600 p-1 rounded-full border border-green-500 hover:bg-green-100 shadow"
                      title="WhatsApp"
                    >
                      <FaWhatsapp size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {mensaje && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-[#f7b22a] text-white px-5 py-2 rounded-full shadow-lg z-50 text-sm">
          {mensaje}
        </div>
      )}

      <button
        onClick={() => navigate(-1)}
        className="fixed bottom-5 left-5 bg-[#f7b22a] text-white p-3 rounded-full shadow-lg z-50 md:hidden"
        title="Volver"
      >
        <FaArrowLeft />
      </button>
    </div>
  );
}
