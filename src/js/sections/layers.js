/** 07 Camadas: acordeão do modelo TCP/IP e faixa de portas conhecidas. */
import { $, $$, tablist } from "../core/dom.js";

function initAccordion() {
  const box = $("#layers");
  if (!box) return;
  const buttons = $$(".layerbtn", box);

  box.addEventListener("click", (e) => {
    const btn = e.target.closest(".layerbtn");
    if (!btn) return;
    const wasOpen = btn.getAttribute("aria-expanded") === "true";
    buttons.forEach((b) => {
      const open = b === btn && !wasOpen;
      b.setAttribute("aria-expanded", String(open));
      document.getElementById(b.getAttribute("aria-controls")).hidden = !open;
    });
  });
}

function initPorts() {
  const out = $("#portOut");
  tablist($("#portStrip"), (tab) => {
    const [num, name] = tab.textContent.trim().split(" ");
    out.innerHTML = `<b>Porta ${num}, ${name.toUpperCase()}.</b> ${tab.dataset.d}`;
  });
}

export function initLayers() {
  initAccordion();
  initPorts();
}
