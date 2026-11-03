# AI crawler decision — 2026-11-03

The owner explicitly selected: preserve current training access; keep search/citation crawlers allowed and private/auth/API paths disallowed. The wildcard policy in `src/app/robots.ts` already implements this for robots-respecting crawlers. Keep one shared rule group so crawler-specific groups cannot accidentally omit the private-path exclusions.

| Crawler/control | Decision | Purpose / limitation |
|---|---|---|
| OAI-SearchBot | Public allowed | Search discovery; separate from GPTBot |
| ChatGPT-User | Public allowed | User-directed fetches; robots compliance differs from automated crawling |
| PerplexityBot / Perplexity-User | Public allowed | Search and user-requested retrieval |
| Claude-SearchBot / Claude-User | Public allowed | Search and user retrieval; verify current vendor behavior when changing rules |
| GPTBot / ClaudeBot | Preserve public access | Training access remains permitted under current policy |
| Googlebot | Public allowed | Google Search discovery, including eligible AI experiences |
| Google-Extended | Preserve public access | Product-use control distinct from Googlebot search crawling |
| Applebot / Applebot-Extended | Preserve public access | Search discovery / extended-use controls |
| CCBot | Preserve public access | Common Crawl collection |

Trade-off: blocking training reduces some model-training reuse but does not itself improve search citations; search and training controls should be managed separately. Allowing crawlers does not guarantee indexing, citations, traffic or vendor compliance. Authentication and authorization continue to protect private data.

This decision can be changed anytime in `src/app/robots.ts` (served as `/robots.txt`). If adding agent-specific groups, repeat private/auth/API exclusions because specific groups do not necessarily inherit wildcard rules. Test public and protected paths after each change.

`/llms.txt` is an emerging optional convention, not a confirmed ranking factor or substitute for crawlable content and sitemaps. Do not include private or premium bodies. No llms-full dump is proposed.

Sources: [OpenAI crawler controls](https://developers.openai.com/api/docs/bots), [Perplexity crawlers](https://docs.perplexity.ai/docs/resources/perplexity-crawlers), [Google robots guidance](https://developers.google.com/search/docs/crawling-indexing/robots/intro).
