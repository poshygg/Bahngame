import { test, expect, BASE_URL, expectNoHorizontalOverflow } from "./fixtures";

test("passport displays city and combination criteria on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE_URL);
  await page.getByRole("button", { name: "Achievements", exact: true }).click();
  await expect(page.getByTestId("achievements-panel")).toBeVisible();
  await expect(page.getByTestId("passport-progress")).toContainText("0 /");
  await expect(page.getByText("City stamps", { exact: true })).toBeVisible();
  await expect(page.getByText("Journey combinations", { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: "artifacts/passport-mobile.png" });
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.getByTestId("achievements-panel")).toHaveCount(0);
});

test("preview ads never request an ad network and the local preference persists", async ({ page }) => {
  const adRequests: string[] = [];
  page.on("request", request => {
    if (/googlesyndication|doubleclick|googleadservices/.test(request.url())) adRequests.push(request.url());
  });
  await page.goto(BASE_URL);
  await expect(page.getByTestId("ad-preview-explore")).toBeVisible();
  await page.getByRole("button", { name: "Settings", exact: true }).first().click();
  await page.getByTestId("ads-enabled").click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("bahnreise.ads.enabled"))).toBe("false");
  await page.reload();
  await expect(page.getByTestId("home-screen")).toBeVisible();
  await expect(page.getByTestId("ad-preview-explore")).toHaveCount(0);
  await page.getByTestId("start-journey").click();
  await expect(page.getByTestId("station-input")).toBeVisible();
  await expect(page.locator('[data-testid^="ad-preview-"]')).toHaveCount(0);
  expect(adRequests).toEqual([]);
});
