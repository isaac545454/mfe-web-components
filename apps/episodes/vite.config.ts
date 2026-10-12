import angular from "@analogjs/vite-plugin-angular";
import { federation } from "@module-federation/vite";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    mainFields: ["module"],
  },
  plugins: [
    angular(),
    federation({
      name: "episodes",
      filename: "remoteEntry.js",
      exposes: {
        "./mount": "./src/mount.ts",
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
    port: 4103,
    strictPort: true,
    origin: "http://localhost:4103",
    cors: true,
  },
  preview: {
    port: 4103,
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
