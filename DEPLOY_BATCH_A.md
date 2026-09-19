# Batch A — non-payment security + crash fixes — deploy guide

Branch: `fix/batch-a` (based on `wip/pre-batch-a`, which holds the previously uncommitted WIP). Nothing here has been applied to any live database, deployed, or merged. **All payment items (PAY-\*, DB-01/02/06/29, MOB-01..04/19/22) are deliberately untouched** — they are for payment integration.

Verified locally: PG17 harness (`mobile-app/supabase/tests/harness/`, 216-migration chain, 12 SQL test files, all 12 pass; all 12 new migration files re-apply idempotently); `tsc`, lint, tests, `expo export` web, `next build` green for mobile-app / admin-panel / website (counts at the end). **Not done here:** device/browser runs of the app, the Deno edge-function change (`_shared/client.ts`), anything against live Supabase.

---

## 0. Before you start (pre-flight, read-only, on LIVE)

1. Back up: Supabase dashboard → Database → Backups (or `pg_dump` policies + `profiles`). Note the current time for rollback.
2. Run `mobile-app/supabase/checks/batch_a_db1_checks.sql` and `batch_a_db2_checks.sql` in the SQL editor **now** — expect FAIL rows (that is the "before" picture). Save the output.
3. Confirm the earlier WIP migrations are applied, or apply them first in order: mobile `0113–0116` (admin `085–088` twins). Batch A migrations assume the chain up to 0116.
4. **Lock-out guards** (0118/0119 change who can write):
   ```sql
   -- every real user must have a profile (is_active_user() = profile exists and not blocked)
   select count(*) as users_without_profile from auth.users u left join public.profiles p on p.id=u.id where p.id is null;   -- expect 0
   -- at least one active super_admin, and the permission matrix seeded
   select id,email,role,status from public.admin_users;
   select role, count(*) from public.role_permissions group by 1;
   ```
   If `users_without_profile` > 0, create their profile rows before 0118. If there is no active `super_admin`, fix that before 0119.
5. Decide the judge secret (any long random string, e.g. `openssl rand -hex 32`). Keep it; it goes in **two** places (step 2 below and website env).

---

## 1. Deploy order

Twin migration files (mobile `01xx` ↔ admin `0xx`) are **byte-identical** and idempotent; live is one database, so applying either copy is enough (applying both is a harmless no-op).

### Step 1 — Migrations (SQL editor or `supabase db push`), in this order
| # | File (mobile / admin twin) | Audit ids | Effect |
|---|---|---|---|
| 1 | `0117_project_files_private_check` / `089` | DB-22 | forces `project-files` bucket private + purchaser-only read; 10 MB `resumes`, 15 MB `custom-project-uploads` limits (only if unset); replaces `avatars_public_read` listing policy with owner-only select |
| 2 | `0118_profiles_guard_and_blocked_enforcement` / `090` | DB-03, DB-04, DB-32 | profile column guard trigger; `is_active_user()`; blocked users can't write (45 own-row policies + 7 storage policies rewritten); guard in 3 RPCs |
| 3 | `0119_admin_permission_enforcement` / `091` | DB-07, DB-26/27/28 | admin **write** policies (60 tables + 7 storage) now need `has_permission(module, action)`; money/destructive admin RPCs need super_admin/admin |
| 4 | `0120_hide_secrets_and_premium_content` / `092` | DB-05, DB-10, DB-11, DB-13 | hides `test_cases`/`solution_code` (column revoke), secret-gates `*_run_cases`, premium question bank + premium prep_notes, draft jobs/projects |
| 5 | `0121_resume_shares_and_referral_rules` / `093` | DB-17, DB-08 (non-payment), DB-15, DB-38 | share ownership + pinned token; signup reward disabled; daily referral cap; self-referral normalisation; random codes; `referral_leaderboard()` RPC |
| 6 | `0122_rate_limit_and_ai_budget` / `094` | (WEB-01/08 backend) | `rl_hit()`, `ai_budget_take()` + tables |
| 7 | `website/supabase/migrations/0002_contact_limiter_hardening.sql` | DB-20 | contact-form limiter hardening (needs website `0001` already applied) |

Immediately after step 6, before anything else:
```sql
insert into public.app_secrets(name, secret_hash)
values ('judge_rpc', encode(extensions.digest('<THE SECRET FROM STEP 0.5>','sha256'),'hex'))
on conflict (name) do update set secret_hash = excluded.secret_hash;
```
Then run both `checks/batch_a_db1_checks.sql` and `batch_a_db2_checks.sql`: every row should be PASS (INFO rows are informational).

> **Do steps 1 and 2 close together (same window, minutes).** Between migration 0120 and the new website/admin going live: the old website's judge/submit routes fail (they don't send the secret) and the old admin panel can't open coding-problem edit forms (it selects the revoked columns). Old mobile builds keep working except the referral leaderboard shows only your own row.

### Step 2 — Website + admin (Vercel)
Env vars first, then deploy.
- **website** (server-only unless noted):
  - `JUDGE_RPC_SECRET` = same secret as step 0.5 — **required**, else judge/submit routes return 503 (fail closed).
  - `COMPILER_REQUIRE_AUTH` — now defaults to **true**; remove any `false` override.
  - Optional tuning: `JUDGE_RATE_LIMIT_MAX` (6) / `JUDGE_RATE_LIMIT_WINDOW_SECONDS` (60), `COMPILER_RATE_LIMIT_MAX` (20) / `COMPILER_RATE_LIMIT_WINDOW_MS`, `AI_DAILY_LIMIT_RESUME_ASSIST` (30), `AI_DAILY_LIMIT_PROJECT_UNDERSTAND` (20).
- **admin-panel**: `SUPABASE_SERVICE_ROLE_KEY` — **optional, server-only, never `NEXT_PUBLIC_`**. Only needed so "Block student" also bans the auth user. Without it the block is still enforced in the database (0118) and a warning is shown. Adding a service-role key to the admin app is a security decision — see "Decisions".

### Step 3 — Edge functions (can be deferred)
`mobile-app/supabase/functions/_shared/client.ts` now rejects blocked users. It is bundled into every function at deploy time; payments aren't live, so **you can skip deploying edge functions in Batch A** — the DB-level block already protects data. If you deploy, deploy only what you need (`supabase functions deploy <name>`); note the committed WIP `create-custom-project-order` would go out too if you deploy it. This change was not run under Deno here.

### Step 4 — Mobile app build
Do the EAS steps in section 3 first, then `eas build`. Ship after Steps 1–2 are live (the new app calls the `referral_leaderboard` RPC from 0121).

---

## 2. Rollback

| Layer | How |
|---|---|
| Migrations | Each of 0117–0122 (and website 0002) ends with a commented **ROLLBACK** block — run the block(s) in reverse order (0122 → 0117). Rolling back 0120 re-exposes test cases/solutions and drafts; rolling back 0118 removes blocked-user enforcement. Restore from the pre-flight backup only for a hard failure. |
| Admin lock-out (0119) | Signed in as a super_admin you cannot be locked out (bypass tested). If a role loses access wrongly, fix `role_permissions` rows (no migration needed) or run the 0119 rollback block. |
| Website / admin | Vercel → Deployments → Promote the previous deployment. Old website after 0120 still can't judge (needs the secret) — either roll DB back too or keep the new site. |
| Mobile | Old build stays installable; there is no server-side dependency on the new build except the leaderboard RPC (safe to leave in place). |
| `app_secrets` row | `delete from public.app_secrets where name='judge_rpc';` (judge then fails closed). |

---

## 3. Things you must do yourself (owner actions)

**EAS (MOB-30/31)** — from `mobile-app/`:
1. `eas login && eas init` → writes `extra.eas.projectId` into `app.json` (commit it). I did not invent an id.
2. For each environment `development`, `preview`, `production` (profiles already reference them): 
   `eas env:create --environment <env> --name EXPO_PUBLIC_SUPABASE_URL --value https://<ref>.supabase.co --visibility plaintext`
   `eas env:create --environment <env> --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <publishable/anon key> --visibility plaintext`
   (publishable/anon only — never a secret/service-role key). Optionally `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` the same way. Without these a store build crashes at start.
3. `eas build:version:set` once (version source is now `remote`; `android.versionCode`/`ios.buildNumber` seeded to 1).
4. Needs network: `npx expo install expo@~55.0.31` (the only remaining `expo-doctor` warning), commit the lockfile.
5. Later: set `STORE_URL` in `src/constants/contact.ts` after publishing (the "Rate us" row is hidden until then). `react-native-razorpay` needs a dev/production build, not Expo Go.

**Supabase Auth dashboard** (cannot be done from the repo): confirm password minimum, "Confirm email" on, CAPTCHA, rate limits.

---

## 4. Post-deploy checks

1. `checks/batch_a_db1_checks.sql` + `checks/batch_a_db2_checks.sql` → all PASS.
2. Anon can't read secrets: with the anon key, `GET /rest/v1/dsa_problems?select=test_cases` → error (permission denied); `select=id,title` → works.
3. Anon judge call: `curl -X POST https://<site>/api/practice/judge -d '{...}'` without cookies → **401**. Logged-in call → works. Temporarily unset `JUDGE_RPC_SECRET` on a preview deploy → **503**.
4. Rate limit: 7 judge calls within a minute as one user → the 7th returns 429.
5. Block test (staging user): admin blocks the user → user's `PATCH /profiles?id=eq.<me>` `{"status":"active"}` has no effect; inserting an application/review fails; (if the service key is set) login is refused.
6. Role test: sign in as a `viewer` admin → `PATCH /rest/v1/jobs?...` returns 0 rows / 403; `rpc/admin_adjust_wallet` → 42501. Super admin can still edit jobs/projects/students in the panel (click through each admin module once).
7. Drafts: a `draft` job/project is invisible on the website and in the app for a normal user, visible in admin.
8. Resume share: user A tries to create a share for user B's `resume_id` → RLS error.
9. Admin panel → Learning → open a coding problem: test cases + solution load (via `admin_dsa_problem_secrets`).
10. Mobile: wrong password shows an inline error and keeps the fields; logout then login as another user shows no stale wallet/saved jobs; Saved Jobs with a job an admin closed/removed doesn't crash; Referral → Leaderboard loads.
11. Storage: project-files object URL without a signed token → 400/403.

---

## 5. Decisions needed from you (I did not guess)

1. **Judge secret vs service key.** I gated the judge RPCs with a shared secret so the website never needs a service-role key. Alternative: give the website `SUPABASE_SERVICE_ROLE_KEY` server-side. Current design kept.
2. **Admin service-role key for auth bans** (`SUPABASE_SERVICE_ROLE_KEY` in admin-panel). Without it, blocking is DB-enforced only (sessions stay valid but can't write/spend). Do you want the key in the admin app?
3. **Anonymous compiler/judge users now get 401.** The `/compiler` and `/coding-problems` pages still show their old UI; anonymous visitors will see an error on Run. Want a "Sign in to run code" prompt? (UI not changed.)
4. **`mobile_number` is not pinned** (DB-39 stays open): EditProfile updates it with a plain UPDATE and there's no OTP-verified change path. Needs a small RPC + screen change.
5. **`support` role vs money RPCs.** By your rule money RPCs are super_admin/admin only, so the seeded `support` role gets 42501 on refund/withdrawal/wallet-adjust buttons (UI still shows them). Loosen `require_admin_role` or hide the buttons?
6. **`allowed_mime_types` not set** on avatars/resumes/custom-project-uploads (real uploads may use `application/octet-stream`); avatars have no size cap. Size limits for resumes (10 MB) and custom uploads (15 MB) were applied — mobile enforces 5 MB for resumes.
7. **Premium prep_notes** are now absent from free users' lists (previously visible/locked). **Wishlisted** projects stay visible even if unpublished. **`*_problem_detail` RPCs still return `solution_code`** for unlocked problems (editorial tab) — hide it?
8. **New `dsa_problems` columns** must be re-granted to anon/authenticated (re-run the grant block of 0120) or clients can't read them.
9. **Rate-limit defaults**: 6 judge requests/min (≈72 sandbox runs/min), 30 resume-assist/day, 20 project-understand/day.
10. **MOB-10 (dead Apply form):** I recommend and implemented **removing** the step (it never submitted anything). Alternative = persist to `applications` (new migration + `applyToJob` change + review screen). Say if you want that.
11. **Logout keeps device prefs** (theme, accent, language, reduce-animations); resets notification prefs and the terms-agreed flag. Say if you want a full wipe.
12. **Recovery edge case:** killing the app between OTP verify and setting a new password leaves a session. Full fix = `resetPasswordForEmail` + `PASSWORD_RECOVERY` flow (bigger change).
13. **ADM-04** (wallet-adjust confirm/reason/cap) skipped — money logic. **UX-06** confirms not added (no delete-resume/cancel-request action exists on those screens). **MOB-37** (lazy sample data) skipped as risky.
14. **Known gaps left:** `contact_submissions_update_admin`, `admin_notifications` writes and `admin-media` storage remain blanket `is_admin()` (unmapped modules); no admin UPDATE policy on `purchases` (orders `admin_notes` silently no-ops) — payment area. Deleted-account sign-out happens on next profile fetch, not instantly.
15. **DB-08 payment-dependent rules deferred:** reward-vs-price cap, clawback on refund, min order/payout, pay-after-N-days.
