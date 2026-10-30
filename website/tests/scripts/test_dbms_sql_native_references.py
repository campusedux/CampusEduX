import importlib.util
import pathlib
import subprocess
import unittest
from unittest.mock import patch

ROOT=pathlib.Path(__file__).resolve().parents[3]
spec=importlib.util.spec_from_file_location('native_references',ROOT/'website/scripts/verify-dbms-native-references.py')
native=importlib.util.module_from_spec(spec)
spec.loader.exec_module(native)


class NativeReferenceSafety(unittest.TestCase):
    def test_other_socket_paths_are_rejected_before_any_database_command(self):
        with patch.object(native.subprocess,'run') as command:
            with self.assertRaisesRegex(ValueError,'isolated'):
                native.verify(pathlib.Path('/var/run/mysqld/mysqld.sock'))
            command.assert_not_called()

    def test_non_scratch_data_directory_cannot_mutate_tables(self):
        replies=[subprocess.CompletedProcess([],0,'engine\n11.8-MariaDB\n',''),subprocess.CompletedProcess([],0,'location\n/var/lib/mysql/\n','')]
        with patch.object(native.subprocess,'run',side_effect=replies) as command:
            with self.assertRaisesRegex(ValueError,'data directory'):
                native.verify(pathlib.Path('/tmp/cx-dbms-sql.test/mysql.sock'))
            self.assertEqual(command.call_count,2)
            self.assertTrue(all('SELECT ' in call.kwargs['input'] for call in command.call_args_list))

    def test_preexisting_fixture_is_preserved_without_cleanup_or_writes(self):
        replies=[subprocess.CompletedProcess([],0,'engine\n11.8-MariaDB\n',''),subprocess.CompletedProcess([],0,'location\n/tmp/cx-dbms-sql.test/data/\n',''),subprocess.CompletedProcess([],0,'table_name\ncx_native_parents\n','')]
        with patch.object(native.subprocess,'run',side_effect=replies) as command:
            with self.assertRaisesRegex(ValueError,'nothing was modified'):
                native.verify(pathlib.Path('/tmp/cx-dbms-sql.test/mysql.sock'))
            self.assertEqual(command.call_count,3)
            self.assertTrue(all('SELECT ' in call.kwargs['input'] for call in command.call_args_list))
