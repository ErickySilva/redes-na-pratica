/** 04 TLS: liga/desliga a criptografia e simula um certificado inválido. */
import { $, reducedMotion, timerGroup } from "../core/dom.js";

const PLAIN = "senha=123456";
const CIPHER = "8f3a2b91c7d4e05b1a9c";
const HEX = "0123456789abcdef";

const SAYS = {
  open: "O roteador do café, o provedor e qualquer máquina intermediária leem a linha acima exatamente como ela está.",
  secure:
    "O observador vê que existe tráfego, para onde vai e quanto pesa. O conteúdo, não. Alterar qualquer bit no caminho derruba a mensagem.",
  broken:
    "O conteúdo até pode ir cifrado, mas ninguém garante quem está do outro lado. Sem autenticidade, o túnel pode terminar em um impostor.",
};

export function initTls() {
  const tunnel = $("#tunnel");
  if (!tunnel) return;
  const sw = $("#tlsSwitch");
  const payload = $("#payload");
  const label = $("#tlsLabel");
  const port = $("#portLabel");
  const eye = $("#eyeSays");
  const cert = $("#cert");
  const breakBtn = $("#certBreak");
  const warn = $("#certWarn");
  const timers = timerGroup();
  let broken = false;

  /** Embaralha o texto até chegar ao destino, como um "decodificador". */
  function scramble(to) {
    timers.clear();
    if (reducedMotion) {
      payload.textContent = to;
      return;
    }
    const len = Math.max(payload.textContent.length, to.length);
    const steps = 14;
    for (let s = 0; s <= steps; s++) {
      timers.add(() => {
        let out = "";
        for (let i = 0; i < len; i++) {
          if (i < to.length && i / len < s / steps) out += to[i];
          else if (s === steps) out += to[i] || "";
          else out += HEX[(Math.random() * 16) | 0];
        }
        payload.textContent = out;
      }, s * 45);
    }
  }

  function render() {
    const on = sw.checked;
    tunnel.classList.toggle("secure", on);
    tunnel.classList.toggle("broken", broken);
    label.textContent = on ? "TLS LIGADO" : "TLS DESLIGADO";
    port.textContent = on ? "PORTA 443" : "PORTA 80";
    cert.classList.toggle("on", on && !broken);
    warn.classList.toggle("on", broken);
    breakBtn.textContent = broken
      ? "APRESENTAR UM CERTIFICADO VÁLIDO"
      : "APRESENTAR UM CERTIFICADO INVÁLIDO";
    eye.textContent = broken ? SAYS.broken : on ? SAYS.secure : SAYS.open;
  }

  sw.addEventListener("change", () => {
    broken = false;
    render();
    scramble(sw.checked ? CIPHER : PLAIN);
  });

  breakBtn.addEventListener("click", () => {
    broken = !broken;
    render();
  });

  payload.textContent = PLAIN;
  render();
}
