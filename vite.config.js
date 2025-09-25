import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4028,
    host: "0.0.0.0",
    strictPort: true,
  },
  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 2000,
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});