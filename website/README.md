# CampusEduX Website — Phase 1 + Phase 2

Real Next.js 14 (App Router) site built against the **actual** CampusEduX
Supabase schema and Edge Functions found in the uploaded repository. No fake
projects, jobs, prices, testimonials, statistics or payment logic anywhere —
Phase 2 reuses the mobile app's own auth trigger and its existing Razorpay
Edge Functions rather than building new backend logic.

## Phase 1 — public marketing + catalog (unchanged)

Home, Project Marketplace, Jobs, Placement, Resume Builder, Custom Projects,
Premium (browse), Referral (program terms), FAQ/Testimonials (CMS), About/
Contact/Support, legal pages (Terms/Privacy/Refund live from `cms_pages`),
sitemap/robots. See `WEBSITE_FEATURE_MATRIX.md` for the full breakdown.

## Phase 2 — auth, account dashboard, real payments, SEO, security

**Auth** (`@supabase/ssr`, same pattern as `admin-panel/`):
- `middleware.ts` — refreshes the Supabase session cookie on every request
- `src/lib/supabase/browser.ts` — client for Client Components
- `src/lib/supabase/authed-server.ts` — cookie-aware client for Server Components
- `src/lib/auth.ts` — `requireUser()`, the one gate every `/account/*` page uses
- `/login` — email **or mobile number** (mirrors `auth.service.ts`'s
  `email_for_mobile` RPC lookup, since RLS blocks a direct `profiles` read
  before a session exists)
- `/register` — signup carries `full_name` / `mobile_number` / `referral_code`
  in `user_metadata`; the existing `handle_new_user()` trigger
  (migrations/0001) creates the `profiles` row — no new backend code
- `/logout`

**Account dashboard** (`/account/*`, all `requireUser()`-gated, `noindex`):
- `/account` — overview (wallet balance, purchase/application/referral counts)
- `/account/profile` — view + edit own `profiles` row
- `/account/purchases` — real `purchases` (status = success) + project info
- `/account/applications` — real `applications` + job info
- `/account/saved-jobs` — real `saved_jobs`
- `/account/resume` — `resumes_builder` + `resume_downloads` overview
  (read-only — full section-by-section editing stays in the app; this is
  the "proper authenticated entry point" the brief allows for resume)
- `/account/wallet` — real `wallet_transactions` ledger **+ working top-up**
- `/account/referral` — real `referral_codes` / `referrals`, shareable link
- `/account/notifications` — real `notifications`, click-to-mark-read

**Real payments — reuses the existing Edge Functions, doesn't reinvent them:**
- Wallet top-up: `TopUpForm` → `create-wallet-topup-order` → Razorpay
  Checkout.js → `verify-wallet-topup-payment` (server-side HMAC check,
  unchanged from the mobile app)
- Premium subscribe: `PremiumSubscribeButton` on `/premium` → `create-premium-order`
  → Razorpay Checkout.js → `verify-premium-payment`
- The client never sees, trusts, or computes a price or payment status —
  both come back from the Edge Function response only

**SEO structured data** (`src/components/JsonLd.tsx`):
- `Organization` on every page (root layout)
- `Product` on project detail — `aggregateRating` only attached when
  `review_count > 0` (never a fabricated rating)
- `JobPosting` on job detail — `baseSalary` only when real min/max LPA exist
- `FAQPage` on `/faq` — only when real FAQs are published

**Security headers** (`next.config.js`): `X-Content-Type-Options`,
`Referrer-Policy`, `Permissions-Policy`, and a `Content-Security-Policy`
scoped to exactly what this app loads (Supabase, Razorpay checkout, Google
Fonts) — nothing wildcarded.

## Running it

Still no network in this environment, so `npm install` / `npm run build`
have **not** been run here.

```bash
cd campusedux-website
cp .env.example .env.local
npm install
npm run dev
npm run typecheck
npm run build
```

Auth and the account dashboard need nothing beyond `NEXT_PUBLIC_SUPABASE_URL`
/ `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the existing RLS policies (`_select_own`
on every table used above) already scope every query to the signed-in user.
Wallet top-up and Premium checkout need the Supabase project's Edge Functions
to have `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` set (same as the mobile app
already requires) — if they aren't, the Edge Functions themselves return
`"Payments are not configured."` rather than the website faking success.

## Phase 3 — apply to jobs, custom project flow, contact form

**Apply to a job** (`/jobs/[id]`, `src/app/jobs/[id]/JobApplyPanel.tsx` +
`src/lib/actions/jobs.ts`): for a signed-in user who hasn't already applied,
pick an existing `resumes` row or upload a new PDF/DOC/DOCX (client-side upload
to the private `resumes` Storage bucket at `<uid>/…`, matching
`job.service.uploadResume`). A server action then mints the signed URL,
inserts `resumes` + `applications` (mapping the `unique(user_id, job_id)`
`23505` to "already applied"). Plus a Save/Unsave toggle on `saved_jobs`.

**Custom project request** (`/custom-projects/start → /features → /estimate →
/checkout → /my-projects → /my-projects/[id]`): the wizard persists to
`custom_project_drafts` (RLS owner CRUD) as you go. The estimate on
`/estimate` + `/checkout` is recomputed **server-side** from
`custom_project_pricing` / `_platform_pricing` / `_features`. Payment reuses
the existing Edge Functions unchanged — `create-custom-project-order` →
Razorpay Checkout.js → `verify-custom-project-payment`. `/my-projects/[id]`
shows the pricing snapshot, status timeline (`custom_project_request_history`,
never its admin `note`), reference files + delivered assets via signed URLs,
and a read/send message thread (`custom_project_messages`, RLS student insert).

**Contact form** (`/contact`): new website-owned table `contact_submissions`
(`website/supabase/migrations/0001_contact_submissions.sql`). Rows are written
**only** by the `submit_contact_message()` SECURITY DEFINER function
(validates + rate-limits 4/hour/client-key), so the public anon key can't
bypass it. No public SELECT — an admin reads/triages them at
**admin-panel → Banner & CMS → Contact Messages** (`/cms/contact`).

## Explicitly NOT built yet

- Automated tests (Vitest) — Phase 6
- `contact_submissions` migration must be applied to the Supabase project
  before the contact form works end to end (it degrades to "email us
  directly" until then)
