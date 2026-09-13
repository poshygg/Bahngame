import { type Page } from "@playwright/test";
import { STAGES } from "../../src/data/stages";
import { normalizeInput } from "../../src/game/engine";
import {
  BASE_URL,
  expect,
  expectNoHorizontalOverflow,
  mockMapTiles,
  test,
} from "./fixtures";

const cards = (page: Page) =>
  page.getByTestId("chapter-list").locator('[data-testid^="stage-"]');
const cardIds = (page: Page) =>
  cards(page).evaluateAll((items) =>
    items.map((item) => item.getAttribute("data-testid")),
  );
const ranks = async (page: Page) => {
  await expect(cards(page).first()).toBeVisible();
  return (await cards(page).allTextContents()).map((text) => {
    const labels = [
      "Beginner",
      "Easy",
      "Intermediate",
      "Advanced",
      "Challenge",
    ];
    const rank = labels.findIndex((label) => text.includes(`· ${label} ·`));
    expect(rank).toBeGreaterThanOrEqual(0);
    return rank;
  });
};

test("actual Germany SVG renders all 16 states and map selection filters chapters", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(BASE_URL);
  const map = page.getByTestId("germany-region-map");
  await expect(map).toBeVisible();
  await expect(map.locator('[data-testid^="region-map-"]')).toHaveCount(16);
  // React Native Web must not replace SVG groups with invalid HTML buttons.
  await expect(map.locator("svg button")).toHaveCount(0);
  const bavaria = page.getByTestId("region-map-DE-BY");
  const shape = await bavaria.boundingBox();
  expect(shape!.width).toBeGreaterThan(60);
  expect(shape!.height).toBeGreaterThan(60);
  // The visible badge sits over the boundary and has the same region action.
  await map.getByText("BY", { exact: true }).click();
  await expect(page.getByTestId("chapter-result-count")).toContainText(
    "Bavaria",
  );
  expect(await cards(page).count()).toBeGreaterThan(0);
  await expect(bavaria.locator("path").first()).toHaveAttribute(
    "fill",
    "#0075DE",
  );
  await page.getByTestId("region-filter-toggle").click();
  await expect(page.locator('[data-testid^="region-filter-DE-"]')).toHaveCount(
    16,
  );
  for (const id of [
    "BB",
    "BE",
    "BW",
    "BY",
    "HB",
    "HE",
    "HH",
    "MV",
    "NI",
    "NW",
    "RP",
    "SH",
    "SL",
    "SN",
    "ST",
    "TH",
  ]) {
    await page.getByTestId(`region-filter-DE-${id}`).click();
    expect(await cards(page).count()).toBeGreaterThan(0);
    expect(await cards(page).count()).toBeLessThanOrEqual(6);
  }
  await page.getByTestId("region-filter-toggle").click();
  await page.getByTestId("region-all").click();
  await page
    .getByTestId("germany-browser")
    .evaluate((element) => element.scrollIntoView({ block: "start" }));
  await page.screenshot({ path: "artifacts/germany-explorer-desktop.png" });
  expect(errors).toEqual([]);
});

test("region translations, city aliases and RE9 service search work in English and German", async ({
  page,
}) => {
  await page.goto(BASE_URL);
  const search = page.getByTestId("stage-search");
  await search.fill("Bavaria");
  const englishIds = await cardIds(page);
  expect(englishIds.length).toBeGreaterThan(0);
  await search.fill("Bayern");
  expect(await cardIds(page)).toEqual(englishIds);
  await search.fill("München");
  const cityIds = await cardIds(page);
  expect(cityIds.length).toBeGreaterThan(0);
  await search.fill("Muenchen");
  expect(await cardIds(page)).toEqual(cityIds);
  await search.fill("RE9");
  expect(await cards(page).count()).toBeGreaterThan(0);
  for (const text of await cards(page).allTextContents())
    expect(text.replace(/\s/g, "")).toContain("RE9");
  await expect(page.getByTestId("chapter-list")).not.toContainText(
    /DE-[A-Z]{2}\.osm-/,
  );
  await page.getByTestId("language-de").click();
  await expect(page.getByTestId("sort-easiest")).toHaveText("Leicht zuerst");
  await search.fill("Bayern");
  expect(await cardIds(page)).toEqual(englishIds);
  await expect(page.getByTestId("chapter-result-count")).toContainText(
    "Kapitel",
  );
});

test("difficulty sorting and pagination retain chapter lock states and selected journey", async ({
  page,
}) => {
  await page.goto(BASE_URL);
  const ascending = await ranks(page);
  expect(ascending).toEqual([...ascending].sort((a, b) => a - b));
  const firstPage = await cardIds(page);
  await page.getByTestId("chapter-page-next").click();
  expect(await cardIds(page)).not.toEqual(firstPage);
  expect(await cards(page).count()).toBeLessThanOrEqual(6);
  await page.getByTestId("sort-hardest").click();
  const descending = await ranks(page);
  expect(descending).toEqual([...descending].sort((a, b) => b - a));
  expect(descending[0]).toBeGreaterThan(ascending[0]);
  await expect(page.getByTestId("chapter-page-previous")).toBeDisabled();
  await page.getByTestId("stage-search").fill("RE9");
  await page.getByTestId("sort-easiest").click();
  await expect(cards(page).first()).toBeVisible();
  const campaignId = STAGES.find(
    (stage) =>
      stage.journeyKind === "regional" &&
      stage.chapter === 1 &&
      (stage.chapters ?? 1) > 1,
  )!.campaignId!;
  await page.getByTestId("stage-search").fill(campaignId);
  const firstChapter = cards(page).filter({ hasText: "Chapter 1/" }).first();
  const secondChapter = cards(page).filter({ hasText: "Chapter 2/" }).first();
  await expect(firstChapter).toBeEnabled();
  await expect(secondChapter).toBeDisabled();
  const text = await firstChapter.innerText();
  const selectedId = (await firstChapter.getAttribute("data-testid"))!.replace(
    /^stage-/,
    "",
  );
  const selectedStage = STAGES.find((stage) => stage.id === selectedId)!;
  const title = text.split("\n").find((line) => /· Chapter 1$/.test(line))!;
  expect(title).toBeTruthy();
  await firstChapter.click();
  await expect(firstChapter).toHaveAttribute("aria-pressed", "true");
  await page.getByTestId("start-journey").click();
  await expect(page.getByTestId("station-input")).toBeVisible();
  await expect(
    page.getByTestId("game-screen").getByText(title, { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("typing-target")).toHaveText(
    normalizeInput(selectedStage.stations[0]).replace(/ /g, "␣"),
  );
});

test("city networks and long-distance categories show clear localized areas and reset all filters", async ({
  page,
}) => {
  await page.goto(BASE_URL);
  await page.getByTestId("journey-kind-city").click();
  await expect(page.getByTestId("city-networks")).toBeVisible();
  await page.getByTestId("city-network-munich").click();
  await expect(page.getByTestId("city-network-munich")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  for (const area of await page
    .locator('[data-testid^="chapter-area-"]')
    .allTextContents())
    expect(area).toBe("Munich");
  for (const id of await cardIds(page))
    expect(STAGES.find((stage) => `stage-${stage.id}` === id)?.networkId).toBe(
      "munich",
    );
  await expect(
    page
      .getByTestId("germany-region-map")
      .locator('[data-testid^="region-map-"]'),
  ).toHaveCount(16);
  await page.getByTestId("language-de").click();
  await expect(page.getByTestId("journey-kind-city")).toHaveText("Stadtnetze");
  await expect(page.getByTestId("city-network-munich")).toHaveText("München");
  for (const area of await page
    .locator('[data-testid^="chapter-area-"]')
    .allTextContents())
    expect(area).toBe("München");
  await page.getByTestId("clear-stage-search").click();
  await expect(page.getByTestId("journey-kind-all")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByTestId("city-networks")).toHaveCount(0);
  await page.getByTestId("journey-kind-longDistance").click();
  await expect(cards(page).first()).toBeVisible();
  for (const id of await cardIds(page))
    expect(
      STAGES.find((stage) => `stage-${stage.id}` === id)?.journeyKind,
    ).toBe("longDistance");
});

test("state journeys show whole-route endpoints and start the selected state-contained chapter", async ({
  page,
}) => {
  await page.goto(BASE_URL);
  await page.getByTestId("journey-kind-regional").click();
  await page
    .getByTestId("germany-region-map")
    .getByText("BE", { exact: true })
    .click();
  await expect(page.getByTestId("chapter-empty")).toContainText("City-states");
  await page.getByTestId("empty-city-networks").click();
  await expect(page.getByTestId("city-network-berlin")).toBeVisible();
  await page.getByTestId("journey-kind-regional").click();
  await page
    .getByTestId("germany-region-map")
    .getByText("BY", { exact: true })
    .click();
  await expect(cards(page).first()).toBeVisible();
  for (const id of await cardIds(page)) {
    const stage = STAGES.find((stage) => `stage-${stage.id}` === id)!;
    expect(stage.journeyKind).toBe("regional");
    expect(stage.regionIds).toEqual(["DE-BY"]);
    await expect(page.getByTestId(`chapter-area-${stage.id}`)).toHaveText(
      "Bavaria",
    );
    await expect(
      page.getByTestId(`chapter-campaign-${stage.id}`),
    ).toContainText(stage.campaignOrigin!);
    await expect(
      page.getByTestId(`chapter-campaign-${stage.id}`),
    ).toContainText(stage.campaignDestination!);
  }
  const first = cards(page).filter({ hasText: "Chapter 1/" }).first();
  const id = (await first.getAttribute("data-testid"))!.replace(/^stage-/, "");
  const chosen = STAGES.find((stage) => stage.id === id)!;
  await first.click();
  await page.getByTestId("start-journey").click();
  await expect(page.getByTestId("typing-target")).toHaveText(
    normalizeInput(chosen.stations[0]).replace(/ /g, "␣"),
  );
});

test("mobile national map, search and chapter list fit a narrow touch viewport", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 1,
  });
  await mockMapTiles(context);
  const page = await context.newPage();
  try {
    await page.goto(BASE_URL);
    await expect(page.getByTestId("detected-profile")).toHaveText(
      "Mobile touch edition",
    );
    const map = page.getByTestId("germany-region-map");
    await map.scrollIntoViewIfNeeded();
    expect(
      (await page.getByTestId("region-map-DE-BY").boundingBox())!.width,
    ).toBeGreaterThan(60);
    await expectNoHorizontalOverflow(page);
    await map.screenshot({ path: "artifacts/germany-state-map-mobile.png" });
    await page.getByTestId("region-filter-toggle").click();
    await page.getByTestId("region-filter-DE-NW").click();
    await page.getByTestId("region-filter-toggle").click();
    await page.getByTestId("stage-search").fill("RE9");
    await expect(page.getByTestId("chapter-result-count")).toContainText(
      "North Rhine-Westphalia",
    );
    expect(await cards(page).count()).toBeGreaterThan(0);
    await expectNoHorizontalOverflow(page);
    await page
      .getByTestId("stage-search")
      .evaluate((element) => element.scrollIntoView({ block: "start" }));
    await page.screenshot({ path: "artifacts/germany-explorer-mobile.png" });
    await page.getByTestId("custom-builder-toggle").click();
    await expectNoHorizontalOverflow(page);
    await page.getByTestId("clear-stage-search").click();
    await page.getByTestId("journey-kind-city").click();
    await page.getByTestId("city-network-munich").click();
    await expectNoHorizontalOverflow(page);
    await page
      .getByTestId("journey-kinds")
      .evaluate((element) => element.scrollIntoView({ block: "start" }));
    await page.screenshot({ path: "artifacts/germany-categories-mobile.png" });
  } finally {
    await context.close();
  }
});
