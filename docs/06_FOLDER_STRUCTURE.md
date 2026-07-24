# 06. Folder Structure

*(Note: The actual folder structure will be implemented according to the CTO's recommendations, but this document will serve as the persistent map.)*

## Principles
1. **Feature-based routing:** Leverage Next.js App Router conventions.
2. **Colocation:** Keep components close to where they are used.
3. **Clear separation:** Separation between UI components, business logic, database clients, and external integrations.

## Target Structure (App Router)
```
/
├── app/                  # Next.js App Router pages and layouts
│   ├── (auth)/           # Authentication pages (login, signup)
│   ├── (dashboard)/      # Main app interface
│   ├── api/              # Route handlers (webhooks, cron triggers)
│   └── layout.tsx        # Root layout
├── components/           # Reusable UI components
│   ├── ui/               # shadcn/ui generic components
│   └── shared/           # Project-specific shared components
├── lib/                  # Core application logic
│   ├── supabase/         # Supabase client initialization and utilities
│   ├── shopify/          # Shopify API wrappers
│   ├── meta/             # Meta Ads API wrappers
│   ├── rules/            # The deterministic rule engine logic
│   ├── ai/               # OpenAI wrappers and prompt generation
│   └── utils.ts          # General helper functions
├── types/                # TypeScript interface definitions
├── docs/                 # Project Memory System (You are here)
├── .env.local            # Environment variables
├── next.config.mjs       # Next.js config
├── tailwind.config.ts    # Tailwind config
└── package.json
```
