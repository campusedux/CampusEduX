# Performance audit — `website/` (Next.js 14.2.35, App Router)

Read-only audit. No source files changed except this report.
Date: 2026-09-06. Branch: `audit/full-project-review`.

- Framework: Next.js `14.2.35`, App Router, React `18.3.1`
- Data: Supabase (shared project), three client factories in `src/lib/supabase/`
  - `getPublicSupabase()` — anon, `persistSession:false`, public catalog (server)
  - `createAuthedServerSupabase()` — `@supabase/ssr`, cookie session (server, `/account`)
  - `createBrowserSupabase()` — `@supabase/ssr` browser client (client components)
- Package manager: npm. Node `v22.23.1` (repo targets Node 20 per `@types/node`).
- Commands used: `npm run build` (completed, exit 0). Lint/typecheck/test not run (not requested).
- Bundle analyzer: **not installed** — not added (instructions forbid new deps). Chunk
  attribution below is from the real `next build` output + inspection of the emitted
  `.next/static/chunks/*.js` and prerendered `.next/server/app/*.html`.

---

## Step 1 — Route map

`○` = static/prerendered, `ƒ` = server-rendered on demand, `ISR` = `revalidate` set.
"DB calls" = server-side `.from()` / `.rpc()` / `storage` round-trips in the page module
(does **not** include the `/account` layout's own calls or middleware — see note).
"Client fetches" = Supabase calls fired from the browser after hydration.

### Public catalog

| Route | Render | Data fetched | Where (file:line) | DB calls / waves | Client fetches |
|---|---|---|---|---|---|
| `/` | ○ ISR 300 | trending projects, latest jobs, testimonials, faqs, home banner, offer banners, then learning grids | `src/app/page.tsx:45-68` (`Promise.all` ×6), `src/components/home/LearningResources.tsx:12` | 7 / **2** | `useSessionProfile` ×4 (header ×3 + `PremiumPromo`) + `AnnouncementBar` ×1 |
| `/projects` | ƒ (searchParams) ISR 120 | projects page + `count:exact`, categories | `src/app/projects/page.tsx:48-64` | 2 / 1 | header ×3 + announcement |
| `/projects/[id]` | ƒ ISR 300 | project `select('*')`, then reviews (+profile join), related projects | `src/app/projects/[id]/page.tsx:19`, `:22-37` | 3 / **2** | header + `ProjectPurchasePanel` (`getUser` on mount) |
| `/projects/category/[category]` | ƒ ISR 300 | category name, **all** projects in category (no limit) | `src/app/projects/category/[category]/page.tsx:12-19` | 2 / 1 | header |
| `/projects/trending` `/new` `/best-sellers` `/premium` | ○ ISR 300 | one projects query each | `src/app/projects/*/page.tsx` | 1 / 1 | header |
| `/jobs` | ƒ (searchParams) ISR 120 | jobs page + `count:exact` | `src/app/jobs/page.tsx:27-37` | 1 / 1 | header |
| `/jobs/[id]` | ƒ ISR 300 | job `select('*', company:companies(...))` | `src/app/jobs/[id]/page.tsx:19-24` | 1 / 1 | header + `JobApplyPanel` (`getUser`) |
| `/jobs/companies` | ○ ISR 300 | companies top 60 | `src/app/jobs/companies/page.tsx:11-15` | 1 / 1 | header |
| `/jobs/companies/[id]` | ƒ ISR 300 | company `select('*')`, **all** jobs for company (no limit) | `src/app/jobs/companies/[id]/page.tsx:16-23` | 2 / 1 | header |
| `/learning` | ƒ (searchParams) ISR 300 | learning grids, + search hits when `?q=` | `src/app/learning/page.tsx:44` | 1–2 / 1 | header |
| `/learning/[gridSlug]` | ƒ ISR 300 | grid brief, then full tree | `src/app/learning/[gridSlug]/page.tsx:34`, `:37` | 2 / **2** | header |
| `/learning/[gridSlug]/[topicSlug]` | ƒ ISR 300 | tree + topic content (`Promise.all`), then topic practice | `.../[topicSlug]/page.tsx:42-45`, `_components/TopicPractice.tsx:15` | 3 / **3** | header + `PremiumTopicContent` (`getUser` + RPC, premium topics only) |
| `/coding-problems/[problemSlug]` | ƒ ISR 300 | `coding_problem_detail` RPC | `src/app/coding-problems/[problemSlug]/page.tsx:45` | 1 / 1 | header + premium gate island (`getUser`) |
| `/mock-tests/[testId]` | ƒ **dynamic** | `mock_test_detail` RPC | `src/app/mock-tests/[testId]/page.tsx:13` | 1 / 1 | header + `MockTestRunner` (`getUser`) |
| `/mock-tests/[testId]/result/[attemptId]` | ƒ dynamic | `getUser`, attempt, questions | `.../result/[attemptId]/page.tsx` | 3 / 2 | header |
| `/premium` | **ƒ (should be ○/ISR)** | premium_plans `select('*')`, premium_features `select('*')`, then `auth.getUser()` | `src/app/premium/page.tsx:29-37` | 3 / **2** | header + `PremiumSubscribeButton` |
| `/custom-projects` | ○ ISR 300 | pricing, platform pricing, feature catalog | `src/app/custom-projects/page.tsx:32-40` (`Promise.all` ×3) | 3 / 1 | header |
| `/faq` `/referral` `/resume/templates` | ○ ISR 300 | one query each | resp. files | 1 / 1 | header |
| `/r/[token]` | ƒ dynamic | `get_shared_resume` RPC, then template accent row | `src/app/r/[token]/page.tsx:30`, `:34` | 2 / **2** | header |
| `/about` and ~20 legal/content pages | ○ | none | — | 0 | header ×3 + announcement |

### Account (all pass through `src/app/account/layout.tsx`)

**Every `/account/*` request also runs, before the page:** middleware `auth.getUser()`
(`src/middleware.ts:31`), layout `requireUser()` → `auth.getUser()` + `profiles` SELECT
(`src/lib/auth.ts:29-41`), layout `ensureLegalConsent()` → `auth.getUser()` + `legal_consents`
SELECT (`src/lib/legalConsent.ts:24-40`). None of these are shared with the page's own
`requireUser()`.

| Route | Data fetched | Where | Page DB calls / waves |
|---|---|---|---|
| `/account` | `requireUser()` again, then wallet_transactions (**all rows**), purchase count, application count, wishlist count, referral_codes | `src/app/account/page.tsx:8-18` | 6 / 2 |
| `/account/wallet` | `requireUser()`, wallet_transactions limit 50 | `src/app/account/wallet/page.tsx:9-16` | 2 / 2 |
| `/account/purchases` | `requireUser()`, purchases + project join (**no limit**) | `src/app/account/purchases/page.tsx:9-16` | 2 / 2 |
| `/account/applications` | `requireUser()`, applications + job join (**no limit**) | `src/app/account/applications/page.tsx:21-28` | 2 / 2 |
| `/account/saved-jobs` / `saved-projects` | `requireUser()`, saved rows + full join (**no limit**) | resp. files | 2 / 2 |
| `/account/notifications` | `requireUser()`, notifications limit 50 | `src/app/account/notifications/page.tsx:9-15` | 2 / 2 |
| `/account/profile` | `requireUser()`, courses + branches + academic_years (`Promise.all`) | `src/app/account/profile/page.tsx:9-13` | 4 / 2 |
| `/account/referral` | `requireUser()`, referral rows | `src/app/account/referral/page.tsx` | 3 / 2 |
| `/resume` (Builder hub, `force-dynamic`) | `getOptionalUser()`, `loadTemplates()` (resume_templates), then `Promise.all`(resumes_builder **heavy JSON**, resume_versions, resume_downloads, resume_downloads again), then **resume_templates a 2nd time** | `src/app/resume/page.tsx:50-120` | 7 / **4** |
| `/account/resume/[id]/edit` | `requireUser()`, resumes_builder (heavy JSON), resume_templates, resume_shares | `.../edit/page.tsx:9-32` | 4 / **4** |
| `/account/resume/[id]/preview` / `ats` | `requireUser()`, resumes_builder (heavy JSON), resume_templates accent; `ats` adds `compute_ats_breakdown` RPC | resp. files | 3–4 / 3–4 |
| `/account/resume/[id]/jd-match` / `projects` / `versions` | `requireUser()`, resumes_builder (`id,title` only), then a server action | resp. files | 2–3 / 2–3 |
| `/custom-projects/my-projects` | `requireUser()`, custom_project_requests list (**no limit**) | `.../my-projects/page.tsx:18-28` | 2 / 2 |
| `/custom-projects/my-projects/[id]` | `requireUser()` (gate only), request `select('*')`, then `Promise.all` ×5, then signed-URL `Promise.all` over files, then delivery assets + signed URLs | `.../[id]/page.tsx:27-94` | up to 11 / 4 |

### API routes (all `dynamic = "force-dynamic"`, no page JS)

`/api/resume/export/pdf` (`@react-pdf/renderer`), `/api/resume/export/docx` (`docx`),
`/api/resume/parse` (`pdf-parse` + `mammoth`), `/api/resume/assist` (`@anthropic-ai/sdk`),
`/api/coding-problems/judge`, `/api/compiler/run`, `/api/revalidate`.
All heavy libraries are confined to these routes — see finding P-14 note.

---

## Step 3 — What was measured

Production build: `npm run build` → **exit 0**, 57 static pages generated.

**First Load JS (from `next build`, gzip estimate):**

- Shared by all routes: **87.8 kB** (`fd9d1056` 53.6 kB framework, `2117` 31.7 kB, misc 2.4 kB)
- Clean content/legal pages (`/about`, `/terms`, …): **87.9 kB** (per the build table)
- List pages (`/jobs`, `/projects`, `/faq`, `/account/purchases`, …): **~105 kB**
- Interactive pages (`/`, `/premium`, `/projects/[id]`, `/jobs/[id]`, `/register`, `/login`,
  `/account/profile|wallet|notifications`, `/custom-projects/*`, `/mock-tests/[testId]`): **173–177 kB**
- `/learning/[gridSlug]/[topicSlug]`: **180 kB**
- `/coding-problems/[problemSlug]`: **184 kB** (highest)
- `/account/resume/[id]/edit`: page chunk **20.5 kB**, First Load **132 kB** (editor; no Supabase browser chunk — uses server actions)
- `/compiler`: **116 kB** (Prism is `next/dynamic`-split — good)

**Largest emitted chunks (raw bytes, `.next/static/chunks/`):**

| Chunk | Raw | Identity (from string fingerprint) |
|---|---|---|
| `6608-*.js` | **190,846 B** | `@supabase/supabase-js` **incl. `realtime-js`** (`realtime` ×23, `@supabase` ×31, `GoTrueClient`) |
| `fd9d1056-*.js` | 172,835 B | React / react-dom framework |
| `framework-*.js` | 136,700 B | Next framework |
| `2117-*.js` | 124,365 B | Next/app runtime |
| `main-*.js` | 116,300 B | app bootstrap |
| `polyfills-*.js` | 112,594 B | legacy-only (not in modern First Load) |
| `44530001-*.js` | 65,372 B | more `@supabase` (`GoTrueClient` / `@supabase/ssr`) |
| `app/account/resume/[id]/edit/page-*.js` | 43,500 B | résumé editor |
| `app/coding-problems/[problemSlug]/page-*.js` | 23,100 B | problem workspace |
| `app/compiler/page-*.js` | 21,700 B | compiler workspace |
| `9704-*.js` | 24,000 B | `qrcode.react` (only on routes with `ShareModal`) |

**Ground truth from prerendered HTML** — `.next/server/app/about.html` emits, as blocking
`<script src>`: `6608` (190,846 B) + `44530001` (65,372 B) + framework + `2117` + `2972` +
`polyfills` → **~715 kB raw / ~600 kB excl. polyfills**. So `@supabase/supabase-js` **with
the realtime client ships in the first-load `<script>` of a pure static page that has no
interactivity of its own.** (The `next build` table's per-route "87.9 kB" does not surface
this layout-level chunk in its per-route column; the HTML does.)

**Static counts (server-side Supabase round-trips):** see the route tables above.
Worst offenders: `/account` (12 round-trips incl. 4× `auth.getUser()` once middleware +
layout + consent + page are summed), `/resume` (7 calls / 4 sequential waves),
`custom-projects/my-projects/[id]` (up to 11).

**`select("*")` count:** `projects/[id]`, `jobs/[id]`, `jobs/companies/[id]`,
`custom_project_requests` detail, `premium_plans`, `premium_features` (2 in `premium`,
plus `referral`, `jobs/companies/[id]` = grep total 8 occurrences across page modules).

**Assets on disk:** `website/public/` **does not exist**. No local images, no font files
(`next/font` not used; system font stack per `src/app/layout.tsx`). All images are remote
Supabase Storage URLs rendered through `next/image` with `sizes` set on `fill` images
(`ProjectCard`, `JobCard`, home hero). Raw `<img>` is used only for user avatars (host not
in `next.config` `remotePatterns` — deliberate) and admin-authored Markdown images
(`loading="lazy"`). **No image finding.**

**Not measurable in this environment:** real TTFB / LCP / TTI / INP, device FPS, network
waterfalls, live Supabase query latency, GoTrue `getUser()` round-trip time, CDN/edge cache
behaviour, gzip/brotli transfer sizes as served.

---

## Step 4 — Findings

### P-1 `requireUser()` is not request-memoised — auth runs 2–4× per `/account` page

- File(s): `src/lib/auth.ts:26-52` (`requireUser`), `src/lib/auth.ts:60-72` (`getOptionalUser`), `src/app/account/layout.tsx:9-11`, `src/lib/legalConsent.ts:24-40`, and every `src/app/account/**/page.tsx` (e.g. `account/page.tsx:8`, `account/wallet/page.tsx:8`, `account/resume/[id]/edit/page.tsx:9`)
- Problem: `requireUser()` does `auth.getUser()` + a `profiles` SELECT and is called by the account layout **and** independently by each child page. `ensureLegalConsent()` (also in the layout) does its own third `auth.getUser()`. `src/middleware.ts:31` does a fourth on the same request. Nothing is shared.
- Why slow: `supabase.auth.getUser()` is a network round-trip to the Supabase Auth (GoTrue) `/auth/v1/user` endpoint every call — it re-validates the JWT server-side, it is not a local cookie read. On `/account` the request makes 4 sequential-ish GoTrue calls + 2 identical `profiles` SELECTs before the page's own 5 queries start. Layout and page render concurrently but each still issues its own calls.
- Severity: High
- Estimated impact: `/account` drops from ~12 server round-trips to ~9, removing 2 of 4 GoTrue calls and 1 of 2 `profiles` SELECTs from the critical path; every other `/account/*` route drops 1 GoTrue + 1 `profiles` SELECT.
- Fix: Wrap the `getUser()` + `profiles` lookup in React `cache()` (per-request memo) in `src/lib/auth.ts`, and have `ensureLegalConsent()` accept the already-resolved user id instead of calling `auth.getUser()` again. The account layout, `ensureLegalConsent`, and the page then share one call. Middleware's call stays separate (different client instance, different execution context) and is fine.
- Risk: Low
- Touches business logic: no

### P-2 Client nav re-runs `useSessionProfile` 3–4× per page load

- File(s): `src/lib/useSessionProfile.ts:22-67`; consumers `src/components/nav/AuthMenu.tsx:28`, `src/components/nav/NotificationBell.tsx:14`, `src/components/nav/MobileNav.tsx:19`, `src/components/home/PremiumPromo.tsx:12`
- Problem: `useSessionProfile` is a hook with its own `useEffect` that calls `supabase.auth.getUser()` + a `profiles` SELECT + registers an `onAuthStateChange` subscription. It has no shared cache, so each mounted instance repeats all of it. `<Header>` (root layout) mounts 3 instances on every page; the home page adds a 4th (`PremiumPromo`).
- Why slow: 3–4 concurrent browser→GoTrue `getUser()` round-trips + 3–4 `profiles` SELECTs + 3–4 realtime auth listeners, on every page navigation, purely to decide whether to show an avatar / "Sign in" button. `getUser()` (network) is used where `getSession()` (local cookie read) would answer the same question.
- Severity: High
- Estimated impact: Removes 2–3 of 3–4 `getUser()` calls and 2–3 of 3–4 `profiles` SELECTs on every page; collapses 3–4 auth listeners to 1.
- Fix: Introduce one `SessionProfileProvider` (client) mounted once in the root layout; `useSessionProfile` reads from its context. Do the fetch once. Use `getSession()` for the presence check and only fetch `profiles` once per real session. (Combine with P-17.)
- Risk: Low
- Touches business logic: no

### P-3 `@supabase/supabase-js` (incl. realtime) is in the blocking first-load JS of every route

- File(s): chunk `.next/static/chunks/6608-*.js` (190,846 B raw); pulled by `src/components/nav/Header.tsx` → `AuthMenu` / `NotificationBell` / `MobileNav` → `src/lib/useSessionProfile.ts:4` → `src/lib/supabase/browser.ts:1` (`@supabase/ssr` → `@supabase/supabase-js`). Also `src/components/home/AnnouncementBar.tsx:5`.
- Problem: The root-layout header is a set of client islands that import the Supabase browser client. That forces `6608` (`supabase-js` + `realtime-js` + `GoTrueClient`) into the first-load `<script>` set of **every** route, including ~20 purely static content/legal pages that have no interactivity. Confirmed in `.next/server/app/about.html` (emits `6608` + `44530001` as blocking scripts).
- Why slow: ~256 kB raw (`6608` + `44530001`) / roughly 60–75 kB gzip of JS is parsed and evaluated on first load of pages that never touch Supabase from the browser. `realtime-js` (websocket/phoenix client) is dead weight — `grep` finds **zero** `.channel()` / `.subscribe()` / `postgres_changes` usage anywhere in `src/`; the only realtime API used is `onAuthStateChange`.
- Severity: High
- Estimated impact: Moving the header auth island behind `next/dynamic` (client-lazy) takes `6608`/`44530001` out of the critical first-load `<script>` for ~40 static/list routes — those drop from ~173 kB / ~715 kB-raw toward the ~88–105 kB tier; the chunk then loads after hydration only where a signed-in UI is actually shown.
- Fix: (a) Lazy-load the header auth/notification/menu islands with `next/dynamic(..., { ssr: false, loading: skeleton })` so the Supabase browser chunk is deferred, not render-blocking. (b) On mutation pages (`ProjectPurchasePanel`, `JobApplyPanel`, `TopUpForm`, etc.) keep the browser client but consider a lighter session check. (c) Track upstream: `@supabase/supabase-js` v2 always bundles `realtime-js`; there is no supported tree-shake, but pinning to a build that lazy-imports realtime (or wrapping `createClient` to stub `realtime`) would shed ~30–40 kB raw. Treat (c) as investigation, not a committed change.
- Risk: Medium (dynamic import changes hydration timing of the header; needs a stable skeleton to avoid layout shift)
- Touches business logic: no

### P-4 `/premium` is server-rendered on every request despite `revalidate = 300`

- File(s): `src/app/premium/page.tsx:8` (`export const revalidate = 300`), `src/app/premium/page.tsx:37` (`await createAuthedServerSupabase().auth.getUser()`)
- Problem: The page reads cookies via `createAuthedServerSupabase()` in the page body to pass `isSignedIn` to `PremiumSubscribeButton`. Any `cookies()` access opts the route out of static generation — `next build` marks `/premium` as `ƒ` (Dynamic), so `revalidate = 300` never takes effect.
- Why slow: Every `/premium` hit is a full server render + 3 DB round-trips (`premium_plans` `select('*')`, `premium_features` `select('*')`, `auth.getUser()` to GoTrue), instead of a cached HTML response. The two catalog queries are identical on every request.
- Severity: Medium
- Estimated impact: Restores ISR — `/premium` becomes 1 cached render per 300 s instead of a 3-round-trip render per visitor. Also removes the 3rd round-trip (`getUser`) from that path entirely.
- Fix: Remove the server `auth.getUser()` from the page. `PremiumSubscribeButton` is already a client component — let it read session client-side (via the P-2 provider), same pattern the rest of the site uses deliberately to keep catalog pages static (`src/lib/useSessionProfile.ts:14-19` documents exactly this constraint).
- Risk: Low
- Touches business logic: no

### P-5 `/account` overview loads the user's entire `wallet_transactions` table to sum a balance in JS

- File(s): `src/app/account/page.tsx:13` (`supabase.from("wallet_transactions").select("type,amount").eq("user_id", user.id)` — no `.limit()`), reduced at `:20`
- Problem: To show one number ("Wallet balance") the overview fetches every transaction row for the user and sums `credit − debit` in JavaScript. `/account/wallet` does the same over `.limit(50)` (`account/wallet/page.tsx:11-18`) — so the two pages can even show different balances, but that is a correctness issue, not this audit's.
- Why slow: Unbounded row transfer + parse that grows with account age; the actual displayed value is a single scalar. On a heavy wallet user this is the largest payload on the overview page.
- Severity: Medium
- Estimated impact: Replaces an O(all-transactions) fetch with one scalar; overview payload and query cost stop growing with account age.
- Fix: Add a Postgres-side sum — a `wallet_balance(user_id)` SQL function / view, or a maintained `profiles.wallet_balance` column — and select that. (Schema change is out of scope for Phase 2; flag for the owner.) Interim in app code: at least `.limit()` + document the cap, or use `select('amount, type', { head:false })` with an aggregate via `.rpc()`.
- Risk: Medium (a DB-side balance must match the existing `credit`/`debit` semantics exactly)
- Touches business logic: yes (defines "balance")

### P-6 Account list pages have no `.limit()` / pagination

- File(s): `src/app/account/purchases/page.tsx:12-16`, `src/app/account/applications/page.tsx:24-28`, `src/app/account/saved-jobs/page.tsx:10-14`, `src/app/account/saved-projects/page.tsx:12-16`, `src/app/custom-projects/my-projects/page.tsx:24-28`
- Problem: Each selects all of the user's rows (with an embedded `projects` / `jobs` join for purchases/applications/saved-*) ordered by `created_at desc`, no limit, no pagination.
- Why slow: Payload and render cost scale linearly with how much the user has bought / applied to / saved. The joins pull full card data (`thumbnail_url`, `tech_stack`, …) for every historical row.
- Severity: Medium
- Estimated impact: Bounds each page to a page-size (e.g. 20–30) + "load more"; large accounts stop transferring hundreds of joined rows.
- Fix: Add `.range(0, PAGE-1)` + a cursor/"load more" (the marketplace already has `Pagination` + `parsePage` helpers in `src/lib/marketplace.ts` to reuse).
- Risk: Low
- Touches business logic: no

### P-7 `/resume` hub fetches `resume_templates` twice and over-fetches full résumé JSON per row

- File(s): `src/app/resume/page.tsx:22-31` (`loadTemplates()` → `resume_templates`), `:108-117` (`Promise.all` incl. `resumes_builder` selecting `personal_details, content, education, skills, sections, layout, design, …`), `:119` (`publicSupabase.from("resume_templates").select("id, name")` — **second** fetch of the same table)
- Problem: `resume_templates` is queried once in `loadTemplates()` and again inline for a `id→name` map; `loadTemplates()`'s result already carries `id` + label. Separately, the dashboard cards only need `title / atsScore / updatedAt / completion / counts`, but the query pulls every heavy JSON column of every résumé the user owns. The page also has 4 sequential `await` waves: `getOptionalUser()` → `loadTemplates()` → `Promise.all(4)` → second `resume_templates`.
- Why slow: One redundant table round-trip; a payload that includes full résumé documents (each up to the 20-section `content` model in `src/lib/resumeBuilder/content.ts`) × N résumés just to render summary cards; 4 serial round-trips where 2 would do.
- Why slow (cont.): `resume_downloads` is also queried twice in the `Promise.all` (`:115` all rows for a per-résumé count, `:116` last 10 for the list) — the count could be a grouped aggregate.
- Severity: Medium
- Estimated impact: Removes 1 of 7 queries (2nd `resume_templates`), collapses 4 waves → 2, and cuts the `resumes_builder` payload to ~5 scalar columns + `content` (needed only for `computeCompletion`).
- Fix: Reuse the `loadTemplates()` array for the name map. Parallelise `getOptionalUser()` + `loadTemplates()`. Narrow the `resumes_builder` select to `id, title, template, ats_score, updated_at, is_demo, content, personal_details` (drop `education, skills, sections, layout, design`). Replace the `resume_downloads`/`resume_versions` "all rows" counts with `select('resume_id', { count:'exact', head:true })` per résumé or a single grouped query.
- Risk: Low
- Touches business logic: no

### P-8 `/projects/[id]` — reviews query waits behind the project row unnecessarily

- File(s): `src/app/projects/[id]/page.tsx:19` (`await ...select('*')...single()`), then `:22-37` (`Promise.all([reviews, related])`)
- Problem: The project row is awaited first; then reviews **and** related are fetched. `related` genuinely needs `project.category_id`, but `reviews` only needs the route `id` — it is being serialised behind the project fetch for no dependency reason. Also `select('*')` on `projects` pulls every column (description, images[], requirements, license, fee fields…) for a page that renders a known subset.
- Why slow: Two round-trip waves where the critical path could be one for reviews; unused columns in the row payload.
- Severity: Low (ISR 300 amortises it, but it is on the cold-render / revalidation path)
- Estimated impact: Reviews resolve in wave 1 with the project; wave 2 is only `related` (and only when `category_id` exists).
- Fix: `Promise.all([project, reviews])` first; then `related` conditionally. Replace `select('*')` with the explicit column list the template + JSON-LD use.
- Risk: Low
- Touches business logic: no

### P-9 `/learning/[gridSlug]` runs two independent reads in series; topic page adds a third wave

- File(s): `src/app/learning/[gridSlug]/page.tsx:34` (`await getLearningGridBrief`), `:37` (`await getLearningTree`); `src/app/learning/[gridSlug]/[topicSlug]/page.tsx:42-45` (`Promise.all([tree, page])`) then `_components/TopicPractice.tsx:15` (`await getTopicPractice`) rendered as a child async server component
- Problem: On the grid page, `getLearningGridBrief` (a table select) and `getLearningTree` (an RPC) both take only `gridSlug` and are awaited one after the other. `getLearningTree` already returns `tree.grid` (name/slug/description) — the brief is largely redundant with it, used only for the 404 check + metadata. On the topic page, `TopicPractice` is a separate async child, so its RPC runs as a 3rd sequential wave after `Promise.all([tree, page])` resolves.
- Why slow: Extra serial round-trips on the cold/revalidation render of every learning grid and topic. All three learning read helpers are `cache()`-wrapped (`src/lib/learning.ts`), so metadata↔page sharing is already good — this is purely wave ordering.
- Severity: Low
- Estimated impact: Grid page 2 waves → 1. Topic page 3 waves → 2 (fold practice into the `Promise.all`). Optionally remove the `getLearningGridBrief` call entirely by driving 404 + metadata off `getLearningTree`.
- Fix: `Promise.all([getLearningGridBrief(slug), getLearningTree(slug)])` on the grid page (or drop the brief). On the topic page, fetch `getTopicPractice` inside the page's `Promise.all` and pass the result down to `<TopicPractice>` as a prop.
- Risk: Low
- Touches business logic: no

### P-10 `count: "exact"` on every marketplace list request

- File(s): `src/app/projects/page.tsx:50` (`.select(PROJECT_LIST_FIELDS, { count: "exact" })`), `src/app/jobs/page.tsx:29`, `src/lib/marketplace.ts` (`totalPages`)
- Problem: Every projects/jobs list request asks PostgREST for an exact total row count (with the same `WHERE` filters) to render "N projects" and the page count.
- Why slow: `count: exact` forces a second `COUNT(*)` over the filtered set on each request. On a large `projects` / `jobs` table with a `ILIKE '%…%'` filter (see P-11) this count scans as much as the data query. ISR 120 caps the frequency but not the cold cost.
- Severity: Low–Medium (depends on table size — **not measurable here**, tables are empty/small in this env)
- Estimated impact: Replacing exact count with `count: "planned"` / `"estimated"`, or dropping it for a `fetch pageSize+1 → hasNextPage` heuristic, removes one full scan per list render.
- Fix: Use `count: "estimated"` for the header number (or hide it) and derive "has next page" by requesting `PAGE_SIZE + 1` rows. Keep exact count only if the product needs a precise total.
- Risk: Low (Medium if the exact number is a product requirement)
- Touches business logic: no (yes if the visible total must be exact)

### P-11 Leading-wildcard `ILIKE '%q%'` search on list pages

- File(s): `src/app/projects/page.tsx:54` (`query.ilike("title", '%'+q+'%')`), `src/app/jobs/page.tsx:33-34` (`ilike("title", …)`, `ilike("location", …)`)
- Problem: Free-text search is a `title ILIKE '%term%'` (and `location ILIKE '%term%'`) predicate.
- Why slow: A leading `%` defeats any B-tree index on the column — Postgres must sequential-scan and pattern-match every row, combined with the `count: exact` from P-10.
- Severity: Low–Medium (**not measurable here** — no data volume)
- Estimated impact: With a `pg_trgm` GIN index or a `tsvector` full-text column, search goes from O(rows) to index lookup. Learning search already uses an RPC (`learning_search`) — the marketplace could follow that pattern.
- Fix: Add a trigram/full-text index (schema change — flag to owner) and/or route search through an RPC like Learning does. In app code alone: cap the searched set, or require a minimum term length.
- Risk: Medium (needs a migration; behaviour of ranking may change)
- Touches business logic: no

### P-12 `select("*")` on detail-page rows

- File(s): `src/app/projects/[id]/page.tsx:19`, `src/app/jobs/[id]/page.tsx:21`, `src/app/jobs/companies/[id]/page.tsx:17`, `src/app/custom-projects/my-projects/[id]/page.tsx:32`, `src/app/premium/page.tsx:30-31`
- Problem: Single-row detail fetches use `select("*")`, returning every column including large text/array fields the page never reads.
- Why slow: Wider row payload over the wire and through PostgREST serialisation; on `custom_project_requests` and `projects` the rows have many columns. Bounded (one row) so impact is modest.
- Severity: Low
- Estimated impact: Trims each detail-page row payload to the ~10–15 fields actually rendered.
- Fix: Replace `*` with explicit column lists (the templates make the needed set obvious).
- Risk: Low (must not miss a field used in JSON-LD / metadata)
- Touches business logic: no

### P-13 `/projects/category/[category]` and `/jobs/companies/[id]` fetch all rows, unpaginated

- File(s): `src/app/projects/category/[category]/page.tsx:14-18` (projects for a category, no limit), `src/app/jobs/companies/[id]/page.tsx:18-22` (all jobs for a company, no limit)
- Problem: Unlike `/projects` (page size 24) and `/jobs` (page size 20), these sibling routes render the entire result set.
- Why slow: A popular category or a large employer returns every matching row + full card fields in one payload and DOM.
- Severity: Medium
- Estimated impact: Caps the initial render to a page size; matches the paginated behaviour of the main list routes.
- Fix: `.range()` + reuse `Pagination`, or at least a hard `.limit(48)` with a "see all in /projects?category=…" link.
- Risk: Low
- Touches business logic: no

### P-14 Heavy client data module `demoResumes.ts` ships in the `/resume` and `/resume/templates` bundles

- File(s): `src/lib/resumeBuilder/demoResumes.ts` (416 lines, 4 full persona résumés), imported by `src/components/resumeBuilder/ResumeThumbnail.tsx:5` (`"use client"`, calls `demoRenderModel(template.id)` at runtime when no `model` prop is passed) and `src/components/resumeBuilder/TemplatePreviewModal.tsx:7`. `ResumeThumbnail` is rendered by `TemplateShowcaseCard` (server, `/resume`) and `TemplateGalleryCard` (`/resume/templates`), neither of which passes `model`.
- Problem: Because the thumbnail computes its demo model client-side, `demoResumes.ts` + its transitive imports (`renderModel.ts`, `content.ts` ~493 lines) are bundled into those routes' client JS. Build shows `/resume` 119 kB and `/resume/templates` 121 kB First Load (~33 kB over the list-page tier).
- Why slow: ~900 lines of static résumé data + builder logic parsed on the client to render deterministic thumbnails that could be produced on the server.
- Severity: Medium
- Estimated impact: Moving `demoRenderModel(template.id)` to the server (`TemplateShowcaseCard` / a server wrapper for the gallery card) and passing `model` as a prop keeps `demoResumes` out of the client graph — `/resume` and `/resume/templates` drop toward the ~90–105 kB tier.
- Fix: Compute the render model server-side in the (already server) card components and pass `model={...}` into `ResumeThumbnail`; keep only the pure render types on the client. The interactive `TemplatePreviewModal` can lazy-load its demo via `next/dynamic`.
- Risk: Low
- Touches business logic: no

### P-15 `useSessionProfile` uses `getUser()` (network) where `getSession()` (local) suffices

- File(s): `src/lib/useSessionProfile.ts:35`; similar client `getUser()` calls: `src/app/learning/[gridSlug]/[topicSlug]/LearningBookmarkButton.tsx:22` and `:47` (twice in one component), `src/app/jobs/[id]/JobApplyPanel.tsx:54`, `src/app/projects/[id]/ProjectPurchasePanel.tsx:39`, `src/app/mock-tests/[testId]/MockTestRunner.tsx:58`, `src/app/custom-projects/_builder/useDraft.ts:27`
- Problem: `auth.getUser()` in the browser performs a network round-trip to GoTrue to re-validate the token. For UI that only needs "is there a session" (show avatar, enable a button, pick a draft key), `auth.getSession()` reads the cached session synchronously from storage.
- Why slow: Each `getUser()` is an extra browser→Supabase request; `LearningBookmarkButton` fires two per mount; `useSessionProfile` fires one per instance (see P-2).
- Severity: Medium (runtime; overlaps P-2)
- Estimated impact: Replaces N per-page auth round-trips with 0 (session already in memory); real trust checks stay server-side where they already are (RLS + `submit_test_attempt` etc.).
- Fix: Use `getSession()` for presence/UI gating in client components; keep `getUser()` only where a fresh server-verified identity is genuinely required before a sensitive client action.
- Risk: Low
- Touches business logic: no (RLS still enforces real access)

### P-16 `src/components/ui/index.ts` barrel mixes client and server components

- File(s): `src/components/ui/index.ts` (re-exports 20+ modules incl. `"use client"` ones: `Modal`, `Drawer`, `FilterSheet`, `Reveal`, `ErrorState`)
- Problem: Every server component that imports one symbol from `@/components/ui` evaluates the whole barrel, which references the client modules too. Next 14 dead-code-eliminates unused exports from the RSC graph reasonably well, but barrels are a known compile-time and occasional bundle-bloat hazard and are not covered by `optimizePackageImports` by default for local paths.
- Why slow: Larger module graph to traverse per import; risk of a client component being pulled into a route that only wanted a server one.
- Severity: Low
- Estimated impact: Marginal bundle + build-time; mainly hygiene. Not separately measurable without the analyzer.
- Fix: Either add `optimizePackageImports: ['@/components/ui']` in `next.config.js`, or split the barrel into `ui/index.ts` (server-safe) + `ui/client.ts`, or import leaf paths directly in hot routes.
- Risk: Low
- Touches business logic: no

### P-17 `AnnouncementBar` fires a Supabase query from the browser on every page load

- File(s): `src/components/home/AnnouncementBar.tsx:24-46` (root layout, `src/app/layout.tsx`)
- Problem: A site-wide client island queries `announcements` (`.limit(5)`) on mount for every visitor on every route, even though announcements change rarely and there is usually none.
- Why slow: One more always-on browser→Supabase round-trip per navigation (on top of the P-2 session calls), and it is part of why the Supabase browser chunk is on every page (P-3).
- Severity: Low
- Estimated impact: One fewer client request per page; contributes to P-3's chunk-removal if the layout stops importing the browser client at all.
- Fix: Fetch the active announcement in a `cache()`d server helper with its own short `revalidate`, render it from the layout as a server component, and keep only the dismiss button as a tiny client island (no Supabase import). Note this only helps the bundle if the header islands (P-3) are also moved off the eager browser client.
- Risk: Low
- Touches business logic: no

### P-18 Full learning `tree` serialised into the client payload on every topic page

- File(s): `src/app/learning/[gridSlug]/[topicSlug]/page.tsx:58` passes `tree` to `<DocsShell>` (`"use client"`, `src/app/learning/_components/DocsShell.tsx:13`) → `<LearningNav>` (`src/app/learning/_components/LearningNav.tsx:14`)
- Problem: The entire section/topic tree (id, slug, title, `is_premium` for every topic — up to ~150 for the Java grid, 30 chapters for Python) is passed as a client prop, so it is serialised into the RSC/HTML payload of every topic page for the sidebar nav.
- Why slow: Payload grows with grid size; each topic page re-ships the whole grid's nav data.
- Severity: Low
- Estimated impact: Trimming the prop to exactly `{ id, slug, title, is_premium }` (already close) and/or rendering the nav list as a server component with only the collapsible state on the client keeps large grids' payloads flat.
- Fix: Keep `LearningNav`'s static list server-rendered; make only the mobile drawer toggle + active-link highlight client. If it must stay a client prop, map `tree` down to the minimal shape before passing.
- Risk: Low
- Touches business logic: no

### P-19 `custom-projects/my-projects/[id]` — `requireUser()` used only as a gate still fetches the full profile

- File(s): `src/app/custom-projects/my-projects/[id]/page.tsx:27` (`await requireUser();` — return value discarded)
- Problem: The page only needs "is the user signed in" (RLS scopes the rows), but `requireUser()` also runs the `profiles` SELECT.
- Why slow: One unnecessary `profiles` round-trip per view (subset of P-1).
- Severity: Low
- Estimated impact: −1 round-trip on this route (and any other that calls `requireUser()` without using the profile).
- Fix: Use a lightweight `getOptionalUser()` (id/email only) as the gate, or the `cache()`d helper from P-1 so the profile fetch is at least shared.
- Risk: Low
- Touches business logic: no

### P-20 `/account/resume/[id]/edit` runs 3 independent reads in series (4 waves incl. `requireUser`)

- File(s): `src/app/account/resume/[id]/edit/page.tsx:12-17` (`resumes_builder`), `:21-23` (`resume_templates`), `:27-32` (`resume_shares`)
- Problem: After `requireUser()`, three `await`s run sequentially. `resume_templates` is public and depends on nothing; `resume_shares` depends only on `params.id` + `user.id` (already known) — neither needs the résumé row.
- Why slow: 4 serial round-trips where 2 waves suffice (`requireUser` → `Promise.all([row, templates, shares])`).
- Severity: Low
- Estimated impact: Editor first render drops from 4 round-trip waves to 2.
- Fix: `Promise.all([rowQuery, templatesQuery, sharesQuery])`.
- Risk: Low
- Touches business logic: no

---

## Summary 1 — Top 10 fixes ranked by (impact ÷ risk)

| # | Finding | Impact | Risk | Touches logic | Why it ranks here |
|---|---|---|---|---|---|
| 1 | **P-1** `cache()` `requireUser()` + reuse in `ensureLegalConsent` | High (−2 GoTrue, −1 profiles SELECT on every `/account/*`) | Low | no | Pure per-request memo; biggest server-side win for the cheapest change |
| 2 | **P-2** Single `SessionProfileProvider` for the nav | High (−2–3 `getUser`, −2–3 profiles SELECT, −3 auth listeners per page) | Low | no | Affects literally every page load; mechanical refactor |
| 3 | **P-4** Remove server `auth.getUser()` from `/premium` | Medium (restores ISR: 3-round-trip render → cached) | Low | no | One-line-ish; also removes a route from the dynamic set |
| 4 | **P-3** Lazy-load header auth islands (`next/dynamic`) | High (Supabase chunk off first-load for ~40 static/list routes) | Medium | no | Largest bundle win; risk is hydration timing / layout shift, needs a skeleton |
| 5 | **P-7** `/resume` hub: drop duplicate `resume_templates`, narrow `resumes_builder` select, parallelise | Medium (−1 query, 4 waves → 2, much smaller payload) | Low | no | Self-contained page; clear redundancy |
| 6 | **P-15** `getSession()` instead of `getUser()` for client UI gating | Medium (−N browser→GoTrue round-trips per page) | Low | no | RLS still enforces real access; low blast radius |
| 7 | **P-6 / P-13** Add `.limit()` + pagination to unbounded account & category/company lists | Medium (payload stops scaling with data) | Low | no | Reuses existing `Pagination` helper; contained |
| 8 | **P-14** Render résumé thumbnails' demo model on the server | Medium (`demoResumes`/`content` out of `/resume*` client bundle) | Low | no | Move a function call across the server/client line |
| 9 | **P-8 / P-9 / P-20** Fix await-wave ordering (projects detail, learning grid/topic, resume editor) | Low–Medium each (one fewer round-trip wave on cold render) | Low | no | Small, safe reorderings; add up across hot routes |
| 10 | **P-10** `count: "estimated"` (or `pageSize+1` heuristic) on marketplace lists | Low–Medium (removes a filtered `COUNT(*)` per list render) | Low (Medium if exact total is required) | no | Cheap; impact depends on real table size (unmeasurable here) |

## Summary 2 — Risky / architectural (listed, not planned)

- **P-3(c) Shedding `realtime-js` from `@supabase/supabase-js`.** v2 bundles it unconditionally; there is no supported tree-shake. Options (stubbing `realtime` on the client, pinning/patching a lazy-import build, or a custom fetch-only PostgREST wrapper for public reads) are all upstream/architectural and could break auth-token refresh. Investigate only.
- **P-5 DB-side wallet balance.** Needs a SQL function/view/column and must exactly match the existing `credit`/`debit` transaction semantics. Schema change — owner territory. Touches business logic.
- **P-11 Search indexing.** `pg_trgm` / `tsvector` on `projects.title`, `jobs.title`, `jobs.location` (and possibly routing search through an RPC like `learning_search`). Migration + ranking-behaviour change.
- **Layout/session architecture.** The site deliberately keeps the root layout static and does auth client-side (`src/lib/useSessionProfile.ts:14-19`), trading a per-page client waterfall for ISR on the public catalog. P-2/P-3/P-17 improve within that model. Moving to a server-rendered session (middleware writing a signed profile cookie, or a per-request server session in the layout) would remove the client waterfall entirely but forces most pages dynamic / needs a caching strategy — a real architecture decision, not a Phase-2 fix.
- **`count: "exact"` → exact totals in the UI.** If "1,234 projects" must be exact, P-10 is a product change, not a pure perf fix.
- **`select("*")` removal (P-12).** Low risk individually but touches metadata/JSON-LD field sets — needs per-page verification, not a blind sweep.

## Summary 3 — Open questions before Phase 2

1. **Production data volume.** How many rows in `projects`, `jobs`, `wallet_transactions` (per active user), `notifications`, `custom_project_messages`? P-5, P-6, P-10, P-11, P-13 severity depends entirely on this and is **not measurable in this environment**.
2. **Is the Supabase browser client needed on the marketing site at all for signed-out visitors?** If the header can render "Sign in" purely from a cookie/server hint, P-3 can go further (drop the browser import from the layout entirely).
3. **Are schema changes in scope for Phase 2?** P-5 (balance function), P-11 (search index) need migrations. The engagement brief says "Do NOT modify Supabase schema/migrations" — confirm whether that holds for Phase 2 or whether owner-run migrations are acceptable.
4. **Must list-page totals be exact?** Decides whether P-10 is `count: "estimated"` (free) or a product conversation.
5. **Realtime — genuinely unused, or planned?** Confirm no roadmap need for Supabase realtime on the website before investing in P-3(c).
6. **Target devices / networks.** No field metrics available here (no RUM, no Lighthouse run possible). Is there analytics (LCP/INP) to prioritise against, or should Phase 2 optimise by static reasoning only?
7. **`/account` layout `ensureLegalConsent` cost.** It does a SELECT (and sometimes an RPC write) on every authenticated page load. Is per-page enforcement required, or can it run once per session (e.g. gated by a cookie)?
