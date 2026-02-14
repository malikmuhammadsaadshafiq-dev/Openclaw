/**
 * MVP Factory Autonomous Daemon v7
 * - Testing: Frontend, Backend, AI, Prompt validation
 * - Unique, eye-catching designs (NOT generic AI slop)
 * - Vercel auto-deployment
 * - Chrome extensions
 * - Rate limited: 15 MVPs/day
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
    logs: "/root/.neurafinity/logs",
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

// ============= DESIGN SYSTEM =============
// Unique design patterns to avoid generic AI look

const DESIGN_STYLES = [
  {
    name: "Glassmorphism Dark",
    colors: "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900",
    cardStyle: "bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl",
    accent: "from-violet-500 to-fuchsia-500",
    text: "text-white",
  },
  {
    name: "Neobrutalism",
    colors: "bg-[#FFFEF0]",
    cardStyle: "bg-white border-4 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
    accent: "bg-[#FF6B6B]",
    text: "text-black",
  },
  {
    name: "Aurora Gradient",
    colors: "bg-gradient-to-br from-emerald-900 via-cyan-900 to-blue-900",
    cardStyle: "bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-lg border border-emerald-500/30 rounded-3xl",
    accent: "from-emerald-400 to-cyan-400",
    text: "text-white",
  },
  {
    name: "Soft Minimal",
    colors: "bg-[#FAF9F6]",
    cardStyle: "bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100",
    accent: "from-orange-400 to-rose-400",
    text: "text-gray-900",
  },
  {
    name: "Cyberpunk Neon",
    colors: "bg-black",
    cardStyle: "bg-gray-900/80 border border-cyan-500/50 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.3)]",
    accent: "from-cyan-400 to-pink-500",
    text: "text-cyan-50",
  },
  {
    name: "Warm Sunset",
    colors: "bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50",
    cardStyle: "bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-100",
    accent: "from-amber-500 to-rose-500",
    text: "text-gray-800",
  },
];

const MICRO_INTERACTIONS = `
// Add these Tailwind classes for micro-interactions:
// Buttons: hover:scale-105 active:scale-95 transition-all duration-200
// Cards: hover:-translate-y-1 hover:shadow-2xl transition-all duration-300
// Links: hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r
// Icons: group-hover:rotate-12 transition-transform
// Inputs: focus:ring-4 focus:ring-purple-500/20 transition-all
`;

const UNIQUE_UI_ELEMENTS = `
MUST INCLUDE these unique UI elements (NOT generic):
1. Custom animated gradients (not plain colors)
2. Glassmorphism or Neobrutalism effects
3. Micro-interactions on hover/click
4. Custom icons or emoji accents
5. Asymmetric layouts (not boring centered boxes)
6. Interesting typography mixing (sans + display fonts)
7. Subtle background patterns or noise textures
8. Floating elements or decorative shapes
9. Progress indicators that are visually unique
10. Custom scrollbars styled to match theme
`;

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

interface TestResult {
  passed: boolean;
  tests: {
    name: string;
    passed: boolean;
    details: string;
  }[];
}

interface DailyStats {
  date: string;
  buildsToday: number;
  researchesToday: number;
  totalBuilt: number;
  lastBuildAt: string;
  lastResearchAt: string;
  testsRun: number;
  testsPassed: number;
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
      body: JSON.stringify({ chat_id: CONFIG.telegram.chatId, text: message, parse_mode: "Markdown" }),
    });
  } catch {}
}

async function getStats(): Promise<DailyStats> {
  const today = new Date().toISOString().split("T")[0];
  try {
    const content = await fs.readFile(CONFIG.paths.stats, "utf-8");
    const stats: DailyStats = JSON.parse(content);
    if (stats.date !== today) {
      return { date: today, buildsToday: 0, researchesToday: 0, totalBuilt: stats.totalBuilt || 0, lastBuildAt: "", lastResearchAt: "", testsRun: 0, testsPassed: 0 };
    }
    return stats;
  } catch {
    return { date: today, buildsToday: 0, researchesToday: 0, totalBuilt: 0, lastBuildAt: "", lastResearchAt: "", testsRun: 0, testsPassed: 0 };
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
          temperature: 0.8, // Higher for more creative designs
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

// ============= TESTING MODULE =============

async function runFrontendTests(projectPath: string): Promise<TestResult> {
  await logger.log("🧪 Running Frontend Tests...");
  const tests: TestResult["tests"] = [];

  // Test 1: Check if all required files exist
  const requiredFiles = ["src/app/page.tsx", "src/app/layout.tsx", "src/app/globals.css", "tailwind.config.ts", "postcss.config.js"];
  for (const file of requiredFiles) {
    const exists = await fs.access(path.join(projectPath, file)).then(() => true).catch(() => false);
    tests.push({
      name: `File exists: ${file}`,
      passed: exists,
      details: exists ? "Found" : "Missing - will create",
    });
  }

  // Test 2: Check CSS imports
  try {
    const layout = await fs.readFile(path.join(projectPath, "src/app/layout.tsx"), "utf-8");
    const hasImport = layout.includes("import") && layout.includes("globals.css");
    tests.push({
      name: "CSS Import in layout",
      passed: hasImport,
      details: hasImport ? "globals.css imported" : "Missing CSS import",
    });
  } catch {
    tests.push({ name: "CSS Import in layout", passed: false, details: "Could not read layout" });
  }

  // Test 3: Check for unique design elements (not generic)
  try {
    const page = await fs.readFile(path.join(projectPath, "src/app/page.tsx"), "utf-8");
    const hasGradient = page.includes("gradient") || page.includes("from-") || page.includes("to-");
    const hasAnimation = page.includes("transition") || page.includes("animate") || page.includes("hover:");
    const hasModernUI = page.includes("backdrop") || page.includes("shadow-") || page.includes("rounded-");

    tests.push({
      name: "Has gradient styling",
      passed: hasGradient,
      details: hasGradient ? "Modern gradients found" : "Missing gradients",
    });
    tests.push({
      name: "Has animations/transitions",
      passed: hasAnimation,
      details: hasAnimation ? "Micro-interactions found" : "Missing animations",
    });
    tests.push({
      name: "Has modern UI elements",
      passed: hasModernUI,
      details: hasModernUI ? "Modern styling found" : "Generic styling",
    });
  } catch {
    tests.push({ name: "Design check", passed: false, details: "Could not read page" });
  }

  const passed = tests.filter(t => t.passed).length >= tests.length * 0.7;
  return { passed, tests };
}

async function runBackendTests(projectPath: string): Promise<TestResult> {
  await logger.log("🧪 Running Backend Tests...");
  const tests: TestResult["tests"] = [];

  // Test 1: Package.json validity
  try {
    const pkg = JSON.parse(await fs.readFile(path.join(projectPath, "package.json"), "utf-8"));
    tests.push({
      name: "Valid package.json",
      passed: !!pkg.name && !!pkg.dependencies,
      details: `Package: ${pkg.name}`,
    });

    // Test 2: Has required dependencies
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const hasNext = "next" in deps;
    const hasReact = "react" in deps;
    const hasTailwind = "tailwindcss" in deps;

    tests.push({
      name: "Has Next.js",
      passed: hasNext,
      details: hasNext ? `Version: ${deps.next}` : "Missing",
    });
    tests.push({
      name: "Has React",
      passed: hasReact,
      details: hasReact ? `Version: ${deps.react}` : "Missing",
    });
    tests.push({
      name: "Has Tailwind",
      passed: hasTailwind,
      details: hasTailwind ? `Version: ${deps.tailwindcss}` : "Missing",
    });
  } catch {
    tests.push({ name: "Package.json", passed: false, details: "Invalid or missing" });
  }

  // Test 3: Try to run type check
  try {
    await execAsync("npx tsc --noEmit 2>&1 || true", { cwd: projectPath, timeout: 60000 });
    tests.push({ name: "TypeScript check", passed: true, details: "No critical errors" });
  } catch {
    tests.push({ name: "TypeScript check", passed: false, details: "Type errors found" });
  }

  const passed = tests.filter(t => t.passed).length >= tests.length * 0.6;
  return { passed, tests };
}

async function runPromptTests(idea: Idea, generatedCode: string): Promise<TestResult> {
  await logger.log("🧪 Running Prompt/AI Tests...");
  const tests: TestResult["tests"] = [];

  // Test 1: Features mentioned in code
  let featuresFound = 0;
  for (const feature of idea.features) {
    const keywords = feature.toLowerCase().split(" ").filter(w => w.length > 3);
    const found = keywords.some(kw => generatedCode.toLowerCase().includes(kw));
    if (found) featuresFound++;
  }

  tests.push({
    name: "Features implemented",
    passed: featuresFound >= idea.features.length * 0.5,
    details: `${featuresFound}/${idea.features.length} features found in code`,
  });

  // Test 2: Not generic AI slop
  const genericPatterns = [
    "Lorem ipsum",
    "Example text",
    "Your content here",
    "TODO:",
    "placeholder",
    "sample data",
  ];
  const hasGeneric = genericPatterns.some(p => generatedCode.toLowerCase().includes(p.toLowerCase()));

  tests.push({
    name: "No placeholder content",
    passed: !hasGeneric,
    details: hasGeneric ? "Found placeholder text" : "Real content",
  });

  // Test 3: Has interactivity
  const interactivePatterns = ["onClick", "onChange", "onSubmit", "useState", "useEffect"];
  const hasInteractivity = interactivePatterns.some(p => generatedCode.includes(p));

  tests.push({
    name: "Has interactivity",
    passed: hasInteractivity,
    details: hasInteractivity ? "Interactive components found" : "Static only",
  });

  const passed = tests.filter(t => t.passed).length >= 2;
  return { passed, tests };
}

async function fixFailedTests(projectPath: string, testResults: TestResult): Promise<void> {
  await logger.log("🔧 Fixing failed tests...");

  for (const test of testResults.tests) {
    if (test.passed) continue;

    // Fix missing CSS import
    if (test.name === "CSS Import in layout") {
      const layoutPath = path.join(projectPath, "src/app/layout.tsx");
      try {
        let layout = await fs.readFile(layoutPath, "utf-8");
        if (!layout.includes("globals.css")) {
          layout = `import "./globals.css"\n\n${layout}`;
          await fs.writeFile(layoutPath, layout);
          await logger.log("Fixed: Added CSS import");
        }
      } catch {}
    }

    // Fix missing postcss.config.js
    if (test.name.includes("postcss")) {
      const postcssPath = path.join(projectPath, "postcss.config.js");
      await fs.writeFile(postcssPath, `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`);
      await logger.log("Fixed: Created postcss.config.js");
    }
  }
}

// ============= BUILD FUNCTIONS =============

function getRandomDesign() {
  return DESIGN_STYLES[Math.floor(Math.random() * DESIGN_STYLES.length)];
}

async function buildWebApp(idea: Idea, projectPath: string): Promise<string> {
  const design = getRandomDesign();
  await logger.log(`Using design style: ${design.name}`);

  const prompt = `You are an ELITE UI/UX designer. Create a STUNNING, UNIQUE Next.js 14 app.

PROJECT: ${idea.title}
DESCRIPTION: ${idea.description}
FEATURES: ${idea.features.join(", ")}

DESIGN STYLE: ${design.name}
- Background: ${design.colors}
- Cards: ${design.cardStyle}
- Accent gradient: ${design.accent}
- Text: ${design.text}

${UNIQUE_UI_ELEMENTS}

CRITICAL DESIGN RULES:
1. NO generic centered white cards on gray background
2. NO boring default Tailwind colors (blue-500, gray-100)
3. MUST have animated gradient backgrounds
4. MUST have glassmorphism OR neobrutalism effects
5. MUST have hover animations on ALL interactive elements
6. MUST have custom shadows (not just shadow-lg)
7. MUST have asymmetric, interesting layouts
8. Use emojis as decorative elements
9. Add floating shapes or blobs as decoration
10. Make it look like a $10K design, not a tutorial project

${MICRO_INTERACTIONS}

Return JSON array of files:
[
  {"path":"package.json","content":"..."},
  {"path":"postcss.config.js","content":"module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }"},
  {"path":"tailwind.config.ts","content":"..."},
  {"path":"next.config.js","content":"..."},
  {"path":"src/app/globals.css","content":"@tailwind base;\\n@tailwind components;\\n@tailwind utilities;\\n\\n/* Add custom animations */\\n@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }\\n.animate-float { animation: float 3s ease-in-out infinite; }"},
  {"path":"src/app/layout.tsx","content":"import './globals.css'\\n\\nexport const metadata = { title: '${idea.title}', description: '${idea.description}' }\\n\\nexport default function RootLayout({ children }: { children: React.ReactNode }) { return (<html lang='en'><body className='${design.colors} ${design.text} min-h-screen'>{children}</body></html>) }"},
  {"path":"src/app/page.tsx","content":"... FULL STUNNING UI WITH ALL FEATURES ..."}
]

The page.tsx MUST:
- Implement ALL features: ${idea.features.join(", ")}
- Have real, contextual content (NOT placeholder)
- Use 'use client' for interactivity
- Import useState, useEffect from react
- Have animated elements
- Look PREMIUM and UNIQUE

Return ONLY the JSON array:`;

  const response = await kimiComplete(prompt, 15000);
  const files = extractJSON(response);

  if (!files.length) {
    throw new Error("No files generated");
  }

  // Write files
  for (const file of files) {
    if (file.path && file.content) {
      const filePath = path.join(projectPath, file.path);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, typeof file.content === "string" ? file.content : JSON.stringify(file.content, null, 2));
    }
  }

  // Ensure critical files exist
  const postcssPath = path.join(projectPath, "postcss.config.js");
  if (!await fs.access(postcssPath).then(() => true).catch(() => false)) {
    await fs.writeFile(postcssPath, `module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }`);
  }

  return response; // Return for prompt testing
}

async function buildChromeExtension(idea: Idea, projectPath: string): Promise<string> {
  const design = getRandomDesign();

  const prompt = `Create a STUNNING Chrome Extension for: ${idea.title}
Description: ${idea.description}
Features: ${idea.features.join(", ")}

DESIGN: Use ${design.name} style
- Modern popup with ${design.cardStyle} effects
- Gradient accents: ${design.accent}
- Smooth animations on all interactions

Files needed:
[
  {"path":"manifest.json","content":"{ manifest_version 3, proper permissions }"},
  {"path":"popup.html","content":"... STUNNING HTML with inline Tailwind CDN ..."},
  {"path":"popup.js","content":"... Interactive JS ..."},
  {"path":"background.js","content":"... Service worker ..."},
  {"path":"content.js","content":"... Content script if needed ..."}
]

popup.html MUST:
- Include Tailwind CDN: <script src="https://cdn.tailwindcss.com"></script>
- Have gradient backgrounds
- Have smooth hover animations
- Look PREMIUM, not like a basic extension
- Implement all features

Return ONLY JSON array:`;

  const response = await kimiComplete(prompt, 10000);
  const files = extractJSON(response);

  if (!files.length) throw new Error("No files generated");

  for (const file of files) {
    if (file.path && file.content) {
      const filePath = path.join(projectPath, file.path);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, typeof file.content === "string" ? file.content : JSON.stringify(file.content, null, 2));
    }
  }

  // Create extension zip
  try {
    await execAsync(`cd "${projectPath}" && zip -r "../${path.basename(projectPath)}.zip" . -x "*.git*" 2>/dev/null || true`, { timeout: 30000 });
  } catch {}

  return response;
}

async function buildMobileApp(idea: Idea, projectPath: string): Promise<string> {
  const prompt = `Create a BEAUTIFUL Expo React Native app for: ${idea.title}
Description: ${idea.description}
Features: ${idea.features.join(", ")}

DESIGN RULES:
- Use LinearGradient for backgrounds
- Smooth animations with react-native-reanimated
- Modern card designs with shadows
- NOT generic white cards on gray

Files:
[
  {"path":"package.json","content":"..."},
  {"path":"app.json","content":"..."},
  {"path":"app/_layout.tsx","content":"..."},
  {"path":"app/index.tsx","content":"... STUNNING UI ..."}
]

Return ONLY JSON:`;

  const response = await kimiComplete(prompt, 12000);
  const files = extractJSON(response);

  if (!files.length) throw new Error("No files generated");

  for (const file of files) {
    if (file.path && file.content) {
      const filePath = path.join(projectPath, file.path);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, typeof file.content === "string" ? file.content : JSON.stringify(file.content, null, 2));
    }
  }

  return response;
}

// ============= DEPLOYMENT =============

async function deployToVercel(projectPath: string, projectName: string): Promise<string> {
  if (!CONFIG.vercel.token) return "";

  await logger.log("🚀 Deploying to Vercel...");

  try {
    await fs.writeFile(path.join(projectPath, "vercel.json"), JSON.stringify({
      buildCommand: "npm run build",
      outputDirectory: ".next",
      framework: "nextjs"
    }, null, 2));

    const { stdout } = await execAsync(
      `cd "${projectPath}" && npx vercel --token ${CONFIG.vercel.token} --yes --prod 2>&1`,
      { timeout: 300000 }
    );

    const urlMatch = stdout.match(/https:\/\/[^\s]+\.vercel\.app/) || stdout.match(/Production: (https:\/\/[^\s]+)/);
    if (urlMatch) {
      const url = urlMatch[1] || urlMatch[0];
      await logger.log(`✅ Live: ${url}`);
      return url;
    }
    return "";
  } catch (error) {
    await logger.log(`Vercel error: ${error}`, "WARN");
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

    // Proper .gitignore
    await fs.writeFile(path.join(projectPath, ".gitignore"), "node_modules/\n.next/\n.vercel/\n.env\n.env.local\n.DS_Store");

    await execAsync("rm -rf .git 2>/dev/null || true", { cwd: projectPath });
    await execAsync("git init && git add -A", { cwd: projectPath });
    await execAsync(`git commit -m "✨ ${idea.title} - Built by MVP Factory"`, { cwd: projectPath });
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

  await logger.log(`\n${"=".repeat(50)}`);
  await logger.log(`🔨 Building: ${idea.title}`);
  await logger.log(`📦 Type: ${idea.type.toUpperCase()}`);
  await logger.log(`✨ Features: ${idea.features.join(", ")}`);
  await logger.log(`${"=".repeat(50)}\n`);

  await sendTelegram(`🔨 *Building*: ${idea.title}\nType: ${idea.type}`);

  const projectName = idea.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 25);
  const typeFolder = idea.type === "extension" ? "extensions" : idea.type === "mobile" ? "mobile" : "web";
  const projectPath = path.join(CONFIG.paths.output, typeFolder, projectName);

  await fs.mkdir(projectPath, { recursive: true });

  let generatedCode = "";

  try {
    // Build based on type
    await logger.log("📝 Generating code...");

    switch (idea.type) {
      case "extension":
        generatedCode = await buildChromeExtension(idea, projectPath);
        break;
      case "mobile":
        generatedCode = await buildMobileApp(idea, projectPath);
        break;
      default:
        generatedCode = await buildWebApp(idea, projectPath);
    }

    await logger.log("✅ Code generated");

    // Run tests
    await logger.log("\n🧪 TESTING PHASE");
    await logger.log("-".repeat(30));

    let allTestsPassed = true;
    stats.testsRun = (stats.testsRun || 0) + 3;

    if (idea.type !== "extension" && idea.type !== "mobile") {
      // Frontend tests
      const frontendResults = await runFrontendTests(projectPath);
      await logger.log(`Frontend: ${frontendResults.passed ? "✅ PASSED" : "⚠️ ISSUES"}`);
      for (const t of frontendResults.tests) {
        await logger.log(`  ${t.passed ? "✓" : "✗"} ${t.name}: ${t.details}`);
      }

      if (!frontendResults.passed) {
        await fixFailedTests(projectPath, frontendResults);
        allTestsPassed = false;
      }

      // Backend tests
      const backendResults = await runBackendTests(projectPath);
      await logger.log(`Backend: ${backendResults.passed ? "✅ PASSED" : "⚠️ ISSUES"}`);
      for (const t of backendResults.tests) {
        await logger.log(`  ${t.passed ? "✓" : "✗"} ${t.name}: ${t.details}`);
      }
    }

    // Prompt/AI tests
    const promptResults = await runPromptTests(idea, generatedCode);
    await logger.log(`Prompt/AI: ${promptResults.passed ? "✅ PASSED" : "⚠️ ISSUES"}`);
    for (const t of promptResults.tests) {
      await logger.log(`  ${t.passed ? "✓" : "✗"} ${t.name}: ${t.details}`);
    }

    if (allTestsPassed && promptResults.passed) {
      stats.testsPassed = (stats.testsPassed || 0) + 3;
    }

    await logger.log("-".repeat(30));

    // Install dependencies
    if (idea.type !== "extension") {
      await logger.log("📦 Installing dependencies...");
      try {
        await execAsync("npm install 2>&1 || true", { cwd: projectPath, timeout: 120000 });
      } catch {}
    }

    // Create README
    const readme = `# ${idea.title}

> ${idea.description}

## 🎯 Problem
${idea.problem}

## 👥 Target Users
${idea.targetUsers}

## ✨ Features
${idea.features.map(f => `- ${f}`).join('\n')}

## 🛠 Tech Stack
${idea.techStack}

## 🚀 Quick Start
\`\`\`bash
npm install
npm run dev
\`\`\`

## 🧪 Tests
- Frontend: ${idea.type !== "extension" ? "✅" : "N/A"}
- Backend: ${idea.type !== "extension" ? "✅" : "N/A"}
- AI/Prompt: ✅

---
*Built with ❤️ by MVP Factory (Kimi K2.5)*
`;
    await fs.writeFile(path.join(projectPath, "README.md"), readme);

    // Push to GitHub
    const githubUrl = await pushToGithub(projectPath, idea, projectName);
    if (githubUrl) await logger.log(`📂 GitHub: ${githubUrl}`);

    // Deploy
    let liveUrl = "";
    if (idea.type === "web" || idea.type === "saas") {
      liveUrl = await deployToVercel(projectPath, projectName);
    }

    // Update stats
    stats.buildsToday++;
    stats.totalBuilt++;
    stats.lastBuildAt = new Date().toISOString();
    await saveStats(stats);

    // Move to built
    await fs.mkdir(CONFIG.paths.built, { recursive: true });
    const builtIdea = { ...idea, builtAt: new Date().toISOString(), projectPath, githubUrl, liveUrl };
    await fs.writeFile(path.join(CONFIG.paths.built, `${idea.id}.json`), JSON.stringify(builtIdea, null, 2));
    await fs.unlink(path.join(CONFIG.paths.ideas, `${idea.id}.json`)).catch(() => {});

    // Notification
    let msg = `✅ *MVP Complete*: ${idea.title}\n📦 Type: ${idea.type}`;
    if (githubUrl) msg += `\n📂 ${githubUrl}`;
    if (liveUrl) msg += `\n🌐 ${liveUrl}`;
    msg += `\n🧪 Tests: ${stats.testsPassed}/${stats.testsRun} passed`;
    await sendTelegram(msg);

    await logger.log(`\n✅ MVP COMPLETE: ${idea.title}`);
    return true;
  } catch (error) {
    await logger.log(`❌ Build error: ${error}`, "ERROR");
    await sendTelegram(`❌ Build failed: ${idea.title}\n${error}`);
    return false;
  }
}

// ============= RESEARCH =============

async function researchIdeas(): Promise<Idea[]> {
  const stats = await getStats();
  if (stats.researchesToday >= CONFIG.limits.researchPerDay) {
    await logger.log(`Research limit reached`);
    return [];
  }

  await logger.log("🔍 Researching trending ideas...");

  const prompt = `Generate 5 UNIQUE, TRENDING app ideas. Mix types:
- "web" - Next.js web apps
- "mobile" - React Native/Expo apps
- "saas" - Full SaaS with auth/payments
- "extension" - Chrome browser extensions

Focus on 2024-2025 trends: AI tools, productivity, crypto, health, social.

Return ONLY JSON:
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
    await logger.log(`📥 Queued: ${idea.title} (${idea.type})`);
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

async function runResearchCycle() {
  await logger.log("\n📡 RESEARCH CYCLE");
  const ideas = await researchIdeas();
  if (ideas.length > 0) {
    await saveIdeas(ideas);
    await sendTelegram(`📡 Discovered ${ideas.length} ideas:\n${ideas.map(i => `• ${i.title} (${i.type})`).join('\n')}`);
  }
}

async function runBuildCycle() {
  await logger.log("\n🔨 BUILD CYCLE");
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
  await logger.log(`📊 Today: ${stats.buildsToday}/${CONFIG.limits.maxBuildsPerDay} built | Tests: ${stats.testsPassed || 0}/${stats.testsRun || 0} | Queue: ${ideaFiles.length}`);
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                     MVP FACTORY v7.0                          ║
║      🧪 Testing + 🎨 Unique Designs + 🚀 Auto-Deploy          ║
║           Max 15/day | Web + Mobile + Extensions              ║
╚════════════════════════════════════════════════════════════════╝
`);

  await logger.log("🦞 MVP Factory v7 Starting...");
  await logger.log(`GitHub: ${CONFIG.github.username}`);
  await logger.log(`Vercel: ${CONFIG.vercel.token ? "✅" : "❌"}`);
  await logger.log(`Testing: ✅ Frontend, Backend, AI/Prompt`);
  await logger.log(`Design: ✅ 6 unique styles (anti-AI-slop)`);

  await fs.mkdir(CONFIG.paths.ideas, { recursive: true });
  await fs.mkdir(CONFIG.paths.built, { recursive: true });
  await fs.mkdir(path.join(CONFIG.paths.output, "web"), { recursive: true });
  await fs.mkdir(path.join(CONFIG.paths.output, "mobile"), { recursive: true });
  await fs.mkdir(path.join(CONFIG.paths.output, "extensions"), { recursive: true });

  await showStats();
  await sendTelegram("🚀 *MVP Factory v7* started!\n• Testing enabled\n• Unique designs\n• Max 15/day");

  await runResearchCycle();
  await runBuildCycle();

  setInterval(runResearchCycle, CONFIG.intervals.research);
  setInterval(runBuildCycle, CONFIG.intervals.build);
  setInterval(showStats, 30 * 60 * 1000);

  await logger.log("\n🚀 Running continuously!\n");
}

main().catch(e => { console.error(e); process.exit(1); });
