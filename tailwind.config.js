/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Supporte le basculement manuel (ex: bouton lune/soleil)
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}", // Ajouté pour supporter cn() dans les utilitaires
    "./pages/**/*.{js,jsx,ts,tsx}", // Conservé pour la compatibilité si tu as encore des fichiers en /pages
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0f172a", // Texte principal / Bleu foncé
        accent: "#0ea5a4",  // Teal, couleur accent principale
        muted: "#64748b",   // Texte secondaire
        bg: "#f8fafc",      // Fond général
      },
      container: {
        center: true,
        padding: "1rem",
        screens: {
          "2xl": "1280px", // Limite la largeur pour une meilleure lisibilité
        },
      },
      keyframes: {
        slideDown: {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        slideDown: "slideDown 0.4s ease-out forwards",
      },
    },
  },
  plugins: [],
};
