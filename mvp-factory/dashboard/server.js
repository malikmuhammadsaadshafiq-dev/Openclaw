const http = require("http");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const PORT = 3000;
const PATHS = {
  ideas: "/root/mvp-projects/ideas",
  validated: "/root/mvp-projects/validated",
  built: "/root/mvp-projects/built",
  stats: "/root/mvp-projects/stats.json",
  logs: "/root/.openclaw/logs/daemon.log",
  logsV11: "/root/.openclaw/logs/daemon-v11.log",
  skipped: "/root/mvp-projects/skipped",
  web: "/root/mvp-projects/web",
  mobile: "/root/mvp-projects/mobile",
  signals: "/root/mvp-projects/signals",
  installedSkills: "/root/mvp-projects/installed-skills.json",
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
  let fileStats;
  try { fileStats = JSON.parse(fs.readFileSync(PATHS.stats, "utf-8")); }
  catch { fileStats = { date: "", buildsToday: 0, researchesToday: 0, totalBuilt: 0, functionalityScore: 0 }; }

  const builtItems = readJsonDir(PATHS.built);
  const totalBuilt = builtItems.length;
  const liveCount = builtItems.filter(b => b.vercelUrl || b.liveUrl).length;
  const githubCount = builtItems.filter(b => b.githubUrl).length;

  const typeCounts = { web: 0, saas: 0, mobile: 0, extension: 0, api: 0 };
  for (const b of builtItems) {
    const t = (b.type || "web").toLowerCase();
    if (typeCounts.hasOwnProperty(t)) typeCounts[t]++;
    else typeCounts.web++;
  }

  let dirWebCount = 0, dirMobileCount = 0;
  try { dirWebCount = fs.readdirSync(PATHS.web).filter(f => fs.statSync(path.join(PATHS.web, f)).isDirectory()).length; } catch {}
  try { dirMobileCount = fs.readdirSync(PATHS.mobile).filter(f => fs.statSync(path.join(PATHS.mobile, f)).isDirectory()).length; } catch {}

  const webCount = Math.max(typeCounts.web, dirWebCount - typeCounts.saas - typeCounts.extension - typeCounts.api);
  const mobileCount = Math.max(typeCounts.mobile, dirMobileCount);

  let functionalityScore = 0;
  for (const b of builtItems) {
    functionalityScore += (b.functionalityScore || b.qualityScore || 0);
  }

  let queueCount = 0;
  try { queueCount = fs.readdirSync(PATHS.ideas).filter(f => f.endsWith(".json")).length; } catch {}

  let validatedCount = 0;
  try { validatedCount = fs.readdirSync(PATHS.validated).filter(f => f.endsWith(".json")).length; } catch {}

  let avgValidationScore = 0;
  const validatedBuilt = builtItems.filter(b => b.validation && b.validation.overallScore);
  if (validatedBuilt.length > 0) {
    avgValidationScore = validatedBuilt.reduce((sum, b) => sum + b.validation.overallScore, 0) / validatedBuilt.length;
  }

  return {
    ...fileStats,
    totalBuilt,
    webCount,
    saasCount: typeCounts.saas,
    mobileCount,
    extensionCount: typeCounts.extension,
    apiCount: typeCounts.api,
    liveCount,
    githubCount,
    queueCount,
    validatedCount,
    avgValidationScore: Math.round(avgValidationScore * 10) / 10,
    functionalityScore: functionalityScore || fileStats.functionalityScore || 0,
    version: "v11-multiagent",
  };
}

function readLogs(n = 200) {
  for (const logPath of [PATHS.logsV11, PATHS.logs]) {
    try {
      const data = fs.readFileSync(logPath, "utf-8");
      const lines = data.split("\n").filter(Boolean);
      return lines.slice(-n);
    } catch {}
  }
  return [];
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
    return { status: active, pid, memory: mem, since: uptime, systemUptime: cpu, version: "v11-multiagent" };
  } catch { return { status: "unknown", pid: "", memory: "", since: "", systemUptime: "", version: "v11-multiagent" }; }
}

function getCurrentBuild() {
  const logs = readLogs(50);
  let current = null;
  for (let i = logs.length - 1; i >= 0; i--) {
    const line = logs[i];
    if (line.includes("PIPELINE COMPLETE") || line.includes("MVP COMPLETE") || line.includes("Build error") || line.includes("Queue empty")) break;
    const match = line.match(/SELECTED: "(.+?)"|Building MVP: (.+?)\s|Building from queue: "(.+?)"/);
    if (match) { current = { title: match[1] || match[2] || match[3], startedAt: line.match(/\[(.*?)\]/)?.[1] || "" }; break; }
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
    const allFiles = fs.readdirSync(PATHS.signals).filter(f => f.endsWith(".json"));
    if (!allFiles.length) return { signals: [], file: null, totalFiles: 0, totalSignals: 0, sources: {} };

    const redditFiles = allFiles.filter(f => f.startsWith("reddit-")).sort().reverse();
    const hnFiles = allFiles.filter(f => f.startsWith("hackernews-")).sort().reverse();
    const devtoFiles = allFiles.filter(f => f.startsWith("devto-")).sort().reverse();

    const readLatestFile = (files) => {
      if (!files.length) return [];
      try { return JSON.parse(fs.readFileSync(path.join(PATHS.signals, files[0]), "utf-8")); }
      catch { return []; }
    };

    const redditSigs = readLatestFile(redditFiles).map(s => ({ ...s, source: s.source || "reddit" }));
    const hnSigs = readLatestFile(hnFiles).map(s => ({ ...s, source: s.source || "hackernews" }));
    const devtoSigs = readLatestFile(devtoFiles).map(s => ({ ...s, source: s.source || "devto" }));

    const combined = [...redditSigs, ...hnSigs, ...devtoSigs];
    combined.sort((a, b) => {
      const eA = (a.score || 0) + 2 * (a.numComments || 0) + 5 * (a.keywords ? a.keywords.length : 0);
      const eB = (b.score || 0) + 2 * (b.numComments || 0) + 5 * (b.keywords ? b.keywords.length : 0);
      return eB - eA;
    });

    let totalSignals = 0;
    for (const f of allFiles) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(PATHS.signals, f), "utf-8"));
        totalSignals += Array.isArray(data) ? data.length : 0;
      } catch {}
    }

    const latestFile = redditFiles[0] || hnFiles[0] || devtoFiles[0];
    return {
      signals: combined,
      file: latestFile,
      totalFiles: allFiles.length,
      totalSignals,
      sources: { reddit: redditSigs.length, hackernews: hnSigs.length, devto: devtoSigs.length },
    };
  } catch { return { signals: [], file: null, totalFiles: 0, totalSignals: 0, sources: {} }; }
}

function readInstalledSkills() {
  try { return JSON.parse(fs.readFileSync(PATHS.installedSkills, "utf-8")); }
  catch { return null; }
}

function writeInstalledSkills(installed) {
  fs.writeFileSync(PATHS.installedSkills, JSON.stringify(installed, null, 2));
}

function installSkill(name) {
  const skills = getClawHubSkillsRaw();
  const skill = skills.find(s => s.name === name);
  if (!skill) return { success: false, error: "Skill not found" };
  if (skill.installed) return { success: false, error: "Already installed" };
  let installed = readInstalledSkills();
  if (!installed) { installed = {}; skills.forEach(s => { installed[s.name] = s.installed; }); }
  installed[name] = true;
  writeInstalledSkills(installed);
  return { success: true, name, message: name + " installed successfully" };
}

function uninstallSkill(name) {
  const skills = getClawHubSkillsRaw();
  const skill = skills.find(s => s.name === name);
  if (!skill) return { success: false, error: "Skill not found" };
  let installed = readInstalledSkills();
  if (!installed) { installed = {}; skills.forEach(s => { installed[s.name] = s.installed; }); }
  installed[name] = false;
  writeInstalledSkills(installed);
  return { success: true, name, message: name + " uninstalled" };
}

function getClawHubSkillsRaw() {
  return [
    { name: "ATXP", desc: "Web search, AI image generation, music creation", downloads: 22836, category: "search", color: "#8b5cf6", installed: true, verified: true, rating: 4.8, version: "3.2.1", author: "ATXP Labs", featured: true },
    { name: "Gog", desc: "Google Workspace - Gmail, Calendar, Drive integration", downloads: 21450, category: "productivity", color: "#f43f5e", installed: false, verified: true, rating: 4.7, version: "2.8.0", author: "Gog Team", featured: true },
    { name: "Self-Improving Agent", desc: "Continuous learning framework for autonomous agents", downloads: 20480, category: "ai", color: "#06b6d4", installed: true, verified: true, rating: 4.9, version: "1.5.0", author: "VoltAgent", featured: true },
    { name: "Wacli", desc: "WhatsApp messaging and history search", downloads: 19289, category: "comms", color: "#10b981", installed: false, verified: true, rating: 4.5, version: "2.1.4", author: "Wacli Dev" },
    { name: "Agent Browser", desc: "Headless browser automation and web scraping", downloads: 17607, category: "browser", color: "#3b82f6", installed: true, verified: true, rating: 4.6, version: "4.0.2", author: "BrowserAgent" },
    { name: "Tavily Web Search", desc: "AI-optimized search via Tavily API", downloads: 17431, category: "search", color: "#f59e0b", installed: false, verified: true, rating: 4.4, version: "1.9.0", author: "Tavily" },
    { name: "GitHub", desc: "Repository management, CI/CD, issues and PRs", downloads: 16090, category: "dev", color: "#f0f2f5", installed: true, verified: true, rating: 4.8, version: "5.1.0", author: "OpenClaw Core" },
    { name: "Summarize", desc: "URL and file summarization with AI", downloads: 16359, category: "ai", color: "#ec4899", installed: true, verified: true, rating: 4.3, version: "2.4.1", author: "SummarizeAI" },
    { name: "Claude Team", desc: "Orchestrate multiple Claude Code workers via iTerm2", downloads: 14200, category: "coding", color: "#d4a574", installed: false, verified: true, rating: 4.7, version: "1.2.0", author: "Anthropic Community" },
    { name: "MCP Builder", desc: "Guide for creating high-quality MCP servers", downloads: 13800, category: "dev", color: "#22d3ee", installed: true, verified: true, rating: 4.6, version: "2.0.3", author: "MCP Labs" },
    { name: "Git Essentials", desc: "Essential Git commands and workflows for version control", downloads: 12540, category: "dev", color: "#f97316", installed: true, verified: false, rating: 4.5, version: "3.1.0", author: "GitMaster" },
    { name: "Puppeteer Pro", desc: "Advanced browser automation with Puppeteer", downloads: 11200, category: "browser", color: "#22c55e", installed: false, verified: true, rating: 4.4, version: "2.3.1", author: "PuppeteerTeam" },
    { name: "Playwright Agent", desc: "Cross-browser testing and automation", downloads: 10800, category: "browser", color: "#6366f1", installed: false, verified: true, rating: 4.5, version: "1.8.0", author: "PlaywrightAI" },
    { name: "RAG Pipeline", desc: "Retrieval-augmented generation for knowledge bases", downloads: 15200, category: "ai", color: "#a855f7", installed: false, verified: true, rating: 4.7, version: "2.1.0", author: "RAG Labs", featured: true },
    { name: "Vision Analyzer", desc: "Image analysis and OCR with multimodal AI", downloads: 9800, category: "ai", color: "#14b8a6", installed: false, verified: true, rating: 4.3, version: "1.4.2", author: "VisionAI" },
    { name: "Code Reviewer", desc: "AI-powered code review with security scanning", downloads: 11500, category: "coding", color: "#f472b6", installed: true, verified: true, rating: 4.6, version: "3.0.1", author: "CodeSafe" },
    { name: "Nano Banana Pro", desc: "AI image generation and editing with DALL-E", downloads: 8339, category: "media", color: "#a78bfa", installed: false, verified: false, rating: 4.1, version: "1.6.0", author: "NanoBanana" },
    { name: "Nano Pdf", desc: "PDF editing, merging, and extraction with natural language", downloads: 8322, category: "media", color: "#60a5fa", installed: false, verified: false, rating: 4.0, version: "1.3.2", author: "NanoPDF" },
    { name: "Obsidian", desc: "Markdown note vault automation and linking", downloads: 8307, category: "notes", color: "#34d399", installed: false, verified: true, rating: 4.5, version: "2.2.0", author: "Obsidian Community" },
    { name: "Notion", desc: "Page and database management for Notion", downloads: 8110, category: "productivity", color: "#fbbf24", installed: false, verified: true, rating: 4.4, version: "2.0.1", author: "Notion Labs" },
    { name: "Stripe", desc: "Payment processing, subscriptions, and invoicing", downloads: 7563, category: "business", color: "#635bff", installed: false, verified: true, rating: 4.6, version: "3.5.0", author: "Stripe" },
    { name: "Xero", desc: "Accounting, invoicing, and financial reporting", downloads: 7387, category: "business", color: "#13b5ea", installed: false, verified: true, rating: 4.2, version: "1.7.0", author: "Xero Dev" },
    { name: "Salesforce", desc: "CRM data, sObject management, and automation", downloads: 7369, category: "business", color: "#00a1e0", installed: false, verified: true, rating: 4.3, version: "2.4.0", author: "SF Community" },
    { name: "Brave Search", desc: "Privacy-focused web search without browser", downloads: 6700, category: "search", color: "#fb542b", installed: false, verified: true, rating: 4.2, version: "1.5.3", author: "Brave" },
    { name: "Perplexity", desc: "AI-powered research and citation search", downloads: 9200, category: "search", color: "#20b2aa", installed: false, verified: true, rating: 4.6, version: "1.3.0", author: "Perplexity AI" },
    { name: "Docker Agent", desc: "Container management, builds, and orchestration", downloads: 8900, category: "devops", color: "#2496ed", installed: false, verified: true, rating: 4.4, version: "2.1.0", author: "DockerAI" },
    { name: "Vercel Deploy", desc: "Seamless Vercel deployment and project management", downloads: 7800, category: "devops", color: "#f0f2f5", installed: true, verified: true, rating: 4.5, version: "1.9.2", author: "Vercel Community" },
    { name: "AWS CLI Agent", desc: "AWS resource management via natural language", downloads: 6500, category: "devops", color: "#ff9900", installed: false, verified: true, rating: 4.3, version: "1.6.0", author: "AWS Community" },
    { name: "Slack", desc: "Channel messaging, threads, and workspace management", downloads: 10200, category: "comms", color: "#4a154b", installed: false, verified: true, rating: 4.5, version: "2.3.0", author: "Slack Dev" },
    { name: "Discord Bot", desc: "Server management, messaging, and moderation", downloads: 7100, category: "comms", color: "#5865f2", installed: false, verified: false, rating: 4.2, version: "1.4.1", author: "DiscordBot" },
    { name: "Shell Master", desc: "Advanced shell scripting and system automation", downloads: 6200, category: "cli", color: "#a3e635", installed: false, verified: false, rating: 4.1, version: "1.2.0", author: "ShellDev" },
    { name: "Cron Manager", desc: "Scheduled task creation and monitoring", downloads: 5800, category: "cli", color: "#38bdf8", installed: false, verified: false, rating: 4.0, version: "1.1.0", author: "CronMgr" },
    { name: "MoltBook", desc: "The social network for AI agents - post and interact", downloads: 8600, category: "social", color: "#e879f9", installed: false, verified: true, rating: 4.4, version: "1.7.0", author: "VoltAgent", featured: true },
    { name: "Twitter/X Agent", desc: "Tweet posting, search, and engagement automation", downloads: 7400, category: "marketing", color: "#1d9bf0", installed: false, verified: true, rating: 4.3, version: "2.0.0", author: "XAgent" },
  ];
}

function getClawHubSkills() {
  const skills = getClawHubSkillsRaw();
  const installed = readInstalledSkills();
  if (installed) {
    skills.forEach(s => {
      if (installed.hasOwnProperty(s.name)) s.installed = installed[s.name];
    });
  }
  return skills;
}

function getSquadronAgents() {
  const logs = readLogs(100);

  function getAgentStatus(agentName) {
    for (let i = logs.length - 1; i >= 0; i--) {
      if (logs[i].includes("[" + agentName + "]")) return "active";
    }
    return "idle";
  }

  function getLastAction(agentName) {
    for (let i = logs.length - 1; i >= 0; i--) {
      if (logs[i].includes("[" + agentName + "]")) {
        const parts = logs[i].split("] ");
        const msg = parts[parts.length - 1] || "";
        return msg.replace("[" + agentName + "] ", "").slice(0, 80);
      }
    }
    return "Waiting for pipeline...";
  }

  return [
    { name: "ResearchAgent", role: "Research", desc: "Reddit, HN, Dev.to, GitHub Trending", status: getAgentStatus("ResearchAgent"), avatar: "RA", color: "#f59e0b", lastAction: getLastAction("ResearchAgent"), skills: ["Reddit API", "HN Algolia", "Dev.to API", "GitHub Trending"] },
    { name: "ValidationAgent", role: "Validation", desc: "Market validation & scoring", status: getAgentStatus("ValidationAgent"), avatar: "VA", color: "#ef4444", lastAction: getLastAction("ValidationAgent"), skills: ["Market Analysis", "Competition Gap", "Audience Profiling", "Scoring"] },
    { name: "FrontendAgent", role: "Frontend", desc: "Psychology-driven UI design", status: getAgentStatus("FrontendAgent"), avatar: "FA", color: "#3b82f6", lastAction: getLastAction("FrontendAgent"), skills: ["UX Psychology", "Design Systems", "Conversion", "Responsive"] },
    { name: "BackendAgent", role: "Backend", desc: "Working APIs & integrations", status: getAgentStatus("BackendAgent"), avatar: "BA", color: "#10b981", lastAction: getLastAction("BackendAgent"), skills: ["API Routes", "AI Integration", "Data Processing", "Auth"] },
    { name: "PMAgent", role: "PM", desc: "Pipeline orchestration & QA", status: getAgentStatus("PMAgent"), avatar: "PM", color: "#8b5cf6", lastAction: getLastAction("PMAgent"), skills: ["Orchestration", "Quality Gate", "Deploy", "Monitoring"] },
  ];
}

function parseStructuredLogs(n = 200) {
  const lines = readLogs(n);
  return lines.map(line => {
    const tsMatch = line.match(/^\[([^\]]+)\]/);
    const timestamp = tsMatch ? tsMatch[1] : "";
    const levelMatch = line.match(/\[(INFO|ERROR|WARN|AGENT)\]/);
    const level = levelMatch ? levelMatch[1] : "INFO";
    let agent = null;
    if (line.includes("[ResearchAgent]")) agent = "ResearchAgent";
    else if (line.includes("[ValidationAgent]")) agent = "ValidationAgent";
    else if (line.includes("[FrontendAgent]")) agent = "FrontendAgent";
    else if (line.includes("[BackendAgent]")) agent = "BackendAgent";
    else if (line.includes("[PMAgent]")) agent = "PMAgent";
    const isPhase = line.includes("==========");
    const message = line.replace(/^\[[^\]]+\]\s*(\[(INFO|ERROR|WARN|AGENT)\]\s*)?(\[[^\]]+\]\s*)?/, "");
    return { timestamp, level, agent, message, isPhase, raw: line };
  });
}

function getValidatedQueue() {
  return readJsonDir(PATHS.validated)
    .sort((a, b) => (b.validation?.overallScore || 0) - (a.validation?.overallScore || 0));
}

function handleApi(url, res) {
  let data;
  switch (url) {
    case "/api/status": data = getDaemonStatus(); break;
    case "/api/stats": data = readStats(); break;
    case "/api/queue": data = readJsonDir(PATHS.ideas).sort((a, b) => (b.viabilityScore || 0) - (a.viabilityScore || 0)); break;
    case "/api/validated": data = getValidatedQueue(); break;
    case "/api/built": data = readJsonDir(PATHS.built).sort((a, b) => (b.builtAt || "").localeCompare(a.builtAt || "")); break;
    case "/api/logs": data = readLogs(200); break;
    case "/api/current": data = getCurrentBuild(); break;
    case "/api/system": data = getSystemInfo(); break;
    case "/api/signals": data = readLatestSignals(); break;
    case "/api/skills": data = getClawHubSkills(); break;
    case "/api/squadron": data = getSquadronAgents(); break;
    case "/api/logs/structured": data = parseStructuredLogs(200); break;
    default: return false;
  }
  res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-cache" });
  res.end(JSON.stringify(data));
  return true;
}

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

  if (req.method === "POST" && (url === "/api/skills/install" || url === "/api/skills/uninstall")) {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      try {
        const { name } = JSON.parse(body);
        const result = url === "/api/skills/install" ? installSkill(name) : uninstallSkill(name);
        res.writeHead(result.success ? 200 : 400, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: "Invalid request" }));
      }
    });
    return;
  }

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
  console.log("MVP Factory v11 Multi-Agent Dashboard on http://0.0.0.0:" + PORT);
});
