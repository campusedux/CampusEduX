Try each problem on your own first, then compare with the solution. Run them on your machine with the H2 jar on the classpath.

### Easy: Building a Reorder List

A grocery store stocks Lentils (6), Soap (25), Flour (2) and Jam (9). Create a `stock` table in the in-memory H2 database `jdbc:h2:mem:reorder`, insert the four items with one `PreparedStatement` reused in a loop, then print every item with fewer than 10 units, sorted by name.

Expected output:

```text
Reorder:
- Flour (2 left)
- Jam (9 left)
- Lentils (6 left)
```

> **Hint:** Prepare `INSERT INTO stock VALUES (?, ?)` once and call the setters plus `executeUpdate()` for each item. For the report, bind the limit 10 to a `?` and add `ORDER BY item`.

**Answer:** One prepared insert is parsed once and reused with new values each time. The query takes the limit as a parameter, and `ORDER BY` makes the row order fixed.

```java
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

public class ReorderList {
    public static void main(String[] args) throws SQLException {
        String[] items = {"Lentils", "Soap", "Flour", "Jam"};
        int[] qty = {6, 25, 2, 9};

        try (Connection con = DriverManager.getConnection(
                "jdbc:h2:mem:reorder")) {
            try (Statement st = con.createStatement()) {
                st.executeUpdate("CREATE TABLE stock ("
                        + "item VARCHAR(20), qty INT)");
            }

            String insert = "INSERT INTO stock VALUES (?, ?)";
            try (PreparedStatement ps = con.prepareStatement(insert)) {
                for (int i = 0; i < items.length; i++) {
                    ps.setString(1, items[i]);
                    ps.setInt(2, qty[i]);
                    ps.executeUpdate();
                }
            }

            String low = "SELECT item, qty FROM stock "
                    + "WHERE qty < ? ORDER BY item";
            try (PreparedStatement ps = con.prepareStatement(low)) {
                ps.setInt(1, 10);
                try (ResultSet rs = ps.executeQuery()) {
                    System.out.println("Reorder:");
                    while (rs.next()) {
                        System.out.println("- " + rs.getString("item")
                                + " (" + rs.getInt("qty") + " left)");
                    }
                }
            }
        }
    }
}
```

**Output:**

```text
Reorder:
- Flour (2 left)
- Jam (9 left)
- Lentils (6 left)
```

### Medium: Repricing an Aisle

Load five products into `jdbc:h2:mem:aisles` in one batch: Milk (dairy, 30 units, Rs 28), Curd (dairy, 12, Rs 40), Apples (fruit, 50, Rs 9), Bananas (fruit, 80, Rs 4) and Paneer (dairy, 6, Rs 90). Then raise every dairy price by Rs 2 and print how many rows changed. Finally print the stock value, quantity times price, of each aisle in alphabetical order.

Expected output:

```text
batch rows: 5
repriced  : 3
dairy worth : Rs 1956
fruit worth : Rs 770
```

> **Hint:** Call `addBatch()` after setting each row's values and `executeBatch()` once at the end. `executeUpdate()` on the price change returns the number of rows it touched, and `SUM(qty * price)` with `GROUP BY aisle` does the totals.

**Answer:** Batching sends all five inserts in one round trip. The update's return value confirms exactly three dairy rows changed, and the grouped query lets the database do the arithmetic instead of a Java loop.

```java
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

public class AisleReport {
    public static void main(String[] args) throws SQLException {
        Object[][] rows = {
            {"Milk", "dairy", 30, 28},
            {"Curd", "dairy", 12, 40},
            {"Apples", "fruit", 50, 9},
            {"Bananas", "fruit", 80, 4},
            {"Paneer", "dairy", 6, 90}
        };
        try (Connection con = DriverManager.getConnection(
                "jdbc:h2:mem:aisles")) {
            try (Statement st = con.createStatement()) {
                st.executeUpdate("CREATE TABLE stock ("
                        + "item VARCHAR(20), aisle VARCHAR(10), "
                        + "qty INT, price INT)");
            }

            String insert = "INSERT INTO stock VALUES (?, ?, ?, ?)";
            try (PreparedStatement ps = con.prepareStatement(insert)) {
                for (Object[] r : rows) {
                    ps.setString(1, (String) r[0]);
                    ps.setString(2, (String) r[1]);
                    ps.setInt(3, (Integer) r[2]);
                    ps.setInt(4, (Integer) r[3]);
                    ps.addBatch();
                }
                int[] counts = ps.executeBatch();
                System.out.println("batch rows: " + counts.length);
            }

            String raise = "UPDATE stock SET price = price + ? "
                    + "WHERE aisle = ?";
            try (PreparedStatement ps = con.prepareStatement(raise)) {
                ps.setInt(1, 2);
                ps.setString(2, "dairy");
                System.out.println("repriced  : "
                        + ps.executeUpdate());
            }

            String sum = "SELECT aisle, SUM(qty * price) AS worth "
                    + "FROM stock GROUP BY aisle ORDER BY aisle";
            try (Statement st = con.createStatement();
                 ResultSet rs = st.executeQuery(sum)) {
                while (rs.next()) {
                    System.out.println(rs.getString("aisle")
                            + " worth : Rs " + rs.getLong("worth"));
                }
            }
        }
    }
}
```

**Output:**

```text
batch rows: 5
repriced  : 3
dairy worth : Rs 1956
fruit worth : Rs 770
```
