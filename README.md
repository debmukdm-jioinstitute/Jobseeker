<img src="brand/opentowork-logo.png" alt="OpenToWork" width="420" />

# OpenToWork

Hiring posts → actions. Landing, sign-in/up, guest mode, dashboard with a top-down category picker
(Finance → FP&A, IB, Asset Mgmt …), post link/email/instruction extractor, and one-click company research.

Stack (all free tier): Next.js on Vercel Hobby, in-house auth, Vercel Blob (private) for accounts, GitHub Actions.

## Run
    npm i && npm run dev
Guests need nothing. Accounts need two env vars on Vercel (Production):
- `BLOB_READ_WRITE_TOKEN`: created by `vercel blob create-store jobseeker-users --access private`.
- `SESSION_SECRET`: any long random string (`openssl rand -hex 32`).

Accounts are in-house: scrypt-hashed passwords, a signed HttpOnly cookie, one private blob per user
(`users/<sha256(email)>.json`) holding their saved areas and saved jobs. No email verification or password
reset (no email service); add one before inviting the public.

## Deploy (free)
Import this repo at vercel.com, add the two env vars, deploy.

## Feed: agents only
The site shows only what our research agents (Grok, Muse, ...) deliver. No website is fetched by the site itself.

1. An agent produces JSON in the format of `data/inbox/README.md`.
2. It delivers either by (a) updating its own standing file `jobseeker-<name>.json` in the repo root (e.g. `jobseeker-linkedin.json`), or (b) uploading a one-off file to `data/inbox/` (deleted after merging).
3. Every push to those paths runs the `collect` workflow, which merges into `data/feed.json` (deduped by id) within about a minute; Vercel then redeploys.
4. Posts older than 30 days (by their own `date`) are dropped. A 6-hour schedule also sweeps.
