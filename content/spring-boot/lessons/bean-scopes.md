Think of a coffee shop. There is one menu board on the wall, and every customer reads the same board. But every customer gets a fresh paper cup, and nobody drinks from a cup someone else has used. The board is shared. The cup is new for every order.

Spring beans work like that too. Some beans are shared by the whole program, and some are created again each time someone asks. That choice is called the bean scope, and there are several bean scopes to pick from. In this guide you will learn them, when to use each one, and a tricky trap that catches many beginners.

## What are Bean Scopes?

> **Definition:** The scope of a bean tells the Spring container how many instances of the bean to create and how long each one lives.

When you ask the container for a bean, the scope decides whether you get the same object every time or a new one. You choose the scope by adding the `@Scope` annotation to the class.

Spring gives you these scopes:

| Scope | What you get | Needs a web app? |
|---|---|---|
| `singleton` | One shared instance for the whole container. This is the default. | No |
| `prototype` | A new instance every time the bean is requested. | No |
| `request` | One instance per HTTP request. | Yes |
| `session` | One instance per user session. | Yes |
| `application` | One instance per web application context. | Yes |

Most of your beans, such as services and repositories, stay singleton. Prototype is used now and then. The web scopes appear when you build websites with sessions, and this guide focuses on the first two.

## Why is it used?

Different jobs need different sharing rules.

- **Singleton saves work.** A service with no personal data can serve every caller. Building one copy is cheaper than building thousands.
- **Prototype keeps things separate.** An object that holds data for one task, like a shopping cart or one order token, must not be shared, or people would see each other's data.
- **Request and session scopes match the web.** A logged-in user's preferences live for the session, and a form's temporary data lives for one request.

Choosing the wrong scope creates real bugs. A singleton that stores one customer's data in a field will show that data to the next customer. A prototype used where sharing was expected will create a needless pile of objects.

## How it works

Here is what the container does when you ask for a bean, for the two main scopes.

```text
getBean(CafeMenu)   [singleton]
        |
        v
  Already created?
   yes: return the same object
   no: create it, save it, return
```

For a singleton, Spring builds the object once (usually when the app starts), keeps it in a private store and returns that saved object for every request. Two callers who ask for `CafeMenu` end up holding the very same object.

```text
getBean(OrderToken) [prototype]
        |
        v
  Always create a new object
        |
        v
  Return it and forget about it
```

For a prototype, there is no saved copy. Each request builds a fresh object. After handing it over, the container does not track it, which also means it will not call destroy methods for it. Cleaning up a prototype is your job.

Now the trap. Suppose a singleton bean has a prototype bean injected into it.

```text
Startup: singleton is created
   |
   v
Prototype is injected ONCE
   |
   v
Singleton keeps that one object
for the rest of the app's life
```

Injection happens only when the singleton is created, which is once. So the "new every time" promise is quietly lost. The singleton keeps using the same prototype object forever. The fix is to ask the container for a fresh prototype each time you need one. The neat way is `ObjectProvider`, and you will see it in the code below.

> **Warning:** A prototype bean injected directly into a singleton behaves like a singleton. Use `ObjectProvider<T>` (or `getBean`) when you need a fresh instance on each call.

## Real-Life Example

At a busy sweet shop, the owner keeps one rate list on the counter. Everyone reads the same list, and if the owner updates a price, all customers see the new price. That rate list is a singleton.

Each customer, however, gets a fresh token number when they enter the queue. Token 12 belongs to one person only, and the next person gets token 13. Tokens are prototypes.

Now imagine the cashier wrote down one token number in the morning and gave that same token to every customer all day. That is the singleton-holding-a-prototype trap. Every customer would think it is their turn, and the queue would break.

## Code Example

Let's build BrewHouse, a cafe with a shared `CafeMenu` and a prototype `OrderToken`. Two counters use the token in two ways. `StuckDesk` has the token injected directly. `FreshDesk` asks for a new one each time. Use the same `pom.xml` as the first CineGo example, changing only the groupId and artifactId.

```text
brewhouse/
└─ src/main/java/
   └─ com/brewhouse/cafe/
      ├─ CafeApplication.java
      ├─ CafeMenu.java
      ├─ OrderToken.java
      ├─ StuckDesk.java
      ├─ FreshDesk.java
      └─ ScopeRunner.java
```

**File:** `CafeApplication.java` in package `com.brewhouse.cafe`

```java
package com.brewhouse.cafe;

import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CafeApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(CafeApplication.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.setBannerMode(Banner.Mode.OFF);
        app.setLogStartupInfo(false);
        app.run(args);
    }
}
```

**File:** `CafeMenu.java` in package `com.brewhouse.cafe`

```java
package com.brewhouse.cafe;

import org.springframework.stereotype.Component;

@Component
public class CafeMenu {
}
```

**File:** `OrderToken.java` in package `com.brewhouse.cafe`

```java
package com.brewhouse.cafe;

import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

@Component
@Scope("prototype")
public class OrderToken {

    private static final AtomicInteger COUNTER = new AtomicInteger();

    private final int number = COUNTER.incrementAndGet();

    public int number() {
        return number;
    }
}
```

**File:** `StuckDesk.java` in package `com.brewhouse.cafe`

```java
package com.brewhouse.cafe;

import org.springframework.stereotype.Component;

@Component
public class StuckDesk {

    private final OrderToken token;

    public StuckDesk(OrderToken token) {
        this.token = token;
    }

    public String serve() {
        return "StuckDesk gives token " + token.number();
    }
}
```

**File:** `FreshDesk.java` in package `com.brewhouse.cafe`

```java
package com.brewhouse.cafe;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;

@Component
public class FreshDesk {

    private final ObjectProvider<OrderToken> tokens;

    public FreshDesk(ObjectProvider<OrderToken> tokens) {
        this.tokens = tokens;
    }

    public String serve() {
        return "FreshDesk gives token " + tokens.getObject().number();
    }
}
```

**File:** `ScopeRunner.java` in package `com.brewhouse.cafe`

```java
package com.brewhouse.cafe;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class ScopeRunner implements CommandLineRunner {

    private final ApplicationContext context;
    private final StuckDesk stuck;
    private final FreshDesk fresh;

    public ScopeRunner(ApplicationContext context, StuckDesk stuck, FreshDesk fresh) {
        this.context = context;
        this.stuck = stuck;
        this.fresh = fresh;
    }

    @Override
    public void run(String... args) {
        boolean sameMenu = context.getBean(CafeMenu.class) == context.getBean(CafeMenu.class);
        System.out.println("Menu same object? " + sameMenu);

        OrderToken first = context.getBean(OrderToken.class);
        OrderToken second = context.getBean(OrderToken.class);
        System.out.println("Tokens " + first.number() + " and " + second.number());
        System.out.println("Token same object? " + (first == second));

        System.out.println(stuck.serve());
        System.out.println(stuck.serve());
        System.out.println(fresh.serve());
        System.out.println(fresh.serve());
    }
}
```

Build and run it:

```bash
mvn -q package
java -jar target/cafe-0.0.1-SNAPSHOT.jar
```

**Output:**

```text
Menu same object? true
Tokens 2 and 3
Token same object? false
StuckDesk gives token 1
StuckDesk gives token 1
FreshDesk gives token 4
FreshDesk gives token 5
```

Read the output carefully. The menu is one shared object, so the answer is `true`. The two tokens have different numbers, and they are different objects, which is what prototype means. Token 1 was already used at startup: Spring created it when it built `StuckDesk`. `StuckDesk` then gives that token 1 to everyone, twice in a row. `FreshDesk` asks for a new token on each call, so it gives new numbers.

## Code Explained

- `CafeMenu` has no `@Scope`, so it is a singleton by default. Both `getBean` calls return the same object.
- `@Scope("prototype")` on `OrderToken` makes Spring create a new object on every request. The static counter gives each new token the next number.
- `StuckDesk` receives an `OrderToken` in its constructor. That happens only once, so the desk holds the same token forever.
- `FreshDesk` receives an `ObjectProvider<OrderToken>`. Calling `getObject()` asks the container for a new prototype each time.
- The runner shows both behaviours side by side, so you can see the trap and its fix.

## Common Mistakes

> **Warning:** Never keep user-specific data, such as a logged-in customer's name, in a field of a singleton bean. Every request shares that one object, so users will overwrite each other's data.

- **Expecting prototype to work inside a singleton.** As shown above, direct injection gives one object for life. Use `ObjectProvider`.
- **Using prototype for everything.** New objects cost time and memory. Keep the default singleton unless you truly need separate state.
- **Expecting destroy callbacks on prototypes.** The container hands the object over and stops tracking it, so `@PreDestroy` is not called for prototype beans.
- **Using request or session scope in a plain program.** These scopes need a web application. In a console app they fail with an error about no active request.

## Interview Questions

**What is the default scope of a Spring bean?**
Singleton. One instance is created per container and shared everywhere.

**What is the difference between singleton and prototype?**
A singleton is created once and reused. A prototype is created again every time it is requested.

**What happens when a prototype bean is injected into a singleton?**
It is injected only once, when the singleton is created, so the singleton keeps the same prototype object. To get a new one each time, use `ObjectProvider` or call `getBean`.

## Key Points to Remember

- Scope decides how many instances of a bean exist and how long they live.
- Singleton is the default: one shared instance per container.
- Prototype creates a new instance for every request to the container.
- Request, session and application scopes exist for web applications.
- A singleton must not hold data that belongs to one user.
- Use `ObjectProvider` when a singleton needs a fresh prototype each time.

## Frequently Asked Questions

### Is a singleton bean the same as the singleton design pattern?

Not quite. The classic pattern allows one instance per JVM and the class controls this itself. A Spring singleton is one instance per container, and Spring controls it. You could have two containers with two instances.

### Are singleton beans thread safe?

Not automatically. Many requests can use the one object at the same time. Keep singleton beans free of changing data, or protect that data properly.

### When is a singleton bean created?

By default, when the application starts. This finds wiring mistakes early. You can delay creation with `@Lazy` if you have a reason.

### Can I change bean scopes for a bean I did not write?

Yes. If you create the bean in a `@Bean` method, you can put `@Scope` on that method.

## Related Topics

- [Spring Beans](/learning/spring-boot-tutorial/spring-beans): revisit what the container is holding.
- [Bean Lifecycle](/learning/spring-boot-tutorial/bean-lifecycle): see what happens from creation to destruction.
- [Dependency Injection](/learning/spring-boot-tutorial/dependency-injection): learn how beans reach the classes that need them.
- [Configuration and Bean](/learning/spring-boot-tutorial/configuration-and-bean): set a scope on a bean method.
