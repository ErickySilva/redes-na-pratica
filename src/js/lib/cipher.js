/**
 * Efeitos visuais de "criptografia". Nada aqui é criptografia de verdade:
 * são funções determinísticas para ilustrar a diferença entre texto aberto e cifrado.
 */

const HEX = "0123456789abcdef";

/** Hash FNV-1a + gerador congruente linear: mesma entrada, mesma saída "cifrada". */
export function fakeCipher(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619) >>> 0;
  let out = "";
  for (let j = 0; j < Math.max(22, str.length * 2); j++) {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    out += HEX[h % 16];
  }
  return out;
}

/**
 * Um quadro da animação de "decodificação": revela `target` da esquerda para
 * a direita conforme `progress` vai de 0 a 1, com ruído hexadecimal no resto.
 */
export function scrambleFrame(target, length, progress, random = Math.random) {
  if (progress >= 1) return target;
  let out = "";
  for (let i = 0; i < length; i++) {
    out += i < target.length && i / length < progress ? target[i] : HEX[(random() * 16) | 0];
  }
  return out;
}
