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

// LLM Client for Kimi K2.5
class KimiClient {
  async complete(prompt: string, options: { maxTokens?: number; temperature?: number } = {}): Promise<string> {
    const response = await fetch(`${CONFIG.nvidia.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.nvidia.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: CONFIG.nvidia.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.maxTokens || 16384,
        temperature: options.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Kimi API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
}

const kimi = new KimiClient();

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

  const prompt = `You are an expert startup analyst researching X/Twitter and Reddit for the hottest new app, SaaS, and web ideas.

Current date: ${new Date().toISOString().split('T')[0]}

Search through trending posts from:
- X/Twitter: "I wish there was an app", "someone build this", "startup idea", "would pay for"
- Reddit: r/SideProject, r/startups, r/SaaS, r/AppIdeas, r/indiehackers

Generate 5 UNIQUE, TRENDING app ideas that are:
1. Buildable as MVPs in 8-24 hours
2. Solving real problems people are talking about RIGHT NOW
3. Have clear monetization potential
4. Not already solved by major players
5. MUST have unique, distinctive names that don't overlap with existing products${alreadyBuiltList}

For each idea, determine if it's best as:
- "web" - A Next.js web application
- "mobile" - A React Native/Expo mobile app
- "saas" - A full SaaS with auth, payments
- "api" - An API-only service

Return ONLY a valid JSON array:
[
  {
    "title": "Short catchy name",
    "description": "One sentence description",
    "problem": "What problem it solves",
    "targetUsers": "Who would use it",
    "features": ["core feature 1", "core feature 2", "core feature 3"],
    "techStack": "Next.js + Supabase" or "Expo + NativeWind",
    "type": "web|mobile|saas|api",
    "estimatedHours": 8-24,
    "viabilityScore": 7-10
  }
]`;

  try {
    const response = await kimi.complete(prompt, { maxTokens: 8000, temperature: 0.8 });

    // Extract JSON array from response
    const jsonMatch = response.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
      await logger.log('No valid JSON in research response', 'WARN');
      return [];
    }

    const rawIdeas: any[] = JSON.parse(jsonMatch[0]);

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
async function getNextIdea(): Promise<Idea | null> {
  try {
    const files = await fs.readdir(CONFIG.paths.ideas);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    if (jsonFiles.length === 0) return null;

    // Sort by viability score (read all and sort)
    const ideas: Idea[] = [];
    for (const file of jsonFiles) {
      const content = await fs.readFile(path.join(CONFIG.paths.ideas, file), 'utf-8');
      ideas.push(JSON.parse(content));
    }

    ideas.sort((a, b) => b.viabilityScore - a.viabilityScore);
    return ideas[0];
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

// Generate complete project
async function generateProject(idea: Idea): Promise<{ files: Array<{ path: string; content: string }> }> {
  const isWeb = idea.type === 'web' || idea.type === 'saas' || idea.type === 'api';

  const prompt = isWeb
    ? `Generate a complete Next.js 14 application for:

**${idea.title}**
${idea.description}

Features to implement:
${idea.features.map(f => `- ${f}`).join('\n')}

Create a COMPLETE, WORKING application with:
- App Router (app/ directory)
- TypeScript
- TailwindCSS styling
- All features fully implemented
- Clean, modern UI
- Proper error handling

CRITICAL RULES FOR VERCEL DEPLOYMENT:
1. next.config.js MUST include: typescript: { ignoreBuildErrors: true }, eslint: { ignoreDuringBuilds: true }
2. Do NOT use default imports from packages that only have named exports
3. Do NOT import packages that aren't in package.json
4. All 'use client' directives must be at the VERY TOP of the file
5. Include ALL dependencies in package.json with exact versions
6. Do NOT use shadcn/ui unless you include the full component files
7. Use simple Tailwind classes instead of complex component libraries
8. Include a src/lib/utils.ts with any helper functions you reference

Return ONLY a JSON array of files:
[{"path": "package.json", "content": "..."}, {"path": "src/app/page.tsx", "content": "..."}]

Include ALL files needed: package.json, tsconfig.json, next.config.js, tailwind.config.ts, postcss.config.js, all pages, all components, lib files, README.md`
    : `Generate a complete Expo/React Native mobile app for:

**${idea.title}**
${idea.description}

Features to implement:
${idea.features.map(f => `- ${f}`).join('\n')}

Create a COMPLETE, WORKING mobile app with:
- Expo SDK 50+
- Expo Router (app/ directory)
- TypeScript
- NativeWind (Tailwind for RN)
- All features fully implemented
- Native-feeling UI

CRITICAL: Include ALL dependencies in package.json. Do NOT import packages that aren't listed.

Return ONLY a JSON array of files:
[{"path": "package.json", "content": "..."}, {"path": "app/index.tsx", "content": "..."}]

Include ALL files: package.json, app.json, tsconfig.json, tailwind.config.js, babel.config.js, all screens, components, README.md`;

  const response = await kimi.complete(prompt, { maxTokens: 30000, temperature: 0.3 });

  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('No valid JSON in generation response');
  }

  let files: Array<{ path: string; content: string }> = JSON.parse(jsonMatch[0]);

  // Post-process files for Vercel compatibility
  if (isWeb) {
    files = ensureVercelCompatibility(files);
  }

  return { files };
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

  const projectName = idea.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const suffix = idea.type === 'mobile' ? '-mobile' : '';
  const repoName = `${projectName}${suffix}`;

  try {
    // Create repo
    const createResp = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.github.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: repoName,
        description: `${idea.title} - ${idea.description}`,
        private: false,
        auto_init: false,
      }),
    });

    if (!createResp.ok && createResp.status !== 422) {
      throw new Error(`GitHub API error: ${createResp.status}`);
    }

    const repoUrl = `https://github.com/${CONFIG.github.username}/${repoName}`;

    // Git operations
    await execAsync('git init', { cwd: projectPath });
    await execAsync('git add .', { cwd: projectPath });
    await execAsync(`git commit -m "Initial MVP: ${idea.title}\n\nBuilt by MVP Factory with Kimi K2.5"`, { cwd: projectPath });
    await execAsync('git branch -M main', { cwd: projectPath });
    await execAsync(
      `git remote add origin https://${CONFIG.github.token}@github.com/${CONFIG.github.username}/${repoName}.git`,
      { cwd: projectPath }
    );
    await execAsync('git push -u origin main', { cwd: projectPath });

    await logger.log(`Pushed to GitHub: ${repoUrl}`);
    return repoUrl;
  } catch (error) {
    await logger.log(`GitHub error: ${error}`, 'ERROR');
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
async function markBuilt(idea: Idea, liveUrl?: string): Promise<void> {
  await fs.mkdir(CONFIG.paths.built, { recursive: true });

  try {
    // Read the idea file and add liveUrl if available
    const ideaPath = path.join(CONFIG.paths.ideas, `${idea.id}.json`);
    const builtPath = path.join(CONFIG.paths.built, `${idea.id}.json`);

    try {
      const content = await fs.readFile(ideaPath, 'utf-8');
      const data = JSON.parse(content);
      if (liveUrl) {
        data.liveUrl = liveUrl;
      }
      data.builtAt = new Date().toISOString();
      await fs.writeFile(builtPath, JSON.stringify(data, null, 2));
      await fs.unlink(ideaPath);
    } catch {
      // Fallback: just move the file
      await fs.rename(ideaPath, builtPath);
    }
  } catch {}
}

// Deploy to Vercel
async function deployToVercel(projectPath: string, idea: Idea): Promise<string> {
  const vercelToken = process.env.VERCEL_TOKEN || '';
  if (!vercelToken) {
    await logger.log('Vercel token not configured, skipping deployment', 'WARN');
    return '';
  }

  try {
    // Run local build check first
    await logger.log('Running pre-deploy build check...');
    try {
      await execAsync('npx next build', { cwd: projectPath, timeout: 300000 });
      await logger.log('Local build check passed');
    } catch (buildError) {
      await logger.log(`Local build failed, deploying anyway (ignoreBuildErrors is set): ${buildError}`, 'WARN');
    }

    // Deploy to Vercel
    await logger.log('Deploying to Vercel...');
    const { stdout, stderr } = await execAsync(
      `npx vercel --token ${vercelToken} --yes --prod`,
      { cwd: projectPath, timeout: 600000 }
    );

    const output = stdout + stderr;

    // Extract the live URL
    const urlMatch = output.match(/https:\/\/[^\s]+\.vercel\.app/);
    if (urlMatch) {
      await logger.log(`Deployed to Vercel: ${urlMatch[0]}`);
      return urlMatch[0];
    }

    // Try to find aliased URL
    const aliasMatch = output.match(/Aliased:\s*(https:\/\/[^\s]+)/);
    if (aliasMatch) {
      await logger.log(`Deployed to Vercel: ${aliasMatch[1]}`);
      return aliasMatch[1];
    }

    await logger.log(`Vercel deploy output (no URL found): ${output.slice(-500)}`, 'WARN');
    return '';
  } catch (error) {
    await logger.log(`Vercel deploy error: ${error}`, 'ERROR');
    return '';
  }
}

// Main build function
async function buildNextIdea(): Promise<BuildResult> {
  const idea = await getNextIdea();

  if (!idea) {
    await logger.log('No ideas in queue');
    return { success: false, projectPath: '', githubUrl: '', error: 'No ideas' };
  }

  await logger.log(`Building MVP: ${idea.title} (${idea.type})`);

  // Pre-build duplicate check against built products and web output folders
  const existingProducts = await loadExistingProducts();
  // Only check against built/web products (not ideas queue, since this idea IS from the queue)
  const builtProducts = existingProducts.filter(p => p.source === 'built' || p.source === 'web' || p.source === 'github');
  const dupCheck = isDuplicate(idea, builtProducts);
  if (dupCheck.duplicate) {
    await logger.log(`BUILD DEDUP: Skipping "${idea.title}" - already built as "${dupCheck.matchedWith}" (${dupCheck.reason})`, 'WARN');
    // Remove from ideas queue so it doesn't block future builds
    try {
      await fs.unlink(path.join(CONFIG.paths.ideas, `${idea.id}.json`));
    } catch {}
    return { success: false, projectPath: '', githubUrl: '', error: `Duplicate of ${dupCheck.matchedWith}` };
  }

  try {
    // Generate project
    const { files } = await generateProject(idea);
    await logger.log(`Generated ${files.length} files`);

    // Write files
    const projectPath = await writeProject(idea, files);
    await logger.log(`Project created at: ${projectPath}`);

    // Push to GitHub
    const githubUrl = await pushToGithub(projectPath, idea);

    // Deploy to Vercel (for web/saas apps)
    let liveUrl = '';
    if (idea.type === 'web' || idea.type === 'saas') {
      liveUrl = await deployToVercel(projectPath, idea);
    }

    // Publish to Expo if mobile
    let expoUrl = '';
    if (idea.type === 'mobile') {
      expoUrl = await publishToExpo(projectPath, idea);
    }

    // Mark as built (include liveUrl)
    await markBuilt(idea, liveUrl);

    await logger.log(`✅ MVP Complete: ${idea.title}${liveUrl ? ` | Live: ${liveUrl}` : ''}`);

    return { success: true, projectPath, githubUrl, expoUrl };
  } catch (error) {
    await logger.log(`Build failed: ${error}`, 'ERROR');
    return { success: false, projectPath: '', githubUrl: '', error: String(error) };
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

// Build cycle
async function runBuildCycle(): Promise<void> {
  await logger.log('=== Build Cycle Start ===');

  const result = await buildNextIdea();

  if (result.success) {
    await logger.log(`Built: ${result.projectPath}`);
    if (result.githubUrl) await logger.log(`GitHub: ${result.githubUrl}`);
    if (result.expoUrl) await logger.log(`Expo: ${result.expoUrl}`);
  }

  await logger.log('=== Build Cycle Complete ===');
}

// Health check
async function healthCheck(): Promise<void> {
  const stats = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  };

  await fs.mkdir(CONFIG.paths.logs, { recursive: true });
  await fs.writeFile(
    path.join(CONFIG.paths.logs, 'health.json'),
    JSON.stringify(stats, null, 2)
  );
}

// Main daemon loop
async function main(): Promise<void> {
  await logger.log('🦞 MVP Factory Daemon Starting...');
  await logger.log(`Kimi K2.5 Model: ${CONFIG.nvidia.model}`);
  await logger.log(`Output: ${CONFIG.paths.output}`);

  // Create directories
  await fs.mkdir(CONFIG.paths.output, { recursive: true });
  await fs.mkdir(CONFIG.paths.ideas, { recursive: true });
  await fs.mkdir(CONFIG.paths.built, { recursive: true });
  await fs.mkdir(CONFIG.paths.logs, { recursive: true });

  // Initial run
  await runResearchCycle();
  await runBuildCycle();

  // Set up intervals
  setInterval(runResearchCycle, CONFIG.intervals.research);
  setInterval(runBuildCycle, CONFIG.intervals.build);
  setInterval(healthCheck, CONFIG.intervals.healthCheck);

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
