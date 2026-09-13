import assert from "node:assert/strict";
import test from "node:test";
import { STAGES } from "../src/data/stages";
import {
  createRun,
  currentStation,
  normalizeInput,
  runStats,
  stageRules,
  typeCharacter,
  typingTargets,
} from "../src/game/engine";
import {
  emptyProgress,
  parseProgress,
  recordKey,
  routeSignature,
} from "../src/game/progress";
import {
  stationLookahead,
  typingRoutePosition,
} from "../src/features/map/readAhead";

test("origin must be completed in place before destination motion starts", () => {
  const stage = { ...STAGES[0], origin: "Köln", stations: ["Berlin"] };
  let run = createRun(stage, "keyboard");
  assert.equal(currentStation(stage, run), "Köln");
  assert.equal(stationLookahead(stage, 0, null, true).current?.name, "Köln");
  assert.equal(
    stationLookahead(stage, 0, null, true).following?.name,
    "Berlin",
  );
  run = typeCharacter(run, stage, "B");
  assert.equal(run.mistakes, 1);
  assert.equal(run.correct, 0);
  for (const char of "Köln") {
    run = typeCharacter(run, stage, char);
    assert.equal(
      typingRoutePosition(
        run.stationIndex,
        run.cursor / 4,
        !run.originCompleted,
      ),
      0,
    );
  }
  assert.equal(run.originCompleted, true);
  assert.equal(run.stationIndex, 0);
  assert.equal(run.originalCharacters, 1);
  assert.equal(currentStation(stage, run), "Berlin");
  run = typeCharacter(run, stage, "B");
  assert.equal(
    typingRoutePosition(run.stationIndex, run.cursor / 6, !run.originCompleted),
    1 / 6,
  );
  for (const char of "erlin") run = typeCharacter(run, stage, char);
  assert.equal(run.finishReason, "arrived");
  assert.equal(run.stationIndex, 1);
  assert.equal(run.correct, 10);
  assert.ok(runStats(run, stage).originalBonus > 0);
});

test("origin contributes to time, score thresholds and automatic original rewards on both profiles", () => {
  const stage = { ...STAGES[0], origin: "München", stations: ["Köln"] };
  assert.deepEqual(typingTargets(stage), ["München", "Köln"]);
  for (const profile of ["keyboard", "touch"] as const) {
    const rules = stageRules(stage, profile);
    assert.equal(rules.totalChars, 11);
    assert.equal(rules.baseMaxScore, 1100);
    assert.equal(rules.maxOriginalBonus, 40);
    assert.ok(
      rules.seconds > stageRules({ ...stage, origin: "" }, profile).seconds,
    );
  }
});

test("pre-origin scoring records are archived and earned unlocks retained", () => {
  const stage = STAGES[0];
  let hash = 2166136261;
  for (const character of JSON.stringify([
    3,
    stage.origin,
    stage.stations,
    stage.targetCps,
  ])) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  const oldSignature = `route-${(hash >>> 0).toString(36)}`;
  assert.notEqual(routeSignature(stage), oldSignature);
  const key = recordKey(stage.id, "keyboard");
  const old = {
    score: 10000,
    stars: 3,
    accuracy: 1,
    cpm: 180,
    completedAt: "2026-09-13T00:00:00Z",
    routeSignature: oldSignature,
  };
  const progress = parseProgress(
    JSON.stringify({ ...emptyProgress("keyboard"), records: { [key]: old } }),
    "keyboard",
  );
  assert.equal(progress.records[key], undefined);
  assert.deepEqual(progress.archivedRecords[`${key}:${oldSignature}`], old);
  assert.ok(
    progress.unlockedRoutes.includes(recordKey(STAGES[1].id, "keyboard")),
  );
});
