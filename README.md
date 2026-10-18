# Jobseeker

Hiring posts → actions. Landing, sign-in/up, guest mode, dashboard with a top-down category picker
(Finance → FP&A, IB, Asset Mgmt …), post link/email/instruction extractor, and one-click company research.

Stack (all free tier): Next.js on Vercel Hobby, Supabase Auth, GitHub Actions.

## Run
    npm i && npm run dev
Guest mode works with no config. For accounts: create a free Supabase project, copy `.env.example` to `.env.local`, fill keys.
Selected categories sync to the user's Supabase `user_metadata` (no tables needed).

## Deploy (free)
Import this repo at vercel.com, add the two env vars, deploy.

## Feed: agents only
The site shows only what our research agents (Grok, Muse, ...) deliver. No website is fetched by the site itself.

1. An agent produces a `.json` file (format: `data/inbox/README.md`).
2. Upload it to `data/inbox/` on GitHub (Add file → Upload files).
3. The `collect` workflow merges it into `data/feed.json` within about a minute, clears the inbox, and Vercel redeploys.
4. Posts are kept 30 days. A 6-hour schedule also sweeps and expires old ones.
