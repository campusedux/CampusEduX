# Deployment preparation — owner executes after approval

No commit, push or deployment is authorized or performed. Local checks are evidence, not deployment approval. Read the latest `09-verification.md` and unresolved items in `00-summary.md` first.

## Owner-accepted availability risk (2026-11-03)

Hosting is **Render**, with standard Next.js hosting and no custom server or proxy. Pages Router migration is explicitly rejected. The universal-503 item is **accepted residual risk**, not a release blocker. Middleware revision failures return **503 + Retry-After: 5 + no-store**; renderer failures after preflight return **500 + no-store**, without Retry-After. They must never be successful empty 200 responses. Prior Home/Learning/Blog fault injection verified 500 rather than empty 200; it is not exhaustive detail-route coverage.

This is acceptable to the owner because both statuses identify a failed fetch and avoid indexing a successful empty page; no-store and publication protections remain intact. Persistent 5xx can still reduce crawling and affect indexing ([Google guidance](https://developers.google.com/crawling/docs/troubleshooting/http-status-codes)). Revisit if revision failures/5xx persist in Render logs, Search Console Crawl stats degrades, or a future approved CDN/proxy can map selected transient 5xx to 503 with Retry-After without weakening CSP, authorization or no-store. No such change is approved now. Empty 200 responses remain a regression, not accepted risk.

Repeat `node scripts/verify-public-html.mjs http://127.0.0.1:3100` against the nonce-enabled production build: 30 sequential requests each for Home, Jobs, Learning and Blog with 500ms spacing. Require zero HTTP-200 documents missing metadata or exactly one H1; verify initial-head title/description/canonical/OG and all script nonces. Report non-200 counts separately rather than treating them as successful content.

## Latest local verification (2026-11-03)

Fresh ordered rerun passed lint, `npx tsc --noEmit`, 183 focused tests, the full suite (1,873 passed / 12 skipped), and `NEXT_PUBLIC_SITE_URL=https://www.campusedux.com NEXT_PUBLIC_ADSENSE_ENABLED=true npm run build` (78/78 static pages). Home, Jobs, Learning and Blog each returned **30 valid 200 / 0 non-200 / 0 invalid 200**, 120 total; initial metadata, exactly one H1 and all script/CSP nonces passed. Local server stopped; `git diff --check` passed. These are local results, not Render deployment or production log verification. Full commands, limitations and historical fault-injection evidence are in `09-verification.md`.

## Release order

1. Review and release `fix/adsense-readiness` first. It is the base of `feat/seo-overhaul` at `9f516ae`; the AdSense branch includes substantial changes relative to main and needs its own review. Do not bundle unrelated worktree files, migrations or local audit output into either release.
2. Smoke-test that release's nonce CSP, AdSlot, advertising consent, ads.txt, privacy/cookie links and authenticated flows. Record the successful Render deploy identifier and commit for rollback.
3. Review the SEO delta against that exact released base. Obtain explicit commit and deployment approval separately. Reconcile any changes to the base and rerun lint, typecheck, tests and nonce-enabled production build.
4. In the Render Dashboard, select the existing website web service and review its Environment settings, linked branch, build/start commands and auto-deploy behavior with the owner. Keep `NEXT_PUBLIC_SITE_URL=https://www.campusedux.com`; preserve the existing Supabase secret references and approved advertising/consent configuration without exporting values. The local `NEXT_PUBLIC_ADSENSE_ENABLED=true` build is a nonce-mode verification setting, not permission to change production advertising. Environment edits can trigger deployment; make none without separate approval ([Render environment settings](https://render.com/docs/configure-environment-variables)).
5. After explicit deployment approval, deploy the reviewed commit through that Render service's manual deployment controls and monitor its build/runtime logs and Deploys status. Use the established service commands; repository scripts are `npm run build` and `npm run start` (`next start`). Verify the existing service binds Render's assigned port without inventing a new service configuration. No migration or new secret is required. Record the Render deploy ID/commit and UTC time, then run the smoke checks ([Render deploys](https://render.com/docs/deploys)).

## Immediate smoke checks

- Fetch home, a real course/lesson/blog/interview/coding detail, jobs/companies/projects, resume and a missing URL. Confirm real HTML, one H1, canonical host, indexation policy and matching nonce on scripts. A streamed 200 with an error shell is a failure.
- Check visible Home-first breadcrumbs against JSON-LD on mobile and desktop. Confirm OG images return 200 with the declared dimensions.
- Fetch sitemap index and each referenced child: canonical, indexable, 200 URLs only. Empty sections stay omitted; backend failure must be retryable rather than a cached empty sitemap.
- Check login/account/payment/search/filters remain noindex; test consent acceptance/rejection, sign-in and protected-content behavior. Do not cache nonce-bearing HTML at the CDN.
- Verify HTTP/non-www/legacy redirects are single-hop where applicable, 404 returns 404, and static assets load without CSP errors.
- In the Render service Logs, search `revision` and `public_content_revision_failed`; inspect 500/503 and 429 responses using HTTP request logs when available or existing monitoring. Correlate route, scope, attempt, duration_ms, sanitized code and UTC timestamps with trusted Supabase logs. Raw SQL, credentials and upstream messages must not be logged. Check retry exhaustion, post-fill failures and request latency; inspect any existing bot/WAF dashboards ([Render logs](https://render.com/docs/logging)). Verify genuine Googlebot by published IP ranges or forward/reverse DNS, never by user-agent alone. Preserve API abuse controls.

## Search Console / Bing

- Keep **Search Console → Settings → Crawl stats** monitoring before and after deploy: server-error response counts, host availability and average response time. Correlate any 5xx increase with Render deploy times and revision logs; investigate sustained errors despite the accepted status-code risk ([Crawl stats report](https://support.google.com/webmasters/answer/9679690?hl=en)).

- Owner verifies domain ownership, submits `https://www.campusedux.com/sitemap.xml`, and reviews coverage, manual actions, security issues, CWV and applicable enhancement reports.
- Inspect ten real URLs: home, learning hub, course, lesson, blog post, interview detail, coding detail, jobs hub, company detail and resume. Select actual canonical records from the deployed sitemap; do not submit placeholder job/project IDs or request indexing for noindex pages.
- Verify Bing Webmaster Tools ownership, import/submit the sitemap, inspect crawl/indexing diagnostics. IndexNow is deferred until a real verification key and publication-trigger design are approved.
- Record baseline exports by cluster: **needs GSC data** and analytics access. Local Lighthouse is not field CWV and does not establish traffic improvements.

## Rollback via Render

Record the known-good AdSense Render deploy before the SEO release. If availability, indexing, consent or CSP regresses, the owner uses the service's **Deploys → successful deploy → Rollback** controls after required approval, then verifies the same smoke URLs and sitemap. Confirm the target artifact is retained and review applicable environment/group settings. Dashboard rollback disables auto-deploys; review them before any later approved release. No database reversal is required for this SEO-only change ([Render rollback behavior](https://render.com/docs/rollbacks)).

Preserve existing URLs, authentication, CSP and consent. Record incident UTC time, routes, status codes and Render deploy IDs; investigate backend errors instead of masking them with stale content. The accepted 500/no-store response alone is not a rollback trigger; sustained outages, empty 200s, publication leaks or nonce/consent regressions are. No deployment or rollback was performed by this task.
