A refresh token works like the booking record at a hotel front desk. When you check in, the desk gives you a key card that works for one day. If it stopped working every hour, you would keep walking back to the desk. If it worked for a whole year, a lost card would be a big problem. So hotels keep the card short-lived and keep your booking on record. When the card expires, you show up at the desk, they confirm the booking, and hand you a fresh card.

In this guide you will build a metro card API with a short-lived access JWT and a long-lived refresh token. You will see how rotation works, how a stolen refresh token gets caught, and how logout really ends a session.

## What is a Refresh Token?

> **Definition:** A refresh token is a long-lived, random value that a client swaps for a new short-lived access token when the old one expires. The server stores it, so it can check it, rotate it, or cancel it at any time.

Two different tokens share the work:

- The **access token** is a short JWT, valid for minutes. The client sends it on every API call.
- The **refresh token** lives for days. The client sends it only to one endpoint, `/auth/refresh`, to get a new access token.

Unlike the access JWT, the refresh token is usually not a JWT at all. It is just a long random string, and the server remembers it. That memory is what makes cancelling possible.

## Why is it used?

A short access token limits the damage of theft: if someone copies it, it stops working in minutes. But asking the user to log in every 15 minutes would be unbearable. The refresh token solves both problems.

- **Safer access tokens.** They can be very short because renewing is automatic.
- **Better user experience.** The user logs in once and stays signed in for days.
- **Real logout.** The server deletes the refresh token, so no new access tokens can be made.
- **Theft detection.** With rotation, the server notices when an old refresh token is used a second time.

## How it works

Here is the full life of a session.

```text
Client            Metro API
  |                    |
  | login              |
  |------------------->|
  | access + refresh   |
  |<-------------------|
  |                    |
  | GET /api/rides     |
  | (access)           |
  |------------------->|
  |   ...15 minutes... |
  | 401 expired        |
  |<-------------------|
  |                    |
  | POST /auth/refresh |
  | (refresh)          |
  |------------------->|
  |                    | find it
  |                    | mark used
  | new access+refresh |
  |<-------------------|
```

The client logs in and receives both tokens. It uses the access token until the API answers `401` because it expired. Then it sends the refresh token to `/auth/refresh`. The server finds the refresh token in its store, marks it as used, and returns a brand new pair. The old refresh token can never be used again. This is called rotation.

Now think about a thief. If a stolen refresh token is used after the real client already rotated it, the server sees a used token come back. That is a clear sign of theft, so the server cancels every refresh token for that user. Both the thief and the real user must log in again, but the account is safe.

| | Access token | Refresh token |
|---|---|---|
| Lifetime | Minutes | Days |
| Format | Signed JWT | Random string |
| Sent to | Every API call | `/auth/refresh` only |
| Stored on server | No | Yes |
| Can be cancelled | Only by waiting | Any time |

## Real-Life Example

A metro card works like this. The turnstile only reads the balance on the card and lets you through, without calling anyone. That is the access token. When the card runs low, you go to a kiosk, show your registered card number and top up. The kiosk keeps your record and can block a lost card. That kiosk record is the refresh token. If someone tries to use the number of an old card that was already replaced, the kiosk knows something is wrong and blocks all cards on that account.

## Code Example

Let's build MetroGo. It reuses the JWT setup from the previous topic and adds a token service that stores refresh tokens in memory. A real app would store them, hashed, in a database.

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

    <groupId>com.metrogo</groupId>
    <artifactId>cards</artifactId>
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
spring.application.name=metrogo-cards
metrogo.access-minutes=15
metrogo.refresh-days=7
```

**File:** `CardsApplication.java` in package `com.metrogo.cards`

```java
package com.metrogo.cards;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CardsApplication {

    public static void main(String[] args) {
        SpringApplication.run(CardsApplication.class, args);
    }
}
```

**File:** `SecurityConfig.java` in package `com.metrogo.cards`

```java
package com.metrogo.cards;

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
                .requestMatchers("/auth/**").permitAll()
                .anyRequest().authenticated())
            .oauth2ResourceServer(oauth -> oauth.jwt(Customizer.withDefaults()));
        return http.build();
    }

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
            User.withUsername("isha").password("{noop}turnstile1").roles("RIDER").build());
    }

    @Bean
    AuthenticationManager authenticationManager(UserDetailsService users) {
        return new ProviderManager(new DaoAuthenticationProvider(users));
    }
}
```

**File:** `TokenService.java` in package `com.metrogo.cards`

```java
package com.metrogo.cards;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

@Service
public class TokenService {

    record TokenPair(String accessToken, String refreshToken, long accessExpiresInSeconds) {}

    private record RefreshEntry(String username, List<String> roles, Instant expiresAt, boolean used) {}

    private final Map<String, RefreshEntry> store = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();
    private final JwtEncoder jwtEncoder;
    private final Duration accessLife;
    private final Duration refreshLife;

    public TokenService(JwtEncoder jwtEncoder,
                        @Value("${metrogo.access-minutes}") long accessMinutes,
                        @Value("${metrogo.refresh-days}") long refreshDays) {
        this.jwtEncoder = jwtEncoder;
        this.accessLife = Duration.ofMinutes(accessMinutes);
        this.refreshLife = Duration.ofDays(refreshDays);
    }

    public TokenPair issue(String username, List<String> roles) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer("metrogo-cards")
            .subject(username)
            .issuedAt(now)
            .expiresAt(now.plus(accessLife))
            .claim("roles", roles)
            .build();
        String access = jwtEncoder.encode(
            JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();

        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String refresh = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        store.put(refresh, new RefreshEntry(username, roles, now.plus(refreshLife), false));
        return new TokenPair(access, refresh, accessLife.toSeconds());
    }

    public Optional<TokenPair> rotate(String refresh) {
        RefreshEntry entry = store.get(refresh);
        if (entry == null || entry.expiresAt().isBefore(Instant.now())) {
            return Optional.empty();
        }
        if (entry.used()) {
            // An old refresh value came back: treat it as theft and end every session of this user.
            store.values().removeIf(e -> e.username().equals(entry.username()));
            return Optional.empty();
        }
        store.put(refresh, new RefreshEntry(entry.username(), entry.roles(), entry.expiresAt(), true));
        return Optional.of(issue(entry.username(), entry.roles()));
    }

    public void revoke(String refresh) {
        store.remove(refresh);
    }
}
```

**File:** `AuthController.java` in package `com.metrogo.cards`

```java
package com.metrogo.cards;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    record LoginRequest(String username, String password) {}

    record RefreshRequest(String refreshToken) {}

    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;

    public AuthController(AuthenticationManager authenticationManager, TokenService tokenService) {
        this.authenticationManager = authenticationManager;
        this.tokenService = tokenService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            Authentication auth = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(request.username(), request.password()));
            return ResponseEntity.ok(tokenService.issue(auth.getName(),
                auth.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList()));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(401).body("Wrong username or password");
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody RefreshRequest request) {
        return tokenService.rotate(request.refreshToken())
            .<ResponseEntity<?>>map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.status(401).body("Refresh not accepted, please log in again"));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody RefreshRequest request) {
        tokenService.revoke(request.refreshToken());
        return ResponseEntity.noContent().build();
    }
}
```

**File:** `RideController.java` in package `com.metrogo.cards`

```java
package com.metrogo.cards;

import java.util.List;
import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class RideController {

    @GetMapping("/rides")
    public Map<String, Object> rides(@AuthenticationPrincipal Jwt jwt) {
        return Map.of("rider", jwt.getSubject(), "rides", List.of("Andheri to Ghatkopar", "Ghatkopar to Andheri"));
    }
}
```

Here is one full session, written as a list of calls. Each refresh call sends the refresh value that came back last.

```text
1. Log in
2. GET /api/rides with the access
3. Refresh with refresh A
4. Refresh with refresh A again
5. Refresh with refresh B
6. Log in again, log out, refresh
```

**Output:**

```text
1. access + refresh A, and
   accessExpiresInSeconds 900
2. rides list -> 200
3. new pair, refresh B -> 200
4. A used again -> 401
5. B tried next -> 401
6. logout -> 204
   refresh after logout -> 401
```

Call 4 is the theft rule at work. Because A was already used, the server ended every session of the rider, so even the fresh refresh B was rejected in call 5. Wrong login details also get `401`.

## Code Explained

- `SecurityConfig` is the same idea as in the JWT topic. The only change is that every address under `/auth` is open, because these calls happen before the client has an access token.
- `TokenService.issue` makes both tokens. The access token is a signed JWT with a `roles` claim. The refresh token is 32 random bytes from `SecureRandom`, written as URL-safe text. It has no meaning by itself, so a thief learns nothing from reading it.
- The `store` map is the server's memory. In a real app this is a database table holding a hash of the refresh token, the user, the expiry and a used flag.
- `rotate` finds the refresh value and checks its expiry. If it was already used, it removes all refresh entries for that user. If it is fresh, it marks the value as used and issues a new pair.
- `logout` removes the refresh value. The access token still works until it expires, which is why it must be short.
- The login and refresh endpoints return the same `TokenPair` record, so the client handles both alike.

## Common Mistakes

> **Warning:** Never keep refresh tokens in plain text in a real database. Store a hash, like you store password hashes, so a database leak does not hand out working sessions.

- **Making the refresh token as short as the access token.** Then it protects nothing and users log in constantly.
- **Skipping rotation.** A stolen refresh token would work until it expires, and nobody would notice.
- **Keeping it where scripts can read it.** In browsers, an HTTP-only cookie is safer than local storage.
- **Not cancelling on logout.** If logout only deletes tokens on the client, the refresh token still works for anyone who copied it.
- **Sending the refresh token on every call.** It should travel only to the refresh endpoint.

## Interview Questions

**Why use a refresh token at all?**
It lets the access token stay short-lived for safety, while the user stays signed in for days.

**Is a refresh token a JWT?**
It can be, but most systems use a random string and remember it on the server, so it can be cancelled.

**What is refresh token rotation?**
Each refresh call returns a new refresh token and marks the old one as used, so every value works once.

**What happens if a used refresh token is presented again?**
The server treats it as theft, cancels the user's refresh tokens, and forces a new login.

**How do you log a user out?**
Delete the refresh token on the server. The current access token then expires on its own within minutes.

## Key Points to Remember

- The access token is short and used on every call; the refresh token is long and used only to get a new access token.
- The server stores refresh tokens, so it can rotate and cancel them.
- Rotation means each refresh token works once.
- A used refresh token that returns is a theft signal.
- Store refresh tokens hashed in a real database.

## Frequently Asked Questions

### How long should a refresh token last?

Days to a few weeks is common. Choose the shortest time users will accept, and also let them cancel sessions early.

### Where should the client store a refresh token?

Mobile apps use secure storage. Web apps prefer an HTTP-only cookie the scripts cannot read. Avoid local storage for a refresh token.

### Can I skip the refresh token and use one long JWT?

You can, but a stolen long JWT works until it expires and you cannot cancel it. A refresh token lets you keep the access token short.

### Does a refresh token need to be encrypted?

It needs to be random and unguessable, and stored hashed on the server. Encryption of the value itself is not required.

## Related Topics

- [JWT Authentication](/learning/spring-boot-tutorial/jwt-authentication): the signed access JWT that a refresh token renews.
- [Role Based Authorization](/learning/spring-boot-tutorial/role-based-authorization): using the roles inside the access JWT.
- [Password Encoding with BCrypt](/learning/spring-boot-tutorial/password-encoding-with-bcrypt): hashing secrets before you store them.
- [Spring Security Basics](/learning/spring-boot-tutorial/spring-security-basics): the security filter chain behind all of this.
