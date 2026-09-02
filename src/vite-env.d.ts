/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module "virtual:build-time" {
  export const buildTime: string;
  export default buildTime;
}

declare const __APP_BUILD_TIME__: string;
