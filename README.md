# Jobseeker

Hiring posts → actions. Landing, sign-in/up, guest mode, dashboard with a top-down category picker
(Finance → FP&A, IB, Asset Mgmt …), post link/email/instruction extractor, and one-click company research.

Stack (all free tier): Next.js on Vercel Hobby, Supabase Auth.

## Run
    npm i && npm run dev
Guest mode works with no config. For accounts: create a free Supabase project, copy `.env.example` to `.env.local`, fill keys.
Selected categories sync to the user's Supabase `user_metadata` (no tables needed).

## Deploy (free)
Import this repo at vercel.com, add the two env vars, deploy.

## Automatic feed
`/api/feed` pulls hiring posts from free public sources (Hacker News "Who is hiring" via Algolia, Remotive, Arbeitnow),
runs `lib/extract.ts` to find apply forms, emails and instructions, and is cached for 6 hours by Next.js. No DB, no cron, no keys.
Add a source = add one function in `lib/sources.ts`.

LinkedIn is not scraped: it has no free API, forbids scraping in its ToS, and blocks/bans accounts that try.
