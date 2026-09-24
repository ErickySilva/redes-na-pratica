/** 03 TCP: animação do aperto de mão em três tempos, com perda opcional de pacote. */
import { $, $$, reducedMotion, timerGroup, onceVisible } from "../core/dom.js";

const STEPS = [
  "cliente envia SYN: quero abrir",
  "servidor responde SYN e ACK: pode abrir",
  "cliente confirma com ACK",
];

export function initTcp() {
  const rails = $("#tcpRails");
  if (!rails) return;
  const flights = $$(".flight", rails);
  const state = $("#tcpState");
  const btn = $("#tcpRun");
  const loss = $("#tcpLoss");
  const drop = $("#tcpDrop");
  const timers = timerGroup();

  function reset() {
    timers.clear();
    flights.forEach((f) => {
      f.className = "flight";
      f.style.opacity = "0";
    });
    state.classList.remove("ok");
    drop.classList.remove("on");
  }

  function simulateLoss() {
    const syn = flights[0];
    syn.style.opacity = "";
    syn.classList.add("lost");
    state.textContent = "o SYN se perdeu no caminho";
    drop.classList.add("on");

    timers.add(
      () => {
        drop.classList.remove("on");
        syn.className = "flight";
        syn.style.opacity = "0";
        state.textContent = "sem resposta, o TCP reenvia o SYN por conta própria";
        loss.checked = false;
        timers.add(run, reducedMotion ? 1 : 700);
      },
      reducedMotion ? 1 : 1500,
    );
  }

  function run() {
    reset();
    state.textContent = "abrindo conexão";
    btn.disabled = true;

    if (loss.checked) {
      simulateLoss();
      return;
    }

    const dur = reducedMotion ? 1 : 950;
    flights.forEach((f, i) => {
      timers.add(
        () => {
          f.style.opacity = "";
          f.style.setProperty("--dur", `${dur}ms`);
          f.classList.add(i === 1 ? "rev" : "go");
          state.textContent = STEPS[i];
        },
        i * (dur + 160),
      );
    });
    timers.add(
      () => {
        state.textContent = "conexão estabelecida, o canal está aberto";
        state.classList.add("ok");
        btn.disabled = false;
        btn.textContent = "SIMULAR DE NOVO";
      },
      3 * (dur + 160),
    );
  }

  btn.addEventListener("click", run);
  onceVisible(rails, () => setTimeout(run, 350), 0.45);
}
