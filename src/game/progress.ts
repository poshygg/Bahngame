import { InputProfile, STAGES, Stage } from "../data/stages";
import { Run, runStats } from "./engine";
import { COUNTRIES, getCountryStages } from "../data/countries";

export type RecordEntry = {
  score: number;
  stars: number;
  accuracy: number;
  cpm: number;
  completedAt: string;
  /** Older records have no signature and are kept only in the archive. */
  routeSignature?: string;
};

export type Progress = {
  version: 3;
  records: Record<string, RecordEntry>;
  archivedRecords: Record<string, RecordEntry>;
  unlockedRoutes: string[];
  /** Runtime platform only. A stored value never overrides detected hardware. */
  profile: InputProfile;
  countryId: string;
  tutorialCompleted: boolean;
};

export const emptyProgress = (profile: InputProfile): Progress => ({
  version: 3,
  records: {},
  archivedRecords: {},
  unlockedRoutes: [],
  profile,
  countryId: "DE",
  tutorialCompleted: false,
});

export const recordKey = (stageId: string, profile: InputProfile) =>
  `${profile}:${stageId}`;

const MAX_CUSTOM_RECORDS = 100;
const customId = /^custom:[^\s]{1,200}$/;
const customRecordKey = /^(keyboard|touch):custom:[^\s]{1,200}$/;
const campaignRecordKey =
  /^(keyboard|touch):([A-Z]{2}\.[A-Za-z0-9._-]{1,200})$/;
const campaignArchiveKey =
  /^(keyboard|touch):([A-Z]{2}\.[A-Za-z0-9._-]{1,200}):([\s\S]*)$/;

function isCustomStage(stage: Stage): boolean {
  return stage.isCustom === true && customId.test(stage.id);
}

/** Custom scores have a bounded history independent of campaign progression. */
function trimCustomRecords(records: Progress["records"]): Progress["records"] {
  const entries = Object.entries(records);
  const custom = entries
    .filter(([key]) => customRecordKey.test(key))
    .sort(
      ([, first], [, second]) =>
        Date.parse(second.completedAt) - Date.parse(first.completedAt),
    )
    .slice(0, MAX_CUSTOM_RECORDS);
  return Object.fromEntries([
    ...entries.filter(([key]) => !customRecordKey.test(key)),
    ...custom,
  ]);
}

function stageSequence(stage: Stage): Stage[] {
  if (stage.isCustom || customId.test(stage.id)) return [];
  const registered = STAGES.find((item) => item.id === stage.id);
  if (!registered) return [];
  const sequence = getCountryStages(registered.countryId).filter(
    (item) => !item.isCustom && item.campaignId === registered.campaignId,
  );
  // The original routes retain their catalog order. New service/city packs can
  // be registered in any order without changing the intended chapter sequence.
  return registered.campaignId
    ? sequence.sort(
        (first, second) =>
          (first.chapter ?? Number.MAX_SAFE_INTEGER) -
          (second.chapter ?? Number.MAX_SAFE_INTEGER),
      )
    : sequence;
}

export function getNextStage(stage: Stage): Stage | undefined {
  const sequence = stageSequence(stage);
  const index = sequence.findIndex((item) => item.id === stage.id);
  return index < 0 ? undefined : sequence[index + 1];
}

/** Route/scoring edits start a fair score table while retaining old unlocks. */
export function routeSignature(stage: Stage): string {
  const content = JSON.stringify([
    4, // Origin-first typing, including origin points and time allowance.
    stage.origin,
    stage.stations,
    stage.targetCps,
  ]);
  let hash = 2166136261;
  for (let index = 0; index < content.length; index++) {
    hash ^= content.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `route-${(hash >>> 0).toString(36)}`;
}

function unlockAfter(
  unlocked: Set<string>,
  stage: Stage,
  profile: InputProfile,
) {
  if (!stageSequence(stage).length) return;
  unlocked.add(recordKey(stage.id, profile));
  const next = getNextStage(stage);
  if (next) unlocked.add(recordKey(next.id, profile));
}

export function saveResult(
  progress: Progress,
  run: Run,
  stage: Stage,
): Progress {
  if (
    run.status !== "finished" ||
    run.stageId !== stage.id ||
    !(stage.isCustom
      ? isCustomStage(stage)
      : STAGES.some((item) => item.id === stage.id))
  )
    return progress;
  const stats = runStats(run, stage);
  const key = recordKey(stage.id, run.profile);
  const signature = routeSignature(stage);
  const previous = progress.records[key];
  // A failed/abandoned journey cannot replace a successful record.
  if (
    !stats.passed ||
    (previous?.routeSignature === signature && previous.score >= stats.score)
  )
    return progress;
  const unlocked = new Set(progress.unlockedRoutes);
  unlockAfter(unlocked, stage, run.profile);
  const archivedRecords = { ...progress.archivedRecords };
  if (!stage.isCustom && previous && previous.routeSignature !== signature)
    archivedRecords[`${key}:${previous.routeSignature ?? "legacy"}`] = previous;
  return {
    ...progress,
    archivedRecords,
    unlockedRoutes: [...unlocked],
    records: trimCustomRecords({
      ...progress.records,
      [key]: {
        score: stats.score,
        stars: stats.stars,
        accuracy: stats.accuracy,
        cpm: stats.cpm,
        completedAt: new Date().toISOString(),
        routeSignature: signature,
      },
    }),
  };
}

export function isStageUnlocked(
  progress: Progress,
  stage: Stage,
  profile: InputProfile = progress.profile,
): boolean {
  if (isCustomStage(stage)) return true;
  const sequence = stageSequence(stage);
  const index = sequence.findIndex((item) => item.id === stage.id);
  if (index < 0) return false;
  return (
    index === 0 ||
    progress.unlockedRoutes.includes(recordKey(stage.id, profile)) ||
    (progress.records[recordKey(sequence[index - 1].id, profile)]?.stars ?? 0) >
      0
  );
}

export function isUnlocked(
  progress: Progress,
  index: number,
  profile: InputProfile,
  countryId = "DE",
): boolean {
  const stages = getCountryStages(countryId);
  return !!stages[index] && isStageUnlocked(progress, stages[index], profile);
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

function readRecord(value: unknown): RecordEntry | undefined {
  if (!isObject(value)) return;
  const { score, stars, accuracy, cpm, completedAt } = value;
  if (
    typeof score !== "number" ||
    !Number.isFinite(score) ||
    score < 0 ||
    typeof stars !== "number" ||
    !Number.isInteger(stars) ||
    stars < 1 ||
    stars > 3 ||
    typeof accuracy !== "number" ||
    !Number.isFinite(accuracy) ||
    accuracy < 0 ||
    accuracy > 1 ||
    typeof cpm !== "number" ||
    !Number.isFinite(cpm) ||
    cpm < 0 ||
    typeof completedAt !== "string" ||
    !Number.isFinite(Date.parse(completedAt))
  )
    return;
  return {
    score,
    stars,
    accuracy,
    cpm,
    completedAt,
    ...(typeof value.routeSignature === "string"
      ? { routeSignature: value.routeSignature }
      : {}),
  };
}

export function parseProgress(
  raw: string | null,
  profile: InputProfile,
): Progress {
  if (!raw) return emptyProgress(profile);
  try {
    const value: unknown = JSON.parse(raw);
    if (
      !isObject(value) ||
      typeof value.version !== "number" ||
      ![1, 2, 3].includes(value.version) ||
      !isObject(value.records)
    )
      return emptyProgress(profile);
    const result = emptyProgress(profile);
    result.countryId = COUNTRIES.some(
      (country) => country.id === value.countryId,
    )
      ? String(value.countryId)
      : "DE";
    result.tutorialCompleted =
      value.version === 3 && value.tutorialCompleted === true;
    const unlocked = new Set<string>();
    for (const stage of STAGES) {
      for (const target of ["keyboard", "touch"] as const) {
        const key = recordKey(stage.id, target);
        if (
          value.version === 3 &&
          Array.isArray(value.unlockedRoutes) &&
          value.unlockedRoutes.includes(key)
        )
          unlocked.add(key);
        if (value.version === 3) {
          const current = readRecord(value.records[key]);
          if (current) {
            if (current.routeSignature === routeSignature(stage))
              result.records[key] = current;
            else
              result.archivedRecords[
                `${key}:${current.routeSignature ?? "legacy"}`
              ] = current;
            unlockAfter(unlocked, stage, target);
          }
          if (isObject(value.archivedRecords)) {
            for (const [archiveKey, stored] of Object.entries(
              value.archivedRecords,
            )) {
              if (!archiveKey.startsWith(`${key}:`)) continue;
              const archived = readRecord(stored);
              if (archived) {
                result.archivedRecords[archiveKey] = archived;
                unlockAfter(unlocked, stage, target);
              }
            }
          }
        } else {
          // V1 had one table; V2 separated original/simplified spelling. Both
          // versions predate the expanded city routes and remain in history.
          for (const mode of ["simplified", "original"] as const) {
            const oldKey =
              value.version === 1
                ? mode === "simplified" && stage.legacyId
                  ? `${target}:${stage.legacyId}`
                  : ""
                : `${target}:${mode}:${stage.id}`;
            if (!oldKey) continue;
            const legacy = readRecord(value.records[oldKey]);
            if (!legacy) continue;
            result.archivedRecords[`${key}:v${value.version}:${mode}`] = legacy;
            unlockAfter(unlocked, stage, target);
          }
        }
      }
    }
    if (value.version === 3) {
      const catalogIds = new Set(STAGES.map((stage) => stage.id));
      // Catalog curation must not erase a completed journey. Retired IDs stay
      // exactly as recorded in history; they never map onto replacement routes
      // or grant access to any campaign in the current catalog.
      for (const [key, stored] of Object.entries(value.records)) {
        const retired = campaignRecordKey.exec(key);
        if (!retired || catalogIds.has(retired[2])) continue;
        const record = readRecord(stored);
        if (record)
          result.archivedRecords[
            `${key}:${record.routeSignature ?? "legacy"}`
          ] = record;
      }
      if (isObject(value.archivedRecords)) {
        for (const [key, stored] of Object.entries(value.archivedRecords)) {
          const retired = campaignArchiveKey.exec(key);
          if (!retired || catalogIds.has(retired[2])) continue;
          const record = readRecord(stored);
          if (!record) continue;
          const previous = result.archivedRecords[key];
          if (!previous || record.score > previous.score)
            result.archivedRecords[key] = record;
        }
      }
      // Custom itineraries are not in the shipped catalog. Validate their
      // records separately, never using them to infer campaign completion.
      for (const [key, stored] of Object.entries(value.records)) {
        if (!customRecordKey.test(key)) continue;
        const record = readRecord(stored);
        if (record) result.records[key] = record;
      }
      result.records = trimCustomRecords(result.records);
    }
    result.unlockedRoutes = [...unlocked];
    return result;
  } catch {
    return emptyProgress(profile);
  }
}
