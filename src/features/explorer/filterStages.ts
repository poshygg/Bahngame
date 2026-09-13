import type { Stage } from "../../data/stages";
import type { Localized } from "../../data/types";

export type StageSort = "easiest" | "hardest";
export type JourneyKind = "city" | "regional" | "longDistance";
export type IndexedStage = { stage: Stage; index: number; search: string };
export const CHAPTER_PAGE_SIZE = 6;
const difficultyRank = {
  beginner: 0,
  easy: 1,
  medium: 2,
  hard: 3,
  challenge: 4,
};

export function searchText(value: string) {
  return value
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Keep catalog indices attached while filtering and sorting for the parent selection API. */
export function indexStages(
  stages: Stage[],
  regions: { id: string; name: Localized; shortName: string }[],
): IndexedStage[] {
  const regionNames = new Map(
    regions.map((region) => [
      region.id,
      `${region.name.en} ${region.name.de} ${region.shortName}`,
    ]),
  );
  return stages.map((stage, index) => {
    const text = [
      stage.id,
      stage.city,
      stage.cityId,
      stage.campaignId,
      stage.areaName?.en,
      stage.areaName?.de,
      stage.networkId,
      stage.campaignOrigin,
      stage.campaignDestination,
      stage.title.en,
      stage.title.de,
      stage.subtitle.en,
      stage.subtitle.de,
      stage.origin,
      ...stage.stations,
      stage.line,
      stage.serviceId,
      stage.serviceKind,
      stage.operator,
      ...(stage.connectionLabels ?? []),
      ...(stage.regionIds ?? []).map((id) => regionNames.get(id) ?? id),
    ]
      .filter(Boolean)
      .join(" ");
    const germanKeyboardAlias = text
      .replace(/ä/gi, "ae")
      .replace(/ö/gi, "oe")
      .replace(/ü/gi, "ue");
    const serviceAlias = [stage.line, ...(stage.connectionLabels ?? [])]
      .join(" ")
      .replace(/\b(ICE|IC|EC|RE|RB|S|U)\s+(\d+)/gi, "$1$2");
    return {
      stage,
      index,
      search: `${searchText(text)} ${searchText(germanKeyboardAlias)} ${searchText(serviceAlias)}`,
    };
  });
}

export function filterStages(
  indexed: IndexedStage[],
  options: {
    query: string;
    regionId: string | null;
    sort: StageSort;
    journeyKind?: JourneyKind | null;
    networkId?: string | null;
  },
): IndexedStage[] {
  const terms = searchText(options.query).split(" ").filter(Boolean);
  return indexed
    .filter(
      ({ stage, search }) =>
        (!options.regionId || stage.regionIds?.includes(options.regionId)) &&
        (!options.journeyKind || stage.journeyKind === options.journeyKind) &&
        (!options.networkId || stage.networkId === options.networkId) &&
        terms.every((term) => search.includes(term)),
    )
    .sort((a, b) => {
      const difficulty =
        difficultyRank[a.stage.difficulty] - difficultyRank[b.stage.difficulty];
      if (difficulty)
        return options.sort === "hardest" ? -difficulty : difficulty;
      // Catalog order already groups line chapters; stable ties also preserve legacy indices.
      return a.index - b.index;
    });
}

export function chapterPage<T>(
  items: T[],
  requestedPage: number,
  pageSize = CHAPTER_PAGE_SIZE,
) {
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(pages - 1, Math.max(0, requestedPage));
  return {
    items: items.slice(page * pageSize, (page + 1) * pageSize),
    page,
    pages,
  };
}
