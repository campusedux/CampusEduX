import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { InlineCodingProblem } from "@/app/learning/[gridSlug]/[topicSlug]/_components/InlineCodingProblem";
import type { CodingProblemDetail } from "@/lib/learning.types";

const reads = vi.hoisted(() => ({ problem: vi.fn() }));
vi.mock("@/lib/learning", () => ({ getCodingProblem: reads.problem }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const card = { id: "p", slug: "catalog", title: "Read a Product Catalog", difficulty: "Easy", supported_languages: ["sql"], is_premium: false };
const detail: CodingProblemDetail = {
  problem: { ...card, description: "Return product_id in ascending order.", examples: [{ input: "INSERT INTO products VALUES (2), (1);", output: "product_id\n1\n2" }],
    constraints: ["product_id is unique"], hints: ["Use ORDER BY product_id"], starter_code: { sql: "" }, time_complexity: "", space_complexity: "" },
  topic: { grid_slug: "dbms-sql-tutorial", topic_slug: "select", title: "SELECT" }, locked: false,
  editorial: "Review the required column and ordering.", solution_code: {}, solution_locked: true, solution_approach: "",
};
const props = { card, gridSlug: "dbms-sql-tutorial", topicSlug: "select" };
beforeEach(() => { reads.problem.mockResolvedValue(detail); });

describe("inline exercise reuses the existing problem UI and access contract", () => {
  it("server-renders statement, expected output, constraints, hints and a link to the real editor", async () => {
    const html = renderToStaticMarkup(await InlineCodingProblem(props));
    expect(html).toContain("Return product_id in ascending order.");
    expect(html).toContain("product_id\n1\n2");
    expect(html).toContain("product_id is unique");
    expect(html).toContain("Use ORDER BY product_id");
    expect(html).toContain('href="/coding-problems/catalog"');
    expect(html).toContain("Open editor and run tests");
    expect(html).toContain("<h3");
    expect(html).not.toContain("<h1");
    expect(html).not.toContain("tests passed");
  });

  it("does not render withheld content even if a locked response unexpectedly contains it", async () => {
    reads.problem.mockResolvedValue({ ...detail, locked: true, problem: { ...detail.problem, description: "WITHHELD STATEMENT" }, editorial: "WITHHELD SOLUTION" });
    const html = renderToStaticMarkup(await InlineCodingProblem(props));
    expect(html).toContain("View access options");
    expect(html).not.toContain("WITHHELD");
    expect(html).not.toContain("Use ORDER BY");
  });

  it("preserves the existing attempt-dependent solution gate", async () => {
    const html = renderToStaticMarkup(await InlineCodingProblem(props));
    expect(html).toContain("Submit an attempt to unlock the solution");
  });

  it("does not embed content from another topic", async () => {
    reads.problem.mockResolvedValue({ ...detail, topic: { ...detail.topic, topic_slug: "other-topic" } });
    expect(await InlineCodingProblem(props)).toBeNull();
  });

  it("keeps a failed detail read separate from the topic notes and does not expose diagnostics", async () => {
    reads.problem.mockRejectedValue(new Error("private provider diagnostic"));
    const html = renderToStaticMarkup(await InlineCodingProblem(props));
    expect(html).toContain("could not be loaded here");
    expect(html).toContain('href="/coding-problems/catalog"');
    expect(html).not.toContain("private provider diagnostic");
  });
});
