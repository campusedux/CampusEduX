#!/usr/bin/env bash
# Batch A / DB agent A tests. Builds template cx_tpl_dbA = clone of cx_tpl (full chain + helpers) + migrations
# 0117/089, 0118/090, 0119/091 (mobile then admin twin; the twin must be an idempotent no-op), then runs every
# batch_a/1*.sql in a fresh clone of cx_tpl_dbA. Never touches a remote DB; only cx_* databases.
# Usage: run_dba.sh [--rebuild-only]
set -u; ARG="${1:-}"
T="$(cd "$(dirname "$0")" && pwd)"; S="$T/../.."
export PGOPTIONS="--client-min-messages=warning"
psql -Atd postgres -c "select 1 from pg_database where datname='cx_tpl'" | grep -q 1 || { echo "cx_tpl missing: run harness/make_template.sh"; exit 2; }
dropdb --if-exists cx_tpl_dbA >/dev/null 2>&1; createdb -T cx_tpl cx_tpl_dbA || exit 2
for pair in "0117_project_files_private_check 089_project_files_private_check" \
            "0118_profiles_guard_and_blocked_enforcement 090_profiles_guard_and_blocked_enforcement" \
            "0119_admin_permission_enforcement 091_admin_permission_enforcement"; do
  set -- $pair
  cmp -s "$S/migrations/$1.sql" "$S/../../admin-panel/supabase/migrations/$2.sql" || { echo "TWIN MISMATCH $1 / $2"; exit 2; }
  psql -X -q -v ON_ERROR_STOP=1 -d cx_tpl_dbA -f "$S/migrations/$1.sql" >/dev/null || { echo "FAIL applying $1"; exit 2; }
  psql -X -q -v ON_ERROR_STOP=1 -d cx_tpl_dbA -f "$S/../../admin-panel/supabase/migrations/$2.sql" >/dev/null || { echo "FAIL applying twin $2"; exit 2; }
done
echo "template cx_tpl_dbA ready (3 pairs applied, twins idempotent)"
[ "$ARG" = "--rebuild-only" ] && exit 0
pass=0; fail=0
for f in "$T"/1*.sql; do
  [ -e "$f" ] || continue
  db="cx_dba_test_$$"
  dropdb --if-exists "$db" >/dev/null 2>&1; createdb -T cx_tpl_dbA "$db" || exit 2
  out=$(psql -X -q -v ON_ERROR_STOP=1 -d "$db" -f "$f" 2>&1); rc=$?
  if [ $rc -eq 0 ]; then echo "PASS $(basename "$f")"; pass=$((pass+1))
  else echo "FAIL $(basename "$f")"; echo "$out" | sed 's/^/    /' | head -20; fail=$((fail+1)); fi
  dropdb --if-exists "$db" >/dev/null 2>&1
done
echo "-- $pass passed, $fail failed"; [ $fail -eq 0 ]
