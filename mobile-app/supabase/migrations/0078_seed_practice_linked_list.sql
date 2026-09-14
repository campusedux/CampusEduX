-- mobile-app/supabase/migrations/0078_seed_practice_linked_list.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: admin-panel/supabase/migrations/050_seed_practice_linked_list.sql ; apply either, the other is a guarded no-op.
-- ============================================================================
-- BODY — global Practice ▸ Coding Problems seed: Linked List (15 problems)
-- (mobile 0078_seed_practice_linked_list.sql
--  == admin 050_seed_practice_linked_list.sql — byte-identical below the 3-line header,
--  guarded, idempotent, additive. Reuses dsa_topics (kind='practice') + dsa_problems
--  (learning_topic_id NULL, topic_id -> the category) from migration 0072/044.)
-- ============================================================================
-- Content only — NO schema / RLS / function / app-code change. Deterministic
-- ids + on-conflict-do-nothing, so re-running never duplicates and never
-- disturbs an admin's later publish / premium / visibility edits. Every
-- reference solution + example + hidden test was compiled and executed in
-- Java 11 / Python 3 / C (gcc) / C++ (g++) / Node.js before shipping.
-- ----------------------------------------------------------------------------

-- ---- ordering guard ------------------------------------------------------
do $guard$
begin
  if to_regprocedure('public.practice_problems_list(text, text, text, text, integer, integer)') is null then
    raise exception '0078/050: practice RPCs not found — apply 0072_practice_coding.sql (admin 044) first.';
  end if;
end
$guard$;

-- ---- corrective: re-scope the global-practice slug uniqueness index so it
--      only covers actual global-practice rows (id like 'cp-practice-%').
--      The 0072/044 form was WHERE learning_topic_id is null and topic_id is
--      not null — which also caught orphaned legacy DSA problems (topic_id
--      set, learning_topic_id NULL) whose slugs (two-sum, ...) could clash.
--      Idempotent; safe to run in every seed pair. -----------------------------
drop index if exists public.dsa_problems_practice_slug_key;
create unique index if not exists dsa_problems_practice_slug_key
  on public.dsa_problems (lower(slug))
  where learning_topic_id is null and topic_id is not null and slug is not null
    and id like 'cp-practice-%';

-- ===========================================================================
-- 1. PRACTICE CATEGORIES — every category row (dsa_topics, kind='practice').
--    Seeded once here so the /practice/problems category filter is complete
--    even before later batches add their problems.
-- ===========================================================================
insert into public.dsa_topics (id, name, slug, description, sort_order, kind, status, show_on_website, show_on_mobile)
values
  ('dt-practice-linked-list', $px$Linked List$px$, $px$linked-list$px$, $px$Singly linked list operations expressed as batch stdin -> stdout: build, insert, delete, reverse, detect cycles, merge and rotate.$px$, 6, 'practice', 'published', true, true)
on conflict (id) do nothing;

-- ===========================================================================
-- 2. CODING PROBLEMS — Linked List
-- ===========================================================================

-- 61. Create and Traverse a Linked List  [Easy]  /practice/problems/create-and-traverse-linked-list
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-linked-list-61', 'dt-practice-linked-list', null,
  $px$Create and Traverse a Linked List$px$, $px$create-and-traverse-linked-list$px$, $px$Easy$px$,
  $px$Given a list of values, build a singly linked list in that order and print its values from head to tail.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers.

**Output Format**

Print the `N` values in head-to-tail order, separated by single spaces.$px$,
  $px$[{"input":"3\n10 20 30","output":"10 20 30","explanation":"The nodes are connected in input order."}]$px$::jsonb,
  $px$["1 <= N <= 100000","-1000000000 <= value <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        StringBuilder sb = new StringBuilder();\n        for (int i = 0; i < n; i++) { if (i > 0) sb.append(' '); sb.append(st.nextToken()); }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\nprint(' '.join(d[1:1+n]))\n","c":"#include <stdio.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    for (int i = 0; i < n; i++) { long long x; scanf(\"%lld\", &x); printf(\"%lld%s\", x, i + 1 < n ? \" \" : \"\\n\"); }\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    for (int i = 0; i < n; i++) { long long x; cin >> x; cout << x << (i + 1 < n ? ' ' : '\\n'); }\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/);\nconst n = Number(d[0]);\nconsole.log(d.slice(1, 1 + n).join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n7","expected":"7","hidden":true},{"input":"5\n-1 -2 -3 -4 -5","expected":"-1 -2 -3 -4 -5","hidden":true},{"input":"2\n1000000000 -1000000000","expected":"1000000000 -1000000000","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 61
)
on conflict (id) do nothing;

-- 62. Insert at Beginning of Linked List  [Easy]  /practice/problems/insert-at-beginning-of-linked-list
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-linked-list-62', 'dt-practice-linked-list', null,
  $px$Insert at Beginning of Linked List$px$, $px$insert-at-beginning-of-linked-list$px$, $px$Easy$px$,
  $px$Given a linked list and a value `X`, insert a new node containing `X` at the beginning and print the resulting list.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers (empty if `N` is 0).
The third line contains the integer `X`.

**Output Format**

Print the updated list from head to tail, separated by single spaces.$px$,
  $px$[{"input":"3\n20 30 40\n10","output":"10 20 30 40","explanation":"The new node becomes the head."}]$px$::jsonb,
  $px$["0 <= N <= 100000","-1000000000 <= value, X <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\nimport java.util.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        int n = Integer.parseInt(br.readLine().trim());\n        String valLine = br.readLine();\n        String x = br.readLine().trim();\n        StringBuilder sb = new StringBuilder();\n        sb.append(x);\n        if (n > 0 && valLine != null) {\n            StringTokenizer st = new StringTokenizer(valLine);\n            while (st.hasMoreTokens()) sb.append(' ').append(st.nextToken());\n        }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nlines = sys.stdin.read().split('\\n')\nn = int(lines[0])\nvals = lines[1].split() if n > 0 else []\nx = lines[2].strip()\nprint(' '.join([x] + vals))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long *a = malloc(sizeof(long long) * (n > 0 ? n : 1));\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    long long x; scanf(\"%lld\", &x);\n    printf(\"%lld\", x);\n    for (int i = 0; i < n; i++) printf(\" %lld\", a[i]);\n    printf(\"\\n\");\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<long long> a(n);\n    for (auto &v : a) cin >> v;\n    long long x; cin >> x;\n    cout << x;\n    for (long long v : a) cout << ' ' << v;\n    cout << \"\\n\";\n    return 0;\n}\n","javascript":"const t = require('fs').readFileSync(0, 'utf8').split('\\n');\nconst n = Number(t[0]);\nconst vals = n > 0 ? t[1].trim().split(/\\s+/) : [];\nconst x = t[2].trim();\nconsole.log([x, ...vals].join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"0\n\n5","expected":"5","hidden":true},{"input":"1\n1\n2","expected":"2 1","hidden":true},{"input":"4\n-1 -2 -3 -4\n0","expected":"0 -1 -2 -3 -4","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 62
)
on conflict (id) do nothing;

-- 63. Insert at End of Linked List  [Easy]  /practice/problems/insert-at-end-of-linked-list
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-linked-list-63', 'dt-practice-linked-list', null,
  $px$Insert at End of Linked List$px$, $px$insert-at-end-of-linked-list$px$, $px$Easy$px$,
  $px$Given a linked list and a value `X`, add a new node containing `X` at the end and print the resulting list.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers (empty if `N` is 0).
The third line contains the integer `X`.

**Output Format**

Print the updated list from head to tail, separated by single spaces.$px$,
  $px$[{"input":"3\n10 20 30\n40","output":"10 20 30 40","explanation":"The new node is attached after the current last node."}]$px$::jsonb,
  $px$["0 <= N <= 100000","-1000000000 <= value, X <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\nimport java.util.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        int n = Integer.parseInt(br.readLine().trim());\n        String valLine = br.readLine();\n        String x = br.readLine().trim();\n        StringBuilder sb = new StringBuilder();\n        if (n > 0 && valLine != null) {\n            StringTokenizer st = new StringTokenizer(valLine);\n            while (st.hasMoreTokens()) sb.append(st.nextToken()).append(' ');\n        }\n        sb.append(x);\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nlines = sys.stdin.read().split('\\n')\nn = int(lines[0])\nvals = lines[1].split() if n > 0 else []\nx = lines[2].strip()\nprint(' '.join(vals + [x]))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long *a = malloc(sizeof(long long) * (n > 0 ? n : 1));\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    long long x; scanf(\"%lld\", &x);\n    for (int i = 0; i < n; i++) printf(\"%lld \", a[i]);\n    printf(\"%lld\\n\", x);\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<long long> a(n);\n    for (auto &v : a) cin >> v;\n    long long x; cin >> x;\n    for (long long v : a) cout << v << ' ';\n    cout << x << \"\\n\";\n    return 0;\n}\n","javascript":"const t = require('fs').readFileSync(0, 'utf8').split('\\n');\nconst n = Number(t[0]);\nconst vals = n > 0 ? t[1].trim().split(/\\s+/) : [];\nconst x = t[2].trim();\nconsole.log([...vals, x].join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"0\n\n9","expected":"9","hidden":true},{"input":"1\n1\n2","expected":"1 2","hidden":true},{"input":"3\n-5 -5 -5\n-5","expected":"-5 -5 -5 -5","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 63
)
on conflict (id) do nothing;

-- 64. Delete a Node by Value  [Easy]  /practice/problems/delete-node-by-value
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-linked-list-64', 'dt-practice-linked-list', null,
  $px$Delete a Node by Value$px$, $px$delete-node-by-value$px$, $px$Easy$px$,
  $px$Given a singly linked list and a value `X`, delete the first node containing `X`. If `X` is not present, leave the list unchanged.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers (empty if `N` is 0).
The third line contains the integer `X`.

**Output Format**

Print the updated list from head to tail, separated by single spaces. Print an empty line if the list becomes empty.$px$,
  $px$[{"input":"4\n10 20 30 20\n20","output":"10 30 20","explanation":"Only the first node containing 20 is removed."}]$px$::jsonb,
  $px$["0 <= N <= 100000","-1000000000 <= value, X <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\nimport java.util.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        int n = Integer.parseInt(br.readLine().trim());\n        String valLine = br.readLine();\n        String x = br.readLine().trim();\n        ArrayList<String> vals = new ArrayList<>();\n        if (n > 0 && valLine != null) { StringTokenizer st = new StringTokenizer(valLine); while (st.hasMoreTokens()) vals.add(st.nextToken()); }\n        boolean removed = false;\n        StringBuilder sb = new StringBuilder();\n        boolean first = true;\n        for (String v : vals) {\n            if (!removed && v.equals(x)) { removed = true; continue; }\n            if (!first) sb.append(' ');\n            sb.append(v);\n            first = false;\n        }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nlines = sys.stdin.read().split('\\n')\nn = int(lines[0])\nvals = lines[1].split() if n > 0 else []\nx = lines[2].strip()\nout = []\nremoved = False\nfor v in vals:\n    if not removed and v == x:\n        removed = True\n        continue\n    out.append(v)\nprint(' '.join(out))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long *a = malloc(sizeof(long long) * (n > 0 ? n : 1));\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    long long x; scanf(\"%lld\", &x);\n    int removed = 0, first = 1;\n    for (int i = 0; i < n; i++) {\n        if (!removed && a[i] == x) { removed = 1; continue; }\n        if (!first) putchar(' ');\n        printf(\"%lld\", a[i]);\n        first = 0;\n    }\n    putchar('\\n');\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<long long> a(n);\n    for (auto &v : a) cin >> v;\n    long long x; cin >> x;\n    bool removed = false, first = true;\n    for (long long v : a) {\n        if (!removed && v == x) { removed = true; continue; }\n        if (!first) cout << ' ';\n        cout << v;\n        first = false;\n    }\n    cout << \"\\n\";\n    return 0;\n}\n","javascript":"const t = require('fs').readFileSync(0, 'utf8').split('\\n');\nconst n = Number(t[0]);\nconst vals = n > 0 ? t[1].trim().split(/\\s+/) : [];\nconst x = t[2].trim();\nconst out = [];\nlet removed = false;\nfor (const v of vals) {\n    if (!removed && v === x) { removed = true; continue; }\n    out.push(v);\n}\nconsole.log(out.join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n5\n5","expected":"","hidden":true},{"input":"3\n1 2 3\n9","expected":"1 2 3","hidden":true},{"input":"3\n7 7 7\n7","expected":"7 7","hidden":true},{"input":"0\n\n1","expected":"","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 64
)
on conflict (id) do nothing;

-- 65. Reverse a Linked List  [Easy]  /practice/problems/reverse-a-linked-list
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-linked-list-65', 'dt-practice-linked-list', null,
  $px$Reverse a Linked List$px$, $px$reverse-a-linked-list$px$, $px$Easy$px$,
  $px$Given the head of a singly linked list, reverse all links and print the reversed list.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers (empty if `N` is 0).

**Output Format**

Print the reversed list from head to tail, separated by single spaces. Print an empty line if the list is empty.$px$,
  $px$[{"input":"4\n1 2 3 4","output":"4 3 2 1","explanation":"Every node points to its previous node after reversal."}]$px$::jsonb,
  $px$["0 <= N <= 100000","-1000000000 <= value <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\nimport java.util.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        int n = Integer.parseInt(br.readLine().trim());\n        String valLine = n > 0 ? br.readLine() : \"\";\n        ArrayList<String> v = new ArrayList<>();\n        if (valLine != null) { StringTokenizer st = new StringTokenizer(valLine); while (st.hasMoreTokens()) v.add(st.nextToken()); }\n        StringBuilder sb = new StringBuilder();\n        for (int i = v.size() - 1; i >= 0; i--) { sb.append(v.get(i)); if (i > 0) sb.append(' '); }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nlines = sys.stdin.read().split('\\n')\nn = int(lines[0])\nvals = lines[1].split() if n > 0 else []\nprint(' '.join(reversed(vals)))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) { printf(\"\\n\"); return 0; }\n    long long *a = malloc(sizeof(long long) * (n > 0 ? n : 1));\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    for (int i = n - 1; i >= 0; i--) printf(\"%lld%s\", a[i], i > 0 ? \" \" : \"\");\n    printf(\"\\n\");\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<long long> a(n);\n    for (auto &v : a) cin >> v;\n    for (int i = n - 1; i >= 0; i--) cout << a[i] << (i > 0 ? \" \" : \"\");\n    cout << \"\\n\";\n    return 0;\n}\n","javascript":"const t = require('fs').readFileSync(0, 'utf8').split('\\n');\nconst n = Number(t[0]);\nconst vals = n > 0 ? t[1].trim().split(/\\s+/).filter(Boolean) : [];\nconsole.log(vals.reverse().join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"0\n","expected":"","hidden":true},{"input":"1\n5","expected":"5","hidden":true},{"input":"3\n-1 0 1","expected":"1 0 -1","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 65
)
on conflict (id) do nothing;

-- 66. Find Middle Node  [Easy]  /practice/problems/find-middle-node
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-linked-list-66', 'dt-practice-linked-list', null,
  $px$Find Middle Node$px$, $px$find-middle-node$px$, $px$Easy$px$,
  $px$Find the middle node of a singly linked list. If the list has an even number of nodes, return the second of the two middle nodes.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers.

**Output Format**

Print the value of the middle node.$px$,
  $px$[{"input":"5\n1 2 3 4 5","output":"3","explanation":"3 is the middle node."}]$px$::jsonb,
  $px$["1 <= N <= 100000","-1000000000 <= value <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        String ans = \"\";\n        for (int i = 0; i < n; i++) { String v = st.nextToken(); if (i == n / 2) ans = v; }\n        System.out.println(ans);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\na = d[1:1+n]\nprint(a[n // 2])\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    printf(\"%lld\\n\", a[n / 2]);\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<long long> a(n);\n    for (auto &v : a) cin >> v;\n    cout << a[n / 2] << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/);\nconst n = Number(d[0]);\nconsole.log(d[1 + Math.floor(n / 2)]);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n9","expected":"9","hidden":true},{"input":"4\n1 2 3 4","expected":"3","hidden":true},{"input":"6\n10 20 30 40 50 60","expected":"40","hidden":true},{"input":"2\n-1 -2","expected":"-2","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 66
)
on conflict (id) do nothing;

-- 67. Find Nth Node from End  [Easy]  /practice/problems/nth-node-from-end
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-linked-list-67', 'dt-practice-linked-list', null,
  $px$Find Nth Node from End$px$, $px$nth-node-from-end$px$, $px$Easy$px$,
  $px$Given a linked list and an integer `K`, find the K-th node from the end of the list (1-indexed).

**Input Format**

The first line contains two integers `N` and `K`.
The second line contains `N` space-separated integers.

**Output Format**

Print the value of the K-th node from the end.$px$,
  $px$[{"input":"5 2\n10 20 30 40 50","output":"40","explanation":"From the end, 50 is first and 40 is second."}]$px$::jsonb,
  $px$["1 <= K <= N <= 100000","-1000000000 <= value <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        int k = Integer.parseInt(st.nextToken());\n        String ans = \"\";\n        for (int i = 0; i < n; i++) { String v = st.nextToken(); if (i == n - k) ans = v; }\n        System.out.println(ans);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn, k = int(d[0]), int(d[1])\na = d[2:2+n]\nprint(a[n - k])\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    int n, k;\n    if (scanf(\"%d %d\", &n, &k) != 2) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    printf(\"%lld\\n\", a[n - k]);\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n, k; cin >> n >> k;\n    vector<long long> a(n);\n    for (auto &v : a) cin >> v;\n    cout << a[n - k] << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/);\nconst n = Number(d[0]), k = Number(d[1]);\nconsole.log(d[2 + n - k]);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1 1\n7","expected":"7","hidden":true},{"input":"5 5\n1 2 3 4 5","expected":"1","hidden":true},{"input":"5 1\n1 2 3 4 5","expected":"5","hidden":true},{"input":"4 3\n-1 -2 -3 -4","expected":"-2","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 67
)
on conflict (id) do nothing;

-- 68. Detect Cycle in Linked List  [Medium]  /practice/problems/detect-cycle-in-linked-list
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-linked-list-68', 'dt-practice-linked-list', null,
  $px$Detect Cycle in Linked List$px$, $px$detect-cycle-in-linked-list$px$, $px$Medium$px$,
  $px$A singly linked list of `N` nodes (indices `0 .. N-1`) is described. The tail's `next` pointer either points at the node with index `pos`, forming a cycle, or is `null` (given as `pos = -1`). Determine whether the list contains a cycle.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers, the node values (empty if `N` is 0).
The third line contains an integer `pos`: the index the tail links back to, or `-1` for no cycle.

**Output Format**

Print `1` if the list contains a cycle, otherwise print `0`.$px$,
  $px$[{"input":"4\n1 2 3 4\n1","output":"1","explanation":"The tail links back to index 1, so following the links loops forever."}]$px$::jsonb,
  $px$["0 <= N <= 100000","-1 <= pos <= N-1"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        int n = Integer.parseInt(br.readLine().trim());\n        br.readLine();\n        int pos = Integer.parseInt(br.readLine().trim());\n        if (n == 0) { System.out.println(0); return; }\n        int[] nxt = new int[n];\n        for (int i = 0; i < n; i++) nxt[i] = (i + 1 < n) ? i + 1 : pos;\n        int slow = 0, fast = 0, cyc = 0;\n        while (true) {\n            if (fast == -1 || nxt[fast] == -1) break;\n            slow = nxt[slow];\n            fast = nxt[nxt[fast]];\n            if (fast == -1) break;\n            if (slow == fast) { cyc = 1; break; }\n        }\n        System.out.println(cyc);\n    }\n}\n","python":"import sys\nlines = sys.stdin.read().split('\\n')\nn = int(lines[0])\npos = int(lines[2].strip())\nif n == 0:\n    print(0)\nelse:\n    nxt = [i + 1 if i + 1 < n else pos for i in range(n)]\n    slow = fast = 0\n    cyc = 0\n    while True:\n        if fast == -1 or nxt[fast] == -1:\n            break\n        slow = nxt[slow]\n        fast = nxt[nxt[fast]]\n        if fast == -1:\n            break\n        if slow == fast:\n            cyc = 1\n            break\n    print(cyc)\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long tmp;\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &tmp);\n    int pos; scanf(\"%d\", &pos);\n    if (n == 0) { printf(\"0\\n\"); return 0; }\n    int *nxt = malloc(sizeof(int) * n);\n    for (int i = 0; i < n; i++) nxt[i] = (i + 1 < n) ? i + 1 : pos;\n    int slow = 0, fast = 0, cyc = 0;\n    while (1) {\n        if (fast == -1 || nxt[fast] == -1) break;\n        slow = nxt[slow];\n        fast = nxt[nxt[fast]];\n        if (fast == -1) break;\n        if (slow == fast) { cyc = 1; break; }\n    }\n    printf(\"%d\\n\", cyc);\n    free(nxt);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    long long tmp;\n    for (int i = 0; i < n; i++) cin >> tmp;\n    int pos; cin >> pos;\n    if (n == 0) { cout << 0 << \"\\n\"; return 0; }\n    vector<int> nxt(n);\n    for (int i = 0; i < n; i++) nxt[i] = (i + 1 < n) ? i + 1 : pos;\n    int slow = 0, fast = 0, cyc = 0;\n    while (true) {\n        if (fast == -1 || nxt[fast] == -1) break;\n        slow = nxt[slow];\n        fast = nxt[nxt[fast]];\n        if (fast == -1) break;\n        if (slow == fast) { cyc = 1; break; }\n    }\n    cout << cyc << \"\\n\";\n    return 0;\n}\n","javascript":"const t = require('fs').readFileSync(0, 'utf8').split('\\n');\nconst n = Number(t[0]);\nconst pos = Number(t[2].trim());\nif (n === 0) { console.log(0); }\nelse {\n    const nxt = [];\n    for (let i = 0; i < n; i++) nxt.push(i + 1 < n ? i + 1 : pos);\n    let slow = 0, fast = 0, cyc = 0;\n    while (true) {\n        if (fast === -1 || nxt[fast] === -1) break;\n        slow = nxt[slow];\n        fast = nxt[nxt[fast]];\n        if (fast === -1) break;\n        if (slow === fast) { cyc = 1; break; }\n    }\n    console.log(cyc);\n}\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"4\n1 2 3 4\n-1","expected":"0","hidden":true},{"input":"1\n5\n0","expected":"1","hidden":true},{"input":"1\n5\n-1","expected":"0","hidden":true},{"input":"0\n\n-1","expected":"0","hidden":true},{"input":"5\n10 20 30 40 50\n4","expected":"1","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 68
)
on conflict (id) do nothing;

-- 69. Merge Two Sorted Linked Lists  [Easy]  /practice/problems/merge-two-sorted-linked-lists
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-linked-list-69', 'dt-practice-linked-list', null,
  $px$Merge Two Sorted Linked Lists$px$, $px$merge-two-sorted-linked-lists$px$, $px$Easy$px$,
  $px$Given two sorted singly linked lists, merge them into one sorted linked list and print it.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers in non-decreasing order (list A; empty if `N` is 0).
The third line contains an integer `M`.
The fourth line contains `M` space-separated integers in non-decreasing order (list B; empty if `M` is 0).

**Output Format**

Print the merged sorted list, separated by single spaces. Print an empty line if both lists are empty.$px$,
  $px$[{"input":"3\n1 3 5\n3\n2 4 6","output":"1 2 3 4 5 6","explanation":"Nodes from both lists are taken in increasing order."}]$px$::jsonb,
  $px$["0 <= N, M <= 100000","-1000000000 <= value <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\nimport java.util.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        int n = Integer.parseInt(br.readLine().trim());\n        long[] a = parse(br.readLine(), n);\n        int m = Integer.parseInt(br.readLine().trim());\n        long[] b = parse(br.readLine(), m);\n        StringBuilder sb = new StringBuilder();\n        int i = 0, j = 0;\n        boolean first = true;\n        while (i < n && j < m) {\n            long v = a[i] <= b[j] ? a[i++] : b[j++];\n            if (!first) sb.append(' '); sb.append(v); first = false;\n        }\n        while (i < n) { if (!first) sb.append(' '); sb.append(a[i++]); first = false; }\n        while (j < m) { if (!first) sb.append(' '); sb.append(b[j++]); first = false; }\n        System.out.println(sb.toString());\n    }\n    static long[] parse(String line, int cnt) {\n        long[] r = new long[cnt];\n        if (cnt == 0 || line == null) return r;\n        StringTokenizer st = new StringTokenizer(line);\n        for (int i = 0; i < cnt; i++) r[i] = Long.parseLong(st.nextToken());\n        return r;\n    }\n}\n","python":"import sys\nlines = sys.stdin.read().split('\\n')\nn = int(lines[0])\na = list(map(int, lines[1].split())) if n > 0 else []\nm = int(lines[2])\nb = list(map(int, lines[3].split())) if m > 0 else []\ni = j = 0\nout = []\nwhile i < n and j < m:\n    if a[i] <= b[j]:\n        out.append(a[i]); i += 1\n    else:\n        out.append(b[j]); j += 1\nout.extend(a[i:])\nout.extend(b[j:])\nprint(' '.join(map(str, out)))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    int n; if (scanf(\"%d\", &n) != 1) return 0;\n    long long *a = malloc(sizeof(long long) * (n > 0 ? n : 1));\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    int m; scanf(\"%d\", &m);\n    long long *b = malloc(sizeof(long long) * (m > 0 ? m : 1));\n    for (int i = 0; i < m; i++) scanf(\"%lld\", &b[i]);\n    int i = 0, j = 0, first = 1;\n    while (i < n && j < m) {\n        long long v = a[i] <= b[j] ? a[i++] : b[j++];\n        if (!first) putchar(' ');\n        printf(\"%lld\", v); first = 0;\n    }\n    while (i < n) { if (!first) putchar(' '); printf(\"%lld\", a[i++]); first = 0; }\n    while (j < m) { if (!first) putchar(' '); printf(\"%lld\", b[j++]); first = 0; }\n    putchar('\\n');\n    free(a); free(b);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<long long> a(n);\n    for (auto &v : a) cin >> v;\n    int m; cin >> m;\n    vector<long long> b(m);\n    for (auto &v : b) cin >> v;\n    int i = 0, j = 0;\n    bool first = true;\n    auto out = [&](long long v) { if (!first) cout << ' '; cout << v; first = false; };\n    while (i < n && j < m) out(a[i] <= b[j] ? a[i++] : b[j++]);\n    while (i < n) out(a[i++]);\n    while (j < m) out(b[j++]);\n    cout << \"\\n\";\n    return 0;\n}\n","javascript":"const t = require('fs').readFileSync(0, 'utf8').split('\\n');\nconst n = Number(t[0]);\nconst a = n > 0 ? t[1].trim().split(/\\s+/).map(Number) : [];\nconst m = Number(t[2]);\nconst b = m > 0 ? t[3].trim().split(/\\s+/).map(Number) : [];\nlet i = 0, j = 0;\nconst out = [];\nwhile (i < n && j < m) out.push(a[i] <= b[j] ? a[i++] : b[j++]);\nwhile (i < n) out.push(a[i++]);\nwhile (j < m) out.push(b[j++]);\nconsole.log(out.join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"0\n\n3\n1 2 3","expected":"1 2 3","hidden":true},{"input":"2\n1 1\n2\n1 1","expected":"1 1 1 1","hidden":true},{"input":"3\n1 2 3\n2\n10 20","expected":"1 2 3 10 20","hidden":true},{"input":"0\n\n0\n","expected":"","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 69
)
on conflict (id) do nothing;

-- 70. Check Linked List Palindrome  [Easy]  /practice/problems/check-linked-list-palindrome
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-linked-list-70', 'dt-practice-linked-list', null,
  $px$Check Linked List Palindrome$px$, $px$check-linked-list-palindrome$px$, $px$Easy$px$,
  $px$Determine whether the values in a singly linked list form a palindrome.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers.

**Output Format**

Print `1` if the list is a palindrome, otherwise print `0`.$px$,
  $px$[{"input":"5\n1 2 3 2 1","output":"1","explanation":"The list reads the same from both directions."}]$px$::jsonb,
  $px$["1 <= N <= 100000","-1000000000 <= value <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        String[] a = new String[n];\n        for (int i = 0; i < n; i++) a[i] = st.nextToken();\n        int ok = 1;\n        for (int i = 0; i < n / 2; i++) if (!a[i].equals(a[n - 1 - i])) ok = 0;\n        System.out.println(ok);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\na = d[1:1+n]\nprint(1 if a == a[::-1] else 0)\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    int ok = 1;\n    for (int i = 0; i < n / 2; i++) if (a[i] != a[n - 1 - i]) ok = 0;\n    printf(\"%d\\n\", ok);\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<long long> a(n);\n    for (auto &v : a) cin >> v;\n    int ok = 1;\n    for (int i = 0; i < n / 2; i++) if (a[i] != a[n - 1 - i]) ok = 0;\n    cout << ok << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/);\nconst n = Number(d[0]);\nconst a = d.slice(1, 1 + n);\nlet ok = 1;\nfor (let i = 0; i < Math.floor(n / 2); i++) if (a[i] !== a[n - 1 - i]) ok = 0;\nconsole.log(ok);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n7","expected":"1","hidden":true},{"input":"2\n1 2","expected":"0","hidden":true},{"input":"4\n5 6 6 5","expected":"1","hidden":true},{"input":"3\n1 2 3","expected":"0","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 70
)
on conflict (id) do nothing;

-- 71. Remove Duplicates from Sorted Linked List  [Easy]  /practice/problems/remove-duplicates-from-sorted-linked-list
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-linked-list-71', 'dt-practice-linked-list', null,
  $px$Remove Duplicates from Sorted Linked List$px$, $px$remove-duplicates-from-sorted-linked-list$px$, $px$Easy$px$,
  $px$Given a sorted linked list, remove nodes with repeated values so that every value appears only once.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers in non-decreasing order.

**Output Format**

Print the list after removing duplicates, separated by single spaces.$px$,
  $px$[{"input":"5\n1 1 2 3 3","output":"1 2 3","explanation":"Repeated adjacent values are reduced to a single node."}]$px$::jsonb,
  $px$["1 <= N <= 100000","-1000000000 <= value <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        StringBuilder sb = new StringBuilder();\n        String prev = null;\n        boolean first = true;\n        for (int i = 0; i < n; i++) {\n            String v = st.nextToken();\n            if (prev == null || !prev.equals(v)) { if (!first) sb.append(' '); sb.append(v); first = false; prev = v; }\n        }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\nout = []\nfor v in d[1:1+n]:\n    if not out or out[-1] != v:\n        out.append(v)\nprint(' '.join(out))\n","c":"#include <stdio.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long x, prev = 0;\n    int has = 0, first = 1;\n    for (int i = 0; i < n; i++) {\n        scanf(\"%lld\", &x);\n        if (!has || prev != x) { if (!first) putchar(' '); printf(\"%lld\", x); first = 0; prev = x; has = 1; }\n    }\n    putchar('\\n');\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    long long x, prev = 0;\n    bool has = false, first = true;\n    for (int i = 0; i < n; i++) {\n        cin >> x;\n        if (!has || prev != x) { if (!first) cout << ' '; cout << x; first = false; prev = x; has = true; }\n    }\n    cout << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/);\nconst n = Number(d[0]);\nconst out = [];\nfor (let i = 1; i <= n; i++) if (out.length === 0 || out[out.length - 1] !== d[i]) out.push(d[i]);\nconsole.log(out.join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n5","expected":"5","hidden":true},{"input":"4\n7 7 7 7","expected":"7","hidden":true},{"input":"5\n-2 -1 0 1 2","expected":"-2 -1 0 1 2","hidden":true},{"input":"6\n1 1 1 2 2 9","expected":"1 2 9","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 71
)
on conflict (id) do nothing;

-- 72. Add Two Numbers Using Linked Lists  [Medium]  /practice/problems/add-two-numbers-linked-lists
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-linked-list-72', 'dt-practice-linked-list', null,
  $px$Add Two Numbers Using Linked Lists$px$, $px$add-two-numbers-linked-lists$px$, $px$Medium$px$,
  $px$Two non-negative integers are represented by linked lists, one digit per node, with the most significant digit first. Add the two numbers and print the digits of the sum, most significant digit first.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated digits (0-9), the digits of number A, most significant first.
The third line contains an integer `M`.
The fourth line contains `M` space-separated digits (0-9), the digits of number B, most significant first.

**Output Format**

Print the digits of `A + B`, most significant first, separated by single spaces, with no leading zeros (print `0` if the sum is zero).$px$,
  $px$[{"input":"3\n2 4 3\n3\n5 6 4","output":"8 0 7","explanation":"The numbers are 243 and 564; their sum is 807."}]$px$::jsonb,
  $px$["1 <= N, M <= 5000","Each digit is between 0 and 9","The leading digit is non-zero unless the number is exactly 0"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\nimport java.util.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        br.readLine();\n        int[] a = digits(br.readLine());\n        br.readLine();\n        int[] b = digits(br.readLine());\n        int i = a.length - 1, j = b.length - 1, carry = 0;\n        ArrayList<Integer> res = new ArrayList<>();\n        while (i >= 0 || j >= 0 || carry > 0) {\n            int s = carry + (i >= 0 ? a[i--] : 0) + (j >= 0 ? b[j--] : 0);\n            res.add(s % 10);\n            carry = s / 10;\n        }\n        Collections.reverse(res);\n        int start = 0;\n        while (start < res.size() - 1 && res.get(start) == 0) start++;\n        StringBuilder sb = new StringBuilder();\n        for (int k = start; k < res.size(); k++) { if (k > start) sb.append(' '); sb.append(res.get(k)); }\n        System.out.println(sb.toString());\n    }\n    static int[] digits(String line) {\n        StringTokenizer st = new StringTokenizer(line);\n        int[] r = new int[st.countTokens()];\n        for (int i = 0; i < r.length; i++) r[i] = Integer.parseInt(st.nextToken());\n        return r;\n    }\n}\n","python":"import sys\nlines = sys.stdin.read().split('\\n')\nn = int(lines[0])\na = lines[1].split()\nm = int(lines[2])\nb = lines[3].split()\nna = int(''.join(a))\nnb = int(''.join(b))\nprint(' '.join(str(na + nb)))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    int n; if (scanf(\"%d\", &n) != 1) return 0;\n    int *a = malloc(sizeof(int) * n);\n    for (int i = 0; i < n; i++) scanf(\"%d\", &a[i]);\n    int m; scanf(\"%d\", &m);\n    int *b = malloc(sizeof(int) * m);\n    for (int i = 0; i < m; i++) scanf(\"%d\", &b[i]);\n    int cap = (n > m ? n : m) + 2;\n    int *res = malloc(sizeof(int) * cap);\n    int rn = 0, i = n - 1, j = m - 1, carry = 0;\n    while (i >= 0 || j >= 0 || carry > 0) {\n        int s = carry + (i >= 0 ? a[i--] : 0) + (j >= 0 ? b[j--] : 0);\n        res[rn++] = s % 10;\n        carry = s / 10;\n    }\n    int start = rn - 1;\n    while (start > 0 && res[start] == 0) start--;\n    for (int k = start; k >= 0; k--) printf(\"%d%s\", res[k], k > 0 ? \" \" : \"\\n\");\n    free(a); free(b); free(res);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<int> a(n);\n    for (auto &x : a) cin >> x;\n    int m; cin >> m;\n    vector<int> b(m);\n    for (auto &x : b) cin >> x;\n    int i = n - 1, j = m - 1, carry = 0;\n    vector<int> res;\n    while (i >= 0 || j >= 0 || carry > 0) {\n        int s = carry + (i >= 0 ? a[i--] : 0) + (j >= 0 ? b[j--] : 0);\n        res.push_back(s % 10);\n        carry = s / 10;\n    }\n    reverse(res.begin(), res.end());\n    int start = 0;\n    while (start + 1 < (int)res.size() && res[start] == 0) start++;\n    for (int k = start; k < (int)res.size(); k++) { if (k > start) cout << ' '; cout << res[k]; }\n    cout << \"\\n\";\n    return 0;\n}\n","javascript":"const t = require('fs').readFileSync(0, 'utf8').split('\\n');\nconst a = t[1].trim().split(/\\s+/).map(Number);\nconst b = t[3].trim().split(/\\s+/).map(Number);\nlet i = a.length - 1, j = b.length - 1, carry = 0;\nconst res = [];\nwhile (i >= 0 || j >= 0 || carry > 0) {\n    const s = carry + (i >= 0 ? a[i--] : 0) + (j >= 0 ? b[j--] : 0);\n    res.push(s % 10);\n    carry = Math.floor(s / 10);\n}\nres.reverse();\nlet start = 0;\nwhile (start < res.length - 1 && res[start] === 0) start++;\nconsole.log(res.slice(start).join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n0\n1\n0","expected":"0","hidden":true},{"input":"1\n5\n1\n5","expected":"1 0","hidden":true},{"input":"3\n9 9 9\n1\n1","expected":"1 0 0 0","hidden":true},{"input":"2\n1 0\n3\n1 0 0","expected":"1 1 0","hidden":true},{"input":"4\n1 2 3 4\n2\n7 8","expected":"1 3 1 2","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 72
)
on conflict (id) do nothing;

-- 73. Intersection Point of Two Linked Lists  [Medium]  /practice/problems/intersection-point-of-two-linked-lists
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-linked-list-73', 'dt-practice-linked-list', null,
  $px$Intersection Point of Two Linked Lists$px$, $px$intersection-point-of-two-linked-lists$px$, $px$Medium$px$,
  $px$Two singly linked lists share a common suffix of exactly `c` nodes: the last `c` values of list A are identical to the last `c` values of list B (this represents the shared tail). Find the value of the first shared node.

**Input Format**

The first line contains an integer `lenA`.
The second line contains `lenA` space-separated integers (list A).
The third line contains an integer `lenB`.
The fourth line contains `lenB` space-separated integers (list B).
The fifth line contains an integer `c`, the length of the shared suffix.

**Output Format**

Print the value of the first shared node, or `-1` if `c` is 0 (the lists do not intersect).$px$,
  $px$[{"input":"5\n1 2 3 7 8\n4\n4 5 7 8\n2","output":"7","explanation":"The last 2 nodes of both lists are 7 and 8; the first shared node holds 7."}]$px$::jsonb,
  $px$["1 <= lenA, lenB <= 100000","0 <= c <= min(lenA, lenB)","-1000000000 <= value <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\nimport java.util.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        int lenA = Integer.parseInt(br.readLine().trim());\n        String[] a = br.readLine().trim().split(\"\\\\s+\");\n        br.readLine();\n        br.readLine();\n        int c = Integer.parseInt(br.readLine().trim());\n        System.out.println(c > 0 ? a[lenA - c] : \"-1\");\n    }\n}\n","python":"import sys\nlines = sys.stdin.read().split('\\n')\nlenA = int(lines[0])\na = lines[1].split()\nlenB = int(lines[2])\nb = lines[3].split()\nc = int(lines[4].strip())\nprint(a[lenA - c] if c > 0 else -1)\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    int lenA; if (scanf(\"%d\", &lenA) != 1) return 0;\n    long long *a = malloc(sizeof(long long) * lenA);\n    for (int i = 0; i < lenA; i++) scanf(\"%lld\", &a[i]);\n    int lenB; scanf(\"%d\", &lenB);\n    long long tmp;\n    for (int i = 0; i < lenB; i++) scanf(\"%lld\", &tmp);\n    int c; scanf(\"%d\", &c);\n    if (c > 0) printf(\"%lld\\n\", a[lenA - c]);\n    else printf(\"-1\\n\");\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int lenA; cin >> lenA;\n    vector<long long> a(lenA);\n    for (auto &v : a) cin >> v;\n    int lenB; cin >> lenB;\n    long long tmp;\n    for (int i = 0; i < lenB; i++) cin >> tmp;\n    int c; cin >> c;\n    if (c > 0) cout << a[lenA - c] << \"\\n\";\n    else cout << -1 << \"\\n\";\n    return 0;\n}\n","javascript":"const t = require('fs').readFileSync(0, 'utf8').split('\\n');\nconst lenA = Number(t[0]);\nconst a = t[1].trim().split(/\\s+/);\nconst c = Number(t[4].trim());\nconsole.log(c > 0 ? a[lenA - c] : -1);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"3\n1 2 3\n3\n4 5 6\n0","expected":"-1","hidden":true},{"input":"1\n9\n1\n9\n1","expected":"9","hidden":true},{"input":"4\n1 2 3 4\n2\n3 4\n2","expected":"3","hidden":true},{"input":"5\n5 5 5 5 5\n3\n5 5 5\n5","expected":"5","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 73
)
on conflict (id) do nothing;

-- 74. Remove Cycle from Linked List  [Medium]  /practice/problems/remove-cycle-from-linked-list
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-linked-list-74', 'dt-practice-linked-list', null,
  $px$Remove Cycle from Linked List$px$, $px$remove-cycle-from-linked-list$px$, $px$Medium$px$,
  $px$A singly linked list of `N` nodes (indices `0 .. N-1`) may contain a cycle: the tail's `next` points at index `pos` (or `-1` for no cycle). Detect the cycle, break it by setting the last node's `next` to `null` without deleting any node, then print the list.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated node values.
The third line contains an integer `pos`: the index the tail links back to, or `-1`.

**Output Format**

Print the `N` node values from head to tail after the cycle has been removed, separated by single spaces.$px$,
  $px$[{"input":"4\n1 2 3 4\n1","output":"1 2 3 4","explanation":"The link from the last node back to index 1 is removed; the values are unchanged."}]$px$::jsonb,
  $px$["1 <= N <= 100000","-1 <= pos <= N-1","-1000000000 <= value <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        int n = Integer.parseInt(br.readLine().trim());\n        String[] vals = br.readLine().trim().split(\"\\\\s+\");\n        int pos = Integer.parseInt(br.readLine().trim());\n        int[] nxt = new int[n];\n        for (int i = 0; i < n; i++) nxt[i] = (i + 1 < n) ? i + 1 : pos;\n        int slow = 0, fast = 0;\n        boolean has = false;\n        while (fast != -1 && nxt[fast] != -1) {\n            slow = nxt[slow];\n            fast = nxt[nxt[fast]];\n            if (fast == -1) break;\n            if (slow == fast) { has = true; break; }\n        }\n        if (has) {\n            int p = 0;\n            while (p != slow) { p = nxt[p]; slow = nxt[slow]; }\n            int tail = slow;\n            while (nxt[tail] != slow) tail = nxt[tail];\n            nxt[tail] = -1;\n        }\n        StringBuilder sb = new StringBuilder();\n        int cur = 0;\n        boolean first = true;\n        while (cur != -1) { if (!first) sb.append(' '); sb.append(vals[cur]); first = false; cur = nxt[cur]; }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nlines = sys.stdin.read().split('\\n')\nn = int(lines[0])\nvals = lines[1].split()\npos = int(lines[2].strip())\nnxt = [i + 1 if i + 1 < n else pos for i in range(n)]\n# Floyd detect\nslow = fast = 0\nhas = False\nwhile fast != -1 and nxt[fast] != -1:\n    slow = nxt[slow]\n    fast = nxt[nxt[fast]]\n    if fast == -1:\n        break\n    if slow == fast:\n        has = True\n        break\nif has:\n    p = 0\n    while p != slow:\n        p = nxt[p]\n        slow = nxt[slow]\n    tail = slow\n    while nxt[tail] != slow:\n        tail = nxt[tail]\n    nxt[tail] = -1\n# traverse\nout = []\ncur = 0\nwhile cur != -1:\n    out.append(vals[cur])\n    cur = nxt[cur]\nprint(' '.join(out))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    int n; if (scanf(\"%d\", &n) != 1) return 0;\n    long long *vals = malloc(sizeof(long long) * n);\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &vals[i]);\n    int pos; scanf(\"%d\", &pos);\n    int *nxt = malloc(sizeof(int) * n);\n    for (int i = 0; i < n; i++) nxt[i] = (i + 1 < n) ? i + 1 : pos;\n    int slow = 0, fast = 0, has = 0;\n    while (fast != -1 && nxt[fast] != -1) {\n        slow = nxt[slow];\n        fast = nxt[nxt[fast]];\n        if (fast == -1) break;\n        if (slow == fast) { has = 1; break; }\n    }\n    if (has) {\n        int p = 0;\n        while (p != slow) { p = nxt[p]; slow = nxt[slow]; }\n        int tail = slow;\n        while (nxt[tail] != slow) tail = nxt[tail];\n        nxt[tail] = -1;\n    }\n    int cur = 0, first = 1;\n    while (cur != -1) { if (!first) putchar(' '); printf(\"%lld\", vals[cur]); first = 0; cur = nxt[cur]; }\n    putchar('\\n');\n    free(vals); free(nxt);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<long long> vals(n);\n    for (auto &v : vals) cin >> v;\n    int pos; cin >> pos;\n    vector<int> nxt(n);\n    for (int i = 0; i < n; i++) nxt[i] = (i + 1 < n) ? i + 1 : pos;\n    int slow = 0, fast = 0;\n    bool has = false;\n    while (fast != -1 && nxt[fast] != -1) {\n        slow = nxt[slow];\n        fast = nxt[nxt[fast]];\n        if (fast == -1) break;\n        if (slow == fast) { has = true; break; }\n    }\n    if (has) {\n        int p = 0;\n        while (p != slow) { p = nxt[p]; slow = nxt[slow]; }\n        int tail = slow;\n        while (nxt[tail] != slow) tail = nxt[tail];\n        nxt[tail] = -1;\n    }\n    int cur = 0;\n    bool first = true;\n    while (cur != -1) { if (!first) cout << ' '; cout << vals[cur]; first = false; cur = nxt[cur]; }\n    cout << \"\\n\";\n    return 0;\n}\n","javascript":"const t = require('fs').readFileSync(0, 'utf8').split('\\n');\nconst n = Number(t[0]);\nconst vals = t[1].trim().split(/\\s+/);\nconst pos = Number(t[2].trim());\nconst nxt = [];\nfor (let i = 0; i < n; i++) nxt.push(i + 1 < n ? i + 1 : pos);\nlet slow = 0, fast = 0, has = false;\nwhile (fast !== -1 && nxt[fast] !== -1) {\n    slow = nxt[slow];\n    fast = nxt[nxt[fast]];\n    if (fast === -1) break;\n    if (slow === fast) { has = true; break; }\n}\nif (has) {\n    let p = 0;\n    while (p !== slow) { p = nxt[p]; slow = nxt[slow]; }\n    let tail = slow;\n    while (nxt[tail] !== slow) tail = nxt[tail];\n    nxt[tail] = -1;\n}\nconst out = [];\nlet cur = 0;\nwhile (cur !== -1) { out.push(vals[cur]); cur = nxt[cur]; }\nconsole.log(out.join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"4\n1 2 3 4\n-1","expected":"1 2 3 4","hidden":true},{"input":"1\n5\n0","expected":"5","hidden":true},{"input":"5\n10 20 30 40 50\n2","expected":"10 20 30 40 50","hidden":true},{"input":"3\n-1 -2 -3\n0","expected":"-1 -2 -3","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 74
)
on conflict (id) do nothing;

-- 75. Rotate Linked List  [Medium]  /practice/problems/rotate-linked-list
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-linked-list-75', 'dt-practice-linked-list', null,
  $px$Rotate Linked List$px$, $px$rotate-linked-list$px$, $px$Medium$px$,
  $px$Given a linked list and an integer `K`, move the last `K` nodes to the beginning of the list.

**Input Format**

The first line contains two integers `N` and `K`.
The second line contains `N` space-separated integers.

**Output Format**

Print the rotated list from head to tail, separated by single spaces.$px$,
  $px$[{"input":"5 2\n1 2 3 4 5","output":"4 5 1 2 3","explanation":"The last two nodes move to the front."}]$px$::jsonb,
  $px$["1 <= N <= 100000","0 <= K <= 1000000000","-1000000000 <= value <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long kk = Long.parseLong(st.nextToken());\n        String[] a = new String[n];\n        for (int i = 0; i < n; i++) a[i] = st.nextToken();\n        int k = (int) (kk % n);\n        StringBuilder sb = new StringBuilder();\n        for (int i = 0; i < n; i++) {\n            if (i > 0) sb.append(' ');\n            sb.append(a[(i - k % n + n) % n]);\n        }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn, k = int(d[0]), int(d[1])\na = d[2:2+n]\nk %= n\nres = a[n - k:] + a[:n - k] if k else a\nprint(' '.join(res))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    long long n, k;\n    if (scanf(\"%lld %lld\", &n, &k) != 2) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    for (long long i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    long long kk = k % n;\n    for (long long i = 0; i < n; i++) {\n        if (i > 0) putchar(' ');\n        printf(\"%lld\", a[(i - kk % n + n) % n]);\n    }\n    putchar('\\n');\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    long long n, k; cin >> n >> k;\n    vector<long long> a(n);\n    for (auto &v : a) cin >> v;\n    long long kk = k % n;\n    for (long long i = 0; i < n; i++) {\n        if (i > 0) cout << ' ';\n        cout << a[(i - kk % n + n) % n];\n    }\n    cout << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/);\nconst n = Number(d[0]), k = Number(d[1]) % Number(d[0]);\nconst a = d.slice(2, 2 + n);\nconst res = k ? a.slice(n - k).concat(a.slice(0, n - k)) : a;\nconsole.log(res.join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1 0\n7","expected":"7","hidden":true},{"input":"4 4\n1 2 3 4","expected":"1 2 3 4","hidden":true},{"input":"3 7\n1 2 3","expected":"3 1 2","hidden":true},{"input":"6 3\n10 20 30 40 50 60","expected":"40 50 60 10 20 30","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 75
)
on conflict (id) do nothing;

-- ===========================================================================
-- 3. VALIDATION  (raises, never silently passes)
-- ===========================================================================
do $val$
declare
  v_cat_id text := 'dt-practice-linked-list';
  v_n int;
begin
  if not exists (select 1 from public.dsa_topics where id = v_cat_id and kind = 'practice') then
    raise exception '0078/050: category % missing', v_cat_id;
  end if;
  select count(*) into v_n from public.dsa_problems
   where topic_id = v_cat_id and learning_topic_id is null and coalesce(status,'published') = 'published';
  if v_n < 15 then
    raise exception '0078/050: expected >= 15 Linked List practice problems, found %', v_n;
  end if;
  raise notice '0078/050 OK: % Linked List practice problems present.', v_n;
end
$val$;

notify pgrst, 'reload schema';
