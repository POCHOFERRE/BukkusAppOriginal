// elegirMasCercano.js
export const elegirMasCercano = (agrupados, ciudadUsuario) => {
    return agrupados.map((grupo) => {
      // Filtrar libros dentro del grupo
      const libroMasCercano = grupo.publicaciones.reduce((masCercano, libro) => {
        // Aquí se pueden implementar cálculos de distancia reales si se tiene lat/lon
        // Para simplificar, vamos a comparar las ciudades directamente
        if (!masCercano) return libro;
        return libro.ciudad === ciudadUsuario ? libro : masCercano;
      }, null);
      
      return libroMasCercano || grupo.publicaciones[0]; // Si no se encuentra ninguno, tomar el primer libro
    });
  };
  