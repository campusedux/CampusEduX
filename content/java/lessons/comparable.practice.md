Try each problem on your own first, then compare with the solution.

### Easy: Race Events by Distance

A running club hosts four events: Half Marathon (21.1 km), Fun Run (5.0 km), Full Marathon (42.2 km) and City 10K (10.0 km). Create a `RaceEvent` class that implements `Comparable` so events sort from shortest to longest. Sort the list with `Collections.sort` and print each event.

Expected output:

```text
Fun Run - 5.0 km
City 10K - 10.0 km
Half Marathon - 21.1 km
Full Marathon - 42.2 km
```

> **Hint:** The distance is a `double`, so return `Double.compare(km, other.km)` from `compareTo`.

**Answer:** The natural order of a race event is its distance. `Double.compare` handles decimal values safely, and `Collections.sort` does the rest.

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

class RaceEvent implements Comparable<RaceEvent> {
    final String name;
    final double km;

    RaceEvent(String name, double km) {
        this.name = name;
        this.km = km;
    }

    @Override
    public int compareTo(RaceEvent other) {
        return Double.compare(km, other.km);
    }
}

public class EventCalendar {
    public static void main(String[] args) {
        List<RaceEvent> events = new ArrayList<>();
        events.add(new RaceEvent("Half Marathon", 21.1));
        events.add(new RaceEvent("Fun Run", 5.0));
        events.add(new RaceEvent("Full Marathon", 42.2));
        events.add(new RaceEvent("City 10K", 10.0));

        Collections.sort(events);
        for (RaceEvent e : events) {
            System.out.println(e.name + " - " + e.km + " km");
        }
    }
}
```

**Output:**

```text
Fun Run - 5.0 km
City 10K - 10.0 km
Half Marathon - 21.1 km
Full Marathon - 42.2 km
```

### Medium: Results Board with Shared Places

Five runners finished a 10K: Rhea in 2710 seconds, Kunal in 2655, Anil in 2710, Bhavna in 2598 and Zoya in 2655. Sort them by time, and when two times match, by name in alphabetical order. Runners with the same time share a place, and the next place skips ahead, as in real results.

Expected output:

```text
1 Bhavna 2598
2 Kunal 2655
2 Zoya 2655
4 Anil 2710
4 Rhea 2710
```

> **Hint:** In `compareTo`, compare times first and return that result if it is not zero. Otherwise return `name.compareTo(other.name)`. When printing, keep the previous place if the time did not change.

**Answer:** A two-key `compareTo` gives a full, repeatable order. The place number is the position in the sorted list, except when the time equals the previous runner's time.

```java
import java.util.Arrays;

class Runner implements Comparable<Runner> {
    final String name;
    final int seconds;

    Runner(String name, int seconds) {
        this.name = name;
        this.seconds = seconds;
    }

    @Override
    public int compareTo(Runner other) {
        int byTime = Integer.compare(seconds, other.seconds);
        if (byTime != 0) {
            return byTime;
        }
        return name.compareTo(other.name);
    }
}

public class TenKBoard {
    public static void main(String[] args) {
        Runner[] field = {
            new Runner("Rhea", 2710), new Runner("Kunal", 2655),
            new Runner("Anil", 2710), new Runner("Bhavna", 2598),
            new Runner("Zoya", 2655)
        };
        Arrays.sort(field);

        int place = 0;
        for (int i = 0; i < field.length; i++) {
            if (i == 0 || field[i].seconds != field[i - 1].seconds) {
                place = i + 1;
            }
            System.out.println(place + " " + field[i].name
                    + " " + field[i].seconds);
        }
    }
}
```

**Output:**

```text
1 Bhavna 2598
2 Kunal 2655
2 Zoya 2655
4 Anil 2710
4 Rhea 2710
```
