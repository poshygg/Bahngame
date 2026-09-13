import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceMotion,
  createRoutePath,
  distanceAt,
  followViewport,
  initialMotion,
  samplePath,
  sampleTrainPose,
} from "../src/features/map/motion";
import { placeStationLabels } from "../src/features/map/labelLayout";
import { stationLookahead } from "../src/features/map/readAhead";
import { STAGES } from "../src/data/stages";
import {
  fitViewport,
  interpolate,
  project,
  TILE_SIZE,
  toViewport,
  visibleTiles,
} from "../src/features/map/projection";

test("Web Mercator aligns the origin with the middle of the world tile", () => {
  assert.deepEqual(project({ latitude: 0, longitude: 0 }, 0), {
    x: 128,
    y: 128,
  });
  const north = project({ latitude: 52.52, longitude: 13.405 }, 12);
  const south = project({ latitude: 48.137, longitude: 11.576 }, 12);
  assert.ok(north.y < south.y);
  assert.ok(north.x > south.x);
  assert.ok(Number.isFinite(project({ latitude: 90, longitude: 0 }, 5).y));
});

test("route fitting keeps real station coordinates inside both phone and desktop viewports", () => {
  const stops = [
    { latitude: 52.5251, longitude: 13.3694 },
    { latitude: 52.5219, longitude: 13.4111 },
    { latitude: 52.5048, longitude: 13.4501 },
  ];
  for (const [width, height] of [
    [320, 230],
    [920, 480],
  ]) {
    const viewport = fitViewport(stops, width, height);
    for (const stop of stops) {
      const point = toViewport(stop, viewport);
      assert.ok(point.x >= 0 && point.x <= width);
      assert.ok(point.y >= 0 && point.y <= height);
    }
  }
});

test("visible tiles cover the viewport without downloading an offscreen ring", () => {
  const viewport = fitViewport(
    [{ latitude: 52.52, longitude: 13.405 }],
    700,
    350,
  );
  const tiles = visibleTiles(viewport);
  assert.ok(tiles.length <= 12);
  for (const tile of tiles) {
    assert.ok(tile.left < viewport.width && tile.left + TILE_SIZE > 0);
    assert.ok(tile.top < viewport.height && tile.top + TILE_SIZE > 0);
  }
  const atBoundary = visibleTiles({
    width: 256,
    height: 256,
    left: 256,
    top: 256,
    zoom: 3,
  });
  assert.equal(atBoundary.length, 1);
  assert.equal(atBoundary[0].key, "3/1/1");
});

test("the train advances on the current geographic segment and clamps bad progress", () => {
  const from = { x: 100, y: 220 };
  const to = { x: 200, y: 140 };
  assert.deepEqual(interpolate(from, to, 0.25), { x: 125, y: 200 });
  assert.deepEqual(interpolate(from, to, -1), from);
  assert.deepEqual(interpolate(from, to, 2), to);
  assert.deepEqual(interpolate(from, to, Number.NaN), from);
});

test("a station boundary is a continuous world position and camera position", () => {
  const path = createRoutePath([
    { x: 100, y: 100 },
    { x: 500, y: 100 },
    { x: 550, y: 300 },
  ]);
  const before = samplePath(path, distanceAt(path, 0.99999));
  const arrived = samplePath(path, distanceAt(path, 1));
  const departing = samplePath(path, distanceAt(path, 1.00001));
  assert.ok(Math.hypot(arrived.x - before.x, arrived.y - before.y) < 0.01);
  assert.ok(
    Math.hypot(departing.x - arrived.x, departing.y - arrived.y) < 0.01,
  );
  const cameraBefore = followViewport(path.points[0], before, 600, 400, 14);
  const cameraAfter = followViewport(path.points[0], departing, 600, 400, 14);
  assert.equal(cameraBefore.zoom, cameraAfter.zoom);
  assert.ok(Math.abs(cameraAfter.left - cameraBefore.left) < 0.02);
  assert.ok(Math.abs(cameraAfter.top - cameraBefore.top) < 0.02);
});

test("rapid typing visits every station in order and visibly dwells before final settlement", () => {
  const path = createRoutePath(
    Array.from({ length: 13 }, (_, index) => ({
      x: index * 300,
      y: index % 2 ? 30 : 0,
    })),
  );
  let motion = initialMotion();
  const arrivals: number[] = [];
  let elapsed = 0;
  let finalDwellSeen = false;
  while ((motion.position < 12 || motion.dwellMs > 0) && elapsed < 5000) {
    const previous = motion;
    motion = advanceMotion(motion, 12, path, 16);
    if (motion.arrivedAt !== previous.arrivedAt)
      arrivals.push(motion.arrivedAt);
    if (motion.position === 12 && motion.dwellMs > 0) finalDwellSeen = true;
    assert.ok(motion.position >= previous.position);
    assert.ok(motion.position <= Math.floor(previous.position + 1e-9) + 1);
    elapsed += 16;
  }
  assert.deepEqual(
    arrivals,
    Array.from({ length: 12 }, (_, index) => index + 1),
  );
  assert.equal(finalDwellSeen, true);
  assert.equal(motion.position, 12);
  assert.equal(motion.dwellMs, 0);
  assert.ok(elapsed < 3000, `Visual catch-up took ${elapsed}ms`);
});

test("large background-frame delays cannot teleport across route vertices", () => {
  const path = createRoutePath([
    { x: 0, y: 0 },
    { x: 200, y: 0 },
    { x: 200, y: 200 },
  ]);
  const next = advanceMotion(initialMotion(), 2, path, 60_000);
  assert.ok(next.position <= 1);
  assert.deepEqual(next, advanceMotion(initialMotion(), 2, path, 50));
});

test("carriages follow separate headings around a route bend", () => {
  const path = createRoutePath([
    { x: 0, y: 0 },
    { x: 200, y: 0 },
    { x: 200, y: 200 },
  ]);
  const cab = samplePath(path, 225);
  const carriage = samplePath(path, 165);
  assert.equal(cab.heading, 90);
  assert.equal(carriage.heading, 0);
  assert.deepEqual({ x: cab.x, y: cab.y }, { x: 200, y: 25 });
  assert.deepEqual({ x: carriage.x, y: carriage.y }, { x: 165, y: 0 });
  assert.equal(sampleTrainPose(path, 200).heading, 45);
});

test("station label plates avoid each other and the train", () => {
  const train = { x: 210, y: 150, width: 130, height: 70 };
  const plates = placeStationLabels(
    [
      { id: 1, text: "Savignyplatz", x: 320, y: 180 },
      { id: 0, text: "Charlottenburg", x: 180, y: 180 },
    ],
    600,
    350,
    [train],
  );
  assert.equal(plates.length, 2);
  assert.deepEqual(plates[0].lines, ["Savignyplatz"]);
  const intersects = (a: typeof train, b: typeof train) =>
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y;
  assert.equal(intersects(plates[0], plates[1]), false);
  assert.ok(plates.every((plate) => !intersects(plate, train)));
});

test("read-ahead exposes both typing destinations before any train movement", () => {
  const stage = STAGES[0];
  const beforeTyping = stationLookahead(stage, 0);
  assert.equal(beforeTyping.current?.name, "Savignyplatz");
  assert.equal(beforeTyping.following?.name, "Zoologischer Garten");
  const nextWord = stationLookahead(stage, 1);
  assert.equal(nextWord.current?.name, "Zoologischer Garten");
  assert.equal(nextWord.following?.name, "Tiergarten");
  assert.equal(nextWord.current?.routeIndex, 2);
});

test("offscreen read-ahead retains full names and the final stop has no invented successor", () => {
  const stage = STAGES.find((entry) => entry.id === "DE.grand-tour")!;
  const preview = stationLookahead(stage, 0, {
    left: 0,
    top: 0,
    width: 320,
    height: 190,
    zoom: 14,
  });
  assert.equal(preview.current?.name, "Hamburg Hauptbahnhof");
  assert.ok(preview.following?.name.includes("Hauptbahnhof"));
  assert.ok(preview.current?.offscreenArrow);
  assert.equal(
    stationLookahead(stage, stage.stations.length - 1).following,
    undefined,
  );
  assert.equal(
    stationLookahead(stage, stage.stations.length).current,
    undefined,
  );
});

test("long map station names wrap without abbreviation or ellipsis", () => {
  const name = "Frankfurt (Main) Flughafen Fernbahnhof";
  const [plate] = placeStationLabels(
    [{ id: 1, text: name, x: 90, y: 160 }],
    200,
    350,
    [],
  );
  assert.equal(plate.text, name);
  assert.equal(plate.lines.join(" "), name);
  assert.ok(plate.lines.length > 1);
  assert.equal(plate.text.includes("…"), false);
});
