import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import { logger } from "./src/utils/logger";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        devOptions: {
          enabled: true,
        },
        includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
        manifest: {
          name: "My Awesome App",
          short_name: "MyApp",
          description: "My Awesome App description",
          theme_color: "#ffffff",
          icons: [
            {
              src: "ap-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "ap-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        },
      }),
      tailwindcss(),
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
      }),
      react(),
    ],
    clearScreen: false,
    customLogger: logger,
    server: {
      allowedHosts: true, // true = permite qualquer host
      host: true,
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
          secure: false,
          rewrite: path => path.replace(/^\/api/, ""),
        },
      },
      port: Number(env.PORT) || 4173,
    },
    preview: {
      host: true,
      allowedHosts: true,
      port: Number(env.PORT) || 4173,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
