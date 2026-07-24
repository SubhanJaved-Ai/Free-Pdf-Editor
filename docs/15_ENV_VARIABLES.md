# 15. Env Variables

The `.env.local` file should contain the following keys. **Never commit this file to version control.**

```bash
# Next.js Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key # SERVER SIDE ONLY

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Shopify App Credentials
SHOPIFY_CLIENT_ID=your-shopify-client-id
SHOPIFY_CLIENT_SECRET=your-shopify-client-secret
SHOPIFY_APP_URL=your-app-url

# Meta Ads API Credentials
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret

# Cron Secret (for securing cron endpoints)
CRON_SECRET=your-secure-random-string
```
