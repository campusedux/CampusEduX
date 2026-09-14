-- mobile-app/supabase/migrations/0088_seed_practice_bit_manipulation.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: admin-panel/supabase/migrations/060_seed_practice_bit_manipulation.sql ; apply either, the other is a guarded no-op.
-- ============================================================================
-- BODY — global Practice ▸ Coding Problems seed: Bit Manipulation (3 problems)
-- (mobile 0088_seed_practice_bit_manipulation.sql
--  == admin 060_seed_practice_bit_manipulation.sql — byte-identical below the 3-line header,
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
    raise exception '0088/060: practice RPCs not found — apply 0072_practice_coding.sql (admin 044) first.';
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
  ('dt-practice-bit-manipulation', $px$Bit Manipulation$px$, $px$bit-manipulation$px$, $px$Parity via the low bit, population count on 64-bit values, and finding a missing number with XOR.$px$, 16, 'practice', 'published', true, true)
on conflict (id) do nothing;

-- ===========================================================================
-- 2. CODING PROBLEMS — Bit Manipulation
-- ===========================================================================

-- 143. Check Odd or Even Using Bits  [Easy]  /practice/problems/check-odd-or-even-using-bits
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-bit-manipulation-143', 'dt-practice-bit-manipulation', null,
  $px$Check Odd or Even Using Bits$px$, $px$check-odd-or-even-using-bits$px$, $px$Easy$px$,
  $px$Given an integer `N`, determine whether it is odd or even by inspecting its least significant bit.

**Input Format**

A single line containing the integer `N`.

**Output Format**

Print `Odd` if `N` is odd, otherwise print `Even`.$px$,
  $px$[{"input":"17","output":"Odd","explanation":"The least significant bit of an odd number is 1."}]$px$::jsonb,
  $px$["-1000000000 <= N <= 1000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        int n = Integer.parseInt(br.readLine().trim());\n        System.out.println((n & 1) == 0 ? \"Even\" : \"Odd\");\n    }\n}\n","python":"import sys\nn = int(sys.stdin.readline())\nprint('Even' if (n & 1) == 0 else 'Odd')\n","c":"#include <stdio.h>\nint main(void) {\n    long long n;\n    if (scanf(\"%lld\", &n) != 1) return 0;\n    printf(\"%s\\n\", (n & 1) == 0 ? \"Even\" : \"Odd\");\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\nint main() {\n    long long n; cin >> n;\n    cout << ((n & 1) == 0 ? \"Even\" : \"Odd\") << \"\\n\";\n    return 0;\n}\n","javascript":"const n = Number(require('fs').readFileSync(0, 'utf8').trim());\nconsole.log((n & 1) === 0 ? 'Even' : 'Odd');\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"0","expected":"Even","hidden":true},{"input":"-4","expected":"Even","hidden":true},{"input":"-7","expected":"Odd","hidden":true},{"input":"1000000000","expected":"Even","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 143
)
on conflict (id) do nothing;

-- 144. Count Set Bits  [Easy]  /practice/problems/count-set-bits
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-bit-manipulation-144', 'dt-practice-bit-manipulation', null,
  $px$Count Set Bits$px$, $px$count-set-bits$px$, $px$Easy$px$,
  $px$Given a non-negative integer `N`, count how many `1` bits are present in its binary representation.

**Input Format**

A single line containing the integer `N`.

**Output Format**

Print the number of set bits.$px$,
  $px$[{"input":"13","output":"3","explanation":"13 in binary is 1101, which has three 1 bits."}]$px$::jsonb,
  $px$["0 <= N <= 1000000000000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        long n = Long.parseLong(br.readLine().trim());\n        System.out.println(Long.bitCount(n));\n    }\n}\n","python":"import sys\nn = int(sys.stdin.readline())\nprint(bin(n).count('1'))\n","c":"#include <stdio.h>\nint main(void) {\n    unsigned long long n;\n    if (scanf(\"%llu\", &n) != 1) return 0;\n    int c = 0;\n    while (n) { c += (int)(n & 1ULL); n >>= 1; }\n    printf(\"%d\\n\", c);\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\nint main() {\n    unsigned long long n; cin >> n;\n    int c = 0;\n    while (n) { c += (int)(n & 1ULL); n >>= 1; }\n    cout << c << \"\\n\";\n    return 0;\n}\n","javascript":"const s = require('fs').readFileSync(0, 'utf8').trim();\nlet n = BigInt(s);\nlet c = 0;\nwhile (n > 0n) { c += Number(n & 1n); n >>= 1n; }\nconsole.log(c);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"0","expected":"0","hidden":true},{"input":"1","expected":"1","hidden":true},{"input":"1023","expected":"10","hidden":true},{"input":"1000000000000000000","expected":"24","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 144
)
on conflict (id) do nothing;

-- 145. Find the Missing Number Using XOR  [Easy]  /practice/problems/missing-number-using-xor
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-bit-manipulation-145', 'dt-practice-bit-manipulation', null,
  $px$Find the Missing Number Using XOR$px$, $px$missing-number-using-xor$px$, $px$Easy$px$,
  $px$An array contains `N` distinct values chosen from `0` to `N` (so exactly one value in that range is missing). Find the missing value using XOR.

**Input Format**

The first line contains an integer `N` (the array length).
The second line contains `N` space-separated distinct integers, each between `0` and `N`.

**Output Format**

Print the missing number.$px$,
  $px$[{"input":"3\n3 0 1","output":"2","explanation":"The full range is 0,1,2,3; only 2 is missing."}]$px$::jsonb,
  $px$["1 <= N <= 1000000","The array holds N of the N+1 numbers 0..N."]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder all = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) all.append(line).append(' ');\n        StringTokenizer st = new StringTokenizer(all.toString());\n        int n = Integer.parseInt(st.nextToken());\n        long x = 0;\n        for (int i = 0; i <= n; i++) x ^= i;\n        for (int i = 0; i < n; i++) x ^= Long.parseLong(st.nextToken());\n        System.out.println(x);\n    }\n}\n","python":"import sys\nd = sys.stdin.read().split()\nn = int(d[0])\nx = 0\nfor i in range(n + 1):\n    x ^= i\nfor v in map(int, d[1:1+n]):\n    x ^= v\nprint(x)\n","c":"#include <stdio.h>\nint main(void) {\n    long long n;\n    if (scanf(\"%lld\", &n) != 1) return 0;\n    long long x = 0, v;\n    for (long long i = 0; i <= n; i++) x ^= i;\n    for (long long i = 0; i < n; i++) { scanf(\"%lld\", &v); x ^= v; }\n    printf(\"%lld\\n\", x);\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    long long n; cin >> n;\n    long long x = 0, v;\n    for (long long i = 0; i <= n; i++) x ^= i;\n    for (long long i = 0; i < n; i++) { cin >> v; x ^= v; }\n    cout << x << \"\\n\";\n    return 0;\n}\n","javascript":"const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nlet x = 0;\nfor (let i = 0; i <= n; i++) x ^= i;\nfor (let i = 1; i <= n; i++) x ^= d[i];\nconsole.log(x);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\n0","expected":"1","hidden":true},{"input":"1\n1","expected":"0","hidden":true},{"input":"5\n0 1 2 3 4","expected":"5","hidden":true},{"input":"5\n1 2 3 4 5","expected":"0","hidden":true},{"input":"4\n0 1 3 4","expected":"2","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 145
)
on conflict (id) do nothing;

-- ===========================================================================
-- 3. VALIDATION  (raises, never silently passes)
-- ===========================================================================
do $val$
declare
  v_cat_id text := 'dt-practice-bit-manipulation';
  v_n int;
begin
  if not exists (select 1 from public.dsa_topics where id = v_cat_id and kind = 'practice') then
    raise exception '0088/060: category % missing', v_cat_id;
  end if;
  select count(*) into v_n from public.dsa_problems
   where topic_id = v_cat_id and learning_topic_id is null and coalesce(status,'published') = 'published';
  if v_n < 3 then
    raise exception '0088/060: expected >= 3 Bit Manipulation practice problems, found %', v_n;
  end if;
  raise notice '0088/060 OK: % Bit Manipulation practice problems present.', v_n;
end
$val$;

notify pgrst, 'reload schema';
