/**
 * Atalhos de teclado e modo apresentação.
 *   → / J   próxima etapa        ← / K   etapa anterior
 *   T       alterna o tema       ?       mostra os atalhos
 * Os atalhos ficam desligados enquanto a pessoa digita ou navega por abas,
 * para não roubar as setas desses componentes.
 */
import { $, $$ } from "./dom.js";
import { toggleTheme } from "./theme.js";

const stops = () => [$("#hero"), ...$$("[data-stage]")].filter(Boolean);

/** Índice da etapa cujo topo está mais perto do topo da tela (sem passar muito dele). */
function currentIndex(list) {
  const probe = window.innerHeight * 0.3;
  let idx = 0;
  list.forEach((el, i) => {
    if (el.getBoundingClientRect().top <= probe) idx = i;
  });
  return idx;
}

export function goToStage(direction) {
  const list = stops();
  const next = Math.max(0, Math.min(list.length - 1, currentIndex(list) + direction));
  const target = list[next];
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  // Move o foco junto, para leitores de tela e para a próxima tecla Tab.
  const heading = target.querySelector("h1, h2");
  if (heading) {
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
}

const isTyping = (el) =>
  el?.closest?.('input, textarea, select, [contenteditable="true"], [role="tab"], dialog');

export function initKeyboard() {
  const dialog = $("#shortcuts");

  $$("[data-open-shortcuts]").forEach((btn) =>
    btn.addEventListener("click", () => dialog?.showModal()),
  );
  dialog?.addEventListener("click", (e) => {
    if (e.target === dialog || e.target.closest("[data-close]")) dialog.close();
  });

  window.addEventListener("keydown", (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (isTyping(document.activeElement)) return;

    switch (e.key) {
      case "ArrowRight":
      case "j":
      case "J":
        e.preventDefault();
        goToStage(1);
        break;
      case "ArrowLeft":
      case "k":
      case "K":
        e.preventDefault();
        goToStage(-1);
        break;
      case "t":
      case "T":
        toggleTheme();
        break;
      case "?":
        dialog?.showModal();
        break;
    }
  });
}
