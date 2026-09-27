Try each problem on your own first. Each one has its own `pom.xml`.

### Easy: Kitchen Header Filter

TiffinBox wants every reply from its menu service to carry the header `X-Kitchen: TiffinBox`, and the console to print the method and path of each request, like `[req] GET /menu`. The menu endpoint returns the text `Dal, Rice, Roti`. Do it with a filter, not inside the controller.

> **Hint:** Extend `OncePerRequestFilter`, set the header before calling `chain.doFilter`, and read the method with `request.getMethod()`.

**Answer:** The filter sets the header, prints one line, and passes the request on. The controller knows nothing about it.

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
spring.main.banner-mode=off
logging.level.root=warn
```

**File:** `KitchenFilter.java` in package `com.tiffinbox.kitchen`

```java
package com.tiffinbox.kitchen;

import java.io.IOException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class KitchenFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        System.out.println("[req] " + request.getMethod() + " " + request.getRequestURI());
        response.setHeader("X-Kitchen", "TiffinBox");
        chain.doFilter(request, response);
    }
}
```

**File:** `KitchenApplication.java` in package `com.tiffinbox.kitchen`

```java
package com.tiffinbox.kitchen;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class KitchenApplication {

    public static void main(String[] args) {
        SpringApplication.run(KitchenApplication.class, args);
    }

    @GetMapping("/menu")
    public String menu() {
        return "Dal, Rice, Roti";
    }
}
```

Calling `curl -i http://localhost:8080/menu` shows the header `X-Kitchen: TiffinBox`, the body `Dal, Rice, Roti`, and the console prints:

```text
[req] GET /menu
```

### Medium: Clinic Staff Pass Guard

City Care Clinic exposes `/staff/patients` (returns `Ravi, Meera`) and a public `/health` endpoint (returns `UP`). Protect only `/staff/**` with an interceptor. The expected pass lives in `application.properties` as `clinic.staff-pass=ward-123`. A request must send it in the header `X-Staff-Pass`. If the header is missing or wrong, reply with status 403 and the JSON body `{"error":"Invalid staff pass"}`.

> **Hint:** Inject the value with `@Value`. In `preHandle`, set `response.setStatus(403)`, set the content type, write the body, and return `false`. Register the interceptor for `/staff/**` only.

**Answer:** The interceptor compares the header with the configured value and stops the request when they differ. `/health` is outside the path pattern, so it stays public.

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

    <groupId>com.citycare</groupId>
    <artifactId>guard</artifactId>
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
spring.main.banner-mode=off
logging.level.root=warn
clinic.staff-pass=ward-123
```

**File:** `StaffPassInterceptor.java` in package `com.citycare.guard`

```java
package com.citycare.guard;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class StaffPassInterceptor implements HandlerInterceptor {

    private final String expected;

    public StaffPassInterceptor(@Value("${clinic.staff-pass}") String expected) {
        this.expected = expected;
    }

    @Override
    public boolean preHandle(HttpServletRequest request,
            HttpServletResponse response, Object handler) throws Exception {
        if (expected.equals(request.getHeader("X-Staff-Pass"))) {
            return true;
        }
        response.setStatus(403);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"Invalid staff pass\"}");
        return false;
    }
}
```

**File:** `WebConfig.java` in package `com.citycare.guard`

```java
package com.citycare.guard;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final StaffPassInterceptor staffPassInterceptor;

    public WebConfig(StaffPassInterceptor staffPassInterceptor) {
        this.staffPassInterceptor = staffPassInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(staffPassInterceptor).addPathPatterns("/staff/**");
    }
}
```

**File:** `GuardApplication.java` in package `com.citycare.guard`

```java
package com.citycare.guard;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class GuardApplication {

    public static void main(String[] args) {
        SpringApplication.run(GuardApplication.class, args);
    }

    @GetMapping("/staff/patients")
    public String patients() {
        return "Ravi, Meera";
    }

    @GetMapping("/health")
    public String health() {
        return "UP";
    }
}
```

With the header `X-Staff-Pass: ward-123`, `/staff/patients` returns `Ravi, Meera`. Without it, the reply is status 403 with `{"error":"Invalid staff pass"}`. `/health` always returns `UP`.
