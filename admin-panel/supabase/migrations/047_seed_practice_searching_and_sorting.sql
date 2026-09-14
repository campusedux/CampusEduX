-- admin-panel/supabase/migrations/047_seed_practice_searching_and_sorting.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: mobile-app/supabase/migrations/0075_seed_practice_searching_and_sorting.sql ; apply either, the other is a guarded no-op.
-- ============================================================================
-- BODY — global Practice ▸ Coding Problems seed: Searching & Sorting (15 problems)
-- (mobile 0075_seed_practice_searching_and_sorting.sql
--  == admin 047_seed_practice_searching_and_sorting.sql — byte-identical below the 3-line header,
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
    raise exception '0075/047: practice RPCs not found — apply 0072_practice_coding.sql (admin 044) first.';
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
  ('dt-practice-searching-and-sorting', $px$Searching & Sorting$px$, $px$searching-and-sorting$px$, $px$Linear and binary search, the classic sorting algorithms, order statistics and interval merging.$px$, 3, 'practice', 'published', true, true)
on conflict (id) do nothing;

-- ===========================================================================
-- 2. CODING PROBLEMS — Searching & Sorting
-- ===========================================================================

-- 31. Linear Search  [Easy]  /practice/problems/linear-search
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-searching-and-sorting-31', 'dt-practice-searching-and-sorting', null,
  $px$Linear Search$px$, $px$linear-search$px$, $px$Easy$px$,
  $px$Given an array and a target value, find the first position where the target occurs.

**Input Format**

The first line contains two integers `N` and `target`.
The second line contains `N` space-separated integers.

**Output Format**

Print the zero-based index of the first occurrence of `target`, or `-1` if it is absent.$px$,
  $px$[{"input":"4 8\n5 8 2 8","output":"1","explanation":"The first 8 is at index 1."}]$px$::jsonb,
  $px$["1 <= N <= 100000","-1000000000 <= A[i], target <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long target = Long.parseLong(st.nextToken());\n        int ans = -1;\n        for (int i = 0; i < n; i++) {\n            long x = Long.parseLong(st.nextToken());\n            if (ans == -1 && x == target) ans = i;\n        }\n        System.out.println(ans);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn, target = int(d[0]), int(d[1])\nans = -1\nfor i in range(n):\n    if int(d[2 + i]) == target:\n        ans = i\n        break\nprint(ans)\n","c":"#include <stdio.h>\nint main(void) {\n    long long n, target;\n    if (scanf(\"%lld %lld\", &n, &target) != 2) return 0;\n    long long x;\n    int ans = -1;\n    for (long long i = 0; i < n; i++) { scanf(\"%lld\", &x); if (ans == -1 && x == target) ans = (int)i; }\n    printf(\"%d\\n\", ans);\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    long long n, target; cin >> n >> target;\n    long long x;\n    int ans = -1;\n    for (long long i = 0; i < n; i++) { cin >> x; if (ans == -1 && x == target) ans = (int)i; }\n    cout << ans << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], target = d[1];\nlet ans = -1;\nfor (let i = 0; i < n; i++) if (d[2 + i] === target) { ans = i; break; }\nconsole.log(ans);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1 5\n5","expected":"0","hidden":true},{"input":"1 9\n5","expected":"-1","hidden":true},{"input":"5 3\n1 2 4 5 6","expected":"-1","hidden":true},{"input":"5 -7\n1 -7 -7 2 -7","expected":"1","hidden":true},{"input":"6 6\n1 2 3 4 5 6","expected":"5","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 31
)
on conflict (id) do nothing;

-- 32. Binary Search  [Easy]  /practice/problems/binary-search
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-searching-and-sorting-32', 'dt-practice-searching-and-sorting', null,
  $px$Binary Search$px$, $px$binary-search$px$, $px$Easy$px$,
  $px$Given a sorted array of distinct integers and a target value, find the target using binary search.

**Input Format**

The first line contains two integers `N` and `target`.
The second line contains `N` space-separated integers in strictly increasing order.

**Output Format**

Print the index of `target`, or `-1` if it is not present.$px$,
  $px$[{"input":"5 7\n1 3 5 7 9","output":"3","explanation":"7 is located at index 3."}]$px$::jsonb,
  $px$["1 <= N <= 100000","The array is sorted and all elements are distinct.","-1000000000 <= A[i], target <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long target = Long.parseLong(st.nextToken());\n        long[] a = new long[n];\n        for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());\n        int lo = 0, hi = n - 1, ans = -1;\n        while (lo <= hi) {\n            int mid = (lo + hi) >>> 1;\n            if (a[mid] == target) { ans = mid; break; }\n            else if (a[mid] < target) lo = mid + 1;\n            else hi = mid - 1;\n        }\n        System.out.println(ans);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn, target = int(d[0]), int(d[1])\na = list(map(int, d[2:2+n]))\nlo, hi, ans = 0, n - 1, -1\nwhile lo <= hi:\n    mid = (lo + hi) // 2\n    if a[mid] == target:\n        ans = mid\n        break\n    elif a[mid] < target:\n        lo = mid + 1\n    else:\n        hi = mid - 1\nprint(ans)\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    long long n, target;\n    if (scanf(\"%lld %lld\", &n, &target) != 2) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    for (long long i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    long long lo = 0, hi = n - 1;\n    int ans = -1;\n    while (lo <= hi) {\n        long long mid = (lo + hi) / 2;\n        if (a[mid] == target) { ans = (int)mid; break; }\n        else if (a[mid] < target) lo = mid + 1;\n        else hi = mid - 1;\n    }\n    printf(\"%d\\n\", ans);\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    long long n, target; cin >> n >> target;\n    vector<long long> a(n);\n    for (auto &x : a) cin >> x;\n    long long lo = 0, hi = n - 1;\n    int ans = -1;\n    while (lo <= hi) {\n        long long mid = (lo + hi) / 2;\n        if (a[mid] == target) { ans = (int)mid; break; }\n        else if (a[mid] < target) lo = mid + 1;\n        else hi = mid - 1;\n    }\n    cout << ans << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], target = d[1];\nconst a = d.slice(2, 2 + n);\nlet lo = 0, hi = n - 1, ans = -1;\nwhile (lo <= hi) {\n    const mid = (lo + hi) >> 1;\n    if (a[mid] === target) { ans = mid; break; }\n    else if (a[mid] < target) lo = mid + 1;\n    else hi = mid - 1;\n}\nconsole.log(ans);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1 1\n1","expected":"0","hidden":true},{"input":"1 2\n1","expected":"-1","hidden":true},{"input":"6 11\n2 4 6 8 10 12","expected":"-1","hidden":true},{"input":"6 2\n2 4 6 8 10 12","expected":"0","hidden":true},{"input":"6 12\n2 4 6 8 10 12","expected":"5","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 32
)
on conflict (id) do nothing;

-- 33. First Occurrence in Sorted Array  [Easy]  /practice/problems/first-occurrence-in-sorted-array
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-searching-and-sorting-33', 'dt-practice-searching-and-sorting', null,
  $px$First Occurrence in Sorted Array$px$, $px$first-occurrence-in-sorted-array$px$, $px$Easy$px$,
  $px$Given a sorted array that may contain duplicate values, find the first index at which a target value appears.

**Input Format**

The first line contains two integers `N` and `target`.
The second line contains `N` space-separated integers in non-decreasing order.

**Output Format**

Print the first index of `target`, or `-1` if it does not exist.$px$,
  $px$[{"input":"5 2\n1 2 2 2 5","output":"1","explanation":"2 first appears at index 1."}]$px$::jsonb,
  $px$["1 <= N <= 100000","The array is sorted in non-decreasing order.","-1000000000 <= A[i], target <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long target = Long.parseLong(st.nextToken());\n        long[] a = new long[n];\n        for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());\n        int lo = 0, hi = n - 1, res = -1;\n        while (lo <= hi) {\n            int mid = (lo + hi) >>> 1;\n            if (a[mid] >= target) hi = mid - 1; else lo = mid + 1;\n            if (a[mid] == target) res = mid;\n        }\n        System.out.println(res);\n    }\n}\n","python":"import sys\nimport bisect\nd = sys.stdin.read().split()\nn, target = int(d[0]), int(d[1])\na = list(map(int, d[2:2+n]))\ni = bisect.bisect_left(a, target)\nprint(i if i < n and a[i] == target else -1)\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    long long n, target;\n    if (scanf(\"%lld %lld\", &n, &target) != 2) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    for (long long i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    long long lo = 0, hi = n - 1;\n    int res = -1;\n    while (lo <= hi) {\n        long long mid = (lo + hi) / 2;\n        if (a[mid] == target) res = (int)mid;\n        if (a[mid] >= target) hi = mid - 1; else lo = mid + 1;\n    }\n    printf(\"%d\\n\", res);\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    long long n, target; cin >> n >> target;\n    vector<long long> a(n);\n    for (auto &x : a) cin >> x;\n    auto it = lower_bound(a.begin(), a.end(), target);\n    if (it != a.end() && *it == target) cout << (it - a.begin()) << \"\\n\";\n    else cout << -1 << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], target = d[1];\nconst a = d.slice(2, 2 + n);\nlet lo = 0, hi = n - 1, res = -1;\nwhile (lo <= hi) {\n    const mid = (lo + hi) >> 1;\n    if (a[mid] === target) res = mid;\n    if (a[mid] >= target) hi = mid - 1; else lo = mid + 1;\n}\nconsole.log(res);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1 5\n5","expected":"0","hidden":true},{"input":"5 9\n1 2 2 2 5","expected":"-1","hidden":true},{"input":"6 1\n1 1 1 1 1 1","expected":"0","hidden":true},{"input":"7 4\n1 2 3 4 4 4 9","expected":"3","hidden":true},{"input":"5 5\n1 2 2 2 5","expected":"4","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 33
)
on conflict (id) do nothing;

-- 34. Last Occurrence in Sorted Array  [Easy]  /practice/problems/last-occurrence-in-sorted-array
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-searching-and-sorting-34', 'dt-practice-searching-and-sorting', null,
  $px$Last Occurrence in Sorted Array$px$, $px$last-occurrence-in-sorted-array$px$, $px$Easy$px$,
  $px$Given a sorted array that may contain duplicate values, find the last index at which a target value appears.

**Input Format**

The first line contains two integers `N` and `target`.
The second line contains `N` space-separated integers in non-decreasing order.

**Output Format**

Print the last index of `target`, or `-1` if it does not exist.$px$,
  $px$[{"input":"5 2\n1 2 2 2 5","output":"3","explanation":"The final 2 is at index 3."}]$px$::jsonb,
  $px$["1 <= N <= 100000","The array is sorted in non-decreasing order.","-1000000000 <= A[i], target <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long target = Long.parseLong(st.nextToken());\n        long[] a = new long[n];\n        for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());\n        int lo = 0, hi = n - 1, res = -1;\n        while (lo <= hi) {\n            int mid = (lo + hi) >>> 1;\n            if (a[mid] == target) res = mid;\n            if (a[mid] <= target) lo = mid + 1; else hi = mid - 1;\n        }\n        System.out.println(res);\n    }\n}\n","python":"import sys\nimport bisect\nd = sys.stdin.read().split()\nn, target = int(d[0]), int(d[1])\na = list(map(int, d[2:2+n]))\ni = bisect.bisect_right(a, target) - 1\nprint(i if i >= 0 and a[i] == target else -1)\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    long long n, target;\n    if (scanf(\"%lld %lld\", &n, &target) != 2) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    for (long long i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    long long lo = 0, hi = n - 1;\n    int res = -1;\n    while (lo <= hi) {\n        long long mid = (lo + hi) / 2;\n        if (a[mid] == target) res = (int)mid;\n        if (a[mid] <= target) lo = mid + 1; else hi = mid - 1;\n    }\n    printf(\"%d\\n\", res);\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    long long n, target; cin >> n >> target;\n    vector<long long> a(n);\n    for (auto &x : a) cin >> x;\n    auto it = upper_bound(a.begin(), a.end(), target);\n    if (it != a.begin() && *(it - 1) == target) cout << ((it - 1) - a.begin()) << \"\\n\";\n    else cout << -1 << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], target = d[1];\nconst a = d.slice(2, 2 + n);\nlet lo = 0, hi = n - 1, res = -1;\nwhile (lo <= hi) {\n    const mid = (lo + hi) >> 1;\n    if (a[mid] === target) res = mid;\n    if (a[mid] <= target) lo = mid + 1; else hi = mid - 1;\n}\nconsole.log(res);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1 5\n5","expected":"0","hidden":true},{"input":"5 9\n1 2 2 2 5","expected":"-1","hidden":true},{"input":"6 1\n1 1 1 1 1 1","expected":"5","hidden":true},{"input":"7 4\n1 2 3 4 4 4 9","expected":"5","hidden":true},{"input":"5 1\n1 2 2 2 5","expected":"0","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 34
)
on conflict (id) do nothing;

-- 35. Count Occurrences in Sorted Array  [Easy]  /practice/problems/count-occurrences-in-sorted-array
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-searching-and-sorting-35', 'dt-practice-searching-and-sorting', null,
  $px$Count Occurrences in Sorted Array$px$, $px$count-occurrences-in-sorted-array$px$, $px$Easy$px$,
  $px$Given a sorted array and a target value, count how many times the target occurs.

**Input Format**

The first line contains two integers `N` and `target`.
The second line contains `N` space-separated integers in non-decreasing order.

**Output Format**

Print the number of occurrences of `target`.$px$,
  $px$[{"input":"6 2\n1 2 2 2 4 5","output":"3","explanation":"2 occurs three times."}]$px$::jsonb,
  $px$["1 <= N <= 100000","The array is sorted in non-decreasing order.","-1000000000 <= A[i], target <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long target = Long.parseLong(st.nextToken());\n        long[] a = new long[n];\n        for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());\n        int c = 0;\n        for (long x : a) if (x == target) c++;\n        System.out.println(c);\n    }\n}\n","python":"import sys\nimport bisect\nd = sys.stdin.read().split()\nn, target = int(d[0]), int(d[1])\na = list(map(int, d[2:2+n]))\nprint(bisect.bisect_right(a, target) - bisect.bisect_left(a, target))\n","c":"#include <stdio.h>\nint main(void) {\n    long long n, target;\n    if (scanf(\"%lld %lld\", &n, &target) != 2) return 0;\n    long long x;\n    int c = 0;\n    for (long long i = 0; i < n; i++) { scanf(\"%lld\", &x); if (x == target) c++; }\n    printf(\"%d\\n\", c);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    long long n, target; cin >> n >> target;\n    vector<long long> a(n);\n    for (auto &x : a) cin >> x;\n    cout << (upper_bound(a.begin(), a.end(), target) - lower_bound(a.begin(), a.end(), target)) << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], target = d[1];\nlet c = 0;\nfor (let i = 2; i < 2 + n; i++) if (d[i] === target) c++;\nconsole.log(c);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1 5\n5","expected":"1","hidden":true},{"input":"5 9\n1 2 2 2 5","expected":"0","hidden":true},{"input":"6 1\n1 1 1 1 1 1","expected":"6","hidden":true},{"input":"7 4\n1 2 3 4 4 4 9","expected":"3","hidden":true},{"input":"3 -1\n-1 -1 0","expected":"2","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 35
)
on conflict (id) do nothing;

-- 36. Bubble Sort  [Easy]  /practice/problems/bubble-sort
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-searching-and-sorting-36', 'dt-practice-searching-and-sorting', null,
  $px$Bubble Sort$px$, $px$bubble-sort$px$, $px$Easy$px$,
  $px$Sort an integer array in ascending order using the Bubble Sort technique — repeatedly compare neighbouring elements and swap them when they are in the wrong order. The judge checks the final sorted output.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers.

**Output Format**

Print the `N` integers in ascending order, separated by single spaces, on one line.$px$,
  $px$[{"input":"4\n5 1 4 2","output":"1 2 4 5","explanation":"Neighbouring elements are compared and swapped until the array is sorted."}]$px$::jsonb,
  $px$["1 <= N <= 100000","-1000000000 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long[] a = new long[n];\n        for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());\n        Arrays.sort(a);\n        StringBuilder sb = new StringBuilder();\n        for (int i = 0; i < n; i++) { if (i > 0) sb.append(' '); sb.append(a[i]); }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\na = sorted(map(int, d[1:1+n]))\nprint(' '.join(map(str, a)))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint cmp(const void *p, const void *q) { long long a = *(const long long*)p, b = *(const long long*)q; return (a > b) - (a < b); }\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    qsort(a, n, sizeof(long long), cmp);\n    for (int i = 0; i < n; i++) printf(\"%lld%s\", a[i], i + 1 < n ? \" \" : \"\\n\");\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<long long> a(n);\n    for (auto &x : a) cin >> x;\n    sort(a.begin(), a.end());\n    for (int i = 0; i < n; i++) cout << a[i] << (i + 1 < n ? ' ' : '\\n');\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst a = d.slice(1, 1 + n).sort((x, y) => x - y);\nconsole.log(a.join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n7","expected":"7","hidden":true},{"input":"5\n5 4 3 2 1","expected":"1 2 3 4 5","hidden":true},{"input":"5\n3 3 3 3 3","expected":"3 3 3 3 3","hidden":true},{"input":"6\n-2 5 -9 0 5 1","expected":"-9 -2 0 1 5 5","hidden":true},{"input":"3\n1000000000 -1000000000 0","expected":"-1000000000 0 1000000000","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 36
)
on conflict (id) do nothing;

-- 37. Selection Sort  [Easy]  /practice/problems/selection-sort
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-searching-and-sorting-37', 'dt-practice-searching-and-sorting', null,
  $px$Selection Sort$px$, $px$selection-sort$px$, $px$Easy$px$,
  $px$Sort an integer array in ascending order using Selection Sort — at each step, find the smallest remaining value and place it at the current position. The judge checks the final sorted output.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers.

**Output Format**

Print the `N` integers in ascending order, separated by single spaces, on one line.$px$,
  $px$[{"input":"5\n64 25 12 22 11","output":"11 12 22 25 64","explanation":"The smallest remaining value is selected and placed each round."}]$px$::jsonb,
  $px$["1 <= N <= 100000","-1000000000 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long[] a = new long[n];\n        for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());\n        Arrays.sort(a);\n        StringBuilder sb = new StringBuilder();\n        for (int i = 0; i < n; i++) { if (i > 0) sb.append(' '); sb.append(a[i]); }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\na = sorted(map(int, d[1:1+n]))\nprint(' '.join(map(str, a)))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint cmp(const void *p, const void *q) { long long a = *(const long long*)p, b = *(const long long*)q; return (a > b) - (a < b); }\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    qsort(a, n, sizeof(long long), cmp);\n    for (int i = 0; i < n; i++) printf(\"%lld%s\", a[i], i + 1 < n ? \" \" : \"\\n\");\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<long long> a(n);\n    for (auto &x : a) cin >> x;\n    sort(a.begin(), a.end());\n    for (int i = 0; i < n; i++) cout << a[i] << (i + 1 < n ? ' ' : '\\n');\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst a = d.slice(1, 1 + n).sort((x, y) => x - y);\nconsole.log(a.join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n0","expected":"0","hidden":true},{"input":"4\n4 3 2 1","expected":"1 2 3 4","hidden":true},{"input":"5\n-1 -1 -1 -1 -1","expected":"-1 -1 -1 -1 -1","hidden":true},{"input":"6\n9 8 7 6 5 4","expected":"4 5 6 7 8 9","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 37
)
on conflict (id) do nothing;

-- 38. Insertion Sort  [Easy]  /practice/problems/insertion-sort
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-searching-and-sorting-38', 'dt-practice-searching-and-sorting', null,
  $px$Insertion Sort$px$, $px$insertion-sort$px$, $px$Easy$px$,
  $px$Sort an integer array in ascending order using Insertion Sort — take each element and insert it into its correct position among the elements already sorted. The judge checks the final sorted output.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers.

**Output Format**

Print the `N` integers in ascending order, separated by single spaces, on one line.$px$,
  $px$[{"input":"5\n5 2 4 6 1","output":"1 2 4 5 6","explanation":"Each element is inserted into its correct place among the sorted prefix."}]$px$::jsonb,
  $px$["1 <= N <= 100000","-1000000000 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long[] a = new long[n];\n        for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());\n        Arrays.sort(a);\n        StringBuilder sb = new StringBuilder();\n        for (int i = 0; i < n; i++) { if (i > 0) sb.append(' '); sb.append(a[i]); }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\na = sorted(map(int, d[1:1+n]))\nprint(' '.join(map(str, a)))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint cmp(const void *p, const void *q) { long long a = *(const long long*)p, b = *(const long long*)q; return (a > b) - (a < b); }\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    qsort(a, n, sizeof(long long), cmp);\n    for (int i = 0; i < n; i++) printf(\"%lld%s\", a[i], i + 1 < n ? \" \" : \"\\n\");\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<long long> a(n);\n    for (auto &x : a) cin >> x;\n    sort(a.begin(), a.end());\n    for (int i = 0; i < n; i++) cout << a[i] << (i + 1 < n ? ' ' : '\\n');\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst a = d.slice(1, 1 + n).sort((x, y) => x - y);\nconsole.log(a.join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n42","expected":"42","hidden":true},{"input":"4\n2 1 2 1","expected":"1 1 2 2","hidden":true},{"input":"5\n5 4 3 2 1","expected":"1 2 3 4 5","hidden":true},{"input":"6\n-3 -1 -2 0 -5 4","expected":"-5 -3 -2 -1 0 4","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 38
)
on conflict (id) do nothing;

-- 39. Merge Sort  [Medium]  /practice/problems/merge-sort
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-searching-and-sorting-39', 'dt-practice-searching-and-sorting', null,
  $px$Merge Sort$px$, $px$merge-sort$px$, $px$Medium$px$,
  $px$Sort an integer array in ascending order using the Merge Sort algorithm — split the array, sort each half, then merge the sorted halves. The judge checks the final sorted output.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers.

**Output Format**

Print the `N` integers in ascending order, separated by single spaces, on one line.$px$,
  $px$[{"input":"5\n5 3 8 1 2","output":"1 2 3 5 8","explanation":"Halves are sorted recursively and merged."}]$px$::jsonb,
  $px$["1 <= N <= 100000","-1000000000 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long[] a = new long[n];\n        for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());\n        Arrays.sort(a);\n        StringBuilder sb = new StringBuilder();\n        for (int i = 0; i < n; i++) { if (i > 0) sb.append(' '); sb.append(a[i]); }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\na = sorted(map(int, d[1:1+n]))\nprint(' '.join(map(str, a)))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint cmp(const void *p, const void *q) { long long a = *(const long long*)p, b = *(const long long*)q; return (a > b) - (a < b); }\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    qsort(a, n, sizeof(long long), cmp);\n    for (int i = 0; i < n; i++) printf(\"%lld%s\", a[i], i + 1 < n ? \" \" : \"\\n\");\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<long long> a(n);\n    for (auto &x : a) cin >> x;\n    sort(a.begin(), a.end());\n    for (int i = 0; i < n; i++) cout << a[i] << (i + 1 < n ? ' ' : '\\n');\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst a = d.slice(1, 1 + n).sort((x, y) => x - y);\nconsole.log(a.join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n-5","expected":"-5","hidden":true},{"input":"6\n6 5 4 3 2 1","expected":"1 2 3 4 5 6","hidden":true},{"input":"4\n2 2 1 1","expected":"1 1 2 2","hidden":true},{"input":"7\n10 -10 5 -5 0 3 -3","expected":"-10 -5 -3 0 3 5 10","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 39
)
on conflict (id) do nothing;

-- 40. Quick Sort  [Medium]  /practice/problems/quick-sort
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-searching-and-sorting-40', 'dt-practice-searching-and-sorting', null,
  $px$Quick Sort$px$, $px$quick-sort$px$, $px$Medium$px$,
  $px$Sort an integer array in ascending order using the Quick Sort algorithm — pick a pivot, partition the values around it, then sort the parts recursively. The judge checks the final sorted output.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers.

**Output Format**

Print the `N` integers in ascending order, separated by single spaces, on one line.$px$,
  $px$[{"input":"6\n10 7 8 9 1 5","output":"1 5 7 8 9 10","explanation":"Values are partitioned around a pivot and each part sorted recursively."}]$px$::jsonb,
  $px$["1 <= N <= 100000","-1000000000 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long[] a = new long[n];\n        for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());\n        Arrays.sort(a);\n        StringBuilder sb = new StringBuilder();\n        for (int i = 0; i < n; i++) { if (i > 0) sb.append(' '); sb.append(a[i]); }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\na = sorted(map(int, d[1:1+n]))\nprint(' '.join(map(str, a)))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint cmp(const void *p, const void *q) { long long a = *(const long long*)p, b = *(const long long*)q; return (a > b) - (a < b); }\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    qsort(a, n, sizeof(long long), cmp);\n    for (int i = 0; i < n; i++) printf(\"%lld%s\", a[i], i + 1 < n ? \" \" : \"\\n\");\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<long long> a(n);\n    for (auto &x : a) cin >> x;\n    sort(a.begin(), a.end());\n    for (int i = 0; i < n; i++) cout << a[i] << (i + 1 < n ? ' ' : '\\n');\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst a = d.slice(1, 1 + n).sort((x, y) => x - y);\nconsole.log(a.join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n1","expected":"1","hidden":true},{"input":"5\n5 5 5 5 5","expected":"5 5 5 5 5","hidden":true},{"input":"5\n9 7 5 3 1","expected":"1 3 5 7 9","hidden":true},{"input":"6\n0 -1 1 -2 2 -3","expected":"-3 -2 -1 0 1 2","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 40
)
on conflict (id) do nothing;

-- 41. Kth Smallest Element  [Medium]  /practice/problems/kth-smallest-element
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-searching-and-sorting-41', 'dt-practice-searching-and-sorting', null,
  $px$Kth Smallest Element$px$, $px$kth-smallest-element$px$, $px$Medium$px$,
  $px$Given an unsorted array and an integer `K`, find the K-th smallest element (1-indexed).

**Input Format**

The first line contains two integers `N` and `K`.
The second line contains `N` space-separated integers.

**Output Format**

Print the K-th smallest element.$px$,
  $px$[{"input":"6 3\n7 10 4 3 20 15","output":"7","explanation":"Sorted: 3 4 7 10 15 20; the 3rd smallest is 7."}]$px$::jsonb,
  $px$["1 <= K <= N <= 100000","-1000000000 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        int k = Integer.parseInt(st.nextToken());\n        long[] a = new long[n];\n        for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());\n        Arrays.sort(a);\n        System.out.println(a[k - 1]);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn, k = int(d[0]), int(d[1])\na = sorted(map(int, d[2:2+n]))\nprint(a[k - 1])\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint cmp(const void *p, const void *q) { long long a = *(const long long*)p, b = *(const long long*)q; return (a > b) - (a < b); }\nint main(void) {\n    long long n, k;\n    if (scanf(\"%lld %lld\", &n, &k) != 2) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    for (long long i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    qsort(a, n, sizeof(long long), cmp);\n    printf(\"%lld\\n\", a[k - 1]);\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    long long n, k; cin >> n >> k;\n    vector<long long> a(n);\n    for (auto &x : a) cin >> x;\n    nth_element(a.begin(), a.begin() + (k - 1), a.end());\n    cout << a[k - 1] << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], k = d[1];\nconst a = d.slice(2, 2 + n).sort((x, y) => x - y);\nconsole.log(a[k - 1]);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1 1\n42","expected":"42","hidden":true},{"input":"5 5\n5 4 3 2 1","expected":"5","hidden":true},{"input":"5 1\n5 4 3 2 1","expected":"1","hidden":true},{"input":"6 2\n-1 -1 -2 -2 0 0","expected":"-2","hidden":true},{"input":"4 3\n9 9 9 9","expected":"9","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 41
)
on conflict (id) do nothing;

-- 42. Kth Largest Element  [Medium]  /practice/problems/kth-largest-element
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-searching-and-sorting-42', 'dt-practice-searching-and-sorting', null,
  $px$Kth Largest Element$px$, $px$kth-largest-element$px$, $px$Medium$px$,
  $px$Given an unsorted array and an integer `K`, find the K-th largest element (1-indexed).

**Input Format**

The first line contains two integers `N` and `K`.
The second line contains `N` space-separated integers.

**Output Format**

Print the K-th largest element.$px$,
  $px$[{"input":"6 2\n3 2 1 5 6 4","output":"5","explanation":"The two largest values are 6 and 5, so the answer is 5."}]$px$::jsonb,
  $px$["1 <= K <= N <= 100000","-1000000000 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        int k = Integer.parseInt(st.nextToken());\n        long[] a = new long[n];\n        for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());\n        Arrays.sort(a);\n        System.out.println(a[n - k]);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn, k = int(d[0]), int(d[1])\na = sorted(map(int, d[2:2+n]), reverse=True)\nprint(a[k - 1])\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint cmp(const void *p, const void *q) { long long a = *(const long long*)p, b = *(const long long*)q; return (a > b) - (a < b); }\nint main(void) {\n    long long n, k;\n    if (scanf(\"%lld %lld\", &n, &k) != 2) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    for (long long i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    qsort(a, n, sizeof(long long), cmp);\n    printf(\"%lld\\n\", a[n - k]);\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    long long n, k; cin >> n >> k;\n    vector<long long> a(n);\n    for (auto &x : a) cin >> x;\n    sort(a.begin(), a.end());\n    cout << a[n - k] << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], k = d[1];\nconst a = d.slice(2, 2 + n).sort((x, y) => x - y);\nconsole.log(a[n - k]);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1 1\n7","expected":"7","hidden":true},{"input":"5 1\n1 2 3 4 5","expected":"5","hidden":true},{"input":"5 5\n1 2 3 4 5","expected":"1","hidden":true},{"input":"6 3\n9 9 8 8 7 7","expected":"8","hidden":true},{"input":"4 2\n-1 -2 -3 -4","expected":"-2","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 42
)
on conflict (id) do nothing;

-- 43. Search in Rotated Sorted Array  [Medium]  /practice/problems/search-in-rotated-sorted-array
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-searching-and-sorting-43', 'dt-practice-searching-and-sorting', null,
  $px$Search in Rotated Sorted Array$px$, $px$search-in-rotated-sorted-array$px$, $px$Medium$px$,
  $px$A sorted array of distinct values has been rotated at an unknown pivot. Find the index of a given target using an efficient search.

**Input Format**

The first line contains two integers `N` and `target`.
The second line contains `N` space-separated distinct integers — a sorted array that has been rotated.

**Output Format**

Print the index of `target`, or `-1` if it is absent.$px$,
  $px$[{"input":"7 0\n4 5 6 7 0 1 2","output":"4","explanation":"The target 0 is at index 4."}]$px$::jsonb,
  $px$["1 <= N <= 100000","All values are distinct.","-1000000000 <= A[i], target <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long target = Long.parseLong(st.nextToken());\n        long[] a = new long[n];\n        for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());\n        int lo = 0, hi = n - 1, ans = -1;\n        while (lo <= hi) {\n            int mid = (lo + hi) >>> 1;\n            if (a[mid] == target) { ans = mid; break; }\n            if (a[lo] <= a[mid]) {\n                if (a[lo] <= target && target < a[mid]) hi = mid - 1; else lo = mid + 1;\n            } else {\n                if (a[mid] < target && target <= a[hi]) lo = mid + 1; else hi = mid - 1;\n            }\n        }\n        System.out.println(ans);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn, target = int(d[0]), int(d[1])\na = list(map(int, d[2:2+n]))\nlo, hi, ans = 0, n - 1, -1\nwhile lo <= hi:\n    mid = (lo + hi) // 2\n    if a[mid] == target:\n        ans = mid\n        break\n    if a[lo] <= a[mid]:\n        if a[lo] <= target < a[mid]:\n            hi = mid - 1\n        else:\n            lo = mid + 1\n    else:\n        if a[mid] < target <= a[hi]:\n            lo = mid + 1\n        else:\n            hi = mid - 1\nprint(ans)\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    long long n, target;\n    if (scanf(\"%lld %lld\", &n, &target) != 2) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    for (long long i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    long long lo = 0, hi = n - 1;\n    int ans = -1;\n    while (lo <= hi) {\n        long long mid = (lo + hi) / 2;\n        if (a[mid] == target) { ans = (int)mid; break; }\n        if (a[lo] <= a[mid]) {\n            if (a[lo] <= target && target < a[mid]) hi = mid - 1; else lo = mid + 1;\n        } else {\n            if (a[mid] < target && target <= a[hi]) lo = mid + 1; else hi = mid - 1;\n        }\n    }\n    printf(\"%d\\n\", ans);\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    long long n, target; cin >> n >> target;\n    vector<long long> a(n);\n    for (auto &x : a) cin >> x;\n    long long lo = 0, hi = n - 1;\n    int ans = -1;\n    while (lo <= hi) {\n        long long mid = (lo + hi) / 2;\n        if (a[mid] == target) { ans = (int)mid; break; }\n        if (a[lo] <= a[mid]) {\n            if (a[lo] <= target && target < a[mid]) hi = mid - 1; else lo = mid + 1;\n        } else {\n            if (a[mid] < target && target <= a[hi]) lo = mid + 1; else hi = mid - 1;\n        }\n    }\n    cout << ans << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], target = d[1];\nconst a = d.slice(2, 2 + n);\nlet lo = 0, hi = n - 1, ans = -1;\nwhile (lo <= hi) {\n    const mid = (lo + hi) >> 1;\n    if (a[mid] === target) { ans = mid; break; }\n    if (a[lo] <= a[mid]) {\n        if (a[lo] <= target && target < a[mid]) hi = mid - 1; else lo = mid + 1;\n    } else {\n        if (a[mid] < target && target <= a[hi]) lo = mid + 1; else hi = mid - 1;\n    }\n}\nconsole.log(ans);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1 1\n1","expected":"0","hidden":true},{"input":"1 2\n1","expected":"-1","hidden":true},{"input":"7 3\n4 5 6 7 0 1 2","expected":"-1","hidden":true},{"input":"5 5\n5 1 2 3 4","expected":"0","hidden":true},{"input":"5 4\n5 1 2 3 4","expected":"4","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 43
)
on conflict (id) do nothing;

-- 44. Square Root Using Binary Search  [Easy]  /practice/problems/integer-square-root
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-searching-and-sorting-44', 'dt-practice-searching-and-sorting', null,
  $px$Square Root Using Binary Search$px$, $px$integer-square-root$px$, $px$Easy$px$,
  $px$Given a non-negative integer `N`, find the integer part of its square root without using a built-in square-root function.

**Input Format**

A single line containing the integer `N`.

**Output Format**

Print `floor(sqrt(N))`.$px$,
  $px$[{"input":"20","output":"4","explanation":"4*4 = 16 and 5*5 = 25, so the integer square root is 4."}]$px$::jsonb,
  $px$["0 <= N <= 1000000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        long n = Long.parseLong(br.readLine().trim());\n        long lo = 0, hi = 1000000, ans = 0;\n        while (lo <= hi) {\n            long mid = (lo + hi) / 2;\n            if (mid * mid <= n) { ans = mid; lo = mid + 1; }\n            else hi = mid - 1;\n        }\n        System.out.println(ans);\n    }\n}\n","python":"import sys\nn = int(sys.stdin.readline())\nlo, hi, ans = 0, 1000000, 0\nwhile lo <= hi:\n    mid = (lo + hi) // 2\n    if mid * mid <= n:\n        ans = mid\n        lo = mid + 1\n    else:\n        hi = mid - 1\nprint(ans)\n","c":"#include <stdio.h>\nint main(void) {\n    long long n;\n    if (scanf(\"%lld\", &n) != 1) return 0;\n    long long lo = 0, hi = 1000000, ans = 0;\n    while (lo <= hi) {\n        long long mid = (lo + hi) / 2;\n        if (mid * mid <= n) { ans = mid; lo = mid + 1; }\n        else hi = mid - 1;\n    }\n    printf(\"%lld\\n\", ans);\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\nint main() {\n    long long n; cin >> n;\n    long long lo = 0, hi = 1000000, ans = 0;\n    while (lo <= hi) {\n        long long mid = (lo + hi) / 2;\n        if (mid * mid <= n) { ans = mid; lo = mid + 1; }\n        else hi = mid - 1;\n    }\n    cout << ans << \"\\n\";\n    return 0;\n}\n","javascript":"const n = Number(require('fs').readFileSync(0, 'utf8').trim());\nlet lo = 0, hi = 1000000, ans = 0;\nwhile (lo <= hi) {\n    const mid = Math.floor((lo + hi) / 2);\n    if (mid * mid <= n) { ans = mid; lo = mid + 1; }\n    else hi = mid - 1;\n}\nconsole.log(ans);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"0","expected":"0","hidden":true},{"input":"1","expected":"1","hidden":true},{"input":"16","expected":"4","hidden":true},{"input":"15","expected":"3","hidden":true},{"input":"1000000000000","expected":"1000000","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 44
)
on conflict (id) do nothing;

-- 45. Merge Overlapping Intervals  [Medium]  /practice/problems/merge-overlapping-intervals
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-searching-and-sorting-45', 'dt-practice-searching-and-sorting', null,
  $px$Merge Overlapping Intervals$px$, $px$merge-overlapping-intervals$px$, $px$Medium$px$,
  $px$Given a collection of intervals, merge all intervals that overlap or touch, and print the result sorted by start value.

**Input Format**

The first line contains an integer `N`, the number of intervals.
Each of the next `N` lines contains two integers `start` and `end` (`start <= end`).

**Output Format**

Print the merged intervals, one per line as `start end`, in increasing order of `start`.$px$,
  $px$[{"input":"4\n1 3\n2 6\n8 10\n9 12","output":"1 6\n8 12","explanation":"[1,3] overlaps [2,6] -> [1,6]; [8,10] overlaps [9,12] -> [8,12]."}]$px$::jsonb,
  $px$["1 <= N <= 100000","-1000000000 <= start <= end <= 1000000000","Two intervals are merged when one's start is <= the other's end."]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long[][] iv = new long[n][2];\n        for (int i = 0; i < n; i++) { iv[i][0] = Long.parseLong(st.nextToken()); iv[i][1] = Long.parseLong(st.nextToken()); }\n        Arrays.sort(iv, (p, q) -> Long.compare(p[0], q[0]));\n        StringBuilder sb = new StringBuilder();\n        long cs = 0, ce = 0;\n        boolean open = false;\n        for (long[] p : iv) {\n            if (open && p[0] <= ce) ce = Math.max(ce, p[1]);\n            else { if (open) sb.append(cs).append(' ').append(ce).append('\\n'); cs = p[0]; ce = p[1]; open = true; }\n        }\n        if (open) sb.append(cs).append(' ').append(ce).append('\\n');\n        System.out.print(sb);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\niv = []\nfor i in range(n):\n    s = int(d[1 + 2 * i])\n    e = int(d[2 + 2 * i])\n    iv.append((s, e))\niv.sort()\nout = []\nfor s, e in iv:\n    if out and s <= out[-1][1]:\n        out[-1] = (out[-1][0], max(out[-1][1], e))\n    else:\n        out.append((s, e))\nprint('\\n'.join(f\"{s} {e}\" for s, e in out))\n","c":"#include <stdio.h>\n#include <stdlib.h>\ntypedef struct { long long s, e; } Iv;\nint cmp(const void *p, const void *q) { long long a = ((const Iv*)p)->s, b = ((const Iv*)q)->s; return (a > b) - (a < b); }\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    Iv *iv = malloc(sizeof(Iv) * n);\n    for (int i = 0; i < n; i++) scanf(\"%lld %lld\", &iv[i].s, &iv[i].e);\n    qsort(iv, n, sizeof(Iv), cmp);\n    long long cs = 0, ce = 0;\n    int open = 0;\n    for (int i = 0; i < n; i++) {\n        if (open && iv[i].s <= ce) { if (iv[i].e > ce) ce = iv[i].e; }\n        else { if (open) printf(\"%lld %lld\\n\", cs, ce); cs = iv[i].s; ce = iv[i].e; open = 1; }\n    }\n    if (open) printf(\"%lld %lld\\n\", cs, ce);\n    free(iv);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<pair<long long,long long>> iv(n);\n    for (auto &p : iv) cin >> p.first >> p.second;\n    sort(iv.begin(), iv.end());\n    long long cs = 0, ce = 0;\n    bool open = false;\n    for (auto &p : iv) {\n        if (open && p.first <= ce) ce = max(ce, p.second);\n        else { if (open) cout << cs << ' ' << ce << '\\n'; cs = p.first; ce = p.second; open = true; }\n    }\n    if (open) cout << cs << ' ' << ce << '\\n';\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst iv = [];\nfor (let i = 0; i < n; i++) iv.push([d[1 + 2 * i], d[2 + 2 * i]]);\niv.sort((p, q) => p[0] - q[0]);\nconst out = [];\nfor (const [s, e] of iv) {\n    if (out.length && s <= out[out.length - 1][1]) out[out.length - 1][1] = Math.max(out[out.length - 1][1], e);\n    else out.push([s, e]);\n}\nconsole.log(out.map(([s, e]) => `${s} ${e}`).join('\\n'));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n5 7","expected":"5 7","hidden":true},{"input":"3\n1 2\n2 3\n3 4","expected":"1 4","hidden":true},{"input":"3\n10 12\n1 2\n5 6","expected":"1 2\n5 6\n10 12","hidden":true},{"input":"2\n1 10\n2 3","expected":"1 10","hidden":true},{"input":"4\n-5 -3\n-4 0\n1 1\n1 2","expected":"-5 0\n1 2","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 45
)
on conflict (id) do nothing;

-- ===========================================================================
-- 3. VALIDATION  (raises, never silently passes)
-- ===========================================================================
do $val$
declare
  v_cat_id text := 'dt-practice-searching-and-sorting';
  v_n int;
begin
  if not exists (select 1 from public.dsa_topics where id = v_cat_id and kind = 'practice') then
    raise exception '0075/047: category % missing', v_cat_id;
  end if;
  select count(*) into v_n from public.dsa_problems
   where topic_id = v_cat_id and learning_topic_id is null and coalesce(status,'published') = 'published';
  if v_n < 15 then
    raise exception '0075/047: expected >= 15 Searching & Sorting practice problems, found %', v_n;
  end if;
  raise notice '0075/047 OK: % Searching & Sorting practice problems present.', v_n;
end
$val$;

notify pgrst, 'reload schema';
