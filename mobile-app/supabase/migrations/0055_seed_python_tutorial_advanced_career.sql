-- mobile-app/supabase/migrations/0055_seed_python_tutorial_advanced_career.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: admin-panel/supabase/migrations/032_seed_python_tutorial_advanced_career.sql ; apply either, the other is a guarded no-op.
--
-- ============================================================================
-- BODY — extend the "Python Tutorial" Learning grid with its 6th and FINAL
-- section: 5 more topics (Advanced Python / Concurrency & Performance /
-- Security / Deployment & DevOps / Roadmap, Career Paths & Placement Prep),
-- completing all 30 source chapters
-- (mobile 0055_seed_python_tutorial_advanced_career.sql ==
--  admin 032_seed_python_tutorial_advanced_career.sql below this header —
--  byte-identical, guarded, idempotent, additive.)
-- ============================================================================
-- Sixth and final content drop for the python-tutorial grid seeded by 0050/027
-- through 0054/031. Adds a 6th learning_sections row "Advanced Python & Career
-- Readiness" and 5 more topics, following the exact same pattern — no schema,
-- RLS, or app-code change.
--
-- Judgment calls in this batch (flagged per the established framework):
--   * Deployment & DevOps (topic 29) has 0 coding problems — the source file
--     itself has no "Coding Problems" section (it's Linux/Docker/CI-YAML/cloud
--     tooling content, not something a stdin/stdout Python judge can grade) —
--     matches the source exactly, same as Environment & Package Management and
--     Git & GitHub in earlier batches; no judgment call needed.
--   * Concurrency & Performance's Problems 1 and 3 (threading / asyncio)
--     originally asked to PRINT the raw elapsed seconds — but exact wall-clock
--     timing isn't reproducible across machines/judge load, so both were
--     redesigned to print a "Concurrent"/"Sequential" classification (elapsed
--     time compared against a generous threshold) instead of a raw number —
--     same underlying concept (I/O-bound work overlapping), judge-safe output.
--   * Concurrency & Performance's Problem 4 (lru_cache) originally asked to
--     PRINT and compare raw cached-vs-uncached timings for fib(30) — redesigned
--     to print boolean outcomes ("Results match", "Cache lookup faster than
--     fresh computation") from a real timing comparison instead of raw seconds,
--     for the same reproducibility reason, using fib(28)/fib(20) to keep total
--     runtime low.
--   * Concurrency & Performance's Problem 2 (multiprocessing.Pool) is flagged
--     as a DISTINCT, higher-tier risk from the third-party-package risk flagged
--     in earlier batches (numpy/pandas/etc: an import that might fail cleanly):
--     multiprocessing.Pool spawns real OS child processes, which many
--     security-hardened code-execution sandboxes restrict or disable entirely
--     as a resource-exhaustion defense — if this judge is one of them, this
--     problem could error or hang rather than fail cleanly. Verified working in
--     an unrestricted local Python process; kept rather than dropped, since
--     multiprocessing is the chapter's central topic and there's no way to
--     meaningfully test it without actually spawning processes.
--   * Security's Problem 3 (JWT) originally asked to wait 15 real seconds after
--     a 10-second-expiry token to observe ExpiredSignatureError — a literal
--     15-second sleep risks tripping a judge's per-submission execution
--     timeout. Redesigned to build a second token whose exp is set in the PAST
--     at creation time, testing the identical decode/ExpiredSignatureError path
--     instantly with no sleep at all.
--   * Topic 30 ("Roadmap, Career Paths & Placement Prep", from
--     30-projects-interview-roadmap.md) is the ONLY topic across all 30 source
--     chapters with NEITHER a mock test NOR coding problems — the source file
--     is fundamentally different in kind from every other chapter: a course
--     wrap-up (learning roadmap, 7 career paths, a 40-project portfolio table,
--     and a placement-preparation reference section), not a technical skill
--     chapter. It has no standalone "## Multiple Choice Questions (10)" /
--     "## Coding Problems (4)" trailer in the standard format — its own
--     internal "4.10 Multiple Choice Questions" subsection has only 5 items
--     (not 10) embedded inside the placement-prep section, and its "4.11 Coding
--     Challenges" are 5 open-ended prompts with no test cases, not gradable
--     problems in this project's schema. Rather than fabricate a fake 10-MCQ
--     test or force-fit ungradable challenges (which earlier batches never did
--     even for a 0-coding-problem topic — those always kept their real 10-MCQ
--     test), the FULL file content is preserved as notes (genuinely valuable
--     reference material), with 0 test and 0 problems. The Practice section of
--     the topic page already renders nothing when both arrays are empty (no
--     app-code change needed) — this is the first topic in the whole course to
--     exercise that path.
--   * This is the FINAL batch: file 30 explicitly labels itself "the final
--     file" / "This concludes the complete Python Programming Course" —
--     all 30 source chapters are now seeded (30 topics across 6 sections).
-- ----------------------------------------------------------------------------

-- ---- ordering guard -----------------------------------------------------
do $guard$
begin
  if to_regclass('public.learning_grids') is null then
    raise exception '0055/032: learning_* not found — apply 0042_learning_management.sql (admin 019) first.';
  end if;
  if to_regprocedure('public.learning_topic_practice(text, text, text)') is null then
    raise exception '0055/032: apply 0048_topic_practice.sql (admin 025) first.';
  end if;
  if not exists (select 1 from public.learning_grids where lower(slug) = 'python-tutorial') then
    raise exception '0055/032: python-tutorial grid not found — apply 0050_seed_python_tutorial_content.sql (admin 027) first.';
  end if;
end
$guard$;

-- ===========================================================================
-- 2. SECTION — 6th and final module for the existing python-tutorial grid.
-- ===========================================================================
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial')
insert into public.learning_sections
  (grid_id, name, slug, description, sort_order, status, show_on_website, show_on_mobile)
select g.id, $uu1$Advanced Python & Career Readiness$uu1$, $uu2$advanced-python-career-readiness$uu2$, $uu3$Advanced Python, Concurrency & Performance, Security, Deployment & DevOps, and a full Roadmap/Career Paths/Placement Preparation wrap-up for the complete Python course.$uu3$, 60,
  'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, description = excluded.description,
  sort_order = excluded.sort_order, updated_at = now();

-- ===========================================================================
-- 3. TOPICS + CONTENT — 5 topics, one full notes block each.
-- ===========================================================================

-- Advanced Python
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = 'advanced-python-career-readiness'),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $uu4$Advanced Python$uu4$, $uu5$advanced-python$uu5$, $uu6$Type hints, @dataclass, Protocol structural typing, ABC.register(), descriptors (the mechanism behind @property), metaclasses, decorators that take arguments, functools.wraps, generator pipelines and send(), contextlib.contextmanager, functools.partial, and Python's reference-counting + garbage-collected memory model.$uu6$, 26,
    'published', true, true, 'python_tutorial', $uu7$advanced-python-career-readiness/advanced-python$uu7$
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
select up_topic.id, '', $uu8$This file covers advanced Python features that professional codebases rely on — tools that make code safer, cleaner, and more expressive. These build directly on the OOP and Intermediate Python files, so make sure you're comfortable with those first.

---

## 1. Type Hints

### What is it?

Type hints let you annotate what type a variable, parameter, or return value is expected to be — Python doesn't enforce them at runtime, but tools (and other developers) use them to catch mistakes early.

> **Definition:** Type hints are optional annotations indicating the expected data types of variables, function parameters, and return values.

### Simple Example

```python
def add(a: int, b: int) -> int:
    return a + b

name: str = "Aditi"
age: int = 21
scores: list[int] = [85, 90, 78]
student_info: dict[str, int] = {"age": 21, "marks": 85}
```

### Explanation of the Code

- `a: int, b: int` documents that both parameters are expected to be integers; `-> int` documents the expected return type.
- Python itself does **not** enforce these — calling `add("5", "3")` still runs, and would concatenate the strings instead of erroring. Type hints are for tooling and readability, not runtime validation.

### Checking Types with `mypy`

```bash
pip install mypy
mypy my_script.py
```

**Explanation:** `mypy` is a separate static type-checking tool that reads your type hints and flags mismatches **before** you even run the code — catching a whole category of bugs early, especially valuable in larger codebases.

### Common Mistakes

- Assuming type hints are enforced by Python itself at runtime — they aren't, unless you use an external validation tool (like `mypy`, or Pydantic, covered in the Web Development file).

### Important Points

- Type hints are optional but strongly encouraged in professional, larger codebases.
- `Optional[str]` (from the `typing` module) indicates a value can be either that type or `None`.

---

## 2. Dataclasses

### What is it?

The `@dataclass` decorator automatically generates common boilerplate methods (`__init__`, `__repr__`, `__eq__`) for classes that are mainly used to store data — saving you from writing repetitive code by hand.

### Simple Example — Without `@dataclass`

```python
class Student:
    def __init__(self, name, age, course):
        self.name = name
        self.age = age
        self.course = course

    def __repr__(self):
        return f"Student(name={self.name}, age={self.age}, course={self.course})"

    def __eq__(self, other):
        return self.name == other.name and self.age == other.age and self.course == other.course
```

### The Same Class — With `@dataclass`

```python
from dataclasses import dataclass

@dataclass
class Student:
    name: str
    age: int
    course: str

student1 = Student("Aditi", 21, "CS")
print(student1)                          # Student(name='Aditi', age=21, course='CS')
print(student1 == Student("Aditi", 21, "CS"))   # True
```

### Explanation of the Code

- `@dataclass` automatically generates `__init__`, `__repr__`, and `__eq__` based purely on the type-hinted attributes listed — dramatically reducing repetitive boilerplate.
- The generated `__repr__` gives a clean, readable printout without you writing it manually.

### Adding Default Values

```python
@dataclass
class Student:
    name: str
    age: int
    course: str = "Undeclared"   # default value

student2 = Student("Rohan", 22)
print(student2.course)   # Undeclared
```

### Important Points

- Dataclasses are ideal for simple, data-holding classes — for classes with significant custom logic/behavior, a regular class may still be more appropriate.
- Default values work exactly like default function arguments — non-default fields must come before default ones.

### Practice

1. Create a `Product` dataclass with `name`, `price`, and a default `in_stock: bool = True`.

---

## 3. Protocols (Structural Typing)

### What is it?

A `Protocol` defines an expected **shape** (which methods/attributes an object must have) without requiring formal inheritance — Python calls this "structural typing," informally known as "duck typing" ("if it walks like a duck and quacks like a duck...").

### Simple Example

```python
from typing import Protocol

class Flyable(Protocol):
    def fly(self) -> str:
        ...

class Bird:
    def fly(self) -> str:
        return "Bird is flying"

class Airplane:
    def fly(self) -> str:
        return "Airplane is flying"

def make_it_fly(flyer: Flyable) -> None:
    print(flyer.fly())

make_it_fly(Bird())        # works - Bird has a matching fly() method
make_it_fly(Airplane())    # also works - Airplane also has a matching fly() method
```

### Explanation of the Code

- Neither `Bird` nor `Airplane` explicitly inherits from `Flyable` — they just happen to have a matching `fly()` method, which is all a `Protocol` cares about.
- This is different from traditional inheritance-based abstraction (like the `ABC` class from the OOP file), which requires an explicit `class Bird(Flyable):` relationship.

### Important Points

- Protocols are checked primarily by static type checkers (like `mypy`), not enforced at runtime by Python itself.
- Useful when you want to describe "any object with this behavior," without forcing unrelated classes into an artificial inheritance hierarchy.

---

## 4. Abstract Base Classes — Deeper Look

### Recap and Extension

The OOP file covered `ABC` and `@abstractmethod` for forcing subclasses to implement specific methods. Beyond that basic use, Python's `abc` module also supports **registering** existing classes as "virtual subclasses," without requiring them to actually inherit.

```python
from abc import ABC, abstractmethod

class Serializable(ABC):
    @abstractmethod
    def to_json(self):
        pass

class ThirdPartyClass:
    def to_json(self):
        return "{}"

Serializable.register(ThirdPartyClass)

print(isinstance(ThirdPartyClass(), Serializable))   # True, even without direct inheritance
```

### Important Points

- `.register()` lets you treat an already-existing, unrelated class as if it fulfills an abstract interface, for `isinstance()` checks — useful when you can't (or don't want to) modify that class's original code.

---

## 5. Descriptors

### What is it?

A descriptor is a class that controls what happens when an attribute is accessed, set, or deleted on another class — this is actually the underlying mechanism that powers `@property` (from the Intermediate Python file).

### Simple Example

```python
class PositiveNumber:
    def __set_name__(self, owner, name):
        self.name = "_" + name

    def __get__(self, instance, owner):
        return getattr(instance, self.name)

    def __set__(self, instance, value):
        if value < 0:
            raise ValueError(f"{self.name} cannot be negative")
        setattr(instance, self.name, value)

class Product:
    price = PositiveNumber()   # a descriptor controlling this attribute

    def __init__(self, name, price):
        self.name = name
        self.price = price   # this actually goes through PositiveNumber.__set__

item = Product("Shirt", 500)
print(item.price)      # 500

item.price = -100        # raises ValueError!
```

### Explanation of the Code

- `__get__` and `__set__` intercept every read and write to `price`, letting the `PositiveNumber` descriptor enforce validation centrally, reusable across **any** class that uses it.
- This is genuinely advanced — most day-to-day code uses `@property` instead (which is simpler for single-class use cases); descriptors shine when you need the **same** validation logic reused across many different classes/attributes.

### Important Points

- Descriptors are the mechanism underlying `@property`, but are more powerful/reusable across multiple classes.
- Rarely written from scratch in everyday code, but understanding them deepens your understanding of how Python's attribute access actually works.

---

## 6. Metaclasses

### What is it?

A metaclass is "the class of a class" — just as objects are instances of classes, classes themselves are instances of a metaclass (by default, `type`). Metaclasses let you customize **how classes themselves are created**.

> **Definition:** A metaclass defines the behavior of a class itself, controlling how classes are constructed, similar to how a class controls how objects are constructed.

### Simple Example

```python
class LoggingMeta(type):
    def __new__(mcs, name, bases, namespace):
        print(f"Creating class: {name}")
        return super().__new__(mcs, name, bases, namespace)

class MyClass(metaclass=LoggingMeta):
    pass
```

Output (printed the moment `MyClass` is defined, not when an object is created):
```
Creating class: MyClass
```

### Explanation of the Code

- `LoggingMeta` inherits from `type` (the default metaclass every class ultimately uses).
- `__new__` intercepts the actual creation of the class itself, letting you inject custom logic (here, just a print statement) whenever any class using this metaclass is defined.

### Real-World Example

Metaclasses are used internally by frameworks like Django's ORM to automatically register model classes and their database fields the moment they're defined.

### Important Points

- Metaclasses are a genuinely advanced, rarely-needed-in-everyday-code feature — as the well-known Python saying goes, "if you're wondering whether you need metaclasses, you don't."
- Understanding they exist helps explain "magic" behavior in frameworks like Django, even if you rarely write your own.

---

## 7. Advanced Decorators

### Decorators That Accept Arguments

```python
def repeat(times):
    def decorator(func):
        def wrapper(*args, **kwargs):
            for _ in range(times):
                func(*args, **kwargs)
        return wrapper
    return decorator

@repeat(times=3)
def greet(name):
    print(f"Hello, {name}!")

greet("Aditi")
```

Output:
```
Hello, Aditi!
Hello, Aditi!
Hello, Aditi!
```

**Explanation:** This adds an **extra layer** of nesting compared to the basic decorators covered in the Intermediate Python file — `repeat(times=3)` first returns the actual decorator, which is then applied to `greet`.

### Preserving Function Metadata with `functools.wraps`

```python
from functools import wraps

def my_decorator(func):
    @wraps(func)   # preserves func's original name and docstring
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@my_decorator
def add(a, b):
    """Adds two numbers."""
    return a + b

print(add.__name__)   # add (without @wraps, this would incorrectly show "wrapper")
print(add.__doc__)     # Adds two numbers.
```

**Explanation:** Without `@wraps(func)`, the decorated function would lose its original name and docstring, showing `wrapper` instead of `add` — this makes debugging and introspection (and automatically generated documentation) confusing. `@wraps` is considered a best practice for every decorator you write.

### Important Points

- Always use `@functools.wraps(func)` inside any decorator you write in real code.
- A decorator that accepts arguments requires an extra level of function nesting.

---

## 8. Advanced Generators

### Generator Pipelines

Generators can be chained together, each one processing and passing along data lazily, without ever building a full intermediate list.

```python
def read_numbers(numbers):
    for n in numbers:
        yield n

def square_all(numbers):
    for n in numbers:
        yield n ** 2

def filter_even(numbers):
    for n in numbers:
        if n % 2 == 0:
            yield n

pipeline = filter_even(square_all(read_numbers(range(1, 11))))
print(list(pipeline))   # [4, 16, 36, 64, 100]
```

**Explanation:** Each generator function processes one value at a time and passes it to the next stage — nothing is fully computed until the very end (`list(pipeline)`), making this extremely memory-efficient even for huge input sequences.

### `send()` — Sending Values Into a Generator

```python
def running_total():
    total = 0
    while True:
        value = yield total
        total += value

gen = running_total()
next(gen)              # "prime" the generator (runs up to the first yield)
print(gen.send(10))    # 10
print(gen.send(5))     # 15
print(gen.send(20))    # 35
```

**Explanation:** `yield` can also **receive** a value sent in via `.send()`, allowing two-way communication with a running generator — an advanced pattern occasionally used for building coroutine-style logic.

### Important Points

- Generator pipelines are a memory-efficient, elegant way to process large data streams in stages.
- `.send()` is an advanced, less commonly used feature — most everyday generator use only needs `yield` to produce values.

---

## 9. Advanced Context Managers with `contextlib`

### What is it?

The Intermediate Python file showed writing a context manager as a full class with `__enter__`/`__exit__`. The `contextlib.contextmanager` decorator offers a much shorter way to write one using a generator function.

### Simple Example

```python
from contextlib import contextmanager
import time

@contextmanager
def timer():
    start = time.time()
    yield
    end = time.time()
    print(f"Took {end - start:.4f} seconds")

with timer():
    total = sum(range(1_000_000))
```

### Explanation of the Code

- Everything **before** `yield` acts like `__enter__` (setup); everything **after** `yield` acts like `__exit__` (cleanup) — and it all runs automatically as part of the `with` block.
- This is far more concise than writing a full class with two separate methods for simple cases.

### Important Points

- `@contextmanager` is generally preferred for simple context managers; a full class is still useful for more complex cases needing extra state or methods.

---

## 10. Functional Programming Tools

### `functools.partial`

```python
from functools import partial

def power(base, exponent):
    return base ** exponent

square = partial(power, exponent=2)
cube = partial(power, exponent=3)

print(square(5))   # 25
print(cube(5))       # 125
```

**Explanation:** `partial` creates a new function with some arguments already "locked in" — `square` is just `power` with `exponent` permanently set to `2`.

### Immutability as a Functional Programming Principle

```python
# Prefer creating new data over mutating existing data
original = (1, 2, 3)
updated = original + (4,)   # creates a NEW tuple, rather than modifying in place

print(original)   # (1, 2, 3) - unchanged
print(updated)     # (1, 2, 3, 4)
```

**Explanation:** Functional programming favors avoiding changes to existing data (mutation), instead producing new values — this makes code easier to reason about, since data can't unexpectedly change somewhere else in a program.

### Important Points

- `functools` provides several tools (`partial`, `reduce`, `lru_cache`, covered earlier) supporting a more functional programming style in Python.
- Favoring immutable data structures (tuples over lists, when data shouldn't change) reduces a whole class of subtle bugs.

---

## 11. Memory Management and Garbage Collection

### What is it?

Python automatically manages memory for you — allocating memory for new objects and freeing it once objects are no longer needed, primarily using a technique called **reference counting**.

### Reference Counting (Conceptual)

```python
import sys

a = [1, 2, 3]
print(sys.getrefcount(a))   # shows how many references currently point to this list

b = a   # now TWO references point to the same list
print(sys.getrefcount(a))   # count increased
```

**Explanation:** Python tracks how many variables/references point to each object in memory. When that count drops to zero (no more references exist), Python automatically frees the memory.

### The Garbage Collector (For Circular References)

Reference counting alone can't detect **circular references** (two objects referencing each other, with nothing else pointing to either) — Python's separate garbage collector (the `gc` module) periodically scans for and cleans up exactly this situation.

```python
import gc

class Node:
    def __init__(self):
        self.reference = None

node1 = Node()
node2 = Node()
node1.reference = node2
node2.reference = node1   # circular reference: they point to each other

del node1
del node2
# even after deleting both variables, the objects still reference each other in memory
# Python's garbage collector will eventually detect and clean this up

gc.collect()   # manually trigger garbage collection (rarely needed in normal code)
```

### Weak References

```python
import weakref

class Student:
    def __init__(self, name):
        self.name = name

student = Student("Aditi")
weak_ref = weakref.ref(student)

print(weak_ref())   # <Student object> - still accessible
del student
print(weak_ref())   # None - the object has been garbage collected
```

**Explanation:** A weak reference doesn't count toward an object's reference count — allowing the object to still be garbage collected normally, while still letting you check whether it's still alive. Useful for caches that shouldn't prevent memory from being freed.

### Important Points

- Python handles memory management automatically — manual intervention (`gc.collect()`) is rarely needed in everyday code.
- Circular references are the main scenario where the garbage collector's extra cleanup (beyond simple reference counting) matters.

---

## 12. A Brief Note on Python Internals

### CPython

CPython is the standard, most widely used implementation of Python (the one you almost certainly have installed) — written in the C programming language. Other implementations exist (like PyPy, focused on speed via just-in-time compilation), but CPython is what "Python" means for the vast majority of users.

### The Global Interpreter Lock (GIL) — Brief Preview

CPython has a mechanism called the GIL, which allows only one thread to execute Python bytecode at a time, even on a multi-core processor. This has significant implications for concurrent programming, covered in full detail in the next file, Concurrency & Performance.

### Important Points

- Knowing that CPython is the standard implementation, and that alternatives exist, is useful general knowledge, especially for interviews.
- The GIL is a foundational concept for understanding Python's concurrency behavior — introduced briefly here, explained fully next.

---

## Common Beginner Mistakes — Summary for This Section

- Assuming type hints are enforced by Python at runtime.
- Forgetting `@functools.wraps` inside custom decorators.
- Reaching for metaclasses or descriptors when a simpler tool (a regular class, or `@property`) would do.
- Assuming `gc.collect()` needs to be called manually in typical everyday code.

---

## Cheat Sheet — Advanced Python

```python
# Type hints
def func(x: int, y: str = "default") -> bool: ...

# Dataclass
from dataclasses import dataclass
@dataclass
class Point:
    x: int
    y: int

# Protocol
from typing import Protocol
class HasArea(Protocol):
    def area(self) -> float: ...

# Advanced decorator with functools.wraps
from functools import wraps
def decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

# contextlib context manager
from contextlib import contextmanager
@contextmanager
def my_context():
    # setup
    yield
    # cleanup

# functools.partial
from functools import partial
new_func = partial(original_func, fixed_arg=value)
```

---

## Interview Questions

**Q1. Are Python type hints enforced at runtime?**
Answer: No — they're purely informational/documentational by default. Enforcement requires an external tool like `mypy`, or a library that validates them explicitly, like Pydantic.

**Q2. What does the `@dataclass` decorator do?**
Answer: It automatically generates common boilerplate methods (`__init__`, `__repr__`, `__eq__`) for a class based on its type-hinted attributes, reducing repetitive code for data-holding classes.

**Q3. What is a metaclass?**
Answer: "The class of a class" — it controls how classes themselves are constructed, similar to how a class controls how its objects are constructed. Rarely needed in everyday code, but used internally by some frameworks.

**Q4. What is the difference between a descriptor and a property?**
Answer: A `@property` is a simpler, single-class way to control attribute access. A descriptor is the more general, reusable mechanism underlying `@property`, allowing the same validation/access logic to be shared across multiple different classes and attributes.

**Q5. Why should `functools.wraps` be used inside custom decorators?**
Answer: Without it, the decorated function loses its original name and docstring (showing the wrapper's instead), making debugging and introspection confusing.

**Q6. How does Python primarily manage memory?**
Answer: Primarily through reference counting — automatically freeing an object's memory once nothing references it anymore. A separate garbage collector additionally handles circular references, which reference counting alone cannot detect.

**Q7. What is CPython?**
Answer: The standard, most widely used implementation of Python, written in C — what most people mean when they simply say "Python."

---

## Practice Questions

**Beginner**
1. Add type hints to a function that takes two floats and returns their average.
2. Convert a regular class with 3 attributes into a `@dataclass`.
3. Write a decorator using `@functools.wraps` and confirm the decorated function's `__name__` is preserved.
4. Write a simple `contextlib.contextmanager`-based context manager that prints "Starting" and "Finished" around a block of code.
5. Use `functools.partial` to create a specialized version of a general function.

**Intermediate**
1. Write a `Protocol` describing objects with a `save()` method, and demonstrate two unrelated classes both satisfying it.
2. Write a decorator that accepts an argument (e.g., a number of retries) and applies it to a function.
3. Build a generator pipeline with at least 3 stages (e.g., read numbers → filter → transform).
4. Create a simple descriptor that validates a string attribute is never empty.
5. Demonstrate a weak reference to an object, showing it becomes `None` after the original object is deleted.

**Challenge**
1. Write a custom metaclass that automatically adds a `created_at` timestamp attribute to every class that uses it.
2. Build a small "functional" data pipeline using `map`, `filter`, and `functools.reduce` together to process a list of numbers.
3. Research and explain, in your own words (with a code example), how `@property` is essentially syntactic sugar over the descriptor protocol.
$uu8$, 'markdown',
  jsonb_build_object('source', 'python_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'python_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Concurrency & Performance
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = 'advanced-python-career-readiness'),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $uu9$Concurrency & Performance$uu9$, $uu10$concurrency-performance$uu10$, $uu11$Concurrency vs parallelism, processes vs threads, the GIL, threading for I/O-bound work, multiprocessing for CPU-bound work, asyncio's async/await and event loop, profiling with timeit/cProfile, optimization tips, and caching with functools.lru_cache.$uu11$, 27,
    'published', true, true, 'python_tutorial', $uu12$advanced-python-career-readiness/concurrency-performance$uu12$
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
select up_topic.id, '', $uu13$Some programs need to do multiple things at once — downloading several files simultaneously, handling many web requests, or crunching heavy calculations faster by using multiple CPU cores. This file covers Python's tools for concurrency (threading, multiprocessing, `asyncio`) and for measuring and improving performance.

---

## 1. Concurrency vs Parallelism

### What is it?

- **Concurrency** means managing multiple tasks that are in progress at overlapping times — not necessarily running at the exact same instant, but making progress on several things by switching between them.
- **Parallelism** means multiple tasks genuinely running at the same physical instant, using multiple CPU cores.

### Real-World Analogy

A single chef juggling three dishes at once (stirring one, chopping for another, checking the oven for a third) is **concurrency** — one chef, switching between tasks. Three chefs each cooking their own dish simultaneously is **parallelism** — truly simultaneous work.

### Important Points

- Concurrency is about **structure** (dealing with many things), parallelism is about **execution** (doing many things at the exact same time).
- Python's approach to each — threading, multiprocessing, `asyncio` — has important trade-offs, covered below.

---

## 2. Processes vs Threads

### What is it?

- A **process** is an independent running program, with its own separate memory space.
- A **thread** is a smaller unit of execution **within** a process — multiple threads in the same process share the same memory.

### Comparison Table

| | Process | Thread |
|---|---|---|
| Memory | Separate, isolated | Shared within the same process |
| Creation cost | Higher (heavier) | Lower (lighter) |
| Communication | Requires special mechanisms (since memory is separate) | Easy (shared memory), but requires care to avoid conflicts |
| Crash impact | One process crashing doesn't affect others | A crash can potentially affect the whole process |

---

## 3. The Global Interpreter Lock (GIL)

### What is it?

The GIL is a mechanism in CPython (introduced in the Advanced Python file) that allows only **one thread** to execute Python bytecode at any given moment, even on a multi-core machine.

> **Definition:** The GIL (Global Interpreter Lock) is a lock in CPython that ensures only one thread executes Python bytecode at a time, limiting true parallel execution of Python code across threads.

### Why Does This Matter?

Because of the GIL, using multiple **threads** for CPU-heavy Python code (like complex calculations) generally does **not** make it run faster on multiple cores — the GIL prevents true parallel execution of Python bytecode. However, threads are still very useful for **I/O-bound** tasks (waiting on files, network requests), since the GIL is released while a thread is waiting on I/O.

### Important Points

- The GIL is specific to CPython (the standard Python implementation) — not all Python implementations have this limitation.
- For genuinely parallel CPU-heavy work, **multiprocessing** (separate processes, each with its own GIL) is the standard Python solution, not threading.

---

## 4. Multithreading

### What is it?

Python's `threading` module lets you run multiple threads within a single process — well-suited for **I/O-bound** tasks (waiting on network responses, file reads, database queries), where a thread mostly waits rather than computes.

### Simple Example

```python
import threading
import time

def download_file(name):
    print(f"Starting download: {name}")
    time.sleep(2)   # simulates waiting on a network request
    print(f"Finished download: {name}")

start = time.time()

threads = []
for filename in ["file1.zip", "file2.zip", "file3.zip"]:
    thread = threading.Thread(target=download_file, args=(filename,))
    threads.append(thread)
    thread.start()

for thread in threads:
    thread.join()

print(f"Total time: {time.time() - start:.2f} seconds")
```

Output (approximately):
```
Starting download: file1.zip
Starting download: file2.zip
Starting download: file3.zip
Finished download: file1.zip
Finished download: file2.zip
Finished download: file3.zip
Total time: 2.01 seconds
```

### Explanation of the Code

- All three "downloads" start almost immediately and run concurrently — the total time is about 2 seconds (the time for **one** download), not 6 seconds (which running them one after another would take).
- `thread.start()` begins running the thread; `thread.join()` tells the main program to wait until that thread has finished before continuing.
- This works well here specifically because `time.sleep()` simulates waiting (I/O), during which the GIL is released, letting other threads make progress.

### Common Mistakes

- Using threading for CPU-heavy calculations, expecting a speedup — the GIL prevents genuine parallel execution of pure Python computation across threads.
- Forgetting `.join()`, causing the main program to potentially finish before background threads complete their work.

### Important Points

- Threading is well-suited for I/O-bound tasks: network requests, file operations, waiting on external resources.
- Threading is generally **not** effective for CPU-bound tasks in CPython, due to the GIL.

---

## 5. Multiprocessing

### What is it?

Python's `multiprocessing` module runs code in **separate processes**, each with its own Python interpreter and memory space (and therefore, its own GIL) — enabling genuine parallel execution across multiple CPU cores, ideal for CPU-heavy tasks.

### Simple Example

```python
import multiprocessing
import time

def calculate_squares(numbers):
    return [n ** 2 for n in numbers]

if __name__ == "__main__":
    numbers = list(range(1, 10_000_000))
    half = len(numbers) // 2

    start = time.time()

    with multiprocessing.Pool(processes=2) as pool:
        results = pool.map(calculate_squares, [numbers[:half], numbers[half:]])

    print(f"Total time: {time.time() - start:.2f} seconds")
```

### Explanation of the Code

- `multiprocessing.Pool(processes=2)` creates 2 separate worker processes.
- `.map()` splits the work (here, two halves of the number list) across the available processes, running them **genuinely in parallel** on separate CPU cores.
- The `if __name__ == "__main__":` guard (from the Modules & Packages file) is **required** for multiprocessing code on some platforms, to prevent child processes from accidentally re-running the entire script from scratch.

### Common Mistakes

- Forgetting the `if __name__ == "__main__":` guard when using multiprocessing, which can cause runaway process creation or errors, especially on Windows.
- Using multiprocessing for small, lightweight tasks — the overhead of creating separate processes can outweigh any benefit for trivial work.

### Important Points

- Multiprocessing achieves genuine parallelism by using entirely separate processes, each with its own GIL.
- Best suited for CPU-bound tasks: heavy calculations, data processing, image/video processing.

---

## Comparison Table — Threading vs Multiprocessing vs `asyncio`

| | Threading | Multiprocessing | `asyncio` |
|---|---|---|---|
| Best for | I/O-bound tasks | CPU-bound tasks | I/O-bound tasks (single-threaded) |
| True parallelism? | No (GIL-limited) | Yes (separate processes) | No (single-threaded, but very efficient at waiting) |
| Overhead | Low | Higher (separate processes) | Very low |
| Complexity | Moderate | Moderate | Requires learning `async`/`await` syntax |

---

## 6. `asyncio` — Asynchronous Programming

### What is it?

`asyncio` allows a **single thread** to efficiently handle many I/O-bound tasks by voluntarily "pausing" a task while it's waiting (e.g., for a network response) and working on something else in the meantime — without the overhead of actual threads or processes.

> **Definition:** `asyncio` is Python's library for writing concurrent code using the `async`/`await` syntax, allowing a single thread to efficiently manage many I/O-bound tasks.

### `async` and `await`

```python
import asyncio

async def download_file(name):
    print(f"Starting download: {name}")
    await asyncio.sleep(2)   # non-blocking "wait" - lets other tasks run meanwhile
    print(f"Finished download: {name}")

async def main():
    await asyncio.gather(
        download_file("file1.zip"),
        download_file("file2.zip"),
        download_file("file3.zip")
    )

asyncio.run(main())
```

Output (approximately):
```
Starting download: file1.zip
Starting download: file2.zip
Starting download: file3.zip
Finished download: file1.zip
Finished download: file2.zip
Finished download: file3.zip
```
*(Total time: about 2 seconds — all three "downloads" progress concurrently.)*

### Explanation of the Code

- `async def` marks a function as a **coroutine** — a special function that can be paused and resumed.
- `await asyncio.sleep(2)` pauses **this specific task**, letting the event loop run other pending tasks during the wait, then resumes once the wait is over.
- `asyncio.gather(...)` runs multiple coroutines concurrently, waiting for all of them to finish.
- `asyncio.run(main())` starts the "event loop" — the mechanism that manages switching between tasks — and runs the main coroutine to completion.

### Real-World Example

`asyncio` is heavily used in modern web frameworks (like FastAPI, covered in the Web Development file) and network applications needing to handle thousands of simultaneous connections efficiently, without the overhead of one thread per connection.

### Common Mistakes

- Forgetting `await` before an async function call, which returns a coroutine object rather than actually running it.
- Mixing regular blocking code (like `time.sleep()`) inside async functions instead of the async-aware equivalent (`asyncio.sleep()`), which would block the entire event loop, defeating the purpose.
- Assuming `asyncio` provides true parallelism for CPU-heavy work — it doesn't; it's specifically for efficiently handling many I/O-bound waits on a single thread.

### Important Points

- `asyncio` shines for high-volume I/O-bound work (many simultaneous network requests) with very low overhead.
- Every I/O operation inside an async function needs an async-aware version (`asyncio.sleep()` instead of `time.sleep()`, async HTTP libraries instead of `requests`, etc.) to actually benefit from `asyncio`'s efficiency.

### Practice

1. Write an `asyncio` program that "fetches" 5 items concurrently, each simulated with `asyncio.sleep(1)`, and confirm the total runtime is close to 1 second rather than 5.

---

## 7. Profiling

### What is it?

Profiling measures exactly where your program spends its time, helping you identify actual performance bottlenecks — rather than guessing which part of the code is slow.

### Simple Example — `timeit`

```python
import timeit

def using_loop():
    result = []
    for i in range(1000):
        result.append(i ** 2)
    return result

def using_comprehension():
    return [i ** 2 for i in range(1000)]

loop_time = timeit.timeit(using_loop, number=1000)
comprehension_time = timeit.timeit(using_comprehension, number=1000)

print(f"Loop: {loop_time:.4f}s")
print(f"Comprehension: {comprehension_time:.4f}s")
```

**Explanation:** `timeit` runs a piece of code many times (here, 1000 times) and measures the total time, giving a reliable comparison between two approaches — useful for confirming whether an "optimization" actually helps.

### Simple Example — `cProfile`

```python
import cProfile

def slow_function():
    total = 0
    for i in range(1_000_000):
        total += i
    return total

cProfile.run("slow_function()")
```

**Explanation:** `cProfile` gives a detailed breakdown of how many times each function was called and how much total time was spent inside it — invaluable for pinpointing exactly which function is the actual bottleneck in a larger program, rather than guessing.

### Important Points

- Always profile **before** optimizing — intuition about what's "slow" is often wrong, and optimizing the wrong part wastes effort.
- `timeit` is best for comparing small snippets; `cProfile` is best for analyzing a larger program's overall behavior.

---

## 8. Optimization Tips

### General Guidance

- **Measure first** — use profiling tools before assuming where the bottleneck is.
- **Use built-in functions and libraries** — they're typically implemented in C and much faster than equivalent hand-written Python loops.
- **Use list comprehensions / generator expressions** where appropriate — often faster and more readable than manual loops.
- **Avoid unnecessary work inside loops** — move calculations that don't change out of the loop body.
- **Use appropriate data structures** — e.g., a `set` for membership testing (`in`) is far faster than a `list` for large collections.

### Simple Example

```python
# Slower: checking membership in a list
big_list = list(range(100_000))
print(99_999 in big_list)   # scans through the list one item at a time

# Faster: checking membership in a set
big_set = set(range(100_000))
print(99_999 in big_set)    # near-instant lookup
```

**Explanation:** Sets use a hash-based lookup internally, making membership checks dramatically faster than scanning through a list, especially as the collection grows large.

---

## 9. Caching

### What is it?

Caching stores the result of an expensive computation so it doesn't need to be recalculated the next time the same input occurs — trading a bit of memory for a significant speed improvement on repeated calls.

### `functools.lru_cache` (Recap and Deeper Look)

```python
from functools import lru_cache
import time

@lru_cache(maxsize=None)
def slow_calculation(n):
    time.sleep(1)   # simulate an expensive operation
    return n * n

print(slow_calculation(5))   # takes about 1 second (first call)
print(slow_calculation(5))   # instant! (cached result from before)
```

**Explanation:** `@lru_cache` automatically remembers the result for each unique set of arguments — calling `slow_calculation(5)` a second time returns the cached answer instantly, skipping the expensive computation entirely.

### Important Points

- `maxsize=None` means the cache can grow without limit; setting a specific number limits how many recent results are kept, evicting the "Least Recently Used" ones once full.
- Caching is most effective for functions that are called repeatedly with the **same** arguments and have no side effects (their output depends only on their input).

---

## Common Beginner Mistakes — Summary for This Section

- Using threading for CPU-heavy work, expecting a speedup that the GIL prevents.
- Forgetting `if __name__ == "__main__":` with multiprocessing.
- Using blocking calls (`time.sleep()`) instead of async-aware equivalents inside `asyncio` code.
- Optimizing code without first profiling to confirm where the actual bottleneck is.

---

## Cheat Sheet — Concurrency & Performance

```python
# Threading (I/O-bound)
import threading
t = threading.Thread(target=func, args=(...,))
t.start(); t.join()

# Multiprocessing (CPU-bound)
import multiprocessing
if __name__ == "__main__":
    with multiprocessing.Pool(processes=4) as pool:
        results = pool.map(func, data)

# asyncio (I/O-bound, single-threaded)
import asyncio
async def task():
    await asyncio.sleep(1)
asyncio.run(asyncio.gather(task(), task()))

# Profiling
import timeit, cProfile
timeit.timeit(func, number=1000)
cProfile.run("func()")

# Caching
from functools import lru_cache
@lru_cache(maxsize=None)
def expensive_func(n): ...
```

---

## Interview Questions

**Q1. What is the GIL, and how does it affect multithreading in Python?**
Answer: The Global Interpreter Lock allows only one thread to execute Python bytecode at a time in CPython, preventing true parallel execution of CPU-bound Python code across threads — though threads remain useful for I/O-bound tasks, since the GIL is released during I/O waits.

**Q2. When would you use multiprocessing instead of threading?**
Answer: For CPU-bound tasks (heavy calculations), since multiprocessing uses separate processes (each with its own GIL), achieving genuine parallelism across multiple CPU cores — something threading cannot do due to the GIL.

**Q3. What is the difference between concurrency and parallelism?**
Answer: Concurrency means managing multiple tasks with overlapping progress, potentially by switching between them. Parallelism means multiple tasks genuinely executing at the exact same instant, typically across multiple CPU cores.

**Q4. What is `asyncio` best suited for?**
Answer: Efficiently handling many I/O-bound tasks (like network requests) concurrently on a single thread, with very low overhead — not suited for CPU-bound work, since it doesn't provide true parallelism.

**Q5. Why should you profile code before optimizing it?**
Answer: Intuition about which part of a program is slow is often wrong; profiling tools (like `cProfile`) reveal the actual bottleneck, ensuring optimization effort is spent where it will genuinely help.

**Q6. What does `functools.lru_cache` do?**
Answer: It automatically caches a function's results based on its arguments, returning the cached result instantly on repeated calls with the same arguments instead of recomputing them.

---

## Practice Questions

**Beginner**
1. Write a threading example that "downloads" 3 files concurrently using `time.sleep()` to simulate the wait.
2. Use `timeit` to compare the speed of building a list with a loop versus a list comprehension.
3. Add `@lru_cache` to a slow recursive Fibonacci function and observe the speed difference for larger inputs.
4. Write a simple `asyncio` program with one coroutine that sleeps for 1 second and prints a message.
5. Explain, in your own words, the difference between a process and a thread.

**Intermediate**
1. Use `multiprocessing.Pool` to calculate squares of a large list of numbers, splitting the work across multiple processes.
2. Use `asyncio.gather()` to run 5 simulated "API calls" concurrently, each taking 1 second, and confirm the total time is close to 1 second.
3. Use `cProfile` to profile a function that performs a moderately expensive calculation, and identify which part takes the most time.
4. Compare membership testing speed (`in`) between a large list and a large set of the same size using `timeit`.
5. Explain (in your own words) why using threads for a CPU-heavy calculation likely won't provide a speedup in CPython.

**Challenge**
1. Build a small "web scraper" simulation using `asyncio` that "fetches" 10 pages concurrently (each simulated with `asyncio.sleep()`), and compare its total time against doing the same 10 fetches sequentially.
2. Use `multiprocessing` to parallelize a CPU-heavy task (like checking primality for a large range of numbers) across 4 processes, and measure the speedup compared to a single-process version.
3. Profile a small program with multiple functions using `cProfile`, identify the single biggest bottleneck, optimize it (e.g., with caching or a better data structure), and re-profile to confirm the improvement.
$uu13$, 'markdown',
  jsonb_build_object('source', 'python_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'python_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Security
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = 'advanced-python-career-readiness'),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $uu14$Security$uu14$, $uu15$security$uu15$, $uu16$Password hashing with bcrypt, authentication vs authorization, JWTs (structure, signing, expiry), environment variables for secrets, SQL injection defense via parameterized queries, XSS and auto-escaping, CSRF tokens, and API security essentials.$uu16$, 28,
    'published', true, true, 'python_tutorial', $uu17$advanced-python-career-readiness/security$uu17$
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
select up_topic.id, '', $uu18$Writing code that works is only half the job — writing code that's safe from common attacks is just as important, especially for anything handling user data, passwords, or payments. This file covers the security fundamentals every Python developer should know, with an emphasis on defensive best practices.

---

## 1. What is Secure Coding?

### What is it?

Secure coding means writing software with an awareness of common vulnerabilities, and deliberately avoiding the mistakes that let attackers exploit them.

> **Definition:** Secure coding is the practice of writing software in a way that protects it against vulnerabilities, unauthorized access, and data breaches.

### Why do we use it?

A single security mistake — a leaked password, an unvalidated input, a hardcoded secret — can expose an entire application's data, damage user trust, and in many cases carry legal consequences. Security isn't an optional extra feature; it's a core responsibility of professional software development.

---

## 2. Password Hashing

### What is it?

Password hashing converts a password into an irreversible, scrambled string before storing it — so that even if a database is compromised, the actual passwords aren't directly exposed.

> **Definition:** Hashing is a one-way transformation that converts data into a fixed-length string, from which the original data cannot be feasibly recovered.

### Why NEVER Store Plain-Text Passwords

If a database storing plain-text passwords is ever breached, every single user's actual password is immediately exposed — and since many people reuse passwords across sites, this puts their other accounts at risk too.

### Simple Example — Secure Password Hashing with `bcrypt`

```bash
pip install bcrypt
```

```python
import bcrypt

password = "MySecurePassword123"

# Hashing a password (done once, when the user creates their account)
hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
print(hashed)   # a long, scrambled byte string - safe to store in the database

# Verifying a password (done every time the user logs in)
entered_password = "MySecurePassword123"
is_correct = bcrypt.checkpw(entered_password.encode(), hashed)
print(is_correct)   # True
```

### Explanation of the Code

- `bcrypt.gensalt()` generates a random "salt" — extra random data mixed into the hash, ensuring that even two identical passwords produce different hashes, protecting against certain precomputed-hash attacks.
- `bcrypt.hashpw()` performs the actual one-way hashing — there's no way to reverse this back into the original password.
- `bcrypt.checkpw()` checks a freshly entered password against the stored hash — the application never needs to (and never should) store or compare plain-text passwords directly.

### Common Mistakes

- Storing passwords in plain text, or using a fast, general-purpose hash (like plain MD5 or SHA-256) instead of a slow, purpose-built password-hashing algorithm like `bcrypt` — general-purpose hashes are designed to be fast, which actually makes them easier to brute-force for passwords specifically.
- Reusing the same salt for every password, which defeats much of the purpose of salting.

### Important Points

- Always use a dedicated password-hashing library (`bcrypt`, or similar) — never a general-purpose hash function, and never plain text.
- Password verification should compare hashes, never decrypt anything back to plain text (proper hashing is one-way and cannot be reversed at all).

---

## 3. Authentication vs Authorization

### What is it?

- **Authentication** — verifying **who** someone is (e.g., checking a username and password).
- **Authorization** — verifying **what** an already-authenticated person is allowed to do.

> **Definition:** Authentication confirms a user's identity. Authorization determines what actions or resources that authenticated user is permitted to access.

### Real-World Example

Logging into a company system with your employee credentials is authentication. Whether you, as a regular employee, can access the admin-only payroll settings (versus an actual administrator) is authorization.

### Important Points

- These are two distinct steps, often confused — a system can correctly authenticate a user's identity while still correctly denying them authorization for a specific action.

---

## 4. JWT (JSON Web Tokens)

### What is it?

A JWT is a compact, digitally signed token commonly used to represent an authenticated user's identity, passed along with API requests — letting a server verify who's making a request without needing to look up a session in a database on every single call.

> **Definition:** A JWT (JSON Web Token) is a signed, self-contained token used to securely transmit information — typically for authentication — between parties.

### Structure of a JWT (Conceptual)

A JWT has three parts, separated by dots: `header.payload.signature`

- **Header** — metadata about the token (e.g., which signing algorithm was used).
- **Payload** — the actual data (e.g., user ID, expiration time) — note this is only **encoded**, not encrypted, so it shouldn't contain secret information.
- **Signature** — a cryptographic signature, generated using a secret key, that proves the token hasn't been tampered with.

### Simple Example — Creating and Verifying a JWT

```bash
pip install pyjwt
```

```python
import jwt
import datetime

SECRET_KEY = "your-secret-key-here"   # in real apps, load this from an environment variable

# Creating a token (typically done at login)
payload = {
    "user_id": 42,
    "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
}
token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
print(token)

# Verifying a token (typically done on every subsequent request)
try:
    decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    print(decoded)   # {'user_id': 42, 'exp': ...}
except jwt.ExpiredSignatureError:
    print("Token has expired")
except jwt.InvalidTokenError:
    print("Invalid token")
```

### Explanation of the Code

- `jwt.encode()` creates the signed token, including an expiration time (`exp`), so it automatically becomes invalid after a set period.
- `jwt.decode()` verifies the token's signature (proving it wasn't tampered with) and checks it hasn't expired, before returning the original payload data.

### Common Mistakes

- Storing sensitive data (like a plain-text password) directly in a JWT's payload — remember, the payload is only encoded, not encrypted, and can be read by anyone who has the token.
- Not setting an expiration time, creating tokens that remain valid indefinitely if ever leaked or stolen.
- Hardcoding the `SECRET_KEY` directly in source code (see Environment Variables, below).

### Important Points

- JWTs are signed (tamper-proof), but **not encrypted** by default — never put secret information in the payload.
- Always set a reasonable expiration time on tokens.

---

## 5. Environment Variables

### What is it?

Environment variables store configuration values (like API keys, database passwords, and secret keys) **outside** of your actual source code — so secrets never end up committed to version control or visible to anyone reading the code.

### Simple Example

```bash
# In a .env file (never committed to Git - add it to .gitignore!)
DATABASE_PASSWORD=supersecretpassword123
API_KEY=abcd1234efgh5678
```

```python
import os
from dotenv import load_dotenv

load_dotenv()   # loads variables from a .env file into the environment

database_password = os.environ.get("DATABASE_PASSWORD")
api_key = os.environ.get("API_KEY")

print(api_key)   # abcd1234efgh5678
```

```bash
pip install python-dotenv
```

### Explanation of the Code

- `load_dotenv()` reads a local `.env` file and makes its contents accessible via `os.environ`, without those actual secret values ever appearing directly in your Python source code.
- `.env` should always be listed in `.gitignore` (from the Git & GitHub file), so it's never accidentally committed and pushed to a public repository.

### Common Mistakes

- Committing a `.env` file to Git, or hardcoding secrets directly in `.py` files.
- Using `os.environ["KEY"]` (which raises an error if missing) instead of `os.environ.get("KEY")` (which safely returns `None` if missing) when a default/fallback is acceptable.

### Important Points

- Never hardcode secrets (passwords, API keys, tokens) directly in source code.
- Always add `.env` to `.gitignore`.

---

## 6. SQL Injection (Recap and Defense)

### What is it?

SQL injection is a vulnerability where an attacker manipulates a database query by injecting malicious input into a field that gets inserted directly into SQL — a topic already introduced in the Database Programming file.

### The Defense — Parameterized Queries

```python
import sqlite3

connection = sqlite3.connect("app.db")
cursor = connection.cursor()

username = input("Enter username: ")

# SAFE: the database driver handles the value separately from the query structure
cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
```

### Explanation

- Using `?` placeholders (or `%s` in some other database libraries) ensures user input is always treated strictly as **data**, never as part of the SQL command's actual structure — completely preventing this class of attack.
- **Never** build a SQL query by directly inserting user input into a string (via f-strings, `.format()`, or plain concatenation).

### Important Points

- Parameterized queries are the standard, complete defense against SQL injection — always use them for any query involving user-supplied input.
- This applies to every database library covered in the Database Programming file (`sqlite3`, MySQL/PostgreSQL connectors, and ORMs like SQLAlchemy handle this automatically).

---

## 7. Cross-Site Scripting (XSS)

### What is it?

XSS is a vulnerability where untrusted user input is displayed on a webpage without being properly handled, potentially letting malicious script content execute in other users' browsers.

> **Definition:** Cross-Site Scripting (XSS) is a vulnerability that allows malicious script content to be injected into web pages viewed by other users, typically due to improperly handled user input.

### The Defense — Escaping Output

Modern web frameworks' templating engines (like Flask's Jinja2, covered in the Web Development file) **automatically escape** output by default, converting special characters into their safe, literal display form rather than executable content.

```python
from flask import render_template_string

user_comment = "<script>alert('test')</script>"

# Jinja2 automatically escapes this safely by default:
render_template_string("<p>{{ comment }}</p>", comment=user_comment)
# Renders literally as text on the page, NOT as an executable script
```

### Important Points

- Always rely on your framework's built-in auto-escaping for displaying user-provided content — avoid manually disabling it (Jinja2's `|safe` filter, for instance) unless you fully understand and control the content's origin.
- Never trust user input to be "just text" — always assume it could contain something unexpected.

---

## 8. Cross-Site Request Forgery (CSRF)

### What is it?

CSRF is a vulnerability where a malicious site tricks a logged-in user's browser into unknowingly submitting a request to a different site where they're authenticated — potentially performing an action (like changing account settings) without the user's actual intent.

### The Defense — CSRF Tokens

Web frameworks defend against this by including a unique, secret **CSRF token** in every form, which the server verifies matches before processing the request — a malicious external site has no way to know or guess this token.

```python
# Flask-WTF example (conceptual)
from flask_wtf import FlaskForm

class UpdateProfileForm(FlaskForm):
    # FlaskForm automatically includes CSRF protection
    pass
```

### Important Points

- Modern web frameworks (Django, Flask with Flask-WTF) provide built-in CSRF protection — enable and use it rather than building your own from scratch.

---

## 9. API Security Essentials

### What is it?

Beyond the specific vulnerabilities above, a few general practices keep APIs secure:

| Practice | Why |
|---|---|
| **Always use HTTPS** | Encrypts data in transit, preventing eavesdropping |
| **Rate limiting** | Prevents abuse (e.g., brute-force login attempts, denial-of-service) |
| **Input validation** | Rejects malformed or unexpected data before it's processed |
| **Least privilege** | Each component/user should have only the access it genuinely needs |
| **Keep dependencies updated** | Older library versions may contain known, publicly documented vulnerabilities |

### Simple Example — Input Validation

```python
def create_user(username, age):
    if not username or len(username) > 50:
        raise ValueError("Invalid username")
    if not isinstance(age, int) or age < 0 or age > 150:
        raise ValueError("Invalid age")
    # proceed only after validation passes
```

**Explanation:** Validating input **before** using it anywhere important (queries, calculations, file operations) is one of the simplest and most effective defensive habits — many vulnerabilities ultimately stem from trusting input that should have been checked first.

---

## Common Beginner Mistakes — Summary for This Section

- Storing passwords in plain text, or using a fast general-purpose hash instead of `bcrypt`.
- Hardcoding secrets (API keys, passwords, JWT secret keys) directly in source code.
- Building SQL queries with string formatting instead of parameterized queries.
- Disabling a framework's automatic output escaping without good reason.
- Skipping input validation, trusting that user input will always be well-formed.

---

## Cheat Sheet — Security

```python
# Password hashing
import bcrypt
hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
bcrypt.checkpw(entered_password.encode(), hashed)

# Environment variables
import os
from dotenv import load_dotenv
load_dotenv()
secret = os.environ.get("SECRET_KEY")

# JWT
import jwt
token = jwt.encode({"user_id": 1, "exp": expiry}, SECRET_KEY, algorithm="HS256")
jwt.decode(token, SECRET_KEY, algorithms=["HS256"])

# SQL injection prevention
cursor.execute("SELECT * FROM table WHERE col = ?", (value,))   # NEVER f-string queries
```

---

## Interview Questions

**Q1. Why should passwords never be stored in plain text?**
Answer: If the database is ever breached, every user's actual password would be immediately exposed, putting not just that application but potentially other services (due to password reuse) at risk.

**Q2. What is the difference between authentication and authorization?**
Answer: Authentication verifies who a user is (identity). Authorization determines what that authenticated user is permitted to do or access.

**Q3. What is a JWT, and is its payload encrypted?**
Answer: A JSON Web Token is a signed, self-contained token used to represent authenticated identity. Its payload is encoded (readable by anyone with the token) and signed (tamper-proof), but not encrypted by default — sensitive data should never be placed directly in a JWT payload.

**Q4. How do parameterized queries prevent SQL injection?**
Answer: They keep user-supplied input strictly separate from the SQL command's structure, so input is always treated as data, never as executable SQL syntax.

**Q5. What is XSS, and how do modern frameworks typically defend against it?**
Answer: Cross-Site Scripting is a vulnerability allowing malicious script content to be injected into pages viewed by other users. Modern templating engines defend against it with automatic output escaping, converting special characters into safe, literal display text by default.

**Q6. Why should secrets (API keys, passwords) be stored in environment variables instead of source code?**
Answer: Hardcoded secrets can be accidentally exposed if the code is shared, committed to a public repository, or seen by unauthorized people — environment variables (loaded from a `.env` file excluded via `.gitignore`) keep secrets separate from the codebase itself.

---

## Practice Questions

**Beginner**
1. Hash a password using `bcrypt` and verify it correctly against both a correct and an incorrect attempt.
2. Create a `.env` file with a sample API key, and load it into a Python script using `python-dotenv`.
3. Write a function that validates a username (non-empty, under 50 characters) before "creating" a user.
4. Explain, in your own words, the difference between authentication and authorization, with your own example.
5. Rewrite an f-string-based SQL query (unsafe) as a parameterized query (safe).

**Intermediate**
1. Create and verify a JWT with a 30-minute expiration time, and demonstrate what happens when you try to decode an expired token.
2. Write an input validation function for a signup form that checks username, email format (using regex from the Regular Expressions file), and age.
3. Explain, in your own words, why storing a JWT secret key directly in source code is a security risk.
4. Research and briefly explain (in comments) what "rate limiting" means and why login endpoints specifically benefit from it.
5. Explain, using your own words, why general-purpose hash functions like plain SHA-256 are considered unsuitable for password hashing compared to `bcrypt`.

**Challenge**
1. Build a simple user registration and login system (using the Database Programming file's SQLite patterns) that hashes passwords with `bcrypt` and never stores plain text.
2. Extend the login system to issue a JWT upon successful login, and write a function that verifies the JWT before allowing access to a "protected" action.
3. Write a short security review (as comments) of the Student Management System mini project from the Database Programming file, identifying at least 3 security improvements it would need before being production-ready (e.g., password hashing, input validation, parameterized queries already in place).
$uu18$, 'markdown',
  jsonb_build_object('source', 'python_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'python_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Deployment & DevOps
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = 'advanced-python-career-readiness'),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $uu19$Deployment & DevOps$uu19$, $uu20$deployment-devops$uu20$, $uu21$Linux basics, production environment variables, Docker and Dockerfiles, Docker Compose, CI/CD with GitHub Actions, cloud deployment platforms (AWS/Azure/GCP) and options (VMs, PaaS, containers, serverless), Nginx as a reverse proxy, production configuration essentials, monitoring, and a beginner-friendly deployment path.$uu21$, 29,
    'published', true, true, 'python_tutorial', $uu22$advanced-python-career-readiness/deployment-devops$uu22$
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
select up_topic.id, '', $uu23$Writing an application is only half the journey — getting it running reliably on a real server, accessible to real users, is the other half. This file covers the essential deployment and DevOps concepts every developer should know, from basic Linux commands through Docker, CI/CD, and cloud deployment.

---

## 1. What is Deployment and DevOps?

### What is it?

- **Deployment** means taking your finished application and making it available for real users to actually use — typically on a server, rather than your own laptop.
- **DevOps** (Development + Operations) is the broader set of practices and tools for building, testing, deploying, and monitoring applications reliably and repeatedly.

> **Definition:** DevOps is a set of practices combining software development and IT operations, aiming to shorten the development lifecycle and deliver reliable software continuously.

---

## 2. Linux Basics

### What is it?

Most servers run Linux, so basic command-line familiarity is essential for deployment work.

### Essential Commands

```bash
pwd                   # print current directory
ls                     # list files in current directory
ls -la                  # list files, including hidden ones, with details
cd folder_name          # change directory
mkdir new_folder         # create a new folder
rm file.txt               # delete a file
rm -rf folder_name         # delete a folder and everything inside it (be careful!)
cat file.txt                # display a file's contents
grep "search_term" file.txt   # search for text within a file
chmod +x script.sh             # make a file executable
ps aux                           # list running processes
kill <process_id>                 # stop a running process
sudo command                       # run a command with administrator privileges
```

### Common Mistakes

- Using `rm -rf` carelessly — like `shutil.rmtree()` from the Automation file, this permanently deletes with no confirmation and no undo.
- Forgetting `sudo` is required for commands needing administrator privileges (like installing system-wide software).

### Important Points

- Comfort with basic Linux commands is essential for working with servers, Docker containers, and most cloud deployment platforms.

---

## 3. Environment Variables in Production (Recap)

As covered in the Security file, sensitive configuration (database passwords, API keys, secret keys) should always be stored as environment variables — never hardcoded. In production, these are typically set directly on the server or cloud platform's configuration panel, rather than in a local `.env` file.

```bash
export DATABASE_URL="postgresql://user:password@host:5432/dbname"
export SECRET_KEY="your-production-secret-key"
```

### Important Points

- Production environment variables are usually configured through your hosting platform's dashboard or configuration files, not committed `.env` files.

---

## 4. Docker

### What is it?

Docker packages an application together with everything it needs to run (code, dependencies, system libraries) into a single, portable **container** — ensuring it runs identically on any machine, eliminating the classic "it works on my machine" problem.

> **Definition:** Docker is a platform for packaging an application and its dependencies into a lightweight, portable container that runs consistently across different environments.

### Writing a `Dockerfile`

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "app.py"]
```

### Explanation of the Code

- `FROM python:3.12-slim` starts from an existing, pre-built image containing Python already installed.
- `WORKDIR /app` sets the working directory inside the container.
- `COPY requirements.txt .` followed by `RUN pip install ...` installs dependencies **before** copying the rest of the code — this ordering lets Docker reuse this step from a cache if only your code (not dependencies) changed, speeding up rebuilds.
- `EXPOSE 5000` documents which port the application listens on.
- `CMD [...]` specifies the command that runs when the container starts.

### Building and Running a Docker Container

```bash
docker build -t my-python-app .
docker run -p 5000:5000 my-python-app
```

**Explanation:** `docker build` creates an image from the `Dockerfile`. `docker run -p 5000:5000` starts a container from that image, mapping port 5000 on your machine to port 5000 inside the container.

### Docker Compose — Running Multiple Services Together

```yaml
# docker-compose.yml
version: "3.9"
services:
  web:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/mydb
    depends_on:
      - db
  db:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=password
```

```bash
docker-compose up
```

**Explanation:** Real applications often need multiple pieces working together (a web app **and** a database). Docker Compose defines and starts them all together with a single command, and `depends_on` ensures the database starts before the web application that needs it.

### Common Mistakes

- Forgetting to add a `.dockerignore` file (similar to `.gitignore`), accidentally including unnecessary files (like a local `venv/` folder) in the container image, bloating it unnecessarily.
- Hardcoding secrets directly in a `Dockerfile` instead of passing them as environment variables at runtime.

### Important Points

- Docker ensures consistency between development, testing, and production environments.
- Docker Compose is the standard tool for running multi-service applications (e.g., a web app plus a database) together during development.

---

## 5. CI/CD (Continuous Integration / Continuous Deployment)

### What is it?

- **Continuous Integration (CI)** — automatically running tests (from the Testing file) every time code is pushed, catching bugs before they merge into the main codebase.
- **Continuous Deployment (CD)** — automatically deploying code to production once it passes all checks, without manual, error-prone deployment steps.

> **Definition:** CI/CD is a set of practices that automates testing and deployment, ensuring code changes are verified and delivered to production quickly and reliably.

### Simple Example — GitHub Actions Workflow

**File: `.github/workflows/test.yml`**
```yaml
name: Run Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Run tests
        run: pytest
```

### Explanation of the Code

- `on: push` / `pull_request` triggers this workflow automatically whenever code is pushed or a Pull Request is opened against `main`.
- Each `step` runs one action: checking out the code, setting up Python, installing dependencies, and finally running the test suite (from the Testing file) with `pytest`.
- If any step fails (especially the tests), GitHub marks the check as failed, visibly warning the team **before** broken code gets merged.

### Real-World Example

A team's CI/CD pipeline might automatically run the full test suite on every Pull Request, then — if all tests pass and the PR is merged — automatically build a Docker image and deploy it to production, entirely without manual intervention.

### Important Points

- CI catches bugs early, before they reach `main` or production.
- CD automates the actual deployment process, reducing manual errors and speeding up how quickly working code reaches users.

---

## 6. Cloud Deployment Platforms

### What is it?

Cloud platforms provide the actual servers, storage, and infrastructure needed to run your application, without you needing to own or physically manage hardware.

### The Major Providers

| Provider | Notes |
|---|---|
| **AWS (Amazon Web Services)** | The largest, most widely used cloud platform, with an enormous range of services |
| **Azure (Microsoft)** | Popular in enterprises already using Microsoft's ecosystem |
| **Google Cloud Platform (GCP)** | Strong in data analytics and machine learning services |

### Common Deployment Options (Conceptual)

| Approach | Description |
|---|---|
| **Virtual Machines** (e.g., AWS EC2) | A full remote computer you configure and manage yourself |
| **Platform-as-a-Service** (e.g., AWS Elastic Beanstalk, Azure App Service) | Upload your code; the platform handles servers, scaling, and infrastructure |
| **Containers** (e.g., AWS ECS, Google Cloud Run) | Deploy your Docker container directly, with the platform managing the underlying infrastructure |
| **Serverless** (e.g., AWS Lambda) | Deploy individual functions that run only when triggered, without managing a server at all |

### Important Points

- Beginners typically start with a simpler Platform-as-a-Service option before managing raw virtual machines directly.
- All three major cloud providers offer broadly similar core services, differing mainly in naming, pricing, and their surrounding ecosystems.

---

## 7. Nginx (Reverse Proxy)

### What is it?

Nginx is a widely used web server, most commonly deployed in front of a Python application as a **reverse proxy** — receiving incoming web traffic and forwarding it to your actual application server.

> **Definition:** A reverse proxy is a server that sits between clients and your application, forwarding requests and often handling tasks like load balancing, SSL encryption, and serving static files.

### Simple Example — Basic Nginx Configuration

```nginx
server {
    listen 80;
    server_name myapp.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
    }
}
```

### Explanation

- This configuration tells Nginx: "any request coming in on port 80 for `myapp.com` should be forwarded to the actual Python application running on port 5000."
- In real production deployments, Nginx also commonly handles HTTPS/SSL, serving static files efficiently, and load-balancing traffic across multiple application instances.

### Important Points

- Development servers (like Flask's built-in server) aren't designed for production traffic — a reverse proxy like Nginx, paired with a proper production application server, is standard practice.

---

## 8. Production Configuration Essentials

### Key Checklist

- **Turn off debug mode** — Flask's `debug=True` (from the Web Development file) must **never** be enabled in production; it can expose sensitive internal details.
- **Use environment variables for all secrets** — never hardcoded values (covered in the Security file).
- **Use a proper production server** — e.g., `gunicorn` for Flask/Django, rather than the framework's built-in development server.
- **Enable proper logging** — using the `logging` module (from the Debugging & Logging file), not `print()`.
- **Set up HTTPS** — encrypting traffic between users and your server.

### Simple Example — Running with Gunicorn

```bash
pip install gunicorn
gunicorn app:app --bind 0.0.0.0:8000 --workers 4
```

**Explanation:** `gunicorn` is a production-grade WSGI server, far more robust and performant than Flask's built-in development server. `--workers 4` runs 4 separate worker processes, allowing the application to handle multiple requests genuinely in parallel.

---

## 9. Monitoring

### What is it?

Once deployed, monitoring tools continuously check that your application is running correctly, alerting you the moment something goes wrong — extending the error-tracking concept introduced in the Debugging & Logging file.

### Key Practices

- **Uptime monitoring** — automated tools that regularly check if your application is responding, alerting you immediately if it goes down.
- **Error tracking** — tools (like Sentry, mentioned in the Debugging & Logging file) that automatically capture and report exceptions happening in production.
- **Performance monitoring** — tracking response times and resource usage to catch performance degradation before it seriously affects users.

### Important Points

- Monitoring turns "a user complains something is broken" into "the team is alerted the instant something breaks" — a critical difference for professional, reliable software.

---

## 10. A Beginner-Friendly Deployment Path

For a first deployment, a reasonable, approachable path looks like:

1. Develop and test your application locally, using a virtual environment (from the Environment & Package Management file).
2. Write tests (from the Testing file) and set up a simple CI workflow (GitHub Actions) to run them automatically.
3. Containerize the application with a `Dockerfile`.
4. Deploy using a beginner-friendly Platform-as-a-Service option (many offer free tiers for learning projects) rather than manually configuring raw virtual machines.
5. Set environment variables through the platform's dashboard (never hardcoded).
6. Add basic logging and, once comfortable, an error-tracking tool.

---

## Common Beginner Mistakes — Summary for This Section

- Leaving debug mode enabled in a production deployment.
- Hardcoding secrets instead of using environment variables in production configuration.
- Using a framework's built-in development server for real production traffic.
- Deploying without any automated tests or CI checks in place.
- Skipping monitoring entirely, only finding out about outages when users complain.

---

## Cheat Sheet — Deployment & DevOps

```bash
# Linux basics
ls -la; cd folder; mkdir folder; rm -rf folder; cat file; grep "term" file

# Docker
docker build -t app-name .
docker run -p 5000:5000 app-name
docker-compose up

# Production server (instead of the framework's dev server)
gunicorn app:app --bind 0.0.0.0:8000 --workers 4
```

```yaml
# GitHub Actions CI (.github/workflows/test.yml)
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
      - run: pip install -r requirements.txt
      - run: pytest
```

---

## Interview Questions

**Q1. What is the difference between Continuous Integration and Continuous Deployment?**
Answer: Continuous Integration automatically runs tests whenever code changes are pushed, catching bugs early. Continuous Deployment automatically deploys code to production once it passes all checks, without manual intervention.

**Q2. What problem does Docker solve?**
Answer: It packages an application with all its dependencies into a portable container, ensuring it runs identically across different environments (development, testing, production), eliminating "it works on my machine" issues.

**Q3. Why shouldn't a framework's built-in development server (like Flask's) be used in production?**
Answer: Development servers aren't designed for production-level traffic, concurrency, or security — a proper production server (like Gunicorn), often paired with a reverse proxy (like Nginx), is standard practice.

**Q4. What is a reverse proxy, and why is Nginx commonly used as one?**
Answer: A reverse proxy sits between incoming client requests and your actual application server, forwarding traffic and often handling tasks like HTTPS, load balancing, and serving static files. Nginx is a widely used, reliable choice for this role.

**Q5. Why is monitoring important after deployment?**
Answer: It alerts the team immediately when something breaks in production (uptime issues, errors, performance degradation), rather than relying on users to notice and report problems.

---

## Practice Questions

**Beginner**
1. Write a basic `Dockerfile` for a simple Python script that prints "Hello, World!"
2. Practice basic Linux commands: create a folder, create a file inside it, list its contents, then delete the folder.
3. Write a simple GitHub Actions workflow that installs dependencies and runs `pytest` on every push.
4. Explain, in your own words, the difference between a virtual machine and a serverless deployment.
5. Set an environment variable in your terminal and access it from a Python script using `os.environ`.

**Intermediate**
1. Containerize a simple Flask application with a `Dockerfile`, build the image, and run it locally.
2. Write a `docker-compose.yml` file that runs a Flask app alongside a PostgreSQL database.
3. Extend a GitHub Actions workflow to also check code style/linting before running tests.
4. Write a basic Nginx configuration that proxies requests to a Python application running on port 8000.
5. Explain, in your own words, the beginner-friendly deployment path outlined in this file, and identify which step you'd need to learn more about first.

**Challenge**
1. Fully containerize the Blog Application mini project from the Web Development file, including a `docker-compose.yml` for the app and its database.
2. Set up a complete CI pipeline (GitHub Actions) that runs tests on every Pull Request and blocks merging if tests fail.
3. Research (and summarize in your own words) the tradeoffs between deploying to a Platform-as-a-Service versus a raw virtual machine versus a serverless function, for a small personal project versus a large production application.
$uu23$, 'markdown',
  jsonb_build_object('source', 'python_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'python_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Roadmap, Career Paths & Placement Prep
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = 'advanced-python-career-readiness'),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $uu24$Roadmap, Career Paths & Placement Prep$uu24$, $uu25$roadmap-career-paths-placement-prep$uu25$, $uu26$The complete course wrap-up: a recommended learning roadmap, 7 career paths (Python Developer, Backend, Data Analyst, Data Scientist, ML Engineer, AI Engineer, Automation Engineer) each mapped to required topics and projects, a 40-project portfolio table across 4 difficulty tiers, a full placement-preparation reference (core-concept, coding, OOP, data-structure, SQL, API, ML, and debugging interview questions, output-based "what will this print" questions, and coding challenges), and a 30-day interview-prep plan.$uu26$, 30,
    'published', true, true, 'python_tutorial', $uu27$advanced-python-career-readiness/roadmap-career-paths-placement-prep$uu27$
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
select up_topic.id, '', $uu28$Congratulations on making it through the entire course. This final file ties everything together: a recommended learning roadmap, career paths matched to your interests, a full project portfolio to build your resume, and a complete placement preparation section — including a 30-day interview prep plan.

---

## 1. The Python Learning Roadmap

```
Beginner
   ↓
Intermediate
   ↓
Advanced
   ↓
Projects
   ↓
Specialization
   ↓
Portfolio
   ↓
Interview Preparation
   ↓
Job Ready
```

### Recommended Learning Order

1. **Beginner** — Files 01-09: Fundamentals, Conditionals, Loops, Data Structures, Strings, Functions, Modules, File Handling, Exception Handling. Master these completely before moving on — everything else builds on this foundation.
2. **Intermediate** — Files 10-13: OOP (critical — spend real time here), Intermediate Python, Regular Expressions, Environment & Package Management.
3. **Advanced** — Files 14-19: Database Programming, APIs & HTTP, Web Development, Testing, Debugging & Logging, Git & GitHub. This is where you become genuinely job-capable.
4. **Projects** — Start building real projects (see the Project Portfolio below) as soon as you finish the Intermediate stage — don't wait until you've "learned everything."
5. **Specialization** — Files 20-25: Data Analysis, Web Scraping, Automation, Machine Learning, Deep Learning, AI & Generative AI. Pick the specialization matching your chosen Career Path (below) and go deeper there.
6. **Portfolio** — Polish 3-5 strong projects that demonstrate your specialization, with clean code, a good README, and hosted on GitHub.
7. **Interview Preparation** — Use the Placement Preparation section below, alongside the 30-day plan.
8. **Job Ready** — Apply, interview, and keep building.

### Important Note on Files 26-29

Advanced Python, Concurrency & Performance, Security, and Deployment & DevOps (files 26-29) are valuable for deepening your understanding and for mid-to-senior interviews, but aren't strictly required before your first job applications — treat them as a second pass once you're comfortable with everything else.

---

## 2. Career Paths

### 2.1 Python Developer (General)

- **Required Python Topics:** Files 01-13 (Fundamentals through Environment & Package Management), plus Testing and Git & GitHub.
- **Additional Technologies:** SQL basics, basic Linux command line.
- **Recommended Projects:** Calculator, Student Marks Manager, Expense Tracker, Student Record Management System.
- **Skills Required:** Strong fundamentals, clean code habits, Git workflow.
- **Suggested Learning Order:** Beginner → Intermediate → Testing/Git → build 3-4 portfolio projects.

### 2.2 Backend Developer

- **Required Python Topics:** All of Career Path 2.1, plus Database Programming, APIs & HTTP, Web Development (Flask/Django/FastAPI), Security basics.
- **Additional Technologies:** SQL (in depth), Docker basics, one cloud platform's basics.
- **Recommended Projects:** Blog Application, a REST API for a resource of your choice (e.g., a task manager), Weather API Application.
- **Skills Required:** API design, database modeling, authentication/authorization concepts.
- **Suggested Learning Order:** Backend-relevant Beginner/Intermediate files → Database Programming → APIs & HTTP → Web Development → Security → Deployment & DevOps.

### 2.3 Data Analyst

- **Required Python Topics:** Files 01-09 (core fundamentals), Data Analysis (NumPy, Pandas, Matplotlib, Seaborn), SQL fundamentals (from Database Programming).
- **Additional Technologies:** Excel/`openpyxl`, a BI tool (like Power BI or Tableau — outside this course's scope, but commonly paired with Python skills).
- **Recommended Projects:** Student Performance Analysis, a sales/business dataset analysis, an automated Excel report generator.
- **Skills Required:** Data cleaning, statistical thinking, clear data visualization, SQL querying.
- **Suggested Learning Order:** Fundamentals → Data Analysis → SQL (Database Programming) → Automation (Excel) → build analysis portfolio projects using real public datasets.

### 2.4 Data Scientist

- **Required Python Topics:** Everything in the Data Analyst path, plus Machine Learning in depth, and Statistics fundamentals (from the Standard Library `statistics` module and beyond).
- **Additional Technologies:** Jupyter Notebooks, deeper statistics knowledge, SQL.
- **Recommended Projects:** Student Performance Prediction, a classification project on a public dataset (e.g., predicting customer churn), a clustering project (customer segmentation).
- **Skills Required:** Statistical reasoning, feature engineering, model evaluation, clear communication of findings.
- **Suggested Learning Order:** Data Analyst path → Machine Learning (deep dive) → build 3-4 ML projects on real public datasets → learn to present findings clearly.

### 2.5 Machine Learning Engineer

- **Required Python Topics:** Machine Learning and Deep Learning in depth, plus Web Development (for model deployment via an API), Docker, Testing.
- **Additional Technologies:** Scikit-learn, TensorFlow/PyTorch, Docker, a cloud platform's ML services.
- **Recommended Projects:** Student Performance Prediction (extended into a deployed API), an image classification project using a CNN, a deployed ML model behind a FastAPI endpoint.
- **Skills Required:** ML fundamentals, model deployment, API design, basic DevOps.
- **Suggested Learning Order:** Machine Learning → Deep Learning → Web Development (FastAPI) → Deployment & DevOps → build and deploy at least one full ML pipeline, from data to a live API.

### 2.6 AI Engineer

- **Required Python Topics:** Machine Learning fundamentals, Deep Learning fundamentals, AI & Generative AI in depth, Web Development (for building AI-powered applications).
- **Additional Technologies:** LLM APIs, vector databases, LangChain (or similar), prompt engineering practice.
- **Recommended Projects:** AI Chatbot (extended with RAG), a document Q&A tool, an AI agent with custom tools.
- **Skills Required:** Prompt engineering, understanding of embeddings/RAG, API integration, careful handling of AI limitations (hallucination awareness).
- **Suggested Learning Order:** Machine Learning basics → Deep Learning basics → AI & Generative AI (deep dive) → build 2-3 real LLM-powered applications.

### 2.7 Automation Engineer

- **Required Python Topics:** Files 01-13 (core fundamentals), Automation, Web Scraping, File Handling in depth.
- **Additional Technologies:** Selenium, `openpyxl`, task scheduling (cron/Task Scheduler), basic API integration.
- **Recommended Projects:** File organizer automation tool, an Excel report generator, a web scraper with scheduled runs, a browser automation script for a repetitive task.
- **Skills Required:** Practical problem-solving, attention to edge cases (automation scripts run unattended, so they must handle errors gracefully), file/data handling.
- **Suggested Learning Order:** Fundamentals → File Handling → Automation → Web Scraping → build 3-4 real automation tools solving actual repetitive tasks (yours or a business's).

---

## 3. Final Project Portfolio

### Beginner Projects (10)

| # | Project | Objective | Technologies | Key Concepts | Difficulty |
|---|---|---|---|---|---|
| 1 | Simple Calculator | Perform basic arithmetic from user input | Core Python | Variables, operators, conditionals | Easy |
| 2 | Number Guessing Game | Guess a random number within limited attempts | Core Python | Loops, conditionals, `random` | Easy |
| 3 | To-Do List (in-memory) | Add/view/remove tasks during a session | Core Python | Lists, functions, loops | Easy |
| 4 | Unit Converter | Convert between units (temperature, length, etc.) | Core Python | Functions, conditionals | Easy |
| 5 | Password Strength Checker | Rate a password's strength | Core Python, regex | Strings, `re` module | Easy |
| 6 | Simple Quiz App | Ask questions, score the user | Core Python | Lists, dictionaries, loops | Easy |
| 7 | Contact Book (in-memory) | Store and search contacts | Core Python | Dictionaries, functions | Easy |
| 8 | Rock-Paper-Scissors Game | Play against the computer | Core Python | Conditionals, `random` | Easy |
| 9 | Basic Alarm Clock | Alert at a specified time | Core Python, `time`/`datetime` | Modules, loops | Easy |
| 10 | Word Counter | Count words/characters in text | Core Python, strings | String methods, file handling | Easy |

### Intermediate Projects (10)

| # | Project | Objective | Technologies | Key Concepts | Difficulty |
|---|---|---|---|---|---|
| 1 | Student Record Management System | Persist student data between runs | File Handling, JSON | Functions, JSON, persistence | Medium |
| 2 | Expense Tracker (persistent) | Track expenses with saved history | File Handling, CSV/JSON | Functions, file I/O | Medium |
| 3 | Weather API Application | Fetch and display real weather data | `requests`, an external API | APIs, JSON, error handling | Medium |
| 4 | Blog Application | A basic web-based blog | Flask, SQLite, templates | Web dev, database, templating | Medium |
| 5 | Bank Account Management System | Simulate account operations with OOP | Core Python, OOP | Classes, inheritance, encapsulation | Medium |
| 6 | Student Performance Analysis | Analyze and visualize exam data | Pandas, Matplotlib/Seaborn | Data analysis, visualization | Medium |
| 7 | Simple Web Scraper | Extract data from a sample site | `requests`, BeautifulSoup | Web scraping, data extraction | Medium |
| 8 | File Organizer Automation | Auto-sort files by type | `os`, `shutil` | Automation, file handling | Medium |
| 9 | REST API for a Resource | Build a CRUD API (e.g., tasks) | Flask/FastAPI | REST APIs, routing | Medium |
| 10 | Basic Chat Application (local) | Two users messaging via terminal/sockets | Core Python, `socket` (optional extension topic) | Networking basics, loops | Medium |

### Advanced Projects (10)

| # | Project | Objective | Technologies | Key Concepts | Difficulty |
|---|---|---|---|---|---|
| 1 | Student Management System | Full CRUD system with a real database | SQLite/SQLAlchemy | Database programming, CRUD | Hard |
| 2 | E-commerce Backend API | Products, cart, orders as REST endpoints | Flask/FastAPI, database | Web dev, database, auth | Hard |
| 3 | Student Performance Prediction | Predict pass/fail using ML | Scikit-learn, Pandas | Machine learning | Hard |
| 4 | AI Chatbot with RAG | Chatbot answering from custom documents | LLM API, embeddings | AI, RAG, APIs | Hard |
| 5 | Automated Report Generator | Pull data, generate a formatted Excel/PDF report | `openpyxl`/PDF libraries, database | Automation, database | Hard |
| 6 | Job Listings Scraper | Scrape and store listings from multiple pages | BeautifulSoup, Selenium, database | Web scraping, pagination, storage | Hard |
| 7 | Personal Finance Dashboard | Track and visualize spending trends over time | Pandas, Flask, charts | Data analysis, web dev | Hard |
| 8 | Image Classifier | Classify images using a CNN | TensorFlow/Keras or PyTorch | Deep learning | Hard |
| 9 | Dockerized Web Application | Fully containerized deployable app | Docker, Flask/FastAPI, CI/CD | Deployment, DevOps | Hard |
| 10 | Task Automation Suite | Combine file, Excel, and email automation into one tool | `os`, `openpyxl`, `smtplib` | Automation (comprehensive) | Hard |

### Final-Year / Major Projects (10)

| # | Project | Objective | Technologies | Key Concepts | Difficulty |
|---|---|---|---|---|---|
| 1 | Full-Stack Student Management Platform | Complete system: web UI, database, auth, admin roles | Django or Flask, database, authentication | Full-stack web dev | Very Hard |
| 2 | AI-Powered Resume Screening Tool | Analyze resumes against job descriptions using NLP/LLMs | AI & Generative AI, embeddings, file parsing | AI, document processing | Very Hard |
| 3 | E-commerce Platform with Payment Integration | Full shopping platform with cart, orders, and payment flow | Django/Flask, database, REST APIs | Full-stack, APIs, security | Very Hard |
| 4 | Real-Time Data Dashboard | Live-updating dashboard from a streaming/data source | Pandas, Flask/FastAPI, WebSockets (extension topic) | Data analysis, web dev | Very Hard |
| 5 | Machine Learning Model Deployment Pipeline | End-to-end: train, evaluate, deploy, monitor a model via API | Scikit-learn, FastAPI, Docker | ML, deployment, DevOps | Very Hard |
| 6 | Automated Job Application Bot | Scrape listings, auto-fill applications responsibly | Selenium, web scraping, automation | Automation, ethics/responsibility | Very Hard |
| 7 | AI Study Assistant / Tutor Chatbot | Subject-specific tutoring chatbot with RAG over course material | AI & Generative AI, RAG, vector databases | AI application development | Very Hard |
| 8 | Hospital/Clinic Management System | Patient records, appointments, billing | Django, database, authentication | Full-stack, database design | Very Hard |
| 9 | Sentiment Analysis Dashboard | Analyze and visualize sentiment from a text dataset (e.g., reviews) | ML/NLP, Pandas, visualization, Flask | ML, data analysis, web dev | Very Hard |
| 10 | Complete DevOps Pipeline for a Web App | Full CI/CD: automated tests, Docker build, cloud deployment | GitHub Actions, Docker, cloud platform | DevOps, deployment | Very Hard |

---

## 4. Placement Preparation

### 4.1 Python Interview Questions — Core Concepts

1. What is the difference between a list and a tuple? *(List: mutable; Tuple: immutable.)*
2. What is the difference between `==` and `is`? *(Value equality vs identity/same-object check.)*
3. What are `*args` and `**kwargs` used for? *(Flexible positional/keyword arguments.)*
4. What is a decorator? *(A function that wraps another to extend its behavior.)*
5. What is the difference between deep copy and shallow copy? *(Shallow copies references to nested objects; deep copy recursively copies everything.)*
6. What is a generator, and how does it differ from a regular function? *(Uses `yield`, produces values lazily one at a time.)*
7. What is the GIL? *(CPython's lock allowing only one thread to execute Python bytecode at a time.)*
8. What is the difference between `@staticmethod` and `@classmethod`? *(Static takes neither `self` nor `cls`; class method takes `cls`.)*
9. What are Python's mutable and immutable data types? *(Mutable: list, dict, set. Immutable: int, float, str, tuple.)*
10. What is monkey patching? *(Dynamically modifying a class or module at runtime.)*

### 4.2 Coding Questions

1. Reverse a string without using slicing.
2. Check if a string is a palindrome.
3. Find the factorial of a number, iteratively and recursively.
4. Find the second-largest number in a list without using `sorted()`.
5. Remove duplicates from a list while preserving order.
6. Check if two strings are anagrams.
7. Find the missing number in a list of consecutive integers.
8. Count the frequency of each word in a sentence.
9. Implement FizzBuzz (print "Fizz"/"Buzz"/"FizzBuzz" for multiples of 3/5/both from 1 to 100).
10. Flatten a nested list (a list containing other lists) into a single flat list.

### 4.3 OOP Questions

1. Explain the four pillars of OOP with examples (Encapsulation, Inheritance, Polymorphism, Abstraction).
2. What is method overriding, and how is it different from method overloading?
3. What is the purpose of the `super()` function?
4. What is multiple inheritance, and what complications can it introduce?
5. What is an abstract class, and when would you use one?

### 4.4 Data Structure Questions

1. When would you choose a set over a list?
2. How does a dictionary achieve fast lookups internally (conceptually, hashing)?
3. What is the time complexity of accessing an item in a list by index, versus searching for a value in a list?
4. Explain the difference between a stack and a queue (conceptually — Python lists can implement both).
5. How would you implement a simple stack using a Python list?

### 4.5 SQL Questions

1. What is the difference between `INNER JOIN` and `LEFT JOIN`?
2. Write a query to find the second-highest salary from an `employees` table.
3. What is the difference between `WHERE` and `HAVING`?
4. What is a primary key versus a foreign key?
5. What is database normalization, and why is it useful?

### 4.6 API Questions

1. What is the difference between REST and a simple HTTP endpoint?
2. What status code would you return for a successful resource creation? *(201)*
3. How would you secure an API endpoint?
4. What is the difference between `PUT` and `PATCH`?
5. How does a client typically authenticate with a REST API?

### 4.7 Basic ML Questions

1. What is overfitting, and how can it be addressed?
2. What is the difference between supervised and unsupervised learning?
3. What is a confusion matrix?
4. Why is a train/test split necessary?
5. What is feature engineering, and why does it matter?

### 4.8 Debugging Questions

1. How would you approach debugging a function that returns incorrect results intermittently?
2. What does a Python traceback tell you, and how should you read it?
3. What is the difference between a syntax error and a runtime exception?
4. How would you use `pdb` to inspect a variable's value mid-execution?
5. What logging level would you use for a message that indicates a potential problem, but doesn't stop the program? *(WARNING)*

### 4.9 Output-Based Questions (What Will This Print?)

Try to answer each before checking — these test close attention to Python's specific behaviors.

**Q1:**
```python
print(2 == 2.0)
```
*Answer:* `True` (value equality, regardless of `int` vs `float` type)

**Q2:**
```python
x = [1, 2, 3]
y = x
y.append(4)
print(x)
```
*Answer:* `[1, 2, 3, 4]` (`y` and `x` reference the same list object)

**Q3:**
```python
def add_item(item, items=[]):
    items.append(item)
    return items

print(add_item("a"))
print(add_item("b"))
```
*Answer:* `['a']` then `['a', 'b']` — a classic Python gotcha: a mutable default argument is created only **once** and persists across calls.

**Q4:**
```python
print("5" + "5")
print(5 + 5)
```
*Answer:* `"55"` then `10` — `+` concatenates strings but adds numbers.

**Q5:**
```python
for i in range(3):
    pass
else:
    print("Done")
```
*Answer:* `Done` — the loop-`else` runs because the loop completed without a `break`.

### 4.10 Multiple Choice Questions (MCQs)

**Q1.** Which of these is immutable in Python?
A) List  B) Dictionary  C) Tuple  D) Set
*Answer: C*

**Q2.** What does `len([1, 2, [3, 4]])` return?
A) 4  B) 3  C) 2  D) Error
*Answer: B (the nested list counts as ONE item)*

**Q3.** Which keyword is used to handle exceptions in Python?
A) catch  B) except  C) handle  D) rescue
*Answer: B*

**Q4.** What is the output of `bool("False")`?
A) True  B) False  C) Error  D) None
*Answer: A (any non-empty string is truthy, regardless of its content)*

**Q5.** Which module is used for regular expressions in Python?
A) regex  B) re  C) pattern  D) match
*Answer: B*

### 4.11 Coding Challenges

1. Given a list of student dictionaries (`name`, `marks`), return the top 3 students by marks.
2. Given a string, find the first non-repeating character.
3. Merge two sorted lists into one sorted list, without using `sorted()`.
4. Given a list of integers, find all pairs that sum to a target value.
5. Implement a simple LRU cache from scratch (without using `functools.lru_cache`), using a dictionary and a list to track usage order.

---

## 5. 30-Day Python Interview Preparation Plan

| Days | Focus |
|---|---|
| 1-3 | Core fundamentals review: variables, data types, operators, conditionals, loops |
| 4-6 | Data structures deep dive: lists, tuples, sets, dictionaries + practice problems |
| 7-9 | Strings and functions: practice string manipulation and function-based problems |
| 10-12 | OOP deep dive: classes, inheritance, polymorphism, encapsulation, abstraction |
| 13-14 | File handling, exception handling: practice with real file-based mini scripts |
| 15-16 | Intermediate Python: generators, decorators, closures — practice explaining these clearly out loud |
| 17-18 | SQL practice: CRUD, joins, group by — practice writing queries by hand |
| 19-20 | APIs: practice `requests`, building a small Flask/FastAPI endpoint |
| 21 | Testing and Git: write tests for a past project, practice a full Git workflow |
| 22-24 | Data structure & algorithm coding practice: focus on the classic problems (Section 4.2 and 4.11 above) |
| 25-26 | Mock interview practice: explain your best 2 projects out loud, anticipate follow-up questions |
| 27 | Review all "Output-Based" and MCQ-style questions across every file's chapter-end sections |
| 28 | Polish your GitHub profile, README files, and resume project descriptions |
| 29 | Full mock interview (with a friend, mentor, or by recording yourself) covering technical + project questions |
| 30 | Light review only — re-read your own notes, rest well, stay calm and confident |

### Final Advice

- Prioritize genuinely **understanding** concepts over memorizing answers — interviewers can easily tell the difference, especially with follow-up questions.
- Be ready to **explain your own projects** in detail — what problem it solved, what you'd improve, and why you made specific technical choices.
- Practice explaining technical concepts **out loud**, not just silently reading — interviews are a spoken, interactive format.
- It's completely fine to say "I'm not sure, but here's how I'd approach figuring it out" — interviewers value structured thinking over pretending to know everything.

---

**This concludes the complete Python Programming Course.** You've covered everything from `print("Hello, World!")` through building AI-powered applications, databases, deployment pipelines, and a full placement-preparation plan. The path from here is consistent practice: build real projects, contribute to something, and keep coding regularly. Good luck!
$uu28$, 'markdown',
  jsonb_build_object('source', 'python_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'python_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- ===========================================================================
-- 4. MOCK TESTS + QUESTIONS — one 10-question, 10-minute test per topic that
--    has one (4 of the 5 topics here; topic 30 deliberately has none — see
--    header note).
-- ===========================================================================

-- Advanced Python — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'advanced-python-career-readiness/advanced-python')
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-py-advanced-python', $uu29$Advanced Python - Quick Test$uu29$, 'aptitude', 10, 10,
  $uu30$10 questions covering type hints, @dataclass, Protocol/duck typing, descriptors, metaclasses, functools.wraps, functools.partial, and Python's memory management.$uu30$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $uu31$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$uu31$, true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-py-advanced-python-1', 'pt-py-advanced-python',
   $uu32$Are Python type hints enforced at runtime by default?$uu32$,
   $uu33$["Yes, always", "No — they're informational unless checked by a tool like mypy", "Only for functions", "Only for classes"]$uu33$::jsonb,
   1, $uu34$Python itself never enforces type hints at runtime — calling a function with the "wrong" type still runs; enforcement requires a separate static checker like mypy or a validation library.$uu34$, 1, 0),
  ('tq-py-advanced-python-2', 'pt-py-advanced-python',
   $uu35$What does the @dataclass decorator automatically generate?$uu35$,
   $uu36$["Only __init__", "__init__, __repr__, and __eq__ based on type-hinted attributes", "A full test suite", "A database schema"]$uu36$::jsonb,
   1, $uu37$@dataclass reads a class's type-hinted attributes and generates __init__, __repr__, and __eq__ from them, removing the need to write that boilerplate by hand.$uu37$, 1, 1),
  ('tq-py-advanced-python-3', 'pt-py-advanced-python',
   $uu38$What is structural typing (used by Protocol) informally known as?$uu38$,
   $uu39$["Strong typing", "Duck typing", "Static typing", "Weak typing"]$uu39$::jsonb,
   1, $uu40$Protocol checks whether an object has the right shape (methods/attributes), regardless of its actual class — the classic "if it walks like a duck" idea, informally called duck typing.$uu40$, 1, 2),
  ('tq-py-advanced-python-4', 'pt-py-advanced-python',
   $uu41$What underlying mechanism powers Python's @property decorator?$uu41$,
   $uu42$["Metaclasses", "Descriptors", "Generators", "Decorators from functools"]$uu42$::jsonb,
   1, $uu43$@property is built on top of the descriptor protocol (__get__/__set__) — descriptors are the more general, reusable mechanism that @property is a convenient shorthand for.$uu43$, 1, 3),
  ('tq-py-advanced-python-5', 'pt-py-advanced-python',
   $uu44$What is a metaclass?$uu44$,
   $uu45$["A class instance", "\"The class of a class\" — it controls how classes themselves are constructed", "A private method", "A type of loop"]$uu45$::jsonb,
   1, $uu46$Just as an object is an instance of a class, a class is an instance of its metaclass (type, by default) — a metaclass controls how classes themselves get built.$uu46$, 1, 4),
  ('tq-py-advanced-python-6', 'pt-py-advanced-python',
   $uu47$Why should functools.wraps be used inside custom decorators?$uu47$,
   $uu48$["It's required syntax", "It preserves the original function's name and docstring", "It makes the function run faster", "It disables the decorator"]$uu48$::jsonb,
   1, $uu49$Without @wraps, the wrapper function replaces the original's __name__ and __doc__, making debugging, introspection, and auto-generated docs show "wrapper" instead of the real function.$uu49$, 1, 5),
  ('tq-py-advanced-python-7', 'pt-py-advanced-python',
   $uu50$What does functools.partial do?$uu50$,
   $uu51$["Deletes part of a function", "Creates a new function with some arguments pre-filled", "Splits a function into two", "Converts a function into a class"]$uu51$::jsonb,
   1, $uu52$partial(func, arg=value) returns a new callable with that argument already "locked in", so callers only need to supply the remaining ones.$uu52$, 1, 6),
  ('tq-py-advanced-python-8', 'pt-py-advanced-python',
   $uu53$How does Python primarily manage memory?$uu53$,
   $uu54$["Manual allocation only", "Reference counting, with a garbage collector for circular references", "It doesn't manage memory", "Through the GIL only"]$uu54$::jsonb,
   1, $uu55$Python frees an object's memory once its reference count hits zero; a separate garbage collector additionally handles circular references, which reference counting alone can't detect.$uu55$, 1, 7),
  ('tq-py-advanced-python-9', 'pt-py-advanced-python',
   $uu56$What is a weak reference used for?$uu56$,
   $uu57$["Making an object stronger", "Referencing an object without preventing it from being garbage collected", "Encrypting an object", "Copying an object"]$uu57$::jsonb,
   1, $uu58$A weakref.ref doesn't count toward an object's reference count, so the object can still be freed normally, while the weak reference can still check whether it's alive.$uu58$, 1, 8),
  ('tq-py-advanced-python-10', 'pt-py-advanced-python',
   $uu59$What is CPython?$uu59$,
   $uu60$["An alternative language", "The standard, most widely used implementation of Python, written in C", "A Python testing framework", "A cloud platform"]$uu60$::jsonb,
   1, $uu61$CPython is the reference implementation almost everyone means when they say "Python" — written in C, with alternatives like PyPy existing but far less common.$uu61$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-py-advanced-python' and question_count <> 10;

-- Concurrency & Performance — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'advanced-python-career-readiness/concurrency-performance')
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-py-concurrency-performance', $uu62$Concurrency & Performance - Quick Test$uu62$, 'aptitude', 10, 10,
  $uu63$10 questions covering concurrency vs parallelism, the GIL, threading, multiprocessing, asyncio, profiling, and functools.lru_cache.$uu63$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $uu64$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$uu64$, true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-py-concurrency-performance-1', 'pt-py-concurrency-performance',
   $uu65$What is the difference between concurrency and parallelism?$uu65$,
   $uu66$["No difference", "Concurrency manages overlapping tasks; parallelism runs tasks at the exact same instant", "Parallelism is only for I/O tasks", "Concurrency requires multiple CPUs"]$uu66$::jsonb,
   1, $uu67$Concurrency is about structuring work so multiple tasks make overlapping progress (possibly by switching between them); parallelism means tasks genuinely execute at the same physical instant, typically across multiple cores.$uu67$, 1, 0),
  ('tq-py-concurrency-performance-2', 'pt-py-concurrency-performance',
   $uu68$What is the GIL?$uu68$,
   $uu69$["A type of loop", "A CPython lock allowing only one thread to execute Python bytecode at a time", "A database index", "A testing framework"]$uu69$::jsonb,
   1, $uu70$The Global Interpreter Lock is specific to CPython and ensures only one thread runs Python bytecode at any given moment, even on a multi-core machine.$uu70$, 1, 1),
  ('tq-py-concurrency-performance-3', 'pt-py-concurrency-performance',
   $uu71$Why is threading well-suited for I/O-bound tasks despite the GIL?$uu71$,
   $uu72$["The GIL doesn't apply to I/O", "The GIL is released while a thread waits on I/O, letting other threads run", "I/O tasks don't use threads", "Threading bypasses the GIL entirely"]$uu72$::jsonb,
   1, $uu73$While a thread is blocked waiting on I/O (a network response, a file read), it releases the GIL, letting another thread make progress in the meantime.$uu73$, 1, 2),
  ('tq-py-concurrency-performance-4', 'pt-py-concurrency-performance',
   $uu74$Why is multiprocessing preferred over threading for CPU-heavy tasks?$uu74$,
   $uu75$["It uses less memory", "Each process has its own GIL, enabling true parallel execution across cores", "It's simpler to write", "Threading doesn't support CPU tasks at all"]$uu75$::jsonb,
   1, $uu76$Separate processes each get their own Python interpreter and GIL, so CPU-bound work can genuinely run in parallel across cores — something threading cannot do in CPython.$uu76$, 1, 3),
  ('tq-py-concurrency-performance-5', 'pt-py-concurrency-performance',
   $uu77$What guard is required for multiprocessing code, especially on Windows?$uu77$,
   $uu78$["try/except", "if __name__ == \"__main__\":", "with statement", "@staticmethod"]$uu78$::jsonb,
   1, $uu79$Without this guard, child processes can end up re-importing and re-running the whole script from scratch on some platforms, causing runaway process creation.$uu79$, 1, 4),
  ('tq-py-concurrency-performance-6', 'pt-py-concurrency-performance',
   $uu80$What does asyncio provide?$uu80$,
   $uu81$["True multi-core parallelism", "Efficient handling of many I/O-bound tasks on a single thread", "A replacement for all Python loops", "Automatic multiprocessing"]$uu81$::jsonb,
   1, $uu82$asyncio lets a single thread juggle many I/O-bound waits efficiently via an event loop, without the overhead of real threads or processes — but it doesn't provide true parallelism for CPU-bound work.$uu82$, 1, 5),
  ('tq-py-concurrency-performance-7', 'pt-py-concurrency-performance',
   $uu83$What keyword pauses a coroutine in asyncio while waiting?$uu83$,
   $uu84$["pause", "await", "stop", "yield"]$uu84$::jsonb,
   1, $uu85$await suspends the current coroutine at that point, letting the event loop run other pending tasks, then resumes it once the awaited operation completes.$uu85$, 1, 6),
  ('tq-py-concurrency-performance-8', 'pt-py-concurrency-performance',
   $uu86$What should you do before optimizing code?$uu86$,
   $uu87$["Guess where it's slow", "Profile it to find the actual bottleneck", "Rewrite everything from scratch", "Add more comments"]$uu87$::jsonb,
   1, $uu88$Intuition about what's slow is frequently wrong; profiling tools like cProfile reveal the actual bottleneck so optimization effort isn't wasted on the wrong part.$uu88$, 1, 7),
  ('tq-py-concurrency-performance-9', 'pt-py-concurrency-performance',
   $uu89$What does functools.lru_cache do?$uu89$,
   $uu90$["Deletes old function results", "Caches a function's results based on its arguments", "Slows down repeated calls", "Only works with strings"]$uu90$::jsonb,
   1, $uu91$lru_cache remembers a function's return value for each unique set of arguments, returning the cached result instantly on repeated calls instead of recomputing it.$uu91$, 1, 8),
  ('tq-py-concurrency-performance-10', 'pt-py-concurrency-performance',
   $uu92$Why is a set faster than a list for membership testing (in)?$uu92$,
   $uu93$["Sets are always smaller", "Sets use hash-based lookup, which is much faster than scanning", "Lists don't support in", "There's no actual difference"]$uu93$::jsonb,
   1, $uu94$A set's hash-based internal structure allows near-instant membership checks, while a list requires scanning through elements one at a time until a match is found (or not).$uu94$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-py-concurrency-performance' and question_count <> 10;

-- Security — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'advanced-python-career-readiness/security')
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-py-security', $uu95$Security - Quick Test$uu95$, 'aptitude', 10, 10,
  $uu96$10 questions covering password hashing with bcrypt, authentication vs authorization, JWTs, environment variables, SQL injection, XSS, and CSRF.$uu96$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $uu97$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$uu97$, true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-py-security-1', 'pt-py-security',
   $uu98$Why should passwords never be stored in plain text?$uu98$,
   $uu99$["It takes up more storage", "A database breach would immediately expose every user's actual password", "Plain text is slower to read", "Python doesn't allow storing strings"]$uu99$::jsonb,
   1, $uu100$If a database storing plain-text passwords is ever breached, every user's real password is exposed immediately — and since people reuse passwords, this risk extends to their other accounts too.$uu100$, 1, 0),
  ('tq-py-security-2', 'pt-py-security',
   $uu101$Why is bcrypt preferred over a general-purpose hash like plain SHA-256 for passwords?$uu101$,
   $uu102$["It's faster", "It's intentionally slow, making brute-force attacks much harder", "It's not actually different", "SHA-256 can't hash strings"]$uu102$::jsonb,
   1, $uu103$General-purpose hashes are designed to be fast, which actually helps attackers brute-force them; bcrypt is deliberately slow (and salted), making large-scale guessing far more expensive.$uu103$, 1, 1),
  ('tq-py-security-3', 'pt-py-security',
   $uu104$What is the difference between authentication and authorization?$uu104$,
   $uu105$["No difference", "Authentication verifies identity; authorization determines permitted actions", "Authorization verifies identity; authentication determines permitted actions", "Both are the same as encryption"]$uu105$::jsonb,
   1, $uu106$Authentication answers "who are you?"; authorization answers "what are you allowed to do, now that we know who you are?" — a system can authenticate correctly while still denying authorization.$uu106$, 1, 2),
  ('tq-py-security-4', 'pt-py-security',
   $uu107$Is a JWT payload encrypted by default?$uu107$,
   $uu108$["Yes, always", "No — it's encoded and signed, but readable by anyone with the token", "Only if using HS256", "JWTs don't have payloads"]$uu108$::jsonb,
   1, $uu109$A JWT's payload is base64-encoded and cryptographically signed to prevent tampering, but that's not encryption — anyone holding the token can decode and read its contents.$uu109$, 1, 3),
  ('tq-py-security-5', 'pt-py-security',
   $uu110$How do parameterized queries prevent SQL injection?$uu110$,
   $uu111$["They encrypt the database", "They keep user input strictly separate from the SQL command's structure", "They disable the WHERE clause", "They only work with NoSQL databases"]$uu111$::jsonb,
   1, $uu112$Placeholders like ? ensure the database driver always treats supplied values as data, never as part of the SQL syntax itself, which is what closes off injection entirely.$uu112$, 1, 4),
  ('tq-py-security-6', 'pt-py-security',
   $uu113$Where should secrets like API keys and passwords be stored?$uu113$,
   $uu114$["Directly in source code", "In environment variables, loaded from a .env file excluded via .gitignore", "In a public GitHub repository", "In code comments"]$uu114$::jsonb,
   1, $uu115$Keeping secrets in environment variables (loaded from a .env file that's never committed) keeps them out of the codebase entirely, so they can't leak through source control.$uu115$, 1, 5),
  ('tq-py-security-7', 'pt-py-security',
   $uu116$What is XSS (Cross-Site Scripting)?$uu116$,
   $uu117$["A database error", "A vulnerability allowing malicious script content to be injected into pages viewed by other users", "A type of encryption", "A Git command"]$uu117$::jsonb,
   1, $uu118$XSS happens when untrusted input is rendered on a page without proper handling, letting an attacker's script run in other users' browsers.$uu118$, 1, 6),
  ('tq-py-security-8', 'pt-py-security',
   $uu119$How do modern templating engines like Jinja2 typically defend against XSS?$uu119$,
   $uu120$["They don't", "Automatic output escaping of special characters by default", "By blocking all user input", "By encrypting the entire page"]$uu120$::jsonb,
   1, $uu121$Jinja2 escapes special characters in interpolated values by default, so injected markup renders as inert, literal text rather than executing as a script.$uu121$, 1, 7),
  ('tq-py-security-9', 'pt-py-security',
   $uu122$What does a CSRF token protect against?$uu122$,
   $uu123$["SQL injection", "A malicious site tricking a logged-in user's browser into submitting unintended requests", "Password leaks", "Slow page loading"]$uu123$::jsonb,
   1, $uu124$A unique CSRF token embedded in each form lets the server confirm a request genuinely came from its own page, not from a different site tricking the user's browser into submitting it.$uu124$, 1, 8),
  ('tq-py-security-10', 'pt-py-security',
   $uu125$Why should a JWT include an expiration time (exp)?$uu125$,
   $uu126$["It's required by Python syntax", "So the token automatically becomes invalid after a set period, limiting damage if leaked", "To make the token longer", "It has no real purpose"]$uu126$::jsonb,
   1, $uu127$Without an expiration, a leaked or stolen token would remain valid forever; setting exp caps how long any single token can be misused.$uu127$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-py-security' and question_count <> 10;

-- Deployment & DevOps — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'advanced-python-career-readiness/deployment-devops')
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-py-deployment-devops', $uu128$Deployment & DevOps - Quick Test$uu128$, 'aptitude', 10, 10,
  $uu129$10 questions covering Linux basics, Docker, Docker Compose, CI/CD with GitHub Actions, cloud deployment options, Nginx, and monitoring.$uu129$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $uu130$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$uu130$, true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-py-deployment-devops-1', 'pt-py-deployment-devops',
   $uu131$What does the Linux command ls -la do?$uu131$,
   $uu132$["Deletes files", "Lists files, including hidden ones, with details", "Creates a new folder", "Changes directory"]$uu132$::jsonb,
   1, $uu133$The -l flag shows detailed information per file, and -a includes hidden files (those starting with a dot) that a plain ls would skip.$uu133$, 1, 0),
  ('tq-py-deployment-devops-2', 'pt-py-deployment-devops',
   $uu134$What is Docker primarily used for?$uu134$,
   $uu135$["Writing Python code", "Packaging an application and its dependencies into a portable, consistent container", "Replacing Git", "Only for testing"]$uu135$::jsonb,
   1, $uu136$Docker bundles code, dependencies, and system libraries into one portable container image, so the application runs identically across different machines and environments.$uu136$, 1, 1),
  ('tq-py-deployment-devops-3', 'pt-py-deployment-devops',
   $uu137$What does EXPOSE 5000 in a Dockerfile do?$uu137$,
   $uu138$["Runs the app on port 5000", "Documents which port the application listens on", "Deletes port 5000", "Encrypts traffic on port 5000"]$uu138$::jsonb,
   1, $uu139$EXPOSE is documentation for which port the containerized app listens on — it doesn't by itself publish that port to the host; docker run -p handles the actual mapping.$uu139$, 1, 2),
  ('tq-py-deployment-devops-4', 'pt-py-deployment-devops',
   $uu140$What is the purpose of Docker Compose?$uu140$,
   $uu141$["To replace Docker entirely", "To define and run multi-service applications (e.g., a web app plus a database) together", "To write Python code faster", "To manage Git branches"]$uu141$::jsonb,
   1, $uu142$Compose lets you describe several related services (a web app, a database, etc.) in one YAML file and bring them all up together with a single command.$uu142$, 1, 3),
  ('tq-py-deployment-devops-5', 'pt-py-deployment-devops',
   $uu143$What does CI (Continuous Integration) primarily focus on?$uu143$,
   $uu144$["Deploying to production automatically", "Automatically running tests when code changes are pushed", "Writing documentation", "Managing servers"]$uu144$::jsonb,
   1, $uu145$CI's core job is running the test suite automatically on every push or pull request, catching regressions before they reach the main branch.$uu145$, 1, 4),
  ('tq-py-deployment-devops-6', 'pt-py-deployment-devops',
   $uu146$What triggers a GitHub Actions workflow in a typical CI setup?$uu146$,
   $uu147$["Manually emailing the team", "Events like a push or pull_request", "Only scheduled cron jobs", "Nothing; it runs constantly"]$uu147$::jsonb,
   1, $uu148$A workflow's on: section declares which repository events (push, pull_request, and others) should trigger it automatically.$uu148$, 1, 5),
  ('tq-py-deployment-devops-7', 'pt-py-deployment-devops',
   $uu149$What is a reverse proxy (like Nginx) used for?$uu149$,
   $uu150$["Writing application code", "Sitting between clients and the application, forwarding requests and handling tasks like SSL and load balancing", "Replacing the database", "Compiling Python"]$uu150$::jsonb,
   1, $uu151$A reverse proxy receives incoming traffic first and forwards it to the real application server, commonly also handling HTTPS termination, static files, and load balancing.$uu151$, 1, 6),
  ('tq-py-deployment-devops-8', 'pt-py-deployment-devops',
   $uu152$Why shouldn't Flask's built-in development server be used in production?$uu152$,
   $uu153$["It's not designed for production-level traffic, concurrency, or security", "It doesn't support routes", "It requires Docker", "It only works locally"]$uu153$::jsonb,
   0, $uu154$Flask's dev server is built for local development convenience, not for handling real production traffic, concurrency, or the security hardening a production server needs.$uu154$, 1, 7),
  ('tq-py-deployment-devops-9', 'pt-py-deployment-devops',
   $uu155$What does the gunicorn --workers 4 flag do?$uu155$,
   $uu156$["Limits the app to 4 requests total", "Runs 4 separate worker processes to handle requests in parallel", "Deletes 4 files", "Sets the port to 4"]$uu156$::jsonb,
   1, $uu157$Each worker is a separate process capable of handling a request, so --workers 4 lets Gunicorn serve up to 4 requests genuinely at the same time.$uu157$, 1, 8),
  ('tq-py-deployment-devops-10', 'pt-py-deployment-devops',
   $uu158$Why is monitoring important after deployment?$uu158$,
   $uu159$["It's optional and rarely useful", "It alerts the team immediately when something breaks, rather than relying on user complaints", "It replaces the need for testing", "It only tracks Git commits"]$uu159$::jsonb,
   1, $uu160$Monitoring turns "a user eventually complains" into "the team is alerted the instant something breaks" — a critical difference for reliable, professional software.$uu160$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-py-deployment-devops' and question_count <> 10;

-- ===========================================================================
-- 5. CODING PROBLEMS — up to 4 Python-only problems per topic (topic_id NULL,
--    global slug). Deployment & DevOps has 0 (matches source); topic 30 has
--    none (see header note). Skips a slug already taken by any existing row.
-- ===========================================================================

-- Advanced Python — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'advanced-python-career-readiness/advanced-python')
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-py-advanced-python-1', null::text, $uu163$Convert a Class to a Dataclass$uu163$, 'Easy', 'py-advanced-python-convert-class-to-dataclass',
   $uu164$Rewrite a Product class (with name, price, and an in_stock flag defaulting to True) using @dataclass, then construct one from the given input and print it.

**Approach:** read a name and price, then an optional in_stock override ("True", "False", or a blank line meaning "use the default"), construct the dataclass accordingly, and print it — relying on @dataclass's auto-generated __repr__.

**Input:** Three lines: name, price, and an in_stock override ("True", "False", or a blank line to use the default).

**Output:** One line: the dataclass instance's default repr, e.g. Product(name='Shirt', price=500.0, in_stock=True).$uu164$,
   $uu165$[{"input": "Shirt\n500\n\n", "output": "Product(name='Shirt', price=500.0, in_stock=True)"}]$uu165$::jsonb,
   $uu166$["price parses as a float", "the third line is exactly \"True\", \"False\", or empty"]$uu166$::jsonb,
   jsonb_build_object('python', $uu161$from dataclasses import dataclass

# define a Product dataclass: name: str, price: float, in_stock: bool = True

name = input()
price = float(input())
stock_input = input().strip()

# construct a Product (using the default in_stock when stock_input is empty) and print it
$uu161$),
   $uu167$["@dataclass generates __init__ and __repr__ automatically from the type-hinted attributes.", "A field with a default value (in_stock: bool = True) must come after all fields without defaults.", "Printing a dataclass instance directly uses its auto-generated __repr__ — no manual formatting needed."]$uu167$::jsonb,
   $uu168$[{"input": "Shirt\n500\n\n", "expected": "Product(name='Shirt', price=500.0, in_stock=True)", "hidden": false}, {"input": "Shoes\n1200\nFalse", "expected": "Product(name='Shoes', price=1200.0, in_stock=False)", "hidden": true}]$uu168$::jsonb,
   $uu169$@dataclass turns the three type-hinted attributes into a full class with __init__, __repr__, and __eq__ generated automatically. Since in_stock has a default of True, a Product can be constructed with just name and price when the third input line is blank, or with an explicit True/False otherwise. Printing the instance uses the generated __repr__, which is exactly the format @dataclass produces.$uu169$,
   jsonb_build_object('python', $uu162$from dataclasses import dataclass

@dataclass
class Product:
    name: str
    price: float
    in_stock: bool = True

name = input()
price = float(input())
stock_input = input().strip()
if stock_input == "":
    product = Product(name, price)
else:
    product = Product(name, price, stock_input == "True")
print(product)
$uu162$),
   array['python'], 'published', false, 0),
  ('cp-py-advanced-python-2', null::text, $uu172$Decorator with functools.wraps$uu172$, 'Easy', 'py-advanced-python-decorator-with-functools-wraps',
   $uu173$Write a decorator @log_call that prints "Calling <function name>" before calling the wrapped function, using @functools.wraps to preserve the original function's metadata, then confirm __name__ survives decoration.

**Approach:** define log_call using functools.wraps(func) inside its wrapper, apply it to a greet(name) function, call greet with the given name, and print greet.__name__ afterward.

**Input:** One line: a name.

**Output:** Three lines: "Calling greet", "Hello, <name>!", and the decorated function's __name__ ("greet").$uu173$,
   $uu174$[{"input": "Aditi", "output": "Calling greet\nHello, Aditi!\ngreet"}]$uu174$::jsonb,
   $uu175$["name is a non-empty string with no newline"]$uu175$::jsonb,
   jsonb_build_object('python', $uu170$from functools import wraps

def log_call(func):
    # use @wraps(func) here, and print "Calling <func.__name__>" before calling func
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@log_call
def greet(name):
    print(f"Hello, {name}!")

name = input()
greet(name)
print(greet.__name__)
$uu170$),
   $uu176$["@wraps(func) goes directly above the inner wrapper function definition.", "Print the \"Calling ...\" message inside wrapper, before calling func(*args, **kwargs).", "Without @wraps, greet.__name__ would incorrectly print \"wrapper\" instead of \"greet\"."]$uu176$::jsonb,
   $uu177$[{"input": "Aditi", "expected": "Calling greet\nHello, Aditi!\ngreet", "hidden": false}, {"input": "Rohan", "expected": "Calling greet\nHello, Rohan!\ngreet", "hidden": true}]$uu177$::jsonb,
   $uu178$wrapper prints "Calling greet" before delegating to the real greet(name), so both the log line and the actual greeting appear in order. @wraps(func) copies func's __name__ (and __doc__) onto wrapper, so greet.__name__ after decoration still correctly reports "greet" instead of "wrapper".$uu178$,
   jsonb_build_object('python', $uu171$from functools import wraps

def log_call(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        print(f"Calling {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

@log_call
def greet(name):
    print(f"Hello, {name}!")

name = input()
greet(name)
print(greet.__name__)
$uu171$),
   array['python'], 'published', false, 1),
  ('cp-py-advanced-python-3', null::text, $uu181$Generator Pipeline$uu181$, 'Medium', 'py-advanced-python-generator-pipeline',
   $uu182$Build a 3-stage generator pipeline: one generator yields the given numbers, one squares them, and one filters to keep only values greater than 20.

**Approach:** chain three generator functions (read_numbers, square_all, filter_greater_than_20), feeding each one's output into the next, and materialize the final result with list().

**Input:** One line: space-separated integers.

**Output:** One line: the squared, filtered values as a Python list.$uu182$,
   $uu183$[{"input": "1 2 3 4 5 6", "output": "[25, 36]"}]$uu183$::jsonb,
   $uu184$["1 <= number of values <= 100"]$uu184$::jsonb,
   jsonb_build_object('python', $uu179$def read_numbers(numbers):
    for n in numbers:
        yield n

def square_all(numbers):
    for n in numbers:
        yield n ** 2

def filter_greater_than_20(numbers):
    # yield only values greater than 20
    for n in numbers:
        pass

numbers = list(map(int, input().split()))
pipeline = filter_greater_than_20(square_all(read_numbers(numbers)))
print(list(pipeline))
$uu179$),
   $uu185$["Each generator stage takes the PREVIOUS generator as its input, not the original list.", "filter_greater_than_20 should yield n only when n > 20.", "Nothing is actually computed until list(pipeline) pulls every value through all three stages."]$uu185$::jsonb,
   $uu186$[{"input": "1 2 3 4 5 6", "expected": "[25, 36]", "hidden": false}, {"input": "1 2 3", "expected": "[]", "hidden": true}]$uu186$::jsonb,
   $uu187$read_numbers simply yields each input number in turn; square_all yields the square of whatever it receives; filter_greater_than_20 yields only the squares greater than 20. Because each stage is a generator consuming the previous one, nothing is computed eagerly — list(pipeline) is what actually pulls every value through all three stages, one at a time.$uu187$,
   jsonb_build_object('python', $uu180$def read_numbers(numbers):
    for n in numbers:
        yield n

def square_all(numbers):
    for n in numbers:
        yield n ** 2

def filter_greater_than_20(numbers):
    for n in numbers:
        if n > 20:
            yield n

numbers = list(map(int, input().split()))
pipeline = filter_greater_than_20(square_all(read_numbers(numbers)))
print(list(pipeline))
$uu180$),
   array['python'], 'published', false, 2),
  ('cp-py-advanced-python-4', null::text, $uu190$Custom Validating Descriptor$uu190$, 'Medium', 'py-advanced-python-custom-validating-descriptor',
   $uu191$Create a descriptor class NonEmptyString that raises a ValueError if an assigned string is empty, and use it as the name attribute on a Product class.

**Approach:** implement __set_name__, __get__, and __set__ on NonEmptyString, attach it as Product.name, then try constructing a Product with the given input and report success or the validation error.

**Input:** One line: a name (possibly empty).

**Output:** One line: "Product created: <name>" on success, or "Error: <message>" if the name is empty.$uu191$,
   $uu192$[{"input": "Shirt", "output": "Product created: Shirt"}]$uu192$::jsonb,
   $uu193$["input is a single line, possibly empty"]$uu193$::jsonb,
   jsonb_build_object('python', $uu188$class NonEmptyString:
    def __set_name__(self, owner, name):
        self.name = "_" + name

    def __get__(self, instance, owner):
        return getattr(instance, self.name)

    def __set__(self, instance, value):
        # raise ValueError if value is empty, otherwise store it
        pass

class Product:
    name = NonEmptyString()
    def __init__(self, name):
        self.name = name

given_name = input()
try:
    product = Product(given_name)
    print(f"Product created: {product.name}")
except ValueError as e:
    print(f"Error: {e}")
$uu188$),
   $uu194$["__set_name__ runs once, when the descriptor is assigned to a class attribute — it's where self.name (\"_name\") gets set.", "__set__ intercepts every assignment to product.name, including the one inside Product.__init__.", "Raise ValueError(f\"{self.name} cannot be empty\") when value == \"\"."]$uu194$::jsonb,
   $uu195$[{"input": "Shirt", "expected": "Product created: Shirt", "hidden": false}, {"input": "", "expected": "Error: _name cannot be empty", "hidden": true}]$uu195$::jsonb,
   $uu196$__set_name__ fires once when NonEmptyString() is assigned as Product.name, recording the storage attribute name ("_name"). Every subsequent assignment to product.name — including self.name = name inside __init__ — goes through __set__, which raises ValueError for an empty string and otherwise stores the value via setattr. __get__ then reads that stored value back out.$uu196$,
   jsonb_build_object('python', $uu189$class NonEmptyString:
    def __set_name__(self, owner, name):
        self.name = "_" + name

    def __get__(self, instance, owner):
        return getattr(instance, self.name)

    def __set__(self, instance, value):
        if value == "":
            raise ValueError(f"{self.name} cannot be empty")
        setattr(instance, self.name, value)

class Product:
    name = NonEmptyString()
    def __init__(self, name):
        self.name = name

given_name = input()
try:
    product = Product(given_name)
    print(f"Product created: {product.name}")
except ValueError as e:
    print(f"Error: {e}")
$uu189$),
   array['python'], 'published', false, 3)
) as v(id, topic_id, title, difficulty, slug, description,
       examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
       supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- Concurrency & Performance — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'advanced-python-career-readiness/concurrency-performance')
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-py-concurrency-performance-1', null::text, $uu199$Concurrent Downloads with Threading$uu199$, 'Medium', 'py-concurrency-performance-concurrent-downloads-threading',
   $uu200$Simulate downloading n files concurrently using threading, then report whether they actually ran concurrently.

**Approach:** start one thread per "download" (each sleeping briefly to simulate I/O wait), join them all, and compare the total elapsed time against what running them one-after-another would have taken — printing a classification rather than a raw timing value, since exact elapsed time isn't reliably reproducible across machines.

**Input:** One line: the number of files to "download", n.

**Output:** Two lines: "Downloaded <n> files", then "Concurrent" if the threads clearly ran in parallel, or "Sequential" otherwise.$uu200$,
   $uu201$[{"input": "3", "output": "Downloaded 3 files\nConcurrent"}]$uu201$::jsonb,
   $uu202$["1 <= n <= 10"]$uu202$::jsonb,
   jsonb_build_object('python', $uu197$import threading
import time

def download_file():
    time.sleep(0.4)

n = int(input())

# start n threads running download_file, time how long they all take together,
# then print "Downloaded <n> files" and "Concurrent"/"Sequential"
$uu197$),
   $uu203$["thread.start() begins the thread; thread.join() waits for it to finish — start all threads first, then join all of them.", "If the downloads ran concurrently, total elapsed time should be close to one download's time (0.4s), not n times that.", "Compare elapsed against a threshold well below the fully-sequential total (e.g. elapsed < 0.4 * n * 0.7) to classify it."]$uu203$::jsonb,
   $uu204$[{"input": "3", "expected": "Downloaded 3 files\nConcurrent", "hidden": false}, {"input": "5", "expected": "Downloaded 5 files\nConcurrent", "hidden": true}]$uu204$::jsonb,
   $uu205$Each thread sleeps for the same short duration to simulate an I/O wait; since time.sleep() releases the GIL, all n threads make progress at once instead of one after another. Timing the whole start/join sequence and comparing it against a threshold well below what n sequential downloads would take (n * 0.4s) reliably distinguishes true concurrency from accidentally-sequential execution, without depending on an exact, non-reproducible timing value.$uu205$,
   jsonb_build_object('python', $uu198$import threading
import time

def download_file():
    time.sleep(0.4)

n = int(input())

start = time.time()
threads = [threading.Thread(target=download_file) for _ in range(n)]
for t in threads:
    t.start()
for t in threads:
    t.join()
elapsed = time.time() - start

print(f"Downloaded {n} files")
print("Concurrent" if elapsed < (0.4 * n * 0.7) else "Sequential")
$uu198$),
   array['python'], 'published', false, 0),
  ('cp-py-concurrency-performance-2', null::text, $uu208$Parallel Square Calculation with Multiprocessing$uu208$, 'Medium', 'py-concurrency-performance-parallel-square-calculation-multiprocessing',
   $uu209$Use multiprocessing.Pool to calculate the squares of a list of numbers, splitting the work across 2 processes.

**Approach:** split the input list into two halves, submit both halves to a 2-worker Pool.map() call, then combine and print the results in original order.

**Input:** One line: space-separated integers.

**Output:** One line: every input number's square, in original order, as a Python list.$uu209$,
   $uu210$[{"input": "1 2 3 4 5 6", "output": "[1, 4, 9, 16, 25, 36]"}]$uu210$::jsonb,
   $uu211$["1 <= number of values <= 1000"]$uu211$::jsonb,
   jsonb_build_object('python', $uu206$import multiprocessing

def calculate_squares(numbers):
    return [n ** 2 for n in numbers]

def main():
    numbers = list(map(int, input().split()))
    half = len(numbers) // 2

    # use multiprocessing.Pool(processes=2) to square numbers[:half] and numbers[half:]
    # in parallel, then combine and print the results

if __name__ == "__main__":
    main()
$uu206$),
   $uu212$["with multiprocessing.Pool(processes=2) as pool: pool.map(calculate_squares, [numbers[:half], numbers[half:]]) runs both halves in parallel.", "pool.map() returns a list of results in the SAME order the inputs were given, so results[0] + results[1] reconstructs the full, correctly-ordered list.", "The if __name__ == \"__main__\": guard is required for multiprocessing to work correctly."]$uu212$::jsonb,
   $uu213$[{"input": "1 2 3 4 5 6", "expected": "[1, 4, 9, 16, 25, 36]", "hidden": false}, {"input": "2 4 6 8", "expected": "[4, 16, 36, 64]", "hidden": true}]$uu213$::jsonb,
   $uu214$The input list is split into two halves, and Pool(processes=2).map() sends each half to a separate worker process to be squared in parallel — each process has its own interpreter and GIL, so this achieves genuine parallelism, unlike threading. map() preserves input order, so concatenating the two returned halves reconstructs the full list of squares in the original order.$uu214$,
   jsonb_build_object('python', $uu207$import multiprocessing

def calculate_squares(numbers):
    return [n ** 2 for n in numbers]

def main():
    numbers = list(map(int, input().split()))
    half = len(numbers) // 2
    with multiprocessing.Pool(processes=2) as pool:
        results = pool.map(calculate_squares, [numbers[:half], numbers[half:]])
    combined = results[0] + results[1]
    print(combined)

if __name__ == "__main__":
    main()
$uu207$),
   array['python'], 'published', false, 1),
  ('cp-py-concurrency-performance-3', null::text, $uu217$Concurrent Async Tasks$uu217$, 'Medium', 'py-concurrency-performance-concurrent-async-tasks',
   $uu218$Write an asyncio program that "fetches" n items concurrently (each using asyncio.sleep), and report whether the total runtime shows they ran concurrently.

**Approach:** define an async fetch_item coroutine, run n of them together with asyncio.gather(), time the whole thing, and classify the result the same way as the threading problem — a classification rather than a raw timing value.

**Input:** One line: the number of items to "fetch", n.

**Output:** Two lines: "Fetched <n> items", then "Concurrent" if they clearly ran together, or "Sequential" otherwise.$uu218$,
   $uu219$[{"input": "5", "output": "Fetched 5 items\nConcurrent"}]$uu219$::jsonb,
   $uu220$["1 <= n <= 10"]$uu220$::jsonb,
   jsonb_build_object('python', $uu215$import asyncio
import time

async def fetch_item(i):
    await asyncio.sleep(0.4)
    return i

async def main(n):
    # use asyncio.gather() to run n fetch_item coroutines concurrently, time it,
    # then print "Fetched <n> items" and "Concurrent"/"Sequential"
    pass

n = int(input())
asyncio.run(main(n))
$uu215$),
   $uu221$["asyncio.gather(*(fetch_item(i) for i in range(n))) runs all n coroutines concurrently and waits for them all.", "await asyncio.sleep(...) (not time.sleep()) is what lets other tasks run during the wait.", "Use the same style of threshold check as a threading concurrency check: elapsed < 0.4 * n * 0.7 implies real concurrency."]$uu221$::jsonb,
   $uu222$[{"input": "5", "expected": "Fetched 5 items\nConcurrent", "hidden": false}, {"input": "3", "expected": "Fetched 3 items\nConcurrent", "hidden": true}]$uu222$::jsonb,
   $uu223$asyncio.gather() schedules all n fetch_item coroutines on the event loop at once; since each one awaits asyncio.sleep() rather than blocking, the event loop can run all of them concurrently on a single thread. As with the threading problem, comparing elapsed time against a generous threshold (well below the fully-sequential total) classifies the result without depending on an exact, non-reproducible timing value.$uu223$,
   jsonb_build_object('python', $uu216$import asyncio
import time

async def fetch_item(i):
    await asyncio.sleep(0.4)
    return i

async def main(n):
    start = time.time()
    results = await asyncio.gather(*(fetch_item(i) for i in range(n)))
    elapsed = time.time() - start
    print(f"Fetched {len(results)} items")
    print("Concurrent" if elapsed < (0.4 * n * 0.7) else "Sequential")

n = int(input())
asyncio.run(main(n))
$uu216$),
   array['python'], 'published', false, 2),
  ('cp-py-concurrency-performance-4', null::text, $uu226$Cache a Slow Fibonacci with lru_cache$uu226$, 'Medium', 'py-concurrency-performance-cache-slow-fibonacci-lru-cache',
   $uu227$Write a recursive Fibonacci function, apply @lru_cache to a second version, and confirm both agree on the answer and that a cached lookup is faster than the uncached computation.

**Approach:** define fib_uncached (plain recursion) and fib_cached (decorated with @lru_cache), compute fib(n) with both, warm the cache, then time a fresh call to fib_cached against the original uncached call.

**Input:** One line: an integer n.

**Output:** Three lines: "fib(<n>) = <value>", "Results match: True", and "Cache lookup faster than fresh computation: True".$uu227$,
   $uu228$[{"input": "28", "output": "fib(28) = 317811\nResults match: True\nCache lookup faster than fresh computation: True"}]$uu228$::jsonb,
   $uu229$["10 <= n <= 30"]$uu229$::jsonb,
   jsonb_build_object('python', $uu224$from functools import lru_cache
import time

def fib_uncached(n):
    if n < 2:
        return n
    return fib_uncached(n - 1) + fib_uncached(n - 2)

# define fib_cached as a recursive fibonacci function decorated with @lru_cache

n = int(input())

# time fib_uncached(n), then time a fib_cached(n) call (after warming the cache once),
# and print the three required lines
$uu224$),
   $uu230$["@lru_cache(maxsize=None) goes directly above the cached recursive function's def line.", "Call fib_cached(n) once first to \"warm\" the cache before timing the second, cached call.", "Compare the warmed cached-call time against the uncached call's time — the cached lookup should be dramatically faster."]$uu230$::jsonb,
   $uu231$[{"input": "28", "expected": "fib(28) = 317811\nResults match: True\nCache lookup faster than fresh computation: True", "hidden": false}, {"input": "20", "expected": "fib(20) = 6765\nResults match: True\nCache lookup faster than fresh computation: True", "hidden": true}]$uu231$::jsonb,
   $uu232$fib_uncached recomputes every sub-call from scratch, taking exponential time. fib_cached is decorated with @lru_cache, so calling it once populates the cache for every (n) it touches; a second call for the same n becomes an instant dictionary lookup. Warming the cache before timing it, then comparing that cached-call time against the uncached call's time, demonstrates the speedup reliably and by a large margin, without needing to print (non-reproducible) raw timing numbers.$uu232$,
   jsonb_build_object('python', $uu225$from functools import lru_cache
import time

def fib_uncached(n):
    if n < 2:
        return n
    return fib_uncached(n - 1) + fib_uncached(n - 2)

@lru_cache(maxsize=None)
def fib_cached(n):
    if n < 2:
        return n
    return fib_cached(n - 1) + fib_cached(n - 2)

n = int(input())

start = time.time()
result_uncached = fib_uncached(n)
uncached_time = time.time() - start

fib_cached(n)
start = time.time()
result_cached = fib_cached(n)
cached_time = time.time() - start

print(f"fib({n}) = {result_uncached}")
print("Results match:", result_uncached == result_cached)
print("Cache lookup faster than fresh computation:", cached_time < uncached_time)
$uu225$),
   array['python'], 'published', false, 3)
) as v(id, topic_id, title, difficulty, slug, description,
       examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
       supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- Security — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'advanced-python-career-readiness/security')
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-py-security-1', null::text, $uu235$Password Hashing and Verification$uu235$, 'Easy', 'py-security-password-hashing-verification',
   $uu236$Write hash_password(password) and verify_password(password, hashed) using bcrypt, and test verification with both a correct and an incorrect password.

**Approach:** hash the given password once with bcrypt.hashpw()/bcrypt.gensalt(), then check both a correct-attempt and a wrong-attempt string against that single hash with bcrypt.checkpw().

**Input:** Three lines: the real password, a "correct" login attempt, and a "wrong" login attempt.

**Output:** Two lines: "Correct attempt valid: True" and "Wrong attempt valid: False".$uu236$,
   $uu237$[{"input": "MySecurePassword123\nMySecurePassword123\nWrongPassword", "output": "Correct attempt valid: True\nWrong attempt valid: False"}]$uu237$::jsonb,
   $uu238$["all three lines are non-empty strings with no newline"]$uu238$::jsonb,
   jsonb_build_object('python', $uu233$import bcrypt

def hash_password(password):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt())

def verify_password(password, hashed):
    # return True/False depending on whether password matches hashed
    pass

password = input()
attempt_correct = input()
attempt_wrong = input()

hashed = hash_password(password)
print("Correct attempt valid:", verify_password(attempt_correct, hashed))
print("Wrong attempt valid:", verify_password(attempt_wrong, hashed))
$uu233$),
   $uu239$["bcrypt.hashpw() and bcrypt.checkpw() both need bytes, not str — call .encode() on each password first.", "bcrypt.checkpw(password.encode(), hashed) returns True only if that password, once hashed, matches the stored hash.", "hashed already embeds the random salt bcrypt used, so checkpw() doesn't need the salt passed separately."]$uu239$::jsonb,
   $uu240$[{"input": "MySecurePassword123\nMySecurePassword123\nWrongPassword", "expected": "Correct attempt valid: True\nWrong attempt valid: False", "hidden": false}]$uu240$::jsonb,
   $uu241$hash_password produces a one-way, salted hash of the real password. verify_password re-hashes a login attempt internally (via bcrypt.checkpw, which extracts the salt from the stored hash) and compares it against the stored hash, without ever needing to reverse the hash back into plain text — matching attempts return True, non-matching ones return False.$uu241$,
   jsonb_build_object('python', $uu234$import bcrypt

def hash_password(password):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt())

def verify_password(password, hashed):
    return bcrypt.checkpw(password.encode(), hashed)

password = input()
attempt_correct = input()
attempt_wrong = input()

hashed = hash_password(password)
print("Correct attempt valid:", verify_password(attempt_correct, hashed))
print("Wrong attempt valid:", verify_password(attempt_wrong, hashed))
$uu234$),
   array['python'], 'published', false, 0),
  ('cp-py-security-2', null::text, $uu244$Environment Variable Loader$uu244$, 'Easy', 'py-security-environment-variable-loader',
   $uu245$Create a .env file containing a sample API_KEY, then load it using python-dotenv and print its value — without ever hardcoding the key in the script.

**Approach:** write the given key to a local .env file, call load_dotenv() to load it into the process environment, then read it back with os.environ.get() and print it.

**Input:** One line: the API key value to store.

**Output:** One line: the API key value, read back from the environment (not hardcoded).$uu245$,
   $uu246$[{"input": "abcd1234efgh5678", "output": "abcd1234efgh5678"}]$uu246$::jsonb,
   $uu247$["the input line contains no newline or '=' character"]$uu247$::jsonb,
   jsonb_build_object('python', $uu242$import os
from dotenv import load_dotenv

api_key_value = input()

# write a .env file containing API_KEY=<api_key_value>, then load it and print os.environ.get("API_KEY")
$uu242$),
   $uu248$["Write a line like f\"API_KEY={api_key_value}\\n\" into a file named \".env\".", "load_dotenv() (with no arguments) reads .env from the current directory into os.environ.", "os.environ.get(\"API_KEY\") safely returns the loaded value (or None if missing), instead of hardcoding it anywhere in the script."]$uu248$::jsonb,
   $uu249$[{"input": "abcd1234efgh5678", "expected": "abcd1234efgh5678", "hidden": false}]$uu249$::jsonb,
   $uu250$Writing the given value into a real .env file, then calling load_dotenv(), reproduces the exact workflow the notes describe: secrets live in a file separate from the source code, get loaded into the process environment at runtime, and are accessed via os.environ.get() rather than being hardcoded anywhere in the .py file itself.$uu250$,
   jsonb_build_object('python', $uu243$import os
from dotenv import load_dotenv

api_key_value = input()

with open(".env", "w") as f:
    f.write(f"API_KEY={api_key_value}\n")

load_dotenv()
api_key = os.environ.get("API_KEY")
print(api_key)
$uu243$),
   array['python'], 'published', false, 1),
  ('cp-py-security-3', null::text, $uu253$JWT Creation and Expiry Check$uu253$, 'Medium', 'py-security-jwt-creation-expiry-check',
   $uu254$Create two JWTs for the same user_id — one that expires an hour from now, and one that (deliberately) already expired an hour ago — then decode both and report the result.

**Note:** rather than literally creating a short-lived token and sleeping past its expiry (which would add a real, judge-timeout-risking delay to every run), this problem builds the "already expired" case directly by setting its exp claim in the past — testing the exact same jwt.decode()/ExpiredSignatureError behavior instantly and deterministically.

**Approach:** encode a valid_token (exp = now + 1 hour) and an expired_token (exp = now - 1 hour) for the given user_id, decode each in its own try/except, and print the outcome of both.

**Input:** One line: an integer user_id.

**Output:** Two lines: "Valid token decoded: user_id=<id>" and "Expired token: correctly rejected as expired".$uu254$,
   $uu255$[{"input": "42", "output": "Valid token decoded: user_id=42\nExpired token: correctly rejected as expired"}]$uu255$::jsonb,
   $uu256$["user_id is a positive integer"]$uu256$::jsonb,
   jsonb_build_object('python', $uu251$import jwt
import datetime

SECRET_KEY = "test-secret-key"

user_id = int(input())

# build valid_payload (exp = now + 1 hour) and expired_payload (exp = now - 1 hour),
# encode both with jwt.encode(), then decode each with jwt.decode() inside its own
# try/except catching jwt.ExpiredSignatureError, and print the two required lines
$uu251$),
   $uu257$["jwt.encode(payload, SECRET_KEY, algorithm=\"HS256\") signs a payload dict into a token string.", "Setting \"exp\" to a datetime already in the PAST (datetime.utcnow() - timedelta(hours=1)) makes a token that is expired the instant it's created — no need to wait for real time to pass.", "jwt.decode(token, SECRET_KEY, algorithms=[\"HS256\"]) raises jwt.ExpiredSignatureError for a token whose exp has already passed."]$uu257$::jsonb,
   $uu258$[{"input": "42", "expected": "Valid token decoded: user_id=42\nExpired token: correctly rejected as expired", "hidden": false}, {"input": "7", "expected": "Valid token decoded: user_id=7\nExpired token: correctly rejected as expired", "hidden": true}]$uu258$::jsonb,
   $uu259$Both tokens are created and decoded immediately — no real waiting is involved. The "valid" token's exp is set an hour in the future, so jwt.decode() succeeds normally. The "expired" token's exp is deliberately set an hour in the PAST, so jwt.decode() raises ExpiredSignatureError right away, exercising the exact same rejection path the notes describe (creating a token, waiting for it to expire, then failing to decode it) without needing an actual, judge-unsafe real-time delay.$uu259$,
   jsonb_build_object('python', $uu252$import jwt
import datetime

SECRET_KEY = "test-secret-key"

user_id = int(input())

valid_payload = {
    "user_id": user_id,
    "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1),
}
valid_token = jwt.encode(valid_payload, SECRET_KEY, algorithm="HS256")

expired_payload = {
    "user_id": user_id,
    "exp": datetime.datetime.utcnow() - datetime.timedelta(hours=1),
}
expired_token = jwt.encode(expired_payload, SECRET_KEY, algorithm="HS256")

try:
    decoded = jwt.decode(valid_token, SECRET_KEY, algorithms=["HS256"])
    print(f"Valid token decoded: user_id={decoded['user_id']}")
except jwt.ExpiredSignatureError:
    print("Valid token: unexpectedly expired")

try:
    jwt.decode(expired_token, SECRET_KEY, algorithms=["HS256"])
    print("Expired token: unexpectedly valid")
except jwt.ExpiredSignatureError:
    print("Expired token: correctly rejected as expired")
$uu252$),
   array['python'], 'published', false, 2),
  ('cp-py-security-4', null::text, $uu262$Signup Input Validation$uu262$, 'Easy', 'py-security-signup-input-validation',
   $uu263$Write validate_signup(username, age) that raises a ValueError with a clear message if the username is empty or over 50 characters, or if age is not a non-negative integer under 150.

**Input:** Two lines: a username, and an age (as an integer).

**Output:** One line: "Valid signup" if both pass validation, otherwise "Error: <message>".$uu263$,
   $uu264$[{"input": "aditi\n25", "output": "Valid signup"}]$uu264$::jsonb,
   $uu265$["age parses as an integer"]$uu265$::jsonb,
   jsonb_build_object('python', $uu260$def validate_signup(username, age):
    # raise ValueError("Invalid username") if username is empty or over 50 chars
    # raise ValueError("Invalid age") if age is not an int in [0, 150]
    pass

username = input()
age = int(input())

try:
    validate_signup(username, age)
    print("Valid signup")
except ValueError as e:
    print(f"Error: {e}")
$uu260$),
   $uu266$["Check the username condition first: `if not username or len(username) > 50:`", "Check the age condition next: `if not isinstance(age, int) or age < 0 or age > 150:`", "Each raised ValueError's message becomes the text printed after \"Error: \"."]$uu266$::jsonb,
   $uu267$[{"input": "aditi\n25", "expected": "Valid signup", "hidden": false}, {"input": "\n25", "expected": "Error: Invalid username", "hidden": true}, {"input": "aditi\n200", "expected": "Error: Invalid age", "hidden": true}]$uu267$::jsonb,
   $uu268$validate_signup checks the username first (empty or over 50 characters both raise "Invalid username"), then the age (not an int, negative, or over 150 all raise "Invalid age"). The calling code's try/except prints "Valid signup" only when neither check raises, otherwise it prints the specific ValueError's message.$uu268$,
   jsonb_build_object('python', $uu261$def validate_signup(username, age):
    if not username or len(username) > 50:
        raise ValueError("Invalid username")
    if not isinstance(age, int) or age < 0 or age > 150:
        raise ValueError("Invalid age")
    return True

username = input()
age = int(input())

try:
    validate_signup(username, age)
    print("Valid signup")
except ValueError as e:
    print(f"Error: {e}")
$uu261$),
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
   where source_kind = 'python_tutorial' and source_ref like 'advanced-python-career-readiness/%';
  if v_topics <> 5 then raise exception 'validation: expected 5 advanced-python-career-readiness topics, found %', v_topics; end if;

  select count(*) into v_tests from public.practice_tests where id in ('pt-py-advanced-python', 'pt-py-concurrency-performance', 'pt-py-security', 'pt-py-deployment-devops');
  if v_tests <> 4 then raise exception 'validation: expected 4 new python topic mock tests, found %', v_tests; end if;

  select count(*) into v_bad_tests from public.practice_tests
   where id in ('pt-py-advanced-python', 'pt-py-concurrency-performance', 'pt-py-security', 'pt-py-deployment-devops')
     and (question_count <> 10 or duration_minutes <> 10);
  if v_bad_tests > 0 then raise exception 'validation: % new python mock tests do not have 10 questions / 10 minute duration', v_bad_tests; end if;

  select count(*) into v_questions from public.test_questions where test_id in ('pt-py-advanced-python', 'pt-py-concurrency-performance', 'pt-py-security', 'pt-py-deployment-devops');
  if v_questions <> 40 then raise exception 'validation: expected 40 new python MCQ rows (4 x 10), found %', v_questions; end if;

  select count(*) into v_problems from public.dsa_problems where id like 'cp-py-advanced-python-%' or id like 'cp-py-concurrency-performance-%' or id like 'cp-py-security-%';
  if v_problems <> 12 then raise exception 'validation: expected 12 new python coding problems, found %', v_problems; end if;

  raise notice '0055 OK: Python Tutorial Advanced Python & Career Readiness — 5 topics (4 with a mock test, 1 notes-only), 40 MCQs, 12 coding problems. All 30 source chapters now seeded.';
end $$;

notify pgrst, 'reload schema';
