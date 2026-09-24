/** Etapas do caminho do e-mail: quais nós acendem e o que cada protocolo faz. */
export const MAIL_LEGS = {
  smtp: {
    nodes: [0, 1, 2],
    color: "var(--sig)",
    name: "SMTP, o envio",
    text: "Seu aplicativo empurra a mensagem para o seu servidor, que consulta o registro MX do domínio de destino no DNS e entrega ao servidor dela, às vezes passando por intermediários. Portas 25 entre servidores, 587 e 465 para o seu aplicativo.",
  },
  pop: {
    nodes: [3, 4],
    color: "var(--warn)",
    name: "POP3, o download",
    text: "Pensado para os anos 1990: conexão discada cobrada por minuto e um computador só. Conecta, baixa tudo, apaga do servidor e desconecta. A mensagem passa a viver no aparelho.",
  },
  imap: {
    nodes: [3, 4],
    color: "var(--safe)",
    name: "IMAP, a sincronização",
    text: "A mensagem continua no servidor e cada aparelho é uma janela para ela. Lidos, pastas e exclusões ficam iguais em todos os lugares, e dá para baixar só os cabeçalhos antes de buscar um anexo pesado.",
  },
};
