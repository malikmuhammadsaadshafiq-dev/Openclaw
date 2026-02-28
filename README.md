<div align="center">

# MVP Factory v11

### Multi-Agent AI System That Researches, Validates, Builds & Ships Real Products

[![MVP Factory](https://img.shields.io/badge/MVP_Factory-v11_Multi--Agent-blueviolet?style=for-the-badge)](mvp-factory/)
[![Live Dashboard](https://img.shields.io/badge/Live_Dashboard-Online-34d399?style=for-the-badge)](http://45.58.40.219:3000/)
[![Agents](https://img.shields.io/badge/AI_Agents-5-ff6f00?style=for-the-badge)](#-agent-architecture)
[![Kimi K2.5](https://img.shields.io/badge/LLM-Kimi_K2.5-76B900?style=for-the-badge&logo=nvidia&logoColor=white)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](#)

**5 specialized AI agents work together: Research real pain points, validate ruthlessly, design psychology-driven UIs, build working backends, and auto-deploy. No placeholders. Only real data.**

[Architecture](#-agent-architecture) | [Pipeline](#-pipeline-flow) | [Quick Start](#-quick-start) | [Dashboard](#-live-dashboard)

---

</div>

## Live Stats

<!-- STATS-START -->
| Metric | Value |
|--------|-------|
| **Queue Size** | 4 ideas waiting |
| **Total Built** | 0 products |
| **Daily Builds** | 0 / 10 |
| **Uptime** | 5.5 hours |
| **Last Updated** | 2026-02-28 20:20 UTC |
<!-- STATS-END -->

---

## Agent Architecture

<div align="center">

```svg
<svg viewBox="0 0 800 300" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="800" height="300" fill="#0d1117"/>

  <!-- Title -->
  <text x="400" y="35" font-family="Arial, sans-serif" font-size="20" fill="#58a6ff" text-anchor="middle" font-weight="bold">5 SPECIALIZED AI AGENTS</text>

  <!-- Research Agent -->
  <rect x="30" y="60" width="130" height="180" rx="10" fill="#238636" opacity="0.2" stroke="#238636" stroke-width="2"/>
  <text x="95" y="90" font-family="Arial, sans-serif" font-size="14" fill="#238636" text-anchor="middle" font-weight="bold">Research</text>
  <text x="95" y="110" font-family="Arial, sans-serif" font-size="14" fill="#238636" text-anchor="middle" font-weight="bold">Agent</text>
  <text x="95" y="140" font-family="Arial, sans-serif" font-size="11" fill="#8b949e" text-anchor="middle">5 Platforms</text>
  <text x="95" y="160" font-family="Arial, sans-serif" font-size="11" fill="#8b949e" text-anchor="middle">Reddit, HN</text>
  <text x="95" y="180" font-family="Arial, sans-serif" font-size="11" fill="#8b949e" text-anchor="middle">Dev.to, GitHub</text>
  <text x="95" y="200" font-family="Arial, sans-serif" font-size="11" fill="#8b949e" text-anchor="middle">200+ posts/cycle</text>
  <text x="95" y="225" font-family="Arial, sans-serif" font-size="10" fill="#58a6ff" text-anchor="middle">REAL DATA ONLY</text>

  <!-- Arrow 1 -->
  <path d="M165 150 L185 150" stroke="#8b949e" stroke-width="2" fill="none" marker-end="url(#arrow)"/>

  <!-- Validation Agent -->
  <rect x="190" y="60" width="130" height="180" rx="10" fill="#a371f7" opacity="0.2" stroke="#a371f7" stroke-width="2"/>
  <text x="255" y="90" font-family="Arial, sans-serif" font-size="14" fill="#a371f7" text-anchor="middle" font-weight="bold">Validation</text>
  <text x="255" y="110" font-family="Arial, sans-serif" font-size="14" fill="#a371f7" text-anchor="middle" font-weight="bold">Agent</text>
  <text x="255" y="140" font-family="Arial, sans-serif" font-size="11" fill="#8b949e" text-anchor="middle">5-Dimension Score</text>
  <text x="255" y="160" font-family="Arial, sans-serif" font-size="11" fill="#8b949e" text-anchor="middle">Market Demand</text>
  <text x="255" y="180" font-family="Arial, sans-serif" font-size="11" fill="#8b949e" text-anchor="middle">Competition Gap</text>
  <text x="255" y="200" font-family="Arial, sans-serif" font-size="11" fill="#8b949e" text-anchor="middle">6.5/10 threshold</text>
  <text x="255" y="225" font-family="Arial, sans-serif" font-size="10" fill="#f85149" text-anchor="middle">87% REJECTION</text>

  <!-- Arrow 2 -->
  <path d="M325 150 L345 150" stroke="#8b949e" stroke-width="2" fill="none" marker-end="url(#arrow)"/>

  <!-- Frontend Agent -->
  <rect x="350" y="60" width="130" height="180" rx="10" fill="#58a6ff" opacity="0.2" stroke="#58a6ff" stroke-width="2"/>
  <text x="415" y="90" font-family="Arial, sans-serif" font-size="14" fill="#58a6ff" text-anchor="middle" font-weight="bold">Frontend</text>
  <text x="415" y="110" font-family="Arial, sans-serif" font-size="14" fill="#58a6ff" text-anchor="middle" font-weight="bold">Agent</text>
  <text x="415" y="140" font-family="Arial, sans-serif" font-size="11" fill="#8b949e" text-anchor="middle">Psychology UX</text>
  <text x="415" y="160" font-family="Arial, sans-serif" font-size="11" fill="#8b949e" text-anchor="middle">Next.js 14</text>
  <text x="415" y="180" font-family="Arial, sans-serif" font-size="11" fill="#8b949e" text-anchor="middle">TailwindCSS</text>
  <text x="415" y="200" font-family="Arial, sans-serif" font-size="11" fill="#8b949e" text-anchor="middle">Custom design</text>
  <text x="415" y="225" font-family="Arial, sans-serif" font-size="10" fill="#58a6ff" text-anchor="middle">AUDIENCE-FIT</text>

  <!-- Arrow 3 -->
  <path d="M485 150 L505 150" stroke="#8b949e" stroke-width="2" fill="none" marker-end="url(#arrow)"/>

  <!-- Backend Agent -->
  <rect x="510" y="60" width="130" height="180" rx="10" fill="#f0883e" opacity="0.2" stroke="#f0883e" stroke-width="2"/>
  <text x="575" y="90" font-family="Arial, sans-serif" font-size="14" fill="#f0883e" text-anchor="middle" font-weight="bold">Backend</text>
  <text x="575" y="110" font-family="Arial, sans-serif" font-size="14" fill="#f0883e" text-anchor="middle" font-weight="bold">Agent</text>
  <text x="575" y="140" font-family="Arial, sans-serif" font-size="11" fill="#8b949e" text-anchor="middle">Real API Routes</text>
  <text x="575" y="160" font-family="Arial, sans-serif" font-size="11" fill="#8b949e" text-anchor="middle">AI Integration</text>
  <text x="575" y="180" font-family="Arial, sans-serif" font-size="11" fill="#8b949e" text-anchor="middle">Data Models</text>
  <text x="575" y="200" font-family="Arial, sans-serif" font-size="11" fill="#8b949e" text-anchor="middle">Error Handling</text>
  <text x="575" y="225" font-family="Arial, sans-serif" font-size="10" fill="#f0883e" text-anchor="middle">NO STUBS</text>

  <!-- Arrow 4 -->
  <path d="M645 150 L665 150" stroke="#8b949e" stroke-width="2" fill="none" marker-end="url(#arrow)"/>

  <!-- PM Agent -->
  <rect x="670" y="60" width="100" height="180" rx="10" fill="#f85149" opacity="0.2" stroke="#f85149" stroke-width="2"/>
  <text x="720" y="90" font-family="Arial, sans-serif" font-size="14" fill="#f85149" text-anchor="middle" font-weight="bold">PM</text>
  <text x="720" y="110" font-family="Arial, sans-serif" font-size="14" fill="#f85149" text-anchor="middle" font-weight="bold">Agent</text>
  <text x="720" y="140" font-family="Arial, sans-serif" font-size="11" fill="#8b949e" text-anchor="middle">Orchestration</text>
  <text x="720" y="160" font-family="Arial, sans-serif" font-size="11" fill="#8b949e" text-anchor="middle">Quality Gate</text>
  <text x="720" y="180" font-family="Arial, sans-serif" font-size="11" fill="#8b949e" text-anchor="middle">20-point check</text>
  <text x="720" y="200" font-family="Arial, sans-serif" font-size="11" fill="#8b949e" text-anchor="middle">Auto-deploy</text>
  <text x="720" y="225" font-family="Arial, sans-serif" font-size="10" fill="#f85149" text-anchor="middle">SHIP IT</text>

  <!-- Arrow marker definition -->
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="#8b949e"/>
    </marker>
  </defs>

  <!-- Bottom bar -->
  <rect x="30" y="260" width="740" height="25" rx="5" fill="#21262d"/>
  <text x="400" y="278" font-family="Arial, sans-serif" font-size="12" fill="#8b949e" text-anchor="middle">Powered by Kimi K2.5 (NVIDIA API) | TypeScript | Next.js 14 | Auto-deploy to Vercel</text>
</svg>
```

</div>

---

## Pipeline Flow

<div align="center">

```svg
<svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="800" height="400" fill="#0d1117"/>

  <!-- Title -->
  <text x="400" y="30" font-family="Arial, sans-serif" font-size="18" fill="#58a6ff" text-anchor="middle" font-weight="bold">SEQUENTIAL PIPELINE FLOW</text>

  <!-- Research Phase Box -->
  <rect x="20" y="50" width="180" height="120" rx="8" fill="#238636" opacity="0.15" stroke="#238636" stroke-width="2"/>
  <text x="110" y="75" font-family="Arial, sans-serif" font-size="13" fill="#238636" text-anchor="middle" font-weight="bold">STEP 1: Research</text>
  <text x="110" y="95" font-family="Arial, sans-serif" font-size="10" fill="#8b949e" text-anchor="middle">Reddit (26 subs)</text>
  <text x="110" y="110" font-family="Arial, sans-serif" font-size="10" fill="#8b949e" text-anchor="middle">HackerNews (2 APIs)</text>
  <text x="110" y="125" font-family="Arial, sans-serif" font-size="10" fill="#8b949e" text-anchor="middle">Dev.to + GitHub</text>
  <text x="110" y="145" font-family="Arial, sans-serif" font-size="11" fill="#238636" text-anchor="middle">8 min timeout</text>
  <text x="110" y="160" font-family="Arial, sans-serif" font-size="9" fill="#f0883e" text-anchor="middle">300+ posts collected</text>

  <!-- Arrow -->
  <path d="M205 110 L235 110" stroke="#58a6ff" stroke-width="3" fill="none" marker-end="url(#bluearrow)"/>

  <!-- Validation Phase Box -->
  <rect x="240" y="50" width="160" height="120" rx="8" fill="#a371f7" opacity="0.15" stroke="#a371f7" stroke-width="2"/>
  <text x="320" y="75" font-family="Arial, sans-serif" font-size="13" fill="#a371f7" text-anchor="middle" font-weight="bold">STEP 2: Validate</text>
  <text x="320" y="95" font-family="Arial, sans-serif" font-size="10" fill="#8b949e" text-anchor="middle">5-Dimension Score</text>
  <text x="320" y="110" font-family="Arial, sans-serif" font-size="10" fill="#8b949e" text-anchor="middle">6.5/10 minimum</text>
  <text x="320" y="125" font-family="Arial, sans-serif" font-size="10" fill="#8b949e" text-anchor="middle">Dedup check</text>
  <text x="320" y="145" font-family="Arial, sans-serif" font-size="11" fill="#a371f7" text-anchor="middle">LLM Analysis</text>
  <text x="320" y="160" font-family="Arial, sans-serif" font-size="9" fill="#f85149" text-anchor="middle">87% rejected</text>

  <!-- Arrow -->
  <path d="M405 110 L435 110" stroke="#58a6ff" stroke-width="3" fill="none" marker-end="url(#bluearrow)"/>

  <!-- Queue Box -->
  <rect x="440" y="50" width="120" height="120" rx="8" fill="#21262d" stroke="#30363d" stroke-width="2"/>
  <text x="500" y="75" font-family="Arial, sans-serif" font-size="13" fill="#8b949e" text-anchor="middle" font-weight="bold">QUEUE</text>
  <text x="500" y="100" font-family="Arial, sans-serif" font-size="24" fill="#58a6ff" text-anchor="middle" font-weight="bold">4</text>
  <text x="500" y="120" font-family="Arial, sans-serif" font-size="10" fill="#8b949e" text-anchor="middle">validated ideas</text>
  <text x="500" y="145" font-family="Arial, sans-serif" font-size="9" fill="#f0883e" text-anchor="middle">10 min pause</text>
  <text x="500" y="160" font-family="Arial, sans-serif" font-size="9" fill="#8b949e" text-anchor="middle">before build</text>

  <!-- Arrow down -->
  <path d="M500 175 L500 195" stroke="#58a6ff" stroke-width="3" fill="none" marker-end="url(#bluearrow)"/>

  <!-- Build Phase Box -->
  <rect x="350" y="200" width="300" height="90" rx="8" fill="#58a6ff" opacity="0.15" stroke="#58a6ff" stroke-width="2"/>
  <text x="500" y="225" font-family="Arial, sans-serif" font-size="13" fill="#58a6ff" text-anchor="middle" font-weight="bold">STEP 3: Build (Frontend + Backend in parallel)</text>
  <text x="500" y="250" font-family="Arial, sans-serif" font-size="10" fill="#8b949e" text-anchor="middle">FrontendAgent: Psychology UX, Next.js 14, TailwindCSS</text>
  <text x="500" y="270" font-family="Arial, sans-serif" font-size="10" fill="#8b949e" text-anchor="middle">BackendAgent: Real APIs, AI integration, data models</text>
  <text x="500" y="285" font-family="Arial, sans-serif" font-size="9" fill="#f0883e" text-anchor="middle">25 min timeout | Quality gate: 20 points</text>

  <!-- Arrow -->
  <path d="M655 245 L685 245" stroke="#58a6ff" stroke-width="3" fill="none" marker-end="url(#bluearrow)"/>

  <!-- Deploy Phase Box -->
  <rect x="690" y="200" width="90" height="90" rx="8" fill="#238636" opacity="0.15" stroke="#238636" stroke-width="2"/>
  <text x="735" y="225" font-family="Arial, sans-serif" font-size="13" fill="#238636" text-anchor="middle" font-weight="bold">STEP 4</text>
  <text x="735" y="245" font-family="Arial, sans-serif" font-size="11" fill="#238636" text-anchor="middle">Deploy</text>
  <text x="735" y="265" font-family="Arial, sans-serif" font-size="9" fill="#8b949e" text-anchor="middle">GitHub</text>
  <text x="735" y="280" font-family="Arial, sans-serif" font-size="9" fill="#8b949e" text-anchor="middle">Vercel</text>

  <!-- Timeout fallback -->
  <rect x="20" y="200" width="200" height="80" rx="8" fill="#f85149" opacity="0.1" stroke="#f85149" stroke-width="1" stroke-dasharray="5,5"/>
  <text x="120" y="225" font-family="Arial, sans-serif" font-size="11" fill="#f85149" text-anchor="middle" font-weight="bold">TIMEOUT FALLBACK</text>
  <text x="120" y="245" font-family="Arial, sans-serif" font-size="9" fill="#8b949e" text-anchor="middle">If research times out (8 min)</text>
  <text x="120" y="260" font-family="Arial, sans-serif" font-size="9" fill="#8b949e" text-anchor="middle">AND queue has ideas</text>
  <text x="120" y="275" font-family="Arial, sans-serif" font-size="9" fill="#f0883e" text-anchor="middle">Skip to Build immediately</text>

  <!-- Legend -->
  <rect x="20" y="320" width="760" height="65" rx="5" fill="#21262d"/>
  <text x="40" y="345" font-family="Arial, sans-serif" font-size="11" fill="#58a6ff" font-weight="bold">TIMEOUTS:</text>
  <text x="120" y="345" font-family="Arial, sans-serif" font-size="10" fill="#8b949e">Research: 8 min | Build: 25 min | LLM call: 5 min</text>
  <text x="40" y="365" font-family="Arial, sans-serif" font-size="11" fill="#238636" font-weight="bold">OUTPUT:</text>
  <text x="100" y="365" font-family="Arial, sans-serif" font-size="10" fill="#8b949e">Full code on GitHub | Frontend deployed to Vercel | Telegram notification</text>

  <!-- Arrow marker -->
  <defs>
    <marker id="bluearrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <path d="M0,0 L0,6 L9,3 z" fill="#58a6ff"/>
    </marker>
  </defs>
</svg>
```

</div>

---

## What Changed: v10 → v11

| | v10 (Old) | v11 (Current) |
|---|---|---|
| **Architecture** | Monolithic single loop | 5 specialized AI agents |
| **Research** | 13 subreddits, often 0 posts | 5 platforms: Reddit (26 subs), HN, Dev.to, GitHub |
| **Validation** | None - built everything | 5-dimension scoring, 6.5/10 threshold |
| **Frontend** | Random design themes | Psychology-driven UX per audience |
| **Backend** | Stubs/placeholders | Real API routes with working logic |
| **Timeouts** | None (could hang forever) | Research: 8min, Build: 25min, LLM: 5min |
| **Quality** | Basic file checks | 20-point quality gate |

---

## Research Sources

| Platform | Method | Posts/Cycle |
|----------|--------|-------------|
| **Reddit** | 26 subreddits via JSON API | ~190 |
| **HackerNews** | Firebase + Algolia APIs | ~100 |
| **Dev.to** | Public REST API | ~30 |
| **GitHub** | Trending repos API | ~20 |
| **Total** | | **~340 real posts** |

---

## Quick Start

```bash
git clone https://github.com/malikmuhammadsaadshafiq-dev/Openclaw.git
cd Openclaw/mvp-factory
npm install
```

Create `.env`:
```env
NVIDIA_API_KEY=nvapi-xxx    # Required - get free at build.nvidia.com
GITHUB_TOKEN=ghp_xxx        # Required - repo scopes
GITHUB_USERNAME=xxx         # Required
VERCEL_TOKEN=xxx            # Optional - auto-deploy
TELEGRAM_BOT_TOKEN=xxx      # Optional - notifications
TELEGRAM_CHAT_ID=xxx        # Optional
```

```bash
npm start   # Runs v11 multi-agent pipeline
```

---

## Live Dashboard

**[http://45.58.40.219:3000/](http://45.58.40.219:3000/)** - Real-time monitoring

- 5 Agent status cards with live indicators
- Color-coded log viewer with agent filters
- Validated ideas queue
- Build history with GitHub/Vercel links

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Kimi K2.5** | LLM via NVIDIA API |
| **TypeScript** | Daemon + generated apps |
| **Next.js 14** | Generated web apps |
| **TailwindCSS** | Generated styling |
| **PM2** | Process management |
| **Vercel** | Auto deployment |

---

## Project Structure

```
Openclaw/
├── mvp-factory/
│   ├── daemon/
│   │   └── mvp-factory-daemon-v11-multiagent.ts  # Main daemon (5600+ lines)
│   ├── dashboard/
│   │   ├── dashboard.html
│   │   └── server-v11.cjs
│   └── package.json
├── scripts/
│   └── update-readme-stats.sh   # Auto-updates stats in README
└── README.md
```

---

## License

MIT License

---

<div align="center">

**MVP Factory v11** - 5 AI agents that research, validate, and build real products.

*No placeholders. No AI slop. Only real data and working code.*

</div>
