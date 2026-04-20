// Nocturne — web proxy server
// Express + Wisp over a single HTTP listener. Serves the static frontend,
// the Scramjet/Epoxy/Bare-Mux bundles from node_modules, and routes
// websocket upgrades into wisp-js for transport.

import { server as wisp } from "@mercuryworkshop/wisp-js/server";
import express from "express";
import compression from "compression";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// wisp: allow private ranges so VPS containers and self-tests work
wisp.options.allow_loopback_ips = true;
wisp.options.allow_private_ips = true;

const app = express();
const PORT = process.env.PORT || 8080;

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(compression({ level: 6, threshold: 1024 }));

app.use((req, res, next) => {
    // Chromium gets COEP/COOP so SharedArrayBuffer works (YouTube video player).
    // Firefox is skipped — it enforces COEP + CORP on SW-generated responses too
    // strictly, which breaks the scramjet iframe.
    const ua = req.headers["user-agent"] || "";
    const isFirefox = /firefox/i.test(ua);
    if (!isFirefox) {
        res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
        res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    }

    const p = req.path;
    if (/\/(scram|baremux|epoxy)\//.test(p) || p.endsWith(".wasm")) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    } else if (/\.(js|mjs|css|html)$/.test(p)) {
        res.setHeader("Cache-Control", "no-store");
    }
    next();
});

app.get("/ping", (req, res) => res.status(204).end());

// Seeds the client's AI key from server-side env. Client caches in localStorage
// and the user can override via the settings panel.
app.get("/api/ai-config", (req, res) => {
    res.json({ key: process.env.GEMINI_API_KEY || "" });
});

app.use("/epoxy", express.static(path.join(__dirname, "node_modules/@mercuryworkshop/epoxy-transport/dist")));
app.use("/baremux", express.static(path.join(__dirname, "node_modules/@mercuryworkshop/bare-mux/dist")));

app.get("/bareworker.js", (req, res) => {
    res.sendFile(path.join(__dirname, "node_modules/@mercuryworkshop/bare-mux/dist/worker.js"));
});

app.use(express.static(path.join(__dirname, "public"), {
    extensions: ["html"],
    setHeaders: (res, filePath) => {
        if (filePath.endsWith(".wasm")) res.setHeader("Content-Type", "application/wasm");
    }
}));

// SPA fallback. /scramjet/* means the service worker isn't controlling yet —
// serve an HTML retry page that silently reloads once the SW claims the client.
app.use((req, res) => {
    if (req.path.startsWith("/scramjet/")) {
        res.status(200).type("text/html").send(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Reconnecting</title>' +
            '<style>html,body{background:#05060d;color:#a9a3c7;font-family:system-ui,sans-serif;margin:0;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px}p{margin:0;font-size:13px}.d{color:#706b8f;font-size:11px}.dots::after{content:"";animation:d 1.2s steps(4,end) infinite}@keyframes d{0%{content:""}25%{content:"."}50%{content:".."}75%{content:"..."}}</style>' +
            '</head><body><p>Reconnecting<span class="dots"></span></p><p class="d">service worker initializing</p>' +
            '<script>setTimeout(()=>location.reload(),1200);</script></body></html>'
        );
        return;
    }
    res.sendFile(path.join(__dirname, "public/index.html"));
});

const server = http.createServer(app);

// Route websocket upgrades into wisp. Strip cookies so upstreams don't
// see our session context leak through.
server.on("upgrade", (request, socket, head) => {
    if (request.headers["cookie"]) delete request.headers["cookie"];
    wisp.routeRequest(request, socket, head);
});

process.on("uncaughtException", err => console.error("[nocturne] uncaught:", err));
process.on("unhandledRejection", reason => console.error("[nocturne] unhandled:", reason));

function shutdown(sig) {
    console.log(`\n[nocturne] ${sig} received, closing...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

server.listen(PORT, () => {
    const bar = "─".repeat(46);
    console.log();
    console.log("  \x1b[1m\x1b[35mNOCTURNE\x1b[0m");
    console.log(`  \x1b[2m${bar}\x1b[0m`);
    console.log(`  \x1b[2mlistening\x1b[0m  http://localhost:${PORT}`);
    console.log(`  \x1b[2mnode\x1b[0m       ${process.version}`);
    console.log();
});
