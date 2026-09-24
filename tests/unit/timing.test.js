import { describe, it, expect } from "vitest";
import {
  navigationPhases,
  kindOf,
  shortName,
  waterfallRows,
  splitByLoad,
  summarize,
} from "../../src/js/lib/timing.js";

const NAV = {
  entryType: "navigation",
  name: "https://site.dev/entre-o-enter/",
  startTime: 0,
  domainLookupStart: 5,
  domainLookupEnd: 25,
  connectStart: 25,
  secureConnectionStart: 45,
  connectEnd: 80,
  requestStart: 81,
  responseStart: 140,
  responseEnd: 160,
  loadEventEnd: 400,
  transferSize: 14000,
  nextHopProtocol: "h2",
};

const res = (name, startTime, responseEnd, extra = {}) => ({
  entryType: "resource",
  name,
  startTime,
  responseEnd,
  initiatorType: "link",
  transferSize: 1000,
  decodedBodySize: 3000,
  nextHopProtocol: "h2",
  ...extra,
});

describe("navigationPhases", () => {
  it("separa DNS, TCP, TLS, espera e download", () => {
    const ms = Object.fromEntries(navigationPhases(NAV).map((p) => [p.key, p.ms]));
    expect(ms).toEqual({ dns: 20, tcp: 20, tls: 35, ttfb: 59, download: 20 });
  });

  it("sem HTTPS, o TLS dura zero e o TCP ocupa a conexão toda", () => {
    const ms = Object.fromEntries(
      navigationPhases({ ...NAV, secureConnectionStart: 0 }).map((p) => [p.key, p.ms]),
    );
    expect(ms.tls).toBe(0);
    expect(ms.tcp).toBe(55);
  });

  it("devolve lista vazia sem medição", () => expect(navigationPhases(undefined)).toEqual([]));
});

describe("kindOf", () => {
  it.each([
    [{ entryType: "navigation", name: "x" }, "html"],
    [{ name: "https://a.com/assets/index-abc.css", initiatorType: "link" }, "css"],
    [{ name: "https://a.com/assets/index-abc.js", initiatorType: "script" }, "js"],
    [{ name: "https://fonts.gstatic.com/s/inter/v1/x.woff2", initiatorType: "css" }, "font"],
    [{ name: "https://fonts.googleapis.com/css2?family=Inter", initiatorType: "link" }, "css"],
    [{ name: "https://cloudflare-dns.com/dns-query?name=a", initiatorType: "fetch" }, "data"],
    [{ name: "https://a.com/favicon.svg", initiatorType: "other" }, "img"],
  ])("%j → %s", (entry, kind) => expect(kindOf(entry)).toBe(kind));
});

describe("shortName", () => {
  it("usa o último trecho do caminho", () =>
    expect(shortName("https://a.com/assets/index-abc.js?v=1")).toBe("index-abc.js"));
  it("usa o host quando não há caminho", () => expect(shortName("https://a.com/")).toBe("a.com"));
});

describe("waterfallRows + summarize", () => {
  const rows = waterfallRows(NAV, [
    res("https://fonts.gstatic.com/s/x.woff2", 300, 350, { initiatorType: "css" }),
    res("https://site.dev/entre-o-enter/assets/index.css", 170, 200),
    res("https://site.dev/entre-o-enter/assets/index.js", 171, 260, { transferSize: 0 }),
  ]);

  it("ordena por início e coloca o documento primeiro", () => {
    expect(rows.map((r) => r.kind)).toEqual(["html", "css", "js", "font"]);
    expect(rows[0].phases).toHaveLength(5);
  });

  it("marca recursos vindos do cache", () => {
    expect(rows.find((r) => r.kind === "js").cached).toBe(true);
    expect(rows.find((r) => r.kind === "css").cached).toBe(false);
  });

  it("soma requisições, hosts, bytes e duração total", () => {
    expect(summarize(rows, NAV)).toEqual({
      requests: 4,
      hosts: 2,
      bytes: 14000 + 1000 + 0 + 1000,
      total: 400,
      protocols: ["h2"],
    });
  });
});

describe("splitByLoad", () => {
  it("separa o carregamento das requisições feitas depois do load", () => {
    const rows = waterfallRows(NAV, [
      res("https://site.dev/a.css", 170, 200),
      res("https://cloudflare-dns.com/dns-query?name=x", 1500, 1590, { initiatorType: "fetch" }),
    ]);
    const { main, late, loadEnd } = splitByLoad(rows, NAV);
    expect(loadEnd).toBe(400);
    expect(main.map((r) => r.kind)).toEqual(["html", "css"]);
    expect(late.map((r) => r.kind)).toEqual(["data"]);
  });

  it("o total do resumo é o evento load, não a última requisição tardia", () => {
    const rows = waterfallRows(NAV, [res("https://x.dev/late.js", 3000, 3100)]);
    expect(summarize(rows, NAV).total).toBe(400);
  });
});
