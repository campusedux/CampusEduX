"""Guard fixture identity before any real database writes; do not run Docker."""
import importlib.util
import json
import pathlib
import subprocess
import tempfile
import unittest
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parents[3]
spec = importlib.util.spec_from_file_location('mysql_fixture', ROOT / 'website/scripts/verify-dbms-mysql.py')
fixture = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fixture)


class MysqlFixtureSafety(unittest.TestCase):
    def test_non_fixture_container_is_rejected_before_any_command(self):
        with patch.object(fixture.subprocess, 'run') as run:
            with self.assertRaisesRegex(ValueError, 'disposable'):
                fixture.container_guard('existing-database')
        run.assert_not_called()

    def test_network_ports_binds_wrong_label_or_memory_fail_closed(self):
        meta = {'running': True, 'memory': 384 * 1024 * 1024, 'network': 'none',
                'ports': {}, 'binds': [], 'mounts': [], 'label': fixture.LABEL,
                'image': 'public.ecr.aws/docker/library/mysql:8.4'}
        for field, value in [('network', 'bridge'), ('ports', {'3306/tcp': [{}]}),
                             ('binds', ['/host:/data']), ('memory', 0), ('label', 'other'),
                             ('mounts', [{'Type': 'bind', 'Destination': '/var/lib/mysql'}])]:
            with self.subTest(field=field):
                reply = subprocess.CompletedProcess([], 0, json.dumps({**meta, field: value}), '')
                with patch.object(fixture.subprocess, 'run', return_value=reply) as run:
                    with self.assertRaisesRegex(ValueError, 'guard failed'):
                        fixture.container_guard('cx-dbms-mysql84-test')
                self.assertEqual(run.call_count, 1)

    def test_old_mysql_or_mariadb_cannot_reach_fixture_writes(self):
        for engine in ['5.7.44', '11.8-MariaDB']:
            with self.subTest(engine=engine), patch.object(fixture, 'container_guard', return_value={}), patch.object(
                    fixture.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0, 'engine\n' + engine, '')) as run:
                with self.assertRaisesRegex(ValueError, 'Exact MySQL 8.4'):
                    fixture.verify('cx-dbms-mysql84-test', set(), pathlib.Path('/unused'))
                self.assertEqual(run.call_count, 1)
                self.assertTrue(run.call_args.kwargs['input'].startswith('SELECT VERSION()'))

    def test_schema_is_not_rewritten_and_failed_case_is_cleaned_up(self):
        package = {'slug': 'one', 'coding_problems': [{'slug': 'one-case',
            'schema_sql': 'CREATE TABLE target(id INT PRIMARY KEY);', 'seed_sql': 'INSERT INTO target VALUES(1);',
            'solution_sql': 'SELECT id FROM target;', 'expected': 'id\n2', 'validation_cases': []}]}
        def reply(command, **kwargs):
            sql = kwargs['input']
            output = 'engine\n8.4.13' if 'VERSION()' in sql else 'disabled\tlocation\n1\t/var/lib/mysql/' if '@@skip_networking' in sql else 'id\n1' if sql.startswith('USE ') else ''
            return subprocess.CompletedProcess(command, 0, output, '')
        with tempfile.TemporaryDirectory() as directory:
            base = pathlib.Path(directory)
            (base / 'topics').mkdir()
            topic = base / 'topics/one.json'
            topic.write_text(json.dumps(package))
            before = topic.read_bytes()
            with patch.object(fixture, 'BASE', base), patch.object(fixture, 'container_guard', return_value={'network': 'none', 'memory': 384 * 1024 * 1024}), patch.object(fixture.subprocess, 'run', side_effect=reply) as run:
                report = fixture.verify('cx-dbms-mysql84-test', {'one'}, base / 'report.json')
            self.assertEqual(topic.read_bytes(), before)
            self.assertFalse(report['evidence']['one']['all_passed'])
            commands = [call.kwargs['input'] for call in run.call_args_list]
            script = next(sql for sql in commands if sql.startswith('USE '))
            self.assertIn('CREATE TABLE target', script)
            self.assertNotIn('TEMPORARY', script)
            name = script.split(';', 1)[0].removeprefix('USE ')
            self.assertRegex(name, r'^cx_fixture_[a-f0-9]{32}$')
            self.assertIn('DROP DATABASE ' + name + ';', commands)
