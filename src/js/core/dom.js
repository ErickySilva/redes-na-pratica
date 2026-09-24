/** Utilitários de DOM compartilhados por todas as seções. */

export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

export const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);

export const escapeHtml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

export const reducedMotion =
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const hasIO = "IntersectionObserver" in window;

/**
 * Executa `cb` uma única vez quando `el` entra na tela.
 * Sem IntersectionObserver, executa imediatamente.
 */
export function onceVisible(el, cb, threshold = 0.35) {
  if (!el) return;
  if (!hasIO) {
    cb();
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        cb();
      }
    },
    { threshold },
  );
  io.observe(el);
}

/** Agenda timeouts que podem ser cancelados todos de uma vez. */
export function timerGroup() {
  let ids = [];
  return {
    add(fn, ms) {
      ids.push(setTimeout(fn, ms));
    },
    clear() {
      ids.forEach(clearTimeout);
      ids = [];
    },
  };
}

/**
 * Liga um grupo de abas (role="tablist") com clique, setas e tabindex móvel.
 * `onSelect(tab)` é chamado sempre que a seleção muda.
 */
export function tablist(list, onSelect, { selectOnHover = false } = {}) {
  if (!list) return { select() {} };
  const tabs = () => $$('[role="tab"]', list);

  function select(tab, { focus = false } = {}) {
    tabs().forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    });
    if (focus) tab.focus();
    onSelect(tab);
  }

  list.addEventListener("click", (e) => {
    const tab = e.target.closest('[role="tab"]');
    if (tab && list.contains(tab)) select(tab);
  });

  if (selectOnHover) {
    list.addEventListener("mouseover", (e) => {
      const tab = e.target.closest('[role="tab"]');
      if (tab && tab.getAttribute("aria-selected") !== "true") select(tab);
    });
  }

  list.addEventListener("keydown", (e) => {
    const all = tabs();
    const i = all.indexOf(document.activeElement);
    if (i < 0) return;
    let next = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = all[(i + 1) % all.length];
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
      next = all[(i - 1 + all.length) % all.length];
    else if (e.key === "Home") next = all[0];
    else if (e.key === "End") next = all[all.length - 1];
    if (next) {
      e.preventDefault();
      select(next, { focus: true });
    }
  });

  const initial = tabs().find((t) => t.getAttribute("aria-selected") === "true") || tabs()[0];
  tabs().forEach((t) => (t.tabIndex = t === initial ? 0 : -1));

  return { select, initial };
}
