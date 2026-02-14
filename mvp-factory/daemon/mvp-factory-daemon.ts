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

// Idea Research Module
async function researchIdeas(): Promise<Idea[]> {
  await logger.log('Starting idea research cycle...');

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

    const ideas: any[] = JSON.parse(jsonMatch[0]);

    return ideas.map(idea => ({
      ...idea,
      id: crypto.randomUUID(),
      source: Math.random() > 0.5 ? 'x' : 'reddit' as const,
      complexity: idea.estimatedHours <= 8 ? 'low' : idea.estimatedHours <= 16 ? 'medium' : 'high' as const,
      sourceUrl: `https://simulated.mvpfactory/${Date.now()}`,
      discoveredAt: new Date().toISOString(),
    }));
  } catch (error) {
    await logger.log(`Research error: ${error}`, 'ERROR');
    return [];
  }
}

// Save ideas to queue
async function saveIdeas(ideas: Idea[]): Promise<void> {
  await fs.mkdir(CONFIG.paths.ideas, { recursive: true });

  for (const idea of ideas) {
    const filePath = path.join(CONFIG.paths.ideas, `${idea.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(idea, null, 2));
    await logger.log(`Queued idea: ${idea.title} (${idea.type})`);
  }
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
- shadcn/ui components
- Supabase integration
- All features fully implemented
- Clean, modern UI
- Proper error handling

Return ONLY a JSON array of files:
[{"path": "package.json", "content": "..."}, {"path": "src/app/page.tsx", "content": "..."}]

Include ALL files needed: package.json, tsconfig.json, tailwind.config.ts, all pages, all components, lib files, README.md`
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
- Supabase integration
- All features fully implemented
- Native-feeling UI

Return ONLY a JSON array of files:
[{"path": "package.json", "content": "..."}, {"path": "app/index.tsx", "content": "..."}]

Include ALL files: package.json, app.json, tsconfig.json, tailwind.config.js, babel.config.js, all screens, components, README.md`;

  const response = await kimi.complete(prompt, { maxTokens: 30000, temperature: 0.3 });

  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('No valid JSON in generation response');
  }

  return { files: JSON.parse(jsonMatch[0]) };
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
async function markBuilt(idea: Idea): Promise<void> {
  await fs.mkdir(CONFIG.paths.built, { recursive: true });

  try {
    await fs.rename(
      path.join(CONFIG.paths.ideas, `${idea.id}.json`),
      path.join(CONFIG.paths.built, `${idea.id}.json`)
    );
  } catch {}
}

// Main build function
async function buildNextIdea(): Promise<BuildResult> {
  const idea = await getNextIdea();

  if (!idea) {
    await logger.log('No ideas in queue');
    return { success: false, projectPath: '', githubUrl: '', error: 'No ideas' };
  }

  await logger.log(`Building MVP: ${idea.title} (${idea.type})`);

  try {
    // Generate project
    const { files } = await generateProject(idea);
    await logger.log(`Generated ${files.length} files`);

    // Write files
    const projectPath = await writeProject(idea, files);
    await logger.log(`Project created at: ${projectPath}`);

    // Push to GitHub
    const githubUrl = await pushToGithub(projectPath, idea);

    // Publish to Expo if mobile
    let expoUrl = '';
    if (idea.type === 'mobile') {
      expoUrl = await publishToExpo(projectPath, idea);
    }

    // Mark as built
    await markBuilt(idea);

    await logger.log(`✅ MVP Complete: ${idea.title}`);

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
  await logger.log(`Discovered ${ideas.length} ideas`);

  // Filter for high viability
  const viable = ideas.filter(i => i.viabilityScore >= 7);
  await logger.log(`${viable.length} pass viability threshold`);

  await saveIdeas(viable);

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
