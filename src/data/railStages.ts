import type { Stage } from "./stages";
import { routeNames, type RouteStop } from "./geography";
import type { RailCatalog, RailLine, RailStation } from "./rail/types";
import { GERMAN_LANDMARKS } from "./packs/germany-landmarks";
import type { RailJourney } from "../game/railRouting";

const palette: Record<string, string> = {
  ICE: "#27658C",
  IC: "#467C89",
  EC: "#537861",
  RE: "#DE6C45",
  RB: "#B18B50",
  S: "#648659",
  U: "#426D9A",
  tram: "#997452",
  rail: "#887691",
};
function nearbySights(station: RailStation) {
  return Object.values(GERMAN_LANDMARKS).filter((sight) => {
    const dy =
      (sight.coordinate.latitude - station.coordinate.latitude) * 111.2;
    const dx =
      (sight.coordinate.longitude - station.coordinate.longitude) *
      111.2 *
      Math.cos((station.coordinate.latitude * Math.PI) / 180);
    return Math.hypot(dx, dy) < 0.9;
  });
}
export function railStop(station: RailStation): RouteStop {
  return {
    name: station.name,
    coordinate: station.coordinate,
    sourceUrl: station.sourceUrl,
    landmarks: nearbySights(station),
  };
}
const difficultyFor = (chapter: number, count: number): Stage["difficulty"] =>
  chapter === 1
    ? count <= 7
      ? "beginner"
      : "easy"
    : chapter === 2
      ? "medium"
      : chapter === 3
        ? "hard"
        : "challenge";
const cps: Record<Stage["difficulty"], number> = {
  beginner: 2.4,
  easy: 2.6,
  medium: 2.8,
  hard: 3.1,
  challenge: 3.4,
};

/** Chapters keep every consecutive source stop, sharing only their boundary stop. */
export function createRailStages(catalog: RailCatalog): Stage[] {
  const stations = new Map(
    catalog.stations.map((station) => [station.id, station]),
  );
  const cities = new Map(catalog.cities.map((city) => [city.id, city]));
  const result: Stage[] = [];
  const seen = new Set<string>();
  for (const line of catalog.lines) {
    // Opposite directions and duplicate trip variants stay in the route graph,
    // while identical stop sequences need only one campaign in the browser.
    const forwards = line.stationIds.join("|");
    const backwards = [...line.stationIds].reverse().join("|");
    const signature = `${line.network ?? line.operator ?? ""}:${line.ref}:${forwards < backwards ? forwards : backwards}`;
    if (seen.has(signature)) continue;
    const ordered = line.stationIds.map((id) => stations.get(id));
    if (ordered.length < 3 || ordered.some((station) => !station)) continue;
    seen.add(signature);
    const all = ordered as RailStation[];
    const chapterSize = 8;
    const chapters = Math.ceil((all.length - 1) / chapterSize);
    for (let chapter = 1; chapter <= chapters; chapter++) {
      const slice = all.slice(
        (chapter - 1) * chapterSize,
        chapter * chapterSize + 1,
      );
      if (slice.length < 2) continue;
      const cityId = slice.find((station) => station.cityId)?.cityId;
      const city =
        (cityId ? cities.get(cityId)?.name.de : undefined) ?? slice[0].name;
      const route = slice.map(railStop);
      const difficulty = difficultyFor(chapter, slice.length - 1);
      result.push({
        id: `DE.rail.${line.id}.${chapter}`,
        countryId: "DE",
        city,
        cityId,
        title: {
          en: `${line.ref} · Chapter ${chapter}`,
          de: `${line.ref} · Kapitel ${chapter}`,
        },
        subtitle: {
          en: `${route[0].name} → ${route.at(-1)!.name}`,
          de: `${route[0].name} → ${route.at(-1)!.name}`,
        },
        line: line.ref,
        color: palette[line.service] ?? palette.rail,
        difficulty,
        ...routeNames(route),
        route,
        routeGeometry: "schematic",
        sources: [
          line.sourceUrl,
          ...(line.officialSourceUrl ? [line.officialSourceUrl] : []),
        ],
        targetCps: cps[difficulty],
        regionIds: [
          ...new Set(
            slice
              .map((station) => station.stateId)
              .filter((id): id is string => !!id),
          ),
        ],
        campaignId: line.id,
        chapter,
        chapters,
        serviceId: line.id,
        serviceKind: line.service,
        operator: line.operator,
        connectionLabels: [line.ref],
      });
    }
  }
  return result;
}

export function customJourneyId(originId: string, destinationId: string) {
  return `custom:${encodeURIComponent(originId)}:${encodeURIComponent(destinationId)}`;
}

export function createCustomStage(journey: RailJourney): Stage {
  const route = journey.stations.map(railStop);
  const labels = journey.legs.map((leg) => leg.line.ref);
  const uniqueLabels = [...new Set(labels)];
  const difficulty: Stage["difficulty"] =
    route.length > 30
      ? "challenge"
      : route.length > 18
        ? "hard"
        : route.length > 9
          ? "medium"
          : "easy";
  return {
    id: customJourneyId(journey.origin.id, journey.destination.id),
    isCustom: true,
    countryId: "DE",
    city: "Deutschland",
    title: { en: "Your railway journey", de: "Deine Bahnreise" },
    subtitle: {
      en: `${journey.origin.name} → ${journey.destination.name}`,
      de: `${journey.origin.name} → ${journey.destination.name}`,
    },
    line: uniqueLabels.join(" → "),
    color: "#27658C",
    difficulty,
    ...routeNames(route),
    route,
    routeGeometry: "schematic",
    sources: [
      ...new Set(
        journey.legs.flatMap((leg) => [
          leg.line.sourceUrl,
          ...(leg.line.officialSourceUrl ? [leg.line.officialSourceUrl] : []),
        ]),
      ),
    ],
    targetCps: cps[difficulty],
    regionIds: [...new Set(journey.legs.flatMap((leg) => leg.line.stateIds))],
    connectionLabels: uniqueLabels,
    operator: [
      ...new Set(journey.legs.map((leg) => leg.line.operator).filter(Boolean)),
    ].join(" · "),
  };
}
