Try each problem on your own first, then compare with the solution.

### Easy: Parking Fee Calculator

A parking lot charges Rs 30 per hour. Write a `ParkingMeter` class with three overloaded `fee` methods: `fee(int hours)`, `fee(int hours, boolean electric)` that gives electric cars 20 percent off, and `fee(int hours, String pass)` that makes the stay free for the pass `"MONTHLY"`. Call each one for 4 hours (electric `true`, pass `"MONTHLY"`).

Expected output:

```text
Regular: Rs 120
Electric: Rs 96
Pass MONTHLY: Rs 0
```

> **Hint:** All three methods share the name `fee`. The compiler tells them apart by the second parameter's type.

**Answer:** This is compile-time polymorphism: the argument types decide which overload runs, and the two special versions reuse the basic `fee(int)`.

```java
class ParkingMeter {
    int fee(int hours) {
        return hours * 30;
    }

    int fee(int hours, boolean electric) {
        int base = fee(hours);
        return electric ? base * 80 / 100 : base;
    }

    int fee(int hours, String pass) {
        return pass.equals("MONTHLY") ? 0 : fee(hours);
    }
}

public class ParkingGate {
    public static void main(String[] args) {
        ParkingMeter meter = new ParkingMeter();
        System.out.println("Regular: Rs " + meter.fee(4));
        System.out.println("Electric: Rs " + meter.fee(4, true));
        System.out.println("Pass MONTHLY: Rs "
                + meter.fee(4, "MONTHLY"));
    }
}
```

**Output:**

```text
Regular: Rs 120
Electric: Rs 96
Pass MONTHLY: Rs 0
```

### Medium: Notification Channels

An app sends alerts through several channels. Create a parent class `Notifier` with a method `int send(String msg)` that returns the cost in paise. `SmsNotifier` costs 25 paise per started block of 20 characters and prints `SMS: <msg>`. `EmailNotifier` always costs 2 and prints `Email: <msg>`. `PushNotifier` costs nothing and prints `Push: <msg>`. Store one of each in a `Notifier[]`, send `"Order shipped"` through all of them, and print the total cost.

Expected output:

```text
SMS: Order shipped
Email: Order shipped
Push: Order shipped
Total cost: 27 paise
```

> **Hint:** Blocks of 20 characters can be computed with `(len + 19) / 20`. The loop should call `send` without knowing the real class.

**Answer:** Each subclass overrides `send`, and dynamic method dispatch runs the right one for every element of the parent-type array, so the total is 25 + 2 + 0.

```java
class Notifier {
    int send(String msg) {
        System.out.println("Log: " + msg);
        return 0;
    }
}

class SmsNotifier extends Notifier {
    @Override
    int send(String msg) {
        System.out.println("SMS: " + msg);
        int blocks = (msg.length() + 19) / 20;
        return blocks * 25;
    }
}

class EmailNotifier extends Notifier {
    @Override
    int send(String msg) {
        System.out.println("Email: " + msg);
        return 2;
    }
}

class PushNotifier extends Notifier {
    @Override
    int send(String msg) {
        System.out.println("Push: " + msg);
        return 0;
    }
}

public class AlertCenter {
    public static void main(String[] args) {
        Notifier[] channels = {
            new SmsNotifier(), new EmailNotifier(), new PushNotifier()
        };
        int total = 0;
        for (Notifier n : channels) {
            total += n.send("Order shipped");
        }
        System.out.println("Total cost: " + total + " paise");
    }
}
```

**Output:**

```text
SMS: Order shipped
Email: Order shipped
Push: Order shipped
Total cost: 27 paise
```
