# Project Milestone Status

> Last updated: 2026-02-21
> Purpose: Tells a new Claude session exactly where we are and what to do next.

---

## What This Project Is

**MVP Factory v11** — A multi-agent AI system that:
1. Researches real pain points from Reddit, HN, Dev.to, GitHub Trending
2. Validates ideas with a 5-dimension scoring model (6.5/10 threshold)
3. Builds complete Next.js + TailwindCSS apps (Frontend + Backend in parallel)
4. Auto-deploys to GitHub + Vercel
5. Notifies via Telegram

**Live Dashboard:** http://45.58.40.219:3000/
**GitHub Repo:** https://github.com/malikmuhammadsaadshafiq-dev/Openclaw

---

## Current Milestone: v11 Running on Server — Bug-Fix Phase

The daemon is deployed and running on the server (`45.58.40.219`) managed by pm2.
The pipeline is functional end-to-end. We are in **maintenance/bug-fix mode**.

### Recently Fixed (last session)
- Progress file conflict between daemon instances
- LLM fallback poisoning the validated queue with bad data
- `getCurrentBuild` reads `pipeline-progress.json` directly (not stale cache)
- Dashboard pm2 status check + username scope bug
- All 5 platforms sourced correctly for research (not just Reddit)
- 3-layer duplicate guard: queue, build, and GitHub
- Auto-load `.env` in daemon so API keys survive pm2 restarts
- Agent distortion: duplicate logs, ghost instances, API auth issues
- Frontend/Backend agents build independently of Research/Validation

---

## Key Files

| File | Purpose |
|------|---------|
| `mvp-factory/daemon/mvp-factory-daemon-v11-multiagent.ts` | Main v11 daemon (source of truth) |
| `mvp-factory/dashboard/server-v11.cjs` | Dashboard API server |
| `mvp-factory/dashboard/dashboard.html` | Frontend dashboard UI |
| `mvp-factory/package.json` | npm scripts, version |
| `.env` | API keys (NVIDIA, GitHub, Vercel, Telegram, Reddit) |

---

## Server Info

| Field | Value |
|-------|-------|
| IP | 45.58.40.219 |
| SSH | `ssh root@45.58.40.219` (pw: `4fPvrXnDx2sqGwch`) |
| Process manager | pm2 |
| Daemon process | `mvp-factory-daemon` |
| Dashboard process | `mvp-factory-dashboard` |
| Dashboard port | 3000 |

### Useful server commands
```bash
pm2 status                        # Check what's running
pm2 logs mvp-factory-daemon       # Live daemon logs
pm2 restart mvp-factory-daemon    # Restart after code changes
pm2 restart mvp-factory-dashboard
```

---

## What To Do Next

### If continuing bug fixes
1. SSH into server and check `pm2 logs mvp-factory-daemon` for errors
2. Identify the failing component (ResearchAgent / ValidationAgent / FrontendAgent / BackendAgent / PMAgent)
3. Fix in local `mvp-factory/daemon/mvp-factory-daemon-v11-multiagent.ts`
4. Push to GitHub → pull on server → `pm2 restart mvp-factory-daemon`

### If adding a new feature
1. Read `MILESTONE.md` (this file) + `README.md` first
2. Check the agent that owns that feature (see Architecture section in README)
3. Edit the daemon file locally, test logic, push + deploy

### If the daemon is down / not producing builds
1. `pm2 status` — check if processes are alive
2. `pm2 logs mvp-factory-daemon --lines 100` — look for uncaught errors
3. Check `mvp-factory/logs/` for rotated logs
4. Common culprit: API key missing from environment (daemon reads `.env` at start)

---

## Architecture (Quick Reference)

```
Two independent loops running in parallel:

LOOP 1 (every 30 min): Research → Validate → Save to queue
LOOP 2 (every 20 min): Pick from queue → Build (Frontend + Backend parallel) → Deploy
```

5 agents: **ResearchAgent (RA)** · **ValidationAgent (VA)** · **FrontendAgent (FA)** · **BackendAgent (BA)** · **PMAgent (PM)**

Generated apps use: **Next.js 14 + TailwindCSS + TypeScript**
LLM: **Kimi K2.5** via NVIDIA API (`moonshotai/kimi-k2.5`)

---

## Rules For This Repo

- **Always push to GitHub** after any code change
- Never commit `.env` or `squadron-credentials.json`
- After pushing, pull on the server and restart the relevant pm2 process
