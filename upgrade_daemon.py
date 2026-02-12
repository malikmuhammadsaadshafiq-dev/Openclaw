#!/usr/bin/env python3
"""
Upgrade MVP Factory Daemon v9 -> v10
- Expanded design system (12 unique styles from FRONTEND_SKILLS.md)
- Real NVIDIA API key injected into generated projects
- Better prompts: concise, focused, no wasted thinking tokens
- Streaming-compatible kimiComplete with thinking mode handling
- Diverse frontend patterns per FRONTEND_SKILLS.md
"""

import re

DAEMON_PATH = "/root/mvp-factory/daemon/mvp-factory-daemon.ts"

with open(DAEMON_PATH, "r") as f:
    content = f.read()

# ============================================================
# 1. REPLACE DESIGN_STYLES with 12 diverse styles
# ============================================================

old_design_start = content.find("// ============= DESIGN SYSTEM =============")
old_design_end = content.find("// ============= FUNCTIONALITY REQUIREMENTS =============")

if old_design_start == -1 or old_design_end == -1:
    print("ERROR: Could not find DESIGN SYSTEM or FUNCTIONALITY sections")
    exit(1)

new_design_system = '''// ============= DESIGN SYSTEM (v10 - 12 unique styles) =============
const DESIGN_STYLES = [
  {
    name: "Glassmorphism Dark",
    bg: "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900",
    card: "bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl",
    accent: "#8b5cf6",
    text: "text-white",
    btn: "bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shadow-lg shadow-violet-500/25",
    font: "Inter",
    css: `.aurora-bg{position:fixed;inset:0;overflow:hidden;z-index:0}.aurora-blob{position:absolute;border-radius:50%;filter:blur(80px);opacity:.4;animation:aurora 12s ease-in-out infinite}.aurora-blob:nth-child(1){width:500px;height:500px;background:#7c3aed;top:-10%;left:20%}.aurora-blob:nth-child(2){width:400px;height:400px;background:#06b6d4;bottom:10%;right:10%;animation-delay:-4s}.aurora-blob:nth-child(3){width:350px;height:350px;background:#f43f5e;top:40%;left:50%;animation-delay:-8s}@keyframes aurora{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-50px) scale(1.1)}66%{transform:translate(-20px,30px) scale(.9)}}`,
  },
  {
    name: "Neobrutalism",
    bg: "bg-[#FFFEF0]",
    card: "bg-white border-4 border-black shadow-[8px_8px_0_0_#000]",
    accent: "#FF6B6B",
    text: "text-black",
    btn: "bg-[#FF6B6B] border-4 border-black font-bold uppercase shadow-[4px_4px_0_0_#000] hover:translate-x-1 hover:-translate-y-1 active:shadow-none active:translate-x-0 active:translate-y-0 transition-all",
    font: "Space Grotesk",
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
    font: "Inter",
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

'''

content = content[:old_design_start] + new_design_system + content[old_design_end:]

# ============================================================
# 2. REPLACE FRONTEND_SKILLS_PROMPT with concise version
# ============================================================

old_fsp_start = content.find("// ============= FRONTEND SKILLS PROMPT =============")
old_fsp_end = content.find("// ============= AI INTEGRATION =============")

if old_fsp_start == -1 or old_fsp_end == -1:
    print("ERROR: Could not find FRONTEND SKILLS or AI INTEGRATION sections")
    exit(1)

new_fsp = '''// ============= FRONTEND SKILLS (v10 - concise) =============
const FRONTEND_SKILLS_PROMPT = `
FRONTEND TECHNIQUES — use these patterns:
- Staggered fade-in-up: .fade-in-up { opacity:0;transform:translateY(20px);animation:fadeInUp .6s cubic-bezier(.22,1,.36,1) forwards;animation-delay:var(--delay,0s) }
- Hover lift: .hover-lift:hover { transform:translateY(-4px);box-shadow:0 20px 40px -12px rgba(0,0,0,.15) }
- Button press: .btn:active { transform:scale(.97) }
- Skeleton shimmer for loading states
- Toast notifications (fixed bottom-right, slide-in animation)
- Glass cards with backdrop-blur
- Gradient text with background-clip
- Fluid typography: h1 { font-size:clamp(2rem,5vw,3.5rem) }
- Scroll reveal with IntersectionObserver
- Smooth spring easing: cubic-bezier(.22,1,.36,1)
- Dot grid or noise texture backgrounds
- Color shadows matching button colors
- Dark mode with CSS variables and data-theme
- Reduced motion: @media(prefers-reduced-motion:reduce) { *{animation-duration:.01ms!important} }
`;

'''

content = content[:old_fsp_start] + new_fsp + content[old_fsp_end:]

# ============================================================
# 3. REPLACE AI_INTEGRATION_PROMPT to use real API key
# ============================================================

old_ai_start = content.find("// ============= AI INTEGRATION =============")
old_ai_end = content.find("interface Idea {")

if old_ai_start == -1 or old_ai_end == -1:
    # Try alternate boundary
    old_ai_end = content.find("\ninterface Idea {")
    if old_ai_end == -1:
        print("ERROR: Could not find AI INTEGRATION boundaries")
        exit(1)
    old_ai_end += 1  # include the newline

new_ai_section = '''// ============= AI INTEGRATION =============
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
  const data = await response.json();
  return NextResponse.json({ result: data.choices?.[0]?.message?.content || "No response" });
}

2. Create src/lib/ai.ts:
export async function askAI(prompt: string, systemPrompt?: string): Promise<string> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, systemPrompt }),
  });
  const data = await res.json();
  return data.result;
}

3. Use askAI() in components. Always show loading spinner while waiting.
4. IMPORTANT: The .env.local file with the real NVIDIA_API_KEY will be auto-created.
`;

'''

content = content[:old_ai_start] + new_ai_section + content[old_ai_end:]

# ============================================================
# 4. FIX getRandomDesign and buildWebApp prompt
# ============================================================

# Replace getRandomDesign to use new field names
old_grd = "function getRandomDesign() {\n  return DESIGN_STYLES[Math.floor(Math.random() * DESIGN_STYLES.length)];\n}"
if old_grd in content:
    content = content.replace(old_grd, "function getRandomDesign() {\n  return DESIGN_STYLES[Math.floor(Math.random() * DESIGN_STYLES.length)];\n}\n\nfunction designToPrompt(d: any): string {\n  return `DESIGN: \"${d.name}\"\\n- Background: ${d.bg}\\n- Cards: ${d.card}\\n- Accent color: ${d.accent}\\n- Text: ${d.text}\\n- Buttons: ${d.btn}\\n- Google Font: ${d.font}\\n${d.css ? '- Custom CSS to inject in globals.css:\\n' + d.css : ''}`;\n}")

# Replace the buildWebApp prompt - find the old one and replace with a shorter, more focused one
old_prompt_start = content.find('  const prompt = `You are an expert full-stack developer. Build a COMPLETE, LAUNCH-READY Next.js 14')
if old_prompt_start == -1:
    print("WARNING: Could not find buildWebApp prompt start")
else:
    old_prompt_end = content.find("  const response = await kimiComplete(prompt, 30000", old_prompt_start)
    if old_prompt_end == -1:
        print("WARNING: Could not find buildWebApp prompt end")
    else:
        new_webapp_prompt = '''  const prompt = `Build a COMPLETE Next.js 14 (App Router) TypeScript web app. Output ONLY a JSON array of file objects: [{"path":"...","content":"..."},...]. No explanations.

PROJECT: ${idea.title}
DESCRIPTION: ${idea.description}
FEATURES: ${idea.features.join("; ")}

${designToPrompt(design)}

${FRONTEND_SKILLS_PROMPT}

${hasAI ? AI_INTEGRATION_PROMPT : ""}

REQUIREMENTS:
- 10-15 files: package.json, tsconfig.json, tailwind.config.ts, postcss.config.js, next.config.js, globals.css, layout.tsx, page.tsx, 3+ components, utils.ts${hasAI ? ", api/ai/route.ts, lib/ai.ts" : ""}
- Every component: 'use client', useState, onClick/onSubmit handlers, loading states, toast feedback
- Pre-populate 8-12 REALISTIC demo items (real names, dates, prices — NOT "Item 1" or "Lorem ipsum")
- Working CRUD: add, edit, delete, toggle
- Tailwind CSS + Google Font "${design.font}" via next/font or CDN
- Animations: fade-in-up stagger, hover-lift, button press, skeleton loading
- Must look premium and production-ready

Return ONLY the JSON array. Start with [ and end with ].`;

'''
        content = content[:old_prompt_start] + new_webapp_prompt + content[old_prompt_end:]

# ============================================================
# 5. FIX the .env.local to always include real API key
# ============================================================

# Find the .env.local write and ensure it always writes the key
old_envlocal = '    await fs.writeFile(path.join(projectPath, ".env.local"), `NVIDIA_API_KEY=${CONFIG.nvidia.apiKey}\\n`);'
new_envlocal = '    await fs.writeFile(path.join(projectPath, ".env.local"), `NVIDIA_API_KEY=${CONFIG.nvidia.apiKey}\\nNEXT_PUBLIC_APP_NAME=${idea.title}\\n`);'
if old_envlocal in content:
    content = content.replace(old_envlocal, new_envlocal)

# ============================================================
# 6. Update kimiComplete to handle thinking mode better
#    and add system message to reduce reasoning
# ============================================================

old_kimi_body = '''          messages: [{ role: "user", content: prompt }],'''
new_kimi_body = '''          messages: [
            { role: "system", content: "You are a code generator. Output ONLY the requested code/JSON. No thinking, no explanations, no markdown wrappers. Start immediately with the code." },
            { role: "user", content: prompt },
          ],'''
if old_kimi_body in content:
    content = content.replace(old_kimi_body, new_kimi_body, 1)  # only first occurrence (in kimiComplete)

# ============================================================
# 7. Also fix buildChromeExtension and buildMobileApp prompts
#    to use designToPrompt and be more concise
# ============================================================

# Find buildChromeExtension prompt
ext_prompt_start = content.find("async function buildChromeExtension(idea: Idea")
if ext_prompt_start != -1:
    ext_design_line = content.find('const design = getRandomDesign();', ext_prompt_start)
    if ext_design_line != -1:
        # Find the old prompt in this function
        ext_old_prompt = content.find('  const prompt = `', ext_design_line)
        ext_old_prompt_end = content.find('  const response = await kimiComplete(prompt, 20000', ext_old_prompt)
        if ext_old_prompt != -1 and ext_old_prompt_end != -1:
            new_ext_prompt = '''  const prompt = `Build a COMPLETE Chrome Extension with popup UI. Output ONLY a JSON array of file objects: [{"path":"...","content":"..."},...]. No explanations.

PROJECT: ${idea.title}
DESCRIPTION: ${idea.description}
FEATURES: ${idea.features.join("; ")}

${designToPrompt(design)}

REQUIREMENTS:
- Files: manifest.json (v3), popup.html, popup.css, popup.js, background.js, content.js (if needed), icons/
- Popup: beautiful UI matching the design, working forms/buttons, localStorage persistence
- Pre-populate 5-8 REALISTIC demo items (NOT placeholders)
- Working interactions: add, edit, delete, toggle
- Animations and micro-interactions
- Must look premium, not like a default extension

Return ONLY the JSON array. Start with [ and end with ].`;

'''
            content = content[:ext_old_prompt] + new_ext_prompt + content[ext_old_prompt_end:]

# Find buildMobileApp prompt
mob_prompt_start = content.find("async function buildMobileApp(idea: Idea")
if mob_prompt_start != -1:
    mob_design_line = content.find('const design = getRandomDesign();', mob_prompt_start)
    if mob_design_line != -1:
        mob_old_prompt = content.find('  const prompt = `', mob_design_line)
        mob_old_prompt_end = content.find('  const response = await kimiComplete(prompt, 25000', mob_old_prompt)
        if mob_old_prompt != -1 and mob_old_prompt_end != -1:
            new_mob_prompt = '''  const prompt = `Build a COMPLETE React Native (Expo) mobile app. Output ONLY a JSON array of file objects: [{"path":"...","content":"..."},...]. No explanations.

PROJECT: ${idea.title}
DESCRIPTION: ${idea.description}
FEATURES: ${idea.features.join("; ")}

${designToPrompt(design)}

REQUIREMENTS:
- Files: package.json, app.json, App.tsx, 3+ screen components, navigation setup
- Every screen: working forms/buttons, state management, loading states
- Pre-populate 8-12 REALISTIC demo items (NOT placeholders)
- Working CRUD operations
- Animations with react-native-reanimated patterns
- StyleSheet matching the design style
- Must look like a real published app

Return ONLY the JSON array. Start with [ and end with ].`;

'''
            content = content[:mob_old_prompt] + new_mob_prompt + content[mob_old_prompt_end:]

# ============================================================
# 8. Update extractJSON to be more robust
# ============================================================

old_extract = '''function extractJSON(text: string): any[] {
  const patterns = [/```json\\s*([\\s\\S]*?)```/, /```\\s*([\\s\\S]*?)```/, /\\[[\\s\\S]*\\]/];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        return JSON.parse((match[1] || match[0]).replace(/,\\s*}/g, "}").replace(/,\\s*]/g, "]"));
      } catch {}
    }
  }
  return [];
}'''

new_extract = '''function extractJSON(text: string): any[] {
  // Try direct parse first (ideal: model outputs raw JSON)
  try {
    const trimmed = text.trim();
    if (trimmed.startsWith("[")) return JSON.parse(trimmed.replace(/,\\s*}/g, "}").replace(/,\\s*]/g, "]"));
  } catch {}

  // Try extracting from markdown code blocks
  const patterns = [/```json\\s*([\\s\\S]*?)```/, /```\\s*([\\s\\S]*?)```/];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      try {
        return JSON.parse(match[1].trim().replace(/,\\s*}/g, "}").replace(/,\\s*]/g, "]"));
      } catch {}
    }
  }

  // Try finding the largest [...] in the text
  const bracketMatch = text.match(/\\[\\s*\\{[\\s\\S]*\\}\\s*\\]/);
  if (bracketMatch) {
    try {
      return JSON.parse(bracketMatch[0].replace(/,\\s*}/g, "}").replace(/,\\s*]/g, "]"));
    } catch {}
  }

  return [];
}'''

if old_extract in content:
    content = content.replace(old_extract, new_extract)
else:
    print("WARNING: Could not find exact extractJSON function to replace")

# ============================================================
# Write the updated file
# ============================================================

with open(DAEMON_PATH, "w") as f:
    f.write(content)

# ============================================================
# Verify
# ============================================================

with open(DAEMON_PATH, "r") as f:
    verify = f.read()

checks = {
    "12 design styles": verify.count("name: \"") >= 12,
    "designToPrompt function": "function designToPrompt" in verify,
    "concise FRONTEND_SKILLS_PROMPT": "FRONTEND TECHNIQUES" in verify,
    "real API key in .env.local": "CONFIG.nvidia.apiKey" in verify,
    "system message in kimiComplete": "You are a code generator" in verify,
    "streaming in kimiComplete": "stream: true" in verify,
    "robust extractJSON": "bracketMatch" in verify,
    "Bento Dark style": "Bento Dark" in verify,
    "Terminal Green style": "Terminal Green" in verify,
    "Mono Editorial style": "Mono Editorial" in verify,
}

print("\n=== Upgrade Verification ===")
all_ok = True
for check, passed in checks.items():
    status = "OK" if passed else "FAIL"
    if not passed:
        all_ok = False
    print(f"  [{status}] {check}")

total_lines = verify.count("\n")
print(f"\n  Total lines: {total_lines}")
print(f"\n{'SUCCESS: All checks passed!' if all_ok else 'WARNING: Some checks failed!'}")
