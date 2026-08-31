# CampusEduX — Play Store readiness audit (Phase 48)

Audit date **2026-08-31** · App `com.campusedux.app` · Scope: `mobile-app/` + Supabase + Edge Functions.
Build gates at completion: `tsc` 0 errors · `eslint` 0 errors (2 pre-existing warnings) · `jest` 36 suites / 231 tests · `expo export --platform web` OK · `expo-doctor` 19/20 (pre-existing `expo` patch mismatch).

Formatted version: https://claude.ai/code/artifact/6eba50de-e59a-48a4-83d5-a6d26b02a141

## J. Readiness verdict — READY WITH MANUAL ACTIONS

No open Critical or High **code** findings. Four operational steps gate the launch:

1. Host `mobile-app/legal-site/` so `https://campusedux.app/privacy-policy` resolves (Play requires a live URL).
2. Apply migrations `0039` + `0040`; redeploy the `delete-account` Edge Function.
3. Fill the 3 placeholders in `src/legal/legal.config.json` + confirm the `rules` block; create `legal@ / privacy@ / grievance@campusedux.app`.
4. Spot-check the release `AndroidManifest.xml` against `permissions.md`.

## C. Fixed this engagement

| Area | Was | Now |
|---|---|---|
| In-app Privacy Policy | `notify()` toast | Full scrollable document + version/date |
| Terms screen | 6 stub sentences, hard-coded date | Complete Terms document |
| Refund / License / Guidelines / Disclaimer / Data&Permissions / Delete / Contact | did not exist | 9 documents, one config, versioned |
| Registration consent | not tappable, no record | tappable links + server-stamped `legal_consents` row (migration 0039) |
| `delete-account` (HIGH) | missed private buckets, non-recursive sweep, no rate limit, raw errors | complete table + bucket list, 1-level sweep, rate limit, failure tracking, generic errors |
| Practice-test scoring (MEDIUM) | client posts any score → dashboards/leaderboards | `submit_test_attempt()` RPC scores server-side; client INSERT dropped (migration 0040) |
| Android permissions (MEDIUM) | `CAMERA` / `RECORD_AUDIO` / `WRITE_EXTERNAL_STORAGE` pulled in transitively | blocked; explicit allow-list; `expo-image-picker` library-only |

## B. Existing & verified (not changed)

Razorpay flows (server-side amounts, HMAC verify + constant-time compare, ownership, idempotency, rate limit) · wallet withdrawal RPC `0038` · premium guards `0037` · no service-role key in any client bundle · private storage buckets + signed URLs · edge rate-limit infra `0030` · auth (email/password + Google OAuth, email verification, secure session store) · RLS spot-checks on referrals / purchases / custom-project catalog / academic targeting.

## D. Remaining issues

| Item | Owner | Severity |
|---|---|---|
| Privacy Policy URL not live | deploy | blocks submission |
| Migrations `0039`/`0040` not applied; `delete-account` not redeployed | deploy | medium |
| 3 legal placeholders in `legal.config.json` | owner | medium |
| Release manifest not verified vs real prebuild | verify | medium |
| `legal@ / privacy@ / grievance@` mailboxes | owner | low |
| No crash reporting (Sentry needs DSNs) | owner | low / later |
| `test_questions.correct_index` readable client-side (deliberate; recorded result protected) | — | accepted |
| Edge functions `CORS *` (JWT bearer auth) | — | accepted |
| Duplicate `SettingsScreen` components | cleanup | low |
| `expo` 55.0.30 vs 55.0.31 (pre-existing) | — | minor |
| `admin-panel/legacy/` (77 unused files) | cleanup | low |

## E. Owner input required

Legal/trading name confirmation · registered business address · governing city+state · Grievance Officer name · confirm refund `rules` (window 7 d, unused-Premium 7 d, processing 5–10 bd, withdrawal 3–5 bd, wallet refundable before spend, custom-project token non-refundable, downloaded projects non-refundable) · confirm `campusedux.app` + `support@campusedux.app` · Play review test account · content-rating answers · target audience confirmed 13–17 / 18+.

## F. Data Safety — see `data-safety.md`

Collected: Name, Email, Phone, User IDs (required); DOB/gender/city, Purchase history, Payment info (via Razorpay SDK — never stored by us), wallet + UPI ID, in-app messages, Photos, Files, App interactions, UGC (optional). **Not** collected: location, contacts, device IDs, advertising ID, diagnostics. Encrypted in transit = yes. Deletion available = yes. No advertising/analytics purposes.

## G. Permissions — see `permissions.md`

Ships: `INTERNET`, `POST_NOTIFICATIONS`, `READ_MEDIA_IMAGES` / `READ_EXTERNAL_STORAGE` (maxSdk 32), plus `VIBRATE` / `WAKE_LOCK` / `RECEIVE_BOOT_COMPLETED` from `expo-notifications`.
Blocked: `CAMERA`, `RECORD_AUDIO`, `READ_MEDIA_VIDEO`, `READ_MEDIA_AUDIO`, `WRITE_EXTERNAL_STORAGE`, `SYSTEM_ALERT_WINDOW`. Payments via Razorpay, not Play Billing.

## H. Third-party services

Supabase (DB/Auth/Storage/Functions — all data; required) · Razorpay (payments; card/UPI stay in Razorpay's UI; required for purchases) · Google OAuth via Supabase (optional sign-in) · Expo (framework/libraries; no personal data to Expo). No analytics / ads / crash SDK.

## I. Security findings

- **Critical:** none.
- **High:** `delete-account` erasure — fixed, pending redeploy.
- **Medium:** forgeable test results — fixed, pending migration `0040`. Unused Android permissions — fixed. No consent record — fixed, pending migration `0039`.
- **Low / accepted:** as in section D.

## K. Production checklist

### Backend & deploy
- [ ] `supabase db push` — applies `0039_legal_consent.sql` + `0040_test_attempt_scoring.sql`
- [ ] `supabase functions deploy delete-account`
- [ ] Confirm `0037` / `0038` / `0030` already applied on production
- [ ] Razorpay **live** keys set as function secrets (not test keys)
- [ ] Smoke-test a real account deletion — rows + storage folders gone
- [ ] Smoke-test a practice-test submission — score matches the answer key

### Legal site & config
- [ ] Fill `[GOVERNING CITY, STATE]`, `[REGISTERED BUSINESS ADDRESS]`, `[GRIEVANCE OFFICER NAME]` in `legal.config.json`
- [ ] Confirm/adjust `rules` (refund windows, processing times)
- [ ] `npm run legal:html` and deploy `legal-site/` to `campusedux.app`
- [ ] Verify `/privacy-policy`, `/terms`, `/delete-account` load without login on mobile
- [ ] Create + monitor `legal@ / privacy@ / grievance@campusedux.app`

### Build
- [ ] Bump `version` from `0.1.0` in `app.json` + `package.json`
- [ ] Confirm `android.package` = `com.campusedux.app`; set/confirm `versionCode`
- [ ] EAS production build; open merged `AndroidManifest.xml`
- [ ] Confirm no `CAMERA` / `RECORD_AUDIO` / `WRITE_EXTERNAL_STORAGE`
- [ ] Signed with the Play App Signing upload key
- [ ] Re-run `npm run check` + `npm test` on the release commit

### Play Console — Store listing
- [ ] Name, descriptions, icon, feature graphic, 8 screenshots
- [ ] Category Education; contact `support@campusedux.app`; website `campusedux.app`
- [ ] Privacy Policy URL `https://campusedux.app/privacy-policy`

### Play Console — App content
- [ ] Data safety per `data-safety.md` (encrypted in transit = yes; deletion = yes)
- [ ] Ads: **No**
- [ ] App access: review test account + "payments are Razorpay test mode" note
- [ ] Target audience: 13–15, 16–17, 18+; not Designed for Families
- [ ] Content rating questionnaire (UGC yes; digital purchases yes; gambling no)
- [ ] Government / financial / health declarations: none

### Release
- [ ] Upload AAB to internal/closed track first
- [ ] Run the security test matrix (cross-user access, price tampering, fake payment, deleted-user access, malicious upload, rate limits)
- [ ] Release notes
- [ ] Staged production rollout

## Appendix — see the formatted report or the engagement memory for the full files-created / files-modified list.
