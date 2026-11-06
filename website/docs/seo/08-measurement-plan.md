# Measurement and owner setup

## Baseline
All search/traffic baselines below are **needs GSC data** or **needs analytics access**. Public crawl counts and response times do not establish indexed pages, rankings or traffic. No GSC, GA4 or Bing account was accessed.

| KPI | Source / segmentation | Baseline |
|---|---|---|
| Impressions, clicks, CTR, average position | GSC; India; mobile/desktop; branded vs nonbranded; canonical cluster | needs GSC data |
| Indexed pages / exclusion reasons | GSC indexing, sitemap and URL inspection | needs GSC data |
| CWV pass rate | GSC/CrUX field data; mobile and desktop | needs GSC data |
| Organic sessions and engaged sessions | GA4 organic search by landing-page cluster | needs analytics access |
| Signups, enrolments, project requests | Verified completion events, consent-aware, no private payloads | needs analytics access and event audit |
| AI referral sessions / conversions | GA4 session source custom group | needs analytics access |

Export the latest complete 28 days and previous 28 days, with year-over-year context if available. Retain the export date, timezone, filters and deployment annotations. Segment `/learning/`, `/practice/`, `/blog/`, `/jobs/`, `/projects/`, `/resume/`; do not average URL-level average positions without impression weighting. Compare like-for-like pages and seasonality. Do not promise specific targets before seeing the baseline.

## Setup checklist
- Verify the canonical domain property in GSC (DNS ownership may already exist; no src verification tag was found). Keep credentials out of reports and source.
- Submit `https://www.campusedux.com/sitemap.xml`; verify children, canonical URL samples and genuine lastmod values. Retry transient sitemap failures; do not submit noindex/filter URLs.
- Inspect home, one real course/lesson/blog/interview/problem/tool and populated job/project pages. Compare rendered HTML, selected canonical and crawl status.
- Review indexing exclusions, Crawl Stats, CWV, applicable enhancements, manual actions and security issues. FAQ rich-result reporting is no longer an optimization target.
- Verify Bing Webmaster ownership and submit the same sitemap. IndexNow is deferred: it requires a real verification key and an approved publication-trigger integration. No fake key or unauthenticated submission endpoint was added. Follow [IndexNow documentation](https://www.indexnow.org/documentation).
- GA4 code has one consent-aware loader. Confirm the actual property receives one page_view per navigation after consent and none before consent or on excluded private/token routes. Do not add GTM alongside it without an explicit measurement design.
- Create an “AI referrals” custom channel group/segment using session source matching `(^|\.)(chatgpt\.com|chat\.openai\.com|perplexity\.ai|gemini\.google\.com|copilot\.microsoft\.com)$`; validate actual source values first. Keep a comparison exploration rather than rewriting the default channel group.
- Referrals are incomplete: apps may omit referrers and AI Overviews clicks may be Google organic. Do not infer citation counts from referral sessions. Track a small labelled manual citation sample separately.
- Define conversion events only at confirmed success boundaries. The current privacy rules exclude account URLs; do not circumvent those rules to measure enrolments. A separate approved consent-aware event design may be needed.

## Monthly routine
Check sitemap errors, accidental noindex/canonical changes, expired jobs, 404/5xx and crawl latency; review India/mobile query-to-page overlap; inspect high-impression low-CTR pages; validate examples and version changes; review source and author dates; update genuine internal links; compare conversion quality and AI referrals; record actions and next month's priorities. Review crawler policy whenever vendor controls change. Use actual Search Console exports before content consolidation.
