#!/usr/bin/env bash
# Builds template DB cx_tpl (stubs + full migration chain + helpers.sql).
set -e
H="$(cd "$(dirname "$0")" && pwd)"
"$H/run_chain.sh" cx_tpl
# website tree (contact form) — not part of chain_order.txt
for f in "$H"/../../../../website/supabase/migrations/*.sql; do psql -X -q -v ON_ERROR_STOP=1 -d cx_tpl -f "$f"; done
psql -X -q -v ON_ERROR_STOP=1 -d cx_tpl -f "$H/helpers.sql"
echo "template cx_tpl ready"
