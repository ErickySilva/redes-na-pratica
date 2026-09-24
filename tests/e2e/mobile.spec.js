import { test, expect } from "@playwright/test";
import { mockDns, reveal } from "./helpers.js";

test.beforeEach(async ({ page }) => {
  await mockDns(page);
  await page.goto("/");
});

test("nenhum elemento alarga a página além da tela", async ({ page }) => {
  const { inner, viewport } = await page.evaluate(() => ({
    inner: window.innerWidth,
    viewport: document.documentElement.clientWidth,
  }));
  // No celular, conteúdo largo demais faz o navegador ampliar o viewport de layout.
  expect(inner).toBe(viewport);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("barra superior mostra a etapa atual e o botão de tema", async ({ page }) => {
  await expect(page.locator(".topbar")).toBeVisible();
  await expect(page.locator(".railnav")).toBeHidden();
  await reveal(page, "#http");
  await expect(page.locator("#nowLabel")).toHaveText("05 HTTP");
  await page.locator(".topbar [data-theme-toggle]").tap();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
