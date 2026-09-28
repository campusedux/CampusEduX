Try each problem on your own first, then compare with the solution.

### Easy: One Counter, Many Rules

A batter's scores this season were 0, 57, 23, 104, 0, 41, 66. Write a functional interface `ScoreCheck` with one method `boolean check(int runs)`, and a method `count(int[] scores, ScoreCheck rule)` that returns how many scores pass the rule. Call it three times with lambdas to count fifties or more, ducks (0 runs), and scores from 20 to 49.

Expected output:

```text
Fifty plus: 3
Ducks: 2
Twenties to forties: 2
```

> **Hint:** The counting loop is written once. Each call passes a different lambda, such as `r -> r == 0`.

**Answer:** The method knows how to count but not what to count. The lambda supplies that missing rule, so one method serves every question.

```java
public class SeasonCounter {
    @FunctionalInterface
    interface ScoreCheck {
        boolean check(int runs);
    }

    static int count(int[] scores, ScoreCheck rule) {
        int total = 0;
        for (int s : scores) {
            if (rule.check(s)) total++;
        }
        return total;
    }

    public static void main(String[] args) {
        int[] scores = {0, 57, 23, 104, 0, 41, 66};
        System.out.println("Fifty plus: "
                + count(scores, r -> r >= 50));
        System.out.println("Ducks: "
                + count(scores, r -> r == 0));
        System.out.println("Twenties to forties: "
                + count(scores, r -> r >= 20 && r <= 49));
    }
}
```

**Output:**

```text
Fifty plus: 3
Ducks: 2
Twenties to forties: 2
```

### Medium: Selection Shortlist

The selectors have these players as `name:runs:average`: Dhruv:540:45, Aarav:610:38, Neel:540:51, Ishaan:220:55, Kabir:610:29. Drop every player with fewer than 300 runs or an average under 30, using `removeIf` with two combined `Predicate` lambdas. Then sort the rest by runs, highest first, and by name for equal runs, using `Comparator` lambdas. Print one player per line.

Expected output:

```text
Aarav 610 runs
Dhruv 540 runs
Neel 540 runs
```

> **Hint:** Join the drop rules with `lowRuns.or(lowAverage)`. For the order, start with a lambda that compares runs in reverse and chain `.thenComparing(p -> p.name)`.

**Answer:** `Predicate.or` builds one rule out of two small lambdas, and `thenComparing` adds a tie-breaker, so the logic stays readable without any anonymous classes.

```java
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.function.Predicate;

public class Shortlist {
    static class Player {
        String name; int runs; int average;
        Player(String n, int r, int a) {
            name = n; runs = r; average = a;
        }
    }

    public static void main(String[] args) {
        String[] data = {"Dhruv:540:45", "Aarav:610:38",
                "Neel:540:51", "Ishaan:220:55", "Kabir:610:29"};
        List<Player> squad = new ArrayList<>();
        for (String d : data) {
            String[] p = d.split(":");
            squad.add(new Player(p[0], Integer.parseInt(p[1]),
                    Integer.parseInt(p[2])));
        }

        Predicate<Player> lowRuns = p -> p.runs < 300;
        Predicate<Player> lowAverage = p -> p.average < 30;
        squad.removeIf(lowRuns.or(lowAverage));

        Comparator<Player> byRuns =
                (a, b) -> Integer.compare(b.runs, a.runs);
        squad.sort(byRuns.thenComparing(p -> p.name));

        squad.forEach(p ->
                System.out.println(p.name + " " + p.runs + " runs"));
    }
}
```

**Output:**

```text
Aarav 610 runs
Dhruv 540 runs
Neel 540 runs
```
