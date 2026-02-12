/**
 * MVP Factory Autonomous Daemon v6
 * - Vercel auto-deployment for live previews
 * - Chrome extension building
 * - Rate limited: 15 MVPs/day
 * - Telegram notifications
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
  vercel: {
    token: process.env.VERCEL_TOKEN || "",
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
    logs: "/root/.openclaw/logs",
    ideas: "/root/mvp-projects/ideas",
    built: "/root/mvp-projects/built",
    stats: "/root/mvp-projects/stats.json",
  },
  limits: {
    maxBuildsPerDay: 15,
    researchPerDay: 4,
  },
  intervals: {
    research: 6 * 60 * 60 * 1000,
    build: 90 * 60 * 1000,
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
  deployedUrls: string[];
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

async function sendTelegram(message: string): Promise<void> {
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
  } catch {}
}

async function getStats(): Promise<DailyStats> {
  const today = new Date().toISOString().split("T")[0];
  try {
    const content = await fs.readFile(CONFIG.paths.stats, "utf-8");
    const stats: DailyStats = JSON.parse(content);
    if (stats.date !== today) {
      return { date: today, buildsToday: 0, researchesToday: 0, totalBuilt: stats.totalBuilt || 0, lastBuildAt: "", lastResearchAt: "", deployedUrls: [] };
    }
    return stats;
  } catch {
    return { date: today, buildsToday: 0, researchesToday: 0, totalBuilt: 0, lastBuildAt: "", lastResearchAt: "", deployedUrls: [] };
  }
}

async function saveStats(stats: DailyStats): Promise<void> {
  await fs.writeFile(CONFIG.paths.stats, JSON.stringify(stats, null, 2));
}

async function kimiComplete(prompt: string, maxTokens = 16384, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 480000);

      await logger.log(`API attempt ${attempt}/${retries}...`);

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

      if (!response.ok) throw new Error(`API ${response.status}`);

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || data.choices?.[0]?.message?.reasoning_content || "";
      if (!content) throw new Error("Empty response");

      return content;
    } catch (error) {
      await logger.log(`Attempt ${attempt} failed: ${error}`, "WARN");
      if (attempt < retries) await sleep(10000 * attempt);
      else throw error;
    }
  }
  throw new Error("All retries failed");
}

function extractJSON(text: string): any[] {
  const patterns = [/```json\s*([\s\S]*?)```/, /```\s*([\s\S]*?)```/, /\[[\s\S]*\]/];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        return JSON.parse((match[1] || match[0]).replace(/,\s*}/g, "}").replace(/,\s*]/g, "]"));
      } catch {}
    }
  }
  return [];
}

async function researchIdeas(): Promise<Idea[]> {
  const stats = await getStats();
  if (stats.researchesToday >= CONFIG.limits.researchPerDay) {
    await logger.log(`Research limit reached`);
    return [];
  }

  await logger.log("Researching ideas...");

  const prompt = `Generate 5 unique app ideas. Mix these types:
- "web" - Next.js web apps
- "mobile" - React Native/Expo apps
- "saas" - SaaS with auth/payments
- "extension" - Chrome browser extensions

Return ONLY JSON array:
[{"title":"Name","description":"One line","problem":"Problem","targetUsers":"Users","features":["f1","f2","f3"],"techStack":"Stack","type":"web|mobile|saas|extension","estimatedHours":12,"viabilityScore":8}]`;

  try {
    const response = await kimiComplete(prompt, 6000);
    const ideas = extractJSON(response);
    if (!ideas.length) return [];

    stats.researchesToday++;
    stats.lastResearchAt = new Date().toISOString();
    await saveStats(stats);

    return ideas.map((idea: any) => ({
      id: crypto.randomUUID(),
      source: "x" as const,
      title: String(idea.title || "App"),
      description: String(idea.description || ""),
      problem: String(idea.problem || ""),
      targetUsers: String(idea.targetUsers || ""),
      features: (idea.features || []).slice(0, 4),
      techStack: String(idea.techStack || "Next.js"),
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
    await fs.writeFile(path.join(CONFIG.paths.ideas, `${idea.id}.json`), JSON.stringify(idea, null, 2));
    await logger.log(`Queued: ${idea.title} (${idea.type})`);
  }
}

async function getNextIdea(): Promise<Idea | null> {
  try {
    const files = await fs.readdir(CONFIG.paths.ideas);
    const jsonFiles = files.filter(f => f.endsWith(".json"));
    if (!jsonFiles.length) return null;
    const ideas: Idea[] = [];
    for (const file of jsonFiles) {
      ideas.push(JSON.parse(await fs.readFile(path.join(CONFIG.paths.ideas, file), "utf-8")));
    }
    return ideas.sort((a, b) => b.viabilityScore - a.viabilityScore)[0];
  } catch { return null; }
}

// ============= BUILD FUNCTIONS =============

async function buildWebApp(idea: Idea, projectPath: string): Promise<boolean> {
  const prompt = `Create Next.js 14 app for: ${idea.title}
Description: ${idea.description}
Features: ${idea.features.join(", ")}

Return JSON array of files:
[{"path":"package.json","content":"..."},{"path":"src/app/page.tsx","content":"..."},...]

Include: package.json, next.config.js, tailwind.config.ts, src/app/layout.tsx, src/app/page.tsx, src/app/globals.css
Keep simple. Use TailwindCSS. Return ONLY JSON:`;

  const response = await kimiComplete(prompt, 12000);
  const files = extractJSON(response);
  if (!files.length) return false;

  for (const file of files) {
    if (file.path && file.content) {
      const filePath = path.join(projectPath, file.path);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, typeof file.content === "string" ? file.content : JSON.stringify(file.content, null, 2));
    }
  }
  return true;
}

async function buildMobileApp(idea: Idea, projectPath: string): Promise<boolean> {
  const prompt = `Create Expo React Native app for: ${idea.title}
Description: ${idea.description}
Features: ${idea.features.join(", ")}

Return JSON array:
[{"path":"package.json","content":"..."},{"path":"app/index.tsx","content":"..."},...]

Include: package.json, app.json, app/_layout.tsx, app/index.tsx
Use Expo Router. Return ONLY JSON:`;

  const response = await kimiComplete(prompt, 12000);
  const files = extractJSON(response);
  if (!files.length) return false;

  for (const file of files) {
    if (file.path && file.content) {
      const filePath = path.join(projectPath, file.path);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, typeof file.content === "string" ? file.content : JSON.stringify(file.content, null, 2));
    }
  }
  return true;
}

async function buildChromeExtension(idea: Idea, projectPath: string): Promise<boolean> {
  await logger.log("Building Chrome Extension...");

  const prompt = `Create Chrome Extension for: ${idea.title}
Description: ${idea.description}
Features: ${idea.features.join(", ")}

Return JSON array of files:
[
  {"path":"manifest.json","content":"..."},
  {"path":"popup.html","content":"..."},
  {"path":"popup.js","content":"..."},
  {"path":"popup.css","content":"..."},
  {"path":"background.js","content":"..."},
  {"path":"content.js","content":"..."},
  {"path":"icons/icon16.png","content":"placeholder"},
  {"path":"icons/icon48.png","content":"placeholder"},
  {"path":"icons/icon128.png","content":"placeholder"}
]

manifest.json must include:
- manifest_version: 3
- name, version, description
- action with default_popup
- permissions needed
- background service_worker
- content_scripts if needed

Make it functional! Return ONLY JSON:`;

  const response = await kimiComplete(prompt, 10000);
  const files = extractJSON(response);
  if (!files.length) return false;

  for (const file of files) {
    if (file.path && file.content) {
      const filePath = path.join(projectPath, file.path);
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // Skip placeholder icons, create simple SVG icons instead
      if (file.path.includes("icon") && file.path.endsWith(".png")) {
        // Create a simple colored square as placeholder
        continue;
      }

      await fs.writeFile(filePath, typeof file.content === "string" ? file.content : JSON.stringify(file.content, null, 2));
    }
  }

  // Create simple placeholder icons
  const iconSizes = [16, 48, 128];
  await fs.mkdir(path.join(projectPath, "icons"), { recursive: true });

  for (const size of iconSizes) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="#4F46E5" rx="${size/8}"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".35em" fill="white" font-size="${size/2}" font-family="Arial">${idea.title.charAt(0)}</text>
    </svg>`;
    await fs.writeFile(path.join(projectPath, `icons/icon${size}.svg`), svg);
  }

  // Create a zip for Chrome Web Store
  try {
    await execAsync(`cd "${projectPath}" && zip -r "../${path.basename(projectPath)}.zip" . -x "*.git*"`, { timeout: 30000 });
    await logger.log("Created extension .zip package");
  } catch {}

  return true;
}

// ============= DEPLOYMENT =============

async function deployToVercel(projectPath: string, projectName: string): Promise<string> {
  if (!CONFIG.vercel.token) {
    await logger.log("Vercel token not configured", "WARN");
    return "";
  }

  await logger.log("Deploying to Vercel...");

  try {
    // Create vercel.json
    await fs.writeFile(path.join(projectPath, "vercel.json"), JSON.stringify({
      buildCommand: "npm run build",
      outputDirectory: ".next",
      framework: "nextjs"
    }, null, 2));

    // Deploy using Vercel CLI
    const { stdout } = await execAsync(
      `cd "${projectPath}" && npx vercel --token ${CONFIG.vercel.token} --yes --prod 2>&1`,
      { timeout: 300000 }
    );

    // Extract URL from output
    const urlMatch = stdout.match(/https:\/\/[^\s]+\.vercel\.app/);
    if (urlMatch) {
      await logger.log(`✅ Vercel: ${urlMatch[0]}`);
      return urlMatch[0];
    }

    // Try alternative pattern
    const altMatch = stdout.match(/Production: (https:\/\/[^\s]+)/);
    if (altMatch) {
      await logger.log(`✅ Vercel: ${altMatch[1]}`);
      return altMatch[1];
    }

    await logger.log("Vercel deployed but couldn't extract URL");
    return "";
  } catch (error) {
    await logger.log(`Vercel error: ${error}`, "WARN");
    return "";
  }
}

async function deployToExpo(projectPath: string): Promise<string> {
  if (!CONFIG.expo.token) return "";

  try {
    await execAsync(`EXPO_TOKEN=${CONFIG.expo.token} npx eas update --branch preview --non-interactive 2>&1 || true`, {
      cwd: projectPath,
      timeout: 300000,
    });
    return "expo-go";
  } catch {
    return "";
  }
}

async function pushToGithub(projectPath: string, idea: Idea, projectName: string): Promise<string> {
  if (!CONFIG.github.token || !CONFIG.github.username) return "";

  const repoName = `mvp-${projectName}`;

  try {
    await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: { Authorization: `Bearer ${CONFIG.github.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: repoName, description: idea.description, private: false }),
    });

    await execAsync("rm -rf .git 2>/dev/null || true", { cwd: projectPath });
    await execAsync("git init && git add -A", { cwd: projectPath });
    await execAsync(`git commit -m "Initial: ${idea.title} (${idea.type})"`, { cwd: projectPath });
    await execAsync("git branch -M main", { cwd: projectPath });
    await execAsync(`git remote add origin https://${CONFIG.github.token}@github.com/${CONFIG.github.username}/${repoName}.git 2>/dev/null || true`, { cwd: projectPath });
    await execAsync("git push -u origin main --force 2>&1", { cwd: projectPath });

    return `https://github.com/${CONFIG.github.username}/${repoName}`;
  } catch (e) {
    await logger.log(`GitHub error: ${e}`, "WARN");
    return "";
  }
}

// ============= MAIN BUILD =============

async function buildMVP(idea: Idea): Promise<boolean> {
  const stats = await getStats();

  if (stats.buildsToday >= CONFIG.limits.maxBuildsPerDay) {
    await logger.log(`Daily limit reached: ${stats.buildsToday}/${CONFIG.limits.maxBuildsPerDay}`);
    return false;
  }

  await logger.log(`\n========================================`);
  await logger.log(`Building: ${idea.title}`);
  await logger.log(`Type: ${idea.type.toUpperCase()}`);
  await logger.log(`Features: ${idea.features.join(", ")}`);
  await logger.log(`========================================\n`);

  await sendTelegram(`🔨 *Building*: ${idea.title}\nType: ${idea.type}`);

  const projectName = idea.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 25);
  const typeFolder = idea.type === "extension" ? "extensions" : idea.type === "mobile" ? "mobile" : "web";
  const projectPath = path.join(CONFIG.paths.output, typeFolder, projectName);

  await fs.mkdir(projectPath, { recursive: true });

  let buildSuccess = false;

  try {
    // Build based on type
    switch (idea.type) {
      case "extension":
        buildSuccess = await buildChromeExtension(idea, projectPath);
        break;
      case "mobile":
        buildSuccess = await buildMobileApp(idea, projectPath);
        break;
      default: // web, saas, api
        buildSuccess = await buildWebApp(idea, projectPath);
    }

    if (!buildSuccess) {
      await logger.log("Build failed - no files generated", "ERROR");
      return false;
    }

    await logger.log(`Files generated for ${idea.type}`);

    // Create README
    const readme = `# ${idea.title}

> ${idea.description}

## Type
${idea.type.toUpperCase()}

## Problem
${idea.problem}

## Features
${idea.features.map(f => `- ${f}`).join('\n')}

## Tech Stack
${idea.techStack}

${idea.type === "extension" ? `## Install Chrome Extension
1. Go to chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select this folder

Or upload the .zip to Chrome Web Store.
` : `## Quick Start
\`\`\`bash
npm install
npm run dev
\`\`\``}

---
*Built by MVP Factory with Kimi K2.5*
`;
    await fs.writeFile(path.join(projectPath, "README.md"), readme);

    // Install dependencies (except for extensions)
    if (idea.type !== "extension") {
      try {
        await execAsync("npm install 2>&1 || true", { cwd: projectPath, timeout: 120000 });
      } catch {}
    }

    // Push to GitHub
    const githubUrl = await pushToGithub(projectPath, idea, projectName);
    if (githubUrl) await logger.log(`GitHub: ${githubUrl}`);

    // Deploy based on type
    let liveUrl = "";

    if (idea.type === "web" || idea.type === "saas") {
      liveUrl = await deployToVercel(projectPath, projectName);
    } else if (idea.type === "mobile") {
      liveUrl = await deployToExpo(projectPath);
    }

    // Update stats
    stats.buildsToday++;
    stats.totalBuilt++;
    stats.lastBuildAt = new Date().toISOString();
    if (liveUrl) stats.deployedUrls.push(liveUrl);
    await saveStats(stats);

    // Move to built
    await fs.mkdir(CONFIG.paths.built, { recursive: true });
    const builtIdea = {
      ...idea,
      builtAt: new Date().toISOString(),
      projectPath,
      githubUrl,
      liveUrl,
    };
    await fs.writeFile(path.join(CONFIG.paths.built, `${idea.id}.json`), JSON.stringify(builtIdea, null, 2));
    await fs.unlink(path.join(CONFIG.paths.ideas, `${idea.id}.json`)).catch(() => {});

    // Send notification
    let notification = `✅ *MVP Complete*: ${idea.title}\n📦 Type: ${idea.type}`;
    if (githubUrl) notification += `\n🔗 GitHub: ${githubUrl}`;
    if (liveUrl) notification += `\n🌐 Live: ${liveUrl}`;
    await sendTelegram(notification);

    await logger.log(`\n✅ MVP Complete: ${idea.title}`);
    await logger.log(`   GitHub: ${githubUrl}`);
    if (liveUrl) await logger.log(`   Live: ${liveUrl}`);

    return true;
  } catch (error) {
    await logger.log(`Build error: ${error}`, "ERROR");
    await sendTelegram(`❌ Build failed: ${idea.title}\n${error}`);
    return false;
  }
}

async function runResearchCycle() {
  await logger.log("\n=== RESEARCH CYCLE ===");
  const ideas = await researchIdeas();
  if (ideas.length > 0) {
    await saveIdeas(ideas);
    await sendTelegram(`📡 Discovered ${ideas.length} new ideas:\n${ideas.map(i => `- ${i.title} (${i.type})`).join('\n')}`);
  }
}

async function runBuildCycle() {
  await logger.log("\n=== BUILD CYCLE ===");
  const stats = await getStats();

  if (stats.buildsToday >= CONFIG.limits.maxBuildsPerDay) {
    await logger.log(`Daily limit: ${stats.buildsToday}/${CONFIG.limits.maxBuildsPerDay}`);
    return;
  }

  const idea = await getNextIdea();
  if (idea) {
    await buildMVP(idea);
  } else {
    await logger.log("Queue empty");
  }
}

async function showStats() {
  const stats = await getStats();
  const ideaFiles = await fs.readdir(CONFIG.paths.ideas).catch(() => []);
  await logger.log(`📊 Today: ${stats.buildsToday}/${CONFIG.limits.maxBuildsPerDay} | Total: ${stats.totalBuilt} | Queue: ${ideaFiles.length}`);
}

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    MVP FACTORY v6.0                         ║
║     Vercel Deploy + Chrome Extensions + Rate Limiting       ║
║         Max 15/day | Web + Mobile + SaaS + Extensions       ║
╚══════════════════════════════════════════════════════════════╝
`);

  await logger.log("🦞 MVP Factory v6 Starting...");
  await logger.log(`GitHub: ${CONFIG.github.username}`);
  await logger.log(`Vercel: ${CONFIG.vercel.token ? "configured" : "NOT SET"}`);
  await logger.log(`Expo: ${CONFIG.expo.token ? "configured" : "NOT SET"}`);
  await logger.log(`Max builds/day: ${CONFIG.limits.maxBuildsPerDay}`);

  await fs.mkdir(CONFIG.paths.ideas, { recursive: true });
  await fs.mkdir(CONFIG.paths.built, { recursive: true });
  await fs.mkdir(path.join(CONFIG.paths.output, "web"), { recursive: true });
  await fs.mkdir(path.join(CONFIG.paths.output, "mobile"), { recursive: true });
  await fs.mkdir(path.join(CONFIG.paths.output, "extensions"), { recursive: true });

  await showStats();
  await sendTelegram("🚀 *MVP Factory v6* started!\n• Max 15/day\n• Web + Mobile + Extensions\n• Vercel auto-deploy");

  await runResearchCycle();
  await runBuildCycle();

  setInterval(runResearchCycle, CONFIG.intervals.research);
  setInterval(runBuildCycle, CONFIG.intervals.build);
  setInterval(showStats, 30 * 60 * 1000);

  await logger.log("\n🚀 Running: Research/6h, Build/90min\n");
}

main().catch(e => { console.error(e); process.exit(1); });
