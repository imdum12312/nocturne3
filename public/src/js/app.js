import { getProxied } from "/math.mjs";
import { initPerformance } from "/src/js/performance.js";
import { mountLoader } from "/src/js/loader.js";
import { wireHoverPrefetch, prefetchedUrl } from "/src/js/prefetch.js";
import { listCloaks, applyCloak, restoreCloak, reset as resetCloak } from "/src/js/cloak.js";
import { initWelcome } from "/src/js/welcome.js";

const frame = document.getElementById("frame");
const toolbar = document.getElementById("toolbar");
const homePage = document.getElementById("homePage");
const errorPage = document.getElementById("errorPage");
const errDetail = document.getElementById("errDetail");

const searchForm = document.getElementById("searchForm");
const searchHome = document.getElementById("searchHome");
const urlBar = document.getElementById("urlBar");

const settingsPanel = document.getElementById("settingsPanel");
const dockHome = document.getElementById("dockHome");
const dockSettings = document.getElementById("dockSettings");

const fxToggle = document.getElementById("fxToggle");
const cloakSelect = document.getElementById("cloakSelect");
const engineSelect = document.getElementById("engineSelect");

const btnBack = document.getElementById("btnBack");
const btnFwd  = document.getElementById("btnFwd");

const loader = mountLoader(document.getElementById("lineLoader"));

const ENGINES = {
    duckduckgo: { label: "DuckDuckGo", url: q => "https://duckduckgo.com/?q=" + encodeURIComponent(q) },
    google:     { label: "Google",     url: q => "https://www.google.com/search?q=" + encodeURIComponent(q) },
    bing:       { label: "Bing",       url: q => "https://www.bing.com/search?q=" + encodeURIComponent(q) },
    brave:      { label: "Brave",      url: q => "https://search.brave.com/search?q=" + encodeURIComponent(q) },
    startpage:  { label: "Startpage",  url: q => "https://www.startpage.com/do/search?q=" + encodeURIComponent(q) }
};

/* ⚠️⚠️⚠️ WARNING — DO NOT SCROLL DOWN ⚠️⚠️⚠️
   THIS SECTION CONTAINS COMPREHENSIVE CONTENT FILTERING
   INAPPROPRIATE, ADULT, AND PIRACY SITES ARE BLOCKED
   ⚠️⚠️⚠️ WARNING — DO NOT SCROLL DOWN ⚠️⚠️⚠️ */

const BLOCKED_DOMAINS = [
    "pornhub.com", "xvideos.com", "xhamster.com", "youporn.com", "redtube.com",
    "spankbang.com", "xnxx.com", "xnxx2.com", "tnaflix.com", "brazzers.com",
    "onlyfans.com", "chaturbate.com", "stripchat.com", "bongacams.com",
    "livejasmin.com", "cam4.com", "beeg.com", "tube8.com", "motherless.com",
    "porn.com", "efukt.com", "eporner.com", "drtuber.com", "sunporno.com",
    "perfectgirls.net", "txxx.com", "hqporner.com", "daftsex.com",
    "thumbzilla.com", "4tube.com", "hclips.com", "keezmovies.com",
    "pornhd.com", "porntrex.com", "3movs.com", "alphaporno.com", "analdin.com",
    "slutload.com", "madthumbs.com", "ixxx.com", "fuq.com", "empflix.com",
    "xozilla.com", "watchmyexgf.com", "hotmovs.com", "bravotube.net",
    "yourlust.com", "fux.com", "porntube.com", "pornone.com", "porn300.com",
    "yespornplease.com", "porndig.com", "tubegalore.com", "pornzog.com",
    "adultdeepfakes.com", "pornpics.com", "metart.com", "met-art.com",
    "myfreecams.com", "camsoda.com", "flirt4free.com", "streamate.com",
    "imlive.com", "camster.com", "camwhores.tv", "thothub.tv", "fapello.com",
    "fapello.su", "fapello.is", "sxyprn.com",
    "ashemaletube.com", "tgtube.com", "shemale.xxx",
    "javhd.com", "kissjav.com", "javhihi.com", "heyzo.com", "javfinder.com",
    "jav.guru", "javlibrary.com",
    "nhentai.net", "hentaihaven.org", "e-hentai.org", "exhentai.org",
    "rule34.xxx", "rule34.paheal.net", "simply-hentai.com", "hanime.tv",
    "hentaihand.com", "e621.net", "f95zone.to", "hentai2read.com",
    "hentaigasm.com", "gelbooru.com", "danbooru.donmai.us", "realbooru.com",
    "literotica.com", "lushstories.com", "asstr.org",
    "adulttime.com", "adultfriendfinder.com", "ashleymadison.com",
    "seeking.com", "seekingarrangement.com",
    "fmovies.to", "fmovies.wtf", "fmoviesz.to", "123movies.net",
    "123moviesfree.net", "putlocker.sb", "putlockers.so",
    "gomovies.sx", "gomovies.to", "soap2day.to", "soap2day.rs", "soap2day.tf",
    "vumoo.mx", "himovies.to", "watchseries.video", "bmovies.to",
    "9anime.to", "9anime.tv", "zoro.to", "aniwatch.to",
    "gogoanime.io", "gogoanime.tv", "gogoanime.so",
    "bflix.to", "dopebox.to", "lookmovie.io", "lookmovie2.to", "sflix.to",
    "thepiratebay.org", "thepiratebay.se", "1337x.to", "1337x.tw", "1337x.st",
    "rarbg.to", "rarbgprx.org", "yts.mx", "yts.rs", "yts.am",
    "limetorrents.com", "limetorrents.info", "torrentgalaxy.to",
    "fitgirl-repacks.site", "nyaa.si", "sukebei.nyaa.si",
    "kickasstorrents.to", "kickass.sx", "kat.cr", "extratorrent.cc",
    "eztv.re", "eztv.ag",
    "cracked.to", "cracked.io", "nulled.to", "nulled.io", "warez-bb.org",
    "skidrow-games.net", "crackwatch.com",
    "bestgore.com", "documentingreality.com", "kaotic.com", "theync.com",
    "vidmax.com", "liveleak.com",
    "silkroadmarket.org", "dreammarket.to", "darkfailllnkf4vf.onion",
    "4chan.org", "8kun.top", "kiwifarms.net", "rumble.com", "telegram.org"
];

const BLOCKED_KEYWORDS = [
    "porn", "pornhub", "xvideos", "xhamster", "xnxx", "xxx", "nude", "nudes",
    "naked", "hentai", "nhentai", "porno", "pornographic", "sex",
    "blowjob", "handjob", "footjob", "deepthroat", "creampie", "cumshot",
    "gangbang", "bukkake", "bondage", "fetish",
    "milf", "gilf", "camgirl", "camboy", "camwhore", "escort", "prostitute",
    "hooker", "masturbation", "masturbate", "erotica", "erotic",
    "cocaine", "heroin", "fentanyl", "methamphetamine", "meth",
    "mdma", "ecstasy", "molly", "lsd", "dmt", "ketamine",
    "crystal meth", "crack cocaine",
    "pirate bay", "piratebay", "1337x", "yts.mx", "fmovies", "123movies",
    "warez", "nulled", "keygen", "serial key",
    "silk road", "darknet market", "dark web market",
    "neilkohlitest", "inappropriate", "adult content"
];

function checkBlocked(input) {
    const raw = (input || "").trim();
    if (!raw) return null;
    const lower = raw.toLowerCase();

    let host = "";
    try {
        const u = new URL(/^https?:\/\//i.test(raw) ? raw : "https://" + raw);
        host = u.hostname.replace(/^www\./, "");
    } catch {}
    if (host) {
        for (const d of BLOCKED_DOMAINS) {
            if (host === d || host.endsWith("." + d)) return "site";
        }
    }

    for (const k of BLOCKED_KEYWORDS) {
        const re = new RegExp("\\b" + k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i");
        if (re.test(lower)) return "keyword";
    }
    return null;
}

let currentEngine = localStorage.getItem("nocturne-engine") || "duckduckgo";
let lastURL = "";
let navStack = [];
let navIndex = -1;
let loadWatchdog = null;

function obfuscate(url) {
    try { return btoa(url).replace(/=+$/, ""); }
    catch { return btoa(encodeURIComponent(url)).replace(/=+$/, ""); }
}
function deobfuscate(s) {
    try { return atob(s); }
    catch { try { return decodeURIComponent(atob(s)); } catch { return null; } }
}

function clearWatchdog() {
    if (loadWatchdog) { clearTimeout(loadWatchdog); loadWatchdog = null; }
}

function showError(detail) {
    clearWatchdog();
    loader.fail();
    frame.classList.remove("visible");
    errorPage.classList.add("visible");
    if (errDetail && detail) errDetail.textContent = detail;
}

function finishLoad() {
    clearWatchdog();
    try {
        const doc = frame.contentDocument;
        if (doc) {
            const body = (doc.body && doc.body.innerText) || "";
            if (body.startsWith("Proxy error:")) return showError(body.slice(0, 160));
            if (body.startsWith("Service worker not active")) return showError("Service worker not active. Reload to recover.");
        }
    } catch {}
    loader.finish();
    frame.classList.add("visible");
}

function showHome(pushHistory = true) {
    clearWatchdog();
    loader.fail();
    frame.classList.remove("visible");
    frame.removeAttribute("src");
    toolbar.classList.remove("visible");
    homePage.style.display = "";
    errorPage.classList.remove("visible");
    if (pushHistory) history.pushState(null, "", "/");
    navStack = [];
    navIndex = -1;
    updateNavButtons();
}

function updateNavButtons() {
    btnBack.disabled = navIndex <= 0;
    btnFwd.disabled  = navIndex >= navStack.length - 1;
}

async function load(url, addToHistory = true) {
    try {
        clearWatchdog();

        if (checkBlocked(url)) {
            toolbar.classList.remove("visible");
            homePage.style.display = "none";
            return showError("This page is blocked by Nocturne policy. See the Terms of Service.");
        }

        try {
            const parsed = new URL(url);
            if (parsed.hostname === "localhost" || parsed.origin === location.origin) {
                return showError("Cannot proxy local addresses.");
            }
        } catch {}

        lastURL = url;
        errorPage.classList.remove("visible");
        if (errDetail) errDetail.textContent = "";

        toolbar.classList.add("visible");
        homePage.style.display = "none";
        frame.classList.remove("visible");

        if (addToHistory) {
            history.pushState(null, "", "/search/" + obfuscate(url));
            navStack = navStack.slice(0, navIndex + 1);
            navStack.push(url);
            navIndex = navStack.length - 1;
        }
        updateNavButtons();
        urlBar.value = url;
        loader.start();

        let proxied = prefetchedUrl(url);
        if (!proxied) {
            try { proxied = await getProxied(url); }
            catch (err) { return showError(err.message); }
        }

        loader.stage("loading");

        let loaded = false;
        frame.onload = () => {
            loaded = true;
            loader.stage("rendering");
            setTimeout(finishLoad, 60);
        };
        frame.onerror = () => showError("Failed to load page.");
        frame.src = proxied;

        setTimeout(() => {
            if (!loaded) frame.classList.add("visible");
        }, 1500);

        loadWatchdog = setTimeout(() => {
            if (loaded) return;
            clearWatchdog();
            loader.finish();
            frame.classList.add("visible");
        }, 25000);
    } catch (err) {
        showError(err.message || "Unknown error");
    }
}

function parseInput(value) {
    const v = (value || "").trim();
    if (!v) return null;
    if (/^https?:\/\//i.test(v)) return v;
    if (!v.includes(" ") && (v.includes(".") || v.startsWith("localhost"))) return "https://" + v;
    return ENGINES[currentEngine].url(v);
}

searchForm.addEventListener("submit", e => {
    e.preventDefault();
    const raw = searchHome.value;
    if (checkBlocked(raw)) {
        searchHome.value = "";
        homePage.style.display = "none";
        return showError("This search is blocked by Nocturne policy. See the Terms of Service.");
    }
    const url = parseInput(raw);
    if (url) { searchHome.value = ""; load(url); }
});

urlBar.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    const raw = urlBar.value;
    if (checkBlocked(raw)) {
        return showError("This request is blocked by Nocturne policy. See the Terms of Service.");
    }
    const url = parseInput(raw);
    if (url) load(url);
});

btnBack.addEventListener("click", () => {
    if (navIndex > 0) { navIndex--; updateNavButtons(); load(navStack[navIndex], false); }
});
btnFwd.addEventListener("click", () => {
    if (navIndex < navStack.length - 1) { navIndex++; updateNavButtons(); load(navStack[navIndex], false); }
});
document.getElementById("btnReload").addEventListener("click", () => { if (lastURL) load(lastURL, false); });
document.getElementById("btnFullscreen").addEventListener("click", () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else frame.requestFullscreen?.();
});

document.getElementById("retryBtn").addEventListener("click", () => { if (lastURL) load(lastURL, false); });
document.getElementById("homeFromErrorBtn").addEventListener("click", () => showHome());

dockHome.addEventListener("click", () => showHome());
dockSettings.addEventListener("click", e => {
    e.stopPropagation();
    settingsPanel.classList.toggle("open");
});

document.addEventListener("click", e => {
    if (!settingsPanel.contains(e.target) && !dockSettings.contains(e.target)) {
        settingsPanel.classList.remove("open");
    }
});

fxToggle.addEventListener("change", () => {
    const on = fxToggle.checked;
    window.dispatchEvent(new CustomEvent("nocturne:bgfx", { detail: on }));
    localStorage.setItem("nocturne-bgfx", on ? "1" : "0");
});
if (localStorage.getItem("nocturne-bgfx") === "0") {
    fxToggle.checked = false;
    fxToggle.dispatchEvent(new Event("change"));
}

const debugToggle = document.getElementById("debugToggle");
if (debugToggle) {
    debugToggle.checked = localStorage.getItem("nocturne-debug") === "1";
    debugToggle.addEventListener("change", () => {
        window.dispatchEvent(new CustomEvent("nocturne:debug", { detail: debugToggle.checked }));
    });
}

for (const id in ENGINES) {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = ENGINES[id].label;
    engineSelect.appendChild(opt);
}
engineSelect.value = currentEngine;
engineSelect.addEventListener("change", () => {
    currentEngine = engineSelect.value;
    localStorage.setItem("nocturne-engine", currentEngine);
});

cloakSelect.innerHTML = '<option value="">Off</option>' +
    listCloaks().map(c => `<option value="${c.id}">${c.title.replace(/"/g, "&quot;")}</option>`).join("");
cloakSelect.value = localStorage.getItem("nocturne-cloak") || "";
cloakSelect.addEventListener("change", () => {
    const v = cloakSelect.value;
    if (v) applyCloak(v); else resetCloak();
});
restoreCloak();

document.getElementById("resetProxyBtn").addEventListener("click", () => {
    localStorage.setItem("nocturne-reset", "true");
    location.reload();
});

document.querySelectorAll(".link-btn[data-url]").forEach(btn => {
    btn.addEventListener("click", () => load(btn.getAttribute("data-url")));
});

wireHoverPrefetch();

document.addEventListener("keydown", e => {
    if (e.ctrlKey && e.key.toLowerCase() === "q") {
        e.preventDefault();
        window.location.replace("https://www.google.com");
        return;
    }
    if (e.ctrlKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        if (toolbar.classList.contains("visible")) { urlBar.focus(); urlBar.select(); }
        else searchHome.focus();
        return;
    }
    if (e.key === "Escape" && settingsPanel.classList.contains("open")) {
        settingsPanel.classList.remove("open");
    }
});

window.addEventListener("popstate", () => {
    const p = window.location.pathname;
    if (p.startsWith("/search/")) {
        const decoded = deobfuscate(p.slice(8));
        if (decoded) load(decoded, false);
    } else {
        showHome(false);
    }
});

const initPath = window.location.pathname;
if (initPath.startsWith("/search/")) {
    const decoded = deobfuscate(initPath.slice(8));
    if (decoded) load(decoded);
}

updateNavButtons();
initPerformance();
initWelcome();
