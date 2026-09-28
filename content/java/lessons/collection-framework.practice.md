Try each problem on your own first, then compare with the solution.

### Easy: Distinct Genres at the Returns Desk

Today's returned books had these genres: Poetry, Mystery, Poetry, History, Mystery, Travel. Print the distinct genres twice: once in the order they first appeared, and once in alphabetical order. Use the right `Set` class for each.

Expected output:

```text
First seen:
[Poetry, Mystery, History, Travel]
Sorted:
[History, Mystery, Poetry, Travel]
```

> **Hint:** A `LinkedHashSet` keeps insertion order. A `TreeSet` keeps its items sorted. Both drop duplicates for you.

**Answer:** Both classes implement `Set`, so both remove repeats. They differ only in the order they promise, which is exactly the choice the framework lets you make.

```java
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

public class GenreDesk {
    public static void main(String[] args) {
        List<String> returned = Arrays.asList("Poetry",
                "Mystery", "Poetry", "History",
                "Mystery", "Travel");

        Set<String> firstSeen = new LinkedHashSet<>(returned);
        Set<String> sorted = new TreeSet<>(returned);

        System.out.println("First seen:");
        System.out.println(firstSeen);
        System.out.println("Sorted:");
        System.out.println(sorted);
    }
}
```

**Output:**

```text
First seen:
[Poetry, Mystery, History, Travel]
Sorted:
[History, Mystery, Poetry, Travel]
```

### Medium: Books Grouped by Author

The catalogue has these entries, each written as `author:title`: Tagore:Gora, Premchand:Godaan, Tagore:Chokher Bali, Narayan:Swami, Premchand:Nirmala. Build a `Map` from each author to a `List` of their titles. Print the authors in alphabetical order, each with their titles in catalogue order.

Expected output:

```text
Narayan -> [Swami]
Premchand -> [Godaan, Nirmala]
Tagore -> [Gora, Chokher Bali]
```

> **Hint:** Use a `TreeMap<String, List<String>>` so the authors stay sorted, and `computeIfAbsent(author, k -> new ArrayList<>())` to get or create each author's list.

**Answer:** The map gives fast lookup by author, and each value is a list because one author has many titles in a fixed order. Combining collections like this is very common in real code.

```java
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

public class AuthorIndex {
    public static void main(String[] args) {
        String[] catalogue = {"Tagore:Gora", "Premchand:Godaan",
                "Tagore:Chokher Bali", "Narayan:Swami",
                "Premchand:Nirmala"};

        Map<String, List<String>> byAuthor = new TreeMap<>();
        for (String entry : catalogue) {
            String[] parts = entry.split(":");
            byAuthor.computeIfAbsent(parts[0],
                    k -> new ArrayList<>()).add(parts[1]);
        }

        for (Map.Entry<String, List<String>> e
                : byAuthor.entrySet()) {
            System.out.println(e.getKey() + " -> "
                    + e.getValue());
        }
    }
}
```

**Output:**

```text
Narayan -> [Swami]
Premchand -> [Godaan, Nirmala]
Tagore -> [Gora, Chokher Bali]
```
