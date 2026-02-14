#!/usr/bin/env python3
"""Apply Fix 3: Wire new functions into buildMVP flow."""

DAEMON_PATH = "/root/mvp-factory/daemon/mvp-factory-daemon.ts"

with open(DAEMON_PATH, "r") as f:
    lines = f.readlines()

# Find the "// Install dependencies" line after line 2200
target_line = None
for i, line in enumerate(lines):
    if "// Install dependencies" in line and i > 2200:
        target_line = i
        break

if target_line is None:
    print("FAIL: Could not find Install dependencies comment after line 2200")
    exit(1)

print(f"Found Install dependencies at line {target_line + 1}")

# The old block is 7 lines (target_line to target_line+6):
# target_line+0: "    // Install dependencies\n"
# target_line+1: "    if (idea.type !== "extension") {\n"
# target_line+2: "      await logger.log(...);\n"
# target_line+3: "      try {\n"
# target_line+4: "        await execAsync(...);\n"
# target_line+5: "      } catch {}\n"
# target_line+6: "    }\n"

# Verify it looks right
check = lines[target_line+1].strip()
if 'idea.type !== "extension"' not in check:
    print(f"FAIL: Line {target_line+2} doesn't match expected pattern: {check}")
    exit(1)

# Build new block
emoji = "\U0001f4e6"  # package emoji
new_lines = []
new_lines.append("    // Install dependencies\n")
new_lines.append('    if (idea.type !== "extension") {\n')
new_lines.append("      // Auto-detect and install missing packages (scan imports for web/saas)\n")
new_lines.append('      if (idea.type !== "mobile") {\n')
new_lines.append("        await autoDetectAndInstallMissingPackages(projectPath);\n")
new_lines.append("        await fixImportExportMismatches(projectPath);\n")
new_lines.append("      }\n")
new_lines.append("\n")
new_lines.append(f'      await logger.log("{emoji} Installing dependencies...");\n')
new_lines.append("      try {\n")
new_lines.append('        await execAsync("npm install --legacy-peer-deps 2>&1 || true", { cwd: projectPath, timeout: 120000 });\n')
new_lines.append("      } catch {}\n")
new_lines.append("\n")
new_lines.append("      // Local build verification for web/saas apps\n")
new_lines.append('      if (idea.type === "web" || idea.type === "saas") {\n')
new_lines.append("        const buildOk = await verifyBuildLocally(projectPath);\n")
new_lines.append("        if (!buildOk) {\n")
new_lines.append('          await logger.log("Build verification failed, will still attempt Vercel deploy", "WARN");\n')
new_lines.append("        }\n")
new_lines.append("      }\n")
new_lines.append("    }\n")

# Replace old 7-line block with new block
lines[target_line:target_line+7] = new_lines

with open(DAEMON_PATH, "w") as f:
    f.writelines(lines)

print(f"[OK] Fix 3 applied: Wired new functions into buildMVP flow")
print(f"Replaced 7 lines with {len(new_lines)} lines")
print(f"Total lines now: {len(lines)}")
