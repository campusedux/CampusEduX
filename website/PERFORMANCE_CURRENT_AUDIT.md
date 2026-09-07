# CampusEduX Website — Current Speed & Performance Audit

**Date:** 2026‑09‑06
**Branch:** `audit/full-project-review` (working tree clean at start)
**Scope:** `website/` only (Next.js App Router). Mobile app + admin panel untouched.
**Type:** **AUDIT ONLY** — no source, config, package, database, migration, policy, UI, route,
or behaviour change. No commit / push / stash / reset. Build output (`.next/`, `.next/analyze/`)
is regenerated and git‑ignored; nothing tracked was modified (`git status --short` at the end).

**Evidence labels used throughout**

| Label | Meaning |
|---|---|
| **MEASURED** | A number produced by a command in this environment (`next build`, `next start` + `curl`, `@next/bundle-analyzer`, `gzip -c`). |
| **OBSERVED** | A fact read directly from source / config / build manifests. |
| **ESTIMATED** | A projection from payload + render path + standard assumptions. Not a result. |
| **NOT MEASURED** | Could not be produced here (no browser, no DB access, not deployed). No number invented. |

---

## 1. Executive Summary

CampusEduX's website is **architecturally an SPA shell in front of a well‑cached server**. The
Phase 1–5 optimisation work committed earlier on this branch is **real and verifiable**: the
seven catalog detail routes are now ISR and serve from cache in **4–23 ms** locally, the
`/projects` / `/jobs` lists have a cross‑request `unstable_cache` data layer and CDN
`s‑maxage` headers, `select("*")` is mostly gone, images are configured for AVIF/WebP, and a
Lighthouse CI budget is wired up.

**What still makes it feel heavy:** every single route — including a static text page like
`/about` — ships the **same ~221 KB gzip of JavaScript**, of which **~67 KB gzip is the full
Supabase browser SDK** (`@supabase/ssr` + `supabase-js` + `auth-js`), pulled in by four
navigation islands (`AuthMenu`, `NotificationBell`, `MobileNav`, `PremiumPromo`) plus
`AnnouncementBar` that mount on every page. A further **~40 KB gzip** is a legacy‑browser
polyfill chunk (no `.browserslistrc`). So a page with zero interactivity still downloads,
parses and hydrates an auth client it never uses.

**The one dynamic route that is genuinely slow** is `/resume` (`force-dynamic` + an *uncached*
Supabase query per visit): **MEASURED TTFB 158–725 ms** on `next start`, versus 4–23 ms for
the ISR routes.

**Core Web Vitals (LCP / INP / CLS / FCP) could not be directly measured in this environment** —
there is no Chrome / Chromium / Playwright / Puppeteer / Lighthouse binary available and the
site is not deployed to a URL reachable from here. Every CWV figure below is explicitly an
ESTIMATE.

**Overall performance score: 63 / 100 — ACCEPTABLE.**
Server & caching would score ~80; client‑side JavaScript ~55; the production network picture
is unverified (deploy region and Supabase region are both unknown from the repo).

**The three highest‑value changes, unchanged from the prior audit's "R1–R3":**
1. Get the Supabase browser SDK out of the global layout (~‑67 KB gzip on *every* route).
2. Add a modern `.browserslistrc` (~‑15–34 KB gzip polyfills for modern visitors).
3. Verify the deploy region matches the Supabase region (cheapest latency win if mismatched).

---

## 2. Environment

| Item | Value | Source |
|---|---|---|
| Node / npm | **v22.23.1 / 10.9.8** | MEASURED (`node -v`, `npm -v`) |
| Package manager | **npm** (`package-lock.json`; no `pnpm-lock`/`yarn.lock`, no pnpm/yarn binary) | OBSERVED |
| Framework | **Next.js 14.2.35**, App Router | OBSERVED (`package.json`, build banner) |
| Router files | 69 `page.tsx` + 7 API `route.ts` + 7 `loading.tsx`; **0 Pages Router routes** (Next still emits tiny `pages/_app`, `pages/_error` stubs) | OBSERVED |
| React | **18.3.1** / react‑dom 18.3.1 | OBSERVED |
| TypeScript | `~5.4`, `strict: true`, `moduleResolution: "bundler"`, `target: ES2017`, `incremental` | OBSERVED (`tsconfig.json`) |
| Styling | **Tailwind CSS 3.4** (`content: ["./src/**/*"]`), PostCSS + autoprefixer. One site‑wide CSS file: **55 KB raw / 10.4 KB gzip**, `immutable` cached. No CSS‑in‑JS. | OBSERVED + MEASURED |
| **`.browserslistrc`** | **Absent**; no `browserslist` key in `package.json` → Next emits its broad legacy polyfill set | OBSERVED |
| Fonts | **None.** System font stack in `tailwind.config.ts` / `globals.css`. No `next/font`, no `@font-face`, no web‑font request, no font CSS. | OBSERVED |
| Data layer | `@supabase/supabase-js` 2.57 + `@supabase/ssr` 0.4. Three clients: `getPublicSupabase()` (anon key, `persistSession:false`, server, public catalog), `createAuthedServerSupabase()` (cookie SSR client, `/account` + auth pages), `createBrowserSupabase()` (browser **singleton**, forms + nav islands). | OBSERVED |
| Rendering strategy | Per‑route `export const revalidate` (mostly 300 s, `/projects`+`/jobs` 120 s) + `generateStaticParams` on 7 dynamic‑segment routes for ISR + a few `export const dynamic = "force-dynamic"`. | OBSERVED |
| Server vs Client Components | **77 files with `"use client"`** out of 263 `.ts(x)` in `src/`. Root layout + all pages are Server Components; client is confined to nav islands, forms, interactive panels, the compiler and the résumé editor. | OBSERVED |
| Middleware | `middleware.ts` runs `await supabase.auth.getUser()` on every non‑asset request. Matcher excludes only `_next/static`, `_next/image`, `favicon.ico`, `*.{svg,png,jpg,jpeg,gif,webp}` → runs on **all HTML navigations, all `/api/*`, `/sitemap.xml`, `/robots.txt`**. | OBSERVED |
| `next.config.js` | Security headers (CSP etc.) on all routes; `images` = `formats:["image/avif","image/webp"]`, `minimumCacheTTL:86400`, `deviceSizes:[640,750,828,1080,1200,1920]`, `remotePatterns:[**.supabase.co]`; `experimental.serverComponentsExternalPackages:["pdf-parse","pdfjs-dist","@napi-rs/canvas"]`; `experimental.optimizePackageImports:["@/components/ui"]`; 308 redirects `/placement*`→`/learning`; `/:path(projects|jobs)` → `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`; `@next/bundle-analyzer` wrapper (opt‑in `ANALYZE=true`). | OBSERVED |
| Analytics | **None.** No GA / GTM / Segment / Plausible / PostHog / Mixpanel / Hotjar / Clarity / `@vercel/analytics` / `@vercel/speed-insights`. `grep` of `src/` + `next.config.js` = no matches. | MEASURED (grep) |
| `next/script` | **Not used anywhere.** | MEASURED (grep) |
| Third‑party scripts | **Razorpay checkout only** (`https://checkout.razorpay.com`), loaded on a checkout click; `<link rel="dns-prefetch">` for it in `<head>`. Nothing else. | OBSERVED |
| Runtime deps | `@anthropic-ai/sdk` (server, `/api/resume/assist`), `@react-pdf/renderer` (server, PDF export), `@supabase/ssr` + `supabase-js`, `docx` (server), `lucide-react`, `mammoth` (server, DOCX parse), `next`, `pdf-parse` (server), `prismjs` (client, `/compiler` only via `next/dynamic`), `qrcode.react` (client, lazy), `react`/`react-dom`, `zod`. | OBSERVED |
| Hosting region | **Unknown from repo.** No `vercel.json`, `netlify.toml`, Dockerfile, `fly.toml`. `NEXT_PUBLIC_SITE_URL` → `https://campusedux.app`. | OBSERVED |
| Supabase project | Ref `oqwjooaapsotnncmhvtk.supabase.co` (shared with mobile + admin). **Region not encoded in the hostname** → requires the Supabase dashboard. | OBSERVED |
| Browser / Lighthouse tooling | **Not available.** No `google-chrome` / `chromium` / `lighthouse` / `lhci` binary; no `playwright` / `puppeteer` package. | MEASURED (`which`, `ls node_modules`) |

**Reproduce**

```bash
cd website
npm run build                 # route table + First Load JS
ANALYZE=true npm run build     # → .next/analyze/client.html  (bundle treemap)
PORT=3210 npm run start        # production server
curl -s -D - -o /dev/null            http://localhost:3210/<route>       # headers + cache
curl -s -o /dev/null -w '%{time_starttransfer} %{size_download}\n' ...   # TTFB + bytes
curl -s --compressed -o /dev/null -w '%{size_download}\n' <asset>        # wire (gzip) size
```

---

## 3. Build Results

| Metric | Value | Notes |
|---|---|---|
| `next build` — **warm** (`.next` present, `.next/cache` warm) | **33 s** MEASURED (`SECONDS=0` bash) | |
| `next build` — **cold** (`rm -rf .next`, `.next/cache` warm) **+ `ANALYZE=true`** | **115 s** MEASURED | `tsc --noEmit` + `next lint` run **inline** inside `next build`; ANALYZE adds report time. A prior run without ANALYZE was in the same ballpark. |
| Routes compiled | **79 route entries**: **34 Static `○`** + **7 SSG/ISR `●`** + **38 Dynamic `ƒ`** | MEASURED (build report) |
| Static HTML pages generated | **110** ("Generating static pages (110/110)") | MEASURED |
| Prerendered routes (prerender‑manifest) | **86** | MEASURED |
| ISR dynamic‑segment route patterns | **7**: `/projects/[id]`, `/jobs/[id]`, `/jobs/companies/[id]`, `/projects/category/[category]`, `/learning/[gridSlug]`, `/learning/[gridSlug]/[topicSlug]`, `/coding-problems/[problemSlug]` | MEASURED |
| Build errors / type errors / lint errors / warnings | **None** — clean build log | MEASURED |
| `.next/` size | ~225–250 MB | MEASURED |
| **First Load JS "shared by all"** (build report) | **87.8 kB** = `2117` 31.7 + `fd9d1056` 53.6 + other 2.44 | MEASURED |

### 3.1 Route table (build report — `First Load JS` column is Next's under‑count; see §6)

| Class | Routes | First Load JS (build report) |
|---|---|---|
| Static text pages | `/about`, `/faq`, `/referral`, `/placement*`, `/_not-found` | **88 kB** |
| Static (with a tiny client boundary) | all legal pages, `/contact`, `/support`, `/jobs/companies`, `/projects/{trending,best-sellers,new,premium}`, `/projects/category/*` landing, … | 96.8–102 kB |
| Home | `/` | **171 kB** |
| Catalog lists (dynamic, cached data) | `/projects`, `/jobs` | **104 kB** |
| ISR detail | `/projects/[id]` 172 · `/jobs/[id]` 173 · `/jobs/companies/[id]` 102 · `/learning/[gridSlug]` 99.1 · `/learning/[gridSlug]/[topicSlug]` **171** · `/coding-problems/[problemSlug]` **176** | 99–176 kB |
| Auth‑heavy static | `/premium` 165 · `/login` 166 · `/register` 167 · `/logout` 155 | 155–167 kB |
| Résumé | `/resume` 102 · `/resume/templates` 104 · `/account/resume/[id]/edit` **119** (largest interactive) | 102–119 kB |
| `/account/**` (18) | dynamic, cookies | 88–167 kB |
| `/compiler` | static, Prism via `next/dynamic` | 108 kB |
| API (7) | `0 B` client | n/a |

### 3.2 Shared‑chunk breakdown (build report)

```
chunks/2117-*.js       31.7 kB   Next App Router client runtime
chunks/fd9d1056-*.js   53.6 kB   react-dom (framework floor)
other shared chunks     2.44 kB
= First Load JS shared by all   87.8 kB
```

> The build report's per‑route "First Load JS" **understates the wire cost by ~2.5×** because
> `6608` (Supabase, ~52.8 kB gzip) and `44530001` (auth‑js, ~14 kB gzip) and `polyfills`
> (~39.6 kB gzip) are attributed per‑route, not to "shared by all", but they load on every
> route. The real per‑page number is **~221 kB gzip** (see §4 / §6).

### 3.3 Suspicious build‑output observations

- **`framework-*.js` (44.8 kB gzip) and `main-<hash>.js` (34.4 kB gzip)** exist in
  `.next/static/chunks` and in the bundle analyzer, but are **NOT referenced by any App
  Router page's HTML** (verified — `/about` loads `main-app-*.js` = 464 bytes, not
  `main-<hash>.js`). They are the Pages Router runtime, emitted but dead on disk.
  *(This corrects the prior audit's "B7 — legacy Pages‑Router `router.js` shipped in `main`
  on every page"; it is not shipped on these routes.)*
- API route server bundles carry their heavy libs: `api/resume/parse` **536 kB**,
  `api/resume/export/docx` **369 kB**, `api/resume/assist` **202 kB** — serverless
  cold‑start weight (not client). `pdf-parse` alone is 21 MB in `node_modules`.

---

## 4. Route Performance

**How measured:** `PORT=3210 npm run start`, warm (2nd+ request), `curl`. Local TTFB = **server
compute only** — production must add client↔host RTT and (for uncached routes) host↔Supabase
RTT. Sandbox Supabase RTT from this machine was MEASURED at **~190–410 ms/query** (TCP connect
~35–80 ms, TLS ~90–155 ms) — not a production number, but it shows the cost of any uncached
query.

| Route | TTFB (compute), MEASURED | HTML raw | HTML gzip | `Cache-Control` | `x-nextjs-cache` | Render mode |
|---|---|---|---|---|---|---|
| `/` | **14 ms** (STALE→revalidate seen) | 226 KB | **19.6 KB** | `s-maxage=300, swr` | HIT / STALE | ISR |
| `/about` | **5 ms** | 49 KB | **8.4 KB** | `s-maxage=31536000, swr` | HIT | Static |
| `/projects` | **32–50 ms** | **275 KB** | **16.2 KB** | `public, s-maxage=60, swr=300` | — (dynamic) | `ƒ` + cached data |
| `/projects/pr-1` (detail) | **7–13 ms** | 112 KB | ~11 KB | `s-maxage=300, swr` | HIT / STALE | **ISR** |
| `/jobs` | **19–24 ms** | 115 KB | ~13 KB | `public, s-maxage=60, swr=300` | — | `ƒ` + cached data |
| `/jobs/job-1` (detail) | **5–7 ms** | 70 KB | — | `s-maxage=300, swr` | HIT | **ISR** |
| `/jobs/companies/google` | **5–6 ms** | 69 KB | — | `s-maxage=300, swr` | HIT | **ISR** |
| `/projects/category/web-development` | **7–8 ms** | 200 KB | — | `s-maxage=300, swr` | HIT | **ISR** |
| `/learning` (index) | **25–41 ms** | 62 KB | — | **`private, no-store`** | — | `ƒ` (uncached RPC) |
| `/learning/java-tutorial` | **18–24 ms** | **569 KB** | **73 KB** | `s-maxage=300, swr` | HIT | ISR |
| `/learning/python-tutorial` | **7 ms** | 178 KB | — | `s-maxage=300, swr` | HIT | ISR |
| `/premium` | **4–6 ms** | 86 KB | — | `s-maxage=300, swr` | HIT / STALE | Static ISR |
| `/resume` | **158–725 ms** (avg ≈ 300 ms; one 725 ms spike) | 128 KB | 25 KB | **`private, no-store`** | — | **`ƒ` force-dynamic, uncached Supabase / visit** |
| `/resume/templates` | **6 ms** | 121 KB | — | `s-maxage=300, swr` | HIT | Static ISR |
| `/compiler` | **8 ms** | 49 KB | — | `s-maxage=31536000, swr` | HIT | Static |
| `/faq` · `/terms` · `/login` · `/contact` | **3–5 ms** | 49–89 KB | — | `s-maxage=31536000, swr` | HIT | Static |
| `/account` | **21 ms** → HTTP 307 → `/login` | — | — | `no-store` | — | `ƒ` (cookies) |
| `/sitemap.xml` | **3 ms warm / 95 ms cold** | 46 KB | — | `public, max-age=0, must-revalidate` | HIT | ISR‑ish (6 Supabase queries on miss) |
| `/robots.txt` | **4 ms** | 334 B | — | — | — | Static |
| 404 (`/this-does-not-exist`) | **22 ms** | 49 KB | — | `no-store` | — | `ƒ` |

**Per‑route asset payload (identical on every HTML route — MEASURED via `curl --compressed`
against the `<script>` / `<link>` list in each page's HTML):**

| Asset class | Wire (gzip) | Notes |
|---|---|---|
| **JavaScript (13 files)** | **~221 KB gzip** | `/about` 221,261 B · `/` 221,261 B · `/projects` 220,945 B · `/resume` 219,731 B — only the per‑route page chunk (2–5 KB) varies; the shell dominates. |
| — of which Supabase | **~67 KB gzip** | `6608` 52.8 + `44530001` 14.1 — present on `/about` (a static text page). |
| — of which `nomodule` polyfills | **~39.6 KB gzip** | `<script noModule>` — modern browsers don't execute it, many still fetch it. |
| — modern‑browser JS (excl. polyfills) | **~181 KB gzip** | |
| **CSS (1 file)** | **10.4 KB gzip** (55 KB raw) | Whole‑site Tailwind, `immutable`. One render‑blocking `<link>`. |
| **Fonts** | **0 B** | System stack — no request. |
| **Images** | **0 B in the seed** | Seed DB has no thumbnails / logos / banners; `next/image` pipeline untestable here. |
| **Third‑party** | **0 B** on load | Razorpay only on a checkout click. |
| **HTML** | 8.4 KB gzip (`/about`) → **73 KB gzip** (`/learning/java-tutorial`) | |

**Total first load for a static page (`/about`): HTML 8.4 + JS 221 + CSS 10.4 ≈ 240 KB gzip**
(or **≈ 200 KB gzip** discounting the polyfill chunk).

Per‑route TTFB verdict:
- **Fast (< 25 ms):** every ISR / static route — the Phase 2 `unstable_cache` + `generateStaticParams` work is doing its job.
- **Acceptable (25–50 ms):** `/projects`, `/jobs`, `/learning` — dynamic renders reading cached data (`/projects`/`/jobs`) or an uncached RPC (`/learning`).
- **Slow (> 150 ms):** **`/resume` only** — `force-dynamic` + uncached `loadTemplates()` Supabase query + `getOptionalUser()`.

---

## 5. Core Web Vitals

**Core Web Vitals could not be directly measured in this environment.**
No Chrome / Chromium / headless‑browser / Lighthouse binary is installed, no `playwright` /
`puppeteer` package is present, and the site is not deployed to a URL reachable from here
(so PageSpeed Insights cannot see it either).

| Metric | Mobile | Desktop | Status |
|---|---|---|---|
| LCP | — | — | **NOT MEASURED** |
| INP | — | — | **NOT MEASURED** |
| CLS | — | — | **NOT MEASURED** |
| FCP | — | — | **NOT MEASURED** |
| TTFB (real) | — | — | **NOT MEASURED** (local *compute* TTFB is in §4) |

**Directional ESTIMATES** (from payload + render path + standard Lighthouse mobile assumptions:
mid‑tier phone, 4× CPU throttle, ~1.6 Mbps / 150 ms RTT "Slow 4G") — **not results**:

| Metric | ESTIMATE | Reasoning |
|---|---|---|
| LCP (mobile, default home) | **~2.0–2.8 s** | LCP element is a server‑rendered text node (good), but first paint waits on ~181 KB gzip JS + 10.4 KB CSS parse/exec; hydration of 4 auth islands competes. |
| LCP (mobile, `/projects/[id]` or banner home) | **~2.4–3.4 s** | image‑gated; `priority` + blur are set, helps. |
| INP (mobile) | **~150–350 ms during hydration**, ~<100 ms after | 4× `useSessionProfile` islands each create a browser Supabase client + `auth.getUser()` + `profiles` select + `onAuthStateChange` on mount. |
| CLS | **~0.02–0.10** | system font (no swap), fixed‑size avatars, blur placeholders — all good. Risks: `AnnouncementBar` renders `null`→bar after a client fetch; learning‑article Markdown `<img>` has no reserved box. |
| FCP (mobile) | **~1.4–2.0 s** | one render‑blocking 10.4 KB CSS; no blocking fonts. |

A Lighthouse CI job (`.github/workflows/website-ci.yml` + `website/lighthouserc.json`) exists but
**has not been exercised** (no Chrome in CI runs seen; PHASE5 notes flag it as un‑calibrated).
Running it on a deployed preview, or `npx lighthouse` locally on a machine with Chrome, is the
way to get real numbers.

---

## 6. Bundle Analysis

**Source:** `ANALYZE=true npm run build` → `.next/analyze/client.html`, parsed for
`parsedSize` / `gzipSize`; cross‑checked against `curl --compressed` of the live assets on
`next start` (numbers agree within ~0.5 %).

### 6.1 Largest client chunks

| # | Chunk | Parsed | **gzip** | What it is | On every route? | Removable? |
|---|---|---|---|---|---|---|
| 1 | `6608` | 190,846 | **52,718** | `@supabase/ssr` (index + 35 concat modules) + `@supabase/auth-js` (webauthn, GoTrueAdminApi, helpers, fetch, errors, base64url) + `next/dist/compiled/buffer` (22.5 KB parsed) | **YES** | **YES — R1** |
| 2 | `fd9d1056` | 172,835 | 53,638 | react‑dom | YES | No (framework floor) |
| 3 | `framework` | 139,979 | 44,844 | react framework | **No** — Pages Router chunk, not referenced by App Router HTML | dead file on disk |
| 4 | `2117` | 124,365 | 31,736 | App Router client runtime (react‑server‑dom‑webpack, react.production.min, app‑router, layout‑router, router‑reducer, scheduler) | YES | No (framework floor) |
| 5 | `main` | 119,033 | 34,433 | Pages Router `main` | **No** — not referenced | dead file on disk |
| 6 | `app/account/resume/[id]/edit/page` | 66,494 | 18,806 | résumé editor (largest route chunk) | No (that route only) | already split |
| 7 | `44530001` | 65,372 | **14,027** | `@supabase/auth-js` **`GoTrueClient.js`** (single module) | **YES** | **YES — R1** |
| 8 | `5712` | 29,104 | 9,945 | `prismjs` + java/cpp/python/c/clike grammars | **No — `/compiler` only** (`next/dynamic`, `ssr:false`) | ✓ already contained |
| 9 | `app/coding-problems/[problemSlug]/page` | 26,218 | 7,941 | coding‑problem workspace | No | — |
| 10 | `app/compiler/page` | 26,073 | 8,693 | compiler UI | No | — |
| 11 | `2972` | 26,067 | 8,698 | `next/link` + route‑regex + format‑url | YES | No |
| 12 | `app/layout` | 18,563 | 5,463 | **nav islands** (MobileNav 3933, AuthMenu 3579, navConfig 2416, Drawer 1704, FooterColumns 1110, AnnouncementBar 908+643, BottomNav 897, useSessionProfile 871, HeaderLinks 848, NotificationBell 521, supabase/browser 230) | YES | this is what drags #1 + #7 in |
| 13 | `5398` | 16,251 | 5,998 | `qrcode.react` | **No — own lazy chunk** (`ShareModal` via `next/dynamic`) | ✓ not in any first load |
| 14 | `5878` | 13,297 | 5,158 | `next/image` client + `next/head` | YES | No |
| 15 | `polyfills` | 112,594 | **39,627** | legacy polyfills (`nomodule`) | YES (fetched by many) | **shrinkable — B8 (`.browserslistrc`)** |

- **`lucide-react`** — tree‑shaken to per‑icon modules across route chunks (`6273`, `9755`,
  `1657`, and route chunks). **89 import sites, no barrel chunk.** `optimizePackageImports`
  is working. OBSERVED — nothing to do.
- **Server‑only, correctly NOT in the client bundle:** `@react-pdf/renderer`, `docx`,
  `mammoth`, `pdf-parse`, `@anthropic-ai/sdk`. (They inflate their own route functions —
  §3.3.)
- **Total client JS:** ~1.34 MB parsed / **~424 KB gzip** across all chunks; **~221 KB gzip
  loads on any one route.**

### 6.2 Supabase / browser‑SDK on static pages

MEASURED: `/about` (a static text page) loads **13 `<script>`** including `6608` (52.8 KB
gzip) and `44530001` (14.1 KB gzip). **`@supabase/*` = ~67 KB gzip on every route.** It also
prefetches `app/page` (home chunk, ~2.3 KB gzip) via the header logo `<Link href="/">`.

### 6.3 First Load JS — reported vs actual

| | Build report | **MEASURED wire (gzip)** |
|---|---|---|
| "shared by all" | 87.8 kB | — |
| `/about` (static) | **88 kB** | **~221 kB** JS + 10.4 kB CSS |
| `/` | 171 kB | ~221 kB JS + 10.4 kB CSS |
| framework floor (react‑dom + app‑router + webpack + main‑app) | — | **~88 kB gzip** |
| + polyfills | — | ~128 kB gzip |
| + Supabase SDK | — | **~195 kB gzip** |

Route‑level code‑splitting is **not** where the wins are — the per‑route page chunk is
2–5 KB gzip. The shared shell is.

---

## 7. Supabase / Database Analysis

> No direct database access in this environment — query **shapes** are OBSERVED from source;
> **index / RLS state and `EXPLAIN` plans are NOT MEASURED**. Items 14–15 are carried from the
> prior audit and flagged.

### 7.1 Query inventory

**1 — `src/lib/cache.ts` → `getCachedProjectsPage`**
`supabase.from("projects").select(<10 cols>, { count: "exact" }).order(<sortCol>).range(from,to)`
+ `.ilike("title", '%q%')` + optional `eq`/`gte`/`lte`.
*Does:* the `/projects` list page + total count.
*Why slow:* **leading‑wildcard `ILIKE '%term%'` cannot use a btree index → sequential scan** for
every distinct search term (each is a cache MISS); **`count:"exact"`** = a full filtered
`COUNT(*)` per query; sort columns `price` / `rating` / `sales_count` likely un‑indexed.
Cross‑request cached (`revalidate:120`, tag `projects`), so repeated identical filters are cheap.
*Impact:* ESTIMATED — first hit per filter combo: ~150–300 ms on a populated DB (mostly seq scan
+ COUNT); amortised after.
*Safe optimisation:* `pg_trgm` GIN on `projects.title` (`perf/phase1_indexes.sql`); btree on
`price`, `rating`, `sales_count`; `count:"planned"` / `"estimated"` or a `pageSize+1`
"has‑next" heuristic (**product decision** — changes the visible total to approximate).

**2 — `getCachedJobsPage`** — same shape on `jobs` with `.ilike("title")` **and**
`.ilike("location")` **and** `count:"exact"`; sort `salary_max_lpa desc`.
*Safe optimisation:* `pg_trgm` GIN on `jobs.title`, `jobs.location`; btree on
`jobs (salary_max_lpa desc nulls last)`.

**3 — `src/app/page.tsx` → `getCachedHomeData`** — 6 queries in one `Promise.all` ✓, each
`.limit()`‑bounded, cross‑request cached (tags `home` + `cms`). **Good.** No change.

**4 — `src/app/learning/page.tsx` → `getLearningGrids()`** (`learning_grids_list` RPC).
*Why slow:* wrapped in **`cache()` only** (request‑scoped), **not `unstable_cache`**. `/learning`
is `ƒ` `no-store` → the RPC re‑runs on every request; the route has **no `s-maxage` header**
(unlike `/projects` / `/jobs`).
*Impact:* MEASURED local TTFB 25–41 ms; ESTIMATED with real Supabase RTT: +150–250 ms per
uncached hit.
*Safe optimisation:* wrap in `unstable_cache` (tag `learning`); add the same
`public, s-maxage=60, swr` header the config already gives `/projects|jobs`.

**5 — `src/app/resume/page.tsx` → `loadTemplates()`** —
`getPublicSupabase().from("resume_templates").select(...)` **uncached**, even though
`getCachedResumeTemplates()` exists in `cache.ts` and is used elsewhere. Route is
`export const dynamic = "force-dynamic"`. Also runs `getOptionalUser()` (auth).
*Why slow:* **MEASURED TTFB 158–725 ms** — one (sometimes two) uncached Supabase round‑trips
per visit. The slowest route on the site.
Signed‑in branch adds a 5‑query `Promise.all` including **`select` of every `resume_versions`
row and every `resume_downloads` row** just to count them per résumé (R7).
*Safe optimisation:* call `getCachedResumeTemplates()`; render the signed‑out landing as ISR
(drop `force-dynamic` there, or split the route); `count:'exact', head:true` grouped for the
tallies.

**6 — `src/app/account/page.tsx`** — `Promise.all` of 5: **`wallet_transactions.select("type,amount").eq("user_id",…)` with no `limit`** (full user history) then summed in JS to display one number; + 3 × `{count:"exact", head:true}`; + 1 `maybeSingle`.
*Safe optimisation:* a `SECURITY DEFINER wallet_balance()` RPC returning the scalar (M6,
drafted in `docs/perf/suggested-indexes.sql`). The counts are fine.

**7 — `src/app/account/wallet/page.tsx`** — `wallet_transactions.select(...).limit(50)` then
**balance = JS `reduce` over those 50 rows.** Latent correctness issue: the displayed balance
only sums the most recent 50 transactions. Same fix (`wallet_balance()` RPC).

**8 — `src/lib/cache.ts` → `getCachedJobDetail`** —
`supabase.from("jobs").select("*, company:companies(id,name,logo_url,about)")` — **the one
remaining `select("*")`** (every other getter is explicit).
*Safe optimisation:* enumerate the `jobs` columns actually rendered by `/jobs/[id]`.

**9 — `getCachedProjectDetail`** — `.single()` then `Promise.all([reviews (join
`profiles(full_name)`, limit 10), related (limit 4)])`. Good shape; cached; tagged. No change.

**10 — `src/app/sitemap.ts`** — 6 queries on `/sitemap.xml` render: `projects` & `jobs`
`.limit(1000)`, `companies` `.limit(500)`, `categories` `.limit(200)`, 2 sitemap RPCs.
ISR‑cached (`x-nextjs-cache: HIT`), so amortised; first crawl / revalidation pays ~95 ms +
6 round‑trips. Low priority.

**11 — `src/lib/auth.ts`** — `getAuthUser` (`auth.getUser()`) + `getAccountUser` (`profiles`
select) both `cache()` (request‑memoised); `ensureLegalConsent` shares the memo. **1 `getUser()`
+ 1 `profiles` select per request** no matter how many `/account` components call. **Good.**

**12 — Static ISR list pages** (`/projects/trending`, `/projects/premium`,
`/projects/best-sellers`, `/projects/new`, `/jobs/companies`) call `getPublicSupabase()`
**directly** (not a cached getter), but have no dynamic API → Next prerenders them and
revalidates every 300 s, so the query runs at build + once per 300 s window, **not per
request**. Acceptable; not tag‑invalidatable (only the 300 s window).

**13 — Realtime** — **none.** The only subscription anywhere is
`supabase.auth.onAuthStateChange` inside `useSessionProfile` (× 4 island instances). No
`.channel()` / data `.subscribe()`. (MEASURED — grep.)

**14 — RLS `auth.uid()` not wrapped** — per `OPTIMIZATION_NOTES.md` §M2: `auth.uid()` appears
**317×** across all migration policies, **0** wrapped in `(select auth.uid())`, so Postgres
re‑evaluates it **per row** instead of once per statement. **NOT MEASURED here** (no DB).
`perf/phase1_rls_optimization.sql` has `ALTER POLICY` statements for the hottest tables —
**not run** (see §16).

**15 — Missing indexes** — `perf/phase1_indexes.sql` (pg_trgm GIN on the searched title/location
columns; btree on the marketplace sort columns; `resume_versions (user_id)`) — **not run**;
NOT MEASURED.

### 7.2 Server vs client Supabase misuse

None found. `src/lib/cache.ts` (`unstable_cache` layer) only ever calls `getPublicSupabase()`
(anon key, `persistSession:false`) against `using(true)` tables — **no cookie‑bound or
user‑scoped query is cached** (verified by grep: no `createAuthedServerSupabase`, `cookies(`,
`auth.uid`, `auth.getUser`, `user_id` filter in `cache.ts`). Client browser SDK is a proper
singleton.

---

## 8. Server Rendering Analysis

### 8.1 Waterfalls

Largely already parallel. `Promise.all` is used in: home (6 queries), project detail
(reviews ∥ related), company detail (company ∥ jobs), premium (plans ∥ features), résumé edit
(row ∥ shares ∥ templates), résumé signed‑in dashboard (5), `/account` (5), learning topic
(tree ∥ topic content), learning index (grids ∥ search), `/resume` signed‑out
(`getOptionalUser()` ∥ `loadTemplates()`).

Remaining **serial** awaits, all **inherent** (the second call needs a value from the first):
- `getCachedProjectDetail`: `project.single()` → `Promise.all([reviews, related])` — `related`
  needs `project.category_id`.
- `/resume` / `/account/*`: `requireUser()` / `getOptionalUser()` → the per‑user query batch —
  needs `user.id`.

No **avoidable** waterfall found.

### 8.2 Caching primitives

- **`React cache()`** — correct: `auth.ts` (`getAuthUser` / `getAccountUser`), and every detail
  route wraps its getter (`const getProject = cache(...)`) so `generateMetadata` + the page
  share one fetch, not two. OBSERVED.
- **`unstable_cache`** — `src/lib/cache.ts` (13 tagged getters) + `src/lib/learning.ts`
  (`getLearningGridSlugs` / `getLearningTopicParams` / `getCodingProblemSlugs` for
  `generateStaticParams`). **Gap:** `getLearningGrids` / `getLearningTree` /
  `getLearningTopicPage` / `getTopicPractice` / `getCodingProblem` / `getMockTest` /
  `getLearningGridBrief` are **`cache()` only**. The ISR full‑route cache covers the *detail*
  pages, but the dynamic `/learning` index has no cross‑request cache for its grid list (item 4).
- **`revalidateTag`** — `/api/revalidate` accepts `{ tags: [...] }` (9 known tags) with an
  `x-revalidate-secret` header. Endpoint ready; admin‑panel wiring is the owner's action (M5).
- **`generateStaticParams`** — bounded lists on `/projects/[id]` (top 40 by sales), `/jobs/[id]`
  (recent 40), `/jobs/companies/[id]` (all), `/projects/category/[category]` (all);
  **returns `[]`** on `/learning/[gridSlug]/[topicSlug]` and `/coding-problems/[problemSlug]`
  → every topic/problem is on‑demand ISR (first hit renders + caches). Deliberate (avoids
  ~150+ RPCs at build) — R3.

### 8.3 Dynamic rendering — necessary vs not

| Route | Why dynamic | Necessary? |
|---|---|---|
| `/projects`, `/jobs` | read `searchParams` | Yes (data is cached + CDN header applied) |
| `/learning` | reads `searchParams.q` | Yes for the route, but the grid list **should be cross‑request cached** + get an `s-maxage` header |
| `/account/**` (18) | `cookies()` via auth client | Yes — correctly `no-store` |
| `/resume` | `export const dynamic = "force-dynamic"` | **Partly unnecessary** — the signed‑out landing is public catalog; only the signed‑in dashboard needs it |
| `/mock-tests/[testId]` | `force-dynamic` | **Unnecessary** — title / instructions / question count are not personalised → ISR candidate (R4) |
| `/mock-tests/[testId]/result/[attemptId]`, `/r/[token]` | `force-dynamic` | Yes — per‑attempt / per‑token, view‑count side effects |
| `/custom-projects/**` | auth / `searchParams` | Yes |

### 8.4 Middleware

`middleware.ts` body = `await supabase.auth.getUser()`; matcher runs on **all HTML + all
`/api/*` + sitemap/robots**.
- **Logged‑out:** MEASURED — `/about` TTFB **4–8 ms** with no cookie, **3–6 ms** with an
  invalid fake cookie → `getUser()` short‑circuits, no network. Negligible.
- **Signed‑in:** **NOT MEASURED** (no real session available here). Per `@supabase/*`
  behaviour + the prior audit: `getUser()` calls `/auth/v1/user` on **every navigation** for a
  signed‑in user — ESTIMATED **+50–200 ms** per click on a distant Supabase region, *including*
  for pages that would otherwise be a static cache hit, and on every `/api/*` call.

---

## 9. Client Performance

| Concern | Finding | Evidence |
|---|---|---|
| `useSessionProfile` fan‑out | **4 islands** (`AuthMenu`, `NotificationBell`, `MobileNav`, `home/PremiumPromo`) each run, on mount, on **every page**: `createBrowserSupabase()` → `auth.getUser()` (network) → `profiles` select (network) → `onAuthStateChange` subscription. On the home page that's 4× getUser + 4× profiles + 4 subscriptions. | OBSERVED (`src/lib/useSessionProfile.ts` + grep) |
| `AnnouncementBar` | `"use client"`, `useEffect` → `announcements` select `.limit(5)` on **every page**; ~99 % of the time returns nothing → renders `null`; when an announcement is active it inserts a bar → downward shift (CLS risk). | OBSERVED |
| Supabase SDK hydration | ~67 KB gzip / ~256 KB parsed of `@supabase/*` compiled + executed on the main thread during hydration on **every route**, incl. ~20 static text pages that never use it. | MEASURED (bundle) |
| `Reveal` | `"use client"` IntersectionObserver, wraps **6 sections** on the home page. SSRs children visible (`state:"static"`) so no hidden‑content / CLS hazard; no‑ops for reduced‑motion / no‑IO. 6 component instances + observers. | OBSERVED |
| Nav components (`Header`, `HeaderLinks`, `BottomNav`, `HeaderSearch(Button)`) | `Header` / `HeaderSearch` / `HeaderSearchButton` are **Server** Components (good). `HeaderLinks`, `BottomNav`, `MobileNav`, `AuthMenu`, `NotificationBell` are client — needed for `usePathname` / interactivity. Small (`app/layout` chunk 5.5 KB gzip total). | OBSERVED |
| `CodeBlock` (learning) | `"use client"` (clipboard + "Run in compiler"). Rendered once per fenced block in a topic — fine. | OBSERVED |
| `Markdown` (learning) | **Dependency‑free** server renderer (no `react-markdown` / `remark`). Good — no MD library in the bundle. | OBSERVED |
| Résumé editor (`/account/resume/[id]/edit`) | 66 KB parsed / 18.8 KB gzip route chunk — the heaviest interactive route. `useDeferredValue` + `memo` on the live preview (Phase 3). Acceptable for a full editor. | OBSERVED |
| Duplicated hooks / re‑renders | No systemic problem found outside the `useSessionProfile` ×4. No data `useEffect` polling loops. | OBSERVED |

**Do these affect every page?** — **Yes:** `AuthMenu`, `NotificationBell`, `MobileNav` (in
`Header`, in the root layout) and `AnnouncementBar` (in the root layout) mount on every route.
`PremiumPromo` and the 6× `Reveal` are home‑only.

---

## 10. Image / Font / Asset Analysis

| Area | Finding | Verdict |
|---|---|---|
| **Fonts** | System font stack. No `next/font`, no `@font-face`, no web‑font request, no font CSS, no FOIT/FOUT, no font‑driven CLS. | **Optimal — do not change.** |
| `next/image` config | `formats:["image/avif","image/webp"]`, `minimumCacheTTL:86400`, `deviceSizes` trimmed to `[640…1920]`, `remotePatterns:["**.supabase.co"]`. | Good (Phase 4). |
| `priority` / blur | `priority` + `placeholder="blur"` (`IMAGE_BLUR_DATA_URL`, a shared 1‑px tint) on the home hero banner, `ProjectCard`, and `projects/[id]/Gallery`. | Good. |
| Avatars | Raw `<img>` (Google / GitHub / Supabase host, intentionally not allow‑listed) with `width`/`height`/`loading="lazy"`/`decoding="async"` — fixed‑size parent, no CLS, never LCP. | Acceptable. |
| **Seed images** | **The seed DB has zero images** — no project thumbnails, company logos or banners. `/projects` renders `<Box>`/`<Gem>` icon fallbacks. **The AVIF negotiation / blur / `/_next/image` optimiser pipeline is UNTESTED against real data.** `/_next/image` rejects a disallowed host → 400 (MEASURED). | **NOT MEASURED end‑to‑end.** |
| Markdown `<img>` (learning) | `loading="lazy"` set, **no `width`/`height`** (author‑supplied host) → a below‑fold reflow when a learning article has inline images. | Minor CLS (R6). |
| CSS | 55 KB raw / **10.4 KB gzip**, one file, `Cache-Control: public, max-age=31536000, immutable`. One render‑blocking `<link>`. | Fine. |
| Static assets (`_next/static`) | `public, max-age=31536000, immutable`. | Correct. |
| **`/learning/[gridSlug]` HTML** | `/learning/java-tutorial` = **569 KB raw / 73 KB gzip**, **506 `<a>`**, **196 `<svg>`**, **~282 KB inline RSC flight** — the full 150‑topic section tree is serialised into the `<DocsShell>` / `<LearningNav>` client props for the sidebar. Cached (HIT) so it doesn't re‑render, but it's a large parse + DOM + hydration. | **Bottleneck — R5.** |
| **`/projects` HTML** | 275 KB raw / **16.2 KB gzip**, **193 `<svg>`** (mostly `Rating` — 5 `<Star>` per card × 21 cards + card icons), ~146 KB inline RSC flight. gzip is small (SVG dedupes well), but it's ~190 extra DOM nodes to build + a large flight payload, on a route that's `no-store` at the HTML layer. | Medium (B9). |

**Likely LCP bottleneck (ESTIMATED):**
- Default home / most pages → LCP is a server‑rendered text node; the gate is ~181 KB gzip JS
  hydration on a mid‑tier phone, of which ~67 KB is removable Supabase.
- `/projects/[id]`, `/jobs/[id]`, banner home → the hero image (`priority` + blur set).

---

## 11. Caching Analysis

| Route | Static? | Dynamic? | ISR? | `Cache-Control` (from `next start`) | `revalidate` | Server cache | Browser cache |
|---|---|---|---|---|---|---|---|
| `/`, `/premium`, `/resume/templates`, `/projects/trending|premium|best-sellers|new`, `/jobs/companies`, `/faq`, `/referral`, `/custom-projects` | — | — | **✓** | `s-maxage=300, swr` | 300 s | `x-nextjs-cache: HIT/STALE` | `s-maxage` only (no `max-age`) |
| `/about`, legal, `/contact`, `/support`, `/compiler`, `/login`, `/register`, `/logout` | **✓** | — | — | `s-maxage=31536000, swr` | — | HIT | `s-maxage` only |
| `/projects/[id]`, `/jobs/[id]`, `/jobs/companies/[id]`, `/projects/category/[category]`, `/learning/[gridSlug]`, `/learning/[gridSlug]/[topicSlug]`, `/coding-problems/[problemSlug]` | — | — | **✓ (ISR)** | `s-maxage=300, swr` | 300 s | **HIT** (4–23 ms) | `s-maxage` only |
| `/projects`, `/jobs` | — | **✓ (`searchParams`)** | data cached | **`public, s-maxage=60, stale-while-revalidate=300`** (config) | data 120 s | data via `unstable_cache`; HTML rendered per request | CDN `s-maxage=60` |
| `/learning` (index) | — | **✓ (`searchParams.q`)** | — | **`private, no-store`** | — | **none** (grid RPC is `cache()` only) | none |
| `/resume` | — | **✓ (`force-dynamic`)** | — | `private, no-store` | — | none (`loadTemplates()` uncached) | none |
| `/account/**`, `/custom-projects/my-projects*`, `/r/[token]`, `/mock-tests/*` | — | **✓ (cookies / force-dynamic)** | — | `private, no-store` | — | none (correct) | none |
| `_next/static/*`, CSS | — | — | — | `public, max-age=31536000, immutable` | — | — | **1 yr immutable** ✓ |

**Could safely be cached more:**
- `/learning` index — cross‑request cache the grid list (`unstable_cache`, tag `learning`) +
  give it the `public, s-maxage=60, swr` header `/projects|jobs` already get.
- `/resume` signed‑out landing — ISR (templates are public catalog).
- `/mock-tests/[testId]` — ISR (content not personalised).

**Must remain user‑specific:** all `/account/**`, `/resume` signed‑in dashboard,
`/custom-projects/my-projects*`, `/r/[token]` (view‑count side effect),
`/mock-tests/[testId]/result/[attemptId]`.

**Observation:** `next start` returned `x-nextjs-cache: STALE` on `/`, `/projects/pr-1`,
`/premium` during testing — the 300 s ISR window lapsed and SWR served stale + revalidated in
the background. Correct behaviour; in production a CDN absorbs this. It also suggests the 300 s
`revalidate` is short relative to how often the catalog actually changes (admin edits) —
wiring `revalidateTag` from the admin panel (M5) would let `revalidate` be raised without going
stale.

---

## 12. Network / Region Analysis

| Question | Answer | Source |
|---|---|---|
| Hosting / deploy region | **Cannot be determined from the repository** — no `vercel.json` (`regions`), `netlify.toml`, Dockerfile, or `fly.toml`. **Check the hosting dashboard.** | OBSERVED |
| Supabase project region | **Cannot be determined from the repository** — the project ref `oqwjooaapsotnncmhvtk.supabase.co` does not encode the region. **Check Supabase Dashboard → Project Settings → General → Region.** | OBSERVED |
| Supabase RTT from **this build sandbox** | **MEASURED ~190–410 ms / query** (TCP connect ~35–80 ms, TLS ~90–155 ms). *Not a production number* — a sandbox with no known co‑location — but it demonstrates the cost of any uncached query. | MEASURED |
| Cross‑region request risk | **Plausible but UNVERIFIED.** This is a ₹‑priced, India‑audience product; the Supabase project is shared with the mobile app + admin panel and is very likely `ap-south-1` (Mumbai). If the website deploy region ≠ that, **every server‑side Supabase call pays a ~200–250 ms hop**: middleware `getUser()` (signed‑in, every navigation), `/resume`, `/learning`, `/projects`/`/jobs` cache‑misses, all `/account/**`, all `/api/*`. | ESTIMATED |
| Mitigations already present | `<link rel="preconnect">` + `dns-prefetch` to the Supabase origin in `<head>` (helps the first *client* call only); CDN `s-maxage` headers on `/projects` + `/jobs`; ISR HIT on catalog detail routes removes the hop for cached reads. | OBSERVED |

**Action:** confirm the two regions in their dashboards and make them match (e.g. on Vercel,
`vercel.json` `{ "regions": ["bom1"] }`). This is the single cheapest latency win **if** they
are currently mismatched — and cannot be assessed without dashboard access.

---

## 13. Top 15 Bottlenecks

### #1 — Full Supabase browser SDK on every route
**Location:** `src/app/layout.tsx` → `Header` → `AuthMenu` / `NotificationBell` / `MobileNav`
(all `"use client"`, `useSessionProfile` → `createBrowserSupabase`) + `AnnouncementBar`
(`createBrowserSupabase`).
**Current behavior:** chunks `6608` (`@supabase/ssr` + `supabase-js`) + `44530001`
(`auth-js` `GoTrueClient`) load on **every** route, including static text pages.
**Measured evidence:** `/about` HTML references both chunks; MEASURED **52,718 + 14,027 =
~66,745 bytes gzip** (~256 KB parsed) on a page with no interactivity.
**Impact:** **CRITICAL**
**Why it matters:** ~30 % of every page's JS payload + a large main‑thread parse/compile during
hydration on every route → the dominant INP/TBT contributor and a measurable slice of mobile LCP.
**Safe possible fix:** one server‑read `SessionProvider` (React context) consumed by the
islands; lazy‑load the browser client behind a user action / `next/dynamic({ssr:false})`;
server‑render the announcement with only the dismiss button on the client. (Prior audit R1 /
B1+B2+B6 — still unimplemented.)

### #2 — `/resume` is `force-dynamic` with an uncached Supabase query per visit
**Location:** `src/app/resume/page.tsx` — `export const dynamic = "force-dynamic"`;
`loadTemplates()` calls `getPublicSupabase().from("resume_templates")` directly instead of the
existing `getCachedResumeTemplates()`.
**Current behavior:** every visit = `getOptionalUser()` + an uncached `resume_templates`
round‑trip (+ a 5‑query batch when signed in).
**Measured evidence:** MEASURED TTFB **158–725 ms** on `next start` (avg ≈ 300 ms; one 725 ms
spike) vs 4–23 ms for ISR routes.
**Impact:** **HIGH**
**Why it matters:** the résumé builder is a headline feature and its landing page is the
slowest route on the site by ~10×.
**Safe possible fix:** use `getCachedResumeTemplates()`; render the signed‑out landing as ISR
(drop `force-dynamic` there or split the route); keep `no-store` only for the signed‑in
dashboard.

### #3 — No `.browserslistrc` → ~40 KB gzip legacy polyfill chunk on every route
**Location:** repo root — no `.browserslistrc`, no `browserslist` key.
**Current behavior:** Next emits its broad polyfill set as `<script noModule>`.
**Measured evidence:** `polyfills-*.js` = 112,594 raw / **39,627 bytes gzip**, referenced on
`/about`.
**Impact:** **MEDIUM**
**Why it matters:** modern browsers skip *execution* but many still *fetch* it; ~40 KB gzip of
pure legacy weight on every route.
**Safe possible fix:** a modern `.browserslistrc` (e.g. `chrome >= 111`, `safari >= 16.4`,
`firefox >= 111`, `edge >= 111`) after checking the mobile‑app WebView floor + site analytics.
Config‑only.

### #4 — `/learning/[gridSlug]` ships a 569 KB HTML tree
**Location:** `src/app/learning/[gridSlug]/page.tsx` → `<DocsShell tree={tree}>` →
`<LearningNav tree={tree}>` (client).
**Current behavior:** the entire section→topic tree (150 topics for java‑tutorial) is
serialised into the client sidebar prop.
**Measured evidence:** `/learning/java-tutorial` = **569,169 bytes raw / 73,229 gzip HTML**,
506 `<a>`, 196 `<svg>`, ~282 KB inline RSC flight. (python‑tutorial = 178 KB.)
**Impact:** **HIGH** for that route family; MEDIUM overall (2 grids in the seed).
**Why it matters:** big parse + DOM + hydration for a navigation sidebar; grows linearly with
topic count.
**Safe possible fix:** trim the client prop to `{ id, slug, title, is_premium }`; or
server‑render the nav list with only the collapse toggle on the client. (Prior audit R5.)

### #5 — Middleware `auth.getUser()` on every request
**Location:** `middleware.ts` — matcher = everything except static assets; body = `await
supabase.auth.getUser()`.
**Current behavior:** runs on all HTML navigations, all `/api/*`, `/sitemap.xml`, `/robots.txt`.
**Measured evidence:** logged‑out MEASURED at 3–8 ms (short‑circuits). Signed‑in: **NOT
MEASURED** (no session here).
**Impact:** **HIGH** (signed‑in users) — ESTIMATED +50–200 ms per navigation on a distant
Supabase region, including for pages served from the static cache.
**Why it matters:** turns every click for a signed‑in user into an auth round‑trip.
**Safe possible fix:** narrow the matcher to `/account/:path*`, `/resume/:path*`,
`/custom-projects/:path*`, `/r/:path*`, `/logout` — the routes that actually need a fresh
server session. (Prior audit B5.)

### #6 — `/projects` HTML: 193 inline SVGs + 146 KB RSC flight, `no-store`
**Location:** `src/app/projects/page.tsx` + `ProjectCard` → `Rating` (5 `<Star>` each).
**Current behavior:** 21 cards × (5 star SVGs + icons) serialised inline; HTML re‑generated per
request (data is cached, HTML is not).
**Measured evidence:** MEASURED 274,999 bytes raw / **16,205 gzip**; 193 `<svg>`; ~146 KB
inline flight.
**Impact:** **MEDIUM**
**Why it matters:** ~190 extra DOM nodes + a large flight payload to parse on the marketplace
entry page; gzip hides the transfer cost but not the parse/DOM cost.
**Safe possible fix:** render one SVG `<symbol>` set + `<use href="#star">` per star (or a
single 5‑star path / CSS mask). (Prior audit B9.)

### #7 — Leading‑wildcard `ILIKE` search with no trigram index
**Location:** `src/lib/cache.ts` `getCachedProjectsPage` (`ilike("title", '%q%')`),
`getCachedJobsPage` (`ilike("title")`, `ilike("location")`).
**Current behavior:** `%term%` cannot use a btree index → sequential scan per distinct search
term (each is a cache MISS).
**Measured evidence:** **NOT MEASURED** (no DB) — pattern is OBSERVED; `perf/phase1_indexes.sql`
identifies it.
**Impact:** **MEDIUM–HIGH** on a populated DB (seed is tiny, so fast today).
**Why it matters:** search latency degrades as the catalog grows.
**Safe possible fix:** `CREATE EXTENSION pg_trgm; CREATE INDEX … USING gin (title gin_trgm_ops)`
on `projects.title`, `jobs.title`, `jobs.location`. Owner runs it; verify with `EXPLAIN`.

### #8 — `count: "exact"` on every list query
**Location:** `getCachedProjectsPage`, `getCachedJobsPage` — `.select(fields, { count: "exact" })`.
**Current behavior:** a full filtered `COUNT(*)` accompanies every list fetch (for the "N
projects / N roles" header).
**Measured evidence:** OBSERVED in source; cost NOT MEASURED (small seed).
**Impact:** **MEDIUM**
**Why it matters:** `COUNT(*)` with filters is O(rows) and grows with the catalog; runs on
every cache MISS.
**Safe possible fix:** `count: "estimated"`/`"planned"`, or a `pageSize + 1` "has‑next"
heuristic. **Product decision** — the visible total becomes approximate. (Prior audit R2.)

### #9 — `/learning` index is uncached dynamic with no CDN header
**Location:** `src/app/learning/page.tsx` + `src/lib/learning.ts` `getLearningGrids`
(`cache()` only).
**Current behavior:** `ƒ` `no-store`; the `learning_grids_list` RPC re‑runs per request; no
`s-maxage` header (unlike `/projects` / `/jobs`).
**Measured evidence:** MEASURED TTFB 25–41 ms local; ESTIMATED +150–250 ms with real Supabase RTT.
**Impact:** **MEDIUM**
**Why it matters:** the Learning landing page can't be edge‑cached and re‑queries on every hit.
**Safe possible fix:** wrap `getLearningGrids` in `unstable_cache` (tag `learning`); add
`public, s-maxage=60, stale-while-revalidate=300` for `/learning` in `next.config.js` headers.

### #10 — Missing indexes on marketplace sort columns
**Location:** `PROJECT_SORTS` / `JOB_SORTS` in `src/lib/marketplace.ts` → `.order("price" |
"rating" | "sales_count" | "salary_max_lpa" | "created_at" | "posted_at")`.
**Current behavior:** only `created_at` / `posted_at` are likely indexed; other sorts do a sort
of the full filtered set.
**Measured evidence:** **NOT MEASURED** (no DB); listed in `perf/phase1_indexes.sql`.
**Impact:** **MEDIUM** (grows with catalog).
**Safe possible fix:** btree on `projects (price)`, `projects (rating desc)`,
`projects (sales_count desc)`, `jobs (salary_max_lpa desc nulls last)`.

### #11 — RLS `auth.uid()` re‑evaluated per row
**Location:** all Supabase migrations (mobile + admin + website tables).
**Current behavior:** `auth.uid()` appears 317× in policies, 0 wrapped in `(select auth.uid())`
→ per‑row evaluation.
**Measured evidence:** **NOT MEASURED** (no DB) — from `OPTIMIZATION_NOTES.md` §M2;
`perf/phase1_rls_optimization.sql` has the `ALTER POLICY` set.
**Impact:** **MEDIUM** (10–100× on large tables per Supabase docs; behaviour identical).
**Safe possible fix:** one migration wrapping `auth.uid()` → `(select auth.uid())` and
`current_user_is_premium()` → `(select current_user_is_premium())`.

### #12 — `/account` sums the whole `wallet_transactions` table in JS
**Location:** `src/app/account/page.tsx` (unbounded `select`), `src/app/account/wallet/page.tsx`
(`.limit(50)` then JS `reduce`).
**Current behavior:** fetch all (or 50) rows to display one balance number; the wallet page's
balance is only correct for the last 50 transactions.
**Measured evidence:** OBSERVED; cost NOT MEASURED (small seed).
**Impact:** **LOW–MEDIUM** (correctness‑sensitive).
**Safe possible fix:** a `SECURITY DEFINER wallet_balance()` RPC returning the scalar (M6,
drafted in `docs/perf/suggested-indexes.sql`).

### #13 — Deploy region ↔ Supabase region unverified
**Location:** infra (no repo config).
**Current behavior:** unknown; cannot be assessed here.
**Measured evidence:** **NOT MEASURED** — sandbox Supabase RTT ~200 ms is not representative.
**Impact:** **HIGH if mismatched, UNKNOWN otherwise.**
**Why it matters:** a cross‑region hop adds ~200–250 ms to every server‑side Supabase call.
**Safe possible fix:** check both dashboards; pin the deploy region to the Supabase region.

### #14 — 4× `useSessionProfile` islands hydrate independently on every page
**Location:** `AuthMenu`, `NotificationBell`, `MobileNav`, `home/PremiumPromo` →
`src/lib/useSessionProfile.ts`.
**Current behavior:** each instance: browser client + `auth.getUser()` + `profiles` select +
`onAuthStateChange`, on mount, on every page (home = 4×).
**Measured evidence:** OBSERVED (source); INP cost **NOT MEASURED** (no browser).
**Impact:** **MEDIUM** (INP during hydration).
**Safe possible fix:** falls out of #1 — one provider, one read, islands consume context.

### #15 — API route serverless cold‑start weight
**Location:** `src/app/api/resume/parse` (pdf‑parse), `export/docx` (docx), `assist`
(`@anthropic-ai/sdk`).
**Current behavior:** heavy libs at module top level.
**Measured evidence:** MEASURED server bundles: `parse` **536 KB**, `export/docx` **369 KB**,
`assist` **202 KB**.
**Impact:** **LOW** (infrequent, user‑initiated; a spinner is acceptable).
**Safe possible fix:** `await import()` the heavy lib inside the handler so it's not in the
module graph until first use.

*Honourable mentions:* `/mock-tests/[testId]` needlessly `force-dynamic` (R4); `Reveal` ×6 on
home (R6/B12); `/sitemap.xml` 6 queries on cache miss; Markdown `<img>` unsized (CLS).

---

## 14. Performance Score

**Basis:** each sub‑score is anchored to the MEASURED / OBSERVED evidence in this report.
Where a dimension depends on data that could not be measured here (CWV, DB internals, region),
the score is marked **low confidence** and leans conservative.

| Dimension | Score | Basis |
|---|---|---|
| **Server Performance** | **82 / 100** | MEASURED: static/ISR routes 4–23 ms compute; correct `Promise.all`; `unstable_cache` + `generateStaticParams` working (7 ISR routes HIT). Deductions: `/resume` 158–725 ms (force‑dynamic + uncached), `/learning` uncached dynamic, middleware `getUser()` site‑wide, `/sitemap.xml` 6 queries on miss. |
| **Database Performance** | **68 / 100** | OBSERVED: explicit column lists (1 `select("*")` left), bounded lists, request‑memoised auth, no realtime misuse, no user‑scoped query cached. Deductions: leading‑wildcard ILIKE with no trigram index, `count:"exact"` per list, no sort‑column indexes, `wallet_transactions` JS‑sum, 317 unwrapped `auth.uid()`. Index/RLS state **NOT MEASURED** → capped. |
| **JavaScript Performance** | **55 / 100** | MEASURED: ~221 KB gzip first load on **every** route; ~67 KB gzip Supabase SDK on static pages; ~40 KB gzip `nomodule` polyfills (no `.browserslistrc`). Credits: prism dynamic, qrcode lazy, lucide tree‑shaken, doc libs server‑only, per‑route chunks tiny. |
| **Rendering Performance** | **74 / 100** | MEASURED/OBSERVED: 86 prerendered routes, 7 ISR, `loading.tsx` on slow routes, `cache()` de‑dupe correct, no avoidable waterfall. Deductions: `/projects` 275 KB / `/learning/[gridSlug]` 569 KB HTML (193–196 inline SVG, big RSC flight), 4× auth‑island hydration, `Reveal` ×6, `/learning` + `/mock-tests/[testId]` needlessly dynamic. |
| **Network Performance** | **60 / 100** *(low confidence)* | OBSERVED: `preconnect` present, CDN `s-maxage` on catalog, ISR HIT removes the hop for cached reads. Unknowns: deploy region, Supabase region, real production RTT — all **NOT MEASURED**; middleware auth round‑trip per navigation is a structural risk. |
| **Image / Asset Performance** | **78 / 100** | OBSERVED: optimal font story (system stack), correct `next/image` config, `priority`+blur on LCP images, immutable static assets, 10.4 KB gzip CSS. Deductions: untestable (zero seed images), Markdown `<img>` unsized, avatars raw `<img>`. |
| **Mobile Performance** | **52 / 100** *(ESTIMATED)* | No CWV measured. ESTIMATE from payload + render path: ~181 KB gzip modern JS (+40 KB polyfills many mobiles fetch) + 4‑island Supabase hydration on a mid‑tier phone dominates; system font & near‑zero CLS help. |
| **Overall Performance** | **63 / 100 — ACCEPTABLE** | Server & caching architecture is genuinely good (Phase 1–5 work is real and measured); every route still ships an SPA‑weight JS shell with an unused Supabase SDK, one dynamic route is slow, and the production network picture is unverified. |

---

## 15. Speed Summary

| Metric | Current Result | Status |
|---|---|---|
| Build time | **33 s warm / 115 s cold** (MEASURED; `tsc`+`lint` inline) | OK (DX) |
| TTFB (local compute) | ISR/static **4–23 ms** · `/projects`,`/jobs`,`/learning` **19–50 ms** · **`/resume` 158–725 ms** (MEASURED) | Good except `/resume` |
| TTFB (production, real) | **NOT MEASURED** | — |
| LCP | **NOT MEASURED** (ESTIMATE ~2.0–2.8 s mobile) | — |
| INP | **NOT MEASURED** (ESTIMATE ~150–350 ms during hydration) | — |
| CLS | **NOT MEASURED** (ESTIMATE ~0.02–0.10) | — |
| FCP | **NOT MEASURED** | — |
| First Load JS | **~221 KB gzip per route** (MEASURED wire) · build report says 88–176 kB | ⚠️ heavy, uniform |
| — modern (excl. polyfills) | **~181 KB gzip** (MEASURED) | ⚠️ |
| HTML size (gzip) | `/about` **8.4 KB** · `/` **19.6 KB** · `/projects` **16.2 KB** · `/learning/java-tutorial` **73 KB** (MEASURED) | java‑tutorial ⚠️ |
| HTML size (raw) | `/projects` **275 KB** · `/learning/java-tutorial` **569 KB** (MEASURED) | ⚠️ |
| Largest JS chunk | **`6608` = 190.8 KB raw / 52.7 KB gzip** — `@supabase/ssr`+`supabase-js` (MEASURED) | ⚠️ on every route |
| Supabase JS | **~67 KB gzip** (`6608` 52.7 + `44530001` 14.0) on **every** route (MEASURED) | ❌ |
| CSS | 55 KB raw / **10.4 KB gzip**, immutable, 1 file (MEASURED) | Good |
| API / DB latency | Supabase RTT **~190–410 ms/query from this sandbox** (MEASURED, not production); ISR HIT hides it (4–23 ms); `/resume` exposes it (158–725 ms) | ⚠️ (uncached routes) |
| Fonts | 0 bytes — system stack (OBSERVED) | ✅ Optimal |
| Analytics / 3rd‑party JS on load | 0 bytes (MEASURED) | ✅ |
| Deploy region / Supabase region | **NOT MEASURED — requires dashboards** | ⚠️ Unknown |

---

## 16. Measured vs Estimated Results

### 16.1 MEASURED (commands in this environment)
Build time (33 s / 115 s); route table (34 `○` / 7 `●` / 38 `ƒ`; 86 prerendered; 7 ISR
patterns); First Load JS per route (build report); per‑chunk gzip sizes (bundle analyzer +
`gzip -c`); per‑page HTML / JS / CSS wire bytes (`curl --compressed`); TTFB per route (local
compute, `next start`); `Cache-Control` / `x-nextjs-cache` / `ETag` / `Vary` per route; inline
`<svg>` / `<a>` counts; RSC flight sizes; Supabase REST RTT from this sandbox; prerender
manifest; API route server‑bundle sizes; absence of analytics / `next/script` / web fonts;
`git status --short` clean.

### 16.2 OBSERVED (source / config / manifests)
Rendering directives; query shapes and column lists; `select("*")` sites; `ILIKE` patterns;
`count:"exact"`; `cache()` vs `unstable_cache` usage; waterfall structure; middleware body +
matcher; nav‑island Supabase usage; no realtime subscriptions; `next.config.js` image / header
/ redirect / experimental settings; no `vercel.json` / region config.

### 16.3 ESTIMATED (labelled as such wherever they appear)
All Core Web Vitals (LCP / INP / CLS / FCP); mobile performance; bundle‑reduction potential
(§17); DB query speed‑ups from indexes / RLS wrapping; region latency impact; the 0–100
sub‑scores.

### 16.4 NOT MEASURED (and why)
- **Real Core Web Vitals & production TTFB** — no Chrome / Chromium / Playwright / Puppeteer /
  Lighthouse in the environment; site not deployed to a reachable URL.
- **Signed‑in middleware cost** — no real Supabase auth session available.
- **DB index / RLS state, `EXPLAIN` plans, query timings** — no database access.
- **Image pipeline (AVIF negotiation, blur, `/_next/image` output)** — the seed DB has zero
  images.
- **End‑to‑end interactive flows** (Razorpay checkout, job apply, wallet top‑up, résumé
  save/export in a browser) — need a browser + auth session.
- **Deploy region / Supabase region** — not in the repository.

### 16.5 Comparison with the prior audits on this branch

Prior docs: `website/PERFORMANCE_AUDIT.md` (P0 baseline), `PERFORMANCE_PHASE1..5.md`,
`OPTIMIZATION_NOTES.md`, `docs/perf/audit-website.md`, `perf/phase1_indexes.sql`,
`perf/phase1_rls_optimization.sql`, `docs/perf/suggested-indexes.sql`.

**Already fixed — verified in this pass:**

| Prior finding | Status now (evidence) |
|---|---|
| 7 detail routes `ƒ` → `●` ISR (P2) | **CONFIRMED** — prerender‑manifest `dynamicRoutes` = exactly those 7; `curl` shows `x-nextjs-cache: HIT` at 4–13 ms. |
| `/premium` dynamic → static ISR (P2) | **CONFIRMED** — `x-nextjs-cache: HIT`, 4–6 ms. |
| `/projects` + `/jobs` `no-store` → CDN header + `unstable_cache` data (P2) | **CONFIRMED** — `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`; TTFB 19–50 ms with cached data. |
| `select("*")` → explicit columns (P1) | **CONFIRMED** — only `getCachedJobDetail` still uses `*`. |
| `qrcode.react` → lazy (P3) | **CONFIRMED** — own chunk `5398`, not in any route's first load. |
| `demoResumes` / `TemplatePreviewModal` off client first‑load (P3) | **CONFIRMED** — not in the analyzer's per‑route first‑load sets. |
| `optimizePackageImports` / lucide tree‑shaking (P2) | **CONFIRMED** — lucide is per‑icon modules; no barrel chunk. |
| images AVIF/WebP + `minimumCacheTTL` + `deviceSizes` (P4) | **CONFIRMED** in `next.config.js` + build. |
| `preconnect` Supabase (P4) | **CONFIRMED** in `<head>`. |
| request‑memoised `getAuthUser` / `getAccountUser` (P1) | **CONFIRMED** in `src/lib/auth.ts`. |
| Lighthouse CI job + `lighthouserc.json` (P5) | **PRESENT** (not yet exercised). |

**Still remaining (matches `OPTIMIZATION_NOTES.md` R1–R7):**
- **R1** — Supabase SDK in the global shell: **UNCHANGED.** MEASURED ~67 KB gzip on `/about`.
  Still the #1 finding.
- **R2** — `count:"exact"`: unchanged.
- **R3** — learning/coding‑problem `generateStaticParams` returns `[]`: unchanged (deliberate).
- **R4** — `/mock-tests/[testId]` `force-dynamic`: unchanged.
- **R5** — `/learning/[gridSlug]` HTML: unchanged — MEASURED 569 KB.
- **R6** — `AnnouncementBar` / Markdown `<img>` CLS: unchanged.
- **R7** — `/resume` count reads: unchanged.

**New / sharpened this pass:**
- `/resume` TTFB **quantified at 158–725 ms** — the uncached `loadTemplates()` +
  `force-dynamic` combination is the slowest route; `getCachedResumeTemplates()` exists but is
  unused here.
- `/learning` (index) is `no-store` dynamic with a **`cache()`‑only** grid RPC and **no
  `s-maxage` header** — it never received the `/projects`/`/jobs` treatment.
- **Correction to prior "B7"** — `framework-*.js` (44.8 KB gzip) and `main-<hash>.js`
  (34.4 KB gzip) are **not referenced** by any App Router page's HTML (verified: `/about`
  loads `main-app-*.js` = 464 bytes). They are dead files on disk, not shipped. The claim that
  a "legacy Pages‑Router `router.js` in `main` ships on every page" does not hold for this build.

**Proposed‑but‑NOT‑implemented (do NOT assume active):**
- `perf/phase1_indexes.sql` (pg_trgm + sort indexes) — **not run** (no DB; `OPTIMIZATION_NOTES`
  §4 lists it as owner action).
- `perf/phase1_rls_optimization.sql` (`(select auth.uid())` sweep) — **not run.**
- `wallet_balance()` RPC (M6) — **not created.**
- `revalidateTag` admin‑panel wiring (M5) — endpoint ready, admin side not wired.
- Deploy region check (M3) — **not done.**
- Supabase Pro image loader (M4) — not applicable / not done.

---

## 17. Expected Improvement Analysis

> **ESTIMATED — NOT MEASURED.** Projections from bundle composition + render path + standard
> assumptions. Re‑measure after each change.

### Optimisation: Remove Supabase browser SDK from the global shell (R1 / #1)
- **Current:** ~221 KB gzip first‑load JS per route; ~67 KB gzip of it Supabase.
- **Potential:** ~154 KB gzip per route (modern, excl. polyfills: 181 → ~114 KB gzip).
- **Potential improvement:** **~‑30 % first‑load JS on every route**; large INP/TBT reduction;
  ‑4 `getUser()` + ‑4 `profiles` selects + ‑1 `announcements` query per navigation.
- **Label:** ESTIMATED — NOT MEASURED.

### Optimisation: Add a modern `.browserslistrc` (B8 / #3)
- **Current:** polyfills chunk ~39.6 KB gzip.
- **Potential:** ~5–10 KB gzip for modern visitors.
- **Potential improvement:** **‑15–34 KB gzip** first load; config‑only, no code change.
- **Label:** ESTIMATED — NOT MEASURED.

### Optimisation: R1 + B8 together
- **Current:** static‑route first‑load JS ~221 KB gzip.
- **Potential:** **~120–125 KB gzip** — brings "initial JS < 150 KB / route" into reach.
- **Potential improvement:** **~‑44 %.**
- **Label:** ESTIMATED — NOT MEASURED.

### Optimisation: `/resume` → cached templates + ISR signed‑out (#2)
- **Current:** MEASURED TTFB 158–725 ms.
- **Potential:** signed‑out **< 20 ms** (ISR HIT); signed‑in ‑1 uncached round‑trip.
- **Potential improvement:** **~90–97 %** on the signed‑out path.
- **Label:** MEASURED baseline → ESTIMATED target.

### Optimisation: `/learning/[gridSlug]` trim tree prop (R5 / #4)
- **Current:** MEASURED 569 KB raw / 73 KB gzip HTML (java‑tutorial).
- **Potential:** ~150–200 KB raw / ~25 KB gzip.
- **Potential improvement:** **~‑65 % HTML**; proportional parse/hydration cut.
- **Label:** ESTIMATED — NOT MEASURED.

### Optimisation: `/projects` `Rating` → `<symbol>`/`<use>` sprite (B9 / #6)
- **Current:** MEASURED 193 inline `<svg>`; 275 KB raw / 16.2 KB gzip HTML.
- **Potential:** ~40 inline `<svg>`; ~120–150 KB raw (gzip effect small, ~‑3 KB).
- **Potential improvement:** ~150 fewer DOM nodes; meaningful parse/DOM/memory cut, small transfer.
- **Label:** ESTIMATED — NOT MEASURED.

### Optimisation: `pg_trgm` + sort‑column indexes (M1 / #7 #10)
- **Current:** sequential scan on `%term%` search; sort of the full filtered set. NOT MEASURED
  (small seed).
- **Potential:** index scan.
- **Potential improvement:** **ESTIMATED 10–100×** on search/sort on a populated DB; `/projects?q=`
  cache‑miss TTFB from ~200 ms+ → ~20–40 ms.
- **Label:** ESTIMATED — NOT MEASURED.

### Optimisation: RLS `(select auth.uid())` wrap (M2 / #11)
- **Current:** per‑row `auth.uid()` evaluation.
- **Potential:** once per statement.
- **Potential improvement:** **ESTIMATED 10–100×** on RLS‑heavy tables (Supabase‑documented);
  behaviour identical.
- **Label:** ESTIMATED — NOT MEASURED.

### Optimisation: Match deploy region to Supabase region (M3 / #13)
- **Current:** unknown.
- **Potential improvement:** **IF mismatched**, ‑200–250 ms on every server‑side Supabase call
  (middleware, `/resume`, `/learning`, catalog cache‑misses, `/account/**`, all `/api/*`).
- **Label:** ESTIMATED — cannot be assessed without dashboards.

### Optimisation: Narrow middleware matcher (B5 / #5)
- **Current:** `getUser()` on every request.
- **Potential improvement:** signed‑in users ‑1 auth round‑trip per navigation on public/static
  pages.
- **Label:** ESTIMATED — NOT MEASURED (no session).

### Optimisation: `count:"estimated"` on list totals (R2 / #8)
- **Potential improvement:** ‑1 filtered `COUNT(*)` per list cache‑miss.
- **Label:** ESTIMATED; **product decision** (visible total becomes approximate).

---

## 18. Recommended Next Phase

Ordered by (impact × safety), smallest blast radius first.

1. **Get real Core Web Vitals.** Run `npx lighthouse` (mobile + desktop) against a deployed
   preview, or `next start` + Chrome on a dev machine, for `/`, `/about`, `/projects`,
   `/projects/[id]`, `/jobs`, `/resume`, `/learning/[gridSlug]`. Or enable the existing
   Lighthouse CI job on a PR and calibrate `lighthouserc.json` from the first run. *Nothing in
   this report replaces a real CWV measurement.*
2. **Verify regions (M3).** Supabase Dashboard → region; host → function region; make them
   match; add `vercel.json` `{ "regions": [...] }` (or host equivalent). Config‑only.
3. **`.browserslistrc` (B8 / #3).** Modern targets after checking the mobile WebView floor +
   analytics. Config‑only; re‑run `next build`, confirm the polyfills chunk shrank.
4. **De‑Supabase the global shell (R1 / #1 / #14) — its own phase.** One `SessionProvider`
   (single server read) + islands consume context; lazy browser client behind user actions;
   server‑render the announcement. Needs a stable skeleton (changes hydration timing). Biggest
   single win.
5. **`/resume` (#2 / R7).** `getCachedResumeTemplates()`; ISR the signed‑out landing;
   `count:'exact', head:true` for the tallies.
6. **DB, owner‑run (M1 / M2 / #7 #10 #11).** `perf/phase1_indexes.sql` then
   `perf/phase1_rls_optimization.sql`; verify each with `EXPLAIN (ANALYZE, BUFFERS)`.
7. **`/learning` caching (#9)** + **`/learning/[gridSlug]` tree trim (R5 / #4)** +
   **`/mock-tests/[testId]` → ISR (R4)**.
8. **`/projects` `Rating` sprite (B9 / #6)**, **narrow the middleware matcher (B5 / #5)**,
   **wire `revalidateTag` from admin (M5)**, **`wallet_balance()` RPC (M6)**,
   **`count:"estimated"` (R2 — with product sign‑off)**.
9. **Re‑measure** the full §4 / §6 table after each phase; keep the before/after in
   `OPTIMIZATION_NOTES.md`.

---

## Appendix — Environment safety confirmation

- **No source code modified.** No `.ts` / `.tsx` / `.js` / `.css` under `src/` changed.
- **No config modified.** `package.json`, `next.config.js`, `tsconfig.json`, `middleware.ts`,
  `tailwind.config.ts`, `.eslintrc.json` unchanged.
- **No packages installed.** `npm run build` / `npm run start` only (existing scripts). No
  `npm install` / `npm i` / `npx <new pkg>`.
- **No database / schema / migration / RLS change.** No SQL executed. No Supabase write of any
  kind (all reads were anon `select` for RTT characterisation).
- **No UI / route / functionality change.**
- **No git operation.** No commit, push, stash, reset, revert, clean, checkout.
- **Regenerated (git‑ignored, not tracked):** `.next/`, `.next/analyze/{client,edge,nodejs}.html`.
- **New file created:** this report — `website/PERFORMANCE_CURRENT_AUDIT.md` (the requested
  deliverable; untracked).

```
$ git status --short
?? website/PERFORMANCE_CURRENT_AUDIT.md
```

Only the audit report itself is new. No tracked file was added, modified, or deleted.
