<div align="center">

# Openclaw

### Autonomous AI Agent That Builds & Ships Real Software

[![MVP Factory](https://img.shields.io/badge/MVP_Factory-v10-blueviolet?style=for-the-badge)](mvp-factory/)
[![Builds](https://img.shields.io/badge/Apps_Built-40+-success?style=for-the-badge)](#-live-stats)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](#)
[![Kimi K2.5](https://img.shields.io/badge/LLM-Kimi_K2.5-FF6F00?style=for-the-badge&logo=nvidia&logoColor=white)](#)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](#license)

**Openclaw scrapes Reddit for real pain points, generates complete working apps with AI, tests them, and auto-deploys to GitHub + Vercel + Expo Go. Fully autonomous. 15 apps per day. Zero human intervention.**

[How It Works](#-how-it-works) | [Quick Start](#-quick-start) | [Architecture](#-architecture) | [Live Stats](#-live-stats) | [Built With](#-built-with)

---

</div>

## What Is This?

Openclaw is an autonomous software factory built for the [Clawathon Hackathon](https://openwork.bot/hackathon). It runs 24/7 on a server and continuously:

1. **Discovers** what people need by scraping 13 subreddits for real user pain points
2. **Ideates** 5 MVPs per cycle using Kimi K2.5 - prioritizing utility tools (like ilovepdf, tinypng) alongside AI-powered apps
3. **Builds** each app end-to-end: file structure, components, state management, CRUD ops, demo data, premium UI
4. **Tests** frontend, backend, and functionality automatically
5. **Ships** to GitHub (new repo), Vercel (web), and Expo Go (mobile) with zero human input
6. **Repeats** every 20 minutes

> Think of it as a CI/CD pipeline, but instead of deploying your code, it **writes** the code, tests it, and deploys it.

---

## How It Works

```
                    OPENCLAW AUTONOMOUS LOOP
                    ========================

    Reddit Scraping          Idea Generation           Code Generation
   +--------------+       +----------------+       +------------------+
   | 13 subreddits| ----> | Kimi K2.5 LLM  | ----> | Full app source  |
   | Signal match | ----> | 5 ideas/cycle   | ----> | 12 design styles |
   | Min 10 votes | ----> | Utility-first   | ----> | Working CRUD     |
   +--------------+       +----------------+       +------------------+
                                                            |
                                                            v
       Notifications           Deployment              Testing
   +--------------+       +----------------+       +------------------+
   | Telegram msg | <---- | GitHub repo    | <---- | Frontend tests   |
   | Build stats  | <---- | Vercel deploy  | <---- | Backend tests    |
   |              | <---- | Expo publish   | <---- | Functionality    |
   +--------------+       +----------------+       +------------------+

   Cycle: Research every 6h | Build every 20min | Max 15 builds/day
```

### What It Builds

| Type | Stack | Deployment | Example Apps |
|------|-------|------------|-------------|
| **Web Apps** | Next.js 14, TypeScript, Tailwind | GitHub + Vercel | InvoiceAnchor, FixFlow, ContractScan |
| **SaaS Tools** | Next.js 14, TypeScript, Tailwind | GitHub + Vercel | FreelanceForge, JobChangeAlert |
| **Mobile Apps** | React Native, Expo SDK 50 | GitHub + Expo Go | HabitAlchemy, SplitSavvy, DoseLogic |
| **Extensions** | Manifest V3, JS/CSS | GitHub | HumanCheck, IceBreaker |

### Design System (12 Premium Styles)

Every build gets a randomly assigned premium design theme:

| | | | |
|---|---|---|---|
| Glassmorphism Dark | Neobrutalism | Aurora Borealis | Minimal Light |
| Cyberpunk Neon | Sunset Gradient | Forest Dark | Ocean Blue |
| Retro Terminal | Pastel Soft | Dark Luxe | Neon Pop |

Each style includes custom CSS animations, color schemes, typography, card styles, and button effects.

---

## Quick Start

### Run locally (development)

```bash
git clone https://github.com/malikmuhammadsaadshafiq-dev/Openclaw.git
cd Openclaw/mvp-factory
npm install
```

Create `.env`:
```env
NVIDIA_API_KEY=nvapi-your-key        # Required - get free at build.nvidia.com
GITHUB_TOKEN=ghp_your-token          # Required - repo + delete_repo scopes
GITHUB_USERNAME=your-username        # Required
VERCEL_TOKEN=your-token              # Optional - auto-deploy web apps
EXPO_TOKEN=your-token                # Optional - publish mobile apps
TELEGRAM_BOT_TOKEN=your-bot-token    # Optional - notifications
TELEGRAM_CHAT_ID=your-chat-id       # Optional - notifications
```

Create output directories and start:
```bash
# Linux/macOS
mkdir -p ~/mvp-projects/{ideas,built,web,mobile,signals} ~/.openclaw/logs

# Start the factory
npm start
```

### Deploy to a server (24/7 production)

```bash
# One-line setup on Ubuntu/Debian
curl -fsSL https://raw.githubusercontent.com/malikmuhammadsaadshafiq-dev/Openclaw/master/mvp-factory/scripts/setup-server.sh | bash

# Then add your API keys
nano /root/mvp-factory/.env
systemctl restart mvp-factory
```

> **Full setup guide with step-by-step API key instructions:** [mvp-factory/README.md](mvp-factory/README.md)

---

## Architecture

```
Openclaw/
├── mvp-factory/                      # Core autonomous build system
│   ├── daemon/
│   │   └── mvp-factory-daemon-v10-server.ts  # Main daemon (2400+ lines)
│   │       ├── Reddit scraper (13 subreddits, signal matching)
│   │       ├── Kimi K2.5 integration (NVIDIA API)
│   │       ├── Web app builder (Next.js 14)
│   │       ├── Mobile app builder (Expo SDK 50)
│   │       ├── Chrome extension builder (Manifest V3)
│   │       ├── 12 design style system
│   │       ├── Test runner (frontend + backend + functionality)
│   │       ├── GitHub auto-push
│   │       ├── Vercel auto-deploy
│   │       ├── Expo Go auto-publish
│   │       └── Telegram notifications
│   ├── dashboard/
│   │   └── server.js                 # Live monitoring dashboard (port 3000)
│   ├── scripts/
│   │   ├── setup-server.sh           # One-line server setup
│   │   └── deploy.sh                 # Deployment script
│   └── config/
│       └── openclaw.json             # LLM & integration config
│
├── mvp-schemaflow/                   # Sample generated Next.js app
│   └── src/app/                      # Full working app with pages
│
└── README.md                         # You are here
```

### Key Components

| Component | What It Does |
|-----------|-------------|
| **Reddit Scraper** | Scans r/SideProject, r/SaaS, r/AppIdeas + 10 more for posts matching 18 signal keywords ("i wish", "need a tool", etc.) |
| **Idea Generator** | Sends Reddit signals to Kimi K2.5, generates 5 ideas per cycle. Utility-first: 3 pure tools + 2 AI-powered |
| **AI Detector** | Per-idea: checks `needsAI` flag from LLM, falls back to keyword detection. Only injects Kimi K2.5 API code when genuinely needed |
| **Code Generator** | Sends type-specific prompt to Kimi K2.5 (32K tokens). Web = Next.js, Mobile = Expo, Extension = Manifest V3 |
| **Design System** | 12 unique premium themes randomly assigned. Each has background, cards, buttons, animations, typography |
| **Test Runner** | Validates file structure, API routes, state management, interactivity, demo data presence |
| **Auto-Deployer** | Creates GitHub repo, sets topics, pushes code. Deploys web to Vercel, mobile to Expo Go |
| **Dashboard** | Node.js server with real-time stats, queue, logs, signal viewer |

---

## Live Stats

The factory has been running autonomously and has produced:

| Metric | Value |
|--------|-------|
| **Total apps built** | 40+ |
| **Web apps** | 29 |
| **Mobile apps** | 7 |
| **Extensions** | 4+ |
| **Build rate** | Up to 15/day |
| **Research cycles** | 4/day |
| **Reddit signals processed** | 1000+ |
| **Design themes** | 12 |
| **Test pass rate** | High (auto-fix on failure) |

### Sample Built Projects

| Project | Type | What It Does |
|---------|------|-------------|
| InvoiceAnchor | Web | Invoice generator with PDF export |
| FixFlow | Web | Issue tracker with kanban board |
| FreelanceForge | SaaS | Freelancer project management |
| ContractScan AI | Web | AI-powered contract analysis |
| HabitAlchemy | Mobile | Gamified habit tracker with chemistry metaphor |
| SplitSavvy | Mobile | Group expense splitter with debt optimization |
| HumanCheck | Extension | CAPTCHA helper tool |
| JobChangeAlert | Web | Job market monitoring dashboard |

All projects are public on GitHub: [github.com/malikmuhammadsaadshafiq-dev](https://github.com/malikmuhammadsaadshafiq-dev?tab=repositories&q=mvp-)

---

## Built With

| Technology | Purpose |
|-----------|---------|
| **[Kimi K2.5](https://build.nvidia.com/)** | LLM for idea generation + code generation (via NVIDIA API) |
| **TypeScript** | Daemon, generated web apps |
| **Next.js 14** | Generated web/SaaS apps |
| **React Native + Expo SDK 50** | Generated mobile apps |
| **Tailwind CSS** | Generated app styling |
| **Reddit Public API** | Market signal scraping |
| **GitHub API** | Auto repo creation + push |
| **Vercel** | Auto web deployment |
| **Expo EAS** | Auto mobile deployment |
| **Telegram Bot API** | Build notifications |
| **systemd** | Daemon process management |

---

## Squadron (Clawathon Hackathon)

Built for the [Clawathon Hackathon](https://openwork.bot/hackathon) by the Openclaw Squadron:

| Agent | Role | Status |
|-------|------|--------|
| **FrontendClaw** | Frontend builds (Next.js, Tailwind) | Registered |
| **BackendClaw** | Backend builds (APIs, AI integration) | Registered |
| **ContractClaw** | Smart contract builds | Registered |
| **PMClaw** | Project coordination | Registered |

---

## Configuration

All config lives in `mvp-factory/daemon/mvp-factory-daemon-v10-server.ts` at the top:

```typescript
// Adjust build rate
limits: { maxBuildsPerDay: 15, researchPerDay: 4 }

// Change intervals
intervals: { research: 6h, build: 20min }

// Add subreddits
reddit: { subreddits: ["SideProject", "startups", ...] }

// Swap LLM (any OpenAI-compatible API)
nvidia: { baseUrl: "...", model: "...", apiKey: "..." }
```

See [mvp-factory/README.md](mvp-factory/README.md) for the full configuration guide, troubleshooting, and FAQ.

---

## License

MIT License - use, modify, and distribute freely.

---

<div align="center">

**Openclaw** - Autonomous software that builds software.

</div>
