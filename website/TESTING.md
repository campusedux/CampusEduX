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
