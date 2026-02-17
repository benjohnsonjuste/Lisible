/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // <--- AJOUTE CETTE LIGNE
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "#0d9488", // Ton teal-600
      },
    },
  },
  plugins: [],
};
