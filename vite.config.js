import { defineConfig } from "vite";

export default defineConfig({
  // Caminhos relativos: o build funciona na raiz de um domínio,
  // num subdiretório do GitHub Pages ou aberto por um servidor estático qualquer.
  base: "./",
  build: {
    target: "es2019",
    cssMinify: true,
    assetsInlineLimit: 4096,
  },
  server: {
    open: true,
  },
});
