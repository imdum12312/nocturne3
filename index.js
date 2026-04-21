import { server as wisp } from "@mercuryworkshop/wisp-js/server";
import express from "express";
import compression from "compression";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

wisp.options.allow_loopback_ips = true;
wisp.options.allow_private_ips = true;

const app = express();
const PORT = process.env.PORT || 8080;

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(compression({ level: 6, threshold: 1024 }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use((req, res, next) => {
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

app.get("/api/games", (req, res) => {
    const games = [
        { id: 1, name: 'Flappy Bird', cover: 'https://via.placeholder.com/160x160?text=Flappy', url: '/games/flappy.html' },
        { id: 2, name: 'Snake Game', cover: 'https://via.placeholder.com/160x160?text=Snake', url: '/games/snake.html' },
        { id: 3, name: '2048', cover: 'https://via.placeholder.com/160x160?text=2048', url: '/games/2048.html' },
        { id: 4, name: 'Pac-Man', cover: 'https://via.placeholder.com/160x160?text=Pacman', url: '/games/pacman.html' },
        { id: 5, name: 'Tetris', cover: 'https://via.placeholder.com/160x160?text=Tetris', url: '/games/tetris.html' },
        { id: 6, name: 'Mario', cover: 'https://via.placeholder.com/160x160?text=Mario', url: '/games/mario.html' }
    ];
    res.json(games);
});

app.post("/api/games/play", (req, res) => {
    const { gameId, timestamp } = req.body;
    res.json({ success: true, message: "Play logged" });
});

app.post("/api/games/favorite", (req, res) => {
    const { userId, gameId, isFavorite } = req.body;
    res.json({ success: true, message: isFavorite ? "Added to favorites" : "Removed from favorites" });
});

app.post("/api/games/rating", (req, res) => {
    const { userId, gameId, rating, review } = req.body;
    res.json({ success: true, message: "Rating submitted" });
});

app.get("/api/collections", (req, res) => {
    const { userId } = req.query;
    res.json([
        { id: '1', name: 'Favorites', gameIds: [] },
        { id: '2', name: 'Action Games', gameIds: [] }
    ]);
});

app.post("/api/collections", (req, res) => {
    const { userId, name, gameIds } = req.body;
    res.json({ success: true, collectionId: Date.now().toString(), message: "Collection created" });
});

app.post("/api/collections/:collectionId/games", (req, res) => {
    const { gameId } = req.body;
    res.json({ success: true, message: "Game added to collection" });
});

app.get("/api/games/leaderboard", (req, res) => {
    res.json({
        topPlayers: [
            { userId: 'user_1', totalPlays: 150, gamesPlayed: 42 },
            { userId: 'user_2', totalPlays: 120, gamesPlayed: 38 },
            { userId: 'user_3', totalPlays: 95, gamesPlayed: 35 }
        ],
        topRatedGames: [
            { gameId: 1, rating: 4.8, reviews: 42 },
            { gameId: 2, rating: 4.6, reviews: 38 },
            { gameId: 3, rating: 4.5, reviews: 35 }
        ]
    });
});

app.get("/api/games/export", (req, res) => {
    const data = { favorites: [], history: [], timestamp: new Date().toISOString() };
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="games-export.json"');
    res.json(data);
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
