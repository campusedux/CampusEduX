# CampusEduX SEO / AEO / GEO — implementation and remaining work

## Availability follow-up — 2026-11-03

Owner decision (2026-11-03): the 503 response-contract item is an accepted residual risk, not a release blocker. Live hosting is Render, using standard Next.js hosting with no custom server or proxy. The Pages Router migration is rejected and must not be implemented. Revision reads now have two bounded attempts and sanitized structured diagnostics; middleware returns uncached 503 with Retry-After for failed preflight checks. Home/Learning no longer stream their outer loading-only shells, metadata blocks for all user agents, and course/lesson/login markup plus Jobs async-space reservation were adjusted. Publication checks remain authoritative; no stale-on-error fallback was added.

Fresh owner-decision rerun (2026-11-03): lint and TypeScript passed, **183 focused tests passed**, full suite **1,873 passed / 12 skipped**, nonce-enabled production build passed. Fresh sequential curl loops (500ms spacing): Home, Jobs, Learning and Blog each **30 valid HTTP 200 / 0 non-200 / 0 invalid 200**, 120 total, all with initial-head metadata and matching script nonces. The real 1NF lesson now has no visible heading-level skips; login has one H1 and course definition-list groups have valid children.

**Accepted residual risk:** renderer revision failures after successful middleware preflight return **500 + no-store**, without Retry-After; middleware preflight failures return **503 + Retry-After: 5 + no-store**. The previous injected Home/Learning/Blog failures were 500, never empty 200. The invariant remains that failed public content must not be presented as successful empty HTML. Universal 503 is not implemented or required for this release by the owner; see the final evidence and changed-file inventory in `09-verification.md`. No main performance baseline or performance gain is claimed. Nothing committed, pushed or deployed.

Both 500 and 503 tell crawlers the fetch failed rather than presenting an empty page as valid content. Google treats 5xx as server failures and can reduce crawling; prolonged failures can affect indexing, so acceptance is not acceptance of persistent downtime ([Google HTTP status guidance](https://developers.google.com/crawling/docs/troubleshooting/http-status-codes)). Publication checks and no-store remain intact; no stale/protected-content fallback is enabled. Revisit if Render revision/5xx errors persist, Search Console Crawl stats worsens, or an approved CDN/proxy in front of Render can map selected transient 5xx to 503 with Retry-After while preserving no-store and CSP. No such infrastructure change is authorized now.

Render operations: owner reviews the service's Environment settings without exporting credentials, uses Render deploy/rollback controls only after separate approval, and monitors service logs for `revision`/`public_content_revision_failed` and 5xx. Keep Search Console **Settings → Crawl stats** checks for server errors, host availability and response time. See `12-deploy-checklist.md`.

## Historical local release verification

Branch: **feat/seo-overhaul**, based on **fix/adsense-readiness** at `9f516ae`, not main. No commit, push, deployment, database migration or credential-file inspection. Lighthouse and Chrome were installed temporarily with owner authorization; repository dependency files were unchanged.

Completed: the sequential crawl checked **1,623 URLs**, including all **1,091 previously unverified URLs**. It recorded 1,616 HTTP 200 responses and seven timeouts; all seven returned 200 in the final-build retry sample. This does not establish production availability. The crawl CSV predates the latest breadcrumb fixes.

The original typecheck failure was a real named/default JsonLd import error, now fixed. Lint, TypeScript, 57 focused tests and a full suite of **1,858 passed / 12 skipped** passed before the final Compiler breadcrumb correction; the nonce-enabled build also passed, with three prerender retries. After that correction, lint, TypeScript, 53 focused tests, the full suite (1,858 passed / 12 skipped) and the nonce-enabled production build all passed again.

Visible breadcrumbs now use Home-first trails, company schema includes Jobs, lesson breadcrumbs are visible on mobile, and literal inline-code identifiers are preserved in FAQ schema. The raw-HTML sample contains 35 checks: 34 HTTP 200s and one intentional 404, all with matching script nonces. It also exposed missing Practice Problems metadata in one response, a duplicate Compiler breadcrumb (corrected and verified as a single nav by curl), and two H1s on the noindex login page. Do not interpret HTTP 200 alone as a successful content render.

The initial browser round recorded 30 passing checks out of 38 attempts at 390px and 1440px; the final retry passed 8/8 for Compiler, Practice Problems, Blog and Referral. Others encountered transient rendering/navigation failures; sampled server logs reported **Public content revision is unavailable**. The underlying outage cause remains a production monitoring follow-up; the later response fixes and owner-accepted residual risk are recorded above. No CSP violations were observed in the captured checks. Lighthouse finished a fresh 13-URL run: 12 valid mobile reports and one expected unscored 404. Performance scores ranged from 67 to 94; exact scores and warnings are in `09-verification.md`. No main Lighthouse baseline or performance improvement is claimed.

Final raw-HTML nonce retry passed script/CSP matching on five URLs and confirmed the intentional 404. However, the homepage returned HTTP 200 with **zero H1s** in that retry; this was an availability/rendering defect, not a passing homepage check; the subsequent fixes and 120-request checks above supersede that historical result.

**Current release status:** the owner accepts the 500-versus-503 residual risk; it is no longer a release blocker. This is not deployment approval. The earlier backend/metadata/home observations are retained as history and superseded by the later local verification where applicable. Production monitoring and populated job/project browser verification remain owner follow-ups. See `09-verification.md`, `11-owner-confirmation.md` and `12-deploy-checklist.md`. Editorial identity and new content decisions remain with the owner.

## Top 15 findings by impact
| Rank | Finding | Status |
|---|---|---|
| 1 | Live crawl encountered 429/5xx/timeouts; key pages could not be verified | Initial live crawl: 534/1,625 usable HTML; completed local recrawl: 1,616/1,623 HTTP 200, seven timeouts recovered on retry; production logs still needed |
| 2 | Nonce-mode detail routes returned 500 with DYNAMIC_SERVER_USAGE | Seven route families switched to request-rendered HTML; verified 200 with matching nonces in final local QA |
| 3 | Populated filter/search variants could be indexed | Fixed on jobs, projects, blog, practice and learning listing queries |
| 4 | Force-static sitemap generation could couple backend failure to prerender | Request-time generation, bounded reads and retryable 503 implemented |
| 5 | Empty learning/interview hubs could disagree with sitemap inclusion | Conditional hub metadata and section exclusion implemented |
| 6 | Interview category failures were cacheable empty results | Failures now reject; optional home discovery retains graceful fallback |
| 7 | Regional language/OG locale missing | en-IN / en_IN implemented through root and shared helper |
| 8 | Per-page OG overrides dropped shared social defaults | Shared completion adds missing fields and preserves authored/dynamic images |
| 9 | Job/interview cards generic | New data-backed 1200×630 OG routes |
| 10 | One-item breadcrumb lists insufficient for rich-result eligibility | Home-first shared schema and visible trails implemented; sampled parity checked, Compiler duplicate corrected |
| 11 | 404 provided little recovery navigation | Search and useful hub/tool links added; real 404 observed |
| 12 | Thin/templated content requires expert improvements | Existing exclusions preserved; editorial roadmap supplied, no mass-generated replacements |
| 13 | Author credentials, official profiles and BAMS expertise unconfirmed | No invented author, sameAs, affiliation or medical expertise claims |
| 14 | Search, conversion and CWV baseline unavailable | Measurement plan supplied; **needs GSC data** / analytics access |
| 15 | Older FAQ/GEO advice overstates benefits | Current Google retirement guidance documented; llms.txt labelled experimental |

## Code changes
Reused seo.ts / seoTitles.ts / metaDescription.ts and existing UI/data loaders. Added social metadata completion across public page templates and legal helpers; retained valid static metadata APIs instead of converting every route needlessly to async. Listings with query parameters are noindex/follow; distinct pagination retains its own canonical. Added sitemap deadlines/cap guards and recoverable failure responses, OG cards, 404 navigation and optional public llms.txt. Existing content URLs, redirects, premium-body gating, CSP implementation, analytics consent, AdSlot, ads.txt and policy wording were preserved. No fake schema data was added. Seven detail route families now render HTML per request to avoid nonce/static-generation 500s; data caches remain, but server rendering cost should be monitored.

Owner decision: preserve current training access and public search/citation access with private/auth/API exclusions. Documented in `10-crawler-policy.md`; editable later in `src/app/robots.ts`.

## Measured evidence
- Live index and five nonempty child sitemaps returned 200, containing **1,305 URLs**.
- Public crawl attempted **1,625 URL spellings**; **534** had usable HTML, **1,091** were initially unverified; all were subsequently included in the completed localhost crawl.
- All 534 observed HTML responses lacked en_IN OG locale before this change. Local About after change has en_IN and en-IN HTML; no production after measurement exists because nothing was deployed.
- Successful live HTTP fetches: median **2.72s**, p95 **15.26s**, from this audit environment; these are not CWV or Lighthouse scores.
- Final full suite: **1,858 passed, 12 skipped**. Nonce-enabled production build, lint and TypeScript passed; 31 local HTTP checks returned 30 successful responses and one intentional 404. Detail-route nonce checks passed after the runtime fix. See `09-verification.md`.
- No ranking, traffic, keyword-volume, AI-citation or Lighthouse improvements are claimed.

## Owner decisions and manual work
Confirm real author/reviewer names, credentials and official profiles. Approve proposed articles and business/service claims; BAMS publication requires a qualified reviewer and source rights. Supply GSC/analytics exports rather than credentials. Verify GSC/Bing ownership, submit sitemaps, inspect key URLs and validate applicable schemas externally. Review origin/CDN rate limiting and failed content-revision reads with production logs. Review the local Lighthouse results; run a matching main baseline before claiming performance gains. IndexNow needs a real verification key and approved publication-trigger design; it was not implemented with a placeholder.

## Priority roadmap
First: availability, indexing and GSC baseline. Next: improve existing high-opportunity lessons with tested examples and sources. Then publish reviewed project-selection and resume-project guides, followed by DBMS revision and placement planning. BAMS and other new streams wait for real expertise. Detailed proposed URLs, outlines and a 90-day schedule: `05-content-gap-analysis.md`. Keyword difficulty is qualitative; candidate questions are not claimed PAA extractions.

## Explicit outstanding scope
Complete every-page content/heading/image/duplicate review for unverified URLs; confirm all orphan/depth findings against a complete crawl; complete a matching main performance baseline and external structured-data validators; validate populated job/company/project detail pages and all OG images against real data; complete production host/protocol redirect checks without rate-limit interference (local uppercase/legacy paths verified); review the recorded nonce-mode checks; author new answer-first content and trust pages only after approval. Query noindex changes cover the inspected listing/search surfaces, not an unverified universal policy for every arbitrary parameter on every route. Section capacity above 50k requires numbered shards, not raising the cap blindly. No claim that any crawler will cite the site.

Final nonce QA: previously failing interview/coding detail routes returned **500 before / 200 after** the rendering correction in the same local nonce-enabled configuration. Final 390px browser checks had one H1 and no horizontal overflow. The homepage revision error recovered on retry; production availability still needs logs and monitoring.
