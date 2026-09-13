import { STAGES } from "../../src/data/stages";
import {
  emptyProgress,
  recordKey,
  routeSignature,
} from "../../src/game/progress";
import { BASE_URL, expect, PROGRESS_KEY, test } from "./fixtures";

const rows = '[data-testid^="journal-record-DE."]';

test("closed journal has no record tree and new players get a useful empty state", async ({
  page,
}) => {
  await page.goto(BASE_URL);
  await expect(page.getByTestId("germany-browser")).toBeVisible();
  await expect(page.getByTestId("journey-panel")).toHaveCount(0);
  await expect(page.locator(rows)).toHaveCount(0);
  await page
    .getByRole("button", { name: "Travel journal", exact: true })
    .first()
    .click();
  await expect(page.getByTestId("journal-empty")).toContainText(
    "Complete a chapter",
  );
  await expect(page.locator(rows)).toHaveCount(0);
  await page
    .getByTestId("journey-panel")
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await expect(page.getByTestId("journey-panel")).toHaveCount(0);
});

test("journal paginates valid campaign personal bests and labels chapters in either language", async ({
  page,
  context,
}) => {
  const progress = emptyProgress("keyboard");
  const played = STAGES.filter((stage) => !stage.isCustom).slice(0, 31);
  for (const [index, stage] of played.entries()) {
    progress.records[recordKey(stage.id, "keyboard")] = {
      stars: 3,
      score: 12000 + index,
      accuracy: 1,
      cpm: 240,
      completedAt: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
      routeSignature: index === 30 ? "outdated-route" : routeSignature(stage),
    };
  }
  const touchOnly = STAGES[31];
  progress.records[recordKey(touchOnly.id, "touch")] = {
    stars: 3,
    score: 99999,
    accuracy: 1,
    cpm: 240,
    completedAt: new Date().toISOString(),
    routeSignature: routeSignature(touchOnly),
  };
  await context.addInitScript(
    ({ key, progress }) => localStorage.setItem(key, JSON.stringify(progress)),
    { key: PROGRESS_KEY, progress },
  );
  await page.goto(BASE_URL);
  await page
    .getByRole("button", { name: "Travel journal", exact: true })
    .first()
    .click();
  await expect(page.getByTestId("journal-record-count")).toContainText(
    "30 completed chapters",
  );
  await expect(page.locator(rows)).toHaveCount(12);
  await expect(page.getByTestId(`journal-record-${played[30].id}`)).toHaveCount(
    0,
  );
  await expect(page.getByTestId(`journal-record-${touchOnly.id}`)).toHaveCount(
    0,
  );
  const newest = page.getByTestId(`journal-record-${played[29].id}`);
  await expect(newest).toContainText(played[29].title.en);
  await expect(newest).toContainText(played[29].line);
  await expect(newest).toContainText(
    `Chapter ${played[29].chapter ?? 1}/${played[29].chapters ?? 1}`,
  );
  await expect(page.getByTestId("journal-page-previous")).toBeDisabled();
  await page.getByTestId("journal-page-next").click();
  await expect(page.locator(rows)).toHaveCount(12);
  await expect(page.getByTestId("journal-page-count")).toHaveText("2 / 3");
  await expect(newest).toHaveCount(0);
  await page.getByTestId("journal-page-next").click();
  await expect(page.locator(rows)).toHaveCount(6);
  await expect(page.getByTestId("journal-page-next")).toBeDisabled();
  await page
    .getByTestId("journey-panel")
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await expect(page.locator(rows)).toHaveCount(0);
  await page.getByTestId("language-de").click();
  await page
    .getByRole("button", { name: "Reisetagebuch", exact: true })
    .first()
    .click();
  await expect(page.getByTestId("journal-record-count")).toContainText(
    "30 abgeschlossene Kapitel",
  );
  await expect(newest).toContainText(played[29].title.de);
  await expect(newest).toContainText(
    `Kapitel ${played[29].chapter ?? 1}/${played[29].chapters ?? 1}`,
  );
  await expect(page.getByTestId("journal-page-next")).toHaveText("Weiter");
  await page.screenshot({ path: "artifacts/journal-paginated.png" });
});
