Walk into a busy restaurant. You do not go to the kitchen, light the stove and boil your own rice. You sit down, tell the waiter what you want, and the food arrives. The restaurant decides who cooks, when they cook and which pan they use. You only decide what you would like to eat.

Spring works the same way with your Java objects. Your classes stop building the things they need. They wait, and Spring brings those things to them. This idea has a name: Inversion of Control, or IoC.

In this guide you will see what IoC means, what problem it solves, how the Spring container does the work, and how to check it with a small library program.

## What is Inversion of Control?

Normally you are in control of your program. Your class needs a helper, so it writes `new Helper()` and creates one. Your code decides which helper to use and when to make it.

With IoC, that control is turned upside down. Your class no longer creates its helpers. An outside manager creates them and hands them over. In Spring, that manager is called the **container**.

> **Definition:** Inversion of Control (IoC) is a design principle where the framework, not your own code, creates objects and connects them together. Your classes only say what they need.

Think of a hotel. A guest does not go to the market for towels. The hotel keeps towels ready and sends them to the room. The guest is not in control of the towels any more. The hotel is.

Two names are worth knowing:

- **IoC container.** The Spring part that creates, stores and connects your objects. Its type is `ApplicationContext`.
- **Bean.** Any object that the container manages. You will meet beans properly in the next few guides.

## Why is it used?

Look at what happens without IoC. Suppose a library desk needs a fine calculator, and the desk creates it on its own.

```java
public class LibraryDesk {
    private final FineCalculator calculator = new FineCalculator();
}
```

This looks harmless, but it causes trouble as the program grows.

- **Tight coupling.** `LibraryDesk` is now glued to one exact class. To use a different calculator, say one for the festival season, you must open and edit `LibraryDesk`.
- **Hard to test.** You cannot give the desk a fake calculator, because it always builds the real one.
- **Repeated setup.** If the calculator itself needs a database or a settings object, every class that uses it must know how to build that too.
- **Scattered lifetime.** Nobody knows how many calculators exist or who should shut them down.

IoC fixes these problems. Each class says what it needs and does nothing else. One central place, the container, decides how objects are built, how many exist and when they are cleaned up. Changing one piece no longer means editing ten classes.

## How it works

The container follows a simple routine every time your app starts.

```text
+--------------------------------+
|  Your classes with annotations |
|  (@Component and friends)      |
+--------------------------------+
                |
                v
+--------------------------------+
|  Container reads them and      |
|  makes a list of beans         |
+--------------------------------+
                |
                v
+--------------------------------+
|  Container creates each bean,  |
|  helpers first                 |
+--------------------------------+
                |
                v
+--------------------------------+
|  Container passes helpers into |
|  the classes that need them    |
+--------------------------------+
                |
                v
+--------------------------------+
|  App runs. Container closes    |
|  beans when the app stops      |
+--------------------------------+
```

First, Spring reads the classes you marked, for example with `@Component`. It records what each class is and what it needs. Then it creates the objects. It is smart about order: if `LibraryDesk` needs `FineCalculator`, the calculator is built first. Finally it hands the ready calculator to the desk and starts your app. When the app stops, the container also tidies up the objects it created.

Here is the difference in who calls whom.

```text
Without IoC:
  LibraryDesk --new--> Calculator

With IoC:
  Container --makes--> Calculator
  Container --makes--> LibraryDesk
  Container --gives--> Calculator
                 to LibraryDesk
```

Without IoC the desk reaches out and builds its own helper. With IoC the arrows start at the container. The desk never mentions how the calculator is made. This is why people say the control is "inverted".

> **Note:** IoC is the big idea. Dependency Injection, covered in the next guide, is the technique Spring uses to carry it out. The container injects, or pushes, the helpers into your classes.

## Real-Life Example

Think about a school canteen that serves lunch. The canteen owner used to buy vegetables, hire a cook and arrange the plates every morning. Every change hurt: a new vegetable seller meant new phone numbers and new plans.

Now a catering company runs the canteen. The owner writes a short note: "I need rice, dal and one cook." The company delivers exactly that each morning. If the dal supplier changes, the owner never hears about it. The note stays the same.

The owner is your class. The note is the list of things it needs. The catering company is the Spring container.

## Code Example

Let's build a small program for a town library. A `LibraryDesk` needs a `FineCalculator` to work out late fees. We will never write `new` for either of them. Spring will do it. Use the same `pom.xml` as the first CineGo example, changing only the groupId and artifactId.

```text
library-desk/
└─ src/main/java/
   └─ com/townlibrary/desk/
      ├─ DeskApplication.java
      ├─ FineCalculator.java
      ├─ LibraryDesk.java
      └─ DeskRunner.java
```

**File:** `DeskApplication.java` in package `com.townlibrary.desk`

```java
package com.townlibrary.desk;

import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DeskApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(DeskApplication.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.setBannerMode(Banner.Mode.OFF);
        app.setLogStartupInfo(false);
        System.out.println("main: asking Spring to start");
        app.run(args);
        System.out.println("main: finished");
    }
}
```

**File:** `FineCalculator.java` in package `com.townlibrary.desk`

```java
package com.townlibrary.desk;

import org.springframework.stereotype.Component;

@Component
public class FineCalculator {

    public FineCalculator() {
        System.out.println("Spring created FineCalculator");
    }

    public int fineFor(int daysLate) {
        return daysLate * 5;
    }
}
```

**File:** `LibraryDesk.java` in package `com.townlibrary.desk`

```java
package com.townlibrary.desk;

import org.springframework.stereotype.Component;

@Component
public class LibraryDesk {

    private final FineCalculator calculator;

    public LibraryDesk(FineCalculator calculator) {
        this.calculator = calculator;
        System.out.println("Spring created LibraryDesk");
    }

    public String returnBook(String title, int daysLate) {
        return title + ": fine is Rs " + calculator.fineFor(daysLate);
    }
}
```

**File:** `DeskRunner.java` in package `com.townlibrary.desk`

```java
package com.townlibrary.desk;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DeskRunner implements CommandLineRunner {

    private final LibraryDesk desk;

    public DeskRunner(LibraryDesk desk) {
        this.desk = desk;
    }

    @Override
    public void run(String... args) {
        System.out.println(desk.returnBook("Malgudi Days", 4));
    }
}
```

Build and run it:

```bash
mvn -q package
java -jar target/desk-0.0.1-SNAPSHOT.jar
```

**Output:**

```text
main: asking Spring to start
Spring created FineCalculator
Spring created LibraryDesk
Malgudi Days: fine is Rs 20
main: finished
```

Look at the order. Spring built `FineCalculator` first, because the desk needs it. Only then did it build `LibraryDesk`. Nobody wrote that order in code. The container worked it out.

## Code Explained

- `@Component` tells Spring, "please manage objects of this class". Each annotated class becomes a bean.
- `LibraryDesk` asks for a `FineCalculator` in its constructor. It never says how to make one. That request is the whole contract.
- `DeskRunner` implements `CommandLineRunner`. Spring calls its `run` method once the container is ready. It gets the desk the same way: through its constructor.
- In `main`, we switch off the web server and the banner. That keeps the console limited to our own lines. It also shows that IoC has nothing to do with the web. It works in any Spring program.
- Nowhere do we write `new FineCalculator()` or `new LibraryDesk(...)`. That is the inversion.

## Common Mistakes

> **Warning:** If you write `new LibraryDesk(...)` yourself, you get an ordinary object that Spring does not know about. It gets no injected helpers and no lifecycle handling. Always ask the container for beans, or receive them through a constructor.

- **Forgetting the annotation.** A class without `@Component` (or a similar annotation) is invisible to Spring. The container then says it cannot find a bean of that type.
- **Mixing both styles.** Creating one helper with `new` inside a bean, while the rest are injected, brings back the tight coupling IoC was meant to remove.
- **Thinking IoC means Spring only.** IoC is a general idea. Spring is one popular way to use it.

## Interview Questions

**What is Inversion of Control?**
It is a principle where a framework creates and connects objects instead of your code doing it. Your classes only declare what they need.

**What is the Spring IoC container?**
It is the part of Spring, represented by `ApplicationContext`, that creates beans, injects their dependencies and manages their life.

**How are IoC and Dependency Injection related?**
IoC is the principle. Dependency Injection is the technique Spring uses to apply it, by passing ready-made objects into the classes that need them.

## Key Points to Remember

- With IoC, the container creates objects. Your classes do not use `new` for their helpers.
- The container is the `ApplicationContext`, and the objects it manages are called beans.
- IoC reduces coupling, so you can change or fake one piece without editing many classes.
- The container works out the creation order for you: helpers first, then the classes that need them.
- Dependency Injection is how IoC is carried out.

## Frequently Asked Questions

### Is Inversion of Control the same as Dependency Injection?

Not exactly. Inversion of Control is the general idea of handing control to a framework. Dependency Injection is one specific way to do it, and it is the way Spring uses.

### Can I use Spring without IoC?

Not in any useful way. The container is the heart of Spring. Almost everything else, such as web controllers and database access, is built on top of it.

### Does IoC make my program slower?

The container does a little extra work when the app starts, because it must build and connect the beans. After that, the cost is tiny. Most beans are created only once and reused.

### Who controls the objects when Spring runs the app?

The container does. It creates them, gives them to the classes that need them and closes them when the app ends. Your code just uses them.

## Related Topics

- [Dependency Injection](/learning/spring-boot-tutorial/dependency-injection): see how the container passes helpers into your classes.
- [Spring Beans](/learning/spring-boot-tutorial/spring-beans): learn what a bean is and how to find one.
- [Component Scan](/learning/spring-boot-tutorial/component-scan): find out how Spring discovers your classes.
- [Spring vs Spring Boot](/learning/spring-boot-tutorial/spring-vs-spring-boot): compare the framework with the tool built on top.
