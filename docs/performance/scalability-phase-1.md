# Scalability Phase 1 checkpoint

2026-11-01 · **Status: partial.** Implemented and verified query/payload reductions and fresh public-content reads. Overall scalability improvement remains unproven: safe shared caching is blocked by best-effort invalidation, and removing stale caches increases work on warm requests. No 50,000-concurrent-user capacity claim. Phase 2 has not started.

## Revision and changed files

HEAD: `f717534d817fb5a6484fa58407d220e625fd1b07`; changes are uncommitted. None of these task paths contained pre-existing edits:

- `website/src/app/account/page.tsx`
- `website/src/app/blog/[slug]/page.tsx`
- `website/src/app/blog/page.tsx`
- `website/src/app/learning/[gridSlug]/[topicSlug]/page.tsx`
- `website/src/app/learning/[gridSlug]/[topicSlug]/_components/TopicDiscovery.tsx`
- `website/src/app/learning/[gridSlug]/page.tsx`
- `website/src/app/learning/_components/PopularTopics.tsx`
- `website/src/app/learning/page.tsx`
- `website/src/app/page.tsx`
- `website/src/lib/blog.ts`
- `website/src/lib/cache.ts`
- `website/src/lib/learning.ts`
- `website/src/lib/learningDiscovery.ts`
- `website/src/lib/supabase/server.ts`
- `website/tests/app/account-catalog-failure.test.ts`
- `website/tests/lib/listing-indexing.test.ts`
- `website/tests/lib/public-browsing.test.ts`
- `docs/performance/scalability-phase-1.md`

The other 54 dirty/untracked paths predated this task and were preserved (exact list below). No branch, commit, push, deployment, database mutation, dependency installation or production request was made by this task.

## Inventory, ownership and final decisions

Installed Next.js **14.2.35**, App Router, React 18.3.1; hosting configuration indicates Vercel. Consulted the [Next 14 caching guide](https://nextjs.org/docs/14/app/building-your-application/caching) and [unstable_cache reference](https://nextjs.org/docs/14/app/api-reference/functions/unstable_cache), plus installed sources. Supabase's wrapper ultimately calls global fetch: it must not be assumed to bypass Next's fetch cache.

| Route/data | Previous cache/read behavior | Phase 1 |
| --- | --- | --- |
| Home | Five bounded reads, 300s data/route caches | Same fields/ordering/limits, request memoization, explicit no-store upstream reads; route revalidate 0 |
| Learning index/course | Public RPCs, 3600s data cache; route revalidate 21600 | Fresh anonymous catalog/tree/header/assessment reads, metadata/page request memoization; route revalidate 0 |
| Lesson | Body/practice 3600s, discovery 300s; route revalidate 86400 | Fresh anonymous body/tree/practice/discovery; route revalidate 0 |
| Blog index | Page/Featured 120s, categories 300s; route revalidate 1800, dynamic search params | Scalar `(page,q,category,tag)` request memo; Featured reuses page-one cards; chips/filter share category read; unknown category avoids posts query; route revalidate 0 |
| Blog article | Post/related/navigation 300s; route revalidate 1800 | Fresh reads; article metadata/page share slug memo; adjacent navigation selects only title/slug; route revalidate 0 |
| Personalized controls/account | Client session/progress/bookmark/premium islands; authenticated account client | Same boundaries. Account catches optional public catalog errors so wallet/account behavior is preserved |

Authoritative visibility remains in unchanged Supabase RPCs/RLS. Learning retains `p_platform='website'` and its published/platform/audience/premium chain (`0045_learning_unification_rls.sql`); mobile calls the same RPCs with `mobile`. Blog has no website-visibility column: `0067_blog_public_rls.sql` makes `status='published'` authoritative, even for future/null publication dates. No service-role client, cookie, identity, purchase, account or progress data was added to shared caches. No mobile/admin contract changed.

`learning_tree` already omits lesson bodies; existing outline helpers already slim client navigation props. Those were reused. Existing bounds remain: Blog 12/page, Home posts 3, Home projects/jobs 8/6, discovery cards 6 with bounded top-ups. Blog retains its exact count for pagination, deduplicated per render. Tree lacks course `grid_type`/premium metadata, so the separate course brief read remains necessary.

### Freshness and invalidation

`admin-panel/src/lib/learning/siteRevalidate.ts` permits successful writes when website refresh fails. Blog's `pingWebsiteBlogCache` skips unconfigured refreshes and catches network errors. This cannot guarantee immediate unpublish/delete/restriction/protection removal. **No new persistent public cache was introduced**: the scoped loaders now bypass their previous persistent entries, share only within a React render, and explicitly use `cache:'no-store'` upstream. Each new server render reads a new anonymous publication snapshot; errors reject rather than become empty content/false 404s. Clean absence stays null/empty.

Scalar Blog memo keys avoid object-identity misses; request lifetime prevents cross-user/environment persistence. Endpoint/client construction uses that process's configuration. Removed scoped course/article/lesson static-param generation with ISR; routes remain dynamically available. `revalidate=0` prevents scoped server Full Route caching. Admin refresh APIs stay compatible, but scoped reads no longer depend on them. No HTML/CDN caching benefit is claimed. Dev responses showed `Cache-Control: no-store, must-revalidate`; production rendering/headers were not verified.

Existing Practice/Interview caches (including Home aggregate stats), coding-problem caches, sitemap/static-param helpers, Jobs/Projects routes, browser/router caches and OG/image behavior were not redesigned. Freshness concerns new scoped server renders; content already delivered to a browser cannot be retracted.

## Validation and limitations

Commands from `website/`:

- `npm run typecheck`: passed, including final tests.
- `npm run lint`: passed, no ESLint warnings/errors.
- `npm test -- --maxWorkers=1 --minWorkers=1`: final run **105 files / 1,428 tests passed; 12 existing opt-in resume PostgreSQL E2E tests skipped** (no scratch cluster configured).
- `npm test -- tests/lib/public-browsing.test.ts tests/lib/listing-indexing.test.ts --maxWorkers=1 --minWorkers=1`: 33 passed; included in the final full run. Account catalog-failure coverage adds 2 tests, also passed.
- Coverage: published/bounded cards, all page-one destinations and Featured/Latest preservation, scalar deduplication, category reuse/unknown categories, pagination, navigation ordering/projection, fresh Home batching, header/assessment/discovery errors, true absence vs failure, next-render edit/unpublish/publish/delete/protection transitions, environment separation and empty anonymous session. Account auth/wallet failures still reject while optional public enrichment can fail independently.
- Fixtures use real Supabase query builders against fake HTTP/RPC responses and a React render-lifetime memo model. They prove loader/cache contracts, **not live SQL/RLS actor behavior**. No SQL harness, shared staging mutation, authenticated browser or payment/progress mutation ran.
- `git diff --check` from repository root: passed.
- `npm run build`: **not run**. The established environment-approved launcher starts dev only; existing `.next` artifacts were preserved. About 1.1 GiB available RAM and no swap at initial inspection. No concurrent production build, alternative environment-file reader or artifact replacement was used. A safe production build remains a handoff check.

`./start-staging.sh website` verified `https://biktjhenbvnklmagmvav.supabase.co` before starting localhost:3100. Initial sandbox binding hit `listen EPERM` on port 3100; the authorized launcher/local measurements then ran through approved escalation. No optional MCP queries were needed. The interruption stopped the initial processes; the launcher was resumed once, without duplicate servers. At handoff the task-owned staging dev server remains running on localhost:3100; reuse it if still available. Initial checkpoint creation was rejected by automatic review for missing documentation approval; the explicit section-5 instruction in the user's attachment was re-read as authorization before retrying this exact file.

Playwright: desktop Blog index, Home and Java course; 390px lesson/article. All sampled routes returned 200, expected h1, no page errors or horizontal overflow. Course exposed 152 lesson links. Interception allowed only localhost GET/HEAD and blocked external traffic plus optimizer URLs targeting non-staging origins. Staging records contain production Storage image URLs; these requests were blocked before dispatch. Full image loading/LCP is therefore unverified.

### Request/payload evidence: isolated fixtures

`node /tmp/campusedux-phase1-query-measure.cjs` ran actual HEAD vs modified Blog loaders, transpiled with installed TypeScript, real Supabase query builders, fake HTTP responses and simulated React/persistent cache lifetimes. Same 14 public cards/categories, metadata then page flow. These are loader request/JSON-byte counts, not staging SQL counts or query plans.

| Case | Before | After |
| --- | ---: | ---: |
| Cold unfiltered Blog index | 3 requests / 5,832 bytes | 2 requests / 3,917 bytes |
| Next render of same index | 0 requests / 0 bytes (persistent cache) | 2 requests / 3,917 bytes (fresh) |
| Adjacent article navigation | 2 requests / 640 bytes, 13 selected fields | 2 requests / 84 bytes, 2 fields |

Cold index: 33% fewer requests, 32.8% fewer fixture bytes. Navigation: 86.9% fewer fixture bytes. Warm backend work increases: no overall backend-work reduction is claimed. This is the cost of current visibility without reliable invalidation.

### HTTP evidence: Next development server

Sequential `curl --max-time 45 --silent --output <temporary HTML> --write-out '%{json}' http://localhost:3100<route>`; three requests/route, one at a time. Same launcher/host/routes, no concurrent users. First requests include variable compilation; caches/artifacts were not cleared. The interruption required a server restart, so first rows are **not equivalent cold-cache benchmarks**. Two immediate repeats expose the observable tradeoff, not capacity.

| Route | First total ms, before → after | Repeat totals ms, before → after | Repeat HTML bytes, before → after |
| --- | --- | --- | --- |
| `/` | 3,871 → 12,415 | 124 / 120 → 906 / 796 | 308,383 → 308,316 |
| `/learning` | 1,091 → 2,770 | 978 / 92 → 652 / 941 | 218,916 → 218,636 |
| `/learning/java-tutorial` | 4,401 → 3,181 | 151 / 109 → 1,002 / 710 | 232,744 → 232,683 |
| `/blog` | 63 → 1,492 (before already compiled) | 54 / 53 → 332 / 286 | 75,707 → 75,707 |

Blog's genuine initial compile request preceded the loop: 11,903ms total / 10,210ms TTFB. Repeat TTFB ms before → after: Home 114/112 → 613/565; Learning 129/84 → 65/74; course 148/106 → 999/701; Blog 52/47 → 327/284. Learning streams, so TTFB hides completion work. Small HTML-byte changes are serialization differences, not proven payload savings.

After-only smoke samples (no equivalent before samples): `/learning/java-tutorial/introduction-to-java` total 7,443ms first / 1,921 and 887ms repeats; `/blog/artificial-intelligence-what-it-is-how-it-works-types-applications` 2,491ms first / 691 and 584ms repeats. All HTTP samples returned 200. No broad prior QA sweep or large load test was repeated.

Temporary evidence if retained: `/tmp/campusedux-phase1-before.json`, `campusedux-phase1-after.json`, `campusedux-phase1-query-measure.json`, measurement script and HTML/header samples under `/tmp`. Earlier `/tmp/campusedux-perf-qa/` reports were absent. Results are preserved here so a new chat does not depend on temporary files.

## Remaining risks, rollback and Phase 2 candidates

- Restore shared reuse only after proving an authoritative content revision/visibility or invalidation contract covering **all write paths and failures**. Best-effort webhook refresh cannot guarantee immediate restriction removal. Do not silently re-enable stale caches.
- Run an approved staging-only production build in isolation, then verify deployed rendering/CDN behavior and comparable cold/warm request/SQL counts under a defined workload. Local dev results establish no concurrency target.
- Popular Topics reads several metadata trees; a verified bounded public-picks contract could reduce work. Discovery still performs 4–5 bounded reads/lesson; investigate safe catalog version/reuse and below-article streaming separately. Do not invent RPC fields, indexes or infrastructure.
- Staging production-Storage references need separately authorized cleanup before full image/LCP measurements.
- Review remaining Practice/Interview/coding/sitemap/OG caches separately. Jobs/Projects optimization remains deferred. No Phase 2 implementation started.
- Rollback only the task paths listed above, preserving all unrelated work. Reverting freshness protections restores the known stale-publication risk; no schema/data rollback is needed.

<details><summary>Pre-existing dirty/untracked paths, preserved</summary>

- `admin-panel/src/app/(panel)/custom-projects/actions.ts`
- `admin-panel/src/app/(panel)/custom-projects/pricing/PricingForms.tsx`
- `admin-panel/src/app/(panel)/custom-projects/pricing/page.tsx`
- `admin-panel/tests/actions/custom-projects.test.ts`
- `mobile-app/src/customProjects/BuilderLevelScreen.tsx`
- `mobile-app/src/customProjects/BuilderTypeScreen.tsx`
- `mobile-app/src/hooks/useCustomProjects.ts`
- `mobile-app/src/services/customProjects.service.ts`
- `mobile-app/src/types/customProject.types.ts`
- `mobile-app/supabase/functions/_shared/academicIntegrity.ts`
- `mobile-app/supabase/functions/_shared/customProjectPricing.ts`
- `mobile-app/supabase/functions/create-custom-project-order/index.ts`
- `mobile-app/supabase/migrations/0151_dbms_sql_content_rewrite_batch01.sql`
- `mobile-app/supabase/tests/batch_a/124_custom_project_isolation.sql`
- `mobile-app/supabase/tests/batch_a/125_custom_project_balance.sql`
- `mobile-app/supabase/tests/batch_a/126_custom_project_delivery_gate.sql`
- `mobile-app/supabase/tests/batch_a/128_custom_project_value_addons.sql`
- `mobile-app/supabase/tests/batch_a/129_custom_project_delivery_visibility.sql`
- `mobile-app/supabase/tests/harness/chain_order.txt`
- `mobile-app/tests/unit/customProjects/BuilderTypeScreen.test.tsx`
- `mobile-app/tests/unit/services/customProjects.service.test.ts`
- `mobile-app/tests/unit/services/customProjectsServerParity.test.ts`
- `website/src/app/custom-projects/_builder/BottomBar.tsx`
- `website/src/app/custom-projects/_builder/CollapsibleCategory.tsx`
- `website/src/app/custom-projects/_builder/ConfigSummary.tsx`
- `website/src/app/custom-projects/_builder/Dropzone.tsx`
- `website/src/app/custom-projects/_builder/FeatureCard.tsx`
- `website/src/app/custom-projects/_builder/SelectCard.tsx`
- `website/src/app/custom-projects/_builder/StepBar.tsx`
- `website/src/app/custom-projects/checkout/CustomProjectCheckout.tsx`
- `website/src/app/custom-projects/checkout/page.tsx`
- `website/src/app/custom-projects/estimate/page.tsx`
- `website/src/app/custom-projects/features/BuilderFeatures.tsx`
- `website/src/app/custom-projects/features/page.tsx`
- `website/src/app/custom-projects/start/BuilderStart.tsx`
- `website/src/app/custom-projects/start/page.tsx`
- `website/src/lib/customProjects.ts`
- `website/tests/lib/academicIntegrity.test.ts`
- `website/tests/lib/customProjects.test.ts`
- `admin-panel/supabase/migrations/122_custom_project_catalog_token.sql`
- `mobile-app/supabase/migrations/0152_custom_project_catalog_token.sql`
- `mobile-app/supabase/migrations/0153_academic_non_assessed_software.sql`
- `mobile-app/supabase/migrations/0154_custom_project_pricing_permissions.sql`
- `mobile-app/supabase/tests/batch_a/152_custom_project_catalog_token.sql`
- `mobile-app/supabase/tests/batch_a/153_academic_non_assessed_software.sql`
- `mobile-app/supabase/tests/batch_a/154_custom_project_pricing_permissions.sql`
- `mobile-app/tests/unit/services/academicIntegrity.test.ts`
- `website/loadtest.js`
- `website/loadtest50.js`
- `website/result.txt`
- `website/src/app/custom-projects/_builder/EditableEstimateSummary.tsx`
- `website/src/app/custom-projects/_builder/FlowLayout.tsx`
- `website/src/app/custom-projects/_builder/SelectionSummary.tsx`
- `website/tests/app/custom-project-summary.test.ts`

</details>
