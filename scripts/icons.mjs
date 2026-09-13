import fs from "node:fs";
import sharp from "sharp";
const svg = fs.readFileSync("assets/bahnreise-icon.svg");
await sharp(svg).png().toFile("assets/bahnreise-icon.png");
const foreground = svg
  .toString()
  .replace('<rect width="1024" height="1024" rx="224" fill="#213183"/>', "")
  .replace('viewBox="0 0 1024 1024"', 'viewBox="-150 -150 1324 1324"');
await sharp(Buffer.from(foreground))
  .png()
  .toFile("assets/bahnreise-adaptive.png");
console.log("App icons created.");
