/**
 * Plugin Vite mínimo para compor o index.html a partir de arquivos parciais.
 *
 *   <!-- @include sections/02-dns.html -->
 *
 * Os caminhos são relativos à pasta de parciais. Inclusões aninhadas funcionam,
 * ciclos geram erro, e editar um parcial recarrega a página no modo dev.
 */
import fs from "node:fs";
import path from "node:path";

const INCLUDE = /^([ \t]*)<!--\s*@include\s+([\w./-]+)\s*-->/gm;

function render(html, dir, stack) {
  return html.replace(INCLUDE, (_, indent, file) => {
    const full = path.resolve(dir, file);
    if (stack.includes(full)) {
      throw new Error(`[html-partials] inclusão circular: ${[...stack, full].join(" → ")}`);
    }
    if (!fs.existsSync(full)) {
      throw new Error(`[html-partials] parcial não encontrado: ${file}`);
    }
    const body = render(fs.readFileSync(full, "utf8"), path.dirname(full), [...stack, full]);
    return body
      .trimEnd()
      .split("\n")
      .map((line) => (line ? indent + line : line))
      .join("\n");
  });
}

export default function htmlPartials({ dir = "src/partials" } = {}) {
  let partialsDir = "";

  return {
    name: "html-partials",

    configResolved(config) {
      partialsDir = path.resolve(config.root, dir);
    },

    transformIndexHtml: {
      order: "pre",
      handler: (html) => render(html, partialsDir, []),
    },

    handleHotUpdate({ file, server }) {
      if (path.resolve(file).startsWith(partialsDir) && file.endsWith(".html")) {
        server.ws.send({ type: "full-reload" });
        return [];
      }
    },
  };
}

export { render as renderPartials };
