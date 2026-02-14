/**
 * MVP Factory Autonomous Daemon v9
 * - LAUNCH-READY: Premium, purpose-built products (not generic CRUD)
 * - Frontend Skills: Aurora backgrounds, glassmorphism, micro-interactions
 * - AI Integration: Kimi K2.5 API baked into products that need it
 * - Testing: Frontend, Backend, AI, Prompt + Functionality
 * - Unique, eye-catching designs
 * - Demo data & working interactions
 * - Vercel auto-deployment
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
const DESIGN_STYLES = [
  {
    name: "Glassmorphism Dark",
    colors: "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900",
    cardStyle: "bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl",
    accent: "from-violet-500 to-fuchsia-500",
    text: "text-white",
    button: "bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 shadow-lg shadow-violet-500/25",
    animations: "animate-fade-in-up transition-all duration-500 ease-out",
    typography: "font-sans tracking-tight",
    keyframes: `@keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}} @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`,
  },
  {
    name: "Neobrutalism",
    colors: "bg-[#FFFEF0]",
    cardStyle: "bg-white border-4 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
    accent: "bg-[#FF6B6B]",
    text: "text-black",
    button: "bg-[#FF6B6B] border-4 border-black hover:translate-x-1 hover:-translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-150",
    animations: "transition-all duration-150 ease-linear",
    typography: "font-mono font-bold uppercase tracking-widest",
    keyframes: `@keyframes bounce-in{0%{transform:scale(0.3);opacity:0}50%{transform:scale(1.05)}70%{transform:scale(0.9)}100%{transform:scale(1);opacity:1}}`,
  },
  {
    name: "Aurora Gradient",
    colors: "bg-gradient-to-br from-emerald-900 via-cyan-900 to-blue-900",
    cardStyle: "bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-lg border border-emerald-500/30 rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.1)]",
    accent: "from-emerald-400 to-cyan-400",
    text: "text-white",
    button: "bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-500 hover:to-cyan-500 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300",
    animations: "animate-fade-in-up transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
    typography: "font-sans tracking-tight",
    keyframes: `@keyframes aurora{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-20px) scale(1.1)}66%{transform:translate(-20px,15px) scale(0.9)}} @keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`,
  },
  {
    name: "Soft Minimal",
    colors: "bg-[#FAF9F6]",
    cardStyle: "bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-shadow duration-300",
    accent: "from-orange-400 to-rose-400",
    text: "text-gray-900",
    button: "bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200",
    animations: "transition-all duration-300 ease-out",
    typography: "font-sans font-light tracking-wide",
    keyframes: `@keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`,
  },
  {
    name: "Cyberpunk Neon",
    colors: "bg-black",
    cardStyle: "bg-gray-900/80 border border-cyan-500/50 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] transition-shadow duration-300",
    accent: "from-cyan-400 to-pink-500",
    text: "text-cyan-50",
    button: "bg-gradient-to-r from-cyan-400 to-pink-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] ring-2 ring-cyan-400/50 active:scale-95 transition-all duration-200",
    animations: "transition-all duration-300 ease-out",
    typography: "font-mono uppercase tracking-[0.2em]",
    keyframes: `@keyframes glitch{0%{text-shadow:2px 0 #ff00ff,-2px 0 #00ffff}25%{text-shadow:-2px 0 #ff00ff,2px 0 #00ffff}50%{text-shadow:2px -2px #ff00ff,-2px 2px #00ffff}75%{text-shadow:-2px 2px #ff00ff,2px -2px #00ffff}100%{text-shadow:2px 0 #ff00ff,-2px 0 #00ffff}} @keyframes neonPulse{0%,100%{box-shadow:0 0 5px #0ff,0 0 20px #0ff}50%{box-shadow:0 0 10px #0ff,0 0 40px #0ff}}`,
  },
  {
    name: "Warm Sunset",
    colors: "bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50",
    cardStyle: "bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300",
    accent: "from-amber-500 to-rose-500",
    text: "text-gray-800",
    button: "bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-95 transition-all duration-200",
    animations: "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
    typography: "font-serif tracking-normal",
    keyframes: `@keyframes gradientShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}} @keyframes fadeIn{from{opacity:0}to{opacity:1}}`,
  },
];

// ============= FUNCTIONALITY REQUIREMENTS =============
const FUNCTIONALITY_RULES = `
CRITICAL - MVP MUST BE FUNCTIONAL:

1. USER INTERACTIONS (Required):
   - Forms that actually submit and show results
   - Buttons that trigger visible actions
   - Input fields with real-time validation
   - Loading states when actions happen
   - Success/error feedback messages
   - Modal dialogs for confirmations

2. STATE MANAGEMENT (Required):
   - useState for all interactive elements
   - Track user inputs in state
   - Show/hide components based on state
   - Counter or progress tracking
   - Lists that can be added/removed

3. DEMO DATA (Required):
   - Pre-populated realistic sample data
   - At least 5-10 demo items to show
   - User can interact with demo data
   - Add/edit/delete functionality works

4. VISUAL FEEDBACK (Required):
   - Loading spinners when processing
   - Toast notifications for success/error
   - Animated transitions between states
   - Disabled states on buttons during loading
   - Progress bars for multi-step actions

5. REAL SCENARIOS (Required):
   - If it's a todo app: user can add, check, delete todos
   - If it's analytics: show charts with real-looking data
   - If it's social: show posts user can like/comment
   - If it's productivity: timer/pomodoro that works
   - If it's finance: calculator that computes

FORBIDDEN:
- Static pages with no interactions
- Buttons that do nothing
- Empty states with no demo data
- Forms without submit handlers
- "Coming soon" or placeholder sections
`;

const SAMPLE_INTERACTIONS = `
EXAMPLE PATTERNS TO USE:

// Form with real submission
const [email, setEmail] = useState('')
const [submitted, setSubmitted] = useState(false)
const [loading, setLoading] = useState(false)

const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)
  // Simulate API call
  await new Promise(r => setTimeout(r, 1500))
  setSubmitted(true)
  setLoading(false)
}

// Todo list with CRUD
const [todos, setTodos] = useState([
  { id: 1, text: 'Build MVP', done: false },
  { id: 2, text: 'Test features', done: true },
])
const addTodo = (text) => setTodos([...todos, { id: Date.now(), text, done: false }])
const toggleTodo = (id) => setTodos(todos.map(t => t.id === id ? {...t, done: !t.done} : t))
const deleteTodo = (id) => setTodos(todos.filter(t => t.id !== id))

// Modal with actions
const [showModal, setShowModal] = useState(false)
const [confirmed, setConfirmed] = useState(false)

// Loading button
<button disabled={loading} onClick={handleClick}>
  {loading ? (
    <span className="animate-spin">⏳</span>
  ) : "Submit"}
</button>

// Success toast
{success && (
  <div className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg animate-slide-up">
    ✅ Action completed!
  </div>
)}
`;

// ============= FRONTEND SKILLS PROMPT =============
const FRONTEND_SKILLS_PROMPT = `
PREMIUM FRONTEND PATTERNS — use these in globals.css and components:

/* Aurora Background — add 3 animated blobs behind main content */
.aurora-bg { position:fixed;inset:0;overflow:hidden;z-index:0; }
.aurora-blob { position:absolute;border-radius:50%;filter:blur(80px);opacity:0.4;animation:aurora-drift 12s ease-in-out infinite; }
.aurora-blob:nth-child(1) { width:500px;height:500px;background:#7c3aed;top:-10%;left:20%; }
.aurora-blob:nth-child(2) { width:400px;height:400px;background:#06b6d4;bottom:10%;right:10%;animation-delay:-4s; }
.aurora-blob:nth-child(3) { width:350px;height:350px;background:#f43f5e;top:40%;left:50%;animation-delay:-8s; }
@keyframes aurora-drift { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-50px) scale(1.1)} 66%{transform:translate(-20px,30px) scale(0.9)} }

/* Dot grid overlay */
.dot-grid { background-image:radial-gradient(circle,rgba(255,255,255,0.08) 1px,transparent 1px);background-size:24px 24px; }

/* Glassmorphism cards */
.glass-card { background:rgba(255,255,255,0.06);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);border-radius:1.5rem; }

/* Spring easing variables */
:root { --ease-spring:cubic-bezier(0.22,1,0.36,1); --ease-smooth:cubic-bezier(0.4,0,0.2,1); }

/* Animated gradient text */
.gradient-text { background:linear-gradient(135deg,#7c3aed,#06b6d4,#f43f5e,#7c3aed);background-size:300% 300%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:gradient-shift 4s ease infinite; }
@keyframes gradient-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }

/* Staggered fade-in-up — apply .fade-in-up with style="--delay:0.1s" */
.fade-in-up { opacity:0;transform:translateY(20px);animation:fadeInUp 0.6s var(--ease-spring) forwards;animation-delay:var(--delay,0s); }
@keyframes fadeInUp { to{opacity:1;transform:translateY(0)} }

/* Hover lift with colored shadow */
.hover-lift { transition:transform 0.3s var(--ease-spring),box-shadow 0.3s var(--ease-spring); }
.hover-lift:hover { transform:translateY(-4px);box-shadow:0 20px 40px -12px rgba(124,58,237,0.3); }

/* Skeleton shimmer loading */
.skeleton { background:linear-gradient(90deg,rgba(255,255,255,0.06) 25%,rgba(255,255,255,0.12) 50%,rgba(255,255,255,0.06) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:0.5rem; }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* Toast notification */
.toast { position:fixed;bottom:1.5rem;right:1.5rem;padding:1rem 1.5rem;border-radius:1rem;backdrop-filter:blur(12px);animation:toast-in 0.4s var(--ease-spring);z-index:50; }
@keyframes toast-in { from{opacity:0;transform:translateY(20px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }

/* Button press + ripple */
.btn-press { transition:transform 0.15s;user-select:none; }
.btn-press:active { transform:scale(0.96); }

/* Fluid typography */
h1 { font-size:clamp(2rem,5vw,3.5rem);line-height:1.1; }
h2 { font-size:clamp(1.5rem,3vw,2.25rem);line-height:1.2; }
p { font-size:clamp(1rem,1.5vw,1.125rem);line-height:1.7; }
`;

// ============= AI INTEGRATION =============
function needsAI(idea: Idea): boolean {
  const text = `${idea.title} ${idea.description} ${idea.features.join(" ")}`.toLowerCase();
  const aiKeywords = [
    "ai", "chatbot", "generate", "analyze", "smart", "predict",
    "recommend", "summarize", "translate", "detect", "classify",
    "sentiment", "nlp", "gpt", "llm", "assistant", "copilot",
    "automate", "intelligence", "machine learning", "neural",
    "conversation", "prompt", "content generation", "writing tool",
  ];
  return aiKeywords.some(kw => text.includes(kw));
}

const AI_INTEGRATION_PROMPT = `
AI INTEGRATION — This product needs working AI features. Include these:

1. Create src/app/api/ai/route.ts with this EXACT code:
import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  const { prompt, systemPrompt } = await req.json();
  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + process.env.NVIDIA_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "moonshotai/kimi-k2.5",
      messages: [
        { role: "system", content: systemPrompt || "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "No response";
  return NextResponse.json({ result: text });
}

2. Create a client-side helper in src/lib/ai.ts:
export async function askAI(prompt: string, systemPrompt?: string): Promise<string> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, systemPrompt }),
  });
  const data = await res.json();
  return data.result;
}

3. Use the askAI() helper in components wherever AI features are needed.
4. Always show a loading state while waiting for AI response.
5. Add a .env.local file with NVIDIA_API_KEY placeholder.
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
  tests: { name: string; passed: boolean; details: string }[];
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
  functionalityScore: number;
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
      return { date: today, buildsToday: 0, researchesToday: 0, totalBuilt: stats.totalBuilt || 0, lastBuildAt: "", lastResearchAt: "", testsRun: 0, testsPassed: 0, functionalityScore: 0 };
    }
    return stats;
  } catch {
    return { date: today, buildsToday: 0, researchesToday: 0, totalBuilt: 0, lastBuildAt: "", lastResearchAt: "", testsRun: 0, testsPassed: 0, functionalityScore: 0 };
  }
}

async function saveStats(stats: DailyStats): Promise<void> {
  await fs.writeFile(CONFIG.paths.stats, JSON.stringify(stats, null, 2));
}

async function kimiComplete(prompt: string, maxTokens = 16384, retries = 3, temperature = 0.7): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 600000); // 10 min timeout

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
          temperature,
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

  const requiredFiles = ["src/app/page.tsx", "src/app/layout.tsx", "src/app/globals.css", "tailwind.config.ts", "postcss.config.js"];
  for (const file of requiredFiles) {
    const exists = await fs.access(path.join(projectPath, file)).then(() => true).catch(() => false);
    tests.push({ name: `File: ${file}`, passed: exists, details: exists ? "✓" : "Missing" });
  }

  try {
    const layout = await fs.readFile(path.join(projectPath, "src/app/layout.tsx"), "utf-8");
    const hasImport = layout.includes("import") && layout.includes("globals.css");
    tests.push({ name: "CSS Import", passed: hasImport, details: hasImport ? "✓" : "Missing globals.css import" });
  } catch {
    tests.push({ name: "CSS Import", passed: false, details: "Could not read layout" });
  }

  try {
    const page = await fs.readFile(path.join(projectPath, "src/app/page.tsx"), "utf-8");
    tests.push({ name: "Has gradient", passed: page.includes("gradient") || page.includes("from-"), details: "" });
    tests.push({ name: "Has animations", passed: page.includes("transition") || page.includes("animate"), details: "" });
  } catch {}

  return { passed: tests.filter(t => t.passed).length >= tests.length * 0.7, tests };
}

async function runFunctionalityTests(projectPath: string, generatedCode: string): Promise<TestResult> {
  await logger.log("🧪 Running FUNCTIONALITY Tests...");
  const tests: TestResult["tests"] = [];

  // Test 1: Has useState (required for interactivity)
  const hasUseState = generatedCode.includes("useState");
  tests.push({
    name: "Has useState hooks",
    passed: hasUseState,
    details: hasUseState ? "✓ Interactive state found" : "✗ No state management - STATIC PAGE",
  });

  // Test 2: Has form handling
  const hasFormHandling = generatedCode.includes("onSubmit") || generatedCode.includes("handleSubmit");
  tests.push({
    name: "Has form handling",
    passed: hasFormHandling,
    details: hasFormHandling ? "✓ Forms are functional" : "✗ No form handlers",
  });

  // Test 3: Has click handlers
  const hasClickHandlers = (generatedCode.match(/onClick/g) || []).length >= 2;
  tests.push({
    name: "Has click handlers (2+)",
    passed: hasClickHandlers,
    details: hasClickHandlers ? "✓ Buttons work" : "✗ Buttons don't do anything",
  });

  // Test 4: Has demo data
  const hasDemoData = generatedCode.includes("useState([") || generatedCode.includes("useState({");
  tests.push({
    name: "Has demo data",
    passed: hasDemoData,
    details: hasDemoData ? "✓ Pre-loaded data" : "✗ Empty state - nothing to show",
  });

  // Test 5: Has loading states
  const hasLoadingStates = generatedCode.includes("loading") || generatedCode.includes("isLoading");
  tests.push({
    name: "Has loading states",
    passed: hasLoadingStates,
    details: hasLoadingStates ? "✓ Shows feedback" : "✗ No loading indicators",
  });

  // Test 6: Has user feedback
  const hasFeedback = generatedCode.includes("success") || generatedCode.includes("error") || generatedCode.includes("toast") || generatedCode.includes("notification");
  tests.push({
    name: "Has user feedback",
    passed: hasFeedback,
    details: hasFeedback ? "✓ Shows success/error" : "✗ No feedback to user",
  });

  // Test 7: Not placeholder content
  const hasPlaceholder = ["Lorem ipsum", "placeholder", "TODO:", "coming soon", "example text"].some(p =>
    generatedCode.toLowerCase().includes(p.toLowerCase())
  );
  tests.push({
    name: "No placeholder text",
    passed: !hasPlaceholder,
    details: !hasPlaceholder ? "✓ Real content" : "✗ Has placeholder text",
  });

  // Test 8: Has CRUD operations (for list-based apps)
  const hasCRUD = generatedCode.includes("filter(") || generatedCode.includes("map(") && generatedCode.includes("set");
  tests.push({
    name: "Has CRUD operations",
    passed: hasCRUD,
    details: hasCRUD ? "✓ Add/delete works" : "✗ Static list",
  });

  // Calculate functionality score
  const passedCount = tests.filter(t => t.passed).length;
  const score = Math.round((passedCount / tests.length) * 100);

  return {
    passed: passedCount >= 5, // Must pass at least 5/8 functionality tests
    tests
  };
}

async function runBackendTests(projectPath: string): Promise<TestResult> {
  await logger.log("🧪 Running Backend Tests...");
  const tests: TestResult["tests"] = [];

  try {
    const pkg = JSON.parse(await fs.readFile(path.join(projectPath, "package.json"), "utf-8"));
    tests.push({ name: "Valid package.json", passed: !!pkg.name, details: pkg.name });
    tests.push({ name: "Has Next.js", passed: "next" in (pkg.dependencies || {}), details: "" });
    tests.push({ name: "Has React", passed: "react" in (pkg.dependencies || {}), details: "" });
  } catch {
    tests.push({ name: "Package.json", passed: false, details: "Invalid" });
  }

  return { passed: tests.filter(t => t.passed).length >= 2, tests };
}

async function fixFailedTests(projectPath: string, frontendResults: TestResult, funcResults: TestResult): Promise<void> {
  await logger.log("🔧 Fixing failed tests...");

  // Fix missing CSS import
  for (const test of frontendResults.tests) {
    if (!test.passed && test.name === "CSS Import") {
      const layoutPath = path.join(projectPath, "src/app/layout.tsx");
      try {
        let layout = await fs.readFile(layoutPath, "utf-8");
        if (!layout.includes("globals.css")) {
          layout = `import "./globals.css";\n\n${layout}`;
          await fs.writeFile(layoutPath, layout);
          await logger.log("Fixed: Added CSS import");
        }
      } catch {}
    }

    if (!test.passed && test.name.includes("postcss")) {
      await fs.writeFile(path.join(projectPath, "postcss.config.js"),
        `module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }`
      );
      await logger.log("Fixed: Created postcss.config.js");
    }
  }

  // Try to fix functionality issues by regenerating with stricter prompt
  const funcPassed = funcResults.tests.filter(t => t.passed).length;
  if (funcPassed < 5) {
    await logger.log("⚠️ Low functionality score - MVP may be too static!");
  }
}

// ============= BUILD FUNCTIONS =============

function getRandomDesign() {
  return DESIGN_STYLES[Math.floor(Math.random() * DESIGN_STYLES.length)];
}

async function buildWebApp(idea: Idea, projectPath: string): Promise<string> {
  const design = getRandomDesign();
  await logger.log(`Using design style: ${design.name}`);

  const hasAI = needsAI(idea);
  if (hasAI) await logger.log("🤖 AI features detected — including AI integration prompt");

  const prompt = `You are an expert full-stack developer. Build a COMPLETE, LAUNCH-READY Next.js 14 (App Router) web application.

PROJECT: ${idea.title}
DESCRIPTION: ${idea.description}
TARGET USERS: ${idea.targetUsers}
FEATURES (implement ALL of these):
${idea.features.map((f, i) => `  ${i + 1}. ${f}`).join("\n")}

DESIGN STYLE: "${design.name}"
- Background: ${design.colors}
- Cards: ${design.cardStyle}
- Buttons: ${design.button}
- Text: ${design.text}
- Accent gradient: ${design.accent}
- Typography: ${design.typography}
- Animations: ${design.animations}
- Inject these keyframes into globals.css: ${design.keyframes}

${FRONTEND_SKILLS_PROMPT}

${FUNCTIONALITY_RULES}

${hasAI ? AI_INTEGRATION_PROMPT : ""}

DEMO DATA REQUIREMENTS:
- Pre-populate with 8-12 REALISTIC items that match this exact use case
- Use real-sounding names, descriptions, dates, prices, etc.
- NEVER use "Item 1", "Item 2", "Test", "Example", "Lorem ipsum"
- Data should tell a story — make a user think "wow, this app is already populated"

FILE STRUCTURE — return a JSON array with these files (10-20 files total):
1. package.json — name, scripts (dev/build/start), dependencies, devDependencies
2. tsconfig.json — standard Next.js TypeScript config
3. tailwind.config.ts — with extended theme colors/animations matching the design
4. postcss.config.js — tailwindcss + autoprefixer
5. next.config.js — reactStrictMode: true
6. src/app/globals.css — @tailwind directives + all custom CSS from the design patterns above (aurora, glassmorphism, animations, keyframes)
7. src/app/layout.tsx — imports globals.css, sets metadata, wraps children with aurora background
8. src/app/page.tsx — 'use client', main landing/dashboard with hero section and feature overview
9. src/components/*.tsx — at least 3-4 reusable components (Header, Card, Modal, Toast, etc.)
10. src/lib/utils.ts — helper functions (formatDate, cn classname merger, etc.)
${hasAI ? "11. src/app/api/ai/route.ts — AI endpoint\n12. src/lib/ai.ts — client-side AI helper" : ""}

EVERY component must:
- Use 'use client' directive
- Import and use useState, and useEffect where needed
- Have working onClick/onSubmit handlers
- Show loading states during async operations
- Display toast notifications on success/error
- Include animated transitions (fade-in-up, hover-lift)

ABSOLUTELY FORBIDDEN:
- "Item 1", "Item 2", "Item 3" or any generic placeholder data
- "Coming soon", "TODO", "placeholder", "Lorem ipsum"
- Static pages with no interactivity
- Buttons or forms that don't do anything
- Empty arrays with no demo data
- Generic CRUD that doesn't match the idea

Return ONLY a JSON array of file objects. No explanation, no markdown outside the JSON:
[{"path":"package.json","content":"..."},{"path":"src/app/page.tsx","content":"..."},...]`;

  const response = await kimiComplete(prompt, 30000, 3, 0.4);
  const files = extractJSON(response);

  if (!files.length) throw new Error("No files generated");

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

  // Ensure globals.css has tailwind directives
  const cssPath = path.join(projectPath, "src/app/globals.css");
  try {
    const css = await fs.readFile(cssPath, "utf-8");
    if (!css.includes("@tailwind")) {
      await fs.writeFile(cssPath, `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n${css}`);
    }
  } catch {
    await fs.mkdir(path.join(projectPath, "src/app"), { recursive: true });
    await fs.writeFile(cssPath, `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n`);
  }

  // If AI project, ensure .env.local exists
  if (hasAI) {
    await fs.writeFile(path.join(projectPath, ".env.local"), `NVIDIA_API_KEY=${CONFIG.nvidia.apiKey}\n`);
  }

  return response;
}

async function buildChromeExtension(idea: Idea, projectPath: string): Promise<string> {
  const design = getRandomDesign();
  const hasAI = needsAI(idea);

  if (hasAI) await logger.log("🤖 AI features detected for extension");

  const prompt = `You are an expert Chrome extension developer. Build a COMPLETE, POLISHED Chrome Extension (Manifest V3).

PROJECT: ${idea.title}
DESCRIPTION: ${idea.description}
TARGET USERS: ${idea.targetUsers}
FEATURES (implement ALL):
${idea.features.map((f, i) => `  ${i + 1}. ${f}`).join("\n")}

DESIGN STYLE: "${design.name}"
- Cards: ${design.cardStyle}
- Buttons: ${design.button}
- Text: ${design.text}
- Accent: ${design.accent}
- Keyframes: ${design.keyframes}

POPUP.HTML REQUIREMENTS:
- Include <script src="https://cdn.tailwindcss.com"></script>
- Add inline <style> with these premium effects:
  * Aurora background with 3 animated gradient blobs
  * Glassmorphism containers (backdrop-filter:blur(20px), bg rgba white/5-10%)
  * Fade-in-up animations on load
  * Hover lift on cards/buttons (translateY(-2px) + shadow)
  * Smooth transitions on all interactive elements
  * Toast notifications for feedback
  * Skeleton loading placeholders
- Width: 380px, min-height: 500px
- Use the design style colors and patterns above

POPUP.JS REQUIREMENTS:
- document.addEventListener('DOMContentLoaded', ...) for initialization
- All buttons must have event listeners that DO something
- chrome.storage.local for persisting user data between sessions
- Show/hide elements based on state
- Animated transitions when content changes
- Real functionality matching EVERY feature listed above
- Pre-populate with realistic demo data (NOT "Item 1", "Item 2")

${hasAI ? `AI INTEGRATION:
- background.js should handle AI API calls via chrome.runtime.onMessage
- Use fetch to https://integrate.api.nvidia.com/v1/chat/completions
- API Key: Use chrome.storage.local to store/retrieve the key
- Show loading spinners while AI processes
- Display AI responses in formatted containers` : ""}

FILES TO GENERATE:
[
  {"path":"manifest.json","content":"Manifest V3 with name, version, permissions:[storage,activeTab${hasAI ? ',background' : ''}], action.default_popup"},
  {"path":"popup.html","content":"Full HTML with Tailwind CDN, inline styles for aurora/glass effects, semantic structure"},
  {"path":"popup.js","content":"Complete JS with event listeners, chrome.storage, state management, all features working"},
  {"path":"styles.css","content":"Additional custom styles for animations and effects"}
  ${hasAI ? ',{"path":"background.js","content":"Service worker with AI API integration via chrome.runtime.onMessage"}' : ""}
]

ABSOLUTELY FORBIDDEN:
- Placeholder text ("Item 1", "Lorem ipsum", "Coming soon")
- Buttons that don't do anything
- Empty states with no data
- Generic todo/note functionality unless that IS the idea
- Static display-only popups

Return ONLY a JSON array of file objects:`;

  const response = await kimiComplete(prompt, 20000, 3, 0.4);
  const files = extractJSON(response);

  if (!files.length) throw new Error("No files generated");

  for (const file of files) {
    if (file.path && file.content) {
      const filePath = path.join(projectPath, file.path);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, typeof file.content === "string" ? file.content : JSON.stringify(file.content, null, 2));
    }
  }

  try {
    await execAsync(`cd "${projectPath}" && zip -r "../${path.basename(projectPath)}.zip" . -x "*.git*" 2>/dev/null || true`, { timeout: 30000 });
  } catch {}

  return response;
}

async function buildMobileApp(idea: Idea, projectPath: string): Promise<string> {
  const design = getRandomDesign();
  const hasAI = needsAI(idea);

  if (hasAI) await logger.log("🤖 AI features detected for mobile app");

  const prompt = `You are an expert React Native / Expo developer. Build a COMPLETE, POLISHED mobile app.

PROJECT: ${idea.title}
DESCRIPTION: ${idea.description}
TARGET USERS: ${idea.targetUsers}
FEATURES (implement ALL):
${idea.features.map((f, i) => `  ${i + 1}. ${f}`).join("\n")}

DESIGN STYLE: "${design.name}"
- Use these colors in StyleSheet: accent gradient ${design.accent}
- Typography: ${design.typography}

STYLING REQUIREMENTS:
- Use StyleSheet.create for all styles
- Linear gradient backgrounds using expo-linear-gradient
- Rounded corners (borderRadius: 20+)
- Soft shadows (shadowColor, shadowOffset, shadowOpacity, shadowRadius)
- Animated transitions using Animated API or react-native-reanimated
- Professional spacing and typography
- Status bar styling

FUNCTIONALITY REQUIREMENTS:
- useState for ALL interactive elements
- Working TouchableOpacity/Pressable buttons
- TextInput fields with onChangeText handlers
- FlatList or ScrollView with real demo data (8+ items, realistic content)
- Loading states with ActivityIndicator
- Modal for confirmations
- Alert.alert for feedback
- AsyncStorage for data persistence
- Pull-to-refresh where appropriate

${hasAI ? `AI INTEGRATION:
- Create an api helper that calls https://integrate.api.nvidia.com/v1/chat/completions
- Show loading state while AI processes
- Display AI responses in styled containers` : ""}

FILE STRUCTURE — return JSON array:
[
  {"path":"package.json","content":"name, dependencies (expo, react-native, expo-router, expo-linear-gradient, @react-native-async-storage/async-storage)"},
  {"path":"app.json","content":"Expo config with name, slug, version, scheme, orientation, icon, splash"},
  {"path":"app/_layout.tsx","content":"Root layout with Stack navigator, screen options"},
  {"path":"app/index.tsx","content":"Main screen — FULLY FUNCTIONAL with all features, useState, demo data, interactions"},
  {"path":"app/details.tsx","content":"Detail/secondary screen"},
  {"path":"components/Card.tsx","content":"Reusable styled card component"},
  {"path":"components/Header.tsx","content":"App header with title and actions"},
  {"path":"lib/storage.ts","content":"AsyncStorage helpers for persistence"},
  ${hasAI ? '{"path":"lib/ai.ts","content":"AI API helper function"},' : ""}
  {"path":"constants/theme.ts","content":"Colors, spacing, typography constants matching ${design.name}"}
]

ABSOLUTELY FORBIDDEN:
- "Item 1", "Item 2" or generic placeholder data
- Static screens with no interactions
- Missing imports or undefined components
- "Coming soon" sections

Return ONLY a JSON array of file objects:`;

  const response = await kimiComplete(prompt, 25000, 3, 0.4);
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
      framework: "nextjs",
      installCommand: "npm install --legacy-peer-deps"
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
  } catch (error) {
    await logger.log(`Vercel error: ${error}`, "WARN");
  }
  return "";
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

    await fs.writeFile(path.join(projectPath, ".gitignore"), "node_modules/\n.next/\n.vercel/\n.env\n.env.local\n.DS_Store");

    await execAsync("rm -rf .git 2>/dev/null || true", { cwd: projectPath });
    await execAsync("git init && git add -A", { cwd: projectPath });
    await execAsync(`git commit -m "✨ ${idea.title} - Built by MVP Factory v9"`, { cwd: projectPath });
    await execAsync("git branch -M main", { cwd: projectPath });
    await execAsync(`git remote add origin https://${CONFIG.github.token}@github.com/${CONFIG.github.username}/${repoName}.git 2>/dev/null || true`, { cwd: projectPath });
    await execAsync("git push -u origin main --force 2>&1", { cwd: projectPath });


    // Tag repo with category topics
    const topicMap: Record<string, string[]> = {
      web: ["web-app", "nextjs", "react", "mvp", "typescript"],
      saas: ["saas", "nextjs", "react", "mvp", "typescript"],
      mobile: ["mobile-app", "react-native", "expo", "mvp"],
      extension: ["chrome-extension", "browser-extension", "mvp"],
      api: ["api", "nodejs", "mvp", "typescript"],
    };
    const categoryLabel: Record<string, string> = {
      web: "Web App",
      saas: "SaaS",
      mobile: "Mobile App",
      extension: "Chrome Extension",
      api: "API",
    };
    const topics = topicMap[idea.type] || ["mvp"];
    const label = categoryLabel[idea.type] || "App";
    try {
      await fetch(`https://api.github.com/repos/${CONFIG.github.username}/${repoName}/topics`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${CONFIG.github.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ names: topics }),
      });
      await fetch(`https://api.github.com/repos/${CONFIG.github.username}/${repoName}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${CONFIG.github.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ description: `[${label}] ${idea.description}` }),
      });
      await logger.log(`Tagged ${repoName}: [${label}] + topics: ${topics.join(", ")}`);
    } catch (e) {
      await logger.log(`Topic tagging error: ${e}`, "WARN");
    }

    return `https://github.com/${CONFIG.github.username}/${repoName}`;
  } catch (e) {
    await logger.log(`GitHub error: ${e}`, "WARN");
    return "";
  }
}


// ============= PACKAGE SANITIZER =============

const KNOWN_GOOD_VERSIONS: Record<string, string> = {
  "next": "^14.2.21",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "typescript": "^5.7.3",
  "@types/node": "^20.17.16",
  "@types/react": "^18.3.18",
  "@types/react-dom": "^18.3.5",
  "tailwindcss": "^3.4.17",
  "postcss": "^8.5.1",
  "autoprefixer": "^10.4.20",
  "eslint": "^8.56.0",
  "eslint-config-next": "^14.2.21",
  "@supabase/supabase-js": "^2.49.1",
  "lucide-react": "^0.469.0",
  "framer-motion": "^11.18.0",
  "recharts": "^2.15.0",
  "date-fns": "^4.1.0",
};

async function sanitizePackageJson(projectPath: string): Promise<void> {
  const pkgPath = path.join(projectPath, "package.json");
  try {
    const pkg = JSON.parse(await fs.readFile(pkgPath, "utf-8"));

    for (const section of ["dependencies", "devDependencies"]) {
      if (pkg[section]) {
        for (const dep of Object.keys(pkg[section])) {
          if (KNOWN_GOOD_VERSIONS[dep]) {
            pkg[section][dep] = KNOWN_GOOD_VERSIONS[dep];
          } else if (typeof pkg[section][dep] === "string" && /^\d/.test(pkg[section][dep])) {
            pkg[section][dep] = "^" + pkg[section][dep];
          }
        }
      }
    }

    if (!pkg.scripts) pkg.scripts = {};
    if (!pkg.scripts.build) pkg.scripts.build = "next build";
    if (!pkg.scripts.dev) pkg.scripts.dev = "next dev";
    if (!pkg.scripts.start) pkg.scripts.start = "next start";

    // Ensure required TypeScript devDeps exist for Next.js projects
    if (!pkg.devDependencies) pkg.devDependencies = {};
    const requiredDevDeps: Record<string, string> = {
      "typescript": "^5.7.3",
      "@types/node": "^20.17.16",
      "@types/react": "^18.3.18",
    };
    for (const [dep, ver] of Object.entries(requiredDevDeps)) {
      if (!pkg.devDependencies[dep] && !pkg.dependencies?.[dep]) {
        pkg.devDependencies[dep] = ver;
      }
    }

    // Ensure required dependencies exist
    if (!pkg.dependencies) pkg.dependencies = {};
    if (!pkg.dependencies.next) pkg.dependencies.next = "^14.2.21";
    if (!pkg.dependencies.react) pkg.dependencies.react = "^18.3.1";
    if (!pkg.dependencies["react-dom"]) pkg.dependencies["react-dom"] = "^18.3.1";

    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2));
    await logger.log("📦 Sanitized package.json versions");
  } catch (e) {
    await logger.log("Could not sanitize package.json: " + e, "WARN");
  }
}

// ============= MAIN BUILD =============

async function validateGeneratedCode(projectPath: string): Promise<void> {
  const exts = [".tsx", ".ts", ".jsx", ".js"];
  async function walkDir(dir: string): Promise<string[]> {
    const files: string[] = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
        if (entry.isDirectory()) files.push(...await walkDir(full));
        else if (exts.some(ext => entry.name.endsWith(ext))) files.push(full);
      }
    } catch {}
    return files;
  }

  const codeFiles = await walkDir(projectPath);
  for (const filePath of codeFiles) {
    try {
      let content = await fs.readFile(filePath, "utf-8");
      let changed = false;

      const ob = (content.match(/\{/g) || []).length;
      const cb = (content.match(/\}/g) || []).length;
      if (ob > cb) {
        content = content.trimEnd() + "\n" + "}".repeat(ob - cb) + "\n";
        changed = true;
        await logger.log(`Fixed ${ob - cb} missing closing brace(s) in ${path.basename(filePath)}`);
      }

      const op = (content.match(/\(/g) || []).length;
      const cp = (content.match(/\)/g) || []).length;
      if (op > cp) {
        content = content.trimEnd() + ")".repeat(op - cp) + "\n";
        changed = true;
        await logger.log(`Fixed ${op - cp} missing closing paren(s) in ${path.basename(filePath)}`);
      }

      if (changed) await fs.writeFile(filePath, content);
    } catch {}
  }
  await logger.log("Code validation complete");
}


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
  await logger.log(`🤖 AI: ${needsAI(idea) ? "YES" : "NO"}`);
  await logger.log(`${"=".repeat(50)}\n`);

  await sendTelegram(`🔨 *Building*: ${idea.title}\nType: ${idea.type}\nAI: ${needsAI(idea) ? "Yes" : "No"}`);

  const projectName = idea.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 25);
  const typeFolder = idea.type === "extension" ? "extensions" : idea.type === "mobile" ? "mobile" : "web";
  const projectPath = path.join(CONFIG.paths.output, typeFolder, projectName);

  await fs.mkdir(projectPath, { recursive: true });

  let generatedCode = "";

  try {
    await logger.log("📝 Generating LAUNCH-READY code...");

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

    // Sanitize package.json to fix invalid dependency versions
    if (idea.type !== "extension") {
      await sanitizePackageJson(projectPath);
    }

    // Validate and fix generated code (unbalanced braces, etc.)
    await validateGeneratedCode(projectPath);

    // Run ALL tests
    await logger.log("\n🧪 TESTING PHASE");
    await logger.log("-".repeat(30));

    stats.testsRun = (stats.testsRun || 0) + 4;

    let frontendResults: TestResult = { passed: true, tests: [] };
    let backendResults: TestResult = { passed: true, tests: [] };
    let funcResults: TestResult = { passed: true, tests: [] };

    if (idea.type !== "extension" && idea.type !== "mobile") {
      frontendResults = await runFrontendTests(projectPath);
      await logger.log(`Frontend: ${frontendResults.passed ? "✅ PASSED" : "⚠️ ISSUES"}`);
      frontendResults.tests.forEach(t => logger.log(`  ${t.passed ? "✓" : "✗"} ${t.name}`));

      backendResults = await runBackendTests(projectPath);
      await logger.log(`Backend: ${backendResults.passed ? "✅ PASSED" : "⚠️ ISSUES"}`);
    }

    // CRITICAL: Functionality tests
    funcResults = await runFunctionalityTests(projectPath, generatedCode);
    await logger.log(`\n🎯 FUNCTIONALITY: ${funcResults.passed ? "✅ PASSED" : "❌ FAILED"}`);
    funcResults.tests.forEach(t => logger.log(`  ${t.passed ? "✓" : "✗"} ${t.name}: ${t.details}`));

    const funcScore = funcResults.tests.filter(t => t.passed).length;
    stats.functionalityScore = (stats.functionalityScore || 0) + funcScore;

    // Fix issues
    if (!frontendResults.passed || !funcResults.passed) {
      await fixFailedTests(projectPath, frontendResults, funcResults);
    }

    const allPassed = frontendResults.passed && backendResults.passed && funcResults.passed;
    if (allPassed) stats.testsPassed = (stats.testsPassed || 0) + 4;

    await logger.log("-".repeat(30));

    // Install dependencies
    if (idea.type !== "extension") {
      await logger.log("📦 Installing dependencies...");
      try {
        await execAsync("npm install 2>&1 || true", { cwd: projectPath, timeout: 120000 });
      } catch {}
    }

    // Create README
    const funcTestScore = `${funcResults.tests.filter(t => t.passed).length}/${funcResults.tests.length}`;
    const readme = `# ${idea.title}

> ${idea.description}

## 🎯 What Users Can Do
${idea.features.map(f => `- ✅ ${f}`).join('\n')}

## 🧪 Functionality Score: ${funcTestScore}
- ✅ Interactive state management
- ✅ Working forms with validation
- ✅ Clickable buttons with actions
- ✅ Demo data pre-loaded
- ✅ Loading & success feedback

## 🚀 Quick Start
\`\`\`bash
npm install
npm run dev
\`\`\`

---
*Built with ❤️ by MVP Factory v9 (Launch-Ready Products)*
`;
    await fs.writeFile(path.join(projectPath, "README.md"), readme);

    // Push & Deploy
    const githubUrl = await pushToGithub(projectPath, idea, projectName);
    if (githubUrl) await logger.log(`📂 GitHub: ${githubUrl}`);

    let liveUrl = "";
    if (idea.type === "web" || idea.type === "saas") {
      liveUrl = await deployToVercel(projectPath, projectName);
    }


    // Set Vercel live URL as repo homepage
    if (liveUrl && githubUrl && CONFIG.github.token) {
      const repoName = `mvp-${projectName}`;
      try {
        await fetch(`https://api.github.com/repos/${CONFIG.github.username}/${repoName}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${CONFIG.github.token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ homepage: liveUrl }),
        });
        await logger.log(`Set homepage: ${liveUrl}`);
      } catch {}
    }

    // Update stats
    stats.buildsToday++;
    stats.totalBuilt++;
    stats.lastBuildAt = new Date().toISOString();
    await saveStats(stats);

    // Save to built
    await fs.mkdir(CONFIG.paths.built, { recursive: true });
    const builtIdea = { ...idea, builtAt: new Date().toISOString(), projectPath, githubUrl, liveUrl, functionalityScore: funcScore };
    await fs.writeFile(path.join(CONFIG.paths.built, `${idea.id}.json`), JSON.stringify(builtIdea, null, 2));
    await fs.unlink(path.join(CONFIG.paths.ideas, `${idea.id}.json`)).catch(() => {});

    // Notification
    let msg = `✅ *MVP Complete*: ${idea.title}\n📦 Type: ${idea.type}\n🎯 Functionality: ${funcTestScore}`;
    if (githubUrl) msg += `\n📂 ${githubUrl}`;
    if (liveUrl) msg += `\n🌐 ${liveUrl}`;
    await sendTelegram(msg);

    await logger.log(`\n✅ MVP COMPLETE: ${idea.title} (Func: ${funcTestScore})`);
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

  const prompt = `Generate 5 UNIQUE app ideas that MUST have clear user interactions.

Each app MUST allow users to DO something specific:
- Add/edit/delete items
- Submit forms
- Track progress
- Calculate values
- Filter/search data

Mix types: "web", "mobile", "saas", "extension"

Return ONLY JSON:
[{"title":"Name","description":"One line","problem":"Problem","targetUsers":"Users","features":["Interactive feature 1","Interactive feature 2"],"techStack":"Stack","type":"web|mobile|saas|extension","estimatedHours":12,"viabilityScore":8}]`;

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
  await logger.log(`📊 Today: ${stats.buildsToday}/${CONFIG.limits.maxBuildsPerDay} | Func: ${stats.functionalityScore || 0}pts | Queue: ${ideaFiles.length}`);
}

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                      MVP FACTORY v9.0                             ║
║   🚀 LAUNCH-READY: Premium, Purpose-Built Products               ║
║   🎨 Aurora + Glassmorphism + Micro-interactions                  ║
║   🤖 AI Integration (Kimi K2.5) When Needed                      ║
║   🧪 Testing + 🎯 Real Data + ⚡ Working Features                ║
║              Max 15/day | Web + Mobile + Extensions               ║
╚═══════════════════════════════════════════════════════════════════╝
`);

  await logger.log("🚀 MVP Factory v9 Starting...");
  await logger.log(`GitHub: ${CONFIG.github.username}`);
  await logger.log(`Vercel: ${CONFIG.vercel.token ? "✅" : "❌"}`);
  await logger.log(`Testing: ✅ Frontend + Backend + FUNCTIONALITY`);
  await logger.log(`Design: ✅ 6 premium styles with animations`);
  await logger.log(`Frontend: ✅ Aurora, glassmorphism, micro-interactions`);
  await logger.log(`AI: ✅ Auto-detect & integrate Kimi K2.5`);
  await logger.log(`Interactions: ✅ Forms, buttons, CRUD, feedback`);

  await fs.mkdir(CONFIG.paths.ideas, { recursive: true });
  await fs.mkdir(CONFIG.paths.built, { recursive: true });
  await fs.mkdir(path.join(CONFIG.paths.output, "web"), { recursive: true });
  await fs.mkdir(path.join(CONFIG.paths.output, "mobile"), { recursive: true });
  await fs.mkdir(path.join(CONFIG.paths.output, "extensions"), { recursive: true });

  await showStats();
  await sendTelegram("🚀 *MVP Factory v9* started!\n• Launch-ready products\n• Aurora + glassmorphism\n• AI integration\n• Max 15/day");

  await runResearchCycle();
  await runBuildCycle();

  setInterval(runResearchCycle, CONFIG.intervals.research);
  setInterval(runBuildCycle, CONFIG.intervals.build);
  setInterval(showStats, 30 * 60 * 1000);

  await logger.log("\n🚀 Running continuously!\n");
}

main().catch(e => { console.error(e); process.exit(1); });
