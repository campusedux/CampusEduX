#!/usr/bin/env python3
"""SEC-05 local SQL/lifecycle/concurrency verification on approved cx_tpl clones.

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
canonical = root / 'mobile-app/supabase/migrations/0159_atomic_premium_activation.sql'
twin = root / 'admin-panel/supabase/migrations/127_atomic_premium_activation.sql'
rollback = root / 'mobile-app/supabase/rollbacks/0159_atomic_premium_activation_rollback.sql'
assert canonical.read_bytes() == twin.read_bytes(), 'Migration twins differ'
source, undo = canonical.read_text(), rollback.read_text()
counter = 0

with tempfile.NamedTemporaryFile(prefix='sec05-empty-pgpass-', dir=socket, delete=False) as empty:
    passfile = Path(empty.name)
env = {
    'PATH': '/usr/bin:/bin', 'LANG': 'C.UTF-8', 'PGHOST': str(socket),
    'PGPORT': str(args.port), 'PGUSER': 'postgres',
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
          select jsonb_build_object('table','premium','row',to_jsonb(p)) r from public.premium_subscriptions p
          union all select jsonb_build_object('table','profiles','row',to_jsonb(p)) from public.profiles p
          union all select jsonb_build_object('table','claims','row',to_jsonb(b)) from public.razorpay_payment_bindings b
        ) records""")

    def seed(self, suffix, *, cycle='monthly'):
        user = str(UUID(self.sql(f"select public.test_make_user('sec05-{suffix}@example.invalid')")))
        self.sql("insert into public.premium_plans(id,name) values ('sec05-plan','Fixture') on conflict do nothing")
        sub = str(UUID(self.sql(f"insert into public.premium_subscriptions(user_id,plan_id,billing_cycle,price,razorpay_order_id) values ('{user}','sec05-plan','{cycle}',74.75,'order_{suffix}') returning id").splitlines()[0]))
        return user, sub

    def activate(self, user, sub, suffix, *, payment=None, cycle='monthly'):
        return f"select public.activate_premium_subscription('{sub}','{user}','order_{suffix}','{payment or 'pay_'+suffix}','sec05-plan','{cycle}',8821,'INR')"

    def assert_active(self, user, sub):
        assert self.sql(f"""select status='active' and started_at is not null and current_period_end is not null
          and isfinite(started_at) and isfinite(current_period_end)
          and current_period_end=public.premium_billing_period_end(started_at,billing_cycle)
          and (select is_premium from public.profiles where id='{user}')
          and (select count(*) from public.razorpay_payment_bindings where provider_payment_id=s.razorpay_payment_id)=1
          from public.premium_subscriptions s where id='{sub}'""") == 't'

    @contextmanager
    def hold(self, body, *, commit=False):
        process = subprocess.Popen(self.psql, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                   stderr=subprocess.PIPE, env=env, text=True)
        success = False
        try:
            process.stdin.write("begin; set local application_name='sec05_hold';\n" + body + "\nselect 'sec05_ready';\n")
            process.stdin.flush()
            while True:
                line = process.stdout.readline().strip()
                if line == 'sec05_ready':
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
                           "set local application_name='sec05_race'; " + statement +
                           "; select pg_sleep(0.8); commit;")
            return subprocess.run(self.psql + ['-c', transaction], env=env, text=True,
                                  capture_output=True, timeout=15)

        with ThreadPoolExecutor(max_workers=len(statements)) as pool:
            futures = [pool.submit(writer, statement) for statement in statements]
            observed_wait = False
            deadline = time.monotonic() + 8
            while time.monotonic() < deadline and not all(future.done() for future in futures):
                if self.sql("select exists(select 1 from pg_stat_activity where application_name='sec05_race' and wait_event_type='Lock')") == 't':
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
    name = f'cx_sec05_{os.getpid()}_{counter}'
    command(['createdb', '-T', 'cx_tpl', name])
    try:
        yield Database(name)
    finally:
        command(['dropdb', name])


try:
    check = Database('postgres')
    assert check.sql("select current_setting('listen_addresses')='' and current_setting('data_directory') like '/tmp/campusedux-sec05/%'") == 't'
    print('PASS isolated socket-only PostgreSQL confirmed', flush=True)

    with clone() as db:
        # Historical invalid/extended states are simulated only on this clone.
        db.apply("""drop trigger z_sec05_premium_activation on public.premium_subscriptions;
          drop function public.activate_premium_subscription(uuid,uuid,text,text,text,text,bigint,text);
          drop function public.guard_premium_activation();
          drop function public.premium_billing_period_end(timestamptz,text);""")
        user, legacy = db.seed('legacy_invalid')
        db.sql(f"update public.premium_subscriptions set status='active',razorpay_payment_id='pay_legacy_invalid' where id='{legacy}'")
        valid_user, valid = db.seed('legacy_valid')
        db.sql(f"update public.premium_subscriptions set status='active',razorpay_payment_id='pay_legacy_valid',started_at='2020-01-31 12:00+00',current_period_end='2020-06-01 12:00+00',auto_renew=false where id='{valid}'")
        baseline = db.signature()
        db.apply(source + '\nselect 1/0;', state='22012')
        assert db.signature() == baseline
        assert db.sql("select to_regprocedure('public.activate_premium_subscription(uuid,uuid,text,text,text,text,bigint,text)') is null") == 't'
        with db.hold('lock table public.premium_subscriptions in row exclusive mode;'):
            db.apply("set local lock_timeout='250ms';\n" + source, state='55P03')
        with db.hold(source, commit=True):
            assert db.sql('select count(*) from public.premium_subscriptions') == '2'
            db.sql("set lock_timeout='250ms'; update public.premium_subscriptions set auto_renew=false",state='55P03')
        db.apply(twin.read_text()); db.apply(source)
        assert db.signature() == baseline
        db.sql('set role service_role; ' + db.activate(user,legacy,'legacy_invalid'),state='23514')
        assert json.loads(db.sql('set role service_role; '+db.activate(valid_user,valid,'legacy_valid')))['alreadyActive'] is True
        assert db.signature() == baseline
        print('PASS failed install/lock timeout atomic; install/twin/reinstall leave legacy invalid and legitimate extended periods unchanged; invalid replay denied',flush=True)
        new_user, sub = db.seed('lifecycle')
        db.sql('set role service_role; '+db.activate(new_user,sub,'lifecycle')); db.assert_active(new_user,sub)
        saved=db.signature()
        db.apply(undo+'\nselect 1/0;',state='22012')
        assert db.sql("select has_function_privilege('service_role','public.activate_premium_subscription(uuid,uuid,text,text,text,text,bigint,text)','execute')")=='t'
        db.apply(undo);db.apply(undo)
        assert db.signature()==saved
        db.sql('set role service_role; '+db.activate(new_user,sub,'lifecycle'),state='42501')
        assert db.sql("select count(*) from pg_trigger where tgname='z_sec05_premium_activation'")=='1'
        db.apply(source)
        assert json.loads(db.sql('set role service_role; '+db.activate(new_user,sub,'lifecycle')))['alreadyActive'] is True
        assert db.signature()==saved
        print('PASS failed/repeated rollback pauses RPC; dates, claims, guards and all rows preserved; reinstall resumes unchanged',flush=True)

    with clone() as db:
        user,sub=db.seed('commit_failure');saved=db.signature()
        db.sql("""create function public.sec05_fixture_commit_failure() returns trigger language plpgsql as $$
          begin raise exception 'disposable COMMIT failure' using errcode='23514'; end $$;
          create constraint trigger sec05_fixture_commit_failure after update on public.premium_subscriptions
          deferrable initially deferred for each row execute function public.sec05_fixture_commit_failure();""")
        db.sql('begin; set local role service_role; '+db.activate(user,sub,'commit_failure')+'; commit;',state='23514')
        assert db.signature()==saved
        db.sql('drop trigger sec05_fixture_commit_failure on public.premium_subscriptions; drop function public.sec05_fixture_commit_failure();')
        db.sql('set role service_role; '+db.activate(user,sub,'commit_failure'));db.assert_active(user,sub)
        print('PASS genuine deferred COMMIT failure rolls back dates, activation, profile and claim; transient retry succeeds',flush=True)

    for cycle in ('monthly','yearly'):
        with clone() as db:
            suffix='duration_'+cycle;user,sub=db.seed(suffix,cycle=cycle)
            db.sql('set role service_role; '+db.activate(user,sub,suffix,cycle=cycle));db.assert_active(user,sub)
            saved=db.signature()
            for _ in range(3):
                assert json.loads(db.sql('set role service_role; '+db.activate(user,sub,suffix,cycle=cycle)))['alreadyActive'] is True
            assert db.signature()==saved
            print(f'PASS {cycle} real activation/replay: original UTC calendar semantics, no reset or extension',flush=True)

    for label,writers in (('callback_callback',2),('callback_webhook',2),('duplicate_webhooks',5)):
        with clone() as db:
            user,sub=db.seed(label)
            results=db.race([db.activate(user,sub,label)]*writers)
            replies=[json.loads(next(line for line in r.stdout.splitlines() if line.startswith('{'))) for r in results]
            assert sum(not r['alreadyActive'] for r in replies)==1
            assert len({(r['subscription']['started_at'],r['subscription']['current_period_end']) for r in replies})==1
            db.assert_active(user,sub)
            print(f'PASS genuine {label}: {writers} sessions, observed lock wait, one identical committed billing period',flush=True)

    # Ordered races prove delayed failure and transaction abort handling in both orders.
    for label in ('failed_webhook','abort_retry'):
        for activation_first in (True,False):
            with clone() as db:
                suffix=f'{label}_{activation_first}';user,sub=db.seed(suffix)
                activate=db.activate(user,sub,suffix)
                other=(f"update public.premium_subscriptions set status='expired',razorpay_payment_id='pay_failed' where id='{sub}' and status='pending'"
                       if label=='failed_webhook' else activate)
                with ThreadPoolExecutor(max_workers=1) as pool:
                    with db.hold('set local role service_role; '+(activate if activation_first else other)+';',commit=label!='abort_retry'):
                        def waiter():
                            return subprocess.run(db.psql+['-c',"set role service_role; set application_name='sec05_waiter'; "+(other if activation_first else activate)],env=env,text=True,capture_output=True,timeout=15)
                        future=pool.submit(waiter);observed=False;deadline=time.monotonic()+5
                        while time.monotonic()<deadline:
                            if db.sql("select exists(select 1 from pg_stat_activity where application_name='sec05_waiter' and wait_event_type='Lock')")=='t':
                                observed=True;break
                            time.sleep(0.02)
                        assert observed,'No competing writer lock observed'
                    result=future.result()
                assert result.returncode==0,result.stderr
                db.assert_active(user,sub)
                print(f'PASS genuine {label}, activation first={activation_first}: observed lock wait; bounded final activation',flush=True)

    with clone() as db:
        user,sub=db.seed('reuse_a');other_user,other=db.seed('reuse_b')
        results=db.race([db.activate(user,sub,'reuse_a',payment='pay_shared'),db.activate(other_user,other,'reuse_b',payment='pay_shared')],successes=1)
        assert '23505' in next(r.stderr for r in results if r.returncode)
        assert db.sql("select count(*) from public.premium_subscriptions where status='active'")=='1'
        assert db.sql("select count(*) from public.premium_subscriptions where status='pending' and started_at is null and current_period_end is null")=='1'
        assert db.sql("select count(*) from public.profiles where is_premium")=='1'
        print('PASS genuine two-premium payment reuse: one commit, one uniqueness rejection, no losing period/profile',flush=True)

    with clone() as db:
        user,sub=db.seed('cross_surface')
        purchase=str(UUID(db.sql(f"insert into public.projects(id,title) values ('sec05-project','Fixture'); insert into public.purchases(user_id,project_id,price,total_amount,razorpay_order_id) values ('{user}','sec05-project',10.01,10.01,'order_sec05_purchase') returning id").splitlines()[-1]))
        results=db.race([db.activate(user,sub,'cross_surface',payment='pay_cross_surface'),f"select public.settle_project_purchase('{purchase}','{user}','order_sec05_purchase','pay_cross_surface',1001,'INR')"],successes=1)
        assert '23505' in next(r.stderr for r in results if r.returncode)
        assert db.sql(f"select (select count(*) from public.premium_subscriptions where id='{sub}' and status='active')+(select count(*) from public.purchases where id='{purchase}' and status='success')")=='1'
        assert db.sql("select count(*) from public.razorpay_payment_bindings where provider_payment_id='pay_cross_surface'")=='1'
        print('PASS genuine cross-surface SEC-04/premium reuse: one commit, losing transaction grants no value',flush=True)

    with clone() as db:
        user,sub=db.seed('wrong_owner')
        results=db.race([db.activate(user,sub,'wrong_owner'),db.activate('00000000-0000-4000-8000-000000000001',sub,'wrong_owner')],successes=1)
        assert '23514' in next(r.stderr for r in results if r.returncode)
        db.assert_active(user,sub)
        print('PASS genuine correct/wrong owner race: one valid activation, denied writer grants nothing',flush=True)
    print('PASS 10 genuine PostgreSQL concurrency cases; lifecycle and transaction checks complete',flush=True)
finally:
    passfile.unlink()
