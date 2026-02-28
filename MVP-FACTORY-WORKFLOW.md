# MVP Factory v11 - Complete System Workflow

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [The 5 Agents](#the-5-agents)
4. [Pipeline Flow](#pipeline-flow)
5. [Key Features](#key-features)
6. [External Services](#external-services)
7. [File Structure](#file-structure)
8. [Configuration](#configuration)
9. [Known Issues & Fixes](#known-issues--fixes)
10. [Monitoring & Debugging](#monitoring--debugging)

---

## System Overview

MVP Factory is an **autonomous AI-powered system** that:
1. **Researches** real problems from Reddit, HackerNews, Dev.to, and GitHub
2. **Validates** ideas using market analysis and audience profiling
3. **Builds** complete full-stack applications (Next.js + API routes)
4. **Deploys** to GitHub (full code) and Vercel (frontend demo)

### Tech Stack
- **Runtime**: Node.js with tsx (TypeScript execution)
- **LLM**: Kimi K2.5 via NVIDIA API (256K context, 32K output)
- **Framework**: Next.js 14 App Router + TailwindCSS
- **Deployment**: GitHub + Vercel
- **Process Manager**: PM2

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MVP FACTORY v11                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │
│   │  Research    │───▶│  Validation  │───▶│   Queue      │         │
│   │    Agent     │    │    Agent     │    │ (validated/) │         │
│   └──────────────┘    └──────────────┘    └──────────────┘         │
│          │                                        │                  │
│          │            10 MIN PAUSE                │                  │
│          │◀───────────────────────────────────────┘                  │
│          │                                                           │
│          ▼                                                           │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │
│   │   Backend    │◀──▶│   Frontend   │───▶│     PM       │         │
│   │    Agent     │    │    Agent     │    │    Agent     │         │
│   └──────────────┘    └──────────────┘    └──────────────┘         │
│                                                   │                  │
│                                                   ▼                  │
│                              ┌────────────────────────────┐         │
│                              │  GitHub (Full Stack Code)  │         │
│                              └────────────────────────────┘         │
│                                          │                           │
│                                          ▼                           │
│                              ┌────────────────────────────┐         │
│                              │  Vercel (Frontend + Mock)  │         │
│                              └────────────────────────────┘         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## The 5 Agents

### 1. ResearchAgent
**Purpose**: Collects real problems from the internet

**Data Sources**:
| Platform | Method | Posts Collected |
|----------|--------|-----------------|
| Reddit | JSON API (`/r/{sub}/hot.json`) | 8 per subreddit, 26 subreddits |
| HackerNews | Firebase API + Algolia | ~100 posts |
| Dev.to | Public API | 30 posts |
| GitHub | Trending page scraping | 20 repos |

**Output**: Raw signals saved to `/root/mvp-projects/signals/`

**Key Logic**:
- Filters posts with score >= 5
- Deduplicates by title similarity
- Samples 18 diverse posts for LLM analysis
- LLM extracts 6 product ideas from posts

### 2. ValidationAgent
**Purpose**: Validates ideas with market analysis

**Scoring Criteria** (each 1-10):
| Metric | Weight | What it measures |
|--------|--------|------------------|
| Market Demand | High | Is there real demand? |
| Competition Gap | High | Is there room in market? |
| Technical Feasibility | Medium | Can we build it in 24h? |
| Monetization Potential | Medium | Can it make money? |
| Audience Fit | Medium | Clear target user? |

**Validation Process**:
1. Deep audience profiling (demographics, pain points, motivations)
2. Competitor analysis
3. Unique angle identification
4. Overall score calculation (threshold: 6.5/10)

**Output**: Validated ideas saved to `/root/mvp-projects/validated/`

### 3. FrontendAgent
**Purpose**: Generates psychology-driven UI

**What it generates**:
- `src/app/page.tsx` - Landing page with hero, features, CTA
- `src/app/auth/page.tsx` - Login/signup with validation
- `src/app/dashboard/page.tsx` - Main user interface
- `src/app/layout.tsx` - Root layout with metadata
- `src/app/globals.css` - TailwindCSS styles
- `src/components/*.tsx` - Reusable UI components

**Design Principles**:
- Mobile-first responsive design
- Accessibility (ARIA labels, keyboard nav)
- Psychology-driven (social proof, urgency, trust signals)
- TailwindCSS utility classes

### 4. BackendAgent
**Purpose**: Designs and generates API architecture

**What it generates**:
- `src/app/api/*/route.ts` - API endpoints
- Request validation
- Business logic
- Mock data structures

**API Route Structure**:
```typescript
// Each route handles GET, POST, PUT, DELETE
export async function POST(req: NextRequest) {
  const body = await req.json();
  // Validation
  // Business logic
  return NextResponse.json({ data });
}
```

### 5. PMAgent (Orchestrator)
**Purpose**: Coordinates all agents and manages pipeline

**Responsibilities**:
- Runs sequential pipeline (Research → Validate → Build → Deploy)
- Merges frontend + backend code
- Handles file conflicts
- Runs integration repair
- Manages GitHub push
- Manages Vercel deployment
- Tracks build quality scores

---

## Pipeline Flow

### Sequential Pipeline (Current Design)

```
CYCLE START
    │
    ▼
┌─────────────────────────────────────┐
│ STEP 1: Research + Validation       │
│                                      │
│  IF queue < 10 ideas:               │
│    1. ResearchAgent scrapes sources │
│    2. LLM extracts product ideas    │
│    3. ValidationAgent scores ideas  │
│    4. Save to validated/ queue      │
│                                      │
│  ══════════════════════════════     │
│  PAUSE 10 MINUTES                   │
│  (Let queue settle before building) │
│  ══════════════════════════════     │
│                                      │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ STEP 2: Build + Deploy              │
│                                      │
│  IF daily build limit not reached:  │
│    1. Pick highest-scored idea      │
│    2. BackendAgent designs APIs     │
│    3. FrontendAgent generates UI    │
│    4. PMAgent merges & repairs      │
│    5. npm install && npm run build  │
│    6. Push to GitHub (full code)    │
│    7. Stub APIs → Deploy to Vercel  │
│                                      │
└─────────────────────────────────────┘
    │
    ▼
CYCLE COMPLETE → Wait 30s → Repeat
```

### Timing Breakdown

| Phase | Duration | Notes |
|-------|----------|-------|
| Reddit scraping | ~60s | 26 subreddits, 2s delay each |
| Other sources | ~10s | HN, Dev.to, GitHub parallel |
| LLM idea extraction | 2-5 min | NVIDIA API can be slow |
| Validation per idea | 1-2 min | Deep analysis |
| Build generation | 3-5 min | Frontend + Backend |
| npm install | 1-2 min | Dependencies |
| npm build | 1-3 min | Next.js compilation |
| GitHub push | ~30s | Git operations |
| Vercel deploy | 2-5 min | Build + deploy |
| **Total per project** | **15-25 min** | |

---

## Key Features

### 1. Full Stack Generation
- **Frontend**: Complete UI with auth flow, dashboard, forms
- **Backend**: API routes with validation and business logic
- **Integration**: Frontend calls backend APIs

### 2. Dual Deployment Strategy
| Target | Content | Purpose |
|--------|---------|---------|
| GitHub | Full stack code | Users clone for complete app |
| Vercel | Frontend + mock APIs | Live demo to explore UI |

### 3. Comprehensive README
Each project includes:
- Deploy buttons (Vercel, Railway)
- Environment variables guide
- Step-by-step setup instructions
- Feature implementation guide
- Dockerfile for self-hosting

### 4. Build Resilience (Zero-Failure System)
```
Layer 1: Permissive next.config.js
         (ignoreBuildErrors, eslint off)
              │
              ▼ If build fails
Layer 2: Stub broken files
         (API routes, pages, components)
              │
              ▼ If still fails
Layer 3: Deploy anyway
         (Vercel handles gracefully)
```

### 5. Rate Limiting & Semaphores
- **kimiSemaphore**: Limits concurrent LLM calls to 1
- **Global rate limiter**: Minimum gap between API requests
- **Retry logic**: 5 retries with exponential backoff

### 6. Fail Tracking
- Path: `/root/mvp-projects/fail-tracker-v11.json`
- Ideas with 3+ failures are skipped permanently
- Reset: `echo '{}' > /root/mvp-projects/fail-tracker-v11.json`

---

## External Services

### 1. NVIDIA API (Kimi K2.5)
**Endpoint**: `https://integrate.api.nvidia.com/v1/chat/completions`

**Configuration**:
```env
NVIDIA_API_KEY=nvapi-xxxxx
```

**Model**: `moonshotai/kimi-k2.5`
- Context: 256K tokens
- Max output: 32K tokens
- Supports: thinking mode, tool use

**Known Issues**:
- IPv6 not supported → We force IPv4 with custom `fetchIPv4`
- Can be slow (2-5 min per request)
- Rate limits on free tier

### 2. GitHub API
**Purpose**: Create repos and push code

**Configuration**:
```env
GITHUB_TOKEN=ghp_xxxxx
GITHUB_USERNAME=malikmuhammadsaadshafiq-dev
```

**Operations**:
- Check if repo exists
- Create new repo
- Push code with git CLI

### 3. Vercel API
**Purpose**: Deploy frontend demos

**Configuration**:
```env
VERCEL_TOKEN=xxxxx
VERCEL_TEAM_ID=team_xxxxx
```

**Operations**:
- Prune old projects (keep 20 newest)
- Build project
- Deploy to production
- Get production URL

### 4. Reddit API
**Endpoint**: `https://www.reddit.com/r/{subreddit}/hot.json`

**No auth required** (public JSON endpoint)

**Rate limiting**: 2 second delay between subreddits

### 5. HackerNews API
**Endpoints**:
- Firebase: `https://hacker-news.firebaseio.com/v0/`
- Algolia: `https://hn.algolia.com/api/v1/`

**No auth required**

### 6. Dev.to API
**Endpoint**: `https://dev.to/api/articles`

**No auth required**

### 7. Telegram (Notifications)
**Purpose**: Send build success/failure notifications

**Configuration**:
```env
TELEGRAM_BOT_TOKEN=xxxxx
TELEGRAM_CHAT_ID=xxxxx
```

---

## File Structure

### Server Paths
```
/root/
├── Openclaw-repo/              # Git repository (cloned from GitHub)
│   └── mvp-factory/
│       ├── daemon/
│       │   └── mvp-factory-daemon-v11-multiagent.ts  # Main daemon
│       ├── ecosystem.config.cjs  # PM2 configuration
│       └── .env                  # Environment variables
│
├── mvp-factory/                # Symlink → /root/Openclaw-repo/mvp-factory
│
├── mvp-projects/               # Output directory
│   ├── signals/                # Raw research data
│   ├── validated/              # Ideas ready to build (queue)
│   ├── built/                  # Successfully built projects
│   ├── projects/               # Generated project files
│   └── fail-tracker-v11.json   # Failed build tracking
│
└── .openclaw/
    └── logs/
        └── daemon-v11.log      # Daemon logs
```

### Generated Project Structure
```
project-name/
├── src/
│   ├── app/
│   │   ├── page.tsx            # Landing page
│   │   ├── layout.tsx          # Root layout
│   │   ├── globals.css         # Styles
│   │   ├── auth/
│   │   │   └── page.tsx        # Auth page
│   │   ├── dashboard/
│   │   │   └── page.tsx        # Dashboard
│   │   └── api/
│   │       ├── auth/
│   │       │   └── route.ts    # Auth API
│   │       ├── data/
│   │       │   └── route.ts    # Data API
│   │       └── */route.ts      # Other APIs
│   └── components/
│       └── *.tsx               # UI components
├── public/                     # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── Dockerfile                  # Docker deployment
├── .dockerignore
├── .gitignore
├── LICENSE
└── README.md                   # Comprehensive docs
```

---

## Configuration

### Environment Variables (.env)
```env
# LLM
NVIDIA_API_KEY=nvapi-xxxxx

# GitHub
GITHUB_TOKEN=ghp_xxxxx
GITHUB_USERNAME=malikmuhammadsaadshafiq-dev

# Vercel
VERCEL_TOKEN=xxxxx
VERCEL_TEAM_ID=team_xxxxx

# Telegram (optional)
TELEGRAM_BOT_TOKEN=xxxxx
TELEGRAM_CHAT_ID=xxxxx
```

### PM2 Configuration (ecosystem.config.cjs)
```javascript
module.exports = {
  apps: [{
    name: 'mvp-daemon',
    script: '/usr/bin/node',
    args: '--dns-result-order=ipv4first /root/Openclaw-repo/mvp-factory/node_modules/.bin/tsx daemon/mvp-factory-daemon-v11-multiagent.ts',
    cwd: '/root/Openclaw-repo/mvp-factory',
    interpreter: 'none',
    env: {
      NODE_OPTIONS: '--dns-result-order=ipv4first',
    },
    treekill: true,
    kill_timeout: 10000,
  }],
};
```

### Key Config Constants (in daemon code)
```typescript
const CONFIG = {
  paths: {
    signals: '/root/mvp-projects/signals',
    validated: '/root/mvp-projects/validated',
    built: '/root/mvp-projects/built',
    projects: '/root/mvp-projects/projects',
  },
  nvidia: {
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    model: 'moonshotai/kimi-k2.5',
    apiKey: process.env.NVIDIA_API_KEY,
  },
  // ... github, vercel, telegram configs
};

const DAILY_BUILD_LIMIT = 50;
const BUILD_TIMEOUT_MS = 25 * 60 * 1000; // 25 minutes
```

---

## Known Issues & Fixes

### 1. IPv6 "fetch failed" Errors
**Problem**: NVIDIA API doesn't support IPv6, Node.js tries IPv6 first
**Fix**: Custom `fetchIPv4()` function using `https.request` with `family: 4`
```typescript
const req = https.request({
  hostname: urlObj.hostname,
  family: 4,  // Force IPv4
  // ...
});
```

### 2. NVIDIA API Slowness
**Problem**: Kimi K2.5 takes 2-5 minutes per request
**Mitigation**:
- 5 retries with exponential backoff
- 5-minute timeout per request
- Non-streaming mode for reliability

### 3. Reddit 403 Errors
**Problem**: Reddit rate limits the JSON API
**Mitigation**:
- 2 second delay between subreddit requests
- Graceful skip on 403 (continue with other sources)
- Other sources (HN, Dev.to, GitHub) still work

### 4. Build Failures
**Problem**: AI-generated code sometimes has syntax errors
**Fix**: 3-layer resilience system
1. Permissive next.config.js (ignore errors)
2. Stub broken files with valid code
3. Deploy anyway

### 5. Zombie Processes (RESOLVED)
**Problem**: systemd unit was running duplicate daemon
**Fix**: Disabled systemd unit, use PM2 only
```bash
systemctl stop mvp-factory.service
systemctl disable mvp-factory.service
```

### 6. Mobile App Generation (DISABLED)
**Problem**: React Native causes 32K token explosion
**Fix**: Permanently disabled `type: "mobile"` in ValidationAgent

---

## Monitoring & Debugging

### View Live Logs
```bash
# SSH to server
ssh root@45.58.40.219

# Follow logs
tail -f /root/.openclaw/logs/daemon-v11.log

# Last 100 lines
tail -100 /root/.openclaw/logs/daemon-v11.log

# Search for errors
grep -i "error\|failed" /root/.openclaw/logs/daemon-v11.log | tail -50
```

### PM2 Commands
```bash
# Status
pm2 status

# Detailed info
pm2 show mvp-daemon

# Restart daemon
pm2 restart mvp-daemon

# Stop daemon
pm2 stop mvp-daemon

# View PM2 logs
pm2 logs mvp-daemon --lines 100
```

### Check Queue Status
```bash
# Ideas waiting to be built
ls -la /root/mvp-projects/validated/

# Successfully built
ls -la /root/mvp-projects/built/

# Fail tracker
cat /root/mvp-projects/fail-tracker-v11.json
```

### Reset Fail Tracker
```bash
echo '{}' > /root/mvp-projects/fail-tracker-v11.json
```

### Test NVIDIA API
```bash
curl -4 -s https://integrate.api.nvidia.com/v1/chat/completions \
  -H "Authorization: Bearer $NVIDIA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"moonshotai/kimi-k2.5","messages":[{"role":"user","content":"Say hi"}],"max_tokens":10}'
```

---

## Deployment Checklist

### Initial Setup
- [ ] Clone repo to server
- [ ] Install Node.js 20+
- [ ] Install PM2 globally
- [ ] Configure .env with all API keys
- [ ] Create output directories
- [ ] Start daemon with PM2

### Daily Operations
- [ ] Monitor logs for errors
- [ ] Check queue size
- [ ] Review built projects on GitHub
- [ ] Clear fail tracker if needed

### Troubleshooting
1. **Daemon not starting?** → Check PM2 logs, verify .env exists
2. **No ideas being extracted?** → Check NVIDIA API key, test API manually
3. **Builds failing?** → Check fail tracker, simplify complex ideas
4. **Vercel deploy failing?** → Check Vercel token, project limits

---

## Summary

MVP Factory v11 is a fully autonomous system that:

1. **Discovers** real problems from 4 platforms (Reddit, HN, Dev.to, GitHub)
2. **Validates** with market analysis and audience profiling
3. **Generates** complete full-stack Next.js applications
4. **Deploys** to GitHub (full code) and Vercel (frontend demo)
5. **Documents** each project with comprehensive README

The system runs 24/7, continuously building MVPs with minimal human intervention.

---

*Last updated: February 2026*
*Version: MVP Factory v11 Multi-Agent Architecture*
