# Idea Research Skill

## Description
Autonomous research agent that discovers trending app, web, and SaaS ideas from X (Twitter) and Reddit. Monitors startup communities, indie hackers, and tech trends to identify viable MVP opportunities.

## Metadata
```yaml
name: idea-research
version: 1.0.0
author: MVPFactory
requiredEnv:
  - TWITTER_BEARER_TOKEN
  - REDDIT_CLIENT_ID
  - REDDIT_CLIENT_SECRET
stateDirs:
  - ideas
  - research-cache
```

## Tools

### `research_x`
Searches X/Twitter for trending app ideas, startup launches, and problem statements.

**Parameters:**
- `query`: Search query (e.g., "I wish there was an app", "someone build this", "startup idea")
- `limit`: Max results (default: 50)

### `research_reddit`
Monitors Reddit communities for app/SaaS ideas and user pain points.

**Subreddits monitored:**
- r/SideProject
- r/startups
- r/SaaS
- r/AppIdeas
- r/indiehackers
- r/Entrepreneur
- r/webdev
- r/reactnative

### `analyze_idea`
Analyzes a discovered idea for viability, complexity, and MVP scope.

**Returns:**
- Viability score (1-10)
- Estimated build time
- Tech stack recommendation
- MVP feature list

### `save_idea`
Saves a validated idea to the ideas queue for building.

## Instructions

When activated, continuously:
1. Search X for phrases like "I wish there was", "someone should build", "why isn't there an app for"
2. Monitor Reddit for upvoted app ideas and feature requests
3. Filter for ideas that can be built as MVPs in < 24 hours
4. Analyze each idea for viability and technical feasibility
5. Queue viable ideas for the MVP builder skill

## Triggers
- Cron: Every 1 hour
- Manual: `/research ideas`

## Output Format
```json
{
  "id": "uuid",
  "source": "x|reddit",
  "title": "Brief title",
  "description": "What the app/service does",
  "problem": "What problem it solves",
  "targetUsers": "Who would use it",
  "features": ["feature1", "feature2"],
  "techStack": "recommended stack",
  "complexity": "low|medium|high",
  "estimatedHours": 8,
  "viabilityScore": 8,
  "sourceUrl": "original post url",
  "discoveredAt": "ISO timestamp"
}
```
