<div align="center">

# MVP Factory v11

### Multi-Agent AI System That Researches, Validates, Builds & Ships Real Products

[![MVP Factory](https://img.shields.io/badge/MVP_Factory-v11_Multi--Agent-blueviolet?style=for-the-badge)](mvp-factory/)
[![Live Dashboard](https://img.shields.io/badge/Live_Dashboard-Online-34d399?style=for-the-badge)](http://45.58.40.219:3000/)
[![Agents](https://img.shields.io/badge/AI_Agents-5-ff6f00?style=for-the-badge)](#-agent-architecture)
[![Data Sources](https://img.shields.io/badge/Data_Sources-5_Platforms-success?style=for-the-badge)](#-research-agent)
[![Kimi K2.5](https://img.shields.io/badge/LLM-Kimi_K2.5-FF6F00?style=for-the-badge&logo=nvidia&logoColor=white)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](#)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](#license)

**5 specialized AI agents work together: Research real pain points from Reddit/HN/Dev.to/GitHub, ruthlessly validate ideas (6.5/10 threshold), design psychology-driven UIs, build complete working backends, and auto-deploy to Vercel. No placeholders. No AI slop. Only real data and real products.**

[Agent Architecture](#-agent-architecture) | [Pipeline Flow](#-pipeline-flow) | [Quick Start](#-quick-start) | [Live Dashboard](#-live-dashboard) | [Results](#-validation-in-action)

---

</div>

## What Changed: v10 → v11

| | v10 (Old) | v11 (Current) |
|---|---|---|
| **Architecture** | Monolithic single loop | 5 specialized AI agents |
| **Research** | 13 subreddits only, often 0 posts | 5 platforms: Reddit (62+ posts), HN Firebase (50+), HN Algolia (60+), Dev.to (28+), GitHub Trending (20+) |
| **Validation** | None - built everything | 5-dimension scoring, 6.5/10 threshold, rejects 87% of ideas |
| **Frontend** | Random design themes | Psychology-driven UX matched to target audience |
| **Backend** | Often stubs/placeholders | Fully implemented API routes with real logic |
| **Data** | AI-generated fake ideas when scraping failed | ZERO placeholders - pipeline pauses if no real data |
| **Quality** | Basic file checks | 20-point quality gate with auto-fix |
| **Reliability** | Silent failures | RetryLoop (exponential backoff) + RateLimiter on all agents |

---

## Agent Architecture

```
╔═══════════════════════════════════════════════════════════════════════╗
║                   5 SPECIALIZED AI AGENTS                            ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ ║
║  │    RA    │  │    VA    │  │    FA    │  │    BA    │  │   PM   │ ║
║  │ Research │  │Validation│  │ Frontend │  │ Backend  │  │Orchestr│ ║
║  │  Agent   │  │  Agent   │  │  Agent   │  │  Agent   │  │ -ator  │ ║
║  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘ ║
║       │              │              │              │            │      ║
║  5 platforms    5-dim scoring   Psychology    Real APIs    Pipeline   ║
║  220+ posts     6.5/10 gate    driven UX     no stubs    + quality   ║
║  real data      ruthless       per audience  full logic   20pt gate  ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

| Agent | Role | What It Does |
|-------|------|-------------|
| **ResearchAgent** | Data Collection | Scrapes Reddit (21 subs), HackerNews (Firebase + Algolia), Dev.to, GitHub Trending. Collects 220+ real posts per cycle. NO fake data ever. |
| **ValidationAgent** | Market Analysis | Scores every idea on 5 dimensions (market demand, competition gap, feasibility, monetization, audience fit). Rejects ~87% of ideas. Minimum 6.5/10 to build. |
| **FrontendAgent** | UI/UX Design | Designs audience-specific UX using behavioral psychology (loss aversion, social proof, anchoring). Custom design system per product. |
| **BackendAgent** | API Development | Builds complete, working API routes. Real processing logic, AI integration via Kimi K2.5, proper validation and error handling. No stubs. |
| **PMAgent** | Orchestration | Coordinates all agents, runs Frontend+Backend in parallel, applies 20-point quality gate, auto-deploys to GitHub + Vercel. |

---

## Pipeline Flow (Decoupled)

Research and Validation run **independently** from Building. This means the system can discover and validate new ideas while a build is in progress.

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    TWO INDEPENDENT LOOPS                              ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  LOOP 1: Research + Validate (every 30 min, independent)              ║
║  ┌──────────┐     ┌──────────┐     ┌──────────────────┐              ║
║  │ Research  │ ──▶ │ Validate │ ──▶ │ Save to Queue    │              ║
║  │ 5 sources │     │ 5-dim    │     │ (validated/*.json)│              ║
║  │ 220+ posts│     │ score    │     └──────────────────┘              ║
║  └──────────┘     └──────────┘           │                            ║
║       ↑                                  ▼                            ║
║       └──── runs even while building ── queue ──┐                     ║
║                                                  │                    ║
║  LOOP 2: Build from Queue (every 20 min, locked) │                    ║
║  ┌──────────────┐     ┌──────────────┐     ┌─────┴────┐              ║
║  │ Pick best    │ ──▶ │ Frontend +   │ ──▶ │ Deploy   │              ║
║  │ from queue   │     │ Backend      │     │ GitHub + │              ║
║  │ (if !locked) │     │ (parallel)   │     │ Vercel   │              ║
║  └──────────────┘     └──────────────┘     └──────────┘              ║
║       ↑                                                               ║
║       └──── isBuilding lock prevents concurrent builds ──────────    ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

### Detailed Flow

```
LOOP 1: RESEARCH + VALIDATION (runs independently every 30 min)
│
├── PHASE 1: RESEARCH AGENT
│   ├── Reddit (21 subreddits, rate-limited, browser UA, retry loop)
│   ├── HackerNews Firebase API (/show, /ask, /top stories)
│   ├── HackerNews Algolia Search API ("need tool", "wish there was", etc.)
│   ├── Dev.to API (top articles this week)
│   └── GitHub Trending (SaaS, dev-tools, productivity repos)
│       ↓  All run in PARALLEL (Promise.allSettled)
│       ~220 real posts → deduplicate → ~210 unique
│       ↓  AI extracts 8 product ideas grounded in real posts
│
├── PHASE 2: VALIDATION AGENT
│   ├── Dedup check against all existing products
│   ├── For each idea (sequential, with retry):
│   │   ├── Market Demand      (30% weight)  → 1-10
│   │   ├── Competition Gap    (25% weight)  → 1-10
│   │   ├── Tech Feasibility   (15% weight)  → 1-10
│   │   ├── Monetization       (15% weight)  → 1-10
│   │   └── Audience Fit       (15% weight)  → 1-10
│   ├── Weighted score must be ≥ 6.5/10
│   └── Competition gap must be ≥ 5/10
│       ↓  Typically 1-2 out of 8 pass (87% rejection rate)
│       ↓  Saved to validated/ queue
│
LOOP 2: BUILD FROM QUEUE (runs independently every 20 min, locked)
│
├── isBuilding lock → skip if another build is in progress
├── Pick best idea from validated/ queue (by score)
│
├── PHASE 3: FRONTEND + BACKEND (IN PARALLEL)
│   ├── FrontendAgent: UX design + code gen (Next.js 14, TailwindCSS)
│   └── BackendAgent: architecture + code gen (real logic, AI integration)
│
├── PHASE 4: MERGE + QUALITY GATE (20 points)
│   ├── Merge frontend + backend files
│   ├── Quality checks (10/20 minimum, auto-fix if below)
│   └── API routes, frontend→API calls, error handling, loading states, etc.
│
└── PHASE 5: BUILD + DEPLOY
    ├── npm install → Push to GitHub → Deploy to Vercel
    └── Notify via Telegram
```

---

## Validation In Action

The ValidationAgent provides **brutal, honest market analysis**. Here's a real example from a live run:

```
8 ideas extracted from 220 real posts across 5 platforms

REJECTED: "FitMap"         (4.5/10) - Saturated market, cold-start problem
REJECTED: "KeyBridge"      (5.4/10) - Commoditized secrets management
REJECTED: "DeployZero"     (5.4/10) - Can't compete with Vercel/Netlify
REJECTED: "ChatVault"      (5.6/10) - No official APIs for chat history
APPROVED: "CodeKeeper"     (7.0/10) ✅ - Unique angle on code snippet management
REJECTED: "ArmScan"        (5.2/10) - Diminishing problem, one-line CLI solution
REJECTED: "Authenticity"   (4.1/10) - AI detection is unreliable, platforms will build natively
REJECTED: "ChairMatch"     (5.6/10) - Unsustainable data collection

Result: 1/8 approved (87.5% rejection rate)
→ CodeKeeper selected for building with Frontend + Backend agents
```

Each rejection includes detailed reasoning: competitor analysis, TAM assessment, technical feasibility concerns, and monetization analysis.

---

## Research Sources

| Platform | Method | Auth Required | Posts/Cycle |
|----------|--------|---------------|-------------|
| **Reddit** | Public JSON endpoints + OAuth API | No (public) / Optional (OAuth) | ~62 |
| **HackerNews** | Firebase REST API | No | ~50 |
| **HN Algolia** | Search API (pain point queries) | No | ~60 |
| **Dev.to** | Public REST API | No | ~28 |
| **GitHub** | Search API (trending repos) | Optional (higher rate limits) | ~20 |

**Total: ~220 real posts per cycle, 0 placeholders**

---

## Quick Start

### Run locally

```bash
git clone https://github.com/malikmuhammadsaadshafiq-dev/Openclaw.git
cd Openclaw/mvp-factory
npm install
```

Create `.env`:
```env
NVIDIA_API_KEY=nvapi-your-key        # Required - get free at build.nvidia.com
GITHUB_TOKEN=ghp_your-token          # Required - repo scopes
GITHUB_USERNAME=your-username        # Required
VERCEL_TOKEN=your-token              # Optional - auto-deploy
TELEGRAM_BOT_TOKEN=your-bot-token    # Optional - notifications
TELEGRAM_CHAT_ID=your-chat-id        # Optional - notifications
REDDIT_CLIENT_ID=your-id             # Optional - higher rate limits
REDDIT_CLIENT_SECRET=your-secret     # Optional - higher rate limits
```

```bash
npm start   # Runs v11 multi-agent pipeline
```

### Deploy to server (24/7)

```bash
# Copy files to server
scp -r mvp-factory/ root@your-server:/root/mvp-factory/

# Set up systemd service
# See mvp-factory/README.md for full server setup guide
```

---

## Live Dashboard

**[http://45.58.40.219:3000/](http://45.58.40.219:3000/)** - auto-refreshes every 12 seconds

- **5 Agent Cards** - ResearchAgent (RA), ValidationAgent (VA), FrontendAgent (FA), BackendAgent (BA), PMAgent (PM) with live status
- **Agent-Colored Logs** - Each agent gets its own color + badge, with filter buttons (All/RA/VA/FA/BA/PM)
- **Decoupled Pipeline** - Research+Validate loop and Build loop shown independently
- **Validated Queue** - Ideas approved and waiting to be built
- **Build History** - All completed products with GitHub/Vercel links
- **ClawHub Skills** - 34-skill marketplace with install/uninstall

---

## Architecture

```
Openclaw/
├── mvp-factory/
│   ├── daemon/
│   │   ├── mvp-factory-daemon-v11-multiagent.ts  # v11 multi-agent (2300+ lines)
│   │   │   ├── RetryLoop (exponential backoff)
│   │   │   ├── RateLimiter (prevents API blocking)
│   │   │   ├── ResearchAgent (5 real data sources)
│   │   │   ├── ValidationAgent (5-dim scoring)
│   │   │   ├── FrontendAgent (psychology-driven UX)
│   │   │   ├── BackendAgent (real API implementations)
│   │   │   └── PMAgent (orchestration + quality gate)
│   │   └── mvp-factory-daemon.ts                 # Legacy v10 daemon
│   ├── dashboard/
│   │   ├── dashboard.html                        # Single-page dashboard app
│   │   └── server-v11.cjs                        # Dashboard API server
│   ├── skills/
│   │   ├── mvp-builder/SKILL.md                  # Builder skill definition
│   │   └── idea-research/SKILL.md                # Research skill definition
│   └── package.json                              # v2.0.0
├── scripts/
│   └── update-dashboard-html.py                  # Dashboard updater
└── README.md
```

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| **[Kimi K2.5](https://build.nvidia.com/)** | LLM for research analysis, validation, code generation (via NVIDIA API) |
| **TypeScript** | Daemon + generated apps |
| **Next.js 14** | Generated web apps (App Router) |
| **TailwindCSS** | Generated app styling (custom per product) |
| **Reddit Public API** | Community pain point scraping (21 subreddits) |
| **HackerNews API** | Firebase + Algolia for tech community signals |
| **Dev.to API** | Developer article trends |
| **GitHub API** | Trending repos + auto repo creation |
| **Vercel** | Auto deployment with env vars |
| **Telegram Bot API** | Build notifications |
| **systemd** | Process management on deployment server |

---

## Squadron (Clawathon Hackathon)

Built for the [Clawathon Hackathon](https://openwork.bot/hackathon):

| Agent | Role | Platform Skills |
|-------|------|----------------|
| **ResearchAgent** | Research | Reddit, HN, Dev.to, GitHub Trending |
| **ValidationAgent** | Validation | Market scoring, competition analysis |
| **FrontendAgent** | Frontend | Psychology-driven UX, custom design systems |
| **BackendAgent** | Backend | Real APIs, AI integration, data processing |
| **PMAgent** | Orchestrator | Pipeline, quality gate, deploy |

---

## Scheduling (Decoupled)

| Cycle | Interval | What Happens | Independent? |
|-------|----------|-------------|:---:|
| **Research + Validate** | Every 30 min | Scrape 5 platforms → validate → save to queue | Yes |
| **Build from Queue** | Every 20 min | Pick best idea → build → deploy (locked, 1 at a time) | Yes (locked) |
| **Health Check** | Every 5 min | Write stats to health-v11.json | Yes |
| **Log Rotation** | Every 1 hour | Rotate logs if >10MB | Yes |

Research+Validation and Build run on **independent timers**. The build loop has an `isBuilding` lock to prevent concurrent builds, but research continues discovering new ideas while a build is in progress.

---

## License

MIT License - use, modify, and distribute freely.

---

<div align="center">

**MVP Factory v11** - 5 AI agents that research, validate, and build real products.

*No placeholders. No AI slop. Only real data and working code.*

</div>
