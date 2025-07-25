import React, { useState, useEffect , useCallback } from 'react';
import PropTypes from 'prop-types';
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { motion } from 'framer-motion';
import { FaSearch, FaTimes, FaBook, FaMapMarkerAlt } from 'react-icons/fa';
import { getOwlAvatar } from '../../helpers/avatar';

const BookSelection = ({ onSelectBook, selectedBook, currentUserId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [genre, setGenre] = useState('Todos');
  const [cityFilter, setCityFilter] = useState('Todas');
  const [books, setBooks] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookId, setSelectedBookId] = useState(selectedBook?.id || null);

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'libros'));
      const booksData = [];
      const citySet = new Set();

      for (const docSnap of querySnapshot.docs) {
        const bookData = docSnap.data();

        if (bookData.usuarioId === currentUserId) continue;

        let userData = null;
        try {
          const userDoc = await getDoc(doc(db, 'usuarios', bookData.usuarioId));
          if (userDoc.exists()) userData = userDoc.data();
        } catch (err) {
          console.error('Error fetching user data:', err);
        }

        if (userData?.ciudad) citySet.add(userData.ciudad);

        booksData.push({
          id: docSnap.id,
          ...bookData,
          user: userData
        });
      }

      setBooks(booksData);
      setCities(['Todas', ...Array.from(citySet)]);
    } catch (err) {
      console.error('Error fetching books:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      fetchBooks();
    } else {
      setLoading(false);
    }
  }, [currentUserId, fetchBooks]);

  const handleBookSelect = (book) => {
    setSelectedBookId(book.id);
    if (onSelectBook) {
      onSelectBook({
        id: book.id,
        title: book.titulo,
        author: book.autor,
        image: book.imagenes?.[0] || null,
        ownerName: book.user?.nombre || 'Usuario',
        ownerId: book.usuarioId
      });
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch =
      book.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.autor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.genero?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGenre = genre === 'Todos' || book.genero === genre;
    const matchesCity = cityFilter === 'Todas' || book.user?.ciudad === cityFilter;

    return matchesSearch && matchesGenre && matchesCity;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 px-2 sm:px-0 mt-2">
        {/* Buscar */}
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por título, autor o género..."
            className="pl-10 pr-3 py-2 border border-gray-300 rounded-md w-full text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <FaTimes
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
              onClick={() => setSearchTerm('')}
            />
          )}
        </div>

        {/* Género */}
        <div className="flex flex-col text-sm">
          <label className="mb-1 text-gray-600">Género</label>
          <select
            className="sm:w-48 rounded-md border-gray-300 py-2"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          >
            {[
              'Todos',
              'Ficción', 'No Ficción', 'Ciencia Ficción', 'Fantasía', 'Romance',
              'Misterio', 'Terror', 'Aventura', 'Drama', 'Thriller', 'Humor',
              'Realismo Mágico', 'Distopía', 'Utopía', 'Literatura Contemporánea', 'Clásicos',
              'Ensayo', 'Filosofía', 'Ciencia', 'Matemáticas', 'Historia',
              'Psicología', 'Educación', 'Política', 'Sociología',
              'Autoayuda', 'Espiritualidad', 'Religión', 'Mindfulness',
              'Crecimiento Personal', 'Salud y Bienestar',
              'Negocios', 'Empresarial', 'Marketing', 'Economía', 'Finanzas',
              'Tecnología', 'Programación', 'Ingeniería', 'Derecho', 'Medicina',
              'Juvenil', 'Infantil', 'Cuentos', 'Didácticos', 'Educativos',
              'Biografía', 'Autobiografía', 'Memorias', 'Crónica', 'Viajes',
              'Arte', 'Música', 'Fotografía', 'Cocina', 'Deportes',
              'Jardinería', 'Mascotas', 'Hogar y Familia', 'Erotismo', 'Otro'
            ].map(g => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* Ciudad */}
        <div className="flex flex-col text-sm">
          <label className="mb-1 text-gray-600">Zona</label>
          <select
            className="sm:w-48 rounded-md border-gray-300 py-2"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          >
            {cities.map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Resultado */}
      {filteredBooks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FaBook className="mx-auto h-12 w-12 text-gray-300 mb-2" />
          <p>No se encontraron libros que coincidan con tu búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBooks.map((book) => {
            const imagenUrl = Array.isArray(book.imagenes) ? book.imagenes[0] : null;
            const avatarUrl = book.user?.avatar || getOwlAvatar(book.usuarioId);

            return (
              <motion.div
                key={book.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleBookSelect(book)}
                className={`relative bg-zinc-900 rounded-xl shadow-sm cursor-pointer transition-all duration-200 
                  p-4 w-full max-w-sm mx-auto sm:max-w-full min-h-[320px] ${
                    selectedBookId === book.id ? 'ring-2 ring-yellow-500' : 'hover:shadow-md'
                  }`}
              >
                <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden rounded">
                  {imagenUrl ? (
                    <img src={imagenUrl} alt={book.titulo} className="h-48 w-full object-cover" />
                  ) : (
                    <div className="text-center text-gray-400">
                      <FaBook className="h-10 w-10 mx-auto" />
                      <p className="text-sm">Sin imagen</p>
                    </div>
                  )}
                </div>

                <div className="mt-3 space-y-1">
                  <h3 className="text-gray-900 font-semibold text-sm break-words line-clamp-2">{book.titulo}</h3>
                  <p className="text-gray-600 text-xs break-words line-clamp-1">{book.autor}</p>
                  {book.quiere && (
                    <p className="text-xs text-yellow-600 italic break-words line-clamp-1">Busca: {book.quiere}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <img src={avatarUrl} alt="Avatar" className="h-6 w-6 rounded-full object-cover" />
                    <span className="text-xs text-gray-600 truncate">{book.user?.nombre || 'Usuario'}</span>
                    {book.user?.ciudad && (
                      <span className="flex items-center gap-1 text-xs text-gray-400 truncate">
                        <FaMapMarkerAlt className="text-gray-400" /> {book.user.ciudad}
                      </span>
                    )}
                  </div>
                </div>

                {selectedBookId === book.id && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white rounded-full p-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

BookSelection.propTypes = {
  onSelectBook: PropTypes.func.isRequired,
  selectedBook: PropTypes.shape({ id: PropTypes.string }),
  currentUserId: PropTypes.string
};

export default BookSelection;
