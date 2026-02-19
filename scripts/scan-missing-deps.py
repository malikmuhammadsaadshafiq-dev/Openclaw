#!/usr/bin/env python3
"""Scan all web projects for missing npm dependencies."""
import os, json, re

web = "/root/mvp-projects/web"
total = 0
issues = []

for proj in sorted(os.listdir(web)):
    pdir = os.path.join(web, proj)
    if not os.path.isdir(pdir):
        continue
    total += 1

    # Read package.json deps
    try:
        pkg = json.load(open(os.path.join(pdir, "package.json")))
        deps = set(pkg.get("dependencies", {}).keys()) | set(pkg.get("devDependencies", {}).keys())
    except:
        issues.append(f"{proj}: NO package.json")
        continue

    # Scan imports in src/
    imports = set()
    srcdir = os.path.join(pdir, "src")
    if not os.path.isdir(srcdir):
        continue
    for root, dirs, files in os.walk(srcdir):
        dirs[:] = [d for d in dirs if d != "node_modules"]
        for f in files:
            if f.endswith((".ts", ".tsx", ".js", ".jsx")):
                try:
                    content = open(os.path.join(root, f)).read()
                    for m in re.findall(r"from ['\"]([^./][^'\"]*)", content):
                        pkg_name = m.split("/")[0] if not m.startswith("@") else "/".join(m.split("/")[:2])
                        if pkg_name not in ("react", "react-dom", "next"):
                            imports.add(pkg_name)
                except:
                    pass

    missing = imports - deps
    if missing:
        issues.append(f"{proj}: MISSING {sorted(missing)}")

print(f"Total: {total}, With missing deps: {len(issues)}")
for i in issues:
    print(i)
