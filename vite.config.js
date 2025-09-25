import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 2000,
  },
  server: {
    port: 4028,
    host: "0.0.0.0",
    strictPort: true,
  },
});