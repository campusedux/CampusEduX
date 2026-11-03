# Request rendering, caching and crawler access

## Seven request-rendered route families

`/practice/interview-questions/[category]`, `/practice/interview-questions/[category]/[topic]`, `/practice/problems/[slug]`, `/coding-problems/[problemSlug]`, `/projects/[id]`, `/projects/category/[category]`, `/jobs/[id]` retain request-rendered HTML. Cache headers and measured sample response times are recorded in `09-final-raw-html.csv`; missing real job/project records cannot establish populated-route latency.

Nonce-bearing HTML must not be shared through an HTML/CDN cache: each response needs a fresh nonce matching its CSP. [Next.js CSP guidance](https://nextjs.org/docs/app/guides/content-security-policy) requires dynamic rendering for nonces. Do not add `s-maxage` to these responses or force-static rendering to hide backend errors.

Safe public data caches already exist: project/category/job reads in `src/lib/cache.ts` generally use five-minute revalidation (catalog lists use two minutes), while learning/practice/interview use the public revision/tag-aware read layer and hourly content TTLs. Preserve revision checks, publication filtering, premium gating and tag invalidation. These are separate from HTML caching; public metadata caching must not cache session-specific results. No additional HTML cache was added. Trade-off: request rendering and revision checks cost origin work even for cached content; production logs must quantify that cost. Comments describing older ISR-plus-data TTLs do not establish an effective HTML cache in nonce mode.

## Rate limiting

The inspected nonce middleware does not rate-limit public page GETs. `rateLimitDb` callers are action/API paths such as compiler/judge/submit, resume export/parse/assist and custom-project understanding. Those controls must remain enforced, including for a spoofed Googlebot user-agent. Sitemap backend failures intentionally return retryable 503, distinct from bot blocking. Public content/backend failures can still affect rendering independently of rate limits.

The sequential localhost crawl recorded no 429 responses. This does not verify production WAF/CDN policy. The owner must inspect host bot protection, edge quotas, per-IP limits, upstream timeouts and logs of verified Googlebot requests. Use [Google's published IP lists or forward/reverse DNS verification](https://developers.google.com/crawling/docs/crawlers-fetchers/verify-google-requests), not a user-agent bypass. Configure the host to allow verified public crawlers without relaxing private/API authorization. No host configuration was changed.

The owner confirmed preserving training access while allowing public search/citation crawlers and retaining private/auth/API exclusions. See `10-crawler-policy.md`.
