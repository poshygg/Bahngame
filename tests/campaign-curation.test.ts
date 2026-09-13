import assert from "node:assert/strict";
import test from "node:test";
import { RAIL_CATALOG } from "../src/data/rail/catalog";
import { CITY_NETWORKS } from "../src/data/germany-campaigns";
import { STATE_CORRIDORS } from "../src/data/state-corridors";
import { stateCorridorLine } from "../src/data/germanCampaignStages";
import { STAGES } from "../src/data/stages";
import { createRailStages } from "../src/data/railStages";
import { routeSignature } from "../src/game/progress";
import { createRailNetwork, findRailJourney } from "../src/game/railRouting";

test("twelve city networks have genuine S/U/Regio-S-Bahn service chapters", () => {
  assert.equal(CITY_NETWORKS.length, 12);
  for (const city of CITY_NETWORKS) {
    const stages = STAGES.filter(
      (stage) =>
        stage.journeyKind === "city" &&
        stage.networkId === city.id &&
        stage.campaignId,
    );
    assert.ok(stages.length, city.id);
    assert.ok(
      stages.some(
        (stage) =>
          ["S", "U"].includes(stage.serviceKind!) || /^RS\d/.test(stage.line),
      ),
      city.id,
    );
    assert.ok(stages.every((stage) => stage.areaName?.en === city.name.en));
  }
  assert.ok(
    STAGES.some(
      (stage) => stage.networkId === "bremen" && stage.line === "RS1",
    ),
  );
  assert.ok(
    STAGES.some(
      (stage) =>
        stage.networkId === "hanover" &&
        stage.line === "1" &&
        stage.serviceKind === "tram",
    ),
  );
});

test("all thirteen territorial states have town-to-town source corridors", () => {
  const regions = RAIL_CATALOG.states.filter(
    (state) => !["DE-BE", "DE-HH", "DE-HB"].includes(state.id),
  );
  assert.equal(STATE_CORRIDORS.length, 27);
  for (const state of regions) {
    const specs = STATE_CORRIDORS.filter((spec) => spec.stateId === state.id);
    assert.ok(specs.length >= 2, state.id);
    const stages = STAGES.filter(
      (stage) =>
        stage.journeyKind === "regional" && stage.regionIds?.includes(state.id),
    );
    assert.ok(stages.length, state.id);
    assert.ok(
      stages.every(
        (stage) =>
          stage.areaName?.en === state.name.en && stage.cityId === undefined,
      ),
    );
  }
  assert.equal(
    new Set(STAGES.flatMap((stage) => stage.regionIds ?? [])).size,
    16,
  );
});

test("regional chapters reconstruct complete contiguous in-state source slices", () => {
  const stops = new Map(RAIL_CATALOG.stations.map((stop) => [stop.id, stop]));
  for (const spec of STATE_CORRIDORS) {
    const line = stateCorridorLine(RAIL_CATALOG, spec)!;
    assert.ok(line, spec.id);
    const source = RAIL_CATALOG.lines.find(
      (entry) => entry.id === spec.lineId,
    )!;
    const start = source.stationIds.indexOf(spec.fromStationId);
    assert.deepEqual(
      line.stationIds,
      source.stationIds.slice(start, start + line.stationIds.length),
    );
    assert.ok(
      line.stationIds.every((id) => stops.get(id)?.stateId === spec.stateId),
    );
    assert.notEqual(line.from, line.to);
    assert.equal(line.sourceUrl, source.sourceUrl);
    const chapters = STAGES.filter(
      (stage) => stage.campaignId === line.id,
    ).sort((a, b) => a.chapter! - b.chapter!);
    assert.ok(chapters.length > 0, spec.id);
    assert.deepEqual(
      [chapters[0].origin, ...chapters.flatMap((stage) => stage.stations)],
      line.stationIds.map((id) => stops.get(id)!.name),
    );
    assert.ok(
      chapters.every(
        (stage) => stage.stations.length <= 8 && stage.regionIds?.length === 1,
      ),
    );
  }
});

test("an unknown-state or out-of-state intermediate stop invalidates a corridor instead of being skipped", () => {
  const spec = STATE_CORRIDORS[0];
  const line = stateCorridorLine(RAIL_CATALOG, spec)!;
  const middle = line.stationIds[1];
  for (const stateId of [undefined, "DE-BY"]) {
    const changed = {
      ...RAIL_CATALOG,
      stations: RAIL_CATALOG.stations.map((station) =>
        station.id === middle ? { ...station, stateId } : station,
      ),
    };
    assert.equal(stateCorridorLine(changed, spec), undefined);
  }
  assert.equal(
    stateCorridorLine(RAIL_CATALOG, {
      ...spec,
      fromStationId: spec.toStationId,
      toStationId: spec.fromStationId,
    }),
    undefined,
  );
});

test("retained metro and ICE campaigns preserve their original stage identity and scoring signature", () => {
  const previous = new Map(
    createRailStages(RAIL_CATALOG).map((stage) => [stage.id, stage]),
  );
  for (const stage of STAGES.filter(
    (stage) => stage.campaignId && stage.journeyKind !== "regional",
  )) {
    assert.ok(previous.has(stage.id), stage.id);
    assert.equal(
      routeSignature(stage),
      routeSignature(previous.get(stage.id)!),
    );
  }
});

test("minor-city tram services remain available to personal routing without cluttering campaign collections", () => {
  const line = RAIL_CATALOG.lines.find(
    (line) => line.service === "tram" && line.cityIds.includes("rostock"),
  )!;
  assert.ok(line);
  assert.equal(
    STAGES.some((stage) => stage.serviceId === line.id),
    false,
  );
  const journey = findRailJourney(
    createRailNetwork(RAIL_CATALOG),
    line.stationIds[0],
    line.stationIds.at(-1)!,
  );
  assert.ok(journey);
  assert.equal(RAIL_CATALOG.stations.length, 5073);
  assert.equal(RAIL_CATALOG.lines.length, 911);
});
