/** 08 Terminal: sessão SSH roteirizada, linha de comando com DNS real, FTP e Telnet x SSH. */
import { $, escapeHtml, reducedMotion, tablist, timerGroup, onceVisible } from "../core/dom.js";
import { get } from "../core/state.js";
import { lookup } from "../core/lookup.js";
import { INTRO_SCRIPT, COMMANDS, COMMAND_NAMES, NETWORK_COMMANDS, HELP } from "../data/terminal.js";
import { fakeCipher } from "../lib/cipher.js";
import { parseLookupArgs, formatDig, firstAddress } from "../lib/dns.js";
import { normalizeDomain, isValidHostname } from "../lib/url.js";

function initShell() {
  const out = $("#termOut");
  const input = $("#cmdIn");
  if (!out || !input) return;
  const history = [];
  let historyAt = 0;
  let introDone = false;

  function print(html) {
    out.insertAdjacentHTML("beforeend", (out.childNodes.length ? "\n" : "") + html);
    out.scrollTop = out.scrollHeight;
  }

  function finishIntro() {
    if (introDone) return;
    introDone = true;
    out.innerHTML = INTRO_SCRIPT.map(([line]) => line).join("\n");
  }

  function playIntro() {
    if (reducedMotion) {
      finishIntro();
      return;
    }
    let i = 0;
    (function next() {
      if (introDone) return;
      if (i >= INTRO_SCRIPT.length) {
        introDone = true;
        return;
      }
      print(INTRO_SCRIPT[i][0]);
      setTimeout(next, INTRO_SCRIPT[i++][1]);
    })();
  }

  const comment = (line) => `<span class="cm">${escapeHtml(line)}</span>`;
  const answer = (line) => `<span class="ok">${escapeHtml(line)}</span>`;

  async function dnsCommand(name, args) {
    const { name: raw, type } = parseLookupArgs(args, get("domain"));
    const domain = normalizeDomain(raw);
    if (!isValidHostname(domain)) {
      print(`<span class="er">${name}: '${escapeHtml(raw)}' não é um domínio válido.</span>`);
      return;
    }
    print(comment(`;; consultando ${domain} (${type}) via DNS sobre HTTPS…`));
    try {
      const result = await lookup(domain, type);
      if (name === "nslookup") {
        print(`Server:  ${escapeHtml(result.resolver)}`);
        if (!result.answers.length) {
          print(`<span class="er">** ${escapeHtml(result.rcode)}: ${escapeHtml(domain)}</span>`);
        }
        for (const a of result.answers) {
          const label = a.type === "A" || a.type === "AAAA" ? "Address" : a.type;
          print(`${label}: ${answer(a.data)}`);
        }
      } else {
        formatDig(result).forEach((line) =>
          print(line.startsWith(";") ? comment(line) : answer(line)),
        );
      }
      if (type === "A" && firstAddress(result)) {
        print(comment(`# resposta real, medida agora: ${result.ms} ms`));
      }
    } catch {
      print(`<span class="er">${name}: sem resposta dos resolvedores (offline?).</span>`);
    }
  }

  async function run(raw) {
    finishIntro();
    const cmd = raw.trim();
    print(`<span class="p">$</span> ${escapeHtml(cmd)}`);
    if (!cmd) return;

    history.push(cmd);
    historyAt = history.length;

    const [first, ...args] = cmd.split(/\s+/);
    const name = first.toLowerCase();
    if (name === "clear") {
      out.innerHTML = "";
      return;
    }
    if (NETWORK_COMMANDS.includes(name)) {
      await dnsCommand(name, args);
      return;
    }
    const handler = COMMANDS[name];
    const lines = handler
      ? handler({ args, domain: get("domain"), ip: get("ip"), esc: escapeHtml })
      : [`<span class="er">${escapeHtml(name)}: comando não encontrado.</span>`, ...HELP];
    lines.forEach(print);
  }

  function complete() {
    const [partial, ...rest] = input.value.split(" ");
    if (rest.length || !partial) return;
    const matches = COMMAND_NAMES.filter((c) => c.startsWith(partial.toLowerCase()));
    if (matches.length === 1) input.value = `${matches[0]} `;
    else if (matches.length > 1) print(comment(matches.join("  ")));
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = input.value;
      input.value = "";
      run(value);
    } else if (e.key === "ArrowUp" && history.length) {
      e.preventDefault();
      historyAt = Math.max(0, historyAt - 1);
      input.value = history[historyAt];
    } else if (e.key === "ArrowDown" && history.length) {
      e.preventDefault();
      historyAt = Math.min(history.length, historyAt + 1);
      input.value = history[historyAt] ?? "";
    } else if (e.key === "Tab" && input.value.trim()) {
      e.preventDefault();
      complete();
    }
  });

  // Clicar em qualquer parte do terminal foca a linha de comando (sem atrapalhar a seleção).
  $("#term")?.addEventListener("click", () => {
    if (!window.getSelection()?.toString()) input.focus();
  });

  onceVisible(out, playIntro, 0.35);
}

const FTP_TEXT = {
  ativo:
    "No modo ativo o cliente diz em qual porta abriu e o servidor liga de volta. Essa conexão vinda de fora bate no firewall e na tradução de endereços do roteador, e a transferência trava depois de a lista de arquivos já ter aparecido.",
  passivo:
    "No modo passivo o cliente pergunta em qual porta deve conectar e abre também a conexão de dados. Tudo parte de dentro para fora, que é justamente o que o firewall permite. Por isso é o padrão hoje, e o preço é o servidor precisar manter uma faixa de portas liberada.",
};

function initFtp() {
  const box = $("#ftp");
  if (!box) return;
  const say = $("#ftpSay");
  const d1 = $("#ftpD1");
  const d2 = $("#ftpD2");
  const l1 = $("#ftpLab1");
  const l2 = $("#ftpLab2");
  const timers = timerGroup();
  let mode = "ativo";

  function play() {
    timers.clear();
    d1.className = d2.className = "ftpdot";
    void d1.offsetWidth; // reinicia a animação CSS
    l1.textContent = "controle: cliente abre a porta 21";
    l2.textContent = "dados";
    d1.classList.add("run");
    say.textContent = FTP_TEXT[mode];

    timers.add(
      () => {
        if (mode === "ativo") {
          l2.textContent = "dados: o servidor liga de volta";
          d2.classList.add("blocked");
          timers.add(() => {
            say.innerHTML = `<b class="is-alarm">Bloqueado.</b> ${FTP_TEXT.ativo}`;
          }, 1000);
        } else {
          l2.textContent = "dados: o cliente abre também";
          d2.classList.add("run");
          timers.add(() => {
            say.innerHTML = `<b class="is-safe">Transferência concluída.</b> ${FTP_TEXT.passivo}`;
          }, 1400);
        }
      },
      reducedMotion ? 0 : 1500,
    );
  }

  tablist($("#ftpMode"), (tab) => {
    mode = tab.dataset.mode;
    play();
  });
  $("#ftpRun").addEventListener("click", play);
  say.textContent = FTP_TEXT.ativo;
  onceVisible(box, play, 0.4);
}

function initWire() {
  const pw = $("#pw");
  const tel = $("#wTel");
  const ssh = $("#wSsh");
  if (!pw) return;
  function paint() {
    const v = pw.value;
    tel.textContent = v ? `Password: ${v}` : "Password:";
    ssh.textContent = v ? fakeCipher(v) : "";
  }
  pw.addEventListener("input", paint);
  paint();
}

export function initTerminal() {
  initShell();
  initFtp();
  initWire();
}
