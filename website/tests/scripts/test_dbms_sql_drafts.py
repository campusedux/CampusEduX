"""Draft checkpoint and isolated fixture safety, separate from integration."""
import importlib.util
import json
import pathlib
import subprocess
import tempfile
import unittest
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parents[3]


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'website/scripts' / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


checkpoint = load('draft_checkpoint', 'checkpoint-dbms-sql.py')
verifier = load('draft_exercises', 'verify-dbms-exercises.py')


class DraftSafety(unittest.TestCase):
    def test_read_only_reconciliation_does_not_write_or_claim_integration(self):
        with patch.object(checkpoint, 'atomic_json') as write:
            result = checkpoint.reconcile()
        write.assert_not_called()
        self.assertFalse(result['prepared_migrations_modified'])
        self.assertEqual(result['migrations_applied'], 0)
        self.assertEqual(result['seeded_saved'] + result['seeded_undrafted'], 294)

    def test_scratch_socket_guard_precedes_database_commands(self):
        with patch.object(verifier.subprocess, 'run') as command:
            with self.assertRaisesRegex(ValueError, 'isolated'):
                verifier.verify(pathlib.Path('/var/run/mysqld/mysqld.sock'))
        command.assert_not_called()

    def test_scratch_datadir_guard_precedes_fixture_writes(self):
        replies = [subprocess.CompletedProcess([], 0, 'engine\n11.8-MariaDB\n', ''),
                   subprocess.CompletedProcess([], 0, 'location\n/var/lib/mysql/\n', '')]
        with patch.object(verifier.subprocess, 'run', side_effect=replies) as command:
            with self.assertRaisesRegex(ValueError, 'data directory'):
                verifier.verify(pathlib.Path('/tmp/cx-dbms-sql.test/mysql.sock'))
        self.assertEqual(command.call_count, 2)
        self.assertTrue(all(call.kwargs['input'].startswith('SELECT ') for call in command.call_args_list))

    def test_native_view_fixture_uses_disposable_schema_and_separate_report(self):
        package = {'slug': 'view-demo', 'coding_problems': [{
            'slug': 'view-demo-one', 'schema_sql': 'CREATE TABLE t(id INT);',
            'seed_sql': 'INSERT INTO t VALUES (1);', 'solution_sql': 'CREATE VIEW v AS SELECT id FROM t;',
            'check_sql': 'SELECT id FROM v;', 'expected': 'id\n1', 'validation_cases': [],
        }]}
        def reply(command, **kwargs):
            sql = kwargs['input']
            output = 'engine\n11.8-MariaDB' if 'VERSION()' in sql else 'location\n/tmp/cx-dbms-sql.test/data/' if '@@datadir' in sql else 'id\n1' if 'SELECT id FROM v' in sql else ''
            return subprocess.CompletedProcess(command, 0, output, '')
        with tempfile.TemporaryDirectory() as directory:
            base = pathlib.Path(directory)
            (base / 'topics').mkdir()
            topic = base / 'topics/view-demo.json'
            topic.write_text(json.dumps(package))
            before = topic.read_bytes()
            with patch.object(verifier, 'BASE', base), patch.object(verifier.subprocess, 'run', side_effect=reply) as command:
                report = verifier.verify(pathlib.Path('/tmp/cx-dbms-sql.test/mysql.sock'), base / 'evidence.json')
            self.assertEqual(topic.read_bytes(), before)
            self.assertTrue(report['evidence']['view-demo']['all_passed'])
            sql = [call.kwargs['input'] for call in command.call_args_list]
            fixture = next(s for s in sql if 'CREATE VIEW' in s)
            self.assertIn('CREATE TABLE t', fixture)
            self.assertNotIn('CREATE TEMPORARY TABLE', fixture)
            database = fixture.split(';', 1)[0].removeprefix('USE ')
            self.assertTrue(database.startswith('cx_fixture_'))
            self.assertIn('DROP DATABASE ' + database + ';', sql)

    def test_final_cell_whitespace_is_not_erased_from_result_comparison(self):
        package = {'slug': 'space-demo', 'coding_problems': [{
            'slug': 'space-demo-one', 'schema_sql': 'CREATE TABLE t(label VARCHAR(5));',
            'seed_sql': "INSERT INTO t VALUES (' ');", 'solution_sql': 'SELECT label FROM t;',
            'expected': 'label\n', 'validation_cases': [],
        }]}
        def reply(command, **kwargs):
            sql = kwargs['input']
            output = 'engine\n11.8-MariaDB' if 'VERSION()' in sql else 'location\n/tmp/cx-dbms-sql.test/data/' if '@@datadir' in sql else 'label\n \n'
            return subprocess.CompletedProcess(command, 0, output, '')
        with tempfile.TemporaryDirectory() as directory:
            base = pathlib.Path(directory)
            (base / 'topics').mkdir()
            (base / 'topics/space-demo.json').write_text(json.dumps(package))
            with patch.object(verifier, 'BASE', base), patch.object(verifier.subprocess, 'run', side_effect=reply):
                report = verifier.verify(pathlib.Path('/tmp/cx-dbms-sql.test/mysql.sock'), base / 'evidence.json')
            self.assertFalse(report['evidence']['space-demo']['all_passed'])
            self.assertEqual(report['failures'][0]['actual'], 'label\n ')
            self.assertEqual(report['failures'][0]['expected'], 'label')


if __name__ == '__main__':
    unittest.main()
