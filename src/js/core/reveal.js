/** Revela elementos `.rv` conforme entram na tela. */
import { $$, hasIO } from "./dom.js";

export function initReveal() {
  const items = $$(".rv");
  if (!hasIO) {
    items.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
  );
  items.forEach((el) => io.observe(el));
}
