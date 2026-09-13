const os = require("node:os");
const fs = require("node:fs");
const QRCode = require("qrcode");
const addresses = Object.values(os.networkInterfaces())
  .flat()
  .filter(
    (item) =>
      item &&
      item.family === "IPv4" &&
      !item.internal &&
      !item.address.startsWith("169.254"),
  );
const address = process.env.BAHNREISE_HOST || addresses[0]?.address;
if (!address) throw new Error("Connect to Wi-Fi, or set BAHNREISE_HOST.");
const url = `exp://${address}:8081`;
fs.mkdirSync("artifacts", { recursive: true });
QRCode.toFile("artifacts/mobile-qr.png", url, {
  width: 320,
  margin: 2,
  color: { dark: "#191918", light: "#FFFFFF" },
}).then(() => {
  fs.writeFileSync(
    "artifacts/mobile-connection.json",
    JSON.stringify(
      {
        expo: url,
        web: `http://${address}:4173`,
        generatedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
  console.log(
    `Expo Go: ${url}\nMobile web: http://${address}:4173\nQR: artifacts/mobile-qr.png`,
  );
});
