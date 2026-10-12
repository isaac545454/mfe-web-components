import { federation } from "@module-federation/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react({ reactRefreshHost: "http://localhost:4101" }),
    federation({
      name: "characters",
      filename: "remoteEntry.js",
      exposes: {
        "./mount": "./src/mount.tsx",
      },
      shared: {
        "@isaac545454/frontend-events": {
          singleton: true,
          requiredVersion: false,
        },
      },
      dts: false,
    }),
  ],
  server: {
    port: 4101,
    strictPort: true,
    origin: "http://localhost:4101",
    cors: true,
  },
  preview: {
    port: 4101,
    strictPort: true,
    cors: true,
  },
  build: {
    target: "chrome89",
    modulePreload: false,
  },
  optimizeDeps: {
    exclude: ["@isaac545454/nucleo"],
  },
});
