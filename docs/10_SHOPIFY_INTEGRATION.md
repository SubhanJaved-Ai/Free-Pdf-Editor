# 10. Shopify Integration

## Strategy
We need to know what a merchant is selling, what they have in stock, and their recent sales velocity.

## Data Points
- **Products/Variants:** Titles, IDs, Inventory Levels.
- **Orders:** Timestamps, Items Purchased, Total Value.

## Implementation Details
1. **OAuth Flow:** Required to obtain offline access tokens for the merchant's store.
2. **REST / GraphQL Admin API:** Used to perform bulk syncs of historical data upon initial onboarding.
3. **Webhooks:** Register webhooks for:
   - `orders/create`
   - `inventory_levels/update`
   This ensures real-time responsiveness for the Rule Engine.

## Rate Limiting
- Implement exponential backoff for Shopify API calls.
- Queue webhook processing if necessary to avoid database locking or Vercel timeout limits.
