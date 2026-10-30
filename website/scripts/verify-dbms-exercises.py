#!/usr/bin/env python3
"""Execute authored examples only against an explicitly selected /tmp scratch socket.

Uses synthetic temporary inputs and any explicitly authored disposable lab
targets on that isolated server; never executes application migrations. MariaDB
results are compatibility evidence, never exact MySQL-provider verification.
"""
import argparse
import hashlib
import json
import pathlib
import re
import subprocess
import uuid

ROOT = pathlib.Path(__file__).resolve().parents[2]
BASE = ROOT/'website/content/dbms-sql'


def fingerprint(problems):
    return hashlib.sha256(json.dumps(problems, sort_keys=True).encode()).hexdigest()


def verify(socket, report_path=None, topics=None, user='ganeshp8545'):
    if not str(socket.resolve()).startswith('/tmp/cx-dbms-sql.'):
        raise ValueError('Only an isolated /tmp/cx-dbms-sql.* scratch socket is accepted')
    command = ['mysql','--no-defaults',f'--socket={socket}',f'--user={user}','--batch','--raw','--default-character-set=utf8mb4']
    def run(sql):
        result = subprocess.run(command, input=sql, text=True, capture_output=True, check=True, timeout=15)
        # Remove client line terminators, not meaningful spaces or empty TSV
        # cells. A final single-space string differs from an empty string.
        return result.stdout.rstrip('\r\n')
    version = run('SELECT VERSION() AS engine;').splitlines()[-1]
    if 'MariaDB' not in version:
        raise ValueError('This verification session was provisioned for the isolated MariaDB server')
    datadir = run('SELECT @@datadir AS location;').splitlines()[-1]
    if not str(pathlib.Path(datadir).resolve()).startswith('/tmp/cx-dbms-sql.'):
        raise ValueError('Only an isolated /tmp/cx-dbms-sql.* data directory is accepted')
    results = []
    failures = []
    evidence = {}
    def execute_case(problem, seed, check, raw_result=False):
        # Views and stored programs cannot reference temporary tables. Give
        # those native fixtures a unique disposable schema on this verified
        # scratch server; never turn an engine restriction into a lesson fix.
        native = re.search(r'\bCREATE\s+(?:OR\s+REPLACE\s+)?(?:VIEW|PROCEDURE|FUNCTION|TRIGGER)\b', problem['schema_sql']+'\n'+problem['solution_sql'], re.I)
        database = 'cx_fixture_' + uuid.uuid4().hex if native else 'cx_dbms_exercises'
        schema = problem['schema_sql'] if native else problem['schema_sql'].replace('CREATE TABLE ', 'CREATE TEMPORARY TABLE ')
        if native:
            run('CREATE DATABASE ' + database + ';')
        try:
            sql = 'USE '+database+';\n'+schema+'\n'+seed+'\n'+problem['solution_sql']+'\n'+check
            if raw_result:
                return subprocess.run(command, input=sql, text=True, capture_output=True, timeout=15)
            return run(sql)
        finally:
            if native:
                run('DROP DATABASE ' + database + ';')
    for path in sorted((BASE/'topics').glob('*.json')):
        package = json.loads(path.read_text())
        if topics and package['slug'] not in topics:
            continue
        problems = package['coding_problems']
        if not problems:
            continue
        cases_run = []
        for problem in problems:
            cases = [{'seed_sql':problem['seed_sql'],'expected':problem['expected']}, *problem['validation_cases']]
            for number, case in enumerate(cases):
                try:
                    output = execute_case(problem, case['seed_sql'], case.get('check_sql',problem.get('check_sql','')))
                except subprocess.CalledProcessError as error:
                    if report_path is None:
                        raise
                    failures.append({'topic':package['slug'],'problem':problem['slug'],'case':number,'error':error.stderr[-1800:]})
                    cases_run.append({'problem':problem['slug'],'case':number,'passed':False})
                    continue
                if output != case['expected'].rstrip('\r\n'):
                    if report_path is None:
                        raise AssertionError(f"{problem['slug']} case {number}: {output!r} != {case['expected']!r}")
                    failures.append({'topic':package['slug'],'problem':problem['slug'],'case':number,'actual':output,'expected':case['expected'].rstrip('\r\n')})
                    cases_run.append({'problem':problem['slug'],'case':number,'passed':False})
                    continue
                cases_run.append({'problem':problem['slug'],'case':number,'passed':True})
            # Recreate the valid state in a new session for each rejected write.
            # These checks execute only on the isolated scratch socket, never
            # as application migrations or production permission changes.
            for number, case in enumerate(problem.get('negative_validation_cases', [])):
                result = execute_case(problem, problem['seed_sql'], case['sql'], raw_result=True)
                code = re.search(r'ERROR (\d+)\b', result.stderr)
                if result.returncode == 0 or not code or int(code[1]) not in case['error_codes']:
                    if report_path is None:
                        raise AssertionError(f"{problem['slug']} rejection {number}: expected error codes {case['error_codes']}, got {int(code[1]) if code else 'none'}")
                    failures.append({'topic':package['slug'],'problem':problem['slug'],'negative_case':number,'actual_error_code':int(code[1]) if code else None,'expected_error_codes':case['error_codes']})
                    cases_run.append({'problem':problem['slug'],'negative_case':number,'passed':False})
                    continue
                cases_run.append({'problem':problem['slug'],'negative_case':number,'error_code':int(code[1]),'passed':True})
        proof={'engine':version,'scope':'MariaDB compatibility execution; exact MySQL 8.4/provider execution unverified','fingerprint':fingerprint(problems),'cases':cases_run,'all_passed':all(c['passed'] for c in cases_run)}
        evidence[package['slug']] = proof
        if report_path is None:
            package['sql_verification']=proof
            path.write_text(json.dumps(package,ensure_ascii=False,indent=2)+'\n')
        results.append({'topic':package['slug'],'cases_passed':sum(c['passed'] for c in cases_run),'cases_failed':sum(not c['passed'] for c in cases_run)})
    report={'engine':version,'scope':'Synthetic fixtures on network-disabled local MariaDB; not MySQL 8.4/provider or application migration verification','output_normalization':'Only trailing CR/LF removed; TSV cell spaces and tabs preserved','results':results,'failures':failures,'evidence':evidence,'application_migrations_executed':0}
    if report_path is not None:
        report_path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'engine':version,'packages':len(results),'cases_passed':sum(r['cases_passed'] for r in results),'cases_failed':sum(r['cases_failed'] for r in results),'report':str(report_path) if report_path else None,'application_migrations_executed':0}))
    return report


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--socket',required=True,type=pathlib.Path)
    parser.add_argument('--report',type=pathlib.Path,help='Save evidence separately without modifying lesson packages; collect all failures.')
    parser.add_argument('--topics',nargs='+',help='Only execute these topic slugs.')
    parser.add_argument('--user',default='ganeshp8545',help='Account on the disposable scratch server only.')
    args=parser.parse_args()
    report=verify(args.socket,args.report,set(args.topics) if args.topics else None,args.user)
    if report['failures']:
        raise SystemExit(1)
