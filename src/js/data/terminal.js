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
  [
    '<span class="cm"># dica: estes comandos são de mentira, mas "dig" consulta o DNS de verdade</span>',
    0,
  ],
];

/** Comandos com consulta real à rede (tratados de forma assíncrona pelo terminal). */
export const NETWORK_COMMANDS = ["dig", "nslookup"];

export const HELP = [
  '<span class="cm">comandos disponíveis:</span>',
  '  <span class="p">dig</span> [domínio] [tipo]   consulta DNS <span class="ok">real</span> (A, AAAA, MX, TXT, NS, CNAME)',
  '  <span class="p">nslookup</span> [domínio]      o mesmo, no estilo do Windows',
  '  <span class="p">ssh</span>, <span class="p">sftp</span>, <span class="p">telnet</span>      sessões simuladas',
  '  <span class="p">curl</span>, <span class="p">ls</span>, <span class="p">whoami</span>      respostas simuladas',
  '  <span class="p">clear</span>                   limpa a tela',
  '<span class="cm">↑ e ↓ navegam pelo histórico, Tab completa o comando.</span>',
];

/**
 * Respostas dos comandos simulados. Cada função recebe o contexto
 * { args, domain, ip, esc } e devolve as linhas (HTML) a imprimir.
 */
export const COMMANDS = {
  help: () => HELP,
  ssh: ({ ip }) => [
    '<span class="cm">The authenticity of host can\'t be established.</span>',
    '<span class="cm">ED25519 key fingerprint is SHA256:x8Fk...</span>',
    `<span class="ok">conectado a ${ip}:22. tudo o que passa daqui em diante vai cifrado.</span>`,
  ],
  telnet: ({ ip }) => [
    `<span class="er">Trying ${ip}... conectado na porta 23.</span>`,
    '<span class="er">aviso: cada tecla digitada sai em texto aberto pela rede.</span>',
  ],
  sftp: () => [
    '<span class="cm">Connected.</span>',
    "sftp&gt; put relatorio.pdf",
    '<span class="ok">Uploading relatorio.pdf  100%  2.4MB</span>',
    '<span class="cm">uma conexão só, porta 22, por dentro do SSH.</span>',
  ],
  ls: () => ["nginx  syslog  auth.log  relatorio.pdf"],
  whoami: () => ["aluno"],
  curl: ({ domain, esc }) => [
    '<span class="ok">HTTP/2 200</span>',
    "content-type: text/html",
    "server: nginx",
    `<span class="cm">(simulado) um curl de verdade para ${esc(domain)} seria bloqueado pelo CORS do navegador.</span>`,
  ],
};

export const COMMAND_NAMES = [...Object.keys(COMMANDS), ...NETWORK_COMMANDS, "clear"].sort();
