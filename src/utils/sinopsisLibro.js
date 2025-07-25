// Consulta Google Books y devuelve { titulo, autor, anio, sinopsis, genero } para un libro
export async function obtenerInfoLibro(titulo, autor) {
  try {
    const query = encodeURIComponent(`${titulo} ${autor}`.trim());
    const url = `https://www.googleapis.com/books/v1/volumes?q=intitle:${query}&maxResults=2&langRestrict=es`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (!data.items || !data.items.length) return { titulo: '', autor: '', anio: '', sinopsis: '', genero: '' };
    const libro = data.items[0].volumeInfo;
    let sinopsis = libro.description || '';
    let genero = (libro.categories && libro.categories[0]) || '';
    let autorLibro = (libro.authors && libro.authors[0]) || '';
    let anio = libro.publishedDate ? libro.publishedDate.slice(0,4) : '';
    let tituloCorr = libro.title || '';
    // Limitar sinopsis a 147 caracteres
    if (sinopsis.length > 147) {
      sinopsis = sinopsis.slice(0, 147);
      const lastSpace = sinopsis.lastIndexOf(' ');
      if (lastSpace > 100) sinopsis = sinopsis.slice(0, lastSpace) + '...';
    }
    // Normalizar mayúsculas tipo título
    function toTitleCase(str) {
      return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }
    return {
      titulo: toTitleCase(tituloCorr),
      autor: toTitleCase(autorLibro),
      anio,
      sinopsis,
      genero
    };
  } catch (e) {
    return { titulo: '', autor: '', anio: '', sinopsis: '', genero: '' };
  }
}
