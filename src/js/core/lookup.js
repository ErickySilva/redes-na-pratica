/**
 * Serviço de consulta DNS compartilhado pelas seções.
 * Guarda as respostas em cache (como um resolvedor faria) e publica o IP no estado.
 */
import { resolve, firstAddress } from "../lib/dns.js";
import { get, set } from "./state.js";

const cache = new Map();

/** Consulta `name`/`type`, reaproveitando a resposta enquanto a página estiver aberta. */
export function lookup(name, type = "A") {
  const key = `${name}|${type}`;
  if (!cache.has(key)) {
    const pending = resolve(name, type).catch((err) => {
      cache.delete(key); // falha não fica em cache: a próxima tentativa vai à rede de novo
      throw err;
    });
    cache.set(key, pending);
  }
  return cache.get(key);
}

/**
 * Resolve o domínio atual e, se houver endereço IPv4, atualiza o IP de toda a página.
 * @returns {Promise<{ result, ip: string|null }>}
 */
export async function resolveCurrentDomain() {
  const domain = get("domain");
  const result = await lookup(domain, "A");
  const ip = firstAddress(result);
  // Só aplica se a pessoa não trocou de domínio enquanto a resposta viajava.
  if (ip && get("domain") === domain) set("ip", ip);
  return { result, ip };
}
