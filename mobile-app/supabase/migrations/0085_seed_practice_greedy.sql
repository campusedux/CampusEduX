-- mobile-app/supabase/migrations/0085_seed_practice_greedy.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: admin-panel/supabase/migrations/057_seed_practice_greedy.sql ; apply either, the other is a guarded no-op.
-- ============================================================================
-- BODY — global Practice ▸ Coding Problems seed: Greedy Algorithms (5 problems)
-- (mobile 0085_seed_practice_greedy.sql
--  == admin 057_seed_practice_greedy.sql — byte-identical below the 3-line header,
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
    raise exception '0085/057: practice RPCs not found — apply 0072_practice_coding.sql (admin 044) first.';
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
  ('dt-practice-greedy', $px$Greedy Algorithms$px$, $px$greedy$px$, $px$Interval scheduling, fractional knapsack, coin change, platform allocation and deadline-based job sequencing.$px$, 13, 'practice', 'published', true, true)
on conflict (id) do nothing;

-- ===========================================================================
-- 2. CODING PROBLEMS — Greedy Algorithms
-- ===========================================================================

-- 131. Activity Selection  [Medium]  /practice/problems/activity-selection
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-greedy-131', 'dt-practice-greedy', null,
  $px$Activity Selection$px$, $px$activity-selection$px$, $px$Medium$px$,
  $px$Given `N` activities with start and finish times, select the maximum number of activities that can be performed by a single person, where a person can only work on one activity at a time. An activity may start exactly when another finishes.

**Input Format**

The first line contains an integer `N`.
Each of the next `N` lines contains two integers `start` and `finish` (`start <= finish`).

**Output Format**

Print the maximum number of non-overlapping activities.$px$,
  $px$[{"input":"5\n1 2\n3 4\n0 6\n5 7\n8 9","output":"4","explanation":"Choosing activities that finish earliest leaves the most room for later ones."}]$px$::jsonb,
  $px$["1 <= N <= 100000","0 <= start <= finish <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long[][] iv = new long[n][2];\n        for (int i = 0; i < n; i++) { long s = Long.parseLong(st.nextToken()); long f = Long.parseLong(st.nextToken()); iv[i][0] = f; iv[i][1] = s; }\n        Arrays.sort(iv, (p, q) -> Long.compare(p[0], q[0]));\n        int count = 0;\n        long last = Long.MIN_VALUE;\n        boolean started = false;\n        for (long[] a : iv) {\n            if (!started || a[1] >= last) { count++; last = a[0]; started = true; }\n        }\n        System.out.println(count);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\niv = []\nfor i in range(n):\n    s = int(d[1 + 2 * i]); f = int(d[2 + 2 * i])\n    iv.append((f, s))\niv.sort()\ncount = 0\nlast = -1\nfor f, s in iv:\n    if last == -1 or s >= last:\n        count += 1\n        last = f\nprint(count)\n","c":"#include <stdio.h>\n#include <stdlib.h>\ntypedef struct { long long f, s; } Iv;\nint cmp(const void *p, const void *q) { long long a = ((const Iv*)p)->f, b = ((const Iv*)q)->f; return (a > b) - (a < b); }\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    Iv *iv = malloc(sizeof(Iv) * n);\n    for (int i = 0; i < n; i++) { long long s, f; scanf(\"%lld %lld\", &s, &f); iv[i].f = f; iv[i].s = s; }\n    qsort(iv, n, sizeof(Iv), cmp);\n    int count = 0, started = 0;\n    long long last = 0;\n    for (int i = 0; i < n; i++) {\n        if (!started || iv[i].s >= last) { count++; last = iv[i].f; started = 1; }\n    }\n    printf(\"%d\\n\", count);\n    free(iv);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<pair<long long,long long>> iv(n);\n    for (auto &p : iv) { long long s, f; cin >> s >> f; p = {f, s}; }\n    sort(iv.begin(), iv.end());\n    int count = 0; bool started = false; long long last = 0;\n    for (auto &p : iv) if (!started || p.second >= last) { count++; last = p.first; started = true; }\n    cout << count << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst iv = [];\nfor (let i = 0; i < n; i++) iv.push([d[2 + 2 * i], d[1 + 2 * i]]);\niv.sort((p, q) => p[0] - q[0]);\nlet count = 0, last = -Infinity;\nfor (const [f, s] of iv) if (s >= last) { count++; last = f; }\nconsole.log(count);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n5 10","expected":"1","hidden":true},{"input":"3\n0 10\n1 2\n3 4","expected":"2","hidden":true},{"input":"4\n1 3\n2 4\n3 5\n4 6","expected":"2","hidden":true},{"input":"3\n1 2\n1 2\n1 2","expected":"1","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 131
)
on conflict (id) do nothing;

-- 132. Fractional Knapsack  [Medium]  /practice/problems/fractional-knapsack
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-greedy-132', 'dt-practice-greedy', null,
  $px$Fractional Knapsack$px$, $px$fractional-knapsack$px$, $px$Medium$px$,
  $px$You have `N` items with values and weights and a bag of capacity `W`. You may take any fraction of an item. Maximise the total value carried.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers — the values.
The third line contains `N` space-separated integers — the weights (all positive).
The fourth line contains an integer `W`, the capacity.

**Output Format**

Print the maximum value with exactly two digits after the decimal point.$px$,
  $px$[{"input":"3\n60 100 120\n10 20 30\n50","output":"240.00","explanation":"Take the first two items whole, then two-thirds of the third: 60 + 100 + 80 = 240."}]$px$::jsonb,
  $px$["1 <= N <= 100000","1 <= value[i] <= 1000000","1 <= weight[i] <= 1000000","0 <= W <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        double[] val = new double[n], wt = new double[n];\n        for (int i = 0; i < n; i++) val[i] = Double.parseDouble(st.nextToken());\n        for (int i = 0; i < n; i++) wt[i] = Double.parseDouble(st.nextToken());\n        double W = Double.parseDouble(st.nextToken());\n        Integer[] idx = new Integer[n];\n        for (int i = 0; i < n; i++) idx[i] = i;\n        Arrays.sort(idx, (a, b) -> Double.compare(val[b] / wt[b], val[a] / wt[a]));\n        double cap = W, total = 0;\n        for (int i : idx) {\n            if (cap <= 0) break;\n            double take = Math.min(wt[i], cap);\n            total += val[i] * (take / wt[i]);\n            cap -= take;\n        }\n        System.out.printf(\"%.2f%n\", total);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\nval = list(map(int, d[1:1+n]))\nwt = list(map(int, d[1+n:1+2*n]))\nW = int(d[1+2*n])\nitems = sorted(range(n), key=lambda i: val[i] / wt[i], reverse=True)\ncap = W\ntotal = 0.0\nfor i in items:\n    if cap <= 0:\n        break\n    take = min(wt[i], cap)\n    total += val[i] * (take / wt[i])\n    cap -= take\nprint(f\"{total:.2f}\")\n","c":"#include <stdio.h>\n#include <stdlib.h>\ndouble *val, *wt;\nint cmp(const void *p, const void *q) {\n    int a = *(const int*)p, b = *(const int*)q;\n    double ra = val[a] / wt[a], rb = val[b] / wt[b];\n    if (ra < rb) return 1;\n    if (ra > rb) return -1;\n    return 0;\n}\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    val = malloc(sizeof(double) * n);\n    wt = malloc(sizeof(double) * n);\n    for (int i = 0; i < n; i++) scanf(\"%lf\", &val[i]);\n    for (int i = 0; i < n; i++) scanf(\"%lf\", &wt[i]);\n    double W; scanf(\"%lf\", &W);\n    int *idx = malloc(sizeof(int) * n);\n    for (int i = 0; i < n; i++) idx[i] = i;\n    qsort(idx, n, sizeof(int), cmp);\n    double cap = W, total = 0;\n    for (int k = 0; k < n; k++) {\n        if (cap <= 0) break;\n        int i = idx[k];\n        double take = wt[i] < cap ? wt[i] : cap;\n        total += val[i] * (take / wt[i]);\n        cap -= take;\n    }\n    printf(\"%.2f\\n\", total);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <cstdio>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<double> val(n), wt(n);\n    for (auto &x : val) cin >> x;\n    for (auto &x : wt) cin >> x;\n    double W; cin >> W;\n    vector<int> idx(n);\n    for (int i = 0; i < n; i++) idx[i] = i;\n    sort(idx.begin(), idx.end(), [&](int a, int b) { return val[a] / wt[a] > val[b] / wt[b]; });\n    double cap = W, total = 0;\n    for (int i : idx) {\n        if (cap <= 0) break;\n        double take = min(wt[i], cap);\n        total += val[i] * (take / wt[i]);\n        cap -= take;\n    }\n    printf(\"%.2f\\n\", total);\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst val = d.slice(1, 1 + n);\nconst wt = d.slice(1 + n, 1 + 2 * n);\nconst W = d[1 + 2 * n];\nconst idx = [...Array(n).keys()].sort((a, b) => val[b] / wt[b] - val[a] / wt[a]);\nlet cap = W, total = 0;\nfor (const i of idx) {\n    if (cap <= 0) break;\n    const take = Math.min(wt[i], cap);\n    total += val[i] * (take / wt[i]);\n    cap -= take;\n}\nconsole.log(total.toFixed(2));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n10\n5\n0","expected":"0.00","hidden":true},{"input":"1\n10\n5\n5","expected":"10.00","hidden":true},{"input":"2\n30 20\n10 10\n10","expected":"30.00","hidden":true},{"input":"2\n40 100\n10 20\n25","expected":"120.00","hidden":true},{"input":"3\n100 100 100\n10 10 10\n30","expected":"300.00","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 132
)
on conflict (id) do nothing;

-- 133. Minimum Number of Coins  [Medium]  /practice/problems/minimum-number-of-coins
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-greedy-133', 'dt-practice-greedy', null,
  $px$Minimum Number of Coins$px$, $px$minimum-number-of-coins$px$, $px$Medium$px$,
  $px$Given coin denominations and a target amount, find the minimum number of coins needed to make exactly that amount. Each denomination may be used any number of times.

**Input Format**

The first line contains an integer `N`, the number of denominations.
The second line contains `N` space-separated positive integers — the coin values.
The third line contains an integer `amount`.

**Output Format**

Print the minimum number of coins, or `-1` if the amount cannot be formed.$px$,
  $px$[{"input":"4\n1 5 10 25\n30","output":"2","explanation":"25 + 5 = 30, so two coins suffice."}]$px$::jsonb,
  $px$["1 <= N <= 100","1 <= coin value <= 10000","0 <= amount <= 10000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        int[] coins = new int[n];\n        for (int i = 0; i < n; i++) coins[i] = Integer.parseInt(st.nextToken());\n        int amount = Integer.parseInt(st.nextToken());\n        int INF = 1 << 29;\n        int[] dp = new int[amount + 1];\n        Arrays.fill(dp, INF);\n        dp[0] = 0;\n        for (int a = 1; a <= amount; a++)\n            for (int c : coins) if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;\n        System.out.println(dp[amount] >= INF ? -1 : dp[amount]);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\ncoins = list(map(int, d[1:1+n]))\namount = int(d[1+n])\nINF = float('inf')\ndp = [0] + [INF] * amount\nfor a in range(1, amount + 1):\n    for c in coins:\n        if c <= a and dp[a - c] + 1 < dp[a]:\n            dp[a] = dp[a - c] + 1\nprint(dp[amount] if dp[amount] != INF else -1)\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    int *coins = malloc(sizeof(int) * n);\n    for (int i = 0; i < n; i++) scanf(\"%d\", &coins[i]);\n    int amount; scanf(\"%d\", &amount);\n    int INF = 1 << 29;\n    int *dp = malloc(sizeof(int) * (amount + 1));\n    dp[0] = 0;\n    for (int a = 1; a <= amount; a++) dp[a] = INF;\n    for (int a = 1; a <= amount; a++)\n        for (int i = 0; i < n; i++) if (coins[i] <= a && dp[a - coins[i]] + 1 < dp[a]) dp[a] = dp[a - coins[i]] + 1;\n    printf(\"%d\\n\", dp[amount] >= INF ? -1 : dp[amount]);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<int> coins(n);\n    for (auto &x : coins) cin >> x;\n    int amount; cin >> amount;\n    const int INF = 1 << 29;\n    vector<int> dp(amount + 1, INF);\n    dp[0] = 0;\n    for (int a = 1; a <= amount; a++)\n        for (int c : coins) if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;\n    cout << (dp[amount] >= INF ? -1 : dp[amount]) << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst coins = d.slice(1, 1 + n);\nconst amount = d[1 + n];\nconst INF = 1 << 29;\nconst dp = new Array(amount + 1).fill(INF);\ndp[0] = 0;\nfor (let a = 1; a <= amount; a++)\n    for (const c of coins) if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;\nconsole.log(dp[amount] >= INF ? -1 : dp[amount]);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n2\n3","expected":"-1","hidden":true},{"input":"1\n1\n0","expected":"0","hidden":true},{"input":"3\n1 3 4\n6","expected":"2","hidden":true},{"input":"2\n5 7\n1","expected":"-1","hidden":true},{"input":"3\n2 5 10\n27","expected":"4","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 133
)
on conflict (id) do nothing;

-- 134. Minimum Platforms  [Medium]  /practice/problems/minimum-platforms
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-greedy-134', 'dt-practice-greedy', null,
  $px$Minimum Platforms$px$, $px$minimum-platforms$px$, $px$Medium$px$,
  $px$Given the arrival and departure times of `N` trains at a station, find the minimum number of platforms needed so that no train waits. A platform is needed if a train arrives before or at the same moment another departs.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers — the arrival times.
The third line contains `N` space-separated integers — the departure times.

**Output Format**

Print the minimum number of platforms required.$px$,
  $px$[{"input":"6\n900 940 950 1100 1500 1800\n910 1200 1120 1130 1900 2000","output":"3","explanation":"At one point three trains are at the station at the same time."}]$px$::jsonb,
  $px$["1 <= N <= 100000","0 <= arrival[i] <= departure[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long[] arr = new long[n], dep = new long[n];\n        for (int i = 0; i < n; i++) arr[i] = Long.parseLong(st.nextToken());\n        for (int i = 0; i < n; i++) dep[i] = Long.parseLong(st.nextToken());\n        Arrays.sort(arr); Arrays.sort(dep);\n        int i = 0, j = 0, plat = 0, best = 0;\n        while (i < n) {\n            if (arr[i] <= dep[j]) { plat++; i++; best = Math.max(best, plat); }\n            else { plat--; j++; }\n        }\n        System.out.println(best);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\narr = sorted(map(int, d[1:1+n]))\ndep = sorted(map(int, d[1+n:1+2*n]))\ni = j = 0\nplat = 0\nbest = 0\nwhile i < n:\n    if arr[i] <= dep[j]:\n        plat += 1\n        i += 1\n        best = max(best, plat)\n    else:\n        plat -= 1\n        j += 1\nprint(best)\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint cmp(const void *p, const void *q) { long long a = *(const long long*)p, b = *(const long long*)q; return (a > b) - (a < b); }\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long *arr = malloc(sizeof(long long) * n), *dep = malloc(sizeof(long long) * n);\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &arr[i]);\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &dep[i]);\n    qsort(arr, n, sizeof(long long), cmp);\n    qsort(dep, n, sizeof(long long), cmp);\n    int i = 0, j = 0, plat = 0, best = 0;\n    while (i < n) {\n        if (arr[i] <= dep[j]) { plat++; i++; if (plat > best) best = plat; }\n        else { plat--; j++; }\n    }\n    printf(\"%d\\n\", best);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<long long> arr(n), dep(n);\n    for (auto &x : arr) cin >> x;\n    for (auto &x : dep) cin >> x;\n    sort(arr.begin(), arr.end());\n    sort(dep.begin(), dep.end());\n    int i = 0, j = 0, plat = 0, best = 0;\n    while (i < n) {\n        if (arr[i] <= dep[j]) { plat++; i++; best = max(best, plat); }\n        else { plat--; j++; }\n    }\n    cout << best << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst arr = d.slice(1, 1 + n).sort((a, b) => a - b);\nconst dep = d.slice(1 + n, 1 + 2 * n).sort((a, b) => a - b);\nlet i = 0, j = 0, plat = 0, best = 0;\nwhile (i < n) {\n    if (arr[i] <= dep[j]) { plat++; i++; best = Math.max(best, plat); }\n    else { plat--; j++; }\n}\nconsole.log(best);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n100\n200","expected":"1","hidden":true},{"input":"3\n1 2 3\n4 5 6","expected":"3","hidden":true},{"input":"3\n1 5 9\n4 8 12","expected":"1","hidden":true},{"input":"4\n10 10 10 10\n20 20 20 20","expected":"4","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 134
)
on conflict (id) do nothing;

-- 135. Job Sequencing with Deadlines  [Medium]  /practice/problems/job-sequencing-with-deadlines
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-greedy-135', 'dt-practice-greedy', null,
  $px$Job Sequencing with Deadlines$px$, $px$job-sequencing-with-deadlines$px$, $px$Medium$px$,
  $px$Each of `N` jobs has an integer deadline and a profit, and takes exactly one unit of time. Only one job runs at a time, starting at time 1. A job earns its profit only if it finishes by its deadline. Maximise total profit.

**Input Format**

The first line contains an integer `N`.
Each of the next `N` lines contains two integers `deadline` and `profit`.

**Output Format**

Print the maximum total profit.$px$,
  $px$[{"input":"5\n2 100\n1 19\n2 27\n1 25\n3 15","output":"142","explanation":"Run job 1 (profit 100) at time 2, job 3 (profit 27) at time 1, job 5 (profit 15) at time 3: 100 + 27 + 15 = 142."}]$px$::jsonb,
  $px$["1 <= N <= 100000","1 <= deadline <= N","0 <= profit <= 1000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    static int[] par;\n    static int find(int x) { while (par[x] != x) { par[x] = par[par[x]]; x = par[x]; } return x; }\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long[][] jobs = new long[n][2];\n        int maxd = 0;\n        for (int i = 0; i < n; i++) {\n            int dl = Integer.parseInt(st.nextToken());\n            long pr = Long.parseLong(st.nextToken());\n            jobs[i][0] = pr; jobs[i][1] = dl;\n            maxd = Math.max(maxd, dl);\n        }\n        Arrays.sort(jobs, (p, q) -> Long.compare(q[0], p[0]));\n        par = new int[maxd + 1];\n        for (int i = 0; i <= maxd; i++) par[i] = i;\n        long total = 0;\n        for (long[] j : jobs) {\n            int s = find((int) Math.min(j[1], maxd));\n            if (s > 0) { total += j[0]; par[s] = s - 1; }\n        }\n        System.out.println(total);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\njobs = []\nfor i in range(n):\n    dl = int(d[1 + 2 * i]); pr = int(d[2 + 2 * i])\n    jobs.append((pr, dl))\njobs.sort(reverse=True)\nmaxd = max(dl for _, dl in jobs)\npar = list(range(maxd + 1))\ndef find(x):\n    while par[x] != x:\n        par[x] = par[par[x]]\n        x = par[x]\n    return x\ntotal = 0\nfor pr, dl in jobs:\n    s = find(min(dl, maxd))\n    if s > 0:\n        total += pr\n        par[s] = s - 1\nprint(total)\n","c":"#include <stdio.h>\n#include <stdlib.h>\ntypedef struct { long long pr; int dl; } Job;\nint cmp(const void *p, const void *q) { long long a = ((const Job*)p)->pr, b = ((const Job*)q)->pr; return (a < b) - (a > b); }\nint *par;\nint find(int x) { while (par[x] != x) { par[x] = par[par[x]]; x = par[x]; } return x; }\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    Job *jobs = malloc(sizeof(Job) * n);\n    int maxd = 0;\n    for (int i = 0; i < n; i++) { scanf(\"%d %lld\", &jobs[i].dl, &jobs[i].pr); if (jobs[i].dl > maxd) maxd = jobs[i].dl; }\n    qsort(jobs, n, sizeof(Job), cmp);\n    par = malloc(sizeof(int) * (maxd + 1));\n    for (int i = 0; i <= maxd; i++) par[i] = i;\n    long long total = 0;\n    for (int i = 0; i < n; i++) {\n        int dl = jobs[i].dl < maxd ? jobs[i].dl : maxd;\n        int s = find(dl);\n        if (s > 0) { total += jobs[i].pr; par[s] = s - 1; }\n    }\n    printf(\"%lld\\n\", total);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nvector<int> par;\nint find(int x) { while (par[x] != x) { par[x] = par[par[x]]; x = par[x]; } return x; }\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<pair<long long,int>> jobs(n);\n    int maxd = 0;\n    for (auto &j : jobs) { int dl; long long pr; cin >> dl >> pr; j = {pr, dl}; maxd = max(maxd, dl); }\n    sort(jobs.begin(), jobs.end(), [](auto &a, auto &b) { return a.first > b.first; });\n    par.resize(maxd + 1);\n    for (int i = 0; i <= maxd; i++) par[i] = i;\n    long long total = 0;\n    for (auto &j : jobs) {\n        int s = find(min(j.second, maxd));\n        if (s > 0) { total += j.first; par[s] = s - 1; }\n    }\n    cout << total << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst jobs = [];\nlet maxd = 0;\nfor (let i = 0; i < n; i++) {\n    const dl = d[1 + 2 * i], pr = d[2 + 2 * i];\n    jobs.push([pr, dl]);\n    maxd = Math.max(maxd, dl);\n}\njobs.sort((a, b) => b[0] - a[0]);\nconst par = [...Array(maxd + 1).keys()];\nfunction find(x) { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; }\nlet total = 0;\nfor (const [pr, dl] of jobs) {\n    const s = find(Math.min(dl, maxd));\n    if (s > 0) { total += pr; par[s] = s - 1; }\n}\nconsole.log(total);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n1 50","expected":"50","hidden":true},{"input":"3\n1 10\n1 20\n1 30","expected":"30","hidden":true},{"input":"4\n4 70\n1 80\n1 30\n1 100","expected":"170","hidden":true},{"input":"3\n3 20\n3 15\n3 10","expected":"45","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 135
)
on conflict (id) do nothing;

-- ===========================================================================
-- 3. VALIDATION  (raises, never silently passes)
-- ===========================================================================
do $val$
declare
  v_cat_id text := 'dt-practice-greedy';
  v_n int;
begin
  if not exists (select 1 from public.dsa_topics where id = v_cat_id and kind = 'practice') then
    raise exception '0085/057: category % missing', v_cat_id;
  end if;
  select count(*) into v_n from public.dsa_problems
   where topic_id = v_cat_id and learning_topic_id is null and coalesce(status,'published') = 'published';
  if v_n < 5 then
    raise exception '0085/057: expected >= 5 Greedy Algorithms practice problems, found %', v_n;
  end if;
  raise notice '0085/057 OK: % Greedy Algorithms practice problems present.', v_n;
end
$val$;

notify pgrst, 'reload schema';
