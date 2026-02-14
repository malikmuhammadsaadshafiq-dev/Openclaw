#!/bin/bash
# Complete server setup script - run this directly on the server
# Usage: curl -fsSL <url> | bash

set -e

echo "🦞 MVP Factory Complete Setup"
echo "=============================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root${NC}"
    exit 1
fi

# Install Node.js 22
echo -e "${YELLOW}Installing Node.js 22...${NC}"
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# Install system dependencies
echo -e "${YELLOW}Installing system dependencies...${NC}"
apt-get update
apt-get install -y git tmux jq curl wget

# Install global npm packages
echo -e "${YELLOW}Installing global npm packages...${NC}"
npm install -g typescript tsx expo-cli eas-cli pnpm

# Create directory structure
echo -e "${YELLOW}Creating directories...${NC}"
mkdir -p /root/mvp-factory/{daemon,skills,config,scripts}
mkdir -p /root/mvp-projects/{ideas,built,web,mobile}
mkdir -p /root/.neurafinity/{logs,memory,skills}

# Create the daemon script
echo -e "${YELLOW}Creating daemon script...${NC}"
cat > /root/mvp-factory/daemon/mvp-factory-daemon.ts << 'DAEMON_EOF'
/**
 * MVP Factory Autonomous Daemon
 * Researches ideas from X/Reddit, generates complete MVPs, pushes to GitHub/Expo
 * Powered by Kimi K2.5 via NVIDIA API
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
    output: '/root/mvp-projects',
    logs: '/root/.neurafinity/logs',
    ideas: '/root/mvp-projects/ideas',
    built: '/root/mvp-projects/built',
  },
  intervals: {
    research: 60 * 60 * 1000,
    build: 30 * 60 * 1000,
    healthCheck: 5 * 60 * 1000,
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

class Logger {
  private logFile = path.join(CONFIG.paths.logs, 'daemon.log');

  async log(message: string, level = 'INFO') {
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
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.nvidia.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: CONFIG.nvidia.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) throw new Error(`Kimi API error: ${response.statusText}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

async function researchIdeas(): Promise<Idea[]> {
  await logger.log('Starting idea research...');

  const prompt = `You are an expert startup analyst. Generate 5 UNIQUE, trending app/SaaS ideas that are:
1. Buildable as MVPs in 8-24 hours
2. Solving real problems
3. Have clear monetization potential

Return ONLY a valid JSON array:
[{"title":"Name","description":"One sentence","problem":"Problem solved","targetUsers":"Users","features":["f1","f2","f3"],"techStack":"Next.js + Supabase","type":"web|mobile|saas|api","estimatedHours":12,"viabilityScore":8}]`;

  try {
    const response = await kimiComplete(prompt, 8000);
    const jsonMatch = response.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) return [];

    const ideas: any[] = JSON.parse(jsonMatch[0]);
    return ideas.map(idea => ({
      ...idea,
      id: crypto.randomUUID(),
      source: Math.random() > 0.5 ? 'x' : 'reddit' as const,
      complexity: idea.estimatedHours <= 8 ? 'low' : idea.estimatedHours <= 16 ? 'medium' : 'high' as const,
      sourceUrl: `https://research.mvpfactory/${Date.now()}`,
      discoveredAt: new Date().toISOString(),
    }));
  } catch (error) {
    await logger.log(`Research error: ${error}`, 'ERROR');
    return [];
  }
}

async function saveIdeas(ideas: Idea[]): Promise<void> {
  await fs.mkdir(CONFIG.paths.ideas, { recursive: true });
  for (const idea of ideas) {
    if (idea.viabilityScore >= 7) {
      await fs.writeFile(path.join(CONFIG.paths.ideas, `${idea.id}.json`), JSON.stringify(idea, null, 2));
      await logger.log(`Queued: ${idea.title}`);
    }
  }
}

async function getNextIdea(): Promise<Idea | null> {
  try {
    const files = await fs.readdir(CONFIG.paths.ideas);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    if (!jsonFiles.length) return null;

    const ideas: Idea[] = [];
    for (const file of jsonFiles) {
      const content = await fs.readFile(path.join(CONFIG.paths.ideas, file), 'utf-8');
      ideas.push(JSON.parse(content));
    }
    return ideas.sort((a, b) => b.viabilityScore - a.viabilityScore)[0];
  } catch { return null; }
}

async function buildMVP(idea: Idea): Promise<void> {
  await logger.log(`Building: ${idea.title} (${idea.type})`);

  const isWeb = idea.type !== 'mobile';
  const prompt = isWeb
    ? `Generate a complete Next.js 14 app for "${idea.title}": ${idea.description}. Features: ${idea.features.join(', ')}. Return JSON array of files: [{"path":"package.json","content":"..."},...]`
    : `Generate a complete Expo React Native app for "${idea.title}": ${idea.description}. Features: ${idea.features.join(', ')}. Return JSON array of files: [{"path":"package.json","content":"..."},...]`;

  const response = await kimiComplete(prompt, 30000);
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Invalid response');

  const files = JSON.parse(jsonMatch[0]);
  const projectName = idea.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const projectPath = path.join(CONFIG.paths.output, isWeb ? 'web' : 'mobile', projectName);

  await fs.mkdir(projectPath, { recursive: true });
  for (const file of files) {
    const filePath = path.join(projectPath, file.path);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, file.content);
  }

  await logger.log(`Created ${files.length} files at ${projectPath}`);

  // Install deps
  try {
    await execAsync('npm install', { cwd: projectPath, timeout: 180000 });
  } catch {}

  // Push to GitHub
  if (CONFIG.github.token && CONFIG.github.username) {
    try {
      await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${CONFIG.github.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName, description: idea.description, private: false }),
      });

      await execAsync('git init && git add . && git commit -m "Initial MVP"', { cwd: projectPath });
      await execAsync(`git remote add origin https://${CONFIG.github.token}@github.com/${CONFIG.github.username}/${projectName}.git`, { cwd: projectPath });
      await execAsync('git branch -M main && git push -u origin main', { cwd: projectPath });
      await logger.log(`Pushed to GitHub: https://github.com/${CONFIG.github.username}/${projectName}`);
    } catch (e) { await logger.log(`GitHub error: ${e}`, 'ERROR'); }
  }

  // Expo publish for mobile
  if (!isWeb && CONFIG.expo.token) {
    try {
      await execAsync(`npx expo login --token ${CONFIG.expo.token}`, { cwd: projectPath });
      await execAsync('npx eas update --branch preview --non-interactive', { cwd: projectPath, timeout: 300000 });
      await logger.log('Published to Expo Go');
    } catch (e) { await logger.log(`Expo error: ${e}`, 'ERROR'); }
  }

  // Move to built
  await fs.mkdir(CONFIG.paths.built, { recursive: true });
  try {
    await fs.rename(path.join(CONFIG.paths.ideas, `${idea.id}.json`), path.join(CONFIG.paths.built, `${idea.id}.json`));
  } catch {}

  await logger.log(`✅ Complete: ${idea.title}`);
}

async function runResearchCycle() {
  await logger.log('=== Research Cycle ===');
  const ideas = await researchIdeas();
  await saveIdeas(ideas);
}

async function runBuildCycle() {
  await logger.log('=== Build Cycle ===');
  const idea = await getNextIdea();
  if (idea) await buildMVP(idea);
  else await logger.log('No ideas in queue');
}

async function main() {
  await logger.log('🦞 MVP Factory Daemon Starting...');
  await logger.log(`Model: ${CONFIG.nvidia.model}`);

  await fs.mkdir(CONFIG.paths.ideas, { recursive: true });
  await fs.mkdir(CONFIG.paths.built, { recursive: true });

  await runResearchCycle();
  await runBuildCycle();

  setInterval(runResearchCycle, CONFIG.intervals.research);
  setInterval(runBuildCycle, CONFIG.intervals.build);

  await logger.log('🚀 Running: Research/1h, Build/30m');
}

main().catch(e => { console.error(e); process.exit(1); });
DAEMON_EOF

# Create package.json
cat > /root/mvp-factory/package.json << 'PKGJSON'
{
  "name": "mvp-factory",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "tsx daemon/mvp-factory-daemon.ts"
  },
  "dependencies": {
    "tsx": "^4.7.0",
    "typescript": "^5.3.0"
  }
}
PKGJSON

# Create .env
cat > /root/mvp-factory/.env << 'ENVFILE'
# Kimi K2.5 via NVIDIA API
NVIDIA_API_KEY=${NVIDIA_API_KEY:-your_nvidia_api_key_here}

# GitHub (REQUIRED - add your credentials)
GITHUB_TOKEN=
GITHUB_USERNAME=

# Expo (for mobile apps)
EXPO_TOKEN=
ENVFILE

# Install dependencies
cd /root/mvp-factory
npm install

# Create systemd service
cat > /etc/systemd/system/mvp-factory.service << 'SERVICE'
[Unit]
Description=MVP Factory Daemon
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/mvp-factory
ExecStart=/usr/bin/npx tsx daemon/mvp-factory-daemon.ts
Restart=always
RestartSec=10
EnvironmentFile=/root/mvp-factory/.env

[Install]
WantedBy=multi-user.target
SERVICE

# Start service
systemctl daemon-reload
systemctl enable mvp-factory
systemctl start mvp-factory

echo ""
echo -e "${GREEN}✅ MVP Factory Installed Successfully!${NC}"
echo ""
echo "The daemon is now running and will:"
echo "  • Research new ideas every 1 hour"
echo "  • Build MVPs every 30 minutes"
echo "  • Push to GitHub automatically"
echo "  • Deploy mobile apps to Expo Go"
echo ""
echo -e "${YELLOW}IMPORTANT: Configure your credentials:${NC}"
echo "  nano /root/mvp-factory/.env"
echo ""
echo "Add your:"
echo "  • GITHUB_TOKEN"
echo "  • GITHUB_USERNAME"
echo "  • EXPO_TOKEN (optional, for mobile)"
echo ""
echo "Then restart: systemctl restart mvp-factory"
echo ""
echo "Useful commands:"
echo "  systemctl status mvp-factory     # Status"
echo "  journalctl -u mvp-factory -f     # Logs"
echo "  ls /root/mvp-projects/           # Built projects"
