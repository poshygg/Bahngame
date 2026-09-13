const { chromium } = require("@playwright/test");
const fs = require("node:fs/promises");
const path = require("node:path");

async function main() {
  const url = new URL(process.argv[2] || "http://localhost:4173/");
  const browser = await chromium.launch({ headless: true });
  const output = path.resolve(__dirname, "../artifacts");
  const summary = { url: url.href, checkedAt: new Date().toISOString(), screens: [] };
  await fs.mkdir(output, { recursive: true });
  try {
    for (const [name, viewport] of [
      ["desktop", { width: 1440, height: 1000 }],
      ["mobile", { width: 390, height: 844 }],
    ]) {
      const context = await browser.newContext({ viewport, isMobile: name === "mobile", hasTouch: name === "mobile" });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      const response = await page.goto(url.href, { waitUntil: "domcontentloaded" });
      if (!response?.ok()) throw new Error(`HTTP ${response?.status()} for ${url.href}`);
      await page.getByTestId("home-screen").waitFor();
      await page.getByRole("button", { name: "Achievements", exact: true }).click();
      await page.getByTestId("achievements-panel").waitFor();
      const passport = await page.getByTestId("passport-progress").innerText();
      await page.screenshot({ path: path.join(output, `deployment-passport-${name}.png`) });
      await page.getByRole("button", { name: "Close", exact: true }).click();
      await page.getByTestId("start-journey").click();
      await page.getByTestId("origin-typing").waitFor();
      const origin = await page.getByTestId("typing-station-name").innerText();
      const current = await page.getByTestId("map-current-station").innerText();
      if (current !== origin) throw new Error("Map does not show the origin typing target");
      await page.getByTestId("station-input").pressSequentially(origin, { delay: 20 });
      await page.getByTestId("origin-typing").waitFor({ state: "detached" });
      const destination = await page.getByTestId("typing-station-name").innerText();
      if (!destination || destination === origin) throw new Error("Origin typing did not advance");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      if (overflow) throw new Error(`${name} viewport overflows horizontally`);
      if (await page.locator('[data-testid^="ad-preview-"]').count()) throw new Error("Advertisement appears during gameplay");
      await page.screenshot({ path: path.join(output, `deployment-game-${name}.png`) });
      if (errors.length) throw new Error(errors.join("\n"));
      summary.screens.push({ name, http: response.status(), passport, origin, destination, errors });
      await context.close();
    }
    await fs.writeFile(path.join(output, "deployment-smoke.json"), JSON.stringify(summary, null, 2) + "\n");
    console.log(JSON.stringify(summary, null, 2));
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
