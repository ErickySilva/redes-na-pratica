import { describe, it, expect } from "vitest";
import { normalizeDomain, isValidHostname, normalizePath } from "../../src/js/lib/url.js";

describe("normalizeDomain", () => {
  it.each([
    ["www.exemplo.com", "www.exemplo.com"],
    ["  WWW.Exemplo.COM  ", "www.exemplo.com"],
    ["https://www.ufpe.br/qualquer?x=1#y", "www.ufpe.br"],
    ["http://site.com.br:8080/a", "site.com.br"],
    ["ftp://arquivos.org", "arquivos.org"],
    ["exemplo.com.", "exemplo.com"],
    ["ação.com.br", "xn--ao-siap.com.br"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeDomain(input)).toBe(expected);
  });

  it.each(["", "   ", "com espaço.com", null, undefined])("rejeita %p", (input) => {
    expect(normalizeDomain(input)).toBe("");
  });
});

describe("isValidHostname", () => {
  it.each(["exemplo.com", "www.ufpe.br", "a-b.c-d.io", "xn--ao-siap.com.br"])("aceita %s", (h) =>
    expect(isValidHostname(h)).toBe(true),
  );

  it.each([
    ["", "vazio"],
    ["localhost", "sem ponto"],
    ["192.168.0.1", "endereço IP"],
    ["-inicio.com", "rótulo começando com hífen"],
    ["fim-.com", "rótulo terminando com hífen"],
    [`${"a".repeat(64)}.com`, "rótulo com mais de 63 caracteres"],
    [`${"a.".repeat(127)}com`, "nome com mais de 253 caracteres"],
  ])("rejeita %s (%s)", (h) => expect(isValidHostname(h)).toBe(false));
});

describe("normalizePath", () => {
  it("acrescenta a barra inicial", () => expect(normalizePath("carrinho")).toBe("/carrinho"));
  it("mantém caminhos já normalizados", () => expect(normalizePath("/a?b=1")).toBe("/a?b=1"));
  it("vazio vira a raiz", () => expect(normalizePath("   ")).toBe("/"));
});
