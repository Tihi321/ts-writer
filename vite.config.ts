import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [solid()],
  server: {
    port: 3000,
  },
  build: {
    target: "esnext",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@components": fileURLToPath(new URL("./src/components", import.meta.url)),
      "@stores": fileURLToPath(new URL("./src/stores", import.meta.url)),
      "@services": fileURLToPath(new URL("./src/services", import.meta.url)),
      "@types": fileURLToPath(new URL("./src/types", import.meta.url)),
      "@config": fileURLToPath(new URL("./src/config", import.meta.url)),
    },
  },
});
