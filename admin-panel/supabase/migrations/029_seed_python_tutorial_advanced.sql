-- admin-panel/supabase/migrations/029_seed_python_tutorial_advanced.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: mobile-app/supabase/migrations/0052_seed_python_tutorial_advanced.sql ; apply either, the other is a guarded no-op.
--
-- ============================================================================
-- BODY — extend the "Python Tutorial" Learning grid with a 3rd section: 5 more
-- topics (Intermediate Python / Regular Expressions / Python Environment &
-- Package Management / Database Programming / APIs & HTTP), each with full
-- notes and a 10-question mock test (10-minute timer); 4 topics also get 4
-- Python coding problems each (Environment & Package Management gets none —
-- see below)
-- (mobile 0052_seed_python_tutorial_advanced.sql ==
--  admin 029_seed_python_tutorial_advanced.sql below this header —
--  byte-identical, guarded, idempotent, additive.)
-- ============================================================================
-- Third content drop for the python-tutorial grid seeded by 0050/027 (Python
-- Basics) and 0051/028 (Functions, Files & OOP). Adds a 3rd learning_sections
-- row "Advanced Python & Real-World Tools" and 5 more topics, following the
-- exact same pattern — no schema, RLS, or app-code change.
--
-- Content notes:
--  * Python Environment & Package Management has 10 MCQs but ZERO coding
--    problems — the source chapter itself has no "Coding Problems" section,
--    since the whole topic (pip, venv, requirements.txt) is about CLI/tooling
--    workflow, not code that produces stdin/stdout behavior. Matches the master
--    prompt's own "don't force unnecessary coding problems" instruction.
--  * Database Programming's 4 coding problems use Python's built-in sqlite3
--    module (an in-memory :memory: database created fresh by the script itself)
--    — fully self-contained and deterministic, no external DB server needed.
--  * APIs & HTTP's 4 coding problems were redesigned away from the source's
--    live network calls (GitHub API, jsonplaceholder.typicode.com) — a
--    sandboxed single-script judge has no reliable internet access, and even if
--    it did, live API data/availability isn't stable enough for exact-match
--    grading. Each problem instead operates on a given JSON string simulating
--    what response.json() would return, or on plain status-code/REST-path
--    logic — preserving the pedagogical concepts (JSON parsing, status code
--    semantics, REST conventions) without requiring an actual HTTP request.
--  * All 50 MCQ explanations were written fresh — this batch's source gave
--    bare answer letters only, for every one of its 5 chapters, same as batch 2.
-- ----------------------------------------------------------------------------

-- ---- ordering guard -----------------------------------------------------
do $guard$
begin
  if to_regclass('public.learning_grids') is null then
    raise exception '0052/029: learning_* not found — apply 0042_learning_management.sql (admin 019) first.';
  end if;
  if to_regprocedure('public.learning_topic_practice(text, text, text)') is null then
    raise exception '0052/029: apply 0048_topic_practice.sql (admin 025) first.';
  end if;
  if not exists (select 1 from public.learning_grids where lower(slug) = 'python-tutorial') then
    raise exception '0052/029: python-tutorial grid not found — apply 0050_seed_python_tutorial_content.sql (admin 027) first.';
  end if;
end
$guard$;

-- ===========================================================================
-- 2. SECTION — 3rd module for the existing python-tutorial grid.
-- ===========================================================================
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial')
insert into public.learning_sections
  (grid_id, name, slug, description, sort_order, status, show_on_website, show_on_mobile)
select g.id, $xx1$Advanced Python & Real-World Tools$xx1$, $xx2$advanced-python-tools$xx2$, $xx3$Intermediate Python, Regular Expressions, Environment & Package Management, Database Programming, and APIs & HTTP — the practical, professional-grade tools that come after the core language.$xx3$, 30,
  'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, description = excluded.description,
  sort_order = excluded.sort_order, updated_at = now();

-- ===========================================================================
-- 3. TOPICS + CONTENT — 5 topics, one full notes block each.
-- ===========================================================================

-- Intermediate Python
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = 'advanced-python-tools'),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $xx4$Intermediate Python$xx4$, $xx5$intermediate-python$xx5$, $xx6$Iterables and iterators, generators and yield, decorators, closures, custom context managers, the @property decorator, and the enumerate/zip/any/all/sorted built-ins.$xx6$, 11,
    'published', true, true, 'python_tutorial', $xx7$advanced-python-tools/intermediate-python$xx7$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $xx8$You now know the core building blocks of Python. This file covers a set of slightly more advanced — but extremely commonly used — tools that make your code more efficient, more "Pythonic," and closer to how real professional codebases are written.

---

## 1. Iterables and Iterators

### What is it?

- An **iterable** is anything you can loop over — lists, strings, tuples, dictionaries, sets.
- An **iterator** is the object that actually does the "remembering where we are" while looping — produced from an iterable using `iter()`, and stepped through using `next()`.

> **Definition:** An iterable is an object capable of returning its elements one at a time; an iterator is the object that actually performs that one-at-a-time retrieval.

### Simple Example

```python
numbers = [10, 20, 30]   # numbers is an iterable

iterator = iter(numbers)  # create an iterator from it

print(next(iterator))   # 10
print(next(iterator))   # 20
print(next(iterator))   # 30
print(next(iterator))   # StopIteration error - nothing left!
```

### Explanation of the Code

- `iter(numbers)` converts the list into an iterator object that keeps track of "where we currently are."
- Each call to `next()` returns the next value and moves the internal position forward.
- Once everything has been returned, calling `next()` again raises `StopIteration` — this is exactly what a `for` loop does automatically behind the scenes, catching that error to know when to stop.

### Real-World Example

Every `for` loop you've ever written (`for item in my_list:`) works by silently calling `iter()` and `next()` behind the scenes — understanding this makes generators (next section) much easier to grasp.

### Common Mistakes

- Trying to call `next()` on something that isn't an iterator yet (like a plain list) — you must call `iter()` on it first.
- Assuming all iterables are also iterators — a list is iterable, but it's not itself an iterator until you call `iter()` on it.

### Important Points

- All iterators are iterables, but not all iterables are iterators.
- `for` loops handle the `iter()`/`next()`/`StopIteration` process automatically — you rarely need to do it manually.

---

## 2. Generators and `yield`

### What is it?

A generator is a special kind of function that produces a sequence of values **one at a time**, pausing its state between each value, instead of computing and storing everything in memory at once.

> **Definition:** A generator is a function that uses `yield` to produce a sequence of values lazily, one at a time, without storing them all in memory simultaneously.

### Simple Example

```python
def count_up_to(n):
    count = 1
    while count <= n:
        yield count
        count += 1

counter = count_up_to(5)

for number in counter:
    print(number)
```

Output:
```
1
2
3
4
5
```

### Explanation of the Code

- `yield` is like `return`, but instead of ending the function completely, it **pauses** it — remembering exactly where it left off.
- Each time the generator is asked for the next value (by a `for` loop, or `next()`), it resumes right after the last `yield` and continues until the next `yield` or the function ends.
- This is fundamentally different from building a full list of `[1, 2, 3, 4, 5]` in memory upfront — values are produced **on demand**.

### Why Generators Matter — Memory Efficiency

```python
def generate_million_numbers():
    for i in range(1_000_000):
        yield i

# This uses very little memory, even for a million numbers,
# because values are produced one at a time, not stored all at once.
gen = generate_million_numbers()
print(next(gen))   # 0
print(next(gen))   # 1
```

Compare this to `list(range(1_000_000))`, which builds and stores all one million numbers in memory immediately.

### Generator Expressions

A compact, one-line way to create a generator — looks like a list comprehension, but uses `()` instead of `[]`.

```python
squares_list = [x ** 2 for x in range(5)]      # list comprehension - built immediately
squares_gen = (x ** 2 for x in range(5))        # generator expression - lazy

print(squares_list)   # [0, 1, 4, 9, 16]
print(squares_gen)    # <generator object ...>  -  values not computed yet!

print(list(squares_gen))   # [0, 1, 4, 9, 16] - now they're computed
```

### Real-World Example

Generators are ideal for reading huge files line by line, or processing large datasets, without loading everything into memory at once — a common technique in data engineering and backend systems.

### Common Mistakes

- Trying to loop through a generator twice — once its values have been consumed, they're gone; you'd need to create a fresh generator to go through the sequence again.
- Confusing generator expressions `(...)` with tuples — `(x for x in range(5))` is a generator, not a tuple.

### Important Points

- `yield` pauses a function's execution and remembers its state, unlike `return` which ends it completely.
- Generators are memory-efficient — ideal for large or even infinite sequences.
- A generator can only be iterated through once.

### Practice

1. Write a generator function that yields the squares of numbers from 1 to `n`.
2. Write a generator expression that produces all even numbers from 1 to 20, and print them using a `for` loop.

---

## 3. Decorators

### What is it?

A decorator is a function that wraps another function, adding extra behavior before and/or after it runs — without modifying the original function's actual code.

> **Definition:** A decorator is a function that takes another function as input and extends or modifies its behavior, returning a new function.

### Simple Example

```python
def my_decorator(func):
    def wrapper():
        print("Something happens before the function runs")
        func()
        print("Something happens after the function runs")
    return wrapper

@my_decorator
def say_hello():
    print("Hello!")

say_hello()
```

Output:
```
Something happens before the function runs
Hello!
Something happens after the function runs
```

### Explanation of the Code

- `@my_decorator` placed above `say_hello` is exactly equivalent to writing `say_hello = my_decorator(say_hello)`.
- `my_decorator` wraps `say_hello` inside `wrapper()`, adding extra print statements before and after calling the original function — without ever touching `say_hello`'s own code.

### A More Practical Example — Timing a Function

```python
import time

def timer(func):
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} took {end - start:.4f} seconds")
        return result
    return wrapper

@timer
def slow_function():
    time.sleep(1)
    print("Function finished")

slow_function()
```

Output:
```
Function finished
slow_function took 1.0002 seconds
```

**Explanation:** `*args, **kwargs` in `wrapper()` lets the decorator work with **any** function, regardless of how many arguments it takes.

### Real-World Example

Decorators are used constantly in real Python frameworks: Flask uses `@app.route("/home")` to turn a regular function into a web page handler; logging decorators automatically record every time a function is called.

### Common Mistakes

- Forgetting to `return wrapper` inside the decorator, which causes the decorated function to return `None` instead of actually running.
- Forgetting `*args, **kwargs` in `wrapper()`, which breaks the decorator for any function that takes arguments.

### Important Points

- `@decorator_name` above a function is shorthand for `function = decorator_name(function)`.
- Decorators are widely used for logging, timing, authentication checks, and caching.

### Practice

1. Write a decorator `uppercase_result` that converts a function's returned string to uppercase automatically.

---

## 4. Closures

### What is it?

A closure is a function that "remembers" values from its enclosing scope, even after that outer function has finished running.

### Simple Example

```python
def make_multiplier(factor):
    def multiply(number):
        return number * factor   # "factor" is remembered from the outer function
    return multiply

double = make_multiplier(2)
triple = make_multiplier(3)

print(double(5))   # 10
print(triple(5))   # 15
```

### Explanation of the Code

- `make_multiplier(2)` runs and finishes, returning the inner `multiply` function — but `multiply` still "remembers" that `factor` was `2`, even though `make_multiplier` has already finished executing.
- This remembered value is what makes `double` and `triple` behave differently, despite both being created from the same `multiply` function definition.

### Real-World Example

Closures are the underlying mechanism that makes decorators work — the `wrapper()` function in a decorator "closes over" the original function it's wrapping.

### Common Mistakes

- Assuming the outer function's variables are lost once it returns — with closures, they're actually preserved for the inner function's use.

### Important Points

- A closure "closes over" variables from its enclosing scope, keeping them alive as long as the inner function might still need them.
- Closures are a key concept behind decorators and many functional-programming patterns in Python.

### Practice

1. Write a closure-based function `make_greeting(greeting)` that returns a function which greets any name passed to it with that greeting.

---

## 5. Context Managers (`with`)

### What is it?

You've already used context managers with `with open(...) as file:` in the File Handling section. A context manager is any object that defines proper "setup" and "cleanup" behavior automatically, used with the `with` statement.

### Creating Your Own Context Manager

```python
class ManagedFile:
    def __init__(self, filename, mode):
        self.filename = filename
        self.mode = mode

    def __enter__(self):
        self.file = open(self.filename, self.mode)
        return self.file

    def __exit__(self, exc_type, exc_value, traceback):
        self.file.close()

with ManagedFile("notes.txt", "w") as file:
    file.write("Hello from a custom context manager!")
```

### Explanation of the Code

- `__enter__` runs when entering the `with` block — it sets things up (here, opening the file) and returns the object to use inside the block.
- `__exit__` runs automatically when the block ends, whether it finished normally or an error occurred — it handles cleanup (here, closing the file).

### Real-World Example

Context managers are used for anything requiring guaranteed setup/cleanup: file handling, database connections, network sockets, and thread locks.

### Important Points

- Any class implementing both `__enter__` and `__exit__` can be used with `with`.
- Python's built-in `open()` already works this way — that's why `with open(...) as f:` works.

---

## 6. The `property` Decorator

### What is it?

`property` lets you define a method that behaves like a regular attribute — accessed without parentheses — while still letting you run custom logic (like validation) behind the scenes.

### Simple Example

```python
class Circle:
    def __init__(self, radius):
        self._radius = radius

    @property
    def area(self):
        return 3.14159 * self._radius ** 2

    @property
    def radius(self):
        return self._radius

    @radius.setter
    def radius(self, value):
        if value < 0:
            raise ValueError("Radius cannot be negative")
        self._radius = value

circle = Circle(5)
print(circle.area)     # 78.53975 - called like an attribute, not area()

circle.radius = 10     # uses the setter, runs validation
print(circle.area)     # 314.159
```

### Explanation of the Code

- `@property` above `area` means `circle.area` runs the method automatically — no parentheses needed, even though it's really a method underneath.
- `@radius.setter` lets you control what happens when someone tries to **assign** a new value to `circle.radius` — here, rejecting negative values.

### Real-World Example

Properties are commonly used to expose "calculated" attributes (like `area`, computed from `radius`) or to add validation when a value is set, without breaking the simple `object.attribute` syntax users expect.

### Important Points

- `@property` makes a method accessible like an attribute (read-only, unless paired with a setter).
- `@attributename.setter` allows controlled, validated assignment to that "property."

### Practice

1. Create a `Temperature` class with a `celsius` property and a `fahrenheit` property (calculated automatically from `celsius`).

---

## 7. Useful Built-in Functions

### `enumerate()` — Get Index and Value Together

```python
fruits = ["apple", "banana", "cherry"]

for index, fruit in enumerate(fruits):
    print(index, fruit)
```

Output:
```
0 apple
1 banana
2 cherry
```

**Real-World Use:** Whenever you need both the position and the value while looping — much cleaner than manually tracking a separate counter variable.

### `zip()` — Combine Multiple Sequences Together

```python
names = ["Aditi", "Rohan", "Zara"]
marks = [85, 90, 78]

for name, mark in zip(names, marks):
    print(f"{name}: {mark}")
```

Output:
```
Aditi: 85
Rohan: 90
Zara: 78
```

**Real-World Use:** Combining related lists — like names and marks, or product names and prices — that need to be processed together.

### `any()` and `all()`

```python
numbers = [2, 4, 6, 7, 8]

print(any(n % 2 != 0 for n in numbers))   # True  - at least one odd number
print(all(n % 2 == 0 for n in numbers))   # False - not every number is even
```

**Explanation:** `any()` returns `True` if **at least one** item satisfies the condition. `all()` returns `True` only if **every** item satisfies it.

### `sorted()`, `min()`, `max()`

```python
students = [("Aditi", 85), ("Rohan", 92), ("Zara", 78)]

print(sorted(students, key=lambda s: s[1]))              # sort by marks, ascending
print(sorted(students, key=lambda s: s[1], reverse=True)) # descending
print(max(students, key=lambda s: s[1]))                  # highest scorer
print(min(students, key=lambda s: s[1]))                  # lowest scorer
```

Output:
```
[('Zara', 78), ('Aditi', 85), ('Rohan', 92)]
[('Rohan', 92), ('Aditi', 85), ('Zara', 78)]
('Rohan', 92)
('Zara', 78)
```

**Explanation:** The `key` parameter tells Python **what** to sort/compare by — here, the second item in each tuple (the marks), rather than comparing the tuples directly.

### Comparison Table — Key Built-ins

| Function | Purpose |
|---|---|
| `enumerate()` | Get index + value while looping |
| `zip()` | Combine multiple sequences element-wise |
| `any()` | True if at least one item satisfies a condition |
| `all()` | True only if every item satisfies a condition |
| `sorted()` | Returns a new sorted list (original unchanged) |
| `min()` / `max()` | Find the smallest/largest item, optionally using a `key` |

### Common Mistakes

- Forgetting `sorted()` returns a **new** list — it doesn't sort the original list in place (use `.sort()` for that, on lists specifically).
- Forgetting the `key` parameter when sorting complex data like tuples or objects by a specific field.

### Practice

1. Use `enumerate()` to print each item in a list along with its position, starting the count from 1 instead of 0 (hint: `enumerate(list, start=1)`).
2. Use `zip()` to combine a list of product names and a list of prices into a dictionary.
3. Use `sorted()` with a `key` to sort a list of dictionaries (each with a `"score"` key) by score, highest first.

---

## Common Beginner Mistakes — Summary for This Section

- Confusing iterables with iterators.
- Trying to loop through an already-exhausted generator a second time.
- Forgetting `return wrapper` inside a decorator.
- Forgetting `*args, **kwargs` in a decorator's inner function.
- Forgetting `sorted()` returns a new list rather than sorting in place.

---

## Cheat Sheet — Intermediate Python

```python
# Generators
def gen():
    yield 1
    yield 2

# Decorators
def decorator(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@decorator
def my_func():
    pass

# property
class C:
    @property
    def value(self):
        return self._value

    @value.setter
    def value(self, v):
        self._value = v

# Useful built-ins
enumerate(list, start=0)
zip(list1, list2)
any(condition for x in list)
all(condition for x in list)
sorted(list, key=lambda x: x[1], reverse=True)
max(list, key=lambda x: x[1])
min(list, key=lambda x: x[1])
```

---

## Interview Questions

**Q1. What is the difference between an iterable and an iterator?**
Answer: An iterable is anything you can loop over (like a list). An iterator is the object produced by calling `iter()` on an iterable, which actually tracks position and produces values one at a time via `next()`.

**Q2. What is the difference between `return` and `yield`?**
Answer: `return` ends a function completely and sends back one value. `yield` pauses the function, remembers its state, and can produce multiple values over time as it's iterated.

**Q3. Why are generators more memory-efficient than lists?**
Answer: Generators produce values one at a time, on demand, instead of computing and storing the entire sequence in memory upfront.

**Q4. What is a decorator, and what does the `@decorator_name` syntax actually mean?**
Answer: A decorator is a function that wraps another function to add extra behavior. `@decorator_name` above a function is shorthand for `function = decorator_name(function)`.

**Q5. What is a closure?**
Answer: A function that remembers and has access to variables from its enclosing scope, even after the outer function has finished executing.

**Q6. What does the `@property` decorator do?**
Answer: It lets a method be accessed like a regular attribute (without parentheses), while still allowing custom logic — often used for computed values or validated attribute assignment (via a paired setter).

**Q7. What is the difference between `any()` and `all()`?**
Answer: `any()` returns `True` if at least one element satisfies the condition. `all()` returns `True` only if every element satisfies it.

---

## Practice Questions

**Beginner**
1. Write a generator function that yields numbers from 1 to 10.
2. Use `enumerate()` to print each character of a string along with its index.
3. Use `zip()` to combine two lists of equal length into a list of tuples.
4. Use `any()` to check if a list contains at least one negative number.
5. Use `sorted()` to sort a list of numbers in descending order.

**Intermediate**
1. Write a decorator that prints "Function is starting..." before a function runs and "Function has finished." after it runs.
2. Write a generator expression that yields the square of every odd number from 1 to 20.
3. Create a class with a `property` for `fahrenheit`, calculated automatically from a stored `celsius` value.
4. Write a closure-based function `make_counter()` that returns a function which increases and returns a count every time it's called.
5. Use `sorted()` with a `key` and `lambda` to sort a list of student dictionaries by their `"marks"` value.

**Challenge**
1. Write a custom context manager (using a class with `__enter__`/`__exit__`) that measures and prints how long the code inside the `with` block took to run.
2. Write a decorator `@retry` that automatically retries a function up to 3 times if it raises an exception, before finally letting the exception propagate.
3. Write a generator function that produces an infinite sequence of Fibonacci numbers, and use it with a loop that stops after printing the first 15 values.
$xx8$, 'markdown',
  jsonb_build_object('source', 'python_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'python_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Regular Expressions
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = 'advanced-python-tools'),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $xx9$Regular Expressions$xx9$, $xx10$regular-expressions$xx10$, $xx11$Pattern matching with Python's re module — character classes, quantifiers, anchors, capturing groups, search/match/findall/split/sub, and practical validation (emails, phone numbers, passwords).$xx11$, 12,
    'published', true, true, 'python_tutorial', $xx12$advanced-python-tools/regular-expressions$xx12$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $xx13$Sometimes checking text with plain string methods (`.find()`, `.replace()`) isn't enough — what if you need to check "is this a valid email?" or "does this text contain any 10-digit phone number?" Regular expressions (regex) are a mini-language for describing text *patterns*, and Python's built-in `re` module lets you use them.

---

## 1. What are Regular Expressions?

### What is it?

A regular expression is a sequence of characters that defines a search pattern — used to match, find, or validate specific patterns within text.

> **Definition:** A regular expression (regex) is a pattern used to match, search, or manipulate text based on specific rules.

### Why do we use it?

- Validating input formats: emails, phone numbers, passwords, postal codes.
- Extracting specific pieces of information from larger text (like pulling all phone numbers out of a document).
- Searching and replacing text based on flexible patterns, not just exact matches.

### How does it work?

Python's `re` module reads a pattern (written using regex syntax) and applies it to a string, looking for matches.

```python
import re
```

Every example in this file assumes `re` has been imported.

---

## 2. Basic Regex Syntax

### Character Classes

| Pattern | Matches |
|---|---|
| `\d` | Any digit (0-9) |
| `\D` | Any non-digit |
| `\w` | Any word character (letters, digits, underscore) |
| `\W` | Any non-word character |
| `\s` | Any whitespace (space, tab, newline) |
| `\S` | Any non-whitespace |
| `.` | Any character except a newline |

### Simple Example

```python
import re

text = "My phone number is 9876543210"

match = re.search(r"\d+", text)
print(match.group())   # 9876543210
```

**Explanation:** `\d+` means "one or more digits in a row." `re.search()` scans the text and finds the first match.

### Quantifiers — Controlling How Many Times

| Quantifier | Meaning |
|---|---|
| `*` | 0 or more |
| `+` | 1 or more |
| `?` | 0 or 1 (optional) |
| `{n}` | Exactly n times |
| `{n,m}` | Between n and m times |

```python
print(re.search(r"\d{10}", "Call 9876543210 now").group())   # 9876543210 (exactly 10 digits)
print(re.search(r"colou?r", "color").group())                 # color (u is optional)
print(re.search(r"colou?r", "colour").group())                # colour
```

### Anchors — Matching Position

| Anchor | Meaning |
|---|---|
| `^` | Start of the string |
| `$` | End of the string |

```python
print(bool(re.match(r"^Hello", "Hello World")))   # True - starts with "Hello"
print(bool(re.search(r"World$", "Hello World")))   # True - ends with "World"
```

### Common Mistakes

- Forgetting that `.` matches almost any character — if you want a **literal** dot (like in an email or file extension), you must escape it: `\.`
- Forgetting quantifiers apply only to the character/group immediately before them.

### Important Points

- Always use raw strings (`r"..."`) for regex patterns, to avoid Python misinterpreting backslashes.
- `\d`, `\w`, `\s` (and their uppercase opposites) are the most frequently used building blocks.

---

## 3. Groups and Capturing Groups

### What is it?

Parentheses `()` in a regex pattern create a **group** — a way to isolate and extract just a specific part of a match, rather than the whole thing.

### Simple Example

```python
text = "Contact: aditi@example.com"

match = re.search(r"(\w+)@(\w+)\.(\w+)", text)

print(match.group())    # aditi@example.com (the full match)
print(match.group(1))   # aditi              (first group)
print(match.group(2))   # example            (second group)
print(match.group(3))   # com                (third group)
```

### Explanation of the Code

- Each pair of parentheses is a separate "capturing group," numbered left to right starting from 1.
- `match.group()` (with no number, or `0`) gives the entire matched text; `match.group(1)`, `match.group(2)`, etc. give just the parts inside each specific group.

### Real-World Example

Extracting the username and domain separately from an email address, or extracting the area code, exchange, and line number separately from a phone number.

### Important Points

- Groups let you extract specific parts of a larger match, not just confirm that a pattern exists.
- Group numbering starts at 1; `group(0)` (or just `.group()`) always refers to the whole match.

---

## 4. Core `re` Functions

### `re.search()` — Find the First Match Anywhere in the String

```python
result = re.search(r"\d+", "Order number: 4521")
print(result.group())   # 4521
```

### `re.match()` — Match Only at the Very Start of the String

```python
print(re.match(r"\d+", "4521 is the order number"))   # matches (starts with digits)
print(re.match(r"\d+", "Order number: 4521"))          # None (doesn't start with digits)
```

### `re.findall()` — Find ALL Matches, Returned as a List

```python
text = "Call 9876543210 or 8765432109"
numbers = re.findall(r"\d{10}", text)
print(numbers)   # ['9876543210', '8765432109']
```

### `re.split()` — Split Text Using a Pattern

```python
text = "apple, banana;   cherry,mango"
items = re.split(r"[,;]\s*", text)
print(items)   # ['apple', 'banana', 'cherry', 'mango']
```

**Explanation:** This splits on a comma or semicolon, optionally followed by whitespace — handling messy, inconsistent formatting in one pattern.

### `re.sub()` — Search and Replace

```python
text = "My number is 9876543210"
masked = re.sub(r"\d{10}", "XXXXXXXXXX", text)
print(masked)   # My number is XXXXXXXXXX
```

### Comparison Table — Core `re` Functions

| Function | Purpose | Returns |
|---|---|---|
| `re.search()` | Find the first match anywhere | Match object (or `None`) |
| `re.match()` | Match only at the start of the string | Match object (or `None`) |
| `re.findall()` | Find every match | List of strings |
| `re.split()` | Split text using a pattern | List of strings |
| `re.sub()` | Replace matches with new text | New string |

### Common Mistakes

- Confusing `re.match()` (start of string only) with `re.search()` (anywhere in the string) — a very common source of "why doesn't my pattern match?" confusion.
- Forgetting that `search()`/`match()` return `None` when there's no match — calling `.group()` on `None` causes an `AttributeError`. Always check the result first with `if match:`.

### Practice

1. Use `re.findall()` to extract all numbers from the text `"I have 3 cats, 2 dogs, and 1 fish"`.
2. Use `re.sub()` to replace all vowels in a sentence with `*`.

---

## 5. Practical Validation Examples

### 5.1 Email Validation

```python
def is_valid_email(email):
    pattern = r"^[\w.-]+@[\w.-]+\.\w+$"
    return bool(re.match(pattern, email))

print(is_valid_email("aditi@example.com"))   # True
print(is_valid_email("invalid-email"))        # False
```

**Explanation:** `^[\w.-]+` matches the part before `@` (letters, digits, dots, hyphens). `@[\w.-]+` matches the domain name. `\.\w+$` requires a dot followed by letters (the extension, like `.com`), anchored to the end of the string.

### 5.2 Phone Number Validation

```python
def is_valid_phone(number):
    pattern = r"^\d{10}$"
    return bool(re.match(pattern, number))

print(is_valid_phone("9876543210"))   # True
print(is_valid_phone("98765"))         # False
```

### 5.3 Password Validation

```python
def is_strong_password(password):
    has_length = len(password) >= 8
    has_upper = bool(re.search(r"[A-Z]", password))
    has_digit = bool(re.search(r"\d", password))
    has_special = bool(re.search(r"[!@#$%^&*]", password))
    return has_length and has_upper and has_digit and has_special

print(is_strong_password("Python@123"))   # True
print(is_strong_password("weakpass"))      # False
```

### 5.4 Extracting Numbers From Text

```python
text = "Room 42B, Floor 3, Building 7"
numbers = re.findall(r"\d+", text)
print(numbers)   # ['42', '3', '7']
```

### 5.5 Finding Words

```python
text = "Python is fun and Python is powerful"
words = re.findall(r"\b\w+\b", text)
print(words)   # ['Python', 'is', 'fun', 'and', 'Python', 'is', 'powerful']

python_count = len(re.findall(r"\bPython\b", text))
print(python_count)   # 2
```

**Explanation:** `\b` marks a "word boundary" — the edge between a word character and a non-word character — ensuring `\bPython\b` matches the whole word "Python" and not, say, the "Python" inside "Pythonic."

### Common Mistakes

- Writing overly simple email patterns that miss valid formats (real-world email validation regex can get quite complex — most production systems combine regex with sending an actual verification email).
- Forgetting `\b` when searching for whole words, causing partial matches inside longer words.

---

## Common Beginner Mistakes — Summary for This Section

- Forgetting to use raw strings (`r"..."`) for patterns.
- Confusing `re.match()` (start only) with `re.search()` (anywhere).
- Forgetting to escape literal special characters like `.` when they should be matched literally.
- Calling `.group()` on a `None` result without checking first.

---

## Cheat Sheet — Regular Expressions

```python
import re

\d  \D  \w  \W  \s  \S  .        # character classes
*  +  ?  {n}  {n,m}               # quantifiers
^  $                                # anchors (start / end)
()                                  # capturing group
\b                                  # word boundary

re.search(pattern, text)           # first match anywhere
re.match(pattern, text)             # match at start only
re.findall(pattern, text)           # all matches as a list
re.split(pattern, text)             # split by pattern
re.sub(pattern, replacement, text)  # find and replace

match.group()      # full match
match.group(1)     # first captured group
```

---

## Interview Questions

**Q1. What is the difference between `re.match()` and `re.search()`?**
Answer: `re.match()` only checks for a match at the very beginning of the string. `re.search()` scans the entire string and returns the first match found anywhere.

**Q2. What does `re.findall()` return?**
Answer: A list of all non-overlapping matches found in the string.

**Q3. What is a capturing group in regex?**
Answer: A portion of the pattern enclosed in parentheses `()`, allowing you to extract just that specific part of the overall match.

**Q4. Why should regex patterns be written as raw strings in Python?**
Answer: To prevent Python from interpreting backslashes as escape sequences before the regex engine gets to process them — raw strings (`r"..."`) treat backslashes literally.

**Q5. What does `\b` mean in a regex pattern?**
Answer: A word boundary — the position between a word character and a non-word character, useful for matching whole words rather than partial matches inside longer words.

---

## Practice Questions

**Beginner**
1. Write a regex pattern to check if a string contains only digits.
2. Extract all email addresses from a paragraph of text using `re.findall()`.
3. Check whether a string starts with "Mr." or "Mrs." using `re.match()`.
4. Replace all digits in a string with the `#` symbol using `re.sub()`.
5. Split a sentence into individual words using regex.

**Intermediate**
1. Write a function to validate Indian-style phone numbers (10 digits, optionally starting with +91).
2. Write a function to validate a password requiring at least 8 characters, one digit, one uppercase letter, and one special character.
3. Extract all hashtags (words starting with `#`) from a social media post using regex.
4. Write a program that extracts all dates in the format `DD-MM-YYYY` from a block of text.
5. Use capturing groups to separate a full name into first and last name from a string like `"Aditi Sharma"`.

**Challenge**
1. Write a function that validates a URL, checking it starts with `http://` or `https://` and has a valid domain structure.
2. Write a program that extracts all valid email addresses from a messy block of text that also contains invalid-looking addresses, and prints only the valid ones.
3. Build a simple log-line parser using regex that extracts the timestamp, log level (INFO/ERROR/WARNING), and message from a line like `[2026-01-15 10:30:00] ERROR: Database connection failed`.
$xx13$, 'markdown',
  jsonb_build_object('source', 'python_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'python_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Python Environment & Package Management
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = 'advanced-python-tools'),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $xx14$Python Environment & Package Management$xx14$, $xx15$environment-and-package-management$xx15$, $xx16$Installing and managing third-party libraries with pip, isolating project dependencies with virtual environments, requirements.txt, the modern pyproject.toml format, and Python version management.$xx16$, 13,
    'published', true, true, 'python_tutorial', $xx17$advanced-python-tools/environment-and-package-management$xx17$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $xx18$Every real Python project eventually needs code that someone else has already written — libraries like `requests`, `pandas`, or `flask`. This file covers how to install, organize, and manage these external packages properly, project by project.

---

## 1. What is `pip`?

### What is it?

`pip` is Python's package manager — a command-line tool used to install, update, and remove third-party libraries (packages) that aren't part of Python's built-in Standard Library.

> **Definition:** pip is the standard package installer for Python, used to download and manage libraries from the Python Package Index (PyPI).

### Why do we use it?

Instead of writing everything yourself, `pip` lets you install ready-made, tested libraries with a single command — like `requests` for making web requests, or `pandas` for data analysis.

### Basic `pip` Commands

```bash
pip install requests              # install a package
pip install requests==2.28.0      # install a specific version
pip uninstall requests             # remove a package
pip list                           # list all installed packages
pip show requests                  # show details about a specific package
pip install --upgrade requests     # upgrade to the latest version
pip --version                      # check pip's version
```

### Explanation

- `pip install requests` downloads the `requests` library from PyPI (the Python Package Index — an online repository of packages) and makes it available to `import` in your code.
- Pinning a specific version (`==2.28.0`) ensures consistent behavior — useful when a newer version might change something your code depends on.

### Common Mistakes

- Forgetting to install a package before importing it, causing `ModuleNotFoundError`.
- Installing packages globally for every project, instead of per-project (this is exactly the problem virtual environments solve — see below).
- Using `pip` instead of `pip3` (or vice versa) when both Python 2 and 3 are installed on older systems.

### Important Points

- `pip` comes pre-installed with modern Python (3.4+).
- PyPI (pypi.org) is the central place packages are published to and installed from.

---

## 2. What is a Virtual Environment?

### What is it?

A virtual environment is an isolated, self-contained Python setup for a specific project — with its own installed packages, completely separate from your system's global Python installation and other projects.

> **Definition:** A virtual environment is an isolated Python environment that allows project-specific dependencies without affecting the global Python installation.

### Why do we use it?

Imagine Project A needs `django==3.0` and Project B needs `django==4.2`. If you installed packages globally, you could only have one version at a time — installing one would break the other project. Virtual environments solve this by giving **each project its own isolated set of installed packages.**

### How does it work?

Python's built-in `venv` module creates a separate folder containing its own Python interpreter and package storage, isolated from the rest of your system.

### Creating and Using a Virtual Environment

```bash
# Create a virtual environment named "venv" in the current folder
python -m venv venv

# Activate it:
# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate

# Your terminal prompt now shows (venv) - confirming it's active

# Install packages - these install ONLY inside this environment
pip install requests

# Deactivate when done
deactivate
```

### Explanation of the Code

- `python -m venv venv` creates a new folder called `venv` containing an isolated Python setup.
- Activating it changes your terminal session so that `python` and `pip` commands use this isolated environment instead of your global Python installation.
- Any package installed while activated stays inside this environment — it won't affect other projects or your system-wide Python.

### Real-World Example

Professional developers create a new virtual environment for every single project, ensuring each project's dependencies stay clean, isolated, and reproducible on any machine.

### Common Mistakes

- Forgetting to activate the virtual environment before installing packages, accidentally installing them globally instead.
- Committing the entire `venv` folder to version control (like Git) — it should always be excluded (via `.gitignore`), since it can be recreated from `requirements.txt` on any machine.
- Forgetting to deactivate one environment before activating another.

### Important Points

- Always create a fresh virtual environment for each new project.
- Add `venv/` (or whatever you name the folder) to your `.gitignore` file.
- `(venv)` shown in your terminal prompt confirms the environment is currently active.

### Practice

1. Create a new virtual environment, activate it, install the `requests` package, and confirm it's installed using `pip list`.

---

## 3. `requirements.txt`

### What is it?

A simple text file listing every package (and often, version) your project depends on — used to recreate the exact same environment on another machine, or after cloning the project from Git.

### Creating a `requirements.txt` File

```bash
pip freeze > requirements.txt
```

This captures every currently installed package (and its exact version) in the active virtual environment, and writes them into `requirements.txt`.

### Example `requirements.txt` Content

```
requests==2.31.0
flask==3.0.0
pandas==2.1.4
```

### Installing From `requirements.txt`

```bash
pip install -r requirements.txt
```

**Explanation:** This reads the file and installs every listed package at its specified version — exactly recreating the intended environment, whether on a teammate's laptop or a production server.

### Real-World Example

When you clone almost any real Python project from GitHub, one of the very first setup steps is always: create a virtual environment, then run `pip install -r requirements.txt`.

### Common Mistakes

- Forgetting to regenerate `requirements.txt` after installing new packages, so teammates end up with an outdated dependency list.
- Manually typing package names into `requirements.txt` instead of using `pip freeze`, risking typos or missed dependencies.

### Important Points

- `requirements.txt` is the standard way to share exact project dependencies.
- Always regenerate it (`pip freeze > requirements.txt`) after adding or updating packages.

---

## 4. `pyproject.toml` (Modern Approach)

### What is it?

`pyproject.toml` is a newer, more standardized configuration file for Python projects — used by modern tools (like Poetry, or newer `pip` versions) to define dependencies, build settings, and project metadata all in one place.

### Example `pyproject.toml`

```toml
[project]
name = "my-python-app"
version = "1.0.0"
description = "A sample Python application"
dependencies = [
    "requests>=2.31.0",
    "flask>=3.0.0"
]

[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"
```

### Comparison Table — `requirements.txt` vs `pyproject.toml`

| | `requirements.txt` | `pyproject.toml` |
|---|---|---|
| Format | Plain list of packages | Structured TOML format |
| Scope | Just dependencies | Dependencies + project metadata + build config |
| Status | Older, still very widely used | Newer, increasingly the modern standard |
| Best for | Simple projects, quick scripts | Larger projects, published packages |

### Important Points

- Both approaches are valid — `requirements.txt` remains extremely common and is perfectly fine for most learning projects and many production ones.
- `pyproject.toml` is becoming the modern standard, especially for packages meant to be published or larger, more structured applications.

---

## 5. Python Version Management

### What is it?

Different projects sometimes need different Python **versions** (not just different packages) — for example, one older project might require Python 3.9, while a newer one uses Python 3.12. Tools like `pyenv` (on macOS/Linux) let you install and switch between multiple Python versions easily.

### Basic Concept (No Deep Dive Needed at This Stage)

```bash
pyenv install 3.11.0     # install a specific Python version
pyenv local 3.11.0        # use that version for the current project folder
```

### Important Points

- Virtual environments (`venv`) manage **packages** per project; version managers like `pyenv` manage the **Python interpreter version itself**.
- For most beginner and intermediate projects, a single up-to-date Python 3 version combined with `venv` is more than sufficient — version management tools become more relevant working across multiple legacy projects professionally.

---

## Common Beginner Mistakes — Summary for This Section

- Installing packages globally instead of inside a project-specific virtual environment.
- Forgetting to activate the virtual environment before installing packages.
- Committing the `venv` folder to Git instead of just `requirements.txt`.
- Forgetting to update `requirements.txt` after installing new packages.

---

## Cheat Sheet — Environment & Package Management

```bash
# pip
pip install package_name
pip install package_name==1.2.3
pip uninstall package_name
pip list
pip show package_name
pip install --upgrade package_name

# virtual environments
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # macOS/Linux
deactivate

# requirements.txt
pip freeze > requirements.txt
pip install -r requirements.txt
```

---

## Interview Questions

**Q1. What is `pip`?**
Answer: Python's standard package manager, used to install, update, and remove third-party libraries from PyPI (the Python Package Index).

**Q2. Why are virtual environments important?**
Answer: They isolate a project's dependencies from the global Python installation and from other projects, preventing version conflicts between projects that need different versions of the same package.

**Q3. What is `requirements.txt` used for?**
Answer: It lists all the packages (and typically their exact versions) a project depends on, allowing the same environment to be recreated on another machine using `pip install -r requirements.txt`.

**Q4. What command creates a virtual environment?**
Answer: `python -m venv venv` (where `venv` is the chosen folder name for the environment).

**Q5. What's the difference between `requirements.txt` and `pyproject.toml`?**
Answer: `requirements.txt` is a simple list of dependencies. `pyproject.toml` is a more modern, structured configuration file that can include dependencies alongside project metadata and build settings.

---

## Practice Questions

**Beginner**
1. Create a virtual environment and activate it on your operating system.
2. Install the `requests` package inside your activated virtual environment.
3. List all currently installed packages using `pip list`.
4. Generate a `requirements.txt` file from your current environment.
5. Deactivate your virtual environment.

**Intermediate**
1. Create a new virtual environment, install two packages of your choice, and generate a `requirements.txt` from it.
2. Delete your virtual environment folder, recreate a new one, and reinstall everything using `pip install -r requirements.txt`.
3. Explain (in your own words, in comments) why committing a `venv` folder to Git is considered bad practice.

**Challenge**
1. Set up a small project with a `pyproject.toml` file listing two dependencies, and explain what each section of the file does.
2. Simulate a version-conflict scenario in writing: describe how two different projects needing different versions of the same package would cause problems without virtual environments, and how `venv` solves it.
$xx18$, 'markdown',
  jsonb_build_object('source', 'python_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'python_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Database Programming
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = 'advanced-python-tools'),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $xx19$Database Programming$xx19$, $xx20$database-programming$xx20$, $xx21$SQL fundamentals — tables, primary keys, CRUD, WHERE, ORDER BY, GROUP BY, JOIN, indexes and transactions — plus using databases from Python with sqlite3 and the SQLAlchemy ORM.$xx21$, 14,
    'published', true, true, 'python_tutorial', $xx22$advanced-python-tools/database-programming$xx22$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $xx23$Every meaningful application needs to store data permanently and reliably — user accounts, orders, student records. While File Handling (covered earlier) works for simple cases, real applications use **databases**, which are built specifically for storing, searching, and managing large amounts of structured data efficiently and safely.

This file first teaches SQL fundamentals — the language databases understand — and then shows how to use it from Python.

---

## 1. What is a Database?

### What is it?

A database is an organized collection of structured data, stored so it can be efficiently accessed, managed, and updated.

> **Definition:** A database is a structured collection of data that can be efficiently accessed, managed, and updated.

### Why do we use it?

- **Reliability** — databases are built to avoid data loss or corruption, even during crashes.
- **Efficiency** — finding one record among millions is fast, thanks to how databases organize and index data.
- **Concurrent access** — multiple users/programs can safely read and write data at the same time.
- **Structured relationships** — data like "students" and "courses" can be linked together meaningfully.

### Tables, Rows, and Columns

A relational database organizes data into **tables** — similar to a spreadsheet.

| Concept | Spreadsheet Equivalent |
|---|---|
| Table | An entire sheet |
| Row (record) | A single line of data |
| Column (field) | A single category of data |

**Example — a `students` table:**

| id | name | age | course |
|---|---|---|---|
| 1 | Aditi | 21 | CS |
| 2 | Rohan | 22 | Data Science |

### Primary Keys

### What is it?

A **primary key** is a column that uniquely identifies each row in a table — no two rows can share the same primary key value.

```sql
CREATE TABLE students (
    id INTEGER PRIMARY KEY,
    name TEXT,
    age INTEGER,
    course TEXT
);
```

### Important Points

- Every table should have a primary key (often an auto-incrementing `id`).
- Primary keys are how databases uniquely identify and link rows to each other.

---

## 2. CRUD Operations in SQL

CRUD stands for **C**reate, **R**ead, **U**pdate, **D**elete — the four fundamental operations performed on data.

### 2.1 INSERT (Create)

```sql
INSERT INTO students (name, age, course)
VALUES ('Aditi', 21, 'Computer Science');
```

**Explanation:** This adds a new row to the `students` table. The `id` column is usually left out and auto-generated by the database.

### 2.2 SELECT (Read)

```sql
SELECT * FROM students;                    -- get all columns, all rows
SELECT name, age FROM students;            -- get specific columns only
SELECT * FROM students WHERE age > 21;     -- get rows matching a condition
```

### 2.3 UPDATE

```sql
UPDATE students
SET age = 22
WHERE name = 'Aditi';
```

**Explanation:** This changes existing data. The `WHERE` clause is critical — without it, **every row** in the table would be updated.

### 2.4 DELETE

```sql
DELETE FROM students
WHERE name = 'Rohan';
```

**Explanation:** Removes matching rows. Just like `UPDATE`, forgetting `WHERE` here would delete **every** row in the table.

### Common Mistakes

- Forgetting the `WHERE` clause in `UPDATE` or `DELETE` — this is one of the most dangerous and common real-world SQL mistakes, potentially wiping or overwriting an entire table.
- Forgetting the semicolon `;` at the end of SQL statements (required by most database tools).

### Important Points

- **Always** double-check your `WHERE` clause before running `UPDATE` or `DELETE` in a real system.
- `SELECT *` retrieves all columns — in large tables/production systems, it's often better to select only the specific columns you need.

---

## 3. `WHERE` — Filtering Data

### What is it?

`WHERE` filters which rows are affected by `SELECT`, `UPDATE`, or `DELETE`.

### Simple Example

```sql
SELECT * FROM students WHERE course = 'Computer Science';
SELECT * FROM students WHERE age >= 21 AND course = 'Data Science';
SELECT * FROM students WHERE name LIKE 'A%';    -- names starting with "A"
```

**Explanation:** `LIKE 'A%'` is a pattern match — `%` acts as a wildcard for "any characters," so this finds every name starting with "A."

### Comparison Operators in SQL

| Operator | Meaning |
|---|---|
| `=` | Equal to |
| `!=` or `<>` | Not equal to |
| `>` `<` `>=` `<=` | Greater/less than (or equal to) |
| `AND` / `OR` | Combine multiple conditions |
| `LIKE` | Pattern matching |
| `IN (...)` | Matches any value in a list |
| `BETWEEN a AND b` | Within a range |

---

## 4. `ORDER BY` — Sorting Results

### Simple Example

```sql
SELECT * FROM students ORDER BY age;             -- ascending (default)
SELECT * FROM students ORDER BY age DESC;         -- descending
SELECT * FROM students ORDER BY course, age DESC; -- multiple columns
```

---

## 5. `GROUP BY` — Aggregating Data

### What is it?

`GROUP BY` groups rows sharing a common value, usually combined with aggregate functions like `COUNT()`, `SUM()`, `AVG()`.

### Simple Example

```sql
SELECT course, COUNT(*) AS total_students
FROM students
GROUP BY course;
```

Sample Result:
```
course             | total_students
Computer Science   | 15
Data Science       | 10
```

**Explanation:** This counts how many students belong to each course, grouping rows by the `course` column.

### Common Aggregate Functions

| Function | Purpose |
|---|---|
| `COUNT()` | Number of rows |
| `SUM()` | Total of a numeric column |
| `AVG()` | Average of a numeric column |
| `MIN()` / `MAX()` | Smallest / largest value |

---

## 6. `JOIN` — Combining Data From Multiple Tables

### What is it?

A `JOIN` combines rows from two related tables based on a shared column (typically a primary key in one table matching a "foreign key" in another).

### Example Setup

```sql
CREATE TABLE students (
    id INTEGER PRIMARY KEY,
    name TEXT
);

CREATE TABLE enrollments (
    id INTEGER PRIMARY KEY,
    student_id INTEGER,
    course TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id)
);
```

### `INNER JOIN` — Get Matching Rows From Both Tables

```sql
SELECT students.name, enrollments.course
FROM students
INNER JOIN enrollments ON students.id = enrollments.student_id;
```

Sample Result:
```
name  | course
Aditi | Computer Science
Rohan | Data Science
```

**Explanation:** This links each student to their course by matching `students.id` with `enrollments.student_id` — without a `JOIN`, you'd have to manually cross-reference two separate tables yourself.

### Important Points

- `JOIN` is central to relational databases — data is often deliberately split across multiple related tables (this is called "normalization") to avoid repetition.
- A "foreign key" is a column in one table that refers to the primary key of another table, defining the relationship between them.

---

## 7. Indexes

### What is it?

An index is a special data structure that dramatically speeds up searches on a specific column — similar to an index at the back of a textbook, letting you find information without scanning every single page.

```sql
CREATE INDEX idx_student_name ON students(name);
```

### Important Points

- Indexes speed up `SELECT`/`WHERE` queries on the indexed column significantly.
- Indexes have a cost too — they slow down `INSERT`/`UPDATE` slightly, since the index itself needs updating. Use them on columns you search frequently, not on every column.

---

## 8. Transactions

### What is it?

A transaction is a group of database operations treated as a single, all-or-nothing unit — either **all** of them succeed together, or **none** of them take effect at all.

> **Definition:** A transaction is a sequence of database operations that are executed as a single unit, ensuring data consistency even if something fails partway through.

### Real-World Example — Bank Transfer

Transferring money from Account A to Account B involves two steps: subtract from A, add to B. If the program crashes after subtracting from A but before adding to B, money would simply vanish — unless both steps are wrapped in a single transaction, which ensures either **both** happen or **neither** does.

```sql
BEGIN TRANSACTION;

UPDATE accounts SET balance = balance - 500 WHERE id = 1;
UPDATE accounts SET balance = balance + 500 WHERE id = 2;

COMMIT;
```

**Explanation:** `COMMIT` finalizes both changes together. If something goes wrong before `COMMIT`, a `ROLLBACK` would undo everything back to how it was before the transaction started.

### Important Points

- Transactions guarantee consistency, especially for operations involving multiple related steps.
- `COMMIT` finalizes changes; `ROLLBACK` undoes them if something goes wrong.

---

## Comparison Table — SQL Concepts Summary

| Concept | Purpose |
|---|---|
| `SELECT` | Retrieve data |
| `INSERT` | Add new data |
| `UPDATE` | Modify existing data |
| `DELETE` | Remove data |
| `WHERE` | Filter which rows are affected |
| `ORDER BY` | Sort results |
| `GROUP BY` | Aggregate/summarize data |
| `JOIN` | Combine related tables |
| Index | Speed up searches |
| Transaction | Guarantee all-or-nothing consistency |

---

## 9. Python + SQLite

### What is it?

SQLite is a lightweight, file-based database — no separate server needed, making it perfect for learning, small applications, and even many production use cases. Python includes built-in support via the `sqlite3` module — **no installation required**.

### Full CRUD Example

```python
import sqlite3

# Connect (creates the file if it doesn't already exist)
connection = sqlite3.connect("school.db")
cursor = connection.cursor()

# Create a table
cursor.execute("""
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age INTEGER,
    course TEXT
)
""")

# INSERT (Create)
cursor.execute(
    "INSERT INTO students (name, age, course) VALUES (?, ?, ?)",
    ("Aditi", 21, "Computer Science")
)
connection.commit()   # save the change

# SELECT (Read)
cursor.execute("SELECT * FROM students")
rows = cursor.fetchall()
for row in rows:
    print(row)

# UPDATE
cursor.execute(
    "UPDATE students SET age = ? WHERE name = ?",
    (22, "Aditi")
)
connection.commit()

# DELETE
cursor.execute("DELETE FROM students WHERE name = ?", ("Rohan",))
connection.commit()

connection.close()
```

### Explanation of the Code

- `sqlite3.connect("school.db")` opens (or creates) the database file, and `cursor` is used to actually execute SQL commands.
- The `?` placeholders in each query are **parameterized queries** — Python safely inserts the actual values, protecting against SQL injection attacks (a serious security topic, covered in the Security file later).
- `connection.commit()` saves any changes (`INSERT`, `UPDATE`, `DELETE`) permanently — without it, changes are lost when the connection closes.
- `cursor.fetchall()` retrieves every row from the last `SELECT` query as a list of tuples.

### Common Mistakes

- **Never** build SQL queries using plain string formatting/f-strings with user input (e.g., `f"SELECT * FROM students WHERE name = '{name}'"`) — this is a serious security vulnerability (SQL injection). Always use `?` placeholders instead.
- Forgetting `connection.commit()` after `INSERT`/`UPDATE`/`DELETE`, causing changes to silently not be saved.
- Forgetting to `connection.close()` when done.

### Important Points

- `sqlite3` requires no separate installation or server — perfect for learning and small projects.
- Always use parameterized queries (`?` placeholders) — never insert user input directly into a query string.

### Practice

1. Create a SQLite database with a `products` table (`id`, `name`, `price`), insert 3 products, then query and print all of them.

---

## 10. Python + MySQL and PostgreSQL

### What is it?

MySQL and PostgreSQL are full-featured database servers, commonly used in production applications (unlike SQLite, they run as a separate server process, supporting many simultaneous users).

### Connecting to MySQL

```python
# pip install mysql-connector-python
import mysql.connector

connection = mysql.connector.connect(
    host="localhost",
    user="root",
    password="your_password",
    database="school_db"
)
cursor = connection.cursor()

cursor.execute("SELECT * FROM students")
for row in cursor.fetchall():
    print(row)

connection.close()
```

### Connecting to PostgreSQL

```python
# pip install psycopg2
import psycopg2

connection = psycopg2.connect(
    host="localhost",
    user="postgres",
    password="your_password",
    dbname="school_db"
)
cursor = connection.cursor()

cursor.execute("SELECT * FROM students")
for row in cursor.fetchall():
    print(row)

connection.close()
```

### Comparison Table — SQLite vs MySQL vs PostgreSQL

| | SQLite | MySQL | PostgreSQL |
|---|---|---|---|
| Setup | None (built into Python) | Requires installing a server | Requires installing a server |
| Best for | Learning, small apps, prototypes | Web applications, general use | Complex queries, data integrity-critical apps |
| Concurrent users | Limited | Good | Excellent |
| Requires separate installation? | No | Yes | Yes |

### Important Points

- The Python code pattern (`connect`, `cursor`, `execute`, `fetchall`, `commit`, `close`) is nearly identical across all three databases — learning one makes the others easy to pick up.
- Never hardcode real passwords directly in code — use environment variables instead (covered in the Security file).

---

## 11. SQLAlchemy (ORM)

### What is it?

SQLAlchemy is an **ORM** (Object-Relational Mapper) — it lets you interact with a database using Python classes and objects instead of writing raw SQL directly.

> **Definition:** An ORM lets you interact with database tables as if they were Python classes and objects, automatically translating your code into SQL behind the scenes.

### Simple Example

```python
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker

engine = create_engine("sqlite:///school.db")
Base = declarative_base()

class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    age = Column(Integer)
    course = Column(String)

Base.metadata.create_all(engine)   # creates the table if it doesn't exist

Session = sessionmaker(bind=engine)
session = session = Session()

# Create
new_student = Student(name="Zara", age=20, course="AI")
session.add(new_student)
session.commit()

# Read
students = session.query(Student).all()
for student in students:
    print(student.name, student.age, student.course)

# Update
student_to_update = session.query(Student).filter_by(name="Zara").first()
student_to_update.age = 21
session.commit()

# Delete
student_to_delete = session.query(Student).filter_by(name="Zara").first()
session.delete(student_to_delete)
session.commit()
```

### Explanation of the Code

- `class Student(Base):` defines a Python class that maps directly to a `students` table — each attribute becomes a column.
- Instead of writing `INSERT INTO ...` manually, you just create a `Student` object and call `session.add()` — SQLAlchemy generates the actual SQL behind the scenes.
- `.query(Student).filter_by(...)` replaces writing a `SELECT ... WHERE ...` statement by hand.

### Comparison Table — Raw SQL vs ORM (SQLAlchemy)

| | Raw SQL (`sqlite3`) | ORM (SQLAlchemy) |
|---|---|---|
| Syntax | Write SQL strings directly | Write Python classes and objects |
| Learning curve | Need to know SQL well | Need to learn the ORM's own API |
| Flexibility | Full control over exact queries | Very flexible, but some complex queries still need raw SQL |
| Best for | Simple projects, learning SQL | Larger applications, especially with many related tables |

### Important Points

- ORMs reduce repetitive SQL writing and make code more "Pythonic," but understanding underlying SQL fundamentals (covered earlier in this file) is still essential.
- SQLAlchemy is the most widely used ORM in the Python ecosystem, and is used heavily in frameworks like Flask and FastAPI.

---

## Common Beginner Mistakes — Summary for This Section

- Forgetting the `WHERE` clause in `UPDATE`/`DELETE`, unintentionally affecting every row.
- Building SQL queries with raw string formatting instead of parameterized queries — a serious security risk (SQL injection).
- Forgetting `connection.commit()` after making changes.
- Forgetting to close database connections.

---

## Cheat Sheet — Database Programming

```sql
-- SQL
SELECT * FROM table WHERE condition ORDER BY column;
INSERT INTO table (col1, col2) VALUES (val1, val2);
UPDATE table SET col1 = val1 WHERE condition;
DELETE FROM table WHERE condition;
SELECT col, COUNT(*) FROM table GROUP BY col;
SELECT a.x, b.y FROM a INNER JOIN b ON a.id = b.a_id;
```

```python
# Python + sqlite3
import sqlite3
conn = sqlite3.connect("db.db")
cursor = conn.cursor()
cursor.execute("SELECT * FROM table WHERE col = ?", (value,))
rows = cursor.fetchall()
conn.commit()
conn.close()
```

---

## Mini Project: Student Management System

### Objective

Build a command-line application that manages student records using a real SQLite database, with full CRUD functionality.

### Requirements

- Add a student, view all students, update a student's marks, and delete a student.
- All data must persist in an actual SQLite database file.

### Concepts Used

SQL (CREATE TABLE, INSERT, SELECT, UPDATE, DELETE), `sqlite3` module, functions, parameterized queries.

### Complete Code

```python
import sqlite3

def connect_db():
    connection = sqlite3.connect("students.db")
    connection.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            marks REAL
        )
    """)
    return connection

def add_student(connection, name, marks):
    connection.execute("INSERT INTO students (name, marks) VALUES (?, ?)", (name, marks))
    connection.commit()
    print(f"Added student: {name}")

def view_students(connection):
    cursor = connection.execute("SELECT id, name, marks FROM students")
    rows = cursor.fetchall()
    if not rows:
        print("No students found.")
        return
    for row in rows:
        print(f"ID: {row[0]}, Name: {row[1]}, Marks: {row[2]}")

def update_marks(connection, student_id, new_marks):
    connection.execute("UPDATE students SET marks = ? WHERE id = ?", (new_marks, student_id))
    connection.commit()
    print("Marks updated.")

def delete_student(connection, student_id):
    connection.execute("DELETE FROM students WHERE id = ?", (student_id,))
    connection.commit()
    print("Student deleted.")

connection = connect_db()

while True:
    print("\n1. Add Student  2. View Students  3. Update Marks  4. Delete Student  5. Exit")
    choice = input("Choose an option: ")

    if choice == "1":
        name = input("Name: ")
        marks = float(input("Marks: "))
        add_student(connection, name, marks)
    elif choice == "2":
        view_students(connection)
    elif choice == "3":
        student_id = int(input("Student ID: "))
        new_marks = float(input("New Marks: "))
        update_marks(connection, student_id, new_marks)
    elif choice == "4":
        student_id = int(input("Student ID to delete: "))
        delete_student(connection, student_id)
    elif choice == "5":
        connection.close()
        print("Goodbye!")
        break
    else:
        print("Invalid choice.")
```

### Code Explanation

- `connect_db()` opens the database (creating `students.db` if it doesn't exist) and ensures the `students` table exists.
- Every write operation (`add_student`, `update_marks`, `delete_student`) uses parameterized `?` placeholders — safe from SQL injection.
- The menu loop lets the user perform CRUD operations repeatedly until choosing to exit, at which point the connection is properly closed.

### Sample Output

```
1. Add Student  2. View Students  3. Update Marks  4. Delete Student  5. Exit
Choose an option: 1
Name: Aditi
Marks: 88.5
Added student: Aditi

1. Add Student  2. View Students  3. Update Marks  4. Delete Student  5. Exit
Choose an option: 2
ID: 1, Name: Aditi, Marks: 88.5
```

### Possible Improvements

- Add a search function to find a student by name using `LIKE`.
- Add a `course` column and a `GROUP BY course` summary report.
- Convert the raw SQL version into an SQLAlchemy ORM version as practice.

### Challenge Task

Add a second table `subjects` linked to `students` via a foreign key, and use a `JOIN` to display each student alongside their enrolled subjects.

---

## Interview Questions

**Q1. What does CRUD stand for?**
Answer: Create, Read, Update, Delete — the four fundamental operations performed on data.

**Q2. Why is forgetting the `WHERE` clause in an `UPDATE` or `DELETE` statement dangerous?**
Answer: Without `WHERE`, the operation applies to **every** row in the table, potentially overwriting or deleting all existing data unintentionally.

**Q3. What is a primary key?**
Answer: A column (or set of columns) that uniquely identifies each row in a table — no two rows can share the same primary key value.

**Q4. What is a `JOIN` used for?**
Answer: Combining related data stored across multiple tables, typically by matching a primary key in one table with a foreign key in another.

**Q5. What is SQL injection, and how do parameterized queries prevent it?**
Answer: SQL injection is a security vulnerability where malicious input is inserted directly into a SQL query string, potentially altering its meaning or exposing/damaging data. Parameterized queries (using `?` placeholders) keep user input strictly separate from the SQL command structure, preventing this.

**Q6. What is a transaction, and why does it matter?**
Answer: A transaction groups multiple database operations into a single all-or-nothing unit, ensuring data stays consistent even if something fails partway through (e.g., a bank transfer where both the debit and credit must succeed together).

**Q7. What is an ORM, and name one example in Python?**
Answer: An Object-Relational Mapper lets you interact with database tables using Python classes and objects instead of writing raw SQL directly. SQLAlchemy is the most widely used example in Python.

---

## Practice Questions

**Beginner**
1. Write a SQL query to select all students older than 20.
2. Write a SQL query to update a student's course.
3. Write a SQL query to delete a student by their ID.
4. Using `sqlite3`, create a database with a `books` table and insert 3 books.
5. Write a query using `ORDER BY` to sort students by age, descending.

**Intermediate**
1. Write a SQL query using `GROUP BY` to count how many students are enrolled in each course.
2. Using `sqlite3` in Python, write functions to add, view, and delete records from a `books` table.
3. Write a query using `JOIN` to combine a `students` table and an `enrollments` table.
4. Write a Python program using parameterized queries to search for students by name (using `LIKE`).
5. Explain, using an example, why parameterized queries are important for security.

**Challenge**
1. Design a small database schema (in SQL) for a library system with `books`, `members`, and `borrowed_books` tables, including appropriate foreign keys.
2. Rewrite the Student Management System mini project using SQLAlchemy instead of raw SQL.
3. Write a Python program that wraps a bank transfer (subtracting from one account, adding to another) inside a transaction, and explain what would happen if the program crashed mid-transfer without transaction handling.
$xx23$, 'markdown',
  jsonb_build_object('source', 'python_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'python_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- APIs & HTTP
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = 'advanced-python-tools'),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $xx24$APIs & HTTP$xx24$, $xx25$apis-and-http$xx25$, $xx26$How the web talks to itself — HTTP methods, headers, status codes, REST conventions, authentication, the requests library, and robust error handling for real-world API calls.$xx26$, 15,
    'published', true, true, 'python_tutorial', $xx27$advanced-python-tools/apis-and-http$xx27$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $xx28$Modern applications rarely work alone — a weather app needs real weather data from somewhere, a payment page needs to talk to a bank, a chat app needs to send messages to a server. APIs are how different programs communicate with each other over the internet, and HTTP is the language they use to do it.

---

## 1. What is HTTP?

### What is it?

HTTP (HyperText Transfer Protocol) is the standard set of rules that defines how computers request and send data over the internet.

> **Definition:** HTTP is a protocol that defines how requests and responses are exchanged between a client and a server over the web.

### The Client-Server Model

- The **client** is the one requesting something — your browser, your phone app, or a Python script.
- The **server** is the one that has the data or service and responds to requests.

### How does it work?

1. The client sends a **request** to a server (e.g., "give me the weather for Mumbai").
2. The server processes the request and sends back a **response** (e.g., the actual weather data).

This request-response pattern is the foundation of essentially the entire internet.

### Real-World Example

When you open a weather app, it sends a request to a weather **API** (a server that provides weather data), which responds with the current temperature and forecast — all within a second or two.

---

## 2. What is an API?

### What is it?

An API (Application Programming Interface) is a defined way for one piece of software to communicate with another. A **web API** specifically allows communication over HTTP, usually exchanging data in JSON format.

> **Definition:** An API is a set of rules that allows different software applications to communicate with each other.

### Why do we use it?

- To use data or services someone else has already built (weather, maps, payments) instead of building it all yourself.
- To let your own application's frontend (a mobile app or website) talk to your backend server.
- To connect different systems together (e.g., an e-commerce site talking to a shipping company's tracking system).

---

## 3. HTTP Methods

### What is it?

HTTP methods describe the **type of action** a request wants to perform.

| Method | Purpose | Real-World Analogy |
|---|---|---|
| `GET` | Retrieve data | Reading a webpage |
| `POST` | Create new data | Submitting a signup form |
| `PUT` | Replace/update an entire resource | Replacing a whole profile |
| `PATCH` | Partially update a resource | Updating just your email, not your whole profile |
| `DELETE` | Remove data | Deleting your account |

### Simple Example — Conceptual

```
GET /students/5          → Fetch student with ID 5
POST /students            → Create a new student
PUT /students/5           → Replace ALL data for student 5
PATCH /students/5         → Update just one field for student 5
DELETE /students/5        → Delete student 5
```

### Common Mistakes

- Using `GET` for operations that change data — `GET` requests should be safe to repeat without side effects (this is called being "idempotent" for reads).
- Confusing `PUT` (replaces the entire resource) with `PATCH` (updates only specific fields).

### Important Points

- `GET` and `DELETE` typically don't send a body of data; `POST`, `PUT`, and `PATCH` typically do.
- These methods form the backbone of REST APIs (explained below).

---

## 4. Headers

### What is it?

Headers are extra pieces of metadata sent along with an HTTP request or response — information *about* the request, separate from the actual data (the "body").

### Common Headers

| Header | Purpose |
|---|---|
| `Content-Type` | Tells the server what format the data is in (e.g., `application/json`) |
| `Authorization` | Carries credentials (like an API key or token) |
| `Accept` | Tells the server what format the client wants back |
| `User-Agent` | Identifies the client making the request |

### Simple Example

```python
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY_HERE"
}
```

### Important Points

- Headers are essential for authentication and specifying data formats.
- `Authorization: Bearer <token>` is an extremely common pattern for API authentication.

---

## 5. Status Codes

### What is it?

A status code is a 3-digit number in every HTTP response, indicating whether the request succeeded, and if not, roughly why.

### Status Code Ranges

| Range | Meaning |
|---|---|
| `1xx` | Informational (rarely seen directly) |
| `2xx` | Success |
| `3xx` | Redirection |
| `4xx` | Client error (something wrong with the request) |
| `5xx` | Server error (something wrong on the server's side) |

### Most Common Status Codes

| Code | Meaning |
|---|---|
| `200` | OK — request succeeded |
| `201` | Created — a new resource was successfully created |
| `204` | No Content — success, but nothing to return |
| `400` | Bad Request — the request was malformed |
| `401` | Unauthorized — missing or invalid credentials |
| `403` | Forbidden — authenticated, but not allowed to do this |
| `404` | Not Found — the resource doesn't exist |
| `500` | Internal Server Error — something broke on the server |

### Common Mistakes

- Assuming any response means success — always check the status code before trusting the response data.
- Confusing `401` (not authenticated at all) with `403` (authenticated, but not permitted to access this specific thing).

### Important Points

- `2xx` = success, `4xx` = your request's fault, `5xx` = the server's fault.
- Checking status codes is essential for reliable API integration.

---

## 6. JSON in APIs

### Quick Recap

APIs almost universally exchange data as JSON — a lightweight, text-based format representing structured data (covered in depth in the File Handling file). A typical API response looks like this:

```json
{
    "city": "Mumbai",
    "temperature": 31,
    "condition": "Sunny",
    "humidity": 65
}
```

Python's `requests` library (below) automatically converts this into a Python dictionary for you.

---

## 7. REST — Representational State Transfer

### What is it?

REST is a widely adopted architectural style for designing APIs — a set of conventions (not a strict technology) about how to organize URLs and HTTP methods so APIs are predictable and consistent.

### Simple Example — RESTful URL Design

```
GET    /students          → get all students
GET    /students/5        → get student with ID 5
POST   /students          → create a new student
PUT    /students/5        → replace student 5's data
DELETE /students/5        → delete student 5
```

### Important Points

- REST APIs organize data around **resources** (like `/students`, `/products`), acted on using standard HTTP methods.
- Most public APIs you'll use as a developer (weather, maps, payment gateways) follow REST conventions.

---

## 8. Authentication

### What is it?

Most real-world APIs require you to prove who you are before granting access — this is authentication.

### Common Authentication Methods

**API Key (very common for simple public APIs):**
```python
url = "https://api.example.com/weather"
params = {"apikey": "YOUR_API_KEY", "city": "Mumbai"}
```

**Bearer Token (common for modern APIs, including OAuth-based ones):**
```python
headers = {"Authorization": "Bearer YOUR_ACCESS_TOKEN"}
```

**Basic Auth (username/password, less common today):**
```python
from requests.auth import HTTPBasicAuth
response = requests.get(url, auth=HTTPBasicAuth("username", "password"))
```

### Common Mistakes

- Hardcoding API keys directly in shared or public code (like a GitHub repository) — this is a serious security risk covered further in the Security file. Use environment variables instead.
- Forgetting that some APIs expect the key in the URL/params, others in headers — always check the specific API's documentation.

---

## 9. The `requests` Library

### What is it?

`requests` is the most popular third-party Python library for making HTTP requests — far simpler to use than Python's built-in alternatives.

```bash
pip install requests
```

### Simple `GET` Request

```python
import requests

response = requests.get("https://api.github.com/users/octocat")

print(response.status_code)   # 200
data = response.json()         # convert JSON response to a Python dictionary
print(data["login"])           # octocat
print(data["public_repos"])
```

### `GET` Request With Query Parameters

```python
import requests

url = "https://api.example.com/weather"
params = {"city": "Mumbai", "units": "metric"}

response = requests.get(url, params=params)
print(response.url)   # shows the full URL with parameters attached
```

### `POST` Request — Sending Data

```python
import requests

url = "https://api.example.com/students"
data = {"name": "Aditi", "age": 21, "course": "Computer Science"}

response = requests.post(url, json=data)
print(response.status_code)   # 201, if successfully created
print(response.json())
```

### `PUT`, `PATCH`, and `DELETE`

```python
requests.put(url, json={"name": "Aditi Updated"})     # replace entire resource
requests.patch(url, json={"age": 22})                  # update just one field
requests.delete(url)                                    # delete the resource
```

### Explanation of the Code

- `requests.get()`, `.post()`, `.put()`, `.patch()`, `.delete()` map directly to their corresponding HTTP methods.
- `json=data` automatically converts a Python dictionary into a JSON body and sets the correct `Content-Type` header.
- `.json()` on the response automatically parses the server's JSON response back into a Python dictionary.

### Practice

1. Use `requests.get()` on a free public API (like `https://api.github.com/users/<any-username>`) and print two pieces of information from the response.

---

## 10. Error Handling with APIs

### What is it?

Real-world API calls can fail for many reasons: no internet connection, invalid credentials, the server being down. Robust code should handle these gracefully rather than crashing.

### Simple Example

```python
import requests

url = "https://api.example.com/weather"

try:
    response = requests.get(url, timeout=5)
    response.raise_for_status()   # raises an exception for 4xx/5xx status codes
    data = response.json()
    print(data)
except requests.exceptions.Timeout:
    print("The request took too long and timed out.")
except requests.exceptions.ConnectionError:
    print("Could not connect. Check your internet connection.")
except requests.exceptions.HTTPError as e:
    print(f"HTTP error occurred: {e}")
except requests.exceptions.RequestException as e:
    print(f"An unexpected error occurred: {e}")
```

### Explanation of the Code

- `timeout=5` ensures the program doesn't hang forever waiting for a slow or unresponsive server.
- `response.raise_for_status()` automatically raises an exception if the status code indicates an error (`4xx` or `5xx`), which the following `except` blocks then catch and handle specifically.
- Catching specific exception types (`Timeout`, `ConnectionError`, `HTTPError`) lets you respond differently to each kind of failure.

### Common Mistakes

- Not setting a `timeout`, which can cause a program to hang indefinitely if a server never responds.
- Assuming `requests.get()` always succeeds — always check the status code or use `raise_for_status()`.
- Not handling connection errors when internet connectivity is unreliable.

### Important Points

- Always wrap real-world API calls in `try`/`except`, and always set a `timeout`.
- `response.raise_for_status()` is a clean, standard way to detect failed requests.

---

## Comparison Table — HTTP Methods at a Glance

| Method | Typical Use | Sends a Body? | Idempotent? |
|---|---|---|---|
| `GET` | Retrieve data | No | Yes |
| `POST` | Create new data | Yes | No |
| `PUT` | Replace entire resource | Yes | Yes |
| `PATCH` | Update part of a resource | Yes | Not always |
| `DELETE` | Remove data | Rarely | Yes |

*(Idempotent means repeating the same request produces the same end result, without unwanted side effects.)*

---

## Common Beginner Mistakes — Summary for This Section

- Not checking the status code before trusting a response's data.
- Forgetting `timeout` on requests, risking the program hanging forever.
- Hardcoding API keys directly in code.
- Confusing `PUT` (whole resource replacement) with `PATCH` (partial update).
- Not wrapping API calls in proper exception handling.

---

## Cheat Sheet — APIs & HTTP

```python
import requests

requests.get(url, params={...}, headers={...}, timeout=5)
requests.post(url, json={...})
requests.put(url, json={...})
requests.patch(url, json={...})
requests.delete(url)

response.status_code
response.json()
response.text
response.raise_for_status()
```

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 500 | Server Error |

---

## Mini Project: Weather API Application

### Objective

Build a command-line application that fetches and displays real-time weather data for any city, using a public weather API.

### Requirements

- Ask the user for a city name.
- Call a weather API and retrieve the current temperature and conditions.
- Handle errors gracefully (invalid city, network issues).

*(Note: this example uses a placeholder API structure. In practice, you would sign up for a free API key from a service like OpenWeatherMap and follow their specific documentation.)*

### Concepts Used

`requests` library, JSON parsing, exception handling, functions.

### Complete Code

```python
import requests

API_KEY = "YOUR_API_KEY_HERE"   # replace with a real API key
BASE_URL = "https://api.openweathermap.org/data/2.5/weather"

def get_weather(city):
    params = {
        "q": city,
        "appid": API_KEY,
        "units": "metric"
    }

    try:
        response = requests.get(BASE_URL, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()

        temperature = data["main"]["temp"]
        condition = data["weather"][0]["description"]
        humidity = data["main"]["humidity"]

        print(f"\nWeather in {city}:")
        print(f"Temperature: {temperature}°C")
        print(f"Condition: {condition}")
        print(f"Humidity: {humidity}%")

    except requests.exceptions.HTTPError:
        print(f"Could not find weather data for '{city}'. Check the city name.")
    except requests.exceptions.ConnectionError:
        print("Connection error. Please check your internet connection.")
    except requests.exceptions.Timeout:
        print("The request timed out. Please try again.")


city_name = input("Enter a city name: ")
get_weather(city_name)
```

### Code Explanation

- `params` builds the query string sent to the API (city name, API key, and unit preference).
- `response.raise_for_status()` catches issues like an invalid API key or an unrecognized city (which returns a `4xx` status code).
- Specific `except` blocks handle different failure scenarios with clear, tailored messages instead of a generic crash.

### Sample Output

```
Enter a city name: Mumbai

Weather in Mumbai:
Temperature: 31°C
Condition: clear sky
Humidity: 65%
```

### Possible Improvements

- Add a 5-day forecast using the API's forecast endpoint.
- Let the user save favorite cities and check all of them at once.
- Add unit conversion (Celsius/Fahrenheit toggle).

### Challenge Task

Extend the application to log every weather check (city, timestamp, temperature) to a CSV file, building a simple personal weather history log.

---

## Interview Questions

**Q1. What is the difference between `PUT` and `PATCH`?**
Answer: `PUT` replaces the entire resource with the new data provided. `PATCH` updates only the specific fields included in the request, leaving the rest unchanged.

**Q2. What does a `404` status code mean?**
Answer: The requested resource could not be found on the server.

**Q3. What is the difference between `401` and `403` status codes?**
Answer: `401` means the request lacks valid authentication credentials entirely. `403` means the client is authenticated, but doesn't have permission to access that specific resource.

**Q4. Why is it important to set a `timeout` on API requests?**
Answer: Without a timeout, a request can hang indefinitely if the server is slow or unresponsive, potentially freezing the entire program.

**Q5. What does `response.raise_for_status()` do?**
Answer: It automatically raises an `HTTPError` exception if the response's status code indicates a client (`4xx`) or server (`5xx`) error, making it easy to detect failed requests.

**Q6. What is REST?**
Answer: An architectural style for designing APIs, organizing them around resources (URLs) that are acted upon using standard HTTP methods (`GET`, `POST`, `PUT`, `DELETE`, etc.), promoting consistency and predictability.

---

## Practice Questions

**Beginner**
1. Make a `GET` request to a public API (e.g., a random joke API) and print the response.
2. Print the status code of a response and check whether it equals 200.
3. Send a `GET` request with query parameters to any public API of your choice.
4. Write code that catches a `Timeout` exception when making an API request.
5. Convert a Python dictionary to JSON and print it, then parse it back.

**Intermediate**
1. Write a function that takes a GitHub username and prints their number of public repositories using the GitHub API.
2. Write a program that fetches a list of posts from a public test API (like `https://jsonplaceholder.typicode.com/posts`) and prints the titles of the first 5.
3. Write a program that sends a `POST` request with a JSON body to a test API and prints the response.
4. Handle both `ConnectionError` and `HTTPError` separately in an API-calling function, with different messages for each.
5. Write a program that checks if a given username exists on GitHub by checking the response status code.

**Challenge**
1. Build a simple currency converter using a free exchange-rate API.
2. Extend the Weather API mini project to accept multiple cities at once and display a formatted comparison of their temperatures.
3. Write a program that fetches data from a paginated API (one that returns results across multiple "pages") and combines all pages into a single list.
$xx28$, 'markdown',
  jsonb_build_object('source', 'python_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'python_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- ===========================================================================
-- 4. MOCK TESTS + QUESTIONS — one 10-question, 10-minute test per topic.
-- ===========================================================================

-- Intermediate Python — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'advanced-python-tools/intermediate-python')
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-py-intermediate-python', $xx29$Intermediate Python - Quick Test$xx29$, 'aptitude', 10, 10,
  $xx30$10 questions covering iterators/generators, decorators, closures, context managers, @property, and enumerate/zip/any/all/sorted.$xx30$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $xx31$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$xx31$, true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-py-intermediate-python-1', 'pt-py-intermediate-python',
   $xx32$What is the key difference between return and yield?$xx32$,
   $xx33$["No difference", "return ends the function; yield pauses it and remembers state", "yield ends the function; return pauses it", "yield can only be used in classes"]$xx33$::jsonb,
   1, $xx34$return ends the function completely and sends back one value; yield pauses the function and remembers its state so it can resume and produce more values later.$xx34$, 1, 0),
  ('tq-py-intermediate-python-2', 'pt-py-intermediate-python',
   $xx35$Why are generators more memory-efficient than lists for large sequences?$xx35$,
   $xx36$["They compress data", "They produce values one at a time, on demand", "They use less CPU", "They don't support loops"]$xx36$::jsonb,
   1, $xx37$Generators compute and hand back one value at a time as they're iterated, instead of building and storing the entire sequence in memory upfront.$xx37$, 1, 1),
  ('tq-py-intermediate-python-3', 'pt-py-intermediate-python',
   $xx38$What does @my_decorator above a function do?$xx38$,
   $xx39$["Deletes the function", "Is equivalent to function = my_decorator(function)", "Renames the function", "Runs the function twice automatically"]$xx39$::jsonb,
   1, $xx40$Placing @decorator_name above a function is exactly equivalent to writing function = decorator_name(function).$xx40$, 1, 2),
  ('tq-py-intermediate-python-4', 'pt-py-intermediate-python',
   $xx41$What is a closure?$xx41$,
   $xx42$["A function that closes a file", "A function that remembers variables from its enclosing scope", "A syntax error", "A type of loop"]$xx42$::jsonb,
   1, $xx43$A closure is a function that keeps access to variables from the scope it was defined in, even after that outer function has already returned.$xx43$, 1, 3),
  ('tq-py-intermediate-python-5', 'pt-py-intermediate-python',
   $xx44$What does @property allow you to do?$xx44$,
   $xx45$["Make a method run faster", "Access a method like a regular attribute, without parentheses", "Hide a method completely", "Convert a method into a class"]$xx45$::jsonb,
   1, $xx46$@property lets a method be read like a plain attribute, without parentheses, while still running real code behind the scenes.$xx46$, 1, 4),
  ('tq-py-intermediate-python-6', 'pt-py-intermediate-python',
   $xx47$What does enumerate(["a", "b", "c"]) produce when looped over?$xx47$,
   $xx48$["Just the values", "Index-value pairs: (0,'a'), (1,'b'), (2,'c')", "An error", "A dictionary"]$xx48$::jsonb,
   1, $xx49$enumerate() pairs each item with its index, producing (0, 'a'), (1, 'b'), (2, 'c') when looped over.$xx49$, 1, 5),
  ('tq-py-intermediate-python-7', 'pt-py-intermediate-python',
   $xx50$What does zip([1,2], ["a","b"]) produce?$xx50$,
   $xx51$["[1, 2, \"a\", \"b\"]", "[(1,\"a\"), (2,\"b\")]", "An error", "{1:\"a\", 2:\"b\"}"]$xx51$::jsonb,
   1, $xx52$zip() combines corresponding items from multiple sequences into tuples, pairing them up position by position.$xx52$, 1, 6),
  ('tq-py-intermediate-python-8', 'pt-py-intermediate-python',
   $xx53$What does any([False, False, True]) return?$xx53$,
   $xx54$["False", "True", "Error", "None"]$xx54$::jsonb,
   1, $xx55$any() returns True as soon as at least one item in the iterable is truthy — here, the single True is enough.$xx55$, 1, 7),
  ('tq-py-intermediate-python-9', 'pt-py-intermediate-python',
   $xx56$Does sorted() modify the original list?$xx56$,
   $xx57$["Yes, always", "No, it returns a new sorted list", "Only if reverse=True", "Only for tuples"]$xx57$::jsonb,
   1, $xx58$sorted() always returns a brand-new sorted list; it never rearranges the original list in place (use .sort() on a list for that).$xx58$, 1, 8),
  ('tq-py-intermediate-python-10', 'pt-py-intermediate-python',
   $xx59$What must a decorator's inner function include to work with any wrapped function?$xx59$,
   $xx60$["self", "*args, **kwargs", "return None", "A docstring"]$xx60$::jsonb,
   1, $xx61$Without *args, **kwargs in the wrapper function, the decorator would only work with functions that take exactly the arguments the wrapper explicitly lists.$xx61$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-py-intermediate-python' and question_count <> 10;

-- Regular Expressions — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'advanced-python-tools/regular-expressions')
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-py-regular-expressions', $xx62$Regular Expressions - Quick Test$xx62$, 'aptitude', 10, 10,
  $xx63$10 questions covering regex syntax, quantifiers, anchors, groups, and the core re functions.$xx63$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $xx64$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$xx64$, true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-py-regular-expressions-1', 'pt-py-regular-expressions',
   $xx65$What does \d match in a regex pattern?$xx65$,
   $xx66$["Any letter", "Any digit", "Any whitespace", "Any special character"]$xx66$::jsonb,
   1, $xx67$\d matches any single digit character, 0 through 9.$xx67$, 1, 0),
  ('tq-py-regular-expressions-2', 'pt-py-regular-expressions',
   $xx68$What is the difference between re.match() and re.search()?$xx68$,
   $xx69$["No difference", "match() checks only the start of the string; search() checks anywhere", "search() checks only the start; match() checks anywhere", "match() only works with numbers"]$xx69$::jsonb,
   1, $xx70$re.match() only succeeds if the pattern matches starting at position 0; re.search() scans the whole string looking for a match anywhere.$xx70$, 1, 1),
  ('tq-py-regular-expressions-3', 'pt-py-regular-expressions',
   $xx71$What does re.findall() return?$xx71$,
   $xx72$["The first match only", "A list of all matches", "A boolean", "A single string"]$xx72$::jsonb,
   1, $xx73$re.findall() returns every non-overlapping match in the string as a list, not just the first one.$xx73$, 1, 2),
  ('tq-py-regular-expressions-4', 'pt-py-regular-expressions',
   $xx74$What does the quantifier + mean in regex?$xx74$,
   $xx75$["Exactly one", "Zero or more", "One or more", "Zero or one"]$xx75$::jsonb,
   2, $xx76$The + quantifier requires the preceding character or group to appear one or more times.$xx76$, 1, 3),
  ('tq-py-regular-expressions-5', 'pt-py-regular-expressions',
   $xx77$Why should regex patterns be written as raw strings (r"...")?$xx77$,
   $xx78$["They run faster", "To prevent Python from misinterpreting backslashes", "It's required syntax", "It's just a style preference with no real effect"]$xx78$::jsonb,
   1, $xx79$Raw strings (r"...") stop Python from processing backslashes as escape sequences before the regex engine even sees the pattern.$xx79$, 1, 4),
  ('tq-py-regular-expressions-6', 'pt-py-regular-expressions',
   $xx80$What does ^ represent in a regex pattern?$xx80$,
   $xx81$["End of string", "Start of string", "Any character", "A digit"]$xx81$::jsonb,
   1, $xx82$^ anchors a pattern to the start of the string (or line, in multiline mode).$xx82$, 1, 5),
  ('tq-py-regular-expressions-7', 'pt-py-regular-expressions',
   $xx83$What does () create in a regex pattern?$xx83$,
   $xx84$["An optional character", "A capturing group", "A comment", "A syntax error"]$xx84$::jsonb,
   1, $xx85$Parentheses create a capturing group, letting you pull out just that part of a larger match with .group(n).$xx85$, 1, 6),
  ('tq-py-regular-expressions-8', 'pt-py-regular-expressions',
   $xx86$What does \b represent in regex?$xx86$,
   $xx87$["A digit", "A word boundary", "A backslash", "A line break"]$xx87$::jsonb,
   1, $xx88$\b marks a word boundary — the edge between a word character and a non-word character — so a pattern like \bPython\b matches the whole word only.$xx88$, 1, 7),
  ('tq-py-regular-expressions-9', 'pt-py-regular-expressions',
   $xx89$What does re.sub(pattern, replacement, text) do?$xx89$,
   $xx90$["Searches for a pattern only", "Replaces matches of a pattern with new text", "Deletes the entire string", "Splits text into a list"]$xx90$::jsonb,
   1, $xx91$re.sub(pattern, replacement, text) finds every match of the pattern in text and replaces it with the replacement string.$xx91$, 1, 8),
  ('tq-py-regular-expressions-10', 'pt-py-regular-expressions',
   $xx92$What does {n,m} mean in a regex quantifier?$xx92$,
   $xx93$["Exactly n characters", "Between n and m occurrences", "At least m occurrences", "A range of characters"]$xx93$::jsonb,
   1, $xx94${n,m} means the preceding element must repeat somewhere between n and m times, inclusive.$xx94$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-py-regular-expressions' and question_count <> 10;

-- Python Environment & Package Management — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'advanced-python-tools/environment-and-package-management')
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-py-environment-packages', $xx95$Python Environment & Package Management - Quick Test$xx95$, 'aptitude', 10, 10,
  $xx96$10 questions covering pip, virtual environments, requirements.txt, pyproject.toml, and Python version management.$xx96$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $xx97$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$xx97$, true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-py-environment-packages-1', 'pt-py-environment-packages',
   $xx98$What is pip used for?$xx98$,
   $xx99$["Writing Python code", "Installing and managing third-party packages", "Debugging code", "Creating virtual machines"]$xx99$::jsonb,
   1, $xx100$pip is Python's package manager, used to install and manage third-party libraries from PyPI.$xx100$, 1, 0),
  ('tq-py-environment-packages-2', 'pt-py-environment-packages',
   $xx101$What command creates a virtual environment named venv?$xx101$,
   $xx102$["pip create venv", "python -m venv venv", "python venv --create", "pip install venv"]$xx102$::jsonb,
   1, $xx103$python -m venv venv creates a new isolated virtual environment in a folder named venv.$xx103$, 1, 1),
  ('tq-py-environment-packages-3', 'pt-py-environment-packages',
   $xx104$Why are virtual environments important?$xx104$,
   $xx105$["They make code run faster", "They isolate project dependencies from the global Python installation", "They are required to import any module", "They replace the need for pip"]$xx105$::jsonb,
   1, $xx106$Virtual environments isolate each project's installed packages from the global Python installation and from other projects, avoiding version conflicts.$xx106$, 1, 2),
  ('tq-py-environment-packages-4', 'pt-py-environment-packages',
   $xx107$What command generates a requirements.txt file from the current environment?$xx107$,
   $xx108$["pip list > requirements.txt", "pip freeze > requirements.txt", "pip save requirements.txt", "python -m requirements"]$xx108$::jsonb,
   1, $xx109$pip freeze lists every package (and its exact version) currently installed in the active environment, which the > redirects into requirements.txt.$xx109$, 1, 3),
  ('tq-py-environment-packages-5', 'pt-py-environment-packages',
   $xx110$What command installs all packages listed in requirements.txt?$xx110$,
   $xx111$["pip install requirements.txt", "pip install -r requirements.txt", "pip load requirements.txt", "python requirements.txt"]$xx111$::jsonb,
   1, $xx112$The -r flag tells pip to read a requirements file and install every package it lists.$xx112$, 1, 4),
  ('tq-py-environment-packages-6', 'pt-py-environment-packages',
   $xx113$Should the venv folder be committed to Git?$xx113$,
   $xx114$["Yes, always", "No — it should be excluded via .gitignore and recreated from requirements.txt", "Only on Windows", "Only for large projects"]$xx114$::jsonb,
   1, $xx115$The venv folder is machine-specific and can always be recreated from requirements.txt, so it belongs in .gitignore, not in version control.$xx115$, 1, 5),
  ('tq-py-environment-packages-7', 'pt-py-environment-packages',
   $xx116$What is pyproject.toml used for?$xx116$,
   $xx117$["Storing Python bytecode", "A modern, structured file for dependencies, metadata, and build configuration", "Running tests", "Replacing .gitignore"]$xx117$::jsonb,
   1, $xx118$pyproject.toml is the modern, structured configuration file that can hold dependencies, project metadata, and build settings together.$xx118$, 1, 6),
  ('tq-py-environment-packages-8', 'pt-py-environment-packages',
   $xx119$How do you activate a virtual environment on macOS/Linux?$xx119$,
   $xx120$["venv\\Scripts\\activate", "source venv/bin/activate", "activate venv", "python activate venv"]$xx120$::jsonb,
   1, $xx121$source venv/bin/activate runs the activation script in the current shell on macOS/Linux; Windows uses venv\Scripts\activate instead.$xx121$, 1, 7),
  ('tq-py-environment-packages-9', 'pt-py-environment-packages',
   $xx122$What flag should be used with pip install to install a specific version of a package?$xx122$,
   $xx123$["pip install package--version=1.0", "pip install package==1.0", "pip install package -v 1.0", "pip install package:1.0"]$xx123$::jsonb,
   1, $xx124$The == operator pins an exact package version, e.g. pip install package==1.0.$xx124$, 1, 8),
  ('tq-py-environment-packages-10', 'pt-py-environment-packages',
   $xx125$What tool is commonly used to manage multiple Python versions on one machine?$xx125$,
   $xx126$["pip", "venv", "pyenv", "pyproject.toml"]$xx126$::jsonb,
   2, $xx127$pyenv is the common tool for installing and switching between multiple Python interpreter versions on one machine — separate from venv, which manages packages, not interpreter versions.$xx127$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-py-environment-packages' and question_count <> 10;

-- Database Programming — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'advanced-python-tools/database-programming')
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-py-database-programming', $xx128$Database Programming - Quick Test$xx128$, 'aptitude', 10, 10,
  $xx129$10 questions covering SQL fundamentals (CRUD, WHERE, JOIN, GROUP BY), plus sqlite3 and ORMs in Python.$xx129$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $xx130$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$xx130$, true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-py-database-programming-1', 'pt-py-database-programming',
   $xx131$What does CRUD stand for?$xx131$,
   $xx132$["Create, Read, Update, Delete", "Copy, Read, Undo, Delete", "Create, Retrieve, Update, Drop", "Connect, Read, Use, Disconnect"]$xx132$::jsonb,
   0, $xx133$CRUD stands for Create, Read, Update, Delete — the four fundamental data operations.$xx133$, 1, 0),
  ('tq-py-database-programming-2', 'pt-py-database-programming',
   $xx134$What is dangerous about running UPDATE or DELETE without a WHERE clause?$xx134$,
   $xx135$["Nothing, it's safe", "It affects every row in the table", "It only affects the first row", "It causes a syntax error"]$xx135$::jsonb,
   1, $xx136$Without a WHERE clause, UPDATE or DELETE applies to every single row in the table, not just the ones you meant to change.$xx136$, 1, 1),
  ('tq-py-database-programming-3', 'pt-py-database-programming',
   $xx137$What does a primary key guarantee?$xx137$,
   $xx138$["Fast queries only", "Each row is uniquely identifiable", "The table has no columns", "Data is automatically sorted"]$xx138$::jsonb,
   1, $xx139$A primary key guarantees every row can be uniquely identified — no two rows can share the same primary key value.$xx139$, 1, 2),
  ('tq-py-database-programming-4', 'pt-py-database-programming',
   $xx140$What SQL clause is used to combine data from two related tables?$xx140$,
   $xx141$["GROUP BY", "JOIN", "ORDER BY", "WHERE"]$xx141$::jsonb,
   1, $xx142$JOIN combines rows from two related tables based on a shared column, typically a primary key matched against a foreign key.$xx142$, 1, 3),
  ('tq-py-database-programming-5', 'pt-py-database-programming',
   $xx143$What does GROUP BY typically get combined with?$xx143$,
   $xx144$["DELETE", "Aggregate functions like COUNT() or SUM()", "INSERT", "DROP"]$xx144$::jsonb,
   1, $xx145$GROUP BY is almost always paired with an aggregate function like COUNT(), SUM(), or AVG() to summarize each group.$xx145$, 1, 4),
  ('tq-py-database-programming-6', 'pt-py-database-programming',
   $xx146$What Python module provides built-in SQLite support with no installation?$xx146$,
   $xx147$["mysql-connector", "psycopg2", "sqlite3", "sqlalchemy"]$xx147$::jsonb,
   2, $xx148$sqlite3 is part of Python's Standard Library, providing built-in SQLite support with no separate installation needed.$xx148$, 1, 5),
  ('tq-py-database-programming-7', 'pt-py-database-programming',
   $xx149$How do parameterized queries (using ? placeholders) protect against SQL injection?$xx149$,
   $xx150$["They encrypt the database", "They keep user input strictly separate from the SQL command structure", "They make queries run faster", "They disable the WHERE clause"]$xx150$::jsonb,
   1, $xx151$Parameterized queries (using ? placeholders) keep user-supplied values strictly separate from the SQL command's structure, so input can never be interpreted as part of the query itself.$xx151$, 1, 6),
  ('tq-py-database-programming-8', 'pt-py-database-programming',
   $xx152$What does connection.commit() do?$xx152$,
   $xx153$["Deletes the database", "Saves changes (INSERT/UPDATE/DELETE) permanently", "Closes the connection", "Creates a new table"]$xx153$::jsonb,
   1, $xx154$connection.commit() permanently saves any pending INSERT/UPDATE/DELETE changes — without it, those changes are lost when the connection closes.$xx154$, 1, 7),
  ('tq-py-database-programming-9', 'pt-py-database-programming',
   $xx155$What is an ORM?$xx155$,
   $xx156$["A type of database", "A tool that lets you interact with database tables using classes and objects", "A SQL keyword", "A security protocol"]$xx156$::jsonb,
   1, $xx157$An ORM (Object-Relational Mapper) lets you work with database tables through Python classes and objects instead of writing raw SQL by hand.$xx157$, 1, 8),
  ('tq-py-database-programming-10', 'pt-py-database-programming',
   $xx158$What does a transaction guarantee?$xx158$,
   $xx159$["Faster queries", "All operations succeed together, or none take effect at all", "Automatic indexing", "Data is never deleted"]$xx159$::jsonb,
   1, $xx160$A transaction guarantees that a group of operations either all succeed together or none of them take effect at all, keeping data consistent even if something fails partway through.$xx160$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-py-database-programming' and question_count <> 10;

-- APIs & HTTP — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'advanced-python-tools/apis-and-http')
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-py-apis-http', $xx161$APIs & HTTP - Quick Test$xx161$, 'aptitude', 10, 10,
  $xx162$10 questions covering HTTP methods, status codes, REST, authentication, and the requests library.$xx162$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $xx163$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$xx163$, true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-py-apis-http-1', 'pt-py-apis-http',
   $xx164$Which HTTP method is used to retrieve data?$xx164$,
   $xx165$["POST", "GET", "DELETE", "PUT"]$xx165$::jsonb,
   1, $xx166$GET is the HTTP method used to retrieve data without modifying anything on the server.$xx166$, 1, 0),
  ('tq-py-apis-http-2', 'pt-py-apis-http',
   $xx167$What does a 404 status code mean?$xx167$,
   $xx168$["Success", "Server error", "Resource not found", "Unauthorized"]$xx168$::jsonb,
   2, $xx169$A 404 status code means the requested resource could not be found on the server.$xx169$, 1, 1),
  ('tq-py-apis-http-3', 'pt-py-apis-http',
   $xx170$What is the difference between 401 and 403?$xx170$,
   $xx171$["No difference", "401 means not authenticated; 403 means authenticated but not permitted", "403 means not authenticated; 401 means not permitted", "Both mean the same server error"]$xx171$::jsonb,
   1, $xx172$401 means the request has no valid credentials at all; 403 means the client is authenticated but still isn't allowed to access that specific resource.$xx172$, 1, 2),
  ('tq-py-apis-http-4', 'pt-py-apis-http',
   $xx173$What does response.json() do in the requests library?$xx173$,
   $xx174$["Sends a JSON request", "Parses the response body as JSON into a Python object", "Converts the response to a string", "Deletes the response"]$xx174$::jsonb,
   1, $xx175$response.json() parses the response body as JSON and returns it as a native Python object (usually a dict or list).$xx175$, 1, 3),
  ('tq-py-apis-http-5', 'pt-py-apis-http',
   $xx176$What is the difference between PUT and PATCH?$xx176$,
   $xx177$["No difference", "PUT replaces the entire resource; PATCH updates only specific fields", "PATCH replaces the entire resource; PUT updates only specific fields", "PUT is only for images"]$xx177$::jsonb,
   1, $xx178$PUT replaces the entire resource with the new data provided; PATCH updates only the specific fields included in the request.$xx178$, 1, 4),
  ('tq-py-apis-http-6', 'pt-py-apis-http',
   $xx179$What does response.raise_for_status() do?$xx179$,
   $xx180$["Prints the status code", "Raises an exception if the status code indicates an error (4xx/5xx)", "Always raises an exception", "Converts the response to JSON"]$xx180$::jsonb,
   1, $xx181$response.raise_for_status() raises an HTTPError automatically if the status code indicates a client (4xx) or server (5xx) error.$xx181$, 1, 5),
  ('tq-py-apis-http-7', 'pt-py-apis-http',
   $xx182$Why is setting a timeout important in API requests?$xx182$,
   $xx183$["It's required syntax", "It prevents the program from hanging indefinitely on an unresponsive server", "It speeds up the server", "It encrypts the request"]$xx183$::jsonb,
   1, $xx184$Without a timeout, a request can hang indefinitely if the server never responds, potentially freezing the whole program.$xx184$, 1, 6),
  ('tq-py-apis-http-8', 'pt-py-apis-http',
   $xx185$What does REST stand for?$xx185$,
   $xx186$["Rapid External State Transfer", "Representational State Transfer", "Remote State Transfer", "Reliable Endpoint State Transfer"]$xx186$::jsonb,
   1, $xx187$REST stands for Representational State Transfer, an architectural style for designing predictable, resource-based APIs.$xx187$, 1, 7),
  ('tq-py-apis-http-9', 'pt-py-apis-http',
   $xx188$Which header is commonly used to send an API key or token?$xx188$,
   $xx189$["Content-Type", "Authorization", "Accept", "User-Agent"]$xx189$::jsonb,
   1, $xx190$The Authorization header is the standard place to send credentials like an API key or a bearer token.$xx190$, 1, 8),
  ('tq-py-apis-http-10', 'pt-py-apis-http',
   $xx191$What status code typically indicates a resource was successfully created?$xx191$,
   $xx192$["200", "201", "204", "301"]$xx192$::jsonb,
   1, $xx193$A 201 status code means the request succeeded and a new resource was created as a result.$xx193$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-py-apis-http' and question_count <> 10;

-- ===========================================================================
-- 5. CODING PROBLEMS — up to 4 Python-only problems per topic (topic_id NULL,
--    global slug). environment_packages has none (see note above). Skips a
--    slug already taken by any existing row (e.g. an admin's).
-- ===========================================================================

-- Intermediate Python — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'advanced-python-tools/intermediate-python')
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-py-intermediate-python-1', null::text, $xx196$Even Number Generator$xx196$, 'Easy', 'py-intermediate-python-even-number-generator',
   $xx197$Write a generator function even_numbers(limit) that yields every even number from 2 up to limit, then print all the values it produces.

**What the problem means:** instead of building a full list of even numbers up front, yield each one lazily — this is the core generator pattern from this topic.

**Approach:** use yield inside a loop from 2 to limit (inclusive), stepping by 2, then join the generated values into one comma-separated line.

**Input:** One line: limit, a whole number.

**Output:** One line: the even numbers from 2 up to limit, comma-and-space separated.$xx197$,
   $xx198$[{"input": "10", "output": "2, 4, 6, 8, 10"}]$xx198$::jsonb,
   $xx199$["2 <= limit <= 1000"]$xx199$::jsonb,
   jsonb_build_object('python', $xx194$def even_numbers(limit):
    # yield each even number from 2 up to limit
    pass

limit = int(input())
print(", ".join(str(x) for x in even_numbers(limit)))
$xx194$),
   $xx200$["Loop i from 2 to limit (inclusive), stepping by 2, and yield i each time.", "range(2, limit + 1, 2) already produces exactly the even numbers you need — loop over it and yield each value.", "\", \".join(...) turns the generated values into the required comma-separated line."]$xx200$::jsonb,
   $xx201$[{"input": "10", "expected": "2, 4, 6, 8, 10", "hidden": false}, {"input": "4", "expected": "2, 4", "hidden": true}]$xx201$::jsonb,
   $xx202$even_numbers(limit) loops from 2 to limit in steps of 2 (range(2, limit + 1, 2)), yielding each value instead of returning a list — the values are produced lazily, one at a time, exactly like the count_up_to example in the notes. ", ".join(str(x) for x in even_numbers(limit)) then consumes the generator to build the final line.$xx202$,
   jsonb_build_object('python', $xx195$def even_numbers(limit):
    for i in range(2, limit + 1, 2):
        yield i

limit = int(input())
print(", ".join(str(x) for x in even_numbers(limit)))
$xx195$),
   array['python'], 'published', false, 0),
  ('cp-py-intermediate-python-2', null::text, $xx205$Call Counter Decorator$xx205$, 'Medium', 'py-intermediate-python-call-counter-decorator',
   $xx206$Write a decorator @count_calls that tracks and prints how many times the function it wraps has been called, then apply it to a function that greets someone.

**Why not a timing decorator?** measuring and printing actual elapsed time produces a different number on every run, so it can never be checked by an automated judge against one exact expected output. Counting calls tests exactly the same decorator mechanics (wrapping, *args/**kwargs, calling the original function, returning its result) in a way that's fully deterministic.

**Approach:** the decorator keeps a counter in its enclosing scope (a closure), increments it and prints a message on every call, then calls through to the original function.

**Input:** Two lines: how many times to call the function, then the name to greet.

**Output:** For each call: a `Call <n> to greet` line, followed by the greeting itself.$xx206$,
   $xx207$[{"input": "3\nAditi", "output": "Call 1 to greet\nHello, Aditi!\nCall 2 to greet\nHello, Aditi!\nCall 3 to greet\nHello, Aditi!"}]$xx207$::jsonb,
   $xx208$["1 <= number of calls <= 100"]$xx208$::jsonb,
   jsonb_build_object('python', $xx203$def count_calls(func):
    counter = {"count": 0}
    def wrapper(*args, **kwargs):
        # increment counter, print "Call <n> to <func name>", then call func and return its result
        pass
    return wrapper

@count_calls
def greet(name):
    print(f"Hello, {name}!")

n = int(input())
name = input()
for _ in range(n):
    greet(name)
$xx203$),
   $xx209$["A dictionary (or a nonlocal variable) inside count_calls lets the wrapper remember the count between calls — this is the closure at work.", "func.__name__ gives you the wrapped function's name as a string.", "Don't forget to actually call func(*args, **kwargs) and return its result from wrapper — a decorator that forgets this breaks the function it wraps."]$xx209$::jsonb,
   $xx210$[{"input": "3\nAditi", "expected": "Call 1 to greet\nHello, Aditi!\nCall 2 to greet\nHello, Aditi!\nCall 3 to greet\nHello, Aditi!", "hidden": false}, {"input": "1\nRohan", "expected": "Call 1 to greet\nHello, Rohan!", "hidden": true}]$xx210$::jsonb,
   $xx211$count_calls keeps a counter dictionary alive across calls via closure — the wrapper function increments it, prints the call number and function name, then calls through to the original greet(*args, **kwargs) so its own behavior (and return value) is preserved. Every call to the decorated greet() therefore prints one extra 'Call N to greet' line before the greeting itself.$xx211$,
   jsonb_build_object('python', $xx204$def count_calls(func):
    counter = {"count": 0}
    def wrapper(*args, **kwargs):
        counter["count"] += 1
        print(f"Call {counter['count']} to {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

@count_calls
def greet(name):
    print(f"Hello, {name}!")

n = int(input())
name = input()
for _ in range(n):
    greet(name)
$xx204$),
   array['python'], 'published', false, 1),
  ('cp-py-intermediate-python-3', null::text, $xx214$Temperature Property Class$xx214$, 'Easy', 'py-intermediate-python-temperature-property-class',
   $xx215$Create a Temperature class with a celsius attribute and a fahrenheit property that automatically calculates Fahrenheit from the stored Celsius value.

**What the problem means:** fahrenheit shouldn't be stored separately — it should always be computed live from celsius, and accessed like a plain attribute (no parentheses).

**Approach:** store celsius directly in __init__; define fahrenheit as a method decorated with @property that returns celsius * 9/5 + 32.

**Input:** One line: a Celsius temperature.

**Output:** One line: the Fahrenheit equivalent.$xx215$,
   $xx216$[{"input": "25", "output": "77.0"}]$xx216$::jsonb,
   $xx217$["-273.15 <= celsius <= 1000"]$xx217$::jsonb,
   jsonb_build_object('python', $xx212$class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius

    @property
    def fahrenheit(self):
        # compute Fahrenheit from self.celsius
        pass

c = float(input())
print(Temperature(c).fahrenheit)
$xx212$),
   $xx218$["The formula is F = C * 9/5 + 32.", "@property above fahrenheit means it's accessed as Temperature(c).fahrenheit — no parentheses after fahrenheit."]$xx218$::jsonb,
   $xx219$[{"input": "25", "expected": "77.0", "hidden": false}, {"input": "0", "expected": "32.0", "hidden": true}]$xx219$::jsonb,
   $xx220$@property turns fahrenheit into something read like a plain attribute rather than a method call. Its body just applies the standard conversion formula to self.celsius every time it's accessed, so the Fahrenheit value is always in sync with whatever celsius currently holds.$xx220$,
   jsonb_build_object('python', $xx213$class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius

    @property
    def fahrenheit(self):
        return self.celsius * 9 / 5 + 32

c = float(input())
print(Temperature(c).fahrenheit)
$xx213$),
   array['python'], 'published', false, 2),
  ('cp-py-intermediate-python-4', null::text, $xx223$Sort Students by Marks$xx223$, 'Easy', 'py-intermediate-python-sort-students-by-marks',
   $xx224$Given a list of (name, marks) pairs, use sorted() with a key and lambda to sort students by marks in descending order.

**Approach:** read each student as a name and a mark, build a list of tuples, then call sorted(..., key=lambda s: s[1], reverse=True).

**Input:** First line: the number of students n. Next n lines: `name marks`, space-separated.

**Output:** One line: the students sorted by marks descending, printed as a Python list of tuples.$xx224$,
   $xx225$[{"input": "3\nAditi 85\nRohan 92\nZara 78", "output": "[('Rohan', 92), ('Aditi', 85), ('Zara', 78)]"}]$xx225$::jsonb,
   $xx226$["1 <= n <= 1000"]$xx226$::jsonb,
   jsonb_build_object('python', $xx221$n = int(input())
students = []
for _ in range(n):
    name, marks = input().split()
    students.append((name, int(marks)))

# sort students by marks, highest first, and print the result
$xx221$),
   $xx227$["key=lambda s: s[1] tells sorted() to compare by the second item of each tuple (the marks).", "reverse=True sorts from highest to lowest instead of the default ascending order."]$xx227$::jsonb,
   $xx228$[{"input": "3\nAditi 85\nRohan 92\nZara 78", "expected": "[('Rohan', 92), ('Aditi', 85), ('Zara', 78)]", "hidden": false}, {"input": "2\nA 50\nB 50", "expected": "[('A', 50), ('B', 50)]", "hidden": true}]$xx228$::jsonb,
   $xx229$sorted(students, key=lambda s: s[1], reverse=True) tells Python to compare tuples by their second element (marks) rather than the tuple as a whole, and reverse=True flips the order to descending. Equal marks keep their original relative order, since Python's sort is stable.$xx229$,
   jsonb_build_object('python', $xx222$n = int(input())
students = []
for _ in range(n):
    name, marks = input().split()
    students.append((name, int(marks)))
result = sorted(students, key=lambda s: s[1], reverse=True)
print(result)
$xx222$),
   array['python'], 'published', false, 3)
) as v(id, topic_id, title, difficulty, slug, description,
       examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
       supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- Regular Expressions — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'advanced-python-tools/regular-expressions')
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-py-regular-expressions-1', null::text, $xx232$Email Extractor$xx232$, 'Medium', 'py-regular-expressions-email-extractor',
   $xx233$Given a line of text containing several email addresses, use re.findall() to extract all of them.

**Approach:** the pattern [\w.-]+@[\w.-]+\.\w+ matches the username part, the @, the domain, and the extension.

**Input:** One line: a sentence containing zero or more email addresses.

**Output:** One line: every email address found, printed as a Python list, in the order they appear.$xx233$,
   $xx234$[{"input": "Contact aditi@test.com or support@company.org for help", "output": "['aditi@test.com', 'support@company.org']"}]$xx234$::jsonb,
   $xx235$["1 <= length of text <= 1000"]$xx235$::jsonb,
   jsonb_build_object('python', $xx230$import re

text = input()

# use re.findall() with an email pattern and print the result
$xx230$),
   $xx236$["[\\w.-]+ matches one or more letters/digits/dots/hyphens — useful for both the username and the domain part.", "The full pattern is r\"[\\w.-]+@[\\w.-]+\\.\\w+\".", "re.findall() already returns a list, ready to print directly."]$xx236$::jsonb,
   $xx237$[{"input": "Contact aditi@test.com or support@company.org for help", "expected": "['aditi@test.com', 'support@company.org']", "hidden": false}, {"input": "No emails here", "expected": "[]", "hidden": true}]$xx237$::jsonb,
   $xx238$The pattern [\w.-]+@[\w.-]+\.\w+ matches: one or more "word" characters/dots/hyphens (the username), an @, another run of word characters/dots/hyphens (the domain), a literal dot, and a final run of word characters (the extension). re.findall() returns every non-overlapping match as a list, in the order they appear in the text.$xx238$,
   jsonb_build_object('python', $xx231$import re

text = input()
emails = re.findall(r"[\w.-]+@[\w.-]+\.\w+", text)
print(emails)
$xx231$),
   array['python'], 'published', false, 0),
  ('cp-py-regular-expressions-2', null::text, $xx241$Phone Number Validator$xx241$, 'Easy', 'py-regular-expressions-phone-number-validator',
   $xx242$Write a function is_valid_phone(number) that returns True if the input is exactly 10 digits, False otherwise.

**Approach:** anchor the pattern to both the start and end of the string with ^ and $ so partial matches don't count.

**Input:** One line: a phone number as text.

**Output:** One line: True or False.$xx242$,
   $xx243$[{"input": "9876543210", "output": "True"}]$xx243$::jsonb,
   $xx244$["1 <= length <= 20"]$xx244$::jsonb,
   jsonb_build_object('python', $xx239$import re

def is_valid_phone(number):
    # return True only if number is exactly 10 digits
    pass

number = input()
print(is_valid_phone(number))
$xx239$),
   $xx245$["^\\d{10}$ requires exactly 10 digits, from the very start to the very end of the string.", "Without ^ and $, the pattern could match just a 10-digit substring inside a longer string — the anchors make sure the WHOLE string is exactly 10 digits."]$xx245$::jsonb,
   $xx246$[{"input": "9876543210", "expected": "True", "hidden": false}, {"input": "98765", "expected": "False", "hidden": true}]$xx246$::jsonb,
   $xx247$^\d{10}$ anchors the digit-count check to the entire string: ^ pins it to the start, {10} requires exactly ten digits, and $ pins it to the end — so a string with extra characters before or after ten digits, or fewer than ten digits, won't match.$xx247$,
   jsonb_build_object('python', $xx240$import re

def is_valid_phone(number):
    return bool(re.match(r"^\d{10}$", number))

number = input()
print(is_valid_phone(number))
$xx240$),
   array['python'], 'published', false, 1),
  ('cp-py-regular-expressions-3', null::text, $xx250$Password Strength Validator$xx250$, 'Medium', 'py-regular-expressions-password-strength-validator',
   $xx251$Write a function that validates a password requires at least 8 characters, one uppercase letter, one digit, and one special character (!@#$%^&*), using regex.

**Approach:** run four independent checks — a plain length check, plus three separate regex searches — and require all four to pass.

**Input:** One line: a password.

**Output:** One line: True or False.$xx251$,
   $xx252$[{"input": "Python@123", "output": "True"}]$xx252$::jsonb,
   $xx253$["1 <= length <= 100"]$xx253$::jsonb,
   jsonb_build_object('python', $xx248$import re

def is_strong_password(password):
    has_length = len(password) >= 8
    has_upper = bool(re.search(r"[A-Z]", password))
    has_digit = bool(re.search(r"\d", password))
    has_special = bool(re.search(r"[!@#$%^&*]", password))
    # combine all four checks
    pass

password = input()
print(is_strong_password(password))
$xx248$),
   $xx254$["re.search(r\"[A-Z]\", password) finds an uppercase letter anywhere in the string.", "A character class like [!@#$%^&*] matches any ONE of the listed special characters.", "The password is only strong if ALL FOUR checks are True at once — combine them with and."]$xx254$::jsonb,
   $xx255$[{"input": "Python@123", "expected": "True", "hidden": false}, {"input": "weakpass", "expected": "False", "hidden": true}]$xx255$::jsonb,
   $xx256$Four independent checks cover each requirement: len(password) >= 8 for length, and three re.search() calls for an uppercase letter ([A-Z]), a digit (\d), and a special character ([!@#$%^&*]). bool(...) turns each search result (a Match object or None) into True/False, and the password only counts as strong when all four are True.$xx256$,
   jsonb_build_object('python', $xx249$import re

def is_strong_password(password):
    has_length = len(password) >= 8
    has_upper = bool(re.search(r"[A-Z]", password))
    has_digit = bool(re.search(r"\d", password))
    has_special = bool(re.search(r"[!@#$%^&*]", password))
    return has_length and has_upper and has_digit and has_special

password = input()
print(is_strong_password(password))
$xx249$),
   array['python'], 'published', false, 2),
  ('cp-py-regular-expressions-4', null::text, $xx259$Hashtag Extractor$xx259$, 'Easy', 'py-regular-expressions-hashtag-extractor',
   $xx260$Given a social media post, extract all hashtags (words starting with #) using regex.

**Approach:** the pattern #\w+ matches a # immediately followed by one or more word characters.

**Input:** One line: a post, possibly containing hashtags.

**Output:** One line: every hashtag found, printed as a Python list, in order.$xx260$,
   $xx261$[{"input": "Loving #python and #coding today!", "output": "['#python', '#coding']"}]$xx261$::jsonb,
   $xx262$["1 <= length <= 1000"]$xx262$::jsonb,
   jsonb_build_object('python', $xx257$import re

text = input()

# use re.findall() with a hashtag pattern and print the result
$xx257$),
   $xx263$["#\\w+ matches a literal # followed by one or more word characters.", "re.findall() collects every match into a list automatically."]$xx263$::jsonb,
   $xx264$[{"input": "Loving #python and #coding today!", "expected": "['#python', '#coding']", "hidden": false}, {"input": "No hashtags here", "expected": "[]", "hidden": true}]$xx264$::jsonb,
   $xx265$#\w+ matches a literal # immediately followed by one or more word characters (letters, digits, underscore) — exactly a hashtag. re.findall() returns every such match in the text as a list, in the order they appear.$xx265$,
   jsonb_build_object('python', $xx258$import re

text = input()
hashtags = re.findall(r"#\w+", text)
print(hashtags)
$xx258$),
   array['python'], 'published', false, 3)
) as v(id, topic_id, title, difficulty, slug, description,
       examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
       supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- Python Environment & Package Management — no coding problems (topic is CLI/tooling-focused, not code-execution-focused; see header note)

-- Database Programming — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'advanced-python-tools/database-programming')
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-py-database-programming-1', null::text, $xx268$Products Table CRUD$xx268$, 'Easy', 'py-database-programming-products-table-crud',
   $xx269$Using sqlite3, create a products table (id, name, price), insert the given products, then query and print all of them.

**Approach:** connect to an in-memory SQLite database, CREATE TABLE, INSERT each product with a parameterized query, then SELECT * (ordered by id for a predictable order) and print each row.

**Input:** First line: the number of products n. Next n lines: `name,price`.

**Output:** n lines: each product as a tuple `(id, name, price)`.$xx269$,
   $xx270$[{"input": "3\nPen,10\nNotebook,50\nBag,500", "output": "(1, 'Pen', 10.0)\n(2, 'Notebook', 50.0)\n(3, 'Bag', 500.0)"}]$xx270$::jsonb,
   $xx271$["1 <= n <= 100"]$xx271$::jsonb,
   jsonb_build_object('python', $xx266$import sqlite3

n = int(input())
products = []
for _ in range(n):
    name, price = input().split(",")
    products.append((name, float(price)))

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, price REAL)")

# insert every product with a parameterized query, then select and print all rows (ordered by id)
$xx266$),
   $xx272$["conn.execute(\"INSERT INTO products (name, price) VALUES (?, ?)\", (name, price)) is the safe, parameterized way to insert.", "Don't forget conn.commit() after inserting.", "conn.execute(\"SELECT id, name, price FROM products ORDER BY id\").fetchall() returns every row as a list of tuples, in a predictable order — print each one."]$xx272$::jsonb,
   $xx273$[{"input": "3\nPen,10\nNotebook,50\nBag,500", "expected": "(1, 'Pen', 10.0)\n(2, 'Notebook', 50.0)\n(3, 'Bag', 500.0)", "hidden": false}]$xx273$::jsonb,
   $xx274$Each product is inserted with a parameterized INSERT (name, price as ? placeholders), then committed. SELECT id, name, price FROM products ORDER BY id retrieves every row in a predictable, insertion-matching order — printing each tuple from fetchall() gives exactly the required output.$xx274$,
   jsonb_build_object('python', $xx267$import sqlite3

n = int(input())
products = []
for _ in range(n):
    name, price = input().split(",")
    products.append((name, float(price)))

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, price REAL)")
for name, price in products:
    conn.execute("INSERT INTO products (name, price) VALUES (?, ?)", (name, price))
conn.commit()

rows = conn.execute("SELECT id, name, price FROM products ORDER BY id").fetchall()
for row in rows:
    print(row)
$xx267$),
   array['python'], 'published', false, 0),
  ('cp-py-database-programming-2', null::text, $xx277$Update and Delete by ID$xx277$, 'Medium', 'py-database-programming-update-and-delete-by-id',
   $xx278$Write functions update_price(product_id, new_price) and delete_product(product_id) using parameterized queries, then apply one update and one delete to a products table and print what's left.

**Approach:** build the products table as in the previous problem, run an UPDATE ... WHERE id = ? and a DELETE ... WHERE id = ?, then select and print the remaining rows.

**Input:** First line: the number of products n. Next n lines: `name,price`. Then: the id to update, the new price, and the id to delete.

**Output:** The remaining rows (after the update and the delete), each as a tuple `(id, name, price)`.$xx278$,
   $xx279$[{"input": "3\nPen,10\nNotebook,50\nBag,500\n2\n599\n1", "output": "(2, 'Notebook', 599.0)\n(3, 'Bag', 500.0)"}]$xx279$::jsonb,
   $xx280$["1 <= n <= 100"]$xx280$::jsonb,
   jsonb_build_object('python', $xx275$import sqlite3

n = int(input())
products = []
for _ in range(n):
    name, price = input().split(",")
    products.append((name, float(price)))
update_id = int(input())
new_price = float(input())
delete_id = int(input())

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, price REAL)")
for name, price in products:
    conn.execute("INSERT INTO products (name, price) VALUES (?, ?)", (name, price))
conn.commit()

def update_price(product_id, price):
    # UPDATE ... WHERE id = ?
    pass

def delete_product(product_id):
    # DELETE ... WHERE id = ?
    pass

update_price(update_id, new_price)
delete_product(delete_id)

rows = conn.execute("SELECT id, name, price FROM products ORDER BY id").fetchall()
for row in rows:
    print(row)
$xx275$),
   $xx281$["update_price should run UPDATE products SET price = ? WHERE id = ?, then commit.", "delete_product should run DELETE FROM products WHERE id = ?, then commit.", "Always filter with WHERE id = ? — without it, every row would be changed or removed."]$xx281$::jsonb,
   $xx282$[{"input": "3\nPen,10\nNotebook,50\nBag,500\n2\n599\n1", "expected": "(2, 'Notebook', 599.0)\n(3, 'Bag', 500.0)", "hidden": false}]$xx282$::jsonb,
   $xx283$update_price runs UPDATE products SET price = ? WHERE id = ? with the new price and target id as parameters, committing afterward. delete_product runs DELETE FROM products WHERE id = ? the same way. Both rely on the WHERE clause to target exactly one row — omitting it would affect the whole table.$xx283$,
   jsonb_build_object('python', $xx276$import sqlite3

n = int(input())
products = []
for _ in range(n):
    name, price = input().split(",")
    products.append((name, float(price)))
update_id = int(input())
new_price = float(input())
delete_id = int(input())

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, price REAL)")
for name, price in products:
    conn.execute("INSERT INTO products (name, price) VALUES (?, ?)", (name, price))
conn.commit()

def update_price(product_id, price):
    conn.execute("UPDATE products SET price = ? WHERE id = ?", (price, product_id))
    conn.commit()

def delete_product(product_id):
    conn.execute("DELETE FROM products WHERE id = ?", (product_id,))
    conn.commit()

update_price(update_id, new_price)
delete_product(delete_id)

rows = conn.execute("SELECT id, name, price FROM products ORDER BY id").fetchall()
for row in rows:
    print(row)
$xx276$),
   array['python'], 'published', false, 1),
  ('cp-py-database-programming-3', null::text, $xx286$Group and Count by Category$xx286$, 'Medium', 'py-database-programming-group-and-count-by-category',
   $xx287$Given a list of students with their course, write a query using GROUP BY to count how many students are enrolled in each course.

**Approach:** insert every student into a table, then SELECT course, COUNT(*) FROM students GROUP BY course, ordered by course name for a predictable result.

**Input:** First line: the number of students n. Next n lines: `name,course`.

**Output:** One line per course: a tuple `(course, count)`, ordered alphabetically by course.$xx287$,
   $xx288$[{"input": "5\nAditi,CS\nRohan,AI\nZara,CS\nKaran,AI\nMeera,CS", "output": "('AI', 2)\n('CS', 3)"}]$xx288$::jsonb,
   $xx289$["1 <= n <= 1000"]$xx289$::jsonb,
   jsonb_build_object('python', $xx284$import sqlite3

n = int(input())
students = []
for _ in range(n):
    name, course = input().split(",")
    students.append((name, course))

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE students (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, course TEXT)")
for name, course in students:
    conn.execute("INSERT INTO students (name, course) VALUES (?, ?)", (name, course))
conn.commit()

# GROUP BY course, print each (course, count) ordered by course
$xx284$),
   $xx290$["SELECT course, COUNT(*) FROM students GROUP BY course counts how many rows share each course value.", "Add ORDER BY course so the result order is always the same, regardless of insertion order."]$xx290$::jsonb,
   $xx291$[{"input": "5\nAditi,CS\nRohan,AI\nZara,CS\nKaran,AI\nMeera,CS", "expected": "('AI', 2)\n('CS', 3)", "hidden": false}]$xx291$::jsonb,
   $xx292$GROUP BY course collapses all rows sharing the same course value into one group per course, and COUNT(*) counts how many rows fell into each group. Adding ORDER BY course guarantees a consistent, alphabetical output order regardless of the order students were inserted in.$xx292$,
   jsonb_build_object('python', $xx285$import sqlite3

n = int(input())
students = []
for _ in range(n):
    name, course = input().split(",")
    students.append((name, course))

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE students (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, course TEXT)")
for name, course in students:
    conn.execute("INSERT INTO students (name, course) VALUES (?, ?)", (name, course))
conn.commit()

rows = conn.execute("SELECT course, COUNT(*) FROM students GROUP BY course ORDER BY course").fetchall()
for row in rows:
    print(row)
$xx285$),
   array['python'], 'published', false, 2),
  ('cp-py-database-programming-4', null::text, $xx295$Join Students and Enrollments$xx295$, 'Medium', 'py-database-programming-join-students-and-enrollments',
   $xx296$Given a students table and an enrollments table linked by student_id, write a query using INNER JOIN to display each student's name alongside their enrolled course.

**Approach:** create both tables, insert the given rows, then JOIN students to enrollments by matching students.id to enrollments.student_id.

**Input:** First line: the number of students n. Next n lines: `id,name`. Then: the number of enrollments m. Next m lines: `student_id,course`.

**Output:** One line per matched enrollment: a tuple `(name, course)`, ordered by student id.$xx296$,
   $xx297$[{"input": "2\n1,Aditi\n2,Rohan\n2\n1,Computer Science\n2,Data Science", "output": "('Aditi', 'Computer Science')\n('Rohan', 'Data Science')"}]$xx297$::jsonb,
   $xx298$["1 <= n, m <= 1000"]$xx298$::jsonb,
   jsonb_build_object('python', $xx293$import sqlite3

n = int(input())
students = []
for _ in range(n):
    sid, name = input().split(",")
    students.append((int(sid), name))
m = int(input())
enrollments = []
for _ in range(m):
    sid, course = input().split(",")
    enrollments.append((int(sid), course))

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT)")
conn.execute("CREATE TABLE enrollments (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, course TEXT)")
for sid, name in students:
    conn.execute("INSERT INTO students (id, name) VALUES (?, ?)", (sid, name))
for sid, course in enrollments:
    conn.execute("INSERT INTO enrollments (student_id, course) VALUES (?, ?)", (sid, course))
conn.commit()

# INNER JOIN students to enrollments on id = student_id, print (name, course) ordered by student id
$xx293$),
   $xx299$["INNER JOIN enrollments ON students.id = enrollments.student_id links each student to their matching enrollment row(s).", "SELECT students.name, enrollments.course picks just the two columns you need from the joined result.", "Add ORDER BY students.id for a predictable, repeatable row order."]$xx299$::jsonb,
   $xx300$[{"input": "2\n1,Aditi\n2,Rohan\n2\n1,Computer Science\n2,Data Science", "expected": "('Aditi', 'Computer Science')\n('Rohan', 'Data Science')", "hidden": false}]$xx300$::jsonb,
   $xx301$INNER JOIN enrollments ON students.id = enrollments.student_id lines up every enrollment with its matching student by comparing the two id columns, and SELECT students.name, enrollments.course pulls out just the pair you need from each matched row. ORDER BY students.id keeps the result order predictable and matched to input order.$xx301$,
   jsonb_build_object('python', $xx294$import sqlite3

n = int(input())
students = []
for _ in range(n):
    sid, name = input().split(",")
    students.append((int(sid), name))
m = int(input())
enrollments = []
for _ in range(m):
    sid, course = input().split(",")
    enrollments.append((int(sid), course))

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT)")
conn.execute("CREATE TABLE enrollments (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, course TEXT)")
for sid, name in students:
    conn.execute("INSERT INTO students (id, name) VALUES (?, ?)", (sid, name))
for sid, course in enrollments:
    conn.execute("INSERT INTO enrollments (student_id, course) VALUES (?, ?)", (sid, course))
conn.commit()

rows = conn.execute("""
    SELECT students.name, enrollments.course
    FROM students
    INNER JOIN enrollments ON students.id = enrollments.student_id
    ORDER BY students.id
""").fetchall()
for row in rows:
    print(row)
$xx294$),
   array['python'], 'published', false, 3)
) as v(id, topic_id, title, difficulty, slug, description,
       examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
       supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- APIs & HTTP — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'advanced-python-tools/apis-and-http')
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-py-apis-http-1', null::text, $xx304$Parse a GitHub-Style API Response$xx304$, 'Easy', 'py-apis-http-parse-github-style-response',
   $xx305$Given a JSON string that represents what a GitHub API response would look like (i.e. what response.json() would return), parse it and print the user's public repo count.

**Why not a real network call?** an automated judge can't reliably reach the internet, and even if it could, a live API's data changes over time — so this exercises the exact same skill (reading fields out of a parsed JSON API response) using a fixed, given response instead of a live one.

**Approach:** json.loads() parses the JSON string into a Python dict, exactly like response.json() would; then read the field you need.

**Input:** One line: a JSON object (as text) with at least a public_repos field.

**Output:** One line: the value of public_repos.$xx305$,
   $xx306$[{"input": "{\"login\": \"octocat\", \"public_repos\": 8}", "output": "8"}]$xx306$::jsonb,
   $xx307$["The input is always valid JSON with a public_repos field."]$xx307$::jsonb,
   jsonb_build_object('python', $xx302$import json

raw = input()

# parse raw as JSON, then print data["public_repos"]
$xx302$),
   $xx308$["json.loads(text) converts a JSON string into a Python dict, the same shape response.json() would give you from a real API call.", "Once parsed, reading a field is just normal dictionary access: data[\"public_repos\"]."]$xx308$::jsonb,
   $xx309$[{"input": "{\"login\": \"octocat\", \"public_repos\": 8}", "expected": "8", "hidden": false}, {"input": "{\"login\": \"aditi21\", \"public_repos\": 42}", "expected": "42", "hidden": true}]$xx309$::jsonb,
   $xx310$json.loads(raw) parses the given JSON text into a Python dict exactly the way response.json() would after a real GitHub API call — the rest of the problem is just ordinary dictionary field access, data["public_repos"].$xx310$,
   jsonb_build_object('python', $xx303$import json

raw = input()
data = json.loads(raw)
print(data["public_repos"])
$xx303$),
   array['python'], 'published', false, 0),
  ('cp-py-apis-http-2', null::text, $xx313$Status Code Classifier$xx313$, 'Easy', 'py-apis-http-status-code-classifier',
   $xx314$Write a function that classifies an HTTP status code into its category — Informational, Success, Redirection, Client Error, or Server Error — based on its numeric range.

**What the problem means:** every HTTP status code falls into one of five ranges (1xx-5xx); this checks you understand what each range means, independent of any specific request.

**Approach:** compare the code against the five ranges from the notes (1xx, 2xx, 3xx, 4xx, 5xx) and return the matching category name.

**Input:** One line: a 3-digit HTTP status code.

**Output:** One line: Informational, Success, Redirection, Client Error, or Server Error.$xx314$,
   $xx315$[{"input": "404", "output": "Client Error"}]$xx315$::jsonb,
   $xx316$["100 <= code <= 599"]$xx316$::jsonb,
   jsonb_build_object('python', $xx311$def classify_status(code):
    # return the correct category name for this status code
    pass

code = int(input())
print(classify_status(code))
$xx311$),
   $xx317$["1xx = Informational, 2xx = Success, 3xx = Redirection, 4xx = Client Error, 5xx = Server Error.", "Range comparisons work well: e.g. 200 <= code < 300 checks the 2xx range."]$xx317$::jsonb,
   $xx318$[{"input": "404", "expected": "Client Error", "hidden": false}, {"input": "200", "expected": "Success", "hidden": true}, {"input": "500", "expected": "Server Error", "hidden": true}]$xx318$::jsonb,
   $xx319$Each HTTP status range maps to one category: 100-199 Informational, 200-299 Success, 300-399 Redirection, 400-499 Client Error, 500-599 Server Error. A chain of range checks (100 <= code < 200, 200 <= code < 300, ...) picks the matching category directly from the notes' status-code table.$xx319$,
   jsonb_build_object('python', $xx312$def classify_status(code):
    if 100 <= code < 200:
        return "Informational"
    elif 200 <= code < 300:
        return "Success"
    elif 300 <= code < 400:
        return "Redirection"
    elif 400 <= code < 500:
        return "Client Error"
    elif 500 <= code < 600:
        return "Server Error"
    return "Unknown"

code = int(input())
print(classify_status(code))
$xx312$),
   array['python'], 'published', false, 1),
  ('cp-py-apis-http-3', null::text, $xx322$Build a REST URL$xx322$, 'Medium', 'py-apis-http-build-a-rest-url',
   $xx323$Given an HTTP method, a resource name, and (optionally) an ID, construct the correct RESTful URL path following standard REST conventions.

**Approach:** if an ID is given, the path is `METHOD /resource/id`; if not (the id is the literal text None), the path is just `METHOD /resource`.

**Input:** Three lines: the HTTP method, the resource name, and the id (or the literal text None if there isn't one).

**Output:** One line: the constructed REST path, e.g. `GET /students/5`.$xx323$,
   $xx324$[{"input": "GET\nstudents\n5", "output": "GET /students/5"}]$xx324$::jsonb,
   $xx325$["method is one of GET, POST, PUT, PATCH, DELETE."]$xx325$::jsonb,
   jsonb_build_object('python', $xx320$method = input().strip()
resource = input().strip()
resource_id = input().strip()

# print "<method> /<resource>" if resource_id is "None", otherwise "<method> /<resource>/<resource_id>"
$xx320$),
   $xx326$["A GET on a whole collection (like listing all students) has no id — just METHOD /resource.", "A GET/PUT/DELETE on ONE specific item includes its id — METHOD /resource/id.", "Check resource_id == \"None\" to decide which format to print."]$xx326$::jsonb,
   $xx327$[{"input": "GET\nstudents\n5", "expected": "GET /students/5", "hidden": false}, {"input": "POST\nstudents\nNone", "expected": "POST /students", "hidden": true}]$xx327$::jsonb,
   $xx328$REST paths follow a simple pattern: acting on a specific resource (an id was given) appends /id after the resource name; acting on the whole collection (creating a new one, or listing them all) doesn't. Checking whether resource_id is the literal "None" decides which of the two formats to print.$xx328$,
   jsonb_build_object('python', $xx321$method = input().strip()
resource = input().strip()
resource_id = input().strip()
if resource_id == "None":
    print(f"{method} /{resource}")
else:
    print(f"{method} /{resource}/{resource_id}")
$xx321$),
   array['python'], 'published', false, 2),
  ('cp-py-apis-http-4', null::text, $xx331$First 5 Titles from a Post List$xx331$, 'Medium', 'py-apis-http-first-5-titles-from-post-list',
   $xx332$Given a JSON array of posts (as text, simulating what response.json() would return from a posts API), print just the titles of the first 5.

**Approach:** json.loads() the array into a list of dicts, slice the first 5 with [:5], and print each one's title field.

**Input:** One line: a JSON array of post objects, each with a title field.

**Output:** The title of each of the first 5 posts, one per line (fewer if there are less than 5).$xx332$,
   $xx333$[{"input": "[{\"title\": \"First\"}, {\"title\": \"Second\"}, {\"title\": \"Third\"}, {\"title\": \"Fourth\"}, {\"title\": \"Fifth\"}, {\"title\": \"Sixth\"}]", "output": "First\nSecond\nThird\nFourth\nFifth"}]$xx333$::jsonb,
   $xx334$["Each object in the array has a title field."]$xx334$::jsonb,
   jsonb_build_object('python', $xx329$import json

raw = input()
posts = json.loads(raw)

# print the title of each of the first 5 posts
$xx329$),
   $xx335$["json.loads(raw) turns the JSON array text into a real Python list of dicts.", "posts[:5] slices out at most the first 5 items, even if the list is shorter.", "Loop over the slice and print post[\"title\"] for each one."]$xx335$::jsonb,
   $xx336$[{"input": "[{\"title\": \"First\"}, {\"title\": \"Second\"}, {\"title\": \"Third\"}, {\"title\": \"Fourth\"}, {\"title\": \"Fifth\"}, {\"title\": \"Sixth\"}]", "expected": "First\nSecond\nThird\nFourth\nFifth", "hidden": false}, {"input": "[{\"title\": \"Only One\"}]", "expected": "Only One", "hidden": true}]$xx336$::jsonb,
   $xx337$json.loads(raw) parses the JSON array into a real Python list of dicts, exactly as response.json() would from a live posts API. posts[:5] safely takes at most the first 5 entries (fewer if the list is shorter), and looping over that slice to print post["title"] gives just the titles, one per line.$xx337$,
   jsonb_build_object('python', $xx330$import json

raw = input()
posts = json.loads(raw)
for post in posts[:5]:
    print(post["title"])
$xx330$),
   array['python'], 'published', false, 3)
) as v(id, topic_id, title, difficulty, slug, description,
       examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
       supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- ===========================================================================
-- 6. VALIDATION  (raises, never silently passes)
-- ===========================================================================
do $$
declare
  v_topics     int;
  v_tests      int;
  v_questions  int;
  v_problems   int;
  v_bad_tests  int;
begin
  select count(*) into v_topics from public.learning_topics
   where source_kind = 'python_tutorial' and source_ref like 'advanced-python-tools/%';
  if v_topics <> 5 then raise exception 'validation: expected 5 advanced-python-tools topics, found %', v_topics; end if;

  select count(*) into v_tests from public.practice_tests where id in ('pt-py-intermediate-python', 'pt-py-regular-expressions', 'pt-py-environment-packages', 'pt-py-database-programming', 'pt-py-apis-http');
  if v_tests <> 5 then raise exception 'validation: expected 5 new python topic mock tests, found %', v_tests; end if;

  select count(*) into v_bad_tests from public.practice_tests
   where id in ('pt-py-intermediate-python', 'pt-py-regular-expressions', 'pt-py-environment-packages', 'pt-py-database-programming', 'pt-py-apis-http')
     and (question_count <> 10 or duration_minutes <> 10);
  if v_bad_tests > 0 then raise exception 'validation: % new python mock tests do not have 10 questions / 10 minute duration', v_bad_tests; end if;

  select count(*) into v_questions from public.test_questions where test_id in ('pt-py-intermediate-python', 'pt-py-regular-expressions', 'pt-py-environment-packages', 'pt-py-database-programming', 'pt-py-apis-http');
  if v_questions <> 50 then raise exception 'validation: expected 50 new python MCQ rows (5 x 10), found %', v_questions; end if;

  select count(*) into v_problems from public.dsa_problems where id like 'cp-py-intermediate-python-%' or id like 'cp-py-regular-expressions-%' or id like 'cp-py-database-programming-%' or id like 'cp-py-apis-http-%';
  if v_problems <> 16 then raise exception 'validation: expected 16 new python coding problems, found %', v_problems; end if;

  raise notice '0052 OK: Python Tutorial Advanced — 5 topics, 5 mock tests (50 MCQs), 16 coding problems (environment-packages has none by design).';
end $$;

notify pgrst, 'reload schema';
