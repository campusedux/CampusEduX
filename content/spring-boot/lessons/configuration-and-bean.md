Say you run a small print shop. Most tools you build yourself in the workshop, and you put your own name tag on each. But some machines come from outside, such as a label printer from another company. You cannot open that machine and stick your tag inside. So you write a note in your register: "Label printer, brand QuickPrint, kept at the front desk." The register is where you record everything you want the shop to manage.

In Spring, @Configuration and @Bean are that register. They let you create beans by hand, especially for classes you cannot annotate. In this guide you will learn what they do, how they differ from `@Component`, and how they connect beans to each other.

## What are @Configuration and @Bean?

> **Definition:** A `@Configuration` class is a class that holds bean definitions. Each method inside it marked with `@Bean` builds one object, and Spring registers the returned object as a bean.

Two annotations work together:

- **`@Configuration`** is placed on a class. It tells Spring, "This class contains bean recipes." Spring reads it during component scan, because `@Configuration` is itself a `@Component`.
- **`@Bean`** is placed on a method inside that class. The method creates and returns an object. Spring calls the method once and stores the result under the method's name.

So a method named `labelPrinter()` gives you a bean named `labelPrinter`. You can change that with `@Bean(name = "backupPrinter")`.

## Why is it used?

You already know `@Component`. Why do we need another way?

- **Classes you cannot edit.** A class from a library, such as a date clock or an HTTP client, has no Spring annotations, and you cannot add them. A `@Bean` method lets you create it anyway.
- **Custom set-up.** Sometimes building an object takes several lines: pick a size, a colour, a time zone. A method is the natural place to write them.
- **Choosing at run time.** A `@Bean` method can use an `if` to decide which object to return.
- **Central place for wiring.** All settings for one area sit together in one class, which is easy to read.

A quick way to choose: if you own the class, put `@Component` (or `@Service`) on it. If you do not, or if the set-up is tricky, write a `@Bean` method.

## How it works

At start-up, Spring goes through a configuration class like this.

```text
+--------------------------------+
|  Scan finds a @Configuration   |
|  class                         |
+--------------------------------+
                |
                v
+--------------------------------+
|  Spring wraps the class in a   |
|  helper (a CGLIB proxy)        |
+--------------------------------+
                |
                v
+--------------------------------+
|  Each @Bean method is called   |
|  once, helpers first           |
+--------------------------------+
                |
                v
+--------------------------------+
|  Returned objects become beans |
|  named after the methods       |
+--------------------------------+
```

Spring calls each `@Bean` method exactly once. It reads the parameters of the method, finds beans of those types, and passes them in. Then it saves the returned object as a bean.

Notice the second step. Spring makes a special subclass of your configuration class, called a proxy. The proxy watches your bean methods. If one `@Bean` method calls another `@Bean` method, the proxy does not run the second method again. It returns the bean that already exists.

```text
frontDesk()   packingDesk()
    |             |
    | both call labelPrinter()
    v             v
+----------------------------+
| proxy hands out the SAME   |
| labelPrinter bean to both  |
+----------------------------+
```

Both desks call `labelPrinter()`, but neither gets a new printer. They share the single bean. That is why you can write plain Java that looks like it creates two objects and still get a proper single bean.

There are two ways to wire a bean method to another bean:

| Way | Example | Works when |
|---|---|---|
| Method parameter | `stationery(LabelPrinter printer)` | Always. Spring passes the bean in. |
| Call the other method | `new FrontDesk(labelPrinter())` | The class is a full `@Configuration` (proxied). |

> **Tip:** Method parameters are the safest way to connect beans. They work even if you turn the proxy off with `proxyBeanMethods = false`.

## Real-Life Example

A restaurant owner has a written setup sheet. It says: "Buy the oven from the vendor, set it to 220 degrees, and place it in the main kitchen. The baker and the chef both use this same oven." The oven comes from outside, so the owner cannot engrave a restaurant name into it. The sheet still tells the staff exactly how to get it ready.

The sheet is the `@Configuration` class. The line about the oven is a `@Bean` method. The baker and the chef sharing one oven is how one bean is shared by two other beans.

## Code Example

Let's set up QuickPrint, a print shop. `LabelPrinter` is a library class that we cannot annotate. A configuration class builds it, and then two desks share it. Use the same `pom.xml` as the first CineGo example, changing only the groupId and artifactId.

```text
quickprint/
└─ src/main/java/
   └─ com/quickprint/shop/
      ├─ ShopApplication.java
      ├─ LabelPrinter.java
      ├─ FrontDesk.java
      ├─ PackingDesk.java
      ├─ AppConfig.java
      └─ PrintRunner.java
```

**File:** `ShopApplication.java` in package `com.quickprint.shop`

```java
package com.quickprint.shop;

import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ShopApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(ShopApplication.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.setBannerMode(Banner.Mode.OFF);
        app.setLogStartupInfo(false);
        app.run(args);
    }
}
```

**File:** `LabelPrinter.java` in package `com.quickprint.shop`

```java
package com.quickprint.shop;

public class LabelPrinter {

    private final String brand;

    public LabelPrinter(String brand) {
        this.brand = brand;
    }

    public String print(String text) {
        return "[" + brand + "] " + text;
    }
}
```

**File:** `FrontDesk.java` in package `com.quickprint.shop`

```java
package com.quickprint.shop;

public class FrontDesk {

    private final LabelPrinter printer;

    public FrontDesk(LabelPrinter printer) {
        this.printer = printer;
    }

    public LabelPrinter printer() {
        return printer;
    }
}
```

**File:** `PackingDesk.java` in package `com.quickprint.shop`

```java
package com.quickprint.shop;

public class PackingDesk {

    private final LabelPrinter printer;

    public PackingDesk(LabelPrinter printer) {
        this.printer = printer;
    }

    public LabelPrinter printer() {
        return printer;
    }
}
```

**File:** `AppConfig.java` in package `com.quickprint.shop`

```java
package com.quickprint.shop;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AppConfig {

    @Bean
    public LabelPrinter labelPrinter() {
        return new LabelPrinter("QuickPrint");
    }

    @Bean
    public FrontDesk frontDesk() {
        return new FrontDesk(labelPrinter());
    }

    @Bean
    public PackingDesk packingDesk(LabelPrinter printer) {
        return new PackingDesk(printer);
    }
}
```

**File:** `PrintRunner.java` in package `com.quickprint.shop`

```java
package com.quickprint.shop;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class PrintRunner implements CommandLineRunner {

    private final ApplicationContext context;
    private final FrontDesk front;
    private final PackingDesk packing;

    public PrintRunner(ApplicationContext context, FrontDesk front, PackingDesk packing) {
        this.context = context;
        this.front = front;
        this.packing = packing;
    }

    @Override
    public void run(String... args) {
        System.out.println(front.printer().print("Invoice 21"));
        System.out.println("Same printer? " + (front.printer() == packing.printer()));
        System.out.println("Printer beans: " + context.getBeanNamesForType(LabelPrinter.class).length);
        System.out.println("Config: " + context.getBean(AppConfig.class).getClass().getSimpleName());
    }
}
```

Build and run it:

```bash
mvn -q package
java -jar target/shop-0.0.1-SNAPSHOT.jar
```

**Output:**

```text
[QuickPrint] Invoice 21
Same printer? true
Printer beans: 1
Config: AppConfig$$SpringCGLIB$$0
```

The front desk and the packing desk hold the very same printer, and only one `LabelPrinter` bean exists. The last line shows the trick. The class Spring uses is not `AppConfig` itself, but a generated subclass with `SpringCGLIB` in its name. That is the proxy which keeps the printer to one copy.

## Code Explained

- `LabelPrinter`, `FrontDesk` and `PackingDesk` are plain classes with no Spring annotations. We treat them as if they came from a library.
- `@Configuration` marks `AppConfig` as a source of beans.
- `labelPrinter()` is a `@Bean` method. It creates the printer with the brand `QuickPrint`, and the bean is named `labelPrinter`.
- `frontDesk()` calls `labelPrinter()` directly. Because of the proxy, this returns the existing bean, not a new printer.
- `packingDesk(LabelPrinter printer)` uses a method parameter instead. Spring passes in the same bean. Both styles give one shared printer.
- `PrintRunner` is a normal `@Component`. It receives the beans made by `AppConfig` through its constructor, so the two styles mix freely.

## Common Mistakes

> **Warning:** Do not mark a `@Bean` method `private` or `final`, and do not mark a full `@Configuration` class `final`. Spring must subclass the class and override the methods, so it cannot do that.

- **Forgetting `@Configuration`.** A class with only `@Bean` methods works in a limited "lite" mode. Calls between bean methods then create new objects. Always add `@Configuration` when methods call each other.
- **Using `@Bean` on your own classes for no reason.** If you own the class, `@Component` is shorter and clearer.
- **Two beans, same type.** Creating two `@Bean` methods that return the same type makes injection by type ambiguous. Give them names and use `@Qualifier`, which is covered soon.
- **Doing slow work in a bean method.** The method runs at start-up. Keep it short.

## Interview Questions

**What is the difference between `@Component` and `@Bean`?**
`@Component` goes on a class and is found by scanning. `@Bean` goes on a method inside a configuration class, so you decide how the object is built. Use `@Bean` for classes you cannot annotate.

**What does `@Configuration` do?**
It marks a class as a source of bean definitions. Spring proxies it so that calls between `@Bean` methods return the same bean instead of creating new ones.

**What is the name of a bean created by a `@Bean` method?**
By default it is the method name. You can override it with `@Bean(name = "...")`.

## Key Points to Remember

- `@Configuration` marks a class that holds bean recipes.
- Each `@Bean` method returns one object that becomes a bean, named after the method.
- Use `@Bean` for library classes or objects that need custom set-up.
- Spring proxies configuration classes, so calls between `@Bean` methods return the shared bean.
- Method parameters are the safest way to connect one bean to another.

## Frequently Asked Questions

### What is the difference between @Configuration and @Bean?

`@Configuration` is placed on a class and marks it as a holder of bean definitions. `@Bean` is placed on a method and defines one bean. You normally use them together.

### Can a @Bean method have parameters?

Yes. Spring finds beans of the parameter types and passes them in. This is the cleanest way to connect beans.

### Can I use @Bean without @Configuration?

You can, for example inside a `@Component` class, but it runs in lite mode. Calls between bean methods then create new objects. Use `@Configuration` when the methods depend on each other.

### How many times is a @Bean method called?

Once for a singleton bean. Spring calls it at start-up and saves the result. If you set the scope to prototype, it is called on every request.

## Related Topics

- [Spring Beans](/learning/spring-boot-tutorial/spring-beans): remember what a bean is and how it is named.
- [Component Scan](/learning/spring-boot-tutorial/component-scan): compare with the annotation-based way to create beans.
- [Autowired and Qualifier](/learning/spring-boot-tutorial/autowired-and-qualifier): pick the right bean when two match.
- [Bean Lifecycle](/learning/spring-boot-tutorial/bean-lifecycle): set init and destroy methods on your beans.
