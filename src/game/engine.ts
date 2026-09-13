import type { InputProfile, Stage } from "../data/stages";
import {
  inputTarget,
  isSingleCharacter,
  matchCharacter,
  originalCharacterCount,
} from "./input";

export { inputTarget, isSingleCharacter, normalizeInput } from "./input";

export const CHARACTER_POINTS = 100;
export const ORIGINAL_CHARACTER_POINTS = 20;

/** The source route keeps destinations separate; play always starts at origin. */
export const typingTargets = (stage: Stage): string[] =>
  [stage.origin, ...stage.stations].filter((name) => name.length > 0);

export const currentStation = (stage: Stage, run: Run): string =>
  run.originCompleted ? (stage.stations[run.stationIndex] ?? "") : stage.origin;

export function stageRules(stage: Stage, profile: InputProfile) {
  const totalChars = typingTargets(stage).reduce(
    (sum, station) => sum + inputTarget(station).length,
    0,
  );
  const originalCharacters = typingTargets(stage).reduce(
    (sum, station) => sum + originalCharacterCount(station),
    0,
  );
  const targetCps = stage.targetCps * (profile === "touch" ? 0.5 : 1);
  const seconds = Math.ceil(
    (totalChars / targetCps) * 2.2 + (profile === "touch" ? 18 : 12),
  );
  const baseMaxScore = totalChars * CHARACTER_POINTS;
  return {
    totalChars,
    targetCps,
    seconds,
    baseMaxScore,
    maxScore: baseMaxScore + originalCharacters * ORIGINAL_CHARACTER_POINTS,
    maxOriginalBonus: originalCharacters * ORIGINAL_CHARACTER_POINTS,
    thresholds: [0.55, 0.75, 0.9].map(
      (n) => Math.ceil((baseMaxScore * n) / 10) * 10,
    ),
  };
}

export type Run = {
  stageId: string;
  profile: InputProfile;
  stationIndex: number;
  /** Origin is typed in place before the destination leg counter advances. */
  originCompleted: boolean;
  /** Cursor and correct count use canonical units, including two units for ß. */
  cursor: number;
  correct: number;
  originalCharacters: number;
  mistakes: number;
  combo: number;
  maxCombo: number;
  elapsedMs: number;
  status: "playing" | "paused" | "finished";
  finishReason?: "arrived" | "timeout";
};

export function createRun(stage: Stage, profile: InputProfile): Run {
  return {
    stageId: stage.id,
    profile,
    stationIndex: 0,
    originCompleted: stage.origin.length === 0,
    cursor: 0,
    correct: 0,
    originalCharacters: 0,
    mistakes: 0,
    combo: 0,
    maxCombo: 0,
    elapsedMs: 0,
    status: "playing",
  };
}

export function tick(run: Run, stage: Stage, elapsedMs: number): Run {
  if (run.status !== "playing" || !Number.isFinite(elapsedMs)) return run;
  const limit = stageRules(stage, run.profile).seconds * 1000;
  const elapsed = Math.max(run.elapsedMs, elapsedMs);
  return elapsed >= limit
    ? { ...run, elapsedMs: limit, status: "finished", finishReason: "timeout" }
    : { ...run, elapsedMs: elapsed };
}

/** A single input grapheme can expand (ß → ss). Bulk text never advances a run. */
export function typeCharacter(run: Run, stage: Stage, character: string): Run {
  if (run.status !== "playing" || !isSingleCharacter(character)) return run;
  const station = currentStation(stage, run);
  if (!station) return run;
  const match = matchCharacter(station, run.cursor, character);
  if (!match) return { ...run, mistakes: run.mistakes + 1, combo: 0 };

  const cursor = run.cursor + match.length;
  const complete = cursor === inputTarget(station).length;
  const arrived =
    complete &&
    (run.originCompleted
      ? run.stationIndex === stage.stations.length - 1
      : stage.stations.length === 0);
  return {
    ...run,
    cursor: complete ? 0 : cursor,
    stationIndex:
      complete && run.originCompleted ? run.stationIndex + 1 : run.stationIndex,
    originCompleted: run.originCompleted || complete,
    correct: run.correct + match.length,
    originalCharacters: run.originalCharacters + Number(match.original),
    combo: run.combo + match.length,
    maxCombo: Math.max(run.maxCombo, run.combo + match.length),
    status: arrived ? "finished" : "playing",
    ...(arrived ? { finishReason: "arrived" as const } : {}),
  };
}

export function runStats(run: Run, stage: Stage) {
  const rules = stageRules(stage, run.profile);
  const attempts = run.correct + run.mistakes;
  const accuracy = attempts ? run.correct / attempts : 1;
  const cps = run.correct / Math.max(run.elapsedMs / 1000, 1);
  const speedFactor = Math.min(1, cps / rules.targetCps);
  const qualityFactor = accuracy ** 2 * (0.6 + 0.4 * speedFactor);
  const baseScore = Math.round(run.correct * CHARACTER_POINTS * qualityFactor);
  const originalBonus = Math.round(
    run.originalCharacters * ORIGINAL_CHARACTER_POINTS * qualityFactor,
  );
  const score = baseScore + originalBonus;
  const arrived = run.finishReason === "arrived";
  const stars = arrived
    ? rules.thresholds.filter((threshold) => score >= threshold).length
    : 0;
  const progress = rules.totalChars ? run.correct / rules.totalChars : 0;
  return {
    ...rules,
    accuracy,
    cps,
    cpm: Math.round(cps * 60),
    baseScore,
    originalBonus,
    score,
    stars,
    progress,
    passed: arrived && stars > 0,
  };
}

export function togglePause(run: Run): Run {
  if (run.status === "finished") return run;
  return { ...run, status: run.status === "playing" ? "paused" : "playing" };
}
