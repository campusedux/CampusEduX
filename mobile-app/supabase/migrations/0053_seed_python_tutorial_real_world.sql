-- mobile-app/supabase/migrations/0053_seed_python_tutorial_real_world.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: admin-panel/supabase/migrations/030_seed_python_tutorial_real_world.sql ; apply either, the other is a guarded no-op.
--
-- ============================================================================
-- BODY — extend the "Python Tutorial" Learning grid with a 4th section: 5 more
-- topics (Web Development / Testing / Debugging & Logging / Git & GitHub / Data
-- Analysis), each with full notes and a 10-question mock test (10-minute
-- timer); coding-problem counts vary per topic — see notes below
-- (mobile 0053_seed_python_tutorial_real_world.sql ==
--  admin 030_seed_python_tutorial_real_world.sql below this header —
--  byte-identical, guarded, idempotent, additive.)
-- ============================================================================
-- Fourth content drop for the python-tutorial grid seeded by 0050/027, 0051/028
-- and 0052/029. Adds a 4th learning_sections row "Real-World Development
-- Practices" and 5 more topics, following the exact same pattern — no schema,
-- RLS, or app-code change.
--
-- Coding-problem counts this batch (10 total, not the usual 20) — every
-- deviation below follows the same rule applied in 0051/028 and 0052/029:
-- preserve the graded skill only where a single Python script with stdin/stdout,
-- no live network, no wall clock, and no interactive session can actually be
-- checked exact-match; otherwise reduce or drop rather than force a fake fit.
--   * Web Development: 0 coding problems (source HAS a "Coding Problems"
--     section, unlike Environment & Package Management / Git & GitHub below —
--     this is a judgment call, not a source-matching one). Flask/Django/FastAPI
--     all require binding a port and serving real HTTP requests to be tested
--     meaningfully; a stdin/stdout script judge cannot start a server and issue
--     requests to it, and the frameworks themselves are third-party packages of
--     uncertain availability in the judge sandbox (unlike stdlib). 10 MCQs only.
--   * Testing: 4 coding problems, redesigned around plain assert statements and
--     unittest.mock.MagicMock (both work with zero third-party dependencies —
--     pytest itself is not required) instead of literally running pytest, whose
--     own test-runner output includes non-deterministic timing.
--   * Debugging & Logging: 2 coding problems, not 4 — the source's other 2
--     ("Traceback Analysis", "Debugging with breakpoint()") are interactive pdb
--     sessions / free-text analysis, neither expressible as a deterministic
--     stdin/stdout check, so they're dropped rather than forced. The 2 kept
--     (file logging, a logging-enhanced function) are redesigned to avoid
--     %(asctime)s (wall-clock, non-deterministic) and to force logging to
--     stdout explicitly (logging defaults to stderr, which a stdout-only judge
--     would never see).
--   * Git & GitHub: 0 coding problems, matching the source exactly (no "Coding
--     Problems" section at all) — the whole topic is git/GitHub CLI operations,
--     not Python code. 10 MCQs only.
--   * Data Analysis: 4 coding problems using NumPy/Pandas — computational logic
--     preserved exactly; the one Matplotlib/Seaborn visualization problem was
--     redesigned into the underlying data computation (per-subject averages),
--     since a judge can only grade text, never a rendered chart. NumPy/Pandas
--     are third-party packages — flag their judge-sandbox availability as a
--     residual risk (verify by trying "Solve Problem" once this ships).
-- ----------------------------------------------------------------------------

-- ---- ordering guard -----------------------------------------------------
do $guard$
begin
  if to_regclass('public.learning_grids') is null then
    raise exception '0053/030: learning_* not found — apply 0042_learning_management.sql (admin 019) first.';
  end if;
  if to_regprocedure('public.learning_topic_practice(text, text, text)') is null then
    raise exception '0053/030: apply 0048_topic_practice.sql (admin 025) first.';
  end if;
  if not exists (select 1 from public.learning_grids where lower(slug) = 'python-tutorial') then
    raise exception '0053/030: python-tutorial grid not found — apply 0050_seed_python_tutorial_content.sql (admin 027) first.';
  end if;
end
$guard$;

-- ===========================================================================
-- 2. SECTION — 4th module for the existing python-tutorial grid.
-- ===========================================================================
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial')
insert into public.learning_sections
  (grid_id, name, slug, description, sort_order, status, show_on_website, show_on_mobile)
select g.id, $ww1$Real-World Development Practices$ww1$, $ww2$real-world-development-practices$ww2$, $ww3$Web Development, Testing, Debugging & Logging, Git & GitHub, and Data Analysis — how professional Python projects actually get built, verified, tracked, and shipped.$ww3$, 40,
  'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, description = excluded.description,
  sort_order = excluded.sort_order, updated_at = now();

-- ===========================================================================
-- 3. TOPICS + CONTENT — 5 topics, one full notes block each.
-- ===========================================================================

-- Web Development (Flask, Django, FastAPI)
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = 'real-world-development-practices'),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ww4$Web Development (Flask, Django, FastAPI)$ww4$, $ww5$web-development$ww5$, $ww6$The three major Python web frameworks — Flask (minimal), Django (batteries-included), and FastAPI (modern, API-focused) — routing, templates, ORMs, admin panels, Pydantic validation, and when to choose which.$ww6$, 16,
    'published', true, true, 'python_tutorial', $ww7$real-world-development-practices/web-development$ww7$
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
select up_topic.id, '', $ww8$Until now, your programs have run entirely on your own computer. Web development is about building applications that run on a server and are accessed by many users through a browser or another program — websites, admin dashboards, and APIs that power mobile apps.

Python has three major web frameworks, each with a different philosophy. This file covers all three, and — importantly — explains when to choose which.

---

## 1. What is a Web Framework?

### What is it?

A web framework is a toolkit that handles the repetitive, common parts of building a web application — routing URLs to code, handling requests, talking to databases — so you focus on your application's actual logic instead of rebuilding the basics every time.

### Why do we use it?

Building a web server completely from scratch (handling raw HTTP, parsing URLs, managing sessions) would take enormous effort. A framework handles all of that, letting you write a working web application in a fraction of the time.

### The Three Major Python Web Frameworks

| Framework | Philosophy |
|---|---|
| **Flask** | Minimal and flexible — gives you the basics, you choose the rest |
| **Django** | "Batteries-included" — comes with almost everything built in (admin panel, ORM, auth) |
| **FastAPI** | Modern, fast, built specifically for APIs, with automatic documentation |

---

## 2. Flask

### What is it?

Flask is a lightweight, minimalist Python web framework — easy to learn, giving you just the essentials, while letting you add exactly what you need.

### Installation

```bash
pip install flask
```

### Basic Application

**File: `app.py`**
```python
from flask import Flask

app = Flask(__name__)

@app.route("/")
def home():
    return "Hello, Flask!"

if __name__ == "__main__":
    app.run(debug=True)
```

Run it:
```bash
python app.py
```

Visiting `http://127.0.0.1:5000/` in a browser shows "Hello, Flask!"

### Explanation of the Code

- `Flask(__name__)` creates the application object.
- `@app.route("/")` is a **decorator** (from the Intermediate Python file) that connects the URL `/` to the `home()` function — this is called **routing**.
- `app.run(debug=True)` starts a local development server; `debug=True` gives helpful error pages and auto-reloads on code changes (never use `debug=True` in a real production deployment).

### Routing with Parameters

```python
@app.route("/student/<name>")
def student_profile(name):
    return f"Profile page for {name}"
```

Visiting `/student/Aditi` displays "Profile page for Aditi" — `<name>` captures whatever appears in that part of the URL and passes it to the function.

### Handling GET and POST Requests

```python
from flask import request

@app.route("/greet", methods=["GET", "POST"])
def greet():
    if request.method == "POST":
        name = request.form.get("name")
        return f"Hello, {name}! (submitted via POST)"
    return "Send a POST request with a 'name' field"
```

**Explanation:** `request.form` accesses data submitted through an HTML form. `request.args` would be used instead for data sent as URL query parameters (e.g., `/greet?name=Aditi`).

### Templates (Jinja2)

Flask uses the **Jinja2** templating engine to generate HTML dynamically, keeping HTML separate from Python logic.

**File: `templates/profile.html`**
```html
<!DOCTYPE html>
<html>
<body>
    <h1>Hello, {{ name }}!</h1>
    <p>You are {{ age }} years old.</p>
</body>
</html>
```

**File: `app.py`**
```python
from flask import render_template

@app.route("/profile/<name>/<int:age>")
def profile(name, age):
    return render_template("profile.html", name=name, age=age)
```

**Explanation:** `{{ name }}` and `{{ age }}` inside the HTML are placeholders, automatically filled in with the actual values passed from `render_template()`.

### Database Integration (SQLite Example)

```python
import sqlite3
from flask import g

def get_db():
    if "db" not in g:
        g.db = sqlite3.connect("blog.db")
    return g.db

@app.route("/posts")
def list_posts():
    db = get_db()
    posts = db.execute("SELECT title FROM posts").fetchall()
    return str(posts)
```

### A Simple REST API Endpoint

```python
from flask import jsonify

@app.route("/api/students")
def api_students():
    students = [
        {"name": "Aditi", "course": "CS"},
        {"name": "Rohan", "course": "AI"}
    ]
    return jsonify(students)
```

**Explanation:** `jsonify()` converts a Python list/dictionary into a proper JSON HTTP response, exactly what a REST API consumer (like a mobile app) would expect.

### Real-World Example

Flask is popular for small-to-medium web apps, internal tools, prototypes, and microservices — where flexibility matters more than built-in structure.

### Common Mistakes

- Leaving `debug=True` in a production deployment — this exposes sensitive internal details if something crashes.
- Forgetting that Flask alone doesn't include a built-in ORM, admin panel, or authentication system — you add these yourself (often via extensions like Flask-SQLAlchemy or Flask-Login).

---

## 3. Django

### What is it?

Django is a full-featured, "batteries-included" web framework — it comes with a built-in ORM, admin panel, authentication system, and much more, following a strong "convention over configuration" philosophy.

### Installation and Project Setup

```bash
pip install django

django-admin startproject myproject
cd myproject
python manage.py startapp blog
```

This creates a full project structure automatically, including settings, URL routing, and a database configuration (SQLite by default).

### Project Structure Overview

```
myproject/
    manage.py
    myproject/
        settings.py
        urls.py
    blog/
        models.py
        views.py
        urls.py
        admin.py
```

### Basic View and URL Routing

**File: `blog/views.py`**
```python
from django.http import HttpResponse

def home(request):
    return HttpResponse("Hello, Django!")
```

**File: `blog/urls.py`**
```python
from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
]
```

**File: `myproject/urls.py`** (connects the app's URLs to the project)
```python
from django.urls import include, path

urlpatterns = [
    path("", include("blog.urls")),
]
```

### Models — Django's Built-in ORM

**File: `blog/models.py`**
```python
from django.db import models

class Post(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
```

Apply the model to the database:
```bash
python manage.py makemigrations
python manage.py migrate
```

**Explanation:** `makemigrations` generates the instructions for the database changes needed; `migrate` actually applies them. This "migrations" system tracks database schema changes over time — a core Django concept.

### The Django Admin Panel

```bash
python manage.py createsuperuser
```

**File: `blog/admin.py`**
```python
from django.contrib import admin
from .models import Post

admin.site.register(Post)
```

**Explanation:** With just these few lines, Django automatically generates a full, working admin web interface to create, view, edit, and delete `Post` records — one of Django's most famous, time-saving features.

### Templates

Django also uses its own templating language, syntactically very similar to Jinja2:

```html
<h1>{{ post.title }}</h1>
<p>{{ post.content }}</p>
```

### Built-in Authentication

```python
from django.contrib.auth.decorators import login_required

@login_required
def dashboard(request):
    return HttpResponse(f"Welcome, {request.user.username}!")
```

**Explanation:** Django ships with a complete user authentication system (login, logout, password management) — `@login_required` automatically redirects unauthenticated users to a login page.

### REST APIs with Django

Django itself is focused on full websites; for REST APIs, the standard companion library is **Django REST Framework (DRF)**:

```bash
pip install djangorestframework
```

```python
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(["GET"])
def api_posts(request):
    posts = Post.objects.all().values("title", "content")
    return Response(list(posts))
```

### Real-World Example

Django is a strong choice for large, structured applications with complex data models — content management systems, e-commerce platforms, and admin-heavy internal tools, thanks to its built-in admin panel and ORM.

### Common Mistakes

- Forgetting to run `makemigrations` and `migrate` after changing a model — the database won't reflect the new structure otherwise.
- Underestimating Django's learning curve — its "batteries-included" nature means more concepts (settings, apps, migrations, the ORM) to learn upfront compared to Flask.

---

## 4. FastAPI

### What is it?

FastAPI is a modern, high-performance Python web framework, purpose-built for APIs — known for being extremely fast, having built-in data validation, and automatically generating interactive API documentation.

### Installation

```bash
pip install fastapi uvicorn
```

*(`uvicorn` is the server that actually runs a FastAPI application.)*

### Basic Application

**File: `main.py`**
```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Hello, FastAPI!"}
```

Run it:
```bash
uvicorn main:app --reload
```

Visiting `http://127.0.0.1:8000/docs` automatically shows a full, interactive API documentation page — generated entirely on its own, with zero extra effort. This is one of FastAPI's standout features.

### Routing with Path and Query Parameters

```python
@app.get("/students/{student_id}")
def get_student(student_id: int, detailed: bool = False):
    if detailed:
        return {"id": student_id, "name": "Aditi", "course": "CS", "age": 21}
    return {"id": student_id, "name": "Aditi"}
```

**Explanation:** `student_id: int` is a **type hint** — FastAPI uses this to automatically validate and convert the URL value, and to reject invalid input (like text where a number was expected) with a clear error, automatically.

### Request Bodies with Pydantic

FastAPI uses **Pydantic** models to define and automatically validate the structure of incoming JSON data.

```python
from pydantic import BaseModel

class Student(BaseModel):
    name: str
    age: int
    course: str

@app.post("/students")
def create_student(student: Student):
    return {"message": f"Student {student.name} created successfully"}
```

**Explanation:** If a client sends JSON missing a required field, or with the wrong data type (like a string where `age` should be a number), FastAPI automatically rejects the request with a clear validation error — you don't need to write any manual validation code yourself.

### Database Integration

FastAPI is commonly paired with SQLAlchemy (covered in the Database Programming file) for database access, following the same ORM patterns already covered there.

### Authentication (Brief Overview)

```python
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@app.get("/protected")
def protected_route(token: str = Depends(oauth2_scheme)):
    if token != "valid-token":
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"message": "You accessed a protected route"}
```

**Explanation:** FastAPI's `Depends()` system (called "Dependency Injection") is commonly used to handle authentication checks cleanly and reusably across many routes — full authentication systems (like JWT-based login) build on this same pattern.

### Real-World Example

FastAPI is increasingly the top choice for building APIs that power mobile apps, microservices, and machine learning model deployments — thanks to its speed and automatic validation/documentation.

### Common Mistakes

- Forgetting to install and use `uvicorn` to actually run the application (FastAPI itself doesn't include a built-in dev server the way Flask does).
- Not using Pydantic models for request bodies, missing out on FastAPI's automatic validation — one of its biggest advantages.

---

## Comparison Table — Flask vs Django vs FastAPI

| | Flask | Django | FastAPI |
|---|---|---|---|
| Philosophy | Minimal, flexible | Batteries-included | Modern, API-focused |
| Best for | Small apps, prototypes, microservices | Large structured apps, content-heavy sites | APIs, microservices, ML model serving |
| Built-in ORM | No (add one yourself) | Yes | No (typically paired with SQLAlchemy) |
| Built-in Admin Panel | No | Yes | No |
| Built-in Auth | No (via extensions) | Yes | Via Dependency Injection, manual setup |
| Automatic API Docs | No | Via DRF add-on | Yes (built-in) |
| Learning Curve | Low | Higher (more concepts) | Moderate |
| Performance | Good | Good | Excellent (built on async foundations) |

### When to Choose Which

- **Choose Flask** when you want full control, a simple app, or you're just learning web development fundamentals.
- **Choose Django** when building a large, structured application — especially one needing an admin panel, robust user management, or a content-heavy site.
- **Choose FastAPI** when building a modern API — especially one needing high performance, automatic validation, or serving machine learning models.

---

## Common Beginner Mistakes — Summary for This Section

- Leaving Flask's `debug=True` on in production.
- Forgetting Django's `makemigrations`/`migrate` steps after changing models.
- Not running FastAPI with `uvicorn`.
- Mixing up which framework has which built-in features (all three are commonly confused by beginners).

---

## Cheat Sheet — Web Development

```python
# Flask
from flask import Flask, request, jsonify, render_template
app = Flask(__name__)
@app.route("/path", methods=["GET", "POST"])
def view(): return "response"
app.run(debug=True)

# Django
django-admin startproject myproject
python manage.py startapp blog
python manage.py makemigrations
python manage.py migrate
python manage.py runserver

# FastAPI
from fastapi import FastAPI
app = FastAPI()
@app.get("/path")
def view(): return {"key": "value"}
# run with: uvicorn main:app --reload
```

---

## Mini Project: Blog Application (Flask)

### Objective

Build a simple web-based blog where users can view all posts and create new ones, using Flask, templates, and SQLite.

### Requirements

- A homepage listing all blog posts.
- A form to create a new post.
- Data stored persistently in SQLite.

### Concepts Used

Flask routing, templates (Jinja2), forms (`request.form`), SQLite integration.

### Project Structure

```
blog_app/
    app.py
    templates/
        index.html
        new_post.html
```

### Complete Code

**File: `app.py`**
```python
from flask import Flask, render_template, request, redirect, url_for
import sqlite3

app = Flask(__name__)

def get_db():
    conn = sqlite3.connect("blog.db")
    conn.execute("""
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL
        )
    """)
    return conn

@app.route("/")
def index():
    conn = get_db()
    posts = conn.execute("SELECT * FROM posts ORDER BY id DESC").fetchall()
    conn.close()
    return render_template("index.html", posts=posts)

@app.route("/new", methods=["GET", "POST"])
def new_post():
    if request.method == "POST":
        title = request.form["title"]
        content = request.form["content"]
        conn = get_db()
        conn.execute("INSERT INTO posts (title, content) VALUES (?, ?)", (title, content))
        conn.commit()
        conn.close()
        return redirect(url_for("index"))
    return render_template("new_post.html")

if __name__ == "__main__":
    app.run(debug=True)
```

**File: `templates/index.html`**
```html
<!DOCTYPE html>
<html>
<body>
    <h1>My Blog</h1>
    <a href="/new">Write a new post</a>
    {% for post in posts %}
        <h2>{{ post[1] }}</h2>
        <p>{{ post[2] }}</p>
        <hr>
    {% endfor %}
</body>
</html>
```

**File: `templates/new_post.html`**
```html
<!DOCTYPE html>
<html>
<body>
    <h1>New Post</h1>
    <form method="POST">
        <input type="text" name="title" placeholder="Title"><br>
        <textarea name="content" placeholder="Write your post..."></textarea><br>
        <button type="submit">Publish</button>
    </form>
</body>
</html>
```

### Code Explanation

- `get_db()` opens (and initializes, if needed) the SQLite database used to store posts.
- `index()` fetches all posts and passes them to `index.html`, where `{% for post in posts %}` (Jinja2 syntax) loops through and displays each one.
- `new_post()` shows a form on `GET`, and on `POST`, saves the submitted title and content, then redirects back to the homepage.

### Sample Behavior

1. Visiting `/` shows all existing blog posts.
2. Clicking "Write a new post" goes to `/new`, showing a form.
3. Submitting the form saves the post and redirects back to the homepage, where the new post now appears.

### Possible Improvements

- Add the ability to edit and delete existing posts.
- Add user authentication so only logged-in users can create posts.
- Add categories/tags for posts.

### Challenge Task

Convert this application to use Flask-SQLAlchemy (an ORM) instead of raw SQL, following the SQLAlchemy patterns from the Database Programming file.

---

## Interview Questions

**Q1. What is the main philosophical difference between Flask and Django?**
Answer: Flask is minimal and flexible, giving developers only the basics and letting them choose additional tools. Django is "batteries-included," providing a built-in ORM, admin panel, and authentication system out of the box.

**Q2. What makes FastAPI different from Flask and Django?**
Answer: FastAPI is purpose-built for modern APIs, offering automatic request validation (via Pydantic), automatic interactive documentation, and high performance built on asynchronous foundations.

**Q3. What does `@app.route()` do in Flask?**
Answer: It's a decorator that connects (routes) a specific URL to the function that should handle requests to that URL.

**Q4. What are Django migrations?**
Answer: A system for tracking and applying changes to the database schema over time, generated with `makemigrations` and applied with `migrate`.

**Q5. What is Pydantic used for in FastAPI?**
Answer: Defining the expected structure of request/response data as Python classes, which FastAPI then uses to automatically validate incoming data and generate documentation.

**Q6. When would you choose Django over Flask?**
Answer: For larger, more structured applications that benefit from Django's built-in admin panel, ORM, and authentication system — especially content-heavy sites needing rapid, consistent development.

---

## Practice Questions

**Beginner**
1. Create a basic Flask app with two routes: `/` and `/about`.
2. Create a Flask route that accepts a name from the URL and displays a personalized greeting.
3. Set up a new Django project and app, and create a simple view returning "Hello, Django!"
4. Create a FastAPI app with a single `GET` route returning a JSON message.
5. Create a FastAPI route that accepts an integer path parameter and returns it doubled.

**Intermediate**
1. Build a Flask app with a form that accepts a name and email, and displays them back after submission.
2. Create a Django model for a `Product` (name, price, stock) and register it in the admin panel.
3. Build a FastAPI endpoint that accepts a Pydantic model representing a new user (`name`, `email`, `age`) and returns a confirmation message.
4. Add a route in Flask that returns a list of items as JSON using `jsonify()`.
5. Create a Django view that requires the user to be logged in using `@login_required`.

**Challenge**
1. Extend the Blog Application mini project to support editing and deleting posts.
2. Build a small Django application with two models (`Author` and `Book`, linked with a foreign key) and display all books with their authors on a single page.
3. Build a FastAPI CRUD API for a `Task` resource (create, read, update, delete), backed by an in-memory Python list (no database needed), and test it using the automatically generated `/docs` page.
$ww8$, 'markdown',
  jsonb_build_object('source', 'python_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'python_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Testing
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = 'real-world-development-practices'),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ww9$Testing$ww9$, $ww10$testing$ww10$, $ww11$Automated testing with unittest and pytest, fixtures, mocking external dependencies with unittest.mock, integration testing, API testing, and code coverage.$ww11$, 17,
    'published', true, true, 'python_tutorial', $ww12$real-world-development-practices/testing$ww12$
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
select up_topic.id, '', $ww13$How do you know your code actually works — not just today, but after you change something six months from now? Manually running your program and checking the output by eye doesn't scale. **Automated testing** lets you write code that checks your code, catching bugs before they reach real users.

---

## 1. What is Testing?

### What is it?

Testing means writing code that automatically verifies your program behaves correctly — checking that functions return the expected results, and catching bugs early.

> **Definition:** Software testing is the process of verifying that a program behaves as expected, using automated checks rather than manual inspection.

### Why do we use it?

- **Catch bugs early** — before they reach real users.
- **Confidence when changing code** — if you modify a function and all tests still pass, you can be reasonably confident you didn't break anything.
- **Documentation** — tests show, through real examples, exactly how a function is supposed to behave.
- **Required in professional environments** — nearly every real software job expects you to write tests.

### Types of Testing

| Type | What it Checks |
|---|---|
| **Unit Testing** | A single, small piece of code (usually one function) in isolation |
| **Integration Testing** | Multiple pieces working together correctly |
| **API Testing** | An API's endpoints behave correctly (right status codes, right data) |

---

## 2. Unit Testing with `unittest`

### What is it?

`unittest` is Python's built-in testing framework, included with every Python installation — no separate install needed.

### Simple Example

**File: `calculator.py`**
```python
def add(a, b):
    return a + b

def divide(a, b):
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b
```

**File: `test_calculator.py`**
```python
import unittest
from calculator import add, divide

class TestCalculator(unittest.TestCase):

    def test_add(self):
        self.assertEqual(add(2, 3), 5)
        self.assertEqual(add(-1, 1), 0)

    def test_divide(self):
        self.assertEqual(divide(10, 2), 5)

    def test_divide_by_zero(self):
        with self.assertRaises(ValueError):
            divide(10, 0)

if __name__ == "__main__":
    unittest.main()
```

Run it:
```bash
python -m unittest test_calculator.py
```

Output:
```
...
----------------------------------------------------------------------
Ran 3 tests in 0.001s

OK
```

### Explanation of the Code

- Every test class inherits from `unittest.TestCase`.
- Every test method **must start with `test_`** — this is how `unittest` recognizes which methods are actual tests to run.
- `self.assertEqual(actual, expected)` checks that two values match; if they don't, the test fails and reports the mismatch.
- `self.assertRaises(ValueError)` (used with `with`) checks that the code inside the block correctly raises the expected exception.

### Common `unittest` Assertions

| Method | Checks |
|---|---|
| `assertEqual(a, b)` | `a == b` |
| `assertNotEqual(a, b)` | `a != b` |
| `assertTrue(x)` | `x` is `True` |
| `assertFalse(x)` | `x` is `False` |
| `assertIsNone(x)` | `x is None` |
| `assertRaises(Error)` | Code raises the given exception |
| `assertIn(a, b)` | `a` is inside `b` |

### Common Mistakes

- Forgetting test method names must start with `test_` — otherwise `unittest` silently ignores them.
- Testing too much in one test method — each test should ideally check one specific behavior, making failures easier to pinpoint.

### Important Points

- `unittest` is built into Python — no installation required.
- Test files are usually named `test_<module_name>.py` by convention.

### Practice

1. Write `unittest` tests for a function `is_even(n)` — testing both an even and an odd input.

---

## 3. Testing with `pytest`

### What is it?

`pytest` is a hugely popular third-party testing framework — simpler and more concise than `unittest`, and the standard choice in most professional Python projects today.

```bash
pip install pytest
```

### Simple Example

**File: `test_calculator.py`**
```python
from calculator import add, divide
import pytest

def test_add():
    assert add(2, 3) == 5
    assert add(-1, 1) == 0

def test_divide():
    assert divide(10, 2) == 5

def test_divide_by_zero():
    with pytest.raises(ValueError):
        divide(10, 0)
```

Run it:
```bash
pytest
```

Output:
```
===================== 3 passed in 0.02s =====================
```

### Explanation of the Code

- `pytest` uses plain `assert` statements — no special `self.assertEqual()` methods needed, which is one reason it's considered more readable.
- `pytest` automatically discovers any file named `test_*.py` (or `*_test.py`) and any function starting with `test_`, without needing a class at all.
- `pytest.raises()` works just like `unittest`'s `assertRaises`, but as a simpler standalone function.

### Comparison Table — `unittest` vs `pytest`

| | `unittest` | `pytest` |
|---|---|---|
| Installation | Built-in | Requires `pip install pytest` |
| Syntax | `self.assertEqual(a, b)` | Plain `assert a == b` |
| Structure | Requires a `TestCase` class | Plain functions work fine |
| Fixtures | `setUp()`/`tearDown()` methods | `@pytest.fixture` decorator (more flexible) |
| Popularity | Standard, widely known | More popular in modern real-world projects |

### Important Points

- `pytest` is generally preferred in real-world professional Python development for its simplicity and powerful features.
- Both frameworks can run tests written for `unittest`-style classes — `pytest` is largely backward-compatible.

---

## 4. Fixtures

### What is it?

A fixture is reusable setup code that prepares something needed by multiple tests — like a sample object, a test database connection, or test data — avoiding repetition across test functions.

### Simple Example — `pytest` Fixture

```python
import pytest

@pytest.fixture
def sample_numbers():
    return [10, 20, 30, 40, 50]

def test_sum(sample_numbers):
    assert sum(sample_numbers) == 150

def test_length(sample_numbers):
    assert len(sample_numbers) == 5
```

### Explanation of the Code

- `@pytest.fixture` marks `sample_numbers()` as a fixture — a function that provides reusable test data.
- Any test function that includes `sample_numbers` as a parameter automatically receives the fixture's return value — `pytest` handles the connection behind the scenes.
- Both `test_sum` and `test_length` reuse the exact same setup, without repeating the list definition in each test.

### `setUp()` in `unittest` (Equivalent Concept)

```python
class TestCalculator(unittest.TestCase):
    def setUp(self):
        self.numbers = [10, 20, 30, 40, 50]

    def test_sum(self):
        self.assertEqual(sum(self.numbers), 150)
```

**Explanation:** `setUp()` runs automatically **before every single test method** in the class, providing a fresh setup each time.

### Important Points

- Fixtures avoid repeating setup code across many tests.
- `pytest` fixtures are more flexible and reusable across multiple test files than `unittest`'s `setUp()`.

---

## 5. Mocking

### What is it?

Mocking replaces a real, often unpredictable or slow component (like an API call, a database, or the current time) with a fake, controlled stand-in — so tests can run quickly, reliably, and without needing real external services.

### Why do we use it?

Imagine testing a function that calls a weather API. You don't want your tests to depend on the internet being available, the API being online, or the weather actually being sunny that day. Mocking replaces the real API call with a fake, predictable response.

### Simple Example

```python
from unittest.mock import patch

def get_weather_description(weather_api_call):
    data = weather_api_call()
    return f"The weather is {data['condition']}"

def test_get_weather_description():
    with patch("__main__.weather_api_call") as mock_api:
        mock_api.return_value = {"condition": "sunny"}
        result = get_weather_description(mock_api)
        assert result == "The weather is sunny"
```

### Explanation of the Code

- `patch()` temporarily replaces the real function/object with a "mock" — a fake stand-in that you fully control.
- `mock_api.return_value = {...}` tells the mock exactly what to return when called, regardless of what the real API might actually say.
- This lets you test your code's logic (`get_weather_description`) completely independently of whether the real weather API is working.

### Real-World Example

Mocking is essential for testing code that depends on databases, external APIs, sending emails, or the current date/time — anything slow, unpredictable, or with real-world side effects you don't want triggered during testing.

### Common Mistakes

- Over-mocking, to the point where the test no longer verifies anything meaningful about your actual code's behavior.
- Forgetting to reset/verify mocks between tests, causing one test's setup to accidentally affect another.

### Important Points

- Mocking isolates the code being tested from external dependencies.
- Python's built-in `unittest.mock` module provides `patch()`, `Mock()`, and `MagicMock()` for this purpose.

---

## 6. Integration Testing

### What is it?

While unit tests check one function in isolation, integration tests check that multiple parts of a system work correctly **together** — like a function that both queries a database and processes the results.

### Simple Example

```python
import sqlite3
import pytest

def setup_test_db():
    conn = sqlite3.connect(":memory:")   # temporary, in-memory database
    conn.execute("CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT)")
    conn.execute("INSERT INTO students (name) VALUES ('Aditi')")
    conn.commit()
    return conn

def get_student_count(conn):
    return conn.execute("SELECT COUNT(*) FROM students").fetchone()[0]

def test_student_count_integration():
    conn = setup_test_db()
    assert get_student_count(conn) == 1
    conn.close()
```

**Explanation:** `sqlite3.connect(":memory:")` creates a temporary database that exists only in memory for the duration of the test — perfect for integration tests, since it behaves like a real database without needing an actual persistent file.

### Important Points

- Integration tests are typically slower than unit tests, since they involve more moving parts.
- A healthy test suite usually has many unit tests and fewer, more targeted integration tests.

---

## 7. API Testing

### What is it?

Testing that your API's endpoints return the correct status codes and data, using the same principles covered above.

### Simple Example — Testing a Flask Application

```python
import pytest
from app import app   # your Flask application

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_home_page(client):
    response = client.get("/")
    assert response.status_code == 200

def test_api_students(client):
    response = client.get("/api/students")
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
```

### Explanation of the Code

- Flask provides a built-in `test_client()`, which simulates HTTP requests to your application **without actually starting a real server**.
- `yield client` (inside the fixture) is a generator-based fixture pattern — it hands the client to the test, and any code after `yield` would run as cleanup once the test finishes.

### Important Points

- API tests confirm status codes, response structure, and data correctness — without needing to manually click through a browser or use a tool like Postman every time.

---

## 8. Code Coverage

### What is it?

Coverage measures what **percentage** of your actual code gets executed by your test suite — helping identify parts of your codebase that have no tests at all.

```bash
pip install pytest-cov
pytest --cov=calculator
```

Sample Output:
```
Name             Stmts   Miss  Cover
------------------------------------
calculator.py        8      1    88%
```

### Explanation

- This shows that 88% of `calculator.py`'s executable lines were run at least once during testing — the remaining 12% represents code paths (perhaps an edge case) with no test coverage yet.

### Common Mistakes

- Chasing 100% coverage as a goal in itself — high coverage doesn't guarantee tests are actually *meaningful*; it just means the code was executed, not necessarily verified correctly.
- Ignoring coverage reports entirely and never checking which parts of the codebase are untested.

### Important Points

- Coverage is a useful signal, not a perfect measure of test quality.
- Aim for solid coverage on critical logic, rather than obsessing over a specific percentage everywhere.

---

## Common Beginner Mistakes — Summary for This Section

- Forgetting test functions/methods must start with `test_`.
- Writing tests that check too many things at once, making failures hard to diagnose.
- Not using mocks for external dependencies (APIs, databases, current time), making tests slow or unreliable.
- Treating code coverage percentage as the sole measure of test quality.

---

## Cheat Sheet — Testing

```python
# unittest
import unittest
class TestSomething(unittest.TestCase):
    def test_example(self):
        self.assertEqual(1 + 1, 2)

# pytest
def test_example():
    assert 1 + 1 == 2

@pytest.fixture
def sample_data():
    return [1, 2, 3]

def test_with_fixture(sample_data):
    assert len(sample_data) == 3

# mocking
from unittest.mock import patch
with patch("module.function") as mock_func:
    mock_func.return_value = "fake result"
```

```bash
python -m unittest test_file.py
pytest
pytest --cov=module_name
```

---

## Interview Questions

**Q1. What is the difference between unit testing and integration testing?**
Answer: Unit testing checks a single function or component in isolation. Integration testing checks that multiple components work correctly together (e.g., a function combined with a real database).

**Q2. What is the difference between `unittest` and `pytest`?**
Answer: `unittest` is built into Python and requires test classes with `self.assertEqual()`-style methods. `pytest` is a third-party library using plain `assert` statements and simple functions, generally considered more concise and flexible, especially with fixtures.

**Q3. What is mocking, and why is it useful?**
Answer: Mocking replaces a real, often slow or unpredictable dependency (like an API or database) with a controlled fake stand-in, allowing tests to run quickly and reliably without depending on external systems.

**Q4. What is a test fixture?**
Answer: Reusable setup code that prepares data or conditions needed by multiple tests, avoiding repetition.

**Q5. What does code coverage measure?**
Answer: The percentage of a codebase's lines that are actually executed when the test suite runs — useful for spotting untested code, though not a complete measure of test quality on its own.

---

## Practice Questions

**Beginner**
1. Write a `unittest` test for a function `square(n)` that returns `n ** 2`.
2. Write a `pytest` test for a function `is_palindrome(s)`.
3. Write a test that checks a function correctly raises a `ValueError` for invalid input.
4. Write a `pytest` fixture that provides a sample list of student names, and use it in two different tests.
5. Run your test suite using `pytest` and confirm all tests pass.

**Intermediate**
1. Write unit tests for the Expense Tracker functions from the Functions file (`add_expense`, `calculate_total`).
2. Use `unittest.mock` to test a function that calls an external API, without making a real network request.
3. Write an integration test for a function that inserts a record into an in-memory SQLite database and then reads it back.
4. Write API tests for a Flask application's `/` and one other route, using Flask's test client.
5. Run `pytest --cov` on a small project and identify which lines aren't covered by tests.

**Challenge**
1. Write a complete test suite (using `pytest`) for the Student Record Management System mini project from the File Handling file, covering adding, viewing, and saving records.
2. Write tests (with mocking) for the Weather API Application mini project, simulating both a successful response and a connection error.
3. Set up a small project with both unit tests and one integration test, and generate a coverage report showing at least 80% coverage.
$ww13$, 'markdown',
  jsonb_build_object('source', 'python_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'python_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Debugging & Logging
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = 'real-world-development-practices'),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ww14$Debugging & Logging$ww14$, $ww15$debugging-and-logging$ww15$, $ww16$Reading tracebacks, print()-debugging, Python's built-in pdb debugger and breakpoint(), the logging module, log levels, and logging to files.$ww16$, 18,
    'published', true, true, 'python_tutorial', $ww17$real-world-development-practices/debugging-and-logging$ww17$
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
select up_topic.id, '', $ww18$Bugs are inevitable — even experienced developers write code that doesn't work the first time. What separates a confident developer from a frustrated one is having good tools and habits for finding out *why* something went wrong. This file covers exactly that: reading error messages, using debuggers, and logging what your program does.

---

## 1. What is Debugging?

### What is it?

Debugging is the process of finding and fixing errors (bugs) in your code — figuring out why the program isn't behaving the way you expect.

> **Definition:** Debugging is the systematic process of identifying, analyzing, and fixing errors in a program.

### Why do we use structured debugging techniques?

Randomly changing code and re-running it hoping something works is slow and frustrating. Structured debugging — reading error messages carefully, checking variable values step by step — finds the actual root cause far faster.

---

## 2. Reading Stack Traces (Tracebacks)

### What is it?

When Python hits an unhandled error, it prints a **traceback** — a report showing exactly where the error occurred and the chain of function calls that led there.

### Simple Example

```python
def divide(a, b):
    return a / b

def calculate():
    return divide(10, 0)

calculate()
```

Output:
```
Traceback (most recent call last):
  File "app.py", line 6, in <module>
    calculate()
  File "app.py", line 4, in calculate
    return divide(10, 0)
  File "app.py", line 2, in divide
    return a / b
ZeroDivisionError: division by zero
```

### Explanation of the Code

- Read a traceback **from the bottom up**: the last line (`ZeroDivisionError: division by zero`) tells you **what** went wrong.
- The lines above it show the **call chain** — `calculate()` called `divide()`, and it was inside `divide()` (line 2) where the actual error occurred.
- This lets you trace exactly which function, and which line, caused the problem — even in a large program with many function calls.

### Common Mistakes

- Panicking at a long traceback instead of reading the last line first (the actual error type and message) and then tracing upward.
- Ignoring the file names and line numbers, which point you directly to the problem location.

### Important Points

- Always read the **last line** of a traceback first — it tells you the exception type and message.
- The call chain above it shows exactly how the program reached that point.

---

## 3. `print()` Debugging

### What is it?

The simplest debugging technique: temporarily adding `print()` statements to see what values variables actually hold at different points in your code.

### Simple Example

```python
def calculate_discount(price, discount_percent):
    print(f"DEBUG: price={price}, discount_percent={discount_percent}")
    discount = price * (discount_percent / 100)
    print(f"DEBUG: discount={discount}")
    final_price = price - discount
    return final_price

print(calculate_discount(1000, 10))
```

### Explanation

- Adding `print()` statements at key points reveals exactly what values a function is working with, helping you spot exactly where a calculation goes wrong.

### Common Mistakes

- Leaving debug `print()` statements in production code — always remove or replace them with proper logging (see below) once done debugging.
- Overusing `print()` debugging for complex bugs, where a real debugger (below) would be far more efficient.

### Important Points

- `print()` debugging is quick and simple for small issues, but doesn't scale well for complex bugs or larger programs.

---

## 4. Using `pdb` — Python's Built-in Debugger

### What is it?

`pdb` is Python's built-in interactive debugger — instead of guessing with `print()` statements, it lets you **pause** your program at a specific line and inspect everything happening at that exact moment.

### Setting a Breakpoint

```python
import pdb

def calculate_discount(price, discount_percent):
    discount = price * (discount_percent / 100)
    pdb.set_trace()   # execution pauses here
    final_price = price - discount
    return final_price

print(calculate_discount(1000, 10))
```

When execution reaches `pdb.set_trace()`, it drops into an interactive prompt:

```
(Pdb) 
```

### Useful `pdb` Commands

| Command | Purpose |
|---|---|
| `n` (next) | Run the next line |
| `s` (step) | Step into a function call |
| `c` (continue) | Continue running until the next breakpoint |
| `p variable_name` | Print a variable's current value |
| `l` (list) | Show the surrounding code |
| `q` (quit) | Exit the debugger |

### Modern Alternative — `breakpoint()`

```python
def calculate_discount(price, discount_percent):
    discount = price * (discount_percent / 100)
    breakpoint()   # same effect as pdb.set_trace(), built in since Python 3.7
    final_price = price - discount
    return final_price
```

### Real-World Example

Instead of adding ten different `print()` statements trying to find where a value became incorrect, a single `breakpoint()` lets you pause exactly there and inspect **every** variable interactively, in real time.

### Common Mistakes

- Forgetting to remove `breakpoint()`/`pdb.set_trace()` calls before deploying code — this would pause your program unexpectedly in production.

### Important Points

- `breakpoint()` (Python 3.7+) is the modern, preferred way to trigger `pdb` — no import needed.
- Debuggers let you pause and inspect a running program, rather than guessing from static code alone.

### Using Breakpoints in VS Code

Instead of typing `breakpoint()` in code, VS Code lets you click in the margin next to a line number to set a visual breakpoint, then run your file using the debugger (the "Run and Debug" panel) — pausing at that exact line with a full inspection panel for variables, without touching your actual code.

---

## 5. The `logging` Module

### What is it?

While `print()` is fine for quick debugging, real applications use the `logging` module to record what's happening — with more control over severity levels, output destinations (console, file), and formatting, without cluttering actual program output.

### Simple Example

```python
import logging

logging.basicConfig(level=logging.DEBUG)

logging.debug("This is a debug message")
logging.info("Application started")
logging.warning("This is a warning")
logging.error("Something went wrong")
logging.critical("Critical failure!")
```

Output:
```
DEBUG:root:This is a debug message
INFO:root:Application started
WARNING:root:This is a warning
ERROR:root:Something went wrong
CRITICAL:root:Critical failure!
```

### Explanation of the Code

- `logging.basicConfig(level=logging.DEBUG)` sets the minimum severity level that will actually be shown — here, everything (`DEBUG` and above) is shown.
- Each `logging.xxx()` call records a message at a specific severity level.

---

## 6. Log Levels

### What is it?

Log levels indicate the **severity** or importance of a logged message, from least to most severe.

### Log Level Hierarchy

| Level | Numeric Value | When to Use |
|---|---|---|
| `DEBUG` | 10 | Detailed diagnostic info, useful only during development |
| `INFO` | 20 | General confirmation that things are working as expected |
| `WARNING` | 30 | Something unexpected happened, but the program still works |
| `ERROR` | 40 | A serious problem — some functionality failed |
| `CRITICAL` | 50 | A very serious error — the program itself may be unable to continue |

### Simple Example

```python
import logging

logging.basicConfig(level=logging.WARNING)

logging.debug("This won't show")     # below the WARNING threshold
logging.info("This won't show")      # below the WARNING threshold
logging.warning("This WILL show")
logging.error("This WILL show")
```

**Explanation:** Setting `level=logging.WARNING` means only `WARNING` and above are actually shown — `DEBUG` and `INFO` messages are silently filtered out. This lets you control verbosity: use `DEBUG` level during development, and something like `WARNING` or `ERROR` in production, to avoid drowning in noise.

### Common Mistakes

- Using `print()` everywhere instead of proper log levels, making it impossible to filter out noisy detail in production.
- Logging sensitive information (passwords, API keys) — never log secrets, even at DEBUG level.

### Important Points

- Log levels let you control exactly how much detail is recorded, without deleting the actual logging code.
- Higher severity levels always include being shown when a lower threshold is set (e.g., setting `level=INFO` also shows `WARNING`, `ERROR`, and `CRITICAL`).

---

## 7. Logging to a File

### What is it?

Instead of (or in addition to) printing to the console, logs can be written to a file — essential for tracking what happened in a program long after it finished running, especially for servers running continuously.

### Simple Example

```python
import logging

logging.basicConfig(
    filename="app.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

logging.info("Application started")
logging.warning("Low disk space")
logging.error("Failed to connect to database")
```

**File: `app.log`**
```
2026-01-15 10:30:00,123 - INFO - Application started
2026-01-15 10:30:05,456 - WARNING - Low disk space
2026-01-15 10:30:10,789 - ERROR - Failed to connect to database
```

### Explanation of the Code

- `filename="app.log"` redirects all log output to a file instead of the console.
- The `format` string customizes exactly what each log line includes — here, a timestamp (`%(asctime)s`), the severity level (`%(levelname)s`), and the actual message.

### Real-World Example

Web servers and long-running applications rely heavily on log files to diagnose issues that happened hours or days earlier — since you can't attach a live debugger to a server that already crashed and restarted.

### Common Mistakes

- Never rotating or limiting log file size, causing log files to grow indefinitely over time (real production systems use log rotation to manage this).
- Logging way too much at `INFO` or `DEBUG` level in production, making log files huge and hard to search through.

### Important Points

- Logging to files is essential for diagnosing issues in applications that run continuously, especially on servers.
- The `format` string lets you customize exactly what information appears in each log entry.

---

## 8. Error Tracking (Brief Overview)

### What is it?

In professional production systems, dedicated error-tracking tools (like Sentry or Rollbar) automatically collect, group, and alert developers about exceptions happening in a live application — going beyond simple log files.

### Why This Matters

A log file sitting on a server nobody's watching isn't very useful. Error-tracking tools automatically notify the team (e.g., via email or Slack) the moment something breaks in production, along with the full traceback and context — dramatically speeding up how quickly real problems get noticed and fixed.

### Important Points

- This is a conceptual introduction — actual setup of tools like Sentry is beyond this course's scope, but knowing they exist (and why) is valuable, especially for placement interviews discussing real-world software practices.

---

## Common Beginner Mistakes — Summary for This Section

- Panicking at a traceback instead of reading the last line first.
- Leaving debug `print()` statements or `breakpoint()` calls in code meant for production.
- Using `print()` everywhere instead of the `logging` module in real applications.
- Logging sensitive data like passwords or API keys.
- Letting log files grow unbounded without any rotation strategy.

---

## Cheat Sheet — Debugging & Logging

```python
# Reading tracebacks: read the LAST line first, then trace the call chain upward

# pdb / breakpoint
breakpoint()   # pauses execution here
# pdb commands: n (next), s (step), c (continue), p var (print), q (quit)

# logging
import logging
logging.basicConfig(level=logging.INFO, filename="app.log",
                     format="%(asctime)s - %(levelname)s - %(message)s")

logging.debug("...")
logging.info("...")
logging.warning("...")
logging.error("...")
logging.critical("...")
```

---

## Interview Questions

**Q1. How should you read a Python traceback?**
Answer: Start from the last line, which shows the exception type and message. Then trace upward through the call chain to see exactly which function calls led to where the error actually occurred.

**Q2. What is the difference between `print()` debugging and using `pdb`?**
Answer: `print()` debugging requires manually adding statements and re-running the program each time. `pdb` (or `breakpoint()`) pauses the program at a specific point, letting you interactively inspect any variable's current value without modifying the code repeatedly.

**Q3. What are the five standard logging levels, in order of severity?**
Answer: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL` (from least to most severe).

**Q4. Why is the `logging` module preferred over `print()` in real applications?**
Answer: It provides severity levels (allowing filtering), can write to files, supports custom formatting (like timestamps), and can be configured differently for development versus production without changing the actual logging calls in the code.

**Q5. Why should you never log sensitive information like passwords?**
Answer: Log files can be read by anyone with access to the server or log storage, so logging secrets creates a serious security risk.

---

## Practice Questions

**Beginner**
1. Write a small program that raises a `ZeroDivisionError`, run it, and identify the exact line from the traceback.
2. Add `print()` statements to debug a function that isn't calculating a total correctly.
3. Use `breakpoint()` inside a function and step through it using `pdb` commands (`n`, `p`, `c`).
4. Configure basic logging with `level=logging.INFO` and log three different messages.
5. Log a warning message and an error message, and observe which ones appear when the level is set to `WARNING`.

**Intermediate**
1. Set up logging to write to a file called `debug.log`, including timestamps in the format.
2. Write a function with a deliberate bug, then use `pdb` to step through it and identify the problem.
3. Add appropriate logging (`INFO` for normal operations, `ERROR` for failures) to the Expense Tracker mini project from the Functions file.
4. Write a program that logs `DEBUG` messages during development but only logs `WARNING` and above once you change the configured level.
5. Explain, using a short paragraph as a comment, the difference between a stack trace and a log file.

**Challenge**
1. Add comprehensive logging (with appropriate levels) to the Student Management System mini project from the Database Programming file, logging every add/update/delete operation.
2. Deliberately introduce three different bugs into a working program (an off-by-one error, a type mismatch, and a logic error), then use tracebacks and `pdb` to find and fix each one.
3. Research (and briefly explain in comments) how log rotation works and why it's necessary for long-running production applications.
$ww18$, 'markdown',
  jsonb_build_object('source', 'python_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'python_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Git & GitHub
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = 'real-world-development-practices'),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ww19$Git & GitHub$ww19$, $ww20$git-and-github$ww20$, $ww21$Version control with Git — repositories, the add/commit workflow, connecting to GitHub, branching, merging and merge conflicts, Pull Requests, .gitignore and README.md.$ww21$, 19,
    'published', true, true, 'python_tutorial', $ww22$real-world-development-practices/git-and-github$ww22$
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
select up_topic.id, '', $ww23$As soon as you start working on real projects — especially with other people — you need a way to track changes to your code over time, undo mistakes, and collaborate without overwriting each other's work. That's exactly what Git and GitHub provide.

---

## 1. What is Git?

### What is it?

Git is a **version control system** — a tool that tracks every change made to your files over time, letting you see history, undo mistakes, and work on different versions of your code simultaneously.

> **Definition:** Git is a distributed version control system that tracks changes to files over time, enabling collaboration and history tracking.

### What is GitHub?

Git and GitHub are **not the same thing**:
- **Git** is the version control tool itself, running on your computer.
- **GitHub** is a website that hosts Git repositories online, adding collaboration features (pull requests, issues, project boards) on top of Git.

Think of Git as the engine, and GitHub as one popular place to park and share your car (other similar platforms include GitLab and Bitbucket).

### Why do we use it?

- **History** — see exactly what changed, when, and who changed it.
- **Undo mistakes** — go back to any previous saved version.
- **Collaboration** — multiple people can work on the same project without overwriting each other's work.
- **Backup** — your code is safely stored on GitHub, not just on one laptop.

---

## 2. Initializing a Repository

### What is it?

A **repository** (often shortened to "repo") is a project folder that Git is tracking.

### Simple Example

```bash
mkdir my-project
cd my-project
git init
```

**Explanation:** `git init` turns the current folder into a Git repository by creating a hidden `.git` folder, which stores all the tracking history behind the scenes.

### Important Points

- `git init` only needs to be run once per project.
- The hidden `.git` folder is where all of Git's tracking data actually lives — never delete it unless you want to remove all history.

---

## 3. The Basic Git Workflow: `status`, `add`, `commit`

### `git status` — See What's Changed

```bash
git status
```

Shows which files are new, modified, or staged (ready to be saved).

### `git add` — Stage Changes

```bash
git add filename.py       # stage one specific file
git add .                  # stage ALL changed files in the current folder
```

**Explanation:** "Staging" means marking changes as ready to be included in the next save point (commit). You can stage some files and leave others out, giving you control over exactly what gets saved together.

### `git commit` — Save a Snapshot

```bash
git commit -m "Add student grade calculation function"
```

**Explanation:** A commit is a permanent snapshot of your staged changes, along with a message describing what changed. `-m` lets you write the message directly in the command.

### The Full Cycle — Simple Example

```bash
# Edit some files...
git status                                    # see what changed
git add .                                      # stage everything
git commit -m "Add login validation feature"   # save the snapshot
```

### Common Mistakes

- Forgetting `git add` before `git commit` — nothing gets committed if nothing is staged.
- Writing vague commit messages like `"fixed stuff"` instead of clear, descriptive ones like `"Fix ZeroDivisionError in calculate_average()"`.
- Committing far too rarely (one giant commit at the end of a project) instead of small, frequent, logical commits.

### Important Points

- `git status` is your best friend — run it often to see exactly what Git currently sees.
- Good commit messages describe **what** changed and, ideally, **why**.

### Practice

1. Initialize a Git repository, create a text file, and commit it with a clear message.

---

## 4. Connecting to GitHub

### Cloning an Existing Repository

```bash
git clone https://github.com/username/repository-name.git
```

**Explanation:** This downloads a complete copy of an existing repository (including its full history) onto your computer.

### Connecting a Local Repository to GitHub

```bash
git remote add origin https://github.com/username/repository-name.git
git branch -M main
git push -u origin main
```

**Explanation:** `remote add origin` links your local repository to a specific GitHub repository (called "origin" by convention). `push` uploads your local commits to GitHub.

### `git push` and `git pull`

```bash
git push          # upload your local commits to GitHub
git pull           # download and merge new commits from GitHub into your local copy
```

### Real-World Example

A typical workflow: pull the latest changes from your team → make your own changes → commit them → push them back up to GitHub for others to see and pull.

### Common Mistakes

- Forgetting to `git pull` before starting new work, potentially missing your teammates' latest changes.
- Forgetting to `git push` after committing, meaning your changes only exist on your own computer, invisible to your team.

### Important Points

- `clone` downloads a repository for the first time; `pull` updates an already-cloned repository with new changes.
- `push` shares your local commits with everyone else (via GitHub).

---

## 5. Branching

### What is it?

A branch is an independent line of development — letting you work on a new feature or fix without touching the main, stable version of the code until you're ready.

> **Definition:** A branch is a separate line of development that allows changes to be made independently of the main codebase.

### Simple Example

```bash
git branch feature-login          # create a new branch
git checkout feature-login         # switch to it

# OR, in one step:
git checkout -b feature-login

# Modern alternative:
git switch -c feature-login
```

### Explanation

- Creating a branch essentially makes a snapshot copy of the code at that point, which you can freely modify without affecting the `main` branch.
- Once your feature works, you can merge it back into `main`.

### Real-World Example

A team working on an e-commerce site might have separate branches like `feature-payment-gateway`, `bugfix-cart-total`, and `main` — each developer works on their own branch, merging into `main` only once their work is tested and ready.

### Important Points

- `main` (or sometimes `master`) is typically the primary, stable branch.
- Creating a new branch for each feature/fix is standard professional practice — avoid making changes directly on `main` in team projects.

---

## 6. Merging

### What is it?

Merging combines changes from one branch into another — typically, merging a completed feature branch back into `main`.

### Simple Example

```bash
git checkout main
git merge feature-login
```

**Explanation:** This takes all the commits made on `feature-login` and integrates them into `main`.

### Merge Conflicts

### What is it?

A merge conflict happens when Git can't automatically decide how to combine changes — usually because the same lines of the same file were changed differently on both branches.

```
<<<<<<< HEAD
print("Hello from main")
=======
print("Hello from feature-login")
>>>>>>> feature-login
```

**Explanation:** Git marks the conflicting section clearly. You must manually decide what the final code should look like, delete the conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`), then `git add` and `git commit` to finalize the resolution.

### Common Mistakes

- Panicking at a merge conflict — it's a normal, expected part of collaborative development, not a sign something is broken.
- Forgetting to remove the conflict marker lines (`<<<<<<<`, `=======`, `>>>>>>>`) themselves after resolving.

### Important Points

- Merge conflicts happen when Git can't automatically reconcile changes — they require manual review and resolution.
- After resolving a conflict, you still need to `git add` the resolved file(s) and `git commit`.

### Practice

1. Create two branches, make conflicting changes to the same line of the same file on each, merge them, and practice resolving the conflict.

---

## 7. Pull Requests (GitHub Feature)

### What is it?

A Pull Request (PR) is a GitHub feature (not a raw Git command) that proposes merging changes from one branch into another — typically used to request that a teammate **review** your code before it's merged into `main`.

### Typical Workflow

1. Create a new branch and make your changes.
2. Push the branch to GitHub: `git push -u origin feature-login`.
3. On GitHub's website, open a Pull Request comparing `feature-login` to `main`.
4. Teammates review the code, leave comments, and request changes if needed.
5. Once approved, the PR is merged into `main` (often with a single click on GitHub).

### Real-World Example

Pull requests are the standard way professional teams review code before it becomes part of the main project — catching bugs, enforcing code style, and sharing knowledge across the team.

### Important Points

- Pull Requests are a GitHub (and similar platforms') feature layered on top of Git's branching/merging — not a Git command itself.
- Code review through PRs is one of the most important collaborative practices in professional software development.

---

## 8. `.gitignore`

### What is it?

A `.gitignore` file tells Git which files or folders to **never track** — like virtual environments, log files, or files containing secrets.

### Simple Example

**File: `.gitignore`**
```
venv/
__pycache__/
*.pyc
.env
*.log
```

### Explanation

- Each line is a pattern for files/folders Git should ignore completely — they won't show up in `git status`, won't be staged by `git add .`, and won't ever be committed.
- This is essential for excluding things like virtual environments (recreatable from `requirements.txt`) and files containing secrets (like API keys in a `.env` file).

### Common Mistakes

- Forgetting to add a `.gitignore` file early, then accidentally committing a virtual environment folder or a secrets file — which can be tricky to fully remove from history afterward.
- Committing `.env` files containing real passwords or API keys, exposing them publicly if the repository is public.

### Important Points

- Always set up `.gitignore` at the very start of a new project, before your first commit.
- Never commit files containing passwords, API keys, or other secrets.

---

## 9. README.md

### What is it?

A `README.md` file is the front page of a repository — automatically displayed on GitHub's repository page, explaining what the project is and how to use it.

### Simple Example

```markdown
# My Python Project

A simple command-line student management system.

## Features
- Add, view, and update student records
- Data stored in SQLite

## Installation
\`\`\`bash
pip install -r requirements.txt
python app.py
\`\`\`

## Author
Your Name
```

### Important Points

- Every real project should have a clear `README.md` — it's often the first (and sometimes only) thing someone reads before deciding whether to use or contribute to your project.
- Written in Markdown — the same lightweight formatting language used throughout this course.

---

## Common Beginner Mistakes — Summary for This Section

- Forgetting `git add` before `git commit`.
- Writing unclear, vague commit messages.
- Making changes directly on `main` instead of using feature branches.
- Committing secrets or virtual environment folders due to a missing `.gitignore`.
- Panicking at merge conflicts instead of resolving them methodically.

---

## Cheat Sheet — Git & GitHub

```bash
git init                              # start tracking a folder
git status                             # see current changes
git add .                              # stage all changes
git commit -m "message"                # save a snapshot

git clone <url>                        # download an existing repo
git push                               # upload commits to GitHub
git pull                                # download new commits from GitHub

git branch <name>                       # create a branch
git checkout <name>                     # switch to a branch
git checkout -b <name>                  # create AND switch in one step
git merge <branch-name>                 # merge a branch into the current one

# .gitignore example
venv/
__pycache__/
.env
```

---

## Interview Questions

**Q1. What is the difference between Git and GitHub?**
Answer: Git is the version control tool itself, running locally. GitHub is a website that hosts Git repositories online and adds collaboration features like Pull Requests, issues, and project boards on top of Git.

**Q2. What is the difference between `git add` and `git commit`?**
Answer: `git add` stages changes, marking them as ready to be saved. `git commit` actually saves a permanent snapshot of the staged changes, along with a descriptive message.

**Q3. What is a branch, and why would you use one?**
Answer: A branch is an independent line of development, letting you work on new features or fixes without affecting the main, stable codebase until the work is complete and merged.

**Q4. What causes a merge conflict, and how do you resolve one?**
Answer: A merge conflict occurs when Git cannot automatically reconcile changes made to the same lines of the same file on two different branches. It's resolved by manually reviewing the conflicting sections, deciding on the final content, removing the conflict markers, then staging and committing the resolved file.

**Q5. What is a Pull Request?**
Answer: A GitHub feature for proposing that changes from one branch be merged into another, typically used to allow team members to review code before it becomes part of the main codebase.

**Q6. What is the purpose of a `.gitignore` file?**
Answer: To tell Git which files or folders should never be tracked or committed — commonly used for virtual environments, cache files, and files containing secrets.

---

## Practice Questions

**Beginner**
1. Initialize a new Git repository and make your first commit.
2. Create a `.gitignore` file that excludes a `venv/` folder and `.env` files.
3. Make three separate commits to a project, each with a clear, descriptive message.
4. Create a GitHub repository and push a local project to it.
5. Write a simple `README.md` for a small project you've created in this course.

**Intermediate**
1. Create a new branch, make a change, and merge it back into `main`.
2. Clone an existing public repository from GitHub and explore its commit history using `git log`.
3. Deliberately create a merge conflict between two branches, then resolve it.
4. Practice the full collaboration cycle: create a branch, push it to GitHub, and open a Pull Request (even on a personal test repository).
5. Use `git status` at each step of a small project to observe how it changes as you add, modify, and commit files.

**Challenge**
1. Set up a small project with a proper `.gitignore`, `README.md`, at least 5 meaningful commits, and one feature branch merged into `main`.
2. Simulate a small team workflow (even solo): create two branches for two different "features," make changes on each, and merge both into `main`, resolving any conflicts that arise.
3. Research and briefly explain (in a markdown file) the difference between `git merge` and `git rebase`.
$ww23$, 'markdown',
  jsonb_build_object('source', 'python_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'python_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Data Analysis (NumPy, Pandas, Matplotlib, Seaborn)
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = 'real-world-development-practices'),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ww24$Data Analysis (NumPy, Pandas, Matplotlib, Seaborn)$ww24$, $ww25$data-analysis$ww25$, $ww26$NumPy arrays and vectorized operations, Pandas DataFrames (filtering, sorting, grouping, merging, missing values), and visualization with Matplotlib and Seaborn.$ww26$, 20,
    'published', true, true, 'python_tutorial', $ww27$real-world-development-practices/data-analysis$ww27$
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
select up_topic.id, '', $ww28$Data analysis is one of the biggest reasons Python became so popular. This file introduces the four essential libraries every data analyst, data scientist, and ML engineer uses daily: **NumPy** (numerical arrays), **Pandas** (tabular data), and **Matplotlib**/**Seaborn** (visualization).

```bash
pip install numpy pandas matplotlib seaborn
```

---

## 1. NumPy — Numerical Arrays

### What is it?

NumPy (Numerical Python) provides a fast, memory-efficient array type — the foundation almost every other data science library in Python is built on top of.

> **Definition:** NumPy is a Python library for fast numerical computing, built around a powerful multi-dimensional array object.

### Why do we use it?

Regular Python lists are flexible but slow for large-scale number crunching. NumPy arrays are much faster and support powerful operations — like adding two entire arrays together element-by-element — with a single line of code, instead of writing manual loops.

### Creating Arrays

```python
import numpy as np

arr = np.array([1, 2, 3, 4, 5])
print(arr)                # [1 2 3 4 5]
print(type(arr))           # <class 'numpy.ndarray'>

matrix = np.array([[1, 2, 3], [4, 5, 6]])
print(matrix)
# [[1 2 3]
#  [4 5 6]]

zeros = np.zeros((2, 3))     # 2x3 array of zeros
ones = np.ones((3, 3))        # 3x3 array of ones
range_arr = np.arange(0, 10, 2)   # [0 2 4 6 8]
```

### Indexing and Slicing

```python
arr = np.array([10, 20, 30, 40, 50])

print(arr[0])       # 10
print(arr[1:4])      # [20 30 40]

matrix = np.array([[1, 2, 3], [4, 5, 6]])
print(matrix[0, 2])   # 3 (row 0, column 2)
print(matrix[:, 1])   # [2 5] (all rows, column 1)
```

### Array Operations (Vectorization)

```python
arr = np.array([1, 2, 3, 4])

print(arr + 10)     # [11 12 13 14] - added to EVERY element at once
print(arr * 2)      # [2 4 6 8]
print(arr ** 2)      # [1 4 9 16]

a = np.array([1, 2, 3])
b = np.array([10, 20, 30])
print(a + b)          # [11 22 33] - element-wise addition
```

**Explanation:** This is called **vectorization** — operations apply to every element automatically, without writing an explicit loop. This is both far more concise and far faster than looping through a plain Python list.

### Useful NumPy Functions

```python
data = np.array([23, 45, 12, 67, 34, 89, 21])

print(np.mean(data))     # average
print(np.median(data))   # middle value
print(np.std(data))       # standard deviation
print(np.min(data))        # smallest value
print(np.max(data))        # largest value
print(np.sort(data))       # sorted array

reshaped = np.arange(12).reshape(3, 4)   # reshape into 3 rows, 4 columns
print(reshaped)
```

### Common Mistakes

- Trying to add a Python list directly with `+`, expecting element-wise addition — regular lists **concatenate** with `+` instead; you need a NumPy array for element-wise math.
- Forgetting NumPy arrays must contain a single consistent data type (unlike Python lists, which can freely mix types).

### Important Points

- NumPy arrays are the foundation of Pandas, and much of the scientific/ML Python ecosystem.
- Vectorized operations are both more concise and significantly faster than manual loops over large datasets.

### Practice

1. Create a NumPy array of 10 numbers and print its mean, min, and max.
2. Create a 2D array (3x3) and print just its middle row.

---

## 2. Pandas — Working with Tabular Data

### What is it?

Pandas provides the **DataFrame** — a table-like structure (rows and columns, similar to a spreadsheet or a SQL table) with powerful tools for cleaning, filtering, and analyzing data.

> **Definition:** A DataFrame is a two-dimensional, labeled data structure in Pandas, similar to a spreadsheet or SQL table, used for organizing and analyzing tabular data.

### Creating a DataFrame

```python
import pandas as pd

data = {
    "name": ["Aditi", "Rohan", "Zara", "Karan"],
    "age": [21, 22, 20, 23],
    "marks": [85, 92, 78, 88]
}

df = pd.DataFrame(data)
print(df)
```

Output:
```
    name  age  marks
0  Aditi   21     85
1  Rohan   22     92
2   Zara   20     78
3  Karan   23     88
```

### Reading Data From a CSV File

```python
df = pd.read_csv("students.csv")
```

### Exploring a DataFrame

```python
print(df.head())        # first 5 rows
print(df.tail(3))        # last 3 rows
print(df.info())          # column types and non-null counts
print(df.describe())      # statistical summary (mean, min, max, etc.) of numeric columns
print(df.shape)            # (rows, columns)
print(df.columns)          # list of column names
```

### Selecting Data

```python
print(df["name"])                 # a single column (returns a Series)
print(df[["name", "marks"]])       # multiple columns (returns a DataFrame)
print(df.iloc[0])                   # first row, by position
print(df.loc[0, "name"])            # specific value, by label
```

### Filtering Rows

```python
high_scorers = df[df["marks"] > 80]
print(high_scorers)

adults_only = df[(df["age"] >= 21) & (df["marks"] > 80)]
print(adults_only)
```

**Explanation:** `df["marks"] > 80` produces a series of `True`/`False` values; passing that inside `df[...]` keeps only the rows where the condition is `True`. Multiple conditions are combined with `&` (and) or `|` (or) — note the parentheses around each condition are required.

### Sorting

```python
print(df.sort_values("marks"))                  # ascending
print(df.sort_values("marks", ascending=False))  # descending
```

### Adding and Modifying Columns

```python
df["grade"] = df["marks"].apply(lambda x: "A" if x >= 85 else "B")
print(df)
```

**Explanation:** `.apply()` runs a function on every value in a column — here, a lambda function assigns a letter grade based on the marks value.

### Grouping Data

```python
data2 = {
    "name": ["Aditi", "Rohan", "Zara", "Karan"],
    "course": ["CS", "AI", "CS", "AI"],
    "marks": [85, 92, 78, 88]
}
df2 = pd.DataFrame(data2)

print(df2.groupby("course")["marks"].mean())
```

Output:
```
course
AI    90.0
CS    81.5
Name: marks, dtype: float64
```

**Explanation:** `groupby("course")` groups rows sharing the same course, and `["marks"].mean()` calculates the average marks within each group — directly parallel to SQL's `GROUP BY`.

### Handling Missing Values

```python
df3 = pd.DataFrame({"name": ["Aditi", "Rohan", None], "marks": [85, None, 78]})

print(df3.isnull())              # shows True/False for missing values
print(df3.isnull().sum())         # count of missing values per column

df3_dropped = df3.dropna()         # remove rows with ANY missing value
df3_filled = df3.fillna(0)          # replace missing values with 0
```

**Explanation:** Real-world data is almost never perfectly clean — `.isnull()` helps identify gaps, and `.dropna()`/`.fillna()` are the two most common strategies for handling them (either remove the incomplete rows, or fill in a reasonable default value).

### Merging DataFrames

```python
students = pd.DataFrame({"id": [1, 2, 3], "name": ["Aditi", "Rohan", "Zara"]})
marks = pd.DataFrame({"id": [1, 2, 3], "marks": [85, 92, 78]})

merged = pd.merge(students, marks, on="id")
print(merged)
```

Output:
```
   id   name  marks
0   1  Aditi     85
1   2  Rohan     92
2   3   Zara     78
```

**Explanation:** `pd.merge()` combines two DataFrames based on a shared column — directly parallel to a SQL `JOIN`.

### Common Mistakes

- Forgetting `.copy()` when creating a filtered/modified DataFrame from another, sometimes triggering a confusing `SettingWithCopyWarning`.
- Confusing `.loc[]` (label-based access) with `.iloc[]` (position-based access).
- Forgetting parentheses around each condition when combining filters with `&`/`|`.

### Important Points

- Pandas is the standard tool for cleaning, exploring, and analyzing tabular data in Python.
- `.groupby()`, `.merge()`, `.dropna()`/`.fillna()` cover the vast majority of everyday data-cleaning tasks.

### Practice

1. Load a CSV of your choice (or create a small DataFrame manually) and print its summary statistics using `.describe()`.
2. Filter a DataFrame of students to show only those with marks above 75, sorted in descending order.

---

## 3. Matplotlib — Basic Visualization

### What is it?

Matplotlib is Python's foundational plotting library — used to create line charts, bar charts, scatter plots, histograms, and more.

### Simple Examples

```python
import matplotlib.pyplot as plt

# Line chart
months = ["Jan", "Feb", "Mar", "Apr"]
sales = [200, 250, 180, 300]

plt.plot(months, sales, marker="o")
plt.title("Monthly Sales")
plt.xlabel("Month")
plt.ylabel("Sales")
plt.show()

# Bar chart
students = ["Aditi", "Rohan", "Zara"]
marks = [85, 92, 78]

plt.bar(students, marks, color="skyblue")
plt.title("Student Marks")
plt.show()

# Scatter plot
plt.scatter([1, 2, 3, 4], [10, 20, 15, 25])
plt.title("Sample Scatter Plot")
plt.show()

# Histogram
data = [23, 45, 12, 67, 34, 89, 21, 45, 33, 56]
plt.hist(data, bins=5)
plt.title("Distribution of Values")
plt.show()
```

### Explanation

- `plt.plot()`, `plt.bar()`, `plt.scatter()`, and `plt.hist()` each create a different chart type suited to different data: trends over time (line), comparing categories (bar), relationships between two variables (scatter), and distribution/frequency (histogram).
- `plt.show()` displays the chart — required to actually see the plot when running a `.py` script.

### Important Points

- Choose the chart type based on what story you're telling: trends → line, comparisons → bar, relationships → scatter, distribution → histogram.

---

## 4. Seaborn — Statistical Visualization

### What is it?

Seaborn is built on top of Matplotlib, offering more attractive default styling and simpler syntax specifically for statistical charts.

### Simple Examples

```python
import seaborn as sns
import matplotlib.pyplot as plt
import pandas as pd

df = pd.DataFrame({
    "course": ["CS", "AI", "CS", "AI", "CS"],
    "marks": [85, 92, 78, 88, 95]
})

sns.barplot(x="course", y="marks", data=df)
plt.title("Average Marks by Course")
plt.show()

sns.histplot(df["marks"], bins=5, kde=True)
plt.title("Marks Distribution")
plt.show()

sns.boxplot(x="course", y="marks", data=df)
plt.title("Marks Spread by Course")
plt.show()
```

### Explanation

- `sns.barplot()` automatically calculates and displays averages grouped by category — no manual `groupby()` needed first.
- `kde=True` in `histplot()` overlays a smooth density curve on top of the histogram, showing the overall distribution shape more clearly.
- `sns.boxplot()` shows the spread, median, and potential outliers of a numeric variable, broken down by category.

### Comparison Table — Matplotlib vs Seaborn

| | Matplotlib | Seaborn |
|---|---|---|
| Level | Lower-level, more manual control | Higher-level, statistical focus |
| Default styling | Basic | Polished, attractive defaults |
| Works directly with DataFrames | Somewhat | Very naturally (`data=df` parameter) |
| Best for | Full custom control over every element | Quick, clean statistical plots |

### Common Mistakes

- Forgetting `plt.show()` when running plotting code as a `.py` script (not needed in some interactive environments like Jupyter, but required in plain scripts).
- Not labeling axes/titles, making charts hard to interpret for anyone besides the person who made them.

---

## Common Beginner Mistakes — Summary for This Section

- Confusing NumPy arrays' element-wise math with Python list concatenation.
- Confusing `.loc[]` with `.iloc[]` in Pandas.
- Forgetting to handle missing values before analyzing data.
- Forgetting `plt.show()` in script-based Matplotlib/Seaborn code.

---

## Cheat Sheet — Data Analysis

```python
import numpy as np
arr = np.array([1, 2, 3])
np.mean(arr); np.sum(arr); np.sort(arr)

import pandas as pd
df = pd.read_csv("file.csv")
df.head(); df.info(); df.describe()
df[df["col"] > 10]                        # filter
df.sort_values("col", ascending=False)     # sort
df.groupby("col")["other_col"].mean()      # group
df.dropna(); df.fillna(0)                   # missing values
pd.merge(df1, df2, on="key")                # join

import matplotlib.pyplot as plt
plt.plot(x, y); plt.bar(x, y); plt.hist(data)
plt.title(""); plt.xlabel(""); plt.ylabel(""); plt.show()

import seaborn as sns
sns.barplot(x="col1", y="col2", data=df)
sns.histplot(df["col"], kde=True)
sns.boxplot(x="col1", y="col2", data=df)
```

---

## Mini Project: Student Performance Analysis

### Objective

Analyze a small dataset of student marks — calculating statistics, identifying top and struggling students, and visualizing the results.

### Requirements

- Load student data (name, subject scores) into a DataFrame.
- Calculate each student's average and identify pass/fail.
- Visualize the class's overall performance.

### Concepts Used

Pandas (DataFrames, filtering, grouping), Matplotlib/Seaborn visualization.

### Complete Code

```python
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

data = {
    "name": ["Aditi", "Rohan", "Zara", "Karan", "Meera"],
    "maths": [85, 45, 92, 38, 76],
    "science": [78, 55, 88, 42, 81],
    "english": [90, 60, 85, 50, 70]
}

df = pd.DataFrame(data)

# Calculate average marks per student
df["average"] = df[["maths", "science", "english"]].mean(axis=1)

# Determine pass/fail (pass mark: 40 average)
df["result"] = df["average"].apply(lambda avg: "Pass" if avg >= 40 else "Fail")

print(df)

topper = df.loc[df["average"].idxmax()]
print(f"\nTopper: {topper['name']} with an average of {topper['average']:.2f}")

failing_students = df[df["result"] == "Fail"]
print(f"\nStudents who failed:\n{failing_students[['name', 'average']]}")

# Visualization
sns.barplot(x="name", y="average", data=df, palette="viridis")
plt.title("Average Marks per Student")
plt.axhline(y=40, color="red", linestyle="--", label="Pass Mark")
plt.legend()
plt.show()
```

### Code Explanation

- `df[["maths", "science", "english"]].mean(axis=1)` calculates the average **across columns** for each row (student) — `axis=1` means "average across this row," not down a column.
- `.idxmax()` finds the index (row position) of the highest average, letting us look up the topper's full row.
- The bar chart visualizes every student's average, with a horizontal reference line marking the pass threshold.

### Sample Output

```
    name  maths  science  english    average result
0  Aditi     85       78       90  84.333333   Pass
1  Rohan     45       55       60  53.333333   Pass
2   Zara     92       88       85  88.333333   Pass
3  Karan     38       42       50  43.333333   Pass
4  Meera     76       81       70  75.666667   Pass

Topper: Zara with an average of 88.33
```

### Possible Improvements

- Add subject-wise topper identification, not just overall.
- Load data from a real CSV file instead of a hardcoded dictionary.
- Add a correlation analysis between subjects (do students who do well in Maths also do well in Science?).

### Challenge Task

Extend the analysis to calculate and visualize the class average per subject (not just per student), identifying which subject the class struggled with most.

---

## Interview Questions

**Q1. What is the main advantage of NumPy arrays over Python lists?**
Answer: NumPy arrays support fast, vectorized mathematical operations across entire arrays at once, and are more memory-efficient — both significant advantages for large-scale numerical computation compared to looping through plain Python lists.

**Q2. What is a Pandas DataFrame?**
Answer: A two-dimensional, labeled data structure (rows and columns) similar to a spreadsheet or SQL table, used for organizing, cleaning, and analyzing tabular data.

**Q3. What is the difference between `.loc[]` and `.iloc[]` in Pandas?**
Answer: `.loc[]` accesses data by label (e.g., column name or index label). `.iloc[]` accesses data by integer position, regardless of labels.

**Q4. How do you handle missing values in a Pandas DataFrame?**
Answer: Using `.isnull()` to detect them, then either `.dropna()` to remove rows/columns with missing values, or `.fillna(value)` to replace them with a specified default.

**Q5. What is the difference between Matplotlib and Seaborn?**
Answer: Matplotlib is the foundational, lower-level plotting library giving full manual control. Seaborn is built on top of it, offering more attractive default styles and simpler syntax specifically for statistical visualizations, and integrates very naturally with Pandas DataFrames.

**Q6. What does `groupby()` do in Pandas?**
Answer: It groups rows sharing a common value in a specified column, typically combined with an aggregate function (like `.mean()` or `.sum()`) to summarize data within each group — directly analogous to SQL's `GROUP BY`.

---

## Practice Questions

**Beginner**
1. Create a NumPy array of 10 random-looking numbers and calculate their mean and standard deviation.
2. Create a Pandas DataFrame of 5 products with name and price, and print `.describe()`.
3. Filter a DataFrame of employees to show only those earning above a certain salary.
4. Create a simple bar chart of 5 categories and their values using Matplotlib.
5. Create a histogram of 20 random-looking numbers using Seaborn.

**Intermediate**
1. Load a CSV file of your choice into a DataFrame and print the top 5 rows, column info, and summary statistics.
2. Group a DataFrame of sales data by "region" and calculate total sales per region.
3. Handle missing values in a DataFrame by filling numeric columns with their mean value.
4. Merge two DataFrames (e.g., `orders` and `customers`) on a shared `customer_id` column.
5. Create a Seaborn box plot comparing a numeric column across different categories.

**Challenge**
1. Analyze a dataset of exam scores across multiple subjects: find the topper, the subject with the lowest class average, and visualize all subject averages in one chart.
2. Build a small sales dashboard: load sales data, calculate monthly totals, and visualize the trend using a line chart.
3. Extend the Student Performance Analysis mini project to categorize each student into grade bands (A/B/C/D/Fail) and visualize how many students fall into each band using a bar chart.
$ww28$, 'markdown',
  jsonb_build_object('source', 'python_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'python_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- ===========================================================================
-- 4. MOCK TESTS + QUESTIONS — one 10-question, 10-minute test per topic.
-- ===========================================================================

-- Web Development (Flask, Django, FastAPI) — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'real-world-development-practices/web-development')
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-py-web-development', $ww29$Web Development (Flask, Django, FastAPI) - Quick Test$ww29$, 'aptitude', 10, 10,
  $ww30$10 questions covering Flask, Django, FastAPI, routing, templates, ORMs, admin panels, and Pydantic validation.$ww30$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $ww31$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$ww31$, true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-py-web-development-1', 'pt-py-web-development',
   $ww32$What does @app.route("/") do in Flask?$ww32$,
   $ww33$["Starts the server", "Connects a URL to the function below it", "Deletes a route", "Imports Flask"]$ww33$::jsonb,
   1, $ww34$@app.route("/") is a decorator that connects (routes) that URL to the function defined right below it.$ww34$, 1, 0),
  ('tq-py-web-development-2', 'pt-py-web-development',
   $ww35$Which framework is described as "batteries-included"?$ww35$,
   $ww36$["Flask", "FastAPI", "Django", "None of these"]$ww36$::jsonb,
   2, $ww37$Django is described as "batteries-included" because it ships with a built-in ORM, admin panel, and authentication system out of the box.$ww37$, 1, 1),
  ('tq-py-web-development-3', 'pt-py-web-development',
   $ww38$What does python manage.py migrate do in Django?$ww38$,
   $ww39$["Deletes the database", "Applies pending database schema changes", "Starts the server", "Installs Django"]$ww39$::jsonb,
   1, $ww40$python manage.py migrate applies pending database schema changes that makemigrations generated.$ww40$, 1, 2),
  ('tq-py-web-development-4', 'pt-py-web-development',
   $ww41$What is a standout feature of FastAPI?$ww41$,
   $ww42$["A built-in admin panel", "Automatic interactive API documentation", "No need for Python", "Built-in HTML templates only"]$ww42$::jsonb,
   1, $ww43$FastAPI automatically generates a full interactive API documentation page, with zero extra effort, based on your route definitions and type hints.$ww43$, 1, 3),
  ('tq-py-web-development-5', 'pt-py-web-development',
   $ww44$What library does FastAPI use for request body validation?$ww44$,
   $ww45$["Django ORM", "Pydantic", "Jinja2", "SQLAlchemy"]$ww45$::jsonb,
   1, $ww46$FastAPI uses Pydantic models to define and automatically validate the structure of incoming request data.$ww46$, 1, 4),
  ('tq-py-web-development-6', 'pt-py-web-development',
   $ww47$What templating engine does Flask use by default?$ww47$,
   $ww48$["Django Templates", "Jinja2", "Mustache", "Handlebars"]$ww48$::jsonb,
   1, $ww49$Flask uses the Jinja2 templating engine by default to generate dynamic HTML.$ww49$, 1, 5),
  ('tq-py-web-development-7', 'pt-py-web-development',
   $ww50$What does request.form access in Flask?$ww50$,
   $ww51$["URL query parameters", "Data submitted through an HTML form", "Response headers", "Cookies only"]$ww51$::jsonb,
   1, $ww52$request.form accesses data submitted through an HTML form; request.args is used for URL query parameters instead.$ww52$, 1, 6),
  ('tq-py-web-development-8', 'pt-py-web-development',
   $ww53$Why should debug=True never be used in production Flask apps?$ww53$,
   $ww54$["It's slower", "It can expose sensitive internal details if something crashes", "It disables routing", "It's not valid syntax"]$ww54$::jsonb,
   1, $ww55$Leaving debug=True on in production can expose sensitive internal details (like stack traces and source code) if the application crashes.$ww55$, 1, 7),
  ('tq-py-web-development-9', 'pt-py-web-development',
   $ww56$Which framework would you choose for a large content-heavy site needing a built-in admin panel?$ww56$,
   $ww57$["FastAPI", "Flask", "Django", "None of them have this"]$ww57$::jsonb,
   2, $ww58$Django's built-in admin panel and ORM make it the strongest choice for large, content-heavy sites that need robust administrative tooling out of the box.$ww58$, 1, 8),
  ('tq-py-web-development-10', 'pt-py-web-development',
   $ww59$What server is used to run a FastAPI application?$ww59$,
   $ww60$["Flask's built-in server", "uvicorn", "Apache only", "No server is needed"]$ww60$::jsonb,
   1, $ww61$FastAPI itself has no built-in dev server — uvicorn is the ASGI server used to actually run a FastAPI application.$ww61$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-py-web-development' and question_count <> 10;

-- Testing — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'real-world-development-practices/testing')
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-py-testing', $ww62$Testing - Quick Test$ww62$, 'aptitude', 10, 10,
  $ww63$10 questions covering unittest, pytest, fixtures, mocking, integration testing, API testing, and code coverage.$ww63$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $ww64$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$ww64$, true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-py-testing-1', 'pt-py-testing',
   $ww65$What must every unittest test method name start with?$ww65$,
   $ww66$["check_", "test_", "verify_", "Any name works"]$ww66$::jsonb,
   1, $ww67$unittest only recognizes a method as a test if its name starts with test_ — anything else is silently skipped.$ww67$, 1, 0),
  ('tq-py-testing-2', 'pt-py-testing',
   $ww68$Which assertion checks that two values are equal in unittest?$ww68$,
   $ww69$["assertTrue()", "assertEqual()", "assertIs()", "assertSame()"]$ww69$::jsonb,
   1, $ww70$assertEqual(a, b) checks that a == b, failing the test and reporting the mismatch if they differ.$ww70$, 1, 1),
  ('tq-py-testing-3', 'pt-py-testing',
   $ww71$What syntax does pytest use for assertions?$ww71$,
   $ww72$["self.assertEqual()", "Plain assert statements", "check()", "verify()"]$ww72$::jsonb,
   1, $ww73$pytest uses plain assert statements instead of unittest's special self.assertEqual()-style methods.$ww73$, 1, 2),
  ('tq-py-testing-4', 'pt-py-testing',
   $ww74$What is a test fixture?$ww74$,
   $ww75$["A broken test", "Reusable setup code shared across multiple tests", "A type of assertion", "A production configuration file"]$ww75$::jsonb,
   1, $ww76$A fixture is reusable setup code shared across multiple tests, avoiding repeated setup logic in every test function.$ww76$, 1, 3),
  ('tq-py-testing-5', 'pt-py-testing',
   $ww77$What is the purpose of mocking?$ww77$,
   $ww78$["To make tests slower", "To replace real, unpredictable dependencies with controlled fakes", "To delete test files", "To skip writing tests"]$ww78$::jsonb,
   1, $ww79$Mocking replaces a real, often slow or unpredictable dependency with a controlled fake, so tests run quickly and reliably without depending on it.$ww79$, 1, 4),
  ('tq-py-testing-6', 'pt-py-testing',
   $ww80$What is the difference between unit testing and integration testing?$ww80$,
   $ww81$["No difference", "Unit tests check one function in isolation; integration tests check multiple components together", "Integration tests are always faster", "Unit tests require a database"]$ww81$::jsonb,
   1, $ww82$Unit tests check one function or component in isolation; integration tests check that multiple components work correctly together.$ww82$, 1, 5),
  ('tq-py-testing-7', 'pt-py-testing',
   $ww83$What does pytest --cov=module_name measure?$ww83$,
   $ww84$["Number of tests", "Code coverage (percentage of code executed by tests)", "Test execution time", "Number of bugs"]$ww84$::jsonb,
   1, $ww85$pytest --cov=module_name measures code coverage — the percentage of that module's code actually executed while running the tests.$ww85$, 1, 6),
  ('tq-py-testing-8', 'pt-py-testing',
   $ww86$What tool does Flask provide for testing routes without starting a real server?$ww86$,
   $ww87$["pytest.mock", "app.test_client()", "unittest.server", "flask.debug()"]$ww87$::jsonb,
   1, $ww88$app.test_client() simulates HTTP requests against a Flask application without actually starting a real server.$ww88$, 1, 7),
  ('tq-py-testing-9', 'pt-py-testing',
   $ww89$In unittest, which method runs automatically before every test in a class?$ww89$,
   $ww90$["tearDown()", "setUp()", "beforeEach()", "init()"]$ww90$::jsonb,
   1, $ww91$setUp() runs automatically before every single test method in a unittest.TestCase class, giving each test a fresh setup.$ww91$, 1, 8),
  ('tq-py-testing-10', 'pt-py-testing',
   $ww92$Is 100% code coverage a guarantee of bug-free code?$ww92$,
   $ww93$["Yes, always", "No — it only means code was executed, not that it was verified correctly", "Yes, but only for pytest", "Coverage doesn't apply to Python"]$ww93$::jsonb,
   1, $ww94$100% coverage only means every line was executed at least once during testing — it says nothing about whether the results were actually verified correctly.$ww94$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-py-testing' and question_count <> 10;

-- Debugging & Logging — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'real-world-development-practices/debugging-and-logging')
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-py-debugging-logging', $ww95$Debugging & Logging - Quick Test$ww95$, 'aptitude', 10, 10,
  $ww96$10 questions covering tracebacks, pdb/breakpoint(), the logging module, log levels, and logging to files.$ww96$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $ww97$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$ww97$, true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-py-debugging-logging-1', 'pt-py-debugging-logging',
   $ww98$In which order should you read a Python traceback?$ww98$,
   $ww99$["Top to bottom", "Bottom to top, starting with the last line", "Randomly", "Only the first line matters"]$ww99$::jsonb,
   1, $ww100$Tracebacks should be read bottom to top — the last line names the exception type and message, and the lines above trace the call chain that led there.$ww100$, 1, 0),
  ('tq-py-debugging-logging-2', 'pt-py-debugging-logging',
   $ww101$What does breakpoint() do?$ww101$,
   $ww102$["Ends the program", "Pauses execution at that line for interactive inspection", "Deletes a variable", "Restarts the program"]$ww102$::jsonb,
   1, $ww103$breakpoint() pauses program execution at that exact line, dropping into an interactive debugger session for inspection.$ww103$, 1, 1),
  ('tq-py-debugging-logging-3', 'pt-py-debugging-logging',
   $ww104$Which pdb command moves to the next line?$ww104$,
   $ww105$["s", "n", "c", "q"]$ww105$::jsonb,
   1, $ww106$n (next) runs the next line of code in the pdb debugger, without stepping into function calls.$ww106$, 1, 2),
  ('tq-py-debugging-logging-4', 'pt-py-debugging-logging',
   $ww107$Which logging level indicates a serious problem where some functionality failed?$ww107$,
   $ww108$["DEBUG", "INFO", "ERROR", "NOTSET"]$ww108$::jsonb,
   2, $ww109$ERROR indicates a serious problem where some specific functionality has failed, one level below CRITICAL.$ww109$, 1, 3),
  ('tq-py-debugging-logging-5', 'pt-py-debugging-logging',
   $ww110$What is the correct order of logging severity, from least to most severe?$ww110$,
   $ww111$["ERROR, WARNING, INFO, DEBUG, CRITICAL", "DEBUG, INFO, WARNING, ERROR, CRITICAL", "CRITICAL, ERROR, WARNING, INFO, DEBUG", "INFO, DEBUG, ERROR, WARNING, CRITICAL"]$ww111$::jsonb,
   1, $ww112$The five standard logging levels, from least to most severe, are DEBUG, INFO, WARNING, ERROR, CRITICAL.$ww112$, 1, 4),
  ('tq-py-debugging-logging-6', 'pt-py-debugging-logging',
   $ww113$If logging.basicConfig(level=logging.WARNING) is set, which messages are shown?$ww113$,
   $ww114$["Only DEBUG", "WARNING, ERROR, and CRITICAL", "Only INFO", "Nothing is shown"]$ww114$::jsonb,
   1, $ww115$Setting level=logging.WARNING shows WARNING and everything more severe (ERROR, CRITICAL), filtering out DEBUG and INFO.$ww115$, 1, 5),
  ('tq-py-debugging-logging-7', 'pt-py-debugging-logging',
   $ww116$Why should sensitive data never be logged?$ww116$,
   $ww117$["It slows down logging", "Log files can be read by anyone with server/file access, exposing secrets", "Logging doesn't support strings", "It's a syntax error"]$ww117$::jsonb,
   1, $ww118$Log files can be read by anyone with access to the server or log storage, so logging passwords or API keys exposes them.$ww118$, 1, 6),
  ('tq-py-debugging-logging-8', 'pt-py-debugging-logging',
   $ww119$What is the main advantage of using the logging module over print()?$ww119$,
   $ww120$["It's shorter to type", "It supports severity levels, file output, and custom formatting", "It's the only way to display text", "There is no real advantage"]$ww120$::jsonb,
   1, $ww121$The logging module supports severity levels for filtering, can write to files, and supports custom formatting — none of which plain print() offers.$ww121$, 1, 7),
  ('tq-py-debugging-logging-9', 'pt-py-debugging-logging',
   $ww122$What does the filename parameter in logging.basicConfig() do?$ww122$,
   $ww123$["Names the Python script", "Redirects log output to a file instead of the console", "Deletes old logs", "Sets the log level"]$ww123$::jsonb,
   1, $ww124$The filename parameter in logging.basicConfig() redirects all log output to that file instead of the console.$ww124$, 1, 8),
  ('tq-py-debugging-logging-10', 'pt-py-debugging-logging',
   $ww125$Why should breakpoint() calls be removed before deploying code to production?$ww125$,
   $ww126$["They cause syntax errors", "They would pause the program unexpectedly in production", "They only work in test files", "They are automatically removed by Python"]$ww126$::jsonb,
   1, $ww127$A breakpoint() call left in deployed code would pause the running program unexpectedly, waiting for interactive input that a production server can never provide.$ww127$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-py-debugging-logging' and question_count <> 10;

-- Git & GitHub — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'real-world-development-practices/git-and-github')
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-py-git-github', $ww128$Git & GitHub - Quick Test$ww128$, 'aptitude', 10, 10,
  $ww129$10 questions covering Git basics, GitHub, branching, merging, Pull Requests, and .gitignore.$ww129$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $ww130$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$ww130$, true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-py-git-github-1', 'pt-py-git-github',
   $ww131$What is the difference between Git and GitHub?$ww131$,
   $ww132$["They are the same thing", "Git is the version control tool; GitHub is a website that hosts Git repositories", "GitHub is the tool; Git is the website", "Git only works with GitHub"]$ww132$::jsonb,
   1, $ww133$Git is the version control tool itself, running locally; GitHub is a website that hosts Git repositories online and adds collaboration features on top.$ww133$, 1, 0),
  ('tq-py-git-github-2', 'pt-py-git-github',
   $ww134$What does git init do?$ww134$,
   $ww135$["Downloads a repository", "Turns the current folder into a Git repository", "Deletes all history", "Pushes code to GitHub"]$ww135$::jsonb,
   1, $ww136$git init turns the current folder into a Git repository by creating a hidden .git folder that stores all tracking history.$ww136$, 1, 1),
  ('tq-py-git-github-3', 'pt-py-git-github',
   $ww137$What is the difference between git add and git commit?$ww137$,
   $ww138$["No difference", "add stages changes; commit saves a permanent snapshot", "commit stages changes; add saves a snapshot", "Both upload to GitHub"]$ww138$::jsonb,
   1, $ww139$git add stages changes, marking them ready to be saved; git commit actually saves a permanent snapshot of the staged changes.$ww139$, 1, 2),
  ('tq-py-git-github-4', 'pt-py-git-github',
   $ww140$What does git clone <url> do?$ww140$,
   $ww141$["Creates a new branch", "Downloads a complete copy of an existing repository", "Deletes a repository", "Merges two branches"]$ww141$::jsonb,
   1, $ww142$git clone <url> downloads a complete copy of an existing repository, including its full history, onto your computer.$ww142$, 1, 3),
  ('tq-py-git-github-5', 'pt-py-git-github',
   $ww143$What is a branch in Git?$ww143$,
   $ww144$["A copy of GitHub", "An independent line of development", "A type of commit", "A deleted file"]$ww144$::jsonb,
   1, $ww145$A branch is an independent line of development, letting you work on changes without affecting the main, stable codebase until you're ready.$ww145$, 1, 4),
  ('tq-py-git-github-6', 'pt-py-git-github',
   $ww146$What causes a merge conflict?$ww146$,
   $ww147$["Using git status too often", "Git being unable to automatically reconcile changes to the same lines of the same file on two branches", "Forgetting to install Git", "Creating too many branches"]$ww147$::jsonb,
   1, $ww148$A merge conflict happens when Git can't automatically reconcile changes made to the same lines of the same file on two different branches.$ww148$, 1, 5),
  ('tq-py-git-github-7', 'pt-py-git-github',
   $ww149$What is a Pull Request?$ww149$,
   $ww150$["A Git command", "A GitHub feature for proposing that changes from one branch be merged into another, usually for review", "A way to delete a repository", "A type of commit message"]$ww150$::jsonb,
   1, $ww151$A Pull Request is a GitHub feature (not a raw Git command) for proposing that changes from one branch be merged into another, usually for team review.$ww151$, 1, 6),
  ('tq-py-git-github-8', 'pt-py-git-github',
   $ww152$What is the purpose of a .gitignore file?$ww152$,
   $ww153$["To speed up commits", "To tell Git which files/folders should never be tracked", "To store passwords safely", "To create new branches"]$ww153$::jsonb,
   1, $ww154$A .gitignore file tells Git which files or folders should never be tracked or committed, such as virtual environments or secrets.$ww154$, 1, 7),
  ('tq-py-git-github-9', 'pt-py-git-github',
   $ww155$What command uploads local commits to GitHub?$ww155$,
   $ww156$["git pull", "git push", "git fetch", "git commit"]$ww156$::jsonb,
   1, $ww157$git push uploads your local commits to GitHub (or whatever remote is configured).$ww157$, 1, 8),
  ('tq-py-git-github-10', 'pt-py-git-github',
   $ww158$Which command lets you create and switch to a new branch in one step?$ww158$,
   $ww159$["git branch -c", "git checkout -b <name>", "git new <name>", "git switch --create"]$ww159$::jsonb,
   1, $ww160$git checkout -b <name> creates a new branch and switches to it in a single step.$ww160$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-py-git-github' and question_count <> 10;

-- Data Analysis (NumPy, Pandas, Matplotlib, Seaborn) — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'real-world-development-practices/data-analysis')
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-py-data-analysis', $ww161$Data Analysis (NumPy, Pandas, Matplotlib, Seaborn) - Quick Test$ww161$, 'aptitude', 10, 10,
  $ww162$10 questions covering NumPy arrays, Pandas DataFrames, and Matplotlib/Seaborn visualization.$ww162$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $ww163$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$ww163$, true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-py-data-analysis-1', 'pt-py-data-analysis',
   $ww164$What is the main advantage of NumPy arrays over Python lists?$ww164$,
   $ww165$["They can hold mixed types more easily", "Fast, vectorized mathematical operations", "They use more memory but are safer", "They cannot be indexed"]$ww165$::jsonb,
   1, $ww166$NumPy arrays support fast, vectorized mathematical operations across an entire array at once, instead of looping through a plain Python list.$ww166$, 1, 0),
  ('tq-py-data-analysis-2', 'pt-py-data-analysis',
   $ww167$What is a Pandas DataFrame?$ww167$,
   $ww168$["A single column of data", "A two-dimensional, labeled data structure similar to a spreadsheet", "A type of NumPy array only", "A visualization tool"]$ww168$::jsonb,
   1, $ww169$A Pandas DataFrame is a two-dimensional, labeled data structure — rows and columns — similar to a spreadsheet or SQL table.$ww169$, 1, 1),
  ('tq-py-data-analysis-3', 'pt-py-data-analysis',
   $ww170$What is the difference between .loc[] and .iloc[]?$ww170$,
   $ww171$["No difference", ".loc[] uses labels; .iloc[] uses integer positions", ".iloc[] uses labels; .loc[] uses integer positions", "Both only work on NumPy arrays"]$ww171$::jsonb,
   1, $ww172$.loc[] accesses data by label (like a column name or index label); .iloc[] accesses data by integer position, regardless of labels.$ww172$, 1, 2),
  ('tq-py-data-analysis-4', 'pt-py-data-analysis',
   $ww173$Which method removes rows with missing values in Pandas?$ww173$,
   $ww174$[".fillna()", ".dropna()", ".isnull()", ".remove()"]$ww174$::jsonb,
   1, $ww175$.dropna() removes rows (or columns) that contain any missing values.$ww175$, 1, 3),
  ('tq-py-data-analysis-5', 'pt-py-data-analysis',
   $ww176$What does df.groupby("col")["other_col"].mean() do?$ww176$,
   $ww177$["Deletes rows", "Groups rows by col and calculates the average of other_col per group", "Sorts the DataFrame", "Merges two DataFrames"]$ww177$::jsonb,
   1, $ww178$df.groupby("col")["other_col"].mean() groups rows sharing the same value in col, then calculates the average of other_col within each group.$ww178$, 1, 4),
  ('tq-py-data-analysis-6', 'pt-py-data-analysis',
   $ww179$What does pd.merge(df1, df2, on="id") do?$ww179$,
   $ww180$["Deletes matching rows", "Combines two DataFrames based on a shared column, like a SQL JOIN", "Concatenates them randomly", "Converts them to NumPy arrays"]$ww180$::jsonb,
   1, $ww181$pd.merge(df1, df2, on="id") combines two DataFrames based on a shared column, directly analogous to a SQL JOIN.$ww181$, 1, 5),
  ('tq-py-data-analysis-7', 'pt-py-data-analysis',
   $ww182$Which chart type is best for showing a trend over time?$ww182$,
   $ww183$["Bar chart", "Line chart", "Pie chart", "Scatter plot"]$ww183$::jsonb,
   1, $ww184$A line chart is best for showing how a value changes over time — a trend.$ww184$, 1, 6),
  ('tq-py-data-analysis-8', 'pt-py-data-analysis',
   $ww185$Which library is built on top of Matplotlib with more attractive default statistical plots?$ww185$,
   $ww186$["NumPy", "Pandas", "Seaborn", "SciPy"]$ww186$::jsonb,
   2, $ww187$Seaborn is built on top of Matplotlib, offering more attractive default styling and simpler syntax specifically for statistical plots.$ww187$, 1, 7),
  ('tq-py-data-analysis-9', 'pt-py-data-analysis',
   $ww188$What must be called to actually display a Matplotlib chart in a script?$ww188$,
   $ww189$["plt.draw()", "plt.show()", "plt.display()", "plt.render()"]$ww189$::jsonb,
   1, $ww190$plt.show() is required to actually display a Matplotlib chart when running a plain .py script.$ww190$, 1, 8),
  ('tq-py-data-analysis-10', 'pt-py-data-analysis',
   $ww191$What does df.describe() return?$ww191$,
   $ww192$["The column names only", "A statistical summary (mean, min, max, etc.) of numeric columns", "The first 5 rows", "The data types of each column"]$ww192$::jsonb,
   1, $ww193$df.describe() returns a statistical summary (mean, min, max, quartiles, etc.) of a DataFrame's numeric columns.$ww193$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-py-data-analysis' and question_count <> 10;

-- ===========================================================================
-- 5. CODING PROBLEMS — 0-4 Python-only problems per topic (topic_id NULL,
--    global slug), per the counts explained in the header note above. Skips a
--    slug already taken by any existing row (e.g. an admin's).
-- ===========================================================================

-- Web Development (Flask, Django, FastAPI) — no coding problems (see header note for why)

-- Testing — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'real-world-development-practices/testing')
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-py-testing-1', null::text, $ww196$Test a Square Function$ww196$, 'Easy', 'py-testing-test-a-square-function',
   $ww197$Write and test a function square(n) that returns n ** 2, checking both a positive and a negative input — following pytest's plain-assert style.

**Why not run real pytest?** an automated judge grades exact program output, and pytest's own test-runner output includes non-deterministic timing (e.g. "3 passed in 0.02s") — so instead, write the assertions directly in the script and print a fixed summary once they all hold, which is exactly what a passing pytest run means in spirit.

**Approach:** define square(n), then use plain assert statements (pytest style) to check it against both given inputs, printing a summary once both checks pass.

**Input:** Two lines: a positive test input a, and a negative test input b.

**Output:** One line: `2/2 tests passed`.$ww197$,
   $ww198$[{"input": "5\n-3", "output": "2/2 tests passed"}]$ww198$::jsonb,
   $ww199$["-1000 <= a, b <= 1000"]$ww199$::jsonb,
   jsonb_build_object('python', $ww194$def square(n):
    # return n squared
    pass

a = int(input())
b = int(input())
assert square(a) == a ** 2
assert square(b) == b ** 2
print("2/2 tests passed")
$ww194$),
   $ww200$["square(n) just needs to return n ** 2.", "assert expression raises an AssertionError if the expression is False — exactly pytest's own checking mechanism, just without the framework.", "If both assert lines don't raise, execution reaches the print() line, meaning both tests passed."]$ww200$::jsonb,
   $ww201$[{"input": "5\n-3", "expected": "2/2 tests passed", "hidden": false}, {"input": "0\n100", "expected": "2/2 tests passed", "hidden": true}]$ww201$::jsonb,
   $ww202$square(n) returns n ** 2. The two assert statements are pytest-style checks — assert square(a) == a ** 2 — that silently do nothing if true and raise AssertionError if false. Reaching the final print() line is proof both checks passed, mirroring what a green pytest run means.$ww202$,
   jsonb_build_object('python', $ww195$def square(n):
    return n ** 2

a = int(input())
b = int(input())
assert square(a) == a ** 2
assert square(b) == b ** 2
print("2/2 tests passed")
$ww195$),
   array['python'], 'published', false, 0),
  ('cp-py-testing-2', null::text, $ww205$Test Exception Raising$ww205$, 'Medium', 'py-testing-test-exception-raising',
   $ww206$Write a function divide(a, b) that raises a ValueError when b is 0, then write a test that confirms the exception is actually raised — following pytest.raises()'s pattern using a plain try/except.

**Approach:** implement divide(a, b) to raise ValueError("Cannot divide by zero") when b == 0. Then call it inside a try block; if the ValueError is caught, the test passed.

**Input:** Two lines: a, then b (b will be 0).

**Output:** One line: `Test passed: ValueError raised as expected` (or `FAIL: no exception raised` if divide() doesn't raise correctly).$ww206$,
   $ww207$[{"input": "10\n0", "output": "Test passed: ValueError raised as expected"}]$ww207$::jsonb,
   $ww208$["b is always 0 in this problem."]$ww208$::jsonb,
   jsonb_build_object('python', $ww203$def divide(a, b):
    # raise ValueError("Cannot divide by zero") when b is 0, otherwise return a / b
    pass

a = int(input())
b = int(input())
try:
    divide(a, b)
    print("FAIL: no exception raised")
except ValueError:
    print("Test passed: ValueError raised as expected")
$ww203$),
   $ww209$["raise ValueError(\"...\") inside divide() is what pytest.raises(ValueError) would be checking for.", "The try/except here plays the same role pytest.raises() plays — catching the expected exception and confirming it happened.", "If divide() returns normally instead of raising, the test correctly reports FAIL."]$ww209$::jsonb,
   $ww210$[{"input": "10\n0", "expected": "Test passed: ValueError raised as expected", "hidden": false}, {"input": "20\n0", "expected": "Test passed: ValueError raised as expected", "hidden": true}]$ww210$::jsonb,
   $ww211$divide(a, b) raises ValueError("Cannot divide by zero") whenever b is 0. The surrounding try/except plays the role of pytest.raises(ValueError): if the exception fires, the except block confirms the test passed; if divide() somehow returns normally, the code right after the call prints the FAIL message instead.$ww211$,
   jsonb_build_object('python', $ww204$def divide(a, b):
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b

a = int(input())
b = int(input())
try:
    divide(a, b)
    print("FAIL: no exception raised")
except ValueError:
    print("Test passed: ValueError raised as expected")
$ww204$),
   array['python'], 'published', false, 1),
  ('cp-py-testing-3', null::text, $ww214$Fixture-Based List Tests$ww214$, 'Easy', 'py-testing-fixture-based-list-tests',
   $ww215$Write a fixture-style function sample_numbers() that provides a list of numbers, then use it in two separate checks: one testing the sum, one testing the length — mirroring pytest's @pytest.fixture pattern.

**Approach:** sample_numbers() returns the given list of numbers (this stands in for a @pytest.fixture, providing reusable data to multiple tests). Two separate checks then reuse it: one asserts the sum, one asserts the length.

**Input:** One line: 5 space-separated numbers.

**Output:** Two lines: `test_sum: PASS` then `test_length: PASS`.$ww215$,
   $ww216$[{"input": "10 20 30 40 50", "output": "test_sum: PASS\ntest_length: PASS"}]$ww216$::jsonb,
   $ww217$["Exactly 5 numbers are given."]$ww217$::jsonb,
   jsonb_build_object('python', $ww212$numbers = list(map(int, input().split()))

def sample_numbers():
    # this plays the role of a @pytest.fixture, returning the same data to every test that needs it
    return numbers

# test_sum: assert sum(sample_numbers()) equals the actual sum, then print "test_sum: PASS"
# test_length: assert len(sample_numbers()) equals the actual length, then print "test_length: PASS"
$ww212$),
   $ww218$["A fixture is just reusable setup code — here, sample_numbers() plays that role by returning the same list to any test that calls it.", "sum(sample_numbers()) and len(sample_numbers()) are the two things to check.", "Print each PASS message only after its assert has succeeded."]$ww218$::jsonb,
   $ww219$[{"input": "10 20 30 40 50", "expected": "test_sum: PASS\ntest_length: PASS", "hidden": false}, {"input": "1 2 3 4 5", "expected": "test_sum: PASS\ntest_length: PASS", "hidden": true}]$ww219$::jsonb,
   $ww220$sample_numbers() plays the role of a pytest fixture — a function that supplies the same reusable data to every test that needs it, instead of each test redefining its own list. test_sum checks sum(sample_numbers()) against the real sum; test_length checks len(sample_numbers()) against 5 — both printing PASS once their assertion holds, exactly like two separate test functions sharing one fixture would.$ww220$,
   jsonb_build_object('python', $ww213$numbers = list(map(int, input().split()))

def sample_numbers():
    return numbers

assert sum(sample_numbers()) == sum(numbers)
print("test_sum: PASS")
assert len(sample_numbers()) == len(numbers)
print("test_length: PASS")
$ww213$),
   array['python'], 'published', false, 2),
  ('cp-py-testing-4', null::text, $ww223$Mocked API Test$ww223$, 'Medium', 'py-testing-mocked-api-test',
   $ww224$Write a test using unittest.mock for a function that depends on an external API call, simulating a successful response without making a real network call.

**Approach:** get_weather_description(weather_api_call) calls whatever function it's given and reads a "condition" field from the result. Instead of a real API, pass in a MagicMock configured to return a fixed dictionary — exactly what unittest.mock.patch would set up, just constructed directly here.

**Input:** One line: the weather condition to simulate (e.g. sunny).

**Output:** One line: `Test passed: The weather is <condition>`.$ww224$,
   $ww225$[{"input": "sunny", "output": "Test passed: The weather is sunny"}]$ww225$::jsonb,
   $ww226$["1 <= length of condition <= 50"]$ww226$::jsonb,
   jsonb_build_object('python', $ww221$from unittest.mock import MagicMock

def get_weather_description(weather_api_call):
    data = weather_api_call()
    return f"The weather is {data['condition']}"

condition = input()

# create a MagicMock that returns {"condition": condition} when called, pass it to get_weather_description,
# assert the result is correct, then print "Test passed: <result>"
$ww221$),
   $ww227$["MagicMock(return_value={\"condition\": condition}) creates a fake, callable stand-in that returns exactly that dictionary whenever it's called.", "Pass the mock directly into get_weather_description(mock_api) — the function has no idea it isn't a real API call.", "assert result == f\"The weather is {condition}\" confirms the function processed the mocked data correctly."]$ww227$::jsonb,
   $ww228$[{"input": "sunny", "expected": "Test passed: The weather is sunny", "hidden": false}, {"input": "rainy", "expected": "Test passed: The weather is rainy", "hidden": true}]$ww228$::jsonb,
   $ww229$MagicMock(return_value={"condition": condition}) builds a fake stand-in for the real weather API — calling it returns the fixed dictionary you configured, with no network involved. Passing that mock into get_weather_description() exercises the function's real logic (reading data['condition'] and formatting the message) completely independently of whether any real API exists — exactly what mocking is for.$ww229$,
   jsonb_build_object('python', $ww222$from unittest.mock import MagicMock

def get_weather_description(weather_api_call):
    data = weather_api_call()
    return f"The weather is {data['condition']}"

condition = input()
mock_api = MagicMock(return_value={"condition": condition})
result = get_weather_description(mock_api)
assert result == f"The weather is {condition}"
print(f"Test passed: {result}")
$ww222$),
   array['python'], 'published', false, 3)
) as v(id, topic_id, title, difficulty, slug, description,
       examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
       supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- Debugging & Logging — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'real-world-development-practices/debugging-and-logging')
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-py-debugging-logging-1', null::text, $ww232$Configured File Logger$ww232$, 'Medium', 'py-debugging-logging-configured-file-logger',
   $ww233$Configure logging to write to a file app.log (without a timestamp in the format, so the output stays exactly reproducible), then log one message at each of the 5 severity levels, and print back what actually landed in the file.

**Why no timestamp?** including %(asctime)s would make the file's content different every time it runs (down to the millisecond), which an exact-match judge can never grade — so this problem uses a format of just the level name and the message, which the notes themselves show is fully configurable.

**Approach:** logging.basicConfig(filename="app.log", level=<threshold>, format="%(levelname)s - %(message)s"), log one message at each level, then read the file back and print its contents — only messages at or above the configured threshold should actually appear.

**Input:** One line: the threshold level name (one of DEBUG, INFO, WARNING, ERROR, CRITICAL).

**Output:** The contents of app.log — one line per message at or above the given threshold, in level order.$ww233$,
   $ww234$[{"input": "WARNING", "output": "WARNING - Warning message\nERROR - Error message\nCRITICAL - Critical message"}]$ww234$::jsonb,
   $ww235$["threshold is always one of DEBUG, INFO, WARNING, ERROR, CRITICAL."]$ww235$::jsonb,
   jsonb_build_object('python', $ww230$import logging

threshold = input().strip()
logging.basicConfig(filename="app.log", level=getattr(logging, threshold),
                     format="%(levelname)s - %(message)s")

logging.debug("Debug message")
logging.info("Info message")
logging.warning("Warning message")
logging.error("Error message")
logging.critical("Critical message")

# read app.log back and print its contents
$ww230$),
   $ww236$["getattr(logging, threshold) converts the threshold TEXT (like \"WARNING\") into the actual logging.WARNING constant.", "Only messages at the configured level or more severe are actually written to the file — everything below the threshold is silently dropped.", "Reopen app.log in read mode after logging, and print its full content."]$ww236$::jsonb,
   $ww237$[{"input": "WARNING", "expected": "WARNING - Warning message\nERROR - Error message\nCRITICAL - Critical message", "hidden": false}, {"input": "DEBUG", "expected": "DEBUG - Debug message\nINFO - Info message\nWARNING - Warning message\nERROR - Error message\nCRITICAL - Critical message", "hidden": true}]$ww237$::jsonb,
   $ww238$logging.basicConfig(filename="app.log", level=..., format="%(levelname)s - %(message)s") routes every logging call into the file, formatted as just the level name and message (no timestamp, so the output stays exactly reproducible). Only messages at or above the configured threshold are actually written — five logging calls, one per level, then reading the file back shows exactly which of them cleared the bar.$ww238$,
   jsonb_build_object('python', $ww231$import logging

threshold = input().strip()
logging.basicConfig(filename="app.log", level=getattr(logging, threshold),
                     format="%(levelname)s - %(message)s")

logging.debug("Debug message")
logging.info("Info message")
logging.warning("Warning message")
logging.error("Error message")
logging.critical("Critical message")

with open("app.log", "r") as f:
    print(f.read().rstrip("\n"))
$ww231$),
   array['python'], 'published', false, 0),
  ('cp-py-debugging-logging-2', null::text, $ww241$Logging-Enhanced Divide Function$ww241$, 'Easy', 'py-debugging-logging-logging-enhanced-divide-function',
   $ww242$Add logging (INFO for a successful division, ERROR for a failed one) to a function that divides two numbers, replacing what would otherwise be print() statements.

**Approach:** configure logging to print to the console (stdout) at INFO level, then have safe_divide(a, b) log an ERROR and return None when b is 0, or log an INFO message with the result otherwise.

**Input:** Two lines: a, then b.

**Output:** One line: the logged INFO message if b != 0, or the logged ERROR message if b == 0.$ww242$,
   $ww243$[{"input": "10\n2", "output": "INFO - Divided 10 by 2 = 5.0"}]$ww243$::jsonb,
   $ww244$["-10^6 <= a, b <= 10^6"]$ww244$::jsonb,
   jsonb_build_object('python', $ww239$import logging, sys

logging.basicConfig(level=logging.INFO, format="%(levelname)s - %(message)s", stream=sys.stdout)

def safe_divide(a, b):
    # log ERROR and return None if b is 0; otherwise log INFO with the result and return it
    pass

a = int(input())
b = int(input())
safe_divide(a, b)
$ww239$),
   $ww245$["stream=sys.stdout in basicConfig is important — by default logging writes to stderr, which wouldn't show up as normal program output.", "logging.error(\"...\") and logging.info(\"...\") are the two calls this function needs, one per branch.", "The format \"%(levelname)s - %(message)s\" is what turns each log call into a line like \"INFO - ...\"."]$ww245$::jsonb,
   $ww246$[{"input": "10\n2", "expected": "INFO - Divided 10 by 2 = 5.0", "hidden": false}, {"input": "10\n0", "expected": "ERROR - Attempted division by zero", "hidden": true}]$ww246$::jsonb,
   $ww247$safe_divide checks b first: if it's 0, logging.error(...) records the failure and the function returns None; otherwise it computes the result and logging.info(...) records the successful operation. Configuring basicConfig with stream=sys.stdout (logging defaults to stderr otherwise) is what makes the log line show up as ordinary program output.$ww247$,
   jsonb_build_object('python', $ww240$import logging, sys

logging.basicConfig(level=logging.INFO, format="%(levelname)s - %(message)s", stream=sys.stdout)

def safe_divide(a, b):
    if b == 0:
        logging.error("Attempted division by zero")
        return None
    result = a / b
    logging.info(f"Divided {a} by {b} = {result}")
    return result

a = int(input())
b = int(input())
safe_divide(a, b)
$ww240$),
   array['python'], 'published', false, 1)
) as v(id, topic_id, title, difficulty, slug, description,
       examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
       supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- Git & GitHub — no coding problems (see header note for why)

-- Data Analysis (NumPy, Pandas, Matplotlib, Seaborn) — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'real-world-development-practices/data-analysis')
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-py-data-analysis-1', null::text, $ww250$NumPy Statistics$ww250$, 'Easy', 'py-data-analysis-numpy-statistics',
   $ww251$Create a NumPy array from the given numbers and print its mean, median, and standard deviation.

**Approach:** np.array(numbers) builds the array; np.mean(), np.median(), and np.std() compute each statistic directly.

**Input:** One line: 10 space-separated numbers.

**Output:** Three lines:
`Mean: <value>`
`Median: <value>`
`Standard Deviation: <value>`
each rounded to 2 decimal places.$ww251$,
   $ww252$[{"input": "23 45 12 67 34 89 21 45 33 56", "output": "Mean: 42.50\nMedian: 39.50\nStandard Deviation: 22.12"}]$ww252$::jsonb,
   $ww253$["Exactly 10 numbers are given."]$ww253$::jsonb,
   jsonb_build_object('python', $ww248$import numpy as np

numbers = list(map(float, input().split()))
arr = np.array(numbers)

# print Mean, Median, and Standard Deviation, each to 2 decimal places
$ww248$),
   $ww254$["np.mean(arr), np.median(arr), and np.std(arr) compute each statistic in one call.", "Format every value with :.2f so results stay consistent regardless of how many decimal places NumPy computes internally."]$ww254$::jsonb,
   $ww255$[{"input": "23 45 12 67 34 89 21 45 33 56", "expected": "Mean: 42.50\nMedian: 39.50\nStandard Deviation: 22.12", "hidden": false}]$ww255$::jsonb,
   $ww256$np.array(numbers) converts the input into a NumPy array, and np.mean()/np.median()/np.std() compute each statistic directly — no manual loop or formula needed, just the vectorized built-ins from the notes. Formatting each with :.2f keeps the output exact and reproducible.$ww256$,
   jsonb_build_object('python', $ww249$import numpy as np

numbers = list(map(float, input().split()))
arr = np.array(numbers)
print(f"Mean: {np.mean(arr):.2f}")
print(f"Median: {np.median(arr):.2f}")
print(f"Standard Deviation: {np.std(arr):.2f}")
$ww249$),
   array['python'], 'published', false, 0),
  ('cp-py-data-analysis-2', null::text, $ww259$Filter and Sort a DataFrame$ww259$, 'Medium', 'py-data-analysis-filter-and-sort-dataframe',
   $ww260$Given a DataFrame of employees (name, department, salary), filter to show only those earning above 50000, sorted by salary in descending order.

**Approach:** build the DataFrame from the given rows, filter with a boolean condition (df["salary"] > 50000), then sort_values("salary", ascending=False).

**Input:** First line: the number of employees n. Next n lines: `name,department,salary`.

**Output:** One line per employee earning above 50000, sorted by salary descending, each as a tuple `(name, department, salary)`.$ww260$,
   $ww261$[{"input": "3\nAditi,CS,60000\nRohan,AI,45000\nZara,CS,72000", "output": "('Zara', 'CS', 72000)\n('Aditi', 'CS', 60000)"}]$ww261$::jsonb,
   $ww262$["1 <= n <= 1000"]$ww262$::jsonb,
   jsonb_build_object('python', $ww257$import pandas as pd

n = int(input())
rows = []
for _ in range(n):
    name, dept, salary = input().split(",")
    rows.append((name, dept, int(salary)))
df = pd.DataFrame(rows, columns=["name", "department", "salary"])

# filter to salary > 50000, sort by salary descending, print each row as a tuple
$ww257$),
   $ww263$["df[df[\"salary\"] > 50000] keeps only the rows where the condition is True.", ".sort_values(\"salary\", ascending=False) sorts the filtered result from highest to lowest salary.", "df.itertuples(index=False) lets you loop over rows as plain tuples, ready to print directly."]$ww263$::jsonb,
   $ww264$[{"input": "3\nAditi,CS,60000\nRohan,AI,45000\nZara,CS,72000", "expected": "('Zara', 'CS', 72000)\n('Aditi', 'CS', 60000)", "hidden": false}]$ww264$::jsonb,
   $ww265$df[df["salary"] > 50000] filters down to just the employees earning above 50000, and .sort_values("salary", ascending=False) orders what's left from highest to lowest. Looping over the result with itertuples(index=False) and printing each one gives exactly the required (name, department, salary) rows, in the correct order.$ww265$,
   jsonb_build_object('python', $ww258$import pandas as pd

n = int(input())
rows = []
for _ in range(n):
    name, dept, salary = input().split(",")
    rows.append((name, dept, int(salary)))
df = pd.DataFrame(rows, columns=["name", "department", "salary"])

filtered = df[df["salary"] > 50000].sort_values("salary", ascending=False)
for row in filtered.itertuples(index=False):
    print((row.name, row.department, row.salary))
$ww258$),
   array['python'], 'published', false, 1),
  ('cp-py-data-analysis-3', null::text, $ww268$Group Sales by Region$ww268$, 'Medium', 'py-data-analysis-group-sales-by-region',
   $ww269$Given sales data with region and amount columns, group by region and calculate the total sales per region.

**Approach:** build the DataFrame, then df.groupby("region")["amount"].sum(), ordered by region name for a predictable result.

**Input:** First line: the number of sales records n. Next n lines: `region,amount`.

**Output:** One line per region: a tuple `(region, total)`, ordered alphabetically by region.$ww269$,
   $ww270$[{"input": "3\nNorth,100\nSouth,200\nNorth,150", "output": "('North', 250)\n('South', 200)"}]$ww270$::jsonb,
   $ww271$["1 <= n <= 1000"]$ww271$::jsonb,
   jsonb_build_object('python', $ww266$import pandas as pd

n = int(input())
rows = []
for _ in range(n):
    region, amount = input().split(",")
    rows.append((region, int(amount)))
df = pd.DataFrame(rows, columns=["region", "amount"])

# group by region, sum amount, print each (region, total) in alphabetical order
$ww266$),
   $ww272$["df.groupby(\"region\")[\"amount\"].sum() adds up amount within each region group, directly parallel to SQL's GROUP BY.", "The result is a Series indexed by region — sorting it by index keeps the printed order predictable.", "result.items() lets you loop over (region, total) pairs."]$ww272$::jsonb,
   $ww273$[{"input": "3\nNorth,100\nSouth,200\nNorth,150", "expected": "('North', 250)\n('South', 200)", "hidden": false}]$ww273$::jsonb,
   $ww274$df.groupby("region")["amount"].sum() collapses all rows sharing the same region into one total each — the Pandas equivalent of SQL's GROUP BY + SUM(). Sorting the result by region (its index) before printing keeps the output in a predictable, repeatable order regardless of the input's original row order.$ww274$,
   jsonb_build_object('python', $ww267$import pandas as pd

n = int(input())
rows = []
for _ in range(n):
    region, amount = input().split(",")
    rows.append((region, int(amount)))
df = pd.DataFrame(rows, columns=["region", "amount"])

result = df.groupby("region")["amount"].sum().sort_index()
for region, total in result.items():
    print((region, total))
$ww267$),
   array['python'], 'published', false, 2),
  ('cp-py-data-analysis-4', null::text, $ww277$Average Marks by Subject$ww277$, 'Medium', 'py-data-analysis-average-marks-by-subject',
   $ww278$Given a DataFrame of student marks across 3 subjects, calculate the class average for each subject.

**Why not the chart?** the notes visualize this with a Seaborn bar chart, but an automated judge can only grade text output, not a rendered image — this problem tests the underlying data computation (the class average per subject) that would actually feed that chart.

**Approach:** build a DataFrame with maths/science/english columns, then take the mean of each column.

**Input:** First line: the number of students n. Next n lines: `maths,science,english` scores.

**Output:** Three lines: `maths: <avg>`, `science: <avg>`, `english: <avg>`, each to 2 decimal places.$ww278$,
   $ww279$[{"input": "5\n85,78,90\n45,55,60\n92,88,85\n38,42,50\n76,81,70", "output": "maths: 67.20\nscience: 68.80\nenglish: 71.00"}]$ww279$::jsonb,
   $ww280$["1 <= n <= 1000"]$ww280$::jsonb,
   jsonb_build_object('python', $ww275$import pandas as pd

n = int(input())
rows = []
for _ in range(n):
    maths, science, english = map(int, input().split(","))
    rows.append((maths, science, english))
df = pd.DataFrame(rows, columns=["maths", "science", "english"])

# compute and print the class average for each subject, 2 decimal places
$ww275$),
   $ww281$["df[[\"maths\", \"science\", \"english\"]].mean() computes the average of each column at once, returning one value per subject.", "Loop over the three subject names in order and format each average with :.2f."]$ww281$::jsonb,
   $ww282$[{"input": "5\n85,78,90\n45,55,60\n92,88,85\n38,42,50\n76,81,70", "expected": "maths: 67.20\nscience: 68.80\nenglish: 71.00", "hidden": false}]$ww282$::jsonb,
   $ww283$df[["maths", "science", "english"]].mean() computes the average down each column — the class average for each subject — in one call, no manual loop needed. This is exactly the numbers the notes' own sns.barplot() would visualize; printing them directly is the text-gradable equivalent of that chart.$ww283$,
   jsonb_build_object('python', $ww276$import pandas as pd

n = int(input())
rows = []
for _ in range(n):
    maths, science, english = map(int, input().split(","))
    rows.append((maths, science, english))
df = pd.DataFrame(rows, columns=["maths", "science", "english"])

averages = df[["maths", "science", "english"]].mean()
for subject in ["maths", "science", "english"]:
    print(f"{subject}: {averages[subject]:.2f}")
$ww276$),
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
   where source_kind = 'python_tutorial' and source_ref like 'real-world-development-practices/%';
  if v_topics <> 5 then raise exception 'validation: expected 5 real-world-development-practices topics, found %', v_topics; end if;

  select count(*) into v_tests from public.practice_tests where id in ('pt-py-web-development', 'pt-py-testing', 'pt-py-debugging-logging', 'pt-py-git-github', 'pt-py-data-analysis');
  if v_tests <> 5 then raise exception 'validation: expected 5 new python topic mock tests, found %', v_tests; end if;

  select count(*) into v_bad_tests from public.practice_tests
   where id in ('pt-py-web-development', 'pt-py-testing', 'pt-py-debugging-logging', 'pt-py-git-github', 'pt-py-data-analysis')
     and (question_count <> 10 or duration_minutes <> 10);
  if v_bad_tests > 0 then raise exception 'validation: % new python mock tests do not have 10 questions / 10 minute duration', v_bad_tests; end if;

  select count(*) into v_questions from public.test_questions where test_id in ('pt-py-web-development', 'pt-py-testing', 'pt-py-debugging-logging', 'pt-py-git-github', 'pt-py-data-analysis');
  if v_questions <> 50 then raise exception 'validation: expected 50 new python MCQ rows (5 x 10), found %', v_questions; end if;

  select count(*) into v_problems from public.dsa_problems where id like 'cp-py-testing-%' or id like 'cp-py-debugging-logging-%' or id like 'cp-py-data-analysis-%';
  if v_problems <> 10 then raise exception 'validation: expected 10 new python coding problems, found %', v_problems; end if;

  raise notice '0053 OK: Python Tutorial Real-World Practices — 5 topics, 5 mock tests (50 MCQs), 10 coding problems (web-development and git-github have none by design).';
end $$;

notify pgrst, 'reload schema';
