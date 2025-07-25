import { db, auth } from '../config/firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';

// === FAVORITOS ===
export const agregarFavorito = (usuarioId, productoId) =>
  setDoc(doc(db, 'usuarios', usuarioId, 'favoritos', productoId), {
    productoId,
    fecha: new Date().toISOString(),
  });

export const quitarFavorito = (usuarioId, productoId) =>
  deleteDoc(doc(db, 'usuarios', usuarioId, 'favoritos', productoId));

export const obtenerFavoritosUsuario = async (usuarioId) => {
  const querySnapshot = await getDocs(collection(db, 'usuarios', usuarioId, 'favoritos'));
  return querySnapshot.docs.map(doc => doc.data().productoId);
};

// === PUBLICACIONES ===
export const eliminarPublicacion = (id) =>
  deleteDoc(doc(db, 'publicaciones', id));

export const crearPublicacion = async (data) => {
  const docRef = await addDoc(collection(db, 'publicaciones'), data);
  return docRef.id;
};

export const obtenerPublicaciones = async () => {
  const querySnapshot = await getDocs(collection(db, 'publicaciones'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const actualizarPublicacion = (id, data) =>
  updateDoc(doc(db, 'publicaciones', id), data);

export const obtenerPublicacion = async (id) => {
  const docSnap = await getDoc(doc(db, 'publicaciones', id));
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

// === OFERTAS ===

export const crearOferta = async (data) => {
  if (!data.libroId) throw new Error("Falta el ID del libro");

  // Save to main ofertas collection as per system requirements
  const ofertaRef = await addDoc(
    collection(db, 'ofertas'),
    {
      productoId: data.libroId,
      productoNombre: data.libroNombre,
      para: data.para,
      de: data.de,
      deNombre: data.deNombre,
      oferta: data.oferta,
      comentario: data.comentario || '',
      imagen: data.imagen || '',
      aceptado: data.aceptado || null,
      fecha: data.fecha || new Date().toISOString(),
      creadoEn: new Date().toISOString(),
    }
  );

  return ofertaRef.id;
};

export const obtenerOfertasParaUsuario = async (userId) => {
  const publicacionesSnapshot = await getDocs(collection(db, 'publicaciones'));
  const ofertas = [];

  for (const docSnap of publicacionesSnapshot.docs) {
    const libro = docSnap.data();
    const libroId = docSnap.id;

    if (libro.usuarioId === userId) {
      const ofertasSnap = await getDocs(collection(db, 'libros', libroId, 'ofertas'));

      ofertasSnap.forEach((oferta) => {
        ofertas.push({ id: oferta.id, ...oferta.data(), libroId });
      });
    }
  }

  return ofertas;
};

export const obtenerOfertasHechasPorUsuario = async (userId) => {
  const publicacionesSnapshot = await getDocs(collection(db, 'publicaciones'));
  const ofertas = [];

  for (const docSnap of publicacionesSnapshot.docs) {
    const libroId = docSnap.id;
    const ofertasSnap = await getDocs(collection(db, 'libros', libroId, 'ofertas'));

    ofertasSnap.forEach((oferta) => {
      const data = oferta.data();
      if (data.de === userId) {
        ofertas.push({ id: oferta.id, ...data, libroId });
      }
    });
  }

  return ofertas;
};

export const actualizarOferta = async (ofertaId, data) => {
  const ofertaRef = doc(db, 'ofertas', ofertaId);
  await updateDoc(ofertaRef, data);
};

// === USUARIOS ===
export const obtenerUsuarioPorId = async (id) => {
  const docSnap = await getDoc(doc(db, 'usuarios', id));
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const crearUsuario = async (email, password) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  await setDoc(doc(db, 'usuarios', user.uid), {
    nombre: user.displayName || email,
    email: user.email,
    avatar: user.photoURL || 'https://i.pravatar.cc/29?=default',
    telefono: '',
    ciudad: '',
    bio: '',
    genero: '',
    mision: '',
    fechaRegistro: new Date().toISOString(),
    tipoCuenta: 'free',
  });
  return user;
};

export const loginUsuario = (email, password) =>
  signInWithEmailAndPassword(auth, email, password).then(res => res.user);

export const logoutUsuario = () =>
  signOut(auth);
