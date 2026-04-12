import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "fonday",
  brand: {
    displayName: "Fonday - AI 피부 분석",
    primaryColor: "#4A7C6E",
    icon: "",
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite --config vite.config.ts",
      build: "vite build --config vite.config.ts",
    },
  },
  webViewProps: {
    type: "partner",
  },
  permissions: [],
  outdir: "dist/public",
});
