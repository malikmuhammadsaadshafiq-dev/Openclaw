import re

DAEMON = "/root/mvp-factory/daemon/mvp-factory-daemon.ts"

with open(DAEMON, "r") as f:
    content = f.read()

# 1. Read the expo function from file
with open("/tmp/expo_func.ts", "r") as f:
    expo_func = f.read()

# 2. Insert deployToExpo before pushToGithub
marker = "async function pushToGithub("
if "deployToExpo" not in content:
    content = content.replace(marker, expo_func + "\n" + marker, 1)
    print("1. Added deployToExpo function")
else:
    print("1. deployToExpo already exists")

# 3. Add expoUrl variable declaration
if 'let expoUrl = ""' not in content:
    content = content.replace(
        'let liveUrl = "";',
        'let liveUrl = "";\n    let expoUrl = "";',
        1
    )
    print("2. Added expoUrl declaration")
else:
    print("2. expoUrl already declared")

# 4. Add expo deployment after Vercel for mobile apps
if "deployToExpo(projectPath" not in content:
    pattern = r'(liveUrl = await deployToVercel\(projectPath, projectName\);\s*\n\s*\})'
    replacement = r"""\1

    // Deploy mobile apps to Expo Go
    if (idea.type === "mobile") {
      expoUrl = await deployToExpo(projectPath, projectName);
    }"""
    content = re.sub(pattern, replacement, content, count=1)
    print("3. Added Expo deployment call for mobile apps")
else:
    print("3. Expo deployment call already exists")

# 5. Add expoUrl to telegram notification
if 'expoUrl' not in content[content.find('msg +='):content.find('msg +=')+500] if 'msg +=' in content else True:
    live_notif = 'if (liveUrl) msg += `\\n'
    idx = content.find(live_notif)
    if idx > 0:
        end = content.find(";", idx)
        insert_point = end + 1
        content = content[:insert_point] + '\n    if (expoUrl) msg += `\\n\U0001f4f1 Expo: ${expoUrl}`;' + content[insert_point:]
        print("4. Added expoUrl to telegram notification")
    else:
        print("4. Could not find notification marker")

# 6. Add expoUrl to builtIdea object
built_idx = content.find("const builtIdea")
if built_idx > 0:
    built_section = content[built_idx:built_idx+300]
    if "expoUrl" not in built_section:
        content = content.replace(
            "githubUrl, liveUrl,",
            "githubUrl, liveUrl, expoUrl,",
            1
        )
        print("5. Added expoUrl to builtIdea")
    else:
        print("5. expoUrl already in builtIdea")
else:
    print("5. Could not find builtIdea")

with open(DAEMON, "w") as f:
    f.write(content)

print("\nDone!")
