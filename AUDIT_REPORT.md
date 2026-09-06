# CampusEduX / ProjectHub — Full-Project Audit (Phase 1 report + Phase 2 cleanup)

**Date:** 2026-09-06
**Branch:** `audit/full-project-review` (checkpoint commit `34d05e0`, forked from `website-mobile-ui-sync` @ `4a736cb`)
**Scope:** `mobile-app/` (Expo / React Native), `website/` (Next.js 14), `admin-panel/` (Next.js 14) — all on one Supabase project.
**Method:** `tsc --noEmit`, `eslint` / `next lint`, production build (`next build`; `expo export --platform web` as the read-only proxy for the mobile build), `jest` / `vitest`, plus static scans for TODO/stub patterns, dead files, dependency usage, cross-file duplication, and committed secrets. Native `expo prebuild` / EAS builds were not run (they generate `ios/`/`android/` — a write); the web export exercises the same Metro bundle graph.

> **Status: Phase 2 cleanup complete** (approved 2026-09-06). Sections 0–G below are the original Phase 1 findings, left as the record. **Section P2 (immediately below the Headline)** lists exactly what was changed, the before/after numbers, and what was deliberately left for you to decide.

---

## 0. Headline

**The project is in unusually good health.** All three build gates are green, there is almost no dead code, no committed secrets, and no service-role key anywhere in client/app code. Findings below are overwhelmingly *polish* and *product-decision* items, not blockers. There are **0 blocking errors** across all three codebases.

| | Mobile App | Website | Admin Panel |
|---|---|---|---|
| **Total errors** (tsc + lint + build) | **0 errors**, 1 lint warning | **0 errors**, 0 warnings | **0 errors**, 0 warnings |
| Tests | 40 suites / **288 pass** (jest) | 33 files / **278 pass**, 12 skipped¹ (vitest) | 9 files / **104 pass** (vitest) |
| Production build | ✅ `expo export` web OK (4.2 MB bundle) | ✅ `next build` — 57 routes | ✅ `next build` — 97 routes |
| **Total unused files** | **0** | **2** (`CmsLegalPage.tsx`, `resumeBuilder/sampleResume.ts`) | **0** |
| **Total unused dependencies** | **2 candidates** (`expo-constants`, `expo-splash-screen` — both low-risk to keep) | **0** | **0** |
| **Duplicate-code instances** | **3–4 within-app screen pairs** + managed cross-app (legal ×9 files, resume engine ×5 modules) | shares the cross-app resume/legal duplication; **0 within-app** | **1 within-app** (`CategoryManager` ×3) |

¹ The 12 skipped website tests are `tests/lib/resumeFlowE2E.test.ts`, an opt-in live-Supabase E2E suite (`describe.skip` unless a DB socket is present). Not a defect.

**Cross-project issues (not owned by one codebase):**
- **Website has no CI workflow.** `.github/workflows/` contains `mobile-ci.yml` and `admin-ci.yml` only.
- **`@supabase/supabase-js` version drift:** `^2.57.0` (mobile) vs `^2.43.0` (website + admin).
- **`zod` major drift:** `^4.1.5` (mobile) vs `^3.23.0` (website).
- **`ANTHROPIC_API_KEY`** (used by website resume AI-assist) is **not documented** in `website/.env.example`.
- Repo root holds 3 large historical analysis `.md` files (245 KB total) plus an empty `node_modules/.vite` cache dir.

---
---

# P2. Phase 2 — Cleanup outcomes (2026-09-06, approved)

Executed as small, revertable commits on `audit/full-project-review`:

| Commit | Scope | Change |
|---|---|---|
| `34d05e0` | — | checkpoint snapshot of the working tree (Phase 1 safety net) |
| `be610fa` | — | this audit report (Phase 1) |
| `075c7cd` | website | **delete dead files** — `src/components/CmsLegalPage.tsx`, `src/lib/resumeBuilder/sampleResume.ts` (0 inbound refs each) |
| `a8cedea` | website + admin | **deps** — bump declared `@supabase/supabase-js` floor `^2.43.0` → `^2.57.0` to match mobile (both already resolve to `2.112.4`; no tree change) |
| `2e31b10` | website | **docs** — add optional `ANTHROPIC_API_KEY` to `.env.example`; add a precise `TODO` at the `/compiler` "Ask AI to fix" stub |
| `49e0c59` | repo / website | **ci** — add `.github/workflows/website-ci.yml` (typecheck · lint · test · build); verified `next build` is green with no Supabase env |
| `bf38452` | admin | **docs** — fix stale `admin.ts` service-role comment in `lib/supabase/server.ts`; add a precise `TODO` on `createBackup()` (records a request, produces no artifact) |
| `f6bb5da` | mobile | **lint** — targeted `eslint-disable` + comment on the `ReactNavigation` global augmentation in `navigation.types.ts:215` |

Also: removed the stray repo-root `node_modules/.vite` cache dir (gitignored, untracked — no commit).

## Before → After

| Metric | Mobile | Website | Admin |
|---|---|---|---|
| TypeScript errors | 0 → **0** | 0 → **0** | 0 → **0** |
| ESLint errors / **warnings** | 0 / **1** → **0 / 0** | 0 / 0 → **0 / 0** | 0 / 0 → **0 / 0** |
| Production build | ✅ → ✅ (`expo export` web) | ✅ 57 routes → ✅ 57 routes | ✅ 97 routes → ✅ 97 routes |
| Tests | 288 pass → **288 pass** | 278 pass / 12 skip → **278 / 12** | 104 pass → **104 pass** |
| Dead files | 0 → 0 | **2 → 0** | 0 → 0 |
| Removable unused deps | 0 → 0 | 0 → 0 | 0 → 0 |
| CI workflow | ✅ → ✅ | **❌ → ✅** | ✅ → ✅ |
| Undocumented required/optional secret | — | **1 → 0** | — |
| `@supabase/supabase-js` floor drift | baseline `^2.57.0` | **`^2.43` → `^2.57`** | **`^2.43` → `^2.57`** |

The build gates were **already green** in Phase 1, so there was no error count to "bring down". The net measurable result: **−1 lint warning, −2 dead files, +1 CI pipeline, −1 undocumented secret, −1 version drift, +3 precise TODOs** on features that were quietly incomplete — and every gate on every project is still green (re-run end-to-end after the last commit).

## Deliberately NOT auto-fixed — needs a decision from you, not a code change

1. **Mobile duplicate Settings / About / Notification screens** — `src/profile/SettingsScreen.tsx` vs `src/settings/SettingsScreen.tsx` (both routed, 186 differing lines); same for `AboutScreen` (profile vs settings) and `NotificationScreen` (home vs settings). Deleting a *routed* screen requires you to choose which flow — the **Profile tab** or the **drawer "SettingsModule"** — is canonical. No safe mechanical fix. *(Phase 1 §E · Mobile)*
2. **Mobile `SAMPLE_*` fallback in 8 catalog services** — intentional offline/demo resilience that masks backend errors with fixture data (fake projects/jobs/prices) on any Supabase error *or* empty result. Money paths already `throw` and are unaffected. The fix is a product call: gate behind a `__DEV__`/demo flag, show a "sample data" banner, or remove. Left as documented. *(Phase 1 §A · Mobile)*
3. **Cross-app duplication — legal JSON (9 identical files) + résumé engine (5 modules), mobile ↔ website.** Extracting to a shared module needs npm/pnpm **workspaces** set up at the repo root (there is no root `package.json`), which risks breaking Metro *and* Next module resolution. The legal copy is already guarded by `scripts/sync-legal.mjs` + a drift-guard test. Deferred as an infrastructure decision. *(Phase 1 §E)*
4. **Admin `CategoryManager` ×3** — the three copies have diverged 100–176 lines (≈80% different); a shared component would need heavy per-resource config props for little gain. Left in place (Phase 1 rated this low priority). *(Phase 1 §E · Admin)*
5. **Website `/compiler` "Ask AI to fix"** — flagged with a precise `TODO` (`2e31b10`). Wiring it is a feature build (new `/api/compiler/assist` route + prompt + rate limit + accept/reject diff UI), not cleanup. *(Phase 1 §A · Website)*
6. **Admin `createBackup()`** — flagged with a precise `TODO` (`bf38452`). Producing a real dump/artifact is a product/ops decision (mechanism, retention, cost); the DB itself is covered by Supabase PITR and the page copy is already honest. *(Phase 1 §A · Admin)*
7. **`zod` major drift (mobile `^4` vs website `^3`)** — cannot be aligned mechanically: mobile's `@hookform/resolvers@5.9.1` **requires** zod v4, and migrating the website's 9 zod files to v4 is a breaking-change pass with no current functional payoff. Needs a planned migration. *(Phase 1 §D)*
8. **`typescript` / `eslint` minor drift** (mobile TS 5.9 / ESLint 9 flat-config vs Next apps TS 5.4 / ESLint 8) — harmonising is optional and risks surfacing fresh diagnostics in a currently-green tree; belongs in a dedicated toolchain-bump PR. *(Phase 1 §D)*
9. **`expo-constants` / `expo-splash-screen` (mobile)** — evaluated for removal, **kept**. `expo-constants` is pulled in transitively by 5+ Expo packages (`expo-linking`, `expo-notifications`, `expo-asset`, `@expo/router-server`, `expo`) and should stay pinned for Expo's dependency validation. `expo-splash-screen` is consumed by Expo's native splash **config plugin** (`app.json` `splash` block) even though no JS imports it — removing it risks a native-splash regression not verifiable without an EAS/prebuild run. *(Phase 1 §D · Mobile — revises the "2 candidates" line to "0 safely removable")*
10. **Full table-by-table RLS verification** — still recommended as a separate security pass; out of scope for cleanup. *(Phase 1 §G)*
11. **Repo-root historical docs** (`LEARNING_UNIFICATION_AUDIT.md`, `LEGAL_COMPLIANCE_AUDIT.md`, `WEBSITE_MOBILE_SYNC_ANALYSIS.md` — 245 KB) — left untouched. Whether they move to `docs/` or are deleted is your call, and `WEBSITE_MOBILE_SYNC_ANALYSIS.md` is git-tracked so removing it is a history decision. *(Phase 1 §C)*

---
---

# MOBILE APP (`mobile-app/`)

**Summary**

- **Errors:** 0 TypeScript errors · 0 ESLint errors · **1 ESLint warning** · `expo export` web build OK · 288/288 jest tests pass.
- **Unused files:** 0 (no orphan modules; all 4 assets referenced; no `_old`/scratch files).
- **Unused dependencies:** 2 candidates (`expo-constants`, `expo-splash-screen`), both low-risk to keep.
- **Duplicate code:** 3 confirmed + 1 suspected within-app near-duplicate screen pairs; shares the managed cross-app resume/legal duplication.

## A. Broken / incomplete functions

| Status | Location | Finding |
|---|---|---|
| 🟡 Design risk | `src/services/project.service.ts`, `job.service.ts`, `home.service.ts`, `referral.service.ts`, `premium.service.ts`, `myProjects.service.ts`, `academic.service.ts`, `resume.service.ts` | **Silent fallback to bundled fixtures.** Each wraps Supabase reads so that on *any* error **or empty result** it returns hard-coded `SAMPLE_*` data from `src/data/sample*Content.ts` and logs `console.info("… using sample content")`. If an RLS policy breaks, a table is renamed, or the network fails, users see plausible fake catalog data (fake projects, prices, jobs) rather than an error/empty state. **Mitigation already in place:** money paths (`payment.service.ts`, `wallet.service.ts`) correctly `throw` and never fall back (see `wallet.service.ts:60` comment). Recommend gating the catalog fallback behind `__DEV__` / an explicit "demo mode", or showing a "showing sample data" banner. *(Already on owner's review list per project memory.)* |
| 🟡 No-op on failure | `src/services/project.service.ts:339` (`recordDownload`), `src/services/myProjects.service.ts:144` (`markVersionUpdated`), `src/services/resume.service.ts:263/325/412` | Write operations silently no-op (`"… not persisted"`) when the backend call fails — same root pattern as above. |
| ✅ Clean | entire `src/` | **No** `TODO` / `FIXME` / `HACK` / `XXX` / `// not implemented` comments. **No** empty `catch {}` blocks. **No** dead `onPress={() => {}}` / `disabled={true}` handlers. |
| ✅ Not an issue | `src/lib/notify.ts`, `src/auth/LoginScreen.tsx:51` | "stub" references here are *documentation* of React Native's `Alert` being a no-op on Expo Web — the code handles it correctly with an inline banner. |

**DB schema references:** no automated schema diff is possible without the live database. Project memory records one open item carried forward here for owner DB verification (not a code bug): the `coding_problem_detail` RPC returns `null` on the shared live project — migration `0048`/`025` may not be applied.

## B. Errors and warnings

| Check | Command | Result |
|---|---|---|
| TypeScript | `tsc --noEmit` | **0 errors** |
| Lint | `eslint .` | **0 errors, 1 warning** |
| Build | `expo export --platform web` | **OK** — `_expo/static/js/web/index-*.js` 4.2 MB, no errors |
| Unit/integration tests | `jest` | **40 suites, 288 tests, all pass** (~12 s) |

**The one warning (cosmetic):**

| File:line | Rule | Note |
|---|---|---|
| `src/types/navigation.types.ts:215` | `@typescript-eslint/no-empty-object-type` — "An interface declaring no members is equivalent to its supertype" | `interface RootParamList extends RootStackParamList {}` is the **official React Navigation** global-augmentation pattern; it *must* be an `interface` (declaration merging into a namespace), so it cannot be rewritten as a type alias. Fix = a one-line `// eslint-disable-next-line`. |

**Severity breakdown:** blocking 0 · cosmetic 1.

## C. Unused / unwanted files

- ✅ **No orphaned modules.** Every `.ts`/`.tsx` under `src/` is reachable from a navigator or another module.
- ✅ **No scratch/backup files** (`_old`, `copy`, `Untitled`, `.bak`, `.orig`, ` 2.tsx`).
- ✅ **Assets:** `assets/` holds only `icon.png`, `adaptive-icon.png`, `splash.png`, `favicon.png` — all referenced from `app.json`. No unused images/fonts/icons.
- ✅ **Config:** exactly one each of `babel.config.js`, `metro.config.js`, `eslint.config.js`, `jest.config.js`, `tailwind.config.js`, `prettier.config.js`, `tsconfig.json`. `.env` tracked as `.env.example` only; real `.env` present on disk, gitignored, untracked.

## D. Unused / duplicate dependencies

**Candidates for removal (verify before dropping):**

| Package | Evidence | Recommendation |
|---|---|---|
| `expo-constants` | Not imported anywhere in `mobile-app/` | Likely a transitive peer of other `expo-*` packages — **low risk either way**; keep unless `npm ls` shows nothing depends on it. |
| `expo-splash-screen` | Not imported; splash is driven declaratively from `app.json` | Safe to drop **unless** you plan to call `SplashScreen.preventAutoHideAsync()` for a custom splash. |

**Flagged by tooling but genuinely required (keep):** `react-dom`, `react-native-web` (Expo Web), `react-native-screens` / `react-native-reanimated` (react-navigation native peers), `react-native-url-polyfill` (imported in `src/lib/supabase.ts`), `react-native-worklets` (in `babel.config.js`), `expo-font` / `expo-notifications` (in `app.json` plugins), `@babel/core`, `babel-preset-expo`, `babel-plugin-module-resolver`, `jest-expo`, `@types/*`, `prettier-plugin-tailwindcss` (in `prettier.config.js`).

**Duplicate-purpose deps:** none. One data layer (`@supabase/supabase-js`), one icon set (`@expo/vector-icons`), no competing date libs (uses `Intl`/native), one form lib (`react-hook-form` + `zod`), `zustand` only where local stores are needed.

**Cross-project version drift** (full table in the Website section) — mobile-owned items:
- `@supabase/supabase-js` `^2.57.0` here vs `^2.43.0` in web/admin → **bump web+admin up** (same major).
- `zod` `^4.1.5` here vs `^3.23.0` in website → **standardize on one major**.
- `react` 19 / `typescript` ~5.9 / `eslint` 9 here vs 18 / ~5.4 / 8 in the Next apps → *expected* (Expo 54 / RN 0.81 requires the newer toolchain; Next 14 pins React 18). Leave, but note it.

## E. Duplicate code

**Within the mobile app — genuine drift (needs a product decision on which copy is canonical):**

| Pair | Lines | Both routed? | Differing lines |
|---|---|---|---|
| `src/profile/SettingsScreen.tsx` ↔ `src/settings/SettingsScreen.tsx` | 155 / 133 | **Yes** — `ProfileNavigator` (Profile tab) vs `SettingsNavigator` (drawer "SettingsModule") | 186 |
| `src/profile/AboutScreen.tsx` ↔ `src/settings/AboutScreen.tsx` | 66 / 70 | **Yes** — same two navigators | 50 |
| `src/home/NotificationScreen.tsx` ↔ `src/settings/NotificationScreen.tsx` | 120 / 92 | **Yes** — `HomeNavigator` vs `SettingsNavigator` | 182 |
| `src/project/ProjectDetailsScreen.tsx` ↔ `src/myProjects/ProjectDetailsScreen.tsx` | — | Yes — marketplace detail vs purchased-project detail | — (likely legitimately different; confirm before merging) |

The drawer's **"Settings" / "Help" / "About"** links (`src/navigation/DrawerContent.tsx:35-37`) all navigate into `SettingsModule`, while the **Profile tab** carries its own Settings/About. Users get a *different* Settings screen depending on entry point. Recommend: choose one, delete the other, repoint the navigator.

**Cross-app (shared with website — deliberate / managed, see Website §E):** legal JSON (9 identical files), resume engine (`atsCategories`, `templateSpecs`, `resumeDesign`, `resumeContent`, `demoResumes`).

## F. Feature completeness

All headline features **present** (matrix in the combined section at the bottom). Mobile-specific notes:
- 136 `*Screen.tsx` files across 15 domains — every intended feature has screens.
- Empty/loading/error states: `StateViews` component + per-screen handling are broadly present; however the SAMPLE-data fallback (§A) means several "backend error" states are effectively unreachable.
- Password reset: ✅ `ForgotPasswordScreen` + `ResetPasswordScreen`.
- Pagination: confirm long lists (`JobsDashboardScreen`, `SearchProjectsScreen`) page rather than fetch-all.

## G. Security & config

- ✅ **No hardcoded secrets.** Scans for service-role keys, JWTs (`eyJ…`), `sk-…`, `rzp_(live|test)_…`, PEM blocks, `AIza…` across tracked files return only: RLS `grant … to service_role` in migrations, `.env.example` placeholders, test fixtures (`rzp_test_1`), and a **defensive guard** at `src/lib/supabase.ts:33` that *throws* if a `service_role` key is ever handed to the client.
- ✅ **`.env` hygiene.** `.gitignore` covers `.env`, `.env.local`, `.env.*.local`. Only `mobile-app/.env.example` and `supabase/functions/.env.example` are tracked; real `.env` is untracked. `.env.example` is placeholders only, and comments explicitly restrict `EXPO_PUBLIC_*` to publishable/anon keys.
- ✅ **Client never uses the service-role key.** The only service-role usage is in `mobile-app/supabase/functions/_shared/client.ts` (Supabase Edge Functions, server-side, platform-injected env) for the payment functions — correct.
- ✅ **RLS** enabled on ~41 tables in the migration set (`profiles`, `purchases`, `wallet_transactions`, `wallet_topup_orders`, `resumes`, `resume_shares`, `referral_earnings`, `notifications`, `legal_consents`, …). Hardening migrations present: `0037_protect_is_premium.sql`, `0038` (wallet over-withdrawal), Phase-9 resume-sharing review.
- ⚠️ **Recommend a dedicated RLS pass** (out of scope for a read-only Phase 1): confirm every user-owned table has *both* read and write policies, and close the `test_attempts` scoring item flagged open in project memory.

---
---

# WEBSITE (`website/`)

**Summary**

- **Errors:** 0 TypeScript errors · 0 ESLint errors/warnings · `next build` OK (57 routes) · 278/290 vitest pass (12 = opt-in E2E, skipped).
- **Unused files:** 2 — `src/components/CmsLegalPage.tsx`, `src/lib/resumeBuilder/sampleResume.ts`.
- **Unused dependencies:** 0 (everything flagged is a required runtime peer or toolchain).
- **Duplicate code:** 0 within-app; participates in the managed cross-app resume/legal duplication.

## A. Broken / incomplete functions

| Status | Location | Finding |
|---|---|---|
| 🟡 Non-functional UI control | `src/app/compiler/RuntimeErrorCard.tsx:104` (handler `askAiToFix` at `:77-80`) | **"Ask AI to fix" button does nothing.** Clicking it flips the label to "Coming soon…" for 2 s (`setAskedAi(true); setTimeout(… , 2000)`). No backend. The docstring is candid ("there's no backend wired up for it yet"). Fix = wire to a Claude call (the pattern already exists in `src/lib/resumeBuilder/aiAssist.ts` / `POST /api/resume/assist`), or hide the button until it's built. |
| 🟡 Permanent empty state | `src/app/referral/page.tsx:46` | `<EmptyState title="Reward terms coming soon" …>` renders until an admin publishes reward terms — no fallback copy if that never happens. |
| 🟡 Permanent empty state | `src/app/premium/page.tsx:81` | `<EmptyState title="Plan pricing coming soon" …>` — same: depends on admin publishing plans. |
| ✅ Clean | entire `src/` | No `TODO`/`FIXME`/`HACK` comments. No empty `catch`. No `href="#"` / dead handlers. `console.log("Hello, CampusEduX!")` at `src/lib/compiler/languages.ts:43` is the default JS snippet string for the compiler, **not** a debug leftover. `console.error(error)` in `src/app/error.tsx:10` is the standard Next error boundary. |

## B. Errors and warnings

| Check | Command | Result |
|---|---|---|
| TypeScript | `tsc --noEmit` | **0 errors** |
| Lint | `next lint` | **✔ No ESLint warnings or errors** |
| Build | `next build` | **✅** compiled + 57/57 static pages generated, no errors/warnings |
| Tests | `vitest run` | **33 files, 278 pass, 12 skipped** (opt-in `resumeFlowE2E`), ~12 s |

**Severity breakdown:** blocking 0 · cosmetic 0.

## C. Unused / unwanted files

| File | Evidence | Recommendation |
|---|---|---|
| `src/components/CmsLegalPage.tsx` | **0 inbound imports.** `cms_pages`-backed legal rendering was retired in favour of the synced `src/legal/` JSON. | **Delete** (Phase 2). |
| `src/lib/resumeBuilder/sampleResume.ts` | **0 references anywhere** (untracked new file, never wired up; `demoResumes.ts` + `templateSpecs.ts` superseded it). | **Delete** (Phase 2). |

- ✅ `public/` is empty — no unused images/fonts.
- ✅ One each of `next.config.js`, `postcss.config.js`, `tailwind.config.ts`, `vitest.config.ts`, `.eslintrc.json`, `tsconfig.json`. `.env.local` untracked & gitignored; `.env.example` tracked.
- `tsconfig.tsbuildinfo` present on disk — gitignored build cache, harmless.

## D. Unused / duplicate dependencies

- ✅ **No unused dependencies.** Tooling flagged `react-dom`, `@types/*`, `eslint`, `eslint-config-next`, `postcss`, `autoprefixer`, `typescript` — all are required Next.js runtime peers or build tooling.
- ✅ **No duplicate-purpose deps.** One data layer (`@supabase/supabase-js` + `@supabase/ssr`), one icon set (`lucide-react`), one AI SDK (`@anthropic-ai/sdk`), no competing date/HTTP/state libs.

**Cross-project version comparison (all shared packages):**

| Package | mobile-app | website | admin-panel | Verdict |
|---|---|---|---|---|
| `@supabase/supabase-js` | `^2.57.0` | `^2.43.0` | `^2.43.0` | ⚠️ **Align** — bump website + admin to `^2.57.0` (same major, low risk). |
| `zod` | `^4.1.5` | `^3.23.0` | — | ⚠️ **Standardize** — v3→v4 changed several APIs. Pick one major project-wide. |
| `react` / `react-dom` | `19.2.0` | `18.3.1` | `18.3.1` | ✅ Expected (RN needs 19, Next 14 pins 18). Leave. |
| `@types/react` | `~19.2.10` | `~18.2.0` | `~18.2.0` | ✅ Tracks the `react` split. Leave. |
| `typescript` | `~5.9.2` | `~5.4.0` | `~5.4.0` | 🟢 Optional — harmonising to `~5.9` is safe and tidy. |
| `eslint` | `^9.0.0` (flat) | `^8.57.0` | `^8.57.0` | 🟢 Optional — different config style; migrating the Next apps to v9 flat config is a nice-to-have. |
| `tailwindcss` | `^3.4.17` | `^3.4.0` | `^3.4.0` | ✅ Same minor. Leave. |
| `next` / `@supabase/ssr` / `lucide-react` / `vitest` / `eslint-config-next` / `postcss` / `autoprefixer` / `@types/node` / `@types/react-dom` | — | *identical* | *identical* | ✅ website & admin are fully in lockstep. |

## E. Duplicate code

**Cross-app — deliberate and guarded (acceptable as-is; a shared workspace package would remove the copy):**

| Duplication | Detail | Guard |
|---|---|---|
| **Legal content** — `website/src/legal/content/*.json` vs `mobile-app/src/legal/content/*.json` | 9 of 10 files **byte-identical** (`privacy-policy`, `terms`, `refund-policy`, `project-license`, `community-guidelines`, `disclaimer`, `data-and-permissions`, `contact`, `delete-account`). `cookie-policy.json` is website-only. | `website/scripts/sync-legal.mjs` (`npm run legal:sync`) copies from the mobile source-of-truth; a drift-guard test fails if they diverge. |
| **Resume engine** — mobile `src/services/*` vs website `src/lib/resumeBuilder/*` | `atsCategories.ts` (377/377 L, **8** differing lines), `templateSpecs.ts` (145/155 L), `resumeDesign.ts`↔`design.ts` (95/105 L), `resumeContent.ts`↔`content.ts` (467/493 L), `demoResumes.ts` (225/416 L). | Manual port; tests on both sides. `atsCategories` + `templateSpecs` are the **strongest shared-package candidates** — scores must match across platforms. |

**Within the website:** none. Supabase client factories (`server.ts` anon read-only, `authed-server.ts` SSR session, `browser.ts`) look similar but serve distinct roles — not duplication.

## F. Feature completeness

All headline features present (matrix below). Website-specific notes:
- ✅ Password reset via Supabase; `/register` records legal consent; `/account/*` guarded by `requireUser()` in the layout.
- ✅ `EmptyState`, loading and error states are used throughout; `error.tsx` + `not-found` present.
- ✅ Pagination present in list routes; admin-style `Pagination` component.
- ⚠️ **No `website-ci.yml`** — the website is the only project without CI.
- ⚠️ **`ANTHROPIC_API_KEY`** consumed by `src/lib/resumeBuilder/aiAssist.ts` (`POST /api/resume/assist`) but **missing from `.env.example`** — the resume AI-assist feature silently fails when it's unset. Add it (commented, no value).
- 🟡 "Ask AI to fix" in `/compiler` is the one visibly half-built control (§A).

## G. Security & config

- ✅ **No hardcoded secrets** (same scan as mobile — clean).
- ✅ **`.env` hygiene:** `.env.local` untracked & gitignored; only `.env.example` tracked, placeholders only, with explicit "Never put the service-role key in this app" comments.
- ✅ **No service-role client.** `src/lib/supabase/server.ts` uses the **anon key**, `persistSession:false`, read-only for public catalog data. `authed-server.ts` / `browser.ts` use `@supabase/ssr` with a real user session. Account pages rely on RLS + `requireUser()`.
- ✅ **API routes** (`/api/compiler/run`, `/api/coding-problems/judge`, `/api/resume/{assist,parse,export/*}`, `/api/revalidate`) read all secrets from `process.env` server-side; `ANTHROPIC_API_KEY` never reaches the browser. `/api/revalidate` is gated by `REVALIDATE_SECRET`; the compiler route has rate-limit + optional-auth env switches (`compiler-ratelimit.test.ts` covers it).
- 🟢 Minor: `.env.example` should also list `ANTHROPIC_API_KEY` (see §F).

---
---

# ADMIN PANEL (`admin-panel/`)

**Summary**

- **Errors:** 0 TypeScript errors · 0 ESLint errors/warnings · `next build` OK (97 routes) · 104/104 vitest pass.
- **Unused files:** 0 (the old `legacy/` and `placement/*` trees are already staged for deletion in the checkpoint).
- **Unused dependencies:** 0.
- **Duplicate code:** 1 — `CategoryManager.tsx` implemented 3× (low priority).

## A. Broken / incomplete functions

| Status | Location | Finding |
|---|---|---|
| 🟡 Partial by design | `src/app/(panel)/settings/actions.ts` → `createBackup()` | Inserts a `backups` row with `status:'completed'` but performs **no actual backup** (no dump, no storage export). The page (`settings/backup/page.tsx`) is honest — subtitle: *"The database itself is backed up by Supabase; this records manual snapshot requests"* — and the Download column degrades to "not available" when `download_url` is null. Not broken, but a reader may expect a downloadable artifact. Decide: keep as a request log, or wire a real export. |
| ✅ Clean | entire `src/` | **No** `TODO`/`FIXME`/`HACK`/`// not implemented` comments. **No** empty `catch` (the two `catch {}` in `supabase/server.ts` are the documented Next SSR cookie no-op). **No** dead handlers. The ~8 `console.warn` calls are deliberate structured error logging in `lib/audit.ts`, `lib/utils.ts`, `lib/auth.ts`, `actions/auth.ts`. |
| ✅ Verified real | `quick-actions`, `recent-orders`, `recent-users`, `revenue`, `analytics`, `notifications`, `settings/backup` pages | Spot-checked the smallest routes — all query Supabase and render live data; none are placeholder shells. |

## B. Errors and warnings

| Check | Command | Result |
|---|---|---|
| TypeScript | `tsc --noEmit` | **0 errors** |
| Lint | `next lint` | **✔ No ESLint warnings or errors** |
| Build | `next build` | **✅** compiled + 97/97 pages generated, no errors/warnings |
| Tests | `vitest run` | **9 files, 104 tests, all pass** (~2 s) |

**Severity breakdown:** blocking 0 · cosmetic 0.

## C. Unused / unwanted files

- ✅ **No orphaned modules** in the current working tree.
- **Already handled in the checkpoint:** `admin-panel/legacy/**` (≈70 files) and the old `src/app/(panel)/placement/{aptitude,dsa,hr,company,categories,live-tests,notes,…}` tree are staged as **deletions** (`D`) — they were removed as part of the "remove specialised grids" work and just need committing. No action needed beyond committing.
- ✅ `public/` empty. One each of `next.config.mjs`, `postcss.config.js`, `tailwind.config.ts`, `vitest.config.ts`, `.eslintrc.json`, `tsconfig.json`. `.env.local` untracked & gitignored.

## D. Unused / duplicate dependencies

- ✅ **No unused dependencies.** Only 8 runtime deps (`@supabase/supabase-js`, `@supabase/ssr`, `next`, `react`, `react-dom`, `lucide-react`, `recharts`, `clsx`-ish) — all used. Tooling-flagged items (`@types/*`, `eslint`, `eslint-config-next`, `@typescript-eslint/eslint-plugin`, `postcss`, `autoprefixer`, `typescript`) are all required build/lint tooling.
- ✅ **No duplicate-purpose deps.** `date-fns` and `zod` were already removed in an earlier cleanup (per project memory). One chart lib (`recharts`), one icon set (`lucide-react`).
- **Version drift:** see the website §D table — admin is in lockstep with website on every shared package except the `@supabase/supabase-js` `^2.43.0` vs mobile's `^2.57.0` gap (**bump to `^2.57.0`**).

## E. Duplicate code

| Duplication | Locations | Recommendation |
|---|---|---|
| `CategoryManager.tsx` (category CRUD manager) | `src/app/(panel)/projects/categories/`, `src/app/(panel)/resume/templates/categories/`, `src/app/(panel)/custom-projects/features/categories/` | 3 near-parallel implementations. Extract one generic `<CategoryManager resource="…" />`. **Low priority** — each is small and stable. |
| `createClient` | `src/lib/supabase/server.ts` + `client.ts` | Expected (server vs browser factory) — **not** a problem. |

- **Cross-app:** admin shares the ATS-rules / resume-template concepts with the website but implements them as admin CRUD over the same tables — appropriate, not duplication.

## F. Feature completeness

The admin panel is the **most complete** of the three — every feature area has full CRUD + analytics + moderation (matrix below). Notes:
- ✅ Moderation tools: reviews (approve/report/delete/testimonials), resume shares, custom-project delivery pipeline, job applications pipeline (shortlist/reject/feature), student block/unblock.
- ✅ Pagination (`Pagination` component), search/filter bars, empty states used consistently.
- ✅ RBAC: `requireModule()` / `requirePermission()` on every route + action, backed by `role_permissions` (migrations `001`–`002`).
- ✅ Activity logging (`logActivity`) on mutations.
- 🟡 `createBackup` produces no artifact (§A).
- 🟢 `admin-ci.yml` runs typecheck + lint + test on every push touching `admin-panel/**`.

## G. Security & config

- ✅ **No hardcoded secrets.**
- ✅ **`.env` hygiene:** `.env.local` untracked & gitignored; `.env.example` placeholders only, with an explicit note: *"this build uses NO service-role key. Every query runs as the signed-in admin's own session."*
- ✅ **Zero service-role usage** — verified: there is no `admin.ts` / `createAdminClient` / `SUPABASE_SERVICE_ROLE_KEY` reference in `src/`. Writes are authorised by `is_admin()` RLS policies (`migrations/002_admin_rls_policies.sql`); transactional money moves go through `SECURITY DEFINER` RPCs. This is a strong posture.
- 🟢 Minor: `src/lib/supabase/server.ts:8` comment still references *"the one service-role client (admin.ts)"* which no longer exists — stale doc, harmless.

---
---

# COMBINED FEATURE MATRIX (Section F)

Legend: ✅ fully working · 🟡 partially built · ❌ missing

| Feature | Mobile | Website | Admin |
|---|---|---|---|
| **Project marketplace** | ✅ browse / search / detail / reviews / checkout / downloads / wishlist (18 screens) | ✅ `/projects` + `category/[category]` / `trending` / `premium` / `best-sellers` / `[id]` | ✅ full CRUD + images / video / documentation / source-code / versions / reviews / analytics / featured / categories / technologies |
| **Jobs** | ✅ dashboard / search / detail / apply / alerts / companies (14 screens) | ✅ `/jobs` / `/jobs/[id]` / `companies` / `companies/[id]` | ✅ CRUD + applications pipeline (`shortlisted` / `rejected` / `featured`) + analytics |
| **Placement / Learning** | ✅ Learning tab: grids → sections → topics → content, mock tests, coding problems, notes (9 screens) | ✅ `/learning/*` / `/mock-tests/[testId]` / `/coding-problems/[problemSlug]` / `/placement/notes` | ✅ `/learning` tree editor + `/placement` tests / questions / results |
| **Resume builder** | ✅ editor / sections / templates / design sheet / JD-match / upload-import / versions (14 screens) | ✅ `/account/resume/[id]/{edit,ats,jd-match,versions,projects,preview}` + `import` + `/resume/templates` | ✅ `/resume`: templates / ats-rules / ai-config / shares / downloads / analytics |
| **Custom projects** | ✅ 8-step builder wizard + token payment + my-projects (13 screens) | ✅ `/custom-projects/{start,estimate,features,checkout,my-projects}` | ✅ request pipeline + delivery + features / pricing / categories |
| **Premium** | ✅ plans / features / checkout / success (5 screens) | ✅ `/premium` | ✅ plans + subscriptions (visible per-student) |
| **Referral & wallet** | ✅ dashboard / history / earnings / leaderboard / share (6 screens) | ✅ `/referral` + `/account/referral` + `/account/wallet` | ✅ earnings / leaderboard / reward-settings / wallet / wallet-requests |
| **Auth + password reset** | ✅ Login / Register / Forgot / Reset | ✅ `/login` / `/register` (+ consent) / `/logout` | ✅ `resetPasswordForEmail` |
| **Legal / compliance** | ✅ 10 legal docs + consent recording | ✅ all legal routes + `/grievance` / `/cookie-policy` / `/data-and-permissions` | ✅ `/cms/pages` + consent tracking |

**All seven headline features are ✅ on all three platforms** — an unusually complete build.

**Platform-normal things that are partial or missing:**

| Item | Status |
|---|---|
| Website CI | ❌ no `website-ci.yml` (mobile + admin have CI) |
| `ANTHROPIC_API_KEY` in `website/.env.example` | ❌ undocumented required secret |
| Web compiler "Ask AI to fix" | 🟡 placeholder button, no backend |
| Admin `createBackup` | 🟡 records a request, produces no artifact |
| Mobile backend-error UX | 🟡 masked by SAMPLE-data fallback on catalog reads |
| Empty / loading / error states | ✅ present across all three (mobile caveat above) |
| Pagination | ✅ admin + website; mobile — confirm long lists page |
| Admin moderation tools | ✅ comprehensive |
| Full table-by-table RLS verification | ⚠️ recommended as a separate pass (not done in read-only Phase 1) |

---

## Recommended Phase 2 order (for when you approve)

1. **Trivial deletes** — `website/src/components/CmsLegalPage.tsx`, `website/src/lib/resumeBuilder/sampleResume.ts`, root `node_modules/.vite`, and commit the already-staged `admin-panel/legacy/**` + old `placement/*` deletions.
2. **Dependency alignment** — bump `@supabase/supabase-js` to `^2.57.0` in website + admin; decide one `zod` major; (optional) harmonise `typescript`.
3. **Add `website-ci.yml`**; add `ANTHROPIC_API_KEY` to `website/.env.example`.
4. **Fix the one lint warning** — `eslint-disable-next-line` at `mobile-app/src/types/navigation.types.ts:215`.
5. **Mobile Settings/About/Notification de-duplication** — *needs your call* on which flow (Profile tab vs drawer) is canonical.
6. **SAMPLE-data fallback** — *needs your call*: gate behind a demo flag, or add a visible "sample data" banner.
7. **"Ask AI to fix"** — wire to `/api/resume/assist`-style Claude call, or hide the button.
8. **Admin `createBackup`** — *needs your call*: real export vs keep as request-log.
9. **Separate RLS verification pass** — table-by-table, plus close `test_attempts` scoring.

---

**Phase 1 stops here. No files were deleted, fixed, or moved.** Awaiting your review of this report before any Phase 2 cleanup.
