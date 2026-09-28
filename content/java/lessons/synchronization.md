A concert has 500 seats and four ticket windows open at once. Two clerks glance at the same board, both see "1 seat left", and both sell it. One fan now holds a ticket for a seat that belongs to someone else. Nobody made a typing error. The trouble came from two people reading and changing the same number at the same moment.

Java threads run into this constantly. The [Thread](/learning/java-tutorial/thread) topic warned that two threads doing `count++` on one variable can lose updates. In this guide you will see exactly why that happens, how the `synchronized` keyword fixes it, what the lock behind it really is, how static methods lock differently, where `volatile` fits, and what all this safety costs.

## What is Synchronization?

> **Definition:** Synchronization is the way Java lets only one thread at a time run a piece of code that touches shared data. A thread must hold an object's lock to enter a `synchronized` method or block, and every other thread that wants the same lock waits until it is released.

The code protected this way is called a critical section. Synchronization gives you two guarantees at once:

- **Mutual exclusion.** Only one thread runs the critical section for a given lock at a time.
- **Visibility.** When a thread releases a lock, everything it wrote becomes visible to the next thread that takes the same lock. Without this, a thread may keep reading a stale value from its CPU cache.

## Why is Synchronization used?

Threads share the heap. The moment two of them change the same object, the result depends on timing, and timing changes from run to run. This is called a race condition. A program with a race can pass a thousand tests and still fail on a busy production server.

Typical places that need synchronization:

- **Counters and totals** such as tickets sold, visitors counted or bytes downloaded.
- **Check-then-act logic** such as "if a seat is free, book it", where the check and the change must happen together.
- **Shared collections** such as an `ArrayList` or `HashMap` that several threads add to.
- **Objects with several related fields** such as a booking's seat count and its list of names, which must change together.

## Real-Life Example

Go back to the box office. The manager fixes the double-booking by putting the seat board inside a small room with one key. A clerk who wants to sell a seat must take the key, walk in, read the board, cross out a seat and walk out, returning the key. A clerk who arrives while the key is gone waits by the door.

Map it back to Java. The room is the critical section. The single key is the lock, also called the monitor, that every Java object carries. Taking the key is entering a `synchronized` block, and returning it is leaving the block. Because only one clerk is ever inside, no two clerks can read the same "1 seat left" and both act on it.

## Syntax

```java
class Counter {
    private int value;
    private final Object lock = new Object();

    synchronized void addOne() {     // locks this
        value++;
    }

    void addMany(int n) {
        synchronized (lock) {        // locks lock
            value += n;
        }
    }

    static synchronized void log() { // locks Counter.class
        // shared static work
    }
}
```

- A `synchronized` instance method locks the object it is called on, `this`, for the whole method.
- A `synchronized (lock)` block locks the object in brackets, and only for the lines inside the braces.
- A private final lock object keeps outside code from grabbing your lock by accident.
- A `static synchronized` method locks the `Class` object, here `Counter.class`, which is one lock shared by every instance.

## How Synchronization Works

Start with the problem. `count++` looks like one step, but the CPU does three: read the value, add one, write it back. Two threads can interleave those steps.

```text
 shared: sold = 7

 Thread A        Thread B
 --------        --------
 read 7
                 read 7
 7 + 1 = 8
                 7 + 1 = 8
 write 8
                 write 8
     |
     v
 sold = 8, expected 9
```

Each thread did its own work correctly, yet one sale vanished. This is the lost update. How often it happens depends on the scheduler, so an unsafe counter gives a different wrong total on different runs. The code that causes it looks perfectly innocent:

```java
class UnsafeCounter {
    private int sold;

    void sellOne() {
        sold++;   // read, add, write: not atomic
    }
}
```

Now the fix. Every object in Java has a built-in lock called its intrinsic lock or monitor. When a thread reaches `synchronized`, the JVM tries to give it that monitor.

```text
 T1 --> +--------------------+
        | monitor of counter |
        | owner: T1          |
 T2 --> | waiting: T2, T3    |
 T3 --> +--------------------+
            |
            | T1 leaves the block
            v
    lock is released, one
    waiting thread takes it
```

If no thread owns the monitor, the arriving thread takes it and runs. If another thread owns it, the arriving thread becomes BLOCKED and joins the waiting set. When the owner leaves the block, even by throwing an exception, the lock is released and one waiting thread gets it. The monitor is reentrant: a thread that already holds it can enter another `synchronized` method on the same object without blocking itself.

## Example Programs

### A synchronized ticket counter

```java
class TicketCounter {
    private int sold;

    synchronized void sellOne() {
        sold++;
    }

    synchronized int getSold() {
        return sold;
    }
}

public class BoxOffice {
    public static void main(String[] args)
            throws InterruptedException {
        TicketCounter counter = new TicketCounter();
        Thread[] windows = new Thread[4];

        for (int w = 0; w < windows.length; w++) {
            windows[w] = new Thread(() -> {
                for (int i = 0; i < 2500; i++) {
                    counter.sellOne();
                }
            });
            windows[w].start();
        }
        for (Thread t : windows) {
            t.join();
        }

        System.out.println("windows : " + windows.length);
        System.out.println("expected: " + 4 * 2500);
        System.out.println("sold    : " + counter.getSold());
    }
}
```

**Output:**

```text
windows : 4
expected: 10000
sold    : 10000
```

Four windows sell 2,500 tickets each. Because `sellOne()` is `synchronized`, no increment is lost, and the total is 10,000 on every run.

### Check-then-act inside a synchronized block

```java
class Show {
    private final Object seatLock = new Object();
    private int seatsLeft;
    private int booked;
    private int turnedAway;

    Show(int seats) {
        seatsLeft = seats;
    }

    void tryBook() {
        synchronized (seatLock) {
            if (seatsLeft > 0) {
                seatsLeft--;
                booked++;
            } else {
                turnedAway++;
            }
        }
    }

    String report() {
        synchronized (seatLock) {
            return "booked " + booked + ", turned away "
                    + turnedAway + ", left " + seatsLeft;
        }
    }
}

public class LastSeats {
    public static void main(String[] args)
            throws InterruptedException {
        Show show = new Show(50);
        Thread[] fans = new Thread[4];

        for (int f = 0; f < fans.length; f++) {
            fans[f] = new Thread(() -> {
                for (int i = 0; i < 20; i++) {
                    show.tryBook();
                }
            });
            fans[f].start();
        }
        for (Thread t : fans) {
            t.join();
        }

        System.out.println("requests: " + fans.length * 20);
        System.out.println(show.report());
    }
}
```

**Output:**

```text
requests: 80
booked 50, turned away 30, left 0
```

The seat check and the booking sit in one block, so two fans can never both see the last seat. Which fan got which seat changes between runs, but the totals do not, so only the totals are printed.

### Static synchronization for a shared total

```java
class Booth {
    private static int citySold;
    private int boothSold;

    synchronized void sell() {
        boothSold++;
        addToCity();
    }

    static synchronized void addToCity() {
        citySold++;
    }

    static synchronized int citySold() {
        return citySold;
    }

    synchronized int boothSold() {
        return boothSold;
    }
}

public class CityTotal {
    public static void main(String[] args)
            throws InterruptedException {
        Booth mall = new Booth();
        Booth station = new Booth();

        Thread a = new Thread(() -> {
            for (int i = 0; i < 3000; i++) mall.sell();
        });
        Thread b = new Thread(() -> {
            for (int i = 0; i < 3000; i++) mall.sell();
        });
        Thread c = new Thread(() -> {
            for (int i = 0; i < 4000; i++) station.sell();
        });

        a.start(); b.start(); c.start();
        a.join(); b.join(); c.join();

        System.out.println("mall booth    : " + mall.boothSold());
        System.out.println("station booth : "
                + station.boothSold());
        System.out.println("city total    : " + Booth.citySold());
    }
}
```

**Output:**

```text
mall booth    : 6000
station booth : 4000
city total    : 10000
```

The two booths have different instance locks, so locking `this` alone could not protect the static `citySold`. The `static synchronized` method locks `Booth.class`, one lock that all booths share.

## Synchronized Method vs Synchronized Block

| Point | Method | Block |
|---|---|---|
| Lock used | `this` or the class | Any object you name |
| Scope | Whole method body | Only the lines inside |
| Waiting time | Longer if the method is long | Short, only the risky lines |
| Lock privacy | Anyone can lock your object | Private lock object possible |
| Best for | Small methods | Check-then-act and fine control |

Start with a synchronized method when the whole method is the critical section. Switch to a block when only a few lines touch shared data or when you want a private lock.

## Common Mistakes

> **Warning:** `volatile` does not make `count++` safe. It only makes every read see the latest write. The read, add and write can still interleave, so use `synchronized` or an `AtomicInteger` for counters.

- **Locking different objects.** Two threads that synchronize on two different objects do not exclude each other. Everyone must use the same lock for the same data.
- **Synchronizing writes but not reads.** A reader without the lock may see a stale value. Guard both sides.
- **Holding a lock during slow work.** Printing, sleeping or network calls inside a lock make every other thread wait.
- **Locking on a String literal or a boxed number.** Pooled objects are shared across the whole program, so unrelated code may end up using your lock.

## Interview Questions

**What is a race condition?**
It is a bug where the result depends on the timing of two or more threads touching shared data. The classic case is two threads doing `count++` at the same time and losing one of the updates.

**What is the difference between a synchronized method and a synchronized block?**
A synchronized method locks `this`, or the class for a static method, for the whole body. A block locks an object you choose and only for the lines inside it, which keeps waiting shorter and allows a private lock.

**What lock does a static synchronized method use?**
It uses the `Class` object of its class, such as `Booth.class`. That lock is separate from every instance lock, so a static and an instance synchronized method can run at the same time.

**What is the difference between volatile and synchronized?**
`volatile` guarantees visibility: each read sees the most recent write. `synchronized` guarantees visibility and mutual exclusion, so it can also protect compound actions like read-modify-write.

**What does synchronization cost?**
Threads that want a busy lock must wait, which reduces parallel work, and taking locks adds some overhead of its own. Badly ordered locks can also cause deadlock, so keep critical sections small and lock in a consistent order.

## Summary

- Threads that change shared data without coordination create race conditions and lost updates.
- `count++` is three steps, read, add and write, so it is not atomic.
- Every object has an intrinsic lock, and `synchronized` lets one thread hold it at a time.
- Synchronized methods lock `this`; blocks lock any object you choose; static ones lock the class.
- Releasing a lock also publishes the thread's writes to the next thread that takes it.
- `volatile` gives visibility only, and every lock has a cost, so keep critical sections short.

## Related Topics

- [Thread](/learning/java-tutorial/thread): how threads start, run and are joined.
- [Deadlock](/learning/java-tutorial/deadlock): what happens when threads wait on each other's locks.
- [Executor Framework](/learning/java-tutorial/executor-framework): running many tasks on a pool of threads.
- [Thread Lifecycle](/learning/java-tutorial/thread-lifecycle): where the BLOCKED state fits among the others.
