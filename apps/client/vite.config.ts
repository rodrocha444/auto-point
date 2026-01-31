import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import { logger } from "./src/utils/logger";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  customLogger: logger,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
