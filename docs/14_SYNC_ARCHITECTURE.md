# 14. Sync Architecture

## The Sync Problem
External APIs fail, rate limits hit, and data gets out of sync.

## Sync Principles
1. **Idempotency:** All database writes from syncs should use `UPSERT` (e.g., based on `shopify_order_id`). Running a sync twice should have no negative effect.
2. **Soft Deletes:** Never delete data unless explicitly requested by the user. Use status flags (`active=false`).
3. **Queueing:** For large syncs (e.g., initial onboarding), do not attempt to do it in one synchronous API request. It will timeout. (We will need to look into background task processing, potentially Vercel Functions with long maxDuration or an external queue if it gets complex).

## Standard Cron Schedule (Proposed)
- Meta Ads Insights Sync: Every 4 hours.
- Shopify Backup Sync (Catching missed webhooks): Daily.
- Rule Engine Evaluation: Runs immediately after Meta Sync completes.
