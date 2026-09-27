When you move into a new flat, you do not build the furniture from raw wood. You pick a ready kit, check that the pieces match, and assemble it in an evening. Spring Initializr is that kit shop for Spring Boot. You tell it what you want, and it hands you a ready project with the right folders, a build file with matching versions, and a main class that already runs.

In this guide you will fill in the Initializr form, understand every field, open the project in your IDE, add your first endpoint and run it. You will also learn to create a project from the terminal with a single command.

## What is Spring Initializr?

> **Definition:** Spring Initializr is a free web tool at start.spring.io, run by the Spring team, that generates a new Spring Boot project as a ZIP file based on the options you choose.

It is also built into IntelliJ IDEA, VS Code (through the Spring Boot extensions) and Eclipse's Spring Tools, so you can use the same form without leaving your editor. Behind all of them is the same service, so the projects are identical.

## Why is it used?

You could create the folders and `pom.xml` by hand, but that is slow and easy to get wrong. Initializr gives you:

- **A correct build file.** The Spring Boot parent and starters with versions that work together.
- **The standard folder layout.** Every Spring Boot developer knows where to find things in it.
- **A main class and a test.** The app starts and the test passes before you write any code.
- **The Maven Wrapper.** `mvnw` lets anyone build the project without installing Maven.

Most real teams start new services this way, so it is worth learning well.

## How it works

Here is the path from an empty browser tab to a running app.

```text
Open start.spring.io
        |
        v
Fill the form + add deps
        |
        v
Click GENERATE (ZIP file)
        |
        v
Unzip and open in your IDE
        |
        v
IDE downloads libraries
        |
        v
Run the main class
```

The only slow step is the first download of libraries, which can take a minute or two. After that they are cached on your computer, so the next project opens much faster.

## Real-Life Example

Ordering at a sandwich counter works the same way. You choose the bread (Maven or Gradle), the size (Java version), and the fillings (dependencies such as Spring Web). The counter assembles it with ingredients that go together. You do not bake the bread yourself, but you still decide exactly what goes in.

## Filling the Form

Here are the main fields on the form and what to choose for this course. Leave Description as it is, and if you see a Configuration option, keep Properties.

| Field | What it means | Choose |
|---|---|---|
| Project | The build tool | Maven (the default is Gradle, so change it) |
| Language | Programming language | Java |
| Spring Boot | Framework version | Latest plain number, such as 4.1.1 |
| Group | Your organisation, reversed domain | com.citylibrary |
| Artifact | Project name, becomes the JAR name | catalog |
| Name | Display name, used for the main class | catalog |
| Package name | Where your code lives | com.citylibrary.catalog |
| Packaging | How the app is bundled | Jar |
| Java | Java version | 21 |

> **Tip:** Skip Spring Boot versions marked SNAPSHOT or M1, M2 and so on. Those are unfinished test builds. Always pick a plain version number.

Next, click **ADD DEPENDENCIES** and search for **Spring Web**. It adds the `spring-boot-starter-webmvc` starter for REST APIs with an embedded Tomcat server. Then click **GENERATE** to download `catalog.zip`.

## What Is Inside the ZIP

Unzip it and you will find these main files. The next topic explains each one in detail, so for now just get to know their names.

```text
catalog/
├─ pom.xml
├─ mvnw, mvnw.cmd, .mvn/
├─ HELP.md
├─ src/main/java/.../catalog/
│  └─ CatalogApplication.java
├─ src/main/resources/
│  ├─ application.properties
│  ├─ static/
│  └─ templates/
└─ src/test/java/.../catalog/
   └─ CatalogApplicationTests.java
```

- `pom.xml` is the Maven build file with your chosen starters.
- `mvnw`, `mvnw.cmd` and the `.mvn` folder are the Maven Wrapper.
- `HELP.md` holds links to guides for the dependencies you picked.
- `application.properties` is where your settings go. It already sets `spring.application.name` to `catalog`.
- `static` and `templates` are empty folders for web pages, which REST APIs often do not use.
- `CatalogApplicationTests` starts the whole app once. If it passes, your setup is healthy.

Try `./mvnw test` straight after unzipping. You should see `Tests run: 1, Failures: 0` and `BUILD SUCCESS`, which proves Java, Maven and the project all work together.

## Code Example

After unzipping, Initializr has created this main class for you:

**File:** `CatalogApplication.java` in package `com.citylibrary.catalog`

```java
package com.citylibrary.catalog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CatalogApplication {

    public static void main(String[] args) {
        SpringApplication.run(CatalogApplication.class, args);
    }
}
```

Let's add an endpoint that lists books. Create a new class in the same package:

**File:** `BookController.java` in package `com.citylibrary.catalog`

```java
package com.citylibrary.catalog;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BookController {

    record Book(String title, String author, boolean available) {}

    @GetMapping("/books")
    public List<Book> books() {
        return List.of(
                new Book("The Clockmaker's Daughter", "R. Mehta", true),
                new Book("Rivers of Code", "A. Fernandes", false));
    }
}
```

Run it from the project folder (on Windows use `mvnw.cmd`), then call the endpoint:

```bash
./mvnw spring-boot:run
curl http://localhost:8080/books
```

**Output:**

```json
[
  {
    "title": "The Clockmaker's Daughter",
    "author": "R. Mehta",
    "available": true
  },
  {
    "title": "Rivers of Code",
    "author": "A. Fernandes",
    "available": false
  }
]
```

curl prints the JSON on one line; it is spaced out here so it is easy to read.

## Code Explained

- Initializr named the main class from the Name field: `catalog` became `CatalogApplication`.
- The package `com.citylibrary.catalog` is Group plus Artifact. Your new classes must live in this package or below it, so component scan finds them.
- `BookController` is a normal class you added. Spring found it at startup because of `@SpringBootApplication` on the main class.
- `./mvnw spring-boot:run` used the Maven Wrapper, so Maven did not need to be installed.

## Creating a Project From the Terminal

Initializr also has an API. This one command creates the same project without opening a browser:

```bash
curl https://start.spring.io/starter.zip \
  -d type=maven-project \
  -d javaVersion=21 \
  -d groupId=com.citylibrary \
  -d artifactId=catalog \
  -d dependencies=web \
  -o catalog.zip
```

Two things are worth knowing. If you leave out `type=maven-project`, you get a Gradle project, because Gradle is the default. And if you leave out the Spring Boot version, you get the current default version.

## Common Mistakes

> **Warning:** A hyphen is not allowed in a Java package name. With the curl command, the artifact `book-catalog` gives the package `com.citylibrary.book_catalog`, which looks odd. Choose a short one-word artifact, and always check the Package name field before you generate.

- **Forgetting Spring Web.** Without it there is no web server, so the app starts and then stops straight away. Add the dependency and generate again, or add the starter to `pom.xml`.
- **Leaving Project on Gradle.** The Maven steps in this course will not match. Switch Project to Maven before you generate.
- **Moving the main class.** If you move `CatalogApplication` into a sub-package, classes above it are no longer scanned.

## Interview Questions

**What is Spring Initializr?**
A web tool and API that generates a ready Spring Boot project, with the build file, folder layout, main class, a test and the build tool wrapper.

**How are the main class and package names decided?**
The package comes from Group plus Artifact, and the main class from the Name field with `Application` added.

**Can you generate a project without a browser?**
Yes. Call the `/starter.zip` address on start.spring.io with curl and pass options such as `type`, `javaVersion`, `groupId`, `artifactId` and `dependencies`.

## Key Points to Remember

- Spring Initializr at start.spring.io generates a complete Spring Boot project as a ZIP.
- Choose Maven, Java, a plain Spring Boot version, Jar packaging and Java 21 for this course.
- Group plus Artifact makes the base package; keep your classes inside it.
- Add Spring Web to build REST APIs with an embedded Tomcat server.
- The same generator works from IntelliJ IDEA, VS Code, Eclipse or curl.

## Frequently Asked Questions

### Is Spring Initializr free?

Yes. start.spring.io is free and run by the Spring team. You do not need an account.

### Should I choose Maven or Gradle?

Both are good. This course uses Maven because its XML build file is easy to read for beginners, and most tutorials and company projects you will meet use it.

### Can I add more dependencies later?

Yes. Add the starter to `pom.xml` at any time. You can also open Initializr again, click EXPLORE to see the generated `pom.xml`, and copy just the lines you need.

### Why does my project have a test class already?

Initializr adds a small test that starts the whole app. If it passes, your project is set up correctly.

## Related Topics

- [Spring Boot Project Structure](/learning/spring-boot-tutorial/spring-boot-project-structure): what every generated folder and file is for.
- [Maven pom.xml Explained](/learning/spring-boot-tutorial/maven-pom-xml-explained): the build file Initializr wrote for you.
- [Spring Boot Starters](/learning/spring-boot-tutorial/spring-boot-starters): what Spring Web and other dependencies bring in.
- [Running a Spring Boot Application](/learning/spring-boot-tutorial/running-a-spring-boot-application): more ways to start your app.
