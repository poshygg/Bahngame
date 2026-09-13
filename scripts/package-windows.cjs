const fs = require("node:fs/promises");
const path = require("node:path");
const asar = require("@electron/asar");
const { spawnSync } = require("node:child_process");
async function main() {
  const root = path.resolve(__dirname, "..");
  const output = path.join(root, "release", "Bahnreise");
  const runtime = path.dirname(require("electron"));
  await fs.mkdir(output, { recursive: true });
  await fs.cp(runtime, output, { recursive: true });
  await fs.copyFile(
    path.join(output, "electron.exe"),
    path.join(output, "Bahnreise.exe"),
  );
  await fs.unlink(path.join(output, "electron.exe"));
  await asar.createPackage(
    path.join(root, "desktop"),
    path.join(output, "resources", "app.asar"),
  );
  const webOutput = path.resolve(output, "resources", "web");
  if (!webOutput.startsWith(root + path.sep))
    throw new Error("Generated web output must stay inside the workspace");
  try {
    // Only replace this generated directory, never a redirected user folder.
    if ((await fs.realpath(webOutput)) !== webOutput)
      throw new Error("Refusing to replace a redirected web output directory");
    await fs.rm(webOutput, { recursive: true });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await fs.cp(path.join(root, "dist"), webOutput, {
    recursive: true,
  });
  console.log("Windows app ready: release/Bahnreise/Bahnreise.exe");
  const builder = require.resolve("electron-builder/cli.js");
  const result = spawnSync(
    process.execPath,
    [
      builder,
      "--config",
      "electron-builder.json",
      "--prepackaged",
      output,
      "--win",
      "portable",
      ...(process.argv.includes("--quick")
        ? ["--config.compression=store"]
        : []),
    ],
    { cwd: root, stdio: "inherit", windowsHide: true },
  );
  process.exitCode = result.status || 0;
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
