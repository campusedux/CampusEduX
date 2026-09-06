-- admin-panel/supabase/migrations/027_seed_python_tutorial_content.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: mobile-app/supabase/migrations/0050_seed_python_tutorial_content.sql ; apply either, the other is a guarded no-op.
--
-- ============================================================================
-- BODY — seed the "Python Tutorial" Learning grid: 5 topics, each with full
-- notes, a 10-question mock test (10-minute timer), and 4 Python coding problems
-- (mobile 0050_seed_python_tutorial_content.sql == admin 027_seed_python_tutorial_content.sql
--  below this header — byte-identical, guarded, idempotent, additive.)
-- ============================================================================
-- Imports Python Fundamentals / Conditional Statements / Loops / Python Data
-- Structures / Strings into the existing Learning system, exactly following the
-- precedent of 0047/024 (Java Tutorials, notes) and 0049/026 (topic-practice demo,
-- MCQs + coding problems) — no schema, RLS, or app-code change. Uses the existing
-- learning_grids / learning_sections / learning_topics / learning_contents tables,
-- the topic-practice tables from 0048/025 (practice_tests / test_questions /
-- dsa_problems), and the existing admin CMS (Learning + PracticeManager).
--
-- Each of the 5 topics maps 1:1 to one authored chapter file — each chapter already
-- comes with its own complete 10-question MCQ set and 4 coding problems, so nothing
-- here is split or invented beyond what the source content provides. All 20 coding
-- problems are Python-only (supported_languages = ['python']) with a verified,
-- prompt-free stdin/stdout contract matching the judge convention already used by
-- every other dsa_problems row in this project.
--
-- IDEMPOTENT. Re-running never duplicates (topics keyed on (source_kind,source_ref);
-- content on a partial unique index; tests/questions/problems on deterministic ids
-- with on-conflict-do-nothing) and never clobbers an admin's later edits — the grid
-- is only created if absent, and once a test/question/problem exists, only an admin
-- (via Admin ▸ Learning) changes it from here on. First insert = published.
--
-- After this runs, manage everything from Admin ▸ Learning ▸ Python Tutorial
-- (add / edit / delete / reorder / publish / draft, plus MCQs and coding problems
-- via the topic's Practice tab). Website + mobile read the same rows through the
-- learning_* and topic-practice RPCs — no code change, no redeploy.
-- ----------------------------------------------------------------------------

-- ---- ordering guard -----------------------------------------------------
do $guard$
begin
  if to_regclass('public.learning_grids') is null then
    raise exception '0050/027: learning_* not found — apply 0042_learning_management.sql (admin 019) first.';
  end if;
  if to_regprocedure('public.learning_slugify(text)') is null then
    raise exception '0050/027: learning_slugify() not found — apply 0043_merge_notes_into_learning.sql (admin 020) first.';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='learning_topics' and column_name='source_kind'
  ) then
    raise exception '0050/027: learning_topics.source_kind missing — apply 0044_learning_unification.sql (admin 021) first.';
  end if;
  if to_regprocedure('public.learning_topic_practice(text, text, text)') is null then
    raise exception '0050/027: apply 0048_topic_practice.sql (admin 025) first.';
  end if;
end
$guard$;

-- ---- content-block idempotency key (this seed only) --------------------
create unique index if not exists learning_contents_python_seed_key
  on public.learning_contents (topic_id)
  where (metadata ->> 'source') = 'python_tutorial_seed';

-- ===========================================================================
-- 1. GRID — create only if absent; never disturb an admin-configured grid.
-- ===========================================================================
insert into public.learning_grids
  (name, slug, description, icon, grid_type, sort_order,
   status, show_on_website, show_on_mobile, source_kind, source_ref)
values
  ('Python Tutorial', 'python-tutorial',
   $zz1$Complete Python course — fundamentals, conditionals, loops, data structures and strings, with notes, a timed mock test and hands-on Python coding problems for every topic.$zz1$, 
   $zz2$🐍$zz2$, 'content', 60, 'published', true, true, 'seed', 'python_tutorial')
on conflict (lower(slug)) do nothing;

-- ===========================================================================
-- 2. SECTION — one module for now; later chapters (Functions, OOP, ...) get
--    their own sections in a future additive migration.
-- ===========================================================================
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial')
insert into public.learning_sections
  (grid_id, name, slug, description, sort_order, status, show_on_website, show_on_mobile)
select g.id, $zz3$Python Basics$zz3$, $zz4$python-basics$zz4$, $zz5$The five foundational chapters of the course — Python Fundamentals, Conditional Statements, Loops, Python Data Structures, and Strings.$zz5$, 10,
  'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, description = excluded.description,
  sort_order = excluded.sort_order, updated_at = now();

-- ===========================================================================
-- 3. TOPICS + CONTENT — 5 topics, one full notes block each.
-- ===========================================================================

-- Python Basics  ▸  Python Fundamentals
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = 'python-basics'),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $zz6$Python Fundamentals$zz6$, $zz7$python-fundamentals$zz7$, $zz8$What Python is, how to install it and run your first program, plus the core building blocks — variables, constants, every built-in data type, type conversion, input/output and operators — that every Python program is built from.$zz8$, 1,
    'published', true, true, 'python_tutorial', $zz9$python-basics/python-fundamentals$zz9$
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
select up_topic.id, '', $zz10$Welcome to your first step into Python programming. This file covers everything a beginner needs before writing real programs — what Python is, how to set it up, and the basic building blocks (variables, data types, operators) that every single Python program is made of.

Take your time here. Everything later in this course — loops, functions, OOP, even machine learning — is built on top of what you learn in this file.

---

## 1. What is Python?

### What is it?

Python is a programming language — a way of giving instructions to a computer using text that follows specific rules (called syntax). It was created by Guido van Rossum and released in 1991.

What makes Python special is how close it reads to plain English. Look at this line:

```python
print("Hello, World!")
```

Even someone who has never coded before can guess this line displays the text "Hello, World!" on the screen. That readability is Python's biggest strength.

Python is used everywhere today — websites, mobile app backends, data analysis, artificial intelligence, automation scripts, games, and even software that controls hardware. It is one language that can do almost everything a beginner or a professional developer needs.

### Why do we use it?

We use Python because:

- It's easy to learn — the syntax is simple and readable.
- It's versatile — one language for web apps, data science, AI, scripting, automation, and more.
- It has a huge community — if you get stuck, someone has probably already asked (and answered) your question online.
- It has thousands of ready-made libraries — pre-written code you can just import and use instead of writing everything from scratch.
- It's in high demand — Python is consistently one of the top languages companies hire for.

### How does it work?

Python is an **interpreted language**. This means you don't need to "convert" your code into a separate program before running it (unlike languages like C or Java, which need a compilation step). Instead, a program called the **Python interpreter** reads your code line by line and executes it directly.

This makes Python great for beginners — write a line, run it, see the result immediately.

### Real-World Example

- Instagram's backend uses Python (via Django).
- YouTube used Python extensively in its early infrastructure.
- Data scientists use Python daily with libraries like Pandas and NumPy.
- Companies use Python scripts to automate boring repetitive tasks like renaming thousands of files or sending scheduled emails.

### Important Points

- Python is beginner-friendly but powerful enough for large-scale professional software.
- Python code is interpreted, not compiled like C/C++.
- Python is open-source and free to use.
- Python works on Windows, macOS, and Linux.

---

## 2. Why is Python Popular? (Features of Python)

Here are the core features that explain Python's popularity:

| Feature | What it Means |
|---|---|
| Simple & Readable Syntax | Code looks close to English, easy to understand |
| Interpreted | Runs line-by-line, no separate compile step needed |
| Dynamically Typed | You don't need to declare a variable's type in advance |
| Free & Open Source | Anyone can use and modify Python for free |
| Large Standard Library | Comes with built-in tools for many common tasks |
| Huge Ecosystem | Thousands of third-party packages (Flask, Django, NumPy, TensorFlow, etc.) |
| Cross-Platform | Same code runs on Windows, macOS, Linux |
| Community Support | Massive global community, tons of tutorials and forums |

### Python Use Cases

- **Web Development** — Flask, Django, FastAPI
- **Data Analysis & Visualization** — Pandas, Matplotlib, Seaborn
- **Machine Learning & AI** — Scikit-learn, TensorFlow, PyTorch
- **Automation & Scripting** — automating files, emails, Excel sheets
- **Web Scraping** — collecting data from websites
- **Game Development** — Pygame
- **Software Testing** — writing automated test scripts
- **Cybersecurity** — writing security tools and scripts

> **Definition:** Python is a high-level, interpreted, general-purpose programming language known for its simple syntax and wide range of real-world applications.

---

## 3. Installing Python

### What is it?

Before writing Python code, you need the Python interpreter installed on your computer — this is the program that actually reads and runs your `.py` files.

### How does it work? (Step-by-Step)

**Windows / macOS:**
1. Go to [python.org/downloads](https://www.python.org/downloads/)
2. Download the latest stable version (e.g., Python 3.12+)
3. Run the installer.
4. **Important:** On Windows, check the box "Add Python to PATH" before clicking Install.
5. After installation, open a terminal (Command Prompt / Terminal) and type:

```bash
python --version
```

Expected Output:
```
Python 3.12.3
```

If you see a version number, Python is installed correctly.

**Linux:** Most Linux systems already have Python installed. Check with `python3 --version`. If missing, install using your package manager, e.g. `sudo apt install python3`.

### Common Mistakes

- Forgetting to check "Add Python to PATH" on Windows, which causes `'python' is not recognized` errors.
- Installing Python but running the command `python3` when only `python` was set up (or vice versa) — try both if one doesn't work.
- Not restarting the terminal after installation.

### Important Points

- Always install Python 3, not Python 2 (Python 2 is outdated and no longer supported).
- `python --version` or `python3 --version` confirms a successful install.
- Adding Python to PATH lets you run `python` from any folder in the terminal.

---

## 4. The Python Interpreter

### What is it?

The Python interpreter is the program that reads your Python code and executes it. There are two main ways to use it:

1. **Interactive Mode (Python Shell / REPL)** — type one line at a time and see instant results. Great for quick testing.
2. **Script Mode** — write code in a `.py` file and run the whole file at once. This is how real programs are written.

### Simple Example — Interactive Mode

Open your terminal and type `python` (or `python3`), then try:

```python
>>> print(2 + 3)
5
>>> name = "Anita"
>>> print(name)
Anita
```

### Simple Example — Script Mode

Create a file called `hello.py` with this content:

```python
print("Hello, World!")
```

Run it from the terminal:

```bash
python hello.py
```

Output:
```
Hello, World!
```

### Explanation

- `>>>` is the prompt shown in interactive mode — it means Python is waiting for input.
- In script mode, you save code in a file and run the entire file with one command — this is what you'll do for almost all real projects.

### Important Points

- Use interactive mode for quick experiments.
- Use script mode (`.py` files) for actual programs.
- File names should end in `.py` and should not contain spaces (use underscores instead, e.g., `my_program.py`).

---

## 5. Setting Up VS Code for Python

### What is it?

VS Code (Visual Studio Code) is a free, popular code editor that makes writing Python much easier — with features like syntax highlighting, auto-completion, and built-in error detection.

### How does it work? (Step-by-Step)

1. Download VS Code from [code.visualstudio.com](https://code.visualstudio.com/).
2. Install it and open it.
3. Go to the Extensions panel (icon on the left sidebar) and search for **"Python"** (by Microsoft). Click Install.
4. Create a folder for your projects, and open it in VS Code (File → Open Folder).
5. Create a new file, e.g. `main.py`.
6. Write some code and run it using the **Run** button (▶) at the top right, or open a terminal inside VS Code (Terminal → New Terminal) and type `python main.py`.

### Important Points

- The Python extension gives you helpful features like error underlining and auto-suggestions.
- VS Code's built-in terminal lets you run code without switching windows.
- Always save your file (Ctrl+S / Cmd+S) before running it.

---

## 6. Your First Python Program

### Simple Example

```python
# This is my first Python program
print("Hello, World!")
```

Output:
```
Hello, World!
```

### Explanation of the Code

- The line starting with `#` is a **comment** — Python ignores it completely. It's just a note for humans reading the code.
- `print()` is a built-in function that displays whatever is inside its parentheses on the screen.
- The text `"Hello, World!"` is called a **string** — text data, always written inside quotes.

### Real-World Example

Every programming language tutorial starts with a "Hello, World!" program because it confirms your setup works and introduces the most basic building block: displaying output.

### Practice

1. Write a program that prints your own name.
2. Write a program that prints three different lines of text using three separate `print()` statements.

---

## 7. Python Syntax Basics

### What is it?

Syntax refers to the set of rules that define how Python code must be written so the interpreter can understand it.

### Key Syntax Rules

- **Indentation matters.** Python uses indentation (spaces at the start of a line) to define blocks of code, instead of curly braces `{}` like other languages. Standard practice is 4 spaces per indent level.
- **No semicolons required.** Each line is usually one statement (unlike Java or C which end lines with `;`).
- **Case-sensitive.** `Name` and `name` are treated as two different things.

### Simple Example

```python
age = 20

if age >= 18:
    print("You are an adult")   # this line is indented — part of the "if" block
else:
    print("You are a minor")
```

Output:
```
You are an adult
```

### Common Mistakes

- Mixing tabs and spaces for indentation — this causes `IndentationError`. Stick to spaces (VS Code does this automatically).
- Forgetting the colon `:` at the end of lines like `if`, `for`, `while`, and function definitions.
- Inconsistent indentation levels within the same block.

### Important Points

- Indentation is not optional in Python — it defines your program's structure.
- 4 spaces is the standard, community-agreed indentation size (PEP 8 style guide).

---

## 8. Comments

### What is it?

A comment is a line in your code that Python ignores completely. It exists purely to help humans understand the code.

### Why do we use it?

- To explain *why* code does something (not just what it does).
- To temporarily disable a line of code while testing.
- To make code easier for teammates (or future you) to understand.

### Syntax

```python
# This is a single-line comment

"""
This is a multi-line comment,
often called a docstring when used
at the top of a function or file.
"""
```

### Simple Example

```python
# Calculate the area of a rectangle
length = 5
width = 3
area = length * width   # multiply length and width
print(area)
```

Output:
```
15
```

### Common Mistakes

- Over-commenting obvious code (e.g., `x = 5  # set x to 5` adds no value).
- Under-commenting complex logic that genuinely needs explanation.
- Leaving outdated comments that no longer match the actual code.

### Important Points

- Comments start with `#` for single lines.
- Triple quotes `"""..."""` are used for multi-line comments/docstrings.
- Good comments explain *why*, not just *what*.

### Practice

1. Write a program with at least 3 comments explaining each step of a simple calculation.

---

## 9. Variables

### What is it?

A variable is a name that refers to a value stored in the computer's memory. Think of it as a labeled box where you can keep some data and refer to it later using its label (name).

> **Definition:** A variable is a named location used to store data that can be used and changed later in a program.

### Why do we use it?

Without variables, you'd have to retype values every single time you need them. Variables let you store a value once and reuse it, update it, or pass it around your program.

### How does it work?

In Python, you create a variable simply by assigning a value to a name using `=`. Python figures out the data type automatically — you don't need to declare it in advance.

### Syntax

```python
variable_name = value
```

### Simple Example

```python
student_name = "Rahul"
student_age = 21
print(student_name)
print(student_age)
```

Output:
```
Rahul
21
```

### Explanation of the Code

- `student_name = "Rahul"` creates a variable named `student_name` and stores the text `"Rahul"` in it.
- `student_age = 21` creates another variable holding the number `21`.
- `print()` displays the current value stored in each variable.

### Real-World Example

In a college portal application, variables would store things like `student_name`, `roll_number`, `marks`, or `attendance_percentage` — each piece of information the program needs to work with.

### Rules for Naming Variables

- Must start with a letter or underscore (not a number).
- Can only contain letters, numbers, and underscores (no spaces or special symbols).
- Cannot be a Python keyword (like `if`, `for`, `class`).
- Case-sensitive: `age` and `Age` are different variables.
- Should be descriptive: `marks` is better than `m`.

### Common Mistakes

- Starting a variable name with a number: `2name = "Aditi"` → `SyntaxError`.
- Using spaces in variable names: `student name = "Aditi"` → error. Use `student_name` instead.
- Using Python keywords as variable names, e.g. `class = "A"` → error.
- Forgetting that Python is case-sensitive, causing confusing bugs (`Name` vs `name`).

### Important Points

- No need to declare a variable's type — Python infers it automatically.
- A variable's value can be changed anytime by reassigning it.
- Use meaningful, descriptive variable names — this is a core best practice in real jobs.
- By convention, Python variable names use `snake_case` (lowercase with underscores), e.g. `total_marks`.

### Practice

1. Create variables to store your name, age, and city, then print all three.
2. Create a variable `price = 100`, then update it to `150` and print both values (before and after).

---

## 10. Constants

### What is it?

A constant is a value that is not supposed to change while the program runs — for example, the value of pi, or the number of days in a week.

### Why do we use it?

Constants make code more readable and safer. If a special value is used in many places (like a tax rate), giving it a clearly named constant avoids "magic numbers" scattered through the code and mistakes when updating that value later.

### How does it work?

Python does **not** have a built-in way to enforce that a value truly cannot change (unlike some other languages). Instead, Python programmers follow a **convention**: constant names are written in ALL_CAPS to signal "please don't change this."

### Syntax

```python
CONSTANT_NAME = value
```

### Simple Example

```python
PI = 3.14159
GST_RATE = 0.18

radius = 5
area = PI * radius * radius
print("Area:", area)
```

Output:
```
Area: 78.53975
```

### Explanation of the Code

- `PI` is written in capital letters to show it's meant to stay constant.
- Nothing technically stops you from changing `PI` later, but by convention, other developers know not to.

### Real-World Example

An e-commerce app might define `TAX_RATE = 0.18` once at the top of the program and use it everywhere tax needs to be calculated, instead of typing `0.18` repeatedly.

### Common Mistakes

- Assuming Python actually prevents changing a constant's value — it doesn't; it's only a naming convention.
- Not using ALL_CAPS, which makes it hard for others to recognize a value is meant to be constant.

### Important Points

- Python has no real "constant" keyword — it's purely a naming convention (ALL_CAPS).
- Constants are usually defined once, near the top of a file.
- Common examples: `PI`, `MAX_USERS`, `TAX_RATE`.

### Practice

1. Define a constant `SPEED_OF_LIGHT = 299792458` and use it in a simple calculation.

---

## 11. Data Types in Python

Python has several built-in data types. We'll cover each one separately, since each behaves differently.

### 11.1 Integers (`int`)

**What is it?** Whole numbers, without a decimal point — positive, negative, or zero.

**Syntax & Example:**
```python
age = 25
temperature = -5
print(age, temperature)
```
Output:
```
25 -5
```

**Real-World Example:** Counting items in a cart, storing someone's age, storing a bank account number.

**Common Mistakes:** Writing numbers with commas like `1,000` (invalid in Python) — use `1000` or `1_000` instead.

**Important Points:**
- No size limit — Python integers can be arbitrarily large.
- Check type using `type(age)` → `<class 'int'>`.

---

### 11.2 Floating-Point Numbers (`float`)

**What is it?** Numbers that contain a decimal point — used for values needing fractional precision.

**Syntax & Example:**
```python
price = 99.99
pi_value = 3.14
print(price, pi_value)
```
Output:
```
99.99 3.14
```

**Real-World Example:** Product prices, temperature readings, GPA/percentage calculations.

**Common Mistakes:** Expecting floats to be perfectly precise — due to how computers store decimals, `0.1 + 0.2` gives `0.30000000000000004`, not exactly `0.3`. This is normal and expected in almost every programming language.

**Important Points:**
- Use `round(value, 2)` to round a float to 2 decimal places when needed.
- Type check: `type(price)` → `<class 'float'>`.

---

### 11.3 Complex Numbers (`complex`)

**What is it?** Numbers with a real and an imaginary part, written as `a + bj`. Mostly used in scientific/engineering calculations — rare in everyday beginner programs, but good to know it exists.

**Syntax & Example:**
```python
z = 3 + 4j
print(z)
print(z.real)
print(z.imag)
```
Output:
```
(3+4j)
3.0
4.0
```

**Important Points:**
- `j` represents the imaginary unit in Python (instead of `i` used in math).
- Rarely used outside scientific computing.

---

### 11.4 Strings (`str`)

**What is it?** Text data — any sequence of characters, written inside quotes.

**Syntax & Example:**
```python
name = "Priya"
message = 'Hello there!'
print(name)
print(message)
```
Output:
```
Priya
Hello there!
```

**Real-World Example:** Names, addresses, messages, product descriptions — almost every app deals with text.

**Common Mistakes:**
- Forgetting to close a quote: `name = "Priya` → `SyntaxError`.
- Mixing quote types incorrectly: `'Hello"` → error.

**Important Points:**
- Both single `'...'` and double `"..."` quotes work the same way — pick one style and stay consistent.
- Strings are covered in much more depth in the dedicated Strings file (03-strings equivalent, file 05 in our roadmap).

---

### 11.5 Boolean (`bool`)

**What is it?** A data type with only two possible values: `True` or `False`. Used to represent yes/no, on/off type decisions.

**Syntax & Example:**
```python
is_student = True
is_working = False
print(is_student)
print(10 > 5)
```
Output:
```
True
9 > 5 evaluates to: True
```
*(Note: `10 > 5` prints as `True`)*

**Real-World Example:** `is_logged_in`, `is_available`, `has_paid` — booleans drive almost every decision (`if`) in real programs.

**Common Mistakes:** Writing `true`/`false` in lowercase — Python requires `True`/`False` with a capital first letter.

**Important Points:**
- `True` behaves like `1` and `False` behaves like `0` in calculations.
- Type check: `type(is_student)` → `<class 'bool'>`.

---

### 11.6 `None`

**What is it?** A special value representing "nothing" or "no value assigned yet." It is Python's way of saying "empty" — different from `0`, `False`, or an empty string `""`.

**Syntax & Example:**
```python
result = None
print(result)
```
Output:
```
None
```

**Real-World Example:** A variable to hold a search result before the search has actually run, or a user's middle name field if they didn't provide one.

**Common Mistakes:** Confusing `None` with `0` or `False` — they are different types entirely (`None` means "no value," not "zero" or "false").

**Important Points:**
- `None` is its own data type (`NoneType`).
- Commonly used as a default/placeholder value.
- Check with `if result is None:` (use `is`, not `==`, when comparing to `None` — this is a Python best practice).

---

### Comparison Table — Data Types at a Glance

| Type | Example | Use Case |
|---|---|---|
| `int` | `25` | Counting, whole numbers |
| `float` | `99.99` | Prices, measurements |
| `complex` | `3+4j` | Scientific/engineering math |
| `str` | `"Hello"` | Text |
| `bool` | `True` | Yes/no decisions |
| `NoneType` | `None` | Absence of a value |

### Practice

1. Create one variable of each data type covered above and print each one along with its type using `type()`.
2. What is the difference between `None` and `0`? Write one sentence explaining it.

---

## 12. Type Conversion

### What is it?

Type conversion (also called type casting) means converting a value from one data type to another — for example, turning the text `"25"` into the number `25`.

### Why do we use it?

Data often arrives in the "wrong" type for what you need. For instance, input from a user always arrives as a string, even if it looks like a number — you must convert it to `int` or `float` before doing math with it.

### How does it work?

Python provides built-in functions for conversion: `int()`, `float()`, `str()`, `bool()`.

### Simple Example

```python
age_text = "25"          # this is a string
age_number = int(age_text)  # convert to integer

print(age_number + 5)
print(type(age_number))
```

Output:
```
30
<class 'int'>
```

### Explanation of the Code

- `age_text` holds the string `"25"` — you cannot do math directly on it.
- `int(age_text)` converts it into the actual number `25`.
- Now `age_number + 5` works correctly and gives `30`.

### More Examples

```python
print(float("3.14"))     # "3.14" -> 3.14
print(str(100))          # 100 -> "100"
print(int(9.8))          # 9.8 -> 9 (decimal part is dropped, not rounded!)
print(bool(0))            # 0 -> False
print(bool(5))            # 5 -> True
```

### Common Mistakes

- Trying to convert non-numeric text to a number: `int("hello")` → `ValueError`.
- Assuming `int(9.8)` rounds to `10` — it actually **truncates** (cuts off) the decimal, giving `9`. Use `round(9.8)` if you want proper rounding.
- Forgetting to convert user input (from `input()`) before doing math — `input()` always returns a string.

### Important Points

- `int()`, `float()`, `str()`, `bool()` are the main conversion functions.
- Converting text that isn't a valid number causes a `ValueError`.
- `int()` on a float truncates, it does not round.

### Practice

1. Convert the string `"45.6"` into a float and then into an integer. What do you get at each step?
2. Take two numbers as text: `"10"` and `"20"`, convert both to integers, and print their sum.

---

## 13. Input and Output

### What is it?

- **Output** means displaying information to the user — done using `print()`.
- **Input** means receiving information typed by the user — done using `input()`.

### Why do we use it?

Real programs are interactive — they need to ask the user for information (like a name or a choice) and respond back. Input/output is what makes a program feel alive instead of just running the same fixed steps every time.

### Syntax

```python
print(value1, value2, ...)
variable = input("Prompt message: ")
```

### Simple Example

```python
name = input("What is your name? ")
print("Hello,", name)
```

Sample Interaction:
```
What is your name? Sneha
Hello, Sneha
```

### Explanation of the Code

- `input("What is your name? ")` displays the prompt text and waits for the user to type something and press Enter.
- Whatever the user types is stored in the variable `name`, **always as a string**.
- `print("Hello,", name)` displays two values separated automatically by a space.

### Real-World Example

A login form asks for a username and password (input), then displays a welcome message or error (output).

### Common Mistakes

- Forgetting that `input()` **always** returns a string — even if the user types a number, you must convert it: `age = int(input("Enter your age: "))`.
- Forgetting the space at the end of a prompt string, leading to output like `Enter name:John` (no space before the user's typed text).

### Important Points

- `input()` always returns type `str`.
- `print()` can take multiple values separated by commas — Python automatically adds a space between them.
- Use `print(f"Hello, {name}")` (f-strings) for cleaner formatting — covered in detail in the Strings file.

### Practice

1. Ask the user for their age using `input()`, convert it to an integer, and print "You will turn 30 in X years" (calculate X).
2. Ask for two numbers separately and print their sum.

---

## 14. Operators

### What is it?

Operators are special symbols that perform operations on values (called operands) — like addition, comparison, or logical checks.

### 14.1 Arithmetic Operators

| Operator | Meaning | Example | Result |
|---|---|---|---|
| `+` | Addition | `5 + 3` | `8` |
| `-` | Subtraction | `5 - 3` | `2` |
| `*` | Multiplication | `5 * 3` | `15` |
| `/` | Division (always float) | `5 / 2` | `2.5` |
| `//` | Floor Division (rounds down) | `5 // 2` | `2` |
| `%` | Modulus (remainder) | `5 % 2` | `1` |
| `**` | Exponent (power) | `5 ** 2` | `25` |

```python
print(10 / 3)    # 3.3333333333333335
print(10 // 3)   # 3
print(10 % 3)    # 1
```

### 14.2 Comparison Operators

| Operator | Meaning |
|---|---|
| `==` | Equal to |
| `!=` | Not equal to |
| `>` | Greater than |
| `<` | Less than |
| `>=` | Greater than or equal to |
| `<=` | Less than or equal to |

```python
print(5 == 5)   # True
print(5 != 3)   # True
```

### 14.3 Logical Operators

| Operator | Meaning |
|---|---|
| `and` | True only if both conditions are True |
| `or` | True if at least one condition is True |
| `not` | Reverses the result (True → False) |

```python
age = 20
has_id = True
print(age >= 18 and has_id)   # True
```

### 14.4 Assignment Operators

| Operator | Example | Same As |
|---|---|---|
| `=` | `x = 5` | assigns 5 to x |
| `+=` | `x += 3` | `x = x + 3` |
| `-=` | `x -= 3` | `x = x - 3` |
| `*=` | `x *= 3` | `x = x * 3` |
| `/=` | `x /= 3` | `x = x / 3` |

### 14.5 Identity and Membership Operators

```python
a = [1, 2, 3]
b = [1, 2, 3]

print(a == b)   # True  -> values are equal
print(a is b)   # False -> they are different objects in memory

print(2 in a)      # True
print(5 not in a)  # True
```

**Important distinction:** `==` checks if **values** are equal. `is` checks if two variables point to the **exact same object** in memory. This is a very common interview question.

### Comparison Table — `==` vs `is`

| | `==` | `is` |
|---|---|---|
| Checks | Value equality | Same object in memory |
| Common use | Comparing numbers, strings, lists | Comparing to `None`, checking identity |

### Common Mistakes

- Using `=` (assignment) when you meant `==` (comparison) — a very frequent beginner bug: `if age = 18:` is a `SyntaxError`; it should be `if age == 18:`.
- Confusing `/` (always gives float) with `//` (floor division, drops decimal).
- Using `==` to compare with `None` instead of `is None` (best practice is `is None`).

### Important Points

- `/` always returns a float, even if the result is a whole number (`10 / 2` → `5.0`).
- `//` performs floor division, rounding down to the nearest whole number.
- `and`, `or`, `not` are written as plain English words in Python (not `&&`, `||` like some other languages).

### Practice

1. Given `a = 15` and `b = 4`, print the result of every arithmetic operator between them.
2. Write a program that checks if a number is both greater than 10 **and** even, using `and`.
3. Explain in your own words the difference between `==` and `is`.

---

## 15. Expressions

### What is it?

An expression is any valid combination of values, variables, and operators that Python can evaluate to produce a single result.

### Simple Example

```python
length = 10
width = 5
area = length * width   # "length * width" is an expression
print(area)
```
Output:
```
50
```

### Explanation

- `length * width` is the expression — Python evaluates it and produces the value `50`.
- `area = length * width` is a **statement** (a full instruction) that stores the expression's result in a variable.

### Important Points

- Expressions always produce a value.
- Statements are complete instructions (which may contain expressions inside them).
- Complex expressions can combine multiple operators, following the normal order of operations (BODMAS/PEMDAS): parentheses first, then exponents, then multiplication/division, then addition/subtraction.

```python
result = (2 + 3) * 4 - 5 ** 2
print(result)   # (5 * 4) - 25 = 20 - 25 = -5
```

### Practice

1. Evaluate `10 + 2 * 3 - 4 / 2` by hand, then verify with Python.

---

## Common Beginner Mistakes — Summary for This Section

- Using `=` instead of `==` for comparison.
- Forgetting `input()` returns a string, causing errors when doing math on it.
- Mixing tabs and spaces for indentation.
- Assuming Python "rounds" when converting float to int (it truncates).
- Using lowercase `true`/`false` instead of `True`/`False`.

---

## Cheat Sheet — Python Fundamentals

```python
# Variables
name = "Aditi"
age = 21

# Data types
type(name)     # str
type(age)      # int

# Type conversion
int("10")
float("3.14")
str(100)

# Input / Output
value = input("Enter something: ")
print("Output:", value)

# Operators
+  -  *  /  //  %  **      # arithmetic
== != > < >= <=            # comparison
and or not                 # logical
= += -= *= /=               # assignment
is  in                     # identity / membership
```

---

## Mini Project: Simple Calculator

**Objective:** Build a calculator that takes two numbers and an operator from the user, then displays the result.

**Requirements:**
- Take two numbers as input.
- Take an operator (`+`, `-`, `*`, `/`) as input.
- Display the correct result.

**Concepts Used:** variables, input/output, type conversion, operators, conditionals (basic `if`/`elif`).

**Complete Code:**

```python
# Simple Calculator

num1 = float(input("Enter first number: "))
num2 = float(input("Enter second number: "))
operator = input("Enter operator (+, -, *, /): ")

if operator == "+":
    result = num1 + num2
elif operator == "-":
    result = num1 - num2
elif operator == "*":
    result = num1 * num2
elif operator == "/":
    if num2 == 0:
        result = "Error: Division by zero"
    else:
        result = num1 / num2
else:
    result = "Invalid operator"

print("Result:", result)
```

**Sample Output:**
```
Enter first number: 10
Enter second number: 5
Enter operator (+, -, *, /): +
Result: 15.0
```

**Possible Improvements:**
- Loop the calculator so it keeps running until the user chooses to exit.
- Add support for more operators like `%` and `**`.

**Challenge Task:** Modify the calculator to keep a running history of all calculations performed in the session.

---

## Interview Questions

**Q1. What type of language is Python — compiled or interpreted?**
Answer: Python is an interpreted language. Code is read and executed line by line by the Python interpreter, rather than being compiled into machine code beforehand.

**Q2. Is Python statically typed or dynamically typed?**
Answer: Dynamically typed — you don't need to declare a variable's type; Python figures it out automatically based on the assigned value, and a variable's type can even change if reassigned.

**Q3. What is the difference between `/` and `//`?**
Answer: `/` performs regular division and always returns a float. `//` performs floor division and returns the result rounded down to the nearest whole number.

**Q4. What does `input()` return?**
Answer: `input()` always returns a string, even if the user types a number. It must be manually converted using `int()` or `float()` if numeric operations are needed.

**Q5. What is the difference between `==` and `is`?**
Answer: `==` compares values for equality. `is` checks whether two variables refer to the exact same object in memory.

**Q6. What is `None` in Python?**
Answer: `None` is a special value representing the absence of a value. It is its own data type (`NoneType`) and is different from `0`, `False`, or an empty string.

---

## Practice Questions

**Beginner**
1. Write a program that stores your name and age in variables and prints them together.
2. Convert the string `"100"` to an integer and add 50 to it.
3. Take two numbers as input and print their product.
4. Create a boolean variable and print its type.
5. Print the result of `17 % 4` and explain what it means.

**Intermediate**
1. Write a program that takes a temperature in Celsius as input and converts it to Fahrenheit (`F = C * 9/5 + 32`).
2. Write a program that swaps the values of two variables without using a third variable.
3. Take a user's height in centimeters and convert it to feet and inches.
4. Write a program that checks whether a number is even using the modulus operator.
5. Ask the user for two numbers and print whether the first is greater, smaller, or equal to the second.

**Challenge**
1. Write a program that takes the radius of a circle and calculates its area and circumference (use `PI = 3.14159` as a constant).
2. Write a program that takes a person's birth year and current year as input and calculates their age, printing whether they are a minor or an adult.
3. Modify the Mini Project calculator to also handle the `%` and `**` operators.
$zz10$, 'markdown',
  jsonb_build_object('source', 'python_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'python_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Python Basics  ▸  Conditional Statements
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = 'python-basics'),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $zz11$Conditional Statements$zz11$, $zz12$conditional-statements$zz12$, $zz13$How Python programs make decisions — if, if-else, if-elif-else, nested conditions, the ternary operator, and Python 3.10's match-case pattern matching.$zz13$, 2,
    'published', true, true, 'python_tutorial', $zz14$python-basics/conditional-statements$zz14$
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
select up_topic.id, '', $zz15$Programs rarely do just one fixed thing — they need to make decisions. Should the user be let into the app? Is this number positive or negative? Did the student pass or fail? Conditional statements are how Python makes these decisions.

---

## 1. What are Conditional Statements?

### What is it?

A conditional statement lets your program choose between different paths of action depending on whether something is `True` or `False`.

> **Definition:** A conditional statement executes a block of code only if a specified condition is true.

### Why do we use it?

Real-world logic is full of "if this, then that" situations:
- If age is 18 or above, allow voting.
- If password is correct, log the user in.
- If marks are above 40, mark the student as "Pass."

Without conditionals, a program would just run every line the same way every time, regardless of the situation — which isn't how real software works.

### How does it work?

Python checks the condition (an expression that evaluates to `True` or `False`). If it's `True`, the indented block underneath runs. If it's `False`, that block is skipped.

---

## 2. The `if` Statement

### Syntax

```python
if condition:
    # code that runs only if condition is True
```

### Simple Example

```python
age = 20

if age >= 18:
    print("You are eligible to vote")
```

Output:
```
You are eligible to vote
```

### Explanation of the Code

- `age >= 18` is the condition — it evaluates to `True` since `20 >= 18`.
- Because the condition is `True`, the indented `print()` line runs.
- If `age` were `15`, nothing would print at all — the program would simply move on.

### Real-World Example

Age verification on a voting or alcohol-purchase app: "If age >= 18, allow access."

### Common Mistakes

- Forgetting the colon `:` at the end of the `if` line.
- Forgetting to indent the block under `if` — Python will raise an `IndentationError`.
- Using `=` instead of `==` inside the condition.

### Important Points

- The condition must evaluate to a boolean (`True`/`False`).
- Only the indented lines belong to the `if` block.
- An `if` without a matching `else` simply does nothing when the condition is `False`.

### Practice

1. Write a program that prints "You can drive" if the age entered is 18 or above.

---

## 3. `if-else`

### Syntax

```python
if condition:
    # runs if condition is True
else:
    # runs if condition is False
```

### Simple Example

```python
age = 15

if age >= 18:
    print("You are eligible to vote")
else:
    print("You are not eligible to vote")
```

Output:
```
You are not eligible to vote
```

### Explanation

- Since `15 >= 18` is `False`, Python skips the `if` block and runs the `else` block instead.
- Exactly one of the two blocks always runs — never both, never neither.

### Real-World Example — Login Validation

```python
correct_password = "python123"
entered_password = input("Enter password: ")

if entered_password == correct_password:
    print("Login successful")
else:
    print("Incorrect password")
```

### Common Mistakes

- Adding a condition after `else` (`else condition:`) — `else` never takes a condition; `elif` does.
- Misaligned indentation between the `if` and `else` blocks.

### Important Points

- `else` always pairs with the closest unmatched `if`.
- Use `if-else` whenever there are exactly two possible outcomes.

### Practice

1. Write a program that checks if a number is even or odd and prints the appropriate message.

---

## 4. `if-elif-else`

### What is it?

Used when there are more than two possible outcomes to check, one after another.

### Syntax

```python
if condition1:
    # block 1
elif condition2:
    # block 2
elif condition3:
    # block 3
else:
    # default block
```

### Simple Example — Student Grades

```python
marks = 72

if marks >= 90:
    grade = "A"
elif marks >= 75:
    grade = "B"
elif marks >= 60:
    grade = "C"
elif marks >= 40:
    grade = "D"
else:
    grade = "Fail"

print("Grade:", grade)
```

Output:
```
Grade: C
```

### Explanation of the Code

- Python checks each condition **from top to bottom**.
- `marks >= 90` is `False`, so it moves on. `marks >= 75` is also `False`.
- `marks >= 60` is `True` (72 >= 60), so `grade = "C"` runs, and Python **stops checking** the rest — it never looks at the remaining `elif`/`else`.

### Real-World Example — Electricity Bill Slabs

```python
units = 250

if units <= 100:
    bill = units * 3
elif units <= 200:
    bill = 100 * 3 + (units - 100) * 5
else:
    bill = 100 * 3 + 100 * 5 + (units - 200) * 8

print("Electricity Bill: Rs.", bill)
```

Output:
```
Electricity Bill: Rs. 1150
```

### Real-World Example — Menu Selection

```python
print("1. Coffee - Rs.50")
print("2. Tea - Rs.30")
print("3. Juice - Rs.60")

choice = int(input("Enter your choice: "))

if choice == 1:
    print("You ordered Coffee")
elif choice == 2:
    print("You ordered Tea")
elif choice == 3:
    print("You ordered Juice")
else:
    print("Invalid choice")
```

### Common Mistakes

- Writing overlapping conditions in the wrong order — e.g., checking `marks >= 40` **before** `marks >= 60`, which would wrongly grade a 72 as a "D" (because the first matching condition wins and stops the chain). Always order conditions from most specific / highest value to least.
- Forgetting the final `else` to catch unexpected values.

### Important Points

- Only **one** block in an `if-elif-else` chain ever runs — the first one whose condition is `True`.
- Order matters — always arrange conditions logically (usually highest to lowest, or most specific to most general).

### Practice

1. Write a grading program using your own grade boundaries.
2. Write a menu-based program with at least 4 options and a message for invalid input.

---

## 5. Nested Conditions

### What is it?

A nested condition is an `if` statement placed inside another `if` (or `else`) block — used when a decision depends on more than one level of checking.

### Simple Example

```python
age = 20
has_id = True

if age >= 18:
    if has_id:
        print("Entry allowed")
    else:
        print("ID required for entry")
else:
    print("Entry not allowed - underage")
```

Output:
```
Entry allowed
```

### Explanation of the Code

- The outer `if` checks age first.
- Only if the outer condition is `True` does Python even look at the inner `if has_id:` check.
- This models real logic: age is checked first; ID is only relevant if the person is already old enough.

### Real-World Example

A movie ticket booking system might check: is the movie rated correctly for the age group? If yes, is a valid ID also provided? Both conditions must be checked in sequence.

### Common Mistakes

- Over-nesting (5+ levels deep), which makes code hard to read. Often, combining conditions with `and` is cleaner:
```python
if age >= 18 and has_id:
    print("Entry allowed")
```
- Incorrect indentation between nested levels — easy to lose track of which block belongs to which `if`.

### Important Points

- Nested conditions are useful, but too much nesting hurts readability — prefer `and`/`or` when the logic allows it.
- Each nested level needs its own consistent indentation (usually 4 more spaces per level).

### Practice

1. Write a nested condition that checks if a number is positive, and if so, whether it's even or odd.

---

## 6. The Ternary (Conditional) Operator

### What is it?

A shorter, one-line way of writing simple `if-else` logic, when you just need to assign one of two values based on a condition.

### Syntax

```python
value = true_result if condition else false_result
```

### Simple Example

```python
age = 20
status = "Adult" if age >= 18 else "Minor"
print(status)
```

Output:
```
Adult
```

### Explanation

- This is exactly equivalent to writing a full `if-else` block, just condensed to one line.
- Read it as: "give me `true_result` **if** the condition is true, **else** give me `false_result`."

### Real-World Example

```python
marks = 35
result = "Pass" if marks >= 40 else "Fail"
print(result)
```

### Common Mistakes

- Trying to cram complex, multi-condition logic into a ternary expression, making it unreadable. If it doesn't fit cleanly on one line, use a regular `if-else` instead.

### Important Points

- Best used for simple, single-condition value assignments.
- Not meant to replace `if-elif-else` chains with many branches.

### Practice

1. Use a ternary operator to assign `"Even"` or `"Odd"` to a variable based on a number.

---

## 7. `match-case` (Structural Pattern Matching)

### What is it?

Introduced in Python 3.10, `match-case` is Python's version of a "switch statement" found in other languages — a cleaner way to compare one value against several possible patterns.

### Syntax

```python
match value:
    case pattern1:
        # code
    case pattern2:
        # code
    case _:
        # default case (like "else")
```

### Simple Example — Menu Selection

```python
choice = 2

match choice:
    case 1:
        print("You ordered Coffee")
    case 2:
        print("You ordered Tea")
    case 3:
        print("You ordered Juice")
    case _:
        print("Invalid choice")
```

Output:
```
You ordered Tea
```

### Explanation of the Code

- `match choice:` starts the comparison.
- Python checks `choice` against each `case` in order and runs the first matching block.
- `case _:` is the default — it matches anything not caught by earlier cases (similar to `else`).

### Real-World Example

`match-case` is great for menu systems, command interpreters, or handling different types of API responses (`"success"`, `"error"`, `"pending"`).

```python
status = "error"

match status:
    case "success":
        print("Operation completed")
    case "error":
        print("Something went wrong")
    case "pending":
        print("Still processing")
    case _:
        print("Unknown status")
```

### Common Mistakes

- Forgetting the default `case _:`, which means unmatched values simply do nothing.
- Using `match-case` for very simple two-way decisions where a normal `if-else` would be clearer.

### Important Points

- `match-case` requires **Python 3.10 or newer**.
- `case _:` is the catch-all default pattern.
- It's often cleaner than a long `if-elif` chain when comparing one variable against many fixed values.

### Practice

1. Rewrite the menu selection example from Section 4 using `match-case` instead of `if-elif-else`.

---

## Comparison Table — Choosing the Right Conditional Tool

| Situation | Best Tool |
|---|---|
| One simple check | `if` |
| Exactly two outcomes | `if-else` |
| Many possible outcomes (ranges) | `if-elif-else` |
| Assigning one of two values in one line | Ternary operator |
| Comparing one variable against many fixed values | `match-case` |
| Decision depends on more than one separate check | Nested `if` or `and`/`or` |

---

## Common Beginner Mistakes — Summary

- Using `=` instead of `==` inside conditions.
- Forgetting the colon `:` after `if`, `elif`, `else`.
- Wrong indentation, causing `IndentationError`.
- Ordering `elif` conditions incorrectly (e.g., checking a lower threshold before a higher one).
- Over-nesting `if` statements instead of using `and`/`or`.

---

## Cheat Sheet — Conditional Statements

```python
if condition:
    ...
elif condition2:
    ...
else:
    ...

# Nested
if condition1:
    if condition2:
        ...

# Ternary
value = a if condition else b

# match-case (Python 3.10+)
match value:
    case pattern:
        ...
    case _:
        ...
```

---

## Interview Questions

**Q1. What is the difference between `if-else` and `if-elif-else`?**
Answer: `if-else` handles exactly two possible outcomes. `if-elif-else` handles multiple possible outcomes, checked in order, where only the first matching condition's block runs.

**Q2. What happens if none of the conditions in an `if-elif-else` chain are true and there is no `else`?**
Answer: Nothing runs — the program simply continues to the next line after the chain.

**Q3. What is the ternary operator used for?**
Answer: A compact one-line way to assign one of two values based on a condition, equivalent to a simple `if-else`.

**Q4. What is `match-case` and when was it introduced?**
Answer: It's Python's structural pattern matching feature (similar to switch-case in other languages), introduced in Python 3.10, used to compare a value against multiple patterns cleanly.

**Q5. Can you use `and`/`or` instead of nested `if` statements?**
Answer: Yes — for simple combined conditions, `if age >= 18 and has_id:` is often cleaner and more readable than nesting two separate `if` blocks.

---

## Practice Questions

**Beginner**
1. Write a program that checks if a number is positive, negative, or zero.
2. Write a program to check if a person is eligible to vote (age >= 18).
3. Write a program that checks if a character entered is a vowel.
4. Write a program that checks if a year is a leap year.
5. Write a program using the ternary operator to find the larger of two numbers.

**Intermediate**
1. Write a program that takes marks and prints a grade using `if-elif-else` (A/B/C/D/Fail).
2. Write a login system that checks both username and password using nested conditions.
3. Write a program that calculates an electricity bill using slab-based `elif` conditions.
4. Write a program that classifies a triangle as equilateral, isosceles, or scalene based on three side lengths.
5. Write a menu-driven program using `match-case` with at least 4 options.

**Challenge**
1. Write a program that checks if a number is divisible by both 3 and 5, only 3, only 5, or neither — using appropriate conditions.
2. Build a simple traffic light simulator: given a color ("red", "yellow", "green") using `match-case`, print the correct action ("Stop", "Get Ready", "Go").
3. Write a BMI calculator that takes height and weight, calculates BMI, and prints the category (Underweight/Normal/Overweight/Obese) using `if-elif-else`.
$zz15$, 'markdown',
  jsonb_build_object('source', 'python_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'python_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Python Basics  ▸  Loops
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = 'python-basics'),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $zz16$Loops$zz16$, $zz17$loops$zz17$, $zz18$Repeating code with for and while loops, range(), nested loops for patterns, and the break / continue / pass / loop-else control-flow tools.$zz18$, 3,
    'published', true, true, 'python_tutorial', $zz19$python-basics/loops$zz19$
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
select up_topic.id, '', $zz20$So far, every program you've written runs each line exactly once. But real programs often need to repeat an action — printing every item in a list, checking every student's marks, or asking a user to guess a number until they get it right. That's what loops are for.

---

## 1. What are Loops?

### What is it?

A loop is a block of code that repeats itself as long as a certain condition holds true (or for a fixed number of times).

> **Definition:** A loop is a programming structure that repeats a block of code multiple times without rewriting it manually.

### Why do we use it?

Without loops, printing numbers 1 to 100 would mean writing 100 separate `print()` statements. Loops let you write the instruction once and tell Python how many times (or under what condition) to repeat it.

### How does it work?

Python offers two main loop types:
- **`for` loop** — repeats a fixed number of times, or once for each item in a sequence (like a list or range of numbers).
- **`while` loop** — repeats as long as a condition stays `True`, without necessarily knowing in advance how many times.

---

## 2. The `for` Loop

### Syntax

```python
for variable in sequence:
    # code to repeat
```

### Simple Example

```python
for i in range(5):
    print(i)
```

Output:
```
0
1
2
3
4
```

### Explanation of the Code

- `range(5)` generates the sequence of numbers `0, 1, 2, 3, 4` (starting at 0, stopping before 5).
- The loop runs once for each value, storing it in `i` each time.
- `print(i)` runs 5 times total, once per value.

### Real-World Example

Printing every student's name from a list of registered students, or processing every order in today's sales list.

```python
students = ["Riya", "Aman", "Zara"]

for student in students:
    print("Hello,", student)
```

Output:
```
Hello, Riya
Hello, Aman
Hello, Zara
```

### Common Mistakes

- Forgetting that `range(5)` starts at `0` and stops **before** `5` (so it gives 5 values: 0–4, not 1–5).
- Forgetting the colon `:` at the end of the `for` line.

### Important Points

- `for` loops are best when you know (or can generate) the sequence you want to loop over.
- You can loop directly over lists, strings, and other collections — not just numbers.

### Practice

1. Write a `for` loop that prints numbers from 1 to 10.
2. Write a `for` loop that prints each letter of the word `"PYTHON"` on a separate line.

---

## 3. Understanding `range()`

### What is it?

`range()` generates a sequence of numbers, most commonly used to control how many times a `for` loop runs.

### Syntax

```python
range(stop)               # 0 to stop-1
range(start, stop)        # start to stop-1
range(start, stop, step)  # start to stop-1, jumping by step
```

### Simple Examples

```python
print(list(range(5)))          # [0, 1, 2, 3, 4]
print(list(range(2, 8)))       # [2, 3, 4, 5, 6, 7]
print(list(range(0, 10, 2)))   # [0, 2, 4, 6, 8]
print(list(range(10, 0, -1)))  # [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
```

### Explanation

- `range(5)` starts at 0 by default and stops **before** the given number.
- Adding a `start` value changes where counting begins.
- The third value, `step`, controls the jump size — and can be negative to count downward.

### Common Mistakes

- Expecting `range(1, 10)` to include `10` — it stops at `9`.
- Forgetting a negative `step` when trying to count backward — `range(10, 0)` alone produces an **empty** sequence; you need `range(10, 0, -1)`.

### Important Points

- `range()` doesn't create a full list in memory by default — it's a memory-efficient sequence generator. Wrap it in `list()` only when you want to see/print all values at once.

### Practice

1. Use `range()` to print all even numbers from 2 to 20.
2. Use `range()` to print numbers from 10 down to 1.

---

## 4. The `while` Loop

### Syntax

```python
while condition:
    # code to repeat while condition is True
```

### Simple Example

```python
count = 1

while count <= 5:
    print(count)
    count += 1
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

- The loop keeps running **as long as** `count <= 5` is `True`.
- `count += 1` increases `count` by 1 each time — this is essential; without it, the condition would never become `False`, causing an **infinite loop**.

### Real-World Example — Login Attempts

```python
correct_password = "python123"
attempts = 0

while attempts < 3:
    entered = input("Enter password: ")
    if entered == correct_password:
        print("Login successful")
        break
    attempts += 1
    print("Wrong password. Try again.")
else:
    print("Too many failed attempts. Account locked.")
```

### Common Mistakes

- Forgetting to update the loop variable, causing an **infinite loop** (the program never stops).
- Using `while` when a `for` loop would be simpler (e.g., looping a fixed, known number of times).

### Important Points

- Use `while` when the number of repetitions isn't known in advance and depends on a changing condition.
- Always make sure something inside the loop eventually makes the condition `False`.

### Practice

1. Write a `while` loop that prints numbers from 10 down to 1.
2. Write a `while` loop that keeps asking the user to enter a positive number until they do.

---

## Comparison Table — `for` vs `while`

| | `for` Loop | `while` Loop |
|---|---|---|
| Best for | Known number of repetitions, or looping over a sequence | Repeating until a condition becomes False |
| Risk of infinite loop | Low | Higher (if condition never changes) |
| Common use | Iterating over lists, ranges, strings | User input validation, game loops |

---

## 5. Nested Loops

### What is it?

A loop placed inside another loop — the inner loop completes fully for each single pass of the outer loop.

### Simple Example — Multiplication Table

```python
for i in range(1, 4):
    for j in range(1, 4):
        print(i, "x", j, "=", i * j)
    print("---")
```

Output:
```
1 x 1 = 1
1 x 2 = 2
1 x 3 = 3
---
2 x 1 = 2
2 x 2 = 4
2 x 3 = 6
---
3 x 1 = 3
3 x 2 = 6
3 x 3 = 9
---
```

### Explanation of the Code

- The outer loop runs 3 times (`i = 1, 2, 3`).
- For **each** value of `i`, the inner loop runs completely (`j = 1, 2, 3`).
- This is why nested loops are perfect for grids, tables, and patterns.

### Real-World Example — Star Pattern

```python
rows = 5

for i in range(1, rows + 1):
    print("*" * i)
```

Output:
```
*
**
***
****
*****
```

### Real-World Example — Number Pattern

```python
rows = 4

for i in range(1, rows + 1):
    for j in range(1, i + 1):
        print(j, end=" ")
    print()
```

Output:
```
1
1 2
1 2 3
1 2 3 4
```

### Common Mistakes

- Confusing which loop variable belongs to the outer vs inner loop.
- Forgetting `end=" "` when you want output on the same line instead of a new line each time.

### Important Points

- The total number of iterations in a nested loop is roughly `outer_iterations x inner_iterations`.
- Nested loops are the standard technique for pattern printing and grid-like problems (a very common interview/exam topic).

### Practice

1. Print a pyramid pattern of stars with 6 rows.
2. Print a multiplication table for numbers 1 to 5.

---

## 6. `break`

### What is it?

`break` immediately exits the loop entirely, skipping any remaining iterations.

### Simple Example

```python
for i in range(1, 10):
    if i == 5:
        break
    print(i)
```

Output:
```
1
2
3
4
```

### Explanation

- As soon as `i` becomes `5`, `break` stops the loop completely — `5` is never printed, and neither are `6`, `7`, `8`, `9`.

### Real-World Example

Searching a list for a specific value and stopping as soon as it's found, instead of wastefully checking the rest.

```python
numbers = [4, 8, 15, 16, 23, 42]
target = 15

for num in numbers:
    if num == target:
        print("Found it!")
        break
```

### Common Mistakes

- Expecting `break` to only exit the current inner loop when nested — it only exits the **innermost** loop it's directly inside.

### Important Points

- `break` completely ends the nearest enclosing loop.
- Commonly paired with a search condition.

---

## 7. `continue`

### What is it?

`continue` skips the rest of the current iteration and moves directly to the next one — the loop keeps running, it just skips one round.

### Simple Example

```python
for i in range(1, 6):
    if i == 3:
        continue
    print(i)
```

Output:
```
1
2
4
5
```

### Explanation

- When `i == 3`, `continue` skips the `print(i)` line for that round only, then moves on to `i = 4`.
- Unlike `break`, the loop doesn't stop — it just skips that one iteration.

### Real-World Example

Processing a list of numbers but skipping negative values:

```python
numbers = [4, -2, 7, -8, 10]

for num in numbers:
    if num < 0:
        continue
    print(num)
```

### Common Mistakes

- Confusing `continue` (skip this round) with `break` (stop everything) — this is a very common beginner mix-up.

### Important Points

- `continue` skips only the current iteration, not the whole loop.

---

## 8. `pass`

### What is it?

`pass` does absolutely nothing — it's a placeholder used when Python syntax requires a statement, but you don't want any action to happen (yet).

### Simple Example

```python
for i in range(5):
    if i == 3:
        pass   # TODO: handle this case later
    print(i)
```

Output:
```
0
1
2
3
4
```

### Real-World Example

Used often while planning out code structure — you write the `if` condition first and use `pass` as a placeholder until you decide what should actually happen there.

### Important Points

- `pass` is different from `continue` — `pass` does nothing and execution continues normally to the next line in the same block; `continue` actively skips to the next loop iteration.

---

## Comparison Table — `break` vs `continue` vs `pass`

| Keyword | Effect |
|---|---|
| `break` | Exits the loop completely |
| `continue` | Skips current iteration, continues looping |
| `pass` | Does nothing — just a placeholder |

---

## 9. Loop `else`

### What is it?

Both `for` and `while` loops in Python can have an `else` block — an unusual but useful feature. The `else` block runs **only if the loop completed normally, without hitting a `break`**.

### Simple Example

```python
for i in range(1, 5):
    print(i)
else:
    print("Loop finished without break")
```

Output:
```
1
2
3
4
Loop finished without break
```

### Example Where `else` is Skipped

```python
for i in range(1, 5):
    if i == 3:
        break
    print(i)
else:
    print("This will NOT print")
```

Output:
```
1
2
```

### Explanation

- In the second example, `break` triggers when `i == 3`, so the loop exits early — and because it didn't finish naturally, the `else` block is skipped entirely.

### Real-World Example

Checking whether a number is prime — if no divisor is found through the entire loop (no `break`), the `else` block can confirm "this number is prime."

```python
number = 7
is_prime = True

for i in range(2, number):
    if number % i == 0:
        is_prime = False
        break
else:
    print(number, "is prime")
```

### Common Mistakes

- Assuming loop-`else` behaves like the `else` in an `if` statement — it's tied to whether `break` occurred, not a simple opposite condition.

### Important Points

- Loop-`else` runs when the loop finishes **without** a `break`.
- It's a lesser-known but genuinely useful Python feature, especially for search-and-confirm logic.

---

## Common Beginner Mistakes — Summary for This Section

- Off-by-one errors with `range()` (forgetting it stops before the given number).
- Forgetting to update the loop variable in a `while` loop, causing an infinite loop.
- Mixing up `break` and `continue`.
- Confusing which loop a nested `break`/`continue` affects (it's always the innermost loop).

---

## Cheat Sheet — Loops

```python
# for loop
for i in range(start, stop, step):
    ...

# while loop
while condition:
    ...

# break / continue / pass
break      # exit loop entirely
continue   # skip to next iteration
pass       # do nothing (placeholder)

# loop-else
for i in range(5):
    ...
else:
    ...   # runs only if no break occurred
```

---

## Mini Project: Number Guessing Game

### Objective

Build a game where the computer picks a random number, and the user has to guess it within a limited number of attempts, using both conditionals and loops together.

### Requirements

- Generate a random number between 1 and 100.
- Let the user guess repeatedly.
- Give hints: "Too High" or "Too Low."
- Limit the number of attempts (e.g., 7 tries).
- Announce win/loss at the end.

### Concepts Used

Variables, input/output, type conversion, `if-elif-else`, `while` loop, `break`, the `random` module.

### Step-by-Step Approach

1. Import the `random` module and generate a secret number.
2. Set a counter for the number of attempts allowed.
3. Use a `while` loop to keep asking for guesses while attempts remain.
4. Compare the guess to the secret number and give feedback.
5. Use `break` to exit immediately on a correct guess.
6. If the loop finishes without a correct guess, reveal the number.

### Complete Code

```python
import random

secret_number = random.randint(1, 100)
max_attempts = 7
attempts_used = 0

print("I'm thinking of a number between 1 and 100.")
print(f"You have {max_attempts} attempts to guess it.")

while attempts_used < max_attempts:
    guess = int(input("Enter your guess: "))
    attempts_used += 1

    if guess == secret_number:
        print(f"Correct! You guessed it in {attempts_used} attempts.")
        break
    elif guess < secret_number:
        print("Too Low!")
    else:
        print("Too High!")

    remaining = max_attempts - attempts_used
    if remaining > 0:
        print(f"Attempts remaining: {remaining}")
else:
    print(f"Out of attempts! The number was {secret_number}.")
```

### Code Explanation

- `random.randint(1, 100)` picks a random whole number between 1 and 100 (inclusive on both ends).
- The `while` loop keeps running as long as attempts remain.
- `break` ends the game immediately on a correct guess.
- The loop's `else` block only runs if the `while` loop finishes **without** a `break` — meaning the player ran out of attempts without guessing correctly. This is a perfect real use case for loop-`else`.

### Sample Output

```
I'm thinking of a number between 1 and 100.
You have 7 attempts to guess it.
Enter your guess: 50
Too Low!
Attempts remaining: 6
Enter your guess: 75
Too High!
Attempts remaining: 5
Enter your guess: 62
Correct! You guessed it in 3 attempts.
```

### Possible Improvements

- Let the user choose the difficulty (number range and attempt count).
- Track and display the best (fewest-attempts) score across multiple games.
- Ask "Play again?" and loop the entire game.

### Challenge Task

Modify the game so it also tells the player how "close" their guess was (e.g., "Very close!" if within 5 of the answer).

---

## Interview Questions

**Q1. What is the difference between `break` and `continue`?**
Answer: `break` exits the loop entirely. `continue` skips only the current iteration and moves on to the next one, without stopping the loop.

**Q2. What does the `else` block attached to a loop do?**
Answer: It runs only if the loop completes all its iterations without hitting a `break`. If `break` is triggered, the `else` block is skipped.

**Q3. What's the difference between `for` and `while` loops?**
Answer: `for` loops are typically used when the number of iterations is known or you're iterating over a sequence. `while` loops are used when repetition depends on a condition that may not have a predetermined number of repeats.

**Q4. Why can a `while` loop become infinite?**
Answer: If the condition being checked never becomes `False` — usually because the loop forgets to update the variable involved in the condition.

**Q5. What does `range(1, 10, 2)` produce?**
Answer: `1, 3, 5, 7, 9` — starting at 1, stepping by 2, stopping before 10.

---

## Practice Questions

**Beginner**
1. Print all numbers from 1 to 20 using a `for` loop.
2. Print all even numbers from 1 to 50 using a `while` loop.
3. Print the multiplication table of a number entered by the user.
4. Use `break` to stop a loop as soon as it finds the number 7 in a list.
5. Use `continue` to print all numbers from 1 to 10 except multiples of 3.

**Intermediate**
1. Print a right-angled triangle pattern of stars using nested loops.
2. Write a program to check whether a number is prime using a `for` loop and loop-`else`.
3. Write a program that calculates the factorial of a number using a `while` loop.
4. Print the Fibonacci sequence up to 10 terms using a `for` loop.
5. Write a program to reverse the digits of a number using a `while` loop.

**Challenge**
1. Print a diamond star pattern using nested loops.
2. Write a program that finds all prime numbers between 1 and 100.
3. Build a simple ATM PIN-entry simulator that gives the user 3 attempts using a `while` loop, and locks the account with a message if all attempts fail.
$zz20$, 'markdown',
  jsonb_build_object('source', 'python_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'python_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Python Basics  ▸  Python Data Structures
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = 'python-basics'),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $zz21$Python Data Structures$zz21$, $zz22$python-data-structures$zz22$, $zz23$Python's four core built-in collections — Lists, Tuples, Sets and Dictionaries — how to create, access, modify and choose between them, plus comprehensions.$zz23$, 4,
    'published', true, true, 'python_tutorial', $zz24$python-basics/python-data-structures$zz24$
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
select up_topic.id, '', $zz25$Until now, each variable has held just one value. But real-world data usually comes in collections — a list of students, a set of unique tags, a dictionary of user profiles. Python gives you four core built-in data structures to handle this: **Lists, Tuples, Sets, and Dictionaries**.

---

## 1. Why Do We Need Data Structures?

### What is it?

A data structure is a way of organizing and storing multiple pieces of data together so they can be used efficiently.

### Why do we use it?

Imagine tracking marks for 40 students. Creating 40 separate variables (`marks1`, `marks2`, ... `marks40`) would be unmanageable. A single list can hold all 40 values, and you can loop through them, sort them, search them, and modify them easily.

### Real-World Example

- A list of products in a shopping cart.
- A set of unique visitor IDs to a website.
- A dictionary mapping usernames to their profile information.

---

## 2. Lists

### What is it?

A list is an ordered, changeable (mutable) collection that can hold multiple values — even of different types — in a single variable.

> **Definition:** A list is an ordered collection of items that can be changed (added to, removed from, or modified) after creation.

### Creation

```python
fruits = ["apple", "banana", "cherry"]
mixed = [1, "hello", 3.14, True]
empty_list = []
```

### Access (Indexing & Slicing)

Python indexing starts at **0**, not 1.

```python
fruits = ["apple", "banana", "cherry", "mango"]

print(fruits[0])     # apple  (first item)
print(fruits[-1])    # mango  (last item)
print(fruits[1:3])   # ['banana', 'cherry']  (slicing)
```

**Explanation:** `fruits[-1]` uses negative indexing to count from the end. Slicing `[1:3]` gives items from index 1 up to (but not including) index 3.

### Modification

```python
fruits[1] = "blueberry"
print(fruits)   # ['apple', 'blueberry', 'cherry', 'mango']
```

### Adding Items

```python
fruits.append("orange")       # adds to the end
fruits.insert(1, "grape")     # adds at a specific position
fruits.extend(["kiwi", "fig"])  # adds multiple items at once
```

### Deletion

```python
fruits.remove("banana")   # removes by value
fruits.pop()               # removes and returns the last item
fruits.pop(0)              # removes item at index 0
del fruits[1]              # removes item at index 1
fruits.clear()             # removes everything
```

### Comparison Table — `remove()` vs `pop()`

| | `remove()` | `pop()` |
|---|---|---|
| Removes by | Value | Index (default: last item) |
| Returns | Nothing | The removed item |
| Error if missing | Yes, if value not found | Yes, if index invalid |

### Common List Methods

| Method | Purpose |
|---|---|
| `append(x)` | Add item to the end |
| `insert(i, x)` | Insert item at position `i` |
| `remove(x)` | Remove first occurrence of value `x` |
| `pop(i)` | Remove and return item at index `i` |
| `sort()` | Sort the list in place |
| `reverse()` | Reverse the list in place |
| `index(x)` | Find the position of value `x` |
| `count(x)` | Count occurrences of `x` |
| `copy()` | Create a shallow copy of the list |

### Iteration

```python
for fruit in fruits:
    print(fruit)
```

### List Comprehension

A compact way to build a new list from an existing sequence.

```python
squares = [x ** 2 for x in range(1, 6)]
print(squares)   # [1, 4, 9, 16, 25]

even_only = [x for x in range(1, 11) if x % 2 == 0]
print(even_only)   # [2, 4, 6, 8, 10]
```

**Explanation:** `[expression for item in sequence if condition]` — Python builds a new list by evaluating the expression for every item that passes the (optional) condition.

### Real-World Example

Storing all product names in a shopping cart, or all marks scored by a student across subjects.

```python
cart = ["Shoes", "T-Shirt", "Watch"]
marks = [85, 90, 78, 92]
average = sum(marks) / len(marks)
print(average)
```

### Common Mistakes

- Forgetting Python indexing starts at `0`, not `1`.
- Trying to access an index that doesn't exist → `IndexError`.
- Confusing `remove()` (by value) with `pop()` (by index).
- Modifying a list while looping over it directly, which can cause skipped items.

### Important Points

- Lists are **mutable** — they can change after creation.
- Lists maintain insertion order.
- Lists can hold mixed data types, though it's best practice to keep one type per list when possible.

### Practice

1. Create a list of 5 numbers and print their sum and average.
2. Use list comprehension to create a list of cubes of numbers from 1 to 10.

---

## 3. Tuples

### What is it?

A tuple is an ordered collection just like a list, but it is **immutable** — once created, it cannot be changed.

> **Definition:** A tuple is an ordered, unchangeable collection of items.

### Creation

```python
coordinates = (10, 20)
single_item_tuple = (5,)   # comma is required for a single-item tuple!
empty_tuple = ()
```

### Access

Tuples support the same indexing and slicing as lists.

```python
point = (10, 20, 30)
print(point[0])    # 10
print(point[-1])   # 30
print(point[0:2])  # (10, 20)
```

### Why Can't Tuples Be Modified?

```python
point = (10, 20)
point[0] = 99   # TypeError: 'tuple' object does not support item assignment
```

Tuples don't allow reassigning, adding, or removing items after creation — this is the whole point (no pun intended) of using them.

### Common Tuple Methods

Since tuples are immutable, they only have two built-in methods:

| Method | Purpose |
|---|---|
| `count(x)` | Count occurrences of `x` |
| `index(x)` | Find position of `x` |

### Iteration

```python
for coord in (10, 20, 30):
    print(coord)
```

### Real-World Example

Tuples are perfect for data that should never change, like geographic coordinates, RGB color values, or a fixed set of days in a week.

```python
red = (255, 0, 0)
days = ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
```

### Tuple Unpacking

```python
point = (10, 20)
x, y = point
print(x, y)   # 10 20
```

### Common Mistakes

- Forgetting the trailing comma when creating a single-item tuple: `(5)` is just the integer `5`, not a tuple — you need `(5,)`.
- Trying to modify a tuple and being confused by the `TypeError`.

### Important Points

- Tuples are faster than lists for fixed data (slightly less memory overhead).
- Use tuples when the data should never change during the program.
- Tuples can be used as dictionary keys; lists cannot (because lists are mutable).

### Practice

1. Create a tuple of your favorite three colors and print each one using a loop.
2. Try modifying a tuple and observe the error Python gives you.

---

## Comparison Table — List vs Tuple

| | List | Tuple |
|---|---|---|
| Mutability | Mutable (can change) | Immutable (cannot change) |
| Syntax | `[1, 2, 3]` | `(1, 2, 3)` |
| Performance | Slightly slower | Slightly faster |
| Use case | Data that changes often | Fixed data that shouldn't change |
| Can be a dictionary key? | No | Yes |

---

## 4. Sets

### What is it?

A set is an unordered collection of **unique** items — duplicates are automatically removed.

> **Definition:** A set is a collection of unique, unordered items.

### Creation

```python
fruits = {"apple", "banana", "cherry"}
numbers_with_duplicates = {1, 2, 2, 3, 3, 3}
print(numbers_with_duplicates)   # {1, 2, 3} - duplicates removed automatically

empty_set = set()   # NOTE: {} creates an empty dictionary, not a set!
```

### Access

Sets are unordered, so **you cannot access items by index** (`fruits[0]` will cause an error). You can only check membership or iterate.

```python
print("apple" in fruits)   # True
```

### Modification

```python
fruits.add("mango")
fruits.update(["kiwi", "fig"])
```

### Deletion

```python
fruits.remove("banana")    # error if not found
fruits.discard("banana")   # no error even if not found
fruits.pop()                # removes a random item (sets have no order)
```

### Set Operations (Very Useful in Practice)

```python
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

print(a.union(b))          # {1, 2, 3, 4, 5, 6} - all items from both
print(a.intersection(b))   # {3, 4}             - common items
print(a.difference(b))     # {1, 2}             - in a but not in b
print(a.symmetric_difference(b))  # {1, 2, 5, 6} - in either, but not both
```

### Iteration

```python
for fruit in fruits:
    print(fruit)
```

### Real-World Example

Removing duplicate entries from a list of email addresses, or finding common interests between two users (intersection of their interest sets).

```python
visitor_ids = [101, 102, 101, 103, 102]
unique_visitors = set(visitor_ids)
print(len(unique_visitors))   # 3
```

### Common Mistakes

- Using `{}` expecting an empty set — `{}` actually creates an empty **dictionary**. Use `set()` for an empty set.
- Trying to access set items by index, e.g. `fruits[0]` → `TypeError`.
- Assuming sets preserve insertion order — they don't guarantee any particular order.

### Important Points

- Sets automatically eliminate duplicate values.
- Sets are unordered — no indexing.
- Extremely useful for membership testing (`in`) and removing duplicates quickly.

### Practice

1. Create two sets of numbers and find their union and intersection.
2. Remove duplicates from a list using a set.

---

## 5. Dictionaries

### What is it?

A dictionary stores data as **key-value pairs** — instead of accessing items by position (like a list), you access them by a unique key.

> **Definition:** A dictionary is a collection of key-value pairs, where each key maps to a specific value.

### Creation

```python
student = {
    "name": "Rohan",
    "age": 21,
    "course": "Computer Science"
}
```

### Access

```python
print(student["name"])          # Rohan
print(student.get("age"))       # 21
print(student.get("grade", "Not Found"))  # Not Found (safe access with default)
```

**Explanation:** `student["name"]` raises a `KeyError` if the key doesn't exist. `student.get("key", default)` is safer — it returns a default value instead of crashing.

### Modification

```python
student["age"] = 22             # update existing key
student["email"] = "rohan@mail.com"   # add a new key
```

### Deletion

```python
del student["email"]
student.pop("age")
student.clear()
```

### Common Dictionary Methods

| Method | Purpose |
|---|---|
| `keys()` | Returns all keys |
| `values()` | Returns all values |
| `items()` | Returns all key-value pairs |
| `get(key, default)` | Safely access a value |
| `update({...})` | Add/update multiple keys at once |
| `pop(key)` | Remove a key and return its value |

### Iteration

```python
student = {"name": "Rohan", "age": 21, "course": "CS"}

for key, value in student.items():
    print(key, ":", value)
```

Output:
```
name : Rohan
age : 21
course : CS
```

### Dictionary Comprehension

```python
squares = {x: x ** 2 for x in range(1, 6)}
print(squares)   # {1: 1, 2: 4, 3: 9, 4: 16, 5: 25}
```

### Real-World Example

Dictionaries are perfect for structured data like a user profile, a product catalog entry, or a JSON API response.

```python
user_profile = {
    "username": "rohan21",
    "email": "rohan21@mail.com",
    "is_active": True
}
```

### Common Mistakes

- Accessing a missing key with `[]` instead of `.get()`, causing a `KeyError`.
- Assuming dictionaries are indexed by number — they're indexed by key, not position.
- Using a mutable type (like a list) as a dictionary key — only immutable types (strings, numbers, tuples) can be keys.

### Important Points

- Dictionary keys must be unique and immutable (strings, numbers, or tuples).
- Since Python 3.7, dictionaries maintain insertion order.
- `.get()` is the safe way to access a key that might not exist.

### Practice

1. Create a dictionary storing a product's name, price, and quantity, then print each using `.items()`.
2. Use dictionary comprehension to create a dictionary mapping numbers 1–5 to their cubes.

---

## Comparison Table — Set vs Dictionary

| | Set | Dictionary |
|---|---|---|
| Stores | Unique values only | Key-value pairs |
| Syntax | `{1, 2, 3}` | `{"key": "value"}` |
| Access | Membership check (`in`) | By key |
| Order | Unordered | Insertion order preserved (3.7+) |

---

## Overall Comparison Table — Choosing the Right Structure

| Structure | Ordered? | Mutable? | Duplicates Allowed? | Access By | Best For |
|---|---|---|---|---|---|
| List | Yes | Yes | Yes | Index | General-purpose ordered collection |
| Tuple | Yes | No | Yes | Index | Fixed data that shouldn't change |
| Set | No | Yes | No | Membership (`in`) | Removing duplicates, set operations |
| Dictionary | Yes (3.7+) | Yes | Keys must be unique | Key | Structured, labeled data |

---

## Common Beginner Mistakes — Summary

- Confusing list indexing (starts at 0) and slicing rules.
- Trying to modify a tuple.
- Using `{}` when you meant an empty set (`set()`).
- Accessing a dictionary key that doesn't exist without using `.get()`.
- Forgetting sets have no guaranteed order and cannot be indexed.

---

## Cheat Sheet — Data Structures

```python
# List
lst = [1, 2, 3]
lst.append(4); lst.remove(1); lst[0] = 99

# Tuple
tup = (1, 2, 3)
x, y, z = tup

# Set
s = {1, 2, 3}
s.add(4); s.union({5, 6}); s.intersection({2, 3})

# Dictionary
d = {"key": "value"}
d["key"]; d.get("key", "default"); d.items()
```

---

## Mini Project: Student Marks Manager

### Objective

Build a program to store, update, and analyze marks for multiple students using a dictionary of lists.

### Requirements

- Store each student's name and their list of subject marks.
- Calculate each student's total and average marks.
- Find the topper (student with the highest average).

### Concepts Used

Dictionaries, lists, loops, functions (basic use), comparison operators.

### Complete Code

```python
students = {
    "Aditi": [85, 90, 78],
    "Rohan": [70, 88, 92],
    "Zara": [95, 91, 89]
}

topper_name = None
topper_average = 0

for name, marks in students.items():
    total = sum(marks)
    average = total / len(marks)
    print(f"{name}: Total = {total}, Average = {average:.2f}")

    if average > topper_average:
        topper_average = average
        topper_name = name

print(f"\nTopper: {topper_name} with an average of {topper_average:.2f}")
```

### Code Explanation

- `students` is a dictionary where each key (student name) maps to a list of marks.
- `students.items()` lets us loop through both the name and the marks list together.
- We track the highest average seen so far to determine the topper, updating `topper_name` whenever we find a higher average.

### Sample Output

```
Aditi: Total = 253, Average = 84.33
Rohan: Total = 250, Average = 83.33
Zara: Total = 275, Average = 91.67

Topper: Zara with an average of 91.67
```

### Possible Improvements

- Allow adding new students and marks interactively via `input()`.
- Add grade calculation (A/B/C/Fail) for each student based on average.
- Sort and display all students from highest to lowest average.

### Challenge Task

Extend the program to also find the topper **per subject** (assuming subject names are tracked alongside marks).

---

## Interview Questions

**Q1. What is the difference between a list and a tuple?**
Answer: A list is mutable (can be changed after creation), while a tuple is immutable. Lists use `[]`, tuples use `()`.

**Q2. Why would you use a set instead of a list?**
Answer: When you need to store unique values only and don't care about order, or when you need fast membership testing and set operations like union/intersection.

**Q3. How do you safely access a dictionary key that might not exist?**
Answer: Use `.get(key, default_value)` instead of `dictionary[key]`, which avoids a `KeyError` if the key is missing.

**Q4. Can a list be used as a dictionary key? Why or why not?**
Answer: No — dictionary keys must be immutable (hashable), and lists are mutable, so they cannot be used as keys. Tuples can be used instead.

**Q5. What's the difference between `remove()` and `discard()` in a set?**
Answer: `remove()` raises an error if the value isn't found; `discard()` does not raise an error in that case.

**Q6. Does a dictionary maintain order?**
Answer: Yes, since Python 3.7, dictionaries maintain the order in which keys were inserted.

---

## Practice Questions

**Beginner**
1. Create a list of 5 fruits and print the second and last item.
2. Create a tuple of 3 numbers and print their sum.
3. Create a set from a list with duplicate values and print the unique result.
4. Create a dictionary with 3 key-value pairs and print all keys.
5. Use a list comprehension to generate a list of squares from 1 to 10.

**Intermediate**
1. Write a program that removes duplicate values from a list using a set, while preserving the original order.
2. Create a dictionary of 5 products with their prices, then print the most expensive product.
3. Write a program to merge two dictionaries into one.
4. Given a list of numbers, use list comprehension to create a new list containing only the even numbers, squared.
5. Write a program that counts how many times each word appears in a sentence, using a dictionary.

**Challenge**
1. Given two sets of students enrolled in two different courses, find students enrolled in both, and students enrolled in only one.
2. Write a program that takes a list of student dictionaries (each with `name` and `marks`) and prints them sorted by marks, highest first.
3. Build a simple contact book using a dictionary where each key is a name and each value is another dictionary containing phone number and email.
$zz25$, 'markdown',
  jsonb_build_object('source', 'python_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'python_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Python Basics  ▸  Strings
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = 'python-basics'),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $zz26$Strings$zz26$, $zz27$strings$zz27$, $zz28$Python's text type in depth — indexing and slicing, immutability, the full toolbox of string methods, searching and replacing, f-string formatting, escape and raw strings, and an introduction to regular expressions.$zz28$, 5,
    'published', true, true, 'python_tutorial', $zz29$python-basics/strings$zz29$
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
select up_topic.id, '', $zz30$Text is everywhere in programming — names, messages, file paths, API responses. Python's string type (`str`) comes with a huge set of built-in tools for working with text, and this file covers all of them in depth.

---

## 1. What is a String?

### What is it?

A string is a sequence of characters — letters, numbers, symbols, spaces — treated as text, always written inside quotes.

> **Definition:** A string is an immutable sequence of characters used to represent text in Python.

### Why do we use it?

Nearly every program deals with text in some form: usernames, messages, product names, error messages, file contents. Strings are how Python represents and manipulates all of that.

### Creation

```python
name = "Aditi"
message = 'Hello there!'
multiline = """This is
a multi-line
string"""
```

Both single `'...'` and double `"..."` quotes work identically — pick one style and stay consistent across your project.

### Important Points

- Strings are **immutable** — once created, a string's characters cannot be changed in place (any "modification" actually creates a new string).
- Strings can use single, double, or triple quotes.

---

## 2. Indexing and Slicing

### What is it?

Since a string is a sequence of characters, each character has a position (index), starting from `0`.

### Simple Example

```python
word = "Python"

print(word[0])     # P   (first character)
print(word[-1])    # n   (last character)
print(word[2:5])   # tho (slice from index 2 up to, but not including, 5)
print(word[:3])    # Pyt (from the start up to index 3)
print(word[3:])    # hon (from index 3 to the end)
print(word[::-1])  # nohtyP (reversed string!)
```

### Explanation of the Code

- `word[2:5]` grabs characters at index 2, 3, and 4 — the slice stops **before** index 5.
- `word[::-1]` uses a step of `-1`, which reverses the entire string — a very common trick for palindrome checks.

### Common Mistakes

- Trying to change a character directly: `word[0] = "J"` → `TypeError`, because strings are immutable.
- Forgetting slicing stops **before** the end index, not at it.

### Important Points

- Indexing starts at `0`.
- Negative indices count from the end (`-1` is the last character).
- `string[::-1]` is the standard trick to reverse a string.

### Practice

1. Given `word = "Programming"`, print the first 4 characters and the last 4 characters.
2. Reverse the string `"Hello World"` using slicing.

---

## 3. String Immutability

### What is it?

Once a string is created, its individual characters cannot be changed. Any operation that seems to "modify" a string actually creates and returns a **brand new** string.

### Simple Example

```python
name = "aditi"
name = name.capitalize()   # this creates a NEW string, doesn't modify the original in place
print(name)   # Aditi
```

### Important Points

- If you need a "changeable" sequence of characters, convert to a list, modify it, then join it back into a string (`list(word)` ... `"".join(...)`).
- Immutability makes strings safe to share and use as dictionary keys.

---

## 4. Common String Methods

### What is it?

Python strings come with dozens of built-in methods for cleaning, transforming, and inspecting text.

### Case Conversion

```python
text = "Hello World"

print(text.upper())        # HELLO WORLD
print(text.lower())        # hello world
print(text.title())        # Hello World
print(text.capitalize())   # Hello world
```

### Cleaning Whitespace

```python
raw = "   Hello World   "
print(raw.strip())    # "Hello World" (removes leading/trailing spaces)
print(raw.lstrip())   # removes only leading spaces
print(raw.rstrip())   # removes only trailing spaces
```

### Splitting and Joining

```python
sentence = "Python is fun"
words = sentence.split()          # ['Python', 'is', 'fun']
print(words)

csv_line = "Aditi,21,CS"
fields = csv_line.split(",")      # ['Aditi', '21', 'CS']
print(fields)

joined = " ".join(["Python", "is", "awesome"])
print(joined)   # "Python is awesome"
```

### Checking Content

```python
print("hello123".isalpha())   # False (contains digits)
print("hello".isalpha())      # True
print("123".isdigit())        # True
print("Hello".startswith("He"))  # True
print("Hello".endswith("lo"))    # True
```

### Table — Frequently Used String Methods

| Method | Purpose |
|---|---|
| `.upper()` / `.lower()` | Convert case |
| `.strip()` | Remove leading/trailing whitespace |
| `.split(sep)` | Break a string into a list |
| `.join(list)` | Combine a list into a string |
| `.replace(old, new)` | Replace occurrences of a substring |
| `.find(sub)` | Find index of substring (returns -1 if not found) |
| `.count(sub)` | Count occurrences of a substring |
| `.startswith(sub)` / `.endswith(sub)` | Check start/end of string |
| `.isalpha()` / `.isdigit()` / `.isalnum()` | Check character types |

### Common Mistakes

- Forgetting that string methods **return a new string** — they don't change the original: `text.upper()` alone does nothing unless you store or print the result.
- Using `.split(",")` on data that has extra spaces around commas, leading to fields like `" Aditi"` with a leading space.

### Important Points

- All string methods return new strings — none modify the string in place (because strings are immutable).
- `.split()` with no argument splits on any whitespace and handles multiple spaces gracefully.

### Practice

1. Take a sentence and print how many words it contains using `.split()`.
2. Clean up the string `"   PYTHON is Fun   "` — strip whitespace and convert to title case.

---

## 5. Searching and Replacing

### Searching

```python
sentence = "Python is a powerful language"

print(sentence.find("powerful"))    # 12 (starting index)
print(sentence.find("Java"))         # -1 (not found)
print("Python" in sentence)          # True
```

### Comparison Table — `find()` vs `index()`

| | `find()` | `index()` |
|---|---|---|
| If not found | Returns `-1` | Raises `ValueError` |
| Best when | Substring might not exist | You're sure the substring exists |

### Replacing

```python
sentence = "I like Java"
updated = sentence.replace("Java", "Python")
print(updated)   # I like Python
```

### Real-World Example

Search-and-replace is used everywhere — cleaning messy user input, censoring words, or updating a template with real values.

### Common Mistakes

- Using `.index()` on a substring that might not exist, causing a crash — prefer `.find()` or check with `in` first.
- Forgetting `.replace()` returns a new string; the original string is unchanged.

### Practice

1. Check if the word "Python" exists in a given sentence, and print its position if found.
2. Replace all occurrences of "cat" with "dog" in a given sentence.

---

## 6. String Formatting

### What is it?

String formatting means inserting variable values into a string in a clean, readable way — instead of manually concatenating pieces with `+`.

### The Three Approaches

**1. Old style (`%` formatting)** — rarely used in modern code, but you may see it in older codebases:
```python
name = "Aditi"
print("Hello, %s!" % name)
```

**2. `.format()` method:**
```python
name = "Aditi"
age = 21
print("My name is {} and I am {} years old".format(name, age))
```

**3. f-strings (modern, recommended) — Python 3.6+:**
```python
name = "Aditi"
age = 21
print(f"My name is {name} and I am {age} years old")
```

Output (same for all three):
```
My name is Aditi and I am 21 years old
```

### Why f-strings Are Preferred

```python
price = 49.5
print(f"Price: ${price:.2f}")   # Price: $49.50
```

**Explanation:** Inside an f-string, `{price:.2f}` formats the number to exactly 2 decimal places — very useful for money, percentages, and measurements.

### Important Points

- f-strings are the modern standard — cleaner, faster, and easier to read than `.format()` or `%`.
- You can put any valid expression inside `{}` in an f-string, not just a variable: `f"{2 + 2}"` gives `"4"`.

### Practice

1. Use an f-string to print a sentence combining your name and favorite number.
2. Format the number `3.14159` to display only 2 decimal places using an f-string.

---

## 7. Escape Characters

### What is it?

Escape characters let you include special characters (like a newline or a quote) inside a string using a backslash `\`.

### Common Escape Characters

| Escape | Meaning |
|---|---|
| `\n` | New line |
| `\t` | Tab |
| `\\` | Backslash |
| `\'` | Single quote |
| `\"` | Double quote |

### Simple Example

```python
print("Line 1\nLine 2")
print("Name:\tAditi")
print("She said, \"Python is great!\"")
```

Output:
```
Line 1
Line 2
Name:	Aditi
She said, "Python is great!"
```

### Common Mistakes

- Forgetting to escape quotes when the same quote type is used inside the string: `"She said, "hi""` → `SyntaxError`.

---

## 8. Raw Strings

### What is it?

A raw string tells Python to treat backslashes as literal characters, not as the start of an escape sequence. Written by prefixing the string with `r`.

### Simple Example

```python
path = r"C:\Users\Aditi\Documents"
print(path)
```

Output:
```
C:\Users\Aditi\Documents
```

Without the `r` prefix, `\U` and other sequences could be misinterpreted as escape characters, causing errors or unexpected output.

### Real-World Example

Raw strings are especially useful for file paths (Windows uses backslashes) and regular expression patterns, which rely heavily on backslashes.

### Important Points

- Prefix a string with `r` to make it "raw" — Python ignores escape sequences inside it.
- Very commonly used with the `re` module (regular expressions) and Windows file paths.

---

## 9. Multiline Strings

### What is it?

Triple quotes (`"""..."""` or `'''...'''`) let a string span multiple lines exactly as typed.

### Simple Example

```python
message = """Dear Student,

Congratulations on completing this course!

Best regards,
Your Instructor"""

print(message)
```

### Important Points

- Multiline strings preserve line breaks and spacing exactly as written.
- Often used for docstrings (documentation inside functions/classes) as well as multi-line text output.

---

## 10. Introduction to Regular Expressions

### What is it?

Regular expressions (regex) are patterns used to search, match, and validate text based on rules — like "does this look like a valid email address?" This is just an introduction; the full Regular Expressions file covers this in depth later in the course.

### Simple Example

```python
import re

text = "Contact us at support@example.com"
match = re.search(r"[\w.-]+@[\w.-]+", text)

if match:
    print("Email found:", match.group())
```

Output:
```
Email found: support@example.com
```

### Explanation

- `re.search()` scans the text looking for a pattern.
- The pattern `[\w.-]+@[\w.-]+` roughly means "some letters/numbers/dots, then @, then more letters/numbers/dots" — a simplified email pattern.
- `.group()` returns the actual matched text.

### Important Points

- The `re` module is Python's built-in tool for regular expressions.
- Regex is extremely powerful for validating formats (emails, phone numbers, passwords) — covered fully later.

---

## Common Beginner Mistakes — Summary for This Section

- Trying to modify a string directly (`word[0] = "x"`) — strings are immutable.
- Forgetting string methods return new strings rather than modifying in place.
- Confusing `.find()` (safe, returns -1) with `.index()` (raises an error if not found).
- Forgetting the `r` prefix when working with file paths or regex patterns containing backslashes.

---

## Cheat Sheet — Strings

```python
s = "Hello World"

s[0]; s[-1]; s[2:5]; s[::-1]          # indexing & slicing
s.upper(); s.lower(); s.title()        # case conversion
s.strip(); s.split(); "-".join([...])  # cleaning & splitting
s.replace("old", "new")                # replacing
s.find("World"); "World" in s          # searching
f"{name} is {age} years old"           # f-string formatting
r"C:\Users\Name"                       # raw string
"""multi
line"""                                 # multiline string
```

---

## Mini Project: Password Strength Checker

### Objective

Build a program that checks whether a password is "Strong," "Medium," or "Weak" based on simple string rules.

### Requirements

- Password should be checked for: length, presence of digits, presence of uppercase letters, presence of special characters.
- Classify strength based on how many rules are satisfied.

### Concepts Used

Strings, string methods, `if-elif-else`, loops (to check characters).

### Complete Code

```python
password = input("Enter a password: ")

length_ok = len(password) >= 8
has_digit = any(char.isdigit() for char in password)
has_upper = any(char.isupper() for char in password)
has_special = any(char in "!@#$%^&*" for char in password)

score = sum([length_ok, has_digit, has_upper, has_special])

if score == 4:
    strength = "Strong"
elif score >= 2:
    strength = "Medium"
else:
    strength = "Weak"

print(f"Password Strength: {strength}")
```

### Code Explanation

- `any(char.isdigit() for char in password)` checks if **at least one** character in the password is a digit, using a generator expression (a compact loop-like check).
- `score` adds up how many of the four checks passed (`True` counts as `1`, `False` as `0`).
- The final `if-elif-else` classifies the password based on the score.

### Sample Output

```
Enter a password: Python@123
Password Strength: Strong
```

### Possible Improvements

- Give specific feedback on which rule failed (e.g., "Add at least one special character").
- Reject common passwords like "password123" using a blocklist.

### Challenge Task

Extend the checker to also reject passwords that contain the user's own name or username.

---

## Interview Questions

**Q1. Are strings mutable or immutable in Python?**
Answer: Immutable — once created, a string's characters cannot be changed. Any operation that appears to modify a string actually returns a new string.

**Q2. What is the difference between `find()` and `index()`?**
Answer: `find()` returns `-1` if the substring isn't found; `index()` raises a `ValueError` in that case.

**Q3. What is an f-string, and why is it preferred?**
Answer: An f-string (formatted string literal, prefixed with `f`) lets you embed expressions directly inside `{}` within a string. It's preferred because it's more readable and generally faster than `.format()` or `%` formatting.

**Q4. What does a raw string do?**
Answer: A raw string (prefixed with `r`) tells Python to treat backslashes as literal characters instead of escape sequence starters — useful for file paths and regex patterns.

**Q5. How do you reverse a string in Python?**
Answer: Using slicing with a step of -1: `string[::-1]`.

---

## Practice Questions

**Beginner**
1. Take a string and print it in uppercase and lowercase.
2. Check if a given string starts with "Py" and ends with "on".
3. Count how many vowels are in a given string.
4. Reverse a given string using slicing.
5. Replace all spaces in a sentence with underscores.

**Intermediate**
1. Write a program to check if a given string is a palindrome (reads the same forwards and backwards).
2. Count the number of words in a paragraph using `.split()`.
3. Write a program that capitalizes the first letter of every word in a sentence (without using `.title()`).
4. Extract all digits from a string like `"Room 42B, Floor 3"`.
5. Write a program that checks whether a given password is at least 8 characters and contains at least one digit.

**Challenge**
1. Write a program to check if two strings are anagrams of each other (contain the same letters, rearranged).
2. Write a program to count the frequency of each character in a string using a dictionary.
3. Write a simple text analyzer that reports word count, character count (excluding spaces), and the most frequently used word in a paragraph.
$zz30$, 'markdown',
  jsonb_build_object('source', 'python_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'python_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- ===========================================================================
-- 4. MOCK TESTS + QUESTIONS — one 10-question, 10-minute test per topic.
-- ===========================================================================

-- Python Fundamentals — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'python-basics/python-fundamentals')
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-py-fundamentals', $zz31$Python Fundamentals - Quick Test$zz31$, 'aptitude', 10, 10,
  $zz32$10 questions covering variables, data types, type conversion, input/output and operators.$zz32$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $zz33$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$zz33$, true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-py-fundamentals-1', 'pt-py-fundamentals',
   $zz34$Which of the following is a valid variable name in Python?$zz34$,
   $zz35$["2name", "student name", "student_name", "class"]$zz35$::jsonb,
   2, $zz36$Variable names cannot start with a digit, cannot contain spaces, and cannot be a Python keyword — student_name is the only option that follows all the naming rules.$zz36$, 1, 0),
  ('tq-py-fundamentals-2', 'pt-py-fundamentals',
   $zz37$What is the output of print(10 // 3)?$zz37$,
   $zz38$["3.33", "3", "4", "3.0"]$zz38$::jsonb,
   1, $zz39$// performs floor division, returning the whole-number result rounded down — 10 // 3 gives 3.$zz39$, 1, 1),
  ('tq-py-fundamentals-3', 'pt-py-fundamentals',
   $zz40$What data type does input() always return?$zz40$,
   $zz41$["int", "float", "str", "Depends on what the user types"]$zz41$::jsonb,
   2, $zz42$input() always returns a string, even if the user types a number — it must be converted manually with int() or float().$zz42$, 1, 2),
  ('tq-py-fundamentals-4', 'pt-py-fundamentals',
   $zz43$What is the result of type(5.0)?$zz43$,
   $zz44$["<class 'int'>", "<class 'float'>", "<class 'double'>", "<class 'number'>"]$zz44$::jsonb,
   1, $zz45$Any number written with a decimal point is a float in Python — there is no separate "double" type.$zz45$, 1, 3),
  ('tq-py-fundamentals-5', 'pt-py-fundamentals',
   $zz46$Which of these correctly writes a single-line comment in Python?$zz46$,
   $zz47$["// comment", "/* comment */", "# comment", "-- comment"]$zz47$::jsonb,
   2, $zz48$Python uses # to start a single-line comment; everything after it on that line is ignored by the interpreter.$zz48$, 1, 4),
  ('tq-py-fundamentals-6', 'pt-py-fundamentals',
   $zz49$What is the output of print(int(9.8))?$zz49$,
   $zz50$["10", "9", "9.8", "Error"]$zz50$::jsonb,
   1, $zz51$int() truncates the decimal part rather than rounding, so int(9.8) drops the .8 and gives 9.$zz51$, 1, 5),
  ('tq-py-fundamentals-7', 'pt-py-fundamentals',
   $zz52$Which operator returns the remainder of a division?$zz52$,
   $zz53$["/", "//", "%", "**"]$zz53$::jsonb,
   2, $zz54$% is the modulus operator — it returns the remainder left over after division.$zz54$, 1, 6),
  ('tq-py-fundamentals-8', 'pt-py-fundamentals',
   $zz55$What is the output of print(bool(0))?$zz55$,
   $zz56$["True", "False", "0", "Error"]$zz56$::jsonb,
   1, $zz57$0 is considered falsy in Python, so bool(0) evaluates to False; any non-zero number is truthy.$zz57$, 1, 7),
  ('tq-py-fundamentals-9', 'pt-py-fundamentals',
   $zz58$Which statement about Python constants is correct?$zz58$,
   $zz59$["Python enforces constants using the const keyword", "Constants are written in ALL_CAPS by convention only", "Constants cannot be changed once assigned", "Python has no way to represent constants"]$zz59$::jsonb,
   1, $zz60$Python has no true constant keyword — ALL_CAPS naming is purely a convention that tells other developers a value is not meant to change.$zz60$, 1, 8),
  ('tq-py-fundamentals-10', 'pt-py-fundamentals',
   $zz61$What does the ** operator do?$zz61$,
   $zz62$["Multiplication", "Floor division", "Exponentiation", "Modulus"]$zz62$::jsonb,
   2, $zz63$** raises the left operand to the power of the right operand — 2 ** 3 evaluates to 8.$zz63$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-py-fundamentals' and question_count <> 10;

-- Conditional Statements — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'python-basics/conditional-statements')
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-py-conditionals', $zz64$Conditional Statements - Quick Test$zz64$, 'aptitude', 10, 10,
  $zz65$10 questions covering if / if-else / if-elif-else, nested conditions, the ternary operator, and match-case.$zz65$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $zz66$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$zz66$, true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-py-conditionals-1', 'pt-py-conditionals',
   $zz67$What is the output of the following?

```python
x = 10
if x > 5:
    print("A")
elif x > 8:
    print("B")
else:
    print("C")
```$zz67$,
   $zz68$["A", "B", "C", "A and B"]$zz68$::jsonb,
   0, $zz69$Once a condition in the chain is True, the rest are skipped, even if they'd also be true — so only "A" prints.$zz69$, 1, 0),
  ('tq-py-conditionals-2', 'pt-py-conditionals',
   $zz70$Which symbol is required at the end of every if, elif, and else line?$zz70$,
   $zz71$[";", ":", "{}", "->"]$zz71$::jsonb,
   1, $zz72$Python requires a colon to mark the start of the indented block that follows an if, elif, or else line.$zz72$, 1, 1),
  ('tq-py-conditionals-3', 'pt-py-conditionals',
   $zz73$What does the ternary operator x = "Yes" if flag else "No" do?$zz73$,
   $zz74$["Loops until flag is false", "Assigns \"Yes\" or \"No\" based on flag", "Raises an error", "Always assigns \"Yes\""]$zz74$::jsonb,
   1, $zz75$It's a compact one-line if-else — x gets "Yes" when flag is truthy and "No" otherwise.$zz75$, 1, 2),
  ('tq-py-conditionals-4', 'pt-py-conditionals',
   $zz76$Which Python version introduced match-case?$zz76$,
   $zz77$["3.6", "3.8", "3.9", "3.10"]$zz77$::jsonb,
   3, $zz78$Structural pattern matching with match-case was added in Python 3.10.$zz78$, 1, 3),
  ('tq-py-conditionals-5', 'pt-py-conditionals',
   $zz79$What does case _: represent in a match statement?$zz79$,
   $zz80$["A syntax error", "The first case", "The default/catch-all case", "A comment"]$zz80$::jsonb,
   2, $zz81$The underscore pattern matches anything not caught by an earlier case, acting like the default branch of the match block.$zz81$, 1, 4),
  ('tq-py-conditionals-6', 'pt-py-conditionals',
   $zz82$What is the output of print("A" if 5 > 10 else "B")?$zz82$,
   $zz83$["A", "B", "True", "False"]$zz83$::jsonb,
   1, $zz84$5 > 10 is False, so the ternary expression evaluates to the else-branch value, "B".$zz84$, 1, 5),
  ('tq-py-conditionals-7', 'pt-py-conditionals',
   $zz85$In an if-elif-else chain, how many blocks execute at most?$zz85$,
   $zz86$["All matching ones", "Exactly one", "Zero always", "Two"]$zz86$::jsonb,
   1, $zz87$Python stops checking as soon as it finds the first True condition in the chain, so at most one block ever runs.$zz87$, 1, 6),
  ('tq-py-conditionals-8', 'pt-py-conditionals',
   $zz88$Which of the following correctly checks two conditions together?$zz88$,
   $zz89$["if age >= 18 and has_id:", "if age >= 18 && has_id:", "if age >= 18 & has_id:", "if age >= 18, has_id:"]$zz89$::jsonb,
   0, $zz90$Python spells out logical operators as words — and, or, not — rather than using symbols like && from other languages.$zz90$, 1, 7),
  ('tq-py-conditionals-9', 'pt-py-conditionals',
   $zz91$What happens if no else is provided and the if condition is False?$zz91$,
   $zz92$["SyntaxError", "The program crashes", "Nothing happens; execution continues", "The if block still runs"]$zz92$::jsonb,
   2, $zz93$An if without an else simply does nothing when its condition is False — the program moves on to the next line.$zz93$, 1, 8),
  ('tq-py-conditionals-10', 'pt-py-conditionals',
   $zz94$What is a nested condition?$zz94$,
   $zz95$["A condition inside a loop", "An if statement inside another if/else block", "Two unrelated if statements", "A condition using elif"]$zz95$::jsonb,
   1, $zz96$A nested condition is an if (or if-else) placed inside the body of another if or else block, used to check a second thing only after the first check passes.$zz96$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-py-conditionals' and question_count <> 10;

-- Loops — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'python-basics/loops')
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-py-loops', $zz97$Loops - Quick Test$zz97$, 'aptitude', 10, 10,
  $zz98$10 questions covering for and while loops, range(), break, continue, pass and loop-else.$zz98$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $zz99$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$zz99$, true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-py-loops-1', 'pt-py-loops',
   $zz100$What does range(5) produce?$zz100$,
   $zz101$["1,2,3,4,5", "0,1,2,3,4", "0,1,2,3,4,5", "1,2,3,4"]$zz101$::jsonb,
   1, $zz102$range(5) starts counting at 0 by default and stops before the given number, producing 0 through 4.$zz102$, 1, 0),
  ('tq-py-loops-2', 'pt-py-loops',
   $zz103$What is the output?

```python
for i in range(3):
    print(i)
else:
    print("Done")
```$zz103$,
   $zz104$["0 1 2", "0 1 2 Done", "Done", "Error"]$zz104$::jsonb,
   1, $zz105$Loop-else runs since no break occurred, so "Done" prints right after the loop finishes normally.$zz105$, 1, 1),
  ('tq-py-loops-3', 'pt-py-loops',
   $zz106$What does break do inside a loop?$zz106$,
   $zz107$["Skips one iteration", "Exits the loop entirely", "Pauses the loop", "Restarts the loop"]$zz107$::jsonb,
   1, $zz108$break immediately terminates the nearest enclosing loop, skipping any remaining iterations.$zz108$, 1, 2),
  ('tq-py-loops-4', 'pt-py-loops',
   $zz109$What does continue do?$zz109$,
   $zz110$["Exits the loop", "Skips the rest of the current iteration and moves to the next", "Does nothing", "Ends the program"]$zz110$::jsonb,
   1, $zz111$continue skips only the remaining code in the current iteration and jumps straight to the next one — the loop itself keeps running.$zz111$, 1, 3),
  ('tq-py-loops-5', 'pt-py-loops',
   $zz112$What is the output of list(range(10, 0, -2))?$zz112$,
   $zz113$["[10,9,8,...,1]", "[10,8,6,4,2]", "[8,6,4,2,0]", "Empty list"]$zz113$::jsonb,
   1, $zz114$Starting at 10 and stepping by -2 while stopping before 0 gives 10, 8, 6, 4, 2.$zz114$, 1, 4),
  ('tq-py-loops-6', 'pt-py-loops',
   $zz115$Which loop is best when the number of iterations is not known in advance?$zz115$,
   $zz116$["for", "while", "Both equally", "Neither"]$zz116$::jsonb,
   1, $zz117$while loops repeat based on a condition rather than a fixed count, which makes them the right tool when you can't predict how many repetitions are needed.$zz117$, 1, 5),
  ('tq-py-loops-7', 'pt-py-loops',
   $zz118$What does pass do inside a loop?$zz118$,
   $zz119$["Skips the iteration", "Exits the loop", "Does nothing; acts as a placeholder", "Causes an error"]$zz119$::jsonb,
   2, $zz120$pass is a no-op statement — it satisfies Python's syntax requirement for a block body without performing any action, and execution simply continues to the next line.$zz120$, 1, 6),
  ('tq-py-loops-8', 'pt-py-loops',
   $zz121$In nested loops, which loop does a break statement affect?$zz121$,
   $zz122$["All loops", "Only the outermost loop", "Only the innermost loop it's directly inside", "None"]$zz122$::jsonb,
   2, $zz123$break only exits the loop it is directly written inside — an outer loop keeps running normally.$zz123$, 1, 7),
  ('tq-py-loops-9', 'pt-py-loops',
   $zz124$What is the risk of a while loop if the condition variable is never updated?$zz124$,
   $zz125$["SyntaxError", "Infinite loop", "It runs once and stops", "It skips execution"]$zz125$::jsonb,
   1, $zz126$If nothing inside the loop changes the value being tested, the condition never becomes False and the loop runs forever.$zz126$, 1, 8),
  ('tq-py-loops-10', 'pt-py-loops',
   $zz127$When does a loop's else block execute?$zz127$,
   $zz128$["Always", "Only if a break occurs", "Only if the loop completes without hitting break", "Never"]$zz128$::jsonb,
   2, $zz129$Loop-else is tied specifically to the absence of a break — it runs only when the loop finishes all its iterations naturally.$zz129$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-py-loops' and question_count <> 10;

-- Python Data Structures — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'python-basics/python-data-structures')
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-py-datastructures', $zz130$Python Data Structures - Quick Test$zz130$, 'aptitude', 10, 10,
  $zz131$10 questions covering lists, tuples, sets and dictionaries — creation, methods, and when to use each.$zz131$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $zz132$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$zz132$, true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-py-datastructures-1', 'pt-py-datastructures',
   $zz133$Which data structure does NOT allow duplicate values?$zz133$,
   $zz134$["List", "Tuple", "Set", "Dictionary keys and Set both"]$zz134$::jsonb,
   3, $zz135$Both set values and dictionary keys must be unique — lists and tuples freely allow duplicates.$zz135$, 1, 0),
  ('tq-py-datastructures-2', 'pt-py-datastructures',
   $zz136$What is the output of (5,) type-checked with type()?$zz136$,
   $zz137$["int", "tuple", "list", "SyntaxError"]$zz137$::jsonb,
   1, $zz138$The trailing comma makes it a one-item tuple — without it, (5) would just be the integer 5 in parentheses.$zz138$, 1, 1),
  ('tq-py-datastructures-3', 'pt-py-datastructures',
   $zz139$Which method removes and returns the last item of a list?$zz139$,
   $zz140$["remove()", "pop()", "del", "discard()"]$zz140$::jsonb,
   1, $zz141$pop() with no argument removes and returns the last item of a list; remove() deletes by value instead of position and returns nothing.$zz141$, 1, 2),
  ('tq-py-datastructures-4', 'pt-py-datastructures',
   $zz142$What does {} create by default?$zz142$,
   $zz143$["An empty set", "An empty dictionary", "An empty list", "SyntaxError"]$zz143$::jsonb,
   1, $zz144${} always creates an empty dictionary in Python — use set() to create an empty set.$zz144$, 1, 3),
  ('tq-py-datastructures-5', 'pt-py-datastructures',
   $zz145$Which is TRUE about tuples?$zz145$,
   $zz146$["Mutable", "Immutable", "Cannot store numbers", "Must be empty"]$zz146$::jsonb,
   1, $zz147$Tuples cannot be changed after creation — no item assignment, no adding, no removing — which is what makes them immutable.$zz147$, 1, 4),
  ('tq-py-datastructures-6', 'pt-py-datastructures',
   $zz148$What does dict.get("key", "default") do if "key" doesn't exist?$zz148$,
   $zz149$["Raises KeyError", "Returns None", "Returns \"default\"", "Crashes the program"]$zz149$::jsonb,
   2, $zz150$.get() is the safe way to read a dictionary — it returns the given default value instead of raising an error when the key is missing.$zz150$, 1, 5),
  ('tq-py-datastructures-7', 'pt-py-datastructures',
   $zz151$Which set operation returns items in both sets?$zz151$,
   $zz152$["union()", "intersection()", "difference()", "symmetric_difference()"]$zz152$::jsonb,
   1, $zz153$intersection() returns only the elements that appear in both sets.$zz153$, 1, 6),
  ('tq-py-datastructures-8', 'pt-py-datastructures',
   $zz154$What is the output of [x for x in range(5) if x % 2 == 0]?$zz154$,
   $zz155$["[0, 2, 4]", "[1, 3]", "[0, 1, 2, 3, 4]", "Error"]$zz155$::jsonb,
   0, $zz156$The list comprehension keeps only values from range(5) where x % 2 == 0, which are 0, 2, and 4.$zz156$, 1, 7),
  ('tq-py-datastructures-9', 'pt-py-datastructures',
   $zz157$Since which Python version do dictionaries maintain insertion order?$zz157$,
   $zz158$["2.7", "3.5", "3.7", "3.10"]$zz158$::jsonb,
   2, $zz159$Dictionaries have guaranteed insertion order since Python 3.7 — before that it was an implementation detail, not a language guarantee.$zz159$, 1, 8),
  ('tq-py-datastructures-10', 'pt-py-datastructures',
   $zz160$Which of these can be used as a dictionary key?$zz160$,
   $zz161$["A list", "A dictionary", "A tuple", "A set"]$zz161$::jsonb,
   2, $zz162$Keys must be immutable/hashable; tuples qualify, while lists, dictionaries, and sets are all mutable and can't be used as keys.$zz162$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-py-datastructures' and question_count <> 10;

-- Strings — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'python-basics/strings')
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-py-strings', $zz163$Strings - Quick Test$zz163$, 'aptitude', 10, 10,
  $zz164$10 questions covering indexing, slicing, immutability, string methods, formatting and raw strings.$zz164$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $zz165$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$zz165$, true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-py-strings-1', 'pt-py-strings',
   $zz166$What is the output of "Python"[1:4]?$zz166$,
   $zz167$["Pyt", "yth", "ytho", "thon"]$zz167$::jsonb,
   1, $zz168$Slicing [1:4] takes characters at indexes 1, 2 and 3 — 'y', 't', 'h' — giving "yth"; the character at index 4 is not included.$zz168$, 1, 0),
  ('tq-py-strings-2', 'pt-py-strings',
   $zz169$What is the output of "hello"[::-1]?$zz169$,
   $zz170$["hello", "olleh", "Error", "h"]$zz170$::jsonb,
   1, $zz171$A slice step of -1 walks the string backwards from the end, reversing it to "olleh".$zz171$, 1, 1),
  ('tq-py-strings-3', 'pt-py-strings',
   $zz172$Are strings mutable in Python?$zz172$,
   $zz173$["Yes", "No", "Only with .replace()", "Only single characters"]$zz173$::jsonb,
   1, $zz174$Strings are immutable — no method or operation changes a string's characters in place; they always produce a brand-new string.$zz174$, 1, 2),
  ('tq-py-strings-4', 'pt-py-strings',
   $zz175$Which method removes leading and trailing whitespace?$zz175$,
   $zz176$[".trim()", ".strip()", ".clean()", ".remove()"]$zz176$::jsonb,
   1, $zz177$.strip() removes whitespace from both ends of a string; Python has no .trim() method.$zz177$, 1, 3),
  ('tq-py-strings-5', 'pt-py-strings',
   $zz178$What does "find" return if the substring is not found?$zz178$,
   $zz179$["None", "-1", "Raises an error", "0"]$zz179$::jsonb,
   1, $zz180$.find() returns -1 when the substring isn't present, instead of raising an error like .index() does.$zz180$, 1, 4),
  ('tq-py-strings-6', 'pt-py-strings',
   $zz181$What is the modern, recommended way to format strings in Python (3.6+)?$zz181$,
   $zz182$["% formatting", ".format()", "f-strings", "String concatenation with +"]$zz182$::jsonb,
   2, $zz183$f-strings are the modern standard — more readable and generally faster than .format() or % formatting.$zz183$, 1, 5),
  ('tq-py-strings-7', 'pt-py-strings',
   $zz184$What does the r prefix do in r"C:\Users"?$zz184$,
   $zz185$["Reverses the string", "Makes it read-only", "Treats backslashes as literal characters", "Removes whitespace"]$zz185$::jsonb,
   2, $zz186$The r prefix creates a raw string, so backslashes are kept as literal characters instead of starting an escape sequence — useful for file paths and regex patterns.$zz186$, 1, 6),
  ('tq-py-strings-8', 'pt-py-strings',
   $zz187$What is the output of "5" + "5"?$zz187$,
   $zz188$["10", "\"55\"", "Error", "5.5"]$zz188$::jsonb,
   1, $zz189$Both operands are strings, so + performs string concatenation rather than addition, joining them into "55".$zz189$, 1, 7),
  ('tq-py-strings-9', 'pt-py-strings',
   $zz190$Which method splits a string into a list of words by whitespace?$zz190$,
   $zz191$[".join()", ".split()", ".divide()", ".partition()"]$zz191$::jsonb,
   1, $zz192$.split() with no arguments breaks a string into a list of words on any whitespace, handling multiple spaces gracefully.$zz192$, 1, 8),
  ('tq-py-strings-10', 'pt-py-strings',
   $zz193$What is the difference between .find() and .index()?$zz193$,
   $zz194$["No difference", ".find() raises an error if not found; .index() returns -1", ".index() raises an error if not found; .find() returns -1", ".find() only works on lists"]$zz194$::jsonb,
   2, $zz195$.index() raises a ValueError when the substring is missing, while .find() safely returns -1 instead of crashing.$zz195$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-py-strings' and question_count <> 10;

-- ===========================================================================
-- 5. CODING PROBLEMS — 4 Python-only problems per topic (topic_id NULL, global
--    slug). Skips a slug already taken by any existing row (e.g. an admin's).
-- ===========================================================================

-- Python Fundamentals — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'python-basics/python-fundamentals')
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-py-fundamentals-1', null::text, $zz198$Personal Details Formatter$zz198$, 'Easy', 'py-fundamentals-personal-details-formatter',
   $zz199$Practice reading multiple pieces of input and combining them into one clean sentence using an f-string.

You are given a person's name, age, and city, one per line. Combine them into a single formatted sentence.

**What the problem means:** read three separate pieces of input (two pieces of text, one number) and weave them into one output sentence, matching the punctuation shown in the example exactly.

**Approach:** read the name and city directly with `input()`. Read the age as an integer with `int(input())`. Then build the sentence with an f-string.

**Input:** Three lines: the person's name, their age (a whole number), and their city.

**Output:** One line: `<name> is <age> years old and lives in <city>.`$zz199$,
   $zz200$[{"input": "Aditi\n21\nPune", "output": "Aditi is 21 years old and lives in Pune."}]$zz200$::jsonb,
   $zz201$["Name and city contain no digits.", "1 <= age <= 120"]$zz201$::jsonb,
   jsonb_build_object('python', $zz196$name = input()
age = int(input())
city = input()

# build and print the sentence
$zz196$),
   $zz202$["Read the three lines in order: name, age, city.", "int() converts the age line into a whole number before you use it in the f-string.", "An f-string like f\"{name} is {age} years old\" inserts variable values directly into the text."]$zz202$::jsonb,
   $zz203$[{"input": "Aditi\n21\nPune", "expected": "Aditi is 21 years old and lives in Pune.", "hidden": false}, {"input": "Rohan\n19\nDelhi", "expected": "Rohan is 19 years old and lives in Delhi.", "hidden": true}]$zz203$::jsonb,
   $zz204$Read the three input lines in order — name and city as plain strings, age converted with int(). Then plug all three straight into one f-string that matches the required punctuation exactly: f"{name} is {age} years old and lives in {city}.". The whole problem is really about combining input(), int(), and f-strings — the three building blocks covered earlier in this topic.$zz204$,
   jsonb_build_object('python', $zz197$name = input()
age = int(input())
city = input()
print(f"{name} is {age} years old and lives in {city}.")
$zz197$),
   array['python'], 'published', false, 0),
  ('cp-py-fundamentals-2', null::text, $zz207$Temperature Converter$zz207$, 'Easy', 'py-fundamentals-temperature-converter',
   $zz208$Convert a Celsius temperature into both Fahrenheit and Kelvin using the standard conversion formulas.

**What the problem means:** you're given one temperature in Celsius and need to compute the same temperature in two other common scales.

**Formulas:** `F = C * 9/5 + 32` and `K = C + 273.15`.

**Approach:** read the Celsius value as a float, compute F and K with the formulas above, then print all three values formatted to the decimal places shown in the example.

**Input:** One line: a temperature in Celsius (may include a decimal point, may be negative).

**Output:** One line: `<C>°C = <F>°F = <K>K`, with Celsius and Fahrenheit shown to 1 decimal place and Kelvin to 2.$zz208$,
   $zz209$[{"input": "25", "output": "25.0°C = 77.0°F = 298.15K"}]$zz209$::jsonb,
   $zz210$["-273.15 <= C <= 1000"]$zz210$::jsonb,
   jsonb_build_object('python', $zz205$c = float(input())

# compute f and k, then print in the required format
$zz205$),
   $zz211$["Use the exact formulas: F = C * 9/5 + 32 and K = C + 273.15.", "f\"{value:.1f}\" formats a number to 1 decimal place; f\"{value:.2f}\" formats it to 2."]$zz211$::jsonb,
   $zz212$[{"input": "25", "expected": "25.0°C = 77.0°F = 298.15K", "hidden": false}, {"input": "0", "expected": "0.0°C = 32.0°F = 273.15K", "hidden": false}, {"input": "-10", "expected": "-10.0°C = 14.0°F = 263.15K", "hidden": true}]$zz212$::jsonb,
   $zz213$Read C as a float, then apply the two conversion formulas directly: F = C * 9/5 + 32 and K = C + 273.15. The only tricky part is matching the exact output formatting — use f"{c:.1f}" and f"{f:.1f}" for one decimal place, and f"{k:.2f}" for two decimal places, then join them with the ° and unit labels shown in the example.$zz213$,
   jsonb_build_object('python', $zz206$c = float(input())
f = c * 9 / 5 + 32
k = c + 273.15
print(f"{c:.1f}°C = {f:.1f}°F = {k:.2f}K")
$zz206$),
   array['python'], 'published', false, 1),
  ('cp-py-fundamentals-3', null::text, $zz216$Swap Two Numbers Without a Third Variable$zz216$, 'Medium', 'py-fundamentals-swap-two-numbers',
   $zz217$Read two numbers and swap their values without using a third temporary variable, then print the values both before and after the swap.

**What the problem means:** normally, swapping two variables needs a helper variable to hold one value temporarily. Python lets you do it in a single line without one.

**Approach:** read a and b, print them, then swap using tuple assignment: `a, b = b, a`. Print them again.

**Input:** Two lines: the first number a, then the second number b (both whole numbers).

**Output:** Two lines:
`Before swap: a = <a>, b = <b>`
`After swap: a = <b>, b = <a>`$zz217$,
   $zz218$[{"input": "10\n20", "output": "Before swap: a = 10, b = 20\nAfter swap: a = 20, b = 10"}]$zz218$::jsonb,
   $zz219$["-10^9 <= a, b <= 10^9"]$zz219$::jsonb,
   jsonb_build_object('python', $zz214$a = int(input())
b = int(input())

print(f"Before swap: a = {a}, b = {b}")
# swap a and b here without a third variable
print(f"After swap: a = {a}, b = {b}")
$zz214$),
   $zz220$["Python can assign to multiple variables in one line: a, b = b, a swaps them directly.", "Print the \"before\" line first, then swap, then print the \"after\" line."]$zz220$::jsonb,
   $zz221$[{"input": "10\n20", "expected": "Before swap: a = 10, b = 20\nAfter swap: a = 20, b = 10", "hidden": false}, {"input": "-5\n7", "expected": "Before swap: a = -5, b = 7\nAfter swap: a = 7, b = -5", "hidden": true}]$zz221$::jsonb,
   $zz222$Python evaluates the right-hand side of a, b = b, a fully before assigning, so it naturally swaps both variables in one step — no temporary third variable required. Print the values, perform the swap, then print again.$zz222$,
   jsonb_build_object('python', $zz215$a = int(input())
b = int(input())
print(f"Before swap: a = {a}, b = {b}")
a, b = b, a
print(f"After swap: a = {a}, b = {b}")
$zz215$),
   array['python'], 'published', false, 2),
  ('cp-py-fundamentals-4', null::text, $zz225$Simple Interest and Total Amount Calculator$zz225$, 'Easy', 'py-fundamentals-simple-interest-calculator',
   $zz226$Calculate simple interest and the total amount payable, given a principal, an annual interest rate, and a time period.

**Formula:** `SI = (P * R * T) / 100`. The total amount is `P + SI`.

**Approach:** read P, R, and T (all can have decimals), compute SI and the total, and print both rounded to exactly 2 decimal places.

**Input:** Three lines: principal P, annual rate of interest R (a percentage), and time T in years.

**Output:** Two lines:
`Simple Interest: <SI>`
`Total Amount: <total>`
both rounded to 2 decimal places.$zz226$,
   $zz227$[{"input": "10000\n7.5\n3", "output": "Simple Interest: 2250.00\nTotal Amount: 12250.00"}]$zz227$::jsonb,
   $zz228$["0 <= P, R, T <= 10^7"]$zz228$::jsonb,
   jsonb_build_object('python', $zz223$p = float(input())
r = float(input())
t = float(input())

# compute simple interest and total amount, then print both
$zz223$),
   $zz229$["SI = (P * R * T) / 100.", "The total amount is the principal plus the interest: P + SI.", "Format both results with :.2f so they always show exactly 2 decimal places."]$zz229$::jsonb,
   $zz230$[{"input": "10000\n7.5\n3", "expected": "Simple Interest: 2250.00\nTotal Amount: 12250.00", "hidden": false}, {"input": "5000\n10\n2", "expected": "Simple Interest: 1000.00\nTotal Amount: 6000.00", "hidden": true}]$zz230$::jsonb,
   $zz231$Apply the simple-interest formula directly: SI = (P * R * T) / 100, then total = P + SI. Print both using :.2f formatting so the output always has exactly two decimal places, matching the sample exactly.$zz231$,
   jsonb_build_object('python', $zz224$p = float(input())
r = float(input())
t = float(input())
si = (p * r * t) / 100
total = p + si
print(f"Simple Interest: {si:.2f}")
print(f"Total Amount: {total:.2f}")
$zz224$),
   array['python'], 'published', false, 3)
) as v(id, topic_id, title, difficulty, slug, description,
       examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
       supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- Conditional Statements — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'python-basics/conditional-statements')
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-py-conditionals-1', null::text, $zz234$Grade Calculator$zz234$, 'Easy', 'py-conditionals-grade-calculator',
   $zz235$Take a mark out of 100 and print the letter grade it earns.

**Grading scale:** A (marks >= 90), B (marks >= 75), C (marks >= 60), D (marks >= 40), Fail (below 40).

**Approach:** this is a direct if-elif-else chain — check the highest boundary first, and let the first matching condition decide the grade.

**Input:** One line: marks, a whole number from 0 to 100.

**Output:** One line: `Grade: <letter>`$zz235$,
   $zz236$[{"input": "82", "output": "Grade: B"}]$zz236$::jsonb,
   $zz237$["0 <= marks <= 100"]$zz237$::jsonb,
   jsonb_build_object('python', $zz232$marks = int(input())

# use if-elif-else to decide the grade, then print it
$zz232$),
   $zz238$["Check thresholds from highest to lowest: 90, then 75, then 60, then 40.", "Only the first matching condition in the chain should run."]$zz238$::jsonb,
   $zz239$[{"input": "82", "expected": "Grade: B", "hidden": false}, {"input": "95", "expected": "Grade: A", "hidden": false}, {"input": "30", "expected": "Grade: Fail", "hidden": true}, {"input": "60", "expected": "Grade: C", "hidden": true}]$zz239$::jsonb,
   $zz240$Check the boundaries from highest to lowest with if / elif so that once a condition matches, Python stops checking the rest: marks >= 90 -> A, elif >= 75 -> B, elif >= 60 -> C, elif >= 40 -> D, else -> Fail.$zz240$,
   jsonb_build_object('python', $zz233$marks = int(input())
if marks >= 90:
    grade = "A"
elif marks >= 75:
    grade = "B"
elif marks >= 60:
    grade = "C"
elif marks >= 40:
    grade = "D"
else:
    grade = "Fail"
print(f"Grade: {grade}")
$zz233$),
   array['python'], 'published', false, 0),
  ('cp-py-conditionals-2', null::text, $zz243$Leap Year Checker$zz243$, 'Medium', 'py-conditionals-leap-year-checker',
   $zz244$Determine whether a given year is a leap year.

**Rule:** a year is a leap year if it's divisible by 4, **except** century years (divisible by 100), which are only leap years if they're also divisible by 400.

**Approach:** combine the three checks with and/or: `(year % 4 == 0 and year % 100 != 0) or (year % 400 == 0)`.

**Input:** One line: a year (a whole number).

**Output:** One line: `<year> is a leap year` or `<year> is not a leap year`.$zz244$,
   $zz245$[{"input": "2024", "output": "2024 is a leap year"}]$zz245$::jsonb,
   $zz246$["1 <= year <= 9999"]$zz246$::jsonb,
   jsonb_build_object('python', $zz241$year = int(input())

# decide if year is a leap year, then print the right message
$zz241$),
   $zz247$["A year divisible by 4 is usually a leap year...", "...unless it's also divisible by 100, in which case it must also be divisible by 400.", "Combine the checks with and / or rather than nesting several if statements."]$zz247$::jsonb,
   $zz248$[{"input": "2024", "expected": "2024 is a leap year", "hidden": false}, {"input": "2023", "expected": "2023 is not a leap year", "hidden": false}, {"input": "1900", "expected": "1900 is not a leap year", "hidden": true}, {"input": "2000", "expected": "2000 is a leap year", "hidden": true}]$zz248$::jsonb,
   $zz249$A year is a leap year when (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0) — divisible by 4 covers most leap years, the % 100 check excludes century years, and the % 400 check adds century years like 2000 back in.$zz249$,
   jsonb_build_object('python', $zz242$year = int(input())
is_leap = (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0)
if is_leap:
    print(f"{year} is a leap year")
else:
    print(f"{year} is not a leap year")
$zz242$),
   array['python'], 'published', false, 1),
  ('cp-py-conditionals-3', null::text, $zz252$Triangle Type Classifier$zz252$, 'Medium', 'py-conditionals-triangle-type-classifier',
   $zz253$Given the three side lengths of a triangle, classify it as Equilateral, Isosceles, or Scalene.

- **Equilateral** — all three sides equal.
- **Isosceles** — exactly two sides equal.
- **Scalene** — all three sides different.

**Approach:** read all three sides on one line, then use if-elif-else to check all-equal first, then any-pair-equal, then default to Scalene.

**Input:** One line: three side lengths separated by spaces.

**Output:** One line: `Equilateral Triangle`, `Isosceles Triangle`, or `Scalene Triangle`.$zz253$,
   $zz254$[{"input": "5 5 8", "output": "Isosceles Triangle"}]$zz254$::jsonb,
   $zz255$["1 <= each side <= 10^6"]$zz255$::jsonb,
   jsonb_build_object('python', $zz250$a, b, c = map(int, input().split())

# classify the triangle and print the result
$zz250$),
   $zz256$["Check the all-equal case (a == b == c) before checking any pair.", "Python lets you chain comparisons: a == b == c checks all three are equal at once.", "If it isn't equilateral, check whether any two of the three sides are equal."]$zz256$::jsonb,
   $zz257$[{"input": "5 5 8", "expected": "Isosceles Triangle", "hidden": false}, {"input": "5 5 5", "expected": "Equilateral Triangle", "hidden": false}, {"input": "3 4 5", "expected": "Scalene Triangle", "hidden": true}]$zz257$::jsonb,
   $zz258$Check the most specific case first: a == b == c means all sides are equal (Equilateral). Otherwise, if any pair matches (a == b or b == c or a == c), it's Isosceles. If neither check matches, the sides must all differ, so it's Scalene.$zz258$,
   jsonb_build_object('python', $zz251$a, b, c = map(int, input().split())
if a == b == c:
    print("Equilateral Triangle")
elif a == b or b == c or a == c:
    print("Isosceles Triangle")
else:
    print("Scalene Triangle")
$zz251$),
   array['python'], 'published', false, 2),
  ('cp-py-conditionals-4', null::text, $zz261$Traffic Light Simulator (match-case)$zz261$, 'Easy', 'py-conditionals-traffic-light-simulator',
   $zz262$Read a traffic light color and print the correct action, using Python's match-case statement.

- `red` -> `Stop`
- `yellow` -> `Get Ready`
- `green` -> `Go`
- anything else -> `Invalid signal`

**Approach:** this is a direct application of match-case from this topic — one case per color, plus a case _: default for anything unrecognized.

**Input:** One line: a color name ("red", "yellow", or "green").

**Output:** One line: the matching action.$zz262$,
   $zz263$[{"input": "yellow", "output": "Get Ready"}]$zz263$::jsonb,
   $zz264$["The input is a single word, any case."]$zz264$::jsonb,
   jsonb_build_object('python', $zz259$color = input().strip().lower()

# use match-case to print the correct action
$zz259$),
   $zz265$["Normalize the input first (.strip().lower()) so \"Red\" and \"red\" both match.", "Use match color: with one case per color string.", "Add case _: as the default for anything that isn't red, yellow, or green."]$zz265$::jsonb,
   $zz266$[{"input": "yellow", "expected": "Get Ready", "hidden": false}, {"input": "red", "expected": "Stop", "hidden": false}, {"input": "purple", "expected": "Invalid signal", "hidden": true}, {"input": "green", "expected": "Go", "hidden": true}]$zz266$::jsonb,
   $zz267$match color: compares the (lower-cased, stripped) input against each case in order — "red" prints Stop, "yellow" prints Get Ready, "green" prints Go, and case _: catches anything else and prints Invalid signal.$zz267$,
   jsonb_build_object('python', $zz260$color = input().strip().lower()
match color:
    case "red":
        print("Stop")
    case "yellow":
        print("Get Ready")
    case "green":
        print("Go")
    case _:
        print("Invalid signal")
$zz260$),
   array['python'], 'published', false, 3)
) as v(id, topic_id, title, difficulty, slug, description,
       examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
       supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- Loops — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'python-basics/loops')
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-py-loops-1', null::text, $zz270$Multiplication Table Generator$zz270$, 'Easy', 'py-loops-multiplication-table-generator',
   $zz271$Print the multiplication table of a given number, from 1 to 10.

**Approach:** loop i from 1 to 10 with a for loop and range(), printing one line per value in the exact format `n x i = n*i`.

**Input:** One line: a whole number n.

**Output:** 10 lines, one per i from 1 to 10: `n x i = <n*i>`$zz271$,
   $zz272$[{"input": "5", "output": "5 x 1 = 5\n5 x 2 = 10\n5 x 3 = 15\n5 x 4 = 20\n5 x 5 = 25\n5 x 6 = 30\n5 x 7 = 35\n5 x 8 = 40\n5 x 9 = 45\n5 x 10 = 50"}]$zz272$::jsonb,
   $zz273$["-1000 <= n <= 1000"]$zz273$::jsonb,
   jsonb_build_object('python', $zz268$n = int(input())

for i in range(1, 11):
    # print one line of the table
    pass
$zz268$),
   $zz274$["range(1, 11) produces 1 through 10.", "Each line follows the pattern f\"{n} x {i} = {n*i}\"."]$zz274$::jsonb,
   $zz275$[{"input": "5", "expected": "5 x 1 = 5\n5 x 2 = 10\n5 x 3 = 15\n5 x 4 = 20\n5 x 5 = 25\n5 x 6 = 30\n5 x 7 = 35\n5 x 8 = 40\n5 x 9 = 45\n5 x 10 = 50", "hidden": false}, {"input": "1", "expected": "1 x 1 = 1\n1 x 2 = 2\n1 x 3 = 3\n1 x 4 = 4\n1 x 5 = 5\n1 x 6 = 6\n1 x 7 = 7\n1 x 8 = 8\n1 x 9 = 9\n1 x 10 = 10", "hidden": true}]$zz275$::jsonb,
   $zz276$A single for i in range(1, 11) loop covers multipliers 1 through 10; each iteration prints f"{n} x {i} = {n*i}", which is exactly the required line format.$zz276$,
   jsonb_build_object('python', $zz269$n = int(input())
for i in range(1, 11):
    print(f"{n} x {i} = {n*i}")
$zz269$),
   array['python'], 'published', false, 0),
  ('cp-py-loops-2', null::text, $zz279$Sum of Digits$zz279$, 'Easy', 'py-loops-sum-of-digits',
   $zz280$Read a whole number and print the sum of its digits, using a while loop.

**Approach:** repeatedly take the last digit with n % 10, add it to a running total, then remove that digit with n //= 10, until n becomes 0.

**Input:** One line: a whole number n (may be negative — use its digits regardless of sign).

**Output:** One line: `Sum of digits: <total>`$zz280$,
   $zz281$[{"input": "1234", "output": "Sum of digits: 10"}]$zz281$::jsonb,
   $zz282$["-10^9 <= n <= 10^9"]$zz282$::jsonb,
   jsonb_build_object('python', $zz277$n = abs(int(input()))
total = 0

# use a while loop to add up each digit of n

print(f"Sum of digits: {total}")
$zz277$),
   $zz283$["n % 10 gives the last digit; n //= 10 removes it.", "Loop while n > 0, adding each digit to a running total.", "Take the absolute value first so negative numbers work the same way."]$zz283$::jsonb,
   $zz284$[{"input": "1234", "expected": "Sum of digits: 10", "hidden": false}, {"input": "9000", "expected": "Sum of digits: 9", "hidden": true}]$zz284$::jsonb,
   $zz285$Take the absolute value so the sign doesn't matter, then repeatedly peel off the last digit with n % 10, add it to a running total, and shrink n with integer division n //= 10 until nothing is left.$zz285$,
   jsonb_build_object('python', $zz278$n = abs(int(input()))
total = 0
while n > 0:
    total += n % 10
    n //= 10
print(f"Sum of digits: {total}")
$zz278$),
   array['python'], 'published', false, 1),
  ('cp-py-loops-3', null::text, $zz288$Prime Number Checker$zz288$, 'Medium', 'py-loops-prime-number-checker',
   $zz289$Determine whether a given number is prime, using a for loop with loop-else.

**What is a prime number?** a whole number greater than 1 that has no divisors other than 1 and itself.

**Approach:** try dividing n by every number from 2 up to n-1. If none divide evenly, the loop finishes without a break and confirms the number is prime.

**Input:** One line: a whole number n.

**Output:** One line: `<n> is a prime number` or `<n> is not a prime number`.$zz289$,
   $zz290$[{"input": "17", "output": "17 is a prime number"}]$zz290$::jsonb,
   $zz291$["1 <= n <= 100000"]$zz291$::jsonb,
   jsonb_build_object('python', $zz286$n = int(input())

# use a for loop + loop-else to decide if n is prime, then print the result
$zz286$),
   $zz292$["Numbers less than 2 are never prime.", "Loop i from 2 up to (but not including) n; if n % i == 0 for any i, it's not prime — break immediately.", "The loop's else block runs only when the loop finishes without hitting break, which means no divisor was found."]$zz292$::jsonb,
   $zz293$[{"input": "17", "expected": "17 is a prime number", "hidden": false}, {"input": "18", "expected": "18 is not a prime number", "hidden": false}, {"input": "2", "expected": "2 is a prime number", "hidden": true}, {"input": "1", "expected": "1 is not a prime number", "hidden": true}]$zz293$::jsonb,
   $zz294$Numbers below 2 are never prime, so handle that first. Otherwise loop i from 2 up to n-1: if any i divides n evenly, set a flag to False and break. The loop-else pattern works just as well — the else block only runs when the loop completes without a break, i.e. no divisor was ever found.$zz294$,
   jsonb_build_object('python', $zz287$n = int(input())
if n < 2:
    print(f"{n} is not a prime number")
else:
    is_prime = True
    for i in range(2, n):
        if n % i == 0:
            is_prime = False
            break
    print(f"{n} is a prime number" if is_prime else f"{n} is not a prime number")
$zz287$),
   array['python'], 'published', false, 2),
  ('cp-py-loops-4', null::text, $zz297$Star Pyramid Pattern$zz297$, 'Medium', 'py-loops-star-pyramid-pattern',
   $zz298$Print a centered pyramid of stars with the given number of rows, using nested loops.

**Example for 4 rows:**
```
   *
  ***
 *****
*******
```

**Approach:** for row i (starting at 1), print (rows - i) leading spaces followed by (2*i - 1) stars.

**Input:** One line: the number of rows (a whole number).

**Output:** `rows` lines forming a centered star pyramid, as shown above.$zz298$,
   $zz299$[{"input": "4", "output": "   *\n  ***\n *****\n*******"}]$zz299$::jsonb,
   $zz300$["1 <= rows <= 50"]$zz300$::jsonb,
   jsonb_build_object('python', $zz295$rows = int(input())

for i in range(1, rows + 1):
    # print the right number of spaces, then the right number of stars
    pass
$zz295$),
   $zz301$["Row i needs (rows - i) leading spaces and (2*i - 1) stars.", "String repetition works with *: \" \" * 3 gives three spaces, \"*\" * 5 gives five stars.", "Build the whole line as one string, e.g. \" \" * (rows - i) + \"*\" * (2 * i - 1), then print it."]$zz301$::jsonb,
   $zz302$[{"input": "4", "expected": "   *\n  ***\n *****\n*******", "hidden": false}, {"input": "1", "expected": "*", "hidden": true}]$zz302$::jsonb,
   $zz303$For each row i from 1 to rows, the number of leading spaces is rows - i and the number of stars is 2*i - 1 (the odd numbers 1, 3, 5, ...). Printing " " * (rows - i) + "*" * (2 * i - 1) on each iteration builds the pyramid one row at a time.$zz303$,
   jsonb_build_object('python', $zz296$rows = int(input())
for i in range(1, rows + 1):
    print(" " * (rows - i) + "*" * (2 * i - 1))
$zz296$),
   array['python'], 'published', false, 3)
) as v(id, topic_id, title, difficulty, slug, description,
       examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
       supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- Python Data Structures — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'python-basics/python-data-structures')
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-py-datastructures-1', null::text, $zz306$Remove Duplicates, Preserve Order$zz306$, 'Medium', 'py-datastructures-remove-duplicates-preserve-order',
   $zz307$Given a list of numbers that may contain duplicates, print a new list with duplicates removed, keeping the original order of first appearance.

**Why not just use set()?** converting straight to a set removes duplicates but loses the original order, since sets are unordered. You need to track what's already been seen while keeping the original sequence.

**Approach:** loop through the numbers, keep a set of values seen so far, and only add a number to the result list the first time it appears.

**Input:** One line: space-separated whole numbers.

**Output:** One line: the numbers with duplicates removed, printed as a Python list (in order of first appearance).$zz307$,
   $zz308$[{"input": "4 2 4 3 2 1", "output": "[4, 2, 3, 1]"}]$zz308$::jsonb,
   $zz309$["1 <= count of numbers <= 1000"]$zz309$::jsonb,
   jsonb_build_object('python', $zz304$nums = list(map(int, input().split()))
seen = set()
result = []

# fill result with each number's FIRST occurrence, in order

print(result)
$zz304$),
   $zz310$["A set gives fast \"have I seen this before?\" checks with in.", "Walk through nums in order; append a number to result only the first time you see it, and record it in seen right away.", "print(result) on a plain Python list already prints it in the [1, 2, 3] format shown in the example."]$zz310$::jsonb,
   $zz311$[{"input": "4 2 4 3 2 1", "expected": "[4, 2, 3, 1]", "hidden": false}, {"input": "1 1 1 1", "expected": "[1]", "hidden": true}]$zz311$::jsonb,
   $zz312$Keep a set of numbers already seen, and a list for the answer. Walk through the input once; whenever a number hasn't been seen before, append it to the result list and add it to the seen set. Because you only ever append on first sight, the result naturally preserves the original order while dropping every later duplicate.$zz312$,
   jsonb_build_object('python', $zz305$nums = list(map(int, input().split()))
seen = set()
result = []
for n in nums:
    if n not in seen:
        seen.add(n)
        result.append(n)
print(result)
$zz305$),
   array['python'], 'published', false, 0),
  ('cp-py-datastructures-2', null::text, $zz315$Word Frequency Counter$zz315$, 'Easy', 'py-datastructures-word-frequency-counter',
   $zz316$Given a sentence, count how many times each word appears, using a dictionary.

**Approach:** split the sentence into words, then loop through them, using dict.get(word, 0) + 1 to increase each word's count — building up one dictionary of word -> count.

**Input:** One line: a sentence of space-separated words.

**Output:** One line: a Python dictionary mapping each word to how many times it appeared, in order of first appearance.$zz316$,
   $zz317$[{"input": "the cat sat on the mat the cat ran", "output": "{'the': 3, 'cat': 2, 'sat': 1, 'on': 1, 'mat': 1, 'ran': 1}"}]$zz317$::jsonb,
   $zz318$["1 <= number of words <= 1000"]$zz318$::jsonb,
   jsonb_build_object('python', $zz313$sentence = input()
words = sentence.split()
freq = {}

# count each word's occurrences into freq

print(freq)
$zz313$),
   $zz319$[".split() with no arguments breaks the sentence into a list of words on whitespace.", "freq.get(word, 0) safely returns 0 for a word not seen yet, so freq[word] = freq.get(word, 0) + 1 works for both new and repeated words.", "Python dictionaries keep insertion order, so the printed dict will list words in the order they first appeared."]$zz319$::jsonb,
   $zz320$[{"input": "the cat sat on the mat the cat ran", "expected": "{'the': 3, 'cat': 2, 'sat': 1, 'on': 1, 'mat': 1, 'ran': 1}", "hidden": false}, {"input": "a a a", "expected": "{'a': 3}", "hidden": true}]$zz320$::jsonb,
   $zz321$Split the sentence into words, then loop through them updating a dictionary with freq[w] = freq.get(w, 0) + 1 for each word — .get() avoids a KeyError the first time a word appears. Since dictionaries preserve insertion order, printing freq at the end naturally lists words in the order they were first seen.$zz321$,
   jsonb_build_object('python', $zz314$sentence = input()
words = sentence.split()
freq = {}
for w in words:
    freq[w] = freq.get(w, 0) + 1
print(freq)
$zz314$),
   array['python'], 'published', false, 1),
  ('cp-py-datastructures-3', null::text, $zz324$Merge Two Dictionaries$zz324$, 'Medium', 'py-datastructures-merge-two-dictionaries',
   $zz325$Merge two dictionaries into one. If a key exists in both, the second dictionary's value should win.

**Input format:** each dictionary is given on its own line as comma-separated key:value pairs, e.g. `a:1,b:2`.

**Approach:** parse each line into a real dictionary, then merge them with dictionary unpacking {**d1, **d2} — keys from d2 override matching keys from d1.

**Input:** Two lines, each a comma-separated list of key:value pairs (values are whole numbers), e.g. `a:1,b:2`.

**Output:** One line: the merged dictionary, printed in Python dict format.$zz325$,
   $zz326$[{"input": "a:1,b:2\nb:3,c:4", "output": "{'a': 1, 'b': 3, 'c': 4}"}]$zz326$::jsonb,
   $zz327$["1 <= number of pairs per line <= 100"]$zz327$::jsonb,
   jsonb_build_object('python', $zz322$def parse(line):
    d = {}
    for pair in line.split(","):
        key, value = pair.split(":")
        d[key] = int(value)
    return d

d1 = parse(input())
d2 = parse(input())

# merge d1 and d2 (d2's values should win on shared keys), then print the result
$zz322$),
   $zz328$["{**d1, **d2} builds a new dictionary containing all of d1's pairs, then all of d2's pairs — matching keys from d2 overwrite d1's.", "The parse() helper is already provided to turn each input line into a dictionary."]$zz328$::jsonb,
   $zz329$[{"input": "a:1,b:2\nb:3,c:4", "expected": "{'a': 1, 'b': 3, 'c': 4}", "hidden": false}, {"input": "x:5\ny:6", "expected": "{'x': 5, 'y': 6}", "hidden": true}]$zz329$::jsonb,
   $zz330$Once both lines are parsed into real dictionaries, merging them is one line: merged = {**d1, **d2}. Dictionary unpacking inserts d1's pairs first, then d2's — so on a shared key, d2's value is written last and wins, matching the required "second dictionary wins" rule.$zz330$,
   jsonb_build_object('python', $zz323$def parse(line):
    d = {}
    for pair in line.split(","):
        key, value = pair.split(":")
        d[key] = int(value)
    return d

d1 = parse(input())
d2 = parse(input())
merged = {**d1, **d2}
print(merged)
$zz323$),
   array['python'], 'published', false, 2),
  ('cp-py-datastructures-4', null::text, $zz333$Common and Unique Students$zz333$, 'Medium', 'py-datastructures-common-and-unique-students',
   $zz334$Given two lists of student names enrolled in two different courses, find the students enrolled in both, and the students enrolled in only one of the two courses.

**Approach:** put each course's names into a set, then use intersection() for students in both courses and symmetric_difference() for students in exactly one. Print each result sorted alphabetically (comma-separated) so the output is always in a predictable order.

**Input:** Two lines, each a comma-separated list of student names — the first course's roster, then the second's.

**Output:** Two lines:
`Both: <sorted, comma-separated names, or None>`
`Only one: <sorted, comma-separated names, or None>`$zz334$,
   $zz335$[{"input": "Aditi,Rohan,Zara\nRohan,Karan", "output": "Both: Rohan\nOnly one: Aditi, Karan, Zara"}]$zz335$::jsonb,
   $zz336$["1 <= students per course <= 200", "Names contain no commas."]$zz336$::jsonb,
   jsonb_build_object('python', $zz331$course_a = set(name.strip() for name in input().split(","))
course_b = set(name.strip() for name in input().split(","))

# find students in both, and students in exactly one, then print both lines (sorted!)
$zz331$),
   $zz337$["a & b (or a.intersection(b)) gives students enrolled in both courses.", "a ^ b (or a.symmetric_difference(b)) gives students enrolled in exactly one of the two.", "Sort each result with sorted(...) before printing — sets have no guaranteed order, so sorting keeps the output consistent every run."]$zz337$::jsonb,
   $zz338$[{"input": "Aditi,Rohan,Zara\nRohan,Karan", "expected": "Both: Rohan\nOnly one: Aditi, Karan, Zara", "hidden": false}, {"input": "Meera,Vikram\nMeera,Vikram", "expected": "Both: Meera, Vikram\nOnly one: None", "hidden": true}]$zz338$::jsonb,
   $zz339$Turn each course roster into a set. course_a & course_b (intersection) gives students in both; course_a ^ course_b (symmetric_difference) gives students in exactly one. Because plain set iteration order isn't guaranteed, sort each result before joining and printing so the output is deterministic.$zz339$,
   jsonb_build_object('python', $zz332$course_a = set(name.strip() for name in input().split(","))
course_b = set(name.strip() for name in input().split(","))
both = sorted(course_a & course_b)
only_one = sorted(course_a ^ course_b)
print(f"Both: {', '.join(both) if both else 'None'}")
print(f"Only one: {', '.join(only_one) if only_one else 'None'}")
$zz332$),
   array['python'], 'published', false, 3)
) as v(id, topic_id, title, difficulty, slug, description,
       examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
       supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- Strings — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'python-basics/strings')
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-py-strings-1', null::text, $zz342$Palindrome Checker$zz342$, 'Easy', 'py-strings-palindrome-checker',
   $zz343$Check whether a given string reads the same forwards and backwards (a palindrome), ignoring letter case.

**Approach:** compare the lower-cased string to its own reverse using slicing (s[::-1]).

**Input:** One line: a word or phrase.

**Output:** One line: `<original> is a palindrome` or `<original> is not a palindrome` — using the original text's casing in the message, but comparing case-insensitively.$zz343$,
   $zz344$[{"input": "Madam", "output": "Madam is a palindrome"}]$zz344$::jsonb,
   $zz345$["1 <= length <= 1000"]$zz345$::jsonb,
   jsonb_build_object('python', $zz340$s = input()

# compare s (case-insensitively) to its own reverse
$zz340$),
   $zz346$["s[::-1] reverses a string using slicing with a step of -1.", "Compare s.lower() to s.lower()[::-1] so the check ignores case.", "Print the ORIGINAL string s in the message, not the lower-cased version."]$zz346$::jsonb,
   $zz347$[{"input": "Madam", "expected": "Madam is a palindrome", "hidden": false}, {"input": "Hello", "expected": "Hello is not a palindrome", "hidden": false}]$zz347$::jsonb,
   $zz348$Lower-case the string so the comparison ignores letter case, then compare it to its own reverse using slicing: s.lower() == s.lower()[::-1]. The printed message uses the original (unmodified) string — only the comparison itself is case-insensitive.$zz348$,
   jsonb_build_object('python', $zz341$s = input()
if s.lower() == s.lower()[::-1]:
    print(f"{s} is a palindrome")
else:
    print(f"{s} is not a palindrome")
$zz341$),
   array['python'], 'published', false, 0),
  ('cp-py-strings-2', null::text, $zz351$Vowel Counter$zz351$, 'Easy', 'py-strings-vowel-counter',
   $zz352$Count how many vowels (a, e, i, o, u) appear in a sentence, counting both uppercase and lowercase.

**Approach:** loop through every character in the sentence and check (case-insensitively) whether it's one of the five vowels.

**Input:** One line: a sentence.

**Output:** One line: `Vowel count: <count>`$zz352$,
   $zz353$[{"input": "Programming is fun", "output": "Vowel count: 5"}]$zz353$::jsonb,
   $zz354$["1 <= length <= 1000"]$zz354$::jsonb,
   jsonb_build_object('python', $zz349$sentence = input()
count = 0

# count how many characters in sentence are vowels (case-insensitive)

print(f"Vowel count: {count}")
$zz349$),
   $zz355$["Check membership with in: char.lower() in \"aeiou\".", "Loop over every character in the sentence, including spaces — spaces just won't match any vowel."]$zz355$::jsonb,
   $zz356$[{"input": "Programming is fun", "expected": "Vowel count: 5", "hidden": false}, {"input": "Hello World", "expected": "Vowel count: 3", "hidden": true}]$zz356$::jsonb,
   $zz357$Loop through every character in the sentence and test char.lower() in "aeiou" — this catches both uppercase and lowercase vowels in one check. Counting the characters that pass gives the total vowel count. ("Programming is fun" has vowels o, a, i in "Programming", i in "is", and u in "fun" — five in total.)$zz357$,
   jsonb_build_object('python', $zz350$sentence = input()
count = sum(1 for ch in sentence if ch.lower() in "aeiou")
print(f"Vowel count: {count}")
$zz350$),
   array['python'], 'published', false, 1),
  ('cp-py-strings-3', null::text, $zz360$Anagram Checker$zz360$, 'Medium', 'py-strings-anagram-checker',
   $zz361$Check whether two strings are anagrams of each other — made of exactly the same letters, rearranged, ignoring case and spaces.

**Approach:** strip spaces and lower-case both strings, sort their characters, and compare the sorted results — two anagrams will always produce identical sorted character lists.

**Input:** Two lines: the first string, then the second string.

**Output:** One line: `They are anagrams` or `They are not anagrams`.$zz361$,
   $zz362$[{"input": "listen\nsilent", "output": "They are anagrams"}]$zz362$::jsonb,
   $zz363$["1 <= length of each string <= 1000"]$zz363$::jsonb,
   jsonb_build_object('python', $zz358$s1 = input()
s2 = input()

# clean (case + spaces) and compare both strings as anagrams
$zz358$),
   $zz364$["sorted(text) turns a string into a sorted list of its characters — two anagrams produce equal sorted lists.", "Remove spaces with .replace(\" \", \"\") and normalize case with .lower() before comparing."]$zz364$::jsonb,
   $zz365$[{"input": "listen\nsilent", "expected": "They are anagrams", "hidden": false}, {"input": "hello\nworld", "expected": "They are not anagrams", "hidden": true}]$zz365$::jsonb,
   $zz366$Clean both strings the same way — lower-case them and strip out spaces — then compare sorted(clean1) to sorted(clean2). Two strings are anagrams exactly when they contain the same characters in some order, which is exactly what comparing their sorted character lists checks.$zz366$,
   jsonb_build_object('python', $zz359$s1 = input()
s2 = input()
clean1 = sorted(s1.lower().replace(" ", ""))
clean2 = sorted(s2.lower().replace(" ", ""))
if clean1 == clean2:
    print("They are anagrams")
else:
    print("They are not anagrams")
$zz359$),
   array['python'], 'published', false, 2),
  ('cp-py-strings-4', null::text, $zz369$Title Case Without .title()$zz369$, 'Medium', 'py-strings-title-case-without-builtin',
   $zz370$Capitalize the first letter of every word in a sentence, without using the built-in .title() method.

**Approach:** split the sentence into words, capitalize each word manually (word[0].upper() + word[1:].lower()), and join them back together with spaces.

**Input:** One line: a sentence.

**Output:** One line: the same sentence with the first letter of every word capitalized.$zz370$,
   $zz371$[{"input": "the quick brown fox", "output": "The Quick Brown Fox"}]$zz371$::jsonb,
   $zz372$["1 <= number of words <= 200"]$zz372$::jsonb,
   jsonb_build_object('python', $zz367$sentence = input()
words = sentence.split()
result = []

# capitalize each word manually and add it to result

print(" ".join(result))
$zz367$),
   $zz373$["word[0] is the first character, word[1:] is everything after it.", "word[0].upper() + word[1:].lower() capitalizes a single word without .title().", "\" \".join(result) puts the words back together with single spaces between them."]$zz373$::jsonb,
   $zz374$[{"input": "the quick brown fox", "expected": "The Quick Brown Fox", "hidden": false}, {"input": "PYTHON is FUN", "expected": "Python Is Fun", "hidden": true}]$zz374$::jsonb,
   $zz375$Split the sentence into a list of words, then rebuild each word manually as word[0].upper() + word[1:].lower() — the first character upper-cased, the rest lower-cased. Joining the capitalized words back with " ".join(...) reproduces exactly what .title() would have done, without calling it.$zz375$,
   jsonb_build_object('python', $zz368$sentence = input()
words = sentence.split()
result = []
for w in words:
    result.append(w[0].upper() + w[1:].lower())
print(" ".join(result))
$zz368$),
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
  v_grid       uuid;
  v_topics     int;
  v_tests      int;
  v_questions  int;
  v_problems   int;
  v_bad_tests  int;
begin
  select id into v_grid from public.learning_grids where lower(slug) = 'python-tutorial';
  if v_grid is null then raise exception 'validation: python-tutorial grid missing'; end if;

  select count(*) into v_topics from public.learning_topics
   where source_kind = 'python_tutorial' and source_ref like 'python-basics/%';
  if v_topics <> 5 then raise exception 'validation: expected 5 python_tutorial topics, found %', v_topics; end if;

  -- NOTE: scoped to this migration's own 5 ids (not a bare 'pt-py-%'/'cp-py-%' wildcard) —
  -- later python-tutorial batches (e.g. 0051/028) reuse the same id prefixes for their own
  -- topics, and a broad wildcard here would double-count them and break re-run idempotency.
  select count(*) into v_tests from public.practice_tests
   where id in ('pt-py-fundamentals','pt-py-conditionals','pt-py-loops','pt-py-datastructures','pt-py-strings');
  if v_tests <> 5 then raise exception 'validation: expected 5 python topic mock tests, found %', v_tests; end if;

  select count(*) into v_bad_tests from public.practice_tests
   where id in ('pt-py-fundamentals','pt-py-conditionals','pt-py-loops','pt-py-datastructures','pt-py-strings')
     and (question_count <> 10 or duration_minutes <> 10);
  if v_bad_tests > 0 then raise exception 'validation: % python mock tests do not have 10 questions / 10 minute duration', v_bad_tests; end if;

  select count(*) into v_questions from public.test_questions
   where test_id in ('pt-py-fundamentals','pt-py-conditionals','pt-py-loops','pt-py-datastructures','pt-py-strings');
  if v_questions <> 50 then raise exception 'validation: expected 50 python MCQ rows (5 x 10), found %', v_questions; end if;

  select count(*) into v_problems from public.dsa_problems
   where id like 'cp-py-fundamentals-%' or id like 'cp-py-conditionals-%' or id like 'cp-py-loops-%'
      or id like 'cp-py-datastructures-%' or id like 'cp-py-strings-%';
  if v_problems <> 20 then raise exception 'validation: expected 20 python coding problems (5 x 4), found %', v_problems; end if;

  raise notice '0050 OK: Python Tutorial — 5 topics, 5 mock tests (50 MCQs), 20 coding problems.';
end $$;

notify pgrst, 'reload schema';
