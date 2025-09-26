/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./app/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0f172a", // example dark blue - adjust to match previous
        accent: "#0ea5a4",  // example teal
      },
      container: {
        center: true,
        padding: "1rem"
      }
    }
  },
  plugins: []
};
