import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuration Vite pour Lisible
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Port de développement local
    open: true, // Ouvre automatiquement le navigateur
  },
  resolve: {
    alias: {
      '@': '/src', // Permet d'utiliser @ pour importer facilement
    },
  },
  build: {
    outDir: 'dist', // Dossier de build final
    sourcemap: true, // Génère des fichiers sourcemap pour debug
  },
});
