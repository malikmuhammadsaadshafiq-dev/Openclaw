#!/usr/bin/env python3
"""Patch MVP Factory daemon to fix Vercel deployment failures.

Root causes of failures:
1. module_not_found: AI generates code importing packages not in package.json
2. import_error: Mismatched default/named imports
3. lint_or_type_error: TypeScript errors that bypass ignoreBuildErrors

Fixes:
1. Expand KNOWN_GOOD_VERSIONS with commonly used packages
2. Add autoDetectAndInstallMissingPackages() for web projects
3. Add fixImportExportMismatches() function
4. Add verifyBuildLocally() for pre-deploy checking
5. Wire new functions into buildMVP flow
6. Improve AI prompt for consistent named exports
7. Add lucide-react, clsx, tailwind-merge to required deps
8. Add @types/react-dom to required devDeps
"""

DAEMON_PATH = "/root/mvp-factory/daemon/mvp-factory-daemon.ts"

with open(DAEMON_PATH, "r") as f:
    code = f.read()

changes = 0

# =====================================================
# FIX 1: Expand KNOWN_GOOD_VERSIONS with commonly used packages
# =====================================================
old_versions = '''const KNOWN_GOOD_VERSIONS: Record<string, string> = {
  "next": "^14.2.21",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "typescript": "^5.7.3",
  "@types/node": "^20.17.16",
  "@types/react": "^18.3.18",
  "@types/react-dom": "^18.3.5",
  "tailwindcss": "^3.4.17",
  "postcss": "^8.5.1",
  "autoprefixer": "^10.4.20",
  "eslint": "^8.56.0",
  "eslint-config-next": "^14.2.21",
  "@supabase/supabase-js": "^2.49.1",
  "lucide-react": "^0.469.0",
  "framer-motion": "^11.18.0",
  "recharts": "^2.15.0",
  "date-fns": "^4.1.0",
};'''

new_versions = '''const KNOWN_GOOD_VERSIONS: Record<string, string> = {
  "next": "^14.2.21",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "typescript": "^5.7.3",
  "@types/node": "^20.17.16",
  "@types/react": "^18.3.18",
  "@types/react-dom": "^18.3.5",
  "tailwindcss": "^3.4.17",
  "postcss": "^8.5.1",
  "autoprefixer": "^10.4.20",
  "eslint": "^8.56.0",
  "eslint-config-next": "^14.2.21",
  "@supabase/supabase-js": "^2.49.1",
  "lucide-react": "^0.469.0",
  "framer-motion": "^11.18.0",
  "recharts": "^2.15.0",
  "date-fns": "^4.1.0",
  "clsx": "^2.1.0",
  "tailwind-merge": "^2.2.0",
  "class-variance-authority": "^0.7.0",
  "@radix-ui/react-dialog": "^1.0.5",
  "@radix-ui/react-dropdown-menu": "^2.0.6",
  "@radix-ui/react-slot": "^1.0.2",
  "@radix-ui/react-toast": "^1.1.5",
  "@radix-ui/react-tabs": "^1.0.4",
  "zustand": "^4.5.0",
  "react-hot-toast": "^2.4.1",
  "react-icons": "^5.0.1",
  "uuid": "^9.0.0",
  "zod": "^3.22.0",
  "sonner": "^1.4.0",
  "react-hook-form": "^7.50.0",
  "@heroicons/react": "^2.1.1",
  "chart.js": "^4.4.1",
  "react-chartjs-2": "^5.2.0",
  "cmdk": "^0.2.0",
  "react-dropzone": "^14.2.3",
  "react-markdown": "^9.0.1",
  "next-themes": "^0.2.1",
  "sharp": "^0.33.2",
  "axios": "^1.6.7",
};'''

if old_versions in code:
    code = code.replace(old_versions, new_versions)
    changes += 1
    print("  [OK] Fix 1: Expanded KNOWN_GOOD_VERSIONS with 20+ packages")
else:
    print("  [SKIP] Fix 1: KNOWN_GOOD_VERSIONS not found (may already be patched)")

# =====================================================
# FIX 2: Add new functions before sanitizePackageJson
# =====================================================
NEW_FUNCTIONS = '''
// ============= AUTO-DETECT MISSING PACKAGES (WEB) =============

async function autoDetectAndInstallMissingPackages(projectPath: string): Promise<void> {
  await logger.log("Scanning imports for missing packages...");

  try {
    const exts = [".tsx", ".ts", ".jsx", ".js"];
    async function walkSrc2(dir: string): Promise<string[]> {
      const files: string[] = [];
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
          if (entry.isDirectory()) files.push(...await walkSrc2(full));
          else if (exts.some(ext => entry.name.endsWith(ext))) files.push(full);
        }
      } catch {}
      return files;
    }

    const sourceFiles = await walkSrc2(projectPath);
    const importedPackages = new Set<string>();

    for (const file of sourceFiles) {
      try {
        const content = await fs.readFile(file, "utf-8");
        // Match: import ... from 'package' or require('package')
        const lines = content.split("\\n");
        for (const line of lines) {
          const fromMatch = line.match(/from\\s+['"]([@a-zA-Z][^'"]*)['"]/);
          const requireMatch = line.match(/require\\s*\\(\\s*['"]([@a-zA-Z][^'"]*)['"]/);
          const pkg = (fromMatch && fromMatch[1]) || (requireMatch && requireMatch[1]);
          if (pkg) {
            const basePkg = pkg.startsWith("@") ? pkg.split("/").slice(0, 2).join("/") : pkg.split("/")[0];
            const builtins = ["react", "react-dom", "next", "fs", "path", "util", "crypto", "stream", "http", "https", "url", "os", "child_process", "events", "buffer", "querystring", "assert", "tty", "net", "dns", "zlib", "process"];
            if (!builtins.includes(basePkg) && !basePkg.startsWith("next/")) {
              importedPackages.add(basePkg);
            }
          }
        }
      } catch {}
    }

    if (importedPackages.size === 0) return;

    // Read current package.json
    const pkgPath = path.join(projectPath, "package.json");
    let pkg: any = {};
    try {
      pkg = JSON.parse(await fs.readFile(pkgPath, "utf-8"));
    } catch {}

    const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    const missingPackages: string[] = [];

    for (const pkgName of importedPackages) {
      if (!allDeps[pkgName]) {
        missingPackages.push(pkgName);
      }
    }

    if (missingPackages.length === 0) {
      await logger.log("All imported packages are in package.json");
      return;
    }

    await logger.log(`Found ${missingPackages.length} missing packages: ${missingPackages.join(", ")}`);

    if (!pkg.dependencies) pkg.dependencies = {};
    for (const pkgName of missingPackages) {
      if (KNOWN_GOOD_VERSIONS[pkgName]) {
        pkg.dependencies[pkgName] = KNOWN_GOOD_VERSIONS[pkgName];
      } else {
        pkg.dependencies[pkgName] = "latest";
      }
    }

    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2));
    await logger.log(`Added ${missingPackages.length} missing packages to package.json`);
  } catch (error) {
    await logger.log(`Import scan error: ${error}`, "WARN");
  }
}

// ============= FIX IMPORT/EXPORT MISMATCHES =============

async function fixImportExportMismatches(projectPath: string): Promise<void> {
  await logger.log("Checking for import/export mismatches...");

  try {
    const exts = [".tsx", ".ts", ".jsx", ".js"];
    async function walkSrc3(dir: string): Promise<string[]> {
      const files: string[] = [];
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
          if (entry.isDirectory()) files.push(...await walkSrc3(full));
          else if (exts.some(ext => entry.name.endsWith(ext))) files.push(full);
        }
      } catch {}
      return files;
    }

    const sourceFiles = await walkSrc3(projectPath);

    // Build map of file -> export info
    const exportMap = new Map<string, { hasDefault: boolean; namedExports: string[] }>();
    for (const file of sourceFiles) {
      try {
        const content = await fs.readFile(file, "utf-8");
        const hasDefault = /export\\s+default\\s+/.test(content);
        const namedExports: string[] = [];
        const re = /export\\s+(?:function|const|class)\\s+(\\w+)/g;
        let m;
        while ((m = re.exec(content)) !== null) {
          if (m[1]) namedExports.push(m[1]);
        }
        const relPath = path.relative(projectPath, file);
        exportMap.set(relPath, { hasDefault, namedExports });
      } catch {}
    }

    let fixCount = 0;
    for (const file of sourceFiles) {
      try {
        let content = await fs.readFile(file, "utf-8");
        let modified = false;

        // Find default imports from local files: import Foo from '@/...' or './...'
        const re = /import\\s+(\\w+)\\s+from\\s+['"](@\\/[^'"]+|\\.\\/?[^'"]+|\\.\\.\\/[^'"]+)['"]/g;
        let match;
        const replacements: Array<[string, string]> = [];

        while ((match = re.exec(content)) !== null) {
          const importName = match[1];
          const importPath = match[2];

          let resolvedRelPath = "";
          if (importPath.startsWith("@/")) {
            resolvedRelPath = "src/" + importPath.slice(2);
          } else {
            resolvedRelPath = path.relative(projectPath, path.resolve(path.dirname(file), importPath));
          }

          const candidates = [resolvedRelPath, resolvedRelPath + ".tsx", resolvedRelPath + ".ts", resolvedRelPath + ".jsx", resolvedRelPath + ".js"];
          let exportInfo = null;
          for (const c of candidates) {
            if (exportMap.has(c)) {
              exportInfo = exportMap.get(c)!;
              break;
            }
          }

          if (exportInfo && !exportInfo.hasDefault && exportInfo.namedExports.includes(importName)) {
            const quote = match[0].includes("'") ? "'" : '"';
            replacements.push([match[0], `import { ${importName} } from ${quote}${importPath}${quote}`]);
          }
        }

        for (const [oldStr, newStr] of replacements) {
          content = content.replace(oldStr, newStr);
          modified = true;
          fixCount++;
        }

        if (modified) {
          await fs.writeFile(file, content);
        }
      } catch {}
    }

    if (fixCount > 0) {
      await logger.log(`Fixed ${fixCount} import/export mismatches`);
    } else {
      await logger.log("No import/export mismatches found");
    }
  } catch (error) {
    await logger.log(`Import/export fix error: ${error}`, "WARN");
  }
}

// ============= LOCAL BUILD VERIFICATION =============

async function verifyBuildLocally(projectPath: string): Promise<boolean> {
  await logger.log("Running local build verification...");

  try {
    await execAsync(
      `cd "${projectPath}" && npm run build 2>&1`,
      { timeout: 180000 }
    );
    await logger.log("Local build verified successfully");
    return true;
  } catch (error) {
    const errStr = String(error);
    await logger.log("Local build failed, attempting auto-fix...", "WARN");

    // Extract missing modules from error output
    const allMatches = [
      ...Array.from(errStr.matchAll(/Module not found[^']*'([^']+)'/g)),
      ...Array.from(errStr.matchAll(/Cannot find module '([^']+)'/g)),
    ];

    const missingModules = new Set<string>();
    for (const m of allMatches) {
      const mod = m[1];
      const basePkg = mod.startsWith("@") ? mod.split("/").slice(0, 2).join("/") : mod.split("/")[0];
      const skipPrefixes = [".", "/", "~"];
      if (!skipPrefixes.some(ch => basePkg.startsWith(ch))) {
        missingModules.add(basePkg);
      }
    }

    if (missingModules.size > 0) {
      const pkgList = Array.from(missingModules).join(" ");
      await logger.log(`Installing build-time missing packages: ${pkgList}`);
      try {
        await execAsync(`cd "${projectPath}" && npm install ${pkgList} --legacy-peer-deps 2>&1 || true`, { timeout: 60000 });
        await execAsync(`cd "${projectPath}" && npm run build 2>&1`, { timeout: 180000 });
        await logger.log("Build succeeded after installing missing packages");
        return true;
      } catch {
        await logger.log("Build still failing after fix attempt", "WARN");
      }
    }

    return false;
  }
}

'''

marker = "// ============= PACKAGE SANITIZER ============="
if marker in code:
    code = code.replace(marker, NEW_FUNCTIONS + "\n" + marker)
    changes += 1
    print("  [OK] Fix 2: Added 3 new functions (autoDetect, fixMismatches, verifyBuild)")
else:
    print("  [FAIL] Fix 2: Could not find PACKAGE SANITIZER marker")

# =====================================================
# FIX 3: Wire new functions into buildMVP flow
# =====================================================
old_install = '''    // Install dependencies
    if (idea.type !== "extension") {
      await logger.log("\xf0\x9f\x93\xa6 Installing dependencies...");
      try {
        await execAsync("npm install 2>&1 || true", { cwd: projectPath, timeout: 120000 });
      } catch {}
    }'''

new_install = '''    // Install dependencies
    if (idea.type !== "extension") {
      // Auto-detect and install missing packages (scan imports for web/saas)
      if (idea.type !== "mobile") {
        await autoDetectAndInstallMissingPackages(projectPath);
        await fixImportExportMismatches(projectPath);
      }

      await logger.log("\xf0\x9f\x93\xa6 Installing dependencies...");
      try {
        await execAsync("npm install --legacy-peer-deps 2>&1 || true", { cwd: projectPath, timeout: 120000 });
      } catch {}

      // Local build verification for web/saas apps
      if (idea.type === "web" || idea.type === "saas") {
        const buildOk = await verifyBuildLocally(projectPath);
        if (!buildOk) {
          await logger.log("Build verification failed, will still attempt Vercel deploy", "WARN");
        }
      }
    }'''

if old_install in code:
    code = code.replace(old_install, new_install)
    changes += 1
    print("  [OK] Fix 3: Wired new functions into buildMVP flow")
else:
    print("  [FAIL] Fix 3: Could not find Install dependencies block")

# =====================================================
# FIX 4: Improve AI prompt for consistent named exports
# =====================================================
old_prompt = "10. All components must have 'use client' directive"
new_prompt = "10. All components MUST use NAMED exports (export function ComponentName) and importers MUST use NAMED imports: import { ComponentName } from '@/components/ComponentName'. NEVER use export default for components. All component files must have 'use client' directive"

if old_prompt in code:
    code = code.replace(old_prompt, new_prompt, 1)
    changes += 1
    print("  [OK] Fix 4: Improved AI prompt for consistent named exports")
else:
    print("  [SKIP] Fix 4: Prompt line already updated")

# =====================================================
# FIX 5: Add lucide-react, clsx, tailwind-merge to required deps
# =====================================================
old_required = '''    // Ensure required dependencies exist
    if (!pkg.dependencies) pkg.dependencies = {};
    if (!pkg.dependencies.next) pkg.dependencies.next = "^14.2.21";
    if (!pkg.dependencies.react) pkg.dependencies.react = "^18.3.1";
    if (!pkg.dependencies["react-dom"]) pkg.dependencies["react-dom"] = "^18.3.1";'''

new_required = '''    // Ensure required dependencies exist
    if (!pkg.dependencies) pkg.dependencies = {};
    if (!pkg.dependencies.next) pkg.dependencies.next = "^14.2.21";
    if (!pkg.dependencies.react) pkg.dependencies.react = "^18.3.1";
    if (!pkg.dependencies["react-dom"]) pkg.dependencies["react-dom"] = "^18.3.1";
    // Add commonly-used packages that AI frequently imports
    if (!pkg.dependencies.clsx && !pkg.devDependencies?.clsx) pkg.dependencies.clsx = "^2.1.0";
    if (!pkg.dependencies["tailwind-merge"] && !pkg.devDependencies?.["tailwind-merge"]) pkg.dependencies["tailwind-merge"] = "^2.2.0";
    if (!pkg.dependencies["lucide-react"] && !pkg.devDependencies?.["lucide-react"]) pkg.dependencies["lucide-react"] = "^0.469.0";'''

if old_required in code:
    code = code.replace(old_required, new_required)
    changes += 1
    print("  [OK] Fix 5: Added lucide-react, clsx, tailwind-merge to required deps")
else:
    print("  [SKIP] Fix 5: Required deps block already updated")

# =====================================================
# FIX 6: Add @types/react-dom to required devDeps
# =====================================================
old_devdeps = '''    const requiredDevDeps: Record<string, string> = {
      "typescript": "^5.7.3",
      "@types/node": "^20.17.16",
      "@types/react": "^18.3.18",
    };'''

new_devdeps = '''    const requiredDevDeps: Record<string, string> = {
      "typescript": "^5.7.3",
      "@types/node": "^20.17.16",
      "@types/react": "^18.3.18",
      "@types/react-dom": "^18.3.5",
    };'''

if old_devdeps in code:
    code = code.replace(old_devdeps, new_devdeps)
    changes += 1
    print("  [OK] Fix 6: Added @types/react-dom to required devDeps")
else:
    print("  [SKIP] Fix 6: devDeps already updated")

# Write patched file
with open(DAEMON_PATH, "w") as f:
    f.write(code)

print(f"\nDone! Applied {changes}/6 patches to {DAEMON_PATH}")
print(f"File size: {len(code)} chars, {code.count(chr(10))} lines")
