/** 09 E-mail: caminho da mensagem e comparação POP3 x IMAP entre aparelhos. */
import { $, $$, tablist } from "../core/dom.js";
import { MAIL_LEGS } from "../data/email.js";

export function initEmail() {
  const legs = $("#mailLegs");
  if (!legs) return;
  const nodes = $$(".jnode");
  const legName = $("#jlegName");
  const legText = $("#jlegText");

  const phone = $("#dPhone");
  const laptop = $("#dLap");
  const server = $("#dSrv");
  const explain = $("#mailExplain");
  const readBtn = $("#readBtn");
  const resetBtn = $("#mailReset");

  // Protocolo de leitura usado na demonstração dos aparelhos (SMTP não lê).
  let proto = "pop";
  let read = false;

  function paintLeg(key) {
    const leg = MAIL_LEGS[key];
    nodes.forEach((n) => {
      n.classList.toggle("on", leg.nodes.includes(Number(n.dataset.j)));
      n.style.setProperty("--c", leg.color);
    });
    legName.textContent = leg.name;
    legName.style.setProperty("--c", leg.color);
    legText.textContent = leg.text;
  }

  function paintDevices() {
    const imap = proto === "imap";
    phone.textContent = read
      ? imap
        ? "1 mensagem lida"
        : "1 mensagem lida, guardada aqui"
      : "1 mensagem não lida";
    laptop.textContent = read
      ? imap
        ? "1 mensagem lida"
        : "nenhuma mensagem"
      : "1 mensagem não lida";
    laptop.classList.toggle("empty", read && !imap);
    server.textContent = read
      ? imap
        ? "1 mensagem guardada, marcada como lida"
        : "caixa vazia, a mensagem foi baixada"
      : "1 mensagem guardada";

    if (!read) {
      explain.textContent = imap
        ? "Com IMAP, a mensagem vive no servidor e os aparelhos apenas olham para ela."
        : "Com POP3, quem baixar primeiro leva a mensagem para o próprio aparelho.";
    } else {
      explain.textContent = imap
        ? "Com IMAP, o estado de leitura é sincronizado: os dois aparelhos mostram a mesma coisa."
        : "Com POP3, o celular baixou e a mensagem saiu do servidor. O notebook não encontra mais nada.";
    }
    readBtn.disabled = read;
    readBtn.textContent = read ? "JÁ ESTÁ LIDA" : "MARCAR COMO LIDA";
  }

  tablist(legs, (tab) => {
    const key = tab.dataset.leg;
    paintLeg(key);
    if (key !== "smtp") {
      proto = key;
      read = false;
      paintDevices();
    }
  });

  readBtn.addEventListener("click", () => {
    read = true;
    paintDevices();
  });
  resetBtn.addEventListener("click", () => {
    read = false;
    paintDevices();
  });

  paintLeg("smtp");
  paintDevices();
}
