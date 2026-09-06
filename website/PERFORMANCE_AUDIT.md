# CampusEduX Website — Performance Audit (Phase 0: Measure First)

**Date:** 2026-09-06
**Branch:** `audit/full-project-review`
**Scope:** `website/` only (Next.js app). Mobile app and admin panel untouched.
**Status:** Measurement only — **no optimisation changes made.** This document is the plan for Phases 1+.

---

## 1. Executive summary

| Target | Current (measured / estimated) | Verdict |
|---|---|---|
| TTFB < 200 ms | Static/ISR routes ~**15 ms** server compute (✓); **dynamic routes (`/projects`, `/jobs`, all detail pages, `/account/*`) are uncached** and re-query Supabase on every request → **200–500 ms in production** | ⚠️ Fails on ~40 routes |
| LCP < 1.2 s | Est. **1.8–2.6 s** mobile/4G (text hero, no web font — helped; hurt by 227 KB HTML + 55 KB render-blocking CSS + heavy hydration) | ❌ |
| INP < 200 ms | Est. **at risk (200–400 ms during hydration)** — 3–4 independent Supabase auth hooks + full Supabase SDK hydrate on every page | ❌ / borderline |
| CLS < 0.1 | Est. **~0.05–0.15** — system font helps; `AnnouncementBar` / `OffersStrip` / auth-menu populate after load and can shift content | ⚠️ |
| Initial JS < 150 KB gz / route | **~192 KB gz** (modern) / **~230 KB gz** (with legacy polyfills) — *identical on every route*, including static text pages | ❌ everywhere |

**Root cause, in one sentence:** the site is architecturally "an SPA shell" — the root layout pulls the **entire Supabase browser SDK (~64 KB gz)** and 3–4 independent client auth hooks into **every** page, so even a static "About" page ships ~190 KB of JS and hydrates a Supabase client; and the data-heavy routes opt out of all caching so every visit is a cold server render + Supabase round-trips.

**The three changes that matter most (do these first):**
1. **Get Supabase out of the global layout** (B1 + B2 + B6) — one shared server-provided session context instead of 4 client SDK instances. Removes ~64 KB gz from every route and most hydration cost.
2. **Make the catalog cacheable again** (B3 + B4) — wrap Supabase reads in `unstable_cache` / restructure list pages so `searchParams` doesn't poison the route, restoring ISR/CDN caching on `/projects*`, `/jobs*`, detail pages.
3. **Scope the middleware** (B5) — stop running a Supabase Auth network call on every request, including static pages.

---

## 2. Method & environment

| Item | Value |
|---|---|
| Node / npm | v22.23.1 / 10.9.8 |
| Next.js | **14.2.35**, App Router (74 route files, 0 Pages Router) |
| React | 18.3.1 |
| Styling | Tailwind CSS 3.4 (single site-wide bundle, `content: ./src/**/*`), no CSS-in-JS |
| Fonts | **None** — system font stack (`-apple-system…`). No web-font request. *(Good for LCP/CLS.)* |
| Data layer | `@supabase/supabase-js` 2.57 + `@supabase/ssr` 0.4. Public catalog via anon-key `createClient` (`src/lib/supabase/server.ts`); auth'd reads via `@supabase/ssr` server client; browser via `createBrowserSupabase`. |
| Rendering | Per-route `export const revalidate` (mostly 300 s) + a few `dynamic = "force-dynamic"`. No `generateStaticParams` on any dynamic segment. |
| Hosting target | Unknown (`NEXT_PUBLIC_SITE_URL=http://localhost:3000`); not publicly reachable from this environment. |

**What was measured directly**
- `next build` (production) ×3 — build time, route table, First Load JS, static vs dynamic.
- `@next/bundle-analyzer` (installed this phase, `ANALYZE=true` opt-in) — client/edge/node treemaps in `.next/analyze/`.
- `next start` locally + `curl` — TTFB (server compute), total time, HTML bytes, `Cache-Control` / `x-nextjs-cache` per route, on cold + warm hits.
- Static prerender HTML inspection — actual `<script>` tags, inline RSC flight size, inline SVG count.
- Source read of the render path (root layout, nav islands, the 5 target pages, data helpers, middleware).

**What could NOT be measured (and why)**
- **Lighthouse / real Core Web Vitals.** No Chrome/Chromium/Playwright/Puppeteer binary in this environment, and the site is not deployed to a URL reachable from here (so PageSpeed Insights can't see it either). **LCP / INP / CLS / TBT figures in this report are lab estimates** derived from bundle weight + render path + standard Lighthouse mobile assumptions (mid-tier phone, 4× CPU throttle, ~1.6 Mbps / 150 ms RTT "Slow 4G"). They are directional, not authoritative.
  **Action for Phase 1:** run `npx lighthouse <url> --preset=desktop` and `--form-factor=mobile` against a deployed preview (or `npm start` + a local Chrome), and/or enable Vercel Speed Insights, to get real numbers. Every later phase should re-run the same 5 URLs and record before/after.

---

## 3. Measurements

### 3.1 Production build

| Run | Wall time | Notes |
|---|---|---|
| Cold-ish (`.next/cache` warm, first of session) | **~156 s** | `tsc` typecheck + `next lint` run inside `next build` |
| Warm (subsequent) | **~50 s** | |

- 57 routes compiled; **32 prerendered to static HTML**; `.next/` = 272 MB.
- No build errors or type errors.

### 3.2 Route table — static vs dynamic (from `next build`)

**Static / ISR (`○` — prerendered, `s-maxage` cache):** `/`, `/about`, all legal pages (`/terms`, `/privacy-policy`, `/refund-policy`, `/cookie-policy`, `/disclaimer`, `/community-guidelines`, `/project-license`, `/legal`, `/grievance`, `/data-and-permissions`, `/delete-account`), `/faq`, `/contact`, `/compiler`, `/support`, `/referral`, `/login`, `/register`, `/logout`, `/premium`, `/jobs/companies`, `/resume/templates`, `/projects/trending`, `/projects/best-sellers`, `/projects/new`, `/projects/premium`, `/placement*`. — **~35 routes.**

**Dynamic (`ƒ` — server-rendered on demand):**

| Route | `revalidate` set? | Actually cached? | Why dynamic |
|---|---|---|---|
| `/projects` (list) | `120` | **No** (`no-store`, no `x-nextjs-cache`) | reads `searchParams` |
| `/jobs` (list) | `120` | **No** | reads `searchParams` |
| `/projects/category/[category]` | `300` | **No** | reads `searchParams` + dynamic param |
| `/projects/[id]` | `300` | **No** — served `Cache-Control: private, no-cache, no-store` | dynamic param, **no `generateStaticParams`**, and Supabase `fetch` is `no-store` → route cache disabled |
| `/jobs/[id]` | `300` | **No** — same | same |
| `/jobs/companies/[id]` | `300` | **No** | same |
| `/learning`, `/learning/[gridSlug]`, `/learning/[gridSlug]/[topicSlug]` | `300` | **No** | dynamic params + Supabase `no-store` |
| `/coding-problems/[problemSlug]` | `300` | **No** | same |
| `/mock-tests/[testId]`, `/mock-tests/[testId]/result/[attemptId]` | — | **No** | `force-dynamic` |
| `/r/[token]` | — | **No** | `force-dynamic` |
| `/resume` | — | **No** | `force-dynamic` (auth) |
| `/account/**` (18 routes) | — | **No** | auth (`cookies()`), correct |
| `/custom-projects/**` (most) | mixed | **No** | auth / `searchParams` |
| `/api/**` (7 handlers) | — | n/a | correct |

**The problem:** `revalidate` is exported on ~14 catalog routes but **effectively dead** — every one of them is rendered fresh per request and re-queries Supabase. On this machine Supabase is ~15 ms/query so local TTFB looks fine (15–56 ms); in production (Supabase region hop, cold serverless) expect **200–500 ms TTFB** on these routes, and **no CDN caching** so it doesn't amortise across users.

### 3.3 First Load JS — reported vs actual

`next build` "First Load JS shared by all" = **87.8 kB** (`fd9d1056` react-dom 53.6 + `2117` app-router runtime 31.7 + 2.4). Per-route it reports 87.9 kB (`/about`) up to 184 kB (`/coding-problems/[slug]`).

**These numbers understate the wire cost.** Inspecting the actual prerendered HTML, **every page — `/about` and `/terms` included — loads the same 13 JS chunks** plus CSS:

| Chunk | gz | What it is | Removable from global scope? |
|---|---|---|---|
| `fd9d1056` | 52 KB | react-dom (production) | No (framework floor) |
| `2117` | 30 KB | Next App Router client runtime (router-reducer, RSC client, react, scheduler) | No (framework floor) |
| `main` | 33 KB | Next client + **legacy Pages-Router `router.js` (~24 KB raw dead weight)** | Partially (B7) |
| **`6608`** | **51 KB** | **`@supabase/ssr` + `@supabase/supabase-js` (postgrest, realtime, storage, functions)** | **YES (B1)** |
| **`44530001`** | **13 KB** | **`@supabase/auth-js` `GoTrueClient`** | **YES (B1)** |
| `polyfills` | 38 KB | legacy polyfills (`nomodule` — modern browsers skip, but still fetched by many) | Shrinkable (B8) |
| `2972` | 8 KB | `next/link`, route-regex, format-url | No |
| `1839` | 5 KB | `next/image` client, `next/head` | No |
| `5791` | 3 KB | UI islands: `Drawer`, `Modal`, `Button`, `FilterSheet`, `Reveal` | Partially |
| `9994` | 2 KB | lucide icons used by nav + home | Partially |
| `app/layout` | 4 KB | layout client boundary | — |
| `app/page` | 3 KB | **home page chunk — prefetched onto every page** via the header logo `<Link href="/">` | Minor |
| CSS | ~11 KB | 55 KB raw — whole-site Tailwind bundle | Minor |

**Actual initial transfer, every route:** **~230 KB gz** (`curl` sum of referenced assets), or **~192 KB gz** discounting the `nomodule` polyfills chunk. Page-specific code is 2–20 KB — **negligible next to the shared shell.** This means **route-level code-splitting is NOT where the wins are**; the shared layout + Supabase SDK is.

Framework floor (react-dom + app-router runtime + `main` + webpack) ≈ **117 KB gz** — the practical minimum for Next 14 App Router. Removing Supabase from the global scope (B1) gets a static route to **~125–130 KB gz**, within reach of the 150 KB target. Interactive routes then need per-route attention.

### 3.4 Ten largest client-bundle dependencies (`@next/bundle-analyzer`)

| # | Package | Parsed | ~gz | Where it loads | Note |
|---|---|---|---|---|---|
| 1 | `next` (runtime: framework + main + app-router) | 489 KB | ~95 KB | every route | framework floor; ~8 KB gz is legacy Pages-Router `router.js` (B7) |
| 2 | `react-dom` | 125 KB | 52 KB | every route | floor |
| 3 | **`@supabase/ssr`** | 120 KB | — | **every route (root layout)** | **B1** — bundled in `6608` |
| 4 | **`@supabase/auth-js`** | 104 KB | 13 KB | **every route** | **B1** — chunk `44530001` |
| 5 | `@supabase/supabase-js` core (postgrest/realtime/storage/functions) | (in `6608`) | ~38 KB | **every route** | **B1** — realtime + storage + functions clients are pulled in even though the site only does REST reads |
| 6 | `lucide-react` (icons, tree-shaken to per-icon modules ✓) | 31 KB | ~10 KB | spread across routes | OK — `optimizePackageImports` is working; 87 unique icons |
| 7 | `prismjs` (+ 5 language grammars) | 28 KB | ~9 KB | **`/compiler` only** (`next/dynamic`, `ssr:false`) ✓ | well contained |
| 8 | `qrcode.react` | 15 KB | ~5 KB | `ShareModal` (resume share) | statically imported by the modal — pulled into `/resume` subtree even before the modal opens (B-minor) |
| 9 | app `./src/components` (all client islands) | 248 KB | — | spread | — |
| 10 | `cookie` | 2 KB | ~1 KB | every route (via `@supabase/ssr`) | goes away with B1 |

**Server-only, correctly NOT in the client bundle** (verified — only imported by `/api/*` route handlers): `@react-pdf/renderer`, `docx`, `mammoth`, `pdf-parse`. They do bloat those serverless functions (cold starts — B14) but not the browser.

### 3.5 Server timing & payload (local `next start`, 5 target pages + a static control)

Local = server compute only; **add production RTT + Supabase latency to every "dynamic" row.**

| Page | URL | TTFB (compute) | HTML bytes | Cache header | Inline RSC flight | Inline `<svg>` |
|---|---|---|---|---|---|---|
| Home | `/` | 15 ms | **227 KB** | `x-nextjs-cache: HIT`, `s-maxage=300` ✓ | ~90 KB | — |
| Marketplace list | `/projects` | 39 ms | **275 KB** | **`no-store`** ❌ | **142 KB** | **193** |
| Project detail | `/projects/tr-2` | 56 ms | 112 KB | **`no-store`** ❌ (despite `revalidate=300`) | ~40 KB | — |
| Jobs list | `/jobs` | 19 ms | 115 KB | **`no-store`** ❌ | ~35 KB | — |
| Resume builder | `/resume` | **121 ms** | 108 KB | `no-store` (auth — expected) | ~45 KB | — |
| *(control)* About | `/about` | 3 ms | 49 KB | `x-nextjs-cache: HIT`, 1 yr ✓ | ~20 KB | — |

Observations:
- **`/projects` HTML is 275 KB** — ~142 KB is inline RSC flight data and **193 inline `<svg>` elements** (each `<ProjectCard>` renders 5 `Rating` star SVGs + arrow + icons; ×24 cards). Every lucide icon serialises its full path data inline, repeated per card. Big transfer + parse cost, and it's uncached (B9).
- **`/resume` has the worst TTFB** — `getOptionalUser()` (Supabase Auth `getUser()` network call) then `loadTemplates()` (Supabase query) run **serially**, *after* the middleware already called `getUser()` for the same request → **2× auth round-trips** + a serial query waterfall (B11).
- **`/projects/[id]` and `/jobs/[id]` return `no-store`** even though both set `revalidate = 300`. Cause: `@supabase/postgrest-js` issues its `fetch` in a way Next treats as uncacheable, which forces the whole route to dynamic and discards `revalidate`. Fix = wrap catalog reads in `unstable_cache` (B4).

### 3.6 Middleware

`middleware.ts` matcher excludes only `_next/static`, `_next/image`, `favicon.ico`, and image extensions → **it runs on every HTML navigation, every dynamic route, and every `/api/*` call.** Body is `await supabase.auth.getUser()`.

- Logged-**out**: cheap — `getUser()` with no auth cookie returns immediately, no network. Confirmed (`/about` + fake cookie still `x-nextjs-cache: HIT`, 3 ms).
- Logged-**in**: `getUser()` makes a network call to the Supabase Auth server (`/auth/v1/user`) **on every navigation**, prepended to TTFB — including for pages served from the static cache. On a distant Supabase region this is 50–200 ms added to *every* click for signed-in users (B5).

---

## 4. Bottleneck ranking — impact × ease (this is the Phase plan)

Impact = effect on the 5 targets across the most traffic. Ease = confidence + small blast-radius + no UX change.

| ID | Bottleneck | Impact | Ease | Priority | Target metrics | Est. saving |
|---|---|---|---|---|---|---|
| **B1** | Full Supabase browser SDK (`ssr` + `supabase-js` + `auth-js` ≈ **64 KB gz**) bundled into the root layout → **every** route | ★★★★★ | ★★★☆☆ | **P1** | INP, TBT, transfer, LCP | −64 KB gz/route; large hydration cut |
| **B2** | `useSessionProfile` used by **4** islands (`AuthMenu`, `NotificationBell`, `MobileNav`, `PremiumPromo`) — each mounts its own browser client, calls `auth.getUser()` + a `profiles` SELECT + registers `onAuthStateChange`, on every page | ★★★★★ | ★★★☆☆ | **P1** | INP, network, CLS | 4→1 auth read; −3 network round-trips/load |
| **B3** | `/projects` + `/jobs` list pages forced dynamic by `searchParams`; Supabase queries uncached → cold render + 2–3 DB round-trips per request, no CDN cache | ★★★★☆ | ★★★☆☆ | **P1** | TTFB | ISR/CDN cache restored on 2 highest-value catalog routes |
| **B4** | `/projects/[id]`, `/jobs/[id]`, `/jobs/companies/[id]`, `/learning/**`, `/coding-problems/[slug]` dynamic despite `revalidate` — Supabase `fetch` `no-store` poisons the route cache | ★★★★☆ | ★★★☆☆ | **P2** | TTFB | ~10 routes become CDN-cacheable |
| **B5** | Middleware `auth.getUser()` (network) on every request incl. static; matcher too broad | ★★★★☆ | ★★★★★ | **P1** | TTFB (signed-in) | −1 auth round-trip per navigation |
| **B6** | `AnnouncementBar` runs a Supabase query client-side on every page (≈99% return nothing) | ★★★☆☆ | ★★★★☆ | **P2** | network, INP, part of B1 | −1 query/load; helps de-Supabase the layout |
| **B7** | Legacy Pages-Router `router.js` (~24 KB raw / ~8 KB gz) shipped in `main` for an App-Router-only app | ★★★☆☆ | ★★★★☆ | **P3** | transfer | −~8 KB gz/route (config-only) |
| **B8** | No `.browserslistrc` → Next's broad legacy polyfills chunk (**38 KB gz**) | ★★★☆☆ | ★★★★★ | **P3** | transfer, TBT | −20–38 KB gz for modern visitors |
| **B9** | `/projects` HTML 275 KB — 193 duplicated inline lucide `<svg>` (Rating stars) + 142 KB uncached RSC flight | ★★★☆☆ | ★★★☆☆ | **P2** | LCP, transfer, parse | −80–120 KB HTML on the list page |
| **B10** | Hero banner image (when an admin `banners` row exists) + list first-row images have no `priority` / preload | ★★★☆☆ | ★★★★★ | **P2** | LCP (image scenarios) | LCP −0.3–0.8 s when a banner/image is the LCP element |
| **B11** | `/resume` double `getUser()` (middleware + page) + serial `await` waterfall | ★★☆☆☆ | ★★★★☆ | **P2** | TTFB (one route) | −1 round-trip; parallelise |
| **B12** | `Reveal` wraps 6 home sections — extra client component + below-fold content starts `opacity-0` | ★★☆☆☆ | ★★★☆☆ | **P3** | INP, perceived | minor hydration + robustness |
| **B13** | `qrcode.react` (15 KB) statically imported by `ShareModal`, in the `/resume` subtree before the modal opens | ★☆☆☆☆ | ★★★★☆ | **P3** | transfer (resume routes) | −5 KB gz until modal used |
| **B14** | `/api/resume/export/*` + `/api/resume/parse` bundle `@react-pdf/renderer`, `docx`, `mammoth`, `pdf-parse` → serverless cold starts | ★★☆☆☆ | ★★☆☆☆ | **P3** | API latency (rare routes) | faster export/parse cold start |
| **B15** | `next build` runs `tsc` + `next lint` inline (50–156 s) | ★☆☆☆☆ | ★★★★☆ | **P4 (DX)** | build time | move lint/typecheck to CI parallel step |

### Notes on what is already good (do not "fix")
- **No web fonts** — system stack. Zero font-swap, zero font download. Keep it.
- `lucide-react` **is** tree-shaken (per-icon modules present) — `optimizePackageImports` works. No barrel problem.
- `prismjs` is `next/dynamic({ ssr:false })` on `/compiler` only — correctly contained.
- Heavy doc libs (`@react-pdf`, `docx`, `mammoth`, `pdf-parse`) are server-only — not in the client bundle.
- Home (`/`), `/about`, legal pages are genuinely static with long `s-maxage` — the ISR side is set up correctly where `searchParams` / auth don't interfere.
- `loading.tsx` files exist for `/projects`, `/jobs`, `/learning`, `/jobs/[id]`, `/projects/[id]` — Suspense fallbacks are in place.

---

## 5. Detailed findings

### B1 — Supabase SDK in the root layout (P1, ★★★★★ impact)

**Evidence.** `src/app/layout.tsx` renders `<AnnouncementBar>` (`"use client"`, imports `createBrowserSupabase`) and `<Header>` → `<AuthMenu>` / `<NotificationBell>` / `<MobileNav>` (all `"use client"`, all import `useSessionProfile` → `createBrowserSupabase`). Result: chunks `6608` (51 KB gz — `@supabase/ssr` + `supabase-js`) and `44530001` (13 KB gz — `auth-js`) are `<script>`-loaded on **every** prerendered page, confirmed in `.next/server/app/about.html` and `…/terms.html`.

**Why it hurts.** ~64 KB gz extra download + ~230 KB parsed JS to compile/execute on the main thread during hydration on *every* route → the dominant contributor to TBT/INP and a measurable slice of LCP on mobile. The site only ever does anon REST reads + auth, but the bundle also includes the **realtime**, **storage**, and **functions** sub-clients.

**Fix direction (Phase 1).** Read the session **once on the server** (in the layout or a small server component) and pass `{ user, profile }` down through a `<SessionProvider>` React context. Client islands consume the context — no browser SDK, no `getUser()` on mount. Where a browser client is genuinely needed for a *user action* (sign-in form, "apply", wallet top-up, bookmark), import it lazily inside the event handler / a `dynamic()` island so it's not in the first load. Expected: static routes → ~125–130 KB gz; every route loses the auth-hook hydration work.
**Risk.** Medium — touches the nav islands and the layout's rendering mode. Must keep the layout static (see B2 note). No visual change.

### B2 — `useSessionProfile` fan-out (P1, ★★★★★)

**Evidence.** 4 components call `useSessionProfile()` (`src/lib/useSessionProfile.ts`): `AuthMenu`, `NotificationBell`, `MobileNav`, `home/PremiumPromo`. Each instance independently: creates a browser client, `await supabase.auth.getUser()` (network), `await supabase.from("profiles").select(…)` (network), and `supabase.auth.onAuthStateChange(...)`. On the home page that's **4× getUser + 4× profiles SELECT + 4 subscriptions** on load.

**Why it hurts.** 8 serialised-per-hook network round-trips competing with hydration; `AuthMenu` renders a skeleton then swaps to the real control (bounded, but a shift); main-thread churn from 4 subscriptions. Directly at odds with the INP target.

**Fix direction.** Falls out of B1 — one server read, one context, zero client round-trips for the common case. If a client-side refresh is still wanted, do it once in the provider.
**Risk.** Low once B1's provider exists.

### B3 — `/projects` & `/jobs` lists are uncached dynamic (P1, ★★★★)

**Evidence.** Both read `searchParams` in the page component → Next renders them dynamically and ignores `export const revalidate = 120`. `curl` shows `Cache-Control: private, no-cache, no-store`, no `x-nextjs-cache`. Each request runs 2–3 Supabase queries (`projects` + `categories`, or `jobs` + count).

**Fix direction (Phase 1).**
- Wrap the Supabase reads in `unstable_cache(fn, keyParts, { revalidate: 120, tags: [...] })` keyed by the normalised filter/sort/page. The route stays dynamic (it must, to read the URL) but the **data** is served from cache and shared across users; add tag-based revalidation from the admin panel's existing `/api/revalidate`.
- Or: render the *unfiltered first page* as static and do filtering/pagination client-side against a cached JSON endpoint. Bigger change; keep for later if `unstable_cache` isn't enough.
**Risk.** Medium — must get cache keys and invalidation right so the admin panel's edits still appear within `revalidate`.

### B4 — Detail/category/learning routes dynamic despite `revalidate` (P2, ★★★★)

**Evidence.** `/projects/[id]`, `/jobs/[id]`, `/jobs/companies/[id]`, `/learning/**`, `/coding-problems/[slug]` all export `revalidate = 300`, have **no `generateStaticParams`**, and serve `no-store`. `@supabase/postgrest-js` 2.112 makes its `fetch` uncacheable to Next, which forces the route dynamic.

**Fix direction (Phase 2).** Same `unstable_cache` wrapper around the per-id fetch (`getProject(id)`, `getJob(id)`, …). Optionally add `generateStaticParams` for the top-N most-visited ids so they're prerendered. After this, these routes get `x-nextjs-cache: HIT` and CDN caching.
**Risk.** Medium — cache invalidation on admin edits (tag per entity id).

### B5 — Middleware auth round-trip on every request (P1, ★★★★, easy)

**Evidence.** `middleware.ts` matcher = everything except static assets; body calls `await supabase.auth.getUser()`.

**Fix direction (Phase 1).**
- Narrow the `matcher` to the routes that actually need a fresh server session: `/account/:path*`, `/resume/:path*`, `/custom-projects/:path*`, `/r/:path*`, `/logout`. Public catalog + legal + home don't need it.
- Keep `getUser()` there (it's the correct call for a token refresh) — just stop running it site-wide.
**Risk.** Low — verify no public page relies on the middleware's cookie refresh (they shouldn't; they're anon).

### B6 — `AnnouncementBar` client query every page (P2, ★★★, easy)

**Evidence.** `src/components/home/AnnouncementBar.tsx` `useEffect` → `supabase.from("announcements").select(...).limit(5)` on every mount (every page).

**Fix direction.** Fetch announcements server-side once (in a cached helper, `unstable_cache` 300 s) and pass to a tiny client component that only handles the dismiss interaction — or fold it into the B1 `<SessionProvider>` server fetch. Removes a query per load and one more `createBrowserSupabase` from the layout.
**Risk.** Low.

### B7 — Legacy Pages-Router runtime in `main` (P3, easy, config)

**Evidence.** Analyzer: `main` chunk contains `next/dist/shared/lib/router/router.js` (~24 KB raw) — the *Pages* Router — though the app is App-Router-only.

**Fix direction.** Confirm nothing under `src/pages/` exists (it doesn't). This is largely Next-internal; the realistic lever is (a) `experimental.optimizePackageImports` additions, (b) keeping Next patch-current, (c) evaluating Next 15 later (better tree-shaking of the client runtime). Low effort, modest, non-urgent.

### B8 — No `.browserslistrc` → fat polyfills chunk (P3, ★★★, very easy)

**Evidence.** No `.browserslistrc` / `browserslist` key. `polyfills-*.js` = 109 KB raw / 38 KB gz.

**Fix direction.** Add a modern `.browserslistrc` (e.g. `chrome >= 111`, `safari >= 16.4`, `firefox >= 111`, `edge >= 111`, or `>0.5% and not dead and last 2 years`). Next then emits a much smaller polyfills chunk. Verify against the mobile app's actual WebView floor and the site's analytics before committing the range.
**Risk.** Low-Medium — only excludes browsers you deliberately choose to drop; no code change.

### B9 — `/projects` HTML bloat: 193 inline SVGs + 142 KB flight (P2, ★★★)

**Evidence.** `/projects` HTML = 275 KB; 193 `<svg>` (mostly `Rating` stars — 5 per card × ~24 cards + icons); ~142 KB inline RSC flight; the whole response is `no-store`.

**Fix direction.**
- `Rating`: render one SVG `<symbol>` set once and `<use href="#star">` per star, or a CSS mask / single-path 5-star SVG. Cuts the bulk of the 193.
- B3's caching makes the (still-large) flight payload amortise across users instead of regenerating per request.
- Consider trimming `PROJECT_LIST_FIELDS` if any unused columns ride along in the flight data.
**Risk.** Low-Medium — `Rating` is shared; needs a visual diff check.

### B10 — LCP images not prioritised (P2, ★★★, easy)

**Evidence.** `priority` is set only in `projects/[id]/Gallery.tsx`. The home hero `<Image>` (rendered when an admin `banners` row exists for placement `home`) and the first row of `ProjectCard` / `JobCard` images have no `priority`.

**Fix direction.** Add `priority` to the home hero image when a banner is present; add `priority` (or `loading="eager"` + `fetchPriority="high"`) to the first 2–4 cards in a grid. Note: the **default** home hero is text + `HeroVisual` (server-rendered, no image) so default-home LCP is a text node — fine; this matters for the banner-set case and for `/projects/[id]`, `/jobs/[id]`.
**Risk.** Very low.

### B11 — `/resume` auth double-call + serial waterfall (P2, easy)

**Evidence.** `resume/page.tsx`: `await getOptionalUser()` then `await loadTemplates()` sequentially; `getOptionalUser` → `getAuthUser` → `supabase.auth.getUser()` — and the middleware already ran `getUser()` for the same request. Local TTFB 121 ms (highest of the 5).

**Fix direction.** `Promise.all([getOptionalUser(), loadTemplates()])`; cache `loadTemplates()` (`unstable_cache`, it's public catalog); rely on the (now scoped, B5) middleware refresh so the page can trust `getAuthUser()`'s request-memoised value. `getAuthUser` is already `cache()`-wrapped so the page↔layout share one call — just avoid the serial `await`.
**Risk.** Low.

### B12 — `Reveal` on 6 home sections (P3)

**Evidence.** `Reveal` (`"use client"`, IntersectionObserver) wraps 6 sections on the home page. It SSRs children **visible** (`state: "static"`) so there's no hidden-content or CLS hazard, and it no-ops for reduced-motion / no-IO. But it's 6 client component instances + observers.

**Fix direction.** Low priority. Could replace with a CSS-only `@starting-style` / scroll-driven animation (progressive enhancement, zero JS) once browser support matches the `.browserslistrc`. Or accept as-is.
**Risk.** Low.

### B13 — `qrcode.react` eager in resume subtree (P3, easy)

**Fix direction.** `const QRCodeSVG = dynamic(() => import("qrcode.react").then(m => m.QRCodeSVG))` inside `ShareModal`, or lazy-import when the modal opens.
**Risk.** Very low.

### B14 — API route cold starts (P3)

**Fix direction.** These are already `runtime = "nodejs"` + `serverComponentsExternalPackages`. Options: lazy `await import()` the heavy lib inside the handler so it's not in the module top-level; or split PDF/DOCX generation to a queue/edge-friendlier path. Low priority — export/parse are infrequent, user-initiated, and a spinner is acceptable.

### B15 — Build time (P4, DX only)

**Fix direction.** `next build` runs `tsc --noEmit` + `next lint`. Move both to a parallel CI job and set `eslint.ignoreDuringBuilds` / `typescript.ignoreBuildErrors` **only in CI where a separate gate covers them** (never locally-blind). Or accept 50 s warm. Not user-facing.

---

## 6. Proposed phase plan (for approval)

Each phase = one focused commit, before/after numbers on the same 5 URLs (+ `next build` route table + `ANALYZE=true` bundle diff), no UX change.

| Phase | Theme | Findings | Expected result |
|---|---|---|---|
| **1** | De-Supabase the shell + scope middleware | B1, B2, B5, B6 | −64 KB gz on every route; static routes ~125–130 KB gz; INP/TBT drop; signed-in TTFB −1 round-trip. **Biggest single step.** |
| **2** | Restore caching on the catalog | B3, B4, B11 | `/projects*`, `/jobs*`, detail pages become ISR/CDN-cacheable; dynamic TTFB → <200 ms; `/resume` waterfall removed |
| **3** | Payload & LCP trim | B9, B10, B8, B13 | `/projects` HTML −80–120 KB; polyfills −20–38 KB gz; hero/list LCP images prioritised |
| **4** | Framework & long tail | B7, B12, B14, B15 | modest transfer + build-time gains; evaluate Next 15 |
| **(each phase)** | Re-measure | — | Update §3 tables; run Lighthouse against a deployed preview for real CWV |

**Recommended start:** Phase 1.

---

## 7. Appendix — reproduce

```bash
cd website

# Build + route table + First Load JS
npm run build                       # ~50 s warm / ~156 s cold

# Bundle analyzer (installed Phase 0; no-op unless ANALYZE=true)
ANALYZE=true npm run build
#   → .next/analyze/{client,edge,nodejs}.html  (open client.html)

# Server timing + cache headers
npm start &
for u in / /projects /projects/tr-2 /jobs /jobs/job-1 /resume /about; do
  curl -s -o /dev/null -D - "http://localhost:3000$u" \
    -w '%{url_effective}  http=%{http_code}  ttfb=%{time_starttransfer}s  bytes=%{size_download}\n' \
    | grep -iE '^(cache-control|x-nextjs-cache|url_effective|.*ttfb)'
done

# Lighthouse (NOT run in Phase 0 — no Chrome here). On a machine with Chrome:
npx lighthouse http://localhost:3000/          --form-factor=mobile  --output=json --output-path=lh-home-mobile.json
npx lighthouse http://localhost:3000/projects  --preset=desktop      --output=json --output-path=lh-projects-desktop.json
# repeat for /projects/<id>, /jobs, /resume
```

**Phase 0 changes committed** (tooling + this report only — no source/behaviour change):
- `website/package.json` + `package-lock.json` — add `@next/bundle-analyzer@14.2.35` (devDependency)
- `website/next.config.js` — wrap config in `withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" })` (no-op for normal builds)
- `website/PERFORMANCE_AUDIT.md` — this document
