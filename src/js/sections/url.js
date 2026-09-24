/** 01 URL: cada pedaço do endereço explica o próprio papel. */
import { $, tablist } from "../core/dom.js";

export function initUrl() {
  const line = $("#urlLine");
  const out = $("#urlOut");
  if (!line) return;

  const { initial } = tablist(
    line,
    (seg) => {
      out.style.setProperty("--c", getComputedStyle(seg).getPropertyValue("--c"));
      out.innerHTML = `<span class="tagname">${seg.dataset.n}</span><p>${seg.dataset.d}</p>`;
    },
    { selectOnHover: true },
  );

  if (initial) initial.click();
}
