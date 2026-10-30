# Database Rules

- Treat schema, migrations, RLS, RPCs, storage policies, grants, and Edge Function contracts as high-risk; get explicit human approval before changing or executing them.
- Inspect the ordered migration history, latest object definitions, direct callers, and relevant SQL tests. For shared migrations, check `mobile-app/supabase/tests/harness/chain_order.txt` and required mobile/admin twins.
- Preserve least privilege and existing data/security invariants. Never disable or weaken RLS, grants, ownership checks, or authorization to make a test pass.
- Prove both allowed and denied actor behavior with the existing local SQL harness; do not run remote mutations or real migrations without explicit approval.
- Report exactly which database checks ran. A typecheck or application test is not evidence that RLS or migration behavior is correct.