A neighbourhood grocery store keeps its stock in a database: how many bags of rice are left, what a jar of honey costs, which items need reordering. The billing counter is a Java program. Every time the cashier scans an item, that program has to ask the database a question and sometimes change an answer. Java needs a standard way to have that conversation, whichever database the store happens to use.

That standard is JDBC. In this guide you will follow the full path from opening a connection to reading rows, see why `PreparedStatement` beats plain `Statement` and how it blocks SQL injection, learn when to call `executeQuery` and when `executeUpdate`, close everything safely with try-with-resources, and group changes into a transaction that either fully succeeds or fully rolls back.

## What is JDBC?

> **Definition:** JDBC (Java Database Connectivity) is the standard Java API, in the `java.sql` package, for connecting to a relational database, sending SQL statements and reading the results. Each database vendor supplies a driver that implements the API for its own product.

The pieces you will use most:

- `DriverManager` finds a suitable driver and opens connections.
- `Connection` is one open session with the database.
- `Statement` runs a fixed SQL string.
- `PreparedStatement` runs precompiled SQL with `?` placeholders for values.
- `ResultSet` is a cursor over the rows a query returned.
- `SQLException` is the checked exception every database error arrives as.

## Why is JDBC used?

Nearly every real application stores its data in a database, and every database has its own network protocol. Writing that protocol code yourself for MySQL, then again for PostgreSQL and again for Oracle, would be enormous work.

JDBC puts one set of interfaces in front of all of them. Your code talks only to `Connection`, `PreparedStatement` and `ResultSet`. The driver jar translates those calls into the right protocol. Switching databases then means changing a URL and a jar, while the Java code stays almost the same.

JDBC is also the foundation under higher-level tools. Hibernate, JPA and Spring's `JdbcTemplate` all use JDBC underneath, so understanding it helps you debug them when something goes wrong.

## Real-Life Example

Think of the store manager phoning the wholesale supplier. First she dials the number and the call connects: that is `DriverManager.getConnection`, and the open line is the `Connection`. She reads out an order from a printed form with blanks for item and quantity: that form is a `PreparedStatement`, and filling the blanks is calling `setString` and `setInt`. The supplier reads back the price list line by line while she notes each one: that is walking a `ResultSet` with `next()`.

The interpreter who converts her words into the supplier's jargon is the driver. When she is done, she hangs up, which is closing the connection. If she orders sugar and payment for it together, and the payment fails, she cancels the sugar too, and that is a rollback.

## Syntax

```java
String url = "jdbc:h2:mem:store";
try (Connection con = DriverManager.getConnection(url);
     PreparedStatement ps = con.prepareStatement(
             "SELECT qty FROM stock WHERE item = ?")) {
    ps.setString(1, "Rice");
    try (ResultSet rs = ps.executeQuery()) {
        while (rs.next()) {
            int qty = rs.getInt("qty");
        }
    }
}
```

- The URL names the driver and the database. `jdbc:h2:mem:store` is an H2 database kept in memory.
- `getConnection` opens the session. Since JDBC 4, drivers register themselves, so `Class.forName` is no longer needed.
- `prepareStatement` sends the SQL with a `?` for each value to be filled in.
- `setString(1, ...)` fills the first `?`. Parameter positions start at 1, not 0.
- `executeQuery` runs a `SELECT` and returns a `ResultSet`.
- `rs.next()` moves to the next row and returns `false` when the rows run out.
- try-with-resources closes the result set, statement and connection, in reverse order, even when an exception is thrown.

## How JDBC Works

Every JDBC program follows the same chain of objects.

```text
 your code
     |
     v
 DriverManager
 .getConnection(url)
     |  picks the driver
     v
 Connection  (session)
     |
     v
 PreparedStatement
     |
     +--> executeUpdate()
     |    INSERT / UPDATE
     |    returns a row count
     |
     +--> executeQuery()
          SELECT
             |
             v
         ResultSet
         next() row by row
```

`DriverManager` looks at the URL prefix, such as `jdbc:h2:` or `jdbc:mysql:`, and asks each registered driver whether it accepts that URL. The matching driver opens a `Connection`. From it you create statements. A statement that changes data is run with `executeUpdate`, which returns how many rows changed. A `SELECT` is run with `executeQuery`, which returns a `ResultSet` whose cursor starts before the first row. Each object holds real resources, such as a network socket or a database cursor, so each must be closed.

> **Note:** The site's online compiler has no database driver, so these programs will not run there. Run them on your own machine with the H2 jar on the classpath, as shown below (on Windows, use `;` instead of `:`). For MySQL or PostgreSQL only the URL and the driver jar change.

```bash
javac GroceryShelf.java
java -cp .:h2-2.4.240.jar GroceryShelf
```

## Example Programs

### Creating, filling and reading a table

```java
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

public class GroceryShelf {
    public static void main(String[] args) throws SQLException {
        String url = "jdbc:h2:mem:shelf";
        try (Connection con = DriverManager.getConnection(url);
             Statement st = con.createStatement()) {

            st.executeUpdate("CREATE TABLE stock ("
                    + "item VARCHAR(30) PRIMARY KEY, "
                    + "qty INT, price INT)");

            int added = st.executeUpdate(
                    "INSERT INTO stock VALUES "
                    + "('Rice 5kg', 12, 410), "
                    + "('Tea 250g', 30, 145), "
                    + "('Ghee 1L', 4, 620)");
            System.out.println("rows inserted: " + added);

            try (ResultSet rs = st.executeQuery(
                    "SELECT item, qty, price FROM stock "
                    + "ORDER BY price DESC")) {
                while (rs.next()) {
                    System.out.println(rs.getString("item")
                            + " | qty " + rs.getInt("qty")
                            + " | Rs " + rs.getInt("price"));
                }
            }
        }
    }
}
```

**Output:**

```text
rows inserted: 3
Ghee 1L | qty 4 | Rs 620
Rice 5kg | qty 12 | Rs 410
Tea 250g | qty 30 | Rs 145
```

`executeUpdate` returned 3 because one `INSERT` added three rows. The query reads columns by name, and `ORDER BY` fixes the row order, which a database otherwise does not promise.

### Statement vs PreparedStatement against injection

```java
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

public class ItemSearch {
    static int countRows(ResultSet rs) throws SQLException {
        int n = 0;
        while (rs.next()) n++;
        return n;
    }

    public static void main(String[] args) throws SQLException {
        try (Connection con = DriverManager.getConnection(
                "jdbc:h2:mem:search")) {
            try (Statement st = con.createStatement()) {
                st.executeUpdate("CREATE TABLE stock ("
                        + "item VARCHAR(30), qty INT)");
                st.executeUpdate("INSERT INTO stock VALUES "
                        + "('Oats', 9), ('Honey', 3), "
                        + "('Salt', 40)");
            }

            String typed = "x' OR '1'='1";

            String sql = "SELECT * FROM stock WHERE item = '"
                    + typed + "'";
            try (Statement st = con.createStatement();
                 ResultSet rs = st.executeQuery(sql)) {
                System.out.println("Statement rows        : "
                        + countRows(rs));
            }

            String safe = "SELECT * FROM stock WHERE item = ?";
            try (PreparedStatement ps = con.prepareStatement(safe)) {
                ps.setString(1, typed);
                try (ResultSet rs = ps.executeQuery()) {
                    System.out.println("PreparedStatement rows: "
                            + countRows(rs));
                }
                ps.setString(1, "Honey");
                try (ResultSet rs = ps.executeQuery()) {
                    rs.next();
                    System.out.println("Honey in stock        : "
                            + rs.getInt("qty"));
                }
            }
        }
    }
}
```

**Output:**

```text
Statement rows        : 3
PreparedStatement rows: 0
Honey in stock        : 3
```

Glued into the SQL string, the typed text turned the condition into "item is x or 1 equals 1", so every row came back. The `PreparedStatement` treated the same text as a plain value, found no item with that odd name, and was then reused for a real search.

### A transaction with commit and rollback

```java
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

public class StockTransfer {
    static void move(Connection con, String item, int n)
            throws SQLException {
        String add = "UPDATE store SET qty = qty + ? "
                + "WHERE place = 'shelf' AND item = ?";
        String take = "UPDATE store SET qty = qty - ? "
                + "WHERE place = 'godown' AND item = ?";
        try (PreparedStatement toShelf = con.prepareStatement(add);
             PreparedStatement fromGodown =
                     con.prepareStatement(take)) {
            toShelf.setInt(1, n);
            toShelf.setString(2, item);
            toShelf.executeUpdate();
            fromGodown.setInt(1, n);
            fromGodown.setString(2, item);
            fromGodown.executeUpdate();
        }
    }

    static void show(Connection con) throws SQLException {
        try (Statement st = con.createStatement();
             ResultSet rs = st.executeQuery(
                     "SELECT place, qty FROM store ORDER BY place")) {
            while (rs.next()) {
                System.out.println("  " + rs.getString(1)
                        + ": " + rs.getInt(2));
            }
        }
    }

    static void transfer(Connection con, int n) {
        try {
            move(con, "Sugar", n);
            con.commit();
            System.out.println("move " + n + ": committed");
        } catch (SQLException e) {
            try {
                con.rollback();
            } catch (SQLException ignored) {
                // nothing more to undo
            }
            System.out.println("move " + n + ": rolled back");
        }
    }

    public static void main(String[] args) throws SQLException {
        try (Connection con = DriverManager.getConnection(
                "jdbc:h2:mem:godown")) {
            try (Statement st = con.createStatement()) {
                st.executeUpdate("CREATE TABLE store ("
                        + "place VARCHAR(10), item VARCHAR(20), "
                        + "qty INT CHECK (qty >= 0))");
                st.executeUpdate("INSERT INTO store VALUES "
                        + "('godown', 'Sugar', 50), "
                        + "('shelf', 'Sugar', 5)");
            }
            con.setAutoCommit(false);

            transfer(con, 20);
            show(con);
            transfer(con, 40);
            show(con);
        }
    }
}
```

**Output:**

```text
move 20: committed
  godown: 30
  shelf: 25
move 40: rolled back
  godown: 30
  shelf: 25
```

The second move had already added 40 to the shelf when the godown update broke the `CHECK (qty >= 0)` rule. `rollback()` undid that half-finished change, so no sugar appeared out of thin air.

## Statement vs PreparedStatement

| Point | Statement | PreparedStatement |
|---|---|---|
| SQL text | Built by joining strings | Fixed, with `?` placeholders |
| Values | Pasted into the SQL | Sent separately with setters |
| SQL injection | Possible | Prevented |
| Reuse | SQL parsed on every run | Parsed once, run many times |
| Batching | Only of fixed SQL strings | `addBatch` with new values |
| Best for | Fixed DDL like `CREATE TABLE` | Any SQL that uses input |

Use `PreparedStatement` whenever a value comes from a user, a file or another system. Plain `Statement` is fine for fixed SQL with no outside values.

## Common Mistakes

> **Warning:** Never build SQL by joining user input into a string. One quote character in the input can rewrite your query, as the injection example showed. Always pass values through `PreparedStatement` setters.

- **Forgetting to close resources.** Unclosed connections pile up until the database refuses new ones. Use try-with-resources.
- **Reading a row before calling `next()`.** A fresh `ResultSet` points before the first row, so reading it at once throws `SQLException`.
- **Counting parameters from 0.** JDBC positions start at 1, for both `?` placeholders and column numbers.
- **Leaving auto-commit on for multi-step changes.** Each statement then commits alone, so a failure halfway leaves the data half-changed.

## Interview Questions

**What are the main steps of a JDBC program?**
Open a `Connection` with `DriverManager.getConnection`, create a `Statement` or `PreparedStatement`, execute it, read any `ResultSet`, and close everything. Try-with-resources handles the closing step.

**What is the difference between executeQuery and executeUpdate?**
`executeQuery` runs a `SELECT` and returns a `ResultSet`. `executeUpdate` runs `INSERT`, `UPDATE`, `DELETE` or DDL and returns the number of affected rows, which is 0 for DDL.

**How does PreparedStatement prevent SQL injection?**
The SQL is sent with placeholders first, and the values are sent separately as data. The database never parses a value as SQL, so quotes or keywords inside it stay harmless text.

**How do you run a transaction in JDBC?**
Call `setAutoCommit(false)` on the connection, run the statements, then call `commit()`. If any step throws, call `rollback()` to undo every change made since the last commit.

**Why is Class.forName no longer needed to load a driver?**
Since JDBC 4.0 in Java 6, drivers list themselves in a service file inside their jar. `DriverManager` discovers them automatically when the jar is on the classpath.

## Summary

- JDBC is the standard `java.sql` API, and a vendor driver makes it work for each database.
- The flow is `DriverManager`, then `Connection`, then a statement, then a `ResultSet`.
- `executeQuery` returns rows; `executeUpdate` returns a count of changed rows.
- `PreparedStatement` sends values separately, which blocks SQL injection and allows reuse.
- Try-with-resources closes result sets, statements and connections safely.
- A transaction uses `setAutoCommit(false)`, `commit()` and `rollback()` to keep changes all or nothing.

## Related Topics

- [PreparedStatement](/learning/java-tutorial/preparedstatement): parameters, batching and reuse in detail.
- [ResultSet](/learning/java-tutorial/resultset): moving through rows and reading columns.
- [Transactions](/learning/java-tutorial/transactions): commit, rollback and isolation levels.
- [Database Connection](/learning/java-tutorial/database-connection): URLs, drivers and connection settings.
