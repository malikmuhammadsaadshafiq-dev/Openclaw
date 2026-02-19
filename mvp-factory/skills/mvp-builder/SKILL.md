# Multi-Agent MVP Builder Skill

## Description
Coordinates 5 specialized AI agents to build REAL, WORKING products. Each agent has deep expertise in its domain. Products are validated before building, designed with audience psychology, and implemented with fully functional backends.

## Metadata
```yaml
name: mvp-builder
version: 2.0.0
author: MVPFactory v11
requiredEnv:
  - NVIDIA_API_KEY
  - GITHUB_TOKEN
  - GITHUB_USERNAME
optionalEnv:
  - VERCEL_TOKEN
  - VERCEL_TEAM_ID
  - TELEGRAM_BOT_TOKEN
  - TELEGRAM_CHAT_ID
stateDirs:
  - validated
  - built
  - web
```

## Agent Architecture

### 1. Research Agent
- Scrapes Reddit (21 subs), X (10 queries), HackerNews
- Real API calls with web scraping fallback
- AI-powered post analysis for idea extraction
- Cross-platform deduplication

### 2. Validation Agent
- 5-dimension scoring (market demand, competition gap, feasibility, monetization, audience fit)
- Weighted scoring with 6.5/10 minimum threshold
- Competition analysis with unique angle identification
- Full audience profiling (demographics, psychographics, pain points, motivations)
- Automatic rejection of oversaturated ideas

### 3. Frontend Agent
- Audience psychology-driven UX design
- Custom design system per product (colors, fonts, style matched to audience)
- Conversion optimization with behavioral psychology tactics
- Psychology tactics: loss aversion, social proof, anchoring, reciprocity
- Accessibility compliance (AA level)
- Responsive mobile-first design

### 4. Backend Agent
- Complete API route implementation (not stubs)
- Real AI integration via NVIDIA Kimi K2.5 with smart fallbacks
- Data processing algorithms (not just pass-through)
- Input validation, error handling, structured responses
- Service layer separation

### 5. PM Agent (Orchestrator)
- Coordinates all agents in the pipeline
- Frontend + Backend run in PARALLEL for speed
- 20-point quality gate (API routes, real logic, responsive, loading states)
- Auto-fix for common quality issues
- Build, deploy, and notify on completion

## Pipeline Flow
```
Research -> Validate -> [Frontend || Backend] -> Merge -> Quality Gate -> Deploy
```

## Quality Gate (20 points)
- API routes with real logic (4 pts)
- Frontend calls API (3 pts)
- No localStorage abuse (2 pts)
- Error handling (2 pts)
- Loading states (2 pts)
- Responsive design (2 pts)
- Sufficient files (2 pts)
- Design system applied (1 pt)
- Minimum threshold: 10/20

## Tech Stack
- **Frontend**: Next.js 14, React, TailwindCSS (custom design per product)
- **Backend**: Next.js API Routes with real processing logic
- **AI**: NVIDIA Kimi K2.5 (with smart fallbacks)
- **Deployment**: GitHub + Vercel
- **Notifications**: Telegram

## Triggers
- Full pipeline: Every 45 minutes
- Build from queue: Every 20 minutes
- Manual: `/build`
