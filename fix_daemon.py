#!/usr/bin/env python3
"""Fix the kimiComplete function in the MVP Factory daemon to use streaming."""

import sys

filepath = "/root/mvp-factory/daemon/mvp-factory-daemon.ts"

with open(filepath, "r") as f:
    content = f.read()

start = content.find("async function kimiComplete(")
end = content.find("function extractJSON(")

if start == -1 or end == -1:
    print("ERROR: Could not find function boundaries")
    sys.exit(1)

# Build the new function character by character to avoid escape issues
lines = [
    'async function kimiComplete(prompt: string, maxTokens = 16384, retries = 3, temperature = 0.7): Promise<string> {',
    '  for (let attempt = 1; attempt <= retries; attempt++) {',
    '    try {',
    '      const controller = new AbortController();',
    '      const abortTimer = setTimeout(() => controller.abort(), 900000);',
    '',
    '      await logger.log(`API attempt ${attempt}/${retries} (streaming)...`);',
    '',
    '      const response = await fetch(`${CONFIG.nvidia.baseUrl}/chat/completions`, {',
    '        method: "POST",',
    '        headers: {',
    '          Authorization: `Bearer ${CONFIG.nvidia.apiKey}`,',
    '          "Content-Type": "application/json",',
    '        },',
    '        body: JSON.stringify({',
    '          model: CONFIG.nvidia.model,',
    '          messages: [{ role: "user", content: prompt }],',
    '          max_tokens: maxTokens,',
    '          temperature,',
    '          stream: true,',
    '        }),',
    '        signal: controller.signal,',
    '      });',
    '',
    '      clearTimeout(abortTimer);',
    '      if (!response.ok) throw new Error(`API ${response.status}`);',
    '',
    '      const reader = response.body!.getReader();',
    '      const decoder = new TextDecoder();',
    '      let fullContent = "";',
    '      let chunkCount = 0;',
    '',
    '      while (true) {',
    '        const { done, value } = await reader.read();',
    '        if (done) break;',
    '        const text = decoder.decode(value, { stream: true });',
    '        for (const line of text.split("' + '\\' + 'n")) {',
    '          if (!line.startsWith("data: ")) continue;',
    '          const payload = line.slice(6).trim();',
    '          if (payload === "[DONE]") continue;',
    '          try {',
    '            const parsed = JSON.parse(payload);',
    '            const delta = parsed.choices?.[0]?.delta?.content || "";',
    '            fullContent += delta;',
    '            chunkCount++;',
    '          } catch {}',
    '        }',
    '      }',
    '',
    '      if (chunkCount > 0) await logger.log(`Received ${chunkCount} chunks, ${fullContent.length} chars`);',
    '      if (!fullContent) throw new Error("Empty response");',
    '      return fullContent;',
    '    } catch (error) {',
    '      await logger.log(`Attempt ${attempt} failed: ${error}`, "WARN");',
    '      if (attempt < retries) await sleep(10000 * attempt);',
    '      else throw error;',
    '    }',
    '  }',
    '  throw new Error("All retries failed");',
    '}',
    '',
]

new_func = '\n'.join(lines) + '\n'

content = content[:start] + new_func + content[end:]

with open(filepath, "w") as f:
    f.write(content)

# Verify
with open(filepath, "r") as f:
    verify = f.read()

checks = {
    "stream: true": "stream: true" in verify,
    "split backslash-n": '\\n' in verify and 'split(' in verify,
    "function exists": "async function kimiComplete" in verify,
    "extractJSON exists": "function extractJSON" in verify,
}

all_ok = all(checks.values())
for k, v in checks.items():
    print(f"  {k}: {'OK' if v else 'FAIL'}")

if all_ok:
    print("SUCCESS: All checks passed")
else:
    print("WARNING: Some checks failed")
