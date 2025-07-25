export const enviarNotificacion = async ({ token, titulo, cuerpo }) => {
  const serverKey = "AAAASUPERCLAVEDELPROYECTO"; // ⚠️ SOLO PARA TESTING

  await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: {
      Authorization: `key=${serverKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: token,
      notification: {
        title: titulo,
        body: cuerpo,
        icon: "/logo192.png",
        click_action: "https://bukkus.web.app", // tu dominio PWA
      },
    }),
  });
};
