# MVP Builder Skill

## Description
Autonomous code generation agent that builds complete, working MVPs from idea specifications. Generates full-stack web applications, APIs, and SaaS products with modern tech stacks.

## Metadata
```yaml
name: mvp-builder
version: 1.0.0
author: MVPFactory
requiredEnv:
  - NVIDIA_API_KEY
  - GITHUB_TOKEN
  - GITHUB_USERNAME
stateDirs:
  - projects
  - templates
```

## Tech Stacks Supported

### Web Apps (Default)
- **Frontend**: Next.js 14+, React, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes, tRPC
- **Database**: Supabase (PostgreSQL), Prisma ORM
- **Auth**: NextAuth.js / Supabase Auth
- **Deployment**: Vercel-ready

### SaaS Apps
- Everything in Web Apps plus:
- **Payments**: Stripe integration
- **Email**: Resend
- **Analytics**: PostHog

### API-Only
- **Runtime**: Node.js / Bun
- **Framework**: Hono / Express
- **Database**: Supabase / SQLite

## Tools

### `generate_project`
Creates complete project structure from idea specification.

**Input**: Idea JSON object
**Output**: Full project directory with all files

### `generate_component`
Generates individual React components.

### `generate_api_route`
Creates API endpoints with proper validation.

### `generate_database_schema`
Creates Prisma schema from feature requirements.

### `run_tests`
Generates and runs basic tests for the MVP.

### `push_to_github`
Creates repo and pushes the complete project.

## Instructions

When receiving an idea from the research skill:

1. **Analyze Requirements**
   - Parse the idea's features list
   - Determine optimal tech stack
   - Plan database schema
   - Design API structure

2. **Generate Project**
   - Create Next.js project structure
   - Generate all React components
   - Create API routes
   - Set up database schema
   - Add authentication if needed
   - Configure styling with Tailwind

3. **Quality Checks**
   - Ensure all imports are correct
   - Validate TypeScript types
   - Add basic error handling
   - Include loading states

4. **Deploy**
   - Initialize git repo
   - Create GitHub repository
   - Push all code
   - Add README with setup instructions

## Triggers
- Queue: When new idea added to queue
- Manual: `/build <idea-id>`
