-- mobile-app/supabase/migrations/0079_seed_practice_stack_and_queue.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: admin-panel/supabase/migrations/051_seed_practice_stack_and_queue.sql ; apply either, the other is a guarded no-op.
-- ============================================================================
-- BODY — global Practice ▸ Coding Problems seed: Stack & Queue (10 problems)
-- (mobile 0079_seed_practice_stack_and_queue.sql
--  == admin 051_seed_practice_stack_and_queue.sql — byte-identical below the 3-line header,
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
    raise exception '0079/051: practice RPCs not found — apply 0072_practice_coding.sql (admin 044) first.';
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
  ('dt-practice-stack-and-queue', $px$Stack & Queue$px$, $px$stack-and-queue$px$, $px$LIFO / FIFO structures driven by an operation stream, plus monotonic-stack scans and postfix evaluation.$px$, 7, 'practice', 'published', true, true)
on conflict (id) do nothing;

-- ===========================================================================
-- 2. CODING PROBLEMS — Stack & Queue
-- ===========================================================================

-- 76. Implement Stack  [Easy]  /practice/problems/implement-stack
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-stack-and-queue-76', 'dt-practice-stack-and-queue', null,
  $px$Implement Stack$px$, $px$implement-stack$px$, $px$Easy$px$,
  $px$Implement a stack that supports `push`, `pop`, `peek` and `empty` operations, processing a stream of operations.

**Input Format**

The first line contains an integer `Q`, the number of operations.
Each of the next `Q` lines is one of:
`push X` — push integer `X`
`pop` — remove and return the top element
`peek` — return the top element without removing it
`empty` — return whether the stack is empty

**Output Format**

For each `pop` or `peek`, print the element (or `-1` if the stack is empty). For each `empty`, print `1` if the stack is empty, otherwise `0`. Print one value per line.$px$,
  $px$[{"input":"4\npush 10\npush 20\npeek\npop","output":"20\n20","explanation":"20 is on top, so both peek and pop return 20."}]$px$::jsonb,
  $px$["1 <= Q <= 100000","-1000000000 <= X <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\nimport java.util.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        int q = Integer.parseInt(br.readLine().trim());\n        ArrayDeque<Long> stk = new ArrayDeque<>();\n        StringBuilder sb = new StringBuilder();\n        for (int i = 0; i < q; i++) {\n            StringTokenizer st = new StringTokenizer(br.readLine());\n            String op = st.nextToken();\n            if (op.equals(\"push\")) stk.push(Long.parseLong(st.nextToken()));\n            else if (op.equals(\"pop\")) sb.append(stk.isEmpty() ? -1 : stk.pop()).append('\\n');\n            else if (op.equals(\"peek\")) sb.append(stk.isEmpty() ? -1 : stk.peek()).append('\\n');\n            else sb.append(stk.isEmpty() ? 1 : 0).append('\\n');\n        }\n        System.out.print(sb);\n    }\n}\n","python":"import sys\nlines = sys.stdin.read().split('\\n')\nq = int(lines[0])\nstk = []\nout = []\nfor i in range(1, q + 1):\n    parts = lines[i].split()\n    op = parts[0]\n    if op == 'push':\n        stk.append(int(parts[1]))\n    elif op == 'pop':\n        out.append(str(stk.pop() if stk else -1))\n    elif op == 'peek':\n        out.append(str(stk[-1] if stk else -1))\n    elif op == 'empty':\n        out.append('1' if not stk else '0')\nprint('\\n'.join(out))\n","c":"#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\nint main(void) {\n    int q; if (scanf(\"%d\", &q) != 1) return 0;\n    long long *stk = malloc(sizeof(long long) * (q + 1));\n    int top = 0;\n    char op[16];\n    for (int i = 0; i < q; i++) {\n        scanf(\"%15s\", op);\n        if (strcmp(op, \"push\") == 0) { long long x; scanf(\"%lld\", &x); stk[top++] = x; }\n        else if (strcmp(op, \"pop\") == 0) printf(\"%lld\\n\", top > 0 ? stk[--top] : -1LL);\n        else if (strcmp(op, \"peek\") == 0) printf(\"%lld\\n\", top > 0 ? stk[top - 1] : -1LL);\n        else printf(\"%d\\n\", top == 0 ? 1 : 0);\n    }\n    free(stk);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <string>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int q; cin >> q;\n    vector<long long> stk;\n    string op;\n    for (int i = 0; i < q; i++) {\n        cin >> op;\n        if (op == \"push\") { long long x; cin >> x; stk.push_back(x); }\n        else if (op == \"pop\") { cout << (stk.empty() ? -1LL : stk.back()) << \"\\n\"; if (!stk.empty()) stk.pop_back(); }\n        else if (op == \"peek\") cout << (stk.empty() ? -1LL : stk.back()) << \"\\n\";\n        else cout << (stk.empty() ? 1 : 0) << \"\\n\";\n    }\n    return 0;\n}\n","javascript":"const lines = require('fs').readFileSync(0, 'utf8').split('\\n');\nconst q = Number(lines[0]);\nconst stk = [];\nconst out = [];\nfor (let i = 1; i <= q; i++) {\n    const p = lines[i].split(/\\s+/);\n    if (p[0] === 'push') stk.push(Number(p[1]));\n    else if (p[0] === 'pop') out.push(stk.length ? stk.pop() : -1);\n    else if (p[0] === 'peek') out.push(stk.length ? stk[stk.length - 1] : -1);\n    else out.push(stk.length ? 0 : 1);\n}\nconsole.log(out.join('\\n'));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"3\npop\npeek\nempty","expected":"-1\n-1\n1","hidden":true},{"input":"5\npush 1\npush 2\npop\npop\nempty","expected":"2\n1\n1","hidden":true},{"input":"4\npush 5\nempty\npop\nempty","expected":"0\n5\n1","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 76
)
on conflict (id) do nothing;

-- 77. Implement Queue  [Easy]  /practice/problems/implement-queue
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-stack-and-queue-77', 'dt-practice-stack-and-queue', null,
  $px$Implement Queue$px$, $px$implement-queue$px$, $px$Easy$px$,
  $px$Implement a queue that supports `enqueue`, `dequeue`, `front` and `empty` operations, processing a stream of operations.

**Input Format**

The first line contains an integer `Q`.
Each of the next `Q` lines is one of:
`enqueue X` — add integer `X` to the back
`dequeue` — remove and return the front element
`front` — return the front element without removing it
`empty` — return whether the queue is empty

**Output Format**

For each `dequeue` or `front`, print the element (or `-1` if the queue is empty). For each `empty`, print `1` if empty, otherwise `0`. One value per line.$px$,
  $px$[{"input":"4\nenqueue 10\nenqueue 20\nfront\ndequeue","output":"10\n10","explanation":"Queues follow First In, First Out order."}]$px$::jsonb,
  $px$["1 <= Q <= 100000","-1000000000 <= X <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\nimport java.util.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        int q = Integer.parseInt(br.readLine().trim());\n        ArrayDeque<Long> dq = new ArrayDeque<>();\n        StringBuilder sb = new StringBuilder();\n        for (int i = 0; i < q; i++) {\n            StringTokenizer st = new StringTokenizer(br.readLine());\n            String op = st.nextToken();\n            if (op.equals(\"enqueue\")) dq.addLast(Long.parseLong(st.nextToken()));\n            else if (op.equals(\"dequeue\")) sb.append(dq.isEmpty() ? -1 : dq.pollFirst()).append('\\n');\n            else if (op.equals(\"front\")) sb.append(dq.isEmpty() ? -1 : dq.peekFirst()).append('\\n');\n            else sb.append(dq.isEmpty() ? 1 : 0).append('\\n');\n        }\n        System.out.print(sb);\n    }\n}\n","python":"import sys\nfrom collections import deque\nlines = sys.stdin.read().split('\\n')\nq = int(lines[0])\ndq = deque()\nout = []\nfor i in range(1, q + 1):\n    parts = lines[i].split()\n    op = parts[0]\n    if op == 'enqueue':\n        dq.append(int(parts[1]))\n    elif op == 'dequeue':\n        out.append(str(dq.popleft() if dq else -1))\n    elif op == 'front':\n        out.append(str(dq[0] if dq else -1))\n    else:\n        out.append('1' if not dq else '0')\nprint('\\n'.join(out))\n","c":"#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\nint main(void) {\n    int q; if (scanf(\"%d\", &q) != 1) return 0;\n    long long *buf = malloc(sizeof(long long) * (q + 1));\n    int head = 0, tail = 0;\n    char op[16];\n    for (int i = 0; i < q; i++) {\n        scanf(\"%15s\", op);\n        if (strcmp(op, \"enqueue\") == 0) { long long x; scanf(\"%lld\", &x); buf[tail++] = x; }\n        else if (strcmp(op, \"dequeue\") == 0) printf(\"%lld\\n\", head < tail ? buf[head++] : -1LL);\n        else if (strcmp(op, \"front\") == 0) printf(\"%lld\\n\", head < tail ? buf[head] : -1LL);\n        else printf(\"%d\\n\", head == tail ? 1 : 0);\n    }\n    free(buf);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <deque>\n#include <string>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int q; cin >> q;\n    deque<long long> dq;\n    string op;\n    for (int i = 0; i < q; i++) {\n        cin >> op;\n        if (op == \"enqueue\") { long long x; cin >> x; dq.push_back(x); }\n        else if (op == \"dequeue\") { cout << (dq.empty() ? -1LL : dq.front()) << \"\\n\"; if (!dq.empty()) dq.pop_front(); }\n        else if (op == \"front\") cout << (dq.empty() ? -1LL : dq.front()) << \"\\n\";\n        else cout << (dq.empty() ? 1 : 0) << \"\\n\";\n    }\n    return 0;\n}\n","javascript":"const lines = require('fs').readFileSync(0, 'utf8').split('\\n');\nconst q = Number(lines[0]);\nconst dq = [];\nlet head = 0;\nconst out = [];\nfor (let i = 1; i <= q; i++) {\n    const p = lines[i].split(/\\s+/);\n    if (p[0] === 'enqueue') dq.push(Number(p[1]));\n    else if (p[0] === 'dequeue') out.push(head < dq.length ? dq[head++] : -1);\n    else if (p[0] === 'front') out.push(head < dq.length ? dq[head] : -1);\n    else out.push(head === dq.length ? 1 : 0);\n}\nconsole.log(out.join('\\n'));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"3\ndequeue\nfront\nempty","expected":"-1\n-1\n1","hidden":true},{"input":"5\nenqueue 1\nenqueue 2\ndequeue\ndequeue\nempty","expected":"1\n2\n1","hidden":true},{"input":"4\nenqueue 9\nempty\ndequeue\nempty","expected":"0\n9\n1","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 77
)
on conflict (id) do nothing;

-- 78. Balanced Parentheses  [Easy]  /practice/problems/balanced-parentheses
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-stack-and-queue-78', 'dt-practice-stack-and-queue', null,
  $px$Balanced Parentheses$px$, $px$balanced-parentheses$px$, $px$Easy$px$,
  $px$Given a string containing only the characters `()`, `{}` and `[]`, determine whether every bracket is correctly opened and closed in the correct order.

**Input Format**

A single line containing the bracket string `S`.

**Output Format**

Print `1` if the brackets are balanced, otherwise print `0`.$px$,
  $px$[{"input":"{[()]}","output":"1","explanation":"Every opening bracket has the matching closing bracket in the correct order."}]$px$::jsonb,
  $px$["1 <= length of S <= 100000","S contains only the characters ( ) { } [ ]"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\nimport java.util.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        String s = br.readLine();\n        if (s == null) s = \"\";\n        ArrayDeque<Character> stk = new ArrayDeque<>();\n        int ok = 1;\n        for (int i = 0; i < s.length(); i++) {\n            char ch = s.charAt(i);\n            if (ch == '(' || ch == '[' || ch == '{') stk.push(ch);\n            else {\n                char want = ch == ')' ? '(' : ch == ']' ? '[' : '{';\n                if (stk.isEmpty() || stk.pop() != want) { ok = 0; break; }\n            }\n        }\n        if (!stk.isEmpty()) ok = 0;\n        System.out.println(ok);\n    }\n}\n","python":"import sys\ns = sys.stdin.readline().rstrip('\\n')\nstk = []\npairs = {')': '(', ']': '[', '}': '{'}\nok = 1\nfor ch in s:\n    if ch in '([{':\n        stk.append(ch)\n    else:\n        if not stk or stk[-1] != pairs[ch]:\n            ok = 0\n            break\n        stk.pop()\nif stk:\n    ok = 0\nprint(ok)\n","c":"#include <stdio.h>\n#include <string.h>\n#include <stdlib.h>\nint main(void) {\n    static char buf[100005];\n    if (!fgets(buf, sizeof(buf), stdin)) { printf(\"1\\n\"); return 0; }\n    buf[strcspn(buf, \"\\r\\n\")] = 0;\n    int n = (int)strlen(buf);\n    char *stk = malloc(n + 1);\n    int top = 0, ok = 1;\n    for (int i = 0; i < n; i++) {\n        char ch = buf[i];\n        if (ch == '(' || ch == '[' || ch == '{') stk[top++] = ch;\n        else {\n            char want = ch == ')' ? '(' : ch == ']' ? '[' : '{';\n            if (top == 0 || stk[--top] != want) { ok = 0; break; }\n        }\n    }\n    if (top != 0) ok = 0;\n    printf(\"%d\\n\", ok);\n    free(stk);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <string>\n#include <stack>\nusing namespace std;\nint main() {\n    string s;\n    getline(cin, s);\n    stack<char> stk;\n    int ok = 1;\n    for (char ch : s) {\n        if (ch == '(' || ch == '[' || ch == '{') stk.push(ch);\n        else {\n            char want = ch == ')' ? '(' : ch == ']' ? '[' : '{';\n            if (stk.empty() || stk.top() != want) { ok = 0; break; }\n            stk.pop();\n        }\n    }\n    if (!stk.empty()) ok = 0;\n    cout << ok << \"\\n\";\n    return 0;\n}\n","javascript":"const s = require('fs').readFileSync(0, 'utf8').split('\\n')[0].replace(/\\r$/, '');\nconst stk = [];\nconst pairs = { ')': '(', ']': '[', '}': '{' };\nlet ok = 1;\nfor (const ch of s) {\n    if (ch === '(' || ch === '[' || ch === '{') stk.push(ch);\n    else {\n        if (!stk.length || stk.pop() !== pairs[ch]) { ok = 0; break; }\n    }\n}\nif (stk.length) ok = 0;\nconsole.log(ok);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"(","expected":"0","hidden":true},{"input":"()","expected":"1","hidden":true},{"input":"([)]","expected":"0","hidden":true},{"input":"{{[[(())]]}}","expected":"1","hidden":true},{"input":"}","expected":"0","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 78
)
on conflict (id) do nothing;

-- 79. Reverse a Stack  [Easy]  /practice/problems/reverse-a-stack
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-stack-and-queue-79', 'dt-practice-stack-and-queue', null,
  $px$Reverse a Stack$px$, $px$reverse-a-stack$px$, $px$Easy$px$,
  $px$Given a stack of integers described from bottom to top, print the stack contents after reversing it, again from bottom to top.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers, the stack from bottom to top.

**Output Format**

Print the reversed stack from bottom to top, separated by single spaces.$px$,
  $px$[{"input":"4\n1 2 3 4","output":"4 3 2 1","explanation":"The bottom element becomes the top after reversal."}]$px$::jsonb,
  $px$["1 <= N <= 10000","-1000000000 <= value <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        String[] a = new String[n];\n        for (int i = 0; i < n; i++) a[i] = st.nextToken();\n        StringBuilder sb = new StringBuilder();\n        for (int i = n - 1; i >= 0; i--) { sb.append(a[i]); if (i > 0) sb.append(' '); }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\nprint(' '.join(reversed(d[1:1+n])))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    for (int i = n - 1; i >= 0; i--) printf(\"%lld%s\", a[i], i > 0 ? \" \" : \"\\n\");\n    free(a);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<long long> a(n);\n    for (auto &v : a) cin >> v;\n    for (int i = n - 1; i >= 0; i--) cout << a[i] << (i > 0 ? ' ' : '\\n');\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/);\nconst n = Number(d[0]);\nconsole.log(d.slice(1, 1 + n).reverse().join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n9","expected":"9","hidden":true},{"input":"3\n-1 0 1","expected":"1 0 -1","hidden":true},{"input":"5\n5 5 5 5 5","expected":"5 5 5 5 5","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 79
)
on conflict (id) do nothing;

-- 80. Next Greater Element  [Medium]  /practice/problems/next-greater-element
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-stack-and-queue-80', 'dt-practice-stack-and-queue', null,
  $px$Next Greater Element$px$, $px$next-greater-element$px$, $px$Medium$px$,
  $px$For every element of an array, find the first element to its right that is strictly greater. If no such element exists, use `-1`.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers.

**Output Format**

Print `N` values, the next greater element for each position, separated by single spaces.$px$,
  $px$[{"input":"4\n4 5 2 10","output":"5 10 10 -1","explanation":"For 4 the next greater value is 5; for 10 there is none."}]$px$::jsonb,
  $px$["1 <= N <= 100000","-1000000000 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long[] a = new long[n];\n        for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());\n        long[] res = new long[n];\n        Arrays.fill(res, -1);\n        int[] stk = new int[n];\n        int top = 0;\n        for (int i = 0; i < n; i++) {\n            while (top > 0 && a[stk[top - 1]] < a[i]) res[stk[--top]] = a[i];\n            stk[top++] = i;\n        }\n        StringBuilder sb = new StringBuilder();\n        for (int i = 0; i < n; i++) { if (i > 0) sb.append(' '); sb.append(res[i]); }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\na = list(map(int, d[1:1+n]))\nres = [-1] * n\nstk = []\nfor i in range(n):\n    while stk and a[stk[-1]] < a[i]:\n        res[stk.pop()] = a[i]\n    stk.append(i)\nprint(' '.join(map(str, res)))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    long long *res = malloc(sizeof(long long) * n);\n    for (int i = 0; i < n; i++) res[i] = -1;\n    int *stk = malloc(sizeof(int) * n);\n    int top = 0;\n    for (int i = 0; i < n; i++) {\n        while (top > 0 && a[stk[top - 1]] < a[i]) res[stk[--top]] = a[i];\n        stk[top++] = i;\n    }\n    for (int i = 0; i < n; i++) printf(\"%lld%s\", res[i], i + 1 < n ? \" \" : \"\\n\");\n    free(a); free(res); free(stk);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<long long> a(n);\n    for (auto &v : a) cin >> v;\n    vector<long long> res(n, -1);\n    vector<int> stk;\n    for (int i = 0; i < n; i++) {\n        while (!stk.empty() && a[stk.back()] < a[i]) { res[stk.back()] = a[i]; stk.pop_back(); }\n        stk.push_back(i);\n    }\n    for (int i = 0; i < n; i++) cout << res[i] << (i + 1 < n ? ' ' : '\\n');\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst a = d.slice(1, 1 + n);\nconst res = new Array(n).fill(-1);\nconst stk = [];\nfor (let i = 0; i < n; i++) {\n    while (stk.length && a[stk[stk.length - 1]] < a[i]) res[stk.pop()] = a[i];\n    stk.push(i);\n}\nconsole.log(res.join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n7","expected":"-1","hidden":true},{"input":"5\n5 4 3 2 1","expected":"-1 -1 -1 -1 -1","hidden":true},{"input":"5\n1 2 3 4 5","expected":"2 3 4 5 -1","hidden":true},{"input":"4\n2 2 2 2","expected":"-1 -1 -1 -1","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 80
)
on conflict (id) do nothing;

-- 81. Next Smaller Element  [Medium]  /practice/problems/next-smaller-element
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-stack-and-queue-81', 'dt-practice-stack-and-queue', null,
  $px$Next Smaller Element$px$, $px$next-smaller-element$px$, $px$Medium$px$,
  $px$For every element of an array, find the first element to its right that is strictly smaller. If no such element exists, use `-1`.

**Input Format**

The first line contains an integer `N`.
The second line contains `N` space-separated integers.

**Output Format**

Print `N` values, the next smaller element for each position, separated by single spaces.$px$,
  $px$[{"input":"5\n4 8 5 2 25","output":"2 5 2 -1 -1","explanation":"The first smaller value to the right of 4 is 2; no smaller value exists after 2 or 25."}]$px$::jsonb,
  $px$["1 <= N <= 100000","-1000000000 <= A[i] <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long[] a = new long[n];\n        for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());\n        long[] res = new long[n];\n        Arrays.fill(res, -1);\n        int[] stk = new int[n];\n        int top = 0;\n        for (int i = 0; i < n; i++) {\n            while (top > 0 && a[stk[top - 1]] > a[i]) res[stk[--top]] = a[i];\n            stk[top++] = i;\n        }\n        StringBuilder sb = new StringBuilder();\n        for (int i = 0; i < n; i++) { if (i > 0) sb.append(' '); sb.append(res[i]); }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\na = list(map(int, d[1:1+n]))\nres = [-1] * n\nstk = []\nfor i in range(n):\n    while stk and a[stk[-1]] > a[i]:\n        res[stk.pop()] = a[i]\n    stk.append(i)\nprint(' '.join(map(str, res)))\n","c":"#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    long long *a = malloc(sizeof(long long) * n);\n    for (int i = 0; i < n; i++) scanf(\"%lld\", &a[i]);\n    long long *res = malloc(sizeof(long long) * n);\n    for (int i = 0; i < n; i++) res[i] = -1;\n    int *stk = malloc(sizeof(int) * n);\n    int top = 0;\n    for (int i = 0; i < n; i++) {\n        while (top > 0 && a[stk[top - 1]] > a[i]) res[stk[--top]] = a[i];\n        stk[top++] = i;\n    }\n    for (int i = 0; i < n; i++) printf(\"%lld%s\", res[i], i + 1 < n ? \" \" : \"\\n\");\n    free(a); free(res); free(stk);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<long long> a(n);\n    for (auto &v : a) cin >> v;\n    vector<long long> res(n, -1);\n    vector<int> stk;\n    for (int i = 0; i < n; i++) {\n        while (!stk.empty() && a[stk.back()] > a[i]) { res[stk.back()] = a[i]; stk.pop_back(); }\n        stk.push_back(i);\n    }\n    for (int i = 0; i < n; i++) cout << res[i] << (i + 1 < n ? ' ' : '\\n');\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst a = d.slice(1, 1 + n);\nconst res = new Array(n).fill(-1);\nconst stk = [];\nfor (let i = 0; i < n; i++) {\n    while (stk.length && a[stk[stk.length - 1]] > a[i]) res[stk.pop()] = a[i];\n    stk.push(i);\n}\nconsole.log(res.join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n7","expected":"-1","hidden":true},{"input":"5\n1 2 3 4 5","expected":"-1 -1 -1 -1 -1","hidden":true},{"input":"5\n5 4 3 2 1","expected":"4 3 2 1 -1","hidden":true},{"input":"4\n3 3 3 3","expected":"-1 -1 -1 -1","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 81
)
on conflict (id) do nothing;

-- 82. Min Stack  [Medium]  /practice/problems/min-stack
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-stack-and-queue-82', 'dt-practice-stack-and-queue', null,
  $px$Min Stack$px$, $px$min-stack$px$, $px$Medium$px$,
  $px$Design a stack that supports `push`, `pop`, `top` and `getMin` (retrieving the minimum value), all in constant time.

**Input Format**

The first line contains an integer `Q`.
Each of the next `Q` lines is one of:
`push X`, `pop`, `top`, `getMin`.

**Output Format**

For each `pop` print the removed element (or `-1` if empty). For each `top` print the top element (or `-1`). For each `getMin` print the current minimum (or `-1` if empty). One value per line.$px$,
  $px$[{"input":"4\npush 5\npush 2\npush 7\ngetMin","output":"2","explanation":"Among 5, 2 and 7 the minimum is 2."}]$px$::jsonb,
  $px$["1 <= Q <= 100000","-1000000000 <= X <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\nimport java.util.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        int q = Integer.parseInt(br.readLine().trim());\n        ArrayList<Long> stk = new ArrayList<>();\n        ArrayList<Long> mn = new ArrayList<>();\n        StringBuilder sb = new StringBuilder();\n        for (int i = 0; i < q; i++) {\n            StringTokenizer st = new StringTokenizer(br.readLine());\n            String op = st.nextToken();\n            if (op.equals(\"push\")) {\n                long x = Long.parseLong(st.nextToken());\n                stk.add(x);\n                mn.add(mn.isEmpty() ? x : Math.min(mn.get(mn.size() - 1), x));\n            } else if (op.equals(\"pop\")) {\n                if (stk.isEmpty()) sb.append(-1).append('\\n');\n                else { sb.append(stk.remove(stk.size() - 1)).append('\\n'); mn.remove(mn.size() - 1); }\n            } else if (op.equals(\"top\")) sb.append(stk.isEmpty() ? -1 : stk.get(stk.size() - 1)).append('\\n');\n            else sb.append(mn.isEmpty() ? -1 : mn.get(mn.size() - 1)).append('\\n');\n        }\n        System.out.print(sb);\n    }\n}\n","python":"import sys\nlines = sys.stdin.read().split('\\n')\nq = int(lines[0])\nstk = []\nmn = []\nout = []\nfor i in range(1, q + 1):\n    parts = lines[i].split()\n    op = parts[0]\n    if op == 'push':\n        x = int(parts[1])\n        stk.append(x)\n        mn.append(x if not mn else min(mn[-1], x))\n    elif op == 'pop':\n        if stk:\n            out.append(str(stk.pop()))\n            mn.pop()\n        else:\n            out.append('-1')\n    elif op == 'top':\n        out.append(str(stk[-1] if stk else -1))\n    else:\n        out.append(str(mn[-1] if mn else -1))\nprint('\\n'.join(out))\n","c":"#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\nint main(void) {\n    int q; if (scanf(\"%d\", &q) != 1) return 0;\n    long long *stk = malloc(sizeof(long long) * (q + 1));\n    long long *mn = malloc(sizeof(long long) * (q + 1));\n    int top = 0;\n    char op[16];\n    for (int i = 0; i < q; i++) {\n        scanf(\"%15s\", op);\n        if (strcmp(op, \"push\") == 0) {\n            long long x; scanf(\"%lld\", &x);\n            stk[top] = x;\n            mn[top] = (top == 0) ? x : (mn[top - 1] < x ? mn[top - 1] : x);\n            top++;\n        } else if (strcmp(op, \"pop\") == 0) {\n            if (top == 0) printf(\"-1\\n\");\n            else printf(\"%lld\\n\", stk[--top]);\n        } else if (strcmp(op, \"top\") == 0) printf(\"%lld\\n\", top > 0 ? stk[top - 1] : -1LL);\n        else printf(\"%lld\\n\", top > 0 ? mn[top - 1] : -1LL);\n    }\n    free(stk); free(mn);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int q; cin >> q;\n    vector<long long> stk, mn;\n    string op;\n    for (int i = 0; i < q; i++) {\n        cin >> op;\n        if (op == \"push\") {\n            long long x; cin >> x;\n            stk.push_back(x);\n            mn.push_back(mn.empty() ? x : min(mn.back(), x));\n        } else if (op == \"pop\") {\n            if (stk.empty()) cout << -1 << \"\\n\";\n            else { cout << stk.back() << \"\\n\"; stk.pop_back(); mn.pop_back(); }\n        } else if (op == \"top\") cout << (stk.empty() ? -1LL : stk.back()) << \"\\n\";\n        else cout << (mn.empty() ? -1LL : mn.back()) << \"\\n\";\n    }\n    return 0;\n}\n","javascript":"const lines = require('fs').readFileSync(0, 'utf8').split('\\n');\nconst q = Number(lines[0]);\nconst stk = [], mn = [];\nconst out = [];\nfor (let i = 1; i <= q; i++) {\n    const p = lines[i].split(/\\s+/);\n    if (p[0] === 'push') {\n        const x = Number(p[1]);\n        stk.push(x);\n        mn.push(mn.length ? Math.min(mn[mn.length - 1], x) : x);\n    } else if (p[0] === 'pop') {\n        if (!stk.length) out.push(-1);\n        else { out.push(stk.pop()); mn.pop(); }\n    } else if (p[0] === 'top') out.push(stk.length ? stk[stk.length - 1] : -1);\n    else out.push(mn.length ? mn[mn.length - 1] : -1);\n}\nconsole.log(out.join('\\n'));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"3\ngetMin\ntop\npop","expected":"-1\n-1\n-1","hidden":true},{"input":"6\npush 3\npush 1\ngetMin\npop\ngetMin\ntop","expected":"1\n1\n3\n3","hidden":true},{"input":"5\npush 10\npush 10\npop\ngetMin\npop","expected":"10\n10\n10","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 82
)
on conflict (id) do nothing;

-- 83. Evaluate Postfix Expression  [Medium]  /practice/problems/evaluate-postfix-expression
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-stack-and-queue-83', 'dt-practice-stack-and-queue', null,
  $px$Evaluate Postfix Expression$px$, $px$evaluate-postfix-expression$px$, $px$Medium$px$,
  $px$Given a valid postfix (Reverse Polish) expression of integers and the operators `+`, `-`, `*`, `/`, evaluate it. Division truncates toward zero.

**Input Format**

The first line contains an integer `N`, the number of tokens.
The second line contains `N` space-separated tokens: each is an integer or one of `+ - * /`.

**Output Format**

Print the integer value of the expression.$px$,
  $px$[{"input":"5\n2 3 + 4 *","output":"20","explanation":"2 + 3 = 5, then 5 * 4 = 20."}]$px$::jsonb,
  $px$["1 <= N <= 100000","Every intermediate and final value fits in a 64-bit signed integer.","No division by zero occurs."]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long[] stk = new long[n];\n        int top = 0;\n        for (int i = 0; i < n; i++) {\n            String t = st.nextToken();\n            if (t.equals(\"+\") || t.equals(\"-\") || t.equals(\"*\") || t.equals(\"/\")) {\n                long b = stk[--top], a = stk[--top];\n                long r = t.equals(\"+\") ? a + b : t.equals(\"-\") ? a - b : t.equals(\"*\") ? a * b : a / b;\n                stk[top++] = r;\n            } else stk[top++] = Long.parseLong(t);\n        }\n        System.out.println(stk[top - 1]);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\ntokens = d[1:1+n]\nstk = []\nfor t in tokens:\n    if t in ('+', '-', '*', '/'):\n        b = stk.pop()\n        a = stk.pop()\n        if t == '+':\n            stk.append(a + b)\n        elif t == '-':\n            stk.append(a - b)\n        elif t == '*':\n            stk.append(a * b)\n        else:\n            q = abs(a) // abs(b)\n            if (a < 0) != (b < 0):\n                q = -q\n            stk.append(q)\n    else:\n        stk.append(int(t))\nprint(stk[-1])\n","c":"#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\nint main(void) {\n    int n; if (scanf(\"%d\", &n) != 1) return 0;\n    long long *stk = malloc(sizeof(long long) * n);\n    int top = 0;\n    char t[32];\n    for (int i = 0; i < n; i++) {\n        scanf(\"%31s\", t);\n        if (strlen(t) == 1 && (t[0] == '+' || t[0] == '-' || t[0] == '*' || t[0] == '/')) {\n            long long b = stk[--top], a = stk[--top], r = 0;\n            if (t[0] == '+') r = a + b;\n            else if (t[0] == '-') r = a - b;\n            else if (t[0] == '*') r = a * b;\n            else r = a / b;\n            stk[top++] = r;\n        } else stk[top++] = atoll(t);\n    }\n    printf(\"%lld\\n\", stk[top - 1]);\n    free(stk);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <vector>\n#include <string>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n;\n    vector<long long> stk;\n    for (int i = 0; i < n; i++) {\n        string t; cin >> t;\n        if (t.size() == 1 && (t[0] == '+' || t[0] == '-' || t[0] == '*' || t[0] == '/')) {\n            long long b = stk.back(); stk.pop_back();\n            long long a = stk.back(); stk.pop_back();\n            long long r = t[0] == '+' ? a + b : t[0] == '-' ? a - b : t[0] == '*' ? a * b : a / b;\n            stk.push_back(r);\n        } else stk.push_back(stoll(t));\n    }\n    cout << stk.back() << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/);\nconst n = Number(d[0]);\nconst stk = [];\nfor (let i = 1; i <= n; i++) {\n    const t = d[i];\n    if (t === '+' || t === '-' || t === '*' || t === '/') {\n        const b = stk.pop(), a = stk.pop();\n        let r;\n        if (t === '+') r = a + b;\n        else if (t === '-') r = a - b;\n        else if (t === '*') r = a * b;\n        else r = Math.trunc(a / b);\n        stk.push(r);\n    } else stk.push(Number(t));\n}\nconsole.log(stk[stk.length - 1]);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n42","expected":"42","hidden":true},{"input":"3\n10 2 /","expected":"5","hidden":true},{"input":"3\n7 3 -","expected":"4","hidden":true},{"input":"5\n-7 2 / 3 *","expected":"-9","hidden":true},{"input":"9\n5 1 2 + 4 * + 3 -","expected":"14","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 83
)
on conflict (id) do nothing;

-- 84. Queue Using Two Stacks  [Medium]  /practice/problems/queue-using-two-stacks
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-stack-and-queue-84', 'dt-practice-stack-and-queue', null,
  $px$Queue Using Two Stacks$px$, $px$queue-using-two-stacks$px$, $px$Medium$px$,
  $px$Implement a queue using only two stacks, so that operations still behave in First In, First Out order.

**Input Format**

The first line contains an integer `Q`.
Each of the next `Q` lines is one of:
`enqueue X`, `dequeue`, `front`, `empty`.

**Output Format**

For each `dequeue` or `front`, print the element (or `-1` if empty). For each `empty`, print `1` if empty, otherwise `0`. One value per line.$px$,
  $px$[{"input":"4\nenqueue 10\nenqueue 20\ndequeue\nfront","output":"10\n20","explanation":"The first inserted element is removed first."}]$px$::jsonb,
  $px$["1 <= Q <= 100000","-1000000000 <= X <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\nimport java.util.*;\npublic class Main {\n    static ArrayDeque<Long> inS = new ArrayDeque<>(), outS = new ArrayDeque<>();\n    static void shift() { if (outS.isEmpty()) while (!inS.isEmpty()) outS.push(inS.pop()); }\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        int q = Integer.parseInt(br.readLine().trim());\n        StringBuilder sb = new StringBuilder();\n        for (int i = 0; i < q; i++) {\n            StringTokenizer st = new StringTokenizer(br.readLine());\n            String op = st.nextToken();\n            if (op.equals(\"enqueue\")) inS.push(Long.parseLong(st.nextToken()));\n            else if (op.equals(\"dequeue\")) { shift(); sb.append(outS.isEmpty() ? -1 : outS.pop()).append('\\n'); }\n            else if (op.equals(\"front\")) { shift(); sb.append(outS.isEmpty() ? -1 : outS.peek()).append('\\n'); }\n            else sb.append(inS.isEmpty() && outS.isEmpty() ? 1 : 0).append('\\n');\n        }\n        System.out.print(sb);\n    }\n}\n","python":"import sys\nlines = sys.stdin.read().split('\\n')\nq = int(lines[0])\nin_s = []\nout_s = []\nout = []\ndef shift():\n    if not out_s:\n        while in_s:\n            out_s.append(in_s.pop())\nfor i in range(1, q + 1):\n    parts = lines[i].split()\n    op = parts[0]\n    if op == 'enqueue':\n        in_s.append(int(parts[1]))\n    elif op == 'dequeue':\n        shift()\n        out.append(str(out_s.pop() if out_s else -1))\n    elif op == 'front':\n        shift()\n        out.append(str(out_s[-1] if out_s else -1))\n    else:\n        out.append('1' if not in_s and not out_s else '0')\nprint('\\n'.join(out))\n","c":"#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\nint main(void) {\n    int q; if (scanf(\"%d\", &q) != 1) return 0;\n    long long *inS = malloc(sizeof(long long) * (q + 1));\n    long long *outS = malloc(sizeof(long long) * (q + 1));\n    int it = 0, ot = 0;\n    char op[16];\n    for (int i = 0; i < q; i++) {\n        scanf(\"%15s\", op);\n        if (strcmp(op, \"enqueue\") == 0) { long long x; scanf(\"%lld\", &x); inS[it++] = x; }\n        else if (strcmp(op, \"dequeue\") == 0) {\n            if (ot == 0) while (it > 0) outS[ot++] = inS[--it];\n            printf(\"%lld\\n\", ot > 0 ? outS[--ot] : -1LL);\n        } else if (strcmp(op, \"front\") == 0) {\n            if (ot == 0) while (it > 0) outS[ot++] = inS[--it];\n            printf(\"%lld\\n\", ot > 0 ? outS[ot - 1] : -1LL);\n        } else printf(\"%d\\n\", (it == 0 && ot == 0) ? 1 : 0);\n    }\n    free(inS); free(outS);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <stack>\n#include <string>\nusing namespace std;\nstack<long long> inS, outS;\nvoid shift() { if (outS.empty()) while (!inS.empty()) { outS.push(inS.top()); inS.pop(); } }\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int q; cin >> q;\n    string op;\n    for (int i = 0; i < q; i++) {\n        cin >> op;\n        if (op == \"enqueue\") { long long x; cin >> x; inS.push(x); }\n        else if (op == \"dequeue\") { shift(); if (outS.empty()) cout << -1 << \"\\n\"; else { cout << outS.top() << \"\\n\"; outS.pop(); } }\n        else if (op == \"front\") { shift(); cout << (outS.empty() ? -1LL : outS.top()) << \"\\n\"; }\n        else cout << (inS.empty() && outS.empty() ? 1 : 0) << \"\\n\";\n    }\n    return 0;\n}\n","javascript":"const lines = require('fs').readFileSync(0, 'utf8').split('\\n');\nconst q = Number(lines[0]);\nconst inS = [], outS = [];\nconst out = [];\nfunction shift() { if (!outS.length) while (inS.length) outS.push(inS.pop()); }\nfor (let i = 1; i <= q; i++) {\n    const p = lines[i].split(/\\s+/);\n    if (p[0] === 'enqueue') inS.push(Number(p[1]));\n    else if (p[0] === 'dequeue') { shift(); out.push(outS.length ? outS.pop() : -1); }\n    else if (p[0] === 'front') { shift(); out.push(outS.length ? outS[outS.length - 1] : -1); }\n    else out.push(inS.length || outS.length ? 0 : 1);\n}\nconsole.log(out.join('\\n'));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"3\ndequeue\nfront\nempty","expected":"-1\n-1\n1","hidden":true},{"input":"7\nenqueue 1\nenqueue 2\nenqueue 3\ndequeue\nenqueue 4\ndequeue\nfront","expected":"1\n2\n3","hidden":true},{"input":"4\nenqueue 5\nempty\ndequeue\nempty","expected":"0\n5\n1","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 84
)
on conflict (id) do nothing;

-- 85. Stack Using Two Queues  [Medium]  /practice/problems/stack-using-two-queues
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-stack-and-queue-85', 'dt-practice-stack-and-queue', null,
  $px$Stack Using Two Queues$px$, $px$stack-using-two-queues$px$, $px$Medium$px$,
  $px$Implement a stack using two queues, so that operations still behave in Last In, First Out order. (Each `push` may take time proportional to the current size, so the number of operations is kept small.)

**Input Format**

The first line contains an integer `Q`.
Each of the next `Q` lines is one of:
`push X`, `pop`, `top`, `empty`.

**Output Format**

For each `pop` or `top`, print the element (or `-1` if empty). For each `empty`, print `1` if empty, otherwise `0`. One value per line.$px$,
  $px$[{"input":"3\npush 10\npush 20\npop","output":"20","explanation":"The most recently inserted value is removed first."}]$px$::jsonb,
  $px$["1 <= Q <= 2000","-1000000000 <= X <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\nimport java.util.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        int q = Integer.parseInt(br.readLine().trim());\n        ArrayDeque<Long> qu = new ArrayDeque<>();\n        StringBuilder sb = new StringBuilder();\n        for (int i = 0; i < q; i++) {\n            StringTokenizer st = new StringTokenizer(br.readLine());\n            String op = st.nextToken();\n            if (op.equals(\"push\")) {\n                long x = Long.parseLong(st.nextToken());\n                qu.addLast(x);\n                for (int k = 0; k < qu.size() - 1; k++) qu.addLast(qu.pollFirst());\n            } else if (op.equals(\"pop\")) sb.append(qu.isEmpty() ? -1 : qu.pollFirst()).append('\\n');\n            else if (op.equals(\"top\")) sb.append(qu.isEmpty() ? -1 : qu.peekFirst()).append('\\n');\n            else sb.append(qu.isEmpty() ? 1 : 0).append('\\n');\n        }\n        System.out.print(sb);\n    }\n}\n","python":"import sys\nfrom collections import deque\nlines = sys.stdin.read().split('\\n')\nq = int(lines[0])\nqu = deque()\nout = []\nfor i in range(1, q + 1):\n    parts = lines[i].split()\n    op = parts[0]\n    if op == 'push':\n        x = int(parts[1])\n        qu.append(x)\n        for _ in range(len(qu) - 1):\n            qu.append(qu.popleft())\n    elif op == 'pop':\n        out.append(str(qu.popleft() if qu else -1))\n    elif op == 'top':\n        out.append(str(qu[0] if qu else -1))\n    else:\n        out.append('1' if not qu else '0')\nprint('\\n'.join(out))\n","c":"#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\nint main(void) {\n    int q; if (scanf(\"%d\", &q) != 1) return 0;\n    int cap = q + 5;\n    long long *buf = malloc(sizeof(long long) * cap);\n    int head = 0, tail = 0, sz = 0;\n    char op[16];\n    for (int i = 0; i < q; i++) {\n        scanf(\"%15s\", op);\n        if (strcmp(op, \"push\") == 0) {\n            long long x; scanf(\"%lld\", &x);\n            buf[tail] = x; tail = (tail + 1) % cap; sz++;\n            for (int k = 0; k < sz - 1; k++) {\n                long long v = buf[head]; head = (head + 1) % cap;\n                buf[tail] = v; tail = (tail + 1) % cap;\n            }\n        } else if (strcmp(op, \"pop\") == 0) {\n            if (sz == 0) printf(\"-1\\n\");\n            else { printf(\"%lld\\n\", buf[head]); head = (head + 1) % cap; sz--; }\n        } else if (strcmp(op, \"top\") == 0) printf(\"%lld\\n\", sz > 0 ? buf[head] : -1LL);\n        else printf(\"%d\\n\", sz == 0 ? 1 : 0);\n    }\n    free(buf);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <deque>\n#include <string>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int q; cin >> q;\n    deque<long long> qu;\n    string op;\n    for (int i = 0; i < q; i++) {\n        cin >> op;\n        if (op == \"push\") {\n            long long x; cin >> x;\n            qu.push_back(x);\n            for (size_t k = 0; k + 1 < qu.size(); k++) { qu.push_back(qu.front()); qu.pop_front(); }\n        } else if (op == \"pop\") { if (qu.empty()) cout << -1 << \"\\n\"; else { cout << qu.front() << \"\\n\"; qu.pop_front(); } }\n        else if (op == \"top\") cout << (qu.empty() ? -1LL : qu.front()) << \"\\n\";\n        else cout << (qu.empty() ? 1 : 0) << \"\\n\";\n    }\n    return 0;\n}\n","javascript":"const lines = require('fs').readFileSync(0, 'utf8').split('\\n');\nconst q = Number(lines[0]);\nconst cap = q + 5;\nconst buf = new Array(cap);\nlet head = 0, tail = 0, sz = 0;\nconst out = [];\nfor (let i = 1; i <= q; i++) {\n    const p = lines[i].split(/\\s+/);\n    if (p[0] === 'push') {\n        buf[tail] = Number(p[1]); tail = (tail + 1) % cap; sz++;\n        for (let k = 0; k < sz - 1; k++) {\n            const v = buf[head]; head = (head + 1) % cap;\n            buf[tail] = v; tail = (tail + 1) % cap;\n        }\n    } else if (p[0] === 'pop') {\n        if (sz === 0) out.push(-1);\n        else { out.push(buf[head]); head = (head + 1) % cap; sz--; }\n    } else if (p[0] === 'top') out.push(sz > 0 ? buf[head] : -1);\n    else out.push(sz === 0 ? 1 : 0);\n}\nconsole.log(out.join('\\n'));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"3\npop\ntop\nempty","expected":"-1\n-1\n1","hidden":true},{"input":"6\npush 1\npush 2\npush 3\npop\ntop\npop","expected":"3\n2\n2","hidden":true},{"input":"4\npush 7\nempty\npop\nempty","expected":"0\n7\n1","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 85
)
on conflict (id) do nothing;

-- ===========================================================================
-- 3. VALIDATION  (raises, never silently passes)
-- ===========================================================================
do $val$
declare
  v_cat_id text := 'dt-practice-stack-and-queue';
  v_n int;
begin
  if not exists (select 1 from public.dsa_topics where id = v_cat_id and kind = 'practice') then
    raise exception '0079/051: category % missing', v_cat_id;
  end if;
  select count(*) into v_n from public.dsa_problems
   where topic_id = v_cat_id and learning_topic_id is null and coalesce(status,'published') = 'published';
  if v_n < 10 then
    raise exception '0079/051: expected >= 10 Stack & Queue practice problems, found %', v_n;
  end if;
  raise notice '0079/051 OK: % Stack & Queue practice problems present.', v_n;
end
$val$;

notify pgrst, 'reload schema';
