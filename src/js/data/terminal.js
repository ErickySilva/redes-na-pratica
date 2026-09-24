/** Roteiro inicial do terminal: [html da linha, pausa em ms até a próxima]. */
export const INTRO_SCRIPT = [
  ['<span class="p">$</span> ssh aluno@servidor', 260],
  ['<span class="cm">The authenticity of host can\'t be established.</span>', 180],
  ['<span class="cm">ED25519 key fingerprint is SHA256:x8Fk...</span>', 180],
  ['<span class="cm">Are you sure you want to continue? </span>yes', 420],
  ['<span class="ok">aluno@servidor:~$</span> ls /var/log', 300],
  ["nginx  syslog  auth.log", 200],
  ['<span class="p">$</span> sftp aluno@servidor', 260],
  ['<span class="cm">Connected to servidor.</span>', 180],
  ["sftp&gt; put relatorio.pdf", 260],
  ['<span class="ok">Uploading relatorio.pdf  100%  2.4MB</span>', 200],
  ['<span class="p">$</span> <span class="caret"></span>', 0],
];

export const HELP =
  'comandos disponíveis: <span class="p">ssh</span>, <span class="p">sftp</span>, <span class="p">dig</span>, <span class="p">nslookup</span>, <span class="p">curl</span>, <span class="p">telnet</span>, <span class="p">ls</span>, <span class="p">clear</span>';

/**
 * Respostas dos comandos simulados. Cada função recebe os argumentos
 * digitados e o domínio atual, e devolve as linhas (HTML) a imprimir.
 */
export const COMMANDS = {
  help: () => [HELP],
  ssh: () => [
    '<span class="cm">The authenticity of host can\'t be established.</span>',
    '<span class="cm">ED25519 key fingerprint is SHA256:x8Fk...</span>',
    '<span class="ok">conectado. tudo o que passa daqui em diante vai cifrado.</span>',
  ],
  telnet: () => [
    '<span class="er">Trying 93.184.216.34... conectado na porta 23.</span>',
    '<span class="er">aviso: cada tecla digitada sai em texto aberto pela rede.</span>',
  ],
  sftp: () => [
    '<span class="cm">Connected.</span>',
    "sftp&gt; put relatorio.pdf",
    '<span class="ok">Uploading relatorio.pdf  100%  2.4MB</span>',
    '<span class="cm">uma conexão só, porta 22, por dentro do SSH.</span>',
  ],
  ls: () => ["nginx  syslog  auth.log  relatorio.pdf"],
  dig: (args, domain, esc) => [
    "Server:  1.1.1.1#53",
    `Name:    ${esc(args[0] || domain)}`,
    '<span class="ok">Address: 93.184.216.34</span>',
    '<span class="cm">resposta do cache do resolvedor, não do servidor autoritativo.</span>',
  ],
  curl: () => [
    '<span class="ok">HTTP/2 200</span>',
    "content-type: text/html",
    "server: nginx",
    '<span class="cm">só os cabeçalhos. o corpo viria depois da linha em branco.</span>',
  ],
};
COMMANDS.nslookup = COMMANDS.dig;
