# CampusEduX Website — Performance Phase 5: Verify & Protect

**Date:** 2026-09-06 · **Branch:** `audit/full-project-review`
**Scope:** items 27–30. No source changes to app behaviour — this phase re-measures,
verifies, and adds CI protection.

> The consolidated **before/after table for every route and metric** is in
> **`OPTIMIZATION_NOTES.md` §2**. This file is the verification record.

---

## 27 — Phase 0 measurement suite, re-run

| Measurement | Re-run result | vs Phase 0 |
|---|---|---|
| Stack (Next 14.2.35, App Router, system font, Supabase) | unchanged | — |
| `next build` — time / route table / static-vs-dynamic | green; **`dynamicRoutes` 0 → 7 ISR** (`/projects/[id]`, `/jobs/[id]`, `/jobs/companies/[id]`, `/projects/category/[category]`, `/learning/[gridSlug]`, `/learning/[gridSlug]/[topicSlug]`, `/coding-problems/[problemSlug]`) | 7 routes moved `ƒ` → `●` |
| First Load JS per route | shared 87.8 kB (framework floor, unchanged); per-route **−2…−17 kB** on the routes that used the UI barrel / résumé code | see `OPTIMIZATION_NOTES.md §2` |
| `@next/bundle-analyzer` — 10 largest client deps | **same set** (next, react-dom, `@supabase/ssr`+`auth-js`, lucide, prismjs, qrcode). `qrcode.react` + `demoResumes` + `TemplatePreviewModal` no longer in any route's *first* load (Phase 3). `@supabase/*` (~64 kB gz) still on every route — R1. | — |
| `next start` TTFB / cache-header probe | 6 catalog route classes: **`no-store` every request → `x-nextjs-cache: HIT` at 4–19 ms local**; `/projects` & `/jobs`: `no-store` → `public, s-maxage=60, stale-while-revalidate=300` + cached data | the core win |
| Lighthouse (mobile + desktop) on the 5 key pages | **still not runnable here** — no Chrome; site not deployed. Now covered by the Lighthouse CI job (item 29). | unchanged limitation |
| Ranked bottleneck list | `PERFORMANCE_AUDIT.md` (P0) + this engagement's phase reports; remaining items ranked in `OPTIMIZATION_NOTES.md §3` | — |

Actual `<script>` bytes on the static `/about` page: **~218 → ~215 kB gz** — barely
moved, because `@supabase/supabase-js` + `auth-js` are still pulled in by the nav
islands on every route (**R1**, the one big lever left).

## 28 — Functionality not broken

### Automated

- **`npm test` (Vitest): 278 passed, 12 skipped, 0 failed.** Includes:
  - `resumeExport.test.ts` — DOCX round-trips a structured résumé (title + bullet)
  - `resumeFileExtraction.test.ts` — PDF export → text extract → parse round-trip
  - `auth.test.ts` — the request-memoised `getAuthUser` / `getAccountUser`
  - `marketplace.test.ts`, `payments.test.ts`, `home.test.ts`, `learning.test.ts`,
    `seo.test.ts`, `nav.test.ts`, `jsonld-xss.test.ts`
- `typecheck` + `lint` clean; `next build` green.

### Server smoke (this environment)

| Flow | Check | Result |
|---|---|---|
| Auth pages | `/login`, `/register`, `/logout` render | 200, expected content |
| Marketplace browse + **filter/sort/paginate** | `/projects`, `/jobs` + 12 query combos (`?q=`, `?sort=price-low`, `?category=`, `?flag=premium`, `?type=Internship`, `?page=2`, `?min=&max=`) | 200; card counts change correctly; "21 projects" / "10 roles" header renders |
| Project detail / purchase panel | `/projects/tr-2` (ISR HIT) renders title, about, reviews, related; `ProjectPurchasePanel` mounts | 200 |
| Job detail / apply panel | `/jobs/job-1` renders; `JobApplyPanel` mounts | 200 |
| Company / category / learning | `/jobs/companies/google`, `/projects/category/web-development`, `/learning/java-tutorial`, `/learning/java-tutorial/<topic>` | 200 (all ISR HIT) |
| Résumé builder | `/resume` hub + `/resume/templates` (4 server-rendered thumbnails) render | 200 |
| Résumé save/export | export/extract/parse covered by Vitest; `ResumeEditor` autosave keys off live `content` state (not the deferred preview copy) — verified in the diff | ✓ |
| Referral | `/referral`, `/account/referral` (`referral_codes` explicit select) | 200 |
| API routes | `/api/revalidate` (405 on GET), `/api/resume/export/pdf` (400), `/api/compiler/run` (405), `/api/coding-problems/judge` (405) — reject GET cleanly | ✓ |

### Security / RLS — unchanged (RULE: never trade RLS for speed)

- `src/lib/cache.ts` (the new `unstable_cache` layer) calls **only**
  `getPublicSupabase()` — the anon-key client (`persistSession: false`) against
  tables with a `select using (true)` policy. **No cookie-bound or user-scoped
  query is cached.** Verified by grep: no `createAuthedServerSupabase`, `cookies(`,
  `auth.uid`, `auth.getUser`, or `user_id` filter anywhere in `cache.ts`.
- `middleware.ts` and the `createAuthedServerSupabase()` (cookie-session) path
  were not touched in any phase.
- `/account/*` routes still render `ƒ` dynamic with `Cache-Control: private,
  no-store` — no user page is cached.

### Not verifiable here

Interactive flows end-to-end (Razorpay checkout, job apply submit, wallet top-up,
résumé save in a live editor) need a real browser + auth session. The server
actions / helpers behind them are covered by the Vitest suites and were not
modified in Phases 2–5. Re-run a manual pass on a deployed preview.

## 29 — Lighthouse CI performance budget

Added a **`lighthouse` job to `.github/workflows/website-ci.yml`** (PR-only) +
**`website/lighthouserc.json`**:

- `npm ci` → `npm run build` → `npx @lhci/cli@0.14.x autorun` → `next start` + 3
  mobile Lighthouse runs on `/`, `/about`, `/premium`, `/resume/templates`,
  `/compiler`, `/login`.
- **`error`** (fails the PR): `cumulative-layout-shift ≤ 0.10`,
  `resource-summary:script:size ≤ 240 kB`, text-compression on, JS/CSS minified.
- **`warn`** (tracked, doesn't block): perf score ≥ 0.85, LCP ≤ 2800 ms, FCP,
  TBT, TTI, Speed Index, modern-image-formats, responsive-images,
  prioritize-lcp-image, render-blocking-resources.

The `error` thresholds are set at *today's* numbers + headroom — a regression
guard, not the aspirational `< 150 kB` / `LCP < 1.2 s` targets from the brief
(those need **R1**, the nav de-Supabase). Tighten `warn` → `error` as R1–R5 land.

**Caveat:** not exercised in this environment (no Chrome). The config is
JSON-validated and uses standard Lighthouse audit ids; calibrate the numeric
thresholds from the first real CI run.

## 30 — `OPTIMIZATION_NOTES.md`

Written — the master summary: everything done (per phase, with the full
before/after table), everything remaining ranked by impact (**R1–R7**), and
everything that needs a migration / dashboard change / paid plan with the exact
SQL or steps (**M1–M6**): the index SQL, the RLS `(select auth.uid())` sweep, the
deploy-region check, the optional Supabase Pro image loader, the `revalidateTag`
admin wiring, and the `wallet_balance()` RPC.

---

## Files (Phase 5)

```
?? website/OPTIMIZATION_NOTES.md          master summary (done / remaining / infra)
?? website/PERFORMANCE_PHASE5.md          this file
?? website/lighthouserc.json              Lighthouse CI budget
 M .github/workflows/website-ci.yml       + lighthouse job (PR-only)
```

No application source changed in Phase 5.
