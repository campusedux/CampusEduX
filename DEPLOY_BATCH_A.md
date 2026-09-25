# Batch A — non-payment security + crash fixes — deploy guide

Branch: `fix/batch-a` (based on `wip/pre-batch-a`, which holds the previously uncommitted WIP). Nothing here has been applied to any live database, deployed, or merged. **All payment items are deliberately untouched** (PAY-\*, DB-01/02/06/29, MOB-01..04/19/22) — see "Deferred" at the end.

> **`mobile-app/supabase/functions/razorpay-webhook/index.ts` is in this tree but is deliberately dormant.** It only takes effect if someone runs `supabase functions deploy razorpay-webhook`, which is not a step in this guide — do not run it as part of Batch A.

Verified locally: PG17 harness (`mobile-app/supabase/tests/harness/`, 216-migration chain + website tree, **14 SQL test files all PASS**, plus `123_submit_requires_visible_test.sql` for the 0123 follow-up (PASS via `run_dba.sh`), all Batch A migration files re-apply **twice** with no error, every mobile/admin twin byte-identical); Deno tests for the new edge function actually executed (9 pass) plus a jest twin; `tsc`, lint, tests, `next build`, `expo export` web green for all three apps (counts at the bottom). **Not done here:** device/browser runs, real Storage upload/mime enforcement, anything against live Supabase.

---

## 0. Pre-flight (read-only, on LIVE)

1. Back up: Supabase dashboard → Database → Backups. Note the time for rollback.
2. Run `mobile-app/supabase/checks/batch_a_db1_checks.sql` and `batch_a_db2_checks.sql` now — expect FAIL rows (the "before" picture). Save the output.
3. Confirm the earlier WIP migrations are applied or apply them first, in order: mobile `0113–0116` (admin `085–088` twins). Batch A assumes the chain up to 0116.
4. **Lock-out guards** (0118/0119 change who can write):
   ```sql
   select count(*) as users_without_profile from auth.users u left join public.profiles p on p.id=u.id where p.id is null;   -- expect 0 (is_active_user() needs a profile row)
   select id,email,role,status from public.admin_users;                                  -- at least one active super_admin
   select role, count(*) from public.role_permissions group by 1;                        -- matrix seeded
   ```
5. Generate the judge secret (`openssl rand -hex 32`). It goes in two places: SQL (step 1) and the website env (step 2).
6. **Existing uploads vs new bucket limits:** the new limits apply to *new* uploads only, but check none of your current objects is unusually large/typed if you rely on re-uploads: `select bucket_id, count(*), max((metadata->>'size')::bigint) from storage.objects where bucket_id in ('avatars','resumes','custom-project-uploads') group by 1;`

---

## 1. Deploy order

Twin migration files (mobile `01xx` ↔ admin `0xx`) are **byte-identical** and idempotent; live is one database, so applying either copy is enough (both is a harmless no-op).

### Step 1 — Migrations (SQL editor or `supabase db push`), in this order
| # | File (mobile / admin twin) | Audit ids | Effect |
|---|---|---|---|
| 1 | `0117_project_files_private_check` / `089` | DB-22 + storage limits | forces `project-files` private + purchaser-only read; **avatars 2 MB, image/jpeg·png·webp**; **resumes 5 MB, pdf·doc·docx**; **custom-project-uploads 15 MB** (png/jpeg/webp/pdf/doc/docx/zip); owner-only avatar select policy. `application/octet-stream` is *not* allowed anywhere |
| 2 | `0118_profiles_guard_and_blocked_enforcement` / `090` | DB-03, 04, 32 | profile column guard; `is_active_user()`; blocked users can't write (45 own-row policies + 7 storage policies); guard in 3 RPCs |
| 3 | `0123_submit_attempt_requires_visible_test` / `095` | follow-up (hidden tests) | `submit_test_attempt` / `submit_randomized_test_attempt` refuse a test students can't see (unpublished/archived, off on both website and mobile, or targeted elsewhere) with the usual "Test … not found" error; existing attempts untouched. **Needs 0118 first:** it keeps 0118's blocked-user guard, which calls `is_active_user()` (created by 0118); PL/pgSQL only resolves that at call time, so applied without 0118 the migration succeeds but every test submission then fails. (Its file number is later than 0122, but it depends only on 0118; `db push`'s numeric order is fine too.) |
| 4 | `0119_admin_permission_enforcement` / `091` | DB-07, 26, 27, 28 | admin **write** policies (60 tables + 7 storage) need `has_permission(module, action)`; money/destructive admin RPCs need super_admin/admin |
| 5 | `0120_hide_secrets_and_premium_content` / `092` | DB-05, 10, 11, 13 | column-revokes `test_cases`/`solution_code`; secret-gated `*_run_cases`; **solution code only after ≥1 submission (or admin)**; new `record_coding_submission` RPC (direct submission insert removed); premium question bank + **premium prep_notes shown locked** via `prep_notes_public_list` / `prep_note_get`; draft jobs/projects hidden; **`my_wishlist()`** RPC (tombstones, no draft leak); `regrant_dsa_problems_client_columns()` helper |
| 6 | `0121_resume_shares_and_referral_rules` / `093` | DB-17, 08 (non-payment), 15, 38 | share ownership + pinned token; signup reward disabled; daily referral cap; self-referral normalisation; random codes; `referral_leaderboard()` |
| 7 | `0122_rate_limit_and_ai_budget` / `094` | (WEB-01/08 backend) | `rl_hit()`, `ai_budget_take()` + tables |
| 8 | `website/supabase/migrations/0002_contact_limiter_hardening.sql` | DB-20, DB-07 | contact limiter hardening; contact status updates need `cms:edit` (needs website `0001` and, for the permission part, mobile 0119 already applied) |

Immediately after step 7 (`0122`):
```sql
insert into public.app_secrets(name, secret_hash)
values ('judge_rpc', encode(extensions.digest('<THE SECRET>','sha256'),'hex'))
on conflict (name) do update set secret_hash = excluded.secret_hash;
```
Then run both `checks/batch_a_db1_checks.sql` and `batch_a_db2_checks.sql`: every row PASS (INFO rows informational).

> **Do steps 1 and 2 close together (minutes).** Between migration 0120 and the new website/admin going live: the old website's judge/submit routes fail (no secret, and submissions now go through `record_coding_submission`), and the old admin panel can't open coding-problem forms (it selects the revoked columns). Old mobile builds keep working except: referral leaderboard shows only your own row, coding-problem solution tab is empty until a submission, wishlist rows for unpublished projects vanish. **Never run the old website against the new DB** (`saved` would come back false).

### Step 2 — Website + admin (Vercel)
- **website** env (server-only): `JUDGE_RPC_SECRET` = the step-0.5 secret (**required**, else judge/submit → 503, fail closed); `COMPILER_REQUIRE_AUTH` now defaults **true** — remove any `false` override (read at build time for the /compiler page: rebuild after changing). Optional: `JUDGE_RATE_LIMIT_MAX` (6) / `JUDGE_RATE_LIMIT_WINDOW_SECONDS` (60), `COMPILER_RATE_LIMIT_MAX` (20) / `COMPILER_RATE_LIMIT_WINDOW_MS`, `AI_DAILY_LIMIT_RESUME_ASSIST` (30), `AI_DAILY_LIMIT_PROJECT_UNDERSTAND` (20).
- **admin-panel**: **no new env vars.** (`SUPABASE_SERVICE_ROLE_KEY` is deliberately *not* used in the admin app — banning goes through the edge function below.)

### Step 3 — Edge function `admin-ban-user` (new; needed for "Block student" to also ban the auth user)
From `mobile-app/`: `supabase functions deploy admin-ban-user` (`verify_jwt = true` is set in `config.toml`; `SUPABASE_URL`/`ANON_KEY`/`SERVICE_ROLE_KEY` are injected by the platform — no secrets to set). It requires migration 0119 already applied (it calls `is_admin(uid)`/`has_permission(uid,…)` as the caller). Until it is deployed, blocking still works at the DB level (0118) and the admin action reports "DB-level block applied, auth ban failed".
The other edge functions do **not** need redeploying in Batch A (the `_shared/client.ts` blocked-user check only matters for payment functions; deploy them with the payment batch — note that the committed WIP `create-custom-project-order` would go out with them).

### Step 4 — Mobile app build
Do the EAS steps (section 3) first, then `eas build`. Ship after Steps 1–2 are live (the app calls `referral_leaderboard`, `my_wishlist`, and reads `solution_locked`).

---

## 2. Rollback

| Layer | How |
|---|---|
| Migrations | Each of 0117–0123 and website 0002 ends with a commented **ROLLBACK** block — run them in reverse of the step 1 order (website 0002 → 0122 → … → 0119 → 0123 → 0118 → 0117); 0123 must be undone before 0118, since 0118's rollback drops `is_active_user()`. Rolling back 0120 re-exposes test cases/solutions/drafts; 0118 removes blocked-user enforcement. Hard failure → restore the pre-flight backup. |
| Admin lock-out (0119) | A super_admin cannot be locked out (bypass tested). If a role loses access wrongly, fix `role_permissions` rows (no migration) or run the 0119 rollback block. |
| Website / admin | Vercel → promote the previous deployment. (Old website + new DB is broken for judge/submit — roll the DB back too, or keep the new site.) |
| Edge function | `supabase functions delete admin-ban-user` (admin action then reports the ban step failed; DB block remains). |
| Mobile | Old builds stay installable and mostly work (see the warning in step 1). |
| `app_secrets` | `delete from public.app_secrets where name='judge_rpc';` (judge fails closed). |

---

## 3. Owner actions (cannot be done from the repo)

**EAS (MOB-30/31)** — from `mobile-app/`:
1. `eas login && eas init` → writes `extra.eas.projectId` into `app.json` (commit it).
2. For each environment `development`, `preview`, `production`: `eas env:create --environment <env> --name EXPO_PUBLIC_SUPABASE_URL --value https://<ref>.supabase.co --visibility plaintext` and the same for `EXPO_PUBLIC_SUPABASE_ANON_KEY` (publishable/anon key only). Without these a store build crashes at start.
3. `eas build:version:set` once (version source is `remote`).
4. Needs network: `npx expo install expo@~55.0.31`, commit the lockfile (only remaining `expo-doctor` warning).
5. Later: set `STORE_URL` in `src/constants/contact.ts` after publishing (Rate-us row hidden until then).

**Supabase Auth dashboard:** password minimum length, "Confirm email" on, CAPTCHA, rate limits.

---

## 4. Post-deploy checks

1. `checks/batch_a_db1_checks.sql` + `checks/batch_a_db2_checks.sql` → all PASS.
2. Anon key: `GET /rest/v1/dsa_problems?select=test_cases` → permission error; `select=id,title` works. After adding any future `dsa_problems` column run `select public.regrant_dsa_problems_client_columns();`.
3. `curl -X POST https://<site>/api/practice/judge …` with no cookies → **401**; signed in → works; unset `JUDGE_RPC_SECRET` on a preview → **503**; 7 judge calls in a minute → 7th is 429.
4. Website `/compiler` and `/coding-problems/<slug>` signed out: editor works, Run/Run Tests/Submit disabled with "Sign in to run code" banner; sign in → returns to the page.
5. Block test (staging user): admin blocks → user's `PATCH /profiles` `{"status":"active"}` has no effect, inserts fail; with `admin-ban-user` deployed, login is refused; unblock restores both.
6. `viewer` admin: `PATCH /rest/v1/jobs` → no rows; `rpc/admin_adjust_wallet` → 42501; in the panel, money buttons show disabled with a "needs super_admin/admin" tooltip and no "Add" tiles for modules they can't add to. Super admin can still edit every module.
7. Drafts invisible to normal users (jobs/projects), visible in admin; a wishlisted-then-unpublished project shows "No longer available" (no title) and can be removed.
8. Solution tab: locked note before any submission; after one submit (any verdict) the solution appears; a direct `insert into coding_submissions` from a user JWT is refused.
9. Storage: avatar >2 MB or GIF/HEIC rejected; résumé >5 MB or .txt rejected (website + mobile show the message before uploading); a real Android + iPhone avatar and PDF/DOCX résumé upload succeeds (**verify mime enforcement on a device — not testable here**); project-files URL without a signed token → 400/403.
10. Resume share for another user's `resume_id` → RLS error. Admin panel → Learning → coding problem loads test cases/solution (via `admin_dsa_problem_secrets`).
11. Mobile: wrong password → inline error, fields kept; logout/login as another user shows no stale data; Saved Jobs survives a removed job; Referral → Leaderboard loads.

---

## 5. What changed since the first Batch A hand-off (your decisions)

| # | Decision | Result |
|---|---|---|
| 1 | Keep judge secret | unchanged; no service-role key on website |
| 2 | Ban via edge function | new `admin-ban-user` function (+ handler split for tests: 9 Deno tests executed, 10 jest tests); admin block/unblock call it with the admin's session; `SUPABASE_SERVICE_ROLE_KEY` removed from admin app/docs/tests |
| 3 | "Sign in to run code" | website `/compiler`, `/coding-problems`, `/practice/problems`; shared `describeRunFailure` (401/429/503 wording); `/register` now honours `?next=`. Mobile already handled 401; wording aligned |
| 4 | mobile_number pinning | deferred, noted in `AUDIT_REPORT.md` |
| 5 | Money RPCs super_admin/admin; UI reflects it | `PermissionGate`/`useCan` fed by the same `role_permissions` data + `MONEY_RPC_ROLES` constant with a test that fails if it drifts from migration 0119. Applied to wallet adjust, refunds, withdrawals, push composer, custom-project status, quick actions. Other modules already hid buttons via the same DB-loaded matrix (left as-is; say if you want disabled+tooltip there too) |
| 6 | Storage limits/mime | see step 1 row 1. **Résumé limit is 5 MB everywhere** (bucket, mobile, website upload, parse route, import wizard) — 5 MB is enough for the parse flow (text extraction of PDF/DOCX; the old 8 MB only admitted scanned images that fail anyway). Finding: supabase-js ignores `contentType` for Blob uploads, so mobile now uploads ArrayBuffers and the website re-types the Blob; pickers with no mime fall back to the extension; unknown types are rejected client-side; octet-stream not allowed |
| 7 | Prep notes locked; solution after submit; wishlist tombstones | RPCs + SQL tests done. **No app reads `prep_notes` any more** (merged into Learning by 0043; only admin reads it), so there was no locked-note UI to build. Solutions: only `solution_code` gated (editorial/hints unchanged); submissions via `record_coding_submission`. Wishlist tombstones return **no title** (else drafts leak via wishlisting) → shows "No longer available" |
| 8 | Grant-coverage harness test | `208_dsa_problems_grant_coverage.sql` (proves it can fail) + live check row + `regrant_dsa_problems_client_columns()` |
| 9–11 | rate-limit defaults; Apply step removed; logout behaviour | as before |

Other fixes made while integrating: jest now ignores `supabase/functions/**` (Deno tests); website `0002` also puts contact status updates behind `cms:edit`; a cross-migration regression test (`299`) guards that 0120 can't re-create blanket admin policies.

---

## 6. Deferred (not in Batch A)

- **Next batch:** `mobile_number` pinning (needs an OTP-verified change path — DB-39); full password-recovery fix (`resetPasswordForEmail` + `PASSWORD_RECOVERY`, MOB-15 remainder).
- **Payment batch:** all PAY-\*; DB-01/02/06/29/30; MOB-01..04/19/22; payment-dependent DB-08 rules (reward-vs-price cap, clawback, min order/payout, pay-after-N-days); **missing admin UPDATE policy on `purchases`** (orders `admin_notes` silently no-ops); ADM-04 (wallet-adjust confirm/reason/cap); refund/withdrawal/wallet RPC `is_active_user` guards; `create/verify-*` edge hardening; deploying edge functions that bundle `_shared/client.ts`.
- **Known, low priority:** `admin_notifications` writes and `admin-media` storage remain blanket `is_admin()` (unmapped modules); deleted-account sign-out on next profile fetch; MOB-37; no automated test for the locked-solution note on mobile (covered by SQL test 209 + website tests); admin-ban-user does not apply the blocked-profile check to the *caller* (still gated by `is_admin` + `has_permission`); `avatars` public-URL behaviour after removing the listing policy should be smoke-tested on a device.
