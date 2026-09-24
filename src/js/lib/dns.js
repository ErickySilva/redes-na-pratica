/**
 * Cliente DNS sobre HTTPS (DoH, RFC 8484, formato JSON).
 * Faz consultas reais pelo navegador, sem servidor próprio: tenta a Cloudflare
 * e, se falhar, o Google. Os dois liberam CORS para qualquer origem.
 */

export const RECORD_TYPES = { A: 1, NS: 2, CNAME: 5, MX: 15, TXT: 16, AAAA: 28 };
const TYPE_NAMES = {
  ...Object.fromEntries(Object.entries(RECORD_TYPES).map(([k, v]) => [v, k])),
  6: "SOA",
};

const toRecord = (a) => ({
  name: String(a.name).replace(/\.$/, ""),
  type: TYPE_NAMES[a.type] ?? String(a.type),
  ttl: Number(a.TTL),
  data: String(a.data),
});

/** Códigos de resposta do DNS (RFC 1035 §4.1.1). */
export const RCODES = { 0: "NOERROR", 1: "FORMERR", 2: "SERVFAIL", 3: "NXDOMAIN", 5: "REFUSED" };

export const RESOLVERS = [
  {
    name: "Cloudflare 1.1.1.1",
    url: (name, type) =>
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`,
    headers: { accept: "application/dns-json" },
  },
  {
    name: "Google 8.8.8.8",
    url: (name, type) => `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`,
    headers: {},
  },
];

/** Converte a resposta JSON do DoH num formato enxuto. */
export function parseDoh(json) {
  const status = Number(json?.Status ?? -1);
  return {
    status,
    rcode: RCODES[status] ?? `RCODE ${status}`,
    answers: (json?.Answer ?? []).map(toRecord),
    // Em NXDOMAIN, a seção Authority traz o SOA de quem afirmou que o nome não existe.
    authority: (json?.Authority ?? []).map(toRecord),
  };
}

/**
 * Resolve `name` para o tipo de registro pedido.
 * @returns {Promise<{status, rcode, answers, resolver, ms, query}>}
 */
export async function resolve(
  name,
  type = "A",
  { fetchImpl = globalThis.fetch, timeout = 5000, now = () => performance.now() } = {},
) {
  const qtype = String(type).toUpperCase();
  if (!(qtype in RECORD_TYPES)) throw new Error(`tipo de registro não suportado: ${type}`);

  let lastError = new Error("nenhum resolvedor disponível");
  for (const resolver of RESOLVERS) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    const start = now();
    try {
      const res = await fetchImpl(resolver.url(name, qtype), {
        headers: resolver.headers,
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const parsed = parseDoh(await res.json());
      return {
        ...parsed,
        resolver: resolver.name,
        ms: Math.round(now() - start),
        query: { name, type: qtype },
      };
    } catch (err) {
      lastError = err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

/** Primeiro endereço IPv4 da resposta, seguindo CNAMEs implicitamente. */
export const firstAddress = (result) => result.answers.find((a) => a.type === "A")?.data ?? null;

/**
 * Interpreta os argumentos de `dig` e `nslookup`:
 *   dig site.com mx · dig MX site.com · nslookup -type=txt site.com
 */
export function parseLookupArgs(args, fallbackName) {
  let name = "";
  let type = "A";
  for (const arg of args) {
    const opt = /^-(?:q?type)=(\w+)$/i.exec(arg);
    const bare = arg.replace(/^@.*/, "");
    if (opt) type = opt[1].toUpperCase();
    else if (bare.toUpperCase() in RECORD_TYPES) type = bare.toUpperCase();
    else if (bare && !bare.startsWith("-") && !bare.startsWith("+")) name = bare;
  }
  return { name: name || fallbackName, type };
}

/** Linhas no estilo da saída do `dig`, prontas para o terminal (texto puro). */
export function formatDig(result) {
  const { query, rcode, answers, ms, resolver } = result;
  const pad = (s, n) => String(s).padEnd(n);
  const lines = [
    `;; ->>HEADER<<- status: ${rcode}, ANSWER: ${answers.length}`,
    ";; QUESTION SECTION:",
    `;${pad(`${query.name}.`, 30)} IN  ${query.type}`,
  ];
  if (answers.length) {
    lines.push(";; ANSWER SECTION:");
    for (const a of answers) {
      lines.push(`${pad(`${a.name}.`, 24)} ${pad(a.ttl, 6)} IN  ${pad(a.type, 5)} ${a.data}`);
    }
  }
  const soa = result.authority?.find((a) => a.type === "SOA");
  if (!answers.length && soa) {
    lines.push(
      ";; AUTHORITY SECTION:",
      `${pad(`${soa.name}.`, 24)} ${pad(soa.ttl, 6)} IN  SOA   ${soa.data}`,
    );
  }
  lines.push(`;; Query time: ${ms} msec`, `;; SERVER: ${resolver}, via HTTPS (DoH)`);
  return lines;
}
