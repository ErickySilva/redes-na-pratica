/** Conteúdo do playground HTTP: métodos e códigos de status. */

export const METHODS = {
  GET: {
    body: null,
    title: "GET busca um recurso",
    text: "Não deve alterar nada no servidor, por isso você pode atualizar a página quantas vezes quiser. É o que acontece ao abrir o feed de uma rede social.",
  },
  POST: {
    body: '{"nome":"Ana","qtd":2}',
    title: "POST envia dados",
    text: "Leva um corpo e normalmente muda alguma coisa. É o login e o comentário publicado. Repetir pode criar dois pedidos iguais, e daí vem o aviso de não atualizar a página.",
  },
  PUT: {
    body: '{"qtd":5}',
    title: "PUT atualiza um recurso",
    text: "Coloca o recurso em determinado estado e é idempotente: mandar dez vezes dá o mesmo resultado de mandar uma.",
  },
  DELETE: {
    body: null,
    title: "DELETE remove um recurso",
    text: "Apaga o recurso indicado pelo caminho. Também é idempotente: apagar de novo o que já sumiu não muda mais nada.",
  },
};

export const STATUSES = {
  200: {
    cls: 2,
    phrase: "OK",
    title: "200 tudo certo",
    text: "A resposta mais comum da web, e a que ninguém percebe. O corpo traz o recurso pedido.",
  },
  301: {
    cls: 3,
    phrase: "Moved Permanently",
    title: "301 mudou de vez",
    text: "O recurso agora mora em outro endereço, permanentemente. É o que acontece quando você digita um site sem https e ele te leva para a versão segura.",
  },
  302: {
    cls: 3,
    phrase: "Found",
    title: "302 mudou por agora",
    text: "Desvio temporário. O navegador segue para o novo endereço, mas continua usando o original nas próximas vezes.",
  },
  400: {
    cls: 4,
    phrase: "Bad Request",
    title: "400 pedido malformado",
    text: "O servidor não entendeu o que chegou. Formulário com dados inválidos ou requisição quebrada.",
  },
  401: {
    cls: 4,
    phrase: "Unauthorized",
    title: "401 quem é você",
    text: "Falta autenticação. É a página que pede login antes de mostrar qualquer coisa.",
  },
  403: {
    cls: 4,
    phrase: "Forbidden",
    title: "403 sei quem é você, e não",
    text: "Autenticado, mas sem permissão. A área administrativa que o seu usuário não pode abrir.",
  },
  404: {
    cls: 4,
    phrase: "Not Found",
    title: "404 não existe",
    text: "O recurso não está lá. Link quebrado, endereço digitado errado ou página apagada.",
  },
  500: {
    cls: 5,
    phrase: "Internal Server Error",
    title: "500 o servidor quebrou",
    text: "Erro interno. Quando aparece num sistema que você desenvolveu, o problema é seu, não de quem acessou.",
  },
  502: {
    cls: 5,
    phrase: "Bad Gateway",
    title: "502 resposta inválida",
    text: "Um servidor intermediário recebeu algo quebrado de quem estava atrás dele.",
  },
  503: {
    cls: 5,
    phrase: "Service Unavailable",
    title: "503 indisponível agora",
    text: "O servidor está sobrecarregado ou em manutenção. Costuma ser temporário.",
  },
};

/** Cor e tom de destaque por classe de status (2xx, 3xx, 4xx, 5xx). */
export const CLASS_COLOR = {
  2: "var(--safe)",
  3: "var(--wire)",
  4: "var(--warn)",
  5: "var(--alarm)",
};
export const CLASS_TONE = { 2: "g", 3: "k", 4: "y", 5: "r" };
