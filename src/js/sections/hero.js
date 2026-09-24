/** Hero: rede animada no fundo, tecla Enter e troca de domínio com consulta DNS real. */
import { $, escapeHtml, reducedMotion, hasIO } from "../core/dom.js";
import { get, set, subscribe, DEFAULT_PATH } from "../core/state.js";
import { resolveCurrentDomain } from "../core/lookup.js";
import { normalizeDomain, isValidHostname } from "../lib/url.js";
import { formatMs } from "../lib/text.js";

const signalColor = () =>
  getComputedStyle(document.documentElement).getPropertyValue("--sig").trim() || "#0b6fad";

function initNetworkCanvas() {
  const cv = $("#net");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  let color = signalColor();
  let pts = [];
  let raf = 0;
  let live = true;
  let w = 0;
  let h = 0;

  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = cv.clientWidth;
    h = cv.clientHeight;
    cv.width = w * dpr;
    cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(54, Math.round(w / 26));
    pts = Array.from({ length: n }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.16,
      vy: (Math.random() - 0.5) * 0.16,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = ctx.fillStyle = color;
    ctx.lineWidth = 1;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      if (!reducedMotion) {
        a.x += a.vx;
        a.y += a.vy;
      }
      if (a.x < 0 || a.x > w) a.vx *= -1;
      if (a.y < 0 || a.y > h) a.vy *= -1;
      for (let j = i + 1; j < pts.length; j++) {
        const b = pts[j];
        const d = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
        if (d < 24000) {
          ctx.globalAlpha = (1 - d / 24000) * 0.2;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(a.x, a.y, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    raf = live && !reducedMotion ? requestAnimationFrame(draw) : 0;
  }

  size();
  draw();

  let rz;
  window.addEventListener("resize", () => {
    clearTimeout(rz);
    rz = setTimeout(() => {
      size();
      if (reducedMotion) draw();
    }, 180);
  });

  window.addEventListener("themechange", () => {
    color = signalColor();
    if (reducedMotion) draw();
  });

  // Pausa a animação quando o hero sai da tela.
  if (hasIO) {
    new IntersectionObserver(
      ([entry]) => {
        live = entry.isIntersecting;
        if (live && !reducedMotion && !raf) raf = requestAnimationFrame(draw);
        if (!live) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      { threshold: 0 },
    ).observe(cv);
  }
}

function initEnterKey() {
  const hero = $("#hero");
  const key = $("#enterKey");
  const typed = $("#typedUrl");
  if (!key) return;
  let fired = false;

  const fullUrl = () => `https://${get("domain")}${DEFAULT_PATH}`;

  function go() {
    if (fired) return;
    fired = true;
    key.classList.add("press");
    setTimeout(() => key.classList.remove("press"), 220);
    hero.classList.add("armed");

    const text = fullUrl();
    if (reducedMotion) {
      typed.textContent = text;
      return;
    }
    let i = 0;
    (function step() {
      i++;
      typed.innerHTML = `${escapeHtml(text.slice(0, i))}<span class="cur"></span>`;
      if (i < text.length) setTimeout(step, 34);
      else setTimeout(() => $("#url")?.scrollIntoView({ behavior: "smooth", block: "start" }), 900);
    })();
  }

  key.addEventListener("click", go);
  window.addEventListener("keydown", (e) => {
    const nearTop = window.scrollY < window.innerHeight * 0.6;
    const busy = e.target.closest?.("input, textarea, button, select, dialog");
    if (e.key === "Enter" && !fired && nearTop && !busy) go();
  });

  subscribe("domain", () => {
    if (typed.textContent) typed.textContent = fullUrl();
  });
}

function initDomainForm() {
  const form = $("#domForm");
  const input = $("#domIn");
  const note = $("#domNote");
  if (!form) return;

  const say = (html, tone = "") => {
    note.innerHTML = html;
    note.dataset.tone = tone;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const domain = normalizeDomain(input.value);

    if (!isValidHostname(domain)) {
      input.setAttribute("aria-invalid", "true");
      say("Esse endereço não parece um domínio. Tente algo como <b>www.ufpe.br</b>.", "error");
      return;
    }

    input.removeAttribute("aria-invalid");
    input.value = domain;
    set("domain", domain);
    input.classList.add("tossed");
    setTimeout(() => input.classList.remove("tossed"), 540);

    say(`resolvendo <b>${escapeHtml(domain)}</b> de verdade…`, "busy");
    try {
      const { result, ip } = await resolveCurrentDomain();
      if (get("domain") !== domain) return;
      if (ip) {
        say(
          `<b>${escapeHtml(domain)}</b> → <b>${escapeHtml(ip)}</b> em ${formatMs(result.ms)}, via ${escapeHtml(result.resolver)}`,
          "ok",
        );
      } else {
        say(
          `${escapeHtml(result.rcode)}: esse nome não tem endereço IPv4. A viagem segue com um IP de exemplo.`,
          "error",
        );
      }
    } catch {
      say("Sem acesso ao DNS agora (offline?). A viagem segue com um IP de exemplo.", "error");
    }
  });
}

export function initHero() {
  initNetworkCanvas();
  initEnterKey();
  initDomainForm();
}
