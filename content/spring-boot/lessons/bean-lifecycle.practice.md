Try each problem on your own first. Both use the same `pom.xml` as the CineGo example; only change the `groupId` and `artifactId`. The programs switch off the web server and close the container at the end so you can see the destroy callbacks.

### Easy: Gym Opening and Closing

FitZone Gym has a `GymHall` bean. When the bean is ready it must print `Gym open: lights on`. When the app closes it must print `Gym closed: lights off`. Add a runner that prints `Members are training`.

> **Hint:** Use `@PostConstruct` and `@PreDestroy` from `jakarta.annotation`. In `main`, keep the context returned by `run` and call `close()`.

**Answer:** The init callback runs before the runner. The destroy callback runs when `main` closes the container.

**File:** `GymApplication.java` in package `com.fitzone.hall`

```java
package com.fitzone.hall;

import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;

@SpringBootApplication
public class GymApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(GymApplication.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.setBannerMode(Banner.Mode.OFF);
        app.setLogStartupInfo(false);
        ConfigurableApplicationContext context = app.run(args);
        System.out.println("main: closing the app");
        context.close();
    }
}
```

**File:** `GymHall.java` in package `com.fitzone.hall`

```java
package com.fitzone.hall;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

import org.springframework.stereotype.Component;

@Component
public class GymHall {

    @PostConstruct
    public void open() {
        System.out.println("Gym open: lights on");
    }

    @PreDestroy
    public void close() {
        System.out.println("Gym closed: lights off");
    }
}
```

**File:** `GymRunner.java` in package `com.fitzone.hall`

```java
package com.fitzone.hall;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class GymRunner implements CommandLineRunner {

    private final GymHall hall;

    public GymRunner(GymHall hall) {
        this.hall = hall;
    }

    @Override
    public void run(String... args) {
        System.out.println("Members are training");
    }
}
```

Running the jar prints:

```text
Gym open: lights on
Members are training
main: closing the app
Gym closed: lights off
```

### Medium: Library Connection Pool with initMethod

LibraNet uses a `ConnectionPool` class from a vendor. You cannot edit it, so it has no Spring annotations. It has an `open()` method and a `close()` method. Register it as a bean so that Spring calls `open` after creation and `close` on shutdown. Print a line from each method, and a line from a runner that uses the pool.

> **Hint:** Create the bean in a `@Configuration` class with `@Bean(initMethod = "open", destroyMethod = "close")`.

**Answer:** The `@Bean` attributes name the two methods, so Spring calls them at the right times even though the class has no annotations.

**File:** `LibraApplication.java` in package `com.libranet.pool`

```java
package com.libranet.pool;

import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;

@SpringBootApplication
public class LibraApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(LibraApplication.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.setBannerMode(Banner.Mode.OFF);
        app.setLogStartupInfo(false);
        ConfigurableApplicationContext context = app.run(args);
        System.out.println("main: closing the app");
        context.close();
    }
}
```

**File:** `ConnectionPool.java` in package `com.libranet.pool`

```java
package com.libranet.pool;

public class ConnectionPool {

    public void open() {
        System.out.println("Pool opened");
    }

    public String borrow() {
        return "Connection borrowed";
    }

    public void close() {
        System.out.println("Pool closed");
    }
}
```

**File:** `PoolConfig.java` in package `com.libranet.pool`

```java
package com.libranet.pool;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PoolConfig {

    @Bean(initMethod = "open", destroyMethod = "close")
    public ConnectionPool connectionPool() {
        return new ConnectionPool();
    }
}
```

**File:** `PoolRunner.java` in package `com.libranet.pool`

```java
package com.libranet.pool;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class PoolRunner implements CommandLineRunner {

    private final ConnectionPool pool;

    public PoolRunner(ConnectionPool pool) {
        this.pool = pool;
    }

    @Override
    public void run(String... args) {
        System.out.println(pool.borrow());
    }
}
```

Running the jar prints:

```text
Pool opened
Connection borrowed
main: closing the app
Pool closed
```
