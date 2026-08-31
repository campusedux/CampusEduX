# Admin panel — database setup

The admin panel talks to the **same Supabase project as the mobile app**
(`mobile-app/.env`). It adds its own schema on top; nothing here changes what
the mobile app reads.

Migrations live in [`migrations/`](./migrations) and are plain SQL — apply them
in **Dashboard → SQL Editor → paste → Run** (the CLI works too if the project
is linked).

## Order of operations

1. **Mobile app schema first.** Apply
   `../../mobile-app/supabase/migrations/0002_*.sql … 0025_*.sql` in order if you
   haven't already. (Right now only `0001_profiles.sql` is live on the project —
   everything else 404s, so the mobile app is running on its sample data.)
   Optionally run `../../mobile-app/supabase/seed.sql` for demo rows.

2. **`migrations/001_admin_core.sql`** — `admin_users`, `role_permissions`
   (+ seeded default matrix), `admin_activity_logs`, `admin_notifications`, and
   the `is_admin()` / `has_permission()` / `log_admin_activity()` functions.

3. **`migrations/002_admin_rls_policies.sql`** — adds an **admin policy to
   every shared table** (project rule), alongside — never replacing — the
   mobile app's `auth.uid() = user_id` student policies:
   - `admin_rw` (full CRUD): all catalog tables + the user-owned tables the
     panel legitimately mutates (`reviews`, `applications`,
     `application_stages`, `referrals`, `premium_subscriptions`,
     `notifications`).
   - `admin_ro` (SELECT only): user-owned data the panel only reports on.
   - `admin_ro_locked` (SELECT only, on purpose): `purchases` and
     `wallet_transactions` — every write there goes through a transactional
     `SECURITY DEFINER` function so the ledger can't drift.
   Also adds `profiles.status` / block fields + `profiles` admin policies,
   `purchases` gets a `'refunded'` status, and `admin_adjust_wallet()`.
   Every statement is `to_regclass`-guarded — safe before/after step 1, safe to
   re-run after applying more mobile migrations.

4. **`migrations/003`–`009`** — one per module group, all additive +
   `to_regclass`-guarded + re-runnable:
   - `003_project_admin.sql` — `technologies` (+seed), `projects` admin cols
     (featured/best-seller priority, view_count, status), storage buckets
     `project-media` + `project-files` (+ `is_admin` write policies).
   - `004_jobs_admin.sql` — `jobs.is_featured`/`featured_priority`/`status`,
     `applications` decision fields (`rejection_reason`, `decided_by`…).
   - `005_placement_admin.sql` — `live_tests`, `test_questions.difficulty`,
     `practice_tests` (total/pass marks, is_published, difficulty),
     `hr_questions.difficulty`, `generated_reports` registry.
   - `006_resume_admin.sql` — relax `resume_templates`/`resumes_builder`
     CHECKs, template CRUD cols, `resume_template_categories`, `ats_rules`
     (+seed), `resume-templates` bucket.
   - `007_commerce_admin.sql` — `coupons`, `offers`, `refund_requests`,
     `withdrawal_requests`, `reward_settings`, `purchases.admin_notes`/
     `payment_method`, `referrals.source`, `bump_coupon_usage` trigger, and the
     transactional `admin_process_refund` / `admin_process_withdrawal` fns.
   - `008_cms_reviews_admin.sql` — `banners`, `announcements`, `faqs`,
     `cms_pages` (+seed), `testimonials`, `push_notifications`,
     `reviews.status`/`entity_type`, `review_reports`, `banners` bucket,
     `send_bulk_notification` fan-out fn.
   - `009_settings_admin.sql` — `site_settings` (single row), `courses`,
     `branches`, `academic_years` (+seed), `backups`, `site` bucket.

5. **`seed_admin.sql`** — edit the email, run it once to make yourself a
   `super_admin`. (The first row has to come from the SQL Editor because the
   RLS policy on `admin_users` only lets an existing super_admin add more.)

6. **Storage buckets** — migrations 003/006/008/009 create `project-media`,
   `project-files`, `resume-templates`, `banners`, `site` as **public** buckets
   with `is_admin()` write policies. The mobile app also expects `avatars` and
   `resumes` — create those in the Dashboard (Storage → New bucket → Public) if
   they don't exist yet.

## Running the app

```bash
cd admin-panel
cp .env.example .env.local   # already filled in for local dev
npm install
npm run dev                  # http://localhost:3000
```

Until step 4 is done, every panel route bounces to `/login?error=not_admin` —
that's expected (fail-closed). The Dashboard shows zeros until steps 1–3 are
applied and there's data.

## Design notes

- **No service-role key anywhere in this panel** (project rule). Every request
  runs as the signed-in admin's session on the anon key + RLS. Writes are gated
  by `is_admin()` RLS; the money-move actions (`admin_adjust_wallet`, and the
  refund/withdrawal approvals in later phases) are `SECURITY DEFINER` functions
  that re-check `is_admin()`. If a future need genuinely requires the service
  key (real `auth.users` creation, hard account deletion, pg backups), it must
  live only in a server-side route/Edge Function — never shipped to the
  browser.
- **`role_permissions`** is the source of truth for the sidebar + button
  gating. `src/lib/permissions.ts` mirrors the seeded defaults for instant
  client-side checks; the DB function is authoritative for enforcement.
