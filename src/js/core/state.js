/**
 * Estado global mínimo, com assinaturas por chave.
 *   domain: o domínio usado em toda a experiência
 *   ip:     o endereço que esse domínio resolve (começa com um exemplo, vira real após a consulta)
 */
const state = {
  domain: "www.exemplo.com",
  ip: "93.184.216.34",
};
const subscribers = new Map();

export const DEFAULT_PATH = "/produtos?id=42";

export const get = (key) => state[key];

export function set(key, value) {
  if (state[key] === value) return;
  state[key] = value;
  subscribers.get(key)?.forEach((fn) => fn(value));
}

/** Chama `fn(valor)` sempre que `key` mudar. Devolve a função de cancelar. */
export function subscribe(key, fn) {
  if (!subscribers.has(key)) subscribers.set(key, new Set());
  subscribers.get(key).add(fn);
  return () => subscribers.get(key).delete(fn);
}
