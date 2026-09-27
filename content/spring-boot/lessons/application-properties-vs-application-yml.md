Every bakery has a small notice board near the counter: shop name, opening days, how many cakes can be baked each day. Nobody prints those notes inside the recipe book, because they change. A Spring Boot app has the same need. Settings such as the port number or the shop name should live in a file next to the code, not inside it.

Spring Boot reads that file in one of two formats: `application.properties` or `application.yml`. Both do the same job. In this guide on application.properties vs application.yml you will learn how each one looks, where they differ, and how to pick one without regret.

## What is application.properties vs application.yml?

> **Definition:** `application.properties` and `application.yml` are the two default configuration files of a Spring Boot app. Both sit in `src/main/resources`, and Spring Boot loads them automatically at startup.

Think of two notice boards that show the same information. One is a plain list, one line per fact. The other is grouped under headings, so related facts sit together. The shop does not care which board you hang, as long as the facts are the same.

The properties format is a flat list of `key=value` lines. The YAML format (the file ends in `.yml` or `.yaml`) uses indentation to show which setting belongs under which heading.

## Why is it used?

Three reasons make these files worth learning well:

- **Change behaviour without changing code.** Moving the app to another port needs one edited line and no recompile.
- **One place for all settings.** Database address, logging level and your own custom values live together.
- **Spring Boot already knows many keys.** Names like `server.port` and `spring.application.name` are built in, and your own keys sit beside them.

Choosing between the two formats is mostly about readability. Deep, grouped settings read better in YAML. Short files read fine in properties.

## How it works

At startup Spring Boot looks for the configuration files, turns every setting into a flat key and value, and stores them in the `Environment`. Your code and Spring's own auto-configuration then read from there.

```text
application.properties
        |
        +--> flat keys ---+
                          |
application.yml           v
        |          +-------------+
        +--> flat->| Environment |
                   +-------------+
                          |
                          v
             beans read the values
```

Both formats end up as the same flat keys. A YAML block like `server:` with `port:` under it becomes the key `server.port`. A list becomes `bakery.open-days[0]`, `bakery.open-days[1]` and so on. If the same key appears in both files, the `.properties` value wins. This matters when someone leaves an old file behind.

## Side by Side

| Feature | properties | YAML |
|---|---|---|
| Layout | One `key=value` per line | Indented groups |
| Repeated prefix | Written on every line | Written once |
| Lists | `key[0]=a` or `key=a,b,c` | Dash items under the key |
| Comments | `#` | `#` |
| Several profiles in one file | Not possible | Yes, separated by `---` |
| Easy to break | Rarely | A wrong indent changes meaning |

## When to Choose Which

A simple rule works well. If your file has fewer than a dozen lines and few groups, stay with properties. If you see the same prefix repeated ten times, or you keep lists and nested groups, move to YAML.

There is also a team side to the choice. Many tutorials, Docker samples and Spring Initializr projects start with `application.properties`, so newcomers meet it first. Larger teams, on the other hand, often switch to YAML because a database block, a mail block and a security block are much easier to scan when each has its own heading. Neither choice is wrong. Consistency matters more than the format.

One more difference is comments and special characters. Both formats use `#` for comments. In properties a value ends at the end of the line, so you never need quotes. In YAML a value such as `yes` or `no` can be read as a boolean, so text like that is safer inside quotes.

## Real-Life Example

SweetCrumbs bakery runs a small ordering service. It needs its shop name, the port, the daily cake limit and the days it is open. The same numbers would go into a properties file as five separate lines, all starting with `bakery.`. In YAML the word `bakery:` is written once and the settings hang under it, like items under a heading on the notice board. When the festival season arrives, the owner wants a higher daily limit for two weeks. She does not touch the Java code. She changes one number in the file, restarts the app, and the new limit is live.

## Code Example

Let's build the SweetCrumbs settings service. It reads values from `application.yml` and shows them at `/shop`.

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

    <groupId>com.sweetcrumbs</groupId>
    <artifactId>shop</artifactId>
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

**File:** `application.yml` in `src/main/resources`

```yaml
server:
  port: 8081

spring:
  application:
    name: sweetcrumbs-shop

bakery:
  shop-name: SweetCrumbs
  daily-limit: 40
  open-days:
    - Mon
    - Tue
    - Sat
```

**File:** `ShopApplication.java` in package `com.sweetcrumbs.shop`

```java
package com.sweetcrumbs.shop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ShopApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShopApplication.class, args);
    }
}
```

**File:** `ShopController.java` in package `com.sweetcrumbs.shop`

```java
package com.sweetcrumbs.shop;

import java.util.Map;

import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ShopController {

    private final Environment env;

    public ShopController(Environment env) {
        this.env = env;
    }

    @GetMapping("/shop")
    public Map<String, Object> shop() {
        return Map.of(
                "app", env.getProperty("spring.application.name"),
                "shop", env.getProperty("bakery.shop-name"),
                "dailyLimit", env.getProperty("bakery.daily-limit", Integer.class),
                "firstOpenDay", env.getProperty("bakery.open-days[0]"));
    }
}
```

Run it and call the endpoint:

```bash
./mvnw spring-boot:run
curl http://localhost:8081/shop
```

**Output:**

```json
{
  "app": "sweetcrumbs-shop",
  "shop": "SweetCrumbs",
  "dailyLimit": 40,
  "firstOpenDay": "Mon"
}
```

The reply comes back on one line, and the order of the keys can vary. It is spaced out here for reading. The console also shows that Tomcat started on port 8081, so the YAML file was read.

The same settings written as `application.properties` look like this:

```properties
server.port=8081
spring.application.name=sweetcrumbs-shop
bakery.shop-name=SweetCrumbs
bakery.daily-limit=40
bakery.open-days[0]=Mon
bakery.open-days[1]=Tue
bakery.open-days[2]=Sat
```

Swap the file and the endpoint returns the very same answer.

## Code Explained

- `server.port` moves Tomcat from 8080 to 8081. Spring Boot already knows this key.
- Keys such as `bakery.shop-name` are ours. Spring Boot does not care what they mean; it only stores them.
- The `Environment` is the store of all settings. `getProperty` reads one key, and the second argument asks for a number instead of text.
- `bakery.open-days[0]` is how a YAML list looks after flattening: the key name, then the position in square brackets.
- Because the flattened keys are identical, the properties file above is a perfect twin of the YAML file.

## Common Mistakes

> **Warning:** In YAML, indentation is the structure. Use spaces, never tabs, and keep every level the same width. One misplaced space can move a setting under the wrong heading, and Spring Boot will not warn you.

- **Keeping both files with different values.** The `.properties` file wins over `.yml`, so an old forgotten file can silently override your new setting.
- **Forgetting the space after the colon.** `port:8081` is text, not a setting. Write `port: 8081`.
- **Using tabs in YAML.** Tabs are not allowed and the file fails to load.
- **Wrong location.** Put the file in `src/main/resources`, not in the project root.

## Interview Questions

**Which file wins if both `application.properties` and `application.yml` set the same key?**
The `.properties` file. When both sit in the same folder, Spring Boot gives the properties file the higher priority. We tested this by setting `bakery.daily-limit=99` in a properties file next to the YAML one, and the endpoint returned 99.

**Where must the files be placed?**
On the classpath root, which for Maven means `src/main/resources`.

**Can YAML hold several profiles in one file?**
Yes. Separate the blocks with `---` and mark each with the `on-profile` key under `spring.config.activate`.

## Key Points to Remember

- Both files configure the same `Environment`; only the writing style differs.
- YAML groups settings by indentation, properties repeat the full key.
- The properties file wins when both files define a key.
- YAML needs spaces, never tabs, and a space after each colon.
- Pick one format per project and stay with it.

## Frequently Asked Questions

### Which is better, application.properties vs application.yml?

Neither is better. Both work. Teams with deeply grouped settings, such as many database or security keys, usually prefer YAML. Small projects often keep the plain properties file.

### Can I use both in one project?

Yes, but avoid it. Two files with overlapping keys make it hard to know where a value came from.

### Does the file name have to be exactly application?

That is the default name. You can change it with the `spring.config.name` setting, but most projects never need to.

### Are YAML files slower than properties files?

No. Both are read once at startup, so the difference is far too small to notice.

## Related Topics

- [Spring Profiles](/learning/spring-boot-tutorial/spring-profiles): use one file per environment, such as development and production.
- [@Value Annotation](/learning/spring-boot-tutorial/value-annotation): inject a single setting into a field.
- [@ConfigurationProperties](/learning/spring-boot-tutorial/configuration-properties): bind a whole group of settings to one class.
- [Externalized Configuration](/learning/spring-boot-tutorial/externalized-configuration): the full order in which Spring Boot reads all its sources.
