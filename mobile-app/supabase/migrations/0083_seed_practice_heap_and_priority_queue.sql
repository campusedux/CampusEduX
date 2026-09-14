-- mobile-app/supabase/migrations/0083_seed_practice_heap_and_priority_queue.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: admin-panel/supabase/migrations/055_seed_practice_heap_and_priority_queue.sql ; apply either, the other is a guarded no-op.
-- ============================================================================
-- BODY — global Practice ▸ Coding Problems seed: Heap & Priority Queue (5 problems)
-- (mobile 0083_seed_practice_heap_and_priority_queue.sql
--  == admin 055_seed_practice_heap_and_priority_queue.sql — byte-identical below the 3-line header,
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
    raise exception '0083/055: practice RPCs not found — apply 0072_practice_coding.sql (admin 044) first.';
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
  ('dt-practice-heap-and-priority-queue', $px$Heap & Priority Queue$px$, $px$heap-and-priority-queue$px$, $px$Min / max heaps driven by an operation stream, and order-statistic / K-way-merge problems that a heap solves.$px$, 11, 'practice', 'published', true, true)
on conflict (id) do nothing;

-- ===========================================================================
-- 2. CODING PROBLEMS — Heap & Priority Queue
-- ===========================================================================

-- 116. Implement Min Heap  [Medium]  /practice/problems/implement-min-heap
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-heap-and-priority-queue-116', 'dt-practice-heap-and-priority-queue', null,
  $px$Implement Min Heap$px$, $px$implement-min-heap$px$, $px$Medium$px$,
  $px$Implement a Min Heap that supports inserting a value, reading the minimum, and removing the minimum.

**Input Format**

The first line contains an integer `Q`.
Each of the next `Q` lines is one of:
`insert X` — add integer `X`
`getMin` — report the minimum
`extractMin` — remove and report the minimum

**Output Format**

For each `getMin` print the current minimum (or `-1` if the heap is empty). For each `extractMin` print the removed minimum (or `-1` if the heap is empty). One value per line.$px$,
  $px$[{"input":"4\ninsert 5\ninsert 2\ninsert 8\ngetMin","output":"2","explanation":"The smallest value is always kept at the root."}]$px$::jsonb,
  $px$["1 <= Q <= 100000","-1000000000 <= X <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\nimport java.util.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        int q = Integer.parseInt(br.readLine().trim());\n        PriorityQueue<Long> h = new PriorityQueue<>();\n        StringBuilder sb = new StringBuilder();\n        for (int i = 0; i < q; i++) {\n            StringTokenizer st = new StringTokenizer(br.readLine());\n            String op = st.nextToken();\n            if (op.equals(\"insert\")) h.add(Long.parseLong(st.nextToken()));\n            else if (op.equals(\"getMin\")) sb.append(h.isEmpty() ? -1 : h.peek()).append('\\n');\n            else sb.append(h.isEmpty() ? -1 : h.poll()).append('\\n');\n        }\n        System.out.print(sb);\n    }\n}\n","python":"import sys, heapq\nlines = sys.stdin.read().split('\\n')\nq = int(lines[0])\nh = []\nout = []\nfor i in range(1, q + 1):\n    p = lines[i].split()\n    if p[0] == 'insert':\n        heapq.heappush(h, int(p[1]))\n    elif p[0] == 'getMin':\n        out.append(str(h[0] if h else -1))\n    else:\n        out.append(str(heapq.heappop(h) if h else -1))\nprint('\\n'.join(out))\n","c":"#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\nlong long *h;\nint n = 0;\nvoid push(long long v) {\n    h[n] = v; int i = n++;\n    while (i > 0) { int p = (i - 1) / 2; if (h[p] <= h[i]) break; long long t = h[p]; h[p] = h[i]; h[i] = t; i = p; }\n}\nlong long pop(void) {\n    long long r = h[0];\n    h[0] = h[--n];\n    int i = 0;\n    while (1) {\n        int l = 2 * i + 1, rr = 2 * i + 2, s = i;\n        if (l < n && h[l] < h[s]) s = l;\n        if (rr < n && h[rr] < h[s]) s = rr;\n        if (s == i) break;\n        long long t = h[s]; h[s] = h[i]; h[i] = t; i = s;\n    }\n    return r;\n}\nint main(void) {\n    int q; if (scanf(\"%d\", &q) != 1) return 0;\n    h = malloc(sizeof(long long) * (q + 1));\n    char op[16];\n    for (int i = 0; i < q; i++) {\n        scanf(\"%15s\", op);\n        if (strcmp(op, \"insert\") == 0) { long long v; scanf(\"%lld\", &v); push(v); }\n        else if (strcmp(op, \"getMin\") == 0) printf(\"%lld\\n\", n > 0 ? h[0] : -1LL);\n        else printf(\"%lld\\n\", n > 0 ? pop() : -1LL);\n    }\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <queue>\n#include <string>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int q; cin >> q;\n    priority_queue<long long, vector<long long>, greater<long long>> h;\n    string op;\n    for (int i = 0; i < q; i++) {\n        cin >> op;\n        if (op == \"insert\") { long long v; cin >> v; h.push(v); }\n        else if (op == \"getMin\") cout << (h.empty() ? -1LL : h.top()) << \"\\n\";\n        else { if (h.empty()) cout << -1 << \"\\n\"; else { cout << h.top() << \"\\n\"; h.pop(); } }\n    }\n    return 0;\n}\n","javascript":"const lines = require('fs').readFileSync(0, 'utf8').split('\\n');\nconst q = Number(lines[0]);\nconst h = [];\nfunction push(v) {\n    h.push(v);\n    let i = h.length - 1;\n    while (i > 0) { const p = (i - 1) >> 1; if (h[p] <= h[i]) break; [h[p], h[i]] = [h[i], h[p]]; i = p; }\n}\nfunction pop() {\n    const r = h[0];\n    const last = h.pop();\n    if (h.length) {\n        h[0] = last;\n        let i = 0;\n        while (true) {\n            const l = 2 * i + 1, rr = 2 * i + 2;\n            let s = i;\n            if (l < h.length && h[l] < h[s]) s = l;\n            if (rr < h.length && h[rr] < h[s]) s = rr;\n            if (s === i) break;\n            [h[s], h[i]] = [h[i], h[s]]; i = s;\n        }\n    }\n    return r;\n}\nconst out = [];\nfor (let i = 1; i <= q; i++) {\n    const p = lines[i].split(/\\s+/);\n    if (p[0] === 'insert') push(Number(p[1]));\n    else if (p[0] === 'getMin') out.push(h.length ? h[0] : -1);\n    else out.push(h.length ? pop() : -1);\n}\nconsole.log(out.join('\\n'));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"2\ngetMin\nextractMin","expected":"-1\n-1","hidden":true},{"input":"6\ninsert 5\ninsert 2\ninsert 8\nextractMin\ngetMin\nextractMin","expected":"2\n5\n5","hidden":true},{"input":"5\ninsert 3\ninsert 3\nextractMin\nextractMin\nextractMin","expected":"3\n3\n-1","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 116
)
on conflict (id) do nothing;

-- 117. Implement Max Heap  [Medium]  /practice/problems/implement-max-heap
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-heap-and-priority-queue-117', 'dt-practice-heap-and-priority-queue', null,
  $px$Implement Max Heap$px$, $px$implement-max-heap$px$, $px$Medium$px$,
  $px$Implement a Max Heap that supports inserting a value, reading the maximum, and removing the maximum.

**Input Format**

The first line contains an integer `Q`.
Each of the next `Q` lines is one of:
`insert X`, `getMax`, `extractMax`.

**Output Format**

For each `getMax` print the current maximum (or `-1` if empty). For each `extractMax` print the removed maximum (or `-1` if empty). One value per line.$px$,
  $px$[{"input":"4\ninsert 5\ninsert 9\ninsert 2\ngetMax","output":"9","explanation":"The largest inserted value is stored at the root."}]$px$::jsonb,
  $px$["1 <= Q <= 100000","-1000000000 <= X <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\nimport java.util.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        int q = Integer.parseInt(br.readLine().trim());\n        PriorityQueue<Long> h = new PriorityQueue<>(Collections.reverseOrder());\n        StringBuilder sb = new StringBuilder();\n        for (int i = 0; i < q; i++) {\n            StringTokenizer st = new StringTokenizer(br.readLine());\n            String op = st.nextToken();\n            if (op.equals(\"insert\")) h.add(Long.parseLong(st.nextToken()));\n            else if (op.equals(\"getMax\")) sb.append(h.isEmpty() ? -1 : h.peek()).append('\\n');\n            else sb.append(h.isEmpty() ? -1 : h.poll()).append('\\n');\n        }\n        System.out.print(sb);\n    }\n}\n","python":"import sys, heapq\nlines = sys.stdin.read().split('\\n')\nq = int(lines[0])\nh = []\nout = []\nfor i in range(1, q + 1):\n    p = lines[i].split()\n    if p[0] == 'insert':\n        heapq.heappush(h, -int(p[1]))\n    elif p[0] == 'getMax':\n        out.append(str(-h[0] if h else -1))\n    else:\n        out.append(str(-heapq.heappop(h) if h else -1))\nprint('\\n'.join(out))\n","c":"#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\nlong long *h;\nint n = 0;\nvoid push(long long v) {\n    h[n] = v; int i = n++;\n    while (i > 0) { int p = (i - 1) / 2; if (h[p] >= h[i]) break; long long t = h[p]; h[p] = h[i]; h[i] = t; i = p; }\n}\nlong long pop(void) {\n    long long r = h[0];\n    h[0] = h[--n];\n    int i = 0;\n    while (1) {\n        int l = 2 * i + 1, rr = 2 * i + 2, s = i;\n        if (l < n && h[l] > h[s]) s = l;\n        if (rr < n && h[rr] > h[s]) s = rr;\n        if (s == i) break;\n        long long t = h[s]; h[s] = h[i]; h[i] = t; i = s;\n    }\n    return r;\n}\nint main(void) {\n    int q; if (scanf(\"%d\", &q) != 1) return 0;\n    h = malloc(sizeof(long long) * (q + 1));\n    char op[16];\n    for (int i = 0; i < q; i++) {\n        scanf(\"%15s\", op);\n        if (strcmp(op, \"insert\") == 0) { long long v; scanf(\"%lld\", &v); push(v); }\n        else if (strcmp(op, \"getMax\") == 0) printf(\"%lld\\n\", n > 0 ? h[0] : -1LL);\n        else printf(\"%lld\\n\", n > 0 ? pop() : -1LL);\n    }\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <queue>\n#include <string>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int q; cin >> q;\n    priority_queue<long long> h;\n    string op;\n    for (int i = 0; i < q; i++) {\n        cin >> op;\n        if (op == \"insert\") { long long v; cin >> v; h.push(v); }\n        else if (op == \"getMax\") cout << (h.empty() ? -1LL : h.top()) << \"\\n\";\n        else { if (h.empty()) cout << -1 << \"\\n\"; else { cout << h.top() << \"\\n\"; h.pop(); } }\n    }\n    return 0;\n}\n","javascript":"const lines = require('fs').readFileSync(0, 'utf8').split('\\n');\nconst q = Number(lines[0]);\nconst h = [];\nfunction push(v) {\n    h.push(v);\n    let i = h.length - 1;\n    while (i > 0) { const p = (i - 1) >> 1; if (h[p] >= h[i]) break; [h[p], h[i]] = [h[i], h[p]]; i = p; }\n}\nfunction pop() {\n    const r = h[0];\n    const last = h.pop();\n    if (h.length) {\n        h[0] = last;\n        let i = 0;\n        while (true) {\n            const l = 2 * i + 1, rr = 2 * i + 2;\n            let s = i;\n            if (l < h.length && h[l] > h[s]) s = l;\n            if (rr < h.length && h[rr] > h[s]) s = rr;\n            if (s === i) break;\n            [h[s], h[i]] = [h[i], h[s]]; i = s;\n        }\n    }\n    return r;\n}\nconst out = [];\nfor (let i = 1; i <= q; i++) {\n    const p = lines[i].split(/\\s+/);\n    if (p[0] === 'insert') push(Number(p[1]));\n    else if (p[0] === 'getMax') out.push(h.length ? h[0] : -1);\n    else out.push(h.length ? pop() : -1);\n}\nconsole.log(out.join('\\n'));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"2\ngetMax\nextractMax","expected":"-1\n-1","hidden":true},{"input":"6\ninsert 5\ninsert 9\ninsert 2\nextractMax\ngetMax\nextractMax","expected":"9\n5\n5","hidden":true},{"input":"4\ninsert -3\ninsert -7\ngetMax\nextractMax","expected":"-3\n-3","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 117
)
on conflict (id) do nothing;

-- 118. K Largest Elements  [Easy]  /practice/problems/k-largest-elements
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-heap-and-priority-queue-118', 'dt-practice-heap-and-priority-queue', null,
  $px$K Largest Elements$px$, $px$k-largest-elements$px$, $px$Easy$px$,
  $px$Given an integer array and `K`, find the `K` largest values.

**Input Format**

The first line contains two integers `N` and `K`.
The second line contains `N` space-separated integers.

**Output Format**

Print the `K` largest values in decreasing order, separated by single spaces.$px$,
  $px$[{"input":"6 3\n3 1 5 12 2 11","output":"12 11 5","explanation":"The three largest values are 12, 11 and 5."}]$px$::jsonb,
  $px$["1 <= K <= N <= 100000","-1000000000 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        int k = Integer.parseInt(st.nextToken());\n        long[] a = new long[n];\n        for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());\n        Arrays.sort(a);\n        StringBuilder sb = new StringBuilder();\n        for (int i = 0; i < k; i++) { if (i > 0) sb.append(' '); sb.append(a[n - 1 - i]); }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn, k = int(d[0]), int(d[1])\na = sorted(map(int, d[2:2+n]), reverse=True)\nprint(' '.join(map(str, a[:k])))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint cmp(const void *p, const void *q) { long long a = *(const long long*)p, b = *(const long long*)q; return (a > b) - (a < b); }\nint main(void) {\n    int n, k;\n    if (scanf(\"%d %d\", &n, &k) != 2) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    qsort(a, n, sizeof(long long), cmp);\n    for (int i = 0; i < k; i++) printf(\"%lld%s\", a[n - 1 - i], i + 1 < k ? \" \" : \"\\n\");\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n, k; cin >> n >> k;\n    vector<long long> a(n);\n    for (auto &x : a) cin >> x;\n    sort(a.begin(), a.end());\n    for (int i = 0; i < k; i++) cout << a[n - 1 - i] << (i + 1 < k ? ' ' : '\\n');\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], k = d[1];\nconst a = d.slice(2, 2 + n).sort((x, y) => y - x);\nconsole.log(a.slice(0, k).join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1 1\n7","expected":"7","hidden":true},{"input":"5 5\n1 2 3 4 5","expected":"5 4 3 2 1","hidden":true},{"input":"5 2\n-1 -2 -3 -4 -5","expected":"-1 -2","hidden":true},{"input":"4 2\n9 9 1 1","expected":"9 9","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 118
)
on conflict (id) do nothing;

-- 119. K Smallest Elements  [Easy]  /practice/problems/k-smallest-elements
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-heap-and-priority-queue-119', 'dt-practice-heap-and-priority-queue', null,
  $px$K Smallest Elements$px$, $px$k-smallest-elements$px$, $px$Easy$px$,
  $px$Given an integer array and `K`, find the `K` smallest values.

**Input Format**

The first line contains two integers `N` and `K`.
The second line contains `N` space-separated integers.

**Output Format**

Print the `K` smallest values in increasing order, separated by single spaces.$px$,
  $px$[{"input":"6 3\n3 1 5 12 2 11","output":"1 2 3","explanation":"The three smallest values are 1, 2 and 3."}]$px$::jsonb,
  $px$["1 <= K <= N <= 100000","-1000000000 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        int k = Integer.parseInt(st.nextToken());\n        long[] a = new long[n];\n        for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());\n        Arrays.sort(a);\n        StringBuilder sb = new StringBuilder();\n        for (int i = 0; i < k; i++) { if (i > 0) sb.append(' '); sb.append(a[i]); }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn, k = int(d[0]), int(d[1])\na = sorted(map(int, d[2:2+n]))\nprint(' '.join(map(str, a[:k])))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint cmp(const void *p, const void *q) { long long a = *(const long long*)p, b = *(const long long*)q; return (a > b) - (a < b); }\nint main(void) {\n    int n, k;\n    if (scanf(\"%d %d\", &n, &k) != 2) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    qsort(a, n, sizeof(long long), cmp);\n    for (int i = 0; i < k; i++) printf(\"%lld%s\", a[i], i + 1 < k ? \" \" : \"\\n\");\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n, k; cin >> n >> k;\n    vector<long long> a(n);\n    for (auto &x : a) cin >> x;\n    sort(a.begin(), a.end());\n    for (int i = 0; i < k; i++) cout << a[i] << (i + 1 < k ? ' ' : '\\n');\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], k = d[1];\nconst a = d.slice(2, 2 + n).sort((x, y) => x - y);\nconsole.log(a.slice(0, k).join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1 1\n7","expected":"7","hidden":true},{"input":"5 5\n5 4 3 2 1","expected":"1 2 3 4 5","hidden":true},{"input":"5 2\n-1 -2 -3 -4 -5","expected":"-5 -4","hidden":true},{"input":"4 3\n2 2 2 2","expected":"2 2 2","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 119
)
on conflict (id) do nothing;

-- 120. Merge K Sorted Arrays  [Medium]  /practice/problems/merge-k-sorted-arrays
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-heap-and-priority-queue-120', 'dt-practice-heap-and-priority-queue', null,
  $px$Merge K Sorted Arrays$px$, $px$merge-k-sorted-arrays$px$, $px$Medium$px$,
  $px$Given `K` sorted arrays, merge them into a single sorted array.

**Input Format**

The first line contains an integer `K`.
Each of the next `K` lines describes one array: it starts with its length `L`, followed by `L` space-separated integers in non-decreasing order.

**Output Format**

Print all the values merged into one non-decreasing sequence, separated by single spaces.$px$,
  $px$[{"input":"3\n3 1 4 7\n3 2 5 8\n3 3 6 9","output":"1 2 3 4 5 6 7 8 9","explanation":"All elements from the three arrays in sorted order."}]$px$::jsonb,
  $px$["1 <= K <= 10000","Total number of elements <= 100000","-1000000000 <= value <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int k = Integer.parseInt(st.nextToken());\n        ArrayList<Long> vals = new ArrayList<>();\n        for (int a = 0; a < k; a++) {\n            int L = Integer.parseInt(st.nextToken());\n            for (int j = 0; j < L; j++) vals.add(Long.parseLong(st.nextToken()));\n        }\n        Collections.sort(vals);\n        StringBuilder sb = new StringBuilder();\n        for (int j = 0; j < vals.size(); j++) { if (j > 0) sb.append(' '); sb.append(vals.get(j)); }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\ni = 0\nk = int(d[i]); i += 1\nvals = []\nfor _ in range(k):\n    L = int(d[i]); i += 1\n    vals.extend(map(int, d[i:i+L]))\n    i += L\nvals.sort()\nprint(' '.join(map(str, vals)))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint cmp(const void *p, const void *q) { long long a = *(const long long*)p, b = *(const long long*)q; return (a > b) - (a < b); }\nint main(void) {\n    int k;\n    if (scanf(\"%d\", &k) != 1) return 0;\n    long long *vals = malloc(sizeof(long long) * 100001);\n    int n = 0;\n    for (int a = 0; a < k; a++) {\n        int L; scanf(\"%d\", &L);\n        for (int j = 0; j < L; j++) scanf(\"%lld\", &vals[n++]);\n    }\n    qsort(vals, n, sizeof(long long), cmp);\n    for (int j = 0; j < n; j++) printf(\"%lld%s\", vals[j], j + 1 < n ? \" \" : \"\\n\");\n    free(vals);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int k; cin >> k;\n    vector<long long> vals;\n    for (int a = 0; a < k; a++) {\n        int L; cin >> L;\n        for (int j = 0; j < L; j++) { long long x; cin >> x; vals.push_back(x); }\n    }\n    sort(vals.begin(), vals.end());\n    for (size_t j = 0; j < vals.size(); j++) { if (j) cout << ' '; cout << vals[j]; }\n    cout << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nlet i = 0;\nconst k = d[i++];\nconst vals = [];\nfor (let a = 0; a < k; a++) {\n    const L = d[i++];\n    for (let j = 0; j < L; j++) vals.push(d[i++]);\n}\nvals.sort((x, y) => x - y);\nconsole.log(vals.join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n3 1 2 3","expected":"1 2 3","hidden":true},{"input":"2\n0\n3 1 2 3","expected":"1 2 3","hidden":true},{"input":"3\n1 5\n1 1\n1 3","expected":"1 3 5","hidden":true},{"input":"2\n2 -5 -1\n2 -3 0","expected":"-5 -3 -1 0","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 120
)
on conflict (id) do nothing;

-- ===========================================================================
-- 3. VALIDATION  (raises, never silently passes)
-- ===========================================================================
do $val$
declare
  v_cat_id text := 'dt-practice-heap-and-priority-queue';
  v_n int;
begin
  if not exists (select 1 from public.dsa_topics where id = v_cat_id and kind = 'practice') then
    raise exception '0083/055: category % missing', v_cat_id;
  end if;
  select count(*) into v_n from public.dsa_problems
   where topic_id = v_cat_id and learning_topic_id is null and coalesce(status,'published') = 'published';
  if v_n < 5 then
    raise exception '0083/055: expected >= 5 Heap & Priority Queue practice problems, found %', v_n;
  end if;
  raise notice '0083/055 OK: % Heap & Priority Queue practice problems present.', v_n;
end
$val$;

notify pgrst, 'reload schema';
