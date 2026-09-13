const { _electron: electron } = require("playwright");
const path = require("node:path");
const fs = require("node:fs");
async function main() {
  const packaged = process.argv.includes("--packaged");
  const application = await electron.launch(
    packaged
      ? {
          executablePath: path.resolve("release/Bahnreise/Bahnreise.exe"),
          args: ["--smoke-test"],
        }
      : { args: [path.resolve("desktop/main.cjs"), "--smoke-test"] },
  );
  try {
    const page = await application.firstWindow();
    // Hidden windows do not receive paint frames. Use Playwright's frame clock
    // for this packaged logic check; live browser QA covers actual animation.
    await application.evaluate(({ BrowserWindow }) => {
      BrowserWindow.getAllWindows()[0].webContents.setBackgroundThrottling(false);
    });
    await page.clock.install();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    // Browser E2E tests cover real persistence in isolated contexts. This
    // packaged-renderer check must never read or overwrite the player's saves.
    await page.addInitScript(() => {
      const values = new Map();
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        value: {
          getItem: (key) => values.get(String(key)) ?? null,
          setItem: (key, value) => values.set(String(key), String(value)),
          removeItem: (key) => values.delete(String(key)),
          clear: () => values.clear(),
          key: (index) => [...values.keys()][index] ?? null,
          get length() {
            return values.size;
          },
        },
      });
    });
    // Exercise the packaged catalog without hard-coding the number of stops.
    await page.route("https://tiles.openfreemap.org/**", (route) => {
      if (new URL(route.request().url()).pathname === "/planet")
        return route.fulfill({
          json: {
            tiles: ["https://tiles.openfreemap.org/test/{z}/{x}/{y}.pbf"],
            maxzoom: 14,
          },
        });
      return route.fulfill({
        status: 200,
        contentType: "application/x-protobuf",
        body: fs.readFileSync(path.resolve("tests/fixtures/calm-map.pbf")),
      });
    });
    await page.goto("bahnreise://app/");
    await page.getByTestId("start-journey").waitFor();
    const agent = await page.evaluate(() => navigator.userAgent);
    if (!agent.includes("Bahnreise/"))
      throw new Error("Missing desktop map identification");
    if (
      (await page.getByTestId("detected-profile").innerText()) !== "PC edition"
    )
      throw new Error("The Windows app did not select PC rules");
    await page.getByTestId("start-journey").click();
    for (let stop = 0; stop < 30; stop++) {
      if (await page.getByTestId("result-screen").count()) break;
      if (await page.getByTestId("arrival-transition").count()) break;
      const target = (
        await page.getByTestId("typing-target").innerText()
      ).replaceAll("␣", " ");
      await page
        .getByTestId("station-input")
        .pressSequentially(target, { delay: 10 });
    }
    await page.clock.runFor(5000);
    await page.getByTestId("result-screen").waitFor();
    const title = await page.getByTestId("result-title").innerText();
    if (title !== "You have arrived!") throw new Error(title);
    if (errors.length) throw new Error(errors.join("\n"));
    // Hidden Electron windows may not produce screenshot frames. Assert the
    // actual packaged game's result; visual QA is covered by the web suite.
    console.log(
      `Windows ${packaged ? "packaged" : "development"} app: journey completed without renderer errors.`,
    );
  } finally {
    await application.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
