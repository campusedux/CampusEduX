Drive up to a highway toll plaza on a holiday weekend. If there were only one booth, every car would wait behind every other car, and the queue would stretch for kilometres. Instead the plaza opens several lanes. Each booth serves its own line of cars at the same time, and at the end of the day the manager adds up the takings from every booth.

A Java program can work the same way. By default it has one line of work, but it can open more. Each line of work is called a thread. In this guide you will see what a thread is, meet the main thread every program starts with, create threads in two ways, learn why `start()` and `run()` behave so differently, follow a thread through its lifecycle, and use `join()` to wait for results.

## What is a Thread?

> **Definition:** A thread is a single path of execution inside a program. It has its own call stack and runs its statements one after another, while sharing the program's heap memory with the other threads of the same process.

When you run `java` on a class, the JVM creates one thread named `main` and calls your `main` method on it. Everything you have written so far ran on that single thread. The class `java.lang.Thread` represents a thread, and you can create more of them.

Threads are lighter than separate programs. They share objects on the heap, so they can pass data to each other cheaply. That sharing is powerful, and it is also the reason multithreaded code needs care.

## Why is Thread used?

- **Doing several jobs at once.** A download can continue while the screen stays responsive.
- **Using every CPU core.** A modern laptop has many cores. A single thread uses only one of them at a time.
- **Not waiting idle.** While one thread waits for a slow network or disk, another can keep working.
- **Splitting big work.** A large calculation can be cut into pieces, one per thread, and the results combined.
- **Serving many users.** Servers often handle each request on its own thread, so one slow user does not block the rest.

## Real-Life Example

The toll plaza maps onto Java neatly. The plaza is the process. Each booth with its own queue is a thread with its own call stack. The shared cash room behind the booths is the heap, which every booth can reach.

The plaza manager is the main thread. She opens the booths (starts the threads). Near closing time she waits at each booth until its last car has passed, then collects that booth's total. Waiting like that is `join()`. Only after every booth has finished does she write the plaza total in the daily report. If she wrote the report before waiting, she would miss money that was still being counted.

## Syntax

```java
// way 1: extend Thread and override run()
class Lane extends Thread {
    @Override
    public void run() {
        // work for this thread
    }
}
Lane lane = new Lane();
lane.start();

// way 2: pass a Runnable to a Thread
Runnable job = () -> { /* work */ };
Thread worker = new Thread(job, "worker-1");
worker.start();
worker.join();   // wait until it finishes
```

- A subclass of `Thread` puts its work in `run()`.
- `start()` asks the JVM to create a new thread, which then calls `run()` on its own stack.
- A `Runnable` is just the task. You hand it to a `Thread` object, often as a lambda.
- The second constructor argument gives the thread a readable name.
- `join()` makes the current thread wait until the other one ends. It throws the checked `InterruptedException`.

## How Threads Work

Every thread moves through a small set of states, available from `getState()`.

```text
         +-------+
         |  NEW  |
         +-------+
             |
             | start()
             v
       +----------+
       | RUNNABLE |<------+
       +----------+       |
         |      |         |
         |      | busy lock,
         |      | join(), wait()
         |      v         |
         |   +---------+  |
         |   | BLOCKED |  |
         |   | WAITING |--+
         |   +---------+ lock free
         |               or signal
         | run() ends
         v
   +------------+
   | TERMINATED |
   +------------+
```

A thread object that has not been started is NEW. After `start()` it becomes RUNNABLE, which means it is running or ready to run whenever the operating system gives it a core. If it tries to enter a `synchronized` block whose lock another thread holds, it becomes BLOCKED. If it calls `join()`, `wait()` or waits on a latch, it becomes WAITING (or TIMED_WAITING with a time limit). When the lock is released or the signal arrives, it returns to RUNNABLE. When `run()` finishes, the thread is TERMINATED and can never be started again.

The operating system decides which runnable thread gets a core and for how long. That is why the exact order of work between threads is not fixed, and why our programs collect results first and print only after `join()`.

## Example Programs

### Extending Thread and joining

```java
class TollLane extends Thread {
    private final int[] fees;
    private int total;

    TollLane(String name, int[] fees) {
        super(name);
        this.fees = fees;
    }

    @Override
    public void run() {
        for (int fee : fees) {
            total += fee;
        }
    }

    int getTotal() {
        return total;
    }
}

public class TollLanes {
    public static void main(String[] args)
            throws InterruptedException {
        System.out.println("started by: "
                + Thread.currentThread().getName());

        TollLane north = new TollLane("north", new int[] {60, 60, 95});
        TollLane south = new TollLane("south", new int[] {95, 150});

        north.start();
        south.start();
        north.join();
        south.join();

        System.out.println(north.getName() + " lane: "
                + north.getTotal());
        System.out.println(south.getName() + " lane: "
                + south.getTotal());
        System.out.println("plaza total: "
                + (north.getTotal() + south.getTotal()));
    }
}
```

**Output:**

```text
started by: main
north lane: 215
south lane: 245
plaza total: 460
```

Both lanes add their fees at the same time, but `main` prints nothing about them until both `join()` calls return. The joins also guarantee that `main` sees the finished totals.

### start() versus run() with a Runnable

```java
public class StartVsRun {
    static String[] seenBy = new String[2];

    public static void main(String[] args)
            throws InterruptedException {
        Runnable first = () -> seenBy[0] =
                Thread.currentThread().getName();
        Runnable second = () -> seenBy[1] =
                Thread.currentThread().getName();

        Thread direct = new Thread(first, "booth-A");
        Thread real = new Thread(second, "booth-B");

        direct.run();
        real.start();
        real.join();

        System.out.println("run()   ran on: " + seenBy[0]);
        System.out.println("start() ran on: " + seenBy[1]);
        System.out.println("booth-A state : " + direct.getState());
    }
}
```

**Output:**

```text
run()   ran on: main
start() ran on: booth-B
booth-A state : NEW
```

Calling `run()` directly is an ordinary method call, so the task ran on `main` and booth-A was never started. Only `start()` created a new thread.

### Watching the lifecycle states

```java
import java.util.concurrent.CountDownLatch;

public class BoothStates {
    static final Object barrier = new Object();
    static final CountDownLatch greenLight = new CountDownLatch(1);
    static Thread.State selfSeen;

    static void waitFor(Thread t, Thread.State s)
            throws InterruptedException {
        while (t.getState() != s) {
            Thread.sleep(1);
        }
    }

    public static void main(String[] args)
            throws InterruptedException {
        Thread car = new Thread(() -> {
            selfSeen = Thread.currentThread().getState();
            synchronized (barrier) {
                // the barrier is up until main lets go
            }
            try {
                greenLight.await();
            } catch (InterruptedException e) {
                return;
            }
        }, "car");

        System.out.println("before start : " + car.getState());
        synchronized (barrier) {
            car.start();
            waitFor(car, Thread.State.BLOCKED);
            System.out.println("at barrier   : " + car.getState());
        }
        waitFor(car, Thread.State.WAITING);
        System.out.println("at red light : " + car.getState());
        greenLight.countDown();
        car.join();
        System.out.println("after join   : " + car.getState());
        System.out.println("inside run() : " + selfSeen);
    }
}
```

**Output:**

```text
before start : NEW
at barrier   : BLOCKED
at red light : WAITING
after join   : TERMINATED
inside run() : RUNNABLE
```

`main` holds the barrier lock, so the car thread is BLOCKED. Once the lock is free, the car waits on the latch and is WAITING until `countDown()`. A thread that checks its own state always sees RUNNABLE, because it must be running to ask.

## Extending Thread vs Implementing Runnable

| Point | extends Thread | implements Runnable |
|---|---|---|
| Inheritance | Uses up your one superclass | Class can still extend another |
| What it models | The worker itself | Only the task |
| Reuse | One object, one run | One task, many threads or pools |
| Lambda support | No | Yes, it is a functional interface |
| Executor support | Awkward | Works directly |
| Typical use | Tiny demos | Real applications |

Prefer `Runnable`. It keeps the task separate from the machinery that runs it, and the same task can later move to a thread pool unchanged.

## Common Mistakes

> **Warning:** Calling `run()` instead of `start()` does not create a thread. The code simply runs on the current thread, one step after another, and your program silently loses all its parallelism.

- **Starting a thread twice.** A second `start()` on the same object throws `IllegalThreadStateException`. Create a new `Thread` instead.
- **Reading results without `join()`.** The worker may not have finished, and `main` may not even see its latest values.
- **Printing from many threads at once.** The lines interleave differently on every run. Collect results and print from one place.
- **Sharing a counter without protection.** Two threads doing `count++` on the same variable can lose updates. Give each thread its own slot or use synchronization.
- **Ignoring `InterruptedException`.** Swallowing it hides a request to stop. Return or restore the interrupt flag.

## Interview Questions

**What is the difference between a process and a thread?**
A process is a running program with its own memory space. A thread is a path of execution inside a process; threads of one process share the heap but each has its own stack. Creating and switching threads is cheaper than doing the same with processes.

**What is the difference between `start()` and `run()`?**
`start()` asks the JVM to create a new thread, which then calls `run()`. Calling `run()` directly is a normal method call on the current thread, so no new thread is created.

**Which is better, extending Thread or implementing Runnable?**
Implementing `Runnable` is usually better. The class stays free to extend something else, the task is separated from the thread, and it works with lambdas and executor thread pools.

**What does `join()` do?**
It makes the calling thread wait until the target thread terminates. It also guarantees that everything the finished thread wrote to memory is visible to the thread that joined.

**What are the states of a Java thread?**
`Thread.State` has six values: NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING and TERMINATED. A thread moves from NEW to RUNNABLE on `start()`, can pause in the blocked or waiting states, and ends in TERMINATED.

## Summary

- A thread is a path of execution with its own stack, sharing the heap with other threads.
- Every program begins on the thread named `main`.
- Create a thread by extending `Thread` or, better, by passing a `Runnable` to a `Thread`.
- `start()` creates a new thread; calling `run()` directly does not.
- Threads move through NEW, RUNNABLE, BLOCKED or WAITING, and TERMINATED.
- Use `join()` before reading a worker's results, and print from one thread for predictable output.

## Related Topics

- [Runnable](/learning/java-tutorial/runnable): the task interface behind most real threads.
- [Thread Lifecycle](/learning/java-tutorial/thread-lifecycle): every state and transition in more detail.
- [Thread Methods](/learning/java-tutorial/thread-methods): `sleep`, `join`, `interrupt` and friends.
- [Synchronization](/learning/java-tutorial/synchronization): keeping shared data safe between threads.
