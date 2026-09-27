import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Proxies /api/* to the FastAPI backend during local dev.
// Change the target if your backend runs on a different port.
export default defineConfig({
  plugins: [react(),tailwindcss(),],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
