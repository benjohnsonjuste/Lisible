/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        'fade-in-up': 'fadeInUp 0.3s ease-out forwards',
        'bubble': 'bubbleUp 2s cubic-bezier(0.08, 0.81, 0.24, 0.99) forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        bubbleUp: {
          '0%': { opacity: '1', transform: 'translateY(0) scale(0.8) rotate(0deg)' },
          '50%': { transform: 'translateX(15px) rotate(15deg)' },
          '100%': { opacity: '0', transform: 'translateY(-280px) scale(1.6) rotate(-15deg)' },
        },
      },
    },
  },
  plugins: [],
}
