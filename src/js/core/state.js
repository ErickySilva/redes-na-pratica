/**
 * Estado global mínimo: o domínio usado em toda a experiência.
 * Seções que exibem o domínio assinam com `onDomainChange`.
 */
const listeners = new Set();
let domain = "www.exemplo.com";

export const DEFAULT_PATH = "/produtos?id=42";

export const getDomain = () => domain;

export function setDomain(value) {
  domain = value;
  listeners.forEach((fn) => fn(domain));
}

export function onDomainChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
