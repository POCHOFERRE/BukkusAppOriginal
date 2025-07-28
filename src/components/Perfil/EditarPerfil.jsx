import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import { db } from "../../config/firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import {
  FiCamera, FiUser, FiMapPin, FiEdit3,
  FiPhone, FiMail, FiSmile
} from "react-icons/fi";
import PropTypes from "prop-types";

const generosSugeridos = [
  "Fantasía", "Ciencia Ficción", "Terror", "Romance", "Autoayuda",
  "Biografía", "Historia", "Filosofía", "Policial", "Poesía"
];

export default function EditarPerfil() {
  const navigate = useNavigate();
  const { usuarioActivo, setUsuarioActivo } = useContext(UserContext);
  const [formData, setFormData] = useState({
    nombre: "", apellido: "", alias: "", ciudad: "", bio: "", avatar: "",
    telefono: "", emailAlternativo: "", gustos: [], lema: ""
  });
  const [otrosGustos, setOtrosGustos] = useState("");
  const [previewAvatar, setPreviewAvatar] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!usuarioActivo?.id) return;
    const refUsuario = doc(db, "usuarios", usuarioActivo.id);

    const unsub = onSnapshot(refUsuario, (snap) => {
      if (snap.exists()) {
        const data = snap.data();

        setFormData((prev) => ({
          ...prev,
          ...data,
          ciudad: prev.ciudad || data.ciudad || "",
          gustos: Array.isArray(data.gustos)
            ? data.gustos
            : data.gustos?.split(",").map((g) => g.trim()) || [],
        }));

        setPreviewAvatar(data.avatar || "");
      }
    });

    return () => unsub();
  }, [usuarioActivo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleGenero = (genero) => {
    setFormData((prev) => ({
      ...prev,
      gustos: prev.gustos.includes(genero)
        ? prev.gustos.filter((g) => g !== genero)
        : [...prev.gustos, genero],
    }));
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    try {
      // COMPRESIÓN BRUTAL CON CANVAS
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
              const base64 = canvas.toDataURL("image/jpeg", quality);
              resolve(base64);
            };
          };
        });
      };
  
      const base64 = await comprimirImagen(file); // 📉 Compresión extrema
      setPreviewAvatar(base64);
      setFormData((prev) => ({ ...prev, avatar: base64 }));
    } catch (error) {
      console.error("Error al procesar la imagen:", error);
    }
  };
  

  const generarAlias = (email) => {
    const base = email?.split("@")[0] || "usuario";
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${base}${random}`.replace(/[^a-zA-Z0-9]/g, "");
  };

  const guardarPerfil = async () => {
    if (!usuarioActivo?.id) return;
    setCargando(true);

    try {
      const refUsuario = doc(db, "usuarios", usuarioActivo.id);
      const gustosLimpios = [
        ...formData.gustos,
        ...otrosGustos
          .split(",")
          .map((g) => g.trim())
          .filter((g) => g !== ""),
      ];

      const nuevosDatos = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        alias: formData.alias || generarAlias(usuarioActivo.email),
        ciudad: formData.ciudad || usuarioActivo?.ciudad || "",
        bio: formData.bio,
        avatar: formData.avatar || previewAvatar,
        telefono: formData.telefono,
        emailAlternativo: formData.emailAlternativo,
        gustos: [...new Set(gustosLimpios)],
        lema: formData.lema,
        notificaciones: formData.notificaciones !== false,
        sonido: formData.sonido !== false,
      };

      await setDoc(refUsuario, nuevosDatos, { merge: true });
      setUsuarioActivo((prev) => ({ ...prev, ...nuevosDatos }));

      navigate("/");
    } catch (error) {
      console.error("Error al guardar perfil:", error);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 relative">
      {cargando && (
        <div className="absolute inset-0 z-50 bg-opacity-80 flex items-center justify-center">
          <div className="animate-spin h-10 w-10 border-4 border-yellow-500 border-t-transparent rounded-full" />
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="relative">
          <img
            src={previewAvatar || "/default-avatar.png"}
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover border border-yellow-300"
          />
          <label className="absolute bottom-0 right-0 bg-yellow-400 p-1 rounded-full cursor-pointer shadow-md">
            <FiCamera size={16} />
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </label>
        </div>
        <p className="text-sm text-gray-600">Tocá para cambiar tu avatar</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Nombre" icon={<FiUser />} name="nombre" value={formData.nombre} onChange={handleChange} />
        <Input label="Apellido" icon={<FiUser />} name="apellido" value={formData.apellido} onChange={handleChange} />
        <Input label="Alias" icon={<FiEdit3 />} name="alias" value={formData.alias} onChange={handleChange} />
        <Input label="Zona" icon={<FiMapPin />} name="ciudad" value={formData.ciudad} onChange={handleChange} />
        <Input label="Teléfono" icon={<FiPhone />} name="telefono" value={formData.telefono} onChange={handleChange} />
        <Input label="Email alternativo" icon={<FiMail />} name="emailAlternativo" value={formData.emailAlternativo} onChange={handleChange} />
        <Input label="Frase o lema personal" icon={<FiSmile />} name="lema" value={formData.lema} onChange={handleChange} />
        <Input label="Bio" name="bio" value={formData.bio} onChange={handleChange} textarea />
      </div>

      <div>
        <label className="text-sm text-gray-500">Gustos literarios</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {generosSugeridos.map((genero) => (
            <span
              key={genero}
              onClick={() => toggleGenero(genero)}
              className={`cursor-pointer px-3 py-1 rounded-full text-sm border transition-all ${
                formData.gustos.includes(genero)
                  ? "bg-[#f7b22a] text-black border-yellow-400"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-yellow-100"
              }`}
            >
              {genero}
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder="Agregar otros gustos (separados por coma)"
          value={otrosGustos}
          onChange={(e) => setOtrosGustos(e.target.value)}
          className="w-full mt-3 border-b border-gray-300 bg-transparent outline-none text-sm"
        />
      </div>

      <div className="pt-6">
        <button
          onClick={guardarPerfil}
          className="bg-[#f7b22a] text-black px-6 py-2 rounded-full shadow hover:bg-yellow-500 transition-all"
        >
          Guardar cambios
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-8">
          <div className="flex flex-col gap-2 text-sm text-gray-600">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.notificaciones !== false}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notificaciones: e.target.checked }))
                }
              />
              Activar notificaciones push
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.sonido !== false}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, sonido: e.target.checked }))
                }
              />
              Activar sonido de notificación
            </label>
          </div>

          <button
            onClick={() => {
              localStorage.clear();
              setUsuarioActivo(null);
              navigate("/");
            }}
            className="bg-red-500 text-white px-5 py-1.5 rounded-full shadow hover:bg-red-600 transition-all text-sm"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200 mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Opciones de ayuda</h3>
        {usuarioActivo && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              onClick={() => {
                localStorage.removeItem(`tourVisto_${usuarioActivo.id}`);
                alert('¡Listo! El tour se reiniciará cuando recargues la página.');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium"
              title="Reiniciar el tour"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Repetir tour de bienvenida
            </button>
            <p className="text-sm text-gray-500 mt-2 sm:mt-0">
              ¿Necesitás ayuda? Reiniciá el tour guiado de la app.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Input({ label, icon, name, value, onChange, textarea = false }) {
  return (
    <div>
      <label className="text-sm text-gray-500">{label}</label>
      <div className="flex items-start gap-2 border-b py-1">
        {icon && <div className="mt-1 text-yellow-500">{icon}</div>}
        {textarea ? (
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            rows={3}
            className="w-full bg-transparent outline-none text-sm resize-none"
            placeholder="Escribí algo..."
          />
        ) : (
          <input
            type="text"
            name={name}
            value={value}
            onChange={onChange}
            className="w-full bg-transparent outline-none text-sm"
            placeholder="Escribí aquí..."
          />
        )}
      </div>
    </div>
  );
}

Input.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.node,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  textarea: PropTypes.bool,
};
