#!/usr/bin/env python3
"""Run selected synthetic exercises in an existing, isolated MySQL 8.4 container.

No environment files, host database endpoints, migrations or Supabase access.
Each case gets a fresh disposable schema. Original CREATE TABLE statements are
retained: rewriting them as TEMPORARY changes MySQL INSERT SELECT semantics.
"""
import argparse
import hashlib
import json
import pathlib
import re
import subprocess
import uuid

ROOT = pathlib.Path(__file__).resolve().parents[2]
BASE = ROOT / 'website/content/dbms-sql'
DOCKER = ['docker', '--config', '/tmp/cx-dbms-docker-config', '--host', 'unix:///var/run/docker.sock']
LABEL = 'dbms-mysql-20261030'


def fingerprint(problems):
    return hashlib.sha256(json.dumps(problems, sort_keys=True).encode()).hexdigest()


def container_guard(container):
    if not re.fullmatch(r'cx-dbms-mysql84-[a-z0-9-]+', container):
        raise ValueError('Only a named disposable cx-dbms-mysql84-* fixture is allowed')
    template = ('{"running":{{.State.Running}},"memory":{{.HostConfig.Memory}},'
                '"network":{{json .HostConfig.NetworkMode}},"ports":{{json .HostConfig.PortBindings}},'
                '"binds":{{json .HostConfig.Binds}},"mounts":{{json .Mounts}},'
                '"label":{{json (index .Config.Labels "campusedux.fixture")}},'
                '"image":{{json .Config.Image}}}')
    result = subprocess.run(DOCKER + ['inspect', '--format', template, container],
                            text=True, capture_output=True, check=True, timeout=10)
    meta = json.loads(result.stdout)
    if (not meta['running'] or meta['network'] != 'none' or meta['ports'] or meta['binds']
            or meta['label'] != LABEL or not 0 < meta['memory'] <= 512 * 1024 * 1024
            or any(m['Type'] != 'volume' or m['Destination'] != '/var/lib/mysql' for m in meta['mounts'])
            or meta['image'] != 'public.ecr.aws/docker/library/mysql:8.4'):
        raise ValueError('Fixture isolation, image, label, volume or memory guard failed')
    return meta


def verify(container, topics, report_path):
    meta = container_guard(container)
    command = DOCKER + ['exec', '-i', container, 'mysql', '--no-defaults', '--protocol=socket',
                        '-uroot', '--batch', '--raw', '--default-character-set=utf8mb4']

    def execute(sql):
        return subprocess.run(command, input=sql, text=True, capture_output=True, timeout=20)

    def run(sql):
        result = execute(sql)
        result.check_returncode()
        return result.stdout.rstrip('\r\n')

    version = run('SELECT VERSION() AS engine;').splitlines()[-1]
    if not re.fullmatch(r'8\.4\.\d+', version):
        raise ValueError('Exact MySQL 8.4 release required; MariaDB is not equivalent')
    identity = run('SELECT @@skip_networking AS disabled, @@datadir AS location;').splitlines()[-1].split('\t')
    if identity != ['1', '/var/lib/mysql/']:
        raise ValueError('MySQL networking/data-directory guard failed')
    packages = []
    for slug in sorted(topics):
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', slug):
            raise ValueError('Invalid topic slug')
        package = json.loads((BASE / 'topics' / (slug + '.json')).read_text())
        if package['slug'] != slug:
            raise ValueError('Topic identity mismatch')
        packages.append(package)
    evidence, failures, results = {}, [], []
    for package in packages:
        cases_run = []
        for problem in package['coding_problems']:
            cases = [('case', number, case) for number, case in enumerate([
                {'seed_sql': problem['seed_sql'], 'expected': problem['expected']}, *problem['validation_cases']])]
            cases += [('negative_case', number, case) for number, case in enumerate(problem.get('negative_validation_cases', []))]
            for kind, number, case in cases:
                database = 'cx_fixture_' + uuid.uuid4().hex
                run('CREATE DATABASE ' + database + ' CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;')
                try:
                    seed = problem['seed_sql'] if kind == 'negative_case' else case['seed_sql']
                    check = case.get('check_sql', problem.get('check_sql', '')) if kind == 'case' else case['sql']
                    sql = 'USE ' + database + ';\n' + problem['schema_sql'] + '\n' + seed + '\n' + problem['solution_sql'] + '\n' + check
                    result = execute(sql)
                    actual = result.stdout.rstrip('\r\n')
                    error = re.search(r'ERROR (\d+)\b', result.stderr)
                    code = int(error[1]) if error else None
                    passed = (result.returncode != 0 and code in case['error_codes']) if kind == 'negative_case' else (
                        result.returncode == 0 and actual == case['expected'].rstrip('\r\n'))
                    record = {'problem': problem['slug'], kind: number, 'passed': passed}
                    if kind == 'negative_case':
                        record['error_code'] = code
                    cases_run.append(record)
                    if not passed:
                        failures.append({'topic': package['slug'], **record, 'actual': actual,
                                         'expected': case.get('expected'), 'error_code': code,
                                         'error': result.stderr.rstrip('\r\n')})
                finally:
                    run('DROP DATABASE ' + database + ';')
        if cases_run:
            evidence[package['slug']] = {'engine': 'MySQL ' + version,
                'scope': 'Synthetic original-schema fixtures in a network-disabled, memory-capped disposable local MySQL container; no provider or Supabase migration verification',
                'fingerprint': fingerprint(package['coding_problems']), 'cases': cases_run,
                'all_passed': all(case['passed'] for case in cases_run)}
            results.append({'topic': package['slug'], 'cases_passed': sum(case['passed'] for case in cases_run),
                            'cases_failed': sum(not case['passed'] for case in cases_run)})
    report = {'engine': 'MySQL ' + version,
              'scope': 'Disposable local MySQL fixture only; no application databases, migrations or environment files accessed',
              'container': container, 'network': meta['network'], 'memory_limit_bytes': meta['memory'],
              'original_schema_preserved': True, 'fixture_schemas_removed': True,
              'application_migrations_executed': 0, 'supabase_connections': 0,
              'results': results, 'failures': failures, 'evidence': evidence}
    report_path.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'engine': report['engine'], 'topics': len(results),
                      'passed': sum(row['cases_passed'] for row in results),
                      'failed': sum(row['cases_failed'] for row in results), 'report': str(report_path)}))
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--container', required=True)
    parser.add_argument('--topics', nargs='+', required=True)
    parser.add_argument('--report', type=pathlib.Path, required=True)
    args = parser.parse_args()
    report = verify(args.container, set(args.topics), args.report)
    raise SystemExit(bool(report['failures']))
