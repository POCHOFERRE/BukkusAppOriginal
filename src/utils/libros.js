// src/utils/libros.js

// Agrupa los libros por título + autor + editorial
export const agruparPorLibro = (libros = []) => {
  const agrupados = [];
  
  libros.forEach((libro) => {
    const clave = `${libro.titulo?.toLowerCase()}|${libro.autor?.toLowerCase()}|${libro.editorial?.toLowerCase()}`;
    
    // Buscar si ya existe un grupo con esta clave
    const grupoExistente = agrupados.find((grupo) => grupo.clave === clave);
    
    if (grupoExistente) {
      // Si ya existe, añadir la publicación al grupo
      grupoExistente.publicaciones.push(libro);
    } else {
      // Si no existe, crear un nuevo grupo
      agrupados.push({
        clave,
        titulo: libro.titulo,
        autor: libro.autor,
        editorial: libro.editorial,
        publicaciones: [libro],
      });
    }
  });
  
  return agrupados;
};

// Elige el más cercano por ciudad (si coincide), sino el primero del grupo
export const elegirMasCercano = (agrupados, ciudadUsuario = "") => {
  const resultado = [];
  
  // Iterar sobre los grupos
  for (const grupo of agrupados) {
    // Buscar el libro más cercano (por ciudad)
    const libroCercano = grupo.publicaciones.find((l) => l.ciudad?.toLowerCase() === ciudadUsuario?.toLowerCase()) || grupo.publicaciones[0];
    
    // Crear el objeto con la información del libro más cercano y la cantidad de publicaciones
    resultado.push({
      ...libroCercano,
      cantidad: grupo.publicaciones.length,
      publicaciones: grupo.publicaciones,
    });
  }
  
  return resultado;
};
