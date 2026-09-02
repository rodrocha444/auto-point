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
  const port = Number(env.PORT) || 3333;

  return {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        strategies: "injectManifest",
        srcDir: "src",
        filename: "sw.ts",
        devOptions: {
          type: "module",
          enabled: true,
        },
        includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask.svg"],
        manifest: {
          display: "standalone",
          name: "Auto Point",
          short_name: "Auto Point",
          description: "Aplicação PWA para controle de ponto",
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
      allowedHosts: true,
      host: "0.0.0.0",
      port,
      strictPort: true,
      watch: {
        usePolling: true,
      },
      hmr: {
        clientPort: port,
      },
    },
    preview: {
      host: "0.0.0.0",
      allowedHosts: true,
      port,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
