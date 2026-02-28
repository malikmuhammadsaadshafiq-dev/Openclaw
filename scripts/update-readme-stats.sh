#!/bin/bash
# Auto-update README.md with live stats from the server
# Run via cron: 0 */6 * * * /root/Openclaw-repo/scripts/update-readme-stats.sh

set -e

cd /root/Openclaw-repo

# Read stats from health file
HEALTH_FILE="/root/.openclaw/logs/health-v11.json"
if [ -f "$HEALTH_FILE" ]; then
    QUEUE_SIZE=$(cat "$HEALTH_FILE" | grep -o '"validatedQueue":[0-9]*' | grep -o '[0-9]*' || echo "0")
    TOTAL_BUILT=$(cat "$HEALTH_FILE" | grep -o '"totalBuilt":[0-9]*' | grep -o '[0-9]*' || echo "0")
    DAILY_BUILDS=$(cat "$HEALTH_FILE" | grep -o '"dailyBuildCount":[0-9]*' | grep -o '[0-9]*' || echo "0")
    UPTIME_SEC=$(cat "$HEALTH_FILE" | grep -o '"uptime":[0-9.]*' | grep -o '[0-9.]*' || echo "0")
    UPTIME_HOURS=$(echo "scale=1; $UPTIME_SEC / 3600" | bc)
else
    QUEUE_SIZE=0
    TOTAL_BUILT=0
    DAILY_BUILDS=0
    UPTIME_HOURS="0"
fi

# Count actual built projects
BUILT_COUNT=$(ls /root/mvp-projects/built/*.json 2>/dev/null | wc -l || echo "0")
if [ "$BUILT_COUNT" -gt "$TOTAL_BUILT" ]; then
    TOTAL_BUILT=$BUILT_COUNT
fi

# Get current timestamp
TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M UTC")

# Create the new stats section
STATS_CONTENT="<!-- STATS-START -->
| Metric | Value |
|--------|-------|
| **Queue Size** | $QUEUE_SIZE ideas waiting |
| **Total Built** | $TOTAL_BUILT products |
| **Daily Builds** | $DAILY_BUILDS / 10 |
| **Uptime** | ${UPTIME_HOURS} hours |
| **Last Updated** | $TIMESTAMP |
<!-- STATS-END -->"

# Update README.md using sed
# First, create a temp file with the new content
README_FILE="/root/Openclaw-repo/README.md"

# Use awk to replace the stats section
awk -v stats="$STATS_CONTENT" '
/<!-- STATS-START -->/{p=1; print stats; next}
/<!-- STATS-END -->/{p=0; next}
!p
' "$README_FILE" > "${README_FILE}.tmp"

mv "${README_FILE}.tmp" "$README_FILE"

# Check if there are changes
if git diff --quiet README.md; then
    echo "No changes to README stats"
    exit 0
fi

# Commit and push
git add README.md
git commit -m "chore: auto-update README stats ($TIMESTAMP)

Queue: $QUEUE_SIZE | Built: $TOTAL_BUILT | Daily: $DAILY_BUILDS/10"
git push origin master

echo "README stats updated successfully at $TIMESTAMP"
