/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'media', // Ajout pour activer le Dark Mode automatique via préférence système
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0f172a", // texte principal / bleu foncé
        accent: "#0ea5a4",  // teal, couleur accent principale
        muted: "#64748b",    // texte secondaire
        bg: "#f8fafc"        // fond général
      },
      container: {
        center: true,
        padding: "1rem",
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
