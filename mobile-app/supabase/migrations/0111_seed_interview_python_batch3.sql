-- admin-panel/supabase/migrations/083_seed_interview_python_batch3.sql
-- CANONICAL PAIR -- the body below this line is byte-identical to its twin
-- twin: mobile-app/supabase/migrations/0111_seed_interview_python_batch3.sql ; apply either, the other is a guarded no-op.
--
-- ============================================================================
-- BODY -- Python Interview Questions content, batch 3 of 4
-- (mobile 0111_seed_interview_python_batch3.sql  ==  admin 083_seed_interview_python_batch3.sql
--  below this header -- byte-identical, guarded, idempotent, additive.)
-- ============================================================================
-- WHAT / WHY
--   Seeds the next 5 of 22 Python Interview Questions topics, covering
--   source questions in this batch's ranges below, for
--   /practice/interview-questions/python/<topic>. Follows batch 2
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
    raise exception '0111_seed_interview_python_batch3/083_seed_interview_python_batch3: interview_categories/topics/questions not found -- apply 0103_interview_questions.sql (admin 075) first.';
  end if;
  if not exists (select 1 from public.interview_categories where id = 'python') then
    raise exception '0111_seed_interview_python_batch3/083_seed_interview_python_batch3: python category not found -- apply 0110_seed_interview_python_batch2.sql (admin 082_seed_interview_python_batch2.sql) first.';
  end if;
end $$;

-- ===========================================================================
-- 1. TOPICS (batch 3 of 4)
-- ===========================================================================
insert into public.interview_topics (id, category_id, name, slug, description, sort_order)
values
  ('python-advanced-python', 'python', 'Advanced Python', 'advanced-python',
   $td$Type hints, duck typing, EAFP/LBYL, monkey patching, introspection, __slots__, hashability, closures, and descriptors.$td$, 130),
  ('python-special-methods-operator-overloading', 'python', 'Special Methods & Operator Overloading', 'special-methods-operator-overloading',
   $td$Dunder methods for equality, representation, construction, and operator overloading, plus common OOP design patterns.$td$, 140),
  ('python-testing-tooling', 'python', 'Testing & Tooling', 'testing-tooling',
   $td$Logging, unit testing, pytest, calling REST APIs safely, and preventing SQL injection.$td$, 150),
  ('python-serialization', 'python', 'Serialization & Data Interchange', 'serialization',
   $td$Converting Python objects to and from JSON and pickle, and the safety trade-offs between them.$td$, 160),
  ('python-runtime-internals', 'python', 'Python Runtime Internals', 'runtime-internals',
   $td$The Python virtual machine, bytecode, and the __pycache__ bytecode cache.$td$, 170)
on conflict (id) do update set
  category_id = excluded.category_id, name = excluded.name, slug = excluded.slug,
  description = excluded.description, sort_order = excluded.sort_order, updated_at = now();

-- ===========================================================================
-- 2. QUESTIONS
-- ===========================================================================

-- ---- Advanced Python (15) -------------------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, sort_order)
values
('python-advanced-python-01','python-advanced-python', -- source Q114
 $q$What are type hints?$q$,
 $a$Type hints annotate expected types to improve readability, IDE support, static analysis, and documentation. Python does not normally enforce them at runtime by itself.$a$,
 $ex$```python
def add(a: int, b: int) -> int:
    return a + b
```$ex$,
 $ip$Tools such as mypy or pyright can analyze annotations before runtime.$ip$,
 1),
('python-advanced-python-02','python-advanced-python', -- source Q115
 $q$What is duck typing?$q$,
 $a$Duck typing means code focuses on whether an object supports the required operations rather than requiring a specific nominal type.$a$,
 $ex$```python
def save(writer):
    writer.write("hello")
```$ex$,
 $ip$The phrase comes from behavior: if an object provides the needed interface, the code can use it.$ip$,
 2),
('python-advanced-python-03','python-advanced-python', -- source Q116
 $q$What is EAFP?$q$,
 $a$EAFP means 'Easier to Ask Forgiveness than Permission'. Python code often performs an operation and catches a specific exception rather than checking every possible condition first.$a$,
 $ex$```python
try:
    value = data["name"]
except KeyError:
    value = "Unknown"
```$ex$,
 $ip$Use EAFP when exceptions represent expected control flow; do not catch broad exceptions.$ip$,
 3),
('python-advanced-python-04','python-advanced-python', -- source Q117
 $q$What is LBYL?$q$,
 $a$LBYL means 'Look Before You Leap'. Code checks a condition before performing an operation that might fail.$a$,
 $ex$```python
if "name" in data:
    value = data["name"]
```$ex$,
 $ip$LBYL can be useful when the check is cheap and avoids an expensive or disruptive failure, but the condition can still change between check and use in concurrent code.$ip$,
 4),
('python-advanced-python-05','python-advanced-python', -- source Q118
 $q$What is monkey patching?$q$,
 $a$Monkey patching changes or replaces attributes of modules or classes at runtime.$a$,
 $ex$```python
class Service:
    def run(self): return "real"

Service.run = lambda self: "patched"
print(Service().run())
```$ex$,
 $ip$It can be useful in controlled tests, but uncontrolled runtime patching can make systems difficult to reason about.$ip$,
 5),
('python-advanced-python-06','python-advanced-python', -- source Q119
 $q$What is introspection?$q$,
 $a$Introspection means examining objects, types, attributes, signatures, or other runtime information from within a program.$a$,
 $ex$```python
class User:
    pass

u = User()
print(type(u))
print(hasattr(u, "name"))
```$ex$,
 $ip$Reflection and introspection are powerful, but explicit interfaces are usually easier to maintain.$ip$,
 6),
('python-advanced-python-07','python-advanced-python', -- source Q120
 $q$What is `__slots__`?$q$,
 $a$`__slots__` can restrict which instance attributes are stored and may reduce per-instance memory usage by avoiding a normal instance dictionary in suitable classes.$a$,
 $ex$```python
class Point:
    __slots__ = ("x", "y")
    def __init__(self, x, y):
        self.x, self.y = x, y
```$ex$,
 $ip$Slots change class behavior and can affect inheritance, weak references, and dynamic attributes; benchmark before using them for optimization.$ip$,
 7),
('python-advanced-python-08','python-advanced-python', -- source Q121
 $q$What is hashability?$q$,
 $a$A hashable object has a hash value that remains stable during its lifetime and can be compared for equality. Hashable objects can be dictionary keys and set elements.$a$,
 $ex$```python
print(hash("Python"))
print({"Python": 1}["Python"])
```$ex$,
 $ip$Mutable objects whose equality/hash can change should not be used as hash keys.$ip$,
 8),
('python-advanced-python-09','python-advanced-python', -- source Q124
 $q$What is a closure?$q$,
 $a$A closure is a function that retains access to variables from its enclosing lexical scope even after the outer function has returned.$a$,
 $ex$```python
def multiplier(n):
    def multiply(x):
        return x * n
    return multiply

double = multiplier(2)
print(double(5))
```$ex$,
 $ip$Closures capture bindings; use `nonlocal` when the nested function needs to reassign an enclosing variable.$ip$,
 9),
('python-advanced-python-10','python-advanced-python', -- source Q125
 $q$What is late binding in closures?$q$,
 $a$Nested functions created in a loop commonly look up captured variables when called, not when the function is created. This can make every callback observe the final loop value.$a$,
 $ex$```python
funcs = [lambda: i for i in range(3)]
print([f() for f in funcs])  # [2, 2, 2]
```$ex$,
 $ip$Capture the current value explicitly, for example with a default argument such as `lambda i=i: i`.$ip$,
 10),
('python-advanced-python-11','python-advanced-python', -- source Q126
 $q$What is a descriptor?$q$,
 $a$A descriptor is an object implementing methods such as `__get__`, `__set__`, or `__delete__`, allowing it to control attribute access. Properties, methods, and many framework features rely on descriptor behavior.$a$,
 $ex$```python
class Positive:
    def __set_name__(self, owner, name): self.name = name
    def __get__(self, obj, owner=None): return obj.__dict__[self.name]
    def __set__(self, obj, value):
        if value <= 0: raise ValueError("must be positive")
        obj.__dict__[self.name] = value
```$ex$,
 $ip$Descriptors are an advanced mechanism; understand properties and class attribute lookup before using custom descriptors.$ip$,
 11),
('python-advanced-python-12','python-advanced-python', -- source Q127
 $q$What is an abstract base class?$q$,
 $a$An abstract base class uses the `abc` module to define methods that subclasses are expected to implement and can prevent incomplete classes from being instantiated.$a$,
 $ex$```python
from abc import ABC, abstractmethod
class Shape(ABC):
    @abstractmethod
    def area(self): pass
```$ex$,
 $ip$ABCs provide nominal contracts; Python's duck typing remains useful alongside them.$ip$,
 12),
('python-advanced-python-13','python-advanced-python', -- source Q128
 $q$What is multiple dispatch?$q$,
 $a$Python's ordinary method overloading does not select implementations by argument type in the same way as languages such as Java. Multiple-dispatch behavior can be implemented with tools such as `functools.singledispatch` for dispatch based on the first argument's type.$a$,
 $ex$```python
from functools import singledispatch

@singledispatch
def show(value): return "other"
@show.register

def _(value: int): return "integer"

print(show(10))
```$ex$,
 $ip$`singledispatch` is single-dispatch, not full multiple dispatch.$ip$,
 13),
('python-advanced-python-14','python-advanced-python', -- source Q129
 $q$What is unpacking in function calls?$q$,
 $a$`*` expands an iterable into positional arguments and `**` expands a mapping into keyword arguments.$a$,
 $ex$```python
def add(a, b): return a + b
values = [2, 3]
print(add(*values))
```$ex$,
 $ip$The expanded values must match the called function's parameter rules.$ip$,
 14),
('python-advanced-python-15','python-advanced-python', -- source Q130
 $q$What is an assertion?$q$,
 $a$An `assert` statement checks a condition and raises AssertionError when it is false. It is mainly for internal assumptions and debugging.$a$,
 $ex$```python
def average(total, count):
    assert count > 0
    return total / count
```$ex$,
 $ip$Assertions can be disabled with Python optimization options, so do not use them for essential input validation or security checks.$ip$,
 15)
on conflict (id) do update set
  topic_id = excluded.topic_id, question = excluded.question, answer = excluded.answer,
  example = excluded.example, important_point = excluded.important_point,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- Special Methods & Operator Overloading (10) --------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, sort_order)
values
('python-special-methods-operator-overloading-01','python-special-methods-operator-overloading', -- source Q122
 $q$What is `__eq__`?$q$,
 $a$`__eq__` defines how an object's equality comparison behaves when using `==`. Custom classes can implement it to compare meaningful state.$a$,
 $ex$```python
class User:
    def __init__(self, user_id): self.user_id = user_id
    def __eq__(self, other):
        return isinstance(other, User) and self.user_id == other.user_id
```$ex$,
 $ip$If equality semantics change, review hashing and collection behavior as well.$ip$,
 1),
('python-special-methods-operator-overloading-02','python-special-methods-operator-overloading', -- source Q123
 $q$What is `__str__` vs `__repr__`?$q$,
 $a$`__str__` is intended for a readable user-facing representation, while `__repr__` is intended to be an unambiguous developer-oriented representation.$a$,
 $ex$```python
class User:
    def __repr__(self): return "User(id=1)"
    def __str__(self): return "User 1"

u = User()
print(str(u))
print(repr(u))
```$ex$,
 $ip$If `__str__` is not defined, object formatting can fall back to `__repr__`.$ip$,
 2),
('python-special-methods-operator-overloading-03','python-special-methods-operator-overloading', -- source Q196
 $q$What is name mangling?$q$,
 $a$Names beginning with two underscores but not ending with two underscores are transformed internally using the class name, helping avoid accidental name collisions in subclasses.$a$,
 $ex$```python
class Account:
    def __init__(self):
        self.__pin = 1234
```$ex$,
 $ip$Name mangling is not a security feature and does not make data cryptographically private.$ip$,
 3),
('python-special-methods-operator-overloading-04','python-special-methods-operator-overloading', -- source Q228
 $q$What is method binding?$q$,
 $a$When a function is accessed as an instance attribute and is defined as a method on a class, Python creates a bound method that supplies the instance automatically.$a$,
 $ex$```python
class User:
    def greet(self): return "Hi"

u = User()
print(u.greet())
```$ex$,
 $ip$This explains why the instance is passed to `self` even though the call appears to provide no explicit first argument.$ip$,
 4),
('python-special-methods-operator-overloading-05','python-special-methods-operator-overloading', -- source Q229
 $q$What is super()?$q$,
 $a$`super()` provides a proxy for accessing parent or next-in-MRO behavior, making cooperative inheritance possible.$a$,
 $ex$```python
class A:
    def greet(self): return "A"
class B(A):
    def greet(self): return super().greet() + " B"
print(B().greet())
```$ex$,
 $ip$In multiple inheritance, super() follows the MRO rather than simply meaning 'my direct parent'.$ip$,
 5),
('python-special-methods-operator-overloading-06','python-special-methods-operator-overloading', -- source Q230
 $q$What is `__new__`?$q$,
 $a$`__new__` is a class-level construction hook responsible for creating and returning an instance before `__init__` initializes it.$a$,
 $ex$```python
class Demo:
    def __new__(cls):
        print("creating")
        return super().__new__(cls)
    def __init__(self): print("initializing")

Demo()
```$ex$,
 $ip$Use `__new__` for specialized construction such as immutable subclasses or controlled instance creation; most classes only need `__init__`.$ip$,
 6),
('python-special-methods-operator-overloading-07','python-special-methods-operator-overloading', -- source Q231
 $q$What is `__del__`?$q$,
 $a$`__del__` is a finalizer hook that may be called when an object is being finalized, but its execution timing and reliability are not suitable for critical resource cleanup.$a$,
 $ex$```python
class Demo:
    def __del__(self):
        print("finalizing")
```$ex$,
 $ip$Use context managers and explicit cleanup for resources instead of depending on `__del__`.$ip$,
 7),
('python-special-methods-operator-overloading-08','python-special-methods-operator-overloading', -- source Q232
 $q$What is singleton pattern in Python?$q$,
 $a$A singleton restricts a class to one shared instance. Python often avoids needing a singleton class by using a module-level object or dependency injection.$a$,
 $ex$```python
# module-level instance
config = {"mode": "prod"}
```$ex$,
 $ip$Global singleton state can create hidden dependencies and make tests harder, so use it only when the shared lifecycle is truly required.$ip$,
 8),
('python-special-methods-operator-overloading-09','python-special-methods-operator-overloading', -- source Q235
 $q$What is operator overloading?$q$,
 $a$Python lets classes customize operators through special methods such as `__add__`, `__eq__`, and `__lt__`.$a$,
 $ex$```python
class Money:
    def __init__(self, value): self.value = value
    def __add__(self, other): return Money(self.value + other.value)

print((Money(10) + Money(5)).value)
```$ex$,
 $ip$Implement operators with clear, consistent semantics and return NotImplemented when appropriate for unsupported types.$ip$,
 9),
('python-special-methods-operator-overloading-10','python-special-methods-operator-overloading', -- source Q236
 $q$What is rich comparison?$q$,
 $a$Special methods such as `__eq__`, `__lt__`, `__le__`, `__gt__`, `__ge__`, and `__ne__` define rich comparisons for custom objects.$a$,
 $ex$```python
class Score:
    def __init__(self, value): self.value = value
    def __lt__(self, other): return self.value < other.value
```$ex$,
 $ip$Use functools.total_ordering only when its trade-offs are acceptable; defining the needed comparisons explicitly can be clearer.$ip$,
 10)
on conflict (id) do update set
  topic_id = excluded.topic_id, question = excluded.question, answer = excluded.answer,
  example = excluded.example, important_point = excluded.important_point,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- Testing & Tooling (6) -----------------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, sort_order)
values
('python-testing-tooling-01','python-testing-tooling', -- source Q131
 $q$What is logging?$q$,
 $a$Python's `logging` module provides structured application logging with levels, handlers, formatters, and loggers.$a$,
 $ex$```python
import logging
logging.basicConfig(level=logging.INFO)
logging.info("Application started")
```$ex$,
 $ip$Prefer logging over print for production diagnostics because logging can be filtered, routed, and formatted centrally.$ip$,
 1),
('python-testing-tooling-02','python-testing-tooling', -- source Q132
 $q$What is unit testing in Python?$q$,
 $a$Unit testing verifies small pieces of code independently. Python's standard library includes `unittest`, and third-party frameworks such as pytest are also widely used.$a$,
 $ex$```python
import unittest

class TestMath(unittest.TestCase):
    def test_add(self):
        self.assertEqual(2 + 3, 5)
```$ex$,
 $ip$Good unit tests isolate behavior and include meaningful edge cases.$ip$,
 2),
('python-testing-tooling-03','python-testing-tooling', -- source Q133
 $q$What is pytest?$q$,
 $a$pytest is a popular third-party Python testing framework known for simple test functions, fixtures, parametrization, and rich assertion reporting.$a$,
 $ex$```python
def test_add():
    assert 2 + 3 == 5
```$ex$,
 $ip$pytest must be installed separately; follow the project's test dependencies and configuration.$ip$,
 3),
('python-testing-tooling-04','python-testing-tooling', -- source Q134
 $q$What is REST API consumption in Python?$q$,
 $a$Python applications can call HTTP APIs using libraries such as urllib from the standard library or third-party clients such as requests and httpx.$a$,
 $ex$```python
# Example shape; actual HTTP client depends on project dependencies.
import requests
response = requests.get("https://example.com", timeout=10)
response.raise_for_status()
```$ex$,
 $ip$Always use timeouts and handle status codes/errors deliberately when making network calls.$ip$,
 4),
('python-testing-tooling-05','python-testing-tooling', -- source Q135
 $q$What is SQL injection and how does Python prevent it?$q$,
 $a$SQL injection occurs when untrusted input is concatenated into SQL text. Python database APIs should use parameterized queries so values are bound separately from SQL syntax.$a$,
 $ex$```python
cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
```$ex$,
 $ip$Placeholder syntax differs by database driver; never build SQL with string concatenation from untrusted input.$ip$,
 5),
('python-testing-tooling-06','python-testing-tooling', -- source Q156
 $q$What is monkey patching vs mocking?$q$,
 $a$Monkey patching changes an existing object or attribute at runtime. Mocking creates controlled test doubles that simulate dependencies and record interactions.$a$,
 $ex$```python
from unittest.mock import Mock
service = Mock()
service.send.return_value = True
print(service.send("hello"))
```$ex$,
 $ip$Mocks should verify meaningful behavior, not tightly couple tests to implementation details.$ip$,
 6)
on conflict (id) do update set
  topic_id = excluded.topic_id, question = excluded.question, answer = excluded.answer,
  example = excluded.example, important_point = excluded.important_point,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- Serialization & Data Interchange (4) --------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, sort_order)
values
('python-serialization-01','python-serialization', -- source Q85
 $q$What is JSON handling in Python?$q$,
 $a$The `json` module converts between Python objects and JSON text/bytes representations using `dumps`, `loads`, `dump`, and `load`.$a$,
 $ex$```python
import json
text = json.dumps({"name": "Amit", "age": 25})
data = json.loads(text)
print(data["name"])
```$ex$,
 $ip$JSON supports a limited set of data types; arbitrary Python objects need custom serialization.$ip$,
 1),
('python-serialization-02','python-serialization', -- source Q136
 $q$What is serialization?$q$,
 $a$Serialization converts an in-memory object or data structure into a representation that can be stored or transmitted. JSON is common for interoperable data; pickle is Python-specific.$a$,
 $ex$```python
import json
text = json.dumps({"id": 1, "name": "Amit"})
print(text)
```$ex$,
 $ip$Never unpickle untrusted data; pickle can execute arbitrary code during deserialization.$ip$,
 2),
('python-serialization-03','python-serialization', -- source Q137
 $q$What is pickle?$q$,
 $a$`pickle` serializes and deserializes many Python object structures into a Python-specific binary representation.$a$,
 $ex$```python
import pickle
obj = {"a": 1}
data = pickle.dumps(obj)
copy = pickle.loads(data)
print(copy)
```$ex$,
 $ip$Never load pickle data from an untrusted source because deserialization can execute arbitrary code.$ip$,
 3),
('python-serialization-04','python-serialization', -- source Q138
 $q$What is JSON vs pickle?$q$,
 $a$JSON is text-based, interoperable, and limited to JSON-compatible data. Pickle can represent many Python-specific objects but is Python-specific and unsafe for untrusted input.$a$,
 $ex$```python
import json
payload = json.dumps({"name": "Amit"})
print(payload)
```$ex$,
 $ip$For APIs and cross-language systems, JSON is usually the appropriate interchange format.$ip$,
 4)
on conflict (id) do update set
  topic_id = excluded.topic_id, question = excluded.question, answer = excluded.answer,
  example = excluded.example, important_point = excluded.important_point,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- Python Runtime Internals (3) ----------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, sort_order)
values
('python-runtime-internals-01','python-runtime-internals', -- source Q139
 $q$What is a Python virtual machine?$q$,
 $a$The Python virtual machine is the runtime component that executes Python bytecode in implementations such as CPython.$a$,
 $ex$```text
source -> bytecode -> runtime execution
```$ex$,
 $ip$The term does not mean Python runs inside the Java JVM; Python has its own runtime implementations.$ip$,
 1),
('python-runtime-internals-02','python-runtime-internals', -- source Q140
 $q$What is bytecode in Python?$q$,
 $a$Python bytecode is an intermediate instruction representation generated from source code and consumed by the Python runtime. CPython may cache compiled bytecode in `__pycache__`.$a$,
 $ex$```text
module.py -> compiled bytecode -> runtime
```$ex$,
 $ip$Bytecode format is implementation/version dependent and should not be treated as a stable cross-version format.$ip$,
 2),
('python-runtime-internals-03','python-runtime-internals', -- source Q141
 $q$What is `__pycache__`?$q$,
 $a$`__pycache__` commonly stores cached bytecode files for imported modules in CPython, helping avoid recompiling unchanged source every time.$a$,
 $ex$```text
project/
  module.py
  __pycache__/
```$ex$,
 $ip$It is generated runtime/build metadata and normally should not be committed to source control.$ip$,
 3)
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
  select count(*) into v_count from public.interview_topics where id = any(array['python-advanced-python', 'python-special-methods-operator-overloading', 'python-testing-tooling', 'python-serialization', 'python-runtime-internals']);
  if v_count <> 5 then
    raise exception 'validation: expected 5 topics for this batch, found %', v_count;
  end if;
  select count(*) into v_count from public.interview_questions where topic_id = any(array['python-advanced-python', 'python-special-methods-operator-overloading', 'python-testing-tooling', 'python-serialization', 'python-runtime-internals']);
  if v_count <> 38 then
    raise exception 'validation: expected 38 questions for this batch, found %', v_count;
  end if;
  raise notice '0111_seed_interview_python_batch3 OK: % topics, % questions.', 5, 38;
end $$;

notify pgrst, 'reload schema';
