Try each problem on your own first. Both need the actuator starter, so each brings its own `pom.xml`.

### Easy: Library Info Endpoint

Lakeview Library wants `/actuator/info` to show its name and opening hours. Expose only `health` and `info`, and add the keys `info.library` (`Lakeview Library`) and `info.hours` (`9 AM to 6 PM`). No Java code is needed apart from the main class.

> **Hint:** Use the `exposure.include` key under `management.endpoints.web`, and switch on the `env.enabled` key under `management.info`.

**Answer:** Keys that start with `info.` are shown by the info endpoint once the env contributor is enabled.

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

    <groupId>com.lakeview</groupId>
    <artifactId>desk</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webmvc</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
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
management.endpoints.web.exposure.include=health,info
management.info.env.enabled=true
info.library=Lakeview Library
info.hours=9 AM to 6 PM
```

**File:** `DeskApplication.java` in package `com.lakeview.desk`

```java
package com.lakeview.desk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DeskApplication {

    public static void main(String[] args) {
        SpringApplication.run(DeskApplication.class, args);
    }
}
```

Calling the info endpoint under `/actuator` prints:

```json
{
  "library": "Lakeview Library",
  "hours": "9 AM to 6 PM"
}
```

### Medium: Kitchen Open Health Check

TiffinBox has a kitchen that is either open or closed, controlled by the setting `tiffin.kitchen-open` (default `true`). Write a health indicator named `kitchen` that reports UP with the detail `open: true` when the kitchen is open and DOWN when it is closed. Show the health reply for both settings.

> **Hint:** Inject the setting with `@Value` into a `@Component("kitchen")` that implements `HealthIndicator`. Turn off the disk space and SSL checks to keep the reply short, and show details with `show-details=always`.

**Answer:** The indicator reads the flag and returns `Health.up()` or `Health.down()`. The overall status follows the worst component.

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

    <groupId>com.tiffinbox</groupId>
    <artifactId>kitchen</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webmvc</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
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
management.endpoint.health.show-details=always
management.health.diskspace.enabled=false
management.health.ssl.enabled=false
tiffin.kitchen-open=true
```

**File:** `KitchenApplication.java` in package `com.tiffinbox.kitchen`

```java
package com.tiffinbox.kitchen;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class KitchenApplication {

    public static void main(String[] args) {
        SpringApplication.run(KitchenApplication.class, args);
    }
}
```

**File:** `KitchenHealthIndicator.java` in package `com.tiffinbox.kitchen`

```java
package com.tiffinbox.kitchen;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.stereotype.Component;

@Component("kitchen")
public class KitchenHealthIndicator implements HealthIndicator {

    private final boolean open;

    public KitchenHealthIndicator(@Value("${tiffin.kitchen-open:true}") boolean open) {
        this.open = open;
    }

    @Override
    public Health health() {
        Health.Builder builder = open ? Health.up() : Health.down();
        return builder.withDetail("open", open).build();
    }
}
```

With the default setting, the health endpoint under `/actuator` prints:

```json
{
  "components": {
    "kitchen": {
      "details": { "open": true },
      "status": "UP"
    },
    "livenessState": { "status": "UP" },
    "ping": { "status": "UP" },
    "readinessState": { "status": "UP" }
  },
  "groups": ["liveness", "readiness"],
  "status": "UP"
}
```

Started with `--tiffin.kitchen-open=false`, the same call returns status code 503 and:

```json
{
  "components": {
    "kitchen": {
      "details": { "open": false },
      "status": "DOWN"
    },
    "livenessState": { "status": "UP" },
    "ping": { "status": "UP" },
    "readinessState": { "status": "UP" }
  },
  "groups": ["liveness", "readiness"],
  "status": "DOWN"
}
```

Both replies are spaced out here for reading.
