import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../config/firebase";
import { collection, addDoc, Timestamp, doc, setDoc } from "firebase/firestore";
import { UserContext } from "../context/UserContext";
import BookSelection from "../components/libro/BookSelection";
import { v4 as uuidv4 } from 'uuid';

import PropTypes from "prop-types";
import {
  FiUser, FiHome, FiCalendar, FiBookOpen,
  FiRefreshCw, FiDollarSign, FiGlobe, FiUpload, FiSearch, FiXCircle, FiCheckCircle, FiX
} from "react-icons/fi";

const generos = [
  "Ficción", "No Ficción", "Ciencia Ficción", "Fantasía", "Romance", "Misterio", "Terror", "Aventura",
  "Drama", "Thriller", "Humor", "Realismo Mágico", "Distopía", "Utopía", "Literatura Contemporánea", "Clásicos",
  "Ensayo", "Filosofía", "Ciencia", "Matemáticas", "Historia", "Psicología", "Educación", "Política", "Sociología",
  "Autoayuda", "Espiritualidad", "Religión", "Mindfulness", "Crecimiento Personal", "Salud y Bienestar",
  "Negocios", "Empresarial", "Marketing", "Economía", "Finanzas", "Tecnología", "Programación", "Ingeniería", "Derecho", "Medicina",
  "Juvenil", "Infantil", "Cuentos", "Didácticos", "Educativos",
  "Biografía", "Autobiografía", "Memorias", "Crónica", "Viajes",
  "Arte", "Música", "Fotografía", "Cocina", "Deportes", "Jardinería", "Mascotas", "Hogar y Familia", "Erotismo"
];
const anios = Array.from({ length: 100 }, (_, i) => `${2025 - i}`);
const editoriales = ["Sudamericana", "Planeta", "Penguin", "Alfaguara", "Emecé", "Otras"];

export default function Publicar() {

  const navigate = useNavigate();
  const { usuarioActivo } = useContext(UserContext); // ✅ NUEVO

  const [nombre, setNombre] = useState("");
  const [autor, setAutor] = useState("");
  const [editorial, setEditorial] = useState("");
  const [editorialLibre, setEditorialLibre] = useState("");
  const [estadoLibro, setEstadoLibro] = useState("");
  const [anio, setAnio] = useState("");
  const [quiere, setQuiere] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);
  const [showBookSelection, setShowBookSelection] = useState(false);
  const [genero, setGenero] = useState("Ficción");
  const [generoLibre, setGeneroLibre] = useState("");
  const [valorBukkcoins, setValorBukkcoins] = useState("");
  const [sinopsis, setSinopsis] = useState("");
  const [imagenes, setImagenes] = useState([]);
  const [vistaPrevia, setVistaPrevia] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [modalTipo, setModalTipo] = useState(null);
  const [publicando, setPublicando] = useState(false);

  const buscarLibroGoogle = async () => {
    if (!nombre) return setModalTipo("error");
    try {
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(nombre)}`);
      const data = await res.json();
      setResultados(data.items || []);
    } catch {
      setModalTipo("error");
    }
  };

  const aplicarResultado = (libro) => {
    const info = libro.volumeInfo;
    setNombre(info.title || "");
    setAutor(info.authors?.join(", ") || "");
    setEditorial(info.publisher || "");
    setAnio(info.publishedDate?.split("-")[0] || "");
    setSinopsis(info.description || "");
    if (info.imageLinks?.thumbnail) {
      setVistaPrevia([info.imageLinks.thumbnail]);
      setImagenes([info.imageLinks.thumbnail]);
    }
  };

  const manejarImagenes = async (e) => {
    const archivos = Array.from(e.target.files).slice(0, 5);
  
    const comprimirImagen = (file, maxWidth = 600, quality = 0.6) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const scale = maxWidth / img.width;
            const width = maxWidth;
            const height = img.height * scale;
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL("image/jpeg", quality);
            resolve(compressed);
          };
        };
      });
    };
  
    try {
      const base64List = await Promise.all(
        archivos.map(async (archivo) => {
          if (!archivo.type.startsWith("image/")) return null;
          return await comprimirImagen(archivo);
        })
      );
  
      const filtradas = base64List.filter(Boolean);
      setImagenes(filtradas);
      setVistaPrevia(filtradas);
    } catch (error) {
      console.error("Error al comprimir imágenes:", error);
    }
  };
  
  

  const publicarLibro = async () => {
    if (publicando) return;
    setPublicando(true);

    const camposRequeridos = (
      !editorial || 
      (editorial === "Otras" && !editorialLibre) ||
      !estadoLibro || 
      !anio || 
      imagenes.length === 0 ||
      !usuarioActivo?.id
    );

    if (camposRequeridos) {
      setModalTipo("error");
      setPublicando(false);
      return;
    }

    // Crear notificación si se seleccionó un libro
    if (selectedBook) {
      try {
        const notificationId = uuidv4();
        const notificationRef = doc(db, 'notifications', notificationId);
        
        await setDoc(notificationRef, {
          id: notificationId,
          userId: selectedBook.ownerId,
          type: 'book_interest',
          message: `${usuarioActivo.nombre || 'Alguien'} está interesado en tu libro "${selectedBook.title}"`,
          bookId: selectedBook.id,
          fromUserId: usuarioActivo.id,
          fromUserName: usuarioActivo.nombre || 'Usuario',
          read: false,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      } catch (error) {
        console.error('Error al crear notificación:', error);
        // No detenemos el flujo si falla la notificación
      }
    }

    const nuevo = {
      tipo: "libro",
      nombre: nombre || "Sin título",
      autor,
      editorial: editorial === "Otras" ? editorialLibre : editorial,
      estadoLibro,
      anio,
      quiere: quiere || "A convenir",
      genero: genero === "Otro" ? generoLibre : genero,
      sinopsis,
      valorBukkcoins: Number(valorBukkcoins) || 0,
      fechaCreacion: Timestamp.now(),
      imagenes,
    
      // ✅ IMPORTANTE para el Home
      usuarioId: usuarioActivo?.id || "desconocido",
      nombreUsuario: usuarioActivo?.nombre || usuarioActivo?.email || "Anónimo",
    };
    
    

    try {
      await addDoc(collection(db, "libros"), nuevo);
      setModalTipo("exito");

      // Reset
      setNombre(""); setAutor(""); setEditorial(""); setEditorialLibre(""); setEstadoLibro("");
      setAnio(""); setQuiere(""); setGenero("Ficción"); setGeneroLibre("");
      setValorBukkcoins(""); setSinopsis(""); setImagenes([]); setVistaPrevia([]); setResultados([]);

      setTimeout(() => {
        setModalTipo(null);
        navigate("/");
        setTimeout(() => localStorage.setItem("tabActivo", "mios"), 50);
      }, 2000);
    } catch {
      setModalTipo("error");
    }

    setPublicando(false);
  };

  return (
    <>
<div className="w-full pb-32 px-4 max-w-xl mx-auto space-y-6 overflow-y-auto">
<h1 className="text-xl font-bold text-center text-black drop-shadow-sm">📚 Publicar un libro</h1>

        <div className="flex items-center gap-2 bg-cream border rounded-full px-4 py-2 shadow-sm">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="input-bukkus flex-grow bg-transparent border-none focus:ring-0"
            placeholder="Ingresá un título para buscar..."
          />
          <button onClick={buscarLibroGoogle} className="text-[#f7b22a] hover:text-yellow-600 transition">
            <FiSearch size={20} />
          </button>
        </div>

        {resultados.length > 0 && (
          <div className="bg-cream border rounded p-2 space-y-2 max-h-60 overflow-y-auto shadow-sm">
            {resultados.map((r) => (
              <div key={r.id} className="p-2 border-b hover:bg-yellow-50 cursor-pointer" onClick={() => aplicarResultado(r)}>
                <strong>{r.volumeInfo.title}</strong><br />
                <span className="text-sm text-gray-600">{r.volumeInfo.authors?.join(", ")}</span>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          {vistaPrevia.map((src, i) => (
            <img key={i} src={src} className="h-32 w-full object-cover rounded-lg border shadow-sm" />
          ))}
        </div>

        <div>
          <label className="text-sm font-semibold flex items-center gap-2 mb-2">
            <FiUpload /> Imágenes del libro (máx 5)
          </label>
          <div className="relative">
            <button
              onClick={() => document.getElementById("upload-imagenes").click()}
              className="bg-[#f7b22a] text-black px-4 py-2 rounded-full shadow hover:bg-yellow-600 transition"
            >
              <FiUpload className="inline-block mr-2" />
              
            </button>
            <input
              id="upload-imagenes"
              type="file"
              accept="image/*"
              multiple
              onChange={manejarImagenes}
              className="hidden"
            />
          </div>
        </div>

        <Campo texto="Autor" val={autor} setVal={setAutor} icon={<FiUser />} placeholder="Ej: Gabriel García Márquez" />
        <div className="space-y-2">
          <label className="text-sm font-semibold flex items-center gap-2">
            <FiBookOpen /> ¿Qué querés a cambio?
          </label>
          
          {selectedBook ? (
            <div className="relative p-3 border border-yellow-300 bg-yellow-50 rounded-lg">
              <div className="flex items-start gap-3">
                {selectedBook.image ? (
                  <img 
                    src={selectedBook.image} 
                    alt={selectedBook.title}
                    className="w-12 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center">
                    <FiBookOpen className="text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{selectedBook.title}</h4>
                  <p className="text-xs text-gray-600">{selectedBook.author}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Ofrecido por: {selectedBook.ownerName || 'Usuario'}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setSelectedBook(null);
                    setQuiere('');
                  }}
                  className="text-gray-400 hover:text-red-500"
                >
                  <FiX />
                </button>
              </div>
              <input
                type="hidden"
                value={selectedBook.title}
                onChange={() => {}}
              />
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="flex-1">
                <Campo 
                  texto=""
                  val={quiere} 
                  setVal={setQuiere} 
                  placeholder="Ej: Otro libro, BUKKcoins, etc."
                />
              </div>
              <button
                onClick={() => setShowBookSelection(true)}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm whitespace-nowrap"
              >
                Seleccionar libro
              </button>
            </div>
          )}
        </div>

        {/* Modal de selección de libro */}
        {showBookSelection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold">Seleccionar libro para intercambio</h3>
                <button 
                  onClick={() => setShowBookSelection(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX size={24} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                <BookSelection 
                  onSelectBook={(book) => {
                    setSelectedBook(book);
                    setQuiere(`Quiero intercambiar por: ${book.title}`);
                    setShowBookSelection(false);
                  }}
                  selectedBook={selectedBook}
                  currentUserId={usuarioActivo?.id}
                />
              </div>
            </div>
          </div>
        )}
        <Campo texto="💰 Valor estimado en BUKKcoins" val={valorBukkcoins} setVal={setValorBukkcoins} icon={<FiDollarSign />} placeholder="Ej: 50" />

        <Select texto="Editorial" val={editorial} setVal={setEditorial} opciones={editoriales} icon={<FiHome />} />
        {editorial === "Otras" && (
          <Campo texto="Ingresá la editorial" val={editorialLibre} setVal={setEditorialLibre} icon={<FiHome />} placeholder="Ej: Ediciones B" />
        )}
        <Select texto="Año" val={anio} setVal={setAnio} opciones={anios} icon={<FiCalendar />} />
        <Select texto="Estado" val={estadoLibro} setVal={setEstadoLibro} opciones={["Usado", "Muy usado", "Subrayado"]} icon={<FiRefreshCw />} />
        <Select texto="Género" val={genero} setVal={setGenero} opciones={[...generos, "Otro"]} icon={<FiGlobe />} />
        {genero === "Otro" && (
          <Campo texto="Ingresá un género personalizado" val={generoLibre} setVal={setGeneroLibre} icon={<FiGlobe />} placeholder="Ej: Filosofía, Ciencia, etc." />
        )}

<div>
  <label className="text-sm font-semibold text-black mb-1 block">Sinopsis</label>
  <textarea
    value={sinopsis}
    onChange={(e) => setSinopsis(e.target.value)}
    rows={6} // Antes eran 3
    className="input-bukkus resize-none min-h-[140px] bg-zinc-800 text-white border border-zinc-600 rounded-md w-full p-2"
    placeholder="Contanos de qué trata el libro..."
  />
</div>


        <div className="text-right">
          <button
            onClick={publicarLibro}
            disabled={publicando}
            className={`px-6 py-2 rounded-full shadow-md transition flex items-center justify-center gap-2 ${
              publicando
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-[#f7b22a] text-black hover:bg-yellow-600"
            }`}
          >
            {publicando ? (
              <>
                Publicando...
                <span className="animate-spin inline-block border-2 border-white border-t-transparent rounded-full w-4 h-4" />
              </>
            ) : (
              "Publicar"
            )}
          </button>
        </div>
      </div>

      {modalTipo === "error" && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
    <div className="bg-zinc-900 rounded-lg px-6 py-5 w-full max-w-sm text-center shadow-xl">
      <p className="text-sm text-[#f7b22a] mb-4 flex items-center justify-center gap-2">
        <FiXCircle className="text-[#f7b22a] text-lg" />
        Faltan datos obligatorios o falló la publicación.
      </p>
      <button
        onClick={() => setModalTipo(null)}
        className="px-4 py-1.5 bg-[#f7b22a] text-black rounded-full text-sm hover:bg-yellow-600"
      >
        Cerrar
      </button>
    </div>
  </div>
)}

{modalTipo === "exito" && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
    <div className="bg-white rounded-lg px-6 py-5 w-full max-w-sm text-center shadow-xl">
      <p className="text-sm text-green-600 mb-4 flex items-center justify-center gap-2">
        <FiCheckCircle className="text-green-600 text-lg" />
        Libro publicado correctamente
      </p>
      <button
        onClick={() => {
          setModalTipo(null);
          navigate("/mios");
        }}
        className="px-4 py-1.5 bg-green-600 text-white rounded-full text-sm hover:bg-green-700"
      >
        Ver mis libros
      </button>
    </div>
  </div>
)}

    </>
  );
}

// Subcomponentes
function Campo({ texto, val, setVal, icon, placeholder }) {
  return (
    <div>
      <label className="text-sm font-semibold flex items-center gap-2 mb-1">{icon} {texto}</label>
      <input
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
        {opciones.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-cream rounded-xl p-6 max-w-sm w-full relative shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

// PropTypes
Modal.propTypes = {
  children: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
};

Campo.propTypes = {
  texto: PropTypes.string.isRequired,
  val: PropTypes.string.isRequired,
  setVal: PropTypes.func.isRequired,
  icon: PropTypes.element,
  placeholder: PropTypes.string
};

Select.propTypes = {
  texto: PropTypes.string.isRequired,
  val: PropTypes.string.isRequired,
  setVal: PropTypes.func.isRequired,
  opciones: PropTypes.arrayOf(PropTypes.string).isRequired,
  icon: PropTypes.element,
};
