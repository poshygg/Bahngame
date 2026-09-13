import { TUTORIAL_STAGE } from "../../src/features/tutorial/tutorialStage";
import { normalizeInput } from "../../src/game/engine";
import { test, expect, BASE_URL, typeStations, readProgress } from "./fixtures";

test("guided tutorial teaches recovery and original rewards without clock or records", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto(BASE_URL);
  await page.getByTestId("start-tutorial").click();
  await expect(page.getByTestId("tutorial-screen")).toBeVisible();
  await expect(page.getByTestId("station-input")).toHaveCount(0);
  await page.getByTestId("tutorial-begin").click();
  await page.getByTestId("station-input").pressSequentially("!");
  await expect(page.getByTestId("tutorial-recovery")).toBeVisible();
  await expect(page.getByTestId("station-input")).toHaveValue("");
  await page.clock.fastForward(600000);
  await expect(page.getByTestId("station-input")).toBeEditable();
  await expect(page.getByTestId("live-time")).toHaveCount(0);
  await typeStations(page, TUTORIAL_STAGE.stations.slice(0, 1));
  const last = TUTORIAL_STAGE.stations[1];
  const sharp = last.indexOf("ß");
  expect(sharp).toBeGreaterThanOrEqual(0);
  await page
    .getByTestId("station-input")
    .pressSequentially(normalizeInput(last.slice(0, sharp)));
  await page.getByTestId("station-input").pressSequentially("ß");
  await expect(page.getByTestId("live-original-bonus")).toContainText("1");
  await page
    .getByTestId("station-input")
    .pressSequentially(normalizeInput(last.slice(sharp + 1)));
  await expect(page.getByTestId("tutorial-complete")).toBeVisible();
  await page.screenshot({
    path: "artifacts/tutorial-complete.png",
    fullPage: true,
  });
  await page.getByTestId("tutorial-finish").click();
  await expect(page.getByTestId("tutorial-banner")).toHaveCount(0);
  await page.getByTestId("stage-search").fill("An afternoon in Hamburg");
  await expect(page.getByTestId("stage-DE.hamburg")).toBeDisabled();
  await expect
    .poll(async () => (await readProgress(page)).tutorialCompleted)
    .toBe(true);
  expect((await readProgress(page)).records).toEqual({});
  await page.reload();
  await expect(page.getByTestId("tutorial-banner")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Settings", exact: true })
    .first()
    .click();
  await page.getByTestId("replay-tutorial").click();
  await expect(page.getByTestId("tutorial-begin")).toBeVisible();
});

test("tutorial remains optional and simplified input can complete it", async ({
  page,
}) => {
  await page.goto(BASE_URL);
  await page.getByTestId("start-tutorial").click();
  await page.getByTestId("tutorial-begin").click();
  await typeStations(page, TUTORIAL_STAGE.stations);
  await expect(page.getByTestId("tutorial-complete")).toBeVisible();
  await page.getByTestId("tutorial-finish").click();
  await page.getByTestId("start-journey").click();
  await expect(page.getByTestId("station-input")).toBeVisible();
});
