Try each problem on your own first, then compare with the solution.

### Easy: Is the Heritage Loop Symmetric?

A tourist metro loop runs through the stops Fort, Museum, Lake, Museum, Fort. A second loop runs Fort, Museum, Lake, Garden, Fort. A loop is symmetric when it reads the same from both ends. Store each loop in a `LinkedList`, check it by taking stops from both ends at once, and print the result for both loops.

Expected output:

```text
Loop A symmetric: true
Loop B symmetric: false
```

> **Hint:** While the list has two or more stops, compare `pollFirst()` with `pollLast()`. Both calls are O(1) on a `LinkedList`.

**Answer:** Each round removes one stop from the head and one from the tail. If any pair differs, the loop is not symmetric. The whole check is O(n) with no index lookups.

```java
import java.util.Arrays;
import java.util.LinkedList;

public class HeritageLoop {
    static boolean symmetric(LinkedList<String> stops) {
        while (stops.size() > 1) {
            String head = stops.pollFirst();
            String tail = stops.pollLast();
            if (!head.equals(tail)) {
                return false;
            }
        }
        return true;
    }

    public static void main(String[] args) {
        LinkedList<String> a = new LinkedList<>(Arrays.asList(
                "Fort", "Museum", "Lake", "Museum", "Fort"));
        LinkedList<String> b = new LinkedList<>(Arrays.asList(
                "Fort", "Museum", "Lake", "Garden", "Fort"));
        System.out.println("Loop A symmetric: " + symmetric(a));
        System.out.println("Loop B symmetric: " + symmetric(b));
    }
}
```

**Output:**

```text
Loop A symmetric: true
Loop B symmetric: false
```

### Medium: Quiz Riders Leaving the Train

Six riders, R1 to R6, sit in a circle for a quiz on a metro coach. Counting starts at R1, and every 3rd rider leaves at the next stop. Counting then carries on from the rider after the one who left, going round the circle. Print the order in which riders leave and the one rider who stays till the end.

Expected output:

```text
Leaves: R3
Leaves: R6
Leaves: R4
Leaves: R2
Leaves: R5
Winner: R1
```

> **Hint:** Treat the `LinkedList` as a circle. Move the first rider to the back twice with `addLast(removeFirst())`, then remove the third one.

**Answer:** Rotating the head to the tail is O(1) on a linked chain, so each round costs only k steps. Nothing is ever shifted, which an `ArrayList` would have to do on every removal from the front.

```java
import java.util.LinkedList;

public class QuizRiders {
    public static void main(String[] args) {
        LinkedList<String> circle = new LinkedList<>();
        for (int i = 1; i <= 6; i++) {
            circle.add("R" + i);
        }
        int k = 3;
        while (circle.size() > 1) {
            for (int step = 1; step < k; step++) {
                circle.addLast(circle.removeFirst());
            }
            System.out.println("Leaves: " + circle.removeFirst());
        }
        System.out.println("Winner: " + circle.getFirst());
    }
}
```

**Output:**

```text
Leaves: R3
Leaves: R6
Leaves: R4
Leaves: R2
Leaves: R5
Winner: R1
```
