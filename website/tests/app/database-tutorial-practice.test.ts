import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TopicPractice } from "@/app/learning/[gridSlug]/[topicSlug]/_components/TopicPractice";

const reads = vi.hoisted(() => ({ practice: vi.fn() }));
vi.mock("@/lib/learning", () => ({ getTopicPractice: reads.practice }));

const tests = [1, 2].map((n) => ({
  id: `test-${n}`, title: `MCQ Test ${n}`, description: "Practice with explanations after submission.",
  category: "aptitude", question_count: 10, duration_minutes: 10, difficulty: "Medium",
  total_marks: 10, negative_marking: 0, is_premium: false,
}));

describe("inline DBMS/SQL topic practice", () => {
  it("renders each test with its own unopened controls and no preloaded answers", async () => {
    reads.practice.mockResolvedValue({ mock_tests: tests, coding_problems: [] });
    const html = renderToStaticMarkup(await TopicPractice({ gridSlug: "dbms-sql-tutorial", topicSlug: "primary-key" }));
    expect(html).toContain("MCQ Test 1");
    expect(html).toContain("MCQ Test 2");
    expect(html.match(/Open test here/g)).toHaveLength(2);
    expect(html).not.toContain("Correct answer");
    expect(html).not.toContain("Score:");
    expect(reads.practice).toHaveBeenLastCalledWith("dbms-sql-tutorial", "primary-key");
  });

  it("preserves dedicated test links for unrelated courses", async () => {
    reads.practice.mockResolvedValue({ mock_tests: tests.slice(0, 1), coding_problems: [] });
    const html = renderToStaticMarkup(await TopicPractice({ gridSlug: "java", topicSlug: "loops" }));
    expect(html).toContain('href="/mock-tests/test-1"');
    expect(html).not.toContain("Open test here");
  });

  it("does not add empty practice headings", async () => {
    reads.practice.mockResolvedValue({ mock_tests: [], coding_problems: [] });
    expect(await TopicPractice({ gridSlug: "dbms-sql-tutorial", topicSlug: "primary-key" })).toBeNull();
  });
});
