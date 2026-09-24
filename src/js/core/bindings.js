/** Mantém o texto da página sincronizado com o estado: [data-dom], [data-dom2] e [data-ip]. */
import { $$, escapeHtml } from "./dom.js";
import { get, subscribe } from "./state.js";

function paintDomain(domain) {
  // <wbr> depois de cada ponto: domínios longos quebram entre rótulos, nunca no meio de um.
  const breakable = escapeHtml(domain).replace(/\./g, ".<wbr>");
  $$("[data-dom]").forEach((el) => (el.innerHTML = breakable));
  const bare = domain.replace(/^www\./, "");
  $$("[data-dom2]").forEach((el) => (el.textContent = bare));
}

function paintIp(ip) {
  $$("[data-ip]").forEach((el) => (el.textContent = ip));
}

export function initBindings() {
  subscribe("domain", paintDomain);
  subscribe("ip", paintIp);
  paintDomain(get("domain"));
  paintIp(get("ip"));
}
