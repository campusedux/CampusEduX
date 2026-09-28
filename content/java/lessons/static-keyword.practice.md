Try each problem on your own first, then compare with the solution.

### Easy: Museum Visitor Counter

A museum hands a numbered pass to each visitor. Write a class `VisitorPass` with an instance field `visitor` and a pass number, plus a static counter that starts at 1 and a static method `issued()` that returns how many passes exist. Issue passes to Meera, Kabir and Tara, print each pass, then print the total.

Expected output:

```text
Pass 1: Meera
Pass 2: Kabir
Pass 3: Tara
Passes issued: 3
```

> **Hint:** Read the static counter inside the constructor to give the new pass its number, then increase it. `issued()` can return the counter minus one.

**Answer:** The counter is static, so every pass sees and updates the same value, while each pass keeps its own number.

```java
class VisitorPass {
    private static int nextNumber = 1;

    private final String visitor;
    private final int number;

    VisitorPass(String visitor) {
        this.visitor = visitor;
        this.number = nextNumber;
        nextNumber++;
    }

    static int issued() {
        return nextNumber - 1;
    }

    void show() {
        System.out.println("Pass " + number + ": " + visitor);
    }
}

public class MuseumGate {
    public static void main(String[] args) {
        String[] names = { "Meera", "Kabir", "Tara" };
        for (String n : names) {
            new VisitorPass(n).show();
        }
        System.out.println("Passes issued: "
            + VisitorPass.issued());
    }
}
```

**Output:**

```text
Pass 1: Meera
Pass 2: Kabir
Pass 3: Tara
Passes issued: 3
```

### Medium: Hottest Weather Station

A region has several weather stations. Each `WeatherStation` object has a name and records temperatures with `record(double t)`. Across all stations, keep one shared record of the highest temperature seen and which station saw it. Use a static block to set the starting record to -100 and print `Record table ready`. Record 31.5 and 34.0 at Hilltop, and 36.5 and 33.0 at Riverside, then print the regional record with a static method.

Expected output:

```text
Record table ready
Record: 36.5 at Riverside
Hilltop max: 34.0
```

> **Hint:** Use two static fields for the regional record and one instance field for each station's own maximum. The static block runs the first time the class is used, before any station is built.

**Answer:** The regional record is shared, so it must be static; each station's own maximum is instance data.

```java
class WeatherStation {
    private static double recordTemp;
    private static String recordPlace;

    static {
        recordTemp = -100;
        recordPlace = "none";
        System.out.println("Record table ready");
    }

    private final String name;
    private double ownMax = -100;

    WeatherStation(String name) {
        this.name = name;
    }

    void record(double t) {
        if (t > ownMax) {
            ownMax = t;
        }
        if (t > recordTemp) {
            recordTemp = t;
            recordPlace = name;
        }
    }

    double ownMax() {
        return ownMax;
    }

    static String regionalRecord() {
        return recordTemp + " at " + recordPlace;
    }
}

public class RegionWeather {
    public static void main(String[] args) {
        WeatherStation hill = new WeatherStation("Hilltop");
        WeatherStation river = new WeatherStation("Riverside");
        hill.record(31.5);
        hill.record(34.0);
        river.record(36.5);
        river.record(33.0);
        System.out.println("Record: "
            + WeatherStation.regionalRecord());
        System.out.println("Hilltop max: " + hill.ownMax());
    }
}
```

**Output:**

```text
Record table ready
Record: 36.5 at Riverside
Hilltop max: 34.0
```
