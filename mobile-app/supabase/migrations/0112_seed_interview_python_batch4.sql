-- admin-panel/supabase/migrations/084_seed_interview_python_batch4.sql
-- CANONICAL PAIR -- the body below this line is byte-identical to its twin
-- twin: mobile-app/supabase/migrations/0112_seed_interview_python_batch4.sql ; apply either, the other is a guarded no-op.
--
-- ============================================================================
-- BODY -- Python Interview Questions content, batch 4 of 4
-- (mobile 0112_seed_interview_python_batch4.sql  ==  admin 084_seed_interview_python_batch4.sql
--  below this header -- byte-identical, guarded, idempotent, additive.)
-- ============================================================================
-- WHAT / WHY
--   Seeds the next 5 of 22 Python Interview Questions topics, covering
--   source questions in this batch's ranges below, for
--   /practice/interview-questions/python/<topic>. Follows batch 3
--   exactly: same idempotency technique, same sort_order gap convention.
--
--   Source of truth: "Python Interview Master Guide -- 240 Questions" (240
--   numbered Q&A entries, all unique -- no duplicates, no merges, unlike the
--   Java source guide). Every question/answer/example/important-point below
--   is the source text verbatim, with only whitespace re-flowing (the source
--   markdown hard-wraps prose at ~70 chars) and markdown-escaping artifacts
--   undone (`\*args` -> `*args`, `**init**` -> `` `__init__` `` -- the
--   source's own pandoc export rendered dunder names as bold because
--   `__name__` collides with markdown's `**bold**` syntax; the body text of
--   every affected question already uses the correct backtick form, which is
--   how the fix was verified). No question content was reworded, and no
--   question was invented.
--
--   Idempotency: deterministic `id` (python-<topic-slug>-<NN>), upserted with
--   `on conflict (id) do update`. Topic sort_order uses gaps of 10 across all
--   22 topics so later batches never renumber earlier ones; question
--   sort_order is 1..N within each topic, in source Q# order.
-- ----------------------------------------------------------------------------

-- ---- ordering guard -------------------------------------------------------
do $$
begin
  if to_regclass('public.interview_categories') is null
     or to_regclass('public.interview_topics') is null
     or to_regclass('public.interview_questions') is null then
    raise exception '0112_seed_interview_python_batch4/084_seed_interview_python_batch4: interview_categories/topics/questions not found -- apply 0103_interview_questions.sql (admin 075) first.';
  end if;
  if not exists (select 1 from public.interview_categories where id = 'python') then
    raise exception '0112_seed_interview_python_batch4/084_seed_interview_python_batch4: python category not found -- apply 0111_seed_interview_python_batch3.sql (admin 083_seed_interview_python_batch3.sql) first.';
  end if;
end $$;

-- ===========================================================================
-- 1. TOPICS (batch 4 of 4)
-- ===========================================================================
insert into public.interview_topics (id, category_id, name, slug, description, sort_order)
values
  ('python-environment-packaging-cli', 'python', 'Environment, CLI & Packaging', 'environment-packaging-cli',
   $td$Virtual environments, dependency management, pyproject.toml/wheels, and Python's environment/CLI/filesystem standard library.$td$, 180),
  ('python-algorithms-data-structures', 'python', 'Algorithms & Data Structures', 'algorithms-data-structures',
   $td$Time/space complexity, common data-structure patterns (Counter, deque, stack, queue, heap), sorting, and caching.$td$, 190),
  ('python-typing-modern-syntax', 'python', 'Typing & Modern Python Syntax', 'typing-modern-syntax',
   $td$namedtuple, Protocol, Optional/Union, match-case, the walrus operator, and positional-/keyword-only parameters.$td$, 200),
  ('python-builtins-control-flow-scope', 'python', 'Builtins, Control Flow & Scope', 'builtins-control-flow-scope',
   $td$any()/all(), loop control flow, scope, closures, and Python's namespace model.$td$, 210),
  ('python-type-checking-abstract-classes', 'python', 'Type Checking & Abstract Classes', 'type-checking-abstract-classes',
   $td$isinstance/issubclass, ABC virtual subclasses, namespace packages, and dynamic/lazy imports.$td$, 220)
on conflict (id) do update set
  category_id = excluded.category_id, name = excluded.name, slug = excluded.slug,
  description = excluded.description, sort_order = excluded.sort_order, updated_at = now();

-- ===========================================================================
-- 2. QUESTIONS
-- ===========================================================================

-- ---- Environment, CLI & Packaging (17) ------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, sort_order)
values
('python-environment-packaging-cli-01','python-environment-packaging-cli', -- source Q145
 $q$What is environment variable usage in Python?$q$,
 $a$Environment variables provide configuration outside source code and can be read with `os.environ` or `os.getenv`.$a$,
 $ex$```python
import os
port = int(os.getenv("PORT", "8000"))
print(port)
```$ex$,
 $ip$Do not store secrets directly in source code; use appropriate secret/configuration management.$ip$,
 1),
('python-environment-packaging-cli-02','python-environment-packaging-cli', -- source Q146
 $q$What is pathlib?$q$,
 $a$`pathlib` provides object-oriented path handling that is generally clearer and more portable than manually concatenating path strings.$a$,
 $ex$```python
from pathlib import Path
path = Path("data") / "input.txt"
print(path)
```$ex$,
 $ip$Use Path operations instead of hard-coded OS-specific separators.$ip$,
 2),
('python-environment-packaging-cli-03','python-environment-packaging-cli', -- source Q147
 $q$What is argparse?$q$,
 $a$`argparse` is a standard-library module for parsing command-line arguments and generating help messages.$a$,
 $ex$```python
import argparse
p = argparse.ArgumentParser()
p.add_argument("--name", default="Guest")
args = p.parse_args()
print(args.name)
```$ex$,
 $ip$Validate arguments and provide useful help/error messages for command-line tools.$ip$,
 3),
('python-environment-packaging-cli-04','python-environment-packaging-cli', -- source Q148
 $q$What is virtualenv vs venv?$q$,
 $a$`venv` is Python's standard-library mechanism for creating virtual environments. `virtualenv` is a separate, older and feature-rich third-party tool that can support additional workflows.$a$,
 $ex$```bash
python -m venv .venv
```$ex$,
 $ip$For many projects, built-in venv is sufficient; follow the team's tooling choice.$ip$,
 4),
('python-environment-packaging-cli-05','python-environment-packaging-cli', -- source Q149
 $q$What is dependency management?$q$,
 $a$Dependency management records, resolves, and installs the external packages a project needs, ideally with reproducible versions and environments.$a$,
 $ex$```text
pyproject.toml
requirements.txt
lock file/tooling
```$ex$,
 $ip$Modern Python projects often use pyproject.toml plus a package/dependency manager rather than relying only on requirements.txt.$ip$,
 5),
('python-environment-packaging-cli-06','python-environment-packaging-cli', -- source Q150
 $q$What is pyproject.toml?$q$,
 $a$`pyproject.toml` is a standardized configuration file used by Python projects for build systems, project metadata, dependencies, and tool configuration.$a$,
 $ex$```toml
[project]
name = "sample-app"
version = "0.1.0"
```$ex$,
 $ip$The exact fields and supported tools depend on the chosen packaging/build configuration.$ip$,
 6),
('python-environment-packaging-cli-07','python-environment-packaging-cli', -- source Q151
 $q$What is packaging in Python?$q$,
 $a$Packaging turns Python project code into a distributable structure or artifact that can be installed and reused. Modern projects commonly define metadata and build settings in pyproject.toml.$a$,
 $ex$```text
src/
  package_name/
pyproject.toml
```$ex$,
 $ip$Keep package metadata, dependencies, and build configuration consistent with the selected build backend.$ip$,
 7),
('python-environment-packaging-cli-08','python-environment-packaging-cli', -- source Q152
 $q$What is a wheel?$q$,
 $a$A wheel is a built Python distribution format designed for installation without running a source build in many cases.$a$,
 $ex$```text
package_name-1.0.0-py3-none-any.whl
```$ex$,
 $ip$A wheel's compatibility tags indicate which Python/platform combinations it supports.$ip$,
 8),
('python-environment-packaging-cli-09','python-environment-packaging-cli', -- source Q153
 $q$What is source distribution?$q$,
 $a$A source distribution, commonly an sdist, contains source files and packaging metadata from which a package can be built.$a$,
 $ex$```text
package_name-1.0.0.tar.gz
```$ex$,
 $ip$Installing an sdist can require build tools or compilation for packages with native extensions.$ip$,
 9),
('python-environment-packaging-cli-10','python-environment-packaging-cli', -- source Q154
 $q$What is virtual environment activation?$q$,
 $a$Activation changes shell commands such as `python` and `pip` to use the virtual environment's interpreter by adjusting environment variables such as PATH.$a$,
 $ex$```bash
# Unix-like shells
source .venv/bin/activate
```$ex$,
 $ip$Activation is a convenience; you can also invoke the environment's interpreter directly.$ip$,
 10),
('python-environment-packaging-cli-11','python-environment-packaging-cli', -- source Q155
 $q$What is dependency conflict?$q$,
 $a$A dependency conflict occurs when installed packages require incompatible versions of the same dependency.$a$,
 $ex$```text
Package A -> library >=2
Package B -> library <2
```$ex$,
 $ip$Use isolated environments and a resolver/lock strategy to make dependency versions reproducible.$ip$,
 11),
('python-environment-packaging-cli-12','python-environment-packaging-cli', -- source Q157
 $q$What is dependency injection in Python?$q$,
 $a$Dependency injection means passing dependencies into a component instead of creating them internally, making code easier to test and replace.$a$,
 $ex$```python
class OrderService:
    def __init__(self, payment_gateway):
        self.payment_gateway = payment_gateway

service = OrderService(FakePaymentGateway())
```$ex$,
 $ip$Python's flexible objects make simple constructor injection sufficient for many projects; a DI framework is not always necessary.$ip$,
 12),
('python-environment-packaging-cli-13','python-environment-packaging-cli', -- source Q215
 $q$What is pathlib Path.exists()?$q$,
 $a$`Path.exists()` checks whether a filesystem path exists.$a$,
 $ex$```python
from pathlib import Path
p = Path("data.txt")
print(p.exists())
```$ex$,
 $ip$Existence checks can race with later operations; for critical file operations, handle the actual operation's exception as well.$ip$,
 13),
('python-environment-packaging-cli-14','python-environment-packaging-cli', -- source Q216
 $q$What is os.environ?$q$,
 $a$`os.environ` exposes the process environment variables as a mapping-like object.$a$,
 $ex$```python
import os
mode = os.environ.get("APP_MODE", "dev")
print(mode)
```$ex$,
 $ip$Environment variables are strings; convert them to the required type.$ip$,
 14),
('python-environment-packaging-cli-15','python-environment-packaging-cli', -- source Q217
 $q$What is subprocess?$q$,
 $a$`subprocess` lets Python start and communicate with external processes.$a$,
 $ex$```python
import subprocess
result = subprocess.run(["python", "--version"], capture_output=True, text=True)
print(result.stdout or result.stderr)
```$ex$,
 $ip$Prefer argument lists over shell command strings and be careful with `shell=True` when inputs are untrusted.$ip$,
 15),
('python-environment-packaging-cli-16','python-environment-packaging-cli', -- source Q218
 $q$What is sys.argv?$q$,
 $a$`sys.argv` contains command-line arguments passed to a Python script, with the script name normally at index zero.$a$,
 $ex$```python
import sys
print(sys.argv)
```$ex$,
 $ip$For nontrivial command-line interfaces, argparse provides parsing, validation, and help output.$ip$,
 16),
('python-environment-packaging-cli-17','python-environment-packaging-cli', -- source Q219
 $q$What is sys.path?$q$,
 $a$`sys.path` is the list of locations Python searches for modules during imports.$a$,
 $ex$```python
import sys
print(sys.path)
```$ex$,
 $ip$Changing sys.path at runtime can hide packaging problems; prefer proper packages and environment configuration.$ip$,
 17)
on conflict (id) do update set
  topic_id = excluded.topic_id, question = excluded.question, answer = excluded.answer,
  example = excluded.example, important_point = excluded.important_point,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- Algorithms & Data Structures (29) ------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, sort_order)
values
('python-algorithms-data-structures-01','python-algorithms-data-structures', -- source Q158
 $q$What is time complexity?$q$,
 $a$Time complexity describes how an algorithm's running work grows with input size. Common classes include O(1), O(log n), O(n), O(n log n), and O(n²).$a$,
 $ex$```python
# One pass through n items is typically O(n)
for x in values:
    print(x)
```$ex$,
 $ip$State complexity for the actual algorithm, not simply for the Python syntax.$ip$,
 1),
('python-algorithms-data-structures-02','python-algorithms-data-structures', -- source Q159
 $q$What is space complexity?$q$,
 $a$Space complexity describes how extra memory usage grows with input size, excluding or including output according to the stated convention.$a$,
 $ex$```python
seen = set(values)  # extra memory can grow with n
```$ex$,
 $ip$Always clarify whether you are discussing auxiliary space or total space.$ip$,
 2),
('python-algorithms-data-structures-03','python-algorithms-data-structures', -- source Q160
 $q$How do you find duplicates in a list?$q$,
 $a$Use a set to track values already seen and collect values that appear again.$a$,
 $ex$```python
values = [1, 2, 3, 2, 4, 1]
seen, duplicates = set(), set()
for x in values:
    if x in seen:
        duplicates.add(x)
    else:
        seen.add(x)
print(duplicates)
```$ex$,
 $ip$This is O(n) average time and O(n) extra space.$ip$,
 3),
('python-algorithms-data-structures-04','python-algorithms-data-structures', -- source Q161
 $q$How do you count word frequency?$q$,
 $a$Split the text into words and count them with `collections.Counter` or a dictionary.$a$,
 $ex$```python
from collections import Counter
text = "python is easy python is popular"
print(Counter(text.split()))
```$ex$,
 $ip$Normalize case and punctuation first when the business requirement considers them equivalent.$ip$,
 4),
('python-algorithms-data-structures-05','python-algorithms-data-structures', -- source Q162
 $q$What is Counter?$q$,
 $a$`collections.Counter` is a dictionary-like class specialized for counting hashable values.$a$,
 $ex$```python
from collections import Counter
print(Counter("banana"))
```$ex$,
 $ip$Counter can return zero for missing keys, but it is still important to understand how zero/negative counts behave in its specialized operations.$ip$,
 5),
('python-algorithms-data-structures-06','python-algorithms-data-structures', -- source Q163
 $q$What is defaultdict?$q$,
 $a$`collections.defaultdict` supplies a default value through a factory when a missing key is accessed.$a$,
 $ex$```python
from collections import defaultdict

groups = defaultdict(list)
groups["Java"].append("Amit")
print(groups)
```$ex$,
 $ip$Accessing a missing key creates it, so use `get()` when you do not want that side effect.$ip$,
 6),
('python-algorithms-data-structures-07','python-algorithms-data-structures', -- source Q164
 $q$What is deque?$q$,
 $a$`collections.deque` is a double-ended queue optimized for appending and removing from both ends.$a$,
 $ex$```python
from collections import deque
q = deque([1, 2])
q.appendleft(0)
q.append(3)
print(q)
```$ex$,
 $ip$For frequent front removals, deque is preferable to list because list.pop(0) shifts elements.$ip$,
 7),
('python-algorithms-data-structures-08','python-algorithms-data-structures', -- source Q165
 $q$How do you implement a stack in Python?$q$,
 $a$A list can implement a stack efficiently using `append()` for push and `pop()` for removing the top element.$a$,
 $ex$```python
stack = []
stack.append(10)
stack.append(20)
print(stack.pop())
```$ex$,
 $ip$Use deque when you need efficient operations at both ends.$ip$,
 8),
('python-algorithms-data-structures-09','python-algorithms-data-structures', -- source Q166
 $q$How do you implement a queue?$q$,
 $a$Use `collections.deque` so enqueue and dequeue from opposite ends are efficient.$a$,
 $ex$```python
from collections import deque
q = deque()
q.append("A")
q.append("B")
print(q.popleft())
```$ex$,
 $ip$Avoid list.pop(0) for large queues because it is O(n).$ip$,
 9),
('python-algorithms-data-structures-10','python-algorithms-data-structures', -- source Q167
 $q$How do you reverse a list?$q$,
 $a$Use slicing, reversed(), or an in-place two-pointer approach depending on whether a new list or mutation is required.$a$,
 $ex$```python
a = [1, 2, 3]
print(a[::-1])
a.reverse()
print(a)
```$ex$,
 $ip$`reverse()` mutates the list and returns None; `reversed()` returns an iterator.$ip$,
 10),
('python-algorithms-data-structures-11','python-algorithms-data-structures', -- source Q168
 $q$How do you check palindrome?$q$,
 $a$Compare the sequence with its reverse or use two pointers from the ends.$a$,
 $ex$```python
def palindrome(s):
    return s == s[::-1]
print(palindrome("level"))
```$ex$,
 $ip$For case-insensitive or normalized text, normalize before comparing.$ip$,
 11),
('python-algorithms-data-structures-12','python-algorithms-data-structures', -- source Q169
 $q$How do you find the largest element?$q$,
 $a$Use the built-in `max()` or scan once while maintaining the current maximum.$a$,
 $ex$```python
values = [10, 4, 25, 7]
print(max(values))
```$ex$,
 $ip$An empty iterable raises ValueError unless a default is supplied to max().$ip$,
 12),
('python-algorithms-data-structures-13','python-algorithms-data-structures', -- source Q170
 $q$How do you sort a list of dictionaries?$q$,
 $a$Use `sorted()` or `list.sort()` with a key function that extracts the desired field.$a$,
 $ex$```python
students = [{"name":"A", "marks":80}, {"name":"B", "marks":95}]
print(sorted(students, key=lambda x: x["marks"], reverse=True))
```$ex$,
 $ip$Python's sort is stable, so equal-key elements retain their relative order.$ip$,
 13),
('python-algorithms-data-structures-14','python-algorithms-data-structures', -- source Q171
 $q$What is stable sorting?$q$,
 $a$A stable sort preserves the original relative order of elements with equal sort keys.$a$,
 $ex$```python
items = [("A", 2), ("B", 1), ("C", 2)]
print(sorted(items, key=lambda x: x[1]))
```$ex$,
 $ip$Python's built-in sort is stable and uses Timsort.$ip$,
 14),
('python-algorithms-data-structures-15','python-algorithms-data-structures', -- source Q172
 $q$What is Timsort?$q$,
 $a$Timsort is the hybrid stable sorting algorithm used by Python's built-in list sorting and sorted(). It performs well on partially ordered real-world data.$a$,
 $ex$```python
values = [5, 1, 4, 2, 3]
values.sort()
```$ex$,
 $ip$The implementation details are optimized internally; interview answers should focus on stability and typical O(n log n) worst-case behavior.$ip$,
 15),
('python-algorithms-data-structures-16','python-algorithms-data-structures', -- source Q173
 $q$What is bisect?$q$,
 $a$The `bisect` module provides binary-search-based insertion and search helpers for maintaining sorted lists.$a$,
 $ex$```python
import bisect
values = [10, 20, 40]
bisect.insort(values, 30)
print(values)
```$ex$,
 $ip$Searching is O(log n), but inserting into a Python list is O(n) because elements may need to shift.$ip$,
 16),
('python-algorithms-data-structures-17','python-algorithms-data-structures', -- source Q174
 $q$What is heapq?$q$,
 $a$`heapq` provides a min-heap implementation over a Python list and is useful for priority queues and top-k problems.$a$,
 $ex$```python
import heapq
h = [5, 1, 3]
heapq.heapify(h)
print(heapq.heappop(h))
```$ex$,
 $ip$The heap list is not fully sorted; only the heap property is guaranteed.$ip$,
 17),
('python-algorithms-data-structures-18','python-algorithms-data-structures', -- source Q175
 $q$What is itertools?$q$,
 $a$`itertools` contains efficient iterator-building tools such as chain, combinations, permutations, groupby, and product.$a$,
 $ex$```python
from itertools import combinations
print(list(combinations([1,2,3], 2)))
```$ex$,
 $ip$Many itertools functions are lazy, which can save memory for large pipelines.$ip$,
 18),
('python-algorithms-data-structures-19','python-algorithms-data-structures', -- source Q176
 $q$What is functools?$q$,
 $a$`functools` provides higher-order function utilities such as reduce, partial, wraps, cache, and singledispatch.$a$,
 $ex$```python
from functools import partial

double = partial(pow, exp=2)
print(double(3))
```$ex$,
 $ip$Understand the resulting callable signature/behavior when using partial or decorators.$ip$,
 19),
('python-algorithms-data-structures-20','python-algorithms-data-structures', -- source Q177
 $q$What is lru_cache?$q$,
 $a$`functools.lru_cache` memoizes function results for hashable arguments, avoiding repeated computation.$a$,
 $ex$```python
from functools import lru_cache

@lru_cache(maxsize=None)
def fib(n):
    if n < 2: return n
    return fib(n-1) + fib(n-2)
print(fib(30))
```$ex$,
 $ip$Caching trades memory for speed and only works when the function's result is appropriate to cache.$ip$,
 20),
('python-algorithms-data-structures-21','python-algorithms-data-structures', -- source Q178
 $q$What is caching?$q$,
 $a$Caching stores previously computed or fetched results so future requests can be served faster or with less work.$a$,
 $ex$```python
cache = {}

def square(n):
    if n not in cache:
        cache[n] = n * n
    return cache[n]
```$ex$,
 $ip$A cache needs an invalidation or eviction strategy when data can become stale or memory is limited.$ip$,
 21),
('python-algorithms-data-structures-22','python-algorithms-data-structures', -- source Q179
 $q$Why is list indexing O(1)?$q$,
 $a$Python lists are dynamic arrays in CPython, so an index can be translated to an offset in the underlying array for direct access.$a$,
 $ex$```python
values = [10, 20, 30]
print(values[2])
```$ex$,
 $ip$This describes the common CPython list implementation; inserting at the front is still O(n).$ip$,
 22),
('python-algorithms-data-structures-23','python-algorithms-data-structures', -- source Q180
 $q$Why is dictionary lookup usually O(1)?$q$,
 $a$Python dictionaries use hash-table techniques to locate a key by its hash, giving average-case constant-time lookup.$a$,
 $ex$```python
data = {"id": 101}
print(data["id"])
```$ex$,
 $ip$Worst-case behavior can differ, and hashability/equality rules determine whether a key can be used.$ip$,
 23),
('python-algorithms-data-structures-24','python-algorithms-data-structures', -- source Q181
 $q$Why must dictionary keys be hashable?$q$,
 $a$A dictionary uses a key's hash to choose a lookup location and equality to resolve matching keys. A mutable object whose hash changes would break those assumptions.$a$,
 $ex$```python
key = (1, 2)
data = {key: "point"}
print(data[key])
```$ex$,
 $ip$Hashability requires a stable hash consistent with equality during the key's lifetime.$ip$,
 24),
('python-algorithms-data-structures-25','python-algorithms-data-structures', -- source Q182
 $q$What happens when a key is assigned twice?$q$,
 $a$Assigning an existing dictionary key replaces its associated value while keeping that key's identity in the mapping.$a$,
 $ex$```python
d = {"role": "user"}
d["role"] = "admin"
print(d)
```$ex$,
 $ip$A dictionary cannot contain two separate entries with equal keys.$ip$,
 25),
('python-algorithms-data-structures-26','python-algorithms-data-structures', -- source Q183
 $q$What is insertion order in dictionaries?$q$,
 $a$Python dictionaries preserve insertion order as a language guarantee in modern Python versions. Updating an existing key does not move it to a new position by default.$a$,
 $ex$```python
d = {"a": 1, "b": 2}
d["a"] = 9
print(list(d))
```$ex$,
 $ip$Do not confuse insertion-order preservation with sorting.$ip$,
 26),
('python-algorithms-data-structures-27','python-algorithms-data-structures', -- source Q184
 $q$Why are sets unordered?$q$,
 $a$Sets are designed around hashing and uniqueness rather than positional access. Their iteration order should not be treated as a meaningful sorted or insertion order.$a$,
 $ex$```python
s = {3, 1, 2}
print(2 in s)
```$ex$,
 $ip$Do not rely on a particular printed set order.$ip$,
 27),
('python-algorithms-data-structures-28','python-algorithms-data-structures', -- source Q200
 $q$What is memoization?$q$,
 $a$Memoization caches function results keyed by inputs so repeated calls can avoid repeated computation.$a$,
 $ex$```python
from functools import cache

@cache
def square(n): return n*n
print(square(10))
```$ex$,
 $ip$Memoization is appropriate for deterministic computations with reusable results and manageable cache size.$ip$,
 28),
('python-algorithms-data-structures-29','python-algorithms-data-structures', -- source Q213
 $q$What is functools.partial?$q$,
 $a$`partial()` creates a new callable with some arguments of another callable pre-filled.$a$,
 $ex$```python
from functools import partial

def power(base, exp): return base ** exp
square = partial(power, exp=2)
print(square(5))
```$ex$,
 $ip$Partial application can simplify callbacks and configuration-heavy APIs.$ip$,
 29)
on conflict (id) do update set
  topic_id = excluded.topic_id, question = excluded.question, answer = excluded.answer,
  example = excluded.example, important_point = excluded.important_point,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- Typing & Modern Python Syntax (12) -----------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, sort_order)
values
('python-typing-modern-syntax-01','python-typing-modern-syntax', -- source Q185
 $q$What is a namedtuple?$q$,
 $a$`collections.namedtuple` creates tuple subclasses whose fields can be accessed by name as well as position.$a$,
 $ex$```python
from collections import namedtuple
Point = namedtuple("Point", "x y")
p = Point(10, 20)
print(p.x, p.y)
```$ex$,
 $ip$For new code, dataclasses or typing.NamedTuple may be preferable depending on requirements.$ip$,
 1),
('python-typing-modern-syntax-02','python-typing-modern-syntax', -- source Q186
 $q$What is typing.Protocol?$q$,
 $a$A Protocol defines a structural interface for static type checkers: a type can satisfy the protocol by providing the required members without explicitly inheriting from it.$a$,
 $ex$```python
from typing import Protocol
class HasName(Protocol):
    name: str
```$ex$,
 $ip$Protocol mainly improves static typing; Python's runtime behavior still follows normal duck typing unless runtime_checkable is used.$ip$,
 2),
('python-typing-modern-syntax-03','python-typing-modern-syntax', -- source Q187
 $q$What is Optional in typing?$q$,
 $a$`Optional[T]` traditionally means a value may be T or None; modern Python style often writes the same idea as `T | None`.$a$,
 $ex$```python
def find_name() -> str | None:
    return None
```$ex$,
 $ip$Type annotations do not automatically enforce that a function actually returns the annotated type.$ip$,
 3),
('python-typing-modern-syntax-04','python-typing-modern-syntax', -- source Q188
 $q$What is Union type?$q$,
 $a$A union type represents a value that may have one of several types. Modern Python can express this with `A | B`.$a$,
 $ex$```python
def format_id(value: int | str) -> str:
    return str(value)
```$ex$,
 $ip$A union describes possible types; runtime code still needs correct handling for operations not shared by all members.$ip$,
 4),
('python-typing-modern-syntax-05','python-typing-modern-syntax', -- source Q189
 $q$What is match-case?$q$,
 $a$Structural pattern matching, introduced in Python 3.10, lets code match values and structures using `match` and `case`.$a$,
 $ex$```python
def status(code):
    match code:
        case 200: return "OK"
        case 404: return "Not Found"
        case _: return "Other"
```$ex$,
 $ip$Pattern matching is more powerful than a simple switch because it can match structure and bind values.$ip$,
 5),
('python-typing-modern-syntax-06','python-typing-modern-syntax', -- source Q190
 $q$What is walrus operator?$q$,
 $a$The assignment expression operator `:=` assigns a value as part of an expression.$a$,
 $ex$```python
if (n := len("Python")) > 5:
    print(n)
```$ex$,
 $ip$Use it when it improves clarity; overusing assignment expressions can make code harder to read.$ip$,
 6),
('python-typing-modern-syntax-07','python-typing-modern-syntax', -- source Q191
 $q$What is positional-only parameter?$q$,
 $a$A parameter before `/` in a function signature can only be supplied positionally.$a$,
 $ex$```python
def power(base, exp, /):
    return base ** exp
print(power(2, 3))
```$ex$,
 $ip$Callers cannot use `base=...` for a positional-only parameter.$ip$,
 7),
('python-typing-modern-syntax-08','python-typing-modern-syntax', -- source Q192
 $q$What is keyword-only parameter?$q$,
 $a$A parameter after `*` in a function signature must be passed by keyword.$a$,
 $ex$```python
def connect(host, *, timeout=10):
    print(host, timeout)
connect("localhost", timeout=5)
```$ex$,
 $ip$Keyword-only parameters can make APIs clearer and prevent ambiguous positional calls.$ip$,
 8),
('python-typing-modern-syntax-09','python-typing-modern-syntax', -- source Q193
 $q$What is function annotation?$q$,
 $a$A function annotation attaches metadata such as expected argument and return types to a function definition.$a$,
 $ex$```python
def greet(name: str) -> str:
    return f"Hello {name}"
print(greet.__annotations__)
```$ex$,
 $ip$Annotations are available at runtime as metadata but are not normally runtime type enforcement.$ip$,
 9),
('python-typing-modern-syntax-10','python-typing-modern-syntax', -- source Q194
 $q$What is inspect module?$q$,
 $a$The `inspect` module provides tools for examining live Python objects, signatures, source information, and call frames.$a$,
 $ex$```python
import inspect

def add(a, b): return a+b
print(inspect.signature(add))
```$ex$,
 $ip$Introspection can be affected by decorators, generated functions, or unavailable source code.$ip$,
 10),
('python-typing-modern-syntax-11','python-typing-modern-syntax', -- source Q195
 $q$What is property setter?$q$,
 $a$A property setter defines what happens when code assigns to a property, allowing validation or transformation while keeping attribute syntax.$a$,
 $ex$```python
class User:
    def __init__(self, age): self.age = age
    @property
    def age(self): return self._age
    @age.setter
    def age(self, value):
        if value < 0: raise ValueError("age")
        self._age = value
```$ex$,
 $ip$Keep property setters predictable; surprising side effects make attribute assignment harder to understand.$ip$,
 11),
('python-typing-modern-syntax-12','python-typing-modern-syntax', -- source Q237
 $q$What is Protocol vs ABC?$q$,
 $a$ABC provides nominal inheritance-based contracts and can enforce abstract methods at instantiation. Protocol supports structural typing for static analysis, so compatible classes need not inherit from it.$a$,
 $ex$```python
from typing import Protocol
class HasSave(Protocol):
    def save(self) -> None: ...
```$ex$,
 $ip$Choose based on whether explicit runtime/nominal contracts or structural typing is the better fit.$ip$,
 12)
on conflict (id) do update set
  topic_id = excluded.topic_id, question = excluded.question, answer = excluded.answer,
  example = excluded.example, important_point = excluded.important_point,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- Builtins, Control Flow & Scope (14) ----------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, sort_order)
values
('python-builtins-control-flow-scope-01','python-builtins-control-flow-scope', -- source Q201
 $q$What is a sentinel object?$q$,
 $a$A sentinel is a unique object used to represent a special state that cannot safely be confused with a normal value such as None.$a$,
 $ex$```python
MISSING = object()
value = data.get("name", MISSING)
if value is MISSING:
    print("missing")
```$ex$,
 $ip$Use identity comparison with the sentinel.$ip$,
 1),
('python-builtins-control-flow-scope-02','python-builtins-control-flow-scope', -- source Q202
 $q$What is truthiness?$q$,
 $a$Objects can be evaluated in Boolean contexts. False, None, numeric zero, empty strings, and empty containers are falsey by default; most other objects are truthy.$a$,
 $ex$```python
items = []
if not items:
    print("empty")
```$ex$,
 $ip$Custom classes can define `__bool__` or `__len__` to control truth testing.$ip$,
 2),
('python-builtins-control-flow-scope-03','python-builtins-control-flow-scope', -- source Q203
 $q$What is any()?$q$,
 $a$`any()` returns True when at least one item in an iterable is truthy and stops early once it finds one.$a$,
 $ex$```python
values = [0, 0, 5, 0]
print(any(values))
```$ex$,
 $ip$It short-circuits, so generators can avoid unnecessary work.$ip$,
 3),
('python-builtins-control-flow-scope-04','python-builtins-control-flow-scope', -- source Q204
 $q$What is all()?$q$,
 $a$`all()` returns True when every item in an iterable is truthy and stops at the first falsey item.$a$,
 $ex$```python
values = [2, 4, 6]
print(all(x % 2 == 0 for x in values))
```$ex$,
 $ip$`all([])` is True because there is no element that violates the condition.$ip$,
 4),
('python-builtins-control-flow-scope-05','python-builtins-control-flow-scope', -- source Q207
 $q$What is pass?$q$,
 $a$`pass` is a no-operation statement used where Python syntax requires a statement but no action is currently needed.$a$,
 $ex$```python
class FutureFeature:
    pass
```$ex$,
 $ip$`pass` does not mean 'skip the loop iteration'; use `continue` for that.$ip$,
 5),
('python-builtins-control-flow-scope-06','python-builtins-control-flow-scope', -- source Q208
 $q$pass vs continue vs break?$q$,
 $a$`pass` does nothing, `continue` skips to the next loop iteration, and `break` exits the loop.$a$,
 $ex$```python
for n in range(5):
    if n == 1:
        continue
    if n == 4:
        break
    print(n)
```$ex$,
 $ip$Use each based on control-flow intent; they are not interchangeable.$ip$,
 6),
('python-builtins-control-flow-scope-07','python-builtins-control-flow-scope', -- source Q209
 $q$What is else on a loop?$q$,
 $a$A loop's `else` block runs when the loop finishes normally without hitting `break`.$a$,
 $ex$```python
for n in [1, 3, 5]:
    if n % 2 == 0:
        break
else:
    print("No even number")
```$ex$,
 $ip$The loop else is tied to normal completion, not to whether the loop body executed at least once.$ip$,
 7),
('python-builtins-control-flow-scope-08','python-builtins-control-flow-scope', -- source Q212
 $q$What is sorted key function?$q$,
 $a$The `key` argument tells sorted() what value to compare for each element.$a$,
 $ex$```python
names = ["Bob", "Alexander", "Amy"]
print(sorted(names, key=len))
```$ex$,
 $ip$The key function is called to obtain comparison values; it does not need to return booleans.$ip$,
 8),
('python-builtins-control-flow-scope-09','python-builtins-control-flow-scope', -- source Q220
 $q$What is a namespace?$q$,
 $a$A namespace is a mapping from names to objects. Python has local, enclosing, global, and built-in namespaces, among others.$a$,
 $ex$```python
x = 10
print(globals()["x"])
```$ex$,
 $ip$Namespace concepts explain why two scopes can contain the same name without being the same binding.$ip$,
 9),
('python-builtins-control-flow-scope-10','python-builtins-control-flow-scope', -- source Q221
 $q$What is scope?$q$,
 $a$Scope defines where a name can be accessed directly. Python's name lookup follows local, enclosing, global, and built-in scopes.$a$,
 $ex$```python
x = "global"
def f():
    x = "local"
    print(x)
f()
```$ex$,
 $ip$A nested function can read an enclosing binding but needs `nonlocal` to reassign it.$ip$,
 10),
('python-builtins-control-flow-scope-11','python-builtins-control-flow-scope', -- source Q222
 $q$What is a closure cell?$q$,
 $a$When a nested function retains a variable from an enclosing scope, Python stores that captured binding in a closure cell accessible through function metadata.$a$,
 $ex$```python
def outer():
    x = 10
    def inner(): return x
    return inner

f = outer()
print(f.__closure__)
```$ex$,
 $ip$This is an implementation-level introspection detail; ordinary code should usually reason in terms of closures.$ip$,
 11),
('python-builtins-control-flow-scope-12','python-builtins-control-flow-scope', -- source Q223
 $q$What is function first-class object?$q$,
 $a$Python functions can be assigned to variables, stored in collections, passed as arguments, and returned from other functions.$a$,
 $ex$```python
def greet(): return "Hello"
fn = greet
print(fn())
```$ex$,
 $ip$This property enables callbacks, decorators, and higher-order functions.$ip$,
 12),
('python-builtins-control-flow-scope-13','python-builtins-control-flow-scope', -- source Q224
 $q$What is callable()?$q$,
 $a$`callable()` returns whether an object appears callable, meaning it can be invoked with parentheses according to Python's runtime rules.$a$,
 $ex$```python
print(callable(len))
print(callable(10))
```$ex$,
 $ip$Being callable does not guarantee that calling it with a particular argument list will succeed.$ip$,
 13),
('python-builtins-control-flow-scope-14','python-builtins-control-flow-scope', -- source Q234
 $q$What is the difference between None, False, and 0?$q$,
 $a$None represents absence of a value, False is a boolean false value, and 0 is the integer zero. They can all be falsey but have different types and meanings.$a$,
 $ex$```python
print(None is None)
print(False == 0)
print(type(None), type(False), type(0))
```$ex$,
 $ip$Do not use falsey checks when the requirement specifically distinguishes None from other falsey values.$ip$,
 14)
on conflict (id) do update set
  topic_id = excluded.topic_id, question = excluded.question, answer = excluded.answer,
  example = excluded.example, important_point = excluded.important_point,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- Type Checking & Abstract Classes (6) --------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, sort_order)
values
('python-type-checking-abstract-classes-01','python-type-checking-abstract-classes', -- source Q225
 $q$What is isinstance()?$q$,
 $a$`isinstance(obj, Type)` checks whether an object is an instance of a type or compatible subclass, and it can accept a tuple of types.$a$,
 $ex$```python
value = 10
print(isinstance(value, int))
```$ex$,
 $ip$Prefer behavior-based design when practical; type checks are useful when an API genuinely depends on type-specific behavior.$ip$,
 1),
('python-type-checking-abstract-classes-02','python-type-checking-abstract-classes', -- source Q226
 $q$What is issubclass()?$q$,
 $a$`issubclass(A, B)` checks whether class A is a subclass of B or B is an appropriate superclass/ABC according to Python's type system.$a$,
 $ex$```python
class Dog: pass
class Puppy(Dog): pass
print(issubclass(Puppy, Dog))
```$ex$,
 $ip$The first argument must be a class or a TypeError is raised.$ip$,
 2),
('python-type-checking-abstract-classes-03','python-type-checking-abstract-classes', -- source Q227
 $q$What is ABC virtual subclass?$q$,
 $a$An abstract base class can register an unrelated class as a virtual subclass, allowing certain subclass/instance checks without modifying the registered class's inheritance hierarchy.$a$,
 $ex$```python
from abc import ABC
class Printable(ABC): pass
class Report: pass
Printable.register(Report)
print(issubclass(Report, Printable))
```$ex$,
 $ip$Registration affects ABC checks; it does not add methods to the registered class.$ip$,
 3),
('python-type-checking-abstract-classes-04','python-type-checking-abstract-classes', -- source Q238
 $q$What is a namespace package?$q$,
 $a$A namespace package allows portions of one logical package namespace to exist in multiple directories or distributions without a traditional `__init__`.py in each portion.$a$,
 $ex$```text
company/
  tools/
  services/
```$ex$,
 $ip$Namespace packages are useful for separately distributed components but can complicate packaging if used without a clear need.$ip$,
 4),
('python-type-checking-abstract-classes-05','python-type-checking-abstract-classes', -- source Q239
 $q$What is importlib?$q$,
 $a$`importlib` exposes Python's import machinery so applications can import modules dynamically and inspect import behavior.$a$,
 $ex$```python
import importlib
math = importlib.import_module("math")
print(math.sqrt(16))
```$ex$,
 $ip$Dynamic imports should be controlled carefully when module names come from untrusted input.$ip$,
 5),
('python-type-checking-abstract-classes-06','python-type-checking-abstract-classes', -- source Q240
 $q$What is lazy import?$q$,
 $a$Lazy import delays importing a module or dependency until it is actually needed, which can reduce startup cost in some applications.$a$,
 $ex$```python
def use_json():
    import json
    return json.dumps({"ok": True})
```$ex$,
 $ip$Lazy imports can make dependency errors appear later and may complicate startup diagnostics.$ip$,
 6)
on conflict (id) do update set
  topic_id = excluded.topic_id, question = excluded.question, answer = excluded.answer,
  example = excluded.example, important_point = excluded.important_point,
  sort_order = excluded.sort_order, updated_at = now();

-- ===========================================================================
-- 3. VALIDATION
-- ===========================================================================
do $$
declare
  v_count integer;
begin
  select count(*) into v_count from public.interview_topics where id = any(array['python-environment-packaging-cli', 'python-algorithms-data-structures', 'python-typing-modern-syntax', 'python-builtins-control-flow-scope', 'python-type-checking-abstract-classes']);
  if v_count <> 5 then
    raise exception 'validation: expected 5 topics for this batch, found %', v_count;
  end if;
  select count(*) into v_count from public.interview_questions where topic_id = any(array['python-environment-packaging-cli', 'python-algorithms-data-structures', 'python-typing-modern-syntax', 'python-builtins-control-flow-scope', 'python-type-checking-abstract-classes']);
  if v_count <> 78 then
    raise exception 'validation: expected 78 questions for this batch, found %', v_count;
  end if;
  raise notice '0112_seed_interview_python_batch4 OK: % topics, % questions.', 5, 78;
end $$;

notify pgrst, 'reload schema';
