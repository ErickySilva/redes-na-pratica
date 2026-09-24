import { describe, it, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fakeCipher, scrambleFrame } from "../../src/js/lib/cipher.js";
import { escapeHtml, formatMs, formatBytes } from "../../src/js/lib/text.js";
import { renderPartials } from "../../plugins/html-partials.js";
import { QUESTIONS } from "../../src/js/data/quiz.js";
import { METHODS, STATUSES } from "../../src/js/data/http.js";

describe("fakeCipher", () => {
  it("é determinística e nunca revela o texto original", () => {
    expect(fakeCipher("root@2024")).toBe(fakeCipher("root@2024"));
    expect(fakeCipher("root@2024")).not.toContain("root");
    expect(fakeCipher("a")).toMatch(/^[0-9a-f]{22}$/);
  });
  it("entradas diferentes geram saídas diferentes", () =>
    expect(fakeCipher("senha1")).not.toBe(fakeCipher("senha2")));
});

describe("scrambleFrame", () => {
  it("revela o alvo da esquerda para a direita", () => {
    const frame = scrambleFrame("abcdefghij", 10, 0.5, () => 0);
    expect(frame).toBe("abcde00000");
  });
  it("termina exatamente no alvo", () => expect(scrambleFrame("xyz", 20, 1)).toBe("xyz"));
});

describe("texto", () => {
  it("escapeHtml neutraliza marcação", () =>
    expect(escapeHtml(`<img src=x onerror="a">&`)).toBe(
      "&lt;img src=x onerror=&quot;a&quot;&gt;&amp;",
    ));
  it.each([
    [0, "0 ms"],
    [37.6, "38 ms"],
    [1240, "1,24 s"],
    [-1, "–"],
  ])("formatMs(%s) = %s", (v, s) => expect(formatMs(v)).toBe(s));
  it.each([
    [812, "812 B"],
    [14200, "14,2 kB"],
    [1_300_000, "1,3 MB"],
  ])("formatBytes(%s) = %s", (v, s) => expect(formatBytes(v)).toBe(s));
});

describe("html-partials", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "partials-"));
  fs.writeFileSync(path.join(dir, "a.html"), "<p>A</p>\n<!-- @include b.html -->\n");
  fs.writeFileSync(path.join(dir, "b.html"), "<p>B</p>\n");
  fs.writeFileSync(path.join(dir, "loop.html"), "<!-- @include loop.html -->\n");

  it("inclui parciais aninhados preservando a indentação", () => {
    expect(renderPartials("<main>\n  <!-- @include a.html -->\n</main>", dir, [])).toBe(
      "<main>\n  <p>A</p>\n  <p>B</p>\n</main>",
    );
  });
  it("detecta inclusão circular", () =>
    expect(() => renderPartials("<!-- @include loop.html -->", dir, [])).toThrow(/circular/));
  it("avisa quando o parcial não existe", () =>
    expect(() => renderPartials("<!-- @include nada.html -->", dir, [])).toThrow(/não encontrado/));
});

describe("integridade do conteúdo", () => {
  it("toda pergunta do quiz tem resposta válida e explicação", () => {
    for (const q of QUESTIONS) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(q.feedback.length).toBeGreaterThan(20);
    }
  });
  it("status HTTP pertencem à classe certa", () => {
    for (const [code, s] of Object.entries(STATUSES)) expect(s.cls).toBe(Number(code[0]));
  });
  it("métodos com corpo têm JSON válido", () => {
    for (const m of Object.values(METHODS))
      if (m.body) expect(() => JSON.parse(m.body)).not.toThrow();
  });
});
