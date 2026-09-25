#!/usr/bin/env bash
# Usage: run_chain.sh <dbname>   (must start with cx_). Creates DB, loads stubs, applies chain_order.txt.
set -u
DB="${1:?usage: run_chain.sh <dbname>}"
[[ "$DB" == cx_* ]] || { echo "refusing: db name must start with cx_"; exit 2; }
H="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$H/../../../.." && pwd)"   # repo root
export PGOPTIONS="--client-min-messages=error"
dropdb --if-exists "$DB" >/dev/null 2>&1
createdb "$DB" || exit 2
psql -X -q -v ON_ERROR_STOP=1 -d "$DB" -c "alter database \"$DB\" set search_path = \"\$user\", public, extensions" || exit 2
psql -X -q -v ON_ERROR_STOP=1 -d "$DB" -f "$H/stubs.sql" >/dev/null || { echo "stubs.sql failed"; exit 1; }
n=0
while read -r tree file; do
  [[ -z "${tree:-}" || "$tree" == \#* ]] && continue
  case "$tree" in mobile) d="$ROOT/mobile-app/supabase/migrations";; admin) d="$ROOT/admin-panel/supabase/migrations";; *) echo "bad tree $tree"; exit 2;; esac
  out=$(psql -X -q -1 -v ON_ERROR_STOP=1 -d "$DB" -f "$d/$file" 2>&1 >/dev/null)
  if [ $? -ne 0 ]; then echo "FAILED: $tree/$file"; echo "$out" | grep -v '^$' | head -8; exit 1; fi
  n=$((n+1))
done < "$H/chain_order.txt"
echo "chain OK: $n migrations applied to $DB"
