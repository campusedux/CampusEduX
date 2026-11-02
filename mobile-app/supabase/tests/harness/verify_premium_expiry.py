#!/usr/bin/env python3
"""SEC-06 lifecycle and real-clock checks on disposable local cx_tpl clones.

Build cx_tpl using the ordered harness first. Only a task-owned /tmp Unix
socket with TCP disabled is accepted. No inherited database credentials.
"""
import argparse
from contextlib import contextmanager
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import time
from uuid import UUID

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--socket', type=Path, required=True)
parser.add_argument('--port', type=int, required=True)
args = parser.parse_args()
socket = args.socket.resolve()
if not socket.is_dir() or not str(socket).startswith('/tmp/campusedux-sec06/'):
    raise SystemExit('Only the disposable SEC-06 /tmp socket is supported')
root = Path(__file__).resolve().parents[4]
source = (root / 'mobile-app/supabase/migrations/0160_premium_expiry_authorization.sql').read_text()
twin = (root / 'admin-panel/supabase/migrations/128_premium_expiry_authorization.sql').read_text()
undo = (root / 'mobile-app/supabase/rollbacks/0160_premium_expiry_authorization_rollback.sql').read_text()
assert source == twin, 'Migration twins differ'
with tempfile.NamedTemporaryFile(prefix='sec06-empty-pgpass-', dir=socket, delete=False) as empty:
    passfile = Path(empty.name)
env = {
    'PATH': '/usr/bin:/bin', 'LANG': 'C.UTF-8', 'PGHOST': str(socket),
    'PGPORT': str(args.port), 'PGUSER': 'postgres', 'PGDATABASE': 'postgres',
    'PGPASSFILE': str(passfile), 'PGSERVICEFILE': '/dev/null', 'PSQLRC': '/dev/null',
}


def command(argv, *, text=None, state=None):
    result = subprocess.run(argv, input=text, env=env, text=True, capture_output=True, timeout=60)
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

    def apply(self, statement, *, state=None):
        return command(self.psql + ['--single-transaction', '-f', '-'], text=statement, state=state)

    def snapshot(self):
        # Every financial row, replay claim and profile must remain untouched.
        return self.sql("""select md5(coalesce(jsonb_agg(r order by r::text)::text,'[]')) from (
          select jsonb_build_object('table','premium','row',to_jsonb(p)) r from public.premium_subscriptions p
          union all select jsonb_build_object('table','profiles','row',to_jsonb(p)) from public.profiles p
          union all select jsonb_build_object('table','claims','row',to_jsonb(p)) from public.razorpay_payment_bindings p
          union all select jsonb_build_object('table','purchases','row',to_jsonb(p)) from public.purchases p
          union all select jsonb_build_object('table','topups','row',to_jsonb(p)) from public.wallet_topup_orders p
          union all select jsonb_build_object('table','wallet','row',to_jsonb(p)) from public.wallet_transactions p
        ) records""")

    def settlement_contract(self):
        return self.sql("""select md5(jsonb_agg(jsonb_build_array(p.oid::regprocedure::text,
          pg_get_functiondef(p.oid),p.proacl) order by p.oid::regprocedure::text)::text)
          from pg_proc p join pg_namespace n on n.oid=p.pronamespace
          where n.nspname='public' and p.proname in ('activate_premium_subscription',
            'guard_premium_activation','premium_billing_period_end','settle_wallet_topup',
            'settle_project_purchase','guard_razorpay_binding','_claim_razorpay_binding',
            'guard_wallet_paid_terms','check_wallet_settlement_credit',
            'guard_purchase_settlement_terms','apply_purchase_settlement_effects',
            'check_purchase_settlement_debit')""")

    def seed(self, label, *, state='active', cycle='monthly'):
        uid = str(UUID(self.sql(f"select test_make_user('sec06-{label}@example.invalid')")))
        self.sql("insert into premium_plans(id,name) values('sec06-lifecycle','Fixture') on conflict do nothing")
        sub = str(UUID(self.sql(f"""insert into premium_subscriptions(user_id,plan_id,status,billing_cycle,started_at,current_period_end)
          values('{uid}','sec06-lifecycle','{state}','{cycle}',clock_timestamp()-interval '1 day',
            clock_timestamp()+interval '1 day') returning id""").splitlines()[0]))
        return uid, sub

    def entitled(self, uid):
        return self.sql(f"select test_as('{uid}'); select current_user_is_premium()") == 't'


counter = 0


@contextmanager
def clone():
    global counter
    counter += 1
    name = f'cx_sec06_{os.getpid()}_{counter}'
    command(['createdb', '-T', 'cx_tpl', name])
    try:
        yield Database(name)
    finally:
        command(['dropdb', name])


try:
    assert Database('postgres').sql("""select current_setting('listen_addresses')=''
      and current_setting('data_directory') like '/tmp/campusedux-sec06/%'
      and current_setting('server_encoding')='UTF8'""") == 't'
    print('PASS isolated UTF-8 socket-only PostgreSQL; twins byte-identical', flush=True)

    with clone() as db:
        # Reproduce the pre-fix definitions, without applying an old migration.
        old_helper = re.search(r'create or replace function public.current_user_is_premium\(\).*?\$\$;',
                              (root / 'mobile-app/supabase/migrations/0042_learning_management.sql').read_text(), re.S).group()
        old_sync = re.search(r'create or replace function public.sync_profile_is_premium\(\).*?\$\$;',
                            (root / 'mobile-app/supabase/migrations/0037_protect_is_premium.sql').read_text(), re.S).group()
        db.apply(old_helper + '\n' + old_sync + '\ndrop function public._has_valid_premium_subscription(uuid,timestamptz);')
        uid, sub = db.seed('legacy')
        db.sql(f"""alter table premium_subscriptions disable trigger z_sec05_premium_activation;
          update premium_subscriptions set started_at=null,current_period_end=null where id='{sub}';
          alter table premium_subscriptions enable trigger z_sec05_premium_activation;""")
        assert db.entitled(uid), 'Historical vulnerability was not reproduced'
        saved, contract = db.snapshot(), db.settlement_contract()
        db.apply(source + '\nselect 1/0;', state='22012')
        assert db.entitled(uid) and db.snapshot() == saved
        assert db.sql("select to_regprocedure('public._has_valid_premium_subscription(uuid,timestamptz)') is null") == 't'
        db.apply(source)
        assert not db.entitled(uid) and db.snapshot() == saved
        db.apply(twin)
        db.apply(source)
        assert not db.entitled(uid) and db.snapshot() == saved
        assert db.settlement_contract() == contract
        print('PASS stale/null-period bypass reproduced; failed install atomic; canonical/twin/reinstall deny without historical writes; SEC01..05 contracts unchanged', flush=True)

        valid_uid, _ = db.seed('rollback')
        assert db.entitled(valid_uid)
        saved = db.snapshot()
        db.apply(undo + '\nselect 1/0;', state='22012')
        assert db.entitled(valid_uid) and db.snapshot() == saved
        db.apply(undo)
        db.apply(undo)
        assert not db.entitled(valid_uid) and not db.entitled(uid)
        assert db.snapshot() == saved and db.settlement_contract() == contract
        db.apply(source)
        assert db.entitled(valid_uid) and not db.entitled(uid)
        assert db.snapshot() == saved and db.settlement_contract() == contract
        print('PASS failed/repeated rollback is fail-closed and row-preserving; reinstallation resumes only valid entitlement', flush=True)

    with clone() as db:
        uid, sub = db.seed('clock')
        db.sql("insert into prep_notes(title,is_premium,is_published,content) values('sec06-clock-note',true,true,'CLOCK-BODY')")
        # Extend enough for the prepared reader to start even on a slow host.
        db.sql(f"update premium_subscriptions set current_period_end=clock_timestamp()+interval '2 seconds' where id='{sub}'")
        saved = db.snapshot()
        process = subprocess.Popen(db.psql, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                   stderr=subprocess.PIPE, env=env, text=True)

        def read(statement):
            process.stdin.write(statement + "\nselect 'sec06_end';\n")
            process.stdin.flush()
            result = []
            while True:
                line = process.stdout.readline()
                if not line:
                    raise AssertionError('Prepared reader exited before its result')
                if line.strip() == 'sec06_end':
                    return result
                if line.strip():
                    result.append(line.strip())

        try:
            read(f"begin; select test_as('{uid}'); prepare entitlement as select current_user_is_premium(),(select count(*) from prep_notes where title='sec06-clock-note'),(prep_note_get((select id from prep_notes_public_list() where title='sec06-clock-note'))->>'locked')::boolean;")
            assert read('execute entitlement;') == ['t|1|f'], 'Clock fixture expired before initial read'
            deadline = time.monotonic() + 15
            while True:
                result = read('execute entitlement;')
                if result == ['f|0|t']:
                    break
                # A boundary may fall between the three independently checked
                # expressions. Subsequent reads must all deny, with no writes.
                assert time.monotonic() < deadline, 'Expiry did not close prepared read'
            assert read('execute entitlement;') == ['f|0|t']
            read('rollback;')
        finally:
            if process.poll() is None:
                process.stdin.write('\\q\n')
                process.stdin.flush()
            _, error = process.communicate(timeout=10)
            assert process.returncode == 0, error
        assert db.snapshot() == saved, 'Read-time authorization changed data'
        assert db.sql(f"select is_premium from profiles where id='{uid}'") == 't'
        print('PASS real clock crosses expiry inside one transaction/prepared plan: helper, RLS and RPC deny with stale=true, no writes and no sleeps', flush=True)

    with clone() as db:
        uid, sub = db.seed('invalid')
        # Existing schema rejects missing/unknown cycles and revoked vocabulary.
        db.sql(f"update premium_subscriptions set billing_cycle='weekly' where id='{sub}'", state='23514')
        db.sql(f"update premium_subscriptions set billing_cycle=null where id='{sub}'", state='23502')
        db.sql(f"update premium_subscriptions set status='revoked' where id='{sub}'", state='23514')
        # Future/legacy unsupported values are denied too, even if a future
        # schema widened those checks. These mutations exist only in this clone.
        checks = json.loads(db.sql("""select json_agg(conname) from pg_constraint
          where conrelid='public.premium_subscriptions'::regclass and contype='c'
          and (pg_get_constraintdef(oid) like '%billing_cycle%' or pg_get_constraintdef(oid) like '%status%')"""))
        for name in checks:
            db.sql('alter table premium_subscriptions drop constraint "' + name.replace('"', '""') + '"')
        db.sql('alter table premium_subscriptions disable trigger z_sec05_premium_activation')
        db.sql(f"update premium_subscriptions set billing_cycle='weekly' where id='{sub}'")
        assert not db.entitled(uid)
        db.sql(f"update premium_subscriptions set billing_cycle='monthly',status='revoked' where id='{sub}'")
        assert not db.entitled(uid)
        for role in ('anon', 'authenticated', 'service_role'):
            db.sql(f"set role {role}; select _has_valid_premium_subscription('{uid}',clock_timestamp())", state='42501')
        print('PASS invalid/null billing cycle and unsupported revoked state; private time/user predicate denies every API role', flush=True)
    print('PASS SEC06 lifecycle, controlled SQL boundaries and real-clock verification complete', flush=True)
finally:
    passfile.unlink()
