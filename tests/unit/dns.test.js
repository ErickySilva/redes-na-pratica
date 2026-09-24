import { describe, it, expect, vi } from "vitest";
import {
  parseDoh,
  resolve,
  firstAddress,
  parseLookupArgs,
  formatDig,
  RESOLVERS,
} from "../../src/js/lib/dns.js";

const OK_A = {
  Status: 0,
  Answer: [
    { name: "www.exemplo.com.", type: 5, TTL: 300, data: "exemplo.com." },
    { name: "exemplo.com.", type: 1, TTL: 1638, data: "104.247.81.99" },
  ],
};

const NXDOMAIN = {
  Status: 3,
  Authority: [
    {
      name: "com.br",
      type: 6,
      TTL: 900,
      data: "a.dns.br. hostmaster.registro.br. 1 1800 900 604800 900",
    },
  ],
};

const jsonResponse = (body, ok = true, status = 200) => ({ ok, status, json: async () => body });

describe("parseDoh", () => {
  it("converte a resposta e remove o ponto final dos nomes", () => {
    const r = parseDoh(OK_A);
    expect(r.rcode).toBe("NOERROR");
    expect(r.answers).toEqual([
      { name: "www.exemplo.com", type: "CNAME", ttl: 300, data: "exemplo.com." },
      { name: "exemplo.com", type: "A", ttl: 1638, data: "104.247.81.99" },
    ]);
  });

  it("reconhece NXDOMAIN e guarda o SOA da autoridade", () => {
    const r = parseDoh(NXDOMAIN);
    expect(r.rcode).toBe("NXDOMAIN");
    expect(r.answers).toEqual([]);
    expect(r.authority[0]).toMatchObject({ name: "com.br", type: "SOA" });
  });

  it("não quebra com resposta vazia", () => {
    expect(parseDoh({})).toMatchObject({ rcode: "RCODE -1", answers: [], authority: [] });
  });
});

describe("resolve", () => {
  it("consulta o primeiro resolvedor e mede o tempo", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(OK_A));
    let t = 100;
    const r = await resolve("www.exemplo.com", "a", { fetchImpl, now: () => (t += 20) });

    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(fetchImpl.mock.calls[0][0]).toBe(RESOLVERS[0].url("www.exemplo.com", "A"));
    expect(r).toMatchObject({ resolver: RESOLVERS[0].name, ms: 20, query: { type: "A" } });
    expect(firstAddress(r)).toBe("104.247.81.99");
  });

  it("cai para o segundo resolvedor quando o primeiro falha", async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error("rede fora"))
      .mockResolvedValueOnce(jsonResponse(OK_A));
    const r = await resolve("exemplo.com", "A", { fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(r.resolver).toBe(RESOLVERS[1].name);
  });

  it("propaga o erro quando todos os resolvedores falham", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, false, 503));
    await expect(resolve("exemplo.com", "A", { fetchImpl })).rejects.toThrow("HTTP 503");
  });

  it("recusa tipos de registro desconhecidos antes de ir à rede", async () => {
    const fetchImpl = vi.fn();
    await expect(resolve("exemplo.com", "PTRX", { fetchImpl })).rejects.toThrow(/não suportado/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("parseLookupArgs", () => {
  it.each([
    [[], { name: "padrao.com", type: "A" }],
    [["site.com"], { name: "site.com", type: "A" }],
    [["site.com", "mx"], { name: "site.com", type: "MX" }],
    [["TXT", "site.com"], { name: "site.com", type: "TXT" }],
    [["-type=aaaa", "site.com"], { name: "site.com", type: "AAAA" }],
    [["@1.1.1.1", "site.com", "+short"], { name: "site.com", type: "A" }],
  ])("%j", (args, expected) => {
    expect(parseLookupArgs(args, "padrao.com")).toEqual(expected);
  });
});

describe("formatDig", () => {
  it("imita a saída do dig", () => {
    const lines = formatDig({
      ...parseDoh(OK_A),
      ms: 23,
      resolver: "Cloudflare 1.1.1.1",
      query: { name: "www.exemplo.com", type: "A" },
    });
    expect(lines[0]).toContain("status: NOERROR, ANSWER: 2");
    expect(lines).toContain(";; ANSWER SECTION:");
    expect(lines.some((l) => /^exemplo\.com\.\s+1638\s+IN\s+A\s+104\.247\.81\.99$/.test(l))).toBe(
      true,
    );
    expect(lines.at(-2)).toBe(";; Query time: 23 msec");
  });

  it("mostra a autoridade quando o nome não existe", () => {
    const lines = formatDig({
      ...parseDoh(NXDOMAIN),
      ms: 9,
      resolver: "x",
      query: { name: "nada.com.br", type: "A" },
    });
    expect(lines[0]).toContain("NXDOMAIN");
    expect(lines).toContain(";; AUTHORITY SECTION:");
  });
});
