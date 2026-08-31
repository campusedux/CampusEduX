# Database

Postgres (Supabase). Schema lives in [`supabase/migrations/`](../supabase/migrations)
as numbered, idempotent SQL files applied in order, with demo data in
[`supabase/seed.sql`](../supabase/seed.sql).

```
supabase db push          # apply migrations to the linked project
supabase db reset          # drop, re-run every migration, then run seed.sql (local)
# or: Dashboard → SQL Editor → paste a migration → Run
```

Every service in [`src/services/*.service.ts`](../src/services) tries Supabase
first and falls back to `src/data/sample*.ts` when a table is missing or empty,
so the app works before the schema is applied and switches to live data once it
is.

## Conventions (every table)

- **RLS is enabled.** No table is readable/writable without a matching policy.
- **Catalog tables** (`categories`, `projects`, `companies`, `jobs`, …) — one
  policy: `for select using (true)`. Writes happen through the admin panel /
  `seed.sql` with the service-role key, which bypasses RLS, so there is no
  client write policy.
- **User-owned tables** — `select` / `insert` / `update` / `delete` are each
  scoped to `auth.uid() = user_id` (or, for child tables with no `user_id`,
  `auth.uid()` on the parent row), exactly like `0001_profiles.sql`.
- **`updated_at`** is maintained by the shared `public.set_updated_at()` trigger
  (defined in `0001`) wherever the column exists.
- Primary keys are `text` slugs for catalog rows (so `seed.sql` can reuse the
  ids from `src/data/sample*.ts` and cross-references stay stable) and
  `uuid default gen_random_uuid()` for user-generated rows.
- Every migration ends with `notify pgrst, 'reload schema';`.

## Migrations

| File | Tables | Notes |
|------|--------|-------|
| `0001_profiles.sql` | `profiles` | pre-existing. `email_for_mobile()` SECURITY DEFINER RPC for pre-auth mobile→email lookup; `handle_new_user()` auto-creates a profile on signup; `set_updated_at()`. |
| `0002_categories.sql` | `categories` | `project_count` kept live by a trigger on `projects`. |
| `0003_projects.sql` | `projects`, `project_images` | `tech_stack text[]` (+GIN) for `.overlaps()`; `images text[]` read inline by the client; trigger syncs `categories.project_count`. |
| `0004_reviews.sql` | `reviews` | `select` is public; writes scoped to owner. Trigger recomputes `projects.rating` / `projects.review_count`. One review per (project, user). |
| `0005_wishlists.sql` | `wishlists` | composite PK `(user_id, project_id)`. |
| `0006_purchases.sql` | `purchases` | status `pending`→`success`/`failed`. Rows created & marked `success` only by Edge Functions; the client may only move a row to `failed`. Unique successful purchase per (user, project). |
| `0007_downloads.sql` | `downloads` | download history; read + insert own. |
| `0008_project_deliverables.sql` | `project_files`, `project_versions` | catalog; `project_files.storage_path` resolves against the `project-files` Storage bucket. At most one `is_latest` version per project. |
| `0009_companies.sql` | `companies`, `recruiters` | catalog. `companies.open_jobs_count` kept live by a trigger on `jobs`. |
| `0010_jobs.sql` | `jobs` | `skills text[]` (+GIN) for `.cs`/`.overlaps`; `salary_min_lpa`/`salary_max_lpa` for range filters; trigger syncs `companies.open_jobs_count`. |
| `0011_resumes.sql` | `resumes` | uploaded PDF résumés for job applications (Storage bucket `resumes`). |
| `0012_job_applications.sql` | `applications`, `application_stages` | one application per (user, job). `application_stages` ownership derived from the parent application. |
| `0013_job_personalization.sql` | `saved_jobs`, `job_alerts` | `job_alerts` PK is `user_id` so `.upsert()` (PK conflict target) works. |
| `0014_resume_builder.sql` | `resume_templates`, `resumes_builder`, `resume_downloads` | résumé-builder documents (`personal_details`/`education`/`skills`/`sections` are `jsonb`). `template` is a CHECK, not an FK, so `createResume()` works before `resume_templates` is seeded. |
| `0015_aptitude.sql` | `aptitude_topics` | catalog; `category in (quantitative, logical, verbal)`. |
| `0016_practice_tests.sql` | `practice_tests`, `test_questions` | the "mock tests" catalog + their MCQs. `practice_tests.company_id` powers `companies … practice_tests(count)`. |
| `0017_test_attempts.sql` | `test_attempts`, `test_attempt_answers` | read + insert own; answers scoped via the parent attempt. |
| `0018_dsa.sql` | `dsa_topics`, `dsa_problems`, `user_dsa_progress` | `user_dsa_progress` PK `(user_id, problem_id)` for `.upsert()`. |
| `0019_hr_questions.sql` | `hr_questions`, `user_favorite_questions` | `hr_questions.company_id = NULL` → generic bank; set → company bank. |
| `0020_wallet.sql` | `wallet_transactions`, `wallet_topup_orders` | the client sums **every** `wallet_transactions` row, so pending top-ups live in `wallet_topup_orders` until verified. Client may only insert a `withdrawal` debit. |
| `0021_referrals.sql` | `referral_codes`, `referrals`, `referral_earnings` | `ensure_referral_code()` gives every profile a code; `sync_referral_totals()` fills `referral_earnings` and the `referral_codes` rollups. FK names are the Postgres defaults the client passes to PostgREST. |
| `0022_premium.sql` | `premium_plans`, `premium_features`, `premium_subscriptions` | activation is service-role only; client may only toggle `auto_renew`. Trigger mirrors an active subscription onto `profiles.is_premium`. |
| `0023_notifications.sql` | `notifications`, `offer_banners` | `notifications` has no client-side `user_id` filter — RLS does the scoping. |
| `0024_settings.sql` | `user_preferences`, `notification_preferences`, `blocked_users` | first two have PK `user_id` for `.upsert()`. |
| `0025_rpc_helpers.sql` | — | `increment_project_sales_count(text)` — atomic bump used by `verify-razorpay-payment`; `execute` granted to `service_role` only. |

## Storage buckets

| Bucket | Written by | Read as |
|--------|-----------|---------|
| `avatars` | `profile.service.uploadAvatar()` | public URL |
| `resumes` | `job.service.uploadResume()` | public URL |
| `project-files` | admin panel | public URL built from `project_files.storage_path` |

Create these in the Dashboard (Storage → New bucket, "Public"). They are not
created by migrations.

## Known RLS trade-offs

Both follow directly from `0001`'s decision to keep `profiles` rows private
(`select using (auth.uid() = id)`):

- **Reviewer names** — `reviews` embeds `profiles(full_name, avatar_url)`. For a
  reviewer other than the current user the embed is `null` and the client shows
  "CampusEduX User".
- **Leaderboard names** — `referrals` embeds the referrer's profile; other
  users resolve to "CampusEduX Member" (ranking, counts and the "you" highlight
  still work — the leaderboard reads converted referrals via the
  `referrals_select_successful` policy).

To show real names, add a `public.profiles_public` view exposing only
`id, full_name, avatar_url` with its own permissive policy, or relax the
`profiles` select policy — deliberately not done here.
