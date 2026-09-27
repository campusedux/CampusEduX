Try each problem on your own first. Both use only the web starter.

### Easy: SweetOven Cake Photo Check

SweetOven, a bakery, lets customers upload a cake photo for a custom order. Build `POST /photos` with a field named `photo`. If the content type starts with `image/`, reply with the file name, type and size. Otherwise reply 415.

> **Hint:** Take a `MultipartFile` with `@RequestParam`. Read `getContentType()`, `getOriginalFilename()` and `getSize()`. Throw a `ResponseStatusException` for anything that is not an image.

**Answer:** Nothing is saved here. We only check the content type and report what arrived.

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

    <groupId>com.sweetoven</groupId>
    <artifactId>photos</artifactId>
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

**File:** `PhotosApplication.java` in package `com.sweetoven.photos`

```java
package com.sweetoven.photos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PhotosApplication {

    public static void main(String[] args) {
        SpringApplication.run(PhotosApplication.class, args);
    }
}
```

**File:** `PhotoController.java` in package `com.sweetoven.photos`

```java
package com.sweetoven.photos;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class PhotoController {

    record PhotoInfo(String name, String type, long sizeInBytes) {}

    @PostMapping("/photos")
    public PhotoInfo upload(@RequestParam("photo") MultipartFile photo) {
        String type = photo.getContentType();
        if (type == null || !type.startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Please upload an image");
        }
        return new PhotoInfo(photo.getOriginalFilename(), type, photo.getSize());
    }
}
```

Upload a PNG:

```bash
curl -F "photo=@cake.png" localhost:8080/photos
```

The reply, spaced out for reading. Uploading `menu.txt` instead gives status 415.

```json
{
  "name": "cake.png",
  "type": "image/png",
  "sizeInBytes": 15
}
```

### Medium: DocuVault Multi-File Upload

DocuVault stores loan documents. Build these endpoints:

- `POST /documents` takes up to three files in the field `files`, saves them in a folder named in `application.properties`, and replies 201 with the saved names. More than three files gives 400.
- `GET /documents` lists the saved names.
- `GET /documents/{name}` sends one file back, with 404 if it is missing.

Each file may be at most 1 MB.

> **Hint:** Use `List<MultipartFile>` for the field. Read the folder with `Files.list`. When you resolve a name from the URL, call `normalize()` and check `startsWith(root)`.

**Answer:** The list gives the file count before we save anything, so the limit check comes first. The download method uses the same path guard as the CareLab example.

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

    <groupId>com.docuvault</groupId>
    <artifactId>documents</artifactId>
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
app.folder=vault
spring.servlet.multipart.max-file-size=1MB
spring.servlet.multipart.max-request-size=3MB
```

**File:** `DocumentsApplication.java` in package `com.docuvault.documents`

```java
package com.docuvault.documents;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DocumentsApplication {

    public static void main(String[] args) {
        SpringApplication.run(DocumentsApplication.class, args);
    }
}
```

**File:** `DocumentController.java` in package `com.docuvault.documents`

```java
package com.docuvault.documents;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
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
public class DocumentController {

    private static final int MAX_FILES = 3;

    private final Path root;

    public DocumentController(@Value("${app.folder}") String folder) throws IOException {
        this.root = Path.of(folder).toAbsolutePath().normalize();
        Files.createDirectories(root);
    }

    @PostMapping("/documents")
    public ResponseEntity<List<String>> upload(@RequestParam("files") List<MultipartFile> files) throws IOException {
        if (files.size() > MAX_FILES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At most " + MAX_FILES + " files at a time");
        }
        List<String> saved = new ArrayList<>();
        for (MultipartFile file : files) {
            String name = StringUtils.cleanPath(String.valueOf(file.getOriginalFilename()));
            if (file.isEmpty() || name.contains("..")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bad file: " + name);
            }
            Files.copy(file.getInputStream(), root.resolve(name), StandardCopyOption.REPLACE_EXISTING);
            saved.add(name);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/documents")
    public List<String> list() throws IOException {
        try (Stream<Path> files = Files.list(root)) {
            return files.map(p -> p.getFileName().toString()).sorted().toList();
        }
    }

    @GetMapping("/documents/{name}")
    public ResponseEntity<Resource> download(@PathVariable String name) {
        Path file = root.resolve(name).normalize();
        if (!file.startsWith(root) || !Files.isReadable(file)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No such document");
        }
        return ResponseEntity.ok().contentType(MediaType.TEXT_PLAIN).body(new PathResource(file));
    }
}
```

Upload two files, then list them:

```bash
curl -F "files=@invoice.txt" -F "files=@b.txt" localhost:8080/documents
```

The upload replies with the names in the order sent:

```json
["invoice.txt","b.txt"]
```

Then `curl localhost:8080/documents` prints the sorted names, and a request with four files gives status 400:

```json
["b.txt","invoice.txt"]
```
