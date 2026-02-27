# Psychology-Driven Frontend Design - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace hardcoded frontend design colors with a 2-stage LLM pipeline that generates psychology-driven, audience-specific designs.

**Architecture:** Two lightweight Kimi K2.5 API calls (~2.5K tokens each) replace the bypassed 8K-token `designUX()` call. Stage 1 analyzes psychology + picks colors. Stage 2 picks typography + tactics. Fallback palettes ensure variety even on LLM failure.

**Tech Stack:** TypeScript, Kimi K2.5 via NVIDIA NIM API, existing `kimi.complete()` client

---

## Task 1: Add Fallback Palettes Constant

**Files:**
- Modify: `mvp-factory/daemon/mvp-factory-daemon-v11-multiagent.ts:193` (after `FrontendSpec` interface)

**Step 1: Add the fallback palettes array**

Insert after line 213 (after `accessibilityLevel` in `FrontendSpec` interface), before line 215:

```typescript
// ============================================================
// Fallback Design Palettes (used when LLM calls fail)
// Cycles based on idea.id hash to ensure variety
// ============================================================
const FALLBACK_PALETTES = [
  { primary: '#059669', secondary: '#F59E0B', accent: '#DC2626', background: '#FAFAFA', aesthetic: 'professional' as const, font: 'Outfit' },
  { primary: '#7C3AED', secondary: '#EC4899', accent: '#F59E0B', background: '#0F0F0F', aesthetic: 'bold' as const, font: 'Space Grotesk' },
  { primary: '#0891B2', secondary: '#84CC16', accent: '#F97316', background: '#F0FDFA', aesthetic: 'soft' as const, font: 'Nunito' },
  { primary: '#DC2626', secondary: '#1D4ED8', accent: '#FBBF24', background: '#FFFFFF', aesthetic: 'bold' as const, font: 'DM Sans' },
  { primary: '#4F46E5', secondary: '#10B981', accent: '#F472B6', background: '#F8FAFC', aesthetic: 'minimal' as const, font: 'Lexend' },
  { primary: '#0F172A', secondary: '#38BDF8', accent: '#22D3EE', background: '#020617', aesthetic: 'dark-tech' as const, font: 'Sora' },
  { primary: '#16A34A', secondary: '#8B5CF6', accent: '#EF4444', background: '#ECFDF5', aesthetic: 'soft' as const, font: 'Quicksand' },
  { primary: '#EA580C', secondary: '#0EA5E9', accent: '#A855F7', background: '#FFF7ED', aesthetic: 'playful' as const, font: 'Poppins' },
];

function getFallbackPalette(ideaId: string): typeof FALLBACK_PALETTES[0] {
  // Simple hash to pick a palette based on idea ID
  let hash = 0;
  for (let i = 0; i < ideaId.length; i++) {
    hash = ((hash << 5) - hash) + ideaId.charCodeAt(i);
    hash = hash & hash;
  }
  return FALLBACK_PALETTES[Math.abs(hash) % FALLBACK_PALETTES.length];
}
```

**Step 2: Verify syntax**

Run: `cd /c/Users/Saad/Desktop/Openclaw/mvp-factory && npx tsc --noEmit daemon/mvp-factory-daemon-v11-multiagent.ts 2>&1 | head -20`

Expected: No errors (or existing unrelated errors only)

**Step 3: Commit**

```bash
git add mvp-factory/daemon/mvp-factory-daemon-v11-multiagent.ts
git commit -m "feat: add fallback design palettes for variety when LLM fails"
```

---

## Task 2: Add Stage 1 - analyzeAudiencePsychology Method

**Files:**
- Modify: `mvp-factory/daemon/mvp-factory-daemon-v11-multiagent.ts` (inside `FrontendAgent` class, after line 1847)

**Step 1: Add the DesignPsychology interface**

Insert after line 213 (near other interfaces), before the FALLBACK_PALETTES:

```typescript
interface DesignPsychology {
  emotionalState: string;
  primaryFear: string;
  primaryDesire: string;
  trustLevel: 'low' | 'medium' | 'high';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    reasoning: string;
  };
  aesthetic: 'minimal' | 'bold' | 'soft' | 'professional' | 'playful' | 'dark-tech';
}
```

**Step 2: Add analyzeAudiencePsychology method**

Insert inside `FrontendAgent` class, after the `run()` method (after line 1847):

```typescript
  private async analyzeAudiencePsychology(idea: ValidatedIdea): Promise<DesignPsychology | null> {
    const prompt = `Analyze audience psychology and select colors for a ${idea.type} product targeting ${idea.targetUsers}.

PAIN: ${idea.audienceProfile?.painPoints?.[0] || idea.description}
DESIRE: ${idea.audienceProfile?.motivations?.[0] || 'solve their problem'}
TECH LEVEL: ${idea.audienceProfile?.techSavviness || 'medium'}
PRICE TOLERANCE: ${idea.audienceProfile?.priceWillingness || 'medium'}

Return ONLY JSON:
{
  "emotionalState": "anxious|frustrated|curious|hopeful|skeptical|overwhelmed",
  "primaryFear": "specific fear for THIS audience",
  "primaryDesire": "specific desire for THIS audience",
  "trustLevel": "low|medium|high",
  "colors": {
    "primary": "#hex - main brand color",
    "secondary": "#hex - supporting color",
    "accent": "#hex - CTAs and highlights",
    "background": "#hex - page background (light or dark)",
    "reasoning": "1 sentence why these colors for THIS audience"
  },
  "aesthetic": "minimal|bold|soft|professional|playful|dark-tech"
}

RULES:
- NO blue (#3B82F6) or indigo (#6366F1) unless psychology demands it
- Match colors to emotional state (anxious=calming greens/blues, frustrated=energizing oranges, skeptical=trustworthy blues/greens)
- Background should be light (#F... or #FFF...) unless audience prefers dark mode (tech/dev users)`;

    try {
      const response = await kimi.complete(prompt, {
        maxTokens: 2000,
        temperature: 0.7,
        systemPrompt: 'You are a color psychology expert. Return ONLY valid JSON. Be specific to this audience, not generic.',
      });
      const parsed = extractJSON(response, 'object') as DesignPsychology | null;
      if (parsed?.colors?.primary && parsed?.aesthetic) {
        await logger.agent(this.name, `Psychology: ${parsed.emotionalState} audience, ${parsed.aesthetic} aesthetic, primary=${parsed.colors.primary}`);
        return parsed;
      }
      return null;
    } catch (err) {
      await logger.agent(this.name, `Psychology analysis failed: ${String(err).slice(0, 100)}`);
      return null;
    }
  }
```

**Step 3: Verify syntax**

Run: `cd /c/Users/Saad/Desktop/Openclaw/mvp-factory && npx tsc --noEmit daemon/mvp-factory-daemon-v11-multiagent.ts 2>&1 | head -20`

**Step 4: Commit**

```bash
git add mvp-factory/daemon/mvp-factory-daemon-v11-multiagent.ts
git commit -m "feat: add Stage 1 analyzeAudiencePsychology for color selection"
```

---

## Task 3: Add Stage 2 - designTypographyAndTactics Method

**Files:**
- Modify: `mvp-factory/daemon/mvp-factory-daemon-v11-multiagent.ts` (inside `FrontendAgent` class)

**Step 1: Add TypographyAndTactics interface**

Insert after `DesignPsychology` interface:

```typescript
interface TypographyAndTactics {
  typography: {
    fontFamily: string;
    headingWeight: string;
    bodyWeight: string;
    borderRadius: string;
    spacing: 'compact' | 'normal' | 'generous';
  };
  tactics: Array<{
    name: string;
    implementation: string;
  }>;
}
```

**Step 2: Add designTypographyAndTactics method**

Insert inside `FrontendAgent` class, after `analyzeAudiencePsychology`:

```typescript
  private async designTypographyAndTactics(idea: ValidatedIdea, psychology: DesignPsychology): Promise<TypographyAndTactics | null> {
    const prompt = `Design typography and psychology tactics for "${idea.title}" targeting ${idea.targetUsers}.

PSYCHOLOGY PROFILE:
- Emotional state: ${psychology.emotionalState}
- Fear: ${psychology.primaryFear}
- Desire: ${psychology.primaryDesire}
- Trust level: ${psychology.trustLevel}
- Aesthetic: ${psychology.aesthetic}

Return ONLY JSON:
{
  "typography": {
    "fontFamily": "Google Font name (NOT Inter, NOT JetBrains Mono - pick something fresh)",
    "headingWeight": "600|700|800",
    "bodyWeight": "400|500",
    "borderRadius": "4px|8px|12px|16px|20px",
    "spacing": "compact|normal|generous"
  },
  "tactics": [
    {"name": "loss aversion", "implementation": "exact text/element to show"},
    {"name": "social proof", "implementation": "exact counter text"},
    {"name": "reciprocity", "implementation": "exact free value offer"},
    {"name": "authority", "implementation": "exact trust signal"}
  ]
}

TYPOGRAPHY RULES:
- anxious/overwhelmed → rounded fonts (Nunito, Quicksand, Varela Round), generous spacing, 16px+ radius
- professional/skeptical → clean fonts (Outfit, DM Sans, Plus Jakarta Sans), normal spacing, 8px radius
- playful/curious → friendly fonts (Poppins, Lexend, Rubik), medium spacing, 12px radius
- tech/analytical → modern fonts (Space Grotesk, Sora, Manrope), compact spacing, 4-6px radius

TACTICS must be SPECIFIC to ${idea.targetUsers} - include real numbers, specific fears, exact value props.`;

    try {
      const response = await kimi.complete(prompt, {
        maxTokens: 2000,
        temperature: 0.7,
        systemPrompt: 'You are a UX typography expert. Return ONLY valid JSON. Tactics must be specific, not generic placeholders.',
      });
      const parsed = extractJSON(response, 'object') as TypographyAndTactics | null;
      if (parsed?.typography?.fontFamily && parsed?.tactics?.length) {
        await logger.agent(this.name, `Typography: ${parsed.typography.fontFamily}, ${parsed.typography.spacing} spacing, ${parsed.tactics.length} tactics`);
        return parsed;
      }
      return null;
    } catch (err) {
      await logger.agent(this.name, `Typography design failed: ${String(err).slice(0, 100)}`);
      return null;
    }
  }
```

**Step 3: Verify syntax**

Run: `cd /c/Users/Saad/Desktop/Openclaw/mvp-factory && npx tsc --noEmit daemon/mvp-factory-daemon-v11-multiagent.ts 2>&1 | head -20`

**Step 4: Commit**

```bash
git add mvp-factory/daemon/mvp-factory-daemon-v11-multiagent.ts
git commit -m "feat: add Stage 2 designTypographyAndTactics for fonts and conversion tactics"
```

---

## Task 4: Add buildFrontendSpec Helper Method

**Files:**
- Modify: `mvp-factory/daemon/mvp-factory-daemon-v11-multiagent.ts` (inside `FrontendAgent` class)

**Step 1: Add buildFrontendSpec method**

Insert inside `FrontendAgent` class, after `designTypographyAndTactics`:

```typescript
  private buildFrontendSpec(
    idea: ValidatedIdea,
    psychology: DesignPsychology | null,
    typography: TypographyAndTactics | null
  ): FrontendSpec {
    // Use LLM results or fallback palette
    const fallback = getFallbackPalette(idea.id);
    const colors = psychology?.colors || {
      primary: fallback.primary,
      secondary: fallback.secondary,
      accent: fallback.accent,
      background: fallback.background,
      reasoning: 'Fallback palette based on idea hash',
    };
    const aesthetic = psychology?.aesthetic || fallback.aesthetic;
    const font = typography?.typography?.fontFamily || fallback.font;
    const radius = typography?.typography?.borderRadius || '12px';
    const isDarkBg = colors.background.startsWith('#0') || colors.background.startsWith('#1') || colors.background.startsWith('#2');

    // Build psychology tactics from LLM or generate sensible defaults
    const tactics = typography?.tactics?.length
      ? typography.tactics.map(t => `${t.name}: ${t.implementation}`)
      : [
          `Loss aversion: show cost of NOT solving "${idea.audienceProfile?.painPoints?.[0] || idea.description}"`,
          `Reciprocity: give immediate free value — let users try ${idea.features[0]} before signup`,
          `Social proof: show how many ${idea.targetUsers} already use this`,
          `Authority: display credentials relevant to ${idea.targetUsers}`,
        ];

    return {
      designSystem: {
        primaryColor: colors.primary,
        secondaryColor: colors.secondary,
        fontFamily: font,
        borderRadius: radius,
        darkMode: isDarkBg,
        style: aesthetic === 'dark-tech' ? 'tech' : aesthetic === 'soft' ? 'minimal' : aesthetic as any,
      },
      uxPatterns: ['Progressive disclosure', 'Immediate value demo', 'Minimal onboarding'],
      conversionElements: ['Free trial CTA', 'Feature comparison', 'Social proof'],
      pages: [
        { route: '/', purpose: 'Landing + demo', components: ['Hero', 'Demo', 'Features', 'CTA'], userFlow: 'Land -> See value -> Try demo -> Sign up' },
        { route: '/dashboard', purpose: 'Main workspace', components: ['Sidebar', 'MainContent', 'ActionBar'], userFlow: 'Navigate -> Use features -> See results' },
      ],
      psychologyTactics: tactics,
      accessibilityLevel: 'AA',
    };
  }
```

**Step 2: Verify syntax**

Run: `cd /c/Users/Saad/Desktop/Openclaw/mvp-factory && npx tsc --noEmit daemon/mvp-factory-daemon-v11-multiagent.ts 2>&1 | head -20`

**Step 3: Commit**

```bash
git add mvp-factory/daemon/mvp-factory-daemon-v11-multiagent.ts
git commit -m "feat: add buildFrontendSpec to merge LLM results with fallbacks"
```

---

## Task 5: Replace Hardcoded Block in run() Method

**Files:**
- Modify: `mvp-factory/daemon/mvp-factory-daemon-v11-multiagent.ts:1806-1836`

**Step 1: Replace the hardcoded design block**

Replace lines 1806-1836 (the entire block with `// Step 1: Design the UX...` through the `spec = {...}` assignment) with:

```typescript
    // Step 1: Design the UX using 2-stage psychology pipeline
    let spec: FrontendSpec;
    {
      await logger.agent(this.name, `Running 2-stage psychology design pipeline...`);

      // Stage 1: Analyze psychology + pick colors (~2K tokens, ~15s)
      const psychology = await this.analyzeAudiencePsychology(idea);

      // Rate limit delay between stages
      await new Promise(r => setTimeout(r, 3000));

      // Stage 2: Pick typography + tactics (~2K tokens, ~15s)
      const typography = psychology
        ? await this.designTypographyAndTactics(idea, psychology)
        : null;

      // Build final spec (merges LLM results with fallbacks)
      spec = this.buildFrontendSpec(idea, psychology, typography);

      const source = psychology ? 'LLM-generated' : 'fallback palette';
      await logger.agent(this.name, `Design: ${source}, primary=${spec.designSystem.primaryColor}, font=${spec.designSystem.fontFamily}, style=${spec.designSystem.style}`);
    }
```

**Step 2: Verify the replacement worked**

Run: `grep -n "2-stage psychology" /c/Users/Saad/Desktop/Openclaw/mvp-factory/daemon/mvp-factory-daemon-v11-multiagent.ts`

Expected: Shows line number with "Running 2-stage psychology design pipeline"

**Step 3: Verify full syntax**

Run: `cd /c/Users/Saad/Desktop/Openclaw/mvp-factory && npx tsc --noEmit daemon/mvp-factory-daemon-v11-multiagent.ts 2>&1 | head -30`

**Step 4: Commit**

```bash
git add mvp-factory/daemon/mvp-factory-daemon-v11-multiagent.ts
git commit -m "feat: replace hardcoded design with 2-stage psychology pipeline"
```

---

## Task 6: Sync to Server and Test

**Files:** None (deployment only)

**Step 1: Push to GitHub**

```bash
git push origin master
```

**Step 2: Pull on server**

```bash
ssh root@45.58.40.219 "cd /root/Openclaw-repo && git pull"
```

**Step 3: Restart daemon**

```bash
ssh root@45.58.40.219 "pm2 restart mvp-daemon && sleep 5 && pm2 logs mvp-daemon --lines 20 --nostream"
```

Expected: Logs show daemon starting without errors

**Step 4: Verify new pipeline in logs**

Wait for next build cycle, then check:

```bash
ssh root@45.58.40.219 "grep -i 'psychology\|2-stage\|LLM-generated\|fallback palette' /root/.openclaw/logs/daemon-v11.log | tail -20"
```

Expected: Logs showing either "LLM-generated" or "fallback palette" with varied colors

---

## Success Verification Checklist

After deployment, verify these in the logs:

1. [ ] "Running 2-stage psychology design pipeline" appears
2. [ ] "Psychology: [emotionalState] audience, [aesthetic] aesthetic" appears (Stage 1 worked)
3. [ ] "Typography: [fontFamily], [spacing] spacing" appears (Stage 2 worked)
4. [ ] Primary colors vary between projects (not always #3B82F6 or #6366F1)
5. [ ] No timeouts in FrontendAgent (calls complete in <30s each)
6. [ ] Fallback palette kicks in gracefully if LLM fails

---

## Rollback Plan

If the new pipeline causes issues:

```bash
# Revert to previous commit
git revert HEAD~5..HEAD --no-commit
git commit -m "revert: rollback psychology pipeline, restore hardcoded defaults"
git push origin master
ssh root@45.58.40.219 "cd /root/Openclaw-repo && git pull && pm2 restart mvp-daemon"
```
