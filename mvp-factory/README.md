# MVP Factory

<div align="center">

![Version](https://img.shields.io/badge/Version-10.0-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production-green?style=for-the-badge)
![Node](https://img.shields.io/badge/Node-%3E%3D20-339933?style=for-the-badge&logo=node.js)
![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)

**Autonomous daemon that scrapes Reddit for real user pain points, generates complete MVPs with Kimi K2.5, tests them, and auto-deploys to GitHub + Vercel + Expo Go.**

Builds up to **15 production-ready apps per day** across web, mobile, and browser extensions.

[Quick Start](#-quick-start-local) | [Server Deploy](#-server-deployment-linux) | [How It Works](#-how-it-works) | [Dashboard](#-dashboard) | [Configuration](#%EF%B8%8F-configuration)

</div>

---

## What It Does

MVP Factory is a fully autonomous build agent. Once started, it runs in a loop:

1. **Scrapes Reddit** (13 subreddits) for posts where people ask for tools, complain about pain points, or request app ideas
2. **Generates 5 MVP ideas** per research cycle using Kimi K2.5 (NVIDIA API) - prioritizes utility-first tools (PDF tools, calculators, converters) alongside AI-powered apps
3. **Builds complete, working apps** - not mockups. Real state management, CRUD operations, pre-loaded demo data, 12 premium design styles
4. **Tests everything** - frontend structure, backend API routes, and functionality (forms, buttons, interactions)
5. **Deploys automatically** - pushes to GitHub, deploys web apps to Vercel, publishes mobile apps to Expo Go
6. **Notifies you** via Telegram when each build completes

### Build Types

| Type | Stack | Deploy Target |
|------|-------|---------------|
| Web Apps | Next.js 14, TypeScript, Tailwind CSS | GitHub + Vercel |
| SaaS Apps | Next.js 14, TypeScript, Tailwind CSS | GitHub + Vercel |
| Mobile Apps | React Native, Expo SDK 50 | GitHub + Expo Go |
| Chrome Extensions | Manifest V3, vanilla JS/CSS | GitHub |

---

## Quick Start (Local)

### Prerequisites

- **Node.js 20+** - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **NVIDIA API Key** (free) - for Kimi K2.5 LLM
- **GitHub Personal Access Token** - for pushing repos
- Optional: **Vercel Token** - for auto-deploying web apps
- Optional: **Expo Token** - for publishing mobile apps
- Optional: **Telegram Bot** - for build notifications

### Step 1: Clone and install

```bash
git clone https://github.com/malikmuhammadsaadshafiq-dev/NeuraFinity.git
cd NeuraFinity/mvp-factory
npm install
```

### Step 2: Get your API keys

#### NVIDIA API Key (required - powers the LLM)
1. Go to [build.nvidia.com](https://build.nvidia.com/)
2. Sign up / log in
3. Search for **Kimi K2.5** (by Moonshot AI)
4. Click "Get API Key" and copy it

#### GitHub Token (required - pushes built repos)
1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Generate new token (classic)
3. Select scopes: `repo`, `delete_repo`
4. Copy the token

#### Vercel Token (optional - auto-deploys web apps)
1. Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Create a new token
3. Copy it

#### Expo Token (optional - publishes mobile apps)
1. Install EAS CLI: `npm install -g eas-cli`
2. Log in: `npx eas login`
3. Create token: `npx eas credentials` or go to [expo.dev/accounts/settings/access-tokens](https://expo.dev/accounts/[your-username]/settings/access-tokens)

#### Telegram Bot (optional - build notifications)
1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot`, follow prompts, copy the bot token
3. Add the bot to a group/channel
4. Get the chat ID via `https://api.telegram.org/bot<TOKEN>/getUpdates`

### Step 3: Create environment file

```bash
cp .env.example .env
```

If `.env.example` doesn't exist, create `.env` manually:

```env
# REQUIRED
NVIDIA_API_KEY=nvapi-your-key-here
GITHUB_TOKEN=ghp_your-token-here
GITHUB_USERNAME=your-github-username

# OPTIONAL - Web deployment
VERCEL_TOKEN=your-vercel-token

# OPTIONAL - Mobile deployment
EXPO_TOKEN=your-expo-token

# OPTIONAL - Notifications
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# OPTIONAL - Custom paths (defaults shown)
MVP_OUTPUT_DIR=/root/mvp-projects
LOG_DIR=/root/.neurafinity/logs
```

### Step 4: Create output directories

```bash
# Linux / macOS
mkdir -p ~/mvp-projects/{ideas,built,web,mobile,signals,skipped,stats}
mkdir -p ~/.neurafinity/logs

# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path "$HOME\mvp-projects\ideas","$HOME\mvp-projects\built","$HOME\mvp-projects\web","$HOME\mvp-projects\mobile","$HOME\mvp-projects\signals","$HOME\mvp-projects\skipped"
New-Item -ItemType Directory -Force -Path "$HOME\.neurafinity\logs"
```

> **Note:** By default the daemon writes to `/root/mvp-projects/` and `/root/.neurafinity/logs/`. If you're running locally (not as root on a server), edit the `CONFIG.paths` section at the top of `daemon/mvp-factory-daemon-v10-server.ts` to point to your local directories.

### Step 5: Start the daemon

```bash
npm start
```

That's it. The daemon will:
1. Print its config check (GitHub, Vercel, Reddit, Expo, etc.)
2. Start a Reddit research cycle immediately
3. Begin building MVPs every 20 minutes
4. Run new research every 6 hours

### Watching logs

```bash
# Follow daemon output live
npm start

# Or if running as a service, check logs at:
# Linux: ~/.neurafinity/logs/daemon.log
# The daemon also prints everything to stdout
```

---

## Server Deployment (Linux)

For 24/7 autonomous operation, deploy to a Linux server (Ubuntu/Debian).

### Option A: One-line setup script

SSH into your server and run:

```bash
curl -fsSL https://raw.githubusercontent.com/malikmuhammadsaadshafiq-dev/NeuraFinity/master/mvp-factory/scripts/setup-server.sh | bash
```

This installs Node.js 22, creates the directory structure, sets up the systemd service, and starts the daemon. You still need to edit `/root/mvp-factory/.env` with your API keys afterward.

### Option B: Manual server setup

```bash
# 1. Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs git

# 2. Install global tools
npm install -g typescript tsx eas-cli

# 3. Clone the repo
git clone https://github.com/malikmuhammadsaadshafiq-dev/NeuraFinity.git /root/NeuraFinity
cd /root/NeuraFinity/mvp-factory

# 4. Install dependencies
npm install

# 5. Create .env file (see Step 3 above)
nano .env

# 6. Create output directories
mkdir -p /root/mvp-projects/{ideas,built,web,mobile,signals,skipped}
mkdir -p /root/.neurafinity/logs

# 7. Create systemd service
cat > /etc/systemd/system/mvp-factory.service << 'EOF'
[Unit]
Description=MVP Factory Daemon
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/NeuraFinity/mvp-factory
ExecStart=/usr/bin/npx tsx daemon/mvp-factory-daemon-v10-server.ts
Restart=always
RestartSec=10
EnvironmentFile=/root/NeuraFinity/mvp-factory/.env

[Install]
WantedBy=multi-user.target
EOF

# 8. Start the service
systemctl daemon-reload
systemctl enable mvp-factory
systemctl start mvp-factory
```

### Useful server commands

```bash
systemctl status mvp-factory          # Check status
journalctl -u mvp-factory -f          # Follow live logs
systemctl restart mvp-factory         # Restart after changes
systemctl stop mvp-factory            # Stop the daemon

ls /root/mvp-projects/ideas/          # Queued ideas
ls /root/mvp-projects/built/          # Completed builds
cat /root/mvp-projects/stats.json     # Today's stats
tail -100 /root/.neurafinity/logs/daemon.log  # Recent logs
```

---

## How It Works

### Build Cycle (every 20 minutes)

```
1. Pick highest-viability idea from queue
2. Detect type (web/mobile/extension)
3. Select random design style (12 premium themes)
4. Check if idea needs AI integration
5. Send detailed prompt to Kimi K2.5
6. Write generated files to project directory
7. Sanitize package.json (fix versions, add missing deps)
8. Validate code (fix unbalanced braces/parens)
9. Run tests (frontend + backend + functionality)
10. Auto-fix failed tests
11. Install npm dependencies
12. Push to GitHub (creates new repo)
13. Deploy to Vercel (web/saas) or Expo Go (mobile)
14. Send Telegram notification
15. Save build metadata
```

### Research Cycle (every 6 hours)

```
1. Scrape 13 subreddits for posts matching signal keywords
   ("i wish", "someone should build", "need a tool", etc.)
2. Filter by score (min 10 upvotes)
3. Send top 20 signals to Kimi K2.5
4. Generate 5 ideas: 3 utility tools + 2 AI-powered
5. Save to ideas queue with viability scores
```

### AI Detection

The daemon decides per-idea whether to inject Kimi K2.5 API integration:
- Ideas with `needsAI: false` from research -> no AI code injected
- Ideas with `needsAI: true` -> gets working `/api/ai` route + `askAI()` helper
- Fallback: keyword detection (chatbot, summarize, translate, etc.)

Utility tools (calculators, converters, formatters) stay pure client-side with no external API dependency.

### 12 Design Styles

Every build gets a random premium design:

| Style | Description |
|-------|-------------|
| Glassmorphism Dark | Purple aurora blobs, frosted glass cards |
| Neobrutalism | Bold borders, offset shadows, raw aesthetic |
| Aurora Borealis | Animated gradient blobs, translucent layers |
| Minimal Light | Clean whites, subtle shadows, lots of space |
| Cyberpunk | Neon cyan/magenta, dark backgrounds, glow effects |
| Sunset Gradient | Warm orange-to-pink gradients |
| Forest Dark | Deep emerald greens, nature-inspired |
| Ocean Blue | Cool blues, wave-like gradients |
| Retro Terminal | Green-on-black, monospace, CRT scanlines |
| Pastel Soft | Light pinks/blues/yellows, rounded shapes |
| Dark Luxe | Gold accents on deep black, premium feel |
| Neon Pop | Bright saturated colors, playful energy |

---

## Dashboard

A monitoring dashboard is included at `dashboard/server.js`. It provides a web UI to monitor the daemon in real-time.

### Running the dashboard (on server)

```bash
cd /root/NeuraFinity/mvp-factory
node dashboard/server.js
# Runs on port 3000
```

### Dashboard Features

- **Daemon Status** - Running/stopped, PID, memory usage, uptime
- **Build Stats** - Builds today, total built, functionality scores
- **Ideas Queue** - Pending ideas sorted by viability score
- **Built Projects** - Completed MVPs with GitHub/Vercel/Expo links
- **Reddit Signals** - Latest scraped signals from Reddit
- **Live Logs** - Real-time daemon log output

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stats` | GET | Build statistics |
| `/api/status` | GET | Daemon status (running, PID, memory) |
| `/api/queue` | GET | Ideas waiting to be built |
| `/api/built` | GET | Completed projects |
| `/api/logs` | GET | Recent log entries |
| `/api/signals` | GET | Reddit signals |

---

## Configuration

### Limits

Edit `CONFIG.limits` in `daemon/mvp-factory-daemon-v10-server.ts`:

```typescript
limits: {
  maxBuildsPerDay: 15,    // Max MVPs built per UTC day
  researchPerDay: 4,      // Max research cycles per day
},
```

### Intervals

```typescript
intervals: {
  research: 6 * 60 * 60 * 1000,  // Research every 6 hours
  build: 20 * 60 * 1000,          // Build attempt every 20 minutes
},
```

### Reddit Subreddits

Add or remove subreddits in `CONFIG.reddit.subreddits`:

```typescript
reddit: {
  subreddits: [
    "SideProject", "startups", "SaaS", "AppIdeas", "indiehackers",
    "Entrepreneur", "webdev", "reactnative", "nextjs", "opensource",
    "SomebodyMakeThis", "Lightbulb", "slavelabour",
  ],
  signalKeywords: [
    "i wish", "someone should build", "looking for", "need a tool",
    // ... add your own
  ],
  minScore: 10,
  postsPerSubreddit: 25,
},
```

### Output Paths

```typescript
paths: {
  output: "/root/mvp-projects",       // Base output directory
  logs: "/root/.neurafinity/logs",       // Log files
  ideas: "/root/mvp-projects/ideas",  // Queued ideas (JSON)
  built: "/root/mvp-projects/built",  // Build metadata (JSON)
  stats: "/root/mvp-projects/stats.json",  // Daily stats
},
```

---

## Project Structure

```
mvp-factory/
├── daemon/
│   └── mvp-factory-daemon-v10-server.ts  # Main daemon (v10 - production)
├── dashboard/
│   └── server.js                          # Dashboard web server
├── scripts/
│   ├── setup-server.sh                    # One-line server setup
│   └── deploy.sh                          # Deploy script
├── config/
│   └── neurafinity.json                      # NeuraFinity integration config
├── package.json
├── .env                                   # Your API keys (not committed)
└── README.md
```

### Output Structure (created at runtime)

```
mvp-projects/
├── ideas/          # Queued idea JSON files
├── built/          # Build metadata JSON files
├── web/            # Generated web app projects
│   ├── budget-tracker/
│   ├── json-formatter/
│   └── ...
├── mobile/         # Generated mobile app projects
│   ├── habit-tracker/
│   └── ...
├── signals/        # Reddit signal snapshots
├── skipped/        # Skipped/duplicate ideas
└── stats.json      # Daily build statistics
```

---

## Troubleshooting

### Daemon won't start
- Check Node.js version: `node --version` (needs 20+)
- Check `.env` file exists and has `NVIDIA_API_KEY`
- Check logs: `journalctl -u mvp-factory -n 50`

### No ideas being generated
- Verify NVIDIA API key is valid
- Check research limit: `cat /root/mvp-projects/stats.json` (max 4/day)
- Wait for daily reset at 00:00 UTC

### Builds failing
- Check build limit: stats.json `buildsToday` (max 15/day)
- Check disk space: `df -h`
- Check npm registry access: `npm ping`

### GitHub push failing
- Verify `GITHUB_TOKEN` has `repo` and `delete_repo` scopes
- Check `GITHUB_USERNAME` matches your account
- Token may have expired - regenerate it

### Vercel deploy failing
- Verify `VERCEL_TOKEN` is set
- The token needs access to your Vercel account
- Some projects may fail if Next.js build has errors

### Expo publish failing
- Verify `EXPO_TOKEN` is set
- Run `npx eas whoami` to check auth
- Mobile apps need valid app.json with expo.slug

### Daily limits
All counters reset at **00:00 UTC**. Check current usage:
```bash
cat /root/mvp-projects/stats.json | python3 -m json.tool
```

---

## FAQ

**Q: How much does it cost to run?**
The only paid API is NVIDIA (Kimi K2.5). At 15 builds/day with ~32K tokens per build, expect ~500K tokens/day. Check [NVIDIA pricing](https://build.nvidia.com/) for current rates. GitHub, Vercel (hobby), and Expo (free tier) are free.

**Q: Can I change the LLM?**
Yes. Edit `CONFIG.nvidia` in the daemon file. Any OpenAI-compatible API works. Change `baseUrl`, `model`, and `apiKey`.

**Q: Can I run it on Windows?**
Yes, for development. Run `npm start` directly. For 24/7 operation, use a Linux server or WSL2 with a process manager like pm2.

**Q: How do I add my own idea manually?**
Create a JSON file in the ideas directory:
```json
{
  "id": "my-custom-idea",
  "source": "x",
  "title": "My Tool Name",
  "description": "What it does",
  "problem": "What problem it solves",
  "targetUsers": "Who uses it",
  "features": ["Feature 1", "Feature 2", "Feature 3"],
  "techStack": "Next.js",
  "complexity": "medium",
  "estimatedHours": 12,
  "viabilityScore": 10,
  "discoveredAt": "2026-01-01T00:00:00.000Z",
  "type": "web",
  "needsAI": false
}
```
Set `viabilityScore` to 10 to ensure it gets built next.

**Q: Where do built apps end up?**
- Source code: `/root/mvp-projects/web/` or `/root/mvp-projects/mobile/`
- GitHub: `https://github.com/YOUR_USERNAME/mvp-{project-name}`
- Vercel: auto-deployed URL in build metadata
- Expo: `https://expo.dev/@YOUR_USERNAME/{project-name}`

---

## License

MIT License - use, modify, and distribute freely.

---

<div align="center">
<strong>Built by NeuraFinity Squadron</strong>
</div>
