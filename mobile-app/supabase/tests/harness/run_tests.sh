#!/usr/bin/env bash
# Usage: run_tests.sh [dir]   Each *.sql runs in a fresh clone of cx_tpl (auto-built if missing).
H="$(cd "$(dirname "$0")" && pwd)"
DIR="${1:-$H/../batch_a}"
psql -Atd postgres -c "select 1 from pg_database where datname='cx_tpl'" | grep -q 1 || "$H/make_template.sh" || exit 2
export PGOPTIONS="--client-min-messages=warning"
pass=0; fail=0
for f in "$DIR"/*.sql; do
  [ -e "$f" ] || continue
  db="cx_test_$$"
  dropdb --if-exists "$db" >/dev/null 2>&1; createdb -T cx_tpl "$db" || exit 2
  out=$(psql -X -q -v ON_ERROR_STOP=1 -d "$db" -f "$f" 2>&1); rc=$?
  if [ $rc -eq 0 ]; then echo "PASS $(basename "$f")"; pass=$((pass+1))
  else echo "FAIL $(basename "$f")"; echo "$out" | sed 's/^/    /' | head -15; fail=$((fail+1)); fi
  dropdb --if-exists "$db" >/dev/null 2>&1
done
echo "-- $pass passed, $fail failed"; [ $fail -eq 0 ]
