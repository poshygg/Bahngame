import type { Localized } from "./types";
import { RAIL_CATALOG } from "./rail/catalog";
import { createGermanCampaignStages } from "./germanCampaignStages";
import { CITY_NETWORKS } from "./germany-campaigns";
import { routeNames, type RouteStop } from "./geography";
import {
  berlinRoute,
  hamburgRoute,
  munichRoute,
  cologneRoute,
  frankfurtRoute,
  grandTourRoute,
} from "./packs/germany";
export type InputProfile = "keyboard" | "touch";
export type GameMode = "train" | "walk" | "territory";

export type Stage = {
  id: string;
  countryId: string;
  legacyId?: string;
  city: string;
  title: Localized;
  subtitle: Localized;
  line: string;
  color: string;
  difficulty: "beginner" | "easy" | "medium" | "hard" | "challenge";
  origin: string;
  stations: string[];
  /** Origin first, followed by every destination, in typing order. */
  route: RouteStop[];
  /** The line connects real locations; it is not a railway track trace. */
  routeGeometry: "schematic";
  sources: string[];
  targetCps: number;
  regionIds?: string[];
  cityId?: string;
  campaignId?: string;
  chapter?: number;
  chapters?: number;
  serviceId?: string;
  serviceKind?: string;
  operator?: string;
  isCustom?: boolean;
  connectionLabels?: string[];
  journeyKind?: "city" | "regional" | "longDistance";
  areaName?: Localized;
  networkId?: string;
  campaignOrigin?: string;
  campaignDestination?: string;
  gameMode?: GameMode;
  /** Optional walk/competitive variant config */
  territoryTargetLaps?: number;
  /** Optional stage-specific timing multiplier (used for walk and territory variants). */
  timeMultiplier?: number;
};

// Add a new content pack here; game rules and renderers do not contain city data.
// Itineraries follow regular network connections, not live service/timetables.
const INTRO_STAGES: Stage[] = [
  {
    id: "DE.berlin",
    countryId: "DE",
    legacyId: "berlin",
    city: "Berlin",
    title: {
      en: "Berlin, the first departure",
      de: "Berlin, die erste Abfahrt",
    },
    subtitle: {
      en: "Along the Spree, into the heart of the city.",
      de: "An der Spree entlang, mitten in die Stadt.",
    },
    line: "01",
    color: "#DE6C45",
    difficulty: "beginner",
    ...routeNames(berlinRoute),
    route: berlinRoute,
    routeGeometry: "schematic",
    sources: ["https://sbahn.berlin/app/v4/liniennetz/s3/"],
    targetCps: 2.4,
  },
  {
    id: "DE.hamburg",
    countryId: "DE",
    legacyId: "hamburg",
    city: "Hamburg",
    title: { en: "An afternoon in Hamburg", de: "Ein Nachmittag in Hamburg" },
    subtitle: {
      en: "A little journey through the harbour city.",
      de: "Eine kleine Reise durch die Hafenstadt.",
    },
    line: "02",
    color: "#547C85",
    difficulty: "easy",
    ...routeNames(hamburgRoute),
    route: hamburgRoute,
    routeGeometry: "schematic",
    sources: [
      "https://www.hvv.de/resource/blob/73098/439fcd76010fe3b7332774dc1b41fc2e/hvv_linienfahrplan_U3.pdf",
    ],
    targetCps: 2.6,
  },
  {
    id: "DE.munich",
    countryId: "DE",
    legacyId: "munich",
    city: "München",
    title: { en: "The old squares of Munich", de: "Münchens alte Plätze" },
    subtitle: {
      en: "Follow the rails to the old town squares.",
      de: "Auf Schienen zu den Plätzen der Altstadt.",
    },
    line: "03",
    color: "#7E8460",
    difficulty: "medium",
    ...routeNames(munichRoute),
    route: munichRoute,
    routeGeometry: "schematic",
    sources: [
      "https://www.mvg.de/dam/jcr%3A6ec4cb8c-46c8-4f87-90ec-b1578c56b0df/mvv-gesamtfahrplan-2026.pdf",
    ],
    targetCps: 2.8,
  },
  {
    id: "DE.cologne",
    countryId: "DE",
    legacyId: "cologne",
    city: "Köln",
    title: {
      en: "Cologne, from squares to gardens",
      de: "Köln, von Plätzen zu Gärten",
    },
    subtitle: {
      en: "Past the cathedral, towards the Flora gardens.",
      de: "Am Dom vorbei, zu den Gärten der Flora.",
    },
    line: "04",
    color: "#B18B50",
    difficulty: "medium",
    ...routeNames(cologneRoute),
    route: cologneRoute,
    routeGeometry: "schematic",
    sources: ["https://www.kvb.koeln/haltestellen/showline/0/18"],
    targetCps: 3.0,
  },
  {
    id: "DE.frankfurt",
    countryId: "DE",
    legacyId: "frankfurt",
    city: "Frankfurt",
    title: { en: "The Frankfurt express", de: "Der Frankfurt-Express" },
    subtitle: {
      en: "Find your rhythm in a city on the move.",
      de: "Finde deinen Rhythmus in einer bewegten Stadt.",
    },
    line: "05",
    color: "#887691",
    difficulty: "hard",
    ...routeNames(frankfurtRoute),
    route: frankfurtRoute,
    routeGeometry: "schematic",
    sources: ["https://www.rmv.de/c/de/start/vgf/fahrplaene-und-netzplaene"],
    targetCps: 3.2,
  },
  {
    id: "DE.grand-tour",
    countryId: "DE",
    legacyId: "grand-tour",
    city: "Deutschland",
    title: { en: "The German grand tour", de: "Die große Deutschlandreise" },
    subtitle: {
      en: "Six cities. One final, wonderful journey.",
      de: "Sechs Städte. Eine letzte, wunderbare Reise.",
    },
    line: "06",
    color: "#466A60",
    difficulty: "challenge",
    ...routeNames(grandTourRoute),
    route: grandTourRoute,
    routeGeometry: "schematic",
    sources: ["https://www.bahnhof.de/"],
    targetCps: 3.5,
  },
];

const introRegions: Record<
  string,
  { regionIds: string[]; cityId: string; line: string; serviceKind: string }
> = {
  "DE.berlin": {
    regionIds: ["DE-BE"],
    cityId: "berlin",
    line: "S3",
    serviceKind: "S",
  },
  "DE.hamburg": {
    regionIds: ["DE-HH"],
    cityId: "hamburg",
    line: "U3",
    serviceKind: "U",
  },
  "DE.munich": {
    regionIds: ["DE-BY"],
    cityId: "munich",
    line: "U2 → U3",
    serviceKind: "U",
  },
  "DE.cologne": {
    regionIds: ["DE-NW"],
    cityId: "cologne",
    line: "18",
    serviceKind: "tram",
  },
  "DE.frankfurt": {
    regionIds: ["DE-HE"],
    cityId: "frankfurt",
    line: "U4 → U7 → U1/2/3/8",
    serviceKind: "U",
  },
  "DE.grand-tour": {
    regionIds: ["DE-BE", "DE-HH", "DE-NI", "DE-NW", "DE-HE", "DE-BW", "DE-BY"],
    cityId: "germany",
    line: "Grand tour",
    serviceKind: "rail",
  },
};
const createWalkStage = (stage: Stage): Stage => {
  const campaignId = stage.campaignId
    ? `${stage.campaignId}.walk`
    : `${stage.id}.walk`;
  return {
    ...stage,
    id: `${stage.id}.walk`,
    gameMode: "walk",
    campaignId,
    line: `W-${stage.line}`,
    title: {
      en: `Walking · ${stage.title.en}`,
      de: `Zu Fuß · ${stage.title.de}`,
    },
    subtitle: {
      en: stage.subtitle.en
        ? `${stage.subtitle.en} (Walking challenge)`
        : "Walk the same route without rail transport.",
      de: stage.subtitle.de
        ? `${stage.subtitle.de} (Fußweg-Challenge)`
        : "Schreite dieselbe Strecke zu Fuß zurück.",
    },
    targetCps: Math.max(1.4, stage.targetCps * 0.65),
    timeMultiplier: 1.45,
  };
};

const createTerritoryStage = (stage: Stage): Stage => {
  const campaignId = stage.campaignId
    ? `${stage.campaignId}.territory`
    : `${stage.id}.territory`;
  return {
    ...stage,
    id: `${stage.id}.territory`,
    gameMode: "territory",
    campaignId,
    line: `T-${stage.line}`,
    title: {
      en: `Territory · ${stage.title.en}`,
      de: `Beutegebiet · ${stage.title.de}`,
    },
    subtitle: {
      en: "Capture the loop by returning to the start before the timer ends.",
      de: "Erobere das Gebiet, indem du den Loop vor Ablauf der Zeit wieder erreichst.",
    },
    targetCps: stage.targetCps,
    timeMultiplier: 1.85,
    territoryTargetLaps: 1,
    campaignId,
  };
};

const BASE_STAGES: Stage[] = [
  ...INTRO_STAGES.map((stage): Stage => {
    const region = introRegions[stage.id];
    const network = CITY_NETWORKS.find((entry) =>
      entry.cityIds.includes(region.cityId),
    );
    return {
      ...stage,
      ...region,
      journeyKind: stage.id === "DE.grand-tour" ? "longDistance" : "city",
      areaName: network?.name ?? { en: "Germany", de: "Deutschland" },
      networkId: network?.id,
      campaignOrigin: stage.origin,
      campaignDestination: stage.stations.at(-1),
    };
  }),
  ...createGermanCampaignStages(RAIL_CATALOG),
];

export const STAGES: Stage[] = [
  ...BASE_STAGES,
  ...BASE_STAGES.filter((stage) => !stage.isCustom).map(createWalkStage),
  ...BASE_STAGES.filter((stage) => !stage.isCustom).map(createTerritoryStage),
];
