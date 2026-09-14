-- admin-panel/supabase/migrations/045_seed_practice_arrays.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: mobile-app/supabase/migrations/0073_seed_practice_arrays.sql ; apply either, the other is a guarded no-op.
-- ============================================================================
-- BODY — global Practice ▸ Coding Problems seed: Arrays (20 problems)
-- (mobile 0073_seed_practice_arrays.sql
--  == admin 045_seed_practice_arrays.sql — byte-identical below the 3-line header,
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
    raise exception '0073/045: practice RPCs not found — apply 0072_practice_coding.sql (admin 044) first.';
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
  ('dt-practice-arrays', $px$Arrays$px$, $px$arrays$px$, $px$Traversal, prefix sums, in-place moves, and classic single-pass array problems.$px$, 1, 'practice', 'published', true, true)
on conflict (id) do nothing;

-- ===========================================================================
-- 2. CODING PROBLEMS — Arrays
-- ===========================================================================

-- 1. Find the Largest Element  [Easy]  /practice/problems/find-the-largest-element
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-arrays-1', 'dt-practice-arrays', null,
  $px$Find the Largest Element$px$, $px$find-the-largest-element$px$, $px$Easy$px$,
  $px$Given an array of `N` integers, find the largest element present in the array.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers.

**Output Format**

Print a single integer — the largest element of the array.$px$,
  $px$[{"input":"5\n4 7 2 9 5","output":"9","explanation":"Among all elements, 9 is the largest."}]$px$::jsonb,
  $px$["1 <= N <= 100000","-1000000000 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long best = Long.MIN_VALUE;\n        for (int i = 0; i < n; i++) best = Math.max(best, Long.parseLong(st.nextToken()));\n        System.out.println(best);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\na = list(map(int, d[1:1+n]))\nprint(max(a))\n","c":"#include <stdio.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long best = -9000000000LL, x;\n    for (int i = 0; i < n; i++) { scanf(\"%lld\", &x); if (x > best) best = x; }\n    printf(\"%lld\\n\", best);\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    long long n; cin >> n;\n    long long best = -9000000000LL, x;\n    for (long long i = 0; i < n; i++) { cin >> x; best = max(best, x); }\n    cout << best << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nlet best = -Infinity;\nfor (let i = 1; i <= n; i++) best = Math.max(best, d[i]);\nconsole.log(best);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n-5","expected":"-5","hidden":true},{"input":"4\n-9 -3 -100 -1","expected":"-1","hidden":true},{"input":"6\n5 5 5 5 5 5","expected":"5","hidden":true},{"input":"3\n1000000000 -1000000000 0","expected":"1000000000","hidden":true},{"input":"8\n2 2 3 1 9 9 4 7","expected":"9","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 1
)
on conflict (id) do nothing;

-- 2. Find the Smallest Element  [Easy]  /practice/problems/find-the-smallest-element
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-arrays-2', 'dt-practice-arrays', null,
  $px$Find the Smallest Element$px$, $px$find-the-smallest-element$px$, $px$Easy$px$,
  $px$Given an array of `N` integers, find the smallest element in the array.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers.

**Output Format**

Print a single integer — the smallest element of the array.$px$,
  $px$[{"input":"5\n8 3 6 1 5","output":"1","explanation":"1 is smaller than every other element."}]$px$::jsonb,
  $px$["1 <= N <= 100000","-1000000000 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long best = Long.MAX_VALUE;\n        for (int i = 0; i < n; i++) best = Math.min(best, Long.parseLong(st.nextToken()));\n        System.out.println(best);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\na = list(map(int, d[1:1+n]))\nprint(min(a))\n","c":"#include <stdio.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long best = 9000000000LL, x;\n    for (int i = 0; i < n; i++) { scanf(\"%lld\", &x); if (x < best) best = x; }\n    printf(\"%lld\\n\", best);\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    long long n; cin >> n;\n    long long best = 9000000000LL, x;\n    for (long long i = 0; i < n; i++) { cin >> x; best = min(best, x); }\n    cout << best << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nlet best = Infinity;\nfor (let i = 1; i <= n; i++) best = Math.min(best, d[i]);\nconsole.log(best);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n42","expected":"42","hidden":true},{"input":"4\n-1 -2 -3 -4","expected":"-4","hidden":true},{"input":"5\n7 7 7 7 7","expected":"7","hidden":true},{"input":"3\n1000000000 0 -1000000000","expected":"-1000000000","hidden":true},{"input":"6\n9 4 4 2 8 2","expected":"2","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 2
)
on conflict (id) do nothing;

-- 3. Find the Second Largest Element  [Easy]  /practice/problems/second-largest-element
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-arrays-3', 'dt-practice-arrays', null,
  $px$Find the Second Largest Element$px$, $px$second-largest-element$px$, $px$Easy$px$,
  $px$Given an array that contains at least two different values, find the second largest **distinct** element.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers. At least two distinct values are present.

**Output Format**

Print the second largest distinct element.$px$,
  $px$[{"input":"5\n10 5 8 10 3","output":"8","explanation":"The largest value is 10; the next largest distinct value is 8."}]$px$::jsonb,
  $px$["2 <= N <= 100000","-1000000000 <= A[i] <= 1000000000","At least two distinct elements exist."]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long big = Long.MIN_VALUE, second = Long.MIN_VALUE;\n        boolean hb = false, hs = false;\n        for (int i = 0; i < n; i++) {\n            long x = Long.parseLong(st.nextToken());\n            if (!hb || x > big) { if (hb) { second = big; hs = true; } big = x; hb = true; }\n            else if (x != big && (!hs || x > second)) { second = x; hs = true; }\n        }\n        System.out.println(second);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\na = list(map(int, d[1:1+n]))\nbig = second = None\nfor x in a:\n    if big is None or x > big:\n        if big is not None:\n            second = big\n        big = x\n    elif x != big and (second is None or x > second):\n        second = x\nprint(second)\n","c":"#include <stdio.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long big = 0, second = 0, x;\n    int hb = 0, hs = 0;\n    for (int i = 0; i < n; i++) {\n        scanf(\"%lld\", &x);\n        if (!hb || x > big) { if (hb) { second = big; hs = 1; } big = x; hb = 1; }\n        else if (x != big && (!hs || x > second)) { second = x; hs = 1; }\n    }\n    printf(\"%lld\\n\", second);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <climits>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    long long n; cin >> n;\n    long long big = LLONG_MIN, second = LLONG_MIN, x;\n    bool hb = false, hs = false;\n    for (long long i = 0; i < n; i++) {\n        cin >> x;\n        if (!hb || x > big) { if (hb) { second = big; hs = true; } big = x; hb = true; }\n        else if (x != big && (!hs || x > second)) { second = x; hs = true; }\n    }\n    cout << second << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nlet big = -Infinity, second = -Infinity;\nfor (let i = 1; i <= n; i++) {\n    const x = d[i];\n    if (x > big) { second = big; big = x; }\n    else if (x !== big && x > second) second = x;\n}\nconsole.log(second);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"2\n1 2","expected":"1","hidden":true},{"input":"6\n7 7 7 7 3 7","expected":"3","hidden":true},{"input":"5\n-1 -2 -3 -4 -5","expected":"-2","hidden":true},{"input":"4\n1000000000 999999999 1000000000 5","expected":"999999999","hidden":true},{"input":"7\n4 1 4 1 4 2 4","expected":"2","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 3
)
on conflict (id) do nothing;

-- 4. Reverse an Array  [Easy]  /practice/problems/reverse-an-array
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-arrays-4', 'dt-practice-arrays', null,
  $px$Reverse an Array$px$, $px$reverse-an-array$px$, $px$Easy$px$,
  $px$Given an array of `N` integers, reverse the order of its elements.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers.

**Output Format**

Print the `N` elements in reverse order, separated by single spaces, on one line.$px$,
  $px$[{"input":"4\n1 2 3 4","output":"4 3 2 1","explanation":"The first element becomes the last, and so on."}]$px$::jsonb,
  $px$["1 <= N <= 100000","-1000000000 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        String[] a = new String[n];\n        for (int i = 0; i < n; i++) a[i] = st.nextToken();\n        StringBuilder sb = new StringBuilder();\n        for (int i = n - 1; i >= 0; i--) { sb.append(a[i]); if (i > 0) sb.append(' '); }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\na = d[1:1+n]\nprint(' '.join(reversed(a)))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long *a = malloc(sizeof(long long) * (n > 0 ? n : 1));\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    for (int i = n - 1; i >= 0; i--) printf(\"%lld%s\", a[i], i > 0 ? \" \" : \"\\n\");\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<long long> a(n);\n    for (auto &x : a) cin >> x;\n    for (int i = n - 1; i >= 0; i--) cout << a[i] << (i > 0 ? ' ' : '\\n');\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/);\nconst n = Number(d[0]);\nconst a = d.slice(1, 1 + n);\nconsole.log(a.reverse().join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n7","expected":"7","hidden":true},{"input":"2\n-5 5","expected":"5 -5","hidden":true},{"input":"5\n1 1 2 2 3","expected":"3 2 2 1 1","hidden":true},{"input":"6\n10 20 30 40 50 60","expected":"60 50 40 30 20 10","hidden":true},{"input":"3\n0 -1 -2","expected":"-2 -1 0","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 4
)
on conflict (id) do nothing;

-- 5. Check if an Array is Sorted  [Easy]  /practice/problems/check-if-array-is-sorted
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-arrays-5', 'dt-practice-arrays', null,
  $px$Check if an Array is Sorted$px$, $px$check-if-array-is-sorted$px$, $px$Easy$px$,
  $px$Given an array of `N` integers, determine whether its elements are arranged in non-decreasing order.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers.

**Output Format**

Print `1` if the array is sorted in non-decreasing order, otherwise print `0`.$px$,
  $px$[{"input":"5\n1 2 2 5 8","output":"1","explanation":"Every element is <= the element after it."}]$px$::jsonb,
  $px$["1 <= N <= 100000","-1000000000 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long prev = Long.MIN_VALUE;\n        int ok = 1;\n        for (int i = 0; i < n; i++) {\n            long x = Long.parseLong(st.nextToken());\n            if (x < prev) ok = 0;\n            prev = x;\n        }\n        System.out.println(ok);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\na = list(map(int, d[1:1+n]))\nprint(1 if all(a[i] <= a[i+1] for i in range(n-1)) else 0)\n","c":"#include <stdio.h>\n#include <limits.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long prev = LLONG_MIN, x;\n    int ok = 1;\n    for (int i = 0; i < n; i++) { scanf(\"%lld\", &x); if (x < prev) ok = 0; prev = x; }\n    printf(\"%d\\n\", ok);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <climits>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    long long prev = LLONG_MIN, x;\n    int ok = 1;\n    for (int i = 0; i < n; i++) { cin >> x; if (x < prev) ok = 0; prev = x; }\n    cout << ok << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nlet ok = 1;\nfor (let i = 2; i <= n; i++) if (d[i] < d[i - 1]) ok = 0;\nconsole.log(ok);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n5","expected":"1","hidden":true},{"input":"4\n3 2 1 0","expected":"0","hidden":true},{"input":"5\n-5 -5 -3 0 9","expected":"1","hidden":true},{"input":"3\n1 3 2","expected":"0","hidden":true},{"input":"6\n7 7 7 7 7 7","expected":"1","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 5
)
on conflict (id) do nothing;

-- 6. Count Even and Odd Numbers  [Easy]  /practice/problems/count-even-and-odd-numbers
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-arrays-6', 'dt-practice-arrays', null,
  $px$Count Even and Odd Numbers$px$, $px$count-even-and-odd-numbers$px$, $px$Easy$px$,
  $px$Given an array of `N` integers, count how many elements are even and how many are odd.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers.

**Output Format**

Print two lines:
`Even = X`
`Odd = Y`
where `X` is the count of even numbers and `Y` is the count of odd numbers.$px$,
  $px$[{"input":"5\n2 7 4 9 6","output":"Even = 3\nOdd = 2","explanation":"2, 4, 6 are even and 7, 9 are odd."}]$px$::jsonb,
  $px$["1 <= N <= 100000","-1000000000 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        int e = 0;\n        for (int i = 0; i < n; i++) { long x = Long.parseLong(st.nextToken()); if (x % 2 == 0) e++; }\n        System.out.println(\"Even = \" + e);\n        System.out.println(\"Odd = \" + (n - e));\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\na = list(map(int, d[1:1+n]))\ne = sum(1 for x in a if x % 2 == 0)\nprint(f\"Even = {e}\")\nprint(f\"Odd = {n - e}\")\n","c":"#include <stdio.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long x;\n    int e = 0;\n    for (int i = 0; i < n; i++) { scanf(\"%lld\", &x); if (x % 2 == 0) e++; }\n    printf(\"Even = %d\\nOdd = %d\\n\", e, n - e);\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    long long x;\n    int e = 0;\n    for (int i = 0; i < n; i++) { cin >> x; if (x % 2 == 0) e++; }\n    cout << \"Even = \" << e << \"\\nOdd = \" << (n - e) << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nlet e = 0;\nfor (let i = 1; i <= n; i++) if (d[i] % 2 === 0) e++;\nconsole.log(`Even = ${e}`);\nconsole.log(`Odd = ${n - e}`);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n0","expected":"Even = 1\nOdd = 0","hidden":true},{"input":"4\n-2 -4 -6 -8","expected":"Even = 4\nOdd = 0","hidden":true},{"input":"5\n-1 -3 -5 -7 -9","expected":"Even = 0\nOdd = 5","hidden":true},{"input":"6\n1 2 3 4 5 6","expected":"Even = 3\nOdd = 3","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 6
)
on conflict (id) do nothing;

-- 7. Find the Majority Element  [Medium]  /practice/problems/find-the-majority-element
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-arrays-7', 'dt-practice-arrays', null,
  $px$Find the Majority Element$px$, $px$find-the-majority-element$px$, $px$Medium$px$,
  $px$Given an array of size `N`, find the element that appears more than `N/2` times. You may assume a majority element always exists.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers.

**Output Format**

Print the majority element.$px$,
  $px$[{"input":"3\n2 1 2","output":"2","explanation":"2 appears 2 times, which is greater than floor(3/2) = 1."}]$px$::jsonb,
  $px$["1 <= N <= 100000","1 <= A[i] <= 1000000000","A majority element is guaranteed to exist."]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long cand = 0; int count = 0;\n        for (int i = 0; i < n; i++) {\n            long x = Long.parseLong(st.nextToken());\n            if (count == 0) { cand = x; count = 1; }\n            else if (x == cand) count++;\n            else count--;\n        }\n        System.out.println(cand);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\na = list(map(int, d[1:1+n]))\ncand = None\ncount = 0\nfor x in a:\n    if count == 0:\n        cand = x\n        count = 1\n    elif x == cand:\n        count += 1\n    else:\n        count -= 1\nprint(cand)\n","c":"#include <stdio.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long cand = 0, x;\n    int count = 0;\n    for (int i = 0; i < n; i++) {\n        scanf(\"%lld\", &x);\n        if (count == 0) { cand = x; count = 1; }\n        else if (x == cand) count++;\n        else count--;\n    }\n    printf(\"%lld\\n\", cand);\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    long long cand = 0, x; int count = 0;\n    for (int i = 0; i < n; i++) {\n        cin >> x;\n        if (count == 0) { cand = x; count = 1; }\n        else if (x == cand) count++;\n        else count--;\n    }\n    cout << cand << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nlet cand = 0, count = 0;\nfor (let i = 1; i <= n; i++) {\n    const x = d[i];\n    if (count === 0) { cand = x; count = 1; }\n    else if (x === cand) count++;\n    else count--;\n}\nconsole.log(cand);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n9","expected":"9","hidden":true},{"input":"7\n3 3 4 2 3 3 3","expected":"3","hidden":true},{"input":"5\n1 1 1 2 2","expected":"1","hidden":true},{"input":"9\n5 5 5 5 5 1 2 3 4","expected":"5","hidden":true},{"input":"4\n7 7 7 1","expected":"7","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 7
)
on conflict (id) do nothing;

-- 8. Move All Zeros to the End  [Easy]  /practice/problems/move-all-zeros-to-the-end
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-arrays-8', 'dt-practice-arrays', null,
  $px$Move All Zeros to the End$px$, $px$move-all-zeros-to-the-end$px$, $px$Easy$px$,
  $px$Given an array of `N` non-negative integers, move every zero to the end while keeping the relative order of the non-zero elements unchanged.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated non-negative integers.

**Output Format**

Print the modified array as `N` space-separated integers on one line.$px$,
  $px$[{"input":"5\n0 4 0 2 7","output":"4 2 7 0 0","explanation":"Non-zero elements keep their order; zeros are pushed to the end."}]$px$::jsonb,
  $px$["1 <= N <= 100000","0 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long[] a = new long[n];\n        for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());\n        StringBuilder sb = new StringBuilder();\n        int written = 0;\n        for (int i = 0; i < n; i++) if (a[i] != 0) { if (written++ > 0) sb.append(' '); sb.append(a[i]); }\n        for (int i = written; i < n; i++) { if (i > 0) sb.append(' '); sb.append(0); }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\na = list(map(int, d[1:1+n]))\nnz = [x for x in a if x != 0]\nnz += [0] * (n - len(nz))\nprint(' '.join(map(str, nz)))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long *a = malloc(sizeof(long long) * (n > 0 ? n : 1));\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    int written = 0;\n    for (int i = 0; i < n; i++) if (a[i] != 0) { if (written++) putchar(' '); printf(\"%lld\", a[i]); }\n    for (int i = written; i < n; i++) { if (i) putchar(' '); putchar('0'); }\n    putchar('\\n');\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<long long> a(n);\n    for (auto &x : a) cin >> x;\n    int written = 0;\n    for (int i = 0; i < n; i++) if (a[i] != 0) { if (written++) cout << ' '; cout << a[i]; }\n    for (int i = written; i < n; i++) { if (i) cout << ' '; cout << 0; }\n    cout << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst a = d.slice(1, 1 + n);\nconst nz = a.filter((x) => x !== 0);\nwhile (nz.length < n) nz.push(0);\nconsole.log(nz.join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n0","expected":"0","hidden":true},{"input":"1\n5","expected":"5","hidden":true},{"input":"4\n0 0 0 0","expected":"0 0 0 0","hidden":true},{"input":"6\n1 2 3 4 5 6","expected":"1 2 3 4 5 6","hidden":true},{"input":"7\n0 1 0 2 0 3 0","expected":"1 2 3 0 0 0 0","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 8
)
on conflict (id) do nothing;

-- 9. Find the Missing Number  [Easy]  /practice/problems/find-the-missing-number
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-arrays-9', 'dt-practice-arrays', null,
  $px$Find the Missing Number$px$, $px$find-the-missing-number$px$, $px$Easy$px$,
  $px$An array contains `N-1` distinct numbers taken from `1` to `N`, with exactly one number missing. Find the missing number.

**Input Format**

The first line contains an integer `N`.
The second line contains `N-1` space-separated distinct integers, each between `1` and `N`.

**Output Format**

Print the missing number.$px$,
  $px$[{"input":"5\n1 2 4 5","output":"3","explanation":"The numbers 1..5 should be 1 2 3 4 5, so 3 is missing."}]$px$::jsonb,
  $px$["2 <= N <= 100000","Exactly one number from 1..N is missing."]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        long n = Long.parseLong(st.nextToken());\n        long sum = n * (n + 1) / 2;\n        for (int i = 0; i < n - 1; i++) sum -= Long.parseLong(st.nextToken());\n        System.out.println(sum);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\na = list(map(int, d[1:n]))\nprint(n * (n + 1) // 2 - sum(a))\n","c":"#include <stdio.h>\nint main(void) {\n    long long n;\n    if (scanf(\"%lld\", &n) != 1) return 0;\n    long long sum = n * (n + 1) / 2, x;\n    for (long long i = 0; i < n - 1; i++) { scanf(\"%lld\", &x); sum -= x; }\n    printf(\"%lld\\n\", sum);\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    long long n; cin >> n;\n    long long sum = n * (n + 1) / 2, x;\n    for (long long i = 0; i < n - 1; i++) { cin >> x; sum -= x; }\n    cout << sum << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nlet sum = (n * (n + 1)) / 2;\nfor (let i = 1; i < n; i++) sum -= d[i];\nconsole.log(sum);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"2\n2","expected":"1","hidden":true},{"input":"2\n1","expected":"2","hidden":true},{"input":"5\n2 3 4 5","expected":"1","hidden":true},{"input":"6\n1 2 3 4 5","expected":"6","hidden":true},{"input":"10\n1 2 3 4 5 6 8 9 10","expected":"7","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 9
)
on conflict (id) do nothing;

-- 10. Find the Unique Element  [Easy]  /practice/problems/find-the-unique-element
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-arrays-10', 'dt-practice-arrays', null,
  $px$Find the Unique Element$px$, $px$find-the-unique-element$px$, $px$Easy$px$,
  $px$Every element in an array appears exactly twice except one element, which appears once. Find the element that appears only once.

**Input Format**

The first line contains an integer `N` (`N` is odd).
The second line contains `N` space-separated integers.

**Output Format**

Print the element that appears exactly once.$px$,
  $px$[{"input":"5\n4 1 2 1 2","output":"4","explanation":"1 and 2 appear twice; 4 appears once."}]$px$::jsonb,
  $px$["1 <= N <= 100000","N is odd","-1000000000 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long r = 0;\n        for (int i = 0; i < n; i++) r ^= Long.parseLong(st.nextToken());\n        System.out.println(r);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\nr = 0\nfor x in map(int, d[1:1+n]):\n    r ^= x\nprint(r)\n","c":"#include <stdio.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long r = 0, x;\n    for (int i = 0; i < n; i++) { scanf(\"%lld\", &x); r ^= x; }\n    printf(\"%lld\\n\", r);\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    long long r = 0, x;\n    for (int i = 0; i < n; i++) { cin >> x; r ^= x; }\n    cout << r << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nlet r = 0;\nfor (let i = 1; i <= n; i++) r ^= d[i];\nconsole.log(r);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n99","expected":"99","hidden":true},{"input":"3\n7 7 -3","expected":"-3","hidden":true},{"input":"7\n5 6 5 9 6 9 1","expected":"1","hidden":true},{"input":"5\n0 1000000000 0 1 1","expected":"1000000000","hidden":true},{"input":"9\n2 2 3 3 4 4 5 5 8","expected":"8","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 10
)
on conflict (id) do nothing;

-- 11. Remove Duplicates from a Sorted Array  [Easy]  /practice/problems/remove-duplicates-from-sorted-array
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-arrays-11', 'dt-practice-arrays', null,
  $px$Remove Duplicates from a Sorted Array$px$, $px$remove-duplicates-from-sorted-array$px$, $px$Easy$px$,
  $px$Given a sorted array of `N` integers, remove duplicate values so that every distinct value appears only once, keeping the sorted order.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers in non-decreasing order.

**Output Format**

Print the distinct values in increasing order, separated by single spaces, on one line.$px$,
  $px$[{"input":"7\n1 1 2 2 3 4 4","output":"1 2 3 4","explanation":"Repeated copies are removed; each value is kept once."}]$px$::jsonb,
  $px$["1 <= N <= 100000","-1000000000 <= A[i] <= 1000000000","The array is sorted in non-decreasing order."]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        StringBuilder sb = new StringBuilder();\n        boolean first = true;\n        Long prev = null;\n        for (int i = 0; i < n; i++) {\n            long x = Long.parseLong(st.nextToken());\n            if (prev == null || prev != x) { if (!first) sb.append(' '); sb.append(x); first = false; prev = x; }\n        }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\na = list(map(int, d[1:1+n]))\nout = []\nfor x in a:\n    if not out or out[-1] != x:\n        out.append(x)\nprint(' '.join(map(str, out)))\n","c":"#include <stdio.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long x, prev = 0;\n    int has = 0, first = 1;\n    for (int i = 0; i < n; i++) {\n        scanf(\"%lld\", &x);\n        if (!has || prev != x) { if (!first) putchar(' '); printf(\"%lld\", x); first = 0; prev = x; has = 1; }\n    }\n    putchar('\\n');\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    long long x, prev = 0;\n    bool has = false, first = true;\n    for (int i = 0; i < n; i++) {\n        cin >> x;\n        if (!has || prev != x) { if (!first) cout << ' '; cout << x; first = false; prev = x; has = true; }\n    }\n    cout << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst out = [];\nfor (let i = 1; i <= n; i++) if (out.length === 0 || out[out.length - 1] !== d[i]) out.push(d[i]);\nconsole.log(out.join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n5","expected":"5","hidden":true},{"input":"5\n2 2 2 2 2","expected":"2","hidden":true},{"input":"4\n-3 -1 0 2","expected":"-3 -1 0 2","hidden":true},{"input":"6\n1 1 1 2 3 3","expected":"1 2 3","hidden":true},{"input":"8\n-5 -5 -5 -5 4 4 4 9","expected":"-5 4 9","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 11
)
on conflict (id) do nothing;

-- 12. Find the Intersection of Two Arrays  [Easy]  /practice/problems/intersection-of-two-arrays
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-arrays-12', 'dt-practice-arrays', null,
  $px$Find the Intersection of Two Arrays$px$, $px$intersection-of-two-arrays$px$, $px$Easy$px$,
  $px$Given two arrays, find the values that are present in **both** arrays. Each value must appear only once in the result.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers (array A).
The third line contains an integer `M`.
The fourth line contains `M` space-separated integers (array B).

**Output Format**

Print the distinct common values in increasing order, separated by single spaces. If there are no common values, print an empty line.$px$,
  $px$[{"input":"4\n1 2 2 4\n4\n2 2 3 4","output":"2 4","explanation":"2 and 4 are present in both arrays."}]$px$::jsonb,
  $px$["1 <= N, M <= 100000","-1000000000 <= A[i], B[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        Set<Long> a = new HashSet<>();\n        for (int i = 0; i < n; i++) a.add(Long.parseLong(st.nextToken()));\n        int m = Integer.parseInt(st.nextToken());\n        TreeSet<Long> res = new TreeSet<>();\n        for (int i = 0; i < m; i++) { long x = Long.parseLong(st.nextToken()); if (a.contains(x)) res.add(x); }\n        StringBuilder sb = new StringBuilder();\n        boolean first = true;\n        for (long x : res) { if (!first) sb.append(' '); sb.append(x); first = false; }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\ni = 0\nn = int(d[i]); i += 1\na = set(map(int, d[i:i+n])); i += n\nm = int(d[i]); i += 1\nb = set(map(int, d[i:i+m]))\nres = sorted(a & b)\nprint(' '.join(map(str, res)))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint cmp(const void *p, const void *q) { long long a = *(const long long*)p, b = *(const long long*)q; return (a > b) - (a < b); }\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    qsort(a, n, sizeof(long long), cmp);\n    int m; scanf(\"%d\", &m);\n    long long *b = malloc(sizeof(long long) * m);\n    for (int i = 0; i < m; i++) scanf(\"%lld\", &b[i]);\n    qsort(b, m, sizeof(long long), cmp);\n    int i = 0, j = 0, first = 1;\n    long long last = 0; int has = 0;\n    while (i < n && j < m) {\n        if (a[i] < b[j]) i++;\n        else if (a[i] > b[j]) j++;\n        else { if (!has || last != a[i]) { if (!first) putchar(' '); printf(\"%lld\", a[i]); first = 0; last = a[i]; has = 1; } i++; j++; }\n    }\n    putchar('\\n');\n    free(a); free(b);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <set>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    set<long long> a;\n    for (int i = 0; i < n; i++) { long long x; cin >> x; a.insert(x); }\n    int m; cin >> m;\n    set<long long> res;\n    for (int i = 0; i < m; i++) { long long x; cin >> x; if (a.count(x)) res.insert(x); }\n    bool first = true;\n    for (long long x : res) { if (!first) cout << ' '; cout << x; first = false; }\n    cout << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nlet i = 0;\nconst n = d[i++];\nconst a = new Set(d.slice(i, i + n)); i += n;\nconst m = d[i++];\nconst res = new Set();\nfor (let k = 0; k < m; k++) { const x = d[i + k]; if (a.has(x)) res.add(x); }\nconsole.log([...res].sort((x, y) => x - y).join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"3\n1 2 3\n3\n4 5 6","expected":"","hidden":true},{"input":"3\n5 5 5\n2\n5 5","expected":"5","hidden":true},{"input":"5\n9 1 7 3 5\n4\n5 3 1 8","expected":"1 3 5","hidden":true},{"input":"2\n-4 -2\n3\n-2 -4 -6","expected":"-4 -2","hidden":true},{"input":"1\n1000000000\n1\n1000000000","expected":"1000000000","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 12
)
on conflict (id) do nothing;

-- 13. Find the Union of Two Arrays  [Easy]  /practice/problems/union-of-two-arrays
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-arrays-13', 'dt-practice-arrays', null,
  $px$Find the Union of Two Arrays$px$, $px$union-of-two-arrays$px$, $px$Easy$px$,
  $px$Given two arrays, create the set of every distinct value that appears in **either** array.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers (array A).
The third line contains an integer `M`.
The fourth line contains `M` space-separated integers (array B).

**Output Format**

Print the distinct values from either array in increasing order, separated by single spaces.$px$,
  $px$[{"input":"4\n1 2 2 4\n4\n2 3 4 5","output":"1 2 3 4 5","explanation":"All distinct values from both arrays, listed once."}]$px$::jsonb,
  $px$["1 <= N, M <= 100000","-1000000000 <= A[i], B[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        TreeSet<Long> s = new TreeSet<>();\n        for (int i = 0; i < n; i++) s.add(Long.parseLong(st.nextToken()));\n        int m = Integer.parseInt(st.nextToken());\n        for (int i = 0; i < m; i++) s.add(Long.parseLong(st.nextToken()));\n        StringBuilder sb = new StringBuilder();\n        boolean first = true;\n        for (long x : s) { if (!first) sb.append(' '); sb.append(x); first = false; }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\ni = 0\nn = int(d[i]); i += 1\ns = set(map(int, d[i:i+n])); i += n\nm = int(d[i]); i += 1\ns |= set(map(int, d[i:i+m]))\nprint(' '.join(map(str, sorted(s))))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint cmp(const void *p, const void *q) { long long a = *(const long long*)p, b = *(const long long*)q; return (a > b) - (a < b); }\nint main(void) {\n    int n, m;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long *buf = malloc(sizeof(long long) * (n + 100000));\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &buf[i]);\n    scanf(\"%d\", &m);\n    buf = realloc(buf, sizeof(long long) * (n + m));\n    for (int i = 0; i < m; i++) scanf(\"%lld\", &buf[n + i]);\n    int total = n + m;\n    qsort(buf, total, sizeof(long long), cmp);\n    int first = 1;\n    for (int i = 0; i < total; i++) {\n        if (i > 0 && buf[i] == buf[i - 1]) continue;\n        if (!first) putchar(' ');\n        printf(\"%lld\", buf[i]);\n        first = 0;\n    }\n    putchar('\\n');\n    free(buf);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <set>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    set<long long> s;\n    for (int i = 0; i < n; i++) { long long x; cin >> x; s.insert(x); }\n    int m; cin >> m;\n    for (int i = 0; i < m; i++) { long long x; cin >> x; s.insert(x); }\n    bool first = true;\n    for (long long x : s) { if (!first) cout << ' '; cout << x; first = false; }\n    cout << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nlet i = 0;\nconst n = d[i++];\nconst s = new Set(d.slice(i, i + n)); i += n;\nconst m = d[i++];\nfor (let k = 0; k < m; k++) s.add(d[i + k]);\nconsole.log([...s].sort((x, y) => x - y).join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n1\n1\n1","expected":"1","hidden":true},{"input":"3\n3 3 3\n3\n1 1 2","expected":"1 2 3","hidden":true},{"input":"2\n-5 5\n2\n0 -5","expected":"-5 0 5","hidden":true},{"input":"3\n10 20 30\n3\n40 50 60","expected":"10 20 30 40 50 60","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 13
)
on conflict (id) do nothing;

-- 14. Rotate an Array by K Positions  [Medium]  /practice/problems/rotate-array-by-k
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-arrays-14', 'dt-practice-arrays', null,
  $px$Rotate an Array by K Positions$px$, $px$rotate-array-by-k$px$, $px$Medium$px$,
  $px$Given an array of `N` integers and an integer `K`, rotate the array to the **right** by `K` positions.

**Input Format**

The first line contains two integers `N` and `K`.
The second line contains `N` space-separated integers.

**Output Format**

Print the rotated array as `N` space-separated integers on one line.$px$,
  $px$[{"input":"5 2\n1 2 3 4 5","output":"4 5 1 2 3","explanation":"The last two elements move to the front."}]$px$::jsonb,
  $px$["1 <= N <= 100000","0 <= K <= 1000000000","-1000000000 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long k = Long.parseLong(st.nextToken());\n        long[] a = new long[n];\n        for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());\n        int shift = (int) (k % n);\n        StringBuilder sb = new StringBuilder();\n        for (int i = 0; i < n; i++) {\n            if (i > 0) sb.append(' ');\n            sb.append(a[(i - shift % n + n) % n]);\n        }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn, k = int(d[0]), int(d[1])\na = list(map(int, d[2:2+n]))\nk %= n\nres = a[-k:] + a[:-k] if k else a\nprint(' '.join(map(str, res)))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    long long n, k;\n    if (scanf(\"%lld %lld\", &n, &k) != 2) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    for (long long i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    long long shift = k % n;\n    for (long long i = 0; i < n; i++) {\n        if (i > 0) putchar(' ');\n        printf(\"%lld\", a[(i - shift % n + n) % n]);\n    }\n    putchar('\\n');\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    long long n, k; cin >> n >> k;\n    vector<long long> a(n);\n    for (auto &x : a) cin >> x;\n    long long shift = k % n;\n    for (long long i = 0; i < n; i++) {\n        if (i > 0) cout << ' ';\n        cout << a[(i - shift % n + n) % n];\n    }\n    cout << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], k = d[1] % d[0];\nconst a = d.slice(2, 2 + n);\nconst res = k ? a.slice(n - k).concat(a.slice(0, n - k)) : a;\nconsole.log(res.join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1 0\n9","expected":"9","hidden":true},{"input":"4 4\n1 2 3 4","expected":"1 2 3 4","hidden":true},{"input":"3 1000000000\n1 2 3","expected":"3 1 2","hidden":true},{"input":"6 3\n10 20 30 40 50 60","expected":"40 50 60 10 20 30","hidden":true},{"input":"2 5\n-1 -2","expected":"-2 -1","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 14
)
on conflict (id) do nothing;

-- 15. Maximum Subarray Sum  [Medium]  /practice/problems/maximum-subarray-sum
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-arrays-15', 'dt-practice-arrays', null,
  $px$Maximum Subarray Sum$px$, $px$maximum-subarray-sum$px$, $px$Medium$px$,
  $px$Find the maximum possible sum of a non-empty contiguous subarray of the given array.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers.

**Output Format**

Print the maximum subarray sum.$px$,
  $px$[{"input":"5\n-2 3 -1 4 -5","output":"6","explanation":"The subarray [3, -1, 4] has the maximum sum, 6."}]$px$::jsonb,
  $px$["1 <= N <= 100000","-1000000000 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long best = Long.MIN_VALUE, cur = 0;\n        for (int i = 0; i < n; i++) {\n            long x = Long.parseLong(st.nextToken());\n            cur = Math.max(x, cur + x);\n            best = Math.max(best, cur);\n        }\n        System.out.println(best);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\na = list(map(int, d[1:1+n]))\nbest = cur = a[0]\nfor x in a[1:]:\n    cur = max(x, cur + x)\n    best = max(best, cur)\nprint(best)\n","c":"#include <stdio.h>\n#include <limits.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long best = LLONG_MIN, cur = 0, x;\n    for (int i = 0; i < n; i++) {\n        scanf(\"%lld\", &x);\n        cur = (x > cur + x) ? x : cur + x;\n        if (cur > best) best = cur;\n    }\n    printf(\"%lld\\n\", best);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <climits>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    long long best = LLONG_MIN, cur = 0, x;\n    for (int i = 0; i < n; i++) {\n        cin >> x;\n        cur = max(x, cur + x);\n        best = max(best, cur);\n    }\n    cout << best << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nlet best = -Infinity, cur = 0;\nfor (let i = 1; i <= n; i++) {\n    cur = Math.max(d[i], cur + d[i]);\n    best = Math.max(best, cur);\n}\nconsole.log(best);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n-7","expected":"-7","hidden":true},{"input":"5\n-5 -4 -3 -2 -1","expected":"-1","hidden":true},{"input":"4\n1 2 3 4","expected":"10","hidden":true},{"input":"6\n5 -2 5 -2 5 -100","expected":"11","hidden":true},{"input":"3\n-1 -1 -1","expected":"-1","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 15
)
on conflict (id) do nothing;

-- 16. Two Sum  [Easy]  /practice/problems/two-sum-exists
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-arrays-16', 'dt-practice-arrays', null,
  $px$Two Sum$px$, $px$two-sum-exists$px$, $px$Easy$px$,
  $px$Given an array and a target value, determine whether **two different positions** hold values that add up to the target.

**Input Format**

The first line contains two integers `N` and `target`.
The second line contains `N` space-separated integers.

**Output Format**

Print `1` if such a pair exists, otherwise print `0`.$px$,
  $px$[{"input":"4 9\n2 7 11 15","output":"1","explanation":"2 + 7 = 9."}]$px$::jsonb,
  $px$["2 <= N <= 100000","-1000000000 <= A[i], target <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long target = Long.parseLong(st.nextToken());\n        Set<Long> seen = new HashSet<>();\n        int ans = 0;\n        for (int i = 0; i < n; i++) {\n            long x = Long.parseLong(st.nextToken());\n            if (seen.contains(target - x)) { ans = 1; }\n            seen.add(x);\n        }\n        System.out.println(ans);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn, target = int(d[0]), int(d[1])\nseen = set()\nans = 0\nfor x in map(int, d[2:2+n]):\n    if target - x in seen:\n        ans = 1\n        break\n    seen.add(x)\nprint(ans)\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint cmp(const void *p, const void *q) { long long a = *(const long long*)p, b = *(const long long*)q; return (a > b) - (a < b); }\nint main(void) {\n    long long n, target;\n    if (scanf(\"%lld %lld\", &n, &target) != 2) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    for (long long i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    qsort(a, n, sizeof(long long), cmp);\n    long long i = 0, j = n - 1;\n    int ans = 0;\n    while (i < j) {\n        long long s = a[i] + a[j];\n        if (s == target) { ans = 1; break; }\n        else if (s < target) i++;\n        else j--;\n    }\n    printf(\"%d\\n\", ans);\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <unordered_set>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    long long n, target; cin >> n >> target;\n    unordered_set<long long> seen;\n    int ans = 0;\n    for (long long i = 0; i < n; i++) {\n        long long x; cin >> x;\n        if (seen.count(target - x)) ans = 1;\n        seen.insert(x);\n    }\n    cout << ans << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], target = d[1];\nconst seen = new Set();\nlet ans = 0;\nfor (let i = 2; i < 2 + n; i++) {\n    if (seen.has(target - d[i])) ans = 1;\n    seen.add(d[i]);\n}\nconsole.log(ans);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"2 5\n1 2","expected":"0","hidden":true},{"input":"5 0\n-3 1 2 3 4","expected":"1","hidden":true},{"input":"3 6\n3 3 1","expected":"1","hidden":true},{"input":"4 100\n1 2 3 4","expected":"0","hidden":true},{"input":"2 -8\n-4 -4","expected":"1","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 16
)
on conflict (id) do nothing;

-- 17. Best Time to Buy and Sell Stock  [Easy]  /practice/problems/best-time-to-buy-and-sell-stock
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-arrays-17', 'dt-practice-arrays', null,
  $px$Best Time to Buy and Sell Stock$px$, $px$best-time-to-buy-and-sell-stock$px$, $px$Easy$px$,
  $px$Given daily stock prices, choose one day to buy and a later day to sell so that the profit is as large as possible.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers, where the i-th value is the price on day `i`.

**Output Format**

Print the maximum possible profit, or `0` if no profit can be made.$px$,
  $px$[{"input":"6\n7 1 5 3 6 4","output":"5","explanation":"Buy at 1 and sell at 6 for a profit of 5."}]$px$::jsonb,
  $px$["1 <= N <= 100000","0 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long low = Long.MAX_VALUE, best = 0;\n        for (int i = 0; i < n; i++) {\n            long x = Long.parseLong(st.nextToken());\n            best = Math.max(best, x - low);\n            low = Math.min(low, x);\n        }\n        System.out.println(best);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\na = list(map(int, d[1:1+n]))\nlow = a[0]\nbest = 0\nfor x in a[1:]:\n    best = max(best, x - low)\n    low = min(low, x)\nprint(best)\n","c":"#include <stdio.h>\n#include <limits.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long low = LLONG_MAX, best = 0, x;\n    for (int i = 0; i < n; i++) {\n        scanf(\"%lld\", &x);\n        if (x - low > best) best = x - low;\n        if (x < low) low = x;\n    }\n    printf(\"%lld\\n\", best);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <climits>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    long long low = LLONG_MAX, best = 0, x;\n    for (int i = 0; i < n; i++) {\n        cin >> x;\n        best = max(best, x - low);\n        low = min(low, x);\n    }\n    cout << best << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nlet low = Infinity, best = 0;\nfor (let i = 1; i <= n; i++) {\n    best = Math.max(best, d[i] - low);\n    low = Math.min(low, d[i]);\n}\nconsole.log(best);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n5","expected":"0","hidden":true},{"input":"5\n7 6 4 3 1","expected":"0","hidden":true},{"input":"4\n1 2 3 4","expected":"3","hidden":true},{"input":"6\n3 2 6 1 4 9","expected":"8","hidden":true},{"input":"2\n1000000000 0","expected":"0","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 17
)
on conflict (id) do nothing;

-- 18. Find a Subarray with Given Sum  [Medium]  /practice/problems/subarray-with-given-sum
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-arrays-18', 'dt-practice-arrays', null,
  $px$Find a Subarray with Given Sum$px$, $px$subarray-with-given-sum$px$, $px$Medium$px$,
  $px$Given an array of non-negative integers and a target sum, determine whether some contiguous subarray adds up to exactly that sum.

**Input Format**

The first line contains two integers `N` and `target`.
The second line contains `N` space-separated non-negative integers.

**Output Format**

Print `1` if such a subarray exists, otherwise print `0`.$px$,
  $px$[{"input":"6 33\n1 4 20 3 10 5","output":"1","explanation":"The subarray [20, 3, 10] sums to 33."}]$px$::jsonb,
  $px$["1 <= N <= 100000","0 <= A[i] <= 1000000000","0 <= target <= 100000000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long target = Long.parseLong(st.nextToken());\n        long[] a = new long[n];\n        for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());\n        long cur = 0;\n        int lo = 0, ans = 0;\n        for (int hi = 0; hi < n; hi++) {\n            cur += a[hi];\n            while (cur > target && lo <= hi) cur -= a[lo++];\n            if (cur == target) { ans = 1; break; }\n        }\n        System.out.println(ans);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn, target = int(d[0]), int(d[1])\na = list(map(int, d[2:2+n]))\nlo = 0\ncur = 0\nans = 0\nfor hi in range(n):\n    cur += a[hi]\n    while cur > target and lo <= hi:\n        cur -= a[lo]\n        lo += 1\n    if cur == target:\n        ans = 1\n        break\nprint(ans)\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    long long n, target;\n    if (scanf(\"%lld %lld\", &n, &target) != 2) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    for (long long i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    long long cur = 0;\n    long long lo = 0;\n    int ans = 0;\n    for (long long hi = 0; hi < n; hi++) {\n        cur += a[hi];\n        while (cur > target && lo <= hi) cur -= a[lo++];\n        if (cur == target) { ans = 1; break; }\n    }\n    printf(\"%d\\n\", ans);\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    long long n, target; cin >> n >> target;\n    vector<long long> a(n);\n    for (auto &x : a) cin >> x;\n    long long cur = 0, lo = 0;\n    int ans = 0;\n    for (long long hi = 0; hi < n; hi++) {\n        cur += a[hi];\n        while (cur > target && lo <= hi) cur -= a[lo++];\n        if (cur == target) { ans = 1; break; }\n    }\n    cout << ans << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], target = d[1];\nconst a = d.slice(2, 2 + n);\nlet cur = 0, lo = 0, ans = 0;\nfor (let hi = 0; hi < n; hi++) {\n    cur += a[hi];\n    while (cur > target && lo <= hi) cur -= a[lo++];\n    if (cur === target) { ans = 1; break; }\n}\nconsole.log(ans);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1 5\n5","expected":"1","hidden":true},{"input":"1 0\n7","expected":"1","hidden":true},{"input":"3 100\n1 2 3","expected":"0","hidden":true},{"input":"5 15\n1 2 3 4 5","expected":"1","hidden":true},{"input":"4 7\n2 2 2 2","expected":"0","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 18
)
on conflict (id) do nothing;

-- 19. Find the Maximum Product of Two Elements  [Easy]  /practice/problems/maximum-product-of-two-elements
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-arrays-19', 'dt-practice-arrays', null,
  $px$Find the Maximum Product of Two Elements$px$, $px$maximum-product-of-two-elements$px$, $px$Easy$px$,
  $px$Given an array of `N` integers, find the maximum product obtainable by multiplying values at two **different** positions.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers.

**Output Format**

Print the maximum product of any two elements at different positions.$px$,
  $px$[{"input":"4\n-10 -3 5 6","output":"30","explanation":"The maximum product is 5 * 6 = 30."}]$px$::jsonb,
  $px$["2 <= N <= 100000","-100000 <= A[i] <= 100000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long[] a = new long[n];\n        for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());\n        Arrays.sort(a);\n        System.out.println(Math.max(a[n - 1] * a[n - 2], a[0] * a[1]));\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\na = sorted(map(int, d[1:1+n]))\nprint(max(a[-1] * a[-2], a[0] * a[1]))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint cmp(const void *p, const void *q) { long long a = *(const long long*)p, b = *(const long long*)q; return (a > b) - (a < b); }\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    qsort(a, n, sizeof(long long), cmp);\n    long long p1 = a[n - 1] * a[n - 2], p2 = a[0] * a[1];\n    printf(\"%lld\\n\", p1 > p2 ? p1 : p2);\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<long long> a(n);\n    for (auto &x : a) cin >> x;\n    sort(a.begin(), a.end());\n    cout << max(a[n - 1] * a[n - 2], a[0] * a[1]) << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst a = d.slice(1, 1 + n).sort((x, y) => x - y);\nconsole.log(Math.max(a[n - 1] * a[n - 2], a[0] * a[1]));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"2\n3 4","expected":"12","hidden":true},{"input":"4\n-10 -9 1 2","expected":"90","hidden":true},{"input":"5\n-5 -4 -3 -2 -1","expected":"20","hidden":true},{"input":"3\n0 0 5","expected":"0","hidden":true},{"input":"5\n100000 100000 1 2 3","expected":"10000000000","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 19
)
on conflict (id) do nothing;

-- 20. Product of Array Except Self  [Medium]  /practice/problems/product-of-array-except-self
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-arrays-20', 'dt-practice-arrays', null,
  $px$Product of Array Except Self$px$, $px$product-of-array-except-self$px$, $px$Medium$px$,
  $px$For every position `i`, compute the product of all elements except `A[i]`. Do not use division. (Constraints are kept small so every product fits in a 64-bit integer.)

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers.

**Output Format**

Print `N` space-separated integers, where the i-th value is the product of every element except the i-th.$px$,
  $px$[{"input":"4\n1 2 3 4","output":"24 12 8 6","explanation":"For index 0 the product of the others is 2*3*4 = 24; the same idea applies to every index."}]$px$::jsonb,
  $px$["2 <= N <= 12","-9 <= A[i] <= 9"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long[] a = new long[n];\n        for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());\n        long[] res = new long[n];\n        long pre = 1;\n        for (int i = 0; i < n; i++) { res[i] = pre; pre *= a[i]; }\n        long post = 1;\n        for (int i = n - 1; i >= 0; i--) { res[i] *= post; post *= a[i]; }\n        StringBuilder sb = new StringBuilder();\n        for (int i = 0; i < n; i++) { if (i > 0) sb.append(' '); sb.append(res[i]); }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\na = list(map(int, d[1:1+n]))\nres = [1] * n\npre = 1\nfor i in range(n):\n    res[i] = pre\n    pre *= a[i]\npost = 1\nfor i in range(n - 1, -1, -1):\n    res[i] *= post\n    post *= a[i]\nprint(' '.join(map(str, res)))\n","c":"#include <stdio.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long a[16], res[16];\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    long long pre = 1;\n    for (int i = 0; i < n; i++) { res[i] = pre; pre *= a[i]; }\n    long long post = 1;\n    for (int i = n - 1; i >= 0; i--) { res[i] *= post; post *= a[i]; }\n    for (int i = 0; i < n; i++) printf(\"%lld%s\", res[i], i + 1 < n ? \" \" : \"\\n\");\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<long long> a(n), res(n, 1);\n    for (auto &x : a) cin >> x;\n    long long pre = 1;\n    for (int i = 0; i < n; i++) { res[i] = pre; pre *= a[i]; }\n    long long post = 1;\n    for (int i = n - 1; i >= 0; i--) { res[i] *= post; post *= a[i]; }\n    for (int i = 0; i < n; i++) cout << res[i] << (i + 1 < n ? ' ' : '\\n');\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst a = d.slice(1, 1 + n);\nconst res = new Array(n).fill(1);\nlet pre = 1;\nfor (let i = 0; i < n; i++) { res[i] = pre; pre *= a[i]; }\nlet post = 1;\nfor (let i = n - 1; i >= 0; i--) { res[i] *= post; post *= a[i]; }\nconsole.log(res.join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"2\n5 7","expected":"7 5","hidden":true},{"input":"3\n0 4 5","expected":"20 0 0","hidden":true},{"input":"3\n0 0 5","expected":"0 0 0","hidden":true},{"input":"4\n-1 2 -3 4","expected":"-24 12 -8 6","hidden":true},{"input":"5\n2 2 2 2 2","expected":"16 16 16 16 16","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 20
)
on conflict (id) do nothing;

-- ===========================================================================
-- 3. VALIDATION  (raises, never silently passes)
-- ===========================================================================
do $val$
declare
  v_cat_id text := 'dt-practice-arrays';
  v_n int;
begin
  if not exists (select 1 from public.dsa_topics where id = v_cat_id and kind = 'practice') then
    raise exception '0073/045: category % missing', v_cat_id;
  end if;
  select count(*) into v_n from public.dsa_problems
   where topic_id = v_cat_id and learning_topic_id is null and coalesce(status,'published') = 'published';
  if v_n < 20 then
    raise exception '0073/045: expected >= 20 Arrays practice problems, found %', v_n;
  end if;
  raise notice '0073/045 OK: % Arrays practice problems present.', v_n;
end
$val$;

notify pgrst, 'reload schema';
