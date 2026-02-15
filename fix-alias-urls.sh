#!/bin/bash
TOKEN="dbAkE4w6jIVJKkA2xfSIZXIt"
WEB_DIR="/root/mvp-projects/web"
BUILT_DIR="/root/mvp-projects/built"

APPS="invoiceanchor contractscan-ai threadvault fixflow localfirst-api-tester splitwizard meetingburn zeroad-converter prebrief truckplate"

for app in $APPS; do
  if [ ! -d "$WEB_DIR/$app" ]; then
    echo "SKIP: $app"
    continue
  fi

  echo "=== Deploying: $app ==="
  cd "$WEB_DIR/$app"
  OUTPUT=$(npx vercel --token "$TOKEN" --yes --prod 2>&1)

  # Get the Aliased URL (clean production URL)
  ALIAS_URL=$(echo "$OUTPUT" | grep -oP 'Aliased: \Khttps://[^\s\[]+' | head -1)

  if [ -z "$ALIAS_URL" ]; then
    # Fallback: get any clean URL (not deployment-specific)
    ALIAS_URL=$(echo "$OUTPUT" | grep -oP 'https://[a-z0-9-]+\.vercel\.app' | grep -v 'neurafinitys-projects' | head -1)
  fi

  if [ -n "$ALIAS_URL" ]; then
    echo "  LIVE: $ALIAS_URL"

    # Update built JSON files
    python3 -c "
import json, os
built_dir = '$BUILT_DIR'
app_name = '$app'
alias_url = '$ALIAS_URL'
for f in os.listdir(built_dir):
    if not f.endswith('.json'): continue
    fp = os.path.join(built_dir, f)
    try:
        d = json.load(open(fp))
        t = d.get('title','').lower()
        pn = ''.join(c if c.isalnum() else '-' for c in t)[:25]
        while '--' in pn: pn = pn.replace('--', '-')
        pn = pn.strip('-')
        if pn == app_name:
            d['liveUrl'] = alias_url
            json.dump(d, open(fp, 'w'), indent=2)
            print('  Updated: ' + f)
    except: pass
"
  else
    echo "  FAILED - no alias URL found"
    echo "$OUTPUT" | tail -3
  fi

  cd "$WEB_DIR"
  echo ""
done

echo "=============================="
echo "DONE - All 10 apps redeployed with alias URLs"
echo "=============================="
