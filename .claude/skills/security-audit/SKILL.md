---
name: security-audit
description: Perform an evidence-based CampusEduX security audit of Supabase authorization, auth flows, privileged actions, protected learning content, payments, and user-controlled input without changing production behavior by default.
---

# CampusEduX security audit

## Purpose

Find and report concrete security risks in CampusEduX without speculative findings. Use this for a security review or targeted audit; use `supabase-production` when the requested outcome is implementing a backend change.

## Prerequisites

- Define the scope, attacker identity, assets to protect, and whether the task is read-only or includes an approved remediation.
- Inspect the current working tree and preserve unrelated changes.
- Start from code and migrations that prove the trust boundary. Never treat comments, UI gates, or an unverified test as enforcement.

## Workflow

1. Build an access map for each audited flow: unauthenticated user, ordinary authenticated student, another student, blocked/suspended user where applicable, permitted admin, and unpermitted admin. Trace request origin to database policy, RPC, or Edge Function.
2. Audit authentication and sessions in `mobile-app/src/lib/supabase.ts`, `mobile-app/src/services/auth.service.ts`, `website/src/lib/auth.ts`, `website/src/lib/supabase/`, and `admin-panel/src/lib/auth.ts`. Confirm public clients use only public keys, server-side identity is verified, redirects are validated, and account state is enforced by the authoritative backend path.
3. Audit RLS, storage, and privileged database functions in the ordered migration history. In particular, examine owner checks, `is_active_user`, `is_admin`, `has_permission`, policy `USING` and `WITH CHECK` clauses, function execution grants, and `SECURITY DEFINER` boundaries. Test direct calls rather than trusting page-level hiding.
4. Treat learning, practice, interview-question, and coding-problem answers as protected content. Check that correct answers, test cases, solution code, premium content, unpublished content, and academic-targeted content cannot be retrieved or submitted against through direct queries/RPCs. Review the current visibility and submission safeguards in the latest migrations.
5. Audit money and privileged operations: the Razorpay Edge Functions and `_shared/` helpers, admin server actions, account deletion, wallet/referral operations, rate limiting, AI budget use, and file URL/upload flows. Verify price/payment authority and secret material remain on the server-side path.
6. Review user-controlled inputs and output contexts using the actual consumers: URLs, uploaded files, markdown/content rendering, server actions, API routes, and logs. Check existing safe-URL, JSON-LD/XSS, upload-limit, and rate-limit tests for intended contracts.
7. Reproduce each finding with the smallest safe local test or code trace. Do not modify live data, authenticate as another person, invoke payment providers, or run remote mutations during an audit unless explicitly authorized.

## Verification

Use the existing test suites and, for database access control, the local SQL harness in `mobile-app/supabase/tests/harness/`. Re-check the exact enforcement point after a proposed fix. A passing UI test is not proof of RLS or RPC safety, and a passing SQL test is not proof that a browser/server caller preserves identity.

## Report

For each finding, give severity, affected asset and actor, evidence with file/migration locations, a reproducible safe scenario, impact, and a minimal remediation. Separate verified findings from hardening suggestions and explicitly state untested boundaries. Do not claim a vulnerability without a demonstrated bypass or an enforceable reasoning chain.
