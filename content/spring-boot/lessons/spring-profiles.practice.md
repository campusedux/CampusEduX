Try each problem on your own first. Both use the same `pom.xml` as the CineGo example; only change the `groupId` and `artifactId`. The programs switch off the web server so the console shows only your lines.

### Easy: Summer and Winter Menu

BeanBrew cafe has a `Menu` interface with two beans: `SummerMenu` for the `summer` profile and `WinterMenu` for the `winter` profile. Set `summer` as the active profile in `application.properties`. A runner prints the drink of the season. Then run the same JAR with the `winter` profile from the command line.

> **Hint:** Put `@Profile("summer")` and `@Profile("winter")` on the two classes. The runner asks for a plain `Menu`, because only one bean exists in each run.

**Answer:** Only the bean whose profile is active is created. The command-line argument beats the properties file, so the second run picks winter.

**File:** `CafeApplication.java` in package `com.beanbrew.menu`

```java
package com.beanbrew.menu;

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

**File:** `application.properties` in `src/main/resources`

```properties
spring.profiles.active=summer
```

**File:** `Menu.java` in package `com.beanbrew.menu`

```java
package com.beanbrew.menu;

public interface Menu {

    String drink();
}
```

**File:** `SummerMenu.java` in package `com.beanbrew.menu`

```java
package com.beanbrew.menu;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("summer")
public class SummerMenu implements Menu {

    @Override
    public String drink() {
        return "Summer: cold coffee";
    }
}
```

**File:** `WinterMenu.java` in package `com.beanbrew.menu`

```java
package com.beanbrew.menu;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("winter")
public class WinterMenu implements Menu {

    @Override
    public String drink() {
        return "Winter: hot chocolate";
    }
}
```

**File:** `MenuRunner.java` in package `com.beanbrew.menu`

```java
package com.beanbrew.menu;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class MenuRunner implements CommandLineRunner {

    private final Menu menu;

    public MenuRunner(Menu menu) {
        this.menu = menu;
    }

    @Override
    public void run(String... args) {
        System.out.println(menu.drink());
    }
}
```

Running the jar prints:

```text
Summer: cold coffee
```

Running it again with the argument `--spring.profiles.active` set to `winter` on the command line prints:

```text
Winter: hot chocolate
```

### Medium: Festival Sale Settings

CornerMart shows its name and discount on the receipt. In `application.properties` set `shop.name=CornerMart` and no discount. Create a second file for the `sale` profile that changes the name to `CornerMart Sale` and sets `shop.discount=20`. A runner prints the name and the discount, using `0` when no discount is set. Run once with no profile and once with the `sale` profile.

> **Hint:** Inject `Environment` and call `getProperty("shop.discount", "0")` so the runner has a default. Activate the profile with the `--spring.profiles.active` argument.

**Answer:** With no profile, only the main file is read and the discount falls back to 0. With `sale`, the extra file is loaded on top and replaces the name.

**File:** `MartApplication.java` in package `com.cornermart.sale`

```java
package com.cornermart.sale;

import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MartApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(MartApplication.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.setBannerMode(Banner.Mode.OFF);
        app.setLogStartupInfo(false);
        app.run(args);
    }
}
```

**File:** `application.properties` in `src/main/resources`

```properties
shop.name=CornerMart
```

**File:** `application-sale.properties` in `src/main/resources`

```properties
shop.name=CornerMart Sale
shop.discount=20
```

**File:** `SaleRunner.java` in package `com.cornermart.sale`

```java
package com.cornermart.sale;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class SaleRunner implements CommandLineRunner {

    private final Environment environment;

    public SaleRunner(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void run(String... args) {
        System.out.println("Shop: " + environment.getProperty("shop.name"));
        System.out.println("Discount: " + environment.getProperty("shop.discount", "0") + "%");
    }
}
```

Running the jar with no profile prints:

```text
Shop: CornerMart
Discount: 0%
```

Running it with the argument `--spring.profiles.active` set to `sale` prints:

```text
Shop: CornerMart Sale
Discount: 20%
```
