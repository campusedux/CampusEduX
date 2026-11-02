#!/usr/bin/env python3
"""SEC-03 local SQL/lifecycle/concurrency verification on approved cx_tpl clones.

Use only a task-owned /tmp Unix socket, with TCP disabled. No inherited DB
settings, credentials, provider requests, remote changes or package installs.
Build cx_tpl with make_template.sh first. All owned clones are removed.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from contextlib import contextmanager
import json
import os
from pathlib import Path
import pwd
import shutil
import subprocess
import tempfile
from threading import Barrier
import time
from uuid import UUID

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--socket', required=True, type=Path)
parser.add_argument('--port', required=True, type=int)
args = parser.parse_args()
socket = args.socket.resolve()
if not socket.is_dir() or not str(socket).startswith('/tmp/'):
    raise SystemExit('Only the approved disposable /tmp socket is supported')
root = Path(__file__).resolve().parents[4]
harness = Path(__file__).resolve().parent
canonical = root / 'mobile-app/supabase/migrations/0157_atomic_wallet_settlement.sql'
twin = root / 'admin-panel/supabase/migrations/125_atomic_wallet_settlement.sql'
rollback = root / 'mobile-app/supabase/rollbacks/0157_atomic_wallet_settlement_rollback.sql'
assert canonical.read_bytes() == twin.read_bytes(), 'Migration twins differ'
source, undo = canonical.read_text(), rollback.read_text()
counter = 0

with tempfile.NamedTemporaryFile(prefix='sec03-empty-pgpass-', dir=socket, delete=False) as empty:
    passfile = Path(empty.name)
env = {
    'PATH': '/usr/bin:/bin', 'LANG': 'C.UTF-8', 'PGHOST': str(socket),
    'PGPORT': str(args.port), 'PGUSER': pwd.getpwuid(os.getuid()).pw_name,
    'PGDATABASE': 'postgres', 'PGPASSFILE': str(passfile),
    'PGSERVICEFILE': '/dev/null', 'PSQLRC': '/dev/null',
}


def command(argv, *, text=None, state=None):
    result = subprocess.run(argv, input=text, env=env, text=True, capture_output=True, timeout=45)
    if state:
        assert result.returncode != 0 and state in result.stderr, result.stderr
    elif result.returncode:
        raise AssertionError(result.stdout + result.stderr)
    return result.stdout.strip()


class Database:
    def __init__(self, name):
        self.name = name
        self.psql = ['psql', '-X', '-w', '-qAt', '-v', 'ON_ERROR_STOP=1',
                     '-v', 'VERBOSITY=sqlstate', '-d', name]

    def sql(self, statement, *, state=None):
        return command(self.psql + ['-c', statement], state=state)

    def apply(self, migration, *, state=None):
        return command(self.psql + ['--single-transaction', '-f', '-'], text=migration, state=state)

    def signature(self):
        # JSON excludes only the new nullable field to compare pre/post install.
        return self.sql("""select md5(coalesce(jsonb_agg(r order by r::text)::text,'[]')) from (
          select jsonb_build_object('table','orders','row',to_jsonb(o)) r from public.wallet_topup_orders o
          union all select jsonb_build_object('table','ledger','row',to_jsonb(c)-'topup_order_id') from public.wallet_transactions c
          union all select jsonb_build_object('table','claims','row',to_jsonb(b)) from public.razorpay_payment_bindings b
        ) records""")

    def seed(self, suffix):
        user = str(UUID(self.sql(f"select public.test_make_user('sec03-{suffix}@example.invalid')")))
        order = str(UUID(self.sql(f"insert into public.wallet_topup_orders(user_id,amount,razorpay_order_id) values ('{user}',10.01,'order_{suffix}') returning id").splitlines()[0]))
        return user, order

    def settle(self, user, order, suffix):
        return f"select public.settle_wallet_topup('{order}','{user}','order_{suffix}','pay_{suffix}',1001,'INR')"

    def assert_settled(self, user, order):
        assert self.sql(f"""select o.status='paid' and count(c.id)=1 and sum(c.amount)=10.01
          and bool_and(c.user_id=o.user_id and c.type='credit' and c.category='added_money')
          from public.wallet_topup_orders o join public.wallet_transactions c on c.topup_order_id=o.id
          where o.id='{order}' and o.user_id='{user}' group by o.id""") == 't'

    @contextmanager
    def hold(self, body, *, commit=False):
        process = subprocess.Popen(self.psql, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                   stderr=subprocess.PIPE, env=env, text=True)
        success = False
        try:
            process.stdin.write("begin; set local application_name='sec03_hold';\n" + body + "\nselect 'sec03_ready';\n")
            process.stdin.flush()
            while True:
                line = process.stdout.readline().strip()
                if line == 'sec03_ready':
                    break
                if not line:
                    raise AssertionError('Holding transaction failed before readiness')
            yield
            success = True
        finally:
            if process.poll() is None:
                process.stdin.write(('commit;' if success and commit else 'rollback;') + '\n\\q\n')
                process.stdin.flush()
            _, error = process.communicate(timeout=10)
            if success:
                assert process.returncode == 0, error

    def race(self, statements, *, successes=None):
        barrier = Barrier(len(statements))

        def writer(statement):
            barrier.wait(timeout=10)
            transaction = ("begin; set local role service_role; set local statement_timeout='10s'; "
                           "set local application_name='sec03_race'; " + statement +
                           "; select pg_sleep(0.8); commit;")
            return subprocess.run(self.psql + ['-c', transaction], env=env, text=True,
                                  capture_output=True, timeout=15)

        with ThreadPoolExecutor(max_workers=len(statements)) as pool:
            futures = [pool.submit(writer, statement) for statement in statements]
            observed_wait = False
            deadline = time.monotonic() + 8
            while time.monotonic() < deadline and not all(future.done() for future in futures):
                if self.sql("select exists(select 1 from pg_stat_activity where application_name='sec03_race' and wait_event_type='Lock')") == 't':
                    observed_wait = True
                    break
                time.sleep(0.02)
            results = [future.result() for future in futures]
        assert observed_wait, 'No genuine overlapping database lock wait observed'
        assert sum(r.returncode == 0 for r in results) == (len(statements) if successes is None else successes), [r.stderr for r in results]
        return results


@contextmanager
def clone():
    global counter
    counter += 1
    name = f'cx_sec03_{os.getpid()}_{counter}'
    command(['createdb', '-T', 'cx_tpl', name])
    try:
        yield Database(name)
    finally:
        command(['dropdb', name])


try:
    check = Database('postgres')
    assert check.sql("select current_setting('listen_addresses')='' and current_setting('data_directory') like '/tmp/%'") == 't'
    print('PASS local socket-only disposable PostgreSQL confirmed', flush=True)
    with tempfile.TemporaryDirectory(prefix='sec03-sql-') as stage:
        for name in ('144_wallet_withdrawal_requests.sql', '156_razorpay_order_binding.sql', '157_atomic_wallet_settlement.sql'):
            shutil.copyfile(harness.parent / 'batch_a' / name, Path(stage) / name)
        print(command(['bash', str(harness / 'run_tests.sh'), stage]), flush=True)

    with clone() as db:
        # Remove ONLY new objects in this disposable clone to model pre-0157.
        db.apply("""
          drop trigger sec03_wallet_order_credit on public.wallet_topup_orders;
          drop trigger b_sec03_wallet_paid_terms on public.wallet_topup_orders;
          drop trigger sec03_wallet_ledger_credit on public.wallet_transactions;
          drop function public.check_wallet_settlement_credit();
          drop function public.guard_wallet_paid_terms();
          drop function public.settle_wallet_topup(uuid,uuid,text,text,bigint,text);
          alter table public.wallet_transactions drop column topup_order_id;
        """)
        user, order = db.seed('legacy_missing')
        db.sql(f"update public.wallet_topup_orders set status='paid',razorpay_payment_id='pay_legacy_missing' where id='{order}'")
        # An equal-amount unlinked credit is ambiguous; installation must not
        # attach it, and a captured retry must not create a second credit.
        db.sql(f"insert into public.wallet_transactions(user_id,type,category,amount,description) values ('{user}','credit','added_money',10.01,'legacy ambiguous')")
        baseline = db.signature()
        db.apply(source + '\nselect 1/0;', state='22012')
        assert db.signature() == baseline
        assert db.sql("select to_regprocedure('public.settle_wallet_topup(uuid,uuid,text,text,bigint,text)') is null") == 't'
        assert db.sql("select count(*) from information_schema.columns where table_name='wallet_transactions' and column_name='topup_order_id'") == '0'
        print('PASS failed installation atomic; legacy financial rows and SEC-01 claims preserved', flush=True)
        with db.hold('lock table public.wallet_topup_orders in row exclusive mode;'):
            db.apply("set local lock_timeout='250ms';\n" + source, state='55P03')
        assert db.signature() == baseline
        assert db.sql("select to_regprocedure('public.settle_wallet_topup(uuid,uuid,text,text,bigint,text)') is null") == 't'
        with db.hold(source, commit=True):
            db.sql("set lock_timeout='250ms'; select count(*) from public.wallet_transactions", state='55P03')
        print('PASS install lock timeout atomic; installation blocks reads/writers under AccessExclusiveLock', flush=True)
        db.apply(twin.read_text())
        db.apply(source)
        assert db.signature() == baseline
        db.sql('set role service_role; ' + db.settle(user, order, 'legacy_missing'), state='23514')
        assert db.signature() == baseline
        assert db.sql('select count(*) from public.wallet_transactions where topup_order_id is not null') == '0'
        # Now represent a paid order with no credit whatsoever.
        db.sql("delete from public.wallet_transactions where description='legacy ambiguous'")
        missing_baseline = db.signature()
        db.sql('set role service_role; ' + db.settle(user, order, 'legacy_missing'), state='23514')
        assert db.signature() == missing_baseline
        print('PASS install/twin/reinstall idempotent; ambiguous and missing historical credits fail closed without repair', flush=True)

        new_user, new_order = db.seed('lifecycle_valid')
        db.sql('set role service_role; ' + db.settle(new_user, new_order, 'lifecycle_valid'))
        db.assert_settled(new_user, new_order)
        financial = db.signature()
        # Rollback is an intentional settlement pause, retaining all protections.
        db.apply(undo + '\nselect 1/0;', state='22012')
        assert db.sql("select has_function_privilege('service_role','public.settle_wallet_topup(uuid,uuid,text,text,bigint,text)','execute')") == 't'
        assert db.signature() == financial
        with db.hold(undo, commit=True):
            db.sql("set lock_timeout='250ms'; select count(*) from public.wallet_topup_orders", state='55P03')
        db.apply(undo)
        assert db.signature() == financial
        db.sql('set role service_role; ' + db.settle(new_user, new_order, 'lifecycle_valid'), state='42501')
        assert db.sql("select count(*) from pg_trigger where tgname in ('sec03_wallet_order_credit','sec03_wallet_ledger_credit','b_sec03_wallet_paid_terms')") == '3'
        db.apply(source)
        assert db.signature() == financial
        retry = json.loads(db.sql('set role service_role; ' + db.settle(new_user, new_order, 'lifecycle_valid')))
        assert retry['alreadySettled'] is True
        db.assert_settled(new_user, new_order)
        print('PASS rollback/repeated rollback pause admission, retain credits/links/constraints; reinstall resumes idempotently', flush=True)

    with clone() as db:
        user, order = db.seed('commit_failure')
        baseline = db.signature()
        db.sql(f"begin; set local role service_role; update public.wallet_topup_orders set status='paid',razorpay_payment_id='pay_commit_failure' where id='{order}'; commit;", state='23514')
        assert db.signature() == baseline
        db.sql("""create function public.sec03_fixture_commit_failure() returns trigger language plpgsql as $$
          begin raise exception 'disposable deferred commit failure' using errcode='23514'; end $$;
          create constraint trigger sec03_fixture_commit_failure after insert on public.wallet_transactions
          deferrable initially deferred for each row execute function public.sec03_fixture_commit_failure();""")
        db.sql('begin; set local role service_role; ' + db.settle(user, order, 'commit_failure') + '; commit;', state='23514')
        assert db.signature() == baseline
        db.sql('drop trigger sec03_fixture_commit_failure on public.wallet_transactions; drop function public.sec03_fixture_commit_failure();')
        reply = json.loads(db.sql('set role service_role; ' + db.settle(user, order, 'commit_failure')))
        assert reply['alreadySettled'] is False
        db.assert_settled(user, order)
        print('PASS genuine COMMIT failure rolls back paid state, credit and claim; subsequent retry settles once', flush=True)

    for label, writers in (('callback_callback', 2), ('callback_webhook', 2), ('multiple_callbacks', 5)):
        with clone() as db:
            user, order = db.seed(label)
            results = db.race([db.settle(user, order, label)] * writers)
            replies = [json.loads(next(line for line in r.stdout.splitlines() if line.startswith('{'))) for r in results]
            assert sum(not reply['alreadySettled'] for reply in replies) == 1
            db.assert_settled(user, order)
            print(f'PASS genuine {label} RPC race: {writers} sessions, lock wait observed, one new settlement/credit', flush=True)

    with clone() as db:
        user, order = db.seed('cross_surface')
        premium = str(UUID(db.sql(f"insert into public.premium_subscriptions(user_id,razorpay_order_id) values ('{user}','order_other_surface') returning id").splitlines()[0]))
        results = db.race([
            db.settle(user, order, 'cross_surface'),
            f"update public.premium_subscriptions set status='active',razorpay_payment_id='pay_cross_surface' where id='{premium}'",
        ], successes=1)
        assert '23505' in next(r.stderr for r in results if r.returncode)
        assert db.sql("select count(*) from public.razorpay_payment_bindings where provider_payment_id='pay_cross_surface'") == '1'
        assert db.sql(f"select (select count(*) from public.wallet_transactions where topup_order_id='{order}') + (select count(*) from public.premium_subscriptions where id='{premium}' and status='active')") == '1'
        print('PASS genuine cross-surface payment-reuse race: one commit; loser grants no value', flush=True)

    with clone() as db:
        user, order = db.seed('aborted_writer')
        with ThreadPoolExecutor(max_workers=1) as pool:
            with db.hold('set local role service_role; ' + db.settle(user, order, 'aborted_writer') + ';'):
                waiter = pool.submit(db.sql, "set role service_role; set application_name='sec03_abort_waiter'; " + db.settle(user, order, 'aborted_writer'))
                deadline = time.monotonic() + 5
                observed_wait = False
                while time.monotonic() < deadline:
                    if db.sql("select exists(select 1 from pg_stat_activity where application_name='sec03_abort_waiter' and wait_event_type='Lock')") == 't':
                        observed_wait = True
                        break
                    time.sleep(0.02)
                assert observed_wait, 'Retry did not wait for the failing transaction'
            reply = json.loads(waiter.result())
            assert reply['alreadySettled'] is False
        db.assert_settled(user, order)
        assert db.sql("select count(*) from public.razorpay_payment_bindings where provider_payment_id='pay_aborted_writer'") == '1'
        print('PASS genuine concurrent transaction abort/retry: one durable credit and binding', flush=True)
finally:
    passfile.unlink()
