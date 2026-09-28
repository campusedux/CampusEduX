Try each problem on your own first, then compare with the solution.

### Easy: Counting Stadium Turnstiles

A stadium has three turnstile lanes, and each lane lets exactly 1,000 visitors through. Run each lane as its own thread that records every visitor on one shared `Gate` object. After all lanes finish, print the total. It must be 3,000 on every run.

Expected output:

```text
Visitors counted: 3000
```

> **Hint:** Make the method that adds a visitor `synchronized`, and call `join()` on every lane before reading the total.

**Answer:** The `synchronized` method lets only one lane update the count at a time, so no increment is lost. Joining the threads makes sure all 3,000 updates are finished and visible before `main` prints.

```java
class Gate {
    private int visitors;

    synchronized void pass() {
        visitors++;
    }

    synchronized int total() {
        return visitors;
    }
}

public class Turnstiles {
    public static void main(String[] args)
            throws InterruptedException {
        Gate gate = new Gate();
        Thread[] lanes = new Thread[3];
        for (int i = 0; i < lanes.length; i++) {
            lanes[i] = new Thread(() -> {
                for (int v = 0; v < 1000; v++) {
                    gate.pass();
                }
            });
            lanes[i].start();
        }
        for (Thread lane : lanes) {
            lane.join();
        }
        System.out.println("Visitors counted: " + gate.total());
    }
}
```

**Output:**

```text
Visitors counted: 3000
```

### Medium: Two Sections, Two Locks

An arena has 120 floor seats and 40 balcony seats. Five booking agents run as threads, and each handles 30 requests. For every request an agent first tries the balcony; if the balcony is full, it books a floor seat instead. Give each section its own lock object so that a balcony booking never waits for a floor booking. Print the number of requests and how many seats each section sold.

Expected output:

```text
requests: 150
floor 110/120, balcony 40/40
```

> **Hint:** Use two private `Object` locks. Put each check-then-act inside a `synchronized` block on its own section's lock, and take both locks, always in the same order, only when reporting.

**Answer:** Separate locks let the two sections be booked in parallel while each check-then-act stays atomic. The 40 balcony seats fill first and the remaining 110 requests go to the floor, whatever order the agents run in.

```java
class Arena {
    private final Object floorLock = new Object();
    private final Object balconyLock = new Object();
    private int floorLeft = 120;
    private int balconyLeft = 40;
    private int floorSold;
    private int balconySold;

    boolean bookFloor() {
        synchronized (floorLock) {
            if (floorLeft == 0) return false;
            floorLeft--;
            floorSold++;
            return true;
        }
    }

    boolean bookBalcony() {
        synchronized (balconyLock) {
            if (balconyLeft == 0) return false;
            balconyLeft--;
            balconySold++;
            return true;
        }
    }

    String report() {
        synchronized (floorLock) {
            synchronized (balconyLock) {
                return "floor " + floorSold + "/120, balcony "
                        + balconySold + "/40";
            }
        }
    }
}

public class TwoSections {
    public static void main(String[] args)
            throws InterruptedException {
        Arena arena = new Arena();
        Thread[] agents = new Thread[5];
        for (int a = 0; a < agents.length; a++) {
            agents[a] = new Thread(() -> {
                for (int i = 0; i < 30; i++) {
                    if (!arena.bookBalcony()) {
                        arena.bookFloor();
                    }
                }
            });
            agents[a].start();
        }
        for (Thread t : agents) {
            t.join();
        }
        System.out.println("requests: " + agents.length * 30);
        System.out.println(arena.report());
    }
}
```

**Output:**

```text
requests: 150
floor 110/120, balcony 40/40
```
