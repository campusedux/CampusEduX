-- admin-panel/supabase/migrations/081_seed_interview_python_batch1.sql
-- CANONICAL PAIR -- the body below this line is byte-identical to its twin
-- twin: mobile-app/supabase/migrations/0109_seed_interview_python_batch1.sql ; apply either, the other is a guarded no-op.
--
-- ============================================================================
-- BODY -- Python Interview Questions content, batch 1 of 4
-- (mobile 0109_seed_interview_python_batch1.sql  ==  admin 081_seed_interview_python_batch1.sql
--  below this header -- byte-identical, guarded, idempotent, additive.)
-- ============================================================================
-- WHAT / WHY
--   Creates the "Python" interview_categories row and seeds the first 6 of 22
--   Python Interview Questions topics (Python Basics, Data Types & Variables,
--   Lists/Tuples/Sets/Dicts, Functions, Strings, Exception Handling) with
--   source questions Q1-Q61, for /practice/interview-questions/python/<topic>.
--   3 more batches follow, covering the remaining 16 topics (Q62-Q240).
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
    raise exception '0109_seed_interview_python_batch1/081_seed_interview_python_batch1: interview_categories/topics/questions not found -- apply 0103_interview_questions.sql (admin 075) first.';
  end if;
end $$;

-- ===========================================================================
-- 1. CATEGORY -- Python
-- ===========================================================================
insert into public.interview_categories (id, name, slug, description, icon, sort_order)
values ('python', 'Python', 'python',
        $cd$Python interview questions and answers, organized by topic, with examples and key points for quick revision.$cd$,
        'FileCode', 20)
on conflict (id) do update set
  name = excluded.name, slug = excluded.slug, description = excluded.description,
  icon = excluded.icon, sort_order = excluded.sort_order, updated_at = now();

-- ===========================================================================
-- 2. TOPICS (batch 1 of 4)
-- ===========================================================================
insert into public.interview_topics (id, category_id, name, slug, description, sort_order)
values
  ('python-basics', 'python', 'Python Basics', 'basics',
   $td$Python as a language -- what makes it high-level and dynamically typed, and how CPython actually runs a program.$td$, 10),
  ('python-data-types-variables', 'python', 'Data Types & Variables', 'data-types-variables',
   $td$Variables, built-in data types, dynamic vs strong typing, and Python's core equality and mutability rules.$td$, 20),
  ('python-collections', 'python', 'Lists, Tuples, Sets & Dictionaries', 'collections',
   $td$Lists, tuples, sets, dictionaries, comprehensions, slicing, unpacking, and the built-in methods that manipulate them.$td$, 30),
  ('python-functions', 'python', 'Functions', 'functions',
   $td$Function definitions, argument passing, *args/**kwargs, lambdas, decorators, recursion, and variable scope.$td$, 40),
  ('python-strings', 'python', 'Strings', 'strings',
   $td$Python's immutable string type -- formatting, splitting, joining, and Unicode handling.$td$, 50),
  ('python-exception-handling', 'python', 'Exception Handling', 'exception-handling',
   $td$try/except/else/finally, raising and chaining exceptions, and custom exception design.$td$, 60)
on conflict (id) do update set
  category_id = excluded.category_id, name = excluded.name, slug = excluded.slug,
  description = excluded.description, sort_order = excluded.sort_order, updated_at = now();

-- ===========================================================================
-- 3. QUESTIONS
-- ===========================================================================

-- ---- Python Basics (5) ---------------------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, sort_order)
values
('python-basics-01','python-basics', -- source Q1
 $q$What is Python?$q$,
 $a$Python is a high-level, general-purpose programming language known for readable syntax, dynamic typing, a large standard library, and a broad ecosystem. It supports procedural, object-oriented, and functional programming styles.$a$,
 $ex$```python
print("Hello, Python!")
```$ex$,
 $ip$Python is interpreted in the common CPython workflow, but Python itself is a language specification with multiple implementations.$ip$,
 1),
('python-basics-02','python-basics', -- source Q2
 $q$Why is Python popular?$q$,
 $a$Python reduces the amount of code needed for many tasks and has mature libraries for web development, automation, data analysis, testing, AI, and scripting. Its readable syntax also makes it approachable for beginners.$a$,
 $ex$```python
numbers = [1, 2, 3, 4]
print(sum(numbers))
```$ex$,
 $ip$Popularity does not mean Python is ideal for every workload; CPU-heavy applications may need optimization or native extensions.$ip$,
 2),
('python-basics-03','python-basics', -- source Q3
 $q$What are Python's main features?$q$,
 $a$Important features include readable syntax, dynamic typing, automatic memory management, exceptions, modules and packages, first-class functions, comprehensions, generators, and a large standard library.$a$,
 $ex$```python
squares = [x * x for x in range(5)]
print(squares)
```$ex$,
 $ip$Python is dynamically typed, but it is still strongly typed: incompatible operations generally do not silently convert unrelated types.$ip$,
 3),
('python-basics-04','python-basics', -- source Q4
 $q$Is Python interpreted or compiled?$q$,
 $a$Python source is normally compiled to bytecode and then executed by a Python virtual machine in implementations such as CPython. Calling Python simply 'interpreted' is a useful simplification but not the whole execution model.$a$,
 $ex$```text
.py -> bytecode -> Python runtime -> execution
```$ex$,
 $ip$The exact compilation/execution strategy depends on the Python implementation.$ip$,
 4),
('python-basics-05','python-basics', -- source Q5
 $q$What is CPython?$q$,
 $a$CPython is the reference implementation of Python and the implementation most commonly installed from python.org. It translates Python source into bytecode and executes it using its runtime.$a$,
 $ex$```python
import platform
print(platform.python_implementation())
```$ex$,
 $ip$CPython is an implementation, not another name for the Python language.$ip$,
 5)
on conflict (id) do update set
  topic_id = excluded.topic_id, question = excluded.question, answer = excluded.answer,
  example = excluded.example, important_point = excluded.important_point,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- Data Types & Variables (10) ------------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, sort_order)
values
('python-data-types-variables-01','python-data-types-variables', -- source Q6
 $q$What is a variable in Python?$q$,
 $a$A Python variable is a name bound to an object. Assignment does not declare a fixed variable type; the same name can later refer to an object of another type.$a$,
 $ex$```python
x = 10
x = "Python"
print(x)
```$ex$,
 $ip$The object has a type; the name is a reference/binding to that object.$ip$,
 1),
('python-data-types-variables-02','python-data-types-variables', -- source Q7
 $q$What are Python data types?$q$,
 $a$Common built-in types include int, float, complex, bool, str, list, tuple, set, dict, bytes, bytearray, range, and NoneType. Python also lets developers create custom classes.$a$,
 $ex$```python
age = 25
name = "Amit"
marks = [80, 90]
```$ex$,
 $ip$Use `type()` or `isinstance()` when type inspection is actually needed.$ip$,
 2),
('python-data-types-variables-03','python-data-types-variables', -- source Q8
 $q$What is dynamic typing?$q$,
 $a$Dynamic typing means the type associated with a value is determined at runtime and a name can be rebound to objects of different types.$a$,
 $ex$```python
value = 10
value = "ten"
```$ex$,
 $ip$Dynamic typing does not remove type checking; many type errors are discovered when the relevant code executes.$ip$,
 3),
('python-data-types-variables-04','python-data-types-variables', -- source Q9
 $q$What is strong typing in Python?$q$,
 $a$Python generally does not perform arbitrary implicit conversions between unrelated types. For example, adding a string and an integer raises TypeError.$a$,
 $ex$```python
# "10" + 5  # TypeError
result = int("10") + 5
print(result)
```$ex$,
 $ip$Explicit conversion is clearer and safer when values come from external sources.$ip$,
 4),
('python-data-types-variables-05','python-data-types-variables', -- source Q10
 $q$What is indentation in Python?$q$,
 $a$Indentation is part of Python's syntax and defines code blocks instead of braces. Consistent indentation is therefore required.$a$,
 $ex$```python
if age >= 18:
    print("Adult")
```$ex$,
 $ip$Mixing tabs and spaces inconsistently can cause indentation errors; four spaces is the common convention.$ip$,
 5),
('python-data-types-variables-06','python-data-types-variables', -- source Q11
 $q$What is PEP 8?$q$,
 $a$PEP 8 is Python's style guide. It recommends conventions for formatting, naming, imports, whitespace, and code layout to improve readability.$a$,
 $ex$```python
def calculate_total(price, tax):
    return price + tax
```$ex$,
 $ip$PEP 8 is a style guideline, not a rule that changes Python's execution semantics.$ip$,
 6),
('python-data-types-variables-07','python-data-types-variables', -- source Q12
 $q$What is None?$q$,
 $a$`None` is Python's singleton value representing the absence of a value or a deliberate 'no result' state.$a$,
 $ex$```python
def find_user(user_id):
    return None

print(find_user(10) is None)
```$ex$,
 $ip$Use `is None` rather than `== None` for the usual identity check.$ip$,
 7),
('python-data-types-variables-08','python-data-types-variables', -- source Q13
 $q$What is mutable vs immutable?$q$,
 $a$Mutable objects can be changed after creation, while immutable objects cannot. Lists and dictionaries are mutable; strings, tuples, integers, and frozensets are immutable.$a$,
 $ex$```python
items = [1, 2]
items.append(3)       # mutation
name = "Py"
name += "thon"       # creates/rebinds a string
```$ex$,
 $ip$A tuple is immutable as a container, but it can contain a mutable object whose state changes.$ip$,
 8),
('python-data-types-variables-09','python-data-types-variables', -- source Q14
 $q$What is type conversion?$q$,
 $a$Type conversion changes a value from one type to another using constructors or conversion functions such as int(), float(), str(), list(), and tuple().$a$,
 $ex$```python
age = int("25")
price = float("19.5")
print(age + 1)
```$ex$,
 $ip$Conversion can fail, such as `int("abc")`, which raises ValueError.$ip$,
 9),
('python-data-types-variables-10','python-data-types-variables', -- source Q15
 $q$What is the difference between == and is?$q$,
 $a$`==` compares values for equality, while `is` checks whether two references point to the same object. Use `==` for value comparison and `is` mainly for identity checks such as None.$a$,
 $ex$```python
a = [1, 2]
b = [1, 2]
print(a == b)  # True
print(a is b)  # False
```$ex$,
 $ip$Do not use `is` as a general replacement for `==`.$ip$,
 10)
on conflict (id) do update set
  topic_id = excluded.topic_id, question = excluded.question, answer = excluded.answer,
  example = excluded.example, important_point = excluded.important_point,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- Lists, Tuples, Sets & Dictionaries (15) ------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, sort_order)
values
('python-collections-01','python-collections', -- source Q16
 $q$What is a list?$q$,
 $a$A list is an ordered, mutable sequence that can contain objects of different types. It supports indexing, slicing, insertion, deletion, and iteration.$a$,
 $ex$```python
numbers = [10, 20, 30]
numbers.append(40)
print(numbers[1])
```$ex$,
 $ip$Lists allow duplicate values and are zero-indexed.$ip$,
 1),
('python-collections-02','python-collections', -- source Q17
 $q$What is a tuple?$q$,
 $a$A tuple is an ordered, immutable sequence. It is useful for fixed groups of values and can be used as a dictionary key when all contained values are hashable.$a$,
 $ex$```python
point = (10, 20)
x, y = point
print(x, y)
```$ex$,
 $ip$Tuple immutability does not recursively make contained mutable objects immutable.$ip$,
 2),
('python-collections-03','python-collections', -- source Q18
 $q$List vs tuple?$q$,
 $a$Lists are mutable and are suited to collections that change. Tuples are immutable and are useful for fixed records or values that should not be reassigned.$a$,
 $ex$```python
items = [1, 2]
items.append(3)
point = (10, 20)
```$ex$,
 $ip$Choose based on semantics, not on a blanket claim that tuples are always faster.$ip$,
 3),
('python-collections-04','python-collections', -- source Q19
 $q$What is a set?$q$,
 $a$A set is an unordered collection of unique hashable elements. It supports efficient average-case membership testing and mathematical set operations.$a$,
 $ex$```python
skills = {"Java", "Python", "SQL"}
skills.add("Git")
print("Python" in skills)
```$ex$,
 $ip$Set elements must be hashable.$ip$,
 4),
('python-collections-05','python-collections', -- source Q20
 $q$What is a frozenset?$q$,
 $a$A frozenset is an immutable set. Because it is immutable and hashable when its elements are hashable, it can itself be used as a dictionary key or set element.$a$,
 $ex$```python
permissions = frozenset({"read", "write"})
print("read" in permissions)
```$ex$,
 $ip$You cannot add or remove elements from a frozenset.$ip$,
 5),
('python-collections-06','python-collections', -- source Q21
 $q$What is a dictionary?$q$,
 $a$A dictionary stores key-value pairs and provides average-case constant-time lookup for hashable keys under normal conditions.$a$,
 $ex$```python
student = {101: "Rahul", 102: "Amit"}
print(student[101])
```$ex$,
 $ip$Keys must be hashable and unique; assigning an existing key replaces its value.$ip$,
 6),
('python-collections-07','python-collections', -- source Q22
 $q$Can dictionary keys be lists?$q$,
 $a$No. Lists are mutable and unhashable, so they cannot be dictionary keys. Immutable hashable alternatives such as tuples can be used when their elements are hashable.$a$,
 $ex$```python
locations = {(18.52, 73.85): "Pune"}
print(locations[(18.52, 73.85)])
```$ex$,
 $ip$A tuple containing an unhashable element is also unhashable.$ip$,
 7),
('python-collections-08','python-collections', -- source Q23
 $q$What is dictionary comprehension?$q$,
 $a$Dictionary comprehension creates a dictionary from an iterable using an expression and optional condition.$a$,
 $ex$```python
squares = {n: n*n for n in range(1, 4)}
print(squares)
```$ex$,
 $ip$Avoid complicated comprehensions when a normal loop is easier to read.$ip$,
 8),
('python-collections-09','python-collections', -- source Q24
 $q$What is list comprehension?$q$,
 $a$List comprehension is a concise way to build a list by transforming or filtering values from an iterable.$a$,
 $ex$```python
squares = [n*n for n in range(5) if n % 2 == 0]
print(squares)
```$ex$,
 $ip$A comprehension creates the output collection immediately; use a generator expression when lazy evaluation is preferred.$ip$,
 9),
('python-collections-10','python-collections', -- source Q25
 $q$What is slicing?$q$,
 $a$Slicing extracts part of a sequence using start, stop, and step positions. The stop index is excluded.$a$,
 $ex$```python
s = "Python"
print(s[1:4])
print(s[::-1])
```$ex$,
 $ip$Negative indexes count from the end, and a negative step can traverse backwards.$ip$,
 10),
('python-collections-11','python-collections', -- source Q26
 $q$What is unpacking?$q$,
 $a$Unpacking assigns elements of an iterable to multiple names in one operation.$a$,
 $ex$```python
name, age = ("Amit", 25)
print(name, age)
```$ex$,
 $ip$The number of targets must normally match the iterable length unless starred unpacking is used.$ip$,
 11),
('python-collections-12','python-collections', -- source Q27
 $q$What is starred unpacking?$q$,
 $a$A starred target collects remaining values into a list during assignment or expands an iterable when calling or constructing values.$a$,
 $ex$```python
first, *middle, last = [1, 2, 3, 4]
print(first, middle, last)
```$ex$,
 $ip$Only one starred target is allowed in a single assignment target list.$ip$,
 12),
('python-collections-13','python-collections', -- source Q28
 $q$append() vs extend()?$q$,
 $a$`append()` adds one object as a single element. `extend()` iterates over another iterable and adds its elements individually.$a$,
 $ex$```python
a = [1, 2]
a.append([3, 4])
print(a)  # [1, 2, [3, 4]]

b = [1, 2]
b.extend([3, 4])
print(b)  # [1, 2, 3, 4]
```$ex$,
 $ip$This difference is a frequent list interview question.$ip$,
 13),
('python-collections-14','python-collections', -- source Q29
 $q$remove() vs pop() vs del?$q$,
 $a$`remove(x)` deletes the first matching value, `pop(index)` removes and returns an item, and `del` removes an item, slice, or name binding.$a$,
 $ex$```python
a = [10, 20, 30]
a.remove(20)
x = a.pop()
del a[0]
print(x, a)
```$ex$,
 $ip$`remove()` raises ValueError when the value is absent; `pop()` can raise IndexError.$ip$,
 14),
('python-collections-15','python-collections', -- source Q30
 $q$sort() vs sorted()?$q$,
 $a$`list.sort()` sorts a list in place and returns None. `sorted()` accepts any iterable and returns a new list without modifying the original iterable.$a$,
 $ex$```python
a = [3, 1, 2]
b = sorted(a)
print(a, b)
a.sort()
print(a)
```$ex$,
 $ip$Do not write `a = a.sort()` expecting the sorted list; that assigns None.$ip$,
 15)
on conflict (id) do update set
  topic_id = excluded.topic_id, question = excluded.question, answer = excluded.answer,
  example = excluded.example, important_point = excluded.important_point,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- Functions (15) -------------------------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, sort_order)
values
('python-functions-01','python-functions', -- source Q31
 $q$What is a function?$q$,
 $a$A function is a reusable block of code defined with `def` that can accept arguments and return a result. Functions reduce duplication and separate responsibilities.$a$,
 $ex$```python
def add(a, b):
    return a + b

print(add(2, 3))
```$ex$,
 $ip$A function without an explicit return statement returns None.$ip$,
 1),
('python-functions-02','python-functions', -- source Q32
 $q$What are positional arguments?$q$,
 $a$Positional arguments are matched to parameters according to their order in the function call.$a$,
 $ex$```python
def greet(name, city):
    print(name, city)
greet("Amit", "Pune")
```$ex$,
 $ip$Passing too few or too many required positional arguments raises TypeError.$ip$,
 2),
('python-functions-03','python-functions', -- source Q33
 $q$What are keyword arguments?$q$,
 $a$Keyword arguments pass values using parameter names, making the call's intent clearer and allowing arguments to be supplied in a different order.$a$,
 $ex$```python
def connect(host, port):
    print(host, port)
connect(port=5432, host="localhost")
```$ex$,
 $ip$After a positional argument, keyword arguments are normally used; positional-only and keyword-only parameters can further constrain calls.$ip$,
 3),
('python-functions-04','python-functions', -- source Q34
 $q$What are default arguments?$q$,
 $a$A default argument provides a value used when the caller does not supply that parameter.$a$,
 $ex$```python
def greet(name="Guest"):
    return f"Hello {name}"
print(greet())
```$ex$,
 $ip$Avoid mutable objects such as [] or {} as defaults when you intend a fresh object per call.$ip$,
 4),
('python-functions-05','python-functions', -- source Q35
 $q$Why are mutable default arguments dangerous?$q$,
 $a$Default argument expressions are evaluated once when the function is defined, so a mutable default list or dictionary is shared across calls.$a$,
 $ex$```python
def add_item(item, items=[]):
    items.append(item)
    return items
print(add_item("A"))
print(add_item("B"))
```$ex$,
 $ip$Use `None` as the default and create a new list inside the function.$ip$,
 5),
('python-functions-06','python-functions', -- source Q36
 $q$What is *args?$q$,
 $a$`*args` collects extra positional arguments into a tuple, allowing a function to accept a variable number of positional values.$a$,
 $ex$```python
def total(*numbers):
    return sum(numbers)
print(total(10, 20, 30))
```$ex$,
 $ip$The name `args` is conventional; the asterisk is the syntax that matters.$ip$,
 6),
('python-functions-07','python-functions', -- source Q37
 $q$What is **kwargs?$q$,
 $a$`**kwargs` collects extra keyword arguments into a dictionary.$a$,
 $ex$```python
def show(**details):
    print(details)
show(name="Amit", city="Pune")
```$ex$,
 $ip$The name `kwargs` is conventional; the double asterisk performs keyword collection.$ip$,
 7),
('python-functions-08','python-functions', -- source Q38
 $q$What is lambda?$q$,
 $a$A lambda is a small anonymous function expression. It is useful when a short function is needed as an argument to another function.$a$,
 $ex$```python
square = lambda x: x * x
print(square(5))
```$ex$,
 $ip$Use `def` when the function needs multiple statements, documentation, or meaningful standalone reuse.$ip$,
 8),
('python-functions-09','python-functions', -- source Q39
 $q$What is a higher-order function?$q$,
 $a$A higher-order function accepts functions as arguments, returns a function, or both. Python supports this because functions are first-class objects.$a$,
 $ex$```python
def apply(fn, value):
    return fn(value)
print(apply(lambda x: x * 2, 5))
```$ex$,
 $ip$The concept is useful in decorators, callbacks, sorting, and functional-style code.$ip$,
 9),
('python-functions-10','python-functions', -- source Q40
 $q$What is a decorator?$q$,
 $a$A decorator is a callable that wraps another function or class to add or modify behavior without changing the original implementation directly.$a$,
 $ex$```python
def log_call(fn):
    def wrapper(*args, **kwargs):
        print("Calling", fn.__name__)
        return fn(*args, **kwargs)
    return wrapper

@log_call
def greet():
    return "Hello"

print(greet())
```$ex$,
 $ip$Use `functools.wraps` in production decorators to preserve useful metadata such as the wrapped function's name and docstring.$ip$,
 10),
('python-functions-11','python-functions', -- source Q41
 $q$What is recursion?$q$,
 $a$Recursion is a function calling itself on a smaller subproblem until a base condition is reached.$a$,
 $ex$```python
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)
```$ex$,
 $ip$Python does not optimize tail recursion, and deep recursion can raise RecursionError.$ip$,
 11),
('python-functions-12','python-functions', -- source Q42
 $q$What is LEGB?$q$,
 $a$LEGB describes Python's common name-resolution order: Local, Enclosing, Global, and Built-in scopes.$a$,
 $ex$```python
x = "global"
def outer():
    x = "enclosing"
    def inner():
        print(x)
    inner()
outer()
```$ex$,
 $ip$The `global` and `nonlocal` statements can explicitly change which enclosing binding is assigned.$ip$,
 12),
('python-functions-13','python-functions', -- source Q43
 $q$What is global keyword?$q$,
 $a$`global` tells a function that assignments to a specified name should target the module-level global binding instead of creating a local binding.$a$,
 $ex$```python
count = 0
def increment():
    global count
    count += 1
increment()
print(count)
```$ex$,
 $ip$Global mutable state can make testing and concurrency harder, so use it deliberately.$ip$,
 13),
('python-functions-14','python-functions', -- source Q44
 $q$What is nonlocal?$q$,
 $a$`nonlocal` tells a nested function to assign to a variable in an enclosing function scope rather than creating a new local variable.$a$,
 $ex$```python
def counter():
    n = 0
    def inc():
        nonlocal n
        n += 1
        return n
    return inc

c = counter()
print(c(), c())
```$ex$,
 $ip$`nonlocal` cannot refer to a module-global variable; it needs an enclosing function scope.$ip$,
 14),
('python-functions-15','python-functions', -- source Q45
 $q$What is a docstring?$q$,
 $a$A docstring is a string literal used to document a module, class, or function. It can be accessed through `__doc__` and tooling can use it for documentation.$a$,
 $ex$```python
def add(a, b):
    """Return the sum of two numbers."""
    return a + b
print(add.__doc__)
```$ex$,
 $ip$A comment is not the same as a docstring; documentation tools commonly inspect docstrings.$ip$,
 15)
on conflict (id) do update set
  topic_id = excluded.topic_id, question = excluded.question, answer = excluded.answer,
  example = excluded.example, important_point = excluded.important_point,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- Strings (8) ---------------------------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, sort_order)
values
('python-strings-01','python-strings', -- source Q46
 $q$What is a string?$q$,
 $a$A Python string is an immutable sequence of Unicode characters. It supports indexing, slicing, searching, formatting, and many useful methods.$a$,
 $ex$```python
name = "Python"
print(name[0], name[-1])
```$ex$,
 $ip$String operations that appear to modify a string create or return another string.$ip$,
 1),
('python-strings-02','python-strings', -- source Q47
 $q$Why are strings immutable?$q$,
 $a$String immutability means an existing string object's characters cannot be changed. This gives predictable value semantics and allows strings to be safely shared and hashed.$a$,
 $ex$```python
s = "cat"
s = s + "s"
print(s)
```$ex$,
 $ip$Concatenating many strings repeatedly in a loop can create unnecessary intermediate objects; use a list and `join()` for many pieces.$ip$,
 2),
('python-strings-03','python-strings', -- source Q48
 $q$What is f-string?$q$,
 $a$An f-string is a formatted string literal that evaluates expressions inside `{}` and produces readable formatted output.$a$,
 $ex$```python
name = "Amit"
age = 25
print(f"{name} is {age} years old")
```$ex$,
 $ip$Expressions inside f-strings should be kept simple; complex logic belongs outside the formatting expression.$ip$,
 3),
('python-strings-04','python-strings', -- source Q49
 $q$format() vs f-string?$q$,
 $a$Both support formatted strings, but f-strings are usually more concise when formatting values already available in the current scope.$a$,
 $ex$```python
name = "Amit"
print(f"Hello {name}")
print("Hello {}".format(name))
```$ex$,
 $ip$Choose the style supported by the project's Python version and coding conventions.$ip$,
 4),
('python-strings-05','python-strings', -- source Q50
 $q$What is split()?$q$,
 $a$`split()` divides a string into a list of substrings using a separator or whitespace rules when no separator is provided.$a$,
 $ex$```python
text = "Java Python SQL"
print(text.split())
```$ex$,
 $ip$Repeated whitespace is handled conveniently when the separator is omitted.$ip$,
 5),
('python-strings-06','python-strings', -- source Q51
 $q$What is join()?$q$,
 $a$`join()` combines an iterable of strings into one string using the calling string as the separator.$a$,
 $ex$```python
words = ["Python", "is", "easy"]
print(" ".join(words))
```$ex$,
 $ip$Every element supplied to join must be a string.$ip$,
 6),
('python-strings-07','python-strings', -- source Q52
 $q$replace() vs strip()?$q$,
 $a$`replace()` substitutes occurrences of one substring with another. `strip()` removes specified characters from the beginning and end of a string, not from the middle.$a$,
 $ex$```python
s = "  Python  "
print(s.strip())
print(s.replace("Python", "Java"))
```$ex$,
 $ip$`strip("ab")` removes any leading/trailing a or b characters, not the exact substring "ab".$ip$,
 7),
('python-strings-08','python-strings', -- source Q53
 $q$What is Unicode in Python strings?$q$,
 $a$Python 3 strings represent Unicode text, allowing code to work with characters from many writing systems. Encoding becomes important when converting text to bytes for files or networks.$a$,
 $ex$```python
text = "नमस्ते"
data = text.encode("utf-8")
print(data.decode("utf-8"))
```$ex$,
 $ip$A Unicode string and encoded bytes are different types.$ip$,
 8)
on conflict (id) do update set
  topic_id = excluded.topic_id, question = excluded.question, answer = excluded.answer,
  example = excluded.example, important_point = excluded.important_point,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- Exception Handling (8) ----------------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, sort_order)
values
('python-exception-handling-01','python-exception-handling', -- source Q54
 $q$What is exception handling?$q$,
 $a$Exception handling lets a program detect and respond to runtime errors using `try`, `except`, `else`, and `finally`. It keeps error paths separate from normal processing.$a$,
 $ex$```python
try:
    value = int("abc")
except ValueError:
    value = 0
print(value)
```$ex$,
 $ip$Catch specific exceptions instead of using a broad `except` that hides unrelated bugs.$ip$,
 1),
('python-exception-handling-02','python-exception-handling', -- source Q55
 $q$What is try-except?$q$,
 $a$A `try` block contains code that may raise an exception, while a matching `except` block handles the exception.$a$,
 $ex$```python
try:
    x = 10 / 0
except ZeroDivisionError:
    print("Cannot divide by zero")
```$ex$,
 $ip$Only exceptions raised during the protected try block are handled by its except clauses.$ip$,
 2),
('python-exception-handling-03','python-exception-handling', -- source Q56
 $q$What is finally?$q$,
 $a$`finally` contains cleanup code that normally runs whether the operation succeeds or an exception is handled.$a$,
 $ex$```python
try:
    print("work")
finally:
    print("cleanup")
```$ex$,
 $ip$For files and similar resources, context managers are often cleaner than manual finally cleanup.$ip$,
 3),
('python-exception-handling-04','python-exception-handling', -- source Q57
 $q$What is else in exception handling?$q$,
 $a$The `else` block runs when the try block completes without raising an exception.$a$,
 $ex$```python
try:
    value = int("25")
except ValueError:
    print("Invalid")
else:
    print(value * 2)
```$ex$,
 $ip$Putting success-only code in else avoids accidentally treating exceptions from that code as if they came from the protected operation.$ip$,
 4),
('python-exception-handling-05','python-exception-handling', -- source Q58
 $q$How do you raise an exception?$q$,
 $a$Use `raise` to deliberately signal an error condition with an exception object or type.$a$,
 $ex$```python
def withdraw(balance, amount):
    if amount > balance:
        raise ValueError("Insufficient balance")
    return balance - amount
```$ex$,
 $ip$Raise an exception type that accurately describes the invalid condition.$ip$,
 5),
('python-exception-handling-06','python-exception-handling', -- source Q59
 $q$How do you create a custom exception?$q$,
 $a$Create a class derived from an appropriate built-in exception, usually Exception or a more specific subclass.$a$,
 $ex$```python
class InvalidAgeError(ValueError):
    pass

raise InvalidAgeError("Age must be positive")
```$ex$,
 $ip$Custom exceptions make domain-specific failure cases easier for callers to catch and understand.$ip$,
 6),
('python-exception-handling-07','python-exception-handling', -- source Q60
 $q$What is exception chaining?$q$,
 $a$Exception chaining records that one exception was caused while handling another, commonly using `raise NewError(...) from original`.$a$,
 $ex$```python
try:
    int("abc")
except ValueError as exc:
    raise RuntimeError("Input parsing failed") from exc
```$ex$,
 $ip$Chaining preserves the original cause and makes debugging easier.$ip$,
 7),
('python-exception-handling-08','python-exception-handling', -- source Q61
 $q$Why avoid bare except?$q$,
 $a$A bare `except:` catches almost everything, including exceptions such as KeyboardInterrupt and SystemExit that applications often should not swallow.$a$,
 $ex$```python
try:
    work()
except ValueError as exc:
    print(exc)
```$ex$,
 $ip$Catch the narrowest exception you can meaningfully handle.$ip$,
 8)
on conflict (id) do update set
  topic_id = excluded.topic_id, question = excluded.question, answer = excluded.answer,
  example = excluded.example, important_point = excluded.important_point,
  sort_order = excluded.sort_order, updated_at = now();

-- ===========================================================================
-- 4. VALIDATION
-- ===========================================================================
do $$
declare
  v_count integer;
begin
  select count(*) into v_count from public.interview_topics where id = any(array['python-basics', 'python-data-types-variables', 'python-collections', 'python-functions', 'python-strings', 'python-exception-handling']);
  if v_count <> 6 then
    raise exception 'validation: expected 6 topics for this batch, found %', v_count;
  end if;
  select count(*) into v_count from public.interview_questions where topic_id = any(array['python-basics', 'python-data-types-variables', 'python-collections', 'python-functions', 'python-strings', 'python-exception-handling']);
  if v_count <> 61 then
    raise exception 'validation: expected 61 questions for this batch, found %', v_count;
  end if;
  raise notice '0109_seed_interview_python_batch1 OK: % topics, % questions.', 6, 61;
end $$;

notify pgrst, 'reload schema';
