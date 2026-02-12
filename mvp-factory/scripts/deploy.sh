#!/bin/bash
# MVP Factory Server Deployment Script
# Deploys OpenClaw MVP Factory to the server and starts the daemon

set -e

echo "🦞 MVP Factory Deployment Starting..."

# Configuration
SERVER_IP="45.58.40.219"
SERVER_USER="root"
DEPLOY_DIR="/root/mvp-factory"
NVIDIA_API_KEY="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"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Connecting to server...${NC}"

# Create deployment package
echo "Packaging MVP Factory..."
cd "$(dirname "$0")/.."
tar -czf /tmp/mvp-factory.tar.gz --exclude='node_modules' --exclude='.git' .

# Upload to server
echo "Uploading to server..."
scp -o StrictHostKeyChecking=no /tmp/mvp-factory.tar.gz ${SERVER_USER}@${SERVER_IP}:/tmp/

# Remote setup
echo "Setting up on server..."
ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << 'REMOTE_SCRIPT'
set -e

echo "=== Server Setup Starting ==="

# Install Node.js 22
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
fi

# Install additional tools
apt-get update
apt-get install -y git tmux jq

# Install global tools
npm install -g typescript tsx expo-cli eas-cli openclaw

# Create deployment directory
mkdir -p /root/mvp-factory
cd /root/mvp-factory

# Extract deployment
tar -xzf /tmp/mvp-factory.tar.gz

# Create environment file
cat > .env << 'EOF'
# Kimi K2.5 via NVIDIA API
NVIDIA_API_KEY=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
LLM_BASE_URL=https://integrate.api.nvidia.com/v1
LLM_MODEL=moonshotai/kimi-k2.5

# GitHub (set these!)
GITHUB_TOKEN=
GITHUB_USERNAME=

# Expo (set these!)
EXPO_TOKEN=

# Paths
MVP_OUTPUT_DIR=/root/mvp-projects
LOG_DIR=/root/.openclaw/logs
EOF

# Create directories
mkdir -p /root/mvp-projects/{ideas,built,web,mobile}
mkdir -p /root/.openclaw/{logs,memory,skills}

# Install dependencies
npm install

# Create systemd service
cat > /etc/systemd/system/mvp-factory.service << 'EOF'
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
Environment=NODE_ENV=production
EnvironmentFile=/root/mvp-factory/.env

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
systemctl daemon-reload
systemctl enable mvp-factory
systemctl start mvp-factory

echo "=== Setup Complete ==="
echo "MVP Factory daemon is running!"
echo ""
echo "Useful commands:"
echo "  systemctl status mvp-factory    # Check status"
echo "  journalctl -u mvp-factory -f    # View logs"
echo "  systemctl restart mvp-factory   # Restart daemon"
echo ""
echo "IMPORTANT: Edit /root/mvp-factory/.env to add:"
echo "  - GITHUB_TOKEN"
echo "  - GITHUB_USERNAME"
echo "  - EXPO_TOKEN (for mobile apps)"

REMOTE_SCRIPT

echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "MVP Factory is now running on your server!"
echo "Server: ${SERVER_IP}"
echo ""
echo "Next steps:"
echo "1. SSH to server: ssh root@${SERVER_IP}"
echo "2. Edit credentials: nano /root/mvp-factory/.env"
echo "3. Restart daemon: systemctl restart mvp-factory"
echo "4. View logs: journalctl -u mvp-factory -f"
