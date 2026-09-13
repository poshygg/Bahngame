import assert from "node:assert/strict";
import test from "node:test";
import { STAGES, type Stage, type InputProfile } from "../src/data/stages";
import {
  emptyProgress,
  recordKey,
  routeSignature,
  type Progress,
} from "../src/game/progress";
import { deriveAchievements } from "../src/features/achievements/deriveAchievements";

const stage = (id: string, fields: Partial<Stage> = {}): Stage => ({
  ...STAGES[0],
  id: `DE.test.${id}`,
  journeyKind: "city",
  networkId: "berlin",
  serviceKind: "S",
  ...fields,
});
const pass = (
  progress: Progress,
  value: Stage,
  profile: InputProfile = "keyboard",
) => {
  progress.records[recordKey(value.id, profile)] = {
    score: 10000,
    stars: 2,
    accuracy: 0.98,
    cpm: 230,
    completedAt: "2026-09-13T00:00:00Z",
    routeSignature: routeSignature(value),
  };
};

test("city stamp needs every unique current chapter while city trio needs one per named city", () => {
  const catalog = [
    stage("berlin-1"),
    stage("berlin-2"),
    stage("hamburg", { networkId: "hamburg" }),
    stage("munich", { networkId: "munich" }),
  ];
  const progress = emptyProgress("keyboard");
  for (const item of [catalog[0], catalog[2], catalog[3]]) pass(progress, item);
  let result = deriveAchievements(progress, "keyboard", catalog);
  assert.equal(
    result.cityStamps.find((item) => item.id === "city-berlin")?.earned,
    false,
  );
  assert.equal(
    result.cityStamps.find((item) => item.id === "city-berlin")?.current,
    1,
  );
  assert.equal(
    result.combinations.find((item) => item.id === "city-trio")?.earned,
    true,
  );
  pass(progress, catalog[1]);
  result = deriveAchievements(progress, "keyboard", [...catalog, catalog[0]]);
  assert.equal(
    result.cityStamps.find((item) => item.id === "city-berlin")?.target,
    2,
  );
  assert.equal(
    result.cityStamps.find((item) => item.id === "city-berlin")?.earned,
    true,
  );
});

test("failed, retired, stale, custom and other-profile records award nothing", () => {
  const catalog = [
    stage("failed"),
    stage("stale"),
    stage("other-profile"),
    stage("custom", { isCustom: true }),
  ];
  const retired = stage("retired");
  const progress = emptyProgress("keyboard");
  for (const item of [...catalog, retired]) pass(progress, item);
  progress.records[recordKey(catalog[0].id, "keyboard")].stars = 0;
  progress.records[recordKey(catalog[1].id, "keyboard")].routeSignature =
    "retired-signature";
  delete progress.records[recordKey(catalog[2].id, "keyboard")];
  pass(progress, catalog[2], "touch");
  const result = deriveAchievements(progress, "keyboard", catalog);
  assert.equal(result.passedChapters, 0);
  assert.equal(result.earned, 0);
  assert.equal(
    result.cityStamps[0].target,
    3,
    "custom routes are excluded from stamp requirements too",
  );
});

test("service combinations require separate passed chapters in each named service category", () => {
  const kinds = ["S", "U", "RE", "RB", "ICE", "IC", "EC"];
  const catalog = kinds.map((kind) => stage(kind, { serviceKind: kind }));
  const progress = emptyProgress("keyboard");
  pass(progress, catalog[0]);
  let result = deriveAchievements(progress, "keyboard", catalog);
  assert.equal(
    result.combinations.find((item) => item.id === "urban-duo")?.current,
    1,
  );
  assert.equal(
    result.combinations.find((item) => item.id === "urban-duo")?.earned,
    false,
  );
  for (const item of catalog) pass(progress, item);
  result = deriveAchievements(progress, "keyboard", catalog);
  for (const id of ["urban-duo", "regional-duo", "express-trio"])
    assert.equal(
      result.combinations.find((item) => item.id === id)?.earned,
      true,
    );
});

test("unavailable service combinations and empty city networks do not create impossible goals", () => {
  const result = deriveAchievements(emptyProgress("keyboard"), "keyboard", [
    stage("ICE", { serviceKind: "ICE" }),
  ]);
  assert.equal(result.cityStamps.length, 1);
  assert.equal(result.combinations.length, 0);
  assert.equal(
    deriveAchievements(emptyProgress("keyboard"), "keyboard", []).total,
    0,
  );
});

test("state explorer counts distinct regional states and explicit input profile controls every achievement", () => {
  const catalog = ["DE-BY", "DE-NW", "DE-SN"].map((regionId, index) =>
    stage(`state-${index}`, {
      journeyKind: "regional",
      networkId: undefined,
      regionIds: [regionId],
      serviceKind: "RE",
    }),
  );
  const progress = emptyProgress("keyboard");
  for (const item of catalog) pass(progress, item, "touch");
  assert.equal(
    deriveAchievements(progress, "keyboard", catalog).combinations.find(
      (item) => item.id === "state-mix",
    )?.current,
    0,
  );
  const touch = deriveAchievements(progress, "touch", catalog);
  assert.equal(
    touch.combinations.find((item) => item.id === "state-mix")?.earned,
    true,
  );
  assert.equal(
    touch.combinations.find((item) => item.id === "state-mix")?.target,
    3,
  );
});
