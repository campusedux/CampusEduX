#!/usr/bin/env bash
# Applies the Spring Boot Tutorial mobile migrations 0124-0137, in order, each as ONE transaction, and stops at the
# first error. The course stays HIDDEN: this script never switches anything on.
#
# Usage:   DATABASE_URL='<postgres connection string>' scripts/apply-spring-boot.sh
# The connection string is read from the environment only. It is never printed, logged or stored by this script.
# Nothing is applied until you run it yourself. Admin twins (096-109) are NOT applied here.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIG="$ROOT/mobile-app/supabase/migrations"
: "${DATABASE_URL:?set DATABASE_URL to the target database first}"
command -v psql >/dev/null || { echo "psql is required" >&2; exit 2; }

files=()
for n in $(seq 124 137); do
  f=$(ls "$MIG"/0${n}_seed_spring_boot_tutorial_batch*.sql 2>/dev/null || true)
  [ -n "$f" ] || { echo "missing migration ${n}" >&2; exit 2; }
  files+=("$f")
done
total=${#files[@]}
echo "About to apply $total migrations, in order, each in one transaction. The course stays hidden."
read -r -p "Type APPLY to continue: " ok
[ "$ok" = "APPLY" ] || { echo "aborted, nothing applied"; exit 1; }

i=0
for f in "${files[@]}"; do
  i=$((i+1))
  echo "[$i/$total] $(basename "$f")"
  if ! psql "$DATABASE_URL" -X -q -1 -v ON_ERROR_STOP=1 -f "$f" >/dev/null; then
    echo "STOPPED at $(basename "$f"). That file was rolled back (single transaction); earlier files stay applied." >&2
    echo "Fix the cause, then re-run: every file is idempotent, so applied ones are safe to run again." >&2
    exit 1
  fi
done
echo "All $total migrations applied. Next: run the check query (it must say ok = true on every row)."
