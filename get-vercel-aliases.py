#!/usr/bin/env python3
"""Get the production alias URLs for Vercel projects using the API."""
import json
import urllib.request
import os

TOKEN = "dbAkE4w6jIVJKkA2xfSIZXIt"
BUILT_DIR = "/root/mvp-projects/built"

APPS = [
    "invoiceanchor", "contractscan-ai", "threadvault", "fixflow",
    "localfirst-api-tester", "splitwizard", "meetingburn",
    "zeroad-converter", "prebrief", "truckplate"
]

updated = 0

for app in APPS:
    try:
        # Get project info from Vercel API
        req = urllib.request.Request(
            f"https://api.vercel.com/v9/projects/{app}",
            headers={"Authorization": f"Bearer {TOKEN}"}
        )
        resp = urllib.request.urlopen(req, timeout=15)
        data = json.loads(resp.read())

        # Get aliases from targets.production.alias
        aliases = []
        targets = data.get("targets", {})
        if isinstance(targets, dict):
            prod = targets.get("production", {})
            if isinstance(prod, dict):
                aliases = prod.get("alias", [])

        # Also check top-level alias field
        if not aliases:
            aliases = data.get("alias", [])

        # Find the clean alias (not deployment-specific)
        clean_url = None
        for alias in aliases:
            if "neurafinitys-projects" not in alias:
                clean_url = f"https://{alias}"
                break

        if not clean_url and aliases:
            clean_url = f"https://{aliases[0]}"

        if clean_url:
            print(f"  {app} -> {clean_url}")

            # Update built JSON
            for f in os.listdir(BUILT_DIR):
                if not f.endswith(".json"):
                    continue
                fp = os.path.join(BUILT_DIR, f)
                try:
                    d = json.load(open(fp))
                    t = d.get("title", "").lower()
                    pn = "".join(c if c.isalnum() else "-" for c in t)[:25]
                    while "--" in pn:
                        pn = pn.replace("--", "-")
                    pn = pn.strip("-")
                    if pn == app:
                        d["liveUrl"] = clean_url
                        json.dump(d, open(fp, "w"), indent=2)
                        updated += 1
                        print(f"    Updated: {f}")
                except:
                    pass
        else:
            print(f"  {app} -> NO ALIASES FOUND")
            # Show what we got
            print(f"    aliases: {aliases}")

    except urllib.error.HTTPError as e:
        print(f"  {app} -> HTTP {e.code}")
    except Exception as e:
        print(f"  {app} -> ERROR: {e}")

print(f"\nUpdated {updated} built JSON files")
