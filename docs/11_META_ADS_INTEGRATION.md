# 11. Meta Ads Integration

## Strategy
We need to track marketing spend and performance to identify profit leaks.

## Data Points
- **Campaigns/Adsets/Ads:** IDs, Names, Status.
- **Insights:** Spend, Impressions, Link Clicks, Purchases, ROAS (Return on Ad Spend).

## Implementation Details
1. **Meta Business OAuth:** Connect the merchant's Meta Business account.
2. **Graph API:** Use the Meta Graph API to pull Insights data.
3. **Polling Strategy:** Meta doesn't have real-time webhooks for Insights data. We must rely on scheduled cron jobs to pull data periodically (e.g., every 4 hours or daily depending on rate limits and scale).

## Challenges
- Meta Graph API changes frequently. Keep dependencies locked.
- API limits are strict. Batch requests where possible.
