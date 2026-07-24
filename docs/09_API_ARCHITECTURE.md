# 09. API Architecture

## Internal APIs
Internal communication between the React frontend and our backend logic should prioritize **Next.js Server Actions**.
- Use Server Actions for mutations (e.g., marking an alert as resolved, updating a store setting).
- Use Server Components to fetch data directly from Supabase. No need for intermediary REST API routes for simple data fetching.

## External API Routes
We use Next.js Route Handlers (`app/api/...`) strictly for external actors:
1. **Webhooks:** Receiving payloads from Shopify (e.g., `order/create`).
2. **Cron Triggers:** Endpoints invoked by Vercel Cron to kick off batch syncs or rule engine evaluations.

## Security for Route Handlers
- Webhooks must verify cryptographic signatures (e.g., Shopify HMAC verification).
- Cron endpoints must verify a custom authorization header to prevent unauthorized invocation.
