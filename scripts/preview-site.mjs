import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const port = Number(process.argv[2]) || 8765;
const types = {
  ".css": "text/css",
  ".html": "text/html",
  ".ico": "image/x-icon",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".webp": "image/webp",
};

http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);

    if (pathname.split("/").some((segment) => segment.startsWith("."))) {
      response.writeHead(403).end();
      return;
    }

    const target = path.resolve(root, `.${pathname}`);

    if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
      response.writeHead(403).end();
      return;
    }

    const stat = await fs.stat(target);
    const file = stat.isDirectory() ? path.join(target, "index.html") : target;
    const body = await fs.readFile(file);
    const type = types[path.extname(file)] || "application/octet-stream";
    response.writeHead(200, { "Content-Type": `${type}${type.startsWith("text/") ? "; charset=utf-8" : ""}` });
    response.end(body);
  } catch {
    response.writeHead(404).end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Preview: http://127.0.0.1:${port}/`);
});
