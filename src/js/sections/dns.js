/** 02 DNS: a consulta percorre a hierarquia conforme a rolagem ou pelos botões. */
import { $, $$, clamp, reducedMotion, timerGroup } from "../core/dom.js";
import { addScene } from "../core/scroll.js";

const LAST = 5;

export function initDns() {
  const sec = $("#dns");
  if (!sec) return;
  const nodes = $$(".knode", sec);
  const beam = $("#beam");
  const ip = $("#ipOut");
  const meta = $("#ipMeta");
  const againBtn = $("#dnsAgain");
  const flushBtn = $("#dnsFlush");
  const stepBtn = $("#dnsStep");
  const timers = timerGroup();

  let cached = false; // com cache, raiz/.com/autoritativo são pulados
  let manual = false; // enquanto verdadeiro, a rolagem não controla a cena
  let cursor = -1;

  const liveNodes = () => nodes.filter((n) => !(cached && n.dataset.cache));

  function paint(step) {
    nodes.forEach((n) => {
      const idx = Number(n.dataset.k);
      const skipped = cached && !!n.dataset.cache;
      n.classList.toggle("skip", skipped);
      n.classList.toggle("on", !skipped && idx <= step);
      n.classList.toggle("hit", !skipped && idx < step);
    });
    const done = step >= LAST;
    ip.classList.toggle("on", done);
    if (done && !meta.textContent) {
      meta.textContent = cached
        ? "resposta do cache, cerca de 2 ms"
        : "cinco consultas, cerca de 120 ms";
    }
  }

  function setBeam(fraction) {
    beam.style.height = `${fraction * 100}%`;
  }

  addScene(sec, (p) => {
    if (manual) return;
    const step = Math.floor(p * 6.6);
    if (step < LAST) meta.textContent = "";
    paint(Math.min(step, LAST));
    setBeam(clamp(p * 1.1, 0, 1));
  });

  function play() {
    manual = true;
    timers.clear();
    meta.textContent = "";
    ip.classList.remove("on");
    const order = liveNodes();
    const delay = reducedMotion ? 0 : cached ? 160 : 420;
    order.forEach((n, i) => {
      timers.add(() => {
        paint(Number(n.dataset.k));
        setBeam((i + 1) / order.length);
        if (i === order.length - 1) {
          paint(LAST);
          manual = false;
        }
      }, i * delay);
    });
  }

  function resetStepper() {
    cursor = -1;
    stepBtn.textContent = "AVANÇAR UM SALTO";
  }

  stepBtn?.addEventListener("click", () => {
    manual = true;
    timers.clear();
    const live = liveNodes();
    cursor = (cursor + 1) % (live.length + 1);

    if (cursor === live.length) {
      resetStepper();
      meta.textContent = "";
      ip.classList.remove("on");
      nodes.forEach((n) => n.classList.remove("on", "hit"));
      setBeam(0);
      return;
    }

    const last = cursor === live.length - 1;
    paint(last ? LAST : Number(live[cursor].dataset.k));
    setBeam((cursor + 1) / live.length);
    stepBtn.textContent = last ? "RECOMEÇAR" : "AVANÇAR UM SALTO";
  });

  againBtn?.addEventListener("click", () => {
    cached = true;
    resetStepper();
    play();
  });

  flushBtn?.addEventListener("click", () => {
    cached = false;
    resetStepper();
    play();
    meta.textContent = "cache limpo, a próxima consulta percorre a hierarquia inteira";
  });
}
