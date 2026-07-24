# 05. System Architecture

## Architecture Overview
We use a monolithic-like architecture within Next.js, powered by a Backend-as-a-Service (Supabase).

1. **Client Layer:** Next.js React components (mostly Server Components for data fetching, Client components for interactivity).
2. **API/Logic Layer:** Next.js Server Actions & Route Handlers.
3. **Data Layer:** Supabase Postgres.
4. **Integration Layer:** Server-side functions to interact with Shopify and Meta APIs.

## The Data Pipeline

### 1. Ingestion
- Scheduled jobs (e.g., Vercel Cron) trigger API routes in Next.js.
- These routes pull data from Shopify (Sales, Inventory) and Meta (Spend, ROAS).
- Data is normalized and upserted into Supabase tables (`orders`, `products`, `ad_campaigns`).

### 2. Processing (The Rule Engine)
- After ingestion, a processing pipeline runs.
- The Rule Engine iterates over the fresh data looking for anomalies based on predefined logic (e.g., `spend > 100 && roas < 1.0`).
- If a rule evaluates to `true`, a raw `Alert` record is created in the database.

### 3. AI Enrichment
- For every new un-enriched `Alert`, an async job calls the OpenAI API.
- The prompt includes the raw data (e.g., Campaign X spent $500 with 0.5 ROAS).
- The LLM returns a structured, human-readable summary and action plan.
- The `Alert` is updated with this AI text.

### 4. Presentation
- The user logs into the Next.js app.
- They see a feed of enriched Alerts fetched via Supabase.
