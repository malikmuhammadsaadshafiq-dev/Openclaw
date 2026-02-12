import { Skill, SkillContext } from '@openclaw/sdk';

interface Idea {
  id: string;
  source: 'x' | 'reddit';
  title: string;
  description: string;
  problem: string;
  targetUsers: string;
  features: string[];
  techStack: string;
  complexity: 'low' | 'medium' | 'high';
  estimatedHours: number;
  viabilityScore: number;
  sourceUrl: string;
  discoveredAt: string;
  type: 'web' | 'mobile' | 'saas' | 'api';
}

const TWITTER_SEARCH_QUERIES = [
  '"I wish there was an app"',
  '"someone should build"',
  '"why isn\'t there an app for"',
  '"startup idea"',
  '"would pay for"',
  '"need an app that"',
  '"looking for a tool"',
  '"frustrated with"',
];

const REDDIT_SUBREDDITS = [
  'SideProject',
  'startups',
  'SaaS',
  'AppIdeas',
  'indiehackers',
  'Entrepreneur',
  'webdev',
  'reactnative',
  'nextjs',
  'opensource',
];

export class IdeaResearchSkill extends Skill {
  name = 'idea-research';

  async researchX(ctx: SkillContext): Promise<Idea[]> {
    const ideas: Idea[] = [];
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;

    if (!bearerToken) {
      ctx.log('No Twitter bearer token configured, using AI to simulate research');
      return this.simulateXResearch(ctx);
    }

    for (const query of TWITTER_SEARCH_QUERIES) {
      try {
        const response = await fetch(
          `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=20&tweet.fields=created_at,public_metrics`,
          {
            headers: {
              'Authorization': `Bearer ${bearerToken}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const analyzed = await this.analyzeXPosts(ctx, data.data || []);
          ideas.push(...analyzed);
        }
      } catch (error) {
        ctx.log(`Error searching X: ${error}`);
      }
    }

    return ideas;
  }

  async simulateXResearch(ctx: SkillContext): Promise<Idea[]> {
    const prompt = `You are researching X/Twitter for trending app and startup ideas.

Generate 5 realistic, buildable app/SaaS ideas that are currently trending. Focus on:
- Problems people are actively complaining about
- Gaps in existing tools
- Emerging trends in AI, productivity, crypto, health
- Ideas that can be built as MVPs in 8-24 hours

Return as JSON array with this structure for each:
{
  "title": "Brief catchy title",
  "description": "What it does",
  "problem": "What problem it solves",
  "targetUsers": "Who would use it",
  "features": ["feature1", "feature2", "feature3"],
  "techStack": "Next.js + Supabase" or "React Native + Expo" etc,
  "type": "web|mobile|saas|api",
  "estimatedHours": 8-24,
  "viabilityScore": 1-10
}`;

    const response = await ctx.llm.complete(prompt);
    const parsed = JSON.parse(response.content);

    return parsed.map((idea: any) => ({
      ...idea,
      id: crypto.randomUUID(),
      source: 'x' as const,
      complexity: idea.estimatedHours <= 8 ? 'low' : idea.estimatedHours <= 16 ? 'medium' : 'high',
      sourceUrl: 'https://x.com/simulated',
      discoveredAt: new Date().toISOString(),
    }));
  }

  async researchReddit(ctx: SkillContext): Promise<Idea[]> {
    const ideas: Idea[] = [];
    const clientId = process.env.REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      ctx.log('No Reddit credentials configured, using AI to simulate research');
      return this.simulateRedditResearch(ctx);
    }

    // Get Reddit access token
    const authResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!authResponse.ok) {
      return this.simulateRedditResearch(ctx);
    }

    const { access_token } = await authResponse.json();

    for (const subreddit of REDDIT_SUBREDDITS) {
      try {
        const response = await fetch(
          `https://oauth.reddit.com/r/${subreddit}/hot?limit=25`,
          {
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'User-Agent': 'MVPFactory/1.0',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const posts = data.data.children.map((c: any) => c.data);
          const analyzed = await this.analyzeRedditPosts(ctx, posts, subreddit);
          ideas.push(...analyzed);
        }
      } catch (error) {
        ctx.log(`Error fetching r/${subreddit}: ${error}`);
      }
    }

    return ideas;
  }

  async simulateRedditResearch(ctx: SkillContext): Promise<Idea[]> {
    const prompt = `You are researching Reddit communities (r/SideProject, r/startups, r/SaaS, r/indiehackers, r/AppIdeas) for trending app ideas.

Generate 5 realistic app/SaaS ideas based on what's currently popular in these communities. Focus on:
- Highly upvoted feature requests
- Common pain points developers and entrepreneurs share
- "I built this" posts that got great reception
- Ideas that fill gaps in existing tools

Return as JSON array with this structure for each:
{
  "title": "Brief catchy title",
  "description": "What it does",
  "problem": "What problem it solves",
  "targetUsers": "Who would use it",
  "features": ["feature1", "feature2", "feature3"],
  "techStack": "Next.js + Supabase" or "React Native + Expo" etc,
  "type": "web|mobile|saas|api",
  "estimatedHours": 8-24,
  "viabilityScore": 1-10
}`;

    const response = await ctx.llm.complete(prompt);
    const parsed = JSON.parse(response.content);

    return parsed.map((idea: any) => ({
      ...idea,
      id: crypto.randomUUID(),
      source: 'reddit' as const,
      complexity: idea.estimatedHours <= 8 ? 'low' : idea.estimatedHours <= 16 ? 'medium' : 'high',
      sourceUrl: 'https://reddit.com/simulated',
      discoveredAt: new Date().toISOString(),
    }));
  }

  async analyzeXPosts(ctx: SkillContext, posts: any[]): Promise<Idea[]> {
    if (!posts.length) return [];

    const prompt = `Analyze these X/Twitter posts for viable app/startup ideas:

${posts.map(p => p.text).join('\n---\n')}

Extract any viable app ideas and return as JSON array. Only include ideas that:
1. Can be built as an MVP in 8-24 hours
2. Solve a real problem
3. Have clear target users

Return empty array if no viable ideas found.`;

    try {
      const response = await ctx.llm.complete(prompt);
      return JSON.parse(response.content);
    } catch {
      return [];
    }
  }

  async analyzeRedditPosts(ctx: SkillContext, posts: any[], subreddit: string): Promise<Idea[]> {
    if (!posts.length) return [];

    const postsText = posts.map(p => `Title: ${p.title}\nBody: ${p.selftext?.slice(0, 500) || 'N/A'}\nScore: ${p.score}`).join('\n---\n');

    const prompt = `Analyze these Reddit posts from r/${subreddit} for viable app/startup ideas:

${postsText}

Extract any viable app ideas and return as JSON array. Focus on:
1. Problems with high upvotes
2. Feature requests for existing tools
3. "I wish X existed" posts

Return empty array if no viable ideas found.`;

    try {
      const response = await ctx.llm.complete(prompt);
      return JSON.parse(response.content);
    } catch {
      return [];
    }
  }

  async saveIdea(ctx: SkillContext, idea: Idea): Promise<void> {
    const ideasDir = `${process.env.MVP_OUTPUT_DIR || '/root/mvp-projects'}/ideas`;
    const fs = await import('fs/promises');
    await fs.mkdir(ideasDir, { recursive: true });
    await fs.writeFile(
      `${ideasDir}/${idea.id}.json`,
      JSON.stringify(idea, null, 2)
    );
    ctx.log(`Saved idea: ${idea.title}`);
  }

  async getQueuedIdeas(ctx: SkillContext): Promise<Idea[]> {
    const ideasDir = `${process.env.MVP_OUTPUT_DIR || '/root/mvp-projects'}/ideas`;
    const fs = await import('fs/promises');

    try {
      const files = await fs.readdir(ideasDir);
      const ideas: Idea[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(`${ideasDir}/${file}`, 'utf-8');
          ideas.push(JSON.parse(content));
        }
      }

      return ideas.sort((a, b) => b.viabilityScore - a.viabilityScore);
    } catch {
      return [];
    }
  }

  async run(ctx: SkillContext): Promise<void> {
    ctx.log('Starting idea research cycle...');

    // Research from both sources
    const [xIdeas, redditIdeas] = await Promise.all([
      this.researchX(ctx),
      this.researchReddit(ctx),
    ]);

    const allIdeas = [...xIdeas, ...redditIdeas];
    ctx.log(`Discovered ${allIdeas.length} potential ideas`);

    // Filter for viable MVPs (score >= 7, hours <= 24)
    const viableIdeas = allIdeas.filter(
      idea => idea.viabilityScore >= 7 && idea.estimatedHours <= 24
    );

    ctx.log(`${viableIdeas.length} ideas pass viability threshold`);

    // Save viable ideas to queue
    for (const idea of viableIdeas) {
      await this.saveIdea(ctx, idea);
    }

    ctx.log('Research cycle complete');
  }
}

export default IdeaResearchSkill;
