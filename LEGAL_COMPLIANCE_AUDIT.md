# CampusEduX — Legal & Compliance Audit + Implementation

**Date:** 2026-09-02
**Scope:** Website (`website/`) + Mobile app (`mobile-app/`) + Admin panel (`admin-panel/`), one shared Supabase project.
**Status:** Implemented. All build gates green. Owner inputs + one migration still outstanding (see §"Owner information still required").

> This is a software / legal-content implementation. It is **not** a substitute for review by a
> qualified Indian lawyer before public launch.

---

## 1. Approach

The **mobile app already had a complete, code-accurate canonical legal system** (shipped in an
earlier engagement): `mobile-app/src/legal/` — `legal.config.json` (owner facts, business rules,
per-document versions) + 9 structured JSON documents, token-interpolated, DPDP-aligned, 13+.

This engagement made the **website use that same canonical content** instead of its previous mix of
empty CMS rows and thin placeholders, so the two platforms are provably consistent, and added the
two website-specific pages (Cookie Policy, Grievance Redressal) plus a `/legal` hub and
registration consent.

**One source of truth:** `mobile-app/src/legal/` (owned by the mobile app). `website/scripts/sync-legal.mjs`
copies the config + the 9 shared documents into `website/src/legal/`; `website/tests/legal/consistency.test.ts`
fails the build if the copies ever drift. Website-only documents (`cookie-policy.json`) are authored
directly in the website and are never touched by the sync.

`cms_pages` (the old admin free-text editor for Terms/Privacy) is **retired for legal content** — it
was already orphaned (the mobile app stopped reading it when the JSON system landed). The admin page
now carries a banner explaining that policies are code-versioned. The table is untouched.

---

## 2. Legal Page Matrix — after implementation

| Legal / Policy Page | Website route | Mobile screen | Admin/CMS | Status | Action taken |
|---|---|---|---|---|---|
| Privacy Policy | `/privacy-policy` | Legal & Privacy → Privacy Policy | code (`legal/content/privacy-policy.json`) | ✅ Live | Website was an empty CMS stub → now renders the canonical doc |
| Terms & Conditions | `/terms` | Legal & Privacy → Terms | code | ✅ Live | Website was an empty CMS stub → canonical doc |
| Refund & Cancellation Policy | `/refund-policy` | Legal & Privacy → Refund | code | ✅ Live | Website was an empty CMS stub → canonical doc |
| Disclaimer | `/disclaimer` | Legal & Privacy → Disclaimer | code | ✅ Live | Website was 4 hand-written bullets → canonical doc (10 sections) |
| Project License Policy | `/project-license` | Legal & Privacy → Project License | code | ✅ Live | Website was a "MANUAL IMPLEMENTATION REQUIRED" placeholder → canonical doc (Academic / Personal / Business / Custom licenses) |
| Community Guidelines | `/community-guidelines` | Legal & Privacy → Community Guidelines | code | ✅ Live | Website was partial + a placeholder note → canonical doc (10 sections incl. reporting/moderation/appeal) |
| Data & Permissions | `/data-and-permissions` | Legal & Privacy → Data & Permissions | code | ✅ Live | **New website route** — renders the canonical doc |
| Cookie Policy | `/cookie-policy` | — (app has no cookies) | code (`legal/content/cookie-policy.json`, website-only) | ✅ Live | **New** — authored from the real website (Supabase auth cookies + functional local storage; no analytics/ads) |
| Grievance / Legal Contact | `/grievance` | Contact → "Grievance Officer" section + Privacy §14 | composed from `legal.config.json` | ✅ Live | **New website route** — Grievance Officer, all channels, timelines, escalation to the Data Protection Board of India |
| Contact Us | `/contact` | Legal & Privacy → Contact | code + form | ✅ Live | Kept the working contact form; added the canonical channel breakdown (support / billing / privacy / grievance / legal / operator details) below it |
| Delete Account | `/delete-account` | Settings → Delete Account (functional) | code | ✅ Live | Website was decent + a placeholder note → canonical doc + a web-specific "delete from the app / email privacy@" callout |
| Legal hub / index | `/legal` | Legal & Privacy hub | — | ✅ Live | **New** — lists every policy with its version + effective date |
| Copyright / Intellectual Property | covered in **Terms §6 (Project license & IP)** and **§7 (Copyright complaints)**, Community Guidelines §5 | Terms | code | ✅ Covered | No separate page (would duplicate Terms); `legal@` is the complaint channel |
| Third-Party Services | covered in **Privacy §4 (payments), §5 (infrastructure), §7 (how we share)** | Privacy | code | ✅ Covered | No separate page; the list is in Privacy and is short (Razorpay, Supabase, Google, Expo) |
| Accessibility Statement | — | — | — | ⏸ Not implemented | Not legally required in IN; the site already passed an a11y pass (skip-link, focus-visible, AA contrast, reduced-motion). Can be added later if desired. |
| Cookie consent banner | n/a | n/a | n/a | ✅ Not needed | The website runs **no** non-essential cookies/analytics/ads, so there is nothing to consent to; the Cookie Policy explains this. |

---

## 3. Website routes (final)

Public, indexable, `alternates.canonical` set, in `sitemap.xml`, `○ Static` (no DB reads):

```
/legal                     Legal & Privacy hub (index of all policies + versions)
/privacy-policy             canonical Privacy Policy
/terms                      canonical Terms & Conditions
/refund-policy              canonical Refund & Cancellation Policy
/disclaimer                 canonical Disclaimer
/project-license            canonical Project License Policy
/community-guidelines       canonical Community Guidelines
/data-and-permissions       canonical Data & Permissions        (new)
/cookie-policy              website-only Cookie Policy           (new)
/grievance                  Grievance Redressal (config-driven) (new)
/delete-account             canonical Delete Account + web callout
/contact                    canonical Contact + working contact form
/support                    FAQ / Contact / Legal shortcuts (unchanged, + a "Legal & policies" link)
```

`robots.ts` already allows all of these and blocks `/account`, `/api`, `/auth`, `/admin`, the
custom-project wizard. Legal pages are intentionally crawlable.

---

## 4. Mobile screens (unchanged — verified consistent)

`LegalHubScreen` → `LegalDocumentScreen` (renders `LegalDocumentBody`) for the 9 docs, plus
`ContactScreen` and `DeleteAccountInfoScreen`. Reachable from Settings, Privacy screen, and the
Register screen (tappable Terms/Privacy links). Consent recorded on first authenticated load via
`legal.service.ensureConsentRecorded()`. **No mobile files were changed in this engagement.**

---

## 5. Admin CMS

* `admin-panel/src/app/(panel)/cms/pages/page.tsx` — added a banner: the legal policies are now
  versioned in `mobile-app/src/legal/` and shown identically on web + app; a consistency test
  guards drift. The Terms/Privacy free-text fields remain for reference only and are no longer
  displayed to users.
* `cms_pages` table, RLS and other CMS modules (banners, announcements, FAQs, testimonials, push,
  contact submissions) — **untouched**.
* To change a policy or an owner detail: edit `mobile-app/src/legal/legal.config.json` /
  `content/<id>.json`, bump the version, `cd website && npm run legal:sync`, ship a release.

---

## 6. Third-party services actually used (verified in code)

| Service | Used by | Purpose | Their policy |
|---|---|---|---|
| **Supabase** | web + app + admin | Postgres DB, Auth, private/public Storage, Edge Functions | https://supabase.com/privacy |
| **Razorpay** (Razorpay Software Private Limited) | web + app | Payment processing for projects, Premium, wallet top-ups, custom-project tokens. Card/UPI/bank details entered in Razorpay's own checkout; the app stores only order id, payment id, signature, amount, status, item. Server-side HMAC verification. | https://razorpay.com/privacy/ |
| **Google** (OAuth) | **mobile app only** ("Continue with Google") | Name, email, profile picture. The **website** register flow is email + password only. | https://policies.google.com/privacy |
| **Expo / EAS** | mobile app | Build & OTA runtime for the React Native app | https://expo.dev/privacy |

**Not present anywhere:** Google Analytics, Firebase Analytics, Meta/Facebook Pixel, Mixpanel,
PostHog, Segment, Hotjar, Clarity, Sentry/crash SDKs, advertising/attribution SDKs. No push token
is registered with any external push service (notifications are in-app DB rows).

---

## 7. Data categories collected (verified)

Account: email, mobile number, full name, hashed password (via Supabase Auth), user id, timestamps;
optional profile photo, course/branch/year, and optional date of birth / gender / city.
Resume: builder content (education, skills, experience, projects, links), uploaded resume files,
generated PDFs, estimated ATS score.
Marketplace & content: purchases, downloads, wishlist, reviews & ratings, custom-project requests +
uploaded reference files.
Jobs: applications + stage history, attached resume, saved jobs, job-alert preferences.
Placement: practice-test attempts & scores, DSA progress, saved/favourite questions.
Commerce: wallet ledger (credits/debits), wallet top-up orders, withdrawal UPI id, referral code +
referred accounts + earnings, premium subscription record.
Payments: order id, payment id, payment signature, amount, fee/discount, total, currency (INR),
status, item, coupon code. **No** card number / CVV / card-PIN / UPI-PIN / bank credentials.
Support: content of emails you send; contact-form submissions (`contact_submissions`).
Device/local: login session in secure storage, cached profile, app settings; on the website,
Supabase auth cookies + functional `localStorage` (compiler drafts, dismissed banner).
Consent: `legal_consents` — version strings + timestamp + source, one row per acceptance.

---

## 8. Account deletion — verified implementation

* **Mechanism:** `mobile-app/supabase/functions/delete-account/index.ts` (Edge Function), invoked
  from the app's **Settings → Delete Account** while signed in. Rate-limited 3 / 5 min → 429.
* **Deletes:** rows the user owns across `profiles`, purchases/downloads/wishlists/reviews,
  `resumes` + `resumes_builder` + `resume_downloads`, applications + `saved_jobs` + `job_alerts`,
  `test_attempts` + progress + favourites, `custom_project_*` (drafts, requests, payments),
  `wallet_transactions` + `wallet_topup_orders`, `referrals`/`referral_*`, `notifications` +
  preferences, `prep_note_bookmarks`, `legal_consents`; then deletes the `auth.users` row
  (authoritative — DB cascades handle the rest). Storage: `avatars`, `resumes`,
  `custom-project-uploads`, `custom-project-deliveries` (one level deep). Row/storage failures are
  logged (`ORPHAN SWEEP NEEDED`) but do not block auth-user deletion.
* **Retained:** transaction/invoice records for the period IN tax & accounting law requires;
  records needed for an open dispute / chargeback / fraud / legal claim; anonymised/aggregated
  data; encrypted backups until they cycle. This is stated in the Privacy Policy §8/§9 and the
  Delete Account doc.
* **Website:** no self-serve delete UI. `/delete-account` documents the in-app path and the
  `privacy@campusedux.app` fallback for users who cannot use the app (identity-verified).
* **Docs match behaviour:** yes — the Delete Account and Privacy docs describe exactly this,
  including that erasure is not 100% immediate everywhere (backups, legally-retained records).

---

## 9. Payments & refunds — verified implementation

* Four verify Edge Functions (`verify-razorpay-payment`, `verify-premium-payment`,
  `verify-wallet-topup-payment`, `verify-custom-project-payment`): server-computed amounts, HMAC
  signature check, ownership check, idempotency, rate limiting. No service-role key in the website
  or app bundle. Razorpay `theme.color` is the brand indigo.
* Refund rules published in the Refund Policy come from `legal.config.json → rules` and match the
  product:
  * Refund request window: **7 days** (`refundRequestWindowDays`).
  * Processing: **5–10 business days** to the original method.
  * Marketplace projects (digital): **non-refundable once downloaded**.
  * Custom-project tokens (₹1,500 / ₹3,000 / ₹6,000): **non-refundable** once work has begun.
  * Premium: refundable within **7 days if unused**.
  * Wallet top-ups: refundable **before** the balance is spent.
  * Withdrawals: processed in **3–5 business days**.
  * Failed / duplicate payments: auto-reversed or refunded in full.
* No refund/earnings guarantee is stated that the backend cannot honour.

---

## 10. SEO

* Every legal route exports `metadata` with `title`, `description` (from the doc summary),
  `alternates.canonical`, an OpenGraph block, and `robots: { index: true, follow: true }`.
* `sitemap.ts` — added `/legal`, `/data-and-permissions`, `/cookie-policy`, `/grievance`
  (the others were already listed).
* Account/wizard pages stay `noindex` (unchanged).

---

## 11. Registration consent

* `website/src/app/register/page.tsx` — added "By creating an account you agree to the Terms &
  Conditions and Privacy Policy" with links (open in a new tab), above the submit button.
* On a successful sign-up that returns a session, the page calls the existing
  `record_legal_consent` RPC (`p_source: "website_register"`) — best-effort, never blocks signup.
* `website/src/app/account/layout.tsx` — `ensureLegalConsent("website")` records consent on the
  first authenticated page load for users who confirmed their email before a session existed.
  Best-effort, non-throwing (safe if migration 0039 is not yet applied).
* No consent record is fabricated; nothing is written for a user who has not signed in.

---

## 12. Security review of the changes

* Legal pages are static, read no user data, render **plain text only** — never
  `dangerouslySetInnerHTML` (the content files hold no markup).
* No secrets, env values or internal identifiers are exposed. The consent RPC is `SECURITY
  DEFINER` and pins `user_id`/`accepted_at` server-side; the client only reports version strings.
* Account deletion still requires an authenticated session; no password is ever requested by email
  (stated in the docs).
* The contact form keeps its existing Zod validation + DB-side rate limit.
* Admin legal note is behind the existing `requireModule('cms')` gate.
* No new dependency added. `grep` for analytics/ad SDKs, `service_role`, `RAZORPAY_KEY_SECRET`,
  `eval`/`new Function` in `website/src` — clean.

---

## 13. Build & test results

| Project | typecheck | lint | test | build |
|---|---|---|---|---|
| `website/` | ✅ 0 errors | ✅ 0 warnings | ✅ **146 passed** (22 files; +10 new `tests/legal/consistency.test.ts`) | ✅ compiled; all 12 legal routes `○ Static` |
| `admin-panel/` | ✅ 0 errors | ✅ 0 warnings | (not run — no test-relevant change) | ✅ compiled; 107 static pages |
| `mobile-app/` | n/a | n/a | n/a | **not modified by this engagement** |

Dev-server smoke: all 12 legal routes return `200`; tokens interpolate; owner placeholders render
as visible `[BRACKETED]` text; no "policy has not been written yet" anywhere; no runtime errors.

---

## 14. Existing / Added / Updated

**Existing before this engagement (kept):**
Website — `/privacy-policy`, `/terms`, `/refund-policy` (empty CMS stubs), `/disclaimer`,
`/project-license`, `/community-guidelines`, `/delete-account`, `/contact` (+`ContactForm`),
`/support`. Mobile — the entire `src/legal/` canonical system. Admin — `cms_pages` + editor.

**Added (new files):**
`website/src/legal/` (config.ts, types.ts, interpolate.ts, registry.ts, seo.ts, LegalPageShell.tsx,
LegalProse.tsx, LegalDocView.tsx, legal.config.json, content/×10) ·
`website/scripts/sync-legal.mjs` · `website/src/lib/legalConsent.ts` ·
`website/src/app/{legal,data-and-permissions,cookie-policy,grievance}/page.tsx` ·
`website/tests/legal/consistency.test.ts` · this file.

**Updated:**
Website — `src/app/{privacy-policy,terms,refund-policy,disclaimer,project-license,community-guidelines,delete-account,contact,support,register}/page.tsx`,
`src/app/account/layout.tsx`, `src/components/Footer.tsx`, `src/app/sitemap.ts`, `package.json`.
Admin — `src/app/(panel)/cms/pages/page.tsx`.

---

## 15. Owner information still required (do not fabricate)

These render as visible `[BRACKETED]` placeholders on the website **and** the app until filled in
`mobile-app/src/legal/legal.config.json` (then `npm run legal:sync` + release):

1. **`governingCityState`** — `[GOVERNING CITY, STATE]` — the city/state whose courts govern disputes (Terms §24).
2. **`registeredAddress`** — `[REGISTERED BUSINESS ADDRESS]` — postal address for legal/grievance notices (Privacy §14, Contact, Grievance).
3. **`grievanceOfficerName`** — `[GRIEVANCE OFFICER NAME]` — the named Grievance Officer required under Indian law.

Also confirm, in the same file:
* The mailboxes `support@ / privacy@ / legal@ / grievance@campusedux.app` exist and are monitored.
* The `rules` values (7-day refund window, 5–10 day processing, 3–5 day withdrawals, non-refundable custom-project tokens, 7-day unused-Premium refund) are the ones you actually operate.
* `minimumAge` 13 and `country` "India" are correct for your launch.
* Whether `entityDescription` ("an individual operating under the unregistered trading name 'CampusEduX' in India") is still accurate, or you have since registered an entity (then also set `NEXT_PUBLIC_LEGAL_ENTITY_NAME` on the website).

---

## 16. Remaining risks / manual actions

* **Migration `0039_legal_consent.sql` is not yet applied to the live database** (tracked from the
  earlier engagement, alongside `0040_test_attempt_scoring.sql`). Until it is, `record_legal_consent`
  does not exist and consent is not persisted — the website/app calls are written to fail silently,
  so nothing breaks, but no consent audit trail is kept. Apply with `supabase db push` and redeploy
  the `delete-account` function.
* **A qualified Indian lawyer should review** the Terms, Privacy Policy, Refund Policy and Project
  License before public launch, and confirm the DPDP-2023 / IT-Rules-2021 grievance wording once the
  Grievance Officer is named.
* `data-and-permissions.json` describes device permissions in mobile terms ("Photos and files",
  "Camera not used", "Notifications"). It renders verbatim on the website for consistency; the intro
  makes clear it is about the app. Acceptable, but note it if you localise or split web/app copy later.
* The website has no in-account "Delete my account" button; deletion is app-only + an email
  fallback. If store policy or your own preference wants web self-serve deletion, that is a future
  feature (an authenticated route calling the same Edge Function).
* Accessibility Statement not published (not required in IN; site already meets the practical bar).
