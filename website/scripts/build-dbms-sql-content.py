#!/usr/bin/env python3
"""Validate authored DBMS packages and prepare (never execute) paired SQL.

Canonical authored inputs: website/content/dbms-sql/topics/*.json.
Run from any directory: python3 website/scripts/build-dbms-sql-content.py
The progress file distinguishes local package validation from unapplied SQL
and unavailable independent/browser review. Existing question IDs, canonical
option positions and saved attempt records are retained.
"""
import hashlib
import importlib.util
import json
import pathlib
import re
import sys
import uuid
sys.dont_write_bytecode = True
ROOT = pathlib.Path(__file__).resolve().parents[2]
BASE = ROOT / 'website/content/dbms-sql'
spec = importlib.util.spec_from_file_location('dbms_audit', ROOT / 'website/scripts/audit-dbms-sql.py')
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


def quoted(value):
    return "'" + str(value).replace("'", "''") + "'"


def source_notes():
    notes = {}
    for path in audit.SEEDS:
        text, literals = audit.mask_literals(path.read_text())
        for statement in text.split(';'):
            match = re.search(r'insert into public.learning_contents\s*\((.*?)\)\s*select\s+(.*?)\s+from t\b', statement, re.S | re.I)
            if not match:
                continue
            ref = re.search(r'source_ref\s*=\s*@(\d+)@', statement)
            row = {col.strip(): audit.value(expr, literals) for col, expr in zip(match[1].split(','), audit.split_fields(match[2]))}
            notes[literals[int(ref[1])]] = row['body']
    return notes


def validate(package):
    errors = []
    words = len(audit.notes_prose(package['notes']))
    if not 1200 <= words <= 1500:
        errors.append(f'notes contain {words} words')
    headings = re.findall(r'(?m)^#{1,6}\s+(.+)$', package['notes'])
    if any(audit.FORBIDDEN.search(heading) for heading in headings + [package['title']]):
        errors.append('prohibited heading')
    if re.search(r'(?m)^#\s', package['notes']):
        errors.append('notes must not introduce a second H1')
    if len(package['tests']) != 2:
        errors.append('requires exactly two tests')
    seen, ids = set(), set()
    for number, test in enumerate(package['tests'], 1):
        if test['title'] != f'MCQ Test {number}' or len(test['questions']) != 10:
            errors.append('invalid test label/count')
        for question in test['questions']:
            text = ' '.join(question['question_text'].casefold().split())
            if text in seen or question['id'] in ids:
                errors.append('duplicate question')
            seen.add(text)
            ids.add(question['id'])
            options = question['options']
            if len(options) != 4 or len({x.strip().casefold() for x in options}) != 4:
                errors.append('options must be four distinct values')
            if type(question['correct_index']) is not int or not 0 <= question['correct_index'] < 4:
                errors.append('invalid correct index')
            if not question['explanation'].strip() or question['test_id'] != test['id']:
                errors.append('missing explanation or incorrect test owner')
    problems = package['coding_problems']
    if bool(problems) == bool(package.get('coding_not_applicable')):
        errors.append('record exactly two problems OR a reason for not applicable')
    if problems:
        levels = {p['difficulty'] for p in problems}
        retained_hard = levels == {'Easy', 'Hard'} and all(
            p.get('existing_problem') for p in problems if p['difficulty'] == 'Hard'
        )
        if len(problems) != 2 or not (levels == {'Easy', 'Medium'} or retained_hard):
            errors.append('requires one beginner and one intermediate problem, or a retained advanced problem')
        for problem in problems:
            for key in ['id', 'slug', 'title', 'task', 'schema_sql', 'seed_sql', 'expected', 'ordering', 'edge_cases', 'hints', 'solution_sql', 'explanation', 'validation_cases']:
                if key in {'schema_sql', 'seed_sql'} and problem.get('existing_problem') and isinstance(problem.get(key), str):
                    continue  # Retained DDL exercises can start with an empty schema.
                if not problem.get(key):
                    errors.append(f'missing problem field: {key}')
            if problem.get('original_check_sql') is not None and (
                not problem.get('existing_problem') or problem.get('check_sql') != problem['original_check_sql']
            ):
                errors.append('original trailing checker must be retained unchanged')
    if not package['description'].strip():
        errors.append('missing description')
    for diagram in package.get('diagrams', []):
        if diagram.get('kind')=='weak-entity-er':
            if not diagram.get('caption') or not diagram.get('description') or any(not isinstance(diagram.get(key),str) or not diagram[key].strip() or len(diagram[key])>32 for key in ['owner','ownerKey','relationship','dependent','partialKey']):
                errors.append('weak entity ER requires bounded labels, caption and description')
            continue
        if diagram.get('kind')!='table' or not diagram.get('caption') or not diagram.get('description'):
            errors.append('diagram requires a supported representation, caption and text explanation')
        columns=diagram.get('columns', [])
        rows=diagram.get('rows', [])
        if not columns or not rows or not all(isinstance(c,str) and c.strip() for c in columns):
            errors.append('diagram requires labeled columns and nonempty rows')
        if any(not isinstance(row,list) or len(row)!=len(columns) or not all(isinstance(c,str) for c in row) for row in rows):
            errors.append('diagram table shape is invalid')
    originals = package.get('original_questions', [])
    expected_originals = 0 if package.get('new_coverage') else 8
    if package.get('new_coverage'):
        uuid.UUID(package['integration']['new_topic_id'])
        uuid.UUID(package['integration']['new_content_id'])
        if package['source_ref'] != package['section_slug']+'/'+package['slug']:
            errors.append('new coverage source reference does not match its owner')
    if len(originals) != expected_originals or any(
        original['id'] != current['id'] or original['correct_index'] != current['correct_index']
        for original, current in zip(originals, package['tests'][0]['questions'])
    ):
        errors.append('original question IDs and canonical correct indices must be preserved')
    if errors:
        raise ValueError(package['slug'] + ': ' + '; '.join(errors))
    return words


def render(packages, originals, *, coverage_owners=None):
    # One DO statement makes every guard and all content writes atomic even
    # when a caller does not wrap an entire migration file in a transaction.
    lines = ["-- Generated from website/content/dbms-sql/topics/*.json.",
             "-- Content only. No schema/RLS/auth/visibility/premium changes.",
             "-- Preserve IDs, URLs, saved attempts and original answer indices.",
             "-- Guarded against edited notes, ID collisions and extra tests.",
             "-- Newly created tests inherit all publication/platform/premium flags.",
             "-- Rollback requires a reviewed reverse content migration from the seed",
             "-- snapshot; never delete questions referenced by saved attempts.",
             'do $dbms_rewrite$', 'declare topic_uuid uuid; section_uuid uuid; begin']
    # An additive batch may share a coverage section with an earlier snapshot.
    # Its caller supplies the verified prior identities; no prior rows are edited.
    coverage_owners = packages if coverage_owners is None else coverage_owners
    for p in packages:
        slug, ref = p['slug'], p['source_ref']
        references = '\n'.join('- ['+r['title']+']('+r['url']+')' for r in p['references'])
        body_text = p['notes'] + ('\n\n## References\n\n'+references if references else '')
        diagrams=p.get('diagrams', [])
        old_md5 = hashlib.md5(originals.get(ref,body_text).encode()).hexdigest()
        new_md5 = hashlib.md5(body_text.encode()).hexdigest()
        first, second = p['tests']
        if p.get('new_coverage'):
            topic_id = quoted(p['integration']['new_topic_id'])
            content_id = quoted(p['integration']['new_content_id'])
            owned_ids = ','.join(quoted(other['integration']['new_topic_id']) for other in coverage_owners if other.get('new_coverage') and other['section_slug']==p['section_slug'])
            lines.extend([
                '-- New coverage is created as draft; no existing publication or access flags are changed.',
                f"select s.id into strict section_uuid from public.learning_sections s join public.learning_grids g on g.id=s.grid_id where lower(g.slug)='dbms-sql-tutorial' and lower(s.slug)={quoted(p['section_slug'])};",
                f"if exists(select 1 from public.learning_topics where section_id=section_uuid and id not in ({owned_ids})) then raise exception 'Previously empty coverage group now populated; review before inserting: %', {quoted(p['section_slug'])}; end if;",
                f"if exists(select 1 from public.learning_topics t where (t.id={topic_id} or (t.grid_id=(select grid_id from public.learning_sections where id=section_uuid) and lower(t.slug)={quoted(slug)}) or (t.source_kind='dbms_sql_tutorial' and t.source_ref={quoted(ref)})) and (t.id<>{topic_id} or t.section_id<>section_uuid or t.source_kind is distinct from 'dbms_sql_tutorial' or t.source_ref is distinct from {quoted(ref)} or lower(t.slug)<>{quoted(slug)})) then raise exception 'New coverage identity collision: %', {quoted(slug)}; end if;",
                'insert into public.learning_topics (id,section_id,grid_id,title,slug,short_description,sort_order,status,is_premium,show_on_website,show_on_mobile,source_kind,source_ref) '
                + f"select {topic_id},s.id,s.grid_id,{quoted(p['title'])},{quoted(slug)},{quoted(p['description'])},{int(p['sort_order'])},'draft',g.is_premium,g.show_on_website and s.show_on_website,g.show_on_mobile and s.show_on_mobile,'dbms_sql_tutorial',{quoted(ref)} from public.learning_sections s join public.learning_grids g on g.id=s.grid_id where s.id=section_uuid on conflict(id) do nothing;",
                f"if exists(select 1 from public.learning_contents where id={content_id} and topic_id<>{topic_id}) then raise exception 'New coverage content identity collision: %', {quoted(slug)}; end if;",
                'insert into public.learning_contents (id,topic_id,heading,body,content_format,metadata,sort_order,status,is_premium) '
                + f"select {content_id},t.id,{quoted(p['title'])},{quoted(body_text)},'markdown','{{\"source\":\"dbms_sql_tutorial_seed\",\"authoring_origin\":\"dbms_sql_rebuild_coverage\"}}'::jsonb,0,'draft',t.is_premium from public.learning_topics t where t.id={topic_id} on conflict(id) do nothing;",
                'insert into public.practice_tests (id,title,category,question_count,duration_minutes,description,total_marks,pass_marks,is_published,difficulty,learning_grid_id,learning_topic_id,status,is_premium,negative_marking,instructions,show_on_website,show_on_mobile,scope) '
                + f"select {quoted(first['id'])},'MCQ Test 1','aptitude',10,10,{quoted('Concepts and fundamentals for '+p['title']+'.')},10,4,false,'Medium',t.grid_id,t.id,'draft',t.is_premium,0,'Answer all ten questions. One mark each; no negative marking.',t.show_on_website,t.show_on_mobile,'topic' from public.learning_topics t where t.id={topic_id} on conflict(id) do nothing;",
            ])
        lines.extend([
            f'-- {slug}',
            f"select t.id into strict topic_uuid from public.learning_topics t join public.learning_grids g on g.id=t.grid_id where t.source_kind='dbms_sql_tutorial' and t.source_ref={quoted(ref)} and lower(g.slug)='dbms-sql-tutorial';",
            "if (select count(*) from public.learning_contents c where c.topic_id=topic_uuid and c.metadata->>'source'='dbms_sql_tutorial_seed') <> 1 then raise exception 'Expected one canonical note block: %', " + quoted(slug) + '; end if;',
            "if (select count(*) from public.learning_contents c where c.topic_id=topic_uuid) <> 1 then raise exception 'Additional content blocks require review: %', " + quoted(slug) + '; end if;',
            "if exists(select 1 from public.learning_contents c where c.topic_id=topic_uuid and c.metadata->>'source'='dbms_sql_tutorial_seed' and md5(c.body) not in (" + quoted(old_md5) + ',' + quoted(new_md5) + ")) then raise exception 'Notes changed since seed; review before applying: %', " + quoted(slug) + '; end if;',
            f"if not exists(select 1 from public.practice_tests where id={quoted(first['id'])} and learning_topic_id=topic_uuid and scope='topic') then raise exception 'Missing original topic test: %', {quoted(slug)}; end if;",
            f"if exists(select 1 from public.practice_tests where id={quoted(first['id'])} and coalesce(negative_marking,0)<>0) then raise exception 'Custom scoring requires review: %', {quoted(slug)}; end if;",
            f"if exists(select 1 from public.practice_tests where learning_topic_id=topic_uuid and scope='topic' and id not in ({quoted(first['id'])},{quoted(second['id'])})) then raise exception 'Extra topic tests require manual integration: %', {quoted(slug)}; end if;",
            f"if exists(select 1 from public.practice_tests where id={quoted(second['id'])} and learning_topic_id is distinct from topic_uuid) then raise exception 'Test ID collision: %', {quoted(slug)}; end if;",
        ])
        if diagrams:
            value=quoted(json.dumps(diagrams,ensure_ascii=False))+'::jsonb'
            lines.append(f"if exists(select 1 from public.learning_contents where topic_id=topic_uuid and metadata->'dbms_diagrams_v1' is not null and metadata->'dbms_diagrams_v1' is distinct from {value}) then raise exception 'Edited diagram metadata requires review: %', {quoted(slug)}; end if;")
            lines.append(f"update public.learning_contents set metadata=jsonb_set(coalesce(metadata,'{{}}'::jsonb),'{{dbms_diagrams_v1}}',{value}),updated_at=now() where topic_id=topic_uuid and metadata->>'source'='dbms_sql_tutorial_seed' and metadata->'dbms_diagrams_v1' is distinct from {value};")
        for test in p['tests']:
            qids = ','.join(quoted(q['id']) for q in test['questions'])
            lines.append(f"if exists(select 1 from public.test_questions where test_id={quoted(test['id'])} and id not in ({qids})) then raise exception 'Unexpected questions require review: %', {quoted(test['id'])}; end if;")
            lines.append(f"if exists(select 1 from public.test_questions where test_id={quoted(test['id'])} and marks<>1) then raise exception 'Custom question marks require review: %', {quoted(test['id'])}; end if;")
            for q in test['questions']:
                lines.append(f"if exists(select 1 from public.test_questions where id={quoted(q['id'])} and test_id<>{quoted(test['id'])}) then raise exception 'Question ID collision: %', {quoted(q['id'])}; end if;")
                original = next((old for old in p['original_questions'] if old['id']==q['id']), q)
                if q['id'] in {old['id'] for old in p['original_questions']}:
                    lines.append(f"if not exists(select 1 from public.test_questions where id={quoted(q['id'])} and test_id={quoted(test['id'])}) then raise exception 'Original question was removed; review required: %', {quoted(q['id'])}; end if;")
                def fields(question):
                    return '('+','.join([quoted(question['question_text']),quoted(json.dumps(question['options']))+'::jsonb',str(question['correct_index']),quoted(question['explanation'])])+')'
                lines.append(f"if exists(select 1 from public.test_questions where id={quoted(q['id'])} and (question_text,options,correct_index,explanation) is distinct from {fields(original)} and (question_text,options,correct_index,explanation) is distinct from {fields(q)}) then raise exception 'Edited question requires review: %', {quoted(q['id'])}; end if;")
        lines.extend([
            "update public.learning_contents set body=" + quoted(body_text) + ",heading=" + quoted(p['title']) + ",updated_at=now() where topic_id=topic_uuid and metadata->>'source'='dbms_sql_tutorial_seed' and (body is distinct from " + quoted(body_text) + ' or heading is distinct from ' + quoted(p['title']) + ');',
            'update public.learning_topics set short_description=' + quoted(p['description']) + ',updated_at=now() where id=topic_uuid and short_description is distinct from ' + quoted(p['description']) + ';',
            f"update public.practice_tests set title='MCQ Test 1',question_count=10,total_marks=10,pass_marks=4,duration_minutes=10,description={quoted('Concepts and fundamentals for '+p['title']+'.')},instructions='Answer all ten questions. One mark each; no negative marking.',updated_at=now() where id={quoted(first['id'])} and (title<>'MCQ Test 1' or question_count<>10 or total_marks<>10);",
            "insert into public.practice_tests (id,title,category,question_count,duration_minutes,description,total_marks,pass_marks,is_published,difficulty,learning_grid_id,learning_topic_id,status,is_premium,negative_marking,instructions,show_on_website,show_on_mobile,scope) "
            + f"select {quoted(second['id'])},'MCQ Test 2',category,10,10,{quoted('Application and scenarios for '+p['title']+'.')},10,4,is_published,difficulty,learning_grid_id,learning_topic_id,status,is_premium,0,'Answer all ten questions. One mark each; no negative marking.',show_on_website,show_on_mobile,'topic' from public.practice_tests where id={quoted(first['id'])} on conflict(id) do nothing;",
        ])
        for test in p['tests']:
            for question in test['questions']:
                fields = [quoted(question['id']), quoted(test['id']), quoted(question['question_text']), quoted(json.dumps(question['options'],ensure_ascii=False))+'::jsonb', str(question['correct_index']), quoted(question['explanation']), '1', str(question['sort_order'])]
                lines.append('insert into public.test_questions (id,test_id,question_text,options,correct_index,explanation,marks,sort_order) values (' + ','.join(fields) + ') on conflict(id) do update set question_text=excluded.question_text,options=excluded.options,correct_index=excluded.correct_index,explanation=excluded.explanation where (test_questions.question_text,test_questions.options,test_questions.correct_index,test_questions.explanation) is distinct from (excluded.question_text,excluded.options,excluded.correct_index,excluded.explanation);')
        problem_ids = ','.join(quoted(problem['id']) for problem in p['coding_problems'])
        if problem_ids:
            lines.append(f"if exists(select 1 from public.dsa_problems where learning_topic_id=topic_uuid and id not in ({problem_ids})) then raise exception 'Existing coding problems require explicit integration: %', {quoted(slug)}; end if;")
        for index, problem in enumerate(p['coding_problems']):
            lines.append(f"if exists(select 1 from public.dsa_problems where (id={quoted(problem['id'])} or slug={quoted(problem['slug'])}) and (id<>{quoted(problem['id'])} or learning_topic_id is distinct from topic_uuid)) then raise exception 'Coding ID/slug collision: %', {quoted(problem['id'])}; end if;")
            statement = problem['task']+'\n\n**MySQL dialect.**\n\n```sql\n'+problem['schema_sql']+'\n'+problem['seed_sql']+'\n```\n\n**Required ordering:** '+problem['ordering']+'\n\n**Edge cases:**\n'+'\n'.join('- '+edge for edge in problem['edge_cases'])
            example = [{'input':problem['seed_sql'], 'output':problem['expected'], 'explanation':problem['explanation']}]
            cases = [{'seed_sql':case['seed_sql'], 'expected':case['expected'], 'hidden':True} for case in problem['validation_cases']]
            if problem.get('check_sql') is not None:
                example[0]['check_sql'] = problem['check_sql']
            for output_case, input_case in zip(cases, problem['validation_cases']):
                if 'check_sql' in input_case:
                    output_case['check_sql'] = input_case['check_sql']
            # The existing RPC exposes editorial before solution_code unlocks.
            # Keep executable reference code only in the gated solution_code.
            editorial = problem['explanation']
            columns = 'id,topic_id,title,difficulty,slug,description,examples,test_cases,constraints,hints,starter_code,editorial,solution_code,solution_approach,supported_languages,sql_schema_sql,sql_seed_sql,learning_topic_id,status,is_premium,show_on_website,show_on_mobile,sort_order'
            values = [quoted(problem['id']), 'null::text', quoted(problem['title']), quoted(problem['difficulty']), quoted(problem['slug']), quoted(statement), quoted(json.dumps(example))+'::jsonb', quoted(json.dumps(cases))+'::jsonb', quoted(json.dumps(problem.get('constraints',[])))+'::jsonb', quoted(json.dumps(problem['hints']))+'::jsonb', quoted(json.dumps({'sql':problem.get('starter_sql','-- Write your SELECT query here\n')}))+'::jsonb', quoted(editorial), quoted(json.dumps({'sql':problem['solution_sql']}))+'::jsonb', quoted(problem['explanation']), "array['sql']", quoted(problem['schema_sql']), quoted(problem['seed_sql']), 'topic_uuid', 'parent.status', 'parent.is_premium', 'parent.show_on_website', 'parent.show_on_mobile', str(index)]
            if problem.get('existing_problem'):
                lines.append(f"if not exists(select 1 from public.dsa_problems where id={quoted(problem['id'])} and learning_topic_id=topic_uuid) then raise exception 'Original coding problem was removed; review required: %', {quoted(problem['id'])}; end if;")
                expected_check = quoted(problem['original_check_sql']) if problem.get('original_check_sql') is not None else 'null'
                lines.append(f"if exists(select 1 from public.dsa_problems where id={quoted(problem['id'])} and (md5(description) not in ({quoted(problem['original_description_md5'])},{quoted(hashlib.md5(statement.encode()).hexdigest())}) or sql_schema_sql is distinct from {quoted(problem['schema_sql'])} or sql_seed_sql is distinct from {quoted(problem['seed_sql'])} or sql_check_sql is distinct from {expected_check})) then raise exception 'Edited coding problem requires review: %', {quoted(problem['id'])}; end if;")
                content_fields = ['description','examples','test_cases','constraints','hints','editorial','solution_code','solution_approach']
                updates = ','.join(f'{key}=excluded.{key}' for key in content_fields)
                current = '('+','.join('dsa_problems.'+key for key in content_fields)+')'
                incoming = '('+','.join('excluded.'+key for key in content_fields)+')'
                conflict = f' do update set {updates},updated_at=now() where {current} is distinct from {incoming}'
            else:
                lines.append(f"if exists(select 1 from public.dsa_problems where id={quoted(problem['id'])} and description is distinct from {quoted(statement)}) then raise exception 'New coding ID already has other content: %', {quoted(problem['id'])}; end if;")
                conflict = ' do nothing'
            lines.append('insert into public.dsa_problems ('+columns+') select '+','.join(values)+f" from public.practice_tests parent where parent.id={quoted(first['id'])} on conflict(id)"+conflict+';')
    lines.extend(['end', '$dbms_rewrite$;'])
    return '\n'.join(lines)+'\n'


def main():
    packages = [json.loads(path.read_text()) for path in sorted((BASE/'topics').glob('*.json'))]
    if not packages:
        raise ValueError('No authored packages')
    counts = {p['slug']: validate(p) for p in packages}
    originals = source_notes()
    for p in packages:
        if p.get('new_coverage') and p['source_ref'] in originals:
            raise ValueError('New coverage already exists in the seed inventory: '+p['slug'])
        if not p.get('new_coverage') and hashlib.sha256(originals[p['source_ref']].encode()).hexdigest() != p['integration']['original_note_sha256']:
            raise ValueError('Source snapshot changed: '+p['slug'])
    body = render(packages, originals)
    for relative in ['mobile-app/supabase/migrations/0151_dbms_sql_content_rewrite_batch01.sql', 'admin-panel/supabase/migrations/121_dbms_sql_content_rewrite_batch01.sql']:
        (ROOT/relative).write_text('-- '+relative+'\n-- CANONICAL PAIRED CONTENT MIGRATION\n-- BODY\n'+body)
    order = ROOT/'mobile-app/supabase/tests/harness/chain_order.txt'
    chain = order.read_text()
    for entry in ['mobile 0151_dbms_sql_content_rewrite_batch01.sql', 'admin 121_dbms_sql_content_rewrite_batch01.sql']:
        if entry not in chain.splitlines():
            chain += entry+'\n'
    order.write_text(chain)
    progress = json.loads((BASE/'progress.json').read_text())
    inventory = progress['topics'] + progress.get('coverage_topics',[])
    for row in inventory:
        if row['slug'] not in counts:
            continue
        p = next(p for p in packages if p['slug']==row['slug'])
        proof = p.get('sql_verification', {})
        fingerprint = hashlib.sha256(json.dumps(p['coding_problems'], sort_keys=True).encode()).hexdigest()
        sql_verified = not p['coding_problems'] or (proof.get('all_passed') is True and proof.get('fingerprint')==fingerprint)
        diagrams_verified = not p.get('diagrams') or p.get('diagram_review',{}).get('server_rendering')=='passed'
        package_verified = sql_verified and diagrams_verified
        stages = ['reviewed','integrated'] + (['validated'] if package_verified else [])
        for stage in stages:
            if stage not in row['history']:
                row['history'].append(stage)
        row['status']='validated' if package_verified else 'integrated'
        if p.get('new_coverage'):
            row['publication_status']='draft'
        if not package_verified and 'validated' in row['history']:
            row['history'].remove('validated')
        row['validation']={'scope':'local authored package; migration not applied; no browser/independent review', 'notes_words':counts[row['slug']], 'tests':2, 'questions':20, 'coding_problems':len(p['coding_problems']), 'coding_not_applicable':p['coding_not_applicable'], 'sql_execution':'not applicable' if not p['coding_problems'] else proof if sql_verified else 'pending'}
        row['validation']['diagrams']={'count':len(p.get('diagrams',[])), **p.get('diagram_review',{'applicability':'not yet reviewed','server_rendering':'not applicable'})}
        row['validation']['independent_review']=p['review'].get('independent_review','pending')
        p['integration']['status']='paired migration prepared; not applied'
        (BASE/'topics'/f"{p['slug']}.json").write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
    progress['validation_scope']='validated is local package validation only; does not imply applied SQL, live rendering, independent review or browser QA'
    progress['summary']={
        'authored_topics':len(packages),
        'drafted_topics':len(packages),
        'independently_reviewed_topics':sum(p['review'].get('independent_review')=='passed' for p in packages),
        'integrated_into_prepared_migrations':len(packages),
        'live_verified_topics':0,
        'locally_validated_topics':sum(row['status']=='validated' for row in progress['topics']),
        'locally_validated_existing_topics':sum(row['status']=='validated' for row in progress['topics']),
        'locally_validated_coverage_packages':sum(row['status']=='validated' for row in progress.get('coverage_topics',[])),
        'pending_existing_topics':sum(row['status']!='validated' for row in progress['topics']),
        'prepared_tests':2*len(packages),
        'new_tests':sum(2 if p.get('new_coverage') else 1 for p in packages),
        'prepared_questions':20*len(packages),
        'new_questions':sum(20 if p.get('new_coverage') else 12 for p in packages),
        'retained_question_identities':sum(len(p['original_questions']) for p in packages),
        'prepared_coding_problems':sum(len(p['coding_problems']) for p in packages),
        'topics_with_coding_exercises':sum(bool(p['coding_problems']) for p in packages),
        'topics_coding_not_applicable':sum(bool(p['coding_not_applicable']) for p in packages),
        'topics_pending_coding_applicability':sum(row['slug'] not in counts for row in inventory),
        'new_coding_problems':sum(not problem.get('existing_problem',False) for p in packages for problem in p['coding_problems']),
        'rewritten_existing_coding_problems':sum(bool(problem.get('existing_problem')) for p in packages for problem in p['coding_problems']),
        'executed_compatibility_cases':sum(len(p.get('sql_verification',{}).get('cases',[])) for p in packages),
        'executed_native_reference_cases':len(progress.get('native_reference_verification',{}).get('cases',[])),
        'prepared_diagrams':sum(len(p.get('diagrams',[])) for p in packages),
        'server_rendered_diagrams':sum(len(p.get('diagrams',[])) for p in packages if p.get('diagram_review',{}).get('server_rendering')=='passed'),
        'fully_complete_topics':sum(p['slug'] in {row['slug'] for row in inventory if row['status']=='validated'} and p['review'].get('independent_review')=='passed' and p.get('release_validation',{}).get('desktop_mobile_qa')=='passed' for p in packages),
        'missing_topics_added':sum(bool(p.get('new_coverage')) for p in packages),'consolidated_topics':0,'applied_migrations':0,
        'explanatory_words':sum(counts.values()),
    }
    progress['checkpoint']['remaining_topics']=[row['slug'] for row in progress['topics'] if row['status']!='validated']
    progress['checkpoint']['next_topics']=progress['checkpoint']['remaining_topics'][:6]
    progress['checkpoint']['resume_start']=next(iter(progress['checkpoint']['remaining_topics']),None)
    progress['checkpoint']['authored_topics']=[p['slug'] for p in packages]
    progress['checkpoint']['remaining_verification_topics']=[p['slug'] for p in packages if p['review'].get('independent_review')!='passed' or p.get('release_validation',{}).get('desktop_mobile_qa')!='passed']
    for batch in progress.get('batch_queue',[]):
        states={row['slug']:row['status'] for row in progress['topics']}
        batch['state']='locally_validated' if all(states[slug]=='validated' for slug in batch['topics']) else 'in_progress' if any(states[slug]!='pending' for slug in batch['topics']) else 'queued'
    progress['checkpoint']['next_actions']=[
        'Author the next six pending topic packages using the same JSON contract; inspect their eight original MCQs and existing coding problems before writing.',
        'Keep existing question IDs/correct indices; correct inaccurate wording with an explicit editorial record. Add two fundamentals questions and ten application questions.',
        'Prepare two exercises for meaningful SQL topics; preserve existing problem identities. Mark genuinely theoretical topics not applicable with a reason.',
        'Run the package builder and scratch SQL verifier. Record the exact database engine; do not describe MariaDB as MySQL/provider verification.',
        'Verify full-page coding in desktop/mobile browsers and complete independent review; do not count prepared migrations as live content.',
    ]
    progress['checkpoint']['resume_command']='python3 website/scripts/build-dbms-sql-content.py'
    progress['checkpoint']['migration_state']='0151/121 prepared, not applied; do not regenerate an applied migration'
    progress['checkpoint']['verification_gaps']={
        'application_migration':'prepared only; not executed against a Supabase schema',
        'sql':f"{progress['summary']['executed_compatibility_cases']} recorded compatibility cases; see per-package engine and fingerprints. MySQL 8.4 and hosted provider unverified",
        'browser':progress['checkpoint'].get('verification_gaps',{}).get('browser','desktop/mobile visual QA not performed'),
        'independent_review':'agent tools unavailable; coordinator review only',
        'page_integration':'inline coding implemented using the existing ProblemPanel, detail RPC and solution gate; server-render/access tests passed, browser and applied-migration behavior unverified',
        'build':progress['checkpoint'].get('verification_gaps',{}).get('build','not run'),
    }
    (BASE/'progress.json').write_text(json.dumps(progress,indent=2)+'\n')
    # Keep the transferable ownership inventory current as batches integrate.
    assignment_path = BASE/'assignments.json'
    if assignment_path.exists():
        assignments = json.loads(assignment_path.read_text())
        rows = {row['slug']: row for row in inventory}
        assignments['completed_local_topics'] = [row['slug'] for row in progress['topics'] if row['status']=='validated']
        assignments['locally_checked_coverage_drafts'] = [row['slug'] for row in progress.get('coverage_topics',[]) if row['status']=='validated']
        for topic in assignments.get('new_coverage',[]):
            topic['status'] = rows[topic['slug']]['status']
            topic['publication_status'] = 'draft'
            topic['review_status'] = rows[topic['slug']].get('validation',{}).get('independent_review','pending')
        for stream in assignments['workstreams']:
            for batch in stream['batches']:
                for topic in batch['topics']:
                    row = rows[topic['slug']]
                    topic['status'] = row['status']
                    topic['review_status'] = row.get('validation',{}).get('independent_review','pending')
        assignment_path.write_text(json.dumps(assignments,indent=2)+'\n')
    print(json.dumps({'locally_validated_packages':sum(row['status']=='validated' for row in inventory),'words':counts,'prepared_migrations':['0151','121'],'applied_migrations':0}))


if __name__=='__main__':
    main()
