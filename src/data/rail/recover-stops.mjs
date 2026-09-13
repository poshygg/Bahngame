// Fetch explicitly referenced platform objects omitted from earlier batches.
// Run after build-catalog.mjs, then rebuild and validate the catalog.
import { createHash } from "node:crypto";
process.argv[2] = "build";
const { read, query } = await import("./import-osm.mjs");
const missing = read("import-report.json").missing;
if (!missing.length) { console.log("No missing stop members"); process.exit(0); }
const selectors = ["node", "way", "relation"].map((type) => {
  const ids = missing.filter((m) => m.type === type).map((m) => m.ref);
  return ids.length ? `${type}(id:${ids.join(",")});` : "";
}).join("");
const q = `[out:json][timeout:80];(${selectors})->.stops;.stops out center;(rel(bn.stops)["public_transport"="stop_area"];rel(bw.stops)["public_transport"="stop_area"];rel(br.stops)["public_transport"="stop_area"];)->.areas;.areas out body;rel(br.areas)["public_transport"="stop_area_group"];out body;`;
const digest = createHash("sha256").update(q).digest("hex").slice(0,12);
await query(q, `recovered-${digest}.osm.json`);
