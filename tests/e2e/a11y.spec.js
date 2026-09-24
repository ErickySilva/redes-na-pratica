import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mockDns } from "./helpers.js";

for (const scheme of ["light", "dark"]) {
  test(`sem violações WCAG 2.1 AA no tema ${scheme}`, async ({ page }) => {
    await mockDns(page);
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.goto("/");
    await page.locator("#enterKey").click();

    // Revela todas as seções (o axe ignora conteúdo invisível) e espera as interações iniciais.
    await page.evaluate(() =>
      document.querySelectorAll(".rv").forEach((el) => el.classList.add("in")),
    );
    await page.waitForTimeout(500);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const summary = results.violations.map(
      (v) => `${v.id} (${v.impact}): ${v.nodes.length}× → ${v.nodes[0].target.join(" ")}`,
    );
    expect(summary, summary.join("\n")).toEqual([]);
  });
}
