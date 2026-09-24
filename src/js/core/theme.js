/**
 * Tema claro/escuro. A escolha inicial é feita por um script inline no <head>
 * (para não piscar); aqui ficam o botão de alternar e a sincronia com o sistema.
 */
import { $$ } from "./dom.js";

const KEY = "theme";
const root = document.documentElement;
const media = window.matchMedia?.("(prefers-color-scheme: dark)");

const readStored = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

const store = (value) => {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    /* modo privado ou armazenamento bloqueado: o tema só não é lembrado */
  }
};

export const currentTheme = () => (root.dataset.theme === "dark" ? "dark" : "light");

function apply(theme) {
  root.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = getComputedStyle(root).getPropertyValue("--void").trim();
  $$("[data-theme-toggle]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(theme === "dark"));
    btn.setAttribute("aria-label", theme === "dark" ? "Usar tema claro" : "Usar tema escuro");
  });
  window.dispatchEvent(new CustomEvent("themechange", { detail: theme }));
}

export function toggleTheme() {
  const next = currentTheme() === "dark" ? "light" : "dark";
  store(next);
  apply(next);
}

export function initTheme() {
  apply(currentTheme());
  $$("[data-theme-toggle]").forEach((btn) => btn.addEventListener("click", toggleTheme));
  // Sem escolha salva, acompanha o sistema em tempo real.
  media?.addEventListener?.("change", (e) => {
    if (!readStored()) apply(e.matches ? "dark" : "light");
  });
}
