# 18. Security Guidelines

## 1. Supabase Row Level Security (RLS)
- Every table MUST have an RLS policy.
- By default, tables are `DENY ALL`. We explicitly allow access based on the authenticated user's ID matching the tenant (`store_id`).

## 2. Server-Side Execution
- Never expose the `SUPABASE_SERVICE_ROLE_KEY` to the client.
- Rule Engine evaluation and API interactions (Shopify, Meta, OpenAI) must happen exclusively on the server (Route Handlers, Server Actions, or Background Jobs).

## 3. Webhook Verification
- Webhooks from Shopify and Meta must be verified using HMAC to ensure they originated from the provider and not a malicious actor.

## 4. Input Validation
- Validate all incoming data from the client and from external APIs using Zod schemas before processing or saving to the database.
