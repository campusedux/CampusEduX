Try each problem on your own first. The first problem reuses the plain web `pom.xml` from the first guide of this course; only the group and artifact ids change. The second has its own `pom.xml`.

### Easy: Shop Name from Outside

SweetCrumb Bakery runs the same JAR in two shops. `GET /shop` must return `Shop: SweetCrumb Central` by default, and the branch manager must be able to change the name without rebuilding, by starting the JAR with a variable named `SHOP_NAME`.

> **Hint:** Put `shop.name=SweetCrumb Central` in `application.properties` and read it with `@Value`. Spring Boot maps the variable `SHOP_NAME` to the property `shop.name` on its own.

**Answer:** The properties file holds the default. A variable of the same name, in capital letters with an underscore, is stronger, so it replaces the default when present. Run `SHOP_NAME="SweetCrumb Airport" java -jar shop.jar` and the reply changes.

**File:** `application.properties` in `src/main/resources`

```properties
spring.main.banner-mode=off
logging.level.root=warn
shop.name=SweetCrumb Central
```

**File:** `ShopApplication.java` in package `com.sweetcrumb.shop`

```java
package com.sweetcrumb.shop;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class ShopApplication {

    @Value("${shop.name}")
    private String shopName;

    public static void main(String[] args) {
        SpringApplication.run(ShopApplication.class, args);
    }

    @GetMapping("/shop")
    public String shop() {
        return "Shop: " + shopName;
    }
}
```

Without the variable, `/shop` returns `Shop: SweetCrumb Central`. With `SHOP_NAME="SweetCrumb Airport"` it returns `Shop: SweetCrumb Airport`.

### Medium: Show the Deployed Version

Operators at TiffinBox want to know which version is live. Build the JAR as `tiffin-1.4.0.jar` and expose the build details at `GET /actuator/info`, so anyone can check the version after a release. Add a normal endpoint `GET /menu` returning `Dal, Rice, Roti`.

> **Hint:** Give the project the version `1.4.0`. Add the `build-info` goal to the `spring-boot-maven-plugin`, add the Actuator starter, and expose the `info` endpoint.

**Answer:** The `build-info` goal writes the file `META-INF/build-info.properties` while packaging. Actuator reads it and shows it under `/actuator/info`. The JAR name comes from the artifact id and version.

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
    <artifactId>tiffin</artifactId>
    <version>1.4.0</version>

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
                <executions>
                    <execution>
                        <goals>
                            <goal>build-info</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

**File:** `application.properties` in `src/main/resources`

```properties
spring.main.banner-mode=off
logging.level.root=warn
management.endpoints.web.exposure.include=health,info
```

**File:** `TiffinApplication.java` in package `com.tiffinbox.tiffin`

```java
package com.tiffinbox.tiffin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class TiffinApplication {

    public static void main(String[] args) {
        SpringApplication.run(TiffinApplication.class, args);
    }

    @GetMapping("/menu")
    public String menu() {
        return "Dal, Rice, Roti";
    }
}
```

After `mvn clean package`, run `java -jar target/tiffin-1.4.0.jar`. The call `GET /actuator/info` returns this (spaced out for reading; the time is when the JAR was built):

```json
{
  "build": {
    "artifact": "tiffin",
    "name": "tiffin",
    "time": "2026-09-26T21:35:27.091Z",
    "version": "1.4.0",
    "group": "com.tiffinbox"
  }
}
```
