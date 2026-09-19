# CampusEduX — Website ↔ Mobile App Feature-Parity Audit

**Date:** 2026-09-18
**Scope:** Full feature-parity audit between `website/` (Next.js 14, source of truth) and `mobile-app/` (React Native/Expo), both wired to the same Supabase project. Audit-only — no code was modified.
**Method:** 7 parallel read-only research passes — one per module (Auth/Onboarding/Dashboard, Projects Marketplace + Custom Projects, Jobs, Learning/Placement Prep, Resume Builder, Premium/Payments/Referral) plus one dedicated Supabase surface cross-check (tables/RPCs/buckets referenced by each client, cross-referenced against all 112 migrations in `mobile-app/supabase/migrations`). Every finding below is grounded in code actually read during those passes; anything not independently confirmed is marked **Needs verification**.

---

## 1. Executive Summary

**Overall parity: ~68%.** The shared database schema itself is in very good shape — the dedicated DB/RPC cross-check found **zero cases of the app calling renamed, dropped, or stale columns/tables**, and no RPC signature mismatches across the 12 RPCs both clients share. Nearly every gap found is a **build gap**: a feature the website shipped in the last several weeks (Practice, Interview Questions, internal linking, custom-project AI understanding) that the app hasn't caught up to yet — not schema drift or breakage. The app is also meaningfully *ahead* of the website in a few areas (wallet withdrawal, membership management, notification preferences, avatar/DOB/gender profile fields), so this is not a one-directional gap.

Rough per-module parity: Auth/Dashboard ~85%, Resume Builder ~85%, Projects/Custom Projects ~75%, Premium/Referral ~75%, Jobs ~70%, **Learning/Placement Prep ~55%** (the weak point — two large recently-shipped feature areas are entirely absent from the app).

### Top 5 critical gaps

1. **Every mobile referral share link is broken (Critical).** `BRAND.referralBaseUrl` (`mobile-app/src/constants/brand.ts:11`) points to `https://www.campusedux.com/ref/<code>` — a route that does not exist on the website (which uses `/register?ref=<code>`) and is not registered as a deep link in `mobile-app/app.json`. Every referral shared from the app 404s, whether or not the recipient has the app installed. This silently breaks the entire referral-acquisition funnel from the mobile side.
2. **Standalone Practice hub (Coding Problems catalog, Online Compiler, Submissions history) is entirely absent from the app (Critical).** `/practice/*` and its backing RPCs (`practice_categories`, `practice_problems_list`, `practice_problem_detail`, `coding_submissions`) have zero references anywhere in `mobile-app/src`, despite public-select RLS that would let the app query them today with no schema change.
3. **Interview Questions (Java/Python) is entirely absent from the app (Critical).** Migrations 0103–0112 built a full feature (`interview_categories`/`topics`/`questions`, 4 public RPCs); the app has zero code referencing any of it, even though this content requires no execution capability — it's the cheapest of the major gaps to close.
4. **Custom-project pricing differs between website and app for academic students (High, money-facing).** Website applies `ACADEMIC_EXTRA_FEATURE_PRICES` (₹40–150 overrides) via `priceForFeature()`; the app's `estimatePrice()` always uses the raw catalog price. Two students configuring an identical project on web vs. app can see different estimated totals. **Needs verification** whether the `create-custom-project-order` Edge Function (the actual charge) applies the override server-side — if not, this is an active overcharge/undercharge bug, not just a display mismatch.
5. **Job filters are wired in the UI but never actually applied on mobile (High), and empty job/company results silently render fake sample data (High).** `FilterJobsScreen` writes to a store nothing reads; the fully-built filtered/paginated `useAllJobs` hook is never called by any screen. Separately, `job.service.ts`'s `orSample()` helper substitutes hardcoded `SAMPLE_JOBS`/`SAMPLE_COMPANIES` on any zero-row *success* (not just errors) — meaning the app's Jobs Dashboard and entire Companies module currently likely show fabricated listings to real users, since `jobs`/`companies` are reportedly empty on production.

---

## 2. Consolidated Parity Table

**Legend — Gap type:** Missing · Partial · Outdated · Different logic · Broken · None (parity) · Reverse (app-only, no website gap). **Severity:** Critical / High / Medium / Low.

### Auth, Onboarding, Dashboard, Notifications, Settings

| Feature | Website status | App status | Gap type | Severity | Files (website → app) |
|---|---|---|---|---|---|
| Email/mobile + password login | Full | Full | None | — | `login/LoginView.tsx` → `auth/LoginScreen.tsx` |
| Google OAuth login | Full | Full | None | — | `auth/callback/route.ts` → `services/auth.service.ts` |
| Registration consent gesture | Passive text, no checkbox | Mandatory `agreeToTerms` checkbox | Different logic | Medium | `register/RegisterView.tsx` → `auth/RegisterScreen.tsx` |
| Signup outcome handling (session vs. confirm-required) | Branches on `data.session` | Always shows "verify your email" | Different logic | Low | `register/RegisterView.tsx:69-91` → `auth/RegisterScreen.tsx:66-77` |
| Forgot/reset password | Magic-link (`token_hash`) | OTP-code (6-digit) | Different logic (both work) | Low | `reset-password/ResetPasswordView.tsx` → `auth/OTPVerificationScreen.tsx` |
| Change password while logged in | **Missing** | Present (Settings modal) | Missing | Medium | none → `profile/SettingsScreen.tsx:23-39` |
| Onboarding (course/branch/year) | Single combined form | 3-step resumable wizard | Different logic | Low | `onboarding/OnboardingForm.tsx` → `navigation/ProfileSetupNavigator.tsx` |
| Profile fields (DOB, gender, location, avatar) | **Missing** | Full, incl. avatar upload | Missing | Medium | `account/profile/ProfileForm.tsx` → `profile/EditProfileScreen.tsx` |
| Notification preferences (push/sound/promotions/etc.) | **Missing entirely** | Full, DB-synced | Missing | High | none → `settings/NotificationScreen.tsx` |
| Account deletion | Static instructions only | Real self-service (Edge Function) | Missing | Medium | `delete-account/page.tsx` → `profile/SettingsScreen.tsx:41-56` |
| Theme / language preferences | N/A | Full | Reverse | — | — → `settings/ThemeScreen.tsx`, `LanguageScreen.tsx` |
| Aggregated account dashboard | Present (`/account`) | Spread across separate screens | Different logic | Low | `account/page.tsx` → `profile/ProfileScreen.tsx` |

### Projects Marketplace & Custom Project Requests

| Feature | Website status | App status | Gap type | Severity | Files (website → app) |
|---|---|---|---|---|---|
| Listing filters (category/price/sort) | Present, 5 sorts, premium/bestseller flag | Present, different shape (rating, tech, no premium flag) | Different logic | Medium | `ProjectFilters.tsx` → `FilterProjectsScreen.tsx` |
| Wishlist / Save project | **Read-only page, no add/remove control anywhere** | Full add/remove | Missing (website) | High | `account/saved-projects/page.tsx` → `project/ProjectDetailsScreen.tsx` |
| Video preview / live demo | **Absent** (columns not even selected) | Present | Missing (website) | Medium | `lib/cache.ts:256-262` → `project/ProjectDetailsScreen.tsx:88-109` |
| Submit a review | **Absent** (display-only) | Present | Missing (website) | Medium | `projects/[id]/page.tsx:142-154` → `project/ReviewsScreen.tsx` |
| Purchase (Razorpay) | Present | Present, same Edge Functions | None | — | `ProjectPurchasePanel.tsx` ↔ `PaymentScreen.tsx` |
| Post-purchase download (source/docs) | **None** — page tells user to use the app | Full (signed URLs, versions) | Different logic (likely intentional) | High | `account/purchases/page.tsx` → `myProjects/*` |
| Version history / update-available | Absent | Present | Missing (website) | Medium | none → `myProjects/VersionHistoryScreen.tsx` |
| Custom project builder steps/fields | 4 route-groups | 8-screen wizard, same config | None (structural) | — | `custom-projects/*` ↔ `customProjects/Builder*Screen.tsx` |
| Token pricing (₹1500/3000/6000) | Present | Identical | None | — | `customProjects.ts:27-31` ↔ mobile constant |
| AI project-understanding (auto-fill from objective) | Present | **Absent entirely** | Missing | Medium | `api/custom-projects/understand/route.ts` → none |
| Feature dependency auto-add | Present (auto-adds + toast) | Display-only text, not auto-added | Partial | Medium | `customProjects.ts:383-401` → `BuilderFeaturesScreen.tsx:136-138` |
| Feature conflict blocking | Present | **Absent** — toggles unconditionally | Missing | Medium-High | `customProjects.ts:408-419` → `builderStore.ts:61-72` |
| Academic feature price override | Present (₹40-150 band) | **Absent** — uses raw catalog price | Different logic | Medium (money-facing) | `customProjects.ts:239-287` → `customProjects.service.ts:estimatePrice` |
| Request status/timeline/delivery/messaging | Present | Present, same tables | None | — | `my-projects/[id]/page.tsx` ↔ `CustomProjectDetailScreen.tsx` |
| Rating & tech-stack filters | **Absent** | Present | Reverse | — | — → `FilterProjectsScreen.tsx` |

### Jobs

| Feature | Website status | App status | Gap type | Severity | Files (website → app) |
|---|---|---|---|---|---|
| Listing filters (type, location, sort) | Full, wired end-to-end | UI present, **not connected to any live query** | Broken | High | `JobFilters.tsx` → `FilterJobsScreen.tsx`/`jobFilterStore.ts` |
| Pagination | Real server pagination | Hook exists but unused; live screens have none | Broken/Missing | Medium | `app/jobs/page.tsx` → `useJobs.ts:25-33` (dead) |
| Empty-result handling (tables reportedly empty live) | Honest empty state | **Silently substitutes fake `SAMPLE_JOBS`/`SAMPLE_COMPANIES`** | Broken | High | `lib/cache.ts` → `job.service.ts:36-50,168-229` |
| Apply flow — personal-info fields | Not collected (matches schema) | Collected but **discarded, never persisted** | Different logic | Medium | `JobApplyPanel.tsx` → `ApplyJobScreen.tsx:22-26` |
| Application status tracking | Status only | Status + stage timeline | Reverse (richer) | — | `account/applications/page.tsx` → `ApplicationStatusScreen.tsx` |
| Saved jobs | Toggle + list | Toggle + list + "recent/oldest" (array-reverse, not real sort) | Different logic | Low | `account/saved-jobs/page.tsx` → `SavedJobsScreen.tsx:20-25` |
| Companies listing | List, no search | List + search | Reverse | — | `jobs/companies/page.tsx` → `CompanyListScreen.tsx` |
| Recruiter details | None | Full screen (`recruiters` table) | Reverse | — | — → `RecruiterDetailsScreen.tsx` |
| Job alerts (saved search) | None | Full (`job_alerts` table) | Reverse | — | — → `JobAlertsScreen.tsx` |

### Learning / Placement Prep (Tutorials, Mock Tests, Coding Problems, Practice, Interview Questions)

| Feature | Website status | App status | Gap type | Severity | Files (website → app) |
|---|---|---|---|---|---|
| Learning grid list (6 tutorials), tree nav, content, premium gating | Full | Full, same RPCs | None | — | `learning.ts` → `learning.service.ts` |
| Topic Mock Tests + chapter/course randomized tests | Full | Full, same RPCs | None | — | `MockTestRunner.tsx` → `LiveTestScreen.tsx` |
| Mock-test result — per-question review | Full (`test_attempt_answers`) | Aggregate score only | Partial | Medium | `result/[attemptId]/page.tsx` → `TestResultScreen.tsx` |
| Topic-linked coding problems — view | Full | Full (read-only) | None (by design) | — | `CodingProblemBody.tsx` → `LearningCodingProblemScreen.tsx` |
| Topic-linked coding problems — run/judge/submit IDE | Full split IDE | **Absent** — "Solve on Website" link-out (documented design decision, master prompt §4/§29) | Missing (by design) | High | `CodingProblemWorkspace.tsx` → link-out only |
| "Your Progress" per-grid summary (`learning_progress_summary`) | Full | **Absent** | Missing | Medium-High | `ProgressSummary.tsx` → none |
| **Standalone Practice hub** (Coding Problems catalog + filters + IDE + judge/submit) | Full | **Entirely absent** | Missing | **Critical** | `practice/*`, `api/practice/*` → none |
| Online Compiler (`/compiler`) | Full | **Absent** | Missing | High | `/compiler` → none |
| Submissions history (`coding_submissions`) | Full, paginated | **Absent** | Missing | High | `practice/submissions/page.tsx` → none |
| **Interview Questions (Java/Python)** | Full | **Entirely absent** | Missing | **Critical** | `practice/interview-questions/*` → none |
| Topic bookmarks | N/A | Full (`learning_bookmarks`) | Reverse | — | — → `LearningTopicScreen.tsx` |
| Internal linking / discovery blocks | Full, presentational | N/A | N/A (no data gap) | Low | `TopicDiscovery.tsx` → n/a |

### Resume Builder / ATS / Career Profile

| Feature | Website status | App status | Gap type | Severity | Files (website → app) |
|---|---|---|---|---|---|
| 4-template gallery, thumbnails, preview | Full | Full | None | — | `resume/templates/TemplateGallery.tsx` → `resume/TemplatesScreen.tsx` |
| Structured `content` model (20 section types) | Full, source of truth | Full, identical | None | — | `lib/resumeBuilder/content.ts` → `services/resumeContent.ts` |
| Section reorder | Drag-and-drop | Up/down buttons only (`reorderBlocks()` exists, unused) | Different logic | Low | `edit/useDragSort.ts` → `ResumeEditorScreen.tsx` |
| ATS scoring / JD-match engines | Shared RPCs | Same RPCs, identical logic | None | — | `atsCategories.ts` ↔ `services/atsCategories.ts` |
| Design customization (ATS-clamped) | Full | Full, identical clamps | None | — | `lib/resumeBuilder/design.ts` ↔ `services/resumeDesign.ts` |
| AI writing-assist | Full | Full, same endpoint | None | — | `api/resume/assist/route.ts` shared |
| Upload/import & parse | Full | Full, same endpoint | None | — | `ImportWizard.tsx` → `ResumeUploadImportScreen.tsx` |
| PDF export | Server-side | On-device (`expo-print`), equivalent result | Different logic | Low | `api/resume/export/pdf/route.ts` → `resume.service.ts:570-577` |
| **DOCX export** | Full | **None** | Missing | Medium | `lib/resumeBuilder/docxBuilder.ts` → none |
| Public share link | Create + hosted `/r/[token]` viewer | Create only, hands off to website URL | Partial (by design) | Low | `r/[token]/page.tsx` → `resume.service.ts:609-617` |
| **Version control (named snapshots + restore)** | Full | **None** — `resume_versions` table has zero mobile references | Missing | **High** | `versions/VersionHistory.tsx` → none |
| **"Add from My Projects" picker (career-profile bridge)** | Full, live page | **Regressed** — service/hook code intact but UI removed during block-list rewrite, no consumer left | Broken (regression) | **High** | `[id]/projects/ProjectPicker.tsx` → dead code in `resume.service.ts:525-554` |

### Premium / Payments / Referral

| Feature | Website status | App status | Gap type | Severity | Files (website → app) |
|---|---|---|---|---|---|
| Premium catalog + purchase (Razorpay) | Full, DB-driven | Full + sample-data fallback | Different logic | Medium | `premium/page.tsx` → `services/premium.service.ts` |
| Membership details / cancel subscription | **Missing** | Full screen | Missing | Medium | none → `premium/MembershipDetailsScreen.tsx` |
| Wallet top-up | Full, secured | Same Edge Functions | None | — | `wallet/TopUpForm.tsx` → `services/wallet.service.ts` |
| **Wallet withdrawal** | **Missing entirely** | Full, secured RPC (`request_withdrawal`) | Missing | Medium | none → `profile/WalletScreen.tsx` |
| Referral code generation/display | Full | Full | None | — | `account/referral/page.tsx` → `ReferralDashboardScreen.tsx` |
| **Referral share link target** | Works (`/register?ref=CODE`) | **Points to a route that doesn't exist** (`/ref/<code>`), no deep link registered either | **Broken** | **Critical** | `account/referral/page.tsx` (works) vs `constants/brand.ts:11` (broken) |
| Referral share copy | N/A | Hardcoded, **misleading** "20% off" claim not backed by any DB rule | Different logic | Medium | none → `ShareReferralScreen.tsx:23` |
| Referral leaderboard | Missing | Full | Reverse | — | none → `LeaderboardScreen.tsx` |
| `is_premium` / wallet-credit client writes | None found (secure) | None found (secure) | None | — | grep-verified both sides |

---

## 3. Detailed Findings

Only Medium-severity-and-above items are detailed here; Low/None rows are covered sufficiently by the table above.

### Auth / Dashboard

- **Notification preferences absent on website (High).** `website/src/app/account/notifications/page.tsx:10-15` only reads/marks `notifications` rows; no UI, route, or lib call anywhere touches `notification_preferences`. That table is fully live with owner-scoped RLS (`mobile-app/supabase/migrations/0024_settings.sql:35-104`) and fully managed by the app (`mobile-app/src/settings/NotificationScreen.tsx:26-63`). **Fix:** add a preferences panel to `/account/notifications` (or a new `/account/settings`) reading/writing the same table with the same RLS-scoped upsert already proven by the app.
- **No self-service account deletion on website (Medium).** `website/src/app/delete-account/page.tsx:14-28` is purely informational, routing users to the app or to email support. The app calls a real Edge Function (`mobile-app/src/profile/SettingsScreen.tsx:41-56` → `supabase.functions.invoke("delete-account")`). If web parity is desired, add a confirm-and-invoke call to the same function, gated behind `requireUser()`.
- **Profile page missing fields + no avatar upload (Medium).** `website/src/lib/auth.ts`'s `AccountUser`/`getAccountUser` select (lines 19-33, 68-70) and `ProfileForm.tsx` omit `date_of_birth`, `gender`, `location`, and never expose `avatar_url` as editable, even though the app reads/writes all four against the same `profiles` table (`mobile-app/src/profile/EditProfileScreen.tsx:18-26,74-91`, `services/profile.service.ts:5-21,23-36`).
- **No in-session "change password" on website (Medium).** Website only supports the logged-out recovery-link flow. The app has an authenticated `Settings → Change Password` modal (`mobile-app/src/profile/SettingsScreen.tsx:19,23-39`) calling the same `auth.updateUser({password})` the website's reset-password page already uses — porting it is a small lift.
- **Registration consent gesture weaker on website (Medium, compliance-adjacent).** `RegisterView.tsx:160-170` shows static consent text with no checkbox; `RegisterScreen.tsx:26-28,161-188` enforces an explicit `agreeToTerms: z.literal(true)` before submission. Both eventually call the same `record_legal_consent` RPC, but the UI gesture backing that consent record differs — worth flagging to whoever owns the legal-compliance workstream.

### Projects Marketplace & Custom Projects

- **Wishlist add/remove missing on website (High).** No heart/save control exists anywhere on `ProjectCard.tsx` or the detail page; only `account/saved-projects/page.tsx` *reads* `wishlists`. Result: that page is a permanent dead end for web-only users. **Fix:** add insert/delete-on-`wishlists` controls mirroring `mobile-app/src/services/project.service.ts:266-274`.
- **No post-purchase download path on website (High, likely intentional).** `account/purchases/page.tsx:25` explicitly tells users to download via the app; no `project-files` bucket usage exists anywhere in `website/src`. This reads as a deliberate buy-on-web/download-in-app design choice rather than a bug, but the "go to downloads" CTA (`ProjectPurchasePanel.tsx:126`) is a dead end for anyone who never installs the app. **Needs verification** with the product owner on intent.
- **Feature conflict detection absent on mobile (Medium-High).** Website's `findConflict()` (`customProjects.ts:408-419`) actively blocks mutually-exclusive feature pairs; mobile's `builderStore.ts:61-72` `toggleFeature` has no such check, so a mobile user could reach checkout with conflicting features selected. **Needs verification** whether `create-custom-project-order` rejects this server-side — if not, this is a functional bug, not just a UX gap.
- **AI project-understanding step missing on mobile (Medium).** `website/src/app/api/custom-projects/understand/route.ts` (Claude-based auto-fill of type/level/platform + feature recommendations) has no mobile equivalent, which also removes the "recommended feature" labeling mobile could otherwise show.
- **Academic extra-feature price override absent on mobile (Medium, money-facing).** `customProjects.ts:239-287`'s `ACADEMIC_EXTRA_FEATURE_PRICES`/`priceForFeature` charges academic students ₹40-150 instead of the shared catalog price; mobile's `customProjects.service.ts:estimatePrice` (lines 116-149) always uses the raw catalog price. **Needs verification** of what the `create-custom-project-order` Edge Function actually charges server-side — that determines whether this is a misleading estimate-preview only, or an actual differential overcharge.
- **Video preview / live demo not surfaced on website (Medium).** `projects.video_url`/`live_demo_url` exist in schema and are used by the app (`ProjectDetailsScreen.tsx:88-109`) but the website's `getCachedProjectDetail` select (`lib/cache.ts:256-262`) omits both columns entirely.
- **Review submission missing on website (Medium).** Website only renders read-only `ReviewCard`s; the app has a full submit flow (`ReviewsScreen.tsx`, `project.service.ts:addReview` lines 233-242) with unique-constraint handling.

### Jobs

- **Filters are non-functional on mobile (High).** `FilterJobsScreen.tsx` writes to `useJobFilterStore`, but nothing else in the app reads that store — a repo-wide grep confirms it. The live screens (`SearchJobsScreen`, title-only `ilike`; `RecommendedJobsScreen`, no filter params) never call the fully-built, filter-capable `useAllJobs`/`jobService.getAllJobs` (`mobile-app/src/services/job.service.ts:126-150`), which is dead code. **Fix:** wire a results screen to `useAllJobs(filters)` reading from `useJobFilterStore`.
- **Sample/fake data shown when live tables are empty (High).** `orSample()` (`mobile-app/src/services/job.service.ts:36-50`) falls back to hardcoded `SAMPLE_JOBS`/`SAMPLE_COMPANIES` whenever a query **succeeds with zero rows**, not just on error — affecting `getRecommendedJobs`, `getCompanies`, `getCompanyDetails`, `getCompanyJobs`, `getRecruiterForJob`, and `getJobDetail`'s catch path. Given `jobs`/`companies` are reportedly empty in production (per `mobile-app/supabase/cleanup-demo-data.sql`'s header comment), the app's Jobs Dashboard and entire Companies module likely show fabricated listings to real users today, and tapping into a fake job/company would fail with FK violations on save/apply. The website correctly renders an honest empty state in the same scenario. **Fix:** align the app's fallback logic with the website's — only substitute sample data on a genuine fetch error, never on a real empty success (mirroring the comment already present in `getAllJobs`).
- **Apply-flow personal-info fields are collected then discarded (Medium).** `ApplyJobScreen.tsx:22-26,57-61` collects fullName/email/phone/location/experience that are never sent anywhere — `applyToJob` (`job.service.ts:381-396`) only inserts `{user_id, job_id, resume_id}`, and the `applications` table has no columns for them. This is UX theatre: users believe they submitted details that go nowhere. **Fix:** either remove that step (matching the website and the actual schema) or extend the schema to persist it on both platforms.

### Learning / Placement Prep

- **Standalone Practice hub entirely missing from the app (Critical).** Nothing in `mobile-app/src` references `practice_categories`, `practice_problems_list`, `practice_problem_detail`, or `coding_submissions`, and `PlacementStackParamList` has no routes for it — confirmed independently by both the module audit and the DB cross-check. **Fix path:** at minimum, add read-only browsing + link-out (matching the existing topic-linked-coding-problem pattern) plus a submissions-history screen reading `coding_submissions` (no DB/RLS change required); full in-app judge/submit would require the mobile team to decide whether to break the "no code execution on mobile" design principle.
- **Interview Questions entirely missing from the app (Critical).** Migrations 0103–0112 (git commit `e900385`, "Add Java and Python interview questions") built a pure-content feature (no code execution) with zero mobile awareness — cheapest major gap to close, mirroring the existing `LearningGridsScreen`/`LearningGridScreen`/`LearningTopicScreen` pattern almost exactly.
- **"Your Progress" grid-level summary missing from the app (Medium-High).** `learning_progress_summary` RPC (migration 0091/063) powers the website's per-grid attempted/solved/weak-topics card; the app's `PerformanceAnalysisScreen` is built entirely on `test_attempts` (mock-test scores only) and never calls this RPC or reads `user_dsa_progress`.
- **Mock-test result lacks per-question review on mobile (Medium).** Website reads `test_attempt_answers` joined to `test_questions` for a right/wrong breakdown; `TestResultScreen.tsx` shows aggregate score/accuracy only. No DB/RLS change needed to close this — just a new service method + review screen.

### Resume Builder

- **DOCX export missing on mobile (Medium).** Website has a full `.docx` generator (`lib/resumeBuilder/docxBuilder.ts` + `api/resume/export/docx/route.ts`); mobile's only export path is on-device PDF (`expo-print`). Mobile already calls the website's `/api/resume/assist` and `/api/resume/parse` over bearer JWT, so calling the existing docx endpoint the same way is the lowest-effort fix.
- **Version control (named snapshots + restore) missing on mobile (High).** `resume_versions` table (migration `0061_resume_versions.sql`) has zero references anywhere in `mobile-app/src` (grep-confirmed), despite full support on the website (`account/resume/[id]/versions/VersionHistory.tsx`). Mobile's `ResumeHistoryScreen.tsx` is a different feature (separate résumé rows, not point-in-time snapshots of one résumé) — this is a genuine gap, not a naming mismatch.
- **Career-profile "Add from My Projects" picker is regressed/dead code on mobile (High).** An earlier commit (`0374e73`) had this wired into `ResumeEditorScreen.tsx`; the current 298-line block-list rewrite has no reference to it at all. The underlying service/hook code (`resume.service.ts:525` `listMyCustomProjects()`, `:546` `appendProjectToResume()`, `hooks/useResume.ts:171`) is intact and correctly targets the current `content` model — it's simply never imported by any screen. This is the cheapest of the resume gaps to close: re-wire existing, already-correct logic into a UI entry point.

### Premium / Payments / Referral

- **Referral link is broken end-to-end on mobile (Critical).** Every "Share & Earn" link built by the app points to `https://www.campusedux.com/ref/<code>` (`mobile-app/src/constants/brand.ts:11`, consumed in `services/referral.service.ts:132` and `services/home.service.ts:296`). The website has no `/ref` route (`r/[token]` is résumé-sharing, unrelated) and no redirect rule exists in `website/next.config.mjs`. `mobile-app/app.json` also registers no `associatedDomains`/`intentFilters` for `campusedux.com`, so the link can't deep-link into the app either — **every referral link shared from the app currently 404s**, regardless of whether the recipient has the app installed. **Fix:** either add a `/ref/[code]` redirect on the website (→ `/register?ref=CODE`, matching what the website's own referral page already generates) or repoint `BRAND.referralBaseUrl` at `${SITE_URL}/register?ref=`.
- **Misleading referral share copy on mobile (Medium).** `ShareReferralScreen.tsx:23` hardcodes "get 20% off your first purchase" — no such referee discount exists anywhere in `reward_settings` or the conversion triggers; only the *referrer* is ever paid. The app's own dashboard screen already has correct, dynamic copy generation (`describeRewardRule()`) that this screen should reuse instead.
- **Membership management missing on website (Medium).** No `/account/premium` route or plan/billing-date/cancel-auto-renew UI exists; the app has a full `MembershipDetailsScreen` correctly scoped to the SEC-001 fix's allow-list (only `auto_renew` is client-writable).
- **Wallet withdrawal missing on website (Medium).** No withdrawal form or call to `request_withdrawal` exists in `website/src` (grep-confirmed); the app has the full, SEC-002-hardened flow. Not a security gap — just an inconsistent capability. If added to web later, it must call the same RPC, never insert into `wallet_transactions` directly (that insert policy was deliberately dropped in migration 0038).
- **Sample-data fallback on payment-adjacent screens (Medium).** `premium.service.ts`'s `getPlans`/`getFeatures` fall back to hardcoded sample plans on any error *or* a legitimately empty table; tapping "Subscribe" on a sample plan would pass a non-existent `planId` to `create-premium-order`. Website renders an honest "coming soon" empty state in the same scenario instead.

---

## 4. Database / API Mismatches

This section is authoritative from the dedicated cross-check pass (grep of all `.from(`/`.rpc(`/`.storage.from(` calls across both clients, cross-referenced against all 112 migrations), folded together with per-module DB notes.

**Headline finding: no schema drift found.** Every table the mobile app touches was independently confirmed to have a live, non-dropped `CREATE TABLE` in the migration history; every RPC shared by both clients (12 total: `coding_problem_detail`, `compute_ats_breakdown`, `learning_grids_list`, `learning_search`, `learning_topic_content`, `learning_topic_practice`, `learning_tree`, `match_resume_to_jd`, `practice_test_questions`, `record_legal_consent`, `submit_randomized_test_attempt`, `submit_test_attempt`) is called with matching parameter names/shapes on both sides. A full `grep -rni "drop table"` across all 112 migration files returns zero real schema drops (only hits inside seeded tutorial lesson prose).

**Website's Supabase surface:** ~61 distinct tables, 34 RPCs, 3 storage buckets (`resumes`, `custom-project-uploads`, `custom-project-deliveries`).
**Mobile app's Supabase surface:** ~48 distinct tables, 13 RPCs, 4 storage buckets (`resumes`, `project-files`, `avatars`, `custom-project-uploads`/`custom-project-deliveries`).

**Tables/RPCs the website uses that the app never references** (the real gap — all confirmed to have public/non-blocking RLS, meaning these are pure build gaps, not access restrictions):
- `interview_categories`/`interview_topics`/`interview_questions` + all 4 interview RPCs — plain public-select RLS (migration `0103_interview_questions.sql:135-149`). See Critical Gap #3.
- `dsa_problems` rows with `learning_topic_id IS NULL` (standalone Practice problems) + `coding_submissions` table + all `practice_*` RPCs — public-select RLS (migrations from `0072_practice_coding.sql` onward). See Critical Gap #2.
- `learning_progress_summary` RPC — no mobile equivalent widget, though mobile does query `test_attempts` directly for its own (narrower) history screen.
- `resume_versions` table (migration `0061_resume_versions.sql`) — live, zero mobile app code references it. See Resume finding above.
- Sitemap RPCs (`coding_problems_sitemap`, `learning_sitemap`, `interview_questions_sitemap`, `practice_problems_sitemap`), `email_for_mobile`, `submit_contact_message`, `learning_topic_by_source_note` — all website-only **by architecture** (SEO/legacy-redirect/contact-form concerns with no mobile equivalent page to begin with), not gaps.

**Tables/RPCs the app uses that the website doesn't (reverse direction, not a mismatch, just asymmetric feature coverage):** `application_stages`, `blocked_users`, `downloads`, `job_alerts`, `notification_preferences`, `offer_banners`, `premium_subscriptions`, `project_files`/`project_versions`, `user_preferences`, `request_withdrawal` RPC.

**RLS/access-pattern notes:**
- `mobile-app/src/services/myProjects.service.ts:92-124` (`getProjectFiles`) catches **any** error — including a genuine RLS denial — and silently falls back to fake `sampleProjectFiles()`. Since migration `0100_secure_project_files_storage.sql` tightened `project_files`/`project_versions` SELECT to purchaser-or-admin only, this fallback could mask a future regression in the purchase-gating check (low risk today since the screen is only reachable via an already-purchase-gated flow, but worth tightening).
- `dsa_problems` and the new interview-question tables are plain public-select — the app's non-use of them is confirmed to be a pure build gap, never an RLS-caused empty result.

**Resume schema:** confirmed fully aligned. Both clients treat `resumes_builder.content` (jsonb, migration `0062_resume_content.sql`) as the source of truth and both correctly mirror legacy flat columns on every write via matching `normalizeContent`/`contentToLegacyColumns` helpers. No drift.

**Migration `0100_secure_project_files_storage.sql` impact:** mobile app code (`project.service.ts`, `myProjects.service.ts`) was already updated in step with this migration (signed URLs, correct path convention, documenting comments). Website has no surface in this area at all (by the same "download via app only" design noted above), so the migration has nothing to break on the website side.

**Coupon/discount infrastructure:** `create-razorpay-order` Edge Function supports an optional `couponCode` parameter with real server-side discount logic, but **neither platform's UI actually collects a coupon code from the user** — dead functionality on both sides, not a parity gap between them.

---

## 5. Reverse Gaps (present in the app, not on the website)

- Wallet withdrawal flow (full, SEC-002-hardened).
- Premium membership-details screen with cancel-subscription.
- Referral leaderboard and a 6-month earnings trend chart.
- Native share-sheet integration for referral links (WhatsApp/Telegram/etc.) — website only has copy-to-clipboard.
- Recruiter details screen (`recruiters` table) and Job Alerts (saved search preferences) — no website equivalent for either.
- Application stage timeline on job applications (website shows status only).
- Company search box (website's companies list has none).
- Rating and tech-stack filters on project listing.
- Full post-purchase project ownership suite: source code / documentation / version history / update-available / download-history screens.
- Video preview and live-demo screens for projects.
- Notification preferences, theme (dark mode), and language settings — no website equivalent concept.
- Avatar upload, date-of-birth/gender/location profile fields.
- In-session authenticated password change.
- Real self-service account deletion (Edge Function-backed).
- Topic bookmarks in the Learning module (`learning_bookmarks`).
- OTP-based forgot-password flow (arguably better mobile UX than the website's magic link, though both are functionally sound).
- 3-step resumable onboarding wizard vs. website's single form.

---

## 6. Implementation Plan

Ordered by severity; grouped into phases so the highest-leverage/lowest-risk fixes land first. Effort: **S** = under a day, **M** = 2–5 days, **L** = a week or more / needs design or cross-team decisions.

### Phase 0 — Critical, ship immediately (money & funnel-breaking bugs)

| # | Item | Where | Effort |
|---|---|---|---|
| 1 | Fix broken mobile referral link — add `/ref/[code]` redirect on website or repoint `BRAND.referralBaseUrl` | website `next.config.mjs` or `mobile-app/src/constants/brand.ts` | S |
| 2 | Fix mobile job/company sample-data fallback to only trigger on genuine errors, not empty-success | `mobile-app/src/services/job.service.ts` | S |
| 3 | Verify (with the owner) whether `create-custom-project-order` applies the academic price override server-side; if not, fix immediately | Edge Function + `mobile-app/src/services/customProjects.service.ts` | S–M |
| 4 | Verify whether `create-custom-project-order` enforces feature-conflict rules server-side; if not, port `findConflict`/`resolveDependencies` into mobile's `builderStore.ts` | `mobile-app/src/customProjects/builderStore.ts` | M |

### Phase 1 — High severity, next sprint

| # | Item | Where | Effort |
|---|---|---|---|
| 5 | Wire mobile job filters to the already-built `useAllJobs` hook | `mobile-app/src/jobs/*`, `hooks/useJobs.ts` | M |
| 6 | Add Standalone Practice section to the app: read-only browse + link-out + submissions history | `mobile-app/src/learning` (new stack) | L |
| 7 | Add Interview Questions to the app (content-only, mirrors existing Learning screen pattern) | `mobile-app/src/learning` (new screens) | M |
| 8 | Re-wire the already-correct "Add from My Projects" resume picker code into a UI entry point | `mobile-app/src/resume/ResumeEditorScreen.tsx` | S |
| 9 | Add version control (snapshots + restore) to mobile resume, reusing `resume_versions` and website's server-action logic pattern | `mobile-app/src/resume/*` | M |
| 10 | Add wishlist add/remove controls to the website | `website/src/components/ProjectCard.tsx`, project detail page | S |
| 11 | Add notification-preferences panel to the website, reading/writing existing `notification_preferences` table | `website/src/app/account/notifications` | M |
| 12 | Fix misleading mobile referral share copy (remove fabricated "20% off" claim) | `mobile-app/src/referral/ShareReferralScreen.tsx` | S |
| 13 | Resolve website's post-purchase download dead-end (either build web download or make the "app-only" messaging explicit/actionable) | `website/src/app/account/purchases` | S (copy) / L (full feature) |

### Phase 2 — Medium severity, following sprint

| # | Item | Where | Effort |
|---|---|---|---|
| 14 | Add DOCX export to mobile (call existing website endpoint) | `mobile-app/src/resume/DownloadPDFScreen.tsx`, `services/resume.service.ts` | S–M |
| 15 | Add "Your Progress" grid summary to mobile via `learning_progress_summary` | `mobile-app/src/learning` | M |
| 16 | Add per-question mock-test review to mobile | `mobile-app/src/placement/TestResultScreen.tsx` | M |
| 17 | Add membership-management page to website | `website/src/app/account` (new route) | M |
| 18 | Add wallet withdrawal to website (reuse `request_withdrawal` RPC, never a raw insert) | `website/src/app/account/wallet` | M |
| 19 | Add video-preview/live-demo fields and UI to website project detail | `website/src/lib/cache.ts`, `website/src/app/projects/[id]` | S |
| 20 | Add review-submission form to website | `website/src/app/projects/[id]` | M |
| 21 | Add profile fields (DOB, gender, location, avatar upload) to website | `website/src/lib/auth.ts`, `website/src/app/account/profile` | M |
| 22 | Add in-session change-password control to website | `website/src/app/account/profile` (or new settings route) | S |
| 23 | Add AI project-understanding step to mobile custom-project builder | `mobile-app/src/customProjects/BuilderStartScreen.tsx` | M |
| 24 | Persist or remove the discarded personal-info fields in mobile's job-apply flow | `mobile-app/src/jobs/ApplyJobScreen.tsx` | S |
| 25 | Add self-service account deletion to website (or make the app-required messaging clearer) | `website/src/app/delete-account` | M |
| 26 | Align premium-plan mobile sample-data fallback to only trigger on error, matching website's empty-state behavior | `mobile-app/src/services/premium.service.ts` | S |

### Phase 3 — Low severity / polish

| # | Item | Where | Effort |
|---|---|---|---|
| 27 | Strengthen website registration consent to an explicit checkbox, matching the app | `website/src/app/register/RegisterView.tsx` | S |
| 28 | Add drag-and-drop section reorder to mobile resume editor (function already exists, unused) | `mobile-app/src/resume/ResumeEditorScreen.tsx` | S |
| 29 | Fix mobile "recent/oldest" saved-jobs sort (currently array-reverse, not a real timestamp sort) | `mobile-app/src/jobs/SavedJobsScreen.tsx` | S |
| 30 | Align website's signup outcome handling with the app's (or vice versa) for consistency | `website/src/app/register/RegisterView.tsx` / `mobile-app/src/auth/RegisterScreen.tsx` | S |
| 31 | Add category/price-flag (premium/bestseller) filter parity to mobile project filters | `mobile-app/src/project/FilterProjectsScreen.tsx` | S |
| 32 | Tighten `myProjects.service.ts` file-access fallback to distinguish real errors from RLS denials instead of masking both with sample data | `mobile-app/src/services/myProjects.service.ts` | S |

---

## Needs Verification (flagged by the auditors, not independently confirmed)

- Whether `create-custom-project-order` and `create-premium-order`/related Edge Functions enforce feature-conflict rules and the academic pricing override server-side (determines true severity of Gap #4/#5 in the executive summary).
- Whether `jobs`/`companies` tables are genuinely empty on the live production Supabase project right now (inferred from a code comment, not a live query).
- Whether migrations through 0112 (interview questions) are actually applied to the live database (confirmed as committed files, not verified against production).
- Whether the website's "download via the app only" purchase-flow design is an intentional product decision or an unfinished feature.
- Whether the resume "Add from My Projects" picker removal (regression) was an intentional product call made elsewhere and simply undocumented in commit history/memory.
- Column-level (not just table-level) completeness was not exhaustively checked for every one of the ~50 shared tables — the DB cross-check focused on table/RPC existence and the specific schemas named in each module brief.
