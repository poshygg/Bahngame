const fs = require("node:fs/promises");
const path = require("node:path");

async function main() {
  const root = path.resolve(__dirname, "..");
  const source = path.join(root, "dist");
  const artifacts = path.join(root, "artifacts");
  const output = path.join(artifacts, "netlify-site");
  const files = [];
  const adsenseHead = (await fs.readFile(path.join(__dirname, "adsense-head.html"), "utf8")).trim();
  const htmlPages = new Map();

  async function collect(directory, relative = "") {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const name = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) throw new Error(`Refusing symlink in dist: ${name}`);
      if (entry.name.startsWith(".") || name === "metadata.json" || name.endsWith(".hbc")) continue;
      if (name.startsWith("_expo/static/js/") && name !== "_expo/static/js/web" && !name.startsWith("_expo/static/js/web/")) continue;
      if (entry.isDirectory()) await collect(path.join(directory, entry.name), name);
      else if (entry.isFile()) files.push(name);
    }
  }
  await collect(source);
  const required = ["index.html", "favicon.ico", "data/germany-rail.json", "data/germany-rail-sources.md", "data/README.txt"];
  for (const name of required) if (!files.includes(name)) throw new Error(`Missing ${name}. Run npm run build:web first.`);
  const html = await fs.readFile(path.join(source, "index.html"), "utf8");
  const webScripts = [...html.matchAll(/<script\b[^>]*\bsrc="\/([^\"]+)"/g)].map(match => match[1]);
  if (!webScripts.length || webScripts.some(name => !files.includes(name))) throw new Error("index.html references a missing web bundle.");

  // Add the publisher's snippet only to hosted pages, including future static
  // pages. Local previews and packaged desktop/mobile builds keep their setup.
  for (const name of files.filter(name => name.endsWith(".html"))) {
    const page = await fs.readFile(path.join(source, ...name.split("/")), "utf8");
    if (!/<head\b[^>]*>[\s\S]*<\/head\s*>/i.test(page)) throw new Error(`Missing HTML head: ${name}`);
    if (/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/i.test(page)) {
      throw new Error(`AdSense is already present in ${name}; keep one source for the head snippet.`);
    }
    htmlPages.set(name, page.replace(/<\/head\s*>/i, `${adsenseHead}\n</head>`));
  }

  await fs.mkdir(artifacts, { recursive: true });
  // Validate the resolved target before replacing this one generated directory.
  if (path.dirname(output) !== artifacts || path.basename(output) !== "netlify-site" || await fs.realpath(artifacts) !== artifacts) throw new Error("Unexpected deploy output path.");
  const existing = await fs.lstat(output).catch(error => { if (error.code === "ENOENT") return null; throw error; });
  if (existing && (!existing.isDirectory() || existing.isSymbolicLink() || await fs.realpath(output) !== output)) throw new Error("Deploy output must be a normal directory inside artifacts.");
  await fs.rm(output, { recursive: true, force: true });
  await fs.mkdir(output, { recursive: true });
  let bytes = 0;
  for (const name of files) {
    const destination = path.join(output, ...name.split("/"));
    await fs.mkdir(path.dirname(destination), { recursive: true });
    if (htmlPages.has(name)) await fs.writeFile(destination, htmlPages.get(name));
    else await fs.copyFile(path.join(source, ...name.split("/")), destination);
    bytes += (await fs.stat(destination)).size;
  }
  // Also supports manual folder upload without reading the repository's TOML.
  await fs.writeFile(path.join(output, "_redirects"), "/* /index.html 200\n");
  console.log(`Prepared ${files.length + 1} files (${(bytes / 1024 / 1024).toFixed(2)} MiB) in ${output}`);
  console.log("Included web bundle, fonts and reusable ODbL data; excluded native bundles and export metadata. dist was not modified.");
  console.log(`Added the AdSense head snippet to ${htmlPages.size} hosted HTML page(s).`);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
