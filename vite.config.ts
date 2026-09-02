import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";
import { logger } from "./src/utils/logger";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

function getLatestCommitOrBuildTime(): string {
  // 1. Tenta obter do git CLI se disponível
  try {
    const gitTime = execSync("git log -1 --format=%cI", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (gitTime) return gitTime;
  } catch {
    // Continua para fallback
  }

  // 2. Tenta ler diretamente de .git/logs/HEAD (funciona no Docker com volume montado sem git instalado)
  try {
    const gitLogHeadPath = path.resolve(__dirname, ".git/logs/HEAD");
    if (fs.existsSync(gitLogHeadPath)) {
      const content = fs.readFileSync(gitLogHeadPath, "utf-8").trim();
      const lastLine = content.split("\n").pop();
      if (lastLine) {
        const match = lastLine.match(/ (\d{10}) [+-]\d{4}\t/);
        if (match && match[1]) {
          const timestampSec = parseInt(match[1], 10);
          return new Date(timestampSec * 1000).toISOString();
        }
      }
    }
  } catch {
    // Continua para fallback
  }

  return new Date().toISOString();
}

function buildTimePlugin(): Plugin {
  const virtualModuleId = "virtual:build-time";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;

  return {
    name: "vite-plugin-build-time",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        const time = getLatestCommitOrBuildTime();
        return `export const buildTime = ${JSON.stringify(time)};\nexport default buildTime;`;
      }
    },
    handleHotUpdate({ server }) {
      const mod = server.moduleGraph.getModuleById(resolvedVirtualModuleId);
      if (mod) {
        server.moduleGraph.invalidateModule(mod);
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const port = Number(env.PORT) || 3333;
  const currentBuildTime = getLatestCommitOrBuildTime();

  return {
    base:
      process.env.BASE_PATH ||
      env.BASE_PATH ||
      (mode === "production" ? "/auto-point/" : "/"),
    plugins: [
      buildTimePlugin(),
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
      __APP_BUILD_TIME__: JSON.stringify(currentBuildTime),
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
