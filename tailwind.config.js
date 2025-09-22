/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",   // Scan tous les fichiers dans pages/
    "./components/**/*.{js,ts,jsx,tsx}", // Scan tous les fichiers dans components/
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb', // Bleu principal
        secondary: '#fbbf24', // Jaune secondaire
        background: '#f9fafb', // Fond clair
        textPrimary: '#111827', // Texte principal
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
