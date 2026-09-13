import {
  expect,
  FIRST_STAGE,
  startJourney,
  test,
  typeStations,
  expectNoHorizontalOverflow,
} from "./fixtures";

test("desktop journey gives the map most of the screen and keeps typing compact", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await startJourney(page);
  const map = await page.getByTestId("route-map").boundingBox();
  const console = await page.getByTestId("typing-console").boundingBox();
  const input = await page.getByTestId("station-input").boundingBox();
  expect(map!.width).toBeGreaterThan(1250);
  expect(map!.height).toBeGreaterThanOrEqual(500);
  expect(console!.height).toBeLessThanOrEqual(180);
  expect(map!.height).toBeGreaterThan(console!.height * 2.5);
  expect(input!.y + input!.height).toBeLessThan(1000);
  await expect(page.getByTestId("journey-stops")).toHaveCount(0);
  await page.getByTestId("journey-stops-toggle").click();
  await expect(page.getByTestId("journey-stops")).toBeVisible();
  await expect(page.getByTestId("journey-stops")).toContainText(
    FIRST_STAGE.stations.at(-1)!,
  );
  const after = await page.getByTestId("route-map").boundingBox();
  expect(after!.width).toBe(map!.width);
  await page.getByTestId("journey-stops-toggle").click();
  await page.getByTestId("game-screen").evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.screenshot({
    path: "artifacts/map-first-desktop.png",
    fullPage: true,
  });
});

test("mobile keeps a large map above the console, including when the keyboard opens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startJourney(page);
  const map = page.getByTestId("route-map");
  expect((await map.boundingBox())!.height).toBeGreaterThanOrEqual(280);
  expect(
    (await page.getByTestId("typing-console").boundingBox())!.height,
  ).toBeLessThanOrEqual(190);
  await page.getByTestId("station-input").focus();
  await page.setViewportSize({ width: 390, height: 530 });
  await expect(map).toHaveCSS("height", "190px");
  const input = await page.getByTestId("station-input").boundingBox();
  expect(input!.y + input!.height).toBeLessThanOrEqual(530);
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    path: "artifacts/map-first-mobile.png",
    fullPage: true,
  });
});

test("final input freezes scoring but results wait until the train visibly arrives", async ({
  page,
}) => {
  await page.clock.install();
  await startJourney(page);
  await typeStations(page, FIRST_STAGE.stations);
  await expect(page.getByTestId("arrival-transition")).toBeVisible();
  await expect(page.getByTestId("station-input")).not.toBeEditable();
  await expect(page.getByTestId("route-map")).toBeVisible();
  await expect(page.getByTestId("result-screen")).toHaveCount(0);
  const score = (await page.getByTestId("live-score").innerText()).replace(
    /\D/g,
    "",
  );
  await page.clock.runFor(15000);
  await expect(page.getByTestId("result-screen")).toBeVisible();
  expect(
    (await page.getByTestId("result-score").innerText()).replace(/\D/g, ""),
  ).toBe(score);
});
