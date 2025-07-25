import { getToken, isSupported, deleteToken } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";
import { messaging, db } from "../config/firebase";

// ✅ Clave VAPID válida
const VAPID_KEY = "BOv93G7NS4nbtcMuFmSKzKHhM9fMtU9ns1nYiuL2FcvumGhGcbchMcvGGrr21oA48LFGmsTXpO1XipF9jqBRFAw";

/**
 * Verifica si las notificaciones están soportadas en el navegador
 * @returns {Promise<boolean>} true si las notificaciones están soportadas
 */
export const notificacionesSoportadas = async () => {
  // Verificar si el navegador soporta Service Worker y notificaciones
  if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    console.warn('Este navegador no soporta notificaciones push');
    return false;
  }
  
  // Verificar si Firebase Messaging está soportado
  const isFirebaseMessagingSupported = await isSupported();
  if (!isFirebaseMessagingSupported) {
    console.warn('Firebase Messaging no es compatible con este navegador');
    return false;
  }
  
  return true;
};

/**
 * Solicita permiso para notificaciones push
 * @param {string} usuarioId - ID del usuario
 * @returns {Promise<{success: boolean, message: string}>} Resultado de la operación
 */
export const solicitarPermisoNotificaciones = async (usuarioId) => {
  try {
    // Verificar si las notificaciones están soportadas
    if (!await notificacionesSoportadas()) {
      return { success: false, message: 'Notificaciones no soportadas en este navegador' };
    }

    // Verificar el estado actual del permiso
    const permission = await Notification.requestPermission();
    
    if (permission === 'denied') {
      console.warn('El permiso de notificaciones fue denegado');
      return { 
        success: false, 
        message: 'Los permisos de notificación están bloqueados. Por favor, desbloquéalos en la configuración de tu navegador.' 
      };
    }

    if (permission !== 'granted') {
      console.warn('Permiso de notificaciones no concedido');
      return { 
        success: false, 
        message: 'No se pudo obtener el permiso para notificaciones' 
      };
    }

    // Obtener el token FCM
    const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });

    if (currentToken) {
      console.log("✅ Token FCM obtenido:", currentToken);
      await setDoc(doc(db, "tokens", usuarioId), { 
        token: currentToken,
        timestamp: new Date().toISOString()
      }, { merge: true });
      
      return { 
        success: true, 
        message: 'Notificaciones activadas correctamente',
        token: currentToken
      };
    }

    console.warn("⚠️ No se pudo obtener el token FCM");
    return { 
      success: false, 
      message: 'No se pudo generar el token de notificaciones' 
    };
  } catch (error) {
    console.error("❌ Error al configurar notificaciones:", error);
    
    // Manejar errores específicos
    let errorMessage = 'Error al configurar notificaciones';
    
    if (error.code === 'messaging/permission-blocked') {
      errorMessage = 'Los permisos de notificación están bloqueados. Por favor, desbloquéalos en la configuración de tu navegador.';
    } else if (error.code === 'messaging/notifications-blocked') {
      errorMessage = 'Las notificaciones están bloqueadas en tu navegador';
    } else if (error.code === 'messaging/unsupported-browser') {
      errorMessage = 'Tu navegador no es compatible con las notificaciones push';
    }
    
    return { 
      success: false, 
      message: errorMessage,
      error: error.code || 'unknown_error'
    };
  }
};

/**
 * Elimina el token FCM y desactiva las notificaciones
 * @param {string} usuarioId - ID del usuario
 * @returns {Promise<{success: boolean, message: string}>} Resultado de la operación
 */
export const desactivarNotificaciones = async (usuarioId) => {
  try {
    if (!await notificacionesSoportadas()) {
      return { success: false, message: 'Notificaciones no soportadas' };
    }

    // Eliminar el token de FCM
    await deleteToken(messaging);
    
    // Eliminar el token de la base de datos
    await setDoc(doc(db, "tokens", usuarioId), { 
      token: null,
      disabled: true,
      disabledAt: new Date().toISOString()
    }, { merge: true });
    
    return { 
      success: true, 
      message: 'Notificaciones desactivadas correctamente' 
    };
  } catch (error) {
    console.error("❌ Error al desactivar notificaciones:", error);
    return { 
      success: false, 
      message: 'Error al desactivar notificaciones',
      error: error.code || 'unknown_error'
    };
  }
};
