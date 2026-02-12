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

export class MVPBuilderSkill extends Skill {
  name = 'mvp-builder';
  outputDir = process.env.MVP_OUTPUT_DIR || '/root/mvp-projects';

  async generateProject(ctx: SkillContext, idea: Idea): Promise<string> {
    const projectName = this.slugify(idea.title);
    const projectPath = path.join(this.outputDir, projectName);

    ctx.log(`Generating MVP: ${idea.title}`);
    ctx.log(`Project path: ${projectPath}`);

    // Create project directory
    await fs.mkdir(projectPath, { recursive: true });

    // Generate all files based on idea type
    const files = await this.generateAllFiles(ctx, idea);

    // Write all files
    for (const file of files) {
      const filePath = path.join(projectPath, file.path);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, file.content);
      ctx.log(`Created: ${file.path}`);
    }

    // Initialize npm and install dependencies
    await this.setupProject(ctx, projectPath, idea);

    return projectPath;
  }

  async generateAllFiles(ctx: SkillContext, idea: Idea): Promise<GeneratedFile[]> {
    const prompt = `You are an expert full-stack developer. Generate a complete, working MVP for this idea:

**Title**: ${idea.title}
**Description**: ${idea.description}
**Problem it solves**: ${idea.problem}
**Features**: ${idea.features.join(', ')}
**Type**: ${idea.type}

Generate a complete Next.js 14 application with:
1. App Router structure
2. TailwindCSS + shadcn/ui styling
3. TypeScript throughout
4. Supabase for database (use environment variables)
5. All features implemented as working pages/components
6. Clean, modern UI
7. Proper error handling
8. Loading states

Return a JSON array of files to create:
[
  {
    "path": "package.json",
    "content": "{ ... full content ... }"
  },
  {
    "path": "src/app/page.tsx",
    "content": "... full component code ..."
  }
]

Include ALL necessary files:
- package.json with all dependencies
- tsconfig.json
- tailwind.config.ts
- next.config.js
- src/app/layout.tsx
- src/app/page.tsx (main landing/dashboard)
- src/app/globals.css
- src/components/* (all UI components)
- src/lib/* (utilities, supabase client)
- .env.example
- README.md with setup instructions

Make the code COMPLETE and WORKING. No placeholders or TODOs.
Every feature in the list should have a working implementation.`;

    const response = await ctx.llm.complete(prompt, {
      maxTokens: 30000,
      temperature: 0.3,
    });

    try {
      // Extract JSON from response
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON array found in response');
    } catch (error) {
      ctx.log(`Error parsing LLM response, generating basic structure`);
      return this.generateBasicStructure(idea);
    }
  }

  generateBasicStructure(idea: Idea): GeneratedFile[] {
    const projectName = this.slugify(idea.title);

    return [
      {
        path: 'package.json',
        content: JSON.stringify({
          name: projectName,
          version: '0.1.0',
          private: true,
          scripts: {
            dev: 'next dev',
            build: 'next build',
            start: 'next start',
            lint: 'next lint',
          },
          dependencies: {
            next: '^14.1.0',
            react: '^18.2.0',
            'react-dom': '^18.2.0',
            '@supabase/supabase-js': '^2.39.0',
            'lucide-react': '^0.312.0',
            'class-variance-authority': '^0.7.0',
            clsx: '^2.1.0',
            'tailwind-merge': '^2.2.0',
          },
          devDependencies: {
            typescript: '^5.3.0',
            '@types/node': '^20.11.0',
            '@types/react': '^18.2.0',
            '@types/react-dom': '^18.2.0',
            autoprefixer: '^10.4.17',
            postcss: '^8.4.33',
            tailwindcss: '^3.4.1',
          },
        }, null, 2),
      },
      {
        path: 'tsconfig.json',
        content: JSON.stringify({
          compilerOptions: {
            lib: ['dom', 'dom.iterable', 'esnext'],
            allowJs: true,
            skipLibCheck: true,
            strict: true,
            noEmit: true,
            esModuleInterop: true,
            module: 'esnext',
            moduleResolution: 'bundler',
            resolveJsonModule: true,
            isolatedModules: true,
            jsx: 'preserve',
            incremental: true,
            plugins: [{ name: 'next' }],
            paths: { '@/*': ['./src/*'] },
          },
          include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
          exclude: ['node_modules'],
        }, null, 2),
      },
      {
        path: 'tailwind.config.ts',
        content: `import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
export default config`,
      },
      {
        path: 'next.config.js',
        content: `/** @type {import('next').NextConfig} */
const nextConfig = {}
module.exports = nextConfig`,
      },
      {
        path: 'src/app/layout.tsx',
        content: `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '${idea.title}',
  description: '${idea.description}',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}`,
      },
      {
        path: 'src/app/globals.css',
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;`,
      },
      {
        path: 'src/app/page.tsx',
        content: `export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-5xl font-bold mb-6">${idea.title}</h1>
        <p className="text-xl text-gray-300 mb-8">${idea.description}</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${idea.features.map(f => `
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-2">${f}</h3>
            <p className="text-gray-400">Feature implementation</p>
          </div>`).join('')}
        </div>
      </div>
    </main>
  )
}`,
      },
      {
        path: '.env.example',
        content: `NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key`,
      },
      {
        path: 'README.md',
        content: `# ${idea.title}

${idea.description}

## Problem Solved
${idea.problem}

## Features
${idea.features.map(f => `- ${f}`).join('\n')}

## Getting Started

\`\`\`bash
npm install
cp .env.example .env.local
# Add your Supabase credentials to .env.local
npm run dev
\`\`\`

## Built by MVP Factory
Generated automatically by OpenClaw MVP Factory using Kimi K2.5
`,
      },
    ];
  }

  async setupProject(ctx: SkillContext, projectPath: string, idea: Idea): Promise<void> {
    ctx.log('Installing dependencies...');
    try {
      await execAsync('npm install', { cwd: projectPath, timeout: 120000 });
      ctx.log('Dependencies installed successfully');
    } catch (error) {
      ctx.log(`Warning: npm install failed, continuing anyway: ${error}`);
    }
  }

  async pushToGithub(ctx: SkillContext, projectPath: string, idea: Idea): Promise<string> {
    const projectName = this.slugify(idea.title);
    const githubUsername = process.env.GITHUB_USERNAME;
    const githubToken = process.env.GITHUB_TOKEN;

    if (!githubUsername || !githubToken) {
      ctx.log('GitHub credentials not configured, skipping push');
      return '';
    }

    ctx.log('Creating GitHub repository...');

    try {
      // Create repo via GitHub API
      const createResponse = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName,
          description: idea.description,
          private: false,
          auto_init: false,
        }),
      });

      if (!createResponse.ok && createResponse.status !== 422) {
        throw new Error(`Failed to create repo: ${createResponse.statusText}`);
      }

      const repoUrl = `https://github.com/${githubUsername}/${projectName}`;

      // Initialize git and push
      await execAsync('git init', { cwd: projectPath });
      await execAsync('git add .', { cwd: projectPath });
      await execAsync(`git commit -m "Initial MVP: ${idea.title}"`, { cwd: projectPath });
      await execAsync('git branch -M main', { cwd: projectPath });
      await execAsync(
        `git remote add origin https://${githubToken}@github.com/${githubUsername}/${projectName}.git`,
        { cwd: projectPath }
      );
      await execAsync('git push -u origin main', { cwd: projectPath });

      ctx.log(`Pushed to GitHub: ${repoUrl}`);
      return repoUrl;
    } catch (error) {
      ctx.log(`GitHub push failed: ${error}`);
      return '';
    }
  }

  async buildMVP(ctx: SkillContext, idea: Idea): Promise<{ projectPath: string; githubUrl: string }> {
    // Generate the project
    const projectPath = await this.generateProject(ctx, idea);

    // Push to GitHub
    const githubUrl = await this.pushToGithub(ctx, projectPath, idea);

    // Mark idea as built
    const ideasDir = path.join(this.outputDir, 'ideas');
    const builtDir = path.join(this.outputDir, 'built');
    await fs.mkdir(builtDir, { recursive: true });

    try {
      await fs.rename(
        path.join(ideasDir, `${idea.id}.json`),
        path.join(builtDir, `${idea.id}.json`)
      );
    } catch {}

    return { projectPath, githubUrl };
  }

  slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async run(ctx: SkillContext): Promise<void> {
    ctx.log('Checking for ideas to build...');

    const ideasDir = path.join(this.outputDir, 'ideas');

    try {
      const files = await fs.readdir(ideasDir);
      const ideaFiles = files.filter(f => f.endsWith('.json'));

      if (ideaFiles.length === 0) {
        ctx.log('No ideas in queue');
        return;
      }

      // Build the highest priority idea (first in queue)
      const ideaContent = await fs.readFile(path.join(ideasDir, ideaFiles[0]), 'utf-8');
      const idea: Idea = JSON.parse(ideaContent);

      ctx.log(`Building MVP for: ${idea.title}`);

      if (idea.type === 'mobile') {
        ctx.log('Mobile app detected, deferring to mobile-builder skill');
        return;
      }

      const result = await this.buildMVP(ctx, idea);
      ctx.log(`MVP built successfully!`);
      ctx.log(`Project: ${result.projectPath}`);
      if (result.githubUrl) {
        ctx.log(`GitHub: ${result.githubUrl}`);
      }
    } catch (error) {
      ctx.log(`Error building MVP: ${error}`);
    }
  }
}

export default MVPBuilderSkill;
