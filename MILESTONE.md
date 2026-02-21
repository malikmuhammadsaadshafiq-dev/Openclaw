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

### Latest Fix (2026-02-21) — Per-File Parallel Generation (BREAKTHROUGH)

**Root cause confirmed:** `enable_thinking: false` is NOT respected by NVIDIA's Kimi K2.5 endpoint.
Thinking tokens consumed ~15K/20K of every code gen call → only 5K left for actual code → 1 file max.

**Key fix — Per-file parallel generation (`generateOneFile` helper):**
- Instead of 1 big LLM call asking for ALL files → N parallel calls asking for 1 file each
- Each call: simpler task → less thinking → 2K-4K tokens for actual code → 1 complete file
- All files generated in parallel → same wall-clock time (~9 min vs 23 min that failed)

**Observed build results (Backup Boss, 2026-02-21):**
| Metric | Before | After |
|--------|--------|-------|
| Frontend files | 1 (out of 6) | **6** ✓ |
| Backend files | 0 (out of 12) | **12** ✓ |
| Total files written | 1 | **25** ✓ |
| Quality gate | N/A | 18/20 ✓ |
| GitHub repo | None | Created ✓ |
| Vercel build | N/A | Failed (1 file had thinking text) |

**Second fix — Thinking text detection in `generateOneFile`:**
- Kimi sometimes outputs thinking reasoning ("The user wants...", "Let me...") as file content
- Fix: detect non-code first line → find first real code line (import/export/const/etc.) → extract from there
- If entire response is thinking text → return null → file skipped → retry once

**Build timeline (per-file approach, measured):**
- Design (both agents): ~10 min
- Code gen (all files parallel): ~9 min
- Integration repair (dashboard only): ~10 min
- Deploy (GitHub + Vercel): ~5 min
- **Total: ~34 min** ← well within 55-min timeout

**Current state (as of 18:44 UTC):**
- GhostMode Audit (7.7/10) ← BUILDING NOW
- Backup Boss (7.7/10) ← built, GitHub created, Vercel build failed (thinking text issue fixed)
- GLP1Plate is on hold (`/root/mvp-projects/validated/5dabf2b6-*.json.hold`)
- 72 ideas in queue ready to build

---

### Fix (2026-02-21) — GLP1Plate over-complexity + 25-min build timeout (older)

**Problem:** GLP1Plate (7 features, freemium, Firebase) was too complex for a single LLM call:
- UX design alone took 35 minutes (timeout fires at 25 min → instant fail before file generation)
- Frontend code generation used heaviest generator (28K tokens, 8+ pages)
- Fail count never incremented (separate bug — now fixed) so it looped for 7+ hours

**Fixes applied:**
1. **25-minute hard build timeout** — `Promise.race` in `runBuildFromQueue`; on timeout, `recordFailure` fires, pipeline moves on. Prevents any single build freezing the system.
2. **Simplified GLP1Plate in queue** — 7 features → 3 core (barcode scan, portion calc, meal planner); `freemium` → `free_ads`; removed Firebase. UX design now takes 4 min instead of 35.
3. **Fail tracker reset** — gave GLP1Plate 3 fresh attempts as a simpler web app.
4. **`recordFailure()` was never called** — defined but had zero call sites; fail count stayed 0 forever → same idea re-selected every cycle. Now called in catch block.

**Result:** GLP1Plate is now building as a clean `free_ads` Next.js utility (6 files, 25K tokens).

---

### Fix (2026-02-21) — No mobile apps + old GLP1Plate loop

**Decision:** Mobile apps (`type: "mobile"`, React Native/Expo) are permanently disabled from the pipeline.
**Reasons:**
- Mobile generation requires 20K-32K tokens (8 complex TypeScript files) → JSON gets truncated mid-string, unparseable
- No Expo build infrastructure on the server — even if files generate, they can't be deployed
- Can't validate the app works (no headless runner)
- Web apps serve the same ideas better and deploy to Vercel in seconds

**What was done:**
1. Removed `mobile` from valid type options in ValidationAgent prompt
2. Added runtime guard: any `mobile` idea that slips through gets reclassified to `web` at build time
3. Reclassified 11 existing mobile items in validated queue (GLP1Plate + 10 others) → `web`
4. Fixed root cause of 7-hour GLP1Plate loop: `recordFailure()` was defined but never called — fail count stayed 0 forever → same idea re-selected every cycle
5. Increased mobile file gen `maxTokens` 10K → 32K (fallback safety, now irrelevant since mobile is disabled)

---

### Fix (2026-02-21) — BackendAgent placeholder data
**Root cause:** FrontendAgent and BackendAgent ran in parallel with NO shared context.
Frontend invented API route paths (`/api/analyze`) that never matched what backend generated
(`/api/monitor-asin`, `/api/check-listing`). Resulted in: placeholder demo data everywhere,
forms that did nothing, features completely non-functional (e.g. HijackSentry ASIN input).

**Fix applied:**
- Added `repairFrontendBackendIntegration()` to PMAgent (PHASE 4b)
- After both agents finish, reads EXACT routes from `backendSpec.apiRoutes` (path + input/output schemas)
- Uses Kimi K2.5 to rewrite each interactive `page.tsx` to call those real routes with correct bodies
- Runs in both `runFullPipeline` and `runBuildFromQueue`
- Also fixed SaaS/WebApp frontend prompts to ban hardcoded data and require real fetch() calls
- Server pm2 process name is `mvp-daemon` (not `mvp-factory-daemon`)

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
| Daemon process | `mvp-daemon` |
| Dashboard process | `mvp-factory-dashboard` |
| Dashboard port | 3000 |

### Useful server commands
```bash
pm2 status                        # Check what's running
pm2 logs mvp-daemon               # Live daemon logs
pm2 restart mvp-daemon            # Restart after code changes
pm2 restart mvp-factory-dashboard
```

---

## What To Do Next

### If continuing bug fixes
1. SSH into server and check `pm2 logs mvp-daemon` for errors
2. Identify the failing component (ResearchAgent / ValidationAgent / FrontendAgent / BackendAgent / PMAgent)
3. Fix in local `mvp-factory/daemon/mvp-factory-daemon-v11-multiagent.ts`
4. Push to GitHub → pull on server → `pm2 restart mvp-daemon`

### CRITICAL: Token Budget + Timeout Calibration
- Kimi K2.5 streams at ~14 tokens/sec (includes thinking tokens)
- `enable_thinking: false` is NOT respected by NVIDIA's endpoint — thinking always runs
- Current build timeout: **55 minutes**
- Per-file calls: 7K tokens each, all parallel → ~9 min code gen
- DO NOT switch back to single large calls (20K+) — they produce only 1 file due to thinking mode
- DO NOT reduce per-file budgets below 6K or files may be truncated

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
