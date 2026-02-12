const http = require("http");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const PORT = 3000;
const PATHS = {
  ideas: "/root/mvp-projects/ideas",
  built: "/root/mvp-projects/built",
  stats: "/root/mvp-projects/stats.json",
  logs: "/root/.openclaw/logs/daemon.log",
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
    // Count total signals across all files
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
    default: return false;
  }
  res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-cache" });
  res.end(JSON.stringify(data));
  return true;
}

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MVP Factory | Command Center</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>&#x1f9de;</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
/* ========== RESET & BASE ========== */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}

:root{
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
  --ease-snap: cubic-bezier(0.5, 0, 0, 1);

  --glass: rgba(255,255,255,0.04);
  --glass-border: rgba(255,255,255,0.07);
  --glass-hover: rgba(255,255,255,0.12);
  --glass-active: rgba(255,255,255,0.18);

  --bg-deep: #06060f;
  --bg-surface: #0c0c1d;
  --text-primary: #f0f2f5;
  --text-secondary: #8892a4;
  --text-tertiary: #505a6b;

  --accent-purple: #8b5cf6;
  --accent-blue: #3b82f6;
  --accent-cyan: #06b6d4;
  --accent-green: #10b981;
  --accent-amber: #f59e0b;
  --accent-rose: #f43f5e;
  --accent-pink: #ec4899;

  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-xl: 32px;
}

body{
  background: var(--bg-deep);
  min-height:100vh;
  font-family:'Inter',system-ui,-apple-system,sans-serif;
  color: var(--text-primary);
  overflow-x:hidden;
  position:relative;
}

/* ========== AURORA + MESH BACKGROUND ========== */
.bg-layer{
  position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;
}
.aurora-orb{
  position:absolute;border-radius:50%;
  filter:blur(100px);opacity:0.3;
  will-change:transform;
}
.aurora-orb:nth-child(1){
  width:70vw;height:70vw;
  background:radial-gradient(circle, var(--accent-purple), transparent 70%);
  top:-35%;left:-15%;
  animation:aurora-1 25s ease-in-out infinite alternate;
}
.aurora-orb:nth-child(2){
  width:55vw;height:55vw;
  background:radial-gradient(circle, var(--accent-cyan), transparent 70%);
  bottom:-30%;right:-10%;
  animation:aurora-2 20s ease-in-out infinite alternate;
}
.aurora-orb:nth-child(3){
  width:40vw;height:40vw;
  background:radial-gradient(circle, var(--accent-pink), transparent 70%);
  top:30%;left:50%;
  opacity:0.15;
  animation:aurora-3 30s ease-in-out infinite alternate;
}
@keyframes aurora-1{
  0%{transform:translate(0,0) scale(1) rotate(0deg)}
  33%{transform:translate(5%,8%) scale(1.08) rotate(3deg)}
  66%{transform:translate(-3%,5%) scale(0.95) rotate(-2deg)}
  100%{transform:translate(2%,-3%) scale(1.05) rotate(1deg)}
}
@keyframes aurora-2{
  0%{transform:translate(0,0) scale(1)}
  50%{transform:translate(-8%,-5%) scale(1.15)}
  100%{transform:translate(5%,8%) scale(0.9)}
}
@keyframes aurora-3{
  0%{transform:translate(0,0) scale(1) rotate(0deg)}
  100%{transform:translate(-15%,10%) scale(1.2) rotate(10deg)}
}

/* Dot grid overlay */
.dot-grid{
  position:fixed;inset:0;z-index:0;pointer-events:none;
  background-image:radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size:32px 32px;
}

/* Noise texture */
.noise-overlay{
  position:fixed;inset:0;z-index:0;pointer-events:none;
  opacity:0.025;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  mix-blend-mode:overlay;
}

/* ========== LAYOUT ========== */
.app{position:relative;z-index:1;min-height:100vh;display:flex;flex-direction:column}
.container{max-width:1500px;margin:0 auto;padding:1.25rem 1.5rem;width:100%}

/* ========== HEADER ========== */
header{
  padding:1.25rem 0 0.5rem;
  display:flex;align-items:center;justify-content:space-between;
  flex-wrap:wrap;gap:1rem;
}
.logo-group{display:flex;align-items:center;gap:0.75rem}
.logo-icon{
  width:42px;height:42px;border-radius:14px;
  background:linear-gradient(135deg, var(--accent-purple), var(--accent-cyan));
  display:flex;align-items:center;justify-content:center;
  font-size:1.25rem;
  box-shadow:0 4px 20px rgba(139,92,246,0.3);
}
.logo-text h1{
  font-size:clamp(1.25rem,3vw,1.75rem);font-weight:800;
  letter-spacing:-0.03em;line-height:1.1;
  background:linear-gradient(135deg, #c4b5fd 0%, #e0e7ff 30%, #a5f3fc 60%, #c4b5fd 100%);
  background-size:300% 100%;
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  background-clip:text;
  animation:gradient-shift 6s ease infinite;
}
@keyframes gradient-shift{
  0%{background-position:0% 50%}
  50%{background-position:100% 50%}
  100%{background-position:0% 50%}
}
.logo-text span{font-size:0.7rem;color:var(--text-tertiary);font-weight:500;letter-spacing:0.04em;text-transform:uppercase}

.header-controls{display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap}

/* Status pill */
.status-pill{
  display:inline-flex;align-items:center;gap:0.5rem;
  padding:0.4rem 0.9rem;border-radius:9999px;
  font-size:0.75rem;font-weight:600;
  background:rgba(255,255,255,0.04);
  border:1px solid rgba(255,255,255,0.08);
  backdrop-filter:blur(8px);
}
.status-dot{
  width:7px;height:7px;border-radius:50%;flex-shrink:0;
  position:relative;
}
.status-dot::after{
  content:"";position:absolute;inset:-3px;border-radius:50%;
  animation:pulse-ring 2s ease-in-out infinite;
}
.status-dot.green{background:#34d399;box-shadow:0 0 8px #34d399}
.status-dot.green::after{border:1px solid rgba(52,211,153,0.4)}
.status-dot.red{background:#f87171;box-shadow:0 0 8px #f87171}
.status-dot.red::after{border:1px solid rgba(248,113,113,0.4)}
.status-dot.amber{background:#fbbf24;box-shadow:0 0 8px #fbbf24}
.status-dot.amber::after{border:1px solid rgba(251,191,36,0.4)}
@keyframes pulse-ring{
  0%,100%{opacity:1;transform:scale(1)}
  50%{opacity:0;transform:scale(1.8)}
}

/* System badges */
.sys-badge{
  font-size:0.65rem;color:var(--text-tertiary);
  padding:0.25rem 0.6rem;border-radius:6px;
  background:rgba(255,255,255,0.03);
  border:1px solid rgba(255,255,255,0.05);
  font-family:'JetBrains Mono',monospace;
}

/* Time + refresh */
.meta-time{font-size:0.68rem;color:var(--text-tertiary);font-variant-numeric:tabular-nums}
.btn-refresh{
  display:inline-flex;align-items:center;gap:0.4rem;
  background:rgba(255,255,255,0.06);
  border:1px solid rgba(255,255,255,0.1);
  color:var(--text-secondary);
  padding:0.45rem 0.9rem;border-radius:var(--radius-sm);
  cursor:pointer;font-size:0.75rem;font-weight:600;
  font-family:inherit;
  transition:all 0.2s var(--ease-spring);
}
.btn-refresh:hover{
  background:rgba(255,255,255,0.1);
  color:var(--text-primary);
  transform:translateY(-1px);
  box-shadow:0 4px 12px rgba(0,0,0,0.2);
}
.btn-refresh:active{transform:scale(0.96)}
.btn-refresh svg{width:14px;height:14px;transition:transform 0.5s var(--ease-smooth)}
.btn-refresh.spinning svg{animation:spin 0.6s linear}
@keyframes spin{to{transform:rotate(360deg)}}

/* ========== CARDS ========== */
.card{
  background:var(--glass);
  backdrop-filter:blur(20px) saturate(150%);
  -webkit-backdrop-filter:blur(20px) saturate(150%);
  border:1px solid var(--glass-border);
  border-radius:var(--radius-lg);
  padding:1.5rem;
  position:relative;
  overflow:hidden;
  transition:transform 0.4s var(--ease-spring),
             box-shadow 0.4s ease,
             border-color 0.3s;
}
.card:hover{
  transform:translateY(-4px);
  box-shadow:0 20px 50px -12px rgba(0,0,0,0.4);
  border-color:var(--glass-hover);
}
/* Spotlight follow on cards */
.card::before{
  content:"";position:absolute;inset:0;
  background:radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
    rgba(139,92,246,0.06), transparent 40%);
  pointer-events:none;opacity:0;
  transition:opacity 0.4s;z-index:0;
}
.card:hover::before{opacity:1}
.card>*{position:relative;z-index:1}

.card-header{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:1.25rem;
}
.card-title{
  font-size:0.78rem;font-weight:600;color:var(--text-secondary);
  text-transform:uppercase;letter-spacing:0.08em;
  display:flex;align-items:center;gap:0.5rem;
}
.card-count{
  font-size:0.7rem;color:var(--text-tertiary);
  font-variant-numeric:tabular-nums;
  padding:0.15rem 0.5rem;border-radius:6px;
  background:rgba(255,255,255,0.04);
}

/* ========== STAT CARDS ========== */
.stats-row{
  display:grid;
  grid-template-columns:repeat(6, 1fr);
  gap:0.75rem;
  margin:1rem 0 1.25rem;
}
.stat-card{
  text-align:center;
  padding:1.25rem 0.75rem 1rem;
  position:relative;
}
.stat-card .stat-icon{
  width:40px;height:40px;border-radius:12px;
  display:inline-flex;align-items:center;justify-content:center;
  font-size:1.1rem;margin-bottom:0.6rem;
  position:relative;
}
.stat-card:nth-child(1) .stat-icon{background:rgba(139,92,246,0.12);box-shadow:0 0 20px rgba(139,92,246,0.1)}
.stat-card:nth-child(2) .stat-icon{background:rgba(59,130,246,0.12);box-shadow:0 0 20px rgba(59,130,246,0.1)}
.stat-card:nth-child(3) .stat-icon{background:rgba(16,185,129,0.12);box-shadow:0 0 20px rgba(16,185,129,0.1)}
.stat-card:nth-child(4) .stat-icon{background:rgba(245,158,11,0.12);box-shadow:0 0 20px rgba(245,158,11,0.1)}
.stat-card:nth-child(5) .stat-icon{background:rgba(236,72,153,0.12);box-shadow:0 0 20px rgba(236,72,153,0.1)}
.stat-card:nth-child(6) .stat-icon{background:rgba(255,98,0,0.12);box-shadow:0 0 20px rgba(255,98,0,0.1)}

.stat-value{
  font-size:clamp(1.75rem,3vw,2.5rem);font-weight:800;
  line-height:1.1;letter-spacing:-0.03em;
  margin-bottom:0.25rem;
  font-variant-numeric:tabular-nums;
}
.stat-card:nth-child(1) .stat-value{background:linear-gradient(135deg,#c4b5fd,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.stat-card:nth-child(2) .stat-value{background:linear-gradient(135deg,#93c5fd,#60a5fa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.stat-card:nth-child(3) .stat-value{background:linear-gradient(135deg,#6ee7b7,#34d399);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.stat-card:nth-child(4) .stat-value{background:linear-gradient(135deg,#fcd34d,#fbbf24);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.stat-card:nth-child(5) .stat-value{background:linear-gradient(135deg,#f9a8d4,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.stat-card:nth-child(6) .stat-value{background:linear-gradient(135deg,#ff8c40,#ff6200);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}

.stat-label{font-size:0.7rem;color:var(--text-tertiary);font-weight:500}
.stat-sub{font-size:0.65rem;color:var(--text-tertiary);margin-top:0.2rem;opacity:0.7}

/* ========== CURRENT BUILD - ANIMATED BORDER ========== */
.current-build-card{
  position:relative;margin-bottom:1.25rem;
  isolation:isolate;
  border:none;
  background:transparent;
  padding:0;
}
.current-build-card::before{
  content:"";position:absolute;inset:0;border-radius:var(--radius-lg);
  padding:1.5px;
  background:conic-gradient(from var(--border-angle, 0deg), transparent 20%, var(--accent-purple) 40%, var(--accent-cyan) 60%, transparent 80%);
  -webkit-mask:linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite:xor;mask-composite:exclude;
  animation:rotate-border 4s linear infinite;
  opacity:0;transition:opacity 0.5s;
}
.current-build-card.active::before{opacity:1}
@property --border-angle{syntax:"<angle>";initial-value:0deg;inherits:false}
@keyframes rotate-border{to{--border-angle:360deg}}

.current-build-inner{
  background:var(--glass);
  backdrop-filter:blur(20px) saturate(150%);
  border:1px solid var(--glass-border);
  border-radius:var(--radius-lg);
  padding:1.5rem;
  position:relative;
}
.current-build-card.active .current-build-inner{
  border-color:rgba(139,92,246,0.2);
  background:linear-gradient(135deg, rgba(139,92,246,0.08), rgba(6,182,212,0.05));
}

.build-active{
  display:flex;align-items:center;gap:1.25rem;
}
.build-spinner{
  width:44px;height:44px;border-radius:50%;flex-shrink:0;
  border:3px solid rgba(255,255,255,0.08);
  border-top-color:var(--accent-purple);
  border-right-color:var(--accent-cyan);
  animation:spin-smooth 1s linear infinite;
  box-shadow:0 0 20px rgba(139,92,246,0.15);
}
@keyframes spin-smooth{to{transform:rotate(360deg)}}
.build-info h3{font-size:1.1rem;font-weight:700;margin-bottom:0.2rem}
.build-info p{font-size:0.75rem;color:var(--text-secondary)}

/* Progress bar */
.build-progress{
  margin-top:1rem;height:3px;
  background:rgba(255,255,255,0.06);border-radius:2px;
  overflow:hidden;
}
.build-progress-bar{
  height:100%;width:30%;border-radius:2px;
  background:linear-gradient(90deg, var(--accent-purple), var(--accent-cyan));
  animation:progress-indeterminate 2s ease-in-out infinite;
}
@keyframes progress-indeterminate{
  0%{width:10%;margin-left:0}
  50%{width:40%;margin-left:30%}
  100%{width:10%;margin-left:90%}
}

.build-idle{
  text-align:center;padding:1.5rem 1rem;
}
.idle-icon{
  font-size:2.5rem;margin-bottom:0.5rem;
  animation:float-gentle 4s ease-in-out infinite;
  filter:grayscale(0.3);
}
@keyframes float-gentle{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.idle-text{font-size:0.85rem;color:var(--text-tertiary);font-weight:500}
.idle-sub{font-size:0.7rem;color:var(--text-tertiary);opacity:0.6;margin-top:0.25rem}

/* ========== MAIN GRID ========== */
.main-grid{
  display:grid;
  grid-template-columns:1.3fr 1fr;
  gap:1.25rem;
}

/* ========== TERMINAL LOG VIEWER ========== */
.terminal{border-radius:var(--radius-lg);overflow:hidden}
.terminal-header{
  display:flex;align-items:center;gap:0.5rem;
  padding:0.75rem 1rem;
  background:rgba(255,255,255,0.03);
  border-bottom:1px solid rgba(255,255,255,0.05);
}
.terminal-dots{display:flex;gap:6px}
.terminal-dots span{width:10px;height:10px;border-radius:50%}
.terminal-dots span:nth-child(1){background:#ff5f57}
.terminal-dots span:nth-child(2){background:#febc2e}
.terminal-dots span:nth-child(3){background:#28c840}
.terminal-title{
  flex:1;text-align:center;
  font-size:0.7rem;color:var(--text-tertiary);
  font-family:'JetBrains Mono',monospace;
}
.terminal-badge{
  font-size:0.6rem;font-weight:600;
  padding:0.15rem 0.5rem;border-radius:4px;
  background:rgba(52,211,153,0.1);color:#34d399;
  text-transform:uppercase;letter-spacing:0.05em;
}

.log-viewer{
  background:rgba(0,0,0,0.35);
  padding:1rem;
  max-height:460px;overflow-y:auto;
  font-family:'JetBrains Mono',ui-monospace,monospace;
  font-size:0.68rem;line-height:1.8;
  scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.08) transparent;
}
.log-viewer::-webkit-scrollbar{width:5px}
.log-viewer::-webkit-scrollbar-track{background:transparent}
.log-viewer::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}
.log-viewer::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.15)}

.log-line{
  white-space:pre-wrap;word-break:break-all;
  padding:0.1rem 0;
  border-left:2px solid transparent;
  padding-left:0.75rem;
  transition:border-color 0.2s,background 0.2s;
}
.log-line:hover{background:rgba(255,255,255,0.02)}
.log-info{color:#8892a4}
.log-error{color:#f87171;font-weight:600;border-left-color:rgba(248,113,113,0.4)}
.log-warn{color:#fbbf24;border-left-color:rgba(251,191,36,0.3)}
.log-success{color:#34d399;border-left-color:rgba(52,211,153,0.3)}
.log-build{color:#a78bfa;font-weight:600;border-left-color:rgba(167,139,250,0.4)}
.log-deploy{color:#60a5fa;border-left-color:rgba(96,165,250,0.3)}

/* ========== RIGHT SIDEBAR ========== */
.sidebar-stack{display:flex;flex-direction:column;gap:1.25rem}

/* Tabs */
.tabs{
  display:flex;gap:0.25rem;
  background:rgba(255,255,255,0.03);
  border-radius:var(--radius-sm);
  padding:3px;
  margin-bottom:0.75rem;
}
.tab-btn{
  flex:1;padding:0.45rem 0.75rem;border:none;
  background:transparent;color:var(--text-tertiary);
  font-size:0.72rem;font-weight:600;
  font-family:inherit;cursor:pointer;
  border-radius:8px;
  transition:all 0.25s var(--ease-smooth);
}
.tab-btn.active{
  background:rgba(255,255,255,0.08);
  color:var(--text-primary);
  box-shadow:0 2px 8px rgba(0,0,0,0.15);
}
.tab-btn:hover:not(.active){color:var(--text-secondary)}

/* List items */
.list-scroll{max-height:400px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.06) transparent}
.list-scroll::-webkit-scrollbar{width:4px}
.list-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.06);border-radius:2px}

.list-item{
  padding:0.65rem 0.5rem;
  border-bottom:1px solid rgba(255,255,255,0.04);
  display:flex;align-items:center;gap:0.65rem;
  border-radius:var(--radius-sm);
  transition:background 0.2s;
  cursor:default;
}
.list-item:hover{background:rgba(255,255,255,0.03)}
.list-item:last-child{border-bottom:none}

.list-rank{
  font-size:0.65rem;font-weight:700;color:var(--text-tertiary);
  width:18px;text-align:center;flex-shrink:0;
  font-variant-numeric:tabular-nums;
}
.list-info{flex:1;min-width:0}
.list-title{
  font-size:0.8rem;font-weight:600;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.list-meta{
  font-size:0.65rem;color:var(--text-tertiary);
  margin-top:0.15rem;
  display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;
}

/* Badges */
.badge{
  padding:0.12rem 0.5rem;border-radius:6px;
  font-size:0.6rem;font-weight:700;
  text-transform:uppercase;letter-spacing:0.04em;
  flex-shrink:0;
  backdrop-filter:blur(4px);
}
.badge-web{background:rgba(59,130,246,0.12);color:#60a5fa;border:1px solid rgba(59,130,246,0.2)}
.badge-saas{background:rgba(139,92,246,0.12);color:#a78bfa;border:1px solid rgba(139,92,246,0.2)}
.badge-mobile{background:rgba(16,185,129,0.12);color:#34d399;border:1px solid rgba(16,185,129,0.2)}
.badge-extension{background:rgba(245,158,11,0.12);color:#fbbf24;border:1px solid rgba(245,158,11,0.2)}
.badge-api{background:rgba(236,72,153,0.12);color:#f472b6;border:1px solid rgba(236,72,153,0.2)}

/* Score bar */
.score-wrap{display:flex;align-items:center;gap:0.4rem;flex-shrink:0}
.score-num{font-size:0.6rem;font-weight:700;color:var(--text-tertiary);font-variant-numeric:tabular-nums;width:14px;text-align:right}
.score-bar{
  width:52px;height:4px;background:rgba(255,255,255,0.06);
  border-radius:2px;overflow:hidden;
}
.score-fill{height:100%;border-radius:2px;transition:width 0.6s var(--ease-smooth)}
.score-high{background:linear-gradient(90deg,#34d399,#10b981)}
.score-mid{background:linear-gradient(90deg,#60a5fa,#3b82f6)}
.score-low{background:linear-gradient(90deg,#fbbf24,#f59e0b)}

/* Link buttons */
.link-row{display:flex;gap:0.35rem;flex-shrink:0}
.link-btn{
  display:inline-flex;align-items:center;justify-content:center;
  width:26px;height:26px;border-radius:7px;
  background:rgba(255,255,255,0.05);
  border:1px solid rgba(255,255,255,0.08);
  color:var(--text-tertiary);text-decoration:none;
  font-size:0.6rem;font-weight:700;
  transition:all 0.2s var(--ease-spring);
}
.link-btn:hover{
  background:rgba(255,255,255,0.1);
  color:var(--text-primary);
  transform:translateY(-2px);
  box-shadow:0 4px 12px rgba(0,0,0,0.2);
}
.link-live{position:relative}
.link-live::after{
  content:"";position:absolute;top:-2px;right:-2px;
  width:6px;height:6px;border-radius:50%;
  background:#34d399;box-shadow:0 0 6px #34d399;
}

/* ========== EMPTY & LOADING ========== */
.empty{text-align:center;padding:2.5rem 1rem;color:var(--text-tertiary);font-size:0.8rem}
.empty-icon{font-size:2rem;margin-bottom:0.5rem;filter:grayscale(0.3)}

/* Skeleton */
.skeleton{
  background:linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.06) 50%,rgba(255,255,255,0.03) 75%);
  background-size:200% 100%;
  animation:shimmer 1.5s ease-in-out infinite;
  border-radius:8px;
}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

/* ========== FOOTER ========== */
.footer{
  text-align:center;padding:2rem 0 1.5rem;
  font-size:0.65rem;color:var(--text-tertiary);
}
.footer a{color:var(--accent-purple);text-decoration:none}
.footer a:hover{text-decoration:underline}

/* ========== TOAST ========== */
.toast-container{
  position:fixed;bottom:1.5rem;right:1.5rem;
  display:flex;flex-direction:column;gap:0.5rem;
  z-index:1000;pointer-events:none;
}
.toast{
  padding:0.6rem 1rem;
  background:rgba(15,15,30,0.9);
  backdrop-filter:blur(12px);
  border:1px solid rgba(255,255,255,0.08);
  border-radius:var(--radius-sm);
  font-size:0.72rem;font-weight:500;
  color:var(--text-secondary);
  box-shadow:0 8px 32px rgba(0,0,0,0.3);
  animation:toast-in 0.4s var(--ease-spring), toast-out 0.3s ease 2.5s forwards;
  pointer-events:auto;
}
@keyframes toast-in{from{opacity:0;transform:translateX(100%) scale(0.95)}}
@keyframes toast-out{to{opacity:0;transform:translateX(30%) scale(0.95)}}

/* ========== ANIMATIONS ========== */
@keyframes fade-in-up{
  from{opacity:0;transform:translateY(24px)}
  to{opacity:1;transform:translateY(0)}
}
.ani{animation:fade-in-up 0.6s var(--ease-out-expo) both}
.d1{animation-delay:0.05s}.d2{animation-delay:0.1s}.d3{animation-delay:0.15s}
.d4{animation-delay:0.2s}.d5{animation-delay:0.25s}.d6{animation-delay:0.3s}
.d7{animation-delay:0.35s}.d8{animation-delay:0.4s}

/* Animated counter */
@keyframes count-pop{
  0%{transform:scale(1)}
  50%{transform:scale(1.15)}
  100%{transform:scale(1)}
}
.count-changed{animation:count-pop 0.3s var(--ease-spring)}

/* ========== RESPONSIVE ========== */
@media(max-width:1024px){
  .stats-row{grid-template-columns:repeat(3,1fr)}
  .main-grid{grid-template-columns:1fr}
  .signals-grid{grid-template-columns:1fr}
}
@media(max-width:640px){
  .stats-row{grid-template-columns:repeat(2,1fr)}
  .container{padding:1rem}
  header{flex-direction:column;align-items:flex-start}
  .header-controls{width:100%;justify-content:space-between}
  .flow-steps{flex-direction:column;gap:0.35rem}
  .flow-arrow{transform:rotate(90deg)}
  .signal-stats{grid-template-columns:repeat(2,1fr)}
}
@media(max-width:400px){
  .stats-row{grid-template-columns:1fr}
}

/* Reduced motion */
@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{
    animation-duration:0.01ms !important;
    transition-duration:0.01ms !important;
  }
}

/* ========== REDDIT SIGNALS SECTION ========== */
.signals-section{margin-top:1.25rem}
.signals-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:1.25rem;
}

/* Signal flow visualization */
.flow-card{margin-bottom:1.25rem}
.flow-steps{
  display:flex;align-items:center;justify-content:center;
  gap:0;padding:1rem 0;flex-wrap:wrap;
}
.flow-step{
  display:flex;align-items:center;gap:0.5rem;
  padding:0.5rem 0.9rem;border-radius:var(--radius-sm);
  background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);
  font-size:0.72rem;font-weight:600;color:var(--text-secondary);
}
.flow-step.active{
  background:rgba(255,98,0,0.08);border-color:rgba(255,98,0,0.25);
  color:#ff6200;
}
.flow-step.ai{
  background:rgba(139,92,246,0.08);border-color:rgba(139,92,246,0.25);
  color:#a78bfa;
}
.flow-step.build{
  background:rgba(16,185,129,0.08);border-color:rgba(16,185,129,0.25);
  color:#34d399;
}
.flow-arrow{
  color:var(--text-tertiary);font-size:0.8rem;padding:0 0.25rem;
  opacity:0.4;
}
.flow-sub{font-size:0.6rem;color:var(--text-tertiary);text-align:center;margin-top:0.35rem}

/* Signal stats row */
.signal-stats{
  display:grid;grid-template-columns:repeat(4,1fr);gap:0.5rem;
  margin-bottom:1rem;
}
.signal-stat{
  text-align:center;padding:0.6rem 0.4rem;
  background:rgba(255,255,255,0.02);border-radius:var(--radius-sm);
  border:1px solid rgba(255,255,255,0.04);
}
.signal-stat-val{
  font-size:1.3rem;font-weight:800;letter-spacing:-0.02em;
  font-variant-numeric:tabular-nums;
}
.signal-stat-val.reddit{color:#ff6200}
.signal-stat-val.kw{color:#fbbf24}
.signal-stat-val.sub{color:#60a5fa}
.signal-stat-val.files{color:#34d399}
.signal-stat-lbl{font-size:0.6rem;color:var(--text-tertiary);margin-top:0.1rem}

/* Signal list items */
.signal-item{
  padding:0.6rem 0.65rem;
  border-bottom:1px solid rgba(255,255,255,0.04);
  border-radius:var(--radius-sm);
  transition:background 0.2s;
}
.signal-item:hover{background:rgba(255,98,0,0.03)}
.signal-item:last-child{border-bottom:none}

.signal-header{
  display:flex;align-items:center;gap:0.5rem;margin-bottom:0.3rem;
}
.signal-sub-badge{
  font-size:0.58rem;font-weight:700;
  padding:0.1rem 0.45rem;border-radius:4px;
  background:rgba(255,98,0,0.1);color:#ff6200;
  border:1px solid rgba(255,98,0,0.2);
  flex-shrink:0;white-space:nowrap;
}
.signal-title{
  font-size:0.76rem;font-weight:600;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  flex:1;min-width:0;
}
.signal-title a{color:inherit;text-decoration:none}
.signal-title a:hover{color:var(--accent-cyan);text-decoration:underline}

.signal-metrics{
  display:flex;align-items:center;gap:0.6rem;
  font-size:0.62rem;color:var(--text-tertiary);
  margin-bottom:0.25rem;
}
.signal-metric{display:flex;align-items:center;gap:0.2rem}
.signal-metric .up{color:#ff6200;font-weight:700}
.signal-metric .comments{color:#60a5fa;font-weight:600}

.signal-body{
  font-size:0.65rem;color:var(--text-tertiary);
  line-height:1.5;margin-bottom:0.3rem;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
}
.signal-keywords{
  display:flex;flex-wrap:wrap;gap:0.25rem;
}
.signal-kw{
  font-size:0.55rem;font-weight:600;
  padding:0.08rem 0.35rem;border-radius:3px;
  background:rgba(251,191,36,0.08);color:#fbbf24;
  border:1px solid rgba(251,191,36,0.15);
}

/* Source indicator on queue items */
.source-tag{
  font-size:0.52rem;font-weight:700;
  padding:0.06rem 0.35rem;border-radius:3px;
  text-transform:uppercase;letter-spacing:0.04em;
}
.source-reddit{background:rgba(255,98,0,0.1);color:#ff6200;border:1px solid rgba(255,98,0,0.2)}
.source-ai{background:rgba(139,92,246,0.1);color:#a78bfa;border:1px solid rgba(139,92,246,0.2)}

/* Subreddit bar chart */
.sub-chart{display:flex;flex-direction:column;gap:0.3rem;margin-top:0.5rem}
.sub-row{display:flex;align-items:center;gap:0.5rem}
.sub-name{font-size:0.62rem;color:var(--text-secondary);width:100px;text-align:right;flex-shrink:0;font-family:'JetBrains Mono',monospace}
.sub-bar-wrap{flex:1;height:14px;background:rgba(255,255,255,0.03);border-radius:3px;overflow:hidden}
.sub-bar{height:100%;border-radius:3px;background:linear-gradient(90deg,#ff6200,#ff8c40);transition:width 0.6s var(--ease-smooth)}
.sub-count{font-size:0.6rem;color:var(--text-tertiary);width:24px;font-variant-numeric:tabular-nums;font-family:'JetBrains Mono',monospace}

/* Log line - reddit */
.log-reddit{color:#ff6200;border-left-color:rgba(255,98,0,0.4)}

/* ========== SELECTION ========== */
::selection{background:rgba(139,92,246,0.3);color:#fff}
</style>
</head>
<body>

<!-- Background layers -->
<div class="bg-layer">
  <div class="aurora-orb"></div>
  <div class="aurora-orb"></div>
  <div class="aurora-orb"></div>
</div>
<div class="dot-grid"></div>
<div class="noise-overlay"></div>

<div class="app">
<div class="container">

  <!-- HEADER -->
  <header class="ani">
    <div class="logo-group">
      <div class="logo-icon">&#x1f9de;</div>
      <div class="logo-text">
        <h1>MVP Factory</h1>
        <span>Autonomous Build Engine</span>
      </div>
    </div>
    <div class="header-controls">
      <div class="status-pill">
        <span class="status-dot green" id="sDot"></span>
        <span id="sText">Connecting...</span>
      </div>
      <span class="sys-badge" id="sysMem" title="Daemon memory"></span>
      <span class="sys-badge" id="sysLoad" title="System load"></span>
      <span class="meta-time" id="lastUpdate"></span>
      <button class="btn-refresh" onclick="doRefresh()" id="refreshBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
        Refresh
      </button>
    </div>
  </header>

  <!-- STATS ROW -->
  <div class="stats-row">
    <div class="card stat-card ani d1">
      <div class="stat-icon">&#9881;&#65039;</div>
      <div class="stat-value" id="vBuilds">--</div>
      <div class="stat-label">Builds Today</div>
      <div class="stat-sub" id="subBuilds"></div>
    </div>
    <div class="card stat-card ani d2">
      <div class="stat-icon">&#128203;</div>
      <div class="stat-value" id="vQueue">--</div>
      <div class="stat-label">In Queue</div>
      <div class="stat-sub">ideas waiting</div>
    </div>
    <div class="card stat-card ani d3">
      <div class="stat-icon">&#127942;</div>
      <div class="stat-value" id="vTotal">--</div>
      <div class="stat-label">Total Shipped</div>
      <div class="stat-sub" id="subTotal">all time</div>
    </div>
    <div class="card stat-card ani d4">
      <div class="stat-icon">&#9889;</div>
      <div class="stat-value" id="vScore">--</div>
      <div class="stat-label">Func Score</div>
      <div class="stat-sub">quality points</div>
    </div>
    <div class="card stat-card ani d5">
      <div class="stat-icon">&#128300;</div>
      <div class="stat-value" id="vResearch">--</div>
      <div class="stat-label">Researches</div>
      <div class="stat-sub">today</div>
    </div>
    <div class="card stat-card ani d5">
      <div class="stat-icon">&#128225;</div>
      <div class="stat-value" id="vSignals">--</div>
      <div class="stat-label">Reddit Signals</div>
      <div class="stat-sub" id="subSignals">latest scrape</div>
    </div>
  </div>

  <!-- CURRENT BUILD -->
  <div class="current-build-card ani d5" id="currentCard">
    <div class="current-build-inner">
      <div class="card-header">
        <div class="card-title">
          <span>&#128296;</span> Currently Building
        </div>
        <span class="card-count" id="buildPhase">idle</span>
      </div>
      <div id="currentContent">
        <div class="build-idle">
          <div class="idle-icon">&#128564;</div>
          <div class="idle-text">Idle &mdash; waiting for next build cycle</div>
          <div class="idle-sub">The daemon checks the queue every 30 minutes</div>
        </div>
      </div>
    </div>
  </div>

  <!-- MAIN GRID -->
  <div class="main-grid">

    <!-- LEFT: LOGS -->
    <div class="card terminal ani d6" style="padding:0">
      <div class="terminal-header">
        <div class="terminal-dots"><span></span><span></span><span></span></div>
        <div class="terminal-title">daemon.log &mdash; live feed</div>
        <span class="terminal-badge" id="logBadge">live</span>
      </div>
      <div class="log-viewer" id="logViewer"></div>
    </div>

    <!-- RIGHT: QUEUE + BUILT -->
    <div class="sidebar-stack">
      <div class="card ani d7">
        <div class="card-header">
          <div class="card-title"><span>&#128203;</span> Pipeline</div>
          <span class="card-count" id="pipeCount">0</span>
        </div>
        <div class="tabs" id="pipeTabs">
          <button class="tab-btn active" data-tab="queue" onclick="switchTab('queue')">Queue</button>
          <button class="tab-btn" data-tab="built" onclick="switchTab('built')">Shipped</button>
        </div>
        <div class="list-scroll" id="queueList"><div class="empty"><div class="empty-icon">&#128203;</div>Loading queue...</div></div>
        <div class="list-scroll" id="builtList" style="display:none"><div class="empty"><div class="empty-icon">&#127942;</div>Loading builds...</div></div>
      </div>
    </div>

  </div>

  <!-- REDDIT SIGNALS SECTION -->
  <div class="signals-section ani d7">

    <!-- Flow visualization -->
    <div class="card flow-card">
      <div class="card-header">
        <div class="card-title"><span>&#128256;</span> Idea Pipeline Flow</div>
        <span class="card-count" id="flowSource">--</span>
      </div>
      <div class="flow-steps">
        <div class="flow-step active">&#128225; Reddit Scrape</div>
        <span class="flow-arrow">&#10132;</span>
        <div class="flow-step active">&#128269; Filter &amp; Rank</div>
        <span class="flow-arrow">&#10132;</span>
        <div class="flow-step ai">&#129302; Kimi K2.5 Refine</div>
        <span class="flow-arrow">&#10132;</span>
        <div class="flow-step build">&#128296; Build MVP</div>
      </div>
      <div class="flow-sub">13 subreddits &#8594; keyword + engagement filter &#8594; top 30 signals &#8594; 5 buildable ideas &#8594; code, test, deploy</div>
    </div>

    <!-- Signals grid: left = signal list, right = subreddit breakdown -->
    <div class="signals-grid">

      <!-- Left: Latest Reddit Signals -->
      <div class="card">
        <div class="card-header">
          <div class="card-title"><span>&#128225;</span> Latest Reddit Signals</div>
          <span class="card-count" id="sigCount">0</span>
        </div>
        <div class="signal-stats" id="sigStats">
          <div class="signal-stat"><div class="signal-stat-val reddit" id="sigTotal">--</div><div class="signal-stat-lbl">Signals</div></div>
          <div class="signal-stat"><div class="signal-stat-val kw" id="sigKw">--</div><div class="signal-stat-lbl">With Keywords</div></div>
          <div class="signal-stat"><div class="signal-stat-val sub" id="sigSubs">--</div><div class="signal-stat-lbl">Subreddits</div></div>
          <div class="signal-stat"><div class="signal-stat-val files" id="sigFiles">--</div><div class="signal-stat-lbl">Scrape Sessions</div></div>
        </div>
        <div class="list-scroll" id="signalList" style="max-height:420px">
          <div class="empty"><div class="empty-icon">&#128225;</div>Loading signals...</div>
        </div>
      </div>

      <!-- Right: Subreddit breakdown + how it works -->
      <div style="display:flex;flex-direction:column;gap:1.25rem">
        <div class="card">
          <div class="card-header">
            <div class="card-title"><span>&#128202;</span> Signals by Subreddit</div>
          </div>
          <div id="subChart" class="sub-chart">
            <div class="empty"><div class="empty-icon">&#128202;</div>Loading...</div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <div class="card-title"><span>&#128161;</span> How It Works</div>
          </div>
          <div style="font-size:0.7rem;color:var(--text-secondary);line-height:1.7">
            <div style="margin-bottom:0.5rem"><strong style="color:var(--text-primary)">No API key needed.</strong> Reddit exposes public JSON endpoints:</div>
            <code style="font-size:0.62rem;color:#ff6200;background:rgba(255,98,0,0.06);padding:0.2rem 0.5rem;border-radius:4px;display:block;margin-bottom:0.6rem;word-break:break-all">reddit.com/r/{sub}/top.json?t=week&amp;limit=25</code>
            <div style="display:flex;flex-direction:column;gap:0.35rem">
              <div>&#9312; Scrape 13 subreddits (7s delay between each)</div>
              <div>&#9313; Filter posts by <span style="color:#fbbf24">signal keywords</span> ("i wish", "need a tool"...) + <span style="color:#ff6200">upvote score</span> (&ge;10)</div>
              <div>&#9314; Posts with 50+ upvotes auto-included (high engagement)</div>
              <div>&#9315; Rank by: <code style="font-size:0.6rem;color:var(--text-tertiary)">score + 2&times;comments + 5&times;keywords</code></div>
              <div>&#9316; Top 30 signals fed to <span style="color:#a78bfa">Kimi K2.5</span> to generate 5 MVP ideas</div>
            </div>
            <div style="margin-top:0.6rem;padding-top:0.5rem;border-top:1px solid rgba(255,255,255,0.05);color:var(--text-tertiary);font-size:0.62rem">
              Optional: Set REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET for OAuth (60 req/min vs 10 req/min public)
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>

  <div class="footer ani d8">
    MVP Factory Command Center &bull; Auto-refreshes every 12s &bull; Powered by <a href="#">OpenClaw</a>
  </div>

</div>
</div>

<!-- Toast container -->
<div class="toast-container" id="toasts"></div>

<script>
/* ========== UTILITIES ========== */
function relTime(iso){
  if(!iso)return"";
  const d=Date.now()-new Date(iso).getTime();
  const m=Math.floor(d/60000);
  if(m<1)return"just now";
  if(m<60)return m+"m ago";
  const h=Math.floor(m/60);
  if(h<24)return h+"h ago";
  return Math.floor(h/24)+"d ago";
}
function esc(s){return String(s).replace(/</g,"&lt;").replace(/>/g,"&gt;")}
function badgeCls(t){return({web:"badge-web",saas:"badge-saas",mobile:"badge-mobile",extension:"badge-extension",api:"badge-api"})[t]||"badge-web"}
function badgeLbl(t){return({web:"Web",saas:"SaaS",mobile:"Mobile",extension:"Ext",api:"API"})[t]||t||"Web"}
function scoreCls(pct){return pct>=75?"score-high":pct>=50?"score-mid":"score-low"}
function logCls(l){
  if(l.includes("[ERROR]"))return"log-error";
  if(l.includes("[WARN]"))return"log-warn";
  if(l.includes("COMPLETE")||l.includes("SUCCESS")||l.includes("Deployed"))return"log-success";
  if(l.includes("Reddit")||l.includes("reddit")||l.includes("r/")||l.includes("Scraping Reddit")||l.includes("signals"))return"log-reddit";
  if(l.includes("Building:")||l.includes("BUILD CYCLE")||l.includes("RESEARCH CYCLE"))return"log-build";
  if(l.includes("deploy")||l.includes("Vercel")||l.includes("GitHub"))return"log-deploy";
  return"log-info";
}

/* ========== SPOTLIGHT EFFECT ON CARDS ========== */
document.addEventListener("mousemove",e=>{
  document.querySelectorAll(".card").forEach(c=>{
    const r=c.getBoundingClientRect();
    c.style.setProperty("--mouse-x",(e.clientX-r.left)+"px");
    c.style.setProperty("--mouse-y",(e.clientY-r.top)+"px");
  });
});

/* ========== ANIMATED COUNTER ========== */
const prevVals={};
function setVal(id,val){
  const el=document.getElementById(id);
  if(!el)return;
  const s=String(val);
  if(prevVals[id]!==s){
    el.textContent=s;
    el.classList.remove("count-changed");
    void el.offsetWidth;
    el.classList.add("count-changed");
    prevVals[id]=s;
  }
}

/* ========== TABS ========== */
let activeTab="queue";
function switchTab(tab){
  activeTab=tab;
  document.querySelectorAll(".tab-btn").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
  document.getElementById("queueList").style.display=tab==="queue"?"block":"none";
  document.getElementById("builtList").style.display=tab==="built"?"block":"none";
}

/* ========== TOAST ========== */
function toast(msg){
  const d=document.createElement("div");
  d.className="toast";
  d.textContent=msg;
  document.getElementById("toasts").appendChild(d);
  setTimeout(()=>d.remove(),3200);
}

/* ========== FETCH ========== */
async function api(path){
  try{const r=await fetch(path);return await r.json()}
  catch{return null}
}

/* ========== MAIN REFRESH ========== */
let firstLoad=true;
async function refreshAll(){
  const [status,stats,queue,built,logs,current,sys,signals]=await Promise.all([
    api("/api/status"),api("/api/stats"),api("/api/queue"),
    api("/api/built"),api("/api/logs"),api("/api/current"),api("/api/system"),
    api("/api/signals"),
  ]);

  // --- Status ---
  if(status){
    const dot=document.getElementById("sDot");
    const txt=document.getElementById("sText");
    const cls=status.status==="active"?"green":status.status==="activating"?"amber":"red";
    dot.className="status-dot "+cls;
    let label=status.status==="active"?"Running":status.status;
    txt.textContent=label;
    document.getElementById("sysMem").textContent=status.memory||"";
    document.getElementById("sysMem").style.display=status.memory?"inline":"none";
  }

  // --- System ---
  if(sys){
    const loadEl=document.getElementById("sysLoad");
    if(sys.load){loadEl.textContent="Load: "+sys.load;loadEl.style.display="inline"}
    else loadEl.style.display="none";
  }

  // --- Stats ---
  if(stats){
    setVal("vBuilds",stats.buildsToday||0);
    setVal("vTotal",stats.totalBuilt||0);
    setVal("vScore",stats.functionalityScore||0);
    setVal("vResearch",stats.researchesToday||0);
    document.getElementById("subBuilds").textContent=stats.lastBuildAt?"Last: "+relTime(stats.lastBuildAt):"";
  }

  // --- Queue ---
  if(queue){
    setVal("vQueue",queue.length);
    document.getElementById("pipeCount").textContent=queue.length+" queued";
    const el=document.getElementById("queueList");
    if(!queue.length){
      el.innerHTML='<div class="empty"><div class="empty-icon">&#128171;</div>Queue is empty &mdash; awaiting research</div>';
    } else {
      el.innerHTML=queue.slice(0,40).map((idea,i)=>{
        const pct=Math.min(100,((idea.viabilityScore||0)/10)*100);
        const isReddit=idea.source==="reddit";
        const srcTag=isReddit?'<span class="source-tag source-reddit">Reddit</span>':'<span class="source-tag source-ai">AI</span>';
        const sigCount=idea.redditSignals?idea.redditSignals.length:0;
        return '<div class="list-item" style="animation:fade-in-up 0.4s var(--ease-out-expo) '+(i*0.03)+'s both">'+
          '<span class="list-rank">'+(i+1)+'</span>'+
          srcTag+
          '<span class="badge '+badgeCls(idea.type)+'">'+badgeLbl(idea.type)+'</span>'+
          '<div class="list-info">'+
            '<div class="list-title" title="'+esc(idea.title||"")+'">'+esc(idea.title||"Untitled")+'</div>'+
            '<div class="list-meta">'+
              '<span>'+(idea.features?idea.features.length:0)+' features</span>'+
              '<span>~'+(idea.estimatedHours||"?")+'h</span>'+
              (sigCount?'<span style="color:#ff6200">'+sigCount+' signal'+(sigCount>1?'s':'')+'</span>':'')+
            '</div>'+
          '</div>'+
          '<div class="score-wrap">'+
            '<span class="score-num">'+(idea.viabilityScore||0)+'</span>'+
            '<div class="score-bar"><div class="score-fill '+scoreCls(pct)+'" style="width:'+pct+'%"></div></div>'+
          '</div>'+
        '</div>';
      }).join("");
    }
  }

  // --- Built ---
  if(built){
    const el=document.getElementById("builtList");
    if(!built.length){
      el.innerHTML='<div class="empty"><div class="empty-icon">&#128640;</div>No builds shipped yet</div>';
    } else {
      el.innerHTML=built.slice(0,25).map((b,i)=>{
        let links='<div class="link-row">';
        if(b.githubUrl)links+='<a href="'+esc(b.githubUrl)+'" target="_blank" class="link-btn" title="GitHub">GH</a>';
        if(b.liveUrl)links+='<a href="'+esc(b.liveUrl)+'" target="_blank" class="link-btn link-live" title="Live">&#9889;</a>';
        links+='</div>';
        return '<div class="list-item" style="animation:fade-in-up 0.4s var(--ease-out-expo) '+(i*0.03)+'s both">'+
          '<span class="list-rank">'+(i+1)+'</span>'+
          '<span class="badge '+badgeCls(b.type)+'">'+badgeLbl(b.type)+'</span>'+
          '<div class="list-info">'+
            '<div class="list-title" title="'+esc(b.title||"")+'">'+esc(b.title||"Untitled")+'</div>'+
            '<div class="list-meta">'+
              '<span>Score: '+(b.functionalityScore||"?")+'/8</span>'+
              '<span>'+relTime(b.builtAt)+'</span>'+
            '</div>'+
          '</div>'+
          links+
        '</div>';
      }).join("");
    }
  }

  // --- Current Build ---
  const card=document.getElementById("currentCard");
  const content=document.getElementById("currentContent");
  const phase=document.getElementById("buildPhase");
  if(current){
    card.classList.add("active");
    phase.textContent="building";
    phase.style.color="#a78bfa";
    content.innerHTML=
      '<div class="build-active">'+
        '<div class="build-spinner"></div>'+
        '<div class="build-info">'+
          '<h3>'+esc(current.title)+'</h3>'+
          '<p>Started '+relTime(current.startedAt)+' &bull; Generating code, testing, deploying...</p>'+
        '</div>'+
      '</div>'+
      '<div class="build-progress"><div class="build-progress-bar"></div></div>';
  } else {
    card.classList.remove("active");
    phase.textContent="idle";
    phase.style.color="";
    content.innerHTML=
      '<div class="build-idle">'+
        '<div class="idle-icon">&#128564;</div>'+
        '<div class="idle-text">Idle &mdash; waiting for next build cycle</div>'+
        '<div class="idle-sub">The daemon checks the queue every 30 minutes</div>'+
      '</div>';
  }

  // --- Logs ---
  if(logs&&logs.length){
    const viewer=document.getElementById("logViewer");
    const wasAtBottom=viewer.scrollHeight-viewer.scrollTop-viewer.clientHeight<60;
    viewer.innerHTML=logs.map(l=>'<div class="log-line '+logCls(l)+'">'+esc(l)+'</div>').join("");
    if(wasAtBottom||firstLoad)viewer.scrollTop=viewer.scrollHeight;
  }

  // --- Signals ---
  if(signals){
    const sigs=signals.signals||[];
    setVal("vSignals",sigs.length);
    document.getElementById("subSignals").textContent=signals.file?signals.file.replace("reddit-","").replace(".json","").substring(0,16):"no data";

    // Stats
    const kwCount=sigs.filter(s=>s.keywords&&s.keywords.length>0).length;
    const uniqueSubs=[...new Set(sigs.map(s=>s.subreddit))];
    setVal("sigTotal",sigs.length);
    setVal("sigKw",kwCount);
    setVal("sigSubs",uniqueSubs.length);
    setVal("sigFiles",signals.totalFiles||0);
    document.getElementById("sigCount").textContent=sigs.length+" signals";
    document.getElementById("flowSource").textContent=sigs.length>0?"Reddit-powered":"AI-only";

    // Signal list
    const sigEl=document.getElementById("signalList");
    if(!sigs.length){
      sigEl.innerHTML='<div class="empty"><div class="empty-icon">&#128225;</div>No Reddit signals yet<br><span style="font-size:0.7rem;opacity:0.6">Signals appear after the first research cycle</span></div>';
    } else {
      sigEl.innerHTML=sigs.slice(0,20).map((s,i)=>{
        const engagement=s.score+2*(s.numComments||0)+5*(s.keywords?s.keywords.length:0);
        return '<div class="signal-item" style="animation:fade-in-up 0.4s var(--ease-out-expo) '+(i*0.02)+'s both">'+
          '<div class="signal-header">'+
            '<span class="signal-sub-badge">r/'+esc(s.subreddit)+'</span>'+
            '<div class="signal-title"><a href="'+esc(s.url)+'" target="_blank" title="'+esc(s.postTitle)+'">'+esc(s.postTitle)+'</a></div>'+
          '</div>'+
          '<div class="signal-metrics">'+
            '<span class="signal-metric"><span class="up">&#9650; '+s.score+'</span></span>'+
            '<span class="signal-metric"><span class="comments">&#128172; '+(s.numComments||0)+'</span></span>'+
            '<span class="signal-metric">&#9889; '+engagement+'</span>'+
          '</div>'+
          (s.postBody?'<div class="signal-body">'+esc(s.postBody.substring(0,200))+'</div>':'')+
          (s.keywords&&s.keywords.length?'<div class="signal-keywords">'+s.keywords.map(k=>'<span class="signal-kw">'+esc(k)+'</span>').join("")+'</div>':'')+
        '</div>';
      }).join("");
    }

    // Subreddit chart
    const chartEl=document.getElementById("subChart");
    if(sigs.length){
      const subCounts={};
      sigs.forEach(s=>{subCounts[s.subreddit]=(subCounts[s.subreddit]||0)+1});
      const sorted=Object.entries(subCounts).sort((a,b)=>b[1]-a[1]);
      const max=sorted[0]?sorted[0][1]:1;
      chartEl.innerHTML=sorted.map(([name,count])=>{
        const pct=Math.round((count/max)*100);
        return '<div class="sub-row">'+
          '<span class="sub-name">r/'+esc(name)+'</span>'+
          '<div class="sub-bar-wrap"><div class="sub-bar" style="width:'+pct+'%"></div></div>'+
          '<span class="sub-count">'+count+'</span>'+
        '</div>';
      }).join("");
    } else {
      chartEl.innerHTML='<div class="empty" style="padding:1rem"><div class="empty-icon">&#128202;</div>No data yet</div>';
    }
  }

  // --- Time ---
  document.getElementById("lastUpdate").textContent=new Date().toLocaleTimeString();

  if(firstLoad){firstLoad=false;toast("Dashboard connected")}
}

function doRefresh(){
  const btn=document.getElementById("refreshBtn");
  btn.classList.add("spinning");
  refreshAll().then(()=>{
    setTimeout(()=>btn.classList.remove("spinning"),600);
    toast("Data refreshed");
  });
}

// Initial load + auto-refresh
refreshAll();
setInterval(refreshAll,12000);
</script>
</body>
</html>`;

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
  res.end(HTML);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("MVP Factory Dashboard running on http://0.0.0.0:" + PORT);
});
