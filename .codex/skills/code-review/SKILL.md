---
name: code-review
description: Review CampusEduX changes for correctness, regression risk, authorization, data-contract, and test gaps, producing prioritized evidence-backed findings without editing by default.
---

# CampusEduX code review

## Purpose

Review a proposed or existing CampusEduX change and identify actionable defects. Use this for a diff or implementation review; it does not authorize refactoring, schema changes, or release deployment.

## Prerequisites

- Establish the review target: working tree, commit range, or named files. Inspect `git status` first and do not attribute unrelated existing changes to the review.
- Read the changed code, its direct callers, the nearest tests, and affected migration history before reporting conclusions.
- Determine which package owns the behavior. CampusEduX has separate mobile, website, and admin packages with shared backend contracts.

## Workflow

1. Reconstruct the intended behavior and compare it with the actual data/control flow. Check input validation, error handling, loading states, backward compatibility, and whether the changed code reaches the intended enforcement point.
2. For cross-surface work, follow the complete contract: Expo client/service, Next.js page/server action/API route, admin permission gate, Supabase query/RPC/Edge Function, and relevant migration/RLS policy. Do not approve a change merely because one client surface appears correct.
3. Review sensitive CampusEduX boundaries deliberately:
   - Authenticated account access and profile/onboarding flow.
   - Admin session, `is_admin`/`has_permission`, and server-action authorization.
   - RLS, storage, `SECURITY DEFINER` functions, grants, blocked users, and migration-chain/twin ordering.
   - Learning/practice/interview content visibility, premium gating, answer/test-case/solution secrecy, and test submissions.
   - Razorpay order/verification authority, wallet/referral effects, rate limits, AI budgets, signed URLs, uploads, and user-provided URLs.
4. Inspect the existing test evidence and identify missing tests that could permit a regression. For SQL changes, require local harness coverage of allowed and denied paths.
5. Report only defects with a concrete path to incorrect behavior, security exposure, data corruption, production failure, or meaningful test gap. Use severity proportional to impact and likelihood; do not create findings for stylistic preference alone.

## Verification

When execution is in scope, run the affected package's existing checks and relevant SQL harness tests. Treat failed, skipped, or unavailable checks as review evidence, not as a reason to guess. Do not make code changes while reviewing unless the user explicitly asks for fixes.

## Report

List findings first, ordered by severity, with precise file/migration locations, the failing scenario, impact, and a minimal correction direction. Then list verification performed and residual risks. If there are no findings, say so plainly and state the review scope and checks that support that conclusion.
