import React, { useEffect, useState, useCallback } from "react";
import Joyride, { STATUS } from "react-joyride";
import PropTypes from "prop-types";

export default function TourOnboarding({ usuarioActivo }) {
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Verificar si todos los elementos objetivo existen
  const checkAllTargetsExist = useCallback(() => {
    if (!steps.length) return false;
    
    console.log('Checking for target elements...');
    let allFound = true;
    
    // For mobile, ensure BottomNav is visible
    if (isMobile) {
      const bottomNav = document.querySelector('.md\\:hidden');
      if (bottomNav) {
        bottomNav.style.display = 'flex';
        bottomNav.style.visibility = 'visible';
        bottomNav.style.opacity = '1';
        bottomNav.style.zIndex = '9999';
      }
    }
    
    steps.forEach((step, index) => {
      // Try multiple selector strategies for better mobile compatibility
      let elements = [];
      
      // Try direct query first
      elements = document.querySelectorAll(step.target);
      
      // If not found, try with more specific selectors
      if (elements.length === 0 && step.target.startsWith('.')) {
        const className = step.target.replace('.', '');
        // Try with more specific selector
        elements = document.querySelectorAll(`[class*="${className}"]`);
        
        // If still not found, try with data attributes
        if (elements.length === 0) {
          elements = document.querySelectorAll(`[data-tour="${className}"]`);
        }
      }
      
      console.log(`Step ${index + 1} (${step.target}): ${elements.length} elements found`);
      
      if (elements.length === 0) {
        console.warn(`Element not found: ${step.target}`);
        allFound = false;
        
        // Debug: Log all elements with similar classes
        const className = step.target.replace('.', '');
        const allElements = document.querySelectorAll('*');
        const similarElements = [];
        
        allElements.forEach(el => {
          if (
            (el.className && typeof el.className === 'string' && el.className.includes(className)) ||
            (el.getAttribute && el.getAttribute('data-tour') === className)
          ) {
            similarElements.push({
              className: el.className,
              tagName: el.tagName,
              text: el.textContent?.trim() || '',
              element: el,
              rect: el.getBoundingClientRect(),
              computedStyle: window.getComputedStyle(el),
              parent: el.parentElement?.tagName
            });
          }
        });
        
        console.log(`Similar elements for ${step.target}:`, similarElements);
      } else {
        // Log found elements for debugging
        elements.forEach((el, i) => {
          console.log(`Found element ${i + 1} for ${step.target}:`, {
            tagName: el.tagName,
            className: el.className,
            rect: el.getBoundingClientRect(),
            computedStyle: window.getComputedStyle(el),
            parent: el.parentElement?.tagName
          });
        });
      }
    });
    
    return allFound;
  }, [steps, isMobile]);

  // Iniciar el tour cuando todos los elementos estén listos
  useEffect(() => {
    if (!usuarioActivo?.id) return;
    
    console.log('Initializing tour...');
    console.log('Is mobile:', isMobile);
    
    const mobileSteps = [
      {
        target: ".tour-inicio",
        content: "Pulsa aquí para volver al inicio de la aplicación.",
        disableBeacon: true,
        placement: "top"
      },
      {
        target: ".tour-billetera",
        content: "Consulta tu saldo de BUKKcoins y gestiona tu billetera.",
        placement: "top"
      },
      {
        target: ".tour-publicar",
        content: "Toca aquí para publicar libros que ya no uses y empezar a intercambiar.",
        placement: "top"
      },
      {
        target: ".tour-ofertas",
        content: "Revisa aquí las ofertas que has recibido y las que has enviado a otros.",
        placement: "top"
      },
      {
        target: ".tour-chat",
        content: "Accede a tus conversaciones y mantente en contacto con otros usuarios.",
        placement: "top"
      },
      {
        target: ".tour-perfil",
        content: "Configura tu perfil, revisa tus publicaciones y ajusta tus preferencias.",
        placement: "top"
      }
    ];

    const desktopSteps = [
      {
        target: ".tour-home",
        content: "Bienvenido a BuKKus. Este es el inicio de la aplicación.",
        disableBeacon: true,
        placement: "bottom"
      },
      {
        target: ".tour-destacados",
        content: "Aquí encontrarás los libros destacados de la semana.",
        placement: "bottom"
      },
      {
        target: ".tour-card",
        content: "Cada tarjeta representa un libro disponible para intercambiar. Haz clic para ver más detalles.",
        placement: "top"
      },
      {
        target: ".tour-billetera",
        content: "Tu saldo de BUKKcoins aparece aquí. Podrás usarlos para canjear libros.",
        placement: "left"
      },
      {
        target: ".tour-publicar",
        content: "Publica libros que ya no uses para que otros usuarios los vean.",
        placement: "left"
      },
      {
        target: ".tour-ofertas",
        content: "Revisa el estado de tus ofertas y las que has recibido.",
        placement: "left"
      },
      {
        target: ".tour-chat",
        content: "Aquí podrás chatear con otros usuarios cuando hagan match con tus ofertas.",
        placement: "left"
      },
      {
        target: ".tour-perfil",
        content: "Configura tu perfil y preferencias de usuario.",
        placement: "left"
      }
    ];

    const currentSteps = isMobile ? mobileSteps : desktopSteps;
    console.log('Tour steps:', currentSteps);
    setSteps(currentSteps);
    
    // Verificar si el tour ya se mostró
    const tourVisto = localStorage.getItem(`tourVisto_${usuarioActivo.id}`);
    if (tourVisto) {
      console.log('Tour ya fue mostrado anteriormente');
      return;
    }
    
    // Función para iniciar el tour
    const startTour = () => {
      console.log('Starting tour...');
      if (checkAllTargetsExist()) {
        console.log('All targets found, starting tour');
        setRun(true);
        return true;
      }
      return false;
    };
    
    // Intentar iniciar el tour después de un breve retraso
    const timer = setTimeout(() => {
      if (!startTour()) {
        // Si no se encontraron todos los objetivos, seguir intentando
        const checkInterval = setInterval(() => {
          console.log('Trying to start tour...');
          if (startTour()) {
            clearInterval(checkInterval);
          }
        }, 500);
        
        // Dejar de intentar después de 10 segundos
        setTimeout(() => {
          clearInterval(checkInterval);
          console.warn('Could not find all tour targets after 10 seconds');
        }, 10000);
      }
    }, 1000);
    
    return () => {
      clearTimeout(timer);
    };
  }, [usuarioActivo, isMobile]);

  const handleJoyrideCallback = (data) => {
    const { status, action, index, step, type } = data;
    
    // Debug log
    console.log('Tour callback:', { status, action, index, step, type });
    
    // Log when a step is about to be shown
    if (type === 'step:before' && step) {
      console.log(`Step ${index + 1}/${steps.length}: ${step.target}`);
      
      // Forzar un pequeño retraso para asegurar que el DOM se haya actualizado
      setTimeout(() => {
        // Buscar el elemento objetivo
        let targetElement = document.querySelector(step.target);
        
        // Si no se encuentra, intentar con una búsqueda más flexible
        if (!targetElement) {
          console.warn(`Target not found: ${step.target}, trying flexible search...`);
          const className = step.target.replace('.', '');
          const allElements = document.querySelectorAll('*');
          
          // Buscar elementos con la clase en cualquier parte del className
          for (const el of allElements) {
            if (el.className && typeof el.className === 'string' && el.className.includes(className)) {
              targetElement = el;
              console.log(`Found element with class '${className}' in:`, el.className);
              break;
            }
          }
        }
        
        if (targetElement) {
          console.log(`Scrolling to ${step.target}...`);
          
          // Asegurarse de que el elemento sea visible
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
          });
          
          // Resaltar el elemento para depuración
          targetElement.style.boxShadow = '0 0 0 3px rgba(247, 178, 42, 0.5)';
          setTimeout(() => {
            if (targetElement) targetElement.style.boxShadow = '';
          }, 2000);
          
          // Forzar un reflow para asegurar que el scroll se complete
          targetElement.offsetHeight;
        } else {
          console.error(`Element not found: ${step.target}`);
          console.log('Available elements with similar classes:');
          
          // Mostrar información sobre elementos con clases similares
          const allElements = document.querySelectorAll('*');
          const className = step.target.replace('.', '');
          const similarElements = [];
          
          allElements.forEach(el => {
            if (el.className && typeof el.className === 'string' && el.className.includes(className)) {
              similarElements.push({
                className: el.className,
                tagName: el.tagName,
                text: el.textContent?.trim() || '',
                element: el
              });
            }
          });
          
          console.log(`Found ${similarElements.length} similar elements:`, similarElements);
        }
      }, 100);
    }
    
    // When tour is finished or skipped, mark as seen
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      localStorage.setItem(`tourVisto_${usuarioActivo?.id}`, "true");
      setRun(false);
    }
  };

  // Don't render if no steps or no user
  if (!steps.length || !usuarioActivo) return null;

  // Spanish locale configuration
  const locale = {
    back: 'Atrás',
    close: 'Cerrar',
    last: 'Finalizar',
    next: 'Siguiente',
    skip: 'Omitir',
  };

  const joyrideStyles = {
  beacon: {
    backgroundColor: 'transparent',
    border: 0,
    borderRadius: 0,
    color: '#555',
    cursor: 'pointer',
    fontSize: 16,
    lineHeight: 1,
    padding: 8,
    WebkitAppearance: 'none',
    display: 'inline-block',
    height: 36,
    position: 'relative',
    width: 36,
    zIndex: 10000
  },
  beaconInner: {
    animation: 'joyride-beacon-inner 1.2s infinite ease-in-out',
    backgroundColor: '#f7b22a',
    borderRadius: '50%',
    display: 'block',
    height: '50%',
    left: '50%',
    opacity: 0.7,
    position: 'absolute',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: '50%'
  },
  beaconOuter: {
    animation: 'joyride-beacon-outer 1.2s infinite ease-in-out',
    backgroundColor: 'rgba(247,178,42, 0.2)',
    border: '2px solid #f7b22a',
    borderRadius: '50%',
    boxSizing: 'border-box',
    display: 'block',
    height: '100%',
    left: 0,
    opacity: 0.9,
    position: 'absolute',
    top: 0,
    transformOrigin: 'center',
    width: '100%'
  },
  tooltip: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    boxSizing: 'border-box',
    color: '#1f2937',
    fontSize: 16,
    maxWidth: 300,
    padding: 16,
    position: 'relative',
    width: 'calc(100vw - 32px)',
    margin: '0 16px'
  },
  tooltipContainer: {
    lineHeight: 1.4,
    textAlign: 'left'
  },
  tooltipTitle: {
    fontSize: 18,
    margin: 0
  },
  tooltipContent: {
    padding: '20px 10px'
  },
  tooltipFooter: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 15
  },
  tooltipFooterSpacer: {
    flex: 1
  },
  buttonNext: {
    backgroundColor: '#f7b22a',
    border: 0,
    borderRadius: 20,
    color: '#000000',
    cursor: 'pointer',
    fontSize: '14px',
    lineHeight: 1,
    padding: '8px 16px',
    WebkitAppearance: 'none',
    fontWeight: 'bold'
  },
  buttonBack: {
    backgroundColor: 'transparent',
    border: 0,
    borderRadius: 0,
    color: '#6b7280',
    cursor: 'pointer',
    fontSize: '14px',
    lineHeight: 1,
    padding: 8,
    WebkitAppearance: 'none',
    marginLeft: 'auto',
    marginRight: 8
  },
  buttonClose: {
    backgroundColor: 'transparent',
    border: 0,
    borderRadius: 0,
    color: '#1f2937',
    cursor: 'pointer',
    fontSize: 16,
    lineHeight: 1,
    padding: 15,
    WebkitAppearance: 'none',
    height: 14,
    position: 'absolute',
    right: 0,
    top: 0,
    width: 14
  },
  buttonSkip: {
    backgroundColor: 'transparent',
    border: 0,
    borderRadius: 0,
    color: '#6b7280',
    cursor: 'pointer',
    fontSize: '14px',
    lineHeight: 1,
    padding: 8,
    WebkitAppearance: 'none'
  },
  overlay: {
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 10000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    mixBlendMode: 'hard-light'
  },
  options: {
    arrowColor: '#ffffff',
    backgroundColor: '#ffffff',
    beaconSize: 36,
    overlayColor: 'rgba(0, 0, 0, 0.5)',
    primaryColor: '#f7b22a',
    spotlightShadow: '0 0 15px rgba(0, 0, 0, 0.5)',
    textColor: '#1f2937',
    width: 380,
    zIndex: 10000
  }
};

  return (
    <div className="joyride-container">
      <Joyride
        steps={steps}
        run={run}
        continuous={true}
        showSkipButton={true}
        showProgress={true}
        scrollToFirstStep={true}
        scrollOffset={100}
        disableOverlayClose={false}
        disableCloseOnEsc={false}
        disableScrolling={false}
        spotlightClicks={true}
        spotlightPadding={5}
        locale={locale}
        styles={joyrideStyles}
        callback={handleJoyrideCallback}
        floaterProps={{
          disableAnimation: false,
          disableFlip: true,
          styles: {
            arrow: { spread: 24, size: 12 },
          },
        }}
      />
      <style>
        {`
          /* Force Spanish text for all Joyride buttons */
          .react-joyride__tooltip button[data-action='next']::after {
            content: '${locale.next}' !important;
          }
          .react-joyride__tooltip button[data-action='back']::after {
            content: '${locale.back}' !important;
          }
          .react-joyride__tooltip button[data-action='close']::after {
            content: '${locale.close}' !important;
          }
          .react-joyride__tooltip button[data-action='last']::after {
            content: '${locale.last}' !important;
          }
          .react-joyride__tooltip button[data-action='skip']::after {
            content: '${locale.skip}' !important;
          }
        `}
      </style>
    </div>
  );
}

TourOnboarding.propTypes = {
  usuarioActivo: PropTypes.object,
};
