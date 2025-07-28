import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../config/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { FiUpload, FiX } from "react-icons/fi";
import { UserContext } from "../context/UserContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MisLibrosSelector from "../components/libro/MisLibrosSelector.jsx";

export default function OfertaPage() {
  const { libroId } = useParams();
  const navigate = useNavigate();
  const { usuarioActivo } = useContext(UserContext);

  const [libro, setLibro] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [libroOfrecido, setLibroOfrecido] = useState(null);
  const [comentario, setComentario] = useState("");
  const [imagen, setImagen] = useState(null);
  const [confirmado, setConfirmado] = useState(false);
  const [error, setError] = useState("");
  const [misLibros, setMisLibros] = useState([]);


  useEffect(() => {
    const cargarDatos = async () => {
      const ref = doc(db, "libros", libroId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return navigate("/");

      const libroData = snap.data();
      setLibro({ ...libroData, id: snap.id });

      const q = query(
        collection(db, "libros"),
        where("nombre", "==", libroData.nombre)
      );
      const res = await getDocs(q);

      const usuariosUnicos = [];

      for (const docSnap of res.docs) {
        const data = docSnap.data();
        if (!data.usuarioId || data.usuarioId === usuarioActivo?.id) continue;

        const userRef = doc(db, "usuarios", data.usuarioId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          usuariosUnicos.push({
            usuarioId: data.usuarioId,
            avatarUrl: userData.avatar || "https://via.placeholder.com/40",
            nombre: userData.nombre || "Usuario",
            ciudad: userData.ciudad || "Sin ciudad",
            quiere: data.quiere || "No especificado",
          });
        }
      }

      setUsuarios(usuariosUnicos);
    };

    cargarDatos();
  }, [libroId, navigate, usuarioActivo?.id]);
  useEffect(() => {
    const cargarMisLibros = async () => {
      if (!usuarioActivo?.id) return;
      const q = query(collection(db, "libros"), where("usuarioId", "==", usuarioActivo.id));
      const snap = await getDocs(q);
      const librosDisponibles = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMisLibros(librosDisponibles);
    };
    cargarMisLibros();
  }, [usuarioActivo?.id]);
  
  const handleEnviar = async () => {
    if (!usuarioSeleccionado) return setError("Seleccioná un usuario.");
    if (!libroOfrecido) return setError("Seleccioná un libro para ofrecer.");
    if (!confirmado) return setError("Confirmá que tu propuesta es seria.");

    try {
      await addDoc(collection(db, "ofertas"), {
        libroId,
        libroOfertaId: libroOfrecido.id,
        de: usuarioActivo.id,
        para: usuarioSeleccionado.usuarioId,
        oferta: `Ofrece el libro: ${libroOfrecido.nombre}`,
        comentario,
        imagen: imagen || null,
        estado: "pendiente",
        timestamp: Timestamp.now(),
      });

      const chatId = [usuarioActivo.id, usuarioSeleccionado.usuarioId, libroId]
        .sort()
        .join("_");

      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);

      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          participantes: [usuarioActivo.id, usuarioSeleccionado.usuarioId],
          libroId,
          creado: Timestamp.now(),
          ultimaActividad: Timestamp.now(),
        });
      }

      await addDoc(collection(db, "notificaciones"), {
        usuarioId: usuarioSeleccionado.usuarioId,
        tipo: "oferta",
        mensaje: `${usuarioActivo.nombre || "Un usuario"} te envió una propuesta por el libro "${libro.nombre}"`,
        leido: false,
        timestamp: Timestamp.now(),
      });

      toast.success("🎉 Propuesta enviada con éxito");
      setTimeout(() => {
        navigate("/ofertas");
      }, 2000);
    } catch (err) {
      console.error("Error al enviar oferta:", err);
      setError("Hubo un error al enviar la propuesta. Intentá de nuevo.");
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
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
      const imagenComprimida = await comprimirImagen(file);
      setImagen(imagenComprimida);
    } catch (error) {
      console.error("Error al comprimir la imagen:", error);
    }
  };
  

  if (!libro) return <div className="p-4 text-center">Cargando...</div>;

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6 text-gray-800">
      <h2 className="text-xl font-bold text-center text-black">
        📚 Propuesta de intercambio
      </h2>

      {/* Vista previa del libro destino */}
      <div className="flex gap-4 items-start bg-gray-100 rounded-lg p-3">
        <img
          src={libro.imagenes?.[0] || "https://via.placeholder.com/100x150"}
          alt={libro.nombre}
          className="w-24 h-32 object-cover rounded"
        />
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{libro.nombre}</h3>
          <p className="text-sm text-gray-600">{libro.autor}</p>
          {libro.editorial && (
            <p className="text-xs text-gray-500">Editorial: {libro.editorial}</p>
          )}
          {libro.anio && (
            <p className="text-xs text-gray-500">Año: {libro.anio}</p>
          )}
          {libro.sinopsis && (
            <div className="text-xs text-gray-700 mt-2 max-h-24 overflow-y-auto pr-1 border-t pt-2">
              <p className="text-[10px] font-semibold text-gray-500 mb-1 uppercase">Sinopsis</p>
              {libro.sinopsis}
            </div>
          )}
        </div>
      </div>

      {/* Usuarios que también tienen el mismo libro */}
      <div>
        <p className="font-semibold mb-2">Elegí a quién le querés enviar la propuesta:</p>
        <div className="space-y-2">
          {usuarios.map((user) => (
            <button
              key={user.usuarioId}
              onClick={() => setUsuarioSeleccionado(user)}
              className={`flex items-center gap-3 p-3 w-full rounded-lg border transition ${
                usuarioSeleccionado?.usuarioId === user.usuarioId
                  ? "bg-yellow-100 border-yellow-400"
                  : "bg-white border-gray-300 hover:bg-gray-100"
              }`}
            >
              <img
                src={user.avatarUrl}
                alt={user.nombre}
                className="w-10 h-10 rounded-full object-cover border"
              />
              <div className="flex-1 text-left">
                <p className="font-semibold text-sm">{user.nombre}</p>
                <p className="text-xs text-gray-500">{user.ciudad}</p>
                <p className="text-xs text-gray-500 italic">Quiere: {user.quiere}</p>
              </div>
              {usuarioSeleccionado?.usuarioId === user.usuarioId && (
                <span className="text-[10px] bg-green-600 text-black px-2 py-[1px] rounded-full">
                  ✅
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Selector visual de libro a ofrecer */}
      {usuarioSeleccionado && (
  <>
    {misLibros.length > 0 ? (
      <div>
        <p className="font-semibold mb-1">📘 Elegí uno de tus libros para ofrecer a cambio:</p>
        <MisLibrosSelector
          onSelect={(libro) => setLibroOfrecido(libro)}
          libroSeleccionado={libroOfrecido}
        />
      </div>
    ) : usuarioActivo?.billetera > 0 ? (
      <div className="p-3 bg-yellow-100 border border-yellow-400 rounded text-sm text-yellow-900">
        No tenés libros disponibles para intercambiar. Vas a usar <strong>{usuarioActivo.billetera}</strong> BUKKoins para enviar esta propuesta.
      </div>
    ) : (
      <div className="p-3 bg-red-100 border border-red-400 rounded text-sm text-red-800">
        No tenés libros disponibles ni saldo en BUKKoins. Necesitás al menos 1 libro o BUKKoins para poder enviar la propuesta.
      </div>
    )}
    {/* Desactivar si no puede interactuar */}
    {misLibros.length === 0 && (!usuarioActivo?.billetera || usuarioActivo.billetera <= 0) ? (
      <div className="text-sm bg-yellow-50 border border-yellow-300 p-4 rounded text-yellow-900 space-y-2">
      <p>
        Comentarios, imágenes y confirmación están desactivados porque no tenés libros ni saldo de <strong>BUKKoins</strong>.
      </p>
      <p>
        Para poder enviar propuestas, publicá un libro o recargá saldo.
      </p>
      <div className="text-center pt-2">
        <button
          onClick={() => navigate("/billetera")}
          className="bg-[#f7b22a] text-black px-4 py-1.5 rounded-full font-semibold text-sm hover:bg-yellow-400 transition"
        >
          💰 Recargar BUKKoins
        </button>
      </div>
    </div>
    
    ) : (
      <>
        <div>
          <label className="block font-semibold">Comentario (opcional)</label>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            className="w-full border p-2 rounded text-sm mt-1"
            rows={2}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Adjuntar imagen (opcional)</label>
          <label className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded cursor-pointer hover:bg-gray-100 text-sm">
            <FiUpload className="mr-2" />
            Examinar imagen
            <input
              type="file"
              onChange={handleFile}
              className="hidden"
              accept="image/*"
            />
          </label>

          {imagen && (
            <div className="relative mt-3">
              <img src={imagen} alt="Preview" className="rounded max-h-48 border" />
              <button
                onClick={() => setImagen(null)}
                className="absolute top-1 right-1 bg-white border p-1 rounded-full"
              >
                <FiX size={14} />
              </button>
            </div>
          )}
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={confirmado}
            onChange={(e) => setConfirmado(e.target.checked)}
          />
          Confirmo que esta propuesta es seria
        </label>
      </>
    )}


    {error && <p className="text-sm text-red-600">{error}</p>}

    <div className="pt-4 text-center">
      <button
        onClick={handleEnviar}
        disabled={
          (!libroOfrecido && misLibros.length > 0) ||
          (misLibros.length === 0 && (!usuarioActivo?.billetera || usuarioActivo.billetera <= 0)) ||
          !confirmado
        }
        className={`px-6 py-2 rounded-full font-bold transition ${
          (!libroOfrecido && misLibros.length > 0) ||
          (misLibros.length === 0 && (!usuarioActivo?.billetera || usuarioActivo.billetera <= 0)) ||
          !confirmado
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-[#f7b22a] text-black hover:bg-yellow-300"
        }`}
      >
        Enviar propuesta
      </button>
    </div>
  </>
)}

      <ToastContainer position="top-center" autoClose={2000} />
    </div>
  );
}
