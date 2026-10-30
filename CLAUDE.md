# CampusEduX Engineering Workflow

Use this workflow for every change:

**UNDERSTAND → INSPECT → PLAN → APPROVE → IMPLEMENT → TEST → REVIEW → DOCUMENT/COMMIT**

- No vibe coding: work from verified repository evidence and explicit requirements, not guesses.
- Inspect the existing architecture, callers, contracts, and nearest tests before implementation.
- Preserve existing behavior and compatibility unless a requirement explicitly changes them.
- Reuse existing components, utilities, patterns, and package scripts; do not introduce parallel implementations without a demonstrated need.
- Keep changes limited to the approved scope. Do not make unrelated edits.
- Never expose, request, store, or log secrets or private credentials.
- Never weaken RLS, authentication, authorization, payment authority, or other security controls as a shortcut.
- Obtain explicit human approval before high-risk changes or operations, including schema/RLS/auth/payment/secret changes, migrations, production configuration, deployment, and Git commit/branch creation. Never push. Approval to commit never authorizes a push.
- Use production-first engineering practices: validate inputs, enforce access on trusted boundaries, preserve data integrity, consider rollback and operational impact, and test failure and denied-access paths.
- Report tests, builds, migrations, and deployments truthfully. State what ran, its result, and what was skipped or unavailable; never imply success without evidence.
- Document behavior, contract, operational, and verification changes. Commit only after explicit approval.

## Surface-Specific Rules

Follow the focused instructions in `.claude/rules/` for architecture, frontend, database, security, testing, and Git. For specialized work, use the matching Skill in `.claude/skills/` and relevant Agent in `.claude/agents/`.


# CampusEduX – Working Rules
Monorepo: website/ (Next.js, Vercel), admin-panel/ (web), mobile-app/ (Expo). All share ONE Supabase DB.
Stack: Next.js, TS, React, Supabase, Tailwind. No new libraries unless essential.

Rules:
- Schema changes ONLY via new migration files in supabase/migrations (idempotent, no DROP of data). I run `supabase db push` myself.
- Never break mobile-app/ queries — check its usage before changing any table/column.
- Never delete prod data, never disable RLS, never break existing URLs (add redirects if slug changes).
- Commit only. Never push.
- No new .md/doc files except this one.
- Keep it simple. No over-engineering.
- Output: short. No code dumps in chat, no long explanations. Report = bullet list, max 15 lines.

## Architecture Map
(filled after Phase 1)
