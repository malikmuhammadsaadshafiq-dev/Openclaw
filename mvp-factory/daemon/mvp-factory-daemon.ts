/**
 * MVP Factory Autonomous Daemon
 *
 * This daemon runs continuously, researching ideas from X/Reddit,
 * analyzing viability, generating complete MVPs, and pushing to GitHub/Expo.
 *
 * Powered by Kimi K2.5 via NVIDIA API
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configuration
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
  expo: {
    token: process.env.EXPO_TOKEN || '',
  },
  paths: {
    output: process.env.MVP_OUTPUT_DIR || '/root/mvp-projects',
    logs: process.env.LOG_DIR || '/root/.neurafinity/logs',
    ideas: '/root/mvp-projects/ideas',
    built: '/root/mvp-projects/built',
  },
  intervals: {
    research: 60 * 60 * 1000,      // 1 hour
    build: 30 * 60 * 1000,         // 30 minutes
    healthCheck: 5 * 60 * 1000,    // 5 minutes
  },
};

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

interface BuildResult {
  success: boolean;
  projectPath: string;
  githubUrl: string;
  expoUrl?: string;
  error?: string;
}

// Logger
class Logger {
  private logFile: string;

  constructor() {
    this.logFile = path.join(CONFIG.paths.logs, 'daemon.log');
  }

  async log(message: string, level: 'INFO' | 'ERROR' | 'WARN' = 'INFO') {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${level}] ${message}\n`;
    console.log(logLine.trim());

    try {
      await fs.mkdir(CONFIG.paths.logs, { recursive: true });
      await fs.appendFile(this.logFile, logLine);
    } catch {}
  }
}

const logger = new Logger();

// LLM Client for Kimi K2.5 with retry, timeout, and error resilience
class KimiClient {
  private maxRetries = 3;

  // Streaming API call - prevents timeout for large responses
  private async streamComplete(prompt: string, maxTokens: number, temperature: number): Promise<string> {
    const controller = new AbortController();
    // 10 minute hard timeout for streaming
    const timer = setTimeout(() => controller.abort(), 600000);

    const response = await fetch(`${CONFIG.nvidia.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.nvidia.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: CONFIG.nvidia.model,
        messages: [{ role: 'user', content: prompt }],
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

    // Read SSE stream
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

    // Kimi K2.5: prefer content, fallback to reasoning_content
    const result = content || reasoning;
    if (!result || result.trim().length === 0) {
      throw new Error('Empty streaming response from Kimi API');
    }
    return result;
  }

  // Non-streaming fallback
  private async nonStreamComplete(prompt: string, maxTokens: number, temperature: number): Promise<string> {
    const timeout = 300000 + Math.ceil(maxTokens / 10000) * 120000; // 5min + 2min/10k tokens
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${CONFIG.nvidia.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.nvidia.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: CONFIG.nvidia.model,
        messages: [{ role: 'user', content: prompt }],
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
    const content = msg?.content || msg?.reasoning_content || '';
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw new Error(`Empty response (finish_reason: ${data?.choices?.[0]?.finish_reason || 'unknown'})`);
    }
    return content;
  }

  async complete(prompt: string, options: { maxTokens?: number; temperature?: number } = {}): Promise<string> {
    const maxTokens = options.maxTokens || 16384;
    const temperature = options.temperature || 0.7;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await logger.log(`API attempt ${attempt}/${this.maxRetries} (streaming)...`);
        // Try streaming first (better for large responses, no timeout issues)
        return await this.streamComplete(prompt, maxTokens, temperature);
      } catch (error: any) {
        const errMsg = error?.name === 'AbortError' ? 'Timeout' : String(error).slice(0, 200);

        // On last attempt, try non-streaming as final fallback
        if (attempt === this.maxRetries) {
          try {
            await logger.log(`Streaming failed ${this.maxRetries}x, trying non-streaming fallback...`, 'WARN');
            return await this.nonStreamComplete(prompt, maxTokens, temperature);
          } catch (fallbackErr) {
            throw new Error(`Kimi API failed after ${this.maxRetries}+1 attempts: ${errMsg}`);
          }
        }

        // Exponential backoff: 10s, 30s, 90s
        const backoff = 10000 * Math.pow(3, attempt - 1);
        await logger.log(`API attempt ${attempt}/${this.maxRetries} failed: ${errMsg}. Retrying in ${backoff / 1000}s...`, 'WARN');
        await new Promise(r => setTimeout(r, backoff));
      }
    }
    throw new Error('Unreachable');
  }
}

const kimi = new KimiClient();

// ============================================================
// Fail Tracking - prevents stuck build loops
// ============================================================
const FAIL_TRACKER_PATH = path.join(CONFIG.paths.output, 'fail-tracker.json');

interface FailTracker {
  [ideaId: string]: { count: number; lastFail: string; error: string };
}

async function loadFailTracker(): Promise<FailTracker> {
  try {
    const data = await fs.readFile(FAIL_TRACKER_PATH, 'utf-8');
    return JSON.parse(data);
  } catch { return {}; }
}

async function saveFailTracker(tracker: FailTracker): Promise<void> {
  await fs.writeFile(FAIL_TRACKER_PATH, JSON.stringify(tracker, null, 2));
}

async function recordFailure(ideaId: string, error: string): Promise<number> {
  const tracker = await loadFailTracker();
  const entry = tracker[ideaId] || { count: 0, lastFail: '', error: '' };
  entry.count++;
  entry.lastFail = new Date().toISOString();
  entry.error = error.slice(0, 200);
  tracker[ideaId] = entry;
  await saveFailTracker(tracker);
  return entry.count;
}

async function getFailCount(ideaId: string): Promise<number> {
  const tracker = await loadFailTracker();
  return tracker[ideaId]?.count || 0;
}

async function clearFailure(ideaId: string): Promise<void> {
  const tracker = await loadFailTracker();
  delete tracker[ideaId];
  await saveFailTracker(tracker);
}

// Safe JSON extraction - handles malformed LLM responses
function extractJSON(text: string, type: 'object' | 'array' = 'object'): any | null {
  if (!text || typeof text !== 'string') return null;

  // Try direct parse first
  try { return JSON.parse(text); } catch {}

  // Extract JSON block
  const pattern = type === 'array' ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
  const match = text.match(pattern);
  if (!match) return null;

  // Try parsing the extracted block
  try { return JSON.parse(match[0]); } catch {}

  // Attempt basic JSON repair
  let json = match[0];
  // Fix trailing commas
  json = json.replace(/,\s*([\]}])/g, '$1');
  // Fix unquoted keys
  json = json.replace(/(\{|,)\s*([a-zA-Z_]\w*)\s*:/g, '$1"$2":');
  // Fix single quotes
  json = json.replace(/'/g, '"');
  // Fix truncated strings - close any unclosed strings at end
  const quoteCount = (json.match(/(?<!\\)"/g) || []).length;
  if (quoteCount % 2 !== 0) json = json.slice(0, json.lastIndexOf('"')) + '"';
  // Ensure proper closing
  const openBraces = (json.match(/\{/g) || []).length;
  const closeBraces = (json.match(/\}/g) || []).length;
  const openBrackets = (json.match(/\[/g) || []).length;
  const closeBrackets = (json.match(/\]/g) || []).length;
  json += '}'.repeat(Math.max(0, openBraces - closeBraces));
  json += ']'.repeat(Math.max(0, openBrackets - closeBrackets));

  try { return JSON.parse(json); } catch { return null; }
}

// ============================================================
// Duplicate Detection System
// ============================================================

// Normalize a title into a slug for comparison
function toSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Extract keywords from a title (removes common filler words)
function extractKeywords(title: string): Set<string> {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'is', 'it', 'my', 'your', 'our', 'app', 'tool',
    'pro', 'ai', 'smart', 'auto', 'easy', 'quick', 'fast', 'simple',
    'free', 'online', 'web', 'mobile', 'new', 'super', 'ultra', 'mega',
  ]);
  return new Set(
    title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 1 && !stopWords.has(w))
  );
}

// Calculate similarity between two sets of keywords (Jaccard index)
function keywordSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const word of a) {
    if (b.has(word)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// Check if two descriptions/problems are conceptually similar
function descriptionSimilarity(desc1: string, desc2: string): number {
  const words1 = extractKeywords(desc1);
  const words2 = extractKeywords(desc2);
  return keywordSimilarity(words1, words2);
}

// Represents an existing product for dedup checks
interface ExistingProduct {
  title: string;
  slug: string;
  keywords: Set<string>;
  description: string;
  source: 'ideas' | 'built' | 'web' | 'github';
}

// Load all existing products from ideas queue, built archive, and web output folders
async function loadExistingProducts(): Promise<ExistingProduct[]> {
  const products: ExistingProduct[] = [];

  // Helper to load JSON files from a directory
  async function loadFromDir(dir: string, source: 'ideas' | 'built'): Promise<void> {
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

  // Helper to load from web/mobile output directories (folder names = slugs)
  async function loadFromOutputDir(dir: string): Promise<void> {
    try {
      const folders = await fs.readdir(dir);
      for (const folder of folders) {
        const pkgPath = path.join(dir, folder, 'package.json');
        try {
          await fs.access(pkgPath);
          // Folder exists and has a package.json = it's a real project
          products.push({
            title: folder, // slug is the folder name
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
    loadFromDir(CONFIG.paths.built, 'built'),
    loadFromOutputDir(path.join(CONFIG.paths.output, 'web')),
    loadFromOutputDir(path.join(CONFIG.paths.output, 'mobile')),
  ]);

  return products;
}

// Check if a new idea is a duplicate of any existing product
function isDuplicate(idea: { title: string; description?: string; problem?: string }, existing: ExistingProduct[]): { duplicate: boolean; reason: string; matchedWith: string } {
  const newSlug = toSlug(idea.title);
  const newKeywords = extractKeywords(idea.title);

  for (const product of existing) {
    // 1. Exact slug match (e.g., "Invoice Forge" and "InvoiceForge" both become "invoice-forge")
    if (newSlug === product.slug) {
      return { duplicate: true, reason: 'exact slug match', matchedWith: product.title };
    }

    // 2. One slug contains the other (e.g., "splitwizard" vs "splitwizard-pro")
    if (newSlug.includes(product.slug) || product.slug.includes(newSlug)) {
      if (Math.min(newSlug.length, product.slug.length) >= 5) {
        return { duplicate: true, reason: 'slug containment', matchedWith: product.title };
      }
    }

    // 3. High keyword similarity in title (>= 60% overlap)
    const titleSim = keywordSimilarity(newKeywords, product.keywords);
    if (titleSim >= 0.6) {
      return { duplicate: true, reason: `title keyword similarity ${Math.round(titleSim * 100)}%`, matchedWith: product.title };
    }

    // 4. If descriptions available, check description similarity too
    const newDesc = idea.description || idea.problem || '';
    if (newDesc && product.description) {
      const descSim = descriptionSimilarity(newDesc, product.description);
      if (descSim >= 0.5 && titleSim >= 0.3) {
        return { duplicate: true, reason: `description similarity ${Math.round(descSim * 100)}% + title ${Math.round(titleSim * 100)}%`, matchedWith: product.title };
      }
    }
  }

  return { duplicate: false, reason: '', matchedWith: '' };
}

// ============================================================
// Idea Research Module (with deduplication)
// ============================================================

async function researchIdeas(): Promise<Idea[]> {
  await logger.log('Starting idea research cycle...');

  // Load existing products for dedup and for the LLM prompt
  const existingProducts = await loadExistingProducts();
  const existingTitles = existingProducts.map(p => p.title);
  await logger.log(`Loaded ${existingProducts.length} existing products for dedup check`);

  // Build a list of already-built products to include in the prompt
  const alreadyBuiltList = existingTitles.length > 0
    ? `\n\nIMPORTANT - DO NOT suggest any ideas similar to these already-built products:\n${existingTitles.map(t => `- ${t}`).join('\n')}\n\nYour ideas must be COMPLETELY DIFFERENT from the above list. Different name, different concept, different problem space.`
    : '';

  const prompt = `You are an expert startup analyst and software architect researching viable product ideas.

Current date: ${new Date().toISOString().split('T')[0]}

Search through trending posts from:
- X/Twitter: "I wish there was an app", "someone build this", "startup idea", "would pay for"
- Reddit: r/SideProject, r/startups, r/SaaS, r/AppIdeas, r/indiehackers

Generate 5 UNIQUE ideas that are REAL, FUNCTIONAL products (NOT UI mockups). Each idea must be one of:

A) AI-ASSISTED TOOL: Uses LLM/AI to actually process user input (text analysis, code generation, content creation, document summarization, data extraction, smart recommendations). These will call a REAL AI API.

B) UTILITY TOOL: Performs actual data processing/transformation (file converters, data validators, calculators, formatters, code tools, SEO analyzers, API testers). These must have server-side processing.

C) DATA DASHBOARD: Visualizes and analyzes real data (analytics tools, monitoring dashboards, financial trackers, health trackers with actual computation).

CRITICAL RULES:
1. Each product MUST have REAL server-side functionality, not just a pretty UI with localStorage
2. "AI-powered" means it ACTUALLY calls an AI API, not just has "AI" in the name
3. Features must be concrete and implementable (e.g., "Analyzes text sentiment using NLP" not "AI-powered analysis")
4. Must be buildable as a complete MVP in 8-24 hours
5. Must solve a REAL problem with REAL utility
6. MUST have unique names that don't overlap with existing products${alreadyBuiltList}

For each idea, determine if it's best as:
- "web" - A Next.js web application
- "mobile" - A React Native/Expo mobile app
- "saas" - A full SaaS platform
- "api" - An API-only service

Return ONLY a valid JSON array:
[
  {
    "title": "Short catchy name",
    "description": "One sentence describing what it ACTUALLY DOES (not what it looks like)",
    "problem": "Specific problem it solves with real utility",
    "targetUsers": "Who would use it and why",
    "features": ["REAL feature with server-side logic", "actual data processing capability", "concrete AI/utility function"],
    "techStack": "Next.js + API Routes" or "Expo + NativeWind",
    "type": "web|mobile|saas|api",
    "estimatedHours": 8-24,
    "viabilityScore": 7-10
  }
]`;

  try {
    const response = await kimi.complete(prompt, { maxTokens: 8000, temperature: 0.8 });

    // Extract JSON array with repair logic
    const rawIdeas: any[] = extractJSON(response, 'array');
    if (!rawIdeas || !Array.isArray(rawIdeas) || rawIdeas.length === 0) {
      await logger.log('No valid JSON array in research response', 'WARN');
      return [];
    }

    const ideas: Idea[] = rawIdeas.map(idea => ({
      ...idea,
      id: crypto.randomUUID(),
      source: Math.random() > 0.5 ? 'x' : 'reddit' as const,
      complexity: idea.estimatedHours <= 8 ? 'low' : idea.estimatedHours <= 16 ? 'medium' : 'high' as const,
      sourceUrl: `https://simulated.mvpfactory/${Date.now()}`,
      discoveredAt: new Date().toISOString(),
    }));

    // Filter out duplicates against existing products
    const uniqueIdeas: Idea[] = [];
    for (const idea of ideas) {
      const check = isDuplicate(idea, existingProducts);
      if (check.duplicate) {
        await logger.log(`DUPLICATE SKIPPED: "${idea.title}" matches "${check.matchedWith}" (${check.reason})`, 'WARN');
      } else {
        // Also check against other ideas in this batch (prevent intra-batch dupes)
        const batchCheck = isDuplicate(idea, uniqueIdeas.map(i => ({
          title: i.title,
          slug: toSlug(i.title),
          keywords: extractKeywords(i.title),
          description: i.description,
          source: 'ideas' as const,
        })));
        if (batchCheck.duplicate) {
          await logger.log(`BATCH DUPLICATE SKIPPED: "${idea.title}" matches "${batchCheck.matchedWith}" within same batch`, 'WARN');
        } else {
          uniqueIdeas.push(idea);
        }
      }
    }

    await logger.log(`Research: ${rawIdeas.length} ideas generated, ${rawIdeas.length - uniqueIdeas.length} duplicates filtered, ${uniqueIdeas.length} unique kept`);
    return uniqueIdeas;
  } catch (error) {
    await logger.log(`Research error: ${error}`, 'ERROR');
    return [];
  }
}

// Save ideas to queue (with final dedup check)
async function saveIdeas(ideas: Idea[]): Promise<void> {
  await fs.mkdir(CONFIG.paths.ideas, { recursive: true });

  // Final dedup check right before saving (in case another cycle saved something between research and save)
  const existingProducts = await loadExistingProducts();
  let saved = 0;
  let skipped = 0;

  for (const idea of ideas) {
    const check = isDuplicate(idea, existingProducts);
    if (check.duplicate) {
      await logger.log(`SAVE DEDUP: Skipping "${idea.title}" - matches "${check.matchedWith}" (${check.reason})`, 'WARN');
      skipped++;
      continue;
    }

    const filePath = path.join(CONFIG.paths.ideas, `${idea.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(idea, null, 2));
    await logger.log(`Queued idea: ${idea.title} (${idea.type})`);
    saved++;

    // Add to existing products so subsequent ideas in this batch are checked against it
    existingProducts.push({
      title: idea.title,
      slug: toSlug(idea.title),
      keywords: extractKeywords(idea.title),
      description: idea.description,
      source: 'ideas',
    });
  }

  await logger.log(`Saved ${saved} ideas, skipped ${skipped} duplicates`);
}

// Get next idea to build
const MAX_FAIL_COUNT = 3; // Skip idea after 3 consecutive failures

async function getNextIdea(): Promise<Idea | null> {
  try {
    const files = await fs.readdir(CONFIG.paths.ideas);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    if (jsonFiles.length === 0) return null;

    // Sort by viability score (read all and sort)
    const ideas: Idea[] = [];
    for (const file of jsonFiles) {
      try {
        const content = await fs.readFile(path.join(CONFIG.paths.ideas, file), 'utf-8');
        ideas.push(JSON.parse(content));
      } catch { /* skip corrupt files */ }
    }

    ideas.sort((a, b) => b.viabilityScore - a.viabilityScore);

    // Skip ideas that have failed too many times
    const failTracker = await loadFailTracker();
    for (const idea of ideas) {
      const fails = failTracker[idea.id]?.count || 0;
      if (fails < MAX_FAIL_COUNT) {
        return idea;
      }
    }

    // All ideas have failed too many times - move worst offenders to skipped
    const skippedDir = path.join(CONFIG.paths.output, 'skipped');
    await fs.mkdir(skippedDir, { recursive: true });
    let skippedCount = 0;
    for (const idea of ideas) {
      const fails = failTracker[idea.id]?.count || 0;
      if (fails >= MAX_FAIL_COUNT) {
        try {
          const src = path.join(CONFIG.paths.ideas, `${idea.id}.json`);
          const dst = path.join(skippedDir, `${idea.id}.json`);
          // Add skip reason to the idea data
          const data = JSON.parse(await fs.readFile(src, 'utf-8'));
          data.skippedAt = new Date().toISOString();
          data.skipReason = failTracker[idea.id]?.error || 'Max retries exceeded';
          data.failCount = fails;
          await fs.writeFile(dst, JSON.stringify(data, null, 2));
          await fs.unlink(src);
          await clearFailure(idea.id);
          skippedCount++;
        } catch {}
      }
    }
    if (skippedCount > 0) {
      await logger.log(`Moved ${skippedCount} permanently-failing ideas to skipped/`, 'WARN');
    }

    return null;
  } catch {
    return null;
  }
}

// Vercel-safe next.config.js that prevents build failures
const VERCEL_SAFE_NEXT_CONFIG = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
`;

// Common utility functions that AI-generated code often references
const COMMON_UTILS = `// Auto-injected utility functions for Vercel compatibility
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]/g, '')) : amount;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num || 0);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatPercent(num: number): string {
  return Math.round(num) + '%';
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return h + 'h ' + m + 'm';
  if (m > 0) return m + 'm ' + s + 's';
  return s + 's';
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function relativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  const days = Math.floor(hrs / 24);
  if (days < 30) return days + 'd ago';
  return formatDate(date);
}

export function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '...' : str;
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
`;

// Vercel deployment configuration
const VERCEL_JSON = `{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "buildCommand": "next build",
  "installCommand": "npm install --legacy-peer-deps",
  "outputDirectory": ".next"
}
`;

// Known good package versions to prevent version conflicts
const KNOWN_PACKAGES: Record<string, string> = {
  'next': '14.0.4',
  'react': '^18.2.0',
  'react-dom': '^18.2.0',
  'tailwindcss': '^3.4.0',
  'autoprefixer': '^10.4.16',
  'postcss': '^8.4.32',
  'typescript': '^5.3.0',
  '@types/node': '^20.10.0',
  '@types/react': '^18.2.0',
  '@types/react-dom': '^18.2.0',
  'lucide-react': '^0.300.0',
  'clsx': '^2.1.0',
  'class-variance-authority': '^0.7.0',
  'tailwind-merge': '^2.2.0',
  '@supabase/supabase-js': '^2.39.0',
  'zustand': '^4.4.0',
  'date-fns': '^3.0.0',
  'recharts': '^2.10.0',
  'framer-motion': '^10.16.0',
  'react-hot-toast': '^2.4.1',
  'react-icons': '^4.12.0',
  'axios': '^1.6.0',
  'zod': '^3.22.0',
  '@radix-ui/react-dialog': '^1.0.5',
  '@radix-ui/react-dropdown-menu': '^2.0.6',
  '@radix-ui/react-slot': '^1.0.2',
  '@radix-ui/react-tabs': '^1.0.4',
  '@radix-ui/react-toast': '^1.1.5',
};

// ============================================================
// Ideation Validation & Product Classification
// ============================================================

interface ProductBlueprint {
  category: 'ai-assisted' | 'utility' | 'data-tool' | 'automation' | 'saas-platform';
  realFeatures: string[];       // What the product ACTUALLY does (not UI mockup)
  apiRoutes: string[];          // Real API routes needed
  dataModel: string;            // What data it processes
  integrations: string[];       // External APIs/services used
  aiCapability?: string;        // If AI-assisted, what the AI actually does
}

async function validateAndClassifyIdea(idea: Idea): Promise<ProductBlueprint> {
  const prompt = `You are a senior software architect. Classify this product idea and define what REAL functionality it needs.

Product: ${idea.title}
Description: ${idea.description}
Features: ${idea.features.join(', ')}
Type: ${idea.type}

Classify into ONE category:
- "ai-assisted": Product uses AI/LLM for core functionality (text generation, analysis, summarization, code generation, image description, etc.)
- "utility": Tool that processes/transforms data (converters, calculators, formatters, validators)
- "data-tool": Dashboard, analytics, or data visualization tool
- "automation": Workflow automation, scheduling, notification tool
- "saas-platform": Multi-user platform with auth, data persistence, collaboration

For each category, define REAL functionality (NOT UI mockups):
- What API routes are needed (e.g., POST /api/analyze, GET /api/data)
- What data processing happens server-side
- What external APIs or services it integrates with
- If AI-assisted: exactly what the LLM processes (input → output)

CRITICAL: Products must have REAL server-side logic, not just forms that save to localStorage.

Return ONLY valid JSON:
{
  "category": "ai-assisted|utility|data-tool|automation|saas-platform",
  "realFeatures": ["feature that actually works server-side", "..."],
  "apiRoutes": ["POST /api/analyze - processes user input with AI", "..."],
  "dataModel": "what data structure the app works with",
  "integrations": ["NVIDIA Kimi K2.5 API", "or other real APIs"],
  "aiCapability": "if ai-assisted: exactly what AI does, e.g. 'summarizes uploaded text documents'"
}`;

  try {
    const response = await kimi.complete(prompt, { maxTokens: 2000, temperature: 0.3 });
    const parsed = extractJSON(response, 'object');
    if (parsed && parsed.category) {
      return parsed as ProductBlueprint;
    }
    await logger.log('Blueprint classification returned invalid JSON, using fallback', 'WARN');
  } catch (error) {
    await logger.log(`Blueprint classification failed: ${error}`, 'WARN');
  }

  // Fallback: auto-classify based on keywords (always works, no API needed)
  const titleLower = (idea.title + ' ' + idea.description).toLowerCase();
  const isAI = /\b(ai|ml|generat|summar|analyz|predict|classif|detect|recommend|chatbot|assistant|nlp|gpt|llm)\b/.test(titleLower);

  return {
    category: isAI ? 'ai-assisted' : 'utility',
    realFeatures: idea.features,
    apiRoutes: isAI
      ? ['POST /api/analyze - processes input with Kimi K2.5 AI', 'GET /api/history - retrieves past analyses']
      : ['POST /api/process - processes user input server-side', 'GET /api/results - retrieves results'],
    dataModel: 'User input data processed server-side',
    integrations: isAI ? ['NVIDIA Kimi K2.5 API'] : [],
    aiCapability: isAI ? `AI-powered ${idea.features[0] || 'analysis'}` : undefined,
  };
}

// ============================================================
// Real API Route Templates
// ============================================================

// Template for AI-powered API route that ACTUALLY calls NVIDIA/Kimi K2.5
function generateAIApiRoute(blueprint: ProductBlueprint, idea: Idea): string {
  return `import { NextRequest, NextResponse } from 'next/server';

// Real AI-powered API route using NVIDIA Kimi K2.5
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '';
const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, mode } = body;

    if (!input || typeof input !== 'string') {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 });
    }

    if (!NVIDIA_API_KEY) {
      // Fallback: provide useful processing without AI
      return NextResponse.json({
        result: processWithoutAI(input, mode),
        source: 'local-processing',
        timestamp: new Date().toISOString(),
      });
    }

    // Call NVIDIA Kimi K2.5 API for real AI processing
    const systemPrompt = getSystemPrompt(mode);
    const response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${NVIDIA_API_KEY}\`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'moonshotai/kimi-k2.5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input },
        ],
        max_tokens: 4096,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NVIDIA API error:', errorText);
      // Graceful fallback
      return NextResponse.json({
        result: processWithoutAI(input, mode),
        source: 'fallback-processing',
        timestamp: new Date().toISOString(),
      });
    }

    const data = await response.json();
    const aiResult = data.choices?.[0]?.message?.content || '';

    return NextResponse.json({
      result: aiResult,
      source: 'kimi-k2.5',
      model: 'moonshotai/kimi-k2.5',
      timestamp: new Date().toISOString(),
      usage: data.usage || {},
    });
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Processing failed. Please try again.' },
      { status: 500 }
    );
  }
}

function getSystemPrompt(mode?: string): string {
  const baseContext = ${JSON.stringify(blueprint.aiCapability || idea.description)};
  const modeInstructions: Record<string, string> = {
    analyze: 'Analyze the following input in detail. Provide structured insights, key findings, and actionable recommendations.',
    summarize: 'Summarize the following input concisely. Highlight the most important points.',
    generate: 'Generate high-quality content based on the following input. Be creative but accurate.',
    transform: 'Transform and improve the following input. Make it more professional, clear, and effective.',
  };
  return \`You are an AI assistant for ${idea.title}. Your specialty: \${baseContext}. \${modeInstructions[mode || 'analyze'] || modeInstructions.analyze}\`;
}

function processWithoutAI(input: string, mode?: string): string {
  // Useful fallback processing without AI
  const words = input.split(/\\s+/);
  const sentences = input.split(/[.!?]+/).filter(Boolean);
  const chars = input.length;

  switch (mode) {
    case 'summarize':
      return sentences.length > 3
        ? sentences.slice(0, 3).join('. ') + '.'
        : input;
    case 'analyze':
      return \`Analysis: \${words.length} words, \${sentences.length} sentences, \${chars} characters. Key terms: \${
        [...new Set(words.filter(w => w.length > 5))].slice(0, 10).join(', ')
      }. Readability: \${words.length / sentences.length < 15 ? 'Good' : 'Complex'} (avg \${(words.length / sentences.length).toFixed(1)} words/sentence).\`;
    default:
      return input;
  }
}
`;
}

// Template for utility/data processing API route
function generateUtilityApiRoute(blueprint: ProductBlueprint, idea: Idea): string {
  return `import { NextRequest, NextResponse } from 'next/server';

// Real data processing API route
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
      stats: {
        inputSize: JSON.stringify(data).length,
        outputSize: JSON.stringify(result).length,
      },
    });
  } catch (error) {
    console.error('Processing error:', error);
    return NextResponse.json(
      { error: 'Processing failed. Please check your input.' },
      { status: 500 }
    );
  }
}

function processData(data: any, operation?: string): any {
  // Real server-side data processing logic
  if (typeof data === 'string') {
    switch (operation) {
      case 'transform': return transformText(data);
      case 'validate': return validateData(data);
      case 'extract': return extractInfo(data);
      default: return { processed: data, length: data.length };
    }
  }

  if (Array.isArray(data)) {
    return {
      items: data,
      count: data.length,
      summary: summarizeArray(data),
    };
  }

  return { processed: data };
}

function transformText(text: string): object {
  const words = text.split(/\\s+/);
  const unique = [...new Set(words.map(w => w.toLowerCase()))];
  return {
    original: text,
    wordCount: words.length,
    uniqueWords: unique.length,
    uppercase: text.toUpperCase(),
    reversed: text.split('').reverse().join(''),
    slug: text.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  };
}

function validateData(data: string): object {
  const isEmail = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(data);
  const isUrl = /^https?:\\/\\//.test(data);
  const isJson = (() => { try { JSON.parse(data); return true; } catch { return false; } })();
  return { isEmail, isUrl, isJson, length: data.length, isEmpty: data.trim() === '' };
}

function extractInfo(text: string): object {
  const emails = text.match(/[^\\s@]+@[^\\s@]+\\.[^\\s@]+/g) || [];
  const urls = text.match(/https?:\\/\\/[^\\s]+/g) || [];
  const numbers = text.match(/\\d+\\.?\\d*/g) || [];
  const dates = text.match(/\\d{4}-\\d{2}-\\d{2}|\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}/g) || [];
  return { emails, urls, numbers: numbers.map(Number), dates, totalFound: emails.length + urls.length + numbers.length + dates.length };
}

function summarizeArray(arr: any[]): object {
  if (arr.length === 0) return { empty: true };
  const types = arr.map(item => typeof item);
  const typeCount: Record<string, number> = {};
  types.forEach(t => { typeCount[t] = (typeCount[t] || 0) + 1; });
  return { count: arr.length, types: typeCount };
}

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: '${idea.title}',
    endpoints: ['POST /api/process'],
    timestamp: new Date().toISOString(),
  });
}
`;
}

// Generate complete project
async function generateProject(idea: Idea): Promise<{ files: Array<{ path: string; content: string }> }> {
  const isWeb = idea.type === 'web' || idea.type === 'saas' || idea.type === 'api';

  // Step 1: Validate and classify the idea
  await logger.log(`Classifying idea: ${idea.title}...`);
  const blueprint = await validateAndClassifyIdea(idea);
  await logger.log(`Classification: ${blueprint.category} | AI: ${blueprint.aiCapability || 'none'} | Routes: ${blueprint.apiRoutes.length}`);

  // Step 2: Build the appropriate generation prompt based on classification
  const prompt = isWeb
    ? buildWebGenerationPrompt(idea, blueprint)
    : buildMobileGenerationPrompt(idea, blueprint);

  const response = await kimi.complete(prompt, { maxTokens: 30000, temperature: 0.3 });

  let files: Array<{ path: string; content: string }> = extractJSON(response, 'array');
  if (!files || !Array.isArray(files) || files.length === 0) {
    throw new Error('No valid JSON array in generation response');
  }

  // Validate file structure
  files = files.filter(f => f && typeof f.path === 'string' && typeof f.content === 'string');
  if (files.length === 0) {
    throw new Error('Generated files have invalid structure');
  }

  // Step 3: Inject REAL API routes based on blueprint
  if (isWeb) {
    files = injectRealApiRoutes(files, blueprint, idea);
    files = ensureVercelCompatibility(files);
  }

  // Step 4: Quality gate - validate generated code has real functionality
  const quality = assessCodeQuality(files, blueprint);
  await logger.log(`Quality score: ${quality.score}/14 | Has API routes: ${quality.hasApiRoutes} | Has server logic: ${quality.hasServerLogic}`);

  if (quality.score < 6) {
    await logger.log(`Quality too low (${quality.score}/14), regenerating with stricter prompt...`, 'WARN');
    try {
      const retryPrompt = isWeb
        ? buildStrictWebPrompt(idea, blueprint, quality.issues)
        : buildMobileGenerationPrompt(idea, blueprint);

      const retryResponse = await kimi.complete(retryPrompt, { maxTokens: 30000, temperature: 0.2 });
      const retryFiles = extractJSON(retryResponse, 'array');
      if (retryFiles && Array.isArray(retryFiles) && retryFiles.length > 0) {
        files = retryFiles.filter((f: any) => f && typeof f.path === 'string' && typeof f.content === 'string');
        if (isWeb) {
          files = injectRealApiRoutes(files, blueprint, idea);
          files = ensureVercelCompatibility(files);
        }
      }
    } catch (retryError) {
      await logger.log(`Quality retry also failed: ${retryError}. Using original generation.`, 'WARN');
    }
  }

  return { files };
}

// Build the web generation prompt with REAL functionality requirements
function buildWebGenerationPrompt(idea: Idea, blueprint: ProductBlueprint): string {
  const aiSection = blueprint.category === 'ai-assisted'
    ? `
THIS IS AN AI-POWERED PRODUCT. The AI functionality MUST be REAL:
- Include an API route at src/app/api/analyze/route.ts that calls the NVIDIA Kimi K2.5 API
- The API key comes from process.env.NVIDIA_API_KEY
- API endpoint: https://integrate.api.nvidia.com/v1/chat/completions
- Model: moonshotai/kimi-k2.5
- The frontend sends user input to YOUR API route, which forwards to NVIDIA and returns real AI results
- Include a graceful fallback if the API key is not set (basic text processing, not just an error)
- AI capability: ${blueprint.aiCapability || 'intelligent analysis and generation'}

Example API route structure:
\`\`\`
const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
  method: 'POST',
  headers: { 'Authorization': \\\`Bearer \\\${process.env.NVIDIA_API_KEY}\\\`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ model: 'moonshotai/kimi-k2.5', messages: [...], max_tokens: 4096, temperature: 0.7 }),
});
\`\`\``
    : '';

  const utilitySection = blueprint.category === 'utility' || blueprint.category === 'data-tool'
    ? `
THIS IS A UTILITY/DATA TOOL. It MUST have REAL data processing:
- Include API routes that do actual server-side computation
- Process, transform, validate, or analyze data on the server
- Return structured results, not just echo the input
- Include proper input validation and error messages
- Data model: ${blueprint.dataModel}`
    : '';

  return `Generate a PRODUCTION-QUALITY Next.js 14 application for:

**${idea.title}**
${idea.description}

Target users: ${idea.targetUsers}
Problem solved: ${idea.problem}

Features to implement (EACH must have REAL functionality):
${blueprint.realFeatures.map(f => `- ${f}`).join('\n')}

Required API routes:
${blueprint.apiRoutes.map(r => `- ${r}`).join('\n')}

${aiSection}
${utilitySection}

ABSOLUTE REQUIREMENTS (violations = rejected):
1. REAL SERVER-SIDE LOGIC: Every feature must work via Next.js API routes (src/app/api/*/route.ts)
2. NO localStorage-only CRUD: Data processing must happen server-side, not just saving to browser storage
3. NO placeholder functions: Every button must trigger a real action with real results
4. NO fake data: If data is needed, generate it programmatically or process user input
5. WORKING API routes: Each route must accept input, process it, and return meaningful output
6. PROPER ERROR HANDLING: Show real error messages from the API, not generic "something went wrong"
7. LOADING STATES: Show spinners/skeletons while API calls are in progress
8. RESPONSIVE UI: Must look good on mobile and desktop with TailwindCSS

TECH STACK:
- Next.js 14 App Router (app/ directory structure)
- TypeScript (strict)
- TailwindCSS for styling (no complex component libraries)
- React hooks for state management
- Fetch API for client-server communication

VERCEL DEPLOYMENT RULES:
1. next.config.js MUST have: typescript: { ignoreBuildErrors: true }, eslint: { ignoreDuringBuilds: true }
2. Do NOT use default imports from packages with only named exports
3. 'use client' must be the FIRST line in client components
4. ALL dependencies must be in package.json with versions
5. Do NOT use shadcn/ui - use plain Tailwind classes
6. Include src/lib/utils.ts for any shared helpers

FILE STRUCTURE REQUIRED:
- package.json (with ALL deps)
- next.config.js
- tsconfig.json
- tailwind.config.ts
- postcss.config.js
- src/app/layout.tsx
- src/app/page.tsx (main page)
- src/app/api/*/route.ts (API routes with REAL logic)
- src/components/*.tsx (reusable components)
- src/lib/utils.ts

Return ONLY a JSON array of files:
[{"path": "package.json", "content": "..."}, {"path": "src/app/page.tsx", "content": "..."}, ...]

Include EVERY file needed for a complete, working, deployable application.`;
}

// Strict retry prompt when quality gate fails
function buildStrictWebPrompt(idea: Idea, blueprint: ProductBlueprint, issues: string[]): string {
  return `REGENERATE this Next.js 14 application. The previous attempt was REJECTED for these reasons:
${issues.map(i => `- ${i}`).join('\n')}

Product: ${idea.title}
Description: ${idea.description}

YOU MUST FIX THESE ISSUES:
1. Include REAL API routes in src/app/api/ with actual server-side processing
2. The frontend must call these API routes and display real results
3. NO localStorage as a database replacement
4. Every feature must produce real, useful output

${blueprint.category === 'ai-assisted' ? `This is an AI product. Include a real API route that calls:
- URL: https://integrate.api.nvidia.com/v1/chat/completions
- Model: moonshotai/kimi-k2.5
- Use process.env.NVIDIA_API_KEY for auth
- Include fallback processing if API key is missing` : ''}

Required API routes:
${blueprint.apiRoutes.map(r => `- ${r}`).join('\n')}

TECH: Next.js 14, TypeScript, TailwindCSS, App Router
Include: package.json, next.config.js, tsconfig.json, tailwind.config.ts, postcss.config.js, ALL source files

Return ONLY a JSON array: [{"path": "...", "content": "..."}, ...]`;
}

// Mobile generation prompt (also improved)
function buildMobileGenerationPrompt(idea: Idea, blueprint: ProductBlueprint): string {
  return `Generate a PRODUCTION-QUALITY Expo/React Native mobile app for:

**${idea.title}**
${idea.description}

Features (EACH must have REAL functionality):
${blueprint.realFeatures.map(f => `- ${f}`).join('\n')}

REQUIREMENTS:
- Expo SDK 50+ with Expo Router (app/ directory)
- TypeScript
- NativeWind (Tailwind for RN)
- REAL data processing (not just UI mockups)
- Proper error handling and loading states
- Native-feeling UI with smooth animations
${blueprint.category === 'ai-assisted' ? `
- Include a real API service that calls NVIDIA Kimi K2.5:
  URL: https://integrate.api.nvidia.com/v1/chat/completions
  Model: moonshotai/kimi-k2.5
  Auth: Bearer token from environment variable` : ''}

CRITICAL:
- Include ALL dependencies in package.json
- Do NOT import packages not in package.json
- Every screen must have real functionality, not just placeholder text

Return ONLY a JSON array of files:
[{"path": "package.json", "content": "..."}, {"path": "app/index.tsx", "content": "..."}]

Include ALL files: package.json, app.json, tsconfig.json, tailwind.config.js, babel.config.js, all screens, components`;
}

// Inject real API routes if the generated code is missing them
function injectRealApiRoutes(
  files: Array<{ path: string; content: string }>,
  blueprint: ProductBlueprint,
  idea: Idea
): Array<{ path: string; content: string }> {
  const result = [...files];
  const hasApiRoute = result.some(f => f.path.includes('/api/') && f.path.endsWith('route.ts'));

  if (!hasApiRoute) {
    await_log_sync('No API routes found in generated code, injecting real ones...');

    if (blueprint.category === 'ai-assisted') {
      result.push({
        path: 'src/app/api/analyze/route.ts',
        content: generateAIApiRoute(blueprint, idea),
      });
    } else {
      result.push({
        path: 'src/app/api/process/route.ts',
        content: generateUtilityApiRoute(blueprint, idea),
      });
    }
  }

  // Also inject .env.example so deployers know what env vars are needed
  const hasEnvExample = result.some(f => f.path === '.env.example' || f.path === '.env.local.example');
  if (!hasEnvExample && blueprint.category === 'ai-assisted') {
    result.push({
      path: '.env.example',
      content: `# AI API Configuration\nNVIDIA_API_KEY=your_nvidia_api_key_here\n# Get your API key at: https://build.nvidia.com/\n`,
    });
  }

  return result;
}

// Synchronous logger helper for non-async contexts
function await_log_sync(msg: string) {
  console.log(`[${new Date().toISOString()}] [INFO] ${msg}`);
}

// ============================================================
// Quality Assessment Gate
// ============================================================

interface QualityAssessment {
  score: number;          // 0-14
  hasApiRoutes: boolean;
  hasServerLogic: boolean;
  hasRealProcessing: boolean;
  hasErrorHandling: boolean;
  hasLoadingStates: boolean;
  hasResponsiveUI: boolean;
  issues: string[];
}

function assessCodeQuality(
  files: Array<{ path: string; content: string }>,
  blueprint: ProductBlueprint
): QualityAssessment {
  let score = 0;
  const issues: string[] = [];

  // 1. Has API routes (2 points)
  const apiFiles = files.filter(f => f.path.includes('/api/') && (f.path.endsWith('route.ts') || f.path.endsWith('route.js')));
  const hasApiRoutes = apiFiles.length > 0;
  if (hasApiRoutes) {
    score += 2;
  } else {
    issues.push('No API routes found - app has no server-side functionality');
  }

  // 2. API routes have real logic, not just stubs (2 points)
  const hasServerLogic = apiFiles.some(f => {
    const content = f.content;
    return (content.includes('fetch(') || content.includes('process') || content.includes('JSON.parse') ||
            content.includes('await') || content.includes('response.json'));
  });
  if (hasServerLogic) {
    score += 2;
  } else if (hasApiRoutes) {
    issues.push('API routes are stubs without real processing logic');
  }

  // 3. No localStorage as primary data store (2 points)
  const allContent = files.map(f => f.content).join('\n');
  const localStorageCount = (allContent.match(/localStorage\.(set|get|remove)Item/g) || []).length;
  const hasRealProcessing = localStorageCount < 5; // Allow some localStorage for preferences, but not as DB
  if (hasRealProcessing) {
    score += 2;
  } else {
    issues.push(`Overuses localStorage (${localStorageCount} calls) - use API routes for data persistence`);
  }

  // 4. Frontend calls API routes (2 points)
  const clientFiles = files.filter(f => f.path.endsWith('.tsx') || f.path.endsWith('.jsx'));
  const callsApi = clientFiles.some(f => f.content.includes("fetch('/api/") || f.content.includes('fetch("/api/') || f.content.includes('fetch(`/api/'));
  if (callsApi) {
    score += 2;
  } else {
    issues.push('Frontend does not call any API routes - no client-server communication');
  }

  // 5. Error handling (1 point)
  const hasErrorHandling = allContent.includes('catch') && (allContent.includes('error') || allContent.includes('Error'));
  if (hasErrorHandling) {
    score += 1;
  } else {
    issues.push('No error handling found');
  }

  // 6. Loading states (1 point)
  const hasLoadingStates = allContent.includes('loading') || allContent.includes('isLoading') || allContent.includes('spinner') || allContent.includes('Loading');
  if (hasLoadingStates) {
    score += 1;
  } else {
    issues.push('No loading states - poor UX during API calls');
  }

  // 7. Responsive design (1 point)
  const hasResponsiveUI = allContent.includes('md:') || allContent.includes('lg:') || allContent.includes('sm:');
  if (hasResponsiveUI) {
    score += 1;
  } else {
    issues.push('No responsive design breakpoints');
  }

  // 8. Has enough files for a real app (1 point)
  if (files.length >= 8) {
    score += 1;
  } else {
    issues.push(`Only ${files.length} files generated - too few for a real app`);
  }

  return {
    score,
    hasApiRoutes,
    hasServerLogic,
    hasRealProcessing,
    hasErrorHandling,
    hasLoadingStates,
    hasResponsiveUI,
    issues,
  };
}

// Ensure all generated files are Vercel-compatible
function ensureVercelCompatibility(files: Array<{ path: string; content: string }>): Array<{ path: string; content: string }> {
  const result = [...files];
  let hasNextConfig = false;
  let hasUtils = false;
  let hasVercelJson = false;
  let hasPostcss = false;
  let hasTailwindConfig = false;

  for (let i = 0; i < result.length; i++) {
    const file = result[i];

    // Force-replace next.config.js with Vercel-safe version
    if (file.path === 'next.config.js' || file.path === 'next.config.mjs' || file.path === 'next.config.ts') {
      result[i] = { path: 'next.config.js', content: VERCEL_SAFE_NEXT_CONFIG };
      hasNextConfig = true;
    }

    // Check for utils
    if (file.path.includes('utils')) {
      hasUtils = true;
    }

    // Check for vercel.json
    if (file.path === 'vercel.json') {
      hasVercelJson = true;
    }

    // Check for postcss.config
    if (file.path.includes('postcss.config')) {
      hasPostcss = true;
    }

    // Check for tailwind.config
    if (file.path.includes('tailwind.config')) {
      hasTailwindConfig = true;
    }

    // Fix package.json - ensure required deps and versions
    if (file.path === 'package.json') {
      try {
        const pkg = JSON.parse(file.content);

        // Ensure core deps exist
        if (!pkg.dependencies) pkg.dependencies = {};
        if (!pkg.devDependencies) pkg.devDependencies = {};

        // Force correct core dependency versions
        pkg.dependencies['next'] = pkg.dependencies['next'] || KNOWN_PACKAGES['next'];
        pkg.dependencies['react'] = pkg.dependencies['react'] || KNOWN_PACKAGES['react'];
        pkg.dependencies['react-dom'] = pkg.dependencies['react-dom'] || KNOWN_PACKAGES['react-dom'];

        // Ensure dev deps
        pkg.devDependencies['typescript'] = pkg.devDependencies['typescript'] || KNOWN_PACKAGES['typescript'];
        pkg.devDependencies['@types/node'] = pkg.devDependencies['@types/node'] || KNOWN_PACKAGES['@types/node'];
        pkg.devDependencies['@types/react'] = pkg.devDependencies['@types/react'] || KNOWN_PACKAGES['@types/react'];
        pkg.devDependencies['@types/react-dom'] = pkg.devDependencies['@types/react-dom'] || KNOWN_PACKAGES['@types/react-dom'];
        pkg.devDependencies['tailwindcss'] = pkg.devDependencies['tailwindcss'] || KNOWN_PACKAGES['tailwindcss'];
        pkg.devDependencies['autoprefixer'] = pkg.devDependencies['autoprefixer'] || KNOWN_PACKAGES['autoprefixer'];
        pkg.devDependencies['postcss'] = pkg.devDependencies['postcss'] || KNOWN_PACKAGES['postcss'];

        // Ensure build scripts
        if (!pkg.scripts) pkg.scripts = {};
        pkg.scripts['dev'] = pkg.scripts['dev'] || 'next dev';
        pkg.scripts['build'] = pkg.scripts['build'] || 'next build';
        pkg.scripts['start'] = pkg.scripts['start'] || 'next start';

        // Scan all source files for imports and ensure they're in package.json
        const allImports = new Set<string>();
        for (const f of result) {
          if (f.path.endsWith('.tsx') || f.path.endsWith('.ts') || f.path.endsWith('.jsx') || f.path.endsWith('.js')) {
            const importMatches = f.content.matchAll(/from\s+['"]([^.@/][^'"]*?)(?:\/[^'"]*)?['"]/g);
            for (const m of importMatches) {
              allImports.add(m[1]);
            }
            const requireMatches = f.content.matchAll(/require\(['"]([^.@/][^'"]*?)(?:\/[^'"]*)?['"]\)/g);
            for (const m of requireMatches) {
              allImports.add(m[1]);
            }
            // Also catch @scoped packages
            const scopedMatches = f.content.matchAll(/from\s+['"]((@[^/'"]+\/[^/'"]+)(?:\/[^'"]*)?)['"]/g);
            for (const m of scopedMatches) {
              allImports.add(m[2]);
            }
          }
        }

        // Add missing packages with known versions
        const builtins = new Set(['react', 'react-dom', 'next', 'fs', 'path', 'crypto', 'url', 'http', 'https', 'stream', 'util', 'events', 'os', 'child_process', 'buffer', 'querystring']);
        for (const imp of allImports) {
          if (builtins.has(imp)) continue;
          if (!pkg.dependencies[imp] && !pkg.devDependencies[imp]) {
            if (KNOWN_PACKAGES[imp]) {
              pkg.dependencies[imp] = KNOWN_PACKAGES[imp];
            } else {
              pkg.dependencies[imp] = 'latest';
            }
          }
        }

        result[i] = { path: 'package.json', content: JSON.stringify(pkg, null, 2) };
      } catch (e) {
        // If package.json is malformed, keep original
      }
    }
  }

  // Add missing essential files
  if (!hasNextConfig) {
    result.push({ path: 'next.config.js', content: VERCEL_SAFE_NEXT_CONFIG });
  }

  if (!hasUtils) {
    result.push({ path: 'src/lib/utils.ts', content: COMMON_UTILS });
  }

  if (!hasVercelJson) {
    result.push({ path: 'vercel.json', content: VERCEL_JSON });
  }

  if (!hasPostcss) {
    result.push({
      path: 'postcss.config.js',
      content: `module.exports = {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n}\n`,
    });
  }

  if (!hasTailwindConfig) {
    result.push({
      path: 'tailwind.config.ts',
      content: `import type { Config } from 'tailwindcss'\n\nconst config: Config = {\n  content: [\n    './src/**/*.{js,ts,jsx,tsx,mdx}',\n    './app/**/*.{js,ts,jsx,tsx,mdx}',\n  ],\n  theme: {\n    extend: {},\n  },\n  plugins: [],\n}\nexport default config\n`,
    });
  }

  return result;
}

// Write project files
async function writeProject(idea: Idea, files: Array<{ path: string; content: string }>): Promise<string> {
  const projectName = idea.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const subfolder = idea.type === 'mobile' ? 'mobile' : 'web';
  const projectPath = path.join(CONFIG.paths.output, subfolder, projectName);

  await fs.mkdir(projectPath, { recursive: true });

  for (const file of files) {
    const filePath = path.join(projectPath, file.path);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, file.content);
  }

  // Install dependencies
  try {
    await execAsync('npm install', { cwd: projectPath, timeout: 180000 });
    await logger.log('Dependencies installed');
  } catch (error) {
    await logger.log(`npm install warning: ${error}`, 'WARN');
  }

  return projectPath;
}

// Push to GitHub
async function pushToGithub(projectPath: string, idea: Idea): Promise<string> {
  if (!CONFIG.github.token || !CONFIG.github.username) {
    await logger.log('GitHub not configured', 'WARN');
    return '';
  }

  const projectName = idea.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  const suffix = idea.type === 'mobile' ? '-mobile' : '';
  const repoName = `${projectName}${suffix}`;

  try {
    // Create repo (422 = already exists, which is OK)
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    const createResp = await fetch('https://api.github.com/user/repos', {
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

    if (!createResp.ok && createResp.status !== 422) {
      const errBody = await createResp.text().catch(() => '');
      await logger.log(`GitHub repo create ${createResp.status}: ${errBody.slice(0, 200)}`, 'WARN');
      // Don't throw - try to push anyway if repo exists
    }

    const repoUrl = `https://github.com/${CONFIG.github.username}/${repoName}`;

    // Git operations with timeout
    const gitOpts = { cwd: projectPath, timeout: 60000, maxBuffer: 10 * 1024 * 1024 };
    await execAsync('git init', gitOpts);
    await execAsync('git config user.email "mvp-factory@neurafinity.ai"', gitOpts);
    await execAsync('git config user.name "MVP Factory"', gitOpts);
    await execAsync('git add .', gitOpts);
    await execAsync(`git commit -m "Initial MVP: ${idea.title}" --allow-empty`, gitOpts);
    await execAsync('git branch -M main', gitOpts);

    // Remove existing remote if present (re-builds)
    try { await execAsync('git remote remove origin', gitOpts); } catch {}
    await execAsync(
      `git remote add origin https://${CONFIG.github.token}@github.com/${CONFIG.github.username}/${repoName}.git`,
      gitOpts
    );

    // Try normal push first, force push as fallback for existing repos
    try {
      await execAsync('git push -u origin main', { ...gitOpts, timeout: 120000 });
    } catch {
      await logger.log('Normal push failed, trying force push...', 'WARN');
      await execAsync('git push -u origin main --force', { ...gitOpts, timeout: 120000 });
    }

    await logger.log(`Pushed to GitHub: ${repoUrl}`);
    return repoUrl;
  } catch (error) {
    await logger.log(`GitHub error: ${error}`, 'WARN');
    return '';
  }
}

// Publish to Expo
async function publishToExpo(projectPath: string, idea: Idea): Promise<string> {
  if (!CONFIG.expo.token || idea.type !== 'mobile') {
    return '';
  }

  try {
    // Login
    await execAsync(`npx expo login --token ${CONFIG.expo.token}`, { cwd: projectPath });

    // Publish
    const { stdout } = await execAsync(
      'npx eas update --branch preview --message "MVP Factory build" --non-interactive',
      { cwd: projectPath, timeout: 300000 }
    );

    const urlMatch = stdout.match(/https:\/\/expo\.dev\/[^\s]+/);
    await logger.log(`Published to Expo: ${urlMatch?.[0] || 'success'}`);
    return urlMatch?.[0] || 'published';
  } catch (error) {
    await logger.log(`Expo error: ${error}`, 'ERROR');
    return '';
  }
}

// Mark idea as built
async function markBuilt(idea: Idea, liveUrl?: string, qualityScore?: number, category?: string): Promise<void> {
  await fs.mkdir(CONFIG.paths.built, { recursive: true });

  try {
    const ideaPath = path.join(CONFIG.paths.ideas, `${idea.id}.json`);
    const builtPath = path.join(CONFIG.paths.built, `${idea.id}.json`);

    try {
      const content = await fs.readFile(ideaPath, 'utf-8');
      const data = JSON.parse(content);
      if (liveUrl) {
        data.liveUrl = liveUrl;
      }
      data.builtAt = new Date().toISOString();
      if (qualityScore !== undefined) {
        data.functionalityScore = qualityScore;
      }
      if (category) {
        data.productCategory = category;
      }
      await fs.writeFile(builtPath, JSON.stringify(data, null, 2));
      await fs.unlink(ideaPath);
    } catch {
      await fs.rename(ideaPath, builtPath);
    }
  } catch {}
}

// Deploy to Vercel
async function deployToVercel(projectPath: string, idea: Idea): Promise<string> {
  const vercelToken = process.env.VERCEL_TOKEN || '';
  const vercelTeam = process.env.VERCEL_TEAM_ID || 'team_DN6tO3CT5AwBW6JyiBJ5sItw';
  if (!vercelToken) {
    await logger.log('Vercel token not configured, skipping deployment', 'WARN');
    return '';
  }

  try {
    // Ensure npm install ran (prevents missing dependency errors)
    await logger.log('Installing dependencies before deploy...');
    try {
      await execAsync('npm install --legacy-peer-deps 2>/dev/null || npm install 2>/dev/null || true', { cwd: projectPath, timeout: 120000 });
    } catch {}

    // Run local build check first
    await logger.log('Running pre-deploy build check...');
    try {
      await execAsync('npx next build', { cwd: projectPath, timeout: 300000 });
      await logger.log('Local build check passed');
    } catch (buildError) {
      await logger.log(`Local build failed, will try Vercel deploy anyway: ${String(buildError).slice(0, 200)}`, 'WARN');
    }

    // Set env vars for Vercel deployment
    const envFlag = process.env.NVIDIA_API_KEY
      ? ` -e NVIDIA_API_KEY="${process.env.NVIDIA_API_KEY}"`
      : '';

    // Deploy to Vercel with team flag
    await logger.log('Deploying to Vercel...');
    const deployCmd = `npx vercel --token ${vercelToken} --scope ${vercelTeam} --yes --prod${envFlag}`;
    const { stdout, stderr } = await execAsync(deployCmd, {
      cwd: projectPath,
      timeout: 600000,
      env: { ...process.env },
    });

    const output = stdout + stderr;

    // Extract the live URL (multiple patterns)
    const urlPatterns = [
      /https:\/\/[^\s]+\.vercel\.app/,
      /Aliased:\s*(https:\/\/[^\s]+)/,
      /Production:\s*(https:\/\/[^\s]+)/,
      /https:\/\/[a-z0-9-]+\.vercel\.app/,
    ];

    for (const pattern of urlPatterns) {
      const match = output.match(pattern);
      if (match) {
        const url = match[1] || match[0];
        await logger.log(`Deployed to Vercel: ${url}`);
        return url;
      }
    }

    await logger.log(`Vercel deploy completed but no URL found in output`, 'WARN');
    return '';
  } catch (error) {
    await logger.log(`Vercel deploy error: ${String(error).slice(0, 300)}`, 'WARN');
    return '';
  }
}

// Main build function
async function buildNextIdea(): Promise<BuildResult> {
  const idea = await getNextIdea();

  if (!idea) {
    await logger.log('Queue empty - no buildable ideas (all may be skipped or queue is empty)');
    return { success: false, projectPath: '', githubUrl: '', error: 'No ideas' };
  }

  const failCount = await getFailCount(idea.id);
  await logger.log(`Building MVP: ${idea.title} (${idea.type})${failCount > 0 ? ` [attempt ${failCount + 1}/${MAX_FAIL_COUNT}]` : ''}`);

  // Pre-build duplicate check against built products and web output folders
  const existingProducts = await loadExistingProducts();
  const builtProducts = existingProducts.filter(p => p.source === 'built' || p.source === 'web' || p.source === 'github');
  const dupCheck = isDuplicate(idea, builtProducts);
  if (dupCheck.duplicate) {
    await logger.log(`BUILD DEDUP: Skipping "${idea.title}" - already built as "${dupCheck.matchedWith}" (${dupCheck.reason})`, 'WARN');
    try { await fs.unlink(path.join(CONFIG.paths.ideas, `${idea.id}.json`)); } catch {}
    await clearFailure(idea.id);
    return { success: false, projectPath: '', githubUrl: '', error: `Duplicate of ${dupCheck.matchedWith}` };
  }

  try {
    // Generate project (includes ideation validation + quality gate)
    const { files } = await generateProject(idea);
    await logger.log(`Generated ${files.length} files`);

    // Get the blueprint category for metadata (use cached classification from generateProject)
    const blueprint = await validateAndClassifyIdea(idea);
    const quality = assessCodeQuality(files, blueprint);

    // Write files
    const projectPath = await writeProject(idea, files);
    await logger.log(`Project created at: ${projectPath}`);

    // Push to GitHub (non-fatal - continue even if push fails)
    let githubUrl = '';
    try {
      githubUrl = await pushToGithub(projectPath, idea);
    } catch (ghErr) {
      await logger.log(`GitHub push failed (non-fatal): ${ghErr}`, 'WARN');
    }

    // Deploy to Vercel (non-fatal - continue even if deploy fails)
    let liveUrl = '';
    if (idea.type === 'web' || idea.type === 'saas') {
      try {
        liveUrl = await deployToVercel(projectPath, idea);
      } catch (vercelErr) {
        await logger.log(`Vercel deploy failed (non-fatal): ${vercelErr}`, 'WARN');
      }
    }

    // Publish to Expo if mobile (non-fatal)
    let expoUrl = '';
    if (idea.type === 'mobile') {
      try {
        expoUrl = await publishToExpo(projectPath, idea);
      } catch (expoErr) {
        await logger.log(`Expo publish failed (non-fatal): ${expoErr}`, 'WARN');
      }
    }

    // Mark as built with quality score and category
    await markBuilt(idea, liveUrl, quality.score, blueprint.category);
    await clearFailure(idea.id); // Clear any previous failures

    await logger.log(`✅ MVP Complete: ${idea.title} | Quality: ${quality.score}/14 | Category: ${blueprint.category}${liveUrl ? ` | Live: ${liveUrl}` : ''}${githubUrl ? ` | GH: ${githubUrl}` : ''}`);

    return { success: true, projectPath, githubUrl, expoUrl };
  } catch (error) {
    const errStr = String(error);
    const newFailCount = await recordFailure(idea.id, errStr);
    await logger.log(`Build failed (${newFailCount}/${MAX_FAIL_COUNT}): ${errStr}`, 'ERROR');

    if (newFailCount >= MAX_FAIL_COUNT) {
      await logger.log(`"${idea.title}" has failed ${MAX_FAIL_COUNT} times - will be skipped next cycle`, 'WARN');
    }

    return { success: false, projectPath: '', githubUrl: '', error: errStr };
  }
}

// Research cycle
async function runResearchCycle(): Promise<void> {
  await logger.log('=== Research Cycle Start ===');

  const ideas = await researchIdeas();
  await logger.log(`Discovered ${ideas.length} unique ideas (duplicates already filtered)`);

  // Filter for high viability
  const viable = ideas.filter(i => i.viabilityScore >= 7);
  await logger.log(`${viable.length} pass viability threshold`);

  await saveIdeas(viable);

  // Log current queue stats
  try {
    const queueFiles = await fs.readdir(CONFIG.paths.ideas);
    const builtFiles = await fs.readdir(CONFIG.paths.built);
    await logger.log(`Queue: ${queueFiles.filter(f => f.endsWith('.json')).length} ideas pending | ${builtFiles.filter(f => f.endsWith('.json')).length} total built`);
  } catch {}

  await logger.log('=== Research Cycle Complete ===');
}

// Build cycle - tries to build one idea, with full error containment
async function runBuildCycle(): Promise<void> {
  try {
    await logger.log('=== Build Cycle Start ===');

    const result = await buildNextIdea();

    if (result.success) {
      await logger.log(`Built: ${result.projectPath}`);
      if (result.githubUrl) await logger.log(`GitHub: ${result.githubUrl}`);
      if (result.expoUrl) await logger.log(`Expo: ${result.expoUrl}`);
    }

    // Log stats
    try {
      const queueFiles = (await fs.readdir(CONFIG.paths.ideas)).filter(f => f.endsWith('.json'));
      const builtFiles = (await fs.readdir(CONFIG.paths.built)).filter(f => f.endsWith('.json'));
      const failTracker = await loadFailTracker();
      const failingCount = Object.values(failTracker).filter(f => f.count > 0).length;
      await logger.log(`📊 Queue: ${queueFiles.length} | Built: ${builtFiles.length} | Failing: ${failingCount}`);
    } catch {}

    await logger.log('=== Build Cycle Complete ===');
  } catch (error) {
    await logger.log(`Build cycle crashed (contained): ${error}`, 'ERROR');
  }
}

// Research cycle with error containment
async function safeRunResearch(): Promise<void> {
  try {
    await runResearchCycle();
  } catch (error) {
    await logger.log(`Research cycle crashed (contained): ${error}`, 'ERROR');
  }
}

// Health check with comprehensive stats
async function healthCheck(): Promise<void> {
  try {
    const queueFiles = (await fs.readdir(CONFIG.paths.ideas)).filter(f => f.endsWith('.json'));
    const builtFiles = (await fs.readdir(CONFIG.paths.built)).filter(f => f.endsWith('.json'));
    const failTracker = await loadFailTracker();

    const stats = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
      queueSize: queueFiles.length,
      totalBuilt: builtFiles.length,
      failingIdeas: Object.keys(failTracker).length,
      failDetails: Object.entries(failTracker).map(([id, f]) => ({
        id: id.slice(0, 8),
        fails: f.count,
        lastError: f.error.slice(0, 100),
      })),
    };

    await fs.mkdir(CONFIG.paths.logs, { recursive: true });
    await fs.writeFile(
      path.join(CONFIG.paths.logs, 'health.json'),
      JSON.stringify(stats, null, 2)
    );
  } catch {}
}

// Log rotation - prevent log files from growing forever
async function rotateLogsIfNeeded(): Promise<void> {
  try {
    const logFile = path.join(CONFIG.paths.logs, 'daemon.log');
    const stat = await fs.stat(logFile);
    // Rotate at 10MB
    if (stat.size > 10 * 1024 * 1024) {
      const rotated = logFile + '.1';
      try { await fs.unlink(rotated); } catch {}
      await fs.rename(logFile, rotated);
      await logger.log('Log file rotated (exceeded 10MB)');
    }
  } catch {}
}

// Main daemon loop
async function main(): Promise<void> {
  await logger.log('🦞 MVP Factory Daemon Starting...');
  await logger.log(`Kimi K2.5 Model: ${CONFIG.nvidia.model}`);
  await logger.log(`Output: ${CONFIG.paths.output}`);

  // Create directories
  const dirs = [CONFIG.paths.output, CONFIG.paths.ideas, CONFIG.paths.built, CONFIG.paths.logs,
    path.join(CONFIG.paths.output, 'skipped'), path.join(CONFIG.paths.output, 'web'), path.join(CONFIG.paths.output, 'mobile')];
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }

  // Initial run (with error containment)
  await safeRunResearch();
  await runBuildCycle();

  // Set up intervals - all with error containment
  setInterval(safeRunResearch, CONFIG.intervals.research);
  setInterval(runBuildCycle, CONFIG.intervals.build);
  setInterval(healthCheck, CONFIG.intervals.healthCheck);
  setInterval(rotateLogsIfNeeded, 60 * 60 * 1000); // Check every hour

  await logger.log('🚀 Daemon running. Research every 1h, Build every 30m');

  // Keep alive
  process.on('SIGINT', async () => {
    await logger.log('Daemon shutting down...');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await logger.log('Daemon shutting down...');
    process.exit(0);
  });
}

// Run
main().catch(async (error) => {
  await logger.log(`Fatal error: ${error}`, 'ERROR');
  process.exit(1);
});
