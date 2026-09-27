Walk into any restaurant kitchen and a new cook can start work in minutes. Cold things are in the walk-in fridge, dry goods are on the shelves, and the hot line is by the extraction fan. Nobody needs a map, because every kitchen follows the same plan. A Spring Boot project works the same way. Once you learn where things go, you can open any project, at any company, and find your way around straight away.

Let's walk through every folder of a fresh project, see what Maven and Spring Boot do with each one, and learn how to organise your own code as the app grows.

## What is the Spring Boot project structure?

> **Definition:** The Spring Boot project structure is the standard Maven folder layout, `src/main/java`, `src/main/resources` and `src/test/java`, plus a few Spring Boot extras such as the main application class and `application.properties`.

This is an example of "convention over configuration". Because every project puts files in the same places, Maven and Spring Boot already know where to look. You never write a setting that says "my Java code is in this folder".

Here is the layout of a bakery ordering app called CrumbCo, straight from Spring Initializr plus two files we will add.

```text
crumbco/
├─ pom.xml
├─ mvnw, mvnw.cmd, .mvn/
├─ src/main/java/com/crumbco/
│  ├─ CrumbcoApplication.java
│  └─ menu/MenuController.java
├─ src/main/resources/
│  ├─ application.properties
│  ├─ static/index.html
│  └─ templates/
├─ src/test/java/com/crumbco/
│  └─ CrumbcoApplicationTests.java
└─ target/  (build output)
```

## Why is it used?

A shared layout saves time for everyone:

- **Tools find things by themselves.** Maven compiles whatever is in `src/main/java` and runs whatever tests are in `src/test/java`, with no extra setup.
- **Test code never ships.** Anything under `src/test` is left out of the final JAR, so test helpers cannot leak into production.
- **New teammates are productive fast.** A developer who has seen one Spring Boot project can read yours on day one.
- **Spring Boot's defaults line up with it.** Settings are read from `application.properties`, and web files are served from `static`, because that is where the layout says they live.

## How it works

When you run `./mvnw package`, each source folder has a clear job on the way to the final JAR.

```text
src/main/java   src/main/resources
      |                |
   compiled         copied
      |                |
      v                v
       target/classes
             |
             v
  spring-boot-maven-plugin
  adds libraries + loader
             |
             v
   target/crumbco-...jar
```

Your Java files are compiled and your resource files are copied into the same `target/classes` folder, so at runtime they sit side by side on the classpath. The Spring Boot Maven plugin then wraps them, together with every library JAR, into one runnable file.

## Folder by Folder

| Path | What it holds | Notes |
|---|---|---|
| `pom.xml` | Maven build file | Starters, Java version, plugins |
| `mvnw`, `mvnw.cmd`, `.mvn/` | Maven Wrapper | Commit these to Git |
| `src/main/java` | Your application code | Keep it under the main package |
| `src/main/resources` | Settings and other files | `application.properties` lives here |
| `resources/static` | Files served as they are | HTML, CSS, images, JavaScript |
| `resources/templates` | Server-side page templates | Used with Thymeleaf, often empty in APIs |
| `src/test/java` | Tests | Never packaged into the JAR |
| `target/` | Build output | Created by Maven, never edit or commit it |
| `HELP.md` | Links to guides | Safe to delete |

## Real-Life Example

Think of a library building. The reading room (`src/main/java`) is where the real work happens. The reference desk (`src/main/resources`) holds the rules and settings everyone follows. The back office (`src/test/java`) is where staff check books before they go on the shelves, and visitors never see it. The delivery van (`target/`) carries the finished collection to other branches, and nobody sits inside the van to read.

## Organising Your Own Code

As an app grows, you need a plan for packages. There are two common styles.

| Style | Example packages | Good for |
|---|---|---|
| By layer | `controller`, `service`, `repository` | Very small apps and first projects |
| By feature | `menu`, `orders`, `payments` | Most real apps, easier to grow |

By feature is usually the better choice. Everything about orders lives together, so a change to orders touches one package instead of three. Whichever style you choose, keep every package **below** the main class's package, so component scan finds it.

## Code Example

Let's give CrumbCo a home page and a menu endpoint. Here is the main class Initializr made:

**File:** `CrumbcoApplication.java` in package `com.crumbco`

```java
package com.crumbco;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CrumbcoApplication {

    public static void main(String[] args) {
        SpringApplication.run(CrumbcoApplication.class, args);
    }
}
```

Now a controller in its own feature package:

**File:** `MenuController.java` in package `com.crumbco.menu`

```java
package com.crumbco.menu;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MenuController {

    @GetMapping("/menu")
    public List<String> menu() {
        return List.of("Sourdough Loaf", "Almond Croissant", "Masala Bun");
    }
}
```

And a static home page. Spring Boot serves `static/index.html` when someone opens the site's root address:

**File:** `index.html` in `src/main/resources/static`

```html
<!DOCTYPE html>
<html>
<head><title>CrumbCo</title></head>
<body><h1>Fresh from the CrumbCo oven</h1></body>
</html>
```

Run the app, then call both addresses:

```bash
./mvnw spring-boot:run
curl http://localhost:8080/menu
curl http://localhost:8080/
```

**Output:**

```json
[
  "Sourdough Loaf",
  "Almond Croissant",
  "Masala Bun"
]
```

The first call returns the menu as JSON, spaced out here for reading. The second returns the HTML of `index.html`, and in a browser you see the heading "Fresh from the CrumbCo oven".

## Code Explained

- `MenuController` lives in `com.crumbco.menu`, below `com.crumbco`, so component scan finds it without any setting.
- Files in `resources/static` are served as they are. `index.html` is special: it becomes the welcome page at `/`.
- Everything in `src/main/resources` ends up inside the JAR at `BOOT-INF/classes`, next to your compiled classes. That is why the app can read `application.properties` at runtime.
- The finished JAR also has `BOOT-INF/lib`, holding every library (34 of them for a Spring Web app), and a small Spring Boot loader that knows how to start the app from that nested layout.

## Debugging Tip: Look in target/classes

When Spring Boot seems to ignore a file, check whether the file actually reached the classpath. Run `./mvnw package`, then open `target/classes`. Your compiled classes and every resource file should be there, in the same folders as in `src`. If `application.properties` or `static/index.html` is missing from `target/classes`, the file is in the wrong source folder, and no setting in Spring Boot will fix that. This one check solves a surprising number of "my setting does nothing" problems.

## Common Mistakes

> **Warning:** Never edit files inside `target/`. Maven deletes and rebuilds that folder, so your changes vanish on the next build. Change the files in `src` instead.

- **Settings in the wrong folder.** An `application.properties` placed in `src/main/java` is not copied as a resource, so your settings are silently ignored.
- **Main class in a sub-package.** If the main class moves into `com.crumbco.app`, the `com.crumbco.menu` controller is no longer scanned and returns 404.
- **Committing `target/`.** Build output does not belong in Git; the generated `.gitignore` already excludes it.

## Interview Questions

**Where does application.properties live and why?**
In `src/main/resources`. Maven copies that folder onto the classpath, and Spring Boot looks for `application.properties` on the classpath by default.

**What is the difference between static and templates?**
`static` files are sent to the browser unchanged. `templates` holds pages that a template engine such as Thymeleaf fills with data on the server first.

**Is test code included in the final JAR?**
No. Code in `src/test/java` is compiled and run during the build, but it is not packaged.

## Key Points to Remember

- Spring Boot uses the standard Maven layout, so tools find code, resources and tests without configuration.
- Application code goes in `src/main/java`, settings and web files in `src/main/resources`, tests in `src/test/java`.
- `target/` is build output: never edit it and never commit it.
- Keep every package under the main class's package so component scan finds it.
- Packaging by feature scales better than packaging by layer.

## Frequently Asked Questions

### Can I delete the static and templates folders?

Yes, if your app is a pure REST API and does not serve web pages. Spring Boot works fine without them.

### Where should I put images and CSS files?

In `src/main/resources/static`. A file at `static/css/site.css` is served at `/css/site.css`.

### Why is there a .jar.original file in target?

That is the plain JAR Maven built first. The Spring Boot plugin then repackaged it into the runnable JAR and kept the original beside it.

### Should controllers, services and repositories be in separate packages?

For small apps that is fine. As the app grows, group them by feature instead, such as `orders` holding its own controller, service and repository.

## Related Topics

- [Creating a Project with Spring Initializr](/learning/spring-boot-tutorial/creating-a-project-with-spring-initializr): generate the project this layout comes from.
- [Maven pom.xml Explained](/learning/spring-boot-tutorial/maven-pom-xml-explained): the build file at the top of the project.
- [Component Scan](/learning/spring-boot-tutorial/component-scan): why your packages must sit under the main class.
