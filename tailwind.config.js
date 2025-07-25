


/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      inset: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      padding: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      colors: {
        oliva: {
          DEFAULT: "#6b8e23",
          claro: "#a0b665",
          fondo: "#f5f5dc",
        },
        cream: {
          DEFAULT: "#FFFBED",
        },
      },
      fontFamily: {
        sans: ["Quicksand", "sans-serif"],
      },
    },
  },
  plugins: [],
  corePlugins: {
    scrollbar: false, // Desactiva scrollbars personalizados por defecto
  },
  
};

