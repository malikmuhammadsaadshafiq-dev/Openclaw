#!/bin/bash
# Redeploy apps that got preview URLs (401 errors) to get clean production URLs
TOKEN="dbAkE4w6jIVJKkA2xfSIZXIt"
WEB_DIR="/root/mvp-projects/web"
BUILT_DIR="/root/mvp-projects/built"
SUCCESS=0
FAILED=0

APPS="invoiceanchor contractscan-ai threadvault fixflow localfirst-api-tester splitwizard meetingburn zeroad-converter prebrief truckplate"

cd "$WEB_DIR"

for app in $APPS; do
  if [ ! -d "$app" ]; then
    echo "SKIP: $app (not found)"
    continue
  fi

  echo "=== Redeploying: $app ==="

  # First, link to existing project if possible
  cd "$app"

  # Deploy with --prod flag to get production URL
  OUTPUT=$(npx vercel --token "$TOKEN" --yes --prod 2>&1)

  # Get the production URL (the clean one, not the deployment-specific one)
  PROD_URL=$(echo "$OUTPUT" | grep -oP 'Production: \Khttps://[^\s]+' | head -1)
  if [ -z "$PROD_URL" ]; then
    PROD_URL=$(echo "$OUTPUT" | grep -oP 'https://[a-z0-9-]+\.vercel\.app' | grep -v 'neurafinitys-projects' | head -1)
  fi
  if [ -z "$PROD_URL" ]; then
    PROD_URL=$(echo "$OUTPUT" | grep -oP 'https://[^\s]+\.vercel\.app' | tail -1)
  fi

  if [ -n "$PROD_URL" ]; then
    echo "  LIVE: $PROD_URL"
    SUCCESS=$((SUCCESS + 1))

    # Update built JSON
    for json_file in "$BUILT_DIR"/*.json; do
      if [ -f "$json_file" ]; then
        TITLE=$(python3 -c "import json; d=json.load(open('$json_file')); print(d.get('title',''))" 2>/dev/null)
        PROJECT_NAME=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//' | cut -c1-25)
        if [ "$PROJECT_NAME" = "$app" ]; then
          python3 -c "
import json
with open('$json_file', 'r') as f: d = json.load(f)
d['liveUrl'] = '$PROD_URL'
with open('$json_file', 'w') as f: json.dump(d, f, indent=2)
print('  Updated: $json_file')
" 2>/dev/null
        fi
      fi
    done
  else
    echo "  OUTPUT:"
    echo "$OUTPUT" | tail -8
    echo "  FAILED"
    FAILED=$((FAILED + 1))
  fi

  cd "$WEB_DIR"
  echo ""
done

echo "=============================="
echo "Results: $SUCCESS redeployed, $FAILED failed"
echo "=============================="
