# 16. Coding Standards

## Philosophy
Write lean, readable, and predictable code. Avoid "clever" abstractions.

## TypeScript
- Strict mode is ON.
- Avoid `any`. Use generic interfaces or unknown if necessary.
- Define database types clearly (generate them from Supabase CLI).

## Next.js (App Router)
- Default to **Server Components**.
- Use `"use client"` only at the leaves of the component tree where interactivity is required (buttons, forms, state).
- Use Server Actions for data mutations.

## Styling
- Use Tailwind CSS exclusively.
- Extract common patterns into `shadcn/ui` components.
- Do not write custom CSS files unless strictly necessary for complex animations.

## Error Handling
- Server functions must return standardized objects: `{ error: string | null, data: any | null }`.
- Client components should gracefully handle error states (e.g., toast notifications).
