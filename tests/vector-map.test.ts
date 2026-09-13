import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  decodeMapTile,
  parentTile,
  styleFeature,
  calmMapPalette,
} from "../src/features/map/vectorStyle";
import { loadMapTile } from "../src/features/map/vectorSource";

const fixture = readFileSync("tests/fixtures/calm-map.pbf");
test("real vector geometry is projected into tile coordinates without text or imagery", () => {
  const shapes = decodeMapTile(fixture);
  assert.equal(shapes.length, 1);
  assert.equal(shapes[0].fill, calmMapPalette.water);
  assert.equal(
    shapes[0].d,
    "M64.00,64.00L192.00,64.00L192.00,192.00L64.00,192.00L64.00,64.00Z",
  );
});
test("the calm map keeps water and transport context while excluding clutter", () => {
  assert.ok(styleFeature("water", {}, 3));
  assert.ok(styleFeature("transportation", { class: "primary" }, 2));
  assert.ok(styleFeature("transportation", { class: "rail" }, 2));
  for (const layer of [
    "building",
    "housenumber",
    "poi",
    "place",
    "transportation_name",
  ])
    assert.equal(styleFeature(layer, {}, 3), null);
  assert.equal(styleFeature("transportation", { class: "path" }, 2), null);
});
test("overzoom uses the correct parent and quadrant without shifting geography", () => {
  assert.deepEqual(parentTile({ z: 15, x: 15, y: 13 }, 14), {
    z: 14,
    x: 7,
    y: 6,
    viewBox: "128 128 128 128",
  });
  assert.deepEqual(parentTile({ z: 12, x: 15, y: 13 }, 14), {
    z: 12,
    x: 15,
    y: 13,
    viewBox: "0 0 256 256",
  });
});
test("visible child tiles share downloads, cached geometry and retry after network failures", async () => {
  const original = globalThis.fetch;
  const requests: string[] = [];
  let failNext = false;
  globalThis.fetch = (async (url) => {
    const address = String(url);
    requests.push(address);
    if (address.endsWith("/planet"))
      return new Response(
        JSON.stringify({
          tiles: ["https://tiles.openfreemap.org/test/{z}/{x}/{y}.pbf"],
          maxzoom: 14,
        }),
      );
    if (failNext) {
      failNext = false;
      return new Response("", { status: 503 });
    }
    return new Response(fixture);
  }) as typeof fetch;
  try {
    const [a, b] = await Promise.all([
      loadMapTile({ z: 15, x: 20, y: 20 }),
      loadMapTile({ z: 15, x: 21, y: 20 }),
    ]);
    assert.equal(requests.length, 2); // One TileJSON, one shared parent PBF.
    assert.equal(a.shapes, b.shapes);
    assert.notEqual(a.viewBox, b.viewBox);
    await loadMapTile({ z: 15, x: 20, y: 20 });
    assert.equal(requests.length, 2);
    failNext = true;
    await assert.rejects(loadMapTile({ z: 14, x: 99, y: 99 }));
    const recovered = await loadMapTile({ z: 14, x: 99, y: 99 });
    assert.equal(recovered.shapes.length, 1);
    assert.equal(requests.length, 4);
  } finally {
    globalThis.fetch = original;
  }
});
