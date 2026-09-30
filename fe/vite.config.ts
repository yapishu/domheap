import { defineConfig } from "vite";
export default defineConfig({
  base: "/apps/domheap/",
  build: {
    outDir: "../desk/web",
    emptyOutDir: true,
    rollupOptions: { output: { hashCharacters: "hex" } },
  },
  server: {
    proxy: {
      "/apps/domheap/api": "http://localhost:8080",
      "/notes": "http://localhost:8080",
      "/~/": "http://localhost:8080",
    },
  },
});
