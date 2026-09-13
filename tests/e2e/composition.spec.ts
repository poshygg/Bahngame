import type { CDPSession, Page } from "@playwright/test";
import { normalizeInput } from "../../src/game/engine";
import {
  test,
  expect,
  FIRST_STAGE,
  startJourney,
  typeStations,
  departOrigin,
} from "./fixtures";

async function draft(cdp: CDPSession, text: string) {
  await cdp.send("Input.imeSetComposition", {
    text,
    selectionStart: text.length,
    selectionEnd: text.length,
  });
}

async function commit(cdp: CDPSession, text: string) {
  await cdp.send("Input.insertText", { text });
}

const field = (page: Page) => page.getByTestId("station-input");

test("IME drafts commit once, recover from cancellation/errors and reset at station boundaries", async ({
  page,
}) => {
  await startJourney(page);
  await departOrigin(page);
  const initialScore = await page.getByTestId("live-score").innerText();
  const originLetters = normalizeInput(FIRST_STAGE.origin).length;
  const cdp = await page.context().newCDPSession(page);
  await field(page).focus();

  await draft(cdp, "s");
  await expect(field(page)).toHaveValue("s");
  await expect(page.getByTestId("live-score")).toHaveText(initialScore);
  await commit(cdp, "s");
  await expect(field(page)).toHaveValue("s");
  await expect(page.getByTestId("live-score")).not.toHaveText(initialScore);
  await expect(page.getByTestId("live-accuracy")).toHaveText("100%");
  await field(page).pressSequentially("a");
  await expect(field(page)).toHaveValue("sa");

  await draft(cdp, "x");
  await commit(cdp, "x");
  await expect(field(page)).toHaveValue("sa");
  await expect(page.getByTestId("live-accuracy")).toHaveText(
    `${Math.round(((originLetters + 2) / (originLetters + 3)) * 100)}%`,
  );

  await draft(cdp, "v");
  await expect(field(page)).toHaveValue("sav");
  await draft(cdp, "");
  await expect(field(page)).toHaveValue("sa");
  await expect(page.getByTestId("live-accuracy")).toHaveText(
    `${Math.round(((originLetters + 2) / (originLetters + 3)) * 100)}%`,
  );
  await field(page).pressSequentially("v");
  await expect(field(page)).toHaveValue("sav");

  await draft(cdp, "igny");
  await commit(cdp, "igny");
  await expect(field(page)).toHaveValue("sav");
  await expect(page.getByTestId("live-accuracy")).toHaveText(
    `${Math.round(((originLetters + 3) / (originLetters + 4)) * 100)}%`,
  );

  await field(page).pressSequentially("ignyplat");
  await draft(cdp, "z");
  await commit(cdp, "z");
  await expect(field(page)).toHaveValue("");
  await expect(page.getByTestId("typing-target")).toHaveText(
    normalizeInput(FIRST_STAGE.stations[1]).replace(/ /g, "␣"),
  );
  await draft(cdp, "z");
  await commit(cdp, "z");
  await expect(field(page)).toHaveValue("z");
  await field(page).pressSequentially("o");
  await expect(field(page)).toHaveValue("zo");
});

test("a decomposed umlaut stays intact during composition and earns its original-letter bonus once", async ({
  page,
}) => {
  await startJourney(page);
  const stationIndex = FIRST_STAGE.stations.findIndex((name) =>
    name.includes("ü"),
  );
  expect(stationIndex).toBeGreaterThanOrEqual(0);
  await typeStations(page, FIRST_STAGE.stations.slice(0, stationIndex));
  const station = FIRST_STAGE.stations[stationIndex];
  const umlautIndex = station.indexOf("ü");
  const prefix = normalizeInput(station.slice(0, umlautIndex));
  await field(page).pressSequentially(prefix);
  const cdp = await page.context().newCDPSession(page);
  const composed = "u\u0308";

  await draft(cdp, composed);
  await expect(field(page)).toHaveValue(prefix + composed);
  await expect(page.getByTestId("live-original-bonus")).toContainText("+0");
  await commit(cdp, composed);
  await expect(field(page)).toHaveValue(prefix + "u");
  await expect(page.getByTestId("live-original-bonus")).toContainText("+20");
  await expect(page.getByTestId("live-accuracy")).toHaveText("100%");

  await field(page).pressSequentially(
    normalizeInput(station.slice(umlautIndex + 1)),
  );
  await expect(field(page)).toHaveValue("");
  await expect(page.getByTestId("live-original-bonus")).toContainText("+20");
  await expect(page.getByTestId("live-accuracy")).toHaveText("100%");
});
