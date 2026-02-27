# Psychology-Driven Frontend Design System

**Date:** 2026-02-27
**Status:** Approved
**Goal:** Eliminate "AI slop" - same colors, same styling on every deployed project

## Problem

Current `FrontendAgent` (lines 1810-1835 in `mvp-factory-daemon-v11-multiagent.ts`) uses **hardcoded defaults**:

```typescript
primaryColor: isDev ? '#6366F1' : '#3B82F6',  // Always indigo or blue
secondaryColor: isDev ? '#EC4899' : '#10B981', // Always pink or emerald
fontFamily: isDev ? 'JetBrains Mono' : 'Inter', // Same 2 fonts
style: isDev ? 'tech' : 'minimal',              // Only 2 styles
```

The `designUX()` function exists but is **bypassed** because it times out (8K tokens, 5min NVIDIA limit).

## Solution: 2-Stage Lightweight Pipeline

Replace the bypassed `designUX()` with two small, fast API calls.

### Stage 1: Psychology + Colors (~2.5K tokens, ~15s)

**Function:** `analyzeAudiencePsychology(idea: ValidatedIdea)`

**Prompt (~1.5K tokens):**
```
Analyze audience psychology and select colors for a {type} product targeting {targetUsers}.

PAIN: {painPoints[0]}
DESIRE: {motivations[0]}
TECH LEVEL: {techSavviness}
PRICE TOLERANCE: {priceWillingness}

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
    "background": "#hex - page background",
    "reasoning": "1 sentence why these colors for THIS audience"
  },
  "aesthetic": "minimal|bold|soft|professional|playful|dark-tech"
}

RULES:
- NO blue (#3B82F6) or indigo (#6366F1) unless psychology demands it
- Match colors to emotional state (anxious = calming, frustrated = energizing)
- Consider industry norms but don't be generic
```

**Output type:**
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

### Stage 2: Typography + Tactics (~2.5K tokens, ~15s)

**Function:** `designTypographyAndTactics(idea: ValidatedIdea, psychology: DesignPsychology)`

**Prompt (~1.5K tokens):**
```
Design typography and psychology tactics for {title} targeting {targetUsers}.

PSYCHOLOGY PROFILE:
- Emotional state: {emotionalState}
- Fear: {primaryFear}
- Desire: {primaryDesire}
- Trust level: {trustLevel}
- Aesthetic: {aesthetic}

Return ONLY JSON:
{
  "typography": {
    "fontFamily": "Google Font name (NOT Inter or JetBrains Mono)",
    "headingWeight": "600|700|800",
    "bodyWeight": "400|500",
    "borderRadius": "4px|8px|12px|16px|20px",
    "spacing": "compact|normal|generous"
  },
  "tactics": [
    {
      "name": "tactic name",
      "implementation": "EXACT text/element to show - specific to {targetUsers}"
    }
  ]
}

TYPOGRAPHY RULES:
- anxious/overwhelmed → rounded fonts (Nunito, Quicksand), generous spacing
- professional/skeptical → clean fonts (Outfit, DM Sans), normal spacing
- playful/curious → friendly fonts (Poppins, Lexend), medium border radius
- tech/analytical → modern fonts (Space Grotesk, Sora), compact spacing

TACTICS - must include these 4 with SPECIFIC implementations:
1. Loss aversion: show cost of NOT having this (specific $$ or time for {targetUsers})
2. Social proof: counter with realistic number for {targetUsers} niche
3. Reciprocity: free value before asking for signup
4. Authority/Trust: credential or proof relevant to {targetUsers}
```

**Output type:**
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

## Implementation Location

**File:** `mvp-factory/daemon/mvp-factory-daemon-v11-multiagent.ts`

**Changes:**
1. Add `analyzeAudiencePsychology()` function (~40 lines)
2. Add `designTypographyAndTactics()` function (~40 lines)
3. Replace hardcoded block in `FrontendAgent.run()` (lines 1810-1835) with:
   ```typescript
   const psychology = await this.analyzeAudiencePsychology(idea);
   const design = await this.designTypographyAndTactics(idea, psychology);
   const spec = this.buildFrontendSpec(psychology, design, idea);
   ```
4. Add 3-second delay between Stage 1 and Stage 2 for rate limiting
5. Add fallback: if either stage fails after 1 retry, use smart randomized defaults (not hardcoded blue)

## Rate Limit Safety

- Each call: ~2.5K tokens (well under 8K that caused timeouts)
- Delay between calls: 3 seconds
- Uses existing `kimiGlobalRateLimiter` (5s min gap)
- Total time: ~30-45 seconds (vs 5min timeout before)
- Fallback on failure: randomized smart defaults, not hardcoded

## Fallback Defaults (if LLM fails)

Instead of always blue/indigo, cycle through these based on `idea.id` hash:

```typescript
const FALLBACK_PALETTES = [
  { primary: '#059669', secondary: '#F59E0B', aesthetic: 'professional' }, // emerald/amber
  { primary: '#7C3AED', secondary: '#EC4899', aesthetic: 'bold' },         // violet/pink
  { primary: '#0891B2', secondary: '#84CC16', aesthetic: 'soft' },         // cyan/lime
  { primary: '#DC2626', secondary: '#1D4ED8', aesthetic: 'bold' },         // red/blue
  { primary: '#4F46E5', secondary: '#10B981', aesthetic: 'minimal' },      // indigo/emerald
  { primary: '#0F172A', secondary: '#38BDF8', aesthetic: 'dark-tech' },    // slate/sky
];
```

## Success Criteria

1. No two consecutive projects have the same primary color
2. Colors are justified by audience psychology (visible in logs)
3. Typography varies based on audience tech-savviness
4. Psychology tactics are specific, not generic "social proof" placeholders
5. No timeouts (each call completes in <30s)

## Files Changed

- `mvp-factory/daemon/mvp-factory-daemon-v11-multiagent.ts` (FrontendAgent class only)

## Not Changed

- Backend generation (BackendAgent)
- Validation logic (ValidationAgent)
- Research logic (ResearchAgent)
- Deployment pipeline
- Any other files
