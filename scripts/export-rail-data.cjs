const fs = require("node:fs/promises");
const path = require("node:path");

async function main() {
  const root = path.resolve(__dirname, "..");
  const source = path.join(root, "src/data/rail/catalog.generated.json");
  const snapshot = JSON.parse(await fs.readFile(source, "utf8"));
  const output = path.join(root, "dist/data");
  await fs.mkdir(output, { recursive: true });
  await fs.copyFile(source, path.join(output, "germany-rail.json"));
  await fs.copyFile(
    path.join(root, "docs/germany-rail-catalog.md"),
    path.join(output, "germany-rail-sources.md"),
  );
  await fs.writeFile(
    path.join(output, "README.txt"),
    [
      "Bahnreise Germany railway database",
      snapshot.license.attribution,
      "Database license: " + snapshot.license.name,
      snapshot.license.url,
      "Source: " + snapshot.license.sourceUrl,
      "Snapshot checked: " + snapshot.checkedAt,
      "germany-rail.json is the reusable OSM-derived database included in this build.",
      "See germany-rail-sources.md for provenance, transformation, source links and limitations.",
      "Not a complete network or a live Deutsche Bahn timetable.",
      "",
    ].join("\n"),
  );
  console.log(
    `Exported reusable rail database: ${snapshot.stations.length} stops / ${snapshot.lines.length} variants`,
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
