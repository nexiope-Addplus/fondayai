import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "fonday",
  brand: {
    displayName: "폰데이",
    primaryColor: "#4A7C6E",
    icon: "https://fondayai.com/fonday-toss-logo.png",
  },
  web: {
    host: "172.30.1.46",
    port: 5173,
    commands: {
      dev: "vite --config vite.config.ts --host",
      build: "vite build --config vite.config.ts",
    },
  },
  webViewProps: {
    type: "partner",
  },
  permissions: [],
  outdir: "dist/public",
});
