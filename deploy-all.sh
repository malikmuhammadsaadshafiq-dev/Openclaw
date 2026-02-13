#!/bin/bash
# Deploy all web apps that need Vercel deployment
TOKEN="dbAkE4w6jIVJKkA2xfSIZXIt"
WEB_DIR="/root/mvp-projects/web"
BUILT_DIR="/root/mvp-projects/built"
SUCCESS=0
FAILED=0

cd "$WEB_DIR"

for app_dir in */; do
  app="${app_dir%/}"

  # Skip if no package.json
  if [ ! -f "$app/package.json" ]; then
    continue
  fi

  # Skip if no page.tsx (not a Next.js app)
  if [ ! -f "$app/src/app/page.tsx" ]; then
    continue
  fi

  echo "=== Deploying: $app ==="
  cd "$app"

  OUTPUT=$(npx vercel --token "$TOKEN" --yes --prod 2>&1)
  URL=$(echo "$OUTPUT" | grep -oP 'https://[^\s]+\.vercel\.app' | tail -1)

  if [ -n "$URL" ]; then
    echo "  LIVE: $URL"
    SUCCESS=$((SUCCESS + 1))

    # Update built JSON files that match this project
    for json_file in "$BUILT_DIR"/*.json; do
      if [ -f "$json_file" ]; then
        TITLE=$(python3 -c "import json; d=json.load(open('$json_file')); print(d.get('title',''))" 2>/dev/null)
        PROJECT_NAME=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//' | cut -c1-25)
        if [ "$PROJECT_NAME" = "$app" ]; then
          python3 -c "
import json
with open('$json_file', 'r') as f: d = json.load(f)
d['liveUrl'] = '$URL'
with open('$json_file', 'w') as f: json.dump(d, f, indent=2)
print('  Updated: $json_file')
" 2>/dev/null
        fi
      fi
    done
  else
    # Show last few lines of error
    echo "$OUTPUT" | tail -5
    echo "  FAILED"
    FAILED=$((FAILED + 1))
  fi

  cd "$WEB_DIR"
  echo ""
done

echo "=============================="
echo "Results: $SUCCESS deployed, $FAILED failed"
echo "=============================="
