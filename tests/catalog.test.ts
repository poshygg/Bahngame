import assert from "node:assert/strict";
import test from "node:test";
import { COUNTRIES } from "../src/data/countries";
import { routeNames, type GeoPoint } from "../src/data/geography";
import { STAGES } from "../src/data/stages";
import {
  createRun,
  runStats,
  typeCharacter,
  typingTargets,
} from "../src/game/engine";
import { TUTORIAL_STAGE } from "../src/features/tutorial/tutorialStage";

function distanceKm(a: GeoPoint, b: GeoPoint) {
  const radians = (v: number) => (v * Math.PI) / 180;
  const lat = radians(b.latitude - a.latitude);
  const lon = radians(b.longitude - a.longitude);
  const h =
    Math.sin(lat / 2) ** 2 +
    Math.cos(radians(a.latitude)) *
      Math.cos(radians(b.latitude)) *
      Math.sin(lon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

test("every catalog stage has one consistent ordered map and typing itinerary", () => {
  assert.equal(new Set(STAGES.map((stage) => stage.id)).size, STAGES.length);
  for (const stage of STAGES) {
    assert.equal(
      COUNTRIES.find((country) => country.id === stage.countryId)?.status,
      "available",
    );
    assert.deepEqual(routeNames(stage.route), {
      origin: stage.origin,
      stations: stage.stations,
    });
    assert.ok(stage.sources.length, `${stage.id} has an operator source`);
    assert.equal(stage.routeGeometry, "schematic");
    for (const stop of stage.route) {
      assert.match(
        stop.sourceUrl ?? "",
        /^https:\/\/www\.openstreetmap\.org\/(node|way|relation)\/\d+$/,
      );
    }
  }
});

test("city routes contain many stops and keep all coordinates and sights near their city", () => {
  const cities: Record<string, GeoPoint> = {
    "DE.berlin": { latitude: 52.52, longitude: 13.405 },
    "DE.hamburg": { latitude: 53.55, longitude: 10.0 },
    "DE.munich": { latitude: 48.145, longitude: 11.57 },
    "DE.cologne": { latitude: 50.94, longitude: 6.95 },
    "DE.frankfurt": { latitude: 50.12, longitude: 8.675 },
  };
  for (const [id, city] of Object.entries(cities)) {
    const stage = STAGES.find((stage) => stage.id === id)!;
    assert.ok(
      stage.stations.length >= 10,
      `${id} has at least ten destinations`,
    );
    const sights = stage.route.flatMap((stop) => stop.landmarks ?? []);
    assert.ok(sights.length >= 3, `${id} has at least three sights`);
    for (const [index, stop] of stage.route.entries()) {
      assert.ok(
        distanceKm(city, stop.coordinate) < 15,
        `${id}: ${stop.name} is in the city`,
      );
      if (index) {
        assert.ok(
          distanceKm(stage.route[index - 1].coordinate, stop.coordinate) < 3.5,
          `${id}: no accidental distant station between consecutive city stops`,
        );
      }
      for (const sight of stop.landmarks ?? []) {
        assert.ok(
          distanceKm(stop.coordinate, sight.coordinate) < 1.5,
          `${sight.id} is near its station`,
        );
        assert.ok(
          sight.name.en &&
            sight.name.de &&
            sight.description.en &&
            sight.description.de,
        );
        assert.match(sight.sourceUrl, /^https:\/\//);
        assert.match(
          sight.coordinateSourceUrl ?? "",
          /^https:\/\/www\.openstreetmap\.org\//,
        );
      }
    }
  }
});

test("every real station spelling, including punctuation and accents, is playable", () => {
  for (const stage of STAGES) {
    let run = createRun(stage, "keyboard");
    for (const station of typingTargets(stage)) {
      for (const character of station) {
        run = typeCharacter(run, stage, character);
        assert.equal(
          run.mistakes,
          0,
          `${stage.id}: ${station}, rejected ${JSON.stringify(character)}`,
        );
      }
    }
    assert.equal(run.finishReason, "arrived", stage.id);
    assert.equal(run.mistakes, 0, stage.id);
    assert.equal(runStats(run, stage).stars, 3, stage.id);
  }
});

test("tutorial is a short real geographic journey outside the scored catalog", () => {
  assert.equal(TUTORIAL_STAGE.stations.length, 2);
  assert.equal(TUTORIAL_STAGE.route.length, 3);
  assert.equal(
    STAGES.some((stage) => stage.id === TUTORIAL_STAGE.id),
    false,
  );
  assert.deepEqual(routeNames(TUTORIAL_STAGE.route), {
    origin: TUTORIAL_STAGE.origin,
    stations: TUTORIAL_STAGE.stations,
  });
  assert.ok(TUTORIAL_STAGE.stations.some((name) => /[äöüß]/i.test(name)));
});

test("content validation rejects impossible or incomplete map points", () => {
  assert.throws(() => routeNames([]), /origin and a destination/);
  assert.throws(
    () =>
      routeNames([
        { name: "Origin", coordinate: { latitude: 52, longitude: 13 } },
        {
          name: "Invalid",
          coordinate: { latitude: Number.NaN, longitude: 13 },
        },
      ]),
    /Invalid route stop/,
  );
});
