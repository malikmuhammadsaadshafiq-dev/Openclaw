# 🏭 MVP Factory

<div align="center">

![Version](https://img.shields.io/badge/Version-8.0-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production-green?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)

**Autonomous daemon that discovers trending ideas and builds complete, functional MVPs with working interactions.**

[Dashboard](#-dashboard) • [Features](#-features) • [Deploy](#-deploy-to-render) • [API](#-api-endpoints)

</div>

---

## 🎯 What It Does

MVP Factory is an AI-powered autonomous agent that:
1. **Researches** trending ideas from X/Twitter and Reddit
2. **Generates** complete, functional MVPs (not just mockups)
3. **Tests** frontend, backend, and functionality
4. **Deploys** automatically to GitHub and Vercel
5. **Monitors** everything via real-time dashboard

### Build Types
- 🌐 **Web Apps** - Next.js 14 with TypeScript & Tailwind
- 📱 **Mobile Apps** - React Native with Expo
- 🔌 **Chrome Extensions** - Manifest V3 with working popups

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **🤖 Autonomous Operation** | Runs continuously, building up to 15 MVPs/day |
| **🎨 6 Design Styles** | Glassmorphism, Neobrutalism, Aurora, Minimal, Cyberpunk, Sunset |
| **🧪 Triple Testing** | Frontend + Backend + Functionality tests |
| **📊 Live Dashboard** | Real-time monitoring with auth protection |
| **📱 Telegram Alerts** | Get notified when builds complete |
| **⚡ Working Interactions** | Forms, buttons, CRUD, state management |

---

## 📊 Dashboard

Private, password-protected monitoring interface:

- **Agent Status** - Current activity (Idle/Researching/Building)
- **Build Stats** - Today's builds, total, test scores
- **Ideas Queue** - Pending ideas sorted by viability
- **Built Projects** - Completed MVPs with GitHub/Vercel links
- **Live Logs** - Real-time daemon output

---

## 🚀 Deploy to Render

### One-Click Deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Manual Deployment

1. **Fork this repository**

2. **Create new Web Service on Render**
   - Connect your GitHub repo
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Set Environment Variables**
   ```
   DASHBOARD_PASSWORD=your_secure_password
   NVIDIA_API_KEY=nvapi-xxx
   GITHUB_TOKEN=ghp_xxx
   GITHUB_USERNAME=your-username
   VERCEL_TOKEN=xxx (optional)
   ```

4. **Add Cron Job to Keep Alive** (Free tier sleeps after 15 min)
   - Use [cron-job.org](https://cron-job.org) or similar
   - URL: `https://your-app.onrender.com/health`
   - Schedule: Every 10 minutes

---

## 🔌 API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/health` | GET | ❌ | Health check (for keep-alive) |
| `/api/auth` | POST | ❌ | Login with password |
| `/api/stats` | GET | ✅ | Build statistics |
| `/api/status` | GET | ✅ | Daemon status |
| `/api/queue` | GET | ✅ | Ideas in queue |
| `/api/built` | GET | ✅ | Completed projects |
| `/api/logs` | GET | ✅ | Recent log entries |
| `/api/research` | POST | ✅ | Trigger research cycle |
| `/api/build` | POST | ✅ | Trigger build cycle |

### Authentication

```bash
# Get token
curl -X POST https://your-app.onrender.com/api/auth \
  -H "Content-Type: application/json" \
  -d '{"password": "your_password"}'

# Use token
curl https://your-app.onrender.com/api/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🛠 Local Development

```bash
# Clone repository
git clone https://github.com/yourusername/mvp-factory.git
cd mvp-factory

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your values

# Start dashboard server
npm start

# Or run daemon directly
npm run daemon
```

---

## 📁 Project Structure

```
mvp-factory/
├── dashboard/
│   ├── index.html      # Dashboard UI
│   ├── styles.css      # Glassmorphism theme
│   └── app.js          # Frontend JS
├── daemon/
│   └── mvp-factory-daemon-v8.ts  # Main agent
├── server.ts           # Express server + API
├── render.yaml         # Render deployment config
├── package.json        # Dependencies
└── .env.example        # Environment template
```

---

## 📄 License

MIT License - Feel free to use, modify, and distribute.

---

<div align="center">
<strong>Built with 🦞 by Openclaw & MVP Factory</strong>
</div>
