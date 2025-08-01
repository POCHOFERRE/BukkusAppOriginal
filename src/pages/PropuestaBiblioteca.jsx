// src/pages/PropuestaBiblioteca.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/UserContext";
import { db } from "../config/firebase";
import { collection, query, where, getDocs, addDoc, doc, getDoc, Timestamp } from "firebase/firestore";
import { toast } from "react-toastify";

export default function PropuestaBiblioteca() {
  const { libroId } = useParams();
  const { usuarioActivo } = useContext(UserContext);
  const navigate = useNavigate();
  const [misLibros, setMisLibros] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [libroObjetivo, setLibroObjetivo] = useState(null);
  const [propietario, setPropietario] = useState(null);

  // 📌 Obtener biblioteca del usuario activo
  useEffect(() => {
    if (!usuarioActivo?.id) return;
    const fetchMisLibros = async () => {
      const q = query(collection(db, "libros"), where("usuarioId", "==", usuarioActivo.id));
      const snap = await getDocs(q);
      setMisLibros(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchMisLibros();
  }, [usuarioActivo]);

  // 📌 Obtener info del libro objetivo y su propietario
  useEffect(() => {
    const fetchLibroObjetivo = async () => {
      const libroSnap = await getDoc(doc(db, "libros", libroId));
      if (libroSnap.exists()) {
        const libroData = libroSnap.data();
        setLibroObjetivo({ id: libroSnap.id, ...libroData });

        const usuarioSnap = await getDoc(doc(db, "usuarios", libroData.usuarioId));
        if (usuarioSnap.exists()) {
          setPropietario({ id: libroData.usuarioId, ...usuarioSnap.data() });
        }
      }
    };
    fetchLibroObjetivo();
  }, [libroId]);

  const toggleSeleccion = (idLibro) => {
    setSeleccionados(prev =>
      prev.includes(idLibro) ? prev.filter(id => id !== idLibro) : [...prev, idLibro]
    );
  };

  const enviarOferta = async () => {
    try {
      if (!propietario) return toast.error("No se pudo encontrar el propietario");

      await addDoc(collection(db, "ofertas"), {
        de: usuarioActivo.id,
        para: propietario.id,
        libroInteres: libroObjetivo.id,
        tipoOferta: "biblioteca",
        bibliotecaVisible: seleccionados.length ? seleccionados : misLibros.map(l => l.id),
        estado: "pendiente",
        fecha: Timestamp.now()
      });

      toast.success("Oferta enviada", { autoClose: 1200 });
      navigate("/ofertas");
    } catch (error) {
      console.error(error);
      toast.error("Error enviando oferta");
    }
  };

  return (
    <div className="p-4 text-white">
      {libroObjetivo && propietario && (
        <>
          <h2 className="text-lg font-bold mb-2">
            Ofertar por: <span className="text-yellow-400">{libroObjetivo.nombre}</span>
          </h2>
          <p className="text-sm text-gray-300 mb-4">
            Propietario: {propietario.nombre} {propietario.ciudad && `(${propietario.ciudad})`}
          </p>
        </>
      )}

      <h3 className="text-md font-semibold mb-2">Seleccioná libros de tu biblioteca</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {misLibros.map(libro => (
          <div
            key={libro.id}
            onClick={() => toggleSeleccion(libro.id)}
            className={`p-2 border rounded cursor-pointer ${
              seleccionados.includes(libro.id) ? "border-yellow-500" : "border-gray-300"
            }`}
          >
            <img
              src={libro.imagenes?.[0]}
              alt={libro.nombre}
              className="w-full h-32 object-cover rounded"
            />
            <p className="mt-1 text-sm line-clamp-2">{libro.nombre}</p>
          </div>
        ))}
      </div>

      <button
        onClick={enviarOferta}
        className="mt-4 w-full bg-yellow-500 text-black py-2 rounded hover:bg-yellow-600 transition"
      >
        Enviar oferta
      </button>
    </div>
  );
}
