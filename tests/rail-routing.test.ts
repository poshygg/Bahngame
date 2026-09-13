import assert from "node:assert/strict";
import test from "node:test";
import type {
  RailCatalog,
  RailLine,
  RailStation,
} from "../src/data/rail/types";
import {
  createRailNetwork,
  findRailJourney,
  searchRailStations,
} from "../src/game/railRouting";
import { createCustomStage, createRailStages } from "../src/data/railStages";
import {
  createRun,
  runStats,
  typeCharacter,
  typingTargets,
} from "../src/game/engine";

const station = (id: string, name = `Station ${id}`): RailStation => ({
  id,
  name,
  coordinate: {
    latitude: 52 + Number(id.replace(/\D/g, "") || 0) / 100,
    longitude: 13,
  },
  sourceUrl: "https://www.openstreetmap.org/node/1",
  osmIds: [id],
  stateId: "DE-BE",
});
const line = (
  id: string,
  stationIds: string[],
  bidirectional = false,
): RailLine => ({
  id,
  ref: id,
  service: "RE",
  stationIds,
  bidirectional,
  from: stationIds[0],
  to: stationIds.at(-1)!,
  stateIds: ["DE-BE"],
  cityIds: ["berlin"],
  sourceUrl: "https://www.openstreetmap.org/relation/1",
  checkedAt: "2026-09-13",
});
const catalog = (stations: RailStation[], lines: RailLine[]): RailCatalog => ({
  stations,
  lines,
  states: [{ id: "DE-BE", name: { en: "Berlin", de: "Berlin" } }],
  cities: [
    {
      id: "berlin",
      stateId: "DE-BE",
      name: { en: "Berlin", de: "Berlin" },
      coordinate: stations[0].coordinate,
    },
  ],
  checkedAt: "2026-09-13",
  license: {
    name: "Test fixture",
    url: "https://example.com",
    sourceUrl: "https://example.com",
    attribution: "Synthetic routing test data",
  },
});

test("custom routes preserve actual consecutive stops and explicit direction", () => {
  const network = createRailNetwork(
    catalog(
      [station("a"), station("b"), station("c")],
      [line("RE9", ["a", "b", "c"])],
    ),
  );
  const result = findRailJourney(network, "a", "c")!;
  assert.deepEqual(
    result.stations.map((item) => item.id),
    ["a", "b", "c"],
  );
  assert.equal(result.legs[0].line.ref, "RE9");
  assert.equal(result.transfers, 0);
  assert.equal(findRailJourney(network, "c", "a"), null);
  assert.equal(findRailJourney(network, "a", "a"), null);
  assert.equal(findRailJourney(network, "missing", "c"), null);
});

test("reverse journeys exist only when the source has a reverse edge", () => {
  const network = createRailNetwork(
    catalog(
      [station("a"), station("b"), station("c")],
      [line("RE9", ["a", "b", "c"], true)],
    ),
  );
  assert.deepEqual(
    findRailJourney(network, "c", "a")!.stations.map((item) => item.id),
    ["c", "b", "a"],
  );
});

test("routing prefers fewer line changes, then fewer stops, without claiming travel time", () => {
  const data = catalog(
    ["a", "b", "c", "d", "x", "y"].map((id) => station(id)),
    [
      line("direct", ["a", "b", "c", "d"]),
      line("short1", ["a", "x"]),
      line("short2", ["x", "d"]),
      line("longer", ["a", "b", "c", "y", "d"]),
    ],
  );
  const result = findRailJourney(createRailNetwork(data), "a", "d")!;
  assert.deepEqual(
    result.legs.map((leg) => leg.line.ref),
    ["direct"],
  );
  assert.equal(result.stations.length, 4);
});

test("a verified station interchange connects lines but identical nearby coordinates do not", () => {
  const stations = ["a", "b", "c", "b-other"].map((id) => station(id));
  const connected = createRailNetwork(
    catalog(stations, [line("RE9", ["a", "b"]), line("ICE", ["b", "c"])]),
  );
  const result = findRailJourney(connected, "a", "c")!;
  assert.equal(result.transfers, 1);
  assert.deepEqual(
    result.legs.map((leg) => leg.stationIds),
    [
      ["a", "b"],
      ["b", "c"],
    ],
  );
  const disconnected = createRailNetwork(
    catalog(stations, [line("RE9", ["a", "b"]), line("ICE", ["b-other", "c"])]),
  );
  assert.equal(findRailJourney(disconnected, "a", "c"), null);
});

test("chapters preserve all ordered stops and separate opposite directions only in routing", () => {
  const stations = Array.from({ length: 22 }, (_, index) =>
    station(String(index)),
  );
  const ids = stations.map((item) => item.id);
  const stages = createRailStages(
    catalog(stations, [
      line("RE9", ids),
      { ...line("RE9-return", [...ids].reverse()), ref: "RE9" },
    ]),
  );
  assert.equal(stages.length, 3);
  assert.deepEqual(
    stages.map((stage) => stage.chapter),
    [1, 2, 3],
  );
  assert.ok(
    stages.every((stage) => stage.chapters === 3 && stage.line === "RE9"),
  );
  assert.deepEqual(
    [stages[0].origin, ...stages.flatMap((stage) => stage.stations)],
    stations.map((item) => item.name),
  );
  assert.equal(stages[1].origin, stages[0].stations.at(-1));
});

test("different stop order is not mistaken for the same campaign", () => {
  const stations = ["a", "b", "c", "d"].map((id) => station(id));
  const stages = createRailStages(
    catalog(stations, [
      line("one", ["a", "b", "c", "d"]),
      { ...line("two", ["a", "c", "b", "d"]), ref: "one" },
    ]),
  );
  assert.equal(stages.length, 2);
});

test("custom journeys are playable with the normal spelling bonus and scoring engine", () => {
  const data = catalog(
    [
      station("a", "Start"),
      station("b", "München"),
      station("c", "Friedrichstraße"),
    ],
    [line("RE9", ["a", "b", "c"])],
  );
  const journey = findRailJourney(createRailNetwork(data), "a", "c")!;
  const stage = createCustomStage(journey);
  assert.equal(stage.isCustom, true);
  assert.match(stage.id, /^custom:/);
  assert.deepEqual(stage.connectionLabels, ["RE9"]);
  let run = createRun(stage, "keyboard");
  for (const name of typingTargets(stage))
    for (const char of name) run = typeCharacter(run, stage, char);
  assert.equal(run.finishReason, "arrived");
  assert.equal(run.originalCharacters, 2);
  assert.equal(runStats(run, stage).stars, 3);
});

test("station search handles accents and preserves distinct same-name stations", () => {
  const stations = [
    station("1", "München Hauptbahnhof"),
    station("2", "Köln Hauptbahnhof"),
    station("3", "München Hauptbahnhof"),
  ];
  assert.deepEqual(
    searchRailStations(stations, "munchen").map((item) => item.id),
    ["1", "3"],
  );
  assert.equal(searchRailStations(stations, "koln")[0].id, "2");
  assert.equal(searchRailStations(stations, "muenchen hbf")[0].id, "1");
  assert.equal(searchRailStations(stations, "Köln Hbf")[0].id, "2");
  assert.equal(searchRailStations(stations, "nothing").length, 0);
});
