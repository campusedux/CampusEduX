# Technical audit — 2026-11-03

## Evidence and limits
Base: `fix/adsense-readiness`, commit `9f516ae`; working branch `feat/seo-overhaul`. Scope: website only; no database, authentication, payment or deployment changes. Public crawl is recorded separately in `01-page-inventory.csv` and `01-sitemaps.csv`. Route patterns, API handlers, layouts and metadata files are in `01-route-files.csv`; patterns are not real URLs. Credentials and environment files were not inspected. Rankings, traffic, indexed-page counts and field CWV: **needs GSC data**. No keyword-volume dataset is available.

The initial sitemap discovery returned 1,305 URLs. The crawl uses four workers, an 18-second per-request timeout, no login and no credentials. A timeout is an observation from this environment, not proof that a URL is permanently broken. Approximate word counts include navigation/footer and streamed HTML; low counts and heading warnings require editorial review. Inbound counts cover the discovered public graph, not the whole web. A route requiring a private record cannot be enumerated through public crawling.

## Source findings and implementation plan
1. **Filter indexation:** jobs/projects/blog/practice attach a base canonical but noindex only empty results. Populated search/facet variants can enter the index. Use explicit noindex/follow for variants. Preserve distinct pagination canonicals; noindex query variants per the requested policy.
2. **Learning search:** `/learning?q=...` inherits static indexable metadata. Make metadata depend on the query and genuine catalog emptiness.
3. **Sitemap availability:** `src/lib/sitemap/data.ts` throws on query errors, preserving successful data-cache entries, but every route is force-static and can fail prerender. Move sitemap HTTP generation to request time, retain hourly data caches, bound complete loads and return retryable 503 on cold failure rather than a false empty 200. No invented lastmod or truncated success.
4. **Empty hubs:** learning/interview section builders always include a hub on empty input. Align with empty-state noindex. Existing jobs/projects/blog exclusions are already implemented.
5. **Metadata consistency:** existing seo.ts, seoTitles.ts and metaDescription.ts must remain authoritative. Add a shared metadata completion helper for OG locale, Twitter and missing social fields, preserving custom canonicals, article dates and existing dynamic images. Static metadata exports remain valid App Router APIs; unnecessary async conversion adds no SEO value.
6. **Regional language:** root HTML uses `en`; many OG objects omit locale. Use `en-IN` / `en_IN`. Do not create hreflang without translated equivalents.
7. **Social images:** course, lesson, coding and blog image routes already exist. Interview/job details still use generic cards. Extend the established 1200×630 renderer with existing data loaders.
8. **404:** an existing notFound component and dynamic notFound calls exist. Add useful search/hub links. Streaming may already have sent 200 before a late notFound; verify actual HTTP status, not only the displayed message.
9. **Robots:** wildcard allows public pages, disallows account/auth/API/token/workflow paths, and references the sitemap index. Assets are not blocked. Keep owner-approved private/auth/API restrictions. Login/register are crawlable and carry noindex. A blocked URL's meta noindex cannot be read; authentication, not robots, protects private records.
10. **SSR:** content routes are server components; small interactive children and the JsonLd client component are still server-rendered by React. `use client` alone does not prove missing HTML. Public lessons preserve premium-body restrictions. Crawl extraction distinguishes raw HTML from hydrated browser checks.
11. **Performance:** existing AVIF/WebP, image optimizer cache, system font stacks, compiler loading boundaries, consent-delayed GA and click-triggered Razorpay are retained. System fonts need no next/font request. Do not add libraries merely to use next/font. Dynamic content reads deliberately check publication revisions; extending stale HTML lifetime can leak unpublished/protected content.
12. **Trust/security:** live sitemap returned HTTPS 200 with HSTS (63072000 seconds, includeSubDomains), nosniff and CSP. The observed live policy used static CSP, not nonce mode; this does not verify the local AdSense nonce mode. Preserve middleware, script provider, JsonLd escaping and consent controls.
13. **Analytics:** one centralized GA loader exists in `lib/analytics.ts`; the root mounts GoogleAnalytics once. No GTM container or GSC verification string was found in src. DNS verification may exist externally: **needs GSC data**. Avoid adding another tracking loader.
14. **Content:** related lessons, previous/next interview topics, related blogs, visible Q&A, TOCs and author/date fields already exist. Improve authored content via review, not automatic rewrites of database content. No real author credentials or BAMS reviewer have been confirmed.
15. **Sitemap capacity:** seven sections already split the current corpus below 50,000 URLs per file. Add explicit capacity failure rather than silently truncate at read cap. If a section grows beyond the cap, implement numbered shards before publishing that volume. Image sitemaps are optional; current images are discoverable via HTML, with no evidence of an image-discovery deficit.

## Compatibility and rollback
All existing routes, query behavior, data contracts and access gates stay intact. New metadata changes search directives only. Revert the SEO diff to roll back; no database rollback is required. Sitemap failure responses should be monitored after deployment by the owner; a 503 asks crawlers to retry and avoids claiming the catalog vanished. No performance gain or ranking improvement is asserted without measurement.

## Verification checklist
Check mobile width 390px, tap targets and heading hierarchy; raw HTML title/description/canonical/robots/OG/Twitter/JSON-LD; real 404 and redirect hops; sitemap status/content and query exclusion; allowed/denied consent states and nonce equality. Lighthouse is not installed in this checkout or PATH and no dependencies will be installed without approval. Browser geometry and HTTP latency are not substitutes for Lighthouse or field CWV. Run existing lint, TypeScript, tests and build, recording actual output in `09-verification.md`.

## Current documentation
- [Google AI features](https://developers.google.com/search/docs/appearance/ai-features): foundational indexing and helpful content apply; special AI markup is not required.
- [Google generative AI guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide): do not promise citation or ranking gains from llms.txt.
- [Sitemap requirements](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap): canonical URLs, truthful modification dates and file limits.
- [Pagination](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading): distinct paginated pages have their own canonical; avoid canonicalizing every page to page 1.
- [Robots](https://developers.google.com/search/docs/crawling-indexing/robots/intro): crawl restrictions are not access control or guaranteed deindexing.
- [JobPosting](https://developers.google.com/search/docs/appearance/structured-data/job-posting): real current jobs only, with required fields and expiration handling.
- [Search documentation updates](https://developers.google.com/search/updates): the old FAQ documentation redirected here during research; do not assume FAQ rich-result eligibility from historical advice.

## Completed crawl observations

1,625 URL spellings were attempted (including both bare and slash home); 534 returned HTTP 200 HTML. Other observations: 1,044 HTTP 429; 28 HTTP 502; 5 HTTP 503; 3 HTTP 500; 11 transport/timeouts. These are audit observations, not proven persistent origin defects. The crawler did not back off adaptively after 429; it has stopped. Do not repeat this rate: follow-up must be serial with delay and stop/backoff on Retry-After. No further bulk live requests are planned. **1,091 response bodies remain unverified.**

All 534 successful HTML observations lacked `og:locale=en_IN`. 78 had heading-level jumps including site chrome; 7 lacked a canonical, including noindex utilities. The inventory labels duplicate metadata, incomplete-graph depth and missing-response uncertainty. Do not equate graph gaps with confirmed orphans. API/private records were not enumerated. A complete human content-quality review and external schema validation remain outstanding.

The five nonempty live child sitemaps contained 20 static, 653 learning, 580 problem, 49 interview and 3 blog URLs (1,305 total). All six XML requests, including the index, returned 200. Jobs/projects sections were absent from the index at observation time.

Measured successful-page HTTP fetch time: median 2.72 seconds; p95 15.26 seconds. This is end-to-end fetch latency from this audit host, not LCP, TTFB, Lighthouse or field CWV.

## Nonce-mode regression found during final QA

With `NEXT_PUBLIC_ADSENSE_ENABLED=true`, category/topic interview and coding detail requests returned HTTP 500 with `DYNAMIC_SERVER_USAGE`. These routes used empty `generateStaticParams` + static HTML caching while the root layout reads a request nonce. Seven affected detail route families now declare `dynamic = "force-dynamic"`: interview category/topic, practice problem, coding problem, project detail/category and job detail. Existing data loaders/caches and CSP policy remain unchanged. The trade-off is per-request HTML rendering even when ads are disabled; measure server load after any owner-approved deployment. Do not re-enable static HTML caching on nonce-bearing documents without a different nonce architecture.
