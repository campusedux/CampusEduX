# CampusEduX — Dynamic Website + Mobile‑App UI Synchronisation
## Phase 0 — Full Project Analysis & Implementation Plan

> Status: **ANALYSIS + PLAN. Owner decisions locked (§13). No application code changed yet.**
> This document is the deliverable required by the master prompt before any implementation
> ("DO NOT START CODING UNTIL YOU UNDERSTAND THE RELATIONSHIP…"). It maps every part of the
> ecosystem, states what is already done, records the 6 locked owner decisions, and lays out
> the phased plan (P1–P8) ready to execute.

_Generated: 2026-08-31 · working tree `/home/ganeshp8545/CampusEduX` (**not a git repo** — recommend `git init` + commit before P1 so the redesign is revertible)_

---

## 0. TL;DR

| Question | Answer |
|---|---|
| Are the ZIPs extracted? | Yes. `website/`, `mobile-app/`, `admin-panel/` are all present and building. |
| One Supabase project? | **Yes** — all three point at `https://oqwjooaapsotnncmhvtk.supabase.co` with the client‑safe `sb_publishable_…` anon key. No second DB, no second auth. |
| Is the website already dynamic + Supabase‑connected? | **Mostly.** ~34 routes, real reads for projects/jobs/companies/premium/referral/custom‑projects, real authed `/account/*`, real Razorpay checkout via the existing Edge Functions. STEPs 1–6 of a prior finish‑engagement are done; STEP 7 (prod sign‑off) is open. |
| What is the big remaining gap? | **UI/UX.** The website is a serif "editorial marketing" site (navy + marigold + Fraunces). The mobile app is a friendly indigo product UI (`#4F39F6`, white, rounded‑2xl cards, soft shadows, Ionicons). They do **not** feel like one product. This is the primary work. |
| Second gap | **Brand string** — the website shell still says "**ProjectHub** BY CAMPUSEDUX"; mobile + admin were fully de‑branded to **CampusEduX**. Master prompt §2/§15 requires identical branding. |
| Third gap | A handful of **still‑static** sections (placement tracks, resume page, marketplace filters) and **CMS content the website never reads** (`banners`, `announcements`, `offer_banners`, `prep_notes`, `cms_pages` for non‑legal pages). |
| Fourth gap | **Missing shared component system** + **loading/skeleton/error** primitives (§22, §25, §26). |

---

## 1. Repository layout

```
/home/ganeshp8545/CampusEduX
├── website/        Next.js 14.2.5 App Router  · package "campusedux-website"  · @supabase/ssr
├── mobile-app/     Expo SDK 55 · RN 0.83 · React 19 · react-navigation · nativewind 4 · zustand · react-query
├── admin-panel/    Next.js 14.2.5 · React 18 · @supabase/ssr · role_permissions matrix
├── .github/
└── .claude/
```

### Supabase migration history (single project, applied in numeric order per app)

| App | Migrations | Edge Functions | Notes |
|---|---|---|---|
| `mobile-app/supabase/migrations` | `0001_profiles` … `0040_test_attempt_scoring` (canonical data + RLS) | `create/verify-razorpay-order`, `create/verify-premium-order`, `create/verify-wallet-topup-order`, `create/verify-custom-project-payment`, `delete-account` + `_shared/{razorpay,client,cors,rateLimit}` | Canonical schema owner. |
| `admin-panel/supabase/migrations` | `001_admin_core` … `016_academic_visibility` (admin RLS, `role_permissions`, `is_admin()`, `has_permission()`, admin‑only tables) | — | Additive admin layer on the same DB. |
| `website/supabase/migrations` | `0001_contact_submissions` **(NOT applied yet)** | — | The only website‑specific migration: `contact_submissions` + `submit_contact_message()` RPC. |

> **Migrations still to apply** (from prior engagements, per memory): mobile `0026,0027,0028,0031,0033,0034,0035,0036,0037,0038,0039,0040` + admin `010–016` as applicable, plus website `0001_contact_submissions.sql`. Confirm the live project's `supabase_migrations.schema_migrations` before assuming anything is missing.

---

## 2. Single source of truth — VERIFIED (master prompt §7, §8, §32)

* **Supabase project**: one. `website/.env.local`, `admin-panel/.env.local`, `mobile-app` env all use `NEXT_PUBLIC_SUPABASE_URL = https://oqwjooaapsotnncmhvtk.supabase.co` and the publishable anon key. No service‑role key is present in `website/` (correct — it must never be).
* **Auth**: one. Website uses `@supabase/ssr` cookie sessions (`src/lib/supabase/{server,browser,authed-server}.ts`), same `auth.users` / `profiles` as the app. `requireUser()` in `src/lib/auth.ts` reads the same `profiles` row (`handle_new_user` trigger from `0001_profiles.sql`). Login is by mobile number → `rpc("email_for_mobile")` then password (mirrors the app).
* **Payments**: one. Website calls the **existing** Edge Functions unchanged — `create/verify-premium-order`, `create/verify-wallet-topup-order`, `create/verify-custom-project-payment`. Server‑side HMAC verification (`_shared/razorpay.ts`) is untouched. No secret key in the browser.
* **RLS**: unchanged by the website. The website reads only `select using (true)` catalog tables via the anon client and user‑owned rows via the authed session. It writes nothing that isn't already gated by an existing policy or a `SECURITY DEFINER` RPC.

**Conclusion:** the "one ecosystem" contract already holds. The redesign must not break it.

---

## 3. Design‑language gap — the core of this engagement

### 3.1 Token comparison

| Token | **Mobile app** (`mobile-app/src/constants/theme.ts`, `tailwind.config.js`) | **Website today** (`website/tailwind.config.ts`, `globals.css`) |
|---|---|---|
| Primary | Indigo `#4F39F6` + full 50–900 scale (`50 #EEF0FF`, `800 #3730A3`, `900 #312E81`) | Navy `#12213D` |
| "Premium"/accent | Amber `#F59E0B` / `#FBBF24`, gold pill on indigo | Marigold `#FFB100` / `#E09A00` |
| Success / info tints | `#16A34A` green, `#0EA5E9` sky, `#DB2777` pink, `#7C3AED` violet, `#0D9488` teal (category tiles) | Emerald `#1F7A53` only |
| Background | `#FFFFFF` page, `#F8F9FC` surface | Paper `#F5F6F2` |
| Text | `#111827` / `#6B7280` / `#9CA3AF` | `#20242B` body, navy headings, `#5C677D` slate |
| Type | System sans, **bold** weights, no serif | **Serif `Fraunces`** headings + `IBM Plex Sans` body |
| Radius | `sm 8 · md 12 · lg 16 · xl 24 · full` — cards are `rounded-2xl` (16) | `.empty-state` `4px`; buttons/cards `rounded-sm` (**2px**) |
| Elevation | Soft low shadow `CARD_SHADOW` (`shadowOpacity .06`, `radius 12`), `CARD_SHADOW_LG` for heroes | **None** — flat `border border-navy/10` (1 px) hairlines |
| Icons | `@expo/vector-icons` **Ionicons** (`cube`, `briefcase`, `school`, `document-text`…) | `lucide-react` installed, barely used; mostly `★`/`→` glyphs |
| Buttons | Solid indigo, pill / `rounded-lg`–`xl`, white label; secondary = indigo‑tinted chip "View →" | Square navy `rounded-sm`; secondary = navy outline that inverts on hover |
| Cards | White · `rounded-2xl` · soft shadow · image‑top (168 px) · dark translucent pill badge top‑right · rating row · "View →" chip | White · square · 1 px border · `aspect-[4/3]` image · serif title turns marigold on hover · flat marigold/emerald badge |
| Nav | Bottom tab bar (Home · Projects · Jobs · Learn · Profile) + hamburger **drawer** (gradient header, coloured icon tiles, 18 items) | Sticky top bar, 7 text links, no mobile menu, no bottom nav |

### 3.2 What "make it feel like the app" means concretely

1. **Retheme `tailwind.config.ts`** to the app palette: `primary` (with the 50–900 scale), `surface #F8F9FC`, semantic `success/danger/warning`, the category‑tile tints. Keep `navy`/`marigold`/`emerald` only if still referenced during migration, then remove.
2. **Drop the serif.** `Fraunces` → the app has no serif. Use one clean sans (IBM Plex Sans is fine to keep as the single family) with bold headings.
3. **`globals.css`**: page background `#FFFFFF`, add the card‑shadow utility, radius scale, and design‑system `@layer components` (`.btn`, `.card`, `.badge`, `.chip`, `.section-header`).
4. **Rebuild the shared components** (§3.3) so every page composes them instead of re‑inlining Tailwind.
5. **Navigation**: desktop header with the app's module set; **mobile** = slide‑in drawer mirroring `DrawerContent.tsx` (same 18 destinations, coloured icon tiles) + optional bottom nav for the 5 primary areas.
6. **Icons**: standardise on `lucide-react` and map 1:1 to the app's Ionicons choices (documented in a `componentIcon` map) so the vocabulary matches.
7. **Cards / badges / empty‑states / skeletons** must visually match the app component you can see in `mobile-app/src/components/cards/ProjectCard.tsx` / `JobCard.tsx` / `StateViews.tsx`.

### 3.3 Component inventory — build vs. exists

| Component (master prompt §22) | Website today | Action |
|---|---|---|
| `Header` / desktop nav | `NavBar.tsx` (text links, wrong brand) | Rebuild to app style |
| `MobileHeader` + `Drawer` / `BottomNavigation` | **missing** | Build — mirror `DrawerContent.tsx` |
| `Sidebar` (account) | inline in `account/layout.tsx` | Extract + restyle |
| `SearchBar` | inline `<input>` per page | Build shared |
| `ProjectCard` | exists (editorial style) | Reskin to `mobile ProjectCard` |
| `JobCard` | exists (editorial style) | Reskin to `mobile JobCard` |
| `CategoryCard` | inline `<Link>` on home | Build — icon tile like app Home |
| `CompanyCard` / `ReviewCard` / `PremiumCard` / `ResumeTemplateCard` | **missing** | Build |
| `EmptyState` / `LoadingSkeleton` / `ErrorState` | `.empty-state` CSS class only | Build components; match `mobile StateViews.tsx` |
| `Modal` / `Drawer` / `FilterSheet` | **missing** | Build (FilterSheet needed for §12 marketplace filters) |
| `Badge` / `Button` / `SectionHeader` / `Pagination` / `Rating` / `PriceDisplay` | **missing** (ad‑hoc markup) | Build; centralise |
| `Footer` | `Footer.tsx` (wrong brand) | Restyle + fix brand |
| `PremiumSubscribeButton`, `AuthNavLink`, `CmsLegalPage`, `JsonLd` | exist, keep | Restyle only |

`loading.tsx` / `error.tsx` route files: **none exist** (only one `not-found.tsx`). Every dynamic route needs a skeleton `loading.tsx` and an `error.tsx`.

---

## 4. Architecture — final target

```
                       ┌─────────────────────────────┐
   Admin Panel  ───────▶      Supabase (single)       ◀─────── Mobile App (Expo)
   (Next.js,           │  Postgres + RLS + RPC        │        react-query + zustand
    role_permissions)  │  Auth (profiles trigger)    │
                       │  Storage buckets            │
                       │  Edge Functions (Razorpay)  │
                       └──────────────┬──────────────┘
                                      │  anon client  → public catalog (select using(true), RLS-scoped)
                                      │  @supabase/ssr → authed cookie session (user-owned rows)
                                      │  functions.invoke → create/verify-*-payment (unchanged)
                       ┌──────────────▼──────────────┐
                       │   Website (Next.js 14)      │
                       │   Server Components (RSC)   │  ISR revalidate 120–300 for catalog
                       │   Server Actions for writes │  requireUser() gate on /account/*
                       │   thin "use client" islands │  Razorpay Checkout.js on 3 flows
                       └─────────────────────────────┘
```

* **Public reads**: `getPublicSupabase()` (anon, `persistSession:false`) in RSC, `revalidate` 120–300 s.
* **Authed reads/writes**: `createAuthedServerSupabase()` (cookie session) in `/account/*` and Server Actions.
* **No new business logic on the website** beyond presentation + form validation (`zod`) + the server‑side estimate re‑derivation for custom projects (already server‑controlled).

---

## 5. B — Route Matrix (website)

Legend — **Auth**: `public` / `user` (redirects to `/login`) · **Admin‑controlled**: data editable from the admin panel · **Status**: `live` (dynamic + styled‑old), `static` (hardcoded content), `partial`.

| Route | Feature | Supabase data | Auth | Admin‑controlled | Status |
|---|---|---|---|---|---|
| `/` | Home / hero + sections | `categories`, `projects` (sales_count / is_premium), `jobs`, `testimonials`, `faqs` | public | yes (catalog + CMS) | live · needs app UI · **not consuming** `banners`/`announcements`/`offer_banners`/`prep_notes` |
| `/projects` | Marketplace | `projects` (+ `category_id`, `ilike` title) | public | yes | partial — search = title‑only; **no** tech/price/sort/category‑UI/pagination (§12) |
| `/projects/[id]` | Project detail | `projects`, `reviews`, related `projects` | public | yes | live · verify download files stay gated · needs gallery/features/related UI |
| `/projects/trending` `/premium` `/best-sellers` `/new` | Curated lists | `projects` filtered | public | yes | live · reskin |
| `/projects/category/[category]` | Category listing | `projects` by `category_id`, `categories` | public | yes | live · reskin |
| `/jobs` | Jobs board | `jobs` (+ `ilike` title/location, `job_type`) | public | yes | partial — filters basic; type options hardcoded; no skills/salary filters, no pagination |
| `/jobs/[id]` | Job detail + apply/save | `jobs`, `companies`; **write** `resumes`(+`storage_path`), `applications`, `saved_jobs`; Storage `resumes` bucket (signed URL server‑side) | public view / `user` to apply | yes | live (STEP 3) · reskin `JobApplyPanel` |
| `/jobs/companies` `/jobs/companies/[id]` | Company directory | `companies`, `jobs` by company | public | yes | live · reskin, add `CompanyCard` |
| `/placement` | Placement overview | `companies` (list only); **`TRACKS` array is hardcoded** | public | partial | **static** — see §7. Should read `prep_notes`, aptitude/dsa/hr catalogs, leaderboard |
| `/resume` | Resume builder explainer | **none** (fully static) | public | no | **static** — should read `resume_templates` teaser + `cms_pages` |
| `/resume/templates` | Template gallery | `resume_templates` | public | yes | live · reskin, add `ResumeTemplateCard` |
| `/premium` | Plans + features | `premium_plans`, `premium_features`; authed = current sub | public / `user` for state | yes | live (STEP; `verify-premium-payment`) · reskin `PremiumCard` |
| `/custom-projects` | Explainer + pricing | `custom_project_pricing`, `custom_project_platform_pricing`, `custom_project_features` | public | yes | live (STEP 1 fix) · reskin |
| `/custom-projects/start` `/features` `/estimate` `/checkout` | 8‑step wizard | `custom_project_drafts` (autosave), 3 catalog tables (server estimate), `create/verify-custom-project-payment`, Storage `custom-project-uploads` | `user` | yes | live (STEP 4) · reskin · `noindex` |
| `/custom-projects/my-projects` `/[id]` | Request tracking + messaging | `custom_project_requests` + `_features`/`_files`/`_history`/`deliveries`/`_delivery_assets`/`_messages`; Storage `custom-project-deliveries` (signed URLs) | `user` | yes (status pipeline) | live (STEP 4) · reskin · `noindex` |
| `/referral` | Reward‑rule explainer | `reward_settings` (id=1) | public | yes | live · reskin |
| `/account` | Overview | `wallet_transactions`, `purchases`, `applications`, `referral_codes` | `user` | — | live · reskin · `noindex` |
| `/account/profile` | Edit profile | `profiles` (read + Server Action write) | `user` | — | live · reskin |
| `/account/purchases` | Purchased projects + downloads | `purchases`, `projects`, `project_deliverables`/`downloads` | `user` | — | live · **verify signed‑URL gating** (§12, §37) |
| `/account/applications` | Job applications | `applications`, `jobs` | `user` | — | live · reskin |
| `/account/saved-jobs` | Saved jobs | `saved_jobs`, `jobs` | `user` | — | live · reskin |
| `/account/resume` | Resumes + downloads | `resumes`, `resumes_builder`, `resume_downloads` | `user` | — | live · reskin |
| `/account/wallet` | Balance + top‑up | `wallet_transactions`; `create/verify-wallet-topup-order` | `user` | — | live · reskin `TopUpForm` |
| `/account/referral` | Code + history | `referral_codes`, `referrals`, `reward_settings` | `user` | — | live · reskin, add copy‑link |
| `/account/notifications` | Notifications | `notifications` (read + mark‑read Server Action) | `user` | yes (push CMS) | live · reskin · **not consuming** notification images |
| `/login` `/register` | Auth | `rpc("email_for_mobile")`, Supabase Auth | public | — | live (client islands + Suspense) · reskin |
| `/logout` | Sign out | Supabase Auth | `user` | — | live |
| `/delete-account` | Account‑deletion info | static + `delete-account` Edge Function (from app) | public | no | static (info page) — OK |
| `/contact` | Contact form | **write** `submit_contact_message()` RPC → `contact_submissions` | public | yes (admin `cms/contact`) | code done (STEP 5) · **RPC/table not applied** → degrades to mailto |
| `/support` `/faq` | Help | `faqs` | public | yes | live · reskin |
| `/about` | About | **static** (should read `cms_pages` 'about') | public | partial | static |
| `/terms` `/privacy-policy` | Legal | `cms_pages` via `CmsLegalPage` | public | yes | live (rows exist but `content` empty → honest empty state) |
| `/refund-policy` `/disclaimer` `/community-guidelines` `/project-license` | Legal | **static components** | public | partial | static — could route through `cms_pages` too |
| `/sitemap.xml` `/robots.txt` | SEO | `projects`,`jobs`,`categories`,`companies` (sitemap) | public | — | live · `/account`, wizard steps disallowed |

**Missing routes the app has and the site lacks:** saved/wishlisted **projects** (site only has saved jobs), a **notes / learning** browser (`prep_notes` is public CMS content and completely unused on web), placement **leaderboard**, a real **search results** page across projects+jobs+notes.

---

## 6. C — Mobile → Website mapping

| Mobile module / key screens | Data source(s) | Website equivalent | Parity |
|---|---|---|---|
| **Home** (`home/HomeScreen`, 6 category tiles + trending + latest jobs + learning) | `projects`, `jobs`, `prep_notes`, `offer_banners`, `notifications` | `/` | ⚠️ partial — no learning section, no banners/offers, category tiles are plain links |
| **Projects** (`project/*`: All, Category, Search, Filter, Details, Reviews, Similar, Wishlist, BuyNow, Payment*, Download*) | `projects`, `categories`, `reviews`, `wishlists`, `purchases`, `downloads` | `/projects`, `/projects/[id]`, curated lists, `/account/purchases` | ⚠️ partial — **no filters/sort**, **no wishlist page**, review‑write not on web |
| **Jobs** (`jobs/*`: Dashboard, Search, Filter, Details, Apply, Saved, Applied, Companies, Recommended, Alerts, ApplicationStatus) | `jobs`, `companies`, `applications`, `saved_jobs`, `job_alerts`, `resumes` | `/jobs`, `/jobs/[id]`, `/jobs/companies`, `/account/{applications,saved-jobs}` | ✅ good — apply + save live · missing job‑alerts UI, recommended feed, filter sheet |
| **Placement / "Learn"** (`placement/*`: Aptitude, Quant, Logical, Verbal, DSA dashboard + CodeEditor + judge, HR, PracticeTestList, LiveTest, TestInstruction/Result, CompanyMockTest, PerformanceAnalysis, Notes list + detail) | `aptitude_topics`, `dsa_problems/topics`, `user_dsa_progress`, `hr_questions`, `practice_tests`, `test_questions`, `test_attempts`, `companies`, `prep_notes`, `prep_note_bookmarks` | `/placement` (static) | ❌ **weak** — test‑taking is legitimately app‑only, but topic catalogs, **notes**, company prep and leaderboard are all web‑able and absent |
| **Resume Builder** (`resume/*`: Dashboard, Editor, Personal/Education/Skills, Preview, Templates, ATSScore, DownloadPDF, History, Tips) | `resumes_builder`, `resume_templates`, `resume_downloads` | `/resume` (static), `/resume/templates`, `/account/resume` | ⚠️ partial — templates + history live; editor + ATS scoring app‑only (reasonable); explainer is static |
| **Custom Project Builder** (`customProjects/*`: 8‑step wizard + MyCustomProjects + Detail + messaging) | `custom_project_*` (14 tables), 2 Edge Functions, 2 Storage buckets | `/custom-projects/*` | ✅ **full parity** (STEP 4) — reskin only |
| **Premium** (`premium/*`: Plans, Features, Payment, MembershipDetails, Success) | `premium_plans`, `premium_features`, `premium_subscriptions` | `/premium`, `/account` (state) | ✅ good — reskin |
| **Referral & Wallet** (`referral/*`, `profile/WalletScreen`) | `referral_codes`, `referrals`, `reward_settings`, `wallet_transactions` | `/referral`, `/account/referral`, `/account/wallet` | ✅ good — reskin · add leaderboard (optional) |
| **Profile / Settings** (`profile/*`, `settings/*`: Edit, Change Course/Branch/Year, Settings, Privacy, Theme, Language, Notifications, Help, About) | `profiles`, `courses`, `branches`, `academic_years` | `/account/profile` | ⚠️ partial — no course/branch/year editor on web (free‑text fields shown read‑only) |
| **Notifications** (`home/NotificationScreen`) | `notifications` | `/account/notifications` | ✅ good |
| **My Projects / delivery** (`myProjects/*`: Purchased, SourceCode, DownloadFiles, Documentation, VersionHistory, Support) | `purchases`, `project_deliverables`, `downloads` | `/account/purchases` | ⚠️ partial — verify per‑file signed‑URL gating + version history |
| **Auth & onboarding** (`auth/*`: Onboarding1‑3, Login, Register, OTP, Forgot/Reset, SelectCourse/Branch/Year, Welcome) | Supabase Auth, `profiles`, catalog | `/login`, `/register` | ⚠️ partial — no onboarding carousel, no academic‑setup step (web relies on app for first‑run) |
| **Legal hub** (`legal/*`) | `cms_pages`, bundled `legal/content/*` | `/terms`, `/privacy-policy`, + static legal pages | ✅ good — wire remaining pages to `cms_pages` |

**Rule applied:** translate mobile UX into responsive web UX — do **not** copy the tab/stack navigation architecture literally (master prompt §34).

---

## 7. Hardcoded / static data still in the website (master prompt §33)

| Location | Hardcoded thing | Dynamic source that exists | Verdict |
|---|---|---|---|
| `src/app/placement/page.tsx` | `TRACKS` (4 objects: Aptitude / DSA / HR / Company‑wise) | `aptitude_topics`, `dsa_topics`, `hr_questions`, `prep_notes` + admin `placement/*` | **Replace** — at least drive counts/labels from DB; add a notes browser |
| `src/app/resume/page.tsx` | Whole page — heading, 4 bullets, no query | `resume_templates`, `cms_pages` | **Replace** the marketing copy container is fine; pull a template teaser + ATS blurb from DB |
| `src/app/about/page.tsx` | Whole page | `cms_pages` row `about` (admin `cms/pages`) | **Wire** to CMS with static fallback |
| `src/app/jobs/page.tsx` | `<option>` job types (`Full Time`…) | `jobs.job_type` distinct, or a `job_types` lookup | Minor — derive from data |
| `src/components/{NavBar,Footer}.tsx` | Link lists, **"ProjectHub" brand string**, `alternateName:"ProjectHub"` in `layout.tsx`, "app name: ProjectHub" in `about` | Brand = `CampusEduX` everywhere in app + admin | **Fix brand** (see §10). Link lists staying in code is acceptable. |
| `src/app/page.tsx` | Hero headline/sub copy, CTA labels | — | Acceptable static (marketing copy). Could later move to `cms_pages`/`banners`. |
| `.empty-state` CSS | Placeholder copy referencing env vars | — | Replace with real `EmptyState` component |

**CMS content the website never reads** (admin can edit it, site ignores it — violates §6/§19):

* `banners` (admin `cms/banners/[placement]`) — no hero/banner slot on web.
* `announcements` (admin `cms/announcements`) — no announcement bar.
* `offer_banners` (mobile Home consumes) — no offers strip on web.
* `prep_notes` / `prep_note_bookmarks` — **entire Learning surface missing on web** though `prep_notes` is world‑readable when published.
* `push_notifications` + notification images (migration `0032`/`012`) — web notifications list ignores images.
* `cms_pages` rows other than `terms`/`privacy` (`about`, `refund`, `disclaimer`, …) — static components instead.
* `testimonials` — consumed on `/` only; could also feed `/about`.

---

## 8. D — Database dependencies (website)

### Tables read via the **anon** client (public, `select using(true)` / RLS‑scoped)
`categories`, `projects`, `reviews`, `companies`, `jobs`, `premium_plans`, `premium_features`, `resume_templates`, `reward_settings`, `faqs`, `testimonials`, `cms_pages`, `custom_project_pricing`, `custom_project_platform_pricing`, `custom_project_features`.
**Should add:** `banners`, `announcements`, `offer_banners`, `prep_notes`.

### Tables read/written via the **authed** session (user‑owned, RLS `user_id = auth.uid()`)
`profiles`, `purchases`, `applications`, `saved_jobs`, `resumes`, `resumes_builder`, `resume_downloads`, `wallet_transactions`, `referral_codes`, `referrals`, `notifications`, `custom_project_drafts`, `custom_project_requests` (+ `_request_features`, `_request_files`, `_request_history`, `_deliveries`, `_delivery_assets`, `_messages`).
**Should add (parity):** `wishlists` (saved projects), `prep_note_bookmarks`.

### RPCs
`email_for_mobile(p_mobile)` (login), `submit_contact_message(p_name,p_email,p_message,p_client_key)` **(needs `website/supabase/migrations/0001` applied)**.
Indirect via RLS: `is_admin()`, `has_permission()`, `current_user_course_id()`, `current_user_branch_id()`, `content_visible_to_current_user(...)`.

### Edge Functions (unchanged, invoked from the browser island → server verify)
`create-premium-order` / `verify-premium-payment`, `create-wallet-topup-order` / `verify-wallet-topup-payment`, `create-custom-project-order` / `verify-custom-project-payment`.
**To wire (owner decision #3):** `create-razorpay-order` / `verify-razorpay-payment` for **direct project purchase** on `/projects/[id]` — same pattern as the app (`mobile-app/src/services/payment.service.ts` + `usePurchaseFlow`), reuse `src/lib/payments.ts::interpretVerifyResponse()`, write nothing client‑side, let the verify function create the `purchases` row.

### Storage buckets
| Bucket | Visibility | Website use |
|---|---|---|
| `project-media` | public | project thumbnails / gallery (read) |
| `resume-templates` | public | template previews (read) |
| `resumes` | **private** | job‑apply upload `<uid>/<ts>_<name>`, server mints signed URL |
| `custom-project-uploads` | private | wizard uploads `<uid>/uploads/...` |
| `custom-project-deliveries` | private | delivery assets, signed URLs, RLS‑gated to `status='delivered'` |
| `avatars` | public | profile avatar (read; write is app‑only today) |
| `project-files` | private | **must stay server‑gated** — purchased source code, never a public URL |
| `site` | public | misc CMS assets |

---

## 9. E — Security posture

### Already correct (keep)
* No service‑role key in `website/`. Anon client is read‑only + `persistSession:false`.
* CSP in `next.config.js` (self + `*.supabase.co` + Razorpay only), `X‑Content‑Type‑Options`, `Referrer‑Policy`, `Permissions‑Policy`, `frame-ancestors 'none'`.
* All money flows use the existing server‑verified Edge Functions; `interpretVerifyResponse()` is the single "did verify succeed" gate (`src/lib/payments.ts`).
* Server Actions re‑check `getOptionalUser()` / `requireUser()`; client‑supplied URLs are never trusted (job‑apply mints its own signed URL).
* `/account/*`, custom‑project wizard, `noindex` + robots‑disallowed.
* Custom‑project estimate is re‑derived server‑side from catalog tables; token amount is a server constant.

### To verify / harden during implementation (§37)
1. **Download gating** — confirm `/account/purchases` (and any project‑detail "download") never exposes `project-files` without an ownership check + short‑lived signed URL. Do **not** render protected file links pre‑purchase (§12).
2. **IDOR sweep** — every `/account/*` query already filters by `auth.uid()`; add explicit `.eq("user_id", user.id)` even where RLS covers it, and add the deferred cross‑user RLS tests (STEP 6 leftover — needs a confirmed test login).
3. **Academic visibility & the public site — DECIDED: add a public read path (owner decision #4).** For an anonymous visitor `current_user_course_id()` is `NULL`, so the current `projects_select_public` / `jobs_select_public` policies (recreated by migration `0036`) show **only `target_type='global'` rows**. Target approach — an **additive** migration pair (`mobile-app/…/0041_public_catalog.sql` + canonical `admin-panel/…/017_public_catalog.sql`, same guarded body, validated on a scratch PG17 first):
   * Add a separate permissive `SELECT` policy **`TO anon`** on `projects` and `jobs` with `USING (true)` (catalog is intentionally public), leaving the existing `TO authenticated` policy — with the academic `content_visible_to_current_user(...)` rule — **unchanged**. Result: logged‑out web = full catalog; every authenticated context (mobile app, logged‑in website) keeps the exact course/branch scoping it has today.
   * `prep_notes` keeps its `is_published`‑gated public policy (already world‑readable when published) — no change needed for the Learning surface.
   * Purchase, downloads, reviews‑write, applications, wallet, custom‑project data stay authenticated + owner‑scoped. **Do not** hand the website a service‑role key.
   * Confirm `reviews`, `categories`, `companies` already have anon `SELECT` (they do via `select using(true)`); if any is `TO authenticated`, add the same anon path.
4. **Open redirect** — `?redirect=` on `/login` must be validated to same‑origin relative paths.
5. **XSS** — any admin CMS HTML (`cms_pages.content`, announcements) rendered on web must be sanitised or rendered as text/Markdown, never `dangerouslySetInnerHTML` of raw DB text.
6. **Contact form** — rate‑limited RPC exists; keep the IP‑derived client key; do not add an anon `insert` policy on `contact_submissions`.
7. **Razorpay key id** — only the **public** key id may reach the browser; confirm it comes from `NEXT_PUBLIC_*` and the secret stays in the Edge Function env.

### Do NOT
Weaken RLS · add a second auth · duplicate the DB · expose secrets · modify shared migrations non‑additively · change mobile/admin behaviour.

---

## 10. Brand consistency (master prompt §2, §15, §38)

| Surface | Current | Required |
|---|---|---|
| Mobile app | `CampusEduX` (splash, `constants/brand.ts`, de‑branded in fix‑audit engagement) | — |
| Admin panel | `CampusEduX` (Logo, titles, `package.json campusedux-admin`) | — |
| **Website `NavBar`** | `ProjectHub` + `BY CAMPUSEDUX` sub‑label | `CampusEduX` wordmark, app style |
| **Website `Footer`** | `ProjectHub` + "by CampusEduX" | `CampusEduX` |
| **`layout.tsx`** metadata | `alternateName: "ProjectHub"`, description "CampusEduX (ProjectHub)…" | Drop `ProjectHub` unless it is a real registered alias |
| **`about/page.tsx`** | "CampusEduX (app name: ProjectHub)" | "CampusEduX" |

> **DECIDED (owner #1): remove "ProjectHub" entirely, no alias.** Every row's "Required" column is now "`CampusEduX`". Also drop `alternateName: "ProjectHub"` from the Organization JSON‑LD and the "(ProjectHub)" mentions in the `layout.tsx` description and `about` copy.

---

## 11. F — Production checklist (target state)

| Area | Now | Target |
|---|---|---|
| UI matches app | ❌ editorial theme | ✅ retheme + shared components |
| Responsive 320→1440 | ⚠️ desktop‑first, no mobile nav | ✅ mobile‑first, drawer + bottom nav, no h‑scroll |
| Supabase‑connected | ✅ mostly | ✅ + banners/announcements/notes/CMS pages |
| Authentication shared | ✅ | ✅ (add academic‑setup + onboarding optional) |
| RLS respected | ✅ | ✅ + cross‑user tests + additive anon catalog policy (§9.3), authed scoping unchanged |
| Payments server‑verified | ✅ | ✅ + direct project purchase via `create/verify-razorpay-order` |
| Storage gating | ⚠️ verify | ✅ audited, no protected file leaks |
| SEO | ✅ metadata/OG/sitemap/robots/Organization JSON‑LD | ✅ + `Product`/`JobPosting`/`FAQPage`/`BreadcrumbList`, dynamic OG images |
| Performance | ✅ RSC + ISR | ✅ + skeletons, image sizes, pagination, no full‑table fetches |
| Accessibility | ⚠️ partial | ✅ semantic landmarks, focus states, labelled forms, accessible drawer/modal |
| Loading / error / empty states | ❌ CSS class only | ✅ components + `loading.tsx`/`error.tsx` per route |
| Testing | ✅ 54 Vitest (STEP 6) | ✅ + component tests + RLS tests + `typecheck`/`lint`/`build` green |
| Build | ✅ green (STEP 1) | ✅ stays green |

---

## 12. G — Gaps, platform boundaries, blockers

### Legitimately app‑only (preserve the boundary, link out with a polished web page)
* **Placement test‑taking**: live tests, timed practice, DSA code editor + judge (`0040_test_attempt_scoring`), attempt scoring. Web shows catalogs, notes, company prep, progress **read‑only**; "take the test in the app".
* **Resume editor**: full section editing + PDF render + ATS scoring stays in the app; web shows templates, ATS explainer, download history.
* ~~**Direct project purchase**~~ — **now in web scope** (owner #3): reuse `create/verify-razorpay-order`. Only the app‑native Razorpay SDK path changes (web uses Checkout.js, already solved for premium/wallet/custom).
* **Push notifications**, **avatar upload**, **onboarding carousel**: app‑native; web account page is read/manage only.

### Blockers to a clean production sign‑off (carried from prior engagement)
1. `website/supabase/migrations/0001_contact_submissions.sql` **not applied** → contact form degrades to `mailto:`.
2. Owner‑provided env still blank: `NEXT_PUBLIC_LEGAL_ENTITY_NAME`, `NEXT_PUBLIC_BUSINESS_ADDRESS`, `NEXT_PUBLIC_GOVERNING_JURISDICTION`, `NEXT_PUBLIC_PLAY_STORE_URL` → footer + legal pages show "not configured".
3. `cms_pages` rows `terms` / `privacy` have empty `content` → honest empty state until admin fills them.
4. No confirmed **test login** → cross‑user RLS verification (user A ≠ user B) still deferred.
5. `faqs` / `testimonials` tables empty → sections hidden.
6. Migration state of the live project unverified from here (no DB access, no service‑role key).

### Cannot be done from this environment
Running against live Supabase, real device screenshot comparison, applying migrations, deploying Edge Functions, toggling auth providers.

---

## 13. Proposed implementation plan (for approval — nothing done yet)

Ordered so each phase ends with `typecheck` + `lint` + `test` + `build` green and nothing broken in mobile/admin.

| Phase | Scope | Output |
|---|---|---|
| **P1 — Design system + brand** ✅ **DONE** | Retheme `tailwind.config.ts` to the app palette + 50–900 scale; rewrite `globals.css` (white bg, radius scale, `card`/`card-lg` shadow, `@layer components` for `.btn-*`/`.card`/`.badge`/`.chip`); **dropped `Fraunces` + `IBM Plex Sans`** → system sans (verified: the app loads no custom font); **removed "ProjectHub" site‑wide** → CampusEduX; new `src/lib/brand.ts`. Legacy tokens kept as app‑aligned aliases for the migration. `lucide-react` standardisation deferred to P2/P3 (it's a dep but unused today). | New tokens; brand = CampusEduX; `typecheck` + `lint` (0 warnings) + `build` (47 pages) green. mobile/admin untouched. |
| **P2 — Shared components** ✅ **DONE** | Built `src/components/ui/*` + barrel: `Button` `Badge` `Chip`/`TagPill` `SectionHeader` `Rating` `PriceDisplay` `EmptyState` `ErrorState` `Skeleton` (+`SkeletonProjectCard`/`JobCard`/`Text`/`CardGrid`) `Modal` `Drawer` `FilterSheet` `SearchBar` `Pagination` `CategoryCard` `CompanyCard` `ReviewCard` `PremiumCard` `ResumeTemplateCard`; new `src/lib/cn.ts`. Reskinned `ProjectCard`/`JobCard` to the app card design (prop shapes preserved; `ProjectCardData.original_price?` + `JobCardData.company_logo_url?` added). Icons = `lucide-react`. Not yet wired into pages (P4–P7). | `typecheck` + `lint` (0) + `build` (47) + `vitest` 54/54 green. mobile/admin untouched. |
| **P3 — Navigation** | Desktop header (app module set), mobile slide‑in `Drawer` mirroring `DrawerContent.tsx` (18 destinations, coloured icon tiles), optional bottom nav; restyle account sidebar; `Footer`. | Responsive nav, no h‑scroll 320→1440. |
| **P4 — Home + CMS surfaces** | Reskin `/`; add **announcement bar** (`announcements`), **hero/banner** (`banners`/`offer_banners`), **Learning** section (`prep_notes`), section‑only‑if‑data rule; dynamic OG. | Home matches app Home; consumes all CMS. |
| **P5 — Marketplace + Jobs + direct purchase** | Migration `0041/017_public_catalog` (anon `SELECT` path for `projects`/`jobs`, validated on scratch PG17 — §9.3); `FilterSheet` (category, tech, price, sort, premium/best‑seller/new), pagination/infinite scroll; reskinned detail pages (gallery, features, related, reviews); **direct project purchase** via `create/verify-razorpay-order` + Checkout.js island + server‑minted download links (no pre‑purchase file exposure); jobs filters + recommended feed + alerts UI. | §12/§13/§37 satisfied. |
| **P6 — Placement / Learn** | Real `/placement` + `/notes` browser (list/detail/bookmark for authed), topic catalogs, company prep, leaderboard (read‑only); clear "take tests in the app" boundary. | §14 satisfied within web scope. |
| **P7 — Resume, Premium, Referral, Custom, Account** | Reskin all remaining routes to components; add **saved projects** (`wishlists`) + academic editor (`courses`/`branches`/`academic_years`) on `/account/profile`; notification images. | Full parity where safe. |
| **P8 — SEO, a11y, perf, tests, audit** | `Product`/`JobPosting`/`FAQPage`/`BreadcrumbList` JSON‑LD; `loading.tsx`/`error.tsx` per route; a11y pass; image sizing; component + RLS tests; security audit (§37); final side‑by‑side vs app. | `[READY]` or `[READY WITH MANUAL ACTIONS]`. |

### Locked decisions (owner, 2026-08-31)
1. **ProjectHub → removed entirely.** "CampusEduX" everywhere, no legal alias. Strip it from `NavBar`, `Footer`, `layout.tsx` (`alternateName` + description), `about/page.tsx`, and anywhere else it appears.
2. **Font / design language: match the mobile app exactly.** Drop `Fraunces` (serif) — the app has no serif. Use the app's single sans family and its weight/scale conventions. (Implementation note: verify what the app actually loads — `mobile-app` has `expo-font` but check `App.tsx`/`useFonts`; if it ships no custom face, use a system sans stack. Keep `IBM Plex Sans` only if it visually matches.)
3. **Direct project purchase on the website: YES.** Wire the existing `create-razorpay-order` / `verify-razorpay-payment` Edge Functions (same server‑side HMAC verification). Never expose `project-files` before a verified purchase — download links are minted server‑side, ownership‑checked, short‑lived.
4. **Public project catalog: YES — add a public read path.** Logged‑out visitors browse the full catalog; login is required only for purchase and other protected actions. See §9.3 for the safe (additive, RLS‑preserving) approach.
5. **Bottom navigation: YES on mobile web**, mirroring the app's structure; on desktop it adapts to a proper responsive top/side navigation.
6. **Test login + migrations:** owner will supply a test account. Apply pending migrations (incl. `website/supabase/migrations/0001_contact_submissions.sql`) **only after** verifying compatibility with the live schema and that mobile + admin are unaffected — validate against a scratch Postgres first, as prior migrations were.

---

## 14. Critical rules being honoured

Reuse working code · Supabase is the single source of truth · one auth · no secret exposure · no RLS weakening · additive migrations only · don't break mobile/admin · mobile app is the primary UI reference · brand = **CampusEduX** · end state = **Dynamic + Responsive + Supabase‑connected + Mobile‑consistent + Admin‑controlled + Secure + SEO‑ready + Production‑ready** · run `typecheck`/`lint`/`test`/`build` before declaring done · fix real errors, never suppress.
