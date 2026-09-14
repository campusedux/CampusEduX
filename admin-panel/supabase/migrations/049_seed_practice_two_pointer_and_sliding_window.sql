-- admin-panel/supabase/migrations/049_seed_practice_two_pointer_and_sliding_window.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: mobile-app/supabase/migrations/0077_seed_practice_two_pointer_and_sliding_window.sql ; apply either, the other is a guarded no-op.
-- ============================================================================
-- BODY — global Practice ▸ Coding Problems seed: Two Pointer & Sliding Window (5 problems)
-- (mobile 0077_seed_practice_two_pointer_and_sliding_window.sql
--  == admin 049_seed_practice_two_pointer_and_sliding_window.sql — byte-identical below the 3-line header,
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
    raise exception '0077/049: practice RPCs not found — apply 0072_practice_coding.sql (admin 044) first.';
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
  ('dt-practice-two-pointer-and-sliding-window', $px$Two Pointer & Sliding Window$px$, $px$two-pointer-and-sliding-window$px$, $px$Opposing pointers on sorted data and fixed / variable sliding windows over a sequence.$px$, 5, 'practice', 'published', true, true)
on conflict (id) do nothing;

-- ===========================================================================
-- 2. CODING PROBLEMS — Two Pointer & Sliding Window
-- ===========================================================================

-- 56. Two Sum in Sorted Array  [Easy]  /practice/problems/two-sum-in-sorted-array
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-two-pointer-and-sliding-window-56', 'dt-practice-two-pointer-and-sliding-window', null,
  $px$Two Sum in Sorted Array$px$, $px$two-sum-in-sorted-array$px$, $px$Easy$px$,
  $px$Given a sorted array and a target value, determine whether two elements at different positions add up to the target, using the two-pointer technique.

**Input Format**

The first line contains two integers `N` and `target`.
The second line contains `N` space-separated integers in non-decreasing order.

**Output Format**

Print `1` if such a pair exists, otherwise print `0`.$px$,
  $px$[{"input":"7 13\n1 2 4 6 8 9 14","output":"1","explanation":"4 + 9 = 13."}]$px$::jsonb,
  $px$["2 <= N <= 100000","The array is sorted in non-decreasing order.","-1000000000 <= A[i], target <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long target = Long.parseLong(st.nextToken());\n        long[] a = new long[n];\n        for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());\n        int i = 0, j = n - 1, ans = 0;\n        while (i < j) {\n            long s = a[i] + a[j];\n            if (s == target) { ans = 1; break; }\n            else if (s < target) i++;\n            else j--;\n        }\n        System.out.println(ans);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn, target = int(d[0]), int(d[1])\na = list(map(int, d[2:2+n]))\ni, j, ans = 0, n - 1, 0\nwhile i < j:\n    s = a[i] + a[j]\n    if s == target:\n        ans = 1\n        break\n    elif s < target:\n        i += 1\n    else:\n        j -= 1\nprint(ans)\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    long long n, target;\n    if (scanf(\"%lld %lld\", &n, &target) != 2) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    for (long long i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    long long i = 0, j = n - 1;\n    int ans = 0;\n    while (i < j) {\n        long long s = a[i] + a[j];\n        if (s == target) { ans = 1; break; }\n        else if (s < target) i++;\n        else j--;\n    }\n    printf(\"%d\\n\", ans);\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    long long n, target; cin >> n >> target;\n    vector<long long> a(n);\n    for (auto &x : a) cin >> x;\n    long long i = 0, j = n - 1;\n    int ans = 0;\n    while (i < j) {\n        long long s = a[i] + a[j];\n        if (s == target) { ans = 1; break; }\n        else if (s < target) i++;\n        else j--;\n    }\n    cout << ans << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], target = d[1];\nconst a = d.slice(2, 2 + n);\nlet i = 0, j = n - 1, ans = 0;\nwhile (i < j) {\n    const s = a[i] + a[j];\n    if (s === target) { ans = 1; break; }\n    else if (s < target) i++;\n    else j--;\n}\nconsole.log(ans);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"2 3\n1 2","expected":"1","hidden":true},{"input":"2 5\n1 2","expected":"0","hidden":true},{"input":"5 4\n2 2 2 2 2","expected":"1","hidden":true},{"input":"4 -2\n-5 -2 0 3","expected":"1","hidden":true},{"input":"4 -3\n-5 -2 0 3","expected":"0","hidden":true},{"input":"5 100\n1 2 3 4 5","expected":"0","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 56
)
on conflict (id) do nothing;

-- 57. Remove Duplicates Using Two Pointers  [Easy]  /practice/problems/remove-duplicates-two-pointers
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-two-pointer-and-sliding-window-57', 'dt-practice-two-pointer-and-sliding-window', null,
  $px$Remove Duplicates Using Two Pointers$px$, $px$remove-duplicates-two-pointers$px$, $px$Easy$px$,
  $px$Given a sorted array, remove duplicate values in-place using a two-pointer approach, and report the number of unique values and the unique values themselves.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers in non-decreasing order.

**Output Format**

Print two lines:
`Count = C`
`Values = v1 v2 ...` (the distinct values in increasing order, space-separated).$px$,
  $px$[{"input":"5\n1 1 2 2 3","output":"Count = 3\nValues = 1 2 3","explanation":"Three distinct values remain after removing duplicates."}]$px$::jsonb,
  $px$["1 <= N <= 100000","The array is sorted in non-decreasing order.","-1000000000 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        ArrayList<Long> out = new ArrayList<>();\n        for (int i = 0; i < n; i++) {\n            long x = Long.parseLong(st.nextToken());\n            if (out.isEmpty() || out.get(out.size() - 1) != x) out.add(x);\n        }\n        StringBuilder sb = new StringBuilder();\n        sb.append(\"Count = \").append(out.size()).append('\\n').append(\"Values =\");\n        for (long x : out) sb.append(' ').append(x);\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\nout = []\nfor x in map(int, d[1:1+n]):\n    if not out or out[-1] != x:\n        out.append(x)\nprint(f\"Count = {len(out)}\")\nprint(\"Values = \" + ' '.join(map(str, out)))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long prev = 0, x;\n    int count = 0, has = 0;\n    long long *out = malloc(sizeof(long long) * n);\n    for (int i = 0; i < n; i++) {\n        scanf(\"%lld\", &x);\n        if (!has || prev != x) { out[count++] = x; prev = x; has = 1; }\n    }\n    printf(\"Count = %d\\n\", count);\n    printf(\"Values =\");\n    for (int i = 0; i < count; i++) printf(\" %lld\", out[i]);\n    printf(\"\\n\");\n    free(out);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<long long> out;\n    for (int i = 0; i < n; i++) {\n        long long x; cin >> x;\n        if (out.empty() || out.back() != x) out.push_back(x);\n    }\n    cout << \"Count = \" << out.size() << \"\\n\" << \"Values =\";\n    for (long long x : out) cout << ' ' << x;\n    cout << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst out = [];\nfor (let i = 1; i <= n; i++) if (out.length === 0 || out[out.length - 1] !== d[i]) out.push(d[i]);\nconsole.log(`Count = ${out.length}`);\nconsole.log('Values = ' + out.join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n7","expected":"Count = 1\nValues = 7","hidden":true},{"input":"5\n4 4 4 4 4","expected":"Count = 1\nValues = 4","hidden":true},{"input":"4\n-2 -1 0 1","expected":"Count = 4\nValues = -2 -1 0 1","hidden":true},{"input":"6\n1 1 1 5 5 9","expected":"Count = 3\nValues = 1 5 9","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 57
)
on conflict (id) do nothing;

-- 58. Maximum Sum of K Consecutive Elements  [Easy]  /practice/problems/maximum-sum-of-k-consecutive-elements
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-two-pointer-and-sliding-window-58', 'dt-practice-two-pointer-and-sliding-window', null,
  $px$Maximum Sum of K Consecutive Elements$px$, $px$maximum-sum-of-k-consecutive-elements$px$, $px$Easy$px$,
  $px$Given an integer array and a number `K`, find the maximum sum of any contiguous subarray of exactly `K` elements.

**Input Format**

The first line contains two integers `N` and `K`.
The second line contains `N` space-separated integers.

**Output Format**

Print the maximum sum of a window of `K` consecutive elements.$px$,
  $px$[{"input":"6 3\n2 1 5 1 3 2","output":"9","explanation":"The window [5, 1, 3] has the maximum sum 9."}]$px$::jsonb,
  $px$["1 <= K <= N <= 100000","-1000000000 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        int k = Integer.parseInt(st.nextToken());\n        long[] a = new long[n];\n        for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());\n        long cur = 0;\n        for (int i = 0; i < k; i++) cur += a[i];\n        long best = cur;\n        for (int i = k; i < n; i++) { cur += a[i] - a[i - k]; best = Math.max(best, cur); }\n        System.out.println(best);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn, k = int(d[0]), int(d[1])\na = list(map(int, d[2:2+n]))\ncur = sum(a[:k])\nbest = cur\nfor i in range(k, n):\n    cur += a[i] - a[i - k]\n    best = max(best, cur)\nprint(best)\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    int n, k;\n    if (scanf(\"%d %d\", &n, &k) != 2) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    long long cur = 0;\n    for (int i = 0; i < k; i++) cur += a[i];\n    long long best = cur;\n    for (int i = k; i < n; i++) { cur += a[i] - a[i - k]; if (cur > best) best = cur; }\n    printf(\"%lld\\n\", best);\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n, k; cin >> n >> k;\n    vector<long long> a(n);\n    for (auto &x : a) cin >> x;\n    long long cur = 0;\n    for (int i = 0; i < k; i++) cur += a[i];\n    long long best = cur;\n    for (int i = k; i < n; i++) { cur += a[i] - a[i - k]; best = max(best, cur); }\n    cout << best << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], k = d[1];\nlet cur = 0;\nfor (let i = 0; i < k; i++) cur += d[2 + i];\nlet best = cur;\nfor (let i = k; i < n; i++) { cur += d[2 + i] - d[2 + i - k]; best = Math.max(best, cur); }\nconsole.log(best);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1 1\n5","expected":"5","hidden":true},{"input":"5 5\n1 2 3 4 5","expected":"15","hidden":true},{"input":"5 2\n-1 -2 -3 -4 -5","expected":"-3","hidden":true},{"input":"6 3\n1 1 1 100 1 1","expected":"102","hidden":true},{"input":"4 1\n-5 -2 -8 -1","expected":"-1","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 58
)
on conflict (id) do nothing;

-- 59. First Negative Number in Every Window  [Medium]  /practice/problems/first-negative-in-every-window
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-two-pointer-and-sliding-window-59', 'dt-practice-two-pointer-and-sliding-window', null,
  $px$First Negative Number in Every Window$px$, $px$first-negative-in-every-window$px$, $px$Medium$px$,
  $px$Given an integer array and a window size `K`, find the first negative number in every contiguous window of size `K`. If a window has no negative number, use `0` for that window.

**Input Format**

The first line contains two integers `N` and `K`.
The second line contains `N` space-separated integers.

**Output Format**

Print the first negative value from each window (left to right), separated by single spaces.$px$,
  $px$[{"input":"8 3\n12 -1 -7 8 -15 30 16 28","output":"-1 -1 -7 -15 -15 0","explanation":"For each group of three consecutive elements, take the first negative number."}]$px$::jsonb,
  $px$["1 <= K <= N <= 100000","-1000000000 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        int k = Integer.parseInt(st.nextToken());\n        long[] a = new long[n];\n        for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());\n        ArrayDeque<Integer> dq = new ArrayDeque<>();\n        StringBuilder sb = new StringBuilder();\n        boolean first = true;\n        for (int i = 0; i < n; i++) {\n            if (a[i] < 0) dq.addLast(i);\n            if (i >= k - 1) {\n                while (!dq.isEmpty() && dq.peekFirst() <= i - k) dq.pollFirst();\n                if (!first) sb.append(' ');\n                sb.append(dq.isEmpty() ? 0 : a[dq.peekFirst()]);\n                first = false;\n            }\n        }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nfrom collections import deque\nd = sys.stdin.read().split()\nn, k = int(d[0]), int(d[1])\na = list(map(int, d[2:2+n]))\ndq = deque()\nres = []\nfor i in range(n):\n    if a[i] < 0:\n        dq.append(i)\n    if i >= k - 1:\n        while dq and dq[0] <= i - k:\n            dq.popleft()\n        res.append(a[dq[0]] if dq else 0)\nprint(' '.join(map(str, res)))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    int n, k;\n    if (scanf(\"%d %d\", &n, &k) != 2) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    int *dq = malloc(sizeof(int) * n);\n    int head = 0, tail = 0, first = 1;\n    for (int i = 0; i < n; i++) {\n        if (a[i] < 0) dq[tail++] = i;\n        if (i >= k - 1) {\n            while (head < tail && dq[head] <= i - k) head++;\n            if (!first) putchar(' ');\n            printf(\"%lld\", head < tail ? a[dq[head]] : 0LL);\n            first = 0;\n        }\n    }\n    putchar('\\n');\n    free(a); free(dq);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <deque>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n, k; cin >> n >> k;\n    vector<long long> a(n);\n    for (auto &x : a) cin >> x;\n    deque<int> dq;\n    bool first = true;\n    for (int i = 0; i < n; i++) {\n        if (a[i] < 0) dq.push_back(i);\n        if (i >= k - 1) {\n            while (!dq.empty() && dq.front() <= i - k) dq.pop_front();\n            if (!first) cout << ' ';\n            cout << (dq.empty() ? 0LL : a[dq.front()]);\n            first = false;\n        }\n    }\n    cout << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], k = d[1];\nconst a = d.slice(2, 2 + n);\nconst dq = [];\nconst res = [];\nfor (let i = 0; i < n; i++) {\n    if (a[i] < 0) dq.push(i);\n    if (i >= k - 1) {\n        while (dq.length && dq[0] <= i - k) dq.shift();\n        res.push(dq.length ? a[dq[0]] : 0);\n    }\n}\nconsole.log(res.join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1 1\n-4","expected":"-4","hidden":true},{"input":"1 1\n5","expected":"0","hidden":true},{"input":"5 2\n1 2 3 4 5","expected":"0 0 0 0","hidden":true},{"input":"5 5\n-1 -2 -3 -4 -5","expected":"-1","hidden":true},{"input":"6 3\n5 -2 3 -1 4 -6","expected":"-2 -2 -1 -1","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 59
)
on conflict (id) do nothing;

-- 60. Maximum Element in Every Window  [Medium]  /practice/problems/maximum-in-every-window
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-two-pointer-and-sliding-window-60', 'dt-practice-two-pointer-and-sliding-window', null,
  $px$Maximum Element in Every Window$px$, $px$maximum-in-every-window$px$, $px$Medium$px$,
  $px$Given an integer array and a window size `K`, find the maximum element in every contiguous window of size `K`.

**Input Format**

The first line contains two integers `N` and `K`.
The second line contains `N` space-separated integers.

**Output Format**

Print the maximum of each window (left to right), separated by single spaces.$px$,
  $px$[{"input":"8 3\n1 3 -1 -3 5 3 6 7","output":"3 3 5 5 6 7","explanation":"Each output value is the largest among the corresponding three consecutive elements."}]$px$::jsonb,
  $px$["1 <= K <= N <= 100000","-1000000000 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        int k = Integer.parseInt(st.nextToken());\n        long[] a = new long[n];\n        for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());\n        ArrayDeque<Integer> dq = new ArrayDeque<>();\n        StringBuilder sb = new StringBuilder();\n        boolean first = true;\n        for (int i = 0; i < n; i++) {\n            while (!dq.isEmpty() && a[dq.peekLast()] <= a[i]) dq.pollLast();\n            dq.addLast(i);\n            if (dq.peekFirst() <= i - k) dq.pollFirst();\n            if (i >= k - 1) { if (!first) sb.append(' '); sb.append(a[dq.peekFirst()]); first = false; }\n        }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nfrom collections import deque\nd = sys.stdin.read().split()\nn, k = int(d[0]), int(d[1])\na = list(map(int, d[2:2+n]))\ndq = deque()\nres = []\nfor i in range(n):\n    while dq and a[dq[-1]] <= a[i]:\n        dq.pop()\n    dq.append(i)\n    if dq[0] <= i - k:\n        dq.popleft()\n    if i >= k - 1:\n        res.append(a[dq[0]])\nprint(' '.join(map(str, res)))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    int n, k;\n    if (scanf(\"%d %d\", &n, &k) != 2) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    int *dq = malloc(sizeof(int) * n);\n    int head = 0, tail = 0, first = 1;\n    for (int i = 0; i < n; i++) {\n        while (tail > head && a[dq[tail - 1]] <= a[i]) tail--;\n        dq[tail++] = i;\n        if (dq[head] <= i - k) head++;\n        if (i >= k - 1) { if (!first) putchar(' '); printf(\"%lld\", a[dq[head]]); first = 0; }\n    }\n    putchar('\\n');\n    free(a); free(dq);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <deque>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n, k; cin >> n >> k;\n    vector<long long> a(n);\n    for (auto &x : a) cin >> x;\n    deque<int> dq;\n    bool first = true;\n    for (int i = 0; i < n; i++) {\n        while (!dq.empty() && a[dq.back()] <= a[i]) dq.pop_back();\n        dq.push_back(i);\n        if (dq.front() <= i - k) dq.pop_front();\n        if (i >= k - 1) { if (!first) cout << ' '; cout << a[dq.front()]; first = false; }\n    }\n    cout << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], k = d[1];\nconst a = d.slice(2, 2 + n);\nconst dq = [];\nconst res = [];\nfor (let i = 0; i < n; i++) {\n    while (dq.length && a[dq[dq.length - 1]] <= a[i]) dq.pop();\n    dq.push(i);\n    if (dq[0] <= i - k) dq.shift();\n    if (i >= k - 1) res.push(a[dq[0]]);\n}\nconsole.log(res.join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1 1\n42","expected":"42","hidden":true},{"input":"5 5\n5 4 3 2 1","expected":"5","hidden":true},{"input":"5 1\n-1 -2 -3 -4 -5","expected":"-1 -2 -3 -4 -5","hidden":true},{"input":"6 2\n2 2 2 2 2 2","expected":"2 2 2 2 2","hidden":true},{"input":"7 3\n9 1 1 1 1 1 9","expected":"9 1 1 1 9","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 60
)
on conflict (id) do nothing;

-- ===========================================================================
-- 3. VALIDATION  (raises, never silently passes)
-- ===========================================================================
do $val$
declare
  v_cat_id text := 'dt-practice-two-pointer-and-sliding-window';
  v_n int;
begin
  if not exists (select 1 from public.dsa_topics where id = v_cat_id and kind = 'practice') then
    raise exception '0077/049: category % missing', v_cat_id;
  end if;
  select count(*) into v_n from public.dsa_problems
   where topic_id = v_cat_id and learning_topic_id is null and coalesce(status,'published') = 'published';
  if v_n < 5 then
    raise exception '0077/049: expected >= 5 Two Pointer & Sliding Window practice problems, found %', v_n;
  end if;
  raise notice '0077/049 OK: % Two Pointer & Sliding Window practice problems present.', v_n;
end
$val$;

notify pgrst, 'reload schema';
