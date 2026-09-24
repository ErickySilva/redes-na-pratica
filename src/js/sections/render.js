/** 06 Render: blocos da página e contadores avançam com a rolagem. */
import { $, $$ } from "../core/dom.js";
import { addScene } from "../core/scroll.js";

const TOTAL_REQUESTS = 42;
const EXTRA_HOSTS = 4;
const TOTAL_MS = 312;

export function initRender() {
  const sec = $("#render");
  if (!sec) return;
  const blocks = $$(".blk", sec);
  const cReq = $("#cReq");
  const cHosts = $("#cHosts");
  const cMs = $("#cMs");

  addScene(sec, (p) => {
    const n = blocks.length;
    blocks.forEach((b, i) => {
      const threshold = (i + 1) / (n + 1.6);
      b.classList.toggle("on", p > threshold * 0.75);
      b.classList.toggle("done", p > threshold);
    });
    cReq.textContent = Math.round(p * TOTAL_REQUESTS);
    cHosts.textContent = 1 + Math.round(p * EXTRA_HOSTS);
    cMs.textContent = `${Math.round(p * TOTAL_MS)} ms`;
  });
}
