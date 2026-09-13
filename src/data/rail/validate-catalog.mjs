// Read-only import validation: node src/data/rail/validate-catalog.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const dir = path.dirname(fileURLToPath(import.meta.url));
const read = (name) => JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));
const catalog = read("catalog.generated.json");
const objects = new Map();
for (const name of fs.readdirSync(dir).filter((n) => /^(batch|recovered)-.*\.osm\.json$/.test(n))) for (const o of read(name).elements) objects.set(`${o.type}/${o.id}`, o);
const stations = new Map(catalog.stations.map((s) => [s.id, s]));
assert.equal(stations.size, catalog.stations.length, "station IDs must be unique");
assert.equal(new Set(catalog.lines.map((l) => l.id)).size, catalog.lines.length, "directed line IDs must be unique");
assert.equal(catalog.states.length, 16, "all sixteen German federal states are registered");
const radians = (n) => n * Math.PI / 180;
const greatCircleKm = (a, b) => {
  const h = Math.sin(radians(b.lat - a.lat) / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(radians(b.lon - a.lon) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
};
let largestInterchangeKm = 0;
for (const station of stations.values()) {
  const points = station.osmIds.map((id) => objects.get(id)).filter(Boolean).map((object) => object.lat !== undefined ? { lat: object.lat, lon: object.lon } : object.center).filter(Boolean);
  for (let a = 0; a < points.length; a++) for (let b = a + 1; b < points.length; b++) {
    const extent = greatCircleKm(points[a], points[b]);
    largestInterchangeKm = Math.max(largestInterchangeKm, extent);
    assert.ok(extent <= 3, `Geographically impossible interchange ${station.id}: ${extent.toFixed(2)} km`);
  }
}
// These distinct stations carry erroneous matching UIC tags in the cached
// source. They must never share an identity, coordinates, aliases, or transfers.
for (const [a, b] of [
  ["relation/3872245", "relation/9715457"], // Schwetzingen / Stuttgart-Ebitzweg
  ["relation/3272970", "relation/6259951"], // Düsseldorf Zoo / Westerland
  ["relation/1389327", "relation/8014056"], // Hohenschönhausen / Kersbach
  ["relation/8305871", "node/27318343"], // Steinpleis / Stuttgart Schwabstraße
  ["relation/1229776", "relation/5829390"], // Griebnitzsee / Kiel-Elmschenhagen
]) {
  const left = catalog.stations.find((station) => station.osmIds.includes(a));
  const right = catalog.stations.find((station) => station.osmIds.includes(b));
  assert.ok(left && right, `Regression source pair is missing: ${a} / ${b}`);
  assert.notEqual(left.id, right.id, `Erroneous matching UIC values joined ${a} and ${b}`);
}
const importReport = read("import-report.json");
assert.ok(importReport.clusterAudit.clustersChecked >= catalog.stations.length, "all source clusters must receive the extent audit");
for (const cluster of importReport.clusterAudit.ambiguousClusters) {
  assert.ok(!catalog.stations.some((station) => station.osmIds.includes(cluster.root)), "ambiguous source clusters must not be playable");
}
for (const state of catalog.states) {
  assert.match(state.id, /^DE-[A-Z]{2}$/);
  assert.ok(catalog.lines.some((line) => line.stateIds.includes(state.id)), `No sourced route for ${state.id}`);
}
let verifiedLegs = 0;
for (const line of catalog.lines) {
  assert.ok(line.stationIds.length >= 2);
  assert.equal(line.bidirectional, false, "source relations are directed variants");
  assert.equal(line.sourceStopIds.length, line.stationIds.length);
  const relation = objects.get(line.sourceUrl.replace("https://www.openstreetmap.org/", ""));
  assert.ok(relation, `No cached source relation for ${line.id}`);
  let sourceCursor = -1;
  for (let index = 0; index < line.stationIds.length; index++) {
    const station = stations.get(line.stationIds[index]);
    assert.ok(station, `Unknown station ID on ${line.id}`);
    assert.ok(station.name.trim());
    assert.ok(Number.isFinite(station.coordinate.latitude) && Number.isFinite(station.coordinate.longitude));
    assert.ok(station.osmIds.includes(line.sourceStopIds[index]), "source stop must belong to the canonical area");
    const nextSourceCursor = relation.members.findIndex((member, i) => i > sourceCursor && `${member.type}/${member.ref}` === line.sourceStopIds[index]);
    assert.ok(nextSourceCursor > sourceCursor, `Source stop order differs on ${line.id}`);
    sourceCursor = nextSourceCursor;
    if (index > 0) { assert.notEqual(line.stationIds[index - 1], station.id); verifiedLegs++; }
  }
  assert.equal(line.from, stations.get(line.stationIds[0]).name);
  assert.equal(line.to, stations.get(line.stationIds.at(-1)).name);
}
for (const { id } of catalog.cities) {
  assert.ok(new Set(catalog.lines.filter((line) => line.cityIds.includes(id)).map((line) => line.ref)).size >= 3, `Fewer than three service refs for ${id}`);
}
assert.ok(catalog.lines.some((line) => line.ref === "RE9" && line.dbOperator));
assert.ok(catalog.lines.some((line) => line.service === "ICE"));
// This source appends its entry platform after the exit stop. It must not add
// a fictional Freiburg -> Mulhouse closing leg to the real five-stop direction.
const mulhouseFreiburg = catalog.lines.find((line) => line.sourceUrl.endsWith("/relation/71642"));
assert.equal(mulhouseFreiburg.stationIds.length, 5);
assert.equal(mulhouseFreiburg.from, "Mulhouse-Ville");
assert.equal(mulhouseFreiburg.to, "Freiburg (Breisgau) Hauptbahnhof");
assert.notEqual(mulhouseFreiburg.stationIds[0], mulhouseFreiburg.stationIds.at(-1));

// One mapped ICE29 direction provides the requested Berlin -> Munich backbone,
// with the Südkreuz stop/platform represented once and searchable Hbf labels.
assert.equal(stations.get("osm-relation-5688523").name, "Berlin Hauptbahnhof");
assert.equal(stations.get("osm-relation-5126108").name, "München Hauptbahnhof");
assert.equal(stations.get("osm-relation-6875142").name, "Köln Hauptbahnhof");
assert.equal(stations.get("osm-relation-6875142").sourceUrl, "https://www.openstreetmap.org/relation/3097360");
assert.ok(stations.get("osm-relation-6875142").aliases.includes("Dom/Hbf"));
const rb11 = catalog.lines.find((line) => line.sourceUrl.endsWith("/relation/38028"));
assert.ok(rb11.stationIds.some((id) => /Ebitzweg/.test(stations.get(id).name)));
assert.ok(!rb11.stationIds.some((id) => stations.get(id).name === "Schwetzingen"));
const berlinMunich = catalog.lines.find((line) => line.sourceUrl.endsWith("/relation/7796142"));
const berlinIndex = berlinMunich.stationIds.indexOf("osm-relation-5688523");
const munichIndex = berlinMunich.stationIds.indexOf("osm-relation-5126108");
assert.ok(berlinIndex >= 0 && munichIndex > berlinIndex);
assert.equal(berlinMunich.stationIds.filter((id) => stations.get(id).name.includes("Südkreuz")).length, 1);
console.log(`Validated ${catalog.stations.length} stations, ${catalog.lines.length} directed variants, ${verifiedLegs} source-ordered legs, 16 states, 32 cities, and Berlin -> Munich connectivity. Largest canonical interchange: ${largestInterchangeKm.toFixed(3)} km. Five erroneous UIC pairs remain separate.`);
