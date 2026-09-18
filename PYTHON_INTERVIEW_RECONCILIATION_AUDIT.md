# Python Interview Questions — Source Reconciliation Audit

Applied by migration batches `081`–`084` (admin) / `0109`–`0112` (mobile). This file is the
permanent record of the source reconciliation for the Python Interview Questions bank, done
**before** any migration was written (unlike Java, which was seeded first and reconciled
afterward — see `JAVA_INTERVIEW_RECONCILIATION_AUDIT.md`).

**Source file:** `Python_Interview_Master_Guide_240_Plus_Questions(1).md`

## 1–6. Source reconciliation summary

| Metric | Count |
|---|---|
| Raw numbered entries (`### 1.` .. `### 240.`) | 240 |
| Unique source questions (by normalized title) | 240 |
| Exact-duplicate questions | 0 |
| Rewritten/near-duplicate questions | 0 |
| Merged questions requiring split | 0 |
| Questions missing a required section (Ans/Example/Important Point) | 0 |
| **Final unique source count published** | **240** |

Unlike the Java source guide (240 raw entries, only 121 unique — entries 122-240 were
mechanical "interview variation 2-5" restatements of Q92-Q121), this Python guide has **no**
raw/unique gap: every one of the 240 numbered entries is a distinct question, in strictly
increasing order (`1..240`, no gaps, no repeats), and every entry has all three required
sections (`**Ans:**`, `**Example:**`, `**Important Point:**`).

A second content-level pass (normalized-title clustering, ignoring "what is/are/how do you"
prefixes) found exactly one coincidental collision — Q144 (`__all__`, the module export list)
vs Q204 (`all()`, the built-in function) — which are genuinely different questions, not
duplicates.

## Content normalization applied (verbatim preservation, not rewriting)

Two mechanical artifacts in the source markdown were undone; no question was reworded and no
content was invented:

1. **Hard-wrapped prose.** The source hard-wraps every paragraph at ~70 characters (a pandoc
   export artifact). Each Ans/Example/Important Point paragraph was re-flowed to a single
   logical line/paragraph; paragraph breaks (blank lines) were preserved as-is.
2. **Mangled dunder names in headings.** The source's own export renders `__name__`-style
   double-underscore identifiers as **bold** in question titles (and a few body sentences)
   because `__x__` collides with Markdown's `**bold**` syntax — e.g. the heading literally
   reads `### 64. What is **init**?`. This was detected by scanning for `**word**` patterns
   matching known dunder names (`init`, `main`, `name`, `exit`, `slots`, `eq`, `repr`, `str`,
   `pycache`, `all`, `new`, `del`, `add`, `lt`, `le`, `gt`, `ge`, `ne`) and was corrected to
   `` `__word__` `` (backtick code) — the exact form the *same question's own answer text*
   already uses correctly (e.g. Q64's Ans already reads `` `__init__` is an initializer
   method... `` in the source). Every fix was verified against that entry's own body before
   being applied, so no name was guessed.
3. Two pandoc backslash-escaping artifacts were undone: `\*args` → `*args`, `\[\]` → `[]`
   (again verified against the correct unescaped form already used elsewhere in the same
   entry's own body text).

No other text was changed. Code examples were copied byte-for-byte from their fenced blocks
(only the fence language tag was tightened, e.g. `` ``` python `` → `` ```python ``).

## Out of scope: the "Python Coding Problems" section (42 problems)

The source file's second half (`# Python Coding Problems`, 42 numbered problems: reverse a
string, two sum, binary search, ...) was **not** migrated into Interview Questions. Its shape
is `Solution` + `Complexity`, not `Question/Ans/Example/Important Point` — it does not fit the
`interview_questions` schema without inventing structure the source doesn't provide, and it
conceptually belongs to the existing, separate **Practice → Coding Problems** system
(`dsa_topics`/`dsa_problems`, migration 0072/044), not Interview Questions. No action was taken
on it; flagging for the owner in case a future coding-problems import is wanted.

## Existing DB reconciliation

The only category ever seeded into `interview_categories` before this engagement is `java`
(migration `076`/`0104`). No `python` category, topic, or question existed in any prior
migration. Reconciliation result: **0 existing Python rows, 0 exact matches, 0 missing, 0
generated/non-source rows, 0 archived** — there was nothing to reconcile against; this is a
first-time seed done directly against the 240-question source, so no batch-then-fix pass (like
Java's `080`/`0108`) was necessary.

## 7. Topic design — all 22 topics, Q# ranges and counts

Topics were derived from the actual content of the 240 questions (not the illustrative list in
the brief, which was explicitly a "prefer, but don't blindly use" starting point). No
Scenario-Based topic was created — the source has no scenario questions. Because several
recurring themes appear in more than one place in the source's linear order (e.g. OOP dunder
methods resurface at Q228-236, iteration builtins resurface at Q205-211), several topics pull
from non-contiguous Q-ranges; every one of those cases is listed explicitly below so the
mapping is auditable.

| # | Topic | Slug | Source Q# (topic order) | Count |
|---|---|---|---|---|
| 1 | Python Basics | `basics` | 1-5 | 5 |
| 2 | Data Types & Variables | `data-types-variables` | 6-15 | 10 |
| 3 | Lists, Tuples, Sets & Dictionaries | `collections` | 16-30 | 15 |
| 4 | Functions | `functions` | 31-45 | 15 |
| 5 | Strings | `strings` | 46-53 | 8 |
| 6 | Exception Handling | `exception-handling` | 54-61 | 8 |
| 7 | OOP | `oop` | 62-75 | 14 |
| 8 | File Handling | `file-handling` | 76-78 | 3 |
| 9 | Modules & Packages | `modules-packages` | 79-84, 142-144 | 9 |
| 10 | Iterators, Generators & Functional Tools | `iterators-generators-functional` | 86-95, 205, 206, 210, 211 | 14 |
| 11 | Multithreading & Concurrency | `concurrency` | 96-104 | 9 |
| 12 | Memory Management | `memory-management` | 105-113, 197-199, 214, 233 | 14 |
| 13 | Advanced Python | `advanced-python` | 114-121, 124-130 | 15 |
| 14 | Special Methods & Operator Overloading | `special-methods-operator-overloading` | 122, 123, 196, 228-232, 235, 236 | 10 |
| 15 | Testing & Tooling | `testing-tooling` | 131-135, 156 | 6 |
| 16 | Serialization & Data Interchange | `serialization` | 85, 136-138 | 4 |
| 17 | Python Runtime Internals | `runtime-internals` | 139-141 | 3 |
| 18 | Environment, CLI & Packaging | `environment-packaging-cli` | 145-155, 157, 215-219 | 17 |
| 19 | Algorithms & Data Structures | `algorithms-data-structures` | 158-184, 200, 213 | 29 |
| 20 | Typing & Modern Python Syntax | `typing-modern-syntax` | 185-195, 237 | 12 |
| 21 | Builtins, Control Flow & Scope | `builtins-control-flow-scope` | 201-204, 207-209, 212, 220-224, 234 | 14 |
| 22 | Type Checking & Abstract Classes | `type-checking-abstract-classes` | 225-227, 238-240 | 6 |
| | **Total** | | | **240** |

(Q85 — "JSON handling in Python" — was moved out of its numeric position into Serialization,
next to `pickle` / `JSON vs pickle`, since it's the same topic; Q142-144 similarly moved into
Modules & Packages, next to `module`/`package`/`import`.)

## 8. Complete Q1–Q240 → topic → DB ID mapping

Every `id` is deterministic: `python-<topic-slug>-<NN>`, where `NN` is the 1-based position
within the topic in source-Q-order.

| Q# | Source Question | Topic | DB ID |
|---|---|---|---|
| 1 | What is Python? | Python Basics | `python-basics-01` |
| 2 | Why is Python popular? | Python Basics | `python-basics-02` |
| 3 | What are Python's main features? | Python Basics | `python-basics-03` |
| 4 | Is Python interpreted or compiled? | Python Basics | `python-basics-04` |
| 5 | What is CPython? | Python Basics | `python-basics-05` |
| 6 | What is a variable in Python? | Data Types & Variables | `python-data-types-variables-01` |
| 7 | What are Python data types? | Data Types & Variables | `python-data-types-variables-02` |
| 8 | What is dynamic typing? | Data Types & Variables | `python-data-types-variables-03` |
| 9 | What is strong typing in Python? | Data Types & Variables | `python-data-types-variables-04` |
| 10 | What is indentation in Python? | Data Types & Variables | `python-data-types-variables-05` |
| 11 | What is PEP 8? | Data Types & Variables | `python-data-types-variables-06` |
| 12 | What is None? | Data Types & Variables | `python-data-types-variables-07` |
| 13 | What is mutable vs immutable? | Data Types & Variables | `python-data-types-variables-08` |
| 14 | What is type conversion? | Data Types & Variables | `python-data-types-variables-09` |
| 15 | What is the difference between == and is? | Data Types & Variables | `python-data-types-variables-10` |
| 16 | What is a list? | Lists, Tuples, Sets & Dictionaries | `python-collections-01` |
| 17 | What is a tuple? | Lists, Tuples, Sets & Dictionaries | `python-collections-02` |
| 18 | List vs tuple? | Lists, Tuples, Sets & Dictionaries | `python-collections-03` |
| 19 | What is a set? | Lists, Tuples, Sets & Dictionaries | `python-collections-04` |
| 20 | What is a frozenset? | Lists, Tuples, Sets & Dictionaries | `python-collections-05` |
| 21 | What is a dictionary? | Lists, Tuples, Sets & Dictionaries | `python-collections-06` |
| 22 | Can dictionary keys be lists? | Lists, Tuples, Sets & Dictionaries | `python-collections-07` |
| 23 | What is dictionary comprehension? | Lists, Tuples, Sets & Dictionaries | `python-collections-08` |
| 24 | What is list comprehension? | Lists, Tuples, Sets & Dictionaries | `python-collections-09` |
| 25 | What is slicing? | Lists, Tuples, Sets & Dictionaries | `python-collections-10` |
| 26 | What is unpacking? | Lists, Tuples, Sets & Dictionaries | `python-collections-11` |
| 27 | What is starred unpacking? | Lists, Tuples, Sets & Dictionaries | `python-collections-12` |
| 28 | append() vs extend()? | Lists, Tuples, Sets & Dictionaries | `python-collections-13` |
| 29 | remove() vs pop() vs del? | Lists, Tuples, Sets & Dictionaries | `python-collections-14` |
| 30 | sort() vs sorted()? | Lists, Tuples, Sets & Dictionaries | `python-collections-15` |
| 31 | What is a function? | Functions | `python-functions-01` |
| 32 | What are positional arguments? | Functions | `python-functions-02` |
| 33 | What are keyword arguments? | Functions | `python-functions-03` |
| 34 | What are default arguments? | Functions | `python-functions-04` |
| 35 | Why are mutable default arguments dangerous? | Functions | `python-functions-05` |
| 36 | What is *args? | Functions | `python-functions-06` |
| 37 | What is **kwargs? | Functions | `python-functions-07` |
| 38 | What is lambda? | Functions | `python-functions-08` |
| 39 | What is a higher-order function? | Functions | `python-functions-09` |
| 40 | What is a decorator? | Functions | `python-functions-10` |
| 41 | What is recursion? | Functions | `python-functions-11` |
| 42 | What is LEGB? | Functions | `python-functions-12` |
| 43 | What is global keyword? | Functions | `python-functions-13` |
| 44 | What is nonlocal? | Functions | `python-functions-14` |
| 45 | What is a docstring? | Functions | `python-functions-15` |
| 46 | What is a string? | Strings | `python-strings-01` |
| 47 | Why are strings immutable? | Strings | `python-strings-02` |
| 48 | What is f-string? | Strings | `python-strings-03` |
| 49 | format() vs f-string? | Strings | `python-strings-04` |
| 50 | What is split()? | Strings | `python-strings-05` |
| 51 | What is join()? | Strings | `python-strings-06` |
| 52 | replace() vs strip()? | Strings | `python-strings-07` |
| 53 | What is Unicode in Python strings? | Strings | `python-strings-08` |
| 54 | What is exception handling? | Exception Handling | `python-exception-handling-01` |
| 55 | What is try-except? | Exception Handling | `python-exception-handling-02` |
| 56 | What is finally? | Exception Handling | `python-exception-handling-03` |
| 57 | What is else in exception handling? | Exception Handling | `python-exception-handling-04` |
| 58 | How do you raise an exception? | Exception Handling | `python-exception-handling-05` |
| 59 | How do you create a custom exception? | Exception Handling | `python-exception-handling-06` |
| 60 | What is exception chaining? | Exception Handling | `python-exception-handling-07` |
| 61 | Why avoid bare except? | Exception Handling | `python-exception-handling-08` |
| 62 | What is a class in Python? | OOP | `python-oop-01` |
| 63 | What is an object? | OOP | `python-oop-02` |
| 64 | What is `__init__`? | OOP | `python-oop-03` |
| 65 | What is self? | OOP | `python-oop-04` |
| 66 | What is class variable? | OOP | `python-oop-05` |
| 67 | What is instance variable? | OOP | `python-oop-06` |
| 68 | What is inheritance? | OOP | `python-oop-07` |
| 69 | What is multiple inheritance? | OOP | `python-oop-08` |
| 70 | What is MRO? | OOP | `python-oop-09` |
| 71 | What is polymorphism? | OOP | `python-oop-10` |
| 72 | What is encapsulation in Python? | OOP | `python-oop-11` |
| 73 | What is abstraction? | OOP | `python-oop-12` |
| 74 | What is @property? | OOP | `python-oop-13` |
| 75 | staticmethod vs classmethod? | OOP | `python-oop-14` |
| 76 | How do you open a file? | File Handling | `python-file-handling-01` |
| 77 | What are common file modes? | File Handling | `python-file-handling-02` |
| 78 | Why use with for files? | File Handling | `python-file-handling-03` |
| 79 | What is a module? | Modules & Packages | `python-modules-packages-01` |
| 80 | What is a package? | Modules & Packages | `python-modules-packages-02` |
| 81 | What is `__name__` == '`__main__`'? | Modules & Packages | `python-modules-packages-03` |
| 82 | What is pip? | Modules & Packages | `python-modules-packages-04` |
| 83 | What is a virtual environment? | Modules & Packages | `python-modules-packages-05` |
| 84 | What is requirements.txt? | Modules & Packages | `python-modules-packages-06` |
| 142 | What is import? | Modules & Packages | `python-modules-packages-07` |
| 143 | What is circular import? | Modules & Packages | `python-modules-packages-08` |
| 144 | What is `__all__`? | Modules & Packages | `python-modules-packages-09` |
| 86 | What is an iterable? | Iterators, Generators & Functional Tools | `python-iterators-generators-functional-01` |
| 87 | What is an iterator? | Iterators, Generators & Functional Tools | `python-iterators-generators-functional-02` |
| 88 | What is a generator? | Iterators, Generators & Functional Tools | `python-iterators-generators-functional-03` |
| 89 | yield vs return? | Iterators, Generators & Functional Tools | `python-iterators-generators-functional-04` |
| 90 | Generator expression vs list comprehension? | Iterators, Generators & Functional Tools | `python-iterators-generators-functional-05` |
| 91 | What is enumerate()? | Iterators, Generators & Functional Tools | `python-iterators-generators-functional-06` |
| 92 | What is zip()? | Iterators, Generators & Functional Tools | `python-iterators-generators-functional-07` |
| 93 | What is map()? | Iterators, Generators & Functional Tools | `python-iterators-generators-functional-08` |
| 94 | What is filter()? | Iterators, Generators & Functional Tools | `python-iterators-generators-functional-09` |
| 95 | What is reduce()? | Iterators, Generators & Functional Tools | `python-iterators-generators-functional-10` |
| 205 | What is range()? | Iterators, Generators & Functional Tools | `python-iterators-generators-functional-11` |
| 206 | Why use enumerate instead of range(len())? | Iterators, Generators & Functional Tools | `python-iterators-generators-functional-12` |
| 210 | What is enumerate start parameter? | Iterators, Generators & Functional Tools | `python-iterators-generators-functional-13` |
| 211 | What is zip strict mode? | Iterators, Generators & Functional Tools | `python-iterators-generators-functional-14` |
| 96 | What is threading in Python? | Multithreading & Concurrency | `python-concurrency-01` |
| 97 | What is the GIL? | Multithreading & Concurrency | `python-concurrency-02` |
| 98 | Threading vs multiprocessing? | Multithreading & Concurrency | `python-concurrency-03` |
| 99 | What is concurrent.futures? | Multithreading & Concurrency | `python-concurrency-04` |
| 100 | What is asyncio? | Multithreading & Concurrency | `python-concurrency-05` |
| 101 | What is a race condition? | Multithreading & Concurrency | `python-concurrency-06` |
| 102 | What is Lock? | Multithreading & Concurrency | `python-concurrency-07` |
| 103 | What is a daemon thread? | Multithreading & Concurrency | `python-concurrency-08` |
| 104 | What is a process pool? | Multithreading & Concurrency | `python-concurrency-09` |
| 105 | How does Python manage memory? | Memory Management | `python-memory-management-01` |
| 106 | What is reference counting? | Memory Management | `python-memory-management-02` |
| 107 | What is garbage collection? | Memory Management | `python-memory-management-03` |
| 108 | What is shallow copy? | Memory Management | `python-memory-management-04` |
| 109 | What is deep copy? | Memory Management | `python-memory-management-05` |
| 110 | What is id()? | Memory Management | `python-memory-management-06` |
| 111 | What is garbage collection vs resource cleanup? | Memory Management | `python-memory-management-07` |
| 112 | What is a context manager? | Memory Management | `python-memory-management-08` |
| 113 | What is dataclass? | Memory Management | `python-memory-management-09` |
| 197 | What is object identity? | Memory Management | `python-memory-management-10` |
| 198 | What is garbage collector generation? | Memory Management | `python-memory-management-11` |
| 199 | What is weakref? | Memory Management | `python-memory-management-12` |
| 214 | What is contextlib? | Memory Management | `python-memory-management-13` |
| 233 | What is copy.copy vs assignment? | Memory Management | `python-memory-management-14` |
| 114 | What are type hints? | Advanced Python | `python-advanced-python-01` |
| 115 | What is duck typing? | Advanced Python | `python-advanced-python-02` |
| 116 | What is EAFP? | Advanced Python | `python-advanced-python-03` |
| 117 | What is LBYL? | Advanced Python | `python-advanced-python-04` |
| 118 | What is monkey patching? | Advanced Python | `python-advanced-python-05` |
| 119 | What is introspection? | Advanced Python | `python-advanced-python-06` |
| 120 | What is `__slots__`? | Advanced Python | `python-advanced-python-07` |
| 121 | What is hashability? | Advanced Python | `python-advanced-python-08` |
| 124 | What is a closure? | Advanced Python | `python-advanced-python-09` |
| 125 | What is late binding in closures? | Advanced Python | `python-advanced-python-10` |
| 126 | What is a descriptor? | Advanced Python | `python-advanced-python-11` |
| 127 | What is an abstract base class? | Advanced Python | `python-advanced-python-12` |
| 128 | What is multiple dispatch? | Advanced Python | `python-advanced-python-13` |
| 129 | What is unpacking in function calls? | Advanced Python | `python-advanced-python-14` |
| 130 | What is an assertion? | Advanced Python | `python-advanced-python-15` |
| 122 | What is `__eq__`? | Special Methods & Operator Overloading | `python-special-methods-operator-overloading-01` |
| 123 | What is `__str__` vs `__repr__`? | Special Methods & Operator Overloading | `python-special-methods-operator-overloading-02` |
| 196 | What is name mangling? | Special Methods & Operator Overloading | `python-special-methods-operator-overloading-03` |
| 228 | What is method binding? | Special Methods & Operator Overloading | `python-special-methods-operator-overloading-04` |
| 229 | What is super()? | Special Methods & Operator Overloading | `python-special-methods-operator-overloading-05` |
| 230 | What is `__new__`? | Special Methods & Operator Overloading | `python-special-methods-operator-overloading-06` |
| 231 | What is `__del__`? | Special Methods & Operator Overloading | `python-special-methods-operator-overloading-07` |
| 232 | What is singleton pattern in Python? | Special Methods & Operator Overloading | `python-special-methods-operator-overloading-08` |
| 235 | What is operator overloading? | Special Methods & Operator Overloading | `python-special-methods-operator-overloading-09` |
| 236 | What is rich comparison? | Special Methods & Operator Overloading | `python-special-methods-operator-overloading-10` |
| 131 | What is logging? | Testing & Tooling | `python-testing-tooling-01` |
| 132 | What is unit testing in Python? | Testing & Tooling | `python-testing-tooling-02` |
| 133 | What is pytest? | Testing & Tooling | `python-testing-tooling-03` |
| 134 | What is REST API consumption in Python? | Testing & Tooling | `python-testing-tooling-04` |
| 135 | What is SQL injection and how does Python prevent it? | Testing & Tooling | `python-testing-tooling-05` |
| 156 | What is monkey patching vs mocking? | Testing & Tooling | `python-testing-tooling-06` |
| 85 | What is JSON handling in Python? | Serialization & Data Interchange | `python-serialization-01` |
| 136 | What is serialization? | Serialization & Data Interchange | `python-serialization-02` |
| 137 | What is pickle? | Serialization & Data Interchange | `python-serialization-03` |
| 138 | What is JSON vs pickle? | Serialization & Data Interchange | `python-serialization-04` |
| 139 | What is a Python virtual machine? | Python Runtime Internals | `python-runtime-internals-01` |
| 140 | What is bytecode in Python? | Python Runtime Internals | `python-runtime-internals-02` |
| 141 | What is `__pycache__`? | Python Runtime Internals | `python-runtime-internals-03` |
| 145 | What is environment variable usage in Python? | Environment, CLI & Packaging | `python-environment-packaging-cli-01` |
| 146 | What is pathlib? | Environment, CLI & Packaging | `python-environment-packaging-cli-02` |
| 147 | What is argparse? | Environment, CLI & Packaging | `python-environment-packaging-cli-03` |
| 148 | What is virtualenv vs venv? | Environment, CLI & Packaging | `python-environment-packaging-cli-04` |
| 149 | What is dependency management? | Environment, CLI & Packaging | `python-environment-packaging-cli-05` |
| 150 | What is pyproject.toml? | Environment, CLI & Packaging | `python-environment-packaging-cli-06` |
| 151 | What is packaging in Python? | Environment, CLI & Packaging | `python-environment-packaging-cli-07` |
| 152 | What is a wheel? | Environment, CLI & Packaging | `python-environment-packaging-cli-08` |
| 153 | What is source distribution? | Environment, CLI & Packaging | `python-environment-packaging-cli-09` |
| 154 | What is virtual environment activation? | Environment, CLI & Packaging | `python-environment-packaging-cli-10` |
| 155 | What is dependency conflict? | Environment, CLI & Packaging | `python-environment-packaging-cli-11` |
| 157 | What is dependency injection in Python? | Environment, CLI & Packaging | `python-environment-packaging-cli-12` |
| 215 | What is pathlib Path.exists()? | Environment, CLI & Packaging | `python-environment-packaging-cli-13` |
| 216 | What is os.environ? | Environment, CLI & Packaging | `python-environment-packaging-cli-14` |
| 217 | What is subprocess? | Environment, CLI & Packaging | `python-environment-packaging-cli-15` |
| 218 | What is sys.argv? | Environment, CLI & Packaging | `python-environment-packaging-cli-16` |
| 219 | What is sys.path? | Environment, CLI & Packaging | `python-environment-packaging-cli-17` |
| 158 | What is time complexity? | Algorithms & Data Structures | `python-algorithms-data-structures-01` |
| 159 | What is space complexity? | Algorithms & Data Structures | `python-algorithms-data-structures-02` |
| 160 | How do you find duplicates in a list? | Algorithms & Data Structures | `python-algorithms-data-structures-03` |
| 161 | How do you count word frequency? | Algorithms & Data Structures | `python-algorithms-data-structures-04` |
| 162 | What is Counter? | Algorithms & Data Structures | `python-algorithms-data-structures-05` |
| 163 | What is defaultdict? | Algorithms & Data Structures | `python-algorithms-data-structures-06` |
| 164 | What is deque? | Algorithms & Data Structures | `python-algorithms-data-structures-07` |
| 165 | How do you implement a stack in Python? | Algorithms & Data Structures | `python-algorithms-data-structures-08` |
| 166 | How do you implement a queue? | Algorithms & Data Structures | `python-algorithms-data-structures-09` |
| 167 | How do you reverse a list? | Algorithms & Data Structures | `python-algorithms-data-structures-10` |
| 168 | How do you check palindrome? | Algorithms & Data Structures | `python-algorithms-data-structures-11` |
| 169 | How do you find the largest element? | Algorithms & Data Structures | `python-algorithms-data-structures-12` |
| 170 | How do you sort a list of dictionaries? | Algorithms & Data Structures | `python-algorithms-data-structures-13` |
| 171 | What is stable sorting? | Algorithms & Data Structures | `python-algorithms-data-structures-14` |
| 172 | What is Timsort? | Algorithms & Data Structures | `python-algorithms-data-structures-15` |
| 173 | What is bisect? | Algorithms & Data Structures | `python-algorithms-data-structures-16` |
| 174 | What is heapq? | Algorithms & Data Structures | `python-algorithms-data-structures-17` |
| 175 | What is itertools? | Algorithms & Data Structures | `python-algorithms-data-structures-18` |
| 176 | What is functools? | Algorithms & Data Structures | `python-algorithms-data-structures-19` |
| 177 | What is lru_cache? | Algorithms & Data Structures | `python-algorithms-data-structures-20` |
| 178 | What is caching? | Algorithms & Data Structures | `python-algorithms-data-structures-21` |
| 179 | Why is list indexing O(1)? | Algorithms & Data Structures | `python-algorithms-data-structures-22` |
| 180 | Why is dictionary lookup usually O(1)? | Algorithms & Data Structures | `python-algorithms-data-structures-23` |
| 181 | Why must dictionary keys be hashable? | Algorithms & Data Structures | `python-algorithms-data-structures-24` |
| 182 | What happens when a key is assigned twice? | Algorithms & Data Structures | `python-algorithms-data-structures-25` |
| 183 | What is insertion order in dictionaries? | Algorithms & Data Structures | `python-algorithms-data-structures-26` |
| 184 | Why are sets unordered? | Algorithms & Data Structures | `python-algorithms-data-structures-27` |
| 200 | What is memoization? | Algorithms & Data Structures | `python-algorithms-data-structures-28` |
| 213 | What is functools.partial? | Algorithms & Data Structures | `python-algorithms-data-structures-29` |
| 185 | What is a namedtuple? | Typing & Modern Python Syntax | `python-typing-modern-syntax-01` |
| 186 | What is typing.Protocol? | Typing & Modern Python Syntax | `python-typing-modern-syntax-02` |
| 187 | What is Optional in typing? | Typing & Modern Python Syntax | `python-typing-modern-syntax-03` |
| 188 | What is Union type? | Typing & Modern Python Syntax | `python-typing-modern-syntax-04` |
| 189 | What is match-case? | Typing & Modern Python Syntax | `python-typing-modern-syntax-05` |
| 190 | What is walrus operator? | Typing & Modern Python Syntax | `python-typing-modern-syntax-06` |
| 191 | What is positional-only parameter? | Typing & Modern Python Syntax | `python-typing-modern-syntax-07` |
| 192 | What is keyword-only parameter? | Typing & Modern Python Syntax | `python-typing-modern-syntax-08` |
| 193 | What is function annotation? | Typing & Modern Python Syntax | `python-typing-modern-syntax-09` |
| 194 | What is inspect module? | Typing & Modern Python Syntax | `python-typing-modern-syntax-10` |
| 195 | What is property setter? | Typing & Modern Python Syntax | `python-typing-modern-syntax-11` |
| 237 | What is Protocol vs ABC? | Typing & Modern Python Syntax | `python-typing-modern-syntax-12` |
| 201 | What is a sentinel object? | Builtins, Control Flow & Scope | `python-builtins-control-flow-scope-01` |
| 202 | What is truthiness? | Builtins, Control Flow & Scope | `python-builtins-control-flow-scope-02` |
| 203 | What is any()? | Builtins, Control Flow & Scope | `python-builtins-control-flow-scope-03` |
| 204 | What is all()? | Builtins, Control Flow & Scope | `python-builtins-control-flow-scope-04` |
| 207 | What is pass? | Builtins, Control Flow & Scope | `python-builtins-control-flow-scope-05` |
| 208 | pass vs continue vs break? | Builtins, Control Flow & Scope | `python-builtins-control-flow-scope-06` |
| 209 | What is else on a loop? | Builtins, Control Flow & Scope | `python-builtins-control-flow-scope-07` |
| 212 | What is sorted key function? | Builtins, Control Flow & Scope | `python-builtins-control-flow-scope-08` |
| 220 | What is a namespace? | Builtins, Control Flow & Scope | `python-builtins-control-flow-scope-09` |
| 221 | What is scope? | Builtins, Control Flow & Scope | `python-builtins-control-flow-scope-10` |
| 222 | What is a closure cell? | Builtins, Control Flow & Scope | `python-builtins-control-flow-scope-11` |
| 223 | What is function first-class object? | Builtins, Control Flow & Scope | `python-builtins-control-flow-scope-12` |
| 224 | What is callable()? | Builtins, Control Flow & Scope | `python-builtins-control-flow-scope-13` |
| 234 | What is the difference between None, False, and 0? | Builtins, Control Flow & Scope | `python-builtins-control-flow-scope-14` |
| 225 | What is isinstance()? | Type Checking & Abstract Classes | `python-type-checking-abstract-classes-01` |
| 226 | What is issubclass()? | Type Checking & Abstract Classes | `python-type-checking-abstract-classes-02` |
| 227 | What is ABC virtual subclass? | Type Checking & Abstract Classes | `python-type-checking-abstract-classes-03` |
| 238 | What is a namespace package? | Type Checking & Abstract Classes | `python-type-checking-abstract-classes-04` |
| 239 | What is importlib? | Type Checking & Abstract Classes | `python-type-checking-abstract-classes-05` |
| 240 | What is lazy import? | Type Checking & Abstract Classes | `python-type-checking-abstract-classes-06` |

## 9–10. Coverage confirmation

- Mapping table rows: **240** (one per source question)
- Every Q1–Q240 appears **exactly once** across the 22 topics above: confirmed programmatically
  (`sorted(assigned_Q#s) == list(range(1, 241))` → `True`).
- Missing source questions: **0** (none)
- Extra/invented question numbers: **0** (none)
- Duplicate question-number assignments: **0**

## 11. Migration files created

| Admin (`admin-panel/supabase/migrations/`) | Mobile twin (`mobile-app/supabase/migrations/`) | Batch content |
|---|---|---|
| `081_seed_interview_python_batch1.sql` | `0109_seed_interview_python_batch1.sql` | Python category + topics 1-6 (Python Basics .. Exception Handling), Q1-Q61 (61 questions) |
| `082_seed_interview_python_batch2.sql` | `0110_seed_interview_python_batch2.sql` | Topics 7-12 (OOP .. Memory Management), 63 questions |
| `083_seed_interview_python_batch3.sql` | `0111_seed_interview_python_batch3.sql` | Topics 13-17 (Advanced Python .. Runtime Internals), 38 questions |
| `084_seed_interview_python_batch4.sql` | `0112_seed_interview_python_batch4.sql` | Topics 18-22 (Environment/CLI/Packaging .. Type Checking), 78 questions |
| **Total** | | **240 questions, 22 topics, 1 category** |

Each admin/mobile pair is byte-identical below its header (verified via `diff`). No
schema/RLS/RPC change — all 4 files insert only into the existing `interview_categories` /
`interview_topics` / `interview_questions` tables created by `075`/`0103`, using
`on conflict (id) do update` for idempotency, deterministic ids, and gap-10 topic
`sort_order` (10, 20, 30, ...) so later batches never renumber earlier ones. Each file also
contains its own in-migration `VALIDATION` block that raises if its topic/question counts
don't match expectations.

## 12. Fresh PostgreSQL 17 verification

A brand-new PG17 cluster was initialized from scratch (`initdb`), with only the minimal
bootstrap objects the migrations require (`pgcrypto` extension, `anon`/`authenticated` roles,
`public.set_updated_at()` trigger function — the same objects `0001_profiles.sql`/`001_admin_core.sql`
define upstream in the real chain). Then:

1. Applied `075_interview_questions.sql` (schema/RLS/RPCs) — clean, 4 RPCs created, `NOTICE: 0103 OK`.
2. Applied `081` → `082` → `083` → `084` in order — clean. Each file's own validation block
   raised its expected topic/question counts: `61+63+38+78 = 240`.
3. Ran full reconciliation queries against the resulting database (see below).

**Result:**

| Check | Result |
|---|---|
| Published Python questions | **240** |
| Archived Python questions | **0** |
| Total Python questions | **240** |
| Duplicate published question text | **0** |
| Python topics | **22**, all `published` |
| Topics with 0 published questions | **0** |
| Topic counts cross-foot to 240 | **Yes** (verified per-topic, matches table in §7) |
| Java rows (schema-isolated by `category_id`) | **Untouched** — 0 change |
| Exact source-question-set equality (240 source titles vs 240 DB titles, sorted) | **True** — 0 missing, 0 extra |

## 13. Idempotency verification

Re-applied `081` → `082` → `083` → `084` a second time against the same database (simulating a
re-run of the migration chain). Every file's `on conflict (id) do update` path was exercised.
Result: **no duplication** — question count stayed at 240, topic count stayed at 22, no error.

## 14. RPC / navigation verification

- `interview_categories_list('website')` returns the Python category (`slug: "python"`,
  `topic_count: 22`).
- `interview_topic_detail('python', 'oop', 'website')` returns correct `prev`
  (`exception-handling`) and `next` (`file-handling`) topics, matching `sort_order` 60/70/80 —
  confirming deterministic prev/next navigation across a topic in the middle of the set.
- `interview_questions_sitemap('website')` returns **22** rows for `category_slug = 'python'`
  (one per published topic, matching the website's sitemap granularity).
- All 4 RPCs from `075`/`0103` were used as-is; none were modified.

## 15. Test / build verification

Run against the full repo state (migrations present, uncommitted, no app code touched):

| App | lint | typecheck | test | build |
|---|---|---|---|---|
| `admin-panel` | pass | pass | **121/121** passed | pass |
| `website` | pass | pass | **522 passed / 12 skipped** (534 total) | pass |

No test or build failure is related to this change — the migrations add rows to an existing
table set only; no application code was modified.

## 16. Production statement

**Shared/production Supabase was NOT modified.** No `supabase db push` was run. All
verification above ran against a disposable local PostgreSQL 17 cluster created for this audit
and torn down afterward. Nothing in this engagement was committed to git.

## Known follow-up (not part of this migration, flagged for the owner)

`website/src/app/practice/interview-questions/page.tsx` hardcodes a single `Coffee` icon for
*every* category on the hub grid (comment: "Only Java exists today; a fixed icon keeps this
page free of a dynamic icon-name lookup"). Adding the `python` category (icon `FileCode` in the
DB) does not break anything, but the hub page will still render the Coffee icon for the Python
tile until that one line is made to read `ic.icon` dynamically from the RPC response. Left
unchanged per "do not modify application code" for this engagement — the DB layer is fully
correct either way.
