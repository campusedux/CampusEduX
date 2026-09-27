Every hospital ward has a nurse who walks the round. She checks the beds, the oxygen, the lights, and writes "all fine" or "bed 4 needs help". Nobody has to open every room and inspect it. One walk gives the whole picture. A running application needs the same kind of round, so that tools and people can ask, "Are you healthy?" without reading your code.

The Spring Boot Actuator is that nurse. In this guide on Spring Boot Actuator you will add it, read its health and info answers, look at a metric, write a health check of your own, and learn which endpoints are safe to show.

## What is Spring Boot Actuator?

> **Definition:** Spring Boot Actuator is a set of ready-made endpoints that show the health, settings and numbers of a running application, such as `/actuator/health` and `/actuator/metrics`.

You add one starter, `spring-boot-starter-actuator`, and Spring Boot exposes these endpoints for you. They are plain HTTP addresses that return JSON. A load balancer can call the health endpoint every few seconds, a person can read the info endpoint, and a monitoring tool can collect the metrics.

## Why is it used?

- **Health checks.** Servers and containers need a yes or no answer to "is the app alive and ready?".
- **Monitoring.** Memory use, request counts and response times are available without writing code.
- **Troubleshooting.** You can see loggers, settings and threads of a live app.
- **Your own checks.** You can add a health rule for your own business, such as free beds in a ward.

## How it works

A request to an actuator address is handled by an endpoint. The health endpoint asks every health indicator for its status, then combines the answers into one.

```text
GET /actuator/health
        |
        v
+--------------------+
| health endpoint    |
+--------------------+
   |        |       |
   v        v       v
 ping    beds   readiness
   |        |       |
   +--------+-------+
        |
        v
  worst status wins
  UP or DOWN
```

Each indicator returns UP or DOWN, often with details. The endpoint takes the worst status, so one failing part makes the whole answer DOWN. When it is DOWN, the HTTP status code is 503, which tells a load balancer to stop sending customers to this instance.

## Common Endpoints

| Endpoint | Shows |
|---|---|
| `health` | UP or DOWN, with details if allowed |
| `info` | Facts you add about the app |
| `metrics` | Numbers such as memory and requests |
| `loggers` | Log levels, which you can change live |
| `env` | Settings and their sources |
| `beans` | Every bean in the context |

Only `health` is exposed over HTTP by default. The others must be switched on with a setting, and some, such as `env`, can reveal private information.

## Real-Life Example

City Care Hospital has a bed booking service for its general ward. The hospital dashboard must know if the service can accept patients. The service is technically running even when every bed is taken, but for the hospital that means "not ready". So we add a custom health rule: when no bed is free, the health status becomes DOWN. The dashboard sees the change within seconds.

## Code Example

Let's build the ward service. It exposes three endpoints, adds an info block, and has a health indicator for beds.

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
    <artifactId>ward</artifactId>
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
management.endpoints.web.exposure.include=health,info,metrics
management.endpoint.health.show-details=always
management.info.env.enabled=true
info.hospital=City Care Hospital
info.ward=General Ward
management.health.diskspace.enabled=false
management.health.ssl.enabled=false
```

**File:** `WardApplication.java` in package `com.citycare.ward`

```java
package com.citycare.ward;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class WardApplication {

    public static void main(String[] args) {
        SpringApplication.run(WardApplication.class, args);
    }
}
```

**File:** `BedService.java` in package `com.citycare.ward`

```java
package com.citycare.ward;

import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.stereotype.Service;

@Service
public class BedService {

    private final AtomicInteger freeBeds = new AtomicInteger(12);

    public int freeBeds() {
        return freeBeds.get();
    }

    public int admit() {
        return freeBeds.decrementAndGet();
    }
}
```

**File:** `BedHealthIndicator.java` in package `com.citycare.ward`

```java
package com.citycare.ward;

import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.stereotype.Component;

@Component("beds")
public class BedHealthIndicator implements HealthIndicator {

    private final BedService beds;

    public BedHealthIndicator(BedService beds) {
        this.beds = beds;
    }

    @Override
    public Health health() {
        int free = beds.freeBeds();
        if (free > 0) {
            return Health.up().withDetail("freeBeds", free).build();
        }
        return Health.down().withDetail("freeBeds", 0).build();
    }
}
```

**File:** `WardController.java` in package `com.citycare.ward`

```java
package com.citycare.ward;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WardController {

    private final BedService beds;

    public WardController(BedService beds) {
        this.beds = beds;
    }

    @PostMapping("/admit")
    public String admit() {
        return "Beds left: " + beds.admit();
    }
}
```

Run it and call the endpoints:

```bash
./mvnw spring-boot:run
curl http://localhost:8080/actuator/health
curl http://localhost:8080/actuator/info
```

**Output:**

```json
{
  "components": {
    "beds": {
      "details": { "freeBeds": 12 },
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

The info call returns `{"hospital":"City Care Hospital","ward":"General Ward"}`. Real replies are on one line; the health reply is spaced out here for reading.

Now admit twelve patients with `curl -X POST http://localhost:8080/admit` and check the health again. In our run, the `beds` component showed `"freeBeds": 0` with status `DOWN`, the overall status was `DOWN`, and the HTTP status code was 503.

## Code Explained

- The `exposure.include` key under `management.endpoints.web` lists which endpoints are visible over HTTP. Only these three are open.
- `show-details=always` puts the component details in the health reply. The default hides them from the outside world.
- `BedHealthIndicator` implements `HealthIndicator`. The bean name `beds` becomes the component name in the reply.
- In Spring Boot 4 these types live in the package `health.contributor`, under `org.springframework.boot`. Older tutorials use a different package, so check your imports.
- `Health.up()` and `Health.down()` build the status, and `withDetail` adds extra facts.
- Keys that start with `info.` fill the info endpoint, because we switched on the `env` contributor under `management.info`.
- We turned off the disk space and SSL checks only to keep the output short. They are on by default.
- Asking for `/actuator/env`, which we did not expose, returned 404.

## Metrics

The metrics endpoint lists names such as `jvm.memory.used`. Call the metrics endpoint with that name and it returns the value in bytes, with tags such as heap and non-heap. Later you can connect a tool such as Prometheus to collect them regularly.

## Liveness and Readiness

Look again at the health reply. It has two groups, `liveness` and `readiness`. They are made for container platforms such as Kubernetes. Liveness answers "is the process stuck and in need of a restart?". Readiness answers "is it ready to receive customers right now?". A ward that is full is alive, but it is not ready for new patients. You can call the `liveness` and `readiness` paths under `/actuator/health` to get each answer alone (we called the first and got `{"status":"UP"}`), which lets a platform restart a broken app without removing a merely busy one.

## Who Should See the Endpoints

Think about who needs each answer. A load balancer needs only UP or DOWN. A developer on call may need the details. The public needs nothing. A good habit is to keep actuator on a private network or a separate management port, and to show details only to logged in staff.

## Common Mistakes

> **Warning:** Do not expose every endpoint on a public server. Endpoints like `env`, `beans` and `heapdump` can reveal settings and memory contents. Expose only what you need, and protect them with Spring Security.

- **Using `include=*` in production.** It opens everything. List the endpoints by name.
- **Showing details to everyone.** Keep `show-details` at `when-authorized` on public servers.
- **A slow health check.** A health indicator that calls a slow database can make the whole endpoint time out.
- **Confusing UP with useful.** A running app can still be unable to do its job. Add your own indicator for what matters.

## Interview Questions

**What is Spring Boot Actuator?**
A starter that adds production-ready endpoints for health, metrics, info and more.

**Which endpoint is exposed over HTTP by default?**
Only `health`. The others have to be exposed with a setting.

**How do you add a custom health check?**
Create a bean that implements `HealthIndicator` and return `Health.up()` or `Health.down()`.

## Key Points to Remember

- Add `spring-boot-starter-actuator` to get the endpoints.
- Use the `exposure.include` list to choose what is exposed.
- One DOWN indicator makes the whole health DOWN, with status code 503.
- `HealthIndicator` beans add your own checks.
- Never expose sensitive endpoints without protection.

## Frequently Asked Questions

### What is the Spring Boot Actuator used for?

It is used to check the health of a running app, read its metrics and see its settings, mostly by monitoring tools.

### Is Actuator safe to use in production?

Yes, if you expose only the endpoints you need and put the sensitive ones behind login.

### How do I see all actuator endpoints?

Call `/actuator`. It lists every exposed endpoint with its link.

### Can I change the actuator base path or port?

Yes. Use the `base-path` key under `management.endpoints.web` to change the path, and `management.server.port` to serve actuator on another port.

## Related Topics

- [Logging in Spring Boot](/learning/spring-boot-tutorial/logging-in-spring-boot): the loggers endpoint changes levels of a running app.
- [Spring Security Basics](/learning/spring-boot-tutorial/spring-security-basics): protect the sensitive endpoints.
- [Docker for Spring Boot](/learning/spring-boot-tutorial/docker-for-spring-boot): containers call the health endpoint.
- [Spring Boot Starters](/learning/spring-boot-tutorial/spring-boot-starters): how the actuator starter is added.
