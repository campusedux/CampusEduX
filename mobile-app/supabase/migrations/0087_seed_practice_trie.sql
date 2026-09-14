-- mobile-app/supabase/migrations/0087_seed_practice_trie.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: admin-panel/supabase/migrations/059_seed_practice_trie.sql ; apply either, the other is a guarded no-op.
-- ============================================================================
-- BODY — global Practice ▸ Coding Problems seed: Trie (2 problems)
-- (mobile 0087_seed_practice_trie.sql
--  == admin 059_seed_practice_trie.sql — byte-identical below the 3-line header,
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
    raise exception '0087/059: practice RPCs not found — apply 0072_practice_coding.sql (admin 044) first.';
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
  ('dt-practice-trie', $px$Trie$px$, $px$trie$px$, $px$Prefix-tree operations (insert / search / prefix) and grid word search with backtracking.$px$, 15, 'practice', 'published', true, true)
on conflict (id) do nothing;

-- ===========================================================================
-- 2. CODING PROBLEMS — Trie
-- ===========================================================================

-- 141. Implement Trie  [Medium]  /practice/problems/implement-trie
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-trie-141', 'dt-practice-trie', null,
  $px$Implement Trie$px$, $px$implement-trie$px$, $px$Medium$px$,
  $px$Implement a Trie (prefix tree) that supports inserting a word, searching for a complete word, and checking whether any inserted word starts with a given prefix.

**Input Format**

The first line contains an integer `Q`.
Each of the next `Q` lines is one of:
`insert W` — insert the word `W`
`search W` — is `W` a previously inserted word?
`startsWith P` — is `P` a prefix of any inserted word?

**Output Format**

For each `search` and each `startsWith`, print `1` for yes or `0` for no, one per line.$px$,
  $px$[{"input":"3\ninsert apple\nsearch apple\nstartsWith app","output":"1\n1","explanation":"apple was inserted, and it also starts with the prefix app."}]$px$::jsonb,
  $px$["1 <= Q <= 100000","1 <= word / prefix length <= 100","All words and prefixes are lowercase English letters."]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\nimport java.util.*;\npublic class Main {\n    static class Node { Node[] c = new Node[26]; boolean end; }\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        int q = Integer.parseInt(br.readLine().trim());\n        Node root = new Node();\n        StringBuilder sb = new StringBuilder();\n        for (int i = 0; i < q; i++) {\n            StringTokenizer st = new StringTokenizer(br.readLine());\n            String op = st.nextToken(), w = st.nextToken();\n            if (op.equals(\"insert\")) {\n                Node n = root;\n                for (int k = 0; k < w.length(); k++) {\n                    int c = w.charAt(k) - 'a';\n                    if (n.c[c] == null) n.c[c] = new Node();\n                    n = n.c[c];\n                }\n                n.end = true;\n            } else {\n                Node n = root;\n                boolean ok = true;\n                for (int k = 0; k < w.length() && ok; k++) {\n                    int c = w.charAt(k) - 'a';\n                    if (n.c[c] == null) ok = false; else n = n.c[c];\n                }\n                if (op.equals(\"search\")) sb.append(ok && n.end ? 1 : 0).append('\\n');\n                else sb.append(ok ? 1 : 0).append('\\n');\n            }\n        }\n        System.out.print(sb);\n    }\n}\n","python":"import sys\nlines = sys.stdin.read().split('\\n')\nq = int(lines[0])\nroot = {}\nout = []\nfor i in range(1, q + 1):\n    op, w = lines[i].split()\n    if op == 'insert':\n        node = root\n        for ch in w:\n            node = node.setdefault(ch, {})\n        node['$'] = True\n    elif op == 'search':\n        node = root\n        ok = True\n        for ch in w:\n            if ch not in node:\n                ok = False\n                break\n            node = node[ch]\n        out.append('1' if ok and node.get('$', False) else '0')\n    else:\n        node = root\n        ok = True\n        for ch in w:\n            if ch not in node:\n                ok = False\n                break\n            node = node[ch]\n        out.append('1' if ok else '0')\nprint('\\n'.join(out))\n","c":"#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\ntypedef struct Node { struct Node *c[26]; int end; } Node;\nNode* newNode(void) { Node *n = calloc(1, sizeof(Node)); return n; }\nint main(void) {\n    int q; if (scanf(\"%d\", &q) != 1) return 0;\n    Node *root = newNode();\n    char op[16], w[128];\n    for (int i = 0; i < q; i++) {\n        scanf(\"%15s %127s\", op, w);\n        int len = (int)strlen(w);\n        if (strcmp(op, \"insert\") == 0) {\n            Node *n = root;\n            for (int k = 0; k < len; k++) {\n                int c = w[k] - 'a';\n                if (!n->c[c]) n->c[c] = newNode();\n                n = n->c[c];\n            }\n            n->end = 1;\n        } else {\n            Node *n = root;\n            int ok = 1;\n            for (int k = 0; k < len && ok; k++) {\n                int c = w[k] - 'a';\n                if (!n->c[c]) ok = 0; else n = n->c[c];\n            }\n            if (strcmp(op, \"search\") == 0) printf(\"%d\\n\", ok && n->end ? 1 : 0);\n            else printf(\"%d\\n\", ok ? 1 : 0);\n        }\n    }\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <string>\nusing namespace std;\nstruct Node { Node* c[26] = {}; bool end = false; };\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int q; cin >> q;\n    Node* root = new Node();\n    string op, w;\n    for (int i = 0; i < q; i++) {\n        cin >> op >> w;\n        if (op == \"insert\") {\n            Node* n = root;\n            for (char ch : w) {\n                int c = ch - 'a';\n                if (!n->c[c]) n->c[c] = new Node();\n                n = n->c[c];\n            }\n            n->end = true;\n        } else {\n            Node* n = root;\n            bool ok = true;\n            for (char ch : w) {\n                int c = ch - 'a';\n                if (!n->c[c]) { ok = false; break; }\n                n = n->c[c];\n            }\n            if (op == \"search\") cout << (ok && n->end ? 1 : 0) << \"\\n\";\n            else cout << (ok ? 1 : 0) << \"\\n\";\n        }\n    }\n    return 0;\n}\n","javascript":"const lines = require('fs').readFileSync(0, 'utf8').split('\\n');\nconst q = Number(lines[0]);\nconst root = new Map();\nconst out = [];\nfor (let i = 1; i <= q; i++) {\n    const sp = lines[i].split(/\\s+/);\n    const op = sp[0], w = sp[1];\n    if (op === 'insert') {\n        let node = root;\n        for (const ch of w) {\n            if (!node.has(ch)) node.set(ch, new Map());\n            node = node.get(ch);\n        }\n        node.set('$', true);\n    } else {\n        let node = root, ok = true;\n        for (const ch of w) {\n            if (!node.has(ch)) { ok = false; break; }\n            node = node.get(ch);\n        }\n        if (op === 'search') out.push(ok && node.get('$') ? 1 : 0);\n        else out.push(ok ? 1 : 0);\n    }\n}\nconsole.log(out.join('\\n'));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"2\nsearch a\nstartsWith a","expected":"0\n0","hidden":true},{"input":"5\ninsert abc\nsearch ab\nstartsWith ab\ninsert ab\nsearch ab","expected":"0\n1\n1","hidden":true},{"input":"4\ninsert cat\ninsert car\nstartsWith ca\nsearch care","expected":"1\n0","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 141
)
on conflict (id) do nothing;

-- 142. Word Search in Grid  [Hard]  /practice/problems/word-search-in-grid
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-trie-142', 'dt-practice-trie', null,
  $px$Word Search in Grid$px$, $px$word-search-in-grid$px$, $px$Hard$px$,
  $px$Given a grid of letters and a target word, determine whether the word can be formed by a path of adjacent cells (up, down, left or right). The same cell may not be used more than once in a single path.

**Input Format**

The first line contains two integers `R` and `C`.
Each of the next `R` lines contains `C` characters (uppercase letters, no spaces).
The last line contains the target `word`.

**Output Format**

Print `1` if the word can be formed, otherwise print `0`.$px$,
  $px$[{"input":"3 4\nABCE\nSFCS\nADEE\nABCCED","output":"1","explanation":"The word can be traced through adjacent cells without reusing a cell."}]$px$::jsonb,
  $px$["1 <= R, C <= 15","1 <= word length <= 15","Letters are uppercase English letters."]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\npublic class Main {\n    static int r, c;\n    static char[][] g;\n    static char[] word;\n    static boolean[][] vis;\n    static boolean found = false;\n    static void dfs(int i, int j, int k) {\n        if (found) return;\n        if (k == word.length) { found = true; return; }\n        if (i < 0 || j < 0 || i >= r || j >= c || vis[i][j] || g[i][j] != word[k]) return;\n        vis[i][j] = true;\n        dfs(i + 1, j, k + 1); dfs(i - 1, j, k + 1); dfs(i, j + 1, k + 1); dfs(i, j - 1, k + 1);\n        vis[i][j] = false;\n    }\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        String[] first = br.readLine().trim().split(\"\\\\s+\");\n        r = Integer.parseInt(first[0]); c = Integer.parseInt(first[1]);\n        g = new char[r][];\n        for (int i = 0; i < r; i++) g[i] = br.readLine().toCharArray();\n        word = br.readLine().trim().toCharArray();\n        vis = new boolean[r][c];\n        for (int i = 0; i < r && !found; i++)\n            for (int j = 0; j < c && !found; j++) dfs(i, j, 0);\n        System.out.println(found ? 1 : 0);\n    }\n}\n","python":"import sys\nsys.setrecursionlimit(10000)\nlines = sys.stdin.read().split('\\n')\nr, c = map(int, lines[0].split())\ng = [lines[1 + i] for i in range(r)]\nword = lines[1 + r].strip()\nvis = [[False] * c for _ in range(r)]\nfound = [False]\ndef dfs(i, j, k):\n    if found[0]:\n        return\n    if k == len(word):\n        found[0] = True\n        return\n    if i < 0 or j < 0 or i >= r or j >= c or vis[i][j] or g[i][j] != word[k]:\n        return\n    vis[i][j] = True\n    dfs(i + 1, j, k + 1); dfs(i - 1, j, k + 1); dfs(i, j + 1, k + 1); dfs(i, j - 1, k + 1)\n    vis[i][j] = False\nfor i in range(r):\n    for j in range(c):\n        if not found[0]:\n            dfs(i, j, 0)\nprint(1 if found[0] else 0)\n","c":"#include <stdio.h>\n#include <string.h>\nint r, c;\nchar g[16][20];\nchar word[20];\nint wl;\nint vis[16][16];\nint found = 0;\nvoid dfs(int i, int j, int k) {\n    if (found) return;\n    if (k == wl) { found = 1; return; }\n    if (i < 0 || j < 0 || i >= r || j >= c || vis[i][j] || g[i][j] != word[k]) return;\n    vis[i][j] = 1;\n    dfs(i + 1, j, k + 1); dfs(i - 1, j, k + 1); dfs(i, j + 1, k + 1); dfs(i, j - 1, k + 1);\n    vis[i][j] = 0;\n}\nint main(void) {\n    if (scanf(\"%d %d\", &r, &c) != 2) return 0;\n    for (int i = 0; i < r; i++) scanf(\"%19s\", g[i]);\n    scanf(\"%19s\", word);\n    wl = (int)strlen(word);\n    for (int i = 0; i < r && !found; i++)\n        for (int j = 0; j < c && !found; j++) dfs(i, j, 0);\n    printf(\"%d\\n\", found);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <string>\n#include <vector>\nusing namespace std;\nint r, c;\nvector<string> g;\nstring word;\nvector<vector<int>> vis;\nbool found = false;\nvoid dfs(int i, int j, int k) {\n    if (found) return;\n    if (k == (int)word.size()) { found = true; return; }\n    if (i < 0 || j < 0 || i >= r || j >= c || vis[i][j] || g[i][j] != word[k]) return;\n    vis[i][j] = 1;\n    dfs(i + 1, j, k + 1); dfs(i - 1, j, k + 1); dfs(i, j + 1, k + 1); dfs(i, j - 1, k + 1);\n    vis[i][j] = 0;\n}\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    cin >> r >> c;\n    g.resize(r);\n    for (int i = 0; i < r; i++) cin >> g[i];\n    cin >> word;\n    vis.assign(r, vector<int>(c, 0));\n    for (int i = 0; i < r && !found; i++)\n        for (int j = 0; j < c && !found; j++) dfs(i, j, 0);\n    cout << (found ? 1 : 0) << \"\\n\";\n    return 0;\n}\n","javascript":"const lines = require('fs').readFileSync(0, 'utf8').split('\\n');\nconst [r, c] = lines[0].trim().split(/\\s+/).map(Number);\nconst g = [];\nfor (let i = 0; i < r; i++) g.push(lines[1 + i]);\nconst word = lines[1 + r].trim();\nconst vis = Array.from({ length: r }, () => new Array(c).fill(false));\nlet found = false;\nfunction dfs(i, j, k) {\n    if (found) return;\n    if (k === word.length) { found = true; return; }\n    if (i < 0 || j < 0 || i >= r || j >= c || vis[i][j] || g[i][j] !== word[k]) return;\n    vis[i][j] = true;\n    dfs(i + 1, j, k + 1); dfs(i - 1, j, k + 1); dfs(i, j + 1, k + 1); dfs(i, j - 1, k + 1);\n    vis[i][j] = false;\n}\nfor (let i = 0; i < r && !found; i++)\n    for (let j = 0; j < c && !found; j++) dfs(i, j, 0);\nconsole.log(found ? 1 : 0);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"3 4\nABCE\nSFCS\nADEE\nSEE","expected":"1","hidden":true},{"input":"3 4\nABCE\nSFCS\nADEE\nABCB","expected":"0","hidden":true},{"input":"1 1\nA\nA","expected":"1","hidden":true},{"input":"2 2\nAB\nCD\nACDB","expected":"1","hidden":true},{"input":"2 3\nAAA\nAAA\nAAAAAA","expected":"1","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 142
)
on conflict (id) do nothing;

-- ===========================================================================
-- 3. VALIDATION  (raises, never silently passes)
-- ===========================================================================
do $val$
declare
  v_cat_id text := 'dt-practice-trie';
  v_n int;
begin
  if not exists (select 1 from public.dsa_topics where id = v_cat_id and kind = 'practice') then
    raise exception '0087/059: category % missing', v_cat_id;
  end if;
  select count(*) into v_n from public.dsa_problems
   where topic_id = v_cat_id and learning_topic_id is null and coalesce(status,'published') = 'published';
  if v_n < 2 then
    raise exception '0087/059: expected >= 2 Trie practice problems, found %', v_n;
  end if;
  raise notice '0087/059 OK: % Trie practice problems present.', v_n;
end
$val$;

notify pgrst, 'reload schema';
