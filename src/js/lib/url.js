/** Normalização e validação de endereços digitados pela pessoa. */

const LABEL = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;

/**
 * Extrai o host de qualquer coisa que pareça um endereço:
 * "HTTPS://Www.Site.com.br:8080/a?b#c" → "www.site.com.br".
 * Domínios com acento viram punycode ("ação.com" → "xn--ao-lja7c.com").
 * Retorna "" quando não há um host utilizável.
 */
export function normalizeDomain(input) {
  const raw = String(input ?? "")
    .trim()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d*$/, "")
    .replace(/\.$/, "");
  if (!raw || /\s/.test(raw)) return "";
  try {
    return new URL(`http://${raw}`).hostname;
  } catch {
    return "";
  }
}

/** Hostname sintaticamente válido para uma consulta DNS pública (RFC 1123). */
export function isValidHostname(host) {
  if (!host || host.length > 253) return false;
  const labels = host.split(".");
  if (labels.length < 2) return false;
  if (/^\d+$/.test(labels[labels.length - 1])) return false; // parece IP
  return labels.every((l) => LABEL.test(l));
}

/** Garante que o caminho HTTP comece com "/". */
export function normalizePath(input) {
  const v = String(input ?? "").trim() || "/";
  return v.startsWith("/") ? v : `/${v}`;
}
