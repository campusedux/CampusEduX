Walk into a modern hotel room and the lights switch on because the room noticed you. Plug a phone into the bedside socket and it starts charging, because the socket noticed a device. Nobody asked you to fill in a form first. Spring Boot's auto-configuration works like that room. It notices what is in your project and sets up the right objects before you ask. And just like the room, it steps aside the moment you flip a switch yourself.

This guide shows how auto-configuration decides what to create, how to change its choices with a property or your own bean, how to read its decision report, and how to switch a piece of it off.

## What is auto-configuration?

> **Definition:** Auto-configuration is the Spring Boot feature that creates beans for you based on what it finds: which libraries are on the classpath, which beans you already defined, and which properties you set.

A bean is simply an object that Spring creates and manages for you. When you add the web starter, auto-configuration sees Spring MVC and Tomcat on the classpath and creates a web server, a DispatcherServlet and a JSON mapper. You never write that setup code, yet it is all there when the app starts.

The switch that turns this on is `@EnableAutoConfiguration`, which is already inside the `@SpringBootApplication` annotation on your main class.

## Why is it used?

In a plain Spring app you write configuration for every piece: the server, the JSON converter, the database pool, the transaction manager. That code looks almost the same in every project, and mistakes in it are hard to spot.

Auto-configuration removes that repeated work:

- **Sensible defaults.** A standard setup appears the moment the library is present.
- **Easy changes.** Most defaults can be adjusted with one line in `application.properties`.
- **You stay in charge.** If you define your own bean of the same type, Spring Boot backs off and uses yours.
- **Nothing is hidden.** A report tells you exactly what was set up and why.

## How it works

Every Spring Boot library jar ships a list of auto-configuration classes in a file named `AutoConfiguration.imports` under `META-INF/spring`. At startup, Spring Boot reads these lists and checks each class's conditions.

```text
@SpringBootApplication starts
        |
        v
Read every .imports list on
the classpath (candidates)
        |
        v
Check each candidate's
@ConditionalOn... rules
        |
   +----+-----+
   |          |
  met      not met
   |          |
   v          v
Create     Skip it
its beans
        |
        v
Your own beans always win
```

Each candidate is a normal configuration class wrapped in conditions. If its library is missing, or you already made the bean, or a property turns it off, the candidate is skipped. In Spring Boot 4 every feature jar carries its own list, so a web app with JPA checks around 50 candidates spread across a dozen jars, and only the matching ones create beans.

The most common conditions are these:

| Condition | Creates the bean only when |
|---|---|
| `@ConditionalOnClass` | A certain class is on the classpath |
| `@ConditionalOnMissingBean` | You have not defined that bean yourself |
| `@ConditionalOnProperty` | A property has a certain value |
| `@ConditionalOnWebApplication` | The app is a web application |

## Real-Life Example

Think of a smart kitchen in a food delivery company. When a new chef arrives, the kitchen checks what they brought. A tandoor? It lights the tandoor. Their own knives? It leaves the house knives in the drawer. A note saying "no gas today"? It skips the gas stove. The kitchen's rules are the conditions, the chef's tools are your libraries and beans, and the note is a property.

## Code Example

QuickBite, a food delivery app, returns dishes as JSON. By default Jackson, the JSON library, uses the Java field names, so `dishName` stays `dishName`. The mobile team wants `dish_name` instead.

**File:** `MenuApplication.java` in package `com.quickbite.menu`

```java
package com.quickbite.menu;

import java.util.List;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class MenuApplication {

    record Dish(String dishName, int priceInRupees) {}

    public static void main(String[] args) {
        SpringApplication.run(MenuApplication.class, args);
    }

    @GetMapping("/dishes")
    public List<Dish> dishes() {
        return List.of(new Dish("Veg Biryani", 180));
    }
}
```

The first way to change the default is a property. Auto-configuration reads it while creating the JSON mapper:

**File:** `application.properties` in `src/main/resources`

```properties
spring.jackson.property-naming-strategy=SNAKE_CASE
```

The second way is to define the bean yourself. Auto-configuration then backs off completely:

**File:** `JsonConfig.java` in package `com.quickbite.menu`

```java
package com.quickbite.menu;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.json.JsonMapper;

@Configuration
public class JsonConfig {

    @Bean
    public JsonMapper jsonMapper() {
        return JsonMapper.builder()
                .propertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE)
                .build();
    }
}
```

Call `curl http://localhost:8080/dishes` after either change.

**Output:**

```json
[
  {
    "dish_name": "Veg Biryani",
    "price_in_rupees": 180
  }
]
```

Without either change the reply uses `dishName` and `priceInRupees`. The JSON is spaced out here for reading.

## Code Explained

- `@SpringBootApplication` switched on auto-configuration, which created a `JsonMapper` because Jackson is on the classpath.
- The property changed a setting on that auto-configured mapper. This is the lightest way to adjust a default.
- `JsonConfig` defines a `JsonMapper` bean of our own. Spring Boot's mapper has `@ConditionalOnMissingBean`, so it sees ours and is not created at all.
- Spring Boot 4 uses Jackson 3. Its main classes live in `tools.jackson` packages; only the annotations, such as `@JsonProperty`, keep their old `com.fasterxml.jackson` package.

## Reading the Decision Report

Start the app with `--debug`, or add `debug=true` to `application.properties`, and Spring Boot prints a CONDITIONS EVALUATION REPORT. It has four parts: Positive matches, Negative matches, Exclusions and Unconditional classes. With `JsonConfig` in place you will find this entry, shown here shortened and wrapped:

```text
Negative matches:
 JacksonAutoConfiguration
   #jacksonJsonMapper:
   Did not match:
   - @ConditionalOnMissingBean
     found beans of type
     JsonMapper: jsonMapper
```

This report is the first thing to read when you wonder "why did Spring Boot create this?" or "why didn't it?".

## Switching an Auto-Configuration Off

You can exclude one completely with `@SpringBootApplication(exclude = SomeAutoConfiguration.class)`, or with the `spring.autoconfigure.exclude` property. In Spring Boot 4 the classes live in each feature's own package. For example, `DataSourceAutoConfiguration` sits in the `autoconfigure` package under `org.springframework.boot.jdbc`. The practice problems below use the property.

## Common Mistakes

> **Warning:** Do not fight auto-configuration with a long list of exclusions. First try a property, then your own bean. Excluding is the last resort, because you also lose the defaults you did want.

- **Guessing instead of reading the report.** The debug report shows the exact reason for every decision.
- **Copying Jackson 2 imports.** Old posts import `ObjectMapper` from `com.fasterxml.jackson.databind`. That is Jackson 2, which Spring Boot 4 no longer brings, so the code does not even compile.
- **Putting your classes outside the main package.** Your own beans are only found, and only win, if component scan sees them.

## Interview Questions

**How does Spring Boot decide which beans to auto-configure?**
It loads candidate classes listed in each jar's `AutoConfiguration.imports` file and creates beans only from candidates whose `@Conditional` rules pass.

**What happens if you define a bean that Spring Boot would also create?**
Most auto-configured beans use `@ConditionalOnMissingBean`, so Spring Boot backs off and uses yours.

**How do you see which auto-configurations were applied?**
Run with `--debug` or set `debug=true` to print the conditions evaluation report.

## Key Points to Remember

- Auto-configuration creates beans based on the classpath, your beans and your properties.
- `@EnableAutoConfiguration` is already inside `@SpringBootApplication`.
- Change a default with a property first; define your own bean to replace it completely.
- The `--debug` report explains every match and non-match.
- Exclude an auto-configuration only when a property or a bean cannot do the job.

## Frequently Asked Questions

### Is auto-configuration slow?

No. The conditions are cheap checks done once at startup, and only matching candidates create beans.

### Can I write my own auto-configuration?

Yes. You write a configuration class with conditions and list it in your jar's `AutoConfiguration.imports` file. Companies do this for internal starters.

### Does my own @Configuration always override auto-configuration?

For beans guarded by `@ConditionalOnMissingBean`, yes, because auto-configuration runs after your configuration is registered and sees your bean.

### Where can I see all available properties?

Your IDE suggests them as you type in `application.properties`, and the Spring Boot reference documentation lists them by feature.

## Related Topics

- [Spring Boot Starters](/learning/spring-boot-tutorial/spring-boot-starters): the libraries auto-configuration reacts to.
- [@Configuration and @Bean](/learning/spring-boot-tutorial/configuration-and-bean): how to define your own beans.
- [Externalized Configuration](/learning/spring-boot-tutorial/externalized-configuration): all the places properties can come from.
