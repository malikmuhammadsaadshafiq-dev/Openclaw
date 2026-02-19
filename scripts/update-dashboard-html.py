#!/usr/bin/env python3
"""Update dashboard.html for MVP Factory v11 Multi-Agent Architecture"""

import re

DASHBOARD_PATH = "/root/mvp-factory/dashboard/dashboard.html"

with open(DASHBOARD_PATH, "r") as f:
    html = f.read()

# 1. Replace the squadron grid with 5 agents
old_squadron = """      <div class="squadron-grid ani d1" id="squadronGrid">
        <div class="card agent-card ani d1">
          <div class="agent-avatar online" style="background:rgba(59,130,246,0.15);color:#60a5fa">FC</div>
          <div class="agent-name">FrontendClaw</div>
          <div class="agent-role">Frontend</div>
          <div class="agent-wallet">0xdb1b...e5fb</div>
        </div>
        <div class="card agent-card ani d2">
          <div class="agent-avatar online" style="background:rgba(16,185,129,0.15);color:#34d399">BC</div>
          <div class="agent-name">BackendClaw</div>
          <div class="agent-role">Backend</div>
          <div class="agent-wallet">0x0868...EC98</div>
        </div>
        <div class="card agent-card ani d3">
          <div class="agent-avatar idle" style="background:rgba(245,158,11,0.15);color:#fbbf24">CC</div>
          <div class="agent-name">ContractClaw</div>
          <div class="agent-role">Contract</div>
          <div class="agent-wallet">0xa84b...A529</div>
        </div>
        <div class="card agent-card ani d4">
          <div class="agent-avatar online" style="background:rgba(139,92,246,0.15);color:#a78bfa">PM</div>
          <div class="agent-name">PMClaw</div>
          <div class="agent-role">PM</div>
          <div class="agent-wallet">0x5A0E...AaDf</div>
        </div>
      </div>"""

new_squadron = """      <div class="squadron-grid ani d1" id="squadronGrid" style="grid-template-columns:repeat(5,1fr)">
        <div class="card agent-card ani d1">
          <div class="agent-avatar online" style="background:rgba(245,158,11,0.15);color:#fbbf24">RA</div>
          <div class="agent-name">ResearchAgent</div>
          <div class="agent-role">Research</div>
          <div class="agent-wallet" style="opacity:0.8;font-size:0.55rem">Reddit + X + HN</div>
        </div>
        <div class="card agent-card ani d2">
          <div class="agent-avatar online" style="background:rgba(239,68,68,0.15);color:#f87171">VA</div>
          <div class="agent-name">ValidationAgent</div>
          <div class="agent-role">Validation</div>
          <div class="agent-wallet" style="opacity:0.8;font-size:0.55rem">Market Scoring</div>
        </div>
        <div class="card agent-card ani d3">
          <div class="agent-avatar online" style="background:rgba(59,130,246,0.15);color:#60a5fa">FA</div>
          <div class="agent-name">FrontendAgent</div>
          <div class="agent-role">Frontend</div>
          <div class="agent-wallet" style="opacity:0.8;font-size:0.55rem">UX Psychology</div>
        </div>
        <div class="card agent-card ani d4">
          <div class="agent-avatar online" style="background:rgba(16,185,129,0.15);color:#34d399">BA</div>
          <div class="agent-name">BackendAgent</div>
          <div class="agent-role">Backend</div>
          <div class="agent-wallet" style="opacity:0.8;font-size:0.55rem">Real APIs</div>
        </div>
        <div class="card agent-card ani d5">
          <div class="agent-avatar online" style="background:rgba(139,92,246,0.15);color:#a78bfa">PM</div>
          <div class="agent-name">PMAgent</div>
          <div class="agent-role">Orchestrator</div>
          <div class="agent-wallet" style="opacity:0.8;font-size:0.55rem">Quality Gate</div>
        </div>
      </div>"""

html = html.replace(old_squadron, new_squadron)

# 2. Update version text
html = html.replace("NeuraFinity v2026.2.3", "MVP Factory v11 Multi-Agent")

# 3. Update CSS grid for 5 columns
html = html.replace(
    ".squadron-grid{display:grid;grid-template-columns:repeat(4,1fr)",
    ".squadron-grid{display:grid;grid-template-columns:repeat(5,1fr)"
)

# 4. Update responsive breakpoints
html = html.replace(
    ".squadron-grid{grid-template-columns:repeat(2,1fr)}",
    ".squadron-grid{grid-template-columns:repeat(3,1fr)}",
    1  # only first occurrence
)

# 5. Replace renderAgentsPage function
old_agents = """function renderAgentsPage(){
  const agents=[
    {name:"FrontendClaw",role:"Frontend",wallet:"0xdb1b...e5fb",status:"active",color:"#3b82f6",avatar:"FC",desc:"Builds UI components, handles React/Next.js, CSS animations, responsive design"},
    {name:"BackendClaw",role:"Backend",wallet:"0x0868...EC98",status:"active",color:"#10b981",avatar:"BC",desc:"APIs, databases, server logic, authentication, Node.js/Express"},
    {name:"ContractClaw",role:"Contract",wallet:"0xa84b...A529",status:"idle",color:"#f59e0b",avatar:"CC",desc:"Solidity smart contracts, Base chain deployment, token integration"},
    {name:"PMClaw",role:"PM",wallet:"0x5A0E...AaDf",status:"active",color:"#8b5cf6",avatar:"PM",desc:"Task breakdown, coordination, SKILL.md/HEARTBEAT.md management"},
  ];"""

new_agents = """function renderAgentsPage(){
  const agents=[
    {name:"ResearchAgent",role:"Research",wallet:"Reddit + X + HN",status:"active",color:"#f59e0b",avatar:"RA",desc:"Scrapes Reddit (21 subs), X/Twitter (10 queries), HackerNews for real pain points and product opportunities"},
    {name:"ValidationAgent",role:"Validation",wallet:"5-Dim Scoring",status:"active",color:"#ef4444",avatar:"VA",desc:"Market demand, competition gap, feasibility, monetization, audience fit. Rejects AI slop with 6.5/10 threshold"},
    {name:"FrontendAgent",role:"Frontend",wallet:"UX Psychology",status:"active",color:"#3b82f6",avatar:"FA",desc:"Psychology-driven UI design matched to target audience. Custom design systems, conversion optimization"},
    {name:"BackendAgent",role:"Backend",wallet:"Real APIs",status:"active",color:"#10b981",avatar:"BA",desc:"Fully implemented API routes, NVIDIA Kimi K2.5 AI integration, real data processing algorithms"},
    {name:"PMAgent",role:"Orchestrator",wallet:"Quality Gate",status:"active",color:"#8b5cf6",avatar:"PM",desc:"Coordinates all agents, runs Frontend+Backend in parallel, 20-point quality gate, auto-deploy to Vercel"},
  ];"""

html = html.replace(old_agents, new_agents)

with open(DASHBOARD_PATH, "w") as f:
    f.write(html)

print("Dashboard HTML updated for v11 Multi-Agent Architecture")
print(f"- Replaced 4-agent grid with 5 agents")
print(f"- Updated version text")
print(f"- Updated CSS grid columns")
print(f"- Updated renderAgentsPage function")
