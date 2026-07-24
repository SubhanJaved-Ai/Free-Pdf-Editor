# 03. V1 Scope

## In Scope for V1
- **Authentication:** Email/Password via Supabase Auth.
- **Integrations:**
  - Shopify (Orders, Products/Inventory sync).
  - Meta Ads (Campaign spend, ROAS, basic ad metrics sync).
- **Data Engine:**
  - CRON jobs to fetch and sync data daily/hourly.
- **Rule Engine:**
  - 3-5 hardcoded rules (e.g., "High Spend, Low ROAS", "Ad running for out-of-stock product", "Sudden drop in conversion rate").
- **AI Explanations:**
  - OpenAI API integration to take triggered rules and generate a 2-3 sentence human-readable explanation and action recommendation.
- **User Interface:**
  - A clean, feed-like UI showing "Alerts/Actions".
  - Ability to "Dismiss" or "Resolve" an alert.

## Out of Scope for V1 (DO NOT BUILD)
- Google Ads, TikTok Ads integrations.
- Chatbots or conversational interfaces.
- RAG pipelines.
- AI Agents that take action on behalf of the user (e.g., we will NOT automatically pause Meta ads, we will only recommend pausing them).
- Complex custom rule builder for the user. (Rules are hardcoded by us in V1).
- Over-engineered microservices.
