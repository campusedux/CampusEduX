Try each problem on your own first. Each project has its own `pom.xml`, shown below.

### Easy: Authors and Their Books

PageTurn Library lists books by author. Build `Author` (a name) and `Book` (a title) with a one-way `@ManyToOne` link from the book to its author. Save two authors, save three books linked to them, and use a derived query `findByAuthorName` to print the titles by one author.

Use these books: River of Stories and Night Train to Pune by Anita Rao, and Coastal Winds by Dev Menon. Search for Anita Rao.

> **Hint:** Only `Book` needs a relationship field: `@ManyToOne @JoinColumn(name = "author_id")`. Save the authors first, so their ids exist when the books are saved. The derived query walks from `Book` to `author` to `name`.

**Answer:** The foreign key `author_id` lives in the `book` table. No `@OneToMany` is needed, because the repository query finds the books of one author.

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
    <artifactId>authors</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
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

**File:** `AuthorsApplication.java` in package `com.pageturn.authors`

```java
package com.pageturn.authors;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AuthorsApplication {

    public static void main(String[] args) {
        SpringApplication.run(AuthorsApplication.class, args);
    }
}
```

**File:** `Author.java` in package `com.pageturn.authors`

```java
package com.pageturn.authors;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Author {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    protected Author() {
    }

    public Author(String name) {
        this.name = name;
    }
}
```

**File:** `Book.java` in package `com.pageturn.authors`

```java
package com.pageturn.authors;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @ManyToOne
    @JoinColumn(name = "author_id")
    private Author author;

    protected Book() {
    }

    public Book(String title, Author author) {
        this.title = title;
        this.author = author;
    }

    public String getTitle() {
        return title;
    }
}
```

**File:** `Repositories.java` in package `com.pageturn.authors`

```java
package com.pageturn.authors;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

interface AuthorRepository extends JpaRepository<Author, Long> {
}

interface BookRepository extends JpaRepository<Book, Long> {

    List<Book> findByAuthorName(String name);
}
```

**File:** `AuthorRunner.java` in package `com.pageturn.authors`

```java
package com.pageturn.authors;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class AuthorRunner implements CommandLineRunner {

    private final AuthorRepository authors;
    private final BookRepository books;

    public AuthorRunner(AuthorRepository authors, BookRepository books) {
        this.authors = authors;
        this.books = books;
    }

    @Override
    public void run(String... args) {
        Author anita = authors.save(new Author("Anita Rao"));
        Author dev = authors.save(new Author("Dev Menon"));

        books.save(new Book("River of Stories", anita));
        books.save(new Book("Night Train to Pune", anita));
        books.save(new Book("Coastal Winds", dev));

        System.out.println("Books by Anita Rao:");
        books.findByAuthorName("Anita Rao").forEach(b -> System.out.println("  " + b.getTitle()));
    }
}
```

The output is:

```text
Books by Anita Rao:
  River of Stories
  Night Train to Pune
```

### Medium: Bakery Categories and Fetch Join

Golden Crust Bakery has categories, and each category has many products. Build `Category` (a name) with a `@OneToMany` list of `Product`, and `Product` (a name and a price) with a `@ManyToOne` link back. Write a repository method that loads a category together with its products using a JPQL `join fetch`. Call it outside any transaction and print the category name with its product names, to show that the products are already loaded.

Use these products: Croissant (60) and Sourdough Loaf (140) in the category Breads.

> **Hint:** The method is `@Query("select c from Category c join fetch c.products where c.id = :id")`. Keep the list lazy. The `join fetch` loads it in the same query, so no session is needed afterwards.

**Answer:** Without `join fetch`, reading `getProducts()` outside a transaction would throw `LazyInitializationException`. The fetch join brings the products along with the category.

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

    <groupId>com.goldencrust</groupId>
    <artifactId>bakery</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
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

**File:** `BakeryApplication.java` in package `com.goldencrust.bakery`

```java
package com.goldencrust.bakery;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BakeryApplication {

    public static void main(String[] args) {
        SpringApplication.run(BakeryApplication.class, args);
    }
}
```

**File:** `Category.java` in package `com.goldencrust.bakery`

```java
package com.goldencrust.bakery;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;

@Entity
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL)
    private List<Product> products = new ArrayList<>();

    protected Category() {
    }

    public Category(String name) {
        this.name = name;
    }

    public void addProduct(Product product) {
        products.add(product);
        product.setCategory(this);
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public List<Product> getProducts() {
        return products;
    }
}
```

**File:** `Product.java` in package `com.goldencrust.bakery`

```java
package com.goldencrust.bakery;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private int price;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    protected Product() {
    }

    public Product(String name, int price) {
        this.name = name;
        this.price = price;
    }

    void setCategory(Category category) {
        this.category = category;
    }

    public String getName() {
        return name;
    }
}
```

**File:** `CategoryRepository.java` in package `com.goldencrust.bakery`

```java
package com.goldencrust.bakery;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    @Query("select c from Category c join fetch c.products where c.id = :id")
    Optional<Category> findWithProducts(@Param("id") Long id);
}
```

**File:** `CategoryRunner.java` in package `com.goldencrust.bakery`

```java
package com.goldencrust.bakery;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class CategoryRunner implements CommandLineRunner {

    private final CategoryRepository repository;

    public CategoryRunner(CategoryRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        Category breads = new Category("Breads");
        breads.addProduct(new Product("Croissant", 60));
        breads.addProduct(new Product("Sourdough Loaf", 140));
        Long id = repository.save(breads).getId();

        Category loaded = repository.findWithProducts(id).orElseThrow();
        System.out.println(loaded.getName() + ":");
        loaded.getProducts().forEach(p -> System.out.println("  " + p.getName()));
    }
}
```

The output is:

```text
Breads:
  Croissant
  Sourdough Loaf
```
