const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../dist");
const port = Number(process.env.PORT || 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".ttf": "font/ttf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};
http
  .createServer((request, response) => {
    let filename;
    try {
      const pathname = decodeURIComponent(
        new URL(request.url, "http://localhost").pathname,
      );
      filename = path.resolve(
        root,
        "." + (pathname === "/" ? "/index.html" : pathname),
      );
    } catch {
      response.writeHead(400).end("Bad request");
      return;
    }
    if (!filename.startsWith(root + path.sep)) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    fs.stat(filename, (error, stat) => {
      if (error || !stat.isFile()) {
        response.writeHead(404).end("Not found");
        return;
      }
      response.writeHead(200, {
        "Content-Type":
          types[path.extname(filename)] || "application/octet-stream",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      });
      fs.createReadStream(filename)
        .on("error", () => response.destroy())
        .pipe(response);
    });
  })
  .listen(port, "0.0.0.0", () =>
    console.log(`Bahnreise preview: http://localhost:${port}`),
  );
