Try each problem on your own first. Both run from the command line, so they need only the resource server starter and no web server.

### Easy: Pharmacy Counter Pass

Green Cross Pharmacy gives each customer a digital counter pass. Write a small program that creates a signed JWT for the customer `anita` with a `counter` claim set to `3`, valid for 10 minutes. Then decode it with the same key and print the subject, the counter and how many minutes the pass is valid.

> **Hint:** Build a `JwtEncoder` with `NimbusJwtEncoder` and a `JwtDecoder` with `NimbusJwtDecoder`, both from the same 32-byte key. Use a `CommandLineRunner` bean and turn the web server off in `application.properties`.

**Answer:** The same key signs and checks the pass. After decoding, `getSubject()` and `getClaim("counter")` give the values back, and the gap between `exp` and `iat` is the valid time.

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

    <groupId>com.greencross</groupId>
    <artifactId>pass</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security-oauth2-resource-server</artifactId>
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
spring.main.web-application-type=none
spring.main.banner-mode=off
logging.level.root=warn
```

**File:** `PassApplication.java` in package `com.greencross.pass`

```java
package com.greencross.pass;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

@SpringBootApplication
public class PassApplication {

    public static void main(String[] args) {
        SpringApplication.run(PassApplication.class, args);
    }

    @Bean
    CommandLineRunner demo() {
        return args -> {
            byte[] bytes = new byte[32];
            new SecureRandom().nextBytes(bytes);
            SecretKey key = new SecretKeySpec(bytes, "HmacSHA256");

            JwtEncoder encoder = new NimbusJwtEncoder(new ImmutableSecret<>(key));
            JwtDecoder decoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();

            Instant now = Instant.now();
            JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject("anita")
                .claim("counter", 3)
                .issuedAt(now)
                .expiresAt(now.plus(Duration.ofMinutes(10)))
                .build();
            String pass = encoder.encode(
                JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();

            Jwt decoded = decoder.decode(pass);
            long minutes = Duration.between(decoded.getIssuedAt(), decoded.getExpiresAt()).toMinutes();
            System.out.println("Customer: " + decoded.getSubject());
            System.out.println("Counter: " + decoded.getClaim("counter"));
            System.out.println("Valid for: " + minutes + " minutes");
        };
    }
}
```

**Output:**

```text
Customer: anita
Counter: 3
Valid for: 10 minutes
```

### Medium: Tampered and Expired Passes

City Care Hospital gives visitors a pass. The gate must reject two kinds of bad passes: one whose middle section was edited to say `ward-admin` instead of `visitor`, and one that expired an hour ago. Write a program that issues a good pass, a tampered copy and an expired pass, then tries to decode all three and prints `ACCEPTED` or `REJECTED` with the reason.

> **Hint:** A JWT has three sections split by dots. To tamper, change the middle one with `Base64.getUrlEncoder()`, keep the other two, and join them again. For the expired one, set `expiresAt` in the past. `decode` throws `JwtException` for bad passes.

**Answer:** The tampered pass fails because the signature no longer matches its middle section. The expired pass fails the time check. Only the untouched, unexpired pass is accepted.

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
    <artifactId>gate</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security-oauth2-resource-server</artifactId>
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
spring.main.web-application-type=none
spring.main.banner-mode=off
logging.level.root=warn
```

**File:** `GateApplication.java` in package `com.citycare.gate`

```java
package com.citycare.gate;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

@SpringBootApplication
public class GateApplication {

    public static void main(String[] args) {
        SpringApplication.run(GateApplication.class, args);
    }

    @Bean
    CommandLineRunner gate() {
        return args -> {
            byte[] bytes = new byte[32];
            new SecureRandom().nextBytes(bytes);
            SecretKey key = new SecretKeySpec(bytes, "HmacSHA256");
            JwtEncoder encoder = new NimbusJwtEncoder(new ImmutableSecret<>(key));
            JwtDecoder decoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();

            Instant now = Instant.now();
            String good = issue(encoder, "visitor", now, now.plus(Duration.ofHours(1)));
            String expired = issue(encoder, "visitor", now.minus(Duration.ofHours(3)), now.minus(Duration.ofHours(1)));

            String[] chunks = good.split("\\.");
            String forgedMiddle = Base64.getUrlEncoder().withoutPadding().encodeToString(
                "{\"sub\":\"ward-admin\"}".getBytes(StandardCharsets.UTF_8));
            String tampered = chunks[0] + "." + forgedMiddle + "." + chunks[2];

            check(decoder, "Good pass", good);
            check(decoder, "Tampered pass", tampered);
            check(decoder, "Expired pass", expired);
        };
    }

    private static String issue(JwtEncoder encoder, String role, Instant issued, Instant expires) {
        JwtClaimsSet claims = JwtClaimsSet.builder()
            .subject(role).issuedAt(issued).expiresAt(expires).build();
        return encoder.encode(
            JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }

    private static void check(JwtDecoder decoder, String label, String pass) {
        try {
            decoder.decode(pass);
            System.out.println(label + ": ACCEPTED");
        } catch (JwtException e) {
            System.out.println(label + ": REJECTED");
        }
    }
}
```

**Output:**

```text
Good pass: ACCEPTED
Tampered pass: REJECTED
Expired pass: REJECTED
```

The program prints only these three lines because the log level is set to `warn`.
