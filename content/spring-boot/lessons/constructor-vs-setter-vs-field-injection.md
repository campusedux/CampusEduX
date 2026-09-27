Choosing between constructor vs setter vs field injection starts with a small story. A courier company hires a new delivery rider. There are three ways to hand over the route map. In the first, the map is given at the joining desk, and the rider cannot start work without it. In the second, the rider joins first, and the map is handed over later through a form. In the third, someone quietly slips the map into the rider's bag without telling anyone. All three riders end up with a map, but they are not equally safe. The first rider can never be sent out empty-handed. The third rider looks fine until the map is missing on the road.

Spring has the same three choices for giving a class its dependencies. In this guide we compare constructor vs setter vs field injection, see the same example written all three ways, and learn which one to choose and why.

## What are Constructor, Setter and Field Injection?

They are three ways for Spring to give a bean the other beans it needs.

> **Definition:** Constructor injection passes dependencies as constructor parameters. Setter injection passes them through setter methods after the object exists. Field injection places them directly into private fields using reflection, marked with `@Autowired`.

Here is a quick picture of each one.

- **Constructor injection.** The class lists its needs in its constructor. Spring cannot create the object until it has every one of them.
- **Setter injection.** The class has a no-argument constructor and a setter marked `@Autowired`. Spring builds the object first and then calls the setter.
- **Field injection.** The class has a private field marked `@Autowired`. Spring sets the field directly, even though there is no constructor or setter for it.

## Why is it important to choose well?

The three styles look alike, but they behave differently.

- **Safety.** With a constructor, an object can never exist in a half-built state. With a setter or a field, it can, at least for a moment.
- **Immutability.** Only constructor injection lets you mark the field `final`, so the dependency can never be swapped by accident.
- **Testing.** A constructor-injected class can be created with `new` and a fake helper. A field-injected class needs Spring or a reflection trick to fill its private field.
- **Clear needs.** A long constructor warns you that the class does too much. Field injection hides that warning, because adding one more `@Autowired` field looks harmless.
- **Optional helpers.** Setter injection is the right fit when a dependency is truly optional.

## How it works

Spring treats the three styles at different moments of a bean's creation.

```text
Constructor injection
  Spring finds all helpers
        |
        v
  Calls new Desk(helper)
        |
        v
  Object is complete at birth
```

With constructor injection Spring first collects every helper the constructor asks for, then calls it once. The object is complete from the very first moment.

```text
Setter or field injection
  Spring calls new Desk()
        |
        v
  Object exists, helper is null
        |
        v
  Spring calls the setter
  (or fills the field)
        |
        v
  Object is complete
```

With the other two styles, Spring first creates an empty object, and only then fills in the helper. For a short time the helper is null. If your constructor code or a careless caller uses the object during that window, you get a `NullPointerException`.

## Constructor vs Setter vs Field Injection at a Glance

Here is how the three compare.

| Point | Constructor | Setter | Field |
|---|---|---|---|
| Can the field be `final`? | Yes | No | No |
| Object complete after `new`? | Yes | No | No |
| Easy to test without Spring? | Yes | Yes, call the setter | No, needs reflection |
| Good for optional helpers? | Not really | Yes | Not really |
| Hides a class that does too much? | No, the constructor gets long | Somewhat | Yes |
| Spring team's advice | Preferred | For optional ones | Avoid |

> **Tip:** Use constructor injection for every required dependency, and setter injection only for optional ones. Skip field injection in your own code. You will still see it in old tutorials, so know how to read it.

## Real-Life Example

Think of a phone repair shop. In one arrangement, a technician cannot start a shift unless the toolbox is handed to him at the door. That is constructor injection. In another, he arrives first and the toolbox is delivered afterwards. That is setter injection. If the delivery is late, he stands idle. In the third arrangement, the toolbox is slid under his desk without anyone saying so, and he only finds out it is missing when he reaches for a screwdriver.

The first arrangement is the one where a customer is never made to wait for a missing tool.

## Code Example

Let's build SwiftShip, a courier service. Three desks each need a `RouteFinder`. Each desk uses a different injection style. The runner also creates each desk by hand, without Spring, to show the difference. Use the same `pom.xml` as the first CineGo example, changing only the groupId and artifactId.

```text
swiftship/
└─ src/main/java/
   └─ com/swiftship/desk/
      ├─ DeskApplication.java
      ├─ RouteFinder.java
      ├─ SmsAlert.java
      ├─ ConstructorDesk.java
      ├─ SetterDesk.java
      ├─ FieldDesk.java
      └─ DeskRunner.java
```

**File:** `DeskApplication.java` in package `com.swiftship.desk`

```java
package com.swiftship.desk;

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
        app.run(args);
    }
}
```

**File:** `RouteFinder.java` in package `com.swiftship.desk`

```java
package com.swiftship.desk;

import org.springframework.stereotype.Component;

@Component
public class RouteFinder {

    public String routeFor(String parcel) {
        return parcel + " via Ring Road";
    }
}
```

**File:** `SmsAlert.java` in package `com.swiftship.desk`

```java
package com.swiftship.desk;

public interface SmsAlert {

    void send(String text);
}
```

**File:** `ConstructorDesk.java` in package `com.swiftship.desk`

```java
package com.swiftship.desk;

import org.springframework.stereotype.Component;

@Component
public class ConstructorDesk {

    private final RouteFinder finder;

    public ConstructorDesk(RouteFinder finder) {
        this.finder = finder;
    }

    public String dispatch(String parcel) {
        return finder.routeFor(parcel);
    }
}
```

**File:** `SetterDesk.java` in package `com.swiftship.desk`

```java
package com.swiftship.desk;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class SetterDesk {

    private RouteFinder finder;
    private SmsAlert alert;

    @Autowired
    public void setFinder(RouteFinder finder) {
        this.finder = finder;
    }

    @Autowired(required = false)
    public void setAlert(SmsAlert alert) {
        this.alert = alert;
    }

    public String dispatch(String parcel) {
        return finder.routeFor(parcel);
    }

    public String alertStatus() {
        return alert == null ? "none" : "ready";
    }
}
```

**File:** `FieldDesk.java` in package `com.swiftship.desk`

```java
package com.swiftship.desk;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class FieldDesk {

    @Autowired
    private RouteFinder finder;

    public String dispatch(String parcel) {
        return finder.routeFor(parcel);
    }
}
```

**File:** `DeskRunner.java` in package `com.swiftship.desk`

```java
package com.swiftship.desk;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DeskRunner implements CommandLineRunner {

    private final ConstructorDesk constructorDesk;
    private final SetterDesk setterDesk;
    private final FieldDesk fieldDesk;

    public DeskRunner(ConstructorDesk constructorDesk, SetterDesk setterDesk, FieldDesk fieldDesk) {
        this.constructorDesk = constructorDesk;
        this.setterDesk = setterDesk;
        this.fieldDesk = fieldDesk;
    }

    @Override
    public void run(String... args) {
        System.out.println("Constructor: " + constructorDesk.dispatch("P7"));
        System.out.println("Setter: " + setterDesk.dispatch("P7"));
        System.out.println("Field: " + fieldDesk.dispatch("P7"));
        System.out.println("SMS alert: " + setterDesk.alertStatus());

        // now without Spring, plain Java
        System.out.println("Ctor by hand: " + new ConstructorDesk(new RouteFinder()).dispatch("P7"));
        try {
            new FieldDesk().dispatch("P7");
        } catch (NullPointerException e) {
            System.out.println("Field by hand: NPE thrown");
        }
        try {
            new SetterDesk().dispatch("P7");
        } catch (NullPointerException e) {
            System.out.println("Setter by hand: NPE thrown");
        }
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
Constructor: P7 via Ring Road
Setter: P7 via Ring Road
Field: P7 via Ring Road
SMS alert: none
Ctor by hand: P7 via Ring Road
Field by hand: NPE thrown
Setter by hand: NPE thrown
```

Inside Spring, all three desks work the same. The difference appears in the last three lines. The constructor desk can be created by hand with a `RouteFinder`, and it works at once. The field desk and the setter desk are created with nothing, so their helper is null and the first call fails.

## Code Explained

- `ConstructorDesk` stores its helper in a `final` field. Once built, it can never lose or change the helper.
- `SetterDesk` has two setters. `setFinder` is required, so Spring fails at start-up if no `RouteFinder` bean exists. `setAlert` uses `required = false`, so Spring simply skips it when no `SmsAlert` bean exists. That is why the alert status says `none`.
- `FieldDesk` has a private field with `@Autowired`. There is no constructor or setter, so outside Spring nobody can give it a `RouteFinder`.
- `new FieldDesk().dispatch("P7")` throws `NullPointerException`, which we catch and report. This is exactly what happens in a plain unit test of a field-injected class.
- Because `ConstructorDesk` has just one constructor, it needs no `@Autowired` at all.

## Common Mistakes

> **Warning:** Field injection makes a class hard to test without Spring and hides how many dependencies the class really has. Prefer constructor injection in your own code.

- **Two-way dependencies.** If `A` needs `B` in its constructor and `B` needs `A`, neither can be built first. Spring Boot refuses circular dependencies by default and stops with an error. Redesign so the dependency runs in one direction.
- **Using setter injection for required helpers.** The object can then exist without them. Use a constructor, or the setter can be skipped silently.
- **A giant constructor.** Six or seven parameters mean the class has too many jobs. Split it, instead of switching to field injection to hide the problem.
- **Forgetting `required = false`.** An `@Autowired` setter for a bean that does not exist fails at start-up.

## Interview Questions

**Which type of injection does Spring recommend, and why?**
Constructor injection for required dependencies. It makes the object complete at creation, allows `final` fields and makes testing easy.

**When would you use setter injection?**
For optional dependencies, or ones that may change after the object is created.

**What is wrong with field injection?**
The field cannot be `final`, the class cannot be built without Spring or reflection, and it hides a class that has too many dependencies.

## Key Points to Remember

- Constructor injection gives a complete, immutable object and is the recommended choice.
- Setter injection suits optional dependencies, together with `required = false`.
- Field injection is short to write but weak: no `final`, hard to test, easy to overload.
- A class with one constructor does not need `@Autowired` on it.
- Circular dependencies fail at start-up in Spring Boot, so the design must be one-way.

## Frequently Asked Questions

### What is the difference between constructor vs setter vs field injection?

They differ in how the dependency arrives. Constructor injection uses constructor parameters, setter injection uses a setter method, and field injection fills a private field directly.

### Which injection is best for Spring Boot?

Constructor injection. It is the style the Spring team recommends, and it works without Spring in tests.

### Can I mix injection styles in one class?

Yes. A common mix is constructor injection for required helpers and a setter for an optional one. Avoid mixing field injection into the same class.

### Does constructor injection need @Autowired?

Not if the class has a single constructor. Add `@Autowired` only when there are several constructors and you must mark the one Spring should use.

## Related Topics

- [Dependency Injection](/learning/spring-boot-tutorial/dependency-injection): the idea behind all three styles.
- [Autowired and Qualifier](/learning/spring-boot-tutorial/autowired-and-qualifier): control what gets injected.
- [Spring Beans](/learning/spring-boot-tutorial/spring-beans): what the container is holding.
- [Mockito in Spring Boot](/learning/spring-boot-tutorial/mockito-in-spring-boot): fake dependencies in tests.
