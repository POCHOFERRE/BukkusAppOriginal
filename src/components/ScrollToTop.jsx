// src/components/ScrollToTop.jsx
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Componente que se encarga de hacer scroll al inicio de la página
 * cuando cambia la ruta. También maneja el scroll para elementos con overflow.
 */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();
  const prevPathRef = useRef(pathname + search);

  useEffect(() => {
    // Solo hacer scroll si la ruta ha cambiado (no en búsquedas o cambios de estado)
    const currentPath = pathname + search;
    if (prevPathRef.current !== currentPath) {
      // Scroll suave para navegación principal
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // Scroll al elemento principal o al body
      const mainElement = document.querySelector('main') || document.documentElement;
      
      // Usar smooth scroll solo en dispositivos de escritorio para mejor rendimiento
      mainElement.scrollTo({
        top: 0,
        left: 0,
        behavior: isMobile ? 'auto' : 'smooth'
      });
      
      // Para elementos con overflow
      document.querySelectorAll('.overflow-auto, .overflow-y-auto, .overflow-x-auto').forEach(el => {
        if (el.scrollTop > 0) {
          el.scrollTo({ top: 0, left: 0, behavior: isMobile ? 'auto' : 'smooth' });
        }
      });
      
      prevPathRef.current = currentPath;
    }
  }, [pathname, search]);

  return null;
}
