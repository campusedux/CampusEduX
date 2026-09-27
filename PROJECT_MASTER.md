# CampusEduX — Project Master

Audited: 2026-09-27. This file is the single source of truth for architecture, database, features, security, and status. Read this first before making changes.

## 1. Overview

CampusEduX is a student learning/placement-prep platform with three apps sharing one Supabase backend: a Next.js website, an Expo/React Native mobile app, and a Next.js admin panel. Features span Learning (tutorials), Practice (coding problems/judge), Mock Tests/MCQ, Interview prep, a Custom Project Builder (paid, token-based), resumes/career tools, wallet, referrals, and a blog.

## 2. Tech Stack

mobile-app: Expo ~55.0.0, React Native 0.83.10, React 19.2.0, supabase-js 2.57.0, react-native-razorpay 3.0.0, nativewind 4.2.1, zustand, react-hook-form, zod, jest 29.7.0
website: Next.js 14.2.35, React 18.3.1, supabase/ssr 0.4.0, supabase-js 2.57.0, anthropic-ai/sdk 0.124.0, pdf-parse, docx, mammoth, qrcode.react, zod 3.23, vitest 2.1.9, tailwind 3.4
admin-panel: Next.js 14.2.35, React 18.3.1, same Supabase versions, recharts 2.12.0, vitest, tailwind

Razorpay on website is client-side checkout.js plus server API routes (no npm SDK dependency).

## 3. Repo Structure

- mobile-app has its own supabase directory (canonical: migrations, functions, seed.sql, tests, harness)
- website has its own minimal supabase migrations (2 files, no functions)
- admin-panel has its own supabase directory (near-duplicate mirror of mobile's schema, 98 migrations)
- .github/workflows has CI only (mobile-ci, website-ci, admin-ci); no PR/issue templates
- .claude has agents, rules, skills for Claude Code workflow
- No top-level supabase directory; no root README.md or LICENSE exists (gap, not classified as a doc to remove)

## 4. Architecture

Three independent apps, each with its own Supabase client config, sharing one hosted Supabase project (mobile-app's supabase directory is canonical, 126 migrations, versus admin-panel's 98 mirrored subset, versus website's 2). No shared package/monorepo tooling observed; each app has its own package.json, CI workflow, and env vars.

## 5. Mobile (mobile-app/)

- Scripts: start/android/ios/web (expo start), typecheck, lint, test/test:watch (jest), format/format:check, doctor (expo-doctor), check (typecheck+lint)
- Config: app.json (package com.campusedux.app, blockedPermissions, runtimeVersion policy appVersion), eas.json (development/preview/production profiles, appVersionSource remote)
- Docs: docs/api.md, docs/architecture.md, docs/database.md, docs/deployment.md, docs/navigation.md, docs/play-store/app-content.md, docs/play-store/data-safety.md, docs/play-store/permissions.md
- Features implemented: Learning, Practice/Coding, Placement (MCQ/mock tests), Interview prep, Custom Project Builder plus wallet payments, auth (including Google OAuth via src/services/auth.service.ts line 124), resume/career, wallet

## 6. Website (website/)

- Scripts: dev/build/start, lint, typecheck, test/test:watch (vitest), legal:sync
- next.config.js: custom CSP (allows Razorpay + GA4 + Supabase), image remotePatterns for supabase.co, pdf-parse excluded from bundling. No output export/standalone mode.
- lighthouserc.json present, Lighthouse CI budgets enforced on PRs
- No vercel.json, deploy config is dashboard-managed, not committed
- Reference docs kept current: WEBSITE_FEATURE_MATRIX.md, WEBSITE_ROUTE_MAP.md, docs/CACHE_REVALIDATION.md, OPTIMIZATION_NOTES.md, LEGAL_DATA_MAP.md, TESTING.md

## 7. Admin (admin-panel/)

- Scripts: dev/build/start, lint, typecheck, test/test:watch (vitest), no build step in CI (admin-ci.yml runs typecheck/lint/vitest only)
- next.config.mjs: CSP frame-ancestors none, HSTS, X-Frame-Options DENY
- Full page trees for students (block/wallet/progress/reports), CMS, blog, orders (refunds/coupons/wallet-requests), reviews, settings/admin-users/roles, activity-logs, reports
- Email/password auth only, no Google OAuth call found in admin-panel/src

## 8. Supabase / DB

Canonical project: mobile-app supabase directory (126 migrations). admin-panel supabase directory is a near-duplicate mirror (98 migrations, offset roughly 28, missing mobile's earliest tables). website supabase directory is minimal (2 migrations: contact_submissions, contact_limiter_hardening).

- config.toml (mobile-app): project id campusedux, Postgres 15, JWT verification declared for 10 functions (create/verify-razorpay-payment, premium, wallet-topup, custom-project-order, delete-account, admin-ban-user). razorpay-webhook is intentionally absent from that list (unauthenticated by design, verified by signature instead). No local auth block; auth providers configured in the hosted dashboard.
- Major tables (roughly 40, public schema): profiles, categories, projects, project_files, project_images, project_versions, reviews, wishlists, purchases, downloads, companies, jobs, saved_jobs, job_alerts, resumes, resumes_builder, resume_versions, resume_shares, resume_downloads, resume_ai_requests, wallet_transactions, wallet_topup_orders, referrals, referral_codes, referral_earnings, notifications, notification_preferences, premium_subscriptions, premium_plans, premium_features, prep_notes, prep_note_bookmarks, legal_consents, test_attempts, test_attempt_answers, test_questions, dsa_problems, user_dsa_progress, learning_contents, learning_grids, learning_sections, learning_topics, interview_questions, interview_categories, interview_topics, custom_project_requests, custom_project_drafts, custom_project_payments, custom_project_deliveries, custom_project_messages, blog_posts, blog_categories, a table for internal application configuration values, edge_rate_limits, rate_limit_hits, ai_budget_usage, blocked_users.
- RLS coverage (verified via grep, mobile-app/supabase/migrations): row-level-security enable statements found in 41 files (83 total statements); policy-creation statements found in 52 files (215 total statements, many files touch multiple tables). This is a breadth signal, not an exact policy count. admin-panel/website RLS coverage is UNVERIFIED in this audit, not independently checked.
- RPC/functions: 43 files define functions. Notable: is_admin (mobile-app/supabase/migrations/0119_admin_permission_enforcement.sql line 88, revoked from public, granted anon/authenticated/service_role), has_permission, current_user_is_premium, current_user_branch_id, current_user_course_id, current_user_year_id, content_visible_to_current_user, learning content visibility helper functions, check_rate_limit, ai_budget_take, apply_referral_code, ensure_referral_code, convert_referral_on_first_purchase, admin_adjust_wallet, admin_process_refund, admin_process_withdrawal, admin_set_custom_project_final_price, admin_dsa_problem_secrets, custom_project_apply_balance_payment, custom_project_guard_money_columns, custom_project_set_status, handle_new_user, get_shared_resume, and a small set of internal helper functions prefixed with an underscore for privilege and session checks.
- Edge functions (mobile-app/supabase/functions, 13 plus a shared helper directory): create-razorpay-order, verify-razorpay-payment, create-premium-order, verify-premium-payment, create-wallet-topup-order, verify-wallet-topup-payment, create-custom-project-order, verify-custom-project-payment, create-custom-project-balance-order, verify-custom-project-balance-payment, razorpay-webhook, delete-account, admin-ban-user.
- Storage buckets: avatars, custom-project-deliveries, custom-project-uploads, learning-files, project-files, resumes.
- Auth: session-user-id checks used across 51 migration files for ownership checks; role-based checks in only 1 file; no custom-claims pattern found, role and permission logic routes through the is_admin and has_permission functions, not JWT claims.
- Migration status: mobile-app is the source of truth; admin-panel and website migration sets should be diffed against it before assuming schema parity, treat drift as UNVERIFIED until checked.

## 9. Auth & Authorization

- Google OAuth sign-in is used in mobile-app/src/services/auth.service.ts (around line 124), website/src/app/login/LoginView.tsx (around line 65) and website/src/app/register/RegisterView.tsx (around line 62), with the redirect handled in website/src/app/auth/callback/route.ts. Admin panel uses email and password only.
- Admin gating: an is_admin database function defined in mobile-app/supabase/migrations/0119_admin_permission_enforcement.sql (line 88), referenced in 10 migration files; a layered has_permission function provides finer-grained checks.
- No hardcoded privileged credential values were found in website/src, mobile-app/src, or admin-panel/src (verified via search, clean).

## 10. Main Features

All seven checked feature areas have matching route/screen trees across website, mobile, and admin — no PENDING items surfaced at the routing/screen level (see sections 11-14 for detail; deeper business-logic completeness was not verified beyond route/screen existence).

## 11. Learning

IMPLEMENTED across all three apps. Grid to Section to Topic hierarchy. Website: app/learning/[gridSlug]/[topicSlug], api/learning/progress. Mobile: src/learning/LearningGridsScreen.tsx, LearningGridScreen.tsx, LearningTopicScreen.tsx, courseTree.ts. Admin: (panel)/learning/grids/[gridId]/sections/[sectionId]/topics/[topicId].

## 12. Practice

IMPLEMENTED. Coding problems with a judge/compiler pipeline. Website: api/coding-problems/judge and submit, api/compiler/run, workspace UI (CodeEditorPanel, CompilerPanel, OutputPanel), standalone /compiler. Mobile: src/practice/PracticeCompilerScreen.tsx, PracticeProblemScreen.tsx, PracticeSubmissionScreen.tsx. Admin: learning/practice/[problemId]. MCQ/Mock Tests also IMPLEMENTED (website mock-tests/[testId]/MockTestRunner.tsx, admin placement/tests/[id], mobile placement/LiveTestScreen.tsx and TestResultScreen.tsx).

## 13. Interview

IMPLEMENTED. Website: practice/interview-questions/[category]/[topic]. Mobile: practice/InterviewCategoriesScreen.tsx, InterviewTopicScreen.tsx, InterviewTopicsScreen.tsx. Admin: learning/interview-questions/[questionId].

## 14. Project Builder

IMPLEMENTED. Custom project wizard with token-based payments. Website: custom-projects/start, features, estimate, checkout plus _builder components, api/custom-projects/understand. Mobile: customProjects/BuilderStartScreen.tsx and sibling wizard screens (Type, Level, Platform, Details, Features, Uploads, Estimate, Payment), TokenRefundSummary.tsx. Backed by the create/verify custom-project edge functions.

## 15. Payments

Razorpay integration, signature-verified:
- Payment verification helper lives in mobile-app/supabase/functions/_shared/razorpay.ts (around line 58), with a constant-time comparison around line 84. Used by the verify-razorpay-payment, verify-premium-payment, verify-wallet-topup-payment, verify-custom-project-payment, and verify-custom-project-balance-payment functions.
- Webhook verification lives in mobile-app/supabase/functions/razorpay-webhook/index.ts (around line 46), invoked around line 121, using an environment-provided webhook value (name only, value never read or printed by this audit).
- Wallet top-ups also credit via a webhook fallback path (see recent commit aa05632), not independently re-verified in this audit; treat as UNVERIFIED until re-checked against current code.

## 16. API/Data Flow

Each app talks directly to the shared Supabase project via its own client (anon key plus RLS), with privileged mutations routed through RPCs (admin-prefixed and custom-project-prefixed functions) or Edge Functions (payments, account deletion, admin ban) rather than direct table writes from clients.

## 17. Env Var Names

Names only, no values captured or stored anywhere in this audit.

- mobile-app: two Expo-public Supabase key variables and one Expo-public Supabase URL variable.
- website: several NEXT_PUBLIC variables (Supabase URL/anon key, site URL, GA measurement id, legal entity name, support email, WhatsApp support toggle); server-only variables for the Anthropic SDK, the code-compiler provider selection and its auth requirement, several code-judge provider endpoint/token variables (Judge0, Paiza, Piston), a judge RPC shared secret, and a revalidation secret.
- admin-panel: NEXT_PUBLIC Supabase URL/anon key, site URL, website URL, and a revalidation secret.
- Edge Functions runtime: Razorpay key id, Razorpay key secret, Razorpay webhook secret, Supabase anon key, Supabase service role key, Supabase URL — these are environment variable NAMES referenced by the deployed functions, not values, and were not read or printed.

## 18. Deployment

- Mobile: Expo/EAS, eas.json profiles (development/preview/production), remote app-version source. No EAS build step in CI (manual/local builds).
- Website and Admin: Next.js, no vercel config file committed, deploy config is dashboard-managed (Vercel implied by env var naming and prior project context, not independently confirmed in this audit).
- Supabase migrations: no CI workflow applies them automatically, owner applies migrations manually (consistent with long-standing project convention).

## 19. Dev Commands

- Website/Admin: npm install, then npm run dev
- Mobile: npm start, or expo start
- Website README documents npm install, npm run dev, npm run typecheck, and npm run build as the setup flow.

## 20. Testing

- mobile-ci.yml: npm ci, then typecheck, lint, and jest tests
- website-ci.yml: typecheck/lint/vitest/next build (check job); separate PR-only Lighthouse job using lighthouserc.json
- admin-ci.yml: typecheck/lint/vitest only, no build step
- Mobile Supabase migrations have a local PG17 test harness (mobile-app/supabase/tests/harness/)

## 21. Security Status

- Razorpay payment and webhook signature verification confirmed present with constant-time comparison (see section 15).
- No hardcoded privileged credential values found in client bundles across all three apps (verified clean).
- Admin gating centralized through the is_admin and has_permission database functions rather than ad hoc checks.
- RLS is broadly applied (41 files enabling it, 52 files defining policies) but exact per-table completeness was not exhaustively verified, treat as a breadth signal, not a guarantee every table is covered. The prior root-level RLS audit report contains a deeper dated pass; consult it (or re-run) before relying on this summary for a security decision.
- admin-panel and website RLS/schema drift from the canonical mobile-app migrations is UNVERIFIED, recommend a diff pass before assuming parity.

## 22. Performance Status

Website has a multi-phase optimization history (OPTIMIZATION_NOTES.md consolidates Phases 1-5) plus Lighthouse CI budgets. No current Core Web Vitals numbers were reproduced in this audit; prior audits noted CWV as not directly measurable in the audit environment (no Chrome). Treat website perf as improved-but-not-independently-remeasured here.

## 23. Project Status

| Area | Status |
|---|---|
| Learning | IMPLEMENTED |
| Practice / Coding | IMPLEMENTED |
| MCQ / Mock Tests | IMPLEMENTED |
| Interview prep | IMPLEMENTED |
| Project Builder + payments | IMPLEMENTED |
| Auth (incl. Google OAuth on mobile/website) | IMPLEMENTED |
| Resume/career, wallet | IMPLEMENTED |
| Admin content/user management | IMPLEMENTED |
| Admin build gate in CI | KNOWN ISSUE, admin-ci.yml has no build step, unlike website-ci.yml |
| Schema parity across 3 supabase trees | UNVERIFIED, needs a diff pass |
| No root README/LICENSE | KNOWN ISSUE, gap, not previously flagged |
| Payment/refund integrity | OPEN ISSUE (CRITICAL), see 2026-09-27 audit carry-forward below — do not assume payment correctness until fixed |

## 24. Future Work

- Add a build step to admin-ci.yml to match website-ci.yml's build gate.
- Diff admin-panel and website Supabase migrations against the canonical mobile-app set to confirm no drift.
- Consider a root README.md pointing to this file and to each app's own README/docs.
- Re-verify wallet webhook-fallback crediting logic (commit aa05632) against current code if relied upon for financial correctness.

### Open items carried forward from dated audit docs (verified 2026-09-27, against current code)

- **Payment tampering (CRITICAL)** — `verify-razorpay-payment` only checks order-id binding when non-null, never checks amount/captured status, and updates the purchase row with no `status='pending'` guard; no unique index on `razorpay_payment_id`. AUDIT_REPORT.md DB-01/PAY-01/MOB-19.
- **Refund amount/ownership unchecked (CRITICAL)** — `admin_process_refund()` credits the client-supplied amount and updates any `purchase_id` to refunded with no cap-vs-purchase-total or ownership/status check; `mobile-app/supabase/migrations/0118` documents this as deliberately deferred. RLS_AUDIT.md C1.
- **Referral money-farming (HIGH, partial)** — no minimum-order cap, reward-vs-share-of-price cap, or refund clawback; migration 0121 documents this as deliberately out of scope. AUDIT_REPORT.md DB-08/PAY-16.
- Razorpay verify Edge Function is still check-then-act with no row lock/conditional update (RLS_AUDIT.md M3). `usePayment.ts` still marks a successfully-charged order "failed" on a post-charge verify error (AUDIT_REPORT.md MOB-01). `coupons`/`offers` are world-readable via `USING (true)` (RLS_AUDIT.md M1). Premium test scoring has no entitlement check, only visibility (RLS_AUDIT.md H2 residual).
- **Content licensing/provenance (7 items, AdSense-relevant)** — Java/Python/DBMS/Generative-AI/AI-ML tutorial content and the two interview-question guides have no recorded author/license and their source files are absent from the repo; unchanged since the original audit. website/CONTENT_PROVENANCE_AUDIT.md, all 7 items still open.
- **Website security (6 items)** — Next 14→15 not migrated, `@supabase/ssr` not bumped past 0.4.x, `resume_ai_prompts` still anon-readable, CORS wildcard on 2 resume API routes, `search_path` unset on 3 resume RPCs, no `pg_trgm` index for search. website/SECURITY_AUDIT_2026-09-06.md.
- **Learning system polish (5 items)** — Sentry/observability still not wired; premium learning files still on the public bucket path (constant defined, never used); `/api/revalidate` has no rate limit; no admin→website revalidate webhook (website relies solely on ISR); admin-panel has no root `error.tsx`. Note: most of that document's Phase 2-6 typed-grid architecture was later deliberately reverted by `mobile-app/supabase/migrations/0064_remove_specialised_learning_grids.sql` and no longer exists in the codebase. LEARNING_UNIFICATION_AUDIT.md.

Dated audit files — delete recommendation from this pass (nothing deleted):

| File | Verified-open items | Safe to delete |
|---|---|---|
| AUDIT_REPORT.md | 3 (+~155 rows not re-checked) | NO |
| FEATURE_PARITY_AUDIT.md | 0 (+~27 rows not re-checked) | LEANS YES — spot-check the unchecked tail first |
| LEARNING_UNIFICATION_AUDIT.md | 5 | YES |
| WEBSITE_MOBILE_SYNC_ANALYSIS.md | 1 (live-apply status of `0041_public_catalog`/website `0001_contact_submissions`, unverifiable from a read-only repo pass) | YES — carry that one line forward first |
| RLS_AUDIT.md | 5 (1 CRITICAL) | NO |
| website/SECURITY_AUDIT_2026-09-06.md | 6 | NO |
| website/CONTENT_PROVENANCE_AUDIT.md | 7 | NO |

## 25. Dev Rules

Follow the root CLAUDE.md and .claude/rules/*.md: UNDERSTAND, INSPECT, PLAN, APPROVE, IMPLEMENT, TEST, REVIEW, DOCUMENT/COMMIT. No vibe coding. Preserve existing behavior unless a requirement explicitly changes it. Explicit human approval required before schema, RLS, auth, payment, or other sensitive changes, migrations, production config, deployment, or any Git commit/push/branch creation.

## 26. AI Agent Instructions

1. Read this file first before starting any non-trivial change.
2. Verify code/schema state directly (search, read the actual migration/file) before assuming anything in this document is still current, it is a point-in-time snapshot.
3. Check the canonical mobile-app schema before any DB change; confirm whether admin-panel/website need a mirrored migration.
4. Never bypass or weaken RLS, the admin/permission check functions, or payment signature verification.
5. Never print, log, or commit sensitive values such as API keys or passwords; use env var names only.
6. Reuse existing architecture/components/RPCs; avoid parallel implementations.
7. Run the relevant test suite/harness for the surface touched (jest for mobile, vitest for website/admin, PG17 harness for DB/RLS).
8. Update this file only on major changes (new feature area, schema restructure, security posture change), not for routine edits.

## 27. Final Audit

- Architecture: Three independently-versioned apps sharing one Supabase project; no shared monorepo tooling, acceptable but drift-prone.
- Database: 126 canonical migrations (mobile-app), roughly 40 major tables, broad RLS coverage (41/52 files), solid, but cross-app parity unverified.
- Security: Payment/webhook signatures verified with constant-time comparison; no privileged credential leakage found; admin gating centralized, no critical issues found in this pass.
- Auth: Google OAuth on mobile/website, email/password on admin; role checks via database function not JWT claims, consistent and centralized.
- Mobile: Full feature parity (Learning/Practice/Interview/Project Builder/Wallet); CI runs typecheck/lint/jest.
- Website: Full feature parity; CI runs full build plus Lighthouse; CSP and image config in place.
- Admin: Full feature parity; CI does not run a build step, gap.
- Payments: Razorpay signature verification confirmed on both payment and webhook paths.
- Deployment: No committed Vercel config file; EAS profiles configured but no CI build step; migrations applied manually by owner.
- Testing: Per-app CI exists for all three; DB has a local PG17 RLS/migration harness.
- Documentation: 72 markdown files pre-audit, heavily duplicated across dated point-in-time audit reports; consolidated into this file (see git history for the removed originals).
