import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  test as base,
  expect,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { STAGES } from "../../src/data/stages";
import { normalizeInput } from "../../src/game/engine";

export const FIRST_STAGE = STAGES[0];
export const BASE_URL = "http://127.0.0.1:4173";
export const PROGRESS_KEY = "bahnreise.progress.v1";

// Tests verify the map interface without generating automated traffic to OSM.
const tile = readFileSync(resolve("tests/fixtures/calm-map.pbf"));
export async function mockMapTiles(context: BrowserContext) {
  await context.route("https://tiles.openfreemap.org/**", (route) => {
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
      body: tile,
    });
  });
}

export const test = base.extend({
  context: async ({ context }, use) => {
    await mockMapTiles(context);
    await use(context);
  },
});
export { expect };

export async function startJourney(page: Page) {
  await page.goto(BASE_URL);
  await page.getByTestId("start-journey").click();
  await expect(page.getByTestId("station-input")).toBeVisible();
}

export async function typeStations(
  page: Page,
  stations: string[],
  original = false,
) {
  // Callers may request a destination slice; depart from the displayed origin
  // first when the game still requires it. Origin behavior has its own test.
  if (stations.length && (await page.getByTestId("origin-typing").count())) {
    const origin = await page.getByTestId("typing-station-name").innerText();
    if (stations[0] !== origin)
      await page
        .getByTestId("station-input")
        .pressSequentially(original ? origin : normalizeInput(origin), {
          delay: 10,
        });
  }
  for (const station of stations) {
    await expect(page.getByTestId("typing-target")).toHaveText(
      normalizeInput(station).replace(/ /g, "␣"),
    );
    await page
      .getByTestId("station-input")
      .pressSequentially(original ? station : normalizeInput(station), {
        delay: 10,
      });
  }
}

export async function departOrigin(page: Page) {
  if (await page.getByTestId("origin-typing").count()) {
    const origin = await page.getByTestId("typing-station-name").innerText();
    await typeStations(page, [origin]);
  }
}

export async function finishJourney(page: Page, original = false) {
  await typeStations(page, FIRST_STAGE.stations, original);
  await expect(page.getByTestId("result-screen")).toBeVisible();
}

export async function readProgress(page: Page) {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "{}"),
    PROGRESS_KEY,
  );
}

export async function expectNoHorizontalOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}
