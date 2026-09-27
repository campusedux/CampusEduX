Think of a diagnostic lab. You walk in with a doctor's prescription, hand it over at the counter, and a few days later you collect your blood test report in an envelope. Two things happened: you handed a document in, and you took a document out. File upload and download in Spring Boot work the same way. A client sends a file to your server, and later it asks for the file back.

Let's build a small report service for a lab called CareLab. You will see how a file travels inside an HTTP request, how to save it safely, how to send it back as a download, and which mistakes to avoid.

## What is File Upload and Download?

> **Definition:** File upload means a client sends a file to your server inside an HTTP request, and the server stores it. File download means the server sends a stored file back so the client can save it.

Normal JSON cannot carry a photo or a PDF well. So browsers and apps use a special request type called **multipart/form-data**. It splits one request into several sections, and each section can hold a text field or a whole file. Spring MVC reads these sections for you and gives each uploaded file to your method as a `MultipartFile`.

For downloading, your method returns a `Resource`, which is Spring's word for "something that can be read as a stream of bytes". Spring copies it to the response, and a header tells the browser to save it as a file.

## Why is it used?

Almost every real app has files:

- A hospital app stores lab reports and scanned prescriptions.
- A job portal stores résumés.
- A shop stores product photos.
- A bank asks for a signed form.

Instead of pasting a huge text into JSON, the client sends the file as it is. You control what is accepted, how big it can be and where it lives. You also decide who may download it, which matters for private reports.

> **Note:** Uploaded files are user input, and users can send anything. Treat every file name, size and type as untrusted until you check it.

## How it works

Here is what happens when a client uploads a report and then downloads it.

```text
Client
  |  POST /reports
  |  multipart/form-data
  v
Tomcat reads the request
  |  checks size limits
  v
DispatcherServlet
  |  builds MultipartFile
  v
ReportController.upload()
  |  checks type, saves to disk
  v
201 Created + stored name
```

Tomcat first checks your size limits. If the file is too big, the request stops right there. Spring then wraps the uploaded section in a `MultipartFile` and calls your controller method. Your code validates the file and copies it into a folder, and replies with the name it saved under.

Now the download side.

```text
Client
  |  GET /reports/5b221739.pdf
  v
ReportController.download()
  |  finds the file on disk
  v
Resource + headers
  |  Content-Disposition:
  |  attachment
  v
Browser saves the file
```

The controller looks up the stored file, wraps it as a `Resource` and adds a `Content-Disposition: attachment` header. That header tells the browser "do not open this, save it".

## Real-Life Example

A courier company keeps parcels in a warehouse. When a parcel arrives, the clerk does not keep the sender's handwritten label as the shelf number. He gives it his own tracking number and puts it on a shelf. Later, you show your tracking number to collect the parcel. Your server should do the same: save each upload under a name you choose, and hand that name back to the client.

## Code Example

CareLab accepts PDF, PNG and JPG reports up to 1 MB. Only the web starter is needed.

```text
carelab-reports/
├─ pom.xml
└─ src/main/
   ├─ java/com/carelab/reports/
   │  ├─ ReportsApplication.java
   │  ├─ FileStorage.java
   │  └─ ReportController.java
   └─ resources/
      └─ application.properties
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

    <groupId>com.carelab</groupId>
    <artifactId>reports</artifactId>
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
app.upload-dir=uploads
spring.servlet.multipart.max-file-size=1MB
spring.servlet.multipart.max-request-size=2MB
```

**File:** `ReportsApplication.java` in package `com.carelab.reports`

```java
package com.carelab.reports;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ReportsApplication {

    public static void main(String[] args) {
        SpringApplication.run(ReportsApplication.class, args);
    }
}
```

**File:** `FileStorage.java` in package `com.carelab.reports`

```java
package com.carelab.reports;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorage {

    private final Path root;

    public FileStorage(@Value("${app.upload-dir}") String dir) throws IOException {
        this.root = Path.of(dir).toAbsolutePath().normalize();
        Files.createDirectories(root);
    }

    public String save(MultipartFile file, String extension) throws IOException {
        String storedName = UUID.randomUUID().toString().substring(0, 8) + "." + extension;
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, root.resolve(storedName), StandardCopyOption.REPLACE_EXISTING);
        }
        return storedName;
    }

    public Resource load(String storedName) {
        Path file = root.resolve(storedName).normalize();
        if (!file.startsWith(root) || !Files.isReadable(file)) {
            return null;
        }
        return new PathResource(file);
    }
}
```

**File:** `ReportController.java` in package `com.carelab.reports`

```java
package com.carelab.reports;

import java.io.IOException;
import java.util.Set;

import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class ReportController {

    private static final Set<String> ALLOWED = Set.of("pdf", "png", "jpg");

    private final FileStorage storage;

    public ReportController(FileStorage storage) {
        this.storage = storage;
    }

    record Uploaded(String storedName, String originalName, long sizeInBytes) {}

    @PostMapping("/reports")
    public ResponseEntity<Uploaded> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The file is empty");
        }
        String original = StringUtils.cleanPath(String.valueOf(file.getOriginalFilename()));
        String extension = StringUtils.getFilenameExtension(original);
        if (extension == null || !ALLOWED.contains(extension.toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Only pdf, png and jpg are allowed");
        }
        String storedName = storage.save(file, extension.toLowerCase());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new Uploaded(storedName, original, file.getSize()));
    }

    @GetMapping("/reports/{storedName}")
    public ResponseEntity<Resource> download(@PathVariable String storedName) {
        Resource file = storage.load(storedName);
        if (file == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No such report");
        }
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(storedName).build().toString())
                .body(file);
    }
}
```

Start the app. In a second terminal, upload a small text file named `blood-test.pdf`:

```bash
mvn spring-boot:run
curl -F "file=@blood-test.pdf" localhost:8080/reports
```

**Output:**

```json
{
  "storedName": "5b221739.pdf",
  "originalName": "blood-test.pdf",
  "sizeInBytes": 31
}
```

Your stored name will be different, because it is random. Now download it with that name. The flags `-OJ` tell curl to save the file under the name from the `Content-Disposition` header, and `cat` shows what is inside:

```bash
curl -OJ localhost:8080/reports/5b221739.pdf
cat 5b221739.pdf
```

**Output:**

```text
Blood test: all values normal.
```

## Code Explained

- The `max-file-size` setting in the `spring.servlet.multipart` group limits one file. `max-request-size` limits the whole request. Spring Boot allows only 1 MB per file by default, so set both on purpose.
- `@RequestParam("file") MultipartFile` reads the form field named `file`. The name must match the field name the client uses.
- `FileStorage` creates the upload folder once, at startup. It copies the stream into a file with `Files.copy`.
- The stored name is a random id plus the extension. The client's file name never becomes a path on your disk.
- `StringUtils.cleanPath` tidies the original name, and `getFilenameExtension` gets the extension for the whitelist check.
- `load` uses `normalize()` and `startsWith(root)` so that a name like `../../secret` cannot escape the folder.
- `ResponseEntity<Resource>` with a `ContentDisposition` set to `attachment` produces a download.

## What Happens When Something Goes Wrong

Try the bad cases and read the status codes.

| Request | Result |
|---|---|
| Upload an `.exe` file | 415 Unsupported Media Type |
| Upload an empty file | 400 Bad Request |
| Upload 1.5 MB with a 1 MB limit | 413 Content Too Large |
| Download a name that does not exist | 404 Not Found |

The 415 reply looked like this:

```json
{
  "timestamp": "2026-09-26T17:00:52.156Z",
  "status": 415,
  "error": "Unsupported Media Type",
  "path": "/reports"
}
```

The 413 reply came from the multipart limit, before any of our code ran, so it has no JSON body. Later, a global exception handler can turn it into the same JSON as your other errors.

> **Warning:** Never build a path from the file name the client sent, such as `root.resolve(originalName)`. A name like `../../app.jar` can overwrite files outside your folder. Generate your own name, or check with `normalize()` and `startsWith()` as we did.

## Where to Keep the Files

- **Local folder.** Simple and fine for learning or a single server. Keep it outside the project, and give it a path from configuration.
- **Database column.** Works for small files, but it makes the database large and slow.
- **Object storage.** In production, services such as Amazon S3 or Google Cloud Storage are common. You store the file there and keep only its name in your database. Many servers can then share the same files.

## Common Mistakes

- **Trusting the content type.** The `Content-Type` of an upload is set by the client, so a hacker can label a script as an image. Check the extension, and for high-risk apps check the file's real signature bytes.
- **Wrong field name.** If the client sends `report` but your code expects `file`, Spring answers 400 and the file never arrives.
- **Forgetting the limits.** Without your own limits, one large upload can eat the disk or the memory.
- **Overwriting files.** Two patients both upload `report.pdf`. Random stored names prevent that.
- **Serving files without a login check.** A report is private data. Later, add Spring Security so only the owner can download it.

## Interview Questions

**What is MultipartFile?**
It is the Spring interface for one uploaded file. It gives you the original name, the content type, the size and the bytes.

**Why do we use multipart/form-data for uploads?**
A single request can then hold several parts, each with its own headers, so binary files and text fields travel together without being converted to text.

**How do you make a file download instead of opening in the browser?**
Return the file as a `Resource` and add the header `Content-Disposition: attachment; filename="..."`.

**How do you stop path traversal in uploads?**
Never use the client's file name as a path. Generate a name, or normalize the resolved path and check that it still starts with your upload folder.

## Key Points to Remember

- Uploads arrive as multipart/form-data, and Spring gives each file as a `MultipartFile`.
- Set `max-file-size` and `max-request-size` deliberately.
- Save under a name you generate; never trust the client's name or content type.
- Return a `Resource` with a `Content-Disposition` header to make a download.
- Guard against path traversal with `normalize()` and `startsWith()`.
- In production, keep files in object storage and keep the file name in your database.

## Frequently Asked Questions

### How do I test file upload and download with Postman?

Choose a POST request, open the Body tab, pick form-data, add a key named `file`, change its type from Text to File and select your file. For download, send a GET request and use Save Response.

### Can I upload many files at once?

Yes. Accept a `List<MultipartFile>` and send the same field name several times. The practice section shows this.

### Where should file upload and download store files in production?

In object storage such as Amazon S3, or on a shared disk. A local folder disappears when a container is replaced, and it cannot be shared between servers.

### How do I change the upload size limit?

Set `max-file-size` and `max-request-size` under the `spring.servlet.multipart` group in `application.properties`, for example to `5MB`.

## Related Topics

- [ResponseEntity](/learning/spring-boot-tutorial/responseentity): control the status, headers and body of every reply, including downloads.
- [@RequestParam](/learning/spring-boot-tutorial/request-param): learn how form fields and query values reach your method.
- [HTTP Status Codes in Spring Boot](/learning/spring-boot-tutorial/http-status-codes-in-spring-boot): choose the right code for 400, 404, 413 and 415.
- [Exception Handling in Spring Boot](/learning/spring-boot-tutorial/exception-handling-in-spring-boot): turn upload failures into clear JSON messages.
