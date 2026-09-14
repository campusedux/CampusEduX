-- admin-panel/supabase/migrations/056_seed_practice_graph.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: mobile-app/supabase/migrations/0084_seed_practice_graph.sql ; apply either, the other is a guarded no-op.
-- ============================================================================
-- BODY — global Practice ▸ Coding Problems seed: Graph (10 problems)
-- (mobile 0084_seed_practice_graph.sql
--  == admin 056_seed_practice_graph.sql — byte-identical below the 3-line header,
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
    raise exception '0084/056: practice RPCs not found — apply 0072_practice_coding.sql (admin 044) first.';
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
  ('dt-practice-graph', $px$Graph$px$, $px$graph$px$, $px$Adjacency lists, BFS / DFS, cycle detection, shortest paths (BFS + Dijkstra), topological sort, connected components and MST.$px$, 12, 'practice', 'published', true, true)
on conflict (id) do nothing;

-- ===========================================================================
-- 2. CODING PROBLEMS — Graph
-- ===========================================================================

-- 121. Graph Using Adjacency List  [Easy]  /practice/problems/graph-using-adjacency-list
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-graph-121', 'dt-practice-graph', null,
  $px$Graph Using Adjacency List$px$, $px$graph-using-adjacency-list$px$, $px$Easy$px$,
  $px$Given the number of vertices `V` (labelled `0 .. V-1`) and a list of undirected edges, build the adjacency list of the graph and print it.

**Input Format**

The first line contains two integers `V` and `E`.
Each of the next `E` lines contains two integers `u` and `v`, an undirected edge.

**Output Format**

Print `V` lines. Line `i` is `i -> [n1,n2,...]` where the neighbours of vertex `i` are listed in increasing order, comma-separated, inside square brackets (`i -> []` if it has none).$px$,
  $px$[{"input":"4 3\n0 1\n0 2\n1 3","output":"0 -> [1,2]\n1 -> [0,3]\n2 -> [0]\n3 -> [1]","explanation":"Each edge connects its two endpoints."}]$px$::jsonb,
  $px$["1 <= V <= 100000","0 <= E <= 200000","0 <= u, v < V"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int v = Integer.parseInt(st.nextToken());\n        int e = Integer.parseInt(st.nextToken());\n        List<List<Integer>> adj = new ArrayList<>();\n        for (int i = 0; i < v; i++) adj.add(new ArrayList<>());\n        for (int i = 0; i < e; i++) {\n            int a = Integer.parseInt(st.nextToken());\n            int b = Integer.parseInt(st.nextToken());\n            adj.get(a).add(b); adj.get(b).add(a);\n        }\n        StringBuilder sb = new StringBuilder();\n        for (int i = 0; i < v; i++) {\n            Collections.sort(adj.get(i));\n            sb.append(i).append(\" -> [\");\n            for (int j = 0; j < adj.get(i).size(); j++) { if (j > 0) sb.append(','); sb.append(adj.get(i).get(j)); }\n            sb.append(\"]\\n\");\n        }\n        System.out.print(sb);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nv, e = int(d[0]), int(d[1])\nadj = [[] for _ in range(v)]\nidx = 2\nfor _ in range(e):\n    a, b = int(d[idx]), int(d[idx + 1]); idx += 2\n    adj[a].append(b)\n    adj[b].append(a)\nout = []\nfor i in range(v):\n    out.append(f\"{i} -> [\" + ','.join(map(str, sorted(adj[i]))) + \"]\")\nprint('\\n'.join(out))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint *deg, **adj;\nint cmp(const void *p, const void *q) { return *(const int*)p - *(const int*)q; }\nint main(void) {\n    int v, e;\n    if (scanf(\"%d %d\", &v, &e) != 2) return 0;\n    deg = calloc(v, sizeof(int));\n    int *ea = malloc(sizeof(int) * e), *eb = malloc(sizeof(int) * e);\n    for (int i = 0; i < e; i++) { scanf(\"%d %d\", &ea[i], &eb[i]); deg[ea[i]]++; deg[eb[i]]++; }\n    adj = malloc(sizeof(int*) * v);\n    int *fill = calloc(v, sizeof(int));\n    for (int i = 0; i < v; i++) adj[i] = malloc(sizeof(int) * (deg[i] > 0 ? deg[i] : 1));\n    for (int i = 0; i < e; i++) { adj[ea[i]][fill[ea[i]]++] = eb[i]; adj[eb[i]][fill[eb[i]]++] = ea[i]; }\n    for (int i = 0; i < v; i++) {\n        qsort(adj[i], deg[i], sizeof(int), cmp);\n        printf(\"%d -> [\", i);\n        for (int j = 0; j < deg[i]; j++) printf(\"%s%d\", j > 0 ? \",\" : \"\", adj[i][j]);\n        printf(\"]\\n\");\n    }\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int v, e; cin >> v >> e;\n    vector<vector<int>> adj(v);\n    for (int i = 0; i < e; i++) { int a, b; cin >> a >> b; adj[a].push_back(b); adj[b].push_back(a); }\n    for (int i = 0; i < v; i++) {\n        sort(adj[i].begin(), adj[i].end());\n        cout << i << \" -> [\";\n        for (size_t j = 0; j < adj[i].size(); j++) { if (j) cout << ','; cout << adj[i][j]; }\n        cout << \"]\\n\";\n    }\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst v = d[0], e = d[1];\nconst adj = Array.from({ length: v }, () => []);\nlet idx = 2;\nfor (let i = 0; i < e; i++) {\n    const a = d[idx++], b = d[idx++];\n    adj[a].push(b); adj[b].push(a);\n}\nconst out = [];\nfor (let i = 0; i < v; i++) {\n    adj[i].sort((x, y) => x - y);\n    out.push(`${i} -> [${adj[i].join(',')}]`);\n}\nconsole.log(out.join('\\n'));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1 0","expected":"0 -> []","hidden":true},{"input":"3 0","expected":"0 -> []\n1 -> []\n2 -> []","hidden":true},{"input":"3 3\n0 1\n1 2\n2 0","expected":"0 -> [1,2]\n1 -> [0,2]\n2 -> [0,1]","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 121
)
on conflict (id) do nothing;

-- 122. BFS Traversal  [Easy]  /practice/problems/bfs-traversal
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-graph-122', 'dt-practice-graph', null,
  $px$BFS Traversal$px$, $px$bfs-traversal$px$, $px$Easy$px$,
  $px$Given an undirected graph and a starting vertex `S`, visit all reachable vertices using Breadth-First Search. When a vertex is expanded, consider its neighbours in increasing order.

**Input Format**

The first line contains two integers `V` and `E`.
Each of the next `E` lines contains an undirected edge `u v`.
The last line contains the starting vertex `S`.

**Output Format**

Print the BFS visit order (only reachable vertices), separated by single spaces.$px$,
  $px$[{"input":"5 4\n0 1\n0 2\n1 3\n2 4\n0","output":"0 1 2 3 4","explanation":"BFS visits vertices level by level."}]$px$::jsonb,
  $px$["1 <= V <= 100000","0 <= E <= 200000","0 <= u, v, S < V"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int v = Integer.parseInt(st.nextToken()), e = Integer.parseInt(st.nextToken());\n        List<List<Integer>> adj = new ArrayList<>();\n        for (int i = 0; i < v; i++) adj.add(new ArrayList<>());\n        for (int i = 0; i < e; i++) {\n            int a = Integer.parseInt(st.nextToken()), b = Integer.parseInt(st.nextToken());\n            adj.get(a).add(b); adj.get(b).add(a);\n        }\n        for (int i = 0; i < v; i++) Collections.sort(adj.get(i));\n        int s = Integer.parseInt(st.nextToken());\n        boolean[] vis = new boolean[v];\n        ArrayDeque<Integer> dq = new ArrayDeque<>();\n        dq.add(s); vis[s] = true;\n        StringBuilder sb = new StringBuilder();\n        boolean first = true;\n        while (!dq.isEmpty()) {\n            int x = dq.poll();\n            if (!first) sb.append(' '); sb.append(x); first = false;\n            for (int y : adj.get(x)) if (!vis[y]) { vis[y] = true; dq.add(y); }\n        }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nfrom collections import deque\nd = sys.stdin.read().split()\nv, e = int(d[0]), int(d[1])\nadj = [[] for _ in range(v)]\nidx = 2\nfor _ in range(e):\n    a, b = int(d[idx]), int(d[idx + 1]); idx += 2\n    adj[a].append(b); adj[b].append(a)\nfor i in range(v):\n    adj[i].sort()\ns = int(d[idx])\nvis = [False] * v\norder = []\ndq = deque([s]); vis[s] = True\nwhile dq:\n    x = dq.popleft()\n    order.append(x)\n    for y in adj[x]:\n        if not vis[y]:\n            vis[y] = True\n            dq.append(y)\nprint(' '.join(map(str, order)))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint cmp(const void *p, const void *q) { return *(const int*)p - *(const int*)q; }\nint main(void) {\n    int v, e;\n    if (scanf(\"%d %d\", &v, &e) != 2) return 0;\n    int *deg = calloc(v, sizeof(int));\n    int *ea = malloc(sizeof(int) * e), *eb = malloc(sizeof(int) * e);\n    for (int i = 0; i < e; i++) { scanf(\"%d %d\", &ea[i], &eb[i]); deg[ea[i]]++; deg[eb[i]]++; }\n    int **adj = malloc(sizeof(int*) * v);\n    int *fill = calloc(v, sizeof(int));\n    for (int i = 0; i < v; i++) adj[i] = malloc(sizeof(int) * (deg[i] > 0 ? deg[i] : 1));\n    for (int i = 0; i < e; i++) { adj[ea[i]][fill[ea[i]]++] = eb[i]; adj[eb[i]][fill[eb[i]]++] = ea[i]; }\n    for (int i = 0; i < v; i++) qsort(adj[i], deg[i], sizeof(int), cmp);\n    int s; scanf(\"%d\", &s);\n    int *vis = calloc(v, sizeof(int));\n    int *q = malloc(sizeof(int) * v); int qh = 0, qt = 0;\n    q[qt++] = s; vis[s] = 1;\n    int first = 1;\n    while (qh < qt) {\n        int x = q[qh++];\n        if (!first) putchar(' ');\n        printf(\"%d\", x); first = 0;\n        for (int j = 0; j < deg[x]; j++) { int y = adj[x][j]; if (!vis[y]) { vis[y] = 1; q[qt++] = y; } }\n    }\n    putchar('\\n');\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <queue>\n#include <algorithm>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int v, e; cin >> v >> e;\n    vector<vector<int>> adj(v);\n    for (int i = 0; i < e; i++) { int a, b; cin >> a >> b; adj[a].push_back(b); adj[b].push_back(a); }\n    for (int i = 0; i < v; i++) sort(adj[i].begin(), adj[i].end());\n    int s; cin >> s;\n    vector<char> vis(v, 0);\n    queue<int> q; q.push(s); vis[s] = 1;\n    bool first = true;\n    while (!q.empty()) {\n        int x = q.front(); q.pop();\n        if (!first) cout << ' '; cout << x; first = false;\n        for (int y : adj[x]) if (!vis[y]) { vis[y] = 1; q.push(y); }\n    }\n    cout << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst v = d[0], e = d[1];\nconst adj = Array.from({ length: v }, () => []);\nlet idx = 2;\nfor (let i = 0; i < e; i++) { const a = d[idx++], b = d[idx++]; adj[a].push(b); adj[b].push(a); }\nfor (let i = 0; i < v; i++) adj[i].sort((x, y) => x - y);\nconst s = d[idx];\nconst vis = new Array(v).fill(false);\nconst q = [s]; let qh = 0; vis[s] = true;\nconst order = [];\nwhile (qh < q.length) {\n    const x = q[qh++];\n    order.push(x);\n    for (const y of adj[x]) if (!vis[y]) { vis[y] = true; q.push(y); }\n}\nconsole.log(order.join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1 0\n0","expected":"0","hidden":true},{"input":"4 2\n0 1\n2 3\n0","expected":"0 1","hidden":true},{"input":"5 5\n0 1\n0 4\n1 2\n1 3\n3 4\n2","expected":"2 1 0 3 4","hidden":true},{"input":"3 3\n0 1\n1 2\n2 0\n1","expected":"1 0 2","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 122
)
on conflict (id) do nothing;

-- 123. DFS Traversal  [Easy]  /practice/problems/dfs-traversal
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-graph-123', 'dt-practice-graph', null,
  $px$DFS Traversal$px$, $px$dfs-traversal$px$, $px$Easy$px$,
  $px$Given an undirected graph and a starting vertex `S`, visit all reachable vertices using Depth-First Search. When a vertex is expanded, visit its neighbours in increasing order.

**Input Format**

The first line contains two integers `V` and `E`.
Each of the next `E` lines contains an undirected edge `u v`.
The last line contains the starting vertex `S`.

**Output Format**

Print the DFS visit order (only reachable vertices), separated by single spaces.$px$,
  $px$[{"input":"5 4\n0 1\n0 2\n1 3\n2 4\n0","output":"0 1 3 2 4","explanation":"DFS explores as far as possible along one branch before backtracking."}]$px$::jsonb,
  $px$["1 <= V <= 100000","0 <= E <= 200000","0 <= u, v, S < V"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    static List<List<Integer>> adj;\n    static boolean[] vis;\n    static StringBuilder sb = new StringBuilder();\n    static boolean first = true;\n    static void dfs(int u) {\n        vis[u] = true;\n        if (!first) sb.append(' '); sb.append(u); first = false;\n        for (int w : adj.get(u)) if (!vis[w]) dfs(w);\n    }\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int v = Integer.parseInt(st.nextToken()), e = Integer.parseInt(st.nextToken());\n        adj = new ArrayList<>();\n        for (int i = 0; i < v; i++) adj.add(new ArrayList<>());\n        for (int i = 0; i < e; i++) {\n            int a = Integer.parseInt(st.nextToken()), b = Integer.parseInt(st.nextToken());\n            adj.get(a).add(b); adj.get(b).add(a);\n        }\n        for (int i = 0; i < v; i++) Collections.sort(adj.get(i));\n        int s = Integer.parseInt(st.nextToken());\n        vis = new boolean[v];\n        dfs(s);\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nsys.setrecursionlimit(300000)\nd = sys.stdin.read().split()\nv, e = int(d[0]), int(d[1])\nadj = [[] for _ in range(v)]\nidx = 2\nfor _ in range(e):\n    a, b = int(d[idx]), int(d[idx + 1]); idx += 2\n    adj[a].append(b); adj[b].append(a)\nfor i in range(v):\n    adj[i].sort()\ns = int(d[idx])\nvis = [False] * v\norder = []\nstack = [s]\nvis[s] = True\n# iterative DFS with neighbour order preserved\ndef dfs(u):\n    vis[u] = True\n    order.append(u)\n    for w in adj[u]:\n        if not vis[w]:\n            dfs(w)\nvis = [False] * v\ndfs(s)\nprint(' '.join(map(str, order)))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint cmp(const void *p, const void *q) { return *(const int*)p - *(const int*)q; }\nint **adj; int *deg, *vis; int first = 1;\nvoid dfs(int u) {\n    vis[u] = 1;\n    if (!first) putchar(' ');\n    printf(\"%d\", u); first = 0;\n    for (int j = 0; j < deg[u]; j++) { int w = adj[u][j]; if (!vis[w]) dfs(w); }\n}\nint main(void) {\n    int v, e;\n    if (scanf(\"%d %d\", &v, &e) != 2) return 0;\n    deg = calloc(v, sizeof(int));\n    int *ea = malloc(sizeof(int) * e), *eb = malloc(sizeof(int) * e);\n    for (int i = 0; i < e; i++) { scanf(\"%d %d\", &ea[i], &eb[i]); deg[ea[i]]++; deg[eb[i]]++; }\n    adj = malloc(sizeof(int*) * v);\n    int *fill = calloc(v, sizeof(int));\n    for (int i = 0; i < v; i++) adj[i] = malloc(sizeof(int) * (deg[i] > 0 ? deg[i] : 1));\n    for (int i = 0; i < e; i++) { adj[ea[i]][fill[ea[i]]++] = eb[i]; adj[eb[i]][fill[eb[i]]++] = ea[i]; }\n    for (int i = 0; i < v; i++) qsort(adj[i], deg[i], sizeof(int), cmp);\n    int s; scanf(\"%d\", &s);\n    vis = calloc(v, sizeof(int));\n    dfs(s);\n    putchar('\\n');\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nvector<vector<int>> adj;\nvector<char> vis;\nbool first = true;\nvoid dfs(int u) {\n    vis[u] = 1;\n    if (!first) cout << ' '; cout << u; first = false;\n    for (int w : adj[u]) if (!vis[w]) dfs(w);\n}\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int v, e; cin >> v >> e;\n    adj.assign(v, {});\n    for (int i = 0; i < e; i++) { int a, b; cin >> a >> b; adj[a].push_back(b); adj[b].push_back(a); }\n    for (int i = 0; i < v; i++) sort(adj[i].begin(), adj[i].end());\n    int s; cin >> s;\n    vis.assign(v, 0);\n    dfs(s);\n    cout << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst v = d[0], e = d[1];\nconst adj = Array.from({ length: v }, () => []);\nlet idx = 2;\nfor (let i = 0; i < e; i++) { const a = d[idx++], b = d[idx++]; adj[a].push(b); adj[b].push(a); }\nfor (let i = 0; i < v; i++) adj[i].sort((x, y) => x - y);\nconst s = d[idx];\nconst vis = new Array(v).fill(false);\nconst order = [];\nconst stack = [s];\nwhile (stack.length) {\n    const u = stack.pop();\n    if (vis[u]) continue;\n    vis[u] = true;\n    order.push(u);\n    for (let j = adj[u].length - 1; j >= 0; j--) if (!vis[adj[u][j]]) stack.push(adj[u][j]);\n}\nconsole.log(order.join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1 0\n0","expected":"0","hidden":true},{"input":"4 2\n0 1\n2 3\n0","expected":"0 1","hidden":true},{"input":"5 5\n0 1\n0 4\n1 2\n1 3\n3 4\n0","expected":"0 1 2 3 4","hidden":true},{"input":"3 3\n0 1\n1 2\n2 0\n1","expected":"1 0 2","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 123
)
on conflict (id) do nothing;

-- 124. Detect Cycle in Undirected Graph  [Medium]  /practice/problems/detect-cycle-in-undirected-graph
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-graph-124', 'dt-practice-graph', null,
  $px$Detect Cycle in Undirected Graph$px$, $px$detect-cycle-in-undirected-graph$px$, $px$Medium$px$,
  $px$Given an undirected graph, determine whether it contains at least one cycle.

**Input Format**

The first line contains two integers `V` and `E`.
Each of the next `E` lines contains an undirected edge `u v`.

**Output Format**

Print `1` if the graph contains a cycle, otherwise print `0`.$px$,
  $px$[{"input":"3 3\n0 1\n1 2\n2 0","output":"1","explanation":"The three vertices form a closed loop."}]$px$::jsonb,
  $px$["1 <= V <= 100000","0 <= E <= 200000","0 <= u, v < V","There are no self-loops or repeated edges."]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    static int[] par;\n    static int find(int x) { while (par[x] != x) { par[x] = par[par[x]]; x = par[x]; } return x; }\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int v = Integer.parseInt(st.nextToken()), e = Integer.parseInt(st.nextToken());\n        par = new int[v];\n        for (int i = 0; i < v; i++) par[i] = i;\n        int cyc = 0;\n        for (int i = 0; i < e; i++) {\n            int a = Integer.parseInt(st.nextToken()), b = Integer.parseInt(st.nextToken());\n            int ra = find(a), rb = find(b);\n            if (ra == rb) cyc = 1; else par[ra] = rb;\n        }\n        System.out.println(cyc);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nv, e = int(d[0]), int(d[1])\npar = list(range(v))\ndef find(x):\n    while par[x] != x:\n        par[x] = par[par[x]]\n        x = par[x]\n    return x\nidx = 2\ncyc = 0\nfor _ in range(e):\n    a, b = int(d[idx]), int(d[idx + 1]); idx += 2\n    ra, rb = find(a), find(b)\n    if ra == rb:\n        cyc = 1\n    else:\n        par[ra] = rb\nprint(cyc)\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint *par;\nint find(int x) { while (par[x] != x) { par[x] = par[par[x]]; x = par[x]; } return x; }\nint main(void) {\n    int v, e;\n    if (scanf(\"%d %d\", &v, &e) != 2) return 0;\n    par = malloc(sizeof(int) * v);\n    for (int i = 0; i < v; i++) par[i] = i;\n    int cyc = 0;\n    for (int i = 0; i < e; i++) {\n        int a, b; scanf(\"%d %d\", &a, &b);\n        int ra = find(a), rb = find(b);\n        if (ra == rb) cyc = 1; else par[ra] = rb;\n    }\n    printf(\"%d\\n\", cyc);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\nusing namespace std;\nvector<int> par;\nint find(int x) { while (par[x] != x) { par[x] = par[par[x]]; x = par[x]; } return x; }\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int v, e; cin >> v >> e;\n    par.resize(v);\n    for (int i = 0; i < v; i++) par[i] = i;\n    int cyc = 0;\n    for (int i = 0; i < e; i++) {\n        int a, b; cin >> a >> b;\n        int ra = find(a), rb = find(b);\n        if (ra == rb) cyc = 1; else par[ra] = rb;\n    }\n    cout << cyc << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst v = d[0], e = d[1];\nconst par = Array.from({ length: v }, (_, i) => i);\nfunction find(x) { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; }\nlet idx = 2, cyc = 0;\nfor (let i = 0; i < e; i++) {\n    const a = d[idx++], b = d[idx++];\n    const ra = find(a), rb = find(b);\n    if (ra === rb) cyc = 1; else par[ra] = rb;\n}\nconsole.log(cyc);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"3 2\n0 1\n1 2","expected":"0","hidden":true},{"input":"1 0","expected":"0","hidden":true},{"input":"5 4\n0 1\n1 2\n3 4\n2 0","expected":"1","hidden":true},{"input":"4 3\n0 1\n1 2\n2 3","expected":"0","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 124
)
on conflict (id) do nothing;

-- 125. Detect Cycle in Directed Graph  [Medium]  /practice/problems/detect-cycle-in-directed-graph
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-graph-125', 'dt-practice-graph', null,
  $px$Detect Cycle in Directed Graph$px$, $px$detect-cycle-in-directed-graph$px$, $px$Medium$px$,
  $px$Given a directed graph, determine whether it contains a directed cycle.

**Input Format**

The first line contains two integers `V` and `E`.
Each of the next `E` lines contains a directed edge `u v` (from `u` to `v`).

**Output Format**

Print `1` if a directed cycle exists, otherwise print `0`.$px$,
  $px$[{"input":"3 3\n0 1\n1 2\n2 0","output":"1","explanation":"0 -> 1 -> 2 -> 0 forms a directed cycle."}]$px$::jsonb,
  $px$["1 <= V <= 100000","0 <= E <= 200000","0 <= u, v < V"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int v = Integer.parseInt(st.nextToken()), e = Integer.parseInt(st.nextToken());\n        List<List<Integer>> adj = new ArrayList<>();\n        for (int i = 0; i < v; i++) adj.add(new ArrayList<>());\n        int[] indeg = new int[v];\n        for (int i = 0; i < e; i++) {\n            int a = Integer.parseInt(st.nextToken()), b = Integer.parseInt(st.nextToken());\n            adj.get(a).add(b); indeg[b]++;\n        }\n        ArrayDeque<Integer> dq = new ArrayDeque<>();\n        for (int i = 0; i < v; i++) if (indeg[i] == 0) dq.add(i);\n        int cnt = 0;\n        while (!dq.isEmpty()) {\n            int x = dq.poll(); cnt++;\n            for (int y : adj.get(x)) if (--indeg[y] == 0) dq.add(y);\n        }\n        System.out.println(cnt == v ? 0 : 1);\n    }\n}\n","python":"import sys\nfrom collections import deque\nd = sys.stdin.read().split()\nv, e = int(d[0]), int(d[1])\nadj = [[] for _ in range(v)]\nindeg = [0] * v\nidx = 2\nfor _ in range(e):\n    a, b = int(d[idx]), int(d[idx + 1]); idx += 2\n    adj[a].append(b)\n    indeg[b] += 1\ndq = deque(i for i in range(v) if indeg[i] == 0)\ncnt = 0\nwhile dq:\n    x = dq.popleft()\n    cnt += 1\n    for y in adj[x]:\n        indeg[y] -= 1\n        if indeg[y] == 0:\n            dq.append(y)\nprint(0 if cnt == v else 1)\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    int v, e;\n    if (scanf(\"%d %d\", &v, &e) != 2) return 0;\n    int *deg = calloc(v, sizeof(int)), *indeg = calloc(v, sizeof(int));\n    int *ea = malloc(sizeof(int) * e), *eb = malloc(sizeof(int) * e);\n    for (int i = 0; i < e; i++) { scanf(\"%d %d\", &ea[i], &eb[i]); deg[ea[i]]++; indeg[eb[i]]++; }\n    int **adj = malloc(sizeof(int*) * v);\n    int *fill = calloc(v, sizeof(int));\n    for (int i = 0; i < v; i++) adj[i] = malloc(sizeof(int) * (deg[i] > 0 ? deg[i] : 1));\n    for (int i = 0; i < e; i++) adj[ea[i]][fill[ea[i]]++] = eb[i];\n    int *q = malloc(sizeof(int) * v); int qh = 0, qt = 0;\n    for (int i = 0; i < v; i++) if (indeg[i] == 0) q[qt++] = i;\n    int cnt = 0;\n    while (qh < qt) {\n        int x = q[qh++]; cnt++;\n        for (int j = 0; j < deg[x]; j++) { int y = adj[x][j]; if (--indeg[y] == 0) q[qt++] = y; }\n    }\n    printf(\"%d\\n\", cnt == v ? 0 : 1);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <queue>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int v, e; cin >> v >> e;\n    vector<vector<int>> adj(v);\n    vector<int> indeg(v, 0);\n    for (int i = 0; i < e; i++) { int a, b; cin >> a >> b; adj[a].push_back(b); indeg[b]++; }\n    queue<int> q;\n    for (int i = 0; i < v; i++) if (indeg[i] == 0) q.push(i);\n    int cnt = 0;\n    while (!q.empty()) {\n        int x = q.front(); q.pop(); cnt++;\n        for (int y : adj[x]) if (--indeg[y] == 0) q.push(y);\n    }\n    cout << (cnt == v ? 0 : 1) << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst v = d[0], e = d[1];\nconst adj = Array.from({ length: v }, () => []);\nconst indeg = new Array(v).fill(0);\nlet idx = 2;\nfor (let i = 0; i < e; i++) { const a = d[idx++], b = d[idx++]; adj[a].push(b); indeg[b]++; }\nconst q = []; let qh = 0;\nfor (let i = 0; i < v; i++) if (indeg[i] === 0) q.push(i);\nlet cnt = 0;\nwhile (qh < q.length) {\n    const x = q[qh++]; cnt++;\n    for (const y of adj[x]) if (--indeg[y] === 0) q.push(y);\n}\nconsole.log(cnt === v ? 0 : 1);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"3 2\n0 1\n1 2","expected":"0","hidden":true},{"input":"4 4\n0 1\n1 2\n2 3\n3 1","expected":"1","hidden":true},{"input":"1 0","expected":"0","hidden":true},{"input":"4 3\n0 1\n0 2\n1 3","expected":"0","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 125
)
on conflict (id) do nothing;

-- 126. Shortest Path in Unweighted Graph  [Medium]  /practice/problems/shortest-path-in-unweighted-graph
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-graph-126', 'dt-practice-graph', null,
  $px$Shortest Path in Unweighted Graph$px$, $px$shortest-path-in-unweighted-graph$px$, $px$Medium$px$,
  $px$Given an unweighted undirected graph, find the minimum number of edges on a path from a source vertex `S` to a destination vertex `D`.

**Input Format**

The first line contains two integers `V` and `E`.
Each of the next `E` lines contains an undirected edge `u v`.
The last line contains two integers `S` and `D`.

**Output Format**

Print the shortest distance in edges, or `-1` if `D` is not reachable from `S`.$px$,
  $px$[{"input":"5 5\n0 1\n0 2\n1 3\n2 3\n3 4\n0 4","output":"3","explanation":"One shortest route is 0 -> 1 -> 3 -> 4, using three edges."}]$px$::jsonb,
  $px$["1 <= V <= 100000","0 <= E <= 200000","0 <= u, v, S, D < V"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int v = Integer.parseInt(st.nextToken()), e = Integer.parseInt(st.nextToken());\n        List<List<Integer>> adj = new ArrayList<>();\n        for (int i = 0; i < v; i++) adj.add(new ArrayList<>());\n        for (int i = 0; i < e; i++) {\n            int a = Integer.parseInt(st.nextToken()), b = Integer.parseInt(st.nextToken());\n            adj.get(a).add(b); adj.get(b).add(a);\n        }\n        int s = Integer.parseInt(st.nextToken()), dst = Integer.parseInt(st.nextToken());\n        int[] dist = new int[v];\n        Arrays.fill(dist, -1);\n        dist[s] = 0;\n        ArrayDeque<Integer> dq = new ArrayDeque<>();\n        dq.add(s);\n        while (!dq.isEmpty()) {\n            int x = dq.poll();\n            for (int y : adj.get(x)) if (dist[y] == -1) { dist[y] = dist[x] + 1; dq.add(y); }\n        }\n        System.out.println(dist[dst]);\n    }\n}\n","python":"import sys\nfrom collections import deque\nd = sys.stdin.read().split()\nv, e = int(d[0]), int(d[1])\nadj = [[] for _ in range(v)]\nidx = 2\nfor _ in range(e):\n    a, b = int(d[idx]), int(d[idx + 1]); idx += 2\n    adj[a].append(b); adj[b].append(a)\ns, dst = int(d[idx]), int(d[idx + 1])\ndist = [-1] * v\ndist[s] = 0\ndq = deque([s])\nwhile dq:\n    x = dq.popleft()\n    for y in adj[x]:\n        if dist[y] == -1:\n            dist[y] = dist[x] + 1\n            dq.append(y)\nprint(dist[dst])\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    int v, e;\n    if (scanf(\"%d %d\", &v, &e) != 2) return 0;\n    int *deg = calloc(v, sizeof(int));\n    int *ea = malloc(sizeof(int) * e), *eb = malloc(sizeof(int) * e);\n    for (int i = 0; i < e; i++) { scanf(\"%d %d\", &ea[i], &eb[i]); deg[ea[i]]++; deg[eb[i]]++; }\n    int **adj = malloc(sizeof(int*) * v);\n    int *fill = calloc(v, sizeof(int));\n    for (int i = 0; i < v; i++) adj[i] = malloc(sizeof(int) * (deg[i] > 0 ? deg[i] : 1));\n    for (int i = 0; i < e; i++) { adj[ea[i]][fill[ea[i]]++] = eb[i]; adj[eb[i]][fill[eb[i]]++] = ea[i]; }\n    int s, dst; scanf(\"%d %d\", &s, &dst);\n    int *dist = malloc(sizeof(int) * v);\n    for (int i = 0; i < v; i++) dist[i] = -1;\n    dist[s] = 0;\n    int *q = malloc(sizeof(int) * v); int qh = 0, qt = 0; q[qt++] = s;\n    while (qh < qt) {\n        int x = q[qh++];\n        for (int j = 0; j < deg[x]; j++) { int y = adj[x][j]; if (dist[y] == -1) { dist[y] = dist[x] + 1; q[qt++] = y; } }\n    }\n    printf(\"%d\\n\", dist[dst]);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <queue>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int v, e; cin >> v >> e;\n    vector<vector<int>> adj(v);\n    for (int i = 0; i < e; i++) { int a, b; cin >> a >> b; adj[a].push_back(b); adj[b].push_back(a); }\n    int s, dst; cin >> s >> dst;\n    vector<int> dist(v, -1);\n    dist[s] = 0;\n    queue<int> q; q.push(s);\n    while (!q.empty()) {\n        int x = q.front(); q.pop();\n        for (int y : adj[x]) if (dist[y] == -1) { dist[y] = dist[x] + 1; q.push(y); }\n    }\n    cout << dist[dst] << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst v = d[0], e = d[1];\nconst adj = Array.from({ length: v }, () => []);\nlet idx = 2;\nfor (let i = 0; i < e; i++) { const a = d[idx++], b = d[idx++]; adj[a].push(b); adj[b].push(a); }\nconst s = d[idx++], dst = d[idx];\nconst dist = new Array(v).fill(-1);\ndist[s] = 0;\nconst q = [s]; let qh = 0;\nwhile (qh < q.length) {\n    const x = q[qh++];\n    for (const y of adj[x]) if (dist[y] === -1) { dist[y] = dist[x] + 1; q.push(y); }\n}\nconsole.log(dist[dst]);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1 0\n0 0","expected":"0","hidden":true},{"input":"4 2\n0 1\n2 3\n0 3","expected":"-1","hidden":true},{"input":"3 3\n0 1\n1 2\n2 0\n0 2","expected":"1","hidden":true},{"input":"5 4\n0 1\n1 2\n2 3\n3 4\n0 4","expected":"4","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 126
)
on conflict (id) do nothing;

-- 127. Dijkstra Shortest Path  [Hard]  /practice/problems/dijkstra-shortest-path
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-graph-127', 'dt-practice-graph', null,
  $px$Dijkstra Shortest Path$px$, $px$dijkstra-shortest-path$px$, $px$Hard$px$,
  $px$Given a directed graph with non-negative edge weights, find the shortest distance from a source vertex `S` to every vertex.

**Input Format**

The first line contains two integers `V` and `E`.
Each of the next `E` lines contains a directed edge `u v w` (from `u` to `v` with weight `w`).
The last line contains the source vertex `S`.

**Output Format**

Print `V` space-separated integers: the shortest distance from `S` to vertex `0`, `1`, ..., `V-1`. Use `-1` for a vertex that cannot be reached.$px$,
  $px$[{"input":"4 4\n0 1 4\n0 2 1\n2 1 2\n1 3 1\n0","output":"0 3 1 4","explanation":"The shortest route from 0 to 1 is 0 -> 2 -> 1 with cost 3."}]$px$::jsonb,
  $px$["1 <= V <= 100000","0 <= E <= 200000","0 <= w <= 1000000000","0 <= u, v, S < V"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int v = Integer.parseInt(st.nextToken()), e = Integer.parseInt(st.nextToken());\n        List<long[]>[] adj = new List[v];\n        for (int i = 0; i < v; i++) adj[i] = new ArrayList<>();\n        for (int i = 0; i < e; i++) {\n            int a = Integer.parseInt(st.nextToken()), b = Integer.parseInt(st.nextToken());\n            long w = Long.parseLong(st.nextToken());\n            adj[a].add(new long[]{b, w});\n        }\n        int s = Integer.parseInt(st.nextToken());\n        long INF = Long.MAX_VALUE / 4;\n        long[] dist = new long[v];\n        Arrays.fill(dist, INF);\n        dist[s] = 0;\n        PriorityQueue<long[]> pq = new PriorityQueue<>((p, q) -> Long.compare(p[0], q[0]));\n        pq.add(new long[]{0, s});\n        while (!pq.isEmpty()) {\n            long[] cur = pq.poll();\n            long dd = cur[0]; int x = (int) cur[1];\n            if (dd > dist[x]) continue;\n            for (long[] ed : adj[x]) {\n                int y = (int) ed[0]; long nd = dd + ed[1];\n                if (nd < dist[y]) { dist[y] = nd; pq.add(new long[]{nd, y}); }\n            }\n        }\n        StringBuilder sb = new StringBuilder();\n        for (int i = 0; i < v; i++) { if (i > 0) sb.append(' '); sb.append(dist[i] == INF ? -1 : dist[i]); }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys, heapq\nd = sys.stdin.read().split()\nv, e = int(d[0]), int(d[1])\nadj = [[] for _ in range(v)]\nidx = 2\nfor _ in range(e):\n    a, b, w = int(d[idx]), int(d[idx + 1]), int(d[idx + 2]); idx += 3\n    adj[a].append((b, w))\ns = int(d[idx])\nINF = float('inf')\ndist = [INF] * v\ndist[s] = 0\npq = [(0, s)]\nwhile pq:\n    dd, x = heapq.heappop(pq)\n    if dd > dist[x]:\n        continue\n    for y, w in adj[x]:\n        nd = dd + w\n        if nd < dist[y]:\n            dist[y] = nd\n            heapq.heappush(pq, (nd, y))\nprint(' '.join(str(x if x != INF else -1) for x in dist))\n","c":"#include <stdio.h>\n#include <stdlib.h>\ntypedef struct { long long d; int v; } Node;\nlong long *dist;\nNode *heap; int hn = 0;\nvoid hpush(long long d, int v) {\n    heap[hn].d = d; heap[hn].v = v; int i = hn++;\n    while (i > 0) { int p = (i - 1) / 2; if (heap[p].d <= heap[i].d) break; Node t = heap[p]; heap[p] = heap[i]; heap[i] = t; i = p; }\n}\nNode hpop(void) {\n    Node r = heap[0];\n    heap[0] = heap[--hn];\n    int i = 0;\n    while (1) {\n        int l = 2 * i + 1, rr = 2 * i + 2, s = i;\n        if (l < hn && heap[l].d < heap[s].d) s = l;\n        if (rr < hn && heap[rr].d < heap[s].d) s = rr;\n        if (s == i) break;\n        Node t = heap[s]; heap[s] = heap[i]; heap[i] = t; i = s;\n    }\n    return r;\n}\nint main(void) {\n    int v, e;\n    if (scanf(\"%d %d\", &v, &e) != 2) return 0;\n    int *deg = calloc(v, sizeof(int));\n    int *ea = malloc(sizeof(int) * e), *eb = malloc(sizeof(int) * e);\n    long long *ew = malloc(sizeof(long long) * e);\n    for (int i = 0; i < e; i++) { scanf(\"%d %d %lld\", &ea[i], &eb[i], &ew[i]); deg[ea[i]]++; }\n    int **to = malloc(sizeof(int*) * v);\n    long long **wt = malloc(sizeof(long long*) * v);\n    int *fill = calloc(v, sizeof(int));\n    for (int i = 0; i < v; i++) { to[i] = malloc(sizeof(int) * (deg[i] > 0 ? deg[i] : 1)); wt[i] = malloc(sizeof(long long) * (deg[i] > 0 ? deg[i] : 1)); }\n    for (int i = 0; i < e; i++) { int u = ea[i]; to[u][fill[u]] = eb[i]; wt[u][fill[u]] = ew[i]; fill[u]++; }\n    int s; scanf(\"%d\", &s);\n    long long INF = (long long)4e18;\n    dist = malloc(sizeof(long long) * v);\n    for (int i = 0; i < v; i++) dist[i] = INF;\n    dist[s] = 0;\n    heap = malloc(sizeof(Node) * (e + 5));\n    hpush(0, s);\n    while (hn > 0) {\n        Node cur = hpop();\n        if (cur.d > dist[cur.v]) continue;\n        for (int j = 0; j < deg[cur.v]; j++) {\n            int y = to[cur.v][j];\n            long long nd = cur.d + wt[cur.v][j];\n            if (nd < dist[y]) { dist[y] = nd; hpush(nd, y); }\n        }\n    }\n    for (int i = 0; i < v; i++) printf(\"%lld%s\", dist[i] == INF ? -1 : dist[i], i + 1 < v ? \" \" : \"\\n\");\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <queue>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int v, e; cin >> v >> e;\n    vector<vector<pair<int,long long>>> adj(v);\n    for (int i = 0; i < e; i++) { int a, b; long long w; cin >> a >> b >> w; adj[a].push_back({b, w}); }\n    int s; cin >> s;\n    const long long INF = (long long)4e18;\n    vector<long long> dist(v, INF);\n    dist[s] = 0;\n    priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;\n    pq.push({0, s});\n    while (!pq.empty()) {\n        auto [dd, x] = pq.top(); pq.pop();\n        if (dd > dist[x]) continue;\n        for (auto [y, w] : adj[x]) {\n            long long nd = dd + w;\n            if (nd < dist[y]) { dist[y] = nd; pq.push({nd, y}); }\n        }\n    }\n    for (int i = 0; i < v; i++) cout << (dist[i] == INF ? -1 : dist[i]) << (i + 1 < v ? ' ' : '\\n');\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst v = d[0], e = d[1];\nconst adj = Array.from({ length: v }, () => []);\nlet idx = 2;\nfor (let i = 0; i < e; i++) { const a = d[idx++], b = d[idx++], w = d[idx++]; adj[a].push([b, w]); }\nconst s = d[idx];\nconst INF = Infinity;\nconst dist = new Array(v).fill(INF);\ndist[s] = 0;\n// binary min-heap of [dist, vertex]\nconst heap = [[0, s]];\nfunction hpush(item) { heap.push(item); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } }\nfunction hpop() { const r = heap[0]; const last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; while (true) { const l = 2 * i + 1, rr = 2 * i + 2; let sm = i; if (l < heap.length && heap[l][0] < heap[sm][0]) sm = l; if (rr < heap.length && heap[rr][0] < heap[sm][0]) sm = rr; if (sm === i) break; [heap[sm], heap[i]] = [heap[i], heap[sm]]; i = sm; } } return r; }\nwhile (heap.length) {\n    const [dd, x] = hpop();\n    if (dd > dist[x]) continue;\n    for (const [y, w] of adj[x]) {\n        const nd = dd + w;\n        if (nd < dist[y]) { dist[y] = nd; hpush([nd, y]); }\n    }\n}\nconsole.log(dist.map((x) => (x === INF ? -1 : x)).join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1 0\n0","expected":"0","hidden":true},{"input":"3 1\n0 1 5\n0","expected":"0 5 -1","hidden":true},{"input":"3 3\n0 1 1\n1 2 1\n0 2 5\n0","expected":"0 1 2","hidden":true},{"input":"4 4\n0 1 1\n1 2 1\n2 3 1\n0 3 10\n0","expected":"0 1 2 3","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 127
)
on conflict (id) do nothing;

-- 128. Topological Sort  [Medium]  /practice/problems/topological-sort
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-graph-128', 'dt-practice-graph', null,
  $px$Topological Sort$px$, $px$topological-sort$px$, $px$Medium$px$,
  $px$Given a directed acyclic graph, return the lexicographically smallest topological ordering of its vertices — an ordering in which, for every directed edge `u -> v`, `u` comes before `v`, and among all such orderings the one that is smallest when compared position by position.

**Input Format**

The first line contains two integers `V` and `E`.
Each of the next `E` lines contains a directed edge `u v`.

**Output Format**

Print the lexicographically smallest topological ordering, vertices separated by single spaces.$px$,
  $px$[{"input":"4 4\n0 1\n0 2\n1 3\n2 3","output":"0 1 2 3","explanation":"0 comes before 1 and 2, and both come before 3; picking the smallest available vertex each step gives this order."}]$px$::jsonb,
  $px$["1 <= V <= 100000","0 <= E <= 200000","The graph is acyclic.","0 <= u, v < V"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int v = Integer.parseInt(st.nextToken()), e = Integer.parseInt(st.nextToken());\n        List<List<Integer>> adj = new ArrayList<>();\n        for (int i = 0; i < v; i++) adj.add(new ArrayList<>());\n        int[] indeg = new int[v];\n        for (int i = 0; i < e; i++) {\n            int a = Integer.parseInt(st.nextToken()), b = Integer.parseInt(st.nextToken());\n            adj.get(a).add(b); indeg[b]++;\n        }\n        PriorityQueue<Integer> pq = new PriorityQueue<>();\n        for (int i = 0; i < v; i++) if (indeg[i] == 0) pq.add(i);\n        StringBuilder sb = new StringBuilder();\n        boolean first = true;\n        while (!pq.isEmpty()) {\n            int x = pq.poll();\n            if (!first) sb.append(' '); sb.append(x); first = false;\n            for (int y : adj.get(x)) if (--indeg[y] == 0) pq.add(y);\n        }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys, heapq\nd = sys.stdin.read().split()\nv, e = int(d[0]), int(d[1])\nadj = [[] for _ in range(v)]\nindeg = [0] * v\nidx = 2\nfor _ in range(e):\n    a, b = int(d[idx]), int(d[idx + 1]); idx += 2\n    adj[a].append(b)\n    indeg[b] += 1\npq = [i for i in range(v) if indeg[i] == 0]\nheapq.heapify(pq)\norder = []\nwhile pq:\n    x = heapq.heappop(pq)\n    order.append(x)\n    for y in adj[x]:\n        indeg[y] -= 1\n        if indeg[y] == 0:\n            heapq.heappush(pq, y)\nprint(' '.join(map(str, order)))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint heap[100001]; int hn = 0;\nvoid hpush(int x) { heap[hn] = x; int i = hn++; while (i > 0) { int p = (i - 1) / 2; if (heap[p] <= heap[i]) break; int t = heap[p]; heap[p] = heap[i]; heap[i] = t; i = p; } }\nint hpop(void) { int r = heap[0]; heap[0] = heap[--hn]; int i = 0; while (1) { int l = 2*i+1, rr = 2*i+2, s = i; if (l < hn && heap[l] < heap[s]) s = l; if (rr < hn && heap[rr] < heap[s]) s = rr; if (s == i) break; int t = heap[s]; heap[s] = heap[i]; heap[i] = t; i = s; } return r; }\nint main(void) {\n    int v, e;\n    if (scanf(\"%d %d\", &v, &e) != 2) return 0;\n    int *deg = calloc(v, sizeof(int)), *indeg = calloc(v, sizeof(int));\n    int *ea = malloc(sizeof(int) * e), *eb = malloc(sizeof(int) * e);\n    for (int i = 0; i < e; i++) { scanf(\"%d %d\", &ea[i], &eb[i]); deg[ea[i]]++; indeg[eb[i]]++; }\n    int **adj = malloc(sizeof(int*) * v);\n    int *fill = calloc(v, sizeof(int));\n    for (int i = 0; i < v; i++) adj[i] = malloc(sizeof(int) * (deg[i] > 0 ? deg[i] : 1));\n    for (int i = 0; i < e; i++) adj[ea[i]][fill[ea[i]]++] = eb[i];\n    for (int i = 0; i < v; i++) if (indeg[i] == 0) hpush(i);\n    int first = 1;\n    while (hn > 0) {\n        int x = hpop();\n        if (!first) putchar(' ');\n        printf(\"%d\", x); first = 0;\n        for (int j = 0; j < deg[x]; j++) { int y = adj[x][j]; if (--indeg[y] == 0) hpush(y); }\n    }\n    putchar('\\n');\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <queue>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int v, e; cin >> v >> e;\n    vector<vector<int>> adj(v);\n    vector<int> indeg(v, 0);\n    for (int i = 0; i < e; i++) { int a, b; cin >> a >> b; adj[a].push_back(b); indeg[b]++; }\n    priority_queue<int, vector<int>, greater<int>> pq;\n    for (int i = 0; i < v; i++) if (indeg[i] == 0) pq.push(i);\n    bool first = true;\n    while (!pq.empty()) {\n        int x = pq.top(); pq.pop();\n        if (!first) cout << ' '; cout << x; first = false;\n        for (int y : adj[x]) if (--indeg[y] == 0) pq.push(y);\n    }\n    cout << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst v = d[0], e = d[1];\nconst adj = Array.from({ length: v }, () => []);\nconst indeg = new Array(v).fill(0);\nlet idx = 2;\nfor (let i = 0; i < e; i++) { const a = d[idx++], b = d[idx++]; adj[a].push(b); indeg[b]++; }\nconst heap = [];\nfunction hpush(x) { heap.push(x); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p] <= heap[i]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } }\nfunction hpop() { const r = heap[0]; const last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; while (true) { const l = 2*i+1, rr = 2*i+2; let s = i; if (l < heap.length && heap[l] < heap[s]) s = l; if (rr < heap.length && heap[rr] < heap[s]) s = rr; if (s === i) break; [heap[s], heap[i]] = [heap[i], heap[s]]; i = s; } } return r; }\nfor (let i = 0; i < v; i++) if (indeg[i] === 0) hpush(i);\nconst order = [];\nwhile (heap.length) {\n    const x = hpop();\n    order.push(x);\n    for (const y of adj[x]) if (--indeg[y] === 0) hpush(y);\n}\nconsole.log(order.join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"3 0","expected":"0 1 2","hidden":true},{"input":"3 2\n2 0\n0 1","expected":"2 0 1","hidden":true},{"input":"5 4\n1 0\n2 0\n3 4\n4 0","expected":"1 2 3 4 0","hidden":true},{"input":"4 3\n0 1\n0 2\n0 3","expected":"0 1 2 3","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 128
)
on conflict (id) do nothing;

-- 129. Connected Components  [Easy]  /practice/problems/connected-components
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-graph-129', 'dt-practice-graph', null,
  $px$Connected Components$px$, $px$connected-components$px$, $px$Easy$px$,
  $px$Given an undirected graph, count how many connected components it has.

**Input Format**

The first line contains two integers `V` and `E`.
Each of the next `E` lines contains an undirected edge `u v`.

**Output Format**

Print the number of connected components.$px$,
  $px$[{"input":"5 3\n0 1\n1 2\n3 4","output":"2","explanation":"The groups are {0,1,2} and {3,4}."}]$px$::jsonb,
  $px$["1 <= V <= 100000","0 <= E <= 200000","0 <= u, v < V"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    static int[] par;\n    static int find(int x) { while (par[x] != x) { par[x] = par[par[x]]; x = par[x]; } return x; }\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int v = Integer.parseInt(st.nextToken()), e = Integer.parseInt(st.nextToken());\n        par = new int[v];\n        for (int i = 0; i < v; i++) par[i] = i;\n        for (int i = 0; i < e; i++) {\n            int a = Integer.parseInt(st.nextToken()), b = Integer.parseInt(st.nextToken());\n            par[find(a)] = find(b);\n        }\n        HashSet<Integer> roots = new HashSet<>();\n        for (int i = 0; i < v; i++) roots.add(find(i));\n        System.out.println(roots.size());\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nv, e = int(d[0]), int(d[1])\npar = list(range(v))\ndef find(x):\n    while par[x] != x:\n        par[x] = par[par[x]]\n        x = par[x]\n    return x\nidx = 2\nfor _ in range(e):\n    a, b = int(d[idx]), int(d[idx + 1]); idx += 2\n    par[find(a)] = find(b)\nprint(len({find(i) for i in range(v)}))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint *par;\nint find(int x) { while (par[x] != x) { par[x] = par[par[x]]; x = par[x]; } return x; }\nint main(void) {\n    int v, e;\n    if (scanf(\"%d %d\", &v, &e) != 2) return 0;\n    par = malloc(sizeof(int) * v);\n    for (int i = 0; i < v; i++) par[i] = i;\n    for (int i = 0; i < e; i++) { int a, b; scanf(\"%d %d\", &a, &b); par[find(a)] = find(b); }\n    int cnt = 0;\n    for (int i = 0; i < v; i++) if (find(i) == i) cnt++;\n    printf(\"%d\\n\", cnt);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\nusing namespace std;\nvector<int> par;\nint find(int x) { while (par[x] != x) { par[x] = par[par[x]]; x = par[x]; } return x; }\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int v, e; cin >> v >> e;\n    par.resize(v);\n    for (int i = 0; i < v; i++) par[i] = i;\n    for (int i = 0; i < e; i++) { int a, b; cin >> a >> b; par[find(a)] = find(b); }\n    int cnt = 0;\n    for (int i = 0; i < v; i++) if (find(i) == i) cnt++;\n    cout << cnt << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst v = d[0], e = d[1];\nconst par = Array.from({ length: v }, (_, i) => i);\nfunction find(x) { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; }\nlet idx = 2;\nfor (let i = 0; i < e; i++) { const a = d[idx++], b = d[idx++]; par[find(a)] = find(b); }\nlet cnt = 0;\nfor (let i = 0; i < v; i++) if (find(i) === i) cnt++;\nconsole.log(cnt);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"3 0","expected":"3","hidden":true},{"input":"1 0","expected":"1","hidden":true},{"input":"4 4\n0 1\n1 2\n2 3\n3 0","expected":"1","hidden":true},{"input":"6 2\n0 5\n2 3","expected":"4","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 129
)
on conflict (id) do nothing;

-- 130. Minimum Spanning Tree  [Hard]  /practice/problems/minimum-spanning-tree
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-graph-130', 'dt-practice-graph', null,
  $px$Minimum Spanning Tree$px$, $px$minimum-spanning-tree$px$, $px$Hard$px$,
  $px$Given a connected weighted undirected graph, find the total weight of its Minimum Spanning Tree.

**Input Format**

The first line contains two integers `V` and `E`.
Each of the next `E` lines contains an undirected weighted edge `u v w`.

**Output Format**

Print the total weight of the Minimum Spanning Tree.$px$,
  $px$[{"input":"4 5\n0 1 10\n0 2 6\n0 3 5\n1 3 15\n2 3 4","output":"19","explanation":"The MST uses edges of weight 4, 5 and 10 for a total of 19."}]$px$::jsonb,
  $px$["1 <= V <= 100000","V-1 <= E <= 200000","0 <= w <= 1000000000","The graph is connected."]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    static int[] par;\n    static int find(int x) { while (par[x] != x) { par[x] = par[par[x]]; x = par[x]; } return x; }\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int v = Integer.parseInt(st.nextToken()), e = Integer.parseInt(st.nextToken());\n        long[][] edges = new long[e][3];\n        for (int i = 0; i < e; i++) {\n            edges[i][1] = Long.parseLong(st.nextToken());\n            edges[i][2] = Long.parseLong(st.nextToken());\n            edges[i][0] = Long.parseLong(st.nextToken());\n        }\n        Arrays.sort(edges, (p, q) -> Long.compare(p[0], q[0]));\n        par = new int[v];\n        for (int i = 0; i < v; i++) par[i] = i;\n        long total = 0;\n        for (long[] ed : edges) {\n            int ra = find((int) ed[1]), rb = find((int) ed[2]);\n            if (ra != rb) { par[ra] = rb; total += ed[0]; }\n        }\n        System.out.println(total);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nv, e = int(d[0]), int(d[1])\nedges = []\nidx = 2\nfor _ in range(e):\n    a, b, w = int(d[idx]), int(d[idx + 1]), int(d[idx + 2]); idx += 3\n    edges.append((w, a, b))\nedges.sort()\npar = list(range(v))\ndef find(x):\n    while par[x] != x:\n        par[x] = par[par[x]]\n        x = par[x]\n    return x\ntotal = 0\nfor w, a, b in edges:\n    ra, rb = find(a), find(b)\n    if ra != rb:\n        par[ra] = rb\n        total += w\nprint(total)\n","c":"#include <stdio.h>\n#include <stdlib.h>\ntypedef struct { long long w; int a, b; } Edge;\nint cmp(const void *p, const void *q) { long long x = ((const Edge*)p)->w, y = ((const Edge*)q)->w; return (x > y) - (x < y); }\nint *par;\nint find(int x) { while (par[x] != x) { par[x] = par[par[x]]; x = par[x]; } return x; }\nint main(void) {\n    int v, e;\n    if (scanf(\"%d %d\", &v, &e) != 2) return 0;\n    Edge *ed = malloc(sizeof(Edge) * (e > 0 ? e : 1));\n    for (int i = 0; i < e; i++) scanf(\"%d %d %lld\", &ed[i].a, &ed[i].b, &ed[i].w);\n    qsort(ed, e, sizeof(Edge), cmp);\n    par = malloc(sizeof(int) * v);\n    for (int i = 0; i < v; i++) par[i] = i;\n    long long total = 0;\n    for (int i = 0; i < e; i++) {\n        int ra = find(ed[i].a), rb = find(ed[i].b);\n        if (ra != rb) { par[ra] = rb; total += ed[i].w; }\n    }\n    printf(\"%lld\\n\", total);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <array>\nusing namespace std;\nvector<int> par;\nint find(int x) { while (par[x] != x) { par[x] = par[par[x]]; x = par[x]; } return x; }\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int v, e; cin >> v >> e;\n    vector<array<long long,3>> edges(e);\n    for (int i = 0; i < e; i++) { long long a, b, w; cin >> a >> b >> w; edges[i] = {w, a, b}; }\n    sort(edges.begin(), edges.end());\n    par.resize(v);\n    for (int i = 0; i < v; i++) par[i] = i;\n    long long total = 0;\n    for (auto &ed : edges) {\n        int ra = find((int)ed[1]), rb = find((int)ed[2]);\n        if (ra != rb) { par[ra] = rb; total += ed[0]; }\n    }\n    cout << total << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst v = d[0], e = d[1];\nconst edges = [];\nlet idx = 2;\nfor (let i = 0; i < e; i++) { const a = d[idx++], b = d[idx++], w = d[idx++]; edges.push([w, a, b]); }\nedges.sort((p, q) => p[0] - q[0]);\nconst par = Array.from({ length: v }, (_, i) => i);\nfunction find(x) { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; }\nlet total = 0;\nfor (const [w, a, b] of edges) {\n    const ra = find(a), rb = find(b);\n    if (ra !== rb) { par[ra] = rb; total += w; }\n}\nconsole.log(total);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1 0","expected":"0","hidden":true},{"input":"2 1\n0 1 7","expected":"7","hidden":true},{"input":"3 3\n0 1 1\n1 2 2\n0 2 3","expected":"3","hidden":true},{"input":"4 4\n0 1 1\n1 2 1\n2 3 1\n3 0 1","expected":"3","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 130
)
on conflict (id) do nothing;

-- ===========================================================================
-- 3. VALIDATION  (raises, never silently passes)
-- ===========================================================================
do $val$
declare
  v_cat_id text := 'dt-practice-graph';
  v_n int;
begin
  if not exists (select 1 from public.dsa_topics where id = v_cat_id and kind = 'practice') then
    raise exception '0084/056: category % missing', v_cat_id;
  end if;
  select count(*) into v_n from public.dsa_problems
   where topic_id = v_cat_id and learning_topic_id is null and coalesce(status,'published') = 'published';
  if v_n < 10 then
    raise exception '0084/056: expected >= 10 Graph practice problems, found %', v_n;
  end if;
  raise notice '0084/056 OK: % Graph practice problems present.', v_n;
end
$val$;

notify pgrst, 'reload schema';
