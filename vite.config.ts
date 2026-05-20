import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    port: 8080,
    proxy: {
      "/api": { target: "http://localhost:8787", changeOrigin: true },
      "/socket.io": { target: "http://localhost:8787", ws: true, changeOrigin: true },
    },
  },
});
