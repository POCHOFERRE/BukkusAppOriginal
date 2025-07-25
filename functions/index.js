const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.notificacionNuevaOferta = functions.firestore
  .document("ofertas/{ofertaId}")
  .onCreate(async (snap, context) => {
    const oferta = snap.data();
    const usuarioReceptorId = oferta.para;

    // Traer el token FCM del usuario receptor desde Firestore
    const userDoc = await admin.firestore().collection("usuarios").doc(usuarioReceptorId).get();
    const userData = userDoc.data();

    const userToken = userData?.fcmToken;

    if (!userToken) {
      console.log("El usuario no tiene token FCM");
      return null;
    }

    const message = {
      token: userToken,
      notification: {
        title: "¡Tenés una nueva oferta!",
        body: "Entrá a la app y mirá lo que te propusieron",
      },
      android: {
        notification: {
          sound: "sonido_notificacion" // sin la extensión .mp3
        }
      }
    };

    try {
      const response = await admin.messaging().send(message);
      console.log("Notificación enviada:", response);
    } catch (error) {
      console.error("Error al enviar:", error);
    }

    return null;
  });
