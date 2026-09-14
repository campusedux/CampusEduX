-- admin-panel/supabase/migrations/058_seed_practice_dynamic_programming.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: mobile-app/supabase/migrations/0086_seed_practice_dynamic_programming.sql ; apply either, the other is a guarded no-op.
-- ============================================================================
-- BODY — global Practice ▸ Coding Problems seed: Dynamic Programming (5 problems)
-- (mobile 0086_seed_practice_dynamic_programming.sql
--  == admin 058_seed_practice_dynamic_programming.sql — byte-identical below the 3-line header,
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
    raise exception '0086/058: practice RPCs not found — apply 0072_practice_coding.sql (admin 044) first.';
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
  ('dt-practice-dynamic-programming', $px$Dynamic Programming$px$, $px$dynamic-programming$px$, $px$1-D and 2-D DP: climbing stairs, house robber, 0/1 knapsack, longest common subsequence and longest increasing subsequence.$px$, 14, 'practice', 'published', true, true)
on conflict (id) do nothing;

-- ===========================================================================
-- 2. CODING PROBLEMS — Dynamic Programming
-- ===========================================================================

-- 136. Climbing Stairs  [Easy]  /practice/problems/climbing-stairs
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-dynamic-programming-136', 'dt-practice-dynamic-programming', null,
  $px$Climbing Stairs$px$, $px$climbing-stairs$px$, $px$Easy$px$,
  $px$You are climbing a staircase with `N` steps. Each move you can climb either 1 or 2 steps. Count the number of distinct ways to reach the top.

**Input Format**

A single line containing the integer `N`.

**Output Format**

Print the number of distinct ways.$px$,
  $px$[{"input":"5","output":"8","explanation":"There are eight different sequences of 1-step and 2-step moves."}]$px$::jsonb,
  $px$["1 <= N <= 45"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        int n = Integer.parseInt(br.readLine().trim());\n        long a = 1, b = 1;\n        for (int i = 0; i < n; i++) { long t = a + b; a = b; b = t; }\n        System.out.println(a);\n    }\n}\n","python":"import sys\nn = int(sys.stdin.readline())\na, b = 1, 1\nfor _ in range(n):\n    a, b = b, a + b\nprint(a)\n","c":"#include <stdio.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long a = 1, b = 1;\n    for (int i = 0; i < n; i++) { long long t = a + b; a = b; b = t; }\n    printf(\"%lld\\n\", a);\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\nint main() {\n    int n; cin >> n;\n    long long a = 1, b = 1;\n    for (int i = 0; i < n; i++) { long long t = a + b; a = b; b = t; }\n    cout << a << \"\\n\";\n    return 0;\n}\n","javascript":"const n = Number(require('fs').readFileSync(0, 'utf8').trim());\nlet a = 1, b = 1;\nfor (let i = 0; i < n; i++) { const t = a + b; a = b; b = t; }\nconsole.log(a);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1","expected":"1","hidden":true},{"input":"2","expected":"2","hidden":true},{"input":"10","expected":"89","hidden":true},{"input":"45","expected":"1836311903","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 136
)
on conflict (id) do nothing;

-- 137. House Robber  [Medium]  /practice/problems/house-robber
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-dynamic-programming-137', 'dt-practice-dynamic-programming', null,
  $px$House Robber$px$, $px$house-robber$px$, $px$Medium$px$,
  $px$Given the money in each house along a street, find the maximum amount you can collect without robbing two adjacent houses.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated non-negative integers.

**Output Format**

Print the maximum amount that can be robbed.$px$,
  $px$[{"input":"5\n2 7 9 3 1","output":"12","explanation":"Rob houses with 2, 9 and 1 for a total of 12."}]$px$::jsonb,
  $px$["1 <= N <= 100000","0 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long prev2 = 0, prev1 = 0;\n        for (int i = 0; i < n; i++) {\n            long x = Long.parseLong(st.nextToken());\n            long cur = Math.max(prev1, prev2 + x);\n            prev2 = prev1; prev1 = cur;\n        }\n        System.out.println(prev1);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\nprev2 = prev1 = 0\nfor x in map(int, d[1:1+n]):\n    cur = max(prev1, prev2 + x)\n    prev2 = prev1\n    prev1 = cur\nprint(prev1)\n","c":"#include <stdio.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long prev2 = 0, prev1 = 0, x;\n    for (int i = 0; i < n; i++) {\n        scanf(\"%lld\", &x);\n        long long cur = prev1 > prev2 + x ? prev1 : prev2 + x;\n        prev2 = prev1; prev1 = cur;\n    }\n    printf(\"%lld\\n\", prev1);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <algorithm>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    long long prev2 = 0, prev1 = 0, x;\n    for (int i = 0; i < n; i++) {\n        cin >> x;\n        long long cur = max(prev1, prev2 + x);\n        prev2 = prev1; prev1 = cur;\n    }\n    cout << prev1 << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nlet prev2 = 0, prev1 = 0;\nfor (let i = 1; i <= n; i++) {\n    const cur = Math.max(prev1, prev2 + d[i]);\n    prev2 = prev1; prev1 = cur;\n}\nconsole.log(prev1);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n5","expected":"5","hidden":true},{"input":"2\n1 2","expected":"2","hidden":true},{"input":"4\n2 1 1 2","expected":"4","hidden":true},{"input":"5\n0 0 0 0 0","expected":"0","hidden":true},{"input":"6\n5 5 10 100 10 5","expected":"110","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 137
)
on conflict (id) do nothing;

-- 138. 0/1 Knapsack  [Medium]  /practice/problems/zero-one-knapsack
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-dynamic-programming-138', 'dt-practice-dynamic-programming', null,
  $px$0/1 Knapsack$px$, $px$zero-one-knapsack$px$, $px$Medium$px$,
  $px$Given `N` items with values and weights and a bag capacity `W`, choose a subset of items to maximise total value without exceeding the capacity. Each item may be used at most once.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers — the values.
The third line contains `N` space-separated integers — the weights.
The fourth line contains an integer `W`, the capacity.

**Output Format**

Print the maximum total value.$px$,
  $px$[{"input":"3\n60 100 120\n10 20 30\n50","output":"220","explanation":"Taking items 2 and 3 gives value 220, which is best."}]$px$::jsonb,
  $px$["1 <= N <= 100","1 <= value[i] <= 1000000","1 <= weight[i] <= 10000","1 <= W <= 10000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        int[] val = new int[n], wt = new int[n];\n        for (int i = 0; i < n; i++) val[i] = Integer.parseInt(st.nextToken());\n        for (int i = 0; i < n; i++) wt[i] = Integer.parseInt(st.nextToken());\n        int W = Integer.parseInt(st.nextToken());\n        long[] dp = new long[W + 1];\n        for (int i = 0; i < n; i++)\n            for (int c = W; c >= wt[i]; c--)\n                dp[c] = Math.max(dp[c], dp[c - wt[i]] + val[i]);\n        System.out.println(dp[W]);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\nval = list(map(int, d[1:1+n]))\nwt = list(map(int, d[1+n:1+2*n]))\nW = int(d[1+2*n])\ndp = [0] * (W + 1)\nfor i in range(n):\n    for c in range(W, wt[i] - 1, -1):\n        if dp[c - wt[i]] + val[i] > dp[c]:\n            dp[c] = dp[c - wt[i]] + val[i]\nprint(dp[W])\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    int *val = malloc(sizeof(int) * n), *wt = malloc(sizeof(int) * n);\n    for (int i = 0; i < n; i++) scanf(\"%d\", &val[i]);\n    for (int i = 0; i < n; i++) scanf(\"%d\", &wt[i]);\n    int W; scanf(\"%d\", &W);\n    long long *dp = calloc(W + 1, sizeof(long long));\n    for (int i = 0; i < n; i++)\n        for (int c = W; c >= wt[i]; c--)\n            if (dp[c - wt[i]] + val[i] > dp[c]) dp[c] = dp[c - wt[i]] + val[i];\n    printf(\"%lld\\n\", dp[W]);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<int> val(n), wt(n);\n    for (auto &x : val) cin >> x;\n    for (auto &x : wt) cin >> x;\n    int W; cin >> W;\n    vector<long long> dp(W + 1, 0);\n    for (int i = 0; i < n; i++)\n        for (int c = W; c >= wt[i]; c--)\n            dp[c] = max(dp[c], dp[c - wt[i]] + val[i]);\n    cout << dp[W] << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst val = d.slice(1, 1 + n);\nconst wt = d.slice(1 + n, 1 + 2 * n);\nconst W = d[1 + 2 * n];\nconst dp = new Array(W + 1).fill(0);\nfor (let i = 0; i < n; i++)\n    for (let c = W; c >= wt[i]; c--)\n        dp[c] = Math.max(dp[c], dp[c - wt[i]] + val[i]);\nconsole.log(dp[W]);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n10\n5\n3","expected":"0","hidden":true},{"input":"1\n10\n5\n5","expected":"10","hidden":true},{"input":"3\n1 2 3\n4 5 1\n5","expected":"4","hidden":true},{"input":"4\n10 40 30 50\n5 4 6 3\n10","expected":"90","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 138
)
on conflict (id) do nothing;

-- 139. Longest Common Subsequence  [Medium]  /practice/problems/longest-common-subsequence
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-dynamic-programming-139', 'dt-practice-dynamic-programming', null,
  $px$Longest Common Subsequence$px$, $px$longest-common-subsequence$px$, $px$Medium$px$,
  $px$Given two strings, find the length of their longest subsequence that appears in both strings in the same relative order (characters need not be contiguous).

**Input Format**

The first line contains string `A`.
The second line contains string `B`.
Both consist of lowercase English letters with no spaces.

**Output Format**

Print the length of the longest common subsequence.$px$,
  $px$[{"input":"abcde\nace","output":"3","explanation":"\"ace\" is a common subsequence of both strings."}]$px$::jsonb,
  $px$["1 <= length of A, B <= 1000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        String a = br.readLine().trim();\n        String b = br.readLine().trim();\n        int n = a.length(), m = b.length();\n        int[][] dp = new int[n + 1][m + 1];\n        for (int i = 1; i <= n; i++)\n            for (int j = 1; j <= m; j++) {\n                if (a.charAt(i - 1) == b.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1] + 1;\n                else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);\n            }\n        System.out.println(dp[n][m]);\n    }\n}\n","python":"import sys\nlines = sys.stdin.read().split('\\n')\na = lines[0].strip()\nb = lines[1].strip()\nn, m = len(a), len(b)\ndp = [[0] * (m + 1) for _ in range(n + 1)]\nfor i in range(1, n + 1):\n    for j in range(1, m + 1):\n        if a[i - 1] == b[j - 1]:\n            dp[i][j] = dp[i - 1][j - 1] + 1\n        else:\n            dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])\nprint(dp[n][m])\n","c":"#include <stdio.h>\n#include <string.h>\n#include <stdlib.h>\nint main(void) {\n    static char a[1005], b[1005];\n    if (!fgets(a, sizeof(a), stdin)) return 0;\n    fgets(b, sizeof(b), stdin);\n    a[strcspn(a, \"\\r\\n\")] = 0;\n    b[strcspn(b, \"\\r\\n\")] = 0;\n    int n = (int)strlen(a), m = (int)strlen(b);\n    int *prev = calloc(m + 1, sizeof(int));\n    int *cur = calloc(m + 1, sizeof(int));\n    for (int i = 1; i <= n; i++) {\n        for (int j = 1; j <= m; j++) {\n            if (a[i - 1] == b[j - 1]) cur[j] = prev[j - 1] + 1;\n            else cur[j] = prev[j] > cur[j - 1] ? prev[j] : cur[j - 1];\n        }\n        int *t = prev; prev = cur; cur = t;\n    }\n    printf(\"%d\\n\", prev[m]);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <string>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    string a, b;\n    getline(cin, a);\n    getline(cin, b);\n    int n = a.size(), m = b.size();\n    vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));\n    for (int i = 1; i <= n; i++)\n        for (int j = 1; j <= m; j++) {\n            if (a[i - 1] == b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;\n            else dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);\n        }\n    cout << dp[n][m] << \"\\n\";\n    return 0;\n}\n","javascript":"const lines = require('fs').readFileSync(0, 'utf8').split('\\n');\nconst a = lines[0].trim();\nconst b = lines[1].trim();\nconst n = a.length, m = b.length;\nlet prev = new Array(m + 1).fill(0);\nfor (let i = 1; i <= n; i++) {\n    const cur = new Array(m + 1).fill(0);\n    for (let j = 1; j <= m; j++) {\n        if (a[i - 1] === b[j - 1]) cur[j] = prev[j - 1] + 1;\n        else cur[j] = Math.max(prev[j], cur[j - 1]);\n    }\n    prev = cur;\n}\nconsole.log(prev[m]);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"abc\nabc","expected":"3","hidden":true},{"input":"abc\ndef","expected":"0","hidden":true},{"input":"aggtab\ngxtxayb","expected":"4","hidden":true},{"input":"aaaa\naa","expected":"2","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 139
)
on conflict (id) do nothing;

-- 140. Longest Increasing Subsequence  [Medium]  /practice/problems/longest-increasing-subsequence
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-dynamic-programming-140', 'dt-practice-dynamic-programming', null,
  $px$Longest Increasing Subsequence$px$, $px$longest-increasing-subsequence$px$, $px$Medium$px$,
  $px$Given an integer array, find the length of the longest subsequence in which each element is strictly greater than the previous one.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers.

**Output Format**

Print the length of the longest strictly increasing subsequence.$px$,
  $px$[{"input":"8\n10 9 2 5 3 7 101 18","output":"4","explanation":"One longest increasing subsequence is [2, 3, 7, 101]."}]$px$::jsonb,
  $px$["1 <= N <= 100000","-1000000000 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long[] tails = new long[n];\n        int len = 0;\n        for (int i = 0; i < n; i++) {\n            long x = Long.parseLong(st.nextToken());\n            int lo = 0, hi = len;\n            while (lo < hi) { int mid = (lo + hi) >>> 1; if (tails[mid] < x) lo = mid + 1; else hi = mid; }\n            tails[lo] = x;\n            if (lo == len) len++;\n        }\n        System.out.println(len);\n    }\n}\n","python":"import sys\nimport bisect\nd = sys.stdin.read().split()\nn = int(d[0])\ntails = []\nfor x in map(int, d[1:1+n]):\n    i = bisect.bisect_left(tails, x)\n    if i == len(tails):\n        tails.append(x)\n    else:\n        tails[i] = x\nprint(len(tails))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long *tails = malloc(sizeof(long long) * n);\n    int len = 0;\n    for (int i = 0; i < n; i++) {\n        long long x; scanf(\"%lld\", &x);\n        int lo = 0, hi = len;\n        while (lo < hi) { int mid = (lo + hi) / 2; if (tails[mid] < x) lo = mid + 1; else hi = mid; }\n        tails[lo] = x;\n        if (lo == len) len++;\n    }\n    printf(\"%d\\n\", len);\n    free(tails);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<long long> tails;\n    for (int i = 0; i < n; i++) {\n        long long x; cin >> x;\n        auto it = lower_bound(tails.begin(), tails.end(), x);\n        if (it == tails.end()) tails.push_back(x);\n        else *it = x;\n    }\n    cout << tails.size() << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst tails = [];\nfor (let i = 1; i <= n; i++) {\n    const x = d[i];\n    let lo = 0, hi = tails.length;\n    while (lo < hi) { const mid = (lo + hi) >> 1; if (tails[mid] < x) lo = mid + 1; else hi = mid; }\n    tails[lo] = x;\n}\nconsole.log(tails.length);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n5","expected":"1","hidden":true},{"input":"5\n5 4 3 2 1","expected":"1","hidden":true},{"input":"5\n1 2 3 4 5","expected":"5","hidden":true},{"input":"6\n2 2 2 2 2 2","expected":"1","hidden":true},{"input":"7\n3 1 8 2 5 9 4","expected":"4","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 140
)
on conflict (id) do nothing;

-- ===========================================================================
-- 3. VALIDATION  (raises, never silently passes)
-- ===========================================================================
do $val$
declare
  v_cat_id text := 'dt-practice-dynamic-programming';
  v_n int;
begin
  if not exists (select 1 from public.dsa_topics where id = v_cat_id and kind = 'practice') then
    raise exception '0086/058: category % missing', v_cat_id;
  end if;
  select count(*) into v_n from public.dsa_problems
   where topic_id = v_cat_id and learning_topic_id is null and coalesce(status,'published') = 'published';
  if v_n < 5 then
    raise exception '0086/058: expected >= 5 Dynamic Programming practice problems, found %', v_n;
  end if;
  raise notice '0086/058 OK: % Dynamic Programming practice problems present.', v_n;
end
$val$;

notify pgrst, 'reload schema';
