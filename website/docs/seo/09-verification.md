# Public revision cold-start verification — 2026-11-07

Current source: uncommitted changes on `feat/seo-on-stability`. This section supersedes the earlier revision-timeout and integration counts below. No commit, push, deployment, dependency installation, SQL execution, schema/RLS change, or environment/credential-file read occurred. Nonce CSP, consent, AdSlot and ads.txt source remain unchanged. The mobile/admin surfaces are unchanged.

The error wording for digest `710537029` originates in `src/lib/publicReadDeadline.ts`; the helper bounds both revision and payload reads, so the digest alone cannot identify the historical failing stage. The inspected branch used a 1,000ms revision deadline without retry, while complete payload reads had a separate 10,000ms deadline. Production logs were not available to prove the upstream cause. Revision logs now identify phase, attempt, duration_ms, deadline_ms, timed_out, first_read, cold_start, sanitized code and process counters. Payload-failure logs distinguish fresh reads from verified fills and identify their own deadline. No URLs, arguments, provider messages, credentials or content enter these diagnostics.

Only the first process revision attempt gets 5,000ms; all subsequent attempts get 2,500ms, including its single recoverable retry. Denied/malformed revisions still fail closed. Exhausted recoverable revision reads use a fresh anonymous projection without admitting it to the verified cache. A fill still requires a matching post-read revision. Existing withdrawal/protection checks, current-token refresh behavior and error propagation remain intact. cold_start records process uptime below 60 seconds at attempt start; it does not extend every read in that window.

`src/instrumentation.ts` runs one Node startup pass, excluded from Edge and build execution. It warms the existing Home/CMS payload, Learning grids, Blog page one/categories, and Home’s exact `getLatestPosts(3)` key. Process-global storage bridges the instrumentation and RSC bundles. The whole pass has a 20,000ms deadline, including Home’s fresh Jobs query; failed/partial warm-up is contained, missing configuration skips it, and the next visitor can recover. Jobs remain fresh and every visitor still verifies current revisions. The anonymous helper reuses one client per existing fetch policy (fresh versus catalog), two at most for the active configuration; it does not construct a client per request or introduce a separate connection agent. This is HTTP connection-pool reuse through Node fetch, not a claim of exactly one physical TCP connection.

The existing RPC in `mobile-app/supabase/migrations/0155_public_content_revisions.sql` and its admin `123` twin performs one `scope = p_scope` lookup returning a UUID. `scope text primary key` supplies its index. No new query, migration or index was needed. The definition was inspected; no live EXPLAIN/index inspection or SQL/RLS harness was run. The existing app-only rollback patch was refreshed and its three scratch-application tests passed.

## Completed checks

Earlier completed checks on the same application/test source: `npm run lint` passed without lint findings; `npx --no-install tsc --noEmit` passed; nine focused files passed 119 tests, including 22 startup/lifecycle tests; `npm test -- --maxWorkers=1 --minWorkers=1 --testTimeout=30000 --hookTimeout=30000` passed 1,938 tests with 12 existing opt-in database tests skipped. The temporary raw logs were lost at interruption; [completed-checks.json](../../audit-reports/public-content-startup-20261107/completed-checks.json) explicitly records that provenance and the exact commands rather than implying a new run. One preceding full run had 1,937 passes, 12 skips and a compiler-poll fixture failure after about 93 seconds; all 13 unchanged compiler tests passed in isolation, then the full retry passed. Compiler code/assertions were not changed.

Fresh final command: `NEXT_PUBLIC_SITE_URL=https://www.campusedux.com NEXT_PUBLIC_ADSENSE_ENABLED=true npm run build` passed in **97.22s**, generating **57/57** static pages. Only a credential-free isolated source copy and existing dependencies were used. [Build result](../../audit-reports/public-content-startup-20261107/nonce-build.json) and [sanitized log](../../audit-reports/public-content-startup-20261107/nonce-build.log) persist in the worktree; public connection values were acquired anonymously from browser assets only for runtime testing and held only in process memory.

## Local production HTTP checks

Command: `python3 website/audit-reports/public-content-startup-20261107/verify-runtime.py`. This starts the isolated nonce build, waits for actual warm-up completion without issuing a local request, then runs 30 sequential curl requests per route with 500ms spacing. TTFB is curl time_starttransfer; p95 is nearest-rank, using complete successful documents. These are local measurements, not Render latency or a before/after performance claim.

| Route | Complete 200 | Non-200 / invalid 200 / transport error | Median / p95 TTFB ms | Noindex / confirmed-empty |
|---|---:|---:|---:|---:|
| `/` | 30/30 | 0 / 0 / 0 | 275.15 / 571.98 | 0 / 0 |
| `/jobs` | 30/30 | 0 / 0 / 0 | 149.44 / 321.09 | 30 / 30 |
| `/learning` | 30/30 | 0 / 0 / 0 | 160.88 / 293.58 | 0 / 0 |
| `/blog` | 30/30 | 0 / 0 / 0 | 131.96 / 296.36 | 0 / 0 |

All 120 documents had initial-head title/description/canonical/OG metadata, exactly one H1, matching script/CSP nonces and no-store. No renderer or catalog-unavailable UI appeared. Jobs was a successfully read, confirmed-empty current listing, with its existing “No open roles right now” state and expected noindex on all 30 responses; this is not an outage converted to an empty result. No jobs, deadlines or indexation policy were changed.

Startup completed before any local curl: **2204.28ms** after process launch. The warm-up itself took **1581ms**, completed all five tasks, and made **5** post-fill verification checks. The first Home request made **0** fill-verification checks, proving it reused those warmed payloads. The first revision took **648ms** under the 5,000ms allowance. There were **168** checks total (**121** cold / **47** later), **0** failures, **0** timeouts and **0** retries.

Next printed its listening “Ready” event at **554.69ms**, before instrumentation finished. The installed production constructor starts preparation eagerly and request handling awaits it; an immediately arriving request can still include startup wait. The verifier therefore waits for `public_content_warmup`, not the listening banner, to measure a visitor after startup. A first immediate-arrival pass is preserved as `first-pass-*`: it returned 120 HTTP 200s but its initial verifier incorrectly treated intentional Jobs noindex as invalid HTML and counted startup checks within the first visitor’s window. A subsequent verifier wait-loop bug was corrected. These were verification corrections, not changes to application behavior.

[HTTP totals](../../audit-reports/public-content-startup-20261107/http-results.json), [per-request timings](../../audit-reports/public-content-startup-20261107/http-samples.json), [startup/counter summary](../../audit-reports/public-content-startup-20261107/runtime-summary.json), [sanitized server log](../../audit-reports/public-content-startup-20261107/runtime-server.log), and [isolated source hashes](../../audit-reports/public-content-startup-20261107/source-hashes.json) contain the final evidence. The local server was stopped after verification.

Remaining limits: no production deployment/log investigation, live publication/protection mutation, database authorization test or live planner verification occurred. Synthetic tests cover denied/malformed revisions, withdrawal/protection during outages, ignored abort, retries, warm-up failure and next-visitor recovery. Healthy local loops do not prove that future backend outages cannot occur.

---

# Integration verification — 2026-11-06

Current candidate: uncommitted merge on `feat/seo-on-stability`, based on stability `088de09`, incorporating SEO `3523968`. This section supersedes the historical SEO-only results below. Nothing committed, pushed or deployed. No environment/credential files read; no dependencies installed; no SQL/migrations executed. Runtime tests use only a public anonymous source from the live browser assets, passed temporarily to local child processes without recording values.

Fresh ordered gates use isolated source copies and existing dependencies. `npm run lint`, `npx --no-install tsc --noEmit`, 301 focused tests and the full suite (1,916 passed, 12 opt-in local database tests skipped) passed. Full commands, exit codes, nonce builds and availability probe output are in `../../audit-reports/seo-on-stability-20261106/checks.json` and neighboring logs. Skips are not RLS evidence.

The original comparison availability probe is preserved unchanged as `tests/lib/merge-availability-probe.test.ts`. Additional tests combine real middleware, the public reader and route metadata: classified transient failure, one-second timeout, strict denied/malformed revisions, publication withdrawal, and failure of both authoritative paths. Catalog tests cover filters/sort, tracking-only clean canonicals, populated pagination/self-canonicals, empty/out-of-range pages, and outage precedence. Hub/sitemap tests distinguish confirmed emptiness from configuration/read failures and reject partial XML. The scratch rollback test applies the exact stability patch, then verifies fresh reads through actual nonce middleware after simulated revision-RPC permission removal.

**Accepted framework limit:** the installed Next.js `NonIndex` function adds noindex when the response status is above 400. Owner acceptance on 2026-11-06 covers real **500 + no-store** documents; this is not a blocker and must not be patched away. Successful fresh anonymous reads still require **200 with no outage-induced noindex**. Read errors must never become successful empty hub/listing/sitemap inventories. Required renderer failures must not become empty 200 responses. Revisit for persistent Render 5xx/Crawl stats degradation or a separately approved CDN/proxy or response-boundary design preserving nonce CSP, no-store and publication enforcement.

Runtime methodology: nonce-enabled production builds for both sources, same machine, public connection source and process settings; sequential curl with 500ms spacing, no parallel client requests. HTML loops use 30 requests each on Home, Jobs, Learning and Blog. TTFB uses `curl -w "%{time_starttransfer}"`, 20 samples per source/path, one equally applied warmup each, alternating source order. Median and nearest-rank p95 describe successful HTTP 200s only; errors are reported separately. Stability's streamed first byte can precede its metadata/content, so lower TTFB alone is not proof of a complete healthy document. Real detail samples come from current anonymous sitemap reads, supplemented by the existing public job/company projections; missing/unavailable samples are not replaced with invented IDs. These are local measurements, not Render latency or field CWV.

See the integration report for the final HTTP/TTFB table, hub inventory, per-file reasons, conflict decisions and limitations. Historical failures below are retained as history, not current candidate failures.

## Fresh production HTML checks — 2026-11-06

Command: `node scripts/verify-public-html.mjs http://127.0.0.1:3117` against the isolated nonce production build. All curl requests were sequential with 500ms spacing.

| Route | Valid 200 | Non-200 | Invalid 200 | Initial metadata | Matching nonces | Transport errors |
|---|---:|---:|---:|---:|---:|---:|
| `/` | 30 | 0 | 0 | 30 | 30 | 0 |
| `/jobs` | 30 | 0 | 0 | 30 | 30 | 0 |
| `/learning` | 30 | 0 | 0 | 30 | 30 | 0 |
| `/blog` | 30 | 0 | 0 | 30 | 30 | 0 |

All 120 documents had a nonempty title/description, production canonical and OG metadata in the initial head, exactly one H1 and matching script/CSP nonces. This is local HTTP evidence, not production deployment or a browser consent/hydration test.

<!-- integration-runtime-results -->

## Side-by-side TTFB — 2026-11-06

| Family | Real path | Stability median / p95 ms | Combined median / p95 ms | Median delta ms |
|---|---|---:|---:|---:|
| Home | `/` | 34.91 / 67.55 (20/20 HTTP 200) | 209.03 / 370.29 (20/20 HTTP 200) | 174.12 |
| Jobs | `/jobs` | 47.02 / 275.76 (20/20 HTTP 200) | 189.51 / 657.04 (20/20 HTTP 200) | 142.49 |
| Learning | `/learning` | 34.10 / 89.99 (20/20 HTTP 200) | 158.45 / 595.16 (20/20 HTTP 200) | 124.35 |
| Blog | `/blog` | 113.90 / 231.54 (20/20 HTTP 200) | 126.71 / 258.73 (20/20 HTTP 200) | 12.81 |
| Blog post | `/blog/ai-vs-humans-will-artificial-intelligence-replace-humans` | 150.87 / 240.38 (20/20 HTTP 200) | 142.94 / 185.26 (20/20 HTTP 200) | -7.93 |
| Learning topic | `/learning/ai-ml-notes/accuracy-precision-recall-f1-score` | 314.11 / 462.32 (20/20 HTTP 200) | 344.35 / 845.77 (20/20 HTTP 200) | 30.24 |
| Interview topic | `/practice/interview-questions/java/abstract-classes` | 29.56 / 43.0 (errors only: {'500': 20}; no healthy comparison) | 36.45 / 68.09 (20/20 HTTP 200) | not comparable |
| Coding problem | `/coding-problems/above-their-departments-average` | 21.19 / 41.69 (errors only: {'500': 20}; no healthy comparison) | 27.18 / 48.85 (20/20 HTTP 200) | not comparable |
| Practice problem | `/practice/problems/activity-selection` | 24.66 / 42.64 (errors only: {'500': 20}; no healthy comparison) | 37.82 / 54.20 (20/20 HTTP 200) | not comparable |
| Job detail | `/jobs/flex-junior-engineer-ecm-wd228947` | 25.09 / 37.28 (errors only: {'500': 20}; no healthy comparison) | 30.29 / 64.60 (20/20 HTTP 200) | not comparable |
| Company detail | `/jobs/companies/accenture` | 123.97 / 208.15 (20/20 HTTP 200) | 120.99 / 196.86 (20/20 HTTP 200) | -2.98 |

Twenty sequential requests per measured source/path, one warmup each, 500ms spacing, alternating source order. Median and nearest-rank p95 use successful HTTP 200s; error-only timings are labelled and are not a performance gain. Sources/settings/machine match; public content may change between requests. Stability streams metadata/outer content earlier on some routes, so initial-byte latency is not completed-document latency.
None of Home/Jobs/Learning/Blog exceeds the owner's roughly 500ms median-regression threshold. Retain the selected blocking policy and monitor Render response latency, CPU and memory; local p95 variability remains visible above. The documented one-line rollback restores Next's default metadata policy but does not undo required-read waits.
Job detail supplemental sample: /jobs/flex-junior-engineer-ecm-wd228947 is a real public record absent from the active-job sitemap; do not interpret that sample as an active opening.
Company detail supplemental sample: /jobs/companies/accenture is a real public record absent from the active-job sitemap; do not interpret that sample as an active opening.

## Current empty/thin hub inventory — 2026-11-06

A point-in-time anonymous read, not invented catalog data. Counts describe the named units. All inspected hub rows are shown so confirmed-empty exclusions can be reviewed against populated controls. An unavailable read is never classified empty.

| Name | URL path | Item count | Unit | Local robots/state |
|---|---|---:|---|---|
| Learning | `/learning` | 6 | courses | indexable |
| Interview Questions | `/practice/interview-questions` | 46 | topics | indexable |
| Java interview questions | `/practice/interview-questions/java` | 24 | topics | indexable |
| Python interview questions | `/practice/interview-questions/python` | 22 | topics | indexable |
| Jobs | `/jobs` | 0 | items | confirmed empty/thin |
| Projects | `/projects` | 0 | items | confirmed empty/thin |
| Companies | `/jobs/companies` | 11 | items | indexable |
| Blog | `/blog` | 2 | items | indexable |
| FAQ | `/faq` | 0 | items | indexable |
| Premium | `/premium` | 3 | items | indexable |
| Trending projects | `/projects/trending` | 0 | projects | confirmed empty/thin |
| Cloud Computing projects | `/projects/category/cloud-computing` | 0 | projects | confirmed empty/thin |
| Cyber Security projects | `/projects/category/cyber-security` | 0 | projects | confirmed empty/thin |
| Data Science projects | `/projects/category/data-science` | 0 | projects | confirmed empty/thin |
| Database projects | `/projects/category/database` | 0 | projects | confirmed empty/thin |
| DevOps projects | `/projects/category/devops` | 0 | projects | confirmed empty/thin |
| DSA & Algorithms projects | `/projects/category/dsa-algorithms` | 0 | projects | confirmed empty/thin |
| Machine Learning projects | `/projects/category/machine-learning` | 0 | projects | confirmed empty/thin |
| Mobile Development projects | `/projects/category/mobile-development` | 0 | projects | confirmed empty/thin |
| UI/UX Design projects | `/projects/category/ui-ux-design` | 0 | projects | confirmed empty/thin |
| Web Development projects | `/projects/category/web-development` | 0 | projects | confirmed empty/thin |
| Practice problems | `/practice/problems` | 150 | problems | indexable |

Confirmed-empty noindex hubs in this snapshot: /jobs, /projects, /projects/trending, /projects/category/cloud-computing, /projects/category/cyber-security, /projects/category/data-science, /projects/category/database, /projects/category/devops, /projects/category/dsa-algorithms, /projects/category/machine-learning, /projects/category/mobile-development, /projects/category/ui-ux-design, /projects/category/web-development.
No Learning or Interview hub/category was excluded as confirmed empty in this snapshot. Their empty/outage rules are exercised by synthetic boundary tests. Query variants, missing detail records and inherited editorial thin-detail exclusions are separate rules; they are not fabricated hub inventory rows.
The FAQ page uses the existing policy-backed fallback, so zero database FAQ rows are not zero rendered answers; the imported static-sitemap rule still uses active database rows. This inherited parity gap is preserved and explicitly reported.
The sampled company profile may have zero active roles and therefore intentional noindex despite having public company content; it is a detail sample, not a new empty-hub rule.

## Local production HTTP fault probes

A local-only fetch preload affects child test processes; no upstream failure or database mutation was induced. Revision-only failure still permits fresh anonymous reads. Combined revision/content failure must produce 500 + no-store. Framework noindex on actual 500s is accepted by the owner.

| Mode | Route | Status | H1 count | noindex | Cache-Control | Pass |
|---|---|---:|---:|---|---|---|
| revision | `/` | 200 | 1 | False | private, no-store | True |
| revision | `/learning` | 200 | 1 | False | private, no-store | True |
| revision | `/blog` | 200 | 1 | False | private, no-store | True |
| both | `/` | 500 | 0 | True | private, no-store | True |
| both | `/learning` | 500 | 0 | True | private, no-store | True |
| both | `/blog` | 500 | 0 | True | private, no-store | True |

---

# Verification — 2026-11-03

## Release follow-up: latest checks

The earlier typecheck exit was a **source error**, not only an environment transport warning: `resume/templates/page.tsx` imported the default `JsonLd` export as a named export (TS2614). Fixed and rechecked. Latest ordered gates after the breadcrumb and literal-code FAQ fixes:

| Check | Result |
|---|---|
| `npm run lint` | Passed; no lint warnings/errors (Next lint deprecation notice remains) |
| `npx tsc --noEmit` | Passed |
| Focused SEO, breadcrumb, schema and FAQ tests, one worker / 30s timeout | 57 passed |
| Full `npm test -- --maxWorkers=2 --minWorkers=1 --testTimeout=30000 --hookTimeout=30000` | 1,858 passed, 12 skipped; 127 test files passed, one skipped |

Initial verification failures are retained in `09-test-failure-history.csv`. Eleven initial focused tests timed out at five seconds; their two files passed on main (18/18) and on this branch when run with one worker. The first full run had three five-second timeout failures plus `spawnSync git EPERM` in the scratch-directory rollback suite. The root-layout metadata test also timed out on main; both resume metadata tests passed there. The rollback suite does not exist on main. The final full run passed with normal subprocess access and explicit 30-second test/hook limits; no source test timeout configuration was changed and no assertions were disabled. Main comparisons used a temporary export of its source/tests and the installed dependency tree, not a separate dependency installation or a production build of main.

The sequential crawl completed without restarting its checkpoint: **1,623 URLs checked, including all 1,091 previously unverified URLs; 1,616 HTTP 200 responses and seven transport timeouts, no 429 responses**. One worker, 350ms delay, 25s request timeout; numeric/date Retry-After handling and stop/backoff logic were present. The seven timeouts were `/learning/dbms-sql-tutorial/savepoint`, `/learning/dbms-sql-tutorial/set-operation-performance`, `/learning/dbms-sql-tutorial/simple-views`, `/premium`, `/privacy-policy`, `/project-license`, `/projects`. The first three are the three failures observed at the earlier checkpoint. Initial crawl evidence is preserved in `09-local-recrawl.csv`; it predates the final breadcrumb and FAQ fixes. Final-build sample/retry results must be read separately.

Lighthouse 12.8.2 and Chrome for Testing were installed temporarily under `/tmp` with owner authorization. No repository dependency files were changed. A main Lighthouse baseline has not been run; no performance improvement can be claimed.

Everything below describes earlier audit rounds unless explicitly identified as final follow-up evidence. Earlier “not installed/not run” statements are historical, not the current tool availability.

## Commands and results
Commands below run from `website/`, with existing dependencies. No packages installed, database changes, commits, pushes or deployments.

| Command / check | Actual result |
|---|---|
| Initial focused `npm test -- --maxWorkers=2 --minWorkers=1 tests/lib/sitemap.test.ts tests/lib/listing-indexing.test.ts tests/lib/adsense-readiness.test.ts tests/lib/jsonld-xss.test.ts` | 59 tests passed before implementation |
| `npm run lint` | Initial and first post-change runs passed; Next 15 reports next lint deprecation |
| `npx --no-install tsc --noEmit` | Passed after metadata helper type corrections |
| First `npm run build` | Compiled, then worker exited during static page generation; no reliable cause was emitted |
| Post-change `npm run build` | Passed with existing framework-managed local environment; no secret values inspected or reported |
| First full `npm test -- --maxWorkers=2 --minWorkers=1` | 13 assertions failed against intentional new contracts and one scratch-directory test could not spawn Git under sandbox; fixed contract expectations, then reran |
| Full suite with approved scratch Git execution | **126 files passed, 1 skipped; 1,852 tests passed, 12 skipped**. Skipped resume-flow tests were not claimed as passing |
| Final breadcrumb/schema review suite | 63 tests passed across SEO helper, sitemap and structured-data tests |
| Final interview-hub failure/recovery and home suite | 22 tests passed, including 5 new failure/empty-state tests |
| `git diff --check` | Passed at review; rechecked at handoff |
| `npm start -- --hostname 127.0.0.1 --port 3107` | Local production server started with socket approval; initial sandbox listen failed with EPERM |
| Initial local raw-HTML sample | 31 requests recorded in `09-local-http.csv`; actual missing route and missing interview slug returned 404; queried listings returned noindex/follow |
| Lighthouse mobile | Not run: no Lighthouse/browser CLI available locally; no installation authorized. No before/after scores invented |
| Google Rich Results / schema.org external validators | Not run. JSON parse checks and repository schema contract tests are not external validation |
| GSC / GA4 / Bing account verification | Not available; needs GSC data / owner account review |

Two npm/npx attempts were mistakenly launched at the monorepo root, produced no package verification and were rerun from website; the stray root npx process was stopped. They are not counted as passes. An automatic approval-review service usage limit interrupted the earlier final-review command; after the owner requested continuation, normal execution resumed. No approval controls were bypassed.

## Local HTTP interpretation
The first build inherited a development canonical origin (`http://localhost:3000`). This was reported, not silently treated as the required production host. The follow-up build uses an explicit public-origin process setting to test final canonical output. Local backend content can differ from production: do not compare local record counts or titles as live-site changes.

The initial home request returned a streamed 200 shell without title/H1 and the server logged a public-content revision failure. A 200 alone does not prove crawlable content. This remains a backend availability / error-status review item; do not bypass revision/publication checks or cache protected content to hide it. The `/learning/python-tutorial/variables` probe resolved to course content, so it is not accepted as a verified lesson sample; choose a real sitemap lesson in follow-up QA. The `/java/oops` probe was a missing-record status test, not a claim that that slug exists.

At 390px, live home and local About had no horizontal overflow; local About had one H1, `lang=en-IN`, `og:locale=en_IN` and parseable Organization/WebSite JSON-LD. One later live course browser session was 1440px and is not counted as mobile validation. Browser checks do not establish CWV or full accessibility compliance.

## Live crawl limits
1,625 URL spellings attempted; 534 usable HTTP 200 responses; 1,044 rate limits, 36 other 5xx responses and 11 transport/timeouts. Follow-up bulk live crawling was stopped. Existing metadata/heading/image observations are only reliable where response HTML was available. Incomplete graph counts cannot prove an orphan or the true shortest click depth. The crawler did not adaptively back off; future runs must stop/backoff on 429 and respect Retry-After. Do not interpret these rates as ordinary user traffic or confirmed Googlebot behavior.

Raw HTML JSON-LD was parsed for observed pages; warnings are in `01-schema-observations.csv`. Product and JobPosting records were not available as populated live sitemap samples, so their required fields, expiration and rendering rely on existing unit contracts and remain owner validator checks. No new ratings, prices, people or awards were introduced.

## Diff review
Task changes are listed with a reason in `09-changed-files.csv`. `09-main-comparison.csv` includes the requested comparison to main, explicitly separating inherited AdSense-branch differences. The branch already differed from main in 740 tracked website files; attributing that whole diff to this task would be incorrect. Review this task against starting commit `9f516ae` / HEAD, not only main. Unrelated .codex configuration, migration, release packages, audit reports and load-test files were preserved.

Rollback: revert only this task's website source/tests/public-file changes. There are no database migrations or environment-file edits to reverse. Monitor request-time sitemaps after any future owner-approved deployment; cold failure intentionally returns 503 with Retry-After and no-store, while successful section data retains its existing hourly cache.

## Final nonce-mode QA

`NEXT_PUBLIC_SITE_URL=https://www.campusedux.com NEXT_PUBLIC_ADSENSE_ENABLED=true npm run build` succeeded. The first nonce-enabled local run exposed `DYNAMIC_SERVER_USAGE` 500s on static-generated interview/coding detail pages. This is recorded in `09-local-http-final.csv` (an intermediate failing run, **not handoff acceptance**). Seven detail families were then made request-rendered; final build and rerun results are below. No CSP directive was loosened.

Eleven browser navigations at 390×844 in that intermediate run showed no horizontal overflow; the ten application-rendered pages each had one H1, en-IN/en_IN, and matching JSON-LD nonce values. The interview-category page returned a generic 500 and is not counted as passing. Console output included 500 resource failures and the intentional 404; no CSP refusal was observed. This was a short smoke test, not proof that all interactions are error-free.

The initial raw-HTTP helper did not retain error response bodies, and labelled nonce checks on XML/text as needing investigation. Handoff QA retains 404 HTML and labels non-HTML checks not applicable. Keep these measurement limitations when comparing the CSVs.

## Handoff results

- Final nonce-enabled build after the rendering fix: **passed**. Build output: shared first-load JS **103 kB**, middleware **34.5 kB**; these match the preceding build and are not a claimed CWV improvement.
- Final full suite: **127 test files passed, 1 skipped; 1,857 tests passed, 12 skipped**.
- Standalone TypeScript and lint checks passed; final build also ran lint/type validation.
- Final raw-HTML sample: **30 HTTP 200 responses and one intentional 404**, recorded in `09-local-http-handoff.csv`. Successful HTML samples carry public-host canonicals where applicable, en_IN OG locale and matching script nonces. Auth/search deliberately do not declare public canonicals.
- Home recovered with title, one H1 and its own canonical in the final run; the earlier revision failure still warrants operational monitoring and is not dismissed as fixed by metadata.
- Previously failing interview category/topic and coding detail paths now return 200. A separate practice detail browser check also returned 200. All five final browser samples had width/scrollWidth 390/390, one H1 and nonce-matching JSON-LD. No CSP refusal observed; signed-out practice emitted one 401 resource error and the missing page an expected 404. See `09-browser-qa.md`.
- Do not compare production crawl latency with localhost latency as a performance improvement. No deployment was performed, so there is no production after measurement.

Final redirect/image checks: five existing 308 redirects (including trailing-slash normalization) and one existing content 301 each resolved in one hop to HTTP 200; uppercase `/Learning` returned 404. No redirect policy was changed. `09-local-redirects.csv` records the paths. The new interview OG route returned HTTP 200 PNG, decoded **1200×630**; see `09-og-image.md`. Public production http/https/apex redirects remain unverified after rate limiting.

The local QA server was stopped at handoff. Environment-file contents were not read; process-only QA settings were used. Generated `.next` output is not part of the task diff.

## Final Compiler correction and verification (2026-11-03)

The raw-HTML CSV exposed a duplicate Compiler breadcrumb that a browser check inspecting only the first nav missed. The final source removes the added page-level nav and replaces the workspace's existing nav with the shared Home-first Breadcrumb. The focused invocation included a nonexistent `compiler-page.test.ts` filter; Vitest ran four existing files, **53 tests passed**. The existing compiler route/schema tests were included in the subsequent full suite.

Final ordered gates after this correction: `npm run lint` passed; `npx tsc --noEmit` passed; 53 focused tests passed; `npm test -- --maxWorkers=2 --minWorkers=1 --testTimeout=30000 --hookTimeout=30000` passed (**1,858 passed, 12 skipped, 127 files passed, one skipped**); `NEXT_PUBLIC_SITE_URL=https://www.campusedux.com NEXT_PUBLIC_ADSENSE_ENABLED=true npm run build` passed. Existing environment loading was used; no credential files were read or copied. The final build generated 78 static pages without the earlier reported prerender retries. `git diff --check` passed.

After restarting the final build, curl confirmed exactly **one** Compiler breadcrumb, its title/description and en_IN locale. Practice Problems returned its title, description and en_IN locale on retry. The earlier missing metadata remains evidence of intermittent rendering/backend failure, not an erased observation. Private localhost curl needed host-network execution; sandbox connection refusal was not a server outage.

Completed crawl: all seven transport failures returned 200 in the 35-URL retry sample. That sample returned 34 HTTP 200 and one intentional 404; all script nonces matched. See `09-raw-html-pass-fail.md` for the actual table, including failures. Browser capture had 30 passing checks of 38 attempts, with no observed CSP violations; failed/transient checks remain in `09-final-browser.csv`. These checks are sampled, not every-page verification.

Lighthouse's interrupted first attempt produced NO_FCP on home and five 180-second timeouts, with no valid scores (`09-lighthouse-mobile.csv`). Temporary tool files disappeared between sessions; the approved versions were restored and the final-build audit restarted. Final results are stored separately in `09-lighthouse-mobile-final.csv`. No before-run on main exists; these are local lab measurements, not field CWV or demonstrated improvements.

## Link graph and schema limitations

`09-local-link-graph.csv` is an observed graph, not a definitive orphan list. `/placement` and `/placement/notes` are redirected aliases of Learning, so they are not canonical orphan pages. The apparent orphan coding problems `correct-a-mistake-with-a-savepoint` and `create-a-high-earners-view` have parent lessons among the timeout set; those lessons later returned 200, but the complete graph was not recomputed from all recovered links. Five practice URLs appeared more than three clicks deep in the observed graph. Missing pagination/filter edges can shorten actual distances. No speculative hard-coded content links were added on this evidence alone; full graph reconciliation remains open.

The schema scan observed Organization, WebSite, BreadcrumbList, Course, TechArticle, FAQPage, BlogPosting and WebApplication across returned pages. It found 64 normalized FAQ text-match warnings, retained in `09-schema-local-warnings.csv`; literal-code stripping was confirmed and fixed, but not every remaining warning has been manually validated. Tests cover populated JobPosting and project detail contracts with isolated fixtures; this is not equivalent to browsing a populated job/project on the production server. No real populated job/project browser result or external Rich Results/schema.org validation is claimed. Real company detail was checked. The final Lighthouse selection includes company detail but no fabricated job ID.

## Final mobile Lighthouse results

Lighthouse 12.8.2; Chrome for Testing 156; default mobile simulated throttling; one run per URL on the local nonce-enabled production build, 2026-11-03. Scores below are out of 100. CPU calibration warnings occurred on several runs; these results are machine-dependent. No main baseline exists and no improvement is claimed.

| Page | Performance | Accessibility | Best practices | SEO | LCP (s) | TBT (ms) | CLS |
|---|---:|---:|---:|---:|---:|---:|---:|
| home | 84 | 100 | 100 | 92 | 3.32 | 335 | 0.0001 |
| course | 67 | 97 | 100 | 100 | 3.44 | 579 | 0.0001 |
| lesson | 79 | 98 | 100 | 100 | 2.30 | 742 | 0.0001 |
| blog | 94 | 100 | 100 | 100 | 2.83 | 134 | 0.0001 |
| interview | 83 | 100 | 100 | 100 | 3.20 | 403 | 0.0001 |
| coding | 72 | 100 | 96 | 100 | 3.65 | 726 | 0.0001 |
| jobs | 75 | 100 | 100 | 92 | 2.81 | 256 | 0.3116 |
| companies | 91 | 100 | 100 | 100 | 2.90 | 218 | 0.0001 |
| company | 81 | 100 | 100 | 69 | 3.32 | 437 | 0.0001 |
| projects | 85 | 100 | 100 | 69 | 3.23 | 327 | 0.0001 |
| resume | 89 | 96 | 96 | 100 | 2.07 | 386 | 0.0001 |
| about | 81 | 100 | 100 | 92 | 3.08 | 526 | 0.0001 |

**12 valid mobile reports; 13 URLs attempted.** The intentional 404 returned HTTP 404 and Lighthouse declined to score it (ERRORED_DOCUMENT_REQUEST); this is expected, not a fabricated zero score. No populated job detail was available in the selected dataset, so that page type remains unmeasured. Company detail was measured. Exact paths, timestamps, warnings and unrounded metrics: `09-lighthouse-mobile-final.csv`.

Findings include missing meta descriptions in the captured Home and Jobs Lighthouse documents, course definition-list structure, lesson heading order, and layout/JavaScript performance opportunities. Projects is deliberately noindex while empty, so its crawlability audit failure should not be “fixed” by indexing an empty listing. See `09-lighthouse-findings.csv`; category scores are not a substitute for those findings.

Final browser retry: **8/8 passed** across Compiler, Practice Problems, Blog and Referral at 390px and 1440px. Each had one visible Home-first breadcrumb matching JSON-LD, one H1, no horizontal overflow and a meta description. Compiler had exactly one breadcrumb nav, verified by counting all navs. Evidence: `09-browser-final-retry.csv`. Earlier failures remain in the original browser CSV.

## Historical raw-HTML nonce retry limitation (before availability fixes)

`09-final-nonce-retry.csv` records five final-build fetches. All scripts matched CSP nonces; public HTML remained private/no-store and the missing route returned 404. Compiler, Jobs and Practice Problems had one H1 and a description. Home had a description but **zero H1s despite HTTP 200**. This was a render/availability failure in that earlier build; the later availability fixes and successful curl loops below supersede it. It must not be hidden by the successful Lighthouse score or the successful earlier home fetch. Home/Jobs descriptions were present in this later curl sample, unlike the Lighthouse captures; metadata availability/timing requires further investigation. No unconditional deploy recommendation is made.

## Revision availability follow-up (2026-11-03; final local evidence)

Root cause: Home put its data-dependent hero/H1 behind a page-local Suspense fallback. A rejected `public_content_revision` read could therefore occur after HTTP 200 was committed. The reader replaced upstream errors with a generic message, obscuring the cause. The underlying production database/network cause is not established by the old logs.

Home and Jobs also perform backend reads in `generateMetadata`. Next 15.5 streams this metadata for browser user agents by default ([Next.js metadata documentation](https://nextjs.org/docs/15/app/api-reference/functions/generate-metadata)); a completed curl document and a Lighthouse capture can therefore differ. Blocking metadata (`htmlLimitedBots: /.*/`) now makes successful documents wait for metadata. This explains a verified code path, not proof of the exact timing in historical Lighthouse captures.

The implementation chooses a fresh-read 503 preflight, not stale cache fallback: `RevisionCache` explicitly has no stale-on-error policy, and reusing a token without checking publication could expose withdrawn content. Existing render and post-fill revision checks remain intact. Each revision attempt has a 2.5-second deadline and abort signal, with one retry. Structured logs contain route, scope, sanitized message, safe error code, duration_ms and attempt; raw upstream errors, credentials and query strings are excluded. Missing-RPC compatibility continues to use fresh uncached reads.

Important limit: middleware can return 503 before rendering, but cannot change status after a later render/post-fill failure. Removing Home/Learning outer loading boundaries and blocking metadata reduces that exposure; it does not establish universal 503 handling for every late failure. The owner now accepts this response-contract limitation as residual risk; it no longer gates release. An empty HTTP 200 remains unacceptable. Middleware also adds a fresh revision round trip and grows the bundle; no latency improvement is claimed.

Files changed in this follow-up (existing SEO changes were preserved):
- `next.config.js`: block streamed metadata for all user agents.
- `src/lib/publicContentRevision.ts`: bounded retry, sanitized structured diagnostics and revision route mapping.
- `src/lib/revisionedPublicRead.ts`: reuse the retry reader, retaining all publication/cache checks.
- `src/middleware.ts`: pre-render revision check and retryable uncached 503, preserving nonce CSP.
- `src/app/page.tsx`: resolve Home content before its response shell.
- `src/app/learning/page.tsx`: resolve Learning content before its response shell.
- `src/app/jobs/page.tsx`: reserve responsive space across async result transitions.
- `src/app/learning/_components/CourseHero.tsx`: move decorative icons inside definition descriptions.
- `src/components/learning/LessonBlock.tsx`: align the shallowest authored heading below its block/page heading, preserving nesting and anchors.
- `src/components/learning/Markdown.tsx`: keep lesson headings below the page H1.
- `src/app/login/LoginView.tsx`: render one shared H1 outside Suspense.
- `rollbacks/phase-2-public-cache.patch`: keep the existing app-first rollback patch applicable.
- `tests/lib/public-revision-response.test.ts`: 503, retry, deadline, nonce and safe logging contracts.
- `tests/app/lesson-reading-ui.test.ts`: untitled Markdown heading regressions.
- `tests/app/home-features.test.ts`: await the async Home page in the renderer.
- `tests/lib/advertising.test.ts`: supply a successful revision fixture for CSP forwarding tests.
- `tests/lib/listing-indexing.test.ts`: model the Supabase abortSignal query-builder contract.
- `scripts/verify-public-html.mjs`: localhost-only 30-request-per-route curl verification, 500ms spacing.
- `docs/seo/00-summary.md`, `09-verification.md`, `12-deploy-checklist.md`: current evidence and unresolved release conditions.

Intermediate failures: two Home renderer tests and two advertising nonce tests required fixture updates and then passed. Neither test file exists on main (`git show main:<path>`), so no main pass/fail comparison is claimed. A later sandbox run blocked the rollback test's git subprocess with EPERM; it passed with host execution. No dependencies were installed, credentials inspected, commits made or deployment performed.

Intermediate production-build HTTP loop: all four routes returned 30/30 valid HTTP 200 documents (120 total), zero non-200 responses, zero missing-H1 responses and zero transport errors. All 120 had title, description, canonical and OG tags in the initial head and matching script/CSP nonces. This loop preceded the final 1NF heading correction and will be repeated after rebuilding. The real 1NF page exposed authored `### Definition` rendered as H4 below H2; the follow-up aligns the shallowest source heading below the enclosing block heading rather than assuming every block starts with `##`.

Mobile browser smoke (390×844, unthrottled): login had one H1; course had no invalid definition-list group children; Jobs had one H1, description and no horizontal overflow. A single Jobs observation recorded layout-shift sum 0.00011066874808142973. This is not a Lighthouse run, a main baseline, or a claimed performance improvement.

Final source checks after the real 1NF heading correction, in requested order:
1. `npm run lint` — passed, no warnings/errors.
2. `npx tsc --noEmit` — passed.
3. `npm test -- tests/lib/public-revision-response.test.ts tests/lib/public-browsing.test.ts tests/lib/public-cache-rollback.test.ts tests/lib/listing-indexing.test.ts tests/lib/advertising.test.ts tests/app/home-features.test.ts tests/app/lesson-reading-ui.test.ts tests/app/course-detail-ui.test.ts tests/app/home-learning-ui.test.ts tests/app/jobs-projects-ui.test.ts --maxWorkers=2 --minWorkers=1 --testTimeout=30000 --hookTimeout=30000` — passed (183 tests, 10 files).
4. `npm test -- --maxWorkers=2 --minWorkers=1 --testTimeout=30000 --hookTimeout=30000` — passed (1,873 tests, 12 skipped; 128 files passed, one skipped).

There are no remaining failing tests in that run. Main was not checked out or executed. These gates test application contracts, not live RLS/migrations; no database checks or migrations were run.

5. `NEXT_PUBLIC_SITE_URL=https://www.campusedux.com NEXT_PUBLIC_ADSENSE_ENABLED=true npm run build` — passed after final heading correction; 78/78 static pages generated, shared first-load JS 103 kB, middleware 90.3 kB. Next loaded its existing environment through normal build behavior; no credential file was inspected or copied. The interrupted earlier build is not used as final evidence.
6. Final-build browser check at 390×844 for `/learning/dbms-sql-tutorial/1nf` — HTTP 200, exactly one H1, no visible heading-level skips, `Definition` rendered as H3, no horizontal overflow. This checks the originally measured lesson rather than only a fixture.

7. Final rebuilt server: `NEXT_PUBLIC_SITE_URL=https://www.campusedux.com NEXT_PUBLIC_ADSENSE_ENABLED=true npm run start -- --hostname 127.0.0.1 --port 3100`; verifier: `node scripts/verify-public-html.mjs http://127.0.0.1:3100` — exit 0. Curl used a browser user agent, 45-second request limit and 500ms delay between sequential requests.

| Route | Valid 200 (title + description + one H1) | Non-200 | Invalid 200 | Initial head metadata | Matching script nonces | Transport errors |
|---|---:|---:|---:|---:|---:|---:|
| `/` | 30 | 0 | 0 | 30 | 30 | 0 |
| `/jobs` | 30 | 0 | 0 | 30 | 30 | 0 |
| `/learning` | 30 | 0 | 0 | 30 | 30 | 0 |
| `/blog` | 30 | 0 | 0 | 30 | 30 | 0 |

Initial head checks include nonempty title, description, production-host canonical, og:title and og:description. Total: **120/120 valid responses**, no HTTP-200 document without exactly one H1. No revision failure log appeared during this healthy loop. This is a local sample, not proof of production availability.

**Fault injection and accepted residual risk (owner decision 2026-11-03):** a separate localhost server on port 3101 preloaded a temporary Node fetch wrapper that returned a synthetic 503 only for renderer revision RPC reads. No database mutation or production request injection occurred. Home, Learning and Blog each returned **HTTP 500**, zero H1, `no-store`, and no Retry-After. Thus these tested renderer failures no longer produce empty HTTP 200, but the requested universal **503 + Retry-After** contract is **not complete**. Middleware failure tests prove 503 + Retry-After: 5 + no-store before rendering; they do not prove post-preflight failures get that response. The owner accepts 500 + no-store after preflight instead of requiring a universal 503 + Retry-After response. No Pages Router migration, custom server or proxy is approved. Preserve no-empty-200 and publication protections; monitor cold fills and optional nested reads in production. Do not mistake the healthy loop for coverage of every public detail family.

No final Lighthouse audit or main baseline was run. The Jobs browser observation does not establish a CLS improvement; remeasure under matched mobile conditions. Production must correlate sanitized revision logs with trusted backend logs to establish the original outage cause. Other public detail families, late post-fill races at the HTTP boundary, and real production latency remain outside the verified sample.

Git review: branch remains `feat/seo-overhaul`; nothing staged, committed, pushed or deployed. `git diff --check` passed. Whole-worktree tracked diff: 74 files, 511 insertions, 270 deletions; 15 untracked status entries (directories may contain multiple files). These totals include substantial pre-existing SEO and unrelated changes and exclude untracked file contents; they are not the isolated task delta. The per-file follow-up inventory above distinguishes this task. Existing .codex configuration, migration and local audit/release files were preserved.

Both local production servers (healthy 3100 and fault-injection 3101) were stopped after verification.

## Owner decision — Render and accepted residual risk (2026-11-03)

The live site is hosted on **Render**, a Node host. Earlier Vercel assumptions were incorrect. Continue standard Next.js hosting (`next start`), with no custom server or buffering proxy. **Pages Router migration is rejected; do not implement it.** The earlier migration proposal is superseded by this decision.

Accepted behavior:

- Middleware revision preflight failure: **503**, **Retry-After: 5**, **Cache-Control: no-store**.
- Renderer revision failure after successful preflight: **500 + no-store**, without Retry-After. Prior fault injection verified this on Home, Learning and Blog. The no-empty-200 invariant is retained; the sampled evidence does not prove every possible nested/detail failure path.
- Healthy documents: initial title/description/canonical/OG metadata, exactly one H1 and CSP-matching script nonces. Do not restore loading-only 200 shells, bypass publication checks or serve stale/protected content.

This is an **accepted residual risk**, not a release blocker: 500 still indicates a failed fetch rather than an indexable successful empty document. Google handles both 500 and 503 as server errors, with crawl-rate reduction and possible indexing effects if errors persist ([HTTP status guidance](https://developers.google.com/crawling/docs/troubleshooting/http-status-codes)). Missing Retry-After limits explicit retry guidance but does not justify the migration/hosting changes the owner rejected. Acceptance does not authorize deployment or excuse sustained unavailability.

Revisit when Render service logs show recurring revision/5xx errors, retries exhaust frequently, Search Console Crawl stats shows growing server-error rates/host problems, or a future approved CDN/proxy in front of Render can map selected transient 5xx to 503 with Retry-After. Such a rule must preserve no-store, nonce CSP, original URLs and access controls; it must not cache error/protected HTML or hide unrelated faults. No rule or proxy is being added now. Any empty 200 remains a regression requiring investigation.

Installed Next 15.5.28 maps ordinary App Router render errors to 500. Its HTTP access fallbacks accept 401/403/404, instrumentation observes errors without a response object, and `error.tsx` is client-side UI. Those findings remain valid regardless of hosting; resolving reads earlier prevents early success but does not create arbitrary status/header control. No framework patch was added.

Jobs listing and job/project detail readers do not currently call `public_content_revision`; synthetic revision-only failures do not cover their catalog failure paths. Prior fault injection and all historical test counts above are kept distinct from the new owner-decision verification run below.

Render operations: inspect service **Environment** settings without copying secrets; keep the approved production canonical origin and existing consent/ad policy settings. Normal Next builds load their existing environment; no credential files were read by this work. After separately approved deployment, search the Render service **Logs** for `revision`, `public_content_revision_failed`, 500 and 503, correlate UTC time, route, scope, attempt, duration_ms and sanitized code with backend logs. HTTP request-log availability depends on the Render plan; use existing monitoring if unavailable ([Render logs](https://render.com/docs/logging)). In Search Console, retain **Settings → Crawl stats** monitoring for response codes, host status and response time ([Crawl stats](https://support.google.com/webmasters/answer/9679690?hl=en)). Deploy and rollback instructions are in `12-deploy-checklist.md`.

## Fresh owner-decision verification (2026-11-03)

Only the three requested SEO documents changed in this decision follow-up; no router migration, custom server, proxy or application behavior change was implemented. The following gates were freshly rerun in order, rather than reusing earlier results:

1. `npm run lint` — passed, no ESLint warnings/errors (Next emitted its existing `next lint` deprecation notice).
2. `npx tsc --noEmit` — passed.
3. `npm test -- tests/lib/public-revision-response.test.ts tests/lib/public-browsing.test.ts tests/lib/public-cache-rollback.test.ts tests/lib/listing-indexing.test.ts tests/lib/advertising.test.ts tests/app/home-features.test.ts tests/app/lesson-reading-ui.test.ts tests/app/course-detail-ui.test.ts tests/app/home-learning-ui.test.ts tests/app/jobs-projects-ui.test.ts --maxWorkers=2 --minWorkers=1 --testTimeout=30000 --hookTimeout=30000` — **183 passed, 10 files passed**.
4. `npm test -- --maxWorkers=2 --minWorkers=1 --testTimeout=30000 --hookTimeout=30000` — **1,873 passed, 12 skipped; 128 files passed, one skipped**, 41.11 seconds. No failing test remained. Expected injected-error diagnostics are not test failures.
5. `NEXT_PUBLIC_SITE_URL=https://www.campusedux.com NEXT_PUBLIC_ADSENSE_ENABLED=true npm run build` — passed; **78/78** static pages generated; shared first-load JS **103 kB**, middleware **90.3 kB**. Next's normal environment loading was used; no credential file was inspected or copied.

The localhost server start was initially prevented by an automatic approval-review usage limit; no server started in that failed attempt. After the owner's continue instruction, approval succeeded and the same production build started on port 3100. This was an execution-review availability issue, not an application build failure.

6. `NEXT_PUBLIC_SITE_URL=https://www.campusedux.com NEXT_PUBLIC_ADSENSE_ENABLED=true npm run start -- --hostname 127.0.0.1 --port 3100`, followed by `node scripts/verify-public-html.mjs http://127.0.0.1:3100` — verifier **exit 0**, fresh results below. Curl requests were sequential, 30 per route, 500ms apart, browser user agent, 45-second timeout per request.

| Route | Valid HTTP 200 | Non-200 | Invalid/empty 200 | Initial-head metadata | Matching script nonces | Transport errors |
|---|---:|---:|---:|---:|---:|---:|
| Home `/` | 30 | 0 | 0 | 30 | 30 | 0 |
| Jobs `/jobs` | 30 | 0 | 0 | 30 | 30 | 0 |
| Learning `/learning` | 30 | 0 | 0 | 30 | 30 | 0 |
| Blog `/blog` | 30 | 0 | 0 | 30 | 30 | 0 |

**120/120 valid HTTP 200 responses**, each with title, description, canonical and OG metadata in the initial head, exactly one H1, and every script nonce matching CSP. Zero non-200 responses, zero missing/duplicate H1 responses and zero transport failures. No revision error appeared in the captured server output. The localhost server was stopped after verification.

`git diff --check` passed; branch remains `feat/seo-overhaul`, with nothing staged, committed, pushed or deployed. Existing application and unrelated user changes were preserved. Only `00-summary.md`, `09-verification.md` and `12-deploy-checklist.md` were edited for this owner-decision follow-up.

Not verified in this run: Render service configuration/logs or a production deployment/rollback, Search Console Crawl stats, a main performance baseline, Lighthouse, every detail family, or new live fault injection. Prior renderer fault-injection evidence remains labelled historical; focused tests freshly cover synthetic revision failures, retry/deadline behavior and middleware 503 headers. The healthy curl sample does not prove a universal absence of future outages. No RLS/migration checks were run because no database change was made.
