import { test, expect } from "@playwright/test";
import { mockDns, FAKE_IP } from "./helpers.js";

test.beforeEach(async ({ page }) => {
  await mockDns(page);
  await page.goto("/");
});

test("apertar Enter digita a URL na barra de endereço", async ({ page }) => {
  await page.keyboard.press("Enter");
  await expect(page.locator("#typedUrl")).toHaveText("https://www.exemplo.com/produtos?id=42", {
    timeout: 5000,
  });
  await expect(page.locator("#hero")).toHaveClass(/armed/);
});

test("domínio inválido mostra erro e não altera a página", async ({ page }) => {
  await page.locator("#enterKey").click();
  await page.locator("#domIn").fill("isso não é domínio");
  await page.locator("#domForm button").click();
  await expect(page.locator("#domIn")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#domNote")).toContainText("não parece um domínio");
  await expect(page.locator("#dns-title [data-dom]")).toHaveText("www.exemplo.com");
});

test("domínio válido é normalizado, resolvido e propagado para a página inteira", async ({
  page,
}) => {
  await page.locator("#enterKey").click();
  await page.locator("#domIn").fill("HTTPS://WWW.UFPE.BR/qualquer/coisa");
  await page.locator("#domForm button").click();

  await expect(page.locator("#domIn")).toHaveValue("www.ufpe.br");
  await expect(page.locator("#domNote")).toContainText("198.51.100.20");
  await expect(page.locator("#dns-title [data-dom]")).toHaveText("www.ufpe.br");
  await expect(page.locator("#reqOut")).toContainText("Host: www.ufpe.br");
  // todos os lugares que mostram o IP passam a mostrar o IP real
  for (const el of await page.locator("[data-ip]").all()) {
    await expect(el).toHaveText("198.51.100.20");
  }
  expect(FAKE_IP).not.toBe("198.51.100.20");
});
