/**
 * Utilitários compartilhados pelos testes de ponta a ponta.
 * As consultas DNS são interceptadas: os testes não dependem da internet
 * e sempre recebem as mesmas respostas.
 */

export const FAKE_IP = "203.0.113.7"; // faixa reservada para documentação (RFC 5737)

const ZONE = {
  "www.exemplo.com|1": [{ name: "www.exemplo.com.", type: 1, TTL: 300, data: FAKE_IP }],
  "www.ufpe.br|1": [{ name: "www.ufpe.br.", type: 1, TTL: 3600, data: "198.51.100.20" }],
  "gmail.com|15": [
    { name: "gmail.com.", type: 15, TTL: 3600, data: "5 gmail-smtp-in.l.google.com." },
    { name: "gmail.com.", type: 15, TTL: 3600, data: "10 alt1.gmail-smtp-in.l.google.com." },
  ],
  "gmail.com|16": [
    { name: "gmail.com.", type: 16, TTL: 300, data: '"v=spf1 redirect=_spf.google.com"' },
  ],
};

const TYPE = { A: 1, NS: 2, CNAME: 5, MX: 15, TXT: 16, AAAA: 28 };

/** Intercepta Cloudflare e Google DoH. `mode`: "ok" (padrão) ou "offline". */
export async function mockDns(page, { mode = "ok" } = {}) {
  const handler = async (route) => {
    if (mode === "offline") return route.abort("internetdisconnected");
    const url = new URL(route.request().url());
    const name = url.searchParams.get("name");
    const type = TYPE[url.searchParams.get("type")] ?? Number(url.searchParams.get("type"));
    const answer = ZONE[`${name}|${type}`];
    const body = name.startsWith("nao-existe")
      ? {
          Status: 3,
          Authority: [
            {
              name: "com.br.",
              type: 6,
              TTL: 900,
              data: "a.dns.br. hostmaster.registro.br. 1 1800 900 604800 900",
            },
          ],
        }
      : { Status: 0, Answer: answer ?? [] };
    await route.fulfill({
      contentType: "application/dns-json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify(body),
    });
  };
  await page.route("https://cloudflare-dns.com/**", handler);
  await page.route("https://dns.google/**", handler);
}

/** Leva a seção até a tela e espera a animação de revelação terminar. */
export async function reveal(page, selector) {
  const el = page.locator(selector).first();
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  return el;
}

/** Rola instantaneamente até a fração `p` (0–1) de uma cena fixada. */
export async function scrollScene(page, selector, p) {
  await page.evaluate(
    ([sel, frac]) => {
      const s = document.querySelector(sel);
      const top = s.offsetTop + (s.offsetHeight - innerHeight) * frac;
      window.scrollTo({ top, behavior: "instant" });
    },
    [selector, p],
  );
}
