# Learning cache and on-demand revalidation

Public Learning content is ISR (`revalidate = 3600` on learning, coding-problem, practice and interview routes) on top of `unstable_cache` reads in `src/lib/learning.ts`.

## Staleness (no on-demand revalidation)

Worst case = page ISR + data-cache TTL, because a page can regenerate just before its data entry expires.

| Data | Data TTL | Worst case |
| --- | --- | --- |
| Topic content, topic practice, coding problem (per-entry) | 300 s | ~65 min |
| Grid list, tree, grid brief, slug lists (shared) | 900 s | ~75 min |
| Sitemap route | 3600 s | ~75 min (its sources are 900 s) |

`revalidateTag` clears both layers: `unstable_cache` adds its tags to the ISR page that consumed it (on hit and miss), so one call drops the data entry and the page.

## Tags (`src/lib/learningTags.ts`)

`learning:list`, `learning:sitemap`, `learning:grid:<grid>`, `learning:topic:<grid>:<topic>`, `learning:coding:<slug>`, plus the legacy coarse `learning`. Topic entries also carry their grid tag, so a grid tag refreshes the whole course.

## Endpoint and script

- `POST /api/revalidate` (website): header `x-revalidate-secret`, body `{ "tags": [...] }`. Constant-time comparison, 404 when unconfigured, 401 on mismatch, only allowlisted tags. `learning:sitemap` also re-renders `/sitemap.xml`.
- `node scripts/revalidate-learning.mjs --grid <slug>` (= `learning:list`, `learning:grid:<slug>`, `learning:sitemap`), or pass explicit tags. `--dry-run` prints the request only. Use it after SQL seeds, migrations or mobile-app changes, e.g. publishing the Spring Boot course.

## Environment variable names

| Where | Names |
| --- | --- |
| Website deployment | `REVALIDATE_SECRET` (enables the endpoint) |
| Script (operator shell) | `SITE_URL`, `REVALIDATE_SECRET` (same value as the website) |
| Admin panel (server only, never `NEXT_PUBLIC_`) | `REVALIDATE_SECRET`, plus `NEXT_PUBLIC_WEBSITE_URL` (already used by the Blog module and the "Preview on site" links) |

## Private data

`/api/learning/progress` serves the signed-in learner's own progress (server session only, `private, no-store`). Public learning pages must not read `cookies()`/`headers()`; `tests/lib/perf-cache.test.ts` enforces this.
