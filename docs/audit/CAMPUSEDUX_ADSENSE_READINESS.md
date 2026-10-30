# CampusEduX Google AdSense readiness audit

**Audit date:** 23 October 2026 (UTC)  
**Scope:** read-only repository audit of `/home/ganeshp8545/CampusEduX`, with emphasis on `website/` and the Supabase content migrations consumed by the website.  
**Decision:** **NOT READY for an AdSense application or ad-code rollout.** This is not a prediction of Google's decision and no approval is guaranteed.

## Executive summary

The website is a Next.js 14 App Router application backed by Supabase. It has a broad public surface, good baseline technical SEO, crawlable server-rendered content, self-canonicals on the principal public pages, a sitemap index with seven child sitemaps, sensible `noindex` handling for most empty/private routes, a working analytics-consent implementation, responsive Tailwind layouts, and extensive legal navigation.

Three confirmed issues should stop an AdSense submission:

1. **The site markets ready-made and custom academic projects for a student's own submission.** Google's publisher policy prohibits monetizing content that enables dishonest behavior, including sale/distribution of term papers or exam-taking services. The exact CampusEduX classification requires Google's judgment, but the repository language creates a material, direct policy risk (P0-01).
2. **Large public content clusters have unresolved authorship/licensing.** Repository comments explicitly say that AI/ML, Generative AI, Java interview, and Python interview material was copied verbatim from source works, while no author, publisher, permission, or license is recorded. Google also disallows ads on copied/replicated content without added value (P0-02).
3. **206 of 207 Generative AI lessons contain the same two generic paragraphs.** They are currently protected by `noindex` and sitemap exclusion, which is good, but remain public and demonstrate a large templated corpus. They should be rewritten or unpublished before review (P0-03).

The current site does **not** load AdSense code. Its privacy/cookie disclosures therefore accurately say advertising cookies are not in use. Before ads are enabled, the consent UI, disclosures, CSP, and publisher record all need an ad-specific implementation. A blank `ads.txt` is not evidence of a defect before a publisher ID exists; publishing a fabricated ID would be worse.

## Method and evidence limits

- Inspected the application framework/configuration, 81 `page.tsx` routes, route handlers, middleware, metadata, robots, sitemap construction, content loaders, legal JSON, analytics consent, responsive layout primitives, and the SQL migration corpus that seeds learning, practice, interview, blog, jobs, projects, and premium data.
- Scanned source literals for internal links and compared them with App Router routes/redirects. No confirmed missing static internal route was found. Dynamic targets and CMS-authored URLs still require a live crawl.
- Recomputed both Generative AI template markers directly from migration `0069`: **206 occurrences each**.
- Did not query production Supabase, use a Google/AdSense account, submit the site, alter a deployment, or perform a production crawl. Production publication state, HTTP behavior, actual row counts, licenses, traffic sources, and account status are therefore clearly marked **LIVE/ACCOUNT VERIFICATION**.
- Prior audit documents were used only as leads; current source superseded several older findings. In particular, GA4 is now consent-gated and empty free lessons/interview topics now resolve to `noindex`/404 behavior.

Google references used for policy interpretation:

- [Google Publisher Policies](https://support.google.com/adsense/answer/10502938?hl=en) — dishonest behavior, low-value/no-content screens, replicated content, ad interference, and privacy disclosures.
- [AdSense program policies](https://support.google.com/adsense/answer/48182?hl=en) — invalid interactions, deceptive navigation, non-content pages, and placement rules.
- [Pages ready for AdSense](https://support.google.com/adsense/answer/7299563?hl=en&ref-topic=1319756) — unique/relevant content and clear navigation.
- [Required privacy content](https://support.google.com/adsense/answer/1348695?hl=en) — Google advertising cookies and opt-out disclosures.
- [Google CMP requirement](https://support.google.com/adsense/answer/13554116?hl=en) — certified CMP/TCF requirements for relevant EEA, UK, and Swiss ad traffic.

## Architecture, content sources, and public surface

### Framework and rendering

| Area | Confirmed repository finding | Evidence |
|---|---|---|
| Framework | Next.js 14.2.35, React 18.3, TypeScript, App Router | `website/package.json:15-29`; `website/src/app/` |
| Styling/mobile | Tailwind CSS with mobile-first breakpoints; root provides skip link, responsive bottom nav spacer, responsive fonts | `website/package.json:37-43`; `website/src/app/layout.tsx:79-110` |
| Data | Supabase SSR/public clients; catalog and CMS data are fetched server-side and cached/ISR | `website/package.json:18-19`; `website/src/lib/cache.ts:175-233`; `website/src/lib/sitemap/data.ts:78-232` |
| Content origin | Static TSX/legal JSON plus Supabase rows seeded largely by `mobile-app/supabase/migrations/` | `website/src/legal/content/`; migration evidence below |
| SEO | Route metadata, JSON-LD, sitemap index/children, `robots.ts`, redirects | `website/src/app/layout.tsx:42-62`; `website/src/app/robots.ts:10-33`; `website/src/lib/sitemap/build.ts:18-365`; `website/next.config.js:74-105` |

### Public/indexable families

| Family | Principal URLs | Source | Anonymous/index behavior |
|---|---|---|---|
| Home/static | `/`, `/about`, `/contact`, `/support`, `/faq`, `/compiler`, `/resume`, `/resume/templates` | TSX plus CMS rows for home/FAQ/templates | Generally indexable; FAQ noindexes when empty (`website/src/app/faq/page.tsx:21-29`) |
| Learning | `/learning`, `/learning/[gridSlug]`, `/learning/[gridSlug]/[topicSlug]` | learning RPCs/tables and SQL seed migrations | Free bodies render server-side; premium bodies are withheld; empty free topics 404/noindex; known templated GenAI topics noindex (`website/src/app/learning/[gridSlug]/[topicSlug]/page.tsx:72-103,106-120,193-282`) |
| Coding/practice | `/practice`, `/practice/problems`, `/practice/problems/[slug]`, `/coding-problems/[problemSlug]`, interview Q&A routes | `dsa_problems`, practice RPCs, interview tables/migrations | Practice problems have no thin-content test; topic-linked coding problems do (`website/src/app/practice/problems/[slug]/page.tsx:25-56`; `website/src/app/coding-problems/[problemSlug]/page.tsx:45-63`) |
| Blog | `/blog`, `/blog/[slug]` | `blog_posts`/`blog_categories`; seed migrations `0065`–`0067` | Published posts only; author/date shown; external canonical supported (`website/src/app/blog/[slug]/page.tsx:42-78,128-180`) |
| Projects | `/projects`, `/projects/[id]`, categories, trending | `projects`, `categories`, `reviews` | Public commercial pages; thin detail rows are still indexable (`website/src/app/projects/[id]/page.tsx:53-64,138-146`) |
| Jobs | `/jobs`, `/jobs/[id]`, company routes | `jobs`, `companies` | Active jobs indexable; closed jobs noindex; empty company/list pages noindex (`website/src/app/jobs/[id]/page.tsx:45-50`; `website/src/app/jobs/companies/[id]/page.tsx:25-35`) |
| Premium/referral | `/premium`, `/referral` | `premium_*`, `reward_settings` | Noindex when no configured inventory (`website/src/app/premium/page.tsx:39-47`; `website/src/app/referral/page.tsx:12-20`) |
| Custom projects | `/custom-projects`; authenticated wizard/order URLs | pricing/feature/request tables | Landing page indexable; builder, checkout, and customer projects noindex and robots-disallowed (`website/src/app/custom-projects/page.tsx:9-13`; `website/src/app/robots.ts:17-21`) |
| Legal | `/legal`, `/privacy-policy`, `/terms`, `/refund-policy`, `/project-license`, `/community-guidelines`, `/disclaimer`, `/cookie-policy`, `/data-and-permissions`, `/delete-account`, `/grievance`, `/contact` | legal JSON/config and composed pages | Public, canonical, linked in footer/hub (`website/src/components/Footer.tsx:67-87`; `website/src/app/legal/page.tsx:25-72`) |
| Private/utility | `/account/**`, auth/onboarding, submissions, test results, `/r/[token]`, search | user data/tool flows | Mostly `noindex`; private prefixes disallowed where appropriate (`website/src/app/account/layout.tsx:7`; `website/src/app/robots.ts:10-22`) |

## Prioritized findings

### P0 — resolve before applying

#### P0-01 — Academic-project offering creates an enabling-dishonest-behavior policy risk

**Affected URLs:** `/about`, `/custom-projects`, `/projects`, `/projects/[id]`, `/project-license`.

**Confirmed evidence:**

- The About page markets ready-made final-year/mini projects and custom-built projects to students (`website/src/app/about/page.tsx:20-24,31-42`).
- The custom-project landing page calls itself “Custom Final Year Projects for Students,” includes an `academic` project type, accepts requirements, takes payment, and promises that the CampusEduX team will build and deliver the work (`website/src/app/custom-projects/page.tsx:9-23,26-30,72-85`).
- The license explicitly grants a single student use “for their own academic submission,” including mini-project, major project, lab work, or internship report (`website/src/legal/content/project-license.json:11-16`).
- A later restriction prohibits dishonest authorship (`project-license.json:44-51`), but it does not remove the preceding offer to supply submission-ready academic work.

**Risk:** Google Publisher Policies prohibit monetizing content that helps users mislead others and give sale/distribution of term papers and exam-taking services as examples. CampusEduX is not literally described as a term-paper service, so this report does not declare a violation; however, building paid academic submissions for students is close enough that it is a genuine P0 policy-classification risk.

**Action:** Obtain a written policy determination from Google/qualified counsel before submission. The safest product remediation is to stop selling work for academic submission: reposition projects as tutorials/starter kits, require meaningful student-authored adaptation, remove “own academic submission” permission, prohibit assessment outsourcing, add an academic-integrity gate to requests, and keep ads off all project/custom-project commerce pages unless eligibility is resolved. Copy-only disclaimers are not sufficient if the service behavior remains unchanged.

#### P0-02 — Verbatim content clusters have no recorded ownership or republication license

**Affected URLs:** `/learning/ai-ml-notes/**`, `/learning/generative-ai/**`, `/practice/interview-questions/java/**`, `/practice/interview-questions/python/**`; potentially `/learning/java-tutorial/**` and `/learning/python-tutorial/**` pending owner evidence.

**Confirmed evidence:**

- AI/ML: the seed says 77 bodies and 690 questions were copied verbatim from `AI_ML_Complete_All_10_Modules.md`; it does not name the author/license (`mobile-app/supabase/migrations/0068_seed_ai_ml_notes_content.sql:19-41`).
- Generative AI: 207 lesson bodies and related tests/problems are described as verbatim copies from `Generative_AI_Full_Syllabus_Detailed_Notes.md`, with no author/license recorded (`mobile-app/supabase/migrations/0069_seed_generative_ai_tutorial_content.sql:7-39`).
- Java interviews: the reconciliation makes the public bank exactly 121 source questions from an “original 240-entry Java Interview Master Guide,” including verbatim insertions, but does not identify author, publisher, or license (`mobile-app/supabase/migrations/0108_interview_questions_source_reconciliation.sql:11-43,62-71`).
- Python interviews: all 240 entries are described as source text verbatim from “Python Interview Master Guide — 240 Questions,” again without author/publisher/license (`mobile-app/supabase/migrations/0109_seed_interview_python_batch1.sql:10-27`; same declaration continues in `0110`–`0112`).
- Java tutorial identifies `core-java-full-course.md` as its source but provides no authorship/license record (`mobile-app/supabase/migrations/0047_seed_java_tutorial_content.sql:3-20`). Python says chapters came from authored source files but does not identify those files or their rights holder (`mobile-app/supabase/migrations/0050_seed_python_tutorial_content.sql:11-24`).
- Public lesson/interview pages do not display a source, license, reviewer, or author (`website/src/app/learning/[gridSlug]/[topicSlug]/page.tsx:193-230`; `website/src/app/practice/interview-questions/[category]/[topic]/page.tsx:95-132`).

**Risk:** copyright/IP exposure and Google's replicated-content policy. No infringement is asserted; the repository simply does not establish the right to republish or the added value required for monetized copied content.

**Action:** For every cluster, obtain and retain source title/URL, creator, license/permission, permitted commercial use, CampusEduX editor/reviewer, and review date. Unpublish or exclude unresolved verbatim clusters from ad inventory. Where permission exists, add original analysis, worked examples, exercises, corrections, citations, author/reviewer bylines, and source/license disclosure. Do not claim CampusEduX authorship without evidence.

#### P0-03 — 206 public Generative AI lessons are mass-templated

**Affected URLs:** `/learning/generative-ai/[topicSlug]` for 206 seeded unit topics; the single summary topic is intentionally exempt.

**Confirmed evidence:** direct counts in `mobile-app/supabase/migrations/0069_seed_generative_ai_tutorial_content.sql` found 206 copies each of “The important lesson is that the technique is a component of a larger system” and “Suppose a student is building an AI learning assistant” (first examples at lines 297/316, 427/446, 557/576). The code itself records the 206/207 finding (`website/src/lib/contentQuality.ts:7-23`).

**Existing mitigation:** matching pages receive `noindex,follow` (`website/src/app/learning/[gridSlug]/[topicSlug]/page.tsx:83-103`) and are excluded from the learning sitemap (`website/src/lib/sitemap/data.ts:91-99,114-139`; `website/src/lib/sitemap/build.ts:123-149`).

**Residual risk/action:** `noindex` prevents search promotion but does not make thin/template content valuable to an AdSense site review. Rewrite each topic with topic-specific explanation, runnable/reproducible example, limits/failure cases, exercise, citations, and human review, or keep it unpublished. Do not merely vary synonyms or titles.

### P1 — high-priority readiness work

#### P1-01 — Future AdSense consent and privacy implementation does not yet exist

**Affected URLs:** all pages where ads may eventually appear; `/privacy-policy`, `/cookie-policy`.

**Confirmed current behavior:** GA4 defaults all consent signals to denied and loads only after analytics consent (`website/src/components/analytics/GoogleAnalytics.tsx:14-65`). The banner always saves `ads: false` and exposes no advertising choice (`website/src/components/analytics/CookieConsent.tsx:27-55,72-99`). Consent utilities likewise state advertising remains off (`website/src/lib/cookieConsent.ts:1-32`). The policies accurately say there are currently no advertising cookies or third-party advertising (`website/src/legal/content/cookie-policy.json:5-7,38-64`; `website/src/legal/content/privacy-policy.json:105-118,150-157`).

**Gap:** before ad serving, those statements would become false; the current banner is not a Google-certified TCF CMP and cannot collect ad consent. Google's current policy also requires disclosures about third-party ad cookies/web beacons/IP identifiers and personalized-ad opt-out.

**Action:** Only when AdSense is actually being integrated: select a Google-certified CMP appropriate to traffic, implement regional behavior and revocation, wire `ad_storage`, `ad_user_data`, and `ad_personalization`, block ad requests until the applicable choice exists, and update privacy/cookie pages with the real vendors/technologies and Google Ads Settings/partner-use link. Have counsel assess jurisdictions; do not prematurely claim ads are active.

#### P1-02 — Project detail pages can be indexable with no substantive description

**Affected URLs:** `/projects/[id]`; propagated into `/projects`, categories, trending, and project sitemap.

**Evidence:** metadata always indexes an existing row and falls back to a generic description (`website/src/app/projects/[id]/page.tsx:53-64`). The body renders “No description provided yet” (`:138-146`). List/detail/sitemap queries have no explicit publication/status or quality predicate (`website/src/lib/cache.ts:175-195,258-291`; `website/src/lib/sitemap/data.ts:199-208`; `website/src/lib/sitemap/build.ts:274-295`). Anonymous RLS may hide drafts, but deployed RLS is not proven here.

**Action:** Add an explicit publishable-state and quality predicate at the authoritative query/RPC layer. `noindex` and omit from sitemap when description is absent/too short or required facts/files/license are missing. Require original scope, setup, screenshots, deliverables, compatibility, limitations, author/vendor, and license provenance before publication.

#### P1-03 — Practice-library problems lack the thin-content safeguard used by topic coding problems

**Affected URLs:** `/practice/problems/[slug]` and `/sitemaps/problems.xml`.

**Evidence:** topic coding problems are noindexed when examples, constraints, and starter code are all absent (`website/src/app/coding-problems/[problemSlug]/page.tsx:45-63`; shared rule at `website/src/lib/contentQuality.ts:25-41`). Global practice problems have no equivalent metadata quality check (`website/src/app/practice/problems/[slug]/page.tsx:25-56`), and all rows returned by `practice_problems_sitemap` are emitted (`website/src/lib/sitemap/data.ts:141-163`; `website/src/lib/sitemap/build.ts:182-199`). Migration `0068` explicitly created 196 problems without examples, constraints, starter code, test cases, or solutions (`mobile-app/supabase/migrations/0068_seed_ai_ml_notes_content.sql:34-41`); their current table/RPC routing requires live verification.

**Action:** Apply one shared completeness classifier to both problem families and the sitemap. Require a clear statement, input/output, constraints, at least one validated example, judge cases for “Run Tests,” supported-language starter code, and reviewed solution/explanation before indexing.

#### P1-04 — Job provenance, freshness, and structured-data accuracy are not visible to users

**Affected URLs:** `/jobs/[id]`, `/jobs`, `/jobs/companies/[id]`.

**Evidence:** pages display posted time and an external company-site button, but no “source,” “verified,” or last-checked field (`website/src/app/jobs/[id]/page.tsx:188-211,140-146`). The disclaimer says listings may originate from third parties and be inaccurate (`website/src/legal/content/disclaimer.json:15-17`). `JobPosting.description` falls back to the title and `jobLocation.address` falls back to the unstructured string “India” (`website/src/app/jobs/[id]/page.tsx:115-137`), which can yield thin or imprecise structured data.

**Action:** Store/display employer/source URL, source name, fetched/verified date, and editorial owner. Require a substantive description before indexing; validate employer authorization and expiry. Model postal address/remote applicant region correctly or omit unsupported structured fields. Compare live schema with Google's Rich Results Test.

#### P1-05 — Academic/technical content has no public author or review attribution

**Affected URLs:** all `/learning/**`, coding problems, mock tests, and interview topics.

**Evidence:** lesson header contains course/section/read time/premium state but no author, reviewer, citations, or review date (`website/src/app/learning/[gridSlug]/[topicSlug]/page.tsx:193-230`). Interview Q&A similarly presents answers without attribution (`website/src/app/practice/interview-questions/[category]/[topic]/page.tsx:95-132`). Blog is better: it displays an author and dates (`website/src/app/blog/[slug]/page.tsx:128-151`), although a generic team fallback is allowed (`website/src/lib/blog.ts:86`). About contains an explicit unresolved TODO for verified founder background/editorial process (`website/src/app/about/page.tsx:15-19`).

**Action:** Publish real contributor/reviewer profiles, qualifications or experience where relevant, editorial/source policy, corrections process, and reviewed/updated dates. Attribute technical claims to primary documentation. Do not fabricate biographies or credentials.

#### P1-06 — AdSense cannot run under the current CSP (expected pre-integration)

**Affected URLs:** sitewide once ad code is added.

**Evidence:** CSP permits self, Razorpay, GA, and Supabase only; AdSense script/frame/connect/image hosts are absent (`website/next.config.js:15-39`). No AdSense script or slot was found in `website/src`.

**Action:** After account/site setup, follow Google's current CSP guidance, preferably nonce-based and tested first with `Content-Security-Policy-Report-Only`. Add only observed/documented hosts; retain `frame-ancestors`, `object-src`, and checkout protections. Test ads, consent states, and payment flows in production-like builds.

#### P1-07 — Legal copy must be reconciled with the web product and dynamic prices

**Affected URLs:** `/terms`, `/privacy-policy`, `/refund-policy`, `/legal`, `/premium`, `/custom-projects`.

**Evidence:** Terms define the service primarily as the mobile application and describe cancellation/delivery “from/within the app,” despite website purchase flows (`website/src/legal/content/terms.json:5-7,80-105`). Privacy deletion likewise leads with an app-only path (`website/src/legal/content/privacy-policy.json:170-175`). Terms hard-code custom-project token amounts (`terms.json:39-43`) while the public page reads prices dynamically (`website/src/app/custom-projects/page.tsx:38-59,109-127`). The registered address contains “Pune” twice (`website/src/legal/legal.config.json:4-13`), which may be valid but needs owner verification.

**Action:** Have the owner/counsel reconcile web/app terminology, cancellation/deletion routes, current dynamic pricing, tax/subscription behavior, legal identity/address, and functioning inboxes. Prefer versioned referenced pricing over hard-coded figures that can drift.

### P2 — quality and operational improvements

#### P2-01 — About and Support are thin trust pages

**Affected URLs:** `/about`, `/support`.

**Evidence:** About is concise and contains an owner TODO for background, credentials, editorial process, and sources (`website/src/app/about/page.tsx:15-19`); Support is essentially a four-link gateway (`website/src/app/support/page.tsx:12-22`). Both are indexable.

**Action:** Add verified operator history, editorial/quality process, corrections policy, direct support expectations, common troubleshooting, refund/account/deletion escalation, and dates. Alternatively `noindex` Support if it remains a navigation-only utility. There is no Google-mandated minimum word count; the issue is usefulness/trust, not a numeric threshold.

#### P2-02 — Company and project ratings/testimonials need provenance checks

**Affected URLs:** `/`, `/projects/[id]`, `/jobs/companies/[id]`.

**Evidence:** the home page reads testimonials from CMS (`website/src/app/page.tsx:41-49,79-100`); project reviews fall back to “CampusEduX student” (`website/src/app/projects/[id]/page.tsx:33-50`); company rating is shown without a source (`website/src/app/jobs/companies/[id]/page.tsx:67-80`).

**Action:** Verify consent and genuine experience for testimonials/reviews, disclose moderation, and store the source/method for company ratings. Remove or label data that cannot be substantiated. **LIVE VERIFICATION:** inspect all currently published rows.

#### P2-03 — Static link scan passed, but dynamic/CMS links still need a live crawl

**Affected URLs:** all dynamic pages, lesson attachments/videos, banners, job apply links, company sites, blog images.

**Confirmed:** source-literal link comparison found no missing static App Router target. Redirected legacy paths are centralized (`website/next.config.js:74-105`; `website/src/lib/contentRedirects.json`). `safeHref` is used on key CMS external URLs.

**Unverified:** database-generated IDs/slugs, attachments, external targets, redirect chains, HTTP status, orphan pages, and canonical response headers.

**Action:** run a signed-out production crawl over every sitemap URL and every internal link; fail on 4xx/5xx, redirect loops/chains, mixed content, invalid fragments, external malware/scam destinations, canonical mismatch, or link to noindex/unauthorized content.

#### P2-04 — Mobile implementation looks intentional, but ad-era responsiveness is unverified

**Confirmed:** responsive grids/breakpoints are pervasive; root reserves mobile bottom-nav space (`website/src/app/layout.tsx:101-107`); project detail reserves bottom space for a fixed purchase bar (`website/src/app/projects/[id]/page.tsx:93-94,194-202`); the cookie dialog is viewport-bounded and positioned above mobile navigation (`website/src/components/analytics/CookieConsent.tsx:59-63`).

**Risk:** a future anchor/sticky ad could overlap the bottom nav, purchase CTA, cookie banner, compiler controls, “Apply,” “Run,” download, or payment interactions. Google prohibits ads adjacent to action/navigation items where unintended clicks may occur.

**Action:** reserve responsive ad dimensions and test 320/375/768/1024/1440 px, 200% zoom, keyboard navigation, slow loading, accepted/rejected consent, CLS, and orientation change. Exclude compiler/editor, checkout, account/private communication, test runner/result, premium gates, and other non-content/action-heavy screens from ads.

#### P2-05 — `ads.txt` is deliberately blank and needs account-time verification

**Affected URL:** `/ads.txt`.

**Evidence:** the file contains comments only and explicitly waits for a verified publisher record (`website/public/ads.txt:1-2`). `app-ads.txt` is likewise intentionally blank (`website/public/app-ads.txt:1-2`).

**Action:** do not invent a publisher ID. After AdSense supplies the exact record, publish it at the canonical host's root and verify a 200 plain-text response with no redirect/content mismatch. Confirm authorization status in AdSense. This is an account/deployment task, not a current source-code failure.

## Technical SEO and policy-control audit

| Control | Repository result | Remaining verification/action |
|---|---|---|
| `robots.txt` | **Pass (source):** allows public site and disallows account/auth/API/referral-token/submissions/custom-project private flows; sitemap points to absolute index (`website/src/app/robots.ts:10-33`) | Fetch production `/robots.txt`; ensure no CDN/WAF override and correct canonical hostname |
| Sitemap | **Pass with content caveats:** index plus static, learning, problems, interview, jobs, projects, blog; pagination avoids 1,000-row truncation; redirected/thin known URLs excluded (`website/src/lib/sitemap/data.ts:54-73,224-270`; `website/src/lib/sitemap/build.ts:339-365`) | Live counts/RPC visibility, status codes, canonical equality, P1-02/P1-03 quality rules |
| Canonicals | **Generally pass:** principal static/dynamic families define self-canonical; blog supports external canonical (`website/src/app/blog/[slug]/page.tsx:42-58`) | Crawl all indexable URLs; reject malformed/cross-domain canonicals unless editorially intentional |
| Metadata | **Generally pass:** route-specific titles/descriptions and OG metadata exist across primary families | Validate rendered uniqueness and lengths against live rows; missing/duplicated CMS values remain possible |
| `noindex` | **Good baseline:** private/auth/search/test/submission flows and most empty states are excluded; GenAI templates/thin topic problems excluded | Practice problems and thin projects need parity; test failure states so transient DB errors do not emit indexable empty shells |
| Redirects/duplicates | **Good:** legacy placements, duplicate filtered-project URLs, compiler alias, content duplicate list, and OG alias redirect centrally (`website/next.config.js:74-105`) | Live chain/status validation and review `contentRedirects.json` destinations |
| Structured data | **Present:** Organization/WebSite, Article, Course/TechArticle, FAQ, JobPosting, Product, breadcrumbs | Validate every live type. Fix job address/description and avoid ratings without support |
| Navigation | **Pass (source):** header/footer and contextual navigation cover major public families; legal pages are directly discoverable (`website/src/components/Footer.tsx:41-87`) | Live keyboard/mobile/crawl test |
| Analytics consent | **Pass for current GA-only behavior:** default denied; no tag before opt-in; revocable in footer | Geographic/live browser verification; future ads require certified ad CMP as applicable |
| Privacy disclosures | **Pass for current no-ad implementation; fail for future AdSense without changes** | Update only alongside actual ad integration (P1-01) |
| Ad code/placement | **Not implemented** | No placement compliance can be confirmed; design exclusions before rollout |
| `ads.txt` | **Pending account setup, not fabricated** | Publish exact Google-issued line after account/site setup |

## Content-family audit and disposition

| Family | Confirmed source-code assessment | Disposition before AdSense |
|---|---|---|
| Courses/lessons | Java 150-topic import; Python multi-batch course; AI/ML 77 verbatim bodies plus 196 incomplete problems; GenAI 207 topics, 206 templated; DBMS explicitly claims original authoring; Spring Boot large authored seed. Public pages have empty/template controls but no attribution | Resolve rights for Java/Python/AI/ML/GenAI; rewrite/unpublish GenAI; sample every course for correctness, duplicate shingles, runnable examples, citations, and publication state |
| Coding problems | Topic problem thin-check exists; global practice thin-check absent; several imports explicitly omit tests/starter/solutions | Add shared quality gate; execute every example/hidden case per supported language; noindex incomplete rows |
| Interview questions | Java 121 and Python 240 publicly seeded from unnamed/unlicensed master guides verbatim; rendered in full without source | Do not monetize until rights and added-value review are complete; attribute and editorially enhance if licensed |
| Blog | Published-only loader; author and dates visible; canonical supported. Repository seed includes at least the initial posts, but current live corpus is unknown | Live inventory: verify originality, named/credible authors, sources, update dates, word substance, and canonical ownership |
| Projects | Commercial catalog/detail; descriptions may be empty; license and academic-submission model are high risk | Resolve P0-01; require detailed original listing/provenance and explicit publication status; keep thin pages out of index/ads |
| Jobs | Active/expiry filters and external apply links are good; provenance/verification absent; description/address can be thin | Require source/verification/editorial fields and validate JobPosting/live expiry |
| Premium | Plans noindex when empty; pricing/features are database-driven; claims cross-platform access and payment behavior | Test entitlements, cancellations, prices/taxes/refunds, and policy consistency; keep ads away from purchase UI |
| Legal | Substantive, versioned, strongly linked; current cookie/GA wording matches code | Reconcile web/app and dynamic price facts; implement ad disclosures only with ad launch; owner/counsel verification |
| About/support/FAQ | About and Support thin; FAQ is CMS-driven and noindexes when empty | Strengthen trust/editorial/support information; review every live FAQ for accuracy and duplication |

## Required live website and account verification

These cannot be concluded from the repository and must not be represented as passed:

1. **AdSense account:** identity/payments verification, site ownership/connection, policy-center status, publisher ID, `ads.txt` authorization, geographic consent-message configuration, and Google's final review.
2. **Production crawl:** HTTP status, robots headers, rendered canonicals/noindex, sitemap counts, redirect behavior, JS errors, hydration, 404s, orphan URLs, external links, attachments, and CDN/WAF behavior.
3. **Production content inventory:** all published/website-visible courses, lessons, questions, problems, blog posts, projects, jobs, companies, testimonials, FAQs, plans, features, and reward rules; exact word counts and similarity clusters.
4. **Rights/provenance:** author, publisher, license, permission, commercial-use scope, and evidence for every imported/verbatim cluster and every marketplace asset.
5. **Correctness:** compile/run every technical example and judge case against supported runtime versions; review answers against primary documentation. Source inspection did not prove every example accurate.
6. **Commercial claims:** real cross-platform entitlements, available downloads, delivery/support performance, prices/taxes, refund handling, job freshness/employer authorization, ratings/reviews/testimonial consent, and the “buy, sell” claim on About (no public seller flow was identified in the website routes).
7. **Mobile/accessibility/performance:** real devices and browsers, Core Web Vitals/CLS, keyboard/screen reader, 200%/400% zoom, cookie dialog, fixed navigation/purchase bar, slow network, and later ad slots.
8. **Regional/legal:** actual audience geography, certified CMP behavior where required, privacy-law applicability, owner identity/address/inboxes, grievance process, and counsel review.

## Recommended remediation order

1. **Business/policy decision:** resolve whether the academic-project marketplace/custom build service is eligible for Google monetization; isolate or discontinue submission-ready academic work if necessary.
2. **Rights audit:** gather licenses/permissions and remove unresolved verbatim content from public/ad inventory.
3. **Content remediation:** rewrite/unpublish the 206 GenAI templates; add completeness gates to practice problems/projects; correct all examples through automated execution plus human review.
4. **Trust/editorial layer:** author/reviewer/source records, public editorial and correction policy, substantive About/Support, and provenance for jobs/projects/testimonials.
5. **Production crawl/data audit:** export the published corpus, measure empty/thin/duplicate pages, validate links/schema/canonicals/noindex/sitemaps, and repair only verified failures.
6. **Ad integration:** after the preceding risks are cleared, configure account/site, exact `ads.txt`, certified CMP where applicable, accurate ad disclosures, CSP, and conservative placements with reserved space.
7. **Pre-submission check:** signed-out multi-device crawl, policy review of every ad-eligible template, account checks, and evidence archive. Submit without representing approval as assured.

## Final readiness statement

CampusEduX has a capable technical foundation, and several controls are already stronger than a typical pre-launch site: server-rendered content, coherent canonical metadata, paginated sitemaps, empty-state noindex rules, consent-gated GA4, and visible legal navigation. Those strengths do not offset the P0 business-model and provenance risks. The repository should be treated as **not ready for AdSense** until P0-01 through P0-03 are resolved and the P1 content/ad-integration work is completed and verified on the live site.
