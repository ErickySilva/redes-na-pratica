/** Destaca a etapa atual no trilho lateral e na barra superior. */
import { $, $$, hasIO } from "./dom.js";

export function initNav() {
  if (!hasIO) return;
  const links = $$(".railnav a");
  const nowLabel = $("#nowLabel");

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const { id, dataset } = e.target;
        links.forEach((a) => {
          if (a.getAttribute("href") === `#${id}`) a.setAttribute("aria-current", "step");
          else a.removeAttribute("aria-current");
        });
        if (nowLabel) nowLabel.textContent = `${dataset.stage} ${dataset.name}`;
      });
    },
    { rootMargin: "-45% 0px -45% 0px" },
  );

  $$("[data-stage]").forEach((s) => io.observe(s));
}
