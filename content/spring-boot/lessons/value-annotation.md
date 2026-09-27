A pharmacy shows the delivery charge on a board at the counter. If the charge changes from 30 rupees to 40, the pharmacist changes the board, not the medicine shelves. Your code should work the same way. The number lives in a settings file, and the code just asks for it.

The `@Value` annotation is the simplest way to ask. You write the name of a setting above a field or constructor parameter, and Spring fills in the value before your bean is used.

## What is the @Value annotation?

> **Definition:** `@Value` injects a value into a bean. The value can come from a configuration key written as `${key}`, from a fixed text, or from a small Spring Expression Language calculation written as `#{expression}`.

Think of a runner in a hospital who fetches one item from a store room when the ward asks for it. The ward names the item, the runner brings it, and the ward never walks to the store room. Spring is the runner, the settings files are the store room, and `@Value` is the request slip.

Spring converts the text in the file into the type you declared. A setting `30` becomes an `int`. The text `true` becomes a `boolean`. A comma separated line becomes a `List<String>`.

## Why is it used?

- **No hard-coded numbers.** A delivery fee inside a Java class means a rebuild every time it changes.
- **Simple for one or two settings.** You do not need to write a whole class just to read a shop name.
- **Defaults are built in.** You can say what to use when the key is missing.
- **Type conversion is free.** Spring turns text into numbers, booleans and lists for you.

For a group of many related settings, the better tool is `@ConfigurationProperties`, which comes in the next guide of this course. Use `@Value` when you need a few single values.

## How it works

While Spring creates your bean, it looks at every `@Value` and asks the `Environment` for the key. The `Environment` has already loaded your `application.properties` file, environment variables and command line arguments.

```text
application.properties
        |
        v
+-------------------+
| Environment       |
| pharmacy.name     |
| pharmacy.delivery |
+-------------------+
        |
        v   ${pharmacy.name}
+-------------------+
| Spring creates    |
| PharmacyController|
+-------------------+
        |
        v
  value converted and injected
```

The placeholder `${pharmacy.name}` is replaced with the real text, converted to the target type, and passed to the constructor. If the key is missing and no default is given, the bean cannot be created and the application stops during startup. That early failure is good. You learn about a missing setting on the first run, not when a customer places an order.

## The Three Forms of the @Value Annotation

| Form | Meaning | Example |
|---|---|---|
| Placeholder | Read a key | `${pharmacy.name}` |
| Placeholder with default | Use a fallback if the key is missing | `${pharmacy.tagline:Stay well}` |
| Expression | Calculate a value with SpEL | `#{2 * 30}` |

The text after the first colon in a placeholder is the default. You can also mix the two forms, as in `#{${pharmacy.delivery-fee} * 2}`. Spring first replaces the placeholder with the number, then calculates the expression.

Lists deserve a small note. A comma separated line is split at each comma and the spaces around each item are trimmed by the conversion. If an item itself contains a comma, this simple form cannot hold it, and you should move to a properties class.

## Real-Life Example

GreenLeaf Pharmacy delivers medicines from three branches. The delivery fee, the shop name, whether the shop is open and the list of branches are all settings. The express fee is always double the normal fee, so the owner wants it calculated, not typed twice. There is also a tagline that is optional: if nobody writes one, a friendly default should appear.

## Code Example

Let's build the GreenLeaf info service. It reads five settings, calculates one, and defaults one.

**File:** `pom.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.1.1</version>
        <relativePath/>
    </parent>

    <groupId>com.greenleaf</groupId>
    <artifactId>pharmacy</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webmvc</artifactId>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

**File:** `application.properties` in `src/main/resources`

```properties
pharmacy.name=GreenLeaf Pharmacy
pharmacy.delivery-fee=30
pharmacy.open=true
pharmacy.branches=Pune,Nashik,Nagpur
```

**File:** `PharmacyApplication.java` in package `com.greenleaf.pharmacy`

```java
package com.greenleaf.pharmacy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PharmacyApplication {

    public static void main(String[] args) {
        SpringApplication.run(PharmacyApplication.class, args);
    }
}
```

**File:** `PharmacyController.java` in package `com.greenleaf.pharmacy`

```java
package com.greenleaf.pharmacy;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PharmacyController {

    record Info(String name, int deliveryFee, int expressFee, boolean open,
                List<String> branches, String tagline) {}

    private final Info info;

    public PharmacyController(
            @Value("${pharmacy.name}") String name,
            @Value("${pharmacy.delivery-fee}") int deliveryFee,
            @Value("#{${pharmacy.delivery-fee} * 2}") int expressFee,
            @Value("${pharmacy.open}") boolean open,
            @Value("${pharmacy.branches}") List<String> branches,
            @Value("${pharmacy.tagline:Your health, our care}") String tagline) {
        this.info = new Info(name, deliveryFee, expressFee, open, branches, tagline);
    }

    @GetMapping("/pharmacy")
    public Info pharmacy() {
        return info;
    }
}
```

Run it and call the endpoint:

```bash
./mvnw spring-boot:run
curl http://localhost:8080/pharmacy
```

**Output:**

```json
{
  "name": "GreenLeaf Pharmacy",
  "deliveryFee": 30,
  "expressFee": 60,
  "open": true,
  "branches": ["Pune", "Nashik", "Nagpur"],
  "tagline": "Your health, our care"
}
```

The real reply is on one line; it is spaced out here for reading.

## Code Explained

- `${pharmacy.name}` reads the key from `application.properties` and injects the text.
- `int deliveryFee` makes Spring convert the text `30` to a number. If the file said `thirty`, startup would fail.
- `#{${pharmacy.delivery-fee} * 2}` first resolves the placeholder and then multiplies, so the express fee is 60. There is no second setting to keep in sync.
- The comma separated line for `pharmacy.branches` becomes a `List<String>` with three items.
- `pharmacy.tagline` does not exist in the file. The text after the colon is used instead, so the reply shows the default tagline.
- The values are taken through the constructor. That keeps the fields final and makes the class easy to test.

We also removed `pharmacy.name` from the file and started the app again. It refused to start, and the error said `Could not resolve placeholder 'pharmacy.name'`. That is the behaviour you want for a required setting.

## Field Injection or Constructor Injection

You will often see `@Value` on a private field. It works, but the field cannot be final and a unit test has to use reflection to set it. Putting `@Value` on constructor parameters, as above, avoids both problems. In a plain test you simply call `new PharmacyController("Test", 10, 20, true, List.of(), "hi")`.

## Common Mistakes

> **Warning:** Use `${...}` for a setting key and `#{...}` for an expression. Writing `#{pharmacy.name}` looks for a bean called `pharmacy`, not a setting, and fails.

- **No default for an optional setting.** The app will not start if the key is missing. Add `:default` when the value is truly optional.
- **Typing the key wrongly.** `@ConfigurationProperties` accepts several spellings of one key, but `@Value` does not. Write the key in your annotation exactly as it appears in the file.
- **Using `@Value` on a static field.** Spring does not inject static fields.
- **Using it for large groups.** Twenty `@Value` lines in one class are hard to read and hard to check. Use a properties class instead.

## Interview Questions

**What is the difference between `${...}` and `#{...}` in `@Value`?**
`${...}` is a property placeholder that reads a configuration key. `#{...}` is a Spring Expression Language expression that Spring evaluates.

**How do you give a default value?**
Write it after a colon, such as `${pharmacy.tagline:Stay well}` inside the annotation.

**What happens if the key is missing and there is no default?**
Spring cannot create the bean and startup fails with a message that the placeholder could not be resolved.

## Key Points to Remember

- `@Value("${key}")` injects one setting from the `Environment`.
- Add `:default` after the key to make a setting optional.
- `#{...}` runs an expression, and it can contain a placeholder.
- Spring converts text to `int`, `boolean`, `List` and many other types.
- Prefer constructor parameters over private fields.
- For groups of settings, use `@ConfigurationProperties` instead.

## Frequently Asked Questions

### Can the @Value annotation read environment variables?

Yes. The `Environment` includes them, so `${JAVA_HOME}` or a variable you set yourself can be read the same way.

### Can I change a @Value after the app has started?

No. The value is injected once when the bean is created. To pick up a new value, restart the app.

### Is @Value the same as @Autowired?

No. `@Autowired` injects another bean. `@Value` injects a plain value such as text, a number or a list.

### Can I use @Value in any class?

Only in classes that Spring manages, such as a controller, service or component. A class you create with `new` gets nothing injected.

## Related Topics

- [@ConfigurationProperties](/learning/spring-boot-tutorial/configuration-properties): bind a whole group of settings to one class.
- [application.properties vs application.yml](/learning/spring-boot-tutorial/application-properties-vs-application-yml): the two files a value can come from.
- [Externalized Configuration](/learning/spring-boot-tutorial/externalized-configuration): where else a value can come from, such as environment variables.
- [Dependency Injection](/learning/spring-boot-tutorial/dependency-injection): how Spring passes beans into constructors.
