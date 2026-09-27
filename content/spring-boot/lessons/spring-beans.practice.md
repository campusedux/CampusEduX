Try each problem on your own first. Both use the same `pom.xml` as the CineGo example; only change the `groupId` and `artifactId`. The programs switch off the web server so the console shows only your lines.

### Easy: Toy Shop Beans by Name and Type

FunHouse Toys has two beans: a `ToyCatalog` (a plain `@Component`) and a `GiftWrapper` with the custom name `wrapper`. In a runner, fetch the catalog by type and the wrapper by name, and print one line from each. Also print whether the container contains a bean named `giftWrapper`.

> **Hint:** Inject `ApplicationContext` into the runner. Use `getBean(Class)` for the catalog and `getBean("wrapper", GiftWrapper.class)` for the wrapper. `containsBean` checks a name.

**Answer:** The custom name replaces the default one, so `giftWrapper` is not a bean name any more.

**File:** `ToyApplication.java` in package `com.funhouse.toys`

```java
package com.funhouse.toys;

import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ToyApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(ToyApplication.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.setBannerMode(Banner.Mode.OFF);
        app.setLogStartupInfo(false);
        app.run(args);
    }
}
```

**File:** `ToyCatalog.java` in package `com.funhouse.toys`

```java
package com.funhouse.toys;

import org.springframework.stereotype.Component;

@Component
public class ToyCatalog {

    public String featured() {
        return "Featured toy: Wooden Train";
    }
}
```

**File:** `GiftWrapper.java` in package `com.funhouse.toys`

```java
package com.funhouse.toys;

import org.springframework.stereotype.Component;

@Component("wrapper")
public class GiftWrapper {

    public String wrap(String toy) {
        return toy + " wrapped in red paper";
    }
}
```

**File:** `ToyRunner.java` in package `com.funhouse.toys`

```java
package com.funhouse.toys;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class ToyRunner implements CommandLineRunner {

    private final ApplicationContext context;

    public ToyRunner(ApplicationContext context) {
        this.context = context;
    }

    @Override
    public void run(String... args) {
        System.out.println(context.getBean(ToyCatalog.class).featured());
        System.out.println(context.getBean("wrapper", GiftWrapper.class).wrap("Train"));
        System.out.println("Has giftWrapper? " + context.containsBean("giftWrapper"));
    }
}
```

Running the jar prints:

```text
Featured toy: Wooden Train
Train wrapped in red paper
Has giftWrapper? false
```

### Medium: Print the Bean Register

BrightPath Coaching wants to see every bean from its own package. Create three beans: `FeeCounter`, `TimetableDesk` and a `@Repository` called `BatchStore` with the custom name `batches`. In a runner, print each bean name from the package `com.brightpath.register`, sorted, followed by the simple class name of the bean, in the form `name = ClassName`.

> **Hint:** `getBeanDefinitionNames()` gives the names, and `context.getType(name)` gives the class. Filter by the package name, then `sorted()`.

**Answer:** We filter Spring's own beans out by package, sort the names, and print the simple class name of each type. The runner and the main class appear too, because they are beans as well.

**File:** `BrightApp.java` in package `com.brightpath.register`

```java
package com.brightpath.register;

import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BrightApp {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(BrightApp.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.setBannerMode(Banner.Mode.OFF);
        app.setLogStartupInfo(false);
        app.run(args);
    }
}
```

**File:** `FeeCounter.java` in package `com.brightpath.register`

```java
package com.brightpath.register;

import org.springframework.stereotype.Component;

@Component
public class FeeCounter {
}
```

**File:** `TimetableDesk.java` in package `com.brightpath.register`

```java
package com.brightpath.register;

import org.springframework.stereotype.Service;

@Service
public class TimetableDesk {
}
```

**File:** `BatchStore.java` in package `com.brightpath.register`

```java
package com.brightpath.register;

import org.springframework.stereotype.Repository;

@Repository("batches")
public class BatchStore {
}
```

**File:** `RegisterRunner.java` in package `com.brightpath.register`

```java
package com.brightpath.register;

import java.util.Arrays;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class RegisterRunner implements CommandLineRunner {

    private final ApplicationContext context;

    public RegisterRunner(ApplicationContext context) {
        this.context = context;
    }

    @Override
    public void run(String... args) {
        Arrays.stream(context.getBeanDefinitionNames())
                .filter(name -> {
                    Class<?> type = context.getType(name);
                    return type != null && type.getName().startsWith("com.brightpath.register");
                })
                .sorted()
                .forEach(name -> System.out.println(name + " = " + context.getType(name).getSimpleName()));
    }
}
```

Running the jar prints:

```text
batches = BatchStore
brightApp = BrightApp
feeCounter = FeeCounter
registerRunner = RegisterRunner
timetableDesk = TimetableDesk
```
