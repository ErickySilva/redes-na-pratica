/** Perguntas do quiz final. `answer` é o índice da opção correta. */
export const QUESTIONS = [
  {
    question: "Qual registro do DNS diz para onde vai o e-mail de um domínio?",
    options: ["A", "MX", "CNAME", "TXT"],
    answer: 1,
    feedback:
      "O MX aponta o servidor de correio. Sem ele, a mensagem não encontra o destino, por mais correto que esteja o endereço.",
  },
  {
    question: "O que 403 quer dizer, e não 401?",
    options: [
      "Falta fazer login",
      "O recurso sumiu",
      "Você está identificado e mesmo assim não pode",
      "O servidor quebrou",
    ],
    answer: 2,
    feedback:
      "401 pergunta quem é você. 403 já sabe e nega mesmo assim: é falta de permissão, não de autenticação.",
  },
  {
    question: "SFTP é o FTP com criptografia?",
    options: [
      "Sim, é o FTP dentro de TLS",
      "Não, é um protocolo próprio sobre SSH",
      "Sim, só muda a porta",
      "Não, é o FTP com senha",
    ],
    answer: 1,
    feedback:
      "Quem é o FTP dentro de TLS é o FTPS. O SFTP é outro protocolo, subsistema do SSH, na porta 22, e não descende do FTP.",
  },
  {
    question: "Você lê no celular e aparece como lida no notebook. Qual protocolo?",
    options: ["POP3", "SMTP", "IMAP", "MX"],
    answer: 2,
    feedback:
      "No IMAP a mensagem fica no servidor e o estado é sincronizado. No POP3 ela seria baixada e apagada do servidor.",
  },
  {
    question: "HTTPS é um protocolo diferente do HTTP?",
    options: [
      "Sim, tem métodos próprios",
      "Não, é o mesmo HTTP dentro de um túnel TLS",
      "Sim, roda só em UDP",
      "Não, é o HTTP na porta 8080",
    ],
    answer: 1,
    feedback:
      "Mesmos métodos, mesmos cabeçalhos, mesma sintaxe. O que muda é que tudo viaja dentro do túnel montado pelo TLS, na porta 443.",
  },
];
