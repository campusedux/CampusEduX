Try each problem on your own first, then compare with the solution.

### Easy: Hotel Room Tariff

A hotel has a `Room` class whose `tariff(int nights)` charges Rs 2000 per night. A `DeluxeRoom` charges Rs 3500 per night, and a `Suite` charges Rs 6000 per night plus a flat Rs 1000 butler fee. Override `tariff` in both subclasses. Store one of each in a `Room[]` array and print the bill for 2 nights using a single loop.

Expected output:

```text
Room: Rs 4000
DeluxeRoom: Rs 7000
Suite: Rs 13000
```

> **Hint:** Mark each child method with `@Override`. Use `getClass().getSimpleName()` to print the room type, and let runtime dispatch choose the right `tariff`.

**Answer:** The array is typed as `Room`, but each object runs its own overridden `tariff` at runtime.

```java
class Room {
    int tariff(int nights) {
        return nights * 2000;
    }
}

class DeluxeRoom extends Room {
    @Override
    int tariff(int nights) {
        return nights * 3500;
    }
}

class Suite extends Room {
    @Override
    int tariff(int nights) {
        return nights * 6000 + 1000;
    }
}

public class HotelDesk {
    public static void main(String[] args) {
        Room[] rooms = { new Room(), new DeluxeRoom(), new Suite() };
        for (Room r : rooms) {
            System.out.println(r.getClass().getSimpleName()
                + ": Rs " + r.tariff(2));
        }
    }
}
```

**Output:**

```text
Room: Rs 4000
DeluxeRoom: Rs 7000
Suite: Rs 13000
```

### Medium: Smart Home Status

A smart home app has a `Device` class with a name, a `status()` method that returns `"<name>: online"`, and a `copy()` method that returns a new `Device`. A `Thermostat` extends it with a target temperature. Override `status()` so it reuses the parent text and adds `, set to 24C`. Also override `copy()` so it returns a `Thermostat` (a covariant return), letting `main` call a thermostat-only method on the copy without a cast. Print the status of a plain lamp, the thermostat, and the thermostat's copy after raising its target by 2.

Expected output:

```text
Lamp: online
Thermostat: online, set to 24C
Thermostat: online, set to 26C
```

> **Hint:** Start the child `status()` with `super.status()`. Declare the child `copy()` with the return type `Thermostat`, which is allowed because it is a subtype of `Device`.

**Answer:** `super.status()` reuses the parent text, and the covariant `copy()` returns the child type directly.

```java
class Device {
    protected final String name;

    Device(String name) {
        this.name = name;
    }

    String status() {
        return name + ": online";
    }

    Device copy() {
        return new Device(name);
    }
}

class Thermostat extends Device {
    private int target;

    Thermostat(String name, int target) {
        super(name);
        this.target = target;
    }

    void raise(int by) {
        target += by;
    }

    @Override
    String status() {
        return super.status() + ", set to " + target + "C";
    }

    @Override
    Thermostat copy() {
        return new Thermostat(name, target);
    }
}

public class SmartHome {
    public static void main(String[] args) {
        Device lamp = new Device("Lamp");
        Thermostat hall = new Thermostat("Thermostat", 24);
        Thermostat spare = hall.copy();
        spare.raise(2);
        System.out.println(lamp.status());
        System.out.println(hall.status());
        System.out.println(spare.status());
    }
}
```

**Output:**

```text
Lamp: online
Thermostat: online, set to 24C
Thermostat: online, set to 26C
```
