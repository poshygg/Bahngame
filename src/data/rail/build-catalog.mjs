// Run after the fetch: node src/data/rail/build-catalog.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

process.argv[2] = "build";
const { checkedAt, cityRows, dir, file, read } = await import("./import-osm.mjs");
const regions = JSON.parse(fs.readFileSync(path.resolve(dir, "../../../artifacts/german-regions.geojson"), "utf8")).features;
const selected = read("selected-relations.json");
const batches = fs.readdirSync(dir).filter((name) => /^(batch|recovered)-.*\.osm\.json$/.test(name));
const objects = new Map();
for (const batch of batches) for (const object of read(batch).elements) objects.set(`${object.type}/${object.id}`, object);
if (fs.existsSync(file("missing-stops.osm.json"))) for (const object of read("missing-stops.osm.json").elements) objects.set(`${object.type}/${object.id}`, object);
const keyOf = (member) => `${member.type}/${member.ref ?? member.id}`;
const stopRole = (role) => /^(stop|platform)(_(entry|exit)_only)?$/.test(role);
const parent = new Map();
const clusterLocations = new Map();
const MAX_INTERCHANGE_DIAMETER_KM = 3;
function location(object) {
  const latitude = object?.lat ?? object?.center?.lat;
  const longitude = object?.lon ?? object?.center?.lon;
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : undefined;
}
const distance = (a, b) => Math.hypot((a.latitude - b.latitude) * 111.2, (a.longitude - b.longitude) * 111.2 * Math.cos(a.latitude * Math.PI / 180));
function diameter(points) {
  let maximum = 0;
  for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) maximum = Math.max(maximum, distance(points[i], points[j]));
  return maximum;
}
function find(id) {
  if (!parent.has(id)) parent.set(id, id);
  if (parent.get(id) !== id) parent.set(id, find(parent.get(id)));
  return parent.get(id);
}
function union(a, b) {
  const x = find(a), y = find(b);
  if (x !== y) {
    parent.set(y, x);
    if (clusterLocations.has(x) || clusterLocations.has(y)) {
      clusterLocations.set(x, [...(clusterLocations.get(x) ?? []), ...(clusterLocations.get(y) ?? [])]);
      clusterLocations.delete(y);
    }
  }
}
const areas = [...objects.values()].filter((o) => o.type === "relation" && o.tags?.public_transport === "stop_area");
const groups = [...objects.values()].filter((o) => o.type === "relation" && o.tags?.public_transport === "stop_area_group");
for (const area of areas) {
  const areaKey = keyOf(area);
  for (const member of area.members) if (["node", "way", "relation"].includes(member.type)) union(areaKey, keyOf(member));
}
for (const group of groups) for (const member of group.members) if (member.type === "relation" && objects.get(keyOf(member))?.tags?.public_transport === "stop_area") union(keyOf(group), keyOf(member));

// A copied UIC tag can be wrong. Require the already mapped source clusters to
// agree spatially before accepting it as identity evidence; distance alone never
// introduces an interchange or a route connection.
for (const object of objects.values()) {
  const point = location(object);
  if (!point) continue;
  const root = find(keyOf(object));
  if (!clusterLocations.has(root)) clusterLocations.set(root, []);
  clusterLocations.get(root).push(point);
}
const uicRefs = new Map();
const rejectedUicUnions = [];
const rejectedUicPairs = new Set();
for (const object of [...objects.values()].filter((o) => o.tags?.uic_ref)) {
  const ref = object.tags.uic_ref.trim();
  if (!/^\d{7}$/.test(ref)) continue;
  const key = keyOf(object);
  const previous = uicRefs.get(ref) ?? [];
  for (const candidate of previous) {
    const a = find(candidate), b = find(key);
    if (a === b) continue;
    const aPoints = clusterLocations.get(a) ?? [], bPoints = clusterLocations.get(b) ?? [];
    const extent = aPoints.length && bPoints.length ? diameter([...aPoints, ...bPoints]) : undefined;
    if (extent !== undefined && extent <= MAX_INTERCHANGE_DIAMETER_KM) union(candidate, key);
    else {
      const pair = [a, b].sort().join("|");
      if (!rejectedUicPairs.has(pair)) {
        rejectedUicPairs.add(pair);
        rejectedUicUnions.push({ uicRef: ref, sourceIds: [candidate, key], reason: extent === undefined ? "missing source-cluster location" : "source clusters exceed interchange diameter", ...(extent === undefined ? {} : { diameterKm: extent }) });
      }
    }
  }
  previous.push(key);
  uicRefs.set(ref, previous);
}
const norm = (s) => s.toLocaleLowerCase("de").normalize("NFC").replace(/\s+/g, " ").trim();
const locatedByArea = new Map();
for (const object of objects.values()) {
  if (!location(object)) continue;
  const root = find(keyOf(object));
  if (!locatedByArea.has(root)) locatedByArea.set(root, location(object));
}

// PTv2 pairs a stop position with its platform. Only merge adjacent paired members
// when their source names agree (or both already belong to the same stop area).
for (const route of selected.map((r) => objects.get(`relation/${r.id}`)).filter(Boolean)) {
  const members = route.members.filter((m) => stopRole(m.role));
  for (let i = 1; i < members.length; i++) {
    const previous = members[i - 1], current = members[i];
    if (!previous.role.startsWith("stop") || !current.role.startsWith("platform")) continue;
    const a = objects.get(keyOf(previous)), b = objects.get(keyOf(current));
    const compatibleNames = !a?.tags?.name || !b?.tags?.name || norm(a.tags.name) === norm(b.tags.name);
    // An unfetched platform can still be an explicit member of a fetched stop
    // area. Its area's located members corroborate the same source role pair.
    const aLocation = location(a) ?? locatedByArea.get(find(keyOf(previous)));
    const bLocation = location(b) ?? locatedByArea.get(find(keyOf(current)));
    if (compatibleNames && aLocation && bLocation && distance(aLocation, bLocation) < 0.6) union(keyOf(previous), keyOf(current));
  }
}

function insideRing(point, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > point.latitude) !== (yj > point.latitude) && point.longitude < (xj - xi) * (point.latitude - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function stateAt(point) {
  return regions.find((feature) => {
    const polygons = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    return polygons.some((rings) => insideRing(point, rings[0]) && !rings.slice(1).some((ring) => insideRing(point, ring)));
  })?.properties.iso_3166_2;
}
const cities = cityRows.map(([id, stateId, en, de, latitude, longitude]) => ({ id, stateId, name: { en, de }, coordinate: { latitude, longitude } }));
function cityAt(point, stateId) {
  return cities.filter((city) => city.stateId === stateId && distance(point, city.coordinate) < 16).sort((a, b) => distance(point, a.coordinate) - distance(point, b.coordinate))[0]?.id;
}
const clusters = new Map();
for (const object of objects.values()) {
  const root = find(keyOf(object));
  if (!clusters.has(root)) clusters.set(root, []);
  clusters.get(root).push(object);
}
const clusterMemberIds = new Map();
for (const id of parent.keys()) {
  const root = find(id);
  if (!clusterMemberIds.has(root)) clusterMemberIds.set(root, []);
  clusterMemberIds.get(root).push(id);
}
const stationCache = new Map();
// Audit every final identity, including explicit stop-area/group mappings and
// paired platforms. Excluding the cluster also excludes any referencing route;
// no ambiguous intermediate stop is silently bypassed.
const ambiguousClusters = [...clusters.entries()].flatMap(([root, members]) => {
  const points = members.map(location).filter(Boolean);
  const extent = diameter(points);
  return extent > MAX_INTERCHANGE_DIAMETER_KM ? [{ root, diameterKm: extent, sourceIds: members.map(keyOf) }] : [];
});
const ambiguousRoots = new Set(ambiguousClusters.map((cluster) => cluster.root));
function stationFor(member) {
  const memberKey = keyOf(member), root = find(memberKey);
  if (ambiguousRoots.has(root)) return undefined;
  if (stationCache.has(root)) return stationCache.get(root);
  const cluster = clusters.get(root) ?? [];
  const important = [...cluster].sort((a, b) => {
    const score = (o) => o.tags?.public_transport === "stop_area_group" ? 0 : o.tags?.public_transport === "stop_area" ? 1 : o.tags?.railway === "station" ? 2 : 3;
    return score(a) - score(b) || a.id - b.id;
  });
  // A stop-area group's name can list several neighbouring interchanges. Use an
  // actual member station's source name for the typing target; retain all aliases.
  const namedAreas = important.filter((o) => o.tags?.public_transport === "stop_area" && o.tags?.name && !/^\d+$/.test(o.tags.name));
  namedAreas.sort((a, b) => Number(b.tags.train === "yes") - Number(a.tags.train === "yes") || a.id - b.id);
  // Reviewed interchange labels refer to source objects, not edited place names.
  // This keeps an entire interchange from inheriting one underground platform's
  // name while retaining the source's exact spelling and all platform aliases.
  const preferredNameObject = {
    "relation/5688523": "relation/5688517", // Berlin Hauptbahnhof
    "relation/5126108": "relation/2063908", // München Hauptbahnhof
    "relation/454147": "relation/454147", // Frankfurt airport interchange
    "relation/6875142": "relation/3097360", // Köln Hauptbahnhof mainline area
    "relation/382671": "relation/382671", // Stuttgart-Untertürkheim interchange
  }[keyOf(important[0])];
  const named = important.find((o) => keyOf(o) === preferredNameObject) ?? namedAreas[0] ?? important.find((o) => o.tags?.name && !/^\d+$/.test(o.tags.name));
  const located = important.find((o) => location(o));
  if (!named || !located) return undefined;
  const coordinate = location(located);
  const stateId = stateAt(coordinate);
  const aliases = [...new Set(cluster.map((o) => o.tags?.name).filter((name) => name && name !== named.tags.name))];
  const station = {
    id: `osm-${keyOf(important[0]).replace("/", "-")}`,
    name: named.tags.name.normalize("NFC"),
    coordinate,
    sourceUrl: `https://www.openstreetmap.org/${keyOf(named)}`,
    osmIds: (clusterMemberIds.get(root) ?? cluster.map(keyOf)).sort(),
    ...(aliases.length ? { aliases } : {}),
    ...(stateId ? { stateId } : {}),
    ...(cityAt(coordinate, stateId) ? { cityId: cityAt(coordinate, stateId) } : {}),
  };
  stationCache.set(root, station);
  return station;
}
function service(tags) {
  const ref = tags.ref.replace(/\s+/g, "");
  const matched = ref.match(/^(ICE|IC|EC|RE|RB|S|U)\d/i);
  if (matched) return matched[1].toUpperCase();
  if (tags.route === "subway") return "U";
  if (tags.route === "tram" || tags.route === "light_rail") return "tram";
  return "rail";
}
const rejected = [], lines = [], missing = new Map();
for (const summary of selected) {
  const route = objects.get(`relation/${summary.id}`);
  if (!route) { rejected.push({ id: summary.id, reason: "detail batch absent" }); continue; }
  const allMembers = route.members.filter((m) => stopRole(m.role));
  const positionRoots = new Set(allMembers.filter((m) => m.role.startsWith("stop")).map((m) => find(keyOf(m))));
  // A platform is another representation of a mapped stop position, not an
  // extra visit. Some source relations append platforms after the ordered stops.
  // Keep repeated stop positions (real loops), and keep platform-only stops.
  const members = allMembers.filter((m) => m.role.startsWith("stop") || !positionRoots.has(find(keyOf(m))));
  const stops = [], sourceStopIds = [];
  let reason;
  for (const member of members) {
    if (ambiguousRoots.has(find(keyOf(member)))) { reason = "geographically ambiguous source interchange"; continue; }
    const station = stationFor(member);
    if (!station) { missing.set(keyOf(member), member); reason = "missing named/location stop member"; continue; }
    if (stops.at(-1)?.id !== station.id) { stops.push(station); sourceStopIds.push(keyOf(member)); }
  }
  if (reason || stops.length < 2) { rejected.push({ id: summary.id, reason: reason ?? "fewer than two stops" }); continue; }
  // An unexpected tiny stop/platform leg usually indicates an unresolved pairing.
  // Reject the variant rather than inventing a connection across an ambiguous pair.
  if (stops.some((stop, i) => i && distance(stops[i - 1].coordinate, stop.coordinate) < 0.012)) { rejected.push({id:summary.id,reason:"unresolved colocated stop/platform pair"}); continue; }
  const stateIds = [...new Set(stops.flatMap((s) => s.stateId ? [s.stateId] : []))].sort();
  if (!stateIds.length) { rejected.push({ id: summary.id, reason: "no German stops" }); continue; }
  const tags = route.tags;
  const line = {
    id: `${stateIds[0]}.osm-${route.id}`,
    stateIds,
    cityIds: [...new Set(stops.flatMap((s) => s.cityId ? [s.cityId] : []))],
    ref: tags.ref.replace(/^(ICE|IC|EC|RE|RB|S|U)\s+(\d)/, "$1$2"),
    service: service(tags),
    ...(tags.operator ? { operator: tags.operator } : {}),
    ...(tags.network ? { network: tags.network } : {}),
    from: stops[0].name,
    to: stops.at(-1).name,
    stationIds: stops.map((s) => s.id),
    sourceStopIds,
    sourceUrl: `https://www.openstreetmap.org/relation/${route.id}`,
    checkedAt,
    bidirectional: false,
  };
  if ([1988255, 1988258].includes(route.id)) {
    line.dbOperator = true;
    line.officialSourceUrl = "https://spnv-qualitaet.mobil.nrw/nahverkehr-nrw/wettbewerbsnetze/";
  }
  if ([1333861, 8914670].includes(route.id)) {
    line.dbOperator = true;
    line.officialSourceUrl = "https://regional.bahn.de/regionen/niedersachsen-bremen/ueber-uns/expresskreuz";
  }
  if ([188221, 2609912, 6197056, 6197057].includes(route.id)) {
    line.dbOperator = false;
    line.officialSourceUrl = "https://www.odeg.de/fileadmin/Fahrpl%C3%A4ne_2024/2026/ODEG_26_StrFPl_RE9_Web_ab_20260501.pdf";
  }
  if (line.service === "U" && line.cityIds.includes("berlin") && /^U[1-9]$/.test(line.ref)) {
    line.officialSourceUrl = "https://www.bvg.de/de/verbindungen/linienuebersicht";
  }
  lines.push(line);
}
const used = new Set(lines.flatMap((line) => line.stationIds));
const stations = [...new Map([...stationCache.values()].filter((s) => used.has(s.id)).map((s) => [s.id, s])).values()].sort((a, b) => a.id.localeCompare(b.id));
const catalog = {
  checkedAt,
  sourceTimestamp: read("route-index.osm.json").osm3s.timestamp_osm_base,
  license: { name: "Open Database License 1.0", url: "https://opendatacommons.org/licenses/odbl/1-0/", attribution: "© OpenStreetMap contributors", sourceUrl: "https://www.openstreetmap.org/copyright" },
  states: regions.map((r) => ({ id: r.properties.iso_3166_2, name: { en: r.properties.name_en, de: r.properties.name_de } })).sort((a, b) => a.id.localeCompare(b.id)),
  cities,
  stations,
  lines,
};
fs.writeFileSync(file("catalog.generated.json"), JSON.stringify(catalog));
fs.writeFileSync(file("import-report.json"), JSON.stringify({ checkedAt, selected: selected.length, imported: lines.length, stations: stations.length, rejected, rejectedUicUnions, clusterAudit: { maximumDiameterKm: MAX_INTERCHANGE_DIAMETER_KM, clustersChecked: clusters.size, ambiguousClusters }, missing: [...missing.values()], states: catalog.states.map((s) => ({id:s.id,lines:lines.filter((l)=>l.stateIds.includes(s.id)).length,stations:stations.filter((p)=>p.stateId===s.id).length})), cities: cities.map((c) => ({id:c.id,refs:[...new Set(lines.filter((l)=>l.cityIds.includes(c.id)).map((l)=>l.ref))]})) }, null, 2));
console.log(JSON.stringify({ stations: stations.length, lines: lines.length, missing: missing.size, rejected: rejected.length, states: catalog.states.map((s)=>({id:s.id,lines:lines.filter((l)=>l.stateIds.includes(s.id)).length})), cities:cities.map((c)=>({id:c.id,refs:new Set(lines.filter((l)=>l.cityIds.includes(c.id)).map(l=>l.ref)).size})) },null,2));
