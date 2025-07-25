// Agrupa los libros solo por título
export const agruparPorLibro = (libros = []) => {
    const agrupados = [];
  
    libros.forEach((libro) => {
      const clave = libro.titulo?.toLowerCase();  // Agrupamos solo por título
  
      // Buscar si ya existe un grupo con este título
      const grupoExistente = agrupados.find((grupo) => grupo.clave === clave);
  
      if (grupoExistente) {
        // Si ya existe, añadir la publicación al grupo
        grupoExistente.publicaciones.push(libro);
      } else {
        // Si no existe, crear un nuevo grupo
        agrupados.push({
          clave,
          titulo: libro.titulo,
          publicaciones: [libro],
        });
      }
    });
  
    return agrupados;
  };
  