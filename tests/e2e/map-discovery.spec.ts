import { normalizeInput } from "../../src/game/engine";
import {
  BASE_URL,
  FIRST_STAGE,
  expect,
  expectNoHorizontalOverflow,
  startJourney,
  test,
  typeStations,
  departOrigin,
} from "./fixtures";

test("map reveals the following full station name before input and advances ahead of the train", async ({
  page,
}) => {
  await startJourney(page);
  await departOrigin(page);
  const map = page.getByTestId("route-map");
  const current = map.getByTestId("map-current-station");
  const next = map.getByTestId("map-next-station");
  await expect(current).toHaveText(FIRST_STAGE.stations[0]);
  await expect(next).toHaveText(FIRST_STAGE.stations[1]);
  await expect(next).toBeVisible();
  const first = normalizeInput(FIRST_STAGE.stations[0]);
  await page.getByTestId("station-input").pressSequentially(first.slice(0, 2));
  await expect(next).toHaveText(FIRST_STAGE.stations[1]);
  await page.getByTestId("station-input").pressSequentially(first.slice(2));
  await expect(current).toHaveText(FIRST_STAGE.stations[1]);
  await expect(next).toHaveText(FIRST_STAGE.stations[2]);
  await typeStations(page, FIRST_STAGE.stations.slice(1, 3));
  await expect(current).toHaveText("Bellevue");
  await expect(next).toHaveText("Berlin Hauptbahnhof");
  await page.screenshot({
    path: "artifacts/map-read-ahead-desktop.png",
    fullPage: true,
  });
});

test("read-ahead names stay inside a keyboard-sized map without abbreviating", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await startJourney(page);
  await page.getByTestId("station-input").focus();
  await page.setViewportSize({ width: 320, height: 530 });
  await typeStations(page, FIRST_STAGE.stations.slice(0, 3));
  const map = page.getByTestId("route-map");
  await expect(map).toHaveCSS("height", "190px");
  await expect(map.getByTestId("map-next-station")).toHaveText(
    "Berlin Hauptbahnhof",
  );
  const bounds = (await map.boundingBox())!;
  for (const id of ["map-current-station", "map-next-station"]) {
    const label = map.getByTestId(id);
    await expect(label).toBeVisible();
    const box = (await label.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(bounds.x);
    expect(box.x + box.width).toBeLessThanOrEqual(bounds.x + bounds.width + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(bounds.y + bounds.height);
    expect(
      await label.evaluate(
        (element) => element.scrollHeight <= element.clientHeight + 1,
      ),
    ).toBe(true);
  }
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    path: "artifacts/map-read-ahead-mobile.png",
    fullPage: true,
  });
});

test("named landmarks reveal their information inside the map without stealing typing focus", async ({
  page,
}) => {
  await startJourney(page);
  await departOrigin(page);
  await page.getByTestId("map-view-toggle").click();
  const map = page.getByTestId("route-map");
  const landmark = map.getByTestId("landmark-label-berlin-victory");
  await expect(landmark).toBeVisible();
  await expect(landmark).toContainText("Victory Column");
  await expect(map.getByTestId("landmark-icon-berlin-victory")).toBeVisible();
  await page.getByTestId("station-input").focus();
  await landmark.click();
  await expect(map.getByTestId("map-landmark-name")).toHaveText(
    "Victory Column",
  );
  await expect(map.getByTestId("map-landmark-description")).toContainText(
    "golden figure",
  );
  await expect(page.getByTestId("station-input")).toBeFocused();
  await page.keyboard.type("sa");
  await expect(page.getByTestId("station-input")).toHaveValue("sa");
  await expect(page.getByTestId("landmark-card")).toHaveCount(0);
  await page.screenshot({
    path: "artifacts/map-landmarks-desktop.png",
    fullPage: true,
  });
});

test("German map landmark names and descriptions follow the interface language", async ({
  page,
}) => {
  await page.goto(BASE_URL);
  await page.getByTestId("language-de").click();
  await page.getByTestId("start-journey").click();
  await departOrigin(page);
  await page.getByTestId("map-view-toggle").click();
  const map = page.getByTestId("route-map");
  await map.getByTestId("landmark-label-berlin-victory").click();
  await expect(map.getByTestId("map-landmark-name")).toHaveText("Siegessäule");
  await expect(map.getByTestId("map-landmark-description")).toContainText(
    "goldene Figur",
  );
  await expect(map.getByTestId("map-current-station")).toHaveText(
    "Savignyplatz",
  );
  await expect(map.getByTestId("map-next-station")).toHaveText(
    "Zoologischer Garten",
  );
});
