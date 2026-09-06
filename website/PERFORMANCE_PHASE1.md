# CampusEduX Website — Performance Phase 1: Server / Data Layer

**Date:** 2026-09-06 · **Branch:** `audit/full-project-review`
**Scope:** items 6–12 of the Phase 1 brief. Behaviour-preserving. No UI/UX change.

> **Note on prior work found in the tree.** The working tree already contained an
> earlier data-layer pass on this branch ("Batch 2A"): `website/docs/perf/audit-website.md`
> (findings P-1…P-20) + `website/docs/perf/suggested-indexes.sql`, plus uncommitted
> edits implementing several of them (request-memoised `lib/auth.ts`, `/premium`
> de-auth, bounded `.limit()` on the account/category/company lists, one `select("*")`
> fix). Phase 1 **builds on that** rather than redoing it — this report covers the
> combined state and adds what was missing. See §7 for the reconciliation.

---

## 1. What changed (code)

| # | File | Change | Type |
|---|---|---|---|
| 6 | `projects/[id]/page.tsx` | `projects.select("*")` → 15 explicit columns | select(\*) |
| 6 | `jobs/companies/[id]/page.tsx` | `companies.select("*")` → 6 explicit columns *(was partly done in Batch 2A; finished here)* | select(\*) |
| 6 | `custom-projects/my-projects/[id]/page.tsx` | `custom_project_requests.select("*")` → 19 explicit columns (drops `admin_notes`, `payment_*`, `pricing_version`, `project_image_path`, `token_payment_status`, timestamps) | select(\*) |
| 6 | `account/referral/page.tsx` | `referral_codes.select("*")` → `code,total_referrals,total_earned` | select(\*) |
| 6 | `referral/page.tsx` | `reward_settings.select("*")` → 5 explicit columns | select(\*) |
| 6 | `premium/page.tsx` | `premium_plans.select("*")` + `premium_features.select("*")` → explicit | select(\*) |
| 7 | `custom-projects/my-projects/[id]/page.tsx` | Reference-file + delivery-asset signed URLs: **N × `createSignedUrl()` → 1 × `createSignedUrls()`** (batched), in two places | N+1 → 1 |
| 7 | `resume/page.tsx` | `getOptionalUser()` + `loadTemplates()` were serial → `Promise.all`. The redundant 2nd `resume_templates` fetch folded into the main `Promise.all` (now parallel, not a serial 5th wave). | waterfall |
| 7 | `account/resume/[id]/edit/page.tsx` | 3 serial `await`s (`resumes_builder` → `resume_templates` → `resume_shares`) → **one `Promise.all`** | waterfall |
| 7 | `account/resume/[id]/ats/page.tsx` | `resumes_builder` fetch then `compute_ats_breakdown` RPC were serial → `Promise.all` (RPC only needs `params.id`) | waterfall |
| 11 | `projects/best-sellers/page.tsx` | added `.limit(48)` (was unbounded; matches sibling `trending`/`new`) | bound list |
| 11 | `projects/premium/page.tsx` | added `.limit(48)` (was unbounded) | bound list |

**Already in the tree from Batch 2A (kept, not re-done):**
`lib/auth.ts` — `getAuthUser()` / `getAccountUser()` memoised with React `cache()` so
the account layout + page + `ensureLegalConsent()` share **one** `auth.getUser()` +
**one** `profiles` SELECT per request (was 3–4 `getUser()` + 2 `profiles` on every
`/account/*`); `lib/legalConsent.ts` uses the shared `getAuthUser()`;
`premium/page.tsx` no longer calls `auth.getUser()` on the server (keeps `/premium`
static-ISR — the button now checks session client-side); `account/{applications,
purchases,saved-jobs,saved-projects}/page.tsx` + `custom-projects/my-projects/page.tsx`
+ `projects/category/[category]/page.tsx` — `.limit(100)` / `.limit(48)` caps with
explanatory comments.

## 2. Before / after

Local `next start` measurements (this sandbox has ~0 network latency to Supabase, so
**round-trip and DB-payload reductions do not show up in local TTFB** — they land in
production where each Supabase round-trip is ~50–150 ms). Where a number is
structural (round-trip count, bytes off the DB wire) it's given directly.

| Metric | Before | After |
|---|---|---|
| `projects` detail row off the DB wire | **1261 B** (`select *`, ~30 cols) | **539 B** (15 cols) — **−57%** |
| `companies` detail row | 366 B (`select *`) | 200 B (6 cols) — −45% |
| `custom_project_requests` detail row | `select *` (~25 cols incl. admin/payment internals) | 19 cols (est. ~−40%) |
| `custom-projects/my-projects/[id]` Storage round-trips (req. with F files + D delivery assets) | `1 + 5 + F + (1 + D)` | `1 + 5 + 1 + (1 + 1)` — **F+D−2 fewer** |
| `/resume` (signed-in) round-trip **waves** | 3 (`getOptionalUser`→`loadTemplates`→`Promise.all(4)`→serial 5th) | **2** (`Promise.all(2)` → `Promise.all(5)`) |
| `/account/resume/[id]/edit` round-trip **waves** | 3 serial | **1** |
| `/account/resume/[id]/ats` round-trip **waves** | 2 serial | **1** |
| `/account/*` auth cost per request *(Batch 2A)* | 3–4 × `getUser()` + 2 × `profiles` SELECT | 1 × `getUser()` + 1 × `profiles` SELECT |
| `/premium` render *(Batch 2A)* | `ƒ` dynamic, 3 round-trips/visit incl. `getUser()` | `○` static-ISR, cached |
| `projects/best-sellers`, `projects/premium` | unbounded row scan | ≤ 48 rows |
| Production build | green, 45 s, 57 routes | green, 45 s, 57 routes — **no route/bundle change** |
| `npm run typecheck` / `npm run lint` | — | clean |

Local page probes (unchanged, as expected — the wins are server↔DB, not server↔browser):
`/projects/tr-2` TTFB 27 ms / 112 KB HTML · `/premium` 9 ms / 87 KB · `/referral` 6 ms / 50 KB.

## 3. Item 8 — Database indexes (SQL provided, NOT run)

**Finding: the schema is already well-indexed for the website's access patterns**
(~180 indexes across `mobile-app/` + `admin-panel/` migrations; every user-owned
table the website reads has a matching `(user_id, …)` index or PK). Only a handful
of real gaps.

**→ `website/perf/phase1_indexes.sql`** — ready to review. Highlights:

| Priority | Index | Why |
|---|---|---|
| **High** | `pg_trgm` GIN on `projects.title`, `jobs.title`, `jobs.location` | `/projects` & `/jobs` search is `ILIKE '%term%'` — a leading wildcard **cannot** use a btree index, so every search is a full scan today. |
| **High** | `projects (price)`, `projects (rating desc)`, `jobs (salary_max_lpa desc nulls last)` | Marketplace sort options (`price-low/high`, `rating`, `salary-high`) have **no** supporting index → full sort per request. |
| Med | `resume_versions (user_id)` | `/resume` dashboard tallies versions by `user_id` alone; table only has `(resume_id, created_at)`. |
| Low / optional | `resume_shares (resume_id)`; partial indexes on `faqs`/`testimonials`/`offer_banners`/`announcements` | Tiny tables — negligible unless they grow. |

The prior `website/docs/perf/suggested-indexes.sql` also proposes composite
`projects (category_id, created_at desc)` and `jobs (company_id, posted_at desc)`
for the now-bounded category/company lists — worth adding in the same migration.

**Not needed** (verified already covered): `saved_jobs` PK`(user_id,job_id)`,
`wishlists` PK`(user_id,project_id)`, `applications` unique`(user_id,job_id)`,
`learning_bookmarks` PK`(user_id,topic_id)`, `wallet_transactions (user_id,created_at desc)`,
`purchases (user_id,created_at desc)`, `resumes_builder (user_id,updated_at desc)`,
`resume_downloads (user_id,downloaded_at desc)`, `legal_consents (user_id,accepted_at desc)`,
`reviews (project_id,created_at desc)`, all `custom_project_*` child `(request_id)` indexes.

## 4. Item 9 — RLS policy optimization (SQL provided, NOT run)

**Finding:** `auth.uid()` appears **317 times** across all migration policies;
**0** are wrapped in `(select auth.uid())`.

A bare `auth.uid()` in an RLS `USING` clause is **re-evaluated per row**. Wrapping
it as `(select auth.uid())` makes Postgres evaluate it **once per statement** (an
InitPlan) — Supabase's documented standard practice, a well-known 10–100× RLS
speed-up on large tables. Behaviour is identical.

Every user-owned table the website reads uses the bare form
(`using (auth.uid() = user_id)`): `wallet_transactions`, `notifications`,
`applications`, `purchases`, `wishlists`, `saved_jobs`, `resumes_builder`,
`resume_versions/downloads/shares`, `custom_project_*`, `learning_bookmarks`,
`legal_consents`, `test_attempts`, …

**→ `website/perf/phase1_rls_optimization.sql`** — explicit `alter policy` statements
for the ~15 hottest website tables (PG15+, which Supabase is on), plus the mechanical
pattern for a full codebase-wide sweep (recommended as one dedicated migration owned
by whoever owns the shared DB — it touches mobile-only + admin policies too).

Second, smaller item in the same file: `current_user_is_premium()` is called bare in
~12 premium-gate Learning policies — wrap as `(select current_user_is_premium())`.
Lower impact for the website (it reads Learning mostly via SECURITY DEFINER RPCs) but
part of the same sweep.

## 5. Item 10 — Client `useEffect` fetches → Server Components

**Finding: the website is already SSR-first.** Every list/detail page fetches its
data in a Server Component and ships it with the HTML. The `useEffect`+Supabase
calls that remain are, with one class of exception, **architecturally required**:

| Client fetch | Why it must stay client-side |
|---|---|
| `ProjectPurchasePanel`, `JobApplyPanel`, `LearningBookmarkButton`, `PremiumSubscribeButton` | Per-user state (purchased? applied? bookmarked? premium?) on pages that are **ISR-cached and shared across all visitors**. Moving these server-side would force those pages dynamic and kill the cache. |
| `PremiumTopicContent`, `CodingProblemPremiumGate` | Deliberate: server renders the locked state (anon), the island re-checks with the real session and unlocks for premium members. |
| `MockTestRunner` | Questions are fetched on "Start" so they're not in page source. |
| `MessageThread` | Already server-rendered with `initialMessages`; the effect is a refresh. |
| `useDraft` (custom-project builder) | Client-side draft persistence. |

**The movable ones** are the always-on nav/session islands, already catalogued in
Phase 0 as **B1 / B2 / B6** and in the prior audit as **P-1 / P-2 / P-3 / P-17**:
`useSessionProfile` runs in 4 islands (`AuthMenu`, `NotificationBell`, `MobileNav`,
`PremiumPromo`) — each its own `getUser()` + `profiles` SELECT + `onAuthStateChange`
— and `AnnouncementBar` fires an `announcements` query, on **every page load**. These
force `@supabase/supabase-js` (~64 KB gz) into every route's first-load JS.

**Recommendation:** consolidate them into **one `SessionProfileProvider`** (client,
mounted once) fed by a single read, and lazy-load the Supabase browser client behind
`next/dynamic` so it's off the critical path for signed-out visitors. This is a
focused refactor with real bundle + INP payoff and belongs in **its own phase**
(Phase 0's "P1 – de-Supabase the shell"), not bundled into this data-layer commit —
it changes hydration timing and needs a stable skeleton to avoid layout shift.

Also flagged (needs a schema decision, not app code): **`/account` overview sums the
user's entire `wallet_transactions` table in JS** to show one number. Correct fix is a
DB-side `wallet_balance()` function — SQL drafted in `website/docs/perf/suggested-indexes.sql`
(P-5). Left as-is here because a `.limit()` would make the balance wrong.

## 6. Item 12 — Deploy region vs Supabase region

**Cannot be determined from the repo.** There is **no host deploy config**
(`vercel.json` / `netlify.toml` / `fly.toml` / `Dockerfile` / `.vercel/` — none
exist), so the deploy region is set only in the host dashboard. The Supabase project
ref `oqwjooaapsotnncmhvtk` does not encode its region, and the anon REST endpoint is
Cloudflare-fronted so an external probe only sees the nearest CF edge (Pune, from
this sandbox), not the DB region.

**Action for the owner:**
1. Supabase Dashboard → Project Settings → check the **Region**.
2. Host dashboard → check the deploy / function region.
3. **Make them match** (or be as close as possible). This is a student product with
   ₹ pricing and India-based users, so the Supabase project is almost certainly
   `ap-south-1` (Mumbai) — the deployment should also be Mumbai (e.g. Vercel
   `regions: ["bom1"]` in `vercel.json`, or the equivalent).
4. If co-location isn't possible, the caching work (Phase 0 B3/B4 — `unstable_cache`
   on the catalog reads) and scoped middleware (B5) matter **more**, because every
   dynamic route currently pays a cross-region round-trip per request.

A cross-region hop (e.g. functions in `iad1`/US, DB in Mumbai) adds ~200–250 ms to
**every** server-side Supabase call — which, with today's uncached catalog routes
(Phase 0), is 2–4 hops per page. This is potentially the single biggest TTFB factor
and is **invisible in this environment**.

## 7. Reconciliation with `website/docs/perf/`

Two audit documents now exist for the same work:

| Doc | Author | Adds |
|---|---|---|
| `website/docs/perf/audit-website.md` | Batch 2A (prior, uncommitted) | 20 findings P-1…P-20 in a detailed per-finding format; per-route round-trip/wave tables |
| `website/PERFORMANCE_AUDIT.md` | Phase 0 (this engagement, committed `185c502`) | `@next/bundle-analyzer` data (which Batch 2A couldn't get — "not installed, instructions forbid new deps"); phased plan B1–B15; `next start` TTFB + cache-header probes |

They agree on every substantive point. **Recommendation:** keep both — `docs/perf/`
as the finding-level reference, `PERFORMANCE_AUDIT.md` + this file as the phase
narrative — or fold `docs/perf/audit-website.md`'s P-numbers into an appendix of
`PERFORMANCE_AUDIT.md` and delete the duplicate. **Your call on the commit shape**
(see the message accompanying this report).

## 8. Not done in Phase 1 (and why)

- **`count: "exact"` → `"estimated"` on `/projects` & `/jobs`** (prior P-10): removes a
  filtered `COUNT(*)` per list render, but changes the visible total from exact to
  approximate — a product decision, not a silent perf fix. Flag for Phase 2/3.
- **`resumes_builder` over-fetch on `/resume`** (prior P-7): the dashboard pulls every
  heavy JSON column of every résumé to render summary cards. Narrowing the select is
  safe but needs care that `computeCompletion()` still gets `content` +
  `personal_details` — deferred to keep this commit purely mechanical.
- **`resume_versions` / `resume_downloads` "all rows" counts** on `/resume`: should be a
  grouped aggregate / `count: 'exact', head: true`. Deferred (correctness-sensitive).
- **Learning grid/topic wave ordering** (prior P-9): fold `getTopicPractice` into the
  topic page's `Promise.all`; drop the redundant `getLearningGridBrief`. Small, safe —
  deferred only to keep Phase 1 scoped.
- **The nav/session island consolidation** (item 10 movable set / B1/B2/B6/P-1..P-3):
  its own phase — see §5.

## 9. Reproduce

```bash
cd website
npm run typecheck && npm run lint && npm run build      # all green, 45s

# DB payload before/after (needs the anon key from .env.local):
KEY=$(grep NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local | cut -d= -f2)
curl -s "https://oqwjooaapsotnncmhvtk.supabase.co/rest/v1/projects?id=eq.tr-2&select=*" \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY" | wc -c        # 1261
curl -s "https://oqwjooaapsotnncmhvtk.supabase.co/rest/v1/projects?id=eq.tr-2&select=id,title,category_id,category_name,tech_stack,price,rating,review_count,thumbnail_url,is_premium,is_best_seller,description,images,license,platform_fee_percent" \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY" | wc -c        # 539
```

SQL deliverables (review, then hand to the DB owner — nothing auto-applied):
`website/perf/phase1_indexes.sql`, `website/perf/phase1_rls_optimization.sql`.
