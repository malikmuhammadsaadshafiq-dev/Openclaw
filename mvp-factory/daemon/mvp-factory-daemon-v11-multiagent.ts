/**
 * MVP Factory v11 - Multi-Agent Architecture
 *
 * 5 Specialized Agents:
 * 1. ResearchAgent - Real Reddit/X scraping for ideas
 * 2. ValidationAgent - Deep market validation & audience analysis
 * 3. FrontendAgent - Psychology-driven UI design & generation
 * 4. BackendAgent - Complete working backend with real features
 * 5. PMAgent - Orchestrates everything, manages pipeline & quality
 *
 * Powered by Kimi K2.5 via NVIDIA API
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ============================================================
// Retry Loop Utility (exponential backoff)
// ============================================================
async function retryLoop<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelay?: number; label?: string } = {}
): Promise<T> {
  const maxRetries = options.maxRetries || 3;
  const baseDelay = options.baseDelay || 2000;
  const label = options.label || 'operation';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      if (attempt === maxRetries) throw error;
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.log(`[RetryLoop] ${label} attempt ${attempt}/${maxRetries} failed, retrying in ${Math.round(delay)}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error(`${label} failed after ${maxRetries} attempts`);
}

// Rate limiter to avoid getting blocked
class RateLimiter {
  private lastCall: number = 0;
  private minDelay: number;
  constructor(minDelayMs: number = 1500) { this.minDelay = minDelayMs; }
  async wait(): Promise<void> {
    const elapsed = Date.now() - this.lastCall;
    if (elapsed < this.minDelay) {
      await new Promise(r => setTimeout(r, this.minDelay - elapsed));
    }
    this.lastCall = Date.now();
  }
}

// ============================================================
// Configuration
// ============================================================
const CONFIG = {
  nvidia: {
    apiKey: process.env.NVIDIA_API_KEY || '',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    model: 'moonshotai/kimi-k2.5',
  },
  github: {
    token: process.env.GITHUB_TOKEN || '',
    username: process.env.GITHUB_USERNAME || '',
  },
  vercel: {
    token: process.env.VERCEL_TOKEN || '',
    teamId: process.env.VERCEL_TEAM_ID || 'team_DN6tO3CT5AwBW6JyiBJ5sItw',
  },
  reddit: {
    clientId: process.env.REDDIT_CLIENT_ID || '',
    clientSecret: process.env.REDDIT_CLIENT_SECRET || '',
  },
  twitter: {
    bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || '',
  },
  paths: {
    output: process.env.MVP_OUTPUT_DIR || '/root/mvp-projects',
    logs: process.env.LOG_DIR || '/root/.neurafinity/logs',
    ideas: '/root/mvp-projects/ideas',
    validated: '/root/mvp-projects/validated',
    built: '/root/mvp-projects/built',
    skipped: '/root/mvp-projects/skipped',
  },
  intervals: {
    research: 45 * 60 * 1000,    // 45 min
    build: 20 * 60 * 1000,       // 20 min
    healthCheck: 5 * 60 * 1000,  // 5 min
  },
};

// ============================================================
// Shared Types
// ============================================================
interface RawIdea {
  title: string;
  description: string;
  problem: string;
  targetUsers: string;
  sourcePost: string;
  sourcePlatform: 'reddit' | 'x' | 'hackernews';
  upvotes: number;
  commentCount: number;
  painLevel: 'mild' | 'moderate' | 'severe';
  tags: string[];
}

interface ValidatedIdea {
  id: string;
  title: string;
  description: string;
  problem: string;
  targetUsers: string;
  features: string[];
  type: 'web' | 'mobile' | 'saas' | 'api';
  category: 'ai-assisted' | 'utility' | 'data-tool' | 'automation' | 'saas-platform';
  validation: {
    marketDemand: number;        // 1-10
    competitionGap: number;      // 1-10 (higher = less competition)
    technicalFeasibility: number; // 1-10
    monetizationPotential: number; // 1-10
    audienceFit: number;          // 1-10
    overallScore: number;         // weighted average
    verdict: 'build' | 'skip' | 'revisit';
    reasoning: string;
    competitors: string[];
    uniqueAngle: string;
  };
  audienceProfile: {
    demographics: string;
    psychographics: string;
    painPoints: string[];
    motivations: string[];
    techSavviness: 'low' | 'medium' | 'high';
    priceWillingness: 'free-only' | 'low' | 'medium' | 'premium';
  };
  techStack: string;
  estimatedHours: number;
  discoveredAt: string;
  validatedAt: string;
  sourcePost: string;
  sourcePlatform: string;
}

interface FrontendSpec {
  designSystem: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    borderRadius: string;
    darkMode: boolean;
    style: 'minimal' | 'bold' | 'playful' | 'corporate' | 'tech';
  };
  uxPatterns: string[];
  conversionElements: string[];
  pages: Array<{
    route: string;
    purpose: string;
    components: string[];
    userFlow: string;
  }>;
  psychologyTactics: string[];
  accessibilityLevel: 'basic' | 'AA' | 'AAA';
}

interface BackendSpec {
  apiRoutes: Array<{
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    purpose: string;
    inputSchema: string;
    outputSchema: string;
    implementation: string;
  }>;
  dataModels: Array<{
    name: string;
    fields: string[];
    relationships: string;
  }>;
  integrations: Array<{
    service: string;
    purpose: string;
    apiEndpoint: string;
    authMethod: string;
  }>;
  authentication: string;
  errorHandling: string;
  realTimeFeatures: string[];
}

interface ProjectSpec {
  idea: ValidatedIdea;
  frontend: FrontendSpec;
  backend: BackendSpec;
  files: Array<{ path: string; content: string }>;
  qualityScore: number;
}

interface BuildResult {
  success: boolean;
  projectPath: string;
  githubUrl: string;
  vercelUrl: string;
  qualityScore: number;
  error?: string;
}

// ============================================================
// Logger
// ============================================================
class Logger {
  private logFile: string;

  constructor() {
    this.logFile = path.join(CONFIG.paths.logs, 'daemon-v11.log');
  }

  async log(message: string, level: 'INFO' | 'ERROR' | 'WARN' | 'AGENT' = 'INFO') {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${level}] ${message}\n`;
    console.log(logLine.trim());
    try {
      await fs.mkdir(CONFIG.paths.logs, { recursive: true });
      await fs.appendFile(this.logFile, logLine);
    } catch {}
  }

  async agent(agentName: string, message: string) {
    await this.log(`[${agentName}] ${message}`, 'AGENT');
  }
}

const logger = new Logger();

// ============================================================
// Kimi K2.5 LLM Client (streaming + retry)
// ============================================================
class KimiClient {
  private maxRetries = 3;

  private async streamComplete(prompt: string, maxTokens: number, temperature: number, systemPrompt?: string): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 600000);

    const messages: Array<{ role: string; content: string }> = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });

    const response = await fetch(`${CONFIG.nvidia.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.nvidia.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: CONFIG.nvidia.model,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      throw new Error(`Kimi API ${response.status}: ${response.statusText} - ${errBody.slice(0, 200)}`);
    }

    let content = '';
    let reasoning = '';
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body reader');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed?.choices?.[0]?.delta;
          if (delta?.content) content += delta.content;
          if (delta?.reasoning_content) reasoning += delta.reasoning_content;
        } catch {}
      }
    }

    const result = content || reasoning;
    if (!result || result.trim().length === 0) {
      throw new Error('Empty streaming response from Kimi API');
    }
    return result;
  }

  private async nonStreamComplete(prompt: string, maxTokens: number, temperature: number, systemPrompt?: string): Promise<string> {
    const timeout = 300000 + Math.ceil(maxTokens / 10000) * 120000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const messages: Array<{ role: string; content: string }> = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });

    const response = await fetch(`${CONFIG.nvidia.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.nvidia.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: CONFIG.nvidia.model,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      throw new Error(`Kimi API ${response.status}: ${response.statusText} - ${errBody.slice(0, 200)}`);
    }

    const data = await response.json();
    const msg = data?.choices?.[0]?.message;
    const result = msg?.content || msg?.reasoning_content || '';
    if (!result || typeof result !== 'string' || result.trim().length === 0) {
      throw new Error(`Empty response (finish_reason: ${data?.choices?.[0]?.finish_reason || 'unknown'})`);
    }
    return result;
  }

  async complete(prompt: string, options: { maxTokens?: number; temperature?: number; systemPrompt?: string } = {}): Promise<string> {
    const maxTokens = options.maxTokens || 16384;
    const temperature = options.temperature || 0.7;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.streamComplete(prompt, maxTokens, temperature, options.systemPrompt);
      } catch (error: any) {
        const errMsg = error?.name === 'AbortError' ? 'Timeout' : String(error).slice(0, 200);
        if (attempt === this.maxRetries) {
          try {
            return await this.nonStreamComplete(prompt, maxTokens, temperature, options.systemPrompt);
          } catch (fallbackErr) {
            throw new Error(`Kimi API failed after ${this.maxRetries}+1 attempts: ${errMsg}`);
          }
        }
        const backoff = 10000 * Math.pow(3, attempt - 1);
        await new Promise(r => setTimeout(r, backoff));
      }
    }
    throw new Error('Unreachable');
  }
}

const kimi = new KimiClient();

// ============================================================
// Utility Functions
// ============================================================
function extractJSON(text: string, type: 'object' | 'array' = 'object'): any | null {
  if (!text || typeof text !== 'string') return null;
  try { return JSON.parse(text); } catch {}

  const pattern = type === 'array' ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
  const match = text.match(pattern);
  if (!match) return null;

  try { return JSON.parse(match[0]); } catch {}

  let json = match[0];
  json = json.replace(/,\s*([\]}])/g, '$1');
  json = json.replace(/(\{|,)\s*([a-zA-Z_]\w*)\s*:/g, '$1"$2":');
  json = json.replace(/'/g, '"');
  const quoteCount = (json.match(/(?<!\\)"/g) || []).length;
  if (quoteCount % 2 !== 0) json = json.slice(0, json.lastIndexOf('"')) + '"';
  const openBraces = (json.match(/\{/g) || []).length;
  const closeBraces = (json.match(/\}/g) || []).length;
  const openBrackets = (json.match(/\[/g) || []).length;
  const closeBrackets = (json.match(/\]/g) || []).length;
  json += '}'.repeat(Math.max(0, openBraces - closeBraces));
  json += ']'.repeat(Math.max(0, openBrackets - closeBrackets));

  try { return JSON.parse(json); } catch { return null; }
}

function toSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function extractKeywords(title: string): Set<string> {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'is', 'it', 'my', 'your', 'our', 'app', 'tool',
    'pro', 'ai', 'smart', 'auto', 'easy', 'quick', 'fast', 'simple',
    'free', 'online', 'web', 'mobile', 'new', 'super', 'ultra', 'mega',
  ]);
  return new Set(
    title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
      .filter(w => w.length > 1 && !stopWords.has(w))
  );
}

function keywordSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const word of a) { if (b.has(word)) intersection++; }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

interface ExistingProduct {
  title: string;
  slug: string;
  keywords: Set<string>;
  description: string;
  source: 'ideas' | 'validated' | 'built' | 'web';
}

async function loadExistingProducts(): Promise<ExistingProduct[]> {
  const products: ExistingProduct[] = [];
  async function loadFromDir(dir: string, source: 'ideas' | 'validated' | 'built'): Promise<void> {
    try {
      const files = await fs.readdir(dir);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        try {
          const content = await fs.readFile(path.join(dir, file), 'utf-8');
          const data = JSON.parse(content);
          if (data.title) {
            products.push({
              title: data.title,
              slug: toSlug(data.title),
              keywords: extractKeywords(data.title),
              description: data.description || data.problem || '',
              source,
            });
          }
        } catch {}
      }
    } catch {}
  }
  async function loadFromOutputDir(dir: string): Promise<void> {
    try {
      const folders = await fs.readdir(dir);
      for (const folder of folders) {
        try {
          await fs.access(path.join(dir, folder, 'package.json'));
          products.push({
            title: folder,
            slug: folder,
            keywords: extractKeywords(folder.replace(/-/g, ' ')),
            description: '',
            source: 'web',
          });
        } catch {}
      }
    } catch {}
  }
  await Promise.all([
    loadFromDir(CONFIG.paths.ideas, 'ideas'),
    loadFromDir(CONFIG.paths.validated, 'validated'),
    loadFromDir(CONFIG.paths.built, 'built'),
    loadFromOutputDir(path.join(CONFIG.paths.output, 'web')),
  ]);
  return products;
}

function isDuplicate(idea: { title: string; description?: string }, existing: ExistingProduct[]): { duplicate: boolean; reason: string; matchedWith: string } {
  const newSlug = toSlug(idea.title);
  const newKeywords = extractKeywords(idea.title);

  for (const product of existing) {
    if (newSlug === product.slug) return { duplicate: true, reason: 'exact slug match', matchedWith: product.title };
    if ((newSlug.includes(product.slug) || product.slug.includes(newSlug)) && Math.min(newSlug.length, product.slug.length) >= 5) {
      return { duplicate: true, reason: 'slug containment', matchedWith: product.title };
    }
    const titleSim = keywordSimilarity(newKeywords, product.keywords);
    if (titleSim >= 0.6) return { duplicate: true, reason: `title similarity ${Math.round(titleSim * 100)}%`, matchedWith: product.title };
  }
  return { duplicate: false, reason: '', matchedWith: '' };
}

// Fail tracking
const FAIL_TRACKER_PATH = path.join(CONFIG.paths.output, 'fail-tracker-v11.json');
interface FailTracker { [id: string]: { count: number; lastFail: string; error: string } }

async function loadFailTracker(): Promise<FailTracker> {
  try { return JSON.parse(await fs.readFile(FAIL_TRACKER_PATH, 'utf-8')); } catch { return {}; }
}
async function saveFailTracker(tracker: FailTracker): Promise<void> {
  await fs.writeFile(FAIL_TRACKER_PATH, JSON.stringify(tracker, null, 2));
}
async function recordFailure(id: string, error: string): Promise<number> {
  const t = await loadFailTracker();
  const e = t[id] || { count: 0, lastFail: '', error: '' };
  e.count++; e.lastFail = new Date().toISOString(); e.error = error.slice(0, 200);
  t[id] = e; await saveFailTracker(t); return e.count;
}
async function clearFailure(id: string): Promise<void> {
  const t = await loadFailTracker(); delete t[id]; await saveFailTracker(t);
}

// Telegram notification
async function notifyTelegram(message: string): Promise<void> {
  if (!CONFIG.telegram.botToken || !CONFIG.telegram.chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${CONFIG.telegram.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CONFIG.telegram.chatId, text: message, parse_mode: 'Markdown' }),
    });
  } catch {}
}

// Known good package versions
const KNOWN_PACKAGES: Record<string, string> = {
  'next': '14.0.4', 'react': '^18.2.0', 'react-dom': '^18.2.0',
  'tailwindcss': '^3.4.0', 'autoprefixer': '^10.4.16', 'postcss': '^8.4.32',
  'typescript': '^5.3.0', '@types/node': '^20.10.0', '@types/react': '^18.2.0',
  '@types/react-dom': '^18.2.0', 'lucide-react': '^0.300.0', 'clsx': '^2.1.0',
  'class-variance-authority': '^0.7.0', 'tailwind-merge': '^2.2.0',
  '@supabase/supabase-js': '^2.39.0', 'zustand': '^4.4.0', 'date-fns': '^3.0.0',
  'recharts': '^2.10.0', 'framer-motion': '^10.16.0', 'react-hot-toast': '^2.4.1',
  'axios': '^1.6.0', 'zod': '^3.22.0',
};


// ============================================================
// AGENT 1: RESEARCH AGENT (REAL DATA ONLY - NO PLACEHOLDERS)
// ============================================================
class ResearchAgent {
  private name = 'ResearchAgent';
  private rateLimiter = new RateLimiter(2000); // 2s between requests

  private redditSubreddits = [
    'SideProject', 'startups', 'SaaS', 'AppIdeas', 'indiehackers',
    'Entrepreneur', 'webdev', 'reactjs', 'nextjs', 'selfhosted',
    'productivity', 'WorkOnline', 'smallbusiness', 'marketing',
    'artificial', 'MachineLearning', 'datascience', 'cryptocurrency',
    'PersonalFinance', 'Fitness', 'QuantifiedSelf',
  ];

  // Rotate user agents to avoid blocking
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64; rv:122.0) Gecko/20100101 Firefox/122.0',
  ];
  private uaIndex = 0;

  private getUA(): string { return this.userAgents[this.uaIndex++ % this.userAgents.length]; }

  async run(): Promise<RawIdea[]> {
    await logger.agent(this.name, 'Starting REAL research cycle across Reddit, HackerNews, Dev.to, GitHub Trending...');
    const allPosts: RawIdea[] = [];

    // Run research across all REAL platforms in parallel
    const results = await Promise.allSettled([
      this.researchReddit(),
      this.researchHackerNews(),
      this.researchHNAlgolia(),
      this.researchDevTo(),
      this.researchGitHubTrending(),
    ]);

    const labels = ['Reddit', 'HN-Firebase', 'HN-Algolia', 'Dev.to', 'GitHub'];
    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 'fulfilled') {
        const posts = (results[i] as PromiseFulfilledResult<RawIdea[]>).value;
        allPosts.push(...posts);
        await logger.agent(this.name, `${labels[i]}: ${posts.length} real posts collected`);
      } else {
        await logger.agent(this.name, `${labels[i]}: FAILED - ${(results[i] as PromiseRejectedResult).reason}`);
      }
    }

    await logger.agent(this.name, `Total real posts collected: ${allPosts.length} across ${labels.length} platforms`);

    if (allPosts.length === 0) {
      await logger.agent(this.name, 'ZERO real posts collected from any platform. Cannot proceed without real data.');
      return [];
    }

    // Deduplicate raw posts
    const uniquePosts = this.deduplicateRawIdeas(allPosts);
    await logger.agent(this.name, `After dedup: ${uniquePosts.length} unique posts`);

    // Use AI to analyze REAL posts and extract product ideas (grounded in real data)
    const ideas = await this.analyzePostsForIdeas(uniquePosts);
    await logger.agent(this.name, `Extracted ${ideas.length} product ideas from ${uniquePosts.length} real posts`);

    return ideas;
  }

  private async researchReddit(): Promise<RawIdea[]> {
    const ideas: RawIdea[] = [];

    // Strategy 1: OAuth API if credentials available
    if (CONFIG.reddit.clientId && CONFIG.reddit.clientSecret) {
      try {
        const oauthIdeas = await this.redditOAuth();
        if (oauthIdeas.length > 0) return oauthIdeas;
      } catch (err) {
        await logger.agent(this.name, `Reddit OAuth failed: ${err}, trying public JSON...`);
      }
    }

    // Strategy 2: Public JSON endpoints with proper headers and rate limiting
    const endpoints = [
      { base: 'https://www.reddit.com', suffix: '.json?raw_json=1&limit=25' },
      { base: 'https://old.reddit.com', suffix: '.json?limit=25' },
    ];

    for (const endpoint of endpoints) {
      if (ideas.length >= 20) break; // We have enough

      // Process subs sequentially with rate limiting to avoid 429s
      for (const sub of this.redditSubreddits.slice(0, 10)) {
        if (ideas.length >= 50) break;
        await this.rateLimiter.wait();

        try {
          const url = `${endpoint.base}/r/${sub}/hot${endpoint.suffix}`;
          const resp = await retryLoop(
            () => fetch(url, {
              headers: {
                'User-Agent': this.getUA(),
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
              },
              signal: AbortSignal.timeout(15000),
            }),
            { maxRetries: 2, baseDelay: 3000, label: `Reddit r/${sub}` }
          );

          if (!resp.ok) {
            if (resp.status === 429) {
              await logger.agent(this.name, `Reddit rate limited on r/${sub}, waiting 10s...`);
              await new Promise(r => setTimeout(r, 10000));
              continue;
            }
            continue;
          }

          const data = await resp.json();
          const posts = data?.data?.children?.map((c: any) => c.data) || [];

          for (const post of posts) {
            if (post.score >= 5 && (post.selftext || post.title)) {
              ideas.push({
                title: post.title,
                description: (post.selftext || '').slice(0, 500),
                problem: '',
                targetUsers: '',
                sourcePost: `https://reddit.com${post.permalink}`,
                sourcePlatform: 'reddit',
                upvotes: post.score || 0,
                commentCount: post.num_comments || 0,
                painLevel: post.score > 100 ? 'severe' : post.score > 30 ? 'moderate' : 'mild',
                tags: [sub],
              });
            }
          }
        } catch (err) {
          // Silently skip individual sub failures
        }
      }

      if (ideas.length > 0) break; // First working endpoint is sufficient
    }

    await logger.agent(this.name, `Reddit: ${ideas.length} real posts collected`);
    return ideas;
  }

  private async redditOAuth(): Promise<RawIdea[]> {
    const ideas: RawIdea[] = [];

    const authResp = await retryLoop(
      () => fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${CONFIG.reddit.clientId}:${CONFIG.reddit.clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'MVPFactory/2.0 by mvp-factory',
        },
        body: 'grant_type=client_credentials',
        signal: AbortSignal.timeout(10000),
      }),
      { maxRetries: 2, label: 'Reddit OAuth' }
    );

    if (!authResp.ok) throw new Error(`Reddit OAuth ${authResp.status}`);
    const { access_token } = await authResp.json();

    // Process subreddits with rate limiting
    for (const sub of this.redditSubreddits) {
      await this.rateLimiter.wait();
      try {
        const resp = await fetch(`https://oauth.reddit.com/r/${sub}/hot?limit=30`, {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'User-Agent': 'MVPFactory/2.0 by mvp-factory',
          },
          signal: AbortSignal.timeout(10000),
        });

        if (resp.ok) {
          const data = await resp.json();
          for (const child of (data?.data?.children || [])) {
            const post = child.data;
            if (post.score >= 5) {
              ideas.push({
                title: post.title,
                description: (post.selftext || '').slice(0, 500),
                problem: '',
                targetUsers: '',
                sourcePost: `https://reddit.com${post.permalink}`,
                sourcePlatform: 'reddit',
                upvotes: post.score || 0,
                commentCount: post.num_comments || 0,
                painLevel: post.score > 100 ? 'severe' : post.score > 30 ? 'moderate' : 'mild',
                tags: [sub],
              });
            }
          }
        }
      } catch {}
    }

    return ideas;
  }

  private async researchHackerNews(): Promise<RawIdea[]> {
    const ideas: RawIdea[] = [];

    for (const category of ['showstories', 'askstories', 'topstories']) {
      try {
        const resp = await retryLoop(
          () => fetch(`https://hacker-news.firebaseio.com/v0/${category}.json`, {
            signal: AbortSignal.timeout(10000),
          }),
          { maxRetries: 2, label: `HN ${category}` }
        );

        if (!resp.ok) continue;
        const storyIds: number[] = await resp.json();

        // Fetch top 20 stories in batches of 5
        const topIds = storyIds.slice(0, 20);
        for (let i = 0; i < topIds.length; i += 5) {
          const batch = topIds.slice(i, i + 5);
          const stories = await Promise.all(
            batch.map(async (id) => {
              try {
                const sr = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
                  signal: AbortSignal.timeout(8000),
                });
                return sr.ok ? sr.json() : null;
              } catch { return null; }
            })
          );

          for (const story of stories) {
            if (story && story.score > 5 && story.title) {
              ideas.push({
                title: story.title,
                description: (story.text || story.url || '').slice(0, 500),
                problem: '',
                targetUsers: '',
                sourcePost: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
                sourcePlatform: 'hackernews',
                upvotes: story.score || 0,
                commentCount: story.descendants || 0,
                painLevel: story.score > 100 ? 'severe' : story.score > 30 ? 'moderate' : 'mild',
                tags: [category.replace('stories', '')],
              });
            }
          }
        }
      } catch {}
    }

    return ideas;
  }

  // HN Algolia Search API - search for pain points and product requests
  private async researchHNAlgolia(): Promise<RawIdea[]> {
    const ideas: RawIdea[] = [];
    const queries = [
      'need a tool for',
      'wish there was',
      'frustrated with',
      'looking for alternative',
      'side project idea',
      'would pay for',
    ];

    for (const query of queries.slice(0, 4)) {
      await this.rateLimiter.wait();
      try {
        const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=ask_hn&numericFilters=points>10&hitsPerPage=15`;
        const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!resp.ok) continue;

        const data = await resp.json();
        for (const hit of (data.hits || [])) {
          if (hit.title && hit.points > 5) {
            ideas.push({
              title: hit.title,
              description: (hit.story_text || hit.comment_text || hit.url || '').slice(0, 500),
              problem: '',
              targetUsers: '',
              sourcePost: `https://news.ycombinator.com/item?id=${hit.objectID}`,
              sourcePlatform: 'hackernews',
              upvotes: hit.points || 0,
              commentCount: hit.num_comments || 0,
              painLevel: hit.points > 100 ? 'severe' : hit.points > 30 ? 'moderate' : 'mild',
              tags: ['algolia-search', query.split(' ').slice(0, 2).join('-')],
            });
          }
        }
      } catch {}
    }

    return ideas;
  }

  // Dev.to public API - trending developer articles
  private async researchDevTo(): Promise<RawIdea[]> {
    const ideas: RawIdea[] = [];

    try {
      // Fetch top articles this week
      const resp = await retryLoop(
        () => fetch('https://dev.to/api/articles?top=7&per_page=30', {
          headers: { 'User-Agent': this.getUA() },
          signal: AbortSignal.timeout(10000),
        }),
        { maxRetries: 2, label: 'Dev.to articles' }
      );

      if (resp.ok) {
        const articles = await resp.json();
        for (const article of articles) {
          if (article.positive_reactions_count > 10) {
            ideas.push({
              title: article.title,
              description: (article.description || '').slice(0, 500),
              problem: '',
              targetUsers: '',
              sourcePost: article.url || article.canonical_url || `https://dev.to/${article.path}`,
              sourcePlatform: 'hackernews' as any, // categorize as tech source
              upvotes: article.positive_reactions_count || 0,
              commentCount: article.comments_count || 0,
              painLevel: article.positive_reactions_count > 100 ? 'severe' : article.positive_reactions_count > 30 ? 'moderate' : 'mild',
              tags: (article.tag_list || []).slice(0, 4),
            });
          }
        }
      }
    } catch (err) {
      await logger.agent(this.name, `Dev.to error: ${err}`);
    }

    return ideas;
  }

  // GitHub Trending - discover trending projects and tools
  private async researchGitHubTrending(): Promise<RawIdea[]> {
    const ideas: RawIdea[] = [];

    // Use GitHub Search API (no auth needed for basic queries)
    const searchQueries = [
      'stars:>50 created:>2026-02-01 topic:saas',
      'stars:>30 created:>2026-02-01 topic:developer-tools',
      'stars:>20 created:>2026-02-01 topic:productivity',
    ];

    for (const q of searchQueries) {
      await this.rateLimiter.wait();
      try {
        const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=10`;
        const headers: Record<string, string> = {
          'User-Agent': this.getUA(),
          'Accept': 'application/vnd.github.v3+json',
        };
        if (CONFIG.github.token) {
          headers['Authorization'] = `Bearer ${CONFIG.github.token}`;
        }

        const resp = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
        if (!resp.ok) continue;

        const data = await resp.json();
        for (const repo of (data.items || [])) {
          if (repo.stargazers_count > 10) {
            ideas.push({
              title: repo.name + ': ' + (repo.description || '').slice(0, 80),
              description: (repo.description || '') + (repo.topics ? ` [${repo.topics.join(', ')}]` : ''),
              problem: '',
              targetUsers: '',
              sourcePost: repo.html_url || '',
              sourcePlatform: 'hackernews' as any, // categorize as tech
              upvotes: repo.stargazers_count || 0,
              commentCount: repo.forks_count || 0,
              painLevel: repo.stargazers_count > 500 ? 'severe' : repo.stargazers_count > 100 ? 'moderate' : 'mild',
              tags: (repo.topics || []).slice(0, 4),
            });
          }
        }
      } catch {}
    }

    return ideas;
  }

  private async analyzePostsForIdeas(posts: RawIdea[]): Promise<RawIdea[]> {
    // Take top posts by engagement across all platforms
    const topPosts = posts
      .sort((a, b) => b.upvotes - a.upvotes)
      .slice(0, 40);

    const postSummaries = topPosts
      .map(p => `[${p.sourcePlatform}] [${p.upvotes} upvotes, ${p.commentCount} comments] ${p.title}\n${p.description.slice(0, 200)}\nSource: ${p.sourcePost}`)
      .join('\n---\n');

    const prompt = `You are a product research analyst. Analyze these REAL posts from Reddit, HackerNews, Dev.to, and GitHub and extract CONCRETE, BUILDABLE product ideas.

CRITICAL: These are REAL posts. Your ideas must be directly grounded in the problems, tools, and discussions in these posts. Do NOT invent ideas unrelated to the posts.

REAL POSTS:
${postSummaries}

Extract 8 product ideas that solve REAL problems visible in these posts. Each idea must:
1. Address a SPECIFIC pain point from the actual posts above (cite which post inspired it)
2. Be buildable as a working web app in 12-24 hours
3. Have REAL server-side functionality (not just a UI)
4. Be something people would actually PAY for
5. NOT be generic (no "todo app", "AI writer", "portfolio site")

For each idea, determine:
- The core PROBLEM being solved (from the actual posts)
- WHO specifically would use it
- What PAIN LEVEL it addresses (mild/moderate/severe)
- Which source post inspired this idea

Return ONLY valid JSON array:
[{
  "title": "Unique catchy product name",
  "description": "What it does - specific functionality",
  "problem": "The exact pain point from the posts",
  "targetUsers": "Specific audience (e.g., 'freelance developers who manage multiple clients')",
  "painLevel": "mild|moderate|severe",
  "tags": ["category1", "category2"]
}]`;

    try {
      const response = await retryLoop(
        () => kimi.complete(prompt, { maxTokens: 6000, temperature: 0.7 }),
        { maxRetries: 2, baseDelay: 5000, label: 'AI idea extraction' }
      );

      const parsed = extractJSON(response, 'array');
      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        // Map back to RawIdea format but keep reference to REAL source posts
        return parsed.map((idea: any, idx: number) => ({
          ...idea,
          sourcePost: topPosts[Math.min(idx, topPosts.length - 1)]?.sourcePost || topPosts[0]?.sourcePost || '',
          sourcePlatform: topPosts[Math.min(idx, topPosts.length - 1)]?.sourcePlatform || 'hackernews',
          upvotes: topPosts[Math.min(idx, topPosts.length - 1)]?.upvotes || 0,
          commentCount: topPosts[Math.min(idx, topPosts.length - 1)]?.commentCount || 0,
          painLevel: idea.painLevel || 'moderate',
          tags: idea.tags || [],
        }));
      }
    } catch (err) {
      await logger.agent(this.name, `Post analysis failed: ${err}`);
    }

    // If AI analysis fails, return raw posts as-is (still REAL data)
    await logger.agent(this.name, 'AI analysis failed, returning raw posts as ideas');
    return topPosts.slice(0, 10);
  }

  private deduplicateRawIdeas(ideas: RawIdea[]): RawIdea[] {
    const unique: RawIdea[] = [];
    for (const idea of ideas) {
      const isDup = unique.some(u => {
        const sim = keywordSimilarity(extractKeywords(u.title), extractKeywords(idea.title));
        return sim >= 0.5 || toSlug(u.title) === toSlug(idea.title);
      });
      if (!isDup) unique.push(idea);
    }
    return unique;
  }
}


// ============================================================
// AGENT 2: VALIDATION AGENT
// ============================================================
class ValidationAgent {
  private name = 'ValidationAgent';

  async run(rawIdeas: RawIdea[]): Promise<ValidatedIdea[]> {
    await logger.agent(this.name, `Validating ${rawIdeas.length} raw ideas...`);

    const existingProducts = await loadExistingProducts();
    const validated: ValidatedIdea[] = [];

    for (const rawIdea of rawIdeas) {
      // Skip duplicates against existing products
      const dupCheck = isDuplicate(rawIdea, existingProducts);
      if (dupCheck.duplicate) {
        await logger.agent(this.name, `SKIP duplicate: "${rawIdea.title}" matches "${dupCheck.matchedWith}"`);
        continue;
      }

      try {
        const result = await retryLoop(
          () => this.validateIdea(rawIdea),
          { maxRetries: 2, baseDelay: 5000, label: `Validate "${rawIdea.title.slice(0, 30)}"` }
        );
        if (result.validation.verdict === 'build') {
          validated.push(result);
          await logger.agent(this.name, `APPROVED: "${result.title}" (score: ${result.validation.overallScore}/10, angle: ${result.validation.uniqueAngle})`);
        } else {
          await logger.agent(this.name, `REJECTED: "${rawIdea.title}" - ${result.validation.reasoning}`);
        }
      } catch (err) {
        await logger.agent(this.name, `Validation error for "${rawIdea.title}": ${err}`);
      }
    }

    // Sort by overall score (best first)
    validated.sort((a, b) => b.validation.overallScore - a.validation.overallScore);

    await logger.agent(this.name, `Validation complete: ${validated.length}/${rawIdeas.length} approved`);
    return validated;
  }

  private async validateIdea(raw: RawIdea): Promise<ValidatedIdea> {
    const prompt = `You are a startup validation expert and market analyst. Deeply analyze this product idea.

IDEA:
Title: ${raw.title}
Description: ${raw.description}
Problem: ${raw.problem || 'Not specified'}
Target Users: ${raw.targetUsers || 'Not specified'}
Source: ${raw.sourcePlatform} (${raw.upvotes} upvotes, ${raw.commentCount} comments)
Pain Level: ${raw.painLevel}

VALIDATE THIS IDEA ON 5 DIMENSIONS (score each 1-10):

1. MARKET DEMAND (weight: 30%)
   - Is there proven demand for this? (social proof, search volume, competition)
   - Are people actively looking for solutions?
   - Would they switch from existing tools?

2. COMPETITION GAP (weight: 25%)
   - What existing tools solve this? List top 3 competitors
   - What's missing from current solutions?
   - Is there a clear UNIQUE ANGLE that differentiates?
   - A score of 10 = no direct competition, 1 = saturated market

3. TECHNICAL FEASIBILITY (weight: 15%)
   - Can this be built as a working MVP in 12-24 hours?
   - Does it need complex infrastructure or simple API calls?
   - Can it deliver real value with just Next.js + API routes?

4. MONETIZATION POTENTIAL (weight: 15%)
   - Would users pay for this? (free-only vs paid)
   - What pricing model works? (freemium, subscription, one-time)
   - What's the realistic MRR potential?

5. AUDIENCE FIT (weight: 15%)
   - Is the target audience clearly defined?
   - Can we reach them (marketing channels)?
   - What's their tech savviness and willingness to try new tools?

ALSO PROVIDE:
- Audience profile (demographics, psychographics, motivations, pain points)
- Product classification (ai-assisted, utility, data-tool, automation, saas-platform)
- Concrete features list (5-8 REAL features with server-side logic)
- Tech stack recommendation
- Type (web/mobile/saas/api)

CRITICAL: Only recommend "build" if overall weighted score >= 6.5/10 AND competition gap >= 5
Products that would just be "another X but with AI" get automatic SKIP unless the AI angle is truly novel.

Return ONLY valid JSON:
{
  "title": "Refined product name (make it catchy and unique)",
  "description": "Clear one-liner of what it does",
  "problem": "Specific pain point",
  "targetUsers": "Exact audience",
  "features": ["real feature 1 with server logic", "real feature 2", ...],
  "type": "web|mobile|saas|api",
  "category": "ai-assisted|utility|data-tool|automation|saas-platform",
  "techStack": "Next.js 14 + API Routes + specific tools",
  "estimatedHours": 12-24,
  "validation": {
    "marketDemand": 1-10,
    "competitionGap": 1-10,
    "technicalFeasibility": 1-10,
    "monetizationPotential": 1-10,
    "audienceFit": 1-10,
    "overallScore": weighted_average,
    "verdict": "build|skip|revisit",
    "reasoning": "Why this verdict",
    "competitors": ["competitor1", "competitor2"],
    "uniqueAngle": "What makes this different"
  },
  "audienceProfile": {
    "demographics": "Age, profession, location",
    "psychographics": "Values, interests, lifestyle",
    "painPoints": ["pain1", "pain2"],
    "motivations": ["motivation1", "motivation2"],
    "techSavviness": "low|medium|high",
    "priceWillingness": "free-only|low|medium|premium"
  }
}`;

    const response = await kimi.complete(prompt, {
      maxTokens: 4000,
      temperature: 0.3,
      systemPrompt: 'You are a ruthless startup validator. You reject mediocre ideas and only approve products with genuine market potential. Your validation is data-driven and your scores are honest, not inflated. Always return valid JSON.',
    });

    const parsed = extractJSON(response, 'object');
    if (!parsed || !parsed.validation) {
      throw new Error('Validation AI returned invalid format - no validation object found');
    }

    // Recalculate weighted score for honesty
    const v = parsed.validation;
    v.overallScore = Math.round((
      (v.marketDemand || 5) * 0.30 +
      (v.competitionGap || 5) * 0.25 +
      (v.technicalFeasibility || 5) * 0.15 +
      (v.monetizationPotential || 5) * 0.15 +
      (v.audienceFit || 5) * 0.15
    ) * 10) / 10;

    // Enforce verdict based on score
    if (v.overallScore < 6.5 || v.competitionGap < 5) {
      v.verdict = 'skip';
      v.reasoning = `Score ${v.overallScore}/10 (need 6.5+) or competition gap ${v.competitionGap}/10 (need 5+): ${v.reasoning}`;
    }

    return {
      id: crypto.randomUUID(),
      ...parsed,
      discoveredAt: raw.sourcePost ? new Date().toISOString() : new Date().toISOString(),
      validatedAt: new Date().toISOString(),
      sourcePost: raw.sourcePost,
      sourcePlatform: raw.sourcePlatform,
    };
  }
}


// ============================================================
// AGENT 3: FRONTEND AGENT
// ============================================================
class FrontendAgent {
  private name = 'FrontendAgent';

  async run(idea: ValidatedIdea): Promise<{ spec: FrontendSpec; files: Array<{ path: string; content: string }> }> {
    await logger.agent(this.name, `Designing frontend for "${idea.title}" targeting ${idea.audienceProfile.demographics}...`);

    // Step 1: Design the UX based on audience psychology (with retry + simplified fallback)
    let spec: FrontendSpec;
    try {
      spec = await retryLoop(
        () => this.designUX(idea),
        { maxRetries: 3, baseDelay: 5000, label: 'Frontend UX design' }
      );
    } catch (err) {
      await logger.agent(this.name, `Complex UX design failed, using audience-matched defaults...`);
      const isDev = idea.audienceProfile.techSavviness === 'high';
      spec = {
        designSystem: {
          primaryColor: isDev ? '#6366F1' : '#3B82F6',
          secondaryColor: isDev ? '#EC4899' : '#10B981',
          fontFamily: isDev ? 'JetBrains Mono' : 'Inter',
          borderRadius: isDev ? '6px' : '12px',
          darkMode: isDev,
          style: isDev ? 'tech' : 'minimal',
        },
        uxPatterns: ['Progressive disclosure', 'Immediate value demo', 'Minimal onboarding'],
        conversionElements: ['Free trial CTA', 'Feature comparison', 'Social proof'],
        pages: [
          { route: '/', purpose: 'Landing + demo', components: ['Hero', 'Demo', 'Features', 'CTA'], userFlow: 'Land -> See value -> Try demo -> Sign up' },
          { route: '/dashboard', purpose: 'Main workspace', components: ['Sidebar', 'MainContent', 'ActionBar'], userFlow: 'Navigate -> Use features -> See results' },
        ],
        psychologyTactics: ['Reciprocity: show free value first', 'Commitment: progressive feature unlock'],
        accessibilityLevel: 'AA',
      };
    }
    await logger.agent(this.name, `UX design: ${spec.designSystem.style} style, ${spec.pages.length} pages, ${spec.psychologyTactics.length} psychology tactics`);

    // Step 2: Generate all frontend files (with retry)
    const files = await retryLoop(
      () => this.generateFrontendFiles(idea, spec),
      { maxRetries: 3, baseDelay: 5000, label: 'Frontend code generation' }
    );
    await logger.agent(this.name, `Generated ${files.length} frontend files`);

    return { spec, files };
  }

  private async designUX(idea: ValidatedIdea): Promise<FrontendSpec> {
    const prompt = `You are a UX psychologist and conversion rate optimization expert. Design the frontend experience for this product.

PRODUCT: ${idea.title}
DESCRIPTION: ${idea.description}
TARGET AUDIENCE:
- Demographics: ${idea.audienceProfile.demographics}
- Psychographics: ${idea.audienceProfile.psychographics}
- Pain Points: ${idea.audienceProfile.painPoints.join(', ')}
- Motivations: ${idea.audienceProfile.motivations.join(', ')}
- Tech Savviness: ${idea.audienceProfile.techSavviness}
- Price Willingness: ${idea.audienceProfile.priceWillingness}

FEATURES TO BUILD: ${idea.features.join(', ')}

DESIGN THE COMPLETE UX:

1. DESIGN SYSTEM - Choose colors, fonts, and style that RESONATE with this specific audience:
   - Tech-savvy devs? Use dark theme, monospace accents, terminal aesthetic
   - Business users? Clean, corporate, trust-building blues/greens
   - Creators? Bold, playful, expressive with bright accents
   - Health/wellness? Calm, natural, organic tones
   - Finance? Professional, data-dense, confidence-inspiring
   MATCH THE AUDIENCE, don't use generic gradients

2. UX PATTERNS - What patterns keep this specific audience engaged?
   - Progressive disclosure for complex features
   - Immediate value demonstration (show results fast)
   - Social proof placement (if B2C)
   - Data density vs simplicity trade-off
   - Onboarding flow design

3. CONVERSION ELEMENTS - What drives this audience to act?
   - CTAs that speak their language
   - Trust signals relevant to their concerns
   - Friction reduction for their specific workflow

4. PAGE STRUCTURE - Map every page with its purpose and user flow

5. PSYCHOLOGY TACTICS - Specific behavioral psychology principles:
   - Loss aversion, social proof, anchoring, reciprocity, etc.
   - Which ones work for THIS audience specifically?

Return ONLY valid JSON:
{
  "designSystem": {
    "primaryColor": "#hex (audience-appropriate)",
    "secondaryColor": "#hex",
    "fontFamily": "font name",
    "borderRadius": "size (e.g., '8px' for modern, '2px' for corporate, '16px' for playful)",
    "darkMode": boolean,
    "style": "minimal|bold|playful|corporate|tech"
  },
  "uxPatterns": ["pattern1 for this audience", "pattern2", ...],
  "conversionElements": ["CTA strategy", "trust signal", ...],
  "pages": [
    {
      "route": "/",
      "purpose": "Landing + immediate value demo",
      "components": ["Hero", "FeatureDemo", "Testimonials"],
      "userFlow": "User lands -> sees value prop -> tries demo -> signs up"
    }
  ],
  "psychologyTactics": ["tactic1: how it applies", "tactic2", ...],
  "accessibilityLevel": "basic|AA|AAA"
}`;

    const response = await kimi.complete(prompt, {
      maxTokens: 4000,
      temperature: 0.6,
      systemPrompt: 'You are a senior UX designer who understands behavioral psychology. You design interfaces that genuinely serve users while driving conversions. Every design decision is backed by a psychological principle specific to the target audience.',
    });

    const parsed = extractJSON(response, 'object');
    if (!parsed || !parsed.designSystem) {
      throw new Error('Frontend UX design AI failed to return valid design - will retry');
    }

    return parsed as FrontendSpec;
  }

  private async generateFrontendFiles(idea: ValidatedIdea, spec: FrontendSpec): Promise<Array<{ path: string; content: string }>> {
    const pagesDescription = spec.pages.map(p =>
      `- Route: ${p.route} | Purpose: ${p.purpose} | Components: ${p.components.join(', ')} | Flow: ${p.userFlow}`
    ).join('\n');

    const prompt = `Generate COMPLETE, PRODUCTION-QUALITY frontend code for this application.

PRODUCT: ${idea.title}
DESCRIPTION: ${idea.description}
FEATURES: ${idea.features.join(', ')}

DESIGN SYSTEM:
- Primary: ${spec.designSystem.primaryColor}
- Secondary: ${spec.designSystem.secondaryColor}
- Font: ${spec.designSystem.fontFamily}
- Border Radius: ${spec.designSystem.borderRadius}
- Dark Mode: ${spec.designSystem.darkMode}
- Style: ${spec.designSystem.style}

UX PATTERNS: ${spec.uxPatterns.join(', ')}
CONVERSION: ${spec.conversionElements.join(', ')}
PSYCHOLOGY: ${spec.psychologyTactics.join(', ')}

PAGES TO BUILD:
${pagesDescription}

STRICT REQUIREMENTS:
1. Use Next.js 14 App Router (src/app/ directory)
2. TypeScript with 'use client' directive on interactive components
3. TailwindCSS only - NO component libraries, NO shadcn/ui
4. CUSTOM design matching the design system above (not generic dark gradient)
5. Every feature button must call a real API route (fetch('/api/...'))
6. Loading states with skeleton/spinner for all async operations
7. Error states with retry buttons
8. Responsive design (mobile-first with md: and lg: breakpoints)
9. Animations using CSS transitions (not framer-motion for simplicity)
10. Form validation with clear error messages
11. Toast/notification system for user feedback
12. Proper state management with React hooks

CRITICAL CSS RULES:
- Use the EXACT colors from the design system (${spec.designSystem.primaryColor}, ${spec.designSystem.secondaryColor})
- Match the style (${spec.designSystem.style}) throughout
- ${spec.designSystem.darkMode ? 'Dark background with light text' : 'Light background with dark text'}
- Border radius: ${spec.designSystem.borderRadius}
- Font: ${spec.designSystem.fontFamily} (import from Google Fonts in layout.tsx)

Generate ONLY these frontend files:
- src/app/layout.tsx (with proper metadata, font import, global styles)
- src/app/page.tsx (landing page with immediate value demo)
- src/app/globals.css (TailwindCSS + custom CSS variables for design system)
- src/components/*.tsx (all reusable components)
${spec.pages.filter(p => p.route !== '/').map(p => `- src/app${p.route}/page.tsx`).join('\n')}

Do NOT generate:
- package.json (backend agent handles this)
- API routes (backend agent handles this)
- Config files (PM agent handles this)

Return ONLY a JSON array:
[{"path": "src/app/layout.tsx", "content": "full code..."}, ...]`;

    const response = await kimi.complete(prompt, {
      maxTokens: 30000,
      temperature: 0.4,
      systemPrompt: `You are an elite frontend developer who builds beautiful, conversion-optimized interfaces. Your code is clean, accessible, and performant. You NEVER use generic dark gradients or boilerplate designs - every interface is unique and tailored to the target audience. Style: ${spec.designSystem.style}. You write production-quality React/TypeScript.`,
    });

    const files = extractJSON(response, 'array');
    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new Error('Frontend generation returned no files');
    }

    return files.filter((f: any) => f && typeof f.path === 'string' && typeof f.content === 'string');
  }
}


// ============================================================
// AGENT 4: BACKEND AGENT
// ============================================================
class BackendAgent {
  private name = 'BackendAgent';

  async run(idea: ValidatedIdea): Promise<{ spec: BackendSpec; files: Array<{ path: string; content: string }> }> {
    await logger.agent(this.name, `Designing backend for "${idea.title}" (${idea.category})...`);

    // Step 1: Design the complete backend architecture (with retry + simplified fallback)
    let spec: BackendSpec;
    try {
      spec = await retryLoop(
        () => this.designBackend(idea),
        { maxRetries: 3, baseDelay: 5000, label: 'Backend architecture design' }
      );
    } catch (err) {
      await logger.agent(this.name, `Complex backend design failed, trying simplified prompt...`);
      spec = await this.designBackendSimplified(idea);
    }
    await logger.agent(this.name, `Backend design: ${spec.apiRoutes.length} API routes, ${spec.dataModels.length} data models, ${spec.integrations.length} integrations`);

    // Step 2: Generate all backend files with REAL implementations (with retry)
    const files = await retryLoop(
      () => this.generateBackendFiles(idea, spec),
      { maxRetries: 3, baseDelay: 5000, label: 'Backend code generation' }
    );
    await logger.agent(this.name, `Generated ${files.length} backend files`);

    return { spec, files };
  }

  private async designBackend(idea: ValidatedIdea): Promise<BackendSpec> {
    const prompt = `You are a senior backend architect. Design the COMPLETE backend for this product.

PRODUCT: ${idea.title}
DESCRIPTION: ${idea.description}
CATEGORY: ${idea.category}
FEATURES: ${idea.features.join(', ')}

Design a backend that is:
1. FULLY FUNCTIONAL - every endpoint does real processing
2. PROPERLY STRUCTURED - clear separation of concerns
3. PRODUCTION-READY - proper error handling, validation, security
4. WELL-INTEGRATED - uses real APIs where the category demands it

${idea.category === 'ai-assisted' ? `
AI INTEGRATION REQUIREMENTS:
- Use NVIDIA Kimi K2.5 API (https://integrate.api.nvidia.com/v1/chat/completions)
- Model: moonshotai/kimi-k2.5
- Auth: Bearer token from process.env.NVIDIA_API_KEY
- Include meaningful system prompts tailored to this specific product
- Include graceful fallback processing when API key is not available
- The AI must do something SPECIFIC and USEFUL, not generic analysis
` : ''}

${idea.category === 'utility' || idea.category === 'data-tool' ? `
DATA PROCESSING REQUIREMENTS:
- Implement REAL algorithms (not just echo input)
- Process, transform, validate, or analyze data meaningfully
- Return structured results with metrics/insights
- Handle edge cases and malformed input gracefully
` : ''}

${idea.category === 'automation' ? `
AUTOMATION REQUIREMENTS:
- Implement real workflow logic (not just timers)
- Process events and trigger actions
- Handle scheduling and state management
- Provide execution logs and status tracking
` : ''}

For each API route, specify:
- HTTP method and path
- Exact input/output schemas
- Implementation approach (what it actually does)

Return ONLY valid JSON:
{
  "apiRoutes": [
    {
      "method": "POST",
      "path": "/api/specific-action",
      "purpose": "What this endpoint does",
      "inputSchema": "{ input: string, options?: object }",
      "outputSchema": "{ result: object, metadata: object }",
      "implementation": "Detailed description of the processing logic"
    }
  ],
  "dataModels": [
    {
      "name": "ModelName",
      "fields": ["field1: type", "field2: type"],
      "relationships": "How it relates to other models"
    }
  ],
  "integrations": [
    {
      "service": "Service name",
      "purpose": "Why we use it",
      "apiEndpoint": "URL",
      "authMethod": "Bearer token / API key / OAuth"
    }
  ],
  "authentication": "none|basic|jwt",
  "errorHandling": "Strategy description",
  "realTimeFeatures": ["feature1", "feature2"]
}`;

    const response = await kimi.complete(prompt, {
      maxTokens: 4000,
      temperature: 0.3,
      systemPrompt: 'You are a backend architect who builds robust, scalable APIs. Every endpoint you design has real processing logic, proper error handling, and clear documentation. You never create stub endpoints.',
    });

    const parsed = extractJSON(response, 'object');
    if (!parsed || !parsed.apiRoutes) {
      throw new Error('Backend architecture AI failed to return valid design - will retry');
    }

    return parsed as BackendSpec;
  }

  private async designBackendSimplified(idea: ValidatedIdea): Promise<BackendSpec> {
    const prompt = `Design a simple backend for "${idea.title}" (${idea.category}).
Features: ${idea.features.join(', ')}

Return ONLY this JSON (no markdown, no explanation):
{"apiRoutes":[{"method":"POST","path":"/api/analyze","purpose":"Main processing","inputSchema":"{ input: string }","outputSchema":"{ result: object }","implementation":"Process input and return results"},{"method":"GET","path":"/api/health","purpose":"Health check","inputSchema":"none","outputSchema":"{ status: string }","implementation":"Return service status"}],"dataModels":[{"name":"Item","fields":["id: string","data: string","createdAt: string"],"relationships":"standalone"}],"integrations":[],"authentication":"none","errorHandling":"try-catch with JSON error responses","realTimeFeatures":[]}`;

    const response = await kimi.complete(prompt, { maxTokens: 2000, temperature: 0.2 });
    const parsed = extractJSON(response, 'object');
    if (!parsed || !parsed.apiRoutes) {
      // Absolute minimum fallback - still real architecture, not placeholder content
      return {
        apiRoutes: idea.features.slice(0, 4).map((f, i) => ({
          method: 'POST' as const,
          path: `/api/${toSlug(f.split(' ').slice(0, 3).join('-'))}`,
          purpose: f,
          inputSchema: '{ input: string, options?: object }',
          outputSchema: '{ result: object, metadata: object }',
          implementation: `Process: ${f}. Validate input, apply logic, return structured result.`,
        })),
        dataModels: [{ name: 'Item', fields: ['id: string', 'data: any', 'createdAt: Date'], relationships: 'none' }],
        integrations: idea.category === 'ai-assisted'
          ? [{ service: 'NVIDIA Kimi K2.5', purpose: 'AI processing', apiEndpoint: 'https://integrate.api.nvidia.com/v1/chat/completions', authMethod: 'Bearer token' }]
          : [],
        authentication: 'none',
        errorHandling: 'Try-catch with structured JSON error responses',
        realTimeFeatures: [],
      };
    }
    return parsed as BackendSpec;
  }

  private async generateBackendFiles(idea: ValidatedIdea, spec: BackendSpec): Promise<Array<{ path: string; content: string }>> {
    const routeDescriptions = spec.apiRoutes.map(r =>
      `${r.method} ${r.path}: ${r.purpose}\n  Input: ${r.inputSchema}\n  Output: ${r.outputSchema}\n  Logic: ${r.implementation}`
    ).join('\n\n');

    const integrationsDesc = spec.integrations.map(i =>
      `- ${i.service}: ${i.purpose} (${i.apiEndpoint}, auth: ${i.authMethod})`
    ).join('\n');

    const prompt = `Generate COMPLETE, WORKING backend code for this application. Every function must be fully implemented.

PRODUCT: ${idea.title} (${idea.category})
FEATURES: ${idea.features.join(', ')}

API ROUTES TO IMPLEMENT:
${routeDescriptions}

INTEGRATIONS:
${integrationsDesc}

DATA MODELS:
${spec.dataModels.map(m => `${m.name}: ${m.fields.join(', ')}`).join('\n')}

STRICT REQUIREMENTS:
1. EVERY API route must be FULLY IMPLEMENTED (not stubs)
2. All processing must happen server-side in Next.js API routes
3. Each route must validate input with clear error messages
4. Each route must return properly structured JSON responses
5. Include proper TypeScript types for all inputs/outputs
6. Error handling: catch errors, return meaningful messages with status codes
7. Rate limiting headers on API responses

${idea.category === 'ai-assisted' ? `
AI IMPLEMENTATION (CRITICAL):
- Use NVIDIA Kimi K2.5 API: https://integrate.api.nvidia.com/v1/chat/completions
- Model: moonshotai/kimi-k2.5
- API key from: process.env.NVIDIA_API_KEY
- Write a SPECIFIC system prompt for each AI endpoint (not generic "analyze this")
- Example: if the product analyzes resumes, the system prompt should say "You are a professional resume analyst..."
- Include SMART fallback processing when API key is missing
- The fallback must still provide USEFUL results using regex, algorithms, or heuristics
` : ''}

${idea.category === 'utility' || idea.category === 'data-tool' ? `
DATA PROCESSING (CRITICAL):
- Implement REAL algorithms, not just pass-through
- String processing: use regex, tokenization, NLP heuristics
- Number processing: implement actual calculations, statistics
- Data transformation: proper mapping, filtering, aggregation
- Always return structured results with metadata (counts, scores, timings)
` : ''}

GENERATE THESE FILES:
- src/app/api/*/route.ts (one per API route, with FULL implementation)
- src/lib/services/*.ts (service layer with business logic)
- src/lib/types.ts (shared TypeScript types)
- src/lib/utils.ts (utility functions)

Do NOT generate:
- Frontend files (frontend agent handles those)
- Layout/page components
- Config files (PM agent handles those)

Return ONLY a JSON array:
[{"path": "src/app/api/process/route.ts", "content": "full working code..."}, ...]`;

    const response = await kimi.complete(prompt, {
      maxTokens: 30000,
      temperature: 0.2,
      systemPrompt: `You are a senior backend engineer who writes bulletproof API code. Every endpoint you create is fully functional with real processing logic, proper validation, error handling, and structured responses. You NEVER create placeholder functions - every function has a complete implementation. For ${idea.category} products, you implement real algorithms.`,
    });

    const files = extractJSON(response, 'array');
    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new Error('Backend generation returned no files');
    }

    // Validate that API routes are real (not stubs)
    const apiFiles = files.filter((f: any) => f.path?.includes('/api/'));
    for (const apiFile of apiFiles) {
      if (apiFile.content && apiFile.content.length < 200) {
        await logger.agent(this.name, `WARNING: API route ${apiFile.path} seems too short (${apiFile.content.length} chars), may be a stub`);
      }
    }

    return files.filter((f: any) => f && typeof f.path === 'string' && typeof f.content === 'string');
  }
}


// ============================================================
// AGENT 5: PM AGENT (Orchestrator)
// ============================================================
class PMAgent {
  private name = 'PMAgent';
  private researchAgent = new ResearchAgent();
  private validationAgent = new ValidationAgent();
  private frontendAgent = new FrontendAgent();
  private backendAgent = new BackendAgent();

  async runFullPipeline(): Promise<BuildResult> {
    await logger.agent(this.name, '========== FULL PIPELINE START ==========');
    const startTime = Date.now();

    try {
      // PHASE 1: Research
      await logger.agent(this.name, 'PHASE 1: Research Agent deployed...');
      const rawIdeas = await this.researchAgent.run();

      if (rawIdeas.length === 0) {
        await logger.agent(this.name, 'No raw ideas found. Pipeline paused.');
        return { success: false, projectPath: '', githubUrl: '', vercelUrl: '', qualityScore: 0, error: 'No ideas' };
      }

      // PHASE 2: Validation
      await logger.agent(this.name, `PHASE 2: Validation Agent analyzing ${rawIdeas.length} ideas...`);
      const validatedIdeas = await this.validationAgent.run(rawIdeas);

      if (validatedIdeas.length === 0) {
        await logger.agent(this.name, 'No ideas passed validation. Pipeline paused.');
        return { success: false, projectPath: '', githubUrl: '', vercelUrl: '', qualityScore: 0, error: 'All ideas rejected' };
      }

      // Save validated ideas
      await this.saveValidatedIdeas(validatedIdeas);

      // Pick the best validated idea
      const bestIdea = validatedIdeas[0]; // Already sorted by score
      await logger.agent(this.name, `SELECTED: "${bestIdea.title}" (score: ${bestIdea.validation.overallScore}/10)`);

      // Check fail tracker
      const failCount = (await loadFailTracker())[bestIdea.id]?.count || 0;
      if (failCount >= 3) {
        await logger.agent(this.name, `"${bestIdea.title}" has failed 3+ times, skipping`);
        return { success: false, projectPath: '', githubUrl: '', vercelUrl: '', qualityScore: 0, error: 'Max retries exceeded' };
      }

      // PHASE 3: Parallel Frontend + Backend Generation
      await logger.agent(this.name, 'PHASE 3: Frontend & Backend Agents working in PARALLEL...');

      const [frontendResult, backendResult] = await Promise.all([
        this.frontendAgent.run(bestIdea),
        this.backendAgent.run(bestIdea),
      ]);

      // PHASE 4: Merge & Quality Check
      await logger.agent(this.name, 'PHASE 4: Merging frontend + backend and running quality checks...');
      const mergedFiles = await this.mergeAndFinalize(bestIdea, frontendResult, backendResult);

      // Quality gate
      const quality = this.assessQuality(mergedFiles, bestIdea);
      await logger.agent(this.name, `Quality score: ${quality.score}/20 | Issues: ${quality.issues.length > 0 ? quality.issues.join('; ') : 'none'}`);

      if (quality.score < 10) {
        await logger.agent(this.name, `Quality too low (${quality.score}/20), attempting fix...`);
        // Try to fix the most critical issues
        const fixedFiles = await this.fixQualityIssues(mergedFiles, bestIdea, quality.issues);
        const recheck = this.assessQuality(fixedFiles, bestIdea);
        if (recheck.score >= 10) {
          await logger.agent(this.name, `Fixed! New score: ${recheck.score}/20`);
          return this.buildAndDeploy(bestIdea, fixedFiles, recheck.score);
        }
      }

      // PHASE 5: Build & Deploy
      return this.buildAndDeploy(bestIdea, mergedFiles, quality.score);

    } catch (error) {
      const errStr = String(error).slice(0, 300);
      await logger.agent(this.name, `PIPELINE ERROR: ${errStr}`);
      return { success: false, projectPath: '', githubUrl: '', vercelUrl: '', qualityScore: 0, error: errStr };
    } finally {
      const duration = Math.round((Date.now() - startTime) / 1000);
      await logger.agent(this.name, `========== PIPELINE COMPLETE (${duration}s) ==========`);
    }
  }

  async runBuildFromQueue(): Promise<BuildResult> {
    // Build from already-validated ideas in queue
    try {
      const validatedDir = CONFIG.paths.validated;
      const files = await fs.readdir(validatedDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      if (jsonFiles.length === 0) {
        await logger.agent(this.name, 'No validated ideas in queue');
        return { success: false, projectPath: '', githubUrl: '', vercelUrl: '', qualityScore: 0, error: 'Empty queue' };
      }

      // Sort by score
      const ideas: ValidatedIdea[] = [];
      for (const f of jsonFiles) {
        try {
          const content = await fs.readFile(path.join(validatedDir, f), 'utf-8');
          ideas.push(JSON.parse(content));
        } catch {}
      }
      ideas.sort((a, b) => (b.validation?.overallScore || 0) - (a.validation?.overallScore || 0));

      // Skip failed ideas
      const failTracker = await loadFailTracker();
      const buildable = ideas.find(i => (failTracker[i.id]?.count || 0) < 3);
      if (!buildable) {
        await logger.agent(this.name, 'All validated ideas have failed too many times');
        return { success: false, projectPath: '', githubUrl: '', vercelUrl: '', qualityScore: 0, error: 'All ideas exhausted' };
      }

      await logger.agent(this.name, `Building from queue: "${buildable.title}" (score: ${buildable.validation.overallScore}/10)`);

      // Run frontend + backend in parallel
      const [frontendResult, backendResult] = await Promise.all([
        this.frontendAgent.run(buildable),
        this.backendAgent.run(buildable),
      ]);

      const mergedFiles = await this.mergeAndFinalize(buildable, frontendResult, backendResult);
      const quality = this.assessQuality(mergedFiles, buildable);

      return this.buildAndDeploy(buildable, mergedFiles, quality.score);
    } catch (error) {
      return { success: false, projectPath: '', githubUrl: '', vercelUrl: '', qualityScore: 0, error: String(error) };
    }
  }

  private async mergeAndFinalize(
    idea: ValidatedIdea,
    frontendResult: { spec: FrontendSpec; files: Array<{ path: string; content: string }> },
    backendResult: { spec: BackendSpec; files: Array<{ path: string; content: string }> }
  ): Promise<Array<{ path: string; content: string }>> {
    const allFiles: Array<{ path: string; content: string }> = [];
    const fileMap = new Map<string, string>();

    // Add frontend files
    for (const f of frontendResult.files) {
      fileMap.set(f.path, f.content);
    }

    // Add backend files (won't overwrite frontend since paths differ)
    for (const f of backendResult.files) {
      fileMap.set(f.path, f.content);
    }

    // Generate config files
    const projectSlug = toSlug(idea.title);

    // package.json - scan all files for imports
    const allImports = new Set<string>();
    for (const [, content] of fileMap) {
      const importMatches = Array.from(content.matchAll(/from\s+['"]([^.@/][^'"]*?)(?:\/[^'"]*)?['"]/g));
      for (const m of importMatches) allImports.add(m[1]);
      const scopedMatches = Array.from(content.matchAll(/from\s+['"]((@[^/'"]+\/[^/'"]+)(?:\/[^'"]*)?)['"]/g));
      for (const m of scopedMatches) allImports.add(m[2]);
    }

    const builtins = new Set(['react', 'react-dom', 'next', 'fs', 'path', 'crypto', 'url', 'http', 'https', 'stream', 'util', 'events', 'os', 'child_process', 'buffer', 'querystring']);
    const deps: Record<string, string> = {
      next: KNOWN_PACKAGES['next'],
      react: KNOWN_PACKAGES['react'],
      'react-dom': KNOWN_PACKAGES['react-dom'],
    };
    const devDeps: Record<string, string> = {
      typescript: KNOWN_PACKAGES['typescript'],
      '@types/node': KNOWN_PACKAGES['@types/node'],
      '@types/react': KNOWN_PACKAGES['@types/react'],
      '@types/react-dom': KNOWN_PACKAGES['@types/react-dom'],
      tailwindcss: KNOWN_PACKAGES['tailwindcss'],
      autoprefixer: KNOWN_PACKAGES['autoprefixer'],
      postcss: KNOWN_PACKAGES['postcss'],
    };

    for (const imp of allImports) {
      if (builtins.has(imp)) continue;
      if (!deps[imp] && !devDeps[imp]) {
        deps[imp] = KNOWN_PACKAGES[imp] || 'latest';
      }
    }

    fileMap.set('package.json', JSON.stringify({
      name: projectSlug,
      version: '1.0.0',
      private: true,
      scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
      dependencies: deps,
      devDependencies: devDeps,
    }, null, 2));

    // next.config.js
    fileMap.set('next.config.js', `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },
}
module.exports = nextConfig
`);

    // tsconfig.json
    fileMap.set('tsconfig.json', JSON.stringify({
      compilerOptions: {
        lib: ['dom', 'dom.iterable', 'esnext'],
        allowJs: true, skipLibCheck: true, strict: true, noEmit: true,
        esModuleInterop: true, module: 'esnext', moduleResolution: 'bundler',
        resolveJsonModule: true, isolatedModules: true, jsx: 'preserve',
        incremental: true, plugins: [{ name: 'next' }],
        paths: { '@/*': ['./src/*'] },
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules'],
    }, null, 2));

    // tailwind.config.ts
    fileMap.set('tailwind.config.ts', `import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}', './app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: '${frontendResult.spec.designSystem.primaryColor}',
        secondary: '${frontendResult.spec.designSystem.secondaryColor}',
      },
      borderRadius: {
        custom: '${frontendResult.spec.designSystem.borderRadius}',
      },
    },
  },
  ${frontendResult.spec.designSystem.darkMode ? "darkMode: 'class'," : ''}
  plugins: [],
}
export default config
`);

    // postcss.config.js
    fileMap.set('postcss.config.js', `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`);

    // vercel.json
    fileMap.set('vercel.json', JSON.stringify({
      "$schema": "https://openapi.vercel.sh/vercel.json",
      framework: "nextjs",
      buildCommand: "next build",
      installCommand: "npm install --legacy-peer-deps",
      outputDirectory: ".next",
    }, null, 2));

    // .env.example
    const envVars: string[] = [];
    if (idea.category === 'ai-assisted') {
      envVars.push('# AI API Configuration');
      envVars.push('NVIDIA_API_KEY=your_nvidia_api_key_here');
      envVars.push('# Get your key at: https://build.nvidia.com/');
    }
    envVars.push('');
    envVars.push('# App Configuration');
    envVars.push(`NEXT_PUBLIC_APP_NAME=${idea.title}`);
    fileMap.set('.env.example', envVars.join('\n'));

    // Ensure utils.ts exists
    if (!fileMap.has('src/lib/utils.ts')) {
      fileMap.set('src/lib/utils.ts', `export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '...' : str;
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
`);
    }

    // README.md
    fileMap.set('README.md', `# ${idea.title}

${idea.description}

## Problem
${idea.problem}

## Target Users
${idea.targetUsers}

## Features
${idea.features.map(f => `- ${f}`).join('\n')}

## Getting Started

\`\`\`bash
npm install
cp .env.example .env.local
# Configure your environment variables
npm run dev
\`\`\`

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
${idea.category === 'ai-assisted' ? '- NVIDIA Kimi K2.5 AI API' : ''}

## Validation Score: ${idea.validation.overallScore}/10
- Market Demand: ${idea.validation.marketDemand}/10
- Competition Gap: ${idea.validation.competitionGap}/10
- Unique Angle: ${idea.validation.uniqueAngle}

Built by MVP Factory v11 (Multi-Agent Architecture)
`);

    // Convert map to array
    for (const [filePath, content] of fileMap) {
      allFiles.push({ path: filePath, content });
    }

    return allFiles;
  }

  private assessQuality(files: Array<{ path: string; content: string }>, idea: ValidatedIdea): { score: number; issues: string[] } {
    let score = 0;
    const issues: string[] = [];
    const allContent = files.map(f => f.content).join('\n');

    // 1. Has API routes with real logic (4 points)
    const apiFiles = files.filter(f => f.path.includes('/api/') && f.path.endsWith('route.ts'));
    if (apiFiles.length > 0) {
      score += 2;
      const hasRealLogic = apiFiles.some(f => f.content.length > 500 && (f.content.includes('fetch(') || f.content.includes('process') || f.content.includes('JSON.parse')));
      if (hasRealLogic) score += 2;
      else issues.push('API routes may be stubs');
    } else {
      issues.push('No API routes found');
    }

    // 2. Frontend calls API (3 points)
    const clientFiles = files.filter(f => f.path.endsWith('.tsx') && !f.path.includes('/api/'));
    const callsApi = clientFiles.some(f => f.content.includes("fetch('/api/") || f.content.includes('fetch("/api/') || f.content.includes('fetch(`/api/'));
    if (callsApi) score += 3;
    else issues.push('Frontend does not call API routes');

    // 3. No localStorage abuse (2 points)
    const localStorageCount = (allContent.match(/localStorage\.(set|get|remove)Item/g) || []).length;
    if (localStorageCount < 5) score += 2;
    else issues.push(`Overuses localStorage (${localStorageCount} calls)`);

    // 4. Error handling (2 points)
    if (allContent.includes('catch') && allContent.includes('error')) score += 2;
    else issues.push('Missing error handling');

    // 5. Loading states (2 points)
    if (allContent.includes('loading') || allContent.includes('isLoading') || allContent.includes('Loading')) score += 2;
    else issues.push('No loading states');

    // 6. Responsive design (2 points)
    if (allContent.includes('md:') || allContent.includes('lg:') || allContent.includes('sm:')) score += 2;
    else issues.push('Not responsive');

    // 7. Sufficient files (2 points)
    if (files.length >= 10) score += 2;
    else if (files.length >= 7) score += 1;
    else issues.push(`Only ${files.length} files`);

    // 8. Design system applied (1 point)
    if (allContent.includes('primary') || allContent.includes(idea.title)) score += 1;

    return { score, issues };
  }

  private async fixQualityIssues(
    files: Array<{ path: string; content: string }>,
    idea: ValidatedIdea,
    issues: string[]
  ): Promise<Array<{ path: string; content: string }>> {
    const result = [...files];

    // Fix missing API routes
    if (issues.some(i => i.includes('No API routes'))) {
      if (idea.category === 'ai-assisted') {
        result.push({
          path: 'src/app/api/analyze/route.ts',
          content: this.generateFallbackAIRoute(idea),
        });
      } else {
        result.push({
          path: 'src/app/api/process/route.ts',
          content: this.generateFallbackUtilityRoute(idea),
        });
      }
    }

    return result;
  }

  private generateFallbackAIRoute(idea: ValidatedIdea): string {
    const featuresStr = idea.features.map(f => 'You can: ' + f).join('. ');
    const lines = [
      "import { NextRequest, NextResponse } from 'next/server';",
      "",
      "const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '';",
      "const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';",
      "",
      "export async function POST(request: NextRequest) {",
      "  try {",
      "    const body = await request.json();",
      "    const { input, mode } = body;",
      "",
      "    if (!input || typeof input !== 'string' || input.trim().length === 0) {",
      "      return NextResponse.json({ error: 'Input is required and must be a non-empty string' }, { status: 400 });",
      "    }",
      "",
      "    if (!NVIDIA_API_KEY) {",
      "      return NextResponse.json({",
      "        result: fallbackProcess(input, mode),",
      "        source: 'local-processing',",
      "        note: 'AI API key not configured. Using local processing.',",
      "        timestamp: new Date().toISOString(),",
      "      });",
      "    }",
      "",
      "    const systemPrompt = 'You are " + idea.title + ", an AI assistant specialized in: " + idea.description.replace(/'/g, "\\'") + ". " + featuresStr.replace(/'/g, "\\'") + ". Provide detailed, actionable results.';",
      "",
      "    const response = await fetch(NVIDIA_API_URL, {",
      "      method: 'POST',",
      "      headers: {",
      "        'Authorization': 'Bearer ' + NVIDIA_API_KEY,",
      "        'Content-Type': 'application/json',",
      "      },",
      "      body: JSON.stringify({",
      "        model: 'moonshotai/kimi-k2.5',",
      "        messages: [",
      "          { role: 'system', content: systemPrompt },",
      "          { role: 'user', content: input },",
      "        ],",
      "        max_tokens: 4096,",
      "        temperature: 0.7,",
      "      }),",
      "    });",
      "",
      "    if (!response.ok) {",
      "      return NextResponse.json({",
      "        result: fallbackProcess(input, mode),",
      "        source: 'fallback',",
      "        timestamp: new Date().toISOString(),",
      "      });",
      "    }",
      "",
      "    const data = await response.json();",
      "    return NextResponse.json({",
      "      result: data.choices?.[0]?.message?.content || '',",
      "      source: 'kimi-k2.5',",
      "      timestamp: new Date().toISOString(),",
      "    });",
      "  } catch (error) {",
      "    console.error('API error:', error);",
      "    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });",
      "  }",
      "}",
      "",
      "function fallbackProcess(input: string, mode?: string): string {",
      "  const words = input.split(/\\\\s+/);",
      "  const sentences = input.split(/[.!?]+/).filter(Boolean);",
      "  return 'Analysis: ' + words.length + ' words, ' + sentences.length + ' sentences. Key terms: ' + [...new Set(words.filter(w => w.length > 4))].slice(0, 10).join(', ');",
      "}",
      "",
      "export async function GET() {",
      "  return NextResponse.json({ status: 'healthy', service: '" + idea.title + "', timestamp: new Date().toISOString() });",
      "}",
    ];
    return lines.join('\n');
  }

  private generateFallbackUtilityRoute(idea: ValidatedIdea): string {
    return `import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, operation } = body;

    if (!data) {
      return NextResponse.json({ error: 'Data is required' }, { status: 400 });
    }

    const result = processData(data, operation);
    return NextResponse.json({
      result,
      operation: operation || 'default',
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Processing error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

function processData(data: any, operation?: string): any {
  if (typeof data === 'string') {
    const words = data.split(/\\s+/);
    const sentences = data.split(/[.!?]+/).filter(Boolean);
    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      charCount: data.length,
      uniqueWords: [...new Set(words.map(w => w.toLowerCase()))].length,
      readability: words.length / Math.max(sentences.length, 1) < 15 ? 'Easy' : 'Complex',
      topWords: Object.entries(words.reduce((acc: any, w: string) => {
        const lw = w.toLowerCase().replace(/[^a-z]/g, '');
        if (lw.length > 3) acc[lw] = (acc[lw] || 0) + 1;
        return acc;
      }, {})).sort((a: any, b: any) => b[1] - a[1]).slice(0, 10),
    };
  }
  if (Array.isArray(data)) {
    return { count: data.length, types: data.map(i => typeof i), summary: 'Array processed' };
  }
  return { processed: data };
}

export async function GET() {
  return NextResponse.json({ status: 'healthy', service: '${idea.title}', timestamp: new Date().toISOString() });
}
`;
  }

  private async buildAndDeploy(idea: ValidatedIdea, files: Array<{ path: string; content: string }>, qualityScore: number): Promise<BuildResult> {
    await logger.agent(this.name, 'PHASE 5: Building & Deploying...');

    // Write files to disk
    const projectSlug = toSlug(idea.title);
    const projectPath = path.join(CONFIG.paths.output, 'web', projectSlug);
    await fs.mkdir(projectPath, { recursive: true });

    for (const file of files) {
      const filePath = path.join(projectPath, file.path);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, file.content);
    }
    await logger.agent(this.name, `Wrote ${files.length} files to ${projectPath}`);

    // npm install
    try {
      await execAsync('npm install --legacy-peer-deps', { cwd: projectPath, timeout: 180000 });
      await logger.agent(this.name, 'Dependencies installed');
    } catch (err) {
      await logger.agent(this.name, `npm install warning: ${err}`);
      try {
        await execAsync('npm install', { cwd: projectPath, timeout: 180000 });
      } catch {}
    }

    // Push to GitHub
    let githubUrl = '';
    if (CONFIG.github.token && CONFIG.github.username) {
      try {
        const repoName = projectSlug.slice(0, 80);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 30000);
        await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CONFIG.github.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: repoName,
            description: `${idea.title} - ${idea.description}`.slice(0, 350),
            private: false,
            auto_init: false,
          }),
          signal: controller.signal,
        });
        clearTimeout(timer);

        githubUrl = `https://github.com/${CONFIG.github.username}/${repoName}`;
        const gitOpts = { cwd: projectPath, timeout: 60000, maxBuffer: 10 * 1024 * 1024 };
        await execAsync('git init', gitOpts);
        await execAsync('git config user.email "mvp-factory@neurafinity.ai"', gitOpts);
        await execAsync('git config user.name "MVP Factory v11"', gitOpts);
        await execAsync('git add .', gitOpts);
        await execAsync(`git commit -m "MVP: ${idea.title} [score: ${idea.validation.overallScore}/10, quality: ${qualityScore}/20]"`, gitOpts);
        await execAsync('git branch -M main', gitOpts);
        try { await execAsync('git remote remove origin', gitOpts); } catch {}
        await execAsync(`git remote add origin https://${CONFIG.github.token}@github.com/${CONFIG.github.username}/${repoName}.git`, gitOpts);
        try {
          await execAsync('git push -u origin main', { ...gitOpts, timeout: 120000 });
        } catch {
          await execAsync('git push -u origin main --force', { ...gitOpts, timeout: 120000 });
        }
        await logger.agent(this.name, `GitHub: ${githubUrl}`);
      } catch (err) {
        await logger.agent(this.name, `GitHub error: ${err}`);
      }
    }

    // Deploy to Vercel
    let vercelUrl = '';
    if (CONFIG.vercel.token) {
      try {
        const envFlag = process.env.NVIDIA_API_KEY ? ` -e NVIDIA_API_KEY="${process.env.NVIDIA_API_KEY}"` : '';
        const deployCmd = `npx vercel --token ${CONFIG.vercel.token} --scope ${CONFIG.vercel.teamId} --yes --prod${envFlag}`;
        const { stdout, stderr } = await execAsync(deployCmd, { cwd: projectPath, timeout: 600000 });
        const output = stdout + stderr;
        const urlMatch = output.match(/https:\/\/[^\s]+\.vercel\.app/);
        if (urlMatch) {
          vercelUrl = urlMatch[0];
          await logger.agent(this.name, `Vercel: ${vercelUrl}`);
        }
      } catch (err) {
        await logger.agent(this.name, `Vercel error: ${err}`);
      }
    }

    // Mark as built
    await fs.mkdir(CONFIG.paths.built, { recursive: true });
    const builtData = {
      ...idea,
      builtAt: new Date().toISOString(),
      qualityScore,
      githubUrl,
      vercelUrl,
      fileCount: files.length,
    };
    await fs.writeFile(path.join(CONFIG.paths.built, `${idea.id}.json`), JSON.stringify(builtData, null, 2));

    // Remove from validated queue
    try { await fs.unlink(path.join(CONFIG.paths.validated, `${idea.id}.json`)); } catch {}
    await clearFailure(idea.id);

    // Notify
    const successMsg = `MVP BUILT: *${idea.title}*\nScore: ${idea.validation.overallScore}/10 | Quality: ${qualityScore}/20\n${githubUrl ? `GitHub: ${githubUrl}` : ''}${vercelUrl ? `\nLive: ${vercelUrl}` : ''}`;
    await notifyTelegram(successMsg);
    await logger.agent(this.name, successMsg.replace(/\*/g, ''));

    return { success: true, projectPath, githubUrl, vercelUrl, qualityScore };
  }

  private async saveValidatedIdeas(ideas: ValidatedIdea[]): Promise<void> {
    await fs.mkdir(CONFIG.paths.validated, { recursive: true });
    const existing = await loadExistingProducts();
    let saved = 0;

    for (const idea of ideas) {
      const dupCheck = isDuplicate(idea, existing);
      if (dupCheck.duplicate) {
        await logger.agent(this.name, `SAVE DEDUP: "${idea.title}" matches "${dupCheck.matchedWith}"`);
        continue;
      }
      await fs.writeFile(
        path.join(CONFIG.paths.validated, `${idea.id}.json`),
        JSON.stringify(idea, null, 2)
      );
      existing.push({
        title: idea.title,
        slug: toSlug(idea.title),
        keywords: extractKeywords(idea.title),
        description: idea.description,
        source: 'validated',
      });
      saved++;
    }
    await logger.agent(this.name, `Saved ${saved} validated ideas to queue`);
  }
}


// ============================================================
// MAIN DAEMON
// ============================================================
async function main(): Promise<void> {
  await logger.log('=== MVP Factory v11 (Multi-Agent Architecture) Starting ===');
  await logger.log(`Agents: ResearchAgent, ValidationAgent, FrontendAgent, BackendAgent, PMAgent`);
  await logger.log(`LLM: Kimi K2.5 via NVIDIA API`);
  await logger.log(`Output: ${CONFIG.paths.output}`);

  // Create directories
  const dirs = [
    CONFIG.paths.output, CONFIG.paths.ideas, CONFIG.paths.validated,
    CONFIG.paths.built, CONFIG.paths.skipped, CONFIG.paths.logs,
    path.join(CONFIG.paths.output, 'web'), path.join(CONFIG.paths.output, 'mobile'),
  ];
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }

  const pm = new PMAgent();

  // Initial full pipeline run
  await logger.log('Running initial full pipeline (Research -> Validate -> Build)...');
  try {
    await pm.runFullPipeline();
  } catch (err) {
    await logger.log(`Initial pipeline error (contained): ${err}`, 'ERROR');
  }

  // Schedule cycles
  // Full pipeline (research + validate + build) every 45 min
  setInterval(async () => {
    try { await pm.runFullPipeline(); }
    catch (err) { await logger.log(`Pipeline cycle error: ${err}`, 'ERROR'); }
  }, CONFIG.intervals.research);

  // Build from queue every 20 min (uses already-validated ideas)
  setInterval(async () => {
    try { await pm.runBuildFromQueue(); }
    catch (err) { await logger.log(`Build cycle error: ${err}`, 'ERROR'); }
  }, CONFIG.intervals.build);

  // Health check every 5 min
  setInterval(async () => {
    try {
      const queueFiles = (await fs.readdir(CONFIG.paths.validated)).filter(f => f.endsWith('.json'));
      const builtFiles = (await fs.readdir(CONFIG.paths.built)).filter(f => f.endsWith('.json'));
      const stats = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
        validatedQueue: queueFiles.length,
        totalBuilt: builtFiles.length,
      };
      await fs.writeFile(path.join(CONFIG.paths.logs, 'health-v11.json'), JSON.stringify(stats, null, 2));
    } catch {}
  }, CONFIG.intervals.healthCheck);

  // Log rotation every hour
  setInterval(async () => {
    try {
      const logFile = path.join(CONFIG.paths.logs, 'daemon-v11.log');
      const stat = await fs.stat(logFile);
      if (stat.size > 10 * 1024 * 1024) {
        try { await fs.unlink(logFile + '.1'); } catch {}
        await fs.rename(logFile, logFile + '.1');
      }
    } catch {}
  }, 60 * 60 * 1000);

  await logger.log('Daemon running: Full pipeline every 45m, Queue build every 20m');
  await notifyTelegram('MVP Factory v11 (Multi-Agent) started!');

  process.on('SIGINT', async () => { await logger.log('Shutting down...'); process.exit(0); });
  process.on('SIGTERM', async () => { await logger.log('Shutting down...'); process.exit(0); });
}

main().catch(async (error) => {
  await logger.log(`Fatal error: ${error}`, 'ERROR');
  process.exit(1);
});
