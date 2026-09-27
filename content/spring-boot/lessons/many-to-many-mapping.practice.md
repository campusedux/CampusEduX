Try each problem on your own first. Both use the H2 in-memory database, so nothing needs to be installed.

### Easy: Movie Cast List

A cinema keeps movies and actors. One actor appears in many movies, and one movie has many actors. Build an app with `Movie` and `Actor` entities linked by `@ManyToMany`. Save two movies and three actors, then print each movie with its cast.

> **Hint:** Put `@JoinTable` on `Movie` so it owns the link, and use `mappedBy` on `Actor`. Read the cast inside a `@Transactional` method, because the collection is lazy.

**Answer:** `Movie` owns the join table `movie_actor`. Save the actors first, because a link cannot point to an unsaved actor. A helper method adds the actor on both sides, and a transactional method prints the cast.

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
    <artifactId>cast</artifactId>
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

**File:** `application.properties` in `src/main/resources`

```properties
spring.main.banner-mode=off
logging.level.root=warn
```

**File:** `Movie.java` in package `com.cinego.cast`

```java
package com.cinego.cast;

import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;

@Entity
public class Movie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @ManyToMany
    @JoinTable(name = "movie_actor",
            joinColumns = @JoinColumn(name = "movie_id"),
            inverseJoinColumns = @JoinColumn(name = "actor_id"))
    private Set<Actor> cast = new HashSet<>();

    protected Movie() {
    }

    public Movie(String title) {
        this.title = title;
    }

    public void addActor(Actor actor) {
        cast.add(actor);
        actor.getMovies().add(this);
    }

    public String getTitle() {
        return title;
    }

    public Set<Actor> getCast() {
        return cast;
    }
}
```

**File:** `Actor.java` in package `com.cinego.cast`

```java
package com.cinego.cast;

import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;

@Entity
public class Actor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @ManyToMany(mappedBy = "cast")
    private Set<Movie> movies = new HashSet<>();

    protected Actor() {
    }

    public Actor(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public Set<Movie> getMovies() {
        return movies;
    }
}
```

**File:** `MovieRepository.java` in package `com.cinego.cast`

```java
package com.cinego.cast;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MovieRepository extends JpaRepository<Movie, Long> {
}
```

**File:** `ActorRepository.java` in package `com.cinego.cast`

```java
package com.cinego.cast;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ActorRepository extends JpaRepository<Actor, Long> {
}
```

**File:** `CastService.java` in package `com.cinego.cast`

```java
package com.cinego.cast;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CastService {

    private final MovieRepository movies;
    private final ActorRepository actors;

    public CastService(MovieRepository movies, ActorRepository actors) {
        this.movies = movies;
        this.actors = actors;
    }

    @Transactional
    public void loadAndPrint() {
        Actor asha = actors.save(new Actor("Asha Menon"));
        Actor dev = actors.save(new Actor("Dev Kapoor"));
        Actor zoya = actors.save(new Actor("Zoya Khan"));

        Movie orbit = new Movie("The Silent Orbit");
        orbit.addActor(asha);
        orbit.addActor(dev);
        Movie express = new Movie("Monsoon Express");
        express.addActor(dev);
        express.addActor(zoya);
        movies.saveAll(List.of(orbit, express));
        movies.flush();

        for (Movie movie : movies.findAll()) {
            String names = movie.getCast().stream().map(Actor::getName).sorted()
                    .collect(Collectors.joining(", "));
            System.out.println(movie.getTitle());
            System.out.println("  cast: " + names);
        }
    }
}
```

**File:** `CastApplication.java` in package `com.cinego.cast`

```java
package com.cinego.cast;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class CastApplication {

    public static void main(String[] args) {
        SpringApplication.run(CastApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(CastService service) {
        return args -> service.loadAndPrint();
    }
}
```

Running the app prints:

```text
The Silent Orbit
  cast: Asha Menon, Dev Kapoor
Monsoon Express
  cast: Dev Kapoor, Zoya Khan
```

Dev Kapoor appears in both movies, which is exactly why a join table is needed. The cast names are sorted so the line does not depend on set order.

### Medium: Playlist Cleanup

A music app has playlists and songs. A song can be in many playlists and a playlist has many songs. Using `@ManyToMany`, save two playlists that share one song. Then remove that song from the first playlist only. Print how many rows the join table has before and after, and confirm the song itself is not deleted.

> **Hint:** Removing a link means removing the song from the collection on the owning side. Do not call `delete` on the song. Count the rows with `JdbcTemplate`, and call `flush()` so the change reaches the database before you count.

**Answer:** Remove the song from the owning side, `Playlist.songs`, and also from the inverse side to keep both in sync. Hibernate deletes one join row. The song row stays, because no cascade is used.

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

    <groupId>com.tunebox</groupId>
    <artifactId>playlists</artifactId>
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

**File:** `application.properties` in `src/main/resources`

```properties
spring.main.banner-mode=off
logging.level.root=warn
```

**File:** `Playlist.java` in package `com.tunebox.playlists`

```java
package com.tunebox.playlists;

import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;

@Entity
public class Playlist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @ManyToMany
    @JoinTable(name = "playlist_song",
            joinColumns = @JoinColumn(name = "playlist_id"),
            inverseJoinColumns = @JoinColumn(name = "song_id"))
    private Set<Song> songs = new HashSet<>();

    protected Playlist() {
    }

    public Playlist(String name) {
        this.name = name;
    }

    public void addSong(Song song) {
        songs.add(song);
        song.getPlaylists().add(this);
    }

    public void removeSong(Song song) {
        songs.remove(song);
        song.getPlaylists().remove(this);
    }

    public String getName() {
        return name;
    }
}
```

**File:** `Song.java` in package `com.tunebox.playlists`

```java
package com.tunebox.playlists;

import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;

@Entity
public class Song {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @ManyToMany(mappedBy = "songs")
    private Set<Playlist> playlists = new HashSet<>();

    protected Song() {
    }

    public Song(String title) {
        this.title = title;
    }

    public Set<Playlist> getPlaylists() {
        return playlists;
    }
}
```

**File:** `PlaylistRepository.java` in package `com.tunebox.playlists`

```java
package com.tunebox.playlists;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PlaylistRepository extends JpaRepository<Playlist, Long> {
}
```

**File:** `SongRepository.java` in package `com.tunebox.playlists`

```java
package com.tunebox.playlists;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SongRepository extends JpaRepository<Song, Long> {
}
```

**File:** `PlaylistService.java` in package `com.tunebox.playlists`

```java
package com.tunebox.playlists;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlaylistService {

    private final PlaylistRepository playlists;
    private final SongRepository songs;
    private final JdbcTemplate jdbc;

    public PlaylistService(PlaylistRepository playlists, SongRepository songs, JdbcTemplate jdbc) {
        this.playlists = playlists;
        this.songs = songs;
        this.jdbc = jdbc;
    }

    @Transactional
    public void run() {
        Song rain = songs.save(new Song("Rain on Tin Roof"));
        Song dawn = songs.save(new Song("Dawn Raga"));

        Playlist study = new Playlist("Study Time");
        study.addSong(rain);
        study.addSong(dawn);
        Playlist sleep = new Playlist("Sleepy Evening");
        sleep.addSong(rain);
        playlists.save(study);
        playlists.save(sleep);
        playlists.flush();
        System.out.println("Links before: " + count("playlist_song"));

        study.removeSong(rain);
        playlists.flush();
        System.out.println("Links after: " + count("playlist_song"));
        System.out.println("Songs still stored: " + count("song"));
    }

    private int count(String table) {
        return jdbc.queryForObject("select count(*) from " + table, Integer.class);
    }
}
```

**File:** `PlaylistsApplication.java` in package `com.tunebox.playlists`

```java
package com.tunebox.playlists;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class PlaylistsApplication {

    public static void main(String[] args) {
        SpringApplication.run(PlaylistsApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(PlaylistService service) {
        return args -> service.run();
    }
}
```

Running the app prints:

```text
Links before: 3
Links after: 2
Songs still stored: 2
```

One join row disappeared and both songs are still in the `song` table.
