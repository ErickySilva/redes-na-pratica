import { test, expect } from "@playwright/test";
import { mockDns, reveal, scrollScene, FAKE_IP } from "./helpers.js";

test.beforeEach(async ({ page }) => {
  await mockDns(page);
  await page.goto("/");
});

test("01 URL: as setas percorrem as partes do endereço", async ({ page }) => {
  await reveal(page, "#urlLine");
  await page.locator("#urlLine [role=tab]").first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#urlOut .tagname")).toHaveText("host");
  await page.keyboard.press("End");
  await expect(page.locator("#urlOut .tagname")).toHaveText("fragmento");
  await expect(page.locator("#urlLine [role=tab][aria-selected=true]")).toHaveCount(1);
});

test("02 DNS: a rolagem completa a resolução e o IP real substitui o exemplo", async ({ page }) => {
  await scrollScene(page, "#dns", 0.95);
  await expect(page.locator("#ipOut")).toHaveClass(/on/);
  await expect(page.locator("#ipOut")).toHaveText(FAKE_IP);
  await page.locator("#dnsAgain").click();
  await expect(page.locator("#ipMeta")).toContainText("cache");
  await expect(page.locator(".knode.skip")).toHaveCount(3);
});

test("03 TCP: simula a perda do SYN e a retransmissão", async ({ page }) => {
  await reveal(page, "#tcpRails");
  await expect(page.locator("#tcpState")).toContainText("estabelecida", { timeout: 6000 });
  await page.locator("#tcpRails .swt").click();
  await page.locator("#tcpRun").click();
  await expect(page.locator("#tcpState")).toContainText("SYN se perdeu");
  await expect(page.locator("#tcpState")).toContainText("estabelecida", { timeout: 8000 });
});

test("04 TLS: cifra o conteúdo e alerta sobre certificado inválido", async ({ page }) => {
  await reveal(page, "#tunnel");
  await page.locator("#tunnel .swt").click();
  await expect(page.locator("#payload")).toHaveText("8f3a2b91c7d4e05b1a9c");
  await expect(page.locator("#portLabel")).toHaveText("PORTA 443");
  await page.locator("#certBreak").click();
  await expect(page.locator("#certWarn")).toBeVisible();
});

test("05 HTTP: método, caminho e status alteram as mensagens", async ({ page }) => {
  await reveal(page, ".pg");
  await page.locator('#methods [data-m="POST"]').click();
  await page.locator('#statuses [data-s="404"]').click();
  await page.locator("#pathIn").fill("carrinho");
  await page.locator("#reqForm button").click();
  await expect(page.locator("#reqOut")).toContainText("POST /carrinho HTTP/1.1");
  await expect(page.locator("#reqOut")).toContainText("Content-Type: application/json");
  await expect(page.locator("#respOut")).toContainText("404 Not Found", { timeout: 4000 });
  await expect(page.locator("#statusMeaning h3")).toHaveText("404 não existe");
});

test("06 Render: os contadores acompanham a rolagem", async ({ page }) => {
  await scrollScene(page, "#render", 1);
  await expect(page.locator("#cReq")).toHaveText("42");
  await expect(page.locator(".blk.done")).toHaveCount(7);
});

test("07 Camadas: acordeão abre uma camada por vez", async ({ page }) => {
  await reveal(page, "#layers");
  await page.locator('[aria-controls="L2"]').click();
  await expect(page.locator("#L2")).toBeVisible();
  await expect(page.locator("#L1")).toBeHidden();
  await page.locator("#portStrip button", { hasText: "443" }).click();
  await expect(page.locator("#portOut")).toContainText("Porta 443, HTTPS.");
});

test("08 FTP e Telnet x SSH", async ({ page }) => {
  await reveal(page, "#ftp");
  await page.locator('#ftpMode [data-mode="passivo"]').click();
  await expect(page.locator("#ftpSay")).toContainText("Transferência concluída", { timeout: 5000 });
  await page.locator("#pw").fill("minhasenha");
  await expect(page.locator("#wTel")).toHaveText("Password: minhasenha");
  await expect(page.locator("#wSsh")).not.toContainText("minhasenha");
});

test("09 E-mail: IMAP sincroniza, POP3 esvazia o servidor", async ({ page }) => {
  await reveal(page, "#mailLegs");
  await page.locator('#mailLegs [data-leg="imap"]').click();
  await page.locator("#readBtn").click();
  await expect(page.locator("#dLap")).toHaveText("1 mensagem lida");
  await page.locator('#mailLegs [data-leg="pop"]').click();
  await page.locator("#readBtn").click();
  await expect(page.locator("#dLap")).toHaveText("nenhuma mensagem");
  await expect(page.locator("#dSrv")).toContainText("caixa vazia");
});

test("10 Quiz: placar, feedback e refazer", async ({ page }) => {
  await reveal(page, "#quiz");
  const cards = page.locator(".qcard");
  await cards.nth(0).locator(".opt").nth(1).click(); // certa
  await cards.nth(1).locator(".opt").nth(0).click(); // errada
  await expect(page.locator("#scoreN")).toHaveText("1");
  await expect(page.locator("#scoreT")).toHaveText("acertos em 2 de 5 respondidas");
  await expect(cards.nth(1).locator(".qfb")).toContainText("Não exatamente");
  await page.locator("#quizReset").click();
  await expect(page.locator("#scoreN")).toHaveText("0");
  await expect(page.locator("#quizReset")).toBeHidden();
});
