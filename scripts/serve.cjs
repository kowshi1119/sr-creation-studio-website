const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
function createServer() {
  return http.createServer((req, res) => {
    let name;
    try {
      name = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch {
      res.writeHead(400).end();
      return;
    }
    const file = path.resolve(
      root,
      "." + (name === "/" ? "/index.html" : name),
    );
    if (!file.startsWith(root + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    fs.readFile(file, (error, data) => {
      if (error) {
        res.writeHead(404).end("Not found");
        return;
      }
      const types = {
        ".html": "text/html; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".svg": "image/svg+xml",
        ".webp": "image/webp",
        ".jpg": "image/jpeg",
        ".json": "application/json",
      };
      res.setHeader(
        "Content-Type",
        types[path.extname(file)] || "application/octet-stream",
      );
      res.end(data);
    });
  });
}
module.exports = { createServer };
if (require.main === module) {
  const port = Number(process.env.PORT) || 8000;
  createServer().listen(port, "127.0.0.1", () =>
    console.log("Studio preview: http://127.0.0.1:" + port),
  );
}
