# AI Ecommerce Decision Intelligence Platform

## Project Overview
Build an AI-powered ecommerce intelligence platform that helps ecommerce merchants understand exactly where profit is leaking and what actions they should take. We use deterministic rules to analyze Shopify and Meta Ads data, and OpenAI to explain the issues in human-readable terms. **This is not an analytics dashboard; this is an action-driven decision intelligence tool.**

## Architecture Summary
- **Frontend/Backend:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui.
- **Database & Auth:** Supabase (PostgreSQL).
- **Core Logic:** Hardcoded TypeScript Rule Engine (No RAG, No Agents) run via Vercel Cron.
- **AI Integration:** OpenAI API for natural language translation of deterministic rule triggers.
- **External Integrations:** Shopify and Meta Ads APIs.

## Setup Instructions
*(Note: These are placeholder instructions for when we initialize the Next.js and Supabase project)*
1. Clone the repository.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and fill in the required keys (Supabase, OpenAI, Shopify, Meta).
4. Run `npm run dev` to start the development server.
5. Apply Supabase migrations to initialize the database schema.

## Documentation Navigation

This project utilizes a detailed project memory system to ensure continuity and context sharing. All architectural and contextual decisions are documented in the `docs/` folder. Treat these files as the absolute source of truth.

- [00. Project Overview](./docs/00_PROJECT_OVERVIEW.md)
- [01. Product Vision](./docs/01_PRODUCT_VISION.md)
- [02. Problem Statement](./docs/02_PROBLEM_STATEMENT.md)
- [03. V1 Scope](./docs/03_V1_SCOPE.md)
- [04. Tech Stack](./docs/04_TECH_STACK.md)
- [05. System Architecture](./docs/05_SYSTEM_ARCHITECTURE.md)
- [06. Folder Structure](./docs/06_FOLDER_STRUCTURE.md)
- [07. Database Architecture](./docs/07_DATABASE_ARCHITECTURE.md)
- [08. Auth Architecture](./docs/08_AUTH_ARCHITECTURE.md)
- [09. API Architecture](./docs/09_API_ARCHITECTURE.md)
- [10. Shopify Integration](./docs/10_SHOPIFY_INTEGRATION.md)
- [11. Meta Ads Integration](./docs/11_META_ADS_INTEGRATION.md)
- [12. AI Logic System](./docs/12_AI_LOGIC_SYSTEM.md)
- [13. Rule Engine](./docs/13_RULE_ENGINE.md)
- [14. Sync Architecture](./docs/14_SYNC_ARCHITECTURE.md)
- [15. Env Variables](./docs/15_ENV_VARIABLES.md)
- [16. Coding Standards](./docs/16_CODING_STANDARDS.md)
- [17. UI/UX Principles](./docs/17_UI_UX_PRINCIPLES.md)
- [18. Security Guidelines](./docs/18_SECURITY_GUIDELINES.md)
- [19. Build Roadmap](./docs/19_BUILD_ROADMAP.md)
- [20. Decision Log](./docs/20_DECISION_LOG.md)
- [21. Todo](./docs/21_TODO.md)
- [22. Project Context for New Chat](./docs/22_PROJECT_CONTEXT_FOR_NEW_CHAT.md)

## Context Refresher

When starting a new session or inviting a new developer, copy the contents of `docs/22_PROJECT_CONTEXT_FOR_NEW_CHAT.md` to instantly regain context.
