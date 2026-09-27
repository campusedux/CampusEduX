Picture a bike rental shop in a hill town. Before the first customer arrives, the owner unlocks the shutter, switches on the lights and pumps air into the tyres. All day the shop serves riders. At night he counts the keys, switches off the lights and locks the shutter. Opening and closing are not the "real work", but the shop cannot run well without them.

The bean lifecycle is the same daily routine for a Spring bean. It is built, prepared, used and finally cleaned up. Knowing when each step happens tells you where to put start-up and shut-down code. In this guide you will follow a bean from birth to end, see the hooks Spring offers, and print the exact order with a small program.

## What is the Bean Lifecycle?

> **Definition:** The bean lifecycle is the series of steps the Spring container performs on a bean, from creating it and injecting its dependencies, through initialisation and use, to destroying it when the container closes.

Two moments matter most to you:

- **Initialisation.** The bean has been built and all its dependencies are in place. This is the right time to open files, check settings or warm up a cache.
- **Destruction.** The container is closing. This is the right time to close connections, flush data or stop background work.

Spring lets you attach your own code to both moments through **callback methods**. A callback is a method that Spring calls for you at the right time.

## Why is it used?

Why not do the start-up work inside the constructor? Because the constructor runs too early. At that point the object exists, but Spring has not yet injected fields or setters. Code that needs a dependency may find it missing.

Lifecycle callbacks solve that.

- **Safe start-up.** An init callback runs after injection, so every dependency is ready to use.
- **Clean shut-down.** A destroy callback gives you one place to release resources, so nothing is left open.
- **Separation of jobs.** The constructor only builds the object. Preparation code lives in its own method with a clear name.
- **Fewer leaks.** Forgetting to close a connection or stop a thread is a classic bug. A destroy callback makes closing automatic.

## How it works

Here is the journey of a singleton bean in the order Spring performs it.

```text
+--------------------------------+
|  1. Constructor is called      |
+--------------------------------+
                |
                v
+--------------------------------+
|  2. Dependencies are injected  |
|     (setters and fields)       |
+--------------------------------+
                |
                v
+--------------------------------+
|  3. Aware callbacks, such as   |
|     setBeanName()              |
+--------------------------------+
                |
                v
+--------------------------------+
|  4. Init callbacks run         |
|     @PostConstruct, then       |
|     afterPropertiesSet()       |
+--------------------------------+
                |
                v
+--------------------------------+
|  5. Bean is ready and in use   |
+--------------------------------+
```

Spring first calls the constructor, then fills in the setter and field dependencies. If your bean implements interfaces like `BeanNameAware`, Spring tells it its own name. Then the init callbacks run in a fixed order. After that the bean is ready, and other beans can use it.

When the application ends, the second half of the story begins.

```text
+--------------------------------+
|  Container starts closing      |
+--------------------------------+
                |
                v
+--------------------------------+
|  6. @PreDestroy method runs    |
+--------------------------------+
                |
                v
+--------------------------------+
|  7. destroy() runs if the bean |
|     implements DisposableBean  |
+--------------------------------+
                |
                v
+--------------------------------+
|  Bean object is discarded      |
+--------------------------------+
```

The container calls the destroy callbacks and then lets go of the bean. Remember that this only applies to beans the container tracks. Prototype beans are handed out and forgotten, so they never get a destroy call.

Spring gives you three ways to hook into the start and end.

| Way | Init | Destroy |
|---|---|---|
| Annotations (recommended) | `@PostConstruct` | `@PreDestroy` |
| Spring interfaces | `InitializingBean` | `DisposableBean` |
| `@Bean` attributes | `initMethod` | `destroyMethod` |

> **Tip:** Prefer `@PostConstruct` and `@PreDestroy`. They are plain Java annotations, so your class does not depend on Spring interfaces. Use the `@Bean` attributes when you cannot edit the class, for example one that comes from a library.

## Real-Life Example

A cinema hall opens for the evening show. First the building is constructed. Then the staff arrives and gets the keys (injection). The manager tells each staff member their counter number (aware callback). Then everyone runs an opening routine: lights on, projector warm, popcorn ready. That is initialisation. The show runs. After the last show comes the closing routine: projector off, cash counted, doors locked. That is destruction.

If the projector were switched on before the electrician connected the power, nothing would work. That is why the opening routine happens after the setup, not during construction.

## Code Example

Let's build PedalPoint, a bike rental counter. The `RentalCounter` bean uses many lifecycle hooks and prints a line at each one, so we can watch the order. Use the same `pom.xml` as the first CineGo example, changing only the groupId and artifactId.

```text
pedalpoint/
└─ src/main/java/
   └─ com/pedalpoint/rental/
      ├─ RentalApplication.java
      ├─ BikeStock.java
      ├─ RentalCounter.java
      └─ RentalRunner.java
```

**File:** `RentalApplication.java` in package `com.pedalpoint.rental`

```java
package com.pedalpoint.rental;

import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;

@SpringBootApplication
public class RentalApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(RentalApplication.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.setBannerMode(Banner.Mode.OFF);
        app.setLogStartupInfo(false);
        ConfigurableApplicationContext context = app.run(args);
        System.out.println("main: closing the app");
        context.close();
    }
}
```

**File:** `BikeStock.java` in package `com.pedalpoint.rental`

```java
package com.pedalpoint.rental;

import org.springframework.stereotype.Component;

@Component
public class BikeStock {

    public int bikesAvailable() {
        return 18;
    }
}
```

**File:** `RentalCounter.java` in package `com.pedalpoint.rental`

```java
package com.pedalpoint.rental;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

import org.springframework.beans.factory.BeanNameAware;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class RentalCounter implements BeanNameAware, InitializingBean, DisposableBean {

    private BikeStock stock;

    public RentalCounter() {
        System.out.println("1 constructor runs");
    }

    @Autowired
    public void setStock(BikeStock stock) {
        this.stock = stock;
        System.out.println("2 setter got BikeStock");
    }

    @Override
    public void setBeanName(String name) {
        System.out.println("3 setBeanName: " + name);
    }

    @PostConstruct
    public void openShop() {
        System.out.println("4 @PostConstruct: " + stock.bikesAvailable() + " bikes");
    }

    @Override
    public void afterPropertiesSet() {
        System.out.println("5 afterPropertiesSet");
    }

    public String rent() {
        return "Bike rented, shop open";
    }

    @PreDestroy
    public void closeShop() {
        System.out.println("6 @PreDestroy: locking up");
    }

    @Override
    public void destroy() {
        System.out.println("7 destroy() from DisposableBean");
    }
}
```

**File:** `RentalRunner.java` in package `com.pedalpoint.rental`

```java
package com.pedalpoint.rental;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class RentalRunner implements CommandLineRunner {

    private final RentalCounter counter;

    public RentalRunner(RentalCounter counter) {
        this.counter = counter;
    }

    @Override
    public void run(String... args) {
        System.out.println("Runner: " + counter.rent());
    }
}
```

Build and run it:

```bash
mvn -q package
java -jar target/rental-0.0.1-SNAPSHOT.jar
```

**Output:**

```text
1 constructor runs
2 setter got BikeStock
3 setBeanName: rentalCounter
4 @PostConstruct: 18 bikes
5 afterPropertiesSet
Runner: Bike rented, shop open
main: closing the app
6 @PreDestroy: locking up
7 destroy() from DisposableBean
```

The numbers in each line match the numbers in the diagram. The constructor comes first, the setter second, and only then do the init callbacks run. The counter is used by the runner in the middle. At the end, `main` closes the container, and the two destroy callbacks run in order.

## Code Explained

- The constructor runs first and knows nothing about `BikeStock`. That is why the shop is not opened there.
- `@Autowired` on the setter makes Spring inject `BikeStock` after the constructor. We used setter injection here only so that the injection point is visible.
- `BeanNameAware.setBeanName` is an Aware callback. Spring tells the bean its own name in the container.
- `@PostConstruct` runs after injection, so `stock` is ready to use. `afterPropertiesSet` from `InitializingBean` runs right after it.
- `@PreDestroy` and `DisposableBean.destroy` run when the container closes.
- `jakarta.annotation` is the Jakarta package that holds these two annotations. Older tutorials use `javax.annotation`, which no longer works in Spring Boot 4.
- Calling `context.close()` in `main` makes the closing visible. In a web app, the container closes when you stop the server.

## Common Mistakes

> **Warning:** Do not put code that needs injected dependencies in the constructor. At that moment fields and setters are still empty, so you may hit a `NullPointerException`. Move it into a `@PostConstruct` method.

- **Wrong import.** Using `javax.annotation.PostConstruct` in Spring Boot 4 fails to compile. Use the `jakarta.annotation` package.
- **Heavy work in init.** A slow `@PostConstruct` delays the whole application start. Keep it short, and move long jobs elsewhere.
- **Expecting @PreDestroy on prototypes.** Spring does not track prototype beans, so their destroy callbacks never run.
- **Killing the app the hard way.** If the process is stopped abruptly, for example with `kill -9`, the shutdown callbacks do not get a chance to run.

## Interview Questions

**What are the main steps in a bean's lifecycle?**
Instantiate with the constructor, inject dependencies, run Aware callbacks, run init callbacks, use the bean, then run destroy callbacks when the container closes.

**Which comes first, `@PostConstruct` or `afterPropertiesSet`?**
`@PostConstruct` runs first, then `afterPropertiesSet`, and then any custom `initMethod`.

**Why not put initialisation code in the constructor?**
The dependencies are not injected yet when the constructor runs, so code that uses them can fail. Init callbacks run after injection.

## Key Points to Remember

- A bean is constructed, injected, initialised, used and finally destroyed.
- `@PostConstruct` marks a method to run after injection. `@PreDestroy` marks one to run before the bean is discarded.
- Both annotations come from the `jakarta.annotation` package.
- `InitializingBean`, `DisposableBean` and the `@Bean` attributes `initMethod` and `destroyMethod` do the same jobs in other ways.
- Prototype beans get init callbacks but never destroy callbacks.

## Frequently Asked Questions

### Can a bean have more than one @PostConstruct method?

Technically the annotation is meant for one method per class. Keep to one, and give it a clear name such as `openShop`.

### Does the bean lifecycle run for every bean?

Yes, every bean the container manages goes through creation and injection. Init and destroy callbacks run only if you define them.

### What is a BeanPostProcessor?

It is a special bean that Spring calls before and after the init callbacks of every other bean. Spring itself uses it to add features like `@Async` and `@Transactional`. You rarely write one yourself.

### When does the container close in a Spring Boot app?

When the application stops normally, for example on Ctrl+C or a shutdown signal. Spring Boot registers a shutdown hook that closes the container and runs the destroy callbacks.

## Related Topics

- [Spring Beans](/learning/spring-boot-tutorial/spring-beans): what the container creates and stores.
- [Bean Scopes](/learning/spring-boot-tutorial/bean-scopes): how many copies exist and how long they live.
- [Configuration and Bean](/learning/spring-boot-tutorial/configuration-and-bean): set init and destroy methods on a bean method.
- [Dependency Injection](/learning/spring-boot-tutorial/dependency-injection): how dependencies arrive before init runs.
