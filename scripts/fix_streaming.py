#!/usr/bin/env python3
"""Fix the streaming parser to capture reasoning_content as fallback."""

DAEMON_PATH = "/root/mvp-factory/daemon/mvp-factory-daemon.ts"

with open(DAEMON_PATH, "r") as f:
    content = f.read()

# Replace the streaming chunk parser to capture reasoning_content
old_parser = '''      let fullContent = "";
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        for (const line of text.split("\\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") continue;
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed.choices?.[0]?.delta?.content || "";
            fullContent += delta;
            chunkCount++;
          } catch {}
        }
      }

      if (chunkCount > 0) await logger.log(`Received ${chunkCount} chunks, ${fullContent.length} chars`);
      if (!fullContent) throw new Error("Empty response");'''

new_parser = '''      let fullContent = "";
      let reasoningContent = "";
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        for (const line of text.split("\\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") continue;
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed.choices?.[0]?.delta;
            if (delta?.content) fullContent += delta.content;
            if (delta?.reasoning_content) reasoningContent += delta.reasoning_content;
            if (delta?.reasoning && !delta?.reasoning_content) reasoningContent += delta.reasoning;
            chunkCount++;
          } catch {}
        }
      }

      // Use content if available, otherwise fall back to reasoning_content (Kimi K2.5 thinking mode)
      const finalContent = fullContent || reasoningContent;
      if (chunkCount > 0) await logger.log(`Received ${chunkCount} chunks: content=${fullContent.length}, reasoning=${reasoningContent.length} chars`);
      if (!finalContent) throw new Error("Empty response");'''

if old_parser in content:
    content = content.replace(old_parser, new_parser)
    # Also replace the return statement
    content = content.replace(
        "      return fullContent;",
        "      return finalContent;",
        1  # only first occurrence
    )
    with open(DAEMON_PATH, "w") as f:
        f.write(content)
    print("SUCCESS: Streaming parser updated to capture reasoning_content as fallback")
else:
    print("ERROR: Could not find the streaming parser to replace")
    # Debug: show what's around the parser
    idx = content.find("let fullContent")
    if idx > 0:
        print("Found 'let fullContent' at index", idx)
        print("Context:", repr(content[idx:idx+100]))
    else:
        print("'let fullContent' not found")
