/** Funções puras de texto e números, sem dependência do DOM. */

export const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);

/** Escapa texto para ser inserido com segurança via innerHTML. */
export const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Formata milissegundos: "0 ms", "38 ms", "1,24 s". */
export function formatMs(ms) {
  if (!Number.isFinite(ms) || ms < 0) return "–";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2).replace(".", ",")} s`;
}

/** Formata bytes: "812 B", "14,2 kB", "1,3 MB". */
export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "–";
  if (bytes < 1000) return `${bytes} B`;
  const units = ["kB", "MB", "GB"];
  let v = bytes;
  let i = -1;
  do {
    v /= 1000;
    i++;
  } while (v >= 1000 && i < units.length - 1);
  return `${v.toFixed(1).replace(".", ",")} ${units[i]}`;
}
