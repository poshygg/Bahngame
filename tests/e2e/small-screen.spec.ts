import { normalizeInput } from "../../src/game/engine";
import {
  test,
  expect,
  BASE_URL,
  FIRST_STAGE,
  mockMapTiles,
  expectNoHorizontalOverflow,
} from "./fixtures";

test("320px touch screen supports German settings and native accent input without clipping", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 320, height: 740 },
    isMobile: true,
    hasTouch: true,
  });
  await mockMapTiles(context);
  const page = await context.newPage();
  await page.goto(BASE_URL);
  await page
    .getByRole("button", { name: "Settings", exact: true })
    .first()
    .click();
  await page.getByTestId("language-de").last().click();
  await expect(page.getByTestId("original-spelling-toggle")).toHaveCount(0);
  await page.screenshot({ path: "artifacts/mobile-settings-de.png" });
  await page.getByRole("button", { name: "Schließen", exact: true }).click();
  await page.getByTestId("start-journey").click();
  const first = normalizeInput(FIRST_STAGE.origin);
  await page.getByTestId("station-input").pressSequentially(first.slice(0, 3));
  await expect(page.getByTestId("station-input")).toHaveValue(
    first.slice(0, 3),
  );
  const bounds = await page.getByTestId("station-input").boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
  await expectNoHorizontalOverflow(page);
  await expect(page.getByRole("button", { name: /^[äöüß]$/ })).toHaveCount(0);
  await page.screenshot({ path: "artifacts/mobile-original-de.png" });
  await context.close();
});
