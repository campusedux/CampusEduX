# CampusEduX — Production-Readiness Audit (`website/` only)

**Scope:** `website/` (Next.js 14.2.35 App Router + `@supabase/ssr` / `supabase-js`, anon key only).
**Date:** 2026-09-09
**Method:** read + verify only. No code was modified. Every finding cites `path:line` relative to `website/`.
**Out of scope (as requested):** `mobile-app/`, `admin-panel/`. The website ships **no database schema of its own** except `website/supabase/migrations/0001_contact_submissions.sql`; all RLS policies, RPCs and Edge Functions live in the `mobile-app/` and `admin-panel/` migration trees and could not be read in a website-only pass. Every finding that depends on them is listed under **Needs Manual Verification**.

---

## 1. Executive Summary

The website is, on the whole, a **carefully built, defensively coded** front end. The build is completely clean, the payment flows never trust a client-supplied price, every server action re-checks row ownership in addition to RLS, there is no service-role key anywhere in the tree, JSON-LD is escaped, the bespoke Markdown renderer uses React text nodes only, and `?next=` redirects are validated. Most of the "classic" audit findings simply are not present here.

What remains is a **short list of real issues** — one wrong money figure shown to users, one unauthenticated code-execution proxy with weak rate limiting, a missing password-reset flow, and a consistent pattern of swallowing database errors into empty states — plus a set of lower-severity hardening items and a number of things that cannot be confirmed without the Supabase migration tree.

### Counts by severity

| Severity | Count |
|---|---|
| CRITICAL | 0 |
| HIGH | 2 |
| MEDIUM | 7 |
| LOW | 8 |
| Needs Manual Verification | 11 |

### Build / static health (Phase 1) — all green

| Check | Command | Result |
|---|---|---|
| Types | `npm run typecheck` (`tsc --noEmit`) | exit 0 — no errors |
| Lint | `npm run lint` (`next lint`) | exit 0 — "No ESLint warnings or errors" |
| Production build | `npm run build` | exit 0 — 89 routes, **no warnings**, `✓ Compiled successfully` |
| Unit tests | `npm test` (`vitest run`) | 336 passed, 12 skipped, exit 0 |

No `any`-hiding-a-bug, unresolved import, missing `await`, or unhandled-promise issue was found by `tsc`/`eslint` or by manual review of the server actions and route handlers. The one `console.log` in `src/` (`src/lib/compiler/languages.ts:43`) is inside a *sample code snippet string* shown in the editor, not real logging.

### Top 5 to fix first

1. **W-01 (HIGH)** — Wallet page shows a **balance summed from only the 50 most recent transactions** (`src/app/account/wallet/page.tsx:11-18`). For any account with >50 wallet rows the figure is simply wrong, and it disagrees with the account dashboard, which sums *all* rows (`src/app/account/page.tsx:13,20`). Both are labelled "Current balance" / "Lifetime balance" with no hedging.
2. **W-02 (HIGH)** — `/api/coding-problems/judge` and `/api/practice/judge` execute untrusted code in an external sandbox **with no authentication at all** (not even the `COMPILER_REQUIRE_AUTH` gate that `/api/compiler/run` has), fan out to **up to 12 sandbox runs per request** (`MAX_JUDGE_CASES`), and are protected only by a **per-instance in-memory rate limiter** that resets on every deploy and is not shared across serverless instances (`src/lib/compiler/rateLimit.ts:10-11`).
3. **W-03 (MEDIUM)** — There is **no password-reset / "forgot password" flow anywhere on the website**. `src/app/login/page.tsx` has no link; `resetPasswordForEmail` appears nowhere; `robots.ts` disallows `/auth` but no `/auth` route exists.
4. **W-04 (MEDIUM)** — Every account page reads Supabase with `const { data } = await …` and **no `error` branch**, so a transient DB/RLS error renders as "No … yet" or **wallet balance ₹0** rather than an error state (`src/app/account/{wallet,purchases,applications,notifications,saved-jobs,saved-projects,referral}/page.tsx`, `src/app/account/page.tsx`).
5. **W-08 (MEDIUM)** — Only one error boundary exists (`src/app/error.tsx`); there is **no `global-error.tsx`**, so an exception thrown in the root layout (`src/app/layout.tsx` — Header/Footer/JsonLd/AnnouncementBar) white-screens with the unstyled Next default and no recovery UI.

---

## 2. Findings Table (ordered by severity)

| ID | Severity | Category | File:Line | One-line description |
|---|---|---|---|---|
| W-01 | HIGH | Data integrity | `src/app/account/wallet/page.tsx:11-18` | Wallet balance summed from only 50 most-recent transactions → wrong for heavy accounts; disagrees with dashboard's all-rows sum |
| W-02 | HIGH | Abuse / DoS / cost | `src/app/api/coding-problems/judge/route.ts:43-50`, `src/app/api/practice/judge/route.ts:44-51`, `src/app/api/compiler/run/route.ts:27-46` | Unauthenticated code-execution proxy, 12× fan-out per request, only an in-memory per-instance rate limiter |
| W-03 | MEDIUM | Auth / account recovery | `src/app/login/page.tsx` (whole file) | No password-reset flow anywhere on the website |
| W-04 | MEDIUM | Error handling / UX | `src/app/account/wallet/page.tsx:11`, `src/app/account/page.tsx:11-18`, `src/app/account/purchases/page.tsx:12`, `src/app/account/applications/page.tsx:24`, `src/app/account/notifications/page.tsx:10`, `src/app/account/saved-jobs/page.tsx:10`, `src/app/account/saved-projects/page.tsx:12`, `src/app/account/referral/page.tsx:11` | Supabase read errors silently rendered as empty / zero states (incl. wallet ₹0) |
| W-05 | MEDIUM | Injection surface / cache bloat | `src/lib/cache.ts:182`, `src/lib/cache.ts:217-219`, `src/app/projects/page.tsx:48`, `src/app/jobs/page.tsx` | Marketplace/jobs `q` passed to `.ilike("%q%")` and used as an `unstable_cache` key with no length cap and no `% _` stripping (the global `/search` path *is* sanitized; these list paths are not) |
| W-06 | MEDIUM | Entitlement / premium gate | `src/app/mock-tests/[testId]/MockTestRunner.tsx:67-93` | Premium mock-test gate is client-side only (0 rows from `test_questions` ⇒ "premium"); real gate depends on RLS/RPC not in this tree |
| W-07 | MEDIUM | Cost control | `src/lib/resumeBuilder/aiAssist.ts:70-73, 96` | AI-assist daily cap counts **only successful** requests; failed Anthropic calls (still billable) don't decrement the quota |
| W-08 | MEDIUM | Resilience | `src/app/error.tsx` (only), no `src/app/global-error.tsx` | No `global-error.tsx` and no per-segment boundaries; a root-layout error white-screens unstyled |
| W-09 | MEDIUM | Long-lived credential exposure | `src/lib/actions/jobs.ts:122-136`, `src/lib/resume.ts:19` | A **1-year signed URL** to the private `resumes` bucket is minted and stored in a DB row (`resumes.file_url`) — a long-lived bearer link that bypasses RLS for anyone who obtains it |
| W-10 | LOW | Stored-content trust / XSS | `src/app/learning/[gridSlug]/[topicSlug]/page.tsx:122-140` | Admin-authored `file_url` / `video_url` rendered straight into `href` with **no scheme allow-list** (the Markdown *body* is scheme-filtered; these two fields bypass `safeUrl()`) |
| W-11 | LOW | Correctness | `src/lib/learning.ts:262`, `src/lib/learning.ts` (grid brief), `mock_test_detail` callers | `.ilike("slug", rawUrlParam)` — `%` / `_` in the path segment act as SQL-LIKE wildcards, can resolve the wrong row or a spurious match |
| W-12 | LOW | Account enumeration | `src/app/login/page.tsx:52-57` | `email_for_mobile` RPC is a mobile-number oracle ("No account found with this mobile number." vs a password error) |
| W-13 | LOW | Abuse | `src/app/r/[token]/ReportShareButton.tsx:19-23` | Anonymous `report_shared_resume` call with no client-side throttle — a share token's report queue can be spammed |
| W-14 | LOW | Crash (conditional) / perf | `src/app/sitemap.ts:47-77` | `new Date(row.updated_at)` with a null/absent `updated_at` → `Invalid Date` → `RangeError` on sitemap serialization (500s `/sitemap.xml`); also 8 `.limit(1000)` queries with no `unstable_cache` |
| W-15 | LOW | Perf | `middleware.ts:31` | `supabase.auth.getUser()` — a network round-trip to Supabase Auth — runs on **every** non-static request, including fully public catalog pages |
| W-16 | LOW | Unvalidated client id (low impact) | `src/app/api/resume/assist/route.ts:97-104`, `src/lib/resumeBuilder/aiAssist.ts:51-53` | `resumeId` is accepted from the client and never ownership-checked; only written to the `resume_ai_requests` log row |
| W-17 | LOW | Functional gap | `src/app/projects/[id]/ProjectPurchasePanel.tsx:132-141` | "Free — open in your account" for a `price <= 0` project just links to `/account/purchases`; nothing grants the project (may be a real gap or handled elsewhere) |

---

## 3. Detailed Findings

### W-01 — HIGH — Wallet balance is computed from a truncated window

**Where:** `src/app/account/wallet/page.tsx:11-18`
```ts
const { data: txns } = await supabase
  .from("wallet_transactions")
  .select("id,type,category,amount,description,created_at")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false })
  .limit(50);                       // <-- window
const balance = (txns ?? []).reduce((sum, t) =>
  sum + (t.type === "credit" ? Number(t.amount) : -Number(t.amount)), 0);
```
The page then renders that number as **"Current balance"** in a large heading.

**What's wrong:** the balance is derived by summing only the 50 newest transactions. The account dashboard computes the *same* concept differently — it sums **all** rows (`src/app/account/page.tsx:13` selects `type,amount` with no `.limit()`, `:20` reduces them) and labels it "Lifetime balance". For any user with more than 50 wallet transactions the two screens show **different balances**, and the wallet screen's figure is arbitrary (it depends only on the credit/debit mix of the last 50 rows).

**Why it matters:** this is a money figure presented to the user as authoritative. A student who tops up, spends, and earns referral credit repeatedly will eventually cross 50 rows; from then on the wallet page can show a balance that is materially higher or lower than reality. That drives support load and erodes trust, and if any client code ever gates a "pay with wallet" affordance on this number the UX will be inconsistent. (Actual spend is decided server-side in an Edge Function, so this is a *display* integrity bug, not a spend bypass — hence HIGH not CRITICAL.)

**Repro:**
1. Sign in as a user with ≥ 51 rows in `wallet_transactions` (or insert test rows).
2. Open `/account/wallet` — note the "Current balance".
3. Open `/account` — note the "Wallet balance" card.
4. The two differ; the wallet-page value changes as you add older-than-position-50 rows via the DB.

**Suggested fix (described, not applied):** compute the balance from an authoritative source, not a windowed client-side reduce — e.g. a `wallet_balance` column on `profiles` maintained by the same trigger/Edge Function that writes `wallet_transactions`, or a dedicated `wallet_balance(user_id)` RPC / a `head:true` sum via PostgREST aggregate. Keep the 50-row `.limit()` for the *history list* only. Make the dashboard read the same source so the two screens agree.

---

### W-02 — HIGH — Unauthenticated code-execution proxy with fan-out and weak rate limiting

**Where:**
- `src/app/api/coding-problems/judge/route.ts:43` — `POST` handler, **no auth check**, calls `runCode()` in a loop over up to `MAX_JUDGE_CASES = 12` cases (`src/lib/codingProblems.ts:70`, loop at `:87`).
- `src/app/api/practice/judge/route.ts:44` — identical, **no auth check**.
- `src/app/api/compiler/run/route.ts:27-38` — single run; auth is **opt-in** via `COMPILER_REQUIRE_AUTH` which **defaults off** (`.env.example` ships `COMPILER_REQUIRE_AUTH=false`).
- `src/lib/compiler/rateLimit.ts:10-11` — the only rate limiter: `const buckets = new Map<string, Bucket>()` in module scope, keyed by `x-forwarded-for` / UA. Its own doc comment says: *"the counter lives in the module scope of one server instance: it resets on redeploy and is not shared across lambdas."*

**What's wrong:** an anonymous client can drive the external execution provider (Paiza guest by default, or a configured Judge0) at will. `/api/*/judge` amplifies each HTTP request into up to 12 sequential sandbox executions, each with a `RUN_TIMEOUT_MS` up to 12s. The in-memory limiter does essentially nothing on a serverless platform where each cold instance starts with an empty `Map` and requests are spread across instances; the code itself acknowledges this and points at `COMPILER_REQUIRE_AUTH=true` as the real control — which is off by default.

**Why it matters:**
- **Shared-quota DoS:** the Paiza guest tier is rate-limited with no SLA (per `.env.example`). A modest flood of `/api/practice/judge` calls exhausts the shared quota and the compiler / judge stops working **for every legitimate user**.
- **Cost:** with a paid Judge0/RapidAPI backend, this is a direct spend amplifier.
- **Function-time exhaustion:** 12 × 12s serial runs also blows past a typical serverless max duration, so the requests themselves become a resource sink even when the provider survives.

**Repro:**
1. `curl -X POST https://<site>/api/practice/judge -H 'content-type: application/json' -d '{"slug":"<any real practice slug>","language":"python","source":"print(1)"}'` — succeeds with no session.
2. Fire it concurrently in a loop; observe provider 429s / quota errors surfaced to real users at `/practice/problems/<slug>` and `/compiler`.

**Suggested fix (described):**
- Require a session on `/api/coding-problems/judge` and `/api/practice/judge` (they already build `createAuthedServerSupabase()` for the RPC — add the `getUser()` 401 the way `/api/practice/submit` does), and/or flip `COMPILER_REQUIRE_AUTH` to `true` for production.
- Move rate limiting to a durable store (Supabase table with a short TTL, or Upstash/Vercel KV) keyed by user id (authenticated) and IP (anon), enforced *before* the fan-out.
- Cap total sandbox executions per client per minute (not just requests), since one request = up to 12 runs.

---

### W-03 — MEDIUM — No password-reset flow on the website

**Where:** `src/app/login/page.tsx` (no "Forgot password?" link, no recovery path). Grep for `forgot|reset.?password|resetPasswordForEmail|recovery|updateUser` across `src/` returns nothing. `src/app/robots.ts:12` disallows `/auth` but there is no `src/app/auth/` directory.

**What's wrong:** a user who signs up on the web (or uses the web as their primary client) and forgets their password has **no way to recover their account on the website**. The only route is the mobile app.

**Why it matters:** account lockout with no self-service recovery is a standard production gap; it generates support tickets and blocks conversion. It also suggests an `/auth/callback` (or `/auth/confirm`) route was planned (`robots.ts`) and never built — see W-appendix / Needs Manual Verification for the related email-confirmation question.

**Repro:** open `/login`, look for a recovery link — there is none. Sign up, "forget" the password, and there is no web path back in.

**Suggested fix (described):** add a `/forgot-password` page that calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: <site>/auth/reset })` and a matching `/auth/reset` page that reads the recovery session and calls `supabase.auth.updateUser({ password })`. Add the "Forgot password?" link on `/login`. Add the `/auth/*` routes to the `robots.ts` disallow list (already partly anticipated).

---

### W-04 — MEDIUM — Database read errors are rendered as empty / zero states

**Where (all follow the same shape):**
- `src/app/account/wallet/page.tsx:11` — `const { data: txns } = …`; on error `txns` is `undefined` → balance `₹0`, "No transactions yet".
- `src/app/account/page.tsx:11-20` — dashboard; on error the wallet card shows `₹0`, counts show `0`.
- `src/app/account/purchases/page.tsx:12` → "No purchases yet".
- `src/app/account/applications/page.tsx:24` → "No applications yet".
- `src/app/account/notifications/page.tsx:10` → "No notifications yet".
- `src/app/account/saved-jobs/page.tsx:10`, `src/app/account/saved-projects/page.tsx:12` → "No saved … yet".
- `src/app/account/referral/page.tsx:11` → code "—", "No referrals yet".

None of these destructure or check `error`.

**What's wrong:** a transient Supabase error (network blip, RLS hiccup, pool exhaustion) is indistinguishable from "the user genuinely has nothing". The wallet case is the worst: a logged-in user momentarily sees **₹0 balance and no transactions**, which reads as "my money is gone".

**Why it matters:** false-empty states on financial and application-status screens cause real alarm and support escalations, and they hide outages (the page looks "fine, just empty"). Public catalog pages handle the `null` client path gracefully; the authenticated pages should handle the `error` path just as deliberately.

**Repro:** temporarily point `NEXT_PUBLIC_SUPABASE_URL` at an unreachable host (or block the Supabase origin) and load `/account/wallet` — it renders "₹0 / No transactions yet" with no indication anything failed.

**Suggested fix (described):** destructure `{ data, error }` on these reads; on `error`, render an `ErrorState` with a retry (the component already exists — `src/components/ui`, used by `src/app/error.tsx`) instead of the empty state. Alternatively add a segment-level `src/app/account/error.tsx` and `throw` on a read error so the boundary handles it uniformly.

---

### W-05 — MEDIUM — Marketplace/jobs search term is unsanitized before `ilike` + cache key

**Where:** `src/lib/cache.ts:182` (`if (a.q) query = query.ilike("title", `%${a.q}%`)`), `:217-219` (jobs `ilike` on `title` and `location`), reached from `src/app/projects/page.tsx:48` (`q: searchParams.q`) and the equivalent in `src/app/jobs/page.tsx`. The value is the raw `searchParams.q` — **not** passed through `sanitizeSearchTerm` (that function exists in `src/lib/searchModel.ts:74` and *is* used by `/search` and `/api/search`, but not by the list pages).

**What's wrong:**
1. **LIKE-wildcard injection:** a `q` of `%` or `_` changes match semantics (`%` matches everything). Not SQL injection — `supabase-js` parameterizes — but it lets a crafted query return the whole table or nothing.
2. **Cache-key bloat:** `getCachedProjectsPage` / `getCachedJobsPage` are `unstable_cache` wrappers whose key is the hashed argument object, which includes `q` verbatim with no length bound. An attacker looping distinct long `q` values creates unbounded distinct cache entries in the Next data cache.
3. There is no `.trim()` / max-length on `q` before it hits PostgREST.

**Why it matters:** low individual impact, but it's an untrusted string flowing into a query filter and a cache key on a high-traffic public route. The project already has the exact hardening helper — it's just not applied here.

**Repro:** `GET /projects?q=%25` returns an all-rows page; `GET /projects?q=<5KB string>` (repeated with varied content) inflates the data cache.

**Suggested fix (described):** run `searchParams.q` through `sanitizeSearchTerm` (strips `% _ , ( ) " \ *`, collapses whitespace, caps at `MAX_SEARCH_TERM`) in `ProjectsPage` / `JobsPage` before building the cache args, exactly as `/search` does.

---

### W-06 — MEDIUM — Premium mock-test gate is client-side only

**Where:** `src/app/mock-tests/[testId]/MockTestRunner.tsx:67-93`. `startTest()` selects `id,question_text,options,marks,sort_order` from `test_questions` (note: **not** `correct_index` — that part is good). If `questions.length === 0` **and** `isPremium`, it shows the "premium test" screen (`:84-86`). Submission goes to the `submit_test_attempt` RPC (`:105`).

**What's wrong:** whether a non-premium user can take a premium test hinges entirely on `test_questions` RLS returning **zero rows** for them. If that RLS does not filter premium tests by entitlement, a non-premium user gets `questions.length > 0`, the client shows the quiz, and scoring integrity then depends on `submit_test_attempt` re-checking premium server-side. The website cannot enforce any of this — it trusts the row count.

**Why it matters:** premium content bypass if either the `test_questions` RLS or the `submit_test_attempt` RPC omits the entitlement check. This is a different pattern from the Learning topic / Coding Problem premium gates, which correctly delegate the decision to a SECURITY DEFINER RPC that returns `locked: true` or the body (`src/app/learning/[gridSlug]/[topicSlug]/PremiumTopicContent.tsx:43-53`, `src/app/coding-problems/[problemSlug]/CodingProblemPremiumGate.tsx:54-63`).

**Repro:** cannot be verified from the website tree — see Needs Manual Verification #4.

**Suggested fix (described):** route the mock-test question load through a SECURITY DEFINER RPC (like `mock_test_detail` / `coding_problem_detail`) that enforces published + platform + premium and returns `locked` — don't read `test_questions` directly from the browser for gating.

---

### W-07 — MEDIUM — AI-assist daily cap only counts successful calls

**Where:** `src/lib/resumeBuilder/aiAssist.ts`. `countTodayRequests()` (`:40-49`) counts rows in `resume_ai_requests` for today; the cap check is `:70-73` (`DAILY_REQUEST_CAP = 30`). But `logRequest()` (`:96`) is called **only after** a successful `client.messages.create(...)` — every error path (`:99-106`) returns without logging.

**What's wrong:** a user whose requests error out (rate-limit from Anthropic, transient API error, empty completion) can keep calling; those calls still hit the Anthropic API and still cost money/latency, but never count against the 30/day cap. The route-level limiter (`src/app/api/resume/assist/route.ts:78`, 20 per 10 min, in-memory) is the only backstop, and it has the same per-instance weakness as W-02.

**Why it matters:** the per-user spend on a paid LLM is not actually bounded. Cost, not security.

**Suggested fix (described):** log the attempt **before** calling Anthropic (or in a `finally`), or count attempts separately from successes. Persist the rate-limit counter durably.

---

### W-08 — MEDIUM — No `global-error.tsx`; single root error boundary

**Where:** only `src/app/error.tsx` exists. No `src/app/global-error.tsx`; no per-segment `error.tsx` under `/account`, `/custom-projects`, `/resume`, etc. (`find src/app -name "error.tsx" -o -name "global-error.tsx"` → one file).

**What's wrong:**
- An error thrown **in the root layout** (`src/app/layout.tsx` renders `Header`, `AnnouncementBar`, `Footer`, `JsonLd`, `BottomNav`) is *not* caught by `src/app/error.tsx` — only `global-error.tsx` catches root-layout errors. The user gets Next's default unstyled error page.
- Errors in a deep account/custom-project page bubble all the way to the root boundary; functional, but the whole chrome is replaced rather than just the panel.

**Why it matters:** resilience. `layout.tsx` does real work (reads `NEXT_PUBLIC_SUPABASE_URL` for preconnect, renders islands); any throw there is a full white-screen with no branding and no "try again".

**Suggested fix (described):** add `src/app/global-error.tsx` (must render its own `<html><body>`), and consider a `src/app/account/error.tsx` so a failed account read degrades to a panel-level retry (pairs well with W-04).

---

### W-09 — MEDIUM — One-year signed URL to a private bucket is persisted in a DB row

**Where:** `src/lib/actions/jobs.ts:122-136` — on "apply with a new upload", the action mints `createSignedUrl(newResume.storagePath, RESUME_SIGNED_URL_TTL)` and stores the result in `resumes.file_url` (`:134`). `RESUME_SIGNED_URL_TTL = 60*60*24*365` (1 year) — `src/lib/resume.ts:19`.

**What's wrong:** the `resumes` bucket is private (RLS-protected), but the stored `file_url` is a **signed URL** — a bearer token valid for a year that bypasses RLS for anyone who has the string. It is copied into `applications.resume_id → resumes.file_url` and surfaces wherever an application's resume is displayed (recruiter view, admin). Anyone who obtains that URL (log line, referrer leak, a future over-broad `applications`/`resumes` read, a shared screenshot) can download the résumé for 12 months with no auth.

**Why it matters:** résumés contain PII (name, phone, email, address). A long-lived, auth-free link to a private object is a weak spot; the correct pattern for a private bucket is to mint a short-lived signed URL **at view time**, not to persist one.

**Suggested fix (described):** store only `storage_path` (the action already captures it — `:135`) and generate a short-TTL signed URL on demand when someone with permission views the application. If a stored URL is required for compatibility with the mobile app's schema, drop the TTL to minutes/hours and regenerate.

---

### W-10 — LOW — Admin content URLs rendered without a scheme allow-list

**Where:** `src/app/learning/[gridSlug]/[topicSlug]/page.tsx:122` and `:133` — `<a href={block.file_url} …>` / `<a href={block.video_url} …>` straight from the `learning_topic_content` RPC payload. The Markdown *body* renderer (`src/components/learning/Markdown.tsx:10-16` `safeUrl()`) blocks `javascript:` / unknown schemes, but these two dedicated fields bypass it.

**What's wrong:** a `javascript:` / `data:text/html` value in `learning_topics`/content `file_url`/`video_url` becomes a clickable link that executes in the victim's origin. Content is admin-authored, so this is a trust-boundary / defense-in-depth issue rather than an open XSS — but it's inconsistent with the care taken everywhere else (JSON-LD escaping, the Markdown URL filter, plain-text resume link rendering).

**Suggested fix (described):** run `block.file_url` / `block.video_url` through the same `safeUrl(..., "link")` helper (export it or a shared `httpUrlOnly()`), rendering nothing when it doesn't pass.

---

### W-11 — LOW — `.ilike("slug", rawParam)` treats `%` / `_` as wildcards

**Where:** `src/lib/learning.ts:262` (`getLearningGridBrief` — `.ilike("slug", slug)` where `slug` is the URL segment). Similar raw-param `ilike` usage on slug lookups elsewhere in the learning/practice read layer.

**What's wrong:** `/learning/jav_/…` or `/learning/%25/…` are interpreted as LIKE patterns. Worst case: a URL resolves to a grid the author didn't intend, or a `%`-only slug matches the first published grid. Cosmetic/SEO impact, not a data leak (RLS + `status='published'` + `show_on_website` still apply).

**Suggested fix (described):** use `.eq("slug", slug)` for exact slug lookups (slugs are lower-kebab already), or escape `%`/`_` before `ilike`.

---

### W-12 — LOW — Mobile-number account-enumeration oracle on login

**Where:** `src/app/login/page.tsx:52-57` — non-email identifiers call `supabase.rpc("email_for_mobile", { p_mobile })`; a missing account throws **"No account found with this mobile number."**, distinct from the generic "Invalid login credentials" you get for a wrong password.

**What's wrong:** an attacker can probe whether a given phone number has a CampusEduX account. Standard low-severity enumeration; the same class exists on most `signup`/`reset` flows.

**Suggested fix (described):** return a uniform "Invalid email/mobile or password" for both the lookup-miss and the sign-in failure; keep the specific reason server-side only.

---

### W-13 — LOW — Anonymous resume-share reporting has no throttle

**Where:** `src/app/r/[token]/ReportShareButton.tsx:16-24` — any visitor to `/r/<token>` can call `report_shared_resume(token, reason)` with the anon key, repeatedly, with a fixed reason string.

**What's wrong:** a share token's moderation/report state can be spammed by an unauthenticated user (e.g. to get a legitimate résumé link auto-disabled, if the RPC does that on a threshold).

**Suggested fix (described):** rate-limit `report_shared_resume` server-side (per token + per IP), dedupe repeat reports, and/or require a session to report.

---

### W-14 — LOW — Sitemap can `RangeError` on a null `updated_at`; also uncached

**Where:** `src/app/sitemap.ts:47-77`. `entries.push({ url: …, lastModified: new Date(p.updated_at) })` for projects, jobs, companies, learning rows, coding/practice problems, blog posts. `new Date(undefined)` → `Invalid Date`; Next serializes `lastModified` via `.toISOString()`, which throws `RangeError` on an invalid date → `/sitemap.xml` returns 500. Also: 8 queries (`.limit(1000)` / `.limit(500)`) run with **no `unstable_cache`** and no `export const revalidate`.

**What's wrong:** if any of those `updated_at` columns (or the RPC `updated_at` fields) can be null/absent, the whole sitemap 500s. Even absent that, the sitemap is regenerated with 8 round-trips whenever Next decides to.

**Suggested fix (described):** guard each date (`const d = new Date(x); entries.push({ url, ...(isNaN(d.getTime()) ? {} : { lastModified: d }) })`), and wrap the fetch block in `unstable_cache` with the relevant tags (like `src/lib/cache.ts` does elsewhere) or add `export const revalidate = 3600`.

---

### W-15 — LOW — `auth.getUser()` on every request in middleware

**Where:** `middleware.ts:31` (`await supabase.auth.getUser()`), matcher at `:38-40` excludes only static assets and image files — so it runs for every public catalog page too.

**What's wrong:** `getUser()` is a network call to the Supabase Auth server (it validates the JWT server-side), added to the latency of `/`, `/projects`, `/jobs`, `/learning`, `/blog`, etc., for anonymous visitors who have no session to refresh. This is already noted as "R1" in `website/OPTIMIZATION_NOTES.md`.

**Suggested fix (described):** narrow the matcher to the routes that actually need a fresh server session (`/account/:path*`, `/custom-projects/:path*`, `/resume/:path*`, the résumé API), or short-circuit when no Supabase auth cookie is present on the request.

---

### W-16 — LOW — `resumeId` accepted from client and never ownership-checked (assist)

**Where:** `src/app/api/resume/assist/route.ts:97-104` passes `parsed.data.resumeId` straight into `getAssistSuggestion`; `src/lib/resumeBuilder/aiAssist.ts:51-53, 96` only writes it to `resume_ai_requests.resume_id`.

**What's wrong:** a caller can supply any UUID as `resumeId`. Impact is limited to a mislabeled analytics/log row (the suggestion itself is generated from `currentText`/`instruction` in the body, not from the resume). Worth tightening for correctness and to prevent log poisoning.

**Suggested fix (described):** when `resumeId` is present, `select id from resumes_builder where id = $1 and user_id = $2` before logging; drop it (null) if it isn't the caller's.

---

### W-17 — LOW — Free project has no grant path from the website

**Where:** `src/app/projects/[id]/ProjectPurchasePanel.tsx:132-141` — when `price <= 0`, the panel shows "Free — open in your account" as a link to `/account/purchases`. No `purchases` insert, no Edge Function call.

**What's wrong:** unless a free project is granted elsewhere (mobile app, a DB default, an admin process), a web user clicking "Free — open in your account" lands on an empty purchases list. Either a genuine functional gap or logic that lives outside this tree.

**Suggested fix (described):** if free projects are meant to be self-serve on web, add a server action that inserts a `purchases` row (`status:'success', total_amount:0`) after an ownership/existence check; otherwise change the copy to point at the app.

---

## 4. Feature Status (Phase 2)

| Feature | Status | Notes / where the data comes from |
|---|---|---|
| **Signup** | WORKING | `src/app/register/page.tsx` → `supabase.auth.signUp` (client) → `handle_new_user` trigger creates `profiles`. Consent recorded via `record_legal_consent` RPC (best-effort). Password min-6 is client-only but Supabase enforces its own policy. Referral code passed in `raw_user_meta_data`. |
| **Login (email + mobile)** | WORKING | `src/app/login/page.tsx` → `email_for_mobile` RPC for mobile → `signInWithPassword`. `?next=` validated by `safeInternalPath` (`src/lib/nav.ts`). Loading/error handled; no duplicate-submit guard beyond `disabled`. |
| **Logout** | WORKING | `src/app/logout/page.tsx` → `signOut().finally(...)` always redirects; cross-tab via `emitSessionChange`. |
| **Password reset** | BROKEN (absent) | No route, no link, no `resetPasswordForEmail`. See **W-03**. |
| **Email confirmation** | CANNOT VERIFY | No `/auth/callback` route; `/register` tells the user to confirm then sign in manually. Needs Manual Verification #3. |
| **Session in nav / islands** | WORKING | `src/lib/useSessionProfile.ts` → `GET /api/session` (`Cache-Control: private, no-store`), shared in-flight request, cross-tab + focus re-check. |
| **Marketplace list** | WORKING | `src/app/projects/page.tsx` → `getCachedProjectsPage` (`src/lib/cache.ts:171`). Pagination via `.range()`, `count:"exact"`, `totalPages()`. Empty state handled. `q` unsanitized — **W-05**. |
| **Project detail + reviews + related** | WORKING | `src/lib/cache.ts:251` — `.single()` on the project (returns `{project:null}` path handled at `:263`; caller 404s). Reviews `.limit(10)`, related `.limit(4)`. Gallery dedupes. |
| **Project purchase** | WORKING (server-authoritative) | `src/app/projects/[id]/ProjectPurchasePanel.tsx` → `create-razorpay-order` / `verify-razorpay-payment` Edge Functions; client never sends a price; `interpretVerifyResponse` (`src/lib/payments.ts`) refuses success on any non-`{}` body. Owned-check via `purchases` read. Free path — **W-17**. |
| **Jobs list** | WORKING | `src/app/jobs/page.tsx` → `getCachedJobsPage`. Loading skeletons present (`src/app/jobs/loading.tsx`). Same `q` note as W-05. |
| **Job detail** | WORKING | `src/lib/cache.ts:307` — `.single()`; `data ?? null` → caller `notFound()`. `job.requirements?.length` / `job.skills?.length` optional-chained. |
| **Save job** | WORKING | `src/lib/actions/jobs.ts:35` — session id from cookie, `jobExists()` check, `23505` treated as success (race-safe). RLS + explicit `.eq("user_id")`. |
| **Apply to job** | WORKING (with W-09) | `src/lib/actions/jobs.ts:93` — server-side: exactly-one-resume `refine`, storage path must start with `${user.id}/`, extension allow-list, server-minted signed URL, `23505`/`23503` mapped to friendly errors. Long-lived signed URL — **W-09**. |
| **Placement / Learning grids + topics** | WORKING | `src/lib/learning.ts` — all reads via SECURITY DEFINER RPCs pinned to `platform='website'`. `notFound()` on null. ISR (`revalidate=300`). Premium topics: server renders `locked`, `PremiumTopicContent` island re-checks via RPC (server-authoritative). |
| **Coding problems (topic + practice)** | WORKING | `getCodingProblem` / `getPracticeProblem` RPCs withhold body/tests for locked premium. Judge route redacts hidden cases (`src/lib/codingProblems.ts:45-66`). Auth gap on judge — **W-02**. |
| **Online compiler** | WORKING (with W-02) | `src/app/api/compiler/run` → Zod schema, size caps (`src/lib/compiler/limits.ts`), `AbortController` wall-clock, provider abstraction, never executes in-process. Auth opt-in / rate limit weak — **W-02**. |
| **Mock tests** | PARTIALLY WORKING | `src/app/mock-tests/[testId]` — client fetches questions **without** `correct_index` (good); scoring via `submit_test_attempt` RPC; `submittedRef` guards double-submit; timer auto-submits at 0. Premium gate client-side only — **W-06**. Result page reads `correct_index` post-submission (relies on RLS). |
| **Resume builder (editor, ATS, JD-match, versions, share)** | WORKING | `src/lib/actions/resumeBuilder.ts` — every action: Zod-validated, `getOptionalUser()`, update re-scoped to `.eq("user_id")` + `.select("id").maybeSingle()` so a forged id errors clearly. Import always creates a new résumé. Share tokens owner-RLS; public read via `get_shared_resume` RPC only. Renderer (`ResumeDocumentView`) renders URLs as **plain text**, not `href` — no `javascript:` vector. |
| **Resume PDF/DOCX export** | WORKING | `src/app/api/resume/export/{pdf,docx}` → `loadOwnResumeForExport` (`src/lib/resumeBuilder/loadForExport.ts`) scopes to `.eq("user_id")`; UUID-validated `resumeId`; logs download + snapshots version (both best-effort). |
| **Resume upload/parse** | WORKING | `src/app/api/resume/parse` — 8 MB cap, PDF/DOCX detect, in-memory only, never persisted; cookie session OR bearer JWT; per-user+IP rate limit (in-memory). |
| **Resume AI assist** | WORKING (with W-07, W-16) | `src/app/api/resume/assist` — cookie OR bearer JWT, Zod body, section enum, per-user rate limit, `DAILY_REQUEST_CAP=30`. Key server-only. CORS `*` (documented, needed for mobile WebView; endpoint requires a valid token so `*` is acceptable). |
| **Custom project builder + checkout** | WORKING (server-authoritative) | Draft in `custom_project_drafts` (owner RLS); estimate recomputed server-side (`src/lib/customProjects.server.ts`); payment via `create-custom-project-order` / `verify-custom-project-payment`; draft cleared client-side post-verify. |
| **Custom project messages** | WORKING | `src/lib/actions/customProjects.ts` — Zod length caps, ownership re-check on `custom_project_requests`, `sender_role:'student'` forced. |
| **Premium / subscription** | WORKING (server-authoritative) | `/premium` ISR; `PremiumSubscribeButton` resolves auth client-side; `create-premium-order` / `verify-premium-payment`; `interpretVerifyResponse` guard. Entitlement (`profiles.is_premium`) — see Needs Manual Verification #1. |
| **Referral system** | CANNOT VERIFY (website side WORKING) | `/referral` shows `reward_settings`; `/account/referral` shows the user's `referral_codes` + `referrals`. The website only *reads*; award/anti-self-referral/anti-replay logic is entirely in `handle_new_user` / DB triggers (out of tree) — Needs Manual Verification #7. |
| **Profile** | WORKING (with a caveat) | `src/app/account/profile/ProfileForm.tsx` — **client-side** `supabase.from("profiles").update(...).eq("id", initial.id)`. No server-side validation of names/URLs (length, scheme). Safe only if `profiles` UPDATE RLS/column grants forbid `is_premium` / `role` / balance columns — Needs Manual Verification #1. |
| **Notifications** | WORKING | `/account/notifications` `.limit(50)`, empty state; `NotificationRow` marks read client-side. Error path unhandled — **W-04**. |
| **Account dashboard / purchases / saved / applications** | WORKING | All `.limit(50/100)`-bounded, empty states present. Error path unhandled — **W-04**. |
| **Global search** | WORKING | `src/lib/search.ts` — `sanitizeSearchTerm` strips filter-structure + wildcard chars before `.or(ilike...)`; `unstable_cache`; per-type hrefs; `/api/search` typeahead abortable + debounced. |
| **Blog** | WORKING | `src/lib/blog.ts` + `src/lib/blogText.ts`; Markdown renderer is text-node-only; `articleJsonLd` via escaped `JsonLd`. |
| **Contact form** | WORKING | `src/lib/actions/contact.ts` — Zod, then `submit_contact_message` RPC which rate-limits (4/hr/client key) and is the only writer of `contact_submissions` (`website/supabase/migrations/0001`). |
| **Delete account** | PARTIALLY WORKING (by design) | `/delete-account` is a legal doc that routes the user to the mobile app or a privacy email. No web deletion flow. Consistent with the documented compliance decision; flag only if web-based deletion is a Play/GDPR requirement for you. |
| **Legal / consent** | WORKING | `src/lib/legalConsent.ts` — `ensureLegalConsent` best-effort on every authed page; `record_legal_consent` SECURITY DEFINER RPC pins `user_id`. |

---

## 5. Phase 3 — Crash Hunt (results)

**No unconditional crash was found.** The codebase is unusually disciplined about this:

- Every public read goes through `getPublicSupabase()` which returns `null` when unconfigured; every caller checks (`if (!supabase)` / `if (supabase)`).
- `.map()` calls are guarded (`(data ?? [])`, `arr?.length > 0 && (...)`, optional chaining on nested props).
- `.single()` is used in `src/lib/cache.ts:262,315,344` and the resume/jobs actions — `.single()` **throws** on 0 rows, but: in `cache.ts` the wrappers are inside `unstable_cache` and the `null`/`{project:null}` result is normalized right after (`:263`), and the detail pages `notFound()` on a falsy result; in the resume/jobs actions the insert `.single()` calls are on rows just created in the same statement. Low risk, but `.maybeSingle()` would be strictly safer for `getCachedJobDetail` (`:315`) and `getCachedCompanyDetail` (`:344`) — **noted, not a confirmed crash**.
- Client components consistently use `let active = true; return () => { active = false }` around async effects; `useEffect` dependency arrays are correct (checked `useResizableSplit`, `useSessionProfile`, `MockTestRunner`, `GlobalSearch`, the premium islands). No conditional hooks. `MockTestRunner` guards double-submit with `submittedRef`.
- **Hydration:** `src/components/JobCard.tsx:23` uses `Date.now()` at render, but `JobCard` is a **server component** rendered inside ISR pages (no client re-render of that subtree), so there is no server/client mismatch — only up-to-`revalidate` staleness of the "New" badge. `blogText.formatBlogDate` pins locale + `timeZone:"UTC"` specifically to avoid mismatch. No `Math.random` in render.
- **Server components touching `window`/`localStorage`:** `src/lib/compiler/codingLayout.ts` / `standaloneLayout.ts` reference `window.localStorage` inside `try/catch` that returns a default on `ReferenceError`; `src/lib/razorpay.ts` guards `typeof window === "undefined"`. All are invoked from `"use client"` code in practice.
- Error boundaries: `src/app/error.tsx` exists and does **not** leak `error.message` to the UI. Gaps: no `global-error.tsx`, no per-segment boundaries (**W-08**). `not-found.tsx` exists.

**Conditional / non-crash issues surfaced by the hunt:** W-04 (errors → empty states), W-14 (`Invalid Date` → sitemap `RangeError` *if* an `updated_at` is null), W-11 (`ilike` slug wildcards).

---

## 6. Phase 4 — Security Audit (results)

### Handled well (verified in the website tree)

- **No service-role key.** `grep -rn "SERVICE_ROLE|service_role|serviceRole" src` → nothing. Three clients only: `getPublicSupabase()` (anon, no session), `createBrowserSupabase()` (cookie session), `createAuthedServerSupabase()` (cookie session). `src/lib/supabase/server.ts` documents the rule explicitly.
- **`NEXT_PUBLIC_` vars** are all safe to expose: Supabase URL + anon key, site URL, support email, legal-entity strings, social links, Play Store URL, WhatsApp number, `NEXT_PUBLIC_WHATSAPP_SUPPORT` toggle. Secrets (`REVALIDATE_SECRET`, `ANTHROPIC_API_KEY`, `JUDGE0_KEY`, `PAIZA_API_KEY`, …) are non-`NEXT_PUBLIC_` and only read in route handlers / server libs.
- **Payment integrity.** Wallet top-up, Premium, project purchase, custom-project token all delegate order creation + HMAC verification to existing Edge Functions; the client never computes or sends an amount; `interpretVerifyResponse` (`src/lib/payments.ts:22-32`) treats anything that isn't a plain object with no `error` field as failure. Verified in `TopUpForm.tsx`, `PremiumSubscribeButton.tsx`, `ProjectPurchasePanel.tsx`, `CustomProjectCheckout.tsx`.
- **Authorization on protected pages** is per-page, not middleware-only: `src/app/account/layout.tsx:10` calls `requireUser()` (`src/lib/auth.ts:96` → `redirect("/login")`), and each account page calls `requireUser()` again. Middleware only refreshes the session.
- **IDOR resistance in server actions.** `src/lib/actions/resumeBuilder.ts` — every update re-scopes to `.eq("user_id", user.id)` *and* reads back `.select("id").maybeSingle()`; `src/lib/actions/jobs.ts` and `src/lib/actions/customProjects.ts` re-check ownership before writing; `src/lib/resumeBuilder/loadForExport.ts:13-18` scopes the export read to `.eq("user_id")`. `resumeId` etc. are UUID-validated with Zod.
- **Premium entitlement decisions are server-side** for Learning topics and Coding Problems: the client island calls a SECURITY DEFINER RPC that returns `locked: true` or the content; the client only renders what it's given (`PremiumTopicContent.tsx`, `CodingProblemPremiumGate.tsx`). Judge routes call `*_run_cases` RPCs described as premium-gated. (Mock tests are the exception — **W-06**.)
- **Injection.** Only 4 `dangerouslySetInnerHTML`: `JsonLd.tsx` (serialized + `<>&` escaped — `src/components/JsonLd.tsx:12-18`, covered by `tests/lib/jsonld-xss.test.ts`), `CodeEditor.tsx:162` (Prism-highlighted *own* code, self-only), and two doc comments that say they *don't* use it. The Learning/blog Markdown renderer is React-text-node-only with a URL scheme allow-list. `runGlobalSearch` sanitizes the term before `.or(ilike)`. No raw SQL. No `eval`/`new Function`.
- **Open redirect:** `safeInternalPath` (`src/lib/nav.ts`) rejects absolute, `//host`, `/\host`, and control-char values → `/account`. Used by `/login`.
- **Security headers** (`next.config.js`): CSP with `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`; HSTS `max-age=63072000; includeSubDomains`; `X-Frame-Options: DENY`; `X-Content-Type-Options: nosniff`; `Referrer-Policy: strict-origin-when-cross-origin`; `Permissions-Policy` locks camera/mic/geo. `script-src` allows `'unsafe-inline'` (needed for Next's inline bootstrap + JSON-LD) and Razorpay; `'unsafe-eval'` is dev-only. Reasonable.
- **Cookies:** managed by `@supabase/ssr` (`HttpOnly`, `SameSite=Lax`, `Secure` in prod by default). `/api/session` sets `Cache-Control: private, no-store`; `/api/announcements` is the cacheable anon counterpart. No sensitive data hand-rolled into cookies.
- **Response hygiene:** `/api/session` returns only the caller's own `id/email/fullName/avatarUrl/isPremium`. No password hashes, no admin flags, no internal ids beyond the user's own leak in any response reviewed.

### Weaknesses (findings above)

- **W-02** — unauthenticated code-execution proxy + ineffective rate limiting (also affects `/api/resume/parse`, `/api/resume/assist`, contact — though contact has a DB-side 4/hr limit).
- **W-09** — 1-year signed URL to a private bucket persisted in a row.
- **W-05** — unsanitized `q` into `ilike` + cache key on the list pages.
- **W-10** — admin content URLs without a scheme allow-list.
- **W-12** — mobile-number enumeration on login.
- **W-13** — anonymous report spam on `/r/[token]`.
- **W-16** — unvalidated `resumeId` in `/api/resume/assist` (log-poisoning only).
- **`/api/resume/assist` and `/api/resume/parse` use `Access-Control-Allow-Origin: *`.** Documented (mobile WebView needs it) and both require a valid Supabase token, so no credentialed cross-origin risk — noted, not a finding.
- **`/api/revalidate`** — secret-gated (`x-revalidate-secret`), 404 when unset, tag allow-list, never returns data. No rate limit, but the secret is the control. OK.

### RLS — cannot be audited in a website-only pass

The website defines no policies. Whether **every** table has RLS enabled, whether any policy is effectively `true` for writes, and whether user A can read/write user B's rows all live in `mobile-app/`/`admin-panel/` migrations. The website's safety **depends on** those being correct — see Needs Manual Verification.

---

## 7. Phase 5 — Data Integrity & Performance (results)

- **Windowed aggregate:** W-01 (wallet balance from 50 rows).
- **Unbounded reads:** `src/app/account/page.tsx:13` (all `wallet_transactions` for the user — required for a correct balance, but no cap), `src/app/account/referral/page.tsx:14` (all `referrals` for the user, no `.limit()`), `src/app/account/profile/page.tsx:10-12` (all `courses`/`branches`/`academic_years` — catalog tables, bounded in practice), `src/app/sitemap.ts` (`.limit(1000)` ×3, `.limit(500)`, `.limit(200)` + RPCs, uncached — W-14). Everything else is `.limit()`/`.range()`-bounded.
- **N+1:** none found. List pages use one query with `count:"exact"`; detail pages batch with `Promise.all`; `getTopicDiscovery` is one `Promise.all` of 4 bounded reads behind `unstable_cache`. `getCachedProjectDetail` does one extra conditional related-projects query — bounded, fine.
- **`select('*')`:** only `src/lib/cache.ts:313` (`getCachedJobDetail` — `select("*, company:companies(...)")`). Every other read lists explicit columns (per the P1 performance work). Minor — the `jobs` row can be wide; an explicit column list would be tighter.
- **Race conditions / transactions:** money mutations are RPC/Edge-Function transactions server-side. `toggleSaveJobAction` handles the `23505` race. `applyToJobAction` relies on `unique(user_id, job_id)`. `submit_test_attempt` / `practice/submit` are single RPC / single insert. `MockTestRunner` and the payment handlers guard double-submit (`submittedRef`, `status==="processing"` disabled). `updateResumeContentAction` is a debounced full-document overwrite — last-write-wins across two tabs, acceptable for a single-user editor.
- **Bundle:** clean build, First-Load JS ≈ 88 kB shared; heaviest routes ≈ 177–181 kB (coding-problem workspace, learning topic) — reasonable. `@supabase/supabase-js` kept out of the base bundle via `/api/session` (documented). `optimizePackageImports: ["@/components/ui"]`, `serverComponentsExternalPackages` for `pdf-parse`/`pdfjs-dist`.
- **Images:** `next/config` sets `formats: ["image/avif","image/webp"]`, `minimumCacheTTL: 86400`, trimmed `deviceSizes`, `remotePatterns` limited to `**.supabase.co`. Blur placeholder via `src/lib/image.ts`.
- **`middleware.ts`** adds an auth round-trip to every request — W-15.
- Existing perf docs (`website/OPTIMIZATION_NOTES.md`, `PERFORMANCE_*`) already track the remaining levers (R1 de-Supabase the nav, etc.).

---

## 8. Needs Manual Verification

These cannot be settled from `website/` alone. Each is load-bearing for a website feature's security or correctness.

1. **`profiles` UPDATE RLS / column grants.** `src/app/account/profile/ProfileForm.tsx:44-55` does a **client-side** `update` on `profiles`. Confirm the UPDATE policy is `auth.uid() = id` **and** that a user cannot set `is_premium`, `role`/admin flags, `referral_code`, or any balance column via that same statement (memory notes "SEC-001 is_premium self-escalation" was fixed by migrations 0037/0038 — verify it is live on the production project and covers every privileged column).
2. **RLS enabled on every table** the website touches (≈55 tables — full list below), and no write policy is effectively `true`. Especially: `resumes_builder`, `resume_shares`, `resume_versions`, `resume_downloads`, `coding_submissions`, `user_dsa_progress`, `wallet_transactions`, `purchases`, `applications`, `saved_jobs`, `wishlists`, `custom_project_*`, `legal_consents`, `notifications`, `test_attempts`, `test_attempt_answers`.
3. **Email-confirmation redirect.** With no `/auth/callback` route, verify what a Supabase confirmation link does on the web (lands where? shows an error? does the `@supabase/ssr` cookie session get set, or must the user sign in again as `/register` implies?).
4. **`test_questions` RLS + `submit_test_attempt`.** (a) Can a signed-in non-premium user `select` rows for a **premium** test's questions (which would defeat the client-side gate in `MockTestRunner.tsx` — W-06)? (b) Can any authenticated user `select correct_index` for a test they have **not** submitted (answer-key leak)? (c) Does `submit_test_attempt` re-check premium + recompute the score server-side and ignore client `selected_index` beyond recording it?
5. **Judge RPCs are actually premium-gated.** `coding_problem_run_cases`, `practice_problem_run_cases` — confirm they return `null`/empty for a premium problem the caller can't open and never include hidden `test_cases` for a non-entitled caller (the route trusts this — `src/app/api/coding-problems/judge/route.ts:70`).
6. **`get_shared_resume` / `report_shared_resume` scope.** `get_shared_resume(token)` (anon, `src/app/r/[token]/page.tsx:30`) must return only résumés whose share row is `is_active = true`, and nothing else. `report_shared_resume` must validate the token and rate-limit server-side (W-13).
7. **Referral anti-abuse.** Award logic lives in `handle_new_user` / triggers. Verify: a user cannot self-refer (own code at signup), a code can't be replayed to farm rewards, `reward_settings.max_payout` is enforced server-side, and `referral_codes.total_earned` / wallet credit are written only by trusted server code.
8. **`email_for_mobile` exposure.** Confirm it returns only an email string for an exact mobile match and nothing more, and consider whether the enumeration (W-12) is acceptable.
9. **Storage bucket `resumes`.** Confirm it is **private**, the RLS policy is `name like auth.uid() || '/%'` (first path segment = user id, matching `resumeStoragePath` — `src/lib/resume.ts:37`), there is a file-type/size restriction at the bucket level (the app checks, but the bucket should too), and that path traversal (`../`) in an object key can't escape the user's prefix.
10. **`resume_ai_prompts` readability.** `src/lib/resumeBuilder/aiAssist.ts:27-37` reads system prompts with the **anon** client. Confirm that's intended and the table exposes nothing sensitive.
11. **Payment reconciliation UX.** If `verify-*-payment` succeeds server-side but the browser `handler` callback then errors (network drop after charge), the user sees an error and no "payment received, being processed" state. Confirm the Edge Function / a webhook credits the wallet / grants the purchase independently of the client callback, and consider a reconciliation banner on `/account/wallet` and `/account/purchases`.

**Full table list referenced from `website/src` (for the RLS review):**
`academic_years, announcements, applications, banners, blog_categories, blog_posts, branches, categories, coding_submissions, companies, courses, custom_project_deliveries, custom_project_delivery_assets, custom_project_drafts, custom_project_features, custom_project_messages, custom_project_platform_pricing, custom_project_pricing, custom_project_request_features, custom_project_request_files, custom_project_request_history, custom_project_requests, dsa_problems, faqs, jobs, learning_bookmarks, learning_grids, legal_consents, notifications, premium_features, premium_plans, profiles, projects, purchases, referral_codes, referrals, resume_ai_prompts, resume_ai_requests, resume_downloads, resume_shares, resume_templates, resume_versions, resumes, resumes_builder, reviews, reward_settings, saved_jobs, test_attempt_answers, test_attempts, test_questions, testimonials, user_dsa_progress, wallet_transactions, wishlists`

**RPCs referenced:** `coding_problem_detail, coding_problem_run_cases, coding_problems_sitemap, compute_ats_breakdown, email_for_mobile, get_shared_resume, learning_grids_list, learning_search, learning_sitemap, learning_topic_by_source_note, learning_topic_content, learning_topic_practice, learning_tree, match_resume_to_jd, mock_test_detail, practice_categories, practice_problem_detail, practice_problem_run_cases, practice_problems_list, practice_problems_sitemap, record_legal_consent, report_shared_resume, restore_resume_version, submit_contact_message, submit_test_attempt`

**Edge Functions referenced:** `create-custom-project-order, create-premium-order, create-razorpay-order, create-wallet-topup-order, verify-custom-project-payment, verify-premium-payment, verify-razorpay-payment, verify-wallet-topup-payment`

---

## 9. Phase 0 — Inventory (reference)

### Page routes (77)

`/`, `/about`, `/account`, `/account/applications`, `/account/notifications`, `/account/profile`, `/account/purchases`, `/account/referral`, `/account/resume`, `/account/resume/[id]/ats`, `/account/resume/[id]/edit`, `/account/resume/[id]/jd-match`, `/account/resume/[id]/preview`, `/account/resume/[id]/projects`, `/account/resume/[id]/versions`, `/account/resume/import`, `/account/saved-jobs`, `/account/saved-projects`, `/account/wallet`, `/blog`, `/blog/[slug]`, `/coding-problems/[problemSlug]`, `/community-guidelines`, `/compiler`, `/contact`, `/cookie-policy`, `/custom-projects`, `/custom-projects/checkout`, `/custom-projects/estimate`, `/custom-projects/features`, `/custom-projects/my-projects`, `/custom-projects/my-projects/[id]`, `/custom-projects/start`, `/data-and-permissions`, `/delete-account`, `/disclaimer`, `/faq`, `/grievance`, `/jobs`, `/jobs/[id]`, `/jobs/companies`, `/jobs/companies/[id]`, `/learning`, `/learning/[gridSlug]`, `/learning/[gridSlug]/[topicSlug]`, `/legal`, `/login`, `/logout`, `/mock-tests/[testId]`, `/mock-tests/[testId]/result/[attemptId]`, `/placement`, `/placement/notes`, `/placement/notes/[id]`, `/practice`, `/practice/compiler`, `/practice/problems`, `/practice/problems/[slug]`, `/practice/submissions`, `/premium`, `/privacy-policy`, `/project-license`, `/projects`, `/projects/[id]`, `/projects/best-sellers`, `/projects/category/[category]`, `/projects/new`, `/projects/premium`, `/projects/trending`, `/r/[token]`, `/referral`, `/refund-policy`, `/register`, `/resume`, `/resume/templates`, `/search`, `/support`, `/terms`
Plus generated: `/sitemap.xml`, `/robots.txt`.
Redirects (`next.config.js`): `/placement*`, `/placement-prep`, `/placement-preparation` → `/learning` (308), excluding `/placement/notes*`.

### API route handlers (12)

| Route | Methods | Auth | Notes |
|---|---|---|---|
| `/api/announcements` | GET | none (public) | `unstable_cache` + CDN headers |
| `/api/coding-problems/judge` | POST, GET(405) | **none** | up to 12 sandbox runs — W-02 |
| `/api/compiler/run` | POST, GET(405) | `COMPILER_REQUIRE_AUTH` (default off) | W-02 |
| `/api/practice/judge` | POST, GET(405) | **none** | up to 12 sandbox runs — W-02 |
| `/api/practice/submit` | POST, GET(405) | `getUser()` 401 | inserts `coding_submissions` + upserts `user_dsa_progress` |
| `/api/resume/assist` | POST, OPTIONS | cookie **or** bearer JWT | CORS `*`; rate-limited; W-07, W-16 |
| `/api/resume/export/docx` | GET | via `loadOwnResumeForExport` | UUID `resumeId`, owner-scoped |
| `/api/resume/export/pdf` | GET | via `loadOwnResumeForExport` | owner-scoped |
| `/api/resume/parse` | POST, OPTIONS | cookie **or** bearer JWT | 8 MB cap, in-memory only, CORS `*` |
| `/api/revalidate` | POST | `x-revalidate-secret` (404 if unset) | tag allow-list, no data returned |
| `/api/search` | GET | none (public) | term sanitized, CDN-cacheable |
| `/api/session` | GET | cookie session | `private, no-store`; own profile only |

### Server-action modules (5)

`src/lib/actions/contact.ts`, `src/lib/actions/jobs.ts`, `src/lib/actions/customProjects.ts`, `src/lib/actions/resumeBuilder.ts`, `src/lib/resumeBuilder/formatting.ts` (all `"use server"`).

### Supabase client setup

- `src/lib/supabase/server.ts` — `getPublicSupabase()`: anon key, `persistSession:false`, returns `null` if env missing. Public catalog only.
- `src/lib/supabase/browser.ts` — `createBrowserSupabase()`: `@supabase/ssr` `createBrowserClient`, module-singleton, cookie session.
- `src/lib/supabase/authed-server.ts` — `createAuthedServerSupabase()`: `@supabase/ssr` `createServerClient` bound to `next/headers` cookies; cookie writes wrapped in `try/catch` (middleware refreshes).
- `middleware.ts` — `createServerClient` + `getUser()` on every non-static request; matcher excludes `_next/static`, `_next/image`, `favicon.ico`, image extensions.

### Config

- `package.json` — Next 14.2.35, React 18.3.1, `@supabase/ssr ^0.4.0`, `@supabase/supabase-js ^2.57.0`, `@anthropic-ai/sdk ^0.124.0`, `@react-pdf/renderer`, `docx`, `mammoth`, `pdf-parse`, `prismjs`, `qrcode.react`, `zod`. Scripts: `dev/build/start/lint/typecheck/test/legal:sync`.
- `tsconfig.json` — `strict: true`, `noEmit`, `moduleResolution: bundler`, path alias `@/* → ./src/*`.
- `next.config.js` — CSP + security headers (see §6), image optimization, `redirects()`, `serverComponentsExternalPackages`, `optimizePackageImports`, opt-in bundle analyzer.
- `.eslintrc.json` — `next/core-web-vitals`.
- `.env.example` keys — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_LEGAL_ENTITY_NAME`, `NEXT_PUBLIC_BUSINESS_ADDRESS`, `NEXT_PUBLIC_GOVERNING_JURISDICTION`, `NEXT_PUBLIC_PLAY_STORE_URL`, `NEXT_PUBLIC_SOCIAL_*`, `NEXT_PUBLIC_WHATSAPP_SUPPORT*`, `REVALIDATE_SECRET`, `ANTHROPIC_API_KEY`, `COMPILER_PROVIDER`, `PAIZA_URL`, `PAIZA_API_KEY`, `JUDGE0_URL`, `JUDGE0_KEY`, `JUDGE0_AUTH_TOKEN`, `PISTON_URL`, `COMPILER_REQUIRE_AUTH`, `COMPILER_MAX_*` / `COMPILER_RATE_LIMIT_*` (optional).

---

*End of report. No code has been changed. Awaiting instructions on which findings to fix.*
