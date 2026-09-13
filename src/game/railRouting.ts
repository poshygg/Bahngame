import type { RailCatalog, RailLine, RailStation } from "../data/rail/types";

export type RailLeg = { line: RailLine; stationIds: string[] };
export type RailJourney = {
  origin: RailStation;
  destination: RailStation;
  stations: RailStation[];
  legs: RailLeg[];
  transfers: number;
};
type Edge = { to: string; line: RailLine };
export type RailNetwork = {
  stations: Map<string, RailStation>;
  edges: Map<string, Edge[]>;
};

/** Connections come only from consecutive source-mapped stops, never proximity. */
export function createRailNetwork(catalog: RailCatalog): RailNetwork {
  const stations = new Map(
    catalog.stations.map((station) => [station.id, station]),
  );
  const edges = new Map<string, Edge[]>();
  const add = (from: string, to: string, line: RailLine) => {
    if (from === to || !stations.has(from) || !stations.has(to)) return;
    const list = edges.get(from) ?? [];
    if (!list.some((edge) => edge.to === to && edge.line.id === line.id))
      list.push({ to, line });
    edges.set(from, list);
  };
  for (const line of catalog.lines) {
    for (let i = 1; i < line.stationIds.length; i++) {
      add(line.stationIds[i - 1], line.stationIds[i], line);
      if (line.bidirectional)
        add(line.stationIds[i], line.stationIds[i - 1], line);
    }
  }
  return { stations, edges };
}

type QueueItem = {
  key: string;
  stationId: string;
  lineId: string;
  transfers: number;
  hops: number;
};
const compare = (a: QueueItem, b: QueueItem) =>
  a.transfers - b.transfers || a.hops - b.hops;
class MinQueue {
  private items: QueueItem[] = [];
  get size() {
    return this.items.length;
  }
  push(value: QueueItem) {
    this.items.push(value);
    let index = this.items.length - 1;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (compare(this.items[parent], value) <= 0) break;
      this.items[index] = this.items[parent];
      index = parent;
    }
    this.items[index] = value;
  }
  pop(): QueueItem {
    const result = this.items[0];
    const last = this.items.pop()!;
    if (this.items.length) {
      let index = 0;
      while (index * 2 + 1 < this.items.length) {
        let child = index * 2 + 1;
        if (
          child + 1 < this.items.length &&
          compare(this.items[child + 1], this.items[child]) < 0
        )
          child++;
        if (compare(last, this.items[child]) <= 0) break;
        this.items[index] = this.items[child];
        index = child;
      }
      this.items[index] = last;
    }
    return result;
  }
}

/** Fewest line changes, then fewest stops. This is not a timetable/fastest-trip search. */
export function findRailJourney(
  network: RailNetwork,
  originId: string,
  destinationId: string,
): RailJourney | null {
  const origin = network.stations.get(originId),
    destination = network.stations.get(destinationId);
  if (!origin || !destination || originId === destinationId) return null;
  const queue = new MinQueue();
  const first = {
    key: `${originId}\0`,
    stationId: originId,
    lineId: "",
    transfers: 0,
    hops: 0,
  };
  queue.push(first);
  const best = new Map<string, QueueItem>([[first.key, first]]);
  const previous = new Map<
    string,
    { key: string; from: string; to: string; line: RailLine }
  >();
  let last: QueueItem | undefined;
  while (queue.size) {
    const current = queue.pop();
    if (best.get(current.key) !== current) continue;
    if (current.stationId === destinationId) {
      last = current;
      break;
    }
    for (const edge of network.edges.get(current.stationId) ?? []) {
      const next = {
        key: `${edge.to}\0${edge.line.id}`,
        stationId: edge.to,
        lineId: edge.line.id,
        transfers:
          current.transfers +
          (current.lineId && current.lineId !== edge.line.id ? 1 : 0),
        hops: current.hops + 1,
      };
      const known = best.get(next.key);
      if (known && compare(known, next) <= 0) continue;
      best.set(next.key, next);
      previous.set(next.key, {
        key: current.key,
        from: current.stationId,
        to: edge.to,
        line: edge.line,
      });
      queue.push(next);
    }
  }
  if (!last) return null;
  const steps: { from: string; to: string; line: RailLine }[] = [];
  for (let key = last.key; key !== first.key;) {
    const step = previous.get(key);
    if (!step) return null;
    steps.push(step);
    key = step.key;
  }
  steps.reverse();
  const legs: RailLeg[] = [];
  for (const step of steps) {
    const leg = legs[legs.length - 1];
    if (leg?.line.id === step.line.id) leg.stationIds.push(step.to);
    else legs.push({ line: step.line, stationIds: [step.from, step.to] });
  }
  return {
    origin,
    destination,
    stations: [origin, ...steps.map((step) => network.stations.get(step.to)!)],
    legs,
    transfers: last.transfers,
  };
}

export function normalizeRailSearch(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .replace(/\bhauptbahnhof\b/g, "hbf")
    .replace(/[,()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stationSearchNames(station: RailStation) {
  return [station.name, ...(station.aliases ?? [])].flatMap((name) => [
    normalizeRailSearch(name),
    normalizeRailSearch(
      name.replace(/ä/gi, "ae").replace(/ö/gi, "oe").replace(/ü/gi, "ue"),
    ),
  ]);
}

export function searchRailStations(
  stations: RailStation[],
  query: string,
  limit = 8,
): RailStation[] {
  const search = normalizeRailSearch(query);
  return stations
    .filter(
      (station) =>
        !search ||
        stationSearchNames(station).some((name) => name.includes(search)),
    )
    .sort((a, b) => {
      const rank = (station: RailStation) => {
        const names = stationSearchNames(station);
        return names.includes(search)
          ? 0
          : names.some((name) => name.startsWith(search))
            ? 1
            : 2;
      };
      return (
        rank(a) - rank(b) ||
        a.name.localeCompare(b.name, "de") ||
        a.id.localeCompare(b.id)
      );
    })
    .slice(0, limit);
}
