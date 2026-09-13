import { type Page } from "@playwright/test";
import { normalizeInput, stageRules } from "../../src/game/engine";
import {
  test,
  expect,
  FIRST_STAGE,
  BASE_URL,
  PROGRESS_KEY,
  mockMapTiles,
  startJourney,
  finishJourney,
  typeStations,
  readProgress,
  expectNoHorizontalOverflow,
  departOrigin,
} from "./fixtures";

const desktopRules = stageRules(FIRST_STAGE, "keyboard");
const home = (page: Page) =>
  page.getByRole("button", { name: "View journey map", exact: true }).click();

test("desktop journey recovers from an error, unlocks the next city and persists", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await startJourney(page);
  await page.getByTestId("station-input").pressSequentially("!");
  await expect(page.getByTestId("live-accuracy")).toHaveText("0%");
  await expect(page.getByTestId("station-input")).toHaveValue("");
  await finishJourney(page);
  await expect(page.getByTestId("result-title")).toHaveText(
    "You have arrived!",
  );
  await home(page);
  await page.getByTestId("stage-search").fill("An afternoon in Hamburg");
  await expect(page.getByTestId("stage-DE.hamburg")).toBeEnabled();
  await page.reload();
  await page.getByTestId("stage-search").fill("An afternoon in Hamburg");
  await expect(page.getByTestId("stage-DE.hamburg")).toBeEnabled();
  await expect(page.getByTestId("detected-profile")).toHaveText("PC edition");
  expect(errors).toEqual([]);
});

test("timer waits for input, freezes on pause and enforces the expanded-route deadline", async ({
  page,
}) => {
  await page.clock.install();
  await startJourney(page);
  const before = await page.getByTestId("live-time").innerText();
  await page.clock.runFor(3000);
  await expect(page.getByTestId("live-time")).toHaveText(before);
  await page
    .getByTestId("station-input")
    .pressSequentially(normalizeInput(FIRST_STAGE.stations[0])[0]);
  await page.clock.runFor(2000);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const paused = await page.getByTestId("live-time").innerText();
  await page.clock.runFor(10000);
  await expect(page.getByTestId("live-time")).toHaveText(paused);
  await page.getByRole("button", { name: "Continue journey" }).click();
  await page.clock.fastForward((desktopRules.seconds + 1) * 1000);
  await expect(page.getByTestId("result-title")).toHaveText(
    "Catch the next train.",
  );
  await home(page);
  await page.getByTestId("stage-search").fill("An afternoon in Hamburg");
  await expect(page.getByTestId("stage-DE.hamburg")).toBeDisabled();
});

test("poor accuracy fails despite reaching the final station", async ({
  page,
}) => {
  await startJourney(page);
  await page
    .getByTestId("station-input")
    .pressSequentially("!".repeat(desktopRules.totalChars), { delay: 2 });
  await finishJourney(page);
  await expect(page.getByTestId("result-title")).toHaveText(
    "A little more accuracy. One more try.",
  );
  await expect(
    page.getByRole("button", { name: "On to the next city" }),
  ).toHaveCount(0);
});

test("mobile hardware automatically uses fairer timing and its own record table", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  await mockMapTiles(context);
  const page = await context.newPage();
  await page.goto(BASE_URL);
  await expect(page.getByTestId("detected-profile")).toHaveText(
    "Mobile touch edition",
  );
  await expect(page.getByTestId("stage-time")).toContainText(
    String(stageRules(FIRST_STAGE, "touch").seconds),
  );
  await expect(page.getByTestId("profile-touch")).toHaveCount(0);
  await page.screenshot({ path: "artifacts/mobile-home.png", fullPage: true });
  await expectNoHorizontalOverflow(page);
  await page.getByTestId("start-journey").click();
  await page.screenshot({ path: "artifacts/mobile-game.png", fullPage: true });
  await expectNoHorizontalOverflow(page);
  await finishJourney(page);
  await expect(page.getByTestId("result-title")).toHaveText(
    "You have arrived!",
  );
  await page.screenshot({
    path: "artifacts/mobile-result.png",
    fullPage: true,
  });
  const saved = await readProgress(page);
  expect(saved.records["touch:DE.berlin"]).toBeTruthy();
  expect(saved.records["keyboard:DE.berlin"]).toBeUndefined();
  // Rehydrate the same save on a physical-keyboard browser: device detection
  // overrides the old preference and touch achievements do not unlock PC stages.
  const desktop = await browser.newContext();
  await mockMapTiles(desktop);
  await desktop.addInitScript(
    ({ key, value }) => localStorage.setItem(key, value),
    { key: PROGRESS_KEY, value: JSON.stringify(saved) },
  );
  const desktopPage = await desktop.newPage();
  await desktopPage.goto(BASE_URL);
  await expect(desktopPage.getByTestId("detected-profile")).toHaveText(
    "PC edition",
  );
  await desktopPage.getByTestId("stage-search").fill("An afternoon in Hamburg");
  await expect(desktopPage.getByTestId("stage-DE.hamburg")).toBeDisabled();
  await desktop.close();
  await context.close();
});

test("country selection and the German interface persist without changing game difficulty", async ({
  page,
}) => {
  await page.goto(BASE_URL);
  await page.getByTestId("country-FR").click();
  await expect(page.getByTestId("country-coming-soon")).toBeVisible();
  await expect(page.getByTestId("start-journey")).toHaveCount(0);
  await page.getByRole("button", { name: "Explore Germany" }).click();
  await page.getByTestId("language-de").click();
  await expect(page.getByTestId("start-journey")).toHaveText("Reise starten");
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await page.reload();
  await expect(page.getByTestId("language-de")).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await page.getByTestId("start-journey").click();
  await expect(page.getByLabel("Bahnhofsname eingeben")).toBeVisible();
  expect(await page.locator("body").innerText()).not.toMatch(/[가-힣]/);
  await finishJourney(page);
  await expect(page.getByTestId("result-title")).toHaveText(
    "Du bist angekommen!",
  );
  await page.screenshot({
    path: "artifacts/german-result.png",
    fullPage: true,
  });
});

test("actual original letters earn a bonus automatically with no mode or helper keys", async ({
  page,
  browser,
}) => {
  await page.goto(BASE_URL);
  await page
    .getByRole("button", { name: "Settings", exact: true })
    .first()
    .click();
  await expect(
    page.getByText("Original letters, automatic rewards", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("original-spelling-toggle")).toHaveCount(0);
  await expect(page.getByTestId("profile-keyboard")).toHaveCount(0);
  await page.screenshot({ path: "artifacts/settings.png", fullPage: true });
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByTestId("start-journey").click();
  await expect(page.getByRole("button", { name: /^[äöüß]$/ })).toHaveCount(0);
  await finishJourney(page, true);
  const originalScore = Number(
    (await page.getByTestId("result-score").innerText()).replace(/\D/g, ""),
  );
  expect(originalScore).toBe(desktopRules.maxScore);
  const simpleContext = await browser.newContext();
  await mockMapTiles(simpleContext);
  const simplePage = await simpleContext.newPage();
  await startJourney(simplePage);
  await finishJourney(simplePage);
  const simpleScore = Number(
    (await simplePage.getByTestId("result-score").innerText()).replace(
      /\D/g,
      "",
    ),
  );
  expect(simpleScore).toBe(desktopRules.baseMaxScore);
  expect(originalScore - simpleScore).toBe(desktopRules.maxOriginalBonus);
  await simpleContext.close();
});

test("bulk fill is rejected and maps show geographic movement, sights and attribution", async ({
  page,
}) => {
  await page.goto(BASE_URL);
  await page
    .getByRole("button", { name: "How to play", exact: true })
    .first()
    .click();
  await expect(
    page.getByText("Different keyboards. A fairer journey."),
  ).toBeVisible();
  await expect(page.getByTestId("replay-tutorial")).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.screenshot({ path: "artifacts/desktop-home.png", fullPage: true });
  await page.getByTestId("start-journey").click();
  await expect(page.getByTestId("map-tile").first()).toBeVisible();
  await expect(
    page.getByText("Data from OpenStreetMap", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("map-loading")).toHaveCount(0);
  await page
    .getByTestId("station-input")
    .fill(normalizeInput(FIRST_STAGE.stations[0]));
  await expect(page.getByTestId("station-input")).toHaveValue("");
  await expect(page.getByTestId("live-score")).toHaveText("0");
  await departOrigin(page);
  const train = page.locator('g[aria-label="Train position"]');
  const before = await train.getAttribute("transform");
  await page
    .getByTestId("station-input")
    .pressSequentially(normalizeInput(FIRST_STAGE.stations[0]).slice(0, 2));
  await expect(train).not.toHaveAttribute("transform", before!);
  await page
    .getByTestId("station-input")
    .pressSequentially(normalizeInput(FIRST_STAGE.stations[0]).slice(2));
  const firstSight = FIRST_STAGE.route.findIndex(
    (stop) => stop.landmarks?.length,
  );
  await typeStations(
    page,
    FIRST_STAGE.stations.slice(1, Math.max(firstSight, 1)),
  );
  const sight = FIRST_STAGE.route[firstSight].landmarks![0];
  await expect(
    page.getByTestId("route-map").getByTestId(`landmark-label-${sight.id}`),
  ).toBeVisible();
  await expect(page.getByTestId(`landmark-label-${sight.id}`)).toContainText(
    sight.name.en,
  );
  await page.screenshot({ path: "artifacts/desktop-game.png", fullPage: true });
});

test("an unavailable map never blocks typing and exposes a retry action", async ({
  context,
  page,
}) => {
  await context.route("https://tiles.openfreemap.org/**", (route) =>
    route.abort(),
  );
  await startJourney(page);
  await expect(page.getByTestId("map-unavailable")).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry map" })).toBeVisible();
  await typeStations(page, FIRST_STAGE.stations.slice(0, 1));
  await expect(page.getByTestId("typing-target")).toHaveText(
    normalizeInput(FIRST_STAGE.stations[1]).replace(/ /g, "␣"),
  );
});
