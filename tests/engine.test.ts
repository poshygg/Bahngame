import assert from "node:assert/strict";
import test from "node:test";
import { STAGES, type InputProfile, type Stage } from "../src/data/stages";
import { COUNTRIES, getCountryStages } from "../src/data/countries";
import {
  createRun,
  inputTarget,
  isSingleCharacter,
  normalizeInput,
  runStats,
  stageRules,
  tick,
  togglePause,
  typeCharacter,
  typingTargets,
  currentStation,
} from "../src/game/engine";
import {
  emptyProgress,
  isUnlocked,
  parseProgress,
  recordKey,
  routeSignature,
  saveResult,
} from "../src/game/progress";

// Domain tests use a stable fixture; expanding the playable catalogue must not
// silently change the speed/error scenarios being tested.
const stage: Stage = {
  ...STAGES[0],
  origin: "",
  stations: ["Friedrichstraße", "Alexanderplatz", "Ostbahnhof"],
  targetCps: 2.4,
};

function complete(
  item = stage,
  profile: InputProfile = "keyboard",
  cps = stageRules(item, profile).targetCps,
  mistakes = 0,
  original = false,
) {
  let run = createRun(item, profile);
  for (let index = 0; index < mistakes; index++)
    run = typeCharacter(run, item, "!");
  const text = original
    ? typingTargets(item).join("").normalize("NFC")
    : typingTargets(item).map(normalizeInput).join("");
  for (const character of text) {
    run = tick(
      run,
      item,
      run.elapsedMs + (normalizeInput(character).length * 1000) / cps,
    );
    run = typeCharacter(run, item, character);
  }
  return run;
}

function typeText(item: Stage, text: string) {
  let run = createRun(item, "keyboard");
  for (const character of text) run = typeCharacter(run, item, character);
  return run;
}

const oldRecord = {
  score: 4000,
  stars: 3,
  accuracy: 1,
  cpm: 180,
  completedAt: "2026-09-12T12:00:00Z",
};

test("country packs use unique namespaced routes and independent entry points", () => {
  assert.equal(new Set(STAGES.map((item) => item.id)).size, STAGES.length);
  for (const item of STAGES) {
    assert.ok(item.id.startsWith(item.countryId + "."));
    assert.ok(COUNTRIES.some((country) => country.id === item.countryId));
    assert.ok(item.title.en && item.title.de);
    assert.ok(item.stations.length > 0);
  }
  assert.equal(
    getCountryStages("DE").filter((item) => !item.campaignId).length,
    6,
  );
  assert.ok(getCountryStages("DE").some((item) => item.campaignId));
  assert.equal(getCountryStages("FR").length, 0);
  assert.equal(
    isUnlocked(emptyProgress("keyboard"), 0, "keyboard", "FR"),
    false,
  );
});

test("normalization supports German and future European country packs", () => {
  assert.equal(normalizeInput("Friedrichstraße"), "friedrichstrasse");
  assert.equal(
    normalizeInput("MÜNCHEN Köln Südbahnhof"),
    "munchen koln sudbahnhof",
  );
  assert.equal(inputTarget("Ko\u0308ln"), "koln");
  assert.equal(inputTarget("St.\u202fPölten"), "st. polten");
  assert.equal(normalizeInput("Łódź Cœur Ærø"), "lodz coeur aero");
});

test("original and simplified spellings can be mixed without a mode switch", () => {
  const item = { ...stage, stations: ["München Köln Straße"] };
  const simple = typeText(item, "Munchen Koln Strasse");
  const mixed = typeText(item, "Munchen Köln Strasse");
  const original = typeText(item, "MÜNCHEN KÖLN STRAẞE");
  for (const run of [simple, mixed, original]) {
    assert.equal(run.finishReason, "arrived");
    assert.equal(run.mistakes, 0);
    assert.equal(run.correct, inputTarget(item.stations[0]).length);
  }
  assert.equal(simple.originalCharacters, 0);
  assert.equal(mixed.originalCharacters, 1);
  assert.equal(original.originalCharacters, 3);
  assert.equal(runStats(mixed, item).score - runStats(simple, item).score, 20);
  assert.equal(runStats(original, item).originalBonus, 60);
  assert.equal(
    runStats(original, item).score,
    stageRules(item, "keyboard").maxScore,
  );
});

test("bonus is weighted by the same accuracy and speed as ordinary points", () => {
  const item = { ...stage, stations: ["München Köln Straße"] };
  const run = complete(item, "keyboard", 1.5, 3, true);
  const stats = runStats(run, item);
  const factor =
    stats.accuracy ** 2 * (0.6 + (0.4 * stats.cps) / stats.targetCps);
  assert.equal(stats.originalBonus, Math.round(60 * factor));
  assert.equal(stats.score, stats.baseScore + stats.originalBonus);
  assert.ok(stats.originalBonus < 60);
});

test("other European original letters automatically earn their own bonuses", () => {
  const item = { ...stage, countryId: "FR", stations: ["Łódź Cœur Ærø"] };
  const run = typeText(item, item.stations[0]);
  assert.equal(run.originalCharacters, 6);
  assert.equal(runStats(run, item).originalBonus, 120);
});

test("dead-key decomposed accents are accepted as a single input grapheme", () => {
  const item = { ...stage, stations: ["Ü"], targetCps: 1 };
  assert.equal(isSingleCharacter("u\u0308"), true);
  const run = typeCharacter(createRun(item, "keyboard"), item, "u\u0308");
  assert.equal(run.finishReason, "arrived");
  assert.equal(run.originalCharacters, 1);
  assert.equal(run.correct, 1);
  assert.equal(runStats(run, item).originalBonus, 20);
});

test("normalization cannot invent original spelling bonuses at plain letters", () => {
  const item = { ...stage, stations: ["aoss"] };
  const run = typeText(item, "äöß");
  assert.equal(run.finishReason, "arrived");
  assert.equal(run.originalCharacters, 0);
  assert.equal(runStats(run, item).originalBonus, 0);
  const wrongAccent = typeText({ ...item, stations: ["ü"] }, "ú");
  assert.equal(wrongAccent.originalCharacters, 0);
});

test("an expanded ß receives no bonus when entered midway through its span", () => {
  const item = { ...stage, stations: ["ßs"] };
  const run = typeText(item, "sß");
  assert.equal(run.finishReason, "arrived");
  assert.equal(run.correct, 3);
  assert.equal(run.originalCharacters, 0);
});

test("a wrong key stops movement, counts an error and resets the combo", () => {
  let run = typeCharacter(createRun(stage, "keyboard"), stage, "F");
  run = typeCharacter(run, stage, "x");
  assert.equal(run.cursor, 1);
  assert.equal(run.correct, 1);
  assert.equal(run.mistakes, 1);
  assert.equal(run.combo, 0);
  run = typeCharacter(run, stage, "r");
  assert.equal(run.cursor, 2);
  assert.equal(run.maxCombo, 1);
});

test("native ß advances two canonical units but awards one original bonus", () => {
  const run = typeText(stage, "Friedrichstraße");
  assert.equal(run.stationIndex, 1);
  assert.equal(run.cursor, 0);
  assert.equal(run.correct, 16);
  assert.equal(run.originalCharacters, 1);
});

test("bulk text and post-finish input cannot create movement or rewards", () => {
  const run = createRun(stage, "keyboard");
  assert.equal(isSingleCharacter("üö"), false);
  assert.equal(typeCharacter(run, stage, "friedrichstrasse"), run);
  assert.equal(typeCharacter(run, stage, ""), run);
  const item = { ...stage, stations: ["ö"] };
  const finished = typeText(item, "ö");
  assert.equal(typeCharacter(finished, item, "ö"), finished);
});

test("perfect simplified arrival earns three stars without needing original letters", () => {
  const run = complete();
  const stats = runStats(run, stage);
  assert.equal(run.finishReason, "arrived");
  assert.equal(run.stationIndex, stage.stations.length);
  assert.equal(stats.stars, 3);
  assert.equal(stats.score, stats.baseMaxScore);
  assert.equal(stats.originalBonus, 0);
  assert.equal(stats.progress, 1);
});

test("excessive errors fail even after arriving", () => {
  const run = complete(stage, "keyboard", 4, 60);
  assert.equal(run.finishReason, "arrived");
  assert.equal(runStats(run, stage).stars, 0);
  assert.equal(runStats(run, stage).passed, false);
});

test("time limit is authoritative and cannot be bypassed by a late key", () => {
  const run = tick(
    createRun(stage, "keyboard"),
    stage,
    stageRules(stage, "keyboard").seconds * 1000,
  );
  assert.equal(run.finishReason, "timeout");
  assert.equal(typeCharacter(run, stage, "f"), run);
  assert.equal(runStats(run, stage).stars, 0);
});

test("clock never moves backward or accepts invalid time", () => {
  const run = tick(createRun(stage, "keyboard"), stage, 3000);
  assert.equal(tick(run, stage, 1000).elapsedMs, 3000);
  assert.equal(tick(run, stage, Number.NaN), run);
});

test("pausing freezes progress and input; resuming preserves elapsed time", () => {
  const paused = togglePause(tick(createRun(stage, "keyboard"), stage, 2500));
  assert.equal(typeCharacter(paused, stage, "f"), paused);
  assert.equal(tick(paused, stage, 90000), paused);
  assert.equal(togglePause(paused).elapsedMs, 2500);
  assert.equal(togglePause(paused).status, "playing");
});

test("mobile receives more time and half the speed target in every stage", () => {
  for (const item of STAGES) {
    const touch = stageRules(item, "touch");
    const keyboard = stageRules(item, "keyboard");
    assert.ok(touch.seconds > keyboard.seconds);
    assert.equal(touch.targetCps, keyboard.targetCps / 2);
    assert.deepEqual(touch.thresholds, keyboard.thresholds);
  }
});

test("equal relative typing proficiency earns equal scores on desktop and touch", () => {
  const keyboard = runStats(complete(stage, "keyboard", 1.8), stage);
  const touch = runStats(complete(stage, "touch", 0.9), stage);
  assert.equal(keyboard.score, touch.score);
  assert.equal(keyboard.stars, touch.stars);
  assert.ok(touch.cpm < keyboard.cpm);
});

test("one and two stars are attainable without deliberately making mistakes", () => {
  assert.equal(runStats(complete(stage, "keyboard", 0.85), stage).stars, 1);
  assert.equal(runStats(complete(stage, "keyboard", 1.5), stage).stars, 2);
});

test("automatic rewards share one score table, with platform records isolated", () => {
  const item = STAGES[0];
  const progress = saveResult(emptyProgress("keyboard"), complete(item), item);
  assert.ok(progress.records[recordKey(item.id, "keyboard")]);
  assert.equal(isUnlocked(progress, 1, "keyboard"), true);
  assert.equal(isUnlocked(progress, 1, "touch"), false);
  assert.equal(progress.records[recordKey(item.id, "touch")], undefined);
  const improved = saveResult(
    progress,
    complete(item, "keyboard", undefined, 0, true),
    item,
  );
  assert.equal(Object.keys(improved.records).length, 1);
});

test("a worse replay or failure never overwrites the best current route record", () => {
  const best = saveResult(emptyProgress("keyboard"), complete(), stage);
  assert.equal(saveResult(best, complete(stage, "keyboard", 1.5), stage), best);
  assert.equal(
    saveResult(best, complete(stage, "keyboard", 4, 60), stage),
    best,
  );
});

test("v1 records are archived while preserving earned unlocks and detected platform", () => {
  const progress = parseProgress(
    JSON.stringify({
      version: 1,
      profile: "keyboard",
      records: { "keyboard:berlin": oldRecord },
    }),
    "touch",
  );
  assert.equal(progress.version, 3);
  assert.equal(progress.profile, "touch");
  assert.equal(progress.countryId, "DE");
  assert.deepEqual(progress.records, {});
  assert.deepEqual(
    progress.archivedRecords["keyboard:DE.berlin:v1:simplified"],
    oldRecord,
  );
  assert.equal(isUnlocked(progress, 1, "keyboard"), true);
  assert.equal(isUnlocked(progress, 1, "touch"), false);
});

test("both legacy spelling tables are preserved without affecting new score thresholds", () => {
  const progress = parseProgress(
    JSON.stringify({
      version: 2,
      originalSpelling: true,
      profile: "touch",
      records: {
        "keyboard:simplified:DE.berlin": oldRecord,
        "keyboard:original:DE.berlin": { ...oldRecord, score: 4800 },
      },
    }),
    "keyboard",
  );
  assert.equal(Object.keys(progress.archivedRecords).length, 2);
  assert.equal(Object.keys(progress.records).length, 0);
  assert.equal(progress.profile, "keyboard");
  assert.equal("originalSpelling" in progress, false);
  assert.equal(isUnlocked(progress, 1, "keyboard"), true);
});

test("future route edits archive old scores while retaining access to the next city", () => {
  const item = STAGES[0];
  const oldStage = { ...item, stations: ["A"] };
  assert.notEqual(routeSignature(oldStage), routeSignature(item));
  const saved = saveResult(
    emptyProgress("keyboard"),
    complete(oldStage),
    oldStage,
  );
  const restored = parseProgress(JSON.stringify(saved), "keyboard");
  assert.deepEqual(restored.records, {});
  assert.equal(Object.keys(restored.archivedRecords).length, 1);
  assert.equal(isUnlocked(restored, 1, "keyboard"), true);
  const replay = saveResult(restored, complete(item), item);
  assert.equal(
    replay.records[recordKey(item.id, "keyboard")].routeSignature,
    routeSignature(item),
  );
});

test("tutorial completion persists without creating records", () => {
  const saved = { ...emptyProgress("touch"), tutorialCompleted: true };
  const restored = parseProgress(JSON.stringify(saved), "keyboard");
  assert.equal(restored.tutorialCompleted, true);
  assert.equal(restored.profile, "keyboard");
  assert.deepEqual(restored.records, {});
});

test("training runs outside the catalogue cannot enter scored records", () => {
  const training = { ...stage, id: "tutorial.DE.berlin" };
  const progress = emptyProgress("keyboard");
  assert.equal(saveResult(progress, complete(training), training), progress);
});

test("saved current records restore and corrupt/unsupported storage is ignored", () => {
  const item = STAGES[0];
  const progress = saveResult(
    emptyProgress("touch"),
    complete(item, "touch"),
    item,
  );
  assert.deepEqual(parseProgress(JSON.stringify(progress), "touch"), progress);
  assert.deepEqual(parseProgress("{broken", "touch"), emptyProgress("touch"));
  assert.deepEqual(
    parseProgress('{"version":4,"records":{}}', "touch"),
    emptyProgress("touch"),
  );
  const forged = {
    version: 1,
    profile: "invalid",
    records: { "keyboard:berlin": { score: -10, stars: 99 } },
  };
  assert.deepEqual(
    parseProgress(JSON.stringify(forged), "keyboard"),
    emptyProgress("keyboard"),
  );
});
