import { defineConfig } from "vite";
import htmlPartials from "./plugins/html-partials.js";

export default defineConfig({
  // Caminhos relativos: o build funciona na raiz de um domínio,
  // num subdiretório do GitHub Pages ou aberto por um servidor estático qualquer.
  base: "./",
  plugins: [htmlPartials({ dir: "src/partials" })],
  build: {
    target: "es2019",
    cssMinify: true,
    assetsInlineLimit: 4096,
  },
  server: {
    open: true,
  },
  test: {
    include: ["tests/unit/**/*.test.js"],
  },
});
