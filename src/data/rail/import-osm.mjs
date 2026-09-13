// One-off snapshot importer. Public Overpass is never called by the game.
// Run: node src/data/rail/import-osm.mjs fetch|build
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const dir = path.dirname(fileURLToPath(import.meta.url));
const checkedAt = "2026-09-13";
const userAgent = "Bahnreise-catalog-import/0.4 (one-off OpenStreetMap research)";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const file = (name) => path.join(dir, name);
const read = (name) => JSON.parse(fs.readFileSync(file(name), "utf8"));

// Discovery/display centres, never used to invent rail connections or transfers.
const cityRows = [
  ["berlin", "DE-BE", "Berlin", "Berlin", 52.52, 13.405, "Berlin|Berliner Verkehrsbetriebe"],
  ["hamburg", "DE-HH", "Hamburg", "Hamburg", 53.5511, 9.9937, "Hamburg|Hamburger Hochbahn"],
  ["munich", "DE-BY", "Munich", "München", 48.1372, 11.5755, "München|Münchner"],
  ["nuremberg", "DE-BY", "Nuremberg", "Nürnberg", 49.4521, 11.0767, "Nürnberg|Verkehrs-Aktiengesellschaft Nürnberg"],
  ["cologne", "DE-NW", "Cologne", "Köln", 50.9375, 6.9603, "Köln|Kölner"],
  ["duesseldorf", "DE-NW", "Düsseldorf", "Düsseldorf", 51.2277, 6.7735, "Düsseldorf|Rheinbahn"],
  ["dortmund", "DE-NW", "Dortmund", "Dortmund", 51.5136, 7.4653, "Dortmund|DSW21"],
  ["essen", "DE-NW", "Essen", "Essen", 51.4556, 7.0116, "Essen|Ruhrbahn"],
  ["frankfurt", "DE-HE", "Frankfurt", "Frankfurt", 50.1109, 8.6821, "Frankfurt|VGF"],
  ["wiesbaden", "DE-HE", "Wiesbaden", "Wiesbaden", 50.0782, 8.2398, "Wiesbaden"],
  ["kassel", "DE-HE", "Kassel", "Kassel", 51.3127, 9.4797, "Kassel|Kasseler"],
  ["stuttgart", "DE-BW", "Stuttgart", "Stuttgart", 48.7758, 9.1829, "Stuttgart|Stuttgarter"],
  ["karlsruhe", "DE-BW", "Karlsruhe", "Karlsruhe", 49.0069, 8.4037, "Karlsruhe|Karlsruher"],
  ["freiburg", "DE-BW", "Freiburg", "Freiburg", 47.999, 7.8421, "Freiburg|Freiburger"],
  ["hanover", "DE-NI", "Hanover", "Hannover", 52.3759, 9.732, "Hannover|ÜSTRA|üstra"],
  ["braunschweig", "DE-NI", "Braunschweig", "Braunschweig", 52.2689, 10.5268, "Braunschweig|Braunschweiger"],
  ["bremen", "DE-HB", "Bremen", "Bremen", 53.0793, 8.8017, "Bremen|Bremer Straßenbahn"],
  ["kiel", "DE-SH", "Kiel", "Kiel", 54.3233, 10.1228, "Kiel"],
  ["luebeck", "DE-SH", "Lübeck", "Lübeck", 53.8655, 10.6866, "Lübeck"],
  ["rostock", "DE-MV", "Rostock", "Rostock", 54.0924, 12.0991, "Rostock|Rostocker"],
  ["schwerin", "DE-MV", "Schwerin", "Schwerin", 53.6355, 11.4012, "Schwerin|Nahverkehr Schwerin"],
  ["potsdam", "DE-BB", "Potsdam", "Potsdam", 52.3906, 13.0645, "Potsdam|Verkehrsbetrieb Potsdam"],
  ["cottbus", "DE-BB", "Cottbus", "Cottbus", 51.7563, 14.3329, "Cottbus|Cottbusverkehr"],
  ["mainz", "DE-RP", "Mainz", "Mainz", 49.9929, 8.2473, "Mainz|Mainzer"],
  ["koblenz", "DE-RP", "Koblenz", "Koblenz", 50.3569, 7.589, "Koblenz"],
  ["saarbruecken", "DE-SL", "Saarbrücken", "Saarbrücken", 49.2402, 6.9969, "Saarbrücken|Saarbahn"],
  ["magdeburg", "DE-ST", "Magdeburg", "Magdeburg", 52.1205, 11.6276, "Magdeburg|Magdeburger"],
  ["halle", "DE-ST", "Halle (Saale)", "Halle (Saale)", 51.4828, 11.9697, "Halle|Hallesche"],
  ["erfurt", "DE-TH", "Erfurt", "Erfurt", 50.9848, 11.0299, "Erfurt|Erfurter Verkehrsbetriebe"],
  ["jena", "DE-TH", "Jena", "Jena", 50.9271, 11.5892, "Jena|Jenaer Nahverkehr"],
  ["leipzig", "DE-SN", "Leipzig", "Leipzig", 51.3397, 12.3731, "Leipzig|Leipziger"],
  ["dresden", "DE-SN", "Dresden", "Dresden", 51.0504, 13.7373, "Dresden|Dresdner"],
];

function selectRelations(index) {
  const eligible = index.elements.filter((r) => r.tags?.["public_transport:version"] === "2" && r.tags.ref && !r.tags.disused && !r.tags.proposed);
  const selected = new Map();
  const add = (r) => selected.set(r.id, r);
  if (fs.existsSync(file("selected-relations.json"))) for (const prior of read("selected-relations.json")) if (eligible.some((r) => r.id === prior.id)) add(prior);
  // Keep the complete source-mapped long-distance backbone and all RE9 variants.
  eligible.filter((r) => /^(ICE|IC|EC)\s?\d|^RE\s?9$/i.test(r.tags.ref)).forEach(add);
  eligible.filter((r) => r.tags.route === "subway" || /^U\s?\d/.test(r.tags.ref)).forEach(add);
  for (const city of cityRows) {
    const pattern = new RegExp(city[6], "i");
    const nearby = eligible.filter((r) => pattern.test([r.tags.name, r.tags.operator, r.tags.wikipedia].join(" ")));
    for (const local of [true]) {
      const choices = nearby.filter((r) => ["subway", "light_rail", "tram"].includes(r.tags.route));
      const refs = [...new Set(choices.map((r) => r.tags.ref.replace(/\s+/g, "")))].sort((a, b) => a.localeCompare(b, "de", { numeric: true })).slice(0, local ? 4 : 4);
      for (const ref of refs) choices.filter((r) => r.tags.ref.replace(/\s+/g, "") === ref).slice(0, 4).forEach(add);
    }
    for (const prefix of [/^RE\s?\d/, /^RB\s?\d/, /^(S|RS)\s?\d/]) {
      const choices = nearby.filter((r) => prefix.test(r.tags.ref));
      const refs = [...new Set(choices.map((r) => r.tags.ref.replace(/\s+/g, "")))].sort((a, b) => a.localeCompare(b, "de", { numeric: true })).slice(0, 2);
      for (const ref of refs) choices.filter((r) => r.tags.ref.replace(/\s+/g, "") === ref).slice(0, 3).forEach(add);
    }
  }
  return [...selected.values()].sort((a, b) => a.id - b.id);
}

async function query(queryText, destination) {
  if (fs.existsSync(file(destination))) return read(destination);
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "User-Agent": userAgent, "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({ data: queryText }),
      signal: AbortSignal.timeout(150000),
    });
    if (response.status === 406 || response.status === 429 || response.status === 504) {
      console.log(`Overpass ${response.status}; respecting 30-second backoff`);
      await sleep(31000);
      continue;
    }
    if (!response.ok) throw new Error(`Overpass HTTP ${response.status}`);
    const text = await response.text();
    const json = JSON.parse(text);
    if (json.remark) throw new Error(`Incomplete Overpass response: ${json.remark}`);
    fs.writeFileSync(file(destination), text);
    console.log(`Cached ${destination}: ${text.length} bytes`);
    return json;
  }
  throw new Error("Overpass remained unavailable after bounded retries");
}

async function fetchSelected() {
  const index = read("route-index.osm.json");
  const selected = selectRelations(index);
  fs.writeFileSync(file("selected-relations.json"), JSON.stringify(selected, null, 2));
  console.log(`Selected ${selected.length} directed relation variants`);
  const present = new Set();
  for (const name of fs.readdirSync(dir).filter((name) => /^batch-.*\.osm\.json$/.test(name))) for (const object of read(name).elements) if (object.type === "relation" && object.tags?.type === "route") present.add(object.id);
  const remaining = selected.filter((r) => !present.has(r.id));
  console.log(`${remaining.length} variants still need detail fetch`);
  const chunkSize = 70;
  for (let offset = 0; offset < remaining.length; offset += chunkSize) {
    const ids = remaining.slice(offset, offset + chunkSize).map((r) => r.id).join(",");
    const q = `[out:json][timeout:90];rel(id:${ids})->.r;.r out body;node(r.r)->.stops;.stops out body;(way(r.r:"platform");way(r.r:"platform_entry_only");way(r.r:"platform_exit_only");)->.platforms;.platforms out center;(rel(r.r:"platform");rel(r.r:"platform_entry_only");rel(r.r:"platform_exit_only");)->.platformRelations;.platformRelations out center;(rel(bn.stops)["public_transport"="stop_area"];rel(bw.platforms)["public_transport"="stop_area"];rel(br.platformRelations)["public_transport"="stop_area"];)->.areas;.areas out body;rel(br.areas)["public_transport"="stop_area_group"];out body;`;
    const digest = createHash("sha256").update(ids).digest("hex").slice(0, 12);
    await query(q, `batch-${digest}.osm.json`);
    await sleep(1000);
  }
}

const mode = process.argv[2];
if (mode === "fetch") await fetchSelected();
else if (mode === "selection") console.log(JSON.stringify(selectRelations(read("route-index.osm.json")).map((r) => ({id:r.id,ref:r.tags.ref,name:r.tags.name})), null, 2));
else if (mode !== "build") throw new Error("Use fetch, selection, or build");

export { checkedAt, cityRows, dir, file, read, query };
