-- mobile-app/supabase/migrations/0074_seed_practice_strings.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: admin-panel/supabase/migrations/046_seed_practice_strings.sql ; apply either, the other is a guarded no-op.
-- ============================================================================
-- BODY — global Practice ▸ Coding Problems seed: Strings (10 problems)
-- (mobile 0074_seed_practice_strings.sql
--  == admin 046_seed_practice_strings.sql — byte-identical below the 3-line header,
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
    raise exception '0074/046: practice RPCs not found — apply 0072_practice_coding.sql (admin 044) first.';
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
  ('dt-practice-strings', $px$Strings$px$, $px$strings$px$, $px$Character counting, reversal, palindromes, anagrams and sliding-window scans on text.$px$, 2, 'practice', 'published', true, true)
on conflict (id) do nothing;

-- ===========================================================================
-- 2. CODING PROBLEMS — Strings
-- ===========================================================================

-- 21. Reverse a String  [Easy]  /practice/problems/reverse-a-string
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-strings-21', 'dt-practice-strings', null,
  $px$Reverse a String$px$, $px$reverse-a-string$px$, $px$Easy$px$,
  $px$Given a string, print the same string with its characters in reverse order.

**Input Format**

A single line containing the string `S`. It has no leading or trailing spaces.

**Output Format**

Print the reversed string.$px$,
  $px$[{"input":"hello","output":"olleh","explanation":"The characters are read from the last position to the first."}]$px$::jsonb,
  $px$["1 <= length of S <= 100000","S consists of visible ASCII characters and spaces."]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        String s = br.readLine();\n        if (s == null) s = \"\";\n        System.out.println(new StringBuilder(s).reverse().toString());\n    }\n}\n","python":"import sys\ns = sys.stdin.readline().rstrip('\\n')\nprint(s[::-1])\n","c":"#include <stdio.h>\n#include <string.h>\nint main(void) {\n    static char buf[100005];\n    if (!fgets(buf, sizeof(buf), stdin)) return 0;\n    size_t n = strlen(buf);\n    while (n > 0 && (buf[n - 1] == '\\n' || buf[n - 1] == '\\r')) buf[--n] = 0;\n    for (size_t i = n; i > 0; i--) putchar(buf[i - 1]);\n    putchar('\\n');\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <string>\n#include <algorithm>\nusing namespace std;\nint main() {\n    string s;\n    getline(cin, s);\n    reverse(s.begin(), s.end());\n    cout << s << \"\\n\";\n    return 0;\n}\n","javascript":"const s = require('fs').readFileSync(0, 'utf8').split('\\n')[0].replace(/\\r$/, '');\nconsole.log(s.split('').reverse().join(''));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"a","expected":"a","hidden":true},{"input":"ab","expected":"ba","hidden":true},{"input":"racecar","expected":"racecar","hidden":true},{"input":"I love coding","expected":"gnidoc evol I","hidden":true},{"input":"12345","expected":"54321","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 21
)
on conflict (id) do nothing;

-- 22. Check Palindrome  [Easy]  /practice/problems/check-palindrome
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-strings-22', 'dt-practice-strings', null,
  $px$Check Palindrome$px$, $px$check-palindrome$px$, $px$Easy$px$,
  $px$Determine whether a given string reads the same from left to right and from right to left. The comparison is case-sensitive.

**Input Format**

A single line containing the string `S` with no leading or trailing spaces.

**Output Format**

Print `1` if `S` is a palindrome, otherwise print `0`.$px$,
  $px$[{"input":"level","output":"1","explanation":"level is unchanged when reversed."}]$px$::jsonb,
  $px$["1 <= length of S <= 100000","S consists of visible ASCII characters."]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        String s = br.readLine();\n        if (s == null) s = \"\";\n        String r = new StringBuilder(s).reverse().toString();\n        System.out.println(s.equals(r) ? 1 : 0);\n    }\n}\n","python":"import sys\ns = sys.stdin.readline().rstrip('\\n')\nprint(1 if s == s[::-1] else 0)\n","c":"#include <stdio.h>\n#include <string.h>\nint main(void) {\n    static char buf[100005];\n    if (!fgets(buf, sizeof(buf), stdin)) { printf(\"1\\n\"); return 0; }\n    size_t n = strlen(buf);\n    while (n > 0 && (buf[n - 1] == '\\n' || buf[n - 1] == '\\r')) buf[--n] = 0;\n    int ok = 1;\n    for (size_t i = 0; i < n / 2; i++) if (buf[i] != buf[n - 1 - i]) ok = 0;\n    printf(\"%d\\n\", ok);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n    string s;\n    getline(cin, s);\n    string r(s.rbegin(), s.rend());\n    cout << (s == r ? 1 : 0) << \"\\n\";\n    return 0;\n}\n","javascript":"const s = require('fs').readFileSync(0, 'utf8').split('\\n')[0].replace(/\\r$/, '');\nconsole.log(s === s.split('').reverse().join('') ? 1 : 0);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"a","expected":"1","hidden":true},{"input":"ab","expected":"0","hidden":true},{"input":"abccba","expected":"1","hidden":true},{"input":"Level","expected":"0","hidden":true},{"input":"12321","expected":"1","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 22
)
on conflict (id) do nothing;

-- 23. Count Vowels and Consonants  [Easy]  /practice/problems/count-vowels-and-consonants
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-strings-23', 'dt-practice-strings', null,
  $px$Count Vowels and Consonants$px$, $px$count-vowels-and-consonants$px$, $px$Easy$px$,
  $px$Given a string containing English letters and spaces, count the number of vowels and the number of consonants. Vowels are `a e i o u` in either case; every other English letter is a consonant. Spaces and other characters are ignored.

**Input Format**

A single line containing the string `S`.

**Output Format**

Print two lines:
`Vowels = X`
`Consonants = Y`$px$,
  $px$[{"input":"hello world","output":"Vowels = 3\nConsonants = 7","explanation":"The vowels are e, o, o; all other letters are consonants."}]$px$::jsonb,
  $px$["1 <= length of S <= 100000","S contains only English letters and spaces."]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        String s = br.readLine();\n        if (s == null) s = \"\";\n        int v = 0, c = 0;\n        for (int i = 0; i < s.length(); i++) {\n            char ch = Character.toLowerCase(s.charAt(i));\n            if (ch >= 'a' && ch <= 'z') {\n                if (ch == 'a' || ch == 'e' || ch == 'i' || ch == 'o' || ch == 'u') v++;\n                else c++;\n            }\n        }\n        System.out.println(\"Vowels = \" + v);\n        System.out.println(\"Consonants = \" + c);\n    }\n}\n","python":"import sys\ns = sys.stdin.readline().rstrip('\\n')\nv = c = 0\nfor ch in s:\n    lo = ch.lower()\n    if 'a' <= lo <= 'z':\n        if lo in 'aeiou':\n            v += 1\n        else:\n            c += 1\nprint(f\"Vowels = {v}\")\nprint(f\"Consonants = {c}\")\n","c":"#include <stdio.h>\n#include <string.h>\n#include <ctype.h>\nint main(void) {\n    static char buf[100005];\n    if (!fgets(buf, sizeof(buf), stdin)) { printf(\"Vowels = 0\\nConsonants = 0\\n\"); return 0; }\n    int v = 0, c = 0;\n    for (size_t i = 0; buf[i]; i++) {\n        int ch = tolower((unsigned char)buf[i]);\n        if (ch >= 'a' && ch <= 'z') {\n            if (ch == 'a' || ch == 'e' || ch == 'i' || ch == 'o' || ch == 'u') v++;\n            else c++;\n        }\n    }\n    printf(\"Vowels = %d\\nConsonants = %d\\n\", v, c);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <string>\n#include <cctype>\nusing namespace std;\nint main() {\n    string s;\n    getline(cin, s);\n    int v = 0, c = 0;\n    for (char raw : s) {\n        char ch = tolower((unsigned char)raw);\n        if (ch >= 'a' && ch <= 'z') {\n            if (ch == 'a' || ch == 'e' || ch == 'i' || ch == 'o' || ch == 'u') v++;\n            else c++;\n        }\n    }\n    cout << \"Vowels = \" << v << \"\\nConsonants = \" << c << \"\\n\";\n    return 0;\n}\n","javascript":"const s = require('fs').readFileSync(0, 'utf8').split('\\n')[0].replace(/\\r$/, '');\nlet v = 0, c = 0;\nfor (const raw of s) {\n    const ch = raw.toLowerCase();\n    if (ch >= 'a' && ch <= 'z') {\n        if ('aeiou'.includes(ch)) v++;\n        else c++;\n    }\n}\nconsole.log(`Vowels = ${v}`);\nconsole.log(`Consonants = ${c}`);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"aeiou","expected":"Vowels = 5\nConsonants = 0","hidden":true},{"input":"xyz","expected":"Vowels = 0\nConsonants = 3","hidden":true},{"input":"AEIOU bcd","expected":"Vowels = 5\nConsonants = 3","hidden":true},{"input":"The quick brown fox","expected":"Vowels = 5\nConsonants = 11","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 23
)
on conflict (id) do nothing;

-- 24. Character Frequency  [Easy]  /practice/problems/character-frequency
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-strings-24', 'dt-practice-strings', null,
  $px$Character Frequency$px$, $px$character-frequency$px$, $px$Easy$px$,
  $px$Given a string, count how many times each character occurs and report the counts in order of the characters' **first appearance**.

**Input Format**

A single line containing the string `S`. `S` has no spaces.

**Output Format**

For each distinct character, in order of first appearance, print a line `c = k` where `c` is the character and `k` is its number of occurrences.$px$,
  $px$[{"input":"banana","output":"b = 1\na = 3\nn = 2","explanation":"a appears three times, n twice, b once — listed in first-appearance order."}]$px$::jsonb,
  $px$["1 <= length of S <= 100000","S consists of lowercase English letters and digits, with no spaces."]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        String s = br.readLine();\n        if (s == null) s = \"\";\n        LinkedHashMap<Character, Integer> m = new LinkedHashMap<>();\n        for (int i = 0; i < s.length(); i++) {\n            char ch = s.charAt(i);\n            m.merge(ch, 1, Integer::sum);\n        }\n        StringBuilder sb = new StringBuilder();\n        for (Map.Entry<Character, Integer> e : m.entrySet()) sb.append(e.getKey()).append(\" = \").append(e.getValue()).append('\\n');\n        System.out.print(sb);\n    }\n}\n","python":"import sys\ns = sys.stdin.readline().rstrip('\\n')\norder = []\ncount = {}\nfor ch in s:\n    if ch not in count:\n        count[ch] = 0\n        order.append(ch)\n    count[ch] += 1\nprint('\\n'.join(f\"{ch} = {count[ch]}\" for ch in order))\n","c":"#include <stdio.h>\n#include <string.h>\nint main(void) {\n    static char buf[100005];\n    if (!fgets(buf, sizeof(buf), stdin)) return 0;\n    size_t n = strlen(buf);\n    while (n > 0 && (buf[n - 1] == '\\n' || buf[n - 1] == '\\r')) buf[--n] = 0;\n    int count[128] = {0};\n    char order[128];\n    int oc = 0;\n    for (size_t i = 0; i < n; i++) {\n        unsigned char ch = buf[i];\n        if (count[ch] == 0) order[oc++] = ch;\n        count[ch]++;\n    }\n    for (int i = 0; i < oc; i++) printf(\"%c = %d\\n\", order[i], count[(unsigned char)order[i]]);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <string>\n#include <vector>\nusing namespace std;\nint main() {\n    string s;\n    getline(cin, s);\n    int cnt[128] = {0};\n    vector<char> order;\n    for (unsigned char ch : s) {\n        if (cnt[ch] == 0) order.push_back(ch);\n        cnt[ch]++;\n    }\n    for (char ch : order) cout << ch << \" = \" << cnt[(unsigned char)ch] << \"\\n\";\n    return 0;\n}\n","javascript":"const s = require('fs').readFileSync(0, 'utf8').split('\\n')[0].replace(/\\r$/, '');\nconst order = [];\nconst count = new Map();\nfor (const ch of s) {\n    if (!count.has(ch)) { count.set(ch, 0); order.push(ch); }\n    count.set(ch, count.get(ch) + 1);\n}\nconsole.log(order.map((ch) => `${ch} = ${count.get(ch)}`).join('\\n'));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"a","expected":"a = 1","hidden":true},{"input":"abcabc","expected":"a = 2\nb = 2\nc = 2","hidden":true},{"input":"aaaa","expected":"a = 4","hidden":true},{"input":"hello","expected":"h = 1\ne = 1\nl = 2\no = 1","hidden":true},{"input":"9080","expected":"9 = 1\n0 = 2\n8 = 1","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 24
)
on conflict (id) do nothing;

-- 25. First Non-Repeating Character  [Easy]  /practice/problems/first-non-repeating-character
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-strings-25', 'dt-practice-strings', null,
  $px$First Non-Repeating Character$px$, $px$first-non-repeating-character$px$, $px$Easy$px$,
  $px$Find the first character in a string that appears exactly once. At least one such character is guaranteed to exist.

**Input Format**

A single line containing the string `S` with no spaces.

**Output Format**

Print the first non-repeating character.$px$,
  $px$[{"input":"swiss","output":"w","explanation":"w occurs only once and appears before every other non-repeating character."}]$px$::jsonb,
  $px$["1 <= length of S <= 100000","S consists of lowercase English letters.","At least one non-repeating character exists."]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        String s = br.readLine();\n        if (s == null) s = \"\";\n        int[] cnt = new int[128];\n        for (int i = 0; i < s.length(); i++) cnt[s.charAt(i)]++;\n        for (int i = 0; i < s.length(); i++) {\n            if (cnt[s.charAt(i)] == 1) { System.out.println(s.charAt(i)); break; }\n        }\n    }\n}\n","python":"import sys\nfrom collections import Counter\ns = sys.stdin.readline().rstrip('\\n')\nc = Counter(s)\nfor ch in s:\n    if c[ch] == 1:\n        print(ch)\n        break\n","c":"#include <stdio.h>\n#include <string.h>\nint main(void) {\n    static char buf[100005];\n    if (!fgets(buf, sizeof(buf), stdin)) return 0;\n    size_t n = strlen(buf);\n    while (n > 0 && (buf[n - 1] == '\\n' || buf[n - 1] == '\\r')) buf[--n] = 0;\n    int cnt[128] = {0};\n    for (size_t i = 0; i < n; i++) cnt[(unsigned char)buf[i]]++;\n    for (size_t i = 0; i < n; i++) if (cnt[(unsigned char)buf[i]] == 1) { printf(\"%c\\n\", buf[i]); break; }\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n    string s;\n    getline(cin, s);\n    int cnt[128] = {0};\n    for (unsigned char ch : s) cnt[ch]++;\n    for (unsigned char ch : s) if (cnt[ch] == 1) { cout << ch << \"\\n\"; break; }\n    return 0;\n}\n","javascript":"const s = require('fs').readFileSync(0, 'utf8').split('\\n')[0].replace(/\\r$/, '');\nconst count = {};\nfor (const ch of s) count[ch] = (count[ch] || 0) + 1;\nfor (const ch of s) if (count[ch] === 1) { console.log(ch); break; }\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"a","expected":"a","hidden":true},{"input":"aabbc","expected":"c","hidden":true},{"input":"abcab","expected":"c","hidden":true},{"input":"xxyz","expected":"y","hidden":true},{"input":"aabbccd","expected":"d","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 25
)
on conflict (id) do nothing;

-- 26. Check Anagram  [Easy]  /practice/problems/check-anagram
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-strings-26', 'dt-practice-strings', null,
  $px$Check Anagram$px$, $px$check-anagram$px$, $px$Easy$px$,
  $px$Given two strings, determine whether they contain exactly the same characters with the same frequencies, regardless of order.

**Input Format**

The first line contains string `A`.
The second line contains string `B`.
Neither string contains spaces.

**Output Format**

Print `1` if `A` and `B` are anagrams, otherwise print `0`.$px$,
  $px$[{"input":"listen\nsilent","output":"1","explanation":"Both strings contain the same letters with the same counts."}]$px$::jsonb,
  $px$["1 <= length of A, B <= 100000","Both strings consist of lowercase English letters."]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        String a = br.readLine(), b = br.readLine();\n        if (a == null) a = \"\";\n        if (b == null) b = \"\";\n        char[] x = a.toCharArray(), y = b.toCharArray();\n        Arrays.sort(x); Arrays.sort(y);\n        System.out.println(Arrays.equals(x, y) ? 1 : 0);\n    }\n}\n","python":"import sys\nlines = sys.stdin.read().split('\\n')\na, b = lines[0], lines[1]\nprint(1 if sorted(a) == sorted(b) else 0)\n","c":"#include <stdio.h>\n#include <string.h>\nint main(void) {\n    static char a[100005], b[100005];\n    if (!fgets(a, sizeof(a), stdin)) a[0] = 0;\n    if (!fgets(b, sizeof(b), stdin)) b[0] = 0;\n    a[strcspn(a, \"\\r\\n\")] = 0;\n    b[strcspn(b, \"\\r\\n\")] = 0;\n    int ca[128] = {0}, cb[128] = {0};\n    for (size_t i = 0; a[i]; i++) ca[(unsigned char)a[i]]++;\n    for (size_t i = 0; b[i]; i++) cb[(unsigned char)b[i]]++;\n    int ok = 1;\n    for (int i = 0; i < 128; i++) if (ca[i] != cb[i]) ok = 0;\n    printf(\"%d\\n\", ok);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <string>\n#include <algorithm>\nusing namespace std;\nint main() {\n    string a, b;\n    getline(cin, a);\n    getline(cin, b);\n    sort(a.begin(), a.end());\n    sort(b.begin(), b.end());\n    cout << (a == b ? 1 : 0) << \"\\n\";\n    return 0;\n}\n","javascript":"const lines = require('fs').readFileSync(0, 'utf8').split('\\n');\nconst a = (lines[0] || '').replace(/\\r$/, '').split('').sort().join('');\nconst b = (lines[1] || '').replace(/\\r$/, '').split('').sort().join('');\nconsole.log(a === b ? 1 : 0);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"a\nb","expected":"0","hidden":true},{"input":"aab\naba","expected":"1","hidden":true},{"input":"abc\nabcd","expected":"0","hidden":true},{"input":"rat\ncar","expected":"0","hidden":true},{"input":"aaaa\naaaa","expected":"1","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 26
)
on conflict (id) do nothing;

-- 27. Remove Duplicate Characters  [Easy]  /practice/problems/remove-duplicate-characters
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-strings-27', 'dt-practice-strings', null,
  $px$Remove Duplicate Characters$px$, $px$remove-duplicate-characters$px$, $px$Easy$px$,
  $px$Given a string, remove repeated characters, keeping only the first occurrence of each character in its original position.

**Input Format**

A single line containing the string `S` with no spaces.

**Output Format**

Print the string after removing duplicate characters.$px$,
  $px$[{"input":"programming","output":"progamin","explanation":"Each character is kept only at its first occurrence."}]$px$::jsonb,
  $px$["1 <= length of S <= 100000","S consists of lowercase English letters."]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        String s = br.readLine();\n        if (s == null) s = \"\";\n        boolean[] seen = new boolean[128];\n        StringBuilder sb = new StringBuilder();\n        for (int i = 0; i < s.length(); i++) {\n            char ch = s.charAt(i);\n            if (!seen[ch]) { seen[ch] = true; sb.append(ch); }\n        }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\ns = sys.stdin.readline().rstrip('\\n')\nseen = set()\nout = []\nfor ch in s:\n    if ch not in seen:\n        seen.add(ch)\n        out.append(ch)\nprint(''.join(out))\n","c":"#include <stdio.h>\n#include <string.h>\nint main(void) {\n    static char buf[100005];\n    if (!fgets(buf, sizeof(buf), stdin)) return 0;\n    buf[strcspn(buf, \"\\r\\n\")] = 0;\n    int seen[128] = {0};\n    for (size_t i = 0; buf[i]; i++) {\n        unsigned char ch = buf[i];\n        if (!seen[ch]) { seen[ch] = 1; putchar(ch); }\n    }\n    putchar('\\n');\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n    string s;\n    getline(cin, s);\n    bool seen[128] = {false};\n    string out;\n    for (unsigned char ch : s) if (!seen[ch]) { seen[ch] = true; out += ch; }\n    cout << out << \"\\n\";\n    return 0;\n}\n","javascript":"const s = require('fs').readFileSync(0, 'utf8').split('\\n')[0].replace(/\\r$/, '');\nconst seen = new Set();\nlet out = '';\nfor (const ch of s) if (!seen.has(ch)) { seen.add(ch); out += ch; }\nconsole.log(out);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"a","expected":"a","hidden":true},{"input":"aaaa","expected":"a","hidden":true},{"input":"abcabc","expected":"abc","hidden":true},{"input":"mississippi","expected":"misp","hidden":true},{"input":"abcdef","expected":"abcdef","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 27
)
on conflict (id) do nothing;

-- 28. Reverse Words in a Sentence  [Easy]  /practice/problems/reverse-words-in-a-sentence
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-strings-28', 'dt-practice-strings', null,
  $px$Reverse Words in a Sentence$px$, $px$reverse-words-in-a-sentence$px$, $px$Easy$px$,
  $px$Given a sentence, reverse the order of its words without reversing the characters inside each word.

**Input Format**

A single line containing words separated by single spaces, with no leading or trailing spaces.

**Output Format**

Print the sentence with its words in reverse order, separated by single spaces.$px$,
  $px$[{"input":"I love coding","output":"coding love I","explanation":"Only the order of the words changes."}]$px$::jsonb,
  $px$["1 <= length of S <= 100000","Words are separated by exactly one space."]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        String s = br.readLine();\n        if (s == null) s = \"\";\n        String[] w = s.split(\" \");\n        StringBuilder sb = new StringBuilder();\n        for (int i = w.length - 1; i >= 0; i--) { sb.append(w[i]); if (i > 0) sb.append(' '); }\n        System.out.println(sb.toString());\n    }\n}\n","python":"import sys\ns = sys.stdin.readline().rstrip('\\n')\nprint(' '.join(reversed(s.split(' '))))\n","c":"#include <stdio.h>\n#include <string.h>\nint main(void) {\n    static char buf[100005];\n    if (!fgets(buf, sizeof(buf), stdin)) return 0;\n    buf[strcspn(buf, \"\\r\\n\")] = 0;\n    int n = (int)strlen(buf);\n    int end = n;\n    int first = 1;\n    for (int i = n - 1; i >= 0; i--) {\n        if (buf[i] == ' ') {\n            if (!first) putchar(' ');\n            fwrite(buf + i + 1, 1, end - (i + 1), stdout);\n            first = 0;\n            end = i;\n        }\n    }\n    if (!first) putchar(' ');\n    fwrite(buf, 1, end, stdout);\n    putchar('\\n');\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <string>\n#include <sstream>\n#include <vector>\nusing namespace std;\nint main() {\n    string s;\n    getline(cin, s);\n    istringstream iss(s);\n    vector<string> w;\n    string tok;\n    while (iss >> tok) w.push_back(tok);\n    for (int i = (int)w.size() - 1; i >= 0; i--) { cout << w[i]; if (i > 0) cout << ' '; }\n    cout << \"\\n\";\n    return 0;\n}\n","javascript":"const s = require('fs').readFileSync(0, 'utf8').split('\\n')[0].replace(/\\r$/, '');\nconsole.log(s.split(' ').reverse().join(' '));\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"hello","expected":"hello","hidden":true},{"input":"a b c d","expected":"d c b a","hidden":true},{"input":"the quick brown fox","expected":"fox brown quick the","hidden":true},{"input":"one two","expected":"two one","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 28
)
on conflict (id) do nothing;

-- 29. Longest Common Prefix  [Easy]  /practice/problems/longest-common-prefix
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-strings-29', 'dt-practice-strings', null,
  $px$Longest Common Prefix$px$, $px$longest-common-prefix$px$, $px$Easy$px$,
  $px$Given a list of strings, find the longest prefix shared by every string. If there is no common prefix, the answer is the empty string.

**Input Format**

The first line contains an integer `K`, the number of strings.
Each of the next `K` lines contains one string with no spaces.

**Output Format**

Print the longest common prefix. If it is empty, print an empty line.$px$,
  $px$[{"input":"3\nflower\nflow\nflight","output":"fl","explanation":"All three strings start with fl but differ at the next character."}]$px$::jsonb,
  $px$["1 <= K <= 1000","1 <= length of each string <= 200","Strings consist of lowercase English letters."]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        int k = Integer.parseInt(br.readLine().trim());\n        String pref = br.readLine();\n        if (pref == null) pref = \"\";\n        for (int j = 1; j < k; j++) {\n            String w = br.readLine();\n            if (w == null) w = \"\";\n            int i = 0;\n            while (i < pref.length() && i < w.length() && pref.charAt(i) == w.charAt(i)) i++;\n            pref = pref.substring(0, i);\n        }\n        System.out.println(pref);\n    }\n}\n","python":"import sys\nlines = sys.stdin.read().split('\\n')\nk = int(lines[0])\nwords = lines[1:1+k]\npref = words[0]\nfor w in words[1:]:\n    i = 0\n    while i < len(pref) and i < len(w) and pref[i] == w[i]:\n        i += 1\n    pref = pref[:i]\nprint(pref)\n","c":"#include <stdio.h>\n#include <string.h>\nint main(void) {\n    int k;\n    if (scanf(\"%d\", &k) != 1) return 0;\n    static char pref[256], w[256];\n    scanf(\"%255s\", pref);\n    int plen = (int)strlen(pref);\n    for (int j = 1; j < k; j++) {\n        scanf(\"%255s\", w);\n        int i = 0;\n        while (i < plen && w[i] && pref[i] == w[i]) i++;\n        plen = i;\n        pref[plen] = 0;\n    }\n    printf(\"%s\\n\", pref);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n    int k; cin >> k;\n    string pref; cin >> pref;\n    for (int j = 1; j < k; j++) {\n        string w; cin >> w;\n        size_t i = 0;\n        while (i < pref.size() && i < w.size() && pref[i] == w[i]) i++;\n        pref = pref.substr(0, i);\n    }\n    cout << pref << \"\\n\";\n    return 0;\n}\n","javascript":"const lines = require('fs').readFileSync(0, 'utf8').split('\\n');\nconst k = Number(lines[0]);\nlet pref = (lines[1] || '').replace(/\\r$/, '');\nfor (let j = 2; j <= k; j++) {\n    const w = (lines[j] || '').replace(/\\r$/, '');\n    let i = 0;\n    while (i < pref.length && i < w.length && pref[i] === w[i]) i++;\n    pref = pref.slice(0, i);\n}\nconsole.log(pref);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"1\nhello","expected":"hello","hidden":true},{"input":"2\nabc\ndef","expected":"","hidden":true},{"input":"3\nabcde\nabc\nabcxy","expected":"abc","hidden":true},{"input":"2\nsame\nsame","expected":"same","hidden":true},{"input":"4\nprefix\npre\npretty\npref","expected":"pre","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 29
)
on conflict (id) do nothing;

-- 30. Longest Substring Without Repeating Characters  [Medium]  /practice/problems/longest-substring-without-repeating-characters
insert into public.dsa_problems
  (id, topic_id, learning_topic_id, title, slug, difficulty, description,
   examples, constraints, starter_code, solution_code, hints, test_cases,
   editorial, solution_approach, time_complexity, space_complexity,
   supported_languages, status, is_premium, sort_order)
values (
  'cp-practice-strings-30', 'dt-practice-strings', null,
  $px$Longest Substring Without Repeating Characters$px$, $px$longest-substring-without-repeating-characters$px$, $px$Medium$px$,
  $px$Given a string, find the length of the longest substring that contains no repeated character.

**Input Format**

A single line containing the string `S` with no spaces.

**Output Format**

Print the length of the longest substring with all distinct characters.$px$,
  $px$[{"input":"abcabcbb","output":"3","explanation":"abc is the longest substring with all unique characters."}]$px$::jsonb,
  $px$["1 <= length of S <= 100000","S consists of lowercase English letters and digits."]$px$::jsonb,
  $px${"java":"import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: read the input, compute the answer, and print it\n    }\n}\n","python":"import sys\n\ndata = sys.stdin.read()\n# TODO: parse the input above and print the answer\n","c":"#include <stdio.h>\n\nint main(void) {\n    // TODO: read input with scanf / fgets, compute, print with printf\n    return 0;\n}\n","cpp":"#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: read the input, compute the answer, and print it\n    return 0;\n}\n","javascript":"const data = require('fs').readFileSync(0, 'utf8');\n// TODO: parse the input above and print the answer\n"}$px$::jsonb,
  $px${"java":"import java.io.*;\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        String s = br.readLine();\n        if (s == null) s = \"\";\n        int[] last = new int[128];\n        java.util.Arrays.fill(last, -1);\n        int lo = 0, best = 0;\n        for (int hi = 0; hi < s.length(); hi++) {\n            char ch = s.charAt(hi);\n            if (last[ch] >= lo) lo = last[ch] + 1;\n            last[ch] = hi;\n            best = Math.max(best, hi - lo + 1);\n        }\n        System.out.println(best);\n    }\n}\n","python":"import sys\ns = sys.stdin.readline().rstrip('\\n')\nlast = {}\nlo = 0\nbest = 0\nfor hi, ch in enumerate(s):\n    if ch in last and last[ch] >= lo:\n        lo = last[ch] + 1\n    last[ch] = hi\n    best = max(best, hi - lo + 1)\nprint(best)\n","c":"#include <stdio.h>\n#include <string.h>\nint main(void) {\n    static char buf[100005];\n    if (!fgets(buf, sizeof(buf), stdin)) { printf(\"0\\n\"); return 0; }\n    buf[strcspn(buf, \"\\r\\n\")] = 0;\n    int last[128];\n    for (int i = 0; i < 128; i++) last[i] = -1;\n    int lo = 0, best = 0, n = (int)strlen(buf);\n    for (int hi = 0; hi < n; hi++) {\n        unsigned char ch = buf[hi];\n        if (last[ch] >= lo) lo = last[ch] + 1;\n        last[ch] = hi;\n        int len = hi - lo + 1;\n        if (len > best) best = len;\n    }\n    printf(\"%d\\n\", best);\n    return 0;\n}\n","cpp":"#include <iostream>\n#include <string>\n#include <vector>\nusing namespace std;\nint main() {\n    string s;\n    getline(cin, s);\n    vector<int> last(128, -1);\n    int lo = 0, best = 0;\n    for (int hi = 0; hi < (int)s.size(); hi++) {\n        unsigned char ch = s[hi];\n        if (last[ch] >= lo) lo = last[ch] + 1;\n        last[ch] = hi;\n        best = max(best, hi - lo + 1);\n    }\n    cout << best << \"\\n\";\n    return 0;\n}\n","javascript":"const s = require('fs').readFileSync(0, 'utf8').split('\\n')[0].replace(/\\r$/, '');\nconst last = new Map();\nlet lo = 0, best = 0;\nfor (let hi = 0; hi < s.length; hi++) {\n    const ch = s[hi];\n    if (last.has(ch) && last.get(ch) >= lo) lo = last.get(ch) + 1;\n    last.set(ch, hi);\n    best = Math.max(best, hi - lo + 1);\n}\nconsole.log(best);\n"}$px$::jsonb,
  $px$[]$px$::jsonb,
  $px$[{"input":"a","expected":"1","hidden":true},{"input":"bbbb","expected":"1","hidden":true},{"input":"pwwkew","expected":"3","hidden":true},{"input":"abcdef","expected":"6","hidden":true},{"input":"abba","expected":"2","hidden":true}]$px$::jsonb,
  $px$$px$, $px$$px$, $px$$px$, $px$$px$,
  array['java','python','c','cpp','javascript'], 'published', false, 30
)
on conflict (id) do nothing;

-- ===========================================================================
-- 3. VALIDATION  (raises, never silently passes)
-- ===========================================================================
do $val$
declare
  v_cat_id text := 'dt-practice-strings';
  v_n int;
begin
  if not exists (select 1 from public.dsa_topics where id = v_cat_id and kind = 'practice') then
    raise exception '0074/046: category % missing', v_cat_id;
  end if;
  select count(*) into v_n from public.dsa_problems
   where topic_id = v_cat_id and learning_topic_id is null and coalesce(status,'published') = 'published';
  if v_n < 10 then
    raise exception '0074/046: expected >= 10 Strings practice problems, found %', v_n;
  end if;
  raise notice '0074/046 OK: % Strings practice problems present.', v_n;
end
$val$;

notify pgrst, 'reload schema';
