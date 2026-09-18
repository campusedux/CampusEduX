# CampusEduX — Google AdSense Approval-Readiness Audit

Date: 2026-09-18
Scope: `website/` (Next.js 14 app powering www.campusedux.com), cross-referenced against DB-seeded content in `mobile-app/supabase/migrations/`.
Method: full read-only repository inspection (routes, metadata, legal content, DB seed migrations). No code, content, or config was changed to produce this report. Where something cannot be confirmed from the repo alone (live DB row counts, Core Web Vitals, Search Console state), it is marked **NOT VERIFIED — REQUIRES MANUAL/PRODUCTION CHECK**.

This report separates three kinds of claims:
- **[POLICY]** — an actual Google AdSense / Publisher Policy requirement
- **[SEO]** — an SEO best practice, not an AdSense rule per se
- **[GENERAL]** — a general website-quality recommendation

---

## 1. Route inventory

~95 pages + 21 API routes under `src/app/`. Grouped by purpose:

| Group | Routes | Indexable? | Notes |
|---|---|---|---|
| Core marketing | `/`, `/about`, `/faq`, `/contact`, `/support`, `/premium`, `/referral`, `/compiler` | Yes | All static or ISR, all have metadata |
| Legal hub | `/legal`, `/privacy-policy`, `/terms`, `/refund-policy`, `/project-license`, `/community-guidelines`, `/disclaimer`, `/data-and-permissions`, `/cookie-policy`, `/grievance`, `/delete-account` | Yes (delete-account is `noindex` by choice) | Real synced content, not stubs — see §8 for accuracy issues |
| Learning (tutorials/notes) | `/learning`, `/learning/[gridSlug]`, `/learning/[gridSlug]/[topicSlug]` | Yes | **~763 topic pages**, DB-driven, ISR on-demand (`generateStaticParams` returns `[]`) |
| Practice / coding | `/practice`, `/practice/problems`, `/practice/problems/[slug]`, `/coding-problems/[problemSlug]`, `/practice/interview-questions/**` | Yes (`/practice/submissions` noindex) | ~350+ coding-problem pages, ~41 interview-question topic pages |
| Mock tests | `/mock-tests/[testId]`, `/mock-tests/[testId]/result/[attemptId]` | No (`noindex`, `force-dynamic`) | Correct — these are attempt flows, not content |
| Legacy | `/placement`, `/placement/notes`, `/placement/notes/[id]` | `/placement` redirects (308) to `/learning`; `/placement/notes*` still live separately | **Verify**: `/placement/notes` looks like it may now duplicate `/learning` content — confirm intent |
| Marketplace | `/projects`, `/projects/[id]`, `/projects/category/[category]`, `/projects/trending` | Yes | **Tables reportedly empty in production** — see §4/§16 |
| Jobs | `/jobs`, `/jobs/[id]`, `/jobs/companies`, `/jobs/companies/[id]` | Yes | Same emptiness risk |
| Blog | `/blog`, `/blog/[slug]` | Yes | Best-in-class SEO implementation; only 2 live articles |
| Custom Projects | `/custom-projects` (public), `/custom-projects/{start,features,estimate,checkout,my-projects}*` | Landing yes; funnel steps `noindex` + `robots.txt` disallow (double-protected) | Correct |
| Resume tools | `/resume`, `/resume/templates`, `/account/resume/**`, `/r/[token]` | Hub/templates yes; account routes and share-by-token `noindex` | Correct |
| Account/dashboard | `/account/**` (profile, wallet, purchases, applications, notifications, referral, saved-jobs, saved-projects) | No — layout-level `requireUser()` + `noindex` | Correct |
| Auth | `/login`, `/register`, `/forgot-password`, `/reset-password`, `/logout`, `/onboarding`, `/auth/callback`, `/auth/confirm`, `/email-verified` | No (`noindex`, some `follow:true` for link-equity) | Correct |
| Search | `/search` | No — always `noindex` regardless of query | Correct |
| API | 21 routes under `/api/**` | No — disallowed in `robots.ts` | Correct |

---

## 2. Google AdSense Policy Audit

| Policy area | Verdict | Notes |
|---|---|---|
| Copyright infringement — code/original writing | WARNING | Java/Python/AI-ML/DBMS tutorial prose reads as original, human-authored. **Not verified**: whether the *source markdown files* imported to seed this content (`core-java-full-course.md`, an unnamed Python course source, `AI_ML_Complete_All_10_Modules.md`) were originally authored by the site owner or sourced from a third party. If sourced externally without a license, republishing at scale is a real copyright risk. **NOT VERIFIED — REQUIRES MANUAL CHECK by the owner of the original authorship/licensing of these source files.** |
| Scraped / auto-generated low-value content | **FAIL** | The Generative AI tutorial (207 topics, `mobile-app/supabase/migrations/0069_seed_generative_ai_tutorial_content.sql`) is a mail-merge template: identical paragraphs verbatim across unrelated topics, topic name substituted into a fixed skeleton. Same pattern in its 206 linked mock tests (generic MCQ stems, empty `explanation` fields) and 336 linked coding problems (empty starter code/tests/solutions, generic prompt text). This is precisely the pattern Google's policies define as auto-generated/low-value content. See §16. |
| AI-generated content without added value | **FAIL** (same finding as above) | The rest of the tutorial content (Java, Python, AI/ML Notes, DBMS, interview questions) does not show this pattern — it reads as genuinely differentiated per topic despite sharing a heading skeleton. |
| Misleading / deceptive content | WARNING | Homepage's `CustomProjectHero` shows unsubstantiated trust claims ("Trusted by Students — Across India," "100+ Projects — Delivered successfully") with no visible data source (`src/components/home/CustomProjectHero.tsx:57-58`). Not necessarily false, but unverifiable claims presented as fact are a soft policy risk. |
| Dangerous / hateful / adult / gambling / illegal content | PASS | Nothing found in any sampled content. |
| Pirated software / books / unauthorized PDFs | PASS (as coded) | No PDF/download distribution of third-party copyrighted material found; resume export generates the *user's own* résumé PDF/DOCX — not third-party content. |
| Misleading career/educational claims | WARNING | Same as above — "100+ Projects Delivered" claim; also confirm any placement/job-outcome statistics elsewhere on the site (not found in this pass, but worth a dedicated check) are substantiated. |
| Privacy policy accuracy (data-collection disclosure) | **FAIL** | Google Analytics 4 is live sitewide (`src/app/layout.tsx`, `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-T4CVXSGW1N` in `.env.local`/`.env.example`) while the Privacy Policy explicitly states "we do not run... third-party analytics SDKs" and the Cookie Policy states "No Google Analytics... nothing non-essential to opt out of." A materially false privacy disclosure is a genuine AdSense-relevant risk (accurate privacy policy is a stated program requirement) independent of ads. **Must fix before submission.** |
| Sufficient original content overall | MOSTLY PASS, one major exception | Java/Python/DBMS/AI-ML-Notes/Interview-Questions/Blog = substantive and original. Generative AI tutorial = fails this bar at ~750-page scale (~40% of all seeded content pages). Standalone Practice coding-problem set (150 problems) is thin (no editorial/hints/complexity) but functional. |

---

## 3. Originality / Content Quality Audit

Sampled directly from seed migrations (not just DB schema — actual inserted prose):

- **Java Tutorials** (150 topics): ~180–220 words of original prose per topic + real runnable code + output, using a repeated 6-heading skeleton (`What is X? / Why used? / Real-life example / Syntax / Example / Key points`). Genuinely differentiated content per topic — the repetition is structural, not substantive.
- **Python Tutorial** (30 chapters): far deeper — ~2,000–5,600 words per chapter including real-world references, comparison tables, mini-projects, and interview/practice questions. Best per-topic depth in the "tutorial" category.
- **AI/ML Notes** (77 topics): ~1,000–1,300 words per topic, 18-heading template, substantive domain content, verified as a verbatim-sourced import (per prior engagement) rather than fabricated.
- **DBMS & SQL** (23 of 43 planned chapters seeded): the strongest content sampled — concrete running examples (e.g., a college exam-scores scenario), specific edge cases/pitfalls, topic-specific MCQs with real rationale.
- **Generative AI Tutorial** (207 topics, `0069_seed_generative_ai_tutorial_content.sql` — **not previously tracked in project history**): fails the originality bar. Confirmed verbatim-identical paragraphs across unrelated topics (e.g., "The important lesson is that the technique is a component of a larger system..." appears unchanged whether the topic is "What is Generative AI," a comparison-of-approaches topic, or "Text embeddings"). The same fake worked example ("Suppose a student is building an AI learning assistant...") and the same generic pipeline diagram repeat everywhere. `short_description` is the identical boilerplate sentence on all 207 rows.
- **Interview Questions** (~41 topics, Java + Python): substantive, specific answers (~80–150 words) with code and pitfall notes — good standalone value.
- **Blog** (2 articles): ~5,800 words each, clearly the most substantial individual pages on the site.

**Do not pad content with meaningless words** — per your own instruction, the fix here is not "add more text" to the Generative AI tutorial; it needs genuine per-topic technical explanation (what a transformer/diffusion model/token/embedding actually is, in terms specific to that topic) or it should be pulled from public indexing until rewritten.

---

## 4. Thin Content Audit

| Route/content type | Problem | Content Depth | AdSense Risk | Recommended Action |
|---|---|---|---|---|
| `/learning/generative-ai/**` (207 pages) | Mail-merged template, verbatim-duplicated paragraphs, boilerplate description | Low (in substance, despite length) | **High** | Rewrite with topic-specific technical content, or `noindex` until rewritten |
| Generative AI mock tests (206 pages, 2,060 MCQs) | Generic interchangeable stems, empty `explanation` on every question | Low | **High** | Rewrite explanations and topic-specific distractors, or `noindex` |
| Generative AI coding problems (336) | Empty starter code/tests/solutions, generic prompt text, non-functional as exercises | Very low | **High** | Either implement real starter/tests/solutions or remove from public listing |
| `/practice/problems/*` (150 standalone DSA problems) | Functional and judged, but `editorial`, `solution_approach`, `hints`, complexity fields empty on all 150 | Medium | Medium | Add editorials/hints incrementally — not a blocker, but a quality gap |
| `/projects`, `/jobs`, `/jobs/companies`, `/projects/category/[category]` | Tables reportedly empty in production → renders as empty-state shell pages | Low if empty | **High if still empty at submission** | **Verify live row counts.** Populate before indexing, or `noindex` while empty |
| `/about` | Explicit unfinished placeholder sentence ("team details... will be added here as they're finalised") | Low | Medium | Rewrite with real, non-fabricated info (see §7) |
| `/premium`, `/referral`, `/faq` | Conditional "coming soon"/"not published yet" empty states if CMS tables aren't populated | Depends on live data | Medium | **NOT VERIFIED** — confirm these tables have published rows in production |
| Java/Python/AI-ML-Notes/DBMS tutorial topics (~600 pages) | Repeated heading skeleton, but substantive per-topic prose | High | Low | Keep — this is legitimate structured writing, not spam |
| Interview Questions (~41 pages) | Specific, well-explained answers | High | Low | Keep |
| Blog (2 articles) | Long-form, original | High | Low | Keep, consider adding more articles for volume |
| `/coding-problems/[slug]` topic-linked problems | Full descriptions, hints, editorials, worked solutions | High | Low | Keep |

---

## 5. Indexation Audit

**`robots.ts`** correctly disallows: `/account`, `/auth`, `/api`, `/admin` (defensive — route doesn't exist here), `/search`, `/r`, and the `/custom-projects` funnel steps.

**`sitemap.ts`** correctly excludes all of the above plus auth pages, `/onboarding`, `/mock-tests/*`, `/practice/submissions`. Dynamic entries are capped and RPC-filtered (drafts/archived/mobile-only excluded).

**Should be indexed** (and mostly already are): home, about, faq, contact, support, legal hub + all individual legal docs, premium, referral, compiler, learning hub + grid + topic pages, coding-problems, practice hub/problems/interview-questions, projects + detail + category + trending, jobs + detail + companies, blog index + posts, resume/templates.

**Should not be indexed** (already correctly excluded): `/login`, `/register`, `/forgot-password`, `/reset-password`, `/logout`, `/onboarding`, `/auth/*`, `/email-verified`, all `/account/**`, `/search`, `/r/[token]`, `/custom-projects/{start,features,estimate,checkout,my-projects}`, `/mock-tests/**`, `/practice/submissions`, all `/api/**`.

**Real gap found**: `/projects`, `/jobs`, `/jobs/companies`, and every `/projects/category/[category]` (all categories are pre-generated via `generateStaticParams`) have **no conditional noindex when the result set is empty** — if the underlying tables are empty in production (flagged as likely by prior project history), these render and get indexed as boilerplate empty-state pages. Recommend either populating these before submission or adding conditional `noindex` when a list page has zero results.

**Locked/premium content stays indexable with a teaser view** (Learning topics and coding problems both keep the same URL indexable even when gated) — this is a legitimate, common paywall pattern, not a violation, but flagged so you're aware Google will see the locked/teaser HTML on those crawls.

---

## 6. Navigation & Website Structure

**PASS.** Footer (all breakpoints, no accordion) carries About, Contact, FAQ, Support under "Company," and all legal docs one click away via "All policies →" (`/legal`). Mobile drawer independently also lists About/Contact/Help & FAQ. Global search exists in the header plus a dedicated `/search` results page (correctly non-indexed). No dead internal links found — every nav/footer href maps to an existing route directory. `/placement*` legacy paths 308-redirect cleanly to `/learning` with no redirect chains.

---

## 7. About / Trust / E-E-A-T Audit

**WARNING.** The About page (`src/app/about/page.tsx:20-26`) contains two short paragraphs and this literal placeholder sentence still in production: *"The platform is built and maintained by the CampusEduX team. Specific milestones, team details and company information will be added here as they're finalised."* Combined with the Contact/Grievance pages currently rendering unfilled bracket placeholders (`[GRIEVANCE OFFICER NAME]`, `[REGISTERED BUSINESS ADDRESS]`, `[GOVERNING CITY, STATE]` — see §8), the only concrete trust signal currently visible to a reviewer is one disclosed sentence: "an individual operating under the unregistered trading name 'CampusEduX'."

**Recommendation (do not fabricate)**: fill in the real values you already hold in `mobile-app`/legal config for registered address, grievance officer name, and governing state — these are configuration fields waiting for real data, not invented content. For the About page, expand with real, honest information you can stand behind (what the platform does, how content is written/reviewed, genuine contact channel) — do not add fake team bios, fake reviews, or fake credentials.

---

## 8. Legal Pages Audit

| Page | Exists | Public | Footer-linked | Content accurate vs. implementation |
|---|---|---|---|---|
| Privacy Policy | Yes | Yes | Yes | **FAIL** — falsely states no analytics SDK is used (GA4 is live); also renders unfilled `{{registeredAddress}}`/`{{grievanceOfficerName}}`/`{{governingCityState}}` placeholders |
| Cookie Policy | Yes | Yes | Via `/legal` only | **FAIL** — falsely states "No Google Analytics... nothing non-essential to opt out of" |
| Terms & Conditions | Yes | Yes | Yes | Accurately describes payments/wallet/tokens; **same placeholder-leak** on governing state/grievance officer |
| Disclaimer | Yes | Yes | Via `/legal` only | Consistent with product, no placeholder issues found |
| Data & Permissions | Yes | Yes | Via `/legal` only | Accurate but written entirely in mobile-app/Android permission language — reads oddly on the website route (WARNING, not a factual error) |
| Grievance | Yes | Yes | Via `/legal` only | **FAIL** — same placeholder leak (officer name/address render as literal brackets) |
| Contact | Yes | Yes | Yes | Working, rate-limited form is accurate; "Operator details" section has the same placeholder leak |
| Refund Policy, Project License, Community Guidelines, Delete Account | Yes | Yes | Refund Policy in footer; others via `/legal` | No placeholder-leak matches found in these four specifically |

**Root cause**: a single file, `website/src/legal/legal.config.json`, holds unfilled bracket tokens for `registeredAddress`, `grievanceOfficerName`, and `governingCityState`. Every legal doc that references these tokens renders them literally on the live public site today. This is a one-file fix and should be done before submission — it currently reads as unfinished/unprofessional on pages a reviewer is very likely to open.

---

## 9. Privacy / Data Collection Audit

- **Auth**: Supabase Auth, email/password + Google OAuth — accurately disclosed in Privacy Policy and Terms. PASS.
- **Analytics — critical mismatch**: GA4 (`G-T4CVXSGW1N`) loads sitewide via `src/app/layout.tsx`, contradicting both Privacy Policy and Cookie Policy (see §8). **Must reconcile before submission** — either disclose GA4 properly (and its cookies `_ga`/`_ga_*`) or confirm it's actually disabled in production (current repo evidence says it's configured for production use).
- **localStorage/sessionStorage**: used for compiler drafts, language preference, announcement-dismiss flag — accurately and specifically disclosed in the Cookie Policy. PASS.
- **Payments**: Razorpay — consistent between code (`checkout.razorpay.com` preconnect) and legal docs. PASS.
- **Contact form**: server-action based, Zod-validated, rate-limited via a DB RPC, no secrets exposed client-side. PASS.
- **Third-party embeds**: only a plain `wa.me` WhatsApp link (no JS widget). No YouTube embeds, chat widgets, or tracking pixels found. PASS (independent of the GA4 issue above).
- **No AdSense/ad-network code present yet** — confirmed via grep (zero hits for adsense/googlesyndication/pagead), consistent with pre-approval status. No `ads.txt`/`app-ads.txt` yet — expected at this stage; add once a publisher ID is issued.
- **Service-role key**: never referenced anywhere in website code — confirmed by grep. PASS.

---

## 10. Ads Placement Readiness (future — do not add ads yet)

- **Homepage**: safe between any two of the repeated `<Reveal><section>` blocks (e.g., between "Trending projects" and "Learning resources"). Avoid the `CustomProjectHero`/identity hero above the fold.
- **Tutorial pages**: safe after the article body and before/after the prev/next nav. Never inside the article body mid-paragraph, never near the `CodeBlock` copy-toolbar.
- **Coding-problem IDE pages**: **do not place ads inside the fixed-height, draggable split-pane layout** (`CodingProblemLayout.tsx`) — it will interfere with the resize handle's pixel measurements and get clipped by `overflow-hidden`. A safe spot exists in the left "Problem" panel's own scrollable area, below "Related Problems" and before the prev/next nav.
- **Auth/payment/checkout flows**: keep entirely ad-free (login, register, password flows, wallet top-up, custom-project checkout funnel) — consistent with the app's own convention of hiding the bottom nav on these exact routes.
- **Blog/FAQ/About/Contact/legal pages**: standard in-content or sidebar placement is fine once content gaps (§7, §8) are fixed.

---

## 11. Mobile UX Audit

**PASS overall.** Consistent Tailwind breakpoint discipline (`sm`/`md`/`lg`) throughout. Code blocks and GFM tables in tutorial content both wrap in `overflow-x-auto` — no unscrollable overflow risk. Touch targets are mostly ≥44px (primary buttons `h-11`); a few icon-only nav buttons are 36×36px with generous surrounding padding — low real-world risk, not a blocker. No modals/popups/interstitials found anywhere except the mobile nav drawer itself. Sticky header and bottom tab bar both correctly account for each other's height (a spacer div clears the bottom bar). The coding-problem IDE explicitly falls back to a normal stacked, scrolling layout below `lg` — sound mobile handling for what's otherwise a desktop-oriented feature.

---

## 12. Technical SEO Audit

**Strong overall implementation.** Every sampled page type (home, learning topic, coding problem, blog post, project, job) has `generateMetadata` with title/description/canonical/OG/Twitter. Blog posts are the standout: per-post SEO overrides, full `Article` + breadcrumb + conditional `FAQPage` JSON-LD. Job postings use a real `JobPosting` schema that deliberately omits fields it can't substantiate rather than fabricating data — exactly the discipline Google's structured-data guidelines want. A custom `safeJsonLd()` helper escapes injection-risk characters before rendering JSON-LD via `dangerouslySetInnerHTML`. Exactly one `<h1>` per page type confirmed on every sampled route. `alt` text is present and meaningful on all sampled image components except the homepage's decorative hero banner (`alt=""`, acceptable since adjacent text conveys the same info). 404 page (`not-found.tsx`) is clean with no leaked technical detail. `next.config.js` redirects are all single-hop 308s with documented rationale — no chains found.

**One concrete blocker for the ads phase (not for submission itself)**: the CSP `script-src` in `next.config.js` allow-lists only Razorpay, Google Analytics/GTM, and Supabase — it does **not** yet include AdSense/Google Ads domains (`pagead2.googlesyndication.com`, `googleads.g.doubleclick.net`, etc.). Once you're approved and add the AdSense script, it will be silently blocked by CSP until this is extended. Flag it now so it's not a surprise later.

---

## 13. Page-Speed / Performance Audit

Summarized from the repo's own prior performance engagement (`OPTIMIZATION_NOTES.md`, `PERFORMANCE_CURRENT_AUDIT.md`), cross-checked against current code — still accurate:

- Every route ships ~221KB gzip JS, of which ~67KB is the Supabase browser SDK loaded by always-mounted nav islands (present even on static pages like `/about`) — the single highest-impact unresolved item (documented as "R1").
- `/resume` is `force-dynamic` and the slowest route (TTFB 158–725ms measured locally).
- No `.browserslistrc` → ~40KB of legacy polyfill shipped unnecessarily on every route.
- Learning/coding-problem pages use ISR-on-demand (`generateStaticParams` returns `[]`) rather than build-time prerendering, by deliberate design to avoid ~1,100+ Supabase RPCs at build time — functionally fine for SEO (crawlers get fully rendered, cached HTML) but means first-crawl of any long-tail topic pays a cold-render cost.
- Image pipeline (AVIF/WebP, blur placeholders, capped device sizes) is implemented but was never exercised against real production images in prior audits (DB had no real images at audit time).
- **Core Web Vitals have never actually been measured against the live domain** — every figure in every prior audit doc is explicitly labeled an estimate (no Chrome/Lighthouse available in any sandboxed audit environment). **NOT VERIFIED — run PageSpeed Insights / Lighthouse against www.campusedux.com directly before submission.**

None of this blocks AdSense approval directly, but slow pages read as low quality to reviewers and matter for user experience once ads are live.

---

## 14. Security / Trust Audit

**PASS.** No admin routes reachable under the public website (admin is a fully separate app; `/admin` is defensively disallowed in `robots.txt` anyway). Global error boundary (`error.tsx`) only logs to the browser console — never renders `error.message`/`stack`/`digest` to the page. Service-role key never referenced in website code. Spot-checked API routes (`/api/session`, `/api/resume/export/pdf`, `/api/resume/parse`, `/api/custom-projects/understand`, `/api/revalidate`) all correctly scope data to the authenticated caller or require a shared secret. One minor WARNING: `/api/resume/parse` sets a wildcard CORS header (`Access-Control-Allow-Origin: *`) — deliberate, to support the mobile app calling it with a bearer token, and the endpoint is still auth-gated regardless of origin, so this is a defensible design choice rather than a misconfiguration.

---

## 15. Broken / Low-Value Page Audit

- No `Lorem ipsum`, no dev-only debug UI, no `return null` page components found.
- `/compiler`'s "Ask AI to fix" button is a real dead-end: clicking it shows "Coming soon…" with an explicit `// TODO` in the code (`RuntimeErrorCard.tsx:76,115`) — low priority, but it's a live, user-facing broken promise on a public page.
- `/premium`, `/referral`, `/faq` have legitimate conditional "coming soon"/"not published yet" empty states — **not verified whether these fire in production today**; confirm the underlying CMS tables have published content before submission.
- `/about` has an explicit, unfinished-reading placeholder sentence (§7).
- No `global-error.tsx` at the app root (only route-level `error.tsx` exists) — minor gap, not a security leak (Next's own default fallback also suppresses stack traces in production).

---

## 16. Content / SEO Spam Risk Audit

The platform's overall content model (structured tutorials with a repeated heading skeleton per subject) is **not**, by itself, a programmatic-SEO red flag — Java/Python/AI-ML-Notes/DBMS/Interview-Questions genuinely differ topic-to-topic in substance even though headings repeat, which is normal structured educational writing.

The **Generative AI tutorial is the exception and the real risk**: ~750 pages (207 tutorial topics + 206 mock tests + 336 coding problems, roughly 40% of all seeded content pages) built from a rigid mail-merge template with verbatim-duplicated paragraphs, a fake worked example reused everywhere, empty MCQ explanations, and non-functional placeholder coding problems. At this scale, this is exactly the pattern Google's automated systems are built to detect as low-value/auto-generated content, and it sits on `show_on_website=true` (published, indexable) content today.

**Recommendation to keep the platform scalable without this risk recurring**: before seeding any future large batch of tutorial/practice content (the DBMS tutorial has 20 more chapters planned), spot-check for the "identical paragraph across unrelated topics" pattern the way this audit did — pull 3 topics from different sections and diff their prose. If a template produces the same sentences regardless of topic, it needs real per-topic authoring, not just a filled-in noun.

---

## 17. External Links & Copyright Audit

- No third-party PDFs, videos, or downloadable copyrighted material found being redistributed.
- Resume export/parse features operate on the *user's own* uploaded/generated content, not third-party copyrighted material.
- **NOT VERIFIED — REQUIRES MANUAL CHECK**: the provenance/licensing of the original source markdown files used to seed Java Tutorials (`core-java-full-course.md`), the Python Tutorial course, and `AI_ML_Complete_All_10_Modules.md`. This audit cannot determine from the repository alone whether these were originally authored by the site owner or adapted from a third-party source under license (or without one). If any of this material was copied from a copyrighted course/book without permission, that is a real copyright and AdSense policy risk regardless of how well-written it reads. Please confirm authorship/licensing before relying on this content for ad monetization.

---

## 18. Homepage Audit

**Mostly strong, one real issue.** The homepage renders `CustomProjectHero` (a project-outsourcing sales pitch with unsubstantiated "100+ Projects Delivered"/"Trusted by Students Across India" claims) **before** the actual site-identity hero that explains what CampusEduX is ("Everything a student needs for a career, in one place"). On mobile especially, a first-time visitor sees a paid-service pitch before any explanation of the broader platform. Recommend either reordering (identity hero first) or substantiating/softening the trust-strip claims. Everything below that is strong: clear content-discovery paths to every major section, no placeholder sections (all conditionally rendered on real data), good internal linking.

---

## 19. Important Content Pages Audit (representative samples)

| Category | Standalone value | Verdict |
|---|---|---|
| Java tutorial topic | Real prose + runnable code + output, ~200 words | PASS |
| Python tutorial chapter | Deep, ~2,000–5,600 words, real-world references, mini-projects | PASS — strongest tutorial category |
| DBMS/SQL topic | Concrete examples, specific pitfalls, strong MCQs | PASS — best content in the codebase |
| AI/ML Notes topic | ~1,000–1,300 words, substantive | PASS |
| Generative AI topic | Long but template-filled, near-zero unique information | **FAIL** |
| Interview Questions topic | Specific, well-explained Q&As | PASS |
| Coding Practice (topic-linked) | Full description + hints + editorial + solution | PASS |
| Coding Practice (standalone 150) | Functional but no editorial/hints/complexity | WARNING |
| Coding Practice (Generative AI, 336) | Empty starter/tests/solution, generic prompt | **FAIL** |
| MCQ mock test (non-GenAI) | Specific rationale per question | PASS |
| MCQ mock test (Generative AI, 206) | Generic stems, empty explanations | **FAIL** |
| Blog article | ~5,800 words, original | PASS |
| Projects/Jobs listing | Likely empty in production | **NOT VERIFIED — check live row counts** |

---

## 20. Google Search Console Readiness

Technically ready to submit: `sitemap.xml` exists and is well-formed, `robots.txt` is correctly configured, canonical tags are present on all sampled dynamic routes, metadata is dynamic and per-page.

**NOT VERIFIED — REQUIRES MANUAL/PRODUCTION CHECK**: domain/property verification status in Search Console, actual indexing coverage report, actual Core Web Vitals field data, actual crawl-stats/crawl-budget behavior on ~1,500+ dynamic pages, mobile-usability report. None of this can be confirmed from the repository.

---

## 21. AdSense Application Readiness Scorecard

## AdSense Readiness

**MOSTLY READY — FIX ITEMS FIRST**

The technical/SEO/indexation foundation is genuinely strong (this is a well-engineered site — correct noindex/canonical/JSON-LD discipline, no admin/security exposure, good mobile handling, real legal-page infrastructure). What's blocking a clean submission is content-accuracy and content-quality, not architecture.

### BLOCKERS
1. Privacy Policy and Cookie Policy both falsely state no analytics/tracking is used, while GA4 is live sitewide — fix the docs or disable GA4.
2. Unfilled bracket placeholders (`[REGISTERED BUSINESS ADDRESS]`, `[GRIEVANCE OFFICER NAME]`, `[GOVERNING CITY, STATE]`) render live on `/privacy-policy`, `/terms`, `/contact`, `/grievance` — fill in `legal.config.json`.
3. The Generative AI tutorial (~750 pages: 207 topics + 206 mock tests + 336 coding problems) is template-generated with verbatim-duplicated content, empty MCQ explanations, and non-functional coding problems — rewrite with real content or remove from public indexing.
4. Verify whether `/projects`, `/jobs`, `/jobs/companies` are actually empty in production; if so, populate before submission or `noindex` while empty.
5. Confirm authorship/licensing of the source material used to seed the Java/Python/AI-ML tutorial content — a genuine, unresolved copyright-provenance question.

### HIGH PRIORITY
1. Rewrite the About page's placeholder sentence with real, honest information.
2. Reorder or soften the homepage's `CustomProjectHero` claims/positioning so the site's actual purpose is clear before the sales pitch.
3. Confirm `/premium`, `/referral`, `/faq` have published CMS content in production (not showing "coming soon" empty states).
4. Add editorial/hints/complexity to the 150 standalone practice problems (or at minimum don't present them as "complete" if they're not).
5. Run a real PageSpeed Insights / Lighthouse check against the live domain — no real CWV data exists yet.

### MEDIUM PRIORITY
1. Extend the CSP `script-src` to allow AdSense domains once you have a publisher ID (not needed for submission, needed before the ad script will actually load).
2. Address the Supabase-SDK-on-every-route bundle weight (R1 in `OPTIMIZATION_NOTES.md`).
3. Clarify `/data-and-permissions` and `/cookie-policy` copy so they don't read purely in mobile-app/Android terms on the website.
4. Verify `/placement/notes` isn't duplicating `/learning` content unintentionally.
5. Add `ads.txt`/`app-ads.txt` once an AdSense publisher ID is issued.

### LOW PRIORITY
1. Fix the `/compiler` "Ask AI to fix → Coming soon" dead-end (or remove the button until it works).
2. Add a `global-error.tsx` at the app root for consistency with the route-level error boundary.
3. Bump icon-only nav buttons from 36×36px closer to 44×44px.
4. Add a `.browserslistrc` to drop unnecessary legacy JS polyfills.
5. Consider substantiating claims like "100+ Projects Delivered" with real, verifiable numbers.

---

## 22. Exact Change List

| Priority | File/Route | Problem | Required Change | Reason | Type |
|---|---|---|---|---|---|
| P0 | `website/src/legal/content/privacy-policy.json`, `cookie-policy.json` | False "no analytics" claims while GA4 is live | Disclose GA4 + its cookies, or disable GA4 | Accurate privacy disclosure is a real policy requirement | LEGAL |
| P0 | `website/src/legal/legal.config.json` | Unfilled `{{registeredAddress}}`/`{{grievanceOfficerName}}`/`{{governingCityState}}` tokens render as literal brackets | Fill in real values | Renders unprofessional/incomplete on reviewer-facing pages | LEGAL / CONFIGURATION |
| P0 | `mobile-app/supabase/migrations/0069_seed_generative_ai_tutorial_content.sql` (and its linked mock-test/coding-problem seeds) | ~750 pages of mail-merged, verbatim-duplicated template content | Rewrite with genuine per-topic content, or set `show_on_website=false`/exclude from sitemap RPCs until rewritten | Largest thin/auto-generated-content risk on the site | CONTENT |
| P0 | `/projects`, `/jobs`, `/jobs/companies` (live DB) | Possibly empty in production while indexable | Populate with real listings, or add conditional `noindex` when result count is 0 | Empty indexable pages read as thin content at scale | CONTENT / SEO |
| P0 | Java/Python/AI-ML source markdown provenance | Unclear licensing of imported source files | Confirm/document authorship or licensing | Unresolved copyright risk | LEGAL |
| P1 | `website/src/app/about/page.tsx` | Explicit "will be added here as they're finalised" placeholder | Replace with real, complete About content | E-E-A-T / trust signal gap | CONTENT |
| P1 | `website/src/app/page.tsx`, `CustomProjectHero.tsx` | Sales pitch + unverified claims appear before site-identity hero | Reorder hero sections and/or substantiate claims | First-viewport clarity of site purpose | CONTENT / UX |
| P1 | `website/src/app/premium/page.tsx`, `referral/page.tsx`, `faq/page.tsx` | Possible "coming soon" empty states in production | Verify CMS tables are populated | Avoid indexable near-empty pages | CONTENT |
| P1 | `mobile-app/supabase/migrations/0073-0089` (standalone practice problems) | Missing editorial/hints/complexity on all 150 | Add incrementally | Content depth/quality | CONTENT |
| P1 | Live domain | No real Core Web Vitals data | Run PageSpeed Insights/Lighthouse on production | Confirms real-world performance | PERFORMANCE |
| P2 | `website/next.config.js` (CSP `headers()`) | AdSense domains not yet allow-listed in CSP | Add `pagead2.googlesyndication.com` etc. once approved | Ads would otherwise be silently blocked | CODE / CONFIGURATION |
| P2 | `website/src/app/layout.tsx` + nav islands | ~67KB gzip Supabase SDK loads on every route | Defer/lazy-load nav islands that need Supabase | Page-weight/UX | PERFORMANCE |
| P2 | `website/src/legal/content/data-and-permissions.json`, `cookie-policy.json` | Written in mobile/Android-permission language on website routes | Add website-specific framing | Clarity for website visitors | CONTENT |
| P2 | `/placement/notes`, `/placement/notes/[id]` | Possible unintentional duplicate of `/learning` content | Confirm intent; consolidate or redirect if duplicate | Avoid duplicate content | SEO |
| P2 | (repo root, once publisher ID exists) `public/ads.txt` | Not yet created | Add once AdSense issues a publisher ID | Required for ad verification, not for submission | CONFIGURATION |
| P3 | `website/src/app/compiler/RuntimeErrorCard.tsx` | "Ask AI to fix" → "Coming soon" dead end | Hide button until implemented, or implement it | Avoid a broken user-facing promise | CODE |
| P3 | `website/src/app` (root) | No `global-error.tsx` | Add one matching the existing `error.tsx` style | Consistency, not a security issue | CODE |
| P3 | `website/` | No `.browserslistrc` | Add a modern-browsers target | Removes ~40KB of unneeded polyfill | PERFORMANCE |

---

## 23. Confirmation

No code, content, or configuration was modified to produce this report. This document is analysis only.

---

## 24. Final Verdict

## CAMPUS EDUX ADSENSE AUDIT

### Current Status
MOSTLY READY — FIX ITEMS FIRST

### Critical Blockers
1. Privacy Policy / Cookie Policy falsely claim no analytics while GA4 is live sitewide.
2. Legal pages render literal unfilled placeholder text (`[REGISTERED BUSINESS ADDRESS]` etc.) on `/privacy-policy`, `/terms`, `/contact`, `/grievance`.
3. ~750 pages of the Generative AI tutorial (topics + mock tests + coding problems) are mail-merged, verbatim-duplicated template content — the single largest AdSense content-policy risk on the site.

### High Priority Changes
1. Verify and fix whether `/projects`/`/jobs`/`/jobs/companies` are empty in production.
2. Confirm licensing/authorship of imported tutorial source material (Java/Python/AI-ML).
3. Rewrite the About page's placeholder sentence with real content.

### Medium Priority Changes
1. Reorder/soften the homepage's unsubstantiated trust-claim hero.
2. Confirm Premium/Referral/FAQ CMS tables are populated live.
3. Add editorial/hints to the 150 standalone practice problems.

### Low Priority Changes
1. Extend CSP for AdSense domains once approved.
2. Fix the `/compiler` "coming soon" dead-end button.
3. Add `.browserslistrc` and a root `global-error.tsx`.

### Pages To Improve
- `/about`
- `/learning/generative-ai/**` (all 207 topics)
- `/practice/problems/*` (standalone problems, editorial/hints)
- `/projects`, `/jobs`, `/jobs/companies` (pending live data verification)

### Pages To Noindex
- Already correctly noindexed: all `/account/**`, auth pages, `/search`, `/r/[token]`, custom-projects funnel steps, `/mock-tests/**`, `/practice/submissions`.
- Consider adding conditional noindex: `/projects`, `/jobs`, `/jobs/companies`, `/projects/category/[category]` if/while empty; Generative AI tutorial/mock-test/coding-problem pages until rewritten.

### Pages Already Good
- `/blog/[slug]` (best SEO implementation on the site)
- `/learning/java-tutorial/**`, `/learning/python-tutorial/**`, `/learning/dbms-sql/**`, `/learning/ai-ml-notes/**`
- `/practice/interview-questions/**`
- `/coding-problems/[slug]` (topic-linked problems)

### Legal Requirements
- Privacy Policy: exists, public, linked — **FAIL** on accuracy (analytics claim)
- Terms & Conditions: exists, public, linked — PASS on accuracy, FAIL on placeholder leak
- Disclaimer: PASS
- Cookie Policy: exists, public — **FAIL** on accuracy (analytics claim)
- Contact: PASS functionally, FAIL on placeholder leak
- About: exists, public — WARNING (placeholder content)

### Content Quality
WARNING — strong in most categories, FAIL-level issue isolated to the Generative AI tutorial cluster (~750 pages)

### Technical SEO
PASS

### UX/Mobile
PASS

### Copyright/Originality
WARNING — original where sampled, but source-material provenance for imported tutorials is unverified

### AdSense Policy Risk
WARNING — driven by the analytics-disclosure mismatch and the Generative AI content cluster, both fixable

### Final Pre-Application Checklist
- [x] Original useful content (except Generative AI cluster)
- [ ] No obvious policy violations — analytics-disclosure mismatch must be resolved
- [ ] No copied/pirated content — source-material provenance unverified
- [x] Important pages complete (About needs a content fix, not a build)
- [ ] Privacy Policy — accurate (currently false on analytics)
- [x] Terms & Conditions
- [x] Disclaimer
- [x] Contact
- [ ] About — needs real content, currently placeholder
- [x] Proper navigation
- [x] Mobile-friendly
- [x] Sitemap
- [x] Robots.txt
- [x] Canonicals
- [x] Metadata
- [ ] No unnecessary indexable thin pages — Generative AI cluster + possibly empty Projects/Jobs
- [ ] No broken/placeholder pages — About + legal placeholder tokens + compiler dead-end button
- [x] Secure production configuration
- [ ] Search Console ready — NOT VERIFIED, no live check performed
- [x] Website provides clear user value (outside the flagged content cluster)

---

**Based on the actual repository audit, these are the exact changes I should make before submitting CampusEduX for Google AdSense review, in priority order:**

1. Fix the Privacy Policy / Cookie Policy analytics-disclosure mismatch (either disclose GA4 or disable it).
2. Fill in the real values for `registeredAddress`, `grievanceOfficerName`, `governingCityState` in `legal.config.json`.
3. Rewrite or de-index the Generative AI tutorial cluster (~750 pages).
4. Verify and resolve the Projects/Jobs empty-table risk in production.
5. Confirm licensing/authorship of the imported tutorial source material.
6. Rewrite the About page's placeholder sentence.
7. Everything in the High/Medium/Low priority lists above, roughly in that order.
