import copy
import hashlib
import importlib.util
import json
import pathlib
import sys
import unittest
sys.dont_write_bytecode=True
ROOT=pathlib.Path(__file__).resolve().parents[3]
spec=importlib.util.spec_from_file_location('dbms_build',ROOT/'website/scripts/build-dbms-sql-content.py')
build=importlib.util.module_from_spec(spec);spec.loader.exec_module(build)
PACKAGES=[json.loads(p.read_text()) for p in sorted((ROOT/'website/content/dbms-sql/topics').glob('*.json'))]


class ContentPackages(unittest.TestCase):
    def test_every_authored_topic_meets_notes_and_assessment_structure(self):
        self.assertGreaterEqual(len(PACKAGES),7)
        for package in PACKAGES:
            with self.subTest(topic=package['slug']):
                self.assertTrue(1200<=build.validate(package)<=1500)
                self.assertEqual(sum(len(t['questions']) for t in package['tests']),20)
                self.assertEqual(package['tests'][0]['title'],'MCQ Test 1')
                self.assertEqual(package['tests'][1]['title'],'MCQ Test 2')

    def test_rejects_padding_an_empty_note_with_assessment_words(self):
        package=copy.deepcopy(PACKAGES[0]);package['notes']='## MCQ Test 1\n'+('question answer '*1400)
        with self.assertRaisesRegex(ValueError,'notes contain 0 words'):
            build.validate(package)

    def test_preserves_retained_advanced_exercise_without_allowing_new_advanced_substitutes(self):
        package=copy.deepcopy(next(p for p in PACKAGES if p['coding_problems']))
        harder=next(p for p in package['coding_problems'] if p['difficulty']=='Medium')
        harder['difficulty']='Hard'
        harder.pop('existing_problem',None)
        with self.assertRaisesRegex(ValueError,'retained advanced problem'):
            build.validate(package)
        harder['existing_problem']=True
        self.assertTrue(1200<=build.validate(package)<=1500)

    def test_rejects_duplicate_questions_and_options(self):
        for field in ['question','option']:
            package=copy.deepcopy(PACKAGES[0])
            if field=='question':
                package['tests'][1]['questions'][0]['question_text']=package['tests'][0]['questions'][0]['question_text']
            else:
                package['tests'][1]['questions'][0]['options'][1]=package['tests'][1]['questions'][0]['options'][0]
            with self.assertRaises(ValueError):build.validate(package)

    def test_original_identity_and_correct_answer_mapping_cannot_drift(self):
        package=copy.deepcopy(PACKAGES[0]);question=package['tests'][0]['questions'][0];question['correct_index']=(question['correct_index']+1)%4
        with self.assertRaisesRegex(ValueError,'canonical correct indices'):
            build.validate(package)

    def test_retained_ddl_preserves_empty_setup_and_trailing_checker(self):
        package=copy.deepcopy(next(p for p in PACKAGES if p['slug']=='create-table'))
        problem=next(p for p in package['coding_problems'] if p.get('existing_problem'))
        self.assertEqual(problem['schema_sql'],'')
        self.assertEqual(problem['seed_sql'],'')
        self.assertEqual(problem['check_sql'],problem['original_check_sql'])
        self.assertGreaterEqual(build.validate(package),1200)
        sql=build.render([package],build.source_notes())
        self.assertIn('sql_check_sql is distinct from '+build.quoted(problem['original_check_sql']),sql)
        self.assertIn('check_sql',sql)
        problem['check_sql']='SELECT 1;'
        with self.assertRaisesRegex(ValueError,'trailing checker'):
            build.validate(package)

    def test_diagram_labels_do_not_pad_the_notes_word_count(self):
        package=copy.deepcopy(next(p for p in PACKAGES if p.get('diagrams')))
        original_count=build.validate(package)
        package['diagrams'][0]['description']='diagram caption '*2000
        self.assertEqual(build.validate(package),original_count)

    def test_diagram_shape_requires_accessible_description_and_matching_columns(self):
        package=copy.deepcopy(next(p for p in PACKAGES if p.get('diagrams')))
        package['diagrams'][0]['rows'][0].append('unexpected cell')
        with self.assertRaisesRegex(ValueError,'table shape'):
            build.validate(package)

    def test_weak_entity_er_requires_complete_bounded_identification_labels(self):
        package=copy.deepcopy(next(p for p in PACKAGES if p['slug']=='weak-entity'))
        for invalid in ['', 'x'*33, None]:
            package['diagrams'][0]['partialKey']=invalid
            with self.assertRaisesRegex(ValueError,'weak entity ER'):
                build.validate(package)

    def test_sql_evidence_matches_current_exercises_and_all_cases(self):
        progress=json.loads((ROOT/'website/content/dbms-sql/progress.json').read_text())
        states={row['slug']:row['status'] for row in progress['topics']+progress.get('coverage_topics',[])}
        for package in PACKAGES:
            problems=package['coding_problems']
            if not problems:continue
            with self.subTest(topic=package['slug']):
                proof=package.get('sql_verification',{'all_passed':False,'cases':[]})
                if not proof.get('all_passed'):
                    # An explicitly unexecuted draft is not engine evidence.
                    # Require honest pending state rather than indexing a
                    # nonexistent fingerprint or marking it validated.
                    self.assertEqual(proof.get('cases'),[])
                    self.assertNotEqual(states[package['slug']],'validated')
                    self.assertRegex(package['integration']['status'],r'not (?:yet )?included')
                    continue
                fingerprint=hashlib.sha256(json.dumps(problems,sort_keys=True).encode()).hexdigest()
                self.assertEqual(proof['fingerprint'],fingerprint)
                self.assertTrue(proof['all_passed'])
                self.assertIn('MariaDB',proof['engine'])
                self.assertEqual(len(proof['cases']),sum(1+len(p['validation_cases'])+len(p.get('negative_validation_cases',[])) for p in problems))
                self.assertTrue(all(case['passed'] for case in proof['cases']))
                self.assertIn('unverified',proof['scope'])

    def test_generated_sql_guards_edits_and_uses_existing_postgres_column_types(self):
        sql=build.render(PACKAGES,build.source_notes())
        self.assertIn('Edited question requires review',sql)
        self.assertIn('Notes changed since seed',sql)
        self.assertIn('Original coding problem was removed',sql)
        self.assertIn("array['sql']",sql)
        self.assertIn('parent.is_premium,parent.show_on_website,parent.show_on_mobile',sql)
        body=sql.split('do $dbms_rewrite$',1)[1].rsplit('$dbms_rewrite$',1)[0]
        masked,_=build.audit.mask_literals(body)
        self.assertNotRegex(masked.lower(),r'\b(?:alter|drop|create|grant|revoke|delete)\b')
        self.assertNotRegex(masked.lower(),r'update public\.(?:test_attempts|test_attempt_answers|user_dsa_progress)')

    def test_reference_sql_is_not_duplicated_into_the_ungated_editorial_field(self):
        sql=build.render(PACKAGES,build.source_notes())
        for package in PACKAGES:
            for problem in package['coding_problems']:
                exposed=problem['explanation']+'\n\n```sql\n'+problem['solution_sql']+'\n```'
                self.assertNotIn(build.quoted(exposed),sql)
                gated=build.quoted(json.dumps({'sql':problem['solution_sql']}))+'::jsonb'
                self.assertIn(gated,sql)

    def test_preserved_twins_match_the_frozen_pre_integration_checkpoint(self):
        mobile=(ROOT/'mobile-app/supabase/migrations/0151_dbms_sql_content_rewrite_batch01.sql').read_text().split('-- BODY\n',1)[1]
        admin=(ROOT/'admin-panel/supabase/migrations/121_dbms_sql_content_rewrite_batch01.sql').read_text().split('-- BODY\n',1)[1]
        self.assertEqual(mobile,admin)
        self.assertEqual(hashlib.sha256(mobile.encode()).hexdigest(),
                         'd1c35b87d348e664ddbfe8bd46f6187f073b53d4b5b67ef8fb86cbc44b8c504e',
                         'Preserved migration changed. Current drafts belong in the separate integration candidate.')

    def test_progress_retains_the_full_inventory_and_exact_remaining_list(self):
        progress=json.loads((ROOT/'website/content/dbms-sql/progress.json').read_text())
        self.assertEqual(len(progress['topics']),294)
        self.assertEqual(sum(progress['assignments'].values()),294)
        done={p['slug'] for p in PACKAGES}
        pending={row['slug'] for row in progress['topics'] if row['slug'] not in done}
        self.assertEqual(set(progress['checkpoint']['remaining_topics']),pending)
        self.assertEqual(len(pending),294-sum(not p.get('new_coverage') for p in PACKAGES))
        self.assertEqual(len(progress['missing_coverage_groups']),20)
        for row in progress['topics']:
            if row['slug'] in done:
                stages=['pending','drafted','reviewed','integrated','validated']
                self.assertEqual(row['history'],stages[:stages.index(row['status'])+1])
                self.assertIn('migration not applied',row['validation']['scope'])

    def test_transferable_assignments_cover_every_topic_without_shared_output_files(self):
        progress=json.loads((ROOT/'website/content/dbms-sql/progress.json').read_text())
        manifest=json.loads((ROOT/'website/content/dbms-sql/assignments.json').read_text())
        assigned=[topic for stream in manifest['workstreams'] for batch in stream['batches'] for topic in batch['topics']]
        assigned+=manifest['completed_outside_queue']
        expected={row['slug']:row for row in progress['topics']}
        self.assertEqual(manifest['total_existing_topics'],len(expected))
        self.assertEqual(len(assigned),len(expected))
        self.assertEqual({topic['slug'] for topic in assigned},set(expected))
        self.assertEqual(len({topic['exclusive_file'] for topic in assigned}),len(expected))
        self.assertEqual(len(manifest['agents_started']),len(set(manifest['agents_started'])))
        self.assertTrue(all(agent.startswith('/root/') for agent in manifest['agents_started']))
        for topic in assigned:
            row=expected[topic['slug']]
            self.assertEqual(topic['id'],row['source_ref'])
            self.assertEqual(topic['title'],row['title'])
            self.assertEqual(topic['exclusive_file'],row['exclusive_file'])
            self.assertEqual(topic['status'],row['status'])

    def test_new_coverage_has_separate_inventory_and_draft_only_insertions(self):
        progress=json.loads((ROOT/'website/content/dbms-sql/progress.json').read_text())
        manifest=json.loads((ROOT/'website/content/dbms-sql/assignments.json').read_text())
        coverage=[p for p in PACKAGES if p.get('new_coverage')]
        self.assertEqual({p['slug'] for p in coverage},{t['slug'] for t in progress.get('coverage_topics',[])})
        self.assertEqual({p['slug'] for p in coverage},{t['slug'] for t in manifest.get('new_coverage',[])})
        self.assertEqual(progress['summary']['missing_topics_added'],len(coverage))
        existing_validated=sum(t['status']=='validated' for t in progress['topics'])
        self.assertEqual(progress['summary']['locally_validated_topics'],existing_validated)
        self.assertEqual(progress['summary']['locally_validated_existing_topics'],existing_validated)
        self.assertEqual(progress['summary']['locally_validated_coverage_packages'],sum(t['status']=='validated' for t in progress.get('coverage_topics',[])))
        self.assertTrue(all(t['publication_status']=='draft' for t in progress.get('coverage_topics',[])))
        self.assertEqual(set(manifest['completed_local_topics']),{t['slug'] for t in progress['topics'] if t['status']=='validated'})
        self.assertEqual(set(manifest['locally_checked_coverage_drafts']),{t['slug'] for t in progress.get('coverage_topics',[]) if t['status']=='validated'})
        self.assertTrue(all(t['publication_status']=='draft' for t in manifest.get('new_coverage',[])))
        for package in coverage:
            self.assertEqual(package['original_questions'],[])
            self.assertEqual(sum(len(t['questions']) for t in package['tests']),20)
            sql=build.render([package],{})
            self.assertIn('New coverage identity collision',sql)
            self.assertIn('Previously empty coverage group now populated',sql)
            self.assertIn('New coverage content identity collision',sql)
            self.assertIn("'draft',g.is_premium,g.show_on_website and s.show_on_website",sql)
            self.assertIn("false,'Medium',t.grid_id,t.id,'draft',t.is_premium",sql)
            self.assertNotIn('s.is_premium',sql)  # Sections have no premium column.
            self.assertNotRegex(sql,r'update public.learning_(?:grids|sections)')
            body=sql.split('do $dbms_rewrite$',1)[1].rsplit('$dbms_rewrite$',1)[0]
            _,literals=build.audit.mask_literals(body)
            metadata=[json.loads(value) for value in literals if value.startswith('{') and 'authoring_origin' in value]
            self.assertEqual(metadata[0]['authoring_origin'],'dbms_sql_rebuild_coverage')

    def test_dml_and_ddl_starters_describe_the_requested_operation(self):
        for package in PACKAGES:
            for problem in package['coding_problems']:
                if problem.get('starter_sql'):
                    sql=build.render([package],build.source_notes())
                    self.assertIn(build.quoted(json.dumps({'sql':problem['starter_sql']}))+'::jsonb',sql)


if __name__=='__main__':unittest.main()
