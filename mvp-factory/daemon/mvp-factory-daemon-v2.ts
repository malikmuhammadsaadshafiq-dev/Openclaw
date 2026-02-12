/**
 * MVP Factory Autonomous Daemon v2
 * Fixed JSON parsing + better prompts
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
  paths: {
    output: "/root/mvp-projects",
    logs: "/root/.openclaw/logs",
    ideas: "/root/mvp-projects/ideas",
    built: "/root/mvp-projects/built",
  },
  intervals: {
    research: 60 * 60 * 1000,
    build: 30 * 60 * 1000,
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
  type: "web" | "mobile" | "saas" | "api";
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

async function kimiComplete(prompt: string, maxTokens = 16384): Promise<string> {
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
  });

  if (!response.ok) throw new Error(`Kimi API error: ${response.statusText}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

function extractJSON(text: string): any[] {
  // Try multiple patterns to find JSON
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
        // Clean common JSON issues
        const cleaned = jsonStr
          .replace(/,\s*}/g, "}")
          .replace(/,\s*]/g, "]")
          .replace(/'/g, '"')
          .replace(/(\w+):/g, '"$1":');
        return JSON.parse(cleaned);
      } catch {}
    }
  }

  // Last resort: try to parse the whole thing
  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}

async function researchIdeas(): Promise<Idea[]> {
  await logger.log("Starting idea research...");

  const prompt = `You are a startup analyst. Generate 5 trending app/SaaS ideas that can be built as MVPs.

Return a JSON array with this exact structure (no other text):

[
  {
    "title": "AppName",
    "description": "One sentence description",
    "problem": "Problem it solves",
    "targetUsers": "Target audience",
    "features": ["feature1", "feature2", "feature3"],
    "techStack": "Next.js + Supabase",
    "type": "web",
    "estimatedHours": 12,
    "viabilityScore": 8
  }
]

Rules:
- type: "web", "mobile", "saas", or "api"
- estimatedHours: 8-24
- viabilityScore: 7-10
- features: 3-5 items
- Make ideas unique and buildable

Return ONLY the JSON array, nothing else:`;

  try {
    const response = await kimiComplete(prompt, 8000);
    const ideas = extractJSON(response);

    if (!Array.isArray(ideas) || ideas.length === 0) {
      await logger.log("No valid ideas parsed from response", "WARN");
      return [];
    }

    await logger.log(`Parsed ${ideas.length} ideas from Kimi response`);

    return ideas.map((idea: any) => ({
      id: crypto.randomUUID(),
      source: (Math.random() > 0.5 ? "x" : "reddit") as "x" | "reddit",
      title: String(idea.title || "Untitled"),
      description: String(idea.description || ""),
      problem: String(idea.problem || ""),
      targetUsers: String(idea.targetUsers || ""),
      features: Array.isArray(idea.features) ? idea.features : [],
      techStack: String(idea.techStack || "Next.js + Supabase"),
      complexity: (Number(idea.estimatedHours) <= 8 ? "low" : Number(idea.estimatedHours) <= 16 ? "medium" : "high") as "low" | "medium" | "high",
      estimatedHours: Number(idea.estimatedHours) || 12,
      viabilityScore: Number(idea.viabilityScore) || 7,
      discoveredAt: new Date().toISOString(),
      type: (idea.type || "web") as "web" | "mobile" | "saas" | "api",
    }));
  } catch (error) {
    await logger.log(`Research error: ${error}`, "ERROR");
    return [];
  }
}

async function saveIdeas(ideas: Idea[]): Promise<void> {
  await fs.mkdir(CONFIG.paths.ideas, { recursive: true });
  let saved = 0;
  for (const idea of ideas) {
    if (idea.viabilityScore >= 7) {
      await fs.writeFile(
        path.join(CONFIG.paths.ideas, `${idea.id}.json`),
        JSON.stringify(idea, null, 2)
      );
      await logger.log(`Queued: ${idea.title} (${idea.type}, score: ${idea.viabilityScore})`);
      saved++;
    }
  }
  await logger.log(`Saved ${saved} ideas to build queue`);
}

async function getNextIdea(): Promise<Idea | null> {
  try {
    const files = await fs.readdir(CONFIG.paths.ideas);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));
    if (!jsonFiles.length) return null;

    const ideas: Idea[] = [];
    for (const file of jsonFiles) {
      const content = await fs.readFile(path.join(CONFIG.paths.ideas, file), "utf-8");
      ideas.push(JSON.parse(content));
    }
    // Return highest scoring idea
    return ideas.sort((a, b) => b.viabilityScore - a.viabilityScore)[0];
  } catch {
    return null;
  }
}

async function buildMVP(idea: Idea): Promise<void> {
  await logger.log(`\n========================================`);
  await logger.log(`Building MVP: ${idea.title}`);
  await logger.log(`Type: ${idea.type} | Hours: ${idea.estimatedHours}`);
  await logger.log(`Features: ${idea.features.join(", ")}`);
  await logger.log(`========================================\n`);

  const isWeb = idea.type !== "mobile";

  const prompt = isWeb
    ? `Create a complete Next.js 14 application.

PROJECT: ${idea.title}
DESCRIPTION: ${idea.description}
FEATURES: ${idea.features.join(", ")}

Generate all files as a JSON array:

[
  {"path": "package.json", "content": "{ full package.json content }"},
  {"path": "tsconfig.json", "content": "{ tsconfig content }"},
  {"path": "tailwind.config.ts", "content": "tailwind config"},
  {"path": "next.config.js", "content": "next config"},
  {"path": "src/app/layout.tsx", "content": "layout component"},
  {"path": "src/app/page.tsx", "content": "main page with all features"},
  {"path": "src/app/globals.css", "content": "tailwind imports"},
  {"path": "README.md", "content": "readme"}
]

Requirements:
- Use App Router (src/app/)
- TailwindCSS for styling
- TypeScript
- Implement ALL features listed
- Make it visually appealing
- Include proper error handling

Return ONLY the JSON array with complete file contents:`
    : `Create a complete Expo React Native application.

PROJECT: ${idea.title}
DESCRIPTION: ${idea.description}
FEATURES: ${idea.features.join(", ")}

Generate all files as a JSON array:

[
  {"path": "package.json", "content": "{ expo package.json }"},
  {"path": "app.json", "content": "{ expo config }"},
  {"path": "tsconfig.json", "content": "{ tsconfig }"},
  {"path": "app/_layout.tsx", "content": "root layout"},
  {"path": "app/index.tsx", "content": "home screen with features"},
  {"path": "README.md", "content": "readme"}
]

Requirements:
- Expo SDK 50+
- Expo Router (app/ directory)
- TypeScript
- Implement ALL features
- Native-feeling UI

Return ONLY the JSON array with complete file contents:`;

  try {
    const response = await kimiComplete(prompt, 28000);
    const files = extractJSON(response);

    if (!Array.isArray(files) || files.length === 0) {
      await logger.log("Failed to generate project files", "ERROR");
      return;
    }

    await logger.log(`Generated ${files.length} files`);

    const projectName = idea.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30);
    const projectPath = path.join(CONFIG.paths.output, isWeb ? "web" : "mobile", projectName);

    await fs.mkdir(projectPath, { recursive: true });

    let fileCount = 0;
    for (const file of files) {
      if (file.path && file.content) {
        const filePath = path.join(projectPath, file.path);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        const content = typeof file.content === "string"
          ? file.content
          : JSON.stringify(file.content, null, 2);
        await fs.writeFile(filePath, content);
        fileCount++;
      }
    }

    await logger.log(`Wrote ${fileCount} files to ${projectPath}`);

    // Install dependencies
    try {
      await logger.log("Installing npm dependencies...");
      await execAsync("npm install 2>&1 || true", { cwd: projectPath, timeout: 180000 });
      await logger.log("Dependencies installed successfully");
    } catch (e) {
      await logger.log(`npm install warning: ${e}`, "WARN");
    }

    // Push to GitHub
    if (CONFIG.github.token && CONFIG.github.username) {
      try {
        const repoName = `mvp-${projectName}`;
        await logger.log(`Creating GitHub repo: ${repoName}`);

        const createResp = await fetch("https://api.github.com/user/repos", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${CONFIG.github.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: repoName,
            description: `${idea.title} - ${idea.description}`,
            private: false,
          }),
        });

        if (createResp.ok || createResp.status === 422) {
          await execAsync("git init", { cwd: projectPath });
          await execAsync("git add .", { cwd: projectPath });
          await execAsync(`git commit -m "Initial MVP: ${idea.title}\n\nBuilt by MVP Factory with Kimi K2.5"`, { cwd: projectPath });
          await execAsync("git branch -M main", { cwd: projectPath });
          await execAsync(
            `git remote add origin https://${CONFIG.github.token}@github.com/${CONFIG.github.username}/${repoName}.git`,
            { cwd: projectPath }
          );
          await execAsync("git push -u origin main 2>&1 || git push -f origin main 2>&1", { cwd: projectPath });

          await logger.log(`✅ Pushed to GitHub: https://github.com/${CONFIG.github.username}/${repoName}`);
        }
      } catch (e) {
        await logger.log(`GitHub push error: ${e}`, "WARN");
      }
    } else {
      await logger.log("GitHub not configured - skipping push", "WARN");
    }

    // Expo publish for mobile apps
    if (!isWeb && CONFIG.expo.token) {
      try {
        await logger.log("Publishing to Expo Go...");
        await execAsync(`npx expo login --token ${CONFIG.expo.token}`, { cwd: projectPath });
        const { stdout } = await execAsync("npx eas update --branch preview --non-interactive 2>&1", {
          cwd: projectPath,
          timeout: 300000,
        });
        await logger.log("✅ Published to Expo Go");
        await logger.log(stdout.slice(0, 500));
      } catch (e) {
        await logger.log(`Expo publish error: ${e}`, "WARN");
      }
    }

    // Move idea to built folder
    await fs.mkdir(CONFIG.paths.built, { recursive: true });
    try {
      const builtIdea = { ...idea, builtAt: new Date().toISOString(), projectPath };
      await fs.writeFile(
        path.join(CONFIG.paths.built, `${idea.id}.json`),
        JSON.stringify(builtIdea, null, 2)
      );
      await fs.unlink(path.join(CONFIG.paths.ideas, `${idea.id}.json`));
    } catch {}

    await logger.log(`\n✅ MVP COMPLETE: ${idea.title}`);
    await logger.log(`   Path: ${projectPath}`);
    if (CONFIG.github.username) {
      await logger.log(`   GitHub: https://github.com/${CONFIG.github.username}/mvp-${projectName}`);
    }
    await logger.log("");
  } catch (error) {
    await logger.log(`Build error: ${error}`, "ERROR");
  }
}

async function runResearchCycle() {
  await logger.log("\n=== RESEARCH CYCLE START ===");
  try {
    const ideas = await researchIdeas();
    await logger.log(`Discovered ${ideas.length} ideas from Kimi K2.5`);
    if (ideas.length > 0) {
      await saveIdeas(ideas);
    }
  } catch (error) {
    await logger.log(`Research cycle error: ${error}`, "ERROR");
  }
  await logger.log("=== RESEARCH CYCLE END ===\n");
}

async function runBuildCycle() {
  await logger.log("\n=== BUILD CYCLE START ===");
  try {
    const idea = await getNextIdea();
    if (idea) {
      await buildMVP(idea);
    } else {
      await logger.log("No ideas in queue - waiting for next research cycle");
    }
  } catch (error) {
    await logger.log(`Build cycle error: ${error}`, "ERROR");
  }
  await logger.log("=== BUILD CYCLE END ===\n");
}

async function showStats() {
  try {
    const ideaFiles = await fs.readdir(CONFIG.paths.ideas).catch(() => []);
    const builtFiles = await fs.readdir(CONFIG.paths.built).catch(() => []);
    await logger.log(`📊 Stats: ${ideaFiles.length} queued, ${builtFiles.length} built`);
  } catch {}
}

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    MVP FACTORY v2.0                         ║
║         Autonomous MVP Builder powered by Kimi K2.5         ║
╚══════════════════════════════════════════════════════════════╝
`);

  await logger.log("🦞 MVP Factory Daemon v2 Starting...");
  await logger.log(`LLM Model: ${CONFIG.nvidia.model}`);
  await logger.log(`GitHub User: ${CONFIG.github.username || "NOT CONFIGURED"}`);
  await logger.log(`Expo Token: ${CONFIG.expo.token ? "configured" : "NOT CONFIGURED"}`);
  await logger.log(`Output Dir: ${CONFIG.paths.output}`);

  // Create directories
  await fs.mkdir(CONFIG.paths.ideas, { recursive: true });
  await fs.mkdir(CONFIG.paths.built, { recursive: true });
  await fs.mkdir(path.join(CONFIG.paths.output, "web"), { recursive: true });
  await fs.mkdir(path.join(CONFIG.paths.output, "mobile"), { recursive: true });

  await showStats();

  // Initial cycles
  await runResearchCycle();
  await runBuildCycle();

  // Schedule recurring cycles
  setInterval(runResearchCycle, CONFIG.intervals.research);
  setInterval(runBuildCycle, CONFIG.intervals.build);
  setInterval(showStats, 5 * 60 * 1000); // Stats every 5 min

  await logger.log("\n🚀 MVP Factory is now running continuously!");
  await logger.log("   📡 Research: every 1 hour");
  await logger.log("   🔨 Build: every 30 minutes");
  await logger.log("   📊 Stats: every 5 minutes\n");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
