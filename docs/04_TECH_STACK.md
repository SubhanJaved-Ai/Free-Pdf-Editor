# 04. Tech Stack

Our tech stack is locked. We optimize for speed, developer experience, and scalability without unnecessary complexity.

## Frontend
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui

## Backend
- **Core Server:** Next.js Server Actions & Route Handlers
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth
- **Data Access:** Supabase Client (PostgREST)

## AI
- **Provider:** OpenAI API (GPT-4o or equivalent)
- **Role:** Explaining rule triggers, generating text. (NO RAG, NO AGENTS)

## Hosting & DevOps
- **Web Host:** Vercel
- **Database Host:** Supabase
- **Background Jobs:** Vercel Cron or Inngest (To be decided, keep simple with Vercel Cron for V1).

## Strict "NO" List
- No GraphQL
- No Prisma/Drizzle (We use Supabase JS client)
- No Redux (Use React Context / Zustand if absolutely needed, otherwise Server Components)
- No Python microservices
