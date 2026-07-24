# 12. AI Logic System

## Philosophy
**No RAG. No Agents. No Hallucinated Math.**

LLMs are terrible at arithmetic and logic over large datasets. They are excellent at summarizing and translating data into natural language.

## The Pipeline
1. **Deterministic Filter:** The Rule Engine (Node.js/TypeScript) does all the math. It finds that Campaign X has a ROAS of 0.8 and spent $500.
2. **JSON Payload Assembly:** We construct a strict JSON payload containing only the relevant facts.
   ```json
   {
     "trigger": "low_roas_high_spend",
     "campaign_name": "Summer Sale Broad",
     "spend": 500,
     "roas": 0.8,
     "threshold_roas": 1.2
   }
   ```
3. **LLM Prompting:** We send a system prompt and the JSON payload to OpenAI API.
   *Prompt:* "You are an expert media buyer. Explain this data alert to the merchant in 2 sentences. Give a clear recommendation."
4. **Output Storage:** We save the string output directly into the database.

This guarantees that our system never "hallucinates" an alert that doesn't exist, but provides the UX of an AI assistant.
