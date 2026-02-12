import { Skill, SkillContext } from '@openclaw/sdk';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

interface Idea {
  id: string;
  title: string;
  description: string;
  problem: string;
  features: string[];
  techStack: string;
  type: 'web' | 'mobile' | 'saas' | 'api';
}

interface GeneratedFile {
  path: string;
  content: string;
}

export class MobileBuilderSkill extends Skill {
  name = 'mobile-builder';
  outputDir = process.env.MVP_OUTPUT_DIR || '/root/mvp-projects';

  async generateMobileApp(ctx: SkillContext, idea: Idea): Promise<string> {
    const projectName = this.slugify(idea.title);
    const projectPath = path.join(this.outputDir, 'mobile', projectName);

    ctx.log(`Generating Mobile App: ${idea.title}`);
    ctx.log(`Project path: ${projectPath}`);

    await fs.mkdir(projectPath, { recursive: true });

    // Generate all files
    const files = await this.generateAllFiles(ctx, idea);

    for (const file of files) {
      const filePath = path.join(projectPath, file.path);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, file.content);
      ctx.log(`Created: ${file.path}`);
    }

    // Setup project
    await this.setupProject(ctx, projectPath);

    return projectPath;
  }

  async generateAllFiles(ctx: SkillContext, idea: Idea): Promise<GeneratedFile[]> {
    const prompt = `You are an expert React Native/Expo developer. Generate a complete mobile app MVP for:

**Title**: ${idea.title}
**Description**: ${idea.description}
**Problem**: ${idea.problem}
**Features**: ${idea.features.join(', ')}

Generate a complete Expo Router app with:
1. Expo SDK 50+ with TypeScript
2. File-based routing (app/ directory)
3. NativeWind for styling (Tailwind for RN)
4. Zustand for state management
5. Supabase for backend
6. Modern, native-feeling UI
7. All features fully implemented

Return JSON array of files:
[
  {"path": "package.json", "content": "..."},
  {"path": "app/_layout.tsx", "content": "..."},
  {"path": "app/index.tsx", "content": "..."},
  ...
]

Include ALL files:
- package.json (expo, expo-router, nativewind, zustand, @supabase/supabase-js)
- app.json (Expo config)
- tsconfig.json
- tailwind.config.js
- babel.config.js
- app/_layout.tsx (root layout with providers)
- app/index.tsx (home screen)
- app/(tabs)/* (if using tabs)
- components/* (reusable components)
- lib/supabase.ts
- store/* (zustand stores)
- .env.example
- README.md

Make it COMPLETE and WORKING. No placeholders.`;

    const response = await ctx.llm.complete(prompt, {
      maxTokens: 30000,
      temperature: 0.3,
    });

    try {
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found');
    } catch {
      return this.generateBasicMobileStructure(idea);
    }
  }

  generateBasicMobileStructure(idea: Idea): GeneratedFile[] {
    const projectName = this.slugify(idea.title);

    return [
      {
        path: 'package.json',
        content: JSON.stringify({
          name: projectName,
          version: '1.0.0',
          main: 'expo-router/entry',
          scripts: {
            start: 'expo start',
            android: 'expo start --android',
            ios: 'expo start --ios',
            web: 'expo start --web',
          },
          dependencies: {
            expo: '~50.0.0',
            'expo-router': '~3.4.0',
            'expo-status-bar': '~1.11.0',
            'expo-linking': '~6.2.0',
            'expo-constants': '~15.4.0',
            react: '18.2.0',
            'react-native': '0.73.0',
            'react-native-safe-area-context': '4.8.0',
            'react-native-screens': '~3.29.0',
            nativewind: '^2.0.11',
            zustand: '^4.5.0',
            '@supabase/supabase-js': '^2.39.0',
            '@expo/vector-icons': '^14.0.0',
          },
          devDependencies: {
            '@babel/core': '^7.20.0',
            '@types/react': '~18.2.0',
            tailwindcss: '^3.3.0',
            typescript: '^5.1.0',
          },
        }, null, 2),
      },
      {
        path: 'app.json',
        content: JSON.stringify({
          expo: {
            name: idea.title,
            slug: projectName,
            version: '1.0.0',
            orientation: 'portrait',
            scheme: projectName,
            platforms: ['ios', 'android'],
            ios: { supportsTablet: true },
            android: { adaptiveIcon: { backgroundColor: '#000000' } },
            extra: { eas: { projectId: 'your-project-id' } },
          },
        }, null, 2),
      },
      {
        path: 'tsconfig.json',
        content: JSON.stringify({
          extends: 'expo/tsconfig.base',
          compilerOptions: {
            strict: true,
            paths: { '@/*': ['./*'] },
          },
          include: ['**/*.ts', '**/*.tsx', '.expo/types/**/*.ts', 'expo-env.d.ts'],
        }, null, 2),
      },
      {
        path: 'tailwind.config.js',
        content: `module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}`,
      },
      {
        path: 'babel.config.js',
        content: `module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['nativewind/babel'],
  };
};`,
      },
      {
        path: 'app/_layout.tsx',
        content: `import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#1f2937' },
          headerTintColor: '#fff',
          contentStyle: { backgroundColor: '#111827' },
        }}
      />
    </>
  );
}`,
      },
      {
        path: 'app/index.tsx',
        content: `import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchable = styled(TouchableOpacity);

export default function Home() {
  return (
    <ScrollView className="flex-1 bg-gray-900">
      <StyledView className="p-6">
        <StyledText className="text-4xl font-bold text-white mb-4">
          ${idea.title}
        </StyledText>
        <StyledText className="text-lg text-gray-300 mb-8">
          ${idea.description}
        </StyledText>

        <StyledView className="space-y-4">
          ${idea.features.map(f => `
          <StyledView className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <StyledText className="text-white font-semibold">${f}</StyledText>
          </StyledView>`).join('')}
        </StyledView>

        <StyledTouchable className="mt-8 bg-blue-600 rounded-xl p-4 items-center">
          <StyledText className="text-white font-bold text-lg">Get Started</StyledText>
        </StyledTouchable>
      </StyledView>
    </ScrollView>
  );
}`,
      },
      {
        path: 'lib/supabase.ts',
        content: `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);`,
      },
      {
        path: '.env.example',
        content: `EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key`,
      },
      {
        path: 'README.md',
        content: `# ${idea.title}

${idea.description}

## Setup

\`\`\`bash
npm install
cp .env.example .env
# Add your Supabase credentials
npx expo start
\`\`\`

## Scan with Expo Go
After running \`npx expo start\`, scan the QR code with Expo Go app.

## Built by MVP Factory
Generated by OpenClaw MVP Factory using Kimi K2.5
`,
      },
    ];
  }

  async setupProject(ctx: SkillContext, projectPath: string): Promise<void> {
    ctx.log('Installing dependencies...');
    try {
      await execAsync('npm install', { cwd: projectPath, timeout: 180000 });
      ctx.log('Dependencies installed');
    } catch (error) {
      ctx.log(`npm install warning: ${error}`);
    }
  }

  async publishToExpo(ctx: SkillContext, projectPath: string, idea: Idea): Promise<string> {
    const expoToken = process.env.EXPO_TOKEN;

    if (!expoToken) {
      ctx.log('Expo token not configured, skipping publish');
      return '';
    }

    ctx.log('Publishing to Expo Go...');

    try {
      // Set Expo token
      await execAsync(`npx expo login --token ${expoToken}`, { cwd: projectPath });

      // Publish update
      const { stdout } = await execAsync('npx eas update --branch preview --message "MVP Factory build"', {
        cwd: projectPath,
        timeout: 300000,
      });

      ctx.log('Published to Expo Go!');
      ctx.log(stdout);

      // Extract QR code URL or publish URL
      const urlMatch = stdout.match(/https:\/\/expo\.dev\/[^\s]+/);
      return urlMatch ? urlMatch[0] : 'Published successfully';
    } catch (error) {
      ctx.log(`Expo publish failed: ${error}`);
      return '';
    }
  }

  async pushToGithub(ctx: SkillContext, projectPath: string, idea: Idea): Promise<string> {
    const projectName = `${this.slugify(idea.title)}-mobile`;
    const githubUsername = process.env.GITHUB_USERNAME;
    const githubToken = process.env.GITHUB_TOKEN;

    if (!githubUsername || !githubToken) {
      ctx.log('GitHub not configured');
      return '';
    }

    try {
      // Create repo
      await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName,
          description: `${idea.title} - React Native app`,
          private: false,
        }),
      });

      const repoUrl = `https://github.com/${githubUsername}/${projectName}`;

      // Git operations
      await execAsync('git init', { cwd: projectPath });
      await execAsync('git add .', { cwd: projectPath });
      await execAsync(`git commit -m "Initial mobile MVP: ${idea.title}"`, { cwd: projectPath });
      await execAsync('git branch -M main', { cwd: projectPath });
      await execAsync(
        `git remote add origin https://${githubToken}@github.com/${githubUsername}/${projectName}.git`,
        { cwd: projectPath }
      );
      await execAsync('git push -u origin main', { cwd: projectPath });

      ctx.log(`Pushed to: ${repoUrl}`);
      return repoUrl;
    } catch (error) {
      ctx.log(`GitHub push failed: ${error}`);
      return '';
    }
  }

  async buildMobileApp(ctx: SkillContext, idea: Idea): Promise<{
    projectPath: string;
    githubUrl: string;
    expoUrl: string;
  }> {
    const projectPath = await this.generateMobileApp(ctx, idea);
    const githubUrl = await this.pushToGithub(ctx, projectPath, idea);
    const expoUrl = await this.publishToExpo(ctx, projectPath, idea);

    // Move idea to built
    const ideasDir = path.join(this.outputDir, 'ideas');
    const builtDir = path.join(this.outputDir, 'built');
    await fs.mkdir(builtDir, { recursive: true });

    try {
      await fs.rename(
        path.join(ideasDir, `${idea.id}.json`),
        path.join(builtDir, `${idea.id}.json`)
      );
    } catch {}

    return { projectPath, githubUrl, expoUrl };
  }

  slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  async run(ctx: SkillContext): Promise<void> {
    ctx.log('Checking for mobile ideas to build...');

    const ideasDir = path.join(this.outputDir, 'ideas');

    try {
      const files = await fs.readdir(ideasDir);

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const content = await fs.readFile(path.join(ideasDir, file), 'utf-8');
        const idea: Idea = JSON.parse(content);

        if (idea.type === 'mobile') {
          ctx.log(`Building mobile app: ${idea.title}`);
          const result = await this.buildMobileApp(ctx, idea);
          ctx.log(`Mobile app built!`);
          ctx.log(`Path: ${result.projectPath}`);
          if (result.githubUrl) ctx.log(`GitHub: ${result.githubUrl}`);
          if (result.expoUrl) ctx.log(`Expo: ${result.expoUrl}`);
          return;
        }
      }

      ctx.log('No mobile ideas in queue');
    } catch (error) {
      ctx.log(`Error: ${error}`);
    }
  }
}

export default MobileBuilderSkill;
