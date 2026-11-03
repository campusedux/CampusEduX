# Testing the CampusEduX website

## Quick gates (no network, no Supabase)

```bash
npm run typecheck      # tsc --noEmit
npm run lint           # next lint
npm test               # vitest run  (unit + Server Action tests)
npm run build          # full production build
```

`npm test` runs in a Node environment (mirrors `admin-panel/vitest.config.ts`).
Supabase, `next/headers` and `next/navigation` are mocked — see
`tests/helpers/supabase.mock.ts`. No env vars or network needed.

### GA4 execution regression

Analytics uses the standard page-level Google tag after analytics consent, on
public HTTP(S) routes. Google can access the page after consent; the former
opaque sandbox could not read cookies and failed inside Google's event processor.
Manual page views strip queries/fragments and exclude private routes. Withdrawal
sets GA's collection opt-out and denied Consent Mode signals; removing a loaded
script alone would not stop Google's timers.

Before release, in the intended GA4 web stream, turn off **Enhanced measurement →
Page views → Show advanced settings → Page changes based on browser history
events**. The app owns initial and subsequent page views. `send_page_view: false`
does not disable that remote history rule; leaving both enabled duplicates views.
See [Google's manual pageview guidance](https://developers.google.com/analytics/devguides/collection/ga4/views).
Do not change advertising settings for this fix.

Run the real-tag regression from the repository root with
`node website/scripts/verify-analytics.cjs --measurement-id <public-GA4-ID>`.
It uses the existing `build/playwright-mcp-phase7` browser installation and Git
commit `7680a99` to reproduce the original sandbox exception, then runs the current
analytics source under production CSP with and without a nonce. It checks consent,
manual client navigation, duplicate views, stored choices, private routes, and
script-load failure/retry. Google tag downloads require network access; every
collection request is intercepted and answered locally, never forwarded to GA4.
It does not read environment files, call Supabase, or prove receipt in Realtime.
Add `--app-url http://127.0.0.1:3111` to also check the rebuilt local Next.js app
through real link clicks. Start that app separately with a verified local/test
configuration; the script blocks nonlocal browser services except the Google tag.
The browser cannot constrain server-side upstream calls, so never point the local
app at production Supabase for this check. The script exits nonzero if Google's
remote history rule still adds duplicate page views.

### What the Vitest suite covers (`tests/`)

| File | Covers |
|---|---|
| `tests/lib/payments.test.ts` | `interpretVerifyResponse` — the single gate every checkout flow (wallet top-up, Premium, custom project) routes its Razorpay verify response through. Asserts a flow can **never** reach "success" on a transport error, a missing body, or an `{ error }` body. |
| `tests/lib/auth.test.ts` | `requireUser()` redirects to `/login` when signed out; maps the `profiles` row; survives a missing profile. `getOptionalUser()` returns `null` without redirecting. |
| `tests/lib/resume.test.ts` | Resume file rules — extension allow-list (PDF/DOC/DOCX, matching the mobile picker), 10 MB cap, storage path is always under `<uid>/`. |
| `tests/lib/customProjects.test.ts` | `computeEstimate` — base + **eligible** feature prices + platform charge; a feature not valid for the tier is excluded; the token is the fixed per-type constant, never a % of the estimate. `normalizeDraft` drops junk / bad enums / non-string ids. |
| `tests/lib/format.test.ts` | `formatINR`, `timeAgo`. |
| `tests/actions/jobs.test.ts` | `applyToJobAction` — rejects signed-out, a missing job, an upload path not under `<uid>/`, a non-PDF/DOC/DOCX file; maps `23505` → "already applied"; on success inserts `resumes` with a **server-minted** signed URL (never a client value) and binds `applications.user_id` to the session. `toggleSaveJobAction` insert vs delete. |
| `tests/actions/customProjects.test.ts` | `sendCustomProjectMessageAction` — Zod length bounds, non-uuid rejection, signed-out rejection, ownership re-check, `sender_role: 'student'` + `sender_id` from the session. |
| `tests/actions/contact.test.ts` | `submitContactMessageAction` — Zod name/email/message validation, trims values, derives the rate-limit key from `x-forwarded-for`, maps `RATE_LIMITED` and "function not deployed" DB errors to friendly copy. |

## Manual / integration checks that need a live (test) Supabase project

These are **not** in the automated suite yet — they need a real, confirmed
session against a Supabase project that has the mobile + admin + website
migrations applied.

1. **Set up `.env.local`** with `NEXT_PUBLIC_SUPABASE_URL` /
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` for that project, then `npm run dev`.
2. **Apply `supabase/migrations/0001_contact_submissions.sql`** to the project
   (Supabase CLI `db push`, or SQL Editor → paste + Run). Until then the
   contact form returns "email us directly".
3. **Auth**: register, confirm, sign in with email and with mobile number
   (`email_for_mobile` RPC path). `/account/*` must redirect to `/login` when
   signed out.
4. **RLS isolation** — sign in as user A, then hit these pages directly and
   confirm you never see user B's rows:
   - `/account/purchases`, `/account/applications`, `/account/saved-jobs`,
     `/account/resume`, `/account/wallet`, `/account/referral`,
     `/account/notifications`
   - `/custom-projects/my-projects` and a known request id of user B under
     `/custom-projects/my-projects/<id>` (should 404 / be empty).
5. **Apply to a job** (`/jobs/<id>`): upload a PDF → check the object lands at
   `resumes/<your-uid>/…`, a `resumes` row + an `applications` row are
   created, and a second apply to the same job shows "already applied".
6. **Custom project flow**: `/custom-projects/start` → features → estimate
   (numbers match `custom_project_pricing` + `_platform_pricing` +
   `_features`) → checkout. With Razorpay in **test mode**, complete a token
   payment and confirm `verify-custom-project-payment` flips the request to
   paid, the draft is cleared, and `/custom-projects/my-projects/<id>` shows
   it. Send a message and confirm it appears for the admin.
7. **Contact form**: submit 5 times quickly from one IP → the 5th is
   rate-limited; the rows appear in **admin-panel → Banner & CMS → Contact
   Messages**.

## Follow-ups

- Component (jsdom + React Testing Library) tests for the checkout buttons
  and the wizard — deferred, same call the admin panel made.
- Turn checklist items 3–7 above into an integration suite once a seeded
  test project + a service-role key (for fixture setup/teardown) are
  available.
