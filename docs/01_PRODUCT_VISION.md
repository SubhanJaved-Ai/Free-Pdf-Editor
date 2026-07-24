# 01. Product Vision

## The Problem with Current Solutions
Current ecommerce tools provide *analytics*—graphs, charts, and tables. Merchants log in and have to manually hunt for insights. "Why did my profit drop yesterday? Is it Meta Ads? Is it a Shopify inventory issue? Did my shipping costs spike?" This manual analysis is slow, error-prone, and requires analytical expertise that many merchants lack.

## Our Vision
We are building a **Decision Intelligence Platform**. 

The platform does the analysis for the merchant. When a merchant logs in, they are immediately presented with:
1. **The Leak:** "You are bleeding money on Campaign X."
2. **The Reason:** "ROAS dropped below 1.2 while spend increased by 20% over the last 48 hours."
3. **The Action:** "Pause this campaign immediately."

## Guiding Principles
- **Action Over Analysis:** No generic dashboards. Every UI element must drive a decision.
- **Determinism Over Hallucination:** We use a Rules Engine for the hard math and logic. We use LLMs *only* to translate the deterministic rules into plain English explanations. No Agents, no RAG, no open-ended chat capable of hallucinating math.
- **Speed to Value:** Time-to-first-insight should be under 5 minutes from connecting Shopify and Meta integrations.
