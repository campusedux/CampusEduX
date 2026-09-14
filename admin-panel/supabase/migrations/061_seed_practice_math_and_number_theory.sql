-- admin-panel/supabase/migrations/061_seed_practice_math_and_number_theory.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: mobile-app/supabase/migrations/0089_seed_practice_math_and_number_theory.sql ; apply either, the other is a guarded no-op.
-- ============================================================================
-- BODY — global Practice ▸ Coding Problems seed: Math & Number Theory (5 problems)
-- (mobile 0089_seed_practice_math_and_number_theory.sql
--  == admin 061_seed_practice_math_and_number_theory.sql — byte-identical below the 3-line header,
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
    raise exception '0089/061: practice RPCs not found — apply 0072_practice_coding.sql (admin 044) first.';
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
  ('dt-practice-math-and-number-theory', $px$Math & Number Theory$px$, $px$math-and-number-theory$px$, $px$Primality testing, GCD / LCM, digit sums and palindromic numbers.$px$, 17, 'practice', 'published', true, true)
on conflict (id) do nothing;

-- ===========================================================================
-- 2. CODING PROBLEMS — Math & Number Theory
-- ===========================================================================

-- 146. Check Prime Number  [Easy]  /practice/problems/check-prime-number
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-math-and-number-theory-146', 'dt-practice-math-and-number-theory', null,
  $px$Check Prime Number$px$, $px$check-prime-number$px$, $px$Easy$px$,
  $px$Given an integer `N`, determine whether it is a prime number. A prime number is greater than 1 and has exactly two positive divisors: 1 and itself.

**Input Format**

A single line containing the integer `N`.

**Output Format**

Print `1` if `N` is prime, otherwise print `0`.$px$,
  $px$[{"input":"29","output":"1","explanation":"29 is divisible only by 1 and 29."}]$px$::jsonb,
  $px$["1 <= N <= 1000000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        long n = Long.parseLong(br.readLine().trim());\n        int ok = 1;\n        if (n < 2) ok = 0;\n        for (long i = 2; i * i <= n && ok == 1; i++) if (n % i == 0) ok = 0;\n        System.out.println(ok);\n    }\n}\n","python":"import sys\nn = int(sys.stdin.readline())\nif n < 2:\n    print(0)\nelse:\n    ok = 1\n    i = 2\n    while i * i <= n:\n        if n % i == 0:\n            ok = 0\n            break\n        i += 1\n    print(ok)\n","c":"#include <stdio.h>\nint main(void) {\n    long long n;\n    if (scanf(\"%lld\", &n) != 1) return 0;\n    int ok = 1;\n    if (n < 2) ok = 0;\n    for (long long i = 2; i * i <= n && ok; i++) if (n % i == 0) ok = 0;\n    printf(\"%d\\n\", ok);\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\nint main() {\n    long long n; cin >> n;\n    int ok = 1;\n    if (n < 2) ok = 0;\n    for (long long i = 2; i * i <= n && ok; i++) if (n % i == 0) ok = 0;\n    cout << ok << \"\\n\";\n    return 0;\n}\n","javascript":"const n = Number(require('fs').readFileSync(0, 'utf8').trim());\nlet ok = 1;\nif (n < 2) ok = 0;\nfor (let i = 2; i * i <= n && ok; i++) if (n % i === 0) ok = 0;\nconsole.log(ok);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1","expected":"0","hidden":true},{"input":"2","expected":"1","hidden":true},{"input":"4","expected":"0","hidden":true},{"input":"999999999989","expected":"1","hidden":true},{"input":"1000000000000","expected":"0","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 146
)
on conflict (id) do nothing;

-- 147. Greatest Common Divisor  [Easy]  /practice/problems/greatest-common-divisor
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-math-and-number-theory-147', 'dt-practice-math-and-number-theory', null,
  $px$Greatest Common Divisor$px$, $px$greatest-common-divisor$px$, $px$Easy$px$,
  $px$Given two positive integers, find their greatest common divisor (GCD).

**Input Format**

A single line containing two integers `A` and `B`.

**Output Format**

Print the GCD of `A` and `B`.$px$,
  $px$[{"input":"48 18","output":"6","explanation":"6 is the largest number that divides both 48 and 18."}]$px$::jsonb,
  $px$["1 <= A, B <= 1000000000000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\nimport java.util.*;\npublic class Main {\n    static long gcd(long a, long b) { while (b != 0) { long t = a % b; a = b; b = t; } return a; }\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringTokenizer st = new StringTokenizer(br.readLine());\n        long a = Long.parseLong(st.nextToken()), b = Long.parseLong(st.nextToken());\n        System.out.println(gcd(a, b));\n    }\n}\n","python":"import sys\nimport math\na, b = map(int, sys.stdin.readline().split())\nprint(math.gcd(a, b))\n","c":"#include <stdio.h>\nunsigned long long gcd(unsigned long long a, unsigned long long b) { while (b) { unsigned long long t = a % b; a = b; b = t; } return a; }\nint main(void) {\n    unsigned long long a, b;\n    if (scanf(\"%llu %llu\", &a, &b) != 2) return 0;\n    printf(\"%llu\\n\", gcd(a, b));\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\nunsigned long long gcd(unsigned long long a, unsigned long long b) { while (b) { unsigned long long t = a % b; a = b; b = t; } return a; }\nint main() {\n    unsigned long long a, b; cin >> a >> b;\n    cout << gcd(a, b) << \"\\n\";\n    return 0;\n}\n","javascript":"const [a, b] = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(BigInt);\nfunction gcd(x, y) { while (y > 0n) { const t = x % y; x = y; y = t; } return x; }\nconsole.log(gcd(a, b).toString());\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1 1","expected":"1","hidden":true},{"input":"100 10","expected":"10","hidden":true},{"input":"17 5","expected":"1","hidden":true},{"input":"1000000000000000000 8","expected":"8","hidden":true},{"input":"1000000007 1000000009","expected":"1","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 147
)
on conflict (id) do nothing;

-- 148. Least Common Multiple  [Easy]  /practice/problems/least-common-multiple
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-math-and-number-theory-148', 'dt-practice-math-and-number-theory', null,
  $px$Least Common Multiple$px$, $px$least-common-multiple$px$, $px$Easy$px$,
  $px$Given two positive integers, find their least common multiple (LCM) — the smallest positive integer divisible by both.

**Input Format**

A single line containing two integers `A` and `B`.

**Output Format**

Print the LCM of `A` and `B`.$px$,
  $px$[{"input":"12 18","output":"36","explanation":"36 is divisible by both 12 and 18, and no smaller positive common multiple exists."}]$px$::jsonb,
  $px$["1 <= A, B <= 1000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\nimport java.util.*;\npublic class Main {\n    static long gcd(long a, long b) { while (b != 0) { long t = a % b; a = b; b = t; } return a; }\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringTokenizer st = new StringTokenizer(br.readLine());\n        long a = Long.parseLong(st.nextToken()), b = Long.parseLong(st.nextToken());\n        System.out.println(a / gcd(a, b) * b);\n    }\n}\n","python":"import sys\nimport math\na, b = map(int, sys.stdin.readline().split())\nprint(a // math.gcd(a, b) * b)\n","c":"#include <stdio.h>\nlong long gcd(long long a, long long b) { while (b) { long long t = a % b; a = b; b = t; } return a; }\nint main(void) {\n    long long a, b;\n    if (scanf(\"%lld %lld\", &a, &b) != 2) return 0;\n    printf(\"%lld\\n\", a / gcd(a, b) * b);\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\nlong long gcd(long long a, long long b) { while (b) { long long t = a % b; a = b; b = t; } return a; }\nint main() {\n    long long a, b; cin >> a >> b;\n    cout << a / gcd(a, b) * b << \"\\n\";\n    return 0;\n}\n","javascript":"const [a, b] = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nfunction gcd(x, y) { while (y) { const t = x % y; x = y; y = t; } return x; }\nconsole.log((a / gcd(a, b)) * b);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1 1","expected":"1","hidden":true},{"input":"4 6","expected":"12","hidden":true},{"input":"7 5","expected":"35","hidden":true},{"input":"1000000 999999","expected":"999999000000","hidden":true},{"input":"10 10","expected":"10","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 148
)
on conflict (id) do nothing;

-- 149. Count Digits and Digit Sum  [Easy]  /practice/problems/count-digits-and-digit-sum
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-math-and-number-theory-149', 'dt-practice-math-and-number-theory', null,
  $px$Count Digits and Digit Sum$px$, $px$count-digits-and-digit-sum$px$, $px$Easy$px$,
  $px$Given a non-negative integer `N`, find the number of digits it has and the sum of those digits.

**Input Format**

A single line containing the integer `N`.

**Output Format**

Print two lines:
`Digits = d`
`Sum = s`$px$,
  $px$[{"input":"5824","output":"Digits = 4\nSum = 19","explanation":"5824 has four digits and 5 + 8 + 2 + 4 = 19."}]$px$::jsonb,
  $px$["0 <= N <= 1000000000000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        String s = br.readLine().trim();\n        int sum = 0;\n        for (int i = 0; i < s.length(); i++) sum += s.charAt(i) - '0';\n        System.out.println(\"Digits = \" + s.length());\n        System.out.println(\"Sum = \" + sum);\n    }\n}\n","python":"import sys\ns = sys.stdin.readline().strip()\nprint(f\"Digits = {len(s)}\")\nprint(f\"Sum = {sum(int(ch) for ch in s)}\")\n","c":"#include <stdio.h>\n#include <string.h>\nint main(void) {\n    char s[64];\n    if (scanf(\"%63s\", s) != 1) return 0;\n    int len = (int)strlen(s), sum = 0;\n    for (int i = 0; i < len; i++) sum += s[i] - '0';\n    printf(\"Digits = %d\\nSum = %d\\n\", len, sum);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n    string s; cin >> s;\n    int sum = 0;\n    for (char ch : s) sum += ch - '0';\n    cout << \"Digits = \" << s.size() << \"\\nSum = \" << sum << \"\\n\";\n    return 0;\n}\n","javascript":"const s = require('fs').readFileSync(0, 'utf8').trim();\nlet sum = 0;\nfor (const ch of s) sum += ch.charCodeAt(0) - 48;\nconsole.log(`Digits = ${s.length}`);\nconsole.log(`Sum = ${sum}`);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"0","expected":"Digits = 1\nSum = 0","hidden":true},{"input":"7","expected":"Digits = 1\nSum = 7","hidden":true},{"input":"1000000000000000000","expected":"Digits = 19\nSum = 1","hidden":true},{"input":"99999","expected":"Digits = 5\nSum = 45","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 149
)
on conflict (id) do nothing;

-- 150. Palindrome Number  [Easy]  /practice/problems/palindrome-number
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-math-and-number-theory-150', 'dt-practice-math-and-number-theory', null,
  $px$Palindrome Number$px$, $px$palindrome-number$px$, $px$Easy$px$,
  $px$Given a non-negative integer `N`, determine whether it reads the same from left to right and right to left.

**Input Format**

A single line containing the integer `N`.

**Output Format**

Print `1` if `N` is a palindrome, otherwise print `0`.$px$,
  $px$[{"input":"1221","output":"1","explanation":"1221 remains the same when its digits are reversed."}]$px$::jsonb,
  $px$["0 <= N <= 1000000000000000000"]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        String s = br.readLine().trim();\n        String r = new StringBuilder(s).reverse().toString();\n        System.out.println(s.equals(r) ? 1 : 0);\n    }\n}\n","python":"import sys\ns = sys.stdin.readline().strip()\nprint(1 if s == s[::-1] else 0)\n","c":"#include <stdio.h>\n#include <string.h>\nint main(void) {\n    char s[64];\n    if (scanf(\"%63s\", s) != 1) return 0;\n    int n = (int)strlen(s), ok = 1;\n    for (int i = 0; i < n / 2; i++) if (s[i] != s[n - 1 - i]) ok = 0;\n    printf(\"%d\\n\", ok);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <string>\n#include <algorithm>\nusing namespace std;\nint main() {\n    string s; cin >> s;\n    string r = s;\n    reverse(r.begin(), r.end());\n    cout << (s == r ? 1 : 0) << \"\\n\";\n    return 0;\n}\n","javascript":"const s = require('fs').readFileSync(0, 'utf8').trim();\nconsole.log(s === s.split('').reverse().join('') ? 1 : 0);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"0","expected":"1","hidden":true},{"input":"5","expected":"1","hidden":true},{"input":"10","expected":"0","hidden":true},{"input":"12321","expected":"1","hidden":true},{"input":"1000000000000000000","expected":"0","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 150
)
on conflict (id) do nothing;

-- ===========================================================================
-- 3. VALIDATION  (raises, never silently passes)
-- ===========================================================================
do $val$
declare
  v_cat_id text := 'dt-practice-math-and-number-theory';
  v_n int;
begin
  if not exists (select 1 from public.dsa_topics where id = v_cat_id and kind = 'practice') then
    raise exception '0089/061: category % missing', v_cat_id;
  end if;
  select count(*) into v_n from public.dsa_problems
   where topic_id = v_cat_id and learning_topic_id is null and coalesce(status,'published') = 'published';
  if v_n < 5 then
    raise exception '0089/061: expected >= 5 Math & Number Theory practice problems, found %', v_n;
  end if;
  raise notice '0089/061 OK: % Math & Number Theory practice problems present.', v_n;
end
$val$;

notify pgrst, 'reload schema';
