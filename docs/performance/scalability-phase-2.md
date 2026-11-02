# Scalability Phase 2 handoff

2026-11-01 · **Staging post-apply verification PASS for the installed contract and four sampled public pages.** The operator applied canonical 0155 once; the agent did not apply or replay it. Anonymous permissions, expected rendering and actual repeated payload reuse are verified against staging. This is local development-server evidence, not production/CDN/high-concurrency capacity proof.


## Live staging post-apply verification — 2026-11-01 06:33 UTC

**PASS for this verification scope.** The operator reported `Applying migration 0155_public_content_revisions.sql...` followed by `Local database is up to date.` No agent-run migration, replay, admin twin execution or database/content edit occurred. Live state and measurements below supersede the earlier absent-contract/pre-apply observations; earlier timings remain historical evidence only.

### Installed state and actual anonymous access

Used the verified isolated work directory `/tmp/campusedux-phase2-staging-preflight-590cstnm` with official `npx --offline --no-install supabase db query --linked --project-ref biktjhenbvnklmagmvav`. The existing narrow exception allowed the CLI's internal stored authentication; the agent never inspected/copied/logged credentials. The repository project link was untouched and production was never contacted.

- Canonical ledger `0155/public_content_revisions`: **one row**; admin twin ledger `123`: **zero**.
- Revision rows: **three**, scopes exactly `blog`, `home`, `learning`.
- Expected triggers: **all twelve enabled**, matched by exact dependency table, `public_revision_<scope>` name, AFTER STATEMENT INSERT/UPDATE/DELETE/TRUNCATE event mask (`tgtype=60`), and `bump_public_content_revision()` target.
- New revision table: **RLS enabled, zero policies**. Neither anon, authenticated nor service_role has any table privilege or EXECUTE on the trigger function. Only anon has EXECUTE on `public_content_revision(text)` among those roles. Both new functions are SECURITY DEFINER with `search_path=pg_catalog`.
- A separate **read-only transaction** switched session-local role to anon and actually called the revision function for **learning, blog and home**, requiring non-null results; direct revision-table SELECT and trigger-function EXECUTE were denied with `insufficient_privilege`. The transaction was rolled back. It logged no token values. Actual website anonymous PostgREST revision RPCs also returned **HTTP 200** throughout the samples.

Evidence: `/tmp/campusedux-phase2-post-apply-installed.json`, `/tmp/campusedux-phase2-post-anon-result.json`, and `post-apply-anon.sql` in the isolated staging work directory. The reviewed canonical and twin remain byte-identical at SHA-256 `0fd0efb6e74545b145e29245a98f78466e7234e07cc2c3832a854b8dc070d6f0`.

### Existing server, source verification and temporary instrumentation

Reused the existing Next development server on **localhost:3100**, PID **118873**; it was not restarted. Each HTML response's `dns-prefetch` origin, sourced by the root layout from its configured Supabase URL, was exactly `https://biktjhenbvnklmagmvav.supabase.co`. After rendering, compiled Home/Blog/course/lesson bundles contained `public_content_revision` and the current cache behavior. The Blog bundle also contained the reviewed namespace, revision-race failure and admission-overload markers. The actual live cold-fill/post-check/request patterns corroborate that this was the Phase 2 implementation, not old rendered HTML.

A **temporary development/staging-only** module subscribed to Node Undici diagnostics channels. It observed actual network request creation, response status, completion timing and numeric Content-Length. It recorded only allowlisted endpoint classes, an observation ID, PID, controlled probe epoch, status and timing; it did **not** read/log request credentials, headers, body, filters/query arguments, user data or returned content. Response headers were examined only for numeric Content-Length. Observation was bounded to 2,048 sanitized events; the run remained below that bound. Endpoint identifiers outside the scoped allowlist were collapsed to `other-public-read`.

For cold samples without flushing application/Next caches or touching shared records, the temporary wrapper added a controlled **local probe epoch** to its environment identity hash. Each route got a new epoch after compilation priming, held constant for that route's cold + two repeated requests. This forces new keys for the revision-backed payloads only, preserving the reviewed fetch/projection/admission/freshness path. It does not cold-reset Practice/Interview's inherited caches, DB buffers, compilation state, transport connections or other workers. No revision token or content was changed.

The observer used [Undici diagnostics channels](https://github.com/nodejs/undici/blob/main/docs/docs/api/DiagnosticsChannel.md) rather than replacing fetch or changing upstream responses. A process-global guard avoided duplicate listeners under HMR. The core cache/loader code remained unchanged; only the temporary observer import and local identity suffix were present during measurement.

After measurement, the probe was signaled to detach; the main server logged `probe-detached`. The observer source/import/epoch suffix were removed. **All six source hashes** (`revisionCache.ts`, `revisionedPublicRead.ts`, public Supabase helper, Blog/Learning/Home loader files) match their pre-observer reviewed snapshots exactly. A final HTML-only smoke of all four routes passed after HMR, and all compiled bundles again contained the revision implementation with **no temporary probe symbol**. No instrumentation, configuration flag, endpoint or permanent behavior change remains in application source.

### Comparable live cold/repeated measurements

Commands: four sequential HTML-only compile/priming GETs using `python3 /tmp/campusedux-phase2-live-measure.py compile`, followed by one cold-key + two sequential repeated GETs per route using the same script with `runtime`. The initial runtime command was not executed because automatic approval review hit a usage limit; after the user's `continue`, that same command was approved and executed once. No load test, simultaneous traffic generation, cache fixture suite or SQL fixture suite ran.

All counts below are **actual outgoing staging HTTP requests**, separately classified as revision vs other public payload requests. They are not inferred loader invocations or SQL statement counts. Compilation/priming samples are excluded from the runtime table. Runtime route order was Home, Blog, Java course, public Introduction to Java lesson. PIDs in the observer showed transient development workers as well as the main server; only main PID 118873 issued the measured upstream requests. There is no cross-worker/shared-host cache guarantee.

| Route | Runtime cold revision / payload calls | Repeat 1 revision / payload calls | Repeat 2 revision / payload calls | Cold total ms | Repeats total ms | Cold TTFB ms | Repeats TTFB ms |
| --- | ---: | ---: | ---: | ---: | --- | ---: | --- |
| `/` | 6 / 8 | 3 / 2 | 3 / 2 | 3,378.61 | 670.99 / 992.69 | 2,880.77 | 428.70 / 576.76 |
| `/blog` | 3 / 2 | 1 / 0 | 1 / 0 | 1,088.26 | 270.82 / 256.81 | 1,080.89 | 262.64 / 250.30 |
| `/learning/java-tutorial` | 4 / 4 | 1 / 0 | 1 / 0 | 1,829.49 | 300.72 / 355.04 | 1,819.54 | 290.43 / 344.68 |
| `/learning/java-tutorial/introduction-to-java` | 5 / 8 | 1 / 4 | 1 / 4 | 1,998.84 | 1,150.93 / 787.21 | 1,954.27 | 1,127.34 / 767.19 |

Exact reuse evidence:

- **Home:** cold payloads were projects, testimonials, FAQs, banners, jobs, latest Blog cards, learning catalog, plus one existing aggregate categorized `other-public-read`. Both repeats avoided all six revision-backed payload calls; only jobs and that existing aggregate remained. Home needs **three** fresh revision checks because it uses home, blog and learning domains. The cold six checks include their three successful fill verifications. Payload calls 8 → 2; total network calls including revisions 14 → 5.
- **Blog:** cold posts/count + categories each ran once, plus initial revision/fill checks. Repeats fetched **no posts, count or category payload**; only one fresh revision call. Payload 2 → 0; total calls 5 → 1.
- **Java course:** cold tree, lightweight grid header and two chapter/course assessment queries. Repeats fetched **none of those payloads**; only one revision call. Payload 4 → 0; total calls 8 → 1.
- **Public lesson:** cold tree, lesson body, topic-practice metadata and catalog plus discovery's two projects/two jobs queries. Repeats avoided all four Learning payload reads; the **four discovery marketplace reads intentionally stayed fresh**. Payload 8 → 4; total calls 13 → 5. No claim that the entire lesson page became a one-query response.

The observer recorded no upstream HTTP error statuses or network errors; every measured upstream response was HTTP 200. No queue exhaustion, revision-race retry or false-404 fallback appeared in this sample. No real unpublish/protection/edit transition was tested against shared records.

**Bytes:** HTML sizes were constant across the three runtime samples per route: Home **308,316**, Blog **75,707**, course **232,683**, lesson **273,449** bytes. All revision responses advertised **38 bytes** each: warm checks therefore used 114 bytes on Home and 38 on each other route (response bodies only, excluding protocol headers). Zero warm Blog/course payload requests means **zero upstream payload-response bytes** for those groups. Some large cold payloads and Home's aggregate did not advertise Content-Length, and bodies were deliberately not consumed by the observer: total cold backend bytes and Home aggregate bytes are **unavailable**, not zero. The lesson's four warm discovery responses were empty arrays advertising **8 bytes total**; this staging fixture sparsity limits latency/payload representativeness. It is not a general catalog-byte estimate.

**Compilation and layers:** priming totals were Home **4,713.10 ms**, Blog **1,078.96 ms**, course **3,356.94 ms**, lesson **4,654.01 ms** and are not comparable cache-runtime data. Cold runtime keys were forced only after this priming. Remaining first-request development/worker/HMR overhead is not separately attributable; the table measures full local runtime requests, not isolated DB latency. Repeat variation is substantial (especially Home/lesson), sample size is two, and Phase 1's older observations were not a contemporaneous controlled baseline. Do not infer a production latency win of a specific percentage from these numbers.

Every runtime HTML response sent **`Cache-Control: no-store, must-revalidate`**. Curl fetched each HTML over the network with no browser/CDN layer involved. Remaining fresh revision requests on every repeat, paired with absent payload requests, demonstrate **process-local data reuse**, not Full Route/HTML/CDN/browser caching. Restoring the reviewed source changed the temporary namespace/HMR graph; the cleanup smoke had fresh/recompile costs and was not added to the warm timing series.

### Rendered-content verification and limits

All **12 runtime responses** returned HTTP 200 **and** passed server-rendered content checks; the status alone was not treated as success. The HTML parser inspected actual text/links excluding scripts/styles, required expected headings/content, and found neither the retry/error boundary text nor streaming error digests:

- Home: “Learn skills. Build projects. Land the job.” and real Blog links; **5,929** public text characters.
- Blog: “Insights, Ideas & Technology” and **two distinct live article destinations**; **1,844** public text characters. The current staging Blog has fewer cards than the fourteen-card isolated fixture.
- Course: “Java Tutorials”, **152 lesson-link anchors / 149 unique lesson destinations**; **4,714** public text characters. This preserves the prior anchor count while distinguishing duplicate links from unique lessons.
- Lesson: “Introduction to Java”, a substantive public lesson body and navigation/discovery links; **8,011** public text characters, **150 unique course lesson destinations** across page links. It rendered the public lesson, not a lock/retry/404 screen.

After exact source restoration, one additional HTML-only smoke per route again returned expected H1, staging origin and no error screen (totals 2,093.08 / 1,125.30 / 1,868.43 / 1,658.06 ms for Home/Blog/course/lesson). These cleanup samples are excluded from the comparable runtime table. Browser hydration, signed-in islands, layout screenshots and interactive payment/progress actions were **not exercised**; no private information was requested. No production Storage image, optimizer URL or external asset was fetched. Image loading/LCP remains unverified.

### Final state and evidence

Only this handoff has a lasting repository change from the post-apply verification. Temporary source edits were fully removed; no fixture tests, package install, migration, content mutation, rollback, commit, push, deployment or large load testing occurred. The user performed the one migration application; the agent verified it read-only. Existing localhost server remains running with reviewed source. All inherited/unrelated edits are preserved.

Artifacts: `/tmp/campusedux-phase2-live-runtime.json` (counts, timings, content assertions, observable response lengths); `...-compile.json`; `...-restored-smoke.json`; `/tmp/campusedux-phase2-live/` HTML/header files; sanitized `/tmp/campusedux-phase2-live-network.ndjson`; `/tmp/campusedux-phase2-live-probe.ts` (removed observer source for audit); `/tmp/campusedux-phase2-post-reviewed/manifest.json` and source snapshots; installed/anon result JSON paths above. Control file remains in inert stop mode; application source has no importer. `git diff --check` and reviewed source/migration SHA comparisons passed; no completed suites were rerun.

Remaining limits: process/worker lifetime and eviction, sustained traffic/queue behavior, production build/CDN/router behavior, normal content-write invalidation frequency/revision locks, and live safe revocation in disposable fixtures remain separate verification work. Current read-only sampling proves installed permissions and repeated backend-work reduction for these routes; it does not establish arbitrary-load reliability or 50,000-user capacity.

## Historical staging preflight — PASS, before operator application

The user's explicit narrow exception permits the official `npx supabase` CLI to internally use its existing stored authentication for this staging preflight. The agent did not open, inspect, copy or print credential-store files or token values. Existing authentication **worked**; the earlier process-token blocker is superseded. No login, installation, upgrade or downgrade was performed.

Executor: `npx --offline --no-install supabase`, observed version **2.122.0**. The official release tag resolves to commit **`5afad870388552d0198087d27037da7ac745ba2b`**. The [matching TypeScript migration runner](https://github.com/supabase/cli/blob/5afad870388552d0198087d27037da7ac745ba2b/apps/cli/src/command-internal/migration-apply.ts) appends the native version insert to the same final statement batch, and its [driver](https://github.com/supabase/cli/blob/5afad870388552d0198087d27037da7ac745ba2b/apps/cli/src/command-internal/db-connection.sql-pg.layer.ts) sends one final Sync. The unchanged canonical 0155 contains no nontransactional directive, authored top-level transaction control or pipeline-incompatible statement, so its SQL and ledger row use **one implicit transaction**. This conclusion is specific to this file/version; standalone concurrent-index/VACUUM/ALTER SYSTEM/CLUSTER statements and authored/nontransactional files have different execution paths. No 2.54.11 assumption is used.

### Live read-only results

| Preflight item | Verified result |
| --- | --- |
| Project identity/scoping | **PASS**: successful native CLI API and catalog/ledger reads used `--project-ref biktjhenbvnklmagmvav` and the isolated work directory; no implicit repository link was used. The server's `supabase.project_ref` GUC is null, so it is not used as identity proof. Identity is established through the explicit CLI target and its scoped Management API/connection routing |
| Database | `postgres`, PostgreSQL **17.11**; catalog query session role `postgres` |
| Required tables | **12/12 exist**, all owned by `postgres`, all RLS enabled; each has current policies (five per table, six for projects) |
| DDL prerequisites | Public-schema CREATE and TRIGGER on all twelve tables allowed for the observed role; `pg_catalog.gen_random_uuid()` exists; anon/authenticated/service_role roles exist |
| Learning RPCs | All four existing catalog/tree/topic/practice RPCs exist, are SECURITY DEFINER and executable by anon |
| Existing table access | Anon table SELECT exists for the eleven relevant tables besides `dsa_problems`; its false table-wide SELECT is consistent with the existing protected-column contract. No existing grants/policies were changed |
| Existing revision contract | **Absent**: no revision table, reader, trigger function or `public_revision_*` triggers |
| Canonical/twin ledger versions | **Neither `0155` nor `123` is recorded** |
| Historical ledger | **319 nonempty entries**, including authentic split rewrite migrations and renamed historical versions |
| Historical bundle fidelity | **319/319 exact SHA-256 matches** against the bytes emitted from staging's stored statements by native `migration fetch` |
| Native migration-list comparison | **319 matched applied versions; zero missing history; exactly one local-only pending version: `0155`** |
| Canonical/admin twin | **Byte-identical**, reviewed SHA-256 unchanged |

Canonical `mobile-app/supabase/migrations/0155_public_content_revisions.sql` and reference/harness twin `admin-panel/supabase/migrations/123_public_content_revisions.sql` both have SHA-256:

```text
0fd0efb6e74545b145e29245a98f78466e7234e07cc2c3832a854b8dc070d6f0
```

### Historical operator apply command — operator has now applied it; do not replay

Run from the existing operator terminal in `/home/ganeshp8545/CampusEduX`. The **CLI working directory** is:

```text
/tmp/campusedux-phase2-staging-preflight-590cstnm
```

It contains 319 already-applied authentic history files plus the one reviewed canonical file; **320 SQL files total**. It does not contain admin `123` or any unrelated pending migration. Historical files were fetched directly from the staging ledger into this new empty temporary directory, not synthesized as placeholders or edited to match versions. Original repository migrations and its project link were preserved.

The operator reported successful execution of this previously prepared command. It is retained for provenance only; **do not execute it again**:

```sh
npx --offline --no-install supabase migration up --linked --project-ref biktjhenbvnklmagmvav --workdir /tmp/campusedux-phase2-staging-preflight-590cstnm --include-all
```

**The agent did not run this command.** `--include-all` is required because short version `0155` sorts before some already-applied historical versions; it is constrained here by the verified isolated pending set, not permission to apply the repository's other files. Do not substitute either repository package directory for `--workdir`. Do not add admin `123`, rename canonical 0155, use a blanket push, repair history or insert ledger rows manually. The native runner records the actually executed canonical **0155** itself in the SQL transaction; no twin ledger entry is fabricated. The isolated config has no Vault-secret configuration or seed execution in this migration-up path.

Preflight is valid for the recorded ledger/bundle snapshot. If history, target, CLI version, config or bundle contents change, or this temporary directory disappears, stop and repeat the corresponding read-only preflight/reconstruction before applying. Use a single migration operator; do not run this alongside another history change. An already successful apply must not be replayed to obtain output: token rotation makes reapplication observable. The manifest at `/tmp/campusedux-phase2-staging-preflight-590cstnm/bundle-manifest.json` records all 319 historical file fingerprints plus canonical SHA-256.

### Read-only post-apply check — now executed successfully by the agent

After the operator's successful apply, the agent ran this read-only command:

```sh
npx --offline --no-install supabase db query --linked --project-ref biktjhenbvnklmagmvav --workdir /tmp/campusedux-phase2-staging-preflight-590cstnm --file /tmp/campusedux-phase2-staging-preflight-590cstnm/post-apply-check.sql --output json
```

The prepared SELECT-only file returns metadata, never content or revision UUID values. Required results: `canonical_ledger_rows=1`, `twin_ledger_rows=0`, `revision_rows=3`, scopes exactly `blog, home, learning`, `enabled_revision_triggers=12`, `rls_enabled=true`, `revision_policies=0`, `safe_definer_functions=2`. `reader_execute` is true only for anon; `trigger_execute` and `any_table_privilege` are false for anon/authenticated/service_role. Treat any mismatch as a failed check, not permission to replay or repair. The durable app-first rollback patch and its SQL procedure remain available below and were not executed.

### Evidence and scope of this continuation

Read-only operations: a scoped Postgres-config GET (its required `--experimental` flag affected only command availability), catalog SELECT, ledger metadata/fingerprint SELECTs, native history fetch and native migration list. All CLI calls used explicit staging ref and isolated workdir, with no authentication values logged. Native fetch only read already-applied history and wrote its local files; it did not apply SQL or alter the ledger.

Verification artifacts under `/tmp/campusedux-phase2-staging-preflight-590cstnm`: `preflight-schema.sql`/result JSON, `preflight-ledger.sql`/result JSON, exact-artifact SHA-256 query/result, `native-migration-list.json`, `bundle-manifest.json`, `preflight-pass.json`, and the unexecuted `post-apply-check.sql`. A preliminary statement-parser roundtrip comparison differed for historical `011700_project_files_private_check.sql`; that check is not used to assert file fidelity. The final verification compares the exact native-fetch output bytes against authoritative server-computed SHA-256, and all 319 match. No historical artifact was changed to force a match, and none is pending execution.

Only this handoff was edited in the repository; bundle/history/evidence files are isolated under `/tmp`. No agent-run migration, history repair, ledger fabrication, shared learning/Blog/content mutation, deployment, commit, push, repeated cache/SQL fixture/browser/load test or production access occurred. Reviewed application/SQL and rollback artifacts remain unchanged.

## Exact changes and inherited work

The immediate baseline is the uncommitted Phase 1 implementation documented in `scalability-phase-1.md`, on HEAD `f717534d817fb5a6484fa58407d220e625fd1b07`. That handoff preserves the full inherited file inventory. Unrelated tracked diffs were compared against the initial diff and were unchanged. No branch, commit, push, deployment, dependency installation or shared database mutation occurred.

Phase 2 modifies inherited files:

- `website/src/lib/blog.ts`: revision-checked existing anonymous loaders; retains scalar listing keys, projections, pagination and navigation ordering.
- `website/src/lib/learning.ts`: revision-checked catalog/tree/lesson/practice/header/course-test metadata; malformed assessment arrays reject.
- `website/src/lib/cache.ts`: revision-checked Home projects/testimonials/FAQs/banners; jobs stay fresh; malformed batch arrays reject.
- `website/tests/lib/public-browsing.test.ts`: retains Phase 1 cases with explicit missing-RPC compatibility; adds installed-revision reuse, transitions, failures, races, concurrency and malformed-result cases.
- `website/tests/lib/listing-indexing.test.ts`: its Supabase mock explicitly models a missing revision RPC; existing indexing assertions remain.
- `mobile-app/supabase/tests/harness/chain_order.txt`: appends mobile 0155 then admin 123, preserving inherited entries, including unrelated uncommitted 0152–0154.

Phase 2 adds:

- `website/src/lib/revisionCache.ts`
- `website/src/lib/revisionedPublicRead.ts`
- `website/tests/lib/revision-cache.test.ts`
- `mobile-app/supabase/migrations/0155_public_content_revisions.sql`
- `admin-panel/supabase/migrations/123_public_content_revisions.sql` (identical twin)
- `mobile-app/supabase/rollbacks/0155_public_content_revisions_rollback.sql`
- `mobile-app/supabase/tests/batch_a/155_public_content_revisions.sql`
- This explicitly requested handoff.

Phase 1 route settings, navigation slimming, discovery implementation, account behavior, public Supabase helper and all unrelated custom-project/mobile/admin work remain inherited. No page component or existing authorization/payment/progress contract was edited by Phase 2.

## Authoritative dependency and write map

| Payload / revision | Authoritative tables | Relevant supported writes |
| --- | --- | --- |
| Learning catalog/tree/header/lesson / `learning` | `learning_grids`, `learning_sections`, `learning_topics`, `learning_contents` | Admin `learning/actions.ts`: create/edit/delete/reorder; publication, website visibility, targeting and premium flags. SQL imports/seeds and existing parent/cascade triggers write these tables too. |
| Topic practice and chapter/course cards / `learning` | Above plus `practice_tests`, `dsa_problems` | Admin `learning/practice-actions.ts` and global practice actions; imports and publish-sync triggers. Only stored assessment metadata is cached; questions, answer keys, judge cases and authenticated attempts are excluded. |
| Blog categories/filter/listing/tags/cards/detail/navigation / `blog` | `blog_posts`, `blog_categories` | Admin `blog/actions.ts`: edit/publish/unpublish/delete/duplicate, category edits and SQL imports. Category-name synchronization and FK cascades are covered. |
| Home non-job payload / `home` | `projects`, `testimonials`, `faqs`, `banners` | Admin project/CMS edits/deletes and SQL/RPC writes, including project sales-counter changes. Only existing selected public fields are cached. |
| Jobs and discovery marketplace queries / fresh | `jobs`, `projects` | Jobs can expire without writes, so `onlyActiveJobs()` runs afresh. Discovery keeps its fresh marketplace queries and can reuse the Learning catalog dependency. Banner windows remain evaluated in Home on every render. |

Verified current contracts include migrations 0044/0045 Learning visibility/RPCs, 0048 topic practice, 0091 chapter/course fields, and 0065/0067 Blog. Anonymous Learning still uses `p_platform='website'`. Blog RLS uses `status='published'`, including future/null publication dates; no new website flag is invented. Mobile `services/learning.service.ts` reads shared RPCs and writes owner bookmarks, which are excluded. Authenticated/premium islands retain their existing trusted checks. Existing RPC semantics are preserved: `learning_topic_content` locks by topic premium and filters premium contents; this phase does not introduce a new grid-premium gate.

No existing reliable aggregate revision was found. Learning row `updated_at` triggers update the row being edited, not a complete dependency tree: a content-body edit cannot safely use a parent timestamp as its version. Blog row timestamps likewise do not cover all listing dependencies or deletions.

`admin-panel/src/lib/learning/siteRevalidate.ts` allows successful writes with a refresh warning/retry tags. Blog's `pingWebsiteBlogCache()` skips missing configuration, catches network failures and does not validate response status. `website/src/app/api/revalidate/route.ts` remains compatible with existing callers. These best-effort paths cannot establish correctness for shared reuse and are not required by the new cache.

## Final design and guarantees

The migration prepares three private revision rows, an anon-executable `public_content_revision(text)` RPC returning only a UUID, and AFTER STATEMENT INSERT/UPDATE/DELETE/TRUNCATE triggers on all twelve tables above. Revision updates commit/roll back with content writes, including cascades/imports/SQL/RPC writers. Row locking serializes concurrent updates to a domain. UUIDs avoid timestamp collisions and counter-reset/reinstallation collisions; reapplication rotates all tokens. Invalidation is deliberately coarse, including harmless/zero-row writes.

Existing content policies, grants, table shapes and RPC bodies are unchanged. The new table has RLS with no client policies and all public/anon/authenticated/service-role table privileges revoked. Only anon receives EXECUTE on the revision reader; the trigger function is not callable by those client roles. Both SECURITY DEFINER functions pin `search_path=pg_catalog` and qualify the revision table. RPC scope input is allowlisted; the response contains no content or identity.

Every new React render makes one fresh anonymous `cache:'no-store'` revision call per used domain. Hits reuse payloads; misses run the existing no-store anonymous loader and check the revision again before admission. Each cold loader adds its own final check; the course assessment loader's two queries share one final check. A fill overlapping a write rejects the render; a new request retries with a fresh render snapshot. It does not retry inside the old render, where memoized category dependencies might belong to an older revision. Concurrent callers join a fill per key within the module instance.

Keys include a contract namespace, website platform, anon role, SHA-256 of endpoint plus anonymous configuration, domain, loader name, arguments and revision. No raw credential is stored in keys or logged. Callers cannot provide an authenticated client. Cookie/session/account/wallet/progress/purchase data and protected lesson bodies never enter this cache.

An LRU bounds storage to 128 entries and 16 MiB of serialized keys/payloads, with at most 32 active fills plus 64 distinct queued fills per module instance. Queued fills have a 2,000 ms admission deadline and FIFO order. This is a serialized-byte bound, not an exact heap limit. Oversized verified entries are served without retention. Existing active or queued keys join their existing promise, including at capacity. A full queue rejects new distinct misses; an expired queued fill rejects all its joiners without starting its loader. Timers/queue/key slots are removed on admission or expiry; successful and failed active fills release capacity and drain the queue. Admission checks deadlines even if timer callbacks are delayed. JSON copies isolate consumers from stored objects. Old revisions remain only within those bounds and become unreachable after a newer check. There is no TTL, background refresh or stale-on-error fallback.

Missing RPC (`PGRST202`/`42883`) uses fresh payload reads with no shared reuse, adding one missing-RPC call per used domain/render. Other revision errors, invalid tokens, upstream errors or failed post-fill checks reject. They never serve stale data or become empty content/false 404s. Clean absence can be cached under a valid revision; publishing later changes the key. Failed admin refresh does not affect revision correctness. A missing revision row aborts the content writer rather than silently leaving stale entries usable.

Freshness means the committed revision observed by the fresh check. A write overlapping a hit may commit after that snapshot, as with ordinary reads. This does not retract delivered bytes or guarantee whole-page serializability/across-domain snapshots. Checks/payloads must use the same primary DB. Privileged writers must retain enabled triggers. Future RLS/RPC/grant/trigger-contract changes must rotate affected revisions atomically; DDL and changed bytes at unchanged external Storage URLs are not automatically tracked.

Reuse is **process/module-local**, across visitors served by that instance. Workers/route bundles/restarts may have independent caches and fills. It is not distributed reuse, Next Data Cache, Full Route Cache, CDN caching or a browser/router-cache guarantee. Phase 1 `revalidate=0` route settings remain. See the [Next.js 14 caching distinctions](https://nextjs.org/docs/14/app/building-your-application/caching); no stale-while-revalidate layer was added.

## Verification

From `website/`:

- `npm test -- --maxWorkers=1 --minWorkers=1`: **106 passed files, 1 skipped file; 1,446 passed tests, 12 existing opt-in resume E2E tests skipped**. This full run preceded the final malformed-array guards and three new focused cases.
- Final `npm test -- tests/lib/public-browsing.test.ts tests/lib/revision-cache.test.ts tests/lib/listing-indexing.test.ts tests/app/account-catalog-failure.test.ts --maxWorkers=1 --minWorkers=1`: **4 files / 56 tests passed**, including the final changes.
- Final `npm run typecheck` and `npm run lint`: passed; lint reported no warnings/errors.
- `git diff --check`: passed. Mobile/admin migration twins match byte-for-byte. Unrelated tracked diffs match the initial snapshot.
- `npm run build`: **not run**. The established staging-config launcher starts dev only; no alternative environment reader, production build or simultaneous build was used. Production rendering remains unverified.

Database tests used PostgreSQL 17.11 in a new UTF-8 task-owned cluster under `/tmp/campusedux-phase2-pg-utf8`, private socket `/tmp/campusedux-phase2-socket`, port 55432, **TCP disabled**, 32 MB shared buffers. PGHOST/PGPORT/PGUSER/PGDATABASE, PGPASSFILE (task-created empty file), PGSERVICEFILE and PSQLRC were explicitly fixed to this local context. Databases were `cx_*`; no remote DB was contacted.

From `mobile-app/supabase/tests/harness/` with that local context:

- `./make_template.sh`: **274 ordered migrations applied**, including mobile/admin twins, plus website migrations and helpers.
- `./run_tests.sh /tmp/campusedux-phase2-sql-tests`: **4 passed / 0 failed**: 119 admin permissions, 155 revisions, 202 premium content, 203 hidden drafts. Temporary `\i` wrapper files preserve original tests' `\ir` paths.
- SQL 155 covers all twelve dependency triggers/events; actual admin inserts, child edits, premium child/topic withholding, unpublished sections/hidden parents, topic/content cascade deletion, Blog category cascade/unpublish/delete/TRUNCATE, transactional rollback, invalid scope, anon revision read and denied table/function operations for anon/student/outsider/admin. A missing revision row proves the original writer fails atomically.
- `python3 /tmp/campusedux-phase2-sql-recovery.py`: passed in disposable `cx_phase2_recovery`: exact prepared rollback retains three rows/removes twelve triggers/revokes anon reader; migration reapplication twice; rerun SQL 155; two concurrent writers produce distinct committed revisions. The clone was removed.
- Initial scratch setup accidentally used SQL_ASCII and failed an existing seed's Unicode JSON before reaching 0155. That cluster was stopped and replaced with UTF-8; no migration was changed to hide the setup error. An initial copied regression test lost its relative include path; wrappers fixed that setup and all four tests passed. The full SQL suite was not run.

Application fixtures use real Supabase builders with fake HTTP and modeled React render lifetime. SQL tests use repository Supabase stubs, not hosted PostgREST. Neither substitutes for hosted staging verification.

## Comparable isolated measurements

`node /tmp/campusedux-phase2-measure.cjs` runs saved Phase 1 loaders from `/tmp/campusedux-phase2-baseline/` versus actual Phase 2 loaders with identical fixtures/builders/projections/arguments. Transpilation/module loading and lazy HTTP initialization happen outside timed samples. Each fake upstream request has a synthetic 5 ms delay. Scenarios use separate module caches and sequential cold/two new-render repeats/revision-change samples. No real network. Blog has the Phase 1 fourteen cards/categories; course navigation has 152 topics; Home includes projects/jobs/CMS fixtures. Counts are upstream requests and response JSON bytes, **not SQL statements, query plans or full wire bytes**.

| Loader group | Cold total requests Phase 1 → 2 | Repeated payload requests Phase 1 → 2 | Repeated total requests Phase 1 → 2 | Repeated response JSON bytes Phase 1 → 2 |
| --- | ---: | ---: | ---: | ---: |
| Blog index: cards/count + categories | 2 → 5 | 2 → 0 | 2 → 1 | 3,917 → 38 |
| Home batch | 5 → 7 | 5 → 1 (jobs) | 5 → 2 | 2,203 → 993 |
| Course: tree/header/two assessment reads | 4 → 8 | 4 → 0 | 4 → 1 | 10,843 → 38 |
| Lesson: tree/body/practice, excluding discovery | 3 → 7 | 3 → 0 | 3 → 1 | 29,886 → 38 |

Each repeated Phase 2 case includes one authoritative revision call, a 38-byte JSON UUID. Total repeated backend-request reductions are Blog 50%, Home 60%, course 75%, lesson 66.7% for these loader groups only. No CPU/SQL/production-throughput extrapolation is justified.

| Loader group | Cold fixture ms Phase 1 → 2 | Two repeated fixture ms Phase 1 → 2 |
| --- | --- | --- |
| Blog | 8.94 → 19.67 | 7.43 / 8.98 → 6.39 / 6.43 |
| Home | 6.74 → 18.86 | 6.87 / 6.57 → 6.96 / 5.83 |
| Course | 7.33 → 20.73 | 7.13 / 6.07 → 6.31 / 6.71 |
| Lesson | 7.79 → 19.07 | 5.58 / 6.81 → 5.48 / 6.52 |

Cold fills regress due to the two-stage verification; writes overlapping fills can fail a request. Small warm differences include timing noise and some slower samples: no robust latency win is claimed. A changed revision refills: Phase 2 requests/bytes are Blog 5/4,031, Home 7/2,279, course 8/10,995, lesson 7/30,038. Content assertions for edits/revocation are independently tested, not inferred from query counts.

## Development-server observations

These are **not an equivalent live before/after benchmark**. The existing localhost:3100 process was reused; a launcher attempt found `EADDRINUSE` and started no duplicate. Its non-secret configured database origin was verified through the server-rendered `dns-prefetch` link, sourced from `NEXT_PUBLIC_SUPABASE_URL` by `website/src/app/layout.tsx`: `https://biktjhenbvnklmagmvav.supabase.co`. Initial public-bundle extraction did not establish identity; the layout contract did. No environment contents or key values were printed.

Three sequential curl HTML-only GETs per route. Separate endpoint diagnostics fetched localhost JavaScript; no external assets were fetched. All timed requests returned 200 with `Cache-Control: no-store, must-revalidate`. First samples are excluded from runtime comparison because compilation state was uncontrolled. No live loader/upstream/SQL counters were installed; these timings do not prove shared reuse.

| Route | First total ms (not comparable cold) | Two repeats total ms | Two repeats TTFB ms | HTML bytes |
| --- | ---: | --- | --- | ---: |
| `/` | 2,754 | 1,432 / 1,058 | 821 / 844 | 308,316 |
| `/learning/java-tutorial` | 3,823 | 1,567 / 1,029 | 1,557 / 1,015 | 232,683 |
| `/blog` | 575 | 809 / 491 | 802 / 485 | 75,707 / 75,664 |

These live repeats are slower than Phase 1's recorded samples, but are not contemporaneous equivalent measurements; missing database support adds checks before otherwise fresh reads. No staging latency gain is claimed. Production Storage references in staging were neither fetched nor rewritten; image loading/LCP is unverified. No production website/project request, load test, authenticated browser action or payment/progress mutation ran.

Temporary evidence: `/tmp/campusedux-phase2-fixture-measure.json`, measurement script/baseline loaders, `/tmp/campusedux-phase2-http.json`, HTML/header files, SQL wrappers/recovery script, initial diff `/tmp/campusedux-phase2-inherited.diff` and initial status `/tmp/campusedux-phase2-inherited-status.txt`. Results are preserved here if temporary files disappear. The task-owned local PostgreSQL cluster is stopped at handoff; the pre-existing dev server is left running.

## Approval, rollback and Phase 3

**Nothing was applied to shared staging.** Needed approval: review and authorize the single logical revision migration **0155 / identical twin 123**, specifically for **staging `biktjhenbvnklmagmvav`**, followed by read-only localhost verification. The user executes any approved shared migration. Confirm staging schema prerequisites/ledger first; do not perform a blanket push that includes unrelated inherited 0152–0154 or other pending work. This does not authorize shared-content test edits, production, deployment or commits.

Review operational costs: one small read per used domain/render; extra cold verification calls; coarse invalidation on every relevant write; revision-row locks may serialize imports/project sales updates. Measure normal write frequency and instance lifetimes before extending reuse. No new index/service or change to existing RLS is proposed.

The executable app-first rollback and the atomic single-owner staging apply procedure are specified below. They supersede the initial suggestion to restore three uncommitted loader files or reapply a migration twin. No shared rollback/application has been executed.

Phase 3 scope after approval: verify hosted anon RPC grants/errors and actual revision/payload request counts/bytes on equivalent Home/course/lesson/Blog reads; confirm Blog pagination/filter/category/metadata behavior and 152-link navigation. Use isolated local SQL for edits/revocation/failures unless disposable staging fixtures are separately approved. Verify cache lifetime across workers/route bundles, concurrent fill scope, eviction/cold costs, normal-write invalidation frequency and revision lock effects. Arrange an independently authorized staging production build in isolation, then verify personalized rendering and browser/CDN/router behavior before considering HTML caching. Storage cleanup/image/LCP requires separate authorization. Jobs/Projects routes, Practice/Interview/coding/sitemap/OG caches and broader discovery optimization remain deferred.


## Narrow Phase 2 reliability correction

This follow-up changes only admission handling, rollback artifacts/tests, migration execution comments and this handoff. It does not start Phase 3. No production connection, shared staging read/write, server restart, browser/load test, commit, deployment, new dependency or infrastructure installation was performed by this correction. The pre-existing localhost server was not touched.

Exact files changed in this correction (all other edits remain inherited):

- `website/src/lib/revisionCache.ts`
- `website/tests/lib/revision-cache.test.ts`
- `website/tests/lib/public-browsing.test.ts`
- `website/tests/lib/public-cache-rollback.test.ts` (new)
- `website/rollbacks/phase-2-public-cache.patch` (new)
- `mobile-app/supabase/migrations/0155_public_content_revisions.sql` (executor/ownership comments only)
- `admin-panel/supabase/migrations/123_public_content_revisions.sql` (identical comments; identical twin)
- `mobile-app/supabase/rollbacks/0155_public_content_revisions_rollback.sql` (precise app-first/transaction/ledger comments only)
- `mobile-app/supabase/tests/harness/verify_public_content_revision_lifecycle.py` (new, isolated verifier)
- `docs/performance/scalability-phase-2.md`

The migration and rollback SQL statements, content RLS and privileges are unchanged by this correction. `revisionedPublicRead.ts` was inspected but is unchanged in the normal application. Its permission/transport/revision failures still fail closed. The new patch is an **inactive rollback artifact**, not a runtime permission fallback.

### Admission and terminal overload

Limits are **32 active fills, 64 queued distinct fills, 2 seconds maximum queue residence** per cache instance. Storage remains 128 entries / 16 MiB serialized bytes. Existing-key callers join a pending active/queued fill rather than consuming another slot. Hits use the already verified key. A new miss enters the FIFO queue only if capacity is available. No path launches an unbounded uncached read to evade the limits. Failed fills drain the queue too; queued expiry never starts the expired loader and permits a subsequent retry.

`PublicContentOverload` carries a `queue-full` or `deadline` reason. It propagates from storage through `revisionedPublicRead` and the page/metadata loaders into the existing `website/src/app/error.tsx` boundary, which renders the shared retry error state. It is never converted into `notFound()`, an empty successful listing or stale content. A streamed response may already have sent HTTP 200 before that boundary renders; this is **not a guarantee of HTTP 503**.

The deadline bounds admission wait, not an active upstream query's lifetime. A slow/hung upstream can occupy active capacity until it settles; queued requests then expire. Joiners belong to the same queued-fill deadline rather than getting fresh deadlines. The queue bounds stored payload-fill work, not total inbound requests or all server resources. Fresh render revision checks happen before admission and remain outside this payload-fill queue; these limits do not bound all RPC traffic. Nested cold dependencies can also wait for capacity and hit the same deadline. This mechanism does not eliminate terminal overload under arbitrary traffic. Revision checks before enqueueing and after fills are retained; a write while queued can cause a revision-change rejection rather than a stale response.

### Durable app-first rollback (future operator action only)

The checked-in `website/rollbacks/phase-2-public-cache.patch` modifies **only** `website/src/lib/revisionedPublicRead.ts`, replacing revision/process-cache use with `React.cache` plus the existing fresh anonymous client and callback. It contains the complete fresh implementation, independent of Git history or temporary Phase 1 snapshots. All Blog/learning/Home projections, scalar memo keys, navigation/pagination improvements, dynamic routes and unrelated edits remain. The current malformed-result guards remain too. No revision RPC is called, even if it is still installed. Five Home reads run on each new render again.

From repository root, preflight the artifact with `git apply --check website/rollbacks/phase-2-public-cache.patch`; this does not change source. Execute the remaining steps only after a separately approved rollback.

1. First stop accepting new requests and drain/stop **every** old website worker using the actual launcher/process owner. For local staging, use the terminal running `./start-staging.sh website` to stop the launcher and its Next children; confirm no listener remains on port 3100. Do not blindly kill a remembered PID or unrelated server. Keep the SQL revision contract intact while any old worker can still run.
2. Apply the reviewed artifact with `git apply website/rollbacks/phase-2-public-cache.patch`. If it fails its context check, stop and prepare a fresh isolated patch against the current wrapper; do not use a full-file reset or discard unrelated work. Inspect that the diff touches only this helper. The normal cache tests expect reuse and will intentionally no longer describe rollback mode; the dedicated rollback test exercises this artifact.
3. Start a **new** staging website process with `./start-staging.sh website`; confirm the non-secret server-rendered origin remains `https://biktjhenbvnklmagmvav.supabase.co`. A new process/module graph must load the patched helper; editing files or relying on HMR alone is insufficient. Verify fresh-read behavior while the revision RPC is still callable. Old process caches must no longer be serving traffic.
4. Only after that app-first cutover, execute the SQL rollback as one complete file with `psql -X -v ON_ERROR_STOP=1 -f mobile-app/supabase/rollbacks/0155_public_content_revisions_rollback.sql` using the operator's separately approved staging connection reference. **Do not add `--single-transaction`**: this rollback already owns its `BEGIN`/`COMMIT`. Never use an inherited/default production connection. No connection credentials are requested or included here.
5. Verify anon RPC execution is denied and all twelve new triggers are absent, while revision rows/content remain. The restarted fresh-read app continues without that RPC. An undrained normal Phase 2 worker would fail with 42501; that error remains fail-closed and is explicitly tested. A failed SQL rollback leaves the fresh-read app working and can be retried after diagnosis; do not restore the cached app as an automatic fallback.

Keep canonical ledger version `0155` applied: it records a migration that actually executed. Do not mark it reverted to force replay, manufacture admin `123`, or run a twin to resume. Re-enabling after rollback requires a separately reviewed forward migration and app cutover. Rollback currently targets the authorized localhost staging process only; no hosting/deployment convention is assumed.

### Atomic staging apply and ledger ownership — current preflight PASS

The current executor, actual identity/schema/ledger evidence, exact temporary bundle, reviewed hash and operator command are recorded at the top of this handoff. CLI 2.122.0 was verified without installing/downgrading. The authenticated read-only preflight passed under the user's explicit internal-stored-auth exception; earlier authentication blocks are historical and resolved.

There is one shared database and native ledger. Only canonical mobile 0155 is pending in the isolated bundle. Admin 123 remains a reference/harness twin, and all unrelated pending repository work is excluded. Native SQL/ledger batching applies to the unchanged 0155 as explained above. The migration body must not receive extra transaction control; the separate SQL rollback owns its BEGIN/COMMIT and remains app-first. No migration or rollback was executed by this preflight.

### Prepared read-only post-apply checks — not executed

After a future verified apply, use the **same explicitly verified staging session**. These catalog/metadata checks are prepared for review; they neither establish preflight PASS nor authorize application. They intentionally return scopes/counts/privilege booleans rather than content or revision UUID values.

```sql
begin read only;
-- Expect canonical 0155 with the expected migration name. Never manufacture 123.
select version, name
from supabase_migrations.schema_migrations
where version in ('0155', '123')
order by version;

-- Expect exactly blog, home, learning (three rows total).
select scope from public.public_content_revisions order by scope;

-- Expect 12 matching enabled statement triggers for all four write events.
with expected(scope, relation) as (values
  ('learning','learning_grids'), ('learning','learning_sections'),
  ('learning','learning_topics'), ('learning','learning_contents'),
  ('learning','practice_tests'), ('learning','dsa_problems'),
  ('blog','blog_posts'), ('blog','blog_categories'),
  ('home','projects'), ('home','testimonials'), ('home','faqs'), ('home','banners')
)
select count(*) as enabled_revision_triggers
from expected e
join pg_trigger t on t.tgrelid = to_regclass('public.' || e.relation)
 and t.tgname = 'public_revision_' || e.scope
where not t.tgisinternal and t.tgenabled = 'O' and t.tgtype = 60
 and t.tgfoid = 'public.bump_public_content_revision()'::regprocedure;

-- Reader: true only for anon. Trigger executor and any table privilege: false.
select role_name,
 has_function_privilege(role_name, 'public.public_content_revision(text)', 'EXECUTE') as reader,
 has_function_privilege(role_name, 'public.bump_public_content_revision()', 'EXECUTE') as trigger_executor,
 has_table_privilege(role_name, 'public.public_content_revisions',
   'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') as any_table_privilege
from (values ('anon'), ('authenticated'), ('service_role')) as roles(role_name);

-- Expect RLS true, zero client policies, both functions SECURITY DEFINER
-- with fixed pg_catalog search_path; inspect metadata without executing them.
select c.relrowsecurity as rls_enabled,
 (select count(*) from pg_policy p where p.polrelid = c.oid) as policies
from pg_class c where c.oid = 'public.public_content_revisions'::regclass;
select p.proname, p.prosecdef, p.proconfig
from pg_proc p
where p.oid in ('public.public_content_revision(text)'::regprocedure,
               'public.bump_public_content_revision()'::regprocedure);
rollback;
```

Any missing object, unexpected privilege, extra/missing scope, trigger mismatch or conflicting ledger version is a failed check, not permission to repair/replay. The app-first rollback patch and SQL procedure above remain available and were not executed.

### Correction verification and remaining live work

Final correction checks:

- From `website/`: `npm test -- tests/lib/public-cache-rollback.test.ts tests/lib/public-browsing.test.ts tests/lib/revision-cache.test.ts tests/lib/listing-indexing.test.ts --maxWorkers=1 --minWorkers=1`: **4 files / 66 tests passed**, no skipped cases. This includes default 32+64/2-second bounds, active/queued joining, FIFO admission, overflow with no uncached bypass, deadline expiry/delayed timers, failed fills and recovery; actual page/metadata overload propagation and retry boundary; permission removal fail-closed; and the durable rollback patch applied in a scratch tree against actual Blog/Home/Learning loaders.
- The first scratch-patch test attempt was blocked by sandbox child-process `spawnSync git EPERM`. Rerunning the same focused test with scoped escalation allowed Git to apply only inside the temporary test tree; the workspace wrapper was never patched. No branch/commit operation was involved.
- Final `npm run typecheck`: passed. `npm run lint`: passed, no ESLint warnings/errors. `git diff --check`, byte-identical twin check and `git apply --check website/rollbacks/phase-2-public-cache.patch`: passed. Inherited tracked diffs match the correction's initial snapshot byte-for-byte; the normal `revisionedPublicRead.ts` is unchanged.
- `python3 mobile-app/supabase/tests/harness/verify_public_content_revision_lifecycle.py --socket /tmp/campusedux-phase2-socket --port 55432`: **3 verification groups passed**. Fresh-install fault injection after grants, inside trigger installation and after token rotation leaves no revision table/functions/triggers; failed reinstall preserves tokens/12 triggers/anon grant; SQL 155 plus the exact rollback preserves metadata and denies anon RPC execution while removing all 12 triggers. Each run uses and removes a `cx_revision_lifecycle_*` clone of the previously verified ordered-harness `cx_tpl` in the same task-owned local UTF-8 PostgreSQL 17 cluster, TCP disabled. No shared database is contacted, no credential stores are used, and no new ledger entries are fabricated even in this verifier.
- The full chain/template was not rebuilt in this correction: comparison confirmed the migration/rollback SQL statements are unchanged, and the previously ordered 274-migration template already supplies the same prerequisites. Fault-injected SQL runs use `psql --single-transaction`; rollback SQL runs without that flag because it owns its transaction. This verifies local SQL atomicity, **not an execution of the unavailable native CLI or its live hosted ledger**; that executor was inspected in pinned primary source.
- The scratch-process/app-module test validates ordering and behavior, not a real server/process-manager restart. No shared staging rollback, native migration command or live process change ran. The local test PostgreSQL cluster was stopped after verification. No full website suite, production build, browser test or load test was repeated.

The prior Phase 2 latency/request tables remain historical measurements; this correction does not rerun or reinterpret them as a capacity or live-latency claim. Remaining live work is unchanged: after separate staging approval, verify the hosted native transaction/ledger result, public RPC permissions and actual cold/repeated payload/revision traffic; verify process lifetime and queue behavior under a small defined workload. No Phase 3 work has started, no shared staging rollback/apply occurred, and production remains excluded.
