"""Pending-only preparation, frozen migration integrity and honest readiness."""
import copy
import importlib.util
import json
import pathlib
import unittest
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parents[3]
spec = importlib.util.spec_from_file_location('dbms_integration', ROOT / 'website/scripts/prepare-dbms-integration.py')
integration = importlib.util.module_from_spec(spec)
spec.loader.exec_module(integration)


class IntegrationPreparation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.candidate, cls.report = integration.prepare()

    def test_saved_candidate_is_reproducible_without_mutating_any_inputs(self):
        with patch.object(pathlib.Path, 'write_text') as write:
            candidate, report = integration.prepare()
        write.assert_not_called()
        self.assertEqual(candidate, integration.CANDIDATE.read_text())
        self.assertEqual(report, json.loads(integration.READINESS.read_text()))
        self.assertEqual(report['candidate_sha256'], integration.digest(candidate))
        self.assertFalse(report['ready_for_execution'])
        self.assertEqual(report['database_writes'], 0)
        self.assertEqual(report['migrations_executed'], 0)

    def test_migration_changes_fail_closed_instead_of_being_rebaselined(self):
        with patch.object(integration, 'SNAPSHOT_BODY_SHA256', 'unexpected'):
            with self.assertRaisesRegex(ValueError, 'Preserved migration drift'):
                integration.snapshot_refs()

    def test_candidate_writes_only_the_169_pending_packages(self):
        inner = self.candidate.split('do $dbms_rewrite$', 1)[1].rsplit('$dbms_rewrite$', 1)[0]
        masked, literals = integration.build.audit.mask_literals(inner)
        refs = [literals[int(m[1])] for m in integration.re.finditer(
            r'select t.id into strict topic_uuid[^;]*t.source_ref\s*=\s*@(\d+)@', masked)]
        self.assertEqual(len(refs), 169)
        self.assertFalse(set(refs) & integration.snapshot_refs())
        self.assertEqual(set(refs), {t['source_ref'] for t in self.report['topics']})
        self.assertEqual(self.report['summary']['pending_seeded'], 149)
        self.assertEqual(self.report['summary']['pending_coverage'], 20)
        self.assertEqual(self.report['summary']['retained_question_identities'], 1192)
        self.assertNotRegex(masked.lower(), r'\b(?:drop|delete|alter|create|grant|revoke|truncate)\b')
        self.assertNotRegex(masked.lower(), r'update public\.(?:learning_grids|learning_sections|profiles|test_attempts)\b')
        for invariant in ['Edited question requires review', 'Notes changed since seed',
                          'Previously empty coverage group now populated', 'Edited coding problem requires review']:
            self.assertIn(invariant, self.candidate)

    def test_shared_coverage_sections_require_prior_identities_without_rewriting_them(self):
        packages = [json.loads(p.read_text()) for p in (integration.BASE / 'topics').glob('*.json')]
        prior = [p for p in packages if p.get('new_coverage') and p['source_ref'] in integration.snapshot_refs()]
        for package in prior:
            self.assertIn('Required prior coverage identity missing: %\', ' + integration.build.quoted(package['slug']), self.candidate)
            self.assertIn('t.id=' + integration.build.quoted(package['integration']['new_topic_id']), self.candidate)
            self.assertNotIn('-- ' + package['slug'] + '\n', self.candidate)
        for slug in ['cte-hierarchy-safety-and-plans', 'window-navigation-frames-and-distributions']:
            package = next(p for p in packages if p['slug'] == slug)
            sql = integration.build.render([package], integration.build.source_notes(), coverage_owners=packages)
            line = next(line for line in sql.splitlines() if 'Previously empty coverage group' in line)
            for owner in prior:
                if owner['section_slug'] == package['section_slug']:
                    self.assertIn(integration.build.quoted(owner['integration']['new_topic_id']), line)

    def test_prior_coverage_allowlist_comes_from_the_frozen_sql_not_mutable_drafts(self):
        refs, coverage = integration.snapshot_inventory()
        self.assertEqual(len(refs), 148)
        self.assertEqual(len(coverage), 3)
        package = json.loads((integration.BASE / 'topics/common-table-expressions.json').read_text())
        integration.verify_prior_coverage([package], coverage)
        package['integration']['new_topic_id'] = '00000000-0000-0000-0000-000000000000'
        with self.assertRaisesRegex(ValueError, 'Prior coverage identity changed'):
            integration.verify_prior_coverage([package], coverage)

    def test_stale_incomplete_or_failed_sql_evidence_never_counts_as_a_pass(self):
        package = {'slug': 'example', 'coding_problems': [{
            'slug': 'one', 'validation_cases': [{'seed_sql': 'unused'}],
            'negative_validation_cases': [{'sql': 'unused'}]}]}
        proof = {'fingerprint': integration.digest(json.dumps(package['coding_problems'], sort_keys=True)),
                 'engine': 'MariaDB fixture', 'all_passed': True, 'cases': [
                     {'problem': 'one', 'case': 0, 'passed': True},
                     {'problem': 'one', 'case': 1, 'passed': True},
                     {'problem': 'one', 'negative_case': 0, 'passed': True}]}
        def evidence(value):
            return integration.sql_evidence(package, [('fixture.json', {'evidence': {'example': value}})])
        self.assertEqual(evidence(proof)['status'], 'recorded-compatible')
        stale = copy.deepcopy(proof)
        stale['fingerprint'] = 'stale'
        self.assertEqual(evidence(stale)['status'], 'unverified')
        incomplete = copy.deepcopy(proof)
        incomplete['cases'].pop()
        self.assertEqual(evidence(incomplete)['status'], 'recorded-failure')
        failed = copy.deepcopy(proof)
        failed['cases'][0]['passed'] = False
        self.assertEqual(evidence(failed)['status'], 'recorded-failure')
        duplicate = copy.deepcopy(proof)
        duplicate['cases'][-1] = duplicate['cases'][0]
        self.assertEqual(evidence(duplicate)['status'], 'recorded-failure')

    def test_editorial_and_engine_gaps_stay_separate_from_structural_success(self):
        self.assertEqual(len(self.report['topics']), 169)
        for topic in self.report['topics']:
            self.assertTrue(1200 <= topic['notes_words'] <= 1500)
            self.assertEqual(topic['locally_review_ready'], not topic['local_review_blockers'])
            if not topic['independent_review_passed']:
                self.assertIn('independent review pending', topic['local_review_blockers'])
            self.assertIn(topic['sql_compatibility']['status'],
                          ['not-applicable', 'recorded-compatible', 'recorded-failure', 'unverified'])

    def test_mysql_evidence_takes_precedence_over_mariadb_rejections(self):
        package = {'slug': 'regex', 'coding_problems': [{'slug': 'regex-one', 'validation_cases': []}]}
        proof = {'engine': 'MySQL 8.4.13', 'all_passed': True,
                 'fingerprint': integration.digest(json.dumps(package['coding_problems'], sort_keys=True)),
                 'cases': [{'problem': 'regex-one', 'case': 0, 'passed': True}]}
        rejected = copy.deepcopy(proof)
        rejected.update({'engine': '11.8-MariaDB', 'all_passed': False})
        rejected['cases'][0]['passed'] = False
        evidence = integration.sql_evidence(package, [
            ('mysql.json', {'evidence': {'regex': proof}}),
            ('later-mariadb.json', {'evidence': {'regex': rejected}})])
        self.assertEqual(evidence['status'], 'recorded-compatible')
        self.assertTrue(evidence['target_mysql_verified'])
        self.assertEqual(evidence['evidence']['engine_kind'], 'mysql-8.4')

    def test_stale_editorial_review_requires_review_again(self):
        package = {'slug': 'example', 'title': 'Example', 'notes': 'Reviewed text',
                   'review': {'independent_review': 'passed'}}
        package['review']['content_sha256'] = integration.review_fingerprint(package)
        self.assertTrue(integration.reviewed(package))
        package['review']['notes_review'] = 'Recording workflow metadata preserves the review'
        self.assertTrue(integration.reviewed(package))
        package['notes'] = 'Changed unreviewed text'
        self.assertFalse(integration.reviewed(package))

    def test_current_readiness_counts_partition_the_full_pending_inventory(self):
        summary = self.report['summary']
        self.assertEqual(summary['pending_packages'], summary['pending_seeded'] + summary['pending_coverage'])
        self.assertEqual(summary['pending_packages'], summary['sql_recorded_compatible_topics'] + summary['sql_not_applicable_topics'] + summary['sql_unverified_or_failing_topics'])
        self.assertEqual(summary['sql_recorded_compatible_topics'], summary['target_mysql_verified_coding_topics'] + summary['mariadb_only_coding_topics'])
        self.assertEqual(summary['independently_reviewed'], sum(t['independent_review_passed'] for t in self.report['topics']))
        self.assertEqual(summary['locally_review_ready'], sum(t['locally_review_ready'] for t in self.report['topics']))


if __name__ == '__main__':
    unittest.main()
