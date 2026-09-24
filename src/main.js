import "./styles/main.css";

import { initScroll } from "./js/core/scroll.js";
import { initReveal } from "./js/core/reveal.js";
import { initNav } from "./js/core/nav.js";

import { initHero } from "./js/sections/hero.js";
import { initUrl } from "./js/sections/url.js";
import { initDns } from "./js/sections/dns.js";
import { initTcp } from "./js/sections/tcp.js";
import { initTls } from "./js/sections/tls.js";
import { initHttp } from "./js/sections/http.js";
import { initRender } from "./js/sections/render.js";
import { initLayers } from "./js/sections/layers.js";
import { initTerminal } from "./js/sections/terminal.js";
import { initEmail } from "./js/sections/email.js";
import { initFinale } from "./js/sections/finale.js";

[
  initHero,
  initUrl,
  initDns,
  initTcp,
  initTls,
  initHttp,
  initRender,
  initLayers,
  initTerminal,
  initEmail,
  initFinale,
  initReveal,
  initNav,
].forEach((init) => {
  // Uma seção com erro não derruba as demais.
  try {
    init();
  } catch (err) {
    console.error(`[entre-o-enter] falha em ${init.name}:`, err);
  }
});

// Por último: as cenas já foram registradas pelas seções acima.
initScroll();
