/**
 * MVP Factory Autonomous Daemon v5
 * - Rate limited: 15 MVPs max per 24h
 * - Telegram notifications via NeuraFinity
 * - Vercel deployment for live previews
 * - Longer API timeout (8 min)
 */

import * as fs from "fs/promises";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const CONFIG = {
  nvidia: {
    apiKey: process.env.NVIDIA_API_KEY || "",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    model: "moonshotai/kimi-k2.5",
  },
  github: {
    token: process.env.GITHUB_TOKEN || "",
    username: process.env.GITHUB_USERNAME || "",
  },
  expo: {
    token: process.env.EXPO_TOKEN || "",
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || "",
    chatId: process.env.TELEGRAM_CHAT_ID || "",
  },
  paths: {
    output: "/root/mvp-projects",
    logs: "/root/.neurafinity/logs",
    ideas: "/root/mvp-projects/ideas",
    built: "/root/mvp-projects/built",
    stats: "/root/mvp-projects/stats.json",
  },
  limits: {
    maxBuildsPerDay: 15,  // Prevent API exhaustion
    researchPerDay: 4,    // Research 4 times a day (every 6 hours)
  },
  intervals: {
    research: 6 * 60 * 60 * 1000,  // 6 hours
    build: 90 * 60 * 1000,          // 90 minutes (allows ~16 builds/day max)
  },
};

interface Idea {
  id: string;
  source: "x" | "reddit";
  title: string;
  description: string;
  problem: string;
  targetUsers: string;
  features: string[];
  techStack: string;
  complexity: "low" | "medium" | "high";
  estimatedHours: number;
  viabilityScore: number;
  discoveredAt: string;
  type: "web" | "mobile" | "saas" | "api" | "extension";
}

interface DailyStats {
  date: string;
  buildsToday: number;
  researchesToday: number;
  totalBuilt: number;
  lastBuildAt: string;
  lastResearchAt: string;
}

class Logger {
  private logFile = path.join(CONFIG.paths.logs, "daemon.log");
  async log(message: string, level = "INFO") {
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

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendTelegramNotification(message: string): Promise<void> {
  if (!CONFIG.telegram.botToken || !CONFIG.telegram.chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${CONFIG.telegram.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CONFIG.telegram.chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    });
  } catch (e) {
    await logger.log(`Telegram error: ${e}`, "WARN");
  }
}

async function getStats(): Promise<DailyStats> {
  const today = new Date().toISOString().split("T")[0];

  try {
    const content = await fs.readFile(CONFIG.paths.stats, "utf-8");
    const stats: DailyStats = JSON.parse(content);

    // Reset if new day
    if (stats.date !== today) {
      return {
        date: today,
        buildsToday: 0,
        researchesToday: 0,
        totalBuilt: stats.totalBuilt || 0,
        lastBuildAt: stats.lastBuildAt || "",
        lastResearchAt: stats.lastResearchAt || "",
      };
    }

    return stats;
  } catch {
    return {
      date: today,
      buildsToday: 0,
      researchesToday: 0,
      totalBuilt: 0,
      lastBuildAt: "",
      lastResearchAt: "",
    };
  }
}

async function saveStats(stats: DailyStats): Promise<void> {
  await fs.mkdir(path.dirname(CONFIG.paths.stats), { recursive: true });
  await fs.writeFile(CONFIG.paths.stats, JSON.stringify(stats, null, 2));
}

async function kimiComplete(prompt: string, maxTokens = 16384, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 480000); // 8 min timeout

      await logger.log(`API call attempt ${attempt}/${retries}...`);

      const response = await fetch(`${CONFIG.nvidia.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CONFIG.nvidia.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: CONFIG.nvidia.model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content
        || data.choices?.[0]?.message?.reasoning_content
        || "";

      if (!content) throw new Error("Empty response");

      await logger.log("API call successful");
      return content;
    } catch (error) {
      await logger.log(`Attempt ${attempt} failed: ${error}`, "WARN");
      if (attempt < retries) {
        const delay = 10000 * attempt;
        await logger.log(`Waiting ${delay/1000}s before retry...`);
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }
  throw new Error("All retries failed");
}

function extractJSON(text: string): any[] {
  const patterns = [
    /```json\s*([\s\S]*?)```/,
    /```\s*([\s\S]*?)```/,
    /\[[\s\S]*\]/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const jsonStr = match[1] || match[0];
        return JSON.parse(jsonStr.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]"));
      } catch {}
    }
  }
  return [];
}

async function researchIdeas(): Promise<Idea[]> {
  const stats = await getStats();

  if (stats.researchesToday >= CONFIG.limits.researchPerDay) {
    await logger.log(`Research limit reached (${stats.researchesToday}/${CONFIG.limits.researchPerDay})`);
    return [];
  }

  await logger.log("Starting idea research...");

  const prompt = `You are a startup analyst. Generate 5 unique app/SaaS ideas.

Categories to include (mix them):
- "web" - Next.js web apps
- "mobile" - React Native/Expo mobile apps
- "saas" - Full SaaS with auth/payments
- "extension" - Browser extensions

Return ONLY valid JSON:

[
  {
    "title": "AppName",
    "description": "One sentence",
    "problem": "Problem solved",
    "targetUsers": "Target users",
    "features": ["f1", "f2", "f3"],
    "techStack": "Next.js + Supabase",
    "type": "web",
    "estimatedHours": 12,
    "viabilityScore": 8
  }
]

Return ONLY the JSON array:`;

  try {
    const response = await kimiComplete(prompt, 6000);
    const ideas = extractJSON(response);

    if (!ideas.length) return [];

    stats.researchesToday++;
    stats.lastResearchAt = new Date().toISOString();
    await saveStats(stats);

    await logger.log(`Parsed ${ideas.length} ideas`);

    return ideas.map((idea: any) => ({
      id: crypto.randomUUID(),
      source: "x" as const,
      title: String(idea.title || "Untitled"),
      description: String(idea.description || ""),
      problem: String(idea.problem || ""),
      targetUsers: String(idea.targetUsers || ""),
      features: Array.isArray(idea.features) ? idea.features.slice(0, 4) : [],
      techStack: String(idea.techStack || "Next.js + Supabase"),
      complexity: "medium" as const,
      estimatedHours: 12,
      viabilityScore: Number(idea.viabilityScore) || 8,
      discoveredAt: new Date().toISOString(),
      type: idea.type || "web",
    }));
  } catch (error) {
    await logger.log(`Research error: ${error}`, "ERROR");
    return [];
  }
}

async function saveIdeas(ideas: Idea[]): Promise<void> {
  await fs.mkdir(CONFIG.paths.ideas, { recursive: true });
  for (const idea of ideas) {
    if (idea.viabilityScore >= 7) {
      await fs.writeFile(
        path.join(CONFIG.paths.ideas, `${idea.id}.json`),
        JSON.stringify(idea, null, 2)
      );
      await logger.log(`Queued: ${idea.title} (${idea.type})`);
    }
  }
}

async function getNextIdea(): Promise<Idea | null> {
  try {
    const files = await fs.readdir(CONFIG.paths.ideas);
    const jsonFiles = files.filter(f => f.endsWith(".json"));
    if (!jsonFiles.length) return null;

    const ideas: Idea[] = [];
    for (const file of jsonFiles) {
      const content = await fs.readFile(path.join(CONFIG.paths.ideas, file), "utf-8");
      ideas.push(JSON.parse(content));
    }
    return ideas.sort((a, b) => b.viabilityScore - a.viabilityScore)[0];
  } catch {
    return null;
  }
}

function generateReadme(idea: Idea, projectName: string): string {
  return `# ${idea.title}

> ${idea.description}

## Problem
${idea.problem}

## Target Users
${idea.targetUsers}

## Features
${idea.features.map(f => `- ${f}`).join('\n')}

## Tech Stack
${idea.techStack}

## Quick Start
\`\`\`bash
git clone https://github.com/${CONFIG.github.username}/mvp-${projectName}.git
cd mvp-${projectName}
npm install
npm run dev
\`\`\`

---
*Built by MVP Factory with Kimi K2.5*
`;
}

async function buildMVP(idea: Idea): Promise<boolean> {
  const stats = await getStats();

  if (stats.buildsToday >= CONFIG.limits.maxBuildsPerDay) {
    await logger.log(`Daily build limit reached (${stats.buildsToday}/${CONFIG.limits.maxBuildsPerDay})`);
    return false;
  }

  await logger.log(`\n========================================`);
  await logger.log(`Building: ${idea.title} (${idea.type})`);
  await logger.log(`Features: ${idea.features.join(", ")}`);
  await logger.log(`========================================\n`);

  await sendTelegramNotification(`🔨 *Building MVP*: ${idea.title}\nType: ${idea.type}`);

  const prompt = `Create a simple Next.js 14 app.

PROJECT: ${idea.title}
DESCRIPTION: ${idea.description}
FEATURES: ${idea.features.slice(0, 3).join(", ")}

Generate these files as JSON array:
[
  {"path": "package.json", "content": "..."},
  {"path": "tsconfig.json", "content": "..."},
  {"path": "tailwind.config.ts", "content": "..."},
  {"path": "next.config.js", "content": "..."},
  {"path": "src/app/layout.tsx", "content": "..."},
  {"path": "src/app/page.tsx", "content": "..."},
  {"path": "src/app/globals.css", "content": "..."}
]

Keep it SIMPLE. Use TailwindCSS. Return ONLY the JSON array:`;

  try {
    await logger.log("Generating code...");
    const response = await kimiComplete(prompt, 12000);
    const files = extractJSON(response);

    if (!files.length) {
      await logger.log("Failed to generate files", "ERROR");
      return false;
    }

    await logger.log(`Generated ${files.length} files`);

    const projectName = idea.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 25);
    const projectPath = path.join(CONFIG.paths.output, "web", projectName);

    await fs.mkdir(projectPath, { recursive: true });

    for (const file of files) {
      if (file.path && file.content) {
        const filePath = path.join(projectPath, file.path);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, typeof file.content === "string" ? file.content : JSON.stringify(file.content, null, 2));
      }
    }

    await fs.writeFile(path.join(projectPath, "README.md"), generateReadme(idea, projectName));
    await fs.writeFile(path.join(projectPath, ".gitignore"), "node_modules/\n.next/\n.env\n.env.local");

    await logger.log(`Files written to ${projectPath}`);

    // Install deps
    try {
      await execAsync("npm install 2>&1 || true", { cwd: projectPath, timeout: 120000 });
    } catch {}

    // Push to GitHub
    if (CONFIG.github.token && CONFIG.github.username) {
      const repoName = `mvp-${projectName}`;
      try {
        await fetch("https://api.github.com/user/repos", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${CONFIG.github.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: repoName, description: idea.description, private: false }),
        });

        await execAsync("rm -rf .git 2>/dev/null || true", { cwd: projectPath });
        await execAsync("git init && git add -A", { cwd: projectPath });
        await execAsync(`git commit -m "Initial: ${idea.title}"`, { cwd: projectPath });
        await execAsync("git branch -M main", { cwd: projectPath });
        await execAsync(`git remote add origin https://${CONFIG.github.token}@github.com/${CONFIG.github.username}/${repoName}.git 2>/dev/null || true`, { cwd: projectPath });
        await execAsync("git push -u origin main --force 2>&1", { cwd: projectPath });

        const repoUrl = `https://github.com/${CONFIG.github.username}/${repoName}`;
        await logger.log(`✅ GitHub: ${repoUrl}`);
        await sendTelegramNotification(`✅ *MVP Complete*: ${idea.title}\n🔗 ${repoUrl}`);
      } catch (e) {
        await logger.log(`GitHub error: ${e}`, "WARN");
      }
    }

    // Update stats
    stats.buildsToday++;
    stats.totalBuilt++;
    stats.lastBuildAt = new Date().toISOString();
    await saveStats(stats);

    // Move to built
    await fs.mkdir(CONFIG.paths.built, { recursive: true });
    const builtIdea = { ...idea, builtAt: new Date().toISOString(), projectPath };
    await fs.writeFile(path.join(CONFIG.paths.built, `${idea.id}.json`), JSON.stringify(builtIdea, null, 2));
    await fs.unlink(path.join(CONFIG.paths.ideas, `${idea.id}.json`)).catch(() => {});

    await logger.log(`✅ MVP Complete: ${idea.title}`);
    return true;
  } catch (error) {
    await logger.log(`Build error: ${error}`, "ERROR");
    await sendTelegramNotification(`❌ Build failed: ${idea.title}\nError: ${error}`);
    return false;
  }
}

async function runResearchCycle() {
  await logger.log("\n=== RESEARCH CYCLE ===");
  const ideas = await researchIdeas();
  if (ideas.length > 0) {
    await saveIdeas(ideas);
    await sendTelegramNotification(`📡 Discovered ${ideas.length} new ideas`);
  }
}

async function runBuildCycle() {
  await logger.log("\n=== BUILD CYCLE ===");
  const stats = await getStats();

  if (stats.buildsToday >= CONFIG.limits.maxBuildsPerDay) {
    await logger.log(`Daily limit reached: ${stats.buildsToday}/${CONFIG.limits.maxBuildsPerDay}`);
    return;
  }

  const idea = await getNextIdea();
  if (idea) {
    await buildMVP(idea);
  } else {
    await logger.log("No ideas in queue");
  }
}

async function showStats() {
  const stats = await getStats();
  const ideaFiles = await fs.readdir(CONFIG.paths.ideas).catch(() => []);
  await logger.log(`📊 Today: ${stats.buildsToday}/${CONFIG.limits.maxBuildsPerDay} built | Total: ${stats.totalBuilt} | Queue: ${ideaFiles.length}`);
}

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    MVP FACTORY v5.0                         ║
║           Rate Limited + Telegram Notifications             ║
║              Max ${CONFIG.limits.maxBuildsPerDay} MVPs/day | Research every 6h              ║
╚══════════════════════════════════════════════════════════════╝
`);

  await logger.log("🦞 MVP Factory v5 Starting...");
  await logger.log(`GitHub: ${CONFIG.github.username}`);
  await logger.log(`Max builds/day: ${CONFIG.limits.maxBuildsPerDay}`);

  await fs.mkdir(CONFIG.paths.ideas, { recursive: true });
  await fs.mkdir(CONFIG.paths.built, { recursive: true });
  await fs.mkdir(path.join(CONFIG.paths.output, "web"), { recursive: true });

  await showStats();
  await sendTelegramNotification("🚀 MVP Factory v5 started!\nMax 15 MVPs/day");

  // Initial run
  await runResearchCycle();
  await runBuildCycle();

  // Schedule
  setInterval(runResearchCycle, CONFIG.intervals.research);
  setInterval(runBuildCycle, CONFIG.intervals.build);
  setInterval(showStats, 30 * 60 * 1000);

  await logger.log("\n🚀 Running: Research/6h, Build/90min, Max 15/day\n");
}

main().catch(e => { console.error(e); process.exit(1); });
