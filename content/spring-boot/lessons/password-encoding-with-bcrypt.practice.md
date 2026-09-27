Try each problem on your own first. These apps use only the Spring Security starter, so no web server starts.

### Easy: Cinema Kiosk PIN

The CineGo ticket kiosk lets a customer set a four-digit PIN. Never store the PIN itself. Write a small service that saves the BCrypt hash of a PIN and checks a later attempt. Try the right PIN and a wrong one.

> **Hint:** Create a `BCryptPasswordEncoder` bean. Save `encoder.encode(pin)`, and check with `encoder.matches(attempt, saved)`.

**Answer:** The service keeps only the hash. `matches` hashes the attempt with the salt found inside the saved hash and compares the two.

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

    <groupId>com.cinego</groupId>
    <artifactId>kiosk</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
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

**File:** `KioskApplication.java` in package `com.cinego.kiosk`

```java
package com.cinego.kiosk;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class KioskApplication {

    public static void main(String[] args) {
        SpringApplication.run(KioskApplication.class, args);
    }

    @Bean
    PasswordEncoder encoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    CommandLineRunner demo(PinService pins) {
        return args -> {
            pins.savePin("4827");
            System.out.println("Stored PIN is plain: " + pins.storedValue().equals("4827"));
            System.out.println("PIN 4827: " + pins.check("4827"));
            System.out.println("PIN 1111: " + pins.check("1111"));
        };
    }
}
```

**File:** `PinService.java` in package `com.cinego.kiosk`

```java
package com.cinego.kiosk;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class PinService {

    private final PasswordEncoder encoder;
    private String saved;

    public PinService(PasswordEncoder encoder) {
        this.encoder = encoder;
    }

    public void savePin(String pin) {
        this.saved = encoder.encode(pin);
    }

    public String storedValue() {
        return saved;
    }

    public boolean check(String attempt) {
        return encoder.matches(attempt, saved);
    }
}
```

Running the app prints:

```text
Stored PIN is plain: false
PIN 4827: true
PIN 1111: false
```

### Medium: Upgrade Old Hashes at Login

Sunrise Bakery created its first accounts with a cheap BCrypt cost of 4. The team now wants cost 12. Write a login method that checks the password with the new encoder. When the login succeeds and the saved hash is weaker than the new setting, it must save a fresh hash. Print whether an upgrade was needed before and after the login.

> **Hint:** `PasswordEncoder` has a method `upgradeEncoding(hash)` that answers true when a hash is weaker than the encoder's own setting. Create the old hash with `new BCryptPasswordEncoder(4)`.

**Answer:** After a successful `matches`, call `upgradeEncoding` on the saved hash. If it says true, encode the typed password again with the strong encoder and replace the saved hash. Old users move to the new cost the next time they log in, without any password reset.

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

    <groupId>com.sunrise</groupId>
    <artifactId>accounts</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
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

**File:** `AccountsApplication.java` in package `com.sunrise.accounts`

```java
package com.sunrise.accounts;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class AccountsApplication {

    public static void main(String[] args) {
        SpringApplication.run(AccountsApplication.class, args);
    }

    @Bean
    PasswordEncoder encoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    CommandLineRunner demo(LoginService login) {
        return args -> {
            String old = new BCryptPasswordEncoder(4).encode("Cake@2026");
            login.save("baker", old);
            System.out.println("Needs upgrade: " + login.needsUpgrade("baker"));
            System.out.println("Login ok: " + login.login("baker", "Cake@2026"));
            System.out.println("Needs upgrade: " + login.needsUpgrade("baker"));
            System.out.println("Login again: " + login.login("baker", "Cake@2026"));
            System.out.println("Bad login: " + login.login("baker", "cake"));
        };
    }
}
```

**File:** `LoginService.java` in package `com.sunrise.accounts`

```java
package com.sunrise.accounts;

import java.util.HashMap;
import java.util.Map;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class LoginService {

    private final PasswordEncoder encoder;
    private final Map<String, String> hashes = new HashMap<>();

    public LoginService(PasswordEncoder encoder) {
        this.encoder = encoder;
    }

    public void save(String user, String hash) {
        hashes.put(user, hash);
    }

    public boolean needsUpgrade(String user) {
        return encoder.upgradeEncoding(hashes.get(user));
    }

    public boolean login(String user, String typed) {
        String saved = hashes.get(user);
        if (saved == null || !encoder.matches(typed, saved)) {
            return false;
        }
        if (encoder.upgradeEncoding(saved)) {
            hashes.put(user, encoder.encode(typed));
        }
        return true;
    }
}
```

Running the app prints:

```text
Needs upgrade: true
Login ok: true
Needs upgrade: false
Login again: true
Bad login: false
```
