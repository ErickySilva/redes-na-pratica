/**
 * 02 DNS: a consulta percorre a hierarquia conforme a rolagem ou pelos botões,
 * e um explorador faz consultas reais (DNS sobre HTTPS) para qualquer domínio.
 */
import {
  $,
  $$,
  clamp,
  escapeHtml,
  reducedMotion,
  tablist,
  timerGroup,
  onceVisible,
} from "../core/dom.js";
import { addScene } from "../core/scroll.js";
import { get, subscribe } from "../core/state.js";
import { lookup, resolveCurrentDomain } from "../core/lookup.js";
import { normalizeDomain, isValidHostname } from "../lib/url.js";
import { formatMs } from "../lib/text.js";

const LAST = 5;

function initScene() {
  const sec = $("#dns");
  if (!sec) return;
  const nodes = $$(".knode", sec);
  const beam = $("#beam");
  const ip = $("#ipOut");
  const meta = $("#ipMeta");
  const againBtn = $("#dnsAgain");
  const flushBtn = $("#dnsFlush");
  const stepBtn = $("#dnsStep");
  const timers = timerGroup();

  let cached = false; // com cache, raiz/.com/autoritativo são pulados
  let manual = false; // enquanto verdadeiro, a rolagem não controla a cena
  let cursor = -1;

  const liveNodes = () => nodes.filter((n) => !(cached && n.dataset.cache));

  function paint(step) {
    nodes.forEach((n) => {
      const idx = Number(n.dataset.k);
      const skipped = cached && !!n.dataset.cache;
      n.classList.toggle("skip", skipped);
      n.classList.toggle("on", !skipped && idx <= step);
      n.classList.toggle("hit", !skipped && idx < step);
    });
    const done = step >= LAST;
    ip.classList.toggle("on", done);
    if (done && !meta.textContent) {
      meta.textContent = cached
        ? "resposta do cache, cerca de 2 ms"
        : "cinco consultas, cerca de 120 ms";
    }
  }

  const setBeam = (fraction) => (beam.style.height = `${fraction * 100}%`);

  addScene(sec, (p) => {
    if (manual) return;
    const step = Math.floor(p * 6.6);
    if (step < LAST) meta.textContent = "";
    paint(Math.min(step, LAST));
    setBeam(clamp(p * 1.1, 0, 1));
  });

  function play() {
    manual = true;
    timers.clear();
    meta.textContent = "";
    ip.classList.remove("on");
    const order = liveNodes();
    const delay = reducedMotion ? 0 : cached ? 160 : 420;
    order.forEach((n, i) => {
      timers.add(() => {
        paint(Number(n.dataset.k));
        setBeam((i + 1) / order.length);
        if (i === order.length - 1) {
          paint(LAST);
          manual = false;
        }
      }, i * delay);
    });
  }

  function resetStepper() {
    cursor = -1;
    stepBtn.textContent = "AVANÇAR UM SALTO";
  }

  stepBtn.addEventListener("click", () => {
    manual = true;
    timers.clear();
    const live = liveNodes();
    cursor = (cursor + 1) % (live.length + 1);

    if (cursor === live.length) {
      resetStepper();
      meta.textContent = "";
      ip.classList.remove("on");
      nodes.forEach((n) => n.classList.remove("on", "hit"));
      setBeam(0);
      return;
    }

    const last = cursor === live.length - 1;
    paint(last ? LAST : Number(live[cursor].dataset.k));
    setBeam((cursor + 1) / live.length);
    stepBtn.textContent = last ? "RECOMEÇAR" : "AVANÇAR UM SALTO";
  });

  againBtn.addEventListener("click", () => {
    cached = true;
    resetStepper();
    play();
  });

  flushBtn.addEventListener("click", () => {
    cached = false;
    resetStepper();
    play();
    meta.textContent = "cache limpo, a próxima consulta percorre a hierarquia inteira";
  });

  // Troca o IP de exemplo pelo IP real assim que a cena aparece.
  onceVisible(sec, () => resolveCurrentDomain().catch(() => {}), 0.1);
}

/* ---------------- explorador ---------------- */

const EXPLAIN = {
  A: "Endereço IPv4. O TTL diz por quantos segundos os resolvedores podem guardar esta resposta em cache antes de perguntar de novo.",
  AAAA: "Endereço IPv6, o sucessor com 128 bits. Muitos domínios publicam os dois, e o navegador escolhe o que responder mais rápido.",
  MX: "Servidores que recebem e-mail por este domínio. O número é a prioridade: o menor é tentado primeiro, os outros são reserva.",
  TXT: "Texto livre, hoje usado sobretudo para provar posse do domínio e para regras antifraude de e-mail, como o SPF.",
  NS: "Servidores autoritativos: quem responde de verdade por esta zona. São eles a parada 05 da cadeia lá em cima.",
  DMARC:
    "Política DMARC, publicada como TXT em _dmarc. Diz aos outros servidores o que fazer com e-mails que falham no SPF ou no DKIM.",
};

const humanTtl = (s) =>
  s >= 3600
    ? `${s} s (${Math.round(s / 360) / 10} h)`
    : s >= 60
      ? `${s} s (${Math.round(s / 60)} min)`
      : `${s} s`;

function badge(record) {
  if (/^"?v=spf1/i.test(record.data)) return '<span class="tag">SPF</span>';
  if (/^"?v=DMARC1/i.test(record.data)) return '<span class="tag">DMARC</span>';
  if (/google-site-verification|facebook-domain|MS=|apple-domain/i.test(record.data))
    return '<span class="tag tag--soft">verificação</span>';
  return "";
}

function renderResult(result, kind) {
  const { rcode, answers, authority, ms, resolver, query } = result;
  const tone = rcode === "NOERROR" ? (answers.length ? "ok" : "warn") : "error";
  const count = `${answers.length} ${answers.length === 1 ? "registro" : "registros"}`;
  let html = `<p class="dnsx-status" data-tone="${tone}"><b>${rcode}</b> · ${count} · ${formatMs(ms)} · ${escapeHtml(resolver)}</p>`;

  if (answers.length) {
    const rows = answers
      .map(
        (a) =>
          `<tr><td>${escapeHtml(a.name)}</td><td>${a.type}</td><td>${humanTtl(a.ttl)}</td><td class="dnsx-data">${escapeHtml(a.data)} ${badge(a)}</td></tr>`,
      )
      .join("");
    html += `<div class="scrollx"><table class="tbl dnsx-tbl"><thead><tr><th scope="col">nome</th><th scope="col">tipo</th><th scope="col">TTL</th><th scope="col">valor</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    if (answers.some((a) => a.type === "CNAME") && query.type !== "CNAME") {
      html += `<p class="dnsx-explain">Repare no <b>CNAME</b>: o nome pedido é um apelido, e o resolvedor seguiu até o nome verdadeiro antes de responder.</p>`;
    }
    html += `<p class="dnsx-explain">${EXPLAIN[kind]}</p>`;
  } else if (rcode === "NXDOMAIN") {
    const soa = authority.find((a) => a.type === "SOA");
    const who = soa ? soa.data.split(" ")[0].replace(/\.$/, "") : "o servidor da zona acima";
    html += `<p class="dnsx-explain">Esse nome <b>não existe</b>. Quem garantiu foi <b>${escapeHtml(who)}</b>, autoritativo por <b>${escapeHtml(soa?.name ?? "")}</b>. É a mesma hierarquia da cadeia acima, respondendo "não" em vez de um endereço.</p>`;
  } else if (rcode === "NOERROR") {
    html += `<p class="dnsx-explain">O domínio existe, mas não publica registros do tipo <b>${escapeHtml(kind)}</b>.</p>`;
  } else {
    html += `<p class="dnsx-explain">O resolvedor respondeu <b>${escapeHtml(rcode)}</b>: não conseguiu completar a consulta.</p>`;
  }
  return html;
}

function initExplorer() {
  const box = $("#dnsx");
  if (!box) return;
  const form = $("#dnsxForm");
  const input = $("#dnsxName");
  const out = $("#dnsxOut");
  let kind = "A";
  let seq = 0;

  async function run() {
    const domain = normalizeDomain(input.value);
    if (!isValidHostname(domain)) {
      input.setAttribute("aria-invalid", "true");
      out.innerHTML = `<p class="dnsx-status" data-tone="error">Digite um domínio válido, como <b>gmail.com</b>.</p>`;
      return;
    }
    input.removeAttribute("aria-invalid");
    input.value = domain;

    const name = kind === "DMARC" ? `_dmarc.${domain.replace(/^www\./, "")}` : domain;
    const type = kind === "DMARC" ? "TXT" : kind;
    const mine = ++seq;
    out.setAttribute("aria-busy", "true");
    out.innerHTML = `<p class="dnsx-status" data-tone="busy">consultando ${escapeHtml(name)} (${type})…</p>`;

    try {
      const result = await lookup(name, type);
      if (mine === seq) out.innerHTML = renderResult(result, kind);
    } catch {
      if (mine === seq)
        out.innerHTML = `<p class="dnsx-status" data-tone="error">Não deu para falar com os resolvedores agora. Você está offline?</p>`;
    } finally {
      if (mine === seq) out.removeAttribute("aria-busy");
    }
  }

  tablist($("#dnsxTypes"), (tab) => {
    kind = tab.dataset.type;
    run();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    run();
  });

  subscribe("domain", (domain) => {
    input.value = domain;
  });
  input.value = get("domain");

  onceVisible(box, run, 0.2);
}

export function initDns() {
  initScene();
  initExplorer();
}
