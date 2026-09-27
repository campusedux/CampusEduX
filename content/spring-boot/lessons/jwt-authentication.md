Picture a cinema that lets you in without asking who you are at every door. At the ticket counter you show your booking once, and the staff hand you a wristband with the show time and seat block printed on it. After that, the usher at the hall, the snack counter and the balcony guard only look at your wristband. Nobody phones the counter to check. JWT authentication works the same way. You log in once, receive a signed token, and the server trusts that token on every later request.

In this guide you will build a small library API that issues a JWT after login and protects its endpoints with it. You will also see what a token holds, how the signature stops forgery, and the mistakes that make JWT setups unsafe.

## What is JWT Authentication?

> **Definition:** A JWT (JSON Web Token) is a small, signed piece of text that carries claims about a user, such as their name, roles and expiry time. JWT authentication means the client sends this token with each request, and the server accepts the request only if the signature and expiry are valid.

A JWT looks like three chunks of text joined by dots.

```text
xxxxx.yyyyy.zzzzz
header.payload.signature
```

The header says which signing method was used. The payload holds the claims: `sub` (who the token is about), `exp` (when it expires), and any extra claims you add, like `roles`. The signature is made with a key that only the server knows. If anyone changes even one letter of the payload, the signature no longer matches and the server rejects the token.

The payload is encoded, not encrypted. Anyone can read it. So never put a password or card number inside a token.

## Why is it used?

- **No session memory.** The server does not store a login session for each user. The token itself proves who you are, so any server instance can check it. This suits apps running on many servers.
- **Works for mobile and single page apps.** The client keeps the token and sends it in an `Authorization` header. No cookies needed.
- **Roles travel with the token.** The server can read the user's roles straight from the claims, without asking the database on every call.
- **Easy to expire.** Each token carries its own end time, so a stolen token stops working soon.

The trade-off is that a token cannot be taken back before it expires, unless you add extra checks. That is why access tokens are kept short and paired with refresh tokens, covered in a later topic.

## How it works

The whole journey has two phases: getting the token, and using it.

```text
Client          Library API
  |                  |
  | POST /auth/login |
  |----------------->|
  |                  | check user
  |                  | sign a JWT
  | 200 { jwt }      |
  |<-----------------|
  |                  |
  | GET /api/loans   |
  | Bearer <jwt>     |
  |----------------->|
  |                  | verify sign
  |                  | check time
  | 200 loans list   |
  |<-----------------|
```

First the client sends a name and password to the login endpoint. The server checks them, builds a token with the user's name and roles, signs it and returns it. Later the client adds `Authorization: Bearer <token>` to each call. A filter in Spring Security reads the header, checks the signature and expiry, and only then lets the request reach your controller. If the token is missing, changed or expired, the answer is `401 Unauthorized`.

## Real-Life Example

A library gives each member a card at the desk after checking their ID. The card has the member's name, a validity date and a stamp. At the shelf, the reading room and the lending counter, staff check the stamp and the date. They never open the member register again. The stamp is the signature. A photocopied card with a changed date fails the stamp check.

## Code Example

Let's build PageTurn Library. Members log in, then read their own loans. We use Spring Security's own resource server support, which includes the Nimbus JOSE library, so we add no extra JWT library.

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

    <groupId>com.pageturn</groupId>
    <artifactId>library</artifactId>
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
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
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
spring.application.name=pageturn-library
pageturn.jwt-minutes=15
```

**File:** `LibraryApplication.java` in package `com.pageturn.library`

```java
package com.pageturn.library;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class LibraryApplication {

    public static void main(String[] args) {
        SpringApplication.run(LibraryApplication.class, args);
    }
}
```

**File:** `SecurityConfig.java` in package `com.pageturn.library`

```java
package com.pageturn.library;

import java.security.SecureRandom;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/login").permitAll()
                .anyRequest().authenticated())
            .oauth2ResourceServer(oauth -> oauth.jwt(Customizer.withDefaults()));
        return http.build();
    }

    // A fresh random key on every start. Fine for learning; real apps load one fixed key from a vault.
    @Bean
    SecretKey jwtKey() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return new SecretKeySpec(bytes, "HmacSHA256");
    }

    @Bean
    JwtEncoder jwtEncoder(SecretKey jwtKey) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(jwtKey));
    }

    @Bean
    JwtDecoder jwtDecoder(SecretKey jwtKey) {
        return NimbusJwtDecoder.withSecretKey(jwtKey).macAlgorithm(MacAlgorithm.HS256).build();
    }

    @Bean
    UserDetailsService userDetailsService() {
        return new InMemoryUserDetailsManager(
            User.withUsername("meera").password("{noop}read123").roles("MEMBER").build(),
            User.withUsername("raj").password("{noop}shelf456").roles("LIBRARIAN").build());
    }

    @Bean
    AuthenticationManager authenticationManager(UserDetailsService users) {
        return new ProviderManager(new DaoAuthenticationProvider(users));
    }
}
```

**File:** `AuthController.java` in package `com.pageturn.library`

```java
package com.pageturn.library;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    record LoginRequest(String username, String password) {}

    record JwtResponse(String jwt, long expiresInSeconds) {}

    private final AuthenticationManager authenticationManager;
    private final JwtEncoder jwtEncoder;
    private final long minutes;

    public AuthController(AuthenticationManager authenticationManager, JwtEncoder jwtEncoder,
                          @Value("${pageturn.jwt-minutes}") long minutes) {
        this.authenticationManager = authenticationManager;
        this.jwtEncoder = jwtEncoder;
        this.minutes = minutes;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Authentication auth;
        try {
            auth = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(request.username(), request.password()));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(401).body("Wrong username or password");
        }

        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer("pageturn-library")
            .subject(auth.getName())
            .issuedAt(now)
            .expiresAt(now.plus(minutes, ChronoUnit.MINUTES))
            .claim("roles", auth.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList())
            .build();

        String jwtText = jwtEncoder.encode(
            JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
        return ResponseEntity.ok(new JwtResponse(jwtText, minutes * 60));
    }
}
```

**File:** `LoanController.java` in package `com.pageturn.library`

```java
package com.pageturn.library;

import java.util.List;
import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class LoanController {

    @GetMapping("/loans")
    public Map<String, Object> myLoans(@AuthenticationPrincipal Jwt jwt) {
        return Map.of(
            "member", jwt.getSubject(),
            "roles", jwt.getClaimAsStringList("roles"),
            "loans", List.of("Hill Station Letters", "Tea Estate Diaries"));
    }
}
```

Start the app, then call it three ways: without a token, to log in, and with the token.

```bash
./mvnw spring-boot:run
curl -i http://localhost:8080/api/loans
curl -X POST http://localhost:8080/auth/login -H "Content-Type: application/json" \
  -d '{"username":"meera","password":"read123"}'
curl http://localhost:8080/api/loans -H "Authorization: Bearer <jwt>"
```

**Output:**

```text
1) Call with nothing attached:
HTTP/1.1 401

2) Login gives back a long text
   and expiresInSeconds: 900

3) Call with the long text:
{
  "roles": [
    "ROLE_MEMBER",
    "FACTOR_PASSWORD"
  ],
  "loans": [
    "Hill Station Letters",
    "Tea Estate Diaries"
  ],
  "member": "meera"
}
```

The login reply is a small JSON object with two fields: `jwt`, one long line of text, and `expiresInSeconds`, which was 900. If you change one letter of the jwt and send it again, the answer is `401`.

The extra `FACTOR_PASSWORD` entry appears because Spring Security 7, used by Spring Boot 4, records how the user proved who they are. Your own `ROLE_MEMBER` sits right beside it.

## Code Explained

- `SecretKey` is a random 32-byte key made when the app starts, and HS256 needs at least that many bytes. Restarting the app makes old tokens invalid. A real app loads one fixed key from a vault or the hosting platform's protected settings, so every server instance shares it. Never commit the key to Git.
- `JwtEncoder` signs tokens. `JwtDecoder` checks them. Both use the same key, which is called symmetric signing. Big systems often use a key pair instead, so other services can verify without being able to sign.
- The `oauth2ResourceServer` setting adds the filter that reads the `Authorization: Bearer` header on every request.
- `STATELESS` tells Spring Security not to create an HTTP session. The token is the only proof of login.
- `csrf.disable()` is fine here because we use no cookies. A header token is not sent automatically by the browser.
- The login endpoint is the only address left open with `permitAll()`. Everything else needs a valid token.
- `@AuthenticationPrincipal Jwt jwt` hands the verified token to the controller, so it can read the subject and claims.
- The `{noop}` prefix means "plain text password", used only to keep the demo short. Real apps store BCrypt hashes.

## Common Mistakes

> **Warning:** A JWT payload is only encoded, not hidden. Never store passwords, card numbers or other private data inside it.

- **A weak or committed key.** A short key can be guessed, and a key pushed to Git is public. Keep it in a vault.
- **Long-lived access tokens.** A token valid for 30 days is a 30 day risk if stolen. Use minutes, and use refresh tokens.
- **Accepting any algorithm.** Always fix the expected algorithm, as we did with `MacAlgorithm.HS256`.
- **Storing the token where scripts can read it.** Browser local storage is open to script attacks. Think before choosing where the client keeps it.
- **Ignoring expiry on the client.** When the API answers `401`, the app must ask for a new token, not crash.

## Interview Questions

**What are the three sections of a JWT?**
The header, the payload with claims, and the signature, joined by dots.

**Is a JWT encrypted?**
No. It is signed, so it cannot be changed unseen, but anyone can read the payload.

**Why is JWT called stateless?**
The server keeps no session. Everything it needs is inside the signed token.

**How does the server know a token was not changed?**
It recomputes the signature with its key and compares it with the one in the token.

**How can you log out a JWT user?**
The token lives until it expires, so keep it short, delete it on the client, and use a refresh token store that the server can revoke.

## Key Points to Remember

- A JWT is a signed token with a header, a payload of claims and a signature.
- The client logs in once, then sends `Authorization: Bearer <token>` on each call.
- Spring Boot 4 has a resource server starter that checks incoming JWTs for you.
- The payload is readable by anyone, so keep private data out of it.
- Keep access tokens short, keep the signing key private and sessions stateless.

## Frequently Asked Questions

### Where should the client keep the JWT?

Mobile apps use secure storage. Web apps often keep it in memory or in an HTTP-only cookie. Local storage is the easiest choice and also the easiest to attack.

### Should I write my own JWT authentication code?

Use the library that comes with Spring Security. Signing and checking tokens is easy to get wrong when written by hand.

### What is the difference between HS256 and RS256?

HS256 uses one shared key for signing and checking. RS256 signs with a private key and checks with a public key, so other services can verify tokens without being able to create them.

### What does a 401 mean here?

The token is missing, expired or invalid. A `403` means the token is fine but the user has no permission.

## Related Topics

- [Spring Security Basics](/learning/spring-boot-tutorial/spring-security-basics): the filter chain and users that JWT plugs into.
- [Password Encoding with BCrypt](/learning/spring-boot-tutorial/password-encoding-with-bcrypt): how to store the passwords checked at login.
- [Role Based Authorization](/learning/spring-boot-tutorial/role-based-authorization): using the roles inside the token to guard endpoints.
- [Refresh Token](/learning/spring-boot-tutorial/refresh-token): getting a new short-lived token without logging in again.
