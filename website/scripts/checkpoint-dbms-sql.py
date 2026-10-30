#!/usr/bin/env python3
"""Reconcile saved lesson drafts without preparing or executing migrations.

Read-only by default. --write updates the two checkpoint manifests atomically
per file. Existing validated/integrated states are retained; a new file can
advance to drafted or explicitly independently reviewed here. SQL and browser evidence
remain separate. Run after workers finish a batch, never during a file write.
"""
import argparse
import hashlib
import importlib.util
import json
import pathlib
import tempfile
import os

ROOT = pathlib.Path(__file__).resolve().parents[2]
BASE = ROOT / 'website/content/dbms-sql'
spec = importlib.util.spec_from_file_location('dbms_build', ROOT / 'website/scripts/build-dbms-sql-content.py')
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)


def atomic_json(path, value):
    with tempfile.NamedTemporaryFile(mode='w', dir=path.parent, suffix='.tmp', delete=False) as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2)
        stream.write('\n')
        temporary = stream.name
    os.replace(temporary, path)


def reconcile(write=False):
    progress = json.loads((BASE / 'progress.json').read_text())
    assignments = json.loads((BASE / 'assignments.json').read_text())
    packages = {p.stem: json.loads(p.read_text()) for p in sorted((BASE / 'topics').glob('*.json'))}
    inventory = progress['topics'] + progress.get('coverage_topics', [])
    rows = {row['slug']: row for row in inventory}
    if set(packages) - set(rows):
        raise ValueError('Register coverage identities before checkpointing: ' + str(sorted(set(packages) - set(rows))))
    counts = {slug: build.validate(package) for slug, package in packages.items()}
    for slug, package in packages.items():
        if package['slug'] != slug or package['source_ref'] != rows[slug]['source_ref']:
            raise ValueError('Package identity mismatch: ' + slug)
        row = rows[slug]
        if row['status'] == 'pending':
            row['status'] = 'drafted'
            row['history'] = ['pending', 'drafted']
        if row['status'] == 'drafted' and package.get('review', {}).get('independent_review') == 'passed':
            row['status'] = 'reviewed'
            row['history'] = ['pending', 'drafted', 'reviewed']
        if row['status'] in {'drafted', 'reviewed'}:
            row['validation'] = {
                'scope': 'structural draft checks only; migration not applied; not integrated',
                'notes_words': counts[slug], 'tests': len(package['tests']),
                'questions': sum(len(t['questions']) for t in package['tests']),
                'coding_problems': len(package['coding_problems']),
                'sql_execution': package.get('sql_verification', {'scope': 'unverified'}),
                'independent_review': package.get('review', {}).get('independent_review', 'pending'),
                'diagrams': {'count': len(package.get('diagrams', [])), **package.get('diagram_review', {})},
            }
    seeded = {row['slug'] for row in progress['topics']}
    remaining = [row['slug'] for row in progress['topics'] if row['slug'] not in packages]
    draft_pending = [row['slug'] for row in progress['topics'] if row['slug'] in packages and row['status'] != 'validated']
    reviewed = sum(p.get('review', {}).get('independent_review') == 'passed' for p in packages.values())
    report_path = BASE / 'reports/continuation-verification-2026-10-29.json'
    report = json.loads(report_path.read_text()) if report_path.exists() else {}
    rendered = report.get('static_rendering', {}).get('topic_fingerprints', {})
    def currently_rendered(slug, package):
        fingerprint = hashlib.sha256(json.dumps({
            'title': package['title'], 'notes': package['notes'],
            'diagrams': package.get('diagrams', []),
        }, sort_keys=True).encode()).hexdigest()
        if slug in rendered:
            return rendered[slug] == fingerprint
        return package.get('diagram_review', {}).get('server_rendering') == 'passed'
    summary = progress['summary']
    summary.update({
        'authored_topics': len(packages), 'drafted_topics': len(packages),
        'authored_tests': sum(len(p['tests']) for p in packages.values()),
        'authored_questions': sum(len(t['questions']) for p in packages.values() for t in p['tests']),
        'authored_coding_problems': sum(len(p['coding_problems']) for p in packages.values()),
        'authored_diagrams': sum(len(p.get('diagrams', [])) for p in packages.values()),
        'authored_topics_with_coding_exercises': sum(bool(p['coding_problems']) for p in packages.values()),
        'authored_topics_coding_not_applicable': sum(bool(p.get('coding_not_applicable')) for p in packages.values()),
        'topics_pending_coding_applicability': len(remaining),
        'explanatory_words': sum(counts.values()), 'pending_existing_topics': len(remaining),
        'drafted_existing_verification_pending': len(draft_pending),
        'existing_topics_awaiting_local_validation': len(remaining) + len(draft_pending),
        'independently_reviewed_topics': reviewed,
        'missing_topics_added': sum(bool(p.get('new_coverage')) for p in packages.values()),
        'server_rendered_diagrams': sum(len(p.get('diagrams', [])) for slug, p in packages.items() if currently_rendered(slug, p)),
    })
    for batch in assignments.get('scaled_writer_batches', []):
        batch['saved_topics'] = [t['slug'] for t in batch['topics'] if t['slug'] in packages]
        batch['remaining_topics'] = [t['slug'] for t in batch['topics'] if t['slug'] not in packages]
        batch['remaining_topic_ids'] = [t['id'] for t in batch['topics'] if t['slug'] not in packages]
        batch['state'] = 'drafted; verification tracked separately' if not batch['remaining_topics'] else 'in progress' if batch['saved_topics'] else 'queued'
    pending_reviews = [slug for slug, package in packages.items()
                       if package.get('review', {}).get('reviewer') == '/root'
                       and package.get('review', {}).get('independent_review') != 'passed']
    assignments['coordinator_authored_independent_review_pending'] = pending_reviews
    assignments['drafted_verification_pending'] = draft_pending
    assignments['next_undrafted_topic'] = next(iter(remaining), None)
    assignments['fast_drafting_counts'].update({
        'new_drafts_verification_pending': len(draft_pending), 'existing_undrafted': len(remaining),
        'independently_reviewed': reviewed,
    })
    for stream in assignments['workstreams']:
        for batch in stream['batches']:
            for topic in batch['topics']:
                row = rows[topic['slug']]
                topic['status'] = row['status']
                topic['review_status'] = packages.get(topic['slug'], {}).get('review', {}).get('independent_review', 'pending')
    for topic in assignments.get('completed_outside_queue', []):
        topic['status'] = rows[topic['slug']]['status']
    checkpoint = progress['checkpoint']
    checkpoint.update({
        'remaining_topics': remaining, 'next_topics': remaining[:6],
        'resume_start': next(iter(remaining), None), 'authored_topics': list(packages),
        'scope_remaining': f"{len(remaining)} seeded topics undrafted; {len(draft_pending)} seeded drafts await integration/local verification; broader coverage and release gates remain separate.",
        'execution_status': f"Saved {len(packages)} packages; {len(remaining)} seeded topics undrafted. Native worker ownership recorded in assignments.json.",
        'resume_command': 'python3 website/scripts/checkpoint-dbms-sql.py',
        'remaining_verification_topics': [slug for slug, p in packages.items()
                                          if p.get('review', {}).get('independent_review') != 'passed'
                                          or p.get('release_validation', {}).get('desktop_mobile_qa') != 'passed'],
    })
    checkpoint['next_actions'] = ([f"Finish seeded topics: {', '.join(remaining[:6])}"] if remaining else []) + [
        'All 20 groups have reviewed foundation drafts; complete broader operational labs and cross-cutting coverage without claiming exhaustive curriculum verification.',
        'New-package and six coordinator reviews are complete; older review gaps, target MySQL/provider, browser, originality and AdSense gates remain separate.',
        'Prepared 0151/121 snapshot is unchanged; draft integration is pending and requires separate approval.',
    ]
    execution = f"Saved checkpoint: {len(packages)} packages; {len(remaining)} seeded topics undrafted; migration snapshot unchanged and unapplied."
    progress['execution'] = assignments['execution'] = execution
    if write:
        atomic_json(BASE / 'progress.json', progress)
        atomic_json(BASE / 'assignments.json', assignments)
    result = {'packages': len(packages), 'seeded_saved': len(set(packages) & seeded),
              'seeded_undrafted': len(remaining), 'drafted_verification_pending': len(draft_pending),
              'words': sum(counts.values()), 'independently_reviewed': reviewed,
              'batches': {b['writer']: len(b['remaining_topics']) for b in assignments.get('scaled_writer_batches', [])},
              'coordinator_reviews_pending': pending_reviews, 'written': write,
              'prepared_migrations_modified': False, 'migrations_applied': 0}
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true')
    print(json.dumps(reconcile(parser.parse_args().write)))
