# Dual API Key Split — Frontend Key / Backend Key

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Route FrontendAgent + UX design through the primary NVIDIA API key and BackendAgent through a dedicated second key so both can run concurrently without rate-limiting each other, then trigger one test build.

**Architecture:** `KimiClient` gets a constructor parameter for its API key, semaphore, and rate-limiter — so both instances are fully independent. A `kimiBackend` global is created beside the existing `kimi` global. `generateOneFile` gains an optional 6th `client` parameter (defaults to `kimi`). BackendAgent's 4 call-sites swap to `kimiBackend`. The new key is stored as `NVIDIA_API_KEY_2` in the server `.env` and never touches the frontend code path.

**Tech Stack:** TypeScript, Node.js, NVIDIA API (`moonshotai/kimi-k2.5`), pm2, ssh

---

## Pre-flight notes

- All edits are in `mvp-factory/daemon/mvp-factory-daemon-v11-multiagent.ts`.
- The new NVIDIA API key is: `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`
- Do NOT add it to any file that gets committed to git (`.env` is gitignored). Add only to server `.env`.
- Working directory for commits: `/c/Users/Saad/Desktop/Openclaw/mvp-factory`

---

## Task 1: Store the New API Key on the Server

**Files:**
- Modify (server only): `/root/Openclaw-repo/mvp-factory/.env`

**Step 1: Append `NVIDIA_API_KEY_2` to server `.env`**

```bash
ssh root@45.58.40.219 "echo 'NVIDIA_API_KEY_2=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' >> /root/Openclaw-repo/mvp-factory/.env"
```

**Step 2: Verify it was written**

```bash
ssh root@45.58.40.219 "grep NVIDIA_API_KEY_2 /root/Openclaw-repo/mvp-factory/.env | cut -d= -f1"
```

Expected output: `NVIDIA_API_KEY_2`

**Step 3: Also add to local `.env` for completeness**

```bash
echo 'NVIDIA_API_KEY_2=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' >> /c/Users/Saad/Desktop/Openclaw/mvp-factory/.env
```

No commit — `.env` is gitignored.

---

## Task 2: Make `KimiClient` Accept a Custom API Key

**Files:**
- Modify: `mvp-factory/daemon/mvp-factory-daemon-v11-multiagent.ts` — `KimiClient` class (lines 301-461)

**Context:** Currently `KimiClient` always reads `CONFIG.nvidia.apiKey` inside `streamComplete` and `nonStreamComplete`. We need it to be configurable so `kimiBackend` can use a different key while `kimi` keeps the primary key.

**Step 1: Read `KimiClient` class** (lines 301-462) to understand current structure.

**Step 2: Add a constructor and private `apiKey` field to `KimiClient`**

Find the class opening:
```typescript
class KimiClient {
  private maxRetries = 3;
```

Replace with:
```typescript
class KimiClient {
  private maxRetries = 3;
  private apiKey: string;
  private semaphore: ApiSemaphore;
  private rateLimiter: RateLimiter;

  constructor(apiKey?: string, semaphore?: ApiSemaphore, rateLimiter?: RateLimiter) {
    this.apiKey = apiKey || CONFIG.nvidia.apiKey;
    this.semaphore = semaphore || kimiSemaphore;
    this.rateLimiter = rateLimiter || kimiGlobalRateLimiter;
  }
```

**Important:** `ApiSemaphore` and `kimiSemaphore` are defined AFTER `KimiClient` in the file. To make the constructor default parameters work, change the constructor to NOT reference the globals in the signature — only reference them lazily. The safest approach: keep `apiKey?: string` in the constructor but leave semaphore/rateLimiter as `undefined` and resolve them at call time:

```typescript
class KimiClient {
  private maxRetries = 3;
  private readonly _apiKey: string;

  constructor(apiKey?: string) {
    this._apiKey = apiKey || '';  // empty = use CONFIG at runtime
  }

  private get apiKey(): string {
    return this._apiKey || CONFIG.nvidia.apiKey;
  }
```

**Step 3: Replace `CONFIG.nvidia.apiKey` with `this.apiKey` in both `streamComplete` and `nonStreamComplete`**

In `streamComplete` (around line 315):
```typescript
// BEFORE:
'Authorization': `Bearer ${CONFIG.nvidia.apiKey}`,
// AFTER:
'Authorization': `Bearer ${this.apiKey}`,
```

In `nonStreamComplete` (around line 390):
```typescript
// BEFORE:
'Authorization': `Bearer ${CONFIG.nvidia.apiKey}`,
// AFTER:
'Authorization': `Bearer ${this.apiKey}`,
```

**Step 4: Replace `kimiSemaphore.acquire()/release()` and `kimiGlobalRateLimiter.wait()` with instance-level equivalents**

In the `complete()` method (around lines 423-460), the calls to `kimiSemaphore.acquire()`, `kimiGlobalRateLimiter.wait()`, and `kimiSemaphore.release()` should become `this._semaphore.acquire()` etc.

Since the semaphore/rateLimiter globals are defined AFTER `KimiClient`, we can't reference them in the constructor. Use a lazy getter pattern:

```typescript
class KimiClient {
  private maxRetries = 3;
  private readonly _apiKey: string;
  private readonly _semaphore?: ApiSemaphore;
  private readonly _rateLimiter?: RateLimiter;

  constructor(apiKey?: string, semaphore?: ApiSemaphore, rateLimiter?: RateLimiter) {
    this._apiKey = apiKey || '';
    this._semaphore = semaphore;
    this._rateLimiter = rateLimiter;
  }

  private get apiKey(): string {
    return this._apiKey || CONFIG.nvidia.apiKey;
  }

  // In complete():
  // Replace:  await kimiSemaphore.acquire();
  // With:     await (this._semaphore || kimiSemaphore).acquire();
  // Replace:  kimiSemaphore.release();
  // With:     (this._semaphore || kimiSemaphore).release();
  // Replace:  await kimiGlobalRateLimiter.wait();
  // With:     await (this._rateLimiter || kimiGlobalRateLimiter).wait();
```

**Step 5: Verify** — read the modified `KimiClient` class to confirm `this.apiKey`, `this._semaphore || kimiSemaphore`, and `this._rateLimiter || kimiGlobalRateLimiter` are used throughout. The existing `const kimi = new KimiClient();` at line 464 still works with no arguments (falls back to primary key and global semaphore/rateLimiter).

**Step 6: Commit**

```bash
cd /c/Users/Saad/Desktop/Openclaw/mvp-factory
git add daemon/mvp-factory-daemon-v11-multiagent.ts
git commit -m "refactor: make KimiClient configurable with per-instance API key, semaphore, and rate limiter"
```

---

## Task 3: Add `kimiBackend` Global Instance + `CONFIG` key

**Files:**
- Modify: `mvp-factory/daemon/mvp-factory-daemon-v11-multiagent.ts`

**Step 1: Add `apiKey2` to `CONFIG.nvidia`**

Find the `CONFIG` object (around line 100):
```typescript
  nvidia: {
    apiKey: process.env.NVIDIA_API_KEY || '',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    model: 'moonshotai/kimi-k2.5',
  },
```

Replace with:
```typescript
  nvidia: {
    apiKey: process.env.NVIDIA_API_KEY || '',
    apiKey2: process.env.NVIDIA_API_KEY_2 || '',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    model: 'moonshotai/kimi-k2.5',
  },
```

**Step 2: Create a dedicated semaphore and rate limiter for the backend key**

After the existing `kimiSemaphore` and `kimiGlobalRateLimiter` declarations (around line 484-487), add:

```typescript
// Dedicated semaphore + rate limiter for the backend API key (NVIDIA_API_KEY_2)
// Fully independent from the frontend key — backend and frontend can run concurrently
const kimiBackendSemaphore = new ApiSemaphore(2);
const kimiBackendRateLimiter = new RateLimiter(5000);
```

**Step 3: Create `kimiBackend` global beside `kimi`**

After line `const kimi = new KimiClient();` (around line 464), add:

```typescript
// Backend key: used exclusively by BackendAgent so it never competes with FrontendAgent
const kimiBackend = new KimiClient(
  CONFIG.nvidia.apiKey2 || CONFIG.nvidia.apiKey,  // fallback to primary if key2 not set
  kimiBackendSemaphore,
  kimiBackendRateLimiter,
);
```

Note the fallback `|| CONFIG.nvidia.apiKey` — if `NVIDIA_API_KEY_2` is not set, `kimiBackend` gracefully falls back to the primary key. This prevents hard failures.

**Step 4: Verify** — read around line 464 to confirm `kimi` and `kimiBackend` are both declared, and around line 484 to confirm the two new globals are there.

**Step 5: Commit**

```bash
cd /c/Users/Saad/Desktop/Openclaw/mvp-factory
git add daemon/mvp-factory-daemon-v11-multiagent.ts
git commit -m "feat: add kimiBackend client with dedicated semaphore/rate-limiter for NVIDIA_API_KEY_2"
```

---

## Task 4: Wire `kimiBackend` into `BackendAgent` + `generateOneFile`

**Files:**
- Modify: `mvp-factory/daemon/mvp-factory-daemon-v11-multiagent.ts`

**Context:** BackendAgent calls `kimi.complete()` directly in 2 places, and calls `generateOneFile()` in 3 places. `generateOneFile` itself calls `kimi.complete()`. We need BackendAgent's calls to go through `kimiBackend` instead.

**Step 1: Add optional `client` parameter to `generateOneFile`**

Find the `generateOneFile` function signature (around line 526):
```typescript
async function generateOneFile(
  filePath: string,
  fileDescription: string,
  context: string,
  systemPrompt: string,
  maxTokens = 7000
): Promise<{ path: string; content: string } | null> {
```

Replace with:
```typescript
async function generateOneFile(
  filePath: string,
  fileDescription: string,
  context: string,
  systemPrompt: string,
  maxTokens = 7000,
  client: KimiClient = kimi
): Promise<{ path: string; content: string } | null> {
```

**Step 2: Replace `kimi.complete()` with `client.complete()` inside `generateOneFile`**

Inside `generateOneFile` body (around line 588):
```typescript
// BEFORE:
const response = await kimi.complete(prompt, { maxTokens, temperature: 0.2, systemPrompt });
// AFTER:
const response = await client.complete(prompt, { maxTokens, temperature: 0.2, systemPrompt });
```

And the retry call (around line 592):
```typescript
// BEFORE:
const response2 = await kimi.complete(prompt + ...);
// AFTER:
const response2 = await client.complete(prompt + ...);
```

**Step 3: Swap `BackendAgent.designBackend()` to use `kimiBackend`**

Find line ~2226 inside `BackendAgent.designBackend()`:
```typescript
const response = await kimi.complete(prompt, {
  maxTokens: 6000,
  temperature: 0.3,
  systemPrompt: '...',
});
```
Change `kimi.complete` → `kimiBackend.complete`.

**Step 4: Swap `BackendAgent.designBackendSimplified()` to use `kimiBackend`**

Find line ~2252 inside `BackendAgent.designBackendSimplified()`:
```typescript
const response = await kimi.complete(prompt, { maxTokens: 3000, temperature: 0.2 });
```
Change `kimi.complete` → `kimiBackend.complete`.

**Step 5: Swap `BackendAgent.generateBackendFiles()` route promises to pass `kimiBackend`**

Find the route generation inside `generateBackendFiles` (around line 2327):
```typescript
setTimeout(() => generateOneFile(filePath, desc, context, sysPrompt, 5000).then(...)
```
Change to:
```typescript
setTimeout(() => generateOneFile(filePath, desc, context, sysPrompt, 5000, kimiBackend).then(...)
```

Find the `typesPromise` and `utilsPromise` calls (around lines 2333-2341):
```typescript
const typesPromise = generateOneFile('src/lib/types.ts', ..., 4000);
const utilsPromise = generateOneFile('src/lib/utils.ts', ..., 4000);
```
Change both to pass `kimiBackend` as the 6th argument:
```typescript
const typesPromise = generateOneFile('src/lib/types.ts', ..., 4000, kimiBackend);
const utilsPromise = generateOneFile('src/lib/utils.ts', ..., 4000, kimiBackend);
```

**Step 6: Verify** — search for all `kimi.complete` calls inside the `BackendAgent` class (between `class BackendAgent {` and its closing `}` at ~line 2408). There should be ZERO remaining. The `generateOneFile` calls inside BackendAgent must all have `kimiBackend` as the 6th argument.

**Step 7: Confirm FrontendAgent is unchanged** — the `generateOneFile` calls in `FrontendAgent` (lines ~2030, ~2077, ~2123) should still have NO 6th argument (defaulting to `kimi`). Do not change them.

**Step 8: Commit**

```bash
cd /c/Users/Saad/Desktop/Openclaw/mvp-factory
git add daemon/mvp-factory-daemon-v11-multiagent.ts
git commit -m "feat: BackendAgent now uses kimiBackend (NVIDIA_API_KEY_2) — frontend and backend run on separate rate limits"
```

---

## Task 5: Full Sync + Restart + Verify Startup

**Step 1: Push all commits**

```bash
cd /c/Users/Saad/Desktop/Openclaw
git push origin master
```

**Step 2: Pull on server**

```bash
ssh root@45.58.40.219 "cd /root/Openclaw-repo && git pull"
```

**Step 3: Restart daemon with updated env**

```bash
ssh root@45.58.40.219 "pm2 restart mvp-daemon --update-env"
```

(`--update-env` forces pm2 to re-read the `.env` file so `NVIDIA_API_KEY_2` is picked up.)

**Step 4: Verify startup logs show the new key loaded**

```bash
ssh root@45.58.40.219 "pm2 logs mvp-daemon --lines 30 --nostream 2>/dev/null"
```

Expected: See `[Env] Loaded /root/Openclaw-repo/mvp-factory/.env` and NO TypeScript compile errors. Daemon should be `online`.

**Step 5: Confirm `NVIDIA_API_KEY_2` is in the process environment**

```bash
ssh root@45.58.40.219 "pm2 env 0 | grep NVIDIA_API_KEY_2"
```

Expected: Line showing `NVIDIA_API_KEY_2: nvapi-JJv0JuTqbfR...`

---

## Task 6: Trigger One Test Build + Monitor

**Goal:** Force one product to build from the validated queue and confirm the dual-key split, Telegram screenshots, and vision AI all work correctly.

**Step 1: Check how many validated ideas are in queue**

```bash
ssh root@45.58.40.219 "ls /root/mvp-projects/validated/ | wc -l"
```

If queue is 0: wait for the 15-minute research cycle to run, OR manually move a built idea back to validated for testing (pick any `.json` from `/root/mvp-projects/built/` and copy it to `/root/mvp-projects/validated/`).

**Step 2: Reset the daily build counter if needed**

The daemon tracks `dailyBuildCount` in memory. If it shows "Daily build cap reached (4/4)" in logs, restart the daemon (a restart resets the in-memory count to 0):

```bash
ssh root@45.58.40.219 "pm2 restart mvp-daemon --update-env"
```

**Step 3: Watch logs live**

```bash
ssh root@45.58.40.219 "pm2 logs mvp-daemon --lines 5 2>/dev/null"
```

Then wait. The build cycle fires every 5 minutes. Watch for these log lines to confirm everything works:

- `[BackendAgent] Designing backend for "..."` — backend design starting
- `[BackendAgent] Backend spec ready: X API routes` — backend design used `kimiBackend`
- `[FrontendAgent] Generated X frontend files` — frontend used primary `kimi`
- `[PlaywrightTestAgent] Screenshot: round1/home.png` — screenshots being taken
- `[PlaywrightTestAgent] [Vision] /: X/10 | Issues: Y` — vision AI running
- `[PlaywrightTestAgent] Psychology score /: X/10 — ✓ PASS or ✗ REDESIGN` — HTML eval running
- Screenshots appearing in Telegram channel — Telegram delivery working

**Step 4: Report what you see in the logs** — confirm each of the above log lines appears or explain what's missing.

---

## Summary

| Task | Change |
|------|--------|
| 1 | `NVIDIA_API_KEY_2` stored in server `.env` |
| 2 | `KimiClient` parameterized with per-instance API key, semaphore, rate-limiter |
| 3 | `kimiBackend` global created with dedicated concurrency controls |
| 4 | `BackendAgent` (3 methods + `generateOneFile` signature) wired to `kimiBackend` |
| 5 | Synced, restarted with `--update-env`, verified key is loaded |
| 6 | One test build triggered, all new features confirmed in live logs |
