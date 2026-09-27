Imagine a food court. In a small dhaba, one cook takes the order, cooks the meal, packs it and even counts the cash. It works while there are ten customers. On a festival day, with five hundred customers, the single cook becomes the bottleneck. A food court works differently. Each stall does one job, has its own cook and its own cash box, and a stall can hire more staff on a busy day without touching the others.

Microservices apply the food court idea to software. In this introduction to microservices with Spring Boot, you will learn what they are, why teams choose them, how the services talk to each other, and where Spring Boot fits in.

## What are Microservices?

> **Definition:** A microservice architecture builds one application as a set of small, independent services. Each service does one business job, runs as its own process, owns its own data, and talks to the others over the network.

Compare this with a monolith, where the whole application is one program deployed as one unit.

| Point | Monolith | Microservices |
|---|---|---|
| Codebase | One big project | Many small projects |
| Deployment | All or nothing | Each service alone |
| Database | Usually one shared | One per service |
| Scaling | Copy the whole app | Copy only the busy service |
| Failure | One bug can stop everything | A failure can be contained |
| Complexity | Simple to start | Harder to run and debug |

Neither style is "the good one". A monolith is the right start for most small teams. Microservices pay off when the app and the team have grown large.

## Why is it used?

Take QuickBite, a food delivery app. It has restaurants, orders, payments and delivery tracking. In one big application:

- A small change in the payment code needs a full deployment of everything.
- A heavy report on orders can slow down the tracking screen.
- On a rainy evening only the order part is busy, but you must scale the whole app.
- Fifty developers work in one codebase and step on each other's changes.

Microservices answer these problems:

- **Independent deployment.** The payment team releases on its own day.
- **Scale what is busy.** Run ten copies of the order service and two of the rest.
- **Fault isolation.** If the recommendation service fails, people can still order.
- **Team ownership.** One small team owns one service from code to production.
- **Free technology choice.** A service can use the database that suits its data.

The price is real. You now have a network between parts that used to be method calls. Calls can be slow or fail. Data is spread across databases. Testing and monitoring take more effort. Do not choose microservices only because they are popular.

## How it works

Here is how QuickBite might look when split into services.

```text
Mobile app
  |
  v
API Gateway
  |
  +--> Order Service --> Order DB
  |        |
  |        +--> Stock Service
  |
  +--> Payment Service --> Pay DB
  |
  +--> Delivery Svc --> Track DB
```

The mobile app talks to one address, the API gateway. The gateway forwards each request to the right service. Every service keeps its own database, so no other service reads its tables directly. When the order service needs stock information, it asks the stock service over HTTP instead of opening the stock database. That rule keeps services independent.

There are two ways for services to talk:

```text
Synchronous    Asynchronous
A --> B        A --> [queue]
A waits              |
               B reads later
```

With a synchronous call, such as a REST request, service A waits for B's answer. It is simple, but if B is slow or down, A suffers. With asynchronous messaging, A puts a message in a queue or topic and continues. B reads it when ready. Kafka, which you will meet soon, is a popular choice. Use messages when the caller does not need an answer right away, for example "send a confirmation SMS".

Two supporting pieces appear in almost every setup: a place to keep shared settings, and a way for services to find each other's addresses, called service discovery. The Spring Cloud projects provide ready-made tools for the gateway, configuration and discovery, so you do not have to build them.

## Real-Life Example

A city hospital has separate departments: reception, pharmacy, laboratory and billing. Each has its own staff and its own register. When a patient needs a blood test, the doctor sends a slip to the laboratory. The doctor does not walk in and open the laboratory's register. If the pharmacy closes for maintenance, the laboratory keeps working. If the hospital grows, it adds more laboratory staff, not more of everything. The slip is the request between services. The register is each service's private database.

## Microservices with Spring Boot

Spring Boot is a natural fit because each microservice is a small Spring Boot app:

- **Fast to create.** Spring Initializr gives a new service in a minute.
- **Runs alone.** The embedded server means one JAR per service.
- **Ready for production.** Actuator adds health checks that gateways and orchestrators can use.
- **Simple configuration.** Environment variables and profiles let one JAR run in test and production.
- **Container friendly.** A JAR goes into a Docker image easily, which you will do in a later guide.

Each service is set up with its own name and port. Two services on one laptop need different ports:

```properties
spring.application.name=order-service
server.port=8082
```

The stock service would use `stock-service` and port 8081. The order service can then call it with `RestClient`, the HTTP client in Spring:

```java
RestClient client = RestClient.create("http://localhost:8081");
Integer left = client.get()
        .uri("/stock/{item}", "biryani")
        .retrieve()
        .body(Integer.class);
```

If the stock service is not running, this call does not return `null`. It throws `ResourceAccessException`, which we saw when we tried it with nothing listening on port 8081. In a real system you must plan for that failure with timeouts, retries and a fallback answer.

> **Warning:** Every network call can fail. When you split a method call into an HTTP call, you also take on slow answers, timeouts and partial failure. Design for them from the first day.

## Common Mistakes

- **Starting with microservices for a tiny app.** Two developers and one product need a monolith. Split later when a clear pain appears.
- **Sharing one database between services.** Then a table change in one service breaks another, and you have a monolith with extra steps.
- **Making services too small.** Twenty services for a to-do app means more time in networking than in features.
- **Ignoring failure.** Without timeouts, one slow service can freeze every service that calls it.
- **Skipping monitoring.** With many services, you need logs and health checks in one place, or you will never find a bug.

> **Tip:** A good first step is a "well-organised monolith": one deployable app with clean boundaries between features. Moving a well-separated feature out into its own service later is much easier.

## Interview Questions

**What is a microservice?**
A small, independently deployable service that does one business job and owns its data.

**Monolith versus microservices?**
A monolith is one deployable unit. Microservices are many small services that can be deployed and scaled alone, at the cost of network complexity.

**How do microservices communicate?**
Synchronously over REST or gRPC, or asynchronously through messages, for example with Kafka.

**What is an API gateway?**
A single entry point that receives client requests and routes them to the right service. It can also handle security and rate limiting.

**Why should each service have its own database?**
So services stay independent. A schema change in one cannot break another.

## Key Points to Remember

- Microservices split one application into small services with their own data.
- Each service can be built, deployed and scaled alone.
- Services talk over the network, using REST calls or messages.
- Network calls fail, so plan for timeouts and fallbacks.
- Spring Boot gives every service a fast start, an embedded server and health checks.
- Start with a monolith unless you have a clear reason to split.

## Frequently Asked Questions

### Are microservices with Spring Boot better than a monolith?

Not always. They help large teams and large systems. For a small app they add work without giving much back. Choose them when the problems in this guide are real for you.

### How big should one microservice be?

Big enough to do one business job well, small enough for one small team to understand. "Orders" or "payments" is a good size. "Add two numbers" is too small.

### Do I need Spring Cloud for microservices?

Not to start. Two Spring Boot apps calling each other over HTTP is already a microservice system. Spring Cloud helps when you need a gateway, central configuration or service discovery.

### How is data kept consistent across services?

You cannot wrap two databases in one transaction easily. Teams use events and patterns such as sagas, where each service does its step and sends a message, with undo steps if something fails.

## Related Topics

- [Kafka with Spring Boot](/learning/spring-boot-tutorial/kafka-with-spring-boot): asynchronous messages between services.
- [Docker for Spring Boot](/learning/spring-boot-tutorial/docker-for-spring-boot): packaging each service as a container.
- [RestTemplate](/learning/spring-boot-tutorial/resttemplate): calling another service over HTTP.
- [Spring Boot Actuator](/learning/spring-boot-tutorial/spring-boot-actuator): health checks for every service.
