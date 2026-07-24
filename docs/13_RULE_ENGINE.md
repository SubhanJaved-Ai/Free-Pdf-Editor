# 13. Rule Engine

## Architecture
The Rule Engine is a set of TypeScript functions that run against recent data snapshots.

## Example V1 Rules

### Rule 1: The Bleeding Campaign
- **Condition:** Meta Campaign Spend > $100 AND ROAS < 1.0 over the last 3 days.
- **Data Needed:** `ad_campaigns` data aggregated.

### Rule 2: Zombie Inventory
- **Condition:** Shopify Product Inventory > 50 AND Sales in last 14 days == 0.
- **Data Needed:** `products` and `orders` data.

### Rule 3: The Ghost Ad
- **Condition:** Meta Ad is Active AND Shopify Product Inventory for the linked product == 0.
- **Data Needed:** Joint query across `ad_campaigns` and `products`.

## Execution
- Runs via Vercel Cron.
- Uses `supabase-admin` (service role) to query data across all active stores, evaluates rules in memory, and writes new `alerts` to the database.
- Implements idempotency: Before creating an alert, check if an unresolved alert for the same entity and rule already exists.
