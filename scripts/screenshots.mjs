/**
 * Gera as imagens do README (docs/screenshots) e a imagem de compartilhamento
 * (public/og-image.png) a partir da página real.
 *
 *   npm run build && npm run preview   # em outro terminal
 *   npm run screenshots
 */
import { chromium, devices } from "@playwright/test";
import fs from "node:fs";

const URL = process.env.URL ?? "http://localhost:4173/";
const OUT = "docs/screenshots";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function open({ theme = "light", viewport = { width: 1440, height: 900 }, device } = {}) {
  const ctx = await browser.newContext({
    ...(device ?? { viewport }),
    colorScheme: theme,
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });
  return page;
}

/** Rola até o seletor, revela as animações e espera as interações assíncronas. */
async function at(page, selector, { offset = -60, wait = 900 } = {}) {
  await page.evaluate(
    ([sel, off]) => {
      const el = document.querySelector(sel);
      window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + off, behavior: "instant" });
    },
    [selector, offset],
  );
  await page.waitForTimeout(wait);
  await page.evaluate(() =>
    document.querySelectorAll(".rv").forEach((el) => el.classList.add("in")),
  );
  await page.waitForTimeout(300);
}

const shot = (page, name) => page.screenshot({ path: `${OUT}/${name}.png` });

// Hero, claro e escuro
for (const theme of ["light", "dark"]) {
  const page = await open({ theme });
  await page.locator("#enterKey").click();
  await page.waitForTimeout(2600);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(400);
  await shot(page, `hero-${theme}`);
  await page.close();
}

// Seções em destaque (tema escuro, que fica melhor no README do GitHub)
{
  const page = await open({ theme: "dark" });

  await page.evaluate(() => {
    const s = document.querySelector("#dns");
    window.scrollTo({
      top: s.offsetTop + (s.offsetHeight - innerHeight) * 0.95,
      behavior: "instant",
    });
  });
  await page.waitForTimeout(1500);
  await shot(page, "dns-scene");

  await at(page, "#dnsx", { wait: 400 });
  await page.locator("#dnsxName").fill("gmail.com");
  await page.locator('#dnsxTypes [data-type="MX"]').click();
  await page.waitForTimeout(1500);
  await shot(page, "dns-explorer");

  await at(page, ".pg");
  await page.locator('#methods [data-m="POST"]').click();
  await page.locator('#statuses [data-s="404"]').click();
  await page.waitForTimeout(600); // espera as transições de cor terminarem
  await shot(page, "http");

  await at(page, "#raio-x", { wait: 1500 });
  await page.locator(".xrow").first().focus();
  await page.waitForTimeout(700);
  await shot(page, "raio-x");

  await at(page, "#term", { wait: 3500 });
  await page.locator("#cmdIn").fill("dig gmail.com mx");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1500);
  await shot(page, "terminal");

  await page.close();
}

// Celular
{
  const page = await open({ theme: "light", device: devices["Pixel 7"] });
  await page.locator("#enterKey").click();
  await page.waitForTimeout(600);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(300);
  await shot(page, "mobile-hero");
  await at(page, ".pg");
  await shot(page, "mobile-http");
  await page.close();
}

// Imagem de compartilhamento (Open Graph), 1200x630
{
  const ctx = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    colorScheme: "light",
  });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.addStyleTag({
    content: ".tools,.railnav,.scrollcue,.domrow,.domnote,.hint{display:none!important}",
  });
  await page.locator("#enterKey").click();
  await page.waitForTimeout(2600);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: "public/og-image.png" });
  await ctx.close();
}

await browser.close();
console.log(`imagens salvas em ${OUT}/ e public/og-image.png`);
