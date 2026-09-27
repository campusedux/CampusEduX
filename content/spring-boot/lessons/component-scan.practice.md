Try each problem on your own first. Both use the same `pom.xml` as the CineGo example; only change the `groupId` and `artifactId`. The programs switch off the web server so the console shows only your lines.

### Easy: Bring the Gift Cards into the Scan

PagePal Books has its main class in `com.pagepal.app`. A `GiftCards` bean was written by another team in `com.pagepal.extras`, and Spring does not find it. Fix the scan so both packages are searched, and print how many `GiftCards` beans exist.

> **Hint:** Add `scanBasePackages` to `@SpringBootApplication` and list both packages. Do not forget your own package.

**Answer:** The default scan covers only `com.pagepal.app` and below. Listing both packages brings `GiftCards` in, so the count is 1. Without the fix it would be 0.

**File:** `PagePalApplication.java` in package `com.pagepal.app`

```java
package com.pagepal.app;

import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {"com.pagepal.app", "com.pagepal.extras"})
public class PagePalApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(PagePalApplication.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.setBannerMode(Banner.Mode.OFF);
        app.setLogStartupInfo(false);
        app.run(args);
    }
}
```

**File:** `GiftCards.java` in package `com.pagepal.extras`

```java
package com.pagepal.extras;

import org.springframework.stereotype.Component;

@Component
public class GiftCards {
}
```

**File:** `GiftRunner.java` in package `com.pagepal.app`

```java
package com.pagepal.app;

import com.pagepal.extras.GiftCards;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class GiftRunner implements CommandLineRunner {

    private final ApplicationContext context;

    public GiftRunner(ApplicationContext context) {
        this.context = context;
    }

    @Override
    public void run(String... args) {
        System.out.println("GiftCards beans: " + context.getBeanNamesForType(GiftCards.class).length);
    }
}
```

Running the jar prints:

```text
GiftCards beans: 1
```

### Medium: Scan a Menu Package but Skip the Secret Menu

Metro Cafe keeps its menu classes in `com.metrocafe.menu`, outside the main package `com.metrocafe.app`. Add a `@Configuration` class that scans `com.metrocafe.menu` with `@ComponentScan`, but excludes the class `SecretMenu`. Print how many beans exist for `LunchMenu` and for `SecretMenu`.

> **Hint:** Use `@ComponentScan(basePackages = ..., excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = SecretMenu.class))`.

**Answer:** The extra scan adds `LunchMenu` but leaves out `SecretMenu`, because the filter matches that type. The counts are 1 and 0.

**File:** `CafeApplication.java` in package `com.metrocafe.app`

```java
package com.metrocafe.app;

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

**File:** `MenuScanConfig.java` in package `com.metrocafe.app`

```java
package com.metrocafe.app;

import com.metrocafe.menu.SecretMenu;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.FilterType;

@Configuration
@ComponentScan(
        basePackages = "com.metrocafe.menu",
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = SecretMenu.class))
public class MenuScanConfig {
}
```

**File:** `LunchMenu.java` in package `com.metrocafe.menu`

```java
package com.metrocafe.menu;

import org.springframework.stereotype.Component;

@Component
public class LunchMenu {
}
```

**File:** `SecretMenu.java` in package `com.metrocafe.menu`

```java
package com.metrocafe.menu;

import org.springframework.stereotype.Component;

@Component
public class SecretMenu {
}
```

**File:** `MenuRunner.java` in package `com.metrocafe.app`

```java
package com.metrocafe.app;

import com.metrocafe.menu.LunchMenu;
import com.metrocafe.menu.SecretMenu;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class MenuRunner implements CommandLineRunner {

    private final ApplicationContext context;

    public MenuRunner(ApplicationContext context) {
        this.context = context;
    }

    @Override
    public void run(String... args) {
        System.out.println("LunchMenu: " + context.getBeanNamesForType(LunchMenu.class).length);
        System.out.println("SecretMenu: " + context.getBeanNamesForType(SecretMenu.class).length);
    }
}
```

Running the jar prints:

```text
LunchMenu: 1
SecretMenu: 0
```
