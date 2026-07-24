# 08. Auth Architecture

We rely entirely on **Supabase Auth** for identity management.

## Authentication Flow
1. **Sign Up/Log In:** Standard email and password via Supabase Auth UI / Client SDK.
2. **Session Management:** Next.js Middleware verifies the Supabase session token on every request to protected routes.
3. **Data Access:** The authenticated session token is passed to the Supabase Postgres database.
4. **Row Level Security (RLS):** Postgres evaluates `auth.uid()` against table policies to automatically filter queries. 

## Best Practices
- Never use the `service_role` key on the client side.
- Middleware must rigorously protect the `/dashboard` routes. Unauthenticated users are redirected to `/login`.
- Next.js Server Components should use the `@supabase/ssr` package to securely fetch the session server-side.
