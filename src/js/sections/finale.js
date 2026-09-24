/** 10 Fim: checklist animado e quiz de fixação. */
import { $, $$, reducedMotion, onceVisible } from "../core/dom.js";
import { QUESTIONS } from "../data/quiz.js";

function initChecks() {
  const box = $("#checks");
  if (!box) return;
  const items = $$(".chk", box);
  onceVisible(
    box,
    () =>
      items.forEach((it, i) =>
        setTimeout(() => it.classList.add("on"), reducedMotion ? 0 : i * 180),
      ),
    0.3,
  );
}

function initQuiz() {
  const box = $("#quiz");
  if (!box) return;
  const scoreN = $("#scoreN");
  const scoreT = $("#scoreT");
  const resetBtn = $("#quizReset");
  const total = QUESTIONS.length;
  let answered = 0;
  let right = 0;

  function updateScore() {
    scoreN.textContent = right;
    scoreT.textContent = answered
      ? `acertos em ${answered} de ${total} respondidas`
      : `de ${total} respondidas`;
    resetBtn.hidden = answered === 0;
  }

  function buildCard(item, qi) {
    const card = document.createElement("div");
    card.className = "qcard";

    const h = document.createElement("h3");
    h.textContent = `${qi + 1}. ${item.question}`;

    const opts = document.createElement("div");
    opts.className = "opts";

    const fb = document.createElement("p");
    fb.className = "qfb";
    fb.setAttribute("aria-live", "polite");

    item.options.forEach((text, oi) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "opt";
      b.textContent = text;
      b.addEventListener("click", () => {
        if (card.dataset.done) return;
        card.dataset.done = "1";
        $$(".opt", opts).forEach((x, xi) => {
          x.disabled = true;
          if (xi === item.answer) x.classList.add("right");
          else if (x === b) x.classList.add("wrong");
        });
        const ok = oi === item.answer;
        fb.textContent = `${ok ? "Certo." : "Não exatamente."} ${item.feedback}`;
        fb.classList.add("on");
        answered++;
        if (ok) right++;
        updateScore();
      });
      opts.appendChild(b);
    });

    card.append(h, opts, fb);
    return card;
  }

  function build() {
    answered = 0;
    right = 0;
    box.replaceChildren(...QUESTIONS.map(buildCard));
    updateScore();
  }

  resetBtn.addEventListener("click", build);
  build();
}

export function initFinale() {
  initChecks();
  initQuiz();
}
