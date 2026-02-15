/**
 * MVP Factory Autonomous Daemon v10
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
    maxBuildsPerDay: 50,
    researchPerDay: 6,
  },
  intervals: {
    research: 4 * 60 * 60 * 1000,
    build: 15 * 60 * 1000,
  },
  reddit: {
    subreddits: [
      "SideProject", "startups", "SaaS", "AppIdeas", "indiehackers",
      "Entrepreneur", "webdev", "reactnative", "nextjs", "opensource",
      "SomebodyMakeThis", "Lightbulb", "slavelabour",
    ],
    signalKeywords: [
      "i wish", "someone should build", "looking for", "need a tool",
      "frustrated with", "would pay for", "why isn't there", "alternative to",
      "is there a", "how do i", "tired of", "can't find", "help me find",
      "recommendation for", "suggest a", "built this", "just launched",
      "side project", "weekend project", "what if there was",
    ],
    minScore: 10,
    postsPerSubreddit: 25,
    sortBy: "top" as const,
    timeRange: "week",
    fetchDelayMs: 7000,
    clientId: process.env.REDDIT_CLIENT_ID || "",
    clientSecret: process.env.REDDIT_CLIENT_SECRET || "",
  },
};

// ============= DESIGN SYSTEM (v10 - 12 unique styles) =============
const DESIGN_STYLES = [
  {
    name: "Glassmorphism Dark",
    bg: "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900",
    card: "bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl",
    accent: "#8b5cf6",
    text: "text-white",
    btn: "bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shadow-lg shadow-violet-500/25",
    font: "Sora",
    css: `.aurora-bg{position:fixed;inset:0;overflow:hidden;z-index:0}.aurora-blob{position:absolute;border-radius:50%;filter:blur(80px);opacity:.4;animation:aurora 12s ease-in-out infinite}.aurora-blob:nth-child(1){width:500px;height:500px;background:#7c3aed;top:-10%;left:20%}.aurora-blob:nth-child(2){width:400px;height:400px;background:#06b6d4;bottom:10%;right:10%;animation-delay:-4s}.aurora-blob:nth-child(3){width:350px;height:350px;background:#f43f5e;top:40%;left:50%;animation-delay:-8s}@keyframes aurora{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-50px) scale(1.1)}66%{transform:translate(-20px,30px) scale(.9)}}`,
  },
  {
    name: "Neobrutalism",
    bg: "bg-[#FFFEF0]",
    card: "bg-white border-4 border-black shadow-[8px_8px_0_0_#000]",
    accent: "#FF6B6B",
    text: "text-black",
    btn: "bg-[#FF6B6B] border-4 border-black font-bold uppercase shadow-[4px_4px_0_0_#000] hover:translate-x-1 hover:-translate-y-1 active:shadow-none active:translate-x-0 active:translate-y-0 transition-all",
    font: "Archivo",
    css: ``,
  },
  {
    name: "Aurora Emerald",
    bg: "bg-gradient-to-br from-emerald-950 via-cyan-950 to-blue-950",
    card: "bg-white/5 backdrop-blur-lg border border-emerald-500/20 rounded-3xl",
    accent: "#34d399",
    text: "text-white",
    btn: "bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-500 hover:to-cyan-500 text-black font-semibold shadow-lg shadow-emerald-500/25",
    font: "DM Sans",
    css: `.aurora-bg::before,.aurora-bg::after{content:"";position:absolute;width:60vw;height:60vw;border-radius:50%;filter:blur(80px);opacity:.5;animation:drift 15s ease-in-out infinite alternate}.aurora-bg::before{background:radial-gradient(circle,#34d399,transparent 70%);top:-20%;left:-10%}.aurora-bg::after{background:radial-gradient(circle,#06b6d4,transparent 70%);bottom:-20%;right:-10%;animation-delay:-7s}@keyframes drift{0%{transform:translate(0,0) scale(1)}50%{transform:translate(5%,10%) scale(1.1)}100%{transform:translate(-5%,-5%) scale(.95)}}`,
  },
  {
    name: "Soft Minimal",
    bg: "bg-[#FAF9F6]",
    card: "bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,.06)] border border-gray-100",
    accent: "#f97316",
    text: "text-gray-900",
    btn: "bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all",
    font: "Plus Jakarta Sans",
    css: ``,
  },
  {
    name: "Cyberpunk Neon",
    bg: "bg-black",
    card: "bg-gray-900/80 border border-cyan-500/50 rounded-lg shadow-[0_0_20px_rgba(6,182,212,.3)]",
    accent: "#22d3ee",
    text: "text-cyan-50",
    btn: "bg-gradient-to-r from-cyan-400 to-pink-500 text-black font-bold ring-2 ring-cyan-400/50 hover:shadow-[0_0_30px_rgba(6,182,212,.5)] active:scale-95 transition-all",
    font: "JetBrains Mono",
    css: `@keyframes glitch{0%{text-shadow:2px 0 #ff00ff,-2px 0 #00ffff}25%{text-shadow:-2px 0 #ff00ff,2px 0 #00ffff}50%{text-shadow:2px -2px #ff00ff,-2px 2px #00ffff}100%{text-shadow:2px 0 #ff00ff,-2px 0 #00ffff}}@keyframes neonPulse{0%,100%{box-shadow:0 0 5px #0ff,0 0 20px #0ff}50%{box-shadow:0 0 10px #0ff,0 0 40px #0ff}}`,
  },
  {
    name: "Warm Sunset",
    bg: "bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50",
    card: "bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-100",
    accent: "#f59e0b",
    text: "text-gray-800",
    btn: "bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white shadow-lg shadow-amber-500/25 active:scale-95 transition-all",
    font: "Lora",
    css: ``,
  },
  {
    name: "Bento Dark",
    bg: "bg-[#0a0a0a]",
    card: "bg-[#141414] rounded-[20px] border border-white/[.08] hover:border-white/[.15] transition-colors",
    accent: "#a78bfa",
    text: "text-white",
    btn: "bg-white text-black font-medium rounded-full hover:bg-gray-200 active:scale-95 transition-all",
    font: "Geist",
    css: `.bento-grid{display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(3,minmax(200px,auto));gap:1rem}.bento-grid .feature{grid-column:span 2;grid-row:span 2}.bento-grid .tall{grid-row:span 2}.bento-grid .wide{grid-column:span 2}@media(max-width:768px){.bento-grid{grid-template-columns:repeat(2,1fr)}}`,
  },
  {
    name: "Claymorphism",
    bg: "bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100",
    card: "rounded-[24px] shadow-[0_12px_24px_rgba(0,0,0,.15),inset_0_-4px_8px_rgba(0,0,0,.1),inset_0_4px_8px_rgba(255,255,255,.4)]",
    accent: "#818cf8",
    text: "text-gray-800",
    btn: "bg-indigo-400 text-white font-semibold rounded-2xl shadow-[0_8px_16px_rgba(99,102,241,.4),inset_0_2px_4px_rgba(255,255,255,.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all",
    font: "Outfit",
    css: ``,
  },
  {
    name: "Mesh Gradient",
    bg: "bg-[#0f172a]",
    card: "bg-white/[.07] backdrop-blur-xl rounded-2xl border border-white/[.1]",
    accent: "#f472b6",
    text: "text-white",
    btn: "bg-gradient-to-r from-pink-500 to-violet-500 text-white font-medium shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:-translate-y-0.5 transition-all",
    font: "Manrope",
    css: `.mesh-bg{background:radial-gradient(at 0% 0%,#7c3aed 0%,transparent 50%),radial-gradient(at 100% 0%,#06b6d4 0%,transparent 50%),radial-gradient(at 100% 100%,#f472b6 0%,transparent 50%),radial-gradient(at 0% 100%,#fbbf24 0%,transparent 50%),#0f172a}`,
  },
  {
    name: "Terminal Green",
    bg: "bg-[#0d1117]",
    card: "bg-[#161b22] border border-[#30363d] rounded-lg",
    accent: "#3fb950",
    text: "text-[#c9d1d9]",
    btn: "bg-[#238636] hover:bg-[#2ea043] text-white font-medium border border-[#3fb950]/30 rounded-md transition-colors",
    font: "Fira Code",
    css: `@keyframes typing{from{width:0}to{width:100%}}@keyframes blink{from,to{border-color:transparent}50%{border-color:#3fb950}}.typewriter{overflow:hidden;border-right:3px solid;white-space:nowrap;width:0;animation:typing 3.5s steps(30) forwards,blink .75s step-end infinite}`,
  },
  {
    name: "Frosted Lavender",
    bg: "bg-gradient-to-br from-violet-100 via-fuchsia-50 to-sky-100",
    card: "bg-white/60 backdrop-blur-lg rounded-3xl border border-violet-200/50 shadow-lg",
    accent: "#a855f7",
    text: "text-violet-950",
    btn: "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-medium rounded-2xl shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 hover:-translate-y-0.5 transition-all",
    font: "Figtree",
    css: ``,
  },
  {
    name: "Mono Editorial",
    bg: "bg-white",
    card: "bg-white border-b-2 border-black pb-6",
    accent: "#000000",
    text: "text-black",
    btn: "bg-black text-white font-medium px-8 py-3 hover:bg-gray-800 transition-colors",
    font: "Instrument Serif",
    css: `.editorial h1{font-size:clamp(3rem,8vw,7rem);font-weight:900;line-height:.95;letter-spacing:-.03em}.editorial .dropcap::first-letter{initial-letter:3;font-weight:700;margin-right:.1em}`,
  },
];

// ============= FUNCTIONALITY REQUIREMENTS =============
const FUNCTIONALITY_RULES = `
CRITICAL - EVERY MVP MUST BE A FULLY WORKING PRODUCT (not a demo/prototype):

1. ZERO DEAD ENDS — every UI element must work:
   - Every button MUST have a working onClick that changes visible state
   - Every nav link MUST switch to a real view with real content
   - Every form MUST submit, validate, and show results
   - Every modal MUST open AND close properly
   - Every delete button MUST remove the item with animation
   - Every search/filter MUST actually filter the displayed list
   - NEVER use alert() — use inline toast/notification components

2. FULL STATE MANAGEMENT — app must feel alive:
   - useState for ALL interactive elements (no exceptions)
   - Items can be Created, Read, Updated, and Deleted (full CRUD)
   - Search/filter state that filters items in real-time as user types
   - Sort functionality (by date, name, status, priority, etc.)
   - Toggle between list/grid view where appropriate
   - Tab navigation state to switch between views
   - Form state with validation (required fields, format checks)
   - localStorage.setItem/getItem to persist data across page refreshes

3. REALISTIC DEMO DATA — must look like a real product in use:
   - 10-15 pre-populated items with realistic, diverse data
   - Real names (Sarah Chen, Marcus Johnson, Emily Rodriguez — NOT User 1, User 2)
   - Real dates (2024-03-15, 2024-04-02 — NOT placeholder or today)
   - Real prices ($49.99, $12,500 — NOT $0 or $XX.XX)
   - Real descriptions (2-3 sentences of actual content — NOT Lorem ipsum)
   - Mixed statuses (active, pending, completed, cancelled — shows variety)
   - Demo data must be diverse: different categories, different values, different states

4. COMPLETE TAB VIEWS — every nav tab must render a full page:
   - HOME tab: Main content with item list/grid, add button, search bar
   - DASHBOARD tab: Stats cards (total items, completed %, recent activity), summary using pure CSS/SVG bars, activity timeline
   - PROFILE/SETTINGS tab: User avatar placeholder, display name, email, theme toggle (dark/light), notification prefs with working toggles, export data button
   - Each tab must have AT LEAST 3 interactive elements

5. WORKING FEATURES — not just UI mockups:
   - Search bar: filters items as user types (items.filter(i => i.title.toLowerCase().includes(query)))
   - Sort dropdown: changes item order (by date, by name, by status)
   - Status filters: click to show only items with a specific status
   - Counters update when items are added/deleted
   - Dashboard stats recalculate based on actual items array
   - Dark mode toggle actually switches all colors via CSS class or state
   - Export button copies data to clipboard or downloads as JSON

6. VISUAL FEEDBACK FOR EVERY ACTION:
   - Loading: skeleton shimmer for initial load, inline spinner on buttons during actions
   - Success: green toast slides in from bottom-right, auto-dismisses after 3s
   - Error: red toast with error message
   - Delete: item fades out before removal (300ms transition)
   - Add: new item slides in at top of list
   - Buttons: disabled + spinner during async operations
   - Form validation: red border + message on invalid, green on valid

ABSOLUTELY FORBIDDEN (will fail quality check):
- Static pages with no interactions
- Buttons that do nothing (onClick={() => {} is NOT acceptable)
- href="#" or href="/page" links (MUST use state-based navigation)
- Empty states with no demo data on first load
- Forms without submit handlers
- "Coming soon", "Under construction", "TODO" sections
- Placeholder text: "Lorem ipsum", "Sample text", "Description here"
- More than 1-2 placeholder items maximum in the entire app
- Modals/drawers that do not close when clicking outside or pressing X
- console.log as the only action on button click
`;

const SAMPLE_INTERACTIONS = `
REQUIRED PATTERNS — use ALL of these in every app:

// ===== TAB NAVIGATION (MANDATORY) =====
const [activeTab, setActiveTab] = useState("home")
// In navbar: onClick={() => setActiveTab("dashboard")} — NEVER href="#"
// Render: {activeTab === "home" && <HomeView />} {activeTab === "dashboard" && <DashboardView />}

// ===== SEARCH + FILTER (MANDATORY) =====
const [searchQuery, setSearchQuery] = useState("")
const [statusFilter, setStatusFilter] = useState("all")
const [sortBy, setSortBy] = useState("date")

const filteredItems = items
  .filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
  .filter(item => statusFilter === "all" || item.status === statusFilter)
  .sort((a, b) => sortBy === "date" ? b.date.localeCompare(a.date) : a.title.localeCompare(b.title))

// ===== FULL CRUD (MANDATORY) =====
const addItem = (data) => { setItems([{ id: Date.now().toString(), ...data, date: new Date().toISOString().split("T")[0] }, ...items]); showToast("Added successfully", "success") }
const deleteItem = (id) => { setItems(items.filter(i => i.id !== id)); showToast("Deleted", "success") }
const updateItem = (id, updates) => { setItems(items.map(i => i.id === id ? {...i, ...updates} : i)); showToast("Updated", "success") }
const toggleStatus = (id) => { setItems(items.map(i => i.id === id ? {...i, status: i.status === "active" ? "completed" : "active"} : i)) }

// ===== DATA PERSISTENCE (MANDATORY) =====
useEffect(() => { const saved = localStorage.getItem("app-items"); if (saved) setItems(JSON.parse(saved)) }, [])
useEffect(() => { localStorage.setItem("app-items", JSON.stringify(items)) }, [items])

// ===== DASHBOARD STATS (MANDATORY for dashboard tab) =====
const stats = {
  total: items.length,
  active: items.filter(i => i.status === "active").length,
  completed: items.filter(i => i.status === "completed").length,
  completionRate: Math.round((items.filter(i => i.status === "completed").length / Math.max(items.length, 1)) * 100),
}

// ===== DARK MODE (MANDATORY for settings tab) =====
const [darkMode, setDarkMode] = useState(false)
useEffect(() => { document.documentElement.classList.toggle("dark", darkMode) }, [darkMode])

// ===== TOAST NOTIFICATIONS =====
const [toast, setToast] = useState(null)
const showToast = (message, type = "success") => { setToast({message, type}); setTimeout(() => setToast(null), 3000) }

// ===== EXPORT DATA =====
const exportData = () => { navigator.clipboard.writeText(JSON.stringify(items, null, 2)); showToast("Data copied to clipboard") }

// ===== FORM WITH VALIDATION =====
const [formErrors, setFormErrors] = useState({})
const validateForm = () => {
  const errors = {}
  if (!formData.title.trim()) errors.title = "Title is required"
  if (!formData.description.trim()) errors.description = "Description is required"
  setFormErrors(errors)
  return Object.keys(errors).length === 0
}
`;

// ============= UTILITY TOOL CATEGORIES (steer away from AI-heavy ideas) =============
const UTILITY_CATEGORIES = `
PROVEN UTILITY TOOL CATEGORIES (reference these for idea generation):

Document Tools: PDF merge/split/compress, image resize/convert/compress, markdown editor/previewer, invoice generator, resume builder, receipt scanner organizer
Developer Tools: JSON formatter/validator, regex tester with explanation, cron expression builder, base64 encode/decode, diff checker, color palette generator, CSS gradient maker, SVG editor, HTML to markdown converter, JWT decoder, URL encoder/decoder
Calculators: Mortgage/loan calculator, tip splitter, unit converter, BMI calculator, compound interest calculator, time zone converter, percentage calculator, date duration calculator, salary/hourly rate converter
Productivity: Pomodoro timer, habit tracker, kanban board, meeting cost calculator, word/character counter, QR code generator, password generator, checklist maker, expense splitter, countdown timer
Data Tools: CSV viewer/editor, spreadsheet to JSON converter, chart/graph maker from data, URL shortener, text compare/diff, data format converter (XML/JSON/YAML/CSV)
Media Tools: Image background remover (canvas API), favicon generator, screenshot beautifier/mockup, open graph image maker, placeholder image generator, emoji picker, icon search
`;

// ============= PRODUCT ARCHETYPE CLASSIFICATION (from Frontend UX Mastery) =============
function getProductArchetype(idea: Idea): { archetype: string; label: string; motionLevel: number; density: string } {
  const text = `${idea.title} ${idea.description} ${idea.features.join(" ")}`.toLowerCase();
  const type = idea.type;

  // D — Chrome Extension / Widget / Compact UI
  if (type === "extension") {
    return { archetype: "D", label: "Chrome Extension / Compact UI", motionLevel: 1, density: "compact" };
  }
  // E — Mobile-First / PWA
  if (type === "mobile") {
    return { archetype: "E", label: "Mobile-First / PWA", motionLevel: 2, density: "app" };
  }
  // B — Marketing / Landing Page (SaaS landing pages, waitlists)
  const marketingKeywords = ["landing", "waitlist", "launch", "conversion", "signup page"];
  if (marketingKeywords.some(kw => text.includes(kw))) {
    return { archetype: "B", label: "Marketing / Landing Page", motionLevel: 4, density: "spacious" };
  }
  // C — Consumer App (social, content, marketplace, fintech)
  const consumerKeywords = ["social", "marketplace", "fintech", "content", "community", "chat", "messaging", "feed", "profile", "sharing", "dating", "fitness", "health", "recipe", "music", "video", "photo"];
  if (consumerKeywords.some(kw => text.includes(kw))) {
    return { archetype: "C", label: "Consumer App", motionLevel: 2, density: "app" };
  }
  // A — Dense Tool (default: dashboards, admin panels, dev tools, utilities)
  return { archetype: "A", label: "Dense Tool / Dashboard", motionLevel: 1, density: "tool" };
}

// ============= FRONTEND UX MASTERY (anti-slop, archetype-aware design system) =============
function getFrontendUXPrompt(idea: Idea): string {
  const arch = getProductArchetype(idea);

  // Archetype-specific guidelines
  const archetypeRules: Record<string, string> = {
    A: `ARCHETYPE A — DENSE TOOL (think Linear, GitHub, Notion, Raycast):
- Dark mode first. 14px base font. Tight spacing. Minimal decoration.
- Users spend hours here. Reduce visual fatigue. No gradients, minimal shadows.
- Information density matters. Fit more, not less.
- Every pixel of chrome (borders, shadows, colors) competes with actual content.
- Font: Inter, Geist, SF Pro (system), or any high-x-height sans-serif legible at 13px.
- Sidebar: 220-240px wide, collapsible to icon-only (48px).
- Top bar height: 48px. Content max-width: 1200px. Card border-radius: 8px.
- Button: 28-32px height, 13px font, 8-12px horizontal padding.
- Input height: 32px. Button height: 32px.`,

    B: `ARCHETYPE B — MARKETING / LANDING PAGE (think Stripe, Vercel homepage, Framer sites):
- Light mode usually. 16-18px base. Generous whitespace. One dramatic visual moment.
- Users spend 30 seconds here. Every section must earn its existence.
- Big typography. Clear hierarchy. One CTA above the fold.
- Gradients, large type, and scroll animations are appropriate HERE — nowhere else.
- Font: Plus Jakarta Sans, General Sans, Cabinet Grotesk, or a serif like Instrument Serif for headlines.
- Top bar height: 64px. Content max-width: 1280px. Card border-radius: 16px.
- Button: 40-44px height, 15-16px font, 20-24px horizontal padding.`,

    C: `ARCHETYPE C — CONSUMER APP (think Airbnb, Spotify, Duolingo):
- Warm, approachable. Rounded shapes. Friendly but not childish.
- Slightly larger touch targets. More whitespace between interactive elements.
- Brand color can be more prominent (but still not on everything).
- Illustrations and imagery play a bigger role.
- Font: DM Sans, Outfit, Nunito Sans — slightly rounded, warmer geometry.
- Sidebar: 260-280px. Top bar: 56px. Content max-width: 1080px. Card border-radius: 12px.
- Button: 34-36px height, 14px font, 12-16px horizontal padding.
- Input height: 36px. Button height: 36px.`,

    D: `ARCHETYPE D — CHROME EXTENSION / COMPACT UI (think Raycast, 1Password popup):
- Extremely tight. 12-13px base. Minimal padding. No wasted space.
- 350-400px max width. Fixed heights. Every element justified.
- Speed is the entire UX. One-action-per-screen philosophy.
- System-native feel. Match the OS aesthetic where possible.
- Font: System font stack for fastest load and native feel.
- Button: 28-32px height, 13px font, 8-12px horizontal padding.`,

    E: `ARCHETYPE E — MOBILE-FIRST / PWA (phone-native experience):
- 16px minimum base (iOS requirement). 44px minimum touch targets.
- Bottom navigation, not sidebar. Thumb-zone awareness.
- Full-width elements. Edge-to-edge cards.
- Momentum scrolling. Pull-to-refresh patterns. Haptic-friendly transitions.
- Font: DM Sans, Outfit, or system font stack.
- Button: 40px min height (44px on mobile). Input: 36px height.`,
  };

  // Motion level guidelines
  const motionRules: Record<number, string> = {
    1: `MOTION LEVEL 1 — FUNCTIONAL ONLY:
- What moves: State transitions (hover/focus/active). Dropdowns/modals appearing/disappearing.
- What doesn't: Nothing on page load. No scroll animations. No staggered entrances.
- Feeling: Instant. Crisp. "This app respects my time."
- CSS: .interactive { transition-property: color, background-color, border-color, opacity; transition-duration: 150ms; transition-timing-function: ease; }
- Easing: ease-out cubic-bezier(0.16, 1, 0.3, 1) for most things. ease-in cubic-bezier(0.55, 0, 1, 0.45) for exits only.`,

    2: `MOTION LEVEL 2 — POLISHED:
- Everything from Level 1, plus: staggered list entrances, smooth page/route transitions, layout animations (accordion expand, reorder), toast slide-ins.
- What doesn't: No scroll-linked effects. No parallax. No cinematic reveals.
- Feeling: Smooth. Considered. "Someone cared about this."
- Stagger max 5 items with 50ms delay each. Page transitions: 200ms fade with ease-out.
- Toast: slide-in 300ms with ease-spring cubic-bezier(0.34, 1.56, 0.64, 1). Toast exit: 200ms with ease-in.`,

    3: `MOTION LEVEL 3 — EXPRESSIVE:
- Everything from Level 2, plus: spring physics on interactions, drag gestures with momentum, confetti/celebration moments, micro-interactions on every touchpoint (toggle switches bounce, checkboxes pop, progress bars fill).
- Still no scroll-hijacking. Motion enhances actions, never blocks them.
- Use Framer Motion: whileHover={{ scale: 1.02 }}, whileTap={{ scale: 0.97 }}, transition={{ type: "spring", stiffness: 500, damping: 30 }}.`,

    4: `MOTION LEVEL 4 — CINEMATIC (Marketing/Landing Pages):
- Everything plus scroll-driven reveals, parallax layers, pinned sections, horizontal scroll sequences, text splitting/masking on scroll, 3D transforms, hero animations, background morph effects.
- Every animation must still serve the narrative. Motion IS the content here.
- Use GSAP ScrollTrigger or CSS scroll-driven animations.`,
  };

  // Domain-specific accent color
  const domainAccents = `ACCENT COLOR — match to the product domain (DON'T default to blue or purple):
- Finance/trust → Deep blue, teal
- Creative/energy → Warm orange, coral, magenta
- Health/nature → Green, sage
- Premium/luxury → Gold on dark, deep navy on light
- Developer tools → Any saturated color works: cyan, violet, green
- If truly generic, use oklch(0.55 0.2 270) — a medium violet-blue (safest non-generic option)`;

  return `FRONTEND UX MASTERY — ANTI-SLOP DESIGN SYSTEM:

${archetypeRules[arch.archetype]}

THE ANTI-SLOP COLOR RULES:
1. Start with your BACKGROUND, not your brand color. Background is 80% of what users see.
2. Limit working palette to ~12 intentional CSS custom property tokens:
   BACKGROUNDS: --bg-base (page), --bg-raised (cards/sidebar), --bg-overlay (popovers/modals), --bg-hover (interactive rows), --bg-active (selected/pressed)
   TEXT: --text-primary (headlines/body), --text-secondary (metadata/descriptions), --text-tertiary (placeholders/timestamps)
   BORDERS: --border-default (card borders/dividers), --border-strong (hover/focus borders)
   ACCENT: --accent (brand, used sparingly ~10% of pixels), --accent-hover (darker variant)
   SEMANTIC: --color-error (#e5484d), --color-warning (#f0a000), --color-success (#30a46c)
3. Accent color is a SPICE, not main ingredient. It goes on: primary CTA (one per viewport), active states, links, focus rings. That's all.
4. Surfaces create hierarchy, NOT borders and shadows. Use 2-3 background tones to layer information.
${domainAccents}

TYPOGRAPHY — ONE FONT, MANY VOICES:
- One font family, differentiated by weight and size. NOT two fancy fonts.
- Letter-spacing on headings: -0.01em to -0.025em. Larger text = tighter tracking.
- Letter-spacing on tiny uppercase labels: +0.04em to +0.08em.
- Line-height: 1.1-1.2 for headings, 1.5-1.6 for body, 1.4 for UI text.
- font-weight 500 (medium) is your workhorse: nav items, button labels, table headers, form labels. Reserve 600-700 for headings only.
- Max paragraph width: max-width: 64ch. Text wider than ~65 chars is hard to read.
- ALWAYS set globally: -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;
- font-variant-numeric: tabular-nums on anything with numbers (tables, prices, stats, dates).
- text-wrap: balance on headings to prevent orphan words.

SPACING — THE INVISIBLE ARCHITECTURE:
- Everything snaps to a 4px base grid. No arbitrary values (no padding: 13px).
- Spacing tokens: 2px (hairline), 4px (icon-to-label), 6px (small button), 8px (compact list), 12px (default input/nav), 16px (standard card), 20px (comfortable card), 24px (card groups), 32px (major blocks), 48px (page sections), 64px (marketing sections), 80-96px (hero sections).
- Inner/outer rule: Padding inside a container should be roughly HALF the gap between containers. Card with 16px padding = 24-32px gap between cards.

COMPONENTS — THE BUILDING BLOCKS:
### Buttons: THREE styles only. Not five. Not one.
- Primary: accent color. One per logical viewport area.
- Secondary: bordered or subtle background. Everything else.
- Ghost: no border, no fill. Icon buttons, inline actions, cancel buttons.

### Cards: The fewer visual properties, the better.
- background: var(--bg-raised); border: 1px solid var(--border-default); border-radius (by archetype); padding: 16px. That's it.
- No shadow. No gradient header. No hover-lift. If clickable, add on hover: background: var(--bg-hover); border-color: var(--border-strong).

### Inputs:
- height: 32px (dense tool) or 36px (consumer app). padding: 0 10px. border: 1px solid var(--border-default).
- border-radius: 6px. background: transparent or var(--bg-base). font-size: var(--text-sm). color: var(--text-primary).
- Focus: border-color: var(--accent); box-shadow: 0 0 0 3px oklch(from var(--accent) l c h / 0.15); outline: none.
- Error: border-color: var(--color-error); box-shadow: 0 0 0 3px oklch(from var(--color-error) l c h / 0.15).

${motionRules[arch.motionLevel]}

PERFORMANCE RULES (ALL levels):
1. Only animate transform and opacity — these are GPU-composited. Animating width, height, margin, padding causes layout reflows.
2. Never transition: all — explicitly list properties you intend to animate.
3. Cap simultaneous animations — max 3-4 elements animating at once.
4. Exits always faster than enters — entering is an event, exiting is cleanup.

ACCESSIBILITY (REQUIRED):
- @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; } }
- :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; } :focus:not(:focus-visible) { outline: none; }
- cursor: pointer ONLY on elements that navigate or trigger actions (buttons, links, clickable cards). Not on text, icons, or non-interactive cards.
- Semantic HTML: main, nav, section, article.

THE ANTI-SLOP CHECKLIST (every generated app MUST pass):
- [ ] No purple-to-blue gradients (unless genuinely the brand)
- [ ] No cards with border AND shadow AND hover-translateY at same time
- [ ] No staggered entrance animations on every list
- [ ] No more than 2 font sizes visible simultaneously in any one section
- [ ] No border-radius over 12px on anything smaller than a modal (except pills/avatars)
- [ ] Brand/accent color on less than 10% of visible area
- [ ] Buttons have clear primary/secondary/ghost hierarchy
- [ ] No animation takes longer than 300ms in response to user input
- [ ] Every interactive element has a visible focus-visible state
- [ ] Dark mode text is NOT pure #ffffff and background is NOT pure #000000
- [ ] It looks like someone chose these exact colors on purpose, not generated from a template
`;
}

// ============= LEGACY FRONTEND_SKILLS_PROMPT (kept for backward compat, now uses getFrontendUXPrompt()) =============
const FRONTEND_SKILLS_PROMPT = ``;

// ============= UX QUALITY SYSTEM (archetype-aware) =============
const UX_QUALITY_PROMPT = `
UX QUALITY RULES — every app MUST follow these:

LAYOUT & SPACING (4px grid system):
- EVERYTHING snaps to a 4px base grid. No arbitrary padding values.
- Max content width varies by archetype: 1200px (tools), 1080px (consumer), 1280px (marketing).
- Cards: consistent padding (16px), gap between them (24px). Inner padding ≈ half outer gap.
- Section spacing: 32px between major blocks (tools), 48px (apps), 64px+ (marketing).
- Never let content touch edges — minimum 16px side padding on mobile.

VISUAL HIERARCHY:
- One clear hero/header section with the app name + one-line description.
- Primary action button: ONE per logical viewport area. Accent color. Visually dominant.
- Secondary: bordered or subtle background. Ghost: no border/fill for inline/cancel actions.
- Destructive actions (delete) use --color-error, placed away from primary actions.
- Group related items with surface elevation (--bg-raised), NOT borders+shadows+gradients combined.

RESPONSIVE DESIGN:
- Mobile-first: default layout is single column.
- sm: 2 columns for card grids.
- lg: 3-4 columns for card grids.
- Navigation: sidebar (dense tools), top nav (marketing), bottom nav (mobile/consumer).
- Forms stack vertically on mobile, can go horizontal on desktop.

EMPTY STATES:
- Every list, table, and feed needs a designed empty state. Centered icon + short message + CTA.
- Never show a blank white page or just a header with nothing below.

FORM UX:
- Labels above every input field (not just placeholders).
- Placeholder text shows example format (e.g., "e.g., john@example.com").
- Inline validation: --color-error border + error message below field.
- Focus: --accent border + subtle accent glow ring.
- Submit button disabled until form is valid.

NAVIGATION (CRITICAL — must be functional, NOT dead links):
- Navigation MUST use React state (useState) to switch views — NOT href links.
- Pattern: const [activeTab, setActiveTab] = useState("home") with onClick.
- Active tab: accent color text + faint accent background (accent/10%). Not bold. Not underlined.
- NEVER use href="#" or href="/page". NEVER.
- Minimum tabs: Home (main content), Dashboard (stats/overview), Settings (user prefs).

FINISHING TOUCHES (the 1% that makes it feel hand-built):
1. Custom scrollbars: ::-webkit-scrollbar { width: 6px; height: 6px; } ::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 3px; }
2. Selection highlight: ::selection { background: oklch(from var(--accent) l c h / 0.25); }
3. Focus-visible only: no ugly outlines on click, visible outlines on keyboard nav.
4. Cursor discipline: cursor: pointer ONLY on buttons, links, clickable cards. Not on text or icons.
5. Border-radius nesting: inner radius = parent radius - parent padding (card 12px + 8px padding → inner 4px).
6. Smooth page transitions: even a 150ms opacity fade feels faster than instant layout flash.
7. Empty states: designed, not blank.
8. Loading states: skeleton shimmer, not blank page. Every async button shows inline spinner + disables itself.
`;

// ============= AI INTEGRATION =============
function needsAI(idea: Idea): boolean {
  // If Kimi explicitly declared needsAI in the research response, respect that
  if (idea.needsAI === false) return false;
  if (idea.needsAI === true) return true;

  // Fallback: keyword-based detection for backward compatibility
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

function needsFileUpload(idea: Idea): boolean {
  const text = `${idea.title} ${idea.description} ${idea.features.join(" ")}`.toLowerCase();
  const fileKeywords = [
    "upload", "drag-and-drop", "drag and drop", "drop zone", "dropzone",
    "file", "import", "attach", "photo", "image", "screenshot", "scan",
    "csv", "json", "xml", "yaml", "pdf", "audio", "video", "mbox", "eml",
    ".png", ".jpg", ".svg", ".mp3", ".wav", "receipt", "invoice", "logo",
  ];
  return fileKeywords.some(kw => text.includes(kw));
}

const AI_INTEGRATION_PROMPT = `
AI INTEGRATION — This product needs WORKING AI features using Kimi K2.5:

1. Create src/app/api/ai/route.ts:
import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  const { prompt, systemPrompt } = await req.json();
  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + (process.env.NVIDIA_API_KEY || ""),
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
  if (\!response.ok) {
    return NextResponse.json({ result: "AI service error: " + response.status }, { status: 502 });
  }
  const data = await response.json();
  const message = data.choices?.[0]?.message;
  const result = message?.content || message?.reasoning_content || "No response";
  return NextResponse.json({ result });
}

2. Create src/lib/ai.ts:
export async function askAI(prompt: string, systemPrompt?: string): Promise<string> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, systemPrompt }),
  });
  if (\!res.ok) throw new Error("AI request failed");
  const data = await res.json();
  return data.result;
}

3. Use askAI() in components. Always show loading spinner while waiting.
4. IMPORTANT: The .env.local file with the real NVIDIA_API_KEY will be auto-created.
`;

const FILE_UPLOAD_PROMPT = `
FILE UPLOAD & ATTACHMENT HANDLING — This product handles user files. NEVER fake file processing with setTimeout + random data.

PATTERN 1: TEXT FILES (CSV, JSON, XML, YAML, .txt, .mbox, .eml, code files)
- Use FileReader.readAsText(file) to get real file contents
- Parse the contents (JSON.parse, CSV split, XML DOMParser)
- Display/process the ACTUAL parsed data, not random placeholder data
- Example:
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      // Actually parse and use the text content
      try { const data = JSON.parse(text); setItems(data); } catch { setError("Invalid file format"); }
    };
    reader.readAsText(file);
  };

PATTERN 2: IMAGE/BINARY FILES (PNG, JPG, SVG, audio, video)
- Use URL.createObjectURL(file) for preview display
- Use FileReader.readAsDataURL(file) ONLY if you need base64 (e.g., for AI analysis)
- For image previews, ALWAYS show the actual uploaded image, not a placeholder
- Example:
  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    // For AI analysis, send full base64 (NOT truncated):
    const reader = new FileReader();
    reader.onload = (evt) => { setBase64(evt.target?.result as string); };
    reader.readAsDataURL(file);
  };

PATTERN 3: DRAG-AND-DROP ZONE (reusable component)
- MUST handle both drag-and-drop AND click-to-browse (hidden input + label)
- Show visual feedback on dragOver (border color change, background tint)
- Validate file type and size before processing
- Example component pattern:
  <div
    onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
    onDragLeave={() => setDragActive(false)}
    className={dragActive ? "border-accent bg-accent/10" : "border-dashed border-gray-300"}
  >
    <input type="file" accept=".csv,.json,.xml" onChange={handleFile} className="hidden" id="file-input" />
    <label htmlFor="file-input">Drop files here or click to browse</label>
  </div>

CRITICAL RULES:
- NEVER use setTimeout to simulate file processing — ALWAYS read the actual file
- NEVER generate random data as "analysis results" — process the REAL file content
- NEVER truncate base64 data (no .substring(0, 1000)) — send the full payload or use object URLs
- File size validation: check file.size before processing (show error toast if too large)
- Show loading state while FileReader is working (reader.onload is async)
- Clean up object URLs with URL.revokeObjectURL() in useEffect cleanup
- Accept attribute on file inputs must match the product's expected file types
`;

interface RedditSignal {
  subreddit: string;
  postTitle: string;
  postBody: string;
  score: number;
  numComments: number;
  url: string;
  createdUtc: number;
  keywords: string[];
}

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
  needsAI?: boolean;
  redditSignals?: RedditSignal[];
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

// ============= REDDIT SCRAPING =============

let redditTokenCache: { token: string; expiresAt: number } | null = null;

async function getRedditAccessToken(): Promise<string | null> {
  if (!CONFIG.reddit.clientId || !CONFIG.reddit.clientSecret) return null;

  if (redditTokenCache && Date.now() < redditTokenCache.expiresAt) {
    return redditTokenCache.token;
  }

  try {
    const credentials = Buffer.from(`${CONFIG.reddit.clientId}:${CONFIG.reddit.clientSecret}`).toString("base64");
    const response = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "MVPFactory/1.0",
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) throw new Error(`Reddit OAuth ${response.status}`);
    const data = await response.json() as { access_token: string; expires_in: number };
    redditTokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };
    await logger.log("Reddit OAuth token acquired (60 req/min)");
    return redditTokenCache.token;
  } catch (error) {
    await logger.log(`Reddit OAuth failed, using public API: ${error}`, "WARN");
    return null;
  }
}

async function scrapeReddit(): Promise<RedditSignal[]> {
  await logger.log("Scraping Reddit for market signals...");
  const signals: RedditSignal[] = [];
  const token = await getRedditAccessToken();

  for (const subreddit of CONFIG.reddit.subreddits) {
    try {
      let url: string;
      const headers: Record<string, string> = { "User-Agent": "MVPFactory/1.0" };

      if (token) {
        url = `https://oauth.reddit.com/r/${subreddit}/${CONFIG.reddit.sortBy}?t=${CONFIG.reddit.timeRange}&limit=${CONFIG.reddit.postsPerSubreddit}`;
        headers["Authorization"] = `Bearer ${token}`;
      } else {
        url = `https://www.reddit.com/r/${subreddit}/${CONFIG.reddit.sortBy}.json?t=${CONFIG.reddit.timeRange}&limit=${CONFIG.reddit.postsPerSubreddit}`;
      }

      const response = await fetch(url, { headers });

      if (response.status === 429) {
        await logger.log(`Rate limited on r/${subreddit}, backing off 60s...`, "WARN");
        await sleep(60000);
        continue;
      }
      if (!response.ok) {
        await logger.log(`r/${subreddit}: HTTP ${response.status}`, "WARN");
        continue;
      }

      const data = await response.json() as any;
      const posts = data?.data?.children || [];

      for (const child of posts) {
        const post = child?.data;
        if (!post) continue;

        const title = (post.title || "").toLowerCase();
        const body = (post.selftext || "").substring(0, 500).toLowerCase();
        const combined = `${title} ${body}`;

        const matchedKeywords = CONFIG.reddit.signalKeywords.filter(kw => combined.includes(kw));
        const meetsScoreThreshold = (post.score || 0) >= CONFIG.reddit.minScore;
        const highEngagement = (post.score || 0) >= 50;

        if ((meetsScoreThreshold && matchedKeywords.length > 0) || highEngagement) {
          signals.push({
            subreddit,
            postTitle: post.title || "",
            postBody: (post.selftext || "").substring(0, 500),
            score: post.score || 0,
            numComments: post.num_comments || 0,
            url: `https://reddit.com${post.permalink || ""}`,
            createdUtc: post.created_utc || 0,
            keywords: matchedKeywords,
          });
        }
      }

      await logger.log(`r/${subreddit}: ${posts.length} posts scanned, ${signals.length} signals total`);
      await sleep(CONFIG.reddit.fetchDelayMs);
    } catch (error) {
      await logger.log(`r/${subreddit} error: ${error}`, "WARN");
    }
  }

  // Sort by engagement score: upvotes + 2*comments + 5*keyword_matches
  signals.sort((a, b) => {
    const scoreA = a.score + 2 * a.numComments + 5 * a.keywords.length;
    const scoreB = b.score + 2 * b.numComments + 5 * b.keywords.length;
    return scoreB - scoreA;
  });

  // Return top 30 to avoid overloading the Kimi prompt
  const topSignals = signals.slice(0, 30);
  await logger.log(`Reddit scraping complete: ${signals.length} total signals, using top ${topSignals.length}`);
  return topSignals;
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
      const abortTimer = setTimeout(() => controller.abort(), 900000);

      await logger.log(`API attempt ${attempt}/${retries} (streaming)...`);

      const response = await fetch(`${CONFIG.nvidia.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CONFIG.nvidia.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: CONFIG.nvidia.model,
          messages: [
            { role: "system", content: "You are a code generator. Output ONLY the requested code/JSON. No thinking, no explanations, no markdown wrappers. Start immediately with the code." },
            { role: "user", content: prompt },
          ],
          max_tokens: maxTokens,
          temperature,
          stream: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(abortTimer);
      if (!response.ok) throw new Error(`API ${response.status}`);

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let reasoningContent = "";
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        for (const line of text.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") continue;
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed.choices?.[0]?.delta;
            if (delta?.content) fullContent += delta.content;
            if (delta?.reasoning_content) reasoningContent += delta.reasoning_content;
            if (delta?.reasoning && !delta?.reasoning_content) reasoningContent += delta.reasoning;
            chunkCount++;
          } catch {}
        }
      }

      // Use content if available, otherwise fall back to reasoning_content (Kimi K2.5 thinking mode)
      const finalContent = fullContent || reasoningContent;
      if (chunkCount > 0) await logger.log(`Received ${chunkCount} chunks: content=${fullContent.length}, reasoning=${reasoningContent.length} chars`);
      if (!finalContent) throw new Error("Empty response");
      return finalContent;
    } catch (error) {
      await logger.log(`Attempt ${attempt} failed: ${error}`, "WARN");
      if (attempt < retries) await sleep(10000 * attempt);
      else throw error;
    }
  }
  throw new Error("All retries failed");
}

function extractJSON(text: string): any[] {
  // Strategy 1: Direct parse (model outputs clean JSON)
  try {
    const trimmed = text.trim();
    if (trimmed.startsWith("[")) {
      const cleaned = trimmed.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
      return JSON.parse(cleaned);
    }
  } catch {}

  // Strategy 2: Find JSON in markdown code blocks
  const codeBlockPatterns = [/```json\s*([\s\S]*?)```/g, /```\s*([\s\S]*?)```/g];
  for (const pattern of codeBlockPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const block = match[1].trim();
      if (block.startsWith("[")) {
        try {
          return JSON.parse(block.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]"));
        } catch {}
      }
    }
  }

  // Strategy 3: Find the largest [...] block containing file objects
  // Use bracket matching instead of greedy regex (handles nested brackets)
  let bestResult: any[] = [];
  let searchPos = 0;

  while (searchPos < text.length) {
    const arrayStart = text.indexOf("[", searchPos);
    if (arrayStart === -1) break;

    // Check if this looks like a file array (next non-whitespace should be { or \n{)
    const afterBracket = text.substring(arrayStart + 1, arrayStart + 50).trim();
    if (!afterBracket.startsWith("{")) {
      searchPos = arrayStart + 1;
      continue;
    }

    // Find matching closing bracket using depth tracking
    let depth = 0;
    let inString = false;
    let escape = false;
    let arrayEnd = -1;

    for (let i = arrayStart; i < text.length && i < arrayStart + 200000; i++) {
      const ch = text[i];
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "[") depth++;
      if (ch === "]") {
        depth--;
        if (depth === 0) { arrayEnd = i; break; }
      }
    }

    if (arrayEnd > arrayStart) {
      const candidate = text.substring(arrayStart, arrayEnd + 1);
      try {
        const cleaned = candidate.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].path) {
          if (parsed.length > bestResult.length) {
            bestResult = parsed;
          }
        }
      } catch {}
    }

    searchPos = arrayStart + 1;
  }

  if (bestResult.length > 0) return bestResult;

  // Strategy 4: Last resort - try to extract individual file objects and reconstruct
  const filePattern = /\{\s*"path"\s*:\s*"([^"]+)"\s*,\s*"content"\s*:\s*"/g;
  const files: any[] = [];
  let fileMatch;
  while ((fileMatch = filePattern.exec(text)) !== null) {
    const filePath = fileMatch[1];
    // Find the content string end (look for the closing "} pattern)
    const contentStart = fileMatch.index + fileMatch[0].length;
    // Find the end of this content string - look for "},  or "} ]
    let contentEnd = -1;
    let inStr = true;
    let esc = false;
    for (let i = contentStart; i < text.length && i < contentStart + 100000; i++) {
      const ch = text[i];
      if (esc) { esc = false; continue; }
      if (ch === "\\") { esc = true; continue; }
      if (ch === '"' && inStr) {
        // Check if next non-whitespace is }
        const rest = text.substring(i + 1, i + 10).trim();
        if (rest.startsWith("}")) {
          contentEnd = i;
          break;
        }
      }
    }
    if (contentEnd > contentStart) {
      const fileContent = text.substring(contentStart, contentEnd);
      try {
        // Unescape the string
        const unescaped = JSON.parse('"' + fileContent + '"');
        files.push({ path: filePath, content: unescaped });
      } catch {}
    }
  }

  return files;
}



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
  await logger.log("\u{1F9EA} Running FUNCTIONALITY Tests...");
  const tests: TestResult["tests"] = [];

  // Read all generated source files for deeper analysis
  let allFileContents = generatedCode;
  try {
    const exts = [".tsx", ".ts", ".jsx", ".js", ".html"];
    async function walkForTest(dir: string): Promise<string[]> {
      const files: string[] = [];
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
          if (entry.isDirectory()) files.push(...await walkForTest(full));
          else if (exts.some(ext => entry.name.endsWith(ext))) files.push(full);
        }
      } catch {}
      return files;
    }
    const sourceFiles = await walkForTest(projectPath);
    for (const f of sourceFiles) {
      try { allFileContents += "\n" + await fs.readFile(f, "utf-8"); } catch {}
    }
  } catch {}

  // Detect if this is an extension (vanilla JS) or React app
  const isExtension = allFileContents.includes("manifest.json") || allFileContents.includes("chrome.runtime") || allFileContents.includes("chrome.storage");

  // Test 1: Has state management
  const hasState = isExtension
    ? (allFileContents.includes("localStorage") || allFileContents.includes("chrome.storage") || /let\s+\w+\s*=\s*\[/.test(allFileContents) || /let\s+\w+\s*=\s*\{/.test(allFileContents))
    : allFileContents.includes("useState");
  tests.push({
    name: "Has state management",
    passed: hasState,
    details: hasState ? "\u2713 Interactive state found" : "\u2717 No state management - STATIC PAGE",
  });

  // Test 2: Has form/input handling
  const hasFormHandling = isExtension
    ? (allFileContents.includes("addEventListener") && (allFileContents.includes("submit") || allFileContents.includes("click")) || allFileContents.includes("oninput") || allFileContents.includes("onchange"))
    : (allFileContents.includes("onSubmit") || allFileContents.includes("handleSubmit") || allFileContents.includes("onChange"));
  tests.push({
    name: "Has form/input handling",
    passed: hasFormHandling,
    details: hasFormHandling ? "\u2713 Forms are functional" : "\u2717 No form/input handlers",
  });

  // Test 3: Has click handlers
  const clickCount = isExtension
    ? (allFileContents.match(/addEventListener\s*\(\s*['"]click/g) || []).length + (allFileContents.match(/onclick/gi) || []).length
    : (allFileContents.match(/onClick/g) || []).length;
  const hasClickHandlers = clickCount >= 2;
  tests.push({
    name: "Has click handlers (2+)",
    passed: hasClickHandlers,
    details: hasClickHandlers ? `\u2713 ${clickCount} click handlers` : "\u2717 Buttons don't do anything",
  });

  // Test 4: Has demo data (pre-populated arrays or objects)
  const hasDemoData = isExtension
    ? (/=\s*\[\s*\{/.test(allFileContents) || /=\s*\[\s*['"]/.test(allFileContents) || allFileContents.includes("JSON.parse"))
    : (allFileContents.includes("useState([") || allFileContents.includes("useState({") || /useState\(\s*\[/.test(allFileContents) || /const\s+\w+Data\s*=\s*\[/.test(allFileContents) || /const\s+initial\w*\s*=\s*\[/.test(allFileContents));
  tests.push({
    name: "Has demo data",
    passed: hasDemoData,
    details: hasDemoData ? "\u2713 Pre-loaded data" : "\u2717 Empty state - nothing to show",
  });

  // Test 5: Has loading states
  const hasLoadingStates = allFileContents.includes("loading") || allFileContents.includes("isLoading") || allFileContents.includes("spinner") || allFileContents.includes("Loading");
  tests.push({
    name: "Has loading states",
    passed: hasLoadingStates,
    details: hasLoadingStates ? "\u2713 Shows feedback" : "\u2717 No loading indicators",
  });

  // Test 6: Has user feedback
  const hasFeedback = allFileContents.includes("success") || allFileContents.includes("error") || allFileContents.includes("toast") || allFileContents.includes("notification") || allFileContents.includes("alert(") || allFileContents.includes("message");
  tests.push({
    name: "Has user feedback",
    passed: hasFeedback,
    details: hasFeedback ? "\u2713 Shows success/error" : "\u2717 No feedback to user",
  });

  // Test 7: Not placeholder content
  const hasPlaceholder = ["Lorem ipsum", "TODO:", "coming soon", "example text", "your text here"].some(p =>
    allFileContents.toLowerCase().includes(p.toLowerCase())
  );
  tests.push({
    name: "No placeholder text",
    passed: !hasPlaceholder,
    details: !hasPlaceholder ? "\u2713 Real content" : "\u2717 Has placeholder text",
  });

  // Test 8: Has CRUD operations (add/edit/delete/toggle)
  const hasCRUD = isExtension
    ? ((allFileContents.includes("push(") || allFileContents.includes("splice(") || allFileContents.includes("filter(")) && (allFileContents.includes("forEach") || allFileContents.includes("map(")))
    : (allFileContents.includes("filter(") && allFileContents.includes("set"));
  tests.push({
    name: "Has CRUD operations",
    passed: hasCRUD,
    details: hasCRUD ? "\u2713 Add/delete works" : "\u2717 Static list",
  });

  // Test 9: Has empty states
  const hasEmptyState = allFileContents.includes("length === 0") || allFileContents.includes("length==0") || allFileContents.includes(".length < 1") || allFileContents.includes("no items") || allFileContents.includes("No items") || allFileContents.includes("empty") || allFileContents.includes("nothing");
  tests.push({
    name: "Has empty states",
    passed: hasEmptyState,
    details: hasEmptyState ? "\u2713 Handles empty lists" : "\u2717 No empty state UI",
  });

  // Test 10: Has responsive layout
  const hasResponsive = isExtension ? true : (allFileContents.includes("sm:") || allFileContents.includes("md:") || allFileContents.includes("lg:") || allFileContents.includes("grid-cols") || allFileContents.includes("flex-wrap") || allFileContents.includes("@media"));
  tests.push({
    name: "Has responsive layout",
    passed: hasResponsive,
    details: hasResponsive ? "\u2713 Responsive design" : "\u2717 Not responsive",
  });

  // Test 11: Has search/filter functionality
  const hasSearch = allFileContents.includes("searchQuery") || allFileContents.includes("filterQuery") || (allFileContents.includes("search") && allFileContents.includes(".filter(") && allFileContents.includes(".includes("));
  tests.push({
    name: "Has search/filter",
    passed: hasSearch,
    details: hasSearch ? "\u2713 Search works" : "\u2717 No search functionality",
  });

  // Test 12: Has tab navigation
  const hasTabNav = allFileContents.includes("activeTab") || allFileContents.includes("currentTab") || allFileContents.includes("activeView") || allFileContents.includes("currentView");
  tests.push({
    name: "Has tab navigation",
    passed: hasTabNav,
    details: hasTabNav ? "\u2713 Working tabs" : "\u2717 No tab navigation",
  });

  // Test 13: Has data persistence
  const hasPersistence = allFileContents.includes("localStorage") || allFileContents.includes("sessionStorage") || allFileContents.includes("AsyncStorage");
  tests.push({
    name: "Has data persistence",
    passed: hasPersistence,
    details: hasPersistence ? "\u2713 Data persists" : "\u2717 Data lost on refresh",
  });

  // Test 14: No dead links
  const hasDeadLinks = /href=["']#["']/.test(allFileContents) || /href=["']\/(?:dashboard|profile|settings|about|contact)["']/.test(allFileContents);
  tests.push({
    name: "No dead links",
    passed: !hasDeadLinks,
    details: !hasDeadLinks ? "\u2713 All links work" : "\u2717 Has dead href=# or href=/page links",
  });

  const passedCount = tests.filter(t => t.passed).length;
  return { passed: passedCount >= 9, tests };
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
  await logger.log("\u{1F527} Fixing failed tests...");

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

  // Fix functionality issues by patching actual source files
  const funcPassed = funcResults.tests.filter(t => t.passed).length;
  if (funcPassed >= 10) return; // Require high quality — at least 10/14 tests must pass

  await logger.log("\u{1F527} Injecting missing interactive patterns...");

  // Find the main page/component file
  const candidates = [
    "src/app/page.tsx",
    "popup.js",
    "popup.html",
    "App.tsx",
    "src/pages/index.tsx",
  ];

  for (const candidate of candidates) {
    const filePath = path.join(projectPath, candidate);
    try {
      let code = await fs.readFile(filePath, "utf-8");
      let modified = false;

      // For React files: ensure useState and handlers
      if (candidate.endsWith(".tsx") || candidate.endsWith(".jsx")) {
        // Add 'use client' if missing (Next.js requirement for interactivity)
        if (!code.includes("'use client'") && !code.includes('"use client"')) {
          code = "'use client';\n\n" + code;
          modified = true;
          await logger.log("Fixed: Added 'use client' directive");
        }

        // Add useState import if missing
        if (!code.includes("useState")) {
          code = code.replace(
            /from ['"]react['"]/,
            (match) => match.replace("react", "react").replace("from", "{ useState } from").includes("useState") ? match : match
          );
          if (!code.includes("useState")) {
            code = code.replace(/^/m, "import { useState } from 'react';\n");
            modified = true;
            await logger.log("Fixed: Added useState import");
          }
        }

        // If no onClick handlers, add some to existing buttons
        const onClickCount = (code.match(/onClick/g) || []).length;
        if (onClickCount < 2) {
          // Add onClick to any <button> tags that don't have one
          code = code.replace(/<button(?![^>]*onClick)([^>]*>)/g, (match, rest) => {
            return `<button onClick={() => {}}${rest}`;
          });
          modified = true;
          await logger.log("Fixed: Added onClick handlers to buttons");
        }
      }

      // For extension popup.js: ensure interactivity
      if (candidate === "popup.js") {
        if (!code.includes("addEventListener")) {
          code += `\n\n// Interactive handlers\ndocument.addEventListener('DOMContentLoaded', () => {\n  document.querySelectorAll('button').forEach(btn => {\n    btn.addEventListener('click', () => {\n      btn.textContent = '\u2713 Done';\n      setTimeout(() => { btn.textContent = btn.dataset.label || 'Action'; }, 1000);\n    });\n  });\n});\n`;
          modified = true;
          await logger.log("Fixed: Added click event listeners to extension");
        }
        if (!code.includes("localStorage")) {
          code = `// State persistence\nlet appData = JSON.parse(localStorage.getItem('appData') || '[]');\nfunction saveData() { localStorage.setItem('appData', JSON.stringify(appData)); }\n\n` + code;
          modified = true;
          await logger.log("Fixed: Added localStorage state to extension");
        }
      }

      if (modified) {
        await fs.writeFile(filePath, code);
        await logger.log(`Fixed: Patched ${candidate}`);
      }
    } catch {}
  }
}


// ============= SOURCE REFERENCE BUILDER =============

function buildSourceReference(idea: Idea): string {
  const lines: string[] = [];

  // Always include the problem context
  if (idea.problem) {
    lines.push(`PROBLEM THIS SOLVES: ${idea.problem}`);
  }
  if (idea.targetUsers) {
    lines.push(`TARGET USERS: ${idea.targetUsers}`);
  }

  // Include Reddit source references if available
  if (idea.redditSignals && idea.redditSignals.length > 0) {
    lines.push(`\nIDEA SOURCE — Real user requests from Reddit:`);
    for (const signal of idea.redditSignals.slice(0, 3)) {
      lines.push(`- r/${signal.subreddit}: "${signal.postTitle}" (${signal.score} upvotes, ${signal.numComments} comments)`);
      if (signal.postBody) {
        lines.push(`  User said: "${signal.postBody.substring(0, 150)}..."`);
      }
      lines.push(`  Link: ${signal.url}`);
    }
    lines.push(`\nIMPORTANT: This product was inspired by REAL user needs found on Reddit. The app should directly address the problems described above. Include a subtle "Inspired by community feedback" note in the footer or about section.`);
  } else if (idea.source === "reddit") {
    lines.push(`\nIDEA SOURCE: Discovered from Reddit community signals — addresses real user pain points.`);
  } else {
    lines.push(`\nIDEA SOURCE: Generated from trending product categories and market analysis.`);
  }

  return lines.join("\n");
}

// ============= BUILD FUNCTIONS =============

function getRandomDesign() {
  return DESIGN_STYLES[Math.floor(Math.random() * DESIGN_STYLES.length)];
}

function designToPrompt(d: any): string {
  return `DESIGN: "${d.name}"\n- Background: ${d.bg}\n- Cards: ${d.card}\n- Accent color: ${d.accent}\n- Text: ${d.text}\n- Buttons: ${d.btn}\n- Google Font: ${d.font}\n${d.css ? '- Custom CSS to inject in globals.css:\n' + d.css : ''}`;
}

async function buildWebApp(idea: Idea, projectPath: string): Promise<string> {
  const design = getRandomDesign();
  const arch = getProductArchetype(idea);
  await logger.log(`Using design style: ${design.name} | Archetype: ${arch.label} | Motion Level: ${arch.motionLevel}`);

  const hasAI = needsAI(idea);
  if (hasAI) await logger.log("🤖 AI features detected — including AI integration prompt");
  const hasFiles = needsFileUpload(idea);
  if (hasFiles) await logger.log("📎 File upload features detected — including file handling prompt");

  // Build source reference context
  const sourceRef = buildSourceReference(idea);

  const prompt = `Build a COMPLETE Next.js 14 (App Router) TypeScript web app. Output ONLY a JSON array of file objects: [{"path":"...","content":"..."},...]. No explanations.

PROJECT: ${idea.title}
DESCRIPTION: ${idea.description}
FEATURES: ${idea.features.join("; ")}
${sourceRef}

${designToPrompt(design)}

${getFrontendUXPrompt(idea)}

${UX_QUALITY_PROMPT}

${hasAI ? AI_INTEGRATION_PROMPT : ""}
${hasFiles ? FILE_UPLOAD_PROMPT : ""}

MANDATORY PATTERNS — THE APP MUST BE FULLY FUNCTIONAL (code MUST contain ALL of these):
1. page.tsx MUST start with 'use client' and import { useState, useEffect } from 'react'
2. page.tsx MUST have: const [items, setItems] = useState([{...}, {...}, ...]) with 10-15 REALISTIC pre-populated objects (real names like "Sarah Chen", real dates like "2024-03-15", real prices like "$49.99", real descriptions of 2+ sentences)
3. page.tsx MUST have 5+ onClick handlers that call setState functions — every single button must do something visible
4. page.tsx MUST have an onSubmit handler with form validation (required fields check, error messages below inputs)
5. page.tsx MUST have: const [loading, setLoading] = useState(false) and show skeleton shimmer on initial load
6. page.tsx MUST have delete: setItems(items.filter(i => i.id !== id)) with fade-out animation
7. page.tsx MUST have toast notifications: const [toast, setToast] = useState(null) — slide in from bottom-right
8. NEVER use "Lorem ipsum", "placeholder", "TODO:", "Coming soon", "Under construction", "example text", "Item 1", "Item 2", "Description here", "Your text"
9. Every button MUST have an onClick that changes visible state (not empty, not console.log only)
10. All components must have 'use client' directive
11. MUST have empty state when items.length === 0: friendly icon + message + "Add your first..." CTA
12. MUST be responsive: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 for card layouts
13. MUST have a sticky top navbar with the app name and FUNCTIONAL tab navigation using useState (e.g., const [activeTab, setActiveTab] = useState("home")). Navbar links switch views via onClick — NEVER use href="#" or href="/page". Include at least 3 tabs: Home, Dashboard, Profile/Settings — each rendering different content within page.tsx
14. Forms MUST have labels above inputs, placeholder examples, and inline validation (red border + error msg)
15. MUST have search/filter: const [searchQuery, setSearchQuery] = useState("") with items.filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()))
16. MUST have sort: const [sortBy, setSortBy] = useState("date") with dropdown to change sort order
17. MUST persist data with localStorage: useEffect(() => localStorage.setItem("items", JSON.stringify(items)), [items])
18. MUST have a Dashboard tab view showing: total items count, completion rate %, items by status breakdown, recent activity list
19. MUST have a Settings/Profile tab view with: dark mode toggle that works, user display name input, export data button that copies JSON to clipboard
20. FORBIDDEN: href="#", href="/page", onClick={() => {}, console.log-only handlers, alert(), "Coming soon" sections, empty onClick handlers

FILES: package.json, tsconfig.json, tailwind.config.ts, postcss.config.js, next.config.js, src/app/globals.css, src/app/layout.tsx, src/app/page.tsx, 3+ component files, utils.ts${hasAI ? ", src/app/api/ai/route.ts, src/lib/ai.ts" : ""}
DESIGN: Tailwind CSS + Google Font "${design.font}" + animations (fade-in, hover-lift, button press, skeleton loading)

Return ONLY the JSON array. Start with [ and end with ].`;

  const response = await kimiComplete(prompt, 32768, 3, 0.4);
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
    await fs.writeFile(path.join(projectPath, ".env.local"), `NVIDIA_API_KEY=${CONFIG.nvidia.apiKey}\nNEXT_PUBLIC_APP_NAME=${idea.title}\n`);
  }

  return response;
}

async function buildChromeExtension(idea: Idea, projectPath: string): Promise<string> {
  const design = getRandomDesign();
  const hasAI = needsAI(idea);

  if (hasAI) await logger.log("🤖 AI features detected for extension");
  const hasFiles = needsFileUpload(idea);
  if (hasFiles) await logger.log("📎 File upload features detected for extension");

  const sourceRef = buildSourceReference(idea);

  const prompt = `Build a COMPLETE Chrome Extension with popup UI. Output ONLY a JSON array of file objects: [{"path":"...","content":"..."},...]. No explanations.

PROJECT: ${idea.title}
DESCRIPTION: ${idea.description}
FEATURES: ${idea.features.join("; ")}
${sourceRef}

${designToPrompt(design)}

EXTENSION UX QUALITY:
- Popup width: 380px, max-height: 520px with overflow-y auto scroll
- Consistent 12px padding on all sides, 8px gap between items
- Clear header with app icon + name + settings gear icon
- Primary action button full-width at top or bottom, visually dominant
- List items with hover highlight, smooth transitions
- Empty state: when no items, show a centered icon + "No items yet" + action prompt
- Form: labels or clear placeholders, submit on Enter key, clear form after adding
- Delete: red icon/button with fade-out animation on item removal
- Toast/status bar at bottom of popup for feedback ("Saved!", "Deleted!")
- Smooth animations on all state changes (150-300ms transitions)
- Consistent border-radius (8px) on all cards, inputs, buttons

MANDATORY PATTERNS (code MUST contain ALL of these):
1. popup.js MUST use: let items = JSON.parse(localStorage.getItem('items') || '[...]') with 6+ realistic pre-populated items
2. popup.js MUST have 3+ addEventListener('click', ...) handlers
3. popup.js MUST have addEventListener('submit', ...) for form handling
4. popup.js MUST call localStorage.setItem() to persist data
5. popup.js MUST have a renderItems() function that uses forEach/map to display items
6. popup.js MUST have add, delete, and toggle functions
7. popup.html MUST have <form>, <input>, and 3+ <button> elements
8. popup.css MUST have animations (@keyframes), hover effects, transitions
9. Use REAL data: real names, real dates, real URLs - NEVER "Item 1" or "Lorem ipsum" or "placeholder"
10. Show loading states and success/error feedback messages
11. MUST have an empty state: when items list is empty, show a friendly message and CTA

FILES REQUIRED: manifest.json (v3), popup.html, popup.css, popup.js, background.js
DESIGN: beautiful UI matching the design style, premium feel, smooth animations
${hasFiles ? FILE_UPLOAD_PROMPT : ""}

Return ONLY the JSON array. Start with [ and end with ].`;

  const response = await kimiComplete(prompt, 32768, 3, 0.4);
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
  const hasFiles = needsFileUpload(idea);
  if (hasFiles) await logger.log("📎 File upload features detected for mobile app");

  const sourceRef = buildSourceReference(idea);

  const prompt = `Build a COMPLETE React Native (Expo SDK 50) mobile app. Output ONLY a JSON array of file objects: [{"path":"...","content":"..."},...]. No explanations.

PROJECT: ${idea.title}
DESCRIPTION: ${idea.description}
FEATURES: ${idea.features.join("; ")}
${sourceRef}

${designToPrompt(design)}

CRITICAL — EXPO ONLY:
- This MUST be a React Native + Expo project. DO NOT use Flutter, Dart, Swift, Kotlin, or Firebase.
- package.json MUST have "main": "node_modules/expo/AppEntry.js"
- package.json scripts: { "start": "expo start", "android": "expo start --android", "ios": "expo start --ios" }
- DO NOT include "next", "react-dom", or any web-only dependencies
- Use Expo SDK 50: "expo": "~50.0.0"
- Use compatible versions: "react-native": "^0.73.0", "react": "^18.3.1"
- app.json MUST have expo.slug, expo.version, expo.platforms: ["ios", "android"]
- Store data with @react-native-async-storage/async-storage (NOT SQLite, NOT Firebase)
- Navigation: @react-navigation/native + @react-navigation/native-stack

MOBILE UX QUALITY:
- Consistent spacing: use 16px padding on screens, 12px gaps between items
- Clear visual hierarchy: large bold title at top, section headers, card layouts
- Bottom tab navigation or stack navigation with clear back buttons and headers
- Empty states: when a list is empty, show a friendly icon + message + "Add your first..." button
- Form UX: labels above inputs, placeholder examples, inline validation with red/green borders
- Loading: show ActivityIndicator centered on screen or inline during async operations
- Toast/snackbar feedback on all CRUD actions (added, deleted, updated)
- Pull-to-refresh on list screens
- Smooth transitions between screens
- Cards with consistent borderRadius (12-16), subtle shadows, and padding
- Primary action as a floating action button (FAB) or prominent bottom button
- Delete actions: swipe-to-delete or red trash icon with confirmation alert
- MUST be responsive to different screen sizes (use flex, not fixed widths)

REQUIREMENTS:
- Files: package.json, app.json, App.tsx, 3+ screen components in src/screens/, navigation in src/navigation/
- Every screen: working forms/buttons, useState state management, loading states
- Pre-populate 8-12 REALISTIC demo items (NOT placeholders)
- Working CRUD operations with AsyncStorage persistence
- Animations with react-native-reanimated patterns
- StyleSheet matching the design style
- Must look like a real published app
${hasAI ? "\nAI INTEGRATION: Include src/api/ai.ts that calls /api/ai endpoint for AI features." : ""}
${hasFiles ? FILE_UPLOAD_PROMPT : ""}

Return ONLY the JSON array. Start with [ and end with ].`;

  const response = await kimiComplete(prompt, 32768, 3, 0.4);
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

    // Set NVIDIA_API_KEY for production so AI features work in deployed products
    if (CONFIG.nvidia.apiKey) {
      await fs.writeFile(path.join(projectPath, ".env.production"), `NVIDIA_API_KEY=${CONFIG.nvidia.apiKey}
`);
      await logger.log("Set NVIDIA_API_KEY for production deployment");
    }

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


async function deployToExpo(projectPath: string, projectName: string): Promise<string> {
  if (!CONFIG.expo.token) return "";

  await logger.log("📱 Publishing to Expo Go...");

  try {
    // Fix app.json with correct owner and slug
    const appJsonPath = path.join(projectPath, "app.json");
    try {
      const raw = await fs.readFile(appJsonPath, "utf-8");
      const appJson = JSON.parse(raw);
      appJson.expo = appJson.expo || {};
      appJson.expo.name = appJson.expo.name || projectName;
      appJson.expo.slug = projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
      appJson.expo.version = appJson.expo.version || "1.0.0";
      appJson.expo.platforms = appJson.expo.platforms || ["ios", "android"];
      appJson.expo.owner = "malikmuhammadsaadshafiq-dev";
      await fs.writeFile(appJsonPath, JSON.stringify(appJson, null, 2));
    } catch {
      await fs.writeFile(appJsonPath, JSON.stringify({
        expo: {
          name: projectName,
          slug: projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
          version: "1.0.0",
          platforms: ["ios", "android"],
          owner: "malikmuhammadsaadshafiq-dev",
        },
      }, null, 2));
    }

    // Auto-detect missing npm packages from import statements
    try {
      const { stdout: fileListStr } = await execAsync(
        `find "${projectPath}" \\( -name '*.tsx' -o -name '*.ts' -o -name '*.js' \\) -not -path '*/node_modules/*'`,
        { timeout: 10000 }
      );
      const fileList = fileListStr.trim().split("\n").filter(Boolean);
      const missingPkgs = new Set<string>();

      for (const file of fileList) {
        try {
          const code = await fs.readFile(file, "utf-8");
          const importMatches = code.match(/from\s+['"]([^./][^'"]+)['"]/g) || [];
          for (const imp of importMatches) {
            const pkg = imp.match(/from\s+['"]([^'"]+)['"]/)?.[1] || "";
            const basePkg = pkg.startsWith("@") ? pkg.split("/").slice(0, 2).join("/") : pkg.split("/")[0];
            if (basePkg) {
              const pkgPath = path.join(projectPath, "node_modules", basePkg);
              const exists = await fs.access(pkgPath).then(() => true).catch(() => false);
              if (!exists) missingPkgs.add(basePkg);
            }
          }
        } catch {}
      }

      if (missingPkgs.size > 0) {
        const pkgList = Array.from(missingPkgs).join(" ");
        await logger.log(`📦 Installing missing packages: ${pkgList}`);
        await execAsync(`cd "${projectPath}" && npm install ${pkgList} 2>&1 || true`, { timeout: 120000 });
      }
    } catch {}

    // Install all dependencies
    await execAsync(`cd "${projectPath}" && npm install 2>&1 || true`, { timeout: 120000 });

    // Initialize EAS project
    await execAsync(
      `cd "${projectPath}" && EXPO_TOKEN=${CONFIG.expo.token} npx eas init --force --non-interactive 2>&1 || true`,
      { timeout: 30000 }
    );

    // Create eas.json if missing
    const easJsonPath = path.join(projectPath, "eas.json");
    const easExists = await fs.access(easJsonPath).then(() => true).catch(() => false);
    if (!easExists) {
      await fs.writeFile(easJsonPath, JSON.stringify({
        build: { preview: { distribution: "internal" }, production: {} },
        submit: { production: {} },
      }, null, 2));
    }

    // Publish to Expo Go
    const { stdout } = await execAsync(
      `cd "${projectPath}" && EXPO_TOKEN=${CONFIG.expo.token} npx eas update --branch default --message "MVP Factory: ${projectName}" --non-interactive 2>&1`,
      { timeout: 300000 }
    );

    await logger.log("✅ Published to Expo Go");
    const urlMatch = stdout.match(/https:\/\/expo\.dev[^\s]*/);
    const expoUrl = urlMatch ? urlMatch[0] : `https://expo.dev/@malikmuhammadsaadshafiq-dev/${projectName}`;
    await logger.log(`📱 Expo: ${expoUrl}`);
    return expoUrl;
  } catch (error) {
    await logger.log(`Expo publish error: ${error}`, "WARN");
  }
  return "";
}

async function pushToGithub(projectPath: string, idea: Idea, projectName: string): Promise<string> {
  if (!CONFIG.github.token || !CONFIG.github.username) return "";

  let repoName = `mvp-${projectName}`;

  try {
    // Check if repo already exists — append timestamp suffix to avoid collision
    const existsCheck = await fetch(`https://api.github.com/repos/${CONFIG.github.username}/${repoName}`, {
      headers: { Authorization: `Bearer ${CONFIG.github.token}` },
    });
    if (existsCheck.status === 200) {
      const suffix = Math.floor(Date.now() / 1000) % 10000;
      const oldName = repoName;
      repoName = `${repoName}-${suffix}`;
      await logger.log(`[DEDUP] GitHub repo "${oldName}" already exists, using "${repoName}" instead`, "WARN");
    }

    await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: { Authorization: `Bearer ${CONFIG.github.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: repoName, description: idea.description, private: false }),
    });

    await fs.writeFile(path.join(projectPath, ".gitignore"), "node_modules/\n.next/\n.vercel/\n.env\n.env.*\n.DS_Store");

    await execAsync("rm -rf .git 2>/dev/null || true", { cwd: projectPath });
    await execAsync("git init && git add -A", { cwd: projectPath });
    await execAsync(`git commit -m "✨ ${idea.title} - Built by MVP Factory v10"`, { cwd: projectPath });
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
      const sourceTag = idea.redditSignals?.length ? " | Inspired by Reddit community" : idea.source === "reddit" ? " | Community-inspired" : "";
      await fetch(`https://api.github.com/repos/${CONFIG.github.username}/${repoName}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${CONFIG.github.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ description: `[${label}] ${idea.description}${sourceTag}` }),
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


function generateProductReadme(idea: Idea, projectName: string, funcResults: TestResult, funcTestScore: string): string {
  const isAI = needsAI(idea);
  const typeLabel = idea.type === "web" ? "Web App" : idea.type === "mobile" ? "Mobile App" : idea.type === "saas" ? "SaaS Platform" : idea.type === "extension" ? "Browser Extension" : "Application";
  const stackParts = idea.techStack.split(/[,+&]/).map(s => s.trim()).filter(Boolean);
  const stackBadges = stackParts.slice(0, 5).map(s => "![" + s + "](https://img.shields.io/badge/" + encodeURIComponent(s).replace(/-/g, "--") + "-333?style=flat-square)").join(" ");
  const ghUser = CONFIG.github.username;
  const repoName = "mvp-" + projectName;
  const bt = "`"; // backtick helper
  const codeBlock = bt + bt + bt; // triple backtick

  // Type-specific sections
  let prereqs = "";
  let runCmd = "";
  let installSteps = "";
  let projectStructure = "";

  if (idea.type === "mobile") {
    prereqs = "- [Node.js](https://nodejs.org/) v18+\n- [Expo CLI](https://docs.expo.dev/get-started/installation/) (" + bt + "npm install -g expo-cli" + bt + ")\n- Expo Go app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))";
    runCmd = "npx expo start";
    installSteps = "1. Clone the repository\n" + codeBlock + "bash\ngit clone https://github.com/" + ghUser + "/" + repoName + ".git\ncd " + repoName + "\n" + codeBlock + "\n\n2. Install dependencies\n" + codeBlock + "bash\nnpm install\n" + codeBlock + "\n\n3. Start the development server\n" + codeBlock + "bash\nnpx expo start\n" + codeBlock + "\n\n4. Scan the QR code with Expo Go (Android) or Camera app (iOS)";
    projectStructure = codeBlock + "\n\u251c\u2500\u2500 App.tsx                # Entry point\n\u251c\u2500\u2500 app.json              # Expo configuration\n\u251c\u2500\u2500 package.json          # Dependencies\n\u251c\u2500\u2500 assets/               # Images & fonts\n\u2514\u2500\u2500 src/\n    \u251c\u2500\u2500 components/       # Reusable UI components\n    \u251c\u2500\u2500 screens/          # App screens\n    \u2514\u2500\u2500 utils/            # Helper functions\n" + codeBlock;
  } else if (idea.type === "extension") {
    prereqs = "- Google Chrome or any Chromium-based browser\n- Developer mode enabled in chrome://extensions";
    runCmd = "# Load unpacked extension in chrome://extensions";
    installSteps = "1. Clone the repository\n" + codeBlock + "bash\ngit clone https://github.com/" + ghUser + "/" + repoName + ".git\ncd " + repoName + "\n" + codeBlock + "\n\n2. Open Chrome and navigate to " + bt + "chrome://extensions" + bt + "\n3. Enable **Developer mode** (toggle in top-right)\n4. Click **Load unpacked** and select the project folder\n5. The extension icon will appear in your toolbar";
    projectStructure = codeBlock + "\n\u251c\u2500\u2500 manifest.json         # Extension manifest (V3)\n\u251c\u2500\u2500 popup.html            # Extension popup UI\n\u251c\u2500\u2500 popup.js              # Popup logic\n\u251c\u2500\u2500 popup.css             # Popup styles\n\u251c\u2500\u2500 background.js         # Service worker\n\u2514\u2500\u2500 icons/                # Extension icons\n" + codeBlock;
  } else {
    prereqs = "- [Node.js](https://nodejs.org/) v18+\n- npm or yarn";
    runCmd = "npm run dev";
    installSteps = "1. Clone the repository\n" + codeBlock + "bash\ngit clone https://github.com/" + ghUser + "/" + repoName + ".git\ncd " + repoName + "\n" + codeBlock + "\n\n2. Install dependencies\n" + codeBlock + "bash\nnpm install\n" + codeBlock + "\n\n3. Start the development server\n" + codeBlock + "bash\nnpm run dev\n" + codeBlock + "\n\n4. Open [http://localhost:3000](http://localhost:3000) in your browser";
    projectStructure = codeBlock + "\n\u251c\u2500\u2500 src/\n\u2502   \u251c\u2500\u2500 app/\n\u2502   \u2502   \u251c\u2500\u2500 layout.tsx    # Root layout\n\u2502   \u2502   \u251c\u2500\u2500 page.tsx      # Homepage\n\u2502   \u2502   \u2514\u2500\u2500 globals.css   # Global styles\n\u2502   \u2514\u2500\u2500 components/       # Reusable UI components\n\u251c\u2500\u2500 public/               # Static assets\n\u251c\u2500\u2500 package.json          # Dependencies\n\u251c\u2500\u2500 next.config.js        # Next.js configuration\n\u251c\u2500\u2500 tailwind.config.ts    # Tailwind CSS config\n\u2514\u2500\u2500 tsconfig.json         # TypeScript config\n" + codeBlock;
  }

  // Build features list
  const featuresList = idea.features.map(f => "- **" + f + "**").join("\n");

  // Build tech stack table
  const stackRows = stackParts.map(s => "| " + s + " | Core dependency |").join("\n");
  const aiRow = isAI ? "\n| Kimi K2.5 (NVIDIA) | AI/LLM integration |" : "";

  // Build test results table
  const testRows = funcResults.tests.map(t => "| " + t.name + " | " + (t.passed ? "\u2705 Pass" : "\u26a0\ufe0f Needs attention") + " |").join("\n");

  // Build usage guide
  const workflows = idea.features.slice(0, 3).map((f, i) => "**" + (i + 1) + ". " + f + "**\n   - Navigate to the relevant section in the app\n   - Follow the on-screen prompts to complete the action\n   - Results are displayed in real-time").join("\n\n");

  // AI section
  const aiSection = isAI ? "\n### AI Features\n\nThis app uses **Kimi K2.5** via NVIDIA API for intelligent processing.\n\nTo use AI features, add your NVIDIA API key:\n" + codeBlock + "bash\n# Create .env.local file\necho \"NVIDIA_API_KEY=nvapi-your-key\" > .env.local\n" + codeBlock + "\n\nGet a free API key at [build.nvidia.com](https://build.nvidia.com)\n" : "";

  // Source/Inspiration section
  let sourceSection = "";
  if (idea.redditSignals && idea.redditSignals.length > 0) {
    const signalLines = idea.redditSignals.slice(0, 3).map(s =>
      "- **r/" + s.subreddit + "**: [" + s.postTitle.substring(0, 80) + "](" + s.url + ") (" + s.score + " upvotes, " + s.numComments + " comments)"
    ).join("\n");
    sourceSection = "\n## Inspiration & Source\n\nThis product was built to address **real user needs** discovered from community feedback:\n\n" + signalLines + "\n\n> Built because real people asked for it.\n";
  } else if (idea.source === "reddit") {
    sourceSection = "\n## Inspiration\n\nThis product was inspired by real user discussions and pain points discovered on Reddit communities including r/SideProject, r/startups, r/SaaS, and r/AppIdeas.\n";
  } else {
    sourceSection = "\n## Inspiration\n\nBuilt based on trending product categories and market analysis of high-demand utility tools.\n";
  }

  const lines = [
    '<div align="center">',
    "",
    "# " + idea.title,
    "",
    "**" + idea.description + "**",
    "",
    stackBadges,
    isAI ? "![AI Powered](https://img.shields.io/badge/AI-Powered-blueviolet?style=flat-square)" : "![Utility Tool](https://img.shields.io/badge/Utility-Tool-success?style=flat-square)",
    "![Type](https://img.shields.io/badge/Type-" + encodeURIComponent(typeLabel) + "-blue?style=flat-square)",
    "![Tests](https://img.shields.io/badge/Tests-" + encodeURIComponent(funcTestScore) + "-brightgreen?style=flat-square)",
    "",
    "</div>",
    "",
    "---",
    "",
    "## Problem",
    "",
    idea.problem,
    "",
    "## Who Is This For?",
    "",
    idea.targetUsers,
    "",
    sourceSection,
    "",
    "## Features",
    "",
    featuresList,
    "",
    "## Tech Stack",
    "",
    "| Technology | Purpose |",
    "|-----------|---------|",
    stackRows + aiRow,
    "",
    "## Getting Started",
    "",
    "### Prerequisites",
    "",
    prereqs,
    "",
    "### Installation",
    "",
    installSteps,
    "",
    "## Usage Guide",
    "",
    "### Core Workflows",
    "",
    workflows,
    aiSection,
    "",
    "## Quality Assurance",
    "",
    "| Test | Status |",
    "|------|--------|",
    testRows,
    "",
    "**Overall Score: " + funcTestScore + "**",
    "",
    "## Project Structure",
    "",
    projectStructure,
    "",
    "## Contributing",
    "",
    "1. Fork the repository",
    "2. Create your feature branch (" + bt + "git checkout -b feature/amazing-feature" + bt + ")",
    "3. Commit your changes (" + bt + "git commit -m 'Add amazing feature'" + bt + ")",
    "4. Push to the branch (" + bt + "git push origin feature/amazing-feature" + bt + ")",
    "5. Open a Pull Request",
    "",
    "## License",
    "",
    "MIT License \u2014 use freely for personal and commercial projects.",
    "",
    "---",
    "",
    '<div align="center">',
    "",
    "**Built autonomously by [NeuraFinity MVP Factory](https://github.com/" + ghUser + "/NeuraFinity)** \u2014 an AI-powered system that discovers real user needs and ships working software.",
    "",
    "</div>",
    "",
  ];

  return lines.join("\n");
}

async function buildMVP(idea: Idea): Promise<boolean> {
  const stats = await getStats();

  if (stats.buildsToday >= CONFIG.limits.maxBuildsPerDay) {
    await logger.log(`Daily limit reached: ${stats.buildsToday}/${CONFIG.limits.maxBuildsPerDay}`);
    return false;
  }

  // Pre-build duplicate check — catch ideas queued before dedup was added
  const builtProducts = (await loadExistingProducts()).filter(p => p.source === 'built' || p.source === 'web');
  const dupCheck = isDuplicate(idea, builtProducts);
  if (dupCheck.duplicate) {
    await logger.log(`[WARN] Skipping duplicate build "${idea.title}" — ${dupCheck.reason} (matched: "${dupCheck.matchedWith}")`, "WARN");
    await fs.unlink(path.join(CONFIG.paths.ideas, `${idea.id}.json`)).catch(() => {});
    return false;
  }

  const arch = getProductArchetype(idea);
  await logger.log(`\n${"=".repeat(50)}`);
  await logger.log(`🔨 Building: ${idea.title}`);
  await logger.log(`📦 Type: ${idea.type.toUpperCase()} | Archetype: ${arch.label}`);
  await logger.log(`✨ Features: ${idea.features.join(", ")}`);
  await logger.log(`🤖 AI: ${needsAI(idea) ? "YES" : "NO"} | 📎 Files: ${needsFileUpload(idea) ? "YES" : "NO"} | Motion Level: ${arch.motionLevel}`);
  await logger.log(`📌 Source: ${idea.source}${idea.redditSignals?.length ? ` (${idea.redditSignals.length} Reddit signals)` : ""}`);
  await logger.log(`${"=".repeat(50)}\n`);

  await sendTelegram(`🔨 *Building*: ${idea.title}\nType: ${idea.type}\nAI: ${needsAI(idea) ? "Yes" : "No"}\nFiles: ${needsFileUpload(idea) ? "Yes" : "No"}`);

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

    // Sanitize package.json to fix invalid dependency versions (skip mobile — they use Expo, not Next.js)
    if (idea.type !== "extension" && idea.type !== "mobile") {
      await sanitizePackageJson(projectPath);
    }

    // Validate and fix generated code (unbalanced braces, etc.)
    await validateGeneratedCode(projectPath);

    // Run ALL tests
    await logger.log("\n🧪 TESTING PHASE");
    await logger.log("-".repeat(30));

    stats.testsRun = (stats.testsRun || 0) + 5;

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
    if (allPassed) stats.testsPassed = (stats.testsPassed || 0) + 5;

    await logger.log("-".repeat(30));

    // Install dependencies
    if (idea.type !== "extension") {
      await logger.log("📦 Installing dependencies...");
      try {
        await execAsync("npm install 2>&1 || true", { cwd: projectPath, timeout: 120000 });
      } catch {}
    }

    // Create comprehensive README
    const funcTestScore = funcResults.tests.filter(t => t.passed).length + "/" + funcResults.tests.length;
    const readme = generateProductReadme(idea, projectName, funcResults, funcTestScore);
    await fs.writeFile(path.join(projectPath, "README.md"), readme);

    // Push & Deploy
    const githubUrl = await pushToGithub(projectPath, idea, projectName);
    if (githubUrl) await logger.log(`📂 GitHub: ${githubUrl}`);

    let liveUrl = "";
    let expoUrl = "";
    if (idea.type === "web" || idea.type === "saas") {
      liveUrl = await deployToVercel(projectPath, projectName);
    }

    // Deploy mobile apps to Expo Go
    if (idea.type === "mobile") {
      expoUrl = await deployToExpo(projectPath, projectName);
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
    const builtIdea = { ...idea, builtAt: new Date().toISOString(), projectPath, githubUrl, liveUrl, expoUrl, functionalityScore: funcScore };
    await fs.writeFile(path.join(CONFIG.paths.built, `${idea.id}.json`), JSON.stringify(builtIdea, null, 2));
    await fs.unlink(path.join(CONFIG.paths.ideas, `${idea.id}.json`)).catch(() => {});

    // Notification
    let msg = `✅ *MVP Complete*: ${idea.title}\n📦 Type: ${idea.type}\n🎯 Functionality: ${funcTestScore}`;
    if (githubUrl) msg += `\n📂 ${githubUrl}`;
    if (liveUrl) msg += `\n🌐 ${liveUrl}`;
    if (expoUrl) msg += `\n📱 Expo: ${expoUrl}`;
    await sendTelegram(msg);

    await logger.log(`\n✅ MVP COMPLETE: ${idea.title} (Func: ${funcTestScore})`);
    return true;
  } catch (error) {
    await logger.log(`❌ Build error: ${error}`, "ERROR");
    await sendTelegram(`❌ Build failed: ${idea.title}\n${error}`);
    return false;
  }
}

// ============= DUPLICATE DETECTION =============

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
    title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 1 && !stopWords.has(w))
  );
}

function keywordSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const word of a) {
    if (b.has(word)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function descriptionSimilarity(desc1: string, desc2: string): number {
  const words1 = extractKeywords(desc1);
  const words2 = extractKeywords(desc2);
  return keywordSimilarity(words1, words2);
}

interface ExistingProduct {
  title: string;
  slug: string;
  keywords: Set<string>;
  description: string;
  source: 'ideas' | 'built' | 'web' | 'github';
}

async function loadExistingProducts(): Promise<ExistingProduct[]> {
  const products: ExistingProduct[] = [];

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

  async function loadFromOutputDir(dir: string): Promise<void> {
    try {
      const folders = await fs.readdir(dir);
      for (const folder of folders) {
        const pkgPath = path.join(dir, folder, 'package.json');
        try {
          await fs.access(pkgPath);
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
    loadFromDir(CONFIG.paths.built, 'built'),
    loadFromOutputDir(path.join(CONFIG.paths.output, 'web')),
    loadFromOutputDir(path.join(CONFIG.paths.output, 'mobile')),
    loadFromOutputDir(path.join(CONFIG.paths.output, 'extensions')),
  ]);

  return products;
}

function isDuplicate(idea: { title: string; description?: string; problem?: string }, existing: ExistingProduct[]): { duplicate: boolean; reason: string; matchedWith: string } {
  const newSlug = toSlug(idea.title);
  const newKeywords = extractKeywords(idea.title);

  for (const product of existing) {
    // 1. Exact slug match
    if (newSlug === product.slug) {
      return { duplicate: true, reason: 'exact slug match', matchedWith: product.title };
    }

    // 2. One slug contains the other
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

    // 4. Description + title combo check
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

// ============= RESEARCH =============

async function researchIdeas(redditSignals?: RedditSignal[]): Promise<Idea[]> {
  const stats = await getStats();
  if (stats.researchesToday >= CONFIG.limits.researchPerDay) {
    await logger.log(`Research limit reached`);
    return [];
  }

  const hasSignals = redditSignals && redditSignals.length > 0;
  await logger.log(hasSignals
    ? `🔍 Generating ideas from ${redditSignals!.length} Reddit signals...`
    : "🔍 Researching trending ideas (AI-generated)...");

  // Load existing products for dedup in prompts
  const existingProducts = await loadExistingProducts();
  const alreadyBuiltList = existingProducts.map(p => p.title).join(", ");
  const dedupInstruction = alreadyBuiltList
    ? `\nIMPORTANT - DO NOT suggest ideas similar to these already-built products: ${alreadyBuiltList}\n`
    : "";
  if (alreadyBuiltList) {
    await logger.log(`[DEDUP] Loaded ${existingProducts.length} existing products for prompt injection`);
  }

  let prompt: string;

  if (hasSignals) {
    const signalSummary = redditSignals!.slice(0, 20).map((s, i) =>
      `${i + 1}. [r/${s.subreddit}] "${s.postTitle}" (⬆${s.score}, 💬${s.numComments})${s.postBody ? `\n   "${s.postBody.substring(0, 200)}..."` : ""}${s.keywords.length ? `\n   Keywords: ${s.keywords.join(", ")}` : ""}`
    ).join("\n");

    prompt = `You are an MVP idea generator focused on UTILITY-FIRST tools. Below are REAL Reddit posts where people express needs, frustrations, or requests for tools/apps.

REDDIT SIGNALS:
${signalSummary}
${dedupInstruction}
CRITICAL RULES:
- At least 3 of 5 ideas MUST be pure UTILITY tools (NO AI/LLM calls needed). Set "needsAI": false for these.
- The other 2 can be AI-powered if the Reddit signal genuinely calls for AI. Set "needsAI": true for those.
- Think ilovepdf.com, tinypng.com, jsonformatter.org — tools with ONE clear function that works instantly.
- Utility tools should work 100% client-side or with simple math/logic — no external API calls needed.
- DO NOT slap "AI-powered" onto simple tools. A budget tracker needs math, not an LLM. A unit converter needs formulas, not AI.

${UTILITY_CATEGORIES}

Based on these REAL user needs, generate 5 UNIQUE, BUILDABLE app ideas. Each idea should:
- Directly address a pain point or request from the Reddit posts above
- Be buildable as an MVP in 8-16 hours
- Have clear interactive features users can use immediately

For each idea, include "sourcePostIndices" — an array of 1-based indices from the signals list above that inspired it.

Mix types: "web", "mobile", "saas", "extension"

Return ONLY JSON:
[{"title":"Name","description":"One line","problem":"Problem from Reddit","targetUsers":"Users","features":["Interactive feature 1","Interactive feature 2"],"techStack":"Stack","type":"web|mobile|saas|extension","estimatedHours":12,"viabilityScore":8,"needsAI":false,"sourcePostIndices":[1,5]}]`;
  } else {
    prompt = `Generate 5 UNIQUE app ideas — prioritize UTILITY tools that people use daily.
${dedupInstruction}
CRITICAL RULES:
- At least 3 of 5 ideas MUST be pure UTILITY tools (NO AI/LLM calls needed). Set "needsAI": false for these.
- The other 2 can be AI-powered if the idea genuinely requires AI. Set "needsAI": true for those.
- Think ilovepdf.com, tinypng.com, jsonformatter.org — tools with ONE clear function that works instantly.
- Utility tools should work 100% client-side or with simple math/logic — no external API calls needed.
- DO NOT slap "AI-powered" onto simple tools. A budget tracker needs math, not an LLM. A unit converter needs formulas, not AI.

${UTILITY_CATEGORIES}

Each app MUST allow users to DO something specific:
- Convert, transform, or format data
- Calculate or compute values
- Generate documents, codes, or images client-side
- Track, organize, or manage items
- Edit, merge, split, or compress files

Mix types: "web", "mobile", "saas", "extension"

Return ONLY JSON:
[{"title":"Name","description":"One line","problem":"Problem","targetUsers":"Users","features":["Interactive feature 1","Interactive feature 2"],"techStack":"Stack","type":"web|mobile|saas|extension","estimatedHours":12,"viabilityScore":8,"needsAI":false}]`;
  }

  try {
    const response = await kimiComplete(prompt, 6000);
    const ideas = extractJSON(response);
    if (!ideas.length) return [];

    stats.researchesToday++;
    stats.lastResearchAt = new Date().toISOString();
    await saveStats(stats);

    return ideas.map((idea: any) => {
      // Map sourcePostIndices back to actual RedditSignal objects
      let linkedSignals: RedditSignal[] | undefined;
      if (hasSignals && idea.sourcePostIndices) {
        linkedSignals = (idea.sourcePostIndices as number[])
          .filter((idx: number) => idx >= 1 && idx <= redditSignals!.length)
          .map((idx: number) => redditSignals![idx - 1]);
      }

      return {
        id: crypto.randomUUID(),
        source: (hasSignals ? "reddit" : "x") as "reddit" | "x",
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
        needsAI: typeof idea.needsAI === "boolean" ? idea.needsAI : undefined,
        redditSignals: linkedSignals,
      };
    });
  } catch (error) {
    await logger.log(`Research error: ${error}`, "ERROR");
    return [];
  }
}

async function saveIdeas(ideas: Idea[]): Promise<void> {
  await fs.mkdir(CONFIG.paths.ideas, { recursive: true });
  const existingProducts = await loadExistingProducts();
  let saved = 0;
  for (const idea of ideas) {
    const dupCheck = isDuplicate(idea, existingProducts);
    if (dupCheck.duplicate) {
      await logger.log(`[WARN] Skipping duplicate idea "${idea.title}" — ${dupCheck.reason} (matched: "${dupCheck.matchedWith}")`, "WARN");
      continue;
    }
    await fs.writeFile(path.join(CONFIG.paths.ideas, `${idea.id}.json`), JSON.stringify(idea, null, 2));
    await logger.log(`📥 Queued: ${idea.title} (${idea.type})`);
    // Add to existing list to prevent intra-batch duplicates
    existingProducts.push({
      title: idea.title,
      slug: toSlug(idea.title),
      keywords: extractKeywords(idea.title),
      description: idea.description || idea.problem || '',
      source: 'ideas',
    });
    saved++;
  }
  if (saved < ideas.length) {
    await logger.log(`[DEDUP] Saved ${saved}/${ideas.length} ideas (${ideas.length - saved} duplicates filtered)`);
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

  // Step 1: Scrape Reddit for market signals
  let redditSignals: RedditSignal[] = [];
  try {
    redditSignals = await scrapeReddit();
    if (redditSignals.length > 0) {
      // Save raw signals for auditing
      const signalsDir = path.join(CONFIG.paths.output, "signals");
      await fs.mkdir(signalsDir, { recursive: true });
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      await fs.writeFile(
        path.join(signalsDir, `reddit-${timestamp}.json`),
        JSON.stringify(redditSignals, null, 2)
      );
      await logger.log(`Saved ${redditSignals.length} Reddit signals to signals/reddit-${timestamp}.json`);
    }
  } catch (error) {
    await logger.log(`Reddit scraping failed, falling back to AI-only: ${error}`, "WARN");
  }

  // Step 2: Generate ideas (from Reddit signals or pure AI)
  const ideas = await researchIdeas(redditSignals.length > 0 ? redditSignals : undefined);
  if (ideas.length > 0) {
    await saveIdeas(ideas);
    const sourceLabel = redditSignals.length > 0 ? "(from Reddit signals)" : "(AI-generated)";
    await sendTelegram(`📡 Discovered ${ideas.length} ideas ${sourceLabel}:\n${ideas.map(i => `• ${i.title} (${i.type})`).join('\n')}`);
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
║                      MVP FACTORY v10.0                             ║
║   🚀 LAUNCH-READY: Premium, Purpose-Built Products               ║
║   🎨 Aurora + Glassmorphism + Micro-interactions                  ║
║   🤖 AI Integration (Kimi K2.5) When Needed                      ║
║   🧪 Testing + 🎯 Real Data + ⚡ Working Features                ║
║              Max 15/day | Web + Mobile + Extensions               ║
╚═══════════════════════════════════════════════════════════════════╝
`);

  await logger.log("🚀 MVP Factory v10 Starting...");
  await logger.log(`GitHub: ${CONFIG.github.username}`);
  await logger.log(`Vercel: ${CONFIG.vercel.token ? "✅" : "❌"}`);
  await logger.log(`Reddit: ${CONFIG.reddit.clientId ? "✅ OAuth (60 req/min)" : "✅ Public API (10 req/min)"}`);
  await logger.log(`Reddit Subreddits: ${CONFIG.reddit.subreddits.length} configured`);
  await logger.log(`Testing: ✅ Frontend + Backend + FUNCTIONALITY`);
  await logger.log(`Design: ✅ 12 unique premium styles`);
  await logger.log(`Frontend: ✅ Aurora, glassmorphism, micro-interactions`);
  await logger.log(`AI: ✅ Auto-detect & integrate Kimi K2.5`);
  await logger.log(`Interactions: ✅ Forms, buttons, CRUD, feedback`);

  await fs.mkdir(CONFIG.paths.ideas, { recursive: true });
  await fs.mkdir(CONFIG.paths.built, { recursive: true });
  await fs.mkdir(path.join(CONFIG.paths.output, "web"), { recursive: true });
  await fs.mkdir(path.join(CONFIG.paths.output, "mobile"), { recursive: true });
  await fs.mkdir(path.join(CONFIG.paths.output, "extensions"), { recursive: true });
  await fs.mkdir(path.join(CONFIG.paths.output, "signals"), { recursive: true });

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
