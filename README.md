# Entre o Enter e a página

Landing page interativa que acompanha tudo o que acontece entre apertar **Enter** e a página aparecer: URL, DNS, TCP, TLS, HTTP, renderização, camadas do TCP/IP, SSH/FTP e e-mail (SMTP, POP3, IMAP).

Trabalho do **Grupo 6 de Redes de Computadores**.

## Destaques

- **10 etapas interativas**: dissecação da URL, resolução DNS guiada pela rolagem, aperto de mão TCP com perda de pacote, túnel TLS com certificado inválido, playground HTTP (métodos e status), montagem da página, terminal simulado, FTP ativo x passivo, Telnet x SSH, POP3 x IMAP e quiz final.
- **Sem framework**: HTML semântico, CSS com design tokens e JavaScript em módulos ES.
- **Acessível**: abas navegáveis pelo teclado (setas, Home, End), link para pular ao conteúdo, regiões `aria-live` e suporte a `prefers-reduced-motion`.
- **Leve e rápido**: um único `requestAnimationFrame` controla todas as cenas, e a animação do hero pausa fora da tela.
- **SEO**: meta tags, Open Graph, dados estruturados (`LearningResource`), manifest e favicon.

## Como rodar

Requer [Node.js](https://nodejs.org/) 20.19 ou superior.

```bash
npm install      # instala as dependências
npm run dev      # servidor de desenvolvimento com recarga automática
npm run build    # gera a versão de produção em dist/
npm run preview  # serve o dist/ localmente para conferir o build
```

Qualidade de código:

```bash
npm run lint          # ESLint
npm run format        # Prettier (formata)
npm run format:check  # Prettier (só confere)
```

## Estrutura

```
entre-o-enter/
├── index.html                 # marcação de todas as seções
├── public/                    # arquivos copiados sem processamento (favicon, manifest, robots)
├── src/
│   ├── main.js                # ponto de entrada: importa estilos e inicializa as seções
│   ├── styles/
│   │   ├── main.css           # importa todos os estilos na ordem certa
│   │   ├── tokens.css         # cores, fontes, movimento e espaçamento
│   │   ├── base.css           # reset, tipografia e utilitários
│   │   ├── layout.css         # container, etapas, cenas fixadas
│   │   ├── components.css     # botões, pílulas, campos, interruptor, tabela
│   │   ├── navigation.css     # trilho lateral e barra de progresso
│   │   └── sections/          # um arquivo por seção
│   └── js/
│       ├── core/              # utilitários: DOM, estado, rolagem, revelação, navegação
│       ├── data/              # conteúdo (textos do HTTP, quiz, e-mail, terminal)
│       └── sections/          # um módulo por seção
└── .github/workflows/         # deploy automático no GitHub Pages
```

### Como editar

- **Textos das explicações** ficam em `index.html` e nos arquivos de `src/js/data/`.
- **Cores e fontes**: altere só `src/styles/tokens.css`.
- **Nova pergunta no quiz**: acrescente um objeto em `src/js/data/quiz.js`; placar e total se ajustam sozinhos.
- **Novo comando no terminal**: acrescente uma função em `COMMANDS`, dentro de `src/js/data/terminal.js`.

## Publicação

O build usa caminhos relativos (`base: "./"`), então a pasta `dist/` funciona em qualquer hospedagem estática: GitHub Pages, Netlify, Vercel ou Cloudflare Pages.

**GitHub Pages (automático):** suba o projeto para um repositório no GitHub, na branch `main`, e em _Settings → Pages → Source_ escolha **GitHub Actions**. A cada push, o workflow em `.github/workflows/deploy.yml` roda o lint, gera o build e publica.

**Netlify ou Vercel:** comando de build `npm run build`, pasta de saída `dist`.

## Referências

- Kurose, J.; Ross, K. _Redes de Computadores e a Internet_. Pearson.
- Tanenbaum, A.; Wetherall, D.; Feamster, N. _Redes de Computadores_. Pearson.
- Comer, D. _Interligação de Redes com TCP/IP_. Elsevier.
- RFCs 1034/1035 (DNS), 9110–9114 (HTTP), 8446 (TLS 1.3), 3986 (URI), 959/2428 (FTP), 854 (Telnet), 4251–4254 (SSH), 5321/6409/8314 (SMTP), 1939 (POP3), 9051 (IMAP).
