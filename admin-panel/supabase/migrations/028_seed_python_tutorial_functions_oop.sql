-- admin-panel/supabase/migrations/028_seed_python_tutorial_functions_oop.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: mobile-app/supabase/migrations/0051_seed_python_tutorial_functions_oop.sql ; apply either, the other is a guarded no-op.
--
-- ============================================================================
-- BODY — extend the "Python Tutorial" Learning grid with a 2nd section: 5 more
-- topics (Functions / Modules & Packages / File Handling / Exception Handling /
-- OOP), each with full notes, a 10-question mock test (10-minute timer), and 4
-- Python coding problems
-- (mobile 0051_seed_python_tutorial_functions_oop.sql ==
--  admin 028_seed_python_tutorial_functions_oop.sql below this header —
--  byte-identical, guarded, idempotent, additive.)
-- ============================================================================
-- Second content drop for the python-tutorial grid seeded by 0050/027 (Python
-- Fundamentals / Conditional Statements / Loops / Python Data Structures /
-- Strings). Adds a second learning_sections row "Functions, Files & OOP" and 5
-- more topics, following the exact same pattern — no schema, RLS, or app-code
-- change. Uses the existing learning_grids / learning_sections / learning_topics
-- / learning_contents tables, the topic-practice tables from 0048/025
-- (practice_tests / test_questions / dsa_problems), and the existing admin CMS.
--
-- Each topic maps 1:1 to one authored chapter file, using that chapter's own
-- complete 10-question MCQ set verbatim (all 50 explanations were written fresh
-- for this batch — the source only gave bare answer letters here). The 4 Modules
-- & Packages coding problems were adapted from the source's module-creation /
-- true-randomness / wall-clock-date examples into single-script, deterministic
-- equivalents, since this project's judge runs one Python file against fixed
-- stdin/stdout (no multi-file imports, no non-deterministic grading target) —
-- see the memory note for the reasoning. All 20 coding problems are Python-only
-- (supported_languages = ['python']) with a verified stdin/stdout contract.
--
-- IDEMPOTENT. Re-running never duplicates and never clobbers an admin's later
-- edits, exactly like 0050/027.
-- ----------------------------------------------------------------------------

-- ---- ordering guard -----------------------------------------------------
do $guard$
begin
  if to_regclass('public.learning_grids') is null then
    raise exception '0051/028: learning_* not found — apply 0042_learning_management.sql (admin 019) first.';
  end if;
  if to_regprocedure('public.learning_topic_practice(text, text, text)') is null then
    raise exception '0051/028: apply 0048_topic_practice.sql (admin 025) first.';
  end if;
  if not exists (select 1 from public.learning_grids where lower(slug) = 'python-tutorial') then
    raise exception '0051/028: python-tutorial grid not found — apply 0050_seed_python_tutorial_content.sql (admin 027) first.';
  end if;
end
$guard$;

-- ===========================================================================
-- 2. SECTION — 2nd module for the existing python-tutorial grid.
-- ===========================================================================
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial')
insert into public.learning_sections
  (grid_id, name, slug, description, sort_order, status, show_on_website, show_on_mobile)
select g.id, $yy1$Functions, Files & OOP$yy1$, $yy2$functions-files-oop$yy2$, $yy3$Functions, Modules & Packages, File Handling, Exception Handling, and Object-Oriented Programming — the next tier of core Python after the basics.$yy3$, 20,
  'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, description = excluded.description,
  sort_order = excluded.sort_order, updated_at = now();

-- ===========================================================================
-- 3. TOPICS + CONTENT — 5 topics, one full notes block each.
-- ===========================================================================

-- Functions
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = 'functions-files-oop'),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $yy4$Functions$yy4$, $yy5$functions$yy5$, $yy6$Defining and calling functions, parameters vs arguments, return values, default/positional/keyword arguments, *args and **kwargs, variable scope, lambdas, recursion, and the map/filter/reduce higher-order functions.$yy6$, 6,
    'published', true, true, 'python_tutorial', $yy7$functions-files-oop/functions$yy7$
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
select up_topic.id, '', $yy8$As programs grow, repeating the same block of code in multiple places becomes messy and hard to maintain. Functions let you package logic into a reusable, named block — write it once, use it as many times as you need.

---

## 1. What is a Function?

### What is it?

A function is a named, reusable block of code that performs a specific task. You define it once and can "call" (run) it as many times as needed, from anywhere in your program.

> **Definition:** A function is a reusable block of code designed to perform a specific task.

### Why do we use it?

- **Avoid repetition** — write logic once, reuse it everywhere.
- **Organize code** — break a large program into smaller, understandable pieces.
- **Easier debugging** — if something goes wrong, you know exactly which function to check.
- **Reusability across projects** — well-written functions can be reused in other programs entirely.

### How does it work?

You **define** a function using the `def` keyword, giving it a name and (optionally) inputs it needs. Later, you **call** the function by its name to actually run the code inside it.

### Syntax

```python
def function_name(parameters):
    # code to run
    return value   # optional
```

### Simple Example

```python
def greet():
    print("Hello! Welcome to Python.")

greet()          # calling the function
greet()          # can be called as many times as needed
```

Output:
```
Hello! Welcome to Python.
Hello! Welcome to Python.
```

### Explanation of the Code

- `def greet():` defines a function named `greet` that takes no inputs.
- The indented block is the function's **body** — the code that runs each time it's called.
- `greet()` (with parentheses) is what actually executes it. Just writing `greet` without parentheses refers to the function itself, not a call to it.

### Real-World Example

In a large application, a function like `send_welcome_email(user)` might be called every time a new user signs up — instead of rewriting the email logic at every signup point in the code.

### Common Mistakes

- Forgetting the parentheses when calling a function: `greet` vs `greet()` — only the second one actually runs the code.
- Forgetting the colon `:` after the function definition line.
- Incorrect indentation of the function body.

### Important Points

- Function names follow the same rules as variable names (snake_case is the Python convention: `calculate_total`, not `CalculateTotal`).
- A function must be **defined before** it is called in the code.

### Practice

1. Write a function `say_hello()` that prints a greeting message, and call it 3 times.

---

## 2. Parameters and Arguments

### What is it?

- A **parameter** is the name listed in the function's definition — a placeholder for a value the function expects.
- An **argument** is the actual value you pass in when calling the function.

### Simple Example

```python
def greet(name):      # "name" is a parameter
    print(f"Hello, {name}!")

greet("Aditi")         # "Aditi" is the argument
greet("Rohan")
```

Output:
```
Hello, Aditi!
Hello, Rohan!
```

### Explanation

- `name` is just a placeholder in the definition — it has no value until the function is actually called.
- Each call supplies a different argument, so the same function produces different, personalized output.

### Common Mistakes

- Calling a function without the required arguments: `greet()` → `TypeError: greet() missing 1 required positional argument: 'name'`.
- Using the words "parameter" and "argument" interchangeably in interviews — knowing the distinction is a common interview question.

### Important Points

- Parameters are defined; arguments are supplied at call time.
- A function can have zero, one, or many parameters.

---

## 3. Return Values

### What is it?

`return` sends a value back from the function to wherever it was called, so that value can be stored or used further.

### Simple Example

```python
def add(a, b):
    return a + b

result = add(5, 3)
print(result)   # 8
```

### Explanation

- Unlike `print()`, which just displays something, `return` actually gives the value back to the caller so it can be stored in a variable (`result`) and used elsewhere in the program.
- Once `return` runs, the function stops immediately — any code after `return` inside the function does not execute.

### Common Mistakes

- Confusing `print()` (just displays a value) with `return` (actually sends a value back for further use).
- Forgetting a function without an explicit `return` returns `None` by default.

```python
def add_no_return(a, b):
    print(a + b)   # only displays, doesn't return anything

result = add_no_return(3, 4)   # prints "7"
print(result)                   # None (nothing was returned!)
```

### Important Points

- A function can return any type: a number, string, list, dictionary, even another function.
- `return` immediately exits the function.
- No `return` statement means the function returns `None`.

### Practice

1. Write a function `square(n)` that returns the square of a number, and print the result for 3 different numbers.

---

## 4. Default Arguments

### What is it?

A default argument provides a fallback value for a parameter, used only if the caller doesn't supply one.

### Simple Example

```python
def greet(name="Guest"):
    print(f"Hello, {name}!")

greet()          # Hello, Guest!
greet("Aditi")   # Hello, Aditi!
```

### Common Mistakes

- Placing a default parameter **before** a non-default one: `def greet(name="Guest", age):` → `SyntaxError`. Default parameters must come **after** all non-default ones.
- Using a mutable default value (like a list), which can cause unexpected shared behavior across calls (an advanced gotcha worth knowing).

### Important Points

- Default arguments make functions more flexible without requiring every caller to supply every value.
- All non-default parameters must appear before any default parameters in the function definition.

---

## 5. Positional vs Keyword Arguments

### What is it?

- **Positional arguments** are matched to parameters based on their order.
- **Keyword arguments** are matched by explicitly naming the parameter, regardless of order.

### Simple Example

```python
def describe_student(name, age, course):
    print(f"{name} is {age} years old, studying {course}")

# Positional — order matters
describe_student("Aditi", 21, "Computer Science")

# Keyword — order doesn't matter
describe_student(course="Computer Science", name="Aditi", age=21)
```

Both calls produce the same output:
```
Aditi is 21 years old, studying Computer Science
```

### Common Mistakes

- Mixing positional and keyword arguments incorrectly — positional arguments must always come before keyword arguments in a call: `describe_student(name="Aditi", 21, "CS")` → `SyntaxError`.

### Important Points

- Keyword arguments improve readability, especially when a function has many parameters.
- Positional arguments are simpler but require you to remember the exact order.

### Practice

1. Write a function with 3 parameters and call it once using positional arguments and once using keyword arguments.

---

## 6. `*args` and `**kwargs`

### What is it?

- `*args` lets a function accept **any number of positional arguments**, collected into a tuple.
- `**kwargs` lets a function accept **any number of keyword arguments**, collected into a dictionary.

### Simple Example — `*args`

```python
def add_all(*numbers):
    return sum(numbers)

print(add_all(1, 2, 3))         # 6
print(add_all(10, 20, 30, 40))  # 100
```

**Explanation:** `*numbers` gathers however many arguments are passed into a single tuple, e.g. `(1, 2, 3)`, which `sum()` then adds together.

### Simple Example — `**kwargs`

```python
def print_profile(**details):
    for key, value in details.items():
        print(f"{key}: {value}")

print_profile(name="Aditi", age=21, course="CS")
```

Output:
```
name: Aditi
age: 21
course: CS
```

**Explanation:** `**details` gathers all keyword arguments into a dictionary, so any number of named values can be passed flexibly.

### Real-World Example

Functions like Python's own `print()` accept a flexible number of arguments — this is exactly the kind of flexibility `*args` and `**kwargs` provide in your own functions.

### Common Mistakes

- Confusing the **order** of parameters — the correct order in a function definition is: normal parameters, then `*args`, then default parameters, then `**kwargs`.
- Trying to access `*args` like a dictionary or `**kwargs` like a tuple — remember: `args` is a tuple, `kwargs` is a dictionary.

### Important Points

- The names `args` and `kwargs` are just convention — the `*` and `**` are what matter, not the exact names.
- `*args` → tuple of positional arguments. `**kwargs` → dictionary of keyword arguments.

### Practice

1. Write a function using `*args` that returns the maximum of any number of arguments passed in.
2. Write a function using `**kwargs` that prints a formatted "profile card" from any number of named details.

---

## 7. Variable Scope

### What is it?

Scope determines where in your program a variable can be accessed.

- **Local scope** — a variable defined inside a function; only accessible within that function.
- **Global scope** — a variable defined outside any function; accessible everywhere (including inside functions, for reading).

### Simple Example

```python
x = 10   # global variable

def show_value():
    y = 5   # local variable, only exists inside this function
    print(x, y)   # can read global x, and its own local y

show_value()
print(x)      # 10 — works, x is global
print(y)      # NameError! y only exists inside show_value()
```

### Modifying a Global Variable Inside a Function

```python
count = 0

def increment():
    global count
    count += 1

increment()
increment()
print(count)   # 2
```

**Explanation:** Without the `global` keyword, Python would treat `count += 1` as creating a brand-new **local** variable inside the function, causing an error (since it's used before being assigned locally). `global count` tells Python to modify the actual global variable instead.

### Common Mistakes

- Trying to modify a global variable inside a function without using the `global` keyword, resulting in an `UnboundLocalError`.
- Assuming a variable defined inside a function is accessible outside it — it isn't.

### Important Points

- Local variables only exist while their function is running.
- Use the `global` keyword only when you genuinely need to modify a global variable from inside a function — overusing globals is generally considered poor practice.

### Practice

1. Create a global variable `total = 0` and write a function that adds a number to it using the `global` keyword.

---

## 8. Lambda Functions

### What is it?

A lambda is a small, anonymous (unnamed) function, written in a single line — used for short, simple operations, often passed directly into another function.

### Syntax

```python
lambda arguments: expression
```

### Simple Example

```python
square = lambda x: x ** 2
print(square(5))   # 25

add = lambda a, b: a + b
print(add(3, 4))   # 7
```

### Explanation

- `lambda x: x ** 2` is exactly equivalent to writing:
```python
def square(x):
    return x ** 2
```
just in a shorter, single-line form.

### Real-World Example

Lambdas are commonly used as a quick "key function" when sorting:

```python
students = [("Aditi", 85), ("Rohan", 92), ("Zara", 78)]
students.sort(key=lambda student: student[1])
print(students)
```

Output:
```
[('Zara', 78), ('Aditi', 85), ('Rohan', 92)]
```

### Common Mistakes

- Trying to write multi-line logic inside a lambda — lambdas can only contain a single expression, not full statements or multiple lines.
- Overusing lambdas for complex logic, which hurts readability — use a regular `def` function when the logic is more than a simple one-liner.

### Important Points

- Lambdas have no name (unless assigned to a variable) and no `return` keyword — the expression's result is automatically returned.
- Best used for short, throwaway functions, especially with `sort()`, `map()`, and `filter()`.

### Practice

1. Write a lambda function that returns whether a number is even.
2. Use a lambda to sort a list of words by their length.

---

## 9. Recursion

### What is it?

Recursion is when a function calls itself to solve a smaller version of the same problem, until it reaches a simple "base case" that stops the recursion.

### Simple Example — Factorial

```python
def factorial(n):
    if n == 0 or n == 1:   # base case
        return 1
    return n * factorial(n - 1)   # recursive case

print(factorial(5))   # 120
```

### Explanation of the Code

- `factorial(5)` calls `factorial(4)`, which calls `factorial(3)`, and so on, down to `factorial(1)`, which returns `1` (the base case).
- The results then multiply back up the chain: `1 -> 2 -> 6 -> 24 -> 120`.
- Every recursive function **must** have a base case, or it will call itself forever, eventually crashing with a `RecursionError`.

### Real-World Example

Recursion naturally fits problems with a repeating, self-similar structure — like navigating folders within folders, or calculating Fibonacci numbers.

```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

for i in range(7):
    print(fibonacci(i), end=" ")
```

Output:
```
0 1 1 2 3 5 8
```

### Common Mistakes

- Forgetting the base case, causing infinite recursion and a crash.
- Using recursion for problems that would be simpler and more efficient with a plain loop.

### Important Points

- Every recursive function needs a base case (a stopping condition) and a recursive case (that moves toward the base case).
- Recursion is elegant for tree-like or self-similar problems, but can be less efficient than loops for simple repetitive tasks.

### Practice

1. Write a recursive function to calculate the sum of numbers from 1 to `n`.
2. Write a recursive function to reverse a string.

---

## 10. Higher-Order Functions: `map`, `filter`, `reduce`

### What is it?

A higher-order function is a function that takes another function as an argument (or returns one). Python provides three especially useful built-in ones: `map()`, `filter()`, and `reduce()`.

### `map()` — Apply a Function to Every Item

```python
numbers = [1, 2, 3, 4, 5]
squared = list(map(lambda x: x ** 2, numbers))
print(squared)   # [1, 4, 9, 16, 25]
```

**Explanation:** `map()` applies the given function to every item in `numbers`, producing a new sequence of results.

### `filter()` — Keep Only Items That Pass a Condition

```python
numbers = [1, 2, 3, 4, 5, 6, 7, 8]
evens = list(filter(lambda x: x % 2 == 0, numbers))
print(evens)   # [2, 4, 6, 8]
```

**Explanation:** `filter()` keeps only the items for which the given function returns `True`.

### `reduce()` — Combine All Items Into a Single Value

```python
from functools import reduce

numbers = [1, 2, 3, 4]
total = reduce(lambda a, b: a + b, numbers)
print(total)   # 10
```

**Explanation:** `reduce()` repeatedly combines items two at a time: `((1 + 2) + 3) + 4 = 10`. Unlike `map()` and `filter()`, `reduce()` must be imported from the `functools` module.

### Comparison Table

| Function | Purpose | Returns |
|---|---|---|
| `map()` | Transform every item | New sequence (same length) |
| `filter()` | Keep items matching a condition | New sequence (same or shorter length) |
| `reduce()` | Combine all items into one value | A single value |

### Common Mistakes

- Forgetting to wrap `map()`/`filter()` results in `list(...)` to actually see the values (they return special iterator objects, not lists directly).
- Forgetting to `import reduce` from `functools` — unlike `map`/`filter`, it's not a built-in available by default.

### Important Points

- `map()`, `filter()`, and `reduce()` are often used with lambda functions for compact, one-line data processing.
- They can often be replaced with list comprehensions, which many Python developers find more readable (e.g., `[x**2 for x in numbers]` instead of `map()`).

### Practice

1. Use `map()` to convert a list of Celsius temperatures to Fahrenheit.
2. Use `filter()` to extract only the words longer than 4 letters from a list of words.
3. Use `reduce()` to find the maximum value in a list without using the built-in `max()`.

---

## Common Beginner Mistakes — Summary for This Section

- Confusing `print()` with `return`.
- Forgetting a function without `return` gives back `None`.
- Placing default parameters before non-default ones.
- Forgetting the `global` keyword when modifying a global variable inside a function.
- Writing recursive functions without a proper base case.

---

## Cheat Sheet — Functions

```python
def my_function(a, b=10, *args, **kwargs):
    return a + b

my_function(5)                 # uses default b
my_function(5, 20)              # positional
my_function(a=5, b=20)          # keyword
my_function(1, 2, 3, 4)         # extra positional -> args
my_function(1, x=5, y=10)       # extra keyword -> kwargs

square = lambda x: x ** 2       # lambda
list(map(square, [1, 2, 3]))    # map
list(filter(lambda x: x > 1, [1, 2, 3]))  # filter

from functools import reduce
reduce(lambda a, b: a + b, [1, 2, 3])     # reduce
```

---

## Mini Project: Expense Tracker

### Objective

Build a function-based command-line program that lets a user add expenses, view them, and see a running total.

### Requirements

- Store expenses as a list of dictionaries (`{"category": ..., "amount": ...}`).
- Provide functions to add an expense, view all expenses, and calculate the total.
- Use a loop to let the user keep adding expenses until they choose to stop.

### Concepts Used

Functions, parameters/return values, lists, dictionaries, loops, conditionals.

### Complete Code

```python
expenses = []

def add_expense(category, amount):
    expenses.append({"category": category, "amount": amount})
    print(f"Added: {category} - Rs.{amount}")

def view_expenses():
    if not expenses:
        print("No expenses recorded yet.")
        return
    for expense in expenses:
        print(f"{expense['category']}: Rs.{expense['amount']}")

def calculate_total():
    return sum(expense["amount"] for expense in expenses)

while True:
    print("\n1. Add Expense  2. View Expenses  3. View Total  4. Exit")
    choice = input("Choose an option: ")

    if choice == "1":
        category = input("Category: ")
        amount = float(input("Amount: "))
        add_expense(category, amount)
    elif choice == "2":
        view_expenses()
    elif choice == "3":
        print(f"Total Expenses: Rs.{calculate_total():.2f}")
    elif choice == "4":
        print("Goodbye!")
        break
    else:
        print("Invalid choice, try again.")
```

### Code Explanation

- Each menu option calls a dedicated function, keeping the main loop clean and readable.
- `calculate_total()` uses a generator expression inside `sum()` to add up every expense's amount without needing a separate loop.
- The `while True` loop keeps the menu running until the user selects "Exit."

### Sample Output

```
1. Add Expense  2. View Expenses  3. View Total  4. Exit
Choose an option: 1
Category: Groceries
Amount: 1500
Added: Groceries - Rs.1500.0

1. Add Expense  2. View Expenses  3. View Total  4. Exit
Choose an option: 3
Total Expenses: Rs.1500.00
```

### Possible Improvements

- Add a function to delete or edit an existing expense.
- Group and display expenses by category with subtotals.
- Save expenses to a file so they persist after the program closes (covered in the File Handling section).

### Challenge Task

Add a function that shows the total spent per category using a dictionary that accumulates totals as expenses are added.

---

## Interview Questions

**Q1. What is the difference between a parameter and an argument?**
Answer: A parameter is the variable name listed in a function's definition; an argument is the actual value passed in when the function is called.

**Q2. What's the difference between `*args` and `**kwargs`?**
Answer: `*args` collects extra positional arguments into a tuple. `**kwargs` collects extra keyword arguments into a dictionary.

**Q3. What does a function return if there's no explicit `return` statement?**
Answer: `None`.

**Q4. What is the difference between local and global scope?**
Answer: A local variable is defined inside a function and only accessible there. A global variable is defined outside any function and accessible throughout the program (though modifying it inside a function requires the `global` keyword).

**Q5. What is a lambda function, and when would you use one?**
Answer: A small, anonymous, single-expression function, typically used for short operations passed into functions like `sort()`, `map()`, or `filter()`.

**Q6. What are the two essential parts of any recursive function?**
Answer: A base case (a condition that stops the recursion) and a recursive case (where the function calls itself with a smaller version of the problem).

---

## Practice Questions

**Beginner**
1. Write a function `is_even(n)` that returns `True` if a number is even.
2. Write a function that takes a name and greets it with a default value of "Guest" if no name is passed.
3. Write a function `add(a, b, c)` and call it using keyword arguments in a different order.
4. Write a lambda function that multiplies two numbers.
5. Write a function that returns the maximum of any number of arguments using `*args`.

**Intermediate**
1. Write a recursive function to calculate the factorial of a number.
2. Write a function that takes a list of numbers and returns a new list with only the even numbers, using `filter()`.
3. Write a function that takes a sentence and returns the number of vowels in it.
4. Write a function using `**kwargs` that builds and returns a formatted string from any number of key-value details.
5. Write a function that calculates simple interest, with default values for rate and time.

**Challenge**
1. Write a recursive function to calculate the nth Fibonacci number, and compare its speed to an iterative version for large `n`.
2. Write a function that takes a list of student dictionaries and returns the name of the student with the highest marks, using `max()` with a lambda `key`.
3. Extend the Expense Tracker mini project to filter and display expenses above a certain amount, entered by the user.
$yy8$, 'markdown',
  jsonb_build_object('source', 'python_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'python_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Modules & Packages
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = 'functions-files-oop'),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $yy9$Modules & Packages$yy9$, $yy10$modules-and-packages$yy10$, $yy11$Organizing code into modules and packages, the different ways to import, __name__ == "__main__", and a practical tour of the Standard Library (math, random, datetime, os, sys, json, re, statistics, collections, itertools, functools).$yy11$, 7,
    'published', true, true, 'python_tutorial', $yy12$functions-files-oop/modules-and-packages$yy12$
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
select up_topic.id, '', $yy13$As programs grow, it doesn't make sense to keep everything in one giant file — and you also don't want to rewrite common functionality (like math operations or date handling) from scratch every time. Python solves this with **modules** and **packages**, plus a massive built-in **Standard Library** of ready-to-use tools.

---

## 1. What is a Module?

### What is it?

A module is simply a Python file (`.py`) containing code — variables, functions, classes — that can be reused in other Python files by importing it.

> **Definition:** A module is a single Python file containing reusable code that can be imported into other programs.

### Why do we use it?

- **Organization** — split a large program into logical, manageable files.
- **Reusability** — write a function once, use it in many different programs.
- **Avoid repetition** — no need to rewrite common logic (like date calculations) every time.

### How does it work?

Any `.py` file is automatically a module. You bring its contents into another file using the `import` keyword.

### Simple Example — Creating Your Own Module

**File: `mymath.py`**
```python
def add(a, b):
    return a + b

def subtract(a, b):
    return a - b
```

**File: `main.py`** (in the same folder)
```python
import mymath

print(mymath.add(5, 3))       # 8
print(mymath.subtract(5, 3))  # 2
```

### Explanation of the Code

- `import mymath` loads everything defined inside `mymath.py`, making it available through `mymath.functionname()`.
- The module name is just the filename, without the `.py` extension.

### Common Mistakes

- Trying to import a module that isn't in the same folder (or on Python's search path), causing `ModuleNotFoundError`.
- Naming your own file the same as a well-known library (e.g., naming your file `random.py`), which can conflict with Python's built-in modules.

### Important Points

- Any `.py` file can be treated as a module.
- The module name matches the filename (without `.py`).

---

## 2. Different Ways to Import

### Syntax Options

```python
import math                      # import the whole module
print(math.sqrt(16))             # access with module_name.function()

from math import sqrt            # import just one function
print(sqrt(16))                  # use it directly, no prefix needed

from math import sqrt, pow       # import multiple specific items

import math as m                 # import with an alias (shorter name)
print(m.sqrt(16))

from math import *                # import EVERYTHING (generally discouraged)
```

### Explanation

- `import math` keeps things organized — you always know a function like `sqrt()` came from `math` because you write `math.sqrt()`.
- `from math import sqrt` is more convenient when you use a function frequently, but it's less clear where the function came from, especially in larger files.
- `import math as m` is common for long library names (very frequently seen with libraries like `pandas as pd` or `numpy as np`).

### Common Mistakes

- Using `from module import *`, which can cause naming conflicts if two modules define something with the same name — it's discouraged in real projects for this reason.
- Forgetting to install a third-party module before importing it (built-in modules like `math` need no installation, but others like `requests` do — covered in the Package Management file).

### Important Points

- `import module_name` is the safest, clearest default choice.
- Aliasing (`as`) is a widely used convention for popular libraries.

---

## 3. Packages

### What is it?

A package is a folder containing multiple related modules, organized together — essentially, a "module of modules."

> **Definition:** A package is a directory containing multiple Python modules, along with a special `__init__.py` file that marks it as a package.

### Folder Structure Example

```
myapp/
    __init__.py
    calculations.py
    formatting.py
```

### Simple Example

**File: `myapp/calculations.py`**
```python
def add(a, b):
    return a + b
```

**File: `main.py`** (outside the `myapp` folder)
```python
from myapp import calculations

print(calculations.add(5, 3))   # 8
```

### What is `__init__.py`?

This special (often empty) file tells Python "this folder is a package, not just a regular folder." Without it, older versions of Python won't recognize the folder as importable (modern Python 3 can sometimes work without it via "namespace packages," but including it is still standard, clear practice).

### Real-World Example

Popular libraries like `numpy` or `django` are packages — large folders full of organized modules, all accessible through a single `import numpy` statement.

### Common Mistakes

- Forgetting `__init__.py` in a package folder, leading to unexpected import behavior in some setups.
- Confusing "module" (single file) with "package" (folder of modules) — a common interview distinction.

### Important Points

- A package is a folder; a module is a single file.
- `__init__.py` marks a folder as a package.

---

## 4. `__name__` and `__main__`

### What is it?

Every Python file has a built-in variable called `__name__`. When a file is run **directly**, `__name__` is automatically set to `"__main__"`. When the same file is **imported** into another file, `__name__` is set to the module's actual name instead.

### Why do we use it?

This lets you write code in a file that behaves differently depending on whether it's being run directly or just imported for its functions — extremely useful for testing a module's code without that test code running every time someone else imports it.

### Simple Example

**File: `greetings.py`**
```python
def greet(name):
    print(f"Hello, {name}!")

if __name__ == "__main__":
    greet("Test User")   # only runs when this file is executed directly
```

- Running `python greetings.py` directly → prints `"Hello, Test User!"`.
- Running `import greetings` from another file → the `greet()` function is available, but `"Hello, Test User!"` does **not** print automatically.

### Real-World Example

Almost every well-structured Python script or library uses this pattern so that importing it for its functions doesn't accidentally trigger test code or a demo run meant only for direct execution.

### Common Mistakes

- Forgetting this check entirely, causing test/demo code to run unexpectedly whenever the file is imported elsewhere.

### Important Points

- `__name__ == "__main__"` is a near-universal pattern in real Python projects.
- It distinguishes "this file was run directly" from "this file was imported."

### Practice

1. Create a module with a function and a `if __name__ == "__main__":` block that tests the function. Run it directly, then import it from another file and observe the difference.

---

## 5. The Python Standard Library — A Practical Tour

Python comes bundled with a huge collection of built-in modules — no installation required. Here are the most commonly used ones.

### 5.1 `math` — Mathematical Functions

```python
import math

print(math.sqrt(25))     # 5.0
print(math.pow(2, 3))    # 8.0
print(math.floor(4.7))   # 4
print(math.ceil(4.2))    # 5
print(math.pi)           # 3.141592653589793
```

**Real-World Use:** Calculating distances, geometry, engineering formulas.

### 5.2 `random` — Random Number Generation

```python
import random

print(random.randint(1, 100))     # random integer between 1 and 100
print(random.choice(["A", "B", "C"]))   # random item from a list
print(random.random())             # random float between 0.0 and 1.0

items = [1, 2, 3, 4, 5]
random.shuffle(items)              # shuffles the list in place
print(items)
```

**Real-World Use:** Games (like the Number Guessing Game), generating OTPs, shuffling quiz questions.

### 5.3 `datetime` — Dates and Times

```python
from datetime import datetime, date

now = datetime.now()
print(now)                          # e.g. 2026-09-02 14:30:00.123456
print(now.year, now.month, now.day)

birth_date = date(2000, 5, 15)
today = date.today()
age_days = (today - birth_date).days
print(f"You are {age_days} days old")
```

**Real-World Use:** Timestamps, age calculators, scheduling systems, log files.

### 5.4 `os` — Operating System Interaction

```python
import os

print(os.getcwd())              # current working directory
os.mkdir("new_folder")          # create a folder
print(os.listdir("."))          # list files in current directory
print(os.path.exists("main.py"))  # check if a file exists
```

**Real-World Use:** File automation, checking/creating folders, working with file paths across operating systems.

### 5.5 `sys` — System-Specific Parameters

```python
import sys

print(sys.version)     # Python version info
print(sys.argv)         # command-line arguments passed to the script
```

**Real-World Use:** Reading command-line arguments, exiting a script early with `sys.exit()`.

### 5.6 `json` — Working with JSON Data

```python
import json

data = {"name": "Aditi", "age": 21}

json_string = json.dumps(data)    # Python dict -> JSON string
print(json_string)                 # {"name": "Aditi", "age": 21}

parsed = json.loads(json_string)   # JSON string -> Python dict
print(parsed["name"])              # Aditi
```

**Real-World Use:** APIs almost always send and receive data in JSON format — this module is essential for web development and API work (covered in depth later).

### 5.7 `re` — Regular Expressions

```python
import re

text = "Call me at 9876543210"
match = re.search(r"\d{10}", text)
if match:
    print("Phone number found:", match.group())
```

**Real-World Use:** Validating emails, phone numbers, passwords (covered in full in the Regular Expressions file).

### 5.8 `statistics` — Statistical Calculations

```python
import statistics

marks = [85, 90, 78, 92, 88]

print(statistics.mean(marks))     # average
print(statistics.median(marks))   # middle value
print(statistics.mode(marks))     # most common value
```

**Real-World Use:** Quick statistical summaries without needing a heavier library like NumPy for simple cases.

### 5.9 `collections` — Specialized Data Structures

```python
from collections import Counter, defaultdict

words = ["apple", "banana", "apple", "cherry", "banana", "apple"]
print(Counter(words))
# Counter({'apple': 3, 'banana': 2, 'cherry': 1})

word_count = defaultdict(int)
for word in words:
    word_count[word] += 1
print(dict(word_count))
```

**Explanation:** `Counter` instantly counts occurrences of each item. `defaultdict` avoids `KeyError` by providing a default value (here, `0`) for keys that don't exist yet.

**Real-World Use:** Word frequency counters, grouping and tallying data.

### 5.10 `itertools` — Efficient Looping Tools

```python
import itertools

# All possible pairs from a list
for pair in itertools.combinations([1, 2, 3], 2):
    print(pair)
# (1, 2)
# (1, 3)
# (2, 3)
```

**Real-World Use:** Generating combinations/permutations, efficient looping over large or infinite sequences.

### 5.11 `functools` — Functional Programming Tools

```python
from functools import reduce, lru_cache

total = reduce(lambda a, b: a + b, [1, 2, 3, 4])
print(total)   # 10

@lru_cache(maxsize=None)
def slow_square(n):
    return n * n

print(slow_square(5))   # cached after first call
```

**Explanation:** `@lru_cache` automatically remembers previous results of a function, so repeated calls with the same input skip re-computation — useful for speeding up expensive functions like recursive calculations.

**Real-World Use:** Speeding up repeated expensive calculations (like recursive Fibonacci), combining values with `reduce`.

### Comparison Table — Common Standard Library Modules

| Module | Purpose |
|---|---|
| `math` | Mathematical calculations |
| `random` | Random values, shuffling, choices |
| `datetime` | Dates and times |
| `os` | File system and OS interaction |
| `sys` | System/interpreter-level info |
| `json` | Encoding/decoding JSON data |
| `re` | Pattern matching in text |
| `statistics` | Quick statistical calculations |
| `collections` | Specialized containers (Counter, defaultdict) |
| `itertools` | Efficient iteration tools |
| `functools` | Functional programming helpers (reduce, caching) |

---

## Common Beginner Mistakes — Summary

- Using `from module import *`, risking naming conflicts.
- Naming your own files the same as standard modules (e.g., `random.py`), which shadows the real module.
- Forgetting `__init__.py` when building a package.
- Forgetting that `import` only needs to happen once per file, at the top.
- Confusing "module" (a file) with "package" (a folder of modules).

---

## Cheat Sheet — Modules & Packages

```python
import math                    # standard import
from math import sqrt          # import specific item
import math as m                # import with alias
from math import *              # import everything (avoid in real projects)

if __name__ == "__main__":
    # code that runs only when this file is executed directly
    pass
```

```
myapp/                # package (folder)
    __init__.py        # marks it as a package
    module_one.py       # a module inside the package
    module_two.py
```

---

## Interview Questions

**Q1. What is the difference between a module and a package?**
Answer: A module is a single Python file. A package is a folder containing multiple related modules, along with an `__init__.py` file marking it as a package.

**Q2. What does `if __name__ == "__main__":` do?**
Answer: It checks whether the current file is being run directly (in which case `__name__` equals `"__main__"`) rather than imported into another file — code inside this block only runs on direct execution.

**Q3. What is the risk of using `from module import *`?**
Answer: It can cause naming conflicts if multiple modules define something with the same name, and it makes it unclear where a given function or variable actually came from.

**Q4. Name three commonly used Python Standard Library modules and their purpose.**
Answer: Examples: `math` (mathematical functions), `datetime` (dates and times), `os` (file system and operating system interaction), `json` (working with JSON data), `random` (random values).

**Q5. What does `__init__.py` do in a package?**
Answer: It marks a folder as a Python package so its modules can be imported properly.

---

## Practice Questions

**Beginner**
1. Create your own module with two functions and import it into a separate file.
2. Use the `math` module to calculate the square root and factorial of a number.
3. Use the `random` module to simulate rolling a die (random number from 1 to 6).
4. Use the `datetime` module to print today's date.
5. Use the `os` module to list all files in the current directory.

**Intermediate**
1. Create a package with two modules (`operations.py` and `formatting.py`) and use both in a `main.py` file.
2. Use the `json` module to convert a dictionary of student data into a JSON string and back.
3. Use `collections.Counter` to find the most common word in a list of words.
4. Write a function that uses `if __name__ == "__main__":` to test itself only when run directly.
5. Use the `statistics` module to calculate the mean, median, and mode of a list of exam scores.

**Challenge**
1. Use `itertools.permutations` to generate all possible orderings of a 3-letter word.
2. Build a simple age calculator using the `datetime` module that takes a birth date and prints the person's exact age in years, months, and days.
3. Use `functools.lru_cache` to speed up a recursive Fibonacci function, and compare its execution time to the uncached version.
$yy13$, 'markdown',
  jsonb_build_object('source', 'python_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'python_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- File Handling
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = 'functions-files-oop'),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $yy14$File Handling$yy14$, $yy15$file-handling$yy15$, $yy16$Reading and writing files with open() and the with statement, the four ways to read a file, writing and appending, and working with CSV and JSON files and directories.$yy16$, 8,
    'published', true, true, 'python_tutorial', $yy17$functions-files-oop/file-handling$yy17$
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
select up_topic.id, '', $yy18$So far, every program has "forgotten" everything the moment it stops running — variables disappear once the program ends. File handling lets your programs save data permanently, and read data back from files on disk.

---

## 1. What is File Handling?

### What is it?

File handling refers to the operations Python provides for creating, reading, writing, and modifying files stored on your computer.

### Why do we use it?

- To **save data permanently** — so it's still there the next time the program runs.
- To **read existing data** — logs, configuration files, datasets.
- To **exchange data** between programs, using common formats like CSV and JSON.

### Real-World Example

A student record system needs to save student data even after the program closes. A data analysis script needs to read a CSV file of sales data. A logging system needs to continuously write events to a log file.

---

## 2. Opening a File — `open()`

### Syntax

```python
file = open("filename.txt", "mode")
```

### File Modes

| Mode | Meaning |
|---|---|
| `"r"` | Read (default) — file must exist |
| `"w"` | Write — creates a new file, **overwrites** if it already exists |
| `"a"` | Append — adds to the end of an existing file (creates it if missing) |
| `"x"` | Create — fails if the file already exists |
| `"r+"` | Read and write |
| `"rb"` / `"wb"` | Same as above, but in binary mode (for non-text files like images) |

### Simple Example

```python
file = open("notes.txt", "w")
file.write("Hello, this is my first file!")
file.close()
```

### Explanation of the Code

- `open("notes.txt", "w")` creates the file `notes.txt` (or overwrites it if it exists).
- `.write()` puts text into the file.
- `.close()` closes the file, saving the changes and freeing system resources.

### Common Mistakes

- **Forgetting to close the file** — this can cause data not to be properly saved or the file to remain "locked" by the program.
- Using `"w"` mode when you meant `"a"` — `"w"` **erases** existing content in the file completely.

---

## 3. The `with` Statement (Best Practice)

### What is it?

The `with` statement automatically closes the file for you, even if an error occurs while working with it — this is the recommended, modern way to handle files in Python.

### Syntax

```python
with open("filename.txt", "mode") as file:
    # work with file here
# file is automatically closed here, even if an error occurred
```

### Simple Example

```python
with open("notes.txt", "w") as file:
    file.write("Hello, this is my first file!")

# no need to call file.close() - it happens automatically
```

### Why This Matters

Without `with`, forgetting `.close()` (or an error occurring before you reach it) can leave the file open, potentially causing data loss or file-locking issues. `with` guarantees proper cleanup every time.

### Important Points

- Always prefer `with open(...) as file:` over manually calling `open()` and `close()`.
- This is considered a Python best practice used throughout real-world code.

---

## 4. Reading Files

### `read()` — Read the Entire File as One String

```python
with open("notes.txt", "r") as file:
    content = file.read()
    print(content)
```

### `readline()` — Read One Line at a Time

```python
with open("notes.txt", "r") as file:
    first_line = file.readline()
    print(first_line)
```

### `readlines()` — Read All Lines Into a List

```python
with open("notes.txt", "r") as file:
    lines = file.readlines()
    print(lines)   # ['Line 1\n', 'Line 2\n', 'Line 3\n']
```

### Reading Line by Line with a Loop (Most Common Pattern)

```python
with open("notes.txt", "r") as file:
    for line in file:
        print(line.strip())   # .strip() removes the trailing newline character
```

### Comparison Table — Reading Methods

| Method | Returns | Best For |
|---|---|---|
| `read()` | Entire file as one string | Small files, need full content at once |
| `readline()` | One line (string) | Reading one line at a time manually |
| `readlines()` | List of all lines | Need each line as a separate list item |
| `for line in file:` | Iterates line by line | Large files (memory-efficient), most common pattern |

### Common Mistakes

- Trying to open a file that doesn't exist in `"r"` mode — `FileNotFoundError`.
- Forgetting `.strip()` when printing lines read with `readlines()` or a `for` loop, resulting in extra blank lines (since each line already includes its trailing `\n`).

### Practice

1. Create a text file with 3 lines of your choice, then read and print it using each of the four methods above.

---

## 5. Writing to Files

### `write()` — Write a String

```python
with open("notes.txt", "w") as file:
    file.write("First line\n")
    file.write("Second line\n")
```

### `writelines()` — Write Multiple Lines at Once

```python
lines = ["Line 1\n", "Line 2\n", "Line 3\n"]

with open("notes.txt", "w") as file:
    file.writelines(lines)
```

**Note:** `writelines()` does **not** automatically add newlines between items — you must include `\n` yourself in each string, as shown above.

### Appending to a File

```python
with open("notes.txt", "a") as file:
    file.write("This line is added at the end\n")
```

**Explanation:** `"a"` mode adds new content after whatever is already in the file, instead of erasing it (unlike `"w"` mode).

### Comparison Table — `"w"` vs `"a"`

| | `"w"` (Write) | `"a"` (Append) |
|---|---|---|
| Existing content | Erased completely | Preserved, new content added after |
| File doesn't exist | Creates a new file | Creates a new file |
| Use when | Starting fresh | Adding to existing data (e.g., logs) |

### Common Mistakes

- Using `"w"` mode repeatedly, accidentally erasing previously saved data every time the program runs.
- Forgetting `\n` between lines when using `write()` multiple times, causing all text to run together on one line.

### Practice

1. Write a program that appends today's date to a file called `log.txt` every time it runs.

---

## 6. Working with CSV Files

### What is it?

CSV (Comma-Separated Values) is a simple, widely used format for storing tabular data (like a spreadsheet) as plain text.

### Simple Example

```python
import csv

# Writing a CSV file
with open("students.csv", "w", newline="") as file:
    writer = csv.writer(file)
    writer.writerow(["Name", "Age", "Course"])
    writer.writerow(["Aditi", 21, "Computer Science"])
    writer.writerow(["Rohan", 22, "Data Science"])

# Reading a CSV file
with open("students.csv", "r") as file:
    reader = csv.reader(file)
    for row in reader:
        print(row)
```

Output:
```
['Name', 'Age', 'Course']
['Aditi', '21', 'Computer Science']
['Rohan', '22', 'Data Science']
```

### Reading CSV as Dictionaries (Very Useful)

```python
with open("students.csv", "r") as file:
    reader = csv.DictReader(file)
    for row in reader:
        print(row["Name"], row["Course"])
```

### Common Mistakes

- Forgetting `newline=""` when opening a CSV file for writing on Windows, which can cause blank extra lines between rows.
- Forgetting that all values read from a CSV file come back as **strings** — numbers need manual conversion (`int()`/`float()`) if you plan to calculate with them.

### Important Points

- The `csv` module is Python's built-in tool for reading/writing CSV files.
- `csv.DictReader` is often more convenient since it lets you access columns by name instead of position.

---

## 7. Working with JSON Files

### What is it?

JSON (JavaScript Object Notation) is a text format for structured data, extremely common for configuration files and API communication.

### Simple Example

```python
import json

student = {"name": "Aditi", "age": 21, "course": "Computer Science"}

# Writing JSON to a file
with open("student.json", "w") as file:
    json.dump(student, file)

# Reading JSON from a file
with open("student.json", "r") as file:
    data = json.load(file)
    print(data["name"])   # Aditi
```

### Comparison Table — `json.dump()`/`load()` vs `json.dumps()`/`loads()`

| | Works With | Function Names |
|---|---|---|
| Files | `.dump()` writes to a file, `.load()` reads from a file | `dump` / `load` |
| Strings | `.dumps()` converts to a string, `.loads()` converts from a string | `dumps` / `loads` (note the extra "s") |

### Common Mistakes

- Confusing `dump`/`load` (file-based) with `dumps`/`loads` (string-based) — the extra "s" makes all the difference.
- Trying to `json.load()` a file that isn't valid JSON, causing a `json.JSONDecodeError`.

### Important Points

- JSON is the standard format for APIs and configuration files — you'll use this constantly in the APIs & HTTP section later.

---

## 8. Working with Directories

### What is it?

Beyond individual files, Python (via the `os` module, introduced in the previous file) can create, check, and navigate folders.

### Simple Example

```python
import os

if not os.path.exists("data"):
    os.mkdir("data")

print(os.listdir("."))          # list everything in the current folder
print(os.path.isfile("notes.txt"))   # True if it's a file
print(os.path.isdir("data"))         # True if it's a folder
```

### Common Mistakes

- Trying to create a folder that already exists using `os.mkdir()`, which raises a `FileExistsError` — always check with `os.path.exists()` first.

---

## Common Beginner Mistakes — Summary for This Section

- Forgetting to close files (always prefer `with open(...) as file:`).
- Using `"w"` mode and accidentally erasing existing data.
- Forgetting values read from files (including CSV) are always strings.
- Confusing `dump`/`load` with `dumps`/`loads` in the `json` module.
- Trying to open a non-existent file in read mode.

---

## Cheat Sheet — File Handling

```python
with open("file.txt", "r") as f:
    content = f.read()
    lines = f.readlines()
    for line in f:
        print(line.strip())

with open("file.txt", "w") as f:
    f.write("text\n")
    f.writelines(["line1\n", "line2\n"])

with open("file.txt", "a") as f:
    f.write("appended text\n")

import csv
csv.writer(file).writerow([...])
csv.reader(file)
csv.DictReader(file)

import json
json.dump(data, file)
data = json.load(file)
json.dumps(data)     # dict -> string
json.loads(string)   # string -> dict
```

---

## Mini Project: Student Record Management System

### Objective

Build a command-line program that stores student records permanently in a JSON file, so data survives between program runs.

### Requirements

- Add a new student record (name, roll number, marks).
- View all student records.
- Save records to a JSON file, and load existing records when the program starts.

### Concepts Used

Functions, dictionaries, lists, file handling, JSON, loops, conditionals.

### Complete Code

```python
import json
import os

FILENAME = "students.json"

def load_records():
    if os.path.exists(FILENAME):
        with open(FILENAME, "r") as file:
            return json.load(file)
    return []

def save_records(records):
    with open(FILENAME, "w") as file:
        json.dump(records, file, indent=4)

def add_student(records):
    name = input("Name: ")
    roll_number = input("Roll Number: ")
    marks = float(input("Marks: "))
    records.append({"name": name, "roll_number": roll_number, "marks": marks})
    save_records(records)
    print("Student record added and saved.")

def view_students(records):
    if not records:
        print("No records found.")
        return
    for student in records:
        print(f"{student['roll_number']} - {student['name']} - Marks: {student['marks']}")

records = load_records()

while True:
    print("\n1. Add Student  2. View Students  3. Exit")
    choice = input("Choose an option: ")

    if choice == "1":
        add_student(records)
    elif choice == "2":
        view_students(records)
    elif choice == "3":
        print("Goodbye!")
        break
    else:
        print("Invalid choice.")
```

### Code Explanation

- `load_records()` checks if `students.json` already exists; if so, it loads previously saved data, so records persist between runs.
- `save_records()` writes the current list of records back to the JSON file every time a new student is added — `indent=4` makes the saved file human-readable.
- The `while True` menu loop keeps the program running until the user exits.

### Sample Output

```
1. Add Student  2. View Students  3. Exit
Choose an option: 1
Name: Aditi
Roll Number: CS101
Marks: 88.5
Student record added and saved.

1. Add Student  2. View Students  3. Exit
Choose an option: 2
CS101 - Aditi - Marks: 88.5
```

### Possible Improvements

- Add a search function to find a student by roll number.
- Add an "update" and "delete" option for existing records.
- Export records to a CSV file for easy viewing in Excel.

### Challenge Task

Add a function that calculates and displays the class average and topper from all saved records.

---

## Interview Questions

**Q1. Why is the `with` statement preferred over manually calling `open()` and `close()`?**
Answer: `with` automatically closes the file when the block finishes, even if an error occurs inside it, preventing resource leaks and data loss.

**Q2. What's the difference between `"w"` and `"a"` file modes?**
Answer: `"w"` overwrites (erases) existing file content before writing. `"a"` appends new content to the end of the existing file without erasing it.

**Q3. What's the difference between `read()`, `readline()`, and `readlines()`?**
Answer: `read()` returns the entire file as one string. `readline()` returns a single line. `readlines()` returns a list containing every line as a separate string.

**Q4. What's the difference between `json.dump()` and `json.dumps()`?**
Answer: `json.dump()` writes JSON data directly to a file. `json.dumps()` converts data into a JSON-formatted string (no file involved). The equivalent reading functions are `json.load()` and `json.loads()`.

**Q5. What error occurs if you try to open a non-existent file in read mode?**
Answer: `FileNotFoundError`.

---

## Practice Questions

**Beginner**
1. Create a text file and write 3 lines to it, then read and print its full content.
2. Append a new line to an existing text file without erasing its content.
3. Read a file line by line and print only lines that contain the word "Python".
4. Count the number of lines in a text file.
5. Check if a file exists before trying to read it.

**Intermediate**
1. Write a program that saves a dictionary of student marks to a JSON file, then reads it back and prints it.
2. Create a CSV file of 5 products with name and price, then read and print it using `csv.DictReader`.
3. Write a program that copies the content of one text file into another.
4. Write a program that counts how many times a specific word appears in a text file.
5. Write a program that creates a folder if it doesn't already exist, and saves a file inside it.

**Challenge**
1. Build a simple note-taking app that lets users add, view, and delete notes stored in a text file.
2. Write a program that reads a CSV file of sales data and calculates the total and average sale amount.
3. Extend the Student Record Management mini project to support searching for a student by roll number and updating their marks.
$yy18$, 'markdown',
  jsonb_build_object('source', 'python_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'python_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Exception Handling
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = 'functions-files-oop'),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $yy19$Exception Handling$yy19$, $yy20$exception-handling$yy20$, $yy21$Handling runtime errors gracefully with try/except/else/finally, catching multiple exception types, raising exceptions deliberately with raise, and defining custom exception classes.$yy21$, 9,
    'published', true, true, 'python_tutorial', $yy22$functions-files-oop/exception-handling$yy22$
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
select up_topic.id, '', $yy23$No matter how carefully you write code, things go wrong at runtime — a user enters text instead of a number, a file doesn't exist, the internet connection drops. Exception handling is how Python lets your program deal with these problems gracefully, instead of crashing.

---

## 1. What are Errors and Exceptions?

### What is it?

- An **error** is a general term for anything that goes wrong in a program.
- An **exception** is a specific type of error that occurs *during* program execution (at runtime) — Python detects it and, if unhandled, stops the program and shows a traceback message.

> **Definition:** An exception is an event that disrupts the normal flow of a program's execution, usually caused by an invalid operation.

### Why do we use exception handling?

Without it, a single unexpected input (like text where a number was expected) would crash the entire program. Exception handling lets you **anticipate** possible problems and respond to them sensibly — showing a friendly message, retrying, or logging the issue — instead of the whole program stopping abruptly.

### Simple Example — An Unhandled Exception

```python
age = int(input("Enter your age: "))
print(f"You are {age} years old")
```

If the user types `"abc"` instead of a number:
```
ValueError: invalid literal for int() with base 10: 'abc'
```

The program crashes completely at this point — nothing after this line runs.

### Common Built-in Exception Types

| Exception | When it Occurs |
|---|---|
| `ValueError` | Invalid value for an operation (e.g., `int("abc")`) |
| `TypeError` | Wrong data type used in an operation |
| `ZeroDivisionError` | Dividing by zero |
| `FileNotFoundError` | Trying to open a file that doesn't exist |
| `KeyError` | Accessing a dictionary key that doesn't exist |
| `IndexError` | Accessing a list index that's out of range |
| `NameError` | Using a variable that hasn't been defined |
| `AttributeError` | Calling a method/attribute that doesn't exist on an object |

---

## 2. `try` and `except`

### What is it?

`try` lets you "attempt" a risky piece of code. If an exception occurs, Python jumps to the matching `except` block instead of crashing the whole program.

### Syntax

```python
try:
    # risky code
except ExceptionType:
    # code that runs if that exception occurs
```

### Simple Example

```python
try:
    age = int(input("Enter your age: "))
    print(f"You are {age} years old")
except ValueError:
    print("That's not a valid number. Please enter digits only.")
```

Sample Interaction:
```
Enter your age: abc
That's not a valid number. Please enter digits only.
```

### Explanation of the Code

- Python attempts everything inside `try`.
- If a `ValueError` occurs (like converting `"abc"` to `int`), Python immediately jumps to the matching `except ValueError:` block instead of crashing.
- The program continues running normally after the `except` block — it doesn't stop.

### Handling Multiple Exception Types

```python
try:
    num1 = int(input("Enter first number: "))
    num2 = int(input("Enter second number: "))
    print(num1 / num2)
except ValueError:
    print("Please enter valid numbers.")
except ZeroDivisionError:
    print("You cannot divide by zero.")
```

### Catching Any Exception (Use Sparingly)

```python
try:
    risky_operation()
except Exception as e:
    print("Something went wrong:", e)
```

**Explanation:** `except Exception as e` catches almost any error and stores its details in `e`. This is useful as a safety net, but catching **specific** exceptions (like `ValueError`, `ZeroDivisionError`) is better practice, since it doesn't accidentally hide unrelated bugs.

### Real-World Example

A banking app should never crash just because a user typed letters into an amount field — it should catch the error and ask them to re-enter a valid number.

### Common Mistakes

- Using a bare `except:` (with no exception type at all), which catches literally everything — including mistakes you'd actually want to notice, like typos in your own code. Always specify the exception type when possible.
- Wrapping too much code inside one `try` block, making it unclear exactly which line caused the problem.

### Important Points

- `try`/`except` prevents a single error from crashing the entire program.
- You can have multiple `except` blocks for different exception types.
- Catching specific exceptions is better practice than catching everything blindly.

### Practice

1. Write a program that asks the user for two numbers and divides them, handling both `ValueError` and `ZeroDivisionError`.

---

## 3. `else` with `try`

### What is it?

An optional `else` block that runs **only if no exception occurred** in the `try` block.

### Syntax

```python
try:
    # risky code
except ExceptionType:
    # runs if an exception occurred
else:
    # runs only if NO exception occurred
```

### Simple Example

```python
try:
    num = int(input("Enter a number: "))
except ValueError:
    print("Invalid input.")
else:
    print(f"You entered {num}, and it's a valid number!")
```

### Explanation

- The `else` block is a clean way to separate "the risky part" (inside `try`) from "what happens next, only on success" (inside `else`) — keeping the code that could fail isolated from the code that depends on it succeeding.

### Important Points

- `else` only runs if the `try` block completes with **no** exception.
- Helps keep code organized: risky logic in `try`, success-path logic in `else`.

---

## 4. `finally`

### What is it?

A `finally` block **always** runs — whether an exception occurred or not, and even if the exception wasn't caught at all. It's typically used for cleanup actions, like closing a file or a database connection.

### Syntax

```python
try:
    # risky code
except ExceptionType:
    # handle exception
finally:
    # this ALWAYS runs, no matter what
```

### Simple Example

```python
try:
    file = open("data.txt", "r")
    content = file.read()
    print(content)
except FileNotFoundError:
    print("File not found.")
finally:
    print("Attempted to read the file — cleanup complete.")
```

### Explanation

- Whether the file is found or not, the `finally` block always executes — this is why `finally` is the classic place to close files or database connections, ensuring cleanup happens no matter what.
- (In modern Python, `with open(...)` handles file closing automatically, but `finally` is still essential for other types of cleanup, like closing network connections.)

### Common Mistakes

- Assuming `finally` only runs on success — it actually runs in **every** case, including when an exception is raised and not even caught.

### Important Points

- `finally` always executes — success, failure, or even an uncaught exception.
- Commonly used for guaranteed cleanup: closing files, releasing resources, disconnecting from a database.

---

## Comparison Table — `try` / `except` / `else` / `finally`

| Block | Runs When |
|---|---|
| `try` | Always attempted first |
| `except` | Only if a matching exception occurs |
| `else` | Only if NO exception occurred |
| `finally` | ALWAYS — regardless of success or failure |

---

## 5. Raising Exceptions with `raise`

### What is it?

`raise` lets you deliberately trigger an exception yourself — useful when your own code detects an invalid situation that should stop normal execution.

### Simple Example

```python
def withdraw(balance, amount):
    if amount > balance:
        raise ValueError("Insufficient balance for this withdrawal")
    return balance - amount

try:
    new_balance = withdraw(1000, 1500)
except ValueError as e:
    print("Error:", e)
```

Output:
```
Error: Insufficient balance for this withdrawal
```

### Explanation of the Code

- Instead of letting the program continue with an invalid state (a negative balance), `raise` deliberately stops execution of the `withdraw()` function and hands control to the nearest matching `except`.
- The custom message `"Insufficient balance for this withdrawal"` explains exactly what went wrong, which is far more helpful than a generic crash.

### Real-World Example

A form validation function might `raise` a `ValueError` if a required field is empty, or if an age entered is negative — deliberately flagging a problem the program itself knows to check for.

### Important Points

- `raise` can be used with any built-in exception type, or a custom one (see below).
- Raising exceptions with clear messages makes debugging far easier.

### Practice

1. Write a function `set_age(age)` that raises a `ValueError` if age is negative, and test it with a `try`/`except`.

---

## 6. Custom Exceptions

### What is it?

You can define your own exception types by creating a class that inherits from Python's built-in `Exception` class — useful when built-in exceptions don't clearly describe your specific problem.

### Simple Example

```python
class InsufficientBalanceError(Exception):
    pass

def withdraw(balance, amount):
    if amount > balance:
        raise InsufficientBalanceError("Withdrawal amount exceeds available balance")
    return balance - amount

try:
    withdraw(1000, 1500)
except InsufficientBalanceError as e:
    print("Transaction failed:", e)
```

Output:
```
Transaction failed: Withdrawal amount exceeds available balance
```

### Explanation of the Code

- `class InsufficientBalanceError(Exception):` creates a brand-new exception type, specific to this application's needs.
- `pass` means the class doesn't need any extra code — it inherits everything it needs from `Exception`.
- This custom exception can now be raised and caught just like any built-in one, but its name makes the actual problem immediately clear to anyone reading the code.

### Real-World Example

Large applications commonly define custom exceptions like `InvalidLoginError`, `OutOfStockError`, or `PaymentDeclinedError` — these communicate the exact business problem far more clearly than a generic `ValueError` would.

### Common Mistakes

- Forgetting to inherit from `Exception` (or one of its subclasses) when creating a custom exception class.
- Creating overly specific custom exceptions for situations a built-in exception already covers well.

### Important Points

- Custom exceptions must inherit from `Exception` (directly or indirectly).
- They make error handling far more readable and meaningful in larger applications.

### Practice

1. Create a custom exception `NegativeValueError` and use it in a function that calculates the square root of a number, raising the exception if the number is negative.

---

## Common Beginner Mistakes — Summary for This Section

- Using a bare `except:` that catches everything, hiding real bugs.
- Wrapping too much code in one `try` block, making it hard to know what actually failed.
- Forgetting that `finally` always runs, even after an exception.
- Not providing a clear message when raising an exception.

---

## Cheat Sheet — Exception Handling

```python
try:
    risky_code()
except ValueError:
    handle_value_error()
except (TypeError, KeyError) as e:
    handle_multiple_types(e)
except Exception as e:
    handle_anything_else(e)
else:
    only_runs_if_no_exception()
finally:
    always_runs()

raise ValueError("custom message")

class MyCustomError(Exception):
    pass
```

---

## Interview Questions

**Q1. What is the difference between an error and an exception?**
Answer: "Error" is a general term for anything going wrong. An exception is specifically a runtime event Python detects and can be caught and handled using `try`/`except`, preventing a crash.

**Q2. What is the purpose of the `finally` block?**
Answer: Code inside `finally` always runs, regardless of whether an exception occurred or was handled — typically used for guaranteed cleanup actions like closing files or connections.

**Q3. When does the `else` block (paired with `try`) execute?**
Answer: Only when the `try` block completes successfully with no exception raised.

**Q4. Why is using a bare `except:` considered bad practice?**
Answer: It catches every possible exception, including ones you didn't anticipate, which can hide genuine bugs and make debugging much harder. Catching specific exception types is safer and clearer.

**Q5. How do you create a custom exception in Python?**
Answer: By defining a class that inherits from `Exception` (or one of its subclasses), then using `raise` to trigger it when needed.

**Q6. What exception is raised when dividing a number by zero?**
Answer: `ZeroDivisionError`.

---

## Practice Questions

**Beginner**
1. Write a program that asks for a number and handles the case where the user enters non-numeric text.
2. Write a program that divides two numbers and handles division by zero.
3. Write a program that tries to open a file that may not exist, and prints a friendly message if it isn't found.
4. Write a program that accesses a dictionary key that might not exist, using `try`/`except` instead of `.get()`.
5. Write a program with a `finally` block that always prints "Program finished" no matter what.

**Intermediate**
1. Write a function that raises a `ValueError` if a given age is negative, and handle it in a `try`/`except` block.
2. Write a program that handles multiple exception types (`ValueError`, `ZeroDivisionError`, `IndexError`) separately with different messages.
3. Create a custom exception `InvalidAgeError` and use it to validate a user's age input.
4. Write a program that keeps asking the user for a valid number until they provide one, using a loop combined with `try`/`except`.
5. Write a function that reads a file and raises a custom `EmptyFileError` if the file exists but is empty.

**Challenge**
1. Build a simple calculator that handles invalid input, division by zero, and invalid operators, each with a clear, specific error message.
2. Create a custom exception hierarchy: a base `AppError` exception, with two subclasses `ValidationError` and `AuthenticationError`, and demonstrate catching each specifically as well as catching the base type generically.
3. Write a program that validates a list of user-submitted ages, collecting all invalid ones into an error report instead of stopping at the first invalid value.
$yy23$, 'markdown',
  jsonb_build_object('source', 'python_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'python_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Object-Oriented Programming
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = 'functions-files-oop'),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $yy24$Object-Oriented Programming$yy24$, $yy25$oop$yy25$, $yy26$Classes and objects, the constructor and self, instance vs class variables, instance/class/static methods, encapsulation, all four types of inheritance, polymorphism and method overriding, abstraction with ABC, and magic methods.$yy26$, 10,
    'published', true, true, 'python_tutorial', $yy27$functions-files-oop/oop$yy27$
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
select up_topic.id, '', $yy28$Everything you've learned so far — variables, functions, data structures — works great for small programs. But as applications grow larger (think: a banking system, an e-commerce platform, a hospital management system), you need a way to model real-world things — like a "Student," a "Bank Account," or a "Product" — as organized units that bundle together their data and behavior. That's exactly what Object-Oriented Programming (OOP) is for.

This is one of the most important topics in this entire course — take your time with it.

---

## 1. What is Object-Oriented Programming?

### What is it?

OOP is a programming style built around **objects** — units that combine data (attributes) and behavior (methods) together, modeled after real-world things.

> **Definition:** Object-Oriented Programming is a programming paradigm that organizes code around objects, which bundle data (attributes) and behavior (methods) together.

### Why do we use it?

- **Real-world modeling** — a "Student" object naturally has a name, age, and marks (data), and behaviors like `calculate_average()` (methods).
- **Reusability** — define a "template" (class) once, create as many objects from it as needed.
- **Organization** — large applications become far easier to manage when related data and logic are grouped together.
- **Scalability** — most professional, large-scale software (web frameworks, games, enterprise systems) is built using OOP principles.

### How does it work?

OOP revolves around two core ideas:
- A **class** is a blueprint/template that defines what data and behavior objects of that type will have.
- An **object** is a specific instance created from that class, with its own actual data.

Think of a class like a cookie cutter, and objects like the individual cookies made using it — same shape (structure), different actual cookies (data).

---

## 2. Classes and Objects

### Syntax

```python
class ClassName:
    def __init__(self, parameters):
        self.attribute = value

    def method_name(self):
        # method body
```

### Simple Example — A Student Class

```python
class Student:
    def __init__(self, name, age, course):
        self.name = name
        self.age = age
        self.course = course

    def display_info(self):
        print(f"{self.name}, Age {self.age}, studying {self.course}")

# Creating objects (instances) from the class
student1 = Student("Aditi", 21, "Computer Science")
student2 = Student("Rohan", 22, "Data Science")

student1.display_info()
student2.display_info()
```

Output:
```
Aditi, Age 21, studying Computer Science
Rohan, Age 22, studying Data Science
```

### Explanation of the Code

- `class Student:` defines the blueprint.
- `__init__` is a special method (called the **constructor**) that runs automatically whenever a new object is created — it sets up the object's initial data.
- `self` refers to the specific object being created or used — it's how Python knows *which* student's name/age/course you're talking about.
- `student1` and `student2` are two separate **objects**, each with their own independent data, even though both come from the same `Student` class.

### Real-World Example

An e-commerce app might have a `Product` class, with each individual product (a specific shirt, a specific phone) as an object created from that class, each holding its own name, price, and stock quantity.

### Common Mistakes

- Forgetting `self` as the first parameter in every method inside a class.
- Forgetting parentheses when creating an object: `student1 = Student` (this just refers to the class itself, not a new object).
- Confusing the class (blueprint) with an object (an actual instance made from it).

### Important Points

- A class is a blueprint; an object is an actual instance created from it.
- You can create as many objects as you want from a single class, each with independent data.
- Class names conventionally use `PascalCase` (e.g., `Student`, `BankAccount`), while objects/variables use `snake_case`.

### Practice

1. Create a `Book` class with `title`, `author`, and `price` attributes, and a method to display the book's details. Create two book objects and display both.

---

## 3. The Constructor (`__init__`) and `self`

### What is it?

`__init__` is a special method that runs automatically the moment a new object is created — it's where you set up the object's initial attribute values. `self` represents the specific object currently being worked with.

### Why do we use it?

Without a constructor, you'd have to manually set every attribute after creating each object, one line at a time. The constructor does this setup automatically and consistently, every time.

### Simple Example

```python
class Employee:
    def __init__(self, name, salary):
        self.name = name
        self.salary = salary

emp1 = Employee("Zara", 50000)
print(emp1.name, emp1.salary)   # Zara 50000
```

### Explanation

- The moment `Employee("Zara", 50000)` runs, Python automatically calls `__init__(self, "Zara", 50000)` behind the scenes.
- `self.name = name` stores the passed-in value as an attribute **on that specific object** — this is why `emp1.name` gives back `"Zara"`.

### Why `self` Matters

```python
emp1 = Employee("Zara", 50000)
emp2 = Employee("Karan", 60000)

print(emp1.name)   # Zara
print(emp2.name)   # Karan
```

`self` ensures that even though both objects were created from the same `Employee` class, each keeps its own independent data — changing `emp1.salary` never affects `emp2.salary`.

### Common Mistakes

- Forgetting to include `self` as the first parameter of `__init__` (and every instance method) — this causes a `TypeError`.
- Forgetting the `self.` prefix when setting an attribute, e.g. writing `name = name` instead of `self.name = name` — this creates a local variable that disappears immediately instead of actually storing data on the object.

### Important Points

- `__init__` runs automatically when an object is created — you never call it directly.
- `self` must be the first parameter of every regular (instance) method, though Python passes it automatically — you never pass it explicitly when calling the method.

---

## 4. Instance Variables vs Class Variables

### What is it?

- An **instance variable** belongs to a specific object — each object has its own separate copy.
- A **class variable** is shared by **all** objects created from that class — there's only one copy, shared across every instance.

### Simple Example

```python
class Employee:
    company_name = "TechCorp"   # class variable - shared by ALL employees

    def __init__(self, name, salary):
        self.name = name         # instance variable - unique per employee
        self.salary = salary     # instance variable - unique per employee

emp1 = Employee("Zara", 50000)
emp2 = Employee("Karan", 60000)

print(emp1.company_name)   # TechCorp
print(emp2.company_name)   # TechCorp

print(emp1.name, emp2.name)   # Zara Karan (different, as expected)
```

### Explanation

- `company_name` is defined directly inside the class (not inside `__init__`), so it belongs to the class itself, shared identically by every employee object.
- `name` and `salary` are set inside `__init__` using `self.`, making them unique per object.

### Real-World Example

A company name, tax rate, or interest rate might reasonably be a class variable (the same for every object of that type), while a specific employee's name or a specific account's balance must be an instance variable (unique per object).

### Common Mistakes

- Modifying a class variable through an instance in a way that accidentally creates a new instance variable instead of updating the shared value: `emp1.company_name = "NewCorp"` creates an **instance-level** override just for `emp1`, it does not change the class variable for everyone.

### Important Points

- Class variables are defined directly inside the class body, outside any method.
- Instance variables are typically defined inside `__init__` using `self.`.
- Changing a class variable properly should be done via `ClassName.variable = new_value`, not through an individual instance.

### Practice

1. Create a `Car` class with a class variable `wheels = 4` and instance variables `brand` and `model`. Create two car objects and print both their shared wheel count and their individual brands.

---

## 5. Instance Methods, Class Methods, and Static Methods

### What is it?

Python supports three kinds of methods inside a class, each with a different purpose:

- **Instance methods** — the normal kind, operate on a specific object's data (use `self`).
- **Class methods** — operate on the class itself, not a specific object (use `cls`, marked with `@classmethod`).
- **Static methods** — don't need access to the object or the class at all; they're just related, grouped logically inside the class (marked with `@staticmethod`).

### Simple Example

```python
class Employee:
    company_name = "TechCorp"

    def __init__(self, name, salary):
        self.name = name
        self.salary = salary

    def give_raise(self, amount):        # instance method
        self.salary += amount

    @classmethod
    def change_company_name(cls, new_name):   # class method
        cls.company_name = new_name

    @staticmethod
    def is_valid_salary(salary):          # static method
        return salary > 0

emp1 = Employee("Zara", 50000)
emp1.give_raise(5000)
print(emp1.salary)   # 55000

Employee.change_company_name("NewTechCorp")
print(emp1.company_name)   # NewTechCorp

print(Employee.is_valid_salary(-500))   # False
```

### Explanation of the Code

- `give_raise()` is an instance method — it modifies `self.salary`, meaning it works on **one specific employee**.
- `change_company_name()` is a class method — it modifies `cls.company_name`, affecting the shared class variable for **all** employees at once.
- `is_valid_salary()` is a static method — it doesn't need `self` or `cls` at all; it's just a related utility function that logically belongs with the `Employee` class.

### Comparison Table — Instance vs Class vs Static Methods

| | Instance Method | Class Method | Static Method |
|---|---|---|---|
| First parameter | `self` | `cls` | none (no automatic first param) |
| Decorator | (none) | `@classmethod` | `@staticmethod` |
| Operates on | A specific object's data | The class itself (shared data) | Neither — standalone logic |
| Called via | `object.method()` | `Class.method()` or `object.method()` | `Class.method()` or `object.method()` |

### Common Mistakes

- Forgetting the `@classmethod` or `@staticmethod` decorator, which changes how Python passes arguments to the method — a very common source of confusing errors.
- Using `self` inside a method meant to be a class method or static method.

### Important Points

- Use instance methods for anything that needs a specific object's data.
- Use class methods when you need to affect or read data shared by the whole class.
- Use static methods for utility/helper functions that logically belong to the class but don't need object or class data.

### Practice

1. Add a class method to the `Employee` example that creates a new employee from a string like `"Zara-50000"` (splitting on the hyphen).

---

## 6. Encapsulation

### What is it?

Encapsulation means bundling data and the methods that operate on it together, while restricting direct outside access to some of that data — protecting an object's internal state from accidental or unauthorized changes.

> **Definition:** Encapsulation is the practice of keeping an object's internal data protected, and only allowing controlled access through methods.

### Access Levels in Python (By Convention)

Python doesn't enforce strict access control like some languages, but follows naming conventions:

| Prefix | Meaning | Example |
|---|---|---|
| No underscore | Public — accessible from anywhere | `self.name` |
| Single underscore `_` | Protected — internal use, but still accessible (a convention, not enforced) | `self._balance` |
| Double underscore `__` | Private — Python "name-mangles" it to discourage direct outside access | `self.__pin` |

### Simple Example

```python
class BankAccount:
    def __init__(self, owner, balance):
        self.owner = owner            # public
        self.__balance = balance      # private

    def deposit(self, amount):
        if amount > 0:
            self.__balance += amount

    def get_balance(self):
        return self.__balance

account = BankAccount("Aditi", 1000)
account.deposit(500)
print(account.get_balance())   # 1500

# print(account.__balance)     # AttributeError - can't access directly from outside
```

### Explanation of the Code

- `self.__balance` is a private attribute — Python internally renames it (`_BankAccount__balance`) to discourage direct outside access.
- Instead of letting outside code set `balance` directly (which could allow invalid negative values), the class only allows controlled access through `deposit()` and `get_balance()`.

### Real-World Example

A bank account should never let external code set `balance = -5000` directly — all changes must go through controlled methods like `deposit()` and `withdraw()`, which can enforce rules (e.g., "amount must be positive").

### Common Mistakes

- Assuming double-underscore attributes are truly impossible to access from outside — they're just strongly discouraged and renamed, not fully unbreakable.
- Making everything private "for safety," even data that genuinely needs to be freely accessible — encapsulation should be applied thoughtfully, not everywhere.

### Important Points

- Encapsulation protects internal data from unintended, invalid changes.
- Python relies on naming conventions (`_`, `__`) rather than strict enforcement.
- The `property` decorator (introduced later in Intermediate Python) offers an even cleaner way to control attribute access.

### Practice

1. Create a `BankAccount` class with a private `__balance` attribute, and methods `deposit()`, `withdraw()` (which should refuse to withdraw more than the balance), and `get_balance()`.

---

## 7. Inheritance

### What is it?

Inheritance lets one class (the **child**/subclass) reuse and extend the attributes and methods of another class (the **parent**/superclass) — modeling natural "is-a" relationships, like "a Car **is a** Vehicle."

> **Definition:** Inheritance allows a class to acquire the properties and methods of another class, promoting code reuse.

### 7.1 Single Inheritance

```python
class Vehicle:
    def __init__(self, brand):
        self.brand = brand

    def start(self):
        print(f"{self.brand} vehicle is starting")

class Car(Vehicle):        # Car inherits from Vehicle
    def __init__(self, brand, model):
        super().__init__(brand)   # calls Vehicle's constructor
        self.model = model

    def display_info(self):
        print(f"{self.brand} {self.model}")

car = Car("Toyota", "Corolla")
car.start()          # inherited from Vehicle
car.display_info()   # defined in Car
```

Output:
```
Toyota vehicle is starting
Toyota Corolla
```

### Explanation of the Code

- `class Car(Vehicle):` means `Car` **inherits** everything from `Vehicle`.
- `super().__init__(brand)` calls the parent class's constructor, so `Car` doesn't need to repeat the logic for setting `self.brand` — it reuses `Vehicle`'s existing setup.
- `car.start()` works even though `start()` is only defined in `Vehicle` — this is inheritance in action.

### 7.2 Multilevel Inheritance

A chain: grandparent → parent → child.

```python
class Vehicle:
    def start(self):
        print("Vehicle starting")

class Car(Vehicle):
    def drive(self):
        print("Car is driving")

class SportsCar(Car):
    def turbo_boost(self):
        print("Turbo boost activated!")

my_car = SportsCar()
my_car.start()          # from Vehicle
my_car.drive()          # from Car
my_car.turbo_boost()    # from SportsCar
```

### 7.3 Hierarchical Inheritance

Multiple child classes inherit from the **same** parent class.

```python
class Vehicle:
    def start(self):
        print("Vehicle starting")

class Car(Vehicle):
    pass

class Motorcycle(Vehicle):
    pass

car = Car()
bike = Motorcycle()
car.start()    # Vehicle starting
bike.start()   # Vehicle starting
```

### 7.4 Multiple Inheritance

A single child class inherits from **more than one** parent class.

```python
class Flyable:
    def fly(self):
        print("Flying")

class Swimmable:
    def swim(self):
        print("Swimming")

class FlyingBoat(Flyable, Swimmable):
    pass

vehicle = FlyingBoat()
vehicle.fly()    # Flying
vehicle.swim()   # Swimming
```

### Comparison Table — Types of Inheritance

| Type | Structure | Example |
|---|---|---|
| Single | One parent, one child | `Vehicle` → `Car` |
| Multilevel | Chain of inheritance | `Vehicle` → `Car` → `SportsCar` |
| Hierarchical | One parent, multiple children | `Vehicle` → `Car`, `Vehicle` → `Motorcycle` |
| Multiple | One child, multiple parents | `FlyingBoat` → `Flyable`, `Swimmable` |

### Common Mistakes

- Forgetting to call `super().__init__(...)` in the child's constructor, which means the parent's setup logic never runs.
- Overusing multiple inheritance, which can make code harder to trace — Python resolves conflicts using something called the Method Resolution Order (MRO), which can get confusing if overused.

### Important Points

- `super()` gives access to the parent class's methods, most commonly its constructor.
- A child class automatically has access to everything in its parent, and can also override or add new behavior.

### Practice

1. Create a `Person` class with `name` and `age`, then a `Student` class that inherits from it and adds a `course` attribute.
2. Create a `Bird` class with a `fly()` method, and two child classes `Sparrow` and `Penguin` — override `fly()` in `Penguin` to print "Penguins can't fly" instead.

---

## 8. Polymorphism and Method Overriding

### What is it?

Polymorphism means "many forms" — the same method name can behave differently depending on the object calling it. **Method overriding** is the most common way this happens: a child class redefines a method it inherited from its parent.

> **Definition:** Polymorphism allows objects of different classes to be treated through a common interface, with each class providing its own specific behavior for shared method names.

### Simple Example — Method Overriding

```python
class Employee:
    def calculate_bonus(self):
        return 1000

class Manager(Employee):
    def calculate_bonus(self):   # overrides the parent's version
        return 5000

employees = [Employee(), Manager(), Employee()]

for emp in employees:
    print(emp.calculate_bonus())
```

Output:
```
1000
5000
1000
```

### Explanation of the Code

- Both `Employee` and `Manager` have a method called `calculate_bonus()`, but `Manager` provides its **own** version, which overrides the parent's.
- The `for` loop calls `.calculate_bonus()` on each object without needing to know or check what specific type each one is — Python automatically runs the correct version for each object. This is polymorphism in action.

### Real-World Example

An e-commerce app might have a base `Product` class with a `calculate_shipping_cost()` method, overridden differently by `DigitalProduct` (free/no shipping) versus `PhysicalProduct` (calculated based on weight).

### Common Mistakes

- Confusing method overriding (redefining an inherited method) with overloading (defining a method multiple times with different parameters — which Python doesn't directly support the way some other languages do).

### Important Points

- Method overriding lets a child class provide its own version of an inherited method.
- Polymorphism lets you write code that works generically across different object types, as long as they share the relevant method name.

### Practice

1. Create a base class `Shape` with a method `area()` returning `0`, and child classes `Circle` and `Rectangle` that override `area()` with the correct formulas.

---

## 9. Abstraction and Abstract Classes

### What is it?

Abstraction means hiding complex internal implementation details and only exposing what's necessary — focusing on **what** something does, not **how**. In Python, this is often achieved using **abstract classes**, which define methods that must be implemented by any child class, without providing the actual implementation themselves.

### Simple Example — Using the `abc` Module

```python
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self):
        pass   # no implementation here - child classes MUST provide one

class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return 3.14159 * self.radius ** 2

class Rectangle(Shape):
    def __init__(self, length, width):
        self.length = length
        self.width = width

    def area(self):
        return self.length * self.width

circle = Circle(5)
rectangle = Rectangle(4, 6)

print(circle.area())      # 78.53975
print(rectangle.area())   # 24
```

### Explanation of the Code

- `Shape(ABC)` marks `Shape` as an **abstract base class** — it cannot be instantiated directly: `Shape()` would raise a `TypeError`.
- `@abstractmethod` forces any child class (`Circle`, `Rectangle`) to provide its own `area()` method — if a child class forgets to implement it, Python raises an error when trying to create an object from that child class.
- This guarantees a consistent interface: every `Shape` subclass is guaranteed to have a working `area()` method, even though each calculates it completely differently.

### Real-World Example

A payment processing system might define an abstract `PaymentMethod` class with an abstract `process_payment()` method, ensuring every specific payment type (`CreditCard`, `PayPal`, `BankTransfer`) implements its own version, while the rest of the application can call `.process_payment()` generically on any of them.

### Common Mistakes

- Trying to create an object directly from an abstract class: `Shape()` → `TypeError: Can't instantiate abstract class`.
- Forgetting to implement an abstract method in a child class, which also raises an error at instantiation time.

### Important Points

- Abstract classes cannot be instantiated directly — they exist to be inherited from.
- `@abstractmethod` forces child classes to implement specific methods, guaranteeing a consistent interface across all subclasses.
- Requires importing `ABC` and `abstractmethod` from the built-in `abc` module.

### Practice

1. Create an abstract class `PaymentMethod` with an abstract method `process_payment(amount)`, then implement `CreditCardPayment` and `UPIPayment` subclasses.

---

## 10. Magic Methods (Dunder Methods)

### What is it?

Magic methods (also called "dunder" methods, short for "double underscore") are special methods surrounded by double underscores (like `__init__`) that let your custom classes work naturally with Python's built-in syntax — like `print()`, `+`, `==`, and `len()`.

### Common Magic Methods

| Method | Purpose | Triggered By |
|---|---|---|
| `__init__` | Constructor | Creating a new object |
| `__str__` | Human-readable string representation | `print(obj)`, `str(obj)` |
| `__repr__` | Developer-facing representation | Typing the object name in a shell, debugging |
| `__len__` | Defines behavior for `len()` | `len(obj)` |
| `__eq__` | Defines behavior for `==` | `obj1 == obj2` |
| `__add__` | Defines behavior for `+` | `obj1 + obj2` |

### Simple Example

```python
class Product:
    def __init__(self, name, price):
        self.name = name
        self.price = price

    def __str__(self):
        return f"{self.name} - Rs.{self.price}"

    def __eq__(self, other):
        return self.price == other.price

    def __add__(self, other):
        return self.price + other.price

item1 = Product("Shirt", 500)
item2 = Product("Cap", 200)

print(item1)              # Shirt - Rs.500  (uses __str__ automatically)
print(item1 == item2)     # False           (uses __eq__)
print(item1 + item2)      # 700              (uses __add__)
```

### Explanation of the Code

- Without `__str__`, `print(item1)` would show something unhelpful like `<__main__.Product object at 0x...>`. Defining `__str__` makes it print something meaningful instead.
- `__eq__` lets you customize what `==` actually means for your objects — here, two products are "equal" if their prices match, regardless of name.
- `__add__` lets the `+` operator work between two `Product` objects, even though Python has no built-in idea of what "adding two products" should mean — you define it yourself.

### Real-World Example

Nearly every well-designed class in real applications defines at least `__str__` (or `__repr__`) so that printing or debugging objects gives useful, readable output instead of a generic memory address.

### Common Mistakes

- Forgetting that without `__str__`/`__repr__`, printing an object gives an unhelpful default representation.
- Defining `__eq__` without considering what happens if `other` isn't even the same type — real-world code often adds type checks inside `__eq__` for safety.

### Important Points

- Magic methods let custom objects integrate naturally with Python's built-in operators and functions.
- `__str__` is for readable, user-facing output; `__repr__` is more for developers/debugging.

### Practice

1. Add a `__len__` method to a `Cart` class (holding a list of items) so that `len(cart)` returns the number of items in it.

---

## Common Beginner Mistakes — Summary for This Section

- Forgetting `self` as the first parameter of instance methods.
- Confusing instance variables with class variables.
- Forgetting `super().__init__()` in a child class's constructor.
- Trying to instantiate an abstract class directly.
- Forgetting to define `__str__`, resulting in unhelpful printed output for custom objects.

---

## Cheat Sheet — OOP

```python
class Animal:                       # class definition
    species_count = 0                # class variable

    def __init__(self, name):        # constructor
        self.name = name              # instance variable
        Animal.species_count += 1

    def speak(self):                  # instance method
        print(f"{self.name} makes a sound")

    @classmethod
    def get_count(cls):                # class method
        return cls.species_count

    @staticmethod
    def is_valid_name(name):           # static method
        return len(name) > 0

class Dog(Animal):                   # inheritance
    def speak(self):                   # method overriding (polymorphism)
        print(f"{self.name} barks")

from abc import ABC, abstractmethod
class Shape(ABC):                     # abstraction
    @abstractmethod
    def area(self):
        pass
```

---

## Mini Project: Bank Account Management System

### Objective

Build a simple banking system using classes, demonstrating encapsulation, inheritance, and method overriding — a savings account and a current account, each with slightly different rules.

### Requirements

- A base `Account` class with deposit, withdraw, and balance-check functionality.
- Balance must be kept private (encapsulated).
- A `SavingsAccount` subclass that adds interest.
- A `CurrentAccount` subclass that allows a small overdraft.

### Concepts Used

Classes, objects, constructors, encapsulation, inheritance, method overriding, magic methods.

### Complete Code

```python
class Account:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self._balance = balance   # protected: subclasses can still access it

    def deposit(self, amount):
        if amount <= 0:
            print("Deposit amount must be positive.")
            return
        self._balance += amount
        print(f"Deposited Rs.{amount}. New balance: Rs.{self._balance}")

    def withdraw(self, amount):
        if amount > self._balance:
            print("Insufficient balance.")
            return
        self._balance -= amount
        print(f"Withdrew Rs.{amount}. New balance: Rs.{self._balance}")

    def get_balance(self):
        return self._balance

    def __str__(self):
        return f"{self.owner}'s Account - Balance: Rs.{self._balance}"


class SavingsAccount(Account):
    def __init__(self, owner, balance=0, interest_rate=0.05):
        super().__init__(owner, balance)
        self.interest_rate = interest_rate

    def add_interest(self):
        interest = self._balance * self.interest_rate
        self._balance += interest
        print(f"Interest added: Rs.{interest:.2f}. New balance: Rs.{self._balance:.2f}")


class CurrentAccount(Account):
    def __init__(self, owner, balance=0, overdraft_limit=5000):
        super().__init__(owner, balance)
        self.overdraft_limit = overdraft_limit

    def withdraw(self, amount):   # overriding to allow overdraft
        if amount > self._balance + self.overdraft_limit:
            print("Withdrawal exceeds overdraft limit.")
            return
        self._balance -= amount
        print(f"Withdrew Rs.{amount}. New balance: Rs.{self._balance}")


savings = SavingsAccount("Aditi", 10000)
savings.add_interest()
savings.withdraw(2000)

current = CurrentAccount("Rohan", 1000, overdraft_limit=3000)
current.withdraw(3500)   # allowed due to overdraft
print(current)
```

### Code Explanation

- `Account` handles the shared logic — deposit, basic withdrawal, and balance checking — while keeping `_balance` protected.
- `SavingsAccount` extends `Account` with an `add_interest()` method, unique to savings accounts.
- `CurrentAccount` **overrides** `withdraw()` entirely, since its withdrawal rule (allowing overdraft) is fundamentally different from the base class's rule.
- `__str__` gives every account type (inherited from `Account`) a clean, readable printed format automatically.

### Sample Output

```
Interest added: Rs.500.00. New balance: Rs.10500.00
Withdrew Rs.2000. New balance: Rs.8500.00
Withdrew Rs.3500. New balance: Rs.-2500
Rohan's Account - Balance: Rs.-2500
```

### Possible Improvements

- Add a transaction history list that records every deposit/withdrawal with a timestamp.
- Add a custom exception (from the Exception Handling file) instead of just printing error messages.
- Add a `transfer()` method that moves money between two account objects.

### Challenge Task

Add a `FixedDepositAccount` subclass that doesn't allow withdrawals at all until a certain "maturity" condition (e.g., a boolean flag) is met.

---

## Interview Questions

**Q1. What is the difference between a class and an object?**
Answer: A class is a blueprint defining attributes and behavior; an object is a specific instance created from that class, holding its own actual data.

**Q2. What is the purpose of `self` in Python classes?**
Answer: `self` refers to the specific object a method is being called on, allowing the method to access and modify that particular object's own attributes.

**Q3. What is the difference between instance variables and class variables?**
Answer: Instance variables are unique to each object (usually set in `__init__` using `self.`); class variables are shared by every object of that class, defined directly in the class body.

**Q4. What is the difference between a class method and a static method?**
Answer: A class method (marked `@classmethod`) receives the class itself (`cls`) and can access/modify class-level data. A static method (marked `@staticmethod`) receives neither `self` nor `cls` — it's just a related utility function grouped inside the class.

**Q5. What is encapsulation, and how does Python implement it?**
Answer: Encapsulation is bundling data with the methods that operate on it, while restricting direct outside access. Python uses naming conventions — a single underscore (`_var`) signals "protected" (internal use), and a double underscore (`__var`) triggers name-mangling to discourage direct outside access.

**Q6. What is the difference between method overriding and polymorphism?**
Answer: Method overriding is when a child class redefines a method inherited from its parent. Polymorphism is the broader concept — being able to call the same method name on different objects and get behavior appropriate to each object's actual class.

**Q7. What is an abstract class, and why would you use one?**
Answer: An abstract class (built using `ABC` and `@abstractmethod`) cannot be instantiated directly and forces any subclass to implement specific methods, guaranteeing a consistent interface across all subclasses.

**Q8. What is `__init__` vs `__str__`?**
Answer: `__init__` is the constructor, called automatically when creating a new object, used to set initial attribute values. `__str__` defines what `print()` or `str()` shows for that object — a human-readable representation.

**Q9. What is the difference between single, multiple, multilevel, and hierarchical inheritance?**
Answer: Single: one parent, one child. Multiple: one child inherits from more than one parent. Multilevel: a chain (parent → child → grandchild). Hierarchical: multiple children inherit from the same single parent.

---

## Practice Questions

**Beginner**
1. Create a `Person` class with `name` and `age` attributes and a method that prints a greeting.
2. Create a `Rectangle` class with `length` and `width`, and a method to calculate its area.
3. Create two objects from a `Car` class and print both their brand and model.
4. Add a class variable `bank_name = "ABC Bank"` to an `Account` class and access it from two different objects.
5. Add a `__str__` method to a `Book` class so printing a book object shows its title and author neatly.

**Intermediate**
1. Create a `Vehicle` base class and a `Car` subclass that inherits from it and adds its own attribute.
2. Create an `Employee` class and a `Manager` subclass that overrides a `calculate_bonus()` method.
3. Create a `BankAccount` class with a private `__balance` attribute and controlled `deposit()`/`withdraw()` methods.
4. Create an abstract `Shape` class with an abstract `area()` method, and implement it in `Circle` and `Square` subclasses.
5. Add `__eq__` to a `Product` class so two products are considered equal if their names and prices both match.

**Challenge**
1. Design a small `Library` system with a `Book` class and a `Member` class, where a `Member` can borrow and return books (tracked as a list of borrowed books on the member object).
2. Build a `Shape` hierarchy (`Shape` → `Circle`, `Rectangle`, `Triangle`) with an abstract `area()` and `perimeter()` method, and write a function that accepts any shape and prints both values (demonstrating polymorphism).
3. Extend the Bank Account Management mini project to add a `TransactionHistory` class that logs every deposit/withdrawal across all account types, and can print a full statement for any account.
$yy28$, 'markdown',
  jsonb_build_object('source', 'python_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'python_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- ===========================================================================
-- 4. MOCK TESTS + QUESTIONS — one 10-question, 10-minute test per topic.
-- ===========================================================================

-- Functions — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'functions-files-oop/functions')
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-py-functions', $yy29$Functions - Quick Test$yy29$, 'aptitude', 10, 10,
  $yy30$10 questions covering functions, parameters/arguments, return values, default/keyword arguments, *args/**kwargs, scope, lambdas, recursion and map/filter/reduce.$yy30$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $yy31$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$yy31$, true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-py-functions-1', 'pt-py-functions',
   $yy32$What does a function return if it has no explicit return statement?$yy32$,
   $yy33$["0", "An empty string", "None", "Error"]$yy33$::jsonb,
   2, $yy34$Without an explicit return, Python automatically returns None from the function.$yy34$, 1, 0),
  ('tq-py-functions-2', 'pt-py-functions',
   $yy35$What does *args collect arguments into?$yy35$,
   $yy36$["A dictionary", "A tuple", "A list", "A set"]$yy36$::jsonb,
   1, $yy37$*args gathers any extra positional arguments into a tuple inside the function.$yy37$, 1, 1),
  ('tq-py-functions-3', 'pt-py-functions',
   $yy38$What does **kwargs collect arguments into?$yy38$,
   $yy39$["A tuple", "A list", "A dictionary", "A set"]$yy39$::jsonb,
   2, $yy40$**kwargs gathers any extra keyword arguments into a dictionary, keyed by argument name.$yy40$, 1, 2),
  ('tq-py-functions-4', 'pt-py-functions',
   $yy41$Where must default parameters appear in a function definition?$yy41$,
   $yy42$["Before non-default parameters", "After all non-default parameters", "Anywhere", "They can't be used with *args"]$yy42$::jsonb,
   1, $yy43$Python requires every non-default parameter to appear before any default parameter in a function's definition, or it raises a SyntaxError.$yy43$, 1, 3),
  ('tq-py-functions-5', 'pt-py-functions',
   $yy44$What is a lambda function?$yy44$,
   $yy45$["A named multi-line function", "A small anonymous single-expression function", "A class method", "A built-in module"]$yy45$::jsonb,
   1, $yy46$A lambda is a compact, unnamed function limited to a single expression, whose result is returned automatically.$yy46$, 1, 4),
  ('tq-py-functions-6', 'pt-py-functions',
   $yy47$What keyword is required inside a function to modify a global variable?$yy47$,
   $yy48$["nonlocal", "global", "static", "No keyword needed"]$yy48$::jsonb,
   1, $yy49$Without the global keyword, assigning to a variable inside a function creates a new local variable instead of modifying the outer one.$yy49$, 1, 5),
  ('tq-py-functions-7', 'pt-py-functions',
   $yy50$What are the two essential parts of a recursive function?$yy50$,
   $yy51$["A loop and a condition", "A base case and a recursive case", "Two return statements", "A class and an object"]$yy51$::jsonb,
   1, $yy52$Every recursive function needs a base case to stop the recursion and a recursive case that moves the problem closer to that base case.$yy52$, 1, 6),
  ('tq-py-functions-8', 'pt-py-functions',
   $yy53$What does map(func, iterable) return (before converting to a list)?$yy53$,
   $yy54$["A list", "A tuple", "A map object (iterator)", "A dictionary"]$yy54$::jsonb,
   2, $yy55$map() returns a lazy iterator, not a list — you need to wrap it in list(...) to see the actual values.$yy55$, 1, 7),
  ('tq-py-functions-9', 'pt-py-functions',
   $yy56$Which module must be imported to use reduce()?$yy56$,
   $yy57$["itertools", "functools", "collections", "No import needed"]$yy57$::jsonb,
   1, $yy58$Unlike map() and filter(), reduce() is not a built-in function — it must be imported from the functools module.$yy58$, 1, 8),
  ('tq-py-functions-10', 'pt-py-functions',
   $yy59$What is the difference between a parameter and an argument?$yy59$,
   $yy60$["No difference", "A parameter is the value passed in; an argument is the placeholder name", "A parameter is the placeholder name in the definition; an argument is the actual value passed", "Parameters only exist in lambdas"]$yy60$::jsonb,
   2, $yy61$A parameter is the placeholder name written in the function's definition; an argument is the actual value supplied when the function is called.$yy61$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-py-functions' and question_count <> 10;

-- Modules & Packages — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'functions-files-oop/modules-and-packages')
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-py-modules-packages', $yy62$Modules & Packages - Quick Test$yy62$, 'aptitude', 10, 10,
  $yy63$10 questions covering modules, packages, imports, __name__ == "__main__", and the Python Standard Library.$yy63$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $yy64$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$yy64$, true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-py-modules-packages-1', 'pt-py-modules-packages',
   $yy65$What does __name__ equal when a file is run directly?$yy65$,
   $yy66$["The filename", "\"__main__\"", "None", "\"main\""]$yy66$::jsonb,
   1, $yy67$Python sets __name__ to "__main__" only when a file is executed directly, not when it's imported by another file.$yy67$, 1, 0),
  ('tq-py-modules-packages-2', 'pt-py-modules-packages',
   $yy68$What is the difference between a module and a package?$yy68$,
   $yy69$["No difference", "A module is a file; a package is a folder of modules", "A package is a file; a module is a folder", "Both are the same thing"]$yy69$::jsonb,
   1, $yy70$A module is a single .py file; a package is a folder containing multiple related modules.$yy70$, 1, 1),
  ('tq-py-modules-packages-3', 'pt-py-modules-packages',
   $yy71$What file marks a folder as a Python package?$yy71$,
   $yy72$["main.py", "__init__.py", "package.py", "setup.py"]$yy72$::jsonb,
   1, $yy73$__init__.py is the special file that marks a folder as a Python package so it can be imported.$yy73$, 1, 2),
  ('tq-py-modules-packages-4', 'pt-py-modules-packages',
   $yy74$Why is from module import * generally discouraged?$yy74$,
   $yy75$["It's slower", "It can cause naming conflicts and unclear origins", "It doesn't work in Python 3", "It only imports one function"]$yy75$::jsonb,
   1, $yy76$Importing everything with * can silently overwrite names from other imports and makes it unclear where a given name actually came from.$yy76$, 1, 3),
  ('tq-py-modules-packages-5', 'pt-py-modules-packages',
   $yy77$Which module provides randint() and choice()?$yy77$,
   $yy78$["math", "random", "os", "sys"]$yy78$::jsonb,
   1, $yy79$The random module provides randint() for random integers and choice() for picking a random item from a sequence.$yy79$, 1, 4),
  ('tq-py-modules-packages-6', 'pt-py-modules-packages',
   $yy80$Which module is used to work with JSON data?$yy80$,
   $yy81$["csv", "json", "os", "re"]$yy81$::jsonb,
   1, $yy82$The json module is Python's built-in tool for encoding and decoding JSON data.$yy82$, 1, 5),
  ('tq-py-modules-packages-7', 'pt-py-modules-packages',
   $yy83$What does os.getcwd() return?$yy83$,
   $yy84$["A random number", "The current working directory", "The Python version", "A list of files"]$yy84$::jsonb,
   1, $yy85$os.getcwd() returns the path of the current working directory the script is running from.$yy85$, 1, 6),
  ('tq-py-modules-packages-8', 'pt-py-modules-packages',
   $yy86$What does Counter (from collections) do?$yy86$,
   $yy87$["Sorts a list", "Counts occurrences of items", "Reverses a string", "Converts types"]$yy87$::jsonb,
   1, $yy88$Counter (from collections) counts how many times each item appears in an iterable.$yy88$, 1, 7),
  ('tq-py-modules-packages-9', 'pt-py-modules-packages',
   $yy89$What does import math as m do?$yy89$,
   $yy90$["Renames the math module permanently", "Imports math with an alias m for this file", "Causes an error", "Imports only part of math"]$yy90$::jsonb,
   1, $yy91$The as keyword creates a local alias for the imported module, valid only within the file that imports it.$yy91$, 1, 8),
  ('tq-py-modules-packages-10', 'pt-py-modules-packages',
   $yy92$What does @lru_cache (from functools) do?$yy92$,
   $yy93$["Deletes cached data", "Automatically caches a function's results to avoid recomputation", "Slows down a function", "Only works with strings"]$yy93$::jsonb,
   1, $yy94$@lru_cache automatically remembers a function's previous results, so repeated calls with the same arguments skip recomputation.$yy94$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-py-modules-packages' and question_count <> 10;

-- File Handling — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'functions-files-oop/file-handling')
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-py-file-handling', $yy95$File Handling - Quick Test$yy95$, 'aptitude', 10, 10,
  $yy96$10 questions covering open(), the with statement, reading/writing files, and CSV/JSON files.$yy96$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $yy97$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$yy97$, true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-py-file-handling-1', 'pt-py-file-handling',
   $yy98$Which file mode overwrites existing content?$yy98$,
   $yy99$["\"r\"", "\"a\"", "\"w\"", "\"x\""]$yy99$::jsonb,
   2, $yy100$"w" mode creates a new file or erases the existing content of one that already exists, before writing.$yy100$, 1, 0),
  ('tq-py-file-handling-2', 'pt-py-file-handling',
   $yy101$What is the advantage of with open(...) as f: over manual open()/close()?$yy101$,
   $yy102$["It's faster", "It automatically closes the file, even on error", "It reads binary files only", "There is no difference"]$yy102$::jsonb,
   1, $yy103$with open(...) as f: guarantees the file is closed automatically once the block ends, even if an error occurs inside it.$yy103$, 1, 1),
  ('tq-py-file-handling-3', 'pt-py-file-handling',
   $yy104$Which method reads all lines of a file into a list?$yy104$,
   $yy105$["read()", "readline()", "readlines()", "readall()"]$yy105$::jsonb,
   2, $yy106$readlines() reads the entire file and returns every line as a separate string inside a list.$yy106$, 1, 2),
  ('tq-py-file-handling-4', 'pt-py-file-handling',
   $yy107$What does "a" mode do?$yy107$,
   $yy108$["Overwrites the file", "Appends to the end of the file", "Deletes the file", "Reads the file"]$yy108$::jsonb,
   1, $yy109$"a" (append) mode adds new content to the end of the file without erasing what's already there.$yy109$, 1, 3),
  ('tq-py-file-handling-5', 'pt-py-file-handling',
   $yy110$Which module is used to read/write CSV files?$yy110$,
   $yy111$["json", "csv", "os", "re"]$yy111$::jsonb,
   1, $yy112$The csv module is Python's built-in tool for reading and writing comma-separated value files.$yy112$, 1, 4),
  ('tq-py-file-handling-6', 'pt-py-file-handling',
   $yy113$What is the difference between json.dump() and json.dumps()?$yy113$,
   $yy114$["No difference", "dump() writes to a file; dumps() converts to a string", "dumps() writes to a file; dump() converts to a string", "Both only work with lists"]$yy114$::jsonb,
   1, $yy115$dump() writes JSON data directly to an open file; dumps() converts data into a JSON-formatted string instead.$yy115$, 1, 5),
  ('tq-py-file-handling-7', 'pt-py-file-handling',
   $yy116$What error occurs when opening a non-existent file in read mode?$yy116$,
   $yy117$["ValueError", "FileNotFoundError", "TypeError", "KeyError"]$yy117$::jsonb,
   1, $yy118$Trying to open a file that doesn't exist in read mode raises a FileNotFoundError.$yy118$, 1, 6),
  ('tq-py-file-handling-8', 'pt-py-file-handling',
   $yy119$What does csv.DictReader allow you to do?$yy119$,
   $yy120$["Write binary files", "Access CSV columns by name instead of position", "Delete rows", "Convert CSV to JSON automatically"]$yy120$::jsonb,
   1, $yy121$csv.DictReader lets you access each row's values by column name instead of by numeric position.$yy121$, 1, 7),
  ('tq-py-file-handling-9', 'pt-py-file-handling',
   $yy122$What must you pass to open() when writing a CSV file on some systems to avoid extra blank lines?$yy122$,
   $yy123$["mode=\"csv\"", "newline=\"\"", "encoding=\"csv\"", "Nothing special is needed"]$yy123$::jsonb,
   1, $yy124$Passing newline="" to open() when writing a CSV file prevents extra blank lines from appearing between rows on some systems.$yy124$, 1, 8),
  ('tq-py-file-handling-10', 'pt-py-file-handling',
   $yy125$What does os.path.exists("file.txt") return?$yy125$,
   $yy126$["The file's content", "True or False depending on whether the file exists", "The file size", "An error if the file doesn't exist"]$yy126$::jsonb,
   1, $yy127$os.path.exists(path) returns True or False depending on whether the given file or folder exists.$yy127$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-py-file-handling' and question_count <> 10;

-- Exception Handling — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'functions-files-oop/exception-handling')
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-py-exception-handling', $yy128$Exception Handling - Quick Test$yy128$, 'aptitude', 10, 10,
  $yy129$10 questions covering try/except/else/finally, raise, and custom exceptions.$yy129$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $yy130$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$yy130$, true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-py-exception-handling-1', 'pt-py-exception-handling',
   $yy131$What exception is raised when dividing by zero?$yy131$,
   $yy132$["ValueError", "ZeroDivisionError", "TypeError", "KeyError"]$yy132$::jsonb,
   1, $yy133$Dividing any number by zero raises a ZeroDivisionError in Python.$yy133$, 1, 0),
  ('tq-py-exception-handling-2', 'pt-py-exception-handling',
   $yy134$What happens if no exception occurs inside a try block that has an else?$yy134$,
   $yy135$["The else block is skipped", "The else block runs", "A SyntaxError occurs", "The program crashes"]$yy135$::jsonb,
   1, $yy136$The else block attached to try runs only when the try block completes with no exception raised.$yy136$, 1, 1),
  ('tq-py-exception-handling-3', 'pt-py-exception-handling',
   $yy137$Which block ALWAYS executes, regardless of whether an exception occurred?$yy137$,
   $yy138$["try", "except", "else", "finally"]$yy138$::jsonb,
   3, $yy139$The finally block always executes, whether or not an exception occurred, and even if it wasn't caught.$yy139$, 1, 2),
  ('tq-py-exception-handling-4', 'pt-py-exception-handling',
   $yy140$Why is a bare except: considered bad practice?$yy140$,
   $yy141$["It's slower", "It catches every exception, potentially hiding real bugs", "It only works with ValueError", "It's not valid Python syntax"]$yy141$::jsonb,
   1, $yy142$A bare except: catches every possible exception, including ones you didn't anticipate, which can hide real bugs in your own code.$yy142$, 1, 3),
  ('tq-py-exception-handling-5', 'pt-py-exception-handling',
   $yy143$How do you create a custom exception in Python?$yy143$,
   $yy144$["By using the raise keyword alone", "By inheriting from the Exception class", "By importing custom_exceptions", "Custom exceptions aren't supported"]$yy144$::jsonb,
   1, $yy145$A custom exception is created by defining a class that inherits from Exception (or one of its subclasses).$yy145$, 1, 4),
  ('tq-py-exception-handling-6', 'pt-py-exception-handling',
   $yy146$What does raise ValueError("message") do?$yy146$,
   $yy147$["Catches an exception", "Deliberately triggers an exception with a custom message", "Logs a warning", "Ends the program silently"]$yy147$::jsonb,
   1, $yy148$raise deliberately triggers an exception with the given message, immediately handing control to the nearest matching except block.$yy148$, 1, 5),
  ('tq-py-exception-handling-7', 'pt-py-exception-handling',
   $yy149$What exception occurs when accessing a dictionary key that doesn't exist (using [])?$yy149$,
   $yy150$["IndexError", "KeyError", "AttributeError", "NameError"]$yy150$::jsonb,
   1, $yy151$Accessing a dictionary key that doesn't exist with [] raises a KeyError.$yy151$, 1, 6),
  ('tq-py-exception-handling-8', 'pt-py-exception-handling',
   $yy152$What exception occurs when accessing a list index that's out of range?$yy152$,
   $yy153$["KeyError", "IndexError", "ValueError", "RangeError"]$yy153$::jsonb,
   1, $yy154$Accessing a list index outside its valid range raises an IndexError.$yy154$, 1, 7),
  ('tq-py-exception-handling-9', 'pt-py-exception-handling',
   $yy155$Can you catch multiple exception types in a single except block?$yy155$,
   $yy156$["No", "Yes, using a tuple: except (TypeError, ValueError):", "Only with finally", "Only in Python 2"]$yy156$::jsonb,
   1, $yy157$A single except block can catch multiple exception types at once by listing them in a tuple: except (TypeError, ValueError):.$yy157$, 1, 8),
  ('tq-py-exception-handling-10', 'pt-py-exception-handling',
   $yy158$What is the correct order of blocks in an exception-handling structure?$yy158$,
   $yy159$["except, try, finally", "try, except, else, finally", "finally, try, except", "else, try, except"]$yy159$::jsonb,
   1, $yy160$The standard exception-handling structure is try, followed by one or more except blocks, then an optional else, then an optional finally.$yy160$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-py-exception-handling' and question_count <> 10;

-- Object-Oriented Programming — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'functions-files-oop/oop')
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-py-oop', $yy161$Object-Oriented Programming - Quick Test$yy161$, 'aptitude', 10, 10,
  $yy162$10 questions covering classes, objects, encapsulation, inheritance, polymorphism, abstraction and magic methods.$yy162$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $yy163$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$yy163$, true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-py-oop-1', 'pt-py-oop',
   $yy164$What is the difference between a class and an object?$yy164$,
   $yy165$["No difference", "A class is a blueprint; an object is an instance created from it", "An object is a blueprint; a class is an instance", "Classes can't hold data"]$yy165$::jsonb,
   1, $yy166$A class is the blueprint that defines attributes and behavior; an object is an actual instance created from that blueprint, holding its own data.$yy166$, 1, 0),
  ('tq-py-oop-2', 'pt-py-oop',
   $yy167$What is self used for in a class method?$yy167$,
   $yy168$["To refer to the class itself", "To refer to the specific object the method is called on", "It's optional and rarely used", "To import other classes"]$yy168$::jsonb,
   1, $yy169$self refers to the specific object a method is being called on, letting the method read and modify that object's own attributes.$yy169$, 1, 1),
  ('tq-py-oop-3', 'pt-py-oop',
   $yy170$What is the difference between an instance variable and a class variable?$yy170$,
   $yy171$["No difference", "Instance variables are shared by all objects; class variables are unique per object", "Class variables are shared by all objects; instance variables are unique per object", "Class variables can't hold numbers"]$yy171$::jsonb,
   2, $yy172$Class variables are shared by every object of that class; instance variables are set per-object (typically in __init__ via self.) and are independent for each instance.$yy172$, 1, 2),
  ('tq-py-oop-4', 'pt-py-oop',
   $yy173$Which decorator marks a method as not needing self or cls?$yy173$,
   $yy174$["@classmethod", "@staticmethod", "@property", "@abstractmethod"]$yy174$::jsonb,
   1, $yy175$A static method needs neither self nor cls — it's just a related utility function grouped inside the class.$yy175$, 1, 3),
  ('tq-py-oop-5', 'pt-py-oop',
   $yy176$What does super().__init__() do in a child class?$yy176$,
   $yy177$["Deletes the parent class", "Calls the parent class's constructor", "Creates a new class", "Raises an error"]$yy177$::jsonb,
   1, $yy178$super().__init__() calls the parent class's constructor, so the child class can reuse its setup logic instead of repeating it.$yy178$, 1, 4),
  ('tq-py-oop-6', 'pt-py-oop',
   $yy179$What naming convention signals a "private" attribute in Python?$yy179$,
   $yy180$["Single underscore prefix", "Double underscore prefix", "ALL_CAPS", "camelCase"]$yy180$::jsonb,
   1, $yy181$A double-underscore prefix triggers Python's name-mangling, signaling that an attribute is private and discouraging direct outside access.$yy181$, 1, 5),
  ('tq-py-oop-7', 'pt-py-oop',
   $yy182$What is method overriding?$yy182$,
   $yy183$["Defining a method multiple times with different parameters", "A child class redefining a method inherited from its parent", "Deleting a method", "Making a method private"]$yy183$::jsonb,
   1, $yy184$Method overriding is when a child class defines its own version of a method it inherited from its parent, replacing the parent's behavior.$yy184$, 1, 6),
  ('tq-py-oop-8', 'pt-py-oop',
   $yy185$What does @abstractmethod (from the abc module) enforce?$yy185$,
   $yy186$["The method must be private", "Subclasses must implement the method themselves", "The method runs automatically", "The method cannot be inherited"]$yy186$::jsonb,
   1, $yy187$@abstractmethod forces every concrete subclass to provide its own implementation of that method, or it can't be instantiated.$yy187$, 1, 7),
  ('tq-py-oop-9', 'pt-py-oop',
   $yy188$Which magic method controls what print(obj) displays?$yy188$,
   $yy189$["__init__", "__str__", "__len__", "__eq__"]$yy189$::jsonb,
   1, $yy190$__str__ defines the human-readable text that print(obj) or str(obj) displays for a custom object.$yy190$, 1, 8),
  ('tq-py-oop-10', 'pt-py-oop',
   $yy191$What type of inheritance involves one child class inheriting from more than one parent class?$yy191$,
   $yy192$["Single", "Multilevel", "Hierarchical", "Multiple"]$yy192$::jsonb,
   3, $yy193$Multiple inheritance is when a single child class inherits from more than one parent class at once.$yy193$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-py-oop' and question_count <> 10;

-- ===========================================================================
-- 5. CODING PROBLEMS — 4 Python-only problems per topic (topic_id NULL, global
--    slug). Skips a slug already taken by any existing row (e.g. an admin's).
-- ===========================================================================

-- Functions — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'functions-files-oop/functions')
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-py-functions-1', null::text, $yy196$Prime Checker Function$yy196$, 'Easy', 'py-functions-prime-checker-function',
   $yy197$Write a function is_prime(n) that returns True if n is a prime number, False otherwise, then read a number and print the result.

**What the problem means:** a prime number is a whole number greater than 1 with no divisors other than 1 and itself. Wrap that check inside a reusable function instead of writing it inline.

**Approach:** inside is_prime(n), return False for anything less than 2, then check whether any number from 2 up to n-1 divides n evenly.

**Input:** One line: a whole number n.

**Output:** One line: True or False.$yy197$,
   $yy198$[{"input": "17", "output": "True"}]$yy198$::jsonb,
   $yy199$["1 <= n <= 100000"]$yy199$::jsonb,
   jsonb_build_object('python', $yy194$def is_prime(n):
    # return True if n is prime, False otherwise
    pass

n = int(input())
print(is_prime(n))
$yy194$),
   $yy200$["Numbers less than 2 are never prime — handle that first.", "Loop from 2 up to n - 1; if any of them divides n evenly (n % i == 0), it's not prime.", "print(is_prime(n)) will print exactly True or False, matching Python's own boolean text."]$yy200$::jsonb,
   $yy201$[{"input": "17", "expected": "True", "hidden": false}, {"input": "18", "expected": "False", "hidden": false}, {"input": "2", "expected": "True", "hidden": true}]$yy201$::jsonb,
   $yy202$Wrap the primality check inside a function so it can be reused: is_prime(n) returns False immediately for n < 2, then loops i from 2 to n - 1, returning False the moment any i divides n evenly. If the loop finishes without finding a divisor, the number is prime.$yy202$,
   jsonb_build_object('python', $yy195$def is_prime(n):
    if n < 2:
        return False
    for i in range(2, n):
        if n % i == 0:
            return False
    return True

n = int(input())
print(is_prime(n))
$yy195$),
   array['python'], 'published', false, 0),
  ('cp-py-functions-2', null::text, $yy205$Factorial (Recursive and Iterative)$yy205$, 'Easy', 'py-functions-factorial-recursive-and-iterative',
   $yy206$Write two functions, factorial_recursive(n) and factorial_iterative(n), both returning n!, and print both results for the same input to confirm they agree.

**What the problem means:** n! (n factorial) is the product of every whole number from 1 to n. There are two classic ways to compute it — recursion (a function calling itself) and iteration (a loop) — and this problem asks you to write both.

**Approach:** factorial_recursive multiplies n by factorial_recursive(n - 1), stopping at the base case n == 0 or n == 1. factorial_iterative just multiplies a running total in a loop from 2 to n.

**Input:** One line: a whole number n.

**Output:** Two lines:
`Recursive: <n!>`
`Iterative: <n!>`$yy206$,
   $yy207$[{"input": "5", "output": "Recursive: 120\nIterative: 120"}]$yy207$::jsonb,
   $yy208$["0 <= n <= 20"]$yy208$::jsonb,
   jsonb_build_object('python', $yy203$def factorial_recursive(n):
    # base case + recursive case
    pass

def factorial_iterative(n):
    # use a loop
    pass

n = int(input())
print(f"Recursive: {factorial_recursive(n)}")
print(f"Iterative: {factorial_iterative(n)}")
$yy203$),
   $yy209$["Base case for the recursive version: 0! and 1! are both 1.", "Recursive case: n! = n * (n - 1)!.", "For the iterative version, start result at 1 and multiply it by every number from 2 to n in a loop."]$yy209$::jsonb,
   $yy210$[{"input": "5", "expected": "Recursive: 120\nIterative: 120", "hidden": false}, {"input": "0", "expected": "Recursive: 1\nIterative: 1", "hidden": true}]$yy210$::jsonb,
   $yy211$factorial_recursive multiplies n by the factorial of n - 1, all the way down to the base case (0 or 1, both defined as 1). factorial_iterative reaches the same answer without any function calling itself: start a running total at 1 and multiply it by every integer from 2 up to n in a simple loop. Both approaches must produce identical results for the same n.$yy211$,
   jsonb_build_object('python', $yy204$def factorial_recursive(n):
    if n == 0 or n == 1:
        return 1
    return n * factorial_recursive(n - 1)

def factorial_iterative(n):
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result

n = int(input())
print(f"Recursive: {factorial_recursive(n)}")
print(f"Iterative: {factorial_iterative(n)}")
$yy204$),
   array['python'], 'published', false, 1),
  ('cp-py-functions-3', null::text, $yy214$Flexible Sum Function$yy214$, 'Easy', 'py-functions-flexible-sum-function',
   $yy215$Write a function total(*numbers) that accepts any number of arguments and returns their sum, then use it on a line of space-separated numbers.

**What the problem means:** instead of writing a function that only adds exactly two numbers, use *args so it can add any amount of numbers you give it — 2, 5, or 20.

**Approach:** *numbers collects every argument passed into total() as a tuple; sum() adds them all up.

**Input:** One line: space-separated whole numbers.

**Output:** One line: the sum of all the numbers.$yy215$,
   $yy216$[{"input": "1 2 3 4", "output": "10"}]$yy216$::jsonb,
   $yy217$["1 <= count of numbers <= 1000"]$yy217$::jsonb,
   jsonb_build_object('python', $yy212$def total(*numbers):
    # return the sum of every number passed in
    pass

numbers = list(map(int, input().split()))
print(total(*numbers))
$yy212$),
   $yy218$["*numbers inside the function definition collects any number of positional arguments into a tuple.", "sum() adds up every value in a tuple or list directly.", "total(*numbers) — the * here unpacks the numbers list back into separate arguments for the call."]$yy218$::jsonb,
   $yy219$[{"input": "1 2 3 4", "expected": "10", "hidden": false}, {"input": "5 5 5 5 5", "expected": "25", "hidden": true}]$yy219$::jsonb,
   $yy220$def total(*numbers): collects however many arguments are passed into a tuple called numbers, and sum(numbers) adds them all together. Calling total(*numbers) on the parsed input list unpacks it back into individual arguments, so the function works no matter how many numbers were on the input line.$yy220$,
   jsonb_build_object('python', $yy213$def total(*numbers):
    return sum(numbers)

numbers = list(map(int, input().split()))
print(total(*numbers))
$yy213$),
   array['python'], 'published', false, 2),
  ('cp-py-functions-4', null::text, $yy223$Filter and Transform Pipeline$yy223$, 'Medium', 'py-functions-filter-and-transform-pipeline',
   $yy224$Given a list of numbers, use filter() to keep only the even numbers, then use map() to square each of them, and print the final result as a list.

**What the problem means:** this chains two higher-order functions together — first narrow the list down (filter), then transform what's left (map).

**Approach:** filter(lambda x: x % 2 == 0, numbers) keeps only even numbers; map(lambda x: x ** 2, ...) squares each of those; wrap the final result in list(...) to see the values.

**Input:** One line: space-separated whole numbers.

**Output:** One line: the squares of the even numbers, printed as a Python list, in their original order.$yy224$,
   $yy225$[{"input": "1 2 3 4 5 6", "output": "[4, 16, 36]"}]$yy225$::jsonb,
   $yy226$["1 <= count of numbers <= 1000"]$yy226$::jsonb,
   jsonb_build_object('python', $yy221$numbers = list(map(int, input().split()))

# 1. filter to keep only even numbers
# 2. map to square each of them
# 3. print the result as a list
$yy221$),
   $yy227$["filter(lambda x: x % 2 == 0, numbers) keeps only the numbers that satisfy the condition.", "map(lambda x: x ** 2, ...) applies squaring to every remaining item.", "Both filter() and map() return iterators — wrap the final result in list(...) before printing."]$yy227$::jsonb,
   $yy228$[{"input": "1 2 3 4 5 6", "expected": "[4, 16, 36]", "hidden": false}, {"input": "1 3 5", "expected": "[]", "hidden": true}]$yy228$::jsonb,
   $yy229$Chain the two higher-order functions: evens = filter(lambda x: x % 2 == 0, numbers) keeps only even values, then squared = map(lambda x: x ** 2, evens) transforms each surviving value. Wrapping the final map object in list(...) turns it into a real list ready to print.$yy229$,
   jsonb_build_object('python', $yy222$numbers = list(map(int, input().split()))
evens = filter(lambda x: x % 2 == 0, numbers)
squared = list(map(lambda x: x ** 2, evens))
print(squared)
$yy222$),
   array['python'], 'published', false, 3)
) as v(id, topic_id, title, difficulty, slug, description,
       examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
       supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- Modules & Packages — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'functions-files-oop/modules-and-packages')
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-py-modules-packages-1', null::text, $yy232$Math Module Practice$yy232$, 'Easy', 'py-modules-packages-math-module-practice',
   $yy233$Use Python's built-in math module to find the floor, ceiling, and square root of a number.

**What the problem means:** the math module (part of the Standard Library, no installation needed) provides ready-made functions for exactly this kind of calculation instead of you writing the logic yourself.

**Approach:** import math, then use math.floor(), math.ceil(), and math.sqrt() on the given number.

**Input:** One line: a number (may include a decimal point).

**Output:** Three lines:
`Floor: <value>`
`Ceiling: <value>`
`Square Root: <value, 2 decimal places>`$yy233$,
   $yy234$[{"input": "4.7", "output": "Floor: 4\nCeiling: 5\nSquare Root: 2.17"}]$yy234$::jsonb,
   $yy235$["0 <= n <= 10^6"]$yy235$::jsonb,
   jsonb_build_object('python', $yy230$import math

x = float(input())

# print Floor, Ceiling and Square Root using the math module
$yy230$),
   $yy236$["math.floor(x) rounds down; math.ceil(x) rounds up.", "math.sqrt(x) computes the square root.", "Format the square root with :.2f so it always shows exactly 2 decimal places."]$yy236$::jsonb,
   $yy237$[{"input": "4.7", "expected": "Floor: 4\nCeiling: 5\nSquare Root: 2.17", "hidden": false}, {"input": "25", "expected": "Floor: 25\nCeiling: 25\nSquare Root: 5.00", "hidden": true}]$yy237$::jsonb,
   $yy238$Import the math module once at the top, then call math.floor(x), math.ceil(x) and math.sqrt(x) directly — no need to implement any of this rounding/root logic by hand. Format the square root to 2 decimal places with an f-string.$yy238$,
   jsonb_build_object('python', $yy231$import math

x = float(input())
print(f"Floor: {math.floor(x)}")
print(f"Ceiling: {math.ceil(x)}")
print(f"Square Root: {math.sqrt(x):.2f}")
$yy231$),
   array['python'], 'published', false, 0),
  ('cp-py-modules-packages-2', null::text, $yy241$Dice Roll Coverage$yy241$, 'Medium', 'py-modules-packages-dice-roll-coverage',
   $yy242$Use the random module to simulate rolling a six-sided die 1000 times, and check whether every face (1 through 6) showed up at least once.

**What the problem means:** with 1000 rolls of a fair die, it's overwhelmingly likely every face appears at least once — this checks that your simulation covers the full range correctly, without needing to match an exact random sequence (which would be a fragile, un-testable way to grade genuine randomness).

**Approach:** use random.randint(1, 6) inside a loop to build a list of 1000 rolls, then check that every number from 1 to 6 appears somewhere in that list.

**Input:** No input.

**Output:** One line: True if every face 1-6 appeared at least once among the 1000 rolls, otherwise False.$yy242$,
   $yy243$[{"input": "", "output": "True"}]$yy243$::jsonb,
   $yy244$[]$yy244$::jsonb,
   jsonb_build_object('python', $yy239$import random

rolls = [random.randint(1, 6) for _ in range(1000)]

# check that every face from 1 to 6 appears somewhere in rolls, then print True/False
$yy239$),
   $yy245$["random.randint(1, 6) returns a random integer between 1 and 6, inclusive on both ends.", "all(face in rolls for face in range(1, 7)) checks that every one of the six faces appears at least once.", "With 1000 rolls, missing a face is astronomically unlikely for a correct simulation — the expected answer is always True."]$yy245$::jsonb,
   $yy246$[{"input": "", "expected": "True", "hidden": false}]$yy246$::jsonb,
   $yy247$random.randint(1, 6) called 1000 times inside a list comprehension builds a realistic simulation of 1000 die rolls. Checking all(face in rolls for face in range(1, 7)) confirms every possible face turned up at least once — with 1000 trials this is true for all practical purposes, which is what makes this a reliable way to grade genuine random-module usage without depending on one exact pseudorandom sequence.$yy247$,
   jsonb_build_object('python', $yy240$import random

rolls = [random.randint(1, 6) for _ in range(1000)]
print(all(face in rolls for face in range(1, 7)))
$yy240$),
   array['python'], 'published', false, 1),
  ('cp-py-modules-packages-3', null::text, $yy250$Age Calculator$yy250$, 'Easy', 'py-modules-packages-age-calculator',
   $yy251$Given a birth year and the current year, calculate and print the person's age in years.

**What the problem means:** rather than relying on today's actual date (which would make the expected answer change depending on when this is run), both the birth year and the "current" year are given as input, so the calculation is fully reproducible.

**Approach:** subtract the birth year from the given current year.

**Input:** Two lines: the birth year, then the current year.

**Output:** One line: `Age: <age>`$yy251$,
   $yy252$[{"input": "2000\n2026", "output": "Age: 26"}]$yy252$::jsonb,
   $yy253$["1900 <= birth year <= current year <= 2200"]$yy253$::jsonb,
   jsonb_build_object('python', $yy248$birth_year = int(input())
current_year = int(input())

# compute and print the age
$yy248$),
   $yy254$["Age is simply the difference between the current year and the birth year.", "f\"Age: {current_year - birth_year}\" produces the exact required format."]$yy254$::jsonb,
   $yy255$[{"input": "2000\n2026", "expected": "Age: 26", "hidden": false}, {"input": "1998\n2026", "expected": "Age: 28", "hidden": true}]$yy255$::jsonb,
   $yy256$Age in whole years is just current_year - birth_year. Taking both years as input (rather than using datetime.date.today()) keeps the expected output fixed and reproducible regardless of when the program actually runs.$yy256$,
   jsonb_build_object('python', $yy249$birth_year = int(input())
current_year = int(input())
print(f"Age: {current_year - birth_year}")
$yy249$),
   array['python'], 'published', false, 2),
  ('cp-py-modules-packages-4', null::text, $yy259$Word Frequency with Counter$yy259$, 'Easy', 'py-modules-packages-word-frequency-with-counter',
   $yy260$Given a line of words, use collections.Counter to find and print the 3 most common words.

**What the problem means:** Counter is a Standard Library tool built exactly for this — counting how many times each item appears — so you don't need to write the counting loop yourself.

**Approach:** split the line into words, build a Counter from them, and call .most_common(3).

**Input:** One line: space-separated words.

**Output:** One line: the 3 most common words with their counts, as a Python list of tuples.$yy260$,
   $yy261$[{"input": "apple banana apple cherry apple banana", "output": "[('apple', 3), ('banana', 2), ('cherry', 1)]"}]$yy261$::jsonb,
   $yy262$["1 <= number of words <= 1000"]$yy262$::jsonb,
   jsonb_build_object('python', $yy257$from collections import Counter

words = input().split()

# build a Counter and print its 3 most common words
$yy257$),
   $yy263$["Counter(words) counts every word's occurrences in one step.", ".most_common(3) returns the 3 most frequent items as (word, count) tuples, most frequent first.", "Ties are broken by the order words first appeared, since Counter is a dictionary under the hood."]$yy263$::jsonb,
   $yy264$[{"input": "apple banana apple cherry apple banana", "expected": "[('apple', 3), ('banana', 2), ('cherry', 1)]", "hidden": false}, {"input": "a b c", "expected": "[('a', 1), ('b', 1), ('c', 1)]", "hidden": true}]$yy264$::jsonb,
   $yy265$Counter(words) builds a dictionary-like object mapping each word to how many times it appeared, in a single line. .most_common(3) then returns the top 3 as a list of (word, count) tuples, ordered from most to least frequent, breaking ties by first-appearance order.$yy265$,
   jsonb_build_object('python', $yy258$from collections import Counter

words = input().split()
counter = Counter(words)
print(counter.most_common(3))
$yy258$),
   array['python'], 'published', false, 3)
) as v(id, topic_id, title, difficulty, slug, description,
       examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
       supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- File Handling — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'functions-files-oop/file-handling')
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-py-file-handling-1', null::text, $yy268$Line Counter$yy268$, 'Easy', 'py-file-handling-line-counter',
   $yy269$Write a program that writes a given number of lines to a text file, then reads that file back and counts its total number of lines.

**What the problem means:** this exercises the full write-then-read cycle — save some text to disk, then open it again and count how many lines it contains.

**Approach:** read how many lines there are and the lines themselves, write each one (with a newline) to a file using with open(...) as f:, then reopen it and count with readlines().

**Input:** First line: the number of lines n. Next n lines: the text content itself.

**Output:** One line: `Total lines: <n>`$yy269$,
   $yy270$[{"input": "3\nHello\nWorld\nPython", "output": "Total lines: 3"}]$yy270$::jsonb,
   $yy271$["1 <= n <= 1000"]$yy271$::jsonb,
   jsonb_build_object('python', $yy266$n = int(input())
lines = [input() for _ in range(n)]

# write `lines` to a file, then read it back and count the lines
$yy266$),
   $yy272$["with open(\"temp.txt\", \"w\") as f: f.write(line + \"\\n\") writes one line at a time, including the newline.", "Reopen the file in \"r\" mode and use len(f.readlines()) to count how many lines it has."]$yy272$::jsonb,
   $yy273$[{"input": "3\nHello\nWorld\nPython", "expected": "Total lines: 3", "hidden": false}, {"input": "1\nJust one line", "expected": "Total lines: 1", "hidden": true}]$yy273$::jsonb,
   $yy274$Write every given line to a file (adding \n after each one so they land on separate lines), close it, then reopen it in read mode and count with len(f.readlines()) — readlines() returns one list entry per line, so its length is exactly the line count.$yy274$,
   jsonb_build_object('python', $yy267$n = int(input())
lines = [input() for _ in range(n)]
with open("temp.txt", "w") as f:
    for line in lines:
        f.write(line + "\n")
with open("temp.txt", "r") as f:
    count = len(f.readlines())
print(f"Total lines: {count}")
$yy267$),
   array['python'], 'published', false, 0),
  ('cp-py-file-handling-2', null::text, $yy277$Word Search in File$yy277$, 'Easy', 'py-file-handling-word-search-in-file',
   $yy278$Write a program that saves several lines of text to a file, then reads it back line by line and prints only the lines containing a given search word.

**What the problem means:** search through saved text file content for a specific word, one line at a time — the most common, memory-efficient way to scan a file.

**Approach:** write the given lines to a file, then loop `for line in file:` and print any line where the search word is found (using the in operator).

**Input:** First line: the number of lines n. Next n lines: the text content. Final line: the search word.

**Output:** Every line (in order) that contains the search word, printed as-is (without the trailing newline).$yy278$,
   $yy279$[{"input": "3\nI love Python\nJava is great\nPython is fun\nPython", "output": "I love Python\nPython is fun"}]$yy279$::jsonb,
   $yy280$["1 <= n <= 1000"]$yy280$::jsonb,
   jsonb_build_object('python', $yy275$n = int(input())
lines = [input() for _ in range(n)]
search_word = input()

# write `lines` to a file, then read it back and print only matching lines
$yy275$),
   $yy281$["Write each line to the file first (with a trailing \\n), just like the Line Counter problem.", "for line in file: reads one line at a time, which already includes its trailing newline.", "Check membership with search_word in line, and print(line.strip()) to drop the extra newline from the read line."]$yy281$::jsonb,
   $yy282$[{"input": "3\nI love Python\nJava is great\nPython is fun\nPython", "expected": "I love Python\nPython is fun", "hidden": false}, {"input": "2\nHello World\nGoodbye World\nMissing", "expected": "", "hidden": true}]$yy282$::jsonb,
   $yy283$Save every input line to a file first, then reopen it and loop for line in file: — this reads it one line at a time. For each line, check if search_word in line; if so, print(line.strip()) to show it without the extra newline that reading a line always includes.$yy283$,
   jsonb_build_object('python', $yy276$n = int(input())
lines = [input() for _ in range(n)]
search_word = input()
with open("temp.txt", "w") as f:
    for line in lines:
        f.write(line + "\n")
with open("temp.txt", "r") as f:
    for line in f:
        if search_word in line:
            print(line.strip())
$yy276$),
   array['python'], 'published', false, 1),
  ('cp-py-file-handling-3', null::text, $yy286$CSV Report Generator$yy286$, 'Medium', 'py-file-handling-csv-report-generator',
   $yy287$Write a program that saves 3 products (name and price) to a CSV file, then reads it back using csv.DictReader and prints each product.

**What the problem means:** CSV is a common way to store simple tabular data as plain text — this exercises writing rows with csv.writer and reading them back by column name with csv.DictReader.

**Approach:** write a header row ("Name", "Price") plus 3 data rows with csv.writer, then reopen the file and use csv.DictReader to read each row as a dictionary.

**Input:** Three lines, each a product as `name,price`.

**Output:** Three lines: `Name: <name>, Price: <price>`, one per product, in the original order.$yy287$,
   $yy288$[{"input": "Pen,10\nNotebook,50\nBag,500", "output": "Name: Pen, Price: 10\nName: Notebook, Price: 50\nName: Bag, Price: 500"}]$yy288$::jsonb,
   $yy289$["Each line is exactly `name,price` with no extra commas."]$yy289$::jsonb,
   jsonb_build_object('python', $yy284$import csv

rows = []
for _ in range(3):
    name, price = input().split(",")
    rows.append((name, price))

# write rows to a CSV file with a header, then read it back with csv.DictReader and print each one
$yy284$),
   $yy290$["csv.writer(file).writerow([...]) writes one row (list of values) at a time — write the header row first.", "Open the file for writing with newline=\"\" to avoid extra blank lines.", "csv.DictReader(file) lets you read each row back as a dictionary, keyed by the header names."]$yy290$::jsonb,
   $yy291$[{"input": "Pen,10\nNotebook,50\nBag,500", "expected": "Name: Pen, Price: 10\nName: Notebook, Price: 50\nName: Bag, Price: 500", "hidden": false}]$yy291$::jsonb,
   $yy292$Write the header row ["Name", "Price"] followed by the 3 product rows using csv.writer, opening the file with newline="" as is standard practice. Reopen it and loop over csv.DictReader(file), which turns every row back into a dictionary keyed by the header — so row["Name"] and row["Price"] read naturally.$yy292$,
   jsonb_build_object('python', $yy285$import csv

rows = []
for _ in range(3):
    name, price = input().split(",")
    rows.append((name, price))

with open("products.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["Name", "Price"])
    for name, price in rows:
        writer.writerow([name, price])

with open("products.csv", "r") as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(f"Name: {row['Name']}, Price: {row['Price']}")
$yy285$),
   array['python'], 'published', false, 2),
  ('cp-py-file-handling-4', null::text, $yy295$JSON-Based Settings Saver$yy295$, 'Easy', 'py-file-handling-json-settings-saver',
   $yy296$Write a program that saves a dictionary of user settings to a JSON file, then loads it back and prints each setting.

**What the problem means:** JSON is the standard format for structured data like configuration/settings files — this exercises writing a dictionary out with json.dump() and reading it back with json.load().

**Approach:** build a settings dictionary from the given theme and notifications value, save it with json.dump(), then reopen and read it back with json.load().

**Input:** Two lines: the theme (a word), and notifications as the literal text True or False.

**Output:** Two lines:
`theme: <theme>`
`notifications: <True or False>`$yy296$,
   $yy297$[{"input": "dark\nTrue", "output": "theme: dark\nnotifications: True"}]$yy297$::jsonb,
   $yy298$["notifications is exactly the text True or False."]$yy298$::jsonb,
   jsonb_build_object('python', $yy293$import json

theme = input()
notifications = input().strip() == "True"

# build a settings dict, save it to a JSON file, load it back, then print both settings
$yy293$),
   $yy299$["json.dump(data, file) writes a Python dictionary to an open file as JSON.", "json.load(file) reads JSON content from an open file back into a Python dictionary.", "input().strip() == \"True\" converts the text \"True\"/\"False\" into an actual Python boolean."]$yy299$::jsonb,
   $yy300$[{"input": "dark\nTrue", "expected": "theme: dark\nnotifications: True", "hidden": false}, {"input": "light\nFalse", "expected": "theme: light\nnotifications: False", "hidden": true}]$yy300$::jsonb,
   $yy301$Build a small dictionary {"theme": theme, "notifications": notifications} and hand it to json.dump(settings, file) to save it as JSON. Reopening the file and calling json.load(file) reconstructs the same dictionary, which is then printed field by field.$yy301$,
   jsonb_build_object('python', $yy294$import json

theme = input()
notifications = input().strip() == "True"
settings = {"theme": theme, "notifications": notifications}

with open("settings.json", "w") as f:
    json.dump(settings, f)

with open("settings.json", "r") as f:
    data = json.load(f)

print(f"theme: {data['theme']}")
print(f"notifications: {data['notifications']}")
$yy294$),
   array['python'], 'published', false, 3)
) as v(id, topic_id, title, difficulty, slug, description,
       examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
       supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- Exception Handling — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'functions-files-oop/exception-handling')
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-py-exception-handling-1', null::text, $yy304$Safe Division Calculator$yy304$, 'Easy', 'py-exception-handling-safe-division-calculator',
   $yy305$Write a function safe_divide(a, b) that returns the result of a / b, handling ZeroDivisionError by returning the message "Cannot divide by zero" instead of crashing.

**What the problem means:** wrap a risky operation (division, which can fail if b is 0) in a function that never crashes the caller, no matter what b is.

**Approach:** put the division inside a try block; catch ZeroDivisionError and return the fallback message instead.

**Input:** Two lines: a, then b.

**Output:** One line: the division result, or the message Cannot divide by zero.$yy305$,
   $yy306$[{"input": "10\n0", "output": "Cannot divide by zero"}]$yy306$::jsonb,
   $yy307$["-10^9 <= a, b <= 10^9"]$yy307$::jsonb,
   jsonb_build_object('python', $yy302$def safe_divide(a, b):
    # try a / b, catch ZeroDivisionError
    pass

a = int(input())
b = int(input())
print(safe_divide(a, b))
$yy302$),
   $yy308$["Put a / b inside a try block.", "except ZeroDivisionError: catches specifically the case where b is 0.", "Return the string \"Cannot divide by zero\" from inside the except block."]$yy308$::jsonb,
   $yy309$[{"input": "10\n0", "expected": "Cannot divide by zero", "hidden": false}, {"input": "10\n2", "expected": "5.0", "hidden": true}]$yy309$::jsonb,
   $yy310$Wrap the division in a try block inside safe_divide(). When b is 0, Python raises ZeroDivisionError, which the except block catches and turns into a plain, safe return value instead of letting the program crash. When b isn't 0, the division result (a plain float, from Python's / operator) is returned normally.$yy310$,
   jsonb_build_object('python', $yy303$def safe_divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        return "Cannot divide by zero"

a = int(input())
b = int(input())
print(safe_divide(a, b))
$yy303$),
   array['python'], 'published', false, 0),
  ('cp-py-exception-handling-2', null::text, $yy313$Validated Age Input$yy313$, 'Medium', 'py-exception-handling-validated-age-input',
   $yy314$Write a program that repeatedly asks for an age until it receives a valid non-negative whole number, using try/except inside a loop.

**What the problem means:** keep reading a new line of input every time the previous one was invalid (not a number, or negative), and only stop once a good value arrives.

**Approach:** loop forever; inside the loop, try to convert the input to int and check it isn't negative — on failure (either a ValueError or a negative value), print the retry message and continue the loop; on success, print the accepted age and break.

**Input:** One or more lines: each is an attempted age (some may be invalid text or negative numbers); the last line is always a valid non-negative integer.

**Output:** `Please enter a valid number` once per invalid attempt, then finally `Age accepted: <age>`.$yy314$,
   $yy315$[{"input": "abc\n25", "output": "Please enter a valid number\nAge accepted: 25"}]$yy315$::jsonb,
   $yy316$["The final input line is always a valid non-negative integer."]$yy316$::jsonb,
   jsonb_build_object('python', $yy311$while True:
    raw = input()
    # try to parse raw as a non-negative integer;
    # on failure print "Please enter a valid number" and keep looping
    # on success print "Age accepted: <age>" and stop
$yy311$),
   $yy317$["int(raw) raises ValueError if raw isn't a valid whole number — catch it with try/except.", "Even if int(raw) succeeds, still check the result isn't negative before accepting it.", "Use break to exit the while loop only once a valid, non-negative age has been accepted."]$yy317$::jsonb,
   $yy318$[{"input": "abc\n25", "expected": "Please enter a valid number\nAge accepted: 25", "hidden": false}, {"input": "-5\n30", "expected": "Please enter a valid number\nAge accepted: 30", "hidden": true}]$yy318$::jsonb,
   $yy319$A while True: loop keeps reading input until a valid answer arrives. Each attempt is wrapped in try/except ValueError to catch non-numeric text; a successfully parsed but negative number is rejected with the same message via an explicit check. Only once a valid, non-negative integer is parsed does the loop print the acceptance message and break.$yy319$,
   jsonb_build_object('python', $yy312$while True:
    raw = input()
    try:
        age = int(raw)
        if age < 0:
            print("Please enter a valid number")
            continue
    except ValueError:
        print("Please enter a valid number")
        continue
    print(f"Age accepted: {age}")
    break
$yy312$),
   array['python'], 'published', false, 1),
  ('cp-py-exception-handling-3', null::text, $yy322$Custom Exception for Negative Numbers$yy322$, 'Medium', 'py-exception-handling-custom-exception-negative-numbers',
   $yy323$Create a custom exception NegativeValueError, and write a function calculate_square_root(n) that raises it if n is negative, otherwise returns the square root.

**What the problem means:** instead of returning some placeholder value for an invalid input, deliberately raise a clearly-named exception so the caller knows exactly what went wrong.

**Approach:** define class NegativeValueError(Exception): pass, then inside calculate_square_root(n), raise it (with a message) if n < 0, otherwise return n ** 0.5. Catch it where the function is called and print a formatted error.

**Input:** One line: a number n.

**Output:** One line: the square root, or `Error: Cannot calculate square root of a negative number` if n is negative.$yy323$,
   $yy324$[{"input": "-9", "output": "Error: Cannot calculate square root of a negative number"}]$yy324$::jsonb,
   $yy325$["-10^6 <= n <= 10^6"]$yy325$::jsonb,
   jsonb_build_object('python', $yy320$class NegativeValueError(Exception):
    pass

def calculate_square_root(n):
    # raise NegativeValueError for negative n, otherwise return the square root
    pass

n = int(input())
try:
    print(calculate_square_root(n))
except NegativeValueError as e:
    print(f"Error: {e}")
$yy320$),
   $yy326$["A custom exception is just a class that inherits from Exception — class NegativeValueError(Exception): pass.", "raise NegativeValueError(\"...\") inside the function stops it immediately and hands control to the except block.", "n ** 0.5 computes a square root without needing to import math."]$yy326$::jsonb,
   $yy327$[{"input": "-9", "expected": "Error: Cannot calculate square root of a negative number", "hidden": false}, {"input": "16", "expected": "4.0", "hidden": true}]$yy327$::jsonb,
   $yy328$NegativeValueError is a custom exception class that inherits from Exception, giving a specific, self-explanatory name to this particular problem. calculate_square_root(n) raises it (with a message) whenever n is negative; the calling code catches NegativeValueError specifically and prints a formatted error, while a valid n simply returns n ** 0.5.$yy328$,
   jsonb_build_object('python', $yy321$class NegativeValueError(Exception):
    pass

def calculate_square_root(n):
    if n < 0:
        raise NegativeValueError("Cannot calculate square root of a negative number")
    return n ** 0.5

n = int(input())
try:
    print(calculate_square_root(n))
except NegativeValueError as e:
    print(f"Error: {e}")
$yy321$),
   array['python'], 'published', false, 2),
  ('cp-py-exception-handling-4', null::text, $yy331$Multi-Exception File Reader$yy331$, 'Medium', 'py-exception-handling-multi-exception-file-reader',
   $yy332$Write a program that saves some text to a file called existing.txt, then attempts to open and read a given filename — handling FileNotFoundError with one message and any other exception with a generic message, using a finally block that always prints a completion message.

**What the problem means:** exercise a full try/except/except/finally structure where the outcome depends on whether the filename you're asked to read actually exists.

**Approach:** write the given content into existing.txt first. Then try to open and read the given filename — if it's existing.txt, the read succeeds; for any other name, it raises FileNotFoundError. Either way, the finally block always runs last.

**Input:** Two lines: the text content to save into `existing.txt`, then the filename to attempt reading.

**Output:** The file's content (if the given filename was found and read), or `File not found.` — followed on the next line by `Read attempt complete` either way.$yy332$,
   $yy333$[{"input": "Hello\nmissing.txt", "output": "File not found.\nRead attempt complete"}]$yy333$::jsonb,
   $yy334$["The filename to read is either exactly \"existing.txt\" or some other name that doesn't exist."]$yy334$::jsonb,
   jsonb_build_object('python', $yy329$content = input()
filename = input()

with open("existing.txt", "w") as f:
    f.write(content)

# try to open and read `filename`; handle FileNotFoundError and any other Exception separately;
# use finally to always print "Read attempt complete"
$yy329$),
   $yy335$["Write the content to existing.txt before attempting to read the requested filename.", "except FileNotFoundError: handles a missing file specifically; a later except Exception: is a safety net for anything else.", "The finally: block runs no matter which branch (or neither) executed."]$yy335$::jsonb,
   $yy336$[{"input": "Hello\nexisting.txt", "expected": "Hello\nRead attempt complete", "hidden": false}, {"input": "Hello\nmissing.txt", "expected": "File not found.\nRead attempt complete", "hidden": true}]$yy336$::jsonb,
   $yy337$After saving the given content into existing.txt, the program tries to open and read whatever filename was requested. If that name is existing.txt, the read succeeds and prints the content; for any other name, Python raises FileNotFoundError, caught by its own except block printing "File not found.". Either way, the finally: block runs last and unconditionally prints "Read attempt complete".$yy337$,
   jsonb_build_object('python', $yy330$content = input()
filename = input()

with open("existing.txt", "w") as f:
    f.write(content)

try:
    with open(filename, "r") as f:
        print(f.read())
except FileNotFoundError:
    print("File not found.")
except Exception:
    print("An error occurred.")
finally:
    print("Read attempt complete")
$yy330$),
   array['python'], 'published', false, 3)
) as v(id, topic_id, title, difficulty, slug, description,
       examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
       supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- Object-Oriented Programming — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'functions-files-oop/oop')
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-py-oop-1', null::text, $yy340$Rectangle Class$yy340$, 'Easy', 'py-oop-rectangle-class',
   $yy341$Create a Rectangle class with length and width attributes, and methods area() and perimeter().

**What the problem means:** model a rectangle as an object that knows its own dimensions and can calculate facts about itself, rather than passing length/width around as loose variables.

**Approach:** store length and width in __init__; area() returns length * width; perimeter() returns 2 * (length + width).

**Input:** Two lines: the length, then the width.

**Output:** Two lines:
`Area: <area>`
`Perimeter: <perimeter>`$yy341$,
   $yy342$[{"input": "5\n3", "output": "Area: 15\nPerimeter: 16"}]$yy342$::jsonb,
   $yy343$["1 <= length, width <= 10^6"]$yy343$::jsonb,
   jsonb_build_object('python', $yy338$class Rectangle:
    def __init__(self, length, width):
        self.length = length
        self.width = width

    def area(self):
        # return length * width
        pass

    def perimeter(self):
        # return 2 * (length + width)
        pass

length = int(input())
width = int(input())
r = Rectangle(length, width)
print(f"Area: {r.area()}")
print(f"Perimeter: {r.perimeter()}")
$yy338$),
   $yy344$["__init__ stores length and width on self so every method can use them.", "area() is simply self.length * self.width.", "perimeter() is 2 * (self.length + self.width)."]$yy344$::jsonb,
   $yy345$[{"input": "5\n3", "expected": "Area: 15\nPerimeter: 16", "hidden": false}, {"input": "10\n10", "expected": "Area: 100\nPerimeter: 40", "hidden": true}]$yy345$::jsonb,
   $yy346$The constructor stores length and width as instance attributes (self.length, self.width), so every method on the object can read them. area() multiplies the two dimensions; perimeter() adds them and doubles the result — both are one-line methods once the data lives on self.$yy346$,
   jsonb_build_object('python', $yy339$class Rectangle:
    def __init__(self, length, width):
        self.length = length
        self.width = width

    def area(self):
        return self.length * self.width

    def perimeter(self):
        return 2 * (self.length + self.width)

length = int(input())
width = int(input())
r = Rectangle(length, width)
print(f"Area: {r.area()}")
print(f"Perimeter: {r.perimeter()}")
$yy339$),
   array['python'], 'published', false, 0),
  ('cp-py-oop-2', null::text, $yy349$Employee and Manager (Inheritance + Overriding)$yy349$, 'Easy', 'py-oop-employee-and-manager',
   $yy350$Create an Employee class with a method calculate_bonus() returning a fixed amount, and a Manager subclass that overrides calculate_bonus() to return a higher amount.

**What the problem means:** two related but distinct "kinds" of thing (a regular employee and a manager) share most of their structure but differ in one specific calculation — a textbook use case for inheritance and method overriding.

**Approach:** Employee.calculate_bonus() returns 1000. class Manager(Employee): redefines calculate_bonus() to return 5000, completely replacing the parent's version for Manager objects.

**Input:** No input.

**Output:** Two lines: the Employee's bonus, then the Manager's bonus.$yy350$,
   $yy351$[{"input": "", "output": "1000\n5000"}]$yy351$::jsonb,
   $yy352$[]$yy352$::jsonb,
   jsonb_build_object('python', $yy347$class Employee:
    def calculate_bonus(self):
        return 1000

class Manager(Employee):
    def calculate_bonus(self):
        # override to return a higher amount
        pass

print(Employee().calculate_bonus())
print(Manager().calculate_bonus())
$yy347$),
   $yy353$["class Manager(Employee): makes Manager inherit everything Employee has.", "Defining calculate_bonus() again inside Manager completely replaces (overrides) the version inherited from Employee.", "Employee().calculate_bonus() and Manager().calculate_bonus() now return different values, even though both classes define a method with the same name."]$yy353$::jsonb,
   $yy354$[{"input": "", "expected": "1000\n5000", "hidden": false}]$yy354$::jsonb,
   $yy355$Manager(Employee) inherits from Employee, so it would normally reuse Employee's calculate_bonus(). But because Manager defines its own calculate_bonus() with the same name, that new version overrides the inherited one — Manager objects always use Manager's version, Employee objects always use Employee's.$yy355$,
   jsonb_build_object('python', $yy348$class Employee:
    def calculate_bonus(self):
        return 1000

class Manager(Employee):
    def calculate_bonus(self):
        return 5000

print(Employee().calculate_bonus())
print(Manager().calculate_bonus())
$yy348$),
   array['python'], 'published', false, 1),
  ('cp-py-oop-3', null::text, $yy358$Encapsulated Bank Account$yy358$, 'Medium', 'py-oop-encapsulated-bank-account',
   $yy359$Create a BankAccount class with a private __balance attribute, and methods deposit(), withdraw() (refusing withdrawals greater than the balance), and get_balance().

**What the problem means:** the account's balance should never be changeable directly from outside the class — every change must go through a controlled method that can enforce rules, like refusing an overdraw.

**Approach:** store the balance as self.__balance (double-underscore, private by convention). deposit() adds to it. withdraw() only subtracts if the amount doesn't exceed the current balance, otherwise it refuses.

**Input:** Three lines: the starting balance, a deposit amount, and a withdrawal amount to attempt.

**Output:** One line: `Balance: <new balance>` if the withdrawal succeeded, or `Insufficient balance` if it was refused.$yy359$,
   $yy360$[{"input": "0\n1000\n1500", "output": "Insufficient balance"}]$yy360$::jsonb,
   $yy361$["0 <= amounts <= 10^9"]$yy361$::jsonb,
   jsonb_build_object('python', $yy356$class BankAccount:
    def __init__(self, balance=0):
        self.__balance = balance

    def deposit(self, amount):
        self.__balance += amount

    def withdraw(self, amount):
        # refuse (return False) if amount exceeds the balance; otherwise subtract it and return True
        pass

    def get_balance(self):
        return self.__balance

initial = int(input())
deposit_amt = int(input())
withdraw_amt = int(input())
account = BankAccount(initial)
account.deposit(deposit_amt)
if account.withdraw(withdraw_amt):
    print(f"Balance: {account.get_balance()}")
else:
    print("Insufficient balance")
$yy356$),
   $yy362$["self.__balance (double underscore) is private by Python's naming convention — outside code can't read or set it directly.", "withdraw() should compare amount to self.__balance before subtracting anything.", "Have withdraw() return True on success and False when refused, so the calling code can decide what to print."]$yy362$::jsonb,
   $yy363$[{"input": "0\n1000\n1500", "expected": "Insufficient balance", "hidden": false}, {"input": "0\n1000\n400", "expected": "Balance: 600", "hidden": true}]$yy363$::jsonb,
   $yy364$__balance is private, so it can only be changed through the class's own methods. deposit() simply adds to it. withdraw() first checks whether the requested amount exceeds the current balance — if so it refuses (returns False) without touching the balance at all; otherwise it subtracts the amount and returns True, letting the caller print the new balance via get_balance().$yy364$,
   jsonb_build_object('python', $yy357$class BankAccount:
    def __init__(self, balance=0):
        self.__balance = balance

    def deposit(self, amount):
        self.__balance += amount

    def withdraw(self, amount):
        if amount > self.__balance:
            return False
        self.__balance -= amount
        return True

    def get_balance(self):
        return self.__balance

initial = int(input())
deposit_amt = int(input())
withdraw_amt = int(input())
account = BankAccount(initial)
account.deposit(deposit_amt)
if account.withdraw(withdraw_amt):
    print(f"Balance: {account.get_balance()}")
else:
    print("Insufficient balance")
$yy357$),
   array['python'], 'published', false, 2),
  ('cp-py-oop-4', null::text, $yy367$Abstract Shape Hierarchy$yy367$, 'Medium', 'py-oop-abstract-shape-hierarchy',
   $yy368$Create an abstract class Shape with an abstract method area(). Implement Circle and Square subclasses, each providing their own area() calculation, demonstrating polymorphism.

**What the problem means:** Shape defines that every shape MUST have an area() method, without saying how to calculate it — each concrete shape (Circle, Square) fills in that detail its own way.

**Approach:** import ABC and abstractmethod from abc; mark Shape's area() with @abstractmethod (no real implementation); Circle and Square each provide their own working area() formula.

**Input:** Two lines: a circle's radius, then a square's side length.

**Output:** Two lines: the circle's area, then the square's area.$yy368$,
   $yy369$[{"input": "5\n4", "output": "78.53975\n16"}]$yy369$::jsonb,
   $yy370$["0 <= radius, side <= 10^4"]$yy370$::jsonb,
   jsonb_build_object('python', $yy365$from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self):
        pass

class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        # use 3.14159 as pi
        pass

class Square(Shape):
    def __init__(self, side):
        self.side = side

    def area(self):
        pass

radius = float(input())
side = int(input())
circle = Circle(radius)
square = Square(side)
print(circle.area())
print(square.area())
$yy365$),
   $yy371$["Shape(ABC) with an @abstractmethod area() means Shape itself can never be instantiated directly.", "Circle.area() is 3.14159 * self.radius ** 2.", "Square.area() is self.side * self.side."]$yy371$::jsonb,
   $yy372$[{"input": "5\n4", "expected": "78.53975\n16", "hidden": false}, {"input": "0\n1", "expected": "0.0\n1", "hidden": true}]$yy372$::jsonb,
   $yy373$Shape(ABC) with an @abstractmethod area() defines a required interface without an implementation — Shape itself can't be instantiated, and any subclass that skips implementing area() can't either. Circle and Square each supply their own area() formula, and calling .area() on either object automatically runs the correct version for that object's actual type — that's polymorphism.$yy373$,
   jsonb_build_object('python', $yy366$from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self):
        pass

class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return 3.14159 * self.radius ** 2

class Square(Shape):
    def __init__(self, side):
        self.side = side

    def area(self):
        return self.side * self.side

radius = float(input())
side = int(input())
circle = Circle(radius)
square = Square(side)
print(circle.area())
print(square.area())
$yy366$),
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
   where source_kind = 'python_tutorial' and source_ref like 'functions-files-oop/%';
  if v_topics <> 5 then raise exception 'validation: expected 5 functions-files-oop topics, found %', v_topics; end if;

  select count(*) into v_tests from public.practice_tests where id in ('pt-py-functions','pt-py-modules-packages','pt-py-file-handling','pt-py-exception-handling','pt-py-oop');
  if v_tests <> 5 then raise exception 'validation: expected 5 new python topic mock tests, found %', v_tests; end if;

  select count(*) into v_bad_tests from public.practice_tests
   where id in ('pt-py-functions','pt-py-modules-packages','pt-py-file-handling','pt-py-exception-handling','pt-py-oop')
     and (question_count <> 10 or duration_minutes <> 10);
  if v_bad_tests > 0 then raise exception 'validation: % new python mock tests do not have 10 questions / 10 minute duration', v_bad_tests; end if;

  select count(*) into v_questions from public.test_questions where test_id in ('pt-py-functions','pt-py-modules-packages','pt-py-file-handling','pt-py-exception-handling','pt-py-oop');
  if v_questions <> 50 then raise exception 'validation: expected 50 new python MCQ rows (5 x 10), found %', v_questions; end if;

  select count(*) into v_problems from public.dsa_problems where id like 'cp-py-functions-%' or id like 'cp-py-modules-packages-%' or id like 'cp-py-file-handling-%' or id like 'cp-py-exception-handling-%' or id like 'cp-py-oop-%';
  if v_problems <> 20 then raise exception 'validation: expected 20 new python coding problems (5 x 4), found %', v_problems; end if;

  raise notice '0051 OK: Python Tutorial Functions/Modules/Files/Exceptions/OOP — 5 topics, 5 mock tests (50 MCQs), 20 coding problems.';
end $$;

notify pgrst, 'reload schema';
