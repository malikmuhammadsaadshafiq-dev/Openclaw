#!/usr/bin/env python3
"""
Rebuild all existing web/SaaS MVPs with the latest quality standards.
Re-queues built ideas back into the daemon's idea queue so they get
rebuilt with updated prompts (working nav, search, persistence, etc.)
"""

import json
import os
import shutil
import sys

BUILT_DIR = "/root/mvp-projects/built"
IDEAS_DIR = "/root/mvp-projects/ideas"
WEB_DIR = "/root/mvp-projects/web"
STATS_FILE = "/root/mvp-projects/stats.json"

def main():
    # 1. Find all web/saas apps with live URLs
    rebuild_list = []
    for f in os.listdir(BUILT_DIR):
        if not f.endswith(".json"):
            continue
        try:
            filepath = os.path.join(BUILT_DIR, f)
            with open(filepath) as fh:
                data = json.load(fh)
            if data.get("type") in ("web", "saas") and data.get("liveUrl"):
                rebuild_list.append((f, data))
        except Exception as e:
            print(f"  Skip {f}: {e}")

    print(f"\nFound {len(rebuild_list)} web/SaaS apps to rebuild:\n")
    for f, data in sorted(rebuild_list, key=lambda x: x[1].get("title", "")):
        print(f"  - {data['title']} ({data['type']}) [{data.get('liveUrl', 'no url')[:60]}]")

    print(f"\n{'='*60}")
    print(f"Rebuilding {len(rebuild_list)} apps...")
    print(f"{'='*60}\n")

    requeued = 0
    for f, data in rebuild_list:
        title = data.get("title", "Unknown")
        project_name = title.lower()
        # Match daemon's projectName logic
        project_name = "".join(c if c.isalnum() else "-" for c in project_name)[:25]
        # Collapse multiple dashes
        while "--" in project_name:
            project_name = project_name.replace("--", "-")
        project_name = project_name.strip("-")

        project_path = os.path.join(WEB_DIR, project_name)

        # Remove old project folder so it gets rebuilt fresh
        if os.path.exists(project_path):
            shutil.rmtree(project_path)
            print(f"  Cleared: {project_path}")

        # Strip build metadata and re-queue as a fresh idea
        clean_idea = {
            "id": data["id"],
            "title": data["title"],
            "description": data["description"],
            "problem": data.get("problem", ""),
            "targetUsers": data.get("targetUsers", ""),
            "features": data.get("features", []),
            "techStack": data.get("techStack", ""),
            "type": data.get("type", "web"),
            "estimatedHours": data.get("estimatedHours", 12),
            "viabilityScore": 10,  # High priority so they build first
            "discoveredAt": data.get("discoveredAt", ""),
            "needsAI": data.get("needsAI", False),
            "source": data.get("source", "rebuild"),
        }

        # Copy reddit signals if they exist
        if data.get("redditSignals"):
            clean_idea["redditSignals"] = data["redditSignals"]

        # Write to ideas queue
        idea_path = os.path.join(IDEAS_DIR, f)
        with open(idea_path, "w") as fh:
            json.dump(clean_idea, fh, indent=2)

        # Remove from built (so it can be re-saved after rebuild)
        built_path = os.path.join(BUILT_DIR, f)
        os.remove(built_path)

        requeued += 1
        print(f"  Queued: {title} (viability=10)")

    # 3. Update stats to reset daily counter so all can be rebuilt
    try:
        with open(STATS_FILE) as fh:
            stats = json.load(fh)
        stats["buildsToday"] = 0  # Reset so daemon has room
        with open(STATS_FILE, "w") as fh:
            json.dump(stats, fh, indent=2)
        print(f"\n  Reset buildsToday to 0")
    except Exception as e:
        print(f"\n  Warning: Could not reset stats: {e}")

    print(f"\n{'='*60}")
    print(f"Done! Re-queued {requeued} apps for rebuild.")
    print(f"The daemon will pick them up automatically.")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
