#!/bin/bash
# Fix Vercel deployment failures in MVP Factory daemon
# Patches the daemon to:
# 1. Scan web project imports and auto-install missing packages
# 2. Fix import/export mismatches (default vs named)
# 3. Run a local build check before deploying to Vercel
# 4. Add commonly-used packages to KNOWN_GOOD_VERSIONS

set -e

SERVER="root@45.58.40.219"
DAEMON="/root/mvp-factory/daemon/mvp-factory-daemon.ts"

echo "=== Backing up daemon ==="
ssh -o StrictHostKeyChecking=no $SERVER "cp $DAEMON ${DAEMON}.bak"

echo "=== Uploading patched daemon ==="
scp -o StrictHostKeyChecking=no /tmp/mvp-factory-daemon-patched.ts $SERVER:$DAEMON

echo "=== Restarting daemon ==="
ssh -o StrictHostKeyChecking=no $SERVER "pkill -f 'mvp-factory-daemon' || true && sleep 2 && cd /root/mvp-factory && nohup npm exec tsx daemon/mvp-factory-daemon.ts > /root/mvp-factory/daemon/mvp-factory-daemon.log 2>&1 &"

echo "=== Done ==="
