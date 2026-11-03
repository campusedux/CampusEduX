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
