#!/usr/bin/env python3
"""Verify synthetic native reference actions only on an isolated /tmp MariaDB.

Creates and removes only the three fixed cx_native_* fixture tables in the
existing cx_dbms_exercises scratch database. Refuses preexisting fixture names.
Never executes application migrations. This is not exact MySQL/provider proof.
"""
import argparse
import json
import pathlib
import re
import subprocess


def verify(socket):
    if not str(socket.resolve()).startswith('/tmp/cx-dbms-sql.'):
        raise ValueError('An isolated /tmp/cx-dbms-sql.* socket is required')
    command = ['mysql', '--no-defaults', f'--socket={socket}', '--user=ganeshp8545', '--batch', '--raw']
    def execute(sql):
        return subprocess.run(command, input='USE cx_dbms_exercises;\n'+sql, text=True, capture_output=True, timeout=15)
    def run(sql):
        result = execute(sql)
        if result.returncode:
            raise RuntimeError(result.stderr)
        return result.stdout.strip()
    version = run('SELECT VERSION() AS engine;').splitlines()[-1]
    datadir = run('SELECT @@datadir AS location;').splitlines()[-1]
    if 'MariaDB' not in version or not str(pathlib.Path(datadir).resolve()).startswith('/tmp/cx-dbms-sql.'):
        raise ValueError('Only the provisioned isolated MariaDB data directory is supported')
    names = ('cx_native_parents', 'cx_native_children', 'cx_native_leaves')
    if run("SELECT table_name FROM information_schema.tables WHERE table_schema='cx_dbms_exercises' AND table_name IN ('cx_native_parents','cx_native_children','cx_native_leaves');"):
        raise ValueError('Existing native fixture names require review; nothing was modified')
    cases = []
    created = []
    def create(name, sql):
        run(sql)
        created.append(name)
    def cleanup():
        while created:
            name = created[-1]
            if name not in names:
                raise ValueError('Unexpected cleanup target')
            run('DROP TABLE '+name+';')
            created.pop()
    def expect(name, sql, expected):
        actual = run(sql)
        if actual != expected:
            raise AssertionError(f'{name}: {actual!r} != {expected!r}')
        cases.append({'name':name, 'passed':True})
    def reject(name, sql, code):
        result = execute(sql)
        match = re.search(r'ERROR (\d+)\b', result.stderr)
        if result.returncode == 0 or not match or int(match[1]) != code:
            raise AssertionError(f'{name}: expected {code}; {result.stderr}')
        cases.append({'name':name, 'passed':True, 'error_code':code})
    def owner():
        create('cx_native_parents', 'CREATE TABLE cx_native_parents (building_id INT PRIMARY KEY) ENGINE=InnoDB;')
        run('INSERT INTO cx_native_parents VALUES (7),(9),(12);')
    try:
        owner()
        create('cx_native_children', 'CREATE TABLE cx_native_children (building_id INT NOT NULL, room_number INT NOT NULL, capacity INT NOT NULL, PRIMARY KEY(building_id,room_number), FOREIGN KEY(building_id) REFERENCES cx_native_parents(building_id) ON DELETE RESTRICT ON UPDATE RESTRICT) ENGINE=InnoDB;')
        run('INSERT INTO cx_native_children VALUES (7,101,30),(7,102,20),(9,101,40);')
        expect('owner-local room number reuse accepted', 'SELECT building_id,room_number FROM cx_native_children ORDER BY building_id,room_number;', 'building_id\troom_number\n7\t101\n7\t102\n9\t101')
        reject('invalid owner insert', 'INSERT INTO cx_native_children VALUES (99,101,10);', 1452)
        reject('invalid owner update', 'UPDATE cx_native_children SET building_id=99 WHERE building_id=7 AND room_number=101;', 1452)
        reject('referenced owner delete restricted', 'DELETE FROM cx_native_parents WHERE building_id=7;', 1451)
        reject('referenced owner update restricted', 'UPDATE cx_native_parents SET building_id=70 WHERE building_id=7;', 1451)
        reject('duplicate complete room identity', 'INSERT INTO cx_native_children VALUES (7,101,35);', 1062)
        reject('missing owner component', 'INSERT INTO cx_native_children VALUES (NULL,103,10);', 1048)
        expect('rejected transitions preserve state', 'SELECT COUNT(*) AS rooms FROM cx_native_children;', 'rooms\n3')
        run('DELETE FROM cx_native_parents WHERE building_id=12;')
        expect('unreferenced owner can be deleted', 'SELECT COUNT(*) AS owners FROM cx_native_parents;', 'owners\n2')
        cleanup()
        owner()
        create('cx_native_children', 'CREATE TABLE cx_native_children (child_id INT PRIMARY KEY, building_id INT NOT NULL, FOREIGN KEY(building_id) REFERENCES cx_native_parents(building_id) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB;')
        run('INSERT INTO cx_native_children VALUES (1,7),(2,9); UPDATE cx_native_parents SET building_id=70 WHERE building_id=7;')
        expect('parent key update cascades only to matching child', 'SELECT child_id,building_id FROM cx_native_children ORDER BY child_id;', 'child_id\tbuilding_id\n1\t70\n2\t9')
        create('cx_native_leaves', 'CREATE TABLE cx_native_leaves (leaf_id INT PRIMARY KEY, child_id INT NOT NULL, FOREIGN KEY(child_id) REFERENCES cx_native_children(child_id) ON DELETE CASCADE) ENGINE=InnoDB;')
        run('INSERT INTO cx_native_leaves VALUES (11,1),(12,1),(13,2); DELETE FROM cx_native_parents WHERE building_id=70;')
        expect('cascade preserves unrelated child', 'SELECT child_id,building_id FROM cx_native_children ORDER BY child_id;', 'child_id\tbuilding_id\n2\t9')
        expect('cascade propagates to third level only on matching branch', 'SELECT leaf_id,child_id FROM cx_native_leaves ORDER BY leaf_id;', 'leaf_id\tchild_id\n13\t2')
        cleanup()
        owner()
        create('cx_native_children', 'CREATE TABLE cx_native_children (child_id INT PRIMARY KEY, building_id INT NULL, FOREIGN KEY(building_id) REFERENCES cx_native_parents(building_id) ON DELETE SET NULL) ENGINE=InnoDB;')
        run('INSERT INTO cx_native_children VALUES (1,7),(2,9),(3,NULL); DELETE FROM cx_native_parents WHERE building_id=7;')
        expect('set null preserves children and permitted absence', 'SELECT child_id,building_id FROM cx_native_children ORDER BY child_id;', 'child_id\tbuilding_id\n1\tNULL\n2\t9\n3\tNULL')
    finally:
        cleanup()
    return {'engine':version, 'scope':'Native InnoDB referential-action checks on synthetic persistent tables in isolated MariaDB scratch database; exact MySQL/provider, application authorization, rollback and concurrency unverified', 'cases':cases, 'all_passed':True, 'fixture_tables_removed':True, 'application_migrations_executed':0}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--socket', required=True, type=pathlib.Path)
    print(json.dumps(verify(parser.parse_args().socket)))
