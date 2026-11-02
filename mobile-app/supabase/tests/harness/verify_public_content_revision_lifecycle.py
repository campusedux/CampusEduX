#!/usr/bin/env python3
"""Isolated cx_* clones only. Never reads a remote connection or credential store."""
import argparse
import os
from pathlib import Path
import pwd
import re
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument("--socket", required=True, type=Path)
parser.add_argument("--port", required=True, type=int)
args = parser.parse_args()
socket = args.socket.resolve()
if not socket.is_dir() or not str(socket).startswith("/tmp/"):
    raise SystemExit("Only a task-owned /tmp Unix socket is supported")
root = Path(__file__).resolve().parents[4]
canonical = root / "mobile-app/supabase/migrations/0155_public_content_revisions.sql"
twin = root / "admin-panel/supabase/migrations/123_public_content_revisions.sql"
rollback = root / "mobile-app/supabase/rollbacks/0155_public_content_revisions_rollback.sql"
source = canonical.read_text()
assert source == twin.read_text(), "Migration twins differ"
assert not re.search(r"^\s*(begin|commit|rollback)\s*;", source, re.M | re.I), "Nested transaction control"

# Use an empty task-local password reference, never ~/.pgpass or a service file.
passfile = socket / "empty-test-pgpass"
passfile.touch(mode=0o600, exist_ok=True)
env = {
    "PATH": "/usr/bin:/bin", "PGHOST": str(socket), "PGPORT": str(args.port),
    "PGUSER": pwd.getpwuid(os.getuid()).pw_name, "PGDATABASE": "postgres",
    "PGPASSFILE": str(passfile), "PGSERVICEFILE": "/dev/null", "PSQLRC": "/dev/null",
}
db = f"cx_revision_lifecycle_{os.getpid()}"


def run(command, *, input=None, ok=True):
    result = subprocess.run(command, input=input, env=env, text=True, capture_output=True)
    if ok and result.returncode:
        raise AssertionError(result.stderr)
    if not ok and not result.returncode:
        raise AssertionError("Injected failure unexpectedly succeeded")
    return result.stdout.strip()


def sql(statement):
    return run(["psql", "-X", "-At", "-v", "ON_ERROR_STOP=1", "-d", db, "-c", statement])


def apply(text, *, ok=True):
    # Equivalent explicit SQL transaction boundary for local fault injection.
    # The intended native CLI batch/ledger transaction is source-verified;
    # this runner does not claim to execute that unavailable CLI binary.
    return run(["psql", "-X", "-q", "--single-transaction", "-v", "ON_ERROR_STOP=1",
                "-d", db, "-f", "-"], input=text, ok=ok)


run(["createdb", "-T", "cx_tpl", db])
try:
    # Remove ONLY the new contract inside this disposable clone for fresh-install
    # fault injection. Learning/Blog/Home tables and their contents stay intact.
    run(["psql", "-X", "-q", "-v", "ON_ERROR_STOP=1", "-d", db, "-f", str(rollback)])
    sql("drop function public.public_content_revision(text); "
        "drop function public.bump_public_content_revision(); "
        "drop table public.public_content_revisions;")
    faults = [
        source.replace("\ndo $$\n", "\nselect 1 / 0;\ndo $$\n", 1),
        source.replace("  end loop;", "    raise exception 'injected trigger-install failure';\n  end loop;", 1),
        source + "\nselect 1 / 0;\n",
    ]
    for fault in faults:
        assert fault != source
        apply(fault, ok=False)
        assert sql("select to_regclass('public.public_content_revisions') is null") == "t"
        assert sql("select to_regprocedure('public.public_content_revision(text)') is null") == "t"
        assert sql("select to_regprocedure('public.bump_public_content_revision()') is null") == "t"
        assert sql("select count(*) from pg_trigger where tgname like 'public_revision_%'") == "0"
    print("PASS atomic fresh installation: failures after grants, during trigger installation, and after token rotation leave no contract")

    apply(source)
    assert sql("select count(*) from pg_trigger where tgname like 'public_revision_%'") == "12"
    tokens = sql("select scope, revision from public.public_content_revisions order by scope")
    apply(source + "\nselect 1 / 0;\n", ok=False)
    assert sql("select scope, revision from public.public_content_revisions order by scope") == tokens
    assert sql("select count(*) from pg_trigger where tgname like 'public_revision_%'") == "12"
    assert sql("select has_function_privilege('anon','public.public_content_revision(text)','execute')") == "t"
    print("PASS failed reapplication retains all previous tokens and trigger/grant state")

    run(["psql", "-X", "-q", "-v", "ON_ERROR_STOP=1", "-d", db, "-f",
         str(root / "mobile-app/supabase/tests/batch_a/155_public_content_revisions.sql")])
    assert sql("select has_function_privilege('anon','public.public_content_revision(text)','execute')") == "t"
    # This SQL owns BEGIN/COMMIT; deliberately no --single-transaction here.
    run(["psql", "-X", "-q", "-v", "ON_ERROR_STOP=1", "-d", db, "-f", str(rollback)])
    assert sql("select count(*) from pg_trigger where tgname like 'public_revision_%'") == "0"
    assert sql("select scope, revision from public.public_content_revisions order by scope") == tokens
    assert sql("select has_function_privilege('anon','public.public_content_revision(text)','execute')") == "f"
    result = subprocess.run(["psql", "-X", "-At", "-v", "ON_ERROR_STOP=1", "-d", db,
                             "-c", "set role anon; select public.public_content_revision('blog');"],
                            env=env, text=True, capture_output=True)
    assert result.returncode != 0 and "permission denied" in result.stderr
    print("PASS SQL 155 and exact rollback: revision data retained; anon reader denied; all new triggers removed")
finally:
    run(["dropdb", db])
