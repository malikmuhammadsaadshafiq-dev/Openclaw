const http = require("http");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const PORT = 3000;
const PATHS = {
  ideas: "/root/mvp-projects/ideas",
  built: "/root/mvp-projects/built",
  stats: "/root/mvp-projects/stats.json",
  logs: "/root/.neurafinity/logs/daemon.log",
  skipped: "/root/mvp-projects/skipped",
  web: "/root/mvp-projects/web",
  mobile: "/root/mvp-projects/mobile",
  signals: "/root/mvp-projects/signals",
};

function readJsonDir(dir) {
  try {
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
    return files.map((f) => {
      try { return JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8")); }
      catch { return null; }
    }).filter(Boolean);
  } catch { return []; }
}

function readStats() {
  try { return JSON.parse(fs.readFileSync(PATHS.stats, "utf-8")); }
  catch { return { date: "", buildsToday: 0, researchesToday: 0, totalBuilt: 0, functionalityScore: 0 }; }
}

function readLogs(n = 150) {
  try {
    const data = fs.readFileSync(PATHS.logs, "utf-8");
    const lines = data.split("\n").filter(Boolean);
    return lines.slice(-n);
  } catch { return []; }
}

function getDaemonStatus() {
  try {
    const active = execSync("systemctl is-active mvp-factory 2>/dev/null || echo stopped", { timeout: 5000 }).toString().trim();
    let pid = "", mem = "", uptime = "", cpu = "";
    try {
      const show = execSync("systemctl show mvp-factory --property=ActiveEnterTimestamp,MainPID,MemoryCurrent 2>/dev/null", { timeout: 5000 }).toString();
      const props = Object.fromEntries(show.trim().split("\n").map(l => { const i = l.indexOf("="); return [l.slice(0,i), l.slice(i+1)]; }));
      pid = props.MainPID || "";
      mem = props.MemoryCurrent ? (parseInt(props.MemoryCurrent) / 1024 / 1024).toFixed(0) + " MB" : "";
      uptime = props.ActiveEnterTimestamp || "";
    } catch {}
    try {
      const sysInfo = execSync("uptime -p 2>/dev/null | head -1", { timeout: 3000 }).toString().trim();
      cpu = sysInfo;
    } catch {}
    return { status: active, pid, memory: mem, since: uptime, systemUptime: cpu };
  } catch { return { status: "unknown", pid: "", memory: "", since: "", systemUptime: "" }; }
}

function getCurrentBuild() {
  const logs = readLogs(50);
  let current = null;
  for (let i = logs.length - 1; i >= 0; i--) {
    const line = logs[i];
    if (line.includes("MVP COMPLETE") || line.includes("Build error") || line.includes("Queue empty")) break;
    const match = line.match(/Building: (.+)/);
    if (match) { current = { title: match[1], startedAt: line.match(/\[(.*?)\]/)?.[1] || "" }; break; }
  }
  return current;
}

function getSystemInfo() {
  try {
    const disk = execSync("df -h / | tail -1 | awk '{print $3\"/\"$2\" (\"$5\")\"}'", { timeout: 3000 }).toString().trim();
    const memInfo = execSync("free -h | awk '/Mem:/{print $3\"/\"$2}'", { timeout: 3000 }).toString().trim();
    const loadAvg = execSync("cat /proc/loadavg | awk '{print $1, $2, $3}'", { timeout: 3000 }).toString().trim();
    return { disk, memory: memInfo, load: loadAvg };
  } catch { return { disk: "", memory: "", load: "" }; }
}

function readLatestSignals() {
  try {
    const files = fs.readdirSync(PATHS.signals).filter(f => f.startsWith("reddit-") && f.endsWith(".json"));
    if (!files.length) return { signals: [], file: null, totalFiles: 0, totalSignals: 0 };
    files.sort().reverse();
    const latestFile = files[0];
    const signals = JSON.parse(fs.readFileSync(path.join(PATHS.signals, latestFile), "utf-8"));
    let totalSignals = 0;
    for (const f of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(PATHS.signals, f), "utf-8"));
        totalSignals += data.length;
      } catch {}
    }
    return { signals, file: latestFile, totalFiles: files.length, totalSignals };
  } catch { return { signals: [], file: null, totalFiles: 0, totalSignals: 0 }; }
}

function getClawHubSkills() {
  return [
    { name: "ATXP", desc: "Web search, AI image generation, music creation", downloads: 22836, category: "search", color: "#8b5cf6", installed: true },
    { name: "Self-Improving Agent", desc: "Continuous learning framework for agents", downloads: 20480, category: "ai", color: "#06b6d4", installed: true },
    { name: "Wacli", desc: "WhatsApp messaging and history search", downloads: 19289, category: "comms", color: "#10b981", installed: false },
    { name: "Agent Browser", desc: "Headless browser automation", downloads: 17607, category: "automation", color: "#3b82f6", installed: true },
    { name: "Tavily Web Search", desc: "AI-optimized search via Tavily API", downloads: 17431, category: "search", color: "#f59e0b", installed: false },
    { name: "GitHub", desc: "Repository and CI/CD management", downloads: 16090, category: "dev", color: "#f0f2f5", installed: true },
    { name: "Summarize", desc: "URL and file summarization", downloads: 16359, category: "ai", color: "#ec4899", installed: true },
    { name: "Gog", desc: "Google Workspace - Gmail, Calendar, Drive", downloads: 21450, category: "productivity", color: "#f43f5e", installed: false },
    { name: "Nano Banana Pro", desc: "AI image generation and editing", downloads: 8339, category: "media", color: "#a78bfa", installed: false },
    { name: "Nano Pdf", desc: "PDF editing with natural language", downloads: 8322, category: "media", color: "#60a5fa", installed: false },
    { name: "Obsidian", desc: "Markdown note vault automation", downloads: 8307, category: "productivity", color: "#34d399", installed: false },
    { name: "Notion", desc: "Page and database management", downloads: 8110, category: "productivity", color: "#fbbf24", installed: false },
    { name: "Stripe", desc: "Payment processing and subscriptions", downloads: 7563, category: "business", color: "#635bff", installed: false },
    { name: "Xero", desc: "Accounting and financial reporting", downloads: 7387, category: "business", color: "#13b5ea", installed: false },
    { name: "Salesforce", desc: "CRM data and sObject management", downloads: 7369, category: "business", color: "#00a1e0", installed: false },
    { name: "Brave Search", desc: "Web search without browser requirement", downloads: 6700, category: "search", color: "#fb542b", installed: false },
  ];
}

function getSquadronAgents() {
  return [
    { name: "FrontendClaw", role: "Frontend", wallet: "0xdb1b...e5fb", status: "active", avatar: "FC", color: "#3b82f6" },
    { name: "BackendClaw", role: "Backend", wallet: "0x0868...EC98", status: "active", avatar: "BC", color: "#10b981" },
    { name: "ContractClaw", role: "Contract", wallet: "0xa84b...A529", status: "idle", avatar: "CC", color: "#f59e0b" },
    { name: "PMClaw", role: "PM", wallet: "0x5A0E...AaDf", status: "active", avatar: "PM", color: "#8b5cf6" },
  ];
}

function handleApi(url, res) {
  let data;
  switch (url) {
    case "/api/status": data = getDaemonStatus(); break;
    case "/api/stats": data = readStats(); break;
    case "/api/queue": data = readJsonDir(PATHS.ideas).sort((a, b) => (b.viabilityScore || 0) - (a.viabilityScore || 0)); break;
    case "/api/built": data = readJsonDir(PATHS.built).sort((a, b) => (b.builtAt || "").localeCompare(a.builtAt || "")); break;
    case "/api/logs": data = readLogs(150); break;
    case "/api/current": data = getCurrentBuild(); break;
    case "/api/system": data = getSystemInfo(); break;
    case "/api/signals": data = readLatestSignals(); break;
    case "/api/skills": data = getClawHubSkills(); break;
    case "/api/squadron": data = getSquadronAgents(); break;
    default: return false;
  }
  res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-cache" });
  res.end(JSON.stringify(data));
  return true;
}

// Load HTML from external file
const HTML_PATH = path.join(__dirname, "dashboard.html");
let HTML_CACHE = null;

function getHTML() {
  if (!HTML_CACHE || process.env.NODE_ENV !== "production") {
    HTML_CACHE = fs.readFileSync(HTML_PATH, "utf-8");
  }
  return HTML_CACHE;
}

const server = http.createServer((req, res) => {
  const url = req.url.split("?")[0];
  if (url.startsWith("/api/")) {
    if (!handleApi(url, res)) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
    }
    return;
  }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(getHTML());
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("MVP Factory Dashboard running on http://0.0.0.0:" + PORT);
});
