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

1. An agent produces JSON in the format of `data/inbox/README.md`.
2. It delivers either by (a) updating its own standing file `jobseeker-<name>.json` in the repo root (e.g. `jobseeker-linkedin.json`), or (b) uploading a one-off file to `data/inbox/` (deleted after merging).
3. Every push to those paths runs the `collect` workflow, which merges into `data/feed.json` (deduped by id) within about a minute; Vercel then redeploys.
4. Posts older than 30 days (by their own `date`) are dropped. A 6-hour schedule also sweeps.
