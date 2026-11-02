#!/usr/bin/env python3
"""SEC-01 real database concurrency test; requires approved local harness setup.

Requires cx_tpl with migration 0156 already approved/applied. This script does
not apply migrations. It creates/drops only its own cx_* clone on a /tmp socket.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
import os
from pathlib import Path
import pwd
import subprocess
import tempfile
from threading import Barrier
import time
from uuid import UUID

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--socket", required=True, type=Path)
parser.add_argument("--port", required=True, type=int)
parser.add_argument("--token-only", action="store_true", help="Run only the new token settlement race; reuse prior cross-surface evidence")
args = parser.parse_args()
socket = args.socket.resolve()
if not socket.is_dir() or not str(socket).startswith("/tmp/"):
    raise SystemExit("Only an approved disposable /tmp Unix socket is supported")
with tempfile.NamedTemporaryFile(prefix="sec01-empty-pgpass-", dir=socket, delete=False) as empty:
    passfile = Path(empty.name)
env = {
    "PATH": "/usr/bin:/bin", "PGHOST": str(socket), "PGPORT": str(args.port),
    "PGUSER": pwd.getpwuid(os.getuid()).pw_name, "PGDATABASE": "postgres",
    "PGPASSFILE": str(passfile), "PGSERVICEFILE": "/dev/null", "PSQLRC": "/dev/null",
}
db = f"cx_sec01_concurrency_{os.getpid()}"


def run(command):
    return subprocess.run(command, env=env, text=True, capture_output=True, check=True)


def sql(statement):
    return run(["psql", "-X", "-w", "-At", "-v", "ON_ERROR_STOP=1", "-d", db, "-c", statement]).stdout.strip()


def race(first, second, *, conflict=True):
    barrier = Barrier(2)

    def write(statement):
        barrier.wait(timeout=10)
        return subprocess.run(
            ["psql", "-X", "-w", "-At", "-v", "ON_ERROR_STOP=1", "-v", "VERBOSITY=sqlstate",
             "-d", db, "-c", "begin; set local role service_role; set local application_name='sec01_concurrent_fixture'; " + statement + "; select pg_sleep(1); commit;"],
            env=env, text=True, capture_output=True, timeout=15,
        )

    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = [pool.submit(write, statement) for statement in (first, second)]
        observed_wait = False
        deadline = time.monotonic() + 5
        while time.monotonic() < deadline and not all(future.done() for future in futures):
            observed_wait = sql("select exists (select 1 from pg_stat_activity where application_name='sec01_concurrent_fixture' and wait_event_type='Lock')") == 't'
            if observed_wait:
                break
            time.sleep(0.02)
        results = [future.result() for future in futures]
    assert observed_wait, "Expected genuine overlapping transactions waiting on a database lock"
    assert sum(result.returncode == 0 for result in results) == (1 if conflict else 2), "Unexpected concurrent transaction outcome"
    if conflict:
        assert "23505" in next(result.stderr for result in results if result.returncode), "Expected binding uniqueness rejection"
    return results


run(["createdb", "-T", "cx_tpl", db])
try:
    assert sql("select to_regclass('public.razorpay_payment_bindings') is not null") == "t", "Approve/test migration 0156 first"
    atomic_wallet = sql("select to_regprocedure('public.settle_wallet_topup(uuid,uuid,text,text,bigint,text)') is not null") == "t"
    user = str(UUID(sql("select public.test_make_user('sec01-concurrency@example.invalid')")))
    if not args.token_only:
        wallet = sql(f"insert into public.wallet_topup_orders(user_id,amount,razorpay_order_id) values ('{user}',10,'order_concurrent_wallet') returning id")
        sql("insert into public.premium_plans(id,name) values ('sec01-race-plan','Fixture') on conflict do nothing")
        premium = sql(f"insert into public.premium_subscriptions(user_id,plan_id,billing_cycle,price,razorpay_order_id) values ('{user}','sec01-race-plan','monthly',10,'order_concurrent_premium') returning id")
        # psql emits INSERT's command tag after RETURNING; use the UUID line only.
        wallet, premium = str(UUID(wallet.splitlines()[0])), str(UUID(premium.splitlines()[0]))
        wallet_write = f"update public.wallet_topup_orders set status='paid',razorpay_payment_id='pay_concurrent_shared' where id='{wallet}'"
        if atomic_wallet:
            wallet_write = f"select public.settle_wallet_topup('{wallet}','{user}','order_concurrent_wallet','pay_concurrent_shared',1000,'INR')"
        premium_write = f"update public.premium_subscriptions set status='active',razorpay_payment_id='pay_concurrent_shared' where id='{premium}'"
        if sql("select to_regprocedure('public.activate_premium_subscription(uuid,uuid,text,text,text,text,bigint,text)') is not null") == 't':
            premium_write = f"select public.activate_premium_subscription('{premium}','{user}','order_concurrent_premium','pay_concurrent_shared','sec01-race-plan','monthly',1180,'INR')"
        race(
            wallet_write,
            premium_write,
        )
        assert sql("select count(*) from public.razorpay_payment_bindings where provider_payment_id='pay_concurrent_shared'") == "1"
        assert sql(f"select (select count(*) from public.wallet_topup_orders where id='{wallet}' and status='paid') + (select count(*) from public.premium_subscriptions where id='{premium}' and status='active')") == "1", "Only the winning service-role writer grants value"
        print("PASS cross-surface concurrent payment reuse: lock wait observed; one commit; rejected writer grants no value")

        wallet2 = str(UUID(sql(f"insert into public.wallet_topup_orders(user_id,amount) values ('{user}',10) returning id").splitlines()[0]))
        premium2 = str(UUID(sql(f"insert into public.premium_subscriptions(user_id) values ('{user}') returning id").splitlines()[0]))
        race(
            f"update public.wallet_topup_orders set razorpay_order_id='order_concurrent_shared' where id='{wallet2}'",
            f"update public.premium_subscriptions set razorpay_order_id='order_concurrent_shared' where id='{premium2}'",
        )
        assert sql("select count(*) from public.razorpay_order_bindings where provider_order_id='order_concurrent_shared'") == "1"
        print("PASS cross-surface concurrent provider-order reuse: lock wait observed; one immutable owner")

        wallet3 = str(UUID(sql(f"insert into public.wallet_topup_orders(user_id,amount,razorpay_order_id) values ('{user}',10,'order_same_pair_fixture') returning id").splitlines()[0]))
        statement = f"update public.wallet_topup_orders set status='paid',razorpay_payment_id='pay_same_pair_fixture' where id='{wallet3}' and razorpay_order_id='order_same_pair_fixture' and status<>'paid' returning id"
        if atomic_wallet:
            statement = f"select '{wallet3}' where not (public.settle_wallet_topup('{wallet3}','{user}','order_same_pair_fixture','pay_same_pair_fixture',1000,'INR')->>'alreadySettled')::boolean"
        results = race(statement, statement, conflict=False)
        assert sum(result.stdout.splitlines().count(wallet3) for result in results) == 1, "Only one conditional transition may return the order"
        assert sql("select count(*) from public.razorpay_payment_bindings where provider_payment_id='pay_same_pair_fixture'") == "1"
        print("PASS same-pair callback/webhook-style SQL race: lock wait observed; both commit; one state transition and claim")

    request = str(UUID(sql(f"""insert into public.custom_project_requests(user_id,title,project_type,
      project_level,platform,estimated_total,token_amount,service_scope,assessment_use,
      integrity_acknowledged_at,payment_order_id) values ('{user}','Concurrent token','personal',
      'standard','web',10000,3000,'custom_software','no',now(),'order_token_race') returning id""").splitlines()[0]))
    token = str(UUID(sql(f"""insert into public.custom_project_payments(request_id,user_id,project_type,
      amount,kind,razorpay_order_id) values ('{request}','{user}','personal',3000,'token',
      'order_token_race') returning id""").splitlines()[0]))
    statement = f"""update public.custom_project_payments set status='paid',razorpay_payment_id='pay_token_race'
      where id='{token}' and status in ('created','failed') returning id"""
    results = race(statement, statement, conflict=False)
    assert sum(result.stdout.splitlines().count(token) for result in results) == 1
    assert sql(f"select amount_paid=3000 and token_payment_status='paid' and payment_id='pay_token_race' from public.custom_project_requests where id='{request}'") == 't'
    assert sql(f"select count(*) from public.custom_project_request_history where request_id='{request}'") == '1'
    assert sql(f"select count(*) from public.custom_project_admin_inbox where request_id='{request}'") == '1'
    assert sql("select count(*) from public.razorpay_payment_bindings where provider_payment_id='pay_token_race'") == '1'
    print('PASS token callback/webhook race: real lock wait; one credit, claim, history and notification set')
finally:
    try:
        run(["dropdb", db])
    finally:
        passfile.unlink()
