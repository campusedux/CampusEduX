---
name: production-release
description: Prepare a CampusEduX mobile, website, admin-panel, and Supabase change for release using repository-defined build, test, migration, and authorization evidence without assuming a deployment provider.
---

# CampusEduX production release

## Purpose

Decide whether a defined CampusEduX change is ready to release and produce a concrete, evidence-based release report. Use this after implementation and review. This skill does not authorize production deployment, remote database changes, publishing an app build, or payment-provider actions.

## Prerequisites

- Identify the release scope, target surface(s), release owner, and whether database migrations, Edge Functions, environment variables, auth, payments, content visibility, or admin permissions are affected.
- Inspect the working tree and release diff. Do not include unrelated modifications.
- Read the applicable package scripts and `.github/workflows/`. CI is package-scoped: mobile, admin, and website each have their own workflow; website CI also runs a production build and a pull-request Lighthouse job.
- Do not fabricate hosting, app-store, Supabase remote-apply, secret-management, rollback, or monitoring steps. No deployment-provider configuration is established by this repository inspection.

## Workflow

1. Create a release impact map: changed files, user journeys, data contracts, migrations, permission changes, Edge Functions, and external dependencies. Trace all affected shared contracts across mobile, website, and panel.
2. Confirm each code change has focused test evidence and an appropriate review. For security-sensitive areas, inspect direct enforcement rather than relying on UI behavior.
3. Run the applicable package gates:
   - Mobile: typecheck, lint, and Jest.
   - Website: typecheck, lint, Vitest, and `next build` through `npm run build`.
   - Admin panel: typecheck, lint, and Vitest.
4. If SQL, RLS, storage, RPC, or migration ordering changes are included, validate the full ordered local chain plus relevant SQL tests using `mobile-app/supabase/tests/harness/`. Account for the mobile/admin twin order and website migrations applied by `make_template.sh`.
5. For changes involving authentication, admin access, protected learning/practice content, payments, referral/wallet actions, uploads, signed URLs, rate limiting, or AI budgets, verify both the allowed and denied behavior with the applicable actor. Record the test identities and scenarios without exposing credentials or personal data.
6. Identify release blockers honestly: failing tests, unavailable local dependencies, missing migration tests, environment-dependent behavior that has not been validated, or an unapproved external operation. Do not convert an assumption into a release approval.

## Verification

Execute only relevant existing commands from the matching package directories:

- `cd mobile-app && npm run typecheck && npm run lint && npm test -- --ci`
- `cd website && npm run typecheck && npm run lint && npm test && npm run build`
- `cd admin-panel && npm run typecheck && npm run lint && npm test`
- From `mobile-app/supabase/tests/harness/`: `./make_template.sh` followed by `./run_tests.sh` for database-impacting releases.

The local SQL harness creates/drops `cx_*` databases; confirm that local prerequisite before running it. A local pass does not prove a remote deployment occurred.

## Report

Report a clear `ready`, `not ready`, or `ready with named follow-up risk` decision. Include scope, migration and contract impact, checks run with outcomes, checks not run and why, blockers, unresolved risk, and the external actions that still need an explicitly authorized owner. Do not state that a release was deployed unless a separately authorized deployment was actually completed.
