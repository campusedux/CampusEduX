#!/usr/bin/env bash
# DB agent B wrapper. Builds template cx_tpl_dbB (= cx_tpl + 0120..0122 mobile, then admin twins 092..094,
# + website 0001/0002 contact migrations) and runs batch_a/2*.sql each in a fresh clone.
# Usage: run_dbb.sh [--rebuild] [test_file ...]     Only touches cx_* databases.
H="$(cd "$(dirname "$0")/../harness" && pwd)"
T="$(cd "$(dirname "$0")" && pwd)"
M="$T/../../migrations"; A="$T/../../../../admin-panel/supabase/migrations"; W="$T/../../../../website/supabase/migrations"
export PGOPTIONS="--client-min-messages=warning"
TPL=cx_tpl_dbB
if [ "$1" = "--rebuild" ] || ! psql -Atd postgres -c "select 1 from pg_database where datname='$TPL'" | grep -q 1; then
  [ "$1" = "--rebuild" ] && shift
  dropdb --if-exists "$TPL" >/dev/null 2>&1
  createdb -T cx_tpl "$TPL" || exit 2
  for f in "$M"/0120_*.sql "$A"/092_*.sql "$M"/0121_*.sql "$A"/093_*.sql "$M"/0122_*.sql "$A"/094_*.sql "$W"/0001_*.sql "$W"/0002_*.sql; do
    psql -X -q -v ON_ERROR_STOP=1 -1 -d "$TPL" -f "$f" >/dev/null 2>"/tmp/dbb_err.$$" || { echo "MIGRATION FAIL $(basename "$f")"; cat "/tmp/dbb_err.$$"; exit 2; }
  done
  echo "template $TPL built"
fi
files=("$@"); [ ${#files[@]} -eq 0 ] && files=("$T"/2*.sql)
pass=0; fail=0
for f in "${files[@]}"; do
  [ -e "$f" ] || continue
  db="cx_dbb_$$"
  dropdb --if-exists "$db" >/dev/null 2>&1; createdb -T "$TPL" "$db" || exit 2
  out=$(psql -X -q -v ON_ERROR_STOP=1 -d "$db" -f "$f" 2>&1); rc=$?
  if [ $rc -eq 0 ]; then echo "PASS $(basename "$f")"; pass=$((pass+1))
  else echo "FAIL $(basename "$f")"; echo "$out" | sed 's/^/    /' | head -15; fail=$((fail+1)); fi
  dropdb --if-exists "$db" >/dev/null 2>&1
done
echo "-- $pass passed, $fail failed"; [ $fail -eq 0 ]
