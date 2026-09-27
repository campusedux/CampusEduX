---
name: feature-development
description: Implement a CampusEduX product feature across the mobile app, website, admin panel, and shared Supabase contracts only after tracing the existing end-to-end flow.
---

# CampusEduX feature development

## Purpose

Deliver a small, evidence-backed product change that fits the existing CampusEduX surfaces: the Expo mobile app, the Next.js website, the Next.js admin panel, and their shared Supabase backend. Use this for implementation work, not for a schema-only change, security audit, review, or release decision.

## Prerequisites

- State the user-visible outcome, affected surface(s), and whether it changes data, authentication, payments, content visibility, or permissions.
- Inspect the working tree before editing. Preserve unrelated changes.
- Read the closest existing screen, service/action, types, and test before proposing implementation. Do not infer a table, RPC, Edge Function, route, or command from its name.
- Work from the relevant package directory. CampusEduX has separate packages in `mobile-app/`, `website/`, and `admin-panel/`; there is no root package script.

## Workflow

1. Map the existing path from user action to data access and back. For mobile, start in `mobile-app/src/` and its services; for the website, follow App Router pages, `src/lib/`, server actions, and Supabase helpers; for the panel, follow `(panel)` routes, actions, and permission gates.
2. Identify the authoritative contract before coding. Shared schema history is in `mobile-app/supabase/migrations/`; panel migrations contain interleaved twins used by the local harness; `website/supabase/migrations/` currently holds website-owned contact migrations. Read `mobile-app/supabase/tests/harness/chain_order.txt` before any migration work.
3. Preserve established boundaries:
   - Mobile uses the public Supabase client in `mobile-app/src/lib/supabase.ts`; never expose a secret or service-role key in an `EXPO_PUBLIC_*` value.
   - Website authenticated work uses the cookie-aware helpers in `website/src/lib/supabase/` and the account gate in `website/src/lib/auth.ts`.
   - Admin work must retain the panel's signed-in session plus database permission enforcement (`admin-panel/src/lib/auth.ts`, `permission-gate.ts`, and `permissions.ts`); do not bypass it with a browser-visible privileged key.
   - Reuse existing Edge Functions under `mobile-app/supabase/functions/` for payment and account flows instead of duplicating payment authority in a client.
4. For learning, practice, interview questions, projects, or the custom-project builder, trace the matching client and panel ownership before changing behavior. Relevant primary areas include `mobile-app/src/learning/`, `mobile-app/src/practice/`, `mobile-app/src/project/`, `mobile-app/src/customProjects/`, `website/src/lib/learning.ts`, `website/src/lib/practice.ts`, `website/src/lib/interviewQuestions.ts`, and the corresponding admin `(panel)` routes.
5. Write a narrow implementation plan naming the files and contracts that evidence supports. Implement the smallest coherent change. Do not introduce placeholder data, guessed field names, speculative fallbacks, or a second source of truth.
6. Add or update focused tests alongside the changed behavior. Treat a migration, RLS policy, RPC, Edge Function, payment calculation, visibility rule, or cross-user access path as a contract that needs direct verification.

## Verification

Run the checks applicable to the changed package with its existing dependencies:

- `cd mobile-app && npm run typecheck && npm run lint && npm test -- --ci`
- `cd website && npm run typecheck && npm run lint && npm test && npm run build`
- `cd admin-panel && npm run typecheck && npm run lint && npm test`

For Supabase changes, follow the local harness in `mobile-app/supabase/tests/harness/`; do not claim database verification from TypeScript tests alone. If a check cannot run, record the command, blocker, and remaining risk instead of substituting a guess.

## Report

Report the outcome, user-visible behavior, files changed, contracts traced, tests/checks run with results, and any checks not run. Call out migrations, RLS, auth, payment, or visibility implications explicitly. Do not call a feature complete solely because code compiles.
