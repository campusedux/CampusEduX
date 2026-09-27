---
name: supabase-production
description: Safely design, change, or verify CampusEduX Supabase migrations, RLS, RPCs, storage policies, and Edge Functions using the repository's ordered local SQL harness.
---

# CampusEduX Supabase production workflow

## Purpose

Make or assess a production-safe Supabase backend change for CampusEduX. Use this when the task touches migrations, RLS, database functions, storage policies, Edge Functions, or their tests. It is not a generic SQL-authoring workflow and does not authorize remote database changes.

## Prerequisites

- Identify the exact caller, affected role(s), expected rows, and denied rows before editing SQL.
- Read the current schema history rather than deriving names from app code. The primary sequence is `mobile-app/supabase/migrations/`; admin counterparts are in `admin-panel/supabase/migrations/`; website-owned contact migrations are in `website/supabase/migrations/`.
- Read `mobile-app/supabase/tests/harness/chain_order.txt`, `run_chain.sh`, and `run_tests.sh` before altering migration ordering or test coverage.
- Confirm that the local PostgreSQL tools and the harness's `cx_*` database convention are available before running harness commands. The harness creates and drops only `cx_*` local databases; it must never be aimed at a remote database.

## Workflow

1. Trace the end-to-end authorization path: client or server caller, Supabase client identity, table/RPC/function/Edge Function, RLS or function checks, and returned data. Inspect both mobile and website callers when a shared contract is involved.
2. Locate the latest definition of each affected table, policy, function, trigger, view, or storage rule across ordered migrations. Later migrations may replace earlier policy or function definitions.
3. Decide whether the migration needs a panel twin and where it belongs in `chain_order.txt`. The harness intentionally applies many mobile/admin twins immediately after one another; preserve that ordering contract and do not assume filenames alone establish order.
4. Design explicit allow and deny behavior for `anon`, `authenticated`, an owning user, a non-owning user, inactive or blocked users where relevant, and admins with the project permission model. For content, verify published/visibility, targeting, and premium boundaries rather than exposing fields and trusting the UI to hide them.
5. For a `SECURITY DEFINER` function, verify it authenticates and authorizes its caller, has a safe `search_path`, accepts only validated input, reveals no protected columns, and has deliberate `REVOKE`/`GRANT` statements. Match the project’s existing function conventions rather than copying a partial pattern.
6. For Edge Functions, retain the configured JWT requirement in `mobile-app/supabase/config.toml` unless an explicitly reviewed endpoint requires otherwise. Keep payment prices, verification, and secrets server-side; inspect shared helpers in `mobile-app/supabase/functions/_shared/` before creating parallel logic.
7. Add SQL tests that prove the security and integrity property, including expected failures. Use the helpers and stubs supplied by `mobile-app/supabase/tests/harness/`, not an assumed hosted Supabase environment.

## Verification

For a migration-chain change, rebuild and test through the existing harness from `mobile-app/supabase/tests/harness/`:

- `./make_template.sh`
- `./run_tests.sh`

Run a focused batch directory only when it contains the relevant tests. A clean migration application is necessary but insufficient: verify the specific owner/non-owner, authenticated/anonymous, and content-access cases affected by the change. Run relevant application tests as well when a query, response shape, or caller changes.

Do not run a remote apply, alter a linked project, or deploy an Edge Function without explicit authorization and an environment-specific release plan.

## Report

State the schema objects and policies/functions changed; the migration ordering and any twin relationship; the caller/role matrix tested; commands and results; and the rollback or recovery approach already supported by the migration history. Clearly separate local-harness evidence from unperformed remote validation.
