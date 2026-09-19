# CampusEduX / ProjectHub — Pre-Launch Audit (full product)

**Date:** 2026-09-19 · **Branch:** `main` · **Mode:** AUDIT ONLY — nothing was modified, fixed, committed, migrated or deployed.
**Scope:** `mobile-app/` (Expo SDK 55 / RN 0.83, also web), `admin-panel/` (Next 14), `website/` (Next 14), Supabase (204 migration files in two trees, 9 edge functions, storage, RLS).
**Working tree:** 105 changed/untracked paths are uncommitted (36 untracked). The uncommitted WIP includes the custom-project builder redesign, jobs external-apply/filters, edge function `create-custom-project-order` + `_shared/customProjectPricing.ts`, and migrations `mobile 0113–0116 / admin 085–088`. It was audited and every WIP-dependent finding says so.
**Replaces:** the earlier website-only `AUDIT_REPORT.md` (2026-09-09, commit `c8b68b9`, recoverable from git). Its open items were re-verified (see section 3.3, Website).
**Method / honesty note:** static code + SQL reading, plus running the existing gates. Nothing was executed against the live database, live Razorpay, or a device. **Confirmed** = seen in code/SQL or reported by a tool; **Suspected** = needs runtime/device/dashboard proof. The two Critical payment exploits are *code-traced, not executed* — reproduce them in Razorpay **test mode** with a throwaway user (steps in section 6) before treating them as proven in production.
Finding IDs by area: `DB-` database/RLS · `PAY-` payments/edge/abuse · `WEB-` website · `ADM-` admin · `MOB-` mobile crashes/functional · `UX-` UX/UI/store. Several IDs describe the same root cause from different angles; they are cross-referenced once in the "Duplicate map" below.

---

## 1. Executive summary

### Overall health
Engineering hygiene is good: **all three apps compile, lint clean, and 1,296 automated tests pass**, RLS is enabled on all 109 tables, every SECURITY DEFINER function sets `search_path`, no secret is in the tree or in git history (95 commits scanned), signature verification is a correct constant-time HMAC, all 9 edge functions require a JWT, and every one of ~190 admin server actions is permission-guarded.

The problems are not compile-time problems. They are **(a) money-path design flaws** that let a student get paid products/wallet cash without paying (or being paid twice), **(b) a permissive "owner can update any column of own row" pattern** on several tables, **(c) app-level flows that break silently** (login shows no error, payment errors mislabelled, logout leaks the last user's data), and **(d) a product that is not yet store-shaped** (no crash reporting, fake language list, half dark mode, unset EAS config).

### Launch-readiness verdict: **NOT READY** (Ready after fixes — Batch 1 + Batch 2 are mandatory)
Reason: a payment bypass (PAY-01/DB-01) and a wallet double-credit that can be withdrawn as cash (PAY-02/DB-06, PAY-09) are exploitable by any registered student using only the public anon key and their own JWT. Take real money only after Batch 1 is fixed and deployed. Everything else is fixable in days, not weeks.

### Top 10 issues to fix before launch
| # | ID(s) | Sev | What | Why it matters |
|---|---|---|---|---|
| 1 | DB-01 / PAY-01 / MOB-19 | **Critical** | A student can `PATCH` their own **pending** `purchases` row (any column: `project_id`, `total_amount`, `razorpay_order_id`), then call verify with a valid but *different/cheaper* Razorpay triple. Verify only checks order-id binding when the column is non-null, never amount/project, and there is no unique index on `razorpay_payment_id`. | Any project + source code for the price of the cheapest payment (or one payment reused across many orders). |
| 2 | DB-06 / PAY-02 | **Critical** | Wallet top-up verify is check-then-act (no conditional update, no unique credit key). Parallel replays of one valid signature credit the wallet N times. | Free wallet money, then withdrawable (PAY-09). |
| 3 | PAY-05 / PAY-04 / MOB-01 / MOB-02 | **High** | No Razorpay webhook and no `captured/amount` re-check; the app marks an order **failed** if *anything* throws after a successful charge, and retry re-charges. | Students charged but locked out (support + refund disputes + chargebacks). |
| 4 | DB-02 / PAY-08 / PAY-09 / DB-29 | **High** | Refund request accepts client `amount`/`purchase_id` with no ownership/cap check; credit is withdrawable; withdrawal debits instantly, no KYC/minimum, 3 different balance formulas. | Cash-out rail for fraud. |
| 5 | DB-03 / DB-04 | **High** | `profiles` own-row UPDATE has no column pin; `status='blocked'` is enforced nowhere (blocked user can self-unblock; block does nothing). | Moderation is fictional. |
| 6 | DB-07 / ADM-01 | **High** | Admin role matrix is UI-only; any active admin (even `viewer`) has full write + money RPCs via PostgREST. | One stolen low-role admin session = full compromise. |
| 7 | MOB-05 | **High** | Wrong password on Login shows **no error** and clears the form (global `isLoading` unmounts the navigator). Same on Register. | Day-one first impression + support tickets. |
| 8 | MOB-06 / MOB-09 / MOB-07 / MOB-08 | **High** | No error boundary anywhere; `mapJobRow(null)` crashes Saved/Applied Jobs; logout doesn't clear React-Query cache or builder/filter/settings stores (next account sees previous user's wallet, saved jobs, builder draft). | Crashes and cross-user data exposure on shared devices. |
| 9 | DB-05 / DB-08 / WEB-01 | **High** | Hidden test cases + reference solutions are public; referral farming with multiple accounts (no minimum order, no clawback); unauthenticated judge endpoints (12 sandbox runs/request, in-memory rate limit). | Content theft, reward fraud, sandbox bill. |
| 10 | MOB-30 / UX-07 / UX-04 / UX-01 | **High/Med** | EAS config missing (env, project id, versioning → first build crashes at startup), no crash reporting/OTA, fake Marathi/Hindi language list, dark mode only on Learning. | Cannot ship or support a store build. |

### Findings count (de-duplicated by unique ID; several are the same root cause, see map)
| Area | Critical | High | Medium | Low |
|---|---|---|---|---|
| DB (RLS/storage/functions) | 1 | 7 | 18 | 13 |
| PAY (payments/edge/abuse) | 2 | 7 | 11 | 5 (+1 info) |
| WEB (website) | 0 | 2 | 7 | 18 |
| ADM (admin panel) | 0 | 1 | 7 | 4 |
| MOB (mobile crashes/functional) | 2 | 11 | 19 | 10 |
| UX (UX/UI/store) | 0 | 6 | 17 | 6 |
Totals: 39 DB + 26 PAY + 27 WEB + 12 ADM + 42 MOB + 29 UX = 175 rows. After de-duplication: **4 Critical root causes** (DB-01, DB-06, MOB-01, MOB-02) and roughly 25 High.

### Duplicate map (same root cause reported from more than one angle)
- Purchase tampering / payment reuse: **DB-01 = PAY-01 = MOB-19** (+ PAY-03, PAY-11, PAY-06).
- Wallet top-up double credit: **DB-06 = PAY-02**.
- Refund abuse: **DB-02 = PAY-08**. Withdrawal/wallet formulas: **DB-29 = PAY-09**.
- Referral farming: **DB-08 = PAY-16**.
- Judge/AI abuse: **WEB-01 = PAY-17 = WEB-08**.
- Revalidate secret compare: **PAY-23 = WEB-12**. Resume 1-year signed URL: **MOB-18 = WEB-16**.
- Admin role matrix: **DB-07 = ADM-01**. Push-permission mismatch: **MOB-26 = UX-08**.
- Custom-project price mismatch: **WEB-02 = MOB-13 = PAY-18**.

### What was checked and is fine (so you can stop worrying about it)
Razorpay HMAC (constant-time) · JWT required on all 9 edge functions · project/premium/custom-token amounts computed server-side · no `service_role`/Razorpay secret in repo, bundles or git history · `EXPO_PUBLIC_*`/`NEXT_PUBLIC_*` vars are all client-safe · SECURITY DEFINER hygiene · storage path-ownership on avatars/resumes/custom-project-uploads · `is_admin()` not spoofable · `?next=` redirect validation · JSON-LD escaping · job-apply URL scheme blocked (`javascript:`/`data:`) in the app · learning premium content gated server-side · `is_premium` self-escalation (0037) and wallet over-withdrawal (0038) fixes still hold · every admin server action is guarded.

---

## 2. Gate results (run 2026-09-19)

| Gate | mobile-app | admin-panel | website |
|---|---|---|---|
| `tsc --noEmit` | **0 errors** | **0 errors** | **0 errors** |
| lint | eslint: **0 errors, 2 warnings** (`import/no-duplicates`, `tests/unit/theme/darkContrast.test.ts:2,4`) | `next lint`: 0 / 0 | `next lint`: 0 / 0 |
| tests | jest **641 passed** (71 suites) | vitest **124 passed** (10 files) | vitest **531 passed, 12 skipped** (54 files + 1 skipped file) |
| build | `expo export --platform web` OK; main JS bundle **4.5 MB** (single chunk — large for web first load) | `next build` OK, 87.7 kB shared JS, 143 output lines of routes | `next build` OK, 88 kB shared JS |
| `npm audit` | **20**: 5 high, 15 moderate, 0 critical (image-size, js-yaml, metro chain — dev tooling) | **18**: **2 critical**, 11 high, 3 moderate, 2 low | **15**: **2 critical**, 8 high, 3 moderate, 2 low |
| `expo-doctor` | 18/20: `expo` 55.0.30 vs ~55.0.31, `expo-modules-core` installed directly (MOB-31) | — | — |

Audit detail: the 2 critical in each Next app are `next` 14.2.35 (Image Optimizer `remotePatterns` DoS, only affects self-hosted `next start`; fixed only in a major upgrade, 16.x) and `vitest` (dev-only, via `@vitest/mocker`). The "high" ones are ESLint/glob/minimatch/vite/postcss dev tooling. **No runtime dependency vulnerability is directly exploitable in a Vercel-hosted deploy**, but plan the Next 15/16 migration (also flagged in the earlier security audit). Not run: Android/iOS native builds, Lighthouse, real-device tests.

---

## 2b. Phase 0 — Project map

### 2b.1 Inventory
| Area | Inventory |
|---|---|
| **mobile-app** | 163 `*Screen/*Navigator` files; 19 navigators (`Root, Auth, ProfileSetup, Main, Drawer, BottomTab, Home, Project, Job, Placement, MyProjects, CustomProjects, Premium, Profile, Referral, Resume, Settings` + `DrawerContent`, `safeNavigation`); 25 services (`auth, profile, project, job, learning, placement, practice, resume(+Assist/Content/Design/TemplateSpecs), premium, payment, wallet, referral, customProjects, myProjects, home, settings, support, legal, academic, atsCategories`); 4 zustand stores (`auth, jobFilter, projectFilter, settings`) + builder store; `src/lib`: supabase, storage, razorpayCheckout, openApplyUrl, notify, compilerLink, personalization. Web export works at :8081. |
| **website** | 81 `page.tsx` routes (home, projects, jobs, learning/[grid]/[topic], practice/*, coding-problems, compiler, resume + `/account/resume/[id]/*`, custom-projects/* wizard, premium, referral, account/*, blog, search, legal/*, auth: login/register/forgot/reset/onboarding/logout/email-verified). 17 route handlers: `/api/{search, session, announcements, revalidate, compiler/run, coding-problems/{judge,submit}, practice/{judge,submit}, resume/{parse,assist,export/pdf,export/docx}, custom-projects/understand, auth/{verify-email,verify-recovery}}`, `/auth/callback`. |
| **admin-panel** | ~105 pages under `(panel)`: dashboard, students, projects(+sub-pages), jobs(+companies/applications), orders(+refunds/coupons/wallet-requests/transactions), reviews, referrals, cms, learning, blog, resume(+templates/ATS/AI config/shares), custom-projects, placement, notifications, reports, analytics, settings(roles/admin-users/backup/logs), activity-logs. **No route handlers** — all writes are server actions (~190) using the admin's own session (no service-role key). |
| **Supabase** | **Edge functions (9):** `create-razorpay-order, verify-razorpay-payment, create-premium-order, verify-premium-payment, create-wallet-topup-order, verify-wallet-topup-payment, create-custom-project-order (WIP), verify-custom-project-payment, delete-account` + `_shared/{razorpay, cors, client, rateLimit, academicPricing, customProjectPricing(WIP)}`. **Migrations:** mobile `0001–0116` (116 files) + admin `001–088` (88 files) — overlapping, not identical (DB-33); `mobile 0113–0116` and `admin 085–088` uncommitted/likely unapplied; `mobile-app/supabase/proposed/jobs_hide_drafts.sql` unapplied. **109 tables, all RLS-enabled**; 94 functions (59 SECURITY DEFINER). **Buckets:** `avatars, resumes, custom-project-uploads, project-files, site, admin-media`, others admin-write only. |
| **Env vars** | Mobile: `EXPO_PUBLIC_SUPABASE_URL`, `_ANON_KEY`, `_PUBLISHABLE_KEY`. Website public: `NEXT_PUBLIC_{SUPABASE_URL, SUPABASE_ANON_KEY, SITE_URL, SUPPORT_EMAIL, GA_MEASUREMENT_ID, LEGAL_ENTITY_NAME, BUSINESS_ADDRESS, GOVERNING_JURISDICTION, PLAY_STORE_URL, WHATSAPP_SUPPORT*}`; server-only: `REVALIDATE_SECRET, ANTHROPIC_API_KEY, COMPILER_PROVIDER/REQUIRE_AUTH/*, PAIZA_*, JUDGE0_*, PISTON_URL`. Admin: `NEXT_PUBLIC_{SUPABASE_URL, SUPABASE_ANON_KEY, SITE_URL, WEBSITE_URL}` + `REVALIDATE_SECRET`. Edge secrets (dashboard only): Razorpay key id/secret, service role. All public vars verified client-safe; only `.env.example` files are tracked. |

### 2b.2 Feature map (feature → screens → services → tables → functions → policies)
| Feature | Mobile screens/services | Website / Admin | Tables & RPCs | Edge fn | Key policy/risk |
|---|---|---|---|---|---|
| Auth | `src/auth/*` (Login/Register/OTP/Forgot/Reset/Onboarding), `auth.service`, `useAuthBootstrap`, `authStore` | `/login /register /forgot-password /reset-password`, `/api/auth/verify-*`; admin `(auth)/*` | `profiles`, `email_for_mobile` RPC, `blocked_users` | — | DB-03/04/25, MOB-05/15/17/32 |
| Projects marketplace | `project/*`, `project.service`, `myProjects/*` | `/projects`, admin `projects/*` | `projects, purchases, reviews, downloads, wishlist, project_files` + storage `project-files` | `create/verify-razorpay-*` | **DB-01/PAY-01**, DB-12/13/22 |
| Custom project builder | `customProjects/*` (10 wizard screens), `customProjects.service`, `useBuilderEstimate` (WIP) | `/custom-projects/*` wizard; admin `custom-projects` | `custom_project_{requests,features,pricing,platform_pricing,payments,drafts,messages,deliveries…}` | `create/verify-custom-project-payment` (WIP) | WEB-02/MOB-13/PAY-18/PAY-19 |
| Payments/wallet | `project/Payment*`, `profile/WalletScreen`, `wallet.service`, `usePayment` | `/account/wallet`; admin `orders/*` | `wallet_transactions, wallet_topup_orders, refund_requests, withdrawal_requests`, `request_withdrawal`, `admin_*` RPCs | `create/verify-wallet-topup-payment` | **PAY-02/DB-06**, PAY-08/09 |
| Premium | `premium/*`, `premium.service` | `/premium` | `premium_plans, premium_subscriptions, sync_profile_is_premium` | `create/verify-premium-payment` | PAY-07 (no expiry job), PAY-20 |
| Jobs | `jobs/*` (WIP), `job.service`, `openApplyUrl` | `/jobs`, admin `jobs/*` | `jobs, companies, applications, saved_jobs, job_alerts` | — | MOB-09/10/23/24, WEB-09, DB-13/18 |
| Placement / Learning / Practice | `learning/*`, `placement/*`, `practice/*` | `/learning /practice /coding-problems /compiler /mock-tests`, admin `learning` | `learning_*, dsa_problems, test_*, coding_submissions, prep_notes` RPCs | — (website judge routes) | DB-05/09/10/11, WEB-01 |
| Resume builder | `resume/*`, `resume.service` | `/resume`, `/account/resume/*`, export/parse/assist APIs; admin `resume/*` | `resumes, resume_versions, resume_shares, resume_templates` | — | DB-17, WEB-08/14/16 |
| Referrals | `referral/*`, `referral.service` | `/referral`, admin `referrals` | `referrals, referral_earnings, reward_settings` triggers | — | **DB-08/PAY-16** |
| Notifications | `home/NotificationScreen` | `/account/notifications` | `notifications`, `send_bulk_notification` | — | MOB-26/UX-08 (no push) |
| Account deletion | `profile/SettingsScreen`, `legal/DeleteAccountInfo` | `/delete-account` | cascade FKs | `delete-account` | PAY-15/DB-30 |
| Admin | — | `admin-panel` | `admin_users, role_permissions, admin_activity_logs` | — | **DB-07/ADM-01** |

Full per-table RLS matrix (109 tables): Appendix A.

---

## 3. Findings

Columns: ID | Severity | Status | Area | Location | Problem | Impact | Recommended fix | Effort. Paths: `M:` = `mobile-app/supabase/migrations/`, `A:` = `admin-panel/supabase/migrations/`, `F:` = `mobile-app/supabase/functions/`. Findings marked (WIP) depend on uncommitted files.

### 3.1 Phase 1 — Security: database, RLS, storage (DB-)

RLS is **enabled on all 109 tables** and **no INSERT/UPDATE/DELETE policy uses `true`**; `is_admin()` reads only `admin_users` (not spoofable); all 59 SECURITY DEFINER functions set `search_path`. The 0037 (`is_premium` pin), 0038 (wallet over-withdrawal) and 0040 (test-attempt forgery) fixes still hold. Change since the old `RLS_AUDIT.md` (covered M:0001-0089/A:001-061): its "`test_questions` SELECT = true" claim is stale (final policy `A:022:142` is gated); its `purchases` "pass" was wrong (DB-01); "storage is private" only holds after `M:0100`/`A:072` (DB-22). M:0090-0116 / A:062-088 add no new hole.

| ID | Sev | Status | Area | Location | Problem | Impact | Recommended fix | Effort |
|---|---|---|---|---|---|---|---|---|
| DB-01 | **Critical** | Confirmed (code-traced, not executed) | purchases | `M:0006_purchases.sql:62-66`; `F:verify-razorpay-payment/index.ts:64,69,90` | Owner UPDATE policy only requires `status in ('pending','failed')` in `WITH CHECK`; `project_id, total_amount, discount, coupon_code, razorpay_order_id, razorpay_payment_id` stay client-writable. No guard trigger (only `set_updated_at`, `purchases_convert_referral`, `purchases_bump_coupon` exist). Verify checks HMAC and `if (purchase.razorpay_order_id && …)` (line 64), never amount or `project_id`. Attack A: pay for a cheap project, PATCH `project_id` to an expensive one, call verify. Attack B: null `razorpay_order_id` on an expensive pending order and replay any valid triple. | Any student obtains any paid project + source files (gated on `purchases.status='success'`); can inflate `total_amount` to inflate referral reward. | `before update` trigger pinning every column except `pending→failed` + `failure_reason` (exempt `service_role`/`is_admin()`; sketch below). In verify: refuse if `razorpay_order_id` is null, fetch the Razorpay order/payment and require `amount == total_amount*100` and `captured`, make the success update conditional `.eq('status','pending')`, add unique index on `razorpay_payment_id`. | S |
| DB-02 | High | Confirmed | refunds | `A:007:84-86`, `:181-226` | `refund_requests_insert_own` lets requester set `amount` and `purchase_id`; nothing checks purchase is theirs, `success`, or `amount<=total_amount`. `admin_process_refund` credits `r.amount` and flips the purchase to `refunded`; a 2nd refund on the same purchase pays again. Credit is withdrawable via `request_withdrawal` (`M:0038:52-55`). | Arbitrary wallet credit then cash-out once an admin clicks approve; can revoke another user's access. | In approve branch lock purchase and require `p.user_id=r.user_id`, `p.status='success'`, `r.amount<=p.total_amount`; tighten insert `WITH CHECK`; partial unique index on `purchase_id` for pending/approved requests. | S |
| DB-03 | High | Confirmed | profiles | `M:0001:52-55`; only pin `M:0037:86-102` (`is_premium`) | Own-row UPDATE has no column list; no column grants/revokes anywhere. Writable: `status`, `blocked_*`, `admin_notes` (`A:002:32-41`), `email`, `mobile_number`, `referral_code`. | Blocked user PATCHes `status='active'` and unblocks self; moderation data tamperable; `email` diverges from auth email. | Second guard trigger restoring those columns to `old.*` unless service role/admin (same pattern as 0037). | S |
| DB-04 | High | Confirmed | blocked users | `A:002:32-35`; `admin-panel/src/app/(panel)/students/actions.ts:134`; `F:_shared/client.ts:32-44` | `profiles.status='blocked'` is read by no policy, function or edge function; admin action only writes the flag, no `ban_duration`. | "Block user" does nothing — blocked users keep buying, withdrawing, posting. | `is_active_user()` ANDed into write policies/RPCs; call `auth.admin.updateUserById(id,{ban_duration})` from block action; check `status` in edge `getUser`. | M |
| DB-05 | High | Confirmed | judge data | `A:025:105` (`dsa_problems_select_public`); `A:044:344-` & `A:073:30` (`*_run_cases`, granted to anon); `website/src/app/api/practice/judge/route.ts:56,101` | Table policy exposes `test_cases` and `solution_code` for every published free problem; run-cases RPCs return every hidden input/expected output to `anon`; judge route calls them with the anon key. | Hidden test cases + reference solutions are public (content theft, hard-code-to-pass). | `revoke select (test_cases, solution_code)` on `dsa_problems` from anon/authenticated (serve safe columns via RPC); revoke EXECUTE on run-cases from anon/authenticated and call from a server-side service-role client. | M |
| DB-06 | High | Confirmed | wallet top-up | `F:verify-wallet-topup-payment/index.ts:52,62,66`; `M:0020:41-45` | Check-then-act: reads `status==='paid'`, unconditional update, then credit insert; no unique key on the credit. Parallel replays of one valid signature each insert a credit. | Double/triple credit of real money, then `request_withdrawal`. | `wallet_transactions.topup_order_id` + unique index where `category='added_money'`; settle in one RPC `update … where status='created' returning`, stop on 0 rows. | S |
| DB-07 | High | Confirmed | admin authorization | `A:001:91-109`; every `*_admin_all` policy e.g. `A:002:100-107` | `has_permission()`/`role_permissions` are used by zero policies/RPCs. Any active `admin_users` row (incl. `viewer`/`support`) has full write via PostgREST, incl. `admin_adjust_wallet`, `admin_process_refund/withdrawal`, `send_bulk_notification`, `custom_project_set_status`. | Role matrix is UI-only; stolen low-role session = full compromise. | Use `has_permission(auth.uid(),'<module>','edit')` in write policies and RPCs; limit money RPCs to `super_admin`/`admin`. | M |
| DB-08 | High | Confirmed (logic) | referrals | `M:0026:82-125,137-173`; `M:0021:228-270`; `M:0001:76-92` | Code comes from signup metadata; only `referrer = new.id` is rejected. First successful purchase converts with no minimum order and no `reward<=price`. Percent mode reads `total_amount` (editable, DB-01). `min_payout`/`bonus_validity_days` never read. Refund leaves bonus. `referred_user_id` is `on delete set null` so create→convert→delete keeps reward. With `reward_on_signup=true` it pays at signup. (Idempotency itself is sound.) | Multi-account farming: N accounts × cheapest purchase = N × ₹100, withdrawable, no KYC/min/cooldown. | Minimum order and `reward<=0.5*total`; phone-verify + payer dedupe; pay after `bonus_validity_days` and only if not refunded; cancel referral in refund RPC; daily cap. | M |
| DB-09 | Med | Confirmed | mock tests | `M:0040:22-79`; `A:063:323-`; `A:022:142` | `submit_test_attempt` checks only that the test exists (no status/visibility/premium/`attempts_allowed`); `time_taken` client-supplied; `correct_index` readable on every published test. | Scores/leaderboards gameable; draft/premium tests scorable. | Add gates in both RPCs; move keys to a no-client-SELECT table and serve questions through a stripping RPC. | M |
| DB-10 | Med | Confirmed | premium bypass | `A:063:254-267`, `:278-313` | `practice_test_questions` is SECURITY DEFINER, granted to anon, samples a pool ignoring `is_premium`, returns `correct_index` + `explanation`. | Anonymous read of premium question/answer bank. | Exclude premium owner tests/topics unless `current_user_is_premium()`/admin. | S |
| DB-11 | Med | Confirmed policy; live data unknown | prep_notes | `M:0041:36-40`; `A:016:132`; `M:0028:24,34` | Table has `is_premium` + `content`, but both SELECT policies test only `is_published`. | Premium notes readable by anon. | Add premium gate or drop legacy table. | S |
| DB-12 | Med | Confirmed | reviews | `M:0004:40-55`; `A:008:162-168` | `reviews_select_public` = `true` (hidden reviews stay readable); `reviews_update_own` has no column pin (moderated user PATCHes `status` back to `published`); insert needs no purchase. | Moderation bypass, rating manipulation. | SELECT gated on `status='published'` or owner/admin; pin `status` by trigger; insert requires successful purchase. | S |
| DB-13 | Med | Confirmed | drafts public | `M:0041:46-54`; `A:016:109,116`; `A:003:60`; `A:004:12`; unapplied `mobile-app/supabase/proposed/jobs_hide_drafts.sql` | `projects_select_anon` and `jobs_select_anon` are `true`; no policy filters `status`. | Draft projects/jobs are public. | Apply the proposed file and mirror it for projects. | S |
| DB-14 | Med | Confirmed | coupons | `A:007:33` | Whole `coupons` table (codes, limits, usage) anon-readable. | Codes scrapeable. | Drop policy or expose active coupons via view. | S |
| DB-15 | Med | Confirmed | referrals | `M:0021:97-100` | Any authenticated user can select all successful referrals (`referrer_id, referred_user_id, reward_amount`). | Social graph + earnings exposed. | Drop; add `referral_leaderboard()` RPC. | S |
| DB-16 | Med | Confirmed | profiles privacy | `A:002:38-41`; `M:0001:42-44` | `admin_notes`, `blocked_reason` live in `profiles`; student reads own row in full. | Staff notes visible to the student. | Move to admin-only table or revoke column SELECT. | S |
| DB-17 | Med | Confirmed policy; needs victim uuid | resume shares | `M:0060:47-56`; `M:0063:25` | Insert/update check only `auth.uid()=user_id`; `resume_id` not checked to be caller's; `token`/`view_count` client-settable; `get_shared_resume` is anon. | Leaked resume uuid becomes a public link to another user's PII. | `WITH CHECK` require caller owns resume; pin `token`/`view_count`. | S |
| DB-18 | Med | Confirmed | applications | `M:0012:76-79` | Insert may set `status='hired'`, use another user's `resume_id`, target closed/draft jobs. | Forged pipeline status. | Require `status='in_review'`, owned resume, open job. | S |
| DB-19 | Med | Confirmed | coding_submissions | `A:044:152-155` | Owner may INSERT `verdict='accepted'` with arbitrary `passed/total` and unbounded `source_code`. | Forged solved state, table bloat. | Drop policy (service role in route) or forbid `accepted` + cap length. | S |
| DB-20 | Med | Confirmed | contact form | `website/supabase/migrations/0001_contact_submissions.sql:57-100` | Rate-limit key is client-supplied `p_client_key`; rotate to defeat; omit → shared key `'anon'` so 5 calls lock out all anon users for an hour; limits table never purged. | Spam flood + form DoS. | Derive key server-side, cap length, purge old windows, global cap. | S |
| DB-21 | Med | Confirmed | storage limits | `M:0029:13-52`; `M:0033:590-604`; `A:003:80`, `A:006:95`, `A:008:199`, `A:009:110`, `A:012:14` | No `file_size_limit`/`allowed_mime_types` on any bucket; `avatars_public_read` lets anyone list every user folder. (Path-ownership checks are correct.) | Storage/bandwidth abuse, arbitrary content on public bucket, uuid enumeration. | Set limits on `avatars`, `resumes`, `custom-project-uploads`; replace listing policy. | S |
| DB-22 | Med | Suspected (live apply state) | project-files | `A:003:80-82` created public; fix `M:0100:41`, `A:072:41` | Bucket created public; only 0100/072 makes it private with purchaser-only policy. | If 0100 is not live, paid source code is public by URL. | Check (SQL 7 in section 6); apply 0100 if needed. | S |
| DB-23 | Med | Suspected | deliveries | `M:0033:606-609` | `cp_deliveries_owner_read` folder-only, no `status='delivered'` gate (table policies do gate). | Early/unpaid access to staged files. | Add request-status gate. | S |
| DB-24 | Low | Confirmed | uploads | `M:0033:600-604` | `cp_uploads_owner_all` is FOR ALL: owner can delete/overwrite spec files after submission. | Evidence tampering. | Split; restrict delete/update to `status='new'`. | S |
| DB-25 | Low | Confirmed | enumeration | `M:0001:61-70` | `email_for_mobile` (anon) maps phone → email. | PII enumeration. | Return boolean or rate-limited edge fn. | S |
| DB-26 | Low | Confirmed | admin oracle | `A:001:55,65-68,91,111-112` | `is_admin(uid)` / `has_permission(uuid,…)` anon-executable with any uid. | Role oracle (needs uuid). | Argument-less `is_admin()`; revoke `has_permission` from anon. | S |
| DB-27 | Low | Confirmed | search_path | `M:0062:397,172,341` | `restore_resume_version`, `compute_ats_breakdown`, `match_resume_to_jd` invoker functions without `search_path`. | Theoretical hijack (RLS still applies). | `alter function … set search_path=public`. | S |
| DB-28 | Low | Suspected | grants | `M:0021:116`; `M:0026:44,82,137`; `M:0001:76`; `M:0061:39` | Trigger fns and `referral_reward_for` have no revoke; elsewhere only `revoke … from public`, leaving Supabase's default anon grant. Admin RPCs still guarded by `is_admin()`. | Defence-in-depth gap. | Explicit `revoke from anon` on admin RPCs/helpers. | S |
| DB-29 | Med | Confirmed | wallet logic | `M:0038:52-55`; `A:002:152-155`; `A:007:243-244,112-113`; `M:0021:241-259` | Three different balance formulas; two parallel withdrawal paths (`withdrawal_requests` insert has no balance check); `sync_referral_totals` DELETEs ledger rows (can go negative after cash-out); no min payout/KYC. | Inconsistent balances, possible double payout, ledger not append-only. | One `wallet_balance()`; reversal rows not DELETE; single withdrawal path; enforce `min_payout`. | M |
| DB-30 | Med | Confirmed | account deletion | `M:0020:5`; `M:0006:5`; `F:delete-account/index.ts:14-40` | All FKs cascade/set null (nothing orphaned), but cascade deletes `purchases`, `wallet_transactions`, `legal_consents`, `custom_project_payments` — financial/consent records. | Loss of audit trail / tax records. | Anonymise and retain (or archive) before deletion. | M |
| DB-31 | Low | Suspected | referral admin path | `M:0021:228-270`; `A:002:120-127` | `sync_referral_totals` is invoker; admins have no INSERT on `wallet_transactions`/`referral_earnings` → manual approval likely errors. | Fragile money path. | SECURITY DEFINER + `search_path`. | S |
| DB-32 | Low | Confirmed | 0037 scope | `M:0037:100-102`; `M:0001:47-49` | `is_premium` pin is BEFORE UPDATE only; if a profile row is absent a user can insert own row with `is_premium=true`. | Latent premium self-grant. | Trigger `before insert or update`, or drop `profiles_insert_own`. | S |
| DB-33 | Med | Confirmed hygiene; live effect unknown | migration trees | `A:002:65-107`; `A:013:29-57`; `A:009:69-84`; `M:0033` guarded blocks | Trees overlap and are not identical: `M:0090` lacks admin policies that `A:062` has; `M:0091/A:063`, `M:0102/A:074`, `M:0103/A:075` differ. Bulk policies guarded by `to_regclass` so a wrong order silently skips them. | Silently missing admin policies; drift between environments. | One ordered tree; hard `raise exception` on missing prerequisites; CI applies chain to empty DB and runs SQL 3/4 of section 6. | M |
| DB-34 | Low | Confirmed | hygiene | `git status`; `RLS_AUDIT.md` | `M:0113-0116`, `A:085-088`, `proposed/`, edge fn change uncommitted; audit doc stops at 0089/061. No DROP TABLE/TRUNCATE anywhere; new migrations additive. | Not reviewable/revertible from git. | Commit, stage-apply, refresh doc. | S |
| DB-35 | Low | Confirmed | own-row UPDATE | `M:0023:57-60`; `M:0013:73-76`; `M:0024:84`; `M:0014:96` | Owners can change any column of own `notifications`, `job_alerts`, preferences, résumé rows. | Cosmetic. | Column grants where it matters. | S |
| DB-36 | Low | Confirmed | public config | `A:009:35`; `M:0026:38` | `site_settings` (incl. `admin_email`) and `reward_settings` anon-readable. | Leaks admin email and referral rules used for farming. | Public view/RPC with public fields only. | S |
| DB-37 | Low | Confirmed | downloads | `M:0007:36-39` | Owner may insert download rows without a purchase. | Analytics pollution. | Require successful purchase. | S |
| DB-38 | Low | Confirmed | referral code | `M:0021:116-140` | Code = name prefix + 2 digits (guessable). | Attach signups to a known person. | Random bytes. | S |
| DB-39 | Low | Confirmed | number squatting | `M:0001:30-32` with DB-03 | User can set own `mobile_number` to a victim's unregistered number. | Registration DoS. | Pin after OTP verification. | S |

DB-01 guard-trigger sketch (do not apply blindly; test with the mobile `markOrderFailed` path — the client legitimately writes `purchases` only at `payment.service.ts:81`, `status='failed'` + `failure_reason`):
```sql
create function public.protect_purchase_fields() returns trigger language plpgsql set search_path=public as $$
begin
  if current_user in ('service_role','supabase_admin','postgres') or public.is_admin(auth.uid()) then return new; end if;
  if old.status='pending' and new.status='failed' then null; else new.status:=old.status; new.failure_reason:=old.failure_reason; end if;
  new.user_id:=old.user_id; new.project_id:=old.project_id; new.price:=old.price; new.platform_fee:=old.platform_fee;
  new.discount:=old.discount; new.total_amount:=old.total_amount; new.coupon_code:=old.coupon_code;
  new.razorpay_order_id:=old.razorpay_order_id; new.razorpay_payment_id:=old.razorpay_payment_id;
  new.purchased_version:=old.purchased_version; return new;
end $$;
```

### 3.2 Phase 1 — Security: payments, edge functions, secrets, abuse (PAY-)

Verified good: HMAC-SHA256 over `order_id|payment_id`, constant-time compare (`F:_shared/razorpay.ts:58-92`); `verify_jwt=true` for all 9 functions (`F:config.toml:9-35`) plus in-code `getUser()`; project, premium and custom-project token amounts computed server-side (token is a hard-coded constant `create-custom-project-order/index.ts:51-55,187`, WIP file). Secrets scan of working tree + 95 commits: only `.env.example` placeholders/docs; `mobile-app/src/lib/supabase.ts:32-33` actively rejects `sb_secret_`/`service_role` keys.

| ID | Sev | Status | Area | Location | Problem | Impact | Recommended fix | Effort |
|---|---|---|---|---|---|---|---|---|
| PAY-01 | **Critical** | Confirmed (code-traced, not executed) | payment reuse | `M:0006_purchases.sql:62-66`; `F:verify-razorpay-payment/index.ts:64` (order binding only if column non-null); no unique index on `razorpay_payment_id` | Same root as DB-01: PATCH own pending `purchases.razorpay_order_id` to null, then verify with a cheap valid triple (e.g. a ₹10 top-up). | One cheap payment unlocks any number of products. | See DB-01; require non-null order match; unique indexes on `razorpay_payment_id` in all four payment tables. | M |
| PAY-02 | **Critical** | Confirmed | top-up double credit | `F:verify-wallet-topup-payment/index.ts:52-73` | Check-then-act; no `where status<>'paid'`; parallel calls with one valid triple credit twice; `request_withdrawal` cashes out. | Free withdrawable money. | See DB-06 (atomic security-definer settle function + unique index). | S |
| PAY-03 | High | Confirmed | status regression | `M:0006:62-66` | UPDATE policy has no old-status restriction: a `success` purchase can be flipped back to `pending`/`failed`; sales-count/referral side effects re-fire on re-verify. | Duplicate sales counts, duplicate referral events. | `using (… and status='pending')` or move transition into an RPC. | S |
| PAY-04 | High | Confirmed in code; dashboard unknown | capture check | all four verify functions | No verify function calls Razorpay `GET /payments/{id}` to check `captured`, `order_id`, `amount`, `currency`. If auto-capture is off, an authorised-only payment grants access. | Access granted for uncaptured/refunded payments. | Add payment fetch in `_shared/razorpay.ts`; require `captured` + amount/currency match. | S |
| PAY-05 | High | Confirmed | no webhook | whole repo | No `razorpay-webhook` function and no reconciliation. If the app dies after payment, money is captured but purchase/premium/top-up/token stays pending. | Paid-but-locked-out users; manual support. | `razorpay-webhook` (verify `X-Razorpay-Signature`, handle `payment.captured`/`order.paid`) routed through the same atomic fulfilment functions; reconcile job for old pending orders. | M |
| PAY-06 | High | Confirmed | non-idempotent verify | `F:verify-razorpay-payment/index.ts:434-473`; `F:verify-custom-project-payment/index.ts:473-536` | Read status → blind update; side effects (sales count, wallet debit row, notification, admin inbox row) run per call; side-effect errors ignored. | Duplicates under concurrency/retry. | Flip + side effects in one SQL function guarded by `where status<>'success'`. | M |
| PAY-07 | High | Confirmed | premium never expires | `sync_profile_is_premium` fires only when a subscription row changes; no cron/expiry job found | `auto_renew=true` stored but nothing renews or expires. | Premium is effectively lifetime. | Scheduled expiry job or period check in gating view (SQL 12 in section 6 shows whether any cron job exists). | S |
| PAY-08 | High | Confirmed | refunds | `A:007:181-225` | See DB-02: client-chosen `amount`/`purchase_id`, no ownership/cap/status check; multiple approvals; credit is withdrawable `cashback`. | Fraud cash-out. | See DB-02. | M |
| PAY-09 | High | Confirmed | withdrawals | `request_withdrawal`; `admin_process_withdrawal`; `withdrawal_requests` | Withdrawal debits instantly with no approval queue; `admin_process_withdrawal` reads a table no client writes; two balance formulas; top-up money is withdrawable → wallet is a cash-out rail with no KYC. | Money-laundering/fraud risk (and regulatory: stored-value). | Pending withdrawal requests + admin approval; one `wallet_balance()`; separate withdrawable funds from top-up funds; legal review of stored-value rules. | L |
| PAY-10 | Med | Confirmed | double orders | verify + create functions | Each tap creates a new pending purchase + Razorpay order; two orders paid in parallel hit the unique success index and return 500, leaving a double charge with no auto-refund. Custom-project retries duplicate requests. | Double charges. | Reuse a recent pending order or idempotency key; auto-refund on unique violation. | M |
| PAY-11 | Med | Confirmed | binding skipped | all four verify functions | Order binding skipped when linked order id is null; an invalid signature sets `failed`, yet a later valid verify still succeeds. | Weak state machine. | Require non-null link + allowed transitions. | S |
| PAY-12 | Med | Confirmed | coupons | `F:create-razorpay-order/index.ts:303-313` | Coupons read from `offer_banners` and percent parsed from free text by regex; the `coupons` table (expiry, `max_uses`) is ignored; no per-user/global limit. | Coupon abuse / wrong discount. | Resolve via security-definer function with atomic usage counting. | M |
| PAY-13 | Med | Confirmed | error leakage | every function catch; `F:_shared/razorpay.ts:46-48` | 500s return `err.message`, embedding raw Razorpay responses and Postgres errors (schema leakage). | Information disclosure. | Generic message + correlation id. | S |
| PAY-14 | Med | Confirmed | rate limit | `F:_shared/rateLimit.ts:204-207` | Fixed-window limiter fails open; verify functions unlimited; no daily cap on pending orders; rows created before Razorpay call. | Order-table spam. | Cap pending orders, rate-limit verify, fail closed for delete. | S |
| PAY-15 | Med | Confirmed | account deletion | `F:delete-account/index.ts:28-59` | Hard-deletes purchases, payments, wallet transactions, paid custom requests, subscriptions; no wallet-balance/in-progress-work/active-premium check; no re-auth or grace period. | Financial-record loss; accidental deletion. | Anonymise; block/warn on those states; recent re-auth; soft delete. | M |
| PAY-16 | Med | Confirmed | referral farming | `M:0021:180`; `reward_on_signup` | Same as DB-08. | Reward fraud. | See DB-08. | M |
| PAY-17 | Med | Confirmed | website abuse | `website/src/lib/compiler/rateLimit.ts`; `COMPILER_REQUIRE_AUTH=false` default | Limiters are in-memory `Map` (per-lambda, ineffective on serverless); compiler unauthenticated by default; free accounts hit Anthropic-backed `resume/assist` and `custom-projects/understand`. | Sandbox/API cost. | Durable limiter (Postgres `check_rate_limit`/KV), daily AI budgets, require auth. | M |
| PAY-18 | Med | Confirmed (WIP) | price manipulation | `F:create-custom-project-order/index.ts:147-160` | `aiRecommendedFeatureIds` read from the user-writable draft; exempts features from the Academic override price and can lower `feature_total`. | Lower quote than intended (token itself is fixed). | Recompute server-side or drop exemption. | S |
| PAY-19 | Med | Confirmed (WIP) | input validation | `F:create-custom-project-order/index.ts` | No length caps on text; `projectImagePath` and `referenceFiles[].path` not checked against `<uid>/` prefix (can reference another user's object); unpaid requests stored before payment. | Storage/PII cross-reference, clutter. | Cap lengths, enforce path prefix, purge unpaid. | S |
| PAY-20 | Med | Confirmed | premium stacking | `F:create-premium-order/verify-premium-payment` | Second purchase creates a second active row from `now` (no extension); `auto_renew` stored true with no renewal. | User loses paid days; misleading flag. | Extend from `current_period_end`; set `auto_renew=false`. | S |
| PAY-21 | Low | Confirmed | CORS | `F:_shared/cors.ts:3` | `*`. | Low (Bearer auth). | Allow-list origins. | S |
| PAY-22 | Low | Confirmed | least privilege | all functions | Service-role client used even for reads RLS allows. | Larger blast radius. | User-scoped client for reads; narrow RPCs for `service_role` only. | M |
| PAY-23 | Low | Confirmed | revalidate secret | `website/src/app/api/revalidate/route.ts:44` | `!==` compare, no rate limit. | Timing attack (impractical). | `timingSafeEqual`. | S |
| PAY-24 | Low | Confirmed | migration replay | `M:0020_wallet.sql:141-144` | Re-running recreates the insert policy that `0038` dropped. | Re-opens direct wallet insert if replayed. | Idempotent drop in a later migration. | S |
| PAY-25 | Low | Confirmed | ignored errors | verify-razorpay-payment | `increment_project_sales_count` and wallet insert errors unchecked; writes a `project_purchase` debit for money never credited to wallet. | Misleading ledger. | Check errors; remove the debit. | S |
| PAY-26 | Info | Confirmed | secrets | working tree + 95 commits | Clean. | — | Add gitleaks to CI. | S |

### 3.3 Website (WEB-) and Admin panel (ADM-) — security, crashes, functional

Verified good: every one of ~190 admin server actions calls `requirePermission`/`requireAdmin`; a non-admin Supabase user is bounced from panel pages; `admin_users`/`role_permissions` writes restricted to super_admin by RLS; `?next=` redirects validated (`safeInternalPath`); JSON-LD escaped; the only `dangerouslySetInnerHTML` is Prism output; no service-role key in either app; `lib/actions/*` re-check ownership; `applyToJobAction` now requires an active job (WIP improvement).

| ID | Sev | Status | Area | Location | Problem | Impact | Recommended fix | Effort |
|---|---|---|---|---|---|---|---|---|
| ADM-01 | High | Confirmed | RBAC decorative | `A:002:~96-125`, `A:007:181-250`, `A:001:91` | RLS and admin RPCs check only `is_admin()`; the roles matrix exists only in server actions. A low-role admin can call wallet/refund/withdrawal/delete/bulk-push RPCs with their own JWT. | Same as DB-07. | Add `has_permission()` to RLS + RPCs. | L |
| WEB-01 | High | Confirmed | judge abuse (prior W-02, open) | `website/src/app/api/coding-problems/judge/route.ts:44`, `api/practice/judge/route.ts:64-80`, `lib/compiler/rateLimit.ts`, `api/compiler/run/route.ts:58` | No auth on either judge route; each request fans out to 12 sandbox runs; limiter is per-instance memory keyed on spoofable `x-forwarded-for`; `COMPILER_REQUIRE_AUTH` defaults off; `coding-problems/judge` ignores the Bearer token. | Sandbox quota exhaustion/cost. | Require session, set `COMPILER_REQUIRE_AUTH=true`, shared-store limiter counting executions. | M |
| WEB-02 | High | Confirmed (WIP) | pricing parity — **known mismatch, still open** | `website/src/lib/customProjects.ts:210-215,337-370`; `F:_shared/customProjectPricing.ts`; `F:create-custom-project-order/index.ts` | Website has zero references to `included_in_levels`; `computeEstimate` charges catalog price for features admin marks "included". Mobile and the (uncommitted) edge function charge 0 for them. Mobile hard-codes `aiRecommended=false`; edge fn honours draft AI ids. Token amounts 1500/3000/6000 agree across web, mobile, edge. | Website shows a higher estimate than the stored `estimated_total` once migration 087/0115 is live; "included" never shows on web. | Port `priceFeatures`/`splitFeaturesFor` to a shared pure module, select `included_in_levels`, reuse the mobile parity test. | M |
| ADM-02 | Med | Confirmed | CSV injection | `admin-panel/src/components/ui/ExportButton.tsx:~25-33`, `reports/ReportExport.tsx:~12-24` | Cells starting `= + - @` not neutralised; exports include student-controlled names/emails/messages; `.xls` export worsens it. | Formula injection when staff open exports. | Prefix with `'`. | S |
| ADM-03 | Med | Confirmed | unsafe URLs / stored XSS | Admin writes: `cms/actions.ts` (banner `target_url`), custom-projects `demo_url`, `projects/actions.ts:254`, `jobs/actions.ts` (`apply_url`). Rendered: `website/src/app/page.tsx:89`, `custom-projects/my-projects/[id]/page.tsx:229`, `learning/[gridSlug]/[topicSlug]/page.tsx:139,149`, `jobs/[id]/page.tsx:124` | No scheme check on write or render; only `jobs.apply_url` has a DB `https?://` CHECK (migration 085, **not applied**). CSP has `script-src 'unsafe-inline'`, so a `javascript:` href would execute. | Compromised/malicious editor → script in visitors' browsers. | Validate `https?://` or `/` in actions; render-time `safeHref()`; DB CHECKs. | S |
| ADM-04 | Med | Confirmed | dangerous actions | `admin-panel/src/app/(panel)/students/[id]/wallet/page.tsx:59`, `referrals/wallet/WalletAdjustPanel.tsx:85`, `students/actions.ts`, `referrals/actions.ts:53` | Wallet adjustment is one click: no confirm, no cap, no required reason, description not logged; shares `students:edit`. (Refund/withdrawal approvals do have a two-step confirm + note.) | Accidental/malicious balance change. | Confirm modal, cap, required reason, separate permission. | S |
| ADM-05 | Med | Confirmed | false audit trail | `admin-panel/src/app/(panel)/students/actions.ts:105-118` (`setStudentPremium`), `createStudent` premium checkbox; `M:0037` | 0037 pins `is_premium`; `setStudentPremium` (no UI caller found) returns ok and logs `premium_grant` with no effect; the create-student Premium checkbox is silently ignored. | Admin believes premium was granted; log lies. | Delete both or grant via `premium_subscriptions`. | S |
| WEB-03 | Med | Confirmed (WIP) | deploy order | `website/src/lib/jobsActive.ts`, `lib/cache.ts`; `admin-panel/src/lib/custom-projects/queries.ts` | Uncommitted code queries `application_deadline`, `included_in_levels`, `is_included`. If migrations 085-088 (mobile 0113-0116) are not applied, errors are swallowed and jobs/admin feature catalog render **empty**. Migration 086 `update jobs set title=title` touches every job's `updated_at`. | Empty Jobs page on prod after deploy. | Apply SQL **before** deploying the WIP. | S |
| WEB-04 | Med | Confirmed | token GET side effects | `website/src/app/api/auth/verify-recovery/route.ts`, `verify-email/route.ts` | A cross-site GET consumes the token and sets the session cookie (login-CSRF). (Rest of the reset flow is sound: server `verifyOtp`, signOut after reset.) | Login CSRF. | Require same-origin `Sec-Fetch-Site` or POST. | S |
| WEB-05 | Med | Confirmed (prior W-01, open) | wallet balance wrong | `website/src/app/account/wallet/page.tsx:11-18` | Balance summed from only the 50 newest rows; disagrees with the account dashboard. | Wrong money figure shown to users. | Read from `sum`/RPC. | S |
| WEB-06 | Med | Confirmed (prior W-04, open) | swallowed DB errors | `website/src/app/account/{wallet,purchases,applications,notifications,saved-jobs,saved-projects,referral}/page.tsx`, `lib/cache.ts` | No `error` branch: a DB failure renders "No X yet" or ₹0. | Users think data is lost. | Handle `error`; `account/error.tsx`; throw inside cached catalog reads. | M |
| WEB-07 | Med | Confirmed (prior W-05, open) | search input | `website/src/lib/cache.ts:183,216-217` | `q`/`location` go raw into `ilike` and the cache key (wildcards, unbounded cache entries). | Cache/DB abuse. | `sanitizeSearchTerm`. | S |
| WEB-08 | Med | Confirmed (prior W-07, open) | AI cost | `website/src/lib/resumeBuilder/aiAssist.ts:40-96`, `api/custom-projects/understand/route.ts` | Failed (billable) Anthropic calls not logged against daily cap; `understand` has no daily cap; per-instance limiters. | Anthropic bill spike. | Log before calling; daily cap; shared limiter. | S |
| ADM-06 | Med | Confirmed | admin users | `admin-panel/src/app/(panel)/settings/actions.ts:256-270` | `status` not validated; nothing prevents self-demotion/suspension or removing the last super_admin. | Admin lock-out. | Validate + guards. | S |
| ADM-07 | Med | Confirmed | headers | `admin-panel/next.config.mjs` | No CSP, X-Frame-Options, HSTS, nosniff, Referrer-Policy on the admin app. | Clickjacking of the admin panel. | Copy the website's headers. | S |
| ADM-08 | Med | Confirmed | propagation lag | `admin-panel/src/app/(panel)/blog/actions.ts:97-105` is the only caller of `/api/revalidate`; website TTLs `jobs/[id]/page.tsx:15` (300 s), `cache.ts` (2–5 min) | Jobs/projects/banners/learning/custom-feature edits reach the website only after the TTL (2–10 min); closing a job stays visible on the web meanwhile. Mobile reads live data. | Stale website after admin changes. | Shared `revalidateWebsite(tags)` called from those actions. | M |
| WEB-09 | Med | Confirmed | job labels (Fresher/Experienced) | `website/src/app/jobs/[id]/page.tsx:94`, `lib/cache.ts:157`, `app/jobs/page.tsx`; `mobile-app/src/services/job.service.ts:85,135`; `jobs/FilterJobsScreen.tsx:11`; `admin-panel/src/lib/jobs/constants.ts` | Admin now requires `experience_level` (Fresher/Experienced) and `work_mode` with DB CHECKs. Website shows only free-text `experience`; no badge, no filter. Mobile shows the badge and filters. No external-apply click tracking on the website. | Website/app inconsistency for the main student filter. | Add `experience_level`, `work_mode`, `category` to `JOB_LIST_FIELDS`, badge + filter chip. | M |
| WEB-10 | Low | Confirmed | apply_url render | `website/src/app/jobs/[id]/page.tsx:91,122-131` | Raw `href` (has `rel="noopener noreferrer"`); safe only if the DB CHECK is applied. | Depends on 085. | `safeHttpUrl`. | S |
| WEB-11 | Low | Confirmed | decorative admin field | `admin-panel/src/app/(panel)/custom-projects/actions.ts:586-604` | `token_amount` editable but web/mobile/edge hard-code 1500/3000/6000 (edge only warns on mismatch). | Admin edit has no effect. | Remove field or read everywhere. | S |
| ADM-09 | Low | Confirmed (WIP) | feature form | `custom-projects/actions.ts:~219-236,438` | Bulk `assign_types` leaves stale `included_in_levels`; `updatePricingRow` accepts negative/NaN prices. | Bad pricing data. | Prune on type change; validate ≥0. | S |
| ADM-10 | Low | Confirmed | silent success | `students/actions.ts:34-75` | If `signUp` returns an obfuscated existing user, the profile update matches no rows yet action logs success and redirects. | False success. | Check update result / `identities`. | S |
| ADM-11 | Low | Confirmed | admin login | `admin-panel/src/actions/auth.ts` | No app-level throttle; `origin` header used for `redirectTo`. (Reset response is generic; password min 10.) | Brute force / host-header redirect. | Throttle; fixed site URL. | S |
| ADM-12 | Low | Confirmed | audit log | `orders/actions.ts:168` | `decideWithdrawal` logs module `referrals` under `orders` permission; thin details on bulk/wallet entries. | Weak forensics. | Add ids/descriptions. | S |
| WEB-12 | Low | Confirmed | revalidate | `website/src/app/api/revalidate/route.ts:44` | Non-constant-time compare; `path` unbounded. | Minor. | `timingSafeEqual`; allow-list paths. | S |
| WEB-13 | Low | Confirmed | CORS | `api/resume/assist/route.ts:28`, `resume/parse/route.ts:22` | `Access-Control-Allow-Origin: *` on Bearer-authenticated routes. | Minor. | Restrict origins. | S |
| WEB-14 | Low | Confirmed | resume parse | `api/resume/parse/route.ts`, `lib/resumeBuilder/fileExtraction.ts` | 8 MB cap, auth, per-user limit exist; no decompressed-size cap, PDF page cap or timeout; type detection trusts name/MIME. | Zip-bomb / heavy-PDF DoS. | Magic bytes, page/text caps, timeout. | M |
| WEB-15 | Low | Confirmed (prior W-16) | resumeId | `api/resume/assist/route.ts:47-104` | Not ownership-checked; only written to a log row. | Log pollution. | Verify or drop. | S |
| WEB-16 | Low | Confirmed (prior W-09) | signed URL | `website/src/lib/actions/jobs.ts:127`, `lib/resume.ts:19` | 1-year signed URL of a private resume stored in DB (same as MOB-18). | Long-lived PII link. | Store path; sign on demand. | M |
| WEB-17 | Low | Confirmed (prior W-08) | error boundaries | `website/src/app/` | No `global-error.tsx` or `account/error.tsx` (`error.tsx`, `not-found.tsx` exist). | Ugly failure page. | Add both. | S |
| WEB-18 | Low | Confirmed (prior W-14) | sitemap | `website/src/app/sitemap.ts:102-105` | `new Date(updated_at)` unguarded → possible RangeError. | Sitemap 500. | Guard + cache. | S |
| WEB-19 | Low | Confirmed (prior W-10) | learning URLs | `learning/[gridSlug]/[topicSlug]/page.tsx:137-155` | Unfiltered `file_url`/`video_url`. | See ADM-03. | `safeUrl`. | S |
| WEB-20 | Low | Confirmed (prior W-12) | enumeration | `website/src/app/login/LoginView.tsx:115` | `email_for_mobile` reveals whether a mobile number is registered. | PII enumeration. | Uniform error + rate limit. | S |
| WEB-21 | Low | Confirmed | search API | `website/src/app/api/search/route.ts` | Public, sanitised, no rate limit; a cache entry per distinct term. | Cache growth. | Rate limit, minimum length. | S |
| WEB-22 | Low | Confirmed | CSP | `website/next.config.js:14` | `'unsafe-inline'` in `script-src`. | Weakens XSS defence (ties to ADM-03). | Nonce-based CSP. | M |
| WEB-23 | Low | Confirmed (prior W-15) | middleware | `website/middleware.ts:31` | `auth.getUser()` network call on every request. | Latency/cost. | Skip when no auth cookie. | S |
| WEB-24 | Low | Confirmed | content provenance | `A:085_job_external_apply_and_flex_seed.sql` | Seeds a rewritten real Flex/Workday job with its real apply URL into live `jobs`; deadline 2026-09-22. | Copyright/reputation. | Confirm rights or drop seed. | S |
| WEB-25 | Low | Confirmed | password policy | `website/src/app/reset-password/ResetPasswordView.tsx:~76` | Minimum 6 chars (admin uses 10). | Weak passwords. | ≥8. | S |
| WEB-26 | Low | Suspected | premium mock-test gate | `website/src/app/mock-tests/[testId]/MockTestRunner.tsx:67-93` | Gate depends on `test_questions` RLS and `submit_test_attempt` (see DB-09/DB-10). | Premium bypass. | Manual check 5 (section 6). | M |
| WEB-27 | Low | Suspected | free-project grant | `website/src/app/projects/[id]/ProjectPurchasePanel.tsx:132-141` | Free-project grant path not re-verified. | Unknown. | Verify. | S |

**Prior website audit (2026-09-09) — status now:** W-03 (no password reset) **fixed** (`/forgot-password`, `/reset-password`, `/api/auth/verify-recovery`). W-01, 02, 04, 05, 07, 08, 09, 10, 12, 14, 15, 16 **still open** (= WEB-05, 01, 06, 07, 08, 17, 16, 19, 20, 18, 23, 15). W-06 unverified (WEB-26). W-11, W-13, W-17 not re-checked. From `SECURITY_AUDIT_2026-09-06.md`: HSTS/CSP/X-Frame/nosniff, `safeInternalPath`, JSON-LD escaping, no service-role key, ownership re-scoping all still intact; still open: spoofable `x-forwarded-for` rate-limit key and the Next/`@supabase/ssr` version currency.

### 3.4 Phase 2 + 3 — Mobile crashes, errors and functional bugs (MOB-)

Verified good: `SAMPLE_*` fallbacks are `__DEV__`-only; learning/coding premium gating is server-side; markdown links use `safeLinkUrl`; profile cache cleared on sign-out; no realtime channels/intervals to leak; 1 `console.log`; secret-key guard in `supabase.ts`; `openApplyUrl` blocks `javascript:`/`data:`; custom-project token is a server constant (client `tokenForType` matches `TOKEN_BY_TYPE`); big lists use FlatList. Note: MOB-19 duplicates DB-01/PAY-01 (payment-reuse) — fix once at DB level.

| ID | Severity | Status | Area | Location | Problem | Impact | Recommended fix | Effort |
|---|---|---|---|---|---|---|---|---|
| MOB-01 | Critical | Confirmed | Payments (project purchase) | src/hooks/usePayment.ts:37-62 | Any throw AFTER Razorpay succeeded (e.g. `verifyPayment` network/5xx/timeout) lands in the same `catch` as checkout failure and calls `markOrderFailed()` (status='failed', "Payment failed"), then returns `failed` -> PaymentFailed screen | User is charged, order is marked failed client-side, project not unlocked, UI says failed -> retry = double charge | Split try: only checkout errors -> markOrderFailed/cancelled. If checkout succeeded and verify fails, do NOT mark failed; show "payment received, confirming" and poll/retry verify (idempotent) using razorpay ids; rely on webhook to reconcile | M |
| MOB-02 | Critical | Confirmed | Payments (custom project token) | src/hooks/useCustomProjects.ts:143-173 | Bare `catch {}` around checkout maps EVERY checkout error incl. `payment.failed` to "cancelled" (no message). If `verifyPayment` throws after a successful charge the user gets `failed` with SubmitFailed text "nothing is charged" (BuilderPaymentScreen.tsx copy ~l.108). Retrying "Pay" calls `createOrder` again -> new request + payment + Razorpay order each time (create-custom-project-order/index.ts:229-275) | Charged token with no recorded request; double charge on retry; orphan `pending` requests | Distinguish cancel (code 0) vs failure; on post-charge verify error keep requestId, retry verify, never re-create order for same draft (reuse pending order/idempotency key); fix copy | M |
| MOB-03 | High | Confirmed | Payments | src/hooks/usePayment.ts:29 + src/project/PaymentScreen.tsx:43; src/hooks/usePremium.ts:~40, useWallet.ts | `paymentService.createOrder` is outside any try/catch; rejection propagates out of `purchase()` into `handlePay` (no catch) | Unhandled promise rejection; button spinner stops with no message when the edge function is down/401/429 | Wrap in try/catch returning `{status:'failed', message}`; show `notify` | S |
| MOB-04 | High | Confirmed | Payments error text | src/services/payment.service.ts:35,72; customProjects.service.ts createOrder/verifyPayment; wallet.service.ts:73,104; settings.service.ts:122; premium.service | `supabase.functions.invoke` errors are thrown as `error.message` = "Edge Function returned a non-2xx status code"; server's JSON `{error}` (429 rate limit, 400 pricing missing, 503 not configured) is never read | User sees an unhelpful generic message; rate-limit / config errors indistinguishable | Helper `invokeFn()` that reads `error.context.json()` (FunctionsHttpError) and surfaces `.error` / `retryAfterSeconds` | S |
| MOB-05 | High | Confirmed | Auth UX | src/hooks/useAuth.ts:11-22 + src/navigation/RootNavigator.tsx:29-31 + src/auth/LoginScreen.tsx:41-61 | `login()` sets global `isLoading=true`; RootNavigator then renders SplashScreen and UNMOUNTS the whole NavigationContainer (incl. LoginScreen). On wrong password `isLoading` flips back, Login remounts empty; the `setFormError(...)` in the catch targets an unmounted component | Failed login shows NO error and wipes the typed identifier/password (the inline-error design in LoginScreen is defeated). Same for `register()` (RegisterScreen.tsx:66-73: form cleared, then `navigation.navigate("Login")` on an unmounted screen) | Do not use global `isLoading` for login/register; use local `submitting` only (already exists) or add a separate `isBootstrapping` flag used only by RootNavigator | S |
| MOB-06 | High | Confirmed | No error boundary | src/app/App.tsx, RootProvider.tsx, Navigation.tsx (grep ErrorBoundary/componentDidCatch = 0 hits) | Zero React error boundaries anywhere (also no `ErrorBoundary` from react-navigation screen options) | Any render-time exception (e.g. MOB-09 `mapJobRow(null)`) white-screens the entire app; on web a blank page | Add a root `ErrorBoundary` in App.tsx (fallback + reload/reset) and per-navigator boundaries; report to Sentry if used | S |
| MOB-07 | High | Confirmed | Logout / multi-user data leak | src/hooks/useAuth.ts:41, profile/LogoutScreen.tsx:23, profile/SettingsScreen.tsx:48, app/RootProvider.tsx:6; hooks/useWallet.ts:13, useJobs.ts:83-135, useReferral.ts:16, useCustomProjects.ts:63, useSettings.ts:58, usePremium.ts:22 | Logout only `signOut()` + `authStore.reset()`. No `queryClient.clear()`; query keys are NOT user-scoped (`walletQueryKeys.summary`, `jobQueryKeys.saved/applied`, `customProjectKeys.myRequests/draft`, `["blocked-users"]`, `premiumQueryKeys.membership`, referral overview). `useBuilderStore` (title/objective/uploads paths/draft), `jobFilterStore`, `projectFilterStore` never reset | Next account on same device/tab briefly sees previous user's wallet balance, saved/applied jobs, custom-project requests, premium status and builder draft (stale-while-revalidate); builder draft could be autosaved to the NEW user's `custom_project_drafts` | On SIGNED_OUT (in useAuthBootstrap) call `queryClient.clear()`, `useBuilderStore.getState().reset()`, reset filter stores; include `userId` in per-user query keys | S |
| MOB-08 | High | Confirmed | Settings sync across users | src/hooks/useSettings.ts:11-27, store/settingsStore.ts:44-58 | `hasHydratedFromServer` is in-memory and never reset at logout; `attempted` ref is per hook mount. After user A logs out and B logs in in the same session, prefs are not re-hydrated; persisted AsyncStorage prefs of A remain; B's later edits `syncPreferences` A's values to B's row | Theme/notification prefs (incl. `hasAgreedToTerms`) bleed between accounts and can overwrite the second user's server prefs | Reset settings store (`hasHydratedFromServer=false`, defaults) on sign-out; key hydrate by userId | S |
| MOB-09 | High | Confirmed | Null access on joins | src/services/job.service.ts:435-437 (getSavedJobs `mapJobRow(row.job)`), :476-477 (getAppliedJobs), mapJobRow:~78 | `row.job` is null when the embedded job is hidden by RLS (closed/retargeted) or deleted; `mapJobRow(null)` throws TypeError reading `posted_at` | Saved Jobs / Applied Jobs screens error out entirely (and, with no boundary, may crash) once ONE saved/applied job disappears | `.filter(r => r.job)` before map; same for other `mapXRow(row.embedded)` uses (myProjects `purchase.project`, referrals) | S |
| MOB-10 | High | Confirmed | Jobs apply flow (WIP) | src/jobs/ApplyJobScreen.tsx:20-70 | Form collects name/email/phone/location/experience but "Continue" only passes `{jobId}` to ResumeUpload; values are never stored or submitted (`applyToJob` inserts only user/job/resume). Also `ResumeUploadScreen` claims "Drag & drop" and "Max file size: 5MB" but nothing enforces 5MB | Dead form: user input silently discarded; misleading UX | Either persist to `applications` (add columns) or remove the step; enforce size in `pickAndUpload` | M |
| MOB-11 | High | Confirmed | Web platform: dead buttons | src/resume/ResumeEditorScreen.tsx:108-125 | Raw `Alert.alert` with multi-button arrays (Delete section / Clear demo). react-native-web Alert is a no-op stub (lib/notify.ts documents this) | On web, "Delete section" and "Clear demo content" do nothing | Use `confirmAction()` from lib/notify.ts | S |
| MOB-12 | High | Confirmed | Web platform: downloads | src/hooks/useProjects.ts:151-160, src/services/settings.service.ts:101-115 | `FileSystem.documentDirectory` is null on web -> destination "nullsource-code.zip"; `downloadAsync`/`Sharing` are native-only. Also `url` may be `""` when `createSignedUrl` fails (project.service.ts:343-355, myProjects.service.ts:115) and is passed straight to `downloadAsync` | Purchased-project download broken on web (a paid feature); empty-URL download attempts | On web use `Linking.openURL(signedUrl)` / anchor download; skip/disable rows with empty url; surface signed-URL error | M |
| MOB-13 | High | Confirmed | Custom builder: estimate vs server (WIP) | src/services/customProjects.service.ts:291 `priceForFeature(f, projectType, false)` vs supabase/functions/_shared/customProjectPricing.ts:74-79 + create-custom-project-order/index.ts:140-156 | Client always passes `aiRecommended=false`; server reads `aiRecommendedFeatureIds` from the user's saved draft (which the website writes, and mobile `hydrate` spreads back in) and passes `true` for those ids -> academic override price differs. Also `estimate.basePrice`=0 silently when pricing row missing (l.281-284) | The "Estimated total" / "balance after token" shown on Estimate/Payment (BuilderPaymentScreen.tsx:~95-101) can differ from server `estimatedTotal` stored on the request. Charged token itself is fixed server-side (TOKEN_BY_TYPE 1500/3000/6000 = client `tokenForType`) so amount charged cannot diverge; only the displayed estimate/balance can | Use server-returned `estimatedTotal` on SubmitSuccess (already returned by createOrder); carry `aiRecommendedFeatureIds` in `CustomProjectBuilderConfig` and pass into `calculateEstimate`; treat missing pricing row as error state | M |
| MOB-14 | Medium | Confirmed | Custom builder guards (WIP) | src/customProjects/BuilderEstimateScreen.tsx:81-83, BuilderFeaturesScreen, BuilderUploadsScreen:123,248; navigator CustomProjectsNavigator.tsx | Only Type/Level/Platform/Details steps have `nextDisabled` guards; Features/Uploads/Estimate do not verify `projectType/level/platform/title` are set (Payment does via isComplete). Navigation state is not URL-linked (no `linking`), so web refresh on a step resets to BuilderStart while store is lost (store is memory-only; only debounced draft survives) | Reaching Estimate with an empty config shows ₹0 base/total; refresh mid-wizard drops state that isn't yet autosaved (autosave only starts after a type is chosen; errors swallowed `.catch(()=>undefined)` in useBuilderAutosave.ts:22) | Add a `useStepGuard(requiredFields)` that `replace`s to the first incomplete step; surface autosave failures once | S |
| MOB-15 | Medium | Confirmed | Auth / session | src/auth/ForgotPasswordScreen.tsx:30-40, OTPVerificationScreen.tsx:36, ResetPasswordScreen.tsx, hooks/useAuthBootstrap.ts:118-120 | Forgot-password = `signInWithOtp` (shouldCreateUser defaults true) then `verifyOtp`; `isRecoveringPassword=true` is set on request and only cleared on successful reset or `reset()`. Backing out (Login) leaves the flag true + a live session after OTP verify | (a) typing an unregistered email creates a new auth user; (b) after abandoning reset, the user has a valid session but no password change and, while flag is true, Google/OTP SIGNED_IN events are ignored (useAuthBootstrap.ts:118) -> "stuck" login until app restart; cold start then logs them straight in | Pass `shouldCreateUser:false`; clear flag on unmount/back and `signOut()` if session created; use `resetPasswordForEmail` + `PASSWORD_RECOVERY` | M |
| MOB-16 | Medium | Confirmed | Deep links | src/navigation/RootNavigator.tsx:33 (`<NavigationContainer>` without `linking`); app.json scheme "campusedux" | Scheme is registered but no `linking` config and no `Linking.addEventListener/getInitialURL` handler anywhere. Only the OAuth `Linking.createURL("auth/callback")` path is consumed by WebBrowser. Email-verify / magic-link / referral / job / project deep links do nothing; on web every URL renders the same stack (no per-screen URLs, refresh loses place) | "Verify your email" link (RegisterScreen.tsx:70) has no in-app handler; referral share links can't prefill Register; deep link to deleted item N/A but also unsupported | Add `linking` with prefixes [`campusedux://`, https site], validate params (uuid/slug regex), fallback screen for not-found | M |
| MOB-17 | Medium | Confirmed | Session storage | src/lib/storage.ts:96-97 | Supabase session (access + refresh tokens) is stored in AsyncStorage on every platform (plain-text SQLite/XML on Android, localStorage on web) — deliberate (2 KB SecureStore limit) but tokens are not in Keychain/Keystore | Rooted/backup extraction exposes refresh token; web XSS = account takeover | Use the documented pattern: AES key in SecureStore + encrypted blob in AsyncStorage (`LargeSecureStore`); keep web as-is with strict CSP | M |
| MOB-18 | Medium | Confirmed | Long-lived signed URL | src/services/job.service.ts:~428-433 | Resume signed URL created with 1-year TTL and stored in `resumes.file_url` | Bearer link to a PII document valid for a year, readable by anyone who obtains the row/recruiter export | Store only `storage_path`, mint short-lived URLs on demand | S |
| MOB-19 | Medium | Suspected | RLS on purchases | supabase/migrations/0006_purchases.sql:62-66 | `purchases_update_own_failed` USING is `auth.uid()=user_id` (no status restriction) and CHECK only limits new `status`; client `markOrderFailed` writes directly | User can update ANY column of own pending/success rows (price, total_amount, razorpay ids) from the client and flip a success row to failed (removes own access). Need to confirm `verify-razorpay-payment` recomputes amount from server data | Restrict via column-level trigger/RPC (`mark_order_failed(order_id)` SECURITY DEFINER, only `pending -> failed`); revoke direct UPDATE | M |
| MOB-20 | Medium | Confirmed | Fake/placeholder support data | src/settings/ContactSupportScreen.tsx:61, src/myProjects/SupportScreen.tsx:22 | Hard-coded `tel:+919876543210` (placeholder-looking) while WhatsApp support is +91 9370764290 (constants/contact.ts). AboutScreen.tsx:15 "Rate" opens generic `https://play.google.com/store/apps` | Users call a wrong/unowned number; rating link goes nowhere | Single `SUPPORT_PHONE` constant from constants/contact.ts; real store URL (or hide until published) | S |
| MOB-21 | Medium | Confirmed | Placeholder copy shipped | src/jobs/JobDetailsScreen.tsx:~165 | Fallback company blurb: "...'s mission is to organize its industry's information and make it universally accessible." (Google's mission text) when `company.about` empty | Fabricated/incorrect company description shown to users | Show nothing or "No description provided" | S |
| MOB-22 | Medium | Confirmed | Payment screen dead UI | src/project/PaymentScreen.tsx:16-20,34 (`method` state unused), BuyNowScreen.tsx:25 (`discount = 0`, coupon never passed to `purchase()`), PaymentScreen totals:39-40 | Method chooser has no effect (Razorpay sheet decides); Discount row hard-coded 0; displayed total = client price+fee, server `totalAmount` (create-razorpay-order response) is ignored | Price shown can differ from amount charged (fee %, discount, price change between screens) | Fetch/display server quote (order.totalAmount) before opening checkout; remove fake method list or pass `method` to Razorpay | M |
| MOB-23 | Medium | Confirmed | Job filters inconsistency (WIP) | src/jobs/FilterJobsScreen.tsx:11,49-56 vs services/job.service.ts:~149-153 and JobsDashboardScreen.tsx:95-96 | Filter sheet writes freeform `experience` ("Fresher", "0-1 Years") -> `ilike experience` substring, while dashboard chips write `experienceLevel` -> `experience_level='Fresher'|'Experienced'` (migration 0114 trigger-derived). "Fresher" via FilterJobs will not match rows whose experience text is e.g. "0-1 years" and vice versa; only one of the two is shown as an active chip (SearchJobsScreen.tsx:39) | Fresher/Experienced results differ by which screen you filter from; hidden active filter | Map "Fresher" -> experienceLevel; keep ranges only as text filters; show both chips | S |
| MOB-24 | Medium | Confirmed | External apply (WIP) | src/lib/openApplyUrl.ts:6, JobDetailsScreen.tsx:182, JobListingCard.tsx:153 | Scheme is validated (`^https?://` + canOpenURL) so javascript:/data: are blocked (good; DB check constraint jobs_apply_url_http_check also exists). But: external apply never records an application (`hasApplied` never true, no Applied Jobs entry); on web `await canOpenURL` before `openURL` can lose the user-gesture and the popup is blocked; the fallback notify prints the URL in an alert (cannot be copied on native) | No tracking of external applications; possible popup block on Safari/Firefox web | Call `Linking.openURL` synchronously first on web; optionally insert an `applications`/click record; use `Clipboard` in the fallback | S |
| MOB-25 | Medium | Confirmed | Unvalidated openURL | src/jobs/CompanyDetailsScreen.tsx:45 | `Linking.openURL(company.website)` with no scheme check/catch; website may be "www.x.com" (no scheme -> rejected promise, unhandled) | Unhandled rejection / dead link | Normalize with https:// prefix + `.catch`; reuse safeLinkUrl | S |
| MOB-26 | Medium | Confirmed | Push notifications stub | app.json plugins `expo-notifications`; src (grep Notifications./getExpoPushTokenAsync = 0), settings pushEnabled toggles | Plugin + POST_NOTIFICATIONS permission declared but no token registration, handler or channel exists; "Push notifications" toggles only write prefs. In-app Notifications list groups everything older than today as "Yesterday" (home/NotificationScreen.tsx:34-41) | Users are asked/allowed nothing; toggles are cosmetic; wrong grouping labels | Implement register-for-push (needs `extra.eas.projectId`, see MOB-30) or remove permission/plugin/toggles; add a proper date grouping | M |
| MOB-27 | Medium | Confirmed | Missing project list guard | src/services/project.service.ts:338-355 | Installation guide size hard-coded `1.2`; three signed URLs generated without checking object existence (missing `installation-guide.pdf` -> broken link) | Wrong sizes, downloads of non-existent files | Read from `project_files`; skip empty urls | S |
| MOB-28 | Medium | Confirmed | Services swallowing errors | src/services/project.service.ts:320-330 recordDownload; useCustomProjects autosave; profile/wallet reads | `recordDownload` logs `console.info` and continues; `useBuilderAutosave` swallows; several `getX().catch(() => undefined)` | Download history / draft silently missing; nothing surfaces to user | Toast on repeated autosave failure; retry queue for downloads | S |
| MOB-29 | Medium | Confirmed | Registration flow | src/auth/RegisterScreen.tsx:66-73, services/auth.service.ts:151-170 | Always tells "verification link sent" even when project has email confirmation OFF (session is created immediately) or when the email is already registered (Supabase returns an obfuscated user, no error). No resend-verification action anywhere; login for unverified user returns raw "Email not confirmed" | Confusing state; users can't re-request verification | Inspect `data.session`/`identities.length===0`; add "Resend email" via `supabase.auth.resend` | S |
| MOB-30 | Medium | Confirmed | Expo config | app.json, eas.json | No `extra.eas.projectId`, no `runtimeVersion`/`updates`, no `android.versionCode`/`ios.buildNumber`, eas.json lacks `cli.appVersionSource` (autoIncrement `production` then relies on remote default), no `env` blocks: EXPO_PUBLIC_SUPABASE_URL/ANON_KEY exist only in gitignored `.env` -> EAS builds throw at startup in lib/supabase.ts:20-26 ("Supabase env vars are missing") unless set as EAS secrets. `react-native-razorpay` needs a dev/production build (not Expo Go); no config plugin listed | First EAS build white-screens/crashes on launch; push tokens impossible; OTA updates not configured | Add EAS env (per profile) or `.env.production` via `eas env`, set `cli.appVersionSource:"remote"`, `extra.eas.projectId`, `runtimeVersion:{policy:"appVersion"}`; document razorpay dev-client requirement | S |
| MOB-31 | Medium | Confirmed | Dependency hygiene | package.json:35,80 (expo, expo-modules-core) | expo-doctor: expo 55.0.30 (want ~55.0.31), `expo-modules-core` pinned directly (should not be a direct dep) | Build/native version drift | Remove expo-modules-core from package.json; `npx expo install --check` | S |
| MOB-32 | Medium | Confirmed | Session-expiry / blocked user | src/auth/useAuthBootstrap.ts:52-58,111-118 | No handling of `TOKEN_REFRESHED` failure other than SIGNED_OUT; no "account disabled/deleted" check (profile fetch failure with cached profile keeps user signed in indefinitely offline). A deleted-account JWT stays usable until expiry; `getProfile` may auto-INSERT a fresh profile row for a deleted user's still-valid JWT (auth.service.ts:228-238) | Deleted/blocked user can keep browsing until token expiry, and a ghost profile can be re-created | On profile 401/403 or auth error call `signOut()`; do not auto-insert profile when session user no longer exists (`supabase.auth.getUser()` check) | M |
| MOB-33 | Low | Confirmed | Recovery-flow stale flag | src/store/authStore.ts:60-70 | `reset()` doesn't reset `isLoading`/`hasCompletedOnboarding`; fine, but `setUser` from `useAuth.login` bypasses cached-profile write (`setCachedProfile` only in bootstrap) | Cold start after login uses stale cache until network returns | Write cache in login path | S |
| MOB-34 | Low | Confirmed | Web: download of PDFs | src/hooks/useResume.ts:190-210 (`expo-print`/`Sharing`) | `Sharing.isAvailableAsync()` false on web; `expo-print` prints the current page on web unless `printToFileAsync` variant used | Resume "Download PDF" on web may print whole app page / do nothing | Web branch: generate blob/`window.open` | M |
| MOB-35 | Low | Confirmed | Razorpay web/native | src/lib/razorpayCheckout.ts:19-31,68 | Web loads checkout.js at runtime with no integrity check; `(window as any)`; native `require("react-native-razorpay")` crashes in Expo Go with an opaque "Cannot read property 'open' of null" (no friendly message); `payment.failed` path rejects with code 2 which MOB-02's bare `catch` treats as "cancelled" | Poor diagnostics | Detect null native module and throw a clear error; pass failure description to UI | S |
| MOB-36 | Low | Confirmed | Screens registered but no navigate() found | navigation/* vs src: BestSellers, NewArrivals, PremiumProjects, ChangeYear, OfferBanner, ReferralBanner, (AppliedJobs, RecommendedJobs only self-referenced in types) | No `navigate("<name>")`/reset target found by static grep (may be reached via variables; verify) | Possibly dead/unreachable screens shipped in bundle | Confirm on device; delete or link | S |
| MOB-37 | Low | Confirmed | Dev sample data bundled | src/data/sample*.ts imported by services (project/home/job/premium/referral/resume/myProjects) | Sample content is compiled into the production bundle even though only used under `__DEV__` (Metro can't tree-shake the imports) | Larger bundle; risk if `__DEV__` ever true in a release/web build | Lazy `require` inside the `__DEV__` branch | S |
| MOB-38 | Low | Confirmed | Big `as any` on remote data | HomeScreen.tsx (13), ProfileScreen.tsx (10), SettingsScreen.tsx (9), ResumeEditorScreen (9), ProjectDetailsScreen (6); services `mapXRow(row: any)` | Untyped remote rows; many `(navigation as any).navigate(...)` bypass typed params | Renamed columns/params fail at runtime not compile time | Generate Supabase types; typed `useNavigation<NativeStackNavigationProp<...>>` | L |
| MOB-39 | Low | Confirmed | `JSON.parse` | src/practice/draftStorage.ts:32, src/lib/storage.ts:119, services/resumeContent.ts:372 | draftStorage/storage parse inside try (OK); resumeContent parse of own object (OK) | None | — | — |
| MOB-40 | Low | Confirmed | Recovery UX | src/auth/OTPVerificationScreen.tsx:33-47 | OTP boxes: `handleChange` only advances; no backspace focus-back, no paste of a 6-digit code, no resend cooldown (Resend spams `signInWithOtp`); 6-char min password only client-side | Poor UX / OTP email spam | Add cooldown + paste handling | S |
| MOB-41 | Low | Confirmed | useEffect deps suppressed | src/auth/useAuthBootstrap.ts:135, learning/LearningTopicScreen.tsx:72 (+2 more) | `eslint-disable exhaustive-deps` (only 4 in repo); reviewed - intentional and bounded, no infinite loops found | None found | — | — |
| MOB-42 | Low | Confirmed | Custom builder autosave race (WIP) | src/hooks/useCustomProjects.ts:159-160 vs src/customProjects/useBuilderAutosave.ts:20-24 | After success, `deleteDraft` then reset navigation; an in-flight debounced/upsert `saveDraft` may land after the delete | Paid request could reappear as a draft "Resume draft" on next visit | Cancel pending autosave / reset builder store before deleteDraft | S |

### 3.5 Phase 4 + 5 + 6 — UX, UI quality, store-readiness (UX-)

Measured: 1,307 hex literals in `mobile-app/src`; 124 `fontSize:` literals + ~47 `text-[Npx]`; 363 Pressable/TouchableOpacity vs 202 accessibility props; 163 `text-gray-400`. A single theme source exists (`src/theme/*`, `constants/theme.ts`, `tailwind.config.js`) but is adopted only by the Learning flow. Contrast (WCAG, computed): brand #4F39F6 on white 6.46 (pass); gray-500 4.83 (pass); **gray-400 #9CA3AF 2.54 (fail)**; warning #F59E0B 2.15 (fail as text); success #16A34A 3.30 and teal #0D9488 3.74 (fail for small text). Paths relative to `mobile-app/src/` unless noted.

| ID | Sev | Status | Area | Location | Problem | Impact | Fix | Effort |
|---|---|---|---|---|---|---|---|---|
| UX-01 | High | Confirmed | Dark mode | theme/scheme.ts:10 `DARK_MODE_SCOPE="learning"`; app.json `userInterfaceStyle: automatic`; ~80 screens don't use theme (list below) | Dark mode is only for Learning/tab bar/drawer. Rest hard-codes white/gray-900. Settings > Theme offers Dark, but most screens ignore it; mixed-theme app | Looks broken/inconsistent for dark-mode users; Play reviewers may flag | Either hide Dark option/set userInterfaceStyle light until migrated, or migrate screens to useTheme in batches | L (or S to hide) |
| UX-02 | High | Confirmed | Tokens | 1307 hex literals; top: components/CustomProjectBanner.tsx (39), navigation/DrawerContent.tsx (23), components/learning/MarkdownText.tsx (22), customProjects/CustomProjectDetailScreen.tsx (21), home/HomeScreen.tsx (19), practice/CodeParts.tsx (17), resume/ResumeEditorScreen.tsx (13), resume/DesignSheet.tsx (13), home/HomeLearningCard.tsx (13), customProjects/BuilderDetailsScreen.tsx (13), BuilderUploadsScreen.tsx (12), settings/ContactSupportScreen.tsx (10) | theme.ts docs say "never hard-code hex" yet colours are everywhere; also 3 palettes (constants/theme COLORS, theme/colors.ts, tailwind) | Rebrand/dark-mode impossible; drift | Lint rule (no-restricted-syntax on hex), replace via ACCENTS/useTheme | L |
| UX-03 | High | Confirmed | A11y contrast | constants/theme.ts:19 `textDisabled #9CA3AF` used as icon/placeholder; 163x `text-gray-400` e.g. settings/LanguageScreen.tsx:30,52 | 2.54:1 on white for informational text ("Select Language", subtitles, meta) | Unreadable outdoors for many students | Use gray-500 (4.83) minimum for text; keep 400 only for disabled/decor | S |
| UX-04 | High | Confirmed | Store/feature | Language: settings/LanguageScreen.tsx:13-22,56 lists 7 languages; no i18n lib (grep i18n/expo-localization: none); note says "full translation limited" | Choosing "मराठी" changes nothing; misleading for the core Marathi audience | Trust loss, review complaints | Hide unsupported languages or ship i18n (i18next + expo-localization) with at least Home/Auth/Learning in mr/hi | M-L |
| UX-05 | High | Confirmed | Forms/keyboard | KeyboardAvoidingView used only in resume/SectionEditScreen.tsx:105, JdMatchScreen, Practice*; absent in auth/*, profile/EditProfileScreen, customProjects/BuilderDetailsScreen.tsx, settings/ContactSupportScreen, jobs/ApplyJobScreen, Screen.tsx:57 (only keyboardShouldPersistTaps) | Keyboard can cover fields/CTA on iOS (Android adjustResize partly saves it) | Users cannot see what they type on Register/Details | Put KeyboardAvoidingView (or keyboard-controller) inside Screen scroll variant | S |
| UX-06 | High | Confirmed | Destructive actions | resume delete: no Alert/confirm found in resume/ResumeDashboardScreen.tsx; only ResumeEditorScreen.tsx:108 confirms section delete. Custom-request cancel: no confirm in customProjects/CustomProjectDetailScreen.tsx | Delete resume / cancel request may be one tap (verify) | Data loss | confirmAction() (exists, 19 uses) on every delete/cancel | S |
| UX-07 | Med | Confirmed | Crash reporting | package.json: no Sentry/Crashlytics/expo-updates; privacy-policy.json:14 states no crash SDK | Blind to production crashes; no OTA path (no expo-updates, eas.json has no channels) | Cannot fix field bugs quickly | Add sentry-expo/@sentry/react-native + expo-updates channels; update privacy policy + data-safety accordingly | M |
| UX-08 | Med | Confirmed | Push | expo-notifications plugin + POST_NOTIFICATIONS in app.json, but privacy-policy.json:99 says no device token registered and grep finds no getExpoPushToken; in-app notifications is a DB list (home/NotificationScreen.tsx) | Permission declared with no push feature; Play data-safety mismatch risk | Rejection / wasted permission prompt | Either implement token registration or drop plugin+permission | S-M |
| UX-09 | Med | Confirmed | Onboarding/terminology | Tab is route "Prep" titled "Learning" (BottomTabNavigator.tsx:105); screens/files named Placement*; Premium plan text "Premium Placement Prep" (premium/PremiumPlansScreen.tsx:14); About says "Placement Prep" (settings/AboutScreen.tsx:24); Drawer "Learning"; Practice only from Home card (HomeScreen.tsx:79) and has NO drawer/tab entry while website nav has Practice (website navConfig.ts:45,61) | Learning vs Placement vs Practice used interchangeably; Practice hard to find on mobile | Confusion | One glossary: Learning (notes+tests), Practice (coding), drop "Placement Prep" copy; add Practice to drawer | S |
| UX-10 | Med | Confirmed | Nav mismatch | Mobile drawer (DrawerContent.tsx:23-38) lacks Practice, Blog, Compiler, Search; website has Blog/Compiler/Practice. Website header: Home·Projects·Learning·Practice·Jobs·Blog·Resume·Premium; mobile bottom tabs: Home·Projects·Jobs·Learning·Profile | Order/naming differs; "Resume Builder" (mobile, website drawer) vs "Resume" (website header) | Minor | Align labels+order | S |
| UX-11 | Med | Confirmed | A11y labels | 363 pressables vs 202 a11y props; top pressable-heavy files: resume/ResumeEditorScreen.tsx (14), SectionEditScreen (8), project/ProjectDetailsScreen (8), profile/ProfileScreen (6), LanguageScreen back arrow settings/LanguageScreen.tsx:26 (icon-only, no label/role), profile/LogoutScreen back etc. Many screens re-implement back button instead of ScreenHeader (which has labels, ScreenHeader.tsx:38) | Screen readers say "button" with no name | TalkBack unusable in places | Replace hand-rolled headers with ScreenHeader/HeaderIconButton | M |
| UX-12 | Med | Confirmed | Font sizes | ~29 uses of 9-11px (text-[11px]x16, text-[10px]x11, text-[9px], fontSize 9/10/11 x21) | <12px text | Legibility, esp. with big system fonts | Floor at 12; use typography tokens (theme/typography.ts) | M |
| UX-13 | Med | Confirmed | Font scaling | allowFontScaling only referenced in components/CustomProjectBanner.tsx (WIP) ; many fixed heights e.g. Input.tsx:37 height 52, Button min-h | Large system font can clip fixed-height rows | Suspected overflow | Test at 200%; use minHeight not height | S |
| UX-14 | Med | Confirmed | Type/spacing scatter | fontSize literals 13(x24),14(x18),12(x18),15(x14),11(x13),16(x11)...; text-[15px] x10; radii 12(x16),14(x12),999(x12),8,16,10,20; tokens exist in theme/spacing.ts, typography.ts | Off-scale sizes/radii | Visual inconsistency | Snap to scale; codemod | M |
| UX-15 | Med | Confirmed | Warning/success text colour | warning #F59E0B on white 2.15, success 3.3, secondary teal 3.74 used as text/labels (constants/theme.ts, tailwind.config.js) | Fail AA for small text | Hard to read badges/prices | Use darker 700 variants for text | S |
| UX-16 | Med | Confirmed | Account deletion | In-app: profile/SettingsScreen.tsx:41 confirm -> edge fn `delete-account`; legal/DeleteAccountInfoScreen.tsx; web: website/src/app/delete-account/page.tsx exists | Present in both (good). Confirmation is a single dialog (no re-auth/typing) and duplicate Settings screens exist (settings/SettingsScreen.tsx vs profile/SettingsScreen.tsx) | Fine for Play; duplication confuses | Delete dead duplicate | S |
| UX-17 | Med | Confirmed | Store assets | assets/icon.png 1024x1024 ok; adaptive-icon 1024 ok (safe zone unverified); splash.png 1242x2688 with resizeMode contain on #4F39F6; favicon 48 ok; no feature-graphic/screenshots in repo; version 0.1.0, no android.versionCode/ios.buildNumber (eas autoIncrement covers) | Version 0.1.0 looks pre-release | Low | Set 1.0.0 before launch; prepare screenshots (mr/en) | S |
| UX-18 | Med | Confirmed | Permissions | app.json: INTERNET, POST_NOTIFICATIONS; image-picker photos text; camera/mic blocked; document-picker uses system picker | Minimal permissions - good. Data safety must declare: email, name, phone?, purchases, files/photos, user IDs, payment info (via gateway); no ads/analytics per policy | Prep | Fill Data-safety form from privacy-policy.json; keep in sync if Sentry added | S |
| UX-19 | Med | Confirmed | Auth forms | keyboardType/autoComplete/textContentType present only in Register, OTP, EditProfile, PersonalDetails, ApplyJob, Wallet, Education (8 files); LoginScreen/ForgotPassword/ResetPassword lack them (grep) | No password-manager/autofill, email keyboard maybe missing | Friction at login | Add keyboardType="email-address", autoComplete="email"/"current-password", textContentType | S |
| UX-20 | Med | Confirmed | Validation copy | settings/SettingsScreen.tsx:25 "Password must be at least 6 characters" via modal notify (not inline) ; Input supports error/helperText (Input.tsx:64-67) but many screens use notify() alerts | Errors appear as popups | Slower correction | Use inline `error` prop | M |
| UX-21 | Med | Confirmed | Input a11y | components/ui/Input.tsx renders label separately; TextInput has no accessibilityLabel (grep) | Screen reader may not announce field name | A11y | pass accessibilityLabel=label | S |
| UX-22 | Med | Confirmed | Responsiveness | Screen.tsx:14 web maxWidth 1100 centred; app.json orientation portrait, ios supportsTablet true (tablet gets stretched phone layout, no split) | Tablets show phone UI; portrait lock hurts Practice/compiler on tablets | Minor | Cap width on tablets like web; allow landscape for Practice | S |
| UX-23 | Med | Suspected | 360px width | Chip/button rows (jobs filters, price rows, drawer 23 items) may not wrap; custom builder cards | Truncation on 360dp | Verify on device | see (d) | S |
| UX-24 | Low | Confirmed | Logout | Two paths: LogoutScreen full confirm screen; DrawerContent.tsx:59 logs out (check if confirm); Settings confirm | Inconsistent | Low | Single confirmAction | S |
| UX-25 | Low | Confirmed | Touch targets | hitSlop=8 on icon buttons (56 uses) gives ~36-40dp; Button sm min-h 44 ok; Chip heights unverified | Slightly below 44 | Minor | hitSlop 12 / 44 min | S |
| UX-26 | Low | Confirmed | Icon sets | Ionicons in mobile vs lucide-react on website (navConfig.ts) | Different glyphs, same names | Cosmetic | acceptable; map semantic names | - |
| UX-27 | Low | Confirmed | Screen names | Duplicate screens: WalletScreen in profile/ and referral/, SettingsScreen in 3 places, CompanyList | Wallet path ambiguity; "Wallet" vs "Referral & Earn" vs "tokens" | Terminology | Merge, explain tokens once | M |
| UX-28 | Low | Confirmed | Onboarding | auth/Onboarding1-3 exist, Welcome, Splash; Onboarding3 mentions Placement; no in-app first-run tour after login | Home is dense (Practice, learning card etc.) | Med | Add 3-tip checklist card on Home | S |
| UX-29 | Low | Confirmed (WIP) | Custom builder | customProjects/* uncommitted; 13 hex in BuilderDetailsScreen; banner 39 hex; wizard.tsx:95 has keyboardShouldPersistTaps but no KAV | Keyboard covering Details textareas | see UX-05 | | S |

Screens without theme/dark support (DARK_MODE_SCOPE="learning" keeps them light, so not "dark text on dark" today; becomes a bug the moment scope flips): referral/*, profile/* (Profile, Wallet, EditProfile, Help, About, Settings, Change*, PurchaseHistory, Logout), premium/*, auth/* (all), project/* (AllProjects, ProjectDetails, Payment, Buy*, Reviews, Wishlist, Gallery...), jobs/* (JobDetails, Search, Filter, Saved, Apply, Alerts, Company, ApplicationStatus, Recommended), home/* (Categories, Notification, LatestJobs, PremiumProjects, OfferBanner), settings/* (Settings, Theme, Language, Terms, Privacy, ContactSupport), myProjects/*, resume/Education/UploadImport, customProjects/BuilderStart/Level, legal/Contact.
Unfinished: in Dark mode users on Settings > Theme cannot see their own settings screen themed.

---

## 4. UI & UX recommendations per screen

Screen-level notes are from code reading (Suspected until seen on a device). Cross-cutting fixes: (1) one theme source and a lint rule against raw hex (UX-02); (2) `ScreenHeader`/`HeaderIconButton` everywhere instead of hand-rolled back buttons (UX-11); (3) `KeyboardAvoidingView` inside the shared `Screen` scroll variant (UX-05); (4) `confirmAction()` on every destructive action (UX-06); (5) use `Input`'s `error` prop instead of modal alerts (UX-20); (6) text floor 12px and gray-500 minimum for text (UX-03/12).

- Home (home/HomeScreen.tsx): 19 hex; add a 3-item "Start here" card for new users; put Practice in first-fold row (already has card), label sections in one vocabulary; bump sub-12px chips.
- Projects list/detail (project/AllProjectsScreen, ProjectDetailsScreen): 8 pressables with few labels; add labels on wishlist/share icon buttons; price/discount in AA colours; sticky Buy CTA above keyboard/safe area; show "what you get" (files, docs, demo) before price.
- Jobs list/detail (jobs/*): remember jobs tables may be empty - EmptyState with "set alerts"; Save/Apply icon buttons labelled; JobAlerts (JobAlertsScreen.tsx) uses no theme; add relative date ("2 days ago").
- Learning (learning/*): best-themed area; keep; show "Continue" first; add Marathi/Hindi subtitles for topic names when i18n lands.
- Practice (practice/*): not in drawer; add tab or drawer entry; landscape for compiler; KAV exists - test soft keyboard over code editor.
- Resume (resume/*): hex heavy (ResumeEditorScreen 13); confirm delete resume; autosave feedback ("Saved"); ATS score explanation text.
- Premium (premium/*): standardise name "Premium" not "Premium Placement Prep"; price+what unlocks up top; restore/refund link; show failure -> PaymentFailed retry.
- Wallet (profile/WalletScreen, referral/WalletScreen): two wallets; explain "tokens vs rupees vs wallet balance" in one sentence; withdraw needs min amount helper text and success toast.
- Profile: too many rows; group Account/Learning/Legal; Language row should be hidden until real (UX-04); Delete account under a "Danger zone".
- Custom project builder steps (customProjects/Builder*): keyboard covering (UX-05); show step x/8 and total price sticky; Save-draft feedback; Uploads: file limits helper text; Payment: token price in INR with refund note.
- Auth (auth/*): add autoComplete/textContentType; inline errors; OTP resend timer with a11y announcement; Google button first for students; password show/hide labelled ("Show password").

Additional website/mobile terminology notes: the website header is Home·Projects·Learning·Practice·Jobs·Blog·Resume·Premium; mobile tabs are Home·Projects·Jobs·Learning·Profile and the drawer lacks Practice/Blog/Compiler/Search (UX-09/10). Use one glossary: **Learning** (notes + mock tests), **Practice** (coding), **Wallet** (rupees) vs **token** (custom-project deposit); retire "Placement Prep" copy.

---

## 5. Missing features / improvements (prioritised, impact ÷ effort)

Highest value first. Items already itemised as findings are referenced, not repeated.

| # | Item | Impact | Effort | Ref |
|---|---|---|---|---|
| 1 | Razorpay **webhook + reconciliation job** so paid-but-app-died orders self-heal | Very high | M | PAY-05 |
| 2 | **Crash reporting + OTA updates** (Sentry + `expo-updates` channels); update privacy policy/data-safety accordingly | High | M | UX-07 |
| 3 | Fix EAS config (`projectId`, env per profile, `appVersionSource`, `runtimeVersion`, versionCode) and bump to 1.0.0 | High (blocks build) | S | MOB-30, UX-17 |
| 4 | Root **error boundary** + per-navigator boundaries (report to Sentry) | High | S | MOB-06 |
| 5 | Real **Marathi/Hindi i18n** for Home/Auth/Learning (or hide the fake language list now) | High for target audience | M–L (S to hide) | UX-04 |
| 6 | Finish or hide **dark mode** | High (looks broken) | S (hide) / L | UX-01 |
| 7 | **Push notifications** end-to-end (token registration, admin send, deep links) or remove permission/plugin/toggles | Medium | M | MOB-26, UX-08 |
| 8 | **Deep-link `linking` config** (`campusedux://`, https), incl. email verify/referral share/job/project | Medium | M | MOB-16 |
| 9 | Global search on mobile (website already has `/search` + typeahead) | Medium | M | UX list |
| 10 | Premium **expiry + renewal/extension** logic and receipts | Medium | S–M | PAY-07/20 |
| 11 | Custom-project **status timeline + notify on status change** (order tracking) | Medium | M | UX list |
| 12 | WhatsApp support button in mobile Help/Contact (website has it); fix fake phone number | Medium | S | MOB-20 |
| 13 | Offline/poor-network states (cached lists, retry) for 4G students | Medium | M | UX list |
| 14 | Accessibility pass (labels on icon buttons, contrast, 12px floor, 200% font-scale test) | Medium | M | UX-03/11/12/13 |
| 15 | Store listing pack: Data-safety form from `privacy-policy.json`, screenshots (mr/en), feature graphic, privacy/terms/delete-account URLs (all exist: `legal-site/*.html`, `website/src/app/delete-account`) | High (release gate) | S | UX-16/17/18 |

Store-readiness summary: account deletion exists in-app (`profile/SettingsScreen.tsx:41` → `delete-account` fn) **and** on the web; privacy policy/terms/refund/community/data-permission pages exist (`mobile-app/legal-site/*.html`, website routes); permissions are minimal (INTERNET, POST_NOTIFICATIONS; camera/mic/etc. blocked); icons and splash correctly sized. Gaps: no crash SDK, notification permission without a push feature, version 0.1.0, no screenshots/feature graphic in repo, deleted-account financial records are cascade-deleted (DB-30), legal entity/address env values must be filled by the owner before submission.

---

## 6. Needs manual verification (I could not do these — exact steps)

**A. Live database (Supabase SQL editor, read-only queries).** Run these first; several findings depend on what is actually applied live.
```sql
-- 1 tables without RLS (expect 0)
select tablename from pg_tables where schemaname='public' and not rowsecurity;
-- 2 open/true write policies
select tablename,policyname,cmd,roles,qual,with_check from pg_policies where schemaname in ('public','storage') and (qual='true' or with_check='true') and cmd<>'SELECT';
-- 3 tables with no admin policy (silent guard skips, DB-33)
select t.tablename from pg_tables t where t.schemaname='public' and not exists (select 1 from pg_policies p where p.tablename=t.tablename and p.qual ilike '%is_admin%');
-- 4 grants and triggers on purchases/profiles/reviews (expect NO guard trigger on purchases = DB-01 open)
select grantee,table_name,privilege_type from information_schema.role_table_grants where table_schema='public' and table_name in ('profiles','purchases','reviews') and grantee in ('anon','authenticated');
select event_object_table,trigger_name from information_schema.triggers where event_object_schema='public' and event_object_table in ('profiles','purchases','premium_subscriptions','reviews');
-- 5 SECURITY DEFINER without search_path (expect 0); invoker without (expect the 3 in DB-27)
select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosecdef and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and not p.prosecdef and p.prokind='f' and p.prorettype<>'trigger'::regtype and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
-- 6 SECURITY DEFINER callable by anon (compare with intended public list)
select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosecdef and has_function_privilege('anon',p.oid,'execute');
-- 7 buckets + storage policies (project-files must be private; no limits = DB-21)
select id,public,file_size_limit,allowed_mime_types from storage.buckets;
select policyname,cmd,qual from pg_policies where schemaname='storage' and tablename='objects';
-- 8 applied migrations + leaked drafts/premium notes
select version from supabase_migrations.schema_migrations order by 1 desc limit 30;
select count(*) filter (where status='draft') from public.jobs;
select count(*) filter (where status<>'published') from public.projects;
select count(*) from public.prep_notes where is_premium and is_published;
-- 9 staff roster; blocked-but-active users
select id,email,role,status from public.admin_users;
select p.id,p.email,u.banned_until,u.last_sign_in_at from public.profiles p join auth.users u on u.id=p.id where p.status='blocked';
-- 10 signs of past abuse
select razorpay_payment_id,count(*) from public.purchases where razorpay_payment_id is not null group by 1 having count(*)>1;
select id,user_id,project_id,total_amount,razorpay_order_id from public.purchases where status='success' and (razorpay_order_id is null or updated_at-created_at>interval '1 day');
select r.id,r.amount,p.total_amount,p.user_id=r.user_id as own from public.refund_requests r left join public.purchases p on p.id=r.purchase_id where p.id is null or p.user_id<>r.user_id or r.amount>p.total_amount;
select user_id,amount,date_trunc('minute',created_at),count(*) from public.wallet_transactions where category='added_money' group by 1,2,3 having count(*)>1;
select referrer_id,count(*),sum(reward_amount) from public.referrals where status='successful' group by 1 having count(*)>=3;
-- 11 FKs to auth.users/profiles without cascade (expect none)
select conrelid::regclass,conname from pg_constraint where contype='f' and confrelid in ('auth.users'::regclass,'public.profiles'::regclass) and confdeltype not in ('c','n');
-- 12 any scheduled jobs (premium expiry, PAY-07)
select jobname, schedule from cron.job;
-- 13 are the WIP migrations live? (WEB-03) — every column should return a row
select table_name,column_name from information_schema.columns where (table_name='jobs' and column_name in ('apply_url','application_deadline','experience_level','work_mode','category')) or (table_name='custom_project_features' and column_name='included_in_levels') or (table_name='custom_project_request_features' and column_name='is_included');
-- 14 referral/reward settings (DB-08) and contact RPC (DB-20)
select * from reward_settings;
select proname from pg_proc where proname ilike '%contact%';
```

**B. Reproduce the two Critical payment issues (Razorpay TEST mode, staging/throwaway user only).**
1. *PAY-01/DB-01:* call `create-razorpay-order` for a paid project P and keep the pending `purchases.id`. Separately pay a ₹10 wallet top-up and keep its `order_id/payment_id/signature`. `PATCH /rest/v1/purchases?id=eq.<P_id>` with the user JWT and body `{"razorpay_order_id":null}` (204 = hole open). POST `verify-razorpay-payment` with `orderId=<P_id>` and the top-up triple. `status:'success'` = confirmed.
2. *PAY-02/DB-06:* send 5 parallel `verify-wallet-topup-payment` calls with one valid triple, then `select sum(amount) from wallet_transactions where user_id='<uid>' and category='added_money';`.
3. *PAY-05:* pay, then kill the app before verify → row stays pending, money captured (Dashboard).
4. *PAY-04:* Razorpay Dashboard → Settings → Payment Capture must be *Automatic*; check the Webhooks page (none expected today).

**C. Dashboard / infra settings (cannot be read from the repo).** Supabase Auth: password minimum length, "Confirm email" on, CAPTCHA on signup/OTP, per-hour email/OTP/sign-up rate limits, redirect allow-list, ≥2 super_admins. Vercel: `COMPILER_REQUIRE_AUTH=true`, `ANTHROPIC_API_KEY` server-only, strong `REVALIDATE_SECRET`, host overwrites `x-forwarded-for` (else per-IP limits are spoofable), `curl -I` on `/account/*`, `/reset-password`, `/api/auth/*` shows private/no-store. Edge: `supabase secrets list` (only live `rzp_live_*` in prod), `supabase functions list` vs repo (is the WIP `create-custom-project-order` deployed?).

**D. Website/admin behaviour.** (1) `curl -X POST https://<site>/api/practice/judge -H 'content-type: application/json' -d '{"slug":"<real slug>","language":"python","source":"print(1)"}'` with no cookies (WEB-01). (2) Create a `viewer` admin, sign in, `POST /rest/v1/rpc/admin_adjust_wallet` with its JWT on staging (ADM-01/DB-07). (3) Set a banner `target_url` to `javascript:alert(1)`, click it on the home page (ADM-03). (4) Register a student named `=HYPERLINK("http://x","y")`, export students report, open in Excel (ADM-02). (5) As a non-premium user select from `test_questions` for a premium test and call `submit_test_attempt` (both should be denied; DB-09/WEB-26). (6) Create a website custom-project draft with a feature marked "included" for its tier; compare estimate with `custom_project_requests.estimated_total` after a test token payment (WEB-02/MOB-13). (7) Close a job in admin, watch the website for 2–10 min (ADM-08).

**E. Mobile device/browser tests.**
1. *MOB-05:* `npx expo start --web` (:8081) → Login with a wrong password → expect (bug) form clears and no message; repeat on Android.
2. *MOB-01/02:* Android dev-client + Razorpay test mode: pay a project; enable airplane mode right after the sheet returns success → PaymentFailed shown and `purchases.status='failed'` while Razorpay shows captured. Repeat at the custom-project Payment step.
3. *MOB-07/08:* login as user A, open Wallet + Saved Jobs, start builder (type Academic, title "secret"), logout, login as B → watch for stale wallet/saved/builder data and carried-over theme.
4. *MOB-09:* saved job that admin then closes/retargets → open Saved Jobs.
5. *MOB-11/12:* web → resume editor → delete a section; My Projects → Download source code.
6. *MOB-15:* Forgot password with an unregistered email; with a registered email verify OTP, kill the app, reopen (logged in without resetting?).
7. *MOB-16:* `adb shell am start -a android.intent.action.VIEW -d "campusedux://jobs/123"`; tap a Supabase verification email link on a phone.
8. *MOB-24:* Safari web → Jobs → Apply Now with an https URL → popup blocked?
9. *MOB-30:* `eas build -p android --profile preview` without EAS env → expect launch crash "Supabase env vars are missing".
10. *UX:* Settings → Theme → Dark (which screens stay light); focus the last field on Register/EditProfile/Builder Details/ContactSupport on a 360×640 Android and iPhone SE; TalkBack/VoiceOver on Home, ProjectDetails, Language back arrow; Android Display size 200% on Home/Jobs card/Premium plans; delete resume + cancel custom request (is there a dialog?); notification toggle vs OS permission prompt; tablet portrait/landscape; adaptive icon in circle/squircle mask; Language → Marathi (expect no text change); Play Console data-safety vs `privacy-policy.json`.
11. *Not done at all in this audit:* real payments, real devices, Lighthouse/Core Web Vitals, iOS build, production dashboards.

---

## 7. Suggested fix order (hand back one batch at a time)

**Batch 1 — Critical / money & data safety (do first; deploy DB + edge together; ~2–4 days)**
DB-01/PAY-01/MOB-19/PAY-03/PAY-11 (purchases guard trigger + verify hardening + unique `razorpay_payment_id`) · DB-06/PAY-02 (atomic top-up settle) · PAY-06/PAY-10 (atomic, idempotent verify functions; pending-order reuse) · MOB-01, MOB-02, MOB-03, MOB-04 (stop marking paid orders "failed", never re-create the order on retry, surface real error text) · run SQL 10 to look for past abuse. Add regression tests for each.

**Batch 2 — High: money rails, permissions, moderation (~3–5 days)**
PAY-04 + PAY-05 (captured/amount check + Razorpay webhook + reconcile) · DB-02/PAY-08, DB-29/PAY-09 (refund validation, one wallet balance, withdrawal approval queue) · DB-03, DB-04 (profiles guard trigger; enforce/ban blocked users) · DB-07/ADM-01 (`has_permission` in RLS/RPCs) · DB-08/PAY-16 (referral rules) · DB-05 (hide test cases/solutions) · PAY-07 (premium expiry) · WEB-01/PAY-17 (auth + durable rate limits on judge/AI routes, `COMPILER_REQUIRE_AUTH=true`) · DB-22 (confirm/apply 0100) · WEB-03 ordering: apply migrations 085-088 / 0113-0116 **before** deploying WIP.

**Batch 3 — High: app stability and first-run experience (~3–4 days)**
MOB-05 (login/register error + form wipe) · MOB-06 (error boundaries) · MOB-07/08 (logout clears query cache, builder/filter/settings stores; user-scoped keys) · MOB-09 (null joins) · MOB-10 (dead Apply form) · MOB-11/12 (web Alert & downloads) · MOB-13/WEB-02/PAY-18 (single pricing module; show server `estimatedTotal`) · MOB-15 (forgot-password `shouldCreateUser:false`) · MOB-30/MOB-31 (EAS config, deps) · MOB-20/21 (fake phone, Google blurb) · UX-05 (keyboard) · UX-06 (delete/cancel confirmation) · UX-04/UX-01 (hide fake language + dark option, or finish).

**Batch 4 — Medium: security hygiene and consistency (~1 week)**
DB-09/10/11/12/13/14/15/16/17/18/19/20/21/23/30/33 · ADM-02/03/04/05/06/07/08 · WEB-04/05/06/07/08/09 · MOB-14/16/17/18/22/23/24/25/26/27/28/29/32 · PAY-12/13/14/15/18/19/20 · UX-03/07/08/09/10/11/12/15/19/20/21/22 · crash reporting + OTA (UX-07).

**Batch 5 — Low / polish**
Remaining DB-2x/3x Low, WEB-10…27, ADM-09…12, MOB-33…42, UX-24…29, PAY-21…26, design-token migration (UX-02/14), dependency upgrades (Next 15/16, vitest, expo patch), i18n build-out, dark-mode migration, a11y pass.

**Process recommendations for every batch:** ship DB migrations and edge functions before the app/website that depends on them; commit the WIP (audit trail: DB-34) before starting Batch 1; keep one ordered migration tree (DB-33); add an SQL smoke-test to CI (SQL 1–6 above); add gitleaks (PAY-26).

---

## Appendix A — Table-by-table RLS matrix (109 tables)

Generated by replaying every `create policy`/`drop policy` across both migration trees in order (final effective state). "admin" = `is_admin()`-gated; "PUBLIC(true)" = unconditional. Written by the DB subagent; spot-checked against the statements cited in section 3.1.

| table | RLS | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|---|
| academic_years | ON | admin, PUBLIC(true) | admin | admin | admin |
| admin_activity_logs | ON | admin | — | — | — |
| admin_notifications | ON | admin | admin | admin | — |
| admin_users | ON | admin, super_admin (all) | super_admin (all) | super_admin (all) | super_admin (all) |
| announcements | ON | PUBLIC(true), admin | admin | admin | admin |
| application_stages | ON | own, admin | admin | admin | admin |
| applications | ON | own, admin | own, admin | admin | admin |
| aptitude_topics | ON | PUBLIC(true), admin | admin | admin | admin |
| ats_rules | ON | PUBLIC(true), admin | admin | admin | admin |
| backups | ON | admin | admin | — | — |
| banners | ON | PUBLIC(true), admin | admin | admin | admin |
| blocked_users | ON | own, admin | own | — | own |
| blog_categories | ON | PUBLIC(true), admin | admin | admin | admin |
| blog_posts | ON | admin, published+visibility | admin | admin | admin |
| branches | ON | admin, PUBLIC(true) | admin | admin | admin |
| categories | ON | PUBLIC(true), admin | admin | admin | admin |
| cms_pages | ON | PUBLIC(true), admin | admin | admin | admin |
| coding_submissions | ON | admin, own | admin, own | admin | admin |
| companies | ON | PUBLIC(true), admin | admin | admin | admin |
| contact_rate_limits | ON | — | — | — | — |
| contact_submissions | ON | admin | — | admin | — |
| coupons | ON | PUBLIC(true), admin | admin | admin | admin |
| courses | ON | admin, PUBLIC(true) | admin | admin | admin |
| custom_project_admin_inbox | ON | admin | admin | admin | admin |
| custom_project_ai_requests | ON | admin, own | own | — | — |
| custom_project_deliveries | ON | own [status = 'delivered'], admin | admin | admin | admin |
| custom_project_delivery_assets | ON | own [status = 'delivered'], admin | admin | admin | admin |
| custom_project_drafts | ON | own (all), admin | own (all), admin | own (all), admin | own (all), admin |
| custom_project_feature_categories | ON | PUBLIC(true), admin | admin | admin | admin |
| custom_project_features | ON | PUBLIC(true), admin | admin | admin | admin |
| custom_project_messages | ON | own, admin | own, admin | admin | admin |
| custom_project_payments | ON | own, admin | admin | admin | admin |
| custom_project_platform_pricing | ON | PUBLIC(true), admin | admin | admin | admin |
| custom_project_pricing | ON | PUBLIC(true), admin | admin | admin | admin |
| custom_project_request_features | ON | own, admin | admin | admin | admin |
| custom_project_request_files | ON | own, admin | admin | admin | admin |
| custom_project_request_history | ON | own, admin | admin | admin | admin |
| custom_project_requests | ON | own, admin | admin | admin | admin |
| downloads | ON | own, admin | own | — | — |
| dsa_problems | ON | admin, published+visibility | admin | admin | admin |
| dsa_topics | ON | admin, published+visibility | admin | admin | admin |
| edge_rate_limits | ON | — | — | — | — |
| faqs | ON | PUBLIC(true), admin | admin | admin | admin |
| generated_reports | ON | admin | admin | — | admin |
| hr_questions | ON | published+visibility, admin | admin | admin | admin |
| interview_categories | ON | admin, published+visibility | admin | admin | admin |
| interview_questions | ON | admin, published+visibility | admin | admin | admin |
| interview_topics | ON | admin, published+visibility | admin | admin | admin |
| job_alerts | ON | own, admin | own | own | — |
| jobs | ON | anon PUBLIC(true), published+visibility, admin | admin | admin | admin |
| learning_bookmarks | ON | own (all) | own (all) | own (all) | own (all) |
| learning_contents | ON | admin, published+visibility | admin | admin | admin |
| learning_grid_companies | ON | admin, published+visibility | admin | admin | admin |
| learning_grids | ON | admin, published+visibility | admin | admin | admin |
| learning_migration_map | ON | admin | — | — | — |
| learning_sections | ON | admin, published+visibility | admin | admin | admin |
| learning_topics | ON | admin, published+visibility | admin | admin | admin |
| legal_consents | ON | own | — | — | — |
| live_tests | ON | admin, published+visibility | admin | admin | admin |
| notification_preferences | ON | own, admin | own | own | — |
| notifications | ON | own, admin | admin | own, admin | admin |
| offer_banners | ON | PUBLIC(true), admin | admin | admin | admin |
| offers | ON | PUBLIC(true), admin | admin | admin | admin |
| practice_tests | ON | published+visibility, admin | admin | admin | admin |
| premium_features | ON | PUBLIC(true), admin | admin | admin | admin |
| premium_plans | ON | PUBLIC(true), admin | admin | admin | admin |
| premium_subscriptions | ON | own, admin | admin | own [status in ('active', 'cancelled')], admin | admin |
| prep_note_bookmarks | ON | own (all) | own (all) | own (all) | own (all) |
| prep_notes | ON | admin, published+visibility | admin | admin | admin |
| profiles | ON | admin, own | admin, own | admin, own | — |
| project_files | ON | own [status = 'success'], admin | admin | admin | admin |
| project_images | ON | PUBLIC(true), admin | admin | admin | admin |
| project_versions | ON | own [status = 'success'], admin | admin | admin | admin |
| projects | ON | anon PUBLIC(true), published+visibility, admin | admin | admin | admin |
| purchases | ON | own, admin | — | own [status in ('pending', 'failed')] | — |
| push_notifications | ON | admin | admin | — | — |
| recruiters | ON | PUBLIC(true), admin | admin | admin | admin |
| referral_codes | ON | own, admin | — | — | — |
| referral_earnings | ON | own, admin | — | — | — |
| referrals | ON | ANY-AUTH(status=successful), own(referrer/referred), admin | admin | admin | admin |
| refund_requests | ON | admin, own | own [status = 'pending'] | admin | — |
| resume_ai_prompts | ON | PUBLIC(true), admin | admin | admin | admin |
| resume_ai_requests | ON | own | own | — | — |
| resume_downloads | ON | own, admin | own | — | — |
| resume_share_reports | ON | admin | admin | admin | admin |
| resume_shares | ON | admin, own | admin, own | admin, own | admin, own |
| resume_template_categories | ON | PUBLIC(true), admin | admin | admin | admin |
| resume_templates | ON | PUBLIC(true), admin | admin | admin | admin |
| resume_versions | ON | own | own | — | — |
| resumes | ON | own, admin | own | — | own |
| resumes_builder | ON | own, admin | own | own | own |
| review_reports | ON | admin | cond | admin | — |
| reviews | ON | PUBLIC(true), admin | own, admin | own, admin | own, admin |
| reward_settings | ON | PUBLIC(true) | — | admin | — |
| role_permissions | ON | admin, super_admin (all) | super_admin (all) | super_admin (all) | super_admin (all) |
| saved_jobs | ON | own, admin | own | — | own |
| site_settings | ON | PUBLIC(true) | — | admin | — |
| technologies | ON | PUBLIC(true), admin | admin | admin | admin |
| test_attempt_answers | ON | own, admin | — | — | — |
| test_attempts | ON | own, admin | — | — | — |
| test_questions | ON | own-via-parent, admin | admin | admin | admin |
| testimonials | ON | PUBLIC(true), admin | admin | admin | admin |
| user_dsa_progress | ON | own, admin | own | own | — |
| user_favorite_questions | ON | own, admin | own | — | own |
| user_preferences | ON | own, admin | own | own | — |
| wallet_topup_orders | ON | own, admin | — | — | — |
| wallet_transactions | ON | own, admin | — | — | — |
| wishlists | ON | own, admin | own | — | own |
| withdrawal_requests | ON | admin, own | own [status = 'pending'] | admin | — |
