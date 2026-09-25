import { getCourseIdentity } from "@/home/HomeLearningCard";

const g = (name: string, slug = "", icon: string | null = null, accent_color: string | null = null) => ({ name, slug, icon, accent_color });

describe("getCourseIdentity", () => {
  it("maps known courses by keyword", () => {
    expect(getCourseIdentity(g("DBMS & SQL")).colors).toEqual(["#2563EB", "#1E3A8A"]);
    expect(getCourseIdentity(g("DBMS & SQL")).icon).toBe("server-outline");
    expect(getCourseIdentity(g("Java Tutorials", "java-tutorials")).icon).toBe("cafe-outline");
    expect(getCourseIdentity(g("AI/ML Notes", "ai-ml-notes")).icon).toBe("hardware-chip-outline");
    expect(getCourseIdentity(g("Python Tutorial")).icon).toBe("logo-python");
  });
  it("does not treat JavaScript as Java", () => {
    expect(getCourseIdentity(g("JavaScript Basics")).icon).toBe("book-outline");
  });
  it("falls back to default for unknown courses", () => {
    const id = getCourseIdentity(g("Rust Handbook"));
    expect(id.icon).toBe("book-outline");
    expect(id.colors).toEqual(["#6366F1", "#4338CA"]);
  });
  it("prefers the course's own valid accent colour and emoji", () => {
    const id = getCourseIdentity(g("Java", "java", "☕", "#112233"));
    expect(id.colors[0]).toBe("#112233");
    expect(id.emoji).toBe("☕");
    expect(getCourseIdentity(g("Java", "java", null, "notacolor")).colors).toEqual(["#F97316", "#C2410C"]);
  });
});
