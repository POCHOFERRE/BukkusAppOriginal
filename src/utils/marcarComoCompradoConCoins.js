export function marcarComoCompradoConCoins(productoId, compradorId) {
  const productos = JSON.parse(localStorage.getItem("productos")) || [];

  const actualizados = productos.map((p) => {
    if (p.id === productoId) {
      return {
        ...p,
        compradoConCoins: true,
        truequeFinalizado: true,
        usuarioId: compradorId, // Ahora pertenece al comprador
      };
    }
    return p;
  });

  localStorage.setItem("productos", JSON.stringify(actualizados));

  // 🔁 Notificamos al sistema que se actualizó
  window.dispatchEvent(new Event("productoActualizado"));
}
