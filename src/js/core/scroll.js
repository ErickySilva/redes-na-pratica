/**
 * Motor de rolagem: calcula o progresso (0–1) de cada cena fixada
 * e atualiza a barra de progresso do topo. Um único listener, um único rAF.
 */
import { $, clamp } from "./dom.js";

const scenes = [];
let ticking = false;
let progBar = null;

function frame() {
  ticking = false;
  const vh = window.innerHeight;

  for (const { el, cb } of scenes) {
    const r = el.getBoundingClientRect();
    const span = r.height - vh;
    // Em telas pequenas a cena deixa de ser fixada: vira um gatilho simples.
    cb(span <= 0 ? (r.top < vh * 0.4 ? 1 : 0) : clamp(-r.top / span, 0, 1));
  }

  if (progBar) {
    const doc = document.documentElement;
    const p = doc.scrollTop / Math.max(1, doc.scrollHeight - vh);
    progBar.style.width = `${(p * 100).toFixed(2)}%`;
  }
}

export function requestFrame() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(frame);
  }
}

/** Registra uma cena: `cb(progress)` é chamado a cada quadro de rolagem. */
export function addScene(el, cb) {
  if (el) scenes.push({ el, cb });
}

export function initScroll() {
  progBar = $("#progBar");
  window.addEventListener("scroll", requestFrame, { passive: true });
  window.addEventListener("resize", requestFrame);
  requestFrame();
}
