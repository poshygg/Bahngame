import assert from "node:assert/strict";
import test from "node:test";
import { STAGES, type Stage } from "../src/data/stages";
import { getCountryStages } from "../src/data/countries";
import {
  createRun,
  stageRules,
  tick,
  typeCharacter,
  typingTargets,
} from "../src/game/engine";
import {
  emptyProgress,
  getNextStage,
  isStageUnlocked,
  isUnlocked,
  parseProgress,
  recordKey,
  routeSignature,
  saveResult,
  type RecordEntry,
} from "../src/game/progress";

function chapter(campaignId: string, number: number): Stage {
  return {
    ...STAGES[0],
    id: `DE.test.${campaignId}.${number}`,
    legacyId: undefined,
    campaignId: `test.${campaignId}`,
    chapter: number,
    chapters: 2,
    stations: ["Köln", "Straße"],
  };
}

const first = chapter("city-a", 1);
const second = chapter("city-a", 2);
const otherFirst = chapter("service-b", 1);
const otherSecond = chapter("service-b", 2);

function withCampaigns(check: () => void) {
  const length = STAGES.length;
  // Registration order intentionally differs from chapter order.
  STAGES.push(second, otherSecond, first, otherFirst);
  try {
    check();
  } finally {
    STAGES.splice(length);
  }
}

function complete(stage: Stage, profile: "keyboard" | "touch" = "keyboard") {
  let run = createRun(stage, profile);
  for (const character of typingTargets(stage).join("")) {
    run = tick(
      run,
      stage,
      run.elapsedMs + 500 / stageRules(stage, profile).targetCps,
    );
    run = typeCharacter(run, stage, character);
  }
  assert.equal(run.status, "finished");
  return run;
}

function record(stage: Stage, index = 0): RecordEntry {
  return {
    score: 1000,
    stars: 2,
    accuracy: 1,
    cpm: 120,
    completedAt: new Date(Date.UTC(2026, 0, 1) + index * 1000).toISOString(),
    routeSignature: routeSignature(stage),
  };
}

const custom: Stage = {
  ...first,
  id: "custom:my-river-trip",
  isCustom: true,
  campaignId: undefined,
  chapter: undefined,
  chapters: undefined,
};

test("each city/service campaign starts independently and follows chapter order", () => {
  withCampaigns(() => {
    const progress = emptyProgress("keyboard");
    assert.equal(isStageUnlocked(progress, first), true);
    assert.equal(isStageUnlocked(progress, otherFirst), true);
    assert.equal(isStageUnlocked(progress, second), false);
    assert.equal(isStageUnlocked(progress, otherSecond), false);
    assert.equal(getNextStage(first)?.id, second.id);
    assert.equal(getNextStage(otherFirst)?.id, otherSecond.id);
    assert.equal(getNextStage(second), undefined);
    assert.equal(getNextStage(otherSecond), undefined);
    const catalogIndex = getCountryStages("DE").findIndex(
      (stage) => stage.id === first.id,
    );
    assert.equal(isUnlocked(progress, catalogIndex, "keyboard"), true);
  });
});

test("a chapter clear unlocks only that campaign and input profile", () => {
  withCampaigns(() => {
    const progress = saveResult(
      emptyProgress("keyboard"),
      complete(first),
      first,
    );
    assert.equal(isStageUnlocked(progress, second), true);
    assert.equal(isStageUnlocked(progress, second, "touch"), false);
    assert.equal(isStageUnlocked(progress, otherSecond), false);
    assert.deepEqual(progress.unlockedRoutes, [
      recordKey(first.id, "keyboard"),
      recordKey(second.id, "keyboard"),
    ]);
    // The record itself remains sufficient when explicit unlocks are absent.
    assert.equal(
      isStageUnlocked({ ...progress, unlockedRoutes: [] }, second),
      true,
    );
  });
});

test("the original route chain is not extended into a newly added campaign", () => {
  withCampaigns(() => {
    const legacy = getCountryStages("DE").filter((stage) => !stage.campaignId);
    assert.equal(getNextStage(legacy[0])?.id, legacy[1].id);
    assert.equal(getNextStage(legacy.at(-1)!), undefined);
    const progress = saveResult(
      emptyProgress("keyboard"),
      complete({ ...legacy.at(-1)!, stations: ["Köln"] }),
      { ...legacy.at(-1)!, stations: ["Köln"] },
    );
    assert.equal(progress.unlockedRoutes.length, 1);
    assert.equal(isStageUnlocked(progress, second), false);
  });
});

test("catalog updates archive old chapter scores while keeping earned progression", () => {
  withCampaigns(() => {
    const key = recordKey(first.id, "keyboard");
    const progress = parseProgress(
      JSON.stringify({
        ...emptyProgress("keyboard"),
        records: { [key]: { ...record(first), routeSignature: "route-old" } },
      }),
      "touch",
    );
    assert.equal(progress.profile, "touch");
    assert.equal(progress.records[key], undefined);
    assert.ok(progress.archivedRecords[`${key}:route-old`]);
    assert.equal(isStageUnlocked(progress, second, "keyboard"), true);
    assert.equal(isStageUnlocked(progress, second), false);
    assert.equal(isStageUnlocked(progress, otherSecond, "keyboard"), false);
  });
});

test("custom journeys save and reload their own scores without campaign unlocks", () => {
  withCampaigns(() => {
    const progress = saveResult(
      emptyProgress("keyboard"),
      complete(custom),
      custom,
    );
    const key = recordKey(custom.id, "keyboard");
    assert.ok(progress.records[key]);
    assert.deepEqual(progress.unlockedRoutes, []);
    assert.equal(isStageUnlocked(progress, custom), true);
    assert.equal(
      getNextStage({ ...custom, campaignId: first.campaignId }),
      undefined,
    );
    assert.equal(isStageUnlocked(progress, second), false);
    const restored = parseProgress(JSON.stringify(progress), "touch");
    assert.deepEqual(restored.records[key], progress.records[key]);
    assert.deepEqual(restored.unlockedRoutes, []);
    assert.equal(restored.records[recordKey(custom.id, "touch")], undefined);
  });
});

test("only explicitly custom, namespaced journeys can bypass catalog membership", () => {
  const progress = emptyProgress("keyboard");
  for (const invalid of [
    { ...custom, isCustom: false },
    { ...custom, id: "tutorial" },
    { ...custom, id: "custom:" },
    { ...custom, id: "custom:contains a space" },
  ]) {
    assert.equal(saveResult(progress, complete(invalid), invalid), progress);
    assert.equal(isStageUnlocked(progress, invalid), false);
  }
  assert.equal(
    saveResult(progress, createRun(custom, "keyboard"), custom),
    progress,
  );
  assert.equal(
    saveResult(progress, complete(custom), { ...custom, id: "custom:other" }),
    progress,
  );
});

test("custom record parsing rejects malformed values, profiles and namespace keys", () => {
  const valid = record(custom);
  const progress = parseProgress(
    JSON.stringify({
      ...emptyProgress("keyboard"),
      records: {
        "keyboard:custom:valid": valid,
        "touch:custom:invalid-stars": { ...valid, stars: 0 },
        "keyboard:custom:invalid-date": { ...valid, completedAt: "tomorrow" },
        "keyboard:custom:invalid-score": { ...valid, score: -1 },
        "keyboard:custom:invalid-accuracy": { ...valid, accuracy: 2 },
        "keyboard:custom:invalid-cpm": { ...valid, cpm: null },
        "unknown:custom:profile": valid,
        "keyboard:custom:": valid,
        "keyboard:non-custom": valid,
      },
      unlockedRoutes: ["keyboard:custom:valid"],
    }),
    "keyboard",
  );
  assert.deepEqual(Object.keys(progress.records), ["keyboard:custom:valid"]);
  assert.deepEqual(progress.unlockedRoutes, []);
});

test("custom history is capped at the latest 100 entries without removing campaign scores", () => {
  withCampaigns(() => {
    const records = Object.fromEntries(
      Array.from({ length: 105 }, (_, index) => [
        recordKey(`custom:trip-${index}`, index % 2 ? "touch" : "keyboard"),
        record(custom, index),
      ]),
    );
    const campaignKey = recordKey(first.id, "keyboard");
    records[campaignKey] = record(first);
    const progress = parseProgress(
      JSON.stringify({ ...emptyProgress("keyboard"), records }),
      "keyboard",
    );
    assert.equal(Object.keys(progress.records).length, 101);
    assert.ok(progress.records[campaignKey]);
    assert.equal(progress.records["keyboard:custom:trip-0"], undefined);
    assert.ok(progress.records["touch:custom:trip-5"]);
    const saved = saveResult(progress, complete(custom), custom);
    assert.equal(Object.keys(saved.records).length, 101);
    assert.ok(saved.records[recordKey(custom.id, "keyboard")]);
    assert.equal(saved.records["touch:custom:trip-5"], undefined);
    assert.ok(saved.records[campaignKey]);
  });
});

test("legacy migration does not associate a missing legacyId with new campaigns", () => {
  withCampaigns(() => {
    const progress = parseProgress(
      JSON.stringify({
        version: 1,
        records: { "keyboard:undefined": record(first), "": record(first) },
      }),
      "keyboard",
    );
    assert.equal(isStageUnlocked(progress, second), false);
    assert.deepEqual(progress.archivedRecords, {});
  });
});

test("retired campaign scores move to history and survive repeated reloads", () => {
  const retired = chapter("retired-city", 1);
  const keyboardKey = recordKey(retired.id, "keyboard");
  const touchKey = recordKey(retired.id, "touch");
  const best = record(retired);
  const older = { ...best, score: 800, routeSignature: "route-older" };
  const { routeSignature: _signature, ...withoutSignature } = best;
  const touch = { ...withoutSignature, score: 600 };
  const stored = {
    ...emptyProgress("keyboard"),
    records: { [keyboardKey]: best, [touchKey]: touch },
    archivedRecords: { [`${keyboardKey}:route-older`]: older },
    unlockedRoutes: [keyboardKey, touchKey],
  };
  const migrated = parseProgress(JSON.stringify(stored), "keyboard");
  assert.deepEqual(migrated.records, {});
  assert.deepEqual(migrated.archivedRecords, {
    [`${keyboardKey}:${best.routeSignature}`]: best,
    [`${keyboardKey}:route-older`]: older,
    [`${touchKey}:legacy`]: touch,
  });
  assert.deepEqual(migrated.unlockedRoutes, []);
  assert.equal(isStageUnlocked(migrated, retired), false);
  assert.equal(getNextStage(retired), undefined);
  const reloaded = parseProgress(JSON.stringify(migrated), "keyboard");
  assert.deepEqual(reloaded, migrated);
  assert.deepEqual(
    parseProgress(JSON.stringify(reloaded), "keyboard"),
    migrated,
  );
});

test("retired IDs never map their identical score or unlocks onto a replacement campaign", () => {
  withCampaigns(() => {
    const retired = { ...first, id: `${first.id}-removed` };
    const retiredKey = recordKey(retired.id, "keyboard");
    const stored = {
      ...emptyProgress("keyboard"),
      records: { [retiredKey]: record(retired) },
      unlockedRoutes: [retiredKey],
    };
    const migrated = parseProgress(JSON.stringify(stored), "keyboard");
    assert.equal(routeSignature(retired), routeSignature(first));
    assert.equal(migrated.records[recordKey(first.id, "keyboard")], undefined);
    assert.equal(isStageUnlocked(migrated, second), false);
    assert.equal(isStageUnlocked(migrated, otherSecond), false);
    assert.deepEqual(migrated.unlockedRoutes, []);
    assert.deepEqual(Object.keys(migrated.archivedRecords), [
      `${retiredKey}:${routeSignature(retired)}`,
    ]);
  });
});

test("retired archive validation rejects corrupt records and keeps custom scores separate", () => {
  const retired = chapter("retired-service", 1);
  const key = recordKey(retired.id, "keyboard");
  const valid = record(retired);
  const customKey = recordKey(custom.id, "keyboard");
  const migrated = parseProgress(
    JSON.stringify({
      ...emptyProgress("keyboard"),
      records: {
        [key]: { ...valid, stars: 0 },
        [customKey]: record(custom),
        "unknown:DE.retired": valid,
        "keyboard:unscoped-retired": valid,
      },
      archivedRecords: {
        [`${key}:valid`]: valid,
        [`${key}:invalid`]: { ...valid, accuracy: 2 },
        [`${key}:invalid-date`]: { ...valid, completedAt: "not a date" },
        [`${customKey}:legacy`]: record(custom),
        "unknown:DE.retired:old": valid,
      },
    }),
    "keyboard",
  );
  assert.deepEqual(Object.keys(migrated.archivedRecords), [`${key}:valid`]);
  assert.deepEqual(Object.keys(migrated.records), [customKey]);
  assert.deepEqual(migrated.unlockedRoutes, []);
  assert.deepEqual(
    parseProgress(JSON.stringify(migrated), "keyboard"),
    migrated,
  );
});
