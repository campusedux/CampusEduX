-- admin-panel/supabase/migrations/052_seed_practice_recursion_and_backtracking.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: mobile-app/supabase/migrations/0080_seed_practice_recursion_and_backtracking.sql ; apply either, the other is a guarded no-op.
-- ============================================================================
-- BODY — global Practice ▸ Coding Problems seed: Recursion & Backtracking (10 problems)
-- (mobile 0080_seed_practice_recursion_and_backtracking.sql
--  == admin 052_seed_practice_recursion_and_backtracking.sql — byte-identical below the 3-line header,
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
    raise exception '0080/052: practice RPCs not found — apply 0072_practice_coding.sql (admin 044) first.';
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
  ('dt-practice-recursion-and-backtracking', $px$Recursion & Backtracking$px$, $px$recursion-and-backtracking$px$, $px$Classic recursion (factorial, Fibonacci, power, Hanoi) and backtracking (subsets, permutations, mazes, N-Queens, Sudoku).$px$, 8, 'practice', 'published', true, true)
on conflict (id) do nothing;

-- ===========================================================================
-- 2. CODING PROBLEMS — Recursion & Backtracking
-- ===========================================================================

-- 86. Factorial Using Recursion  [Easy]  /practice/problems/factorial-using-recursion
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-recursion-and-backtracking-86', 'dt-practice-recursion-and-backtracking', null,
  $px$Factorial Using Recursion$px$, $px$factorial-using-recursion$px$, $px$Easy$px$,
  $px$Given a non-negative integer `N`, compute `N!` (the product of all integers from 1 to N; `0! = 1`).

**Input Format**

A single line containing the integer `N`.

**Output Format**

Print `N!`.$px$,
  $px$[{"input":"5","output":"120","explanation":"5! = 5 * 4 * 3 * 2 * 1 = 120."}]$px$::jsonb,
  $px$["0 <= N <= 20"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        int n = Integer.parseInt(br.readLine().trim());\n        long r = 1;\n        for (int i = 2; i <= n; i++) r *= i;\n        System.out.println(r);\n    }\n}\n","python":"import sys\nn = int(sys.stdin.readline())\nr = 1\nfor i in range(2, n + 1):\n    r *= i\nprint(r)\n","c":"#include <stdio.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    unsigned long long r = 1;\n    for (int i = 2; i <= n; i++) r *= (unsigned long long)i;\n    printf(\"%llu\\n\", r);\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\nint main() {\n    int n; cin >> n;\n    unsigned long long r = 1;\n    for (int i = 2; i <= n; i++) r *= (unsigned long long)i;\n    cout << r << \"\\n\";\n    return 0;\n}\n","javascript":"const n = Number(require('fs').readFileSync(0, 'utf8').trim());\nlet r = 1n;\nfor (let i = 2n; i <= BigInt(n); i++) r *= i;\nconsole.log(r.toString());\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"0","expected":"1","hidden":true},{"input":"1","expected":"1","hidden":true},{"input":"10","expected":"3628800","hidden":true},{"input":"20","expected":"2432902008176640000","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 86
)
on conflict (id) do nothing;

-- 87. Fibonacci Number  [Easy]  /practice/problems/fibonacci-number
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-recursion-and-backtracking-87', 'dt-practice-recursion-and-backtracking', null,
  $px$Fibonacci Number$px$, $px$fibonacci-number$px$, $px$Easy$px$,
  $px$Find the N-th Fibonacci number. The sequence starts `0, 1, 1, 2, 3, 5, ...` (0-indexed: F(0) = 0, F(1) = 1).

**Input Format**

A single line containing the integer `N`.

**Output Format**

Print F(N).$px$,
  $px$[{"input":"7","output":"13","explanation":"The sequence is 0, 1, 1, 2, 3, 5, 8, 13."}]$px$::jsonb,
  $px$["0 <= N <= 40"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        int n = Integer.parseInt(br.readLine().trim());\n        long a = 0, b = 1;\n        for (int i = 0; i < n; i++) { long t = a + b; a = b; b = t; }\n        System.out.println(a);\n    }\n}\n","python":"import sys\nn = int(sys.stdin.readline())\na, b = 0, 1\nfor _ in range(n):\n    a, b = b, a + b\nprint(a)\n","c":"#include <stdio.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long a = 0, b = 1;\n    for (int i = 0; i < n; i++) { long long t = a + b; a = b; b = t; }\n    printf(\"%lld\\n\", a);\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\nint main() {\n    int n; cin >> n;\n    long long a = 0, b = 1;\n    for (int i = 0; i < n; i++) { long long t = a + b; a = b; b = t; }\n    cout << a << \"\\n\";\n    return 0;\n}\n","javascript":"const n = Number(require('fs').readFileSync(0, 'utf8').trim());\nlet a = 0, b = 1;\nfor (let i = 0; i < n; i++) { const t = a + b; a = b; b = t; }\nconsole.log(a);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"0","expected":"0","hidden":true},{"input":"1","expected":"1","hidden":true},{"input":"10","expected":"55","hidden":true},{"input":"40","expected":"102334155","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 87
)
on conflict (id) do nothing;

-- 88. Power Using Recursion  [Easy]  /practice/problems/power-using-recursion
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-recursion-and-backtracking-88', 'dt-practice-recursion-and-backtracking', null,
  $px$Power Using Recursion$px$, $px$power-using-recursion$px$, $px$Easy$px$,
  $px$Given integers `X` and `N`, compute `X` raised to the power `N`.

**Input Format**

A single line containing two integers `X` and `N`.

**Output Format**

Print `X^N` (with `X^0 = 1`).$px$,
  $px$[{"input":"3 4","output":"81","explanation":"3^4 = 3 * 3 * 3 * 3 = 81."}]$px$::jsonb,
  $px$["-10 <= X <= 10","0 <= N <= 15"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\nimport java.util.*;\npublic class Main {\n    static long power(long x, int n) {\n        if (n == 0) return 1;\n        long h = power(x, n / 2);\n        return h * h * (n % 2 == 1 ? x : 1);\n    }\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringTokenizer st = new StringTokenizer(br.readLine());\n        long x = Long.parseLong(st.nextToken());\n        int n = Integer.parseInt(st.nextToken());\n        System.out.println(power(x, n));\n    }\n}\n","python":"import sys\nx, n = map(int, sys.stdin.readline().split())\ndef power(x, n):\n    if n == 0:\n        return 1\n    half = power(x, n // 2)\n    return half * half * (x if n % 2 else 1)\nprint(power(x, n))\n","c":"#include <stdio.h>\nlong long power(long long x, int n) {\n    if (n == 0) return 1;\n    long long h = power(x, n / 2);\n    return h * h * (n % 2 ? x : 1);\n}\nint main(void) {\n    long long x; int n;\n    if (scanf(\"%lld %d\", &x, &n) != 2) return 0;\n    printf(\"%lld\\n\", power(x, n));\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\nlong long power(long long x, int n) {\n    if (n == 0) return 1;\n    long long h = power(x, n / 2);\n    return h * h * (n % 2 ? x : 1);\n}\nint main() {\n    long long x; int n;\n    cin >> x >> n;\n    cout << power(x, n) << \"\\n\";\n    return 0;\n}\n","javascript":"const [x, n] = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nfunction power(x, n) {\n    if (n === 0) return 1;\n    const h = power(x, Math.floor(n / 2));\n    return h * h * (n % 2 ? x : 1);\n}\nconsole.log(power(x, n));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"2 0","expected":"1","hidden":true},{"input":"5 1","expected":"5","hidden":true},{"input":"-2 3","expected":"-8","hidden":true},{"input":"-3 4","expected":"81","hidden":true},{"input":"10 15","expected":"1000000000000000","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 88
)
on conflict (id) do nothing;

-- 89. Generate All Subsets  [Medium]  /practice/problems/generate-all-subsets
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-recursion-and-backtracking-89', 'dt-practice-recursion-and-backtracking', null,
  $px$Generate All Subsets$px$, $px$generate-all-subsets$px$, $px$Medium$px$,
  $px$Given an array of distinct integers, generate every subset (the power set).

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated distinct integers.

**Output Format**

Print `2^N` lines, one per subset, in order of the binary mask `0 .. 2^N - 1`. For a mask, list the elements at set bit positions in index order, separated by single spaces. The empty subset is printed as an empty line.$px$,
  $px$[{"input":"2\n1 2","output":"\n1\n2\n1 2","explanation":"Masks 00, 01, 10, 11 give the empty set, {1}, {2}, {1,2}."}]$px$::jsonb,
  $px$["1 <= N <= 12","-1000000000 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        String[] a = new String[n];\n        for (int i = 0; i < n; i++) a[i] = st.nextToken();\n        StringBuilder sb = new StringBuilder();\n        for (int mask = 0; mask < (1 << n); mask++) {\n            boolean first = true;\n            for (int j = 0; j < n; j++) if ((mask & (1 << j)) != 0) { if (!first) sb.append(' '); sb.append(a[j]); first = false; }\n            sb.append('\\n');\n        }\n        System.out.print(sb);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\na = d[1:1+n]\nout = []\nfor mask in range(1 << n):\n    out.append(' '.join(a[j] for j in range(n) if mask & (1 << j)))\nprint('\\n'.join(out))\n","c":"#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    char a[12][16];\n    for (int i = 0; i < n; i++) scanf(\"%15s\", a[i]);\n    for (int mask = 0; mask < (1 << n); mask++) {\n        int first = 1;\n        for (int j = 0; j < n; j++) if (mask & (1 << j)) { if (!first) putchar(' '); fputs(a[j], stdout); first = 0; }\n        putchar('\\n');\n    }\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <string>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<string> a(n);\n    for (auto &x : a) cin >> x;\n    for (int mask = 0; mask < (1 << n); mask++) {\n        bool first = true;\n        for (int j = 0; j < n; j++) if (mask & (1 << j)) { if (!first) cout << ' '; cout << a[j]; first = false; }\n        cout << '\\n';\n    }\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/);\nconst n = Number(d[0]);\nconst a = d.slice(1, 1 + n);\nconst out = [];\nfor (let mask = 0; mask < (1 << n); mask++) {\n    const parts = [];\n    for (let j = 0; j < n; j++) if (mask & (1 << j)) parts.push(a[j]);\n    out.push(parts.join(' '));\n}\nconsole.log(out.join('\\n'));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n5","expected":"\n5","hidden":true},{"input":"3\n1 2 3","expected":"\n1\n2\n1 2\n3\n1 3\n2 3\n1 2 3","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 89
)
on conflict (id) do nothing;

-- 90. Generate All Permutations  [Medium]  /practice/problems/generate-all-permutations
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-recursion-and-backtracking-90', 'dt-practice-recursion-and-backtracking', null,
  $px$Generate All Permutations$px$, $px$generate-all-permutations$px$, $px$Medium$px$,
  $px$Given an array of distinct integers, generate every ordering of its elements, in lexicographic order.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated distinct integers.

**Output Format**

Print `N!` lines, one per permutation, in lexicographic order (based on the values), space-separated.$px$,
  $px$[{"input":"3\n1 2 3","output":"1 2 3\n1 3 2\n2 1 3\n2 3 1\n3 1 2\n3 2 1","explanation":"There are 3! = 6 arrangements, listed in lexicographic order."}]$px$::jsonb,
  $px$["1 <= N <= 8","-1000000000 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    static long[] a;\n    static boolean[] used;\n    static int n;\n    static StringBuilder sb = new StringBuilder();\n    static void rec(ArrayList<Long> cur) {\n        if (cur.size() == n) {\n            for (int i = 0; i < n; i++) { if (i > 0) sb.append(' '); sb.append(cur.get(i)); }\n            sb.append('\\n');\n            return;\n        }\n        for (int i = 0; i < n; i++) if (!used[i]) {\n            used[i] = true; cur.add(a[i]);\n            rec(cur);\n            cur.remove(cur.size() - 1); used[i] = false;\n        }\n    }\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        n = Integer.parseInt(st.nextToken());\n        a = new long[n];\n        for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());\n        Arrays.sort(a);\n        used = new boolean[n];\n        rec(new ArrayList<>());\n        System.out.print(sb);\n    }\n}\n","python":"import sys\nfrom itertools import permutations\nd = sys.stdin.read().split()\nn = int(d[0])\na = sorted(map(int, d[1:1+n]))\nout = []\nfor p in permutations(a):\n    out.append(' '.join(map(str, p)))\nprint('\\n'.join(out))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nlong long a[8];\nint used[8], n;\nlong long cur[8];\nvoid rec(int k) {\n    if (k == n) {\n        for (int i = 0; i < n; i++) printf(\"%lld%s\", cur[i], i + 1 < n ? \" \" : \"\\n\");\n        return;\n    }\n    for (int i = 0; i < n; i++) if (!used[i]) {\n        used[i] = 1; cur[k] = a[i];\n        rec(k + 1);\n        used[i] = 0;\n    }\n}\nint cmp(const void *p, const void *q) { long long x = *(const long long*)p, y = *(const long long*)q; return (x > y) - (x < y); }\nint main(void) {\n    if (scanf(\"%d\", &n) != 1) return 0;\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    qsort(a, n, sizeof(long long), cmp);\n    rec(0);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<long long> a(n);\n    for (auto &x : a) cin >> x;\n    sort(a.begin(), a.end());\n    do {\n        for (int i = 0; i < n; i++) { if (i) cout << ' '; cout << a[i]; }\n        cout << '\\n';\n    } while (next_permutation(a.begin(), a.end()));\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/);\nconst n = Number(d[0]);\nconst a = d.slice(1, 1 + n).map(Number).sort((x, y) => x - y);\nconst used = new Array(n).fill(false);\nconst cur = [];\nconst out = [];\nfunction rec() {\n    if (cur.length === n) { out.push(cur.join(' ')); return; }\n    for (let i = 0; i < n; i++) if (!used[i]) {\n        used[i] = true; cur.push(a[i]);\n        rec();\n        cur.pop(); used[i] = false;\n    }\n}\nrec();\nconsole.log(out.join('\\n'));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n9","expected":"9","hidden":true},{"input":"2\n5 1","expected":"1 5\n5 1","hidden":true},{"input":"3\n7 8 9","expected":"7 8 9\n7 9 8\n8 7 9\n8 9 7\n9 7 8\n9 8 7","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 90
)
on conflict (id) do nothing;

-- 91. Tower of Hanoi  [Medium]  /practice/problems/tower-of-hanoi
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-recursion-and-backtracking-91', 'dt-practice-recursion-and-backtracking', null,
  $px$Tower of Hanoi$px$, $px$tower-of-hanoi$px$, $px$Medium$px$,
  $px$Solve the Tower of Hanoi for `N` disks using three rods named `A`, `B` and `C`. Move all disks from rod `A` to rod `C`, never placing a larger disk on a smaller one.

**Input Format**

A single line containing the integer `N`.

**Output Format**

Print the sequence of moves, one per line, each as `X -> Y` meaning "move the top disk from rod X to rod Y".$px$,
  $px$[{"input":"2","output":"A -> B\nA -> C\nB -> C","explanation":"Two disks require three moves."}]$px$::jsonb,
  $px$["1 <= N <= 12"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\npublic class Main {\n    static StringBuilder sb = new StringBuilder();\n    static void hanoi(int k, char frm, char to, char aux) {\n        if (k == 0) return;\n        hanoi(k - 1, frm, aux, to);\n        sb.append(frm).append(\" -> \").append(to).append('\\n');\n        hanoi(k - 1, aux, to, frm);\n    }\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        int n = Integer.parseInt(br.readLine().trim());\n        hanoi(n, 'A', 'C', 'B');\n        System.out.print(sb);\n    }\n}\n","python":"import sys\nsys.setrecursionlimit(100000)\nn = int(sys.stdin.readline())\nout = []\ndef hanoi(k, frm, to, aux):\n    if k == 0:\n        return\n    hanoi(k - 1, frm, aux, to)\n    out.append(f\"{frm} -> {to}\")\n    hanoi(k - 1, aux, to, frm)\nhanoi(n, 'A', 'C', 'B')\nprint('\\n'.join(out))\n","c":"#include <stdio.h>\nvoid hanoi(int k, char frm, char to, char aux) {\n    if (k == 0) return;\n    hanoi(k - 1, frm, aux, to);\n    printf(\"%c -> %c\\n\", frm, to);\n    hanoi(k - 1, aux, to, frm);\n}\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    hanoi(n, 'A', 'C', 'B');\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\nvoid hanoi(int k, char frm, char to, char aux) {\n    if (k == 0) return;\n    hanoi(k - 1, frm, aux, to);\n    cout << frm << \" -> \" << to << \"\\n\";\n    hanoi(k - 1, aux, to, frm);\n}\nint main() {\n    int n; cin >> n;\n    hanoi(n, 'A', 'C', 'B');\n    return 0;\n}\n","javascript":"const n = Number(require('fs').readFileSync(0, 'utf8').trim());\nconst out = [];\nfunction hanoi(k, frm, to, aux) {\n    if (k === 0) return;\n    hanoi(k - 1, frm, aux, to);\n    out.push(`${frm} -> ${to}`);\n    hanoi(k - 1, aux, to, frm);\n}\nhanoi(n, 'A', 'C', 'B');\nconsole.log(out.join('\\n'));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1","expected":"A -> C","hidden":true},{"input":"3","expected":"A -> C\nA -> B\nC -> B\nA -> C\nB -> A\nB -> C\nA -> C","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 91
)
on conflict (id) do nothing;

-- 92. Rat in a Maze  [Medium]  /practice/problems/rat-in-a-maze
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-recursion-and-backtracking-92', 'dt-practice-recursion-and-backtracking', null,
  $px$Rat in a Maze$px$, $px$rat-in-a-maze$px$, $px$Medium$px$,
  $px$Given a square grid where `1` is an open cell and `0` is a blocked cell, determine whether there is a path from the top-left cell `(0,0)` to the bottom-right cell `(N-1,N-1)`, moving only up, down, left or right through open cells, without visiting any cell twice.

**Input Format**

The first line contains an integer `N`.
Each of the next `N` lines contains `N` space-separated integers (`0` or `1`).

**Output Format**

Print `1` if such a path exists, otherwise print `0`.$px$,
  $px$[{"input":"3\n1 0 0\n1 1 0\n0 1 1","output":"1","explanation":"A route through open cells reaches the bottom-right corner."}]$px$::jsonb,
  $px$["1 <= N <= 12","Each cell is 0 or 1"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    static int n;\n    static int[][] g;\n    static boolean[][] vis;\n    static boolean found = false;\n    static void dfs(int i, int j) {\n        if (i < 0 || j < 0 || i >= n || j >= n || g[i][j] == 0 || vis[i][j] || found) return;\n        if (i == n - 1 && j == n - 1) { found = true; return; }\n        vis[i][j] = true;\n        dfs(i + 1, j); dfs(i - 1, j); dfs(i, j + 1); dfs(i, j - 1);\n    }\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        n = Integer.parseInt(st.nextToken());\n        g = new int[n][n];\n        vis = new boolean[n][n];\n        for (int i = 0; i < n; i++) for (int j = 0; j < n; j++) g[i][j] = Integer.parseInt(st.nextToken());\n        if (g[0][0] == 1) dfs(0, 0);\n        System.out.println(found ? 1 : 0);\n    }\n}\n","python":"import sys\nsys.setrecursionlimit(10000)\nd = sys.stdin.read().split()\nn = int(d[0])\ng = [[int(d[1 + i * n + j]) for j in range(n)] for i in range(n)]\nvis = [[False] * n for _ in range(n)]\nfound = [False]\ndef dfs(i, j):\n    if i < 0 or j < 0 or i >= n or j >= n or g[i][j] == 0 or vis[i][j] or found[0]:\n        return\n    if i == n - 1 and j == n - 1:\n        found[0] = True\n        return\n    vis[i][j] = True\n    dfs(i + 1, j); dfs(i - 1, j); dfs(i, j + 1); dfs(i, j - 1)\nif g[0][0] == 1:\n    dfs(0, 0)\nprint(1 if found[0] else 0)\n","c":"#include <stdio.h>\nint n, g[12][12], vis[12][12], found = 0;\nvoid dfs(int i, int j) {\n    if (i < 0 || j < 0 || i >= n || j >= n || g[i][j] == 0 || vis[i][j] || found) return;\n    if (i == n - 1 && j == n - 1) { found = 1; return; }\n    vis[i][j] = 1;\n    dfs(i + 1, j); dfs(i - 1, j); dfs(i, j + 1); dfs(i, j - 1);\n}\nint main(void) {\n    if (scanf(\"%d\", &n) != 1) return 0;\n    for (int i = 0; i < n; i++) for (int j = 0; j < n; j++) scanf(\"%d\", &g[i][j]);\n    if (g[0][0] == 1) dfs(0, 0);\n    printf(\"%d\\n\", found);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\nusing namespace std;\nint n;\nvector<vector<int>> g, vis;\nbool found = false;\nvoid dfs(int i, int j) {\n    if (i < 0 || j < 0 || i >= n || j >= n || g[i][j] == 0 || vis[i][j] || found) return;\n    if (i == n - 1 && j == n - 1) { found = true; return; }\n    vis[i][j] = 1;\n    dfs(i + 1, j); dfs(i - 1, j); dfs(i, j + 1); dfs(i, j - 1);\n}\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    cin >> n;\n    g.assign(n, vector<int>(n)); vis.assign(n, vector<int>(n, 0));\n    for (int i = 0; i < n; i++) for (int j = 0; j < n; j++) cin >> g[i][j];\n    if (g[0][0] == 1) dfs(0, 0);\n    cout << (found ? 1 : 0) << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst g = [];\nfor (let i = 0; i < n; i++) g.push(d.slice(1 + i * n, 1 + i * n + n));\nconst vis = Array.from({ length: n }, () => new Array(n).fill(false));\nlet found = false;\nfunction dfs(i, j) {\n    if (i < 0 || j < 0 || i >= n || j >= n || g[i][j] === 0 || vis[i][j] || found) return;\n    if (i === n - 1 && j === n - 1) { found = true; return; }\n    vis[i][j] = true;\n    dfs(i + 1, j); dfs(i - 1, j); dfs(i, j + 1); dfs(i, j - 1);\n}\nif (g[0][0] === 1) dfs(0, 0);\nconsole.log(found ? 1 : 0);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n1","expected":"1","hidden":true},{"input":"1\n0","expected":"0","hidden":true},{"input":"3\n1 0 0\n0 1 0\n0 0 1","expected":"0","hidden":true},{"input":"3\n1 1 1\n0 0 1\n0 0 1","expected":"1","hidden":true},{"input":"4\n1 1 0 0\n0 1 1 0\n0 0 1 1\n0 0 0 1","expected":"1","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 92
)
on conflict (id) do nothing;

-- 93. N Queens  [Hard]  /practice/problems/n-queens
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-recursion-and-backtracking-93', 'dt-practice-recursion-and-backtracking', null,
  $px$N Queens$px$, $px$n-queens$px$, $px$Hard$px$,
  $px$Count the number of distinct ways to place `N` queens on an `N x N` chessboard so that no two queens attack each other (no two share a row, column or diagonal).

**Input Format**

A single line containing the integer `N`.

**Output Format**

Print the number of valid arrangements.$px$,
  $px$[{"input":"4","output":"2","explanation":"For a 4x4 board there are exactly two valid arrangements."}]$px$::jsonb,
  $px$["1 <= N <= 12"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\npublic class Main {\n    static int n, count = 0;\n    static boolean[] cols, d1, d2;\n    static void solve(int row) {\n        if (row == n) { count++; return; }\n        for (int c = 0; c < n; c++) {\n            int a = row - c + n, b = row + c;\n            if (cols[c] || d1[a] || d2[b]) continue;\n            cols[c] = d1[a] = d2[b] = true;\n            solve(row + 1);\n            cols[c] = d1[a] = d2[b] = false;\n        }\n    }\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        n = Integer.parseInt(br.readLine().trim());\n        cols = new boolean[n]; d1 = new boolean[2 * n]; d2 = new boolean[2 * n];\n        solve(0);\n        System.out.println(count);\n    }\n}\n","python":"import sys\nn = int(sys.stdin.readline())\ncount = 0\ndef solve(row, cols, d1, d2):\n    global count\n    if row == n:\n        count += 1\n        return\n    for c in range(n):\n        if c in cols or (row - c) in d1 or (row + c) in d2:\n            continue\n        cols.add(c); d1.add(row - c); d2.add(row + c)\n        solve(row + 1, cols, d1, d2)\n        cols.discard(c); d1.discard(row - c); d2.discard(row + c)\nsolve(0, set(), set(), set())\nprint(count)\n","c":"#include <stdio.h>\nint n, count = 0;\nint cols[13], d1[26], d2[26];\nvoid solve(int row) {\n    if (row == n) { count++; return; }\n    for (int c = 0; c < n; c++) {\n        int a = row - c + n, b = row + c;\n        if (cols[c] || d1[a] || d2[b]) continue;\n        cols[c] = d1[a] = d2[b] = 1;\n        solve(row + 1);\n        cols[c] = d1[a] = d2[b] = 0;\n    }\n}\nint main(void) {\n    if (scanf(\"%d\", &n) != 1) return 0;\n    solve(0);\n    printf(\"%d\\n\", count);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\nusing namespace std;\nint n, cnt = 0;\nvector<int> cols, d1, d2;\nvoid solve(int row) {\n    if (row == n) { cnt++; return; }\n    for (int c = 0; c < n; c++) {\n        int a = row - c + n, b = row + c;\n        if (cols[c] || d1[a] || d2[b]) continue;\n        cols[c] = d1[a] = d2[b] = 1;\n        solve(row + 1);\n        cols[c] = d1[a] = d2[b] = 0;\n    }\n}\nint main() {\n    cin >> n;\n    cols.assign(n, 0); d1.assign(2 * n, 0); d2.assign(2 * n, 0);\n    solve(0);\n    cout << cnt << \"\\n\";\n    return 0;\n}\n","javascript":"const n = Number(require('fs').readFileSync(0, 'utf8').trim());\nlet count = 0;\nconst cols = new Array(n).fill(false);\nconst d1 = new Array(2 * n).fill(false);\nconst d2 = new Array(2 * n).fill(false);\nfunction solve(row) {\n    if (row === n) { count++; return; }\n    for (let c = 0; c < n; c++) {\n        const a = row - c + n, b = row + c;\n        if (cols[c] || d1[a] || d2[b]) continue;\n        cols[c] = d1[a] = d2[b] = true;\n        solve(row + 1);\n        cols[c] = d1[a] = d2[b] = false;\n    }\n}\nsolve(0);\nconsole.log(count);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1","expected":"1","hidden":true},{"input":"2","expected":"0","hidden":true},{"input":"3","expected":"0","hidden":true},{"input":"8","expected":"92","hidden":true},{"input":"10","expected":"724","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 93
)
on conflict (id) do nothing;

-- 94. Sudoku Solver  [Hard]  /practice/problems/sudoku-solver
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-recursion-and-backtracking-94', 'dt-practice-recursion-and-backtracking', null,
  $px$Sudoku Solver$px$, $px$sudoku-solver$px$, $px$Hard$px$,
  $px$Given a partially filled 9x9 Sudoku board (empty cells are `0`), fill every empty cell so that each row, each column and each 3x3 box contains the digits 1 to 9 exactly once. The puzzle has a unique solution.

**Input Format**

Nine lines, each containing 9 space-separated integers `0..9` (`0` = empty).

**Output Format**

Print the solved board as 9 lines of 9 space-separated digits.$px$,
  $px$[{"input":"5 3 0 0 7 0 0 0 0\n6 0 0 1 9 5 0 0 0\n0 9 8 0 0 0 0 6 0\n8 0 0 0 6 0 0 0 3\n4 0 0 8 0 3 0 0 1\n7 0 0 0 2 0 0 0 6\n0 6 0 0 0 0 2 8 0\n0 0 0 4 1 9 0 0 5\n0 0 0 0 8 0 0 7 9","output":"5 3 4 6 7 8 9 1 2\n6 7 2 1 9 5 3 4 8\n1 9 8 3 4 2 5 6 7\n8 5 9 7 6 1 4 2 3\n4 2 6 8 5 3 7 9 1\n7 1 3 9 2 4 8 5 6\n9 6 1 5 3 7 2 8 4\n2 8 7 4 1 9 6 3 5\n3 4 5 2 8 6 1 7 9","explanation":"Every empty cell is filled while satisfying all Sudoku rules."}]$px$::jsonb,
  $px$["The board is exactly 9x9 and has a unique solution."]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    static int[][] g = new int[9][9];\n    static boolean ok(int r, int c, int v) {\n        for (int i = 0; i < 9; i++) if (g[r][i] == v || g[i][c] == v) return false;\n        int br = 3 * (r / 3), bc = 3 * (c / 3);\n        for (int i = br; i < br + 3; i++) for (int j = bc; j < bc + 3; j++) if (g[i][j] == v) return false;\n        return true;\n    }\n    static boolean solve() {\n        for (int r = 0; r < 9; r++) for (int c = 0; c < 9; c++) if (g[r][c] == 0) {\n            for (int v = 1; v <= 9; v++) if (ok(r, c, v)) {\n                g[r][c] = v;\n                if (solve()) return true;\n                g[r][c] = 0;\n            }\n            return false;\n        }\n        return true;\n    }\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        for (int i = 0; i < 9; i++) for (int j = 0; j < 9; j++) g[i][j] = Integer.parseInt(st.nextToken());\n        solve();\n        StringBuilder sb = new StringBuilder();\n        for (int i = 0; i < 9; i++) { for (int j = 0; j < 9; j++) { if (j > 0) sb.append(' '); sb.append(g[i][j]); } sb.append('\\n'); }\n        System.out.print(sb);\n    }\n}\n","python":"import sys\ndata = sys.stdin.read().split()\ng = [[int(data[i * 9 + j]) for j in range(9)] for i in range(9)]\ndef ok(r, c, v):\n    for i in range(9):\n        if g[r][i] == v or g[i][c] == v:\n            return False\n    br, bc = 3 * (r // 3), 3 * (c // 3)\n    for i in range(br, br + 3):\n        for j in range(bc, bc + 3):\n            if g[i][j] == v:\n                return False\n    return True\ndef solve():\n    for r in range(9):\n        for c in range(9):\n            if g[r][c] == 0:\n                for v in range(1, 10):\n                    if ok(r, c, v):\n                        g[r][c] = v\n                        if solve():\n                            return True\n                        g[r][c] = 0\n                return False\n    return True\nsolve()\nprint('\\n'.join(' '.join(map(str, row)) for row in g))\n","c":"#include <stdio.h>\nint g[9][9];\nint ok(int r, int c, int v) {\n    for (int i = 0; i < 9; i++) if (g[r][i] == v || g[i][c] == v) return 0;\n    int br = 3 * (r / 3), bc = 3 * (c / 3);\n    for (int i = br; i < br + 3; i++) for (int j = bc; j < bc + 3; j++) if (g[i][j] == v) return 0;\n    return 1;\n}\nint solve(void) {\n    for (int r = 0; r < 9; r++) for (int c = 0; c < 9; c++) if (g[r][c] == 0) {\n        for (int v = 1; v <= 9; v++) if (ok(r, c, v)) {\n            g[r][c] = v;\n            if (solve()) return 1;\n            g[r][c] = 0;\n        }\n        return 0;\n    }\n    return 1;\n}\nint main(void) {\n    for (int i = 0; i < 9; i++) for (int j = 0; j < 9; j++) scanf(\"%d\", &g[i][j]);\n    solve();\n    for (int i = 0; i < 9; i++) { for (int j = 0; j < 9; j++) printf(\"%d%s\", g[i][j], j < 8 ? \" \" : \"\\n\"); }\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\nint g[9][9];\nbool ok(int r, int c, int v) {\n    for (int i = 0; i < 9; i++) if (g[r][i] == v || g[i][c] == v) return false;\n    int br = 3 * (r / 3), bc = 3 * (c / 3);\n    for (int i = br; i < br + 3; i++) for (int j = bc; j < bc + 3; j++) if (g[i][j] == v) return false;\n    return true;\n}\nbool solve() {\n    for (int r = 0; r < 9; r++) for (int c = 0; c < 9; c++) if (g[r][c] == 0) {\n        for (int v = 1; v <= 9; v++) if (ok(r, c, v)) {\n            g[r][c] = v;\n            if (solve()) return true;\n            g[r][c] = 0;\n        }\n        return false;\n    }\n    return true;\n}\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    for (int i = 0; i < 9; i++) for (int j = 0; j < 9; j++) cin >> g[i][j];\n    solve();\n    for (int i = 0; i < 9; i++) { for (int j = 0; j < 9; j++) { if (j) cout << ' '; cout << g[i][j]; } cout << '\\n'; }\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst g = [];\nfor (let i = 0; i < 9; i++) g.push(data.slice(i * 9, i * 9 + 9));\nfunction ok(r, c, v) {\n    for (let i = 0; i < 9; i++) if (g[r][i] === v || g[i][c] === v) return false;\n    const br = 3 * Math.floor(r / 3), bc = 3 * Math.floor(c / 3);\n    for (let i = br; i < br + 3; i++) for (let j = bc; j < bc + 3; j++) if (g[i][j] === v) return false;\n    return true;\n}\nfunction solve() {\n    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (g[r][c] === 0) {\n        for (let v = 1; v <= 9; v++) if (ok(r, c, v)) {\n            g[r][c] = v;\n            if (solve()) return true;\n            g[r][c] = 0;\n        }\n        return false;\n    }\n    return true;\n}\nsolve();\nconsole.log(g.map((row) => row.join(' ')).join('\\n'));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"0 0 0 2 6 0 7 0 1\n6 8 0 0 7 0 0 9 0\n1 9 0 0 0 4 5 0 0\n8 2 0 1 0 0 0 4 0\n0 0 4 6 0 2 9 0 0\n0 5 0 0 0 3 0 2 8\n0 0 9 3 0 0 0 7 4\n0 4 0 0 5 0 0 3 6\n7 0 3 0 1 8 0 0 0","expected":"4 3 5 2 6 9 7 8 1\n6 8 2 5 7 1 4 9 3\n1 9 7 8 3 4 5 6 2\n8 2 6 1 9 5 3 4 7\n3 7 4 6 8 2 9 1 5\n9 5 1 7 4 3 6 2 8\n5 1 9 3 2 6 8 7 4\n2 4 8 9 5 7 1 3 6\n7 6 3 4 1 8 2 5 9","hidden":true},{"input":"1 0 0 0 0 7 0 9 0\n0 3 0 0 2 0 0 0 8\n0 0 9 6 0 0 5 0 0\n0 0 5 3 0 0 9 0 0\n0 1 0 0 8 0 0 0 2\n6 0 0 0 0 4 0 0 0\n3 0 0 0 0 0 0 1 0\n0 4 0 0 0 0 0 0 7\n0 0 7 0 0 0 3 0 0","expected":"1 6 2 8 5 7 4 9 3\n5 3 4 1 2 9 6 7 8\n7 8 9 6 4 3 5 2 1\n4 7 5 3 1 2 9 8 6\n9 1 3 5 8 6 7 4 2\n6 2 8 7 9 4 1 3 5\n3 5 6 4 7 8 2 1 9\n2 4 1 9 3 5 8 6 7\n8 9 7 2 6 1 3 5 4","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 94
)
on conflict (id) do nothing;

-- 95. Generate Balanced Parentheses  [Medium]  /practice/problems/generate-balanced-parentheses
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-recursion-and-backtracking-95', 'dt-practice-recursion-and-backtracking', null,
  $px$Generate Balanced Parentheses$px$, $px$generate-balanced-parentheses$px$, $px$Medium$px$,
  $px$Given `N` pairs of parentheses, generate every string of `2N` characters in which every opening parenthesis is correctly matched.

**Input Format**

A single line containing the integer `N`.

**Output Format**

Print all valid strings, one per line, in lexicographic order (treating `(` as smaller than `)`).$px$,
  $px$[{"input":"3","output":"((()))\n(()())\n(())()\n()(())\n()()()","explanation":"These are all valid ways to arrange three pairs of parentheses."}]$px$::jsonb,
  $px$["1 <= N <= 8"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\npublic class Main {\n    static int n;\n    static StringBuilder sb = new StringBuilder();\n    static void gen(String s, int o, int c) {\n        if (s.length() == 2 * n) { sb.append(s).append('\\n'); return; }\n        if (o < n) gen(s + '(', o + 1, c);\n        if (c < o) gen(s + ')', o, c + 1);\n    }\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        n = Integer.parseInt(br.readLine().trim());\n        gen(\"\", 0, 0);\n        System.out.print(sb);\n    }\n}\n","python":"import sys\nn = int(sys.stdin.readline())\nout = []\ndef gen(s, o, c):\n    if len(s) == 2 * n:\n        out.append(s)\n        return\n    if o < n:\n        gen(s + '(', o + 1, c)\n    if c < o:\n        gen(s + ')', o, c + 1)\ngen('', 0, 0)\nprint('\\n'.join(out))\n","c":"#include <stdio.h>\n#include <string.h>\nint n;\nchar buf[20];\nvoid gen(int len, int o, int c) {\n    if (len == 2 * n) { buf[len] = 0; printf(\"%s\\n\", buf); return; }\n    if (o < n) { buf[len] = '('; gen(len + 1, o + 1, c); }\n    if (c < o) { buf[len] = ')'; gen(len + 1, o, c + 1); }\n}\nint main(void) {\n    if (scanf(\"%d\", &n) != 1) return 0;\n    gen(0, 0, 0);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <string>\nusing namespace std;\nint n;\nvoid gen(string s, int o, int c) {\n    if ((int)s.size() == 2 * n) { cout << s << \"\\n\"; return; }\n    if (o < n) gen(s + '(', o + 1, c);\n    if (c < o) gen(s + ')', o, c + 1);\n}\nint main() {\n    cin >> n;\n    gen(\"\", 0, 0);\n    return 0;\n}\n","javascript":"const n = Number(require('fs').readFileSync(0, 'utf8').trim());\nconst out = [];\nfunction gen(s, o, c) {\n    if (s.length === 2 * n) { out.push(s); return; }\n    if (o < n) gen(s + '(', o + 1, c);\n    if (c < o) gen(s + ')', o, c + 1);\n}\ngen('', 0, 0);\nconsole.log(out.join('\\n'));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1","expected":"()","hidden":true},{"input":"2","expected":"(())\n()()","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 95
)
on conflict (id) do nothing;

-- ===========================================================================
-- 3. VALIDATION  (raises, never silently passes)
-- ===========================================================================
do $val$
declare
  v_cat_id text := 'dt-practice-recursion-and-backtracking';
  v_n int;
begin
  if not exists (select 1 from public.dsa_topics where id = v_cat_id and kind = 'practice') then
    raise exception '0080/052: category % missing', v_cat_id;
  end if;
  select count(*) into v_n from public.dsa_problems
   where topic_id = v_cat_id and learning_topic_id is null and coalesce(status,'published') = 'published';
  if v_n < 10 then
    raise exception '0080/052: expected >= 10 Recursion & Backtracking practice problems, found %', v_n;
  end if;
  raise notice '0080/052 OK: % Recursion & Backtracking practice problems present.', v_n;
end
$val$;

notify pgrst, 'reload schema';
