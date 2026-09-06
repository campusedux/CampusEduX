# CampusEduX Website — Performance Phase 2: Rendering & Caching

**Date:** 2026-09-06 · **Branch:** `audit/full-project-review`
**Scope:** items 13–17. Behaviour-preserving. No UI/UX change. All gates green.

---

## 1. The keystone finding

Phase 0 saw that `/projects/[id]`, `/jobs/[id]`, `/learning/*`, `/coding-problems/[slug]`
were served **`Cache-Control: private, no-cache, no-store`** — fully dynamic — even
though every one of them exports `revalidate = 300`.

**Root cause (confirmed by experiment):** in the Next.js App Router, a **dynamic
segment** (`[id]`) only becomes ISR-cached if it **also exports
`generateStaticParams`**. Without it, `revalidate` is honoured for the *fetch* data
cache only — and since `@supabase/supabase-js` routes its calls through a wrapped
`fetch` that Next's data cache never sees, **nothing was cached at all**.

Adding `generateStaticParams` (even `return []`) flips the route: `prerender-manifest.json`
gains the entry, and on-demand renders are stored in the full-route cache and served
with `Cache-Control: s-maxage=300, stale-while-revalidate` + `x-nextjs-cache: HIT`.

## 2. What changed (code)

### 14 — `generateStaticParams` + ISR for detail / landing pages

| Route | `generateStaticParams` | Result |
|---|---|---|
| `/projects/[id]` | top **40** by `sales_count` (rest on demand) | `ƒ` → **`●` ISR** |
| `/jobs/[id]` | **40** most recent by `posted_at` | `ƒ` → **`●` ISR** |
| `/jobs/companies/[id]` | **all** company ids (small set) | `ƒ` → **`●` ISR** |
| `/projects/category/[category]` | **all** category ids | `ƒ` → **`●` ISR** |
| `/learning/[gridSlug]` | **all** published grid slugs | `ƒ` → **`●` ISR** |
| `/learning/[gridSlug]/[topicSlug]` | `[]` — ISR on demand (a grid holds 150+ topics; prerendering all would run that many RPCs at build) | `ƒ` → **`●` ISR** |
| `/coding-problems/[problemSlug]` | `[]` — ISR on demand | `ƒ` → **`●` ISR** |

`prerender-manifest.json` `dynamicRoutes` went from **`[]`** to **7 routes**.

**Deliberately kept dynamic** (correct): all `/account/**` + `/custom-projects/**`
(auth / `cookies()`), `/resume` (`force-dynamic`), `/r/[token]` (the `get_shared_resume`
RPC increments a view counter — must run every request),
`/mock-tests/[testId]/result/[attemptId]` (a user's own attempt),
`/mock-tests/[testId]` (left as-is — low traffic, auth-adjacent; ISR candidate for later).

### 16 — `unstable_cache` for shared data + tag invalidation + `Cache-Control`

New **`src/lib/cache.ts`** — the cross-request cache layer for anon catalog reads.
Every entry has a `revalidate` and tags for on-demand busting:

| Function | Tags | Used by |
|---|---|---|
| `getCachedProjectDetail(id)` / `getCachedTopProjectIds` | `projects` | `/projects/[id]` |
| `getCachedJobDetail(id)` / `getCachedRecentJobIds` | `jobs` | `/jobs/[id]` |
| `getCachedCompanyDetail(id)` / `getCachedCompanyIds` | `companies`,`jobs` | `/jobs/companies/[id]` |
| `getCachedCategoryPreview(id)` / `getCachedCategoryIds` | `projects`,`categories` | `/projects/category/[category]` |
| `getCachedProjectsPage(args)` / `getCachedJobsPage(args)` | `projects` / `jobs` | `/projects`, `/jobs` (keyed by the full filter set) |
| `getCachedCategories()` | `categories` | marketplace filters |
| `getCachedHomeData()` | `home`,`cms` | `/` |
| `getCachedResumeTemplates()` | `resume-templates` | (available for résumé pages) |
| `learning.ts`: `getLearningGridSlugs` / `getLearningTopicParams` / `getCodingProblemSlugs` | `learning` | `generateStaticParams` |

**`/projects` and `/jobs` stay dynamically rendered** (they read `searchParams`) but no
longer hit Supabase per visit — the query result is served from the per-filter cache.
On top, `next.config.js` now sends them
**`Cache-Control: public, s-maxage=60, stale-while-revalidate=300`** so a CDN/edge holds
the full HTML response, keyed by URL (verified: the header survives Next's default
`no-store` for these routes; hosts like Vercel turn it into an edge hit — `next start`
ignores it, as expected). Safe because these pages carry **no per-user server data** —
the header/auth UI hydrates client-side.

**`/api/revalidate`** extended: was `/learning`-only `revalidatePath`; now also accepts
`{ "tags": ["projects", ...] }` → `revalidateTag`, and `{ "path": "/any/path" }`. The
admin panel / a Supabase DB webhook can now bust exactly the catalog data that changed.

### 13 — `'use client'` audit + barrel optimization

Audited all **75** files carrying the directive. Finding: **the codebase is already
SSR-first** — client components are leaves (forms, editors, interactive widgets), pages
are Server Components, `ResumeDocumentView` (the résumé renderer) is already a pure
server component. No page is needlessly `'use client'`; nothing to hoist.

One real improvement made: **`experimental.optimizePackageImports: ["@/components/ui"]`**.
The `@/components/ui` barrel re-exports ~20 modules including client ones (`Modal`,
`Drawer`, `FilterSheet`, `Reveal`); importing one symbol pulled the whole barrel into
a route's graph. Result — **First Load JS down 2–9 kB on nearly every route**
(`/premium` 173→165, `/login` 175→166, `/coding-problems` 184→176, `/learning/topic`
180→171, `/account/resume/[id]/edit` 132→125).

The remaining `'use client'` opportunity is the **nav/session island cluster**
(`useSessionProfile` ×4 + `AnnouncementBar` — Phase 0 B1/B2/B6 / prior audit P-1..P-3):
they force `@supabase/supabase-js` into every route's first-load JS. That is its own
focused phase (a `SessionProfileProvider` + `next/dynamic` on the header islands) — it
changes hydration timing and needs a stable skeleton, so it is **not** bundled here.

### 15 — Suspense / streaming

Route-level Suspense (`loading.tsx`) already existed for `/projects`, `/jobs`,
`/learning`, `/projects/[id]`, `/jobs/[id]`. Added **`loading.tsx` for
`/projects/category/[category]` and `/jobs/companies/[id]`** (matching the existing
skeleton style).

**In-page `<Suspense>` streaming was deliberately not added.** Items 14 + 16 remove
the blocking it would mitigate: the detail routes are now prerendered/ISR (users hit
cache, no query on the request path), and the list-route queries are cached. No single
page has one dominant slow *independent* section that would benefit from streaming
while the rest paints. The home page's 6 queries are now one cached read
(`getCachedHomeData`). Adding Suspense boundaries here would be churn without a user-
visible win. `loading.tsx` was **not** added to `/coding-problems/[slug]` or the
learning topic route on purpose — a `loading.tsx` makes `notFound()` stream a `200`
(status can't change after the shell flushes), and those are SEO-indexed content
routes where a real `404` for a missing slug matters. (Verified: `/coding-problems/<bad>`
still returns HTTP 404.)

### 17 — `next/link` prefetching

Already optimal — no `prefetch={false}` anywhere, every primary-nav link is `<Link>`.
**Item 14 upgrades what prefetch delivers:** for a dynamic route Next only prefetches
`loading.tsx`; for an ISR route it prefetches the **full RSC payload**. So after this
phase, hovering a `ProjectCard` / `JobCard` / a company or category link prefetches the
entire destination page — client-side navigation to it is now instant. Nothing to
change; the win comes free with the ISR conversion.

## 3. Before / after

`next start`, warm cache, local (≈0 network latency to Supabase — so the *absolute*
numbers understate the production gain, where each avoided Supabase round-trip is
50–150 ms and each avoided cross-region hop ~200 ms):

| Route | Phase 1 (every request) | Phase 2 cold (MISS) | Phase 2 warm (HIT) |
|---|---|---|---|
| `/projects/tr-2` | `no-store`, ~30–55 ms + DB | ~180–500 ms | **`x-nextjs-cache: HIT`, ~7–12 ms** |
| `/jobs/job-1` | `no-store`, ~25 ms + DB | ~180 ms | **HIT, ~4 ms** |
| `/jobs/companies/google` | `no-store` + 2 DB | ~150 ms | **HIT, ~5 ms** |
| `/projects/category/web-development` | `no-store` + 2 DB | ~150 ms | **HIT, ~8 ms** |
| `/learning/java-tutorial` | `no-store` + 2 RPC | — | **HIT, ~20 ms** |
| `/learning/java-tutorial/<topic>` | `no-store` + 3 RPC | ~220 ms | **HIT, ~5 ms** |
| `/projects` (list) | `no-store` + 2 uncached DB | — | dynamic render, **cached data**, ~20–40 ms; `s-maxage=60` for the CDN |
| `/jobs` (list) | `no-store` + 1–2 uncached DB | — | ~18–20 ms; `s-maxage=60` |
| `/` (home) | ISR HIT ~15 ms (6 queries on cold) | — | HIT ~10 ms (**1 cached read** on cold) |

| Metric | Phase 1 | Phase 2 |
|---|---|---|
| ISR-registered dynamic routes | **0** | **7** |
| First Load JS — `/premium` / `/login` / `/coding-problems` / `/learning/topic` | 173 / 175 / 184 / 180 kB | **165 / 166 / 176 / 171 kB** |
| First Load JS — `/` / `/projects/[id]` / `/jobs/[id]` | 173 / 175 / 176 kB | **171 / 172 / 173 kB** |
| Production build | green, ~45 s | green, ~65 s (prerenders ~90 bounded static params) |
| `typecheck` / `lint` | clean | clean |
| Filtering / sorting / pagination on `/projects` & `/jobs` | works | **works** (verified across 12 filter combos; counts render: "21 projects" / "10 roles") |
| `/api/revalidate` | `/learning` path only | **tags + any path**, 401 on bad secret |

## 4. Files

```
 M next.config.js                                  optimizePackageImports + /projects,/jobs Cache-Control
 M src/app/api/revalidate/route.ts                 + revalidateTag, + arbitrary path
 M src/app/page.tsx                                 home data -> getCachedHomeData
 M src/app/projects/page.tsx                        -> getCachedProjectsPage + getCachedCategories
 M src/app/jobs/page.tsx                            -> getCachedJobsPage
 M src/app/projects/[id]/page.tsx                   generateStaticParams + getCachedProjectDetail
 M src/app/jobs/[id]/page.tsx                       generateStaticParams + getCachedJobDetail
 M src/app/jobs/companies/[id]/page.tsx             generateStaticParams + getCachedCompanyDetail
 M src/app/projects/category/[category]/page.tsx    generateStaticParams + getCachedCategoryPreview
 M src/app/learning/[gridSlug]/page.tsx             generateStaticParams + parallelise brief/tree
 M src/app/learning/[gridSlug]/[topicSlug]/page.tsx generateStaticParams (ISR on demand)
 M src/app/coding-problems/[problemSlug]/page.tsx   generateStaticParams (ISR on demand)
 M src/lib/learning.ts                             + cached generateStaticParams sources
?? src/lib/cache.ts                                NEW — the unstable_cache layer
?? src/app/projects/category/[category]/loading.tsx
?? src/app/jobs/companies/[id]/loading.tsx
```

## 5. Notes / follow-ups

- **`/mock-tests/[testId]`** is still `force-dynamic`. Its content (title, instructions,
  question count) is not personalised — an ISR candidate (`generateStaticParams` + drop
  `force-dynamic`). Left for now: low traffic, auth-adjacent, wanted a conservative pass.
- **Learning-topic / coding-problem prerendering** returns `[]` (ISR on demand). Raise to
  `getLearningTopicParams()` / a bounded slice once build infra can absorb ~200 RPCs at
  build time. The helpers are already written and cached.
- **`count: "exact"`** on `/projects` & `/jobs` still runs a filtered `COUNT(*)` per
  cache-miss. Now that the data is cached the cost is amortised, but `count: "estimated"`
  (or a `pageSize+1` "has next" heuristic) would remove it entirely — a product call,
  since it changes "21 projects" from exact to approximate.
- **`revalidateTag` wiring in the admin panel:** the endpoint is ready; the admin panel
  should POST `{ tags: ["projects"] }` (etc.) after a catalog edit. Tag list is in the
  route's doc comment.
- The **nav/session island** de-Supabase-ing (Phase 0 B1/B2) remains the single biggest
  bundle + INP lever and is still unaddressed — recommend it as the next phase.
