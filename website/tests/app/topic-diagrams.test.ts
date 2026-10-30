import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TopicDiagrams, topicDiagrams } from "@/components/learning/TopicDiagrams";

describe("semantic structural illustrations", () => {
  it("renders identifying ER notation and rejects missing or overlong labels", () => {
    const er = { kind: "weak-entity-er", caption: "Building and Room", description: "Every room belongs to exactly one building. Buildings may have no rooms.", owner: "Building", ownerKey: "building_id", relationship: "Contains", dependent: "Room", partialKey: "room_number" };
    expect(topicDiagrams({ dbms_diagrams_v1: [{ ...er, partialKey: "" }, { ...er, owner: "x".repeat(33) }] })).toEqual([]);
    const html = renderToStaticMarkup(createElement(TopicDiagrams, { metadata: { dbms_diagrams_v1: [er] } }));
    expect(html).toContain('role="img"');
    expect(html).toContain("<desc>");
    expect(html.match(/<rect /g)).toHaveLength(3);
    expect(html).toContain('stroke-dasharray="5 4"');
    expect(html).toContain('M543 171 H650 M543 179 H650');
    expect(html).toContain('Dependent: exactly 1 owner');
    expect(html).toContain('Owner: 0..N dependents');
    const escaped = renderToStaticMarkup(createElement(TopicDiagrams, { metadata: { dbms_diagrams_v1: [{ ...er, owner: "<script>x</script>" }] } }));
    expect(escaped).not.toContain("<script>");
    expect(escaped).toContain("&lt;script&gt;");
  });
  it("rejects unsupported shapes without interpreting metadata as markup", () => {
    expect(topicDiagrams({ dbms_diagrams_v1: [{ kind: "html", caption: "bad" }, { kind: "table", caption: "bad", description: "bad", columns: ["a"], rows: [["a", "b"]] }] })).toEqual([]);
  });

  it("provides a caption, row/column headers, text explanation and a keyboard-scroll region", () => {
    const html = renderToStaticMarkup(createElement(TopicDiagrams, { metadata: { dbms_diagrams_v1: [{ kind: "table", caption: "Enrollment references", description: "Each enrollment links one student and one course.", columns: ["Relation", "Key"], rows: [["enrollments", "student_id, course_id"]] }] } }));
    expect(html).toContain("<figcaption");
    expect(html).toContain("<caption");
    expect(html).toContain('scope="row"');
    expect(html).toContain('scope="col"');
    expect(html).toContain('role="region"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain("overflow-x-auto");
  });

  it("escapes authored text rather than executing it", () => {
    const html = renderToStaticMarkup(createElement(TopicDiagrams, { metadata: { dbms_diagrams_v1: [{ kind: "table", caption: "<script>label</script>", description: "Explanation", columns: ["Column"], rows: [["<img src=x>"]] }] } }));
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x>");
    expect(html).toContain("&lt;script&gt;");
  });
});
