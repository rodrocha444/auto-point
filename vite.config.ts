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
    base:
      process.env.BASE_PATH ||
      env.BASE_PATH ||
      (mode === "production" ? "/auto-point/" : "/"),
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
          start_url:
            process.env.BASE_PATH ||
            env.BASE_PATH ||
            (mode === "production" ? "/auto-point/" : "/"),
          scope:
            process.env.BASE_PATH ||
            env.BASE_PATH ||
            (mode === "production" ? "/auto-point/" : "/"),
          theme_color: "#030712",
          background_color: "#030712",
          icons: [
            {
              src: "ap-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable",
            },
            {
              src: "ap-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
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
    define: {
      __APP_BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
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
