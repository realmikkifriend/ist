import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const port = Number(process.argv[2] ?? 8081);
const root = path.resolve(process.argv[3] ?? "dist");

const mime = {
    ".css": "text/css",
    ".html": "text/html",
    ".ico": "image/x-icon",
    ".js": "text/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
};

/**
 * Resolves the file to serve for a request path, falling back to the
 * directory's index.html; returns null when the file does not exist.
 * @param {string} urlPath
 * @returns {Promise<string | null>}
 */
const resolveFile = async (urlPath) => {
    let file = path.join(root, urlPath === "/" ? "index.html" : urlPath);
    try {
        if ((await stat(file)).isDirectory()) {
            file = path.join(file, "index.html");
        }
        return file;
    } catch {
        return null;
    }
};

createServer((req, res) => {
    const urlPath = new URL(req.url ?? "/", `http://localhost:${port}`).pathname;
    resolveFile(urlPath)
        .then(async (file) => {
            if (file === null) {
                res.writeHead(404, { "Content-Type": "text/plain" });
                res.end("not found");
                return;
            }
            const data = await readFile(file);
            res.writeHead(200, {
                "Content-Type": mime[path.extname(file)] ?? "application/octet-stream",
            });
            res.end(data);
        })
        .catch(() => {
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("internal error");
        });
})
    .listen(port, "127.0.0.1")
    .on("listening", () => {
        console.error(`serving ${root} at http://127.0.0.1:${port}`);
    });
