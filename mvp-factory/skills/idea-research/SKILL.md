# Deep Research Agent Skill

## Description
Multi-source research agent that scrapes Reddit, X (Twitter), and HackerNews for REAL trending pain points and product opportunities. Uses actual API calls with web scraping fallback. Never simulates - always grounded in real community discussions.

## Metadata
```yaml
name: idea-research
version: 2.0.0
author: MVPFactory v11
requiredEnv:
  - NVIDIA_API_KEY
optionalEnv:
  - TWITTER_BEARER_TOKEN
  - REDDIT_CLIENT_ID
  - REDDIT_CLIENT_SECRET
stateDirs:
  - ideas
  - research-cache
```

## Data Sources

### Reddit (21 subreddits monitored)
- r/SideProject, r/startups, r/SaaS, r/AppIdeas, r/indiehackers
- r/Entrepreneur, r/webdev, r/reactjs, r/nextjs, r/selfhosted
- r/productivity, r/WorkOnline, r/smallbusiness, r/marketing
- r/artificial, r/MachineLearning, r/datascience, r/cryptocurrency
- r/PersonalFinance, r/Fitness, r/QuantifiedSelf

### X/Twitter (10 search queries)
- "I wish there was an app", "someone should build", "would pay for"
- "frustrated with", "need a tool that", "pain point"

### HackerNews
- Show HN (launches), Ask HN (problems), Top stories

## Research Method
1. Fetch REAL posts from all 3 platforms (parallel)
2. Filter by engagement (upvotes, comments, pain level)
3. Analyze posts with AI to extract concrete product ideas
4. Deduplicate across sources and existing products
5. Output raw ideas for Validation Agent

## Anti-AI-Slop Rules
- NEVER use generic idea categories (todo apps, AI writing tools, generic CRMs)
- Ideas must be NICHE and SPECIFIC (e.g., "invoice dispute analyzer for freelancers")
- Must address a proven pain point with evidence (upvotes, comments)
- Avoid oversaturated markets unless angle is truly novel

## Output Format
```json
{
  "title": "Specific product name",
  "description": "What it does (concrete)",
  "problem": "Exact pain point from real posts",
  "targetUsers": "Precise audience segment",
  "sourcePlatform": "reddit|x|hackernews",
  "sourcePost": "URL to original post",
  "upvotes": 42,
  "commentCount": 15,
  "painLevel": "mild|moderate|severe",
  "tags": ["niche1", "niche2"]
}
```

## Triggers
- Cron: Every 45 minutes
- Manual: `/research`
