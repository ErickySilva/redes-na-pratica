/**
 * 06+ Raio-X: cascata de rede desta própria página, medida pelo navegador
 * (Navigation Timing + Resource Timing, a mesma fonte da aba Network do DevTools).
 */
import { $, escapeHtml, onceVisible } from "../core/dom.js";
import { waterfallRows, splitByLoad, summarize } from "../lib/timing.js";
import { formatMs, formatBytes } from "../lib/text.js";

const KIND_LABEL = {
  html: "documento",
  css: "estilo",
  js: "script",
  font: "fonte",
  img: "imagem",
  data: "consulta",
  other: "outro",
};

const PHASE_NOTE = {
  dns: "tradução do nome em IP (parada 02)",
  tcp: "aperto de mão em três tempos (parada 03)",
  tls: "negociação do túnel e do certificado (parada 04)",
  ttfb: "tempo até o primeiro byte da resposta (parada 05)",
  download: "o HTML chegando pela rede",
};

const PROTOCOL_LABEL = { h2: "HTTP/2", h3: "HTTP/3 (QUIC, sobre UDP)", "http/1.1": "HTTP/1.1" };

function readEntries() {
  const perf = window.performance;
  if (!perf?.getEntriesByType) return null;
  const [nav] = perf.getEntriesByType("navigation");
  const resources = perf.getEntriesByType("resource");
  return nav ? { nav, resources } : null;
}

function describe(row, loadEnd) {
  const parts = [
    `<b>${escapeHtml(row.name)}</b>`,
    KIND_LABEL[row.kind],
    escapeHtml(row.host),
    formatMs(row.ms),
    row.cached ? "do cache" : formatBytes(row.bytes),
    PROTOCOL_LABEL[row.protocol] ?? escapeHtml(row.protocol),
  ];
  let html = parts.filter(Boolean).join(" · ");

  if (row.kind === "html") {
    const phases = row.phases
      .map(
        (p) =>
          `<li><span class="xk xk--${p.key}"></span>${p.label}: <b>${formatMs(p.ms)}</b> <span class="is-faint">${PHASE_NOTE[p.key]}</span></li>`,
      )
      .join("");
    html += `<ul class="xray-phases">${phases}</ul>`;
    const zero = row.phases.filter((p) => ["dns", "tcp", "tls"].includes(p.key) && p.ms < 1);
    if (zero.length) {
      html += `<p class="is-faint">Zero em ${zero.map((p) => p.label).join(", ")} não é erro: o navegador reaproveitou uma conexão já aberta, a resposta do DNS estava em cache ou o servidor é local.</p>`;
    }
  } else if (row.start > loadEnd) {
    html += `<p class="is-faint">Começou aos ${formatMs(row.start)}, depois que a página já tinha carregado.${
      /dns-query|resolve\?/.test(row.url)
        ? " É uma das consultas DNS reais feitas pela seção 02."
        : ""
    }</p>`;
  } else if (row.cached) {
    html += `<p class="is-faint">Tamanho zero: veio do cache, ou a origem não libera a medição (cabeçalho Timing-Allow-Origin).</p>`;
  }
  return html;
}

function rowHtml(row, i, { track, time }) {
  return `<li>
    <button type="button" class="xrow" data-i="${i}" aria-describedby="xrayDetail">
      <span class="xname"><span class="xdot xk--${row.kind}"></span>${escapeHtml(row.name)}</span>
      <span class="xtrack">${track}</span>
      <span class="xms">${time}</span>
    </button>
  </li>`;
}

function render(box, data) {
  const rows = waterfallRows(data.nav, data.resources);
  const { main, late, loadEnd } = splitByLoad(rows, data.nav);
  const sum = summarize(rows, data.nav);

  // A escala cobre só o carregamento; o que veio depois fica numa lista à parte.
  const span = Math.max(loadEnd, ...main.map((r) => r.end), 1);
  const pct = (v) => `${((v / span) * 100).toFixed(2)}%`;

  $("#xrReq").textContent = sum.requests;
  $("#xrHosts").textContent = sum.hosts;
  $("#xrBytes").textContent = formatBytes(sum.bytes);
  $("#xrTotal").textContent = formatMs(sum.total);
  $("#xrProto").textContent =
    sum.protocols.map((p) => PROTOCOL_LABEL[p]?.split(" ")[0] ?? p).join(" + ") || "–";

  const ordered = [...main, ...late];
  const mainHtml = main.map((row, i) => {
    // O documento mostra as fases (DNS, TCP, TLS…); os demais, uma barra só.
    const track = row.phases.length
      ? row.phases
          .filter((p) => p.ms > 0)
          .map(
            (p) =>
              `<span class="xseg xk--${p.key}" style="left:${pct(p.start)};width:max(2px, ${pct(p.ms)})"></span>`,
          )
          .join("")
      : `<span class="xbar xk--${row.kind}${row.cached ? " is-cached" : ""}" style="left:${pct(row.start)};width:max(3px, ${pct(row.ms)})"></span>`;
    return rowHtml(row, i, { track, time: formatMs(row.ms) });
  });

  const lateHtml = late.map((row, i) =>
    rowHtml(row, main.length + i, {
      track: `<span class="xlate">aos ${formatMs(row.start)}</span>`,
      time: formatMs(row.ms),
    }),
  );

  $("#xrayRows").innerHTML = mainHtml.join("");
  const lateBox = $("#xrayLate");
  lateBox.hidden = !late.length;
  $("#xrayLateRows").innerHTML = lateHtml.join("");

  // marcas do eixo de tempo
  const step = [25, 50, 100, 250, 500, 1000, 2000, 5000].find((s) => span / s <= 6) || 10000;
  const ticks = [];
  for (let t = 0; t <= span; t += step)
    ticks.push(`<span style="left:${pct(t)}">${formatMs(t)}</span>`);
  $("#xrayAxis").innerHTML = ticks.join("");

  const detail = $("#xrayDetail");
  const show = (btn) => {
    box.querySelectorAll(".xrow.is-active").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    detail.innerHTML = describe(ordered[Number(btn.dataset.i)], loadEnd);
  };
  const pick = (e) => {
    const btn = e.target.closest(".xrow");
    if (btn) show(btn);
  };
  box.onmouseover = pick;
  box.onfocusin = pick;
  box.onclick = pick;

  const active = box.querySelector(".xrow");
  if (active) show(active);
  box.dataset.ready = "true";
}

export function initXray() {
  const box = $("#xray");
  if (!box) return;

  const draw = () => {
    const data = readEntries();
    if (!data) {
      $("#xrayDetail").textContent = "Este navegador não expõe a Performance API.";
      return;
    }
    render(box, data);
  };

  // Desenha depois do load (quando loadEventEnd existe) e redesenha se chegarem
  // requisições novas, como as consultas DNS reais feitas pela seção 02.
  onceVisible(
    box,
    () => {
      const start = () => {
        draw();
        if ("PerformanceObserver" in window) {
          let t;
          new PerformanceObserver(() => {
            clearTimeout(t);
            t = setTimeout(draw, 250);
          }).observe({ type: "resource", buffered: false });
        }
      };
      if (document.readyState === "complete") setTimeout(start, 0);
      else window.addEventListener("load", () => setTimeout(start, 0), { once: true });
    },
    0.1,
  );

  $("#xrayReload")?.addEventListener("click", () => {
    location.hash = "raio-x";
    location.reload();
  });
}
