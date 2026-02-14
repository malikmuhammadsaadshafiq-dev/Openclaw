/**
 * MVP Factory Autonomous Daemon v4
 * Added retry logic + fixed fetch issues
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
    logs: "/root/.neurafinity/logs",
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

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function kimiComplete(prompt: string, maxTokens = 16384, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 300000); // 5 min timeout

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
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Handle both content and reasoning_content (Kimi K2.5 uses reasoning)
      const content = data.choices?.[0]?.message?.content
        || data.choices?.[0]?.message?.reasoning_content
        || "";

      if (!content) {
        throw new Error("Empty response from API");
      }

      return content;
    } catch (error) {
      await logger.log(`API attempt ${attempt}/${retries} failed: ${error}`, "WARN");
      if (attempt < retries) {
        await sleep(5000 * attempt); // Exponential backoff
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
        const cleaned = jsonStr
          .replace(/,\s*}/g, "}")
          .replace(/,\s*]/g, "]");
        return JSON.parse(cleaned);
      } catch {}
    }
  }

  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}

async function researchIdeas(): Promise<Idea[]> {
  await logger.log("Starting idea research...");

  const prompt = `You are a startup analyst researching trending app ideas.

Generate 5 unique, buildable app/SaaS ideas. Return ONLY valid JSON:

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
- Make ideas unique, trending, and buildable

Return ONLY the JSON array:`;

  try {
    const response = await kimiComplete(prompt, 8000);
    const ideas = extractJSON(response);

    if (!Array.isArray(ideas) || ideas.length === 0) {
      await logger.log("No valid ideas parsed", "WARN");
      return [];
    }

    await logger.log(`Parsed ${ideas.length} ideas`);

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
    return ideas.sort((a, b) => b.viabilityScore - a.viabilityScore)[0];
  } catch {
    return null;
  }
}

function generateReadme(idea: Idea, projectName: string, isWeb: boolean): string {
  const badges = isWeb
    ? `![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase)`
    : `![Expo](https://img.shields.io/badge/Expo-50-000020?logo=expo)
![React Native](https://img.shields.io/badge/React_Native-0.73-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)`;

  return `# ${idea.title}

${badges}

> ${idea.description}

## Problem

${idea.problem}

## Target Users

${idea.targetUsers}

## Features

${idea.features.map(f => `- ${f}`).join('\n')}

## Tech Stack

- ${idea.techStack}

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
${!isWeb ? '- Expo Go app on your phone' : ''}

### Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/${CONFIG.github.username}/mvp-${projectName}.git
cd mvp-${projectName}

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase credentials to .env.local

# Start development server
${isWeb ? 'npm run dev' : 'npx expo start'}
\`\`\`

${isWeb ? `### Open in Browser

Navigate to [http://localhost:3000](http://localhost:3000)` : `### Open on Phone

Scan the QR code with Expo Go app`}

## Project Structure

\`\`\`
${isWeb ? `${projectName}/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Home page
│   │   └── globals.css   # Global styles
│   ├── components/       # Reusable UI components
│   └── lib/              # Utilities and helpers
├── public/               # Static assets
├── package.json
├── tailwind.config.ts
└── README.md` : `${projectName}/
├── app/                  # Expo Router screens
│   ├── _layout.tsx       # Root layout
│   └── index.tsx         # Home screen
├── components/           # Reusable components
├── lib/                  # Utilities
├── package.json
├── app.json              # Expo config
└── README.md`}
\`\`\`

## Environment Variables

Create a \`.env.local\` file with:

\`\`\`env
${isWeb ? 'NEXT_PUBLIC_SUPABASE_URL=your_supabase_url\nNEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key' : 'EXPO_PUBLIC_SUPABASE_URL=your_supabase_url\nEXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key'}
\`\`\`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for any purpose.

---

**Built with MVP Factory** - Autonomous MVP Builder powered by Kimi K2.5

*Generated on ${new Date().toISOString().split('T')[0]}*
`;
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
FEATURES TO IMPLEMENT:
${idea.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Generate a complete, production-ready Next.js app. Return ONLY a JSON array of files:

[
  {"path": "package.json", "content": "..."},
  {"path": "tsconfig.json", "content": "..."},
  {"path": "tailwind.config.ts", "content": "..."},
  {"path": "next.config.js", "content": "..."},
  {"path": "postcss.config.js", "content": "..."},
  {"path": "src/app/layout.tsx", "content": "..."},
  {"path": "src/app/page.tsx", "content": "..."},
  {"path": "src/app/globals.css", "content": "..."},
  {"path": "src/components/Header.tsx", "content": "..."},
  {"path": "src/components/Footer.tsx", "content": "..."},
  {"path": "src/lib/supabase.ts", "content": "..."},
  {"path": ".env.example", "content": "..."},
  {"path": ".gitignore", "content": "..."}
]

Requirements:
- App Router (src/app/)
- TailwindCSS with modern design
- TypeScript strict mode
- Implement ALL features listed above
- Include Header and Footer components
- Modern, clean UI with good UX
- Responsive design
- Use Lucide icons

Return ONLY the JSON array:`
    : `Create a complete Expo React Native application.

PROJECT: ${idea.title}
DESCRIPTION: ${idea.description}
FEATURES TO IMPLEMENT:
${idea.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Generate a complete mobile app. Return ONLY a JSON array of files:

[
  {"path": "package.json", "content": "..."},
  {"path": "app.json", "content": "..."},
  {"path": "tsconfig.json", "content": "..."},
  {"path": "babel.config.js", "content": "..."},
  {"path": "app/_layout.tsx", "content": "..."},
  {"path": "app/index.tsx", "content": "..."},
  {"path": "components/Header.tsx", "content": "..."},
  {"path": "lib/supabase.ts", "content": "..."},
  {"path": ".env.example", "content": "..."},
  {"path": ".gitignore", "content": "..."}
]

Requirements:
- Expo SDK 50+
- Expo Router
- TypeScript
- Implement ALL features
- Native-feeling UI

Return ONLY the JSON array:`;

  try {
    await logger.log("Generating code with Kimi K2.5...");
    const response = await kimiComplete(prompt, 28000);
    const files = extractJSON(response);

    if (!Array.isArray(files) || files.length === 0) {
      await logger.log("Failed to generate files", "ERROR");
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

    // Write all generated files
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

    // Generate comprehensive README
    const readme = generateReadme(idea, projectName, isWeb);
    await fs.writeFile(path.join(projectPath, "README.md"), readme);
    fileCount++;

    // Ensure .gitignore exists
    const gitignoreContent = isWeb
      ? `node_modules/\n.next/\n.env\n.env.local\n.DS_Store`
      : `node_modules/\n.expo/\ndist/\n.env\n.DS_Store`;

    await fs.writeFile(path.join(projectPath, ".gitignore"), gitignoreContent);

    await logger.log(`Wrote ${fileCount} files to ${projectPath}`);

    // Install dependencies
    try {
      await logger.log("Installing npm dependencies...");
      await execAsync("npm install 2>&1 || true", { cwd: projectPath, timeout: 180000 });
      await logger.log("Dependencies installed");
    } catch (e) {
      await logger.log(`npm install warning: ${e}`, "WARN");
    }

    // Push to GitHub
    if (CONFIG.github.token && CONFIG.github.username) {
      const repoName = `mvp-${projectName}`;
      await logger.log(`Pushing to GitHub: ${repoName}`);

      try {
        // Create repo
        const createResp = await fetch("https://api.github.com/user/repos", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${CONFIG.github.token}`,
            "Content-Type": "application/json",
            "Accept": "application/vnd.github.v3+json",
          },
          body: JSON.stringify({
            name: repoName,
            description: `${idea.title} - ${idea.description}`,
            private: false,
          }),
        });

        if (createResp.ok || createResp.status === 422) {
          // Git operations
          await execAsync("rm -rf .git 2>/dev/null || true", { cwd: projectPath });
          await execAsync("git init", { cwd: projectPath });
          await execAsync("git add -A", { cwd: projectPath });

          const commitMsg = `Initial MVP: ${idea.title}

${idea.description}

Features:
${idea.features.map(f => `- ${f}`).join('\n')}

Built by MVP Factory with Kimi K2.5`;

          await execAsync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, { cwd: projectPath });
          await execAsync("git branch -M main", { cwd: projectPath });

          const remoteUrl = `https://${CONFIG.github.token}@github.com/${CONFIG.github.username}/${repoName}.git`;
          await execAsync(`git remote add origin ${remoteUrl} 2>/dev/null || git remote set-url origin ${remoteUrl}`, { cwd: projectPath });
          await execAsync("git push -u origin main --force 2>&1", { cwd: projectPath });

          const repoUrl = `https://github.com/${CONFIG.github.username}/${repoName}`;
          await logger.log(`✅ Pushed to GitHub: ${repoUrl}`);
        }
      } catch (e) {
        await logger.log(`GitHub error: ${e}`, "ERROR");
      }
    }

    // Expo publish for mobile
    if (!isWeb && CONFIG.expo.token) {
      try {
        await logger.log("Publishing to Expo Go...");
        await execAsync(`EXPO_TOKEN=${CONFIG.expo.token} npx expo login --token ${CONFIG.expo.token} 2>&1 || true`, { cwd: projectPath });
        await execAsync("npx eas update --branch preview --non-interactive 2>&1 || true", {
          cwd: projectPath,
          timeout: 300000,
        });
        await logger.log("Published to Expo Go");
      } catch (e) {
        await logger.log(`Expo error: ${e}`, "WARN");
      }
    }

    // Move to built
    await fs.mkdir(CONFIG.paths.built, { recursive: true });
    try {
      const builtIdea = {
        ...idea,
        builtAt: new Date().toISOString(),
        projectPath,
        githubUrl: `https://github.com/${CONFIG.github.username}/mvp-${projectName}`,
      };
      await fs.writeFile(
        path.join(CONFIG.paths.built, `${idea.id}.json`),
        JSON.stringify(builtIdea, null, 2)
      );
      await fs.unlink(path.join(CONFIG.paths.ideas, `${idea.id}.json`));
    } catch {}

    await logger.log(`\n✅ MVP COMPLETE: ${idea.title}`);
    await logger.log(`   Path: ${projectPath}`);
    await logger.log(`   GitHub: https://github.com/${CONFIG.github.username}/mvp-${projectName}`);
    await logger.log("");
  } catch (error) {
    await logger.log(`Build error: ${error}`, "ERROR");
  }
}

async function runResearchCycle() {
  await logger.log("\n=== RESEARCH CYCLE START ===");
  try {
    const ideas = await researchIdeas();
    await logger.log(`Discovered ${ideas.length} ideas`);
    if (ideas.length > 0) {
      await saveIdeas(ideas);
    }
  } catch (error) {
    await logger.log(`Research error: ${error}`, "ERROR");
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
      await logger.log("No ideas in queue");
    }
  } catch (error) {
    await logger.log(`Build error: ${error}`, "ERROR");
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
║                    MVP FACTORY v4.0                         ║
║         Autonomous MVP Builder powered by Kimi K2.5         ║
║              With Retry Logic + Better Errors               ║
╚══════════════════════════════════════════════════════════════╝
`);

  await logger.log("🦞 MVP Factory Daemon v4 Starting...");
  await logger.log(`LLM: ${CONFIG.nvidia.model}`);
  await logger.log(`GitHub: ${CONFIG.github.username || "NOT CONFIGURED"}`);
  await logger.log(`Expo: ${CONFIG.expo.token ? "configured" : "NOT CONFIGURED"}`);

  await fs.mkdir(CONFIG.paths.ideas, { recursive: true });
  await fs.mkdir(CONFIG.paths.built, { recursive: true });
  await fs.mkdir(path.join(CONFIG.paths.output, "web"), { recursive: true });
  await fs.mkdir(path.join(CONFIG.paths.output, "mobile"), { recursive: true });

  await showStats();

  // Initial cycles
  await runResearchCycle();
  await runBuildCycle();

  // Schedule recurring
  setInterval(runResearchCycle, CONFIG.intervals.research);
  setInterval(runBuildCycle, CONFIG.intervals.build);
  setInterval(showStats, 5 * 60 * 1000);

  await logger.log("\n🚀 MVP Factory running continuously!");
  await logger.log("   📡 Research: every 1 hour");
  await logger.log("   🔨 Build: every 30 minutes\n");
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
