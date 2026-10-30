# Architecture Rules

- Trace the current end-to-end behavior and identify its authoritative owner before proposing code changes.
- Inspect the nearest implementation, direct callers, shared contracts, and relevant tests; trace mobile, website, admin, and Supabase impacts where they share behavior.
- Prefer the existing module boundaries and established utilities. Keep changes minimal and preserve observable behavior outside the approved requirement.
- Record assumptions, compatibility risks, affected surfaces, and rollback considerations in the plan.
- Do not invent schema, APIs, routes, scripts, or deployment conventions; verify them in the repository.