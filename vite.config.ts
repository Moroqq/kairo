import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { resolve } from "path";

const isTauri = !!process.env.TAURI_ENV_PLATFORM;

export default defineConfig({
  // HTTPS только для браузерного dev (нужен для crypto.subtle на телефоне по LAN).
  // Для Tauri-сборки https не включаем.
  plugins: [react(), ...(isTauri ? [] : [basicSsl()])],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: isTauri ? (process.env.TAURI_DEV_HOST || '127.0.0.1') : true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  envPrefix: ["VITE_", "TAURI_ENV_*"],
  build: {
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: false,
  },
});
