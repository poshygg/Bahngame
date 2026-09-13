import { normalizeInput } from "../../src/game/engine";
import {
  test,
  expect,
  FIRST_STAGE,
  startJourney,
  typeStations,
} from "./fixtures";

test("origin is the first target and the train departs only when destination typing begins", async ({
  page,
}) => {
  await page.clock.install();
  await startJourney(page);
  await expect(page.getByTestId("map-current-station")).toHaveText(
    FIRST_STAGE.origin,
  );
  await expect(page.getByTestId("map-next-station")).toHaveText(
    FIRST_STAGE.stations[0],
  );
  const train = page.getByTestId("train-marker");
  const initial = await train.getAttribute("transform");
  await page
    .getByTestId("station-input")
    .pressSequentially(normalizeInput(FIRST_STAGE.origin).slice(0, -1));
  await page.clock.runFor(500);
  await expect(train).toHaveAttribute("transform", initial!);
  await page
    .getByTestId("station-input")
    .pressSequentially(normalizeInput(FIRST_STAGE.origin).at(-1)!);
  await expect(page.getByTestId("map-current-station")).toHaveText(
    FIRST_STAGE.stations[0],
  );
  await page.clock.runFor(500);
  await expect(train).toHaveAttribute("transform", initial!);
  await page
    .getByTestId("station-input")
    .pressSequentially(normalizeInput(FIRST_STAGE.stations[0]).slice(0, 2));
  await page.clock.runFor(1000);
  await expect(train).not.toHaveAttribute("transform", initial!);
});
