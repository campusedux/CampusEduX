---
name: testing
description: Select, add, and run CampusEduX tests for mobile Jest, website/admin Vitest, Deno Edge Functions, and local Supabase migration/RLS contracts.
---

# CampusEduX testing workflow

## Purpose

Provide evidence that a CampusEduX behavior still works and that its authorization/data contracts hold. Use this for test planning, implementation, or execution; do not use it as a substitute for code review or a release decision.

## Prerequisites

- Identify the changed or risky behavior, its app surface, and its contract boundary (UI, service/action, database/RLS, RPC, or Edge Function).
- Read the nearest existing test and its implementation before choosing a test location or mocking strategy.
- Do not install packages or invent a test runner. Use the dependencies and scripts in the relevant package.

## Workflow

1. Classify the test target:
   - Mobile Jest tests are in `mobile-app/tests/unit/` and `mobile-app/tests/integration/`; the configuration is `mobile-app/jest.config.js`.
   - Website Vitest tests are in `website/tests/`, and admin Vitest tests are in `admin-panel/tests/`; both configurations deliberately use the Node environment.
   - Deno Edge Function tests live with their function, such as `mobile-app/supabase/functions/admin-ban-user/handler.test.ts`. Mobile Jest intentionally excludes `supabase/functions/` and exercises compatible pure handlers through `mobile-app/tests/unit/edge/`.
   - SQL migration/RLS tests live in `mobile-app/supabase/tests/batch_a/` and use the harness helpers, stubs, and ordered chain.
2. Make tests prove a contract, not an implementation detail. Cover success, relevant invalid input/error behavior, and authorization/visibility boundaries. For data access, include at least the permitted actor and the actor who must be denied.
3. Keep mocks at external boundaries. Preserve actual parsing, pricing, permission, and visibility logic in the test where practical. Do not assert fabricated schema fields or hard-code production credentials.
4. Run the smallest affected test first, then the package-level checks required by the changed surface. For migration, policy, RPC, or storage changes, include harness verification rather than relying only on TypeScript tests.

## Verification

Use these repository-defined commands when their dependencies are present:

- Mobile: `cd mobile-app && npm run typecheck && npm run lint && npm test -- --ci`
- Website: `cd website && npm run typecheck && npm run lint && npm test && npm run build`
- Admin panel: `cd admin-panel && npm run typecheck && npm run lint && npm test`
- Supabase local harness: from `mobile-app/supabase/tests/harness/`, run `./make_template.sh` and `./run_tests.sh`.

The SQL harness uses local `cx_*` databases and requires the PostgreSQL client tools. Do not silently skip a failed or unavailable check; record it and explain what was not verified.

## Report

Report the behavior tested, test files added or changed, commands executed and outcomes, and uncovered boundaries. Distinguish a focused test pass from full package/harness coverage. If a test is intentionally not added, state the evidence that makes that appropriate.
