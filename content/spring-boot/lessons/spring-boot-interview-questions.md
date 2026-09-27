The interviewer smiles and says, "Tell me about yourself. Now, what does @SpringBootApplication do?" Your mind goes blank, even though you have built three projects with it. Almost everyone has felt this. The knowledge is there, but the words are not ready. Interview questions test whether you can explain what you do every day, in short and clear sentences.

This guide collects the Spring Boot interview questions that come up again and again, with short answers you can say aloud. Read each answer, then close the page and say it in your own words.

## What are Spring Boot Interview Questions?

> **Definition:** Spring Boot interview questions are the common technical questions that companies ask Java backend candidates to check their understanding of Spring Boot: how it starts, how it wires objects, how it serves requests, how it saves data and how it runs in production.

They usually fall into a few groups: basics, configuration, web and REST, data, security and testing, and production topics. A fresher gets more basics. An experienced developer gets more "why" and "what if" questions.

## Why do interviewers ask them?

Spring Boot is the default choice for Java backends in many companies. A team needs to know that a new person can read the existing code, fix a bug and add a feature without a long training. The questions check three things:

- **Do you know the words?** Bean, starter, profile, auto-configuration.
- **Do you know the reason?** Not only what an annotation does, but why it exists.
- **Have you really built something?** Follow-up questions such as "what happened when it failed?" show it quickly.

## How it works

An interview usually follows a pattern. Knowing it helps you stay calm.

```text
Introduction and project
  |
  v
Core Java + Spring basics
  |
  v
Deeper: REST, JPA, security
  |
  v
Scenario / debugging question
  |
  v
Your questions for them
```

The interviewer starts with your project, then checks the basics, then goes deeper into the areas your project used. A scenario question, such as "the API is slow, what do you check?", tests how you think. At the end you can ask about the team and the work.

A simple method for every answer has three steps: give the one-line meaning, give the reason it exists, and give a small example from your own project. That takes twenty seconds and sounds confident.

## Real-Life Example

A driving test does not only ask you to name the parts of a car. The examiner sits beside you and asks you to reverse, park and explain why you checked the mirror. A Spring Boot interview is the same. The best answer to "what is dependency injection?" is a short definition followed by "in my library project the `BookService` gets its `BookRepository` through the constructor, so I can replace it in tests". The example proves you have driven the car.

## Interview Questions

### Basics

**What is Spring Boot and how is it different from Spring?**
Spring Boot is built on Spring. It adds starters, auto-configuration and an embedded server, so you skip most setup. Spring is the base framework; Boot is the fast way to use it.

**What does `@SpringBootApplication` do?**
It combines three annotations: `@SpringBootConfiguration`, `@EnableAutoConfiguration` and `@ComponentScan`. Together they mark the main class, switch on auto-configuration and scan the package for beans.

**What are starters?**
Small dependencies that bring a tested group of libraries for one job. `spring-boot-starter-webmvc` brings Spring MVC, JSON and Tomcat.

**What is auto-configuration?**
Spring Boot looks at the libraries on the classpath and your settings, and creates the beans you would otherwise write by hand. You can override any of them.

**Which server does Spring Boot use by default, and on which port?**
Embedded Tomcat, on port 8080. Change it with `server.port`.

### Configuration and Beans

**What is dependency injection?**
Objects receive what they need from Spring instead of creating it with `new`. It gives loose coupling and easy testing.

**Which injection style is best?**
Constructor injection. It makes dependencies clear, allows `final` fields and works in tests without Spring.

**What is the default bean scope?**
Singleton: one shared instance per container. Others are prototype, request and session.

**What are profiles?**
Named sets of settings for environments, such as `dev` and `prod`. You switch them with `spring.profiles.active`.

**Which source wins when a property is set in many places?**
Command-line options, then environment variables, then profile files, then `application.properties`.

### Web and REST

**`@Controller` or `@RestController`?**
`@RestController` is `@Controller` plus `@ResponseBody`, so return values become JSON. Use `@Controller` for pages rendered by templates.

**`@PathVariable` or `@RequestParam`?**
`@PathVariable` reads a value from the path, like `/orders/42`. `@RequestParam` reads a query value, like `?page=2`.

**How do you handle errors globally?**
With `@ControllerAdvice` and `@ExceptionHandler` methods that return a clean error response and the right status code.

**Why use DTOs instead of entities in APIs?**
A DTO controls exactly what leaves and enters the API. Entities may hold private fields or links that should not be exposed.

**How do you validate input?**
Add the validation starter, put annotations such as `@NotBlank` on the fields, and mark the argument with `@Valid`.

### Data

**JPA versus Hibernate?**
JPA is the specification. Hibernate is the most common implementation. Spring Data JPA sits on top and writes repositories for you.

**What is the N+1 problem?**
One query loads N parents, and then N more queries load each parent's children. Fix it with a fetch join or an entity graph.

**Lazy versus eager loading?**
Lazy loads related data only when you touch it. Eager loads it at once. Prefer lazy and fetch what you need explicitly.

**How does `@Transactional` work?**
Spring wraps the bean in a proxy that begins a transaction before the method and commits or rolls back after it. A call from inside the same class skips the proxy.

### Security, Testing and Production

**How do you store user logins safely?**
Never store plain text. Hash with BCrypt through a `PasswordEncoder`, and keep only the hash.

**What is JWT authentication?**
The server signs a token after login, and the client sends it with each request. The server checks the signature instead of keeping a session.

**`@SpringBootTest` versus `@WebMvcTest`?**
`@SpringBootTest` loads the whole application context. `@WebMvcTest` loads only the web layer, so it is faster for controller tests.

**What is Actuator?**
A starter that adds production endpoints such as health and metrics.

**How do you deploy a Spring Boot app?**
Build one executable JAR, or a Docker image, and run it with the production profile on a server or platform.

## Common Mistakes

> **Warning:** Do not memorise answers word for word. Interviewers ask follow-ups, and a memorised answer falls apart at the first "why?". Learn the idea and use your own words.

- **Saying "I do not know" and stopping.** Say what you do know, then say how you would find out.
- **Only listing annotations.** Explain what problem each one solves.
- **Claiming skills you have not used.** One follow-up will show it.
- **Talking about old versions without saying so.** Boot 4 needs Java 17 or newer, uses `jakarta` packages and has the `spring-boot-starter-webmvc` starter.
- **Forgetting your project.** Be ready to explain every part of the project on your resume.

> **Tip:** Keep one small project you can explain end to end: API, database, tests and how you ran it. It answers half of all questions.

## Key Points to Remember

- Interview questions test whether you can explain daily Spring Boot work simply.
- Learn each answer as meaning, reason, example.
- Know the core: `@SpringBootApplication`, starters, auto-configuration, beans, profiles.
- Know the web layer, JPA basics, security basics, testing slices and Actuator.
- Tie every answer to something you built.
- Practise aloud, not only by reading.

## Frequently Asked Questions

### How should I prepare for Spring Boot interview questions as a fresher?

Build one complete CRUD project with validation, exceptions and tests. Then read each topic once, and explain it aloud in two sentences. This works better than reading fifty pages.

### How many Spring Boot interview questions should I practise?

Around forty well-understood ones are enough. Quality matters more than count. If you can explain why, the exact wording of the question hardly matters.

### Are Spring Boot interview questions different for experienced developers?

Yes. They focus on design and trouble: performance, transactions, security choices, deployment and how you would debug a problem in production.

### Do interviewers ask about Spring Boot 4 specifically?

Some do, especially about what changed from Boot 3. It is enough to know the basics: Java 17 or newer, `jakarta` packages and the new web starter name. Core ideas stay the same.

## Related Topics

- [Spring Boot Mini Project](/learning/spring-boot-tutorial/spring-boot-mini-project): build something you can talk about.
- [Auto Configuration](/learning/spring-boot-tutorial/auto-configuration): a favourite interview topic explained in depth.
- [Dependency Injection](/learning/spring-boot-tutorial/dependency-injection): the idea behind most Spring questions.
- [N+1 Problem](/learning/spring-boot-tutorial/n-plus-1-problem): a classic data question with a clear fix.
