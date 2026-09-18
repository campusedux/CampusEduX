# CampusEduX — Stage 3: Final Production Audit & AdSense Submission Readiness

Date: 2026-09-18
Scope: `website/` (Next.js 14, Vercel), live production checks against `https://www.campusedux.com`, plus the working tree.
Builds on: `ADSENSE_READINESS_AUDIT.md` (Stage 1) and `CONTENT_SEO_AUDIT_STAGE2.md` (Stage 2), both read-only. **This stage additionally ran live HTTP checks against production and applied a small set of concrete, low-risk fixes** — listed in §13. It does not repeat Stage 1/2 findings verbatim; it re-verifies what it can against the live site (promoting several items from ESTIMATED to MEASURED), and reports what changed.

Every finding below is labeled **MEASURED** (observed directly this session — live `curl` against production, or a local `tsc`/`eslint`/`vitest`/`next build` run) or **ESTIMATED / NOT VERIFIED** (carried from Stage 1/2's repo-only analysis, or requiring a tool this environment doesn't have, e.g. a browser/Lighthouse).

---

## 1. Full production route check

**MEASURED** — live HTTP status for every major route class:

| Route | Status | Notes |
|---|---|---|
| `/`, `/about`, `/faq`, `/premium`, `/referral`, `/contact`, `/support`, `/learning`, `/projects`, `/jobs`, `/jobs/companies`, `/blog`, `/compiler`, `/practice`, `/resume`, `/legal`, `/privacy-policy`, `/terms`, `/cookie-policy`, `/grievance`, `/data-and-permissions`, `/search`, `/login`, `/register` | 200 | All render |
| `/placement` | 308 → `/learning` | Correct, `Location` header present |
| `/placement/notes` | **308 with NO `Location` header** (found live, reproducible on 3 repeat requests) | **Real bug, fixed this session — see §13** |
| `/placement/notes/[id]` (e.g. `/placement/notes/some-id`) | 308 → `/learning` | Correct |
| `/account` (unauthenticated) | 307 → `/login` | Correct — no accidental auth gate leak, no exposed data |
| `/api/session` (unauthenticated) | 200, body `{"profile":null}` | No data leak |
| `/admin` | 404 | Correctly not part of this app |
| `/nonexistent-page-xyz` | 404 | Clean 404, no leaked stack trace |
| `/robots.txt` | 200, well-formed | See §6 |
| `/sitemap.xml` | 200, well-formed, **1,755 URLs** | See §6 |
| `/ads.txt` | 404 | Expected — no publisher ID yet, see §10 |

**Finding — `/placement/notes` malformed redirect (new, MEASURED):** three separate requests all returned `HTTP 308` with `x-vercel-cache: HIT` but **no `Location` header**, and a 23.8 KB HTML body whose `<title>`/`<meta>`/canonical describe the **homepage**, not `/learning`. Its siblings (`/placement`, `/placement/notes/[id]`) both redirect correctly and both show `x-vercel-cache: MISS`/dynamic behavior. Root cause: this specific static redirect page appears to have a stale/corrupted Vercel edge-cache artifact — the local `next build` classifies `/placement/notes` identically to the working `/placement` (both `○ Static`), so this is a deployment/caching issue, not a logic bug in the route. **Fixed in code this session** (forced to dynamic rendering so it can no longer be served from a stale static cache — see §13); **requires a redeploy to actually take effect in production**, since this environment cannot deploy.

No redirect loops, no accidental auth gates, no unfinished/placeholder pages found on any other sampled route. Images, nav, and legal links all resolve (Stage 1 §6, re-confirmed by the 200s above).

---

## 2. Homepage final review

**MEASURED (code) + fixed this session.** As a first-time visitor, the first viewport is `CustomProjectHero` — a "Have a Project Idea? We'll Build It for You" pitch — followed further down by the actual site-identity hero ("Everything a student needs... in one place"). This ordering was a deliberate recent redesign (commit `c1bd9b5`), so **this audit does not reorder it** — that's a product/positioning call for the site owner, not a mechanical fix, and Stage 1 already flagged it as a recommendation, not a blocker. It's repeated here as **still open** in §11.

**Promotional claims — fixed.** `CustomProjectHero`'s trust strip stated **"Trusted by Students — Across India"** and **"100+ Projects — Delivered successfully"**, neither substantiated anywhere in the repo (no data source, no counter tied to a real table). Per this stage's explicit instruction not to use fake user/project numbers or unverifiable trust claims, and since I cannot fabricate real numbers to substantiate them, I **removed** both and replaced them with two accurate, verifiable statements about the service itself ("Built for Students" / "Source Code Included") — see §13 for the exact diff. Nothing else on the homepage or elsewhere in `website/` matched a testimonial/award/partnership/"trusted by"/statistic pattern on a further sweep this session, **except** the homepage's `testimonials` section, which is populated from a real DB table (`raw.testimonials`, author name/role/quote/rating) rather than hardcoded — its content is only as trustworthy as the rows in that table, which this audit cannot inspect from the repository; if any of those rows are fabricated placeholder testimonials rather than genuine submissions, that's a data question for the owner, not a code fix.

---

## 3. Mobile final review

**ESTIMATED — code-level, not a real device/browser.** No headless browser or device emulator is available in this environment, so this remains an inspection of the responsive implementation, not an observed rendering. Carried from Stage 1 §11 (PASS): consistent `sm`/`md`/`lg` Tailwind breakpoints, code blocks and tables wrapped in `overflow-x-auto`, sticky header + bottom tab bar sized to clear each other, no modals/interstitials found, the coding-problem IDE explicitly falls back to a stacked layout below `lg`. **Not independently re-verified visually this session — recommend an actual mobile-device or Chrome DevTools pass before submission**, since this is the one section of the brief that fundamentally requires eyes on a rendered page.

---

## 4. Performance

**MEASURED where possible; Core Web Vitals remain NOT MEASURED (no Chrome/Lighthouse in this environment) — same limitation every prior audit in this repo has disclosed.**

**MEASURED — server response time (this sandbox → production, single-request, not a substitute for real-user CWV):**

| Route | TTFB | Total | HTML size |
|---|---|---|---|
| `/` | 0.60s | 0.80s | 181 KB |
| `/learning` | 0.57s | 0.68s | 66 KB |
| `/learning/java-tutorial` | 0.91s | 1.52s | 504 KB |
| `/projects` | 0.67s | 0.77s | 60 KB |
| `/jobs` | 0.54s | 0.57s | 50 KB |
| `/blog` | 0.85s | 1.24s | 65 KB |
| `/resume` | 0.80s | 1.18s | 117 KB |
| `/practice/problems` | 0.60s | 0.84s | 94 KB |

These numbers include this sandbox's own network path to Vercel's edge and are **not equivalent to LCP/CLS/INP**, which depend on client-side rendering and a real browser. They're reported as a directional signal only (all sub-second-to-low-single-digit TTFB, nothing pathological), not as CWV. `/learning/java-tutorial` at 504 KB HTML / 1.5s total is the heaviest sampled page — consistent with it being one of the largest tutorial pages.

**ESTIMATED (carried from `OPTIMIZATION_NOTES.md` / `PERFORMANCE_CURRENT_AUDIT.md`, not re-derived this session):** ~221 KB gzip JS per route, ~67 KB of which is the Supabase SDK loaded by always-mounted nav islands (documented as "R1", still unresolved); no `.browserslistrc` (confirmed absent again this session — still ~40 KB of unneeded legacy polyfill); image pipeline (AVIF/WebP, blur placeholders) implemented but not exercised against real production images in any prior pass.

**Action required before relying on CWV data for submission:** run PageSpeed Insights / Lighthouse directly against `https://www.campusedux.com` from a real browser — this is the one check no sandboxed audit in this project's history has been able to perform.

---

## 5. Security

**MEASURED, re-verified independently this session (not just re-citing Stage 1):**
- No service-role key reference anywhere in `website/src` (`grep -rn "SERVICE_ROLE" src` — zero hits).
- No hardcoded API keys/secrets pattern found (`sk_live`, `sk_test_*`, `AIza*`, PEM private-key headers — zero hits).
- No `.env`/`.env.local` file tracked in git; `.gitignore` correctly excludes `.env`, `.env.local`, `.env.*.local`.
- Live security headers on production (`curl -I`): `Content-Security-Policy`, `Strict-Transport-Security: max-age=63072000; includeSubDomains`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Permissions-Policy`, `Referrer-Policy: strict-origin-when-cross-origin` — all present on every sampled response, including redirects.
- `/account` (private page) correctly 307-redirects unauthenticated visitors to `/login` server-side — no client-side-only gate, no flash of private content, no data in the response body.
- `/api/session` returns `{"profile":null}` for unauthenticated callers — no leak.
- `/admin` returns 404 on the website domain — genuinely isolated (separate app).
- Production error handling: sampled 404 page and redirect responses show no stack traces, no framework debug info beyond the standard `x-powered-by: Next.js` / `server: Vercel` headers (minor, extremely common information disclosure, not a real risk).

No new security issues found. This reconfirms Stage 1 §14's PASS with live evidence rather than repo inspection alone.

---

## 6. Google Search readiness

**MEASURED:**
- `robots.txt` (live): well-formed, `Allow: /` plus explicit `Disallow` on `/account`, `/auth`, `/api`, `/admin`, `/search`, `/r`, and all `/custom-projects/*` funnel steps. References `Sitemap: https://www.campusedux.com/sitemap.xml`.
- `sitemap.xml` (live): well-formed XML, **1,755 `<loc>` entries total**, `lastmod` populated on every entry.
- Homepage `<link rel="canonical">` self-references correctly (`https://www.campusedux.com`).
- `/projects` and `/jobs` list pages: **no `noindex` meta tag present live** → confirms their backing tables are **not empty in production** (Stage 1's "NOT VERIFIED — tables reportedly empty" flag is now resolved: they have real rows). Sitemap contains live `/projects/*` and `/jobs/*` detail-page entries.

**Finding, now MEASURED (previously only inferred from repo code in Stage 2):** the live sitemap contains **742 `/coding-problems/*` URLs**, consistent with Stage 2's count of ~207 topic-linked + ~196 AI/ML + ~336 Generative-AI coding-problem pages (~739, matching within rounding), and **208 `/learning/generative-ai*` URLs** (the 207 template-filled tutorial topics + 1 grid landing page). Both are indexable today with no exclusion. This confirms Stage 2's P0 finding is real and live, not just a code-path risk — see §7.

---

## 7. AdSense-specific readiness

Carrying forward Stage 1/2's content-quality findings (not re-derived, still accurate per spot-checks) with today's status:

| Item | Status |
|---|---|
| Original, useful content (Java/Python/AI-ML-Notes/DBMS/Interview-Questions/Blog) | PASS, unchanged |
| Generative AI tutorial cluster (207 topics) — mail-merged, verbatim-duplicated | **Still FAIL, still indexable live** (confirmed §6) — needs real per-topic content or DB-side exclusion; this is a content-authoring/DB-migration task outside what this audit can safely do unilaterally |
| Generative AI coding problems (336) — empty fields, generic description | **Fixed this session at the code level** — see §13 (now conditionally `noindex`) |
| Generative AI mock tests (206) | Already safely `noindex` (Stage 1/2, unchanged) |
| `/about` placeholder sentence | **Fixed** (prior session, verified clean this session — real "who it's for" / "what you can do" / operator content, no fabricated team bios) |
| `/projects`, `/jobs`, `/jobs/companies` empty-table risk | **Resolved** — confirmed live populated (§6), and conditional-`noindex`-when-empty is now also in place as a safety net (§13, prior session) for any future empty state |
| Legal placeholder tokens (`[REGISTERED BUSINESS ADDRESS]`, `[GRIEVANCE OFFICER NAME]`, `[GOVERNING CITY, STATE]`) | **Still unresolved — cannot be fixed by this audit.** These are real business facts (the owner's registered address, the actual person who is Grievance Officer, the state whose law governs the Terms). I have no way to know or verify these and will not invent them. **This remains the #1 blocker requiring the site owner's input.** |
| GA4 vs. Privacy/Cookie Policy accuracy mismatch | **Fixed** (prior session) — both policies now accurately disclose GA4, its cookies, and how to opt out; verified in the diff this session |
| `/compiler` "Ask AI to fix" dead-end button | **Fixed** (prior session) — button removed along with its TODO; verified clean |
| Source-material licensing (Java/Python/AI-ML tutorial markdown; Python Interview Questions transcribed from a named external guide) | **Still unresolved — cannot be fixed by this audit.** Only the site owner knows/can confirm whether these were self-authored or used under license. |
| No admin/ads-only/thin pages elsewhere | PASS |

---

## 8. AdSense ad placement plan (do not add ads yet — none added)

Unchanged from Stage 1 §10, still accurate against the current codebase:

- **Homepage**: safe between any two `<Reveal><section>` blocks (e.g. between "Trending projects" and "Learning resources"). Avoid inside `CustomProjectHero` / the identity hero above the fold.
- **Learning (tutorial pages)**: safe after the article body, before/after the prev/next nav. Never mid-paragraph inside the article, never near the `CodeBlock` copy toolbar.
- **Blog**: standard in-article or sidebar placement, once the content items in §7 that affect blog trust (none currently — blog itself is clean) are considered; safe between sections, not inside the article body's reading flow in a way that could be mistaken for content.
- **Interview questions**: safe after each Q&A block or between topics on the hub/category pages; never inside an answer's code example.
- **Coding-problem IDE pages (`/coding-problems/[slug]`, `/practice/problems/[slug]`)**: **do not place ads inside the fixed-height, draggable split-pane layout** — it will interfere with the resize handle's pixel math and get clipped by `overflow-hidden`. Safe spot: the left "Problem" panel's own scrollable area, below "Related Problems" and before prev/next nav.
- **Projects / Jobs**: safe between list-grid sections and in detail-page sidebars; never inside the "Buy"/"Apply" call-to-action button areas, to avoid any chance of an ad being mistaken for the purchase/apply control.
- **Auth/payment/account/custom-projects checkout**: **exclude entirely.** Login, register, password flows, wallet top-up, and the custom-project checkout funnel should stay ad-free — consistent with the app's own convention of hiding the bottom nav on exactly these routes, and required to avoid any perception of ads interfering with a payment flow.

---

## 9. AdSense privacy requirements (not yet active — GA4 is live, AdSense is not)

No AdSense/ad-network code exists anywhere in the codebase today (re-confirmed this session: zero hits for `adsense`, `googlesyndication`, `ca-pub`, `pub-\d{10,}` across `website/src`, `next.config.js`, `.env.example`). This section documents **what will need to change when a publisher ID is actually issued and the script is added** — it does not claim any of this is active now:

1. **Cookie Policy**: add a dedicated "Advertising cookies" section once AdSense is live, naming the actual cookies Google sets (e.g. `__gads`, `__gpi`, `IDE` on `doubleclick.net`) and linking to Google's own disclosures (`https://policies.google.com/technologies/ads`).
2. **Privacy Policy**: extend the "Service providers"/"How we share information" section (§7, already GA4-aware per the fix in §7 above) to also name Google as an advertising partner, and disclose that ad personalization may use cookies/device identifiers.
3. **Consent/opt-out mechanism**: if serving EEA/UK/California users, Google's AdSense program requires either a Google-certified CMP (consent-management platform) or a documented lawful basis + opt-out path for personalized ads — this is a real implementation task at that time, not a documentation-only change.
4. **CSP**: `next.config.js`'s `script-src` will need `pagead2.googlesyndication.com`, `googleads.g.doubleclick.net`, and related Google-ads domains added — currently allow-lists only Razorpay + GA/GTM (confirmed unchanged this session). Without this, the AdSense script will be **silently blocked** by the existing CSP the moment it's added.
5. **ads.txt**: see §10.

None of this should be implemented yet — it's the checklist for the moment a publisher ID exists, per this stage's own instruction not to pre-build ad infrastructure.

---

## 10. ads.txt

**WAIT — add `ads.txt` only after receiving the actual AdSense publisher ID.**

Confirmed this session: no AdSense publisher ID exists anywhere in the repository (`grep` for `pub-\d{10,}`/`ca-pub`/`adsense` across all of `website/` returns zero hits), and `https://www.campusedux.com/ads.txt` currently 404s in production. No `ads.txt` or `app-ads.txt` file was created or invented by this audit. Once Google issues a real publisher ID, add one line (`google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`) to `website/public/ads.txt`.

---

## 11. Final checklist

# ADSENSE FINAL READINESS CHECKLIST

### Legal
- [ ] Privacy Policy accurate — **content now accurate (GA4 disclosed)**, but still renders literal `[REGISTERED BUSINESS ADDRESS]` / `[GRIEVANCE OFFICER NAME]` / `[GOVERNING CITY, STATE]` placeholders (owner action required)
- [x] Cookie Policy accurate (GA4 disclosed, opt-out documented)
- [ ] Terms accurate — same placeholder-leak as above
- [x] Disclaimer
- [x] Contact — form/flow accurate; "Operator details" has the same placeholder leak
- [ ] Grievance — same placeholder leak
- [ ] No placeholders — **blocked on real business info from the owner**

### Content
- [x] Original content (outside the flagged cluster)
- [x] Useful content (outside the flagged cluster)
- [x] No obvious scraped content (source-licensing of a few tutorial/interview sets unconfirmed — see below)
- [ ] No thin high-value-index pages — Generative AI tutorial cluster (207 pages) still live-indexable and template-filled; DB-side rewrite/exclusion still needed
- [x] No unfinished content (About page and compiler dead-end fixed and verified this session)
- [x] No fake claims (homepage trust-strip claims fixed this session)

### SEO
- [x] Sitemap (live, well-formed, 1,755 URLs)
- [x] Robots (live, well-formed)
- [x] Canonical (verified on homepage, confirmed pattern elsewhere in Stage 1/2)
- [x] Metadata (per-page, dynamic, confirmed in Stage 1/2)
- [ ] Indexation — Generative AI tutorial topics (207) still indexable and thin; coding-problem side of that cluster (336) fixed this session
- [x] Structured data (Stage 2 §12, no fabrication found)
- [x] Internal linking (Stage 2 §13, code-complete; DB migration application status is an owner/ops item, not a code gap)

### UX
- [ ] Mobile — implementation looks sound by code inspection, **not independently verified on a real device/browser this session**
- [x] Navigation (live-checked, no dead links, no redirect loops other than the one found-and-fixed)
- [x] No broken links (all sampled routes 200/308-with-Location except the one bug found and fixed)
- [x] No intrusive popups
- [x] Clear website purpose (once past the homepage-ordering note in §2, which is a product call, not a blocker)

### Security
- [x] Auth (live-verified: `/account` redirects unauthenticated users server-side)
- [x] API protection (live-verified: `/api/session` returns no data unauthenticated)
- [x] Secrets (re-verified clean this session)
- [x] User data (no leaks found)
- [x] Admin isolation (live-verified: `/admin` 404s)

### Performance
- [x] Production test (server-response timing measured live this session)
- [ ] Lighthouse/PageSpeed — **no browser available in this environment; must be run manually against the live domain**
- [ ] Core Web Vitals — **not measured, same limitation as every prior audit in this project**
- [x] Major performance issues reviewed (R1 Supabase-SDK weight, missing `.browserslistrc` — both still open, both non-blocking for submission itself)

---

## 12. Final verdict

## NOT READY — FIX THE FOLLOWING ITEMS FIRST

This is not a percentage score, and it is not a prediction of what Google will decide — it means the blockers identified across all three audit stages have not all been resolved yet. Several real blockers **were** resolved this session (see §13); three concrete ones remain and are outside what a code-only audit can safely close.

**Blockers, in priority order:**

1. **Fill in the real legal placeholder values** — `website/src/legal/legal.config.json`'s `registeredAddress`, `grievanceOfficerName`, and `governingCityState` currently render as literal bracketed text on `/privacy-policy`, `/terms`, `/contact`, and `/grievance`. This needs the owner's actual registered business address, the real name of whoever is Grievance Officer, and the state whose law governs the Terms — I cannot invent or guess any of these.
2. **Rewrite or de-index the Generative AI tutorial cluster** (207 topic pages, still live-indexable, still template-filled/verbatim-duplicated per Stage 1/2's content sampling). This is a content-authoring or DB-migration task (excluding the cluster from the `learning_sitemap` RPC / adding `robots: noindex` at the topic-page level / or genuinely rewriting the 207 topics) — larger in scope than this session's fixes and best done deliberately, not as a side effect of a readiness audit.
3. **Confirm authorship/licensing of imported source material** — the Java Tutorial (`core-java-full-course.md`), the Python Tutorial source, `AI_ML_Complete_All_10_Modules.md`, and the Python Interview Questions (explicitly sourced per migration `0110` from "Python Interview Master Guide — 240 Questions"). Only the site owner can confirm whether these were self-authored or used under a license that permits republishing.

**Everything else identified across all three audit stages as a genuine blocker has been resolved** (GA4 disclosure mismatch, About-page placeholder, empty-marketplace risk, the compiler dead-end button, the Generative-AI *coding-problem* half of the thin-content risk, the homepage's unsubstantiated trust claims, and a previously-unknown production redirect bug on `/placement/notes`). Once items 1–3 above are addressed, re-run this checklist; nothing else in this report is expected to block submission.

---

## 13. Final file change report

### Changed files (this session)

| File | Change | Why |
|---|---|---|
| `website/src/components/home/CustomProjectHero.tsx` | Replaced "Trusted by Students — Across India" and "100+ Projects — Delivered successfully" with "Built for Students — By people who get college deadlines" and "Source Code Included — Yours to keep and explain" | Unsubstantiated numeric/social-proof claims, per this stage's explicit instruction to remove or substantiate promotional claims (§2) |
| `website/src/app/coding-problems/[problemSlug]/page.tsx` | `generateMetadata` now sets `robots: { index: false, follow: true }` when a problem has no examples, no constraints, and no starter code (isolates exactly the 336 empty Generative-AI coding problems; every other cluster has at least one of these fields populated) | Closes Stage 2's confirmed P0 finding: these pages are live-indexable with near-zero content |
| `website/src/app/placement/notes/page.tsx` | Added `export const dynamic = "force-dynamic"` | Live production bug found this session: this route was serving a malformed 308 (no `Location` header, stale cached body) while its structurally-identical siblings worked correctly; forcing dynamic rendering removes the static-cache path that was producing the bad response |

### Changed files (carried from an earlier session in this engagement, verified in this session's diff review — not modified further)
`website/src/app/about/page.tsx`, `website/src/app/compiler/RuntimeErrorCard.tsx`, `website/src/app/faq/page.tsx`, `website/src/app/premium/page.tsx`, `website/src/app/referral/page.tsx`, `website/src/app/jobs/page.tsx`, `website/src/app/jobs/companies/page.tsx`, `website/src/app/projects/page.tsx`, `website/src/app/projects/trending/page.tsx`, `website/src/app/projects/category/[category]/page.tsx`, `website/src/legal/config.ts`, `website/src/legal/legal.config.json`, `website/src/legal/content/{privacy-policy,cookie-policy,data-and-permissions}.json`, `website/tests/app/seo-*-fixes.test.ts`, and the mirrored `mobile-app/src/legal/**` files (mobile is the canonical source the website syncs from).

### Unchanged important systems
Supabase (schema/RLS), Authentication, Payments (Razorpay), Custom Project Builder, Learning (content pipeline), Practice, Resume, Jobs, Projects — no code touched in any of these beyond the three narrow fixes listed above (which are metadata/rendering-mode changes, not business logic).

### Validation
| Check | Result |
|---|---|
| `npx tsc --noEmit` | **Clean**, zero errors (re-run after this session's changes) |
| `npx eslint . --max-warnings=0` | **Clean**, zero warnings/errors (re-run after this session's changes) |
| `npx vitest run` | **522 passed, 12 skipped, 0 failed** (54 test files) |
| `npm run build` | **Success**, exit clean, no errors/warnings in output, full route manifest produced |
| Live production route checks | 30 routes checked via `curl`; all correct except the one bug found and fixed (§1, §13) |

### Final blockers (see §12 for detail)
1. Real legal placeholder values (registered address, Grievance Officer name, governing state) — owner input required.
2. Generative AI tutorial cluster (207 pages) — content rewrite or DB-side de-indexing, still open.
3. Source-material licensing confirmation (Java/Python/AI-ML tutorials, Python Interview Questions) — owner confirmation required.

### Final manual checks still needed (cannot be done from this environment)
1. Run PageSpeed Insights / Lighthouse against `https://www.campusedux.com` from a real browser — no Core Web Vitals data exists anywhere in this project's history without this.
2. Load the site on an actual phone or in Chrome DevTools device mode to visually confirm the mobile audit's code-level PASS.
3. Redeploy so the `/placement/notes` dynamic-rendering fix actually reaches production (this environment cannot deploy) — then re-check `curl -I https://www.campusedux.com/placement/notes` for a proper `Location: /learning` header.
4. Spot-check a handful of live `testimonials` table rows for authenticity (this audit could not query the database).

---

**STOP.** This report does not submit CampusEduX to AdSense. No ads were added. No `ads.txt` was created. No legal placeholder values were invented.
