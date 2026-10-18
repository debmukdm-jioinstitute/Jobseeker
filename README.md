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

## Ingestion note
Posts are pasted by the user. Automated LinkedIn scraping violates LinkedIn's ToS and gets accounts banned, so it is not built in.
