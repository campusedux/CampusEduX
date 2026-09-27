Imagine you hand a prescription slip to a pharmacist. The slip has the patient's name, the doctor's name and a list of medicines with quantities. The pharmacist reads the whole slip, understands it, and prepares the order. You did not shout each detail across the counter one by one. You gave a complete, structured note.

A web request can carry a note like that too. It is called the request body. This topic shows how `@RequestBody` turns the note, written in JSON, into a Java object for your Spring Boot method.

## What is @RequestBody?

> **Definition:** `@RequestBody` is a Spring MVC annotation that tells Spring to read the body of the HTTP request and convert it into a Java object, using a message converter such as Jackson for JSON.

A request has three main places to carry data: the path, the query string and the body. The body is the right place for bigger or nested data, and it is used with POST, PUT and PATCH.

Here is a JSON body for a pharmacy order.

```json
{
  "patientName": "Meera Joshi",
  "doctor": "Dr. Patil",
  "urgent": true,
  "medicines": [
    { "name": "Paracetamol", "quantity": 10 },
    { "name": "Cough Syrup", "quantity": 1 }
  ]
}
```

If your method has a parameter of a matching Java type marked with `@RequestBody`, Spring fills it in. Objects inside objects, lists and numbers all convert by themselves. This conversion of JSON into Java objects is called **deserialization**.

The client must tell the server what the body contains. It does that with the header `Content-Type: application/json`.

## Why is it used?

Query strings and path variables are good for small values. They are poor at carrying rich data.

- **Structured data.** A prescription with a list of medicines cannot fit into a short address.
- **No size worries.** Addresses have length limits, and bodies are much roomier.
- **Cleaner logs.** Data in a body does not appear in the address, so it stays out of browser history.
- **Automatic conversion.** You never parse JSON text yourself. You get a ready Java object.

> **Tip:** Use a small record or class made only for the request, such as `PrescriptionRequest`. It keeps your API shape separate from your database classes. The DTO Pattern topic covers this in detail.

## How it works

The body travels as raw text. Before your method runs, Spring picks a converter by looking at the `Content-Type` header, then turns the text into your object.

```text
POST /api/prescriptions
Content-Type: application/json
{ "patientName": "Meera", ... }
        |
        v
+---------------------------+
| DispatcherServlet finds   |
| the @PostMapping method   |
+---------------------------+
        |
        v
+---------------------------+
| Pick a converter from     |
| Content-Type (Jackson)    |
+---------------------------+
        |
        v
+---------------------------+
| JSON -> PrescriptionRequest|
+---------------------------+
```

The converter reads the JSON and creates a `PrescriptionRequest` object. Then your method runs with that object as its argument. Things can go wrong along the way, and Spring answers on your behalf.

```text
Body arrives
     |
     +-- no Content-Type match
     |        -> 415 Unsupported
     |
     +-- body missing
     |        -> 400 Bad Request
     |
     +-- JSON broken
     |        -> 400 Bad Request
     |
     v
 Method runs with the object
```

Each of these failures stops the request before your method starts. Your code only sees a well-formed object.

## Real-Life Example

Think of an online form for booking a tailor. The form has your name, your measurements, and a list of clothes you want stitched. You press Submit, and the whole form travels as one package. The tailor's shop reads it and creates a work order. If you send a torn or empty page, the shop refuses it straight away. `@RequestBody` is the person at the shop counter who unfolds the package and turns it into a work order your code can use.

## Code Example

Let's build a prescription endpoint for MediPlus Pharmacy. It accepts a JSON prescription with a list of medicines, and replies with a receipt.

```text
mediplus/
├─ pom.xml
└─ src/main/java/
   └─ com/mediplus/orders/
      ├─ OrdersApplication.java
      └─ PrescriptionApi.java
```

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

    <groupId>com.mediplus</groupId>
    <artifactId>orders</artifactId>
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

**File:** `OrdersApplication.java` in package `com.mediplus.orders`

```java
package com.mediplus.orders;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class OrdersApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrdersApplication.class, args);
    }
}
```

**File:** `PrescriptionApi.java` in package `com.mediplus.orders`

```java
package com.mediplus.orders;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/prescriptions")
public class PrescriptionApi {

    record Medicine(String name, int quantity) {}

    record PrescriptionRequest(String patientName, String doctor,
                               boolean urgent, List<Medicine> medicines) {}

    record Receipt(int id, String patientName, int totalItems, String priority) {}

    private final AtomicInteger nextId = new AtomicInteger(1);

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Receipt create(@RequestBody PrescriptionRequest request) {
        int total = request.medicines().stream().mapToInt(Medicine::quantity).sum();
        String priority = request.urgent() ? "URGENT" : "NORMAL";
        return new Receipt(nextId.getAndIncrement(), request.patientName(),
                total, priority);
    }
}
```

Start the app, then post a prescription. The `-d` flag sends the body, and the header tells Spring it is JSON.

```bash
mvn spring-boot:run
curl -X POST localhost:8080/api/prescriptions \
  -H "Content-Type: application/json" \
  -d '{"patientName":"Meera Joshi","doctor":"Dr. Patil","urgent":true,"medicines":[{"name":"Paracetamol","quantity":10},{"name":"Cough Syrup","quantity":1}]}'
```

**Output:** the receipt, spaced out for reading:

```json
{
  "id": 1,
  "patientName": "Meera Joshi",
  "totalItems": 11,
  "priority": "URGENT"
}
```

Now see what Spring does with bad requests. Broken JSON, no body at all, and a body sent as plain text:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:8080/api/prescriptions \
  -H "Content-Type: application/json" -d '{"patientName":'
curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:8080/api/prescriptions \
  -H "Content-Type: application/json"
curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:8080/api/prescriptions \
  -H "Content-Type: text/plain" -d 'hello'
```

**Output:**

```text
400
400
415
```

## Code Explained

- `Medicine` and `PrescriptionRequest` are records. Jackson fills a record through its constructor, using the JSON keys as names. The nested list of `Medicine` objects is converted too.
- `@RequestBody PrescriptionRequest request` tells Spring to read the body and build this object before the method runs.
- The method adds up the quantities and builds a `Receipt`. The reply is turned into JSON by the same converter, in the other direction. That is called **serialization**.
- `@ResponseStatus` with `HttpStatus.CREATED` makes the reply status 201.
- Broken JSON gives 400, because the converter cannot read it.
- A call with no body gives 400, because a required body is missing.
- A body with `Content-Type: text/plain` gives 415, because no converter can turn plain text into our record.
- Two more behaviours are worth knowing. A JSON key that the record does not have, such as an extra `coupon` field, is ignored. A key that is left out, such as `patientName`, leaves that field as `null`. We tried both, and the call still answered 201.

## Path, Query and Body at a Glance

| Point | Path variable | Query parameter | Request body |
|---|---|---|---|
| Annotation | `@PathVariable` | `@RequestParam` | `@RequestBody` |
| Carries | An id | Filters, search words | Full objects |
| Used with | Any method | Mostly GET | POST, PUT, PATCH |
| Size | Small | Small | Large |

## Common Mistakes

> **Warning:** `@RequestBody` does not check your data. If the client leaves out `patientName`, the field simply becomes `null`. Check important fields yourself, or use validation, which a later topic teaches.

- **Missing Content-Type header.** Without `application/json`, the server answers 415 and your method never runs.
- **Using it with GET.** A GET request should not carry a body, and many tools drop it. Use POST, PUT or PATCH.
- **Two bodies in one method.** A request has only one body, so a method can have only one `@RequestBody` parameter. Wrap the pieces in one object.
- **Wrong field names.** Jackson matches JSON keys to Java names exactly. `patient_name` will not fill `patientName`.

## Interview Questions

**What does @RequestBody do?**
It reads the HTTP request body and converts it into a Java object using a message converter, usually Jackson for JSON.

**What is deserialization?**
Converting text such as JSON into a Java object. The reverse, Java object to JSON, is serialization.

**What happens if the JSON is invalid?**
Spring answers `400 Bad Request` and the controller method is not called.

**Can a method have two @RequestBody parameters?**
No. A request has only one body. Combine the data into one class.

## Key Points to Remember

- `@RequestBody` turns the request body into a Java object.
- The client must send a matching `Content-Type`, usually `application/json`.
- Records work well as request types.
- Broken JSON or a missing body gives 400, and a wrong content type gives 415.
- Missing fields become `null`, so check what you need.
- Only one `@RequestBody` is allowed per method.

## Frequently Asked Questions

### What is @RequestBody used for in Spring Boot?

It reads the JSON sent with a POST, PUT or PATCH request and gives your method a ready Java object, so you never parse JSON by hand.

### Do I need Jackson for @RequestBody?

Yes, for JSON. The web starter already includes it, so nothing extra is needed.

### Can I read the body as a plain String?

Yes. Write `@RequestBody String text`. Spring gives you the raw body text without any conversion.

### What is the difference between @RequestBody and @RequestParam?

`@RequestBody` reads the whole body and converts it into an object. `@RequestParam` reads one named value from the query string or a form.

## Related Topics

- [GET POST PUT DELETE Mapping](/learning/spring-boot-tutorial/get-post-put-delete-mapping): pick the right verb for sending a body.
- [@RequestParam](/learning/spring-boot-tutorial/request-param): read small optional values from the address.
- [DTO Pattern](/learning/spring-boot-tutorial/dto-pattern): design request and response classes.
- [ResponseEntity](/learning/spring-boot-tutorial/responseentity): control the status and headers of the reply.
