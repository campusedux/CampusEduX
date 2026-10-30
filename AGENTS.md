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
- Obtain explicit human approval before high-risk changes or operations, including schema/RLS/auth/payment/secret changes, migrations, production configuration, deployment, and Git commit/branch creation. Never push.
- Use production-first engineering practices: validate inputs, enforce access on trusted boundaries, preserve data integrity, consider rollback and operational impact, and test failure and denied-access paths.
- Report tests, builds, migrations, and deployments truthfully. State what ran, its result, and what was skipped or unavailable; never imply success without evidence.
- Document behavior, contract, operational, and verification changes. Commit only after explicit approval.

## Surface-Specific Rules

The six engineering rule groups are included below and apply repository-wide. For specialized work, read the matching Skill in `.codex/skills/`. Native agent definitions are in `.codex/agents/*.toml`; the copied Markdown agent files are reference material, not native registrations.


# CampusEduX – Working Rules
Monorepo: website/ (Next.js, Vercel), admin-panel/ (web), mobile-app/ (Expo). All share ONE Supabase DB.
Stack: Next.js, TS, React, Supabase, Tailwind. No new libraries unless essential.

Rules:
- Schema changes ONLY via new migration files in the verified package migration directories: `mobile-app/supabase/migrations/`, `admin-panel/supabase/migrations/`, and `website/supabase/migrations/` (idempotent, no DROP of data). Inspect `mobile-app/supabase/tests/harness/chain_order.txt` and required mobile/admin twins before choosing placement. The user runs `supabase db push`; do not execute it.
- Never break mobile-app/ queries — check its usage before changing any table/column.
- Never delete prod data, never disable RLS, never break existing URLs (add redirects if slug changes).
- Commit only. Never push.
- Do not create new Markdown/documentation files without explicit user approval. This root AGENTS.md and the native Codex migration configuration are explicitly approved; that approval does not authorize unrelated documentation.
- Keep it simple. No over-engineering.
- Output: short. No code dumps in chat, no long explanations. Report = bullet list, max 15 lines.

## Verified repository paths

- Application surfaces: `website/`, `admin-panel/`, `mobile-app/`.
- Ordered SQL harness: `mobile-app/supabase/tests/harness/chain_order.txt`.
- Local SQL verification: `make_template.sh` and `run_tests.sh` in that harness directory. Verify local-only `cx_*` prerequisites and obtain required approval before execution.

## Architecture Rules

- Trace the current end-to-end behavior and identify its authoritative owner before proposing code changes.
- Inspect the nearest implementation, direct callers, shared contracts, and relevant tests; trace mobile, website, admin, and Supabase impacts where they share behavior.
- Prefer the existing module boundaries and established utilities. Keep changes minimal and preserve observable behavior outside the approved requirement.
- Record assumptions, compatibility risks, affected surfaces, and rollback considerations in the plan.
- Do not invent schema, APIs, routes, scripts, or deployment conventions; verify them in the repository.

## Database Rules

- Treat schema, migrations, RLS, RPCs, storage policies, grants, and Edge Function contracts as high-risk; get explicit human approval before changing or executing them.
- Inspect the ordered migration history, latest object definitions, direct callers, and relevant SQL tests. For shared migrations, check `mobile-app/supabase/tests/harness/chain_order.txt` and required mobile/admin twins.
- Preserve least privilege and existing data/security invariants. Never disable or weaken RLS, grants, ownership checks, or authorization to make a test pass.
- Prove both allowed and denied actor behavior with the existing local SQL harness; do not run remote mutations or real migrations without explicit approval.
- Report exactly which database checks ran. A typecheck or application test is not evidence that RLS or migration behavior is correct.

## Frontend Rules

- Follow the existing platform, component, navigation, state, styling, accessibility, and localization conventions for the surface being changed.
- Reuse existing components and utilities; inspect the closest screen and its service/action contract before editing.
- Preserve loading, empty, error, permission, and responsive behavior. Do not rely on UI hiding as authorization.
- Keep privileged decisions and secrets out of client code; validate untrusted input at the trusted server or database boundary.
- Add focused tests for changed user-visible behavior and relevant failure states.

## Git Rules

- Preserve all existing user changes and inspect the worktree before editing or staging.
- Keep the diff limited to the approved task; do not reset, clean, or overwrite user work.
- Never push. Obtain explicit human approval before creating branches, committing, or otherwise publishing changes. Approval to commit never authorizes a push.
- Before an approved commit, inspect staged paths and diff, scan for secrets and generated/local state, and run the relevant checks.
- Never commit credentials, private keys, environment files, generated output, or local state.

## Security Rules

- Treat authentication, authorization, RLS, secrets, payments, protected content, uploads, and production configuration as sensitive boundaries.
- Never print, copy, request, or commit secret values or private user data. Use approved secret references and avoid echoing credentials in diagnostics.
- Enforce access at trusted server/database boundaries; do not weaken RLS, identity checks, payment verification, or content gating.
- Require explicit human approval before high-risk security or credential changes. Clearly destructive or credential-exposing actions must be blocked.
- Validate untrusted input and test both permitted and denied behavior at the actual enforcement point.

## Testing Rules

- Read the nearest existing tests and package scripts; run the smallest relevant check first, then the required checks for affected surfaces.
- Test behavior and contracts, including relevant invalid, denied, and failure paths. Use the repository's test runners and database harness; do not install tools without approval.
- For database/RLS changes, use the ordered local SQL harness when available; never substitute an application-only test for database authorization evidence.
- Report exact commands and outcomes, including failures, skips, and environment blockers. Never claim a check ran when it did not.

## Native Codex configuration safety

- Project MCP servers are registered but disabled. Do not enable, authenticate, or contact GitHub or Supabase MCP servers without explicit approval. Preserve the Supabase read-only/project/features URL and GitHub lockdown/toolset restrictions.
- Hooks are disabled with `features.hooks = false`. Do not execute, enable, or trust the security gate until the user separately approves runtime tests and reviews their results.
- Subagents remain disabled with `agents.enabled = false` pending tool-policy review. Enabling and invoking them requires explicit human approval for a scoped test; ordinary task approval does not authorize delegation. Preserve original tool restrictions. Read-only specialists require an enforced read-only parent session; custom agent instructions and file ownership assignments do not create an independent sandbox or a native tool allowlist.
- Native `.codex/rules/*.rules` constrain command execution approvals; they do not replace filesystem permissions, file-edit approvals, database authorization, or secret-access controls. Never treat a sandboxed command or an unmatched command as automatically authorized.
- Keep the six existing `.codex/skills/*/SKILL.md` files as the single active project skill set. Do not copy or symlink them into `.agents/skills` without an explicit discovery migration and duplicate check.
- Never read credential stores or secret/environment files, including through shell commands, interpreters, MCP tools, or indirect paths. Do not request broader filesystem access as a workaround. Preserve the host's sandbox and deny-read controls; this project configuration does not replace them.
- Do not install tools or dependencies without explicit approval. Before an approved commit, run the relevant checks and inspect staged changes for secrets, generated files, and unrelated user changes. The security gate does not run package scripts or grant approval.
