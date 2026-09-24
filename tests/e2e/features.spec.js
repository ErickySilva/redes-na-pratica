import { test, expect } from "@playwright/test";
import { mockDns, reveal } from "./helpers.js";

test.describe("explorador DNS", () => {
  test("consulta MX e mostra a tabela de registros", async ({ page }) => {
    await mockDns(page);
    await page.goto("/");
    await reveal(page, "#dnsx");
    await page.locator("#dnsxName").fill("gmail.com");
    await page.locator('#dnsxTypes [data-type="MX"]').click();
    await expect(page.locator("#dnsxOut .dnsx-status")).toContainText("NOERROR · 2 registros");
    await expect(page.locator("#dnsxOut tbody tr")).toHaveCount(2);
    await expect(page.locator("#dnsxOut")).toContainText("gmail-smtp-in.l.google.com");
  });

  test("marca o registro SPF no TXT", async ({ page }) => {
    await mockDns(page);
    await page.goto("/");
    await reveal(page, "#dnsx");
    await page.locator("#dnsxName").fill("gmail.com");
    await page.locator('#dnsxTypes [data-type="TXT"]').click();
    await expect(page.locator("#dnsxOut .tag")).toHaveText("SPF");
  });

  test("explica o NXDOMAIN com o servidor que respondeu", async ({ page }) => {
    await mockDns(page);
    await page.goto("/");
    await reveal(page, "#dnsx");
    await page.locator("#dnsxName").fill("nao-existe-123.com.br");
    await page.locator("#dnsxForm button").click();
    await expect(page.locator("#dnsxOut")).toContainText("NXDOMAIN");
    await expect(page.locator("#dnsxOut")).toContainText("a.dns.br");
  });

  test("offline: mostra erro amigável e a página continua funcionando", async ({ page }) => {
    await mockDns(page, { mode: "offline" });
    await page.goto("/");
    await reveal(page, "#dnsx");
    await expect(page.locator("#dnsxOut")).toContainText("offline");
    await expect(page.locator("#ipOut")).toHaveText("93.184.216.34"); // IP de exemplo mantido
  });
});

test.describe("terminal", () => {
  test.beforeEach(async ({ page }) => {
    await mockDns(page);
    await page.goto("/");
    await reveal(page, "#term");
  });

  test("dig faz consulta real e imprime no formato do dig", async ({ page }) => {
    await page.locator("#cmdIn").fill("dig gmail.com mx");
    await page.keyboard.press("Enter");
    await expect(page.locator("#termOut")).toContainText(";; ANSWER SECTION:");
    await expect(page.locator("#termOut")).toContainText("alt1.gmail-smtp-in.l.google.com");
  });

  test("histórico com ↑ e autocompletar com Tab", async ({ page }) => {
    const input = page.locator("#cmdIn");
    await input.fill("whoami");
    await input.press("Enter");
    await expect(page.locator("#termOut")).toContainText("aluno");
    await input.press("ArrowUp");
    await expect(input).toHaveValue("whoami");
    await input.fill("nsl");
    await input.press("Tab");
    await expect(input).toHaveValue("nslookup ");
  });

  test("comando desconhecido mostra a ajuda", async ({ page }) => {
    await page.locator("#cmdIn").fill("rm -rf /");
    await page.keyboard.press("Enter");
    await expect(page.locator("#termOut")).toContainText("rm: comando não encontrado");
    await expect(page.locator("#termOut")).toContainText("comandos disponíveis");
  });
});

test.describe("raio-x", () => {
  test("desenha a cascata com dados reais da Performance API", async ({ page }) => {
    await mockDns(page);
    await page.goto("/");
    await reveal(page, "#xray");
    await expect(page.locator("#xray")).toHaveAttribute("data-ready", "true");
    const rows = page.locator(".xrow");
    expect(await rows.count()).toBeGreaterThanOrEqual(3); // documento + css + js, no mínimo
    expect(Number(await page.locator("#xrReq").textContent())).toBeGreaterThanOrEqual(3);
    await rows.first().focus();
    await expect(page.locator("#xrayDetail")).toContainText("documento");
    await expect(page.locator("#xrayDetail .xray-phases li")).toHaveCount(5);
  });
});

test.describe("tema", () => {
  test("segue o sistema e lembra a escolha manual", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.keyboard.press("t");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.locator(".tools [data-theme-toggle]")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});

test.describe("teclado", () => {
  test("→ avança de etapa e ? abre os atalhos", async ({ page }) => {
    await mockDns(page);
    await page.goto("/");
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#url-title")).toBeFocused();
    await expect(page.locator("#url")).toBeInViewport();

    await page.keyboard.press("?");
    await expect(page.locator("#shortcuts")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#shortcuts")).toBeHidden();
  });

  test("as setas não roubam o foco de campos de texto", async ({ page }) => {
    await page.goto("/");
    await page.locator("#enterKey").click();
    await page.locator("#domIn").focus();
    const before = await page.evaluate(() => scrollY);
    await page.keyboard.press("ArrowRight");
    expect(await page.evaluate(() => scrollY)).toBe(before);
  });
});
