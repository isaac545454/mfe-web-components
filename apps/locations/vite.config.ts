import { federation } from "@module-federation/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith("n-"),
        },
      },
    }),
    federation({
      name: "locations",
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
    port: 4102,
    strictPort: true,
    origin: "http://localhost:4102",
    cors: true,
  },
  preview: {
    port: 4102,
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
