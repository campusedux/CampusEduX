# CampusEduX Website — Security, Bug, Performance & Production-Readiness Audit

**Date:** 2026-09-06
**Scope:** `website/` only (Next.js 14.2.35 App Router, `@supabase/ssr`, Razorpay, Anthropic assist, external code-exec sandbox)
**Branch:** `audit/full-project-review`
**Method:** full source read of auth / Supabase clients / every API route / every Server Action / DB RPCs the site calls / CSP + headers / XSS sinks / payment flows; `tsc --noEmit`, `next lint`, `vitest run`, `next build`, `npm audit`, live header + route smoke test via `next start`.

This engagement is a follow-up to the repo-wide `AUDIT_REPORT.md` (2026-09-06), which found the project "in unusually good health" but explicitly **deferred the table-by-table security / RLS pass and a dedicated header review**. This document is that pass, plus a fresh bug + performance validation, with fixes applied.

---

## FINAL STATUS

### **SECURE WITH MINOR ISSUES** — safe to ship the applied fixes now.

The application code is genuinely well-hardened: no service-role key anywhere, every user-scoped query is re-scoped to `auth.uid()` *and* backed by RLS, payment amounts/verification are entirely server-side, the one anon read path onto resume data (`get_shared_resume`) is a narrow `SECURITY DEFINER` projection, XSS sinks are escaped, the open-redirect vector is guarded and unit-tested. **No CRITICAL or HIGH application vulnerability was found.**

The one item that keeps this from "PRODUCTION READY" is **framework currency**: `next@14.2.35` is the last 14.2.x release and carries a backlog of published advisories with no further 14.x patch. Moving to Next 15 is a real migration (async `cookies()` / `params`) that must not be done blind — it is documented below as the top remaining risk.

---

## SECURITY SUMMARY

| Severity | Found | Fixed | Remaining (documented) |
|---|---|---|---|
| CRITICAL | 0 | 0 | 0 |
| HIGH | 0 | 0 | 0 |
| MEDIUM | 3 | 2 | 1 (`next` framework currency) |
| LOW | 4 | 2 | 2 (`@supabase/ssr`/`cookie`, XFF-spoofable rate-limit key) |
| INFO | 3 | 0 | 3 |

### MEDIUM

**S1 — No `Strict-Transport-Security` header. `next.config.js` → FIXED**
*Root cause:* `headers()` set CSP / `X-Content-Type-Options` / `Referrer-Policy` / `Permissions-Policy` but never HSTS.
*Impact:* a network attacker on the victim's first hop can SSL-strip / downgrade the initial request before the redirect-to-HTTPS.
*Fix:* added `Strict-Transport-Security: max-age=63072000; includeSubDomains` to the global header block. Ignored over plain HTTP so `next start` / local dev is unaffected. `; preload` deliberately left off until the owner confirms every subdomain (api., www., …) is HTTPS-only.
*Verified:* `curl -sI` against `next start` shows the header on `/about`.

**S2 — Clickjacking backstop + CSP gaps. `next.config.js` → FIXED**
*Root cause:* CSP had `frame-ancestors 'none'` (good) but no `X-Frame-Options` for pre-CSP browsers, and no `base-uri` / `object-src` / `form-action`.
*Impact:* defence-in-depth only — an injected `<base>` could repoint relative URLs; an injected `<object>` could load a plugin; a form could be pointed off-origin.
*Fix:* added `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` to the CSP and `X-Frame-Options: DENY`. Razorpay is an iframe/redirect flow (already in `frame-src`), not a cross-origin form POST from our pages, so `form-action 'self'` is safe.
*Verified:* live header dump + all key routes (`/`, `/login`, `/compiler`, `/projects`, `/premium`, `/resume/templates`, `/contact`) still return `200`.

**S3 — `next@14.2.35` published-advisory backlog, no 14.x patch available. → DOCUMENTED, not auto-fixed**
*Root cause:* 14.2.35 is the newest 14.2.x; the advisories accumulated since then are only patched in Next 15+. `npm audit fix --force` proposes `next@16` (two majors).
*Realistic exposure for this app is lower than the raw list:* deployed on Vercel (not a custom server → the Server-Actions/rewrites SSRF classes don't apply), App Router only (no Pages Router / i18n middleware-bypass), `redirects()` are all static, image `remotePatterns` is limited to `**.supabase.co`. The residual that does apply is the DoS-via-RSC / cache-poisoning family.
*Recommended fix (dedicated PR, with QA):* upgrade to the latest `next@15`. Breaking changes this codebase touches:
- `cookies()` / `headers()` became **async** — `src/lib/supabase/authed-server.ts`, `middleware.ts`, `src/lib/actions/contact.ts`.
- `params` / `searchParams` in pages became **async Promises** — ~15 dynamic route files (`projects/[id]`, `jobs/[id]`, `learning/[gridSlug]/[topicSlug]`, `r/[token]`, `mock-tests/[testId]`, `coding-problems/[problemSlug]`, `account/resume/[id]/*`, …).
- `fetch` + route-handler `GET` are **no longer cached by default** — audit `src/lib/cache.ts` assumptions (it already uses `unstable_cache`, so low impact) and the `/api/*` routes (all already `force-dynamic`).
- `eslint-config-next@15`, `@next/eslint-plugin-next@15`.
Then: `npm run typecheck && npm run lint && npm test && npm run build`, and a **manual pass** of sign-in / sign-out, `/account` gating, a wallet top-up, a Premium subscribe, `/r/<token>`, and one ISR catalog page.

### LOW

**S4 — `postcss` declared floor `^8.4.0` permits a known-vulnerable resolve. `package.json` → FIXED**
*Root cause:* `^8.4.0` allows `8.4.x`, which is inside the vulnerable range (`<= 8.5.22`) of the PostCSS `sourceMappingURL` advisories.
*Impact:* build-time only, on the project's own (trusted) CSS — low real risk — but a fresh `npm install` could pull a vulnerable copy for Tailwind / autoprefixer / postcss-cli.
*Fix:* bumped the dev-dependency floor to `^8.5.28`; the resolved top-level `postcss` is now `8.5.28` (was `8.5.26`).
*Note:* `npm audit` still reports the same total because Next **vendors its own** `postcss@8.4.31` under `node_modules/next/node_modules/postcss`; that copy only moves with a Next upgrade (S3).

**S5 — `@supabase/ssr@0.4.1` bundles `cookie@<0.7.0`. → DOCUMENTED**
*Root cause:* transitive `cookie` dependency; advisory `GHSA-pxg6-pf52-xh8x` (out-of-bounds characters accepted in cookie name / path / domain), severity **low**.
*Impact for this app:* negligible — cookie names/attributes are chosen by `@supabase/ssr` / Supabase, not by request input.
*Recommended fix:* upgrade `@supabase/ssr` to `^0.6` (or current). It replaces the cookie adapter API `{ get, set, remove }` with `{ getAll, setAll }` in `middleware.ts`, `src/lib/supabase/authed-server.ts`, `src/lib/supabase/browser.ts`. Not applied here because it is a low-severity change on the auth-cookie path and this environment cannot verify the live cookie round-trip.

**S6 — Rate-limit keys derive from spoofable `X-Forwarded-For`. `src/lib/compiler/rateLimit.ts` callers → DOCUMENTED**
*Root cause:* `clientKey()` in the compiler / judge / resume-parse routes trusts the leftmost `X-Forwarded-For` value; the limiter is also per-instance in-memory (both facts are documented in the code).
*Impact:* an attacker rotating the header can dilute the best-effort limiter. This is defence-in-depth, not an auth control — the real backstops are the execution provider's own quota, `COMPILER_REQUIRE_AUTH`, and (on the resume routes) the per-user cap.
*Recommended fix:* on Vercel, prefer the platform-trusted client IP over parsing `X-Forwarded-For`, and/or move the counter to a shared store (Upstash / KV) if abuse is observed.

### INFO

- **I1 — `resume_ai_prompts` is read with the anon key** (`src/lib/resumeBuilder/aiAssist.ts` → `getActivePrompt`). If that table has an anon `SELECT` policy, the résumé-rewrite *system prompts* are publicly readable. Not sensitive, but tighten to `authenticated` if the owner prefers.
- **I2 — `/api/resume/assist` + `/api/resume/parse` send `Access-Control-Allow-Origin: *`.** Intentional (documented) — the mobile app calls them cross-origin with a bearer JWT that is validated via `auth.getUser(token)`; `*` cannot carry credentials so the cookie path is unaffected. Acceptable; could be narrowed to the app's known origins.
- **I3 — Prompt-injection into the AI assist request.** `instruction` / `currentText` / `jdText` are concatenated into the user message. Worst case is a low-value "suggestion" string the user reviews before accepting; output is never written server-side. Acceptable.

### What was checked and found SOLID (no change needed)

| Area | Finding |
|---|---|
| **Service-role key** | Not present in `website/` at all. `getPublicSupabase()` = anon, `persistSession:false`, read-only public catalog; `createAuthedServerSupabase()` / `createBrowserSupabase()` = real user session, RLS enforced. |
| **Account authz** | `/account/*` gated by `requireUser()` in `layout.tsx`; auth + profile read are request-memoised via React `cache()` (per-request, never cross-request). |
| **IDOR / user-to-user** | Every Server Action in `lib/actions/*` re-scopes to `.eq("user_id", user.id)` *and* relies on RLS — belt and braces. Resume export routes (`loadOwnResumeForExport`) scope by `user_id`. Job apply verifies the uploaded object path starts with `${user.id}/` and mints the signed URL server-side. |
| **Resume sharing (anon read)** | `get_shared_resume(token)` is `SECURITY DEFINER` + `set search_path = public`, checks `is_active` + `expires_at`, returns a hand-picked JSON projection (never `id` / `user_id` / `ats_score` / `is_demo`), returns `null` (not an error) for invalid/revoked so existence can't be probed. `resume_shares` / `resume_versions` themselves are owner-only RLS. |
| **XSS** | `JsonLd` escapes `< > & U+2028 U+2029` before `dangerouslySetInnerHTML` (tested, `jsonld-xss.test.ts`). `Markdown.tsx` renders only React text nodes, `safeUrl()` blocks `javascript:` / `vbscript:` / non-image `data:`. `CodeEditor` feeds `Prism.highlight()` output (HTML-escaped) of the user's own code. |
| **Open redirect** | `?next=` runs through `safeInternalPath()` — rejects absolute, `//host`, `/\host`, control chars; unit-tested. |
| **SQL / command injection** | All DB access is PostgREST filters or parametrised `rpc()` — no string-built SQL. No `eval` / `new Function` / `child_process` in `src/`. |
| **SSRF** | Compiler provider base URLs (`JUDGE0_URL` / `PAIZA_URL` / `PISTON_URL`) come from env (admin-controlled), never request input. User code executes only in the external sandbox, never in-process. |
| **File upload** | `/api/resume/parse`: 8 MB cap, extension+MIME check, in-memory only, never persisted, per-user rate limit. Job-apply upload: private `resumes` bucket, path pinned to `${user.id}/`, extension allow-list, server-minted signed URL. |
| **Payments** | Client never decides pass/fail or amount — `create-*-order` / `verify-*-payment` Edge Functions do the HMAC check and crediting; `interpretVerifyResponse()` treats anything but a clean object body as failure. |
| **Secrets** | `.env` / `.env.local` gitignored + untracked; only `.env.example` (placeholders) is committed. No `eyJ…` / `sk-…` / `rzp_live_…` / PEM in tracked source. `ANTHROPIC_API_KEY` / `REVALIDATE_SECRET` / compiler keys are read server-side only. |
| **`/api/revalidate`** | Disabled (404) when `REVALIDATE_SECRET` unset; 401 on mismatch; tag allow-list; only ever touches the cache. |

---

## BUG SUMMARY

**Found: 3 · Fixed: 3 · Remaining: 0**

**B1 — Autosave hangs forever + unhandled promise rejection on a transient network error. `useAutosaveField.ts` → FIXED**  *(MEDIUM)*
*Root cause:* `save(...).then(result => ...)` had **no `.catch()`**. A Server Action call *rejects* (not just resolves with `{ error }`) on a transport failure — offline, action-infra 5xx. That rejection escaped as an unhandled promise rejection, and because the status was only ever set inside `.then()`, the field stayed pinned on **"Saving…"** with no error shown — the user can't tell the save failed and may leave the page believing it persisted.
*Scope:* the shared autosave hook, used for all three live-saved resume-editor fields (`content`, `personalDetails`, `design` in `ResumeEditor.tsx`).
*Fix:* added `.catch(() => onStatusChange("error"))`, and hardened the resolve branch to `result && typeof result === "object" && "ok" in result` so a non-object result can't throw on the `in` operator.

**B2 — Same pattern, one more call site. `ResumeEditor.tsx` `handleTemplateChange` → FIXED**  *(LOW)*
`await updateResumeTemplateAction(...)` with no `try/catch` — a transport rejection threw out of the async handler (unhandled rejection) and left the status on "Saving…". Wrapped in `try/catch` → `setStatus("error")`.

**B3 — `NaN` reachable in the wallet top-up amount. `TopUpForm.tsx` → FIXED**  *(LOW)*
*Root cause:* `onChange={e => setAmount(Number(e.target.value))}` — clearing the number field yields `NaN`, which then flowed into `supabase.functions.invoke("create-wallet-topup-order", { body: { amount: NaN } })`.
*Fix:* coerce a non-finite parse to `0` in `onChange`; add an explicit `amount < 10 || amount > 100000` guard in `handleTopUp` that shows a friendly message and never opens Razorpay checkout. The Edge Function remains the authority.

### Bug areas checked and found correct
`error.tsx` / `not-found.tsx` boundaries present; `loading.tsx` on the slow catalog routes; `useEffect` cleanup + `active` flags in `useSessionProfile` / `PremiumSubscribeButton` (no setState-after-unmount, subscription unsubscribed); pagination is `.range()`-bounded server-side; list queries use explicit column lists + `.limit()`; `register` / `login` wrap Supabase calls in `try/catch/finally`; `interpretVerifyResponse` fail-closed on payment verification.

---

## PERFORMANCE SUMMARY

The website has already had **five dedicated, committed performance phases** (`17912ae` → `e793940`, documented in `OPTIMIZATION_NOTES.md` / `PERFORMANCE_PHASE1-5.md`): explicit `SELECT` lists, N+1 removal, `unstable_cache` + tag invalidation, `generateStaticParams` → ISR on 7 catalog routes, résumé bundle splits, `next/image` AVIF/blur, `<head>` preconnect. This audit **validated** that state and made no new perf change (and therefore claims no new improvement).

### Measured — `next build`, before vs after this audit's fixes

| Metric | Before | After | Δ |
|---|---|---|---|
| Shared First-Load JS | 87.8 kB | 87.8 kB | 0 |
| `/` First-Load JS | 171 kB | 171 kB | 0 |
| `/account/resume/[id]/edit` route chunk | 22.3 kB | 22.4 kB | +~0.1 kB (the added `try/catch` + `.catch`) |
| Static / SSG / Dynamic route mix | 57 routes, unchanged | 57 routes, unchanged | 0 |
| `tsc` / `lint` / `vitest` | 0 / 0 / 278✓ | 0 / 0 / 278✓ | 0 |
| `next build` | ✅ | ✅ | — |

### Observations (not regressions — carried from the prior perf docs, not actioned here)
- **`@supabase/supabase-js` (~64 kB gz) ships on every route** via the nav session islands (`OPTIMIZATION_NOTES.md` item **R1**). Biggest remaining lever; a scoped "de-Supabase the nav" effort, not a quick fix.
- **Substring search** (`ilike('title', '%q%')`) forces a sequential scan on `projects` / `jobs`. A `pg_trgm` GIN index is the fix — a DB migration, listed as infra item **M-series** in the perf notes; out of scope for a website-code pass.
- **CWV (LCP/INP/CLS) not measured** — no Chrome in this environment (same limitation noted in `PERFORMANCE_CURRENT_AUDIT.md`). The `lighthouserc.json` + PR-only Lighthouse CI job added in Phase 5 covers this on real PRs.

---

## DATABASE / SUPABASE SUMMARY

The website owns exactly one migration (`website/supabase/migrations/0001_contact_submissions.sql`); the rest of the schema/RLS lives in `mobile-app/supabase/migrations/` on the shared project. This audit reviewed the RPCs the site actually calls.

| Aspect | Status |
|---|---|
| **RLS** | Enforced everywhere the site reads user data — `createAuthedServerSupabase()` / `createBrowserSupabase()` run as the user's session. Public reads use the anon key against `using (true)` catalog tables only. `resumes_builder` has **no** anon policy; the only anon path to it is `get_shared_resume`. |
| **`SECURITY DEFINER` hygiene** | `get_shared_resume`, `submit_contact_message`, `record_legal_consent`, `report_shared_resume`, `email_for_mobile` — all `set search_path = public`, all `revoke all … from public` + explicit `grant execute`. Narrow projections, fail-closed. |
| **`SECURITY INVOKER` RPCs** | `restore_resume_version`, `match_resume_to_jd`, `compute_ats_breakdown`, `coding_problem_run_cases` run with caller privileges + RLS — a forged id returns 0 rows / `null`, never another user's data. |
| **Function `search_path` (advisory)** | The `SECURITY INVOKER` resume functions in migration `0062` don't pin `search_path`. Low risk (caller privileges), but Supabase's own linter flags `function_search_path_mutable`. Recommend adding `set search_path = public` to them in a future mobile-app migration — **not** editing already-applied migrations. |
| **Storage** | `resumes` bucket is private (migration 0029); writes RLS-pinned to `${uid}/`; the site mints signed URLs server-side. Catalog images are public read (expected). |
| **Query issues** | None new. Detail RPCs are bounded (`limit 10` reviews, `limit 4` related, `limit 50` company roles). `sitemap.ts` caps every list at 200–1000 rows. |
| **Index improvements** | None applied (no website-owned schema change). `pg_trgm` on `projects.title` / `jobs.title` remains the one worthwhile addition — tracked in the perf notes. |
| **Realtime** | Not used by the website. |

**No RLS policy was weakened, no table made public, no client-side check substituted for a DB policy.**

---

## DEPENDENCY SUMMARY

`npm audit`: **15 findings (1 critical, 9 high, 3 moderate, 2 low)** — unchanged in count by this audit because every remaining finding is either **dev-tooling** (not in the production bundle) or **vendored inside `next`** (moves only with S3).

| Package | Sev | Ships to prod? | Disposition |
|---|---|---|---|
| `next` | high×N | **yes** | S3 — Next 15 migration, documented, not auto-applied |
| `postcss` (top-level) | high | build-time | **FIXED** — floor bumped `^8.4.0` → `^8.5.28` (resolves `8.5.28`) |
| `postcss` (vendored in `next`) | high | build-time (trusted CSS) | moves with S3 |
| `@supabase/ssr` → `cookie` | low | yes | S5 — documented, low severity, needs cookie-API migration |
| `vitest`, `@vitest/mocker`, `vite`, `vite-node`, `esbuild` | critical/high/mod | **no — dev only** | `vitest run` headless; no `--ui`; not shipped. Fix target is a test-runner major with no valid intermediate — deferred, documented. |
| `@typescript-eslint/parser`, `@typescript-eslint/typescript-estree`, `@next/eslint-plugin-next`, `eslint-config-next`, `glob`, `minimatch` | high | **no — lint only** | Move with `eslint-config-next@15` (part of S3). |

**Updated:** `postcss` `^8.4.0` → `^8.5.28` (1 line, verified: `tsc` / `lint` / `vitest` / `next build` all green).
**Not updated (deliberate):** everything else — either a framework major that needs a QA pass, or dev-only with no production exposure. Consistent with "do not upgrade blindly."

---

## FILES CHANGED

| File | Change |
|---|---|
| `website/next.config.js` | **Security headers.** Added `Strict-Transport-Security: max-age=63072000; includeSubDomains` and `X-Frame-Options: DENY` to the global header block; added `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` to the CSP. No existing header/directive changed. |
| `website/src/app/account/resume/[id]/edit/useAutosaveField.ts` | **Bug B1.** Added `.catch(() => onStatusChange("error"))` to the autosave promise and hardened the resolve branch against a non-object result. Stops the unhandled rejection and the permanent "Saving…" state. |
| `website/src/app/account/resume/[id]/edit/ResumeEditor.tsx` | **Bug B2.** Wrapped `handleTemplateChange`'s `await updateResumeTemplateAction(...)` in `try/catch` → `setStatus("error")`. |
| `website/src/app/account/wallet/TopUpForm.tsx` | **Bug B3.** `onChange` coerces a non-finite amount to `0`; `handleTopUp` rejects `< ₹10` / `> ₹1,00,000` before opening checkout. |
| `website/package.json` | **Dep S4.** `postcss` dev-dependency floor `^8.4.0` → `^8.5.28`. |
| `website/package-lock.json` | Lockfile update for the `postcss` bump (`8.5.26` → `8.5.28`, + `nanoid` `3.3.17` → `3.3.18` transitively). |

---

## VERIFICATION

| Gate | Result |
|---|---|
| **Typecheck** (`npm run typecheck`) | ✅ 0 errors |
| **Lint** (`npm run lint`) | ✅ No ESLint warnings or errors |
| **Tests** (`npm test`) | ✅ 33 files, **278 passed**, 12 skipped (opt-in live-Supabase E2E) |
| **Build** (`next build`) | ✅ compiled + 57/57 static pages, no warnings; shared JS 87.8 kB (unchanged) |
| **Security headers** | ✅ live `curl -sI` against `next start`: HSTS, `X-Frame-Options: DENY`, hardened CSP all present; existing headers intact |
| **Route smoke test** | ✅ `/`, `/about`, `/contact`, `/login`, `/compiler`, `/projects`, `/resume/templates`, `/premium` all `200` after the CSP change |
| **Secrets scan** | ✅ no secret in tracked source; `.env*` gitignored + untracked |
| **`npm audit`** | ⚠️ 15 findings — all dev-only or vendored-in-`next`; see Dependency Summary + Remaining Risks |
| Auth / RLS / API / forms | ✅ reviewed by source (see Security Summary); not runtime-exercised against live Supabase (no credentials in this environment) |

---

## REMAINING RISKS (could not be safely auto-fixed here — owner action)

1. **`next@14.2.35` → `next@15` (MEDIUM).** Last 14.x release; advisory backlog only patched in 15+. Do it as a dedicated PR: fix async `cookies()`/`headers()` (`authed-server.ts`, `middleware.ts`, `actions/contact.ts`), async `params`/`searchParams` (~15 dynamic routes), bump `eslint-config-next@15`, re-run all four gates, then manually exercise sign-in/out, `/account` gating, a wallet top-up, a Premium subscribe, `/r/<token>`, one ISR catalog page. **Do not `npm audit fix --force`** (it jumps to `next@16`).
2. **`@supabase/ssr@0.4.1` → `^0.6` (LOW).** Clears the transitive `cookie` advisory. Migrate the cookie adapter from `{ get, set, remove }` to `{ getAll, setAll }` in `middleware.ts`, `supabase/authed-server.ts`, `supabase/browser.ts`; verify the login cookie round-trip in a browser.
3. **Dev-tooling audit noise (`vitest`/`vite`/`esbuild`/`@typescript-eslint`) (INFO).** Not shipped to production. Address opportunistically when the test-runner has a clean upgrade target; the Vitest-UI critical is not reachable (`vitest run` only, no `--ui`).
4. **Rate-limit key hardening (LOW, S6).** If compiler/judge/parse abuse is seen, switch from `X-Forwarded-For` parsing to the platform-trusted client IP and move counters to a shared KV.
5. **`pg_trgm` index on `projects.title` / `jobs.title` (perf).** DB migration; removes the sequential scan behind substring search. Tracked in `OPTIMIZATION_NOTES.md`.
6. **Optional tightening:** `resume_ai_prompts` anon `SELECT` → `authenticated` (I1); narrow the two résumé API routes' `Access-Control-Allow-Origin` from `*` to the app's known origins (I2); add `set search_path = public` to the `SECURITY INVOKER` resume RPCs in a future migration.
