#!/usr/bin/env python3
"""SEC-01 install/rollback/conflict/lock tests on task-owned local cx_* clones only.

Requires an approved cx_tpl built with the repository's ordered SQL harness.
No remote connections, inherited connection settings, credentials or payments.
"""
import argparse
from contextlib import contextmanager
import os
from pathlib import Path
import pwd
import subprocess
import tempfile
from uuid import UUID

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--socket", required=True, type=Path)
parser.add_argument("--port", required=True, type=int)
args = parser.parse_args()
socket = args.socket.resolve()
if not socket.is_dir() or not str(socket).startswith("/tmp/"):
    raise SystemExit("Only an approved disposable /tmp Unix socket is supported")
with tempfile.NamedTemporaryFile(prefix="sec01-lifecycle-empty-", dir=socket, delete=False) as empty:
    passfile = Path(empty.name)
env = {
    "PATH": "/usr/bin:/bin", "PGHOST": str(socket), "PGPORT": str(args.port),
    "PGUSER": pwd.getpwuid(os.getuid()).pw_name, "PGDATABASE": "postgres",
    "PGPASSFILE": str(passfile), "PGSERVICEFILE": "/dev/null", "PSQLRC": "/dev/null",
}
root = Path(__file__).resolve().parents[4]
canonical = root / "mobile-app/supabase/migrations/0156_razorpay_order_binding.sql"
twin = root / "admin-panel/supabase/migrations/124_razorpay_order_binding.sql"
rollback = root / "mobile-app/supabase/rollbacks/0156_razorpay_order_binding_rollback.sql"
source, undo = canonical.read_text(), rollback.read_text()
assert canonical.read_bytes() == twin.read_bytes(), "Migration twins differ"
tables = ("purchases", "wallet_topup_orders", "premium_subscriptions", "custom_project_requests", "custom_project_payments")
clone_number = 0


def command(argv, *, text=None, state=None):
    result = subprocess.run(argv, input=text, env=env, text=True, capture_output=True, timeout=30)
    if state:
        assert result.returncode != 0 and state in result.stderr, result.stderr
    elif result.returncode:
        raise AssertionError(result.stderr)
    return result.stdout.strip()


class Database:
    def __init__(self, name):
        self.name = name
        self.psql = ["psql", "-X", "-w", "-qAt", "-v", "ON_ERROR_STOP=1", "-v", "VERBOSITY=sqlstate", "-d", name]

    def sql(self, statement, *, state=None):
        return command(self.psql + ["-c", statement], state=state)

    def apply(self, migration, *, state=None):
        return command(self.psql + ["--single-transaction", "-f", "-"], text=migration, state=state)

    def fresh_contract(self):
        self.apply(undo)
        # Only this disposable clone's new SEC-01 claim tables are removed to
        # model the pre-0156 catalog. Production rollback deliberately keeps them.
        self.sql("drop table public.razorpay_payment_bindings; drop table public.razorpay_order_bindings;")
        self.absent()

    def absent(self):
        assert self.sql("select to_regclass('public.razorpay_order_bindings') is null and to_regclass('public.razorpay_payment_bindings') is null") == "t"
        assert self.sql("select count(*) from pg_trigger where tgname='a_sec01_razorpay_binding'") == "0"
        assert self.sql("select to_regprocedure('public.guard_razorpay_binding()') is null and to_regprocedure('public._claim_razorpay_binding(text,uuid,text,text)') is null") == "t"

    def installed(self):
        assert self.sql("select count(*) from pg_trigger where tgname='a_sec01_razorpay_binding'") == "5"
        assert self.sql("select count(*) from pg_indexes where indexname in ('purchases_sec01_payment_idx','wallet_sec01_payment_idx','premium_sec01_payment_idx','custom_request_sec01_payment_idx','custom_payment_sec01_payment_idx')") == "5"

    def signature(self, names=tables):
        union = " union all ".join(f"select jsonb_build_object('table','{table}','row',to_jsonb(t)) as row from public.{table} t" for table in names)
        return self.sql("select md5(coalesce(jsonb_agg(row order by row::text)::text,'[]')) from (" + union + ") rows")

    def seed(self):
        user = str(UUID(self.sql("select public.test_make_user('sec01-lifecycle@example.invalid')")))
        self.sql(f"""
          insert into public.projects(id,title) values ('sec01-lifecycle-project','Fixture');
          insert into public.purchases(user_id,project_id,razorpay_order_id)
            values ('{user}','sec01-lifecycle-project','order_lifecycle_purchase');
          insert into public.wallet_topup_orders(user_id,amount,status,razorpay_order_id,razorpay_payment_id)
            values ('{user}',10,'paid','order_lifecycle_wallet','pay_lifecycle_wallet'),('{user}',100000,'created',null,null);
          -- SEC-03's deferred invariant requires a credit in the same fixture
          -- transaction. Retain compatibility with the pre-0157 template too.
          do $fixture$ begin
            if exists (select 1 from information_schema.columns where table_schema='public'
                and table_name='wallet_transactions' and column_name='topup_order_id') then
              execute 'insert into public.wallet_transactions(user_id,type,category,amount,description,topup_order_id)
                select user_id,''credit'',''added_money'',amount,''Fixture'',id
                from public.wallet_topup_orders where razorpay_order_id=''order_lifecycle_wallet''';
            end if;
          end $fixture$;
          insert into public.premium_subscriptions(user_id,razorpay_order_id)
            values ('{user}','order_lifecycle_premium');
          with request as (
            insert into public.custom_project_requests(user_id,title,project_type,project_level,platform,
              service_scope,assessment_use,integrity_acknowledged_at,payment_order_id)
            values ('{user}','Fixture','personal','standard','web','custom_software','no',now(),'order_lifecycle_token') returning id
          ) insert into public.custom_project_payments(request_id,user_id,project_type,kind,amount,razorpay_order_id)
            select id,'{user}','personal','token',10,'order_lifecycle_token' from request;
        """)
        return user

    @contextmanager
    def hold(self, body, *, commit=False):
        process = subprocess.Popen(self.psql, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env, text=True)
        success = False
        try:
            process.stdin.write("begin; set local application_name='sec01_lifecycle_hold';\n" + body + "\nselect 'sec01_ready';\n")
            process.stdin.flush()
            assert process.stdout.readline().strip() == "sec01_ready", "Holding session failed before readiness"
            yield
            success = True
        finally:
            if process.poll() is None:
                process.stdin.write(("commit;" if success and commit else "rollback;") + "\n\\q\n")
                process.stdin.flush()
            _, error = process.communicate(timeout=10)
            if success:
                assert process.returncode == 0, error

    def held_locks(self, mode):
        relations = ",".join(f"'public.{table}'::regclass" for table in tables)
        return self.sql(f"select count(distinct relation) from pg_locks where granted and mode='{mode}' and relation in ({relations}) and pid in (select pid from pg_stat_activity where application_name='sec01_lifecycle_hold')")


@contextmanager
def clone():
    global clone_number
    clone_number += 1
    name = f"cx_sec01_lifecycle_{os.getpid()}_{clone_number}"
    command(["createdb", "-T", "cx_tpl", name])
    try:
        yield Database(name)
    finally:
        command(["dropdb", name])


try:
    with clone() as db:
        db.fresh_contract()
        db.seed()
        baseline = db.signature()
        db.apply(source + "\nselect 1/0;\n", state="22012")
        db.absent()
        assert db.signature() == baseline
        print("PASS failed fresh install is atomic; financial rows/timestamps unchanged")

        with db.hold("lock table public.wallet_topup_orders in row exclusive mode;"):
            db.apply("set local lock_timeout='250ms';\n" + source, state="55P03")
        db.absent()
        assert db.signature() == baseline
        print("PASS existing writer blocks installation; lock timeout leaves no partial contract")

        with db.hold(source, commit=True):
            assert db.held_locks("ShareRowExclusiveLock") == "5"
            for table in tables:
                db.sql(f"select count(*) from public.{table}")
                db.sql(f"set lock_timeout='250ms'; update public.{table} set status=status where false", state="55P03")
        db.installed()
        assert db.signature() == baseline
        assert db.sql("select count(*) from public.razorpay_order_bindings") == "4"
        assert db.sql("select count(*) from public.razorpay_payment_bindings") == "1"
        print("PASS fresh install/backfill preserves valid legacy/null rows; all five tables allow reads and block writers during install")

        claims = db.signature(("razorpay_order_bindings", "razorpay_payment_bindings"))
        db.apply(twin.read_text())
        db.apply(source)
        assert db.signature() == baseline
        assert db.signature(("razorpay_order_bindings", "razorpay_payment_bindings")) == claims
        print("PASS admin twin and canonical reapplication are idempotent")

        db.apply(undo + "\nselect 1/0;\n", state="22012")
        db.installed()
        assert db.signature(("razorpay_order_bindings", "razorpay_payment_bindings")) == claims
        print("PASS injected rollback failure restores triggers/indexes/functions and preserves claims")

        with db.hold(undo, commit=True):
            assert db.held_locks("AccessExclusiveLock") == "5"
            db.sql("set lock_timeout='250ms'; select count(*) from public.wallet_topup_orders", state="55P03")
        assert db.sql("select count(*) from pg_trigger where tgname='a_sec01_razorpay_binding'") == "0"
        assert db.sql("select to_regprocedure('public.guard_razorpay_binding()') is null and to_regprocedure('public._claim_razorpay_binding(text,uuid,text,text)') is null") == "t"
        assert db.sql("select count(*) from pg_indexes where indexname in ('purchases_sec01_payment_idx','wallet_sec01_payment_idx','premium_sec01_payment_idx','custom_request_sec01_payment_idx','custom_payment_sec01_payment_idx')") == "0"
        assert db.signature() == baseline
        assert db.signature(("razorpay_order_bindings", "razorpay_payment_bindings")) == claims
        assert db.sql("select not has_table_privilege('service_role','public.razorpay_payment_bindings','insert') and not has_table_privilege('anon','public.razorpay_order_bindings','select')") == "t"
        db.apply(undo)
        db.apply(source)
        db.apply(twin.read_text())
        db.installed()
        assert db.signature() == baseline
        assert db.signature(("razorpay_order_bindings", "razorpay_payment_bindings")) == claims
        command(db.psql + ["-f", str(root / "mobile-app/supabase/tests/batch_a/156_razorpay_order_binding.sql")])
        print("PASS exact rollback preserves protected replay tombstones/data; rollback blocks reads/writes; reinstall and SQL 156 pass")

    conflicts = {
        "duplicate provider order across surfaces": ("23505", "insert into public.premium_subscriptions(user_id,razorpay_order_id) values ('{user}','order_lifecycle_wallet')"),
        "payment reused across surfaces": ("23505", "insert into public.premium_subscriptions(user_id,razorpay_order_id,razorpay_payment_id) values ('{user}','order_conflicting_payment','pay_lifecycle_wallet')"),
        "unbound payment identifier": ("23514", "insert into public.wallet_topup_orders(user_id,amount,razorpay_payment_id) values ('{user}',10,'pay_unbound_fixture')"),
        "blank provider order": ("23514", "insert into public.wallet_topup_orders(user_id,amount,razorpay_order_id) values ('{user}',10,'   ')"),
        "blank provider payment": ("23514", "insert into public.wallet_topup_orders(user_id,amount,razorpay_order_id,razorpay_payment_id) values ('{user}',10,'order_blank_payment','   ')"),
        "inconsistent token mirror": ("23505", "update public.custom_project_payments set razorpay_order_id='order_wrong_mirror' where razorpay_order_id='order_lifecycle_token'"),
    }
    for name, (state, fixture) in conflicts.items():
        with clone() as db:
            db.fresh_contract()
            user = db.seed()
            db.sql(fixture.format(user=user))
            baseline = db.signature()
            db.apply(source, state=state)
            db.absent()
            assert db.signature() == baseline
            print(f"PASS legacy conflict rejected atomically: {name} ({state}); no auto-repair")
finally:
    passfile.unlink()
