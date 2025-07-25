const sharp = require('sharp');

// Ruta de tu PNG fuente
const input = 'public/icono-u-truekar.png';

// Exportar a 192x192
sharp(input)
  .resize(192, 192)
  .png()
  .toFile('public/icon-192.png', (err) => {
    if (err) {
      console.error('Error creando icon-192.png:', err);
    } else {
      console.log('✅ icon-192.png generado');
    }
  });

// Exportar a 512x512
sharp(input)
  .resize(512, 512)
  .png()
  .toFile('public/icon-512.png', (err) => {
    if (err) {
      console.error('Error creando icon-512.png:', err);
    } else {
      console.log('✅ icon-512.png generado');
    }
  });
