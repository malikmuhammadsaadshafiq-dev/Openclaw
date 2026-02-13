DAEMON = "/root/mvp-factory/daemon/mvp-factory-daemon.ts"

with open(DAEMON, "r") as f:
    content = f.read()

with open("/tmp/expo_deploy_func.ts", "r") as f:
    new_func = f.read()

# Find and replace the deployToExpo function
start_marker = "async function deployToExpo(projectPath: string, projectName: string): Promise<string> {"
end_marker = "\nasync function pushToGithub("

start = content.find(start_marker)
end = content.find(end_marker)

if start < 0:
    print("ERROR: Could not find deployToExpo function start")
elif end < 0:
    print("ERROR: Could not find pushToGithub marker")
else:
    content = content[:start] + new_func.strip() + "\n" + content[end:]
    with open(DAEMON, "w") as f:
        f.write(content)
    print(f"Replaced deployToExpo (chars {start}-{end})")
    print("Done!")
