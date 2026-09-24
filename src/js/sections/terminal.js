/** 08 Terminal: sessão SSH roteirizada, linha de comando simulada, FTP e Telnet x SSH. */
import { $, escapeHtml, reducedMotion, tablist, timerGroup, onceVisible } from "../core/dom.js";
import { getDomain } from "../core/state.js";
import { INTRO_SCRIPT, COMMANDS, HELP } from "../data/terminal.js";

function initShell() {
  const out = $("#termOut");
  const input = $("#cmdIn");
  if (!out) return;
  let introDone = false;

  function print(html) {
    out.innerHTML += (out.innerHTML ? "\n" : "") + html;
    out.scrollTop = out.scrollHeight;
  }

  function playIntro() {
    if (reducedMotion) {
      out.innerHTML = INTRO_SCRIPT.map(([line]) => line).join("\n");
      introDone = true;
      return;
    }
    let acc = "";
    let i = 0;
    (function next() {
      if (introDone || i >= INTRO_SCRIPT.length) {
        introDone = true;
        return;
      }
      const [line, pause] = INTRO_SCRIPT[i];
      acc += (i ? "\n" : "") + line;
      out.innerHTML = acc;
      i++;
      setTimeout(next, pause);
    })();
  }

  function run(raw) {
    // Se a pessoa digitar antes do roteiro acabar, interrompe o roteiro.
    if (!introDone) {
      introDone = true;
      out.innerHTML = INTRO_SCRIPT.map(([line]) => line).join("\n");
    }
    out.innerHTML = out.innerHTML.replace(
      /\n?<span class="p">\$<\/span> <span class="caret"><\/span>$/,
      "",
    );

    const cmd = raw.trim();
    print(`<span class="p">$</span> ${escapeHtml(cmd)}`);
    if (!cmd) return;

    const [name, ...args] = cmd.split(/\s+/);
    const key = name.toLowerCase();
    if (key === "clear") {
      out.innerHTML = "";
      return;
    }
    const handler = COMMANDS[key];
    const lines = handler
      ? handler(args, getDomain(), escapeHtml)
      : [`<span class="er">comando não reconhecido.</span> ${HELP}`];
    lines.forEach(print);
  }

  onceVisible(out, playIntro, 0.35);

  input?.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    run(input.value);
    input.value = "";
  });
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

/** Hash FNV-1a + LCG: gera um "texto cifrado" estável para a mesma senha. */
function fakeCipher(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619) >>> 0;
  let out = "";
  for (let j = 0; j < Math.max(22, str.length * 2); j++) {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    out += "0123456789abcdef"[h % 16];
  }
  return out;
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
