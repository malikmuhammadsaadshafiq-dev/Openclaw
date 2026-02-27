# Vision QA Loop, Backend Fix & Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the broken backend stub, add NVIDIA vision AI screenshot analysis to the Playwright self-healing loop, send screenshots to Telegram, trim bloated LLM prompts, and delete the 5 most recently deployed products from Vercel and GitHub.

**Architecture:** All changes are in a single file — `mvp-factory/daemon/mvp-factory-daemon-v11-multiagent.ts` (5041 lines). We fix the route.ts stub bug (backend broken), add a `analyzeScreenshotVisually()` method using `nvidia/llama-3.2-90b-vision-instruct` (base64 PNG → NVIDIA vision API → visual design feedback), wire that into the existing `runPageTests()` / `generateAndApplyFixes()` loop, add Telegram `sendPhoto()` after each QA round, and trim ~400 lines of dead/redundant code. Deletions are handled via `gh repo delete` and Vercel REST API.

**Tech Stack:** TypeScript, Kimi K2.5 (text), `nvidia/llama-3.2-90b-vision-instruct` (vision), Playwright, Telegram Bot API, Vercel REST API, GitHub CLI (`gh`)

---

## Pre-flight: What NOT to change

- Do not change the `DAILY_BUILD_LIMIT` (4), intervals, or pm2 config.
- Do not touch `ResearchAgent`, `ValidationAgent`, or `mergeAndFinalize` unless specified.
- All edits are in `mvp-factory/daemon/mvp-factory-daemon-v11-multiagent.ts`.
- After every task: `git add daemon/mvp-factory-daemon-v11-multiagent.ts && git commit -m "..."` from `/c/Users/Saad/Desktop/Openclaw/mvp-factory/`.

---

## Task 1: Delete 5 Old Products from Vercel + GitHub

**Files:**
- No code changes. Terminal commands only.

**Step 1: Delete GitHub repos** (run on local machine, `gh` is authenticated)

```bash
gh repo delete malikmuhammadsaadshafiq-dev/web-gentle --yes
gh repo delete malikmuhammadsaadshafiq-dev/agentcircuitbreaker --yes
gh repo delete malikmuhammadsaadshafiq-dev/contract-scout --yes
gh repo delete malikmuhammadsaadshafiq-dev/stackstrategist --yes
gh repo delete malikmuhammadsaadshafiq-dev/visaloop --yes
```

**Step 2: Delete Vercel projects** — get project names from URLs (everything before the first `-` + random hash):

```bash
# Read VERCEL_TOKEN from server .env
VERCEL_TOKEN=$(ssh root@45.58.40.219 "grep VERCEL_TOKEN /root/Openclaw-repo/mvp-factory/.env | cut -d= -f2")
TEAM_ID="team_DN6tO3CT5AwBW6JyiBJ5sItw"

for project in "web-gentle" "agentcircuitbreaker" "contract-scout" "stackstrategist" "visaloop"; do
  curl -s -X DELETE \
    "https://api.vercel.com/v9/projects/${project}?teamId=${TEAM_ID}" \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    -H "Content-Type: application/json" | head -c 100
  echo ""
done
```

Expected: Each returns `{}` or `{"message":"Not Found"}` (already deleted is fine).

**Step 3: Verify repos gone**

```bash
gh repo view malikmuhammadsaadshafiq-dev/web-gentle 2>&1 | head -3
```

Expected: `Could not resolve to a Repository`

---

## Task 2: Fix the Backend Route Stub (Critical Bug)

**Problem:** `makeFileStub()` catch-all returns a React page component for `route.ts` files. Next.js API routes need `GET`/`POST` exports. This silently breaks every backend endpoint.

**Files:**
- Modify: `mvp-factory/daemon/mvp-factory-daemon-v11-multiagent.ts` around line 608 (`makeFileStub` function)

**Step 1: Read the current makeFileStub function** (lines 607-620 approx) to get exact text

**Step 2: Replace the catch-all in `makeFileStub`** — add a route.ts case BEFORE the catch-all:

Find this block (the final two returns inside `makeFileStub`):
```typescript
    return { path: filePath, content: 'export {};\n' };
  return { path: filePath, content: "export default function Page(){return<main style={{padding:'2rem'}}><h1>Loading\u2026</h1></main>;}\n" };
```

Replace with:
```typescript
    return { path: filePath, content: 'export {};\n' };
  // API route stub: exports valid Next.js route handlers so the file compiles
  if (filePath.endsWith('route.ts') || filePath.endsWith('route.tsx')) {
    return { path: filePath, content: `import { NextResponse } from 'next/server';
export async function GET() { return NextResponse.json({ status: 'ok', data: [] }); }
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({ status: 'ok', received: body });
}
` };
  }
  return { path: filePath, content: "export default function Page(){return<main style={{padding:'2rem'}}><h1>Loading\u2026</h1></main>;}\n" };
```

**Step 3: Verify the edit looks correct** — Read lines 605-625 to confirm.

**Step 4: Commit**

```bash
cd /c/Users/Saad/Desktop/Openclaw/mvp-factory
git add daemon/mvp-factory-daemon-v11-multiagent.ts
git commit -m "fix: route.ts stub now exports valid NextResponse handlers instead of Page component"
```

---

## Task 3: Fix makeRichStub — Psychology-Aware Fallback Pages

**Problem:** When `generateOneFile` times out for `page.tsx` or `dashboard/page.tsx`, `makeRichStub` produces a static generic landing page with zero psychology applied from the idea's audience profile.

**Files:**
- Modify: line ~622 (`makeRichStub` function) in the daemon

**Step 1: Find `makeRichStub`** — search for `function makeRichStub` and read ~80 lines from there.

**Step 2: Find the section that generates `page.tsx` stubs** — look for the branch that handles `filePath.endsWith('page.tsx')` or the catch-all landing page stub. It currently generates generic JSX like:
```typescript
const featureCards = features.map(...)
```

**Step 3: Replace the landing page stub section** inside `makeRichStub` to embed psychology data.

Locate the part that builds the landing `page.tsx` content. Replace the `heroSection`, `ctaHero`, and feature rendering to use `audienceProfile` data:

```typescript
// BEFORE (generic):
const heroTitle = `${title}`;
const heroSub = `${desc}`;

// AFTER (psychology-aware using audienceProfile):
const painPoint = (idea as any).audienceProfile?.painPoints?.[0] || desc;
const motivation = (idea as any).audienceProfile?.motivations?.[0] || features[0] || '';
const techSavvy = (idea as any).audienceProfile?.techSavviness || 'medium';
const heroTitle = painPoint.length > 10
  ? `Stop ${painPoint.toLowerCase().slice(0, 60)}`
  : `The smarter way to ${features[0]?.toLowerCase() || title.toLowerCase()}`;
const heroSub = motivation
  ? `Join thousands of ${(idea as any).targetUsers || 'users'} who ${motivation.toLowerCase()}`
  : `${desc}`;
const socialProof = `<p className="text-sm text-gray-500 mt-4">⭐ Trusted by 2,400+ ${(idea as any).targetUsers || 'users'}</p>`;
const lossAversion = `<div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 text-amber-800 text-sm">⚠️ Without this: ${painPoint.slice(0, 80)}</div>`;
```

Add those elements into the generated JSX (hero section and below the CTA).

**Step 4: Verify by reading the updated function** — confirm `painPoints`, `motivations`, and `targetUsers` are referenced.

**Step 5: Commit**

```bash
git add daemon/mvp-factory-daemon-v11-multiagent.ts
git commit -m "fix: makeRichStub landing page uses audience painPoints/motivations for psychology-aware fallback"
```

---

## Task 4: Remove Dead Code — Mobile Builder, Redundant Context

**Problem:** `generateMobileFiles()` is a 50-line method that is permanently disabled (all mobile → reclassified to web). The research prompt references 55 subreddits in a long list. Various prompts have duplicate instructions across `context` and `systemPrompt`.

**Files:**
- Modify: `mvp-factory/daemon/mvp-factory-daemon-v11-multiagent.ts`

**Step 1: Remove `generateMobileFiles` method** (lines ~1969-2018)

Find the method:
```typescript
private async generateMobileFiles(idea: ValidatedIdea, spec: FrontendSpec)
```
Delete the entire method body (~50 lines). The caller at line ~2026 already has:
```typescript
if (idea.type === 'mobile') {
  return this.generateMobileFiles(idea, spec);
}
```
Also remove that `if` block since mobile is reclassified before reaching FrontendAgent.

**Step 2: Trim the `designUX` prompt** (around line 1832)

The prompt has a 5-item bulleted "audience mapping" section that repeats what's already in the JSON output format. Remove the bullets under "DESIGN SYSTEM" (lines like `- Tech-savvy devs? Use dark theme...`) — the LLM already knows this. Keep only the field descriptions in the JSON schema. Saves ~150 tokens per call.

**Step 3: Trim the `designBackend` prompt** (around line 2221)

The conditional blocks for `ai-assisted`, `utility`, `automation` repeat instructions already in `sysPrompt`. Remove the inner `${}` conditional blocks and consolidate into two sentences in the main prompt. Saves ~200 tokens per call.

**Step 4: Trim `evaluateDesignPsychology` prompt** (around line 2713)

The scoring criteria examples are very long. Each criterion has a multi-line explanation. Shorten each to one line — keep the name and point value, remove the sub-bullets. Saves ~300 tokens per call.

**Step 5: Commit**

```bash
git add daemon/mvp-factory-daemon-v11-multiagent.ts
git commit -m "refactor: remove dead mobile code, trim ~650 tokens from design/backend/eval prompts"
```

---

## Task 5: Add Vision AI Screenshot Analysis

**Goal:** After taking a screenshot, send it to `nvidia/llama-3.2-90b-vision-instruct` as a base64 PNG and get structured visual feedback (not just HTML analysis). This gives the self-healing loop real visual information: wrong colors, blank sections, generic copy, missing psychology elements visible in the rendered image.

**Files:**
- Modify: `PlaywrightTestAgent` class in the daemon (around line 2487)

**Step 1: Add `analyzeScreenshotVisually()` method** inside `PlaywrightTestAgent` class, AFTER the `evaluateDesignPsychology` method (around line 2782):

```typescript
/**
 * Send a screenshot PNG to NVIDIA vision model and get visual design feedback.
 * Returns structured assessment of what visually looks wrong/generic.
 */
private async analyzeScreenshotVisually(
  screenshotPath: string,
  route: string,
  idea: ValidatedIdea
): Promise<{ visualScore: number; visualIssues: string[]; visualFixes: string[] }> {
  try {
    const imgBuffer = await fs.readFile(screenshotPath);
    const base64 = imgBuffer.toString('base64');
    const ap = idea.audienceProfile;

    const visionPrompt = `You are a UX design critic reviewing a screenshot of a web app.

PRODUCT: ${idea.title}
PAGE: ${route === '/' ? 'Landing page' : route.slice(1) + ' page'}
TARGET AUDIENCE: ${idea.targetUsers}
- Tech level: ${ap.techSavviness}
- Pain: ${ap.painPoints[0] || 'unknown'}
- Motivation: ${ap.motivations[0] || 'unknown'}

Look at the screenshot and score it 1-10 on VISUAL DESIGN QUALITY.

Report:
1. Is the hero headline specific to this audience's pain, or generic?
2. Are psychology tactics VISIBLE? (social proof counters, urgency, free value, trust badges)
3. Does the color palette match the audience (${ap.techSavviness} tech, ${ap.priceWillingness} price willingness)?
4. Are there any blank/empty sections?
5. Does the layout look professional and complete, or like an AI skeleton?

Return ONLY valid JSON:
{
  "visualScore": <1-10>,
  "issues": ["specific visible problem 1", "specific visible problem 2", ...],
  "fixes": ["Rewrite H1 to: '...'", "Add social proof counter showing X users", ...]
}`;

    const payload = {
      model: 'nvidia/llama-3.2-90b-vision-instruct',
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:image/png;base64,${base64}` } },
          { type: 'text', text: visionPrompt },
        ],
      }],
      max_tokens: 1500,
      temperature: 0.2,
    };

    const resp = await fetch(`${CONFIG.nvidia.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.nvidia.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      await logger.agent(this.name, `Vision API error ${resp.status} — skipping visual analysis`);
      return { visualScore: 5, visualIssues: [], visualFixes: [] };
    }

    const data = await resp.json() as any;
    const content = data.choices?.[0]?.message?.content || '';
    const parsed = extractJSON(content, 'object');

    if (!parsed || typeof parsed.visualScore !== 'number') {
      return { visualScore: 5, visualIssues: [], visualFixes: [] };
    }

    return {
      visualScore: Math.min(10, Math.max(1, Math.round(parsed.visualScore))),
      visualIssues: parsed.issues || [],
      visualFixes: parsed.fixes || [],
    };
  } catch (err) {
    await logger.agent(this.name, `Visual analysis error: ${String(err).slice(0, 100)}`);
    return { visualScore: 5, visualIssues: [], visualFixes: [] };
  }
}
```

**Step 2: Wire `analyzeScreenshotVisually` into `runPageTests`**

After the screenshot is saved (around line 2636), add the visual analysis call. Find this block:

```typescript
await page.screenshot({ path: path.join(screenshotDir, `${slug}.png`), fullPage: true });
await logger.agent(this.name, `Screenshot: round${round}/${slug}.png (HTTP ${httpStatus})`);
```

Add AFTER those two lines:

```typescript
// Visual AI analysis — only on round 1 for key pages (avoid excess API calls)
if (round === 1 && (route === '/' || route === '/dashboard')) {
  const screenshotFilePath = path.join(screenshotDir, `${slug}.png`);
  const visual = await this.analyzeScreenshotVisually(screenshotFilePath, route, idea);
  await logger.agent(this.name, `  Visual AI score ${route}: ${visual.visualScore}/10`);
  if (visual.visualScore < 6 && visual.visualIssues.length > 0) {
    // Merge visual feedback into issues (issueType: design-quality)
    issues.push({
      route,
      httpStatus,
      consoleErrors: [],
      networkErrors: [],
      pageTextSnippet: pageText.slice(0, 600),
      loadError: '',
      hasErrorText: false,
      isBlank: false,
      issueType: 'design-quality',
      designScore: visual.visualScore,
      designIssues: visual.visualIssues,
      designImprovements: visual.visualFixes,
    });
  }
}
```

**Step 3: Update `generateAndApplyFixes` to use visual feedback in fix prompts**

In the design issues fix section (around line 2858), find where `designImprovements` are listed. Add the visual fixes to the fix generation prompt alongside the HTML-based improvements:

```typescript
const allImprovements = [
  ...(issue.designImprovements || []),
  // visual analysis fixes (if any) are already merged into designImprovements above
];
```

This is already correct since we push visual feedback as `designImprovements` — no change needed here.

**Step 4: Verify `analyzeScreenshotVisually` is inside the class braces** — it must be between `evaluateDesignPsychology` closing `}` and `generateAndApplyFixes` opening line.

**Step 5: Commit**

```bash
git add daemon/mvp-factory-daemon-v11-multiagent.ts
git commit -m "feat: add NVIDIA vision AI screenshot analysis to Playwright QA loop"
```

---

## Task 6: Send Screenshots to Telegram After Each QA Round

**Goal:** After each Playwright QA round, send all screenshots to the Telegram channel so the builder can see how the product looks visually.

**Files:**
- Modify: `PlaywrightTestAgent.runPageTests()` return path, and `testAndImprove()` loop body

**Step 1: Add `sendScreenshotsToTelegram()` helper method** inside `PlaywrightTestAgent` class, after `analyzeScreenshotVisually`:

```typescript
/** Send all screenshots from a round to Telegram for human review */
private async sendScreenshotsToTelegram(
  screenshotDir: string,
  round: number,
  idea: ValidatedIdea,
  issues: PageIssue[]
): Promise<void> {
  if (!CONFIG.telegram.botToken || !CONFIG.telegram.chatId) return;

  try {
    const files = await fs.readdir(screenshotDir).catch(() => [] as string[]);
    const pngs = files.filter(f => f.endsWith('.png'));

    for (const png of pngs) {
      const route = png.replace('.png', '').replace('auth', '/auth').replace('dashboard', '/dashboard').replace('home', '/');
      const issue = issues.find(i => (i.route === '/' ? 'home' : i.route.replace(/\//g, '-').replace(/^-/, '')) === png.replace('.png', ''));
      const designScore = issue?.designScore;
      const httpStatus = issue?.httpStatus || 200;

      const caption = [
        `🖼 *${idea.title}* — Round ${round} — \`${route}\``,
        `HTTP: ${httpStatus} | Issues: ${issues.filter(i => i.route === route).length}`,
        designScore !== undefined ? `Psychology score: ${designScore}/10` : '',
      ].filter(Boolean).join('\n');

      const imgPath = `${screenshotDir}/${png}`;
      const imgBuffer = await fs.readFile(imgPath);
      const form = new FormData();
      form.append('chat_id', CONFIG.telegram.chatId);
      form.append('caption', caption);
      form.append('parse_mode', 'Markdown');
      form.append('photo', new Blob([imgBuffer], { type: 'image/png' }), png);

      await fetch(`https://api.telegram.org/bot${CONFIG.telegram.botToken}/sendPhoto`, {
        method: 'POST',
        body: form,
      });

      await new Promise(r => setTimeout(r, 500)); // small gap between sends
    }
  } catch (err) {
    await logger.agent(this.name, `Telegram screenshot send error: ${String(err).slice(0, 100)}`);
  }
}
```

**Step 2: Call `sendScreenshotsToTelegram` inside `testAndImprove`** — after `runPageTests()` returns:

Find in `testAndImprove()`:
```typescript
const issues = await this.runPageTests(currentUrl, idea, screenshotBase, round);
```

Add AFTER that line:
```typescript
// Send screenshots to Telegram for human visual review
const roundScreenshotDir = path.join(screenshotBase, `round${round}`);
await this.sendScreenshotsToTelegram(roundScreenshotDir, round, idea, issues);
```

**Step 3: Raise psychology score threshold from 5 to 6**

Find in `runPageTests()`:
```typescript
const verdict = designEval.score >= 5 ? '✓ PASS' : '✗ REDESIGN';
await logger.agent(this.name, `  Psychology score ${route}: ${designEval.score}/10 — ${verdict}`);
if (designEval.score < 5) {
```

Change both occurrences of `5` → `6`:
```typescript
const verdict = designEval.score >= 6 ? '✓ PASS' : '✗ REDESIGN';
await logger.agent(this.name, `  Psychology score ${route}: ${designEval.score}/10 — ${verdict}`);
if (designEval.score < 6) {
```

**Step 4: Commit**

```bash
git add daemon/mvp-factory-daemon-v11-multiagent.ts
git commit -m "feat: send screenshots to Telegram after each QA round, raise psychology threshold to 6"
```

---

## Task 7: Improve Psychology in Frontend — Stronger Prompt Enforcement

**Goal:** Make the psychology tactics apply more forcefully. The current prompts say "embed EVERY one" but Kimi K2.5 can ignore this. Add explicit per-tactic HTML requirements.

**Files:**
- Modify: `FrontendAgent.generateSaasFrontend()` and `generateWebAppFrontend()` — the `fileDefs` for `dashboard/page.tsx`

**Step 1: In `generateSaasFrontend`, find the `dashboard/page.tsx` fileDef** (around line 2119) and verify its `desc` field ends with something like `"Fully responsive with mobile sidebar."`.

**Step 2: Strengthen the dashboard desc** — append to its description:

```
MANDATORY PSYCHOLOGY ELEMENTS — must appear as actual rendered HTML in this file:
1. Social proof: a counter div showing "2,400+ ${idea.targetUsers} use this"
2. Loss aversion: a banner/callout showing what happens without the tool
3. Progress indicator: a completion % or streak tracker showing user engagement
4. Reciprocity: a "Try free" or "Free tier includes X" highlighted section
All must be visible above the fold or in the main content area. No fake imports.
```

This makes psychology non-negotiable in the LLM output.

**Step 3: In `generateWebAppFrontend`, find the `src/app/page.tsx` fileDef** and similarly append:

```
MANDATORY VISIBLE ELEMENTS:
1. H1 must reference "${painPoint.slice(0, 50)}" — NOT a generic headline
2. Include a social proof number: "X ${idea.targetUsers} already use this"
3. Include a loss aversion callout: "Without this, you risk: [pain point]"
4. CTA button text must be audience-specific (not "Get Started")
```

**Step 4: Commit**

```bash
git add daemon/mvp-factory-daemon-v11-multiagent.ts
git commit -m "feat: mandate specific psychology HTML elements in dashboard and landing page prompts"
```

---

## Task 8: Full Sync to Server and Restart

**Step 1: Push all commits to GitHub**

```bash
cd /c/Users/Saad/Desktop/Openclaw
git push origin master
```

**Step 2: Pull on server**

```bash
ssh root@45.58.40.219 "cd /root/Openclaw-repo && git pull"
```

**Step 3: Restart daemon**

```bash
ssh root@45.58.40.219 "pm2 restart mvp-daemon"
```

**Step 4: Verify daemon is running with new code**

```bash
ssh root@45.58.40.219 "pm2 logs mvp-daemon --lines 20 --nostream"
```

Expected: See log lines with `[Env] Loaded` and no TypeScript errors. Daemon should be `online`.

**Step 5: Verify fix by checking one backend route file in a recent project** (optional sanity check)

```bash
ssh root@45.58.40.219 "find /root/mvp-projects/web -name 'route.ts' | head -3 | xargs grep -l 'NextResponse' | head -3"
```

Expected: Lines with `NextResponse` — confirms the stub fix is in effect for new builds.

---

## Summary of All Changes

| Task | What | Impact |
|------|------|--------|
| 1 | Delete 5 Vercel projects + 5 GitHub repos | Cleans up old deployments |
| 2 | Fix `makeFileStub` → proper API route stub | Backend endpoints stop returning 404 |
| 3 | Fix `makeRichStub` → psychology-aware fallback | Fallback pages use pain points + social proof |
| 4 | Remove dead mobile code, trim prompts ~650 tokens | Faster builds, less noise |
| 5 | Add NVIDIA vision AI screenshot analysis | Playwright loop sees actual rendered visuals |
| 6 | Send screenshots to Telegram, threshold 5→6 | You can see every page after each QA round |
| 7 | Mandate psychology HTML elements in prompts | LLM can't ignore psychology tactics |
| 8 | Sync and restart | All fixes live on server |
