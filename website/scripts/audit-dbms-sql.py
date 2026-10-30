#!/usr/bin/env python3
"""Read-only audit of repository DBMS/SQL seeds, never a live DB inventory.

Run: python3 scripts/audit-dbms-sql.py [--output /tmp/dbms-audit.json] [--check]
--check exits nonzero while any topic fails the requested rebuild criteria.
The SQL reader supports the literal INSERTs in these seeds and rejects an
unrecognised shape rather than silently dropping a topic from the inventory.
"""

import argparse
import collections
import hashlib
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[2]
SEEDS = sorted((ROOT / "mobile-app/supabase/migrations").glob("009[2-9]_seed_dbms_sql_*.sql"))
FORBIDDEN = re.compile(r"\b(chapter|unit|module|lesson|part|section)\b", re.I)


def mask_literals(sql):
    """Hide strings and comments before inspecting statement boundaries."""
    literals = []
    pattern = re.compile(r"--[^\n]*|/\*.*?\*/|(?P<tag>\$[A-Za-z_][A-Za-z_0-9]*\$|\$\$).*?(?P=tag)|'(?:''|[^'])*'", re.S)

    def replace(match):
        raw = match.group()
        if raw.startswith(("--", "/*")):
            return " "
        if raw.startswith("$"):
            tag = match.group("tag")
            value = raw[len(tag):-len(tag)]
        else:
            value = raw[1:-1].replace("''", "'")
        literals.append(value)
        return f"@{len(literals) - 1}@"

    return pattern.sub(replace, sql), literals


def split_fields(text):
    fields, start, depth = [], 0, 0
    for i, char in enumerate(text):
        if char == "(":
            depth += 1
        elif char == ")":
            depth -= 1
        elif char == "," and depth == 0:
            fields.append(text[start:i].strip())
            start = i + 1
    fields.append(text[start:].strip())
    return fields


def value(expr, literals):
    expr = expr.strip()
    match = re.fullmatch(r"@(\d+)@(?:::\w+)?", expr)
    if match:
        return literals[int(match[1])]
    if re.fullmatch(r"-?\d+", expr):
        return int(expr)
    return None


def notes_prose(body):
    """Conservative prose-only count; excludes headings, code, tables, Q&A.

    Lists explaining concepts count, but inline code and reference links do
    not. This is an editorial check, not a Google ranking threshold.
    """
    body = re.sub(r"```.*?```|~~~.*?~~~", "", body, flags=re.S)
    body = re.split(r"(?im)^#{1,6}\s+(?:references|sources|practice|mcq|coding|key takeaways\s*/\s*interview).*$", body)[0]
    lines = [line for line in body.splitlines() if not re.match(r"\s*(?:#{1,6}\s|\||\*\*Q:|Q:|A:)", line)]
    body = re.sub(r"`[^`]*`|!?\[[^\]]*\]\([^)]*\)", "", "\n".join(lines))
    return re.findall(r"\b[\w]+(?:['’-][\w]+)*\b", body)


def audit(files=SEEDS):
    if not files:
        raise ValueError("No DBMS/SQL seed files were found")
    topics, sections, tests, questions, problems = {}, {}, {}, [], []
    source_counts = collections.Counter()
    for path in files:
        masked, literals = mask_literals(path.read_text())
        for statement in masked.split(";"):
            insert = re.search(r"insert into public\.(learning_topics|learning_sections|learning_contents|practice_tests|test_questions|dsa_problems)\s*\((.*?)\)\s*(select|values)\s+(.*)", statement, re.S | re.I)
            if not insert:
                continue
            table, columns, kind, payload = insert.groups()
            source_counts[table] += 1
            columns = [col.strip() for col in columns.split(",")]
            ref = re.search(r"source_ref\s*=\s*@(\d+)@", statement)
            source_ref = literals[int(ref[1])] if ref else None
            if kind.lower() == "select":
                expressions = split_fields(re.split(r"\s+from\s+[gt]\b", payload, maxsplit=1, flags=re.I)[0])
                if len(expressions) != len(columns):
                    raise ValueError(f"Unsupported {table} INSERT in {path.name}")
                row = {col: value(expr, literals) for col, expr in zip(columns, expressions)}
                row["source_file"] = str(path.relative_to(ROOT))
                row["source_ref_lookup"] = source_ref
                if table == "learning_topics":
                    key = row["source_ref"]
                    if not key or key in topics:
                        raise ValueError(f"Duplicate/missing topic key: {key}")
                    topics[key] = row
                elif table == "learning_sections":
                    sections[row["slug"]] = row
                elif table == "learning_contents":
                    if source_ref not in topics:
                        raise ValueError(f"Missing note owner: {source_ref}")
                    topics[source_ref]["body"] = row["body"]
                elif table == "practice_tests":
                    tests[row["id"]] = row
                elif table == "dsa_problems":
                    problems.append(row)
            elif table == "test_questions":
                # Seed VALUES have no expression parentheses except the row
                # itself: strings, numeric fields and the ::jsonb cast only.
                payload = re.split(r"\bon conflict\b", payload, maxsplit=1, flags=re.I)[0]
                rows = re.findall(r"\(([^()]*)\)", payload)
                if not rows:
                    raise ValueError(f"Unsupported question rows in {path.name}")
                for raw in rows:
                    expressions = split_fields(raw)
                    if len(expressions) != len(columns):
                        raise ValueError(f"Unsupported question columns in {path.name}")
                    row = {col: value(expr, literals) for col, expr in zip(columns, expressions)}
                    row["options"] = json.loads(row["options"])
                    questions.append(row)
            else:
                raise ValueError(f"Unsupported VALUES in {table}")

    if len(topics) != source_counts["learning_topics"] or len(problems) != source_counts["dsa_problems"]:
        raise ValueError("Inventory lost a source record")
    question_ids = [q["id"] for q in questions]
    if len(set(question_ids)) != len(question_ids):
        raise ValueError("Duplicate question IDs")
    if any(q["test_id"] not in tests for q in questions):
        raise ValueError("Question without a test")
    inventory = []
    for ref, topic in topics.items():
        body = topic.get("body", "")
        topic_tests = [test for test in tests.values() if test["source_ref_lookup"] == ref]
        topic_problems = [p for p in problems if p["source_ref_lookup"] == ref]
        issues = []
        word_count = len(notes_prose(body))
        if not 1200 <= word_count <= 1500:
            issues.append("notes_word_count")
        headings = re.findall(r"(?m)^#{1,6}\s+(.+)$", body)
        if any(FORBIDDEN.search(heading) for heading in headings + [topic["title"], sections[ref.split("/")[0]]["name"]]):
            issues.append("prohibited_heading")
        if len(topic_tests) != 2:
            issues.append("test_count")
        seen_questions, seen_ids, answers, test_details = set(), set(), [], []
        for test in topic_tests:
            qs = [q for q in questions if q["test_id"] == test["id"]]
            if len(qs) != 10 or test.get("question_count") != 10:
                issues.append("questions_per_test")
            for q in qs:
                key = " ".join(q["question_text"].lower().split())
                if key in seen_questions or q["id"] in seen_ids:
                    issues.append("duplicate_question")
                seen_questions.add(key)
                seen_ids.add(q["id"])
                options = q["options"]
                if len(options) != 4 or len({str(opt).strip().lower() for opt in options}) != 4:
                    issues.append("question_options")
                if not isinstance(q["correct_index"], int) or not 0 <= q["correct_index"] < 4:
                    issues.append("correct_index")
                if not q.get("explanation", "").strip():
                    issues.append("missing_explanation")
                answers.append(q["correct_index"])
            test_details.append({"id": test["id"], "question_count": len(qs)})
        if len(set(answers)) == 1 and answers:
            issues.append("constant_answer_position")
        if topic_problems and len(topic_problems) != 2:
            issues.append("coding_problem_count")
        # No inference that theory topics need no exercises: that requires an
        # editorial decision. Likewise reference SQL needs actual execution.
        issues.extend(["coding_applicability_unreviewed", "editorial_review_pending"])
        if not topic.get("short_description"):
            issues.append("missing_topic_description")
        inventory.append({
            "source_ref": ref, "slug": topic["slug"], "title": topic["title"],
            "url": f"/learning/dbms-sql-tutorial/{topic['slug']}",
            "source_file": topic["source_file"], "notes_words": word_count,
            "notes_sha256": hashlib.sha256(body.encode()).hexdigest(),
            "tests": test_details, "questions": len(answers),
            "coding_problems": [{"id": p["id"], "slug": p["slug"], "difficulty": p["difficulty"]} for p in topic_problems],
            "checklist": {"content": "pending", "assessments": "pending", "integration": "pending", "validation": "pending"},
            "issues": sorted(set(issues)),
        })
    populated = {ref.split("/")[0] for ref in topics}
    body_groups = collections.defaultdict(list)
    for row in inventory:
        body_groups[row["notes_sha256"]].append(row["slug"])
    return {
        "scope": "repository seed snapshot; excludes unobserved admin or production changes",
        "summary": {"topics": len(topics), "groups": len(sections), "empty_groups": len(set(sections) - populated),
                    "note_blocks": source_counts["learning_contents"], "topic_tests": sum(t["source_ref_lookup"] is not None for t in tests.values()),
                    "all_tests": len(tests), "questions": len(questions), "coding_problems": len(problems),
                    "complete_topics": sum(not row["issues"] for row in inventory)},
        "empty_groups": sorted(set(sections) - populated),
        "exact_duplicate_notes": [slugs for slugs in body_groups.values() if len(slugs) > 1],
        "issues": dict(collections.Counter(issue for row in inventory for issue in row["issues"])),
        "topics": inventory,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=pathlib.Path)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    result = audit()
    if args.output:
        args.output.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({key: val for key, val in result.items() if key != "topics"}, indent=2))
    if args.check and any(topic["issues"] for topic in result["topics"]):
        raise SystemExit(1)
