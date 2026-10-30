# CampusEduX indexing audit — October 24, 2026

## Outcome and evidence limits

Repository defects were fixed locally. Nothing was deployed, pushed, applied to a production database, or changed in Search Console/hosting. Existing unrelated working-tree changes were preserved. No legitimate website noindex rule or access restriction was removed; no filler content was generated.

The supplied Search Console evidence is dated October 24, 2026; the original report generation date is unverified. The reported categories are **44 noindex, 20 duplicate without user-selected canonical, 3 redirects, 1 other 4xx, 1 robots block, 556 discovered/not indexed, and 0 crawled/not indexed**. These are user-supplied counts, not counts independently retrieved in this audit. They cannot be reconciled URL by URL without the exports.

Live public HTTP verification was attempted using curl (including outside the sandbox) and the web tool. The shell could not resolve either public hostname. The web tool could not retrieve robots.txt and rejected the sitemap's XML content type. These are audit-environment limitations, **not evidence that production is down**. Earlier repository production reports are historical and do not establish today's deployment state.

Source scope: all **81 website page route patterns**, **4 layouts**, **27 route handlers** inventoried; metadata/robots/canonical branches inspected across the page inventory. Detailed inspection covered sitemap loaders/builders, middleware, redirects, legal metadata, the main public dynamic route families, discovery components, JSON-LD helpers, relevant database RPC/RLS definitions, staff-portal indexing, and the nine supplied coding-problem seeds. This is not an exhaustive editorial review of every live database row. Mobile/native screens have no Google web indexing surface; their SQL migrations matter because the website shares that backend. The mobile legal-site HTML is an additional hosted surface whose current host/indexing was not verified.

Supporting artifacts:

- [Complete website route inventory](seo-route-inventory-2026-10-24.md)
- [Actual local HTTP response evidence](seo-local-http-evidence-2026-10-24.json)

## Search Console classification

| Category | Intentional cases in this repository | Defect conclusion / outstanding evidence |
|---|---|---|
| 44 excluded by noindex | Account pages; auth, onboarding, verification and reset flows; private resume shares; mock tests/results; submissions; custom-project workflow; internal search; missing, empty, unavailable or known thin content | Many expected exclusions exist. The 44 exact URLs were not supplied, so their individual correctness is unresolved. Do not remove these directives globally. |
| 20 duplicates without selected canonical | Query/facet variants can legitimately consolidate to the hub; published blog posts may specify an editorial canonical elsewhere | Distinct pagination pages incorrectly canonicalized to page 1: fixed. Canonical-origin configuration could drift: normalized. Neither is proven to explain these particular 20 URLs without their inspection data. |
| 3 pages with redirects | Placement consolidation, retired marketplace/compiler routes and approved duplicate merges | Normal if old URLs redirect permanently to the intended final page and are absent from sitemaps. Exact reported URLs unknown; no new content redirects invented. Core internal links through known merges corrected. |
| 1 other 4xx | Invalid/missing resources may return 404 intentionally; private APIs may reject unauthorized requests | Supplied report records an HTTP-apex robots fetch failure on October 5. This does not prove it is the same reported URL, nor reveal whether the cause was WAF/CDN/host configuration. Local unknown route correctly returns 404. |
| 1 robots block | Private paths are intentionally disallowed | Exact affected URL unknown. Current source has no disallow prefix blocking the supplied public samples, /resume, /referral, or /refund-policy. No private crawl rule relaxed. |
| 556 discovered, not indexed | Discovery is not a guarantee of indexing; this bucket can include queued, stale or lower-value URLs | Nine supplied problems and /about investigated below. A fetchable/indexable live test does not mean indexed. Full membership, actual sitemap attribution, bot access and crawl logs remain required. No blanket index directive added. |

Robots disallow and noindex are different controls: a blocked crawler cannot read a page's noindex. This overlap on private routes is retained because the task requires preserving crawl/access intent; removing sensitive URLs already appearing in search would require a deliberate owner decision. Google documents this distinction in [its noindex guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing).

## Verified code fixes

### 1. Distinct pagination pages canonicalized to page 1

Before: `/projects?page=2`, `/jobs?page=2`, `/blog?page=2`, and `/practice/problems?page=2` declared their respective unpaginated hub canonical even though they list different rows.

After: default unfiltered page 2+ declares its own normalized `?page=N` canonical; page 1 and tracking-only variants consolidate to the hub. Open Graph URL follows the canonical where present. Existing facet/search/sort consolidation is preserved. Empty blog/practice results now carry noindex; out-of-range project/job pages also carry noindex instead of inheriting the first page's nonempty count. Existing noindex directives remain intact. Blog page parsing now uses the same integer parsing helper for metadata and rendering.

Files: `website/src/lib/seo.ts`, `website/src/app/{projects,jobs,blog}/page.tsx`, `website/src/app/practice/problems/page.tsx`.

This implements Google's [pagination guidance](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading): distinct pagination pages should not all declare page 1 canonical. It does not expand the sitemap to every query/facet URL.

### 2. Canonical origin could diverge across configuration and layout

Before: raw `NEXT_PUBLIC_SITE_URL` fed SEO helpers and an independently defined layout base. An empty string breaks metadataBase; an apex/http alias generates inconsistent canonical/sitemap origins compared with the brand's www URL.

After: one normalized `SITE_URL` feeds helpers, layout metadataBase and organization metadata. Blank configuration falls back to the brand; known CampusEduX apex/www aliases normalize to `https://www.campusedux.com`. Explicit local/preview origins remain usable. Production must still have the correct build-time variable; arbitrary preview/local hosts are not silently rewritten to production.

**This is not an HTTP host redirect.** There is no apex→www host redirect in repository configuration. Hosting might already provide it; that behavior could not be measured. Do not add competing host redirects until the existing edge configuration is checked.

Files: `website/src/lib/seo.ts`, `website/src/app/layout.tsx`.

### 3. Premium lesson teasers incorrectly omitted from learning sitemap

Before: `loadTopicsWithContent` required an anonymous `learning_contents` row for every lesson. Existing RLS deliberately hides premium bodies, while the public page intentionally renders a locked teaser without noindex. The sitemap therefore misclassified those teasers as empty lessons.

After: the eligibility set includes publicly visible topics marked premium as well as topics with anonymous content blocks. The `learning_sitemap(p_platform: 'website')` RPC remains the publication/platform/targeting authority; a topic absent from it cannot be added by this change. Empty free lessons remain excluded. No premium body, security policy, authentication check or page indexing directive changed.

File: `website/src/lib/sitemap/data.ts`. Regression fixtures cover a premium teaser with no readable body, a populated free lesson, an empty free lesson, a mobile-only topic, and lookup failure. Premium teaser quality remains an editorial review item; this fix restores consistency with the existing explicit page policy rather than declaring all paid content high quality.

### 4. Coding sitemap RPC could advertise section-hidden/archived URLs

Confirmed source mismatch: the current `coding_problem_detail` definition in migration 0120 checks the attached section's publication and platform flags. `coding_problems_sitemap` from migration 0048 joins topic/grid only and omits these section checks. Consequently a problem can be listed while its public detail RPC returns null/404.

Prepared migrations add those same section checks, retain all existing problem/topic/grid publication and academic-targeting checks, and preserve the RPC signature, returned columns, security-definer search path and grants. No content access is widened. A NULL platform now follows the detail RPC's existing website behavior.

- `mobile-app/supabase/migrations/0149_seo_coding_sitemap_visibility.sql`
- `admin-panel/supabase/migrations/119_seo_coding_sitemap_visibility.sql`

The files are identical alternative migration histories for the shared backend; apply through the project's authoritative migration workflow, **once per database**, after approval. They have not been applied remotely.

An actual isolated PostgreSQL 17 regression test verifies website/mobile membership, sectionless topics, hidden/draft/missing sections, draft topics/problems, problem-level platform flags, global-practice separation, targeting, NULL platform, and anon execution. Test setup uses synthetic tables and a targeting stub; production schema compatibility must additionally be checked in a migration preview.

Run: `bash website/scripts/test-seo-sitemap-sql.sh`. Set `SEO_PG_BIN` if PostgreSQL binaries are installed elsewhere. The script creates/removes a disposable cluster under /tmp, disables TCP, and does not use production connection variables.

### 5. Internal links still traversed approved content merges

Sitemaps already omitted seven approved redirect sources and related-lesson ranking excluded merged lessons, but curriculum/sidebar lesson links, lesson prev/next links, topic problem links and related/adjacent problem links could still point through those redirects.

Added `canonicalContentPath` backed by the existing approved redirect map; those navigation surfaces now link directly to the same destination. Other paths and global practice links retain their original targets. No new merge or redirect was introduced. Arbitrary links inside authored Markdown or database HTML were not rewritten; these require a content export to audit comprehensively.

Files: `website/src/lib/contentRedirects.ts` and the five navigation components/pages referenced by the patch. Regression coverage verifies every approved mapping and unchanged unrelated paths.

### 6. JobPosting salaries emitted the wrong unit

`salary_min_lpa` and `salary_max_lpa` were serialized as annual INR amounts without conversion. A stored 6–12 LPA range therefore advertised ₹6–₹12/year. The JSON-LD now emits ₹600,000–₹1,200,000/year. UI salary values are untouched. Test inspects the actual JobPosting block from the page component.

File: `website/src/app/jobs/[id]/page.tsx`.

### 7. Staff portal lacked sitewide indexing exclusion

The admin root layout had no robots metadata, and its global response headers had no X-Robots-Tag. Protected content still requires existing authorization, but the login/staff shell had no explicit indexing exclusion.

Added `noindex, nofollow` in root metadata and the global HTTP header. Authorization, middleware, security headers and business behavior remain intact. This is preventative staff-site hygiene; its contribution to the supplied public-site report is unknown.

Files: `admin-panel/src/app/layout.tsx`, `admin-panel/next.config.mjs`. Runtime config test verifies the global indexing header and preserved frame protection.

## The 556 discovered URLs: representative investigation

The supplied ten URLs are samples, not the entire set. `/about` is in the static sitemap, is linked by the footer, and has a dedicated canonical, description and substantive visible page in source. Its local built response is 200 with one H1 and a self canonical. No source-level indexing prohibition was found.

All nine supplied problem slugs exist in paired seed histories. Their statements are task-specific and include real examples and starter code; Java/Python samples also have constraints, while SQL samples include concrete schemas/data. These do not satisfy the existing all-fields-empty thin-problem rule. They are candidates for normal discovery **if the deployed anonymous RPC returns those published, website-visible rows**; seeds alone do not prove current production rows or applied migrations.

| Problem slug | Source evidence | Quality/discovery conclusion |
|---|---|---|
| `java-variables-swap-values` | `0070_seed_java_practice_introduction_to_java.sql:1226` | Temporary-variable swap task, formatted output, example, constraints and Java starter code. User inspection says unknown to Google, no sitemap/referrer and no last crawl; prioritize deployed sitemap membership and lesson links. |
| `java-constants-price-with-tax` | Same migration, line 1705 | Defined tax constant, rounding/output requirements, example, constraints and starter code. |
| `java-logical-operators-leap-year` | `0071_seed_java_practice_operators_and_input.sql:1046` | Specific leap-year rules and century cases, examples, constraints and starter code. |
| `java-user-input-name-age` | Same migration, line 1917 | Multiline input/name-with-spaces task, sample, bounds and Java starter code. |
| `py-loops-sum-of-digits` | `0050_seed_python_tutorial_content.sql:4296` | Signed-input digit loop, concrete output, example, bounds and starter code. |
| `py-strings-palindrome-checker` | Same migration, line 4551 | Explicit case-insensitive comparison/output rules, examples, bound and starter code. |
| `py-regular-expressions-email-extractor` | `0052_seed_python_tutorial_advanced.sql:3119` | Regex extraction task with sample input/output, bound and Python starter code. |
| `create-a-high-earners-view` | `0098_seed_dbms_sql_tutorial_ch18_ch19_ch20.sql:3980` | Named SQL view, columns, salary threshold, schema/seed, example and checker. Supplied live test: available/indexable and one valid Breadcrumb item, not proof of indexing. |
| `duplicate-emails` | `0093_seed_dbms_sql_tutorial_ch3_ch4_ch5.sql:4146` | Grouped duplicate-email query with requested count/order, schema, sample data and examples. |

The source discovery chain is:

1. Site navigation/footer → `/learning` → course overview.
2. Course curriculum/sidebar → lesson, using real Link anchors present in initial HTML (client components are server-rendered).
3. Lesson's server component `TopicPractice` → `/coding-problems/<slug>`.
4. Related/previous/next problem links offer additional paths.
5. `/sitemap.xml` → `/sitemaps/problems.xml` → eligible problem URL, derived from anonymous `coding_problems_sitemap('website')`, thin-row filtering and redirect-source exclusion.

The problem statement is rendered by `ProblemPanel` as server content; the compiler is a separate client surface. Tab panels stay mounted in initial HTML. Therefore the route is not inherently an empty JavaScript-only compiler page. No evidence supports adding filler or forcing these URLs to index.

For `java-variables-swap-values`, check that exact URL in the **deployed** problems sitemap, then inspect its parent lesson's raw HTML for the exact href. If absent, compare the deployed RPC row and content/platform flags with seed intent, verify migrations and cache state, and repair only a confirmed discrepancy. If present and bot-fetchable, inspect GSC's last sitemap read, Googlebot request logs, property/host matching, crawl scheduling and content differentiation. The supplied screenshot cannot distinguish those causes.

## Routing, sitemap and content controls retained

- Root layout does not supply a homepage canonical to every child. Homepage supplies its own canonical; missing-route metadata clears canonical and has noindex.
- Public metadata uses a shared URL origin or shared legal metadata. Auth/account/workflow routes intentionally need no public canonical. Blog editorial canonical overrides remain intact; externally canonicalized posts remain out of the sitemap.
- Seven child sitemaps: static, learning, problems, interview questions, jobs, projects, blog. All use ISR/revalidate 3600 and tag-based invalidation. XML is escaped and entries deduplicated; approved content redirect sources are filtered at serialization.
- Loaders page past PostgREST response caps. Sitemap failures throw instead of intentionally caching truncated results. The 50,000-row safety bound and single-file sitemap size limits are future scale constraints, not a demonstrated cause of today's 556 URLs.
- Real row modification dates drive lastmod; static pages omit fabricated request/build timestamps. No priority/changefreq tricks were added.
- Jobs sitemap includes active/unexpired jobs and hiring companies; empty categories, missing FAQ/plans and empty interview topics have existing data-aware handling. Public legal pages remain in the static sitemap, consistent with their explicit indexable policy.
- Robots disallows private/utility prefixes; the historical broad `/r` issue is already corrected to `/r/` in current source. Its outdated referral-redirect comment was corrected: this is now a private resume-share route.
- Public GET/HEAD content paths and XML/robots endpoints bypass session refresh in middleware. State-changing requests retain existing session processing; authorization remains in its original layers.
- Known repetitive Generative AI markers and empty free coding-problem exclusions remain. Existing historical comments/counts about seeded template populations are not substituted for today's GSC counts.
- Structured data reviewed: Organization/WebSite, BreadcrumbList, Course, lesson TechArticle/visible FAQs, BlogPosting, Product offers/real ratings, JobPosting and compiler schema. JSON-LD escaping remains covered. Missing remote-job applicant countries/structured location data are a data-quality limitation; none were invented. Source review and tests do not substitute for Google's deployed Rich Results test.
- Filtered listing variants retain the established hub canonical. This does not establish that every facet is an ideal canonical match: index-worthy categories should be curated using real content and demand, rather than creating crawlable combinations automatically. Existing category landing pages remain available.

## Verification results

| Check | Result |
|---|---|
| Website production build after final website code edits | Passed (`npm run build`) |
| Website TypeScript and strict lint | Passed |
| Targeted SEO/security regression run | **99 passed**, 7 files |
| Full website suite | **911 passed, 4 failed, 12 skipped**, 85 files |
| Admin full suite | **240 passed**, 22 files |
| Admin TypeScript and strict lint | Passed |
| Isolated PostgreSQL migration regression | Passed; cluster stopped and removed |
| Local HTTP smoke checks | Status/redirect/metadata behaviors verified below; backend revalidation errors limit content assertions |
| `git diff --check` | Passed at verification time |
| Production HTTP/GSC reconciliation | Blocked by network/tool access and missing full URL exports |

Baseline website run before changes had **888 passed, 8 failed, 12 skipped**. Four sitemap failures were stale fixtures: legal pages had intentionally become indexable; learning fixtures omitted topic/content relationships required by the loader; interview fixtures did not model JSON detail responses. Fixtures were corrected without removing production quality gates. Those four tests now pass.

The **four remaining full-suite failures were present in the baseline**:

- `tests/app/seo-phase4b-fixes.test.ts`: expects the old About title string; current pre-existing copy uses an absolute title object.
- `tests/lib/perf-cache.test.ts` (two cases): expects invalid mixed tag batches to be partially accepted; current endpoint rejects the request with 400.
- `tests/lib/learning-progress-route.test.ts`: expects an empty list for an RPC error; current endpoint returns an explicit unavailable error.

These runtime/security behaviors were not weakened to satisfy stale tests. Twelve resume E2E tests are already skipped. The full website suite remains a release-gate issue until those assertions are reconciled with intended behavior.

Local HTTP evidence: homepage and About 200 with one H1 and self canonical; robots and static XML 200; `/placement` and `/placement/notes` 308→`/learning`; `/practice/compiler` 308→`/compiler`; approved garbage-collector merge 301→garbage-collection; unknown route 404/noindex/no canonical. Paginated listing HTML carries its own `?page=2` canonical and retains applicable empty-result noindex. The local environment deliberately builds with `http://localhost:3000` as metadata origin; that is not evidence of a production localhost canonical. JSON evidence records the actual values. The local server logged failed Learning and Projects backend/cache revalidation during the smoke run, so a 200 status is not treated as proof that every dynamic body loaded successfully. These local failures are not attributed to production. Dynamic production content and all 556 HTTP responses were not verified.

## Deployment requirements and remaining blockers

1. Review this patch alongside existing unrelated work. No commit was created; do not accidentally deploy all pre-existing changes as part of SEO work. Resolve the four baseline website test assertions before requiring a completely green full-suite release gate.
2. After approval, apply the paired sitemap migration through one authoritative backend migration history in a preview first, then production. Confirm the live schema/RPC compatibility and anon/platform results. Website/admin builds are separate deployable surfaces; admin indexing headers require an admin deployment.
3. Build production with `NEXT_PUBLIC_SITE_URL=https://www.campusedux.com`. Check the rendered canonical, metadataBase, JSON-LD and all sitemap locs; these values can be captured at build time. Keep previews protected/noindexed under the existing hosting policy.
4. Verify hosting serves one preferred HTTPS www origin. Test HTTP/HTTPS apex and www with representative paths and query strings, status, Location and final canonical. Confirm TLS/DNS/CDN/WAF behavior, including HTTP-apex `/robots.txt` from the October 5 report. Preserve method/query semantics and avoid loops. This infrastructure behavior is unverified; no production hosting change was made.
5. After approved deployment/migration, let the existing sitemap ISR refresh or use the existing authenticated revalidation mechanism for `learning:sitemap`. Do not expose or weaken its secret/allowlist. Check `/sitemap.xml` and each child for 200, correct XML/host, no blocked/noindex/redirect/404 URLs, and each of the nine supplied problem URLs where eligible. Avoid interpreting stale caches as the new build.
6. Obtain the full GSC URL exports for all categories, property type/host, last sitemap-read details, and inspection results for representative URLs. Join those URLs to the live sitemap inventory and classify the actual 44/20/3/1/1 individually. Use verified Googlebot/CDN logs to diagnose no crawl/4xx, not counts alone.
7. Recheck raw HTML internal links and anonymous content on the supplied samples, preserve their task-specific content and quality gates, and review repetitive clusters with subject expertise before publishing improvements. Private/premium bodies, hidden tests, solutions and targeting must remain protected. Do not bulk-index or mass-generate content for the 556 URLs.
8. Submit/verify the canonical sitemap and request inspection only for selected corrected substantive URLs after approval. Allow subsequent crawling/report refresh to measure results. Neither sitemap submission nor a successful live test guarantees indexing; see Google's [crawl troubleshooting](https://developers.google.com/search/docs/crawling-indexing/troubleshoot-crawling-errors) and [canonical signal guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).

No production change or Search Console submission is authorized by this audit alone.
