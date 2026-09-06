-- admin-panel/supabase/migrations/031_seed_python_tutorial_automation_ai.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: mobile-app/supabase/migrations/0054_seed_python_tutorial_automation_ai.sql ; apply either, the other is a guarded no-op.
--
-- ============================================================================
-- BODY — extend the "Python Tutorial" Learning grid with a 5th section: 5 more
-- topics (Web Scraping / Automation / Machine Learning / Deep Learning / AI &
-- Generative AI), each with full notes, a 10-question mock test (10-minute
-- timer), and 4 Python coding problems
-- (mobile 0054_seed_python_tutorial_automation_ai.sql ==
--  admin 031_seed_python_tutorial_automation_ai.sql below this header —
--  byte-identical, guarded, idempotent, additive.)
-- ============================================================================
-- Fifth content drop for the python-tutorial grid seeded by 0050/027 through
-- 0053/030. Adds a 5th learning_sections row "Automation, Data Science & AI"
-- and 5 more topics, following the exact same pattern — no schema, RLS, or
-- app-code change. Unlike the previous batch, every topic here keeps its full
-- 4 coding problems (none dropped to 0) — but two needed real redesign:
--   * Automation's PDF Merger uses `pypdf` + PdfWriter.append() instead of the
--     notes' PyPDF2 PdfMerger — PdfMerger has been REMOVED in modern pypdf
--     (5.0+; PyPDF2 on PyPI is now itself just a thin wrapper around pypdf), so
--     PdfWriter.append() is the forward-compatible choice regardless of which
--     exact package/version the judge sandbox has. The problem also creates its
--     own blank-page PDFs first (via PdfWriter.add_blank_page()), since a judge
--     run has no pre-existing report1.pdf/report2.pdf to merge.
--   * Deep Learning's 4 problems are a full reinterpretation, NOT a light
--     redesign — TensorFlow/PyTorch are large, GPU-oriented frameworks very
--     unlikely to be available in a lightweight code judge, and even a tiny
--     network's training introduces its own floating-point non-determinism
--     across environments/versions even with all seeds fixed (unlike sklearn,
--     which is comparatively deterministic given a fixed random_state). Instead
--     of dropping the topic's problems to 0, they were rebuilt as pure-Python,
--     zero-dependency exercises testing the same underlying math the notes
--     themselves present conceptually without a framework (activation
--     functions, a single neuron's forward pass, MSE loss, manual max pooling)
--     — genuine DL understanding, not literally the source's Keras/PyTorch
--     code. Flag this to the user distinctly from a source-had-no-section or
--     a dropped-to-0 case: this is a redesign that changes what's being typed,
--     not just how it's graded.
--   * Machine Learning's K-Means problem (Customer Segmentation) prints
--     customer-index GROUPINGS sorted by each group's smallest member, not raw
--     cluster label numbers — KMeans assigns arbitrary integer labels that
--     aren't guaranteed stable across environments even with a fixed
--     random_state, but which points end up grouped together is stable;
--     verified identical output across 5 repeated local runs.
--   * AI & Generative AI's "Robust LLM API Wrapper" problem passes in a mock
--     api_call_fn (success/timeout/connection-error scenarios) instead of a
--     real network call — same pattern as the Testing chapter's MagicMock-based
--     mocked API test and the earlier APIs & HTTP redesigns.
--   * Its other 3 AI & Generative AI problems (cosine similarity, conversation
--     history builder, keyword FAQ matcher) and all 4 Web Scraping problems
--     port directly — the source's own examples already used local/hardcoded
--     data with no live network dependency.
-- ----------------------------------------------------------------------------

-- ---- ordering guard -----------------------------------------------------
do $guard$
begin
  if to_regclass('public.learning_grids') is null then
    raise exception '0054/031: learning_* not found — apply 0042_learning_management.sql (admin 019) first.';
  end if;
  if to_regprocedure('public.learning_topic_practice(text, text, text)') is null then
    raise exception '0054/031: apply 0048_topic_practice.sql (admin 025) first.';
  end if;
  if not exists (select 1 from public.learning_grids where lower(slug) = 'python-tutorial') then
    raise exception '0054/031: python-tutorial grid not found — apply 0050_seed_python_tutorial_content.sql (admin 027) first.';
  end if;
end
$guard$;

-- ===========================================================================
-- 2. SECTION — 5th module for the existing python-tutorial grid.
-- ===========================================================================
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial')
insert into public.learning_sections
  (grid_id, name, slug, description, sort_order, status, show_on_website, show_on_mobile)
select g.id, $vv1$Automation, Data Science & AI$vv1$, $vv2$automation-data-science-ai$vv2$, $vv3$Web Scraping, Automation, Machine Learning, Deep Learning, and AI & Generative AI — applying Python to extract data, automate work, and build intelligent systems.$vv3$, 50,
  'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, description = excluded.description,
  sort_order = excluded.sort_order, updated_at = now();

-- ===========================================================================
-- 3. TOPICS + CONTENT — 5 topics, one full notes block each.
-- ===========================================================================

-- Web Scraping
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = 'automation-data-science-ai'),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $vv4$Web Scraping$vv4$, $vv5$web-scraping$vv5$, $vv6$Extracting data from HTML with requests + BeautifulSoup — find()/find_all(), CSS selectors, pagination — plus when a static parser isn't enough and Selenium's real-browser automation is needed, and responsible/legal scraping practices.$vv6$, 21,
    'published', true, true, 'python_tutorial', $vv7$automation-data-science-ai/web-scraping$vv7$
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
select up_topic.id, '', $vv8$Not every website offers a convenient API. Web scraping is the technique of extracting data directly from web pages — reading their HTML and pulling out exactly the information you need, programmatically.

---

## 1. What is Web Scraping?

### What is it?

Web scraping means writing a program that automatically downloads and reads web pages, extracting specific data from their HTML structure.

> **Definition:** Web scraping is the automated process of extracting data from websites by parsing their HTML content.

### Why do we use it?

- Collecting data (prices, reviews, listings) when no official API exists.
- Monitoring changes on a page over time (price tracking, job listings).
- Building datasets for research or analysis from publicly available web content.

---

## 2. HTML Basics (Quick Recap for Scraping)

### What is it?

HTML (HyperText Markup Language) structures every webpage using **tags** — and scraping means reading this structure to find the data you want.

### Simple Example

```html
<html>
<body>
    <div class="product">
        <h2 class="title">Wireless Headphones</h2>
        <span class="price">$49.99</span>
    </div>
    <div class="product">
        <h2 class="title">Bluetooth Speaker</h2>
        <span class="price">$29.99</span>
    </div>
</body>
</html>
```

### Important Points

- Tags (`<div>`, `<h2>`, `<span>`) define structure.
- `class` and `id` attributes are how scrapers (and CSS) target specific elements — this is exactly what you'll search for when scraping.

---

## 3. CSS Selectors (Quick Reference for Scraping)

### What is it?

CSS selectors are patterns used to target specific HTML elements — the exact same syntax used to style web pages is also how scraping tools locate the data you want.

| Selector | Matches |
|---|---|
| `div` | All `<div>` elements |
| `.classname` | Elements with `class="classname"` |
| `#idname` | The element with `id="idname"` |
| `div.product` | `<div>` elements with class `product` |
| `div .price` | Any element with class `price`, inside a `<div>` |

---

## 4. `requests` + BeautifulSoup

### What is it?

`requests` (covered in the APIs & HTTP file) downloads a webpage's raw HTML. **BeautifulSoup** then parses that HTML, letting you search and extract exactly the data you need.

```bash
pip install requests beautifulsoup4
```

### Simple Example

```python
import requests
from bs4 import BeautifulSoup

html = """
<html>
<body>
    <div class="product">
        <h2 class="title">Wireless Headphones</h2>
        <span class="price">$49.99</span>
    </div>
    <div class="product">
        <h2 class="title">Bluetooth Speaker</h2>
        <span class="price">$29.99</span>
    </div>
</body>
</html>
"""

soup = BeautifulSoup(html, "html.parser")

products = soup.find_all("div", class_="product")

for product in products:
    title = product.find("h2", class_="title").text
    price = product.find("span", class_="price").text
    print(f"{title}: {price}")
```

Output:
```
Wireless Headphones: $49.99
Bluetooth Speaker: $29.99
```

### Explanation of the Code

- `BeautifulSoup(html, "html.parser")` parses the raw HTML into a navigable structure.
- `.find_all("div", class_="product")` finds **every** matching element (returns a list). `.find()` finds only the **first** matching element.
- `.text` extracts just the visible text content, stripping away the surrounding HTML tags.

### Using CSS Selectors Directly

```python
titles = soup.select("div.product .title")
for title in titles:
    print(title.text)
```

**Explanation:** `.select()` lets you use familiar CSS selector syntax directly, often more concise than chaining multiple `.find()` calls.

### Scraping a Real Webpage

```python
import requests
from bs4 import BeautifulSoup

url = "https://example.com"
response = requests.get(url, timeout=5)
soup = BeautifulSoup(response.text, "html.parser")

heading = soup.find("h1")
print(heading.text)
```

### Extracting Attributes (like Links)

```python
links = soup.find_all("a")
for link in links:
    print(link.get("href"))   # extracts the URL from href="..."
```

### Common Mistakes

- Forgetting websites change their HTML structure over time, potentially breaking a scraper that was working fine last week.
- Not checking `response.status_code` before parsing — trying to parse an error page's HTML wastes time and produces wrong results.
- Scraping data that changes dynamically via JavaScript **after** the initial page load — `requests` only gets the raw initial HTML, missing anything added afterward (see Selenium, below).

### Important Points

- `.find()` gets the first match; `.find_all()` gets every match, as a list.
- `.select()` lets you use CSS selector syntax for more concise searches.

### Practice

1. Given a block of sample HTML with 3 products (each with a title and price), extract and print all titles using `find_all()`.

---

## 5. Handling Pagination

### What is it?

Many websites split listings across multiple pages ("Page 1, 2, 3..."). Scraping the full dataset requires looping through each page.

### Simple Example

```python
import requests
from bs4 import BeautifulSoup

all_titles = []

for page in range(1, 4):   # scrape pages 1 to 3
    url = f"https://example.com/products?page={page}"
    response = requests.get(url, timeout=5)
    soup = BeautifulSoup(response.text, "html.parser")

    titles = soup.select(".title")
    for title in titles:
        all_titles.append(title.text)

print(all_titles)
```

**Explanation:** The loop constructs a new URL for each page number, following whatever URL pattern the target website uses for pagination (this varies from site to site — check the actual URL structure by browsing manually first).

### Important Points

- Always check what pattern a site uses for pagination before writing a scraper loop (`?page=2`, `/page/2`, etc. — it varies).
- Add a short delay (`time.sleep()`) between requests to avoid overwhelming the server (see Responsible Scraping, below).

---

## 6. Dynamic Websites and Selenium

### What is it?

Some websites load their content **after** the initial page load, using JavaScript (e.g., infinite-scroll pages, or data that only appears after clicking a button). `requests` + BeautifulSoup only sees the **initial** HTML — they can't run JavaScript. **Selenium** solves this by actually automating a real browser.

```bash
pip install selenium
```

### Simple Example

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
import time

driver = webdriver.Chrome()
driver.get("https://example.com")

time.sleep(2)   # give the page time to load JavaScript content

titles = driver.find_elements(By.CLASS_NAME, "title")
for title in titles:
    print(title.text)

driver.quit()
```

### Explanation of the Code

- `webdriver.Chrome()` opens an actual, automated Chrome browser window.
- `driver.get(url)` navigates to the page, and — crucially — **executes any JavaScript** on it, just like a real user's browser would.
- `find_elements(By.CLASS_NAME, "title")` searches the fully-rendered page (after JavaScript has run), unlike `requests`, which only ever sees the initial raw HTML.

### Clicking Buttons and Waiting

```python
button = driver.find_element(By.ID, "load-more")
button.click()
time.sleep(2)   # wait for new content to load after the click
```

### Comparison Table — `requests`+BeautifulSoup vs Selenium

| | `requests` + BeautifulSoup | Selenium |
|---|---|---|
| Runs JavaScript | No | Yes (real browser automation) |
| Speed | Fast | Slower (controls a real browser) |
| Resource usage | Light | Heavier |
| Best for | Static HTML pages | Dynamic, JavaScript-heavy pages |

### Common Mistakes

- Using `requests`/BeautifulSoup on a JavaScript-heavy site and getting empty or incomplete results — a common source of scraping confusion.
- Using `time.sleep()` with a fixed, arbitrary delay instead of properly waiting for a specific element to load (Selenium offers more robust "explicit wait" tools for production use).
- Forgetting `driver.quit()`, leaving browser processes running in the background.

### Important Points

- Use `requests` + BeautifulSoup for simple, static pages — it's faster and lighter.
- Use Selenium only when content genuinely requires JavaScript execution or interaction (clicking, scrolling) to appear.

---

## 7. Saving Scraped Results

### What is it?

Once data is extracted, it's typically saved to a CSV or JSON file for later analysis (using the File Handling techniques from earlier in this course).

### Simple Example

```python
import csv

products = [
    {"title": "Wireless Headphones", "price": "$49.99"},
    {"title": "Bluetooth Speaker", "price": "$29.99"}
]

with open("products.csv", "w", newline="") as file:
    writer = csv.DictWriter(file, fieldnames=["title", "price"])
    writer.writeheader()
    writer.writerows(products)
```

---

## 8. Responsible and Legal Scraping Practices

### What is it?

Scraping isn't automatically legal or acceptable just because data is publicly visible — responsible scraping means respecting websites' rules and not overloading their servers.

### Key Practices

- **Check `robots.txt`** — most sites have a file at `example.com/robots.txt` stating which parts of the site scrapers are allowed (or not allowed) to access.
- **Read the Terms of Service** — some sites explicitly prohibit scraping; ignoring this can have legal consequences.
- **Rate-limit your requests** — add delays between requests (`time.sleep()`) so you don't overload the server or get your IP address blocked.
- **Identify yourself** — some scrapers set a descriptive `User-Agent` header rather than pretending to be a regular browser.
- **Avoid scraping personal/private data** — be especially careful with anything involving personal information, which may have legal privacy implications (like GDPR).
- **Prefer an official API when one exists** — it's more stable, reliable, and explicitly permitted.

### Important Points

- Always check `robots.txt` and the site's Terms of Service before scraping.
- Never hammer a server with rapid, unthrottled requests — this can be seen as a denial-of-service attack, and can get your IP address banned.

---

## Common Beginner Mistakes — Summary for This Section

- Not checking `response.status_code` before parsing.
- Assuming `requests` can see JavaScript-rendered content — it can't; use Selenium for that.
- Scraping too aggressively without delays, risking IP bans or server overload.
- Ignoring `robots.txt` and a site's Terms of Service.

---

## Cheat Sheet — Web Scraping

```python
import requests
from bs4 import BeautifulSoup

response = requests.get(url, timeout=5)
soup = BeautifulSoup(response.text, "html.parser")

soup.find("div")                     # first match
soup.find_all("div", class_="name")   # all matches
soup.select("div.name .title")        # CSS selector syntax
element.text                           # visible text
element.get("href")                    # attribute value

# Selenium (for JavaScript-heavy sites)
from selenium import webdriver
from selenium.webdriver.common.by import By
driver = webdriver.Chrome()
driver.get(url)
driver.find_elements(By.CLASS_NAME, "name")
driver.quit()
```

---

## Interview Questions

**Q1. What is the difference between `requests`/BeautifulSoup and Selenium?**
Answer: `requests`/BeautifulSoup only downloads and parses the initial, static HTML of a page. Selenium automates a real browser, which can execute JavaScript and interact with dynamic content (clicking, scrolling) that only appears after the initial load.

**Q2. What is `robots.txt`, and why does it matter for scraping?**
Answer: A file websites publish stating which parts of the site automated scrapers are allowed or disallowed to access — responsible scrapers check and respect it before scraping a site.

**Q3. What is the difference between `.find()` and `.find_all()` in BeautifulSoup?**
Answer: `.find()` returns only the first matching element. `.find_all()` returns a list of every matching element.

**Q4. Why is rate-limiting important when scraping?**
Answer: Sending requests too rapidly can overload the target server, degrade its performance for real users, and often results in your IP address being blocked.

**Q5. When would you choose Selenium over `requests`/BeautifulSoup?**
Answer: When the needed content is loaded dynamically via JavaScript after the initial page load, or when the scraping process requires interacting with the page (clicking buttons, scrolling, filling forms).

---

## Practice Questions

**Beginner**
1. Given a sample HTML string with 3 items in `<li>` tags, extract all of them using `find_all()`.
2. Extract the text of the first `<h1>` tag from a sample HTML page.
3. Use `.select()` with a CSS selector to extract all elements with a specific class.
4. Extract all links (`href` values) from a sample HTML page containing several `<a>` tags.
5. Save a small list of scraped dictionaries to a CSV file.

**Intermediate**
1. Write a scraper that extracts product names and prices from a sample multi-product HTML page, and saves them to a CSV file.
2. Write a scraper that loops through 3 pages of a paginated sample URL structure, collecting all titles into one list.
3. Explain, in your own words (as a comment), why a scraper using `requests` might return incomplete data on a JavaScript-heavy website.
4. Write a Selenium script that opens a webpage, waits 2 seconds, and extracts all elements with a specific class name.
5. Check a real website's `robots.txt` file and summarize what it allows and disallows.

**Challenge**
1. Build a scraper that extracts book titles and prices from a public "scraping practice" website (many exist specifically for learning), handling pagination across multiple pages.
2. Write a Selenium script that clicks a "Load More" button on a sample dynamic page and then extracts the newly loaded content.
3. Design (in comments/pseudocode) a responsible scraping strategy for a hypothetical job-listings site, including rate-limiting, respecting `robots.txt`, and saving results incrementally to avoid data loss if the scraper crashes partway through.
$vv8$, 'markdown',
  jsonb_build_object('source', 'python_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'python_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Automation
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = 'automation-data-science-ai'),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $vv9$Automation$vv9$, $vv10$automation$vv10$, $vv11$Automating repetitive tasks with Python — file/folder automation (os, shutil), Excel automation with openpyxl, email automation with smtplib, PDF automation, and browser automation with Selenium.$vv11$, 22,
    'published', true, true, 'python_tutorial', $vv12$automation-data-science-ai/automation$vv12$
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
select up_topic.id, '', $vv13$One of Python's most practical everyday uses is automating boring, repetitive tasks — renaming hundreds of files, generating Excel reports, sending routine emails, or filling out the same web form repeatedly. This file covers the tools for exactly that.

---

## 1. What is Automation?

### What is it?

Automation means writing a program to perform a repetitive task automatically, instead of doing it manually every time.

### Why do we use it?

- **Saves time** — a task that takes an hour manually might run in seconds as a script.
- **Reduces errors** — automated tasks perform the exact same steps every time, without human slip-ups.
- **Frees you for more valuable work** — automating the boring parts of a job lets you focus on things that actually need human judgment.

### Real-World Example

A finance team manually copying data from 50 Excel files into one summary report every month could instead run a Python script that does it in seconds, every single month, without fail.

---

## 2. File and Folder Automation (`os` and `shutil`)

### What is it?

Python's built-in `os` module (introduced earlier) and `shutil` module let you create, move, copy, rename, and organize files and folders programmatically.

### Renaming Multiple Files

```python
import os

folder = "photos"

for index, filename in enumerate(os.listdir(folder)):
    old_path = os.path.join(folder, filename)
    extension = os.path.splitext(filename)[1]
    new_path = os.path.join(folder, f"photo_{index + 1}{extension}")
    os.rename(old_path, new_path)

print("All files renamed successfully.")
```

### Explanation of the Code

- `os.listdir(folder)` lists every file inside the folder.
- `os.path.splitext(filename)` splits a filename into its name and extension — e.g., `("vacation", ".jpg")` — so the original file type is preserved.
- `os.rename()` performs the actual rename, one file at a time, inside the loop.

### Organizing Files by Type

```python
import os
import shutil

folder = "downloads"

file_types = {
    ".pdf": "PDFs",
    ".jpg": "Images",
    ".png": "Images",
    ".docx": "Documents"
}

for filename in os.listdir(folder):
    extension = os.path.splitext(filename)[1].lower()
    if extension in file_types:
        target_folder = os.path.join(folder, file_types[extension])
        os.makedirs(target_folder, exist_ok=True)
        shutil.move(os.path.join(folder, filename), os.path.join(target_folder, filename))

print("Files organized by type.")
```

### Explanation of the Code

- `os.makedirs(target_folder, exist_ok=True)` creates the destination folder if it doesn't already exist — `exist_ok=True` prevents an error if it already does.
- `shutil.move()` moves the file into its correct type-based subfolder.

### Copying and Deleting

```python
import shutil
import os

shutil.copy("report.txt", "backup/report.txt")     # copy a single file
shutil.copytree("project", "project_backup")         # copy an entire folder

os.remove("old_file.txt")                              # delete a single file
shutil.rmtree("old_folder")                             # delete an entire folder (careful!)
```

### Common Mistakes

- Using `shutil.rmtree()` carelessly — it deletes an entire folder and everything inside it, with **no confirmation and no undo**.
- Forgetting `exist_ok=True` in `os.makedirs()`, causing an error if a folder already exists.

### Important Points

- Always test file automation scripts on a **copy** of your data first, especially anything involving deletion.
- `shutil` handles higher-level operations (copying/moving whole trees) that plain `os` doesn't cover as conveniently.

### Practice

1. Write a script that renames all files in a folder to include today's date as a prefix.

---

## 3. Excel Automation with `openpyxl`

### What is it?

`openpyxl` lets you create, read, and modify Excel `.xlsx` files directly from Python — useful for generating reports, extracting data, and bulk-editing spreadsheets.

```bash
pip install openpyxl
```

### Creating a New Excel File

```python
from openpyxl import Workbook

wb = Workbook()
sheet = wb.active
sheet.title = "Students"

sheet.append(["Name", "Age", "Course"])
sheet.append(["Aditi", 21, "Computer Science"])
sheet.append(["Rohan", 22, "Data Science"])

wb.save("students.xlsx")
```

### Reading an Existing Excel File

```python
from openpyxl import load_workbook

wb = load_workbook("students.xlsx")
sheet = wb.active

for row in sheet.iter_rows(values_only=True):
    print(row)
```

Output:
```
('Name', 'Age', 'Course')
('Aditi', 21, 'Computer Science')
('Rohan', 22, 'Data Science')
```

### Modifying Cells and Formatting

```python
from openpyxl import load_workbook
from openpyxl.styles import Font

wb = load_workbook("students.xlsx")
sheet = wb.active

sheet["A1"].font = Font(bold=True, size=14)   # bold the header
sheet["B2"] = 22                                # update a specific cell

wb.save("students.xlsx")
```

### Explanation of the Code

- `sheet.append([...])` adds a new row at the bottom, with each list item becoming one column's value.
- `sheet["A1"]` refers to a specific cell using standard spreadsheet notation (column letter + row number).
- `iter_rows(values_only=True)` loops through every row, returning just the plain values (without extra cell-object detail).

### Real-World Example

Automatically generating a weekly sales report by pulling data from a database and writing it into a nicely formatted Excel file, without any manual copy-pasting.

### Common Mistakes

- Forgetting `wb.save()` — without it, changes exist only in memory and are never actually written to the file.
- Confusing row/column numbering — `openpyxl` rows and columns are 1-indexed (starting at 1), unlike Python's usual 0-indexing.

### Practice

1. Create an Excel file with a list of 5 products and their prices, then read it back and print each row.

---

## 4. Email Automation

### What is it?

Python's built-in `smtplib` module lets you send emails programmatically — useful for automated notifications, reports, or alerts.

### Simple Example

```python
import smtplib
from email.mime.text import MIMEText

sender_email = "your_email@gmail.com"
sender_password = "your_app_password"   # NEVER hardcode real passwords in real code
receiver_email = "recipient@example.com"

message = MIMEText("This is an automated report generated by Python.")
message["Subject"] = "Weekly Report"
message["From"] = sender_email
message["To"] = receiver_email

with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
    server.login(sender_email, sender_password)
    server.send_message(message)

print("Email sent successfully!")
```

### Explanation of the Code

- `MIMEText(...)` builds the actual email content and required headers (subject, sender, recipient).
- `smtplib.SMTP_SSL(...)` connects securely to the email provider's server (here, Gmail's) to actually send the message.
- Using `with` ensures the connection is properly closed automatically once sending is complete.

### Common Mistakes

- **Never hardcode your real email password directly in code** — use environment variables (covered in the Security file) or an app-specific password.
- Forgetting that most email providers (like Gmail) require special setup (like an "app password") for programmatic access, rather than your normal login password.

### Important Points

- Always use environment variables for credentials, never plain text in your source code.
- Different email providers have slightly different SMTP server settings — check your provider's specific documentation.

---

## 5. PDF Automation (Brief Overview)

### What is it?

Python can also automate working with PDF files — merging, splitting, and extracting text — commonly using the `PyPDF2` library (a more complete PDF-handling walkthrough is available in the dedicated PDF documentation for your specific environment).

```bash
pip install PyPDF2
```

### Simple Example — Merging PDFs

```python
from PyPDF2 import PdfMerger

merger = PdfMerger()
merger.append("report1.pdf")
merger.append("report2.pdf")
merger.write("combined_report.pdf")
merger.close()
```

### Simple Example — Extracting Text

```python
from PyPDF2 import PdfReader

reader = PdfReader("report.pdf")
for page in reader.pages:
    print(page.extract_text())
```

### Important Points

- PDF automation is useful for combining multiple monthly reports into one file, or pulling specific data out of standardized PDF documents.

---

## 6. Browser Automation (Recap and Automation-Specific Use)

### What is it?

Beyond scraping (covered in the previous file), Selenium can automate real user actions in a browser — filling out forms, logging into websites, and clicking through multi-step workflows.

### Simple Example — Automated Form Filling

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
import time

driver = webdriver.Chrome()
driver.get("https://example.com/login")

driver.find_element(By.NAME, "username").send_keys("myusername")
driver.find_element(By.NAME, "password").send_keys("mypassword")
driver.find_element(By.ID, "login-button").click()

time.sleep(2)
print(driver.title)   # confirm we landed on the expected page after login

driver.quit()
```

### Explanation of the Code

- `.send_keys("...")` types text into a form field, exactly as a real user would.
- `.click()` simulates a mouse click on the located element.

### Real-World Example

Automating repetitive administrative tasks like submitting the same form data across many records, or automatically checking a website daily for a specific condition (like stock availability) and sending a notification.

### Common Mistakes

- Automating login/actions on websites whose Terms of Service explicitly prohibit automated access.
- Storing login credentials directly in scripts instead of using environment variables.

---

## Common Beginner Mistakes — Summary for This Section

- Using `shutil.rmtree()` without being absolutely certain of the target folder.
- Forgetting `wb.save()` after modifying an Excel file with `openpyxl`.
- Hardcoding email or website login credentials directly in automation scripts.
- Not testing automation scripts on sample/copy data before running them on real, important files.

---

## Cheat Sheet — Automation

```python
# Files & folders
import os, shutil
os.listdir(folder); os.rename(old, new)
os.makedirs(folder, exist_ok=True)
shutil.move(src, dst); shutil.copy(src, dst); shutil.rmtree(folder)

# Excel
from openpyxl import Workbook, load_workbook
wb = Workbook(); sheet = wb.active
sheet.append([...]); wb.save("file.xlsx")
wb = load_workbook("file.xlsx")

# Email
import smtplib
from email.mime.text import MIMEText
with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
    server.login(email, password)
    server.send_message(message)

# PDF
from PyPDF2 import PdfMerger, PdfReader

# Browser automation
from selenium import webdriver
driver.find_element(By.NAME, "field").send_keys("text")
driver.find_element(By.ID, "button").click()
```

---

## Interview Questions

**Q1. What is the difference between `os` and `shutil` in Python?**
Answer: `os` provides lower-level file/folder operations (listing, renaming, path handling). `shutil` provides higher-level operations, especially for copying and moving entire files or folder trees, and bulk deletion.

**Q2. What library is commonly used to automate Excel files in Python?**
Answer: `openpyxl`, which can create, read, and modify `.xlsx` files, including formatting.

**Q3. Why should credentials never be hardcoded in automation scripts?**
Answer: Hardcoded credentials in source code are a serious security risk — especially if the code is ever shared, committed to a public repository, or seen by unauthorized people. Environment variables are the safer standard practice.

**Q4. What is the danger of using `shutil.rmtree()`?**
Answer: It permanently deletes an entire folder and all its contents, with no confirmation prompt and no built-in way to undo it — a single mistake in the target path can cause significant, irreversible data loss.

**Q5. When would you use Selenium for automation rather than scraping?**
Answer: When automating actual user actions — like logging into a site, filling out and submitting forms, or navigating multi-step workflows — rather than just extracting data.

---

## Practice Questions

**Beginner**
1. Write a script that lists all files in a folder and prints their names and extensions.
2. Create an Excel file with 5 rows of sample data using `openpyxl`.
3. Write a script that creates a new folder if it doesn't already exist.
4. Write a script that copies a single file to a new location.
5. Write a script that reads an Excel file and prints the total number of rows.

**Intermediate**
1. Write a script that organizes all files in a folder into subfolders based on their file extension.
2. Write a script that reads data from a CSV file and writes it into a formatted Excel file using `openpyxl`.
3. Write a script that renames 10 sample files by adding a sequential number prefix.
4. Write a script (with placeholder credentials, never real ones) that sends an automated email with a report summary as the body.
5. Write a Selenium script that opens a webpage and automatically fills out a sample search form.

**Challenge**
1. Build a script that monitors a "downloads" folder and automatically organizes new files into type-based subfolders every time it runs.
2. Build a report generator that reads data from a SQLite database (from the Database Programming file) and writes a formatted Excel report.
3. Build an automation script that merges multiple PDF files in a folder into a single combined PDF, in filename order.
$vv13$, 'markdown',
  jsonb_build_object('source', 'python_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'python_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Machine Learning
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = 'automation-data-science-ai'),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $vv14$Machine Learning$vv14$, $vv15$machine-learning$vv15$, $vv16$ML fundamentals (supervised vs unsupervised, regression vs classification, features/labels, train/test split, evaluation, cross-validation) and the core Scikit-learn algorithms — Linear/Logistic Regression, Decision Trees, Random Forests, KNN, SVM, Naive Bayes, K-Means.$vv16$, 23,
    'published', true, true, 'python_tutorial', $vv17$automation-data-science-ai/machine-learning$vv17$
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
select up_topic.id, '', $vv18$Machine Learning (ML) is what lets software improve at a task by learning patterns from data, instead of following only explicitly hand-written rules. This file starts with the fundamental concepts every ML practitioner needs, then walks through the core algorithms using Python's most popular ML library: **Scikit-learn**.

```bash
pip install scikit-learn pandas numpy
```

---

## 1. AI vs ML vs Deep Learning

### What is it?

These three terms are related but not identical — understanding the distinction is a very common interview question.

> **Definition:** Artificial Intelligence is the broad field of making machines behave intelligently. Machine Learning is a subset of AI where machines learn patterns from data rather than following explicit rules. Deep Learning is a subset of ML using multi-layered neural networks.

### Comparison Table

| | Scope | Example |
|---|---|---|
| **AI** | The broadest field — any technique making machines act intelligently | A chess-playing program, a rule-based chatbot, a self-driving car |
| **ML** | A subset of AI — learning patterns from data | Predicting house prices from past sales data |
| **Deep Learning** | A subset of ML — using neural networks with many layers | Recognizing objects in photos, understanding speech |

**Explanation:** Every Deep Learning system is Machine Learning, and every Machine Learning system is AI — but not every AI system uses Machine Learning (some AI is purely rule-based), and not every ML system uses Deep Learning (many use simpler, non-neural-network algorithms, covered in this file).

---

## 2. Supervised vs Unsupervised Learning

### What is it?

- **Supervised learning** — the model learns from data that already has the "correct answers" (labels) attached, and learns to predict those labels for new data.
- **Unsupervised learning** — the model finds patterns or structure in data that has **no** labels at all.

> **Definition:** Supervised learning trains a model using labeled data (inputs paired with known correct outputs). Unsupervised learning finds hidden patterns in unlabeled data.

### Real-World Example

- **Supervised:** Given past house sales (size, location, **actual sale price**), predict the price of a new house. The "actual sale price" is the label the model learns from.
- **Unsupervised:** Given customer purchase data with **no predefined categories**, group customers into natural clusters based on similar buying behavior.

### Comparison Table

| | Supervised Learning | Unsupervised Learning |
|---|---|---|
| Data | Labeled (has known correct answers) | Unlabeled |
| Goal | Predict a specific outcome | Discover hidden structure/groups |
| Examples | Regression, Classification | Clustering |

---

## 3. Regression, Classification, and Clustering

### What is it?

- **Regression** — predicting a continuous numeric value (e.g., a price, a temperature, a score).
- **Classification** — predicting a category/class (e.g., spam or not spam, pass or fail).
- **Clustering** — grouping similar data points together, without predefined categories (unsupervised).

### Real-World Example

| Task | Type | Example |
|---|---|---|
| Predict a house's sale price | Regression | Numeric output ($350,000) |
| Predict if an email is spam | Classification | Category output (Spam / Not Spam) |
| Group customers by shopping behavior | Clustering | Discover unlabeled groups |

---

## 4. Features and Labels

### What is it?

- **Features** (also called inputs, or X) — the measurable properties used to make a prediction.
- **Label** (also called the target, or y) — the actual answer the model is trying to predict.

### Simple Example

Predicting a student's exam score based on hours studied:

| hours_studied (feature) | attendance_percent (feature) | exam_score (label) |
|---|---|---|
| 5 | 90 | 78 |
| 2 | 60 | 45 |
| 8 | 95 | 92 |

### Important Points

- Features are what you already know; the label is what you're trying to predict.
- In supervised learning, both features and labels are present in your training data.

---

## 5. Train/Test Split

### What is it?

Before training a model, data is split into a **training set** (used to teach the model) and a **testing set** (kept completely separate, used only to check how well the model performs on data it has never seen).

### Why do we use it?

If you test a model on the exact same data it was trained on, it could just be "memorizing" the answers rather than genuinely learning patterns — this gives a falsely optimistic sense of how well it actually works. Testing on unseen data reveals its **real** performance.

### Simple Example

```python
from sklearn.model_selection import train_test_split

X = [[5, 90], [2, 60], [8, 95], [4, 70], [9, 98], [1, 40]]   # features
y = [78, 45, 92, 65, 95, 30]                                    # labels

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print(len(X_train), len(X_test))   # e.g. 4 2 (80% train, 20% test)
```

**Explanation:** `test_size=0.2` reserves 20% of the data for testing. `random_state=42` ensures the split is reproducible — running the code again gives the exact same split, useful for consistent comparisons.

### Important Points

- A common split ratio is 80% training / 20% testing, though this can vary.
- Never evaluate a model's real-world performance using its own training data.

---

## 6. Model Evaluation

### What is it?

After training, you need metrics to measure how good the model's predictions actually are.

### For Regression

```python
from sklearn.metrics import mean_squared_error, r2_score

mse = mean_squared_error(y_test, predictions)
r2 = r2_score(y_test, predictions)
```

| Metric | Meaning |
|---|---|
| MSE (Mean Squared Error) | Average squared difference between predicted and actual values (lower is better) |
| R² Score | How much of the variation in the data the model explains (closer to 1 is better) |

### For Classification

```python
from sklearn.metrics import accuracy_score, precision_score, recall_score, confusion_matrix

accuracy = accuracy_score(y_test, predictions)
precision = precision_score(y_test, predictions)
recall = recall_score(y_test, predictions)
```

| Metric | Meaning |
|---|---|
| Accuracy | Percentage of correct predictions overall |
| Precision | Of everything predicted "positive," how much was actually correct |
| Recall | Of everything that was actually "positive," how much did the model correctly catch |

### Real-World Example

For a disease-detection model, **recall** matters enormously — missing an actual sick patient (a "false negative") is far more dangerous than a false alarm. Accuracy alone can be misleading, especially when one class is much rarer than the other.

### Important Points

- Accuracy alone can be misleading on imbalanced data (e.g., 99% "not spam" emails) — precision and recall give a fuller picture.
- Always choose evaluation metrics based on what actually matters for your specific real-world problem.

---

## 7. Cross-Validation

### What is it?

Instead of a single train/test split, cross-validation splits the data into multiple "folds," training and testing multiple times on different portions — giving a more reliable estimate of model performance.

### Simple Example — K-Fold Cross-Validation

```python
from sklearn.model_selection import cross_val_score
from sklearn.linear_model import LinearRegression

model = LinearRegression()
scores = cross_val_score(model, X, y, cv=5)   # 5-fold cross-validation

print(scores)
print("Average score:", scores.mean())
```

**Explanation:** `cv=5` splits the data into 5 equal parts; the model trains on 4 parts and tests on the remaining 1, repeating this process 5 times (each part gets a turn as the test set), then averages the results — reducing the chance that one lucky/unlucky split skews your evaluation.

### Important Points

- Cross-validation gives a more robust, reliable estimate of model performance than a single train/test split.
- Commonly used with 5 or 10 folds.

---

## 8. Feature Engineering (Brief Overview)

### What is it?

Feature engineering means creating, transforming, or selecting the features fed into a model to improve its performance — often the single most impactful part of a real ML project.

### Simple Example

```python
import pandas as pd

df = pd.DataFrame({"birth_year": [2000, 1995, 2003]})
df["age"] = 2026 - df["birth_year"]   # engineered feature: age is often more useful than raw birth year
```

### Important Points

- Good feature engineering often improves model performance more than switching to a fancier algorithm.
- Common techniques include scaling numeric features, encoding categorical variables (e.g., converting "Yes"/"No" into `1`/`0`), and creating new, more meaningful features from existing ones.

---

## 9. Core Algorithms

### 9.1 Linear Regression (Regression)

### What is it?

Predicts a continuous numeric value by fitting a straight line (or hyperplane, with multiple features) through the data.

```python
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split

hours_studied = [[1], [2], [3], [4], [5], [6], [7], [8]]
exam_scores = [35, 45, 50, 60, 65, 75, 82, 90]

X_train, X_test, y_train, y_test = train_test_split(hours_studied, exam_scores, test_size=0.25, random_state=42)

model = LinearRegression()
model.fit(X_train, y_train)

predictions = model.predict(X_test)
print(predictions)

new_prediction = model.predict([[9]])
print(f"Predicted score for 9 hours studied: {new_prediction[0]:.2f}")
```

**Real-World Use:** Predicting house prices, sales forecasts, exam scores based on study hours.

---

### 9.2 Logistic Regression (Classification)

### What is it?

Despite the name "regression," this is actually a **classification** algorithm — predicting a category (typically yes/no, or pass/fail), based on a probability.

```python
from sklearn.linear_model import LogisticRegression

hours_studied = [[1], [2], [3], [4], [5], [6], [7], [8]]
passed = [0, 0, 0, 1, 1, 1, 1, 1]   # 0 = fail, 1 = pass

model = LogisticRegression()
model.fit(hours_studied, passed)

prediction = model.predict([[3.5]])
print("Pass" if prediction[0] == 1 else "Fail")
```

**Real-World Use:** Spam detection, disease diagnosis (positive/negative), customer churn prediction (will leave / will stay).

---

### 9.3 Decision Tree (Classification or Regression)

### What is it?

A model that makes decisions by asking a series of yes/no questions about the features, forming a tree-like structure of splits.

```python
from sklearn.tree import DecisionTreeClassifier

features = [[25, 50000], [45, 80000], [35, 60000], [22, 30000], [50, 90000]]
buys_product = [0, 1, 0, 0, 1]

model = DecisionTreeClassifier()
model.fit(features, buys_product)

prediction = model.predict([[30, 55000]])
print(prediction)
```

**Real-World Use:** Loan approval decisions, medical diagnosis systems — valued for being relatively easy to interpret and explain to non-technical people.

---

### 9.4 Random Forest (Classification or Regression)

### What is it?

An "ensemble" method that builds many decision trees and combines their predictions (usually by majority vote) — generally more accurate and less prone to overfitting than a single decision tree.

```python
from sklearn.ensemble import RandomForestClassifier

model = RandomForestClassifier(n_estimators=100)
model.fit(features, buys_product)

prediction = model.predict([[30, 55000]])
print(prediction)
```

**Explanation:** `n_estimators=100` builds 100 individual decision trees, each trained slightly differently, then combines their votes for a more robust final prediction.

**Real-World Use:** Widely used in production ML systems for its strong accuracy and resistance to overfitting compared to a single tree.

---

### 9.5 K-Nearest Neighbors — KNN (Classification or Regression)

### What is it?

Classifies a new data point based on the majority class among its "k" closest neighbors in the training data — no real "training" happens beyond storing the data.

```python
from sklearn.neighbors import KNeighborsClassifier

model = KNeighborsClassifier(n_neighbors=3)
model.fit(features, buys_product)

prediction = model.predict([[30, 55000]])
print(prediction)
```

**Explanation:** `n_neighbors=3` means the prediction is based on the 3 closest known data points to the new one — whichever class is most common among those 3 "neighbors" wins.

**Real-World Use:** Recommendation systems, simple classification problems with clearly separable groups.

---

### 9.6 Support Vector Machine — SVM (Classification)

### What is it?

Finds the best possible boundary (a "hyperplane") that separates classes with the maximum possible margin between them.

```python
from sklearn.svm import SVC

model = SVC()
model.fit(features, buys_product)

prediction = model.predict([[30, 55000]])
print(prediction)
```

**Real-World Use:** Text classification, image classification, particularly effective in high-dimensional feature spaces.

---

### 9.7 Naive Bayes (Classification)

### What is it?

A probability-based classifier built on Bayes' Theorem, assuming features are independent of each other (the "naive" assumption) — surprisingly effective in practice, especially for text.

```python
from sklearn.naive_bayes import GaussianNB

model = GaussianNB()
model.fit(features, buys_product)

prediction = model.predict([[30, 55000]])
print(prediction)
```

**Real-World Use:** Spam email filtering, sentiment analysis — extremely fast to train, even on large datasets.

---

### 9.8 K-Means (Clustering — Unsupervised)

### What is it?

Groups data into `k` clusters based on similarity, with **no labels required** at all — the algorithm discovers the groupings entirely on its own.

```python
from sklearn.cluster import KMeans

customer_data = [[20, 15000], [22, 18000], [45, 80000], [48, 85000], [50, 90000], [25, 20000]]

model = KMeans(n_clusters=2, random_state=42, n_init=10)
model.fit(customer_data)

print(model.labels_)         # which cluster each data point belongs to
print(model.cluster_centers_)   # the "center" of each cluster
```

**Explanation:** `n_clusters=2` tells K-Means to find exactly 2 groups. `.labels_` shows which cluster (0 or 1) each original data point was assigned to.

**Real-World Use:** Customer segmentation, grouping similar products, image compression.

---

## Comparison Table — Choosing an Algorithm

| Algorithm | Type | Best For |
|---|---|---|
| Linear Regression | Regression | Simple, interpretable numeric predictions |
| Logistic Regression | Classification | Simple, interpretable yes/no predictions |
| Decision Tree | Both | Easy-to-explain decisions |
| Random Forest | Both | Higher accuracy, resistant to overfitting |
| KNN | Both | Simple, works well with clearly separable data |
| SVM | Classification | High-dimensional data, strong boundaries |
| Naive Bayes | Classification | Text classification, very fast |
| K-Means | Clustering | Discovering unlabeled groups in data |

---

## Common Beginner Mistakes — Summary for This Section

- Evaluating a model on the same data it was trained on, giving a falsely optimistic result.
- Relying solely on accuracy for classification problems with imbalanced classes.
- Confusing Logistic Regression (classification) with Linear Regression (regression) due to the similar name.
- Skipping feature engineering and jumping straight to trying fancier algorithms.

---

## Cheat Sheet — Machine Learning

```python
from sklearn.model_selection import train_test_split, cross_val_score
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Regression
from sklearn.linear_model import LinearRegression
model = LinearRegression()
model.fit(X_train, y_train)
predictions = model.predict(X_test)

# Classification
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.naive_bayes import GaussianNB

# Clustering
from sklearn.cluster import KMeans

# Evaluation
from sklearn.metrics import accuracy_score, mean_squared_error, r2_score
```

---

## Mini Project: Student Performance Prediction

### Objective

Build a model that predicts whether a student will pass or fail based on hours studied and attendance percentage, using Logistic Regression.

### Requirements

- Use sample training data (hours studied, attendance, pass/fail).
- Train a classification model.
- Evaluate its accuracy and predict a new student's outcome.

### Concepts Used

Features/labels, train/test split, Logistic Regression, model evaluation.

### Complete Code

```python
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# Features: [hours_studied, attendance_percent]
X = [
    [1, 50], [2, 55], [3, 60], [4, 65], [5, 70],
    [6, 75], [7, 85], [8, 90], [9, 95], [10, 98]
]
# Labels: 0 = Fail, 1 = Pass
y = [0, 0, 0, 0, 1, 1, 1, 1, 1, 1]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

model = LogisticRegression()
model.fit(X_train, y_train)

predictions = model.predict(X_test)
accuracy = accuracy_score(y_test, predictions)
print(f"Model Accuracy: {accuracy * 100:.2f}%")

new_student = [[4.5, 68]]
result = model.predict(new_student)
print("Prediction for new student:", "Pass" if result[0] == 1 else "Fail")

probability = model.predict_proba(new_student)
print(f"Confidence: Fail={probability[0][0]:.2f}, Pass={probability[0][1]:.2f}")
```

### Code Explanation

- `X` holds two features per student (hours studied, attendance); `y` holds the known pass/fail outcome for each.
- After training, `accuracy_score` checks how many of the held-out test predictions matched the actual known outcomes.
- `.predict_proba()` shows the model's confidence in each class — useful when the decision is close, rather than just a hard yes/no.

### Sample Output

```
Model Accuracy: 100.00%
Prediction for new student: Pass
Confidence: Fail=0.18, Pass=0.82
```

### Possible Improvements

- Add more features (assignment scores, class participation).
- Use a larger, real dataset instead of small hardcoded sample data.
- Compare Logistic Regression's accuracy against a Decision Tree or Random Forest on the same data.

### Challenge Task

Extend the project to predict an actual numeric exam score (using Linear Regression) instead of just pass/fail, and compare the two approaches.

---

## Interview Questions

**Q1. What is the difference between AI, ML, and Deep Learning?**
Answer: AI is the broad field of making machines act intelligently. ML is a subset of AI focused on learning patterns from data. Deep Learning is a further subset of ML using multi-layered neural networks.

**Q2. What is the difference between supervised and unsupervised learning?**
Answer: Supervised learning trains on labeled data (with known correct answers) to predict outcomes for new data. Unsupervised learning finds patterns or groupings in data that has no labels at all.

**Q3. What is the difference between regression and classification?**
Answer: Regression predicts a continuous numeric value. Classification predicts a discrete category or class.

**Q4. Why is Logistic Regression used for classification despite its name?**
Answer: It calculates a probability (using a logistic/sigmoid function) that's then used to assign a class label (e.g., above 0.5 probability = one class, below = the other) — the "regression" refers to the underlying calculation, not the type of output.

**Q5. Why is a train/test split necessary?**
Answer: To evaluate how well a model performs on data it has never seen, avoiding a falsely optimistic result from testing on the same data used for training.

**Q6. What is the difference between precision and recall?**
Answer: Precision measures how many of the model's positive predictions were actually correct. Recall measures how many of the actual positive cases the model successfully identified.

**Q7. What is the difference between a Decision Tree and a Random Forest?**
Answer: A Decision Tree is a single tree-based model. A Random Forest builds many decision trees and combines their predictions, generally improving accuracy and reducing overfitting compared to any single tree.

**Q8. What is K-Means used for, and is it supervised or unsupervised?**
Answer: K-Means is a clustering algorithm, used to group similar data points together. It's unsupervised — it requires no labeled data at all.

---

## Practice Questions

**Beginner**
1. Split a small dataset of 10 samples into training and testing sets using `train_test_split`.
2. Train a Linear Regression model to predict a value based on a single feature, and print its predictions on test data.
3. Train a Logistic Regression model on a simple pass/fail dataset and calculate its accuracy.
4. Explain, in your own words, the difference between features and labels.
5. Train a K-Means model with 2 clusters on a small sample dataset and print each point's assigned cluster.

**Intermediate**
1. Train and compare a Decision Tree and a Random Forest on the same classification dataset, comparing their accuracy.
2. Use cross-validation (`cross_val_score`) to evaluate a Linear Regression model on a small dataset.
3. Train a KNN classifier with different values of `k` (e.g., 1, 3, 5) and observe how the predictions change.
4. Calculate precision and recall (not just accuracy) for a classification model on an imbalanced sample dataset.
5. Engineer a new feature (e.g., "study hours per day" from "total study hours" and "days until exam") and use it in a model.

**Challenge**
1. Build a complete ML pipeline: load a small dataset, split it, engineer at least one new feature, train a Random Forest, and evaluate it with accuracy, precision, and recall.
2. Compare the performance of Logistic Regression, Decision Tree, and SVM on the same classification dataset, and explain which performed best and why.
3. Extend the Student Performance Prediction mini project to use K-Means clustering to group students into "at-risk," "average," and "high-performing" categories based on their features, without using the pass/fail labels at all.
$vv18$, 'markdown',
  jsonb_build_object('source', 'python_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'python_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Deep Learning
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = 'automation-data-science-ai'),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $vv19$Deep Learning$vv19$, $vv20$deep-learning$vv20$, $vv21$Neural networks, tensors, activation and loss functions, optimizers, backpropagation, and an introduction to building networks with Keras/TensorFlow and PyTorch, plus CNNs, RNNs/LSTMs, and transfer learning.$vv21$, 24,
    'published', true, true, 'python_tutorial', $vv22$automation-data-science-ai/deep-learning$vv22$
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
select up_topic.id, '', $vv23$Deep Learning is the branch of Machine Learning behind some of the most impressive recent AI breakthroughs — image recognition, speech recognition, and large language models. It's built on **neural networks**, loosely inspired by how neurons in the brain connect and pass signals to each other.

```bash
pip install tensorflow torch
```

---

## 1. What is a Neural Network?

### What is it?

A neural network is a model made of layers of connected "neurons," each performing a small calculation, working together to learn complex patterns from data.

> **Definition:** A neural network is a computational model composed of layers of interconnected nodes (neurons), designed to recognize patterns in data.

### Structure of a Neural Network

| Layer | Purpose |
|---|---|
| **Input layer** | Receives the raw features (e.g., pixel values of an image) |
| **Hidden layer(s)** | Perform calculations, extracting increasingly complex patterns |
| **Output layer** | Produces the final prediction |

### How a Single Neuron Works

Each neuron performs a simple calculation:

```
output = activation_function((input1 × weight1) + (input2 × weight2) + ... + bias)
```

**Explanation:** Every connection between neurons has a **weight** (how important that input is) and every neuron has a **bias** (an adjustable offset). During training, the network gradually adjusts these weights and biases to make its predictions more accurate.

### Why "Deep" Learning?

"Deep" refers to having **many** hidden layers stacked together — each layer builds on patterns detected by the previous one (e.g., in image recognition: edges → shapes → objects → complete scenes).

### Real-World Example

A neural network trained to recognize handwritten digits (0-9) takes pixel values as input, and after passing through several hidden layers, outputs which digit (0-9) it thinks the image represents.

---

## 2. Tensors

### What is it?

A tensor is simply a multi-dimensional array — the fundamental data structure used throughout deep learning, similar in spirit to NumPy arrays (covered in the Data Analysis file), but with additional capabilities needed for deep learning (like automatic gradient tracking).

### Examples of Tensor Dimensions

| Dimensions | Example |
|---|---|
| 0D (scalar) | A single number: `5` |
| 1D (vector) | A list: `[1, 2, 3]` |
| 2D (matrix) | A table: `[[1, 2], [3, 4]]` |
| 3D+ | A batch of images, video data, etc. |

### Important Points

- Both PyTorch and TensorFlow use tensors as their core data structure.
- Tensors can run on a GPU (graphics card) for dramatically faster computation than a regular CPU — essential for training large models efficiently.

---

## 3. Activation Functions

### What is it?

An activation function decides whether (and how strongly) a neuron "fires," introducing **non-linearity** into the network — without this, a neural network (no matter how many layers) would behave just like a single simple linear equation, unable to learn complex patterns.

### Common Activation Functions

| Function | Behavior | Common Use |
|---|---|---|
| **ReLU** | Outputs the input directly if positive, otherwise 0 | Most common choice for hidden layers |
| **Sigmoid** | Squeezes output between 0 and 1 | Output layer for binary classification |
| **Softmax** | Converts outputs into a probability distribution across multiple classes | Output layer for multi-class classification |
| **Tanh** | Squeezes output between -1 and 1 | Occasionally used in hidden layers |

### Simple Example (Conceptual)

```python
def relu(x):
    return max(0, x)

print(relu(5))    # 5
print(relu(-3))   # 0
```

### Important Points

- ReLU is the most widely used activation function for hidden layers today, due to its simplicity and effectiveness.
- The **output layer's** activation function depends on the task: Sigmoid for yes/no, Softmax for multiple categories.

---

## 4. Loss Functions

### What is it?

A loss function measures how wrong the model's predictions are compared to the actual correct answers — the number the network tries to minimize during training.

### Common Loss Functions

| Loss Function | Used For |
|---|---|
| **Mean Squared Error (MSE)** | Regression (predicting numbers) |
| **Binary Cross-Entropy** | Binary classification (two classes) |
| **Categorical Cross-Entropy** | Multi-class classification |

### Important Points

- A lower loss value means the model's predictions are closer to the correct answers.
- The choice of loss function should match the type of problem (regression vs classification).

---

## 5. Optimizers

### What is it?

An optimizer is the algorithm that adjusts the network's weights and biases to reduce the loss, based on the gradients calculated during backpropagation (see below).

### Common Optimizers

| Optimizer | Notes |
|---|---|
| **Gradient Descent** | The foundational concept: adjust weights in the direction that reduces loss |
| **Stochastic Gradient Descent (SGD)** | Updates weights using small batches of data at a time, rather than the whole dataset at once |
| **Adam** | An adaptive, generally faster-converging optimizer — the most commonly used default choice today |

### Important Points

- Adam is the most commonly used optimizer in modern deep learning, thanks to its strong general performance with minimal tuning.

---

## 6. Backpropagation (Conceptual Overview)

### What is it?

Backpropagation is the algorithm that lets a neural network learn — it calculates exactly how much each weight contributed to the final error, then adjusts every weight slightly to reduce that error, working backward from the output layer to the input layer.

> **Definition:** Backpropagation is the algorithm used to calculate how much each weight in a neural network contributed to the prediction error, allowing the optimizer to adjust weights accordingly.

### How It Works (Simplified)

1. **Forward pass** — input data flows through the network, producing a prediction.
2. **Calculate loss** — compare the prediction to the actual correct answer.
3. **Backward pass (backpropagation)** — calculate how much each weight contributed to the error.
4. **Update weights** — the optimizer nudges each weight slightly to reduce the error.
5. Repeat this cycle many times (over many "epochs") until the loss becomes acceptably small.

### Important Points

- You rarely implement backpropagation manually — frameworks like PyTorch and TensorFlow handle it automatically ("autograd").
- Understanding the concept (even without deriving the math) is valuable for understanding *why* training takes many repeated passes over the data.

---

## 7. Building a Neural Network with TensorFlow/Keras

### What is it?

Keras is a high-level, beginner-friendly API built into TensorFlow — one of the easiest ways to build and train neural networks in Python.

### Simple Example — Classifying Pass/Fail

```python
import tensorflow as tf
from tensorflow import keras
import numpy as np

# Sample data: [hours_studied, attendance_percent]
X = np.array([[1, 50], [2, 55], [3, 60], [4, 65], [5, 70],
              [6, 75], [7, 85], [8, 90], [9, 95], [10, 98]])
y = np.array([0, 0, 0, 0, 1, 1, 1, 1, 1, 1])   # 0 = Fail, 1 = Pass

model = keras.Sequential([
    keras.layers.Dense(8, activation="relu", input_shape=(2,)),
    keras.layers.Dense(4, activation="relu"),
    keras.layers.Dense(1, activation="sigmoid")
])

model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])

model.fit(X, y, epochs=50, verbose=0)

prediction = model.predict(np.array([[4.5, 68]]))
print("Pass probability:", prediction[0][0])
```

### Explanation of the Code

- `keras.Sequential([...])` stacks layers in order — data flows straight through from the first to the last.
- `Dense(8, activation="relu")` creates a fully-connected hidden layer with 8 neurons.
- The final `Dense(1, activation="sigmoid")` outputs a single value between 0 and 1 — perfect for binary (pass/fail) classification.
- `model.compile()` configures the loss function and optimizer before training begins.
- `model.fit(X, y, epochs=50)` trains the network for 50 full passes over the data.

### Important Points

- Keras dramatically simplifies building neural networks compared to writing the underlying math manually.
- `epochs` controls how many times the model sees the entire training dataset during training.

---

## 8. Building a Neural Network with PyTorch

### What is it?

PyTorch is another major deep learning framework, popular especially in research, offering more manual, flexible control over the training process compared to Keras's higher-level abstraction.

### Simple Example

```python
import torch
import torch.nn as nn

X = torch.tensor([[1, 50], [2, 55], [3, 60], [4, 65], [5, 70],
                   [6, 75], [7, 85], [8, 90], [9, 95], [10, 98]], dtype=torch.float32)
y = torch.tensor([[0], [0], [0], [0], [1], [1], [1], [1], [1], [1]], dtype=torch.float32)

class SimpleNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.layer1 = nn.Linear(2, 8)
        self.layer2 = nn.Linear(8, 1)
        self.relu = nn.ReLU()
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        x = self.relu(self.layer1(x))
        x = self.sigmoid(self.layer2(x))
        return x

model = SimpleNet()
loss_function = nn.BCELoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.01)

for epoch in range(100):
    predictions = model(X)
    loss = loss_function(predictions, y)

    optimizer.zero_grad()
    loss.backward()      # backpropagation happens here, automatically
    optimizer.step()      # update the weights

new_student = torch.tensor([[4.5, 68]], dtype=torch.float32)
print("Pass probability:", model(new_student).item())
```

### Explanation of the Code

- PyTorch defines a network as a Python class inheriting from `nn.Module`, with layers set up in `__init__` and the data flow defined in `forward()`.
- `loss.backward()` automatically calculates every weight's contribution to the error (backpropagation) — you never derive this math by hand.
- `optimizer.step()` applies the actual weight updates, based on those calculated gradients.

### Comparison Table — Keras/TensorFlow vs PyTorch

| | Keras / TensorFlow | PyTorch |
|---|---|---|
| Ease of use | Very beginner-friendly | More manual, more control |
| Popular in | Industry / production | Research, increasingly industry too |
| Training loop | Handled automatically (`.fit()`) | Written manually (more visible/flexible) |
| Best for | Quick prototyping, standard architectures | Custom architectures, research experimentation |

---

## 9. Convolutional Neural Networks (CNNs)

### What is it?

CNNs are a specialized neural network architecture designed specifically for image data, using "convolutional" layers that automatically detect visual patterns like edges, textures, and shapes.

### Simple Conceptual Example (Keras)

```python
from tensorflow import keras

cnn_model = keras.Sequential([
    keras.layers.Conv2D(32, (3, 3), activation="relu", input_shape=(64, 64, 3)),
    keras.layers.MaxPooling2D((2, 2)),
    keras.layers.Flatten(),
    keras.layers.Dense(64, activation="relu"),
    keras.layers.Dense(10, activation="softmax")
])
```

### Explanation

- `Conv2D` layers scan across the image with small filters, learning to detect visual features like edges and textures.
- `MaxPooling2D` shrinks the data, keeping only the most important detected features, which reduces computation and helps the model generalize.
- `Flatten()` converts the resulting grid of features into a single long list, ready for regular `Dense` layers to make the final classification.

### Real-World Example

CNNs power facial recognition, medical image analysis (detecting tumors in scans), and self-driving car vision systems.

---

## 10. Recurrent Neural Networks (RNNs) and LSTMs

### What is it?

RNNs are designed for **sequential** data — where order matters, like sentences, time series, or audio. Unlike a regular neural network, an RNN has a form of "memory," using its own previous output as part of its next calculation.

### The Problem RNNs Have — and LSTMs' Solution

Plain RNNs struggle to remember information from far back in a long sequence (a problem called "vanishing gradients"). **LSTM** (Long Short-Term Memory) networks are a specialized type of RNN designed specifically to remember important information over much longer sequences.

### Simple Conceptual Example (Keras)

```python
from tensorflow import keras

rnn_model = keras.Sequential([
    keras.layers.LSTM(64, input_shape=(10, 1)),   # sequence length 10, 1 feature per step
    keras.layers.Dense(1)
])
```

### Real-World Example

RNNs/LSTMs are used for text generation, language translation, stock price prediction, and speech recognition — anywhere the **order** of the data carries meaning.

### Important Points

- Use CNNs for image/spatial data; use RNNs/LSTMs for sequential/time-based data.
- Modern large language models (covered in the next file) largely use a newer architecture called "Transformers," which has mostly replaced RNNs/LSTMs for language tasks — but understanding RNNs/LSTMs is still valuable foundational knowledge.

---

## 11. Transfer Learning

### What is it?

Transfer learning means taking a model already trained on a huge dataset (by someone else, often a large company with massive computing resources) and adapting it to your own, usually much smaller, specific task — instead of training a new model completely from scratch.

> **Definition:** Transfer learning reuses a pre-trained model's learned features as a starting point for a new, related task, dramatically reducing the data and computation needed.

### Real-World Example

A model pre-trained on millions of general images (like ImageNet) already understands general visual features (edges, shapes, textures). You can reuse those learned features and just retrain the final layers to recognize your own specific categories (e.g., identifying specific plant diseases from leaf photos), needing far less of your own data and training time.

### Important Points

- Transfer learning is extremely common in practice — training a large model completely from scratch requires massive datasets and computing power most individuals and even many companies don't have.
- Especially popular for image classification (using pre-trained CNNs) and, as covered in the next file, for adapting large pre-trained language models.

---

## Common Beginner Mistakes — Summary for This Section

- Forgetting an activation function entirely, which limits the network to only learning simple linear relationships regardless of how many layers it has.
- Choosing the wrong output activation function for the task (e.g., using Sigmoid for a multi-class problem instead of Softmax).
- Training for too few epochs (underfitting) or too many (overfitting) without monitoring performance on a validation set.
- Not normalizing/scaling input features, which can slow down or destabilize training.

---

## Cheat Sheet — Deep Learning

```python
# Keras/TensorFlow
from tensorflow import keras
model = keras.Sequential([
    keras.layers.Dense(8, activation="relu", input_shape=(n_features,)),
    keras.layers.Dense(1, activation="sigmoid")
])
model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])
model.fit(X, y, epochs=50)
model.predict(new_data)

# PyTorch
import torch.nn as nn
class Net(nn.Module):
    def __init__(self):
        super().__init__()
        self.layer = nn.Linear(in_features, out_features)
    def forward(self, x):
        return self.layer(x)

loss.backward()      # backpropagation
optimizer.step()      # update weights
```

---

## Interview Questions

**Q1. What is the role of an activation function in a neural network?**
Answer: It introduces non-linearity, allowing the network to learn complex patterns — without it, stacking multiple layers would behave the same as a single linear equation.

**Q2. What is backpropagation?**
Answer: The algorithm used to calculate how much each weight in the network contributed to the prediction error, working backward from the output layer, so the optimizer knows how to adjust each weight to reduce that error.

**Q3. What is the difference between a CNN and an RNN?**
Answer: CNNs are designed for spatial data like images, using convolutional layers to detect visual patterns. RNNs (and LSTMs) are designed for sequential data like text or time series, where the order of the data matters.

**Q4. What is transfer learning, and why is it useful?**
Answer: Reusing a model already pre-trained on a large dataset as a starting point for a new, related task — dramatically reducing the amount of data and computation needed compared to training entirely from scratch.

**Q5. What is the difference between an epoch and a batch?**
Answer: An epoch is one complete pass through the entire training dataset. A batch is a smaller subset of the data processed together during one step of training within an epoch.

**Q6. Why is Adam a popular choice of optimizer?**
Answer: It adapts its learning rate during training and generally converges faster and more reliably than basic gradient descent, with less manual tuning required.

---

## Practice Questions

**Beginner**
1. Explain, in your own words, the difference between a neuron's weight and its bias.
2. List the three common activation functions covered and one situation where each would be used.
3. Build a simple Keras Sequential model with one hidden layer for a binary classification problem.
4. Explain why a loss function is necessary during training.
5. Explain the difference between supervised deep learning and the general concept of supervised learning from the Machine Learning file.

**Intermediate**
1. Train the Keras pass/fail example from this file with a different number of hidden neurons, and observe if predictions change.
2. Build a PyTorch model with two hidden layers instead of one, for the same pass/fail dataset.
3. Explain, in your own words, why CNNs use pooling layers.
4. Explain the vanishing gradient problem and how LSTMs address it.
5. Research and briefly summarize one real-world application each of a CNN and an RNN/LSTM.

**Challenge**
1. Build and train a small Keras neural network on a slightly larger synthetic dataset (e.g., 100 samples) for a binary classification task, and evaluate its accuracy.
2. Compare the same classification problem solved with (a) Logistic Regression (from the Machine Learning file) and (b) a small neural network, and discuss when the added complexity of a neural network is actually justified.
3. Research a pre-trained model (like MobileNet or ResNet) and explain, in your own words, how you would apply transfer learning to adapt it for a custom image classification task.
$vv23$, 'markdown',
  jsonb_build_object('source', 'python_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'python_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- AI & Generative AI
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = 'automation-data-science-ai'),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $vv24$AI & Generative AI$vv24$, $vv25$ai-and-generative-ai$vv25$, $vv26$Large Language Models — tokens, prompt engineering, embeddings and cosine similarity, vector databases, Retrieval-Augmented Generation (RAG), calling AI APIs, building a stateful chatbot, and AI agents with tool/function calling.$vv26$, 25,
    'published', true, true, 'python_tutorial', $vv27$automation-data-science-ai/ai-and-generative-ai$vv27$
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
select up_topic.id, '', $vv28$Generative AI — models that can write text, generate images, and hold conversations — is one of the fastest-growing areas in software today. This file covers the core concepts and practical Python patterns for working with Large Language Models (LLMs).

---

## 1. AI Fundamentals Recap

As covered in the Machine Learning file, Generative AI is a specific application area within AI, heavily built on Deep Learning. What makes it distinctive is that instead of just predicting a number or category, a generative model produces **new content** — text, images, audio — resembling the data it was trained on.

> **Definition:** Generative AI refers to models capable of producing new content — text, images, audio, or code — based on patterns learned from vast amounts of training data.

---

## 2. What is an LLM (Large Language Model)?

### What is it?

An LLM is a deep learning model trained on enormous amounts of text, learning to predict the next most likely word (or piece of a word) in a sequence — and, through this simple mechanism trained at massive scale, developing the ability to write coherently, answer questions, summarize, translate, and reason through problems.

> **Definition:** A Large Language Model is a deep neural network, typically built on a "Transformer" architecture, trained on massive text datasets to understand and generate human language.

### How does it work? (Conceptual Overview)

1. Text is broken into small pieces called **tokens** (see below).
2. The model processes these tokens using a "Transformer" architecture (a design built around a mechanism called **attention**, which lets the model weigh how relevant every other word in the input is to each word it's currently processing).
3. Based on everything it has seen so far, the model predicts the most likely next token.
4. This process repeats, one token at a time, to generate an entire response.

### Important Points

- LLMs don't "look up" answers from a database — they generate text based on learned statistical patterns, which means they can occasionally produce confident-sounding but incorrect information (often called "hallucination").
- Modern LLMs are accessed primarily through APIs (covered below) rather than run on a personal computer, due to their massive size.

---

## 3. Tokens

### What is it?

A token is a small chunk of text — sometimes a whole word, sometimes just part of one — that an LLM actually processes. LLMs don't read text character-by-character or strictly word-by-word; they work in these token-sized chunks.

### Simple Example (Conceptual)

```
"Understanding tokenization" might break down into tokens like:
["Understand", "ing", " token", "ization"]
```

**Explanation:** Common words are often a single token, while rarer or longer words get split into smaller sub-word pieces — this lets the model handle virtually any word, even ones it has never seen before, by combining familiar smaller pieces.

### Why Tokens Matter Practically

- **Cost** — most LLM APIs charge based on the number of tokens processed (both the input you send and the output generated).
- **Limits** — every model has a maximum "context window" (the total number of tokens it can consider at once, for both the conversation history and its response).

### Important Points

- As a rough estimate for English text, 1 token is roughly ¾ of a word (or roughly 4 characters).
- Understanding tokens helps explain both API costs and why very long conversations may eventually need to be trimmed or summarized.

---

## 4. Prompt Engineering

### What is it?

Prompt engineering is the practice of carefully crafting the instructions (the "prompt") given to an LLM to get better, more reliable, more relevant responses.

> **Definition:** Prompt engineering is the practice of designing input text to guide a language model toward producing the most useful and accurate output.

### Key Techniques

**1. Be clear and specific:**
```
Weak prompt:   "Write about dogs"
Better prompt: "Write a 200-word beginner's guide to choosing a dog breed for a first-time owner living in an apartment"
```

**2. Provide examples (few-shot prompting):**
```
Classify the sentiment of each review as Positive or Negative.

Review: "This product exceeded my expectations!"
Sentiment: Positive

Review: "Completely broke after one use."
Sentiment: Negative

Review: "Works okay, nothing special."
Sentiment:
```

**Explanation:** Showing the model 2 examples of the exact input/output pattern you want ("few-shot") dramatically improves consistency compared to just describing the task in words alone ("zero-shot").

**3. Ask for step-by-step reasoning (chain-of-thought):**
```
Solve this step by step: If a train travels 60 km in 1.5 hours, what is its average speed?
```

**Explanation:** Explicitly asking the model to reason "step by step" often improves accuracy on problems requiring multiple logical steps, compared to asking for just the final answer directly.

**4. Use a system prompt to set persistent behavior:**
```
System: You are a helpful Python tutor. Always explain concepts using simple beginner-friendly language and include a code example.
User: What is a list comprehension?
```

### Important Points

- Clear, specific instructions consistently outperform vague ones.
- Providing examples (few-shot) is one of the most reliable ways to improve output quality and consistency.
- Prompt engineering is an iterative process — testing and refining prompts based on the actual outputs received.

### Practice

1. Write a zero-shot prompt and a few-shot prompt for the same task (e.g., extracting a person's name and city from a sentence), and compare which feels more reliable.

---

## 5. Embeddings

### What is it?

An embedding converts text (a word, sentence, or document) into a list of numbers (a vector) that captures its **meaning** — texts with similar meanings end up with mathematically similar vectors, even if they use completely different words.

> **Definition:** An embedding is a numerical vector representation of text that captures its semantic meaning, allowing similarity to be measured mathematically.

### Simple Conceptual Example

```python
# Conceptual illustration - actual embeddings have hundreds of dimensions
embedding_1 = get_embedding("The cat sat on the mat")
embedding_2 = get_embedding("A feline rested on the rug")
embedding_3 = get_embedding("Stock markets fell sharply today")

# embedding_1 and embedding_2 would be mathematically VERY similar
# (despite sharing almost no exact words), because their MEANING is similar

# embedding_3 would be mathematically very DIFFERENT from the other two
```

### Measuring Similarity — Cosine Similarity

```python
import numpy as np

def cosine_similarity(vec1, vec2):
    dot_product = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    return dot_product / (norm1 * norm2)

similarity_score = cosine_similarity(embedding_1, embedding_2)
print(similarity_score)   # closer to 1 = more similar meaning
```

**Explanation:** Cosine similarity measures the angle between two vectors — a score close to `1` means very similar meaning, closer to `0` means unrelated, and negative values suggest opposite meaning.

### Real-World Example

Embeddings power semantic search (finding documents by *meaning*, not just exact keyword matches), recommendation systems, and duplicate detection.

### Important Points

- Embeddings capture meaning, not just literal word overlap.
- Similarity between embeddings is typically measured using cosine similarity.

---

## 6. Vector Databases

### What is it?

A vector database is a specialized database designed to store embeddings and efficiently search for the most similar ones, even across millions of entries — far faster than comparing a query against every single stored embedding one by one.

> **Definition:** A vector database stores embeddings and enables fast similarity search, finding the most semantically relevant items to a given query.

### Conceptual Workflow

```python
# 1. Convert your documents into embeddings and store them
documents = ["Python is a programming language", "Cats are popular pets", "Machine learning uses data"]
document_embeddings = [get_embedding(doc) for doc in documents]
vector_db.store(documents, document_embeddings)

# 2. When a user asks a question, embed their query too
query = "What is Python used for?"
query_embedding = get_embedding(query)

# 3. Find the most similar stored document(s)
results = vector_db.search(query_embedding, top_k=1)
print(results)   # returns: "Python is a programming language"
```

### Real-World Example

Popular vector databases include Pinecone, Chroma, Weaviate, and FAISS (a library rather than a full database) — all used heavily in the RAG systems described next.

### Important Points

- Vector databases are essential infrastructure for search and retrieval based on meaning rather than exact keyword matching.

---

## 7. RAG — Retrieval-Augmented Generation

### What is it?

RAG combines a retrieval step (finding relevant information, usually via a vector database) with a generation step (an LLM writing a response) — letting an LLM answer questions using specific, up-to-date, or private information it was never originally trained on.

> **Definition:** RAG (Retrieval-Augmented Generation) is a technique that retrieves relevant documents and provides them to an LLM as context, so it can generate accurate, grounded answers rather than relying solely on its training data.

### Why We Need It

LLMs have a fixed training cutoff and no built-in knowledge of your company's private documents, today's news, or anything created after their training. RAG solves this by fetching relevant, current, or private information first, then handing it to the LLM alongside the user's question.

### Conceptual RAG Pipeline

```python
def answer_question(user_question):
    # Step 1: Retrieve relevant context
    query_embedding = get_embedding(user_question)
    relevant_docs = vector_db.search(query_embedding, top_k=3)

    # Step 2: Build a prompt combining the retrieved context and the question
    context = "\n".join(relevant_docs)
    prompt = f"""Answer the question using ONLY the context below.

Context:
{context}

Question: {user_question}
"""

    # Step 3: Send to the LLM for a grounded answer
    response = call_llm_api(prompt)
    return response
```

### Explanation of the Code

- Instead of asking the LLM the question directly (relying only on what it learned during training), we first retrieve the most relevant real documents, then explicitly include them in the prompt.
- This grounds the LLM's answer in actual, verifiable source material, dramatically reducing the chance of it inventing an incorrect answer.

### Real-World Example

A company chatbot answering questions about internal HR policies uses RAG: it retrieves the relevant HR policy document and includes it in the prompt, so the LLM answers based on the company's actual current policy, not generic guesses.

### Important Points

- RAG is the standard technique for building LLM applications that need up-to-date or private/specific knowledge.
- RAG is generally cheaper and faster to set up than fine-tuning a model (retraining it on custom data), and is the more common first choice for most applications.

---

## 8. Calling an AI API from Python

### What is it?

Most LLM providers offer an API (following the same request/response HTTP patterns covered in the APIs & HTTP file), letting you integrate AI capabilities directly into your own Python applications.

### Simple Example (Generic Pattern)

```python
import requests

API_URL = "https://api.example-ai-provider.com/v1/chat"
API_KEY = "YOUR_API_KEY_HERE"

def call_llm_api(prompt):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "example-model-name",
        "messages": [{"role": "user", "content": prompt}]
    }

    response = requests.post(API_URL, headers=headers, json=payload, timeout=30)
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"]

reply = call_llm_api("Explain recursion in one sentence.")
print(reply)
```

### Explanation of the Code

- This follows the exact same `requests` pattern covered in the APIs & HTTP file: headers for authentication, a JSON payload describing the request, and parsing the JSON response.
- The `messages` structure (a list of role/content pairs) is the standard way most chat-based AI APIs represent a conversation.
- **Note:** exact field names (`choices`, `messages`) vary between providers — always check your specific provider's documentation for the exact request/response format.

### Common Mistakes

- Hardcoding API keys directly in code (same security concern covered in the APIs & HTTP and Security files) — use environment variables instead.
- Not setting a `timeout`, since LLM responses can sometimes take longer than typical API calls.
- Sending overly long conversation histories without managing the token limit, potentially causing the request to fail or become very expensive.

---

## 9. Building a Simple Chatbot

### What is it?

A chatbot maintains a running conversation history, sending the full context back to the LLM on every turn — since the LLM itself has no memory between separate API calls.

### Simple Example

```python
conversation_history = [
    {"role": "system", "content": "You are a friendly, helpful assistant."}
]

def chat(user_message):
    conversation_history.append({"role": "user", "content": user_message})

    # (In a real implementation, this sends the full conversation_history to the API)
    reply = call_llm_api_with_history(conversation_history)

    conversation_history.append({"role": "assistant", "content": reply})
    return reply

print(chat("Hi, what's your name?"))
print(chat("What did I just ask you?"))   # works because history is preserved
```

### Explanation of the Code

- Every message (from both the user and the assistant) is appended to `conversation_history`, and the **entire** history is sent with every new request.
- This is why the model can answer "What did I just ask you?" — it isn't remembering anything itself between calls; the full conversation is simply being re-sent each time.

### Important Points

- LLMs are "stateless" between API calls — all conversational memory must be managed explicitly by your own application code.
- Long conversations eventually need strategies like summarizing older messages, since the context window has a maximum token limit.

---

## 10. AI Agents and Function/Tool Calling

### What is it?

An AI agent is an LLM-powered system that can take **actions** — not just generate text, but decide to call specific functions/tools (like searching the web, running code, or querying a database) to accomplish a task.

> **Definition:** An AI agent uses an LLM to decide which actions or tools to invoke, based on the user's request, in order to complete a task that requires more than just generating text.

### Simple Conceptual Example — Function/Tool Calling

```python
def get_weather(city):
    # (In reality, this would call a real weather API)
    return f"The weather in {city} is sunny, 28°C"

available_tools = {
    "get_weather": get_weather
}

def handle_user_request(user_message):
    # The LLM decides: "this question needs the get_weather tool"
    # and specifies which function to call and with what arguments
    tool_name = "get_weather"        # (in reality, determined by the LLM's response)
    tool_arguments = {"city": "Mumbai"}   # (also determined by the LLM)

    result = available_tools[tool_name](**tool_arguments)

    # The result is sent back to the LLM, which uses it to form a final natural-language reply
    return f"Based on the tool result: {result}"

print(handle_user_request("What's the weather like in Mumbai?"))
```

### Explanation of the Code

- Instead of trying to answer a weather question purely from its training data (which would be outdated or simply invented), the LLM recognizes it needs real-time data and requests that a specific tool (`get_weather`) be called with specific arguments.
- Your code actually executes the real function, then hands the **result** back to the LLM, which incorporates it into a natural final response.

### Real-World Example

A customer service AI agent might have tools for checking order status (querying a real database), processing a refund (calling a real payment API), and searching a knowledge base — deciding which tool(s) to use based on what the customer actually asks.

### Important Points

- Function/tool calling is what turns an LLM from "just a text generator" into a system that can actually take real actions in the world.
- The LLM decides **what** to call and **with what arguments**; your own code is always responsible for actually executing the real function safely.

---

## 11. LangChain (Brief Overview)

### What is it?

LangChain is a popular Python framework that provides pre-built components for common LLM application patterns — chaining prompts together, connecting to vector databases, and building agents — so you don't have to build every piece from scratch.

```bash
pip install langchain
```

### Why It Exists

Building RAG pipelines, agents, and multi-step LLM workflows involves a lot of repetitive "glue code" (formatting prompts, calling vector databases, parsing responses). LangChain provides standardized, reusable building blocks for all of this.

### Important Points

- LangChain isn't strictly necessary for simple LLM applications (a direct API call, as shown earlier, may be simpler and more transparent) — it becomes more valuable as an application's complexity grows (multi-step chains, agents, RAG pipelines).
- The broader ecosystem also includes similar tools (like LlamaIndex, focused more specifically on RAG), each with slightly different strengths.

---

## Comparison Table — Key Generative AI Concepts

| Concept | Purpose |
|---|---|
| Token | The basic unit of text an LLM processes |
| Prompt Engineering | Crafting input to get better model output |
| Embedding | Numeric representation of meaning |
| Vector Database | Fast storage/search for embeddings |
| RAG | Grounding LLM answers in retrieved real documents |
| Agent | LLM that can decide to call real tools/functions |

---

## Common Beginner Mistakes — Summary for This Section

- Assuming an LLM "remembers" previous conversations automatically — memory must be managed explicitly by resending history.
- Treating LLM output as always factually correct, without verification (hallucination is a real, known limitation).
- Hardcoding API keys directly in code.
- Skipping RAG when building a knowledge-specific application, leading to outdated or invented answers.
- Overcomplicating a simple use case with a heavy framework (like LangChain) when a direct API call would be simpler and clearer.

---

## Cheat Sheet — AI & Generative AI

```python
import requests

def call_llm_api(prompt):
    headers = {"Authorization": f"Bearer {API_KEY}"}
    payload = {"model": "model-name", "messages": [{"role": "user", "content": prompt}]}
    response = requests.post(API_URL, headers=headers, json=payload, timeout=30)
    return response.json()["choices"][0]["message"]["content"]

# Conversation history pattern
history = [{"role": "system", "content": "You are a helpful assistant."}]
history.append({"role": "user", "content": "Hello!"})

# Cosine similarity for embeddings
import numpy as np
similarity = np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))
```

---

## Mini Project: AI Chatbot

### Objective

Build a command-line chatbot that maintains conversation history and calls an LLM API to generate responses.

### Requirements

- Maintain a running conversation history across multiple turns.
- Send the full history to the API on every turn.
- Handle API errors gracefully.

*(Note: replace `API_URL`, `API_KEY`, and the response-parsing logic with your actual chosen provider's specific documentation — the structure below is a generic, representative pattern.)*

### Concepts Used

`requests`, exception handling, lists/dictionaries (conversation history), functions, loops.

### Complete Code

```python
import requests

API_URL = "https://api.example-ai-provider.com/v1/chat"
API_KEY = "YOUR_API_KEY_HERE"

conversation_history = [
    {"role": "system", "content": "You are a friendly, helpful assistant. Keep answers concise."}
]

def call_llm_api(messages):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "example-model-name",
        "messages": messages
    }

    try:
        response = requests.post(API_URL, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
    except requests.exceptions.RequestException as e:
        return f"Sorry, something went wrong: {e}"

print("Chatbot ready! Type 'quit' to exit.\n")

while True:
    user_input = input("You: ")
    if user_input.lower() == "quit":
        print("Goodbye!")
        break

    conversation_history.append({"role": "user", "content": user_input})
    reply = call_llm_api(conversation_history)
    conversation_history.append({"role": "assistant", "content": reply})

    print(f"Bot: {reply}\n")
```

### Code Explanation

- `conversation_history` grows with every turn, and the **entire** list is sent with each API call, giving the illusion of memory even though the underlying LLM itself is stateless.
- The `try`/`except` block (from the Exception Handling file) ensures a network issue or API error doesn't crash the whole chatbot session.
- The `while True` loop keeps the conversation going until the user types "quit."

### Sample Interaction

```
Chatbot ready! Type 'quit' to exit.

You: What's a good way to learn Python?
Bot: Practice daily with small projects, read others' code, and build things you're personally interested in.

You: Can you summarize what you just said in 5 words?
Bot: Practice, build projects, read code.

You: quit
Goodbye!
```

### Possible Improvements

- Add a token/message limit, trimming or summarizing older messages in long conversations.
- Save conversation history to a file (using File Handling techniques) so it persists between sessions.
- Add function/tool calling so the chatbot can look up real information (like the weather) when asked.

### Challenge Task

Extend the chatbot into a simple RAG system: load a small text file of FAQs, retrieve the most relevant one(s) based on the user's question (using basic keyword matching or embeddings), and include them as context in the prompt before calling the API.

---

## Interview Questions

**Q1. What is a token in the context of LLMs?**
Answer: A small chunk of text (sometimes a whole word, sometimes part of one) that an LLM processes as its basic unit — the amount of text an API call uses and costs is measured in tokens.

**Q2. What is prompt engineering?**
Answer: The practice of carefully designing input text (instructions, examples, structure) to guide an LLM toward producing more accurate, relevant, and reliable output.

**Q3. What is an embedding?**
Answer: A numeric vector representation of text that captures its semantic meaning, allowing similarity between different pieces of text to be measured mathematically, even if they use completely different words.

**Q4. What problem does RAG solve?**
Answer: LLMs have no built-in knowledge of information created after their training or private/specific data. RAG retrieves relevant real documents first and includes them in the prompt, letting the LLM generate answers grounded in accurate, current, or private information.

**Q5. Why do chatbots need to resend the entire conversation history with every API call?**
Answer: LLMs are stateless between separate API calls — they have no memory of previous turns on their own. The full conversation history must be explicitly included in every request for the model to have context on what was discussed earlier.

**Q6. What is an AI agent, and how does function/tool calling relate to it?**
Answer: An AI agent is a system where an LLM decides which actions or external tools/functions to invoke to complete a task, rather than only generating text. Function/tool calling is the specific mechanism by which the LLM specifies which function to call and with what arguments, with the actual execution handled by the application's own code.

**Q7. What is "hallucination" in the context of LLMs?**
Answer: When a model generates confident-sounding but factually incorrect or fabricated information, since it's generating text based on learned patterns rather than looking up verified facts.

---

## Practice Questions

**Beginner**
1. Write a zero-shot prompt and a few-shot prompt for classifying whether a sentence is a question or a statement, and compare them.
2. Explain, in your own words, why an LLM might occasionally generate incorrect information.
3. Write a Python function `call_llm_api(prompt)` (using placeholder logic) demonstrating the standard request/response pattern used to call an AI API.
4. Explain the difference between a token and a word.
5. Write out a simple conversation history list (as Python dictionaries) representing 3 turns of a conversation.

**Intermediate**
1. Implement a `cosine_similarity` function from scratch and test it on two hardcoded example vectors.
2. Design (in comments/pseudocode) a simple RAG pipeline for a customer support chatbot that answers questions using a company's FAQ document.
3. Extend the AI Chatbot mini project to save conversation history to a JSON file after each session, and reload it when the program starts.
4. Write a function that estimates a rough token count for a given string (e.g., using a simple word-count-based approximation), and explain its limitations compared to real tokenization.
5. Describe, in your own words, the difference between fine-tuning a model and using RAG.

**Challenge**
1. Build a simple keyword-based (non-embedding) FAQ retrieval system: given a list of Q&A pairs and a user question, find and return the most relevant answer based on shared keywords.
2. Design (in pseudocode) a simple AI agent with two tools (`get_weather` and `get_stock_price`), and describe how the agent would decide which tool to use for a given user question.
3. Extend the AI Chatbot mini project to include a basic tool-calling system: if the user's message contains the word "weather," call a (placeholder) `get_weather()` function and include its result in the final response.
$vv28$, 'markdown',
  jsonb_build_object('source', 'python_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'python_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- ===========================================================================
-- 4. MOCK TESTS + QUESTIONS — one 10-question, 10-minute test per topic.
-- ===========================================================================

-- Web Scraping — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'automation-data-science-ai/web-scraping')
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-py-web-scraping', $vv29$Web Scraping - Quick Test$vv29$, 'aptitude', 10, 10,
  $vv30$10 questions covering BeautifulSoup, find()/find_all(), CSS selectors, Selenium for dynamic pages, and responsible scraping.$vv30$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $vv31$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$vv31$, true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-py-web-scraping-1', 'pt-py-web-scraping',
   $vv32$What does BeautifulSoup use to parse HTML?$vv32$,
   $vv33$["A regex engine only", "A parser passed to BeautifulSoup(html, \"html.parser\")", "A JSON decoder", "An SQL query"]$vv33$::jsonb,
   1, $vv34$BeautifulSoup(html, "html.parser") passes a parser (here, Python's built-in html.parser) that BeautifulSoup uses to read and navigate the HTML.$vv34$, 1, 0),
  ('tq-py-web-scraping-2', 'pt-py-web-scraping',
   $vv35$What is the difference between .find() and .find_all()?$vv35$,
   $vv36$["No difference", ".find() returns the first match; .find_all() returns all matches as a list", ".find_all() returns the first match; .find() returns all", ".find_all() only works on JSON"]$vv36$::jsonb,
   1, $vv37$.find() returns only the first matching element; .find_all() returns every matching element as a list.$vv37$, 1, 1),
  ('tq-py-web-scraping-3', 'pt-py-web-scraping',
   $vv38$Why might requests + BeautifulSoup fail to scrape certain content?$vv38$,
   $vv39$["The site is too small", "Content loaded dynamically via JavaScript won't appear in the initial HTML", "BeautifulSoup can't parse HTML at all", "requests doesn't support GET requests"]$vv39$::jsonb,
   1, $vv40$requests only ever downloads the initial HTML sent by the server — content added afterward by JavaScript never appears in it.$vv40$, 1, 2),
  ('tq-py-web-scraping-4', 'pt-py-web-scraping',
   $vv41$What tool is used to scrape JavaScript-rendered, dynamic websites?$vv41$,
   $vv42$["csv module", "Selenium", "json module", "sqlite3"]$vv42$::jsonb,
   1, $vv43$Selenium automates a real browser, so it executes JavaScript just like a normal user's browser would, making dynamically-loaded content visible to it.$vv43$, 1, 3),
  ('tq-py-web-scraping-5', 'pt-py-web-scraping',
   $vv44$What does robots.txt indicate?$vv44$,
   $vv45$["The site's password", "Which parts of a site scrapers are allowed/disallowed to access", "The site's HTML structure", "A list of broken links"]$vv45$::jsonb,
   1, $vv46$robots.txt is a file websites publish stating which parts of the site automated scrapers are allowed or disallowed to access.$vv46$, 1, 4),
  ('tq-py-web-scraping-6', 'pt-py-web-scraping',
   $vv47$What is a responsible scraping practice?$vv47$,
   $vv48$["Sending requests as fast as possible", "Adding delays between requests to avoid overloading the server", "Ignoring robots.txt", "Never checking status codes"]$vv48$::jsonb,
   1, $vv49$Adding delays between requests avoids overloading the target server and reduces the risk of your IP address being blocked.$vv49$, 1, 5),
  ('tq-py-web-scraping-7', 'pt-py-web-scraping',
   $vv50$What does soup.select("div.product .title") use?$vv50$,
   $vv51$["XPath", "CSS selector syntax", "SQL syntax", "Regex only"]$vv51$::jsonb,
   1, $vv52$soup.select("div.product .title") uses standard CSS selector syntax to locate elements.$vv52$, 1, 6),
  ('tq-py-web-scraping-8', 'pt-py-web-scraping',
   $vv53$What does element.get("href") extract?$vv53$,
   $vv54$["The element's text", "The value of the href attribute (e.g., a URL)", "The element's class", "The parent element"]$vv54$::jsonb,
   1, $vv55$element.get("href") reads the value of that element's href attribute, typically a URL.$vv55$, 1, 7),
  ('tq-py-web-scraping-9', 'pt-py-web-scraping',
   $vv56$Why is Selenium generally slower than requests + BeautifulSoup?$vv56$,
   $vv57$["It has more bugs", "It automates a real browser, which has more overhead", "It only works on Linux", "It doesn't support loops"]$vv57$::jsonb,
   1, $vv58$Selenium controls an actual browser process, which has far more overhead than simply downloading and parsing raw HTML text.$vv58$, 1, 8),
  ('tq-py-web-scraping-10', 'pt-py-web-scraping',
   $vv59$What should you check before scraping a website?$vv59$,
   $vv60$["Nothing; scraping is always allowed", "robots.txt and the site's Terms of Service", "Only the page's color scheme", "The number of images on the page"]$vv60$::jsonb,
   1, $vv61$robots.txt and the site's Terms of Service should always be checked before scraping, since not all publicly visible data is fair game to automate.$vv61$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-py-web-scraping' and question_count <> 10;

-- Automation — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'automation-data-science-ai/automation')
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-py-automation', $vv62$Automation - Quick Test$vv62$, 'aptitude', 10, 10,
  $vv63$10 questions covering file/folder automation (os, shutil), openpyxl, smtplib, PyPDF2, and Selenium automation.$vv63$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $vv64$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$vv64$, true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-py-automation-1', 'pt-py-automation',
   $vv65$What is the difference between os and shutil?$vv65$,
   $vv66$["No difference", "os handles lower-level file/folder operations; shutil handles higher-level operations like copying/moving whole trees", "shutil is deprecated", "os can only read files"]$vv66$::jsonb,
   1, $vv67$os provides lower-level file/folder operations (listing, renaming, paths); shutil provides higher-level operations like copying or moving entire trees.$vv67$, 1, 0),
  ('tq-py-automation-2', 'pt-py-automation',
   $vv68$What does shutil.rmtree() do?$vv68$,
   $vv69$["Renames a folder", "Permanently deletes an entire folder and its contents, with no confirmation", "Creates a new folder", "Copies a folder"]$vv69$::jsonb,
   1, $vv70$shutil.rmtree() permanently deletes an entire folder and everything inside it, with no confirmation prompt and no undo.$vv70$, 1, 1),
  ('tq-py-automation-3', 'pt-py-automation',
   $vv71$Which library is used to create and edit Excel .xlsx files in Python?$vv71$,
   $vv72$["csv", "openpyxl", "json", "os"]$vv72$::jsonb,
   1, $vv73$openpyxl is the standard library for creating and editing Excel .xlsx files directly from Python.$vv73$, 1, 2),
  ('tq-py-automation-4', 'pt-py-automation',
   $vv74$What must be called after modifying an Excel workbook with openpyxl to actually save changes?$vv74$,
   $vv75$["wb.close()", "wb.save(\"file.xlsx\")", "wb.commit()", "Nothing; changes save automatically"]$vv75$::jsonb,
   1, $vv76$wb.save("file.xlsx") is required to actually write changes to disk — without it, changes only exist in memory.$vv76$, 1, 3),
  ('tq-py-automation-5', 'pt-py-automation',
   $vv77$Which module is used to send emails programmatically in Python?$vv77$,
   $vv78$["requests", "smtplib", "mailer", "os"]$vv78$::jsonb,
   1, $vv79$smtplib is Python's built-in module for sending emails programmatically via SMTP.$vv79$, 1, 4),
  ('tq-py-automation-6', 'pt-py-automation',
   $vv80$Why should email/website credentials never be hardcoded in automation scripts?$vv80$,
   $vv81$["It slows down the script", "It's a serious security risk if the code is shared or exposed", "Python doesn't allow it", "It's only a style preference"]$vv81$::jsonb,
   1, $vv82$Hardcoded credentials in source code are a serious security risk, especially if the code is ever shared or exposed publicly.$vv82$, 1, 5),
  ('tq-py-automation-7', 'pt-py-automation',
   $vv83$Which library is used to merge multiple PDF files in Python?$vv83$,
   $vv84$["openpyxl", "PyPDF2", "csv", "sqlite3"]$vv84$::jsonb,
   1, $vv85$PyPDF2 (and its actively-maintained successor, pypdf) is used to merge, split, and read PDF files in Python.$vv85$, 1, 6),
  ('tq-py-automation-8', 'pt-py-automation',
   $vv86$What does os.makedirs(folder, exist_ok=True) do?$vv86$,
   $vv87$["Deletes a folder if it exists", "Creates a folder, without raising an error if it already exists", "Renames a folder", "Lists all folders"]$vv87$::jsonb,
   1, $vv88$exist_ok=True tells os.makedirs() not to raise an error if the target folder already exists.$vv88$, 1, 7),
  ('tq-py-automation-9', 'pt-py-automation',
   $vv89$In Selenium, what method simulates typing into a form field?$vv89$,
   $vv90$[".click()", ".send_keys()", ".type()", ".enter()"]$vv90$::jsonb,
   1, $vv91$.send_keys() simulates typing text into a form field, exactly as a real user would.$vv91$, 1, 8),
  ('tq-py-automation-10', 'pt-py-automation',
   $vv92$Why should automation scripts be tested on sample/copy data first?$vv92$,
   $vv93$["It's required by Python", "To avoid accidental, irreversible damage to real, important files", "It makes the script run faster", "There's no real reason"]$vv93$::jsonb,
   1, $vv94$Testing automation scripts on sample/copy data first avoids accidental, irreversible damage to real, important files.$vv94$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-py-automation' and question_count <> 10;

-- Machine Learning — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'automation-data-science-ai/machine-learning')
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-py-machine-learning', $vv95$Machine Learning - Quick Test$vv95$, 'aptitude', 10, 10,
  $vv96$10 questions covering supervised/unsupervised learning, regression vs classification, train/test split, evaluation metrics, and core Scikit-learn algorithms.$vv96$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $vv97$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$vv97$, true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-py-machine-learning-1', 'pt-py-machine-learning',
   $vv98$What is the relationship between AI, ML, and Deep Learning?$vv98$,
   $vv99$["They are unrelated fields", "ML is a subset of AI; Deep Learning is a subset of ML", "AI is a subset of ML", "Deep Learning is broader than AI"]$vv99$::jsonb,
   1, $vv100$Machine Learning is a subset of AI, and Deep Learning is a further subset of Machine Learning — each narrower than the last.$vv100$, 1, 0),
  ('tq-py-machine-learning-2', 'pt-py-machine-learning',
   $vv101$What is the difference between supervised and unsupervised learning?$vv101$,
   $vv102$["No difference", "Supervised learning uses labeled data; unsupervised learning finds patterns in unlabeled data", "Unsupervised learning requires labels; supervised doesn't", "Supervised learning is always more accurate"]$vv102$::jsonb,
   1, $vv103$Supervised learning trains on labeled data with known correct answers; unsupervised learning finds patterns in data that has no labels at all.$vv103$, 1, 1),
  ('tq-py-machine-learning-3', 'pt-py-machine-learning',
   $vv104$What type of problem is predicting a house's exact sale price?$vv104$,
   $vv105$["Classification", "Regression", "Clustering", "Reinforcement learning"]$vv105$::jsonb,
   1, $vv106$Predicting an exact numeric price is a regression problem — the output is a continuous number, not a category.$vv106$, 1, 2),
  ('tq-py-machine-learning-4', 'pt-py-machine-learning',
   $vv107$What type of problem is spam detection (spam / not spam)?$vv107$,
   $vv108$["Regression", "Classification", "Clustering", "None of these"]$vv108$::jsonb,
   1, $vv109$Spam detection predicts a category (spam or not spam), which makes it a classification problem.$vv109$, 1, 3),
  ('tq-py-machine-learning-5', 'pt-py-machine-learning',
   $vv110$Why is a train/test split necessary?$vv110$,
   $vv111$["To make training faster", "To evaluate a model on data it has never seen, avoiding a falsely optimistic result", "It's optional and rarely used", "To reduce the dataset size permanently"]$vv111$::jsonb,
   1, $vv112$A train/test split lets you evaluate a model on data it has never seen, avoiding a falsely optimistic result from testing on its own training data.$vv112$, 1, 4),
  ('tq-py-machine-learning-6', 'pt-py-machine-learning',
   $vv113$What does the R² score measure in regression?$vv113$,
   $vv114$["Classification accuracy", "How much variation in the data the model explains", "The number of features", "Training time"]$vv114$::jsonb,
   1, $vv115$The R² score measures how much of the variation in the data the model's predictions explain, with values closer to 1 being better.$vv115$, 1, 5),
  ('tq-py-machine-learning-7', 'pt-py-machine-learning',
   $vv116$What is the difference between precision and recall?$vv116$,
   $vv117$["No difference", "Precision measures correctness of positive predictions; recall measures how many actual positives were caught", "Recall is only used in regression", "Precision is always higher than recall"]$vv117$::jsonb,
   1, $vv118$Precision measures how many of the model's positive predictions were actually correct; recall measures how many of the actual positive cases the model successfully caught.$vv118$, 1, 6),
  ('tq-py-machine-learning-8', 'pt-py-machine-learning',
   $vv119$Which algorithm is despite its name actually used for classification, not regression?$vv119$,
   $vv120$["Linear Regression", "Logistic Regression", "K-Means", "Random Forest Regressor"]$vv120$::jsonb,
   1, $vv121$Despite its name, Logistic Regression predicts a category (like pass/fail), making it a classification algorithm, not a regression one.$vv121$, 1, 7),
  ('tq-py-machine-learning-9', 'pt-py-machine-learning',
   $vv122$What does K-Means do?$vv122$,
   $vv123$["Supervised classification", "Unsupervised clustering, grouping similar data points", "Regression prediction", "Text generation"]$vv123$::jsonb,
   1, $vv124$K-Means is an unsupervised clustering algorithm that groups similar data points together without needing any labels.$vv124$, 1, 8),
  ('tq-py-machine-learning-10', 'pt-py-machine-learning',
   $vv125$What does n_estimators=100 control in a Random Forest?$vv125$,
   $vv126$["Number of features", "Number of individual decision trees built", "Number of test samples", "Learning rate"]$vv126$::jsonb,
   1, $vv127$n_estimators controls how many individual decision trees a Random Forest builds and combines.$vv127$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-py-machine-learning' and question_count <> 10;

-- Deep Learning — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'automation-data-science-ai/deep-learning')
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-py-deep-learning', $vv128$Deep Learning - Quick Test$vv128$, 'aptitude', 10, 10,
  $vv129$10 questions covering neural networks, activation and loss functions, backpropagation, tensors, CNNs, RNNs/LSTMs, and transfer learning.$vv129$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $vv130$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$vv130$, true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-py-deep-learning-1', 'pt-py-deep-learning',
   $vv131$What is the role of an activation function in a neural network?$vv131$,
   $vv132$["To store data", "To introduce non-linearity, allowing the network to learn complex patterns", "To delete unused neurons", "To speed up file reading"]$vv132$::jsonb,
   1, $vv133$An activation function introduces non-linearity, which is what lets a neural network learn complex patterns rather than behaving like a single linear equation.$vv133$, 1, 0),
  ('tq-py-deep-learning-2', 'pt-py-deep-learning',
   $vv134$Which activation function is most commonly used in hidden layers today?$vv134$,
   $vv135$["Sigmoid", "Softmax", "ReLU", "Tanh only"]$vv135$::jsonb,
   2, $vv136$ReLU is the most widely used activation function for hidden layers today, thanks to its simplicity and effectiveness.$vv136$, 1, 1),
  ('tq-py-deep-learning-3', 'pt-py-deep-learning',
   $vv137$Which activation function is typically used in the output layer for multi-class classification?$vv137$,
   $vv138$["ReLU", "Sigmoid", "Softmax", "Linear"]$vv138$::jsonb,
   2, $vv139$Softmax converts a layer's outputs into a probability distribution across multiple classes, making it the standard choice for multi-class output layers.$vv139$, 1, 2),
  ('tq-py-deep-learning-4', 'pt-py-deep-learning',
   $vv140$What is backpropagation?$vv140$,
   $vv141$["A type of neural network", "The algorithm that calculates how much each weight contributed to the error, to adjust it", "A data cleaning technique", "A type of activation function"]$vv141$::jsonb,
   1, $vv142$Backpropagation calculates how much each weight contributed to the prediction error, working backward from the output layer so the optimizer knows how to adjust each one.$vv142$, 1, 3),
  ('tq-py-deep-learning-5', 'pt-py-deep-learning',
   $vv143$What is a tensor?$vv143$,
   $vv144$["A type of loop", "A multi-dimensional array, the core data structure in deep learning", "A Python function", "A database table"]$vv144$::jsonb,
   1, $vv145$A tensor is simply a multi-dimensional array — the core data structure both PyTorch and TensorFlow are built around.$vv145$, 1, 4),
  ('tq-py-deep-learning-6', 'pt-py-deep-learning',
   $vv146$What are CNNs primarily designed for?$vv146$,
   $vv147$["Sequential text data", "Image/spatial data", "Database queries", "Sorting algorithms"]$vv147$::jsonb,
   1, $vv148$CNNs are specifically designed for image/spatial data, using convolutional layers to detect visual patterns like edges and textures.$vv148$, 1, 5),
  ('tq-py-deep-learning-7', 'pt-py-deep-learning',
   $vv149$What problem do LSTMs solve compared to plain RNNs?$vv149$,
   $vv150$["They run faster", "They better remember information over long sequences (avoiding vanishing gradients)", "They eliminate the need for training", "They only work on images"]$vv150$::jsonb,
   1, $vv151$LSTMs are designed to better remember information over long sequences, addressing the vanishing gradient problem that plain RNNs struggle with.$vv151$, 1, 6),
  ('tq-py-deep-learning-8', 'pt-py-deep-learning',
   $vv152$What is transfer learning?$vv152$,
   $vv153$["Training a model completely from scratch every time", "Reusing a pre-trained model as a starting point for a new, related task", "Transferring files between computers", "A type of activation function"]$vv153$::jsonb,
   1, $vv154$Transfer learning reuses a model already pre-trained on a large dataset as the starting point for a new, related task, instead of training entirely from scratch.$vv154$, 1, 7),
  ('tq-py-deep-learning-9', 'pt-py-deep-learning',
   $vv155$Which optimizer is a commonly used default choice in modern deep learning?$vv155$,
   $vv156$["Gradient Descent only", "Adam", "K-Means", "ReLU"]$vv156$::jsonb,
   1, $vv157$Adam is the most commonly used default optimizer in modern deep learning, thanks to strong general performance with minimal manual tuning.$vv157$, 1, 8),
  ('tq-py-deep-learning-10', 'pt-py-deep-learning',
   $vv158$What loss function is typically used for binary classification?$vv158$,
   $vv159$["Mean Squared Error", "Binary Cross-Entropy", "Categorical Cross-Entropy", "R² Score"]$vv159$::jsonb,
   1, $vv160$Binary Cross-Entropy is the standard loss function for binary (two-class) classification problems.$vv160$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-py-deep-learning' and question_count <> 10;

-- AI & Generative AI — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'automation-data-science-ai/ai-and-generative-ai')
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-py-ai-generative-ai', $vv161$AI & Generative AI - Quick Test$vv161$, 'aptitude', 10, 10,
  $vv162$10 questions covering tokens, prompt engineering, embeddings, cosine similarity, RAG, vector databases, and AI agents.$vv162$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $vv163$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$vv163$, true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-py-ai-generative-ai-1', 'pt-py-ai-generative-ai',
   $vv164$What is a token in the context of LLMs?$vv164$,
   $vv165$["A password", "A small chunk of text (word or sub-word) that an LLM processes", "A type of neural network", "A database key"]$vv165$::jsonb,
   1, $vv166$A token is the small chunk of text — sometimes a whole word, sometimes a sub-word piece — that an LLM actually processes.$vv166$, 1, 0),
  ('tq-py-ai-generative-ai-2', 'pt-py-ai-generative-ai',
   $vv167$What is prompt engineering?$vv167$,
   $vv168$["Writing Python code for AI models", "Designing input text to guide an LLM toward better output", "Training a model from scratch", "A type of hardware optimization"]$vv168$::jsonb,
   1, $vv169$Prompt engineering is the practice of designing input text (instructions, examples, structure) to guide an LLM toward better output.$vv169$, 1, 1),
  ('tq-py-ai-generative-ai-3', 'pt-py-ai-generative-ai',
   $vv170$What does an embedding represent?$vv170$,
   $vv171$["Raw text only", "A numeric vector capturing a piece of text's meaning", "A type of database", "A compiled program"]$vv171$::jsonb,
   1, $vv172$An embedding is a numeric vector that captures a piece of text's meaning, letting similarity be measured mathematically.$vv172$, 1, 2),
  ('tq-py-ai-generative-ai-4', 'pt-py-ai-generative-ai',
   $vv173$What is typically used to measure similarity between two embeddings?$vv173$,
   $vv174$["Euclidean sum", "Cosine similarity", "String comparison", "Alphabetical order"]$vv174$::jsonb,
   1, $vv175$Cosine similarity is the standard way to measure how similar two embeddings are, based on the angle between their vectors.$vv175$, 1, 3),
  ('tq-py-ai-generative-ai-5', 'pt-py-ai-generative-ai',
   $vv176$What problem does RAG (Retrieval-Augmented Generation) solve?$vv176$,
   $vv177$["Making models train faster", "Letting an LLM answer using specific, current, or private information it wasn't trained on", "Reducing token costs to zero", "Removing the need for prompts"]$vv177$::jsonb,
   1, $vv178$RAG lets an LLM answer using specific, current, or private information it was never trained on, by retrieving relevant documents and including them in the prompt.$vv178$, 1, 4),
  ('tq-py-ai-generative-ai-6', 'pt-py-ai-generative-ai',
   $vv179$Are LLMs stateful or stateless between separate API calls?$vv179$,
   $vv180$["Stateful — they remember everything automatically", "Stateless — conversation history must be resent each time", "Depends on the day", "They store memory in cookies"]$vv180$::jsonb,
   1, $vv181$LLMs are stateless between separate API calls — the full conversation history must be resent with every request for the model to have any context.$vv181$, 1, 5),
  ('tq-py-ai-generative-ai-7', 'pt-py-ai-generative-ai',
   $vv182$What is a vector database used for?$vv182$,
   $vv183$["Storing passwords", "Storing embeddings and enabling fast similarity search", "Running SQL joins", "Compiling Python code"]$vv183$::jsonb,
   1, $vv184$A vector database stores embeddings and enables fast similarity search across them, even at large scale.$vv184$, 1, 6),
  ('tq-py-ai-generative-ai-8', 'pt-py-ai-generative-ai',
   $vv185$What does "hallucination" mean in the context of LLMs?$vv185$,
   $vv186$["A hardware failure", "The model generating confident-sounding but incorrect information", "A type of encryption", "A training technique"]$vv186$::jsonb,
   1, $vv187$Hallucination is when a model generates confident-sounding but factually incorrect or fabricated information.$vv187$, 1, 7),
  ('tq-py-ai-generative-ai-9', 'pt-py-ai-generative-ai',
   $vv188$What is an AI agent's role in function/tool calling?$vv188$,
   $vv189$["It executes functions directly with no oversight", "It decides which tool to call and with what arguments; the application code executes it", "It replaces all Python code", "It only works with databases"]$vv189$::jsonb,
   1, $vv190$An AI agent's LLM decides which tool to call and with what arguments; the actual execution is always handled by the application's own code.$vv190$, 1, 8),
  ('tq-py-ai-generative-ai-10', 'pt-py-ai-generative-ai',
   $vv191$What is LangChain primarily used for?$vv191$,
   $vv192$["Replacing Python entirely", "Providing pre-built components for common LLM application patterns (chains, agents, RAG)", "Training neural networks from scratch", "Only for image generation"]$vv192$::jsonb,
   1, $vv193$LangChain provides pre-built, reusable components for common LLM application patterns like chains, agents, and RAG pipelines.$vv193$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-py-ai-generative-ai' and question_count <> 10;

-- ===========================================================================
-- 5. CODING PROBLEMS — 4 Python-only problems per topic (topic_id NULL,
--    global slug). Skips a slug already taken by any existing row (e.g. an
--    admin's).
-- ===========================================================================

-- Web Scraping — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'automation-data-science-ai/web-scraping')
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-py-web-scraping-1', null::text, $vv196$Extract Titles from Sample HTML$vv196$, 'Easy', 'py-web-scraping-extract-titles-from-html',
   $vv197$Given a set of products, build a small HTML page from them (matching the notes' own product-card structure) and use BeautifulSoup's find_all() to extract and print every title.

**Approach:** construct an HTML string with one `<div class="product">` per product, each containing a nested `<h2 class="title">`, then parse it and pull out the title text of every match.

**Input:** First line: the number of products n. Next n lines: `title,price`.

**Output:** One line per product: its title.$vv197$,
   $vv198$[{"input": "2\nWireless Headphones,$49.99\nBluetooth Speaker,$29.99", "output": "Wireless Headphones\nBluetooth Speaker"}]$vv198$::jsonb,
   $vv199$["1 <= n <= 100"]$vv199$::jsonb,
   jsonb_build_object('python', $vv194$from bs4 import BeautifulSoup

n = int(input())
products = []
for _ in range(n):
    title, price = input().split(",")
    products.append((title, price))

html = "<html><body>"
for title, price in products:
    html += f'<div class="product"><h2 class="title">{title}</h2><span class="price">{price}</span></div>'
html += "</body></html>"

# parse html and print every product title
$vv194$),
   $vv200$["BeautifulSoup(html, \"html.parser\") parses the constructed HTML into a navigable structure.", "soup.find_all(\"h2\", class_=\"title\") returns every matching <h2 class=\"title\"> element as a list.", ".text on an element gives just its visible text, without the surrounding tags."]$vv200$::jsonb,
   $vv201$[{"input": "2\nWireless Headphones,$49.99\nBluetooth Speaker,$29.99", "expected": "Wireless Headphones\nBluetooth Speaker", "hidden": false}, {"input": "1\nUSB Cable,$9.99", "expected": "USB Cable", "hidden": true}]$vv201$::jsonb,
   $vv202$Building the HTML string first (one <div class="product"> per product, each with a nested <h2 class="title">) recreates the notes' own example structure from the given input. soup.find_all("h2", class_="title") then returns every matching title element as a list, and printing each one's .text gives just the visible title text.$vv202$,
   jsonb_build_object('python', $vv195$from bs4 import BeautifulSoup

n = int(input())
products = []
for _ in range(n):
    title, price = input().split(",")
    products.append((title, price))

html = "<html><body>"
for title, price in products:
    html += f'<div class="product"><h2 class="title">{title}</h2><span class="price">{price}</span></div>'
html += "</body></html>"

soup = BeautifulSoup(html, "html.parser")
titles = soup.find_all("h2", class_="title")
for t in titles:
    print(t.text)
$vv195$),
   array['python'], 'published', false, 0),
  ('cp-py-web-scraping-2', null::text, $vv205$Extract All Links$vv205$, 'Easy', 'py-web-scraping-extract-all-links',
   $vv206$Given a set of URLs, build a small HTML page containing one `<a>` tag per URL, then extract and print every href value.

**Approach:** construct the HTML with one anchor tag per URL, parse it, find every `<a>` tag, and read each one's href attribute.

**Input:** First line: the number of links n. Next n lines: one URL each.

**Output:** One line per link: its URL.$vv206$,
   $vv207$[{"input": "2\nhttps://example.com\nhttps://test.com", "output": "https://example.com\nhttps://test.com"}]$vv207$::jsonb,
   $vv208$["1 <= n <= 100"]$vv208$::jsonb,
   jsonb_build_object('python', $vv203$from bs4 import BeautifulSoup

n = int(input())
urls = [input() for _ in range(n)]
html = "<html><body>" + "".join(f'<a href="{u}">link</a>' for u in urls) + "</body></html>"

# parse html, find every <a> tag, and print each href value
$vv203$),
   $vv209$["soup.find_all(\"a\") returns every anchor tag in the parsed HTML.", "element.get(\"href\") reads the value of that element's href attribute."]$vv209$::jsonb,
   $vv210$[{"input": "2\nhttps://example.com\nhttps://test.com", "expected": "https://example.com\nhttps://test.com", "hidden": false}, {"input": "1\nhttps://campuseduxsite.example", "expected": "https://campuseduxsite.example", "hidden": true}]$vv210$::jsonb,
   $vv211$Building one <a href="..."> tag per URL recreates a page full of links from the input. soup.find_all("a") returns every anchor element, and link.get("href") on each one reads the URL out of its href attribute, exactly as .find_all("a") + .get("href") is used in the notes.$vv211$,
   jsonb_build_object('python', $vv204$from bs4 import BeautifulSoup

n = int(input())
urls = [input() for _ in range(n)]
html = "<html><body>" + "".join(f'<a href="{u}">link</a>' for u in urls) + "</body></html>"

soup = BeautifulSoup(html, "html.parser")
links = soup.find_all("a")
for link in links:
    print(link.get("href"))
$vv204$),
   array['python'], 'published', false, 1),
  ('cp-py-web-scraping-3', null::text, $vv214$Paginated Title Collector$vv214$, 'Medium', 'py-web-scraping-paginated-title-collector',
   $vv215$Simulate scraping 3 pages of results, collecting every title (using a CSS selector, like the notes' own pagination example) into a single combined list.

**Approach:** for each of 3 given "pages" (a comma-separated line of titles standing in for that page's HTML), build a small local page, use soup.select(".title") to pull out its titles, and extend one running list across all 3 pages.

**Input:** Three lines, one per page: a comma-separated list of titles appearing on that page.

**Output:** One line: every title collected across all 3 pages, in page order, printed as a Python list.$vv215$,
   $vv216$[{"input": "A,B\nC,D\nE", "output": "['A', 'B', 'C', 'D', 'E']"}]$vv216$::jsonb,
   $vv217$["Each page has at least 1 title."]$vv217$::jsonb,
   jsonb_build_object('python', $vv212$from bs4 import BeautifulSoup

all_titles = []
for _ in range(3):
    page_titles_input = input().split(",")
    html = "<html><body>" + "".join(f'<span class="title">{t}</span>' for t in page_titles_input) + "</body></html>"
    soup = BeautifulSoup(html, "html.parser")
    # use soup.select(".title") to get this page's titles, and extend all_titles with them

print(all_titles)
$vv212$),
   $vv218$["soup.select(\".title\") uses CSS selector syntax to find every element with class=\"title\".", "Loop 3 times (once per page), extending the same all_titles list each time rather than replacing it.", "all_titles.extend(page_result) adds every item from page_result onto the end of all_titles."]$vv218$::jsonb,
   $vv219$[{"input": "A,B\nC,D\nE", "expected": "['A', 'B', 'C', 'D', 'E']", "hidden": false}, {"input": "X\nY,Z\nW", "expected": "['X', 'Y', 'Z', 'W']", "hidden": true}]$vv219$::jsonb,
   $vv220$Each of the 3 pages is built into its own tiny local HTML page (one <span class="title"> per title on that page), then soup.select(".title") extracts that page's titles using CSS selector syntax, exactly like the notes' pagination loop. Extending — not replacing — all_titles on each iteration is what collects titles from all 3 pages into one combined, in-order list.$vv220$,
   jsonb_build_object('python', $vv213$from bs4 import BeautifulSoup

all_titles = []
for _ in range(3):
    page_titles_input = input().split(",")
    html = "<html><body>" + "".join(f'<span class="title">{t}</span>' for t in page_titles_input) + "</body></html>"
    soup = BeautifulSoup(html, "html.parser")
    titles = soup.select(".title")
    for title in titles:
        all_titles.append(title.text)

print(all_titles)
$vv213$),
   array['python'], 'published', false, 2),
  ('cp-py-web-scraping-4', null::text, $vv223$Save Scraped Data to CSV$vv223$, 'Easy', 'py-web-scraping-save-scraped-data-to-csv',
   $vv224$Given a list of scraped product records, save them to a CSV file using csv.DictWriter, then read them back and print each one.

**Approach:** build a list of {"title": ..., "price": ...} dictionaries, write them with csv.DictWriter (header + rows), then reopen with csv.DictReader and print each row.

**Input:** First line: the number of products n. Next n lines: `title,price`.

**Output:** One line per product: `<title>: <price>`.$vv224$,
   $vv225$[{"input": "2\nWireless Headphones,$49.99\nBluetooth Speaker,$29.99", "output": "Wireless Headphones: $49.99\nBluetooth Speaker: $29.99"}]$vv225$::jsonb,
   $vv226$["1 <= n <= 100"]$vv226$::jsonb,
   jsonb_build_object('python', $vv221$import csv

n = int(input())
products = []
for _ in range(n):
    title, price = input().split(",")
    products.append({"title": title, "price": price})

# write products to a CSV file with csv.DictWriter, then read it back and print each "<title>: <price>" line
$vv221$),
   $vv227$["csv.DictWriter(file, fieldnames=[\"title\", \"price\"]) writes rows from a list of dictionaries — call writeheader() first, then writerows(products).", "Open the file with newline=\"\" when writing, matching the notes' own CSV convention.", "csv.DictReader(file) reads each row back as a dictionary, keyed by the header names."]$vv227$::jsonb,
   $vv228$[{"input": "2\nWireless Headphones,$49.99\nBluetooth Speaker,$29.99", "expected": "Wireless Headphones: $49.99\nBluetooth Speaker: $29.99", "hidden": false}, {"input": "1\nUSB Cable,$9.99", "expected": "USB Cable: $9.99", "hidden": true}]$vv228$::jsonb,
   $vv229$csv.DictWriter writes the header row followed by one row per product dictionary, using writeheader() then writerows(products). Reopening the file with csv.DictReader turns each row back into a dictionary keyed by "title"/"price", so printing f"{row['title']}: {row['price']}" for each one reproduces the original data.$vv229$,
   jsonb_build_object('python', $vv222$import csv

n = int(input())
products = []
for _ in range(n):
    title, price = input().split(",")
    products.append({"title": title, "price": price})

with open("products.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["title", "price"])
    writer.writeheader()
    writer.writerows(products)

with open("products.csv", "r") as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(f"{row['title']}: {row['price']}")
$vv222$),
   array['python'], 'published', false, 3)
) as v(id, topic_id, title, difficulty, slug, description,
       examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
       supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- Automation — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'automation-data-science-ai/automation')
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-py-automation-1', null::text, $vv232$Bulk File Renamer$vv232$, 'Easy', 'py-automation-bulk-file-renamer',
   $vv233$Create a set of files, then rename all of them by adding a sequential number prefix (e.g. `1_photo.jpg`, `2_photo.jpg`), matching the notes' own renaming pattern.

**Approach:** the script creates its own files first (since a fresh judge run has no pre-existing folder to work with), then loops over them in a fixed, sorted order, using os.path.splitext() to preserve each file's extension while renaming.

**Input:** One line: how many files to create and rename, n.

**Output:** One line: the resulting file names in the folder, sorted, printed as a Python list.$vv233$,
   $vv234$[{"input": "3", "output": "['1_photo.jpg', '2_photo.jpg', '3_photo.jpg']"}]$vv234$::jsonb,
   $vv235$["1 <= n <= 50"]$vv235$::jsonb,
   jsonb_build_object('python', $vv230$import os

n = int(input())
folder = "photos"
os.makedirs(folder, exist_ok=True)
for i in range(n):
    with open(os.path.join(folder, f"photo{i}.jpg"), "w") as f:
        f.write("data")

# rename every file in `folder` to "<sequential number>_photo<extension>", in sorted order

print(sorted(os.listdir(folder)))
$vv230$),
   $vv236$["sorted(os.listdir(folder)) gives a predictable, repeatable file order to rename in.", "os.path.splitext(filename)[1] gives the extension (like \".jpg\"), which should be preserved in the new name.", "os.rename(old_path, new_path) performs the actual rename, one file at a time."]$vv236$::jsonb,
   $vv237$[{"input": "3", "expected": "['1_photo.jpg', '2_photo.jpg', '3_photo.jpg']", "hidden": false}, {"input": "1", "expected": "['1_photo.jpg']", "hidden": true}]$vv237$::jsonb,
   $vv238$Since a fresh script run has no files to rename yet, it first creates n sample files itself. Looping over sorted(os.listdir(folder)) (sorted for a predictable order) and using os.path.splitext() to keep each file's extension, os.rename() gives every file a sequential "<n>_photo<ext>" name — mirroring the notes' own renaming loop exactly.$vv238$,
   jsonb_build_object('python', $vv231$import os

n = int(input())
folder = "photos"
os.makedirs(folder, exist_ok=True)
for i in range(n):
    with open(os.path.join(folder, f"photo{i}.jpg"), "w") as f:
        f.write("data")

for index, filename in enumerate(sorted(os.listdir(folder))):
    old_path = os.path.join(folder, filename)
    extension = os.path.splitext(filename)[1]
    new_path = os.path.join(folder, f"{index + 1}_photo{extension}")
    os.rename(old_path, new_path)

print(sorted(os.listdir(folder)))
$vv231$),
   array['python'], 'published', false, 0),
  ('cp-py-automation-2', null::text, $vv241$File Organizer by Extension$vv241$, 'Medium', 'py-automation-file-organizer-by-extension',
   $vv242$Create a set of files with given extensions, then organize them into type-based subfolders (`.pdf` -> PDFs/, `.jpg`/`.png` -> Images/, `.docx` -> Documents/), matching the notes' own organizer.

**Approach:** create one file per given extension, then move each into the correct subfolder (creating it if needed), and finally report which files ended up in each subfolder.

**Input:** First line: the number of files n. Next n lines: one extension each (e.g. `.pdf`).

**Output:** One line: a list of `(subfolder_name, [files])` tuples, sorted by subfolder name.$vv242$,
   $vv243$[{"input": "3\n.pdf\n.jpg\n.docx", "output": "[('Documents', ['file2.docx']), ('Images', ['file1.jpg']), ('PDFs', ['file0.pdf'])]"}]$vv243$::jsonb,
   $vv244$["1 <= n <= 20", "Each extension is one of .pdf, .jpg, .png, .docx."]$vv244$::jsonb,
   jsonb_build_object('python', $vv239$import os, shutil

n = int(input())
folder = "downloads"
os.makedirs(folder, exist_ok=True)
for i in range(n):
    ext = input().strip()
    with open(os.path.join(folder, f"file{i}{ext}"), "w") as f:
        f.write("data")

file_types = {".pdf": "PDFs", ".jpg": "Images", ".png": "Images", ".docx": "Documents"}

# move every file in `folder` into its type-based subfolder, creating it if needed

result = []
for sub in sorted(os.listdir(folder)):
    subpath = os.path.join(folder, sub)
    if os.path.isdir(subpath):
        result.append((sub, sorted(os.listdir(subpath))))
print(result)
$vv239$),
   $vv245$["os.path.splitext(filename)[1].lower() gives the file's extension, used to look up its target subfolder in file_types.", "os.makedirs(target, exist_ok=True) creates the destination subfolder if it doesn't exist yet.", "shutil.move(src, dst) actually moves the file into its subfolder."]$vv245$::jsonb,
   $vv246$[{"input": "3\n.pdf\n.jpg\n.docx", "expected": "[('Documents', ['file2.docx']), ('Images', ['file1.jpg']), ('PDFs', ['file0.pdf'])]", "hidden": false}]$vv246$::jsonb,
   $vv247$After creating one file per given extension, looping over os.listdir(folder) and looking up each file's extension in file_types gives the correct destination subfolder name; os.makedirs(..., exist_ok=True) creates it on first use, and shutil.move() relocates the file into it — exactly the notes' own organizer logic. Reporting the final subfolder contents (sorted, for predictable output) confirms everything landed in the right place.$vv247$,
   jsonb_build_object('python', $vv240$import os, shutil

n = int(input())
folder = "downloads"
os.makedirs(folder, exist_ok=True)
for i in range(n):
    ext = input().strip()
    with open(os.path.join(folder, f"file{i}{ext}"), "w") as f:
        f.write("data")

file_types = {".pdf": "PDFs", ".jpg": "Images", ".png": "Images", ".docx": "Documents"}

for filename in os.listdir(folder):
    ext = os.path.splitext(filename)[1].lower()
    if ext in file_types:
        target = os.path.join(folder, file_types[ext])
        os.makedirs(target, exist_ok=True)
        shutil.move(os.path.join(folder, filename), os.path.join(target, filename))

result = []
for sub in sorted(os.listdir(folder)):
    subpath = os.path.join(folder, sub)
    if os.path.isdir(subpath):
        result.append((sub, sorted(os.listdir(subpath))))
print(result)
$vv240$),
   array['python'], 'published', false, 1),
  ('cp-py-automation-3', null::text, $vv250$Excel Report from a List$vv250$, 'Easy', 'py-automation-excel-report-from-a-list',
   $vv251$Create an Excel file with product data using openpyxl, then read it back and print every row.

**Approach:** build a workbook, append a header row plus one row per product, save it, then reload it and print each row's values.

**Input:** First line: the number of products n. Next n lines: `name,price`.

**Output:** One line per row (including the header): the row's values as a tuple.$vv251$,
   $vv252$[{"input": "2\nPen,10\nNotebook,50", "output": "('Name', 'Price')\n('Pen', 10)\n('Notebook', 50)"}]$vv252$::jsonb,
   $vv253$["1 <= n <= 100"]$vv253$::jsonb,
   jsonb_build_object('python', $vv248$from openpyxl import Workbook, load_workbook

n = int(input())
products = []
for _ in range(n):
    name, price = input().split(",")
    products.append((name, float(price)))

# create a workbook, append a header row + one row per product, save it, then reload and print every row
$vv248$),
   $vv254$["wb = Workbook(); sheet = wb.active gives you a fresh worksheet to write into.", "sheet.append([...]) adds one new row at a time — append the header first, then one row per product.", "Don't forget wb.save(\"products.xlsx\") — without it, nothing is written to disk.", "load_workbook(\"products.xlsx\").active.iter_rows(values_only=True) reads every row back as a plain tuple of values."]$vv254$::jsonb,
   $vv255$[{"input": "2\nPen,10\nNotebook,50", "expected": "('Name', 'Price')\n('Pen', 10)\n('Notebook', 50)", "hidden": false}]$vv255$::jsonb,
   $vv256$sheet.append([...]) adds the header row and then one row per product in order; wb.save(...) is what actually writes the file to disk. Reloading it with load_workbook() and looping over sheet.iter_rows(values_only=True) reads every row back as a plain tuple — whole-number prices come back as plain integers (not 10.0), since Excel doesn't distinguish a whole-number float from an integer internally.$vv256$,
   jsonb_build_object('python', $vv249$from openpyxl import Workbook, load_workbook

n = int(input())
products = []
for _ in range(n):
    name, price = input().split(",")
    products.append((name, float(price)))

wb = Workbook()
sheet = wb.active
sheet.title = "Products"
sheet.append(["Name", "Price"])
for name, price in products:
    sheet.append([name, price])
wb.save("products.xlsx")

wb2 = load_workbook("products.xlsx")
sheet2 = wb2.active
for row in sheet2.iter_rows(values_only=True):
    print(row)
$vv249$),
   array['python'], 'published', false, 2),
  ('cp-py-automation-4', null::text, $vv259$PDF Merger$vv259$, 'Medium', 'py-automation-pdf-merger',
   $vv260$Create several small PDF files (each with a given number of blank pages) and merge them into a single combined PDF, then report its total page count.

**Why create the PDFs first?** a judge sandbox has no pre-existing PDF files to merge, so the script builds its own simple ones first (using PdfWriter.add_blank_page()), then merges them — testing the actual merge operation the notes cover, just without needing real report files handed to it.

**Note on the library:** the notes teach `PyPDF2`'s `PdfMerger`; this uses `pypdf` (PyPDF2's actively-maintained successor — recent PyPDF2 releases are themselves just a thin wrapper around it) and `PdfWriter.append()`, which is the current recommended way to merge PDFs, since `PdfMerger` has been removed in modern pypdf versions.

**Approach:** build one small PDF per given page count, then append each into one combined PdfWriter, save it, and report the merged file's total page count.

**Input:** One line: space-separated page counts, one per PDF to create and merge.

**Output:** One line: `Total pages: <sum of all page counts>`.$vv260$,
   $vv261$[{"input": "2 3 1", "output": "Total pages: 6"}]$vv261$::jsonb,
   $vv262$["1 <= number of PDFs <= 10", "1 <= each page count <= 20"]$vv262$::jsonb,
   jsonb_build_object('python', $vv257$from pypdf import PdfWriter, PdfReader

page_counts = list(map(int, input().split()))
filenames = []
for i, count in enumerate(page_counts):
    writer = PdfWriter()
    for _ in range(count):
        writer.add_blank_page(width=200, height=200)
    filename = f"report{i+1}.pdf"
    with open(filename, "wb") as f:
        writer.write(f)
    filenames.append(filename)

# merge all the files in `filenames` into one combined PDF using PdfWriter.append(), then print its total page count
$vv257$),
   $vv263$["A fresh PdfWriter() can build the merged output — call .append(filename) once per file you want to add, in order.", "merged_writer.write(\"combined_report.pdf\") saves the merged result.", "PdfReader(\"combined_report.pdf\").pages gives you the final page list — its length is the total page count."]$vv263$::jsonb,
   $vv264$[{"input": "2 3 1", "expected": "Total pages: 6", "hidden": false}, {"input": "1 1 1", "expected": "Total pages: 3", "hidden": true}]$vv264$::jsonb,
   $vv265$Each input page count becomes its own tiny PDF, built with PdfWriter.add_blank_page(). Merging is then just calling .append(filename) on a fresh PdfWriter once per file, in order, and writing the result out — this is pypdf's modern replacement for the notes' PdfMerger, which newer pypdf releases have removed entirely. Reading the merged file back and counting len(reader.pages) confirms every page from every source file made it into the combined PDF.$vv265$,
   jsonb_build_object('python', $vv258$from pypdf import PdfWriter, PdfReader

page_counts = list(map(int, input().split()))
filenames = []
for i, count in enumerate(page_counts):
    writer = PdfWriter()
    for _ in range(count):
        writer.add_blank_page(width=200, height=200)
    filename = f"report{i+1}.pdf"
    with open(filename, "wb") as f:
        writer.write(f)
    filenames.append(filename)

merged_writer = PdfWriter()
for filename in filenames:
    merged_writer.append(filename)
merged_writer.write("combined_report.pdf")
merged_writer.close()

reader = PdfReader("combined_report.pdf")
print(f"Total pages: {len(reader.pages)}")
$vv258$),
   array['python'], 'published', false, 3)
) as v(id, topic_id, title, difficulty, slug, description,
       examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
       supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- Machine Learning — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'automation-data-science-ai/machine-learning')
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-py-machine-learning-1', null::text, $vv268$Train/Test Split and Linear Regression$vv268$, 'Easy', 'py-machine-learning-train-test-split-linear-regression',
   $vv269$Using the notes' own hours-studied-vs-exam-scores dataset, split it with train_test_split, train a LinearRegression model, and predict the score for a given number of study hours.

**Approach:** use the exact dataset, test_size, and random_state from the notes so the split is reproducible, fit a LinearRegression, then predict for the given hours value.

**Input:** One line: the number of hours studied to predict a score for.

**Output:** One line: the predicted exam score, to 2 decimal places.$vv269$,
   $vv270$[{"input": "7.5", "output": "85.88"}]$vv270$::jsonb,
   $vv271$["0 <= hours <= 24"]$vv271$::jsonb,
   jsonb_build_object('python', $vv266$from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split

hours_studied = [[1], [2], [3], [4], [5], [6], [7], [8]]
exam_scores = [35, 45, 50, 60, 65, 75, 82, 90]

X_train, X_test, y_train, y_test = train_test_split(hours_studied, exam_scores, test_size=0.25, random_state=42)

# train a LinearRegression model on X_train/y_train, predict for the given input hours, print to 2 decimal places
$vv266$),
   $vv272$["model.fit(X_train, y_train) trains the model on the training split only.", "model.predict([[hours]]) expects a 2D list — one row, one feature — matching the shape of hours_studied.", "random_state=42 makes the train/test split reproducible, so the same input always gives the same trained model and prediction."]$vv272$::jsonb,
   $vv273$[{"input": "7.5", "expected": "85.88", "hidden": false}]$vv273$::jsonb,
   $vv274$Using the exact same dataset, test_size, and random_state as the notes guarantees the train/test split — and therefore the fitted model — is identical every run. model.fit(X_train, y_train) trains on just the training portion, and model.predict([[hours]]) then applies the learned line to the requested input.$vv274$,
   jsonb_build_object('python', $vv267$from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split

hours_studied = [[1], [2], [3], [4], [5], [6], [7], [8]]
exam_scores = [35, 45, 50, 60, 65, 75, 82, 90]

X_train, X_test, y_train, y_test = train_test_split(hours_studied, exam_scores, test_size=0.25, random_state=42)

model = LinearRegression()
model.fit(X_train, y_train)

new_hours = float(input())
prediction = model.predict([[new_hours]])
print(f"{prediction[0]:.2f}")
$vv267$),
   array['python'], 'published', false, 0),
  ('cp-py-machine-learning-2', null::text, $vv277$Pass/Fail Classifier$vv277$, 'Medium', 'py-machine-learning-pass-fail-classifier',
   $vv278$Using the notes' own pass/fail dataset (hours studied + attendance), train a LogisticRegression model and calculate its accuracy on the held-out test set.

**Approach:** reuse the exact dataset, test_size, and random_state from the notes' mini project, fit LogisticRegression, predict on X_test, and print the accuracy percentage.

**Input:** No input.

**Output:** One line: `Accuracy: <percentage>%`, to 2 decimal places.$vv278$,
   $vv279$[{"input": "", "output": "Accuracy: 100.00%"}]$vv279$::jsonb,
   $vv280$[]$vv280$::jsonb,
   jsonb_build_object('python', $vv275$from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

X = [[1,50],[2,55],[3,60],[4,65],[5,70],[6,75],[7,85],[8,90],[9,95],[10,98]]
y = [0,0,0,0,1,1,1,1,1,1]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

# train a LogisticRegression model, predict on X_test, and print its accuracy as a percentage (2 decimal places)
$vv275$),
   $vv281$["accuracy_score(y_test, predictions) compares predicted labels to the real ones and returns the fraction correct.", "Multiply by 100 and format with :.2f to print it as a percentage."]$vv281$::jsonb,
   $vv282$[{"input": "", "expected": "Accuracy: 100.00%", "hidden": false}]$vv282$::jsonb,
   $vv283$With the fixed random_state=42 split, the same 7 training / 3 testing examples are used every run. Fitting LogisticRegression on the training portion and calling accuracy_score(y_test, predictions) on the test portion measures exactly how many of those held-out predictions matched their real pass/fail label — matching the notes' own mini-project result of 100% on this small, clearly-separable dataset.$vv283$,
   jsonb_build_object('python', $vv276$from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

X = [[1,50],[2,55],[3,60],[4,65],[5,70],[6,75],[7,85],[8,90],[9,95],[10,98]]
y = [0,0,0,0,1,1,1,1,1,1]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

model = LogisticRegression()
model.fit(X_train, y_train)
predictions = model.predict(X_test)
accuracy = accuracy_score(y_test, predictions)
print(f"Accuracy: {accuracy * 100:.2f}%")
$vv276$),
   array['python'], 'published', false, 1),
  ('cp-py-machine-learning-3', null::text, $vv286$Decision Tree vs Random Forest Comparison$vv286$, 'Medium', 'py-machine-learning-decision-tree-vs-random-forest',
   $vv287$Using the notes' own customer-purchase dataset, train both a DecisionTreeClassifier and a RandomForestClassifier, and compare their predictions for a given new customer.

**Approach:** fit both models (with a fixed random_state for reproducibility) on the same small dataset, then predict for the given [age, income] pair with each.

**Input:** Two lines: a customer's age, then their income.

**Output:** Two lines: the Decision Tree's prediction, then the Random Forest's prediction (0 or 1).$vv287$,
   $vv288$[{"input": "30\n55000", "output": "Decision Tree: 0\nRandom Forest: 0"}]$vv288$::jsonb,
   $vv289$["18 <= age <= 100", "0 <= income <= 10000000"]$vv289$::jsonb,
   jsonb_build_object('python', $vv284$from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier

features = [[25, 50000], [45, 80000], [35, 60000], [22, 30000], [50, 90000]]
buys_product = [0, 1, 0, 0, 1]

age = int(input())
income = int(input())

# train a DecisionTreeClassifier and a RandomForestClassifier (both with random_state=42), predict for [age, income] with each, and print both
$vv284$),
   $vv290$["DecisionTreeClassifier(random_state=42) and RandomForestClassifier(n_estimators=100, random_state=42) — set random_state on both so results are reproducible.", "Both models are trained the exact same way: model.fit(features, buys_product).", "model.predict([[age, income]]) returns a list with one prediction — take element [0]."]$vv290$::jsonb,
   $vv291$[{"input": "30\n55000", "expected": "Decision Tree: 0\nRandom Forest: 0", "hidden": false}]$vv291$::jsonb,
   $vv292$Both models are trained on the identical small dataset from the notes, each with a fixed random_state so their internal randomness (tree-building order, bootstrap sampling for the forest) is reproducible. Calling .predict([[age, income]]) on each trained model gives its classification for the new customer — printing both side by side is exactly the "comparison" the problem asks for.$vv292$,
   jsonb_build_object('python', $vv285$from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier

features = [[25, 50000], [45, 80000], [35, 60000], [22, 30000], [50, 90000]]
buys_product = [0, 1, 0, 0, 1]

age = int(input())
income = int(input())

tree_model = DecisionTreeClassifier(random_state=42)
tree_model.fit(features, buys_product)
tree_prediction = tree_model.predict([[age, income]])

forest_model = RandomForestClassifier(n_estimators=100, random_state=42)
forest_model.fit(features, buys_product)
forest_prediction = forest_model.predict([[age, income]])

print(f"Decision Tree: {tree_prediction[0]}")
print(f"Random Forest: {forest_prediction[0]}")
$vv285$),
   array['python'], 'published', false, 2),
  ('cp-py-machine-learning-4', null::text, $vv295$Customer Segmentation with K-Means$vv295$, 'Medium', 'py-machine-learning-customer-segmentation-kmeans',
   $vv296$Group customers into 3 clusters using K-Means based on age and spending, and report which customers ended up in the same group together.

**Why report groupings instead of raw cluster numbers?** K-Means assigns each cluster an arbitrary integer label (0, 1, 2, ...) that isn't guaranteed to come out the same way across every environment, even with a fixed random_state — but WHICH customers end up grouped together is stable. Printing customer-index groups (sorted by their smallest member) sidesteps that arbitrary-numbering issue entirely.

**Approach:** fit KMeans(n_clusters=3, random_state=42, n_init=10) on the customer data, then group customer indices by their assigned label and sort the groups for a deterministic, label-order-independent result.

**Input:** No input.

**Output:** One line: the customer index groups, sorted by each group's smallest index, printed as a Python list of lists.$vv296$,
   $vv297$[{"input": "", "output": "[[0, 1, 2], [3, 4, 5], [6, 7]]"}]$vv297$::jsonb,
   $vv298$[]$vv298$::jsonb,
   jsonb_build_object('python', $vv293$from sklearn.cluster import KMeans
from collections import defaultdict

customer_data = [[20, 15000], [22, 18000], [25, 20000],
                 [45, 80000], [48, 85000], [50, 90000],
                 [65, 40000], [68, 42000]]

# fit KMeans(n_clusters=3, random_state=42, n_init=10), group customer indices by cluster label,
# then print the groups sorted by each group's smallest index
$vv293$),
   $vv299$["model.labels_ gives the cluster label (an arbitrary int) assigned to each customer, in order.", "A defaultdict(list) makes it easy to collect customer indices by their label: groups[label].append(idx).", "sorted(groups.values(), key=lambda g: g[0]) orders the groups by their smallest member index, avoiding any dependence on the arbitrary label numbers themselves."]$vv299$::jsonb,
   $vv300$[{"input": "", "expected": "[[0, 1, 2], [3, 4, 5], [6, 7]]", "hidden": false}]$vv300$::jsonb,
   $vv301$The 8 customers form 3 naturally separated groups by age and spending (young/low-spend, middle-aged/high-spend, older/medium-spend), which KMeans(n_clusters=3, random_state=42, n_init=10) finds reliably. Rather than printing the raw (arbitrarily-numbered) labels_, grouping customer indices by their label and sorting the groups by their smallest index gives a result that only depends on which customers end up together — not on which integer K-Means happened to call that group — making it safe to grade exact-match.$vv301$,
   jsonb_build_object('python', $vv294$from sklearn.cluster import KMeans
from collections import defaultdict

customer_data = [[20, 15000], [22, 18000], [25, 20000],
                 [45, 80000], [48, 85000], [50, 90000],
                 [65, 40000], [68, 42000]]

model = KMeans(n_clusters=3, random_state=42, n_init=10)
model.fit(customer_data)

groups = defaultdict(list)
for idx, label in enumerate(model.labels_):
    groups[label].append(idx)

result = sorted(groups.values(), key=lambda g: g[0])
print(result)
$vv294$),
   array['python'], 'published', false, 3)
) as v(id, topic_id, title, difficulty, slug, description,
       examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
       supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- Deep Learning — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'automation-data-science-ai/deep-learning')
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-py-deep-learning-1', null::text, $vv304$Activation Functions From Scratch$vv304$, 'Easy', 'py-deep-learning-activation-functions-from-scratch',
   $vv305$Implement ReLU and Sigmoid from scratch (pure math, exactly as the notes' own conceptual relu() example does) and apply both to a list of numbers.

**Why not build this in Keras/PyTorch?** those frameworks are large, GPU-oriented libraries very unlikely to be available in a lightweight code-execution sandbox, and even training a tiny network introduces its own floating-point non-determinism across environments — but the activation functions THEMSELVES are just plain math (the notes' own relu() example already shows this), so this tests that underlying concept directly, dependency-free.

**Approach:** relu(x) is max(0, x); sigmoid(x) is 1 / (1 + e^-x) using math.exp. Apply both to every given number.

**Input:** One line: space-separated numbers.

**Output:** Two lines: the ReLU of each number as a list, then the Sigmoid of each number as a list (each value rounded to 4 decimal places).$vv305$,
   $vv306$[{"input": "-3 0 2 5", "output": "[0, 0, 2.0, 5.0]\n[0.0474, 0.5, 0.8808, 0.9933]"}]$vv306$::jsonb,
   $vv307$["1 <= count of numbers <= 20"]$vv307$::jsonb,
   jsonb_build_object('python', $vv302$import math

def relu(x):
    # return x if positive, otherwise 0
    pass

def sigmoid(x):
    # return 1 / (1 + e^-x)
    pass

numbers = list(map(float, input().split()))
print([round(relu(x), 4) for x in numbers])
print([round(sigmoid(x), 4) for x in numbers])
$vv302$),
   $vv308$["relu(x) is exactly max(0, x) — the notes' own example.", "sigmoid(x) is 1 / (1 + math.exp(-x)); import math for exp().", "Round each result to 4 decimal places with round(value, 4) before printing."]$vv308$::jsonb,
   $vv309$[{"input": "-3 0 2 5", "expected": "[0, 0, 2.0, 5.0]\n[0.0474, 0.5, 0.8808, 0.9933]", "hidden": false}, {"input": "1", "expected": "[1.0]\n[0.7311]", "hidden": true}]$vv309$::jsonb,
   $vv310$relu(x) = max(0, x) — the exact conceptual example from the notes. sigmoid(x) = 1 / (1 + e^-x) squeezes any real number into the range (0, 1). Applying both to every input value and rounding to 4 decimal places gives a fully deterministic, dependency-free way to test genuine understanding of what these activation functions actually compute.$vv310$,
   jsonb_build_object('python', $vv303$import math

def relu(x):
    return max(0, x)

def sigmoid(x):
    return 1 / (1 + math.exp(-x))

numbers = list(map(float, input().split()))
print([round(relu(x), 4) for x in numbers])
print([round(sigmoid(x), 4) for x in numbers])
$vv303$),
   array['python'], 'published', false, 0),
  ('cp-py-deep-learning-2', null::text, $vv313$Single Neuron Forward Pass$vv313$, 'Easy', 'py-deep-learning-single-neuron-forward-pass',
   $vv314$Manually compute a single neuron's output, following the notes' own formula exactly: `output = activation((input1 x weight1) + (input2 x weight2) + ... + bias)`.

**Approach:** compute the weighted sum of inputs and weights, add the bias, then apply ReLU as the activation function.

**Input:** Three lines: the inputs (space-separated), the weights (space-separated, same count as inputs), and the bias.

**Output:** One line: the neuron's output, rounded to 4 decimal places.$vv314$,
   $vv315$[{"input": "1 2 3\n0.5 -0.5 1\n0.1", "output": "2.6"}]$vv315$::jsonb,
   $vv316$["1 <= number of inputs <= 10"]$vv316$::jsonb,
   jsonb_build_object('python', $vv311$inputs = list(map(float, input().split()))
weights = list(map(float, input().split()))
bias = float(input())

def neuron_output(inputs, weights, bias):
    # weighted sum + bias, then ReLU
    pass

print(round(neuron_output(inputs, weights, bias), 4))
$vv311$),
   $vv317$["zip(inputs, weights) pairs up each input with its matching weight.", "sum(i * w for i, w in zip(inputs, weights)) computes the weighted sum in one line.", "Add the bias, then apply ReLU (max(0, total)) as the activation — matching the notes' single-neuron formula exactly."]$vv317$::jsonb,
   $vv318$[{"input": "1 2 3\n0.5 -0.5 1\n0.1", "expected": "2.6", "hidden": false}, {"input": "1 1\n-1 -1\n0", "expected": "0", "hidden": true}]$vv318$::jsonb,
   $vv319$sum(i * w for i, w in zip(inputs, weights)) computes (input1 x weight1) + (input2 x weight2) + ... in one expression, matching the notes' formula term for term. Adding the bias and applying ReLU (max(0, total)) as the activation function reproduces exactly what a single neuron computes during a forward pass, entirely in plain Python.$vv319$,
   jsonb_build_object('python', $vv312$inputs = list(map(float, input().split()))
weights = list(map(float, input().split()))
bias = float(input())

def neuron_output(inputs, weights, bias):
    total = sum(i * w for i, w in zip(inputs, weights)) + bias
    return max(0, total)

print(round(neuron_output(inputs, weights, bias), 4))
$vv312$),
   array['python'], 'published', false, 1),
  ('cp-py-deep-learning-3', null::text, $vv322$Mean Squared Error Loss From Scratch$vv322$, 'Easy', 'py-deep-learning-mse-loss-from-scratch',
   $vv323$Implement Mean Squared Error (MSE) — the notes' own regression loss function — from scratch, and compute it for a set of predictions against the actual values.

**Approach:** MSE is the average of the squared difference between each prediction and its corresponding actual value.

**Input:** Two lines: the predicted values (space-separated), then the actual values (space-separated, same count).

**Output:** One line: the MSE, rounded to 4 decimal places.$vv323$,
   $vv324$[{"input": "3 5 2.5\n2.5 5 4", "output": "0.8333"}]$vv324$::jsonb,
   $vv325$["1 <= count of values <= 20"]$vv325$::jsonb,
   jsonb_build_object('python', $vv320$predictions = list(map(float, input().split()))
actuals = list(map(float, input().split()))

def mse(preds, actuals):
    # average of (prediction - actual) squared, across all pairs
    pass

print(round(mse(predictions, actuals), 4))
$vv320$),
   $vv326$["zip(preds, actuals) pairs up each prediction with its matching actual value.", "(p - a) ** 2 is the squared error for one pair; sum them all up and divide by the count."]$vv326$::jsonb,
   $vv327$[{"input": "3 5 2.5\n2.5 5 4", "expected": "0.8333", "hidden": false}, {"input": "1 1\n1 1", "expected": "0.0", "hidden": true}]$vv327$::jsonb,
   $vv328$MSE is defined as the average of the squared differences between each prediction and its actual value: sum((p - a) ** 2 for p, a in zip(preds, actuals)) / len(preds). A lower MSE means the predictions are, on average, closer to the true values — exactly the quantity a regression model's training tries to minimize.$vv328$,
   jsonb_build_object('python', $vv321$predictions = list(map(float, input().split()))
actuals = list(map(float, input().split()))

def mse(preds, actuals):
    return sum((p - a) ** 2 for p, a in zip(preds, actuals)) / len(preds)

print(round(mse(predictions, actuals), 4))
$vv321$),
   array['python'], 'published', false, 2),
  ('cp-py-deep-learning-4', null::text, $vv331$Manual Max Pooling$vv331$, 'Medium', 'py-deep-learning-manual-max-pooling',
   $vv332$Given a 4x4 grid of numbers, apply 2x2 max pooling (stride 2) manually — the exact operation MaxPooling2D performs inside a CNN, shrinking the data while keeping only the most important value from each region.

**Approach:** slide a non-overlapping 2x2 window across the grid, taking the maximum value in each window to build a smaller 2x2 output grid.

**Input:** Four lines: the 4x4 grid, one row of 4 space-separated numbers per line.

**Output:** Two lines: the resulting 2x2 pooled grid, one row per line, each printed as a Python list.$vv332$,
   $vv333$[{"input": "1 3 2 4\n5 6 7 8\n3 2 1 0\n1 2 3 4", "output": "[6, 8]\n[3, 4]"}]$vv333$::jsonb,
   $vv334$["Values are whole numbers."]$vv334$::jsonb,
   jsonb_build_object('python', $vv329$grid = []
for _ in range(4):
    row = list(map(int, input().split()))
    grid.append(row)

# apply 2x2 max pooling with stride 2, producing a 2x2 output grid, and print each output row
$vv329$),
   $vv335$["Step through the grid in 2x2 blocks: rows 0-1 then rows 2-3, and within each, columns 0-1 then columns 2-3.", "Each output cell is the max of the 4 values in its corresponding 2x2 input block.", "range(0, 4, 2) gives the top-left corner (0 or 2) of each block along one axis."]$vv335$::jsonb,
   $vv336$[{"input": "1 3 2 4\n5 6 7 8\n3 2 1 0\n1 2 3 4", "expected": "[6, 8]\n[3, 4]", "hidden": false}]$vv336$::jsonb,
   $vv337$Max pooling slides a non-overlapping window (here 2x2) across the input, keeping only the maximum value from each window — exactly what MaxPooling2D does inside a CNN to shrink the data while preserving its strongest detected features. Iterating the grid in steps of 2 along both axes and taking max() of each 2x2 block's 4 values builds the smaller output grid directly, in pure Python.$vv337$,
   jsonb_build_object('python', $vv330$grid = []
for _ in range(4):
    row = list(map(int, input().split()))
    grid.append(row)

pooled = []
for i in range(0, 4, 2):
    pooled_row = []
    for j in range(0, 4, 2):
        window = [grid[i][j], grid[i][j+1], grid[i+1][j], grid[i+1][j+1]]
        pooled_row.append(max(window))
    pooled.append(pooled_row)

for row in pooled:
    print(row)
$vv330$),
   array['python'], 'published', false, 3)
) as v(id, topic_id, title, difficulty, slug, description,
       examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
       supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- AI & Generative AI — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'python-tutorial'),
tp as (select id from public.learning_topics where source_kind = 'python_tutorial' and source_ref = 'automation-data-science-ai/ai-and-generative-ai')
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-py-ai-generative-ai-1', null::text, $vv340$Cosine Similarity Function$vv340$, 'Easy', 'py-ai-generative-ai-cosine-similarity-function',
   $vv341$Implement cosine_similarity(vec1, vec2) from scratch using NumPy, exactly as shown in the notes, and test it on two given vectors.

**Approach:** compute the dot product of the two vectors, divide by the product of their magnitudes (norms).

**Input:** Two lines: the two vectors, each as space-separated numbers of the same length.

**Output:** One line: the cosine similarity, to 4 decimal places.$vv341$,
   $vv342$[{"input": "1 0 0\n1 0 0", "output": "1.0000"}]$vv342$::jsonb,
   $vv343$["Neither vector is all zeros."]$vv343$::jsonb,
   jsonb_build_object('python', $vv338$import numpy as np

def cosine_similarity(vec1, vec2):
    # dot product divided by the product of the two vectors' norms
    pass

vec1 = list(map(float, input().split()))
vec2 = list(map(float, input().split()))
print(f"{cosine_similarity(vec1, vec2):.4f}")
$vv338$),
   $vv344$["np.dot(vec1, vec2) computes the dot product.", "np.linalg.norm(vec) computes a vector's magnitude (length).", "Cosine similarity is dot_product / (norm1 * norm2) — a value close to 1 means very similar direction/meaning."]$vv344$::jsonb,
   $vv345$[{"input": "1 0 0\n1 0 0", "expected": "1.0000", "hidden": false}, {"input": "1 0\n0 1", "expected": "0.0000", "hidden": true}]$vv345$::jsonb,
   $vv346$Cosine similarity measures the angle between two vectors: np.dot(vec1, vec2) gives their dot product, and dividing by the product of both vectors' magnitudes (np.linalg.norm) normalizes away any difference in length, leaving just a measure of direction — 1 for identical direction (perfectly similar), 0 for perpendicular (unrelated), matching the notes' own explanation exactly.$vv346$,
   jsonb_build_object('python', $vv339$import numpy as np

def cosine_similarity(vec1, vec2):
    dot_product = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    return dot_product / (norm1 * norm2)

vec1 = list(map(float, input().split()))
vec2 = list(map(float, input().split()))
print(f"{cosine_similarity(vec1, vec2):.4f}")
$vv339$),
   array['python'], 'published', false, 0),
  ('cp-py-ai-generative-ai-2', null::text, $vv349$Conversation History Builder$vv349$, 'Easy', 'py-ai-generative-ai-conversation-history-builder',
   $vv350$Build a conversation history list — the same {"role": ..., "content": ...} structure every chat-based AI API expects — from a system prompt and an alternating sequence of user/assistant messages.

**Approach:** start the history with the system message, then append each given message, alternating role "user" then "assistant" as the notes' own chatbot pattern does.

**Input:** First line: the system prompt. Second line: how many messages follow, n. Next n lines: the messages, alternating user then assistant.

**Output:** One line per history entry (n + 1 total): the entry as a Python dict.$vv350$,
   $vv351$[{"input": "You are helpful.\n2\nHi\nHello!", "output": "{'role': 'system', 'content': 'You are helpful.'}\n{'role': 'user', 'content': 'Hi'}\n{'role': 'assistant', 'content': 'Hello!'}"}]$vv351$::jsonb,
   $vv352$["0 <= n <= 20"]$vv352$::jsonb,
   jsonb_build_object('python', $vv347$def build_history(system_prompt, turns):
    history = [{"role": "system", "content": system_prompt}]
    # append each message in turns, alternating role "user" then "assistant"
    return history

system_prompt = input()
n = int(input())
turns = [input() for _ in range(n)]
history = build_history(system_prompt, turns)
for entry in history:
    print(entry)
$vv347$),
   $vv353$["The system message always comes first, with role \"system\".", "Even-indexed turns (0, 2, 4, ...) are from the \"user\"; odd-indexed turns are from the \"assistant\" — i % 2 == 0 checks this.", "Each entry is a dict: {\"role\": role, \"content\": message}."]$vv353$::jsonb,
   $vv354$[{"input": "You are helpful.\n2\nHi\nHello!", "expected": "{'role': 'system', 'content': 'You are helpful.'}\n{'role': 'user', 'content': 'Hi'}\n{'role': 'assistant', 'content': 'Hello!'}", "hidden": false}, {"input": "Be concise.\n0", "expected": "{'role': 'system', 'content': 'Be concise.'}", "hidden": true}]$vv354$::jsonb,
   $vv355$The history always starts with one system-role entry. Looping over the given turns with enumerate(), even indices (0, 2, 4, ...) are labeled "user" and odd indices "assistant" (i % 2 == 0), matching a normal back-and-forth conversation — exactly the {"role": ..., "content": ...} list structure the notes show being resent on every API call.$vv355$,
   jsonb_build_object('python', $vv348$def build_history(system_prompt, turns):
    history = [{"role": "system", "content": system_prompt}]
    for i, message in enumerate(turns):
        role = "user" if i % 2 == 0 else "assistant"
        history.append({"role": role, "content": message})
    return history

system_prompt = input()
n = int(input())
turns = [input() for _ in range(n)]
history = build_history(system_prompt, turns)
for entry in history:
    print(entry)
$vv348$),
   array['python'], 'published', false, 1),
  ('cp-py-ai-generative-ai-3', null::text, $vv358$Keyword-Based FAQ Matcher$vv358$, 'Medium', 'py-ai-generative-ai-keyword-based-faq-matcher',
   $vv359$Given a list of FAQ (question, answer) pairs and a user's question, find the FAQ answer whose question shares the most keywords with the user's question — a simple, non-embedding retrieval approach.

**Approach:** turn both the user's question and each FAQ question into a set of lowercased words, count the overlap, and return the answer for whichever FAQ has the highest overlap (first one wins on a tie).

**Input:** First line: the number of FAQs n. Next n lines: `question|answer`. Final line: the user's question.

**Output:** One line: the best-matching FAQ's answer.$vv359$,
   $vv360$[{"input": "3\nHow do I reset my password|Go to settings and click reset\nWhat are your hours|We are open 9 to 5\nHow do I contact support|Email support@example.com\nHow can I reset my password please", "output": "Go to settings and click reset"}]$vv360$::jsonb,
   $vv361$["1 <= n <= 100"]$vv361$::jsonb,
   jsonb_build_object('python', $vv356$def find_best_match(faqs, user_question):
    user_keywords = set(user_question.lower().split())
    best_answer = None
    best_overlap = -1
    for question, answer in faqs:
        # count overlap between this FAQ's keywords and user_keywords, keep the best
        pass
    return best_answer

n = int(input())
faqs = []
for _ in range(n):
    line = input()
    q, a = line.split("|")
    faqs.append((q, a))
user_question = input()
print(find_best_match(faqs, user_question))
$vv356$),
   $vv362$["set(text.lower().split()) turns a sentence into a set of lowercased words.", "The & operator between two sets gives their intersection — the shared keywords.", "Track the best (question, answer) seen so far as you loop, updating only when a strictly higher overlap is found."]$vv362$::jsonb,
   $vv363$[{"input": "3\nHow do I reset my password|Go to settings and click reset\nWhat are your hours|We are open 9 to 5\nHow do I contact support|Email support@example.com\nHow can I reset my password please", "expected": "Go to settings and click reset", "hidden": false}]$vv363$::jsonb,
   $vv364$Converting both the user's question and each FAQ question into a lowercased set of words lets len(keywords & user_keywords) count how many words they share, regardless of order or exact phrasing. Keeping track of the highest overlap seen so far as you loop through the FAQs picks the best-matching one — a simple, effective retrieval approach that doesn't need embeddings or an LLM at all, exactly as the notes describe.$vv364$,
   jsonb_build_object('python', $vv357$def find_best_match(faqs, user_question):
    user_keywords = set(user_question.lower().split())
    best_answer = None
    best_overlap = -1
    for question, answer in faqs:
        keywords = set(question.lower().split())
        overlap = len(keywords & user_keywords)
        if overlap > best_overlap:
            best_overlap = overlap
            best_answer = answer
    return best_answer

n = int(input())
faqs = []
for _ in range(n):
    line = input()
    q, a = line.split("|")
    faqs.append((q, a))
user_question = input()
print(find_best_match(faqs, user_question))
$vv357$),
   array['python'], 'published', false, 2),
  ('cp-py-ai-generative-ai-4', null::text, $vv367$Robust LLM API Wrapper$vv367$, 'Medium', 'py-ai-generative-ai-robust-llm-api-wrapper',
   $vv368$Write a call_llm_api(prompt, api_call_fn) wrapper that calls the given API function and handles failures gracefully, returning a clear fallback message instead of crashing.

**Why a mock instead of a real API?** the notes' own version calls a real LLM provider, but an automated judge has no reliable internet access and no API key — so instead, api_call_fn is a stand-in function passed in (exactly like the Testing chapter's MagicMock pattern), which can simulate success, a timeout, or a connection failure, letting the wrapper's actual error-handling logic be tested directly.

**Approach:** call api_call_fn(prompt) inside a try block, and return a specific fallback message for a TimeoutError vs a ConnectionError.

**Input:** Two lines: the scenario to simulate (`success`, `timeout`, or `connection_error`), and the prompt text.

**Output:** One line: the AI's reply (on success), or a fallback error message (on failure).$vv368$,
   $vv369$[{"input": "success\nHello", "output": "AI response to: Hello"}]$vv369$::jsonb,
   $vv370$["scenario is one of success, timeout, connection_error."]$vv370$::jsonb,
   jsonb_build_object('python', $vv365$def call_llm_api(prompt, api_call_fn):
    # call api_call_fn(prompt); on TimeoutError return "Sorry, something went wrong: request timed out";
    # on ConnectionError return "Sorry, something went wrong: connection failed"
    pass

scenario = input()
prompt = input()

def mock_api(prompt):
    if scenario == "timeout":
        raise TimeoutError("timed out")
    elif scenario == "connection_error":
        raise ConnectionError("connection failed")
    return f"AI response to: {prompt}"

print(call_llm_api(prompt, mock_api))
$vv365$),
   $vv371$["Wrap the call api_call_fn(prompt) in a try block, exactly like a real requests.post() call would be.", "Use two separate except clauses — one for TimeoutError, one for ConnectionError — each returning its own specific message.", "On success (no exception), simply return whatever api_call_fn(prompt) returned."]$vv371$::jsonb,
   $vv372$[{"input": "success\nHello", "expected": "AI response to: Hello", "hidden": false}, {"input": "timeout\nHello", "expected": "Sorry, something went wrong: request timed out", "hidden": true}, {"input": "connection_error\nHello", "expected": "Sorry, something went wrong: connection failed", "hidden": true}]$vv372$::jsonb,
   $vv373$call_llm_api wraps the call to api_call_fn(prompt) in a try block, exactly as a real requests.post()-based call would be. Separate except clauses for TimeoutError and ConnectionError return distinct, clear fallback messages instead of letting the exception crash the program — the mock_api stand-in lets all three scenarios (success, timeout, connection failure) be tested deterministically, without any real network access.$vv373$,
   jsonb_build_object('python', $vv366$def call_llm_api(prompt, api_call_fn):
    try:
        return api_call_fn(prompt)
    except TimeoutError:
        return "Sorry, something went wrong: request timed out"
    except ConnectionError:
        return "Sorry, something went wrong: connection failed"

scenario = input()
prompt = input()

def mock_api(prompt):
    if scenario == "timeout":
        raise TimeoutError("timed out")
    elif scenario == "connection_error":
        raise ConnectionError("connection failed")
    return f"AI response to: {prompt}"

print(call_llm_api(prompt, mock_api))
$vv366$),
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
   where source_kind = 'python_tutorial' and source_ref like 'automation-data-science-ai/%';
  if v_topics <> 5 then raise exception 'validation: expected 5 automation-data-science-ai topics, found %', v_topics; end if;

  select count(*) into v_tests from public.practice_tests where id in ('pt-py-web-scraping', 'pt-py-automation', 'pt-py-machine-learning', 'pt-py-deep-learning', 'pt-py-ai-generative-ai');
  if v_tests <> 5 then raise exception 'validation: expected 5 new python topic mock tests, found %', v_tests; end if;

  select count(*) into v_bad_tests from public.practice_tests
   where id in ('pt-py-web-scraping', 'pt-py-automation', 'pt-py-machine-learning', 'pt-py-deep-learning', 'pt-py-ai-generative-ai')
     and (question_count <> 10 or duration_minutes <> 10);
  if v_bad_tests > 0 then raise exception 'validation: % new python mock tests do not have 10 questions / 10 minute duration', v_bad_tests; end if;

  select count(*) into v_questions from public.test_questions where test_id in ('pt-py-web-scraping', 'pt-py-automation', 'pt-py-machine-learning', 'pt-py-deep-learning', 'pt-py-ai-generative-ai');
  if v_questions <> 50 then raise exception 'validation: expected 50 new python MCQ rows (5 x 10), found %', v_questions; end if;

  select count(*) into v_problems from public.dsa_problems where id like 'cp-py-web-scraping-%' or id like 'cp-py-automation-%' or id like 'cp-py-machine-learning-%' or id like 'cp-py-deep-learning-%' or id like 'cp-py-ai-generative-ai-%';
  if v_problems <> 20 then raise exception 'validation: expected 20 new python coding problems, found %', v_problems; end if;

  raise notice '0054 OK: Python Tutorial Automation/Data Science/AI — 5 topics, 5 mock tests (50 MCQs), 20 coding problems.';
end $$;

notify pgrst, 'reload schema';
