#!/usr/bin/env python3
"""Audit DBMS drafts; --prepare saves a candidate outside migration directories.

Never connects to a database, reads environment files, changes checkpoints, or
overwrites a migration. Recorded SQL evidence is checked, never re-executed.
"""
import argparse
import hashlib
import importlib.util
import json
import pathlib
import re
import sys

sys.dont_write_bytecode = True
ROOT = pathlib.Path(__file__).resolve().parents[2]
BASE = ROOT / 'website/content/dbms-sql'
spec = importlib.util.spec_from_file_location('dbms_build', ROOT / 'website/scripts/build-dbms-sql-content.py')
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)

SNAPSHOTS = (
    'mobile-app/supabase/migrations/0151_dbms_sql_content_rewrite_batch01.sql',
    'admin-panel/supabase/migrations/121_dbms_sql_content_rewrite_batch01.sql',
)
# Frozen pre-integration checkpoint, not a hash regenerated from current drafts.
SNAPSHOT_BODY_SHA256 = 'd1c35b87d348e664ddbfe8bd46f6187f073b53d4b5b67ef8fb86cbc44b8c504e'
CANDIDATE = BASE / 'integration/pending-drafts.sql'
READINESS = BASE / 'integration/readiness.json'


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()


def review_fingerprint(package):
    # Exclude workflow metadata so recording a review cannot invalidate itself.
    fields = ['slug', 'title', 'description', 'notes', 'tests', 'original_questions',
              'coding_problems', 'coding_not_applicable', 'diagrams', 'references']
    return digest(json.dumps({key: package.get(key) for key in fields}, sort_keys=True))


def reviewed(package):
    review = package.get('review', {})
    return review.get('independent_review') == 'passed' and (
        not review.get('content_sha256') or review['content_sha256'] == review_fingerprint(package))


def snapshot_inventory(root=ROOT):
    bodies = [(root / name).read_text().split('-- BODY\n', 1)[1] for name in SNAPSHOTS]
    if bodies[0] != bodies[1] or digest(bodies[0]) != SNAPSHOT_BODY_SHA256:
        raise ValueError('Preserved migration drift: twins or frozen snapshot hash differ')
    inner = bodies[0].split('do $dbms_rewrite$', 1)[1].rsplit('$dbms_rewrite$', 1)[0]
    masked, literals = build.audit.mask_literals(inner)
    refs = [literals[int(match[1])] for match in re.finditer(
        r'select t.id into strict topic_uuid[^;]*t.source_ref\s*=\s*@(\d+)@', masked)]
    if len(refs) != 148 or len(set(refs)) != len(refs):
        raise ValueError('Unexpected preserved snapshot inventory')
    coverage = {}
    section = None
    for statement in masked.split(';'):
        match = re.search(r'select s.id into strict section_uuid[^;]*lower\(s.slug\)\s*=\s*@(\d+)@', statement)
        if match:
            section = literals[int(match[1])]
        match = re.search(r'insert into public.learning_topics\s*\((.*?)\)\s*select\s+(.*?)\s+from public.learning_sections\b', statement, re.S)
        if match:
            row = {col.strip(): build.audit.value(expr, literals) for col, expr in
                   zip(match[1].split(','), build.audit.split_fields(match[2]))}
            coverage[row['source_ref']] = {'id': row['id'], 'slug': row['slug'], 'section_slug': section}
    return set(refs), coverage


def snapshot_refs(root=ROOT):
    return snapshot_inventory(root)[0]


def verify_prior_coverage(packages, coverage):
    for package in packages:
        current = {'id': package['integration']['new_topic_id'], 'slug': package['slug'],
                   'section_slug': package['section_slug']}
        if coverage.get(package['source_ref']) != current:
            raise ValueError('Prior coverage identity changed: ' + package['slug'])


def case_keys(proof):
    return {(case['problem'], 'negative' if 'negative_case' in case else 'positive',
             case.get('negative_case', case.get('case'))) for case in proof.get('cases', [])}


def sql_evidence(package, reports):
    problems = package['coding_problems']
    if not problems:
        return {'status': 'not-applicable', 'reason': package['coding_not_applicable']}
    fingerprint = digest(json.dumps(problems, sort_keys=True))
    expected = {(problem['slug'], kind, number) for problem in problems
                for kind, count in [('positive', 1 + len(problem['validation_cases'])),
                                    ('negative', len(problem.get('negative_validation_cases', [])))]
                for number in range(count)}
    matches = []
    for name, report in reports:
        proof = report.get('evidence', {}).get(package['slug'], {})
        if proof.get('fingerprint') == fingerprint:
            engine = proof.get('engine', '')
            kind = 'mysql-8.4' if re.fullmatch(r'MySQL 8\.4\.\d+', engine) else 'mariadb' if 'MariaDB' in engine else 'unsupported'
            complete = case_keys(proof) == expected and len(proof.get('cases', [])) == len(expected)
            passed = kind != 'unsupported' and complete and proof.get('all_passed') is True and all(c['passed'] for c in proof['cases'])
            matches.append({'report': name, 'engine': engine, 'engine_kind': kind, 'passed': passed,
                            'cases': len(proof.get('cases', [])),
                            'failed_cases': sum(not c['passed'] for c in proof.get('cases', []))})
    passed = next((match for match in reversed(matches) if match['passed'] and match['engine_kind'] == 'mysql-8.4'), None)
    passed = passed or next((match for match in reversed(matches) if match['passed']), None)
    return {'status': 'recorded-compatible' if passed else 'recorded-failure' if matches else 'unverified',
            'fingerprint': fingerprint, 'expected_cases': len(expected),
            'evidence': passed or (matches[-1] if matches else None),
            'target_mysql_verified': bool(passed and passed['engine_kind'] == 'mysql-8.4'),
            'scope': 'Fingerprint-matched recorded fixture evidence; this audit executes no SQL. Hosted provider and Supabase compatibility remain unverified.'}


def prepare():
    refs, coverage = snapshot_inventory()
    packages = [json.loads(path.read_text()) for path in sorted((BASE / 'topics').glob('*.json'))]
    originals = build.source_notes()
    rows = json.loads((BASE / 'progress.json').read_text())
    inventory = {row['slug']: row['source_ref'] for row in rows['topics'] + rows['coverage_topics']}
    if len({p['source_ref'] for p in packages}) != len(packages) or len({p['slug'] for p in packages}) != len(packages):
        raise ValueError('Duplicate authored identity')
    if not refs.issubset({p['source_ref'] for p in packages}):
        raise ValueError('Missing preserved package')
    for package in packages:
        build.validate(package)
        if inventory.get(package['slug']) != package['source_ref']:
            raise ValueError('Inventory identity mismatch: ' + package['slug'])
        if not package.get('new_coverage') and digest(originals[package['source_ref']]) != package['integration']['original_note_sha256']:
            raise ValueError('Source note fingerprint changed: ' + package['slug'])
    pending = [p for p in packages if p['source_ref'] not in refs]
    prior_coverage = [p for p in packages if p['source_ref'] in refs and p.get('new_coverage')]
    verify_prior_coverage(prior_coverage, coverage)
    # Establish existing coverage identities before permitting their IDs in a
    # shared section's collision guard. All candidate writes remain pending-only.
    prerequisites = []
    for package in prior_coverage:
        prerequisites.append(
            'if not exists(select 1 from public.learning_topics t join public.learning_sections s on s.id=t.section_id '
            'join public.learning_grids g on g.id=t.grid_id where t.id=' + build.quoted(package['integration']['new_topic_id'])
            + ' and s.grid_id=t.grid_id and t.source_kind=\'dbms_sql_tutorial\' and t.source_ref='
            + build.quoted(package['source_ref']) + ' and lower(t.slug)=' + build.quoted(package['slug'])
            + ' and lower(s.slug)=' + build.quoted(package['section_slug'])
            + " and lower(g.slug)='dbms-sql-tutorial') then raise exception 'Required prior coverage identity missing: %', "
            + build.quoted(package['slug']) + '; end if;')
    candidate = build.render(pending, originals, coverage_owners=packages)
    candidate = candidate.replace('begin\n', 'begin\n' + '\n'.join(prerequisites) + '\n', 1)
    candidate = ('-- LOCAL REVIEW CANDIDATE ONLY. Not an ordered migration; do not execute without approval.\n'
                 '-- Requires reviewed 0151/121 snapshot; existing 148 packages are not rewritten.\n' + candidate)
    reports = [(p.name, json.loads(p.read_text())) for p in sorted([
        *(BASE / 'reports').glob('mariadb*.json'), *(BASE / 'reports').glob('mysql-*.json')])]
    topics = []
    for package in pending:
        review = reviewed(package)
        evidence = sql_evidence(package, reports)
        blockers = ([] if review else ['independent review pending'])
        if evidence['status'] not in ('not-applicable', 'recorded-compatible'):
            blockers.append('SQL compatibility evidence missing or failing')
        topics.append({'slug': package['slug'], 'source_ref': package['source_ref'],
                       'new_coverage': bool(package.get('new_coverage')),
                       'package_sha256': digest(json.dumps(package, sort_keys=True)),
                       'notes_words': build.validate(package), 'questions': 20,
                       'coding_exercises': len(package['coding_problems']),
                       'diagrams': len(package.get('diagrams', [])),
                       'independent_review_passed': review, 'sql_compatibility': evidence,
                       'local_review_blockers': blockers,
                       'locally_review_ready': not blockers})
    summary = {'authored_packages': len(packages), 'preserved_snapshot_packages': len(refs),
               'pending_packages': len(pending), 'pending_seeded': sum(not p.get('new_coverage') for p in pending),
               'pending_coverage': sum(bool(p.get('new_coverage')) for p in pending),
               'structurally_valid': len(topics), 'independently_reviewed': sum(t['independent_review_passed'] for t in topics),
               'locally_review_ready': sum(t['locally_review_ready'] for t in topics),
               'sql_recorded_compatible_topics': sum(t['sql_compatibility']['status'] == 'recorded-compatible' for t in topics),
               'sql_not_applicable_topics': sum(t['sql_compatibility']['status'] == 'not-applicable' for t in topics),
               'target_mysql_verified_coding_topics': sum(t['sql_compatibility'].get('target_mysql_verified', False) for t in topics),
               'mariadb_only_coding_topics': sum(t['sql_compatibility']['status'] == 'recorded-compatible' and not t['sql_compatibility'].get('target_mysql_verified') for t in topics),
               'sql_unverified_or_failing_topics': sum(t['sql_compatibility']['status'] in ('unverified', 'recorded-failure') for t in topics),
               'tests': 2 * len(topics), 'questions': 20 * len(topics),
               'retained_question_identities': sum(len(p['original_questions']) for p in pending),
               'coding_exercises': sum(t['coding_exercises'] for t in topics),
               'diagrams': sum(t['diagrams'] for t in topics)}
    report = {'scope': 'Local structural/integration audit of recorded content and fixture evidence; not live application, deployment or hosted provider verification',
              'ready_for_execution': False, 'database_writes': 0, 'migrations_executed': 0,
              'write_count_scope': 'This audit/preparation process only; separate disposable MySQL fixture writes do not access application databases.',
              'preserved_snapshot_body_sha256': SNAPSHOT_BODY_SHA256,
              'candidate_sha256': digest(candidate), 'summary': summary,
              'release_blockers': ['Human approval required before any migration-file change or application database execution',
                                   *([str(len(topics) - summary['independently_reviewed']) + ' pending drafts lack independent editorial review'] if summary['independently_reviewed'] < len(topics) else []),
                                   *([str(summary['mariadb_only_coding_topics']) + ' coding topics have MariaDB-only evidence'] if summary['mariadb_only_coding_topics'] else []),
                                   'Hosted execution provider version/behavior and applied PostgreSQL/Supabase compatibility remain unverified',
                                   'Older snapshot content revisions remain separate; prior 148 packages are preserved',
                                   'Draft-only coverage is not public; authenticated integration/browser QA remains pending'],
              'topics': topics}
    return candidate, report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--prepare', action='store_true', help='Save local review artifacts only; never modifies migrations')
    args = parser.parse_args()
    candidate, report = prepare()
    if args.prepare:
        CANDIDATE.parent.mkdir(parents=True, exist_ok=True)
        CANDIDATE.write_text(candidate)
        READINESS.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'written': args.prepare, **report['summary'], 'ready_for_execution': False}))


if __name__ == '__main__':
    main()
