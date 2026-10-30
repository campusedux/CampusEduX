import importlib.util
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[3]
spec = importlib.util.spec_from_file_location("dbms_audit", ROOT / "website/scripts/audit-dbms-sql.py")
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


class DbmsAuditTests(unittest.TestCase):
    def test_sql_inside_dollar_quotes_is_not_parsed_as_seed_statements(self):
        sql = "-- ignore 'comment'\nselect $body$SELECT ';'; -- still content$body$, 'student''s';"
        masked, literals = audit.mask_literals(sql)
        self.assertEqual(literals, ["SELECT ';'; -- still content", "student's"])
        self.assertEqual(masked.count(";"), 1)

    def test_note_count_excludes_headings_code_tables_inline_code_and_assessments(self):
        text = """## Ignored title
These six words explain the concept.

```sql
SELECT several words FROM code;
```
| table | output |
`inline_code` Another useful explanation.
### MCQ Test 1
This question must never inflate notes.
"""
        self.assertEqual(audit.notes_prose(text), ["These", "six", "words", "explain", "the", "concept", "Another", "useful", "explanation"])

    def test_split_fields_handles_nested_expressions(self):
        self.assertEqual(audit.split_fields("t.id, jsonb_build_object(@0@, @1@), 0"), ["t.id", "jsonb_build_object(@0@, @1@)", "0"])

    def test_a_missing_source_cannot_pass_as_an_empty_valid_course(self):
        with self.assertRaisesRegex(ValueError, "No DBMS/SQL seed"):
            audit.audit([])

    def test_full_seed_inventory_exposes_every_topic_and_existing_assessment(self):
        report = audit.audit()
        self.assertEqual(report["summary"]["topics"], 294)
        self.assertEqual(report["summary"]["questions"], 2352)
        self.assertEqual(report["summary"]["coding_problems"], 49)
        self.assertEqual(len({topic["url"] for topic in report["topics"]}), 294)
        self.assertTrue(all(topic["checklist"]["content"] == "pending" for topic in report["topics"]))
        self.assertEqual(sum(topic["questions"] for topic in report["topics"]), 2352)
        self.assertEqual(report["summary"]["complete_topics"], 0)
        self.assertIn("repository seed", report["scope"])

    def test_prepared_migration_twins_only_rename_exact_original_groups(self):
        mobile = (ROOT / "mobile-app/supabase/migrations/0150_dbms_sql_descriptive_headings.sql").read_text().split("-- BODY\n", 1)[1]
        admin = (ROOT / "admin-panel/supabase/migrations/120_dbms_sql_descriptive_headings.sql").read_text().split("-- BODY\n", 1)[1]
        self.assertEqual(mobile, admin)
        masked, literals = audit.mask_literals(mobile)
        self.assertEqual(len([s for s in literals if s.startswith("chapter-")]), 43)
        self.assertIn("target.name = names.old_name", masked)
        self.assertNotRegex(masked.lower(), r"\b(?:drop|delete|alter|insert|grant|revoke)\b")


if __name__ == "__main__":
    unittest.main()
