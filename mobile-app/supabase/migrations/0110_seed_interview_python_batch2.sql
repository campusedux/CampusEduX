-- admin-panel/supabase/migrations/082_seed_interview_python_batch2.sql
-- CANONICAL PAIR -- the body below this line is byte-identical to its twin
-- twin: mobile-app/supabase/migrations/0110_seed_interview_python_batch2.sql ; apply either, the other is a guarded no-op.
--
-- ============================================================================
-- BODY -- Python Interview Questions content, batch 2 of 4
-- (mobile 0110_seed_interview_python_batch2.sql  ==  admin 082_seed_interview_python_batch2.sql
--  below this header -- byte-identical, guarded, idempotent, additive.)
-- ============================================================================
-- WHAT / WHY
--   Seeds the next 6 of 22 Python Interview Questions topics, covering
--   source questions in this batch's ranges below, for
--   /practice/interview-questions/python/<topic>. Follows batch 1
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
    raise exception '0110_seed_interview_python_batch2/082_seed_interview_python_batch2: interview_categories/topics/questions not found -- apply 0103_interview_questions.sql (admin 075) first.';
  end if;
  if not exists (select 1 from public.interview_categories where id = 'python') then
    raise exception '0110_seed_interview_python_batch2/082_seed_interview_python_batch2: python category not found -- apply 0109_seed_interview_python_batch1.sql (admin 081_seed_interview_python_batch1.sql) first.';
  end if;
end $$;

-- ===========================================================================
-- 1. TOPICS (batch 2 of 4)
-- ===========================================================================
insert into public.interview_topics (id, category_id, name, slug, description, sort_order)
values
  ('python-oop', 'python', 'OOP', 'oop',
   $td$Classes, objects, constructors, inheritance, MRO, polymorphism, encapsulation, abstraction, and property-based APIs.$td$, 70),
  ('python-file-handling', 'python', 'File Handling', 'file-handling',
   $td$Opening files, file modes, and why context managers are the safe way to work with them.$td$, 80),
  ('python-modules-packages', 'python', 'Modules & Packages', 'modules-packages',
   $td$Modules, packages, the import system, pip, and the script-vs-import execution guard.$td$, 90),
  ('python-iterators-generators-functional', 'python', 'Iterators, Generators & Functional Tools', 'iterators-generators-functional',
   $td$Iterables, iterators, generators, and the built-in functional tools -- enumerate, zip, map, filter, reduce.$td$, 100),
  ('python-concurrency', 'python', 'Multithreading & Concurrency', 'concurrency',
   $td$Threading, the GIL, multiprocessing, concurrent.futures, asyncio, and safe coordination of concurrent work.$td$, 110),
  ('python-memory-management', 'python', 'Memory Management', 'memory-management',
   $td$Reference counting, garbage collection, shallow vs deep copy, object identity, weak references, and context managers.$td$, 120)
on conflict (id) do update set
  category_id = excluded.category_id, name = excluded.name, slug = excluded.slug,
  description = excluded.description, sort_order = excluded.sort_order, updated_at = now();

-- ===========================================================================
-- 2. QUESTIONS
-- ===========================================================================

-- ---- OOP (14) -------------------------------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, sort_order)
values
('python-oop-01','python-oop', -- source Q62
 $q$What is a class in Python?$q$,
 $a$A class defines the structure and behavior of objects. It can contain attributes, methods, class attributes, properties, and special methods.$a$,
 $ex$```python
class Student:
    def study(self):
        print("Studying")

s = Student()
s.study()
```$ex$,
 $ip$Python classes are objects too and support dynamic behavior.$ip$,
 1),
('python-oop-02','python-oop', -- source Q63
 $q$What is an object?$q$,
 $a$An object is an instance of a class with its own state and behavior. Multiple instances of the same class can hold different attribute values.$a$,
 $ex$```python
class Student:
    pass

a = Student()
b = Student()
a.name = "Amit"
b.name = "Neha"
```$ex$,
 $ip$Object identity is distinct from object equality.$ip$,
 2),
('python-oop-03','python-oop', -- source Q64
 $q$What is `__init__`?$q$,
 $a$`__init__` is an initializer method called after a new instance has been created. It commonly assigns initial instance attributes.$a$,
 $ex$```python
class User:
    def __init__(self, name):
        self.name = name

u = User("Amit")
print(u.name)
```$ex$,
 $ip$`__init__` initializes an object; `__new__` is involved in creating the instance itself.$ip$,
 3),
('python-oop-04','python-oop', -- source Q65
 $q$What is self?$q$,
 $a$`self` is the conventional name for the instance reference passed to an instance method. It lets the method access that object's attributes and other methods.$a$,
 $ex$```python
class User:
    def __init__(self, name):
        self.name = name
    def greet(self):
        return f"Hello {self.name}"
```$ex$,
 $ip$`self` is not a reserved keyword, but using the conventional name is strongly recommended.$ip$,
 4),
('python-oop-05','python-oop', -- source Q66
 $q$What is class variable?$q$,
 $a$A class variable is an attribute stored on the class and normally shared by instances unless an instance shadows it with its own attribute.$a$,
 $ex$```python
class Employee:
    company = "ABC"

print(Employee.company)
```$ex$,
 $ip$Be careful with mutable class attributes because changes can be visible through every instance that shares the same object.$ip$,
 5),
('python-oop-06','python-oop', -- source Q67
 $q$What is instance variable?$q$,
 $a$An instance variable belongs to a particular object and is commonly assigned through `self` in `__init__` or another method.$a$,
 $ex$```python
class User:
    def __init__(self, name):
        self.name = name

a = User("A")
b = User("B")
```$ex$,
 $ip$Each instance has its own binding for normal instance attributes.$ip$,
 6),
('python-oop-07','python-oop', -- source Q68
 $q$What is inheritance?$q$,
 $a$Inheritance lets a class reuse and extend behavior from a parent class. Python supports single and multiple inheritance.$a$,
 $ex$```python
class Animal:
    def speak(self): print("sound")
class Dog(Animal):
    pass

Dog().speak()
```$ex$,
 $ip$Use inheritance when the subtype relationship is meaningful; composition is often better for reusable components.$ip$,
 7),
('python-oop-08','python-oop', -- source Q69
 $q$What is multiple inheritance?$q$,
 $a$Multiple inheritance allows a class to inherit from more than one parent class.$a$,
 $ex$```python
class A:
    def a(self): print("A")
class B:
    def b(self): print("B")
class C(A, B):
    pass

C().a(); C().b()
```$ex$,
 $ip$Python resolves methods using MRO, so understand the hierarchy before relying on multiple inheritance.$ip$,
 8),
('python-oop-09','python-oop', -- source Q70
 $q$What is MRO?$q$,
 $a$Method Resolution Order is the order Python follows when searching classes for attributes and methods. Python uses C3 linearization for modern class hierarchies.$a$,
 $ex$```python
class A: pass
class B(A): pass
print(B.mro())
```$ex$,
 $ip$MRO becomes especially important with multiple inheritance.$ip$,
 9),
('python-oop-10','python-oop', -- source Q71
 $q$What is polymorphism?$q$,
 $a$Polymorphism means code can operate on different objects through a common behavior without requiring the exact concrete type. Python commonly achieves this through duck typing.$a$,
 $ex$```python
class Dog:
    def speak(self): return "bark"
class Cat:
    def speak(self): return "meow"

def talk(animal): print(animal.speak())
```$ex$,
 $ip$Python often cares about supported behavior rather than a shared explicit parent class.$ip$,
 10),
('python-oop-11','python-oop', -- source Q72
 $q$What is encapsulation in Python?$q$,
 $a$Python encourages encapsulation through conventions, properties, and controlled APIs rather than strict private enforcement. A leading underscore indicates internal use by convention.$a$,
 $ex$```python
class Account:
    def __init__(self):
        self._balance = 0
    @property
    def balance(self):
        return self._balance
```$ex$,
 $ip$`__name` triggers name mangling; it does not create absolute security or true private storage.$ip$,
 11),
('python-oop-12','python-oop', -- source Q73
 $q$What is abstraction?$q$,
 $a$Abstraction exposes the operations callers need while hiding implementation details. Python can use abstract base classes from the `abc` module.$a$,
 $ex$```python
from abc import ABC, abstractmethod
class Payment(ABC):
    @abstractmethod
    def pay(self, amount): pass
```$ex$,
 $ip$An abstract base class can enforce that concrete subclasses implement required abstract methods.$ip$,
 12),
('python-oop-13','python-oop', -- source Q74
 $q$What is @property?$q$,
 $a$`property` lets a method be accessed using attribute syntax and is commonly used to control reading, validation, or computed values.$a$,
 $ex$```python
class Circle:
    def __init__(self, r): self.r = r
    @property
    def area(self): return 3.14 * self.r * self.r

print(Circle(2).area)
```$ex$,
 $ip$Properties are useful for preserving a clean public API while changing implementation details internally.$ip$,
 13),
('python-oop-14','python-oop', -- source Q75
 $q$staticmethod vs classmethod?$q$,
 $a$A static method receives no automatic instance or class argument. A class method receives the class as `cls` and is useful for alternate constructors or class-level behavior.$a$,
 $ex$```python
class User:
    @staticmethod
    def normalize(name): return name.strip().lower()
    @classmethod
    def guest(cls): return cls("Guest")
    def __init__(self, name): self.name = name
```$ex$,
 $ip$Choose classmethod when behavior needs the class itself; staticmethod when no automatic context is required.$ip$,
 14)
on conflict (id) do update set
  topic_id = excluded.topic_id, question = excluded.question, answer = excluded.answer,
  example = excluded.example, important_point = excluded.important_point,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- File Handling (3) ---------------------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, sort_order)
values
('python-file-handling-01','python-file-handling', -- source Q76
 $q$How do you open a file?$q$,
 $a$Use `open()` with a mode and preferably a `with` statement so the file is closed automatically.$a$,
 $ex$```python
with open("data.txt", "r", encoding="utf-8") as file:
    text = file.read()
print(text)
```$ex$,
 $ip$Specify encoding for text files when portability matters.$ip$,
 1),
('python-file-handling-02','python-file-handling', -- source Q77
 $q$What are common file modes?$q$,
 $a$`r` reads, `w` writes and truncates, `a` appends, `x` creates exclusively, and modes can be combined with `b` for binary or `+` for updating.$a$,
 $ex$```python
with open("log.txt", "a", encoding="utf-8") as f:
    f.write("Started\n")
```$ex$,
 $ip$`w` can destroy existing file contents, so use it deliberately.$ip$,
 2),
('python-file-handling-03','python-file-handling', -- source Q78
 $q$Why use with for files?$q$,
 $a$A context manager ensures the file resource is closed when the block exits, including when an exception occurs.$a$,
 $ex$```python
with open("data.txt", encoding="utf-8") as f:
    first = f.readline()
```$ex$,
 $ip$This pattern is safer than relying on garbage collection to close files.$ip$,
 3)
on conflict (id) do update set
  topic_id = excluded.topic_id, question = excluded.question, answer = excluded.answer,
  example = excluded.example, important_point = excluded.important_point,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- Modules & Packages (9) ----------------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, sort_order)
values
('python-modules-packages-01','python-modules-packages', -- source Q79
 $q$What is a module?$q$,
 $a$A module is a Python file containing definitions and executable statements that can be imported by other code.$a$,
 $ex$```python
# math_utils.py
def add(a, b): return a + b

# another file
from math_utils import add
print(add(2, 3))
```$ex$,
 $ip$Keep module-level side effects small; use an `if __name__ == "__main__"` guard for script-only execution.$ip$,
 1),
('python-modules-packages-02','python-modules-packages', -- source Q80
 $q$What is a package?$q$,
 $a$A package is a structured collection of Python modules, normally represented by directories and importable package namespaces.$a$,
 $ex$```text
shop/
    __init__.py
    orders.py
    users.py
```$ex$,
 $ip$Modern Python can support namespace packages without an `__init__.py`, but regular packages commonly include one.$ip$,
 2),
('python-modules-packages-03','python-modules-packages', -- source Q81
 $q$What is `__name__` == '`__main__`'?$q$,
 $a$When a Python file is run directly, its `__name__` is set to `__main__`. When imported, its `__name__` is the module name. The guard separates script execution from importable definitions.$a$,
 $ex$```python
def main():
    print("Running app")

if __name__ == "__main__":
    main()
```$ex$,
 $ip$This prevents the guarded code from running merely because another module imports the file.$ip$,
 3),
('python-modules-packages-04','python-modules-packages', -- source Q82
 $q$What is pip?$q$,
 $a$pip is the standard package installer commonly used to install Python packages from package indexes and other sources.$a$,
 $ex$```bash
python -m pip install requests
```$ex$,
 $ip$Using `python -m pip` helps ensure pip belongs to the intended Python interpreter/environment.$ip$,
 4),
('python-modules-packages-05','python-modules-packages', -- source Q83
 $q$What is a virtual environment?$q$,
 $a$A virtual environment isolates a project's Python interpreter context and installed packages from other projects.$a$,
 $ex$```bash
python -m venv .venv
# activate it according to the operating system
python -m pip install requests
```$ex$,
 $ip$Create separate environments for projects with different dependency requirements.$ip$,
 5),
('python-modules-packages-06','python-modules-packages', -- source Q84
 $q$What is requirements.txt?$q$,
 $a$A requirements file records project dependencies so another environment can install compatible packages with pip.$a$,
 $ex$```text
requests==2.32.3
pytest==8.3.2
```$ex$,
 $ip$Pinning every dependency can improve reproducibility, but teams may use modern dependency-management tools instead.$ip$,
 6),
('python-modules-packages-07','python-modules-packages', -- source Q142
 $q$What is import?$q$,
 $a$`import` loads a module and binds a module name in the importing namespace. `from module import name` binds a specific attribute directly.$a$,
 $ex$```python
import math
print(math.sqrt(25))
```$ex$,
 $ip$Circular imports can cause partially initialized modules; organize dependencies to avoid unnecessary cycles.$ip$,
 7),
('python-modules-packages-08','python-modules-packages', -- source Q143
 $q$What is circular import?$q$,
 $a$A circular import occurs when module A imports B while B directly or indirectly imports A. It can produce partially initialized modules and import errors.$a$,
 $ex$```text
A -> imports B
B -> imports A
```$ex$,
 $ip$Move shared definitions into a third module or redesign dependencies rather than relying on import timing tricks.$ip$,
 8),
('python-modules-packages-09','python-modules-packages', -- source Q144
 $q$What is `__all__`?$q$,
 $a$`__all__` defines names intended for wildcard imports such as `from module import *`. It also documents a module's public export list for that use case.$a$,
 $ex$```python
__all__ = ["add", "multiply"]
```$ex$,
 $ip$Explicit imports are usually clearer than wildcard imports.$ip$,
 9)
on conflict (id) do update set
  topic_id = excluded.topic_id, question = excluded.question, answer = excluded.answer,
  example = excluded.example, important_point = excluded.important_point,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- Iterators, Generators & Functional Tools (14) ------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, sort_order)
values
('python-iterators-generators-functional-01','python-iterators-generators-functional', -- source Q86
 $q$What is an iterable?$q$,
 $a$An iterable is an object that can provide an iterator, allowing it to be traversed with a for loop. Lists, tuples, strings, dictionaries, sets, and ranges are common iterables.$a$,
 $ex$```python
for x in [1, 2, 3]:
    print(x)
```$ex$,
 $ip$An iterable is not necessarily itself an iterator.$ip$,
 1),
('python-iterators-generators-functional-02','python-iterators-generators-functional', -- source Q87
 $q$What is an iterator?$q$,
 $a$An iterator implements the iterator protocol, providing `__iter__()` returning itself and `__next__()` returning the next value or raising StopIteration.$a$,
 $ex$```python
it = iter([10, 20])
print(next(it))
print(next(it))
```$ex$,
 $ip$An iterator is stateful and is normally consumed as values are requested.$ip$,
 2),
('python-iterators-generators-functional-03','python-iterators-generators-functional', -- source Q88
 $q$What is a generator?$q$,
 $a$A generator is a lazy iterator commonly created with a function containing `yield` or a generator expression. It produces values on demand instead of building the entire result at once.$a$,
 $ex$```python
def numbers():
    yield 1
    yield 2

for n in numbers():
    print(n)
```$ex$,
 $ip$Generators are useful for large or streaming data because they can keep memory usage low.$ip$,
 3),
('python-iterators-generators-functional-04','python-iterators-generators-functional', -- source Q89
 $q$yield vs return?$q$,
 $a$`return` ends a normal function and provides one final result. `yield` pauses a generator function and preserves its execution state so it can continue later.$a$,
 $ex$```python
def count():
    yield 1
    yield 2

print(list(count()))
```$ex$,
 $ip$A function containing yield returns a generator iterator when called.$ip$,
 4),
('python-iterators-generators-functional-05','python-iterators-generators-functional', -- source Q90
 $q$Generator expression vs list comprehension?$q$,
 $a$A list comprehension creates the complete list immediately. A generator expression produces values lazily as they are iterated.$a$,
 $ex$```python
list_values = [x*x for x in range(5)]
gen_values = (x*x for x in range(5))
print(list_values)
print(list(gen_values))
```$ex$,
 $ip$Use generators when immediate materialization is unnecessary or the input is large.$ip$,
 5),
('python-iterators-generators-functional-06','python-iterators-generators-functional', -- source Q91
 $q$What is enumerate()?$q$,
 $a$`enumerate()` produces pairs containing an index and an item while iterating, avoiding manual counter management.$a$,
 $ex$```python
for index, name in enumerate(["A", "B"], start=1):
    print(index, name)
```$ex$,
 $ip$The start value changes the reported index; it does not modify the underlying sequence.$ip$,
 6),
('python-iterators-generators-functional-07','python-iterators-generators-functional', -- source Q92
 $q$What is zip()?$q$,
 $a$`zip()` combines elements from multiple iterables into tuples, stopping when the shortest input is exhausted by default.$a$,
 $ex$```python
names = ["A", "B"]
marks = [80, 90]
for name, mark in zip(names, marks):
    print(name, mark)
```$ex$,
 $ip$Modern Python also provides `zip(..., strict=True)` when unequal lengths should raise an error.$ip$,
 7),
('python-iterators-generators-functional-08','python-iterators-generators-functional', -- source Q93
 $q$What is map()?$q$,
 $a$`map()` applies a function to each item of an iterable and returns a lazy map iterator in Python 3.$a$,
 $ex$```python
values = map(str, [1, 2, 3])
print(list(values))
```$ex$,
 $ip$A comprehension is often easier to read when the transformation is simple.$ip$,
 8),
('python-iterators-generators-functional-09','python-iterators-generators-functional', -- source Q94
 $q$What is filter()?$q$,
 $a$`filter()` lazily keeps elements for which a predicate is true.$a$,
 $ex$```python
values = filter(lambda x: x % 2 == 0, range(6))
print(list(values))
```$ex$,
 $ip$Comprehensions can be clearer for many filtering tasks.$ip$,
 9),
('python-iterators-generators-functional-10','python-iterators-generators-functional', -- source Q95
 $q$What is reduce()?$q$,
 $a$`functools.reduce()` repeatedly combines iterable values using a binary function to produce one accumulated result.$a$,
 $ex$```python
from functools import reduce
print(reduce(lambda a, b: a + b, [1, 2, 3, 4], 0))
```$ex$,
 $ip$For common operations such as sum, prefer the built-in function when available.$ip$,
 10),
('python-iterators-generators-functional-11','python-iterators-generators-functional', -- source Q205
 $q$What is range()?$q$,
 $a$`range()` represents an arithmetic progression of integers and produces values lazily when iterated.$a$,
 $ex$```python
for i in range(1, 5):
    print(i)
```$ex$,
 $ip$The stop value is excluded, and range objects support efficient membership/index-related operations without storing every integer.$ip$,
 11),
('python-iterators-generators-functional-12','python-iterators-generators-functional', -- source Q206
 $q$Why use enumerate instead of range(len())?$q$,
 $a$`enumerate()` directly provides both the item and its index, making iteration clearer and avoiding manual indexing.$a$,
 $ex$```python
for i, value in enumerate(values):
    print(i, value)
```$ex$,
 $ip$Use range(len(...)) when you genuinely need index-based mutation or multiple indexed accesses.$ip$,
 12),
('python-iterators-generators-functional-13','python-iterators-generators-functional', -- source Q210
 $q$What is enumerate start parameter?$q$,
 $a$The `start` argument controls the initial index returned by enumerate without changing the underlying iterable.$a$,
 $ex$```python
for i, value in enumerate(["A", "B"], start=100):
    print(i, value)
```$ex$,
 $ip$It is useful when displayed numbering should begin at a domain-specific value.$ip$,
 13),
('python-iterators-generators-functional-14','python-iterators-generators-functional', -- source Q211
 $q$What is zip strict mode?$q$,
 $a$`zip(..., strict=True)` raises ValueError if the input iterables do not have equal lengths, helping detect silent data truncation.$a$,
 $ex$```python
for a, b in zip([1,2], [10,20], strict=True):
    print(a, b)
```$ex$,
 $ip$Use strict mode when unequal lengths indicate a data error.$ip$,
 14)
on conflict (id) do update set
  topic_id = excluded.topic_id, question = excluded.question, answer = excluded.answer,
  example = excluded.example, important_point = excluded.important_point,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- Multithreading & Concurrency (9) ------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, sort_order)
values
('python-concurrency-01','python-concurrency', -- source Q96
 $q$What is threading in Python?$q$,
 $a$Threading runs multiple threads within one process. It is useful for I/O-bound tasks where threads can make progress while other work waits.$a$,
 $ex$```python
import threading

t = threading.Thread(target=lambda: print("Task"))
t.start()
t.join()
```$ex$,
 $ip$Threads share process memory, so shared mutable state needs careful synchronization.$ip$,
 1),
('python-concurrency-02','python-concurrency', -- source Q97
 $q$What is the GIL?$q$,
 $a$In standard CPython builds, the Global Interpreter Lock historically allows only one thread at a time to execute Python bytecode in a process. It simplifies parts of memory management but limits CPU-bound parallelism with ordinary threads.$a$,
 $ex$```python
import threading
print(threading.active_count())
```$ex$,
 $ip$Modern Python has optional/free-threaded builds in newer releases; always state the interpreter/build assumption in advanced interviews.$ip$,
 2),
('python-concurrency-03','python-concurrency', -- source Q98
 $q$Threading vs multiprocessing?$q$,
 $a$Threading uses threads in one process and is often useful for I/O-bound work. Multiprocessing uses separate processes and can provide real CPU parallelism while avoiding a shared GIL between processes.$a$,
 $ex$```python
from concurrent.futures import ProcessPoolExecutor
with ProcessPoolExecutor() as pool:
    print(list(pool.map(abs, [-2, -3])))
```$ex$,
 $ip$Processes have higher communication and startup costs and require careful data sharing/serialization.$ip$,
 3),
('python-concurrency-04','python-concurrency', -- source Q99
 $q$What is concurrent.futures?$q$,
 $a$`concurrent.futures` provides high-level executors for running callables using threads or processes and collecting results through Future objects.$a$,
 $ex$```python
from concurrent.futures import ThreadPoolExecutor
with ThreadPoolExecutor(max_workers=2) as ex:
    results = list(ex.map(str, [1, 2, 3]))
print(results)
```$ex$,
 $ip$Choose ThreadPoolExecutor or ProcessPoolExecutor based on workload and runtime constraints.$ip$,
 4),
('python-concurrency-05','python-concurrency', -- source Q100
 $q$What is asyncio?$q$,
 $a$asyncio provides an event-loop-based model for cooperative asynchronous I/O using `async` functions, `await`, tasks, and asynchronous libraries.$a$,
 $ex$```python
import asyncio

async def main():
    await asyncio.sleep(0.1)
    print("done")

asyncio.run(main())
```$ex$,
 $ip$Async code does not automatically make CPU-heavy work faster; it is primarily useful for concurrent I/O.$ip$,
 5),
('python-concurrency-06','python-concurrency', -- source Q101
 $q$What is a race condition?$q$,
 $a$A race condition occurs when program correctness depends on the timing of concurrent operations on shared state.$a$,
 $ex$```python
# Two workers updating shared state without a proper synchronization strategy
```$ex$,
 $ip$Use locks, thread-safe structures, message passing, or designs that minimize shared mutable state.$ip$,
 6),
('python-concurrency-07','python-concurrency', -- source Q102
 $q$What is Lock?$q$,
 $a$`threading.Lock` provides mutual exclusion so only one thread at a time can enter a protected critical section.$a$,
 $ex$```python
import threading
lock = threading.Lock()
with lock:
    # update shared state safely
    pass
```$ex$,
 $ip$Keep critical sections small to reduce contention and deadlock risk.$ip$,
 7),
('python-concurrency-08','python-concurrency', -- source Q103
 $q$What is a daemon thread?$q$,
 $a$A daemon thread is a background thread that does not keep the Python program alive once all non-daemon threads have finished.$a$,
 $ex$```python
import threading

t = threading.Thread(target=lambda: None, daemon=True)
t.start()
```$ex$,
 $ip$Do not use daemon threads when important work or cleanup must be guaranteed to finish.$ip$,
 8),
('python-concurrency-09','python-concurrency', -- source Q104
 $q$What is a process pool?$q$,
 $a$A process pool maintains reusable worker processes and distributes submitted tasks among them. It is useful for CPU-heavy independent tasks.$a$,
 $ex$```python
from concurrent.futures import ProcessPoolExecutor

def square(x): return x*x
with ProcessPoolExecutor() as pool:
    print(list(pool.map(square, [1,2,3])))
```$ex$,
 $ip$Functions and arguments sent to worker processes generally need to be serializable by the chosen multiprocessing mechanism.$ip$,
 9)
on conflict (id) do update set
  topic_id = excluded.topic_id, question = excluded.question, answer = excluded.answer,
  example = excluded.example, important_point = excluded.important_point,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- Memory Management (14) -----------------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, sort_order)
values
('python-memory-management-01','python-memory-management', -- source Q105
 $q$How does Python manage memory?$q$,
 $a$Python implementations manage objects in a private runtime memory space. CPython primarily uses reference counting plus a cyclic garbage collector to reclaim unreachable reference cycles.$a$,
 $ex$```python
a = {"x": 1}
b = a
del a
print(b)
```$ex$,
 $ip$Memory-management details are implementation-specific; avoid presenting CPython internals as universal Python language rules.$ip$,
 1),
('python-memory-management-02','python-memory-management', -- source Q106
 $q$What is reference counting?$q$,
 $a$In CPython, objects maintain a reference count representing active references. When the count reaches zero, the object's memory can generally be reclaimed immediately.$a$,
 $ex$```python
import sys
x = []
print(sys.getrefcount(x))
```$ex$,
 $ip$`getrefcount()` itself temporarily creates another reference, so its result is higher than expected.$ip$,
 2),
('python-memory-management-03','python-memory-management', -- source Q107
 $q$What is garbage collection?$q$,
 $a$Python's cyclic garbage collector detects groups of objects that reference each other but are no longer reachable from live program roots.$a$,
 $ex$```python
import gc
print(gc.isenabled())
```$ex$,
 $ip$Garbage collection does not replace explicit management of external resources such as files or database connections.$ip$,
 3),
('python-memory-management-04','python-memory-management', -- source Q108
 $q$What is shallow copy?$q$,
 $a$A shallow copy creates a new outer container but keeps references to the same nested objects.$a$,
 $ex$```python
import copy
original = [[1, 2], [3, 4]]
clone = copy.copy(original)
clone[0].append(9)
print(original)
```$ex$,
 $ip$Changes to nested mutable objects can therefore appear through both structures.$ip$,
 4),
('python-memory-management-05','python-memory-management', -- source Q109
 $q$What is deep copy?$q$,
 $a$A deep copy recursively copies nested objects according to the copy module's rules, producing a more independent object graph.$a$,
 $ex$```python
import copy
original = [[1, 2]]
clone = copy.deepcopy(original)
clone[0].append(9)
print(original, clone)
```$ex$,
 $ip$Deep copying can be expensive and may not be appropriate for objects holding external resources or complex graphs.$ip$,
 5),
('python-memory-management-06','python-memory-management', -- source Q110
 $q$What is id()?$q$,
 $a$`id(obj)` returns an integer identifying an object for its lifetime. In CPython it commonly corresponds to the object's memory address, but that is an implementation detail.$a$,
 $ex$```python
x = object()
print(id(x))
```$ex$,
 $ip$Do not use id values as persistent identifiers.$ip$,
 6),
('python-memory-management-07','python-memory-management', -- source Q111
 $q$What is garbage collection vs resource cleanup?$q$,
 $a$Garbage collection reclaims memory for unreachable objects, while resource cleanup releases external resources such as file handles, sockets, locks, and database connections.$a$,
 $ex$```python
with open("data.txt") as f:
    data = f.read()
```$ex$,
 $ip$Use context managers or explicit close/release APIs for external resources instead of waiting for GC.$ip$,
 7),
('python-memory-management-08','python-memory-management', -- source Q112
 $q$What is a context manager?$q$,
 $a$A context manager defines setup and cleanup behavior around a block, normally through `__enter__` and `__exit__`, and is used with the `with` statement.$a$,
 $ex$```python
class Demo:
    def __enter__(self): print("start"); return self
    def __exit__(self, exc_type, exc, tb): print("cleanup")

with Demo():
    print("work")
```$ex$,
 $ip$A context manager can also suppress an exception by returning true from `__exit__`, so that behavior should be deliberate.$ip$,
 8),
('python-memory-management-09','python-memory-management', -- source Q113
 $q$What is dataclass?$q$,
 $a$`dataclasses.dataclass` generates common methods for classes primarily used to store data, such as an initializer and representations, according to its configuration.$a$,
 $ex$```python
from dataclasses import dataclass

@dataclass
class Student:
    name: str
    age: int

print(Student("Amit", 25))
```$ex$,
 $ip$A dataclass does not automatically make nested mutable data immutable.$ip$,
 9),
('python-memory-management-10','python-memory-management', -- source Q197
 $q$What is object identity?$q$,
 $a$Identity means whether two references refer to the exact same object. Python exposes identity comparison with `is`.$a$,
 $ex$```python
a = []
b = a
c = []
print(a is b)  # True
print(a is c)  # False
```$ex$,
 $ip$Use identity checks for singleton-like objects such as None, not ordinary value comparisons.$ip$,
 10),
('python-memory-management-11','python-memory-management', -- source Q198
 $q$What is garbage collector generation?$q$,
 $a$CPython's cyclic garbage collector historically groups tracked objects into generations so long-lived objects can be scanned differently from newly allocated ones.$a$,
 $ex$```python
import gc
print(gc.get_threshold())
```$ex$,
 $ip$Exact GC implementation details can change between Python releases, so use them for explanation rather than hard-coded application assumptions.$ip$,
 11),
('python-memory-management-12','python-memory-management', -- source Q199
 $q$What is weakref?$q$,
 $a$The `weakref` module creates references that do not keep an object alive. Weak references are useful for caches and observer relationships where ownership should not be retained.$a$,
 $ex$```python
import weakref
class User: pass
u = User()
r = weakref.ref(u)
print(r() is u)
```$ex$,
 $ip$Not every object supports weak references; the class layout can affect support.$ip$,
 12),
('python-memory-management-13','python-memory-management', -- source Q214
 $q$What is contextlib?$q$,
 $a$`contextlib` contains helpers for building and composing context managers, including `contextmanager`, `closing`, and `nullcontext`.$a$,
 $ex$```python
from contextlib import contextmanager

@contextmanager
def demo():
    print("start")
    try: yield
    finally: print("cleanup")

with demo(): print("work")
```$ex$,
 $ip$Ensure cleanup is placed in a finally block inside generator-based context managers.$ip$,
 13),
('python-memory-management-14','python-memory-management', -- source Q233
 $q$What is copy.copy vs assignment?$q$,
 $a$Assignment creates another reference to the same object; `copy.copy()` creates a new outer object with shared nested references.$a$,
 $ex$```python
import copy
a = [[1]]
b = a
c = copy.copy(a)
print(a is b, a is c)
```$ex$,
 $ip$This distinction is fundamental when working with mutable containers.$ip$,
 14)
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
  select count(*) into v_count from public.interview_topics where id = any(array['python-oop', 'python-file-handling', 'python-modules-packages', 'python-iterators-generators-functional', 'python-concurrency', 'python-memory-management']);
  if v_count <> 6 then
    raise exception 'validation: expected 6 topics for this batch, found %', v_count;
  end if;
  select count(*) into v_count from public.interview_questions where topic_id = any(array['python-oop', 'python-file-handling', 'python-modules-packages', 'python-iterators-generators-functional', 'python-concurrency', 'python-memory-management']);
  if v_count <> 63 then
    raise exception 'validation: expected 63 questions for this batch, found %', v_count;
  end if;
  raise notice '0110_seed_interview_python_batch2 OK: % topics, % questions.', 6, 63;
end $$;

notify pgrst, 'reload schema';
