/** 05 HTTP: monta requisição e resposta de acordo com método, caminho e status. */
import { $, $$, escapeHtml, reducedMotion, tablist, timerGroup } from "../core/dom.js";
import { get, subscribe, DEFAULT_PATH } from "../core/state.js";
import { normalizePath } from "../lib/url.js";
import { METHODS, STATUSES, CLASS_COLOR, CLASS_TONE } from "../data/http.js";

export function initHttp() {
  const reqOut = $("#reqOut");
  const respOut = $("#respOut");
  if (!reqOut) return;
  const methodMeaning = $("#methodMeaning");
  const statusMeaning = $("#statusMeaning");
  const band = $("#band");
  const pathIn = $("#pathIn");
  const form = $("#reqForm");
  const stream = timerGroup();

  let method = "GET";
  let status = "200";
  let path = DEFAULT_PATH;

  function paintRequest() {
    const m = METHODS[method];
    const lines = [
      `<span class="k">${method} ${escapeHtml(path)} HTTP/1.1</span>`,
      `Host: ${escapeHtml(get("domain"))}`,
      "User-Agent: Mozilla/5.0",
      "Accept: text/html",
    ];
    if (m.body) {
      lines.push("Content-Type: application/json", `Content-Length: ${m.body.length}`);
    }
    lines.push('<span class="c">(linha em branco)</span>');
    if (m.body) lines.push(`<span class="y">${escapeHtml(m.body)}</span>`);
    reqOut.innerHTML = lines.join("\n");
    methodMeaning.innerHTML = `<h3>${m.title}</h3><p>${m.text}</p>`;
  }

  function responseLines() {
    const s = STATUSES[status];
    const lines = [
      `<span class="${CLASS_TONE[s.cls]}">HTTP/1.1 ${status} ${s.phrase}</span>`,
      "Server: nginx",
    ];
    if (s.cls === 3)
      lines.push(`<span class="k">Location: https://${escapeHtml(get("domain"))}/novo</span>`);
    if (status === "401") lines.push('<span class="y">WWW-Authenticate: Bearer</span>');
    if (status === "503") lines.push('<span class="y">Retry-After: 120</span>');
    lines.push("Content-Type: text/html", '<span class="c">(linha em branco)</span>');
    lines.push(
      s.cls === 2
        ? '<span class="k">&lt;!DOCTYPE html&gt;</span>'
        : '<span class="c">&lt;!-- corpo com a explicação do erro --&gt;</span>',
    );
    return lines;
  }

  function paintResponse() {
    stream.clear();
    respOut.classList.remove("streaming");
    const s = STATUSES[status];
    const color = CLASS_COLOR[s.cls];
    respOut.innerHTML = responseLines().join("\n");
    statusMeaning.innerHTML = `<h3 style="color:${color}">${s.title}</h3><p>${s.text}</p>`;
    $$("i", band).forEach((i) => {
      i.classList.toggle("on", Number(i.dataset.c) === s.cls);
      i.style.setProperty("--c", color);
    });
  }

  function applyPath() {
    path = normalizePath(pathIn.value);
    pathIn.value = path;
    paintRequest();
  }

  /** Reimprime a resposta linha a linha, como se estivesse chegando pela rede. */
  function send() {
    applyPath();
    paintResponse();
    if (reducedMotion) return;
    const lines = responseLines();
    respOut.classList.add("streaming");
    respOut.innerHTML = '<span class="c">enviando...</span>';
    lines.forEach((_, i) => {
      stream.add(
        () => {
          respOut.innerHTML = lines.slice(0, i + 1).join("\n");
          if (i === lines.length - 1) respOut.classList.remove("streaming");
        },
        240 + i * 130,
      );
    });
  }

  tablist($("#methods"), (tab) => {
    method = tab.dataset.m;
    paintRequest();
  });
  tablist($("#statuses"), (tab) => {
    status = tab.dataset.s;
    paintResponse();
  });

  pathIn.addEventListener("change", applyPath);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    send();
  });

  subscribe("domain", () => {
    paintRequest();
    paintResponse();
  });

  paintRequest();
  paintResponse();
}
