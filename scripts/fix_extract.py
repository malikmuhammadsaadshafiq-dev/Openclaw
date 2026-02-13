#!/usr/bin/env python3
"""Fix extractJSON to handle Kimi K2.5's reasoning_content output."""

DAEMON_PATH = "/root/mvp-factory/daemon/mvp-factory-daemon.ts"

with open(DAEMON_PATH, "r") as f:
    content = f.read()

# Find and replace the extractJSON function
old_start = content.find("function extractJSON(text: string): any[] {")
old_end = content.find("\n\nasync function runFrontendTests")
if old_end == -1:
    old_end = content.find("\nasync function runFrontendTests")

if old_start == -1 or old_end == -1:
    print(f"ERROR: Could not find extractJSON boundaries (start={old_start}, end={old_end})")
    exit(1)

new_extract = '''function extractJSON(text: string): any[] {
  // Strategy 1: Direct parse (model outputs clean JSON)
  try {
    const trimmed = text.trim();
    if (trimmed.startsWith("[")) {
      const cleaned = trimmed.replace(/,\\s*}/g, "}").replace(/,\\s*]/g, "]");
      return JSON.parse(cleaned);
    }
  } catch {}

  // Strategy 2: Find JSON in markdown code blocks
  const codeBlockPatterns = [/```json\\s*([\\s\\S]*?)```/g, /```\\s*([\\s\\S]*?)```/g];
  for (const pattern of codeBlockPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const block = match[1].trim();
      if (block.startsWith("[")) {
        try {
          return JSON.parse(block.replace(/,\\s*}/g, "}").replace(/,\\s*]/g, "]"));
        } catch {}
      }
    }
  }

  // Strategy 3: Find the largest [...] block containing file objects
  // Use bracket matching instead of greedy regex (handles nested brackets)
  let bestResult: any[] = [];
  let searchPos = 0;

  while (searchPos < text.length) {
    const arrayStart = text.indexOf("[", searchPos);
    if (arrayStart === -1) break;

    // Check if this looks like a file array (next non-whitespace should be { or \\n{)
    const afterBracket = text.substring(arrayStart + 1, arrayStart + 50).trim();
    if (!afterBracket.startsWith("{")) {
      searchPos = arrayStart + 1;
      continue;
    }

    // Find matching closing bracket using depth tracking
    let depth = 0;
    let inString = false;
    let escape = false;
    let arrayEnd = -1;

    for (let i = arrayStart; i < text.length && i < arrayStart + 200000; i++) {
      const ch = text[i];
      if (escape) { escape = false; continue; }
      if (ch === "\\\\") { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "[") depth++;
      if (ch === "]") {
        depth--;
        if (depth === 0) { arrayEnd = i; break; }
      }
    }

    if (arrayEnd > arrayStart) {
      const candidate = text.substring(arrayStart, arrayEnd + 1);
      try {
        const cleaned = candidate.replace(/,\\s*}/g, "}").replace(/,\\s*]/g, "]");
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].path) {
          if (parsed.length > bestResult.length) {
            bestResult = parsed;
          }
        }
      } catch {}
    }

    searchPos = arrayStart + 1;
  }

  if (bestResult.length > 0) return bestResult;

  // Strategy 4: Last resort - try to extract individual file objects and reconstruct
  const filePattern = /\\{\\s*"path"\\s*:\\s*"([^"]+)"\\s*,\\s*"content"\\s*:\\s*"/g;
  const files: any[] = [];
  let fileMatch;
  while ((fileMatch = filePattern.exec(text)) !== null) {
    const filePath = fileMatch[1];
    // Find the content string end (look for the closing "} pattern)
    const contentStart = fileMatch.index + fileMatch[0].length;
    // Find the end of this content string - look for "},  or "} ]
    let contentEnd = -1;
    let inStr = true;
    let esc = false;
    for (let i = contentStart; i < text.length && i < contentStart + 100000; i++) {
      const ch = text[i];
      if (esc) { esc = false; continue; }
      if (ch === "\\\\") { esc = true; continue; }
      if (ch === '"' && inStr) {
        // Check if next non-whitespace is }
        const rest = text.substring(i + 1, i + 10).trim();
        if (rest.startsWith("}")) {
          contentEnd = i;
          break;
        }
      }
    }
    if (contentEnd > contentStart) {
      const fileContent = text.substring(contentStart, contentEnd);
      try {
        // Unescape the string
        const unescaped = JSON.parse('"' + fileContent + '"');
        files.push({ path: filePath, content: unescaped });
      } catch {}
    }
  }

  return files;
}

'''

content = content[:old_start] + new_extract + content[old_end:]

with open(DAEMON_PATH, "w") as f:
    f.write(content)

# Verify
with open(DAEMON_PATH, "r") as f:
    verify = f.read()

checks = {
    "extractJSON exists": "function extractJSON" in verify,
    "bracket matching": "depth tracking" in verify,
    "Strategy 4 fallback": "Last resort" in verify,
    "file object pattern": '"path"' in verify and "bestResult" in verify,
}

print("=== Extract JSON Fix ===")
all_ok = True
for k, v in checks.items():
    status = "OK" if v else "FAIL"
    if not v: all_ok = False
    print(f"  [{status}] {k}")

print(f"\n{'SUCCESS' if all_ok else 'FAIL'}")
