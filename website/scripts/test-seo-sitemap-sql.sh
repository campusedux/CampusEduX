#!/usr/bin/env bash
# Disposable PostgreSQL only: never reads production connection variables.
set -euo pipefail
cd "$(dirname "$0")/.."
seo_pg_bin="${SEO_PG_BIN:-/usr/lib/postgresql/17/bin}"
if [[ ! -x "$seo_pg_bin/initdb" ]]; then
  echo 'Set SEO_PG_BIN to a PostgreSQL bin directory containing initdb and pg_ctl.' >&2
  exit 1
fi
cmp ../mobile-app/supabase/migrations/0149_seo_coding_sitemap_visibility.sql ../admin-panel/supabase/migrations/119_seo_coding_sitemap_visibility.sql
seo_db_tmp="$(mktemp -d /tmp/campusedux-seo-db.XXXXXX)"
cleanup() {
  "$seo_pg_bin/pg_ctl" -D "$seo_db_tmp/data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$seo_db_tmp"
}
trap cleanup EXIT
"$seo_pg_bin/initdb" -D "$seo_db_tmp/data" -A trust --no-locale >/dev/null
"$seo_pg_bin/pg_ctl" -D "$seo_db_tmp/data" -l "$seo_db_tmp/server.log" -o "-k $seo_db_tmp -c listen_addresses='' -p 55439" -w start >/dev/null || { cat "$seo_db_tmp/server.log" >&2; exit 1; }
"$seo_pg_bin/psql" -X -h "$seo_db_tmp" -p 55439 -U "$(id -un)" -d postgres -v ON_ERROR_STOP=1 -f tests/sql/coding-sitemap-visibility.sql
