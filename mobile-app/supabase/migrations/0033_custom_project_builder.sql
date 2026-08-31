-- ============================================================================
-- 0033_custom_project_builder.sql — Custom Project Builder v3
-- ============================================================================
-- A student configures a custom software project through an 8-step wizard,
-- pays a PROJECT-TYPE token (Academic 1500 / Personal 3000 / Business 6000)
-- via the existing Razorpay Edge Functions, and — only after server-side
-- payment verification — a request row is created and picked up by the admin
-- panel (Custom Projects). No quotation / approval / discount system.
--
-- Written / read by:
--   supabase/functions/create-custom-project-order   -> inserts a request +
--       feature/file snapshot rows + a 'created' payment row, recomputing every
--       amount from the tables below (never trusting the client)
--   supabase/functions/verify-custom-project-payment  -> flips token_payment_status
--       to 'paid', writes history + notifications + an admin-inbox row
--   src/services/customProjects.service.ts  (catalog reads, drafts, my requests)
--
-- The admin write policies + status RPC + role_permissions seed live in
-- admin-panel/supabase/migrations/013_custom_projects_admin.sql (needs
-- is_admin() from the admin migrations). This file is self-sufficient for a
-- mobile-only database; whichever runs first wins, the other is a no-op.
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)
-- Idempotent + re-runnable.
-- ----------------------------------------------------------------------------

create extension if not exists pgcrypto;

-- Shared updated_at helper (exists once mobile 0001 / admin 001 is applied;
-- defined here too so this file stands alone on a fresh project).
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ===========================================================================
-- 1. PRICING CATALOG  (world-readable; edited in the admin panel)
-- ===========================================================================

-- Base price + token per (type, level). The token is PER TYPE — both levels of
-- a type carry the same token amount, and switching Standard <-> Advanced must
-- never change it. The Edge Function still recomputes the token from a server
-- constant and only uses this as a cross-check.
create table if not exists public.custom_project_pricing (
  project_type    text        not null check (project_type in ('academic', 'personal', 'business')),
  project_level   text        not null check (project_level in ('standard', 'advanced')),
  base_price      numeric(10,2) not null default 0,
  token_amount    numeric(10,2) not null default 0,
  pricing_version integer     not null default 1,
  is_active       boolean     not null default true,
  updated_at      timestamptz not null default now(),
  primary key (project_type, project_level)
);

insert into public.custom_project_pricing
  (project_type, project_level, base_price, token_amount, pricing_version) values
  ('academic', 'standard',  7999,  1500, 1),
  ('academic', 'advanced',  9999,  1500, 1),
  ('personal', 'standard', 15999,  3000, 1),
  ('personal', 'advanced', 19999,  3000, 1),
  ('business', 'standard', 29999,  6000, 1),
  ('business', 'advanced', 39999,  6000, 1)
on conflict (project_type, project_level) do nothing;

drop trigger if exists custom_project_pricing_set_updated_at on public.custom_project_pricing;
create trigger custom_project_pricing_set_updated_at
  before update on public.custom_project_pricing
  for each row execute function public.set_updated_at();

-- Platform charge added on top of base + features. Centrally configurable (§24).
create table if not exists public.custom_project_platform_pricing (
  platform   text        primary key
               check (platform in ('web', 'android', 'ios', 'web_android', 'web_android_ios')),
  label      text        not null default '',
  charge     numeric(10,2) not null default 0,
  sort_order integer     not null default 0,
  is_active  boolean     not null default true,
  updated_at timestamptz not null default now()
);

insert into public.custom_project_platform_pricing (platform, label, charge, sort_order) values
  ('web',             'Web',                     0, 1),
  ('android',         'Android',              1500, 2),
  ('ios',             'iOS',                  2500, 3),
  ('web_android',     'Web + Android',        3000, 4),
  ('web_android_ios', 'Web + Android + iOS',  5000, 5)
on conflict (platform) do nothing;

drop trigger if exists custom_project_platform_pricing_set_updated_at on public.custom_project_platform_pricing;
create trigger custom_project_platform_pricing_set_updated_at
  before update on public.custom_project_platform_pricing
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- 2. FEATURE CATALOG  (§7 — centralised, DB-driven, never hardcoded in the UI)
-- ===========================================================================
create table if not exists public.custom_project_features (
  id             text        primary key,
  name           text        not null,
  description    text        not null default '',
  category       text        not null default 'General',
  -- which project types this feature is offered for
  project_types  text[]      not null default '{academic,personal,business}',
  -- which levels (standard / advanced) it is offered for
  project_levels text[]      not null default '{standard,advanced}',
  price          numeric(10,2) not null default 0,
  is_active      boolean     not null default true,
  sort_order     integer     not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists custom_project_features_category_idx
  on public.custom_project_features (category, sort_order);
create index if not exists custom_project_features_active_idx
  on public.custom_project_features (is_active);

drop trigger if exists custom_project_features_set_updated_at on public.custom_project_features;
create trigger custom_project_features_set_updated_at
  before update on public.custom_project_features
  for each row execute function public.set_updated_at();

-- Seed ~80 features. Availability widens Academic -> Personal -> Business (§9).
-- `A` = all types, `PB` = personal+business, `B` = business only,
-- `AC` = academic only.  Levels default to both unless noted.
insert into public.custom_project_features
  (id, name, description, category, project_types, project_levels, price, sort_order) values
  -- Authentication -------------------------------------------------------
  ('auth-email-password', 'Email & password login', 'Standard sign-up and sign-in.', 'Authentication', '{academic,personal,business}', '{standard,advanced}', 0, 10),
  ('auth-google', 'Google login', 'One-tap Google OAuth sign-in.', 'Authentication', '{academic,personal,business}', '{standard,advanced}', 800, 20),
  ('auth-otp', 'OTP / phone verification', 'SMS or email one-time-password verification.', 'Authentication', '{academic,personal,business}', '{standard,advanced}', 1200, 30),
  ('auth-role-based', 'Role-based authentication', 'Users grouped into roles with different access.', 'Authentication', '{personal,business}', '{standard,advanced}', 1800, 40),
  ('auth-multi-role', 'Multi-role authentication', 'A user can hold several roles at once.', 'Authentication', '{business}', '{standard,advanced}', 2500, 50),
  ('auth-advanced', 'Advanced authentication', '2FA, device sessions, password policies.', 'Authentication', '{personal,business}', '{standard,advanced}', 2200, 60),
  -- User Management ----------------------------------------------------
  ('user-profile', 'User profile', 'Editable profile with avatar.', 'User Management', '{academic,personal,business}', '{standard,advanced}', 0, 110),
  ('user-management', 'User management', 'List, search, edit and disable users.', 'User Management', '{personal,business}', '{standard,advanced}', 1500, 120),
  ('user-verification', 'User verification', 'Document / identity verification flow.', 'User Management', '{personal,business}', '{standard,advanced}', 1800, 130),
  ('user-multiple-roles', 'Multiple user roles', 'Assign several roles per user.', 'User Management', '{business}', '{standard,advanced}', 2000, 140),
  ('user-permissions', 'Permission management', 'Fine-grained per-feature permissions.', 'User Management', '{business}', '{standard,advanced}', 2500, 150),
  ('user-activity-tracking', 'Activity tracking', 'Per-user activity history.', 'User Management', '{personal,business}', '{standard,advanced}', 1600, 160),
  -- Admin -----------------------------------------------------------
  ('admin-dashboard-basic', 'Basic admin dashboard', 'Key metrics and record management.', 'Admin', '{academic,personal,business}', '{advanced}', 1500, 210),
  ('admin-dashboard-advanced', 'Advanced admin dashboard', 'Charts, drilldowns, saved views.', 'Admin', '{personal,business}', '{standard,advanced}', 3000, 220),
  ('admin-cms', 'Content management (CMS)', 'Manage pages, banners and copy.', 'Admin', '{personal,business}', '{standard,advanced}', 2500, 230),
  ('admin-user-management', 'Admin user management', 'Create staff accounts with roles.', 'Admin', '{personal,business}', '{standard,advanced}', 1800, 240),
  ('admin-reports', 'Admin reports', 'Exportable operational reports.', 'Admin', '{personal,business}', '{standard,advanced}', 2000, 250),
  ('admin-analytics', 'Admin analytics', 'Usage and revenue analytics.', 'Admin', '{personal,business}', '{standard,advanced}', 2500, 260),
  -- Payments ------------------------------------------------------
  ('pay-razorpay', 'Razorpay integration', 'Accept payments via Razorpay.', 'Payments', '{academic,personal,business}', '{advanced}', 2000, 310),
  ('pay-stripe', 'Stripe integration', 'Accept international payments via Stripe.', 'Payments', '{personal,business}', '{standard,advanced}', 2200, 320),
  ('pay-history', 'Payment history', 'Per-user transaction list and receipts.', 'Payments', '{academic,personal,business}', '{standard,advanced}', 800, 330),
  ('pay-subscription', 'Subscription billing', 'Recurring plans with renewals.', 'Payments', '{personal,business}', '{standard,advanced}', 3000, 340),
  ('pay-wallet', 'Wallet system', 'In-app balance, top-ups and spend.', 'Payments', '{personal,business}', '{standard,advanced}', 2800, 350),
  ('pay-refund', 'Refund management', 'Request, approve and process refunds.', 'Payments', '{business}', '{standard,advanced}', 2500, 360),
  -- Notifications ------------------------------------------------
  ('notif-inapp', 'In-app notifications', 'A notification centre inside the app.', 'Notifications', '{academic,personal,business}', '{standard,advanced}', 800, 410),
  ('notif-push', 'Push notifications', 'Device push via FCM / Expo.', 'Notifications', '{academic,personal,business}', '{advanced}', 1500, 420),
  ('notif-email', 'Email notifications', 'Transactional email delivery.', 'Notifications', '{academic,personal,business}', '{standard,advanced}', 1000, 430),
  ('notif-sms', 'SMS / OTP notifications', 'Transactional SMS delivery.', 'Notifications', '{personal,business}', '{standard,advanced}', 1500, 440),
  ('notif-advanced', 'Advanced notification center', 'Preferences, categories, digests.', 'Notifications', '{personal,business}', '{standard,advanced}', 2200, 450),
  -- Files & Media -----------------------------------------------
  ('media-image-upload', 'Image upload', 'Single image upload with preview.', 'Files & Media', '{academic,personal,business}', '{standard,advanced}', 0, 510),
  ('media-multi-image', 'Multiple image upload', 'Batch image upload and gallery.', 'Files & Media', '{academic,personal,business}', '{standard,advanced}', 800, 520),
  ('media-pdf-upload', 'PDF upload', 'Upload and preview PDF documents.', 'Files & Media', '{academic,personal,business}', '{standard,advanced}', 600, 530),
  ('media-video-upload', 'Video upload', 'Upload and stream video.', 'Files & Media', '{personal,business}', '{standard,advanced}', 1800, 540),
  ('media-cloud-storage', 'Cloud storage', 'S3 / Supabase Storage backed files.', 'Files & Media', '{personal,business}', '{standard,advanced}', 2000, 550),
  ('media-file-management', 'File management system', 'Folders, sharing and permissions.', 'Files & Media', '{personal,business}', '{standard,advanced}', 2200, 560),
  ('media-advanced-management', 'Advanced media management', 'Transcoding, CDN, versioning.', 'Files & Media', '{business}', '{standard,advanced}', 3000, 570),
  -- Search --------------------------------------------------
  ('search-basic', 'Basic search', 'Keyword search across records.', 'Search', '{academic,personal,business}', '{standard,advanced}', 0, 610),
  ('search-advanced', 'Advanced search', 'Full-text search with ranking.', 'Search', '{academic,personal,business}', '{advanced}', 1800, 620),
  ('search-filters', 'Filters', 'Filter results by common fields.', 'Search', '{academic,personal,business}', '{standard,advanced}', 800, 630),
  ('search-advanced-filters', 'Advanced filters', 'Faceted, multi-value filtering.', 'Search', '{personal,business}', '{standard,advanced}', 1600, 640),
  -- Real-Time ---------------------------------------------
  ('rt-data', 'Real-time data sync', 'Live updates via websockets.', 'Real-Time', '{personal,business}', '{standard,advanced}', 3000, 710),
  ('rt-live-chat', 'Live chat', 'One-to-one and group messaging.', 'Real-Time', '{personal,business}', '{standard,advanced}', 3000, 720),
  ('rt-notifications', 'Real-time notifications', 'Instant in-app notification push.', 'Real-Time', '{personal,business}', '{standard,advanced}', 2500, 730),
  -- Location ----------------------------------------------
  ('loc-maps', 'Maps integration', 'Interactive maps and markers.', 'Location', '{personal,business}', '{standard,advanced}', 2000, 810),
  ('loc-location', 'Location services', 'Capture and use device location.', 'Location', '{personal,business}', '{standard,advanced}', 1800, 820),
  ('loc-gps-tracking', 'GPS tracking', 'Live location tracking and trails.', 'Location', '{business}', '{standard,advanced}', 3000, 830),
  -- AI ----------------------------------------------------
  ('ai-chatbot', 'AI chatbot', 'LLM-backed conversational assistant.', 'AI', '{personal,business}', '{advanced}', 4000, 910),
  ('ai-recommendation', 'AI recommendation engine', 'Personalised recommendations.', 'AI', '{personal,business}', '{advanced}', 4000, 920),
  ('ai-content-generation', 'AI content generation', 'Generate text / media on demand.', 'AI', '{personal,business}', '{advanced}', 4000, 930),
  ('ai-analytics', 'AI analytics', 'Predictive and anomaly analytics.', 'AI', '{business}', '{standard,advanced}', 4500, 940),
  ('ai-custom-integration', 'Custom AI integration', 'Bespoke model / pipeline integration.', 'AI', '{business}', '{standard,advanced}', 5000, 950),
  -- Analytics --------------------------------------------
  ('analytics-dashboard', 'Dashboard analytics', 'Headline charts on a dashboard.', 'Analytics', '{academic,personal,business}', '{advanced}', 1500, 1010),
  ('analytics-advanced', 'Advanced analytics', 'Cohorts, funnels, retention.', 'Analytics', '{personal,business}', '{standard,advanced}', 4000, 1020),
  ('analytics-reports', 'Reports', 'Scheduled and ad-hoc reports.', 'Analytics', '{personal,business}', '{standard,advanced}', 1800, 1030),
  ('analytics-data-export', 'Data export', 'CSV / Excel export of records.', 'Analytics', '{personal,business}', '{standard,advanced}', 1500, 1040),
  -- Integration -----------------------------------------
  ('int-rest-api', 'REST API', 'A documented REST API.', 'Integration', '{academic,personal,business}', '{advanced}', 2000, 1110),
  ('int-third-party', 'Third-party API integration', 'Integrate an external service API.', 'Integration', '{personal,business}', '{standard,advanced}', 2200, 1120),
  ('int-payment-api', 'Payment API integration', 'Integrate a payment provider API.', 'Integration', '{personal,business}', '{standard,advanced}', 2000, 1130),
  ('int-maps-api', 'Maps API integration', 'Integrate a maps / places API.', 'Integration', '{personal,business}', '{standard,advanced}', 1800, 1140),
  ('int-social-api', 'Social API integration', 'Integrate a social platform API.', 'Integration', '{personal,business}', '{standard,advanced}', 1800, 1150),
  ('int-custom-api', 'Custom API integration', 'Integrate a bespoke / legacy API.', 'Integration', '{business}', '{standard,advanced}', 3000, 1160),
  -- Security --------------------------------------------
  ('sec-role-access', 'Role-based access control', 'Gate features by role.', 'Security', '{personal,business}', '{standard,advanced}', 1800, 1210),
  ('sec-permissions', 'Permission management', 'Editable permission matrix.', 'Security', '{business}', '{standard,advanced}', 2000, 1220),
  ('sec-audit-logs', 'Audit logs', 'Immutable record of sensitive actions.', 'Security', '{personal,business}', '{standard,advanced}', 2200, 1230),
  ('sec-activity-tracking', 'Security activity tracking', 'Login / device / anomaly tracking.', 'Security', '{personal,business}', '{standard,advanced}', 1800, 1240),
  ('sec-controls', 'Advanced security controls', 'Rate limiting, IP rules, secrets mgmt.', 'Security', '{business}', '{standard,advanced}', 3000, 1250),
  -- Deployment -----------------------------------------
  ('deploy-web', 'Web deployment', 'Deploy the web build to hosting.', 'Deployment', '{academic,personal,business}', '{standard,advanced}', 1500, 1310),
  ('deploy-apk', 'Android APK build', 'Signed release APK.', 'Deployment', '{academic,personal,business}', '{standard,advanced}', 2000, 1320),
  ('deploy-playstore', 'Play Store preparation', 'Store listing and release setup.', 'Deployment', '{personal,business}', '{standard,advanced}', 2500, 1330),
  ('deploy-support', 'Deployment support', 'Assisted first deployment + handover.', 'Deployment', '{academic,personal,business}', '{standard,advanced}', 1800, 1340),
  -- Documentation --------------------------------------
  ('doc-documentation', 'Technical documentation', 'Setup and architecture docs.', 'Documentation', '{academic,personal,business}', '{standard,advanced}', 800, 1410),
  ('doc-srs', 'SRS document', 'Software Requirements Specification.', 'Documentation', '{academic}', '{standard,advanced}', 1000, 1420),
  ('doc-project-report', 'Project report', 'Formatted final-year project report.', 'Documentation', '{academic}', '{standard,advanced}', 1200, 1430),
  ('doc-ppt', 'Presentation (PPT)', 'Slide deck for the project.', 'Documentation', '{academic}', '{standard,advanced}', 800, 1440),
  ('doc-viva', 'Viva questions', 'Likely viva questions with answers.', 'Documentation', '{academic}', '{standard,advanced}', 600, 1450),
  ('doc-academic-package', 'Complete academic package', 'SRS + report + PPT + viva bundle.', 'Documentation', '{academic}', '{standard,advanced}', 2500, 1460),
  -- Automation / workflow (Business) -------------------
  ('auto-workflows', 'Automation workflows', 'Trigger-action automations.', 'Automation', '{business}', '{standard,advanced}', 3500, 1510),
  ('auto-business-workflow', 'Business workflow management', 'Configurable multi-step workflows.', 'Automation', '{business}', '{standard,advanced}', 4000, 1520),
  ('monitoring-advanced', 'Advanced monitoring', 'Health checks, alerts, dashboards.', 'Automation', '{business}', '{standard,advanced}', 3000, 1530),
  ('dashboard-customization', 'Dashboard customization', 'User-arrangeable widgets.', 'Automation', '{business}', '{standard,advanced}', 2500, 1540)
on conflict (id) do nothing;

-- ===========================================================================
-- 3. REQUESTS + SNAPSHOT CHILDREN
-- ===========================================================================

create sequence if not exists public.custom_project_request_seq start 1;

create table if not exists public.custom_project_requests (
  id                   uuid        primary key default gen_random_uuid(),
  request_code         text        unique,               -- CPR-2026-000123 (trigger)
  user_id              uuid        not null references public.profiles (id) on delete cascade,
  -- project details (§22)
  title                text        not null,
  objective            text        not null default '',
  problem_statement    text        not null default '',
  description          text        not null default '',
  target_users         text        not null default '',
  technology_preference text       not null default '',
  -- configuration
  project_type         text        not null check (project_type in ('academic', 'personal', 'business')),
  project_level        text        not null check (project_level in ('standard', 'advanced')),
  platform             text        not null
                         check (platform in ('web', 'android', 'ios', 'web_android', 'web_android_ios')),
  custom_requirements  jsonb       not null default '[]'::jsonb,   -- [{ "text": "..." }]
  project_image_path   text,                                       -- storage ref, not a URL
  -- pricing SNAPSHOT (§34) — later catalog edits must not change this row
  base_price           numeric(10,2) not null default 0,
  platform_charge      numeric(10,2) not null default 0,
  feature_total        numeric(10,2) not null default 0,
  estimated_total      numeric(10,2) not null default 0,
  token_amount         numeric(10,2) not null default 0,
  pricing_version      integer     not null default 1,
  -- token payment (set by the Edge Functions only)
  token_payment_status text        not null default 'pending'
                         check (token_payment_status in ('pending', 'paid', 'failed')),
  payment_id           text,
  payment_order_id     text        unique,
  -- lifecycle (§17). NEW == status 'new' + token_payment_status 'paid'.
  status               text        not null default 'new'
                         check (status in ('new', 'in_development', 'testing', 'ready', 'delivered', 'cancelled')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists custom_project_requests_user_idx    on public.custom_project_requests (user_id, created_at desc);
create index if not exists custom_project_requests_status_idx   on public.custom_project_requests (status, created_at desc);
create index if not exists custom_project_requests_created_idx  on public.custom_project_requests (created_at desc);

create or replace function public.custom_project_set_request_code()
returns trigger language plpgsql as $$
begin
  if new.request_code is null or new.request_code = '' then
    new.request_code := 'CPR-' || to_char(now(), 'YYYY') || '-' ||
      lpad(nextval('public.custom_project_request_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists custom_project_requests_set_code on public.custom_project_requests;
create trigger custom_project_requests_set_code
  before insert on public.custom_project_requests
  for each row execute function public.custom_project_set_request_code();

drop trigger if exists custom_project_requests_set_updated_at on public.custom_project_requests;
create trigger custom_project_requests_set_updated_at
  before update on public.custom_project_requests
  for each row execute function public.set_updated_at();

-- selected features, price-frozen at request time (§34)
create table if not exists public.custom_project_request_features (
  id           uuid        primary key default gen_random_uuid(),
  request_id   uuid        not null references public.custom_project_requests (id) on delete cascade,
  feature_id   text        not null,
  feature_name text        not null default '',
  feature_price numeric(10,2) not null default 0,
  category     text        not null default '',
  created_at   timestamptz not null default now()
);
create index if not exists custom_project_request_features_request_idx
  on public.custom_project_request_features (request_id);

-- reference files uploaded by the student (§20)
create table if not exists public.custom_project_request_files (
  id           uuid        primary key default gen_random_uuid(),
  request_id   uuid        not null references public.custom_project_requests (id) on delete cascade,
  kind         text        not null default 'reference',
  label        text        not null default '',
  storage_path text        not null,
  file_name    text        not null default '',
  size_mb      numeric(10,2) not null default 0,
  sort_order   integer     not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists custom_project_request_files_request_idx
  on public.custom_project_request_files (request_id);

-- ===========================================================================
-- 4. PAYMENTS LEDGER  (§33) — written only by the Edge Functions
-- ===========================================================================
create table if not exists public.custom_project_payments (
  id                  uuid        primary key default gen_random_uuid(),
  request_id          uuid        not null references public.custom_project_requests (id) on delete cascade,
  user_id             uuid        not null references public.profiles (id) on delete cascade,
  project_type        text        not null,
  amount              numeric(10,2) not null default 0,
  currency            text        not null default 'INR',
  razorpay_order_id   text        unique,
  razorpay_payment_id text,
  status              text        not null default 'created'
                        check (status in ('created', 'paid', 'failed')),
  created_at          timestamptz not null default now()
);
create index if not exists custom_project_payments_request_idx on public.custom_project_payments (request_id);
create index if not exists custom_project_payments_user_idx    on public.custom_project_payments (user_id, created_at desc);

-- ===========================================================================
-- 5. STATUS HISTORY  (§17)
-- ===========================================================================
create table if not exists public.custom_project_request_history (
  id              uuid        primary key default gen_random_uuid(),
  request_id      uuid        not null references public.custom_project_requests (id) on delete cascade,
  old_status      text,
  new_status      text        not null,
  changed_by      uuid        references auth.users (id) on delete set null,
  changed_by_role text        not null default 'system'
                    check (changed_by_role in ('student', 'admin', 'system')),
  note            text,               -- admin-facing; never selected by the mobile app
  created_at      timestamptz not null default now()
);
create index if not exists custom_project_request_history_request_idx
  on public.custom_project_request_history (request_id, created_at);

-- ===========================================================================
-- 6. DELIVERY  (§31)
-- ===========================================================================
create table if not exists public.custom_project_deliveries (
  id           uuid        primary key default gen_random_uuid(),
  request_id   uuid        not null unique references public.custom_project_requests (id) on delete cascade,
  demo_url     text,
  notes        text        not null default '',        -- student-visible delivery notes
  delivered_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists custom_project_deliveries_set_updated_at on public.custom_project_deliveries;
create trigger custom_project_deliveries_set_updated_at
  before update on public.custom_project_deliveries
  for each row execute function public.set_updated_at();

create table if not exists public.custom_project_delivery_assets (
  id           uuid        primary key default gen_random_uuid(),
  delivery_id  uuid        not null references public.custom_project_deliveries (id) on delete cascade,
  kind         text        not null default 'other'
                 check (kind in ('screenshot', 'apk', 'source_code', 'documentation', 'demo', 'other')),
  label        text        not null default '',
  storage_path text        not null,
  file_name    text        not null default '',
  size_mb      numeric(10,2) not null default 0,
  sort_order   integer     not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists custom_project_delivery_assets_delivery_idx
  on public.custom_project_delivery_assets (delivery_id, sort_order);

-- ===========================================================================
-- 7. MESSAGES  (§30) — internal admin notes stay in custom_project_requests.admin_notes
-- ===========================================================================
create table if not exists public.custom_project_messages (
  id          uuid        primary key default gen_random_uuid(),
  request_id  uuid        not null references public.custom_project_requests (id) on delete cascade,
  sender_id   uuid        references auth.users (id) on delete set null,
  sender_role text        not null check (sender_role in ('student', 'admin')),
  body        text        not null,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists custom_project_messages_request_idx
  on public.custom_project_messages (request_id, created_at);

-- ===========================================================================
-- 8. DRAFTS  (§28) — one per user, no payment on save
-- ===========================================================================
create table if not exists public.custom_project_drafts (
  user_id    uuid        primary key references public.profiles (id) on delete cascade,
  payload    jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists custom_project_drafts_set_updated_at on public.custom_project_drafts;
create trigger custom_project_drafts_set_updated_at
  before update on public.custom_project_drafts
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- 9. ADMIN INBOX  (§32) — "New Paid Custom Project Request" (service-role insert)
-- ===========================================================================
create table if not exists public.custom_project_admin_inbox (
  id         uuid        primary key default gen_random_uuid(),
  request_id uuid        references public.custom_project_requests (id) on delete cascade,
  title      text        not null,
  body       text        not null default '',
  is_read    boolean     not null default false,
  created_at timestamptz not null default now()
);
create index if not exists custom_project_admin_inbox_unread_idx
  on public.custom_project_admin_inbox (is_read, created_at desc);

-- ===========================================================================
-- 10. HELPERS
-- ===========================================================================

-- Trusted token for a project type. Reads the catalog, falls back to the spec
-- constants. The Edge Function has its own copy of the constants and treats
-- this only as a cross-check — the client can never influence the charge.
create or replace function public.custom_project_token_for(p_type text)
returns numeric language sql stable set search_path = public as $$
  select coalesce(
    (select token_amount
       from public.custom_project_pricing
      where project_type = p_type and is_active
      order by project_level
      limit 1),
    case p_type
      when 'academic' then 1500
      when 'personal' then 3000
      when 'business' then 6000
      else 0
    end
  );
$$;
grant execute on function public.custom_project_token_for(text) to anon, authenticated, service_role;

-- Progress % by status (§27). Kept here for admin queries; the apps also carry
-- the same map in code so the bars stay configurable in one obvious place.
create or replace function public.custom_project_progress_for(p_status text)
returns integer language sql immutable as $$
  select case p_status
    when 'new'            then 20
    when 'in_development'  then 50
    when 'testing'        then 80
    when 'ready'          then 90
    when 'delivered'      then 100
    else 0
  end;
$$;

-- ===========================================================================
-- 11. ROW LEVEL SECURITY  (§35)
--   Catalog tables            -> world-readable
--   requests + children       -> the owner may SELECT their own; NEVER insert /
--                                update (Edge Functions use the service role;
--                                admin writes via is_admin() policies in 013)
--   messages                  -> owner may SELECT + INSERT (as 'student')
--   deliveries / assets       -> owner may SELECT only once status = 'delivered'
--   drafts                    -> owner full CRUD
--   payments / history / inbox-> owner SELECT (history/inbox get admin SELECT in 013)
-- ===========================================================================
alter table public.custom_project_pricing            enable row level security;
alter table public.custom_project_platform_pricing   enable row level security;
alter table public.custom_project_features           enable row level security;
alter table public.custom_project_requests           enable row level security;
alter table public.custom_project_request_features   enable row level security;
alter table public.custom_project_request_files      enable row level security;
alter table public.custom_project_payments           enable row level security;
alter table public.custom_project_request_history    enable row level security;
alter table public.custom_project_deliveries         enable row level security;
alter table public.custom_project_delivery_assets    enable row level security;
alter table public.custom_project_messages           enable row level security;
alter table public.custom_project_drafts             enable row level security;
alter table public.custom_project_admin_inbox        enable row level security;

-- catalog -----------------------------------------------------------------
drop policy if exists "cpp_select_public" on public.custom_project_pricing;
create policy "cpp_select_public" on public.custom_project_pricing for select using (true);

drop policy if exists "cppp_select_public" on public.custom_project_platform_pricing;
create policy "cppp_select_public" on public.custom_project_platform_pricing for select using (true);

drop policy if exists "cpf_select_public" on public.custom_project_features;
create policy "cpf_select_public" on public.custom_project_features for select using (true);

-- requests + snapshot children -----------------------------------------
drop policy if exists "cpr_select_own" on public.custom_project_requests;
create policy "cpr_select_own" on public.custom_project_requests
  for select using (auth.uid() = user_id);

drop policy if exists "cprf_select_own" on public.custom_project_request_features;
create policy "cprf_select_own" on public.custom_project_request_features
  for select using (exists (
    select 1 from public.custom_project_requests r
    where r.id = request_id and r.user_id = auth.uid()
  ));

drop policy if exists "cprfiles_select_own" on public.custom_project_request_files;
create policy "cprfiles_select_own" on public.custom_project_request_files
  for select using (exists (
    select 1 from public.custom_project_requests r
    where r.id = request_id and r.user_id = auth.uid()
  ));

drop policy if exists "cppay_select_own" on public.custom_project_payments;
create policy "cppay_select_own" on public.custom_project_payments
  for select using (auth.uid() = user_id);

drop policy if exists "cprh_select_own" on public.custom_project_request_history;
create policy "cprh_select_own" on public.custom_project_request_history
  for select using (exists (
    select 1 from public.custom_project_requests r
    where r.id = request_id and r.user_id = auth.uid()
  ));

-- deliveries: visible to the owner only once the request is delivered ---
drop policy if exists "cpd_select_delivered" on public.custom_project_deliveries;
create policy "cpd_select_delivered" on public.custom_project_deliveries
  for select using (exists (
    select 1 from public.custom_project_requests r
    where r.id = request_id and r.user_id = auth.uid() and r.status = 'delivered'
  ));

drop policy if exists "cpda_select_delivered" on public.custom_project_delivery_assets;
create policy "cpda_select_delivered" on public.custom_project_delivery_assets
  for select using (exists (
    select 1
      from public.custom_project_deliveries d
      join public.custom_project_requests r on r.id = d.request_id
     where d.id = delivery_id and r.user_id = auth.uid() and r.status = 'delivered'
  ));

-- messages: owner may read the thread and post as 'student' ------------
drop policy if exists "cpm_select_own" on public.custom_project_messages;
create policy "cpm_select_own" on public.custom_project_messages
  for select using (exists (
    select 1 from public.custom_project_requests r
    where r.id = request_id and r.user_id = auth.uid()
  ));

drop policy if exists "cpm_insert_own" on public.custom_project_messages;
create policy "cpm_insert_own" on public.custom_project_messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and sender_role = 'student'
    and exists (
      select 1 from public.custom_project_requests r
      where r.id = request_id and r.user_id = auth.uid()
    )
  );

-- drafts: owner full CRUD --------------------------------------------
drop policy if exists "cpdraft_rw_own" on public.custom_project_drafts;
create policy "cpdraft_rw_own" on public.custom_project_drafts
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- admin_inbox: no student policy (RLS on, admin SELECT added in 013) --

-- ===========================================================================
-- 12. STORAGE BUCKETS  (§19 / §20 / §31) — private; path <uid>/<id>/<file>
-- ===========================================================================
insert into storage.buckets (id, name, public)
values ('custom-project-uploads', 'custom-project-uploads', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('custom-project-deliveries', 'custom-project-deliveries', false)
on conflict (id) do nothing;

-- uploads: the student reads/writes only inside their own "<uid>/..." folder
drop policy if exists "cp_uploads_owner_all" on storage.objects;
create policy "cp_uploads_owner_all" on storage.objects for all to authenticated
  using (bucket_id = 'custom-project-uploads' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'custom-project-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

-- deliveries: the admin uploads into the student's "<uid>/..." folder, the
-- student may read it back (only exposed in the app once status = 'delivered').
drop policy if exists "cp_deliveries_owner_read" on storage.objects;
create policy "cp_deliveries_owner_read" on storage.objects for select to authenticated
  using (bucket_id = 'custom-project-deliveries' and (storage.foldername(name))[1] = auth.uid()::text);

-- Admin storage access — guarded; is_admin() only exists after the admin
-- migrations. 013 re-creates these unconditionally.
do $$
begin
  if to_regprocedure('public.is_admin(uuid)') is not null then
    drop policy if exists "cp_uploads_admin_read" on storage.objects;
    create policy "cp_uploads_admin_read" on storage.objects for select
      using (bucket_id = 'custom-project-uploads' and public.is_admin(auth.uid()));

    drop policy if exists "cp_deliveries_admin_all" on storage.objects;
    create policy "cp_deliveries_admin_all" on storage.objects for all
      using (bucket_id = 'custom-project-deliveries' and public.is_admin(auth.uid()))
      with check (bucket_id = 'custom-project-deliveries' and public.is_admin(auth.uid()));
  end if;
end $$;

notify pgrst, 'reload schema';
