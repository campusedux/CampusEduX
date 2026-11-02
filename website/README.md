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
- `middleware.ts` — legacy root session-refresh implementation; this src/app package does not register it. `src/middleware.ts` is the active CSP-only entry point; authentication behavior is unchanged by this preparation.
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


## AdSense preparation (2 November 2026)

Advertising remains off. No ad script, publisher ID, seller record or ad unit is installed, and `AdSlot` is not mounted on any page. Keep `NEXT_PUBLIC_ADSENSE_ENABLED` unset or `false`. Setting it to `true` is a **build-time** opt-in to nonce CSP and dynamic HTML; rebuild before changing modes. Middleware replaces the enforced static fallback with the request's nonce policy and prevents response caching. Assets excluded from middleware retain the static policy. Roll back this preparation by keeping the flag off; no database migration is involved.

Before serving ads, obtain the publisher ID and the exact ads.txt seller line from the account, integrate and validate a certified TCF CMP, and implement the ad loader/units as a separate change. Google supports strict nonce CSP rather than a rolling script-host allow-list: https://support.google.com/adsense/answer/16283098. The initial non-script hosts in `src/lib/csp.js` must be checked against actual ad/CMP requests before launch. The current banner is **not** TCF compliant. Certified options include Google's Privacy & messaging, Cookiebot and Usercentrics; verify the current list at https://support.google.com/adsense/answer/13554116.

Only public blog articles, course/lesson templates with substantive published content, and interview topic templates may use `src/components/ads/AdSlot.tsx`. A future server caller must supply the canonical `path`, `hasContent` derived from the fetched content, `access: "public"` only for anonymous/unlocked content, and `status: 200` only after successful resolution. Do not mount the component in a shared layout, login/auth/account or transactional pages, list/empty states, error/404 boundaries, paid/protected lessons, downloads, navigation or editor controls. Place it between article sections with clear separation from controls. The server rejects session-bearing requests; the client starts empty and independently verifies the anonymous session, route, env flag and advertising consent. A future ad loader must call `canLoadAdvertising` before inserting any script, carry the document nonce and stop/remove advertising on consent withdrawal, login or route changes. No future loader should infer TCF consent from `ads=true`.

Pricing remains owned by `custom_project_pricing.token_amount`, which the existing Razorpay order function independently reads and validates. `loadProjectPricing` is the website's shared reader for landing, estimate/checkout and legal display; it does not set a business price. Catalogue values may vary by level and are identified as such. On lookup failure the policies direct readers to the estimate/contact instead of quoting old seed amounts. Shared legal JSON files remain byte-identical to mobile; `src/legal/website.ts` overlays website-only advertising wording and live-price tokens at rendering, so `npm run legal:sync` cannot erase them. Cookie policy and website document versions are separate. Mobile files are unchanged.

Referral promises use `reward_settings` for amount, cap, enabled status and validity. Migration 0121 removed signup payouts; migration 0026 qualifies the first successful purchase. No reward is promised when the settings are unavailable or disabled. The audited 15-day validity is rendered when configured; no new expiry rule or database setting is invented.

The company directory uses a left-embedded job count with the same `onlyActiveJobs` status/deadline predicate as listings and company details. Those time-sensitive reads bypass persistent data/fetch/HTML caching; deadlines can expire without a write. Company details use the exact count even when their displayed preview is limited to 50 jobs.

Both audited lesson URLs use `learning_topic_content` and `learning_tree`. Existing migrations define grid/topic slug and topic-content/order indexes; no missing index was established from repository evidence, and no migration was added. Fresh public requests now abort after 8 seconds; revision checks have a 5-second deadline and complete content fills a 10-second deadline. Failures still reach retry/error handling rather than becoming cached empty content or false 404s. Existing request memoization and revision validation remain intact. The refreshed app rollback patch retains transport timeouts.

The blog uses the same revision RPC and bounded payload cache, with bounded list queries. Upstream waits, revision-RPC failure and queue saturation are plausible outage paths; without production server/query logs, the audit's single 502 cannot be attributed to one of them. Recheck `/learning/dbms-sql-tutorial/sql-overview`, `/learning/python-tutorial/python-fundamentals`, blog, current catalogue prices and Razorpay checkout after an owner-run deployment. Confirm actual database query plans and latency if timeouts recur. No remote database, schema, RLS, payment function or production configuration was changed.

Verification uses the existing lint, TypeScript, Vitest and Next build commands. Builds are run from `/tmp/campusedux-adsense-check`, an isolated copy of the same source excluding environment files, linked to existing installed dependencies. This checks compilation and rendering without reading credentials or contacting the production database. It does not verify live prices, inventory, RLS, production performance or real ad requests. The optional resume E2E suite remains skipped unless its existing opt-in is configured.


### Files changed for this preparation

| File (under website/) | Reason |
| --- | --- |
| `README.md` | Document preparation, placement limits, manual work and verification. |
| `next.config.js` | Retain static CSP fallback and remove stale job HTML caching. |
| `public/ads.txt` | Require the exact account-provided seller line; keep comments only. |
| `rollbacks/phase-2-public-cache.patch` | Keep the app cache rollback applicable after timeout changes. |
| `src/app/account/referral/page.tsx` | Show first-purchase qualification and configured expiry beside reward promises. |
| `src/app/blog/page.tsx` | Remove internal publishing/admin wording from public empty states. |
| `src/app/custom-projects/page.tsx` | Use the existing catalogue as the sole price source and explain level pricing. |
| `src/app/faq/page.tsx` | Provide nine policy-backed fallback answers and useful support links. |
| `src/app/jobs/companies/[id]/page.tsx` | Count only open unexpired jobs using fresh reads and the shared predicate. |
| `src/app/jobs/companies/page.tsx` | Count only open unexpired jobs using fresh reads and the shared predicate. |
| `src/app/jobs/page.tsx` | Count only open unexpired jobs using fresh reads and the shared predicate. |
| `src/app/layout.tsx` | Drive marketplace promotion from verified inventory while retaining existing routes. |
| `src/app/learning/page.tsx` | Remove internal publishing/admin wording from public empty states. |
| `src/app/page.tsx` | Drive marketplace promotion from verified inventory while retaining existing routes. |
| `src/app/premium/page.tsx` | Remove internal publishing/admin wording from public empty states. |
| `src/app/projects/page.tsx` | Drive marketplace promotion from verified inventory while retaining existing routes. |
| `src/app/referral/page.tsx` | Show first-purchase qualification and configured expiry beside reward promises. |
| `src/app/support/page.tsx` | Provide nine policy-backed fallback answers and useful support links. |
| `src/components/Footer.tsx` | Drive marketplace promotion from verified inventory while retaining existing routes. |
| `src/components/JsonLd.tsx` | Propagate nonces to existing scripts while preserving analytics and checkout. |
| `src/components/ads/AdSlot.tsx` | Prepare empty-by-default placements with public-content, session and consent guards. |
| `src/components/ads/AdSlotClient.tsx` | Prepare empty-by-default placements with public-content, session and consent guards. |
| `src/components/analytics/CookieConsent.tsx` | Persist separate advertising consent and support rejection and withdrawal. |
| `src/components/analytics/ScriptNonce.tsx` | Propagate nonces to existing scripts while preserving analytics and checkout. |
| `src/components/home/ModuleGrid.tsx` | Drive marketplace promotion from verified inventory while retaining existing routes. |
| `src/components/home/PremiumReferralCta.tsx` | Show first-purchase qualification and configured expiry beside reward promises. |
| `src/components/nav/BottomNav.tsx` | Drive marketplace promotion from verified inventory while retaining existing routes. |
| `src/components/nav/Header.tsx` | Drive marketplace promotion from verified inventory while retaining existing routes. |
| `src/components/nav/HeaderLinks.tsx` | Drive marketplace promotion from verified inventory while retaining existing routes. |
| `src/components/nav/MobileNav.tsx` | Drive marketplace promotion from verified inventory while retaining existing routes. |
| `src/components/referral/ReferralHowItWorks.tsx` | Show first-purchase qualification and configured expiry beside reward promises. |
| `src/legal/LegalDocView.tsx` | Apply website-only disclosures and live price tokens without changing mobile policies. |
| `src/legal/LegalProse.tsx` | Apply website-only disclosures and live price tokens without changing mobile policies. |
| `src/legal/config.ts` | Apply website-only disclosures and live price tokens without changing mobile policies. |
| `src/legal/content/cookie-policy.json` | Apply website-only disclosures and live price tokens without changing mobile policies. |
| `src/legal/interpolate.ts` | Apply website-only disclosures and live price tokens without changing mobile policies. |
| `src/legal/registry.ts` | Apply website-only disclosures and live price tokens without changing mobile policies. |
| `src/legal/website.ts` | Apply website-only disclosures and live price tokens without changing mobile policies. |
| `src/lib/advertising.ts` | Prepare empty-by-default placements with public-content, session and consent guards. |
| `src/lib/analytics.ts` | Propagate nonces to existing scripts while preserving analytics and checkout. |
| `src/lib/analyticsFrame.ts` | Propagate nonces to existing scripts while preserving analytics and checkout. |
| `src/lib/cache.ts` | Count only open unexpired jobs using fresh reads and the shared predicate. |
| `src/lib/cookieConsent.ts` | Persist separate advertising consent and support rejection and withdrawal. |
| `src/lib/csp.js` | Propagate nonces to existing scripts while preserving analytics and checkout. |
| `src/lib/customProjectPricing.server.ts` | Use the existing catalogue as the sole price source and explain level pricing. |
| `src/lib/customProjects.server.ts` | Use the existing catalogue as the sole price source and explain level pricing. |
| `src/lib/faq.ts` | Provide nine policy-backed fallback answers and useful support links. |
| `src/lib/jobsActive.ts` | Count only open unexpired jobs using fresh reads and the shared predicate. |
| `src/lib/projectAvailability.ts` | Drive marketplace promotion from verified inventory while retaining existing routes. |
| `src/lib/projectPricingText.ts` | Use the existing catalogue as the sole price source and explain level pricing. |
| `src/lib/publicReadDeadline.ts` | Bound public upstream reads without caching failures or weakening visibility checks. |
| `src/lib/razorpay.ts` | Propagate nonces to existing scripts while preserving analytics and checkout. |
| `src/lib/referral.ts` | Show first-purchase qualification and configured expiry beside reward promises. |
| `src/lib/revisionedPublicRead.ts` | Bound public upstream reads without caching failures or weakening visibility checks. |
| `src/lib/supabase/server.ts` | Bound public upstream reads without caching failures or weakening visibility checks. |
| `src/middleware.ts` | Register per-request strict nonce CSP in the actual src-based Next app. |
| `tests/app/home-features.test.ts` | Verify changed content, eligibility, nonce, pricing and empty-state behavior. |
| `tests/app/jobs-projects-ui.test.ts` | Verify changed content, eligibility, nonce, pricing and empty-state behavior. |
| `tests/app/schema-structured-data.test.ts` | Verify changed content, eligibility, nonce, pricing and empty-state behavior. |
| `tests/lib/adsense-readiness.test.ts` | Verify changed content, eligibility, nonce, pricing and empty-state behavior. |
| `tests/lib/advertising.test.ts` | Verify changed content, eligibility, nonce, pricing and empty-state behavior. |

Verification result: `npm run lint` and `npx tsc --noEmit` passed. `npm test` passed 1,814 tests across 124 suites; the existing 12 opt-in resume E2E tests were skipped. Both off-mode and nonce-mode production builds passed in the isolated source copy. The nonce registration fix additionally passed 33 focused middleware/ad-boundary tests; final real-response verification is recorded below. Initial sandbox restrictions on scratch Git subprocesses and localhost sockets were resolved with scoped execution approval. No production database checks or deployment were run.

Real-response nonce-mode check: `/faq` and `/support` returned 200, a missing route returned 404, and all HTML script tags matched the enforced response nonce. Script policy had neither unsafe-inline nor unsafe-eval. The fallback FAQ rendered, responses were not shared-cacheable, and `/ads.txt` remained comments-only. The production build manifest registered `src/middleware.ts`; the old root middleware was not registered and was left byte-for-byte unchanged.
