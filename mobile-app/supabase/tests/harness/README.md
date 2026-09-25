# Local PG17 migration test harness

Plain PostgreSQL 17 + Supabase stubs (`stubs.sql`: roles, auth.users/uid/role/jwt, storage, extensions, realtime publication). Never touches remote DBs; only `cx_*` databases.

- `./run_chain.sh cx_x` — create DB, load stubs, apply `chain_order.txt` (mobile 0001-0116 + admin 001-088 interleaved, each file in one transaction, stops at first error). ~20s.
- `./make_template.sh` — builds template `cx_tpl` (chain + `helpers.sql`). Rebuild after adding/changing migrations.
- `./run_tests.sh [dir]` — each `*.sql` in `../batch_a` (default) runs in a fresh `createdb -T cx_tpl` clone with ON_ERROR_STOP; prints PASS/FAIL, drops the clone.
- Helpers in tests: `test_make_user(email, meta)`, `test_as(uid, role)`, `test_reset()`. Assert with `raise exception`; expected failures via `begin ... exception when ... then null; end`.

Chain order rules: mobile 0001-0020 first; each admin twin runs right after its mobile twin (reverse fails on 0042/019); see header of `chain_order.txt`. To add migrations, append lines there.
