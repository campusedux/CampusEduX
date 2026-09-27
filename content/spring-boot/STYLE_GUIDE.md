# Spring Boot Tutorial: style guide

Rules every lesson in `content/spring-boot/` follows. `scripts/verify-spring-boot-lessons.mjs` enforces
the ones marked **(checked)**.

## Versions (owner decision, 2026-09-26)

- **Spring Boot 4.1.1** with **Java 21**. Every `spring-boot-starter-parent` in a lesson uses `4.1.1`
  and every `java.version` is `21` **(checked)**, matching `course.bootVersion` / `course.javaVersion`
  in `manifest.json`. Initializr offers only 4.x; 3.5.16 (June 2026) was the last 3.x release.
- Managed versions that lessons quote come from the 4.1.1 BOM: Spring Framework 7.0.9, Tomcat 11.0.24,
  Jackson 3.1.5 (group `tools.jackson.core`). Update them together if the course version moves.
- Moving to a newer Boot version is a course-wide change: bump the manifest, rebuild every code
  project, re-check every quoted output, and regenerate all batches.

## Starter names (Boot 4)

- Web: `spring-boot-starter-webmvc`. Never use `spring-boot-starter-web` in code; in 4.1.1 it is
  "deprecated in favor of spring-boot-starter-webmvc" **(checked)**. Prose may mention it once as the old
  name for readers coming from Boot 3.
- Tests: each starter has a matching `-test` starter (`spring-boot-starter-webmvc-test`,
  `spring-boot-starter-data-jpa-test`, …). Initializr adds the one that matches your dependencies.
- Use starter names exactly as they appear in the 4.1.1 BOM (`spring-boot-dependencies-4.1.1.pom`).

## Content

- Title = topic name only. No "unit / chapter / lesson / module / part" labels and no numbered headings **(checked)**.
- Original, simple English, teacher voice, 1200-1500 prose words **(checked)**; banned AI phrases **(checked)**.
- Sections: hook, "What is …?", "Why …", "How it works" with a text-fence flow diagram and a plain
  explanation under it, Real-Life Example, Code Example + Output + Code Explained (practical topics),
  Common Mistakes with a callout, Interview Questions, Key Points to Remember, Frequently Asked
  Questions (3-4), Related Topics (2-4) **(checked)**.
- Practical topics: 2 practice problems, `Easy:` then `Medium:`, each with a hint, an answer and full
  solution code **(checked)**. One MCQ test per topic: 5 questions (3 for tiny theory topics), mixing
  concept, output and find-the-bug **(checked)**.
- Varied realistic domains (cinema, clinic, library, bakery, food delivery, …), never Student/Employee.

## Code

- Every block that students can build has a label **(checked by the code tools)**:
  `**File:** `pom.xml``, `**File:** `Name.java` in package `com.x.y``,
  `**File:** `name.ext` in `src/main/resources[/static]``.
- Every labelled block is compiled and run, and every quoted output is copied from a real run.
- Allowed fences: java, xml, html, properties, yaml, bash, text, json, sql, dockerfile **(checked)**.

## Phone widths

- Text blocks (diagrams, trees, outputs): at most 34 characters per line **(checked)**.
- Inline code: no run without spaces longer than 30 characters **(checked)**. Put long paths, URLs and
  JSON in a fenced block or split them ("`Name.java` in package `com.x.y`").

## SEO

- `short_description` 140-155 characters, unique **(checked)**. Slugs lowercase-hyphenated, permanent.
