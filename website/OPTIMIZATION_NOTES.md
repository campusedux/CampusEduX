# CampusEduX Website — Performance Optimization Notes

**Engagement:** `website/` (Next.js 14.2.35, App Router) performance pass.
**Branch:** `audit/full-project-review` · **Dates:** 2026-09-06
**Commits:** `185c502` (P0) → `17912ae` (P1) → `7a7ca5c` (P2) → `7ffacba` (P3) → `73d0039` (P4) → this (P5).

Per-phase detail lives in `PERFORMANCE_AUDIT.md` (P0), `PERFORMANCE_PHASE1..4.md`,
and `docs/perf/audit-website.md` (a prior on-branch audit, folded in). This file
is the summary: **what was done, what remains, what needs infra / a paid plan.**

---

## 1. What was done

### The headline change (Phase 2)

Every catalog **detail / landing route** (`/projects/[id]`, `/jobs/[id]`,
`/jobs/companies/[id]`, `/projects/category/[category]`, `/learning/[gridSlug]`,
`/learning/[gridSlug]/[topicSlug]`, `/coding-problems/[problemSlug]`) was served
**`Cache-Control: no-store` on every request** — a cold render + uncached
Supabase round-trips each time — despite each exporting `revalidate = 300`.

**Root cause:** a dynamic-segment route only becomes ISR-cached if it *also*
exports `generateStaticParams`; without it `revalidate` covers only the fetch
data cache, which never sees `@supabase/supabase-js`'s wrapped `fetch`.

Adding `generateStaticParams` + a cross-request `unstable_cache` data layer
(`src/lib/cache.ts`) flipped all 7 to `x-nextjs-cache: HIT`. Locally a warm hit
is **4–19 ms** vs the previous 30–56 ms; in production (real Supabase latency,
possible cross-region hop) the "before" was ~200–500 ms per request with no CDN
caching, the "after" is a CDN edge hit.

### Everything, by phase

| Phase | Change | Effect |
|---|---|---|
| **1** Server/data | `select("*")` → explicit columns (7 sites); parallelised await-waterfalls (`/resume`, resume `edit`/`ats`); batched N storage `createSignedUrl` → 1 `createSignedUrls`; request-memoised `getAuthUser`/`getAccountUser` (`cache()`); bounded 2 unbounded list queries | project detail DB row **1261 B → 539 B (−57 %)**; `/account/*` auth cost 3–4 `getUser()` + 2 `profiles` → **1 + 1** per request |
| **2** Rendering/caching | `generateStaticParams` → **7 routes `ƒ` → `●` ISR** (`dynamicRoutes` 0 → 7); `src/lib/cache.ts` `unstable_cache` layer (detail getters + `/projects`/`/jobs` list queries keyed by filter set + categories + home data), all tagged; `/projects` & `/jobs` get `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` for the CDN; `/api/revalidate` extended to `{ tags: [...] }` → `revalidateTag`; `optimizePackageImports: ["@/components/ui"]` | catalog TTFB `no-store` → CDN/edge HIT; First Load JS −2…−9 kB on most routes |
| **3** Client bundle | `qrcode.react` (~8 kB gz) → `next/dynamic` in `ShareModal`; `demoResumes.ts` (~6 kB gz) → computed server-side, **0 client chunks**; `TemplatePreviewModal` → `next/dynamic`; `useDeferredValue` + `memo` on the résumé editor's live preview; explicit Supabase browser-client singleton | `/resume` 111 → **102**, `/resume/templates` 112 → **104**, `/account/resume/[id]/edit` 125 → **119 kB** |
| **4** Assets | `next.config` images: **+ AVIF/WebP**, `minimumCacheTTL` 60 s → 86400, `deviceSizes` trimmed; `priority` on the home-hero LCP image; blur placeholders on the big images; `<link rel="preconnect">` + `dns-prefetch` for the Supabase origin in `<head>`; `dns-prefetch` Razorpay | AVIF ≈ 20–30 % smaller images; first client Supabase call skips a cold DNS+TLS handshake (~100–300 ms mobile) on every route |
| **5** Verify | Full re-measure (§2); functional smoke of every route class; Lighthouse CI budget added to `website-ci.yml` + `lighthouserc.json` | regression protection |

### Things checked and deliberately **not** changed (< 5 % or a regression)

- **`moment` → `date-fns`:** there is no `moment` (or dayjs / date-fns / luxon).
  Dates use `Intl` + a hand-rolled `timeAgo`. Nothing to do.
- **`next/font` / font subsetting:** there is **no web font** — system stack, no
  `@font-face`, no render-blocking font CSS. Adding `next/font` would *add* a
  download. Not done.
- **Icon barrel imports:** all 97 `lucide-react` imports are already named;
  `optimizePackageImports` (Next default) tree-shakes them per-icon.
- **Unused deps / duplicate versions:** none. All 13 runtime deps used, every
  shared dep `deduped`. **Do not run `npm dedupe`** — it only wants to add
  Windows/WASI optional platform binaries.
- **Supabase client per-render:** `@supabase/ssr`'s `createBrowserClient` is
  already a browser singleton (hardened with an explicit instance anyway).
- **Speculative `memo` on list rows:** résumé section lists are ~10–25 small rows
  with stable keys — not a real re-render problem. Skipped per the brief.
- **In-page `<Suspense>` streaming:** items 2 (ISR) + 2 (`unstable_cache`) remove
  the per-request query blocking it would mitigate; `loading.tsx` already covers
  the routes that need a skeleton. Not added (churn, no user-visible win).

---

## 2. Before / after (measured)

`next build` + `next start` on this machine (≈ 0 network latency to Supabase, so
absolute ms understate the production gain). **Lighthouse / real CWV could not be
measured** — no Chrome in the environment; see §5.

### Render mode & caching

| Route | P0 render | P0 `Cache-Control` | **P5 render** | **P5 `Cache-Control`** | Local TTFB P0 → P5 |
|---|---|---|---|---|---|
| `/` | `○` ISR | `s-maxage=300, swr` | `○` ISR | `s-maxage=300, swr` | 15 ms → **8 ms** |
| `/about` (+ all legal) | `○` static | 1 yr | `○` static | 1 yr | 3 ms → 3 ms |
| `/premium` | **`ƒ` dynamic** (3 round-trips/visit) | `no-store` | **`○` static ISR** | `s-maxage=300` | — |
| `/projects` (list) | `ƒ` | **`no-store`** | `ƒ` (reads `searchParams`) | **`public, s-maxage=60, swr=300`** + cached data | 39 ms → 42 ms |
| `/jobs` (list) | `ƒ` | **`no-store`** | `ƒ` | **`s-maxage=60, swr=300`** + cached data | 19 ms → 22 ms |
| `/projects/[id]` | `ƒ` | **`no-store` (every hit)** | **`●` ISR** | `s-maxage=300, swr` | 56 ms → **5 ms (HIT)** |
| `/jobs/[id]` | `ƒ` | **`no-store`** | **`●` ISR** | `s-maxage=300, swr` | — → **4 ms (HIT)** |
| `/jobs/companies/[id]` | `ƒ` | **`no-store`** | **`●` ISR** | `s-maxage=300, swr` | — → **4 ms (HIT)** |
| `/projects/category/[category]` | `ƒ` | **`no-store`** | **`●` ISR** | `s-maxage=300, swr` | — → **7 ms (HIT)** |
| `/learning/[gridSlug]` | `ƒ` | **`no-store`** | **`●` ISR** | `s-maxage=300, swr` | — → **19 ms (HIT)** |
| `/learning/[gridSlug]/[topicSlug]` | `ƒ` | **`no-store`** | **`●` ISR** (on-demand) | `s-maxage=300, swr` | — → **~5 ms (HIT)** |
| `/coding-problems/[problemSlug]` | `ƒ` | **`no-store`** | **`●` ISR** (on-demand) | `s-maxage=300, swr` | — → HIT |
| `/account/**`, `/custom-projects/**`, `/resume`, `/r/[token]`, mock-test result | `ƒ` | `no-store` | `ƒ` (unchanged — genuinely personalised / mutating) | `no-store` | — |

**ISR-registered dynamic routes: 0 → 7.**

### First Load JS (Next build report, gzip)

| Route | P0 | P5 | Δ |
|---|---|---|---|
| shared by all | 87.8 kB | 87.8 kB | — (framework floor) |
| `/` | 173 | **171** | −2 |
| `/premium` | 173 | **165** | −8 |
| `/login` / `/register` | 175 | **166 / 167** | −9 / −8 |
| `/account/notifications` | 173 | **161** | −12 |
| `/coding-problems/[slug]` | 184 | **176** | −8 |
| `/learning/[gridSlug]/[topicSlug]` | 180 | **171** | −9 |
| `/account/resume/[id]/edit` | 132 | **119** | −13 |
| `/resume` | 119 | **102** | −17 |
| `/resume/templates` | 121 | **104** | −17 |
| `/projects/[id]` / `/jobs/[id]` | 175 / 176 | **172 / 173** | −3 |
| list pages (`/projects`, `/jobs`, `/account/*`) | 105 | **102–104** | −1…−3 |
| `/about` + legal pages | 87.9 | **88** | ± |

**Actual `<script>` bytes on a static page (`/about`, incl. `nomodule` polyfills):
~218 kB gz → ~215 kB gz** — barely moved, because the ~64 kB gz of
`@supabase/supabase-js` + `auth-js` (chunks `6608` + `44530001`) is still pulled
in by the nav islands on every route. **That is the one big lever left** (§3).

### 10 largest client-bundle packages (parsed, unchanged set)

| # | Package | P0 | P5 | Note |
|---|---|---|---|---|
| 1 | `next` (framework/runtime) | ~489 KB | ~483 KB | floor |
| 2 | `react-dom` | 125 KB | 125 KB | floor |
| 3 | `@supabase/ssr` | 120 KB | 120 KB | **B1/B2 — still every route** |
| 4 | `@supabase/auth-js` | 104 KB | 104 KB | **B1/B2** |
| 5 | `lucide-react` (tree-shaken per-icon) | 31 KB | 57 KB | more icons as app grew; still per-icon |
| 6 | `prismjs` | 28 KB | 28 KB | `/compiler` only, already `dynamic` |
| 7 | `qrcode.react` | 15 KB | 15 KB | **now lazy** (P3) — no longer in a route's first load |
| 8–10 | app `./src/*`, `cookie`, `scheduler` | — | — | — |

### Build

| | P0 | P5 |
|---|---|---|
| `next build` (warm) | ~50 s | ~45–65 s (prerenders ~90 bounded static params) |
| `npm test` (Vitest) | — | **278 passed, 12 skipped, 0 failed** |
| `typecheck` / `lint` | clean | clean |

---

## 3. What remains — biggest first

### R1. Nav / session islands pull the Supabase SDK into every route  ★ highest impact, own phase

`useSessionProfile` runs in 4 client islands (`AuthMenu`, `NotificationBell`,
`MobileNav`, `home/PremiumPromo`); `AnnouncementBar` runs a query — all on every
page. They force `@supabase/supabase-js` + `auth-js` (**~64 kB gz**, chunks
`6608` + `44530001`) into every route's first-load `<script>` set, incl. ~20
purely static text pages, and fire 4 `getUser()` + 4 `profiles` reads + a
`announcements` query per navigation (INP cost).

**Fix (a phase of its own — changes hydration timing, needs a stable skeleton):**
one `SessionProfileProvider` (client, mounted once in the root layout) fed by a
single read; islands consume the context. Lazy-load the Supabase browser client
behind `next/dynamic({ ssr:false })` so signed-out visitors never download it.
Fetch the announcement server-side (`unstable_cache`, tag `cms`) and keep only
the dismiss button client-side.
**Expected:** static routes ~215 kB → ~150 kB gz of script; INP drop across the
board; removes the last thing keeping "initial JS < 150 kB per route" out of reach.

### R2. `/projects` & `/jobs` list totals — `count: "exact"`  (medium, product decision)

Each list request runs a filtered `COUNT(*)` for the "N projects" header. Now
that the data is cached the cost is amortised, but `count: "estimated"` (or a
`pageSize + 1` "has next page" heuristic) removes it. **Changes the visible total
from exact to approximate** — needs your sign-off, it's a product call.

### R3. `/learning/[gridSlug]/[topicSlug]` & `/coding-problems/[slug]` prerender  (low, infra-gated)

`generateStaticParams` currently returns `[]` (ISR on demand) so the build
doesn't run ~200 Supabase RPCs. The cached helper functions
(`getLearningTopicParams`, `getCodingProblemSlugs`) are written — switch to them
once the build environment can absorb the RPC load, to prerender the long tail.

### R4. `/mock-tests/[testId]`  (low)

Still `dynamic = "force-dynamic"`. Its content (title, instructions, question
count) is not personalised — an ISR candidate (`generateStaticParams` + drop
`force-dynamic`). Left conservative — it's auth-adjacent and low traffic.

### R5. `/learning/[gridSlug]` payload  (low–medium)

The java-tutorial grid page ships **~569 kB of HTML** — the full 150-topic
section tree is serialised into the `<DocsShell>` client prop for the sidebar.
It's cached now (HIT) so it doesn't re-render, but that's a big parse. Trim the
tree prop to `{ id, slug, title, is_premium }` and/or render the nav list
server-side with only the collapse toggle on the client. (Prior audit P-18.)

### R6. `AnnouncementBar` / Markdown-image CLS  (low)

`AnnouncementBar` renders `null` → a bar (client-fetched) — a downward shift when
an announcement is active. Goes away with R1 (server-render it). Learning-article
Markdown `<img>` has no reserved box (unknown dimensions) — a minor below-fold
reflow.

### R7. `count`/tally reads on `/resume`  (low)

The dashboard fetches every `resume_versions` / `resume_downloads` row just to
count them per résumé. Small (uuid columns), correctness-sensitive — a grouped
aggregate / `count: 'exact', head: true` would be tidier.

---

## 4. Needs a migration, a dashboard change, or a paid plan — **your action**

Nothing below was applied. SQL / steps are provided so you (or whoever owns the
shared Supabase project) can review and run them.

### M1. Database indexes — `website/perf/phase1_indexes.sql`

The schema is already well-indexed; the real gaps:

| Priority | Index | Why |
|---|---|---|
| High | `pg_trgm` GIN on `projects.title`, `jobs.title`, `jobs.location` | `/projects` & `/jobs` search is `ILIKE '%term%'` — a leading wildcard can't use a btree index; every search is a full scan today |
| High | `projects (price)`, `projects (rating desc)`, `jobs (salary_max_lpa desc nulls last)` | marketplace sort options with no supporting index |
| Med | `resume_versions (user_id)` | `/resume` tallies versions by `user_id` alone |

Full file also lists optional composite indexes (from the prior audit) and the
~15 confirmed-covered tables that need nothing.

### M2. RLS policy optimization — `website/perf/phase1_rls_optimization.sql`

`auth.uid()` appears **317 times** across all migration policies; **0** are
wrapped in `(select auth.uid())`. Wrapping it makes Postgres evaluate it **once
per statement** instead of **per row** — Supabase's documented standard, a
10–100× RLS speed-up on large tables, **behaviour identical**. The file has
`ALTER POLICY` statements for the ~15 hottest website tables plus the mechanical
pattern for a full sweep (recommended as one dedicated migration — it also
touches mobile-only + admin policies). Same file: wrap `current_user_is_premium()`
in the ~12 Learning premium-gate policies.

### M3. Supabase deploy region ↔ project region

**No host deploy config exists in the repo** (`vercel.json` etc.), so the deploy
region is set only in the host dashboard. The Supabase project region isn't
discoverable from the anon endpoint.

**Do:** Supabase Dashboard → Project Settings → check the **Region**; check the
host's function region; **make them match**. This is a ₹-priced, India-user
product — the Supabase project is almost certainly `ap-south-1` (Mumbai) and the
deployment should be too (e.g. `vercel.json` `{ "regions": ["bom1"] }`). A
cross-region hop adds ~200–250 ms to **every** server-side Supabase call.

### M4. Supabase Storage image transforms (optional — Pro plan)

`next/image`'s optimizer already resizes + AVIF-converts every catalog image, so
Storage originals are never shipped. On the **Pro plan** you can additionally
move the resize work off the Next server onto Supabase's own image CDN with a
custom `next/image` loader — snippet in `PERFORMANCE_PHASE4.md §23`. Not required;
only a compute offload.

### M5. Wire `revalidateTag` into the admin panel (optional)

`/api/revalidate` now accepts `{ "tags": ["projects" | "jobs" | "categories" |
"companies" | "home" | "learning" | "premium" | "resume-templates" | "cms"] }`
with the `x-revalidate-secret` header. After a catalog edit the admin panel (or a
Supabase DB webhook) should POST the relevant tag so changes appear immediately
instead of waiting out the `revalidate` window.

### M6. `wallet_balance()` RPC (optional — from the prior audit, P-5)

`/account` sums the user's entire `wallet_transactions` table in JS to show one
number. A `SECURITY DEFINER` `wallet_balance()` function returning the scalar is
drafted in `website/docs/perf/suggested-indexes.sql`. Correctness-sensitive
(defines "balance") — your call.

---

## 5. Measurement & verification status

### Verified

- `npm test` — **278 passed / 12 skipped / 0 failed**, incl. the résumé
  export (DOCX round-trip), export→extract→parse (PDF), auth-helper, marketplace,
  payments-verdict, JSON-LD-XSS and SEO suites.
- `typecheck` + `lint` clean; `next build` green.
- Server smoke — **every one of ~19 page route classes returns HTTP 200 with the
  expected content**; every `/api/*` route rejects `GET` cleanly (405/400).
- Marketplace filtering / sorting / pagination — 12 filter combinations on
  `/projects` + `/jobs`, correct card counts and the "N projects / N roles"
  header.
- Cache headers — the 7 ISR routes serve `x-nextjs-cache: HIT`; `/projects` &
  `/jobs` serve the CDN `s-maxage=60` header; `/account/*` stay `no-store`.
- **RLS unchanged.** `src/lib/cache.ts` only ever calls `getPublicSupabase()`
  (anon key, `persistSession:false`) against tables with a `select using (true)`
  policy. No cookie-bound / user-scoped query is cached. `middleware.ts` and the
  `createAuthedServerSupabase()` path were not touched.

### Not verifiable in this environment

- **Lighthouse / real Core Web Vitals (LCP, INP, CLS, TBT) and the perf score.**
  No Chrome / headless browser here, and the site isn't deployed to a public URL.
  The CWV numbers in `PERFORMANCE_AUDIT.md` are lab *estimates*, flagged as such.
  **→ This is what the new Lighthouse CI job is for** (§6): it runs on every PR
  with a real headless Chrome on the GitHub runner and fails the check on a
  regression.
- **End-to-end AVIF negotiation / blur-placeholder render** — the seed database
  has zero images (no project thumbnails, company logos or banners), so the image
  pipeline couldn't be exercised against real data. `next.config` settings are
  baked into `.next/required-server-files.json` and `/_next/image` behaviour was
  verified (`400` disallowed host, `404` missing); re-check on a deploy with real
  catalog images.
- **Interactive flows end-to-end** (purchase, job apply, wallet top-up, résumé
  save/export in a browser) — need a real auth session + a browser. The
  underlying server actions / API routes / helpers are covered by the Vitest
  suites above and were not changed in Phases 2–4 (Phase 1's `select`/waterfall
  edits are covered by `marketplace.test.ts` / `auth.test.ts` / the résumé
  suites). `ResumeEditor`'s autosave still keys off the live `content` state, not
  the deferred preview copy (verified in the diff).

---

## 6. Regression protection — Lighthouse CI

Added to **`.github/workflows/website-ci.yml`** — a `lighthouse` job that runs on
**pull requests only** (keeps it off every branch push):

1. `npm ci` → `npm run build` (no Supabase env — measures the shared shell,
   bundle, compression and image formats; data-dependent LCP isn't covered).
2. `npx @lhci/cli@0.14.x autorun` → `next start` + 3 mobile Lighthouse runs against
   `/`, `/about`, `/premium`, `/resume/templates`, `/compiler`, `/login`.

Budget in **`website/lighthouserc.json`**:

| Assertion | Level | Threshold | Rationale |
|---|---|---|---|
| `cumulative-layout-shift` | **error** | ≤ 0.10 | the brief's target; no image CLS today |
| `resource-summary:script:size` | **error** | ≤ 240 kB | ≈ today + headroom — a regression guard, not the 150 kB goal (needs R1) |
| `uses-text-compression` / `unminified-js` / `unminified-css` | **error** | pass | must never regress |
| `categories:performance` | warn | ≥ 0.85 | aspirational |
| `largest-contentful-paint` | warn | ≤ 2800 ms | the 1.2 s target needs R1 |
| `first-contentful-paint` / `total-blocking-time` / `interactive` / `speed-index` | warn | — | track, don't block |
| `modern-image-formats` / `uses-responsive-images` / `prioritize-lcp-image` / `render-blocking-resources` | warn | pass | protects the Phase 4 work |

`error` fails the PR check; `warn` shows in the run log. Tighten the `warn`
thresholds to `error` as R1–R5 land. Reports upload to `temporary-public-storage`
(swap for an LHCI server or `filesystem` target if you want history).

**Note:** this budget hasn't been exercised in this environment (no Chrome). The
config is JSON-validated and the audit ids are standard Lighthouse ids; the first
CI run on a real PR will confirm the thresholds are calibrated — adjust the
numeric values in `lighthouserc.json` from that run if needed.
