In a big hospital, some people are on the staff list. The receptionist, the pharmacist and the lab technician all have a name badge and a desk. The administration knows who they are, gives them their tools and decides when they start and finish. A visitor who wanders in from the street is not on that list. Nobody assigns them a desk.

Spring has the same idea. Some objects in your program are on Spring's staff list. Those are called Spring beans. Everything else is just an ordinary Java object. In this guide you will learn what a bean is, how to create one, how it is named, and how to look inside the container to see them.

## What are Spring Beans?

> **Definition:** A Spring bean is an object that is created, configured and managed by the Spring IoC container. Every bean has a name and a type, and the container keeps track of it.

The word "bean" is just a label. A bean is a normal Java object. What makes it special is who looks after it. If you write `new ReceptionDesk()` yourself, you get a plain object. If Spring creates a `ReceptionDesk` from your annotation, you get a bean.

The container stores all beans in one place, the `ApplicationContext`. You can think of it as a big register that says: name, type, and the object itself. When another class needs a bean, the container finds the right entry and passes it in.

There are two common ways to tell Spring that a class should become a bean:

- **Stereotype annotations on the class.** Mark the class with `@Component`, `@Service`, `@Repository` or `@Controller`. Spring finds it during component scan and creates it.
- **The @Bean method.** Write a method inside a `@Configuration` class and put `@Bean` on it. Whatever the method returns becomes a bean. This is handy for classes you did not write yourself. A later guide covers it.

## Why is it used?

Why not just create objects with `new`? Because a bean gets a lot of help that a plain object does not.

- **Dependencies are injected.** A bean gets the helpers it needs without extra code.
- **One shared copy by default.** The container creates a single instance and reuses it, which saves memory and keeps shared settings in one place.
- **Managed lifecycle.** The container can run code right after a bean is built and just before it is destroyed.
- **Extra powers.** Features like `@Transactional` and `@Async` only work on beans, because Spring wraps them in a helper layer.
- **Easy replacement.** In tests you can swap a real bean for a fake one without touching the classes that use it.

## How it works

A bean has a short life story. Here is how it moves from your code to a working object.

```text
+--------------------------------+
|  Class with @Component         |
+--------------------------------+
                |
                v
+--------------------------------+
|  Scan: Spring notes it as a    |
|  bean definition (a recipe)    |
+--------------------------------+
                |
                v
+--------------------------------+
|  Container creates the object  |
|  and injects its helpers       |
+--------------------------------+
                |
                v
+--------------------------------+
|  Bean stored under its name    |
|  in the ApplicationContext     |
+--------------------------------+
                |
                v
+--------------------------------+
|  Other classes receive it,     |
|  or you ask with getBean()     |
+--------------------------------+
```

At first Spring only keeps a **bean definition**, which is a recipe: the class, its scope and its needs. Later it cooks the recipe and creates the real object. That object is saved under a name. From then on, any class that needs it gets the same saved object.

The name comes from a simple rule. For a class like `ReceptionDesk` marked with a plain `@Component`, the name is the class name with the first letter in lower case: `receptionDesk`. If you write `@Component("pharmacy")`, the name is `pharmacy`.

> **Tip:** You can look a bean up by name, by type, or by both. Looking up by type is safest, because it breaks at compile time if you rename the class.

## Real-Life Example

Think about the staff register of a school. Every teacher is listed with a name and a subject. When the principal needs a maths teacher for a substitution, she does not hire a stranger. She checks the register and picks the maths teacher. The register holds one entry per person, and everybody who needs "the maths teacher" gets the same person.

The staff register is the `ApplicationContext`. Each teacher is a bean. Asking for "the maths teacher" is looking up by type, and asking for a teacher by name is looking up by name.

## Code Example

Let's build a tour of City Care Hospital's beans. We create three beans, then ask the container for them in different ways and print the names it holds. Use the same `pom.xml` as the first CineGo example, changing only the groupId and artifactId.

```text
hospital-beans/
└─ src/main/java/
   └─ com/citycare/wards/
      ├─ WardsApplication.java
      ├─ ReceptionDesk.java
      ├─ PharmacyStore.java
      ├─ LabService.java
      └─ BeanTour.java
```

**File:** `WardsApplication.java` in package `com.citycare.wards`

```java
package com.citycare.wards;

import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class WardsApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(WardsApplication.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.setBannerMode(Banner.Mode.OFF);
        app.setLogStartupInfo(false);
        app.run(args);
    }
}
```

**File:** `ReceptionDesk.java` in package `com.citycare.wards`

```java
package com.citycare.wards;

import org.springframework.stereotype.Component;

@Component
public class ReceptionDesk {

    public String greet() {
        return "Welcome to City Care";
    }
}
```

**File:** `PharmacyStore.java` in package `com.citycare.wards`

```java
package com.citycare.wards;

import org.springframework.stereotype.Component;

@Component("pharmacy")
public class PharmacyStore {

    public String opens() {
        return "Pharmacy opens at 8 AM";
    }
}
```

**File:** `LabService.java` in package `com.citycare.wards`

```java
package com.citycare.wards;

import org.springframework.stereotype.Service;

@Service
public class LabService {
}
```

**File:** `BeanTour.java` in package `com.citycare.wards`

```java
package com.citycare.wards;

import java.util.Arrays;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class BeanTour implements CommandLineRunner {

    private final ApplicationContext context;

    public BeanTour(ApplicationContext context) {
        this.context = context;
    }

    @Override
    public void run(String... args) {
        ReceptionDesk byType = context.getBean(ReceptionDesk.class);
        PharmacyStore byName = context.getBean("pharmacy", PharmacyStore.class);
        System.out.println("By type: " + byType.greet());
        System.out.println("By name: " + byName.opens());

        Object again = context.getBean("receptionDesk");
        System.out.println("Same object? " + (byType == again));
        System.out.println("Has receptionDesk? " + context.containsBean("receptionDesk"));
        System.out.println("Has pharmacyStore? " + context.containsBean("pharmacyStore"));

        System.out.println("Our beans:");
        Arrays.stream(context.getBeanDefinitionNames())
                .filter(name -> {
                    Class<?> type = context.getType(name);
                    return type != null && type.getName().startsWith("com.citycare");
                })
                .sorted()
                .forEach(name -> System.out.println("  " + name));
    }
}
```

Build and run it:

```bash
mvn -q package
java -jar target/wards-0.0.1-SNAPSHOT.jar
```

**Output:**

```text
By type: Welcome to City Care
By name: Pharmacy opens at 8 AM
Same object? true
Has receptionDesk? true
Has pharmacyStore? false
Our beans:
  beanTour
  labService
  pharmacy
  receptionDesk
  wardsApplication
```

The first two lines show that one bean can be found by its type and another by the custom name we gave it. The "Same object" line is `true` because the container keeps one copy of `ReceptionDesk` and hands out that same copy every time. The last part lists the beans from our own package. Spring holds many more beans of its own, and we filtered them out.

## Code Explained

- `@Component` makes `ReceptionDesk` a bean named `receptionDesk`. `@Service` does the same for `LabService`, and it also tells readers this class holds business logic.
- `@Component("pharmacy")` sets a custom name. After that, `pharmacyStore` no longer exists as a name, so `containsBean("pharmacyStore")` is `false`.
- `BeanTour` asks for the `ApplicationContext` itself in its constructor. Spring can inject the container into a bean too.
- `getBean(Class)` looks up by type. `getBean(String, Class)` looks up by name and checks the type.
- `getBeanDefinitionNames()` returns the names of every bean recipe in the container. We filter by package to hide Spring's own beans.
- Even the main class and the runner appear in the list. They are beans too.

## Common Mistakes

> **Warning:** Do not call `new PharmacyStore()` in your code and expect Spring features to work on it. That object is not in the container, so it gets no injection and no proxies.

- **Wrong name in getBean.** Asking for `"ReceptionDesk"` with a capital `R` fails. The default name starts with a lower case letter.
- **Two beans of one type.** Asking `getBean(Type.class)` when two beans match throws an error, because Spring cannot pick one for you.
- **Calling getBean everywhere.** Looking beans up by hand hides dependencies and hurts testing. Prefer constructor injection and use `getBean` only in special cases.
- **Forgetting that beans are shared.** A bean holding customer-specific data in a field can leak that data between users, because the same copy serves everyone.

## Interview Questions

**What is a Spring bean?**
It is an object created and managed by the Spring IoC container, stored under a name and available for injection.

**How do you declare a bean?**
Put a stereotype annotation such as `@Component` on the class, or write a method annotated with `@Bean` inside a `@Configuration` class.

**What is the default name of a bean?**
For a class-level annotation it is the class name with a lower case first letter. For a `@Bean` method it is the method name.

## Key Points to Remember

- A bean is an ordinary Java object that the Spring container creates and manages.
- Beans are created by stereotype annotations (`@Component`, `@Service`, `@Repository`, `@Controller`) or by `@Bean` methods.
- The container keeps beans in the `ApplicationContext`, each under a unique name.
- By default a bean is a single shared instance.
- Features like injection, `@Transactional` and `@Async` only work on beans.

## Frequently Asked Questions

### What is the difference between a bean and a normal Java object?

A bean is created and looked after by the Spring container. A normal object is created by your own code with `new`. Only beans get injection, lifecycle callbacks and Spring's extra features.

### Can I give a bean my own name?

Yes. Write the name inside the annotation, such as `@Component("pharmacy")`, or use `@Bean(name = "pharmacy")` on a method. Custom names help when two beans have the same type.

### How many Spring beans does an app have?

Even a tiny app has many, often a hundred or more, because Spring Boot adds its own beans for logging, the environment and auto-configuration. Yours are only a small part.

### Is every class in my project a bean?

No. Only classes that Spring is told about become beans. Data classes, records and helper classes you create with `new` are ordinary objects.

## Related Topics

- [Bean Scopes](/learning/spring-boot-tutorial/bean-scopes): decide how many copies of a bean exist.
- [Bean Lifecycle](/learning/spring-boot-tutorial/bean-lifecycle): follow a bean from creation to destruction.
- [Component Scan](/learning/spring-boot-tutorial/component-scan): see how Spring discovers your beans.
- [Configuration and Bean](/learning/spring-boot-tutorial/configuration-and-bean): create beans from methods.
