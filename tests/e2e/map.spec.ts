import {
  expect,
  FIRST_STAGE,
  startJourney,
  test,
  departOrigin,
} from "./fixtures";
import { normalizeInput } from "../../src/game/engine";

test("typing and clock ticks do not restart visible map tile downloads", async ({
  page,
}) => {
  let tileRequests = 0;
  page.on("request", (request) => {
    if (request.url().startsWith("https://tiles.openfreemap.org/"))
      tileRequests++;
  });
  await startJourney(page);
  await departOrigin(page);
  await page.waitForLoadState("networkidle");
  const beforeTyping = tileRequests;
  expect(beforeTyping).toBeGreaterThan(0);
  await page
    .getByTestId("station-input")
    .pressSequentially(normalizeInput(FIRST_STAGE.stations[0]).slice(0, 3), {
      delay: 60,
    });
  await page.waitForTimeout(600);
  expect(tileRequests).toBe(beforeTyping);
});

test("a keyboard-sized mobile viewport keeps a 190px map and moving train visible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startJourney(page);
  await departOrigin(page);
  await page.getByTestId("station-input").focus();
  await page.setViewportSize({ width: 390, height: 530 });
  const map = page.getByTestId("route-map");
  await expect(map).toHaveCSS("height", "190px");
  await expect(map.getByText("Data from OpenStreetMap")).toBeVisible();
  await expect(map.getByRole("button", { name: "Zoom in" })).toHaveCount(0);
  const train = map.locator('g[aria-label="Train position"]');
  const before = await train.getAttribute("transform");
  await page
    .getByTestId("station-input")
    .pressSequentially(normalizeInput(FIRST_STAGE.stations[0]).slice(0, 3));
  await expect(train).not.toHaveAttribute("transform", before!);
  await page.screenshot({
    path: "artifacts/mobile-mini-map.png",
    fullPage: true,
  });
});

test("completing a station arrives visibly without snapping the train or skipping the stop", async ({
  page,
}) => {
  await startJourney(page);
  await departOrigin(page);
  const first = normalizeInput(FIRST_STAGE.stations[0]);
  await page
    .getByTestId("station-input")
    .pressSequentially(first.slice(0, -1), { delay: 25 });
  await page.waitForTimeout(350);
  await page.evaluate(() => {
    const samples: {
      x: number;
      y: number;
      stationDistance: number;
      time: number;
    }[] = [];
    (window as any).__trainFrames = samples;
    const begin = performance.now();
    const capture = () => {
      const train = document.querySelector('g[aria-label="Train position"]');
      const station = document.querySelector(
        '[data-testid="map-stop-1"] circle:last-child',
      );
      const match = train
        ?.getAttribute("transform")
        ?.match(/translate\(([-\d.]+),([-\d.]+)\)/);
      if (match && station) {
        const x = Number(match[1]);
        const y = Number(match[2]);
        samples.push({
          x,
          y,
          stationDistance: Math.hypot(
            x - Number(station.getAttribute("cx")),
            y - Number(station.getAttribute("cy")),
          ),
          time: performance.now() - begin,
        });
      }
      if (performance.now() - begin < 1400) requestAnimationFrame(capture);
    };
    requestAnimationFrame(capture);
  });
  await page.getByTestId("station-input").pressSequentially(first.slice(-1));
  await page
    .getByTestId("station-input")
    .pressSequentially(normalizeInput(FIRST_STAGE.stations[1]).slice(0, 3), {
      delay: 25,
    });
  await page.waitForTimeout(1450);
  const frames = await page.evaluate(
    () =>
      (window as any).__trainFrames as {
        x: number;
        y: number;
        stationDistance: number;
        time: number;
      }[],
  );
  expect(frames.length).toBeGreaterThan(12);
  const arrived = frames.filter((frame) => frame.stationDistance < 1);
  expect(arrived.length).toBeGreaterThan(2);
  expect(arrived[arrived.length - 1].time - arrived[0].time).toBeGreaterThan(
    100,
  );
  const largestFrameMove = Math.max(
    ...frames
      .slice(1)
      .map((frame, index) =>
        Math.hypot(frame.x - frames[index].x, frame.y - frames[index].y),
      ),
  );
  expect(largestFrameMove).toBeLessThan(80);
  await page.screenshot({
    path: "artifacts/station-handoff.png",
    fullPage: true,
  });
});
