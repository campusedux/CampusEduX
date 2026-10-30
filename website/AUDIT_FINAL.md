# CampusEduX website audit — final merge

**15 October 2026 UTC. Scope: `website/` only.** This merges the completed [SEO Part 1](AUDIT_SEO_PART1.md), [bugs Part 2](AUDIT_BUGS_PART2.md), [AdSense/content Part 3](AUDIT_ADSENSE_CONTENT_PART3.md), and [UI/dead-code Part 4](AUDIT_UI_DEADCODE_PART4.md). No application code was changed. **Files read: 607 of 607** website files outside `node_modules/` and `.next/` for Batch 4, including all 433 code files; prior part coverage is stated in each report. Scores below are prioritization judgments from source, not production test results.

## Executive summary

| Area | Score /100 | Main reason |
|---|---:|---|
| Bugs | 67 | Wallet balance truncates at 50 rows, payment callback recovery is weak, and Edge Function/RLS guarantees need live verification (`src/app/account/wallet/page.tsx:15-31`; `src/app/account/wallet/TopUpForm.tsx:45-58`; `src/app/mock-tests/[testId]/result/[attemptId]/page.tsx:33-58`). |
| SEO | 64 | Deliberate noindex rules explain many absent URLs; empty lessons and error-to-noindex remain fixable (`src/lib/contentQuality.ts:7-23`; `src/app/learning/[gridSlug]/[topicSlug]/page.tsx:83-103,244-245`; `src/lib/cache.ts:175-196`). |
| AdSense readiness | 42 | **Not ready**: consent, ad disclosures, original-content inventory and CSP integration need work (`src/components/analytics/GoogleAnalytics.tsx:20-33`; `src/legal/content/cookie-policy.json:52-64`; `next.config.js:15-39`). |
| UI | 72 | Shared tokens are solid; modal focus, small targets and parallel styles need cleanup (`src/components/ui/Modal.tsx:30-68`; `src/components/nav/BottomNav.tsx:27-42`; `src/app/globals.css:236-259`). |
| Code cleanliness | 78 | AST graph found no safe-to-delete source files; duplicate presentation/payment patterns and uncertain public assets remain (`src/components/ui/Button.tsx:11-31`; `src/app/account/wallet/TopUpForm.tsx:45-58`; `public/brand/logo-full.png:1`). |
| **Overall (equal-weight mean)** | **65** | Fix payment/account correctness and consent/content blockers before polish or dependency migration. |

Production Supabase data, Edge Functions, payment dashboard, Search Console and live viewport screenshots were unavailable; findings labeled **UNVERIFIED** in the parts remain so. Part 2's `npm audit` observed vulnerable package entries but package applicability and upgrade compatibility require separate testing (`AUDIT_BUGS_PART2.md:7-16,114-149`).

## Top 25 fixes by expected impact ÷ effort

Effort: **S** up to ~1 day, **M** ~2–5 days, **L** longer or cross-system. Order is a practical sequence; verification gates are included because a bad assumption could cause a harmful fix.

| Rank | ID | Fix | File:line | Effort |
|---:|---|---|---|:---:|
| 1 | BUG-02 | Compute wallet balance from authoritative full ledger/RPC, separate paginated history. | `src/app/account/wallet/page.tsx:15-31` | M |
| 2 | BUG-03 | Catch/recover all Razorpay callback verification errors; reconcile by immutable order ID. | `src/app/account/wallet/TopUpForm.tsx:45-58`; `src/components/PremiumSubscribeButton.tsx:71-82` | M |
| 3 | BUG-04 | Verify Edge Function amount, owner, signature, idempotency and webhook reconciliation with test payments. | `src/app/custom-projects/checkout/CustomProjectCheckout.tsx:39-76` | M |
| 4 | BUG-10 | Distinguish DB failure from a true empty catalog before rendering or caching `noindex`. | `src/lib/cache.ts:175-196`; `src/app/projects/page.tsx:38-64` | S |
| 5 | BUG-08 | Check progress upsert errors and make response accurately report whether progress saved. | `src/app/api/practice/submit/route.ts:179-194`; `src/app/api/coding-problems/submit/route.ts:182-197` | S |
| 6 | BUG-14 | Treat failed profile read as retryable error, not incomplete onboarding. | `src/lib/auth.ts:65-107` | S |
| 7 | BUG-13 | Return search errors as 503/no-store; cap abusive requests. | `src/lib/search.ts:96-118`; `src/app/api/search/route.ts:19-32` | M |
| 8 | UI-01 | Add focus placement/trap/restoration and accessible names to shared Modal/Drawer. | `src/components/ui/Modal.tsx:30-68`; `src/components/ui/Drawer.tsx:36-95` | M |
| 9 | BUG-18 | Reject malformed revalidation requests instead of invalidating `/learning`. | `src/app/api/revalidate/route.ts:67-98` | S |
| 10 | ADS-01 | Implement consent choice, persistence, revocation and GA default-denied gating. | `src/components/analytics/GoogleAnalytics.tsx:20-33`; `src/legal/content/cookie-policy.json:60-65` | M |
| 11 | SEO-EMPTY | Noindex or remove truly empty public lessons/topics from sitemap until populated. | `src/app/learning/[gridSlug]/[topicSlug]/page.tsx:83-103,244-245`; `src/lib/sitemap/build.ts:139-149` | S |
| 12 | BUG-12 | Verify project draft visibility with anon RLS and filter at the source if exposed. | `src/lib/cache.ts:170-192,253-260`; `src/lib/search.ts:96-109` | M |
| 13 | BUG-15 | Verify mock-test attempt ownership with two users and enforce owner filter/RLS. | `src/app/mock-tests/[testId]/result/[attemptId]/page.tsx:33-58` | M |
| 14 | BUG-06 | Cap resume upload bytes before multipart buffering at ingress. | `src/app/api/resume/parse/route.ts:47-62` | M |
| 15 | BUG-07 | Rate-limit PDF/DOCX exports and bound version writes. | `src/app/api/resume/export/pdf/route.ts:17-28`; `src/app/api/resume/export/docx/route.ts:18-29` | M |
| 16 | ADS-02 | Update privacy/cookie disclosures for actual ad use and opt-out before ad launch. | `src/legal/content/privacy-policy.json:117,153-156`; `src/legal/content/cookie-policy.json:7,52-64` | S |
| 17 | LEGAL-01 | Correct hub effective-date and same-text-on-app claim; owner-check identity and inboxes. | `src/app/legal/page.tsx:29-34`; `src/legal/legal.config.json:2-20` | S |
| 18 | UI-02 | Raise small dismiss, toolbar and chip targets to 44px. | `src/components/home/AnnouncementBar.tsx:61-75`; `src/components/ui/Toast.tsx:66-73`; `src/components/ui/Field.tsx:119-132` | S |
| 19 | UI-03 | Reserve bottom space for project buy bar at mobile/tablet widths; test safe areas. | `src/app/projects/[id]/page.tsx:194-202`; `src/app/layout.tsx:104-106` | S |
| 20 | BUG-16 | Provide owner-checked web download for paid marketplace projects. | `src/app/account/purchases/page.tsx:14-27` | M |
| 21 | ADS-CONTENT | Inventory published CMS pages; rewrite thin/generated lessons with original examples and attribution. | `src/lib/contentQuality.ts:7-23`; `src/app/learning/[gridSlug]/[topicSlug]/page.tsx:233-278` | L |
| 22 | ADS-CSP | Add AdSense CSP with nonce/report-only test after approval and publisher ID; reserve ad slots. | `next.config.js:15-39`; `src/app/projects/[id]/page.tsx:194-201` | M |
| 23 | UI-06 | Wire form errors to inputs with stable `aria-describedby`/`aria-invalid`. | `src/components/ui/Field.tsx:80-91` | S |
| 24 | UI-10 | Consolidate empty/error states and button/card/badge recipes route by route. | `src/app/globals.css:236-259,301-309`; `src/app/custom-projects/features/page.tsx:31` | M |
| 25 | BUG-01 | Upgrade Next 14 to a patched release on a separate branch with preview, audit and regression testing. | `package.json:23`; `next.config.js:1` | L |

**Intentional, not bugs:** delivered custom-project files remain downloadable while a balance is due (`src/app/custom-projects/my-projects/[id]/page.tsx:330-361`); learning progress stays in localStorage for now (`src/lib/learningProgress/store.ts:4-8,36-49`); Domain & Hosting is not yet a website feature (`src/app/custom-projects/page.tsx:1`). These override BUG-05, BUG-09, and the Part 2 feature-status “Missing” label as proposed fixes. Keep them as documented product decisions unless the owner changes policy. All other Part 2 findings retain their stated verification status.

## Phased fix plan and ready-to-use Claude Code prompts

Each prompt is scoped to `website/`, requests an atomic commit, and forbids push. Run phases in order; keep independent critical fixes separate where they need different reviewers. Do not use `npm audit fix` blindly. Prompts point to source evidence and require tests only where they exercise the actual failure.

### Phase 1 — critical, security, payments

> Work only in `website/`. Read `AUDIT_FINAL.md` and `AUDIT_BUGS_PART2.md`. Fix BUG-02, BUG-03, BUG-08, BUG-10, BUG-13, BUG-14 and BUG-18. Add meaningful fault-path tests for ledger aggregation, callback rejection/retry, failed DB reads and invalid revalidation input. For BUG-04, BUG-12 and BUG-15, inspect reachable website evidence and document external Edge Function/RLS checks that cannot be verified here; do not invent deployed guarantees. Preserve the intentional balance-due download behavior and localStorage learning progress. Run typecheck, lint, relevant tests and build. Commit the website changes with a precise message; do not push.

### Phase 2 — indexing, metadata, legal and consent

> Work only in `website/`. Read `AUDIT_SEO_PART1.md`, `AUDIT_ADSENSE_CONTENT_PART3.md` and `AUDIT_FINAL.md`. Implement a fail-safe empty-content/noindex+sitemap rule and prevent transient query failure from emitting noindex. Add consent preferences with default denied, revocation and GA gating; align privacy/cookie copy with the behavior actually shipped, and fix the legal hub date/app-text mismatch. Do not load AdSense or claim ads are live before publisher approval. Verify metadata/robots/sitemap paths, consent behavior, typecheck, lint and build. Commit; do not push.

### Phase 3 — content rewrites

> Work only in `website/`. Read `AUDIT_ADSENSE_CONTENT_PART3.md` and `AUDIT_SEO_PART1.md`. Build a published-content inventory from available website data access; identify thin/templated lessons, interview topics, jobs and project pages. Rewrite only source-controlled copy with original topic-specific explanations/examples and clear provenance; prepare an editor-ready list for database content that is unavailable locally. Keep thin pages noindexed until they have substantive public content. Do not fabricate CMS row counts or claim originality without review. Validate affected routes/content rules, commit the website changes and report remaining CMS work; do not push.

### Phase 4 — UI cleanup

> Work only in `website/`. Read `AUDIT_UI_DEADCODE_PART4.md`. Fix modal/drawer focus management and naming, 44px targets, project buy-bar clearance, announcement wrapping/layout shift, and Field error association. Normalize tokens first, then Button/Card/Badge/empty/error primitives, then premium/custom-project and account pages. Preserve intentional IDE and resume-paper theme islands. Test keyboard interaction and 320/375/768/1440 viewport behavior in light/dark and reduced-motion modes; run typecheck/lint/build. Commit; do not push.

### Phase 5 — dead-code cleanup

> Work only in `website/`. Read Part 4's AST graph and SAFE TO DELETE / VERIFY FIRST lists. Re-run a TypeScript import graph including Next convention files, middleware, dynamic imports, config, CSS, public assets and CMS URL references. Delete only files with proven zero runtime/config/public references and record exact commands and sizes. Do not delete any VERIFY FIRST item until its external consumer has been checked. Consolidate duplicated presentation/payment helper logic only where behavior and tests match. Run typecheck/lint/build and commit; do not push.

### Phase 6 — dependency upgrade on separate branch

> Create a separate branch for a patched Next upgrade; work only in `website/`. Read BUG-01 and the npm advisory detail in `AUDIT_BUGS_PART2.md`. Choose a patched compatible Next version, update matching React/eslint tooling and lockfile deliberately, then run `npm audit`, typecheck, lint, full tests and production build. Deploy a preview and test auth, payment callbacks, middleware/CSP, sitemap/metadata, dynamic OG images, compiler/editor and resume PDF/DOCX. Record remaining advisories and preview evidence. Commit on the separate branch; do not push or merge.
