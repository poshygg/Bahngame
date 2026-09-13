import type { Page } from "@playwright/test";
import {
  BASE_URL,
  expect,
  expectNoHorizontalOverflow,
  readProgress,
  test,
} from "./fixtures";

async function openBuilder(page: Page) {
  await page.goto(BASE_URL);
  await page.getByTestId("custom-builder-toggle").click();
  await expect(page.getByTestId("custom-route-builder")).toBeVisible();
}

async function endpoints(page: Page) {
  return {
    origin: await page.getByTestId("custom-origin").inputValue(),
    destination: await page.getByTestId("custom-destination").inputValue(),
  };
}

test("ICE and RE9 examples show connected service legs and real station names", async ({
  page,
}) => {
  await openBuilder(page);
  for (const service of ["ICE", "RE"]) {
    const example = page.getByTestId(`custom-example-${service}`);
    await expect(example).toContainText(service === "RE" ? /RE\s?9/ : "ICE");
    await example.click();
    const pair = await endpoints(page);
    expect(pair.origin.length).toBeGreaterThan(2);
    expect(pair.destination).not.toBe(pair.origin);
    const preview = page.getByTestId("custom-route-preview");
    await expect(preview).toContainText(`${pair.origin} → ${pair.destination}`);
    await expect(preview).toContainText("destination stops");
    await expect(preview.getByTestId("custom-route-leg").first()).toBeVisible();
    await expect(preview.getByTestId("custom-route-leg").first()).toContainText(
      pair.origin,
    );
    await expect(preview.getByTestId("custom-route-leg").last()).toContainText(
      pair.destination,
    );
    await expect(preview.getByRole("link").first()).toBeVisible();
    await expect(page.getByTestId("custom-play")).toBeEnabled();
  }
  await page.screenshot({
    path: "artifacts/custom-route-preview.png",
    fullPage: true,
  });
});

test("saved custom journey plays, restores its personal best and leaves campaigns locked", async ({
  page,
}) => {
  await openBuilder(page);
  await page.getByTestId("custom-example-ICE").click();
  const pair = await endpoints(page);
  await page.getByTestId("custom-play").click();
  await expect(page.getByTestId("game-screen")).toBeVisible();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("bahnreise.custom-journeys.v1") ?? "[]"),
  );
  expect(saved).toHaveLength(1);

  // Follow the displayed route, so a newer source snapshot may add or reorder
  // genuine stops without changing this user-flow test into a catalog fixture.
  for (let count = 0; count < 60; count++) {
    const input = page.getByTestId("station-input");
    if (
      !(await input.count()) ||
      (await input.getAttribute("readonly")) !== null
    )
      break;
    const target = (
      await page.getByTestId("typing-target").innerText()
    ).replaceAll("␣", " ");
    expect(target.length).toBeGreaterThan(0);
    await input.pressSequentially(target, { delay: 2 });
  }
  await expect(page.getByTestId("result-screen")).toBeVisible({
    timeout: 20000,
  });
  const stored = await readProgress(page);
  const keys = Object.keys(stored.records);
  expect(keys).toHaveLength(1);
  expect(keys[0]).toMatch(/^keyboard:custom:/);
  expect(stored.records[keys[0]].stars).toBeGreaterThan(0);
  expect(stored.unlockedRoutes).toEqual([]);
  const score = stored.records[keys[0]].score;

  await page.reload();
  await page.getByTestId("custom-builder-toggle").click();
  const savedRoutes = page.getByTestId("saved-custom-routes");
  await expect(savedRoutes).toContainText(
    `${pair.origin} → ${pair.destination}`,
  );
  await savedRoutes
    .getByRole("button", {
      name: `${pair.origin} → ${pair.destination}`,
      exact: true,
    })
    .click();
  await expect(page.getByTestId("custom-personal-best")).toContainText(
    score.toLocaleString("en-US"),
  );
  expect((await readProgress(page)).unlockedRoutes).toEqual([]);
});

test("selecting the same departure and arrival reports a useful error", async ({
  page,
}) => {
  await openBuilder(page);
  await page.getByTestId("custom-origin").fill("Mainz");
  const option = page.locator('[data-testid^="custom-origin-option-"]').first();
  await expect(option).toBeVisible();
  const stationId = (await option.getAttribute("data-testid"))!.replace(
    "custom-origin-option-",
    "",
  );
  await option.click();
  const origin = await page.getByTestId("custom-origin").inputValue();
  await page.getByTestId("custom-destination").fill(origin);
  await page.getByTestId(`custom-destination-option-${stationId}`).click();
  await page.getByTestId("custom-plan").click();
  await expect(page.getByTestId("custom-route-error")).toHaveText(
    "Choose different departure and arrival stations.",
  );
  await expect(page.getByTestId("custom-route-preview")).toHaveCount(0);
  await expect(page.getByTestId("custom-play")).toHaveCount(0);
});

test("swapping endpoints and editing a query invalidate the previous plan on a small screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openBuilder(page);
  await page.getByTestId("custom-example-ICE").click();
  const pair = await endpoints(page);
  await page.getByTestId("custom-swap").click();
  await expect(page.getByTestId("custom-origin")).toHaveValue(pair.destination);
  await expect(page.getByTestId("custom-destination")).toHaveValue(pair.origin);
  await expect(page.getByTestId("custom-route-preview")).toHaveCount(0);
  await page.getByTestId("custom-plan").click();
  await expect(page.getByTestId("custom-route-preview")).toContainText(
    `${pair.destination} → ${pair.origin}`,
  );
  await expectNoHorizontalOverflow(page);
  await page.getByTestId("custom-origin").fill("A station I have not selected");
  await expect(page.getByTestId("custom-route-preview")).toHaveCount(0);
  await expect(page.getByTestId("custom-play")).toHaveCount(0);
  await expect(page.getByTestId("custom-plan")).toBeDisabled();
  await expect(page.getByTestId("custom-origin-suggestions")).toContainText(
    "No station found",
  );
  await expectNoHorizontalOverflow(page);
});
