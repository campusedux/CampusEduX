# CampusEduX website audit — Part 3: AdSense and content

**Date:** 15 October 2026 (UTC). **Scope:** `website/` only. Parts 1 and 2 were used for context, not repeated. Read-only application audit; this report is the sole created file. **Verdict: NOT READY** to add AdSense code or request review yet.

## Coverage and method

**Files read: 13 of 13 requested page implementations; 8 of 8 corresponding legal content JSON files; 1 of 1 legal config; 1 of 1 CSP config.** The 13 are `/privacy-policy`, `/terms`, `/about`, `/contact`, `/disclaimer`, `/refund-policy`, `/cookie-policy`, `/community-guidelines`, `/grievance`, `/legal`, `/data-and-permissions`, `/support`, `/faq`. Their copy was read through the route, legal JSON, interpolation, registry and renderer (`src/legal/registry.ts:18-35`, `src/legal/interpolate.ts:17-45`, `src/legal/LegalDocView.tsx:40-67`). The eight JSON files correspond to the eight requested JSON-backed policy pages; `/about`, `/grievance`, `/legal`, `/support`, `/faq` are composed or data-driven. I also inspected relevant `website/` routes, content readers, footer/header, analytics and sitemap. The repo contains **no website seed dump for jobs, projects, lessons, interview questions, practice problems, or posts**. No Supabase production data or AdSense account was accessed. All production-row counts and external provenance claims are **UNVERIFIED**.

Word counts below count title, intro, section headings and body/bullets from JSON, excluding summary, shared footer/header, related-policy chips, and token expansion. Composed page counts are source-copy estimates (dynamic data excluded). Thus they are comparable content counts, not a live crawler's rendered totals. File references are relative to `website/`.

## A. AdSense readiness

### Policy-page review

Shared identity: `src/legal/legal.config.json:2-14` names **Ganesh Pache, an individual trading as CampusEduX**, `campusedux@gmail.com`, grievance email `studyfact8545@gmail.com`, and **Kharadi, Pune, Pune, Maharashtra 411014, India**. The doubled “Pune” needs owner verification; the file does not establish a phone number. The sitewide footer shows an email but may replace the legal entity with an environment value (`src/components/Footer.tsx:110-116,162-165`). The support WhatsApp link depends on configuration; its live number is **UNVERIFIED** (`src/app/contact/page.tsx:27-34`). “Real” below means a concrete value is provided, not that deliverability or legal identity was independently verified.

| Page | Words | Substance / completeness | Owner, contact, last updated | Cross-page consistency and action |
|---|---:|---|---|---|
| `/privacy-policy` | 2,007 | Detailed data inventory, vendors, retention and rights; **incomplete for AdSense** (`src/legal/content/privacy-policy.json:12-22,150-156,192-216`) | Owner, email, postal address; no phone; **18 Sep 2026** via `src/legal/legal.config.json:30-32` | Says no use of personal data for third-party advertising (`privacy-policy.json:117,156`); must revise before ads. Mobile-app-first wording and “in-app” deletion path obscure website flow (`:6-8,170-175`). |
| `/terms` | 1,654 | Detailed product, licensing, payment and disputes (`src/legal/content/terms.json:31-81,96-109,151-163`) | Owner, email, address; no phone; **18 Sep 2026** (`legal.config.json:31`) | Describes mobile app and “within the app” delivery/cancellation while website sells too (`terms.json:6,80-81,103-105`); align web flows. |
| `/about` | ~223 | Real overview, but thin credibility: no founder background, editorial process, business history or proof (`src/app/about/page.tsx:18-69`) | Owner named at `:64-68`; contact link, no direct email/phone/address; **no date** | Same owner as policies; promise to “buy, sell” projects should be checked against actual public seller flow (`:20-22`). |
| `/contact` | 172 JSON words + form/WhatsApp UI | Concrete channels and topics; support form is functional code but delivery is **UNVERIFIED** (`src/legal/content/contact.json:10-44`; `src/app/contact/page.tsx:25-40`) | Owner, emails, postal address; no plain phone; **18 Sep 2026** (`legal.config.json:37`) | Grievance email differs intentionally; verify both inboxes and postal address. |
| `/disclaimer` | 466 | Substantive education, jobs, ATS and project caveats (`src/legal/content/disclaimer.json:10-48`) | Brand and legal email only; no owner/address/phone in body; **31 Aug 2026** (`legal.config.json:34`) | Broad caveats are consistent with Terms; consider direct owner/contact reference. |
| `/refund-policy` | 726 | Product-specific windows and exceptions (`src/legal/content/refund-policy.json:10-79`) | Support and grievance emails; owner/address/phone absent in body; **31 Aug 2026** (`legal.config.json:32`) | Says cancellation is from app (`refund-policy.json:41-45`); verify website cancellation method and published prices/timelines. |
| `/cookie-policy` | 701 | Detailed current GA4/storage account; **not AdSense-ready** (`src/legal/content/cookie-policy.json:5-7,37-64`) | Privacy/grievance emails; no owner/address/phone in body; **18 Sep 2026** (`src/legal/config.ts:28-32`) | Explicitly says no ad cookies and no banner (`cookie-policy.json:7,52-64`), incompatible with future ads and current GA loading for EU users. |
| `/community-guidelines` | 515 | Real rules, moderation and appeal (`src/legal/content/community-guidelines.json:10-76`) | Support/grievance emails; owner/address/phone absent in body; **31 Aug 2026** (`legal.config.json:34`) | Consistent with Terms; references app locations rather than web URLs (`community-guidelines.json:62-71`). |
| `/grievance` | ~410 | Concrete officer, steps, timing and escalation (`src/app/grievance/page.tsx:25-80`) | Owner, officer, email, address; no phone; **18 Sep 2026** (`src/legal/config.ts:28-32`) | Same officer/email as privacy/contact. Verify named officer's role and ability to receive mail (`grievance/page.tsx:45-57`). |
| `/legal` | ~180 including linked titles/summaries | Useful index, not a standalone policy (`src/app/legal/page.tsx:23-69`; `src/legal/registry.ts:90-110`) | Brand and privacy email; owner/address/phone absent; global date **31 Aug 2026** shown as “Effective” (`legal/page.tsx:32-34`) | **Date mismatch:** hub displays `LEGAL.effectiveDate` from `legal.config.json:20` despite several linked policies updated 18 Sep (`legal.config.json:30-38`). It also claims same text on web and app though Cookie and Grievance are website-only (`legal/page.tsx:29-30`; `src/legal/config.ts:27-32`). |
| `/data-and-permissions` | 612 | Detailed app permissions and account data (`src/legal/content/data-and-permissions.json:5-69`) | Brand only; no owner/direct email/phone/address; **18 Sep 2026** (`legal.config.json:36`) | Says website has no native permission prompt, useful; some paths remain app-only (`data-and-permissions.json:64-69`). |
| `/support` | ~35 | **Thin gateway** to FAQ/contact/WhatsApp; little direct answer content (`src/app/support/page.tsx:11-22`) | No owner/direct email/phone/address; **no date** | Link targets exist in source; no substantive troubleshooting guide. |
| `/faq` | **UNVERIFIED**: CMS rows; shell ~34 | Answers render only when active rows exist; otherwise “No FAQs published yet” and noindex (`src/app/faq/page.tsx:14-18,21-29,40-59`) | No owner/contact/date in route body | Verify active rows, accuracy, originality and rendered word count in Supabase/live crawl. |

**Privacy/Cookie required disclosure check:** cookies ✅ current GA4 cookies (`cookie-policy.json:17-42`); Google as analytics vendor ✅ (`privacy-policy.json:18-22,153`); **Google as third-party *ad* vendor ❌**, **ad personalization / third-party ad cookies ❌**, **Ads Settings opt-out link ❌**, ad-related data sharing/web beacons ❌ (`privacy-policy.json:117,153-156`; `cookie-policy.json:7,52-64`); analytics ✅; data collection ✅; user rights ✅ (`privacy-policy.json:12-101,192-200`). Before running ads, disclose the actual ad use and provide the [Google Ads Settings](https://adssettings.google.com/) link as specified by [Google's required privacy-policy content](https://support.google.com/adsense/answer/1348695?hl=en). Revise statements of *current* no-ad use only when the implementation changes; do not prematurely state that ads are live.

### Checklist

| Check | Result | Evidence / verification |
|---|---|---|
| Public privacy, terms, contact and policy hub | ✅ source | Routes exist; shared root layout includes footer (`src/app/layout.tsx:98-104`), footer links key pages and hub (`src/components/Footer.tsx:40-85`). **UNVERIFIED live**: fetch all URLs and inspect status/HTML. |
| Every requested policy directly in sitewide footer/header | ❌ | Footer directly links only privacy, terms, refund, delete and `/legal` (`src/components/Footer.tsx:65-86`); header is product navigation (`src/components/nav/HeaderLinks.tsx:26-55`). Other policies are one click via `/legal` (`src/legal/registry.ts:90-110`). This is an accessibility/discoverability improvement, **not a claim that every policy must be direct-linked for AdSense**. |
| Broken or mismatched internal legal link | ❌ | Hub link paths correspond to route files (`src/legal/registry.ts:76-110`); **mismatched copy/date** on hub as above. Source-link existence check found no missing requested route; HTTP status is **UNVERIFIED**. |
| Cookie consent banner and preference control | ❌ | Policy explicitly says no banner (`src/legal/content/cookie-policy.json:60-65`); no CMP/consent state in root analytics (`src/components/analytics/GoogleAnalytics.tsx:9-39`). |
| EU/EEA, UK, Swiss ad consent | ❌ | No CMP integration. For personalized ads in those regions Google requires a certified TCF CMP; see [publisher requirement](https://support.google.com/adsense/answer/13554116?hl=en). Actual geo behavior **UNVERIFIED** until tested from those regions. |
| India consent handling | ❌ / UNVERIFIED | No site choice UI, so there is no India-specific user control (`cookie-policy.json:64`; `GoogleAnalytics.tsx:9-39`). Exact legal applicability should be reviewed against actual processing and audience; test India IP/browser choice once implemented. |
| Consent Mode | ❌ | No `gtag('consent', 'default'/'update', ...)` in analytics component (`GoogleAnalytics.tsx:24-32`). Google's CMP can map ad and analytics signals; see [Consent Mode settings](https://support.google.com/adsense/answer/16053245?hl=en). |
| Analytics/ad scripts blocked until consent | ❌ / n/a ads | With `NEXT_PUBLIC_GA_MEASUREMENT_ID`, gtag loads `lazyOnload` and config runs `afterInteractive` without a consent check (`src/app/layout.tsx:97`; `GoogleAnalytics.tsx:20-33`). No AdSense script yet in website source; pre-consent ad blocking is therefore **UNVERIFIED for future integration**. |
| Crawlers can see substantial free content | ⚠️ | Public server routes exist; free lesson bodies render server-side (`src/app/learning/[gridSlug]/[topicSlug]/page.tsx:233-278`), blog article full body (`src/app/blog/[slug]/page.tsx:174-180`), job description is in public page (`src/app/jobs/[id]/page.tsx:115-125`). Actual quantity/quality **UNVERIFIED** without CMS inventory. |
| Premium/checkout separation | ⚠️ | Premium lessons' body absent from anonymous HTML (`learning/[gridSlug]/[topicSlug]/page.tsx:233-245`); locked practice problem statement absent (`practice/problems/[slug]/page.tsx:28-45,76-94`); project downloads require purchase while description is public (`projects/[id]/page.tsx:138-161`). Keep ads off thin teasers and checkout/account pages. |
| CSP permits AdSense | ❌ | `src/next.config.js:15-29` permits GA4 and Razorpay only. See CSP plan below. |
| Existing ad units / policy-sensitive placements | ✅ current source | No AdSense loader/ad slot found in `website/src`; no ad placement yet to assess. Future placements need review. |
| `ads.txt` | **post-approval task only** | Confirm generated publisher ID and line after approval; **not a blocker**. Existing `website/public/ads.txt` was not used as approval evidence. |

### Crawlable sections and inventory estimate

Public routes: home (`src/app/page.tsx:80-116`); project marketplace/listings and descriptions (`src/app/projects/page.tsx:222-280`, `src/app/projects/[id]/page.tsx:110-140`); jobs/listings/details (`src/app/jobs/page.tsx:169-230`, `src/app/jobs/[id]/page.tsx:100-125`); learning catalog/courses/free lesson text (`src/app/learning/page.tsx:161-205`, `src/app/learning/[gridSlug]/[topicSlug]/page.tsx:233-278`); practice hub/problem library/free statements and interview Q&A (`src/app/practice/page.tsx:60-110`, `src/app/practice/interview-questions/[category]/[topic]/page.tsx:83-133`); blog catalog/articles (`src/app/blog/[slug]/page.tsx:128-180`); resume landing/templates, compiler UI, custom projects, premium/referral, FAQ, about/support/legal (`src/app/resume/page.tsx:70-105`, `src/app/compiler/page.tsx:45-50`, `src/app/custom-projects/page.tsx:69-158`, `src/app/faq/page.tsx:40-59`). Signed-in account data, submissions, applications, resume documents, purchased files, premium lessons/problem statements are unavailable to anonymous crawlers (`src/app/account/layout.tsx:1-13`, `learning/[gridSlug]/[topicSlug]/page.tsx:233-245`, `practice/problems/[slug]/page.tsx:28-45`).

**Overall estimate:** 13 substantive/legal or static public landing types plus six CMS-driven content families and their detail pages; exact number of original crawlable articles/words is **UNVERIFIED**. The source permits many indexable URLs but proves no number of populated CMS rows. Run the SQL below and a signed-out crawl with rendered text extraction; count only published, website-visible, non-redirected, non-noindex pages and exclude shared chrome. Google warns against submitting sites with sparse, template or unoriginal pages ([site approval guidance](https://support.google.com/adsense/answer/81904?hl=en)).

### CSP plan when approved

Current policy (`src/next.config.js:22-39`) would block the usual `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js` loader under `script-src` (`:15-20`), ad frames under `frame-src` (`:29`), ad image/pixel hosts under `img-src` (`:27`) and ad network requests under `connect-src` (`:28`). `style-src` may also block injected styles; `default-src` is the fallback for unlisted types. **Do not treat a static Google-domain list as guaranteed complete:** [Google's AdSense CSP guide](https://support.google.com/adsense/answer/16283098?hl=en) says ad domains change and supports nonce-based strict CSP. On approval, prefer a per-response nonce on every script including AdSense, Google-documented `strict-dynamic` pattern, and test with `Content-Security-Policy-Report-Only`. If choosing an allowlist, initial candidates to test are `pagead2.googlesyndication.com` for `script-src`, `*.googlesyndication.com` and `*.doubleclick.net` for `frame-src`, `img-src`, `connect-src`, plus actual `www.google.com`/country Google ad hosts where observed; GA remains `www.googletagmanager.com`, `www.google-analytics.com`, `analytics.google.com`. Capture all real violations in India and EU test sessions before enforcing. Exact final domain set is **UNVERIFIED** until the live ad tag runs; do not weaken `frame-ancestors`, `object-src` or checkout security just to make ads render.

### Layout and policy risk scan

Reserve a fixed responsive ad container before loading ads; otherwise inserted iframes can shift the article and cards. Safe candidates are **between** substantive home sections, after a jobs/project listing intro before card grids, and between long article/lesson sections after a paragraph. Avoid inside the compiler/editor, immediately beside “Run”, “Apply”, “Buy now”, “Get it free”, download/attachment, payment and referral CTAs (`src/app/compiler/page.tsx:45-50`; `src/app/projects/[id]/page.tsx:157-161,194-201`; `src/app/learning/[gridSlug]/[topicSlug]/page.tsx:253-276`; `src/app/jobs/[id]/page.tsx:140-145`). Mobile has a fixed bottom nav (`src/app/layout.tsx:104-106`) and project buy bar (`src/app/projects/[id]/page.tsx:194-201`); never overlay them with a sticky ad. No ad popups/interstitials were found in source. Announcement bar exists sitewide (`src/app/layout.tsx:99`); its live content and overlap are **UNVERIFIED**. Test 320, 375, 768, 1440px and CLS with ads loaded, declined and slow network.

Risk findings: jobs accept CMS `description` and render it as structured JobPosting without visible source attribution/provenance in the inspected path (`src/app/jobs/[id]/page.tsx:115-125`); copying company descriptions is **UNVERIFIED** without comparing actual rows to employer postings. Project description can be empty (`src/app/projects/[id]/page.tsx:138-140`); empty FAQ, interview-topic, lesson, premium and referral states are explicitly possible (`src/app/faq/page.tsx:44-45`; `src/app/practice/interview-questions/[category]/[topic]/page.tsx:103-105`; `src/app/learning/[gridSlug]/[topicSlug]/page.tsx:244-245`; `src/app/premium/page.tsx:129-130`; `src/app/referral/page.tsx:68-69`). Premium and referral correctly noindex when inventory absent (`premium/page.tsx:38-45`; `referral/page.tsx:12-19`), but empty interview topics/lessons can still be indexable (`interview-questions/[category]/[topic]/page.tsx:24-53`; `learning/[gridSlug]/[topicSlug]/page.tsx:83-103`). Jobs, learning, projects and blog provenance/originality require editorial evidence; no copyright infringement is asserted from source alone. No misleading ad UI exists yet; marketing claims and testimonials require live fact-checking (`src/app/page.tsx:80-116`).

### Verdict and ordered blockers

**NOT READY.** Efforts are engineering/editorial estimates, not dates.

1. **Consent and GA gating (1–3 days):** add appropriate regional choice/CMP, persistent preferences, revocation, Consent Mode and a denied/default state before analytics; verify EU/UK/Swiss and India sessions (`src/components/analytics/GoogleAnalytics.tsx:20-33`; `src/legal/content/cookie-policy.json:64`).
2. **Ad disclosures (0.5–1 day + owner review):** update privacy/cookie language for actual AdSense use, third-party Google cookies, personalization, Ads Settings opt-out and data sharing; remove contradictory “no ads” statements when ads go live (`privacy-policy.json:117,153-156`; `cookie-policy.json:7,52-64`).
3. **Original free content inventory (2–5 days audit; rewrite longer):** count published CMS pages and review thin/empty/templated content before submission (`src/lib/contentQuality.ts:7-23`; `src/app/learning/[gridSlug]/[topicSlug]/page.tsx:83-102,244-245`).
4. **Templated Generative AI lessons (roughly 2–4 weeks editorial for 206 indicated topics):** rewrite with topic-specific explanations and examples; keep noindex until rewritten (`src/lib/contentQuality.ts:7-23`). **206/207 is a code comment about an out-of-scope seed, not independently verified here.**
5. **AdSense CSP integration (0.5–2 days):** implement Google's nonce strategy or test a permissive allowlist under Report-Only with actual ad code (`src/next.config.js:15-39`).
6. **Thin/indexable empty pages (1–3 days):** noindex or populate empty interview topics/free lessons, add substantive support and about content (`src/app/practice/interview-questions/[category]/[topic]/page.tsx:103-105`; `src/app/learning/[gridSlug]/[topicSlug]/page.tsx:244-245`; `src/app/support/page.tsx:11-22`; `src/app/about/page.tsx:18-69`).
7. **Source/provenance and duplication audit (2–5 days):** compare jobs to employer pages; sample learning/problems/blog/projects for licensed/original text and repeated paragraphs (`src/app/jobs/[id]/page.tsx:115-125`; `src/app/blog/[slug]/page.tsx:174-180`).
8. **Ad-slot design and CLS validation (1–3 days):** reserved responsive space; review ad distance from checkout, downloads and mobile fixed bars (`src/app/projects/[id]/page.tsx:157-161,194-201`).
9. **Policy identity/date reconciliation (0.5–1 day):** fix legal hub date/app-text claim and verify owner address, officer and inboxes (`src/app/legal/page.tsx:29-34`; `src/legal/legal.config.json:2-20`).
10. **Live review gate (0.5–1 day):** verify public HTTP pages, canonical/noindex, populated FAQ/premium/referral, analytics network before/after consent, and mobile layouts; all remain **UNVERIFIED** from repo alone (`src/app/faq/page.tsx:14-29`; `src/app/premium/page.tsx:38-45`; `src/app/referral/page.tsx:12-19`).

After approval and publisher-ID issuance: publish/verify `ads.txt` with the actual publisher ID. This is a **post-approval task, not a blocker**.

## B. Content quality

### Public page-type word inventory

The following numbers are **static source-copy lower bounds** extracted from each page implementation, excluding imported components, shared chrome and database text. They indicate where content is sparse; they do **not** prove live rendered word totals or a Google minimum (none is assumed). Dynamic types require a signed-out crawl. Policy JSON counts above are more accurate for legal pages. Every row carries its source.

| Public, potentially indexable page type | Source words or status | Under 300 / action |
|---|---:|---|
| Home | ≥126 route words + imported hero/sections and CMS cards (`src/app/page.tsx:80-116`; `src/components/home/HomeHero.tsx:30-54`) | **UNVERIFIED** rendered; add durable original explanatory body. |
| Projects listing / detail / categories / trending | ≥208 / ≥101 / ≥23 / ≥18 plus CMS (`src/app/projects/page.tsx:222-280`; `src/app/projects/[id]/page.tsx:110-140`; `src/app/projects/category/[category]/page.tsx:30`; `src/app/projects/trending/page.tsx:27`) | **UNVERIFIED** each live URL; empty descriptions are a risk. |
| Jobs listing / detail / companies | ≥141 / ≥288 / ≥17–33 plus CMS (`src/app/jobs/page.tsx:169-230`; `src/app/jobs/[id]/page.tsx:100-125`; `src/app/jobs/companies/page.tsx:24`; `src/app/jobs/companies/[id]/page.tsx:25`) | **UNVERIFIED**; check employer-copy duplication. |
| Learning listing / course / lesson | ≥165 / ≥41 / ≥255 plus CMS (`src/app/learning/page.tsx:161-205`; `src/app/learning/[gridSlug]/page.tsx:23`; `src/app/learning/[gridSlug]/[topicSlug]/page.tsx:203-278`) | **UNVERIFIED**; locked/empty/templated can be thin. |
| Practice hub / problem list / problem detail | ≥~140 including tile data / ≥139 / ≥23 plus CMS (`src/app/practice/page.tsx:25-94`; `src/app/practice/problems/page.tsx:20`; `src/app/practice/problems/[slug]/page.tsx:25-95`) | Hub **under 300 in source**; detail **UNVERIFIED**. |
| Interview index / category / topic | ≥24 / ≥44 / ≥124 plus CMS (`src/app/practice/interview-questions/page.tsx:16-68`; `src/app/practice/interview-questions/[category]/page.tsx:23`; `src/app/practice/interview-questions/[category]/[topic]/page.tsx:95-133`) | Index/category **under 300 in source**; topic **UNVERIFIED**. |
| Blog list / article | ≥246 / ≥137 plus CMS (`src/app/blog/page.tsx:98-160`; `src/app/blog/[slug]/page.tsx:128-180`) | **UNVERIFIED** live; article length is CMS-dependent. |
| Resume / templates / compiler | ≥180 / ≥73 / tool-only (`src/app/resume/page.tsx:70-105`; `src/app/resume/templates/page.tsx:12`; `src/app/compiler/page.tsx:45-50`) | **Under 300 in source**; imported template/tool UI may add text, but not an article. |
| Custom projects / premium / referral | ≥240 / ≥177 / ≥78 plus components/CMS (`src/app/custom-projects/page.tsx:69-158`; `src/app/premium/page.tsx:99-169`; `src/app/referral/page.tsx:25-76`) | **UNVERIFIED** live; premium/referral conditional noindex. |
| About / support / legal index | ~223 / ~35 / ~180 (`src/app/about/page.tsx:18-69`; `src/app/support/page.tsx:11-22`; `src/app/legal/page.tsx:23-69`) | **Confirmed under 300 source words**; all three indexable. |
| FAQ / contact | FAQ **UNVERIFIED** CMS; contact 172 JSON + UI (`src/app/faq/page.tsx:14-59`; `src/legal/content/contact.json:5-44`) | FAQ only indexable with active rows; contact under 300 core-copy words. |
| Privacy / terms / disclaimer / refund / cookie / community / grievance / data | 2,007 / 1,654 / 466 / 726 / 701 / 515 / ~410 / 612 (`src/legal/content/privacy-policy.json:1`; `src/legal/content/terms.json:1`; `src/legal/content/disclaimer.json:1`; `src/legal/content/refund-policy.json:1`; `src/legal/content/cookie-policy.json:1`; `src/legal/content/community-guidelines.json:1`; `src/app/grievance/page.tsx:25-80`; `src/legal/content/data-and-permissions.json:1`) | All over 300. |

**Confirmed public indexable pages under 300 core words:** `/about`, `/support`, `/legal`, `/contact`, `/practice`, `/resume`, `/resume/templates`, and the tool-oriented `/compiler` (`src/app/about/page.tsx:18-69`; `src/app/support/page.tsx:11-22`; `src/app/legal/page.tsx:23-69`; `src/legal/content/contact.json:5-44`; `src/app/practice/page.tsx:25-94`; `src/app/resume/page.tsx:70-105`; `src/app/resume/templates/page.tsx:12`; `src/app/compiler/page.tsx:45-50`). `/compiler` is valuable as a tool despite few article words. **Potentially under 300 and requiring live count:** all CMS-driven listing/detail types above, plus `/custom-projects`, `/premium`, `/referral`, `/blog` (the last two are conditional on inventory). Do not judge usefulness by a 300-word threshold alone.

### Duplicate and near-duplicate content

**Real in-repo comparison:** `src/lib/contentQuality.ts:7-23` records two exact repeated phrases in 206/207 Generative AI seed topics; the underlying seed file is outside `website/`, so this is a cited code assertion, **not an independently recomputed count**. `src/lib/contentRedirects.json:1` contains explicit duplicate-URL redirects for certain lessons/problems; inspect destinations before interpreting them as live duplicate content. `src/app/learning/[gridSlug]/[topicSlug]/page.tsx:44-50` counts repeated short descriptions per course, so the implementation anticipates duplicated summaries. For jobs, projects, interview questions, practice problems and blog, the rows are read from Supabase (`src/lib/cache.ts:181-217,301-335`; `src/lib/interviewQuestions.ts:16-22,64-80`; `src/lib/blog.ts:150-165`); no comparable body corpus is in `website/`. Their duplicate rates and external copying are **UNVERIFIED**. Sample at least 30 records per family (or all if fewer), normalize punctuation/whitespace, compare exact hash and 5-word shingles/cosine similarity, manually review pairs above 0.8, then search distinctive 10-word passages against source sites. Keep source URL, license, author and review date per item.

### Learning template mechanics and rewrite plan

`isTemplatedGenerativeAiBody()` returns true **only if both** exact phrases “The important lesson is that the technique is a component of a larger system” and “Suppose a student is building an AI learning assistant” appear anywhere in concatenated lesson blocks (`src/lib/contentQuality.ts:16-23`; `src/app/learning/[gridSlug]/[topicSlug]/page.tsx:83-93`). A matched lesson is a topic-title-swapped explanation with repeated generic system advice and the same AI-learning-assistant example, regardless of the actual technique. This check is intentionally narrow: edited phrases, other boilerplate, or duplicate examples in other courses evade it; it is a signal, not a complete originality test. Matched pages get `noindex` (`learning/[gridSlug]/[topicSlug]/page.tsx:94-103`) and are excluded from the sitemap (`src/lib/sitemap/data.ts:101-125`).

| Course | Seeded topics affected | Rewrite direction |
|---|---:|---|
| Generative AI | **206 of 207 asserted in code comment; UNVERIFIED from website-only evidence** (`src/lib/contentQuality.ts:7-14`) | Write distinct lessons for each technique: definition, when to use, working code or prompt, failure case, trade-offs, student project exercise, original diagram/example and dated sources; editorially review before removing noindex. |
| Every other course | **UNVERIFIED**; no website seed corpus (`src/lib/contentQuality.ts:7-14`; `src/lib/learning.ts:24-31`) | For programming courses, worked syntax and runnable exercises; for aptitude/placement, solved India-relevant questions; for interview courses, role/company context and answer reasoning. Detect repeated intros, examples and short descriptions per course, then prioritize the highest-traffic/thinnest. |

Read-only Supabase SQL (run in SQL editor; adjust visibility column names after inspecting schema):

```sql
SELECT g.slug AS course,
       count(DISTINCT t.id) AS topics_with_content,
       count(DISTINCT t.id) FILTER (
         WHERE coalesce(x.body, '') LIKE '%The important lesson is that the technique is a component of a larger system%'
           AND coalesce(x.body, '') LIKE '%Suppose a student is building an AI learning assistant%'
       ) AS marker_matched_topics,
       count(DISTINCT t.id) FILTER (WHERE length(trim(coalesce(x.body, ''))) < 1200) AS short_body_topics
FROM learning_grids g
JOIN learning_topics t ON t.grid_id = g.id
LEFT JOIN LATERAL (
  SELECT string_agg(coalesce(c.body, ''), ' ' ORDER BY c.id) AS body
  FROM learning_contents c WHERE c.topic_id = t.id
) x ON true
GROUP BY g.slug ORDER BY marker_matched_topics DESC, g.slug;
```

This counts stored rows, **not** necessarily published/website-visible rows; apply the site's publication/platform predicates after checking schema/RPC results (`src/lib/learning.ts:24-31`). To count live crawlable original content, combine this with the sitemap visibility RPC and signed-out HTTP checks; do not count premium-locked bodies.

### Major-page content briefs

| Page | Likely target keyword | Problem | Add or rewrite | Priority |
|---|---|---|---|---|
| `/` | student projects, jobs and placement prep India | Broad H1 and cards, little durable explanation (`src/components/home/HomeHero.tsx:36-54`; `src/app/page.tsx:80-116`) | 2–3 specific “how to use” paragraphs, examples, links to guides and original FAQ | High |
| `/projects` | final year projects with source code | Marketplace H1, filter/card heavy (`src/app/projects/page.tsx:222-280`) | Branch-specific guidance, project evaluation checklist, delivery/license FAQs and category links | High |
| `/jobs` | fresher jobs and internships in India | Listings dominate; provenance and freshness unknown (`src/app/jobs/page.tsx:169-230`) | Original applying guide, scam checks, verified source/updated dates, company links | High |
| `/learning` | free programming tutorials for students | Generic H1, course tiles (`src/app/learning/page.tsx:161-205`) | Course outcomes, prerequisites, sample lesson, study paths, internal lesson links | High |
| `/practice` | coding practice for placement | H1 “Practice”; tile copy shallow (`src/app/practice/page.tsx:25-94`) | Difficulty roadmap, solved example, language links, FAQs | High |
| `/practice/interview-questions` | interview questions and answers for freshers | Category catalog, empty message possible (`src/app/practice/interview-questions/page.tsx:52-68`) | Company/role guides, answer method, linked worked Q&A, intro | High |
| `/resume` | ATS resume builder for freshers | Feature-led; little practical advice (`src/app/resume/page.tsx:70-105`) | India fresher resume examples, ATS checklist, formatting FAQ, templates links | Medium |
| `/compiler` | online compiler for Java Python C C++ JS | Accessible tool, H1 visually hidden (`src/app/compiler/page.tsx:45-50`) | Short visible usage guide, language examples, safety limits, related practice links | Medium |
| `/blog` | student programming and career guides | CMS-dependent article list (`src/app/blog/page.tsx:98-160`) | Editorial standards, topical hubs, named authors and update method | Medium |
| `/custom-projects` | custom final year project development | Pricing/features but thin proof/process (`src/app/custom-projects/page.tsx:69-158`) | Sample scope, timeline stages, originality/academic-integrity stance, deliverables FAQ | High |
| `/premium` | CampusEduX Premium plans | Pricing can be empty; body is feature/CTA led (`src/app/premium/page.tsx:99-169`) | Plan comparison, exact entitlements, cancellation steps, worked value examples | Medium |
| `/referral` | student referral rewards | Dynamic terms can be absent (`src/app/referral/page.tsx:25-76`) | Eligibility and credit examples, limits, withdrawal rules, FAQ | Medium |
| `/faq` | CampusEduX help FAQ | Entire answer body is CMS-dependent (`src/app/faq/page.tsx:14-59`) | Publish complete account/payment/project/job/privacy answers with direct policy links | High |
| `/about` | about CampusEduX | Owner named but credibility shallow (`src/app/about/page.tsx:18-69`) | Founder bio, why built, editorial/content sourcing, contact/address, update date | High |

### Indian-student content opportunities

| Suggested keyword | Page type / unique angle |
|---|---|
| “placement preparation roadmap for BTech students” | Evergreen guide by year/branch, weekly plan and linked practice (`src/app/learning/page.tsx:161-205`) |
| “ATS resume format for freshers in India” | Worked resume guide with before/after bullets and template (`src/app/resume/page.tsx:70-105`) |
| “final year project ideas for CSE with source code” | Curated project hub with originality, build difficulty and demonstration checklist (`src/app/projects/page.tsx:222-280`) |
| “how to apply for internships as a fresher in India” | Jobs guide with source checking, deadlines, resume examples (`src/app/jobs/page.tsx:169-230`) |
| “TCS interview questions for freshers” / “Infosys interview questions for freshers” | Company-specific editorial Q&A pages **only with verifiable sources and no claimed leaked questions** (`src/app/practice/interview-questions/page.tsx:52-68`) |
| “Java DSA practice questions for placements” | Topic hub with solved examples, complexity and linked problems (`src/app/practice/page.tsx:25-94`) |

### E-E-A-T and trust

Blog post shows author name and publish/update date, but no author bio, credentials or review policy in the inspected article (`src/app/blog/[slug]/page.tsx:128-151`). About names the operator but provides no first-hand background or sourcing standard (`src/app/about/page.tsx:64-69`). Legal pages show version/date (`src/legal/LegalPageShell.tsx:33-39`); support and about do not. Footer email is visible (`src/components/Footer.tsx:110-116,162-165`), but address is buried in legal/contact. Home may show testimonials from CMS (`src/app/page.tsx:80-116`); authenticity and permission are **UNVERIFIED**. Add named author bios, dated content review, source/provenance notes, project ownership/licensing evidence, and verifiable contact/identity. Do not fabricate testimonials, credentials or company relationships.

### Ready-to-paste title and description proposals

Titles below are **≤60 characters** before Next's optional ` | CampusEduX` template; descriptions are **≤160 characters**. Use `title: { absolute: ... }` or account for the template when applying. These fix the weaknesses recorded in Part 1 (`src/app/layout.tsx:41-47`; affected routes cited below). Content claims should be checked against live offerings before publishing.

| Page | Final title | Final description | Source |
|---|---|---|---|
| `/` | CampusEduX: Projects, Jobs & Placement Prep | Explore student projects, fresher jobs, tutorials, coding practice and resume tools on CampusEduX. | `src/app/page.tsx:65-70` |
| `/about` | About CampusEduX: Tools for Indian Students | Learn who operates CampusEduX and how its projects, jobs, tutorials and resume tools help college students prepare for careers. | `src/app/about/page.tsx:6-12` |
| `/premium` | CampusEduX Premium: Plans & Benefits | Compare CampusEduX Premium plans and benefits for learning and practice. See current pricing, access and cancellation details. | `src/app/premium/page.tsx:38-45` |
| `/support` | CampusEduX Support: Get Help | Find help with your account, projects, payments, jobs and learning. Browse FAQs or contact CampusEduX support by email or WhatsApp. | `src/app/support/page.tsx:6-20` |
| `/practice` | Coding Practice & Interview Prep | Solve coding problems, prepare for interviews and run code online with CampusEduX practice tools for students. | `src/app/practice/page.tsx:11-18` |
| `/custom-projects` | Custom Final Year Projects for Students | Plan a custom academic, personal or business project. Explore options, starting prices and the CampusEduX request process. | `src/app/custom-projects/page.tsx:8-10,69-158` |
| `/referral` | CampusEduX Referral Rewards | Invite friends to CampusEduX and see how current referral rewards, wallet credit and eligibility work. | `src/app/referral/page.tsx:12-19,25-76` |
| `/privacy-policy` | CampusEduX Privacy Policy | See what data CampusEduX collects, how it uses and stores it, which providers help us, and how to exercise your privacy rights. | `src/legal/content/privacy-policy.json:3-8` |
| `/terms` | CampusEduX Terms & Conditions | Read the terms for accounts, projects, jobs, Premium, payments, licensing and use of CampusEduX services. | `src/legal/content/terms.json:3-7` |
| `/refund-policy` | CampusEduX Refund & Cancellation Policy | Learn when project, Premium, wallet and custom-project purchases may be cancelled or refunded and how to request help. | `src/legal/content/refund-policy.json:3-14` |
| `/cookie-policy` | CampusEduX Cookie Policy | Learn how CampusEduX uses sign-in, functional and analytics cookies, and how to manage your browser choices. | `src/legal/content/cookie-policy.json:3-7` |
| `/disclaimer` | CampusEduX Disclaimer | Read the limits of CampusEduX learning, projects, jobs, resume tools and placement preparation advice. | `src/legal/content/disclaimer.json:3-8` |
| `/community-guidelines` | CampusEduX Community Guidelines | Review standards for reviews, uploads, referrals and respectful use of CampusEduX, plus how to report concerns. | `src/legal/content/community-guidelines.json:3-7` |
| `/data-and-permissions` | CampusEduX Data & Permissions | See the account data CampusEduX stores and which device permissions its website and mobile app use. | `src/legal/content/data-and-permissions.json:3-8` |
| `/legal` | CampusEduX Legal & Privacy Policies | Find CampusEduX privacy, terms, refund, cookie, grievance and other policies in one place. | `src/app/legal/page.tsx:9-20` |

**Final verification:** check rendered title/description lengths after Next template application, compare snippets to live offerings, and confirm with Search Console/crawl after deployment. This audit did not change metadata or production state.
