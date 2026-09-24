/**
 * Transforma as medições da Navigation Timing e da Resource Timing API
 * (as mesmas usadas pela aba Network do DevTools) em dados prontos para desenhar.
 */

/** Fases do carregamento do documento principal, na ordem em que acontecem. */
export function navigationPhases(nav) {
  if (!nav) return [];
  const tlsStart = nav.secureConnectionStart > 0 ? nav.secureConnectionStart : nav.connectEnd;
  const phase = (key, label, start, end) => ({
    key,
    label,
    start,
    end,
    ms: Math.max(0, end - start),
  });
  return [
    phase("dns", "DNS", nav.domainLookupStart, nav.domainLookupEnd),
    phase("tcp", "TCP", nav.connectStart, tlsStart),
    phase("tls", "TLS", tlsStart, nav.connectEnd),
    phase("ttfb", "Espera", nav.requestStart, nav.responseStart),
    phase("download", "Download", nav.responseStart, nav.responseEnd),
  ];
}

const EXT_KIND = [
  [/\.css(\?|$)/i, "css"],
  [/\.m?js(\?|$)/i, "js"],
  [/\.(woff2?|ttf|otf)(\?|$)/i, "font"],
  [/\.(png|jpe?g|gif|webp|avif|svg|ico)(\?|$)/i, "img"],
];

/** Categoria do recurso: html, css, js, font, img, data ou other. */
export function kindOf(entry) {
  if (entry.entryType === "navigation") return "html";
  for (const [re, kind] of EXT_KIND) if (re.test(entry.name)) return kind;
  if (entry.initiatorType === "css" && /fonts\.gstatic/.test(entry.name)) return "font";
  if (entry.initiatorType === "link" && /fonts\.googleapis/.test(entry.name)) return "css";
  if (entry.initiatorType === "fetch" || entry.initiatorType === "xmlhttprequest") return "data";
  if (entry.initiatorType === "img") return "img";
  return "other";
}

/** Nome curto para exibir: último trecho do caminho ou o host. */
export function shortName(url) {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop();
    return last ? decodeURIComponent(last) : u.host;
  } catch {
    return String(url);
  }
}

const hostOf = (url) => {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
};

/** Uma linha da cascata por requisição, com o documento principal primeiro. */
export function waterfallRows(nav, resources) {
  const rows = [];
  if (nav) {
    rows.push({
      name: shortName(nav.name) || "documento",
      url: nav.name,
      kind: "html",
      start: nav.startTime,
      end: nav.responseEnd,
      ms: nav.responseEnd - nav.startTime,
      bytes: nav.transferSize ?? 0,
      cached: nav.transferSize === 0,
      protocol: nav.nextHopProtocol || "",
      host: hostOf(nav.name),
      phases: navigationPhases(nav),
    });
  }
  for (const r of resources) {
    rows.push({
      name: shortName(r.name),
      url: r.name,
      kind: kindOf(r),
      start: r.startTime,
      end: r.responseEnd,
      ms: Math.max(0, r.responseEnd - r.startTime),
      bytes: r.transferSize ?? 0,
      // transferSize 0 com corpo > 0: veio do cache (ou origem sem Timing-Allow-Origin)
      cached: r.transferSize === 0 && r.decodedBodySize > 0,
      protocol: r.nextHopProtocol || "",
      host: hostOf(r.name),
      phases: [],
    });
  }
  return rows.sort((a, b) => a.start - b.start);
}

/**
 * Separa o que fez parte do carregamento (começou até o evento load) do que veio depois,
 * como as consultas DNS disparadas enquanto a pessoa rola a página.
 */
export function splitByLoad(rows, nav) {
  const loadEnd = nav?.loadEventEnd || Math.max(0, ...rows.map((r) => r.end));
  return {
    loadEnd,
    main: rows.filter((r) => r.start <= loadEnd),
    late: rows.filter((r) => r.start > loadEnd),
  };
}

/** Totais para o resumo acima da cascata. */
export function summarize(rows, nav) {
  const hosts = new Set(rows.map((r) => r.host).filter(Boolean));
  const end = nav?.loadEventEnd || Math.max(0, ...rows.map((r) => r.end));
  return {
    requests: rows.length,
    hosts: hosts.size,
    bytes: rows.reduce((sum, r) => sum + (r.bytes || 0), 0),
    total: end,
    protocols: [...new Set(rows.map((r) => r.protocol).filter(Boolean))],
  };
}
