import { InputProfile, STAGES, type Stage } from "../data/stages";
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

export type PlayerProfile = {
  id: string;
  nickname: string;
  totalScore: number;
  createdAt: string;
  lastSeenAt: string;
};

export type TerritoryClaim = {
  areaId: string;
  stageId: string;
  ownerId: string;
  city: string;
  claimedAt: string;
  laps: number;
  score: number;
};

export type Progress = {
  version: 4;
  records: Record<string, RecordEntry>;
  archivedRecords: Record<string, RecordEntry>;
  unlockedRoutes: string[];
  /** Runtime platform only. A stored value never overrides detected hardware. */
  profile: InputProfile;
  countryId: string;
  tutorialCompleted: boolean;
  players: PlayerProfile[];
  activePlayerId: string;
  playerRecords: Record<string, Record<string, RecordEntry>>;
  playerArchivedRecords: Record<string, Record<string, RecordEntry>>;
  playerUnlockedRoutes: Record<string, string[]>;
  territoryOwners: Record<string, string>;
  territoryClaims: Record<string, TerritoryClaim>;
};

const MAX_CUSTOM_RECORDS = 100;
const MAX_PLAYERS = 20;
const DEFAULT_NICKNAME = "Traveler";

const customId = /^custom:[^\s]{1,200}$/;
const customRecordKey = /^(keyboard|touch):custom:[^\s]{1,200}$/;

function now() {
  return new Date().toISOString();
}

function sanitizeNickname(name: string) {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 20)
    .replace(/^\s+|\s+$/g, "");
}

function createPlayerId() {
  return `player-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function territoryAreaKey(stage: Stage) {
  const cityId =
    stage.cityId ?? stage.city?.toLowerCase().replace(/[^a-z0-9]+/gi, "-") ?? stage.id;
  return `${stage.countryId}:${cityId}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

const isCustomStage = (stage: Stage): boolean =>
  stage.isCustom === true && customId.test(stage.id);

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

function trimCustomRecords(records: Record<string, RecordEntry>) {
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

function emptyPlayerState() {
  return {
    records: {},
    archivedRecords: {},
    unlockedRoutes: [],
  };
}

function defaultPlayer(profile: InputProfile): Progress {
  const created = now();
  const id = createPlayerId();
  const player = {
    id,
    nickname: DEFAULT_NICKNAME,
    totalScore: 0,
    createdAt: created,
    lastSeenAt: created,
  };
  const records = {} as Record<string, RecordEntry>;
  return {
    version: 4,
    records,
    archivedRecords: {},
    unlockedRoutes: [],
    profile,
    countryId: "DE",
    tutorialCompleted: false,
    players: [player],
    activePlayerId: id,
    playerRecords: { [id]: records },
    playerArchivedRecords: { [id]: {} },
    playerUnlockedRoutes: { [id]: [] },
    territoryOwners: {},
    territoryClaims: {},
  };
}

export const emptyProgress = (profile: InputProfile): Progress => defaultPlayer(profile);

export const recordKey = (stageId: string, profile: InputProfile) =>
  `${profile}:${stageId}`;

export function playerById(progress: Progress, playerId: string) {
  return progress.players.find((player) => player.id === playerId);
}

export function totalPlayers(progress: Progress) {
  return progress.players.length;
}

export function playerTerritoryClaimCount(
  progress: Progress,
  playerId: string,
): number {
  return Object.values(progress.territoryOwners).filter((ownerId) => ownerId === playerId)
    .length;
}

function territoryMode(stage: Stage) {
  return stage.gameMode === "territory";
}

/** Scoring still targets the same station typing pattern while using route signature. */
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

function unlockToProfile(progress: Progress, profile: InputProfile): string[] {
  const map = new Set<string>(progress.unlockedRoutes);
  return [...map];
}

export function getNextStage(stage: Stage): Stage | undefined {
  const sequence = stageSequence(stage);
  const index = sequence.findIndex((item) => item.id === stage.id);
  return index < 0 ? undefined : sequence[index + 1];
}

function syncActiveProfileBuckets(progress: Progress): Progress {
  const activeId =
    progress.players.some((player) => player.id === progress.activePlayerId)
      ? progress.activePlayerId
      : progress.players[0]?.id;
  if (!activeId) return defaultPlayer(progress.profile);
  return {
    ...progress,
    activePlayerId: activeId,
    records: progress.playerRecords[activeId] ?? {},
    archivedRecords: progress.playerArchivedRecords[activeId] ?? {},
    unlockedRoutes: progress.playerUnlockedRoutes[activeId] ?? [],
    players: progress.players.map((player) =>
      player.id === activeId
        ? { ...player, lastSeenAt: now() }
        : player,
    ),
  };
}

function persistActiveProfileBuckets(progress: Progress): Progress {
  const activeId = progress.activePlayerId;
  if (!activeId) return syncActiveProfileBuckets(progress);
  return {
    ...progress,
    playerRecords: {
      ...progress.playerRecords,
      [activeId]: progress.records,
    },
    playerArchivedRecords: {
      ...progress.playerArchivedRecords,
      [activeId]: progress.archivedRecords,
    },
    playerUnlockedRoutes: {
      ...progress.playerUnlockedRoutes,
      [activeId]: progress.unlockedRoutes,
    },
    players: progress.players.map((player) =>
      player.id === activeId ? { ...player, lastSeenAt: now() } : player,
    ),
  };
}

function applyPlayerBuckets(progress: Progress, playerId: string): Progress {
  const playerRecords = progress.playerRecords[playerId] ?? {};
  const playerArchivedRecords = progress.playerArchivedRecords[playerId] ?? {};
  const playerUnlocked = progress.playerUnlockedRoutes[playerId] ?? [];
  return {
    ...progress,
    records: playerRecords,
    archivedRecords: playerArchivedRecords,
    unlockedRoutes: playerUnlocked,
    activePlayerId: playerId,
  };
}

function ensurePlayerRecordBuckets(progress: Progress, playerId: string): Progress {
  return {
    ...progress,
    playerRecords: {
      ...progress.playerRecords,
      [playerId]: progress.playerRecords[playerId] ?? {},
    },
    playerArchivedRecords: {
      ...progress.playerArchivedRecords,
      [playerId]: progress.playerArchivedRecords[playerId] ?? {},
    },
    playerUnlockedRoutes: {
      ...progress.playerUnlockedRoutes,
      [playerId]: progress.playerUnlockedRoutes[playerId] ?? [],
    },
  };
}

function setPlayerTotal(progress: Progress, playerId: string, total: number) {
  return {
    ...progress,
    players: progress.players.map((player) =>
      player.id === playerId
        ? { ...player, totalScore: Math.max(0, Math.round(total)) }
        : player,
    ),
  };
}

function addPlayerScore(progress: Progress, playerId: string, delta: number): Progress {
  const player = playerById(progress, playerId);
  if (!player || !delta) return progress;
  return setPlayerTotal(progress, playerId, player.totalScore + delta);
}

export function setActivePlayer(
  progress: Progress,
  playerId: string,
): Progress {
  const prepared = persistActiveProfileBuckets(ensurePlayerRecordBuckets(progress, playerId));
  if (!prepared.players.some((player) => player.id === playerId)) return progress;
  return syncActiveProfileBuckets(applyPlayerBuckets(prepared, playerId));
}

export function createPlayer(progress: Progress, nickname: string): Progress {
  const prepared = persistActiveProfileBuckets(progress);
  if (prepared.players.length >= MAX_PLAYERS) return prepared;
  const clean = sanitizeNickname(nickname) || `Player ${prepared.players.length + 1}`;
  const id = createPlayerId();
  const created = now();
  const profile: PlayerProfile = {
    id,
    nickname: clean,
    totalScore: 0,
    createdAt: created,
    lastSeenAt: created,
  };
  return syncActiveProfileBuckets({
    ...prepared,
    players: [...prepared.players, profile],
    playerRecords: {
      ...prepared.playerRecords,
      [id]: {},
    },
    playerArchivedRecords: {
      ...prepared.playerArchivedRecords,
      [id]: {},
    },
    playerUnlockedRoutes: {
      ...prepared.playerUnlockedRoutes,
      [id]: [],
    },
    activePlayerId: id,
    records: {},
    archivedRecords: {},
    unlockedRoutes: [],
  });
}

export function renamePlayer(
  progress: Progress,
  playerId: string,
  nickname: string,
): Progress {
  const prepared = persistActiveProfileBuckets(progress);
  const clean = sanitizeNickname(nickname);
  if (!clean) return prepared;
  const exists = prepared.players.some(
    (player) =>
      player.id !== playerId &&
      player.nickname.toLowerCase() === clean.toLowerCase(),
  );
  if (exists) return prepared;
  return {
    ...prepared,
    players: prepared.players.map((player) =>
      player.id === playerId
        ? {
            ...player,
            nickname: clean,
            lastSeenAt: now(),
          }
        : player,
    ),
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

export function isTerritoryStageOwned(
  progress: Progress,
  stage: Stage,
): string | undefined {
  return progress.territoryOwners[territoryAreaKey(stage)];
}

export function saveResult(progress: Progress, run: Run, stage: Stage): Progress {
  if (
    run.status !== "finished" ||
    run.stageId !== stage.id ||
    !(stage.isCustom ? isCustomStage(stage) : STAGES.some((item) => item.id === stage.id))
  )
    return progress;

  const prepared = persistActiveProfileBuckets(syncActiveProfileBuckets(progress));
  const activePlayerId = prepared.activePlayerId;
  const player = playerById(prepared, activePlayerId);
  if (!player) return prepared;

  const stats = runStats(run, stage);
  const key = recordKey(stage.id, run.profile);
  const signature = run.profile ? routeSignature(stage) : "";

  const playerRecords = {
    ...(prepared.playerRecords[activePlayerId] ?? {}),
  };
  const playerArchived = {
    ...(prepared.playerArchivedRecords[activePlayerId] ?? {}),
  };
  const unlocked = new Set(prepared.unlockedRoutes);

  const previous = playerRecords[key];
  const isCampaign = !isCustomStage(stage);
  const shouldStoreRecord =
    stats.passed &&
    (!previous ||
      previous.routeSignature !== signature ||
      previous.score < stats.score);

  if (!stats.passed && !territoryMode(stage)) return prepared;

  let territoryOwners = { ...prepared.territoryOwners };
  let territoryClaims = { ...prepared.territoryClaims };
  let territoryTransferDelta = 0;

  if (territoryMode(stage) && stats.passed && stats.lapsCompleted >= 1) {
    const area = territoryAreaKey(stage);
    const previousOwner = territoryOwners[area];
    const areaClaimReward = 300;
    if (previousOwner !== activePlayerId) {
      territoryTransferDelta += areaClaimReward;
      territoryOwners[area] = activePlayerId;
      territoryClaims[area] = {
        areaId: area,
        stageId: stage.id,
        ownerId: activePlayerId,
        city: stage.city,
        claimedAt: now(),
        laps: stats.lapsCompleted,
        score: stats.score,
      };
      if (previousOwner && previousOwner !== activePlayerId) {
        const victim = playerById(prepared, previousOwner);
        if (victim) {
          territoryTransferDelta -= areaClaimReward;
        }
      }
    }
  }

  let totalProgress = prepared;
  if (shouldStoreRecord && isCampaign) {
    if (previous && previous.routeSignature !== signature)
      playerArchived[`${key}:${previous.routeSignature ?? "legacy"}`] = previous;

    playerRecords[key] = {
      score: stats.score,
      stars: stats.stars,
      accuracy: stats.accuracy,
      cpm: stats.cpm,
      completedAt: now(),
      routeSignature: signature,
    };
    if (!isCustomStage(stage)) unlockAfter(unlocked, stage, run.profile);

    const sequence = stageSequence(stage);
    const index = sequence.findIndex((item) => item.id === stage.id);
    if (index >= 0 && index + 1 < sequence.length)
      unlockAfter(unlocked, sequence[index + 1], run.profile);
  } else if (stats.passed && territoryMode(stage)) {
    // Territory runs still unlock route progression even if personal best doesn't improve.
    unlockAfter(unlocked, stage, run.profile);
  }

  const best =
    previous && previous.routeSignature === signature
      ? previous.score
      : previous?.routeSignature === "legacy"
        ? 0
        : 0;
  const rawDelta = shouldStoreRecord ? Math.max(0, stats.score - best) : 0;
  const territoryDelta = territoryTransferDelta;

  totalProgress = {
    ...totalProgress,
    records: trimCustomRecords(playerRecords),
    archivedRecords: playerArchived,
    unlockedRoutes: [...unlocked],
    territoryOwners,
    territoryClaims,
  };

  if (isCampaign) {
    totalProgress = {
      ...totalProgress,
      playerRecords: {
        ...totalProgress.playerRecords,
        [activePlayerId]: totalProgress.records,
      },
      playerArchivedRecords: {
        ...totalProgress.playerArchivedRecords,
        [activePlayerId]: totalProgress.archivedRecords,
      },
      playerUnlockedRoutes: {
        ...totalProgress.playerUnlockedRoutes,
        [activePlayerId]: totalProgress.unlockedRoutes,
      },
    };
  }

  const withPlayerDelta =
    addPlayerScore(totalProgress, activePlayerId, rawDelta + territoryDelta);
  if (territoryMode(stage) && territoryTransferDelta < 0) {
    const priorOwner = territoryOwners[territoryAreaKey(stage)]
      ? territoryOwners[territoryAreaKey(stage)]
      : undefined;
    if (priorOwner && priorOwner !== activePlayerId)
      return addPlayerScore(withPlayerDelta, priorOwner, territoryTransferDelta);
  }
  return withPlayerDelta;
}

function readPlayers(input: unknown): PlayerProfile[] {
  if (!Array.isArray(input)) return [];
  const players = input
    .map((entry) => {
      if (!isObject(entry)) return undefined;
      const { id, nickname, totalScore, createdAt, lastSeenAt } = entry;
      if (
        typeof id !== "string" ||
        !id ||
        typeof nickname !== "string" ||
        !nickname.trim() ||
        typeof totalScore !== "number" ||
        !Number.isFinite(totalScore) ||
        totalScore < 0 ||
        typeof createdAt !== "string" ||
        !Number.isFinite(Date.parse(createdAt)) ||
        typeof lastSeenAt !== "string" ||
        !Number.isFinite(Date.parse(lastSeenAt))
      )
        return undefined;
      return {
        id,
        nickname: sanitizeNickname(nickname) || DEFAULT_NICKNAME,
        totalScore: Math.max(0, Math.floor(totalScore)),
        createdAt,
        lastSeenAt,
      } as PlayerProfile;
    })
    .filter((item): item is PlayerProfile => !!item);
  return [...new Map(players.map((item) => [item.id, item])).values()];
}

function migrateLegacyRecords(
  value: unknown,
  profile: InputProfile,
  unlocked: Set<string>,
): {
  playerRecords: Record<string, RecordEntry>;
  playerArchived: Record<string, RecordEntry>;
} {
  const resultRecords: Record<string, RecordEntry> = {};
  const resultArchived: Record<string, RecordEntry> = {};
  let legacyIndex = 0;
  for (const stage of STAGES) {
    for (const target of ["keyboard", "touch"] as const) {
      for (const keyMode of ["simplified", "original"] as const) {
        const legacyKey =
          (value as Record<string, unknown>)?.legacyVersion === 1
            ? keyMode === "simplified" && stage.legacyId
              ? `${target}:${stage.legacyId}`
              : ""
            : `${target}:${keyMode}:${stage.id}`;
        if (!legacyKey) continue;
        const legacy = readRecord((value as Record<string, Record<unknown>>)?.records?.[legacyKey]);
        if (!legacy) continue;
        const profileKey = recordKey(stage.id, target);
        if (target === profile)
          resultArchived[`${profileKey}:legacy-${keyMode}-${legacyIndex++}`] = legacy;
      }

      if (value && isObject((value as Record<string, unknown>).records)) {
        const key = recordKey(stage.id, target);
        const stageRecord = readRecord(
          (value as Record<string, Record<unknown>>).records?.[key],
        );
        if (stageRecord) {
          if (stageRecord.routeSignature === routeSignature(stage))
            resultRecords[key] = stageRecord;
          else
            resultArchived[
              `${key}:${stageRecord.routeSignature ?? "legacy"}`
            ] = stageRecord;
          if (isCampaignRecord(profile, stageRecord, stage, target))
            unlockAfter(unlocked, stage, target);
        }
      }

      if (value && value.version === 3 && isObject((value as Record<string, unknown>).archivedRecords)) {
        for (const [archiveKey, stored] of Object.entries(
          (value as Record<string, Record<string, unknown>>).archivedRecords,
        )) {
          if (!archiveKey.startsWith(`${recordKey(stage.id, target)}:`)) continue;
          const archived = readRecord(stored);
          if (archived) resultArchived[archiveKey] = archived;
        }
      }
    }
  }
  return {
    playerRecords: resultRecords,
    playerArchived: resultArchived,
  };
}

function isCampaignRecord(
  profile: InputProfile,
  record: RecordEntry | undefined,
  stage: Stage,
  target: InputProfile,
) {
  if (!record) return false;
  return (
    target === profile &&
    record.routeSignature === routeSignature(stage) &&
    Number.isFinite(record.score)
  );
}

export function parseProgress(
  raw: string | null,
  profile: InputProfile,
): Progress {
  if (!raw) return emptyProgress(profile);
  try {
    const value: unknown = JSON.parse(raw);
    if (!isObject(value) || typeof value.version !== "number")
      return emptyProgress(profile);

    const base = emptyProgress(profile);
    base.countryId = COUNTRIES.some(
      (country) => country.id === value.countryId,
    )
      ? String(value.countryId)
      : "DE";
    base.tutorialCompleted =
      value.version === 4 && value.tutorialCompleted === true;

    if (value.version === 4) {
      const loadedPlayers = readPlayers(value.players);
      const players = loadedPlayers.length
        ? loadedPlayers
        : [
            {
              id: createPlayerId(),
              nickname: DEFAULT_NICKNAME,
              totalScore: 0,
              createdAt: now(),
              lastSeenAt: now(),
            },
          ];
      const activePlayerId =
        players.find((player) => player.id === value.activePlayerId)?.id ?? players[0].id;
      const playerRecords = isObject(value.playerRecords)
        ? Object.fromEntries(
            Object.entries(value.playerRecords as Record<string, unknown>).map(
              ([playerId, bucket]) => {
                if (!isObject(bucket)) return [playerId, {} as Record<string, RecordEntry>];
                const entries = Object.entries(bucket)
                  .map(([key, stored]) => [key, readRecord(stored)] as const)
                  .filter(([, item]): item is RecordEntry => !!item)
                  .filter(
                    ([key]) =>
                      typeof key === "string" &&
                      key.startsWith(`${profile}:`) &&
                      key.length > profile.length + 1,
                  )
                  .sort(() => 0)
                  .map(([key, record]) => [key, record]);
                return [
                  playerId,
                  Object.fromEntries(entries),
                ];
              },
            ),
          )
        : {};
      const playerArchivedRecords = isObject(value.playerArchivedRecords)
        ? Object.fromEntries(
            Object.entries(
              value.playerArchivedRecords as Record<string, unknown>,
            ).map(([playerId, bucket]) => {
              if (!isObject(bucket)) return [playerId, {} as Record<string, RecordEntry>];
              return [
                playerId,
                Object.fromEntries(
                  Object.entries(bucket)
                    .map(([key, stored]) => [key, readRecord(stored)] as const)
                    .filter(([, item]): item is RecordEntry => !!item),
                ),
              ];
            }),
          )
        : {};
      const playerUnlockedRoutes = isObject(value.playerUnlockedRoutes)
        ? Object.fromEntries(
            Object.entries(value.playerUnlockedRoutes as Record<string, unknown>).map(
              ([playerId, unlocks]) => [
                playerId,
                Array.isArray(unlocks)
                  ? unlocks.filter((item) => typeof item === "string")
                  : [],
              ],
            ),
          )
        : {};

      const territoryOwners = isObject(value.territoryOwners)
        ? Object.fromEntries(
            Object.entries(value.territoryOwners as Record<string, unknown>)
              .map(([area, owner]) => [area, typeof owner === "string" ? owner : ""])
              .filter(([, owner]) => owner),
          )
        : {};
      const territoryClaims = isObject(value.territoryClaims)
        ? Object.fromEntries(
            Object.entries(value.territoryClaims as Record<string, unknown>)
              .map(([area, claim]) => {
                if (!isObject(claim)) return null;
                const {
                  areaId,
                  stageId,
                  ownerId,
                  city,
                  claimedAt,
                  laps,
                  score,
                } = claim;
                if (
                  typeof areaId !== "string" ||
                  typeof stageId !== "string" ||
                  typeof ownerId !== "string" ||
                  typeof city !== "string" ||
                  typeof claimedAt !== "string" ||
                  !Number.isFinite(Date.parse(claimedAt)) ||
                  typeof laps !== "number" ||
                  typeof score !== "number" ||
                  !Number.isFinite(score)
                )
                  return null;
                return [
                  area,
                  {
                    areaId,
                    stageId,
                    ownerId,
                    city,
                    claimedAt,
                    laps,
                    score,
                  } as TerritoryClaim,
                ];
              })
              .filter((entry): entry is [string, TerritoryClaim] => !!entry),
          )
        : {};

      const recordsForActive =
        playerRecords[activePlayerId] ?? {};
      const archivedForActive =
        playerArchivedRecords[activePlayerId] ?? {};
      const unlockedForActive = playerUnlockedRoutes[activePlayerId] ?? [];

      return syncActiveProfileBuckets({
        ...base,
        countryId: base.countryId,
        tutorialCompleted: base.tutorialCompleted,
        players,
        activePlayerId,
        playerRecords: playerRecords ?? {},
        playerArchivedRecords: playerArchivedRecords ?? {},
        playerUnlockedRoutes: playerUnlockedRoutes ?? {},
        records: recordsForActive,
        archivedRecords: archivedForActive,
        unlockedRoutes: unlockedForActive,
        territoryOwners,
        territoryClaims,
      });
    }

    // v1~v3 migration into first player.
    const player = playerById(base, base.activePlayerId)!;
    const unlocked = new Set(base.unlockedRoutes);
    const migrated = migrateLegacyRecords(
      {
        legacyVersion: value.version,
        records:
          isObject((value as Record<string, unknown>).records)
            ? (value as Record<string, unknown>).records
            : {},
      },
      profile,
      unlocked,
    );

    const customEntries = isObject((value as Record<string, unknown>).records)
      ? Object.entries(
          (value as Record<string, Record<string, unknown>>).records,
        ).filter(([key]) => customRecordKey.test(key))
      : [];
    const customRecords: Record<string, RecordEntry> = {};
    const customArchived: Record<string, RecordEntry> = {};
    for (const [key, stored] of customEntries) {
      const parsed = readRecord(stored);
      if (!parsed) continue;
      if (key.startsWith(`${profile}:`) && parsed.routeSignature !== undefined)
        customRecords[key] = parsed;
      else customArchived[`${key}:legacy`] = parsed;
    }

    const playerRecords = {
      ...trimCustomRecords(customRecords),
      ...migrated.playerRecords,
    };
    const playerArchived = {
      ...migrated.playerArchived,
      ...customArchived,
    };

    return syncActiveProfileBuckets({
      ...base,
      players: [
        {
          ...player,
          totalScore: Object.values(playerRecords)
            .filter((record) => record.stars >= 1 && record.score > 0)
            .reduce((sum, record) => sum + record.score, 0),
        },
      ],
      unlockedRoutes: [...unlocked],
      playerRecords: {
        [player.id]: trimCustomRecords(playerRecords),
      },
      playerArchivedRecords: {
        [player.id]: playerArchived,
      },
      playerUnlockedRoutes: {
        [player.id]: [...unlocked],
      },
      records: trimCustomRecords(playerRecords),
      archivedRecords: playerArchived,
      territoryOwners: {},
      territoryClaims: {},
    });
  } catch {
    return emptyProgress(profile);
  }
}
