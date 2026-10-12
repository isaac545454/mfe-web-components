import { federation } from "@module-federation/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    federation({
      name: "shell",
      filename: "remoteEntry.js",
      remotes: {
        characters: {
          type: "module",
          name: "characters",
          entry: "http://localhost:4101/remoteEntry.js",
          entryGlobalName: "characters",
          shareScope: "default",
        },
        locations: {
          type: "module",
          name: "locations",
          entry: "http://localhost:4102/remoteEntry.js",
          entryGlobalName: "locations",
          shareScope: "default",
        },
        episodes: {
          type: "module",
          name: "episodes",
          entry: "http://localhost:4103/remoteEntry.js",
          entryGlobalName: "episodes",
          shareScope: "default",
        },
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
    port: 4100,
    strictPort: true,
    origin: "http://localhost:4100",
    cors: true,
  },
  preview: {
    port: 4100,
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
