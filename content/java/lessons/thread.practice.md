Try each problem on your own first, then compare with the solution.

### Easy: Parking Floor Counter

A shopping mall's parking app keeps one `boolean` per spot on floor 2, where `true` means the spot is taken. The ten spots are `true, false, true, true, false, false, true, false, true, true`. Start one thread named `floor-2-counter` that counts the free spots. After it finishes, `main` prints the thread's name, the free count and the taken count.

Expected output:

```text
floor-2-counter done
free spots: 4
taken spots: 6
```

> **Hint:** Pass a lambda `Runnable` and a name to the `Thread` constructor. Call `join()` before reading the count, so `main` waits and then sees the final value.

**Answer:** The worker thread writes the count into a static field, and `join()` makes `main` wait until that count is complete before printing it.

```java
public class ParkingCount {
    static int freeSpots;

    public static void main(String[] args)
            throws InterruptedException {
        boolean[] taken = {true, false, true, true, false,
                           false, true, false, true, true};

        Thread counter = new Thread(() -> {
            for (boolean t : taken) {
                if (!t) {
                    freeSpots++;
                }
            }
        }, "floor-2-counter");

        counter.start();
        counter.join();

        System.out.println(counter.getName() + " done");
        System.out.println("free spots: " + freeSpots);
        System.out.println("taken spots: "
                + (taken.length - freeSpots));
    }
}
```

**Output:**

```text
floor-2-counter done
free spots: 4
taken spots: 6
```

### Medium: Bakery Sales Split Across Workers

A bakery chain has 12 shop totals for the day: `120, 95, 140, 80, 110, 175, 60, 130, 90, 150, 105, 85`. Split the array into three equal chunks and give each chunk to its own thread. Each thread adds up only its own chunk. `main` then joins the workers in order, prints each partial sum, prints the grand total, and checks it against a plain single-thread sum.

Expected output:

```text
worker 0: 435
worker 1: 475
worker 2: 430
total   : 1340
matches : true
```

> **Hint:** Give every worker its own slot in an `int[] partial` array, so no two threads ever write the same variable. Copy the loop values into `final` locals before using them inside the lambda.

**Answer:** Each thread owns a separate slot, so there is no shared counter to protect. Joining in a fixed order and printing only from `main` keeps the output identical on every run.

```java
public class BakerySales {
    public static void main(String[] args)
            throws InterruptedException {
        int[] sales = {120, 95, 140, 80, 110, 175,
                       60, 130, 90, 150, 105, 85};
        int workers = 3;
        int[] partial = new int[workers];
        Thread[] team = new Thread[workers];
        int chunk = sales.length / workers;

        for (int w = 0; w < workers; w++) {
            final int id = w;
            final int from = w * chunk;
            final int to = from + chunk;
            team[w] = new Thread(() -> {
                for (int i = from; i < to; i++) {
                    partial[id] += sales[i];
                }
            });
            team[w].start();
        }

        int total = 0;
        for (int w = 0; w < workers; w++) {
            team[w].join();
            System.out.println("worker " + w + ": " + partial[w]);
            total += partial[w];
        }

        int check = 0;
        for (int s : sales) {
            check += s;
        }
        System.out.println("total   : " + total);
        System.out.println("matches : " + (total == check));
    }
}
```

**Output:**

```text
worker 0: 435
worker 1: 475
worker 2: 430
total   : 1340
matches : true
```
