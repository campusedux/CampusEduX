-- admin-panel/supabase/migrations/048_seed_practice_hashing.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: mobile-app/supabase/migrations/0076_seed_practice_hashing.sql ; apply either, the other is a guarded no-op.
-- ============================================================================
-- BODY — global Practice ▸ Coding Problems seed: Hashing (10 problems)
-- (mobile 0076_seed_practice_hashing.sql
--  == admin 048_seed_practice_hashing.sql — byte-identical below the 3-line header,
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
    raise exception '0076/048: practice RPCs not found — apply 0072_practice_coding.sql (admin 044) first.';
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
  ('dt-practice-hashing', $px$Hashing$px$, $px$hashing$px$, $px$Frequency maps, prefix-sum hash sets, duplicate detection, anagram grouping and consecutive-sequence scans.$px$, 4, 'practice', 'published', true, true)
on conflict (id) do nothing;

-- ===========================================================================
-- 2. CODING PROBLEMS — Hashing
-- ===========================================================================

-- 46. Frequency Map  [Easy]  /practice/problems/frequency-map
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-hashing-46', 'dt-practice-hashing', null,
  $px$Frequency Map$px$, $px$frequency-map$px$, $px$Easy$px$,
  $px$Given an integer array, count how many times each distinct value occurs and report the counts in order of the values' **first appearance**.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers.

**Output Format**

For each distinct value, in order of first appearance, print a line `v = k` where `v` is the value and `k` is its count.$px$,
  $px$[{"input":"6\n2 3 2 5 3 2","output":"2 = 3\n3 = 2\n5 = 1","explanation":"2 appears 3 times, 3 twice, 5 once — listed in first-appearance order."}]$px$::jsonb,
  $px$["1 <= N <= 100000","-1000000000 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        LinkedHashMap<Long, Integer> m = new LinkedHashMap<>();\n        for (int i = 0; i < n; i++) m.merge(Long.parseLong(st.nextToken()), 1, Integer::sum);\n        StringBuilder sb = new StringBuilder();\n        for (Map.Entry<Long, Integer> e : m.entrySet()) sb.append(e.getKey()).append(\" = \").append(e.getValue()).append('\\n');\n        System.out.print(sb);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\norder = []\ncnt = {}\nfor x in map(int, d[1:1+n]):\n    if x not in cnt:\n        cnt[x] = 0\n        order.append(x)\n    cnt[x] += 1\nprint('\\n'.join(f\"{x} = {cnt[x]}\" for x in order))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    int *cnt = malloc(sizeof(int) * n);\n    int m = 0;\n    for (int i = 0; i < n; i++) {\n        long long x; scanf(\"%lld\", &x);\n        int j;\n        for (j = 0; j < m; j++) if (a[j] == x) { cnt[j]++; break; }\n        if (j == m) { a[m] = x; cnt[m] = 1; m++; }\n    }\n    for (int i = 0; i < m; i++) printf(\"%lld = %d\\n\", a[i], cnt[i]);\n    free(a); free(cnt);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <unordered_map>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<long long> order;\n    unordered_map<long long, int> cnt;\n    for (int i = 0; i < n; i++) {\n        long long x; cin >> x;\n        if (!cnt.count(x)) order.push_back(x);\n        cnt[x]++;\n    }\n    for (long long x : order) cout << x << \" = \" << cnt[x] << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/);\nconst n = Number(d[0]);\nconst order = [];\nconst cnt = new Map();\nfor (let i = 1; i <= n; i++) {\n    const x = d[i];\n    if (!cnt.has(x)) { cnt.set(x, 0); order.push(x); }\n    cnt.set(x, cnt.get(x) + 1);\n}\nconsole.log(order.map((x) => `${x} = ${cnt.get(x)}`).join('\\n'));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n7","expected":"7 = 1","hidden":true},{"input":"4\n-1 -1 -1 -1","expected":"-1 = 4","hidden":true},{"input":"5\n5 4 3 2 1","expected":"5 = 1\n4 = 1\n3 = 1\n2 = 1\n1 = 1","hidden":true},{"input":"6\n1000000000 1000000000 -1000000000 0 0 0","expected":"1000000000 = 2\n-1000000000 = 1\n0 = 3","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 46
)
on conflict (id) do nothing;

-- 47. Find Duplicate Values  [Easy]  /practice/problems/find-duplicate-values
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-hashing-47', 'dt-practice-hashing', null,
  $px$Find Duplicate Values$px$, $px$find-duplicate-values$px$, $px$Easy$px$,
  $px$Given an array, find every value that occurs more than once.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers.

**Output Format**

Print the distinct duplicated values in increasing order, separated by single spaces. If there are none, print an empty line.$px$,
  $px$[{"input":"7\n1 3 4 3 5 1 6","output":"1 3","explanation":"1 and 3 each appear more than once."}]$px$::jsonb,
  $px$["1 <= N <= 100000","-1000000000 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        HashMap<Long, Integer> c = new HashMap<>();\n        for (int i = 0; i < n; i++) c.merge(Long.parseLong(st.nextToken()), 1, Integer::sum);\n        TreeSet<Long> dup = new TreeSet<>();\n        for (Map.Entry<Long, Integer> e : c.entrySet()) if (e.getValue() > 1) dup.add(e.getKey());\n        StringBuilder sb = new StringBuilder();\n        boolean first = true;\n        for (long x : dup) { if (!first) sb.append(' '); sb.append(x); first = false; }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nfrom collections import Counter\nd = sys.stdin.read().split()\nn = int(d[0])\nc = Counter(map(int, d[1:1+n]))\nprint(' '.join(str(k) for k in sorted(k for k, v in c.items() if v > 1)))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint cmp(const void *p, const void *q) { long long a = *(const long long*)p, b = *(const long long*)q; return (a > b) - (a < b); }\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    qsort(a, n, sizeof(long long), cmp);\n    int first = 1;\n    for (int i = 0; i < n; ) {\n        int j = i;\n        while (j < n && a[j] == a[i]) j++;\n        if (j - i > 1) { if (!first) putchar(' '); printf(\"%lld\", a[i]); first = 0; }\n        i = j;\n    }\n    putchar('\\n');\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <map>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    map<long long, int> c;\n    for (int i = 0; i < n; i++) { long long x; cin >> x; c[x]++; }\n    bool first = true;\n    for (auto &e : c) if (e.second > 1) { if (!first) cout << ' '; cout << e.first; first = false; }\n    cout << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst c = new Map();\nfor (let i = 1; i <= n; i++) c.set(d[i], (c.get(d[i]) || 0) + 1);\nconst dup = [...c.entries()].filter(([, v]) => v > 1).map(([k]) => k).sort((x, y) => x - y);\nconsole.log(dup.join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"5\n1 2 3 4 5","expected":"","hidden":true},{"input":"4\n2 2 2 2","expected":"2","hidden":true},{"input":"6\n-1 -1 0 0 5 5","expected":"-1 0 5","hidden":true},{"input":"1\n9","expected":"","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 47
)
on conflict (id) do nothing;

-- 48. Zero Sum Subarray  [Medium]  /practice/problems/zero-sum-subarray
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-hashing-48', 'dt-practice-hashing', null,
  $px$Zero Sum Subarray$px$, $px$zero-sum-subarray$px$, $px$Medium$px$,
  $px$Determine whether the array contains a non-empty contiguous subarray whose elements sum to zero.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers.

**Output Format**

Print `1` if a zero-sum subarray exists, otherwise print `0`.$px$,
  $px$[{"input":"5\n4 2 -3 1 6","output":"1","explanation":"The subarray [2, -3, 1] sums to 0."}]$px$::jsonb,
  $px$["1 <= N <= 100000","-1000000000 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        HashSet<Long> seen = new HashSet<>();\n        seen.add(0L);\n        long s = 0;\n        int ans = 0;\n        for (int i = 0; i < n; i++) {\n            s += Long.parseLong(st.nextToken());\n            if (!seen.add(s)) { ans = 1; break; }\n        }\n        System.out.println(ans);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\nseen = {0}\ns = 0\nans = 0\nfor x in map(int, d[1:1+n]):\n    s += x\n    if s in seen:\n        ans = 1\n        break\n    seen.add(s)\nprint(ans)\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint cmp(const void *p, const void *q) { long long a = *(const long long*)p, b = *(const long long*)q; return (a > b) - (a < b); }\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long *pre = malloc(sizeof(long long) * (n + 1));\n    pre[0] = 0;\n    for (int i = 0; i < n; i++) { long long x; scanf(\"%lld\", &x); pre[i + 1] = pre[i] + x; }\n    qsort(pre, n + 1, sizeof(long long), cmp);\n    int ans = 0;\n    for (int i = 1; i <= n; i++) if (pre[i] == pre[i - 1]) ans = 1;\n    printf(\"%d\\n\", ans);\n    free(pre);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <unordered_set>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    unordered_set<long long> seen;\n    seen.insert(0);\n    long long s = 0;\n    int ans = 0;\n    for (int i = 0; i < n; i++) {\n        long long x; cin >> x;\n        s += x;\n        if (!seen.insert(s).second) { ans = 1; break; }\n    }\n    cout << ans << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst seen = new Set([0]);\nlet s = 0, ans = 0;\nfor (let i = 1; i <= n; i++) {\n    s += d[i];\n    if (seen.has(s)) { ans = 1; break; }\n    seen.add(s);\n}\nconsole.log(ans);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n0","expected":"1","hidden":true},{"input":"1\n5","expected":"0","hidden":true},{"input":"4\n1 2 3 4","expected":"0","hidden":true},{"input":"5\n3 1 -1 -2 5","expected":"1","hidden":true},{"input":"3\n-5 5 1","expected":"1","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 48
)
on conflict (id) do nothing;

-- 49. Longest Subarray with Sum K  [Medium]  /practice/problems/longest-subarray-with-sum-k
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-hashing-49', 'dt-practice-hashing', null,
  $px$Longest Subarray with Sum K$px$, $px$longest-subarray-with-sum-k$px$, $px$Medium$px$,
  $px$Given an integer array and a target `K`, find the length of the longest contiguous subarray whose sum is exactly `K`.

**Input Format**

The first line contains two integers `N` and `K`.
The second line contains `N` space-separated integers.

**Output Format**

Print the length of the longest such subarray, or `0` if none exists.$px$,
  $px$[{"input":"6 15\n10 5 2 7 1 9","output":"4","explanation":"The subarray [5, 2, 7, 1] sums to 15 and has length 4."}]$px$::jsonb,
  $px$["1 <= N <= 100000","-1000000000 <= A[i] <= 1000000000","-100000000000000 <= K <= 100000000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long k = Long.parseLong(st.nextToken());\n        HashMap<Long, Integer> first = new HashMap<>();\n        first.put(0L, -1);\n        long s = 0;\n        int best = 0;\n        for (int i = 0; i < n; i++) {\n            s += Long.parseLong(st.nextToken());\n            Integer j = first.get(s - k);\n            if (j != null) best = Math.max(best, i - j);\n            first.putIfAbsent(s, i);\n        }\n        System.out.println(best);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn, k = int(d[0]), int(d[1])\nfirst = {0: -1}\ns = 0\nbest = 0\nfor i, x in enumerate(map(int, d[2:2+n])):\n    s += x\n    if s - k in first:\n        best = max(best, i - first[s - k])\n    if s not in first:\n        first[s] = i\nprint(best)\n","c":"#include <stdio.h>\n#include <stdlib.h>\ntypedef struct { long long val; int idx; } E;\nint cmpE(const void *p, const void *q) {\n    const E *a = p, *b = q;\n    if (a->val != b->val) return (a->val > b->val) - (a->val < b->val);\n    return (a->idx > b->idx) - (a->idx < b->idx);\n}\nint main(void) {\n    int n; long long k;\n    if (scanf(\"%d %lld\", &n, &k) != 2) return 0;\n    long long *p = malloc(sizeof(long long) * (n + 1));\n    p[0] = 0;\n    for (int i = 0; i < n; i++) { long long x; scanf(\"%lld\", &x); p[i + 1] = p[i] + x; }\n    E *e = malloc(sizeof(E) * (n + 1));\n    for (int i = 0; i <= n; i++) { e[i].val = p[i]; e[i].idx = i; }\n    qsort(e, n + 1, sizeof(E), cmpE);\n    /* distinct values with smallest index */\n    long long *dv = malloc(sizeof(long long) * (n + 1));\n    int *dfirst = malloc(sizeof(int) * (n + 1));\n    int m = 0;\n    for (int i = 0; i <= n; i++) {\n        if (m == 0 || dv[m - 1] != e[i].val) { dv[m] = e[i].val; dfirst[m] = e[i].idx; m++; }\n    }\n    int best = 0;\n    for (int i = 1; i <= n; i++) {\n        long long target = p[i] - k;\n        int lo = 0, hi = m - 1, found = -1;\n        while (lo <= hi) {\n            int mid = (lo + hi) / 2;\n            if (dv[mid] == target) { found = mid; break; }\n            else if (dv[mid] < target) lo = mid + 1;\n            else hi = mid - 1;\n        }\n        if (found >= 0 && dfirst[found] < i) {\n            int len = i - dfirst[found];\n            if (len > best) best = len;\n        }\n    }\n    printf(\"%d\\n\", best);\n    free(p); free(e); free(dv); free(dfirst);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <unordered_map>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    long long n, k; cin >> n >> k;\n    unordered_map<long long, int> first;\n    first[0] = -1;\n    long long s = 0;\n    int best = 0;\n    for (int i = 0; i < n; i++) {\n        long long x; cin >> x;\n        s += x;\n        auto it = first.find(s - k);\n        if (it != first.end()) best = max(best, i - it->second);\n        if (!first.count(s)) first[s] = i;\n    }\n    cout << best << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], k = d[1];\nconst first = new Map([[0, -1]]);\nlet s = 0, best = 0;\nfor (let i = 0; i < n; i++) {\n    s += d[2 + i];\n    if (first.has(s - k)) best = Math.max(best, i - first.get(s - k));\n    if (!first.has(s)) first.set(s, i);\n}\nconsole.log(best);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1 5\n5","expected":"1","hidden":true},{"input":"1 5\n3","expected":"0","hidden":true},{"input":"5 0\n1 -1 1 -1 1","expected":"4","hidden":true},{"input":"4 3\n1 1 1 1","expected":"3","hidden":true},{"input":"5 -5\n-2 -1 -2 3 1","expected":"3","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 49
)
on conflict (id) do nothing;

-- 50. Longest Consecutive Sequence  [Medium]  /practice/problems/longest-consecutive-sequence
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-hashing-50', 'dt-practice-hashing', null,
  $px$Longest Consecutive Sequence$px$, $px$longest-consecutive-sequence$px$, $px$Medium$px$,
  $px$Given an unsorted array, find the length of the longest run of consecutive integers (values differing by exactly 1), regardless of their positions in the array.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers.

**Output Format**

Print the length of the longest consecutive sequence.$px$,
  $px$[{"input":"6\n100 4 200 1 3 2","output":"4","explanation":"The sequence 1, 2, 3, 4 has length 4."}]$px$::jsonb,
  $px$["1 <= N <= 100000","-1000000000 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        HashSet<Long> s = new HashSet<>();\n        for (int i = 0; i < n; i++) s.add(Long.parseLong(st.nextToken()));\n        long best = 0;\n        for (long x : s) {\n            if (!s.contains(x - 1)) {\n                long y = x;\n                while (s.contains(y + 1)) y++;\n                best = Math.max(best, y - x + 1);\n            }\n        }\n        System.out.println(best);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\ns = set(map(int, d[1:1+n]))\nbest = 0\nfor x in s:\n    if x - 1 not in s:\n        y = x\n        while y + 1 in s:\n            y += 1\n        best = max(best, y - x + 1)\nprint(best)\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint cmp(const void *p, const void *q) { long long a = *(const long long*)p, b = *(const long long*)q; return (a > b) - (a < b); }\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    qsort(a, n, sizeof(long long), cmp);\n    long long best = 1, cur = 1;\n    for (int i = 1; i < n; i++) {\n        if (a[i] == a[i - 1]) continue;\n        if (a[i] == a[i - 1] + 1) cur++;\n        else cur = 1;\n        if (cur > best) best = cur;\n    }\n    printf(\"%lld\\n\", best);\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <unordered_set>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    unordered_set<long long> s;\n    for (int i = 0; i < n; i++) { long long x; cin >> x; s.insert(x); }\n    long long best = 0;\n    for (long long x : s) {\n        if (!s.count(x - 1)) {\n            long long y = x;\n            while (s.count(y + 1)) y++;\n            best = max(best, y - x + 1);\n        }\n    }\n    cout << best << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst s = new Set(d.slice(1, 1 + n));\nlet best = 0;\nfor (const x of s) {\n    if (!s.has(x - 1)) {\n        let y = x;\n        while (s.has(y + 1)) y++;\n        best = Math.max(best, y - x + 1);\n    }\n}\nconsole.log(best);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n7","expected":"1","hidden":true},{"input":"5\n5 5 5 5 5","expected":"1","hidden":true},{"input":"4\n-3 -2 -1 0","expected":"4","hidden":true},{"input":"7\n10 20 30 40 50 60 70","expected":"1","hidden":true},{"input":"8\n1 2 2 3 4 100 101 102","expected":"4","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 50
)
on conflict (id) do nothing;

-- 51. Group Anagrams  [Medium]  /practice/problems/group-anagrams
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-hashing-51', 'dt-practice-hashing', null,
  $px$Group Anagrams$px$, $px$group-anagrams$px$, $px$Medium$px$,
  $px$Given a list of words, group together the words that are anagrams of each other.

**Input Format**

The first line contains an integer `K`, the number of words.
Each of the next `K` lines contains one lowercase word with no spaces.

**Output Format**

Print one line per group. Within a group, keep the words in input order, separated by single spaces. Order the groups by the first appearance of any of their members.$px$,
  $px$[{"input":"6\neat\ntea\ntan\nate\nnat\nbat","output":"eat tea ate\ntan nat\nbat","explanation":"Words with the same letter multiset are in one group."}]$px$::jsonb,
  $px$["1 <= K <= 10000","1 <= length of each word <= 100","Words consist of lowercase English letters."]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        int k = Integer.parseInt(br.readLine().trim());\n        LinkedHashMap<String, List<String>> groups = new LinkedHashMap<>();\n        for (int i = 0; i < k; i++) {\n            String w = br.readLine();\n            if (w == null) w = \"\";\n            char[] c = w.toCharArray();\n            Arrays.sort(c);\n            groups.computeIfAbsent(new String(c), z -> new ArrayList<>()).add(w);\n        }\n        StringBuilder sb = new StringBuilder();\n        for (List<String> g : groups.values()) sb.append(String.join(\" \", g)).append('\\n');\n        System.out.print(sb);\n    }\n}\n","python":"import sys\nlines = sys.stdin.read().split('\\n')\nk = int(lines[0])\nwords = lines[1:1+k]\norder = []\ngroups = {}\nfor w in words:\n    key = ''.join(sorted(w))\n    if key not in groups:\n        groups[key] = []\n        order.append(key)\n    groups[key].append(w)\nprint('\\n'.join(' '.join(groups[key]) for key in order))\n","c":"#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\nstatic char words[10000][105];\nstatic char keys[10000][105];\nstatic int groupOf[10000];\nstatic int firstIdx[10000];\nint main(void) {\n    int k;\n    if (scanf(\"%d\", &k) != 1) return 0;\n    int g = 0;\n    for (int i = 0; i < k; i++) {\n        scanf(\"%104s\", words[i]);\n        char key[105];\n        strcpy(key, words[i]);\n        int len = (int)strlen(key);\n        for (int a = 0; a < len; a++) for (int b = a + 1; b < len; b++) if (key[b] < key[a]) { char t = key[a]; key[a] = key[b]; key[b] = t; }\n        int j;\n        for (j = 0; j < g; j++) if (strcmp(keys[j], key) == 0) break;\n        if (j == g) { strcpy(keys[g], key); firstIdx[g] = i; g++; }\n        groupOf[i] = j;\n    }\n    for (int j = 0; j < g; j++) {\n        int first = 1;\n        for (int i = 0; i < k; i++) if (groupOf[i] == j) { if (!first) putchar(' '); fputs(words[i], stdout); first = 0; }\n        putchar('\\n');\n    }\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <string>\n#include <vector>\n#include <algorithm>\n#include <unordered_map>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int k; cin >> k;\n    vector<string> order;\n    unordered_map<string, vector<string>> groups;\n    for (int i = 0; i < k; i++) {\n        string w; cin >> w;\n        string key = w;\n        sort(key.begin(), key.end());\n        if (!groups.count(key)) order.push_back(key);\n        groups[key].push_back(w);\n    }\n    for (auto &key : order) {\n        auto &g = groups[key];\n        for (size_t i = 0; i < g.size(); i++) { if (i) cout << ' '; cout << g[i]; }\n        cout << \"\\n\";\n    }\n    return 0;\n}\n","javascript":"const lines = require('fs').readFileSync(0, 'utf8').split('\\n');\nconst k = Number(lines[0]);\nconst order = [];\nconst groups = new Map();\nfor (let i = 1; i <= k; i++) {\n    const w = (lines[i] || '').replace(/\\r$/, '');\n    const key = w.split('').sort().join('');\n    if (!groups.has(key)) { groups.set(key, []); order.push(key); }\n    groups.get(key).push(w);\n}\nconsole.log(order.map((key) => groups.get(key).join(' ')).join('\\n'));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\nabc","expected":"abc","hidden":true},{"input":"3\nab\nba\nab","expected":"ab ba ab","hidden":true},{"input":"4\ndog\ncat\ngod\ntac","expected":"dog god\ncat tac","hidden":true},{"input":"3\nx\ny\nz","expected":"x\ny\nz","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 51
)
on conflict (id) do nothing;

-- 52. Common Elements in Three Arrays  [Easy]  /practice/problems/common-elements-in-three-arrays
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-hashing-52', 'dt-practice-hashing', null,
  $px$Common Elements in Three Arrays$px$, $px$common-elements-in-three-arrays$px$, $px$Easy$px$,
  $px$Given three sorted arrays, find the values that occur in all three.

**Input Format**

The input contains three arrays, each given as its length on one line followed by that many space-separated integers on the next line: `N`, array A, `M`, array B, `P`, array C. Each array is sorted in non-decreasing order.

**Output Format**

Print the distinct common values in increasing order, separated by single spaces. If there are none, print an empty line.$px$,
  $px$[{"input":"6\n1 5 10 20 40 80\n5\n6 7 20 80 100\n7\n3 4 15 20 30 70 80","output":"20 80","explanation":"Only 20 and 80 occur in all three arrays."}]$px$::jsonb,
  $px$["1 <= N, M, P <= 100000","-1000000000 <= values <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    static StringTokenizer st;\n    static Set<Long> take() {\n        int m = Integer.parseInt(st.nextToken());\n        Set<Long> r = new HashSet<>();\n        for (int i = 0; i < m; i++) r.add(Long.parseLong(st.nextToken()));\n        return r;\n    }\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        st = new StringTokenizer(all.toString());\n        Set<Long> a = take(), b = take(), c = take();\n        TreeSet<Long> res = new TreeSet<>();\n        for (long x : a) if (b.contains(x) && c.contains(x)) res.add(x);\n        StringBuilder sb = new StringBuilder();\n        boolean first = true;\n        for (long x : res) { if (!first) sb.append(' '); sb.append(x); first = false; }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\ni = 0\ndef take():\n    global i\n    m = int(d[i]); i += 1\n    r = set(map(int, d[i:i+m])); i += m\n    return r\na = take(); b = take(); c = take()\nprint(' '.join(map(str, sorted(a & b & c))))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint cmp(const void *p, const void *q) { long long a = *(const long long*)p, b = *(const long long*)q; return (a > b) - (a < b); }\nstatic long long* take(int *outN) {\n    int m; scanf(\"%d\", &m);\n    long long *a = malloc(sizeof(long long) * m);\n    for (int i = 0; i < m; i++) scanf(\"%lld\", &a[i]);\n    qsort(a, m, sizeof(long long), cmp);\n    *outN = m;\n    return a;\n}\nint main(void) {\n    int n, mm, pp;\n    long long *a = take(&n), *b = take(&mm), *c = take(&pp);\n    int i = 0, j = 0, k = 0, first = 1;\n    long long last = 0; int has = 0;\n    while (i < n && j < mm && k < pp) {\n        if (a[i] == b[j] && b[j] == c[k]) {\n            if (!has || last != a[i]) { if (!first) putchar(' '); printf(\"%lld\", a[i]); first = 0; last = a[i]; has = 1; }\n            i++; j++; k++;\n        } else if (a[i] <= b[j] && a[i] <= c[k]) i++;\n        else if (b[j] <= a[i] && b[j] <= c[k]) j++;\n        else k++;\n    }\n    putchar('\\n');\n    free(a); free(b); free(c);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <set>\nusing namespace std;\nset<long long> take() {\n    int m; cin >> m;\n    set<long long> r;\n    for (int i = 0; i < m; i++) { long long x; cin >> x; r.insert(x); }\n    return r;\n}\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    set<long long> a = take(), b = take(), c = take();\n    bool first = true;\n    for (long long x : a) if (b.count(x) && c.count(x)) { if (!first) cout << ' '; cout << x; first = false; }\n    cout << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nlet i = 0;\nfunction take() {\n    const m = d[i++];\n    const r = new Set(d.slice(i, i + m));\n    i += m;\n    return r;\n}\nconst a = take(), b = take(), c = take();\nconst res = [...a].filter((x) => b.has(x) && c.has(x)).sort((x, y) => x - y);\nconsole.log(res.join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"3\n1 2 3\n3\n4 5 6\n3\n7 8 9","expected":"","hidden":true},{"input":"2\n5 5\n2\n5 5\n3\n5 5 5","expected":"5","hidden":true},{"input":"3\n1 2 3\n3\n2 3 4\n3\n3 4 5","expected":"3","hidden":true},{"input":"4\n-2 -1 0 1\n3\n-1 0 1\n2\n0 1","expected":"0 1","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 52
)
on conflict (id) do nothing;

-- 53. Elements Appearing More Than N/K Times  [Medium]  /practice/problems/elements-more-than-n-over-k
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-hashing-53', 'dt-practice-hashing', null,
  $px$Elements Appearing More Than N/K Times$px$, $px$elements-more-than-n-over-k$px$, $px$Medium$px$,
  $px$Given an array of `N` elements and an integer `K`, find every value that occurs more than `N / K` times (integer division).

**Input Format**

The first line contains two integers `N` and `K`.
The second line contains `N` space-separated integers.

**Output Format**

Print the qualifying values in increasing order, separated by single spaces. If there are none, print an empty line.$px$,
  $px$[{"input":"6 3\n1 1 1 2 2 3","output":"1","explanation":"N/K = 2. Only 1 appears more than 2 times."}]$px$::jsonb,
  $px$["1 <= N <= 100000","2 <= K <= 100000","-1000000000 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        int k = Integer.parseInt(st.nextToken());\n        int thr = n / k;\n        HashMap<Long, Integer> c = new HashMap<>();\n        for (int i = 0; i < n; i++) c.merge(Long.parseLong(st.nextToken()), 1, Integer::sum);\n        TreeSet<Long> res = new TreeSet<>();\n        for (Map.Entry<Long, Integer> e : c.entrySet()) if (e.getValue() > thr) res.add(e.getKey());\n        StringBuilder sb = new StringBuilder();\n        boolean first = true;\n        for (long x : res) { if (!first) sb.append(' '); sb.append(x); first = false; }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nfrom collections import Counter\nd = sys.stdin.read().split()\nn, k = int(d[0]), int(d[1])\nthr = n // k\nc = Counter(map(int, d[2:2+n]))\nprint(' '.join(str(v) for v in sorted(v for v, cnt in c.items() if cnt > thr)))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint cmp(const void *p, const void *q) { long long a = *(const long long*)p, b = *(const long long*)q; return (a > b) - (a < b); }\nint main(void) {\n    int n, k;\n    if (scanf(\"%d %d\", &n, &k) != 2) return 0;\n    int thr = n / k;\n    long long *a = malloc(sizeof(long long) * n);\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    qsort(a, n, sizeof(long long), cmp);\n    int first = 1;\n    for (int i = 0; i < n; ) {\n        int j = i;\n        while (j < n && a[j] == a[i]) j++;\n        if (j - i > thr) { if (!first) putchar(' '); printf(\"%lld\", a[i]); first = 0; }\n        i = j;\n    }\n    putchar('\\n');\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <map>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n, k; cin >> n >> k;\n    int thr = n / k;\n    map<long long, int> c;\n    for (int i = 0; i < n; i++) { long long x; cin >> x; c[x]++; }\n    bool first = true;\n    for (auto &e : c) if (e.second > thr) { if (!first) cout << ' '; cout << e.first; first = false; }\n    cout << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], k = d[1];\nconst thr = Math.floor(n / k);\nconst c = new Map();\nfor (let i = 2; i < 2 + n; i++) c.set(d[i], (c.get(d[i]) || 0) + 1);\nconst res = [...c.entries()].filter(([, v]) => v > thr).map(([x]) => x).sort((x, y) => x - y);\nconsole.log(res.join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"5 2\n1 1 1 2 2","expected":"1","hidden":true},{"input":"4 2\n1 1 2 2","expected":"","hidden":true},{"input":"6 2\n1 2 3 4 5 6","expected":"","hidden":true},{"input":"7 3\n5 5 5 1 1 1 9","expected":"1 5","hidden":true},{"input":"9 3\n2 2 2 2 7 7 7 7 1","expected":"2 7","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 53
)
on conflict (id) do nothing;

-- 54. Pair with Given Difference  [Easy]  /practice/problems/pair-with-given-difference
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-hashing-54', 'dt-practice-hashing', null,
  $px$Pair with Given Difference$px$, $px$pair-with-given-difference$px$, $px$Easy$px$,
  $px$Given an array and an integer `D`, determine whether two elements at **different positions** have an absolute difference of exactly `D`.

**Input Format**

The first line contains two integers `N` and `D`.
The second line contains `N` space-separated integers.

**Output Format**

Print `1` if such a pair exists, otherwise print `0`.$px$,
  $px$[{"input":"6 78\n5 20 3 2 50 80","output":"1","explanation":"80 - 2 = 78."}]$px$::jsonb,
  $px$["2 <= N <= 100000","0 <= D <= 2000000000","-1000000000 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long D = Long.parseLong(st.nextToken());\n        HashSet<Long> seen = new HashSet<>();\n        int ans = 0;\n        for (int i = 0; i < n; i++) {\n            long x = Long.parseLong(st.nextToken());\n            if (seen.contains(x - D) || seen.contains(x + D)) { ans = 1; break; }\n            seen.add(x);\n        }\n        System.out.println(ans);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn, D = int(d[0]), int(d[1])\na = list(map(int, d[2:2+n]))\nseen = set()\nans = 0\nfor x in a:\n    if (x - D) in seen or (x + D) in seen:\n        ans = 1\n        break\n    seen.add(x)\nprint(ans)\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint cmp(const void *p, const void *q) { long long a = *(const long long*)p, b = *(const long long*)q; return (a > b) - (a < b); }\nint main(void) {\n    long long n, D;\n    if (scanf(\"%lld %lld\", &n, &D) != 2) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    for (long long i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    qsort(a, n, sizeof(long long), cmp);\n    long long i = 0, j = 1;\n    int ans = 0;\n    while (i < n && j < n) {\n        if (i != j && a[j] - a[i] == D) { ans = 1; break; }\n        else if (i == j || a[j] - a[i] < D) j++;\n        else i++;\n    }\n    printf(\"%d\\n\", ans);\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <unordered_set>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    long long n, D; cin >> n >> D;\n    unordered_set<long long> seen;\n    int ans = 0;\n    for (long long i = 0; i < n; i++) {\n        long long x; cin >> x;\n        if (seen.count(x - D) || seen.count(x + D)) { ans = 1; }\n        seen.insert(x);\n    }\n    cout << ans << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], D = d[1];\nconst seen = new Set();\nlet ans = 0;\nfor (let i = 2; i < 2 + n; i++) {\n    if (seen.has(d[i] - D) || seen.has(d[i] + D)) { ans = 1; break; }\n    seen.add(d[i]);\n}\nconsole.log(ans);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"2 0\n5 5","expected":"1","hidden":true},{"input":"2 0\n5 6","expected":"0","hidden":true},{"input":"4 3\n1 2 3 4","expected":"1","hidden":true},{"input":"3 100\n1 2 3","expected":"0","hidden":true},{"input":"5 0\n1 2 3 4 5","expected":"0","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 54
)
on conflict (id) do nothing;

-- 55. Subarray with Equal 0s and 1s  [Medium]  /practice/problems/subarray-with-equal-zeros-and-ones
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-hashing-55', 'dt-practice-hashing', null,
  $px$Subarray with Equal 0s and 1s$px$, $px$subarray-with-equal-zeros-and-ones$px$, $px$Medium$px$,
  $px$Given a binary array containing only `0` and `1`, find the length of the longest contiguous subarray with an equal number of zeros and ones.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers, each `0` or `1`.

**Output Format**

Print the maximum length, or `0` if no such subarray exists.$px$,
  $px$[{"input":"6\n0 0 1 0 1 1","output":"6","explanation":"The whole array has 3 zeros and 3 ones, so the longest balanced subarray has length 6."}]$px$::jsonb,
  $px$["1 <= N <= 100000","A[i] is 0 or 1"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        HashMap<Integer, Integer> first = new HashMap<>();\n        first.put(0, -1);\n        int s = 0, best = 0;\n        for (int i = 0; i < n; i++) {\n            s += Integer.parseInt(st.nextToken()) == 1 ? 1 : -1;\n            Integer j = first.get(s);\n            if (j != null) best = Math.max(best, i - j);\n            else first.put(s, i);\n        }\n        System.out.println(best);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\nfirst = {0: -1}\ns = 0\nbest = 0\nfor i, x in enumerate(map(int, d[1:1+n])):\n    s += 1 if x == 1 else -1\n    if s in first:\n        best = max(best, i - first[s])\n    else:\n        first[s] = i\nprint(best)\n","c":"#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    int *first = malloc(sizeof(int) * (2 * n + 1));\n    for (int i = 0; i <= 2 * n; i++) first[i] = -2;\n    int base = n;\n    first[base] = -1;\n    int s = 0, best = 0;\n    for (int i = 0; i < n; i++) {\n        int x; scanf(\"%d\", &x);\n        s += x == 1 ? 1 : -1;\n        int idx = base + s;\n        if (first[idx] != -2) { int len = i - first[idx]; if (len > best) best = len; }\n        else first[idx] = i;\n    }\n    printf(\"%d\\n\", best);\n    free(first);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <unordered_map>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    unordered_map<int, int> first;\n    first[0] = -1;\n    int s = 0, best = 0;\n    for (int i = 0; i < n; i++) {\n        int x; cin >> x;\n        s += x == 1 ? 1 : -1;\n        auto it = first.find(s);\n        if (it != first.end()) best = max(best, i - it->second);\n        else first[s] = i;\n    }\n    cout << best << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst first = new Map([[0, -1]]);\nlet s = 0, best = 0;\nfor (let i = 0; i < n; i++) {\n    s += d[1 + i] === 1 ? 1 : -1;\n    if (first.has(s)) best = Math.max(best, i - first.get(s));\n    else first.set(s, i);\n}\nconsole.log(best);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n0","expected":"0","hidden":true},{"input":"2\n0 1","expected":"2","hidden":true},{"input":"4\n1 1 1 1","expected":"0","hidden":true},{"input":"6\n0 0 1 1 0 0","expected":"4","hidden":true},{"input":"8\n1 0 1 0 1 0 1 0","expected":"8","hidden":true},{"input":"7\n0 1 0 1 1 1 0","expected":"4","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 55
)
on conflict (id) do nothing;

-- ===========================================================================
-- 3. VALIDATION  (raises, never silently passes)
-- ===========================================================================
do $val$
declare
  v_cat_id text := 'dt-practice-hashing';
  v_n int;
begin
  if not exists (select 1 from public.dsa_topics where id = v_cat_id and kind = 'practice') then
    raise exception '0076/048: category % missing', v_cat_id;
  end if;
  select count(*) into v_n from public.dsa_problems
   where topic_id = v_cat_id and learning_topic_id is null and coalesce(status,'published') = 'published';
  if v_n < 10 then
    raise exception '0076/048: expected >= 10 Hashing practice problems, found %', v_n;
  end if;
  raise notice '0076/048 OK: % Hashing practice problems present.', v_n;
end
$val$;

notify pgrst, 'reload schema';
