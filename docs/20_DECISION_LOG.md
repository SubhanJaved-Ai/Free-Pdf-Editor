# 20. Decision Log

*Record architectural decisions here (ADRs).*

## ADR-001: Deterministic Rules + LLM over RAG/Agents
**Date:** [Current Date]
**Decision:** We will use hardcoded TypeScript logical functions (Rule Engine) to process data and detect anomalies, relying on OpenAI ONLY for text summarization of the triggers.
**Reason:** LLMs are unreliable at complex math over JSON payloads. An AI Agent might hallucinate a profit leak or take destructive action on a merchant's ad account. Determinism ensures trust.

## ADR-002: Supabase as Core Database
**Date:** [Current Date]
**Decision:** Use Supabase for Auth and PostgreSQL database.
**Reason:** Speed of development, robust Row Level Security for multi-tenancy, and excellent integration with Next.js App Router.
