import type { Page } from "@playwright/test";
import { normalizeInput } from "../../src/game/engine";
import {
  BASE_URL,
  expect,
  expectNoHorizontalOverflow,
  test,
  departOrigin,
} from "./fixtures";

// Consecutive real stops on Potsdam tram 94, retained from the sourced catalog.
const LONG_STATION = "Potsdam, Bahnhof Charlottenhof/Geschwister-Scholl-Straße";
const NORMALIZED = normalizeInput(LONG_STATION);

async function startLongStation(page: Page) {
  await startCustomStop(page, {
    originQuery: "Auf dem Kiewitt",
    originId: "osm-relation-1410937",
    destinationQuery: "Geschwister-Scholl",
    destinationId: "osm-relation-9113182",
    name: LONG_STATION,
  });
}

async function startCustomStop(
  page: Page,
  fixture: {
    originQuery: string;
    originId: string;
    destinationQuery: string;
    destinationId: string;
    name: string;
  },
) {
  await page.goto(BASE_URL);
  await page.getByTestId("custom-builder-toggle").click();
  await page.getByTestId("custom-origin").fill(fixture.originQuery);
  await page.getByTestId(`custom-origin-option-${fixture.originId}`).click();
  await page.getByTestId("custom-destination").fill(fixture.destinationQuery);
  await page
    .getByTestId(`custom-destination-option-${fixture.destinationId}`)
    .click();
  await page.getByTestId("custom-plan").click();
  await expect(page.getByTestId("custom-route-preview")).toContainText(
    fixture.name,
  );
  await page.getByTestId("custom-play").click();
  await departOrigin(page);
  await expect(page.getByTestId("typing-station-name")).toHaveText(
    fixture.name,
  );
  await expect(page.getByTestId("typing-target")).toHaveText(
    normalizeInput(fixture.name).replaceAll(" ", "␣"),
  );
}

async function expectCursorVisible(page: Page) {
  const window = (await page
    .getByTestId("typing-target-window")
    .boundingBox())!;
  await expect
    .poll(async () => {
      const cursor = (await page.getByTestId("typing-cursor").boundingBox())!;
      return (
        cursor.x >= window.x - 1 &&
        cursor.x + cursor.width <= window.x + window.width + 1
      );
    })
    .toBe(true);
  const name = page.getByTestId("typing-station-name");
  expect(
    await name.evaluate(
      (element) => element.scrollHeight <= element.clientHeight + 1,
    ),
  ).toBe(true);
  await expectNoHorizontalOverflow(page);
}

test("a complete long station name remains readable on desktop", async ({
  page,
}) => {
  await startLongStation(page);
  await expectCursorVisible(page);
  await page
    .getByTestId("station-input")
    .pressSequentially(NORMALIZED.slice(0, -1));
  await expectCursorVisible(page);
  await expect(page.getByTestId("station-input")).toBeFocused();
  await page.getByTestId("station-input").pressSequentially(NORMALIZED.at(-1)!);
  await expect(page.getByTestId("result-screen")).toBeVisible();
});

test("real station punctuation and narrow spaces pass through the input hook", async ({
  page,
}) => {
  for (const fixture of [
    {
      originQuery: "Rathaus Lichtenberg",
      originId: "osm-relation-5824744",
      destinationQuery: "S+U Frankfurter Allee",
      destinationId: "osm-relation-7721111",
      name: "Berlin, S+U Frankfurter Allee",
    },
    {
      originQuery: "Linz Hauptbahnhof",
      originId: "osm-relation-1131988",
      destinationQuery: "Polten Hauptbahnhof",
      destinationId: "osm-relation-4862210",
      name: "St.\u202fPölten Hauptbahnhof",
    },
  ]) {
    await startCustomStop(page, fixture);
    await page
      .getByTestId("station-input")
      .pressSequentially(fixture.name.slice(0, -1), { delay: 5 });
    await expect(page.getByTestId("live-accuracy")).toHaveText("100%");
    await expect(page.getByTestId("station-input")).toHaveValue(
      normalizeInput(fixture.name.slice(0, -1)),
    );
    await page
      .getByTestId("station-input")
      .pressSequentially(fixture.name.at(-1)!);
    await expect(page.getByTestId("result-screen")).toBeVisible();
  }
});

test.describe("long station on a touch keyboard", () => {
  test.use({ hasTouch: true, isMobile: true });
  test("the target follows each active section at 320px without hiding the input", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await startLongStation(page);
    await page.getByTestId("station-input").focus();
    await page.setViewportSize({ width: 320, height: 530 });
    await expect(page.getByTestId("route-map")).toHaveCSS("height", "190px");
    await expectCursorVisible(page);
    let cursor = 0;
    for (const end of [16, 34, NORMALIZED.length - 1]) {
      await page
        .getByTestId("station-input")
        .pressSequentially(NORMALIZED.slice(cursor, end), { delay: 5 });
      cursor = end;
      await expectCursorVisible(page);
      await expect(page.getByTestId("typing-cursor")).toHaveText(
        NORMALIZED[cursor] === " " ? "␣" : NORMALIZED[cursor],
      );
    }
    const input = (await page.getByTestId("station-input").boundingBox())!;
    expect(input.y + input.height).toBeLessThanOrEqual(530);
    await expect(page.getByTestId("station-input")).toBeFocused();
    await page.screenshot({
      path: "artifacts/long-station-mobile.png",
      fullPage: true,
    });
    await page
      .getByTestId("station-input")
      .pressSequentially(NORMALIZED.at(-1)!);
    await expect(page.getByTestId("result-screen")).toBeVisible();
  });
});
