# Learning cache and on-demand revalidation

Public Learning content is ISR (`revalidate = 3600` on learning, coding-problem, practice and interview routes) on top of `unstable_cache` reads in `src/lib/learning.ts`.

## Staleness

Two layers: the route's ISR `revalidate` and the `unstable_cache` data TTL. Worst case for a change that does NOT go through `/api/revalidate` (direct SQL, a migration, a failed admin refresh) = page TTL + data TTL, because a page can regenerate just before its data entry expires.

| Content | Page ISR | Data TTL | Worst case without a refresh |
| --- | --- | --- | --- |
| Learning topic, coding problem, practice problem, interview topic (long tail, rarely edited) | 24 h | 1 h | ~25 h |
| Course overview, `/learning`, practice hub, interview hub and category pages | 6 h | 1 h | ~7 h |
| Sitemap | 1 h | 1 h | ~2 h |

Admin saves (PR "admin refresh") and `scripts/revalidate-learning.mjs` clear both layers immediately: `unstable_cache` adds its tags to the ISR page that consumed it (on hit and miss), so one `revalidateTag` drops the data entry and the page. After a SQL seed or migration, run the script; until then expect the worst case above.

## Tags (`src/lib/learningTags.ts`)

`learning:list`, `learning:sitemap`, `learning:grid:<grid>`, `learning:topic:<grid>:<topic>`, `learning:coding:<slug>`, plus the legacy coarse `learning`. Topic entries also carry their grid tag, so a grid tag refreshes the whole course.

Practice and Interview detail pages: `practice:problem:<slug>`, `interview:category:<cat>` (category page and every topic page in it, because of prev/next links), `interview:topic:<cat>:<topic>`. Each also carries its coarse tag (`practice` / `interview-questions`), which the admin panel sends today, so an admin save already refreshes them (all pages of that kind). Sending the granular tags from the admin is a follow-up that limits the refresh to one page.

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
