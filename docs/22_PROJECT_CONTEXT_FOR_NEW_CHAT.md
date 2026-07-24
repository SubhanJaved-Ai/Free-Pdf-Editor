# PROJECT CONTEXT FOR NEW CHAT

**Paste this file into a new AI chat to instantly regain complete project context.**

## 1. What We Are Building
**AI Ecommerce Decision Intelligence Platform**
A platform that automatically analyzes Shopify and Meta Ads data to tell merchants exactly where they are losing money and what actions they need to take. It replaces traditional analytics dashboards with actionable insights.

## 2. Why We Are Building It
Merchants are overwhelmed by data. By the time they spot a bleeding ad or an out-of-stock product driving clicks, profit is already lost. We automate the analysis so they can focus on taking action.

## 3. V1 Scope
- **Integrations:** Shopify (Orders, Inventory) & Meta Ads (Spend, ROAS).
- **Core Engine:** A deterministic Rule Engine (hardcoded TS logic) detects profit leaks.
- **AI Layer:** OpenAI API translates the detected leaks into human-readable explanations.
- **UX:** A clean, prioritized feed of Alerts/Actions.
- **NO** RAG, NO Autonomous Agents, NO open-ended Chatbots.

## 4. Tech Stack (Locked)
- Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
- Supabase (PostgreSQL, Auth, PostgREST)
- OpenAI API
- Vercel (Hosting & Cron)

## 5. Key Architecture Decisions
- **Rule Engine + LLM:** Deterministic math for anomaly detection; LLM strictly for text formatting. No hallucinated metrics.
- **Data Sync:** Scheduled ingestion (Cron) and webhooks populate a Postgres database. The UI reads from Postgres.

## 6. Important Rules
- Save all architecture changes or decisions to the `docs/` folder markdown files.
- Treat markdown files as the absolute source of truth.
- Write lean, readable code. Avoid overengineering.
- No `any` types in TypeScript.
- Follow strict RLS rules in Supabase.

## 7. Folder Structure
- `app/`: Next.js routes (App Router).
- `components/`: UI and shared components.
- `lib/`: Business logic, API clients (Shopify/Meta/OpenAI), database utils.
- `docs/`: Project memory system.

## 8. Current Progress
- Phase: Foundation & Documentation Setup.
- Markdown memory system has been created.
- Pending: Project initialization and boilerplate setup.

## 9. Next Step
- Review CTO recommended folder structure.
- Initialize Next.js project and Supabase schema.

## 10. Engineering Philosophy
Be practical. Think long-term but build lean. Action over analysis. Speed to value.
