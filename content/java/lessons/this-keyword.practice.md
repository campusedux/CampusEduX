Try each problem on your own first, then compare with the solution.

### Easy: Cinema Seat Booking

Write a class `SeatBooking` with fields `movie`, `row` and `seat`. Give it two constructors: a full one that takes all three values, and a short one that takes only the movie and books row "F", seat 10 by default. The short constructor must reuse the full one. Book "Space Trail" at row C seat 4, and "River Song" with the default seat, then print both.

Expected output:

```text
Space Trail: C4
River Song: F10
```

> **Hint:** Use `this.movie = movie` in the full constructor, and make the first line of the short one a `this(...)` call.

**Answer:** The short constructor forwards its value plus defaults to the full one, which uses `this.` to fill fields that share names with the parameters.

```java
class SeatBooking {
    private final String movie;
    private final String row;
    private final int seat;

    SeatBooking(String movie, String row, int seat) {
        this.movie = movie;
        this.row = row;
        this.seat = seat;
    }

    SeatBooking(String movie) {
        this(movie, "F", 10);
    }

    void print() {
        System.out.println(movie + ": " + row + seat);
    }
}

public class CinemaDesk {
    public static void main(String[] args) {
        new SeatBooking("Space Trail", "C", 4).print();
        new SeatBooking("River Song").print();
    }
}
```

**Output:**

```text
Space Trail: C4
River Song: F10
```

### Medium: Chained Playlist with a Listener

Build a `Playlist` class with a name and a list of songs. `add(String song)` must return the playlist so calls can be chained. Also write a `Speaker` class with a method `play(Playlist p)` that prints the playlist name and every song with its position. Add a method `playOn(Speaker s)` in `Playlist` that passes the current playlist to the speaker. Create "Road Trip", chain three songs, and play it.

Expected output:

```text
Now playing: Road Trip
1. Open Highway
2. Desert Wind
3. Last Exit
```

> **Hint:** `add` ends with `return this;`. Inside `playOn`, call `s.play(this)`.

**Answer:** Returning `this` makes chaining possible, and passing `this` lets another object work with the current playlist.

```java
import java.util.ArrayList;
import java.util.List;

class Speaker {
    void play(Playlist p) {
        System.out.println("Now playing: " + p.getName());
        List<String> songs = p.getSongs();
        for (int i = 0; i < songs.size(); i++) {
            System.out.println((i + 1) + ". " + songs.get(i));
        }
    }
}

class Playlist {
    private final String name;
    private final List<String> songs = new ArrayList<>();

    Playlist(String name) {
        this.name = name;
    }

    Playlist add(String song) {
        this.songs.add(song);
        return this;
    }

    void playOn(Speaker s) {
        s.play(this);
    }

    String getName() { return name; }

    List<String> getSongs() { return songs; }
}

public class MusicRoom {
    public static void main(String[] args) {
        new Playlist("Road Trip")
            .add("Open Highway")
            .add("Desert Wind")
            .add("Last Exit")
            .playOn(new Speaker());
    }
}
```

**Output:**

```text
Now playing: Road Trip
1. Open Highway
2. Desert Wind
3. Last Exit
```
