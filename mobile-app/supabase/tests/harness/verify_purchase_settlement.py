#!/usr/bin/env python3
"""SEC-04 local SQL/lifecycle/concurrency verification on approved cx_tpl clones.

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
canonical = root / 'mobile-app/supabase/migrations/0158_atomic_purchase_settlement.sql'
twin = root / 'admin-panel/supabase/migrations/126_atomic_purchase_settlement.sql'
rollback = root / 'mobile-app/supabase/rollbacks/0158_atomic_purchase_settlement_rollback.sql'
assert canonical.read_bytes() == twin.read_bytes(), 'Migration twins differ'
source, undo = canonical.read_text(), rollback.read_text()
counter = 0

with tempfile.NamedTemporaryFile(prefix='sec04-empty-pgpass-', dir=socket, delete=False) as empty:
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
        return self.sql("""select md5(coalesce(jsonb_agg(r order by r::text)::text,'[]')) from (
          select jsonb_build_object('table','purchases','row',to_jsonb(p)) r from public.purchases p
          union all select jsonb_build_object('table','ledger','row',to_jsonb(w)-'purchase_id') from public.wallet_transactions w
          union all select jsonb_build_object('table','claims','row',to_jsonb(b)) from public.razorpay_payment_bindings b
          union all select jsonb_build_object('table','sales','row',jsonb_build_object('id',id,'sales',sales_count)) from public.projects
        ) records""")

    def seed(self, suffix, *, user=None, project=None, coupon=None):
        user = user or str(UUID(self.sql(f"select public.test_make_user('sec04-{suffix}@example.invalid')")))
        project = project or f'sec04-{suffix}'
        self.sql(f"insert into public.projects(id,title) values ('{project}','Fixture') on conflict do nothing")
        order = str(UUID(self.sql(f"insert into public.purchases(user_id,project_id,price,total_amount,razorpay_order_id,coupon_code) values ('{user}','{project}',10.01,10.01,'order_{suffix}',{repr(coupon) if coupon else 'null'}) returning id").splitlines()[0]))
        return user, order

    def settle(self, user, order, suffix, *, payment=None):
        return f"select public.settle_project_purchase('{order}','{user}','order_{suffix}','{payment or 'pay_'+suffix}',1001,'INR')"

    def assert_settled(self, user, order, *, status='success'):
        assert self.sql(f"""select p.status='{status}' and count(w.id)=1 and sum(w.amount)=10.01
          and bool_and(w.user_id=p.user_id and w.type='debit' and w.category='project_purchase')
          and (select sales_count from public.projects where id=p.project_id)=1
          from public.purchases p join public.wallet_transactions w on w.purchase_id=p.id
          where p.id='{order}' and p.user_id='{user}' group by p.id""") == 't'

    @contextmanager
    def hold(self, body, *, commit=False):
        process = subprocess.Popen(self.psql, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                   stderr=subprocess.PIPE, env=env, text=True)
        success = False
        try:
            process.stdin.write("begin; set local application_name='sec04_hold';\n" + body + "\nselect 'sec04_ready';\n")
            process.stdin.flush()
            while True:
                line = process.stdout.readline().strip()
                if line == 'sec04_ready':
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
                           "set local application_name='sec04_race'; " + statement +
                           "; select pg_sleep(0.8); commit;")
            return subprocess.run(self.psql + ['-c', transaction], env=env, text=True,
                                  capture_output=True, timeout=15)

        with ThreadPoolExecutor(max_workers=len(statements)) as pool:
            futures = [pool.submit(writer, statement) for statement in statements]
            observed_wait = False
            deadline = time.monotonic() + 8
            while time.monotonic() < deadline and not all(future.done() for future in futures):
                if self.sql("select exists(select 1 from pg_stat_activity where application_name='sec04_race' and wait_event_type='Lock')") == 't':
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
    name = f'cx_sec04_{os.getpid()}_{counter}'
    command(['createdb', '-T', 'cx_tpl', name])
    try:
        yield Database(name)
    finally:
        command(['dropdb', name])


try:
    check = Database('postgres')
    assert check.sql("select current_setting('listen_addresses')='' and current_setting('data_directory') like '/tmp/campusedux-sec04/%'") == 't'
    print('PASS isolated socket-only PostgreSQL confirmed', flush=True)

    with clone() as db:
        # Model pre-0158 ONLY in a disposable clone. Never alter old migrations.
        db.apply("""
          drop trigger sec04_purchase_debit on public.purchases;
          drop trigger sec04_ledger_debit on public.wallet_transactions;
          drop trigger b_sec04_purchase_terms on public.purchases;
          drop trigger c_sec04_purchase_effects on public.purchases;
          drop function public.settle_project_purchase(uuid,uuid,text,text,bigint,text);
          drop function public.check_purchase_settlement_debit();
          drop function public.apply_purchase_settlement_effects();
          drop function public.guard_purchase_settlement_terms();
          alter table public.wallet_transactions drop column purchase_id;
        """)
        user, order = db.seed('legacy')
        db.sql(f"update public.purchases set status='success',razorpay_payment_id='pay_legacy' where id='{order}'")
        db.sql(f"insert into public.wallet_transactions(user_id,type,category,amount,description) values ('{user}','debit','project_purchase',10.01,'ambiguous legacy spend')")
        baseline = db.signature()
        db.apply(source + '\nselect 1/0;', state='22012')
        assert db.signature() == baseline
        assert db.sql("select to_regprocedure('public.settle_project_purchase(uuid,uuid,text,text,bigint,text)') is null") == 't'
        with db.hold('lock table public.purchases in row exclusive mode;'):
            db.apply("set local lock_timeout='250ms';\n" + source, state='55P03')
        assert db.signature() == baseline
        with db.hold(source, commit=True):
            db.sql("set lock_timeout='250ms'; select count(*) from public.wallet_transactions", state='55P03')
        db.apply(twin.read_text())
        db.apply(source)
        assert db.signature() == baseline
        retry = json.loads(db.sql('set role service_role; ' + db.settle(user, order, 'legacy')))
        assert retry['alreadySettled'] is True
        assert db.signature() == baseline
        assert db.sql('select count(*) from public.wallet_transactions where purchase_id is not null') == '0'
        print('PASS failed install/lock timeout atomic; install/twin/reinstall preserve historical entitlement and ambiguous spend without backfill', flush=True)

        new_user, new_order = db.seed('lifecycle')
        db.sql('set role service_role; ' + db.settle(new_user, new_order, 'lifecycle'))
        db.assert_settled(new_user, new_order)
        financial = db.signature()
        db.apply(undo + '\nselect 1/0;', state='22012')
        assert db.sql("select has_function_privilege('service_role','public.settle_project_purchase(uuid,uuid,text,text,bigint,text)','execute')") == 't'
        with db.hold(undo, commit=True):
            db.sql("set lock_timeout='250ms'; select count(*) from public.purchases", state='55P03')
        db.apply(undo)
        assert db.signature() == financial
        db.sql('set role service_role; ' + db.settle(new_user, new_order, 'lifecycle'), state='42501')
        assert db.sql("select count(*) from pg_trigger where tgname in ('sec04_purchase_debit','sec04_ledger_debit','b_sec04_purchase_terms','c_sec04_purchase_effects')") == '4'
        db.apply(source)
        assert db.signature() == financial
        assert json.loads(db.sql('set role service_role; ' + db.settle(new_user, new_order, 'lifecycle')))['alreadySettled'] is True
        db.assert_settled(new_user, new_order)
        print('PASS failed/repeated rollback pauses RPC, retains all financial rows and safeguards; reinstall resumes', flush=True)

    with clone() as db:
        user, order = db.seed('commit_failure')
        baseline = db.signature()
        db.sql("""create function public.sec04_fixture_commit_failure() returns trigger language plpgsql as $$
          begin raise exception 'disposable COMMIT failure' using errcode='23514'; end $$;
          create constraint trigger sec04_fixture_commit_failure after insert on public.wallet_transactions
          deferrable initially deferred for each row execute function public.sec04_fixture_commit_failure();""")
        db.sql('begin; set local role service_role; ' + db.settle(user, order, 'commit_failure') + '; commit;', state='23514')
        assert db.signature() == baseline
        db.sql('drop trigger sec04_fixture_commit_failure on public.wallet_transactions; drop function public.sec04_fixture_commit_failure();')
        assert json.loads(db.sql('set role service_role; ' + db.settle(user, order, 'commit_failure')))['alreadySettled'] is False
        db.assert_settled(user, order)
        print('PASS genuine COMMIT failure rolls back entitlement, debit, sales and claim; retry succeeds once', flush=True)

    for label, writers in (('callback_callback',2),('callback_webhook',2),('repeated_webhooks',5)):
        with clone() as db:
            coupon='SEC04_'+label.upper()
            db.sql(f"insert into public.coupons(code) values ('{coupon}')")
            user, order = db.seed(label,coupon=coupon)
            referrer=str(UUID(db.sql(f"select public.test_make_user('referrer-{label}@example.invalid')")))
            referral=str(UUID(db.sql(f"insert into public.referrals(referrer_id,referred_user_id) values ('{referrer}','{user}') returning id").splitlines()[0]))
            results = db.race([db.settle(user, order, label)] * writers)
            replies = [json.loads(next(line for line in r.stdout.splitlines() if line.startswith('{'))) for r in results]
            assert sum(not reply['alreadySettled'] for reply in replies) == 1
            db.assert_settled(user, order)
            assert db.sql(f"select used_count from public.coupons where code='{coupon}'")=='1'
            assert db.sql(f"select count(*) from public.wallet_transactions where referral_id='{referral}' and category='referral_bonus'")=='1'
            assert db.sql(f"select count(*) from public.referral_earnings where referral_id='{referral}'")=='1'
            print(f'PASS genuine {label}: {writers} sessions, observed lock wait, one settlement/debit/sales increment', flush=True)

    # Exercise both orderings, with the second writer demonstrably blocked.
    for label in ('invalid_signature','failed_webhook','refund','abort_retry'):
        for first_settles in (True,False):
            with clone() as db:
                suffix=f'{label}_{first_settles}'
                user, order=db.seed(suffix)
                settle=db.settle(user,order,suffix)
                if label in ('invalid_signature','failed_webhook'):
                    other=f"update public.purchases set status='failed',failure_reason='fabricated failure' where id='{order}' and status in ('pending','failed')"
                elif label=='refund':
                    other=f"update public.purchases set status='refunded' where id='{order}'"
                else:
                    other=settle
                with ThreadPoolExecutor(max_workers=1) as pool:
                    with db.hold('set local role service_role; '+(settle if first_settles else other)+';',commit=label!='abort_retry'):
                        def waiter():
                            return subprocess.run(db.psql+['-c',"set role service_role; set application_name='sec04_waiter'; "+(other if first_settles else settle)],env=env,text=True,capture_output=True,timeout=15)
                        future=pool.submit(waiter)
                        deadline=time.monotonic()+5
                        observed=False
                        while time.monotonic()<deadline:
                            if db.sql("select exists(select 1 from pg_stat_activity where application_name='sec04_waiter' and wait_event_type='Lock')")=='t':
                                observed=True;break
                            time.sleep(0.02)
                        assert observed,'No blocked competing writer observed'
                    result=future.result()
                if label=='refund':
                    if first_settles:
                        assert result.returncode==0,result.stderr
                        db.assert_settled(user,order,status='refunded')
                    else:
                        assert result.returncode!=0 and '23514' in result.stderr,result.stderr
                        assert db.sql(f"select status from public.purchases where id='{order}'")=='refunded'
                        assert db.sql('select count(*) from public.wallet_transactions where purchase_id is not null')=='0'
                else:
                    assert result.returncode==0,result.stderr
                    db.assert_settled(user,order)
                print(f'PASS genuine {label} race, settlement first={first_settles}: observed lock wait and correct final financial state',flush=True)

    with clone() as db:
        user,order=db.seed('cross_surface')
        premium=str(UUID(db.sql(f"insert into public.premium_subscriptions(user_id,razorpay_order_id) values ('{user}','order_other_surface') returning id").splitlines()[0]))
        results=db.race([db.settle(user,order,'cross_surface'),f"update public.premium_subscriptions set status='active',razorpay_payment_id='pay_cross_surface' where id='{premium}'"],successes=1)
        assert '23505' in next(r.stderr for r in results if r.returncode)
        assert db.sql("select count(*) from public.razorpay_payment_bindings where provider_payment_id='pay_cross_surface'")=='1'
        assert db.sql(f"select (select count(*) from public.wallet_transactions where purchase_id='{order}')+(select count(*) from public.premium_subscriptions where id='{premium}' and status='active')")=='1'
        print('PASS genuine cross-surface reuse: one commit; losing transaction grants no value',flush=True)

    with clone() as db:
        user,order=db.seed('same_entitlement_a',project='sec04-shared-entitlement')
        _,other=db.seed('same_entitlement_b',user=user,project='sec04-shared-entitlement')
        results=db.race([db.settle(user,order,'same_entitlement_a'),db.settle(user,other,'same_entitlement_b')],successes=1)
        assert '23505' in next(r.stderr for r in results if r.returncode)
        assert db.sql("select count(*) from public.wallet_transactions where purchase_id is not null")=='1'
        assert db.sql("select sales_count from public.projects where id='sec04-shared-entitlement'")=='1'
        print('PASS genuine two-order same-entitlement race: existing unique ownership rule permits one settlement',flush=True)
finally:
    passfile.unlink()
