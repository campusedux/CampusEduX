Imagine a new manager taking over a large bookshop. She does not walk around asking each worker to introduce themselves. She takes the staff badge list and checks every counter in the building. Anyone with a badge on the list joins the team. A person standing in the shop next door, even if they wear a badge, is never counted because the manager never looked there.

Spring works like this manager. When your app starts, it walks through your packages looking for classes with special badges, and it turns each one into a bean. That walk is called component scan. In this guide you will see how it decides where to look, which badges it recognises, and what to do when a class is missed.

## What is Component Scan?

> **Definition:** Component scan is the process where Spring searches one or more packages for classes marked with stereotype annotations such as `@Component`, `@Service`, `@Repository` and `@Controller`, and registers each one as a bean.

Without component scan you would have to list every class by hand. With it, you write the annotation on the class and Spring finds it on its own.

The badges Spring looks for are called **stereotype annotations**.

| Annotation | Meaning |
|---|---|
| `@Component` | Any general purpose bean |
| `@Service` | A class holding business logic |
| `@Repository` | A class that talks to the database |
| `@Controller` | A web controller that returns pages |
| `@RestController` | A web controller that returns data such as JSON |
| `@Configuration` | A class that defines beans with `@Bean` methods |

`@Service`, `@Repository`, `@Controller` and `@Configuration` are all built on top of `@Component`. So they are all found by the same scan. The different names help you and your team read the code, and some add extra behaviour.

## Why is it used?

Component scan saves you from writing long lists.

- **Less setup.** Add an annotation and the class is picked up. No XML, no registration code.
- **Easy to grow.** A new service class only needs its annotation. Nothing else in the project changes.
- **Clear structure.** Because scan follows packages, your folder layout matters and stays tidy.
- **Speed for beginners.** You can focus on writing features. Spring handles the wiring.

There is one catch. Scan only looks where it has been told to look. Knowing where that is will save you hours of head scratching.

## How it works

Every Spring Boot app has a main class with `@SpringBootApplication`. That annotation includes `@ComponentScan`. If you give no settings, the scan starts in the package of that main class and goes down through every package below it.

```text
com.bookhub.shop   <- main class
   |
   +-- catalog          scanned
   |
   +-- billing          scanned

com.bookhub.partner  NOT scanned
```

The main class sits in `com.bookhub.shop`. Everything inside `com.bookhub.shop`, including `catalog` and `billing`, is searched. The package `com.bookhub.partner` is a sibling, not a child, so it is skipped. Annotated classes there stay ordinary classes.

Here is the routine step by step.

```text
+--------------------------------+
|  App starts, main class found  |
+--------------------------------+
                |
                v
+--------------------------------+
|  Scan the main class package   |
|  and all packages below it     |
+--------------------------------+
                |
                v
+--------------------------------+
|  Class has a stereotype        |
|  annotation? Make a bean       |
+--------------------------------+
                |
                v
+--------------------------------+
|  Beans are created and wired   |
+--------------------------------+
```

Spring checks each class it meets. If it carries `@Component` or one of its relatives, Spring records a bean definition. Classes without a badge are ignored. Only after the scan finishes does Spring create the beans and connect them.

> **Tip:** Keep your main class in the top-level package of your project, such as `com.bookhub.shop`, and put everything else below it. Then you never need extra scan settings.

If a class must live outside that tree, you widen the search. `scanBasePackages` on `@SpringBootApplication` lists exactly the packages to scan. You can also use `@ComponentScan` with `basePackages` on any configuration class, and add filters to include or exclude certain classes.

## Real-Life Example

A school principal prepares the list of teachers for exam duty. She checks the staff room, the science block and the arts block, all inside the main campus. A teacher who works at the sister school across the road is not on her list, even though they are just as qualified, because the principal only looked inside her own campus.

The campus is the main class package and its subpackages. The teachers with badges are the annotated classes. The sister school is a package outside the scan area. To include them, the principal must add that school to her list, which is what `scanBasePackages` does.

## Code Example

Let's build BookHub, an online bookstore. The main class lives in `com.bookhub.shop`. It has beans in two subpackages, `catalog` and `billing`, and one more bean in a sibling package called `partner`. The runner asks the container how many beans of each type exist. Use the same `pom.xml` as the first CineGo example, changing only the groupId and artifactId.

```text
bookhub/
└─ src/main/java/com/bookhub/
   ├─ shop/
   │  ├─ ShopApplication.java
   │  ├─ ScanRunner.java
   │  ├─ catalog/
   │  │  ├─ CatalogService.java
   │  │  └─ BookRepository.java
   │  └─ billing/
   │     └─ BillingService.java
   └─ partner/
      └─ PartnerOffers.java
```

**File:** `ShopApplication.java` in package `com.bookhub.shop`

```java
package com.bookhub.shop;

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

**File:** `CatalogService.java` in package `com.bookhub.shop.catalog`

```java
package com.bookhub.shop.catalog;

import org.springframework.stereotype.Service;

@Service
public class CatalogService {
}
```

**File:** `BookRepository.java` in package `com.bookhub.shop.catalog`

```java
package com.bookhub.shop.catalog;

import org.springframework.stereotype.Repository;

@Repository
public class BookRepository {
}
```

**File:** `BillingService.java` in package `com.bookhub.shop.billing`

```java
package com.bookhub.shop.billing;

import org.springframework.stereotype.Service;

@Service
public class BillingService {
}
```

**File:** `PartnerOffers.java` in package `com.bookhub.partner`

```java
package com.bookhub.partner;

import org.springframework.stereotype.Component;

@Component
public class PartnerOffers {
}
```

**File:** `ScanRunner.java` in package `com.bookhub.shop`

```java
package com.bookhub.shop;

import com.bookhub.partner.PartnerOffers;
import com.bookhub.shop.billing.BillingService;
import com.bookhub.shop.catalog.BookRepository;
import com.bookhub.shop.catalog.CatalogService;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class ScanRunner implements CommandLineRunner {

    private final ApplicationContext context;

    public ScanRunner(ApplicationContext context) {
        this.context = context;
    }

    @Override
    public void run(String... args) {
        show(CatalogService.class);
        show(BookRepository.class);
        show(BillingService.class);
        show(PartnerOffers.class);
    }

    private void show(Class<?> type) {
        int count = context.getBeanNamesForType(type).length;
        System.out.println(type.getSimpleName() + " found: " + count);
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
CatalogService found: 1
BookRepository found: 1
BillingService found: 1
PartnerOffers found: 0
```

Three classes were found, and `PartnerOffers` was not. It has `@Component` on it, but it lives in `com.bookhub.partner`, a sibling of the scanned package. Now add the missing package to the scan by changing one line in the main class:

```java
@SpringBootApplication(scanBasePackages = {"com.bookhub.shop", "com.bookhub.partner"})
public class ShopApplication {
```

Run the program again and the last line changes:

```text
PartnerOffers found: 1
```

## Code Explained

- `@Service` and `@Repository` are stereotypes built on `@Component`, so the scan picks them up.
- `CatalogService` and `BookRepository` are in a subpackage of `com.bookhub.shop`, so they are found without any extra setting.
- `PartnerOffers` is in a package outside the tree, so it is skipped and `getBeanNamesForType` returns an empty array.
- `scanBasePackages` replaces the default starting point, so we list the original package too. If we listed only `com.bookhub.partner`, the shop classes would no longer be scanned.
- The runner prints how many bean names match each type. Zero means the class never became a bean.

## Common Mistakes

> **Warning:** If the main class sits in the default package (no `package` line at all), or in a package that is not a parent of your other classes, Spring may scan far too much or far too little. Always give your project a proper top-level package.

- **Class outside the scan tree.** This is the most common cause of "No qualifying bean" errors and controllers that return 404. Move the class below the main package or add its package to `scanBasePackages`.
- **Missing annotation.** A class with no stereotype is invisible to the scan.
- **Listing only the new package.** When you set `scanBasePackages`, include your own main package as well.
- **Scanning too widely.** Pointing the scan at a huge package such as `com` slows startup and may pull in beans you did not want.

## Interview Questions

**What does component scan do?**
It searches packages for classes with stereotype annotations and registers them as beans in the container.

**Where does Spring Boot start scanning by default?**
In the package of the class marked with `@SpringBootApplication`, and in every package below it.

**How do you scan a package outside the main package?**
Use `scanBasePackages` on `@SpringBootApplication`, or `@ComponentScan(basePackages = ...)` on a configuration class.

## Key Points to Remember

- Component scan turns annotated classes into beans automatically.
- `@Service`, `@Repository`, `@Controller` and `@Configuration` all include `@Component`.
- The default scan starts at the main class package and goes downward only.
- Classes in sibling or parent packages are not scanned unless you say so.
- Use `scanBasePackages` or `@ComponentScan` to add more packages.

## Frequently Asked Questions

### What is component scan in Spring Boot?

It is the search Spring performs at startup to find classes with annotations like `@Component` and turn them into beans. In Spring Boot it is switched on by `@SpringBootApplication`.

### Why does my controller return 404?

Very often the controller class is outside the package tree of the main class, so component scan never registered it. Move it below the main package or widen the scan.

### Can I exclude a class from component scan?

Yes. `@ComponentScan` accepts `excludeFilters`, where you can leave out a class, a package pattern or every class with a given annotation.

### Does component scan slow the app down?

Slightly, because Spring reads class files at startup. In a normally sized project you will not notice it. Keep the scan area tight and it stays fast.

## Related Topics

- [Spring Beans](/learning/spring-boot-tutorial/spring-beans): see what the scan turns your classes into.
- [Configuration and Bean](/learning/spring-boot-tutorial/configuration-and-bean): create beans without scanning.
- [Spring Boot Project Structure](/learning/spring-boot-tutorial/spring-boot-project-structure): place your packages so scanning just works.
- [Auto Configuration](/learning/spring-boot-tutorial/auto-configuration): learn how Spring Boot adds beans on its own.
