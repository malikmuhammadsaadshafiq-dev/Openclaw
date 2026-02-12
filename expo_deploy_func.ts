async function deployToExpo(projectPath: string, projectName: string): Promise<string> {
  if (!CONFIG.expo.token) return "";

  await logger.log("📱 Publishing to Expo Go...");

  try {
    // Fix app.json with correct owner and slug
    const appJsonPath = path.join(projectPath, "app.json");
    try {
      const raw = await fs.readFile(appJsonPath, "utf-8");
      const appJson = JSON.parse(raw);
      appJson.expo = appJson.expo || {};
      appJson.expo.name = appJson.expo.name || projectName;
      appJson.expo.slug = projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
      appJson.expo.version = appJson.expo.version || "1.0.0";
      appJson.expo.platforms = appJson.expo.platforms || ["ios", "android"];
      appJson.expo.owner = "malikmuhammadsaadshafiq-dev";
      await fs.writeFile(appJsonPath, JSON.stringify(appJson, null, 2));
    } catch {
      await fs.writeFile(appJsonPath, JSON.stringify({
        expo: {
          name: projectName,
          slug: projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
          version: "1.0.0",
          platforms: ["ios", "android"],
          owner: "malikmuhammadsaadshafiq-dev",
        },
      }, null, 2));
    }

    // Auto-detect missing npm packages from import statements
    try {
      const { stdout: fileListStr } = await execAsync(
        `find "${projectPath}" \\( -name '*.tsx' -o -name '*.ts' -o -name '*.js' \\) -not -path '*/node_modules/*'`,
        { timeout: 10000 }
      );
      const fileList = fileListStr.trim().split("\n").filter(Boolean);
      const missingPkgs = new Set<string>();

      for (const file of fileList) {
        try {
          const code = await fs.readFile(file, "utf-8");
          const importMatches = code.match(/from\s+['"]([^./][^'"]+)['"]/g) || [];
          for (const imp of importMatches) {
            const pkg = imp.match(/from\s+['"]([^'"]+)['"]/)?.[1] || "";
            const basePkg = pkg.startsWith("@") ? pkg.split("/").slice(0, 2).join("/") : pkg.split("/")[0];
            if (basePkg) {
              const pkgPath = path.join(projectPath, "node_modules", basePkg);
              const exists = await fs.access(pkgPath).then(() => true).catch(() => false);
              if (!exists) missingPkgs.add(basePkg);
            }
          }
        } catch {}
      }

      if (missingPkgs.size > 0) {
        const pkgList = Array.from(missingPkgs).join(" ");
        await logger.log(`📦 Installing missing packages: ${pkgList}`);
        await execAsync(`cd "${projectPath}" && npm install ${pkgList} 2>&1 || true`, { timeout: 120000 });
      }
    } catch {}

    // Install all dependencies
    await execAsync(`cd "${projectPath}" && npm install 2>&1 || true`, { timeout: 120000 });

    // Initialize EAS project
    await execAsync(
      `cd "${projectPath}" && EXPO_TOKEN=${CONFIG.expo.token} npx eas init --force --non-interactive 2>&1 || true`,
      { timeout: 30000 }
    );

    // Create eas.json if missing
    const easJsonPath = path.join(projectPath, "eas.json");
    const easExists = await fs.access(easJsonPath).then(() => true).catch(() => false);
    if (!easExists) {
      await fs.writeFile(easJsonPath, JSON.stringify({
        build: { preview: { distribution: "internal" }, production: {} },
        submit: { production: {} },
      }, null, 2));
    }

    // Publish to Expo Go
    const { stdout } = await execAsync(
      `cd "${projectPath}" && EXPO_TOKEN=${CONFIG.expo.token} npx eas update --branch default --message "MVP Factory: ${projectName}" --non-interactive 2>&1`,
      { timeout: 300000 }
    );

    await logger.log("✅ Published to Expo Go");
    const urlMatch = stdout.match(/https:\/\/expo\.dev[^\s]*/);
    const expoUrl = urlMatch ? urlMatch[0] : `https://expo.dev/@malikmuhammadsaadshafiq-dev/${projectName}`;
    await logger.log(`📱 Expo: ${expoUrl}`);
    return expoUrl;
  } catch (error) {
    await logger.log(`Expo publish error: ${error}`, "WARN");
  }
  return "";
}
