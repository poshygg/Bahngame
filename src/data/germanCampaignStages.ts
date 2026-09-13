import type { Stage } from "./stages";
import type { RailCatalog, RailLine, RailStation } from "./rail/types";
import { createRailStages } from "./railStages";
import { CITY_NETWORKS, type CityNetwork } from "./germany-campaigns";
import { STATE_CORRIDORS, type StateCorridorSpec } from "./state-corridors";

const LONG_DISTANCE = new Set(["ICE", "IC", "EC"]);

/** This chooses a display collection for a sourced service; it never makes an edge. */
export function cityNetworkForLine(
  line: RailLine,
  stations: Map<string, RailStation>,
): CityNetwork | undefined {
  const suburban =
    /^RS\s*\d/i.test(line.ref) && line.cityIds.includes("bremen");
  const numberedStadtbahn =
    line.service === "tram" &&
    ((line.cityIds.includes("cologne") && line.ref === "18") ||
      (line.cityIds.includes("hanover") &&
        ["1", "2", "3", "4"].includes(line.ref)));
  if (!["S", "U"].includes(line.service) && !suburban && !numberedStadtbahn)
    return undefined;
  // S6/S11 span both collections; keep Cologne's sourced S-Bahn services with
  // Cologne instead of letting the larger Rhine-Ruhr discovery buckets absorb them.
  if (line.service === "S" && line.cityIds.includes("cologne"))
    return CITY_NETWORKS.find((network) => network.id === "cologne");
  let chosen: CityNetwork | undefined;
  let mostStops = 0;
  for (const network of CITY_NETWORKS) {
    const count = line.stationIds.filter((id) => {
      const cityId = stations.get(id)?.cityId;
      return cityId && network.cityIds.includes(cityId);
    }).length;
    if (count > mostStops) {
      chosen = network;
      mostStops = count;
    }
  }
  return chosen;
}

/** Inclusive, contiguous source slice. A foreign/unknown-state stop invalidates the slice. */
export function stateCorridorLine(
  catalog: RailCatalog,
  spec: StateCorridorSpec,
): RailLine | undefined {
  const source = catalog.lines.find((line) => line.id === spec.lineId);
  if (!source || !["RE", "RB"].includes(source.service)) return undefined;
  const from = source.stationIds.indexOf(spec.fromStationId);
  const to = source.stationIds.indexOf(spec.toStationId, from + 1);
  if (from < 0 || to <= from) return undefined;
  const stationIds = source.stationIds.slice(from, to + 1);
  const stops = new Map(
    catalog.stations.map((station) => [station.id, station]),
  );
  if (
    stationIds.length < 3 ||
    stationIds.some((id) => stops.get(id)?.stateId !== spec.stateId)
  )
    return undefined;
  return {
    ...source,
    id: `state.${spec.id}`,
    stationIds,
    sourceStopIds: source.sourceStopIds?.slice(from, to + 1),
    from: stops.get(spec.fromStationId)!.name,
    to: stops.get(spec.toStationId)!.name,
    stateIds: [spec.stateId],
    cityIds: [],
  };
}

/** Curated campaign views are independent of the complete personal-routing graph. */
export function createGermanCampaignStages(catalog: RailCatalog): Stage[] {
  const stations = new Map(
    catalog.stations.map((station) => [station.id, station]),
  );
  const lines = new Map(catalog.lines.map((line) => [line.id, line]));
  const networks = new Map<string, CityNetwork>();
  for (const line of catalog.lines) {
    const network = cityNetworkForLine(line, stations);
    if (network) networks.set(line.id, network);
  }
  const cityStages = createRailStages({
    ...catalog,
    lines: catalog.lines.filter((line) => networks.has(line.id)),
  }).map((stage): Stage => {
    const network = networks.get(stage.serviceId!)!;
    const source = lines.get(stage.serviceId!)!;
    return {
      ...stage,
      journeyKind: "city",
      networkId: network.id,
      city: network.name.de,
      areaName: network.name,
      campaignOrigin: source.from,
      campaignDestination: source.to,
    };
  });
  const stateStages = STATE_CORRIDORS.flatMap((spec): Stage[] => {
    const line = stateCorridorLine(catalog, spec);
    const state = catalog.states.find((entry) => entry.id === spec.stateId);
    if (!line || !state) return [];
    return createRailStages({ ...catalog, lines: [line] }).map((stage) => ({
      ...stage,
      journeyKind: "regional",
      city: state.name.de,
      cityId: undefined,
      areaName: state.name,
      regionIds: [state.id],
      serviceId: spec.lineId,
      campaignOrigin: line.from,
      campaignDestination: line.to,
    }));
  });
  const longDistanceStages = createRailStages({
    ...catalog,
    lines: catalog.lines.filter((line) => LONG_DISTANCE.has(line.service)),
  }).map((stage): Stage => {
    const source = lines.get(stage.serviceId!)!;
    return {
      ...stage,
      journeyKind: "longDistance",
      areaName: {
        en: "Germany & beyond",
        de: "Deutschland und darüber hinaus",
      },
      campaignOrigin: source.from,
      campaignDestination: source.to,
    };
  });
  return [...cityStages, ...stateStages, ...longDistanceStages];
}
